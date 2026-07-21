/* ============================================================
   RESQ — Common Shell & Global Interactions
   Injects the sidebar, navbar, and SOS system into any page that
   marks itself with data-shell="app". Also wires up ripple buttons,
   mobile nav, and the "More" submenu. Kept separate from
   page-specific scripts so each page only loads what it needs.
   ============================================================ */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "home" },
  { key: "chatbot", label: "Chatbot", href: "chatbot.html", icon: "chat" },
  { key: "weather", label: "Weather", href: "weather.html", icon: "cloud" },
  { key: "shelter", label: "Shelter Finder", href: "shelter-finder.html", icon: "mapPin" },
  { key: "services", label: "Emergency Services", href: "emergency-services.html", icon: "hospital" },
  { key: "upload", label: "Upload Image", href: "upload-image.html", icon: "camera" },
  { key: "guide", label: "Emergency Guide", href: "emergency-guide.html", icon: "book" },
  { key: "profile", label: "Profile", href: "profile.html", icon: "user" },
];

const MORE_ITEMS = [
  { key: "settings", label: "Settings", href: "profile.html", icon: "settings" },
  { key: "about", label: "About", href: "index.html#about", icon: "info" },
  { key: "logout", label: "Log Out", href: "index.html", icon: "logout" },
];

function buildSidebar(activeKey) {
  const links = NAV_ITEMS.map(
    (item) => `
      <a href="${item.href}" data-nav="${item.key}" class="${item.key === activeKey ? "active" : ""}">
        ${icon(item.icon, 19)}<span>${item.label}</span>
      </a>`
  ).join("");

  const moreLinks = MORE_ITEMS.map(
    (item) => `
      <a href="${item.href}" data-nav="${item.key}">
        ${icon(item.icon, 18)}<span>${item.label}</span>
      </a>`
  ).join("");

  return `
    <aside class="sidebar" id="sidebar" aria-label="Primary">
      <div class="sidebar-brand">
        <span class="brand-mark">${icon("shieldCheck", 26)}</span>
        <span class="brand-word">ResQ</span>
      </div>
      <nav class="sidebar-nav" aria-label="Main navigation">
        ${links}
        <div class="sidebar-more">
          <a href="#" id="moreToggle" role="button" aria-expanded="false">
            ${icon("more", 19)}<span>More</span>
          </a>
          <div class="sidebar-more-panel" id="morePanel">
            ${moreLinks}
          </div>
        </div>
      </nav>
      <div class="sidebar-footer">
  <span class="text-secondary">ResQ v1.0 &middot;</span>
  <span class="text-secondary" style="display:block; margin-top:4px; font-size:0.75rem;">&copy; 2026 ResQ. All rights reserved. 🎀</span>
</div>
    </aside>`;
}

function buildNavbar(pageTitle) {
  const user = (typeof tokenStore !== "undefined" && tokenStore.getUser()) || null;
  const initials = user && user.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "RS";

  return `
    <header class="navbar">
      <button class="icon-btn navbar-menu-toggle" id="mobileMenuToggle" aria-label="Open menu">
        ${icon("menu", 22)}
      </button>
      <div class="navbar-search" role="search">
        ${icon("search", 18)}
        <input type="search" placeholder="Search shelters, guides, alerts&hellip;" aria-label="Search ResQ" />
      </div>
      <div class="navbar-right">
        <button class="icon-btn" aria-label="Notifications" id="notifBtn">
          ${icon("bell", 20)}
          <span class="notif-dot" aria-hidden="true" id="notifDot" style="display:none;"></span>
        </button>
        <a href="profile.html" class="avatar" aria-label="Your profile">${initials}</a>
      </div>
    </header>`;
}

