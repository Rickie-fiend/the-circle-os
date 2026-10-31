import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createEmptyState, getDateKey, normalizeState, mergeServerState } from "../app/os/circle-os-model.js";
import { createChapterRun, advanceChapterRun, chapterRunId } from "../app/os/chapters/chapter-model.js";
import { selectDayOneChapter, dayOneKeptBefore, saveDayOneProgress, dayOneSummary } from "../app/os/day-one-model.js";
import { appIsOpen } from "../app/os/phases.js";

const chapters = JSON.parse(readFileSync(new URL("../app/os/chapters/published/index.json", import.meta.url))).chapters;
const chapter = chapters.find(c => c.id === "day-one" && c.version === 3);
const day = "2026-10-31";

function completed(definition, values) {
  let run = createChapterRun(definition);
  for (const page of definition.pages) {
    run = advanceChapterRun(definition, run, { page, value: values[page.answerKey] });
  }
  return run;
}

test("new Day One asks two main questions and one optional action", () => {
  assert.equal(chapter.pages.length, 5);
  assert.deepEqual(chapter.pages.filter(p => p.required).map(p => p.answerKey),
    ["day-one-priority", "day-one-direction"]);
  assert.equal(chapter.pages.find(p => p.answerKey === "day-one-optional-action").required, false);
});

for (const action of ["", "Walk outside"]) {
  test(`Day One saves evidence without commitments: ${action || "skip"}`, () => {
    const before = createEmptyState();
    const run = completed(chapter, { "day-one-priority": "I am not sure yet",
      "day-one-direction": "I am still thinking", "day-one-optional-action": action });
    const next = saveDayOneProgress(before, chapter, run, day);
    assert.equal(run.status, "completed");
    for (const key of ["habits", "tasks", "goals", "protocol", "declarations", "days"]) {
      assert.deepEqual(next[key], before[key], key);
    }
    assert.equal(next.profile.identityFocus, before.profile.identityFocus);
    assert.equal(next.chapters.runs[run.runId].chapterVersion, 3);
    for (const answer of run.answers) {
      assert.ok(answer.answeredAt && answer.changedAt && answer.questionSnapshot);
    }
    assert.deepEqual(dayOneSummary(run), ["I am not sure yet", "I am still thinking", ...(action ? [action] : [])]);
    assert.equal(appIsOpen("protocol", next.chapters.runs), true);
    assert.equal(appIsOpen("week", next.chapters.runs), false);
    const twice = saveDayOneProgress(next, chapter, run, day);
    assert.deepEqual(twice.habits, next.habits);
    assert.deepEqual(twice.chapters.runs, next.chapters.runs);
    assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(next))).chapters.runs[run.runId].answers, run.answers);
  });
}

test("latest version is offered even after an older completion", () => {
  const old = chapters.find(c => c.id === "day-one" && c.version === 2);
  const run = completed(old, {});
  assert.equal(selectDayOneChapter(chapters, { [run.runId]: run }).version, 3);
  assert.equal(appIsOpen("protocol", { [run.runId]: run }), true);
});

test("started older runs resume against their original pages and answers", () => {
  const old = chapters.find(c => c.id === "day-one" && c.version === 2);
  const run = advanceChapterRun(old, createChapterRun(old), { page: old.pages[0] });
  const stored = { [run.runId]: run };
  assert.equal(selectDayOneChapter(chapters, stored), old);
  assert.deepEqual(stored[run.runId], run);
});

test("legacy completion still creates its intended records exactly once", () => {
  const old = chapters.find(c => c.id === "day-one" && c.version === 2);
  const run = completed(old, { "identity-focus": "A learner", "character-past": "Studying",
    "character-dimension": "mind", "character-trait": "Curious", "habit-action": "Read",
    "habit-time-place": "After breakfast", "day-one-term": "No phone in bed",
    "day-one-goal": "Read a chapter", "day-one-step": "Open a book" });
  const next = saveDayOneProgress(createEmptyState(), old, run, day);
  assert.equal(Object.keys(next.habits.definitions).length, 1);
  assert.equal(Object.keys(next.goals.items).length, 1);
  assert.equal(Object.keys(next.tasks.items).length, 1);
  assert.equal(Object.keys(next.protocol.runs).length, 1);
  const twice = saveDayOneProgress(next, old, run, day);
  for (const key of ["habits", "tasks", "goals", "protocol", "declarations"]) assert.deepEqual(twice[key], next[key]);
  const fresh = completed(chapter, { "day-one-priority": "Rest", "day-one-direction": "More sleep" });
  const after = saveDayOneProgress(next, chapter, fresh, day);
  for (const key of ["habits", "tasks", "goals", "protocol", "declarations"]) assert.deepEqual(after[key], next[key]);
  assert.deepEqual(after.chapters.runs[run.runId], run);
});

test("Week timing recognizes completion of any version at the 06:00 boundary", () => {
  const run = { ...createChapterRun(chapter), status: "completed",
    completedAt: new Date(2026, 9, 31, 5, 59).toISOString() };
  assert.equal(dayOneKeptBefore({ [run.runId]: run }, getDateKey(new Date(2026, 9, 31, 5, 59))), false);
  assert.equal(dayOneKeptBefore({ [run.runId]: run }, getDateKey(new Date(2026, 9, 31, 6, 0))), true);
  run.chapterVersion = 1;
  run.runId = "day-one@1";
  assert.equal(dayOneKeptBefore({ [run.runId]: run }, "2026-10-31"), true);
});

test("clearing an optional answer retains dated empty evidence through a stale merge", () => {
  const initial = completed(chapter, { "day-one-priority": "Rest", "day-one-direction": "Sleep",
    "day-one-optional-action": "Walk" });
  const before = saveDayOneProgress(createEmptyState(), chapter, initial, day);
  const page = chapter.pages.find(p => p.answerKey === "day-one-optional-action");
  const changedAt = new Date(Date.now() + 10_000).toISOString();
  const cleared = { ...initial, updatedAt: changedAt, answers: initial.answers.map(a => a.answerKey === page.answerKey
    ? { ...a, value: "", displaySnapshot: "", changedAt } : a) };
  const local = saveDayOneProgress(before, chapter, cleared, day);
  const merged = mergeServerState(local, before);
  assert.equal(merged.chapters.runs[chapterRunId(chapter)].answers.find(a => a.answerKey === page.answerKey).value, "");
});
