import assert from "node:assert/strict";
import test from "node:test";

import {
  CHARACTER_DIMENSIONS,
  CHARACTER_HORIZON_YEARS,
  CHARACTER_TRAIT_MAX,
  addHabitDefinition,
  characterDimensionOf,
  createEmptyState,
  currentCharacter,
  declareLife,
  declarationVersions,
  habitsByDimension,
  setHabitDimension,
  updateHabitDefinitionDraft,
} from "../app/os/circle-os-model.js";

const HIM = {
  mind: "Clear thinker",
  body: "Strong",
  social: "Charismatic",
  past: "Working a job I did not choose",
  starting: "mind",
};

// Four parts of a life, named one at a time. Day one asks for one trait in one
// part — Sai: "why dont we just ask for 1 trait you'd like to have, choose from
// 4 dimensions" — and the rest are named the next day.
test("a character begins with one trait and grows to four", () => {
  assert.deepEqual([...CHARACTER_DIMENSIONS], ["mind", "body", "spirit", "social"]);

  // Day one: one part, one trait. His own example — "(body) lean body posture
  // and body language".
  const dayOne = declareLife(createEmptyState(), "character", {
    body: "Lean posture and open body language",
    past: "Working a job I did not choose",
  });
  const started = currentCharacter(dayOne);
  assert.equal(started.traits.length, 1);
  assert.deepEqual(started.traits[0], {
    dimension: "body",
    trait: "Lean posture and open body language",
  });

  // Three, and then all four, are equally a character: it is never invalid for
  // being unfinished.
  const three = currentCharacter(declareLife(createEmptyState(), "character", HIM));
  assert.deepEqual(three.traits.map((entry) => entry.dimension), ["mind", "body", "social"]);
  const all = currentCharacter(
    declareLife(createEmptyState(), "character", {
      mind: "a", body: "b", spirit: "c", social: "d",
    }),
  );
  assert.equal(all.traits.length, CHARACTER_TRAIT_MAX);

  // Nothing named is nothing to declare.
  assert.equal(
    currentCharacter(declareLife(createEmptyState(), "character", { past: "anything" })),
    null,
  );
});

// Two years: one is too close to be a different person, five too far to feel.
// Six months belongs to the Dreamline, which asks for something concrete.
test("the character stands two years out, and the past makes him believable", () => {
  const state = declareLife(createEmptyState(), "character", HIM, {
    declaredAt: "2026-09-06T09:00:00.000Z",
  });
  const him = currentCharacter(state);
  assert.equal(him.targetAt.slice(0, 10), "2028-09-06");
  assert.equal(
    new Date(him.targetAt).getFullYear() - new Date(him.declaredAt).getFullYear(),
    CHARACTER_HORIZON_YEARS,
  );
  // Asked once. It is there to show two years is long enough to have become
  // someone else already, without trying.
  assert.equal(him.past, "Working a job I did not choose");
});

// A character is superseded, never rewritten: the one he wrote before is still
// there to read, like every other declaration.
test("becoming someone else supersedes rather than overwrites", () => {
  let state = declareLife(createEmptyState(), "character", HIM, {
    declaredAt: "2026-09-06T09:00:00.000Z",
  });
  state = declareLife(
    state,
    "character",
    { ...HIM, mind: "Sharp", spirit: "At peace", social: "" },
    { declaredAt: "2027-01-04T09:00:00.000Z" },
  );
  const versions = declarationVersions(state, "character");
  assert.equal(versions.length, 2);
  assert.equal(currentCharacter(state).traits[0].trait, "Sharp");
  assert.equal(versions[1].content.mind, "Clear thinker", "the old one is still readable");
});

// Sai's ladder: "Wise man (mind) > read 1 page on my desk after morning coffee
// to become a reader (2min) > read 1 chapter."
test("a habit feeds one part of the character", () => {
  let state = declareLife(createEmptyState(), "character", HIM);
  const added = addHabitDefinition(state);
  state = updateHabitDefinitionDraft(added.state, added.id, {
    action: "read 1 page",
    cue: "morning coffee",
    identity: "a reader",
  });
  state = setHabitDimension(state, added.id, "mind");

  const habit = state.habits.definitions[added.id];
  assert.equal(habit.dimension, "mind");
  // The three parts of the sentence are separate fields, so the anchor — the
  // part people skip and the part that decides whether it sticks — is its own
  // answer rather than something to remember to include.
  assert.deepEqual(
    { identity: habit.identity, cue: habit.cue, action: habit.action },
    { identity: "a reader", cue: "morning coffee", action: "read 1 page" },
  );

  // A week can be asked which part of him it fed.
  const grouped = habitsByDimension(state);
  assert.equal(grouped.mind.length, 1);
  assert.equal(grouped.body.length, 0);

  // The trait names the dimension both ways round.
  assert.equal(characterDimensionOf(state, "charismatic"), "social");
  assert.equal(characterDimensionOf(state, "rich"), "");
  // And nothing outside the four sticks.
  assert.equal(setHabitDimension(state, added.id, "wealth").habits.definitions[added.id].dimension, "");
});
