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
  assert.match(mirror, /aria-label=\{current \? `Show history for \$\{label\}`/);
  assert.match(mirror, /!current \? <span>History<\/span> : undefined/);
  assert.doesNotMatch(mirror, /<button[^>]*>\s*History\s*<\/button>/s);
});

test("Athena's reading has no rough heuristic and can receive evidence replies", () => {
  assert.doesNotMatch(mirror, /Rough view|gap-orbits|gapVisualReading/);
  assert.match(mirror, /function AthenaReadingReply/);
  assert.match(mirror, /answerSurveyQuestion\(current, prompt, answer, "athena-reading"\)/);
});

test("a declaration versions only through its explicit Save action", () => {
  assert.match(mirror, />\s*Save declaration\s*</);
  assert.match(mirror, /onClick=\{saveDeclaration\}/);
  assert.doesNotMatch(mirror, /commitWhenLeaving|onBlurCapture/);
  assert.match(mirror, /const nextValue = event\.currentTarget\.value;/);
  assert.match(mirror, /\[field\.key\]: nextValue/);
  assert.doesNotMatch(mirror, /\[field\.key\]: event\.currentTarget\.value/);
});

test("an empty declaration can retry an immutable completed setup chapter", () => {
  assert.match(mirror, /attempt=\$\{Date\.now\(\)\}/);
  assert.match(mirror, /if \(requestedSetupAttempt\) \{\s*return true;/);
  assert.match(
    mirror,
    /`\$\{chapterRunId\(desiredDeclarationPublication\.chapter\)\}:setup:\$\{requestedSetupAttempt\}`/,
  );
  assert.match(mirror, /runId=\{declarationSetupRunId\}/);
});
