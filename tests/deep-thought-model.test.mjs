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

test("source-linked Athena curiosity is asked before the static list", () => {
  const state = {
    athenaMemory: {
      curiosity: [{
        id: "quiet-mornings",
        question: "What makes a quiet morning feel alive to you?",
        sourceRefs: [{ sourceType: "day", sourceId: "day:2026-08-17" }],
        status: "active",
      }],
    },
    profile: {
      identityFocus: "Yourself",
      profileCase: { survey: { answers: [] } },
    },
    days: {},
  };
  const prompt = createLocalDeepThoughtPrompt(state, "2026-08-18", 0);
  assert.equal(prompt.id, "deep-curiosity-quiet-mornings");
  assert.equal(prompt.text, "What makes a quiet morning feel alive to you?");
  assert.equal(prompt.source, "athena");
});

test("curiosity without evidence or already answered is not asked again", () => {
  const state = {
    athenaMemory: {
      curiosity: [
        { id: "invented", question: "A question without evidence?", sourceRefs: [] },
        {
          id: "answered",
          question: "A sourced question already answered?",
          sourceRefs: [{ sourceType: "thought", sourceId: "thought-1" }],
        },
      ],
    },
    profile: {
      identityFocus: "Yourself",
      profileCase: {
        survey: { answers: [{ questionId: "deep-curiosity-answered" }] },
      },
    },
    days: {},
  };
  const prompt = createLocalDeepThoughtPrompt(state, "2026-08-18", 0);
  assert.equal(prompt.source, "local");
});
