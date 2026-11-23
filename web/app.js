import { applyTranslations, getLocale, initI18n, marked, setLocale, t } from "./i18n.js";
import { initCoordination, isCoordinationRequested } from "./coordination.js";

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
const PROTOCOL_VERSION = "protocolo-experimental-0.2";
// Pass 2 asks a single question, "¿Sirve aquí?", instead of the six ratings.
const USE_ANSWERS = ["yes", "partly", "no", "cannot_judge"];
// ?p=<n> numbers the participant and derives the form from its parity (odd A, even B),
// so handing out consecutive numbers balances the forms; ?forma=A|B still works.
const URL_PARAMS = new URLSearchParams(window.location.search);
const PARTICIPANT = /^[1-9]\d*$/.test(URL_PARAMS.get("p") || "") ? Number(URL_PARAMS.get("p")) : null;
const PROTOCOL_FORM = (() => {
  const form = URL_PARAMS.get("forma")?.toUpperCase();
  if (form === "A" || form === "B") return form;
  return PARTICIPANT ? (PARTICIPANT % 2 ? "A" : "B") : null;
})();

const state = {
  rubric: null,
  library: null,
  items: [],
  evalIndex: 0,
  qIndex: 0,
  setIndex: 0,
  seenNotices: new Set(),
  assessment: null,
  evaluatorProfile: null,
  evaluations: new Map(),
  libraryAssessment: createEmptyLibraryAssessment(),
};

const el = {};

// Theme: "system" follows the operating system; light or dark is remembered.
// The inline script in index.html applies it before the first paint.
const THEME_KEY = "pictos-index:theme";
const SYSTEM_LIGHT = window.matchMedia("(prefers-color-scheme: light)");

