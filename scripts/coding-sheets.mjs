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

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { codingRows, mergeCoding, shuffle, toCsv } from "../web/protocol.js";

export { codingRows, mergeCoding as merge, parseCsv, toCsv } from "../web/protocol.js";

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
    process.stdout.write(`${JSON.stringify(mergeCoding(aggregate, sheets), null, 2)}\n`);
  }
}
