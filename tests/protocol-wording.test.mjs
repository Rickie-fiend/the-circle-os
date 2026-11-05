import assert from "node:assert/strict";
import test from "node:test";
import * as m from "../app/os/circle-os-model.js";

function phase() {
  let s = m.startProtocolDraft(m.createEmptyState(), "phase").state;
  s = m.setProtocolDays(s, "phase", 3);
  s = m.addProtocolItem(s, "phase", "non-negotiable", "walk").state;
  s = m.updateProtocolItem(s, "phase", "walk", "Walk 10 minutes");
  return m.beginProtocolRun(s, "phase", "2026-08-12");
}
const words = (s, day) => m.protocolToday(s, day).nonNegotiable.map((t) => t.text);

test("edits start next Circle day, keep today's ticks and seal, and survive reload/stale merge", () => {
  let s = phase();
  s = m.toggleProtocolItem(s, "walk", "2026-08-12");
  s = m.sealProtocolDay(s, "2026-08-12");
  const stale = structuredClone(s), evidence = structuredClone({ completions: s.protocol.completions, seals: s.protocol.seals });
  s = m.updateProtocolItem(s, "phase", "walk", "Walk 30 minutes", "2026-08-12");
  for (const copy of [s, m.normalizeState(JSON.parse(JSON.stringify(s))), m.mergeServerState(s, stale), m.mergeServerState(stale, s)]) {
    assert.deepEqual(words(copy, "2026-08-12"), ["Walk 10 minutes"]);
    assert.deepEqual(words(copy, "2026-08-13"), ["Walk 30 minutes"]);
    assert.equal(m.protocolToday(copy, "2026-08-12").sealed, true);
    assert.equal(m.protocolToday(copy, "2026-08-13").keptAll, false);
    assert.deepEqual({ completions: copy.protocol.completions, seals: copy.protocol.seals }, evidence);
    assert.equal(Object.keys(copy.protocol.termVersions).length, 2);
  }
  assert.equal(m.updateProtocolItem(s, "phase", "walk", "Walk 30 minutes", "2026-08-12"), s);
});

test("same-day repeated edits use the final next-day words and preserve earlier days", () => {
  let s = phase();
  s = m.updateProtocolItem(s, "phase", "walk", "Walk 20 minutes", "2026-08-12");
  s = m.updateProtocolItem(s, "phase", "walk", "Walk 30 minutes", "2026-08-12");
  s = m.updateProtocolItem(s, "phase", "walk", "Walk 40 minutes", "2026-08-13");
  assert.deepEqual(words(s, "2026-08-12"), ["Walk 10 minutes"]);
  assert.deepEqual(words(s, "2026-08-13"), ["Walk 30 minutes"]);
  assert.deepEqual(words(s, "2026-08-14"), ["Walk 40 minutes"]);
});

test("added and cleared terms change the next day's agreement only", () => {
  let s = phase();
  s = m.addProtocolItem(s, "phase", "non-negotiable", "read").state;
  s = m.updateProtocolItem(s, "phase", "read", "Read a page", "2026-08-12");
  s = m.updateProtocolItem(s, "phase", "walk", "", "2026-08-12");
  s = m.discardEmptyProtocolItem(s, "phase", "walk");
  assert.deepEqual(words(s, "2026-08-12"), ["Walk 10 minutes"]);
  assert.deepEqual(words(s, "2026-08-13"), ["Read a page"]);
  s = m.toggleProtocolItem(s, "walk", "2026-08-12");
  assert.equal(m.protocolToday(s, "2026-08-12").keptAll, true);
  assert.equal(m.toggleProtocolItem(s, "walk", "2026-08-13"), s);
  assert.deepEqual(m.protocolToday(s, "2026-08-12").editorNonNegotiable.map((t) => t.text), ["Read a page"]);
});

test("phase history separates wording intervals and evaluates required terms per day", () => {
  let s = phase();
  s = m.toggleProtocolItem(s, "walk", "2026-08-12");
  s = m.updateProtocolItem(s, "phase", "walk", "Walk 30 minutes", "2026-08-12");
  s = m.addProtocolItem(s, "phase", "non-negotiable", "read").state;
  s = m.updateProtocolItem(s, "phase", "read", "Read a page", "2026-08-13");
  s = m.toggleProtocolItem(s, "walk", "2026-08-13");
  s = m.endProtocolRun(s, "phase", "completed");
  const record = m.protocolPhaseRecords(s)[0];
  assert.equal(record.keptDays, 2);
  assert.deepEqual(record.terms.map((t) => [t.text, t.fromDateKey, t.toDateKey, t.keptDays, t.applicableDays]), [
    ["Walk 10 minutes", "2026-08-12", "2026-08-12", 1, 1],
    ["Walk 30 minutes", "2026-08-13", "2026-08-14", 1, 2],
    ["Read a page", "2026-08-14", "2026-08-14", 0, 1],
  ]);
});

