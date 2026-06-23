const END_MARKER = "*^*^*";
const GRID_SIZE = 6;
const CHANNELS = ["R", "G", "B"];
const CHANNEL_CLASS = ["r", "g", "b"];
const VISUAL_CAPACITY = GRID_SIZE * GRID_SIZE * 3;
const SPEED_MAP = {
  1: 280,
  2: 160,
  4: 90,
};

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

function clonePixels(pixels) {
  return pixels.map((pixel) => ({
    ...pixel,
    channels: [...pixel.channels],
  }));
}

function toBinary(value) {
  return value.toString(2).padStart(8, "0");
}

function bitsFromMessage(message) {
  return [...message].flatMap((char) => toBinary(char.charCodeAt(0)).split(""));
}

function createDemoPixels() {
  const pixels = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      pixels.push({
        x,
        y,
        channels: [
          72 + (x * 13 + y * 5) % 120,
          86 + (x * 7 + y * 17) % 110,
          120 + (x * 9 + y * 11) % 90,
        ],
      });
    }
  }
  return pixels;
}

function buildActions(pixels, bits) {
  const actions = [];
  let bitIndex = 0;

  for (const pixel of pixels) {
    for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
      if (bitIndex >= bits.length) {
        return actions;
      }

      const before = pixel.channels[channelIndex];
      const incomingBit = Number(bits[bitIndex]);
      const after = (before & 0xfe) | incomingBit;
      actions.push({
        bitIndex,
        bit: bits[bitIndex],
        pixelIndex: pixel.y * GRID_SIZE + pixel.x,
        x: pixel.x,
        y: pixel.y,
        channelIndex,
        before,
        after,
        changed: before !== after,
      });
      bitIndex += 1;
    }
  }

  return actions;
}

function drawPixelsToCanvas(canvas, pixels, activePixelIndex = -1) {
  const ctx = canvas.getContext("2d");
  const scale = Math.floor(canvas.width / GRID_SIZE);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const pixel of pixels) {
    ctx.fillStyle = `rgb(${pixel.channels[0]}, ${pixel.channels[1]}, ${pixel.channels[2]})`;
    ctx.fillRect(pixel.x * scale, pixel.y * scale, scale, scale);
  }

  ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * scale, 0);
    ctx.lineTo(i * scale, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * scale);
    ctx.lineTo(canvas.width, i * scale);
    ctx.stroke();
  }

  if (activePixelIndex >= 0 && pixels[activePixelIndex]) {
    const pixel = pixels[activePixelIndex];
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0d6efd";
    ctx.strokeRect(pixel.x * scale + 1.5, pixel.y * scale + 1.5, scale - 3, scale - 3);
  }
}

