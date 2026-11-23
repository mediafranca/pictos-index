/**
 * Experimental protocol: the logic shared by the coordination screen of the app
 * (web/coordination.js) and the command-line scripts (scripts/*.mjs). No DOM, no
 * Node APIs: it runs in both.
 *
 *   aggregate()    joins the individual evaluation exports of one library
 *   codingRows(), toCsv(), parseCsv()
 *                  one spreadsheet per judge to code the blind interpretations
 *   mergeCoding()  reads the judges' sheets back: agreement, disagreements, codes per item
 *   resultsCsv()   one row per item with the ratings and the agreed codes
 */

// Pass 2 answers to "¿Sirve aquí?". cannot_judge is recorded but is not a value of
// the ordinal scale: it counts as missing when agreement is computed.
export const USE_ANSWERS = ["yes", "partly", "no", "cannot_judge"];
const USE_ORDINAL = { no: 1, partly: 2, yes: 3 };

// Ramírez (2018, p. 80, Fig. 9), internally called "Brugger–Frascara". Categories, not an interval scale.
export const CODING_SCHEME = {
  source: "Ramírez M., R. (2018). REDER 2(1), 71–87, p. 80, Fig. 9. https://doi.org/10.55467/reder.v2i1.12",
  codes: {
    1: "correct", 2: "almost correct", 3: "doubtful",
    4: "incorrect", 5: "opposite meaning", 6: "no answer",
  },
};

/**
 * Krippendorff's alpha from units of pairable values (Krippendorff, 2011,
 * "Computing Krippendorff's alpha-reliability"). `units` is an array of arrays of
 * values; units with fewer than two values are not pairable and are ignored.
 */
export function krippendorffAlpha(units, level = "ordinal") {
  const pairable = units.filter((values) => values.length >= 2);
  const categories = [...new Set(pairable.flat())].sort((a, b) => a - b);
  if (categories.length < 2) return null;
  const index = new Map(categories.map((value, i) => [value, i]));
  const k = categories.length;
  const o = Array.from({ length: k }, () => new Float64Array(k));
  for (const values of pairable) {
    const m = values.length;
    for (let i = 0; i < m; i += 1) {
      for (let j = 0; j < m; j += 1) {
        if (i !== j) o[index.get(values[i])][index.get(values[j])] += 1 / (m - 1);
      }
    }
  }
  const nc = o.map((row) => row.reduce((sum, x) => sum + x, 0));
  const n = nc.reduce((sum, x) => sum + x, 0);
  const delta = (c, d) => {
    if (level === "nominal") return c === d ? 0 : 1;
    if (level === "interval") return (categories[c] - categories[d]) ** 2;
    const [lo, hi] = c < d ? [c, d] : [d, c];
    let sum = 0;
    for (let g = lo; g <= hi; g += 1) sum += nc[g];
    return (sum - (nc[lo] + nc[hi]) / 2) ** 2;
  };
  let observed = 0;
  let expected = 0;
  for (let c = 0; c < k; c += 1) {
    for (let d = 0; d < k; d += 1) {
      const dd = delta(c, d);
      observed += o[c][d] * dd;
      expected += nc[c] * nc[d] * dd;
    }
  }
  return expected === 0 ? null : 1 - ((n - 1) * observed) / expected;
}