function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const light = saved ? saved === "light" : SYSTEM_LIGHT.matches;
  document.documentElement.dataset.theme = light ? "light" : "dark";
  document.querySelector('meta[name="theme-color"]').content = light ? "#faf8fd" : "#0b0613";
}

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await initI18n();
  bindElements();
  if (PROTOCOL_FORM) markProtocolMode();
  applyTranslations();
  el.languageSelect.value = getLocale();
  bindEvents();
  state.rubric = await loadRubric();
  loadEvaluatorProfile();
  updateStepLocks();
  if (isCoordinationRequested()) {
    initCoordination();
    el.homeScreen.classList.add("hidden");
    document.getElementById("coordinationScreen").classList.remove("hidden");
    return;
  }
  showHome(false);
}
function bindElements() {
  const ids = [
    "homeScreen", "evaluatorShell", "startEvaluationBtn", "brandHome", "statusRegion", "languageSelect", "themeSelect",
    "stepBtn1", "stepBtn2", "stepBtn3", "stepBtn4", "step1", "step2", "step3", "step4",
    "step1Nav", "step2Nav", "step3Nav", "step2Title", "step2NextBtn", "setBackBtn", "evalNextBtn",
    "evaluatorForm", "evalAacNoExperience",
    "libraryFileInput", "libraryLoader", "libraryLoaded", "loadedLibraryName", "loadedLibraryMeta",
    "replaceLibraryBtn", "libraryStatus", "auditGrid", "setQuestionTitle", "setQuestionBody", "setOptions",
    "evalPosition", "evalProgressBar", "noticePanel", "noticeText", "noticeContext", "noticeBtn",
    "questionPanel", "phraseLine", "evalImage", "guessStage", "guessText", "saveGuessBtn", "skipGuessBtn",
    "dimensionStage", "dimensionTitle", "dimensionDescription", "dimensionOptions",
    "useStage", "useScenario", "useReason", "evalBackBtn",
    "doneIntro", "doneStatus", "auditExportBtn", "auditPdfBtn",
  ];
  ids.forEach((id) => { el[id] = document.getElementById(id); });
  el.sampleLibraryButtons = Array.from(document.querySelectorAll("[data-sample-path]"));
  el.evalAacRelationInputs = Array.from(document.querySelectorAll('input[name="aacRelations"]'));
}
function bindEvents() {
  el.languageSelect.addEventListener("change", onLanguageChange);
  el.themeSelect.value = localStorage.getItem(THEME_KEY) || "system";
  el.themeSelect.addEventListener("change", () => {
    if (el.themeSelect.value === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, el.themeSelect.value);
    applyTheme();
  });
  SYSTEM_LIGHT.addEventListener("change", applyTheme);
  applyTheme();
  el.startEvaluationBtn.addEventListener("click", () => {
    el.homeScreen.classList.add("hidden");
    el.evaluatorShell.classList.remove("hidden");
    goToStep(1, true);
  });
  el.brandHome.addEventListener("click", (event) => {
    event.preventDefault();
    showHome();
  });

  [el.stepBtn1, el.stepBtn2, el.stepBtn3, el.stepBtn4].forEach((button, index) => {
    button.addEventListener("click", () => {
      if (!button.disabled) goToStep(index + 1);
    });
  });

  el.evaluatorForm.addEventListener("submit", onEvaluatorSubmit);
  el.evalAacRelationInputs.forEach((input) => input.addEventListener("change", onAacRelationChange));

  el.libraryFileInput.addEventListener("change", onLibraryFileChange);
  el.replaceLibraryBtn.addEventListener("click", () => el.libraryFileInput.click());
  el.sampleLibraryButtons.forEach((button) => {
    button.addEventListener("click", () => onLoadSampleLibrary(button));
  });
  el.setBackBtn.addEventListener("click", () => changeSetQuestion(-1));
  el.step2NextBtn.addEventListener("click", () => changeSetQuestion(1));

  el.noticeBtn.addEventListener("click", () => {
    state.seenNotices.add(el.noticePanel.dataset.notice);
    renderCurrentEvalItem();
  });
  el.guessText.addEventListener("input", () => {
    el.saveGuessBtn.disabled = !el.guessText.value.trim();
  });
  el.saveGuessBtn.addEventListener("click", () => saveGuess(false));
  el.skipGuessBtn.addEventListener("click", () => saveGuess(true));
  document.querySelectorAll('input[name="useAnswer"]').forEach((radio) => radio.addEventListener("change", onUseAnswerChange));
  el.useReason.addEventListener("input", onUseAnswerChange);
  el.evalNextBtn.addEventListener("click", nextQuestion);
  el.useStage.addEventListener("keydown", (event) => {
    const inText = event.target === el.useReason;
    if (event.key !== "Enter" || (inText && !(event.ctrlKey || event.metaKey))) return;
    event.preventDefault();
    if (!el.evalNextBtn.disabled) nextQuestion();
  });
  el.guessText.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    if (!el.saveGuessBtn.disabled) saveGuess(false);
  });
  el.evalBackBtn.addEventListener("click", previousQuestion);

  el.auditExportBtn.addEventListener("click", exportEvaluationJson);
  el.auditPdfBtn.addEventListener("click", exportEvaluationPdf);
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
  if (state.library) renderLibrarySummary();
  if (state.items.length && !el.step3.classList.contains("hidden")) renderCurrentEvalItem();
}

