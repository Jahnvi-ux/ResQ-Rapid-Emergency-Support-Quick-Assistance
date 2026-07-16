/* ============================================================
   RESQ — Chatbot Page Script
   Mock conversation logic only. The response engine is a static
   keyword-matched lookup so the UI can be wired to a real LLM
   endpoint later without changing any markup.
   ============================================================ */

const MOCK_RESPONSES = [
  {
    match: ["flood"],
    reply:
      "For flood safety: move to higher ground immediately, avoid walking or driving through moving water, disconnect electrical appliances, and keep your emergency kit within reach. Would you like the nearest shelter?",
  },
  {
    match: ["fire"],
    reply:
      "In a fire emergency: get low under smoke, feel doors before opening them, use stairs (never elevators), and call emergency services once you're safely outside. I can pull up your nearest fire station if needed.",
  },
  {
    match: ["earthquake"],
    reply:
      "During an earthquake: Drop, Cover, and Hold On under sturdy furniture. Stay away from windows and heavy shelving. After shaking stops, check for gas leaks before using electrical switches.",
  },
  {
    match: ["first aid", "firstaid", "injury", "bleeding"],
    reply:
      "For basic first aid: apply firm, direct pressure to any bleeding with a clean cloth, keep the person still, and check breathing and responsiveness. For anything serious, call emergency services right away.",
  },
  {
    match: ["shelter", "nearest shelter"],
    reply:
      "The closest open shelter to your last known location is Civil Lines Community Shelter, about 1.2 km away. Want me to open directions in the Shelter Finder?",
  },
];

const FALLBACK_REPLY =
  "I've noted that. In a full deployment I'd route this through ResQ's AI engine for a tailored answer — for now, try one of the suggested topics on the right.";

function getMockReply(text) {
  const lower = text.toLowerCase();
  const found = MOCK_RESPONSES.find((r) => r.match.some((k) => lower.includes(k)));
  return found ? found.reply : FALLBACK_REPLY;
}

function appendMessage(role, text) {
  const container = document.getElementById("chatMessages");
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role}`;

  const avatarStyle =
    role === "bot"
      ? "background:var(--color-primary-light); color:var(--color-primary);"
      : "background:var(--color-secondary-light); color:var(--color-secondary);";
  const avatarLabel = role === "bot" ? "AI" : "You";

  wrap.innerHTML = `
    <span class="msg-avatar" style="${avatarStyle}">${avatarLabel}</span>
    <div class="msg-bubble">${text}</div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById("chatMessages");
  const wrap = document.createElement("div");
  wrap.className = "msg msg-bot";
  wrap.id = "typingIndicator";
  wrap.innerHTML = `
    <span class="msg-avatar" style="background:var(--color-primary-light); color:var(--color-primary);">AI</span>
    <div class="msg-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  appendMessage("user", trimmed);
  showTyping();
  setTimeout(() => {
    removeTyping();
    appendMessage("bot", getMockReply(trimmed));
  }, 900);
}

document.addEventListener("DOMContentLoaded", () => {
  initAppShell("chatbot", "Chatbot");

  document.getElementById("botAvatarIcon").innerHTML = icon("chat", 20);
  document.getElementById("sendBtn").innerHTML = icon("send", 18);

  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(input.value);
    input.value = "";
    input.focus();
  });

  document.querySelectorAll(".suggested-q").forEach((btn) => {
    btn.addEventListener("click", () => sendMessage(btn.dataset.q));
  });
});
