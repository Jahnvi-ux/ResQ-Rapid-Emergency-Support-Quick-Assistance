/* ============================================================
   RESQ — Auth Guard
   Include this BEFORE common.js on every page inside the app
   shell (dashboard, chatbot, weather, etc). Redirects to login
   if there's no refresh token on hand.
   ============================================================ */
(function () {
  const isLoggedIn = !!localStorage.getItem("resq_refresh_token");
  if (!isLoggedIn) {
    window.location.href = "login.html";
  }
})();
