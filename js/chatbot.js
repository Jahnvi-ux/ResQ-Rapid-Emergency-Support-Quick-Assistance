/* ============================================================
   RESQ — Chatbot Page Script
   Messages are sent to /chatbot/message (ai_service — mock
   keyword-matching now, Gemini/OpenAI/Claude/Llama-ready later).
   History loads from /chatbot/history on page load.
   ============================================================ */
let isVoiceInput = false;
let pendingImage = null; // { base64: "data:image/...;base64,....", name: "photo.jpg" }

function appendMessage(role, text, imageDataUrl = null) {
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
    <div class="msg-bubble"></div>`;
  const bubble = wrap.querySelector(".msg-bubble");

const formatted = text
    .replace(/^\*\s?/gm, "• ")
    .replace(/^\-\s?/gm, "• ");

bubble.textContent = formatted;

  if (imageDataUrl) {
    const img = document.createElement("img");
    img.className = "msg-image";
    img.src = imageDataUrl;
    img.alt = "Attached image";
    bubble.appendChild(img);
  }

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
function speak(text, lang) {

    if (!window.speechSynthesis) return;

    speechSynthesis.cancel();

    let count = 1;

    const cleanedText = text
        .split("\n")
        .filter(line => line.trim() !== "")
        .map(line => {

            line = line.trim();

            // Remove AI/Assistant if present
            line = line.replace(/^AI[:,-]?\s*/i, "");
            line = line.replace(/^Assistant[:,-]?\s*/i, "");

            // Convert bullets to numbering
            if (/^(•|-|\*)\s*/.test(line)) {
                line = line.replace(/^(•|-|\*)\s*/, `${count}. `);
                count++;
            }

            return line;

        })
        .join(". ");

    const utterance = new SpeechSynthesisUtterance(cleanedText);

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = lang || navigator.language || "en-IN";

    speechSynthesis.speak(utterance);
}
async function loadHistory() {
  try {
    const res = await api.getChatHistory();
   
    const history = res.data || [];
    if (!history.length) return;

    // Replace the static greeting with the real saved conversation.
    document.getElementById("chatMessages").innerHTML = "";
    history.forEach((item) => appendMessage(item.role, item.message));
  } catch (err) {
    // History is a nice-to-have; the greeting bubble already in the
    // markup is a fine fallback if this fails.
  }
}

async function sendMessage(text) {
  const trimmed = text.trim();
  const attachedImage = pendingImage;
  if (!trimmed && !attachedImage) return;

  const messageForApi = trimmed || "Please look at this image and help.";
  appendMessage("user", messageForApi, attachedImage ? attachedImage.base64 : null);
  clearPendingImage();
  showTyping();

  const langSelect = document.getElementById("micLangSelect");
  const selectedLang = langSelect ? langSelect.value : null;

  try {
    const { lat, lng } = await getUserLocation();
    const res = await api.sendChatMessage(
      messageForApi,
      attachedImage ? attachedImage.base64 : null,
      selectedLang,
      lat,
      lng
    );
    console.log("Reply:", res.data.reply);
    removeTyping();
    appendMessage("bot", res.data.reply);
    if (isVoiceInput) {
    speak(res.data.reply, selectedLang);
    isVoiceInput = false;
}
  } catch (err) {
    removeTyping();
    api.showToast(err.message || "Couldn't reach the assistant. Try again.", "error");
  }
}

function showPendingImage(base64, name) {
  pendingImage = { base64, name };
  const preview = document.getElementById("chatImagePreview");
  const thumb = document.getElementById("chatImagePreviewThumb");
  const nameEl = document.getElementById("chatImagePreviewName");
  thumb.src = base64;
  nameEl.textContent = name || "Attached image";
  preview.hidden = false;
}

function clearPendingImage() {
  pendingImage = null;
  const preview = document.getElementById("chatImagePreview");
  if (preview) preview.hidden = true;
  const fileInput = document.getElementById("chatImageInput");
  if (fileInput) fileInput.value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  initAppShell("chatbot", "Chatbot");

  document.getElementById("botAvatarIcon").innerHTML = icon("chat", 20);
  document.getElementById("sendBtn").innerHTML = icon("send", 18);

  loadHistory();

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

  // Image attach: click paperclip -> open file picker -> preview -> attach on send
  const imageBtn = document.getElementById("imageBtn");
  const chatImageInput = document.getElementById("chatImageInput");
  const chatImageRemove = document.getElementById("chatImageRemove");

  imageBtn.addEventListener("click", () => chatImageInput.click());

  chatImageInput.addEventListener("change", () => {
    const file = chatImageInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      api.showToast("Please select an image file.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => showPendingImage(reader.result, file.name);
    reader.readAsDataURL(file);
  });

  chatImageRemove.addEventListener("click", () => clearPendingImage());

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {

  const recognition = new SpeechRecognition();

  const micLangSelect = document.getElementById("micLangSelect");
  recognition.lang = (micLangSelect && micLangSelect.value) || navigator.language || "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  const micBtn = document.getElementById("micBtn");
  const chatInput = document.getElementById("chatInput");

  if (micLangSelect) {
    micLangSelect.addEventListener("change", () => {
      recognition.lang = micLangSelect.value;
    });
  }

  micBtn.addEventListener("click", () => {

    isVoiceInput = true;

    recognition.lang = (micLangSelect && micLangSelect.value) || navigator.language || "en-IN";

    recognition.start();

    micBtn.classList.add("listening");

});

  recognition.onresult = (event) => {

    const text = event.results[0][0].transcript;

    chatInput.value = text;

    sendMessage(text);

    chatInput.value = "";

};

  recognition.onend = () => {
    micBtn.classList.remove("listening");
  };

  recognition.onerror = () => {
    micBtn.classList.remove("listening");
  };

} else {

  console.log("Speech Recognition is not supported in this browser.");

}

});