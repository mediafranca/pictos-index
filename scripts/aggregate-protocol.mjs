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

import { aggregate } from "../web/protocol.js";

export { CODING_SCHEME, krippendorffAlpha, aggregate } from "../web/protocol.js";

function listExports(paths) {
  return paths.flatMap((path) => (statSync(path).isDirectory()
    ? readdirSync(path).filter((name) => name.endsWith(".json")).map((name) => join(path, name))
    : [path]));
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
