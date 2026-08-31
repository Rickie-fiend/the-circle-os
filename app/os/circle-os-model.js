import {
  captureAthenaThought,
  createAthenaMemory,
  forgetAthenaEvidence as forgetDerivedAthenaEvidence,
  mergeAthenaMemory,
  normalizeAthenaMemory,
} from "./athena-memory-model.js";
import { mergeSeenLines, rememberLine } from "./lines/line-pool.js";
import { mergeGoals, normalizeGoals } from "./goal-model.js";
import {
  mergeLineFeedback,
  normalizeLineFeedback,
  reactToLine,
} from "./lines/line-feedback.js";

export const CIRCLE_OS_STORAGE_KEY = "circle-os-state-v2";
export const CIRCLE_OS_LEGACY_STORAGE_KEY = "circle-os-state-v1";

export const DECLARATION_KINDS = Object.freeze([
  "vision",
  "missionStatement",
  "typicalTuesday",
  "dreamline",
]);

export const DREAMLINE_CATEGORIES = Object.freeze(["having", "being", "doing"]);
export const DREAMLINE_STEP_KEYS = Object.freeze(["now", "tomorrow", "dayAfter"]);
export const DREAMLINE_STAR_LIMIT = 4;

/**
 * The currencies a Dreamline can be priced in.
 *
 * Sai lives between Myanmar and Thailand and thinks in all three, so a target
 * income in the wrong one is not a target he can act on. Kyat has no minor
 * unit in practice, so it is shown whole.
 */
export const DREAMLINE_CURRENCIES = Object.freeze([
  { code: "USD", symbol: "$", minorDigits: 2 },
  { code: "MMK", symbol: "K", minorDigits: 0 },
  { code: "THB", symbol: "\u0e3f", minorDigits: 2 },
]);

export function dreamlineCurrency(code) {
  return (
    DREAMLINE_CURRENCIES.find((item) => item.code === code) ||
    DREAMLINE_CURRENCIES[0]
  );
}

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

/**
 * What a habit part is worth keeping as it is being typed.
 *
 * Storage must not trim. Normalising runs on every state update, so a trailing
 * space was removed between the keystroke and the render, the controlled
 * textarea read the trimmed value back, and no habit could contain a space at
 * all. Newlines and tabs still collapse, because a habit is one line.
 *
 * `cleanHabitPart` still trims, and is still right for composing and for
 * display, where the value has stopped changing.
 */
function keepHabitPart(value, maximum = 240) {
  return String(value || "").replace(/[^\S ]+/g, " ").slice(0, maximum);
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
  const action = cleanHabitPart(
    habit && Object.hasOwn(habit, "action") ? habit.action : habit?.text,
  );
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
      const text = keepHabitPart(definition?.text);
      const action = keepHabitPart(
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
          cue: keepHabitPart(definition?.cue),
          identity: keepHabitPart(definition?.identity),
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

function validMoment(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime())
    ? value
    : null;
}

function dreamlineMonths(value) {
  const months = Math.round(Number(value));
  return Number.isFinite(months) ? Math.max(1, Math.min(60, months)) : 6;
}

function dreamlineCents(value) {
  const cents = Math.round(Number(value));
  return Number.isFinite(cents) ? Math.max(0, cents) : 0;
}

function addUtcMonths(value, months) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMonth(date.getUTCMonth() + dreamlineMonths(months));
  return date.toISOString();
}

/**
 * The steps under one dream, in the order they are to be taken.
 *
 * They used to be three fixed slots — Now, Tomorrow, Day After — which is how
 * the paper worksheet prints them and is wrong for how the thing is actually
 * lived. Sai: "after the last step, there has to be a quiet option to add on
 * next step, and continuously ... we will be doing small steps toward the goal
 * everyday." A dream does not run out of steps on the third day.
 *
 * An ordered list, then. The three old keys migrate into the first three
 * places and keep their names as ids, so nothing written on the old shape is
 * lost and a step keeps its identity across the change.
 */
function normalizeDreamlineSteps(value) {
  const source = Array.isArray(value?.steps)
    ? value.steps
    : DREAMLINE_STEP_KEYS.map((step) => ({
        id: step,
        text: value?.steps?.[step],
        doneAt: value?.stepsDoneAt?.[step],
      }));
  const seen = new Set();
  return source
    .map((step, index) => {
      const text = cleanHabitPart(step?.text, 600);
      if (!text) return null;
      let id = cleanHabitPart(step?.id, 160) || `step-${index + 1}`;
      while (seen.has(id)) id = `${id}-${index + 1}`;
      seen.add(id);
      // A step is written once and ticked once, so the moment it was ticked is
      // the whole record of it.
      return { id, text, doneAt: validMoment(step?.doneAt) || null };
    })
    .filter(Boolean);
}

function normalizeDreamlineItem(key, value) {
  if (!value || !DREAMLINE_CATEGORIES.includes(value.category)) return null;
  const id = cleanHabitPart(value.id || key, 160);
  const text = cleanHabitPart(value.text, 480);
  if (!id || !text) return null;
  return {
    id,
    category: value.category,
    text,
    convertedDoing:
      value.category === "being"
        ? cleanHabitPart(value.convertedDoing, 480)
        : "",
    costCents: dreamlineCents(value.costCents),
    cadence: value.cadence === "one-time" ? "one-time" : "monthly",
    starred: Boolean(value.starred),
    steps: normalizeDreamlineSteps(value),
    // When the dream itself was reached. Sai: "we need a way to indicate we
    // have reached it." Steps can run out without the dream arriving, and the
    // dream can arrive with steps still unticked; they are different facts.
    reachedAt: validMoment(value.reachedAt) || null,
    createdAt: validMoment(value.createdAt) || validMoment(value.updatedAt) || "",
    updatedAt: validMoment(value.updatedAt) || validMoment(value.createdAt) || "",
  };
}

function normalizeDreamlines(value) {
  const records = {};
  for (const [key, candidate] of Object.entries(value?.records || {})) {
    if (!candidate || typeof candidate !== "object") continue;
    const id = cleanHabitPart(candidate.id || key, 160);
    const createdAt = validMoment(candidate.createdAt);
    const updatedAt = validMoment(candidate.updatedAt) || createdAt;
    if (!id || !createdAt || !updatedAt) continue;
    const status = ["active", "concluded"].includes(candidate.status)
      ? candidate.status
      : "active";
    const months = dreamlineMonths(candidate.months);
    const startedAt = validMoment(candidate.startedAt) || createdAt;
    const targetAt = validMoment(candidate.targetAt) || addUtcMonths(startedAt, months);
    const items = Object.fromEntries(
      Object.entries(candidate.items || {})
        .map(([itemId, item]) => {
          const normalized = normalizeDreamlineItem(itemId, item);
          return normalized ? [normalized.id, normalized] : null;
        })
        .filter(Boolean),
    );
    records[id] = {
      id,
      status,
      months,
      monthlyExpensesCents: dreamlineCents(candidate.monthlyExpensesCents),
      currency: dreamlineCurrency(candidate.currency).code,
      items,
      // When the Steps sheet was committed. Until this is set the Dreamline is
      // still being planned; after it, there is a thing to do today.
      stepsCommittedAt: validMoment(candidate.stepsCommittedAt) || null,
      createdAt,
      startedAt,
      targetAt,
      concludedAt:
        status === "concluded"
          ? validMoment(candidate.concludedAt) || targetAt || updatedAt
          : null,
      updatedAt,
    };
  }
  return { records };
}

