import assert from "node:assert/strict";
import test from "node:test";
import { countDeepThoughtWords, createLocalDeepThoughtPrompt, deepThoughtFollowUp, isDeepThoughtRewardEligible } from "../app/os/deep-thought-model.js";

test("deep reward requires both fifteen words and twenty active seconds", () => {
  const fifteen = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen";
  assert.equal(countDeepThoughtWords(fifteen), 15);
  assert.equal(isDeepThoughtRewardEligible({ text: fifteen, activeMs: 19_999 }), false);
  assert.equal(isDeepThoughtRewardEligible({ text: "one two", activeMs: 30_000 }), false);
  assert.equal(isDeepThoughtRewardEligible({ text: fifteen, activeMs: 20_000 }), true);
});

test("local deep questions may use reviewed mission evidence", () => {
  const prompt = createLocalDeepThoughtPrompt({ profile: { identityFocus: "Yourself" }, days: { "2026-08-01": { mission: { text: "Call my sister" } } } }, "2026-08-01", 0);
  assert.match(prompt.text, /Call my sister/);
  assert.equal(prompt.source, "local-personalized");
  const followUp = deepThoughtFollowUp(prompt);
  assert.match(followUp.id, /follow-up$/);
  assert.equal(followUp.source, "follow-up");
});
