import assert from "node:assert/strict";
import test from "node:test";

import {
  buttonPressesToBreak,
  isButtonBroken,
  nextButtonDamage,
  BUTTON_ROTATION_STYLE_IDS,
  BUTTON_STYLE_IDS,
  canActivateButton,
  normalizeButtonStyleId,
  reduceButtonLifecycle,
  revealButtonStyle,
  shuffleButtonStyles,
  takeNextButtonStyle,
} from "../app/os/button-engine-model.js";

test("a shuffled bag includes each rotating button exactly once", () => {
  const bag = shuffleButtonStyles(() => 0.42);
  assert.equal(bag.length, BUTTON_ROTATION_STYLE_IDS.length);
  assert.deepEqual([...bag].sort(), [...BUTTON_ROTATION_STYLE_IDS].sort());
});

test("selections exhaust every rotating button before refilling", () => {
  let queue = [];
  let previous = null;
  const selected = [];
  for (let index = 0; index < BUTTON_ROTATION_STYLE_IDS.length; index += 1) {
    const next = takeNextButtonStyle(queue, previous, () => 0.42);
    selected.push(next.styleId);
    previous = next.styleId;
    queue = next.queue;
  }
  assert.deepEqual([...selected].sort(), [...BUTTON_ROTATION_STYLE_IDS].sort());
  assert.equal(new Set(selected).size, BUTTON_ROTATION_STYLE_IDS.length);
});

test("a refilled bag does not immediately repeat the previous style", () => {
  const next = takeNextButtonStyle([], "soft-clay", () => 0);
  assert.notEqual(next.styleId, "soft-clay");
});

test("hiding an unsent button keeps its design and does not consume the bag", () => {
  const queue = ["default", "soft-clay"];
  const next = revealButtonStyle("ink-burst", queue, "liquid-capsule", () => 0);
  assert.equal(next.styleId, "ink-burst");
  assert.deepEqual(next.queue, queue);
  assert.notEqual(next.queue, queue);
});

test("unknown style identifiers normalize to the safe fallback", () => {
  assert.equal(normalizeButtonStyleId("default"), "default");
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

test("preview buttons reset in place without remounting", () => {
  let state = "ready";
  for (const event of ["press", "succeed", "preview-reset"]) {
    state = reduceButtonLifecycle(state, event);
  }
  assert.equal(state, "ready");
});

test("disabled or committed buttons cannot activate twice", () => {
  assert.equal(canActivateButton(), true);
  assert.equal(canActivateButton({ disabled: true }), false);
  assert.equal(canActivateButton({ committed: true }), false);
});

test("a breaking style takes several presses before it commits", () => {
  assert.equal(buttonPressesToBreak("fractured-glass"), 4);

  // Every other style acts on the first press, so callers never special-case.
  assert.equal(buttonPressesToBreak("soft-clay"), 1);
  assert.equal(buttonPressesToBreak("default"), 1);
  assert.equal(buttonPressesToBreak("not-a-style"), 1);
  assert.equal(buttonPressesToBreak(null), 1);

  // Four strikes: the first three only fracture it.
  let damage = 0;
  const struck = [];
  for (let press = 0; press < 4; press += 1) {
    damage = nextButtonDamage(damage, 4);
    struck.push(isButtonBroken(damage, 4));
  }
  assert.deepEqual(struck, [false, false, false, true]);
  assert.equal(damage, 4);

  // Damage never runs past the break, however many times it is hit.
  assert.equal(nextButtonDamage(4, 4), 4);
  assert.equal(nextButtonDamage(99, 4), 4);

  // Nonsense damage is treated as untouched rather than throwing.
  assert.equal(nextButtonDamage(Number.NaN, 4), 1);
  assert.equal(nextButtonDamage(-3, 4), 1);

  // A single-press style is broken by its first press.
  assert.equal(isButtonBroken(nextButtonDamage(0, 1), 1), true);
});

test("earned styles are never dealt by the everyday rotation", () => {
  assert.ok(BUTTON_STYLE_IDS.includes("fractured-glass"), "still a valid style");
  assert.ok(BUTTON_STYLE_IDS.includes("ink-wash"), "the Protocol reward is valid");
  assert.ok(!BUTTON_ROTATION_STYLE_IDS.includes("fractured-glass"));
  assert.ok(!BUTTON_ROTATION_STYLE_IDS.includes("ink-wash"));

  // Deal many full bags; a style that must be broken four times should never
  // arrive by chance on an ordinary action.
  const dealt = new Set();
  for (let round = 0; round < 200; round += 1) {
    let queue = [];
    for (let draw = 0; draw < BUTTON_STYLE_IDS.length + 2; draw += 1) {
      const next = takeNextButtonStyle(queue);
      queue = next.queue;
      dealt.add(next.styleId);
    }
  }
  assert.ok(!dealt.has("fractured-glass"), "never dealt at random");
  assert.ok(!dealt.has("ink-wash"), "earned only by closing a kept day");
  assert.equal(dealt.size, BUTTON_ROTATION_STYLE_IDS.length);

  // It stays usable when chosen deliberately.
  assert.equal(normalizeButtonStyleId("fractured-glass"), "fractured-glass");
  assert.equal(normalizeButtonStyleId("ink-wash"), "ink-wash");
  assert.equal(buttonPressesToBreak("fractured-glass"), 4);
});
