/* ============================================================
   RESQ — Profile Page Script
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initAppShell("profile", "Profile");

  document.getElementById("editIcon").innerHTML = icon("edit", 16);

  document.getElementById("editProfileBtn").addEventListener("click", () => {
    // Frontend-only demo: editing will POST to the profile API once connected.
    alert("Edit Profile is a UI preview — connect the backend to enable saving changes.");
  });
});
