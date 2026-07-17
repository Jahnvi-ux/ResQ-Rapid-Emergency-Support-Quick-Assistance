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
        <span class="text-secondary">ResQ v1.0 &middot; Frontend Preview</span>
      </div>
    </aside>`;
}

function buildNavbar(pageTitle) {
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
        <button class="icon-btn" aria-label="Notifications">
          ${icon("bell", 20)}
          <span class="notif-dot" aria-hidden="true"></span>
        </button>
        <a href="profile.html" class="avatar" aria-label="Your profile">RS</a>
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
        <button class="sos-action" type="button">${icon("phone", 20)}Call Emergency (112)</button>
        <button class="sos-action" type="button">${icon("location", 20)}Share My Live Location</button>
        <button class="sos-action" type="button">${icon("bell", 20)}Notify Emergency Contacts</button>
        <button class="sos-action" type="button">${icon("tent", 20)}Find Nearest Shelter</button>
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

document.addEventListener("DOMContentLoaded", () => {
  initRipple();
  initSkeletons();
});
