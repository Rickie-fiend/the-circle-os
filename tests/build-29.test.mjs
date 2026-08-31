import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  addDreamlineStep,
  commitDreamlineSteps,
  createEmptyState,
  dreamlineStrategy,
  dreamlineToday,
  saveDreamlineItem,
  setDreamlineReached,
  setDreamlineStarred,
  setDreamlineStepDone,
  startDreamline,
} from "../app/os/circle-os-model.js";

const shell = readFileSync(
  new URL("../app/os/circle-os-shell.tsx", import.meta.url),
  "utf8",
);
const pages = readFileSync(
  new URL("../app/os/dreamline-pages.tsx", import.meta.url),
  "utf8",
);
const mirror = readFileSync(
  new URL("../app/os/mirror/page.tsx", import.meta.url),
  "utf8",
);

test("Log keeps one outer SwipeSession and gives Dreamline its own saved journey", () => {
  const log = shell.slice(
    shell.indexOf('<section className="os-log-section"'),
    shell.indexOf("</main>"),
  );
  // The Log has a back now, so its label names the side being shown and its
  // index only applies to the front.
  assert.match(log, /label=\{logSide === "week" \? "Week" : "Log apps"\}/);
  assert.match(log, /index=\{logSide === "week" \? 0 : logAppIndex\}/);
  assert.match(log, /onIndexChange=\{saveLogAppIndex\}/);
  assert.match(
    shell,
    /setAppSessionIndex\(\s*current,\s*"today-log",\s*logAppVersion,\s*index,?\s*\)/,
  );
  assert.doesNotMatch(log, /rotateMs=/);
  assert.doesNotMatch(pages, /SwipeSession/);
});

test("the dream sheet is one Page: setup, Having, Being, Doing, income", () => {
  // Sai: "setup, having, being, doing, and income all should be in the same
  // page." A worksheet is a sheet, not five cards.
  assert.doesNotMatch(shell, /<DreamlineSetupPage/);
  assert.doesNotMatch(shell, /<DreamlineLinesPage/);
  assert.doesNotMatch(shell, /<DreamlineIncomePage/);
  assert.match(shell, /<DreamlineSheetPage/);
  const sheet = pages.slice(
    pages.indexOf("export function DreamlineSheetPage"),
    pages.indexOf("function DreamlineLineForm"),
  );
  const having = sheet.indexOf('category="having"');
  const being = sheet.indexOf('category="being"');
  const doing = sheet.indexOf('category="doing"');
  const income = sheet.indexOf('aria-label="Target income"');
  assert.ok(having > 0 && being > having && doing > being && income > doing);
  assert.match(sheet, /id="dreamline-setup"/);
});

test("the Dreamline rests on one Page and opens its sheets from Edit", () => {
  // Sai: "after continue, leads to idle app ... and we will have edit button
  // somewhere, and it will reveal The Dream and Steps if needed." The sheets
  // are not Pages he swipes past every day.
  // The steps sheet is gone. Sai: "the main page, we can edit directly, add
  // steps, tick complete. on edit page, we can add, goals, see the prices."
  // Writing a step on one Page and reading it on another was two places for
  // one thing, and the ladder is no longer three named slots to lay out.
  assert.doesNotMatch(pages, /DreamlineStepsPage|STEP_SECTIONS|DreamlineStepField/);
  assert.doesNotMatch(pages, /step: "now"|step: "tomorrow"|step: "dayAfter"/);
  // The editor's way out sits in the header, with Continue still at the foot.
  assert.match(pages, /headerRight=\{[\s\S]*?onClick=\{onDone\}[\s\S]*?Done/);
  // The idle Page is the Dreamline at rest, with the due steps as blocks.
  assert.match(pages, /export function DreamlineIdlePage/);
  // Its own form: a numbered track, not Routine's tick and not Protocol's block.
  assert.match(pages, /os-dreamline-track/);
  assert.doesNotMatch(pages, /os-protocol-block/);
  // Every step is visible and only one is live.
  assert.match(pages, /disabled=\{!pressable\}/);
  assert.match(pages, /is-\$\{item\.state\}/);
  // A step taken by accident can be given back.
  assert.match(shell, /function tickDreamlineStep\(itemId: string, step: DreamlineStep, done = true\)/);
  assert.match(shell, /<DreamlineIdlePage/);
  assert.match(shell, /setEditingDreamline\(true\)/);
  // The two Pages it replaced are gone rather than hidden.
  assert.doesNotMatch(pages, /DreamlineProgressPage|DreamlineTodayPage/);
  assert.doesNotMatch(shell, /DreamlineTodayPage/);
});

test("Being names its required Doing and stars are the gate to steps", () => {
  assert.match(pages, /A Being needs the Doing that would make it real\./);
  assert.match(pages, /Becomes Doing/);
  assert.match(pages, /aria-pressed=\{item\.starred\}/);
  // Steps are written where they are read, and the ladder goes on. Sai: "after
  // the last step, there has to be a quiet option to add on next step, and
  // continuously."
  assert.match(pages, /os-dreamline-next-step/);
  assert.match(pages, /Next step/);
  // Reaching the dream is its own statement, and it can be taken back.
  assert.match(pages, /Reached it/);
  assert.match(pages, /onReached\(line\.id, false\)/);
  assert.match(shell, /function addDreamlineStepToItem/);
  assert.match(shell, /function markDreamlineReached/);
});

test("legacy declaration Dreamlines remain implemented but leave the Vision deck", () => {
  const declarationPages = mirror.match(/const DECLARATION_PAGES:[\s\S]*?\n\];/)?.[0] || "";
  assert.doesNotMatch(declarationPages, /kind: "dreamline"/);
  assert.match(mirror, /dreamline: "declare-dreamline"/);
});

