import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPrompt,
  guardProfileEvidence,
  normalizeModelResult,
} from "../local-ai/server.mjs";

function response() {
  return {
    sessions: {
      typicalTuesday: { text: "A calm day.", confidence: 0.7 },
      currentLife: { text: "Not enough days yet.", confidence: 0.2 },
      whatMatters: { text: "Close people may matter.", confidence: 0.4 },
      gap: { text: "The gap is still unclear.", confidence: 0.2 },
      missionStatement: { text: "I live honestly.", confidence: 0.5 },
      personality: { text: "You are an introvert.", confidence: 0.9 },
    },
    nextQuestion: {
      text: "When did you feel most like yourself this week?",
      target: "whatMatters",
    },
    dailyMission: "Notice one honest moment.",
  };
}

test("keeps personality locked before six real answers", () => {
  const result = normalizeModelResult(response(), 2);
  assert.equal(result.sessions.personality.text, "");
  assert.equal(result.nextQuestion.id, "profile-question-3");
});

test("unlocks the personality draft after six answers", () => {
  const result = normalizeModelResult(response(), 6);
  assert.match(result.sessions.personality.text, /introvert/);
  assert.equal(result.nextQuestion, null);
});

test("profile prompt includes the phone evidence without changing it", () => {
  const prompt = buildPrompt({
    person: { dreamLifestyle: "I live near my friends." },
  });
  assert.match(prompt, /I live near my friends/);
  assert.match(prompt, /evidence is missing/i);
});

test("no recorded life can never become invented current-life facts", () => {
  const result = guardProfileEvidence(normalizeModelResult(response(), 0), {
    days: {},
  });
  assert.match(result.sessions.currentLife.text, /not enough/i);
  assert.match(result.sessions.gap.text, /not recorded/i);
  assert.doesNotMatch(result.sessions.currentLife.text, /job|health|family/i);
});
