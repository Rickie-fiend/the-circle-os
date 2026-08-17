import assert from "node:assert/strict";
import test from "node:test";

import {
  addHabitDefinition,
  createEmptyState,
  normalizeState,
  updateHabitDefinition,
  updateHabitDefinitionDraft,
} from "../app/os/circle-os-model.js";

// Sai could not type a space in a habit. The draft path kept what he typed and
// the commit path was right to trim, but normalising ran between the two on
// every state update and trimmed the draft, so the controlled textarea read the
// trimmed value straight back and the character never survived a keystroke.
// This is the regression guard for the middle of that path.
test("normalising does not trim a habit that is still being typed", () => {
  let state = createEmptyState();
  const added = addHabitDefinition(state);
  state = added.state;
  const id = added.id;

  state = updateHabitDefinitionDraft(state, id, { action: "Write" });
  state = updateHabitDefinitionDraft(state, id, { action: "Write " });

  assert.equal(
    normalizeState(state).habits.definitions[id].action,
    "Write ",
    "the trailing space was removed before it could be rendered back",
  );

  state = updateHabitDefinitionDraft(state, id, {
    action: "Write 1 thing down after coffee",
  });
  assert.equal(
    normalizeState(state).habits.definitions[id].action,
    "Write 1 thing down after coffee",
  );
});

test("committing still tidies the value", () => {
  let state = createEmptyState();
  const added = addHabitDefinition(state);
  state = added.state;
  state = updateHabitDefinitionDraft(state, added.id, { action: "a b c " });
  state = updateHabitDefinition(state, added.id, "a b c ");
  assert.equal(state.habits.definitions[added.id].action, "a b c");
});

test("a habit is still one line", () => {
  let state = createEmptyState();
  const added = addHabitDefinition(state);
  state = added.state;
  state = updateHabitDefinitionDraft(state, added.id, {
    action: "Write\nthings\tdown",
  });
  assert.equal(
    normalizeState(state).habits.definitions[added.id].action,
    "Write things down",
  );
});
