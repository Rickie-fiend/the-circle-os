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
    shell.indexOf("{logSetupPublication ? ("),
    shell.indexOf('<section className="os-log-section"'),
  );
  assert.match(gate, /<ChapterSplash label="Log setup">[\s\S]*?PublishedChapterDelivery/);
  assert.match(gate, /<ChapterSplash label="Log setup">[\s\S]*?ChapterPlayer/);
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
  assert.match(css, /\.circle-os \.os-chapter-why \{/);
  // And it is quieter than the question it belongs to.
  const why = css.slice(
    css.indexOf(".circle-os .os-chapter-why {"),
    css.indexOf(".circle-os .theme-dark .os-chapter-why"),
  );
  assert.match(why, /font-size: var\(--text-sm\)/);

  // Authorable in the Workshop, and written back out to Markdown.
  const editor = readFileSync("app/os/admin/chapter-editor.tsx", "utf8");
  assert.match(editor, /Why this matters/);
  const authoring = readFileSync("app/os/admin/chapter-authoring.js", "utf8");
  assert.match(authoring, /line\("Why", page\.why\)/);
});
