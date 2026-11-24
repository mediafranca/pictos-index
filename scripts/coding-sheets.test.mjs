import { test } from "node:test";
import assert from "node:assert/strict";
import { codingRows, merge, parseCsv, toCsv } from "./coding-sheets.mjs";

const aggregate = {
  items: [
    { itemId: "i1", utterance: "Tengo fiebre", blind: [
      { evaluation: "e1", guess: 'tiene calor; dice "uf"', skipped: false },
      { evaluation: "e2", guess: "fiebre", skipped: false },
    ] },
    { itemId: "i2", utterance: "Quiero agua", blind: [
      { evaluation: "e1", guess: "", skipped: true },
      { evaluation: "e3", guess: "sed\nmucha", skipped: false },
    ] },
  ],
};

test("CSV round trip keeps quotes, delimiters and line breaks", () => {
  const rows = codingRows(aggregate);
  assert.equal(rows.length, 3); // the skipped answer is not coded by judges
  const parsed = parseCsv(toCsv(rows));
  assert.deepEqual(parsed.map((r) => r.id), rows.map((r) => r.id));
  assert.ok(parseCsv('id,codigo\nabc,2\n')[0].codigo === "2"); // comma sheets too
});

test("merge: agreement, disagreements and per-item distribution", () => {
  const rows = codingRows(aggregate);
  const sheet = (codes) => `id;codigo\n${rows.map((r, i) => `${r.id};${codes[i]}`).join("\n")}\n`;
  const out = merge(aggregate, [{ name: "juez-1", text: sheet([3, 1, 2]) }, { name: "juez-2", text: sheet([3, 1, 4]) }]);
  assert.equal(out.disagreements.length, 1);
  assert.deepEqual(out.disagreements[0].codes, { "juez-1": 2, "juez-2": 4 });
  assert.deepEqual(out.items[0].distribution, { 1: 1, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0 });
  assert.equal(out.items[1].distribution[6], 1);
  assert.equal(out.items[1].unresolved, 1);
  // item 0: codes 1 and 3 settled → strict 1/2, lenient 1/2; item 1: only the skip settles → 0
  assert.equal(out.items[0].comprehension.strict, 0.5);
  assert.equal(out.items[0].comprehension.lenient, 0.5);
  assert.deepEqual(out.items[0].comprehension.strict_ci95, [0.095, 0.905]);
  assert.equal(out.items[1].comprehension.strict, 0);
  assert.equal(out.items[1].comprehension.settled, 1);
  // judges split 2 against 4 on one answer: both sides miss the strict rule (alpha 1),
  // but only one meets the lenient rule
  assert.equal(out.agreement.alpha_strict, 1);
  assert.ok(out.agreement.alpha_lenient < 1);
  assert.deepEqual(out.judges.map((j) => j.problems), [[], []]);
});
