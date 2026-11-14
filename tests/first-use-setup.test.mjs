import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
const store = readFileSync("app/os/chapters/chapter-publication-store.ts", "utf8");
const editor = readFileSync("app/os/admin/chapter-editor.tsx", "utf8");
const authoring = readFileSync("app/os/admin/chapter-authoring.js", "utf8");

// Sai authors the first-use chapters in Admin: "make sure i can recheck and
// edit in admin mode." A published First Time Use chapter has to *be* the App's
// setup, not merely visit the App the way an ordinary delivery does.
test("a First Time Use draft publishes as the App's setup", () => {
  assert.match(authoring, /export const FIRST_USE_CATEGORY = "First Time Use"/);
  assert.match(editor, /const firstUse = publishedDraft\.category === FIRST_USE_CATEGORY/);
  // Both the private and the public publish paths carry it.
  assert.equal((editor.match(/^\s*firstUse,$/gm) ?? []).length, 2);
  assert.match(store, /firstUse: Boolean\(publication\.firstUse\)/);
});

// A setup publication is the App until it is finished, so it must not also be
// dealt from the ordinary delivery queue or it arrives twice.
test("a setup chapter is not also an everyday delivery", () => {
  const pending = store.match(
    /export function selectPendingAppPublication[\s\S]*?\n}/,
  )?.[0];
  assert.ok(pending, "selectPendingAppPublication moved");
  assert.match(pending, /!candidate\.firstUse/);
});


test("an App offers only the newest version of an ordinary publication", () => {
  const pending = store.match(
    /export function selectPendingAppPublication\([\s\S]*?\n}/,
  )?.[0];
  assert.ok(pending, "selectPendingAppPublication moved");
  assert.match(pending, /const latestByChapter = new Map/);
  assert.match(pending, /publication\.chapter\.version > latest\.chapter\.version/);
  assert.match(pending, /\[\.\.\.latestByChapter\.values\(\)\]/);
});

test("published Log setup writes its wake and sleep answers to routine evidence", () => {
  assert.match(shell, /function savePublishedLogSetup\(/);
  assert.match(shell, /for \(const answerKey of \["routine-wake", "routine-sleep"\]\)/);
  assert.match(shell, /savePublishedLogSetup\(current, logPublication\.chapter, run\)/);
  assert.match(shell, /savePublishedLogSetup\(current, logSetupPublication\.chapter, run\)/);
});

// The time field on a setup Page. Sai's screenshot showed it standing 22px to
// the right of the Continue key under it, past the Page's own edge.
test("a time answer is as wide as the key beneath it, and no wider", () => {
  const css = readFileSync("app/os/os-app.css", "utf8");
  const field = css.slice(
    css.indexOf(".circle-os .os-survey-time input {"),
    css.indexOf(".circle-os .os-survey-text input {"),
  );
  assert.match(field, /min-width: 0;/, "a grid item shrinks to the Page");
  assert.match(field, /max-width: 100%;/);
  assert.match(field, /-webkit-appearance: none;/, "iOS draws the Page's field");
});
