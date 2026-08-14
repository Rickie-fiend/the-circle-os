import {
  captureAthenaThought,
  createAthenaMemory,
  forgetAthenaEvidence as forgetDerivedAthenaEvidence,
  mergeAthenaMemory,
  normalizeAthenaMemory,
} from "./athena-memory-model.js";
import { mergeSeenLines, rememberLine } from "./lines/line-pool.js";

export const CIRCLE_OS_STORAGE_KEY = "circle-os-state-v2";
export const CIRCLE_OS_LEGACY_STORAGE_KEY = "circle-os-state-v1";

export const DECLARATION_KINDS = Object.freeze([
  "vision",
  "missionStatement",
  "typicalTuesday",
  "dreamline",
]);

export const PROFILE_SESSION_KEYS = [
  "typicalTuesday",
  "currentLife",
  "whatMatters",
  "interests",
  "gap",
  "missionStatement",
  "personality",
];

export const CIRCLE_OS_SERVER_URL = "https://spectre.taild640fa.ts.net";
export const CIRCLE_DAY_START_HOUR = 6;

export const PROFILE_QUESTIONS = [
  {
    id: "profile-self",
    text: "When do you feel most like yourself?",
    type: "choice",
    options: ["Alone", "With people", "Making something", "Moving"],
    target: "personality",
  },
  {
    id: "profile-own-days",
    text: "How much do your days feel like your own?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not mine",
    maxLabel: "Fully mine",
    target: "currentLife",
  },
  {
    id: "profile-look-forward",
    text: "Do you usually wake up with something to look forward to?",
    type: "yesno",
    target: "currentLife",
  },
  {
    id: "profile-energy-cost",
    text: "What takes most of your energy right now?",
    type: "text",
    placeholder: "Say it in your own words",
    target: "currentLife",
  },
  {
    id: "profile-needs-care",
    text: "What part of life needs the most care?",
    type: "choice",
    options: ["Body", "Work", "Relationships", "Inner life"],
    target: "gap",
  },
  {
    id: "profile-connection",
    text: "How connected do you feel to people close to you?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Far away",
    maxLabel: "Very close",
    target: "currentLife",
  },
  {
    id: "profile-enjoyment-time",
    text: "Do you make time for things you enjoy?",
    type: "yesno",
    target: "currentLife",
  },
  {
    id: "profile-proud",
    text: "What are you proud of in your life today?",
    type: "text",
    placeholder: "One honest thing is enough",
    target: "whatMatters",
  },
  {
    id: "profile-more-of",
    text: "What do you want more of in an ordinary week?",
    type: "text",
    placeholder: "What would feel good to have more often?",
    target: "whatMatters",
  },
  {
    id: "profile-meaningful-week",
    text: "What would make this week feel meaningful?",
    type: "text",
    placeholder: "One sentence is enough",
    target: "missionStatement",
  },
];

export const HABIT_QUESTIONS = [
  {
    id: "habit-area",
    text: "What part of your life do you want to change first?",
    type: "choice",
    options: ["Body", "Work", "Mind", "Relationships", "Home"],
    target: "habits",
  },
  {
    id: "habit-identity",
    text: "Who do you want to become there?",
    type: "text",
    placeholder: "For example: someone who keeps promises to myself",
    target: "habits",
  },
  {
    id: "habit-action",
    text: "What small action would prove that today?",
    type: "text",
    placeholder: "Keep it small enough to do today",
    target: "habits",
  },
];

export const LOG_SETUP_QUESTIONS = [
  {
    id: "routine-wake",
    text: "When do you usually wake up?",
    type: "time",
    defaultValue: "07:00",
    target: "currentLife",
  },
  {
    id: "routine-sleep",
    text: "When do you usually go to sleep?",
    type: "time",
    defaultValue: "00:00",
    target: "currentLife",
  },
];

