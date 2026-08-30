import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createEmptyState } from "../app/os/circle-os-model.js";
import {
  FIRST_USE_APPS,
  FIRST_USE_PLACEHOLDERS,
  firstUsePlaceholder,
  hasUsedApp,
} from "../app/os/first-use.js";

function withAnswer(state, kind, answer) {
  const next = structuredClone(state);
  next.profile.profileCase.survey.answers.push({
    questionId: `q-${kind}`,
    question: "?",
    answer,
    kind,
  });
  return next;
}

test("a fresh install greets every App it can", () => {
  const empty = createEmptyState();
  for (const app of FIRST_USE_APPS) {
    assert.equal(hasUsedApp(empty, app), false, `${app} looks used already`);
    assert.equal(
      firstUsePlaceholder(empty, app),
      FIRST_USE_PLACEHOLDERS[app],
      `${app} has no first words`,
    );
  }
  // An App nobody named gets no invented greeting.
  assert.equal(firstUsePlaceholder(empty, "athena"), "");
});

// Nothing new is stored to know this. The evidence already in the App is the
// answer, so the first-time words cannot outlive the first use or come back on
// a device that has synced.
test("an App that has been used never greets again", () => {
  let state = createEmptyState();
  state = withAnswer(state, "thought", "Something small.");
  assert.equal(hasUsedApp(state, "thoughts"), true);
  assert.equal(firstUsePlaceholder(state, "thoughts"), "");
  // Note is a different App and has still not been written in.
  assert.equal(firstUsePlaceholder(state, "note"), FIRST_USE_PLACEHOLDERS.note);
});

// Thoughts and Deep Thoughts are two faces of one App. Someone who answered a
// deep question has plainly found it.
test("a deep answer counts as having used Thoughts", () => {
  const state = withAnswer(createEmptyState(), "deep-thought", "The quiet.");
  assert.equal(hasUsedApp(state, "thoughts"), true);
});

// An answer that was cleared is not a use. A dated empty value is how a
// clearing edit is recorded, and it must not look like content.
test("an emptied answer does not count as a use", () => {
  const state = withAnswer(createEmptyState(), "note", "   ");
  assert.equal(hasUsedApp(state, "note"), false);
});

test("Routine, Protocol and Log read their own evidence", () => {
  const habit = structuredClone(createEmptyState());
  habit.habits.definitions.one = { id: "one", action: "Walk" };
  assert.equal(hasUsedApp(habit, "habit"), true);

  const protocol = structuredClone(createEmptyState());
  protocol.protocol.runs.one = { id: "one" };
  assert.equal(hasUsedApp(protocol, "protocol"), true);

  const log = structuredClone(createEmptyState());
  log.days["2026-08-26"] = { timeBlocks: [{ start: "09:00" }] };
  assert.equal(hasUsedApp(log, "log"), true);
  // A day that exists but logged nothing is still a first use.
  const quiet = structuredClone(createEmptyState());
  quiet.days["2026-08-26"] = { timeBlocks: [] };
  assert.equal(hasUsedApp(quiet, "log"), false);
});

// The greeting has to reach the Page, not just exist in a model.
test("Note and Thoughts show their first words ahead of the rotations", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(
    shell,
    /firstUsePlaceholder\(state, "thoughts"\) \|\|\s*\n\s*selectThoughtPrompt/,
  );
  assert.match(
    shell,
    /firstUsePlaceholder\(state, "note"\) \|\|\s*\n\s*notePlaceholderPool/,
  );
});
