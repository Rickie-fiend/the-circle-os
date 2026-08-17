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
  answerSurveyQuestion,
  createEmptyState,
  declareLife,
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

test("server keeps the newest app page without reviving an old cover", () => {
  const server = createEmptyState();
  const phone = createEmptyState();
  server.appSessions["vision-profile"] = {
    version: "update-1",
    index: 0,
    updatedAt: "2026-07-30T08:00:00.000Z",
  };
  phone.appSessions["vision-profile"] = {
    version: "update-1",
    index: 1,
    updatedAt: "2026-07-30T08:05:00.000Z",
  };

  const merged = mergeClientState(server, phone);

  assert.equal(merged.appSessions["vision-profile"].index, 1);
});

test("server keeps the newest Protocol day seal correction", () => {
  const server = createEmptyState();
  const phone = createEmptyState();
  const id = "run-1:2026-08-14";
  server.protocol.seals[id] = {
    id,
    runId: "run-1",
    dateKey: "2026-08-14",
    sealed: true,
    updatedAt: "2026-08-14T08:00:00.000Z",
  };
  phone.protocol.seals[id] = {
    ...server.protocol.seals[id],
    sealed: false,
    unsealedAt: "2026-08-14T09:00:00.000Z",
    updatedAt: "2026-08-14T09:00:00.000Z",
  };

  const merged = mergeClientState(server, phone);
  assert.equal(merged.protocol.seals[id].sealed, false);
  assert.equal(merged.protocol.seals[id].unsealedAt, "2026-08-14T09:00:00.000Z");
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
    missions: [
      {
        id: "mission-two",
        text: "Call my sister",
        completed: false,
        completedAt: null,
        createdAt: "2026-07-29T10:00:00.000Z",
      },
    ],
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
  assert.match(serializeDayMarkdown(day), /- \[ \] Call my sister/);
});

test("chapter answers remain readable in the Obsidian profile", () => {
  const state = firstVision();
  state.chapters.runs["habit@1"] = {
    runId: "habit@1",
    chapterId: "habit",
    chapterVersion: 1,
    status: "completed",
    currentPageId: "idle",
    startedAt: "2026-07-30T08:00:00.000Z",
    updatedAt: "2026-07-30T08:05:00.000Z",
    completedAt: "2026-07-30T08:05:00.000Z",
    answers: [
      {
        pageId: "identity",
        answerKey: "habit-identity-v1",
        questionSnapshot: "Who are you becoming?",
        value: "reader",
        displaySnapshot: "A reader",
        answeredAt: "2026-07-30T08:03:00.000Z",
        changedAt: "2026-07-30T08:03:00.000Z",
      },
    ],
  };

  const markdown = serializeProfileMarkdown(state, {
    profileId: "p_1234567890abcdef",
  });

  assert.match(markdown, /Who are you becoming\?/);
  assert.match(markdown, /A reader/);
});

test("server keeps a newer empty Routine identity instead of restoring a name", () => {
  const server = createEmptyState();
  const phone = createEmptyState();
  server.habits.identity = {
    text: "Leader",
    updatedAt: "2026-08-14T08:00:00.000Z",
  };
  phone.habits.identity = {
    text: "",
    updatedAt: "2026-08-14T09:00:00.000Z",
  };

  const merged = mergeClientState(server, phone);
  assert.deepEqual(merged.habits.identity, phone.habits.identity);
});

