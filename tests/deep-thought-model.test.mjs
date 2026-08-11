import assert from "node:assert/strict";
import test from "node:test";
import { countDeepThoughtWords, createLocalDeepThoughtPrompt, deepThoughtFollowUp, isDeepThoughtRewardEligible } from "../app/os/deep-thought-model.js";

test("deep reward follows a sentence, not an essay", () => {
  const sentence = "I love this day, I am grateful for today";
  assert.equal(countDeepThoughtWords(sentence), 9);
  assert.equal(isDeepThoughtRewardEligible({ text: sentence, activeMs: 5_000 }), true);

  // A single word earns the press effect only.
  assert.equal(isDeepThoughtRewardEligible({ text: "happy", activeMs: 30_000 }), false);

  // Six words is the floor, and five is still short of it.
  assert.equal(isDeepThoughtRewardEligible({ text: "one two three four five six", activeMs: 5_000 }), true);
  assert.equal(isDeepThoughtRewardEligible({ text: "one two three four five", activeMs: 30_000 }), false);

  // The time guard only rules out text that could not have been typed.
  assert.equal(isDeepThoughtRewardEligible({ text: sentence, activeMs: 4_999 }), false);
});

test("local deep questions may use reviewed mission evidence", () => {
  const prompt = createLocalDeepThoughtPrompt({ profile: { identityFocus: "Yourself" }, days: { "2026-08-01": { mission: { text: "Call my sister" } } } }, "2026-08-01", 0);
  assert.match(prompt.text, /Call my sister/);
  assert.equal(prompt.source, "local-personalized");
  const followUp = deepThoughtFollowUp(prompt);
  assert.match(followUp.id, /follow-up$/);
  assert.equal(followUp.source, "follow-up");
});
