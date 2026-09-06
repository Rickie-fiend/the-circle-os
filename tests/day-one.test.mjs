import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  activeProtocolRun,
  addHabitDefinition,
  addProtocolItem,
  addTask,
  beginProtocolRun,
  composeHabitText,
  createEmptyState,
  currentCharacter,
  declareLife,
  setHabitDimension,
  setProtocolDays,
  startProtocolDraft,
  updateHabitDefinitionParts,
  updateProtocolItem,
  updateTask,
} from "../app/os/circle-os-model.js";
import {
  addGoalStep,
  addWeekGoal,
  stepsForDay,
  updateGoal,
  weekGoals,
} from "../app/os/goal-model.js";
import { weekStartKey } from "../app/os/week-app-model.js";
import { chapterAnswerText, createChapterRun } from "../app/os/chapters/chapter-model.js";

const library = JSON.parse(
  readFileSync("app/os/chapters/published/index.json", "utf8"),
);
const findChapter = (node, id) =>
  Array.isArray(node)
    ? node.flatMap((item) => findChapter(item, id))
    : node && typeof node === "object"
      ? node.id === id && node.pages
        ? [node]
        : Object.values(node).flatMap((item) => findChapter(item, id))
      : [];

// The latest version, not the first: a chapter is immutable, so editing it in
// the Workshop leaves the old one in the library beside the new one.
const DAY_ONE = findChapter(library, "day-one").sort(
  (left, right) => right.version - left.version,
)[0];
const DATE = "2026-09-06";
const ANSWERS = {
  "character-past": "Working a job I did not choose",
  "identity-focus": "An entrepreneur",
  "character-dimension": "body",
  "character-trait": "Lean posture and open body language",
  "habit-action": "Stand up straight for one minute",
  "habit-time-place": "After my morning coffee",
  "day-one-term": "No phone in bed",
  "day-one-goal": "Write the first page",
  "day-one-step": "Open the doc and write one sentence",
};

function answeredRun() {
  const at = "2026-09-06T09:00:00.000Z";
  return {
    ...createChapterRun(DAY_ONE),
    status: "completed",
    answers: Object.entries(ANSWERS).map(([key, value]) => ({
      pageId: key,
      answerKey: key,
      value,
      displaySnapshot: value,
      answeredAt: at,
      changedAt: at,
    })),
  };
}

test("day one asks one line at a time, and every question says why", () => {
  assert.ok(DAY_ONE, "the chapter is in the published library");
  assert.equal(DAY_ONE.app, "seven-days");
  // Every question carries its one line of teaching, so setting up is the
  // lesson. Sai: "i want the process itself to be the goal of the app."
  const asked = DAY_ONE.pages.filter((page) => page.answerKey);
  assert.ok(asked.length >= 6);
  for (const page of asked) {
    assert.ok(page.why, `${page.id} asks without saying why`);
  }
  // One part of a life is chosen, not typed. Sai: "choose from 4 dimensions."
  const dimension = DAY_ONE.pages.find((page) => page.answerKey === "character-dimension");
  assert.equal(dimension.type, "single-choice");
  assert.deepEqual(
    dimension.options.map((option) => option.id),
    ["mind", "body", "spirit", "social"],
  );
});

