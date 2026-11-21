const DIMENSIONS = [
  { key: "clarity", code: "CLA", fallbackName: "Claridad" },
  { key: "recognizability", code: "REC", fallbackName: "Reconocibilidad" },
  { key: "semantic_transparency", code: "SEM", fallbackName: "Transparencia Semántica" },
  { key: "pragmatic_fit", code: "PRA", fallbackName: "Adecuación Pragmática" },
  { key: "cultural_adequacy", code: "CUL", fallbackName: "Adecuación Cultural" },
  { key: "cognitive_accessibility", code: "COG", fallbackName: "Accesibilidad Cognitiva" },
];

const AXIS_COLORS = ["#2563eb", "#0d9488", "#d97706", "#9333ea", "#e11d48", "#16a34a"];
const PROFILE_STORAGE_KEY = "pictos-index:evaluator-profile:v5";
const LEGACY_PROFILE_STORAGE_KEYS = ["pictos-index:evaluator-profile:v4", "pictos-index:evaluator-profile:v3"];
const LIBRARY_STORAGE_PREFIX = "pictos-index:library-evals:v3:";

const state = {
  rubric: null,
  library: null,
  items: [],
  previewIndex: 0,
  evalIndex: 0,
  dimensionIndex: 0,
  assessment: null,
  evaluatorProfile: null,
  evaluations: new Map(),
};

const el = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindElements();
  bindEvents();
  state.rubric = await loadRubric();
  buildSliders();
  loadEvaluatorProfile();
  updateStepLocks();
  showHome(false);
}

function bindElements() {
  el.homeScreen = document.getElementById("homeScreen");
  el.evaluatorShell = document.getElementById("evaluatorShell");
  el.startEvaluationBtn = document.getElementById("startEvaluationBtn");
  el.brandHome = document.getElementById("brandHome");
  el.statusRegion = document.getElementById("statusRegion");

  el.stepBtn1 = document.getElementById("stepBtn1");
  el.stepBtn2 = document.getElementById("stepBtn2");
  el.stepBtn3 = document.getElementById("stepBtn3");

  el.step1 = document.getElementById("step1");
  el.step1Title = document.getElementById("step1Title");
  el.step1Instruction = document.getElementById("step1Instruction");
  el.step2 = document.getElementById("step2");
  el.step3 = document.getElementById("step3");
  el.step1Nav = document.getElementById("step1Nav");
  el.step2Nav = document.getElementById("step2Nav");
  el.step3Nav = document.getElementById("step3Nav");

  el.libraryFileInput = document.getElementById("libraryFileInput");
  el.libraryLoader = document.getElementById("libraryLoader");
  el.libraryLoaded = document.getElementById("libraryLoaded");
  el.loadedLibraryName = document.getElementById("loadedLibraryName");
  el.loadedLibraryFile = document.getElementById("loadedLibraryFile");
  el.libraryHighlights = document.getElementById("libraryHighlights");
  el.replaceLibraryBtn = document.getElementById("replaceLibraryBtn");
  el.sampleLibraryButtons = Array.from(document.querySelectorAll("[data-sample-path]"));
  el.libraryStatus = document.getElementById("libraryStatus");
  el.librarySummary = document.getElementById("librarySummary");
  el.libraryPreview = document.getElementById("libraryPreview");
  el.previewPrevBtn = document.getElementById("previewPrevBtn");
  el.previewNextBtn = document.getElementById("previewNextBtn");
  el.previewImage = document.getElementById("previewImage");
  el.previewCounter = document.getElementById("previewCounter");
  el.step1NextBtn = document.getElementById("step1NextBtn");

  el.evaluatorForm = document.getElementById("evaluatorForm");
  el.evalAacRelationInputs = Array.from(document.querySelectorAll('input[name="aacRelations"]'));
  el.evalAacNoExperience = document.getElementById("evalAacNoExperience");
  el.step2BackBtn = document.getElementById("step2BackBtn");

  el.step3BackBtn = document.getElementById("step3BackBtn");
  el.evalPrevBtn = document.getElementById("evalPrevBtn");
  el.evalNextBtn = document.getElementById("evalNextBtn");
  el.evalCounter = document.getElementById("evalCounter");
  el.evalProgress = document.getElementById("evalProgress");
  el.exportJsonBtn = document.getElementById("exportJsonBtn");
  el.exportJsonLabel = document.getElementById("exportJsonLabel");

  el.realPhraseLabel = document.getElementById("realPhraseLabel");
  el.realPhraseText = document.getElementById("realPhraseText");
  el.realPhraseSlot = document.getElementById("realPhraseSlot");
  el.interpretationStage = document.getElementById("interpretationStage");
  el.likertStage = document.getElementById("likertStage");

  el.pragmaticImage = document.getElementById("pragmaticImage");
  el.dimensionImage = document.getElementById("dimensionImage");

  el.guessText = document.getElementById("guessText");
  el.saveGuessBtn = document.getElementById("saveGuessBtn");
  el.skipGuessBtn = document.getElementById("skipGuessBtn");
  el.editGuessBtn = document.getElementById("editGuessBtn");
  el.clearEvalBtn = document.getElementById("clearEvalBtn");

  el.saveAndNextBtn = document.getElementById("saveAndNextBtn");
  el.saveAndNextCounter = document.getElementById("saveAndNextCounter");

  el.slidersContainer = document.getElementById("slidersContainer");
  el.rubricDetails = document.getElementById("rubricDetails");
  el.dimensionPrevBtn = document.getElementById("dimensionPrevBtn");
  el.dimensionNextBtn = document.getElementById("dimensionNextBtn");
  el.dimensionCounter = document.getElementById("dimensionCounter");
  el.activeDimensionTitle = document.getElementById("activeDimensionTitle");
  el.activeDimensionDescription = document.getElementById("activeDimensionDescription");
  el.hexChart = document.getElementById("hexChart");
  el.scoreBadge = document.getElementById("scoreBadge");
}

