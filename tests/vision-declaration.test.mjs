import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mirror = readFileSync(
  new URL("../app/os/mirror/page.tsx", import.meta.url),
  "utf8",
);

test("Vision keeps one stable current Page per declaration kind", () => {
  assert.match(mirror, /const currentDeclarationPages = DECLARATION_PAGES\.map/);
  assert.match(mirror, /const lifeJourneyVersion = "declarations-current-v2"/);
  assert.match(mirror, /key=\{page\.current \? `current-\$\{page\.kind\}`/);
  assert.doesNotMatch(mirror, /\.\.\.versions\.map\(\(record, index\)/);
});

test("superseded declarations stay behind the shared App back", () => {
  assert.match(mirror, /useAppBack<"current" \| "history">\("current"\)/);
  assert.match(mirror, /versions\.slice\(1\)/);
  assert.match(mirror, /lifeBack\.flip\(/);
  assert.match(mirror, />\s*History\s*</);
});

test("a declaration versions only through its explicit Save action", () => {
  assert.match(mirror, />\s*Save declaration\s*</);
  assert.match(mirror, /onClick=\{saveDeclaration\}/);
  assert.doesNotMatch(mirror, /commitWhenLeaving|onBlurCapture/);
  assert.match(mirror, /const nextValue = event\.currentTarget\.value;/);
  assert.match(mirror, /\[field\.key\]: nextValue/);
  assert.doesNotMatch(mirror, /\[field\.key\]: event\.currentTarget\.value/);
});