export function createEmptyState() {
  return {
    version: 7,
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
    dreamlines: {
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
    // What he thought of the Lines he has read. Small on purpose: which line,
    // which reaction, when. A Line still collects nothing else.
    lineFeedback: {},
    // What each day of the week is for, and the smallest step toward it. A step
    // is a Routine task; see `goal-model.js`.
    goals: { items: {}, steps: {} },
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
    version: 7,
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
    dreamlines: normalizeDreamlines(state.dreamlines),
    evidence: {
      ...empty.evidence,
      ...(state.evidence || {}),
    },
    athenaMemory: normalizeAthenaMemory(state.athenaMemory),
    seenLines: mergeSeenLines(state.seenLines, []),
    lineFeedback: normalizeLineFeedback(state.lineFeedback),
    goals: normalizeGoals(state.goals),
    outbox: Array.isArray(state.outbox) ? state.outbox : [],
  };
}

/**
 * Record what he thought of a Line. Pressing the same reaction again takes it
 * back: a reaction given by accident on a reading surface has to be givable
 * back, and there is nowhere else to undo it from.
 */
export function reactToLineSeen(state, lineId, reaction, at = new Date().toISOString()) {
  const lineFeedback = reactToLine(state.lineFeedback, lineId, reaction, at);
  return { ...state, lineFeedback };
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
      ...(state.declarations || {}),
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
        ...(next.tasks || {}),
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

function dreamlineIsExpired(record, now = new Date()) {
  const target = new Date(record?.targetAt || "");
  return (
    record?.status === "active" &&
    !Number.isNaN(target.getTime()) &&
    target.getTime() <= now.getTime()
  );
}

function dreamlineView(record, now = new Date()) {
  if (!record) return null;
  if (!dreamlineIsExpired(record, now)) return record;
  return {
    ...record,
    status: "concluded",
    concludedAt: record.targetAt,
  };
}

export function dreamlineRecords(state, now = new Date()) {
  return Object.values(state.dreamlines?.records || {})
    .map((record) => dreamlineView(record, now))
    .filter(Boolean)
    .sort((left, right) =>
      String(right.createdAt || "").localeCompare(String(left.createdAt || "")),
    );
}

export function currentDreamline(state, now = new Date()) {
  return dreamlineRecords(state, now).find((record) => record.status === "active") || null;
}

function withDreamlineRecord(state, record, reason) {
  return queueProfileUpdate(
    {
      ...state,
      dreamlines: {
        ...(state.dreamlines || {}),
        records: {
          ...(state.dreamlines?.records || {}),
          [record.id]: record,
        },
      },
    },
    reason,
  );
}

export function startDreamline(
  state,
  {
    id = "",
    months = 6,
    monthlyExpensesCents = 0,
    currency = "USD",
    startedAt = new Date().toISOString(),
  } = {},
) {
  if (currentDreamline(state, new Date(startedAt))) {
    return { state, error: "Finish the current Dreamline before starting another." };
  }
  const recordId = id || freshRecordId(`dreamline-${new Date(startedAt).getTime()}`);
  if (state.dreamlines?.records?.[recordId]) return { state, error: "" };
  const cleanMonths = dreamlineMonths(months);
  const record = {
    id: recordId,
    status: "active",
    months: cleanMonths,
    monthlyExpensesCents: dreamlineCents(monthlyExpensesCents),
    currency: dreamlineCurrency(currency).code,
    items: {},
    stepsCommittedAt: null,
    createdAt: startedAt,
    startedAt,
    targetAt: addUtcMonths(startedAt, cleanMonths),
    concludedAt: null,
    updatedAt: startedAt,
  };
  return {
    state: withDreamlineRecord(state, record, "dreamline-started"),
    record,
    error: "",
  };
}

/**
 * @param {object} state
 * @param {string} recordId
 * @param {{months?: number | null, monthlyExpensesCents?: number | null, currency?: string | null, updatedAt?: string}} [options]
 */
export function updateDreamlineSetup(
  state,
  recordId,
  {
    months = null,
    monthlyExpensesCents = null,
    currency = null,
    updatedAt = new Date().toISOString(),
  } = {},
) {
  const record = state.dreamlines?.records?.[recordId];
  if (!record || record.status !== "active" || dreamlineIsExpired(record, new Date(updatedAt))) {
    return { state, error: "This Dreamline has concluded." };
  }
  const cleanMonths = dreamlineMonths(months ?? record.months);
  const next = {
    ...record,
    months: cleanMonths,
    monthlyExpensesCents: dreamlineCents(
      monthlyExpensesCents ?? record.monthlyExpensesCents,
    ),
    currency: dreamlineCurrency(currency ?? record.currency).code,
    targetAt: addUtcMonths(record.startedAt, cleanMonths),
    updatedAt,
  };
  return { state: withDreamlineRecord(state, next, "dreamline-setup"), record: next, error: "" };
}

export function saveDreamlineItem(
  state,
  recordId,
  value,
  { id = "", updatedAt = new Date().toISOString() } = {},
) {
  const record = state.dreamlines?.records?.[recordId];
  if (!record || record.status !== "active" || dreamlineIsExpired(record, new Date(updatedAt))) {
    return { state, error: "This Dreamline has concluded." };
  }
  const category = DREAMLINE_CATEGORIES.includes(value?.category)
    ? value.category
    : "";
  const text = cleanHabitPart(value?.text, 480);
  const convertedDoing =
    category === "being" ? cleanHabitPart(value?.convertedDoing, 480) : "";
  if (!category || !text) return { state, error: "Name the dream before saving it." };
  if (category === "being" && !convertedDoing) {
    return {
      state,
      error: "A Being needs the Doing that would make it real.",
    };
  }
  const itemId = id || cleanHabitPart(value?.id, 160) || freshRecordId(`dreamline-${category}`);
  const existing = record.items?.[itemId];
  if (!existing) {
    const categoryCount = Object.values(record.items || {}).filter(
      (item) => item.category === category,
    ).length;
    if (categoryCount >= 5) {
      return { state, error: `Keep ${category} to five lines.` };
    }
  }
  const item = {
    id: itemId,
    category,
    text,
    convertedDoing,
    costCents: dreamlineCents(value?.costCents),
    cadence: value?.cadence === "one-time" ? "one-time" : "monthly",
    starred: Boolean(existing?.starred),
    // An ordered ladder, and a new dream starts with none. Editing the words of
    // a dream never touches the steps already written under it.
    steps: Array.isArray(existing?.steps) ? existing.steps : [],
    reachedAt: validMoment(existing?.reachedAt) || null,
    createdAt: existing?.createdAt || updatedAt,
    updatedAt,
  };
  const next = {
    ...record,
    items: { ...(record.items || {}), [itemId]: item },
    updatedAt,
  };
  return {
    state: withDreamlineRecord(state, next, "dreamline-line"),
    record: next,
    item,
    error: "",
  };
}

export function setDreamlineStarred(
  state,
  recordId,
  itemId,
  starred,
  { updatedAt = new Date().toISOString() } = {},
) {
  const record = state.dreamlines?.records?.[recordId];
  const item = record?.items?.[itemId];
  if (!record || !item || record.status !== "active" || dreamlineIsExpired(record, new Date(updatedAt))) {
    return { state, error: "This Dreamline has concluded." };
  }
  if (starred && item.category === "being" && !cleanHabitPart(item.convertedDoing)) {
    return { state, error: "Turn this Being into a Doing before you star it." };
  }
  const starredCount = Object.values(record.items || {}).filter(
    (candidate) => candidate.starred && candidate.id !== itemId,
  ).length;
  if (starred && starredCount >= DREAMLINE_STAR_LIMIT) {
    return { state, error: "Choose no more than four dreams. The stars are your 80/20." };
  }
  const nextItem = { ...item, starred: Boolean(starred), updatedAt };
  const next = {
    ...record,
    items: { ...record.items, [itemId]: nextItem },
    updatedAt,
  };
  return { state: withDreamlineRecord(state, next, "dreamline-star"), item: nextItem, error: "" };
}

export function updateDreamlineStep(
  state,
  recordId,
  itemId,
  step,
  text,
  { updatedAt = new Date().toISOString() } = {},
) {
  const record = state.dreamlines?.records?.[recordId];
  const item = record?.items?.[itemId];
  if (!record || !item || record.status !== "active" || dreamlineIsExpired(record, new Date(updatedAt))) {
    return { state, error: "This Dreamline has concluded." };
  }
  if (!item.starred) return { state, error: "Star a dream before giving it steps." };
  const clean = cleanHabitPart(text, 600);
  const steps = item.steps || [];
  const at = steps.findIndex((entry) => entry.id === step);
  if (at === -1) return { state, error: "Unknown Dreamline step." };
  // Emptying a step removes it rather than leaving a numbered blank in the
  // track. The ones after it keep their ids, so nothing already ticked moves.
  const nextSteps = clean
    ? steps.map((entry) => (entry.id === step ? { ...entry, text: clean } : entry))
    : steps.filter((entry) => entry.id !== step);
  const nextItem = { ...item, steps: nextSteps, updatedAt };
  const next = {
    ...record,
    items: { ...record.items, [itemId]: nextItem },
    updatedAt,
  };
  return { state: withDreamlineRecord(state, next, "dreamline-step"), item: nextItem, error: "" };
}

/**
 * Add the next step to a dream, at the end of what is already there.
 *
 * Sai: "after the last step, there has to be a quiet option to add on next
 * step, and continuously." The ladder is not a fixed length — it goes on until
 * the dream is reached, which is a separate thing to say.
 */
export function addDreamlineStep(
  state,
  recordId,
  itemId,
  text = "",
  { updatedAt = new Date().toISOString(), id = freshRecordId("step") } = {},
) {
  const record = state.dreamlines?.records?.[recordId];
  const item = record?.items?.[itemId];
  if (!record || !item || record.status !== "active" || dreamlineIsExpired(record, new Date(updatedAt))) {
    return { state, error: "This Dreamline has concluded." };
  }
  if (!item.starred) return { state, error: "Star a dream before giving it steps." };
  // The words come first, then the step. An empty step would be a numbered
  // blank in the track, and a blank rung is not a plan.
  const clean = cleanHabitPart(text, 600);
  if (!clean) return { state, error: "Write the step before adding it." };
  const nextItem = {
    ...item,
    steps: [...(item.steps || []), { id, text: clean, doneAt: null }],
    updatedAt,
  };
  const next = {
    ...record,
    items: { ...record.items, [itemId]: nextItem },
    updatedAt,
  };
  return {
    state: withDreamlineRecord(state, next, "dreamline-step-added"),
    item: nextItem,
    stepId: id,
    error: "",
  };
}

/**
 * Say that the dream itself has been reached.
 *
 * Sai: "we need a way to indicate we have reached it." This is not the same as
 * ticking the last step — a ladder can run out before the thing arrives, and
 * the thing can arrive while a step is still unticked. Reaching it is the end
 * of the dream, so it is recorded on the dream and not on any step.
 */
export function setDreamlineReached(
  state,
  recordId,
  itemId,
  reached,
  { at = new Date().toISOString() } = {},
) {
  const record = state.dreamlines?.records?.[recordId];
  const item = record?.items?.[itemId];
  if (!record || !item || record.status !== "active") {
    return { state, error: "This Dreamline has concluded." };
  }
  const nextItem = { ...item, reachedAt: reached ? at : null, updatedAt: at };
  const next = {
    ...record,
    items: { ...record.items, [itemId]: nextItem },
    updatedAt: at,
  };
  return {
    state: withDreamlineRecord(state, next, "dreamline-reached"),
    item: nextItem,
    error: "",
  };
}

/**
 * Commit the Steps sheet, which is what turns a Dreamline from a plan into
 * something to do today.
 *
 * Sai: "after saving that, only then we may proceed to doing the actual
 * living, the first thing for today, and come and tick complete back."
 *
 * It refuses an empty commitment. A Dreamline with no Now step has nothing to
 * proceed to, and letting it through would put an empty Page where the day's
 * first action belongs.
 */
export function commitDreamlineSteps(
  state,
  recordId,
  { committedAt = new Date().toISOString() } = {},
) {
  const record = state.dreamlines?.records?.[recordId];
  if (!record || record.status !== "active" || dreamlineIsExpired(record, new Date(committedAt))) {
    return { state, error: "This Dreamline has concluded." };
  }
  const starred = Object.values(record.items).filter((item) => item.starred);
  if (!starred.length) {
    return { state, error: "Star at least one dream before saving your steps." };
  }
  if (!starred.some((item) => item.steps?.some((step) => step.text.trim()))) {
    return {
      state,
      error: "Give at least one starred dream a step you can take now.",
    };
  }
  const next = { ...record, stepsCommittedAt: committedAt, updatedAt: committedAt };
  return {
    state: withDreamlineRecord(state, next, "dreamline-steps-committed"),
    record: next,
    error: "",
  };
}

/**
 * Tick, or untick, one step. Ticking is how a Dreamline records that living
 * happened, so it is the only write on this app that is not planning.
 */
export function setDreamlineStepDone(
  state,
  recordId,
  itemId,
  step,
  done,
  { at = new Date().toISOString() } = {},
) {
  const record = state.dreamlines?.records?.[recordId];
  const item = record?.items?.[itemId];
  if (!record || !item || record.status !== "active") {
    return { state, error: "This Dreamline has concluded." };
  }
  const steps = item.steps || [];
  const target = steps.find((entry) => entry.id === step);
  if (!target) {
    return { state, error: "Unknown Dreamline step." };
  }
  if (!target.text.trim()) {
    return { state, error: "There is no step written here yet." };
  }
  const nextItem = {
    ...item,
    steps: steps.map((entry) =>
      entry.id === step ? { ...entry, doneAt: done ? at : null } : entry,
    ),
    updatedAt: at,
  };
  const next = {
    ...record,
    items: { ...record.items, [itemId]: nextItem },
    updatedAt: at,
  };
  return {
    state: withDreamlineRecord(state, next, "dreamline-step-done"),
    item: nextItem,
    error: "",
  };
}

/**
 * The one thing to do next, and nothing else.
 *
 * Steps are taken in the order they were written, and the dreams in the order
 * they were named. The first written-but-unticked step is what the app asks
 * for. Showing the whole plan here would make this a list again, and the point
 * of the Page is that there is exactly one thing on it.
 *
 * A dream already reached is finished asking. Sai: "we need a way to indicate
 * we have reached it" — and a reached dream that kept handing out steps would
 * make reaching it mean nothing.
 */
export function dreamlineToday(record) {
  if (!record || record.status !== "active" || !record.stepsCommittedAt) return null;
  const starred = Object.values(record.items)
    .filter((item) => item.starred && !item.reachedAt)
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
  for (const item of starred) {
    for (const step of item.steps || []) {
      if (step.text.trim() && !step.doneAt) {
        return { itemId: item.id, item, step: step.id, text: step.text.trim(), done: false };
      }
    }
  }
  // Everything written has been done. That is worth saying rather than showing
  // an empty Page.
  const written = starred.some((item) =>
    (item.steps || []).some((step) => step.text.trim()),
  );
  return written ? { itemId: "", item: null, step: null, text: "", done: true } : null;
}

export function dreamlineIncome(record) {
  const months = dreamlineMonths(record?.months);
  const totals = { having: 0, being: 0, doing: 0 };
  for (const item of Object.values(record?.items || {})) {
    if (!item.starred || !DREAMLINE_CATEGORIES.includes(item.category)) continue;
    const cost = dreamlineCents(item.costCents) / 100;
    totals[item.category] += item.cadence === "one-time" ? cost / months : cost;
  }
  const expenseBuffer = (dreamlineCents(record?.monthlyExpensesCents) / 100) * 1.3;
  const monthly = totals.having + totals.being + totals.doing + expenseBuffer;
  return {
    months,
    having: totals.having,
    being: totals.being,
    doing: totals.doing,
    expenseBuffer,
    monthly,
    daily: monthly / 30,
  };
}

export function concludeExpiredDreamlines(state, now = new Date()) {
  const timestamp = now.toISOString();
  let changed = false;
  const records = Object.fromEntries(
    Object.entries(state.dreamlines?.records || {}).map(([id, record]) => {
      if (!dreamlineIsExpired(record, now)) return [id, record];
      changed = true;
      return [
        id,
        {
          ...record,
          status: "concluded",
          concludedAt: record.targetAt || timestamp,
          updatedAt: timestamp,
        },
      ];
    }),
  );
  if (!changed) return state;
  return queueProfileUpdate(
    { ...state, dreamlines: { records } },
    "dreamline-concluded",
  );
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
      title: localDay.title || remoteDay.title || "",
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
    lineFeedback: mergeLineFeedback(local.lineFeedback, remote.lineFeedback),
    goals: mergeGoals(local.goals, remote.goals),
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
    dreamlines: {
      records: mergeUpdatedRecords(
        remote.dreamlines.records,
        local.dreamlines.records,
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

// A controlled editor must be allowed to hold the exact draft the person is
// typing. In particular, a trailing space is still part of the edit: cleaning
// it here makes React render the old value back into the textarea before the
// next character arrives. The blur boundary below commits and cleans the draft.
export function updateHabitDefinitionDraft(state, id, parts) {
  const current = state.habits.definitions[id];
  if (!current) return state;
  return {
    ...state,
    habits: {
      ...state.habits,
      definitions: {
        ...state.habits.definitions,
        [id]: {
          ...current,
          action: Object.hasOwn(parts || {}, "action")
            ? String(parts.action || "").slice(0, 240)
            : current.action || current.text,
          cue: Object.hasOwn(parts || {}, "cue")
            ? String(parts.cue || "").slice(0, 240)
            : current.cue,
          identity: Object.hasOwn(parts || {}, "identity")
            ? String(parts.identity || "").slice(0, 240)
            : current.identity,
          updatedAt: new Date().toISOString(),
        },
      },
    },
  };
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
                  ...(question.source ? { source: question.source } : {}),
                  answeredAt,
                },
              ]
            : previousAnswers,
        },
      },
    },
  };

  if (
    (kind === "thought" ||
      kind === "deep-thought" ||
      kind === "athena-reading") &&
    cleanAnswer
  ) {
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
    title: "",
    checkIns: [],
    mission: { ...DEFAULT_MISSION },
    missions: [],
    timeBlocks: [],
    logRange: null,
  };
}

