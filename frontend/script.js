const API_BASE = "http://localhost:8000/api";

const CONVERSIONS_BY_EXT = {
  ".pdf":  [
    { value: "pdf-to-docx", label: "PDF → DOCX (Word Document)" },
    { value: "pdf-to-txt",  label: "PDF → TXT (Plain Text)" },
  ],
  ".docx": [
    { value: "docx-to-pdf", label: "DOCX → PDF" },
    { value: "docx-to-txt", label: "DOCX → TXT (Plain Text)" },
  ],
  ".pptx": [{ value: "pptx-to-pdf", label: "PPTX → PDF" }],
  ".jpg":  [{ value: "jpg-to-pdf",  label: "JPG → PDF" }],
  ".jpeg": [{ value: "jpeg-to-pdf", label: "JPEG → PDF" }],
  ".png":  [{ value: "png-to-pdf",  label: "PNG → PDF" }],
};

const FILE_ICONS = {
  ".pdf": "📕", ".docx": "📘", ".pptx": "📙",
  ".jpg": "🖼️", ".jpeg": "🖼️", ".png": "🖼️",
};

const dropzone         = document.getElementById("dropzone");
const fileInput        = document.getElementById("fileInput");
const dropInner        = document.getElementById("dropInner");
const filePreview      = document.getElementById("filePreview");
const fileIcon         = document.getElementById("fileIcon");
const fileName         = document.getElementById("fileName");
const fileSize         = document.getElementById("fileSize");
const removeFileBtn    = document.getElementById("removeFile");
const conversionSelect = document.getElementById("conversionSelect");
const convertBtn       = document.getElementById("convertBtn");
const loadingState     = document.getElementById("loadingState");
const loadingText      = document.getElementById("loadingText");
const successState     = document.getElementById("successState");
const downloadBtn      = document.getElementById("downloadBtn");
const resetBtn         = document.getElementById("resetBtn");
const errorState       = document.getElementById("errorState");
const errorMsg         = document.getElementById("errorMsg");
const errorResetBtn    = document.getElementById("errorResetBtn");

let selectedFile    = null;
let downloadBlobURL = null;
let downloadName    = "converted_file";

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  const ext = getExt(file.name);
  if (!CONVERSIONS_BY_EXT[ext]) {
    showError(`Unsupported file type: "${ext}". Please upload PDF, DOCX, PPTX, JPG, or PNG.`);
    return;
  }
  selectedFile = file;
  showFilePreview(file, ext);
  populateConversions(ext);
  resetOutputStates();
}

function getExt(name) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

function showFilePreview(file, ext) {
  dropInner.classList.add("hidden");
  filePreview.classList.remove("hidden");
  fileIcon.textContent = FILE_ICONS[ext] || "📄";
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function populateConversions(ext) {
  const options = CONVERSIONS_BY_EXT[ext] || [];
  conversionSelect.innerHTML = `<option value="">— Choose conversion —</option>`;
  options.forEach(o => {
    const el = document.createElement("option");
    el.value = o.value;
    el.textContent = o.label;
    conversionSelect.appendChild(el);
  });
  conversionSelect.disabled = false;
  convertBtn.disabled = true;
}

conversionSelect.addEventListener("change", () => {
  convertBtn.disabled = !conversionSelect.value;
});

dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("drag-over"); });
dropzone.addEventListener("dragleave", () => { dropzone.classList.remove("drag-over"); });
dropzone.addEventListener("drop", e => {
  e.preventDefault();
  dropzone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

dropzone.addEventListener("click", e => {
  if (e.target === removeFileBtn || removeFileBtn.contains(e.target)) return;
  if (selectedFile) return;
  e.stopPropagation();
  fileInput.click();
});

document.querySelector(".btn-browse").addEventListener("click", e => {
  e.stopPropagation();
  fileInput.click();
});

removeFileBtn.addEventListener("click", e => { e.stopPropagation(); resetAll(); });

function resetAll() {
  selectedFile = null;
  fileInput.value = "";
  filePreview.classList.add("hidden");
  dropInner.classList.remove("hidden");
  conversionSelect.innerHTML = `<option value="">— Upload a file first —</option>`;
  conversionSelect.disabled = true;
  convertBtn.disabled = true;
  resetOutputStates();
}

function resetOutputStates() {
  loadingState.classList.add("hidden");
  successState.classList.add("hidden");
  errorState.classList.add("hidden");
  if (downloadBlobURL) { URL.revokeObjectURL(downloadBlobURL); downloadBlobURL = null; }
}

convertBtn.addEventListener("click", async () => {
  if (!selectedFile || !conversionSelect.value) return;
  convertBtn.disabled = true;
  loadingState.classList.remove("hidden");
  successState.classList.add("hidden");
  errorState.classList.add("hidden");

  const msgs = ["Converting your file…", "Processing pages…", "Almost done…", "Finalizing output…"];
  let idx = 0;
  const interval = setInterval(() => { idx = (idx+1) % msgs.length; loadingText.textContent = msgs[idx]; }, 2000);

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("conversion_type", conversionSelect.value);

    const response = await fetch(`${API_BASE}/convert`, { method: "POST", body: formData });
    clearInterval(interval);

    if (!response.ok) {
      let detail = "Conversion failed. Please try again.";
      try { const e = await response.json(); detail = e.detail || detail; } catch {}
      throw new Error(detail);
    }

  const ext = conversionSelect.value.split("-to-")[1];
const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
downloadName = `${baseName}_converted.${ext}`;

    const blob = await response.blob();
    downloadBlobURL = URL.createObjectURL(blob);
    loadingState.classList.add("hidden");
    successState.classList.remove("hidden");

  } catch (err) {
    clearInterval(interval);
    showError(err.message);
  }
});

downloadBtn.addEventListener("click", () => {
  if (!downloadBlobURL) return;
  const a = document.createElement("a");
  a.href = downloadBlobURL;
  a.download = downloadName;
  a.click();
});

resetBtn.addEventListener("click", resetAll);
errorResetBtn.addEventListener("click", () => {
  errorState.classList.add("hidden");
  convertBtn.disabled = false;
});

function showError(msg) {
  loadingState.classList.add("hidden");
  successState.classList.add("hidden");
  errorState.classList.remove("hidden");
  errorMsg.textContent = msg;
  convertBtn.disabled = false;
}

window.addEventListener("load", async () => {
  try {
    await fetch("http://localhost:8000/");
  } catch {
    const banner = document.createElement("div");
    banner.style.cssText = `position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:#1c1c22;border:1px solid #f87171;color:#f87171;padding:0.6rem 1.25rem;border-radius:8px;font-size:0.82rem;z-index:999;white-space:nowrap;`;
    banner.textContent = "⚠️ Backend offline — start FastAPI first (see instructions)";
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 8000);
  }
});