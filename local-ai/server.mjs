import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROFILE_SESSION_KEYS,
  createDay,
  declarationText,
  declarationVersions,
  getDateKey,
  normalizeState,
} from "../app/os/circle-os-model.js";
import {
  mergeAthenaMemory,
  normalizeAthenaMemory,
  serializeAthenaMemoryMarkdown,
} from "../app/os/athena-memory-model.js";
import { deepThoughtSourceLabel } from "../app/os/deep-thought-model.js";
import { parseDailyChaptersMarkdown } from "../scripts/chapter-compiler.mjs";

const profileIdPattern = /^p_[A-Za-z0-9_-]{16}$/;
const chapterIdPattern = /^[a-z0-9][a-z0-9-]*$/;
const sessionLabels = {
  typicalTuesday: "Typical Tuesday",
  currentLife: "Current Life",
  whatMatters: "What Matters",
  interests: "Interests",
  gap: "The Gap",
  missionStatement: "Mission Statement",
  personality: "Personality",
};
const labelToSession = Object.fromEntries(
  Object.entries(sessionLabels).map(([key, label]) => [label, key]),
);

function text(value, maximum = 10_000) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function randomKey(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

function now() {
  return new Date().toISOString();
}

function newest(left, right) {
  return String(left || "").localeCompare(String(right || "")) >= 0
    ? left
    : right;
}

function newerSession(serverSession, phoneSession) {
  if (!serverSession?.text && phoneSession?.text) return phoneSession;
  if (!phoneSession?.text) return serverSession;
  if (
    phoneSession.userEdited &&
    String(phoneSession.updatedAt || "").localeCompare(
      String(serverSession.updatedAt || ""),
    ) >= 0
  ) {
    return phoneSession;
  }
  return serverSession;
}

function mergeAnswers(serverAnswers = [], phoneAnswers = []) {
  const answers = new Map();
  for (const answer of [...serverAnswers, ...phoneAnswers]) {
    if (!answer?.questionId) continue;
    const current = answers.get(answer.questionId);
    if (
      !current ||
      String(answer.answeredAt || "").localeCompare(
        String(current.answeredAt || ""),
      ) >= 0
    ) {
      answers.set(answer.questionId, answer);
    }
  }
  return [...answers.values()].sort((a, b) =>
    String(a.answeredAt || "").localeCompare(String(b.answeredAt || "")),
  );
}

function recordTime(value) {
  return (
    value?.updatedAt ||
    value?.completedAt ||
    value?.createdAt ||
    value?.declaredAt ||
    ""
  );
}

function mergeRecordArrays(serverRecords = [], phoneRecords = [], key = "id") {
  const records = new Map();
  for (const record of [...(serverRecords || []), ...(phoneRecords || [])]) {
    const id = record?.[key];
    if (!id) continue;
    const current = records.get(id);
    if (!current || recordTime(record).localeCompare(recordTime(current)) >= 0) {
      records.set(id, record);
    }
  }
  return [...records.values()];
}

function mergeDays(serverDays, phoneDays) {
  const days = { ...serverDays };
  for (const [date, phoneDay] of Object.entries(phoneDays || {})) {
    const serverDay = serverDays?.[date];
    if (!serverDay) {
      days[date] = phoneDay;
      continue;
    }
    const serverMission = serverDay.mission || {};
    const phoneMission = phoneDay.mission || {};
    const mission = recordTime(phoneMission).localeCompare(recordTime(serverMission)) >= 0
      ? { ...serverMission, ...phoneMission }
      : { ...phoneMission, ...serverMission };
    days[date] = {
      ...serverDay,
      ...phoneDay,
      mission,
      missions: mergeRecordArrays(serverDay.missions, phoneDay.missions),
      checkIns: mergeRecordArrays(serverDay.checkIns, phoneDay.checkIns, "period"),
      timeBlocks: mergeRecordArrays(serverDay.timeBlocks, phoneDay.timeBlocks),
      logRange: phoneDay.logRange ?? serverDay.logRange ?? null,
    };
  }
  return days;
}

function mergeUpdatedRecords(serverRecords = {}, phoneRecords = {}) {
  const records = { ...serverRecords };
  for (const [key, phoneRecord] of Object.entries(phoneRecords || {})) {
    const serverRecord = serverRecords?.[key];
    if (
      !serverRecord ||
      String(phoneRecord?.updatedAt || "").localeCompare(
        String(serverRecord?.updatedAt || ""),
      ) >= 0
    ) {
      records[key] = phoneRecord;
    }
  }
  return records;
}

function mergeChapters(serverChapters, phoneChapters) {
  return {
    runs: mergeUpdatedRecords(
      serverChapters?.runs,
      phoneChapters?.runs,
    ),
    sessions: mergeUpdatedRecords(
      serverChapters?.sessions,
      phoneChapters?.sessions,
    ),
  };
}

export function mergeClientState(serverValue, phoneValue) {
  const phone = normalizeState(phoneValue);
  if (!serverValue) {
    return {
      ...phone,
      ai: {
        ...phone.ai,
        baseUrl: "",
        token: "",
        profileId: "",
      },
      outbox: [],
    };
  }

  const server = normalizeState(serverValue);
  const sessions = Object.fromEntries(
    PROFILE_SESSION_KEYS.map((key) => [
      key,
      newerSession(
        server.profile.profileCase.sessions[key],
        phone.profile.profileCase.sessions[key],
      ),
    ]),
  );
  const visionCompletedAt = newest(
    server.profile.vision.completedAt,
    phone.profile.vision.completedAt,
  );
  const phoneHasNewerVision =
    visionCompletedAt === phone.profile.vision.completedAt;
  const answers = mergeAnswers(
    server.profile.profileCase.survey.answers,
    phone.profile.profileCase.survey.answers,
  );
  const phoneAnsweredNewQuestion =
    phone.profile.profileCase.survey.answers.length >
    server.profile.profileCase.survey.answers.length;

  return normalizeState({
    ...server,
    profile: {
      ...server.profile,
      name: phoneHasNewerVision ? phone.profile.name : server.profile.name,
      age: phoneHasNewerVision ? phone.profile.age : server.profile.age,
      identityFocus:
        phone.profile.identityFocus || server.profile.identityFocus,
      vision: {
        ...server.profile.vision,
        description: phoneHasNewerVision
          ? phone.profile.vision.description
          : server.profile.vision.description,
        preview: sessions.typicalTuesday.text,
        understanding: sessions.whatMatters.text,
        gap: sessions.gap.text,
        completedAt: visionCompletedAt,
      },
      profileCase: {
        ...server.profile.profileCase,
        sessions,
        survey: {
          ...server.profile.profileCase.survey,
          answers,
          nextQuestion: phoneAnsweredNewQuestion
            ? phone.profile.profileCase.survey.nextQuestion
            : server.profile.profileCase.survey.nextQuestion ??
              phone.profile.profileCase.survey.nextQuestion,
        },
      },
    },
    days: mergeDays(server.days, phone.days),
    chapters: mergeChapters(server.chapters, phone.chapters),
    appSessions: mergeUpdatedRecords(
      server.appSessions,
      phone.appSessions,
    ),
    habits: {
      identity:
        String(phone.habits.identity.updatedAt || "").localeCompare(
          String(server.habits.identity.updatedAt || ""),
        ) >= 0
          ? phone.habits.identity
          : server.habits.identity,
      definitions: mergeUpdatedRecords(
        server.habits.definitions,
        phone.habits.definitions,
      ),
      completions: mergeUpdatedRecords(
        server.habits.completions,
        phone.habits.completions,
      ),
    },
    tasks: {
      items: mergeUpdatedRecords(server.tasks.items, phone.tasks.items),
    },
    declarations: {
      records: mergeUpdatedRecords(
        server.declarations.records,
        phone.declarations.records,
      ),
    },
    dreamlines: {
      records: mergeUpdatedRecords(
        server.dreamlines.records,
        phone.dreamlines.records,
      ),
    },
    // A protocol is a container of time and its terms are locked, so a run
    // merges whole by updatedAt. Without this the server copy would win by
    // spread and a protocol started on the phone would vanish on sync.
    protocol: {
      runs: mergeUpdatedRecords(server.protocol?.runs, phone.protocol?.runs),
      completions: mergeUpdatedRecords(
        server.protocol?.completions,
        phone.protocol?.completions,
      ),
      seals: mergeUpdatedRecords(
        server.protocol?.seals,
        phone.protocol?.seals,
      ),
    },
    evidence: {
      localRevision: Math.max(
        Number(server.evidence.localRevision || 0),
        Number(phone.evidence.localRevision || 0),
      ),
      acknowledgedRevision: Math.max(
        Number(server.evidence.acknowledgedRevision || 0),
        Number(phone.evidence.acknowledgedRevision || 0),
      ),
      lastChangedAt: newest(
        server.evidence.lastChangedAt,
        phone.evidence.lastChangedAt,
      ),
      lastAcknowledgedAt: newest(
        server.evidence.lastAcknowledgedAt,
        phone.evidence.lastAcknowledgedAt,
      ),
    },
    athenaMemory: mergeAthenaMemory(
      server.athenaMemory,
      phone.athenaMemory,
    ),
    ai: {
      ...server.ai,
      baseUrl: "",
      token: "",
      profileId: "",
    },
    outbox: [],
  });
}

function markdownText(value, fallback = "Not enough evidence yet.") {
  return text(value) || fallback;
}

function sessionComment(session) {
  return `<!-- user-edited: ${Boolean(session.userEdited)}; confidence: ${Number(
    session.confidence || 0,
  ).toFixed(2)} -->`;
}

function profileMetadata(markdown = "") {
  const block = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const metadata = {};
  if (!block) return metadata;
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^([a-z_]+):\s*(.*)$/);
    if (match) metadata[match[1]] = match[2].trim();
  }
  return metadata;
}

