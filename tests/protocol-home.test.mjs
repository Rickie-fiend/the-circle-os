import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  activeProtocolRun,
  addProtocolItem,
  archiveProtocolRun,
  beginProtocolRun,
  canBeginProtocolRun,
  createEmptyState,
  PROTOCOL_DEFAULT_NAME,
  endProtocolRun,
  mergeServerState,
  protocolPhaseRecords,
  sealProtocolDay,
  renameProtocolRun,
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

test("removing a finished phase archives it through reload and server merge", () => {
  const server = endProtocolRun(phaseWithOneTerm("noise", 7), "noise");
  const phone = archiveProtocolRun(server, "noise");

  assert.ok(phone.protocol.runs.noise.archivedAt);
  assert.equal(protocolPhaseRecords(phone).length, 0);

  const reloaded = structuredClone(phone);
  assert.equal(protocolPhaseRecords(reloaded).length, 0);

  const synced = mergeServerState(phone, server);
  assert.ok(synced.protocol.runs.noise.archivedAt);
  assert.equal(
    protocolPhaseRecords(synced).length,
    0,
    "the older server run cannot return to Phases",
  );
});

test("only finished or ended phases can be archived", () => {
  const running = phaseWithOneTerm("running", 7);
  assert.equal(archiveProtocolRun(running, "running"), running);

  const draft = startProtocolDraft(createEmptyState(), "draft").state;
  assert.equal(archiveProtocolRun(draft, "draft"), draft);
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

test("the running phase keeps one Footer action and ending lives in its editor", () => {
  const source = readFileSync("app/os/protocol-page.tsx", "utf8");
  const editorStart = source.indexOf("if (editing)");
  const runningStart = source.lastIndexOf("  return (", source.indexOf("/** The block"));
  const running = source.slice(runningStart, source.indexOf("/** The block"));
  const editor = source.slice(editorStart, runningStart);

  // Ending a protocol moved to the editor's top right, beside the App Label,
  // and the day count moved down to the Footer where the day is finished.
  assert.match(editor, /onClick=\{endRun\}/);
  assert.match(editor, /Tap again/);
  assert.match(editor, /headerRight=\{[\s\S]*?os-protocol-editor-end/);
  assert.match(editor, /footer=\{[\s\S]*?Day \{day\} of \{run\.days\}/);
  assert.doesNotMatch(running, /End this protocol/);
  // The running Footer carries the day count and, when the day is kept, the one
  // action that finishes it. Editing is no longer a Footer link.
  assert.match(running, /footer=\{[\s\S]*Day \{day\} of \{run\.days\}[\s\S]*Completed today/);
  assert.doesNotMatch(running, /os-protocol-edit-link/);
  assert.match(source, /if \(isOver\)[\s\S]*onClick=\{onEndRun\}[\s\S]*Close this protocol/);
});

// A pre-filled name reads as a decision already made, so nobody discovers they
// can change it. Sai: "the protocol name should be a placeholder. If user leave
// it blank then it will be use as default and title of the protocol. Currently
// it always filled so that new user might not know that they can edit."
test("a phase is unnamed until it starts, then takes the default", () => {
  let state = startProtocolDraft(createEmptyState(), "phase").state;
  const draft = state.protocol.runs.phase;
  assert.equal(draft.name, "", "the draft arrives already named");

  // The field shows what it would be called rather than filling it in.
  const page = readFileSync("app/os/protocol-page.tsx", "utf8");
  assert.match(page, /placeholder="Monk Mode"/);

  // A term is what gates starting, never a name.
  const added = addProtocolItem(state, "phase", "non-negotiable", "term");
  state = updateProtocolItem(added.state, "phase", added.id, "Workout 15 min");
  assert.equal(canBeginProtocolRun(state.protocol.runs.phase), true);

  // Whatever it is called at the moment it begins is what it is called for
  // good, so a record is never blank.
  state = beginProtocolRun(state, "phase", "2026-08-31");
  assert.equal(state.protocol.runs.phase.name, PROTOCOL_DEFAULT_NAME);

  // And a name he did type is kept exactly as he typed it.
  let named = startProtocolDraft(createEmptyState(), "own").state;
  named = renameProtocolRun(named, "own", "Deep Work");
  const ownTerm = addProtocolItem(named, "own", "non-negotiable", "t2");
  named = updateProtocolItem(ownTerm.state, "own", ownTerm.id, "Read");
  named = beginProtocolRun(named, "own", "2026-08-31");
  assert.equal(named.protocol.runs.own.name, "Deep Work");
});

// The App Label already says Phases. A Page that says its own name twice is
// saying it once too often, which is what the screenshot showed.
test("the Phases Page does not name itself twice", () => {
  const page = readFileSync("app/os/protocol-page.tsx", "utf8");
  assert.doesNotMatch(page, /os-protocol-home-heading">Phases/);
});