function buildSOS() {
  return `
    <button class="sos-fab" id="sosFab" aria-haspopup="dialog" aria-controls="sosModal">
      ${icon("cross", 22)}<span>SOS</span>
    </button>
    <div class="modal-overlay" id="sosModal" role="dialog" aria-modal="true" aria-labelledby="sosTitle">
      <div class="modal">
        <button class="modal-close" id="sosClose" aria-label="Close">${icon("close", 18)}</button>
        <span class="badge badge-danger"><span class="badge-dot"></span>Emergency</span>
        <h3 id="sosTitle" class="mt-2">Need immediate help?</h3>
        <p class="mt-2">Choose an action below. This connects to live emergency services once ResQ is fully deployed.</p>
        <button class="sos-action" type="button" data-sos-action="call">${icon("phone", 20)}Call Emergency (112)</button>
        <button class="sos-action" type="button" data-sos-action="share_location">${icon("location", 20)}Share My Live Location</button>
        <button class="sos-action" type="button" data-sos-action="notify_contacts">${icon("bell", 20)}Notify Emergency Contacts</button>
        <button class="sos-action" type="button" data-sos-action="find_shelter">${icon("tent", 20)}Find Nearest Shelter</button>
      </div>
    </div>`;
}

/** Injects the sidebar/navbar/SOS shell into slots present on the page. */
function initAppShell(activeKey, pageTitle) {
  const shellRoot = document.getElementById("appShell");
  if (!shellRoot) return;

  const sidebarSlot = document.getElementById("sidebarSlot");
  const navbarSlot = document.getElementById("navbarSlot");
  if (sidebarSlot) sidebarSlot.outerHTML = buildSidebar(activeKey);
  if (navbarSlot) navbarSlot.outerHTML = buildNavbar(pageTitle);

  document.body.insertAdjacentHTML("beforeend", buildSOS());

  wireSOS();
  wireMobileSidebar();
  wireMoreToggle();
  wireNotifications();
}

async function wireNotifications() {
  const dot = document.getElementById("notifDot");
  if (!dot) return;
  try {
    const res = await api.getNotifications(true);
    if (res.data && res.data.length > 0) dot.style.display = "block";
  } catch {
    // Silent — notification badge is non-critical UI.
  }
}

/** Resolves { lat, lng } via browser geolocation, falling back to Jaipur. */
function getUserLocation() {
  const fallback = { lat: 26.9124, lng: 75.7873 };
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(fallback);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(fallback),
      { timeout: 4000 }
    );
  });
}

/**
 * Callback-style geolocation helper used by pages with live map/weather
 * widgets (dashboard, weather, shelter finder). Returns { latitude, longitude }
 * to match the browser Geolocation API's own property names. Falls back to
 * Jaipur if permission is denied or geolocation isn't available, so map/weather
 * widgets always have coordinates to render instead of failing silently.
 */
function getCurrentLocation(callback, errorCallback) {
  const fallback = { latitude: 26.9124, longitude: 75.7873 };
  if (!navigator.geolocation) {
    callback(fallback);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => callback({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    () => {
      if (errorCallback) errorCallback();
      else callback(fallback);
    },
    { timeout: 4000 }
  );
}

function wireSOS() {
  const fab = document.getElementById("sosFab");
  const modal = document.getElementById("sosModal");
  const close = document.getElementById("sosClose");
  if (!fab || !modal) return;

  const open = () => {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    close.focus();
  };
  const shut = () => {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    fab.focus();
  };

  fab.addEventListener("click", open);
  close.addEventListener("click", shut);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) shut();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) shut();
  });

  modal.querySelectorAll("[data-sos-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.sosAction;
      btn.disabled = true;
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-inline"></span>Working&hellip;`;
      try {
        const { lat, lng } = await getUserLocation();
        const result = await api.triggerSOS(action, lat, lng);
        if (action === "find_shelter" && result.data && result.data.nearest_shelter) {
          api.showToast(`Nearest shelter: ${result.data.nearest_shelter.name} (${result.data.nearest_shelter.distance_km} km)`, "success");
        } else if (action === "notify_contacts" || action === "share_location") {
          const sent = result.data.emails_sent || 0;
          const total = result.data.contacts_notified || 0;
          if (total === 0) {
            api.showToast("No emergency contacts saved yet. Add one in Profile.", "error");
          } else if (sent > 0) {
            api.showToast(`Notified ${sent} of ${total} emergency contact(s).`, "success");
          } else {
            api.showToast(`Saved contacts have no email on file — add one in Profile.`, "error");
          }
        } else if (action === "call") {
          api.showToast(`Emergency number: ${result.data.emergency_number}`, "info");
        } else {
          api.showToast("Location logged.", "success");
        }
      } catch (err) {
        api.showToast(err.message || "Couldn't complete that action. Try again.", "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
      }
    });
  });
}

