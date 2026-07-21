/* ============================================================
   RESQ — Emergency Guide (Preparedness Center) Script
   Category step content is loaded from /guides (guide_service,
   seeded with Before/During/After data in MongoDB) and merged
   into the local CATEGORIES scaffold below. Checklist state is
   synced with /users/me/checklist so progress persists across
   visits. Videos/tips/infographics remain local UI content —
   there's no backend-owned data for those yet.
   ============================================================ */

const CATEGORIES = [
  {
    key: "flood",
    label: "Flood",
    icon: "droplet",
    steps: [
      { title: "Know your flood risk", desc: "Check whether your home is in a flood-prone zone and identify the fastest route to higher ground." },
      { title: "Prepare an emergency kit", desc: "Pack water, non-perishable food, torch, power bank, medicines, and important documents in a waterproof bag." },
      { title: "Move to higher ground", desc: "As water rises, move immediately to an upper floor or higher elevation. Avoid walking through moving water." },
      { title: "Avoid electrical hazards", desc: "Switch off mains power if it's safe to do so. Never touch electrical equipment while standing in water." },
    ],
  },
  {
    key: "fire",
    label: "Fire",
    icon: "flame",
    steps: [
      { title: "Plan two exit routes", desc: "Identify at least two ways out of every room and agree on a family meeting point outside." },
      { title: "Get low, stay low", desc: "Smoke rises — crawl below it to breathe cleaner air and see the exit path more clearly." },
      { title: "Check doors before opening", desc: "Feel the door and handle. If either is hot, use your alternate exit instead." },
      { title: "Call for help outside", desc: "Once safely out, call emergency services and never re-enter the building for belongings." },
    ],
  },
  {
    key: "earthquake",
    label: "Earthquake",
    icon: "activity",
    steps: [
      { title: "Drop, Cover, Hold On", desc: "Drop to the ground, take cover under sturdy furniture, and hold on until the shaking stops." },
      { title: "Stay away from glass", desc: "Move away from windows, mirrors, and tall furniture that could topple or shatter." },
      { title: "Check for hazards after", desc: "Once shaking stops, check for gas leaks, damaged wiring, and structural cracks before moving freely." },
      { title: "Expect aftershocks", desc: "Stay alert for aftershocks and keep your emergency kit accessible for at least 24 hours." },
    ],
  },
  {
    key: "cyclone",
    label: "Cyclone",
    icon: "wind",
    steps: [
      { title: "Track the warning level", desc: "Monitor official cyclone bulletins and note the expected landfall time and intensity." },
      { title: "Secure loose objects", desc: "Bring in or tie down anything outdoors that could become airborne in high winds." },
      { title: "Stay indoors, away from windows", desc: "Shelter in the most interior, wind-protected room of your home during peak winds." },
      { title: "Watch for flooding after", desc: "Cyclones often bring heavy rain — stay alert for flash flooding even after winds calm." },
    ],
  },
  {
    key: "heatwave",
    label: "Heatwave",
    icon: "sun",
    steps: [
      { title: "Limit midday exposure", desc: "Avoid outdoor activity between 12 PM and 4 PM when temperatures peak." },
      { title: "Stay hydrated", desc: "Drink water regularly even if you don't feel thirsty, and avoid alcohol or caffeine." },
      { title: "Recognize heat exhaustion", desc: "Watch for heavy sweating, dizziness, or nausea — move to a cool place and rehydrate immediately." },
      { title: "Check on vulnerable people", desc: "Elderly neighbors, children, and outdoor workers are at higher risk — check in on them daily." },
    ],
  },
  {
    key: "landslide",
    label: "Landslide",
    icon: "mountain",
    steps: [
      { title: "Watch for warning signs", desc: "New cracks in ground or walls, tilting trees, and unusual sounds can signal an impending landslide." },
      { title: "Evacuate steep slopes early", desc: "If heavy rain persists in a hillside area, move to safer, flatter ground before conditions worsen." },
      { title: "Move away from the path", desc: "If a slide begins, move sideways away from its path rather than trying to outrun it downhill." },
      { title: "Report blocked roads", desc: "After a slide, avoid the area and report blocked or damaged roads to local authorities." },
    ],
  },
  {
    key: "firstaid",
    label: "First Aid",
    icon: "heart",
    steps: [
      { title: "Check responsiveness", desc: "Gently tap and ask loudly if the person is okay. Check for normal breathing before acting further." },
      { title: "Control bleeding", desc: "Apply firm, direct pressure to the wound with a clean cloth until bleeding slows or stops." },
      { title: "Treat for shock", desc: "Keep the person warm and lying down with legs slightly raised, unless a head or spine injury is suspected." },
      { title: "Call for medical help", desc: "Contact emergency services for anything beyond minor injuries and stay with the person until help arrives." },
    ],
  },
];