function markdownSections(markdown) {
  const sections = {};
  const matches = [...markdown.matchAll(/^## (.+)\r?\n/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    const heading = matches[index][1].trim();
    const start = matches[index].index + matches[index][0].length;
    const end =
      index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    sections[heading] = markdown.slice(start, end).trim();
  }
  return sections;
}

function parseSession(section, fallback) {
  if (!section) return fallback;
  const comment = section.match(
    /<!--\s*user-edited:\s*(true|false);\s*confidence:\s*([0-9.]+)\s*-->/i,
  );
  return {
    ...fallback,
    text: text(section.replace(/<!--[\s\S]*?-->/g, "")) || fallback.text,
    userEdited: comment ? comment[1].toLowerCase() === "true" : false,
    confidence: comment
      ? Math.max(0, Math.min(1, Number(comment[2]) || 0))
      : fallback.confidence,
  };
}

export function applyProfileMarkdown(stateValue, markdown) {
  const state = normalizeState(stateValue);
  const metadata = profileMetadata(markdown);
  const sections = markdownSections(markdown);
  const sessions = { ...state.profile.profileCase.sessions };
  for (const [label, key] of Object.entries(labelToSession)) {
    sessions[key] = parseSession(sections[label], sessions[key]);
  }
  const questionBlock = sections["Next Question"] || "";
  const questionMeta = questionBlock.match(
    /<!--\s*id:\s*([^;]+);\s*target:\s*([^\s]+)\s*-->/i,
  );
  const questionText = text(questionBlock.replace(/<!--[\s\S]*?-->/g, ""));
  const nextQuestion =
    questionMeta && questionText
      ? {
          id: text(questionMeta[1], 120),
          target: text(questionMeta[2], 80),
          text: questionText,
        }
      : null;
  const deepThoughtBlock = sections["Deep Thought"] || "";
  const deepThoughtMeta = deepThoughtBlock.match(
    /<!--\s*id:\s*([^;]+);\s*target:\s*([^;]+);\s*date:\s*([^;]+);\s*prepared:\s*([^\s]+)\s*-->/i,
  );
  const deepThoughtText = text(deepThoughtBlock.replace(/<!--[\s\S]*?-->/g, ""));
  const deepThoughtPrompt = deepThoughtMeta && deepThoughtText
    ? {
        id: text(deepThoughtMeta[1], 120),
        target: text(deepThoughtMeta[2], 80),
        dateKey: text(deepThoughtMeta[3], 20),
        preparedAt: text(deepThoughtMeta[4], 80),
        text: deepThoughtText,
        source: "athena",
      }
    : state.profile.profileCase.deepThoughtPrompt;
  const analysisPending = metadata.analysis_pending === "true";
  const lastAnalyzed = text(metadata.last_analyzed, 80) || null;
  const dateKey = getDateKey();
  const day = state.days[dateKey] || createDay(dateKey);
  const missionText = text(
    String(sections["Today's Mission"] || "").replace(
      /<!--[\s\S]*?-->/g,
      "",
    ),
    160,
  );

  return normalizeState({
    ...state,
    ai: {
      ...state.ai,
      lastRunAt: lastAnalyzed,
      status: "ready",
    },
    profile: {
      ...state.profile,
      vision: {
        ...state.profile.vision,
        preview: sessions.typicalTuesday.text,
        understanding: sessions.whatMatters.text,
        gap: sessions.gap.text,
      },
      profileCase: {
        ...state.profile.profileCase,
        status: analysisPending ? "waiting" : "ready",
        updatedAt: lastAnalyzed || state.profile.profileCase.updatedAt,
        sessions,
        survey: {
          ...state.profile.profileCase.survey,
          nextQuestion,
        },
        deepThoughtPrompt,
      },
    },
    days: {
      ...state.days,
      [dateKey]: {
        ...day,
        mission: missionText
          ? {
              ...day.mission,
              text: missionText,
              identity: "Yourself",
            }
          : day.mission,
      },
    },
  });
}

function formatAnswers(answers) {
  if (!answers.length) return "";
  return answers
    .map(
      (answer) => `### ${markdownText(answer.question, "Question")}

${markdownText(answer.answer, "No answer.")}

_${answer.kind === "habit" ? "Habit" : answer.kind === "codex" ? "Codex" : answer.kind === "routine" ? "Log setup" : answer.kind === "note" ? "Note" : answer.kind === "deep-thought" ? "Deep Thought" : answer.kind === "thought" ? "Thought" : "Check-in"}${answer.kind === "deep-thought" ? ` · Source: ${deepThoughtSourceLabel(answer.source, answer.questionId)}` : ""} · Answered ${
  answer.answeredAt || "without a date"
}._`,
    )
    .join("\n\n");
}

function formatChapterAnswers(chapters, profileAnswers = []) {
  const knownAnswers = new Set(
    profileAnswers.map((answer) => answer.questionId),
  );
  const runs = Object.values(chapters?.runs || {});
  const lines = runs.flatMap((run) =>
    (run.answers || [])
      .filter((answer) => !knownAnswers.has(answer.answerKey))
      .map(
        (answer) =>
          `### ${markdownText(
            answer.questionSnapshot || answer.answerKey,
            "Chapter answer",
          )}

${markdownText(answer.displaySnapshot || answer.value, "No answer.")}

_${markdownText(run.chapterId, "Chapter")} ${run.chapterVersion} · Answered ${
            answer.answeredAt || "earlier"
          }._`,
      ),
  );
  return lines.length ? lines.join("\n\n") : "";
}

function formatAllAnswers(state) {
  const profileAnswers = state.profile.profileCase.survey.answers;
  return (
    [
      formatAnswers(profileAnswers),
      formatChapterAnswers(state.chapters, profileAnswers),
    ]
      .filter(Boolean)
      .join("\n\n") || "No questions answered yet."
  );
}

const declarationLabels = {
  vision: "Vision",
  missionStatement: "Mission Statement",
  typicalTuesday: "Typical Tuesday",
  dreamline: "Dreamline",
};

function formatDeclarations(state) {
  const blocks = Object.keys(declarationLabels).flatMap((kind) =>
    declarationVersions(state, kind).map((record, index) => {
      const status = index === 0 ? "Current" : "Earlier version";
      const supersedes = record.supersedesId
        ? `; supersedes: ${record.supersedesId}`
        : "";
      const target = record.targetAt ? `; target: ${record.targetAt}` : "";
      return `### ${declarationLabels[kind]} - ${status}

<!-- declaration-id: ${record.id}; declared: ${record.declaredAt}${supersedes}${target} -->

${markdownText(declarationText(record), "No declaration yet.")}`;
    }),
  );
  return blocks.length ? blocks.join("\n\n") : "No declarations yet.";
}

export function serializeProfileMarkdown(
  value,
  {
    profileId = "",
    createdAt = now(),
    updatedAt = now(),
    lastAnalyzed = "",
    analysisPending = true,
  } = {},
) {
  const state = normalizeState(value);
  const profile = state.profile;
  const sessions = profile.profileCase.sessions;
  const question = profile.profileCase.survey.nextQuestion;
  const deepThought = profile.profileCase.deepThoughtPrompt;
  const dateKey = getDateKey();
  const mission = state.days[dateKey]?.mission?.text;
  const sessionBlocks = PROFILE_SESSION_KEYS.map((key) => {
    const session = sessions[key];
    return `## ${sessionLabels[key]}

${sessionComment(session)}

${markdownText(
  session.text,
  key === "personality"
    ? "Codex has not built this draft yet."
    : "Not enough evidence yet.",
)}`;
  }).join("\n\n");
  const nextQuestion = question
    ? `<!-- id: ${question.id}; target: ${question.target} -->

${question.text}`
    : "No question yet.";
  const deepThoughtQuestion = deepThought
    ? `<!-- id: ${deepThought.id}; target: ${deepThought.target}; date: ${deepThought.dateKey}; prepared: ${deepThought.preparedAt} -->\n\n${deepThought.text}`
    : "No deep question yet.";

  return `---
type: circle-os-profile
profile_id: ${profileId}
created: ${createdAt}
updated: ${updatedAt}
last_analyzed: ${lastAnalyzed}
analysis_pending: ${Boolean(analysisPending)}
---

# ${markdownText(profile.name, "Circle OS Profile")}

Age: ${profile.age ?? "Not added"}

${sessionBlocks}

## Declarations

${formatDeclarations(state)}

## Today's Mission

${markdownText(mission, "Notice one moment that feels like you.")}

## Next Question

${nextQuestion}

## Deep Thought

${deepThoughtQuestion}

## Answers

${formatAllAnswers(state)}
`;
}

function formatCheckIns(day) {
  if (!day.checkIns?.length) return "Nothing recorded.";
  return day.checkIns
    .map(
      (checkIn) =>
        `- ${checkIn.period}: energy ${checkIn.energy ?? "not recorded"}${
          checkIn.mood ? `, mood ${checkIn.mood}` : ""
        }`,
    )
    .join("\n");
}

function formatTimeBlocks(day) {
  if (!day.timeBlocks?.length) return "Nothing recorded.";
  return day.timeBlocks
    .map((block) => {
      const moments = (block.moments || [])
        .map((moment) => `\n  - ${markdownText(moment, "")}`)
        .join("");
      return `- ${block.start}-${block.end}: ${markdownText(
        block.title || block.activity,
        "",
      )}${moments}`;
    })
    .join("\n");
}

function circleDateOf(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : getDateKey(date);
}

function formatMissions(day, state = null) {
  const definitions = Object.values(state?.habits?.definitions || {});
  const completions = state?.habits?.completions || {};
  const persistentHabitIds = new Set(definitions.map((habit) => habit.id));
  const persistentTaskIds = new Set(Object.keys(state?.tasks?.items || {}));
  const persistent = [];
  for (const habit of definitions) {
    const completion = completions[`${day.date}:${habit.id}`];
    const createdDate = circleDateOf(habit.createdAt);
    if (
      !habit.text ||
      (habit.status !== "active" && !completion?.completed) ||
      (createdDate && createdDate > day.date)
    ) {
      continue;
    }
    persistent.push({
      text: `Habit: ${habit.text}`,
      completed: Boolean(completion?.completed),
    });
  }
  for (const task of Object.values(state?.tasks?.items || {})) {
    const createdDate = circleDateOf(task.createdAt);
    const completedDate = circleDateOf(task.completedAt);
    if (createdDate !== day.date && completedDate !== day.date) continue;
    persistent.push({
      text: `Task: ${task.text}`,
      completed: completedDate === day.date,
    });
  }
  const legacy = [
    ...(day.mission && !persistentHabitIds.has("legacy-primary-habit")
      ? [day.mission]
      : []),
    ...(day.missions || []).filter(
      (mission) =>
        !persistentHabitIds.has(mission?.id) &&
        !persistentTaskIds.has(mission?.id),
    ),
  ];
  const missions = [...persistent, ...legacy].filter((mission) => mission?.text);
  if (!missions.length) return "No mission yet.";
  return missions
    .map(
      (mission) =>
        `- [${mission.completed ? "x" : " "}] ${markdownText(
          mission.text,
          "Untitled mission",
        )}`,
    )
    .join("\n");
}

export function serializeDayMarkdown(day, state = null) {
  return `---
type: circle-os-day
date: ${day.date}
---

# ${day.date}

## Check-in

${formatCheckIns(day)}

## Mission

${formatMissions(day, state)}

## Day

${formatTimeBlocks(day)}
`;
}

function resolveVaultPath(options = {}) {
  return (
    options.vaultPath ||
    process.env.CIRCLE_OS_VAULT_PATH ||
    "C:\\Brain\\10 Projects\\The Circle\\Circle OS"
  );
}

function resolveAccessPath(options = {}) {
  const localAppData =
    process.env.LOCALAPPDATA || "C:\\Users\\Public\\AppData\\Local";
  return (
    options.accessPath ||
    process.env.CIRCLE_OS_ACCESS_PATH ||
    join(localAppData, "Circle OS", "access.json")
  );
}

function writeAtomic(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.new`;
  writeFileSync(temporary, content, "utf8");
  renameSync(temporary, path);
}

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function profileDirectory(vaultPath, profileId) {
  if (!profileIdPattern.test(profileId)) throw new Error("Invalid profile.");
  return join(vaultPath, "Profiles", profileId);
}

function publishedChapterDirectory(vaultPath) {
  return join(vaultPath, "Chapters", "Published Sources");
}

function publicChapterManifestPath(vaultPath) {
  return join(publishedChapterDirectory(vaultPath), "index.json");
}

function readPublicChapterManifest(vaultPath) {
  const manifest = readJson(publicChapterManifestPath(vaultPath), {
    version: 1,
    updatedAt: "",
    chapters: [],
  });
  return {
    version: 1,
    updatedAt: text(manifest?.updatedAt, 80),
    chapters: Array.isArray(manifest?.chapters) ? manifest.chapters : [],
  };
}

export function readProfileChapterPublications(
  vaultPath,
  profileId,
  at = new Date(),
) {
  const dailyPath = join(
    profileDirectory(vaultPath, profileId),
    "Daily Chapters.md",
  );
  if (!existsSync(dailyPath)) return [];
  const parsed = parseDailyChaptersMarkdown(
    readFileSync(dailyPath, "utf8"),
    dailyPath,
  );
  if (parsed.profileId !== profileId) {
    throw new Error("Daily Chapters.md belongs to another profile.");
  }
  const publishedAt = statSync(dailyPath).mtime.toISOString();
  return parsed.chapters
    .filter((chapter) => new Date(chapter.expiresAt) > at)
    .map((chapter) => ({
      chapter,
      targetApp: "note",
      audienceProfileId: profileId,
      visibility: "private",
      delivery: "on-view",
      source: "athena",
      publishedAt,
    }));
}

function validPublishedChapter(chapter) {
  return Boolean(
    chapter &&
      chapter.schemaVersion === 1 &&
      chapter.status === "published" &&
      chapterIdPattern.test(chapter.id || "") &&
      Number.isInteger(chapter.version) &&
      chapter.version > 0 &&
      chapter.session === "check-in" &&
      Array.isArray(chapter.pages) &&
      chapter.pages.length >= 2 &&
      chapter.pages[0]?.type === "cover" &&
      ["confirm", "result"].includes(chapter.pages.at(-1)?.type),
  );
}

function publishChapter(vaultPath, chapter, source) {
  if (!validPublishedChapter(chapter)) {
    throw new Error("Only a valid Check-in chapter can be published here.");
  }
  const cleanSource = text(source, 200_000);
  if (!cleanSource) throw new Error("The chapter source is empty.");
  const directory = publishedChapterDirectory(vaultPath);
  const sourcePath = join(directory, `${chapter.id}-v${chapter.version}.md`);
  if (existsSync(sourcePath)) {
    const existing = readFileSync(sourcePath, "utf8").trim();
    if (existing !== cleanSource) {
      throw new Error("That chapter version already exists. Create a new version.");
    }
  } else {
    writeAtomic(sourcePath, `${cleanSource}\n`);
  }
  const manifest = readPublicChapterManifest(vaultPath);
  const key = `${chapter.id}:v${chapter.version}`;
  const chapters = [
    ...manifest.chapters.filter(
      (item) => `${item?.id}:v${item?.version}` !== key,
    ),
    chapter,
  ].sort((left, right) =>
    `${left.id}:v${left.version}`.localeCompare(`${right.id}:v${right.version}`),
  );
  writeAtomic(
    publicChapterManifestPath(vaultPath),
    `${JSON.stringify({ version: 1, updatedAt: now(), chapters }, null, 2)}\n`,
  );
  return chapter;
}

function readProfileState(vaultPath, profileId) {
  const directory = profileDirectory(vaultPath, profileId);
  const statePath = join(directory, "State.json");
  if (!existsSync(statePath)) return null;
  let state = normalizeState(readJson(statePath));
  const profilePath = join(directory, "Profile.md");
  if (existsSync(profilePath)) {
    state = applyProfileMarkdown(
      state,
      readFileSync(profilePath, "utf8"),
    );
  }
  const athenaMemoryPath = join(directory, "Athena Memory.json");
  if (existsSync(athenaMemoryPath)) {
    state = {
      ...state,
      athenaMemory: mergeAthenaMemory(
        state.athenaMemory,
        readJson(athenaMemoryPath),
      ),
    };
  }
  return state;
}

function readExistingMetadata(vaultPath, profileId) {
  const path = join(profileDirectory(vaultPath, profileId), "Profile.md");
  if (!existsSync(path)) return {};
  return profileMetadata(readFileSync(path, "utf8"));
}

function saveProfileState(
  vaultPath,
  profileId,
  value,
  { analysisPending = true } = {},
) {
  const directory = profileDirectory(vaultPath, profileId);
  const metadata = readExistingMetadata(vaultPath, profileId);
  const state = normalizeState(value);
  state.ai = {
    ...state.ai,
    baseUrl: "",
    token: "",
    profileId: "",
  };
  state.outbox = [];
  writeAtomic(
    join(directory, "State.json"),
    `${JSON.stringify(state, null, 2)}\n`,
  );
  writeAtomic(
    join(directory, "Profile.md"),
    serializeProfileMarkdown(state, {
      profileId,
      createdAt: metadata.created || now(),
      updatedAt: now(),
      lastAnalyzed: metadata.last_analyzed || "",
      analysisPending,
    }),
  );
  const athenaMemory = normalizeAthenaMemory(state.athenaMemory);
  writeAtomic(
    join(directory, "Athena Memory.json"),
    `${JSON.stringify(athenaMemory, null, 2)}\n`,
  );
  writeAtomic(
    join(directory, "Athena Memory.md"),
    serializeAthenaMemoryMarkdown(athenaMemory, profileId),
  );
  mkdirSync(join(directory, "Days"), { recursive: true });
  for (const day of Object.values(state.days)) {
    writeAtomic(
      join(directory, "Days", `${day.date}.md`),
      serializeDayMarkdown(day, state),
    );
  }
  return state;
}

function profileIds(vaultPath) {
  const profilesPath = join(vaultPath, "Profiles");
  if (!existsSync(profilesPath)) return [];
  return readdirSync(profilesPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && profileIdPattern.test(entry.name))
    .map((entry) => entry.name);
}

function writeIndex(vaultPath) {
  const rows = profileIds(vaultPath).map((profileId) => {
    const state = readProfileState(vaultPath, profileId);
    const metadata = readExistingMetadata(vaultPath, profileId);
    return `- [[Profiles/${profileId}/Profile|${state?.profile?.name || profileId}]] — ${
      metadata.analysis_pending === "true" ? "waiting" : "ready"
    }`;
  });
  writeAtomic(
    join(vaultPath, "Profiles.md"),
    `# Circle OS Profiles

${rows.length ? rows.join("\n") : "No profiles yet."}
`,
  );
}

function saveSuggestions(vaultPath, profileId, state, outbox = []) {
  const suggestions = outbox.filter(
    (item) =>
      item?.reason === "suggestion" &&
      text(item.id, 120) &&
      text(item.message, 800),
  );
  if (!suggestions.length) return;

  const path = join(vaultPath, "Suggestions.md");
  let markdown = existsSync(path)
    ? readFileSync(path, "utf8")
    : `# Circle OS Suggestions

Ideas sent from the Suggestion app. Review here before deciding what to build.
`;
  for (const item of suggestions) {
    const id = text(item.id, 120);
    if (markdown.includes(`<!-- suggestion-id: ${id} -->`)) continue;
    markdown += `

## ${text(item.createdAt, 80) || now()}

<!-- suggestion-id: ${id} -->

From: ${markdownText(state.profile.name, profileId)}

${text(item.message, 800)}
`;
  }
  writeAtomic(path, `${markdown.trim()}\n`);
}

function legacyProof(value) {
  const state = normalizeState(value);
  return hash(
    [
      state.profile.name,
      state.profile.age,
      state.profile.vision.description,
      state.profile.vision.completedAt,
    ].join("|"),
  );
}

function allowedOrigins() {
  const configured =
    process.env.CIRCLE_AI_ORIGINS ||
    [
      "https://the-circle-rebrand.saisaisainoung.chatgpt.site",
      "https://the-lemon-nu.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
    ].join(",");
  return new Set(
    configured
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (origin && allowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return headers;
}

function json(response, status, body, origin) {
  response.writeHead(status, corsHeaders(origin));
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 500_000) throw new Error("Request is too large.");
  }
  return JSON.parse(body || "{}");
}

function bearer(request) {
  const value = String(request.headers.authorization || "");
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

export function createCircleAiServer(options = {}) {
  const vaultPath = resolveVaultPath(options);
  const accessPath = resolveAccessPath(options);
  const maxProfiles = Number(process.env.CIRCLE_OS_MAX_PROFILES || 25);
  const startedAt = now();
  mkdirSync(join(vaultPath, "Profiles"), { recursive: true });
  mkdirSync(dirname(accessPath), { recursive: true });
  let access = readJson(accessPath, {});

  function saveAccess() {
    writeAtomic(accessPath, `${JSON.stringify(access, null, 2)}\n`);
  }

  function profileSyncFreshness(profileId) {
    const entry = access[profileId];
    if (!entry) return null;
    const storedState = readProfileState(vaultPath, profileId);
    if (!storedState) return null;
    return {
      profileId,
      lastSuccessfulPhoneSyncAt: entry.lastSyncAt || null,
      evidenceRevision: Number(
        entry.lastEvidenceRevision ??
          storedState?.evidence?.acknowledgedRevision ??
          0,
      ),
    };
  }

  function recordProfileSync(profileId, evidenceRevision) {
    access[profileId] = {
      ...access[profileId],
      lastSyncAt: now(),
      lastEvidenceRevision: Number(evidenceRevision || 0),
    };
    saveAccess();
  }

  function migrateLegacy() {
    const legacyPath = join(vaultPath, "State.json");
    if (!existsSync(legacyPath)) return;
    const legacy = normalizeState(readJson(legacyPath));
    if (!legacy.profile.vision.completedAt) return;
    const proof = legacyProof(legacy);
    const existing = Object.entries(access).find(
      ([, value]) => value.legacyProofHash === proof,
    );
    if (existing) return;
    const profileId = `p_${randomKey(12)}`;
    saveProfileState(vaultPath, profileId, legacy, {
      analysisPending: true,
    });
    access[profileId] = {
      keyHash: "",
      legacyProofHash: proof,
      createdAt: now(),
    };
    saveAccess();
    writeIndex(vaultPath);
  }

  // A profile may hold more than one key so the same person can open it on a
  // second device without knocking the first one off. Recovery still replaces
  // every key, because that case means a phone was lost.
  function keyHashes(entry) {
    if (!entry) return [];
    const extra = Array.isArray(entry.extraKeyHashes) ? entry.extraKeyHashes : [];
    return [entry.keyHash, ...extra].filter(Boolean);
  }

  function authorizedProfile(request, profileId) {
    const key = bearer(request);
    return Boolean(key && keyHashes(access[profileId]).includes(hash(key)));
  }

  function authorizedPublisher(request) {
    const key = bearer(request);
    return Boolean(
      key && Object.values(access).some((entry) => keyHashes(entry).includes(hash(key))),
    );
  }

  function publicState(state) {
    return {
      ...state,
      ai: {
        ...state.ai,
        baseUrl: "",
        token: "",
        profileId: "",
      },
      outbox: [],
    };
  }

  migrateLegacy();

  return createServer(async (request, response) => {
    const origin = request.headers.origin || "";
    if (origin && !allowedOrigins().has(origin)) {
      json(response, 403, { error: "This app is not allowed." }, origin);
      return;
    }
    if (request.method === "OPTIONS") {
      response.writeHead(204, corsHeaders(origin));
      response.end();
      return;
    }

    try {
      if (request.method === "GET" && request.url === "/health") {
        json(
          response,
          200,
          {
            ok: true,
            analysis: "external-scheduler",
            analysisOwner: "claude-scheduled-task",
            startedAt,
            storesData: true,
          },
          origin,
        );
        return;
      }

      if (request.method === "POST" && request.url === "/profiles") {
        const input = await readBody(request);
        const phoneState = normalizeState(input.state);
        if (
          !phoneState.profile.name ||
          !phoneState.profile.age
        ) {
          json(response, 400, { error: "Finish the first step first." }, origin);
          return;
        }

        const proof = legacyProof(phoneState);
        const legacy = Object.entries(access).find(
          ([, value]) =>
            value.legacyProofHash === proof && !value.keyHash,
        );
        let profileId;
        if (legacy) {
          profileId = legacy[0];
        } else {
          if (profileIds(vaultPath).length >= maxProfiles) {
            json(response, 429, { error: "Profile limit reached." }, origin);
            return;
          }
          profileId = `p_${randomKey(12)}`;
          saveProfileState(vaultPath, profileId, phoneState, {
            analysisPending: true,
          });
          access[profileId] = {
            keyHash: "",
            createdAt: now(),
          };
        }

        const accessKey = randomKey(32);
        access[profileId].keyHash = hash(accessKey);
        delete access[profileId].legacyProofHash;
        const state = mergeClientState(
          readProfileState(vaultPath, profileId),
          phoneState,
        );
        const acknowledgedOutboxIds = Array.isArray(input?.state?.outbox)
          ? input.state.outbox.map((item) => item?.id).filter(Boolean)
          : [];
        const acknowledgedEvidenceRevision = Number(
          input?.state?.evidence?.localRevision || 0,
        );
        state.evidence = {
          ...state.evidence,
          acknowledgedRevision: acknowledgedEvidenceRevision,
          lastAcknowledgedAt: now(),
        };
        saveSuggestions(vaultPath, profileId, state, input?.state?.outbox);
        const saved = saveProfileState(vaultPath, profileId, state, {
          analysisPending: true,
        });
        writeIndex(vaultPath);
        recordProfileSync(profileId, acknowledgedEvidenceRevision);
        json(
          response,
          201,
          {
            profileId,
            accessKey,
            state: publicState(saved),
            acknowledgedEvidenceRevision,
            acknowledgedOutboxIds,
          },
          origin,
        );
        return;
      }

      if (request.method === "POST" && request.url === "/profiles/recover") {
        const input = await readBody(request);
        const profileId =
          typeof input.profileId === "string" ? input.profileId.trim() : "";
        if (!profileIdPattern.test(profileId)) {
          json(
            response,
            400,
            { error: "That recovery code is not valid." },
            origin,
          );
          return;
        }
        const state = readProfileState(vaultPath, profileId);
        if (!state || !access[profileId]) {
          json(
            response,
            404,
            { error: "That recovery code was not found." },
            origin,
          );
          return;
        }
        const accessKey = randomKey(32);
        access[profileId].keyHash = hash(accessKey);
        // Recovery means the earlier device is gone, so every other key it
        // handed out stops working too.
        access[profileId].extraKeyHashes = [];
        access[profileId].recoveredAt = now();
        saveAccess();
        json(
          response,
          200,
          {
            profileId,
            accessKey,
            state: publicState(state),
          },
          origin,
        );
        return;
      }

      if (request.url === "/chapters/public") {
        if (!authorizedPublisher(request)) {
          json(response, 401, { error: "This profile key is not valid." }, origin);
          return;
        }
        if (request.method === "GET") {
          const manifest = readPublicChapterManifest(vaultPath);
          json(response, 200, { chapters: manifest.chapters }, origin);
          return;
        }
      }

      if (request.method === "POST" && request.url === "/chapters/publish") {
        if (!authorizedPublisher(request)) {
          json(response, 401, { error: "This profile key is not valid." }, origin);
          return;
        }
        const input = await readBody(request);
        const chapter = publishChapter(vaultPath, input.chapter, input.source);
        json(response, 201, { chapter }, origin);
        return;
      }

      const freshnessMatch = request.url?.match(
        /^\/profiles\/(p_[A-Za-z0-9_-]{16})\/freshness$/,
      );
      if (request.method === "GET" && freshnessMatch) {
        const freshness = profileSyncFreshness(freshnessMatch[1]);
        if (!freshness) {
          json(response, 404, { error: "Profile not found." }, origin);
          return;
        }
        json(response, 200, { ok: true, ...freshness }, origin);
        return;
      }

      const profileMatch = request.url?.match(
        /^\/profiles\/(p_[A-Za-z0-9_-]{16})(?:\/(sync|attach|chapters))?$/,
      );
      if (profileMatch) {
        const profileId = profileMatch[1];
        if (!authorizedProfile(request, profileId)) {
          json(response, 401, { error: "This profile key is not valid." }, origin);
          return;
        }
        // Hand an additional key to a second device. Unlike recovery this keeps
        // every existing key working, so a test build can read the real profile
        // while the everyday phone stays connected. It needs a key already, so
        // knowing the profile id alone is not enough to attach.
        if (request.method === "POST" && profileMatch[2] === "attach") {
          const state = readProfileState(vaultPath, profileId);
          if (!state) {
            json(response, 404, { error: "Profile not found." }, origin);
            return;
          }
          const entry = access[profileId];
          const extra = Array.isArray(entry.extraKeyHashes)
            ? entry.extraKeyHashes
            : [];
          if (extra.length >= 4) {
            json(
              response,
              429,
              { error: "This profile already has the most devices it allows." },
              origin,
            );
            return;
          }
          const accessKey = randomKey(32);
          entry.extraKeyHashes = [...extra, hash(accessKey)];
          entry.attachedAt = now();
          saveAccess();
          json(
            response,
            201,
            { profileId, accessKey, state: publicState(state) },
            origin,
          );
          return;
        }
        if (request.method === "GET" && profileMatch[2] === "chapters") {
          json(
            response,
            200,
            {
              publications: readProfileChapterPublications(
                vaultPath,
                profileId,
              ),
            },
            origin,
          );
          return;
        }
        if (request.method === "GET" && !profileMatch[2]) {
          const state = readProfileState(vaultPath, profileId);
          if (!state) {
            json(response, 404, { error: "Profile not found." }, origin);
            return;
          }
          json(response, 200, { state: publicState(state) }, origin);
          return;
        }
        if (request.method === "POST" && profileMatch[2] === "sync") {
          const input = await readBody(request);
          const current = readProfileState(vaultPath, profileId);
          if (!current) {
            json(response, 404, { error: "Profile not found." }, origin);
            return;
          }
          const profileOutbox = Array.isArray(input?.state?.outbox)
            ? input.state.outbox.filter(
                (item) => item?.reason !== "suggestion",
              )
            : [];
          const pending = profileOutbox.length > 0;
          const acknowledgedOutboxIds = Array.isArray(input?.state?.outbox)
            ? input.state.outbox.map((item) => item?.id).filter(Boolean)
            : [];
          const acknowledgedEvidenceRevision = Number(
            input?.state?.evidence?.localRevision || 0,
          );
          const merged = mergeClientState(current, input.state);
          saveSuggestions(
            vaultPath,
            profileId,
            merged,
            input?.state?.outbox,
          );
          merged.profile.profileCase.status = pending
            ? "waiting"
            : current.profile.profileCase.status;
          merged.evidence = {
            ...merged.evidence,
            acknowledgedRevision: Math.max(
              Number(merged.evidence?.acknowledgedRevision || 0),
              acknowledgedEvidenceRevision,
            ),
            lastAcknowledgedAt: now(),
          };
          if (pending) {
            merged.athenaMemory = {
              ...merged.athenaMemory,
              lastEvidenceAt: newest(
                merged.athenaMemory?.lastEvidenceAt,
                input?.state?.evidence?.lastChangedAt || now(),
              ),
            };
          }
          const saved = saveProfileState(vaultPath, profileId, merged, {
            analysisPending:
              pending ||
              readExistingMetadata(vaultPath, profileId).analysis_pending ===
                "true",
          });
          writeIndex(vaultPath);
          recordProfileSync(profileId, acknowledgedEvidenceRevision);
          json(response, 200, {
            state: publicState(saved),
            acknowledgedEvidenceRevision,
            acknowledgedOutboxIds,
          }, origin);
          return;
        }
      }

      json(response, 404, { error: "Not found." }, origin);
    } catch (error) {
      json(
        response,
        503,
        {
          error:
            error instanceof Error ? error.message : "The profile server is offline.",
        },
        origin,
      );
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.CIRCLE_AI_PORT || 4317);
  createCircleAiServer().listen(port, "127.0.0.1", () => {
    console.log(`Circle OS profiles are ready on http://127.0.0.1:${port}`);
  });
}
