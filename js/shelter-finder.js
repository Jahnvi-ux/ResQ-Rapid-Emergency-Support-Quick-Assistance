/* ============================================================
   RESQ — Shelter Finder Page Script
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initAppShell("shelter", "Shelter Finder");

  document.getElementById("locIcon").innerHTML = icon("location", 16);
  document.getElementById("searchIcon").innerHTML = icon("search", 16);

  ["pinA", "pinB", "pinC"].forEach((id) => {
    document.getElementById(id).innerHTML = icon("mapPin", 30);
  });

  for (let i = 1; i <= 4; i++) {
    document.getElementById(`shelter-icon-${i}`).innerHTML = icon("tent", 22);
  }

  document.querySelectorAll("[data-nav-icon]").forEach((btn) => {
    btn.innerHTML = icon("navigation", 18);
  });
});
