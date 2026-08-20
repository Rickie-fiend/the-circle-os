import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  commitDreamlineSteps,
  createEmptyState,
  dreamlineToday,
  saveDreamlineItem,
  setDreamlineStarred,
  setDreamlineStepDone,
  startDreamline,
  updateDreamlineStep,
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
  assert.match(log, /label="Log apps"/);
  assert.match(log, /index=\{logAppIndex\}/);
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
  const steps = pages.slice(
    pages.indexOf("export function DreamlineStepsPage"),
    pages.indexOf("export function DreamlineIdlePage") > 0
      ? pages.length
      : pages.length,
  );
  assert.match(steps, /STEP_SECTIONS\.map/);
  assert.match(pages, /step: "now"[\s\S]*?step: "tomorrow"[\s\S]*?step: "dayAfter"/);
  // The idle Page is the Dreamline at rest, with the due steps as blocks.
  assert.match(pages, /export function DreamlineIdlePage/);
  assert.match(pages, /os-protocol-block/);
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
  assert.match(pages, /items\.length[\s\S]*?DreamlineStepField/s);
});

test("legacy declaration Dreamlines remain implemented but leave the Vision deck", () => {
  const declarationPages = mirror.match(/const DECLARATION_PAGES:[\s\S]*?\n\];/)?.[0] || "";
  assert.doesNotMatch(declarationPages, /kind: "dreamline"/);
  assert.match(mirror, /dreamline: "declare-dreamline"/);
});

test("the steps sheet refuses to commit until a Now step exists", () => {
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

  state = updateDreamlineStep(state, id, saved.item.id, "now", "Choose the watch").state;
  const committed = commitDreamlineSteps(state, id);
  assert.equal(committed.error, "");
  state = committed.state;

  const today = dreamlineToday(state.dreamlines.records[id]);
  assert.equal(today.step, "now");
  assert.equal(today.text, "Choose the watch");
  assert.equal(today.done, false);
});

test("ticking today's step moves to the next one, then says everything is done", () => {
  let state = createEmptyState();
  const started = startDreamline(state, { months: 6 });
  state = started.state;
  const id = started.record.id;
  const saved = saveDreamlineItem(state, id, { category: "doing", text: "See friends" });
  const itemId = saved.item.id;
  state = setDreamlineStarred(saved.state, id, itemId, true).state;
  state = updateDreamlineStep(state, id, itemId, "now", "Send the invite").state;
  state = updateDreamlineStep(state, id, itemId, "tomorrow", "Book the table").state;
  state = commitDreamlineSteps(state, id).state;

  assert.equal(dreamlineToday(state.dreamlines.records[id]).text, "Send the invite");
  state = setDreamlineStepDone(state, id, itemId, "now", true).state;
  // Now is done, so Tomorrow is what the Page asks for.
  assert.equal(dreamlineToday(state.dreamlines.records[id]).text, "Book the table");
  state = setDreamlineStepDone(state, id, itemId, "tomorrow", true).state;
  assert.equal(dreamlineToday(state.dreamlines.records[id]).done, true);
});
