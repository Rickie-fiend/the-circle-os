import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  findQuest,
  questCatalogue,
  questProgress,
  questTopics,
  questStepStatus,
} from "../app/os/quests.js";

// The manifest is compiled from the vault, so the test reads what the App
// reads rather than a copy of it.
const QUESTS = JSON.parse(
  readFileSync("app/os/chapters/published/quests.json", "utf8"),
).quests;

const library = JSON.parse(
  readFileSync("app/os/chapters/published/index.json", "utf8"),
);
const sparks = JSON.parse(
  readFileSync("app/os/chapters/published/sparks.json", "utf8"),
);
const published = [...library.chapters, ...sparks.chapters];
const getChapter = (id) =>
  published
    .filter((chapter) => chapter.id === id)
    .sort((left, right) => right.version - left.version)[0];

const completed = (id, version = 1) => [
  `${id}@${version}`,
  { runId: `${id}@${version}`, chapterId: id, status: "completed" },
];

test("existing setup evidence completes only its own steps without inventing runs", () => {
  const state = { habits: { definitions: { h: { status: "active", text: "Walk after breakfast" } } },
    profile: { profileCase: { survey: { answers: [{ questionId: "routine-wake", answer: "07:00" }, { questionId: "routine-sleep", answer: "23:00" }] } } },
    declarations: { records: { v: { kind: "vision", content: { life: "A quiet life" } } } } };
  const before = structuredClone(state), runs = {};
  for (const id of ["habit-building", "log-setup", "declare-vision"]) {
    assert.deepEqual(questStepStatus(id, runs, { state }), { done: true, alreadySetUp: true, runId: null });
  }
  for (const id of ["week-setup", "week-review", "day-one", "profile-spark-01", "declare-mission-statement"]) assert.equal(questStepStatus(id, runs, { state }).done, false);
  assert.deepEqual(runs, {}); assert.deepEqual(state, before);
  state.habits.definitions.h.status = "draft";
  assert.equal(questStepStatus("habit-building", runs, { state }).done, false);
  state.profile.profileCase.survey.answers.pop();
  assert.equal(questStepStatus("log-setup", runs, { state }).done, false);
});

test("a completed alternative first-use chapter counts, retaining its actual run link", () => {
  const runs = { "custom-habit@1": { status: "completed", completedAt: "2020-01-01T01:00:00Z" } };
  const publications = [{ firstUse: true, targetApp: "habit", chapter: { id: "custom-habit", version: 1 }, visibility: "public" }];
  assert.deepEqual(questStepStatus("habit-building", runs, { publications }), { done: true, alreadySetUp: true, runId: "custom-habit@1" });
  assert.equal(questStepStatus("log-setup", runs, { publications }).done, false);
  assert.equal(questStepStatus("habit-building", runs, { publications: [{ ...publications[0], visibility: "private", audienceProfileId: "someone-else" }] }).done, false);
  assert.equal(questStepStatus("habit-building", runs, { publications: [{ ...publications[0], firstUse: false }] }).done, false);
  assert.equal(questStepStatus("habit-building", runs, { publications: [{ ...publications[0], chapter: { id: "custom-habit", version: 2 } }] }).done, false, "a newer definition cannot establish the older setup's App");
});

test("repeated actual chapter completions retain the latest completed run for history", () => {
  const runs = { "week-review@1:old": { status: "completed", completedAt: "2020-01-01T01:00:00Z" }, "week-review@2:new": { status: "completed", completedAt: "2020-02-01T01:00:00Z" }, "week-review@3": { status: "in-progress" } };
  assert.deepEqual(questStepStatus("week-review", runs), { done: true, alreadySetUp: false, runId: "week-review@2:new" });
});

// Sai: "they are just chapters, like any other chapters."
test("every step of every Quest is a chapter that actually exists", () => {
  for (const quest of QUESTS) {
    assert.ok(quest.steps.length > 0, `${quest.id} has no steps`);
    for (const step of quest.steps) {
      assert.ok(
        getChapter(step.chapterId),
        `${quest.id} names a chapter that is not published: ${step.chapterId}`,
      );
      assert.ok(step.minutes > 0, `${step.chapterId} costs no time`);
    }
  }

  // Grouped by topic, the way Sai described them: "we may have it in sessions
  // under 'topic' such as happiness personal growth".
  assert.deepEqual(questTopics(QUESTS), ["Foundation", "Direction", "Personal growth"]);
  assert.equal(findQuest(QUESTS, "getting-started")?.title, "Getting started");
  assert.equal(findQuest(QUESTS, "nothing-like-this"), null);
});

test("progress is read from the chapters already answered", () => {
  const quest = findQuest(QUESTS, "the-life-you-want");

  // Nothing answered: not started, and the first step is where to pick it up.
  const fresh = questProgress(quest, {}, getChapter);
  assert.equal(fresh.done, 0);
  assert.equal(fresh.total, 4);
  assert.equal(fresh.started, false);
  assert.equal(fresh.complete, false);
  assert.equal(fresh.next.chapterId, "declare-vision");
  assert.ok(fresh.minutes > 0);

  // A chapter answered before its Quest existed is already counted. There is no
  // second record of what has been done, so nothing can disagree with itself.
  const part = questProgress(
    quest,
    Object.fromEntries([completed("declare-vision")]),
    getChapter,
  );
  assert.equal(part.done, 1);
  assert.equal(part.started, true);
  assert.equal(part.steps[0].done, true);
  assert.equal(part.next.chapterId, "declare-typical-tuesday");

  // Any version of it, answered once — the same rule the setup gates use.
  const otherVersion = questProgress(
    quest,
    Object.fromEntries([completed("declare-vision", 7)]),
    getChapter,
  );
  assert.equal(otherVersion.done, 1);

  // And finished is finished: nothing left to pick up.
  const all = questProgress(
    quest,
    Object.fromEntries(quest.steps.map((step) => completed(step.chapterId))),
    getChapter,
  );
  assert.equal(all.complete, true);
  assert.equal(all.next, null);
});

test("a Quest naming a chapter that is gone is shorter, not broken", () => {
  const quest = {
    id: "test",
    topic: "Test",
    title: "Test",
    blurb: "",
    steps: [
      { chapterId: "declare-vision", minutes: 4 },
      { chapterId: "a-chapter-that-was-deleted", minutes: 3 },
    ],
  };
  const view = questProgress(quest, {}, getChapter);
  assert.equal(view.total, 1);
  assert.equal(view.steps[0].chapterId, "declare-vision");
});

test("the catalogue reads every Quest at once", () => {
  const runs = Object.fromEntries([completed("day-one", 2)]);
  const all = questCatalogue(QUESTS, runs, getChapter);
  assert.equal(all.length, QUESTS.length);

  // Several run at once. Sai: "several." Nothing here is exclusive, so
  // starting one does not touch another.
  const started = all.filter((quest) => quest.started);
  assert.equal(started.length, 1);
  assert.equal(started[0].id, "getting-started");
  assert.ok(all.every((quest) => typeof quest.done === "number"));
});

// Sai: "Add the quest catalog session under athena reading ... it look as a app
// box, but with indicator, we may browse them by swiping, and click on view
// button to extend the box and show the steps."
test("Reflect offers Chapter history without playable Quests", () => {
  const page = readFileSync("app/os/mirror/page.tsx", "utf8");
  assert.match(page, /<ChapterHistoryPage/);
  assert.doesNotMatch(page, /startQuestStep|quest-catalogue-apps/);
});
