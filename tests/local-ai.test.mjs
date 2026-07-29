import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildPrompt,
  createCircleAiServer,
  guardProfileEvidence,
  mergeClientState,
  normalizeModelResult,
  serializeDayMarkdown,
  serializeProfileMarkdown,
} from "../local-ai/server.mjs";
import {
  createEmptyState,
  queueProfileUpdate,
} from "../app/os/circle-os-model.js";

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

test("server keeps an edited profile session when a stale phone copy returns", () => {
  const server = createEmptyState();
  server.profile.profileCase.sessions.gap = {
    text: "My own correction.",
    confidence: 1,
    userEdited: true,
    updatedAt: "2026-07-29T10:00:00.000Z",
  };
  const phone = structuredClone(server);
  phone.profile.profileCase.sessions.gap = {
    text: "Older AI words.",
    confidence: 0.4,
    userEdited: false,
    updatedAt: "2026-07-29T09:00:00.000Z",
  };

  const merged = mergeClientState(server, phone);
  assert.equal(
    merged.profile.profileCase.sessions.gap.text,
    "My own correction.",
  );
});

test("answering a profile question clears the old question while AI works", () => {
  const server = createEmptyState();
  server.profile.profileCase.survey.nextQuestion = {
    id: "profile-question-1",
    text: "Which part matters most?",
    target: "whatMatters",
  };
  const phone = structuredClone(server);
  phone.profile.profileCase.survey.answers.push({
    questionId: "profile-question-1",
    question: "Which part matters most?",
    answer: "Being with my friends.",
    target: "whatMatters",
    answeredAt: "2026-07-29T10:00:00.000Z",
  });
  phone.profile.profileCase.survey.nextQuestion = null;

  const merged = mergeClientState(server, phone);
  assert.equal(merged.profile.profileCase.survey.nextQuestion, null);
});

test("Obsidian copies keep the profile and day readable", () => {
  const state = createEmptyState();
  state.profile.name = "Sai";
  state.profile.age = 30;
  state.profile.vision.description = "A calm Tuesday.";
  state.profile.profileCase.sessions.typicalTuesday.text = "A calm Tuesday.";
  const day = {
    date: "2026-07-29",
    checkIns: [
      {
        period: "morning",
        energy: 4,
        mood: "Clear",
        createdAt: "2026-07-29T08:00:00.000Z",
      },
    ],
    mission: {
      text: "Take one honest pause.",
      why: "",
      identity: "Yourself",
      completed: true,
      completedAt: "2026-07-29T09:00:00.000Z",
    },
    timeBlocks: [
      {
        id: "one",
        start: "08:00",
        end: "09:00",
        activity: "Breakfast",
        title: "Breakfast",
        note: "",
        moments: ["Coffee with a friend"],
        createdAt: "2026-07-29T08:00:00.000Z",
      },
    ],
  };

  assert.match(serializeProfileMarkdown(state), /A calm Tuesday\./);
  assert.match(serializeDayMarkdown(day), /Coffee with a friend/);
});

test("phone sync returns quickly while the server finishes AI in the background", async () => {
  const vaultPath = mkdtempSync(join(tmpdir(), "circle-os-"));
  const previousToken = process.env.CIRCLE_AI_TOKEN;
  process.env.CIRCLE_AI_TOKEN = "test-token";
  const server = createCircleAiServer({
    vaultPath,
    generateProfile: async () => normalizeModelResult(response(), 0),
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const state = createEmptyState();
  state.profile.name = "Sai";
  state.profile.age = 30;
  state.profile.vision = {
    description: "A calm Tuesday.",
    preview: "A calm Tuesday.",
    understanding: "",
    gap: "",
    completedAt: "2026-07-29T08:00:00.000Z",
  };
  const queued = queueProfileUpdate(state, "first-vision");

  try {
    const syncResponse = await fetch(`${baseUrl}/sync`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: queued }),
    });
    assert.equal(syncResponse.status, 200);
    const first = await syncResponse.json();
    assert.equal(first.state.profile.profileCase.status, "thinking");

    await new Promise((resolve) => setTimeout(resolve, 30));
    const stateResponse = await fetch(`${baseUrl}/state`, {
      headers: { Authorization: "Bearer test-token" },
    });
    const finished = await stateResponse.json();
    assert.equal(finished.state.profile.profileCase.status, "ready");
    assert.equal(
      finished.state.profile.profileCase.sessions.typicalTuesday.text,
      "A calm day.",
    );
    assert.match(
      readFileSync(join(vaultPath, "Profile.md"), "utf8"),
      /A calm day\./,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousToken === undefined) delete process.env.CIRCLE_AI_TOKEN;
    else process.env.CIRCLE_AI_TOKEN = previousToken;
    rmSync(vaultPath, { recursive: true, force: true });
  }
});