test("dated declaration versions remain readable in the Obsidian profile", () => {
  let state = firstVision();
  state = declareLife(
    state,
    "vision",
    { life: "A small creative house by the water.", why: "People can gather there." },
    { id: "vision-one", declaredAt: "2026-08-14T08:00:00.000Z" },
  );
  state = declareLife(
    state,
    "vision",
    { life: "A generous creative home in the city.", why: "Friends can make things together." },
    { id: "vision-two", declaredAt: "2026-08-14T09:00:00.000Z" },
  );

  const markdown = serializeProfileMarkdown(state, {
    profileId: "p_1234567890abcdef",
  });

  assert.match(markdown, /## Declarations/);
  assert.match(markdown, /### Vision - Current/);
  assert.match(markdown, /declaration-id: vision-two; declared: 2026-08-14T09:00:00.000Z; supersedes: vision-one/);
  assert.match(markdown, /### Vision - Earlier version/);
  assert.match(markdown, /A small creative house by the water\./);
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

test("Profile.md carries Athena's daily deep thought prompt", () => {
  const state = firstVision();
  state.profile.profileCase.deepThoughtPrompt = {
    id: "deep-athena-2026-08-01",
    text: "What part of your current rhythm deserves a more honest look?",
    target: "currentLife",
    dateKey: "2026-08-01",
    source: "athena",
    preparedAt: "2026-08-01T00:05:00.000Z",
  };

  const markdown = serializeProfileMarkdown(state, {
    profileId: "p_1234567890abcdef",
  });
  const updated = applyProfileMarkdown(firstVision(), markdown);

  assert.match(markdown, /## Deep Thought/);
  assert.equal(
    updated.profile.profileCase.deepThoughtPrompt.text,
    "What part of your current rhythm deserves a more honest look?",
  );
  assert.equal(updated.profile.profileCase.deepThoughtPrompt.source, "athena");
});

test("profile mission comments never appear inside the app mission", () => {
  const state = firstVision();
  const markdown = serializeProfileMarkdown(state, {
    profileId: "p_1234567890abcdef",
    analysisPending: false,
    lastAnalyzed: "2026-07-30T08:00:00.000Z",
  });
  const withMissionComment = markdown.replace(
    "## Today's Mission\n\n",
    "## Today's Mission\n\n<!-- user-edited: false; confidence: 0.80 -->\n\n",
  );

  const updated = applyProfileMarkdown(state, withMissionComment);
  const today = updated.days[Object.keys(updated.days).sort().at(-1)];

  assert.doesNotMatch(today.mission.text, /user-edited|<!--/);
});

test("Windows autostart is boot-capable, hidden, and duplicate-safe", () => {
  const starter = readFileSync(
    new URL("../local-ai/start-local-ai.ps1", import.meta.url),
    "utf8",
  );
  const installer = readFileSync(
    new URL("../local-ai/install-local-ai-autostart.ps1", import.meta.url),
    "utf8",
  );

  assert.match(installer, /New-ScheduledTaskTrigger -AtStartup/);
  assert.match(installer, /LogonType S4U/);
  assert.match(installer, /CurrentVersion\\Run/);
  assert.match(installer, /CircleOSLocalAI/);
  assert.match(installer, /-WindowStyle Hidden/);
  assert.match(starter, /127\.0\.0\.1:4317\/health/);
  assert.match(starter, /already running/);
});

test("phone freshness is isolated per profile and survives a server restart", async () => {
  const vaultPath = mkdtempSync(join(tmpdir(), "circle-os-freshness-vault-"));
  const accessPath = join(
    mkdtempSync(join(tmpdir(), "circle-os-freshness-access-")),
    "access.json",
  );

  async function listen() {
    const server = createCircleAiServer({ vaultPath, accessPath });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    return { server, baseUrl: `http://127.0.0.1:${address.port}` };
  }

  async function close(server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  const firstServer = await listen();
  let first;
  let second;
  let firstFreshness;
  let secondFreshness;
  try {
    const create = async (name) => {
      const response = await fetch(`${firstServer.baseUrl}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: firstVision(name) }),
      });
      assert.equal(response.status, 201);
      return response.json();
    };
    first = await create("First profile");
    second = await create("Second profile");
    firstFreshness = await fetch(
      `${firstServer.baseUrl}/profiles/${first.profileId}/freshness`,
    ).then((response) => response.json());

    const secondUpdate = answerSurveyQuestion(
      second.state,
      { id: "freshness-proof", text: "What arrived?" },
      "Only the second profile changed.",
      "thought",
    );
    const sync = await fetch(
      `${firstServer.baseUrl}/profiles/${second.profileId}/sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${second.accessKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: secondUpdate }),
      },
    );
    assert.equal(sync.status, 200);

    const firstAfterSecondSync = await fetch(
      `${firstServer.baseUrl}/profiles/${first.profileId}/freshness`,
    ).then((response) => response.json());
    secondFreshness = await fetch(
      `${firstServer.baseUrl}/profiles/${second.profileId}/freshness`,
    ).then((response) => response.json());
    assert.deepEqual(firstAfterSecondSync, firstFreshness);
    assert.equal(
      secondFreshness.evidenceRevision,
      secondUpdate.evidence.localRevision,
    );
    assert.notEqual(
      secondFreshness.evidenceRevision,
      firstFreshness.evidenceRevision,
    );
  } finally {
    await close(firstServer.server);
  }

  const restarted = await listen();
  try {
    const firstAfterRestart = await fetch(
      `${restarted.baseUrl}/profiles/${first.profileId}/freshness`,
    ).then((response) => response.json());
    const secondAfterRestart = await fetch(
      `${restarted.baseUrl}/profiles/${second.profileId}/freshness`,
    ).then((response) => response.json());
    assert.deepEqual(firstAfterRestart, firstFreshness);
    assert.deepEqual(secondAfterRestart, secondFreshness);
  } finally {
    await close(restarted.server);
  }
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
    const initialHealth = await fetch(`${baseUrl}/health`).then((response) =>
      response.json(),
    );
    assert.equal(initialHealth.analysis, "external-scheduler");
    assert.equal(initialHealth.analysisOwner, "claude-scheduled-task");
    assert.ok(initialHealth.startedAt);
    assert.equal(Object.hasOwn(initialHealth, "lastProfileSyncAt"), false);

    const createResponse = await fetch(`${baseUrl}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: firstVision("Sai") }),
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.match(created.profileId, /^p_/);
    assert.ok(created.accessKey.length > 30);
    const profileFreshness = await fetch(
      `${baseUrl}/profiles/${created.profileId}/freshness`,
    ).then((response) =>
      response.json(),
    );
    assert.ok(profileFreshness.lastSuccessfulPhoneSyncAt);
    assert.equal(profileFreshness.profileId, created.profileId);
    assert.equal(
      profileFreshness.evidenceRevision,
      created.state.evidence.acknowledgedRevision,
    );

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
    assert.match(
      readFileSync(
        join(vaultPath, "Profiles", created.profileId, "Athena Memory.md"),
        "utf8",
      ),
      /# Athena Memory/,
    );

    const circleDate = new Date(Date.now() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    writeFileSync(
      join(vaultPath, "Profiles", created.profileId, "Daily Chapters.md"),
      `---
type: circle-os-daily-chapters
profile_id: ${created.profileId}
date: ${circleDate}
created: ${circleDate}T06:15:00+07:00
---

# Daily Chapters

## Morning

Purpose: Help you notice this morning.

### Page 1
Type: short-text
Question or Information: What feels true right now?
Answer: morning-truth

## Night

Purpose: Help you keep one real moment.

### Page 1
Type: short-text
Question or Information: What happened in that moment?
Answer: night-moment
`,
      "utf8",
    );
    const privateDeckResponse = await fetch(
      `${baseUrl}/profiles/${created.profileId}/chapters`,
      { headers: { Authorization: `Bearer ${created.accessKey}` } },
    );
    assert.equal(privateDeckResponse.status, 200);
    const privateDeck = await privateDeckResponse.json();
    assert.equal(privateDeck.publications.length, 2);
    assert.ok(
      privateDeck.publications.every(
        (publication) =>
          publication.visibility === "private" &&
          publication.audienceProfileId === created.profileId,
      ),
    );

    const recoveryResponse = await fetch(`${baseUrl}/profiles/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: created.profileId }),
    });
    assert.equal(recoveryResponse.status, 200);
    const recovered = await recoveryResponse.json();
    assert.equal(recovered.profileId, created.profileId);
    assert.equal(recovered.state.profile.name, "Sai");
    assert.notEqual(recovered.accessKey, created.accessKey);

    const retiredKey = await fetch(
      `${baseUrl}/profiles/${created.profileId}`,
      { headers: { Authorization: `Bearer ${created.accessKey}` } },
    );
    assert.equal(retiredKey.status, 401);

    const recoveredProfile = await fetch(
      `${baseUrl}/profiles/${created.profileId}`,
      { headers: { Authorization: `Bearer ${recovered.accessKey}` } },
    );
    assert.equal(recoveredProfile.status, 200);
    created.accessKey = recovered.accessKey;

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

    const thoughtState = answerSurveyQuestion(
      refreshedProfile.state,
      { id: "thought-server", text: "A thought I wanted to keep" },
      "I watched Perfect Days.",
      "thought",
    );
    const thoughtResponse = await fetch(
      `${baseUrl}/profiles/${created.profileId}/sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${created.accessKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: thoughtState }),
      },
    );
    assert.equal(thoughtResponse.status, 200);
    const thoughtSynced = await thoughtResponse.json();
    assert.equal(
      thoughtSynced.acknowledgedEvidenceRevision,
      thoughtState.evidence.localRevision,
    );
    assert.deepEqual(
      new Set(thoughtSynced.acknowledgedOutboxIds),
      new Set(thoughtState.outbox.map((item) => item.id)),
    );
    assert.equal(
      thoughtSynced.state.evidence.acknowledgedRevision,
      thoughtState.evidence.localRevision,
    );
    assert.match(
      readFileSync(
        join(vaultPath, "Profiles", created.profileId, "Athena Memory.md"),
        "utf8",
      ),
      /film: Perfect Days — watched/,
    );
    assert.doesNotMatch(
      readFileSync(
        join(vaultPath, "Profiles", second.profileId, "Athena Memory.md"),
        "utf8",
      ),
      /Perfect Days/,
    );

    const suggestionState = queueSuggestion(
      thoughtSynced.state,
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
      /analysis_pending: true/,
    );

    const chapter = {
      schemaVersion: 1,
      id: "quiet-check-in",
      version: 1,
      status: "published",
      session: "check-in",
      theme: "light",
      title: "One quiet question",
      purpose: "Invite one honest answer.",
      estimatedMinutes: 1,
      pages: [
        { id: "cover", type: "cover", title: "Can I ask one thing?" },
        { id: "complete", type: "result", title: "Thank you." },
      ],
    };
    const publishResponse = await fetch(`${baseUrl}/chapters/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${created.accessKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chapter, source: "---\nid: quiet-check-in\n---" }),
    });
    assert.equal(publishResponse.status, 201);
    assert.match(
      readFileSync(
        join(vaultPath, "Chapters", "Published Sources", "quiet-check-in-v1.md"),
        "utf8",
      ),
      /quiet-check-in/,
    );
    const chapterResponse = await fetch(`${baseUrl}/chapters/public`, {
      headers: { Authorization: `Bearer ${created.accessKey}` },
    });
    assert.equal(chapterResponse.status, 200);
    const chapterData = await chapterResponse.json();
    assert.equal(chapterData.chapters[0].id, "quiet-check-in");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(vaultPath, { recursive: true, force: true });
    rmSync(dirname(accessPath), { recursive: true, force: true });
  }
});