function bindEvents() {
  el.startEvaluationBtn.addEventListener("click", () => {
    el.homeScreen.classList.add("hidden");
    el.evaluatorShell.classList.remove("hidden");
    goToStep(1, true);
  });
  el.brandHome.addEventListener("click", (event) => {
    event.preventDefault();
    showHome();
  });

  el.stepBtn1.addEventListener("click", () => goToStep(1));
  el.stepBtn2.addEventListener("click", () => {
    if (!el.stepBtn2.disabled) goToStep(2);
  });
  el.stepBtn3.addEventListener("click", () => {
    if (!el.stepBtn3.disabled) goToStep(3);
  });

  el.libraryFileInput.addEventListener("change", onLibraryFileChange);
  el.replaceLibraryBtn.addEventListener("click", () => el.libraryFileInput.click());
  el.sampleLibraryButtons.forEach((button) => {
    button.addEventListener("click", () => onLoadSampleLibrary(button));
  });
  el.previewPrevBtn.addEventListener("click", () => changePreviewIndex(state.previewIndex - 1));
  el.previewNextBtn.addEventListener("click", () => changePreviewIndex(state.previewIndex + 1));
  el.step1NextBtn.addEventListener("click", () => goToStep(2));

  el.evaluatorForm.addEventListener("submit", onEvaluatorSubmit);
  el.evalAacRelationInputs.forEach((input) => input.addEventListener("change", onAacRelationChange));
  el.step2BackBtn.addEventListener("click", () => goToStep(1));

  el.step3BackBtn.addEventListener("click", () => goToStep(2));
  el.evalPrevBtn.addEventListener("click", () => changeEvalItem(state.evalIndex - 1));
  el.evalNextBtn.addEventListener("click", () => changeEvalItem(state.evalIndex + 1));
  el.dimensionPrevBtn.addEventListener("click", () => changeDimension(-1));
  el.dimensionNextBtn.addEventListener("click", () => changeDimension(1));

  el.saveGuessBtn.addEventListener("click", onSaveGuess);
  el.skipGuessBtn.addEventListener("click", onSkipGuess);
  el.editGuessBtn.addEventListener("click", onEditGuess);
  el.clearEvalBtn.addEventListener("click", clearCurrentEvaluation);
  el.saveAndNextBtn.addEventListener("click", onSaveAndNext);

  el.exportJsonBtn.addEventListener("click", exportEvaluationJson);
}

