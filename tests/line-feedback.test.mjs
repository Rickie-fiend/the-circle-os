import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LINE_REACTION_WORDS,
  LINE_REACTION_LABELS,
  lineReaction,
  lineReactions,
  mergeLineFeedback,
  normalizeLineFeedback,
  reactToLine,
} from "../app/os/lines/line-feedback.js";
import {
  createEmptyState,
  normalizeState,
  reactToLineSeen,
} from "../app/os/circle-os-model.js";

// A joke is asked whether it landed. A quote or a fact is asked whether it was
// worth keeping. Different questions, so different words.
test("each kind is asked its own question", () => {
  assert.deepEqual(lineReactions("joke"), ["funny", "flat"]);
  assert.deepEqual(lineReactions("quote"), ["loved", "not-for-me"]);
  assert.deepEqual(lineReactions("fact"), ["loved", "not-for-me"]);
  // A kind nobody asks about is not given invented buttons.
  assert.deepEqual(lineReactions("quest"), []);
  for (const reaction of ["funny", "flat", "loved", "not-for-me"]) {
    assert.ok(LINE_REACTION_LABELS[reaction], `${reaction} has no spoken label`);
    assert.ok(LINE_REACTION_WORDS[reaction], `${reaction} has no word`);
    // Words, not pictures: the App has no other pictographs anywhere.
    assert.doesNotMatch(
      LINE_REACTION_WORDS[reaction],
      /\p{Extended_Pictographic}/u,
      `${reaction} still carries an emoji`,
    );
  }
});

test("a reaction is kept, and pressing it again takes it back", () => {
  let feedback = reactToLine({}, "j-tomorrow", "funny", "2026-08-26T09:00:00.000Z");
  assert.equal(lineReaction(feedback, "j-tomorrow"), "funny");

  // Changing your mind replaces it.
  feedback = reactToLine(feedback, "j-tomorrow", "flat", "2026-08-26T09:01:00.000Z");
  assert.equal(lineReaction(feedback, "j-tomorrow"), "flat");

  // A reaction given by accident on a reading surface has to be givable back,
  // and the same key is the only way out of it.
  feedback = reactToLine(feedback, "j-tomorrow", "flat", "2026-08-26T09:02:00.000Z");
  assert.equal(lineReaction(feedback, "j-tomorrow"), "");
  assert.deepEqual(feedback, {});
});

test("nonsense never reaches the record", () => {
  assert.deepEqual(normalizeLineFeedback(null), {});
  assert.deepEqual(normalizeLineFeedback({ "": { reaction: "funny" } }), {});
  assert.deepEqual(normalizeLineFeedback({ "j-1": { reaction: "" } }), {});
  assert.deepEqual(reactToLine({}, "", "funny"), {});
  assert.deepEqual(normalizeLineFeedback({ "j-1": { reaction: "funny" } }), {
    "j-1": { reaction: "funny", at: "" },
  });
});

// Local-first: two devices that reacted to different lines keep both, and the
// same line reacted to on both keeps the later press.
test("two devices keep both reactions, newest wins a clash", () => {
  const phone = { "j-1": { reaction: "funny", at: "2026-08-26T09:00:00.000Z" } };
  const laptop = {
    "j-1": { reaction: "flat", at: "2026-08-26T10:00:00.000Z" },
    "q-1": { reaction: "loved", at: "2026-08-26T08:00:00.000Z" },
  };
  const merged = mergeLineFeedback(phone, laptop);
  assert.equal(merged["j-1"].reaction, "flat");
  assert.equal(merged["q-1"].reaction, "loved");
  // The older press does not win by arriving second.
  assert.equal(mergeLineFeedback(laptop, phone)["j-1"].reaction, "flat");
});

test("the record survives a reload", () => {
  const state = reactToLineSeen(
    createEmptyState(),
    "f-honey",
    "loved",
    "2026-08-26T09:00:00.000Z",
  );
  assert.equal(lineReaction(state.lineFeedback, "f-honey"), "loved");
  assert.equal(
    lineReaction(normalizeState(state).lineFeedback, "f-honey"),
    "loved",
  );
  // A fresh install has an empty record rather than a missing one.
  assert.deepEqual(normalizeState(createEmptyState()).lineFeedback, {});
});

// Nothing is asked until a swipe says the reading is finished, and the swipe
// that opens the footer must not also be the one that leaves.
test("the first swipe asks and the second one leaves", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  const pass = shell.match(/function passLineForward\(\)[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.ok(pass, "passLineForward moved");
  assert.match(pass, /if \(!lineFeedbackOpen\) \{[\s\S]*?setLineFeedbackOpen\(true\);[\s\S]*?return;/);
  assert.match(pass, /closeNoteLine\(\)/);
  assert.match(shell, /onForwardBoundary=\{noteLineActive \? passLineForward : undefined\}/);

  // Nothing takes a Line away but him: there is no dwell any more.
  assert.doesNotMatch(shell, /LINE_DWELL_MS/);
  assert.match(shell, /function dismissLineBackward\(\)/);

  // A reaction records and then the Line goes.
  const react = shell.match(/function reactToRevealedLine\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(react, /reactToLineSeen\(current, line\.id, reaction\)/);
  assert.match(react, /closeNoteLine\(\)/);
});

// Only a first-use Cover tells you to swipe. A Line is a reading surface and
// carries nothing in its Footer until there is something to answer.
test("a Line's Footer is empty until it asks", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /const lastPageFooter = lineFeedbackOpen \? reactions : undefined;/);
  assert.doesNotMatch(shell, /os-line-cue/);
  assert.doesNotMatch(shell, /Swipe to reveal/);
});