/**
 * What he calls the day.
 *
 * The Log's heading was the fixed line "Your day, hour by hour", which
 * described the App rather than the day. Sai asked for it to be his own words,
 * editable the way Routine's identity and a Protocol's name already are — so a
 * day can be "Beautiful day" and mean it.
 */
export function setDayTitle(day, title) {
  // keepHabitPart, not cleanHabitPart. This is the live editor value: trimming
  // it eats the space the moment it is typed, so a two-word title can never be
  // written. Exactly the fault that stopped him typing a habit in Build 22, and
  // I put it back here three days later.
  return { ...day, title: keepHabitPart(title, 60) };
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

const WEEK_ACTIVITY_RULES = Object.freeze([
  // The particular reason for the time wins over what carried it. Being with
  // someone is more specific than the walk, meal, market or game around it.
  ["Time with other people", /\b(?:friend|friends|family|mom|cousin|bros|talk|dota)\b/],
  // Reading or writing is the point of coffee-and-journaling, not the coffee.
  ["Reading and reflection", /\b(?:read|reading|journal|journaling|reflect|reflection|meditation|meditate)\b|\bwrite one thing down\b/],
  ["Waking up", /\b(?:wake|wakeup|woke)\b/],
  ["Sleep and rest", /\b(?:sleep|bed|nap|rest)\b/],
  ["Personal care", /\b(?:shower|brush|wind down)\b/],
  // Smoking is more particular than the walk that sometimes accompanies it.
  ["Smoking", /\b(?:smoke|smoking)\b/],
  ["Entertainment", /\b(?:movie|game|entertainment|widow's bay|minions and monsters)\b/],
  ["Errands and travel", /\b(?:immigration|immegration|market|class|come back|back home|home)\b/],
  ["Project and creative work", /\b(?:project|computer|focus|work|working|edit|video|codex|build|content|practice|speaking|app|chapters|engine|os)\b/],
  ["Movement and outside time", /\b(?:walk|walking|gym|outdoor|outside|samrong|patio|exercise)\b/],
  ["Meals and coffee", /\b(?:lunch|dinner|breakfast|meal|eat|eating|coffee)\b/],
]);

function weekActivityText(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’]/g, "'");
}

export function weekActivityGroup(value = "") {
  const text = weekActivityText(value);
  return WEEK_ACTIVITY_RULES.find(([, pattern]) => pattern.test(text))?.[0] ||
    "Other recorded time";
}

export function weekActivityTally(state) {
  const tally = new Map();
  for (const day of Object.values(state?.days || {})) {
    for (const block of day?.timeBlocks || []) {
      const group = weekActivityGroup(block.title || block.activity);
      tally.set(group, (tally.get(group) || 0) + 1);
    }
  }
  return [...tally.entries()]
    .map(([group, blocks]) => ({ group, blocks }))
    .sort((left, right) => right.blocks - left.blocks || left.group.localeCompare(right.group));
}

function weekEvidenceDay(item, value, tone = "plain") {
  return { label: item.fullLabel, shortLabel: item.label, value, tone };
}

const WEEK_PERIODS = [
  { key: "morning", label: "Morning", start: 6 * 60, end: 12 * 60 },
  { key: "afternoon", label: "Afternoon", start: 12 * 60, end: 18 * 60 },
  { key: "evening", label: "Evening", start: 18 * 60, end: 22 * 60 },
  { key: "night", label: "Night", start: 22 * 60, end: 30 * 60 },
];

function blockCircleRange(block) {
  const start = circleTimeValue(block.start);
  let end = circleTimeValue(block.end);
  if (end <= start) end += 24 * 60;
  return { start, end };
}

function overlapMinutes(leftStart, leftEnd, rightStart, rightEnd) {
  return Math.max(0, Math.min(leftEnd, rightEnd) - Math.max(leftStart, rightStart));
}

function topActivity(rows) {
  return [...rows.entries()].sort((left, right) => right[1] - left[1])[0] || null;
}

const DISTINCTIVE_LIFT_MIN = 1.15;
const DISTINCTIVE_RECORDED_DAYS_MIN = 2;

function distinctiveActivity(
  activityMinutes,
  activityDays,
  periodMinutes,
  overallMinutes,
  overallTotalMinutes,
  excludedGroups,
) {
  return [...activityMinutes.entries()]
    .map(([group, minutes]) => {
      const periodShare = periodMinutes ? minutes / periodMinutes : 0;
      const overallShare = overallTotalMinutes
        ? (overallMinutes.get(group) || 0) / overallTotalMinutes
        : 0;
      return {
        group,
        minutes,
        recordedDays: activityDays.get(group)?.size || 0,
        lift: overallShare ? periodShare / overallShare : 0,
      };
    })
    .filter(
      (row) =>
        row.group !== "Other recorded time" &&
        !excludedGroups.has(row.group) &&
        row.recordedDays >= DISTINCTIVE_RECORDED_DAYS_MIN &&
        row.lift >= DISTINCTIVE_LIFT_MIN,
    )
    .sort(
      (left, right) => {
        const liftOrder = right.lift - left.lift;
        if (Math.abs(liftOrder) > 1e-9) return liftOrder;
        return (
          right.recordedDays - left.recordedDays ||
          right.minutes - left.minutes ||
          left.group.localeCompare(right.group)
        );
      },
    )[0] || null;
}

function sevenDayEvidence(days, values) {
  return days.map((item) =>
    weekEvidenceDay(
      item,
      values.has(item.key) ? "seen" : "quiet",
      values.has(item.key) ? "held" : "quiet",
    ),
  );
}

function activityFinding(group) {
  return String(group || "other recorded time").toLowerCase();
}

/**
 * Local weekly claims. These are arithmetic over the phone's state, never AI
 * prose. Fewer than three recorded days produces one explicit silence and no
 * pattern-shaped output.
 */
export function buildSevenDayClaims(state, now = new Date()) {
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
        ? "There is no recorded life here to call a seven-day pattern."
        : "There is not enough recorded life here to call a seven-day pattern yet.",
      working: { recordedDays: count },
      evidence: summary.days.map((item) =>
        weekEvidenceDay(item, days.some((day) => day.key === item.key) ? "recorded" : "quiet", days.some((day) => day.key === item.key) ? "held" : "quiet"),
      ),
    }];
  }

  const claims = [];
  const timeDays = days.filter((item) => item.day.timeBlocks.length > 0);
  const overallMinutes = new Map();
  let overallTotalMinutes = 0;
  for (const { day } of timeDays) {
    for (const block of day.timeBlocks) {
      const group = weekActivityGroup(block.title || block.activity);
      const minutes = minutesBetween(block.start, block.end);
      overallMinutes.set(group, (overallMinutes.get(group) || 0) + minutes);
      overallTotalMinutes += minutes;
    }
  }
  const usedPeriodGroups = new Set();
  for (const period of WEEK_PERIODS) {
    const activityMinutes = new Map();
    const activityDays = new Map();
    const dayMinutes = new Map();
    for (const item of timeDays) {
      for (const block of item.day.timeBlocks) {
        const range = blockCircleRange(block);
        const minutes = overlapMinutes(range.start, range.end, period.start, period.end);
        if (!minutes) continue;
        const group = weekActivityGroup(block.title || block.activity);
        activityMinutes.set(group, (activityMinutes.get(group) || 0) + minutes);
        const groupDays = activityDays.get(group) || new Set();
        groupDays.add(item.key);
        activityDays.set(group, groupDays);
        dayMinutes.set(item.key, (dayMinutes.get(item.key) || 0) + minutes);
      }
    }
    const periodTotalMinutes = [...activityMinutes.values()].reduce(
      (total, minutes) => total + minutes,
      0,
    );
    const distinctive = distinctiveActivity(
      activityMinutes,
      activityDays,
      periodTotalMinutes,
      overallMinutes,
      overallTotalMinutes,
      usedPeriodGroups,
    );
    if (dayMinutes.size < 3 || !activityMinutes.size) {
      claims.push({
        key: period.key,
        label: period.label,
        sentence: `There is not enough recorded ${period.key} time to call a pattern yet.`,
        working: { recordedDays: dayMinutes.size, minutes: 0 },
        evidence: dayMinutes.size
          ? sevenDayEvidence(summary.days, dayMinutes)
          : summary.days.map((item) => weekEvidenceDay(item, "quiet", "quiet")),
      });
      continue;
    }
    if (!distinctive) {
      claims.push({
        key: period.key,
        label: period.label,
        sentence: `Your ${period.key}s look much like the rest of your day.`,
        working: {
          recordedDays: dayMinutes.size,
          minutes: periodTotalMinutes,
          lift: 1,
        },
        evidence: sevenDayEvidence(summary.days, dayMinutes),
      });
      continue;
    }
    usedPeriodGroups.add(distinctive.group);
    claims.push({
      key: period.key,
      label: period.label,
      sentence: `Your ${period.key}s are where ${activityFinding(distinctive.group)} stands apart.`,
      working: {
        recordedDays: dayMinutes.size,
        minutes: distinctive.minutes,
        lift: distinctive.lift,
      },
      evidence: sevenDayEvidence(summary.days, dayMinutes),
    });
  }

  const dayKinds = { weekday: [], weekend: [] };
  for (const item of timeDays) {
    const weekday = new Date(`${item.key}T12:00:00`).getDay();
    dayKinds[weekday === 0 || weekday === 6 ? "weekend" : "weekday"].push(item);
  }
  const allocations = {};
  for (const [kind, kindDays] of Object.entries(dayKinds)) {
    const rows = new Map();
    for (const item of kindDays) {
      for (const block of item.day.timeBlocks) {
        const group = weekActivityGroup(block.title || block.activity);
        rows.set(group, (rows.get(group) || 0) + minutesBetween(block.start, block.end));
      }
    }
    allocations[kind] = topActivity(rows);
  }
  const weekdayCount = dayKinds.weekday.length;
  const weekendCount = dayKinds.weekend.length;
  if (weekdayCount >= 2 && weekendCount >= 2 && allocations.weekday && allocations.weekend) {
    const weekdayTop = allocations.weekday[0];
    const weekendTop = allocations.weekend[0];
    claims.push({
      key: "weekday-weekend",
      label: "Week and weekend",
      sentence: weekdayTop === weekendTop
        ? `Your weekdays and weekends are mostly for ${activityFinding(weekdayTop)}.`
        : `Your weekdays are mostly for ${activityFinding(weekdayTop)}, while your weekends are mostly for ${activityFinding(weekendTop)}.`,
      working: { weekdayDays: weekdayCount, weekendDays: weekendCount },
      evidence: [
        { label: "Recorded weekdays", shortLabel: "Weekdays", value: weekdayTop, tone: "plain" },
        { label: "Recorded weekend days", shortLabel: "Weekend", value: weekendTop, tone: "plain" },
      ],
    });
  } else {
    claims.push({
      key: "weekday-weekend",
      label: "Week and weekend",
      sentence: "There is not enough weekday and weekend time to compare yet.",
      working: { weekdayDays: weekdayCount, weekendDays: weekendCount },
      evidence: [
        { label: "Recorded weekdays", shortLabel: "Weekdays", value: "still learning", tone: "quiet" },
        { label: "Recorded weekend days", shortLabel: "Weekend", value: "still learning", tone: "quiet" },
      ],
    });
  }

  const allocation = new Map();
  for (const { day } of timeDays) {
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
      label: "Where time went",
      sentence: `More of your recorded time goes to ${activityFinding(group)} than anything else.`,
      working: { recordedDays: timeDays.length, minutes },
      evidence: allocationRows.slice(0, 4).map(([label]) => ({
        label,
        shortLabel: label,
        value: label === group ? "most" : "also present",
        tone: label === group ? "held" : "plain",
      })),
    });
  }
  return claims;
}

