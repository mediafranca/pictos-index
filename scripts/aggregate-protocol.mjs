#!/usr/bin/env node
/**
 * node scripts/aggregate-protocol.mjs <library.json> <evaluation.json | folder>...
 *
 * Joins the individual exports of the experimental protocol (?forma=A / ?forma=B)
 * for one library and writes a JSON report to stdout:
 *   - per item, the blind interpretations (to be coded by judges) and the ratings
 *     given with the phrase visible (n, median, values per dimension);
 *   - per dimension, Krippendorff's ordinal alpha over the sighted ratings.
 * It checks that every export comes from the same library, protocol version and
 * split, and reports how many evaluations each form has. No average is computed.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const DIMENSIONS = [
  "clarity", "recognizability", "semantic_transparency",
  "pragmatic_fit", "cultural_adequacy", "cognitive_accessibility",
];

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

function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function listExports(paths) {
  return paths.flatMap((path) => (statSync(path).isDirectory()
    ? readdirSync(path).filter((name) => name.endsWith(".json")).map((name) => join(path, name))
    : [path]));
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
    const ratings = Object.fromEntries(DIMENSIONS.map((d) => [d, []]));
    for (const { data } of consistent) {
      const item = data.items.find((candidate) => candidate.itemId === id);
      const position = data.protocol.sequence.find((s) => s.itemId === id)?.position ?? null;
      if (item.pass === "blind") {
        const state = item.comprension_pragmatica?.estado;
        if (state === "respondida" || state === "omitida") {
          blind.push({ evaluation: data.evaluation.id, form: data.protocol.form, position, skipped: state === "omitida", guess: item.comprension_pragmatica.respuesta || "" });
        }
      } else if (item.pass === "sighted" && item.scores) {
        DIMENSIONS.forEach((d) => { if (Number.isInteger(item.scores[d])) ratings[d].push(item.scores[d]); });
      }
    }
    return {
      itemId: id,
      utterance: row.UTTERANCE ?? null,
      half: half.get(id) ?? null,
      blind,
      sighted: Object.fromEntries(DIMENSIONS.map((d) => [d, { n: ratings[d].length, median: median(ratings[d]), values: ratings[d] }])),
    };
  });

  const agreement = Object.fromEntries(DIMENSIONS.map((d) => {
    const units = items.map((item) => item.sighted[d].values);
    const alpha = krippendorffAlpha(units, "ordinal");
    return [d, { alpha_ordinal: alpha === null ? null : Math.round(alpha * 1000) / 1000, pairable_items: units.filter((u) => u.length >= 2).length }];
  }));

  return {
    schema: "pictos-index-protocol-aggregate-0.1",
    generated_at: new Date().toISOString(),
    protocol: { version: reference.version, partitionSeed: reference.partitionSeed },
    library: { name: library.config?.name ?? null, domainContext: library.config?.domainContext ?? null, items: rows.length },
    forms,
    evaluations: consistent.map(({ file, data }) => ({ file, id: data.evaluation.id, form: data.protocol.form, completedAt: data.evaluation.completedAt ?? null })),
    warnings,
    agreement,
    items,
  };
}

if (import.meta.main) {
  const [libraryPath, ...exportPaths] = process.argv.slice(2);
  if (!libraryPath || !exportPaths.length) {
    console.error("usage: node scripts/aggregate-protocol.mjs <library.json> <evaluation.json | folder>...");
    process.exit(2);
  }
  const library = JSON.parse(readFileSync(libraryPath, "utf8"));
  const files = listExports(exportPaths);
  if (!files.length) {
    console.error("no evaluation .json files found");
    process.exit(2);
  }
  const exports = files.map((file) => ({ file, data: JSON.parse(readFileSync(file, "utf8")) }));
  process.stdout.write(`${JSON.stringify(aggregate(library, exports), null, 2)}\n`);
}