// Every line answered becomes a record he can see and edit afterwards. Nothing
// is a copy: the habit is a habit, the step is a Routine task, the goal is the
// week's goal.
test("day one leaves an App with something in it", () => {
  const run = answeredRun();
  let state = createEmptyState();

  const dimension = chapterAnswerText(run, "character-dimension");
  const trait = chapterAnswerText(run, "character-trait");
  state = declareLife(state, "character", {
    [dimension]: trait,
    past: chapterAnswerText(run, "character-past"),
    starting: dimension,
  });

  const action = chapterAnswerText(run, "habit-action");
  const cue = chapterAnswerText(run, "habit-time-place");
  const added = addHabitDefinition(state);
  state = updateHabitDefinitionParts(added.state, added.id, {
    action,
    cue,
    identity: trait,
    text: composeHabitText({ action, cue, identity: trait }),
  });
  state = setHabitDimension(state, added.id, dimension);

  const draft = startProtocolDraft(state);
  state = setProtocolDays(draft.state, draft.id, 1);
  const item = addProtocolItem(state, draft.id, "non-negotiable");
  state = updateProtocolItem(item.state, draft.id, item.id, chapterAnswerText(run, "day-one-term"));
  state = beginProtocolRun(state, draft.id, DATE);

  const opened = addWeekGoal(state, weekStartKey(DATE), "goal-day-one");
  state = updateGoal(opened.state, opened.id, chapterAnswerText(run, "day-one-goal"));
  const step = addGoalStep(state, opened.id, addTask, "step-day-one", undefined, DATE);
  state = updateTask(step.state, step.taskId, chapterAnswerText(run, "day-one-step"));

  // A character, standing two years out, begun with one trait in one part.
  const him = currentCharacter(state);
  assert.deepEqual(him.traits, [{ dimension: "body", trait: ANSWERS["character-trait"] }]);
  assert.equal(him.targetAt.slice(0, 4), "2028");

  // The trait made small enough to do today, and it knows which part it feeds.
  const habit = state.habits.definitions[added.id];
  assert.equal(habit.dimension, "body");
  assert.equal(habit.identity, ANSWERS["character-trait"]);
  assert.equal(habit.cue, ANSWERS["habit-time-place"]);

  // A phase of one day. Sai: "the protocol i will have to follow for 1 day."
  const phase = activeProtocolRun(state);
  assert.equal(phase.days, 1);
  assert.equal(phase.status, "active");
  assert.equal(Object.values(phase.items)[0].text, ANSWERS["day-one-term"]);

  // Today's one thing, with the two minutes that start it — and that step is
  // the Routine task, so the App opens with something to do.
  assert.equal(weekGoals(state, weekStartKey(DATE))[0].text, ANSWERS["day-one-goal"]);
  assert.deepEqual(
    stepsForDay(state, DATE).map((entry) => entry.text),
    [ANSWERS["day-one-step"]],
  );
  assert.deepEqual(
    Object.values(state.tasks.items).map((task) => task.text),
    [ANSWERS["day-one-step"]],
  );
});

// It is the front door, so it takes the screen, and it is offered until it has
// been answered once — whatever version he has since edited in the Workshop.
test("day one is a splash, asked once", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /<ChapterSplash label="Day one">/);
  assert.match(shell, /chapterEverCompleted\(state\.chapters\.runs, dayOneChapter\.id\)/);
  assert.match(shell, /function saveDayOneRun\(nextRun: ChapterRun\)/);
  // It stands in front of the other setups rather than among them.
  assert.ok(
    shell.indexOf('<ChapterSplash label="Day one">') <
      shell.indexOf("{dayOneDone && weekSetupDone && logSetupPublication ? ("),
  );
});

// Sai: "To become - a good speaker - i will - practice speaking for 1 min -
// after lunch." Who first, then what, then when: the reason comes before the
// work, so the work is what the reason costs.
test("a habit reads as one sentence, reason first", () => {
  assert.equal(
    composeHabitText({
      identity: "a good speaker",
      action: "practice speaking for 1 min",
      cue: "after lunch",
    }),
    "To become a good speaker, I will practice speaking for 1 min after lunch.",
  );
  // Without a reason it is still a sentence, and without an anchor too.
  assert.equal(
    composeHabitText({ action: "practice speaking for 1 min", cue: "after lunch" }),
    "I will practice speaking for 1 min after lunch.",
  );
  assert.equal(composeHabitText({ action: "practice speaking" }), "practice speaking");
  assert.equal(composeHabitText({ cue: "after lunch" }), "", "an anchor alone is nothing");
});

// The one word the whole App points back at: it is the Routine App's own name,
// so what he is building is written above the things he does. Sai: "describe
// your ideal self, in one word, (entrepreneur, leader, a good father)."
test("day one asks who he is in one word", () => {
  const page = DAY_ONE.pages.find((item) => item.answerKey === "identity-focus");
  assert.ok(page, "day one asks for the ideal self");
  assert.equal(page.type, "short-text");
  assert.ok(page.why);
  // It is asked before the part of him and the quality inside it, because it is
  // the thing those are parts of.
  const at = (key) => DAY_ONE.pages.findIndex((item) => item.answerKey === key);
  assert.ok(at("identity-focus") < at("character-dimension"));
  assert.ok(at("character-dimension") < at("character-trait"));

  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /updateRoutineIdentity\(next, idealSelf\)/);
});