const TIMELINE_STAGES = [
  {
    key: "before",
    title: "Before Disaster",
    icon: "book",
    detail: "Build your emergency kit, learn your evacuation routes, save emergency contacts, and stay subscribed to local alerts.",
  },
  {
    key: "during",
    title: "During Disaster",
    icon: "alertTriangle",
    detail: "Follow official instructions, move to safety immediately, avoid hazardous areas, and keep your phone charged for updates.",
  },
  {
    key: "after",
    title: "After Disaster",
    icon: "check",
    detail: "Check yourself and others for injuries, avoid damaged structures and downed lines, and wait for an official all-clear before returning home.",
  },
];

const VIDEOS = [
  { title: "Flood Evacuation Walkthrough", duration: "4:07",  url: "https://www.youtube.com/watch?v=43M5mZuzHF8&t=19s" },
  { title: "Fire Evacuation Drill", duration: "1:00",  url: "https://www.youtube.com/watch?v=C9KSFRq4rXA&t=10s" },
  { title: "Earthquake Drop-Cover-Hold Drill", duration: "1:14",  url: "https://www.youtube.com/watch?v=aV89_yUJunM" },
  { title: "CPR Demonstration", duration: "0:23",  url: "https://www.youtube.com/shorts/_F4Of33ifbw" },
  { title: "Basic First Aid Essentials", duration: "2:15",  url: "https://www.youtube.com/watch?v=7ldJ5Ke8tU8" },
  { title: "Packing an Emergency Kit", duration: "2:18",  url: "https://www.youtube.com/watch?v=7_diceQvTqE" },

];

const CHECKLIST = [
  "Water stored (3 days minimum)",
  "Flashlight available and tested",
  "First aid kit packed",
  "Emergency contacts saved",
  "Important documents secured",
  "Power bank charged",
  "Medicines packed",
];

const TIPS = [
  { title: "Flood Tip", body: "Never drive through flooded roads — just 30cm of moving water can sweep a car away." },
  { title: "Fire Tip", body: "Test smoke alarms monthly and replace batteries at least once a year." },
  { title: "Earthquake Tip", body: "Secure heavy furniture to walls to prevent tipping during strong shaking." },
  { title: "Heatwave Tip", body: "Light, loose, and light-colored clothing helps your body stay cooler in extreme heat." },
];

const INFOGRAPHICS = [
  {
    title: "Emergency Bag Essentials", icon: "upload", color: "emerald",
    points: ["3 litres of water per person, per day (3-day supply)", "Non-perishable food (3-day supply)", "Flashlight + extra batteries", "First aid kit and essential medicines", "Power bank, charging cables", "Copies of ID, insurance, and medical documents in a waterproof bag", "Whistle to signal for help", "Cash in small denominations"],
  },
  {
    title: "CPR Steps", icon: "heart", color: "amber",
    points: ["Check the scene is safe, then check responsiveness", "Call emergency services (or have someone else call) immediately", "Place the heel of your hand on the center of the chest", "Push hard and fast — about 100–120 compressions per minute, 5–6 cm deep", "Allow full chest recoil between compressions", "If trained, give 2 rescue breaths after every 30 compressions", "Continue until help arrives or the person responds"],
  },
  {
    title: "Flood Safety", icon: "droplet", color: "blue",
    points: ["Move to higher ground immediately, don't wait for instructions", "Never walk or drive through moving water — 15cm can knock you down", "Avoid contact with flood water; it may be contaminated or electrified", "Turn off electricity at the mains if it's safe to reach", "Keep your emergency kit and documents in a waterproof bag", "Listen to official radio/alerts for evacuation routes"],
  },
  {
    title: "Fire Safety", icon: "flame", color: "amber",
    points: ["Know two exit routes from every room", "Get low and crawl under smoke", "Feel doors before opening — don't open if hot", "Never use elevators during a fire", "Stop, Drop, and Roll if your clothing catches fire", "Once out, stay out — never re-enter for belongings"],
  },
  {
    title: "Earthquake Safety", icon: "activity", color: "emerald",
    points: ["Drop, Cover, and Hold On — don't run outside during shaking", "Stay away from windows, mirrors, and tall furniture", "If in bed, stay there and cover your head with a pillow", "If outdoors, move to an open area away from buildings and power lines", "After shaking stops, check for gas leaks and structural damage", "Expect aftershocks and keep shoes on to avoid broken glass"],
  },
  {
    title: "Landslide Awareness", icon: "mountain", color: "blue",
    points: ["Watch for new cracks in ground, walls, or pavement", "Tilting trees, poles, or fences can signal ground movement", "Unusual sounds like cracking trees or boulders knocking together are a warning", "Move away sideways from the slide path, not downhill", "Evacuate hillside areas early during prolonged heavy rain", "Report blocked or damaged roads to local authorities"],
  },
];

