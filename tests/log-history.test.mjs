import assert from "node:assert/strict";
import test from "node:test";
import { correctLogEntry, logBlockSignature, logHistoryDays, logHistoryWeekday } from "../app/os/log-history.js";
import { createDay, createEmptyState, ensureDay, getDateKey, mergeServerState, normalizeState, summarizeWeek, weekActivityTally } from "../app/os/circle-os-model.js";

const block = (id, start, extra = {}) => ({ id, start, end: "09:00", activity: "Walk", ...extra });

test("all saved past Log days are reachable, without empty, invalid or future days", () => {
  const state = { days: {
    "2020-01-01": { ...createDay("2020-01-01"), timeBlocks: [block("old", "08:00")] },
    "2026-11-03": { ...createDay("2026-11-03"), title: "Market day" },
    "2026-11-04": createDay("2026-11-04"),
    "2026-11-05": { timeBlocks: [block("today", "08:00")] },
    "2026-11-06": { title: "Future plan" },
    "2026-02-30": { title: "Invalid" },
    "not-a-date": { title: "Invalid" },
  } };
  const before = structuredClone(state);
  assert.deepEqual(logHistoryDays(state, "2026-11-05").map(day => day.dateKey), ["2026-11-03", "2020-01-01"]);
  assert.deepEqual(state, before);
});

test("Circle order, non-hour blocks, moments-only records and legacy notes retain their content", () => {
  const day = { timeBlocks: [
    block("early", "05:30", { note: "Legacy moment" }),
    block("midnight", "00:15", { activity: "", moments: ["A small moment"] }),
    block("morning", "06:00", { title: "Saved title", moments: ["Saved moment"], note: "Old fallback" }),
    block("blank", "09:00", { activity: "", moments: [" "] }),
  ] };
  const before = structuredClone(day);
  const result = logHistoryDays({ days: { "2026-11-04": day } }, "2026-11-05")[0];
  assert.deepEqual(result.blocks.map(item => item.id), ["morning", "midnight", "early"]);
  assert.deepEqual(result.blocks[0].moments, ["Saved moment"]);
  assert.deepEqual(result.blocks[2].moments, ["Legacy moment"]);
  assert.deepEqual(day, before);
  result.blocks[0].moments.push("Read model mutation");
  assert.deepEqual(day, before);
});

test("saved day assignment survives travel and the 06:00 boundary", () => {
  const beforeSix = getDateKey(new Date(2026, 10, 5, 5, 59));
  const afterSix = getDateKey(new Date(2026, 10, 5, 6, 0));
  const state = { days: { [beforeSix]: { title: "Assigned day" } } };
  assert.equal(logHistoryDays(state, beforeSix).length, 0);
  assert.equal(logHistoryDays(state, afterSix)[0].dateKey, "2026-11-04");
  assert.equal(logHistoryWeekday("2026-11-04"), "Wednesday");
  assert.deepEqual(logHistoryDays({}, afterSix), []);
});

function correctionFixture() {
  const state = ensureDay(ensureDay(createEmptyState(), "2026-11-04"), "2026-11-05");
  state.days["2026-11-04"].timeBlocks = [block("past", "05:30", { end: "06:00", note: "Old note", createdAt: "2026-11-05T00:00:00.000Z", timezone: "Asia/Bangkok" })];
  const request = { id: "correction-1", dateKey: "2026-11-04", blockId: "past", expected: logBlockSignature(state.days["2026-11-04"].timeBlocks[0]), title: "New walk", moments: ["New note"], at: "2026-11-05T01:00:00.000Z" };
  return { state, request };
}

test("corrections preserve dates, original time/metadata and immutable before/after words", () => {
  const { state, request } = correctionFixture(), before = structuredClone(state);
  const result = correctLogEntry(state, request, "2026-11-05");
  assert.equal(result.error, ""); assert.equal(result.changed, true);
  const day = result.state.days[request.dateKey], changed = day.timeBlocks[0], receipt = day.logCorrections[request.id];
  assert.equal(changed.start, "05:30"); assert.equal(changed.end, "06:00"); assert.equal(changed.createdAt, "2026-11-05T00:00:00.000Z"); assert.equal(changed.timezone, "Asia/Bangkok");
  assert.equal(changed.updatedAt, request.at); assert.equal(receipt.correctedAt, request.at);
  assert.deepEqual(receipt.before, before.days[request.dateKey].timeBlocks[0]); assert.deepEqual(receipt.after, changed);
  assert.deepEqual(result.state.days["2026-11-05"], before.days["2026-11-05"]);
  assert.equal(result.state.outbox.length, 1); assert.equal(result.state.evidence.localRevision, 1); assert.deepEqual(state, before);
  changed.moments.push("Later array mutation"); assert.deepEqual(receipt.after.moments, ["New note"]);
});

