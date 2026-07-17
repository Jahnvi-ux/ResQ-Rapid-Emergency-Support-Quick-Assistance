/* ============================================================
   RESQ — Weather Page Script
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initAppShell("weather", "Weather");

  document.getElementById("refreshIcon").innerHTML = icon("refresh", 16);
  document.getElementById("alertBannerIcon").innerHTML = icon("alertTriangle", 26);
  document.getElementById("heroWeatherIcon").innerHTML = icon("cloud", 48);

  document.getElementById("icon-temp").innerHTML = icon("sun", 26);
  document.getElementById("icon-humidity").innerHTML = icon("droplet", 26);
  document.getElementById("icon-wind").innerHTML = icon("wind", 26);
  document.getElementById("icon-rain").innerHTML = icon("cloud", 26);

  document.querySelectorAll(".fd-icon[data-icon]").forEach((el) => {
    el.innerHTML = icon(el.dataset.icon, 22);
  });

  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn.addEventListener("click", () => {
    refreshBtn.disabled = true;
    const iconEl = document.getElementById("refreshIcon");
    iconEl.style.transition = "transform 600ms ease";
    iconEl.style.transform = "rotate(360deg)";
    setTimeout(() => {
      iconEl.style.transform = "rotate(0deg)";
      refreshBtn.disabled = false;
    }, 650);
  });
});
