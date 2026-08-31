import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mirror = readFileSync(
  new URL("../app/os/mirror/page.tsx", import.meta.url),
  "utf8",
);

test("Vision keeps one stable current Page per declaration kind", () => {
  assert.match(mirror, /const currentDeclarationPages = DECLARATION_PAGES\.map/);
  assert.match(mirror, /const lifeJourneyVersion = "declarations-current-v3"/);
  assert.match(mirror, /key=\{page\.current \? `current-\$\{page\.kind\}`/);
  assert.doesNotMatch(mirror, /\.\.\.versions\.map\(\(record, index\)/);
});

test("Vision keeps legacy Dreamline data but no longer renders it as a declaration Page", () => {
  const declarationPages = mirror.match(/const DECLARATION_PAGES:[\s\S]*?\n\];/)?.[0] || "";
  assert.doesNotMatch(declarationPages, /kind: "dreamline"/);
  assert.match(mirror, /dreamline: "declare-dreamline"/);
  assert.match(mirror, /dreamline-dream/);
});

test("superseded declarations stay behind the shared App back", () => {
  assert.match(mirror, /useAppBack<"current" \| "history">\("current"\)/);
  assert.match(mirror, /versions\.slice\(1\)/);
  assert.match(mirror, /lifeBack\.flip\(/);
  assert.match(mirror, /aria-label=\{current \? `Show history for \$\{label\}`/);
  // An indicator, not an action: it says which face this is, and it carries the
  // shared label type so it lines up with the label opposite it.
  assert.match(mirror, /<span className="os-card-label vision-history-indicator">/);
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

// Week Review became the Week App, and the Week App moved into the Log. Sai:
// "can we remove the week session temporarily. Move Week app to the back of the
// log app." Planning a week is the same act as logging a day, one size up, and
// Reflect is for reading — which is why he never opened it there.
test("Reflect no longer carries the week", () => {
  assert.doesNotMatch(mirror, /vision-week-session|vision-week-apps|os-week-strip/);
  assert.doesNotMatch(mirror, /weekDays\(|weekSpan\(|weekCoverLine\(/);
  // And nothing of the claim Pages it replaced came back.
  assert.doesNotMatch(mirror, /claim\.working|claim\.evidence|vision-week-claim/);
  assert.doesNotMatch(mirror, /buildWeekReview|buildYesterdayReview/);
});

test("Athena's Reading is four Pages with replies but no archive or question Page", () => {
  assert.match(mirror, /aria-label="Athena's Reading"/);
  assert.match(mirror, /const betweenPageCount = profileReady \? 4 : 1/);
  assert.match(mirror, /function AthenaReadingReply/);
  assert.match(mirror, /<AthenaReadingReply/);
  assert.doesNotMatch(mirror, /Earlier readings|Athena asks|AthenaAnswerPage/);
  assert.match(mirror, /Athena has not written this morning\./);
});

test("Reflect no longer names the old weekly or reading surfaces", () => {
  assert.doesNotMatch(mirror, /Seven Days|The space between/);
});
