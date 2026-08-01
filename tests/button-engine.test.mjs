import assert from "node:assert/strict";
import test from "node:test";

import {
  BUTTON_STYLE_IDS,
  canActivateButton,
  normalizeButtonStyleId,
  reduceButtonLifecycle,
  shuffleButtonStyles,
  takeNextButtonStyle,
} from "../app/os/button-engine-model.js";

test("a shuffled bag includes each approved button exactly once", () => {
  const bag = shuffleButtonStyles(() => 0.42);
  assert.equal(bag.length, BUTTON_STYLE_IDS.length);
  assert.deepEqual([...bag].sort(), [...BUTTON_STYLE_IDS].sort());
});

test("three selections exhaust every approved button before refilling", () => {
  let queue = [];
  let previous = null;
  const selected = [];
  for (let index = 0; index < BUTTON_STYLE_IDS.length; index += 1) {
    const next = takeNextButtonStyle(queue, previous, () => 0.42);
    selected.push(next.styleId);
    previous = next.styleId;
    queue = next.queue;
  }
  assert.deepEqual([...selected].sort(), [...BUTTON_STYLE_IDS].sort());
  assert.equal(new Set(selected).size, BUTTON_STYLE_IDS.length);
});

test("a refilled bag does not immediately repeat the previous style", () => {
  const next = takeNextButtonStyle([], "soft-clay", () => 0);
  assert.notEqual(next.styleId, "soft-clay");
});

test("unknown style identifiers normalize to the safe fallback", () => {
  assert.equal(normalizeButtonStyleId("ink-burst"), "ink-burst");
  assert.equal(normalizeButtonStyleId("internet-code"), null);
  assert.equal(normalizeButtonStyleId(null), null);
});

test("the button lifecycle follows reveal, press, success, and exit", () => {
  let state = "hidden";
  for (const event of [
    "reveal",
    "entry-complete",
    "press",
    "succeed",
    "success-complete",
    "exit-complete",
  ]) {
    state = reduceButtonLifecycle(state, event);
  }
  assert.equal(state, "hidden");
});

test("disabled or committed buttons cannot activate twice", () => {
  assert.equal(canActivateButton(), true);
  assert.equal(canActivateButton({ disabled: true }), false);
  assert.equal(canActivateButton({ committed: true }), false);
});