const ui = {
  encodeForm: document.getElementById("encodeForm"),
  decodeForm: document.getElementById("decodeForm"),
  decodeResult: document.getElementById("decodeResult"),
  originalImage: document.getElementById("originalImage"),
  encodedImage: document.getElementById("encodedImage"),
  encodeResults: document.getElementById("encodeResults"),
  downloadBtn: document.getElementById("downloadBtn"),
  bitstreamRibbon: document.getElementById("bitstreamRibbon"),
  bitstreamMeta: document.getElementById("bitstreamMeta"),
  pixelGrid: document.getElementById("pixelGrid"),
  gridMeta: document.getElementById("gridMeta"),
  vizStatus: document.getElementById("vizStatus"),
  vizProgressLabel: document.getElementById("vizProgressLabel"),
  vizProgressBar: document.getElementById("vizProgressBar"),
  inspectorChannel: document.getElementById("inspectorChannel"),
  beforeBinary: document.getElementById("beforeBinary"),
  incomingBit: document.getElementById("incomingBit"),
  afterBinary: document.getElementById("afterBinary"),
  channelNote: document.getElementById("channelNote"),
  channelStats: document.getElementById("channelStats"),
  compareMeta: document.getElementById("compareMeta"),
  originalCropCanvas: document.getElementById("originalCropCanvas"),
  encodedCropCanvas: document.getElementById("encodedCropCanvas"),
  stepBtn: document.getElementById("stepBtn"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  speedSelect: document.getElementById("speedSelect"),
};

const state = {
  imageUrl: null,
  downloadUrl: null,
  playing: false,
  timerId: null,
  speed: 1,
  sourceLabel: "Demo sample",
  plainMessage: "HI",
  annotatedMessage: `HI${END_MARKER}`,
  bits: [],
  originalPixels: [],
  encodedPixels: [],
  actions: [],
  completedWrites: 0,
};

function stopPlayback() {
  state.playing = false;
  if (state.timerId) {
    window.clearTimeout(state.timerId);
    state.timerId = null;
  }
}

function rebuildEncodedPixels() {
  state.encodedPixels = clonePixels(state.originalPixels);
  for (let i = 0; i < state.completedWrites; i += 1) {
    const action = state.actions[i];
    state.encodedPixels[action.pixelIndex].channels[action.channelIndex] = action.after;
  }
}

function currentAction() {
  return state.actions[state.completedWrites] || null;
}

function updateStatusText() {
  if (!state.actions.length) {
    ui.vizStatus.textContent = "This message is empty, so there is nothing to write into the image.";
    return;
  }

  if (state.completedWrites >= state.actions.length) {
    ui.vizStatus.textContent = "Animation complete. The sampled pixels now contain the message bits and end marker.";
    return;
  }

  const action = currentAction();
  ui.vizStatus.textContent = `Writing bit ${action.bit} into pixel (${action.x}, ${action.y}) ${CHANNELS[action.channelIndex]} channel.`;
}

function renderBitstream() {
  ui.bitstreamRibbon.innerHTML = "";
  state.bits.slice(0, VISUAL_CAPACITY).forEach((bit, index) => {
    const chip = document.createElement("span");
    chip.className = "bit-chip";
    chip.textContent = bit;
    if (index >= state.plainMessage.length * 8) {
      chip.classList.add("is-marker");
    }
    if (index < state.completedWrites) {
      chip.classList.add("is-written");
    } else if (index === state.completedWrites) {
      chip.classList.add("is-active");
    }
    ui.bitstreamRibbon.appendChild(chip);
  });
}

function renderGrid() {
  ui.pixelGrid.innerHTML = "";
  const active = currentAction();
  const completedPixelIndexes = new Set(state.actions.slice(0, state.completedWrites).map((action) => action.pixelIndex));

  state.encodedPixels.forEach((pixel, pixelIndex) => {
    const cell = document.createElement("div");
    cell.className = "pixel-cell";
    cell.dataset.coord = `${pixel.x},${pixel.y}`;
    if (completedPixelIndexes.has(pixelIndex)) {
      cell.classList.add("is-written");
    }
    if (active && active.pixelIndex === pixelIndex) {
      cell.classList.add("is-active");
    }

    const swatch = document.createElement("div");
    swatch.className = "pixel-swatch";
    swatch.style.backgroundColor = `rgb(${pixel.channels.join(",")})`;

    const channels = document.createElement("div");
    channels.className = "pixel-channels";

    pixel.channels.forEach((value, channelIndex) => {
      const row = document.createElement("div");
      row.className = `pixel-channel pixel-channel--${CHANNEL_CLASS[channelIndex]}`;
      if (active && active.pixelIndex === pixelIndex && active.channelIndex === channelIndex) {
        row.classList.add("is-active");
      }
      row.innerHTML = `<span>${CHANNELS[channelIndex]}</span><span>${toBinary(value).slice(-4)}</span>`;
      channels.appendChild(row);
    });

    cell.appendChild(swatch);
    cell.appendChild(channels);
    ui.pixelGrid.appendChild(cell);
  });
}

function renderInspector() {
  const action = currentAction();
  const lastAction = state.actions[state.actions.length - 1] || null;

  if (!action && !lastAction) {
    ui.inspectorChannel.textContent = "No channel selected";
    ui.beforeBinary.textContent = "00000000";
    ui.incomingBit.textContent = "0";
    ui.afterBinary.textContent = "00000000";
    ui.channelNote.textContent = "Load an image and enter a message to preview how the least-significant bit is replaced.";
    ui.channelStats.innerHTML = "";
    return;
  }

  const displayAction = action || lastAction;
  ui.inspectorChannel.textContent = `${CHANNELS[displayAction.channelIndex]} channel`;
  ui.beforeBinary.textContent = toBinary(displayAction.before);
  ui.incomingBit.textContent = displayAction.bit;
  ui.afterBinary.textContent = toBinary(displayAction.after);
  ui.channelNote.textContent = displayAction.changed
    ? "The last bit flips to match the secret bit. That changes the channel value by only 1."
    : "The last bit already matches the secret bit, so this channel keeps the same value.";

  ui.channelStats.innerHTML = `
    <span>Bit ${Math.min(displayAction.bitIndex + 1, state.bits.length)} of ${state.bits.length}</span>
    <span>Pixel (${displayAction.x}, ${displayAction.y})</span>
    <span>${CHANNELS[displayAction.channelIndex]} channel</span>
  `;
}

function renderProgress() {
  const total = state.actions.length;
  ui.vizProgressLabel.textContent = `${state.completedWrites} of ${total} bits written`;
  ui.vizProgressBar.style.width = total ? `${(state.completedWrites / total) * 100}%` : "0%";
}

function renderCanvases() {
  const active = currentAction();
  const activePixelIndex = active ? active.pixelIndex : -1;
  drawPixelsToCanvas(ui.originalCropCanvas, state.originalPixels, activePixelIndex);
  drawPixelsToCanvas(ui.encodedCropCanvas, state.encodedPixels, activePixelIndex);
}

function renderMeta() {
  const previewBits = state.plainMessage.length * 8;
  const clipped = state.bits.length > VISUAL_CAPACITY ? `, visualizing the first ${VISUAL_CAPACITY} bits` : "";
  ui.bitstreamMeta.textContent = `${state.annotatedMessage.length} chars shown, ${previewBits} message bits + ${END_MARKER.length * 8} marker bits${clipped}`;
  ui.gridMeta.textContent = `${GRID_SIZE}×${GRID_SIZE} sampled from ${state.sourceLabel}`;
  ui.compareMeta.textContent = state.actions.length
    ? `Showing the first ${state.actions.length} channel writes in the sampled grid`
    : "No writes needed for the current message";
}

function renderAll() {
  rebuildEncodedPixels();
  renderMeta();
  renderBitstream();
  renderGrid();
  renderInspector();
  renderProgress();
  renderCanvases();
  updateStatusText();
  ui.playPauseBtn.textContent = state.playing ? "Pause" : "Play";
}

function stepForward() {
  if (state.completedWrites >= state.actions.length) {
    stopPlayback();
    renderAll();
    return;
  }

  state.completedWrites += 1;
  renderAll();

  if (state.completedWrites >= state.actions.length) {
    stopPlayback();
    renderAll();
  }
}

function schedulePlayback() {
  if (!state.playing) {
    return;
  }

  if (state.completedWrites >= state.actions.length) {
    stopPlayback();
    renderAll();
    return;
  }

  state.timerId = window.setTimeout(() => {
    stepForward();
    schedulePlayback();
  }, SPEED_MAP[state.speed] || SPEED_MAP[1]);
}

function setVisualization({ pixels, message, sourceLabel }) {
  stopPlayback();
  state.sourceLabel = sourceLabel;
  state.plainMessage = message;
  state.annotatedMessage = `${message}${END_MARKER}`;
  state.bits = bitsFromMessage(state.annotatedMessage);
  state.originalPixels = pixels;
  state.actions = buildActions(state.originalPixels, state.bits);
  state.completedWrites = 0;
  renderAll();
}

function resetVisualization() {
  state.completedWrites = 0;
  stopPlayback();
  renderAll();
}

function syncVisualizationWithInputs() {
  const message = ui.encodeForm.message.value || "";
  if (!message.trim()) {
    setVisualization({
      pixels: clonePixels(state.originalPixels.length ? state.originalPixels : createDemoPixels()),
      message: "HI",
      sourceLabel: state.sourceLabel || "Demo sample",
    });
    ui.vizStatus.textContent = "Enter a message to replace the demo bitstream with your own secret text.";
    return;
  }

  setVisualization({
    pixels: clonePixels(state.originalPixels.length ? state.originalPixels : createDemoPixels()),
    message,
    sourceLabel: state.sourceLabel || "Demo sample",
  });
}

async function samplePixelsFromFile(file) {
  const fileUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Unable to load the selected image."));
      image.src = fileUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, GRID_SIZE, GRID_SIZE);
    const { data } = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);

    const pixels = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const offset = (y * GRID_SIZE + x) * 4;
        pixels.push({
          x,
          y,
          channels: [data[offset], data[offset + 1], data[offset + 2]],
        });
      }
    }

    if (state.imageUrl) {
      URL.revokeObjectURL(state.imageUrl);
    }
    state.imageUrl = fileUrl;
    ui.originalImage.src = state.imageUrl;

    return {
      pixels,
      sourceLabel: file.name,
    };
  } catch (error) {
    URL.revokeObjectURL(fileUrl);
    throw error;
  }
}

