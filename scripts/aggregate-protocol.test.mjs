import { test } from "node:test";
import assert from "node:assert/strict";
import { krippendorffAlpha } from "./aggregate-protocol.mjs";

// Reliability data from Krippendorff (2011), "Computing Krippendorff's alpha-reliability":
// four observers, twelve units, missing values omitted. Published: nominal .743, ordinal .815, interval .849.
const units = [
  [1, 1, 1], [2, 2, 3, 2], [3, 3, 3, 3], [3, 3, 3, 3], [2, 2, 2, 2], [1, 2, 3, 4],
  [4, 4, 4, 4], [1, 1, 2, 1], [2, 2, 2, 2], [5, 5, 5], [1, 1], [3],
];

test("Krippendorff alpha reproduces the published example", () => {
  assert.equal(Math.round(krippendorffAlpha(units, "nominal") * 1000) / 1000, 0.743);
  assert.equal(Math.round(krippendorffAlpha(units, "interval") * 1000) / 1000, 0.849);
  assert.equal(Math.round(krippendorffAlpha(units, "ordinal") * 1000) / 1000, 0.815);
});

test("perfect agreement gives 1; a single category gives null", () => {
  assert.equal(krippendorffAlpha([[1, 1], [2, 2], [3, 3]]), 1);
  assert.equal(krippendorffAlpha([[2, 2], [2, 2]]), null);
});

test("Wilson interval matches reference values", async () => {
  const { wilson } = await import("../web/protocol.js");
  assert.deepEqual(wilson(20, 30), [0.488, 0.808]);
  assert.deepEqual(wilson(7, 10), [0.397, 0.892]);
  assert.equal(wilson(0, 0), null);
});

test("library hash changes with an image or a phrase, and the aggregate excludes mismatches", async () => {
  const { libraryHash, aggregate } = await import("../web/protocol.js");
  const rows = [{ id: "a", UTTERANCE: "Tengo sed", bitmap: "x" }, { id: "b", UTTERANCE: "Quiero ir", bitmap: "y" }];
  const base = await libraryHash(rows);
  assert.match(base, /^[0-9a-f]{64}$/);
  assert.notEqual(await libraryHash([{ ...rows[0], bitmap: "z" }, rows[1]]), base);
  assert.notEqual(await libraryHash([{ ...rows[0], UTTERANCE: "Tengo hambre" }, rows[1]]), base);
  const evaluation = (id, form, contentHash) => ({ file: id, data: {
    evaluation: { id }, library: { contentHash },
    protocol: { version: "v", partitionSeed: 1, form, halves: { 1: ["a"], 2: ["b"] }, sequence: [] },
    items: [{ itemId: "a", pass: form === "A" ? "blind" : "sighted" }, { itemId: "b", pass: form === "A" ? "sighted" : "blind" }],
  } });
  const out = aggregate({ rows }, [evaluation("e1", "A", base), evaluation("e2", "B", base), evaluation("e3", "B", "other")]);
  assert.equal(out.evaluations.length, 2);
  assert.equal(out.libraryHash, base);
  assert.ok(out.warnings.some((w) => w.startsWith("e3:")));
});
