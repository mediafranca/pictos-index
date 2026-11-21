import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const locales = ["es-419", "en-GB"];
const catalogues = Object.fromEntries(
  locales.map((locale) => [locale, JSON.parse(fs.readFileSync(path.join(root, "locales", `${locale}.json`), "utf8"))]),
);

const flatten = (value, prefix = "") => Object.entries(value).flatMap(([key, child]) => {
  const next = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === "object" && !Array.isArray(child) ? flatten(child, next) : [next];
});

const canonicalKeys = flatten(catalogues[locales[0]]).sort();
let failed = false;
for (const locale of locales.slice(1)) {
  const keys = flatten(catalogues[locale]).sort();
  const missing = canonicalKeys.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !canonicalKeys.includes(key));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`${locale}: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`);
  }
}

const sourceFiles = ["index.html", "web/app.js"];
const usedKeys = new Set();
for (const file of sourceFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of source.matchAll(/(?:data-i18n(?:-[a-z-]+)?=["']|\bt\(["'`])([\w.-]+)/g)) usedKeys.add(match[1]);
}
const unusedOrMissing = [...usedKeys].filter((key) => !key.endsWith(".") && !canonicalKeys.includes(key));
if (unusedOrMissing.length) {
  failed = true;
  console.error(`Keys used but absent from catalogues: ${unusedOrMissing.join(", ")}`);
}

const rubric = JSON.parse(fs.readFileSync(path.join(root, "data", "rubric-scale-descriptions.json"), "utf8"));
for (const [dimensionKey, dimension] of Object.entries(rubric.dimensions || {})) {
  for (const field of ["name_es", "name_en", "description_es", "description_en"]) {
    if (!dimension[field]) {
      failed = true;
      console.error(`Rubric ${dimensionKey} is missing ${field}`);
    }
  }
  for (const score of ["1", "2", "3", "4", "5"]) {
    if (!dimension.levels?.[score]?.text_es || !dimension.levels?.[score]?.text_en) {
      failed = true;
      console.error(`Rubric ${dimensionKey} level ${score} is not bilingual`);
    }
  }
}
for (const score of ["1", "2", "3", "4", "5"]) {
  const level = rubric.scale?.[score];
  if (!level?.label_es || !level?.label_en || !level?.general_es || !level?.general_en) {
    failed = true;
    console.error(`Scale level ${score} is not bilingual`);
  }
}

if (failed) process.exit(1);
console.log(`i18n OK: ${canonicalKeys.length} keys in ${locales.join(" and ")}`);
