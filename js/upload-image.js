/* ============================================================
   RESQ — Upload Image Page Script
   File is read locally for preview only; nothing is uploaded.
   Analysis is a static mock — swap runAnalysis() for a real
   image-recognition API call when the backend is ready.
   ============================================================ */

function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
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

function runAnalysis() {
  const emptyState = document.getElementById("resultEmpty");
  const content = document.getElementById("resultContent");
  const fill = document.getElementById("confidenceFill");

  emptyState.style.display = "none";
  content.style.display = "block";
  fill.style.width = "0%";
  requestAnimationFrame(() => {
    setTimeout(() => {
      fill.style.width = "87%";
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
