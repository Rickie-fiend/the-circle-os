import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptyState,
  createSampleState,
  getDayPeriod,
  summarizeWeek,
  upsertTimeBlock,
} from "../app/os/circle-os-model.js";

test("maps hours into the four lightweight check-in periods", () => {
  assert.equal(getDayPeriod(7), "morning");
  assert.equal(getDayPeriod(12), "midday");
  assert.equal(getDayPeriod(17), "afternoon");
  assert.equal(getDayPeriod(22), "evening");
});

test("keeps time-log correction deterministic", () => {
  const day = {
    date: "2026-07-28",
    checkIns: [],
    mission: null,
    timeBlocks: [],
  };

  const withLog = upsertTimeBlock(day, {
    id: "block-1",
    start: "09:00",
    end: "10:00",
    activity: "Focus",
    note: "",
    createdAt: "2026-07-28T09:00:00.000Z",
  });
  const corrected = upsertTimeBlock(withLog, {
    ...withLog.timeBlocks[0],
    activity: "Reading",
  });

  assert.equal(corrected.timeBlocks.length, 1);
  assert.equal(corrected.timeBlocks[0].activity, "Reading");
});

test("empty Mirror reports uncertainty instead of an invented conclusion", () => {
  const summary = summarizeWeek(
    createEmptyState(),
    new Date("2026-07-28T12:00:00.000Z"),
  );

  assert.equal(summary.coverage.recorded, 0);
  assert.equal(summary.sentence, "There is not enough evidence to say.");
  assert.equal(summary.totalMinutes, 0);
});

test("sample Mirror includes the essential weekly evidence", () => {
  const summary = summarizeWeek(
    createSampleState(new Date("2026-07-28T12:00:00.000Z")),
    new Date("2026-07-28T12:00:00.000Z"),
  );

  assert.ok(summary.coverage.recorded >= 12);
  assert.ok(summary.totalMinutes > 0);
  assert.ok(summary.energy.length > 0);
  assert.ok(summary.moods.length > 0);
  assert.ok(summary.missions.completed > 0);
  assert.match(summary.sentence, /evidence|time|week/i);
});
