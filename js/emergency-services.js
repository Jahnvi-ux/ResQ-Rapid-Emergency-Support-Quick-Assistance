/* ============================================================
   RESQ — Emergency Services Page Script
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initAppShell("services", "Emergency Services");

  ["svcPinA", "svcPinB", "svcPinC"].forEach((id) => {
    document.getElementById(id).innerHTML = icon("mapPin", 30);
  });

  document.getElementById("svc-icon-1").innerHTML = icon("hospital", 22);
  document.getElementById("svc-icon-2").innerHTML = icon("badge", 22);
  document.getElementById("svc-icon-3").innerHTML = icon("flame", 22);
  document.getElementById("svc-icon-4").innerHTML = icon("tent", 22);

  document.querySelectorAll("[data-call-icon]").forEach((btn) => {
    btn.innerHTML = icon("phone", 18);
  });
  document.querySelectorAll("[data-nav-icon]").forEach((btn) => {
    btn.innerHTML = icon("navigation", 18);
  });
});
