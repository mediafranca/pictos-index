import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// The version lives in index.html (shown and exported by the app) and in package.json.
test("index.html and package.json declare the same SemVer version", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const declared = html.match(/<meta name="pictos-index-version" content="([^"]+)"/)?.[1];
  const { version } = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.equal(declared, version);
});
