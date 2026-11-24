// Coordination screen (?coordinar): joins the evaluations of a panel, hands out one
// CSV per judge and reads the judges' sheets back. Everything stays in the browser.
import { getLocale, marked, t } from "./i18n.js";
import { aggregate, codingRows, mergeCoding, resultsCsv, shuffle, toCsv } from "./protocol.js";
import qrcode from "./vendor/qrcode.mjs";

// libraryRef: what the evaluators' links carry in ?lib= (null for a local file).
const state = { library: null, libraryName: "", libraryRef: null, evaluations: [], aggregate: null, sheets: [], coding: null };
const $ = (id) => document.getElementById(id);

export function isCoordinationRequested() {
  return new URLSearchParams(window.location.search).has("coordinar");
}

export function initCoordination() {
  $("coordSampleSelect").addEventListener("change", onSampleChange);
  $("coordUrlBtn").addEventListener("click", () => useLibraryAddress($("coordLibraryUrl").value.trim()));
  $("coordLibraryUrl").addEventListener("keydown", (event) => {
    if (event.key === "Enter") useLibraryAddress($("coordLibraryUrl").value.trim());
  });
  $("coordLibraryInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLibrary(JSON.parse(await file.text()), file.name, null);
    } catch {
      showLibraryStatus(t("coordination.notALibrary"), true);
    }
  });
  $("coordPeople").addEventListener("input", renderLinks);
  $("coordPrintBtn").addEventListener("click", () => window.print());
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

function onSampleChange(event) {
  const choice = event.target.value;
  $("coordUrlRow").classList.toggle("hidden", choice !== "url");
  $("coordLibraryInput").classList.toggle("hidden", choice !== "file");
  if (choice === "url") $("coordLibraryUrl").focus();
  if (choice === "file") $("coordLibraryInput").click();
  if (choice && choice !== "url" && choice !== "file") useLibraryAddress(choice);
}

// Reads the library the way an evaluator's browser will, so a bad address (private,
// a preview page, no cross-origin reads) shows up here and not in the panel.
async function useLibraryAddress(address) {
  if (!address) return;
  let url;
  try {
    url = new URL(address, window.location.href);
    if (!/^https?:$/.test(url.protocol)) throw new Error("protocol");
  } catch {
    showLibraryStatus(t("coordination.badUrl"), true);
    return;
  }
  showLibraryStatus(t("coordination.checking"));
  let library;
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    library = await response.json();
  } catch (error) {
    console.error(error);
    showLibraryStatus(t("coordination.unreachable"), true);
    return;
  }
  if (!Array.isArray(library?.rows) || !library.rows.length) {
    showLibraryStatus(t("coordination.notALibrary"), true);
    return;
  }
  // Same-site libraries travel as a short relative path; others as the full address.
  const ref = url.origin === window.location.origin
    ? url.pathname.replace(new URL(".", window.location.href).pathname, "")
    : url.href;
  setLibrary(library, decodeURIComponent(url.pathname.split("/").pop()), ref);
}

function showLibraryStatus(text, isError = false) {
  $("coordLibraryName").textContent = text;
  $("coordLibraryName").classList.toggle("coord-warnings", isError);
  if (isError) {
    state.library = null;
    state.libraryRef = null;
    recompute();
  }
}

function setLibrary(library, name, ref) {
  state.library = library;
  state.libraryName = name;
  state.libraryRef = ref;
  recompute();
}

function participantLink(number) {
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set("p", String(number));
  if (state.libraryRef) url.searchParams.set("lib", state.libraryRef);
  return url.href;
}

