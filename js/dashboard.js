/* ============================================================
   RESQ — Dashboard Page Script
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initAppShell("dashboard", "Dashboard");

  document.getElementById("icon-ask-ai").innerHTML = icon("chat", 16);
  document.getElementById("icon-weather-stat").innerHTML = icon("cloud", 22);
  document.getElementById("icon-risk-stat").innerHTML = icon("alertTriangle", 22);
  document.getElementById("icon-shelter-stat").innerHTML = icon("tent", 22);
  document.getElementById("icon-services-stat").innerHTML = icon("hospital", 22);

  document.getElementById("pin1").innerHTML = icon("mapPin", 30);
  document.getElementById("pin2").innerHTML = icon("mapPin", 30);
  document.getElementById("pin3").innerHTML = icon("mapPin", 30);

  document.getElementById("qa-upload").innerHTML = icon("camera", 24);
  document.getElementById("qa-chat").innerHTML = icon("chat", 24);
  document.getElementById("qa-weather").innerHTML = icon("cloud", 24);
  document.getElementById("qa-shelter").innerHTML = icon("mapPin", 24);
  document.getElementById("qa-guide").innerHTML = icon("book", 24);
  document.getElementById("qa-services").innerHTML = icon("hospital", 24);

  document.getElementById("alert-icon-1").innerHTML = icon("cloud", 18);
  document.getElementById("alert-icon-2").innerHTML = icon("droplet", 18);
  document.getElementById("alert-icon-3").innerHTML = icon("flame", 18);
});
