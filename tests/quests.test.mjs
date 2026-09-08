import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  findQuest,
  questCatalogue,
  questProgress,
  questTopics,
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
test("the catalogue is an App Box under Athena's Reading", () => {
  const page = readFileSync("app/os/mirror/page.tsx", "utf8");

  // A real session with a window, not a list of cards.
  assert.match(page, /className="quest-catalogue-apps"/);
  assert.match(page, /<SwipeSession[\s\S]*?attentionKey=\{`quests:\$\{questCatalogueVersion\}`\}/);
  // The position is in the header, the way a chapter shows its own.
  assert.match(page, /className="quest-place"/);
  // And the place he was left in is kept, like every other App's.
  assert.match(page, /appSessionIndex\(\s*state,\s*"quest-catalogue"/);

  // The View key opens the steps inside the same box; nothing navigates away.
  // And it is a key, not a pill: boxy, standing on a leg like every other one.
  // Sai: "view steps button should be the boxy button with leg which
  // compliment the theme."
  assert.match(page, /<CreativeButton\s+aria-expanded=\{open\}\s+className="quest-view"/);
  assert.match(page, /\{open \? "Hide steps" : "View steps"\}/);
  assert.match(page, /className="quest-steps"/);
  const css2 = readFileSync("app/os/os-app.css", "utf8");
  assert.match(css2, /\.circle-os \.quest-view \{\s+--os-key-leg: var\(--os-key-leg-ink\);/);

  // A step is a thing you start, and starting it is the splash — the same
  // sheet every other chapter arrives in. Sai: "on click, the steps be shown
  // and clickable to start ... all those chapters will be process on splash
  // screen."
  assert.match(page, /className="quest-step"/);
  // A block, not a line: a row of text does not look like a thing you go and
  // do. Sai: "Steps in quests should be in boxes of blocks rather then lines."
  assert.match(page, /className="quest-step-meta"/);
  assert.match(css2, /\.circle-os \.quest-step \{[\s\S]*?border: 1px solid[\s\S]*?border-radius: var\(--r-lg\)/);
  assert.match(page, /onClick=\{\(\) => startQuestStep\(step\.chapterId\)\}/);
  assert.match(page, /function startQuestStep\(chapterId: string\)/);
  assert.match(page, /writePinnedChapter\(chapterId\)/);

  // Under Athena's Reading, because a Quest is what you go and do about what
  // she just told you.
  const readingAt = page.indexOf('aria-label="Athena\'s Reading"');
  const questsAt = page.indexOf('className="quest-catalogue-session"');
  assert.ok(readingAt > 0 && questsAt > readingAt, "the catalogue is above the reading");

  const css = readFileSync("app/os/os-app.css", "utf8");
  assert.match(css, /\.circle-os \.quest-catalogue-apps \.os-app-window/);
});
