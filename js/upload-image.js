/* ============================================================
   RESQ — Upload Image Page Script
   File is read locally for an instant preview; the actual
   analysis is performed by the backend's /uploads/analyze
   endpoint (image_service — mock now, YOLO/Vision-ready later).
   ============================================================ */

let selectedFile = null;

function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById("uploadPreview");
    const img = document.getElementById("previewImg");
    img.src = e.target.result;
    preview.classList.add("show");
    document.getElementById("analyzeBtn").disabled = false;
  };
  reader.readAsDataURL(file);
}

async function runAnalysis() {
  if (!selectedFile) return;

  const analyzeBtn = document.getElementById("analyzeBtn");
  const originalText = analyzeBtn.textContent;
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="spinner-inline"></span>Analyzing&hellip;';

  try {
    const res = await api.analyzeImage(selectedFile);
    renderResult(res.data);
    api.showToast("Image analyzed successfully.", "success");
  } catch (err) {
    api.showToast(err.message || "Couldn't analyze that image. Please try again.", "error");
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = originalText;
  }
}

function renderResult(result) {
  const emptyState = document.getElementById("resultEmpty");
  const content = document.getElementById("resultContent");
  const fill = document.getElementById("confidenceFill");

  emptyState.style.display = "none";
  content.style.display = "block";

  document.getElementById("resultType").textContent = result.disaster_type;
  document.getElementById("resultConfidenceLabel").textContent = `${result.confidence_pct}%`;
  document.getElementById("resultSummary").textContent = result.summary;
  document.getElementById("resultFirstAid").textContent = result.first_aid_suggestion;
  document.getElementById("resultAction").textContent = result.recommended_action;

  fill.style.width = "0%";
  requestAnimationFrame(() => {
    setTimeout(() => {
      fill.style.width = `${result.confidence_pct}%`;
    }, 50);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAppShell("upload", "Upload Image");

  document.getElementById("uzIcon").innerHTML = icon("upload", 40);
  document.getElementById("resultEmptyIcon").innerHTML = icon("image", 40);

  const zone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("fileInput");
  const browseBtn = document.getElementById("browseBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");

  browseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

  ["dragenter", "dragover"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
    })
  );
  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  analyzeBtn.addEventListener("click", runAnalysis);
});
