import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildYesterdayReview,
  createEmptyState,
} from "../app/os/circle-os-model.js";

const mirror = readFileSync(
  new URL("../app/os/mirror/page.tsx", import.meta.url),
  "utf8",
);

const css = readFileSync(
  new URL("../app/os/os-app.css", import.meta.url),
  "utf8",
);

function stateWithDay(dateKey, timeBlocks) {
  const state = createEmptyState();
  state.days[dateKey] = {
    ...(state.days[dateKey] || {}),
    dateKey,
    checkIns: [],
    missions: [],
    timeBlocks,
  };
  return state;
}

test("Yesterday reads the day just gone, not today", () => {
  const state = stateWithDay("2026-08-18", [
    { start: "14:00", end: "16:00", title: "Work on project" },
  ]);
  const review = buildYesterdayReview(state, new Date("2026-08-19T09:00:00"));
  assert.equal(review.dateKey, "2026-08-18");
  assert.equal(review.dateLabel, "Tuesday");
  assert.equal(review.recorded, true);
});

test("the day is told in order, and a repeated stretch is said once", () => {
  const state = stateWithDay("2026-08-18", [
    { start: "07:00", end: "08:00", title: "Wake up" },
    { start: "14:00", end: "16:00", title: "Walk" },
    { start: "19:00", end: "21:00", title: "Walk" },
  ]);
  const { did } = buildYesterdayReview(
    state,
    new Date("2026-08-19T09:00:00"),
  );
  // One clause for the two walking stretches, not two identical ones.
  assert.match(did.sentence, /walking in the afternoon and evening/);
  assert.equal(did.sentence.match(/walking/g).length, 1);
  // "at night", never "in the night".
  assert.doesNotMatch(did.sentence, /in the night/);
});

test("a day with no hours logged says so rather than inventing a shape", () => {
  const review = buildYesterdayReview(
    createEmptyState(),
    new Date("2026-08-19T09:00:00"),
  );
  assert.equal(review.recorded, false);
  assert.match(review.did.sentence, /did not log any hours/);
  assert.match(review.achieved.sentence, /Nothing was recorded/);
});

test("a long task is named, not quoted whole", () => {
  const state = stateWithDay("2026-08-18", [
    { start: "14:00", end: "16:00", title: "Work on project" },
  ]);
  const id = "task-long";
  state.tasks.items[id] = {
    id,
    text: "Pause all rotation if i am using any of the app. It causes to move around what i am doing and it is very annoying to read",
    status: "completed",
    completedAt: "2026-08-18T15:00:00.000Z",
  };
  const { achieved } = buildYesterdayReview(
    state,
    new Date("2026-08-19T09:00:00"),
  );
  assert.ok(achieved.sentence.length < 160, achieved.sentence);
  assert.match(achieved.sentence, /…/);
  // A trimmed label ends in an ellipsis and does not also take a full stop.
  assert.doesNotMatch(achieved.sentence, /…\./);
  // The evidence rows are trimmed too, or one row alone outgrows the App Box.
  for (const item of achieved.evidence) {
    assert.ok(item.value.length <= 41, `evidence row too long: ${item.value}`);
  }
});

test("what he achieved names two things at most, and three rows at most", () => {
  const state = stateWithDay("2026-08-18", [
    { start: "14:00", end: "16:00", title: "Work on project" },
  ]);
  for (let index = 0; index < 6; index += 1) {
    const id = `task-${index}`;
    state.tasks.items[id] = {
      id,
      text: `Finish thing number ${index}`,
      status: "completed",
      completedAt: "2026-08-18T15:00:00.000Z",
    };
  }
  const { achieved } = buildYesterdayReview(
    state,
    new Date("2026-08-19T09:00:00"),
  );
  assert.equal(achieved.evidence.length <= 3, true);
  assert.equal(achieved.sentence.match(/Finish thing/g).length, 2);
});

// The day just gone still does not take an App Box of its own. It is one key on
// the week strip, which now lives at the back of the Log.
test("a day is read from the week strip inside the Log", () => {
  assert.doesNotMatch(mirror, /aria-label="Yesterday session"/);
  assert.doesNotMatch(mirror, /mirror-yesterday-intro/);

  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  // Two Pages: the day, then the week. Sai: "week app should be the second page
  // of the log."
  assert.match(shell, /const logAppMaxIndex = 1;/);
  assert.match(shell, /className="os-log-page os-log-week"/);
  // The days either side are set aside, not deleted — he is coming back to it,
  // so `weekSpan` stays in the model with its tests.
  assert.doesNotMatch(shell, /os-log-span|logSpanView|logSpanHeading/);
  assert.doesNotMatch(shell, /logBack|toggleLogSide|os-log-mode-toggle/);

  // Seven keys, and the one being read is the Page under them.
  assert.match(shell, /className="os-week-strip"/);
  assert.match(shell, /aria-pressed=\{day\.dateKey === logChosenDayKey\}/);
  assert.match(shell, /setLogChosenDayKey\(day\.dateKey\)/);

  // A future day IS reachable here: this Page is for planning the week, so
  // Thursday has to be selectable before Thursday.
  const weekPage = shell.match(/os-log-page os-log-week[\s\S]*?<\/PageLayout>/)?.[0] ?? "";
  assert.ok(weekPage, "the week Page moved");
  assert.doesNotMatch(weekPage, /disabled=\{day\.isFuture\}/);

  // The saved position forgets the old one-Page Log.
  assert.match(shell, /logAppVersion = "log-week-v3"/);
});

test("a Page arrives whole, with no part of it revealed on a delay", () => {
  // The body used to arrive at 260ms, the header at 620ms and the footer at
  // 1180ms. Nothing inside an arriving Page animates on its own now.
  assert.doesNotMatch(css, /update-arrival[^{]*\.os-page-(header|footer|body)/);
  assert.doesNotMatch(css, /os-update-copy-arrival/);
  assert.match(css, /--os-arrival-ms:\s*\d+ms/);
  const arrivals = css.match(/animation:\s*os-(update|idle)[^;]+;/g) || [];
  for (const rule of arrivals) {
    assert.match(rule, /--os-arrival-ms/, `still hard-codes a duration: ${rule}`);
  }
});
