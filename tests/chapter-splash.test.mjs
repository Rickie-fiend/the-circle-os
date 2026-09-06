import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { parseChapterMarkdown, validateChapter } from "../scripts/chapter-compiler.mjs";

const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
const css = readFileSync("app/os/os-app.css", "utf8");
const player = readFileSync("app/os/chapters/chapter-player.tsx", "utf8");

// Sai: "i am thinking the first time user, splash screen for the first day
// set-up ... can we use the splash screen as a chapter too? even tho we still
// have the chapter to display on each app, can we have a big full screen splash
// screen for those chapters?"
test("a setup chapter can have the screen to itself", () => {
  // The same player, the same run, the same Workshop — only the frame changes.
  assert.match(shell, /export function ChapterSplash\(/);
  assert.match(shell, /className="os-splash"/);
  assert.match(shell, /role="dialog"/);

  // A first-use setup is a splash; an ordinary delivery into an App is not.
  const gate = shell.slice(
    shell.search(/\{dayOneDone &&\s+weekSetupDone &&\s+logSetupPublication/),
    shell.indexOf('<section className="os-log-section"'),
  );
  assert.match(gate, /<ChapterSplash\s+label="Log setup"[\s\S]*?PublishedChapterDelivery/);
  assert.match(gate, /<ChapterSplash\s+label="Log setup"[\s\S]*?ChapterPlayer/);
  // One sheet at a time. Two open at once is two Pages held still and one lock
  // left behind — Sai: "i sometimes cannot scroll entirely."
  assert.match(gate, /dayOneDone &&\s+weekSetupDone &&\s+logSetupPublication/);
  assert.match(gate, /dayOneDone &&\s+weekSetupDone &&\s+!logSetupDone &&\s+logSetupChapter/);
  assert.match(gate, /aria-label="Log chapter"[\s\S]*?os-day-gated|os-day-gated[\s\S]*?aria-label="Log chapter"/);
});

// The App Box is one presentation of a chapter, not the chapter itself. Nothing
// the splash does may reach the App Box, so every rule is scoped inside it.
test("the splash does not touch the App Box", () => {
  const splash = css.slice(
    css.indexOf(".circle-os .os-splash {"),
    css.indexOf(".circle-os .os-day-gated {"),
  );
  assert.match(splash, /position: fixed/);
  assert.match(splash, /inset: 0/);
  // It fills the screen rather than standing at the App Box minimum.
  assert.match(splash, /min-height: 100%/);
  // And every selector in the block is inside .os-splash.
  for (const line of splash.split("\n")) {
    if (!line.startsWith(".circle-os")) continue;
    assert.ok(
      line.includes(".os-splash"),
      `${line.trim()} escapes the splash and would reach the App Box`,
    );
  }
});

// Sai: "i want the process itself to be the goal of the app, we will be
// educating them with why you do what you do."
test("a question can say why it is worth answering, in one line", () => {
  // Authored in the same Markdown as every other field.
  const markdown = [
    "---",
    "id: why-demo",
    "version: 1",
    "status: published",
    "session: check-in",
    "App: habit",
    "Kind: lesson",
    "Completion: swipe",
    "theme: light",
    "title: Why demo",
    "purpose: Prove the why line compiles",
    "estimated_minutes: 1",
    "---",
    "",
    "## Page: cover",
    "Type: cover",
    "Title: Why demo",
    "",
    "## Page: cue",
    "Type: short-text",
    "Question: When will you do it?",
    "Why: An existing habit is the most reliable alarm clock there is.",
    "Answer: habit-cue",
    "Required: true",
    "",
    "## Page: done",
    "Type: confirm",
    "Title: Done",
    "",
  ].join("\n");
  const chapter = validateChapter(parseChapterMarkdown(markdown, "why-demo.md"));
  const page = chapter.pages.find((item) => item.id === "cue");
  assert.equal(page.why, "An existing habit is the most reliable alarm clock there is.");

  // Drawn beside the field rather than on a Page of its own: a lesson between
  // every question is a lecture, and people skip lectures.
  assert.match(player, /page\.why \? <p className="os-chapter-why">\{page\.why\}<\/p> : null/);
  assert.match(css, /\.circle-os \.os-chapter-why,/);

  // A different voice from the question, and marked as one. A shade smaller
  // and dimmer was not enough to earn a field of its own. Sai: "if its nothing
  // special from the sub text, then whats the point of it."
  const why = css.slice(
    css.indexOf(".circle-os .os-chapter-why,"),
    css.indexOf(".circle-os .theme-dark .os-chapter-why"),
  );
  assert.match(why, /font-size: var\(--text-sm\)/);
  assert.match(why, /border-left: 2px solid var\(--c-orange\)/);

  // And typed in place in the Workshop, where the Page it lands on is visible.
  // Sai: "why this matters session, must also be tab to editable."
  assert.match(player, /className="why" label="Edit why this matters"/);
  assert.match(player, /onEdit\(page\.id, "why", value\)/);
  // An empty line needs something to tap.
  assert.match(player, /placeholder="Why this matters"/);

  // Authorable in the Workshop, and written back out to Markdown.
  const editor = readFileSync("app/os/admin/chapter-editor.tsx", "utf8");
  assert.match(editor, /Why this matters/);
  const authoring = readFileSync("app/os/admin/chapter-authoring.js", "utf8");
  assert.match(authoring, /line\("Why", page\.why\)/);
});

// Sai: "Splash screen is having double scroll, and the splash screen did not
// fixed at the position ... the spacing between paragraph are weird ... the
// input text color is also have to be white. not grey."
test("the splash is the screen, with one scroll and its own rhythm", () => {
  // Rendered onto the body, so no ancestor's stacking context can trap it and
  // let the App's own header paint over a sheet meant to be the screen.
  assert.match(shell, /createPortal\(/);
  assert.match(shell, /document\.body,/);
  // The App's class travels with it, or every rule in the stylesheet — all of
  // them scoped under .circle-os — would miss it and the sheet would collapse.
  assert.match(shell, /className="circle-os os-splash-host"/);
  assert.match(css, /\.circle-os\.os-splash-host \{\s+display: contents;/);
  // The Page behind is taken off the flow, not merely told not to scroll:
  // overflow: hidden does not stop iOS rubber-banding, and once the keyboard is
  // up the Page scrolls freely behind the sheet. Sai: "after i click to input,
  // it can scroll through the back of the app."
  assert.match(shell, /document\.body\.style\.position = "fixed";/);
  assert.match(shell, /document\.body\.style\.top = `-\$\{scrollBeforeSheets\}px`;/);
  assert.match(shell, /window\.scrollTo\(0, scrollBeforeSheets\);/);
  // And the lock is counted, so it lifts when the last sheet closes rather than
  // when whichever happens to close last puts back what it found.
  assert.match(shell, /let sheetsOpen = 0;/);
  assert.match(shell, /if \(sheetsOpen > 0\) return;/);

  // The sheet is the size of what can actually be seen. CSS cannot see a
  // keyboard; the visual viewport is the only thing that knows the real height.
  assert.match(shell, /function fitToVisibleWindow\(/);
  assert.match(shell, /sheet\.style\.height = `\$\{viewport\.height\}px`;/);
  assert.match(shell, /sheet\.style\.transform = `translateY\(\$\{viewport\.offsetTop\}px\)`;/);
  assert.match(shell, /viewport\.addEventListener\("resize", apply\)/);
  assert.match(shell, /viewport\.addEventListener\("scroll", apply\)/);

  const splash = css.slice(
    css.indexOf(".circle-os .os-splash {"),
    css.indexOf(".circle-os .os-day-gated {"),
  );
  assert.match(splash, /height: 100dvh/, "the screen, as its chrome slides away");
  assert.match(splash, /overflow: hidden/);
  assert.match(splash, /overscroll-behavior: contain/);
  // Over the App's header, which sits at 70.
  assert.match(splash, /z-index: 90/);
  // Every level carries a definite height, or the one below has nothing to take
  // a percentage of and the sheet holds a card in a void.
  assert.match(splash, /os-app-page\.current \{\s+height: 100%/);

  // Two groups, one gap: the question and its reason, then the field and the
  // button that commits it. The gap sits on the field, because the reason line
  // lives inside the form with it.
  assert.match(splash, /os-chapter-text-input,[\s\S]*?margin-top: 1\.9rem/);
  assert.match(splash, /os-page-sub \{\s+padding-top: 0\.4rem/);
  assert.match(splash, /os-page-footer \{\s+padding-top: 0\.85rem/);

  // The sheet's ink is set where a field inherits from, not on the field: it is
  // written in color: inherit, and a later rule at equal specificity wins.
  assert.match(splash, /os-survey-text,[\s\S]*?color: var\(--c-warm-50\)/);
});

// Sai: "allow the splash screen to be dismiss for now, it show up a number of
// times now. so that i have to fill everytime."
test("a setup sheet can be put down, and comes back tomorrow", () => {
  // The way out is the gesture, not a key. A Later button in the corner sat on
  // top of the progress the chapter draws there. Sai: "to dismiss, swiping
  // right on the cover page make it up. we dont need complicated later button
  // that covers the progress."
  assert.doesNotMatch(shell, /os-splash-later/);
  assert.doesNotMatch(css, /os-splash-later/);
  assert.match(player, /onBackwardBoundary=\{onDismiss\}/);

  // Every sheet that takes the screen hands its chapter a way out. A sheet
  // with no way past it is a locked door on the App behind it.
  for (const label of ["Day one", "Week review", "Week setup"]) {
    const at = shell.indexOf(`label="${label}"`);
    assert.ok(at > 0, `${label} splash is missing`);
    const block = shell.slice(at, at + 420);
    assert.ok(block.includes("onDismiss="), `${label} has no way out`);
  }
  // The published Log setup stands itself down, through the same gesture.
  assert.match(shell, /dismissOnBackSwipe/);
  assert.match(shell, /onDismiss=\{dismissOnBackSwipe \? dismiss : undefined\}/);

  // Dated, not permanent: the deferral lapses so the chapter is offered again.
  assert.match(shell, /function splashDeferredToday\(/);
  assert.match(shell, /getDateKey\(new Date\(run\.dismissedAt\)\) === dateKey/);

  const model = readFileSync("app/os/chapters/chapter-model.js", "utf8");
  assert.match(model, /export function deferChapterRun\(/);
});

test("putting a sheet down keeps what was already answered", async () => {
  const { deferChapterRun } = await import("../app/os/chapters/chapter-model.js");
  const run = {
    runId: "day-one@2",
    status: "in-progress",
    answers: [{ answerKey: "habit-action", value: "read" }],
    deferCount: 1,
  };
  const later = deferChapterRun(run, "2026-09-06T10:00:00.000Z");

  // The answers survive: he resumes rather than starts over.
  assert.deepEqual(later.answers, run.answers);
  assert.equal(later.status, "in-progress");
  assert.equal(later.dismissedAt, "2026-09-06T10:00:00.000Z");
  assert.equal(later.deferCount, 2);

  // Deferring is not finishing. The chapter is still owed.
  assert.notEqual(later.status, "completed");
  assert.equal(later.completedAt ?? null, null);
});
