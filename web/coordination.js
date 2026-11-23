// Coordination screen (?coordinar): joins the evaluations of a panel, hands out one
// CSV per judge and reads the judges' sheets back. Everything stays in the browser.
import { getLocale, t } from "./i18n.js";
import { aggregate, codingRows, mergeCoding, resultsCsv, shuffle, toCsv } from "./protocol.js";

const state = { library: null, libraryName: "", evaluations: [], aggregate: null, sheets: [], coding: null };
const $ = (id) => document.getElementById(id);

export function isCoordinationRequested() {
  return new URLSearchParams(window.location.search).has("coordinar");
}

export function initCoordination() {
  const base = `${window.location.origin}${window.location.pathname}`;
  $("coordLinkP").textContent = `${base}?p=1, ${base}?p=2, ${base}?p=3 …`;

  $("coordSampleSelect").addEventListener("change", onSampleChange);
  $("coordLibraryInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLibrary(JSON.parse(await file.text()), file.name);
    $("coordSampleSelect").value = "";
  });
  $("coordEvalInput").addEventListener("change", async (event) => {
    state.evaluations = await Promise.all([...event.target.files].map(async (file) => ({ file: file.name, data: JSON.parse(await file.text()) })));
    recompute();
  });
  $("coordSheetsInput").addEventListener("change", async (event) => {
    state.sheets = await Promise.all([...event.target.files].map(async (file) => ({ name: file.name.replace(/\.csv$/i, ""), text: await file.text() })));
    recompute();
  });
  $("coordSheetsBtn").addEventListener("click", downloadSheets);
  $("coordAggregateBtn").addEventListener("click", () => download(JSON.stringify(state.aggregate, null, 2), "agregado.json", "application/json"));
  $("coordResultsBtn").addEventListener("click", () => download(resultsCsv(state.aggregate, state.coding), "resultados-por-item.csv", "text/csv"));
  $("coordCodingBtn").addEventListener("click", () => download(JSON.stringify(state.coding, null, 2), "codificacion.json", "application/json"));
  document.getElementById("languageSelect")?.addEventListener("change", render);
  render();
}

async function onSampleChange(event) {
  const path = event.target.value;
  if (!path) return;
  const response = await fetch(path);
  setLibrary(await response.json(), path.split("/").pop());
}

function setLibrary(library, name) {
  state.library = library;
  state.libraryName = name;
  recompute();
}

function recompute() {
  state.aggregate = null;
  state.coding = null;
  if (state.library && state.evaluations.length) {
    const result = aggregate(state.library, state.evaluations);
    state.aggregate = result.items ? result : null;
    if (!state.aggregate) state.aggregateWarnings = result.warnings;
  }
  if (state.aggregate && state.sheets.length >= 2) {
    try {
      state.coding = mergeCoding(state.aggregate, state.sheets);
    } catch (error) {
      console.error(error);
      state.coding = { error: t("coordination.sheetsUnreadable") };
    }
  }
  render();
}

function render() {
  $("coordLibraryName").textContent = state.library
    ? `${state.library.config?.name || state.libraryName} · ${state.library.rows?.length ?? 0} ${t("coordination.items")}`
    : t("coordination.noLibrary");

  const agg = state.aggregate;
  const ready = Boolean(agg && agg.evaluations.length);
  $("coordSheetsBtn").disabled = !ready;
  $("coordAggregateBtn").disabled = !ready;
  $("coordResultsBtn").disabled = !ready;
  $("coordSheetsInput").disabled = !ready;
  $("coordCodingBtn").disabled = !(state.coding && !state.coding.error);

  if (!agg) {
    const warnings = state.library && state.evaluations.length ? (state.aggregateWarnings || []) : [];
    $("coordAggregateSummary").innerHTML = warnings.length ? list(warnings, "coord-warnings") : "";
  } else {
    $("coordAggregateSummary").innerHTML = `
      <p>${escapeHtml(t("coordination.evaluationsSummary", { n: agg.evaluations.length, a: agg.forms.A, b: agg.forms.B, answers: codingRows(agg).length }))}</p>
      ${agg.warnings.length ? list(agg.warnings, "coord-warnings") : ""}
      <p>${escapeHtml(t("coordination.useAgreement", { alpha: formatAlpha(agg.agreement.use.alpha_ordinal) }))}</p>`;
  }

  const coding = state.coding;
  if (!coding) {
    $("coordCodingSummary").innerHTML = state.sheets.length === 1 ? `<p class="coord-warnings">${escapeHtml(t("coordination.needTwoSheets"))}</p>` : "";
    return;
  }
  if (coding.error) {
    $("coordCodingSummary").innerHTML = `<p class="coord-warnings">${escapeHtml(coding.error)}</p>`;
    return;
  }
  const problems = coding.judges.flatMap((judge) => judge.problems.map((p) => `${judge.name}: ${p}`));
  $("coordCodingSummary").innerHTML = `
    <p>${escapeHtml(t("coordination.codingSummary", { judges: coding.judges.length, alpha: formatAlpha(coding.agreement.alpha_nominal), disagreements: coding.disagreements.length }))}</p>
    ${problems.length ? list(problems, "coord-warnings") : ""}
    ${coding.disagreements.length ? `
      <table class="meta-table coord-disagreements"><caption>${escapeHtml(t("coordination.disagreements"))}</caption>
        <thead><tr><th>${escapeHtml(t("coordination.phrase"))}</th><th>${escapeHtml(t("coordination.answer"))}</th>${coding.judges.map((j) => `<th>${escapeHtml(j.name)}</th>`).join("")}</tr></thead>
        <tbody>${coding.disagreements.map((row) => `<tr><td>${escapeHtml(row.frase)}</td><td>${escapeHtml(row.respuesta)}</td>${coding.judges.map((j) => `<td>${row.codes[j.name] ?? "–"}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>` : ""}`;
}

async function downloadSheets() {
  const count = Math.max(2, Math.floor(Number($("coordJudges").value) || 2));
  const rows = codingRows(state.aggregate);
  for (let judge = 1; judge <= count; judge += 1) {
    download(toCsv(shuffle(rows)), `juez-${judge}.csv`, "text/csv");
    await new Promise((resolve) => setTimeout(resolve, 400)); // browsers drop rapid successive downloads
  }
}

function download(content, fileName, type) {
  const href = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

const formatAlpha = (value) => (value === null || value === undefined
  ? "–"
  : value.toLocaleString(getLocale(), { minimumFractionDigits: 3, maximumFractionDigits: 3 }));
const list = (items, className) => `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