test("legacy seals retain known words; missing original wording is never backfilled", () => {
  let s = phase();
  s = m.toggleProtocolItem(s, "walk", "2026-08-12");
  s = m.sealProtocolDay(s, "2026-08-12");
  s.protocol.termVersions = {};
  s.protocol.runs.phase.items.walk.text = "Legacy current words";
  s = m.updateProtocolItem(s, "phase", "walk", "Future words", "2026-08-13");
  assert.deepEqual(words(s, "2026-08-12"), ["Walk 10 minutes"]);
  assert.deepEqual(words(s, "2026-08-13"), ["Legacy current words"]);
  assert.deepEqual(words(s, "2026-08-14"), ["Future words"]);
  assert.equal(m.protocolTermsForDate(s, s.protocol.runs.phase, "2026-08-11")[0].wordingSource, "current");
});

test("a legacy baseline preserves today's sealed words instead of the edited item", () => {
  let s = phase();
  s = m.toggleProtocolItem(s, "walk", "2026-08-12");
  s = m.sealProtocolDay(s, "2026-08-12");
  s.protocol.termVersions = {};
  s.protocol.runs.phase.items.walk.text = "Previously edited words";
  const seal = structuredClone(s.protocol.seals);
  s = m.updateProtocolItem(s, "phase", "walk", "Tomorrow's words", "2026-08-12");
  assert.deepEqual(words(s, "2026-08-12"), ["Walk 10 minutes"]);
  assert.deepEqual(words(s, "2026-08-13"), ["Tomorrow's words"]);
  assert.deepEqual(s.protocol.seals, seal);
});

test("the next-day boundary follows the local 06:00 Circle day", () => {
  const previousTZ = process.env.TZ;
  process.env.TZ = "Asia/Bangkok";
  try {
    for (const [at, expected] of [["2026-08-13T05:59:00+07:00", "2026-08-13"], ["2026-08-13T06:00:00+07:00", "2026-08-14"]]) {
      const s = m.updateProtocolItem(phase(), "phase", "walk", "New words", m.getDateKey(new Date(at)));
      assert.equal(Object.values(s.protocol.termVersions).at(-1).effectiveDateKey, expected);
    }
  } finally { if (previousTZ === undefined) delete process.env.TZ; else process.env.TZ = previousTZ; }
});

test("early ending before 06:00 excludes the next Circle day's pending terms", () => {
  const previousTZ = process.env.TZ;
  process.env.TZ = "Asia/Bangkok";
  try {
    let s = m.updateProtocolItem(phase(), "phase", "walk", "Tomorrow's words", "2026-08-13");
    s = m.endProtocolRun(s, "phase");
    s.protocol.runs.phase.endedAt = "2026-08-14T05:59:00+07:00";
    const record = m.protocolPhaseRecords(s)[0];
    assert.equal(record.terms.length, 1);
    assert.equal(record.terms[0].toDateKey, "2026-08-13");
    assert.equal(record.terms[0].applicableDays, 2);
  } finally { if (previousTZ === undefined) delete process.env.TZ; else process.env.TZ = previousTZ; }
});

test("legacy seals do not hide unticked optional terms; closed phases reject term edits", () => {
  let s = phase();
  s = m.addProtocolItem(s, "phase", "negotiable", "read").state;
  s = m.updateProtocolItem(s, "phase", "read", "Read a page", "2026-08-12");
  s = m.toggleProtocolItem(s, "walk", "2026-08-13");
  s = m.sealProtocolDay(s, "2026-08-13");
  s.protocol.termVersions = {};
  assert.equal(m.protocolToday(s, "2026-08-13").negotiable[0].text, "Read a page");
  assert.equal(m.updateProtocolItem(s, "phase", "walk", "Wrong date", "bad-date"), s);
  s = m.endProtocolRun(s, "phase");
  assert.equal(m.updateProtocolItem(s, "phase", "walk", "Closed"), s);
  const archived = m.archiveProtocolRun(s, "phase");
  assert.equal(m.protocolPhaseRecords(archived).length, 0);
});
