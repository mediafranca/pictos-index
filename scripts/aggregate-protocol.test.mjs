import { test } from "node:test";
import assert from "node:assert/strict";
import { krippendorffAlpha } from "./aggregate-protocol.mjs";

// Reliability data from Krippendorff (2011), "Computing Krippendorff's alpha-reliability":
// four observers, twelve units, missing values omitted. Published: interval .849, ordinal .815.
const units = [
  [1, 1, 1], [2, 2, 3, 2], [3, 3, 3, 3], [3, 3, 3, 3], [2, 2, 2, 2], [1, 2, 3, 4],
  [4, 4, 4, 4], [1, 1, 2, 1], [2, 2, 2, 2], [5, 5, 5], [1, 1], [3],
];

test("Krippendorff alpha reproduces the published example", () => {
  assert.equal(Math.round(krippendorffAlpha(units, "interval") * 1000) / 1000, 0.849);
  assert.equal(Math.round(krippendorffAlpha(units, "ordinal") * 1000) / 1000, 0.815);
});

test("perfect agreement gives 1; a single category gives null", () => {
  assert.equal(krippendorffAlpha([[1, 1], [2, 2], [3, 3]]), 1);
  assert.equal(krippendorffAlpha([[2, 2], [2, 2]]), null);
});
