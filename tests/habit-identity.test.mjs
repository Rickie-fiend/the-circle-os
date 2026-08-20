import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  addHabitDefinition,
  createEmptyState,
  habitRowText,
  normalizeState,
  toggleHabitForDay,
  updateHabitDefinition,
  updateHabitDefinitionDraft,
  updateHabitDefinitionParts,
} from "../app/os/circle-os-model.js";
import { selectThoughtPrompt } from "../app/os/thought-prompt-model.js";

test("a chapter-shaped habit keeps action, cue and identity separately", () => {
  const added = addHabitDefinition(createEmptyState(), "write");
  const state = updateHabitDefinitionParts(added.state, added.id, {
    action: "Write 1 thing down",
    cue: "after making coffee",
    identity: "Someone who notices my life",
    text: "I will Write 1 thing down, after making coffee, so I can become Someone who notices my life.",
  });

  assert.deepEqual(
    {
      action: state.habits.definitions.write.action,
      cue: state.habits.definitions.write.cue,
      identity: state.habits.definitions.write.identity,
    },
    {
      action: "Write 1 thing down",
      cue: "after making coffee",
      identity: "Someone who notices my life",
    },
  );
  assert.equal(habitRowText(state.habits.definitions.write, false), "Write 1 thing down after making coffee");
  assert.equal(habitRowText(state.habits.definitions.write, true), "Someone who notices my life");
});

test("two habits keep their own identity through tick, untick and tick", () => {
  let state = createEmptyState();
  for (const [id, identity] of [["write", "A writer"], ["walk", "Someone who cares for my body"]]) {
    const added = addHabitDefinition(state, id);
    state = updateHabitDefinitionParts(added.state, id, { action: id, identity });
  }
  const day = "2026-08-14";
  state = toggleHabitForDay(state, "write", day);
  assert.equal(habitRowText(state.habits.definitions.write, true), "A writer");
  assert.equal(state.habits.definitions.walk.identity, "Someone who cares for my body");
  state = toggleHabitForDay(state, "write", day);
  assert.equal(habitRowText(state.habits.definitions.write, false), "write");
  state = toggleHabitForDay(state, "write", day);
  assert.equal(habitRowText(state.habits.definitions.write, true), "A writer");
});

test("a legacy text-only habit migrates to action and still ticks", () => {
  const legacy = createEmptyState();
  legacy.habits.definitions.walk = {
    id: "walk",
    text: "Walk after lunch",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
  let state = normalizeState(legacy);
  assert.deepEqual(
    {
      action: state.habits.definitions.walk.action,
      cue: state.habits.definitions.walk.cue,
      identity: state.habits.definitions.walk.identity,
    },
    { action: "Walk after lunch", cue: "", identity: "" },
  );
  state = toggleHabitForDay(state, "walk", "2026-08-14");
  assert.equal(state.habits.completions["2026-08-14:walk"].completed, true);
  assert.equal(habitRowText(state.habits.definitions.walk, true), "Walk after lunch");
});

test("editing action preserves cue and identity, while identityFocus still personalises Thoughts", () => {
  const added = addHabitDefinition(createEmptyState(), "morning");
  let state = updateHabitDefinitionParts(added.state, added.id, {
    action: "Read",
    cue: "after breakfast",
    identity: "A reader",
  });
  state = updateHabitDefinition(state, added.id, "Read two pages");
  assert.equal(state.habits.definitions.morning.cue, "after breakfast");
  assert.equal(state.habits.definitions.morning.identity, "A reader");

  state.profile.identityFocus = "A calm builder";
  const prompts = Array.from({ length: 24 }, (_, hour) =>
    selectThoughtPrompt(state, "2026-08-12", new Date(2026, 7, 12, hour)),
  );
  assert.ok(prompts.some((prompt) => prompt.includes("calm builder")));
});

test("habit typing keeps spaces verbatim until blur commits the value", () => {
  const added = addHabitDefinition(createEmptyState(), "spaced");
  const revision = added.state.evidence.localRevision;
  let state = updateHabitDefinitionDraft(added.state, added.id, {
    action: "a b c ",
  });

  assert.equal(state.habits.definitions.spaced.action, "a b c ");
  assert.equal(state.evidence.localRevision, revision, "a draft is not synced mid-keystroke");

  state = updateHabitDefinition(
    state,
    added.id,
    state.habits.definitions.spaced.action,
  );
  assert.equal(state.habits.definitions.spaced.action, "a b c");
  assert.equal(normalizeState(state).habits.definitions.spaced.action, "a b c");
  assert.equal(state.evidence.localRevision, revision + 1);
});

test("the published habit completion is wired to all three stored fields", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  const css = readFileSync("app/os/os-app.css", "utf8");
  assert.match(shell, /chapterAnswerText\(nextRun, "habit-action"\)/);
  assert.match(shell, /chapterAnswerText\(nextRun, "habit-time-place"\)/);
  assert.match(shell, /chapterAnswerText\(nextRun, "habit-identity"\)/);
  assert.match(shell, /updateHabitDefinitionParts\(added\.state, added\.id, \{[\s\S]*?action,[\s\S]*?cue,[\s\S]*?identity,/);
  assert.match(css, /\.os-habit-action-copy,[\s\S]*?\.os-habit-identity-copy[\s\S]*?transition: opacity 220ms/);
  assert.match(css, /\.os-habit-copy-swap\.show-identity \.os-habit-action-copy[\s\S]*?opacity: 0/);
  // The identity is shown once the row has finished making room for it, not on
  // a delay of its own — a delay counted from the tick drifted away from the
  // timer that moves the height, and the identity could arrive before the space.
  assert.match(css, /\.os-habit-copy-swap\.show-identity\.has-settled \.os-habit-identity-copy[\s\S]*?opacity: 1/);
});
