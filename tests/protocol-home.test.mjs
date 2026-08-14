import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  activeProtocolRun,
  addProtocolItem,
  beginProtocolRun,
  createEmptyState,
  endProtocolRun,
  protocolPhaseRecords,
  sealProtocolDay,
  setProtocolDays,
  startProtocolDraft,
  toggleProtocolItem,
  updateProtocolItem,
} from "../app/os/circle-os-model.js";

function phaseWithOneTerm(id, days = 3) {
  let state = startProtocolDraft(createEmptyState(), id).state;
  state = setProtocolDays(state, id, days);
  const item = addProtocolItem(state, id, "non-negotiable", `${id}-write`);
  state = updateProtocolItem(item.state, id, item.id, "Write one line");
  return beginProtocolRun(state, id, "2026-08-12");
}

test("a completed phase is read from its real completion records", () => {
  let state = phaseWithOneTerm("complete", 3);
  state = toggleProtocolItem(state, "complete-write", "2026-08-12");
  state = sealProtocolDay(state, "2026-08-12");
  state = toggleProtocolItem(state, "complete-write", "2026-08-14");
  state = sealProtocolDay(state, "2026-08-14");

  assert.equal(activeProtocolRun(state), null);
  const [record] = protocolPhaseRecords(state);
  assert.deepEqual(
    {
      id: record.id,
      status: record.status,
      days: record.days,
      keptDays: record.keptDays,
      start: record.startDateKey,
      end: record.endDateKey,
      terms: record.terms.map((term) => [term.text, term.keptDays]),
    },
    {
      id: "complete",
      status: "completed",
      days: 3,
      keptDays: 2,
      start: "2026-08-12",
      end: "2026-08-14",
      terms: [["Write one line", 2]],
    },
  );
});

test("a phase ended early remains an honest record", () => {
  let state = phaseWithOneTerm("early", 7);
  state = toggleProtocolItem(state, "early-write", "2026-08-12");
  state = endProtocolRun(state, "early");

  const [record] = protocolPhaseRecords(state);
  assert.equal(record.id, "early");
  assert.equal(record.endedEarly, true);
  assert.equal(record.status, "ended");
  assert.equal(record.days, 7);
  assert.equal(record.keptDays, 1);
  assert.equal(record.terms[0].keptDays, 1);
  assert.equal(activeProtocolRun(state), null);
});

test("starting from home reuses the existing draft", () => {
  const first = startProtocolDraft(createEmptyState(), "draft-one");
  const second = startProtocolDraft(first.state, "draft-two");
  assert.equal(second.id, "draft-one");
  assert.equal(Object.keys(second.state.protocol.runs).length, 1);
  assert.equal(activeProtocolRun(second.state).status, "draft");
});

test("Protocol home is the front at rest and one flip from a running phase", () => {
  const source = readFileSync("app/os/protocol-page.tsx", "utf8");
  assert.match(source, /if \(!protocol\) \{[\s\S]*?<ProtocolHome/);
  assert.match(source, /run\.status === "active" && protocolBack\.side === "home"/);
  assert.match(source, /protocolBack\.flip\("home"/);
  assert.match(source, /protocolBack\.flip\("phase"/);
  assert.match(source, /Start a phase/);
  assert.match(source, /Ended early/);
  assert.match(source, /\{record\.keptDays\} of \{record\.days\} days kept/);
  assert.doesNotMatch(source, /streak|percentage|score|grade/i);
});