const DAY_PERIODS = [
  { id: "morning", label: "Morning" },
  { id: "midday", label: "Midday" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

const DEFAULT_MISSION = {
  text: "Do one small thing that feels like you.",
  why: "A fulfilled day does not need to look impressive.",
  identity: "Yourself",
  completed: false,
  completedAt: null,
  updatedAt: null,
};

function recordTimestamp(value) {
  return (
    value?.updatedAt ||
    value?.completedAt ||
    value?.createdAt ||
    value?.declaredAt ||
    ""
  );
}

function mergeRecordMaps(left = {}, right = {}) {
  const records = { ...left };
  for (const [id, candidate] of Object.entries(right || {})) {
    const existing = records[id];
    if (
      !existing ||
      String(recordTimestamp(candidate)).localeCompare(
        String(recordTimestamp(existing)),
      ) >= 0
    ) {
      records[id] = candidate;
    }
  }
  return records;
}

function cleanHabitPart(value, maximum = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maximum);
}

export function composeHabitText({ action = "", cue = "", identity = "" } = {}) {
  const cleanAction = cleanHabitPart(action);
  const cleanCue = cleanHabitPart(cue);
  const cleanIdentity = cleanHabitPart(identity);
  if (!cleanCue && !cleanIdentity) return cleanAction;
  if (!cleanAction) return "";
  return `I will ${cleanAction}${cleanCue ? `, ${cleanCue}` : ""}${
    cleanIdentity ? `${cleanCue ? "," : ""} so I can become ${cleanIdentity}` : ""
  }.`;
}

export function habitActionText(habit) {
  const action = cleanHabitPart(habit?.action || habit?.text);
  const cue = cleanHabitPart(habit?.cue);
  return [action, cue].filter(Boolean).join(" ");
}

export function habitRowText(habit, completed) {
  const identity = cleanHabitPart(habit?.identity);
  return completed && identity ? identity : habitActionText(habit);
}

function normalizeHabitDefinitions(definitions) {
  return Object.fromEntries(
    Object.entries(definitions || {}).map(([id, definition]) => {
      const text = cleanHabitPart(definition?.text);
      const action = cleanHabitPart(
        definition && Object.hasOwn(definition, "action")
          ? definition.action
          : text,
      );
      return [
        id,
        {
          ...definition,
          id: definition?.id || id,
          text: text || composeHabitText({
            action,
            cue: definition?.cue,
            identity: definition?.identity,
          }),
          action,
          cue: cleanHabitPart(definition?.cue),
          identity: cleanHabitPart(definition?.identity),
        },
      ];
    }),
  );
}

export function habitCompletionId(habitId, dateKey) {
  return `${dateKey}:${habitId}`;
}

function migrateDailyPractice(days) {
  const definitions = {};
  const completions = {};
  const tasks = {};
  for (const dateKey of Object.keys(days).sort()) {
    const day = days[dateKey];
    const primary = day?.mission;
    if (primary?.text?.trim() && primary.updatedAt) {
      const id = "legacy-primary-habit";
      definitions[id] = {
        id,
        text: primary.text.trim(),
        status: "active",
        createdAt: definitions[id]?.createdAt || primary.updatedAt,
        updatedAt: primary.updatedAt,
      };
      if (primary.completed) {
        const completionId = habitCompletionId(id, dateKey);
        completions[completionId] = {
          id: completionId,
          habitId: id,
          dateKey,
          completed: true,
          completedAt: primary.completedAt || primary.updatedAt,
          updatedAt: primary.completedAt || primary.updatedAt,
        };
      }
    }
    for (const legacy of day?.missions || []) {
      if (!legacy?.id || !legacy.text?.trim()) continue;
      const updatedAt = legacy.updatedAt || legacy.completedAt || legacy.createdAt;
      if (legacy.kind === "habit") {
        definitions[legacy.id] = {
          id: legacy.id,
          text: legacy.text.trim(),
          status: "active",
          createdAt: definitions[legacy.id]?.createdAt || legacy.createdAt || updatedAt,
          updatedAt,
        };
        if (legacy.completed) {
          const completionId = habitCompletionId(legacy.id, dateKey);
          completions[completionId] = {
            id: completionId,
            habitId: legacy.id,
            dateKey,
            completed: true,
            completedAt: legacy.completedAt || updatedAt,
            updatedAt: legacy.completedAt || updatedAt,
          };
        }
      } else {
        tasks[legacy.id] = {
          id: legacy.id,
          text: legacy.text.trim(),
          status: legacy.completed ? "completed" : "open",
          createdAt: legacy.createdAt || updatedAt,
          updatedAt,
          completedAt: legacy.completedAt || null,
        };
      }
    }
  }
  return { definitions, completions, tasks };
}

function createProfileSession(text = "", confidence = 0) {
  return {
    text,
    confidence,
    userEdited: false,
    updatedAt: null,
  };
}

function createProfileCase() {
  return {
    status: "waiting",
    updatedAt: null,
    sessions: {
      typicalTuesday: createProfileSession(),
      currentLife: createProfileSession(
        "There is not enough of your real life recorded yet.",
      ),
      whatMatters: createProfileSession(
        "This is still unclear. Your check-ins will help.",
      ),
      interests: createProfileSession(
        "Your interests will become clearer from your words and days.",
      ),
      gap: createProfileSession(
        "There is not enough evidence to describe the gap yet.",
      ),
      missionStatement: createProfileSession(
        "Live in a way that feels honest, present, and like your own life.",
      ),
      personality: createProfileSession(),
    },
    survey: {
      answers: [],
      nextQuestion: null,
    },
    deepThoughtPrompt: null,
  };
}

function normalizeDeclarationContent(kind, value = {}) {
  const content = value && typeof value === "object" ? value : {};
  const clean = (field, maximum = 1600) =>
    typeof content[field] === "string"
      ? content[field].trim().slice(0, maximum)
      : "";
  if (kind === "vision") {
    return { life: clean("life"), why: clean("why") };
  }
  if (kind === "missionStatement") {
    return { statement: clean("statement", 320) };
  }
  if (kind === "typicalTuesday") {
    return {
      wake: clean("wake", 600),
      morning: clean("morning", 600),
      day: clean("day", 600),
      people: clean("people", 600),
      evening: clean("evening", 600),
      feeling: clean("feeling", 600),
    };
  }
  if (kind === "dreamline") {
    return {
      dream: clean("dream"),
      now: clean("now", 320),
      tomorrow: clean("tomorrow", 320),
      dayAfter: clean("dayAfter", 320),
    };
  }
  return {};
}

function declarationHasContent(kind, content) {
  if (kind === "vision") return Boolean(content.life && content.why);
  if (kind === "missionStatement") return Boolean(content.statement);
  if (kind === "typicalTuesday") {
    return Boolean(
      content.wake &&
        content.morning &&
        content.day &&
        content.people &&
        content.evening &&
        content.feeling,
    );
  }
  if (kind === "dreamline") {
    return Boolean(
      content.dream && content.now && content.tomorrow && content.dayAfter,
    );
  }
  return false;
}

function sixMonthsAfter(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMonth(date.getUTCMonth() + 6);
  return date.toISOString();
}

function normalizeDeclarations(value) {
  const records = {};
  for (const [key, candidate] of Object.entries(value?.records || {})) {
    if (!candidate || !DECLARATION_KINDS.includes(candidate.kind)) continue;
    const content = normalizeDeclarationContent(candidate.kind, candidate.content);
    if (!declarationHasContent(candidate.kind, content)) continue;
    const declaredAt =
      typeof candidate.declaredAt === "string" &&
      !Number.isNaN(new Date(candidate.declaredAt).getTime())
        ? candidate.declaredAt
        : null;
    if (!declaredAt) continue;
    const id = String(candidate.id || key).trim();
    if (!id) continue;
    records[id] = {
      id,
      kind: candidate.kind,
      content,
      declaredAt,
      supersedesId:
        typeof candidate.supersedesId === "string" && candidate.supersedesId
          ? candidate.supersedesId
          : null,
      ...(candidate.kind === "dreamline"
        ? { targetAt: candidate.targetAt || sixMonthsAfter(declaredAt) }
        : {}),
    };
  }
  return { records };
}

export function createEmptyState() {
  return {
    version: 6,
    ai: {
      baseUrl: CIRCLE_OS_SERVER_URL,
      token: "",
      profileId: "",
      status: "not-connected",
      lastError: "",
      lastRunAt: null,
      lastSyncedAt: null,
      lastSyncSlot: "",
    },
    profile: {
      identityFocus: "Yourself",
      name: "",
      age: null,
      vision: {
        description: "",
        preview: "",
        understanding: "",
        gap: "",
        completedAt: null,
      },
      profileCase: createProfileCase(),
    },
    days: {},
    chapters: {
      runs: {},
      sessions: {},
    },
    appSessions: {},
    habits: {
      identity: {
        text: "",
        updatedAt: null,
      },
      definitions: {},
      completions: {},
    },
    tasks: {
      items: {},
    },
    declarations: {
      records: {},
    },
    protocol: {
      runs: {},
      completions: {},
      seals: {},
    },
    evidence: {
      localRevision: 0,
      acknowledgedRevision: 0,
      lastChangedAt: null,
      lastAcknowledgedAt: null,
    },
    athenaMemory: createAthenaMemory(),
    // Which lines have been read lately, newest first. A line is not a chapter:
    // there is no run to record, only enough memory to keep the pool rotating.
    seenLines: [],
    outbox: [],
  };
}

export function normalizeState(state) {
  const empty = createEmptyState();
  if (!state || !state.days || !state.profile) {
    return empty;
  }

  const oldTuesday = state.profile.typicalTuesday;
  const oldDescription =
    oldTuesday && typeof oldTuesday === "object"
      ? [
          oldTuesday.wakeUp,
          oldTuesday.morning,
          oldTuesday.day,
          oldTuesday.people,
          oldTuesday.evening,
          oldTuesday.feeling,
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const description =
    state.profile.vision?.description ||
    (typeof oldTuesday === "string" ? oldTuesday : oldDescription);

  const storedCase = state.profile.profileCase;
  const fallbackCase = createProfileCase();
  const sessions = Object.fromEntries(
    PROFILE_SESSION_KEYS.map((key) => [
      key,
      {
        ...fallbackCase.sessions[key],
        ...(storedCase?.sessions?.[key] ?? {}),
      },
    ]),
  );
  const days = Object.fromEntries(
    Object.entries(state.days).map(([dateKey, day]) => [
      dateKey,
      {
        ...createDay(dateKey),
        ...day,
        mission: {
          ...DEFAULT_MISSION,
          ...(day?.mission || {}),
        },
        missions: Array.isArray(day?.missions)
          ? day.missions.map((mission) =>
              mission?.kind !== "habit" &&
              !mission?.completed &&
              mission?.text === "New mission"
                ? { ...mission, text: "" }
                : mission,
            )
          : [],
        checkIns: Array.isArray(day?.checkIns) ? day.checkIns : [],
        timeBlocks: Array.isArray(day?.timeBlocks) ? day.timeBlocks : [],
      },
    ]),
  );
  const migratedPractice = migrateDailyPractice(days);
  const storedHabitDefinitions =
    state.habits?.definitions && typeof state.habits.definitions === "object"
      ? state.habits.definitions
      : {};
  const storedHabitCompletions =
    state.habits?.completions && typeof state.habits.completions === "object"
      ? state.habits.completions
      : {};
  const storedHabitIdentity =
    state.habits?.identity && typeof state.habits.identity === "object"
      ? {
          text: String(state.habits.identity.text || "").slice(0, 60),
          updatedAt: state.habits.identity.updatedAt || null,
        }
      : empty.habits.identity;
  const storedTasks =
    state.tasks?.items && typeof state.tasks.items === "object"
      ? state.tasks.items
      : {};

  return {
    ...empty,
    ...state,
    version: 6,
    ai: {
      ...empty.ai,
      ...state.ai,
      baseUrl: state.ai?.baseUrl || CIRCLE_OS_SERVER_URL,
    },
    profile: {
      ...empty.profile,
      ...state.profile,
      vision: {
        ...empty.profile.vision,
        ...state.profile.vision,
        description,
        preview: state.profile.vision?.preview || description,
        completedAt:
          state.profile.vision?.completedAt || oldTuesday?.completedAt || null,
      },
      profileCase: {
        ...fallbackCase,
        ...storedCase,
        sessions,
        survey: {
          ...fallbackCase.survey,
          ...storedCase?.survey,
          answers: Array.isArray(storedCase?.survey?.answers)
            ? storedCase.survey.answers
            : [],
        },
      },
    },
    days,
    chapters: {
      runs:
        state.chapters?.runs && typeof state.chapters.runs === "object"
          ? state.chapters.runs
          : {},
      sessions:
        state.chapters?.sessions && typeof state.chapters.sessions === "object"
          ? state.chapters.sessions
          : {},
    },
    appSessions:
      state.appSessions && typeof state.appSessions === "object"
        ? state.appSessions
        : {},
    protocol: {
      runs: { ...(state.protocol?.runs || {}) },
      completions: { ...(state.protocol?.completions || {}) },
      seals: { ...(state.protocol?.seals || {}) },
    },
    habits: {
      identity: storedHabitIdentity,
      definitions: normalizeHabitDefinitions(
        mergeRecordMaps(
          migratedPractice.definitions,
          storedHabitDefinitions,
        ),
      ),
      completions: mergeRecordMaps(
        migratedPractice.completions,
        storedHabitCompletions,
      ),
    },
    tasks: {
      items: mergeRecordMaps(migratedPractice.tasks, storedTasks),
    },
    declarations: normalizeDeclarations(state.declarations),
    evidence: {
      ...empty.evidence,
      ...(state.evidence || {}),
    },
    athenaMemory: normalizeAthenaMemory(state.athenaMemory),
    seenLines: mergeSeenLines(state.seenLines, []),
    outbox: Array.isArray(state.outbox) ? state.outbox : [],
  };
}

export function markLineSeen(state, lineId) {
  const seenLines = rememberLine(state.seenLines, lineId);
  if (seenLines === state.seenLines) return state;
  return { ...state, seenLines };
}

export function declarationVersions(state, kind) {
  if (!DECLARATION_KINDS.includes(kind)) return [];
  return Object.values(state?.declarations?.records || {})
    .filter((record) => record?.kind === kind)
    .sort((left, right) =>
      String(right.declaredAt).localeCompare(String(left.declaredAt)),
    );
}

export function currentDeclaration(state, kind) {
  return declarationVersions(state, kind)[0] || null;
}

export function declarationText(record) {
  if (!record) return "";
  const content = record.content || {};
  if (record.kind === "vision") {
    return [content.life, content.why].filter(Boolean).join(" ");
  }
  if (record.kind === "missionStatement") return content.statement || "";
  if (record.kind === "typicalTuesday") {
    return [
      content.wake,
      content.morning,
      content.day,
      content.people,
      content.evening,
      content.feeling,
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (record.kind === "dreamline") return content.dream || "";
  return "";
}

function declarationRecordId(kind, declaredAt) {
  return freshRecordId(`declaration-${kind}-${new Date(declaredAt).getTime()}`);
}

// A declaration is never edited in place. Every save adds a dated record that
// points back to the version it replaces, so a change can be read later rather
// than disappearing into the newest sentence.
export function declareLife(
  state,
  kind,
  value,
  { id = "", declaredAt = new Date().toISOString() } = {},
) {
  if (!DECLARATION_KINDS.includes(kind)) return state;
  const content = normalizeDeclarationContent(kind, value);
  if (!declarationHasContent(kind, content)) return state;
  const previous = currentDeclaration(state, kind);
  const recordId = id || declarationRecordId(kind, declaredAt);
  if (state.declarations?.records?.[recordId]) return state;
  const record = {
    id: recordId,
    kind,
    content,
    declaredAt,
    supersedesId: previous?.id || null,
    ...(kind === "dreamline" ? { targetAt: sixMonthsAfter(declaredAt) } : {}),
  };
  let next = {
    ...state,
    declarations: {
      records: {
        ...(state.declarations?.records || {}),
        [recordId]: record,
      },
    },
  };

  if (kind === "dreamline") {
    const timestamp = declaredAt;
    const items = Object.fromEntries(
      Object.entries(next.tasks?.items || {}).map(([taskId, task]) => [
        taskId,
        task?.status === "open" && task?.sourceDeclarationKind === "dreamline"
          ? { ...task, status: "archived", updatedAt: timestamp }
          : task,
      ]),
    );
    const taskId = `dreamline-now-${recordId}`;
    next = {
      ...next,
      tasks: {
        items: {
          ...items,
          [taskId]: {
            id: taskId,
            text: content.now,
            status: "open",
            createdAt: timestamp,
            updatedAt: timestamp,
            completedAt: null,
            sourceDeclarationKind: "dreamline",
            sourceDeclarationId: recordId,
          },
        },
      },
    };
  }

  return queueProfileUpdate(next, `declaration-${kind}`);
}

function comparisonWords(value) {
  return new Set(
    declarationText(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

// This is intentionally a plain relationship, never a score. It proves the
// two declarations are independent without pretending to know what the
// difference means to the person.
export function compareVisionDeclarations(state) {
  const vision = currentDeclaration(state, "vision");
  const tuesday = currentDeclaration(state, "typicalTuesday");
  if (!vision || !tuesday) {
    return {
      mode: "unclear",
      different: null,
      text: "Vision and Typical Tuesday are still taking shape.",
    };
  }
  const visionWords = comparisonWords(vision);
  const tuesdayWords = comparisonWords(tuesday);
  const shared = [...visionWords].filter((word) => tuesdayWords.has(word)).length;
  const smaller = Math.max(1, Math.min(visionWords.size, tuesdayWords.size));
  const different = shared / smaller < 0.6;
  return different
    ? {
        mode: "different",
        different: true,
        text: "Your Vision and Typical Tuesday say different things.",
      }
    : {
        mode: "close",
        different: false,
        text: "Your Vision and Typical Tuesday share much of the same language.",
      };
}

export function queueProfileUpdate(state, reason) {
  const timestamp = new Date().toISOString();
  const revision = Number(state.evidence?.localRevision || 0) + 1;
  const alreadyQueued = state.outbox.some((item) => item.reason === reason);
  return {
    ...state,
    evidence: {
      ...(state.evidence || {}),
      localRevision: revision,
      lastChangedAt: timestamp,
    },
    outbox: alreadyQueued
      ? state.outbox.map((item) =>
          item.reason === reason
            ? { ...item, revision, createdAt: timestamp }
            : item,
        )
      : [
          ...state.outbox,
          {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        reason,
        revision,
        createdAt: timestamp,
          },
        ],
    profile: {
      ...state.profile,
      profileCase: {
        ...state.profile.profileCase,
        status: "waiting",
      },
    },
  };
}

export function queueSuggestion(state, value) {
  const message = typeof value === "string" ? value.trim().slice(0, 800) : "";
  if (!message) return state;
  return {
    ...state,
    outbox: [
      ...state.outbox,
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `suggestion-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        reason: "suggestion",
        message,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function connectLocalAi(state, baseUrl, token = "") {
  let next = {
    ...state,
    ai: {
      ...state.ai,
      baseUrl: baseUrl.trim().replace(/\/+$/, ""),
      token,
      status: "ready",
      lastError: "",
    },
    outbox: state.outbox.map((item) => ({
      id: item.id,
      reason: item.reason,
      createdAt: item.createdAt,
      ...(item.message ? { message: item.message } : {}),
    })),
  };
  if (state.profile.vision.completedAt && next.outbox.length === 0) {
    next = queueProfileUpdate(next, "connected");
  }
  return next;
}

export function mergeServerState(state, serverState) {
  if (!serverState) return state;
  const remote = normalizeState(serverState);
  const local = normalizeState(state);
  const answers = new Map();
  for (const answer of [
    ...remote.profile.profileCase.survey.answers,
    ...local.profile.profileCase.survey.answers,
  ]) {
    if (!answer?.questionId) continue;
    const existing = answers.get(answer.questionId);
    if (
      !existing ||
      String(answer.answeredAt || "").localeCompare(
        String(existing.answeredAt || ""),
      ) >= 0
    ) {
      answers.set(answer.questionId, answer);
    }
  }
  const mergeRecordArrays = (remoteRecords = [], localRecords = [], key = "id") => {
    const records = new Map();
    for (const record of [...remoteRecords, ...localRecords]) {
      const id = record?.[key];
      if (!id) continue;
      const existing = records.get(id);
      if (
        !existing ||
        String(recordTimestamp(record)).localeCompare(
          String(recordTimestamp(existing)),
        ) >= 0
      ) {
        records.set(id, record);
      }
    }
    return [...records.values()];
  };
  const days = { ...remote.days };
  for (const [dateKey, localDay] of Object.entries(local.days)) {
    const remoteDay = remote.days[dateKey];
    if (!remoteDay) {
      days[dateKey] = localDay;
      continue;
    }
    const localMission = localDay.mission || {};
    const remoteMission = remoteDay.mission || {};
    const localMissionIsNewest =
      !remoteMission.updatedAt ||
      String(localMission.updatedAt || "").localeCompare(
        String(remoteMission.updatedAt || ""),
      ) >= 0;
    days[dateKey] = {
      ...remoteDay,
      ...localDay,
      mission: localMissionIsNewest
        ? { ...remoteMission, ...localMission }
        : { ...localMission, ...remoteMission },
      missions: mergeRecordArrays(remoteDay.missions, localDay.missions),
      checkIns: mergeRecordArrays(
        remoteDay.checkIns,
        localDay.checkIns,
        "period",
      ),
      timeBlocks: mergeRecordArrays(remoteDay.timeBlocks, localDay.timeBlocks),
      logRange: localDay.logRange ?? remoteDay.logRange ?? null,
    };
  }
  const sessions = Object.fromEntries(
    PROFILE_SESSION_KEYS.map((key) => {
      const remoteSession = remote.profile.profileCase.sessions[key];
      const localSession = local.profile.profileCase.sessions[key];
      const comparedAt = String(localSession.updatedAt || "").localeCompare(
        String(remoteSession.updatedAt || ""),
      );
      const keepLocal =
        Boolean(localSession.text) &&
        (!remoteSession.text ||
          comparedAt > 0 ||
          (localSession.userEdited && comparedAt >= 0));
      return [key, keepLocal ? localSession : remoteSession];
    }),
  );
  const nextQuestion = remote.profile.profileCase.survey.nextQuestion;
  const answeredRemoteQuestion = nextQuestion
    ? answers.has(nextQuestion.id)
    : false;
  const mergeUpdatedRecords = (remoteRecords = {}, localRecords = {}) => {
    const records = { ...remoteRecords };
    for (const [key, localRecord] of Object.entries(localRecords)) {
      const remoteRecord = remoteRecords[key];
      if (
        !remoteRecord ||
        String(localRecord?.updatedAt || "").localeCompare(
          String(remoteRecord?.updatedAt || ""),
        ) >= 0
      ) {
        records[key] = localRecord;
      }
    }
    return records;
  };
  const outbox = new Map();
  for (const item of [...remote.outbox, ...local.outbox]) {
    if (item?.id) outbox.set(item.id, item);
  }
  return {
    ...remote,
    profile: {
      ...remote.profile,
      profileCase: {
        ...remote.profile.profileCase,
        sessions,
        survey: {
          ...remote.profile.profileCase.survey,
          answers: [...answers.values()],
          nextQuestion: answeredRemoteQuestion
            ? local.profile.profileCase.survey.nextQuestion
            : nextQuestion ??
              local.profile.profileCase.survey.nextQuestion,
        },
      },
    },
    days,
    chapters: {
      runs: mergeUpdatedRecords(
        remote.chapters.runs,
        local.chapters.runs,
      ),
      sessions: mergeUpdatedRecords(
        remote.chapters.sessions,
        local.chapters.sessions,
      ),
    },
    seenLines: mergeSeenLines(local.seenLines, remote.seenLines),
    appSessions: {
      ...remote.appSessions,
      ...mergeUpdatedRecords(remote.appSessions, local.appSessions),
    },
    habits: {
      identity:
        String(local.habits.identity.updatedAt || "").localeCompare(
          String(remote.habits.identity.updatedAt || ""),
        ) >= 0
          ? local.habits.identity
          : remote.habits.identity,
      definitions: mergeUpdatedRecords(
        remote.habits.definitions,
        local.habits.definitions,
      ),
      completions: mergeUpdatedRecords(
        remote.habits.completions,
        local.habits.completions,
      ),
    },
    tasks: {
      items: mergeUpdatedRecords(remote.tasks.items, local.tasks.items),
    },
    declarations: {
      records: mergeRecordMaps(
        remote.declarations.records,
        local.declarations.records,
      ),
    },
    protocol: {
      runs: mergeUpdatedRecords(remote.protocol.runs, local.protocol.runs),
      completions: mergeUpdatedRecords(
        remote.protocol.completions,
        local.protocol.completions,
      ),
      seals: mergeUpdatedRecords(
        remote.protocol.seals,
        local.protocol.seals,
      ),
    },
    evidence: {
      localRevision: Math.max(
        Number(remote.evidence.localRevision || 0),
        Number(local.evidence.localRevision || 0),
      ),
      acknowledgedRevision: Math.max(
        Number(remote.evidence.acknowledgedRevision || 0),
        Number(local.evidence.acknowledgedRevision || 0),
      ),
      lastChangedAt:
        String(remote.evidence.lastChangedAt || "").localeCompare(
          String(local.evidence.lastChangedAt || ""),
        ) >= 0
          ? remote.evidence.lastChangedAt
          : local.evidence.lastChangedAt,
      lastAcknowledgedAt:
        String(remote.evidence.lastAcknowledgedAt || "").localeCompare(
          String(local.evidence.lastAcknowledgedAt || ""),
        ) >= 0
          ? remote.evidence.lastAcknowledgedAt
          : local.evidence.lastAcknowledgedAt,
    },
    athenaMemory: mergeAthenaMemory(
      remote.athenaMemory,
      local.athenaMemory,
    ),
    outbox: [...outbox.values()],
    ai: {
      ...remote.ai,
      baseUrl: local.ai.baseUrl,
      token: local.ai.token,
      profileId: local.ai.profileId,
      lastSyncedAt: local.ai.lastSyncedAt,
      lastSyncSlot: local.ai.lastSyncSlot,
    },
  };
}

function freshRecordId(prefix) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addHabitDefinition(state, id = freshRecordId("habit")) {
  const timestamp = new Date().toISOString();
  return {
    state: {
      ...state,
      habits: {
        ...state.habits,
        definitions: {
          ...state.habits.definitions,
          [id]: {
            id,
            text: "",
            action: "",
            cue: "",
            identity: "",
            status: "active",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        },
      },
    },
    id,
  };
}

export function updateRoutineIdentity(state, text) {
  const next = {
    ...state,
    habits: {
      ...state.habits,
      identity: {
        text: String(text || "").slice(0, 60),
        updatedAt: new Date().toISOString(),
      },
    },
  };
  // An empty edit is a dated value too. Removing the field would let an older
  // server copy restore the name on the next merge.
  return queueProfileUpdate(next, "routine-identity");
}

export function updateHabitDefinition(state, id, text) {
  return updateHabitDefinitionParts(state, id, { action: text });
}

export function updateHabitDefinitionParts(state, id, parts) {
  const current = state.habits.definitions[id];
  if (!current) return state;
  const action = cleanHabitPart(
    Object.hasOwn(parts || {}, "action") ? parts.action : current.action || current.text,
  );
  const cue = cleanHabitPart(
    Object.hasOwn(parts || {}, "cue") ? parts.cue : current.cue,
  );
  const identity = cleanHabitPart(
    Object.hasOwn(parts || {}, "identity") ? parts.identity : current.identity,
  );
  const cleanText = Object.hasOwn(parts || {}, "text")
    ? cleanHabitPart(parts.text)
    : composeHabitText({ action, cue, identity });
  const next = {
    ...state,
    habits: {
      ...state.habits,
      definitions: {
        ...state.habits.definitions,
        [id]: {
          ...current,
          text: cleanText,
          action,
          cue,
          identity,
          updatedAt: new Date().toISOString(),
        },
      },
    },
  };
  return cleanText.trim() ? queueProfileUpdate(next, "habit") : next;
}

// Clearing a habit archives it rather than removing the record.
//
// The server merges by walking its own records and letting a newer phone record
// win. A record the phone removed has no key left to compare, so the server copy
// survives the merge and the habit returns on the next sync. Archiving leaves a
// record with a newer updatedAt, which the merge honours, and the app already
// lists only active habits.
export function discardEmptyHabit(state, id) {
  const current = state.habits.definitions[id];
  if (!current || current.text.trim() || current.status === "archived") {
    return state;
  }
  return {
    ...state,
    habits: {
      ...state.habits,
      definitions: {
        ...state.habits.definitions,
        [id]: {
          ...current,
          status: "archived",
          updatedAt: new Date().toISOString(),
        },
      },
    },
  };
}

export function toggleHabitForDay(state, id, dateKey) {
  if (!state.habits.definitions[id]) return state;
  const key = habitCompletionId(id, dateKey);
  const current = state.habits.completions[key];
  const timestamp = new Date().toISOString();
  return queueProfileUpdate(
    {
      ...state,
      habits: {
        ...state.habits,
        completions: {
          ...state.habits.completions,
          [key]: {
            id: key,
            habitId: id,
            dateKey,
            completed: !current?.completed,
            completedAt: current?.completed ? null : timestamp,
            updatedAt: timestamp,
          },
        },
      },
    },
    "habit",
  );
}

export function addTask(state, id = freshRecordId("task")) {
  const timestamp = new Date().toISOString();
  return {
    state: {
      ...state,
      tasks: {
        ...state.tasks,
        items: {
          ...state.tasks.items,
          [id]: {
            id,
            text: "",
            status: "open",
            createdAt: timestamp,
            updatedAt: timestamp,
            completedAt: null,
          },
        },
      },
    },
    id,
  };
}

export function updateTask(state, id, text) {
  const current = state.tasks.items[id];
  if (!current) return state;
  const cleanText = String(text || "").slice(0, 240);
  const next = {
    ...state,
    tasks: {
      ...state.tasks,
      items: {
        ...state.tasks.items,
        [id]: { ...current, text: cleanText, updatedAt: new Date().toISOString() },
      },
    },
  };
  return cleanText.trim() ? queueProfileUpdate(next, "task") : next;
}

// Archived rather than removed, for the same reason as a habit: a record the
// phone deletes has nothing left for the server merge to compare against, so
// the server copy wins and the task comes back. The Page lists open tasks only.
export function discardEmptyTask(state, id) {
  const current = state.tasks.items[id];
  if (!current || current.text.trim() || current.status === "archived") {
    return state;
  }
  return {
    ...state,
    tasks: {
      ...state.tasks,
      items: {
        ...state.tasks.items,
        [id]: {
          ...current,
          status: "archived",
          updatedAt: new Date().toISOString(),
        },
      },
    },
  };
}

// A task that was finished by accident has to be recoverable. Completing one
// starts it leaving the Page, and until it has gone the same control puts it
// back. Nothing is deleted either way.
export function reopenTask(state, id) {
  const current = state.tasks.items[id];
  if (!current || current.status !== "completed") return state;
  const timestamp = new Date().toISOString();
  return queueProfileUpdate(
    {
      ...state,
      tasks: {
        ...state.tasks,
        items: {
          ...state.tasks.items,
          [id]: {
            ...current,
            status: "open",
            completedAt: null,
            updatedAt: timestamp,
          },
        },
      },
    },
    "task",
  );
}

export function completeTask(state, id) {
  const current = state.tasks.items[id];
  if (!current || current.status === "completed") return state;
  const timestamp = new Date().toISOString();
  return queueProfileUpdate(
    {
      ...state,
      tasks: {
        ...state.tasks,
        items: {
          ...state.tasks.items,
          [id]: {
            ...current,
            status: "completed",
            completedAt: timestamp,
            updatedAt: timestamp,
          },
        },
      },
    },
    "task",
  );
}

export function appSessionIndex(
  state,
  sessionId,
  version,
  fallbackIndex = 0,
) {
  const session = state.appSessions?.[sessionId];
  return session?.version === version &&
    Number.isInteger(session.index) &&
    session.index >= 0
    ? session.index
    : fallbackIndex;
}

export function hasReadableProfileCase(profileCase) {
  return Boolean(
    typeof profileCase?.updatedAt === "string" &&
      profileCase.updatedAt.trim(),
  );
}

export function setAppSessionIndex(state, sessionId, version, index) {
  if (!sessionId || !version || !Number.isInteger(index) || index < 0) {
    return state;
  }
  return {
    ...state,
    appSessions: {
      ...state.appSessions,
      [sessionId]: {
        version,
        index,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

function cleanSession(session, fallback) {
  return {
    text:
      typeof session?.text === "string" && session.text.trim()
        ? session.text.trim()
        : fallback.text,
    confidence:
      typeof session?.confidence === "number"
        ? Math.max(0, Math.min(1, session.confidence))
        : fallback.confidence,
    userEdited: fallback.userEdited,
    updatedAt: new Date().toISOString(),
  };
}

export function applyProfileResult(state, result, outboxId) {
  const currentCase = state.profile.profileCase;
  const incoming = result?.sessions ?? {};
  const sessions = Object.fromEntries(
    PROFILE_SESSION_KEYS.map((key) => {
      const current = currentCase.sessions[key];
      return [
        key,
        current.userEdited ? current : cleanSession(incoming[key], current),
      ];
    }),
  );
  const nextQuestion =
    result?.nextQuestion &&
    typeof result.nextQuestion.id === "string" &&
    typeof result.nextQuestion.text === "string"
      ? {
          id: result.nextQuestion.id,
          text: result.nextQuestion.text.trim(),
          target:
            typeof result.nextQuestion.target === "string"
              ? result.nextQuestion.target
              : "whatMatters",
        }
      : null;
  const missionText =
    typeof result?.dailyMission === "string" && result.dailyMission.trim()
      ? result.dailyMission.trim()
      : state.days[getDateKey()]?.mission?.text;

  return {
    ...state,
    ai: {
      ...state.ai,
      status: "ready",
      lastError: "",
      lastRunAt: new Date().toISOString(),
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
        ...currentCase,
        status: "ready",
        updatedAt: new Date().toISOString(),
        sessions,
        survey: {
          ...currentCase.survey,
          nextQuestion,
        },
      },
    },
    days: missionText
      ? {
          ...state.days,
          [getDateKey()]: {
            ...state.days[getDateKey()],
            mission: {
              ...state.days[getDateKey()]?.mission,
              text: missionText,
              identity: "Yourself",
              updatedAt: new Date().toISOString(),
            },
          },
        }
      : state.days,
    outbox: state.outbox.filter((item) => item.id !== outboxId),
  };
}

export function markProfileUpdateFailed(state, outboxId, message) {
  return {
    ...state,
    ai: {
      ...state.ai,
      status: "offline",
      lastError: message,
    },
    profile: {
      ...state.profile,
      profileCase: {
        ...state.profile.profileCase,
        status: "waiting",
      },
    },
    outbox: state.outbox.map((item) =>
      item.id === outboxId ? { ...item, triedAt: new Date().toISOString() } : item,
    ),
  };
}

export function editProfileSession(state, key, text) {
  const current = state.profile.profileCase.sessions[key];
  if (!current || !text.trim()) return state;
  const session = {
    ...current,
    text: text.trim(),
    userEdited: true,
    confidence: 1,
    updatedAt: new Date().toISOString(),
  };
  return {
    ...state,
    profile: {
      ...state.profile,
      vision: {
        ...state.profile.vision,
        ...(key === "typicalTuesday" ? { preview: session.text } : {}),
        ...(key === "whatMatters" ? { understanding: session.text } : {}),
        ...(key === "gap" ? { gap: session.text } : {}),
      },
      profileCase: {
        ...state.profile.profileCase,
        sessions: {
          ...state.profile.profileCase.sessions,
          [key]: session,
        },
      },
    },
  };
}

export function answerProfileQuestion(state, answer) {
  const question = state.profile.profileCase.survey.nextQuestion;
  if (!question || !answer.trim()) return state;
  const next = {
    ...state,
    profile: {
      ...state.profile,
      profileCase: {
        ...state.profile.profileCase,
        survey: {
          ...state.profile.profileCase.survey,
          answers: [
            ...state.profile.profileCase.survey.answers,
            {
              questionId: question.id,
              question: question.text,
              answer: answer.trim(),
              target: question.target,
              kind: "codex",
              answeredAt: new Date().toISOString(),
            },
          ],
          nextQuestion: null,
        },
      },
    },
  };
  return queueProfileUpdate(next, "question-answered");
}

export function answerSurveyQuestion(state, question, answer, kind = "profile") {
  const cleanAnswer = String(answer || "").trim();
  if (!question?.id || (!cleanAnswer && kind !== "note")) return state;
  const answeredAt = new Date().toISOString();
  const previousAnswers = state.profile.profileCase.survey.answers.filter(
    (item) => item.questionId !== question.id,
  );
  let next = {
    ...state,
    profile: {
      ...state.profile,
      profileCase: {
        ...state.profile.profileCase,
        survey: {
          ...state.profile.profileCase.survey,
          answers: cleanAnswer || kind === "note"
            ? [
                ...previousAnswers,
                {
                  questionId: question.id,
                  question: question.text,
                  answer: cleanAnswer,
                  target: question.target || "whatMatters",
                  kind,
                  answeredAt,
                },
              ]
            : previousAnswers,
        },
      },
    },
  };

  if ((kind === "thought" || kind === "deep-thought") && cleanAnswer) {
    next = {
      ...next,
      athenaMemory: captureAthenaThought(next.athenaMemory, {
        sourceId: question.id,
        sourceType: kind,
        text: cleanAnswer,
        capturedAt: answeredAt,
      }),
    };
  }

  if (kind === "habit" && question.id === "habit-action") {
    const identity =
      next.profile.profileCase.survey.answers.find(
        (item) => item.questionId === "habit-identity",
      )?.answer || "Yourself";
    const added = addHabitDefinition(next);
    next = updateHabitDefinitionParts(added.state, added.id, {
      action: cleanAnswer,
      identity,
      text: cleanAnswer,
    });
    next = {
      ...next,
      profile: {
        ...next.profile,
        identityFocus: identity,
      },
    };
  }

  return queueProfileUpdate(
    next,
    kind === "habit" ? "habit-answer" : "survey-answer",
  );
}

export function forgetAthenaEvidence(state, sourceId) {
  const cleanId = String(sourceId || "").trim();
  if (!cleanId) return state;
  const next = {
    ...state,
    profile: {
      ...state.profile,
      profileCase: {
        ...state.profile.profileCase,
        survey: {
          ...state.profile.profileCase.survey,
          answers: state.profile.profileCase.survey.answers.filter(
            (item) => item.questionId !== cleanId,
          ),
        },
      },
    },
    athenaMemory: forgetDerivedAthenaEvidence(state.athenaMemory, cleanId),
  };
  return queueProfileUpdate(next, "athena-evidence-forgotten");
}

export function getDateKey(date = new Date()) {
  const circleDate = new Date(date);
  circleDate.setHours(circleDate.getHours() - CIRCLE_DAY_START_HOUR);
  const year = circleDate.getFullYear();
  const month = String(circleDate.getMonth() + 1).padStart(2, "0");
  const day = String(circleDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDayPeriod(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 14) return "midday";
  if (hour >= 14 && hour < 19) return "afternoon";
  return "evening";
}

export function createDay(dateKey) {
  return {
    date: dateKey,
    checkIns: [],
    mission: { ...DEFAULT_MISSION },
    missions: [],
    timeBlocks: [],
    logRange: null,
  };
}

export function ensureDay(state, dateKey) {
  if (state.days[dateKey]) return state;
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: createDay(dateKey),
    },
  };
}

export function upsertCheckIn(day, nextCheckIn) {
  const withoutPeriod = day.checkIns.filter(
    (checkIn) => checkIn.period !== nextCheckIn.period,
  );
  return {
    ...day,
    checkIns: [...withoutPeriod, nextCheckIn],
  };
}

export function upsertTimeBlock(day, nextBlock) {
  const index = day.timeBlocks.findIndex((block) => block.id === nextBlock.id);
  const sortBlocks = (blocks) =>
    blocks.sort((a, b) => circleTimeValue(a.start) - circleTimeValue(b.start));
  if (index === -1) {
    return {
      ...day,
      timeBlocks: sortBlocks([...day.timeBlocks, nextBlock]),
    };
  }

  const timeBlocks = [...day.timeBlocks];
  timeBlocks[index] = nextBlock;
  sortBlocks(timeBlocks);
  return { ...day, timeBlocks };
}

export function setDayLogRange(day, startHour, endHour) {
  const requestedStart = Number(startHour);
  const requestedEnd = Number(endHour);
  const cleanStart = Math.max(
    CIRCLE_DAY_START_HOUR,
    Math.min(
      CIRCLE_DAY_START_HOUR + 23,
      Number.isFinite(requestedStart)
        ? Math.trunc(requestedStart)
        : CIRCLE_DAY_START_HOUR,
    ),
  );
  const cleanEnd = Math.max(
    cleanStart,
    Math.min(
      CIRCLE_DAY_START_HOUR + 23,
      Number.isFinite(requestedEnd)
        ? Math.trunc(requestedEnd)
        : cleanStart,
    ),
  );
  return {
    ...day,
    logRange: {
      startHour: cleanStart,
      endHour: cleanEnd,
    },
  };
}

function circleTimeValue(value) {
  const [hour = 0, minute = 0] = String(value).split(":").map(Number);
  return (hour < CIRCLE_DAY_START_HOUR ? hour + 24 : hour) * 60 + minute;
}

export function minutesBetween(start, end) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes < 0) minutes += 24 * 60;
  return Math.max(0, minutes);
}

function lastSevenDateKeys(now) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      key: getDateKey(date),
      label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      fullLabel: date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      }),
    };
  });
}

export function summarizeWeek(state, now = new Date()) {
  const dateKeys = lastSevenDateKeys(now);
  const days = dateKeys.map((date) => {
    const day = state.days[date.key] ?? createDay(date.key);
    const recordedPeriods = new Set(day.checkIns.map((item) => item.period)).size;
    const minutes = day.timeBlocks.reduce(
      (total, block) => total + minutesBetween(block.start, block.end),
      0,
    );
    return {
      ...date,
      day,
      recordedPeriods,
      minutes,
    };
  });

  const recorded = days.reduce((total, day) => total + day.recordedPeriods, 0);
  const timeMap = new Map();
  const energyMap = new Map();
  const moodMap = new Map();

  for (const { day } of days) {
    for (const block of day.timeBlocks) {
      const minutes = minutesBetween(block.start, block.end);
      const label = block.title || block.activity;
      timeMap.set(label, (timeMap.get(label) ?? 0) + minutes);
    }
    for (const checkIn of day.checkIns) {
      if (typeof checkIn.energy === "number") {
        const values = energyMap.get(checkIn.period) ?? [];
        values.push(checkIn.energy);
        energyMap.set(checkIn.period, values);
      }
      if (checkIn.mood) {
        moodMap.set(checkIn.mood, (moodMap.get(checkIn.mood) ?? 0) + 1);
      }
    }
  }

  const time = [...timeMap.entries()]
    .map(([activity, minutes]) => ({ activity, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
  const totalMinutes = time.reduce((total, item) => total + item.minutes, 0);
  const energy = DAY_PERIODS.map((period) => {
    const values = energyMap.get(period.id) ?? [];
    return {
      period: period.id,
      label: period.label,
      value: values.length
        ? values.reduce((total, value) => total + value, 0) / values.length
        : null,
      count: values.length,
    };
  });
  const moods = [...moodMap.entries()]
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);
  const missions = days.flatMap(({ day }) => [
    ...(day.mission ? [day.mission] : []),
    ...(day.missions || []),
  ]);
  const completedMissions = missions.filter((mission) => mission.completed);
  const readingBlocks = days.flatMap(({ day }) =>
    day.timeBlocks.filter((block) => block.activity === "Reading"),
  );

  let sentence = "There is not enough evidence to say.";
  let experiment = "";
  if (recorded >= 4 || totalMinutes >= 180) {
    const top = time[0];
    if (top) {
      sentence = `${top.activity} held the largest share of the time you recorded this week.`;
      experiment = "";
    } else {
      sentence =
        "Your check-ins show more of your inner rhythm than where your hours went.";
      experiment = "";
    }
  }

  return {
    days,
    coverage: {
      recorded,
      possible: 28,
      percent: Math.round((recorded / 28) * 100),
    },
    time,
    totalMinutes,
    energy,
    moods,
    missions: {
      completed: completedMissions.length,
      available: missions.length,
    },
    identity: {
      focus: state.profile?.identityFocus ?? "Reader",
      evidenceCount: completedMissions.length + readingBlocks.length,
      readingBlocks: readingBlocks.length,
    },
    sentence,
    experiment,
  };
}

function weekTimeLabel(value) {
  const minutes = Number(value) % (24 * 60);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function weekList(values) {
  if (values.length < 2) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function weekActivityGroup(value = "") {
  const text = String(value).toLowerCase();
  if (/sleep|bed|nap/.test(text)) return "Sleep and rest";
  if (/lunch|dinner|breakfast|meal|eat|coffee/.test(text)) return "Meals and coffee";
  if (/walk|gym|outdoor|samrong|patio|exercise/.test(text)) return "Movement and outside time";
  if (/project|computer|focus|work|edit|video|codex|build/.test(text)) return "Project and computer work";
  if (/friend|family|mom|cousin|talk|dota/.test(text)) return "Time with other people";
  if (/shower|brush|wind down/.test(text)) return "Personal care";
  if (/movie|game|entertain/.test(text)) return "Entertainment";
  if (/immigration|market|class|come back|home/.test(text)) return "Errands and travel";
  if (/read|journal|reflect/.test(text)) return "Reading and reflection";
  return "Other recorded time";
}

function weekEvidenceDay(item, value, tone = "plain") {
  return { label: item.fullLabel, shortLabel: item.label, value, tone };
}

/**
 * Local weekly claims. These are arithmetic over the phone's state, never AI
 * prose. Fewer than three recorded days produces one explicit silence and no
 * pattern-shaped output.
 */
export function buildWeekClaims(state, now = new Date()) {
  const summary = summarizeWeek(state, now);
  const days = summary.days.filter(({ key, day }) => {
    const habitTouched = Object.values(state.habits?.completions || {}).some(
      (completion) => completion?.dateKey === key,
    );
    return Boolean(
      day.timeBlocks.length ||
        day.checkIns.length ||
        day.mission?.completed ||
        day.missions?.length ||
        habitTouched,
    );
  });
  if (days.length < 3) {
    const count = days.length;
    return [{
      key: "silence",
      label: "Still learning",
      sentence: count === 0
        ? "There are no recorded days to call a weekly pattern."
        : `${count} recorded day${count === 1 ? " is" : "s are"} not enough to call a weekly pattern.`,
      evidence: summary.days.map((item) =>
        weekEvidenceDay(item, days.some((day) => day.key === item.key) ? "recorded" : "quiet", days.some((day) => day.key === item.key) ? "held" : "quiet"),
      ),
    }];
  }

  const claims = [];
  const starts = days
    .map((item) => {
      const first = [...item.day.timeBlocks]
        .filter((block) => block.start)
        .sort((left, right) => circleTimeValue(left.start) - circleTimeValue(right.start))[0];
      return first ? { item, minutes: circleTimeValue(first.start) % (24 * 60) } : null;
    })
    .filter(Boolean);
  if (starts.length >= 3) {
    const counts = new Map();
    for (const start of starts) counts.set(start.minutes, (counts.get(start.minutes) || 0) + 1);
    const [commonStart, commonCount] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    const minimum = Math.min(...starts.map((start) => start.minutes));
    const maximum = Math.max(...starts.map((start) => start.minutes));
    const sentence = commonCount >= Math.ceil(starts.length / 2)
      ? `${commonCount} of ${starts.length} recorded days began at ${weekTimeLabel(commonStart)}.`
      : `Your recorded days began between ${weekTimeLabel(minimum)} and ${weekTimeLabel(maximum)}.`;
    claims.push({
      key: "day-start",
      label: "Day start",
      sentence,
      evidence: starts.map(({ item, minutes }) => weekEvidenceDay(item, weekTimeLabel(minutes))),
    });
  }

  const habits = Object.values(state.habits?.definitions || {})
    .filter((habit) => habit?.status === "active" && habit.text?.trim())
    .map((habit) => {
      const eligible = days.filter((item) => {
        const completion = state.habits.completions[habitCompletionId(habit.id, item.key)];
        return Boolean(completion) || item.key >= getDateKey(new Date(habit.createdAt));
      });
      return { habit, eligible };
    })
    .filter(({ eligible }) => eligible.length >= 3)
    .sort((left, right) => right.eligible.length - left.eligible.length);
  const habitReading = habits[0];
  if (habitReading) {
    const held = habitReading.eligible.filter((item) =>
      state.habits.completions[habitCompletionId(habitReading.habit.id, item.key)]?.completed,
    );
    const slipped = habitReading.eligible.filter((item) => !held.includes(item));
    const habitName = habitReading.habit.text.trim().replace(/[.!?]+$/, "");
    const status = [
      held.length ? `held on ${weekList(held.map((item) => item.fullLabel))}` : "did not hold on a recorded day",
      slipped.length ? `slipped on ${weekList(slipped.map((item) => item.fullLabel))}` : "did not slip on a recorded day",
    ];
    claims.push({
      key: "habit",
      label: "Habit",
      sentence: `${habitName} ${status[0]}, and ${status[1]}.`,
      evidence: habitReading.eligible.map((item) =>
        weekEvidenceDay(item, held.includes(item) ? "held" : "slipped", held.includes(item) ? "held" : "slipped"),
      ),
    });
  }

  const mealKinds = [
    { label: "Lunch", pattern: /lunch/i },
    { label: "Dinner", pattern: /dinner/i },
    { label: "Breakfast", pattern: /breakfast/i },
  ].map((meal) => ({
    ...meal,
    events: days.flatMap((item) => {
      const matching = item.day.timeBlocks
        .filter((block) =>
          meal.pattern.test(
            [block.title || block.activity || "", ...(block.moments || [])].join(" "),
          ),
        )
        .sort((left, right) => circleTimeValue(left.start) - circleTimeValue(right.start));
      return matching[0]
        ? [{ item, minutes: circleTimeValue(matching[0].start) % (24 * 60) }]
        : [];
    }),
  })).sort((left, right) => right.events.length - left.events.length);
  const meal = mealKinds[0];
  if (meal?.events.length >= 3) {
    const minimum = Math.min(...meal.events.map((event) => event.minutes));
    const maximum = Math.max(...meal.events.map((event) => event.minutes));
    claims.push({
      key: "eating",
      label: "Eating",
      sentence: `${meal.label} appeared on ${meal.events.length} of ${days.length} recorded days, between ${weekTimeLabel(minimum)} and ${weekTimeLabel(maximum)}.`,
      evidence: meal.events.map(({ item, minutes }) => weekEvidenceDay(item, weekTimeLabel(minutes))),
    });
  }

  const allocation = new Map();
  for (const { day } of days) {
    for (const block of day.timeBlocks) {
      const group = weekActivityGroup(block.title || block.activity);
      allocation.set(group, (allocation.get(group) || 0) + minutesBetween(block.start, block.end));
    }
  }
  const allocationRows = [...allocation.entries()].sort((a, b) => b[1] - a[1]);
  if (allocationRows.length) {
    const [group, minutes] = allocationRows[0];
    claims.push({
      key: "hours",
      label: "Hours",
      sentence: `${group} took the most recorded time: ${formatDuration(minutes)}.`,
      evidence: allocationRows.slice(0, 4).map(([label, value]) => ({
        label,
        shortLabel: label,
        value: formatDuration(value),
        tone: label === group ? "held" : "plain",
      })),
    });
  }

  const energyDays = days
    .map((item) => {
      const values = item.day.checkIns.map((checkIn) => checkIn.energy).filter(Number.isFinite);
      return values.length
        ? { item, value: values.reduce((total, value) => total + value, 0) / values.length }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value);
  if (energyDays.length >= 3) {
    const highest = energyDays.slice(0, 2);
    const common = highest[0].item.day.timeBlocks
      .map((block) => weekActivityGroup(block.title || block.activity))
      .find((group) => highest[1].item.day.timeBlocks.some(
        (block) => weekActivityGroup(block.title || block.activity) === group,
      ));
    claims.push({
      key: "best-days",
      label: "Best days",
      sentence: common
        ? `Your two highest-energy recorded days both included ${common.toLowerCase()}.`
        : "Your two highest-energy recorded days did not share one logged activity.",
      evidence: energyDays.map(({ item, value }) => weekEvidenceDay(item, value.toFixed(1), highest.some((day) => day.item.key === item.key) ? "held" : "plain")),
    });
  } else {
    claims.push({
      key: "best-days",
      label: "Best days",
      sentence: "There are not enough energy check-ins to say what your best days had in common.",
      evidence: days.map((item) => weekEvidenceDay(item, "no check-in", "quiet")),
    });
  }
  return claims;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} minutes`;
  if (!remainder) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"} ${remainder} minutes`;
}

export function buildVisionAnalysis(state, now = new Date()) {
  const summary = summarizeWeek(state, now);
  const vision = state.profile?.vision?.description?.trim() ?? "";
  const logged = summary.time.slice(0, 3).map((item) => item.activity);

  const preview =
    state.profile?.vision?.preview?.trim() ||
    vision ||
    "Your typical Tuesday has not been described yet.";

  let understanding =
    "I do not know enough yet. Your first honest logs will help me understand how you live.";
  let gap =
    "There is not enough evidence yet. Log parts of your real days and the gap will become clearer.";

  if (logged.length) {
    understanding = `This week, your logs often mention ${logged.join(", ")}. This is an early reading, not a final judgment.`;
    gap = vision
      ? "Your Vision and your real days are now in the same place. More logged days are needed before the gap can be described honestly."
      : "Describe your typical Tuesday so your real days have something meaningful to compare with.";
  }

  return {
    preview,
    understanding:
      state.profile?.vision?.understanding?.trim() || understanding,
    gap: state.profile?.vision?.gap?.trim() || gap,
  };
}

export function createSampleState(now = new Date()) {
  const state = createEmptyState();
  const dates = lastSevenDateKeys(now);
  const activities = [
    ["Focus", "Reading", "Rest"],
    ["Focus", "Exercise", "Social"],
    ["Life admin", "Reading", "Entertainment"],
    ["Focus", "Outside", "Rest"],
    ["Focus", "Reading", "Exercise"],
    ["Social", "Outside", "Reading"],
    ["Rest", "Reading", "Life admin"],
  ];
  const moodCycle = ["Clear", "Alive", "Restless", "Calm", "Clear", "Alive", "Calm"];

  dates.forEach(({ key }, dayIndex) => {
    const day = createDay(key);
    day.checkIns = DAY_PERIODS.slice(0, dayIndex === 0 ? 2 : 3).map(
      (period, periodIndex) => ({
        period: period.id,
        energy: Math.max(1, Math.min(5, 3 + ((dayIndex + periodIndex) % 3) - 1)),
        mood: moodCycle[(dayIndex + periodIndex) % moodCycle.length],
        createdAt: `${key}T0${Math.min(9, 7 + periodIndex)}:00:00.000Z`,
      }),
    );
    day.mission = {
      ...DEFAULT_MISSION,
      completed: dayIndex !== 2 && dayIndex !== 5,
      completedAt:
        dayIndex !== 2 && dayIndex !== 5 ? `${key}T20:00:00.000Z` : null,
    };
    day.timeBlocks = activities[dayIndex].map((activity, index) => {
      const startHour = 8 + index * 4;
      return {
        id: `${key}-${index}`,
        start: `${String(startHour).padStart(2, "0")}:00`,
        end: `${String(startHour + (index === 0 ? 2 : 1)).padStart(2, "0")}:00`,
        activity,
        note: "",
        createdAt: `${key}T${String(startHour).padStart(2, "0")}:00:00.000Z`,
      };
    });
    state.days[key] = day;
  });

  return state;
}

// The Circle day before this one. Dates are plain keys rather than clock time,
// so stepping back a day never has to reason about the 06:00 boundary again.
export function previousDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

// What the person actually did on one finished day: habits they ticked and
// tasks they completed, and nothing else. Deliberately one day rather than a
// week, because a row of seven dots is a scoreboard and invites chasing a
// streak instead of noticing what happened.
export function dayRecord(state, dateKey) {
  const habits = Object.values(state.habits.definitions)
    .filter(
      (habit) =>
        habit.status === "active" &&
        state.habits.completions[habitCompletionId(habit.id, dateKey)]?.completed,
    )
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((habit) => ({ id: habit.id, text: habit.text }));

  const tasks = Object.values(state.tasks.items)
    .filter(
      (task) =>
        task.status === "completed" &&
        task.completedAt &&
        getDateKey(new Date(task.completedAt)) === dateKey,
    )
    .sort((left, right) =>
      String(left.completedAt).localeCompare(String(right.completedAt)),
    )
    .map((task) => ({ id: task.id, text: task.text }));

  return { dateKey, habits, tasks, total: habits.length + tasks.length };
}


// ---------------------------------------------------------------------------
// Protocol
//
// A habit is open-ended. A protocol is a container of time: it starts, it ends,
// and its terms were agreed before it began. One run at a time, because "Monk
// Mode" means something only while it is the single thing being kept.
//
// Missing a non-negotiable is recorded and costs nothing. There is no reset and
// no failure state, because the app is here to show what happened rather than
// to grade it.
// ---------------------------------------------------------------------------

function now() {
  return new Date().toISOString();
}

export const PROTOCOL_DURATIONS = [3, 7, 14, 21];
export const PROTOCOL_DEFAULT_NAME = "Monk Mode";
const PROTOCOL_KINDS = new Set(["non-negotiable", "negotiable"]);

export function protocolCompletionId(itemId, dateKey) {
  return `${dateKey}:${itemId}`;
}

export function protocolSealId(runId, dateKey) {
  return `${runId}:${dateKey}`;
}

function writeRun(state, run) {
  return {
    ...state,
    protocol: {
      ...state.protocol,
      runs: { ...state.protocol.runs, [run.id]: run },
    },
  };
}

// The run being written or kept. A finished run is history and never active.
export function activeProtocolRun(state) {
  return (
    Object.values(state.protocol?.runs || {})
      .filter((run) => run.status === "draft" || run.status === "active")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] || null
  );
}

export function startProtocolDraft(state, id = freshRecordId("protocol")) {
  if (activeProtocolRun(state)) return { state, id: activeProtocolRun(state).id };
  const timestamp = now();
  return {
    state: writeRun(state, {
      id,
      name: PROTOCOL_DEFAULT_NAME,
      days: 7,
      status: "draft",
      startDateKey: null,
      startedAt: null,
      endedAt: null,
      items: {},
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
    id,
  };
}

/**
 * A run is open to editing while it is being drafted and while it is going.
 *
 * The original rule locked the terms the moment a run began, because a protocol
 * is an agreement made before it starts. Sai asked to be able to change a run
 * he is in, so the lock is gone. What is kept instead is the record: an item
 * keeps its id through an edit, so the days already marked against it stay
 * attached to it, and a term is archived rather than deleted for the same
 * reason a habit is.
 *
 * Length is the one thing that stays fixed. The day counter and the ending are
 * arithmetic on it, and a run that can be shortened when it gets hard is not a
 * protocol.
 */
function protocolRunIsOpen(run) {
  return Boolean(run) && (run.status === "draft" || run.status === "active");
}

export function renameProtocolRun(state, runId, name) {
  const run = state.protocol.runs[runId];
  if (!protocolRunIsOpen(run)) return state;
  return writeRun(state, {
    ...run,
    name: String(name || "").slice(0, 60),
    updatedAt: now(),
  });
}

export function setProtocolDays(state, runId, days) {
  const run = state.protocol.runs[runId];
  const value = Number(days);
  if (!run || run.status !== "draft" || !PROTOCOL_DURATIONS.includes(value)) {
    return state;
  }
  return writeRun(state, { ...run, days: value, updatedAt: now() });
}

export function addProtocolItem(state, runId, kind, id = freshRecordId("pitem")) {
  const run = state.protocol.runs[runId];
  if (!protocolRunIsOpen(run) || !PROTOCOL_KINDS.has(kind)) {
    return { state, id: null };
  }
  const timestamp = now();
  return {
    state: writeRun(state, {
      ...run,
      items: {
        ...run.items,
        [id]: {
          id,
          text: "",
          kind,
          status: "active",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      updatedAt: timestamp,
    }),
    id,
  };
}

export function updateProtocolItem(state, runId, itemId, text) {
  const run = state.protocol.runs[runId];
  const item = run?.items?.[itemId];
  if (!item || !protocolRunIsOpen(run)) return state;
  const timestamp = now();
  return writeRun(state, {
    ...run,
    items: {
      ...run.items,
      [itemId]: { ...item, text: String(text || "").slice(0, 120), updatedAt: timestamp },
    },
    updatedAt: timestamp,
  });
}

// Archived rather than removed, for the same reason a habit is: a record the
// phone deletes has nothing left for the server merge to compare against, so
// the server copy wins and the item comes back.
export function discardEmptyProtocolItem(state, runId, itemId) {
  const run = state.protocol.runs[runId];
  const item = run?.items?.[itemId];
  if (!item || !protocolRunIsOpen(run)) return state;
  if (item.text.trim() || item.status === "archived") return state;
  const timestamp = now();
  return writeRun(state, {
    ...run,
    items: {
      ...run.items,
      [itemId]: { ...item, status: "archived", updatedAt: timestamp },
    },
    updatedAt: timestamp,
  });
}

export function protocolItems(run, kind) {
  return Object.values(run?.items || {})
    .filter(
      (item) =>
        item.status === "active" && (!kind || item.kind === kind) && true,
    )
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

// A run needs at least one non-negotiable with words in it. Negotiables are
// optional by definition, so they are never required to begin.
export function canBeginProtocolRun(run) {
  return Boolean(
    run &&
      run.status === "draft" &&
      protocolItems(run, "non-negotiable").some((item) => item.text.trim()),
  );
}

export function beginProtocolRun(state, runId, dateKey) {
  const run = state.protocol.runs[runId];
  if (!canBeginProtocolRun(run)) return state;
  const timestamp = now();
  // Anything still blank at the moment of starting never becomes a term.
  const items = Object.fromEntries(
    Object.entries(run.items).map(([id, item]) => [
      id,
      item.text.trim() ? item : { ...item, status: "archived", updatedAt: timestamp },
    ]),
  );
  return writeRun(state, {
    ...run,
    items,
    status: "active",
    startDateKey: dateKey,
    startedAt: timestamp,
    updatedAt: timestamp,
  });
}

// Ending early is honest and is recorded. It is not a failure.
export function endProtocolRun(state, runId, status = "ended") {
  const run = state.protocol.runs[runId];
  if (!run || (run.status !== "active" && run.status !== "draft")) return state;
  const timestamp = now();
  return writeRun(state, {
    ...run,
    status: run.status === "draft" ? "ended" : status,
    endedAt: timestamp,
    updatedAt: timestamp,
  });
}

// Which day of the run a date is, counting the first day as day one.
export function protocolDay(run, dateKey) {
  if (!run?.startDateKey) return 0;
  const start = Date.parse(`${run.startDateKey}T00:00:00Z`);
  const current = Date.parse(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(current)) return 0;
  return Math.floor((current - start) / 86400000) + 1;
}

export function toggleProtocolRecordItem(state, runId, itemId, dateKey) {
  const run = state.protocol?.runs?.[runId];
  const item = run?.items?.[itemId];
  if (
    !run ||
    !item ||
    (run.status !== "active" && run.status !== "completed") ||
    item.status !== "active"
  ) {
    return state;
  }
  const key = protocolCompletionId(itemId, dateKey);
  const current = state.protocol.completions[key];
  const timestamp = now();
  const sealKey = protocolSealId(run.id, dateKey);
  const currentSeal = state.protocol.seals?.[sealKey];
  // A negotiable is extra by definition. Correcting it never reopens a day
  // that was honestly kept; correcting a non-negotiable does.
  const seals =
    item.kind === "non-negotiable" && currentSeal?.sealed
      ? {
          ...state.protocol.seals,
          [sealKey]: {
            ...currentSeal,
            sealed: false,
            unsealedAt: timestamp,
            updatedAt: timestamp,
          },
        }
      : state.protocol.seals;
  return queueProfileUpdate(
    {
      ...state,
      protocol: {
        ...state.protocol,
        seals,
        completions: {
          ...state.protocol.completions,
          [key]: {
            id: key,
            itemId,
            runId: run.id,
            dateKey,
            completed: !current?.completed,
            completedAt: current?.completed ? null : timestamp,
            updatedAt: timestamp,
          },
        },
      },
    },
    "protocol",
  );
}

export function toggleProtocolItem(state, itemId, dateKey) {
  const run = activeProtocolRun(state);
  return run ? toggleProtocolRecordItem(state, run.id, itemId, dateKey) : state;
}

// Sealing is a dated assertion about one day, not a lock. The completed terms
// are copied into the record so the closing Page can tell the truth even if the
// run is edited later. A later correction writes an unsealed version instead of
// deleting it, which keeps the local-first merge honest.
export function sealProtocolDay(state, dateKey) {
  const today = protocolToday(state, dateKey);
  if (
    !today ||
    today.run.status !== "active" ||
    today.day < 1 ||
    today.day > today.run.days ||
    !today.keptAll ||
    today.sealed
  ) {
    return state;
  }
  const timestamp = now();
  const id = protocolSealId(today.run.id, dateKey);
  const terms = [...today.nonNegotiable, ...today.negotiable]
    .filter((item) => item.completed)
    .map((item) => ({ id: item.id, text: item.text, kind: item.kind }));
  const completedRun =
    today.day === today.run.days
      ? {
          ...today.run,
          status: "completed",
          endedAt: timestamp,
          updatedAt: timestamp,
        }
      : today.run;
  return queueProfileUpdate(
    {
      ...state,
      protocol: {
        ...state.protocol,
        runs: {
          ...state.protocol.runs,
          [completedRun.id]: completedRun,
        },
        seals: {
          ...state.protocol.seals,
          [id]: {
            id,
            runId: today.run.id,
            dateKey,
            day: today.day,
            totalDays: today.run.days,
            phaseName: today.run.name,
            terms,
            sealed: true,
            sealedAt: timestamp,
            unsealedAt: null,
            updatedAt: timestamp,
          },
        },
      },
    },
    "protocol",
  );
}

// Everything a Protocol Page needs for one day, in one shape.
export function protocolToday(state, dateKey) {
  const run = activeProtocolRun(state);
  if (!run) return null;
  const day = protocolDay(run, dateKey);
  const decorate = (item) => ({
    ...item,
    completed: Boolean(
      state.protocol.completions[protocolCompletionId(item.id, dateKey)]?.completed,
    ),
  });
  const nonNegotiable = protocolItems(run, "non-negotiable").map(decorate);
  const negotiable = protocolItems(run, "negotiable").map(decorate);
  const seal = state.protocol.seals?.[protocolSealId(run.id, dateKey)] || null;
  return {
    run,
    day,
    isDraft: run.status === "draft",
    // The run is finished once the day after the last one arrives. It is not
    // ended by missing anything.
    isOver: run.status === "active" && day > run.days,
    keptAll:
      nonNegotiable.length > 0 && nonNegotiable.every((item) => item.completed),
    sealed: Boolean(seal?.sealed),
    seal,
    nonNegotiable,
    negotiable,
  };
}

// The Protocol home keeps the most recently finished phase in view. It reads
// the current completion records rather than freezing the controls, so even the
// last day can still be corrected after it has been sealed.
export function latestCompletedProtocol(state) {
  const run =
    Object.values(state.protocol?.runs || {})
      .filter((candidate) => candidate.status === "completed")
      .sort((left, right) =>
        String(right.endedAt || right.updatedAt || "").localeCompare(
          String(left.endedAt || left.updatedAt || ""),
        ),
      )[0] || null;
  if (!run) return null;
  const seals = Object.values(state.protocol?.seals || {})
    .filter((seal) => seal.runId === run.id)
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
  const seal = seals[0] || null;
  const dateKey = seal?.dateKey || run.startDateKey;
  const decorate = (item) => ({
    ...item,
    completed: Boolean(
      state.protocol.completions[protocolCompletionId(item.id, dateKey)]?.completed,
    ),
  });
  return {
    run,
    day: seal?.day || run.days,
    dateKey,
    sealed: Boolean(seal?.sealed),
    nonNegotiable: protocolItems(run, "non-negotiable").map(decorate),
    negotiable: protocolItems(run, "negotiable").map(decorate),
  };
}

function protocolDateFromTimestamp(value) {
  const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] || null;
}

function addProtocolDays(dateKey, amount) {
  const start = Date.parse(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(start)) return null;
  return new Date(start + amount * 86400000).toISOString().slice(0, 10);
}

// Protocol home is a read model over the records the phone already keeps. No
// aggregate is persisted: correcting one completion changes the next read.
export function protocolPhaseRecords(state) {
  const completions = Object.values(state.protocol?.completions || {});
  const seals = Object.values(state.protocol?.seals || {});
  return Object.values(state.protocol?.runs || {})
    .filter((run) => run.status === "completed" || run.status === "ended")
    .map((run) => {
      const runCompletions = completions.filter(
        (completion) => completion.runId === run.id,
      );
      const runSeals = seals.filter((seal) => seal.runId === run.id);
      const dateKeys = [...new Set(
        [...runCompletions, ...runSeals]
          .map((record) => record.dateKey)
          .filter(Boolean),
      )].sort();
      const terms = protocolItems(run).map((item) => ({
        id: item.id,
        text: item.text,
        kind: item.kind,
        keptDays: new Set(
          runCompletions
            .filter(
              (completion) =>
                completion.itemId === item.id && completion.completed,
            )
            .map((completion) => completion.dateKey),
        ).size,
      }));
      const required = terms.filter((item) => item.kind === "non-negotiable");
      const keptDays = required.length
        ? dateKeys.filter((dateKey) =>
            required.every((item) =>
              runCompletions.some(
                (completion) =>
                  completion.itemId === item.id &&
                  completion.dateKey === dateKey &&
                  completion.completed,
              ),
            ),
          ).length
        : 0;
      const scheduledEnd =
        run.status === "completed" && run.startDateKey
          ? addProtocolDays(run.startDateKey, Math.max(0, run.days - 1))
          : null;
      const observedEnd = [
        ...dateKeys,
        protocolDateFromTimestamp(run.endedAt),
      ]
        .filter(Boolean)
        .sort()
        .at(-1) || null;

      return {
        id: run.id,
        name: run.name,
        days: run.days,
        status: run.status,
        endedEarly: run.status === "ended",
        keptDays,
        startDateKey:
          run.startDateKey || protocolDateFromTimestamp(run.createdAt),
        endDateKey: scheduledEnd || observedEnd,
        terms,
        endedAt: run.endedAt,
        updatedAt: run.updatedAt,
      };
    })
    .sort((left, right) =>
      String(right.endedAt || right.updatedAt || "").localeCompare(
        String(left.endedAt || left.updatedAt || ""),
      ),
    );
}
