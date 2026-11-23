import { applyTranslations, getLocale, initI18n, setLocale, t } from "./i18n.js";

const DIMENSIONS = [
  { key: "clarity", code: "CLA" },
  { key: "recognizability", code: "REC" },
  { key: "semantic_transparency", code: "SEM" },
  { key: "pragmatic_fit", code: "PRA" },
  { key: "cultural_adequacy", code: "CUL" },
  { key: "cognitive_accessibility", code: "COG" },
];

const AXIS_COLORS = ["#2563eb", "#0d9488", "#d97706", "#9333ea", "#e11d48", "#16a34a"];
const PROFILE_STORAGE_KEY = "pictos-index:evaluator-profile:v5";
const LEGACY_PROFILE_STORAGE_KEYS = ["pictos-index:evaluator-profile:v4", "pictos-index:evaluator-profile:v3"];
const LIBRARY_STORAGE_PREFIX = "pictos-index:library-evals:v3:";
const LIBRARY_DIMENSIONS = ["coherence", "grammar"];

// Experimental protocol: a coordinator hands out links with ?forma=A or ?forma=B.
// The library is split into two halves with a seed derived from the library itself,
// so every browser draws the same split without a server. Form A interprets half 1
// blind and rates half 2 with the phrase visible; form B does the reverse. The phrase
// of a blind item is never revealed in the session, so the two constructs do not
// contaminate each other. Without ?forma the app keeps the individual flow.
const PROTOCOL_VERSION = "protocolo-experimental-0.1";
const PROTOCOL_FORM = (() => {
  const form = new URLSearchParams(window.location.search).get("forma")?.toUpperCase();
  return form === "A" || form === "B" ? form : null;
})();

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
  libraryAssessment: createEmptyLibraryAssessment(),
};

const el = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await initI18n();
  bindElements();
  applyTranslations();
  el.languageSelect.value = getLocale();
  bindEvents();
  state.rubric = await loadRubric();
  buildSliders();
  buildLibraryScales();
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
  el.languageSelect = document.getElementById("languageSelect");

  el.stepBtn1 = document.getElementById("stepBtn1");
  el.stepBtn2 = document.getElementById("stepBtn2");
  el.stepBtn3 = document.getElementById("stepBtn3");
  el.stepBtn4 = document.getElementById("stepBtn4");

  el.step1 = document.getElementById("step1");
  el.step1Title = document.getElementById("step1Title");
  el.step1Instruction = document.getElementById("step1Instruction");
  el.step2 = document.getElementById("step2");
  el.step3 = document.getElementById("step3");
  el.step4 = document.getElementById("step4");
  el.step1Nav = document.getElementById("step1Nav");
  el.step2Nav = document.getElementById("step2Nav");
  el.step3Nav = document.getElementById("step3Nav");
  el.step4Nav = document.getElementById("step4Nav");

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
  el.pictogramPosition = document.getElementById("pictogramPosition");
  el.evalPrevBtn = document.getElementById("evalPrevBtn");
  el.evalProgress = document.getElementById("evalProgress");
  el.evaluationStateLabel = document.getElementById("evaluationStateLabel");
  el.exportJsonBtn = document.getElementById("exportJsonBtn");
  el.exportJsonLabel = document.getElementById("exportJsonLabel");

  el.realPhraseLabel = document.getElementById("realPhraseLabel");
  el.realPhraseText = document.getElementById("realPhraseText");
  el.passNotice = document.getElementById("passNotice");
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

  el.evalNextBtn = document.getElementById("evalNextBtn");
  el.evalNextLabel = document.getElementById("evalNextLabel");

  el.slidersContainer = document.getElementById("slidersContainer");
  el.rubricDetails = document.getElementById("rubricDetails");
  el.dimensionPrevBtn = document.getElementById("dimensionPrevBtn");
  el.dimensionNextBtn = document.getElementById("dimensionNextBtn");
  el.dimensionCounter = document.getElementById("dimensionCounter");
  el.activeDimensionTitle = document.getElementById("activeDimensionTitle");
  el.activeDimensionDescription = document.getElementById("activeDimensionDescription");
  el.scalePrompt = document.getElementById("scalePrompt");
  el.hexChart = document.getElementById("hexChart");
  el.scoreBadge = document.getElementById("scoreBadge");

  el.auditGrid = document.getElementById("auditGrid");
  el.auditOrderInputs = Array.from(document.querySelectorAll('input[name="auditOrder"]'));
  el.auditLabelsToggle = document.getElementById("auditLabelsToggle");
  el.auditLabelsText = el.auditLabelsToggle.closest("label")?.querySelector("span");
  el.coherenceScale = document.getElementById("coherenceScale");
  el.grammarScale = document.getElementById("grammarScale");
  el.coherenceDescription = document.getElementById("coherenceDescription");
  el.grammarDescription = document.getElementById("grammarDescription");
  el.step4BackBtn = document.getElementById("step4BackBtn");
  el.auditExportBtn = document.getElementById("auditExportBtn");
  el.auditPdfBtn = document.getElementById("auditPdfBtn");
}