async function handleEncode(form) {
  const res = await submitForm(form, "/api/encode");
  const blob = await res.blob();
  const filename = form.outputName.value?.trim() || "stego.png";

  if (state.downloadUrl) {
    URL.revokeObjectURL(state.downloadUrl);
  }
  state.downloadUrl = URL.createObjectURL(blob);
  ui.encodedImage.src = state.downloadUrl;
  ui.downloadBtn.onclick = () => downloadBlob(blob, filename);
  ui.encodeResults.classList.remove("d-none");

  showAlert("✅ Image encoded successfully.", "success");
}

async function handleDecode(form, resultElement) {
  const res = await submitForm(form, "/api/decode");
  const json = await res.json();
  resultElement.textContent = json.message;
  showAlert("✅ Image decoded successfully.", "success");
}

ui.stepBtn.addEventListener("click", () => {
  stopPlayback();
  stepForward();
});

ui.playPauseBtn.addEventListener("click", () => {
  if (!state.actions.length) {
    return;
  }

  if (state.playing) {
    stopPlayback();
    renderAll();
    return;
  }

  if (state.completedWrites >= state.actions.length) {
    state.completedWrites = 0;
  }

  state.playing = true;
  renderAll();
  schedulePlayback();
});

ui.resetBtn.addEventListener("click", () => {
  resetVisualization();
});

