import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  activeProtocolRun,
  addProtocolItem,
  addTask,
  beginProtocolRun,
  createEmptyState,
  endProtocolRun,
  protocolDay,
  setProtocolDays,
  setProtocolGoal,
  setProtocolSlipLine,
  startProtocolDraft,
  updateProtocolItem,
  updateTask,
} from "../app/os/circle-os-model.js";
import { addGoalStep, addWeekGoal, stepsForDay, updateGoal, weekGoals } from "../app/os/goal-model.js";
import { planningWeekStartKey } from "../app/os/week-app-model.js";
import { chapterAnswerText, createChapterRun } from "../app/os/chapters/chapter-model.js";

const library = JSON.parse(readFileSync("app/os/chapters/published/index.json", "utf8"));
const findChapter = (node, id) =>
  Array.isArray(node)
    ? node.flatMap((item) => findChapter(item, id))
    : node && typeof node === "object"
      ? node.id === id && node.pages ? [node] : Object.values(node).flatMap((item) => findChapter(item, id))
      : [];
const REVIEW = findChapter(library, "week-review").sort((l, r) => r.version - l.version)[0];
const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");

const REVIEWED = "2026-09-07";
const SUNDAY = "2026-09-13";
const A = {
  "review-kept": "no",
  "review-moved": "The two minutes on Tuesday",
  "review-blocked": "I kept starting after nine",
  "review-fed": "mind",
  "review-keep": "The first hour before the phone",
  "next-week-goal": "Get the first ten customers",
  "next-week-step": "Send one message",
  "next-week-term": "No phone until the first hour is done",
  "next-week-slip": "Do the two minute version",
};

test("the review reads the week plainly before it explains it", () => {
  assert.ok(REVIEW, "week-review is in the published library");
  // Did it happen, yes or no, before any explanation.
  const pages = REVIEW.pages.filter((page) => page.answerKey);
  const at = (key) => pages.findIndex((page) => page.answerKey === key);
  assert.equal(pages[at("review-kept")].type, "yes-no");
  assert.ok(at("review-kept") < at("review-moved"));
  assert.ok(at("review-moved") < at("review-blocked"));
  for (const page of pages) assert.ok(page.why, `${page.id} asks without saying why`);

  // Which part of a life the week fed — the only honest record, over months, of
  // what he has been living for.
  const fed = REVIEW.pages.find((page) => page.answerKey === "review-fed");
  assert.equal(fed.type, "single-choice");
  assert.deepEqual(fed.options.map((option) => option.id), [
    "mind", "body", "spirit", "social", "none",
  ]);

  // And the pivot is the next week's setup: the same four answers day two gave,
  // given again with a week of evidence behind them.
  for (const key of ["next-week-goal", "next-week-step", "next-week-term", "next-week-slip"]) {
    assert.ok(pages.some((page) => page.answerKey === key), `${key} is never asked`);
  }

  // It says what the week was for rather than asking him to remember, so the
  // goal of the week being read is seeded into the run.
  assert.match(shell, /answerKey: "week-just-gone"/);
  assert.match(REVIEW.pages.find((page) => page.id === "what-it-was-for").body, /\{\{week-just-gone\}\}/);
});

// Reviewing a week closes it and opens the next one.
test("the review ends the phase that ran and points the next week", () => {
  const run = {
    ...createChapterRun(REVIEW),
    status: "completed",
    answers: Object.entries(A).map(([key, value]) => ({
      pageId: key, answerKey: key, value, displaySnapshot: value,
      answeredAt: "2026-09-13T21:00:00.000Z", changedAt: "2026-09-13T21:00:00.000Z",
    })),
  };

  let state = createEmptyState();
  const old = addWeekGoal(state, REVIEWED, "goal-old");
  state = updateGoal(old.state, old.id, "Ship the first version");
  let draft = startProtocolDraft(state);
  const oldRunId = draft.id;
  state = setProtocolDays(draft.state, draft.id, 7);
  let item = addProtocolItem(state, draft.id, "non-negotiable");
  state = updateProtocolItem(item.state, draft.id, item.id, "No phone in bed");
  state = beginProtocolRun(state, draft.id, REVIEWED);
  state = setProtocolGoal(state, draft.id, old.id);

  const running = activeProtocolRun(state);
  const lasted = protocolDay(running, SUNDAY) >= running.days;
  state = endProtocolRun(state, running.id, lasted ? "completed" : "ended");

  // On a Sunday evening the Page is already planning the week ahead, so the
  // pivot writes into that one rather than into the week just read.
  const weekKey = planningWeekStartKey(SUNDAY, 21);
  assert.equal(weekKey, "2026-09-14");
  const opened = addWeekGoal(state, weekKey, `goal-week-${weekKey}`);
  state = updateGoal(opened.state, opened.id, chapterAnswerText(run, "next-week-goal"));
  const step = addGoalStep(state, opened.id, addTask, "step-next", undefined, weekKey);
  state = updateTask(step.state, step.taskId, chapterAnswerText(run, "next-week-step"));
  draft = startProtocolDraft(state);
  state = setProtocolDays(draft.state, draft.id, 7);
  item = addProtocolItem(state, draft.id, "non-negotiable");
  state = updateProtocolItem(item.state, draft.id, item.id, chapterAnswerText(run, "next-week-term"));
  state = beginProtocolRun(state, draft.id, weekKey);
  state = setProtocolGoal(state, draft.id, opened.id);
  state = setProtocolSlipLine(state, draft.id, chapterAnswerText(run, "next-week-slip"));

  // A phase kept to its last day ends as completed, not abandoned.
  assert.equal(state.protocol.runs[oldRunId].status, "completed");
  // The week just read keeps its goal: reviewing it does not erase it.
  assert.equal(weekGoals(state, REVIEWED)[0].text, "Ship the first version");
  // And the next week has a goal, a first step on its Monday, and a phase.
  assert.equal(weekGoals(state, weekKey)[0].text, A["next-week-goal"]);
  assert.deepEqual(stepsForDay(state, weekKey).map((entry) => entry.text), [A["next-week-step"]]);
  const now = activeProtocolRun(state);
  assert.equal(now.days, 7);
  assert.equal(now.goalId, opened.id);
  assert.equal(now.slipLine, A["next-week-slip"]);
});

// Sai: "we would add the review now button at the footer of the Sunday. which
// is disabled until the day has arrived. if than i forgot to review on that
// day, next week that sunday would be available."
test("the review waits behind a button on a Sunday", () => {
  assert.match(shell, /logChosenDay\.name === "Sunday" \?/);
  assert.match(shell, /disabled=\{logChosenDay\.isFuture \|\| !weekReviewChapter\}/);
  assert.match(shell, /setReviewingWeekOf\(weekStartKey\(logChosenDay\.dateKey\)\)/);
  assert.match(shell, /logChosenDay\.isFuture \? "Review on Sunday" : "Review now"/);
  // Opened by hand, not sprung: a review nobody asked for at the end of a long
  // Sunday is a review that gets skipped.
  assert.match(shell, /<ChapterSplash label="Week review">/);
  assert.doesNotMatch(shell, /weekReviewDone/);

  // The strip carries the Sunday just gone, so a week missed is still reachable
  // the following one.
  const model = readFileSync("app/os/week-app-model.js", "utf8");
  assert.match(model, /export function weekBarDays/);
});