const LEARN_MORE = [
  { title: "Government Guidelines", desc: "Official disaster response protocols and standards.", url: "https://ndma.gov.in/" },
  { title: "Emergency Numbers", desc: "National and local emergency contact directory.", url: "https://www.india.gov.in/india-emergency-numbers" },
  { title: "Disaster Awareness", desc: "Understand the risks common to your region.", url: "https://nidm.gov.in/" },
  { title: "Community Preparedness", desc: "How neighborhoods organize before disaster strikes.", url: "https://www.ready.gov/community-preparedness-toolkit" },
];

// ---------- State ----------
let activeCategory = CATEGORIES[0].key;
let activeStep = 0;
let activeTimeline = 0;
let tipIndex = 0;
let checkedItems = new Set();

// ---------- Backend content merge ----------
async function loadGuideContent() {
  try {
    const res = await api.getGuides();
    const byCategory = Object.fromEntries(res.data.map((g) => [g.category, g]));
    CATEGORIES.forEach((cat) => {
      const backendGuide = byCategory[cat.key];
      if (!backendGuide) return; // e.g. "firstaid" has no dedicated guide document yet
      cat.steps = [
        { title: "Before the Disaster", desc: backendGuide.before.join(" ") },
        { title: "During the Disaster", desc: backendGuide.during.join(" ") },
        { title: "After the Disaster", desc: backendGuide.after.join(" ") },
      ];
    });
  } catch (err) {
    // Falls back to the local step content already in CATEGORIES.
  }
}

async function loadChecklistState() {
  try {
    const res = await api.getChecklist();
    checkedItems = new Set(res.data.completed_indices || []);
  } catch (err) {
    checkedItems = new Set();
  }
}

// ---------- Renderers ----------
function renderCategoryTabs() {
  const wrap = document.getElementById("categoryTabs");
  wrap.innerHTML = CATEGORIES.map(
    (cat) => `
      <button class="category-tab ${cat.key === activeCategory ? "active" : ""}" data-cat="${cat.key}" role="tab" aria-selected="${cat.key === activeCategory}">
        <span class="ct-icon" style="background:var(--color-primary-light); color:var(--color-primary);">${icon(cat.icon, 20)}</span>
        <span>${cat.label}</span>
      </button>`
  ).join("");

  wrap.querySelectorAll(".category-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      activeStep = 0;
      renderCategoryTabs();
      renderSteps();
    });
  });
}

function currentCategory() {
  return CATEGORIES.find((c) => c.key === activeCategory);
}

function renderSteps() {
  const cat = currentCategory();
  const progressWrap = document.getElementById("guideProgress");
  progressWrap.innerHTML = cat.steps
    .map((_, i) => `<span class="gp-step ${i < activeStep ? "done" : i === activeStep ? "active" : ""}"></span>`)
    .join("");

  const stepWrap = document.getElementById("stepCardsWrap");
  stepWrap.innerHTML = cat.steps
    .map(
      (step, i) => `
      <div class="step-card ${i === activeStep ? "active" : ""}">
        <div class="step-card-inner">
          <span class="step-num-badge">${i + 1}</span>
          <div>
            <h3>${step.title}</h3>
            <p class="mt-2">${step.desc}</p>
          </div>
        </div>
      </div>`
    )
    .join("");

  document.getElementById("stepCounter").textContent = `Step ${activeStep + 1} of ${cat.steps.length}`;
  document.getElementById("prevStepBtn").disabled = activeStep === 0;
  const nextBtn = document.getElementById("nextStepBtn");
  nextBtn.textContent = activeStep === cat.steps.length - 1 ? "Restart" : "Next Step";
}