function bindEvents() {
  el.languageSelect.addEventListener("change", onLanguageChange);
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
  el.stepBtn4.addEventListener("click", () => {
    if (!el.stepBtn4.disabled) goToStep(4);
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
  el.step4BackBtn.addEventListener("click", () => goToStep(3));
  el.evalPrevBtn.addEventListener("click", () => changeEvalItem(state.evalIndex - 1));
  el.dimensionPrevBtn.addEventListener("click", () => changeDimension(-1));
  el.dimensionNextBtn.addEventListener("click", () => changeDimension(1));

  el.saveGuessBtn.addEventListener("click", onSaveGuess);
  el.skipGuessBtn.addEventListener("click", onSkipGuess);
  el.editGuessBtn.addEventListener("click", onEditGuess);
  el.clearEvalBtn.addEventListener("click", clearCurrentEvaluation);
  el.evalNextBtn.addEventListener("click", advanceToNextPictogram);

  el.exportJsonBtn.addEventListener("click", exportEvaluationJson);
  el.auditExportBtn.addEventListener("click", exportEvaluationJson);
  el.auditPdfBtn.addEventListener("click", exportEvaluationPdf);
  el.auditOrderInputs.forEach((input) => input.addEventListener("change", renderAuditGrid));
  el.auditLabelsToggle.addEventListener("change", renderAuditGrid);
  document.addEventListener("keydown", onEvaluationKeydown);
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
  return {
    version: "fallback",
    scale: {
      "1": { color: "#dc2626" },
      "2": { color: "#ea580c" },
      "3": { color: "#d97706" },
      "4": { color: "#65a30d" },
      "5": { color: "#16a34a" },
    },
    dimensions: {},
  };
}

function onLanguageChange(event) {
  if (!setLocale(event.target.value)) return;
  applyTranslations();
  buildSliders();
  buildLibraryScales();

  if (state.library) {
    renderLibrarySummary();
    renderPreview();
  }
  if (state.items.length && !el.step3.classList.contains("hidden")) renderCurrentEvalItem(true);
  if (state.items.length && !el.step4.classList.contains("hidden")) renderLibraryAudit();
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
  el.step4.classList.toggle("hidden", step !== 4);

  el.step1Nav.classList.toggle("hidden", step !== 1);
  el.step2Nav.classList.toggle("hidden", step !== 2);
  el.step3Nav.classList.toggle("hidden", step !== 3);
  el.step4Nav.classList.toggle("hidden", step !== 4);

  el.stepBtn1.classList.toggle("active", step === 1);
  el.stepBtn2.classList.toggle("active", step === 2);
  el.stepBtn3.classList.toggle("active", step === 3);
  el.stepBtn4.classList.toggle("active", step === 4);

  [el.stepBtn1, el.stepBtn2, el.stepBtn3, el.stepBtn4].forEach((button, index) => {
    if (index + 1 === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  if (step === 3) renderCurrentEvalItem();
  if (step === 4) renderLibraryAudit();

  if (moveFocus) {
    const heading = document.getElementById(`step${step}Title`);
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    announce(t("status.step", { step }));
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
  const pictogramsComplete = hasLibrary && countCompletedItems() === state.items.length;

  el.stepBtn2.disabled = !hasLibrary;
  el.stepBtn3.disabled = !(hasLibrary && hasProfile);
  el.stepBtn4.disabled = !(hasLibrary && hasProfile && pictogramsComplete);
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
    alert(t("alerts.invalidJson"));
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
    const fileName = path.split("/").pop() || "sample-library.json";
    loadLibraryPayload(payload, fileName);
  } catch (error) {
    console.error(error);
    alert(t("alerts.sampleLoad"));
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.innerHTML = previousLabel;
  }
}

function loadLibraryPayload(payload, fileName) {
  const { items } = parseLibraryPayload(payload);
  if (!items.length) {
    alert(t("alerts.noImages"));
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
    version: payload.appVersion || payload.version || "",
    schemaVersion: payload.schemaVersion || null,
    name: payload.config && payload.config.name ? payload.config.name : "",
    model: payload.config && payload.config.generationModel ? payload.config.generationModel : "",
    timestamp: payload.timestamp || null,
    author: payload.config && (payload.config.credits || payload.config.author) ? (payload.config.credits || payload.config.author) : "",
    imageFormats,
    domainContext: String(payload.config?.domainContext || "").trim() || null,
    key: buildLibraryStorageKey(payload, items) + (PROTOCOL_FORM ? `:${PROTOCOL_VERSION}:${PROTOCOL_FORM}` : ""),
  };

  state.previewIndex = 0;
  state.evalIndex = 0;
  state.dimensionIndex = 0;
  state.assessment = null;
  state.evaluations = new Map();
  state.libraryAssessment = createEmptyLibraryAssessment();
  state.protocol = null;
  loadStoredEvaluations();
  if (!state.assessment) state.assessment = createAssessmentIdentity();
  if (PROTOCOL_FORM) applyProtocolPlan(payload);

  renderLibrarySummary();
  renderPreview();
  updateStepLocks();
}

// Reorders state.items into the two passes and tags each item with its pass.
function applyProtocolPlan(payload) {
  if (!Number.isInteger(state.assessment.orderSeed)) {
    state.assessment.orderSeed = crypto.getRandomValues(new Uint32Array(1))[0];
  }
  const partitionSeed = hashToUint32(buildLibraryStorageKey(payload, state.items));
  const split = seededShuffle(state.items, partitionSeed);
  const half1 = split.slice(0, Math.ceil(split.length / 2));
  const half2 = split.slice(half1.length);
  const [blind, sighted] = PROTOCOL_FORM === "A" ? [half1, half2] : [half2, half1];
  const order = mulberry32(state.assessment.orderSeed);
  state.items = [
    ...seededShuffle(blind, order).map((item) => ({ ...item, pass: "blind" })),
    ...seededShuffle(sighted, order).map((item) => ({ ...item, pass: "sighted" })),
  ];
  state.protocol = {
    version: PROTOCOL_VERSION,
    form: PROTOCOL_FORM,
    partitionSeed,
    orderSeed: state.assessment.orderSeed,
    halves: { 1: half1.map((item) => item.id), 2: half2.map((item) => item.id) },
    sequence: state.items.map((item, position) => ({ itemId: item.id, pass: item.pass, position: position + 1 })),
  };
  // Resume at the first unfinished item: after a reload, someone in the second pass
  // must not land back on the blind items.
  const resumeAt = state.items.findIndex((item) => !isRecordComplete(state.evaluations.get(item.id)));
  state.evalIndex = resumeAt === -1 ? state.items.length - 1 : resumeAt;
  persistEvaluations();
}

function hashToUint32(text) {
  let hash = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return hash >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), a | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates over a copy; takes a seed or an already running generator.
function seededShuffle(list, seedOrRandom) {
  const random = typeof seedOrRandom === "function" ? seedOrRandom : mulberry32(seedOrRandom);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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
  const utterance = String(row.UTTERANCE || row.utterance || row.prompt || t("evaluation.itemFallback", { number: index + 1 }));
  const image = resolveRowImage(row);
  if (!image) return null;
  const category = String(row.NLU?.domain || row.domain || row.category || "").trim();
  return { index, id, utterance, category, imageSrc: image.src, imageFormat: image.format };
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

  el.libraryStatus.textContent = t("library.successStatus", { count: state.items.length });
  el.libraryStatus.classList.add("sr-only");
  el.step1Title.textContent = t("library.ready");
  el.step1Instruction.textContent = t("library.confirmation");
  el.step1NextBtn.textContent = t("library.use");
  el.libraryLoader.classList.add("hidden");
  el.libraryLoaded.classList.remove("hidden");
  el.loadedLibraryName.textContent = state.library.name || t("library.untitled");
  el.loadedLibraryFile.textContent = state.library.fileName;

  const imageFormatsLabel = Object.entries(state.library.imageFormats)
    .map(([format, count]) => `${count} ${format}`)
    .join(" · ");
  const highlights = [
    [t("library.highlights.pictograms"), String(state.items.length)],
    [t("library.highlights.images"), imageFormatsLabel],
    [t("library.highlights.model"), state.library.model || t("library.notReported")],
    [t("library.highlights.format"), state.library.schemaVersion ? `PICTOS v${state.library.schemaVersion}` : t("library.legacy")],
  ];
  el.libraryHighlights.innerHTML = highlights
    .map(([label, value]) => `<div class="library-highlight"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  const rows = [
    [t("library.metadata.library"), state.library.name || t("library.noName")],
    [t("library.metadata.file"), state.library.fileName],
    [t("library.metadata.type"), state.library.type],
    [t("library.metadata.format"), state.library.schemaVersion ? `PICTOS v${state.library.schemaVersion}` : t("library.legacy")],
    [t("library.metadata.application"), state.library.version || t("library.unknown")],
    [t("library.metadata.model"), state.library.model || t("library.notReported")],
    [t("library.metadata.items"), String(state.items.length)],
    [t("library.metadata.images"), imageFormatsLabel],
    [t("library.metadata.author"), state.library.author || t("library.notReported")],
    [t("library.metadata.timestamp"), state.library.timestamp || t("library.notReported")],
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

  setImage(el.previewImage, item.imageSrc, `${t("library.previewAlt")} ${item.id}`);
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
    alert(t("profile.required"));
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
      announce(t("profile.exclusiveAnnouncement"));
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

function renderCurrentEvalItem(preserveDimension = false) {
  if (!state.items.length) return;

  const item = state.items[state.evalIndex];
  const record = ensureRecord(item.id);

  setImage(el.pragmaticImage, item.imageSrc, `${t("evaluation.imageAlt")} ${item.id}`);
  setImage(el.dimensionImage, item.imageSrc, `${t("evaluation.dimensionImageAlt")} ${item.id}`);

  // A blind item's phrase is kept out of the DOM, not just hidden.
  el.realPhraseText.textContent = item.pass === "blind" ? "" : item.utterance;
  el.pictogramPosition.textContent = t("evaluation.pictogramPosition", {
    current: state.evalIndex + 1,
    total: state.items.length,
  });
  const firstSighted = state.items.findIndex((candidate) => candidate.pass === "sighted");
  el.evalPrevBtn.disabled = state.evalIndex === 0 || state.evalIndex === firstSighted;
  renderPassNotice(item, state.evalIndex === firstSighted);

  updateEvaluationStatus();
  updateStepLocks();

  if (item.pass === "blind") {
    setRealPhraseVisibility(false);
    el.interpretationStage.classList.remove("hidden");
    el.likertStage.classList.add("hidden");
    el.guessText.value = record.guess || "";
    const answered = Boolean(record.guessSkipped || (record.guess && record.guess.trim()));
    el.evalNextBtn.disabled = !answered;
    el.evalNextBtn.classList.toggle("ready", answered);
    setNextLabel();
    return;
  }

  el.editGuessBtn.classList.toggle("hidden", item.pass === "sighted");
  if (item.pass === "sighted") {
    setRealPhraseVisibility(true);
    el.interpretationStage.classList.add("hidden");
    el.likertStage.classList.remove("hidden");
    const scores = normalizeScores(record.scores);
    const firstUnscoredIndex = DIMENSIONS.findIndex((dimension) => normalizeScore(scores[dimension.key]) === null);
    if (!preserveDimension) state.dimensionIndex = firstUnscoredIndex === -1 ? 0 : firstUnscoredIndex;
    setScoresToUI(scores);
    updateLikertPanels(scores);
    updatePictogramNavigation(scores);
    return;
  }

  const hasGuess = Boolean(record.guess && record.guess.trim());
  const skipped = Boolean(record.guessSkipped);

  if (!hasGuess && !skipped) {
    setRealPhraseVisibility(false);
    el.interpretationStage.classList.remove("hidden");
    el.likertStage.classList.add("hidden");
    el.guessText.value = record.guess || "";
    el.evalNextBtn.disabled = true;
    updatePictogramNavigation({});
    return;
  }

  setRealPhraseVisibility(true);
  el.interpretationStage.classList.add("hidden");
  el.likertStage.classList.remove("hidden");

  const scores = normalizeScores(record.scores);
  const firstUnscoredIndex = DIMENSIONS.findIndex((dimension) => normalizeScore(scores[dimension.key]) === null);
  if (!preserveDimension) state.dimensionIndex = firstUnscoredIndex === -1 ? 0 : firstUnscoredIndex;
  setScoresToUI(scores);
  updateLikertPanels(scores);
  updatePictogramNavigation(scores);
}

function renderPassNotice(item, isTransition) {
  const parts = [];
  if (item.pass) {
    parts.push(t("evaluation.protocolForm", { form: PROTOCOL_FORM }));
    parts.push(t(item.pass === "blind" ? "evaluation.passBlind" : "evaluation.passSighted"));
  }
  if (state.library?.domainContext) parts.push(t("evaluation.domainContext", { context: state.library.domainContext }));
  if (isTransition) parts.unshift(t("evaluation.passSightedStart"));
  el.passNotice.textContent = parts.join(" · ");
  el.passNotice.classList.toggle("hidden", parts.length === 0);
  el.passNotice.classList.toggle("transition", isTransition);
  if (isTransition) announce(t("evaluation.passSightedStart"));
}

function setRealPhraseVisibility(isVisible) {
  el.realPhraseSlot.classList.toggle("concealed", !isVisible);
  el.realPhraseSlot.setAttribute("aria-hidden", String(!isVisible));
}

function onSaveGuess() {
  if (!state.items.length) return;
  const guess = el.guessText.value.trim();

  if (!guess) {
    alert(t("evaluation.guessRequired"));
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
  if (item.pass === "blind") el.evalNextBtn.focus({ preventScroll: true });
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
  if (item.pass === "blind") el.evalNextBtn.focus({ preventScroll: true });
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
      radio.setAttribute("aria-label", t("evaluation.scoreLabel", { score, label: scaleMeta.label }));
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
  el.dimensionCounter.textContent = t("evaluation.dimensionPosition", {
    pictogram: state.evalIndex + 1,
    pictograms: state.items.length,
    dimension: state.dimensionIndex + 1,
    dimensions: DIMENSIONS.length,
  });
  el.activeDimensionTitle.textContent = meta.name;
  el.activeDimensionDescription.textContent = meta.description;
  el.activeDimensionTitle.tabIndex = -1;
  el.dimensionPrevBtn.disabled = state.dimensionIndex === 0;
  el.dimensionNextBtn.disabled = state.dimensionIndex === DIMENSIONS.length - 1;
  const currentScore = normalizeScore(scores[dimension.key]);
  el.dimensionNextBtn.classList.toggle(
    "ready",
    currentScore !== null && state.dimensionIndex < DIMENSIONS.length - 1,
  );
  el.scalePrompt.textContent = currentScore === null
    ? t("evaluation.rate")
    : t("evaluation.rated", { label: getScaleMeta(currentScore).label });
  renderRubricDetails(scores);
}

function onEvaluationKeydown(event) {
  if (event.key !== "Enter" || el.likertStage.classList.contains("hidden")) return;
  if (!event.target.matches('input[type="radio"]')) return;

  const scores = readScoresFromUI();
  const dimension = DIMENSIONS[state.dimensionIndex];
  if (normalizeScore(scores[dimension.key]) === null) return;

  event.preventDefault();
  if (state.dimensionIndex < DIMENSIONS.length - 1) {
    changeDimension(1);
    return;
  }
  if (hasAllDimensionsScored(scores)) advanceToNextPictogram();
}

function onDimensionScoreChange() {
  const item = state.items[state.evalIndex];
  if (!item) return;

  const scores = readScoresFromUI();
  const record = ensureRecord(item.id);
  const activeDimension = DIMENSIONS[state.dimensionIndex];
  const completedLastDimension = state.dimensionIndex === DIMENSIONS.length - 1
    && normalizeScore(record.scores?.[activeDimension.key]) === null
    && normalizeScore(scores[activeDimension.key]) !== null
    && hasAllDimensionsScored(scores);
  record.scores = scores;
  record.average = averageScore(scores);
  record.updatedAt = new Date().toISOString();

  state.evaluations.set(item.id, record);
  persistEvaluations();
  updateLikertPanels(scores);
  updatePictogramNavigation(scores);
  updateEvaluationStatus();
  updateStepLocks();

  // Completing the sixth dimension reveals the profile and average; leave time to read
  // them and hand the next step to the person instead of advancing automatically.
  if (completedLastDimension) el.evalNextBtn.focus({ preventScroll: true });
}

function updateEvaluationStatus() {
  const completed = countCompletedItems();
  const isComplete = state.items.length > 0
    && completed === state.items.length
    && isLibraryAssessmentComplete();
  el.evalProgress.textContent = t("evaluation.progress", { completed, total: state.items.length });
  el.evaluationStateLabel.textContent = isComplete
    ? t("evaluation.completeState")
    : t("evaluation.partialState");
  el.exportJsonLabel.textContent = isComplete
    ? t("evaluation.downloadComplete")
    : t("evaluation.downloadPartial");
  el.exportJsonBtn.setAttribute(
    "aria-label",
    isComplete ? t("evaluation.downloadComplete") : t("evaluation.downloadPartial"),
  );
}

function updatePictogramNavigation(scores) {
  const allScored = hasAllDimensionsScored(scores);
  el.evalNextBtn.disabled = !allScored;
  el.evalNextBtn.classList.toggle("ready", allScored);
  setNextLabel();
}

function setNextLabel() {
  const isLast = state.evalIndex >= state.items.length - 1;
  el.evalNextLabel.textContent = isLast
    ? t("evaluation.save", { current: state.evalIndex + 1, total: state.items.length })
    : t("evaluation.itemNext");
  el.evalNextBtn.setAttribute(
    "aria-label",
    isLast ? t("evaluation.save", { current: state.evalIndex + 1, total: state.items.length }) : t("evaluation.itemNext"),
  );
}

function advanceToNextPictogram() {
  if (state.evalIndex < state.items.length - 1) {
    changeEvalItem(state.evalIndex + 1);
    return;
  }
  if (countCompletedItems() === state.items.length) goToStep(4);
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
  const card = document.createElement("article");
  card.className = "rubric-item";

  if (score === null) {
    card.innerHTML = `<p>${escapeHtml(t("evaluation.rubricEmpty"))}</p>`;
  } else {
    const rubricText = getDimensionLevelText(dimension.key, score);
    card.innerHTML = `<p>${escapeHtml(rubricText)}</p>`;
  }
  el.rubricDetails.append(card);
}

function drawHexChart(scores) {
  drawHexChartOnCanvas(el.hexChart, scores);
}

function drawHexChartOnCanvas(canvas, scores) {
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

// No average over partial data: the PICTOS Index needs all six dimensions.
function averageScore(scores) {
  if (!hasAllDimensionsScored(scores)) return null;
  const total = DIMENSIONS.reduce((acc, dimension) => acc + normalizeScore(scores[dimension.key]), 0);
  return total / DIMENSIONS.length;
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

function createEmptyLibraryAssessment() {
  return {
    scores: { coherence: null, grammar: null },
    updatedAt: null,
  };
}

function buildLibraryScales() {
  LIBRARY_DIMENSIONS.forEach((dimension) => {
    const container = document.getElementById(`${dimension}Scale`);
    if (!container) return;
    container.innerHTML = "";

    for (let score = 1; score <= 5; score += 1) {
      const description = t(`audit.levels.${dimension}.${score}`);
      const option = document.createElement("label");
      option.className = "radio-option";

      const number = document.createElement("span");
      number.className = "radio-number";
      number.textContent = String(score);

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `library-score-${dimension}`;
      radio.value = String(score);
      radio.checked = normalizeScore(state.libraryAssessment?.scores?.[dimension]) === score;
      radio.setAttribute("aria-label", t("audit.scoreLabel", {
        dimension: t(`audit.${dimension}Title`),
        score,
        description,
      }));
      radio.addEventListener("change", onLibraryScoreChange);

      option.append(number, radio);
      container.append(option);
    }
  });
  syncLibraryScoreStyles();
  renderLibraryRatingDescriptions();
}

function readLibraryScores() {
  const scores = {};
  LIBRARY_DIMENSIONS.forEach((dimension) => {
    const selected = document.querySelector(`input[name="library-score-${dimension}"]:checked`);
    scores[dimension] = selected ? normalizeScore(selected.value) : null;
  });
  return scores;
}

function onLibraryScoreChange() {
  state.libraryAssessment = {
    scores: readLibraryScores(),
    updatedAt: new Date().toISOString(),
  };
  syncLibraryScoreStyles();
  renderLibraryRatingDescriptions();
  persistEvaluations();
  updateAuditState();
}

function syncLibraryScoreStyles() {
  LIBRARY_DIMENSIONS.forEach((dimension) => {
    document.querySelectorAll(`input[name="library-score-${dimension}"]`).forEach((input) => {
      input.closest(".radio-option")?.classList.toggle("active", input.checked);
    });
  });
}

function renderLibraryRatingDescriptions() {
  LIBRARY_DIMENSIONS.forEach((dimension) => {
    const target = document.getElementById(`${dimension}Description`);
    if (!target) return;
    const score = normalizeScore(state.libraryAssessment?.scores?.[dimension]);
    target.textContent = score === null
      ? t("audit.chooseRating")
      : t(`audit.levels.${dimension}.${score}`);
  });
}

function renderLibraryAudit() {
  buildLibraryScales();
  renderAuditGrid();
  updateAuditState();
}

function renderAuditGrid() {
  if (!el.auditGrid) return;
  const order = el.auditOrderInputs.find((input) => input.checked)?.value || "original";
  const showLabels = Boolean(el.auditLabelsToggle.checked);
  if (el.auditLabelsText) {
    el.auditLabelsText.textContent = showLabels ? t("audit.hideLabels") : t("audit.showLabels");
  }

  const items = [...state.items];
  if (order === "category") {
    const collator = new Intl.Collator(getLocale(), { sensitivity: "base", numeric: true });
    items.sort((a, b) => {
      const categoryOrder = collator.compare(a.category || t("audit.unknownCategory"), b.category || t("audit.unknownCategory"));
      return categoryOrder || collator.compare(a.utterance, b.utterance);
    });
  }

  el.auditGrid.innerHTML = "";
  items.forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "audit-card";
    figure.classList.toggle("with-label", showLabels);

    const image = document.createElement("img");
    image.alt = showLabels ? item.utterance : t("audit.unlabelledImage");
    setImage(image, item.imageSrc, t("evaluation.imageFallback"));
    figure.append(image);

    if (showLabels) {
      const caption = document.createElement("figcaption");
      caption.textContent = item.utterance;
      const category = document.createElement("span");
      category.textContent = (item.category || t("audit.unknownCategory")).replaceAll("_", " ");
      caption.append(category);
      figure.append(caption);
    }
    el.auditGrid.append(figure);
  });
}

function isLibraryAssessmentComplete() {
  return LIBRARY_DIMENSIONS.every(
    (dimension) => normalizeScore(state.libraryAssessment?.scores?.[dimension]) !== null,
  );
}

function updateAuditState() {
  if (el.auditExportBtn) el.auditExportBtn.disabled = !isLibraryAssessmentComplete();
  if (el.auditPdfBtn) el.auditPdfBtn.disabled = !isLibraryAssessmentComplete();
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
  const suffix = getLocale() === "en-GB" ? "en" : "es";
  return {
    name: raw && raw[`name_${suffix}`] ? raw[`name_${suffix}`] : t(`rubric.dimensions.${key}.name`),
    description: raw && raw[`description_${suffix}`]
      ? raw[`description_${suffix}`]
      : t(`rubric.dimensions.${key}.description`),
  };
}

function getDimensionLevelText(key, score) {
  const raw = state.rubric && state.rubric.dimensions ? state.rubric.dimensions[key] : null;
  const level = raw && raw.levels ? raw.levels[String(score)] : null;
  const suffix = getLocale() === "en-GB" ? "en" : "es";
  return level && level[`text_${suffix}`] ? level[`text_${suffix}`] : t("evaluation.noLevelDescription");
}

function getScaleMeta(score) {
  const raw = state.rubric && state.rubric.scale ? state.rubric.scale[String(score)] : null;
  const suffix = getLocale() === "en-GB" ? "en" : "es";
  return {
    label: raw && raw[`label_${suffix}`] ? raw[`label_${suffix}`] : t(`rubric.scale.${score}.label`),
    general: raw && raw[`general_${suffix}`] ? raw[`general_${suffix}`] : t(`rubric.scale.${score}.general`),
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
  const isComplete = state.items.length > 0
    && countCompletedItems() === state.items.length
    && isLibraryAssessmentComplete();
  if (isComplete && !state.assessment.completedAt) state.assessment.completedAt = new Date().toISOString();
  if (!isComplete) state.assessment.completedAt = null;
  const payload = {
    savedAt: new Date().toISOString(),
    assessment: state.assessment,
    evaluations: Array.from(state.evaluations.values()),
    libraryAssessment: state.libraryAssessment,
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
    if (parsed.libraryAssessment && typeof parsed.libraryAssessment === "object") {
      state.libraryAssessment = {
        scores: {
          coherence: normalizeScore(parsed.libraryAssessment.scores?.coherence),
          grammar: normalizeScore(parsed.libraryAssessment.scores?.grammar),
        },
        updatedAt: parsed.libraryAssessment.updatedAt || null,
      };
    }
    const map = new Map();
    if (Array.isArray(parsed.evaluations)) {
      parsed.evaluations.forEach((record) => {
        if (!record || !record.itemId) return;
        map.set(record.itemId, record);
      });
    }
    state.evaluations = map;
    if (state.assessment
      && (countCompletedItems() !== state.items.length || !isLibraryAssessmentComplete())) {
      state.assessment.completedAt = null;
    }
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
    if (isRecordComplete(record)) count += 1;
  });
  return count;
}

// A pending interpretation (never answered, or skipped and reopened) leaves the
// pictogram incomplete, whatever its ratings.
function isRecordComplete(record) {
  if (!record) return false;
  const interpreted = record.guessSkipped || Boolean(record.guess && record.guess.trim());
  const pass = state.items.find((item) => item.id === record.itemId)?.pass;
  if (pass === "blind") return interpreted;
  if (pass === "sighted") return hasAllDimensionsScored(record.scores);
  return interpreted && hasAllDimensionsScored(record.scores);
}

function exportEvaluationJson() {
  if (!state.library || !state.items.length) {
    alert(t("alerts.loadFirst"));
    return;
  }

  if (!isProfileComplete(state.evaluatorProfile)) {
    alert(t("alerts.profileFirst"));
    return;
  }

  const payload = buildExportPayload();
  const baseName = sanitizeFilename((state.library.fileName || "library").replace(/\.json$/i, ""));
  const completion = countCompletedItems() === state.items.length && isLibraryAssessmentComplete()
    ? "complete"
    : "partial";
  const outName = `${baseName}-pictos-index-eval-${completion}-${new Date().toISOString().slice(0, 10)}.json`;
  downloadJson(payload, outName);
}

function buildExportPayload() {
  const items = state.items.map((item, index) => {
    const record = state.evaluations.get(item.id) || null;
    return {
      index: index + 1,
      itemId: item.id,
      // In the protocol the phrases stay out of the export, so a partial download
      // cannot reveal blind items; the aggregator joins them from the library.
      utterance: item.pass ? null : item.utterance,
      pass: item.pass || null,
      category: item.category || null,
      comprension_pragmatica: {
        estado: record ? (record.guessSkipped ? "omitida" : record.guess ? "respondida" : "pendiente") : "pendiente",
        respuesta: record && record.guess ? record.guess : "",
      },
      scores: record && record.scores ? normalizeScores(record.scores) : null,
      average: hasAllDimensionsScored(record?.scores) ? Number(averageScore(record.scores).toFixed(3)) : null,
      updatedAt: record ? record.updatedAt : null,
    };
  });

  const payload = {
    schemaVersion: "pictos-index-library-evaluation-1.5.0",
    exportedAt: new Date().toISOString(),
    uiLocale: getLocale(),
    evaluation: state.assessment || createAssessmentIdentity(),
    library: state.library,
    evaluator: state.evaluatorProfile,
    protocol: state.protocol || null,
    summary: buildSummary(),
    libraryAssessment: {
      scores: {
        coherence: normalizeScore(state.libraryAssessment?.scores?.coherence),
        grammar: normalizeScore(state.libraryAssessment?.scores?.grammar),
      },
      averageExcludedFromPictosIndex: true,
      updatedAt: state.libraryAssessment?.updatedAt || null,
    },
    items,
  };

  return payload;
}

async function exportEvaluationPdf() {
  if (!state.library || !state.items.length) {
    alert(t("alerts.loadFirst"));
    return;
  }

  if (countCompletedItems() !== state.items.length || !isLibraryAssessmentComplete()) {
    alert(t("alerts.completeForPdf"));
    return;
  }

  const PdfDocument = window.jspdf?.jsPDF;
  if (!PdfDocument) {
    alert(t("alerts.pdfUnavailable"));
    return;
  }

  el.auditPdfBtn.disabled = true;
  el.auditPdfBtn.textContent = t("audit.generatingPdf");

  try {
    const payload = buildExportPayload();
    const pdf = new PdfDocument({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
    pdf.setProperties({
      title: t("pdf.documentTitle", { library: state.library.name || t("library.untitled") }),
      subject: t("pdf.documentSubject"),
      author: "PICTOS Index",
      creator: "PICTOS Index",
    });

    drawPdfCover(pdf, payload);
    for (let index = 0; index < state.items.length; index += 1) {
      pdf.addPage("a4", "landscape");
      await drawPdfItemPage(pdf, state.items[index], index, payload);
    }

    const totalPages = state.items.length + 1;
    for (let page = 1; page <= totalPages; page += 1) {
      pdf.setPage(page);
      drawPdfFooter(pdf, page, totalPages);
    }

    const baseName = sanitizeFilename((state.library.fileName || "library").replace(/\.json$/i, ""));
    pdf.save(`${baseName}-pictos-index-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error("No se pudo generar el informe PDF.", error);
    alert(t("alerts.pdfError"));
  } finally {
    el.auditPdfBtn.textContent = t("audit.downloadPdf");
    updateAuditState();
  }
}

function drawPdfCover(pdf, payload) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const summary = payload.summary;
  const libraryScores = payload.libraryAssessment.scores;

  pdf.setFillColor(15, 8, 25);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  pdf.setTextColor(183, 148, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(t("pdf.eyebrow").toUpperCase(), 18, 21);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(30);
  pdf.text(t("pdf.title"), 18, 39);
  pdf.setFontSize(17);
  const libraryName = state.library.name || t("library.untitled");
  pdf.text(pdf.splitTextToSize(libraryName, 255), 18, 52);

  const cardY = 78;
  const cardWidth = 80;
  drawPdfScoreCard(pdf, 18, cardY, cardWidth, t("pdf.overallScore"), summary.overallAverage);
  drawPdfScoreCard(pdf, 108, cardY, cardWidth, t("audit.coherenceTitle"), libraryScores.coherence);
  drawPdfScoreCard(pdf, 198, cardY, cardWidth, t("audit.grammarTitle"), libraryScores.grammar);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(216, 207, 227);
  pdf.setFontSize(10);
  pdf.text(t("pdf.completedItems", { completed: summary.completedItems, total: summary.totalItems }), 18, 132);
  pdf.text(t("pdf.exportedAt", { date: formatPdfDate(payload.exportedAt) }), 18, 140);
  pdf.text(t("pdf.locale", { locale: payload.uiLocale }), 18, 148);

  pdf.setFillColor(42, 25, 61);
  pdf.roundedRect(18, 160, 260, 25, 3, 3, "F");
  pdf.setTextColor(255, 223, 94);
  pdf.setFont("helvetica", "bold");
  pdf.text(t("prototype.title"), 25, 171);
  pdf.setTextColor(234, 228, 241);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(pdf.splitTextToSize(t("pdf.prototypeNote"), 185), 25, 178);
  pdf.setTextColor(183, 148, 255);
  pdf.text(pdf.splitTextToSize(t("pdf.separateNote"), 58), 214, 171);
}

async function drawPdfItemPage(pdf, item, index, payload) {
  const record = state.evaluations.get(item.id);
  const scores = normalizeScores(record?.scores);
  const average = averageScore(scores);
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(249, 247, 252);
  pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");
  pdf.setTextColor(73, 45, 103);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(t("pdf.itemCounter", { current: index + 1, total: state.items.length }).toUpperCase(), 16, 17);
  pdf.setTextColor(20, 13, 31);
  pdf.setFontSize(18);
  pdf.text(pdf.splitTextToSize(item.utterance, 205), 16, 29);

  pdf.setFillColor(255, 223, 94);
  pdf.roundedRect(244, 14, 37, 18, 4, 4, "F");
  pdf.setTextColor(20, 13, 31);
  pdf.setFontSize(8);
  pdf.text("PICTOS Index", 262.5, 21, { align: "center" });
  pdf.setFontSize(14);
  pdf.text(formatPdfScore(average), 262.5, 28, { align: "center" });

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(224, 217, 232);
  pdf.roundedRect(16, 43, 122, 104, 3, 3, "FD");
  const pictogram = await rasterizeImageForPdf(item.imageSrc, t("evaluation.imageFallback"));
  pdf.addImage(pictogram, "PNG", 22, 49, 110, 92, undefined, "FAST");

  pdf.setFillColor(20, 11, 32);
  pdf.roundedRect(148, 43, 133, 104, 3, 3, "F");
  const chart = createPdfChart(scores);
  pdf.addImage(chart, "PNG", 158, 48, 113, 94, undefined, "FAST");

  const interpretation = record?.guess
    ? record.guess
    : t("pdf.interpretationSkipped");
  pdf.setTextColor(87, 75, 101);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(pdf.splitTextToSize(`${t("pdf.interpretation")}: ${interpretation}`, 265), 16, 156);

  DIMENSIONS.forEach((dimension, dimensionIndex) => {
    const column = dimensionIndex % 3;
    const row = Math.floor(dimensionIndex / 3);
    const x = 16 + column * 90;
    const y = 166 + row * 15;
    pdf.setFillColor(239, 234, 245);
    pdf.roundedRect(x, y, 84, 11, 2, 2, "F");
    pdf.setTextColor(73, 45, 103);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(`${dimension.code} · ${getDimensionMeta(dimension.key).name}`, x + 4, y + 4.8, { maxWidth: 65 });
    pdf.setTextColor(20, 13, 31);
    pdf.setFontSize(11);
    pdf.text(String(scores[dimension.key]), x + 77, y + 7.2, { align: "right" });
  });

  pdf.setTextColor(87, 75, 101);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  const category = item.category ? item.category.replaceAll("_", " ") : t("audit.unknownCategory");
  pdf.text(`${t("pdf.category")}: ${category}`, 16, 201);
  pdf.text(
    `${t("audit.coherenceTitle")}: ${payload.libraryAssessment.scores.coherence}/5 · ${t("audit.grammarTitle")}: ${payload.libraryAssessment.scores.grammar}/5`,
    281,
    201,
    { align: "right" },
  );
}

function drawPdfScoreCard(pdf, x, y, width, label, value) {
  pdf.setFillColor(42, 25, 61);
  pdf.roundedRect(x, y, width, 38, 4, 4, "F");
  pdf.setTextColor(216, 207, 227);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(pdf.splitTextToSize(label, width - 12), x + 6, y + 10);
  pdf.setTextColor(255, 223, 94);
  pdf.setFontSize(22);
  pdf.text(formatPdfScore(value), x + 6, y + 29);
  pdf.setTextColor(216, 207, 227);
  pdf.setFontSize(9);
  pdf.text("/ 5", x + width - 7, y + 29, { align: "right" });
}

function drawPdfFooter(pdf, page, totalPages) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setDrawColor(207, 197, 218);
  pdf.line(16, pageHeight - 7, pageWidth - 16, pageHeight - 7);
  pdf.setTextColor(115, 101, 128);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text(t("pdf.footer"), 16, pageHeight - 3);
  pdf.text(`${page} / ${totalPages}`, pageWidth - 16, pageHeight - 3, { align: "right" });
}

function createPdfChart(scores) {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 320;
  drawHexChartOnCanvas(canvas, scores);
  return canvas.toDataURL("image/png");
}

async function rasterizeImageForPdf(source, fallbackLabel) {
  const fallback = createPlaceholder(fallbackLabel);
  try {
    return await rasterizeImageSource(source || fallback);
  } catch {
    return rasterizeImageSource(fallback);
  }
}

async function rasterizeImageSource(source) {
  const image = new Image();
  image.decoding = "async";
  if (/^https?:/i.test(source)) image.crossOrigin = "anonymous";
  image.src = source;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error("Imagen sin dimensiones");

  const canvas = document.createElement("canvas");
  canvas.width = 1100;
  canvas.height = 920;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  return canvas.toDataURL("image/png");
}

function formatPdfScore(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "-";
}

function formatPdfDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function buildSummary() {
  const completedItems = countCompletedItems();
  const allComplete = state.items.length > 0 && completedItems === state.items.length;
  // No average over partial data: library averages need every pictogram complete.
  // In the protocol, blind items carry an interpretation and no ratings.
  const records = allComplete
    ? state.items.map((item) => state.evaluations.get(item.id)).filter((record) => hasAllDimensionsScored(record?.scores))
    : [];
  const mean = (values) => (values.length
    ? Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(3))
    : null);

  const dimensionAverages = {};
  DIMENSIONS.forEach((dimension) => {
    dimensionAverages[dimension.key] = mean(records.map((record) => normalizeScore(record.scores[dimension.key])));
  });
  const overall = mean(records.map((record) => averageScore(record.scores)));

  return {
    totalItems: state.items.length,
    completedItems,
    completionRate: state.items.length ? Number(((completedItems / state.items.length) * 100).toFixed(2)) : 0,
    overallAverage: overall,
    dimensionAverages,
  };
}

function setImage(imgEl, source, label) {
  const fallback = createPlaceholder(label || t("evaluation.imageFallback"));
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
