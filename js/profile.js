/* ============================================================
   RESQ — Profile Page Script
   Loads /users/me on page load; Edit Profile toggles the
   editable fields (name, phone, blood group, language, address)
   into inputs in place and saves via PUT /users/me.
   ============================================================ */

let currentProfile = null;
let editing = false;

function renderProfile(p) {
  currentProfile = p;
  const initials = p.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  document.getElementById("profileAvatar").textContent = initials;
  document.getElementById("profileName").textContent = p.name;
  document.getElementById("profileEmail").textContent = p.email;

  document.getElementById("pfName").textContent = p.name || "\u2014";
  document.getElementById("pfEmail").textContent = p.email;
  document.getElementById("pfPhone").textContent = p.phone || "\u2014";
  document.getElementById("pfBlood").textContent = p.blood_group || "\u2014";
  document.getElementById("pfLanguage").textContent = p.language || "\u2014";

  const contact = p.emergency_contact;
  document.getElementById("pfEmergencyContact").textContent =
    contact && contact.name ? `${contact.name} \u00b7 ${contact.phone}` : "Not set";

  document.getElementById("pfAddress").textContent = p.address || "\u2014";

  const statusEl = document.getElementById("pfStatus");
  statusEl.innerHTML = p.is_verified
    ? '<span class="badge badge-success">Verified</span>'
    : '<span class="badge badge-warning">Unverified</span>';
}

function enterEditMode() {
  editing = true;
  document.querySelectorAll(".pf-value[data-field]").forEach((el) => {
    const field = el.dataset.field;
    const value = currentProfile[field] || "";
    el.dataset.originalText = el.textContent;
    el.innerHTML = `<input type="text" value="${value.replace(/"/g, "&quot;")}" style="font:inherit; color:inherit; border:1px solid var(--color-border); border-radius:6px; padding:4px 8px; width:100%;" />`;
  });

  const btn = document.getElementById("editProfileBtn");
  btn.innerHTML = `${icon("check", 16)} Save Changes`;
}

async function saveEdits() {
  const updates = {};
  document.querySelectorAll(".pf-value[data-field]").forEach((el) => {
    const field = el.dataset.field;
    const input = el.querySelector("input");
    if (input) updates[field] = input.value.trim();
  });

  const btn = document.getElementById("editProfileBtn");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-inline"></span>Saving&hellip;`;

  try {
    const res = await api.updateProfile(updates);
    renderProfile(res.data);
    api.showToast("Profile updated.", "success");
    editing = false;
    btn.innerHTML = `${icon("edit", 16)} Edit Profile`;
  } catch (err) {
    api.showToast(err.message || "Couldn't save your changes.", "error");
    btn.innerHTML = originalHtml;
  } finally {
    btn.disabled = false;
  }
}

function renderContacts(contacts) {
  const list = document.getElementById("contactsList");
  if (!contacts.length) {
    list.innerHTML = `<p style="color:var(--color-text-secondary); font-size:0.85rem;">No emergency contacts added yet.</p>`;
    return;
  }
  list.innerHTML = contacts
    .map(
      (c) => `
    <div class="contact-row" data-id="${c.id}">
      <div class="contact-info">
        <strong>${c.name}${c.relation ? ` · ${c.relation}` : ""}</strong>
        <span>${c.phone}${c.email ? ` · ${c.email}` : " · no email on file"}</span>
      </div>
      <button type="button" class="btn-remove-contact" data-id="${c.id}">Remove</button>
    </div>`
    )
    .join("");

  list.querySelectorAll(".btn-remove-contact").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await api.deleteEmergencyContact(btn.dataset.id);
        await loadContacts();
        api.showToast("Contact removed.", "success");
      } catch (err) {
        api.showToast(err.message || "Couldn't remove contact.", "error");
        btn.disabled = false;
      }
    });
  });
}

async function loadContacts() {
  try {
    const res = await api.getEmergencyContacts();
    renderContacts(res.data);
  } catch (err) {
    api.showToast(err.message || "Couldn't load emergency contacts.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initAppShell("profile", "Profile");

  document.getElementById("editIcon").innerHTML = icon("edit", 16);

  try {
    const res = await api.getProfile();
    renderProfile(res.data);
  } catch (err) {
    api.showToast(err.message || "Couldn't load your profile.", "error");
  }

  loadContacts();

  document.getElementById("addContactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const relation = document.getElementById("contactRelation").value.trim();
    if (!name || !phone) {
      api.showToast("Name and phone are required.", "error");
      return;
    }

    const form = e.target;
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    try {
      const res = await api.addEmergencyContact({ name, phone, email, relation });
      console.log("Contact added:", res);
      form.reset();
      await loadContacts();
      api.showToast("Emergency contact added.", "success");
    } catch (err) {
      console.error("Add contact failed:", err);
      api.showToast(err.message || "Couldn't add contact.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  document.getElementById("editProfileBtn").addEventListener("click", () => {
    if (!currentProfile) return;
    if (!editing) {
      enterEditMode();
    } else {
      saveEdits();
    }
  });
});