async function loadRubric() {
  try {
    const response = await fetch("./data/rubric-scale-descriptions.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("No se pudo cargar rubrica centralizada. Uso fallback.", error);
    return createFallbackRubric();
  }
}

function createFallbackRubric() {
  const scale = {
    "1": { label_es: "No funcional", general_es: "No funciona y requiere rediseño.", color: "#dc2626" },
    "2": { label_es: "Insuficiente", general_es: "Presenta problemas relevantes.", color: "#ea580c" },
    "3": { label_es: "Funciona", general_es: "Funciona, con mejoras pendientes.", color: "#d97706" },
    "4": { label_es: "Bien", general_es: "Cumple bien, con mejoras menores.", color: "#65a30d" },
    "5": { label_es: "Excelente", general_es: "No requiere mejoras.", color: "#16a34a" },
  };

  const dimensions = {};
  DIMENSIONS.forEach((dim) => {
    const levels = {};
    for (let i = 1; i <= 5; i += 1) {
      levels[String(i)] = { text_es: `Nivel ${i} para ${dim.fallbackName}.` };
    }
    dimensions[dim.key] = {
      name_es: dim.fallbackName,
      description_es: dim.fallbackName,
      levels,
    };
  });

  return { version: "fallback", scale, dimensions };
}

function showHome(moveFocus = true) {
  el.evaluatorShell.classList.add("hidden");
  el.homeScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (moveFocus) document.getElementById("homeTitle").focus({ preventScroll: true });
}

function goToStep(step, moveFocus = true) {
  el.step1.classList.toggle("hidden", step !== 1);
  el.step2.classList.toggle("hidden", step !== 2);
  el.step3.classList.toggle("hidden", step !== 3);

  el.step1Nav.classList.toggle("hidden", step !== 1);
  el.step2Nav.classList.toggle("hidden", step !== 2);
  el.step3Nav.classList.toggle("hidden", step !== 3);

  el.stepBtn1.classList.toggle("active", step === 1);
  el.stepBtn2.classList.toggle("active", step === 2);
  el.stepBtn3.classList.toggle("active", step === 3);

  [el.stepBtn1, el.stepBtn2, el.stepBtn3].forEach((button, index) => {
    if (index + 1 === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  if (step === 3) renderCurrentEvalItem();

  if (moveFocus) {
    const heading = document.getElementById(`step${step}Title`);
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    announce(`Paso ${step} de 3`);
  }
}

function announce(message) {
  if (!el.statusRegion) return;
  el.statusRegion.textContent = "";
  window.requestAnimationFrame(() => {
    el.statusRegion.textContent = message;
  });
}

function updateStepLocks() {
  const hasLibrary = state.items.length > 0;
  const hasProfile = isProfileComplete(state.evaluatorProfile);

  el.stepBtn2.disabled = !hasLibrary;
  el.stepBtn3.disabled = !(hasLibrary && hasProfile);
  el.step1NextBtn.disabled = !hasLibrary;
}

function isProfileComplete(profile) {
  if (!profile) return false;
  return Array.isArray(profile.aacRelations) && profile.aacRelations.length > 0;
}

async function onLibraryFileChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    loadLibraryPayload(payload, file.name);
  } catch (error) {
    console.error(error);
    alert("No se pudo leer el JSON de biblioteca.");
  } finally {
    event.target.value = "";
  }
}

async function onLoadSampleLibrary(button) {
  const path = button.dataset.samplePath;
  if (!path) return;

  const previousLabel = button.innerHTML;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const fileName = path.split("/").pop() || "biblioteca-ejemplo.json";
    loadLibraryPayload(payload, fileName);
  } catch (error) {
    console.error(error);
    alert("No se pudo cargar la biblioteca de ejemplo.");
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.innerHTML = previousLabel;
  }
}

function loadLibraryPayload(payload, fileName) {
  const { items } = parseLibraryPayload(payload);
  if (!items.length) {
    alert("El archivo no contiene imágenes compatibles en row.bitmap, row.rawSvg o row.structuredSvg.");
    return;
  }

  const imageFormats = items.reduce((counts, item) => {
    counts[item.imageFormat] = (counts[item.imageFormat] || 0) + 1;
    return counts;
  }, {});

  state.items = items;
  state.library = {
    fileName,
    type: payload.type || "library_dump",
    version: payload.appVersion || payload.version || "desconocida",
    schemaVersion: payload.schemaVersion || null,
    name: payload.config && payload.config.name ? payload.config.name : "",
    model: payload.config && payload.config.generationModel ? payload.config.generationModel : "",
    timestamp: payload.timestamp || null,
    author: payload.config && (payload.config.credits || payload.config.author) ? (payload.config.credits || payload.config.author) : "",
    imageFormats,
    key: buildLibraryStorageKey(payload, items),
  };

  state.previewIndex = 0;
  state.evalIndex = 0;
  state.dimensionIndex = 0;
  state.assessment = null;
  state.evaluations = new Map();
  loadStoredEvaluations();
  if (!state.assessment) state.assessment = createAssessmentIdentity();

  renderLibrarySummary();
  renderPreview();
  updateStepLocks();
}

function parseLibraryPayload(payload) {
  const items = [];
  if (Array.isArray(payload.rows)) {
    payload.rows.forEach((row, index) => {
      const item = normalizeRowItem(row, index);
      if (item) items.push(item);
    });
  }
  return { items };
}

function normalizeRowItem(row, index) {
  const id = String(row.id || row.sourceRowId || `ROW_${index + 1}`);
  const utterance = String(row.UTTERANCE || row.utterance || row.prompt || `Item ${index + 1}`);
  const image = resolveRowImage(row);
  if (!image) return null;
  return { index, id, utterance, imageSrc: image.src, imageFormat: image.format };
}

function resolveRowImage(row) {
  const bitmap = normalizeImageSource(row.bitmap);
  if (bitmap) return { src: bitmap, format: "raster" };

  const svg = normalizeSvgSource(row.structuredSvg) || normalizeSvgSource(row.rawSvg);
  if (svg) return { src: svg, format: "SVG" };

  return null;
}

function normalizeImageSource(raw) {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (!value) return "";

  if (value.startsWith("data:")) {
    if (/^data:image\/svg\+xml/i.test(value)) return "";
    if (!/^data:image\/(jpeg|jpg|png|webp)/i.test(value)) return "";
    if (/;base64,/i.test(value)) {
      const commaIndex = value.indexOf(",");
      const prefix = value.slice(0, commaIndex + 1);
      const payload = value.slice(commaIndex + 1).replace(/\s+/g, "");
      return `${prefix}${payload}`;
    }
    return value;
  }

  if (/^https?:\/\//i.test(value)) return value;

  const looksBase64 = /^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 512;
  if (looksBase64) {
    return `data:image/jpeg;base64,${value.replace(/\s+/g, "")}`;
  }

  return "";
}

function normalizeSvgSource(raw) {
  if (typeof raw !== "string" || !raw.trim()) return "";

  const documentNode = new DOMParser().parseFromString(raw, "image/svg+xml");
  const root = documentNode.documentElement;
  if (!root || root.localName !== "svg" || documentNode.querySelector("parsererror")) return "";

  root.querySelectorAll("script, foreignObject, iframe, object, embed, audio, video").forEach((node) => node.remove());

  [root, ...root.querySelectorAll("*")].forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith("on")) {
        node.removeAttribute(attribute.name);
        return;
      }

      if (name === "href" || name === "xlink:href") {
        const isLocalReference = value.startsWith("#");
        const isEmbeddedRaster = /^data:image\/(?:png|jpeg|jpg|webp);/i.test(value);
        if (!isLocalReference && !isEmbeddedRaster) node.removeAttribute(attribute.name);
        return;
      }

      if (/url\s*\(/i.test(value) && !/url\s*\(\s*#[^)]+\)/i.test(value)) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  root.querySelectorAll("style").forEach((styleNode) => {
    if (/@import|url\s*\(\s*(?:['"]?https?:|['"]?\/\/|['"]?javascript:)/i.test(styleNode.textContent || "")) {
      styleNode.remove();
    }
  });

  if (!root.hasAttribute("xmlns")) root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const viewBox = (root.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
  if (viewBox.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0) {
    if (!root.hasAttribute("width")) root.setAttribute("width", String(viewBox[2]));
    if (!root.hasAttribute("height")) root.setAttribute("height", String(viewBox[3]));
  }
  const serialized = new XMLSerializer().serializeToString(root);
  return `data:image/svg+xml;base64,${utf8ToBase64(serialized)}`;
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function renderLibrarySummary() {
  if (!state.library) return;

  el.libraryStatus.textContent = `Biblioteca importada correctamente: ${state.items.length} pictogramas listos para evaluar.`;
  el.libraryStatus.classList.add("sr-only");
  el.step1Title.textContent = "Biblioteca lista";
  el.step1Instruction.textContent = "Comprueba una muestra y los datos esenciales antes de comenzar la evaluación.";
  el.step1NextBtn.textContent = "Usar esta biblioteca";
  el.libraryLoader.classList.add("hidden");
  el.libraryLoaded.classList.remove("hidden");
  el.loadedLibraryName.textContent = state.library.name || "Biblioteca sin nombre";
  el.loadedLibraryFile.textContent = state.library.fileName;

  const imageFormatsLabel = Object.entries(state.library.imageFormats)
    .map(([format, count]) => `${count} ${format}`)
    .join(" · ");
  const highlights = [
    ["Pictogramas", String(state.items.length)],
    ["Imágenes", imageFormatsLabel],
    ["Modelo", state.library.model || "No informado"],
    ["Formato", state.library.schemaVersion ? `PICTOS v${state.library.schemaVersion}` : "Legado"],
  ];
  el.libraryHighlights.innerHTML = highlights
    .map(([label, value]) => `<div class="library-highlight"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  const rows = [
    ["Biblioteca", state.library.name || "Sin nombre"],
    ["Archivo", state.library.fileName],
    ["Tipo", state.library.type],
    ["Formato", state.library.schemaVersion ? `PICTOS v${state.library.schemaVersion}` : "Legado"],
    ["Aplicación", state.library.version],
    ["Modelo", state.library.model || "No informado"],
    ["Elementos", String(state.items.length)],
    ["Imágenes", imageFormatsLabel],
    ["Autor", state.library.author || "No informado"],
    ["Timestamp", state.library.timestamp || "No informado"],
  ];

  el.librarySummary.innerHTML = `
    <table class="meta-table">
      <tbody>
        ${rows
          .map(
            ([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
  el.librarySummary.classList.remove("hidden");
  el.libraryPreview.classList.remove("hidden");
}

function changePreviewIndex(next) {
  if (next < 0 || next >= state.items.length) return;
  state.previewIndex = next;
  renderPreview();
}

function renderPreview() {
  if (!state.items.length) return;
  const item = state.items[state.previewIndex];

  setImage(el.previewImage, item.imageSrc, `Pictograma ${item.id}`);
  el.previewCounter.textContent = `${state.previewIndex + 1} / ${state.items.length}`;
  el.previewPrevBtn.disabled = state.previewIndex === 0;
  el.previewNextBtn.disabled = state.previewIndex === state.items.length - 1;
}

function onEvaluatorSubmit(event) {
  event.preventDefault();

  const profile = {
    aacRelations: getSelectedAacRelations(),
    savedAt: new Date().toISOString(),
  };

  if (!isProfileComplete(profile)) {
    alert("Completa todos los campos obligatorios del evaluador.");
    return;
  }

  state.evaluatorProfile = profile;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  persistEvaluations();
  updateStepLocks();
  goToStep(3);
}

function getSelectedAacRelations() {
  return el.evalAacRelationInputs.filter((input) => input.checked).map((input) => input.value);
}

function onAacRelationChange(event) {
  const specificInputs = el.evalAacRelationInputs.filter((input) => input !== el.evalAacNoExperience);

  if (event.target === el.evalAacNoExperience) {
    if (el.evalAacNoExperience.checked) {
      specificInputs.forEach((input) => {
        input.checked = false;
        input.disabled = true;
      });
      announce("Se seleccionó sin experiencia previa; se desactivaron las demás opciones.");
    } else {
      specificInputs.forEach((input) => {
        input.disabled = false;
      });
    }
    return;
  }

  if (event.target.checked && el.evalAacNoExperience.checked) {
    el.evalAacNoExperience.checked = false;
  }
}

function setAacRelations(relations) {
  const selected = new Set(relations);
  const noneSelected = selected.has("sin_experiencia");

  el.evalAacRelationInputs.forEach((input) => {
    input.checked = selected.has(input.value);
    input.disabled = input !== el.evalAacNoExperience && noneSelected;
  });
}

function migrateLegacyAacRelations(profile) {
  if (Array.isArray(profile.aacRelations)) return profile.aacRelations;

  const relations = [];
  if (profile.role === "usuario_pictogramas") relations.push("persona_usuaria");
  if (profile.role === "familiar_cuidador") relations.push("familiar_cuidador");
  if (profile.role === "profesional_caa") relations.push("profesional_caa");
  if (profile.role === "sin_dificultades_orales" && profile.aacExperience === "ninguna") {
    relations.push("sin_experiencia");
  }
  return relations;
}

function loadEvaluatorProfile() {
  const raw =
    localStorage.getItem(PROFILE_STORAGE_KEY) ||
    LEGACY_PROFILE_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!raw) return;

  try {
    const storedProfile = JSON.parse(raw);
    const profile = {
      aacRelations: migrateLegacyAacRelations(storedProfile),
      savedAt: storedProfile.savedAt || null,
    };
    state.evaluatorProfile = profile;
    setAacRelations(profile.aacRelations);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn("No se pudo cargar perfil de evaluador.", error);
  }
}

function changeEvalItem(nextIndex) {
  if (nextIndex < 0 || nextIndex >= state.items.length) return;
  state.evalIndex = nextIndex;
  renderCurrentEvalItem();
}

function renderCurrentEvalItem() {
  if (!state.items.length) return;

  const item = state.items[state.evalIndex];
  const record = ensureRecord(item.id);

  setImage(el.pragmaticImage, item.imageSrc, `Pictograma ${item.id}`);
  setImage(el.dimensionImage, item.imageSrc, `Pictograma ${item.id}`);

  el.realPhraseText.textContent = item.utterance;
  el.evalCounter.textContent = `${state.evalIndex + 1} / ${state.items.length}`;
  el.evalPrevBtn.disabled = state.evalIndex === 0;
  el.evalNextBtn.disabled = state.evalIndex === state.items.length - 1;

  updateEvaluationStatus();

  const hasGuess = Boolean(record.guess && record.guess.trim());
  const skipped = Boolean(record.guessSkipped);

  if (!hasGuess && !skipped) {
    setRealPhraseVisibility(false);
    el.interpretationStage.classList.remove("hidden");
    el.likertStage.classList.add("hidden");
    el.guessText.value = record.guess || "";
    el.saveAndNextBtn.disabled = true;
    updateSaveAndNextBtn({});
    return;
  }

  setRealPhraseVisibility(true);
  el.interpretationStage.classList.add("hidden");
  el.likertStage.classList.remove("hidden");

  const scores = normalizeScores(record.scores);
  const firstUnscoredIndex = DIMENSIONS.findIndex((dimension) => normalizeScore(scores[dimension.key]) === null);
  state.dimensionIndex = firstUnscoredIndex === -1 ? 0 : firstUnscoredIndex;
  setScoresToUI(scores);
  updateLikertPanels(scores);
  updateSaveAndNextBtn(scores);
}

function setRealPhraseVisibility(isVisible) {
  el.realPhraseSlot.classList.toggle("concealed", !isVisible);
  el.realPhraseSlot.setAttribute("aria-hidden", String(!isVisible));
}

function onSaveGuess() {
  if (!state.items.length) return;
  const guess = el.guessText.value.trim();

  if (!guess) {
    alert("Debes escribir qué comunica el pictograma o usar omitir.");
    return;
  }

  const item = state.items[state.evalIndex];
  const record = ensureRecord(item.id);
  record.guess = guess;
  record.guessSkipped = false;
  record.guessUpdatedAt = new Date().toISOString();
  record.scores = normalizeScores(record.scores);
  record.average = averageScore(record.scores);
  record.updatedAt = new Date().toISOString();

  state.evaluations.set(item.id, record);
  persistEvaluations();
  renderCurrentEvalItem();
}

function onSkipGuess() {
  if (!state.items.length) return;

  const item = state.items[state.evalIndex];
  const record = ensureRecord(item.id);
  record.guess = "";
  record.guessSkipped = true;
  record.guessUpdatedAt = new Date().toISOString();
  record.scores = normalizeScores(record.scores);
  record.average = averageScore(record.scores);
  record.updatedAt = new Date().toISOString();

  state.evaluations.set(item.id, record);
  persistEvaluations();
  renderCurrentEvalItem();
}

function onEditGuess() {
  if (!state.items.length) return;
  const item = state.items[state.evalIndex];
  const record = ensureRecord(item.id);

  record.guessSkipped = false;
  state.evaluations.set(item.id, record);
  persistEvaluations();

  el.guessText.value = record.guess || "";
  setRealPhraseVisibility(false);
  el.interpretationStage.classList.remove("hidden");
  el.likertStage.classList.add("hidden");
}

function clearCurrentEvaluation() {
  if (!state.items.length) return;
  const item = state.items[state.evalIndex];
  state.evaluations.delete(item.id);
  state.dimensionIndex = 0;
  persistEvaluations();
  renderCurrentEvalItem();
}

function buildSliders() {
  el.slidersContainer.innerHTML = "";

  DIMENSIONS.forEach((dimension, dimensionIndex) => {
    const meta = getDimensionMeta(dimension.key);

    const card = document.createElement("article");
    card.className = "dimension-card hidden";
    card.dataset.dimensionIndex = String(dimensionIndex);

    const scale = document.createElement("div");
    scale.className = "radio-scale";
    scale.setAttribute("role", "radiogroup");
    scale.setAttribute("aria-label", meta.name);

    for (let score = 1; score <= 5; score += 1) {
      const option = document.createElement("label");
      option.className = "radio-option";

      const number = document.createElement("span");
      number.className = "radio-number";
      number.textContent = String(score);

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `score-${dimension.key}`;
      radio.value = String(score);
      radio.dataset.key = dimension.key;
      const scaleMeta = getScaleMeta(score);
      radio.setAttribute("aria-label", `${score} de 5: ${scaleMeta.label}`);
      radio.addEventListener("change", onDimensionScoreChange);

      option.append(number, radio);
      scale.append(option);
    }

    card.append(scale);
    el.slidersContainer.append(card);
  });
}

function changeDimension(offset) {
  const nextIndex = state.dimensionIndex + offset;
  if (nextIndex < 0 || nextIndex >= DIMENSIONS.length) return;
  state.dimensionIndex = nextIndex;
  renderActiveDimension(readScoresFromUI());
  el.activeDimensionTitle.focus({ preventScroll: true });
}

function renderActiveDimension(scores) {
  const dimension = DIMENSIONS[state.dimensionIndex];
  const meta = getDimensionMeta(dimension.key);
  const cards = Array.from(el.slidersContainer.querySelectorAll(".dimension-card"));

  cards.forEach((card, index) => card.classList.toggle("hidden", index !== state.dimensionIndex));
  el.dimensionCounter.textContent = `Dimensión ${state.dimensionIndex + 1} de ${DIMENSIONS.length}`;
  el.activeDimensionTitle.textContent = meta.name;
  el.activeDimensionDescription.textContent = meta.description;
  el.activeDimensionTitle.tabIndex = -1;
  el.dimensionPrevBtn.disabled = state.dimensionIndex === 0;
  el.dimensionNextBtn.disabled = state.dimensionIndex === DIMENSIONS.length - 1;
  renderRubricDetails(scores);
}

function onDimensionScoreChange() {
  const item = state.items[state.evalIndex];
  if (!item) return;

  const scores = readScoresFromUI();
  const record = ensureRecord(item.id);
  record.scores = scores;
  record.average = averageScore(scores);
  record.updatedAt = new Date().toISOString();

  state.evaluations.set(item.id, record);
  persistEvaluations();
  updateLikertPanels(scores);
  updateSaveAndNextBtn(scores);
  updateEvaluationStatus();
}

function updateEvaluationStatus() {
  const completed = countCompletedItems();
  const isComplete = state.items.length > 0 && completed === state.items.length;
  el.evalProgress.textContent = `${completed} evaluados de ${state.items.length}`;
  el.exportJsonLabel.textContent = isComplete
    ? "Descargar evaluación completa"
    : "Descargar evaluación parcial";
  el.exportJsonBtn.setAttribute(
    "aria-label",
    isComplete ? "Descargar evaluación completa" : "Descargar evaluación parcial",
  );
}

function updateSaveAndNextBtn(scores) {
  const allScored = hasAllDimensionsScored(scores);
  const isLast = state.evalIndex >= state.items.length - 1;
  el.saveAndNextBtn.disabled = !allScored;
  el.saveAndNextBtn.textContent = isLast
    ? `Guardar evaluación (${state.evalIndex + 1}/${state.items.length})`
    : `Guardar evaluación y pasar a la siguiente (${state.evalIndex + 1}/${state.items.length})`;
}

function onSaveAndNext() {
  if (state.evalIndex < state.items.length - 1) {
    changeEvalItem(state.evalIndex + 1);
  }
}

function updateLikertPanels(scores) {
  syncRadioSelectionStyles();

  drawHexChart(scores);
  renderActiveDimension(scores);

  const avg = averageScore(scores);
  if (avg === null) {
    el.scoreBadge.textContent = "PICTOS Index —";
    el.scoreBadge.style.backgroundColor = "#6b7280";
    el.scoreBadge.style.color = getContrastingTextColor("#6b7280");
    return;
  }

  const rounded = normalizeScore(Math.round(avg));
  const badgeColor = getScaleMeta(rounded).color;
  el.scoreBadge.textContent = `PICTOS Index ${avg.toFixed(2)}`;
  el.scoreBadge.style.backgroundColor = badgeColor;
  el.scoreBadge.style.color = getContrastingTextColor(badgeColor);
}

function getContrastingTextColor(backgroundColor) {
  const hex = String(backgroundColor).trim().replace(/^#/, "");
  const normalized = hex.length === 3 ? hex.split("").map((value) => value + value).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "#ffffff";

  const channels = normalized.match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const darkContrast = (luminance + 0.05) / 0.05;
  const lightContrast = 1.05 / (luminance + 0.05);
  return darkContrast >= lightContrast ? "#0b0613" : "#ffffff";
}

function renderRubricDetails(scores) {
  el.rubricDetails.innerHTML = "";
  const dimension = DIMENSIONS[state.dimensionIndex];
  const score = normalizeScore(scores[dimension.key]);
  const meta = getDimensionMeta(dimension.key);
  const card = document.createElement("article");
  card.className = "rubric-item";

  if (score === null) {
    card.innerHTML = `<h4>${escapeHtml(meta.name)} · Sin evaluar</h4><p>Selecciona una nota para ver qué significa en esta dimensión.</p>`;
  } else {
    const scaleMeta = getScaleMeta(score);
    const rubricText = getDimensionLevelText(dimension.key, score);
    card.innerHTML = `
      <h4>${escapeHtml(meta.name)} · ${score}/5 (${escapeHtml(scaleMeta.label)})</h4>
      <p>${escapeHtml(rubricText)}</p>
    `;
  }
  el.rubricDetails.append(card);
}

function drawHexChart(scores) {
  const canvas = el.hexChart;
  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2 + 8;
  const radius = Math.min(width, height) * 0.34;

  ctx.clearRect(0, 0, width, height);

  for (let level = 1; level <= 5; level += 1) {
    const points = DIMENSIONS.map((_, i) => polarPoint(cx, cy, (radius * level) / 5, i, DIMENSIONS.length));
    strokePolygon(ctx, points, level === 5 ? "#72558f" : "#38264d", level === 5 ? 0 : 3);
  }

  DIMENSIONS.forEach((dimension, index) => {
    const edge = polarPoint(cx, cy, radius, index, DIMENSIONS.length);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(edge.x, edge.y);
    ctx.strokeStyle = "#38264d";
    ctx.stroke();

    const label = polarPoint(cx, cy, radius + 20, index, DIMENSIONS.length);
    ctx.fillStyle = "#d8cfe3";
    ctx.font = "600 12px Lexend, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dimension.code, label.x, label.y);
  });

  const ratedPoints = DIMENSIONS.map((dimension, index) => {
    const value = normalizeScore(scores[dimension.key]);
    if (value === null) return null;
    return {
      index,
      point: polarPoint(cx, cy, (radius * value) / 5, index, DIMENSIONS.length),
    };
  }).filter(Boolean);

  if (ratedPoints.length >= 3) {
    ctx.beginPath();
    ratedPoints.forEach((entry, idx) => {
      if (idx === 0) ctx.moveTo(entry.point.x, entry.point.y);
      else ctx.lineTo(entry.point.x, entry.point.y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(157, 107, 255, 0.22)";
    ctx.strokeStyle = "#b794ff";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  } else if (ratedPoints.length === 2) {
    ctx.beginPath();
    ctx.moveTo(ratedPoints[0].point.x, ratedPoints[0].point.y);
    ctx.lineTo(ratedPoints[1].point.x, ratedPoints[1].point.y);
    ctx.strokeStyle = "#b794ff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ratedPoints.forEach((entry) => {
    ctx.beginPath();
    ctx.arc(entry.point.x, entry.point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = AXIS_COLORS[entry.index];
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });
}

function readScoresFromUI() {
  const scores = {};
  DIMENSIONS.forEach((dimension) => {
    const selected = document.querySelector(`input[name="score-${dimension.key}"]:checked`);
    scores[dimension.key] = selected ? normalizeScore(selected.value) : null;
  });
  return scores;
}

function setScoresToUI(scores) {
  DIMENSIONS.forEach((dimension) => {
    const selectedScore = normalizeScore(scores ? scores[dimension.key] : null);
    const radios = document.querySelectorAll(`input[name="score-${dimension.key}"]`);
    radios.forEach((radio) => {
      radio.checked = selectedScore !== null && Number(radio.value) === selectedScore;
    });
  });
  syncRadioSelectionStyles();
}

function normalizeScores(rawScores) {
  const normalized = {};
  DIMENSIONS.forEach((dimension) => {
    normalized[dimension.key] = normalizeScore(rawScores ? rawScores[dimension.key] : null);
  });
  return normalized;
}

function ensureRecord(itemId) {
  const existing = state.evaluations.get(itemId);
  if (existing) return existing;

  const record = {
    itemId,
    guess: "",
    guessSkipped: false,
    guessUpdatedAt: null,
    scores: null,
    average: null,
    updatedAt: null,
  };
  state.evaluations.set(itemId, record);
  return record;
}

function averageScore(scores) {
  const ratedValues = DIMENSIONS.map((dimension) => normalizeScore(scores ? scores[dimension.key] : null)).filter(
    (value) => value !== null,
  );
  if (!ratedValues.length) return null;
  const total = ratedValues.reduce((acc, value) => acc + value, 0);
  return total / ratedValues.length;
}

function normalizeScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function countRatedDimensions(scores) {
  return DIMENSIONS.reduce((count, dimension) => {
    return count + (normalizeScore(scores ? scores[dimension.key] : null) !== null ? 1 : 0);
  }, 0);
}

function hasAllDimensionsScored(scores) {
  return countRatedDimensions(scores) === DIMENSIONS.length;
}

function syncRadioSelectionStyles() {
  DIMENSIONS.forEach((dimension) => {
    const options = document.querySelectorAll(`input[name="score-${dimension.key}"]`);
    options.forEach((input) => {
      const label = input.closest(".radio-option");
      if (!label) return;
      label.classList.toggle("active", input.checked);
    });
  });
}

function polarPoint(cx, cy, radius, index, total) {
  const angle = -Math.PI / 2 + (index * (Math.PI * 2)) / total;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function strokePolygon(ctx, points, strokeColor, dashLength) {
  if (!points.length) return;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.strokeStyle = strokeColor;
  if (dashLength > 0) ctx.setLineDash([dashLength, dashLength]);
  else ctx.setLineDash([]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function getDimensionMeta(key) {
  const raw = state.rubric && state.rubric.dimensions ? state.rubric.dimensions[key] : null;
  const fallback = DIMENSIONS.find((d) => d.key === key);
  return {
    name: raw && raw.name_es ? raw.name_es : fallback.fallbackName,
    description: raw && raw.description_es ? raw.description_es : fallback.fallbackName,
  };
}

function getDimensionLevelText(key, score) {
  const raw = state.rubric && state.rubric.dimensions ? state.rubric.dimensions[key] : null;
  const level = raw && raw.levels ? raw.levels[String(score)] : null;
  return level && level.text_es ? level.text_es : "Sin descripción para este nivel.";
}

function getScaleMeta(score) {
  const raw = state.rubric && state.rubric.scale ? state.rubric.scale[String(score)] : null;
  return {
    label: raw && raw.label_es ? raw.label_es : `Nivel ${score}`,
    general: raw && raw.general_es ? raw.general_es : "",
    color: raw && raw.color ? raw.color : "#111827",
  };
}

function buildLibraryStorageKey(payload, items) {
  const basis = [
    payload.type || "",
    payload.schemaVersion || payload.version || "",
    payload.appVersion || "",
    payload.timestamp || "",
    String(items.length),
    items[0] ? items[0].id : "",
    items[items.length - 1] ? items[items.length - 1].id : "",
  ].join("|");

  let hash = 0;
  for (let i = 0; i < basis.length; i += 1) {
    hash = (hash << 5) - hash + basis.charCodeAt(i);
    hash |= 0;
  }

  return `k${Math.abs(hash)}`;
}

function persistEvaluations() {
  if (!state.library) return;
  const key = LIBRARY_STORAGE_PREFIX + state.library.key;
  if (!state.assessment) state.assessment = createAssessmentIdentity();
  if (!state.assessment.completedAt && state.items.length > 0 && countCompletedItems() === state.items.length) {
    state.assessment.completedAt = new Date().toISOString();
  }
  const payload = {
    savedAt: new Date().toISOString(),
    assessment: state.assessment,
    evaluations: Array.from(state.evaluations.values()),
  };
  localStorage.setItem(key, JSON.stringify(payload));
}

function loadStoredEvaluations() {
  if (!state.library) return;
  const key = LIBRARY_STORAGE_PREFIX + state.library.key;
  const raw = localStorage.getItem(key);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (isValidAssessmentIdentity(parsed.assessment)) state.assessment = parsed.assessment;
    const map = new Map();
    if (Array.isArray(parsed.evaluations)) {
      parsed.evaluations.forEach((record) => {
        if (!record || !record.itemId) return;
        map.set(record.itemId, record);
      });
    }
    state.evaluations = map;
  } catch (error) {
    console.warn("No se pudieron recuperar evaluaciones guardadas.", error);
  }
}

function createAssessmentIdentity() {
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `eval-${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(2)).join("-")}`;
  return {
    id,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

function isValidAssessmentIdentity(value) {
  return Boolean(value && typeof value.id === "string" && value.id && typeof value.startedAt === "string");
}

function countCompletedItems() {
  let count = 0;
  state.items.forEach((item) => {
    const record = state.evaluations.get(item.id);
    if (record && hasAllDimensionsScored(record.scores)) count += 1;
  });
  return count;
}

function exportEvaluationJson() {
  if (!state.library || !state.items.length) {
    alert("Primero carga una biblioteca.");
    return;
  }

  if (!isProfileComplete(state.evaluatorProfile)) {
    alert("Primero completa los datos del evaluador.");
    return;
  }

  const items = state.items.map((item, index) => {
    const record = state.evaluations.get(item.id) || null;
    return {
      index: index + 1,
      itemId: item.id,
      utterance: item.utterance,
      comprension_pragmatica: {
        estado: record ? (record.guessSkipped ? "omitida" : record.guess ? "respondida" : "pendiente") : "pendiente",
        respuesta: record && record.guess ? record.guess : "",
      },
      scores: record && record.scores ? normalizeScores(record.scores) : null,
      average:
        record && record.scores
          ? (() => {
              const avg = averageScore(record.scores);
              return avg === null ? null : Number(avg.toFixed(3));
            })()
          : null,
      updatedAt: record ? record.updatedAt : null,
    };
  });

  const payload = {
    schemaVersion: "pictos-index-library-evaluation-1.3.0",
    exportedAt: new Date().toISOString(),
    evaluation: state.assessment || createAssessmentIdentity(),
    library: state.library,
    evaluator: state.evaluatorProfile,
    summary: buildSummary(),
    items,
  };

  const baseName = sanitizeFilename((state.library.fileName || "library").replace(/\.json$/i, ""));
  const completion = countCompletedItems() === state.items.length ? "complete" : "partial";
  const outName = `${baseName}-pictos-index-eval-${completion}-${new Date().toISOString().slice(0, 10)}.json`;
  downloadJson(payload, outName);
}

function buildSummary() {
  const evaluatedRecords = Array.from(state.evaluations.values()).filter(
    (record) => record && countRatedDimensions(record.scores) > 0,
  );
  const completedItems = countCompletedItems();
  const dimensionAverages = {};

  DIMENSIONS.forEach((dimension) => {
    const values = evaluatedRecords
      .map((record) => normalizeScore(record.scores ? record.scores[dimension.key] : null))
      .filter((value) => value !== null);
    if (!values.length) {
      dimensionAverages[dimension.key] = null;
      return;
    }
    const sum = values.reduce((acc, value) => acc + value, 0);
    dimensionAverages[dimension.key] = Number((sum / values.length).toFixed(3));
  });

  const overallValues = evaluatedRecords
    .map((record) => averageScore(record.scores))
    .filter((value) => value !== null);
  const overall =
    overallValues.length > 0
      ? Number((overallValues.reduce((acc, value) => acc + value, 0) / overallValues.length).toFixed(3))
      : null;

  return {
    totalItems: state.items.length,
    completedItems,
    completionRate: state.items.length ? Number(((completedItems / state.items.length) * 100).toFixed(2)) : 0,
    overallAverage: overall,
    dimensionAverages,
  };
}

function setImage(imgEl, source, label) {
  const fallback = createPlaceholder(label || "Pictograma sin imagen");
  imgEl.onerror = () => {
    if (imgEl.src !== fallback) imgEl.src = fallback;
  };
  imgEl.src = source || fallback;
}

function createPlaceholder(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.fillStyle = "#6b7280";
  ctx.font = "600 30px Lexend, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL("image/png");
}

function downloadJson(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function sanitizeFilename(value) {
  return value.replace(/[^a-z0-9._-]/gi, "_").replace(/_+/g, "_");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