export function aggregate(library, exports) {
  const rows = library.rows || [];
  const byId = new Map(rows.map((row) => [String(row.id), row]));
  const warnings = [];
  const valid = exports.filter(({ file, data }) => {
    if (!data.protocol) { warnings.push(`${file}: not a protocol export (opened without ?forma)`); return false; }
    const ids = data.items.map((item) => item.itemId);
    if (ids.length !== byId.size || ids.some((id) => !byId.has(id))) {
      warnings.push(`${file}: items do not match the library`); return false;
    }
    return true;
  });
  if (!valid.length) return { warnings, evaluations: [] };

  const reference = valid[0].data.protocol;
  const consistent = valid.filter(({ file, data }) => {
    const p = data.protocol;
    if (p.version !== reference.version || p.partitionSeed !== reference.partitionSeed) {
      warnings.push(`${file}: different protocol version or split, excluded`); return false;
    }
    return true;
  });

  const forms = { A: 0, B: 0 };
  consistent.forEach(({ data }) => { forms[data.protocol.form] += 1; });
  if (forms.A !== forms.B) warnings.push(`unbalanced forms: A=${forms.A}, B=${forms.B}`);

  const half = new Map();
  Object.entries(reference.halves).forEach(([h, ids]) => ids.forEach((id) => half.set(id, Number(h))));

  const items = rows.map((row) => {
    const id = String(row.id);
    const blind = [];
    const use = [];
    for (const { data } of consistent) {
      const item = data.items.find((candidate) => candidate.itemId === id);
      const position = data.protocol.sequence.find((s) => s.itemId === id)?.position ?? null;
      if (item.pass === "blind") {
        const state = item.comprension_pragmatica?.estado;
        if (state === "respondida" || state === "omitida") {
          const skipped = state === "omitida";
          // Judges code these with scripts/coding-sheets.mjs; a skip counts as code 6.
          blind.push({ evaluation: data.evaluation.id, form: data.protocol.form, position, skipped, guess: item.comprension_pragmatica.respuesta || "" });
        }
      } else if (item.pass === "sighted" && USE_ANSWERS.includes(item.sirve_aqui?.respuesta)) {
        use.push({ evaluation: data.evaluation.id, form: data.protocol.form, position, answer: item.sirve_aqui.respuesta, reason: item.sirve_aqui.motivo || "" });
      }
    }
    return {
      itemId: id,
      utterance: row.UTTERANCE ?? null,
      half: half.get(id) ?? null,
      blind,
      use: {
        answers: use,
        distribution: Object.fromEntries(USE_ANSWERS.map((a) => [a, use.filter((u) => u.answer === a).length])),
      },
    };
  });

  const useUnits = items.map((item) => item.use.answers.map((u) => USE_ORDINAL[u.answer]).filter(Boolean));
  const useAlpha = krippendorffAlpha(useUnits, "ordinal");
  const agreement = {
    use: { alpha_ordinal: useAlpha === null ? null : Math.round(useAlpha * 1000) / 1000, pairable_items: useUnits.filter((u) => u.length >= 2).length },
  };

  return {
    schema: "pictos-index-protocol-aggregate-0.2",
    generated_at: new Date().toISOString(),
    protocol: { version: reference.version, partitionSeed: reference.partitionSeed },
    library: { name: library.config?.name ?? null, domainContext: library.config?.domainContext ?? null, items: rows.length },
    forms,
    coding_scheme: CODING_SCHEME,
    evaluations: consistent.map(({ file, data }) => ({ file, id: data.evaluation.id, form: data.protocol.form, completedAt: data.evaluation.completedAt ?? null })),
    warnings,
    agreement,
    items,
  };
}

const HEADER = ["id", "frase", "respuesta", "codigo"];

// Opaque, stable id for an answer: FNV-1a over item and evaluation, so judges cannot
// tell who answered, and the same id is recomputed when the sheets come back.
function answerId(itemId, evaluation) {
  let hash = 0x811c9dc5;
  for (const ch of `${itemId}|${evaluation}`) hash = Math.imul(hash ^ ch.codePointAt(0), 0x01000193);
  let hash2 = 0x01000193;
  for (const ch of `${evaluation}|${itemId}`) hash2 = Math.imul(hash2 ^ ch.codePointAt(0), 0x811c9dc5);
  return (hash >>> 0).toString(16).padStart(8, "0") + (hash2 >>> 0).toString(16).padStart(8, "0").slice(0, 2);
}

/** One row per non-skipped blind interpretation, with an id that reveals nothing. */
export function codingRows(aggregate) {
  return aggregate.items.flatMap((item) => item.blind
    .filter((answer) => !answer.skipped)
    .map((answer) => ({
      id: answerId(item.itemId, answer.evaluation),
      itemId: item.itemId,
      frase: item.utterance ?? "",
      respuesta: answer.guess,
    })));
}

export function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;

