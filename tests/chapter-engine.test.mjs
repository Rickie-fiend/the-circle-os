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
  selectManualChapter,
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

test("a setup retry preserves the immutable completed chapter run", () => {
  const canonicalRun = {
    ...createChapterRun(logSetup),
    status: "completed",
    completedAt: "2026-08-14T12:00:00.000Z",
  };
  const retryRunId = `${chapterRunId(logSetup)}:setup:1755230400000`;
  const retryRun = {
    ...createChapterRun(logSetup),
    runId: retryRunId,
  };
  const state = {
    evidence: { localRevision: 1 },
    profile: { profileCase: { status: "ready" } },
    chapters: {
      runs: { [canonicalRun.runId]: canonicalRun },
      sessions: {},
    },
    outbox: [],
  };

  const next = storeChapterRun(state, retryRun, logSetup.session);

  assert.equal(next.chapters.runs[canonicalRun.runId], canonicalRun);
  assert.equal(next.chapters.runs[retryRunId], retryRun);
  assert.equal(next.chapters.sessions.log.activeRunId, retryRunId);
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

test("the Check-in label finds unfinished journeys without repeating completed ones", () => {
  const first = { ...logSetup, id: "profile-spark-01", version: 1 };
  const second = { ...logSetup, id: "profile-spark-02", version: 1 };
  const completedRuns = {
    [chapterRunId(first)]: {
      ...createChapterRun(first),
      status: "completed",
      completedAt: "2026-07-30T10:15:00.000Z",
    },
    [chapterRunId(second)]: {
      ...createChapterRun(second),
      status: "completed",
      completedAt: "2026-07-30T11:15:00.000Z",
    },
  };

  assert.equal(
    selectManualChapter([first, second], completedRuns, first.id),
    undefined,
  );
  assert.deepEqual(
    selectManualChapter([first, second], {}, first.id),
    { chapter: second, repeat: false },
  );
});

test("manual Check-in rotates past a Later chapter", () => {
  const current = { ...logSetup, id: "profile-spark-current", version: 1 };
  const later = { ...logSetup, id: "profile-spark-later", version: 1 };
  const fresh = { ...logSetup, id: "profile-spark-fresh", version: 1 };
  const deferred = {
    ...createChapterRun(later),
    status: "in-progress",
    deferredAt: "2026-07-31T12:00:00.000Z",
  };

  assert.deepEqual(
    selectManualChapter(
      [current, later, fresh],
      { [chapterRunId(later)]: deferred },
      current.id,
    ),
    { chapter: fresh, repeat: false },
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

test("a deferred optional chapter stays on its idle app for the current hour", () => {
  const later = { ...logSetup, id: "athena-checkin-a-later", version: 1 };
  const fresh = { ...logSetup, id: "athena-checkin-z-fresh", version: 1 };
  const deferred = {
    ...createChapterRun(later),
    status: "in-progress",
    deferCount: 1,
    deferredAt: "2026-07-30T10:20:00.000Z",
  };

  assert.equal(
    selectHourlyChapter(
      [later, fresh],
      { [chapterRunId(later)]: deferred },
      new Date("2026-07-30T10:45:00.000Z"),
    ).id,
    later.id,
  );
});

test("the Markdown authoring format compiles into a validated chapter", () => {
  const source = `---
id: morning-check
version: 1
status: draft
session: check-in
app: note
kind: check-in
completion: dwell
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

test("a new version stands beside the old, and an edit lands in place", () => {
  const nextVersion = { ...logSetup, version: logSetup.version + 1 };
  const library = mergePublishedChapters([logSetup], [nextVersion]);

  assert.equal(chapterRunId(logSetup), `log-setup@${logSetup.version}`);
  assert.equal(chapterRunId(nextVersion), `log-setup@${logSetup.version + 1}`);
  assert.equal(library.length, 2);

  // Before release, editing a chapter is editing it. Sai: "we dont need v1 v2
  // yet ... everything here is v1", and he is about to author most of them.
  const edited = mergePublishedChapters(
    [logSetup],
    [{ ...logSetup, title: "Changed in place" }],
  );
  assert.equal(edited.length, 1);
  assert.equal(edited[0].title, "Changed in place");
});

// The rail is not gone, only stood down. On the day there are people part-way
// through a chapter, its questions must not change under them.
test("once released, a published version cannot be silently changed", async () => {
  const previous = process.env.CIRCLE_OS_RELEASED;
  process.env.CIRCLE_OS_RELEASED = "1";
  try {
    // Read at module load, so the released build is a separate import.
    const fresh = await import(
      `../scripts/chapter-compiler.mjs?released=${Date.now()}`
    );
    assert.throws(
      () =>
        fresh.mergePublishedChapters(
          [logSetup],
          [{ ...logSetup, title: "Changed without a new version" }],
        ),
      /already published/,
    );
  } finally {
    if (previous === undefined) delete process.env.CIRCLE_OS_RELEASED;
    else process.env.CIRCLE_OS_RELEASED = previous;
  }
});

// A blank in a chapter's own words, filled from what the App already knows.
// This is what "This week was for it." on the Week Review is made of — and it
// had been rendering blank since the day it was written.
test("a blank in the words is filled, and is not mistaken for progress", async () => {
  const { createChapterRun, renderChapterTemplate } = await import(
    "../app/os/chapters/chapter-model.js"
  );
  const chapter = {
    id: "greet",
    version: 1,
    pages: [
      { id: "cover", type: "cover", title: "{{greeting}}", body: "" },
      { id: "week", type: "info", title: "This week is for it.", body: "{{week-goal}}" },
      { id: "ask", type: "short-text", question: "What is the one thing?", answerKey: "one-thing" },
      { id: "done", type: "result", title: "Go." },
    ],
  };
  const at = "2026-09-08T09:00:00.000Z";
  const seed = (answerKey, value) => ({
    pageId: "cover",
    answerKey,
    value,
    displaySnapshot: value,
    answeredAt: at,
    changedAt: at,
  });

  const run = createChapterRun(chapter, [
    seed("greeting", "Good morning, Sai."),
    seed("week-goal", "Run the business"),
  ]);

  // A blank belongs to the chapter, not to a Page: no Page declares it, and it
  // is looked up by name.
  assert.equal(renderChapterTemplate("{{greeting}}", run), "Good morning, Sai.");
  assert.equal(renderChapterTemplate("{{week-goal}}", run), "Run the business");

  // And a filled blank is not progress. It is the chapter knowing something
  // before it opens its mouth, so the greeting still starts on its cover.
  assert.equal(run.currentPageId, "cover");
  assert.equal(run.status, "not-started");

  // A question answered ahead of time still moves the starting Page, which is
  // what that behaviour was for.
  const seeded = createChapterRun(chapter, [
    { ...seed("one-thing", "Write the persona"), pageId: "ask" },
  ]);
  assert.notEqual(seeded.currentPageId, "cover");

  // A name the chapter never mentions is still dropped.
  const stray = createChapterRun(chapter, [seed("nowhere", "x")]);
  assert.equal(stray.answers.length, 0);
});