function showHome(moveFocus = true) {
  if (isCoordinationRequested()) {
    window.location.search = ""; // leave the coordination screen
    return;
  }
  el.evaluatorShell.classList.add("hidden");
  el.homeScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (moveFocus) document.getElementById("homeTitle").focus({ preventScroll: true });
}
function goToStep(step, moveFocus = true) {
  const steps = [el.step1, el.step2, el.step3, el.step4];
  const navs = [el.step1Nav, el.step2Nav, el.step3Nav, null];
  const pills = [el.stepBtn1, el.stepBtn2, el.stepBtn3, el.stepBtn4];
  steps.forEach((screen, index) => screen.classList.toggle("hidden", index + 1 !== step));
  navs.forEach((nav, index) => nav?.classList.toggle("hidden", index + 1 !== step));
  pills.forEach((button, index) => {
    button.classList.toggle("active", index + 1 === step);
    if (index + 1 === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  if (step === 3) enterPictograms();

  if (moveFocus) {
    if (step !== 3) document.getElementById(`step${step}Title`)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  const hasProfile = isProfileComplete(state.evaluatorProfile);
  const setReady = state.items.length > 0 && isLibraryAssessmentComplete();
  const pictogramsComplete = setReady && countCompletedItems() === state.items.length;

  el.stepBtn2.disabled = !hasProfile;
  el.stepBtn3.disabled = !(hasProfile && setReady);
  el.stepBtn4.disabled = !(hasProfile && pictogramsComplete);
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
    key: buildLibraryStorageKey(payload, items)
      + (PROTOCOL_FORM ? `:${PROTOCOL_VERSION}:${PROTOCOL_FORM}` : "")
      + (PARTICIPANT ? `:p${PARTICIPANT}` : ""),
  };

  state.evalIndex = 0;
  state.qIndex = 0;
  state.assessment = null;
  state.evaluations = new Map();
  state.libraryAssessment = createEmptyLibraryAssessment();
  state.protocol = null;
  loadStoredEvaluations();
  if (!state.assessment) state.assessment = createAssessmentIdentity();
  if (PROTOCOL_FORM) applyProtocolPlan(payload);

  state.setIndex = isLibraryAssessmentComplete() ? LIBRARY_DIMENSIONS.length - 1 : 0;
  renderLibrarySummary();
  updateStepLocks();
  announce(t("library.successStatus", { count: state.items.length }));
  // The button that loaded the library is now hidden: keep the focus on this step.
  el.step2Title.focus({ preventScroll: true });
}

// In the protocol the PDF report (six ratings per pictogram) does not apply.
function markProtocolMode() {
  document.body.classList.add("protocol-mode");
  el.doneIntro.dataset.i18n = "done.introProtocol";
}

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
    participant: PARTICIPANT,
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
// Once a library loads, the step shows it from afar, as a grid without phrases, and asks
// about the set before any single pictogram is seen.
function renderLibrarySummary() {
  if (!state.library) return;
  el.libraryStatus.textContent = t("library.successStatus", { count: state.items.length });
  el.step2Title.textContent = t("set.title");
  el.libraryLoader.classList.add("hidden");
  el.libraryLoaded.classList.remove("hidden");
  el.loadedLibraryName.textContent = state.library.name || t("library.untitled");
  el.loadedLibraryMeta.textContent = [
    t("library.pictogramCount", { count: state.items.length }),
    state.library.domainContext,
  ].filter(Boolean).join(" · ");

  el.auditGrid.innerHTML = "";
  state.items.forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "audit-card";
    const image = document.createElement("img");
    image.alt = t("audit.unlabelledImage");
    setImage(image, item.imageSrc, t("evaluation.imageFallback"));
    figure.append(image);
    el.auditGrid.append(figure);
  });
  renderSetQuestion(false);
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
  goToStep(2);
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

function questionsFor(item) {
  if (item.pass === "blind") return ["guess"];
  if (item.pass === "sighted") return ["use"];
  return ["guess", ...DIMENSIONS.map((dimension) => dimension.key)];
}

function isQuestionAnswered(record, question) {
  if (!record) return false;
  if (question === "guess") return record.guessSkipped || Boolean(record.guess && record.guess.trim());
  if (question === "use") return USE_ANSWERS.includes(record.use);
  return normalizeScore(record.scores?.[question]) !== null;
}

function firstOpenQuestion(item) {
  const record = state.evaluations.get(item.id);
  const index = questionsFor(item).findIndex((question) => !isQuestionAnswered(record, question));
  return index === -1 ? 0 : index;
}

function firstSightedIndex() {
  return state.items.findIndex((item) => item.pass === "sighted");
}

// Resume at the first unanswered question of the first unfinished pictogram.
function enterPictograms() {
  const pending = state.items.findIndex((item) => !isRecordComplete(state.evaluations.get(item.id)));
  state.evalIndex = pending === -1 ? 0 : pending;
  state.qIndex = firstOpenQuestion(state.items[state.evalIndex]);
  renderCurrentEvalItem();
}

// A short notice opens each part of the session, then gets out of the way.
function pendingNotice(item) {
  if (!state.seenNotices.has("start") && state.evalIndex === 0 && state.qIndex === 0 && countCompletedItems() === 0) {
    return "start";
  }
  if (item.pass === "sighted" && state.evalIndex === firstSightedIndex()
    && !state.seenNotices.has("sighted") && !isRecordComplete(state.evaluations.get(item.id))) {
    return "sighted";
  }
  return null;
}

function renderCurrentEvalItem() {
  if (!state.items.length) return;
  const item = state.items[state.evalIndex];
  const record = ensureRecord(item.id);
  const questions = questionsFor(item);
  const question = questions[state.qIndex];

  el.evalPosition.textContent = questions.length > 1
    ? t("evaluation.questionPosition", {
      current: state.evalIndex + 1, total: state.items.length, question: state.qIndex + 1, questions: questions.length,
    })
    : t("evaluation.pictogramPosition", { current: state.evalIndex + 1, total: state.items.length });
  el.evalProgressBar.value = (state.evalIndex + state.qIndex / questions.length) / state.items.length;

  const notice = pendingNotice(item);
  el.noticePanel.classList.toggle("hidden", !notice);
  el.questionPanel.classList.toggle("hidden", Boolean(notice));
  el.step3Nav.classList.toggle("hidden", Boolean(notice));
  if (notice) {
    el.noticePanel.dataset.notice = notice;
    const key = notice === "sighted" ? "notice.sighted" : item.pass ? "notice.blind" : "notice.start";
    el.noticeText.textContent = t(key);
    el.noticeContext.textContent = state.library?.domainContext
      ? t("evaluation.domainContext", { context: state.library.domainContext })
      : "";
    el.noticeBtn.focus({ preventScroll: true });
    return;
  }

  setImage(el.evalImage, item.imageSrc, `${t("evaluation.imageAlt")} ${item.id}`);
  // A blind item's phrase never enters the DOM; otherwise it shows once the guess is in.
  const showPhrase = item.pass !== "blind" && question !== "guess";
  el.phraseLine.textContent = showPhrase ? t("evaluation.sourcePhraseLine", { phrase: item.utterance }) : "";
  el.phraseLine.classList.toggle("hidden", !showPhrase || item.pass === "sighted");
  el.guessStage.classList.toggle("hidden", question !== "guess");
  el.useStage.classList.toggle("hidden", question !== "use");
  el.dimensionStage.classList.toggle("hidden", question === "guess" || question === "use");
  el.evalBackBtn.disabled = !canGoBack();
  // The guess has its own Confirm button; every other answer is confirmed with Next.
  el.evalNextBtn.classList.toggle("hidden", question === "guess");
  el.evalNextBtn.disabled = !isQuestionAnswered(record, question);

  if (question === "guess") {
    el.guessText.value = record.guess || "";
    el.saveGuessBtn.disabled = !el.guessText.value.trim();
    el.guessText.focus({ preventScroll: true });
  } else if (question === "use") {
    el.useScenario.textContent = t("evaluation.useScenario", { phrase: item.utterance });
    document.querySelectorAll('input[name="useAnswer"]').forEach((radio) => {
      radio.checked = radio.value === record.use;
    });
    el.useReason.value = record.useReason || "";
    (document.querySelector('input[name="useAnswer"]:checked') || document.querySelector('input[name="useAnswer"]')).focus({ preventScroll: true });
  } else {
    const meta = getDimensionMeta(question);
    el.dimensionTitle.textContent = meta.name;
    el.dimensionDescription.replaceChildren(emphasize(meta.description, meta.emphasis));
    renderLevelOptions(
      el.dimensionOptions,
      [1, 2, 3, 4, 5].map((score) => ({
        text: getDimensionLevelText(question, score),
        emphasis: getDimensionLevelEmphasis(question, score),
      })),
      normalizeScore(record.scores?.[question]),
      (score) => onDimensionScore(question, score),
      nextQuestion,
    );
  }
}

// Five options, each with what its score means. Picking only selects; the person
// confirms with Next (or Enter), so a slip of the pointer never skips a question.
function renderLevelOptions(container, levels, selected, onPick, onAdvance, focus = true) {
  container.innerHTML = "";
  container.onkeydown = (event) => {
    if (event.key !== "Enter" || !container.querySelector("input:checked")) return;
    event.preventDefault();
    onAdvance();
  };
  levels.forEach((text, index) => {
    const score = index + 1;
    const option = document.createElement("label");
    option.className = "level-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `${container.id}-level`;
    input.value = String(score);
    input.checked = selected === score;
    input.addEventListener("change", () => onPick(score));
    const number = document.createElement("span");
    number.className = "level-number";
    number.textContent = String(score);
    const description = document.createElement("span");
    description.append(emphasize(text.text ?? text, text.emphasis));
    option.append(input, number, description);
    container.append(option);
  });
  if (focus) (container.querySelector("input:checked") || container.querySelector("input"))?.focus({ preventScroll: true });
}

function saveRecord(item, record) {
  record.updatedAt = new Date().toISOString();
  state.evaluations.set(item.id, record);
  persistEvaluations();
  updateStepLocks();
}

function saveGuess(skipped) {
  const item = state.items[state.evalIndex];
  const record = ensureRecord(item.id);
  const guess = el.guessText.value.trim();
  if (!skipped && !guess) return;
  record.guess = skipped ? "" : guess;
  record.guessSkipped = skipped;
  record.guessUpdatedAt = new Date().toISOString();
  saveRecord(item, record);
  nextQuestion();
}

function onDimensionScore(key, score) {
  const item = state.items[state.evalIndex];
  const record = ensureRecord(item.id);
  record.scores = { ...normalizeScores(record.scores), [key]: score };
  record.average = averageScore(record.scores);
  saveRecord(item, record);
  el.evalNextBtn.disabled = false;
}

function onUseAnswerChange() {
  const item = state.items[state.evalIndex];
  if (!item || item.pass !== "sighted") return;
  const record = ensureRecord(item.id);
  record.use = document.querySelector('input[name="useAnswer"]:checked')?.value || null;
  record.useReason = el.useReason.value.trim();
  saveRecord(item, record);
  el.evalNextBtn.disabled = !record.use;
}

// A new question starts at the top of the card, wherever the page was scrolled to.
function showQuestionTop() {
  if (el.step3.getBoundingClientRect().top < 0) el.step3.scrollIntoView({ block: "start" });
}

function nextQuestion() {
  const item = state.items[state.evalIndex];
  if (!isQuestionAnswered(state.evaluations.get(item.id), questionsFor(item)[state.qIndex])) return;
  if (state.qIndex < questionsFor(item).length - 1) {
    state.qIndex += 1;
  } else if (state.evalIndex < state.items.length - 1) {
    state.evalIndex += 1;
    state.qIndex = 0;
  } else {
    const pending = state.items.findIndex((candidate) => !isRecordComplete(state.evaluations.get(candidate.id)));
    if (pending === -1) {
      goToStep(4);
      // In the protocol the JSON is what gets handed in: download it on finishing and say so.
      if (PROTOCOL_FORM) {
        const file = exportEvaluationJson();
        el.doneStatus.textContent = t("done.downloaded", { file });
        el.doneStatus.classList.remove("hidden");
      }
      return;
    }
    state.evalIndex = pending;
    state.qIndex = firstOpenQuestion(state.items[pending]);
  }
  renderCurrentEvalItem();
  showQuestionTop();
}

// Going back never crosses from the second part of the protocol into the blind one.
function canGoBack() {
  return state.qIndex > 0 || (state.evalIndex > 0 && state.evalIndex !== firstSightedIndex());
}

function previousQuestion() {
  if (!canGoBack()) return;
  if (state.qIndex > 0) {
    state.qIndex -= 1;
  } else {
    state.evalIndex -= 1;
    state.qIndex = questionsFor(state.items[state.evalIndex]).length - 1;
  }
  renderCurrentEvalItem();
  showQuestionTop();
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
function createEmptyLibraryAssessment() {
  return {
    scores: { coherence: null, grammar: null },
    updatedAt: null,
  };
}
function renderSetQuestion(focus = true) {
  const dimension = LIBRARY_DIMENSIONS[state.setIndex];
  el.setQuestionTitle.textContent = t(`audit.${dimension}Title`);
  el.setQuestionBody.replaceChildren(marked(t(`audit.${dimension}Body`)));
  el.setBackBtn.disabled = state.setIndex === 0;
  renderSetNext();
  renderLevelOptions(
    el.setOptions,
    [1, 2, 3, 4, 5].map((score) => t(`audit.levels.${dimension}.${score}`)),
    normalizeScore(state.libraryAssessment?.scores?.[dimension]),
    (score) => {
      state.libraryAssessment = {
        scores: { ...state.libraryAssessment.scores, [dimension]: score },
        updatedAt: new Date().toISOString(),
      };
      persistEvaluations();
      updateStepLocks();
      renderSetNext();
    },
    () => changeSetQuestion(1),
    focus,
  );
}

function renderSetNext() {
  const last = state.setIndex === LIBRARY_DIMENSIONS.length - 1;
  el.step2NextBtn.textContent = t(last ? "set.continue" : "nav.next");
  el.step2NextBtn.disabled = last
    ? !isLibraryAssessmentComplete()
    : normalizeScore(state.libraryAssessment?.scores?.[LIBRARY_DIMENSIONS[state.setIndex]]) === null;
}

function changeSetQuestion(offset) {
  const next = state.setIndex + offset;
  if (next >= LIBRARY_DIMENSIONS.length) {
    if (isLibraryAssessmentComplete()) goToStep(3);
    return;
  }
  if (next < 0) return;
  state.setIndex = next;
  renderSetQuestion();
}


function isLibraryAssessmentComplete() {
  return LIBRARY_DIMENSIONS.every(
    (dimension) => normalizeScore(state.libraryAssessment?.scores?.[dimension]) !== null,
  );
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
    emphasis: raw?.[`description_emphasis_${suffix}`] || [],
    description: raw && raw[`description_${suffix}`]
      ? raw[`description_${suffix}`]
      : t(`rubric.dimensions.${key}.description`),
  };
}

function getDimensionLevelEmphasis(key, score) {
  const level = state.rubric?.dimensions?.[key]?.levels?.[String(score)];
  return level?.[getLocale() === "en-GB" ? "emphasis_en" : "emphasis_es"] || [];
}

// Wraps the given phrases of a text in <strong>, building nodes rather than HTML.
function emphasize(text, phrases = []) {
  if (!phrases.length) return marked(text);
  const fragment = document.createDocumentFragment();
  const pattern = new RegExp(`(${phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`);
  text.split(pattern).forEach((part, index) => {
    if (!part) return;
    if (index % 2) {
      const strong = document.createElement("strong");
      strong.textContent = part;
      fragment.append(strong);
    } else {
      fragment.append(part);
    }
  });
  return fragment;
}

function getDimensionLevelText(key, score) {
  const raw = state.rubric && state.rubric.dimensions ? state.rubric.dimensions[key] : null;
  const level = raw && raw.levels ? raw.levels[String(score)] : null;
  const suffix = getLocale() === "en-GB" ? "en" : "es";
  return level && level[`text_${suffix}`] ? level[`text_${suffix}`] : t("evaluation.noLevelDescription");
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
  if (pass === "sighted") return USE_ANSWERS.includes(record.use);
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
  const participant = PARTICIPANT ? `-p${PARTICIPANT}` : "";
  const outName = `${baseName}-pictos-index-eval${participant}-${completion}-${new Date().toISOString().slice(0, 10)}.json`;
  downloadJson(payload, outName);
  return outName;
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
      sirve_aqui: item.pass === "sighted"
        ? { respuesta: record?.use || null, motivo: record?.useReason || "" }
        : null,
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
    el.auditPdfBtn.disabled = false;
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
