#!/usr/bin/env node
/**
 * Coding the blind interpretations with spreadsheets, one per judge, without a server.
 *
 *   node scripts/coding-sheets.mjs sheets <aggregate.json> <out-dir> [--judges 2]
 *     Writes juez-1.csv, juez-2.csv, ... Each row has an opaque id, the source
 *     phrase, the open answer and an empty `codigo` column. Every sheet has its own
 *     random order and shows neither the evaluator, the form nor the position.
 *     Skipped answers are left out: they are coded 6 without judgement.
 *
 *   node scripts/coding-sheets.mjs merge <aggregate.json> <juez-1.csv> <juez-2.csv> ...
 *     Reads the sheets back and writes to stdout: problems in each sheet, nominal
 *     Krippendorff alpha between judges, disagreements to resolve, and per item the
 *     distribution of agreed codes. The judge's name is the file name.
 *
 * Codes: Ramírez (2018, p. 80) six-value scheme (CODING_SCHEME). Sheets use ";" and a
 * UTF-8 BOM so that Excel with Spanish regional settings opens them in columns;
 * on reading, "," is also accepted.
 */

import { createHash, randomInt } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { CODING_SCHEME, krippendorffAlpha } from "./aggregate-protocol.mjs";

const HEADER = ["id", "frase", "respuesta", "codigo"];

const answerId = (itemId, evaluation) => createHash("sha256").update(`${itemId}|${evaluation}`).digest("hex").slice(0, 10);

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

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
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

export function merge(aggregate, sheets) {
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

if (import.meta.main) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { judges: { type: "string", default: "2" } } });
  const [command, aggregatePath, ...rest] = positionals;
  const usage = "usage:\n  node scripts/coding-sheets.mjs sheets <aggregate.json> <out-dir> [--judges 2]\n  node scripts/coding-sheets.mjs merge <aggregate.json> <juez-1.csv> <juez-2.csv> ...";
  if (!aggregatePath || !["sheets", "merge"].includes(command)) { console.error(usage); process.exit(2); }
  const aggregate = JSON.parse(readFileSync(aggregatePath, "utf8"));

  if (command === "sheets") {
    const [outDir] = rest;
    const count = Number(values.judges);
    if (!outDir || !Number.isInteger(count) || count < 2) { console.error(usage); process.exit(2); }
    mkdirSync(outDir, { recursive: true });
    const rows = codingRows(aggregate);
    for (let j = 1; j <= count; j += 1) writeFileSync(join(outDir, `juez-${j}.csv`), toCsv(shuffle(rows)));
    console.error(`${count} sheets, ${rows.length} answers each, in ${outDir}`);
  } else {
    if (rest.length < 2) { console.error("merge needs at least two sheets"); process.exit(2); }
    const sheets = rest.map((file) => ({ name: basename(file, ".csv"), text: readFileSync(file, "utf8") }));
    process.stdout.write(`${JSON.stringify(merge(aggregate, sheets), null, 2)}\n`);
  }
}
