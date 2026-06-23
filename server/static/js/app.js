const alertsContainer = document.getElementById("alerts");

function showAlert(message, type = "info") {
  alertsContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function clearAlert() {
  alertsContainer.innerHTML = "";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

async function submitForm(form, endpoint) {
  clearAlert();
  const data = new FormData(form);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Unknown error");
    }

    return res;
  } catch (err) {
    showAlert(`<strong>Error:</strong> ${err.message}`, "danger");
    throw err;
  }
}

async function handleEncode(form, mode, defaultFilename) {
  const res = await submitForm(form, "/api/encode");
  const blob = await res.blob();
  const filename = form.outputName.value?.trim() || defaultFilename;
  downloadBlob(blob, filename);
  showAlert(`✅ ${mode} encoded successfully. File downloaded.`, "success");
}

async function handleDecode(form, mode, resultElement) {
  const res = await submitForm(form, "/api/decode");
  const json = await res.json();
  resultElement.textContent = json.message;
  showAlert(`✅ ${mode} decoded successfully.`, "success");
}

// Image forms
const imageEncodeForm = document.getElementById("imageEncodeForm");
const imageDecodeForm = document.getElementById("imageDecodeForm");
const imageDecodeResult = document.getElementById("imageDecodeResult");

imageEncodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleEncode(imageEncodeForm, "Image", "stego.png");
});
imageDecodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleDecode(imageDecodeForm, "Image", imageDecodeResult);
});

// Audio forms
const audioEncodeForm = document.getElementById("audioEncodeForm");
const audioDecodeForm = document.getElementById("audioDecodeForm");
const audioDecodeResult = document.getElementById("audioDecodeResult");

audioEncodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleEncode(audioEncodeForm, "Audio", "stego.wav");
});
audioDecodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleDecode(audioDecodeForm, "Audio", audioDecodeResult);
});

// Text forms
const textEncodeForm = document.getElementById("textEncodeForm");
const textDecodeForm = document.getElementById("textDecodeForm");
const textDecodeResult = document.getElementById("textDecodeResult");

textEncodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleEncode(textEncodeForm, "Text", "stego.txt");
});
textDecodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleDecode(textDecodeForm, "Text", textDecodeResult);
});
