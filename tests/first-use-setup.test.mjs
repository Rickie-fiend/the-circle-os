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
  assert.match(pending, /!publication\.firstUse/);
});

// The compiled chapter is what shipped in the bundle; the published one is what
// Sai wrote. The App opens on his.
test("a published setup stands in front of the compiled one", () => {
  assert.match(shell, /const habitSetupPublication = selectFirstUsePublication\(/);
  assert.match(shell, /const logSetupPublication = selectFirstUsePublication\(/);
  assert.match(shell, /\{habitSetupPublication \? \(/);
  assert.match(shell, /\{logSetupPublication \? \(/);
  // And it is checked before the everyday publication, which is checked before
  // the compiled chapter — so the branch reads setup, delivery, bundle.
  for (const [setup, everyday, compiled] of [
    ["{habitSetupPublication ? (", ") : habitPublication ? (", ") : activeHabitChapter && activeHabitRun ? ("],
    ["{logSetupPublication ? (", ") : logPublication ? (", ") : !logSetupDone && logSetupChapter && logSetupRun ? ("],
  ]) {
    const at = (needle) => {
      const index = shell.indexOf(needle);
      assert.notEqual(index, -1, `branch missing: ${needle}`);
      return index;
    };
    assert.ok(at(setup) < at(everyday), `${setup} is not reached first`);
    assert.ok(at(everyday) < at(compiled), `${everyday} is not reached first`);
  }
});

// Without sealing, the published chapter retires on completion and the
// compiled one — still unanswered — comes straight back. Setup twice.
test("finishing a published setup seals that App for good", () => {
  assert.match(store, /export function firstUsePublicationDone/);
  assert.match(shell, /const habitSetupSealed = firstUsePublicationDone\(/);
  assert.match(shell, /const logSetupSealed = firstUsePublicationDone\(/);
  // Routine reads a completed run as "show the idle Page".
  assert.match(shell, /const sealed =\s+habitSetupSealed \|\|/);
  assert.match(shell, /if \(sealed && stored\.status !== "completed"\)/);
  assert.match(shell, /const logSetupDone =\s*\n\s*logSetupSealed \|\|/);
});

// Sai: "The setup is showing 3 times for log app." His state held log-setup@1,
// @2 and @3 — one run per version of the same setup chapter, each asking the
// same two questions from the top.
test("a setup is answered once, whatever version it was", () => {
  const model = readFileSync("app/os/chapters/chapter-model.js", "utf8");
  assert.match(model, /export function chapterEverCompleted\(runs, chapterId\)/);
  // Keyed on the chapter, not the version.
  assert.match(model, /const prefix = `\$\{chapterId\}@`/);

  // Both compiled setups read it, so a published version 2 does not re-ask.
  assert.match(shell, /chapterEverCompleted\(state\.chapters\.runs, logSetupChapter\.id\)/);
  assert.match(
    shell,
    /chapterEverCompleted\(state\.chapters\.runs, habitBuildingChapter\.id\)/,
  );

  // And a published first-use chapter stops offering itself once one of them
  // has been finished, rather than queueing the next unanswered version.
  assert.match(
    store,
    /if \(firstUsePublicationDone\(publications, targetApp, runs\)\) return null;/,
  );
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
