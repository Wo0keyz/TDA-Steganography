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

async function handleEncode(form) {
  const res = await submitForm(form, "/api/encode");
  const blob = await res.blob();
  const filename = form.outputName.value?.trim() || "stego.png";

  // Display the encoded image
  const encodedImage = document.getElementById("encodedImage");
  const encodedUrl = URL.createObjectURL(blob);
  encodedImage.src = encodedUrl;

  // Setup download button
  const downloadBtn = document.getElementById("downloadBtn");
  downloadBtn.onclick = () => downloadBlob(blob, filename);

  // Show results section
  document.getElementById("encodeResults").classList.remove("d-none");

  showAlert(`✅ Image encoded successfully.`, "success");
}

async function handleDecode(form, resultElement) {
  const res = await submitForm(form, "/api/decode");
  const json = await res.json();
  resultElement.textContent = json.message;
  showAlert(`✅ Image decoded successfully.`, "success");
}

// Encode form
const encodeForm = document.getElementById("encodeForm");
const originalImage = document.getElementById("originalImage");

encodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Display original image
  const file = encodeForm.coverFile.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  await handleEncode(encodeForm);
});

// Decode form
const decodeForm = document.getElementById("decodeForm");
const decodeResult = document.getElementById("decodeResult");

decodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleDecode(decodeForm, decodeResult);
});