function wireMobileSidebar() {
  const toggle = document.getElementById("mobileMenuToggle");
  const shell = document.getElementById("appShell");
  if (!toggle || !shell) return;
  toggle.addEventListener("click", () => {
    shell.classList.toggle("sidebar-open");
  });
}

function wireMoreToggle() {
  const trigger = document.getElementById("moreToggle");
  const panel = document.getElementById("morePanel");
  if (!trigger || !panel) return;
  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = panel.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  const logoutLink = panel.querySelector('[data-nav="logout"]');
  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      await api.logout();
      tokenStore.clear();
      window.location.href = "index.html";
    });
  }
}

/** Adds a lightweight ripple to any .btn on click (progressive enhancement). */
function initRipple() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    const circle = document.createElement("span");
    const size = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();
    circle.className = "ripple";
    circle.style.width = circle.style.height = `${size}px`;
    circle.style.left = `${e.clientX - rect.left - size / 2}px`;
    circle.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 550);
  });
}

/** Removes .skeleton loading placeholders after a short simulated delay. */
function initSkeletons(delay = 700) {
  const skeletons = document.querySelectorAll("[data-skeleton]");
  if (!skeletons.length) return;
  setTimeout(() => {
    skeletons.forEach((el) => {
      el.classList.remove("skeleton");
      el.removeAttribute("data-skeleton");
    });
  }, delay);
}

/** Animates a numeric counter from 0 to its data-target value. */
function animateCounters(selector = ".counter-num[data-target]") {
  const counters = document.querySelectorAll(selector);
  if (!counters.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || "";
        const duration = 1200;
        const start = performance.now();
        function step(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(target * eased);
          el.textContent = value + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => observer.observe(c));
}

/**
 * Queries the Overpass API (OpenStreetMap data) with automatic fallback
 * across several public mirrors. The default overpass-api.de instance is
 * free/shared and frequently returns 504 Gateway Timeout under load —
 * trying alternates before giving up avoids that being a hard failure.
 * Returns the parsed JSON response, or throws if every mirror fails.
 */
async function fetchOverpass(query) {
  const mirrors = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
  ];

  let lastError;
  for (const base of mirrors) {
    try {
      const response = await fetch(base + "?data=" + encodeURIComponent(query));
      if (!response.ok) {
        lastError = new Error(`Overpass mirror responded with ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All Overpass mirrors failed");
}

/**
 * Runs an Overpass QL query against the public Overpass API, trying
 * several mirror servers in sequence with a per-request timeout.
 * The main overpass-api.de instance is free/shared and frequently
 * returns 504 Gateway Timeout under load, so this transparently
 * falls back to alternate mirrors instead of failing on the first one.
 * Returns the parsed JSON, or throws if every mirror fails.
 */
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

async function fetchOverpass(query, timeoutMs = 12000) {
  let lastError;
  for (const base of OVERPASS_MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(base + "?data=" + encodeURIComponent(query), {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        lastError = new Error(`Overpass mirror ${base} returned ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      // Try the next mirror.
    }
  }
  throw lastError || new Error("All Overpass mirrors failed");
}

document.addEventListener("DOMContentLoaded", () => {
  initRipple();
  initSkeletons();
});