test("the steps sheet refuses to commit until a first step exists", () => {
  let state = createEmptyState();
  const started = startDreamline(state, { months: 6, monthlyExpensesCents: 200000 });
  state = started.state;
  const id = started.record.id;

  assert.match(
    commitDreamlineSteps(state, id).error,
    /Star at least one dream/,
    "an empty Dreamline cannot begin",
  );

  const saved = saveDreamlineItem(state, id, {
    category: "having",
    text: "A watch",
    costCents: 100000,
    cadence: "one-time",
  });
  state = setDreamlineStarred(saved.state, id, saved.item.id, true).state;
  assert.match(
    commitDreamlineSteps(state, id).error,
    /step you can take now/,
    "a starred dream with no Now step cannot begin either",
  );
  assert.equal(dreamlineToday(state.dreamlines.records[id]), null);

  const first = addDreamlineStep(state, id, saved.item.id, "Choose the watch");
  assert.equal(first.error, "");
  state = first.state;
  const committed = commitDreamlineSteps(state, id);
  assert.equal(committed.error, "");
  state = committed.state;

  const today = dreamlineToday(state.dreamlines.records[id]);
  assert.equal(today.step, first.stepId);
  assert.equal(today.text, "Choose the watch");
  assert.equal(today.done, false);
});

test("the ladder goes on, and reaching the dream stops it asking", () => {
  let state = createEmptyState();
  const started = startDreamline(state, { months: 6 });
  state = started.state;
  const id = started.record.id;
  const saved = saveDreamlineItem(state, id, { category: "having", text: "A watch" });
  const itemId = saved.item.id;
  state = setDreamlineStarred(saved.state, id, itemId, true).state;

  // A step with no words is not a step. Sai asked for a quiet way to add the
  // next one, not for blank rungs in the track.
  assert.match(addDreamlineStep(state, id, itemId, "   ").error, /Write the step/);

  const ids = [];
  for (const text of ["Find the showroom", "Try it on", "Set the money aside", "Buy it"]) {
    const added = addDreamlineStep(state, id, itemId, text);
    assert.equal(added.error, "");
    ids.push(added.stepId);
    state = added.state;
  }
  state = commitDreamlineSteps(state, id).state;

  const record = () => state.dreamlines.records[id];
  assert.equal(record().items[itemId].steps.length, 4, "a dream is not three steps long");

  // Take the first three. The one just taken stays undoable; the ones behind it
  // read as achieved. Sai: "after we sat the forth one, the previous done 3
  // days will be faded and achieved."
  for (const stepId of ids.slice(0, 3)) {
    state = setDreamlineStepDone(state, id, itemId, stepId, true).state;
  }
  const [line] = dreamlineStrategy(record());
  assert.deepEqual(
    line.steps.map((step) => step.state),
    ["achieved", "achieved", "undoable", "active"],
  );
  assert.equal(line.reached, false);
  assert.equal(dreamlineToday(record()).text, "Buy it");

  // Reaching the dream is its own fact, not the last tick.
  state = setDreamlineReached(state, id, itemId, true).state;
  const [reachedLine] = dreamlineStrategy(record());
  assert.equal(reachedLine.reached, true);
  assert.ok(
    reachedLine.steps.every((step) => step.state === "achieved"),
    "a reached dream stops offering steps",
  );
  assert.equal(dreamlineToday(record()), null, "a reached dream asks for nothing");
});

test("ticking today's step moves to the next one, then says everything is done", () => {
  let state = createEmptyState();
  const started = startDreamline(state, { months: 6 });
  state = started.state;
  const id = started.record.id;
  const saved = saveDreamlineItem(state, id, { category: "doing", text: "See friends" });
  const itemId = saved.item.id;
  state = setDreamlineStarred(saved.state, id, itemId, true).state;
  const first = addDreamlineStep(state, id, itemId, "Send the invite");
  state = first.state;
  const second = addDreamlineStep(state, id, itemId, "Book the table");
  state = second.state;
  state = commitDreamlineSteps(state, id).state;

  assert.equal(dreamlineToday(state.dreamlines.records[id]).text, "Send the invite");
  state = setDreamlineStepDone(state, id, itemId, first.stepId, true).state;
  // The first is done, so the second is what the Page asks for.
  assert.equal(dreamlineToday(state.dreamlines.records[id]).text, "Book the table");
  state = setDreamlineStepDone(state, id, itemId, second.stepId, true).state;
  assert.equal(dreamlineToday(state.dreamlines.records[id]).done, true);
});