function renderTimeline() {
  const wrap = document.getElementById("timelineWrap");
  wrap.innerHTML = TIMELINE_STAGES.map(
    (stage, i) => `
      ${i > 0 ? `<span class="timeline-arrow">${icon("chevronRight", 22)}</span>` : ""}
      <div class="timeline-stage ${i === activeTimeline ? "active" : ""}" data-i="${i}" role="button" tabindex="0">
        <span class="ts-icon">${icon(stage.icon, 30)}</span>
        <h4>${stage.title}</h4>
      </div>`
  ).join("");

  wrap.querySelectorAll(".timeline-stage").forEach((el) => {
    const select = () => {
      activeTimeline = parseInt(el.dataset.i, 10);
      renderTimeline();
      renderTimelineDetail();
    };
    el.addEventListener("click", select);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
    });
  });
}

function renderTimelineDetail() {
  const stage = TIMELINE_STAGES[activeTimeline];
  document.getElementById("timelineDetail").innerHTML = `
    <div class="flex items-center gap-3">
      <span class="feature-icon emerald" style="margin-bottom:0;">${icon(stage.icon, 22)}</span>
      <h4>${stage.title}</h4>
    </div>
    <p class="mt-2">${stage.detail}</p>`;
}

function renderVideos() {
  document.getElementById("videoGrid").innerHTML = VIDEOS.map(
    (v, i) => `
      <div class="card card-hover video-card" style="padding:0; cursor:pointer;" data-i="${i}" role="button" tabindex="0">
        <div class="video-thumb">
          <span class="play-btn">${icon("play", 22)}</span>
          <span class="video-duration">${v.duration}</span>
        </div>
        <div class="video-title"><h4>${v.title}</h4></div>
      </div>`
  ).join("");

  document.querySelectorAll("#videoGrid .video-card").forEach((card) => {
    const open = () => {
      const v = VIDEOS[parseInt(card.dataset.i, 10)];
      window.open(v.url, "_blank", "noopener");
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

function renderChecklist() {
  const wrap = document.getElementById("checklistItems");
  wrap.innerHTML = CHECKLIST.map(
    (item, i) => `
      <div class="checklist-item ${checkedItems.has(i) ? "checked" : ""}" data-i="${i}">
        <input type="checkbox" id="cl-${i}" ${checkedItems.has(i) ? "checked" : ""} />
        <label for="cl-${i}">${item}</label>
      </div>`
  ).join("");

  wrap.querySelectorAll(".checklist-item input").forEach((input) => {
    input.addEventListener("change", () => {
      const row = input.closest(".checklist-item");
      const i = parseInt(row.dataset.i, 10);
      if (input.checked) checkedItems.add(i);
      else checkedItems.delete(i);
      row.classList.toggle("checked", input.checked);
      updateChecklistProgress();
      api.updateChecklist(Array.from(checkedItems)).catch(() => {
        api.showToast("Couldn't save checklist progress.", "warning");
      });
    });
  });

  updateChecklistProgress();
}

function updateChecklistProgress() {
  document.getElementById("checklistProgressText").textContent = `${checkedItems.size} / ${CHECKLIST.length}`;
  const pct = Math.round((checkedItems.size / CHECKLIST.length) * 100);
  document.getElementById("checklistFill").style.width = `${pct}%`;
}

function renderTips() {
  document.getElementById("tipsTrack").innerHTML = TIPS.map(
    (t) => `<div class="tip-slide"><span class="eyebrow">${t.title}</span><h3 class="mt-2">${t.body}</h3></div>`
  ).join("");
  document.getElementById("tipsDots").innerHTML = TIPS.map(
    (_, i) => `<button data-i="${i}" aria-label="Go to tip ${i + 1}"></button>`
  ).join("");

  document.getElementById("tipsPrev").innerHTML = icon("chevronLeft", 18);
  document.getElementById("tipsNext").innerHTML = icon("chevronRight", 18);

  document.querySelectorAll("#tipsDots button").forEach((dot) => {
    dot.addEventListener("click", () => {
      tipIndex = parseInt(dot.dataset.i, 10);
      updateTipsCarousel();
    });
  });

  updateTipsCarousel();
}

function updateTipsCarousel() {
  document.getElementById("tipsTrack").style.transform = `translateX(-${tipIndex * 100}%)`;
  document.querySelectorAll("#tipsDots button").forEach((dot, i) => {
    dot.classList.toggle("active", i === tipIndex);
  });
}

function renderInfographics() {
  document.getElementById("infographicGrid").innerHTML = INFOGRAPHICS.map(
    (info, i) => `
      <div class="card card-hover infographic-card" style="cursor:pointer;" data-i="${i}" role="button" tabindex="0">
        <span class="info-icon" style="background:var(--color-${info.color === "emerald" ? "primary" : info.color === "blue" ? "secondary" : "warning"}-light); color:var(--color-${info.color === "emerald" ? "primary" : info.color === "blue" ? "secondary" : "warning"});">${icon(info.icon, 26)}</span>
        <h4>${info.title}</h4>
        <p class="mt-2" style="font-size:0.85rem;">Tap for the full quick-reference list.</p>
      </div>`
  ).join("");

  document.querySelectorAll("#infographicGrid .infographic-card").forEach((card) => {
    const open = () => openGuideModal(INFOGRAPHICS[parseInt(card.dataset.i, 10)]);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

function renderLearnMore() {
  document.getElementById("learnMoreGrid").innerHTML = LEARN_MORE.map(
    (item, i) => `
      <a class="card card-hover" href="${item.url}" target="_blank" rel="noopener" style="display:block; text-decoration:none; color:inherit;" data-i="${i}">
        <span class="feature-icon blue" style="margin-bottom:var(--space-3);">${icon("info", 20)}</span>
        <h4>${item.title}</h4>
        <p class="mt-2" style="font-size:0.85rem;">${item.desc}</p>
      </a>`
  ).join("");
}

function animateRings() {
  document.querySelectorAll(".ring-fill").forEach((ring) => {
    const pct = parseFloat(ring.dataset.pct);
    const circumference = 251;
    const offset = circumference - (circumference * pct) / 100;
    setTimeout(() => { ring.style.strokeDashoffset = offset; }, 200);
  });
}

function animateBars() {
  document.querySelectorAll(".bar-chart .bar").forEach((bar, i) => {
    const h = parseFloat(bar.dataset.h);
    setTimeout(() => { bar.style.height = `${h}%`; }, 150 + i * 80);
  });
}

function openGuideModal(info) {
  const modal = document.getElementById("guideModal");
  document.getElementById("guideModalTitle").textContent = info.title;
  document.getElementById("guideModalBody").innerHTML = `<ul style="padding-left:1.1rem; line-height:1.7;">${info.points.map((p) => `<li>${p}</li>`).join("")}</ul>`;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function wireGuideModal() {
  const modal = document.getElementById("guideModal");
  const closeBtn = document.getElementById("guideModalClose");
  if (!modal || !closeBtn) return;

  closeBtn.innerHTML = icon("close", 18);

  const shut = () => {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  };
  closeBtn.addEventListener("click", shut);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) shut();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) shut();
  });
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  initAppShell("guide", "Emergency Guide");

  wireGuideModal();

  await Promise.all([loadGuideContent(), loadChecklistState()]);

  renderCategoryTabs();
  renderSteps();
  renderTimeline();
  renderTimelineDetail();
  renderVideos();
  renderChecklist();
  renderTips();
  renderInfographics();
  renderLearnMore();

  document.getElementById("prevStepBtn").addEventListener("click", () => {
    if (activeStep > 0) { activeStep--; renderSteps(); }
  });
  document.getElementById("nextStepBtn").addEventListener("click", () => {
    const cat = currentCategory();
    activeStep = activeStep === cat.steps.length - 1 ? 0 : activeStep + 1;
    renderSteps();
  });

  document.getElementById("tipsPrev").addEventListener("click", () => {
    tipIndex = tipIndex === 0 ? TIPS.length - 1 : tipIndex - 1;
    updateTipsCarousel();
  });
  document.getElementById("tipsNext").addEventListener("click", () => {
    tipIndex = tipIndex === TIPS.length - 1 ? 0 : tipIndex + 1;
    updateTipsCarousel();
  });

  animateCounters();

  const statsObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateRings();
          animateBars();
          obs.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  const ringSection = document.getElementById("ring1");
  if (ringSection) statsObserver.observe(ringSection);
});