// One card per participant: number, form, QR code and the link itself.
function renderLinks() {
  const container = $("coordLinks");
  container.replaceChildren();
  const count = Math.min(200, Math.max(0, Math.floor(Number($("coordPeople").value) || 0)));
  $("coordPrintBtn").disabled = !state.library || !count;
  if (!state.library) {
    $("coordLinksNote").textContent = "";
    const placeholder = document.createElement("p");
    placeholder.className = "coord-links-placeholder";
    placeholder.textContent = t("coordination.linksPlaceholder");
    container.append(placeholder);
    return;
  }
  $("coordLinksNote").textContent = state.libraryRef ? t("coordination.linksReady") : t("coordination.linksLocalFile");
  for (let number = 1; number <= count; number += 1) {
    const link = participantLink(number);
    const form = number % 2 ? "A" : "B";
    const card = document.createElement("article");
    card.className = "coord-card";

    const title = document.createElement("h3");
    title.textContent = t("coordination.cardTitle", { n: number, form });
    const qr = qrcode(0, "M");
    qr.addData(link);
    qr.make();
    const image = document.createElement("img");
    image.className = "coord-qr";
    image.alt = t("coordination.qrAlt", { n: number });
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true }))}`;
    const hint = document.createElement("p");
    hint.className = "coord-card-hint";
    hint.append(marked(t("coordination.cardHint")));
    const code = document.createElement("code");
    code.textContent = link;
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "secondary-btn";
    copy.textContent = t("coordination.copy");
    copy.setAttribute("aria-label", t("coordination.copyLabel", { n: number }));
    copy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(link);
      copy.textContent = t("coordination.copied");
    });
    card.append(title, image, hint, code, copy);
    container.append(card);
  }
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
      trackRounds(state.coding);
    } catch (error) {
      console.error(error);
      state.coding = { error: t("coordination.sheetsUnreadable") };
    }
  }
  render();
}

// The first complete set of sheets measures reliability. Once judges reconcile and resend
// their sheets, alpha measures forced convergence, so the first-round alpha is stored per
// panel in this browser and never overwritten; each distinct complete set is a new round.
const ROUNDS_PREFIX = "pictos-index:coding-rounds:";

function fnv(text) {
  let hash = 0x811c9dc5;
  for (const ch of text) hash = Math.imul(hash ^ ch.codePointAt(0), 0x01000193);
  return (hash >>> 0).toString(16);
}

function trackRounds(coding) {
  const key = ROUNDS_PREFIX + fnv(codingRows(state.aggregate).map((row) => row.id).sort().join(","));
  const rounds = JSON.parse(localStorage.getItem(key) || "null") || { firstRound: null, sheets: [] };
  const sheets = fnv(state.sheets.map((sheet) => sheet.text).sort().join("\u0000"));
  const complete = coding.judges.every((judge) => judge.problems.length === 0);
  if (complete && !rounds.sheets.includes(sheets)) rounds.sheets.push(sheets);
  if (complete && !rounds.firstRound) {
    rounds.firstRound = { ...coding.agreement, judges: coding.judges.length, at: new Date().toISOString() };
  }
  localStorage.setItem(key, JSON.stringify(rounds));
  coding.round = complete ? rounds.sheets.indexOf(sheets) + 1 : null;
  coding.agreement.firstRound = rounds.firstRound;
}

function render() {
  if (state.library) {
    $("coordLibraryName").textContent = `${state.library.config?.name || state.libraryName} · ${state.library.rows?.length ?? 0} ${t("coordination.items")}`;
    $("coordLibraryName").classList.remove("coord-warnings");
  } else if (!$("coordLibraryName").classList.contains("coord-warnings")) {
    $("coordLibraryName").textContent = t("coordination.noLibrary");
  }
  renderLinks();

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
    <p>${escapeHtml(t("coordination.codingSummary", { judges: coding.judges.length, alpha: formatAlpha(coding.agreement.alpha_nominal), strict: formatAlpha(coding.agreement.alpha_strict), lenient: formatAlpha(coding.agreement.alpha_lenient), disagreements: coding.disagreements.length }))}</p>
    ${coding.agreement.firstRound ? `<p>${escapeHtml(t("coordination.firstRound", { alpha: formatAlpha(coding.agreement.firstRound.alpha_nominal), round: coding.round ?? "–" }))}</p>` : ""}
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