export function toCsv(rows) {
  const lines = [HEADER.map(quote).join(";"), ...rows.map((row) => [row.id, row.frase, row.respuesta, ""].map(quote).join(";"))];
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** RFC 4180 parser; the delimiter (";" or ",") is taken from the header line. */
export function parseCsv(text) {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const delimiter = firstLine.includes(";") ? ";" : ",";
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((cell) => cell.trim()));
  const col = Object.fromEntries(header.map((name, i) => [name.trim().toLowerCase(), i]));
  return body.map((cells) => ({ id: cells[col.id]?.trim(), codigo: cells[col.codigo]?.trim() ?? "" }));
}

export function mergeCoding(aggregate, sheets) {
  const rows = codingRows(aggregate);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const judges = sheets.map(({ name, text }) => {
    const codes = new Map();
    const problems = [];
    for (const { id, codigo } of parseCsv(text)) {
      if (!byId.has(id)) { problems.push(`unknown id ${id}`); continue; }
      if (codigo === "") continue;
      const code = Number(codigo);
      if (!Number.isInteger(code) || !CODING_SCHEME.codes[code]) problems.push(`${id}: invalid code "${codigo}"`);
      else codes.set(id, code);
    }
    const missing = rows.filter((row) => !codes.has(row.id)).length;
    if (missing) problems.push(`${missing} of ${rows.length} answers not coded`);
    return { name, codes, problems };
  });

  const units = rows.map((row) => judges.map((judge) => judge.codes.get(row.id)).filter((code) => code !== undefined));
  const alpha = krippendorffAlpha(units, "nominal");
  const disagreements = rows
    .map((row, i) => ({ row, codes: Object.fromEntries(judges.map((judge) => [judge.name, judge.codes.get(row.id) ?? null])), values: units[i] }))
    .filter(({ values }) => new Set(values).size > 1)
    .map(({ row, codes }) => ({ id: row.id, frase: row.frase, respuesta: row.respuesta, codes }));

  // Per item: agreed codes only (every judge gave the same one), plus skipped answers as 6.
  const agreed = new Map(rows.map((row, i) => [row.id, units[i].length === judges.length && new Set(units[i]).size === 1 ? units[i][0] : null]));
  const items = aggregate.items.map((item) => {
    const distribution = Object.fromEntries(Object.keys(CODING_SCHEME.codes).map((code) => [code, 0]));
    let unresolved = 0;
    item.blind.forEach((answer) => {
      if (answer.skipped) { distribution[6] += 1; return; }
      const code = agreed.get(answerId(item.itemId, answer.evaluation));
      if (code) distribution[code] += 1; else unresolved += 1;
    });
    return { itemId: item.itemId, utterance: item.utterance, answers: item.blind.length, distribution, unresolved };
  });

  return {
    schema: "pictos-index-coding-0.1",
    generated_at: new Date().toISOString(),
    coding_scheme: CODING_SCHEME,
    judges: judges.map(({ name, codes, problems }) => ({ name, coded: codes.size, problems })),
    agreement: { alpha_nominal: alpha === null ? null : Math.round(alpha * 1000) / 1000, answers: rows.length, pairable: units.filter((u) => u.length >= 2).length },
    disagreements,
    items,
  };
}

/** One row per item: half, agreed codes (if the judges' sheets are in) and the "¿Sirve aquí?" answers. */
export function resultsCsv(aggregate, coding = null) {
  const codes = Object.keys(CODING_SCHEME.codes);
  const head = ["item", "frase", "mitad", "interpretaciones",
    ...(coding ? [...codes.map((c) => `codigo_${c}`), "sin_resolver"] : []),
    "sirve_si", "sirve_con_reservas", "sirve_no", "no_puede_juzgar"];
  const byItem = new Map((coding?.items || []).map((item) => [item.itemId, item]));
  const lines = aggregate.items.map((item) => {
    const coded = byItem.get(item.itemId);
    return [item.itemId, item.utterance ?? "", item.half ?? "", item.blind.length,
      ...(coding ? [...codes.map((c) => coded?.distribution[c] ?? 0), coded?.unresolved ?? 0] : []),
      ...USE_ANSWERS.map((a) => item.use.distribution[a])];
  });
  return `\uFEFF${[head, ...lines].map((row) => row.map(quote).join(";")).join("\r\n")}\r\n`;
}