test("a clearing correction survives normalization and a stale merge in either direction", () => {
  const { state, request } = correctionFixture();
  const cleared = correctLogEntry(state, { ...request, title: "", moments: [] }, "2026-11-05").state;
  for (const merged of [normalizeState(cleared), mergeServerState(cleared, state), mergeServerState(state, cleared)]) {
    const day = merged.days[request.dateKey];
    assert.equal(day.timeBlocks.length, 0);
    const empty = day.logCorrections[request.id].after;
    assert.equal(empty.id, "past"); assert.equal(empty.activity, ""); assert.equal(empty.note, ""); assert.deepEqual(empty.moments, []);
    assert.equal(empty.updatedAt, request.at); assert.equal(day.logCorrections[request.id].before.note, "Old note");
    assert.deepEqual(logHistoryDays(merged, "2026-11-05"), []);
    assert.deepEqual(weekActivityTally(merged), []);
    assert.equal(summarizeWeek(merged, new Date(2026, 10, 5, 12)).days.find(day => day.key === request.dateKey).minutes, 0);
  }
});

test("a clearing receipt suppresses an embedded stale block, but not a later real edit", () => {
  const { state, request } = correctionFixture();
  const cleared = correctLogEntry(state, { ...request, title: "", moments: [] }, "2026-11-05").state;
  const stale = structuredClone(cleared); stale.days[request.dateKey].timeBlocks = state.days[request.dateKey].timeBlocks;
  assert.equal(normalizeState(stale).days[request.dateKey].timeBlocks.length, 0);
  const later = structuredClone(state); later.days[request.dateKey].timeBlocks[0].updatedAt = "2026-11-05T02:00:00.000Z";
  assert.equal(mergeServerState(cleared, later).days[request.dateKey].timeBlocks.length, 1);
});

test("stale, missing, current and future targets never write", () => {
  const { state, request } = correctionFixture();
  for (const change of [{ expected: "outdated" }, { blockId: "missing" }, { dateKey: "2026-11-05" }, { dateKey: "2026-11-06" }, { dateKey: "2026-02-30" }, { id: "" }, { at: "invalid" }, { at: "2026-11-05T00:00:00.000Z" }]) {
    const result = correctLogEntry(state, { ...request, ...change }, "2026-11-05");
    assert.ok(result.error); assert.equal(result.state, state); assert.equal(result.changed, false);
  }
  const changed = structuredClone(state); changed.days[request.dateKey].timeBlocks[0].note = "Another edit";
  assert.ok(correctLogEntry(changed, request, "2026-11-05").error);
});

test("unchanged saves and repeated requests create no revisions or receipts", () => {
  const { state, request } = correctionFixture();
  assert.equal(correctLogEntry(state, { ...request, title: "Walk", moments: ["Old note"] }, "2026-11-05").state, state);
  const changed = correctLogEntry(state, request, "2026-11-05").state;
  assert.equal(correctLogEntry(changed, request, "2026-11-05").state, changed);
  assert.equal(Object.keys(changed.days[request.dateKey].logCorrections).length, 1);
});

test("independent correction receipts accumulate through merge and later corrections", () => {
  const { state, request } = correctionFixture();
  const first = correctLogEntry(state, request, "2026-11-05").state;
  const second = correctLogEntry(first, { ...request, id: "correction-2", expected: logBlockSignature(first.days[request.dateKey].timeBlocks[0]), title: "Later words", at: "2026-11-05T02:00:00.000Z" }, "2026-11-05").state;
  const remote = structuredClone(second); delete remote.days[request.dateKey].logCorrections[request.id];
  for (const merged of [mergeServerState(first, remote), mergeServerState(remote, first)]) {
    assert.equal(Object.keys(merged.days[request.dateKey].logCorrections).length, 2);
    assert.equal(merged.days[request.dateKey].timeBlocks[0].activity, "Later words");
    assert.deepEqual(merged.days[request.dateKey].logCorrections[request.id], first.days[request.dateKey].logCorrections[request.id]);
  }
});

test("unknown legacy recording times stay unknown", () => {
  const { state, request } = correctionFixture(); delete state.days[request.dateKey].timeBlocks[0].createdAt;
  const result = correctLogEntry(state, { ...request, expected: logBlockSignature(state.days[request.dateKey].timeBlocks[0]) }, "2026-11-05");
  assert.equal(result.error, ""); assert.equal(result.state.days[request.dateKey].timeBlocks[0].createdAt, undefined);
  assert.equal(result.state.days[request.dateKey].logCorrections[request.id].before.createdAt, undefined);
});

test("saving unchanged multiline legacy words retains their original representation", () => {
  const { state, request } = correctionFixture();
  state.days[request.dateKey].timeBlocks[0].note = "First line\nSecond line";
  const result = correctLogEntry(state, { ...request, expected: logBlockSignature(state.days[request.dateKey].timeBlocks[0]), title: "Walk", moments: ["First line", "Second line"] }, "2026-11-05");
  assert.equal(result.state, state);
});