// Kept for older callers and tests. Week Review remains a seven-Circle-day
// read with no stored aggregate.
export const buildWeekClaims = buildSevenDayClaims;

const WEEK_ACTIVITY_PHRASES = Object.freeze({
  "Time with other people": "time with people",
  "Reading and reflection": "reading and reflection",
  "Waking up": "waking up",
  "Sleep and rest": "sleep and rest",
  "Personal care": "personal care",
  Smoking: "smoking",
  Entertainment: "entertainment",
  "Errands and travel": "errands and travel",
  "Project and creative work": "project work",
  "Movement and outside time": "walking",
  "Meals and coffee": "meals and coffee",
});

function naturalList(values) {
  if (values.length < 2) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function capitalized(value) {
  const text = String(value || "").trim();
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : "";
}

function weekHabitLabel(habit) {
  return weekStatementLabel(habit?.action || habit?.text || "");
}

function weekStatementLabel(value) {
  return cleanHabitPart(value).replace(/[.!?]+$/g, "");
}

/**
 * The seven-page Week Review read model. It recomputes from current evidence,
 * keeps all numeric working local, and never persists a weekly aggregate.
 */
export function buildWeekReview(state, now = new Date()) {
  const summary = summarizeWeek(state, now);
  const claims = buildSevenDayClaims(state, now);
  const periodClaims = WEEK_PERIODS.map((period) =>
    claims.find((claim) => claim.key === period.key) || {
      key: period.key,
      label: period.label,
      sentence: `There is not enough recorded ${period.key} time to call a pattern yet.`,
      working: { recordedDays: 0, minutes: 0 },
      evidence: summary.days.map((item) =>
        weekEvidenceDay(item, "quiet", "quiet"),
      ),
    },
  );
  const timeDays = summary.days.filter((item) => item.day.timeBlocks.length);
  const recordedDays = summary.days.filter(({ key, day }) => {
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

  const activityDays = new Map();
  for (const item of timeDays) {
    for (const block of item.day.timeBlocks) {
      const group = weekActivityGroup(block.title || block.activity);
      const seen = activityDays.get(group) || new Set();
      seen.add(item.key);
      activityDays.set(group, seen);
    }
  }
  const recurringMinimum = Math.max(2, Math.ceil(timeDays.length * 0.7));
  const recurring = [...activityDays.entries()]
    .filter(
      ([group, days]) =>
        group !== "Other recorded time" &&
        group !== "Waking up" &&
        group !== "Sleep and rest" &&
        days.size >= recurringMinimum,
    )
    .sort(
      (left, right) =>
        right[1].size - left[1].size || left[0].localeCompare(right[0]),
    )
    .slice(0, 3);
  const recurringGroups = recurring.map(([group]) => group);
  const recurringPhrases = recurringGroups.map(
    (group) => WEEK_ACTIVITY_PHRASES[group] || activityFinding(group),
  );
  const recurringDays = new Set(
    recurring.flatMap(([, days]) => [...days]),
  );
  const dailyPattern = {
    key: "daily-pattern",
    label: "Daily pattern",
    sentence:
      recordedDays.length < 3
        ? "There is not enough recorded life to call a daily pattern yet."
        : recurringPhrases.length
          ? `${capitalized(naturalList(recurringPhrases))} ${recurringPhrases.length === 1 ? "keeps" : "keep"} returning through your week.`
          : "No activity repeats enough to call it a daily pattern yet.",
    working: {
      recordedDays: recordedDays.length,
      recurringMinimum,
      recurringGroups: recurring.map(([group, days]) => ({
        group,
        recordedDays: days.size,
      })),
    },
    evidence: sevenDayEvidence(summary.days, recurringDays),
  };

  const dateKeys = new Set(summary.days.map((item) => item.key));
  const lastRecordedKey = recordedDays.at(-1)?.key || summary.days.at(-1)?.key || "";
  const habitRows = Object.values(state.habits?.definitions || {})
    .filter((habit) => habit?.status !== "archived" && weekHabitLabel(habit))
    .map((habit) => {
      const completionKeys = Object.values(state.habits?.completions || {})
        .filter(
          (completion) =>
            completion?.habitId === habit.id &&
            completion.completed &&
            dateKeys.has(completion.dateKey),
        )
        .map((completion) => completion.dateKey)
        .sort();
      return {
        habit,
        label: weekHabitLabel(habit),
        completionKeys: [...new Set(completionKeys)],
      };
    });
  const keptHabit = [...habitRows]
    .filter((row) => row.completionKeys.length >= 2)
    .sort(
      (left, right) =>
        right.completionKeys.length - left.completionKeys.length ||
        left.label.localeCompare(right.label),
    )[0] || null;
  const droppedHabit = [...habitRows]
    .filter(
      (row) =>
        row.habit.id !== keptHabit?.habit.id &&
        row.completionKeys.length >= 2 &&
        row.completionKeys.at(-1) < lastRecordedKey,
    )
    .sort(
      (left, right) =>
        String(right.completionKeys.at(-1)).localeCompare(
          String(left.completionKeys.at(-1)),
        ) || right.completionKeys.length - left.completionKeys.length,
    )[0] || null;
  const completedTask = Object.values(state.tasks?.items || {})
    .filter(
      (task) =>
        task?.status === "completed" &&
        dateKeys.has(String(task.completedAt || "").slice(0, 10)) &&
        String(task.text || "").trim(),
    )
    .sort((left, right) =>
      String(right.completedAt || "").localeCompare(String(left.completedAt || "")),
    )[0] || null;
  const sealedDays = Object.values(state.protocol?.seals || {}).filter(
    (seal) => seal?.sealed && dateKeys.has(seal.dateKey),
  );

  const keptSentence = keptHabit
    ? `You kept ${keptHabit.label} on ${keptHabit.completionKeys.length} days.`
    : completedTask
      ? `You finished ${weekStatementLabel(completedTask.text)}.`
      : sealedDays.length
        ? `You kept ${weekStatementLabel(sealedDays.at(-1).phaseName || "your protocol")} on ${sealedDays.length} days.`
        : "Nothing was clearly kept yet.";
  const notKeptSentence = droppedHabit
    ? `${capitalized(droppedHabit.label)} stopped after ${droppedHabit.completionKeys.length} days.`
    : "Nothing you began was clearly dropped.";
  const week = {
    key: "week",
    label: "The week",
    sentence: `${keptSentence} ${notKeptSentence}`,
    working: {
      recordedDays: recordedDays.length,
      keptHabitDays: keptHabit?.completionKeys.length || 0,
      droppedHabitDays: droppedHabit?.completionKeys.length || 0,
      completedTasks: completedTask ? 1 : 0,
      sealedProtocolDays: sealedDays.length,
    },
    evidence: [
      {
        label: "What held",
        shortLabel: "Kept",
        value: keptHabit?.label || weekStatementLabel(completedTask?.text || sealedDays.at(-1)?.phaseName || "still learning"),
        tone: keptHabit || completedTask || sealedDays.length ? "held" : "quiet",
      },
      {
        label: "What did not hold",
        shortLabel: "Not kept",
        value: droppedHabit?.label || "nothing clear",
        tone: droppedHabit ? "plain" : "quiet",
      },
    ],
  };

  return {
    version: `week-review-v1:${summary.days.at(-1)?.key || "empty"}:${Number(state.evidence?.localRevision || 0)}`,
    dailyPattern,
    periods: periodClaims,
    week,
    groupTally: weekActivityTally(state),
  };
}

/** "at night", not "in the night". */
const YESTERDAY_PREPOSITIONS = Object.freeze({
  morning: "in the morning",
  afternoon: "in the afternoon",
  evening: "in the evening",
  night: "at night",
});

/**
 * A reading names a thing; it does not quote it whole. Sai writes tasks that
 * are sometimes a paragraph of bug report, and dropping one of those in turns
 * the reading into the task list it was meant to summarise. The Log is where
 * the full text lives; this is the reading of it.
 */
function yesterdayLabel(value, maximum = 40) {
  const text = weekStatementLabel(value);
  if (text.length <= maximum) return text;
  const cut = text.slice(0, maximum);
  const boundary = cut.lastIndexOf(" ");
  return `${(boundary > maximum * 0.6 ? cut.slice(0, boundary) : cut).trim()}…`;
}

const YESTERDAY_WEEKDAYS = Object.freeze([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

/**
 * The day just gone, read rather than tallied.
 *
 * Sai: "when i reflect, i sometimes want to know what i did and achieve
 * yesterday." Week Review answers that for a week and Athena's Reading answers
 * it for a life; nothing answered it for a day. This is the same mirror at the
 * finest grain it has, and it reads the same evidence: the hours he logged,
 * the habits he ticked, the tasks he finished and whether the protocol sealed.
 *
 * Two Pages, because he asked two questions. What he did, in the order the day
 * happened. What he achieved, which is a different question and often has a
 * different answer.
 */
export function buildYesterdayReview(state, now = new Date()) {
  const dateKey = previousDateKey(getDateKey(now));
  const day = state.days?.[dateKey] ?? createDay(dateKey);
  const record = dayRecord(state, dateKey);
  const sealed = Object.values(state.protocol?.seals || {}).find(
    (seal) => seal?.sealed && seal.dateKey === dateKey,
  );
  const [year, month, dayOfMonth] = dateKey.split("-").map(Number);
  const dateLabel =
    YESTERDAY_WEEKDAYS[
      new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay()
    ] || "Yesterday";

  // What he did, in the order it happened. Not the biggest thing in the day —
  // the day read forwards, so it sounds like a day rather than a leaderboard.
  const periodPhrases = [];
  for (const period of WEEK_PERIODS) {
    const minutes = new Map();
    for (const block of day.timeBlocks) {
      const range = blockCircleRange(block);
      const overlap = overlapMinutes(
        range.start,
        range.end,
        period.start,
        period.end,
      );
      if (!overlap) continue;
      const group = weekActivityGroup(block.title || block.activity);
      minutes.set(group, (minutes.get(group) || 0) + overlap);
    }
    const top = topActivity(minutes);
    if (!top) continue;
    periodPhrases.push({
      period: period.key,
      label: period.label,
      phrase: WEEK_ACTIVITY_PHRASES[top[0]] || activityFinding(top[0]),
    });
  }

  // Neighbouring parts of the day that held the same thing are said once.
  // "walking in the afternoon, walking in the evening" is the same fact twice.
  const runs = [];
  for (const item of periodPhrases) {
    const last = runs.at(-1);
    if (last && last.phrase === item.phrase) last.periods.push(item.period);
    else runs.push({ phrase: item.phrase, periods: [item.period] });
  }
  const runClauses = runs.map((run) =>
    run.periods.length === 1
      ? `${run.phrase} ${YESTERDAY_PREPOSITIONS[run.periods[0]] || `in the ${run.periods[0]}`}`
      : `${run.phrase} in the ${naturalList(run.periods)}`,
  );
  const didSentence = !day.timeBlocks.length
    ? `You did not log any hours on ${dateLabel}.`
    : runs.length === 1
      ? `${dateLabel} went almost entirely to ${runs[0].phrase}.`
      : `${dateLabel} went to ${naturalList(runClauses)}.`;

  // Two of each, named. A reading that lists everything is the record again.
  const kept = record.habits
    .map((habit) => yesterdayLabel(habit.text))
    .filter(Boolean);
  const finished = record.tasks
    .map((task) => yesterdayLabel(task.text))
    .filter(Boolean);
  const missed = Object.values(state.habits?.definitions || {})
    .filter(
      (habit) =>
        habit?.status === "active" &&
        !record.habits.some((done) => done.id === habit.id) &&
        weekHabitLabel(habit),
    )
    .map((habit) => weekHabitLabel(habit));

  // Two things, named. Four made a sentence that ran the App Box to 442px and
  // read as a list rather than as an answer to "what did I achieve".
  const achievements = [
    ...kept.map((label) => ({ verb: "kept", label })),
    ...finished.map((label) => ({ verb: "finished", label })),
    ...(sealed
      ? [
          {
            verb: "sealed",
            label: yesterdayLabel(sealed.phaseName || "your protocol"),
          },
        ]
      : []),
  ].slice(0, 2);
  const achievedParts = [];
  for (const item of achievements) {
    const last = achievedParts.at(-1);
    if (last?.verb === item.verb) last.labels.push(item.label);
    else achievedParts.push({ verb: item.verb, labels: [item.label] });
  }
  const achievedSentence = achievedParts.length
    ? // A trimmed label already ends in an ellipsis; it does not also take a
      // full stop.
      `${capitalized(
        naturalList(
          achievedParts.map(
            (part) => `you ${part.verb} ${naturalList(part.labels)}`,
          ),
        ),
      )}.`.replace(/…\.$/, "…")
    : day.timeBlocks.length
      ? `Nothing was ticked on ${dateLabel}, though the hours were logged.`
      : `Nothing was recorded on ${dateLabel}.`;

  return {
    version: `yesterday-v1:${dateKey}:${Number(state.evidence?.localRevision || 0)}`,
    dateKey,
    dateLabel,
    recorded: Boolean(day.timeBlocks.length || record.total || sealed),
    did: {
      key: "did",
      label: "What you did",
      sentence: didSentence,
      working: { loggedHours: day.timeBlocks.length },
      evidence: periodPhrases.map((item) => ({
        label: item.label,
        shortLabel: item.label.slice(0, 1),
        value: item.phrase,
        tone: "held",
      })),
    },
    achieved: {
      key: "achieved",
      label: "What you achieved",
      sentence: achievedSentence,
      working: {
        keptHabits: kept.length,
        completedTasks: finished.length,
        sealedProtocol: Boolean(sealed),
      },
      // Three rows at most: two things that held and the one that did not.
      // Listing every tick made the Page 466px against a 344px App Box, and an
      // App Box full of ticks is the Record again rather than a reading of it.
      evidence: [
        ...[
          ...kept.map((label) => ({ label: "Kept", shortLabel: "Kept", value: label, tone: "held" })),
          ...finished.map((label) => ({ label: "Finished", shortLabel: "Done", value: label, tone: "held" })),
        ].slice(0, 2),
        ...missed.slice(0, 1).map((label) => ({
          label: "Not kept",
          shortLabel: "Not kept",
          value: label,
          tone: "plain",
        })),
      ],
    },
  };
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
      // Empty on purpose. A pre-filled name reads as a decision already made,
      // so nobody discovers they can change it. Sai: "the protocol name should
      // be a placeholder. If user leave it blank then it will be use as default
      // and title of the protocol. Currently it always filled so that new user
      // might not know that they can edit."
      name: "",
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
    // A phase that was never named takes the default at the moment it begins,
    // so the name is settled once and the record is never blank.
    name: run.name.trim() || PROTOCOL_DEFAULT_NAME,
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

// A phase record is evidence, so removing it from the Page archives the run
// rather than deleting its key. The newer timestamp lets the phone's ordinary
// record merge defeat an older server copy instead of resurrecting the phase.
/**
 * A phase drafted and then thought better of leaves nothing behind.
 *
 * A draft has not begun: no day of it has been lived and no term was agreed, so
 * there is no record to keep and it is deleted rather than archived. Without a
 * way out, backing off a phase meant beginning one and ending it immediately,
 * which wrote a phase into the standing that never happened. Sai: "after i
 * click ok start the phase and dont want to, i cant go back by top left button
 * so that i have to type random to start the phase and end again, thats where 9
 * protocols come from."
 */
export function discardProtocolDraft(state, runId) {
  const run = state.protocol?.runs?.[runId];
  if (!run || run.status !== "draft") return state;
  const runs = { ...state.protocol.runs };
  delete runs[runId];
  return { ...state, protocol: { ...state.protocol, runs } };
}

export function archiveProtocolRun(state, runId) {
  const run = state.protocol?.runs?.[runId];
  if (
    !run ||
    (run.status !== "completed" && run.status !== "ended") ||
    run.archivedAt
  ) {
    return state;
  }
  const timestamp = now();
  return queueProfileUpdate(
    writeRun(state, {
      ...run,
      archivedAt: timestamp,
      updatedAt: timestamp,
    }),
    "protocol",
  );
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
      .filter(
        (candidate) => candidate.status === "completed" && !candidate.archivedAt,
      )
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
/**
 * What the Protocol App has actually held, across every phase.
 *
 * With nothing running the Page was an App Label, a folded record and a button,
 * and Sai had nine phases behind it that it said nothing about. Sai: "Can we add
 * more to this protocol screen?"
 *
 * This is not a reading back — he does not do that, and said so. It is the
 * standing fact of what he has kept, so starting the tenth phase happens in
 * front of the nine. Everything here is counted from completions and seals he
 * recorded himself; nothing is averaged, scored or praised. A phase ended early
 * still counts every day it was kept, because those days happened.
 *
 * Takes the records rather than the state, so the Page can derive it from what
 * it already has and the sum is testable on its own.
 */
export function protocolStanding(records) {
  if (!Array.isArray(records) || !records.length) return null;
  const longest = records.reduce(
    (best, record) => (record.keptDays > best.keptDays ? record : best),
    records[0],
  );
  return {
    phases: records.length,
    finished: records.filter((record) => !record.endedEarly).length,
    daysKept: records.reduce((total, record) => total + record.keptDays, 0),
    longestDays: longest.keptDays,
    longestName: longest.name,
  };
}

export function protocolPhaseRecords(state) {
  const completions = Object.values(state.protocol?.completions || {});
  const seals = Object.values(state.protocol?.seals || {});
  return Object.values(state.protocol?.runs || {})
    .filter(
      (run) =>
        (run.status === "completed" || run.status === "ended") &&
        !run.archivedAt,
    )
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

/**
 * Where a Dreamline stands, for the Page that asks whether he is getting
 * closer.
 *
 * Sai: "The main page for the dreamline will be used to see if i am actually
 * getting closer to my goal, my lifestyle."
 *
 * It counts steps rather than money, because a step is the only thing here he
 * actually does. The target income is what the dream costs, not progress
 * toward it, and showing it as a bar would be inventing a number the app has
 * no evidence for.
 */
export function dreamlineProgress(record, now = new Date()) {
  if (!record || record.status !== "active") return null;
  const starred = Object.values(record.items)
    .filter((item) => item.starred)
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
  const lines = starred.map((item) => {
    const written = (item.steps || []).filter((step) => step.text.trim());
    const done = written.filter((step) => step.doneAt);
    return {
      id: item.id,
      label: item.category === "being" ? item.convertedDoing || item.text : item.text,
      written: written.length,
      done: done.length,
      reached: Boolean(item.reachedAt),
    };
  });
  const written = lines.reduce((total, line) => total + line.written, 0);
  const done = lines.reduce((total, line) => total + line.done, 0);
  const target = record.targetAt ? new Date(record.targetAt) : null;
  const daysLeft = target
    ? Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000))
    : null;
  return {
    lines,
    written,
    done,
    daysLeft,
    committed: Boolean(record.stepsCommittedAt),
    // Said in words, because a fraction with nothing behind it reads as a score.
    sentence: !record.stepsCommittedAt
      ? "Nothing is moving yet. Save your steps and the first one becomes today's."
      : !written
        ? "Nothing is written to do. The dreams are named but no step carries them."
        : done === 0
          ? "Named and costed, and not started. The first step is still waiting."
          : done < written
            ? "Moving. Some of what you wrote down has been done."
            : "Every step you wrote is done. Write the next ones.",
  };
}

/**
 * The whole strategy: every starred dream, and every step under it.
 *
 * Sai: "those all 3 steps be visible and only able to click one after another
 * ... so that we can see the whole strategy and our goal."
 *
 * A dream is not a task, it is a short sequence, and seeing the sequence is the
 * point — a watch takes three steps and you can see all three. Only one step is
 * live at a time: the first one not yet done. The steps behind it are done and
 * the ones ahead are not offered, because offering step three before step one
 * is how a plan becomes a list.
 *
 * The most recent done step stays live so it can be undone. Sai: "when i
 * accidently click on it, and no way to revert."
 */
export function dreamlineStrategy(record) {
  if (!record || record.status !== "active") return [];
  const groups = { having: "Having", being: "Being", doing: "Doing" };
  return Object.values(record.items)
    .filter((item) => item.starred)
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
    .map((item) => {
      const written = (item.steps || []).filter((step) => step.text.trim());
      const activeIndex = written.findIndex((step) => !step.doneAt);
      // The most recent done step, which stays live so it can be given back.
      const lastDone = activeIndex === -1 ? written.length - 1 : activeIndex - 1;
      const reached = Boolean(item.reachedAt);
      return {
        id: item.id,
        group: groups[item.category] || item.category,
        name: item.category === "being" ? item.convertedDoing || item.text : item.text,
        complete: written.length > 0 && activeIndex === -1,
        reached,
        // A reached dream stops asking for anything; the ladder under it is
        // history rather than a plan.
        steps: written.map((step, index) => ({
          step: step.id,
          label: `Step ${index + 1}`,
          text: step.text.trim(),
          done: Boolean(step.doneAt),
          state: reached
            ? "achieved"
            : index === activeIndex
              ? "active"
              : index === lastDone
                ? "undoable"
                : index < activeIndex || activeIndex === -1
                  ? // Done and behind him. Sai: "after we sat the forth one, the
                    // previous done 3 days will be faded and achieved."
                    "achieved"
                  : "locked",
        })),
      };
    })
    .filter((line) => line.steps.length);
}
