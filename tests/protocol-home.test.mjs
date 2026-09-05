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
  discardProtocolDraft,
  setProtocolGoal,
  PROTOCOL_DEFAULT_NAME,
  endProtocolRun,
  mergeServerState,
  protocolPhaseRecords,
  protocolStanding,
  sealProtocolDay,
  renameProtocolRun,
  setProtocolDays,
  startProtocolDraft,
  toggleProtocolItem,
  updateProtocolItem,
} from "../app/os/circle-os-model.js";
import { goalById, setWeekGoal, weekGoal } from "../app/os/goal-model.js";

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

// With nothing running the Page was a Label, a folded record and a button, and
// said nothing about the phases behind it. Sai: "Can we add more to this
// protocol screen?" This is not a reading back — it is the standing fact of
// what he has kept, so the next phase starts in front of the last ones.
test("the Page shows what has been kept, across every phase", () => {
  assert.equal(protocolStanding([]), null, "a first phase has nothing to stand on");
  assert.equal(protocolStanding(undefined), null);

  const standing = protocolStanding([
    { name: "Monk Mode", days: 7, keptDays: 6, endedEarly: false },
    { name: "Deep Work", days: 21, keptDays: 14, endedEarly: false },
    { name: "Reset", days: 3, keptDays: 1, endedEarly: true },
  ]);
  assert.equal(standing.phases, 3);
  assert.equal(standing.finished, 2, "a phase ended early is not a finished one");
  // A phase ended early still counts every day it was kept: those days happened.
  assert.equal(standing.daysKept, 21);
  assert.equal(standing.longestDays, 14);
  assert.equal(standing.longestName, "Deep Work");

  const page = readFileSync("app/os/protocol-page.tsx", "utf8");
  assert.match(page, /os-protocol-standing/);
  assert.match(page, /protocolStanding\(phaseRecords\)/);
});

// Sai: "after i click ok start the phase and dont want to, i cant go back by top
// left button so that i have to type random to start the phase and end again,
// thats where 9 protocols come from."
test("a phase drafted and thought better of leaves no record", () => {
  let state = createEmptyState();
  const started = startProtocolDraft(state);
  state = started.state;
  assert.equal(activeProtocolRun(state)?.status, "draft");

  state = discardProtocolDraft(state, started.id);
  assert.equal(activeProtocolRun(state), null);
  assert.deepEqual(Object.keys(state.protocol.runs), [], "nothing to read back");

  // A phase that actually ran is a record and is not deleted by the same door.
  const opened = startProtocolDraft(createEmptyState());
  const runId = opened.id;
  const item = addProtocolItem(opened.state, runId, "non-negotiable");
  let ran = updateProtocolItem(item.state, runId, item.id, "No phone in bed");
  ran = beginProtocolRun(ran, runId, "2026-08-31");
  const kept = discardProtocolDraft(ran, runId);
  assert.equal(Object.keys(kept.protocol.runs).length, 1);
  assert.equal(kept.protocol.runs[runId].status, "active");
});

// The way out is the top left, where every App Box is left.
test("the draft Page's mode label is the way back", () => {
  const page = readFileSync("app/os/protocol-page.tsx", "utf8");
  const draft = page.slice(
    page.indexOf('className="os-protocol os-protocol-draft"'),
    page.indexOf("os-protocol-days"),
  );
  assert.match(draft, /onClick=\{onDiscardDraft\}/);
  assert.match(draft, /className="os-card-label os-protocol-mode-toggle"/);
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /discardProtocolDraft\(current, protocolRun\.id\)/);
});

// A phase kept in a vacuum counts days and measures nothing.
test("a phase says what its terms are for", () => {
  let state = createEmptyState();
  const started = startProtocolDraft(state);
  const runId = started.id;
  assert.equal(started.state.protocol.runs[runId].goalId, null, "unattached at first");

  const item = addProtocolItem(started.state, runId, "non-negotiable");
  state = updateProtocolItem(item.state, runId, item.id, "No phone in bed");
  state = setWeekGoal(state, "2026-08-31", "Ship v1");
  const goalId = weekGoal(state, "2026-08-31").id;

  state = setProtocolGoal(beginProtocolRun(state, runId, "2026-08-31"), runId, goalId);
  assert.equal(state.protocol.runs[runId].goalId, goalId);
  // Held by id, not copied: renaming the goal in the Week App changes what the
  // phase says it is for, without a second write.
  state = setWeekGoal(state, "2026-08-31", "Ship v1 properly");
  assert.equal(goalById(state, state.protocol.runs[runId].goalId).text, "Ship v1 properly");

  // A phase that has ended is closed to it, the way its terms are.
  const ended = endProtocolRun(state, runId);
  assert.equal(setProtocolGoal(ended, runId, "").protocol.runs[runId].goalId, goalId);
});

// The Page says it where the phase is named, not as a tally in a corner.
test("the running phase names its direction under its own name", () => {
  const page = readFileSync("app/os/protocol-page.tsx", "utf8");
  assert.match(page, /goalText \? <p className="os-protocol-toward">Toward \{goalText\}/);
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /goalText=\{protocolGoalText\}/);
  // Begun and told what it is for in one act.
  assert.match(
    shell,
    /setProtocolGoal\(\s*beginProtocolRun\(current, protocolRun\.id, dateKey\),/,
  );
});