ui.speedSelect.addEventListener("change", () => {
  state.speed = Number(ui.speedSelect.value);
  if (state.playing) {
    stopPlayback();
    state.playing = true;
    renderAll();
    schedulePlayback();
  }
});

ui.encodeForm.coverFile.addEventListener("change", async () => {
  const file = ui.encodeForm.coverFile.files[0];
  if (!file) {
    return;
  }

  try {
    const sampled = await samplePixelsFromFile(file);
    const message = ui.encodeForm.message.value.trim() || "HI";
    setVisualization({
      pixels: sampled.pixels,
      message,
      sourceLabel: sampled.sourceLabel,
    });
    if (!ui.encodeForm.message.value.trim()) {
      ui.vizStatus.textContent = "The image sample is ready. Add your secret message to replace the demo text.";
    }
  } catch (error) {
    showAlert(`<strong>Error:</strong> ${error.message}`, "danger");
  }
});

ui.encodeForm.message.addEventListener("input", () => {
  syncVisualizationWithInputs();
});

ui.encodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = ui.encodeForm.coverFile.files[0];
  if (file && !ui.originalImage.src) {
    const sampled = await samplePixelsFromFile(file);
    setVisualization({
      pixels: sampled.pixels,
      message: ui.encodeForm.message.value.trim() || "HI",
      sourceLabel: sampled.sourceLabel,
    });
  }

  await handleEncode(ui.encodeForm);
});

ui.decodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleDecode(ui.decodeForm, ui.decodeResult);
});

setVisualization({
  pixels: createDemoPixels(),
  message: "HI",
  sourceLabel: "Demo sample",
});
