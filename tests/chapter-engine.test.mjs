import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  advanceChapterRun,
  chapterRunId,
  createChapterRun,
  findChapterAnswer,
  moveChapterRun,
  renderChapterTemplate,
  selectHourlyChapter,
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
const logSetup = published.chapters
  .filter((chapter) => chapter.id === "log-setup")
  .sort((left, right) => right.version - left.version)[0];

test("a chapter starts at its cover and saves progress one page at a time", () => {
  let run = createChapterRun(logSetup);
  assert.equal(run.runId, chapterRunId(logSetup));
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
  assert.equal(run.currentPageId, "complete");
  assert.equal(run.status, "in-progress");
  assert.equal(run.completedAt, null);
  assert.equal(findChapterAnswer(run, "routine-sleep").value, "00:30");

  run = moveChapterRun(logSetup, run, "wake");
  run = advanceChapterRun(logSetup, run, {
    page: logSetup.pages[1],
    value: "09:00",
    displaySnapshot: "09:00",
  });
  assert.equal(findChapterAnswer(run, "routine-wake").value, "09:00");
  assert.equal(run.furthestPageId, "complete");
  assert.equal(run.status, "in-progress");

  run = moveChapterRun(logSetup, run, "complete");
  run = advanceChapterRun(logSetup, run, { page: logSetup.pages[3] });
  assert.equal(run.currentPageId, "idle");
  assert.equal(run.status, "completed");
  assert.ok(run.completedAt);
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
  assert.equal(next.chapters.sessions.log.activeRunId, chapterRunId(logSetup));
  assert.equal(next.outbox[0].reason, "chapter-progress");
});

test("chapter pages can repeat a person's saved answers", () => {
  const run = {
    ...createChapterRun(logSetup),
    answers: [
      {
        pageId: "habit",
        answerKey: "habit-action",
        value: "walk for ten minutes",
        displaySnapshot: "Walk for ten minutes",
        answeredAt: "2026-07-30T00:00:00.000Z",
        changedAt: "2026-07-30T00:00:00.000Z",
      },
      {
        pageId: "identity",
        answerKey: "habit-identity",
        value: "a person who cares for my body",
        displaySnapshot: "A person who cares for my body",
        answeredAt: "2026-07-30T00:00:00.000Z",
        changedAt: "2026-07-30T00:00:00.000Z",
      },
    ],
  };

  assert.equal(
    renderChapterTemplate(
      "I will {{habit-action}} so I can become {{habit-identity}}.",
      run,
    ),
    "I will Walk for ten minutes so I can become A person who cares for my body.",
  );
});

test("hourly chapters wait until a later hour before offering the next set", () => {
  const first = { ...logSetup, id: "profile-spark-01", version: 1 };
  const second = { ...logSetup, id: "profile-spark-02", version: 1 };
  const completed = {
    ...createChapterRun(first),
    status: "completed",
    completedAt: "2026-07-30T10:15:00.000Z",
  };
  const runs = { [chapterRunId(first)]: completed };

  assert.equal(
    selectHourlyChapter(
      [first, second],
      runs,
      new Date("2026-07-30T10:45:00.000Z"),
    ).id,
    first.id,
  );
  assert.equal(
    selectHourlyChapter(
      [first, second],
      runs,
      new Date("2026-07-30T11:00:00.000Z"),
    ).id,
    second.id,
  );
});

test("a deferred optional chapter lets a fresh chapter appear first", () => {
  const later = { ...logSetup, id: "athena-checkin-a-later", version: 1 };
  const fresh = { ...logSetup, id: "athena-checkin-z-fresh", version: 1 };
  const deferred = {
    ...createChapterRun(later),
    status: "in-progress",
    deferCount: 1,
    deferredAt: "2026-07-30T10:00:00.000Z",
  };

  assert.equal(
    selectHourlyChapter(
      [later, fresh],
      { [chapterRunId(later)]: deferred },
      new Date("2026-07-30T11:00:00.000Z"),
    ).id,
    fresh.id,
  );
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

## Page: complete
Type: confirm
Title: You completed this chapter.
Button: Continue

## Page: idle
Type: idle
Title: Keep going.
`;
  const chapter = validateChapter(
    parseChapterMarkdown(source, "morning-check.md"),
    "morning-check.md",
  );

  assert.equal(chapter.id, "morning-check");
  assert.equal(chapter.pages[1].answerKey, "morning-feeling");
});

test("published chapter versions are preserved and cannot be silently changed", () => {
  const nextVersion = { ...logSetup, version: logSetup.version + 1 };
  const library = mergePublishedChapters([logSetup], [nextVersion]);

  assert.equal(chapterRunId(logSetup), `log-setup@${logSetup.version}`);
  assert.equal(chapterRunId(nextVersion), `log-setup@${logSetup.version + 1}`);
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
