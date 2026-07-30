import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  advanceChapterRun,
  chapterRunId,
  createChapterRun,
  findChapterAnswer,
  storeChapterRun,
} from "../app/os/chapters/chapter-model.js";
import {
  mergePublishedChapters,
  parseChapterMarkdown,
  validateChapter,
} from "../scripts/chapter-compiler.mjs";

const published = JSON.parse(
  await readFile(
    new URL("../app/os/chapters/published/index.json", import.meta.url),
    "utf8",
  ),
);
const logSetup = published.chapters.find(
  (chapter) => chapter.id === "log-setup" && chapter.version === 1,
);

test("a chapter starts at its cover and saves progress one page at a time", () => {
  let run = createChapterRun(logSetup);
  assert.equal(run.runId, "log-setup@1");
  assert.equal(run.currentPageId, "cover");
  assert.equal(run.status, "not-started");

  run = advanceChapterRun(logSetup, run, { page: logSetup.pages[0] });
  assert.equal(run.currentPageId, "wake");
  assert.equal(run.status, "in-progress");
  assert.ok(run.startedAt);

  run = advanceChapterRun(logSetup, run, {
    page: logSetup.pages[1],
    value: "08:00",
    displaySnapshot: "08:00",
  });
  assert.equal(run.currentPageId, "sleep");
  assert.equal(findChapterAnswer(run, "routine-wake").value, "08:00");

  run = advanceChapterRun(logSetup, run, {
    page: logSetup.pages[2],
    value: "00:30",
    displaySnapshot: "00:30",
  });
  assert.equal(run.status, "completed");
  assert.ok(run.completedAt);
  assert.equal(findChapterAnswer(run, "routine-sleep").value, "00:30");
});

test("chapter progress is stored without replacing the rest of Circle state", () => {
  const run = createChapterRun(logSetup);
  const state = {
    profile: { name: "Sai" },
    chapters: { runs: {}, sessions: {} },
    outbox: [],
  };
  const next = storeChapterRun(state, run, logSetup.session);

  assert.equal(next.profile.name, "Sai");
  assert.equal(next.chapters.runs[chapterRunId(logSetup)], run);
  assert.equal(next.chapters.sessions.log.activeRunId, "log-setup@1");
  assert.equal(next.outbox[0].reason, "chapter-progress");
});

test("the Markdown authoring format compiles into a validated chapter", () => {
  const source = `---
id: morning-check
version: 1
status: draft
session: check-in
theme: light
title: Begin the morning.
purpose: Learn how the morning feels.
estimated_minutes: 1
---

## Page: cover
Type: cover
Title: Begin the morning.
Body: One small check.

## Page: feeling
Type: slider
Question: How do you feel?
Answer: morning-feeling
Min: 1
Max: 5
Required: true
`;
  const chapter = validateChapter(
    parseChapterMarkdown(source, "morning-check.md"),
    "morning-check.md",
  );

  assert.equal(chapter.id, "morning-check");
  assert.equal(chapter.pages[1].answerKey, "morning-feeling");
});

test("published chapter versions are preserved and cannot be silently changed", () => {
  const nextVersion = { ...logSetup, version: 2 };
  const library = mergePublishedChapters([logSetup], [nextVersion]);

  assert.equal(chapterRunId(logSetup), "log-setup@1");
  assert.equal(chapterRunId(nextVersion), "log-setup@2");
  assert.equal(library.length, 2);
  assert.throws(
    () =>
      mergePublishedChapters(
        [logSetup],
        [{ ...logSetup, title: "Changed without a new version" }],
      ),
    /already published/,
  );
});
