import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  applyProfileMarkdown,
  createCircleAiServer,
  mergeClientState,
  serializeDayMarkdown,
  serializeProfileMarkdown,
} from "../local-ai/server.mjs";
import {
  createEmptyState,
  queueProfileUpdate,
  queueSuggestion,
} from "../app/os/circle-os-model.js";

function firstVision(name = "Sai") {
  const state = createEmptyState();
  state.profile.name = name;
  state.profile.age = 27;
  state.profile.vision = {
    description: "A calm Tuesday with creative work and close friends.",
    preview: "A calm Tuesday with creative work and close friends.",
    understanding: "",
    gap: "",
    completedAt: "2026-07-29T08:00:00.000Z",
  };
  state.profile.profileCase.sessions.typicalTuesday = {
    text: state.profile.vision.description,
    confidence: 1,
    userEdited: true,
    updatedAt: "2026-07-29T08:00:00.000Z",
  };
  return queueProfileUpdate(state, "first-vision");
}

test("server keeps an edited profile session when a stale phone copy returns", () => {
  const server = firstVision();
  server.profile.profileCase.sessions.gap = {
    text: "My own correction.",
    confidence: 1,
    userEdited: true,
    updatedAt: "2026-07-29T10:00:00.000Z",
  };
  const phone = structuredClone(server);
  phone.profile.profileCase.sessions.gap = {
    text: "Older profile words.",
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

test("server keeps the newest chapter page and answer", () => {
  const server = createEmptyState();
  const phone = createEmptyState();
  server.chapters.runs["habit@1"] = {
    runId: "habit@1",
    chapterId: "habit",
    chapterVersion: 1,
    status: "in-progress",
    currentPageId: "choice",
    startedAt: "2026-07-30T08:00:00.000Z",
    updatedAt: "2026-07-30T08:01:00.000Z",
    completedAt: null,
    answers: [],
  };
  phone.chapters.runs["habit@1"] = {
    ...server.chapters.runs["habit@1"],
    currentPageId: "plan",
    updatedAt: "2026-07-30T08:05:00.000Z",
    answers: [
      {
        pageId: "choice",
        answerKey: "habit-choice",
        value: "reader",
        displaySnapshot: "Reader",
        answeredAt: "2026-07-30T08:04:00.000Z",
        changedAt: "2026-07-30T08:04:00.000Z",
      },
    ],
  };

  const merged = mergeClientState(server, phone);

  assert.equal(merged.chapters.runs["habit@1"].currentPageId, "plan");
  assert.equal(
    merged.chapters.runs["habit@1"].answers[0].answerKey,
    "habit-choice",
  );
});

test("answering a profile question clears the old question", () => {
  const server = firstVision();
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

test("Obsidian copies keep profile sections and day evidence readable", () => {
  const state = firstVision();
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

  assert.match(
    serializeProfileMarkdown(state, { profileId: "p_1234567890abcdef" }),
    /## Interests/,
  );
  assert.match(serializeDayMarkdown(day), /Coffee with a friend/);
});

test("Vision reads Codex output directly from Profile.md", () => {
  const state = firstVision();
  const markdown = serializeProfileMarkdown(state, {
    profileId: "p_1234567890abcdef",
    analysisPending: false,
    lastAnalyzed: "2026-07-29T17:10:00.000Z",
  })
    .replace(
      /## Personality[\s\S]*?(?=\n\n## Today's Mission)/,
      `## Personality

<!-- user-edited: false; confidence: 0.55 -->

You may prefer freedom with a gentle rhythm instead of rigid structure.`,
    )
    .replace(
      /## Next Question[\s\S]*?(?=\n\n## Answers)/,
      `## Next Question

<!-- id: creative-work-1; target: interests -->

When you say creative work, what are you making?`,
    );

  const updated = applyProfileMarkdown(state, markdown);
  assert.match(
    updated.profile.profileCase.sessions.personality.text,
    /gentle rhythm/,
  );
  assert.equal(
    updated.profile.profileCase.survey.nextQuestion.text,
    "When you say creative work, what are you making?",
  );
  assert.equal(updated.profile.profileCase.status, "ready");
});

test("public phones receive separate private Obsidian profiles", async () => {
  const vaultPath = mkdtempSync(join(tmpdir(), "circle-os-vault-"));
  const accessPath = join(
    mkdtempSync(join(tmpdir(), "circle-os-access-")),
    "access.json",
  );
  const server = createCircleAiServer({ vaultPath, accessPath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const createResponse = await fetch(`${baseUrl}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: firstVision("Sai") }),
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.match(created.profileId, /^p_/);
    assert.ok(created.accessKey.length > 30);

    const denied = await fetch(`${baseUrl}/profiles/${created.profileId}`, {
      headers: { Authorization: "Bearer wrong" },
    });
    assert.equal(denied.status, 401);

    const profileResponse = await fetch(
      `${baseUrl}/profiles/${created.profileId}`,
      { headers: { Authorization: `Bearer ${created.accessKey}` } },
    );
    assert.equal(profileResponse.status, 200);
    assert.match(
      readFileSync(
        join(vaultPath, "Profiles", created.profileId, "Profile.md"),
        "utf8",
      ),
      /analysis_pending: true/,
    );

    const secondResponse = await fetch(`${baseUrl}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: firstVision("Friend") }),
    });
    const second = await secondResponse.json();
    assert.notEqual(second.profileId, created.profileId);
    assert.notEqual(second.accessKey, created.accessKey);

    const firstProfilePath = join(
      vaultPath,
      "Profiles",
      created.profileId,
      "Profile.md",
    );
    writeFileSync(
      firstProfilePath,
      readFileSync(firstProfilePath, "utf8")
        .replace("analysis_pending: true", "analysis_pending: false")
        .replace("last_analyzed: ", "last_analyzed: 2026-07-29T17:10:00.000Z"),
      "utf8",
    );
    const refreshed = await fetch(
      `${baseUrl}/profiles/${created.profileId}`,
      { headers: { Authorization: `Bearer ${created.accessKey}` } },
    );
    const refreshedProfile = await refreshed.json();
    assert.equal(refreshedProfile.state.profile.profileCase.status, "ready");

    const suggestionState = queueSuggestion(
      refreshedProfile.state,
      "Let me draw how I feel.",
    );
    const suggestionResponse = await fetch(
      `${baseUrl}/profiles/${created.profileId}/sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${created.accessKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: suggestionState }),
      },
    );
    assert.equal(suggestionResponse.status, 200);
    assert.match(
      readFileSync(join(vaultPath, "Suggestions.md"), "utf8"),
      /Let me draw how I feel\./,
    );
    assert.match(
      readFileSync(firstProfilePath, "utf8"),
      /analysis_pending: false/,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(vaultPath, { recursive: true, force: true });
    rmSync(dirname(accessPath), { recursive: true, force: true });
  }
});
