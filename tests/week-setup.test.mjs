import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CHARACTER_DIMENSIONS,
  activeProtocolRun,
  addProtocolItem,
  addTask,
  beginProtocolRun,
  createEmptyState,
  currentCharacter,
  currentDeclaration,
  declarationVersions,
  declareLife,
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
const WEEK_SETUP = findChapter(library, "week-setup").sort(
  (left, right) => right.version - left.version,
)[0];

const DATE = "2026-09-07";
const A = {
  "six-month-picture": "The business pays for itself",
  "six-month-why": "So I stop trading my hours for money",
  "character-mind": "Clear, and hard to fool",
  "character-body": "Lean posture and open body language",
  "character-spirit": "Settled, and not in a hurry",
  "character-social": "Warm, and easy to talk to",
  "week-goal": "Get the first ten customers",
  "week-step": "Write down who the first customer is",
  "week-term": "No phone until the first hour is done",
  "week-slip": "Do the two minute version, and let that count",
};

function answered() {
  const at = "2026-09-07T09:00:00.000Z";
  return {
    ...createChapterRun(WEEK_SETUP),
    status: "completed",
    answers: Object.entries(A).map(([key, value]) => ({
      pageId: key, answerKey: key, value, displaySnapshot: value, answeredAt: at, changedAt: at,
    })),
  };
}

test("the week is set up in one line at a time, every question saying why", () => {
  assert.ok(WEEK_SETUP, "week-setup is in the published library");
  assert.equal(WEEK_SETUP.app, "seven-days");
  const asked = WEEK_SETUP.pages.filter((page) => page.answerKey);
  for (const page of asked) assert.ok(page.why, `${page.id} asks without saying why`);

  // Six months, the four parts of him, the week and the day it slips.
  const keys = asked.map((page) => page.answerKey);
  assert.ok(keys.includes("six-month-picture"));
  for (const dimension of CHARACTER_DIMENSIONS) {
    assert.ok(keys.includes(`character-${dimension}`), `${dimension} is never asked`);
  }
  assert.ok(keys.includes("week-goal") && keys.includes("week-term"));
  // The slip line is asked here, not on day one: on day one nobody believes
  // they will miss, so the answer would be worth nothing.
  assert.ok(keys.includes("week-slip"));
  const dayOne = findChapter(library, "day-one").sort((l, r) => r.version - l.version)[0];
  assert.ok(!dayOne.pages.some((page) => page.answerKey === "week-slip"));

  // The parts of him are optional: he may still only know one of them.
  for (const dimension of CHARACTER_DIMENSIONS) {
    const page = asked.find((item) => item.answerKey === `character-${dimension}`);
    assert.notEqual(page.required, true, `${dimension} must not be compulsory`);
  }
});

// Every answer becomes a record, and none of it is a copy.
test("the week setup leaves a week with a goal, terms and a way back", () => {
  const run = answered();
  // Day one already happened: one part of him is named.
  let state = declareLife(createEmptyState(), "character", {
    body: A["character-body"], past: "A job I did not choose", starting: "body",
  });

  state = declareLife(state, "sixMonth", {
    picture: chapterAnswerText(run, "six-month-picture"),
    why: chapterAnswerText(run, "six-month-why"),
  });
  const him = currentCharacter(state);
  const traits = Object.fromEntries(
    CHARACTER_DIMENSIONS.map((dimension) => [dimension, chapterAnswerText(run, `character-${dimension}`)]),
  );
  state = declareLife(state, "character", { ...traits, past: him.past, starting: him.starting });

  const weekKey = planningWeekStartKey(DATE, 9);
  const opened = addWeekGoal(state, weekKey, "goal-week");
  state = updateGoal(opened.state, opened.id, chapterAnswerText(run, "week-goal"));
  const step = addGoalStep(state, opened.id, addTask, "step-week", undefined, DATE);
  state = updateTask(step.state, step.taskId, chapterAnswerText(run, "week-step"));

  const draft = startProtocolDraft(state);
  state = setProtocolDays(draft.state, draft.id, 7);
  const item = addProtocolItem(state, draft.id, "non-negotiable");
  state = updateProtocolItem(item.state, draft.id, item.id, chapterAnswerText(run, "week-term"));
  state = beginProtocolRun(state, draft.id, DATE);
  state = setProtocolGoal(state, draft.id, opened.id);
  state = setProtocolSlipLine(state, draft.id, chapterAnswerText(run, "week-slip"));

  // The character grew rather than being replaced: all four parts, and the one
  // line about two years ago survives from day one.
  const character = currentCharacter(state);
  assert.equal(character.traits.length, 4);
  assert.equal(character.past, "A job I did not choose");
  assert.equal(declarationVersions(state, "character").length, 2, "superseded, not overwritten");

  // Six months, with the horizon stamped on it.
  const six = currentDeclaration(state, "sixMonth");
  assert.equal(six.content.picture, A["six-month-picture"]);
  assert.equal(six.targetAt.slice(0, 7), "2027-03");

  // A week with a goal, and a first step standing on today.
  assert.equal(weekGoals(state, weekKey)[0].text, A["week-goal"]);
  assert.deepEqual(stepsForDay(state, DATE).map((entry) => entry.text), [A["week-step"]]);

  // Seven days, serving that goal, carrying the line for the day it slips.
  const phase = activeProtocolRun(state);
  assert.equal(phase.days, 7);
  assert.equal(phase.goalId, opened.id);
  assert.equal(phase.slipLine, A["week-slip"]);
  assert.equal(Object.values(phase.items)[0].text, A["week-term"]);
});

// Not the calendar's second day: someone who comes back on Friday gets it then.
test("the week is offered once a day has actually been kept", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /getDateKey\(new Date\(dayOneRunStored\.completedAt\)\) < dateKey/);
  assert.match(shell, /<ChapterSplash\s+label="Week setup"/);
  assert.match(shell, /chapterEverCompleted\(state\.chapters\.runs, weekSetupChapter\.id\)/);

  // One sheet at a time, and the week's setup stands in front of the Log's.
  assert.match(shell, /dayOneDone &&\s+weekSetupDone &&\s+logSetupPublication/);
  assert.ok(
    shell.search(/<ChapterSplash\s+label="Week setup"/) <
      shell.search(/\{dayOneDone &&\s+weekSetupDone &&\s+logSetupPublication/),
  );

  // The quality he already named arrives filled in, so day two asks for the
  // parts of him that are still blank rather than for all four again.
  assert.match(shell, /const seeds = \(him\?\.traits \|\| \[\]\)\.flatMap/);
});
