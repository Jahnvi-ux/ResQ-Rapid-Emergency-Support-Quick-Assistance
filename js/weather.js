/* ============================================================
   RESQ — Weather Page Script
   Live current-conditions widget via our own backend's
   /weather/current endpoint (which wraps OpenWeatherMap
   server-side — the API key never reaches the browser), using
   the shared getCurrentLocation() helper from common.js.
   Forecast and alert banner remain illustrative/static for now.
   ============================================================ */

async function loadWeather(lat, lon){
    const res = await api.getCurrentWeather(lat, lon);
    const data = res.data;
    document.getElementById("cityName").textContent =
        data.location;
    document.getElementById("mainTemp").textContent =
        Math.round(data.temperature_c) + "°C";
    document.getElementById("temperature").textContent =
        Math.round(data.temperature_c) + "°C";
    document.getElementById("humidity").textContent =
        data.humidity_pct + "%";
    document.getElementById("wind").textContent =
        data.wind_kmh + " km/h";
    document.getElementById("rain").textContent =
        data.rainfall_chance_pct + "%";
    document.getElementById("weatherDescription").innerText =
`${data.condition} • Feels like ${Math.round(data.feels_like_c)}°C`;
}

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
  getCurrentLocation(function(location){
    loadWeather(
        location.latitude,
        location.longitude
    );
});
  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn.addEventListener("click", () => {
    getCurrentLocation(function(location){
    loadWeather(location.latitude, location.longitude);
});
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