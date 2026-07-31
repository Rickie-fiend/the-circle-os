export const CIRCLE_OS_STORAGE_KEY = "circle-os-state-v2";
export const CIRCLE_OS_LEGACY_STORAGE_KEY = "circle-os-state-v1";

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
  };
}

export function createEmptyState() {
  return {
    version: 3,
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
  if (!sessions.typicalTuesday.text) {
    sessions.typicalTuesday.text = state.profile.vision?.preview || description;
  }
  if (!sessions.whatMatters.text && state.profile.vision?.understanding) {
    sessions.whatMatters.text = state.profile.vision.understanding;
  }
  if (!sessions.gap.text && state.profile.vision?.gap) {
    sessions.gap.text = state.profile.vision.gap;
  }
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

  return {
    ...empty,
    ...state,
    version: 3,
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
    outbox: Array.isArray(state.outbox) ? state.outbox : [],
  };
}

export function queueProfileUpdate(state, reason) {
  const alreadyQueued = state.outbox.some((item) => item.reason === reason);
  if (alreadyQueued) return state;
  return {
    ...state,
    outbox: [
      ...state.outbox,
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        reason,
        createdAt: new Date().toISOString(),
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
      missions: localDay.missions?.length
        ? localDay.missions
        : remoteDay.missions ?? [],
      checkIns: localDay.checkIns ?? remoteDay.checkIns ?? [],
      timeBlocks: localDay.timeBlocks ?? remoteDay.timeBlocks ?? [],
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
    appSessions: {
      ...remote.appSessions,
      ...mergeUpdatedRecords(remote.appSessions, local.appSessions),
    },
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
                  answeredAt: new Date().toISOString(),
                },
              ]
            : previousAnswers,
        },
      },
    },
  };

  if (kind === "habit" && question.id === "habit-action") {
    const identity =
      next.profile.profileCase.survey.answers.find(
        (item) => item.questionId === "habit-identity",
      )?.answer || "Yourself";
    const dateKey = getDateKey();
    const day = next.days[dateKey] || createDay(dateKey);
    next = {
      ...next,
      profile: {
        ...next.profile,
        identityFocus: identity,
      },
      days: {
        ...next.days,
        [dateKey]: {
          ...day,
          mission: {
            ...day.mission,
            text: cleanAnswer,
            identity,
            completed: false,
            completedAt: null,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    };
  }

  return queueProfileUpdate(
    next,
    kind === "habit" ? "habit-answer" : "survey-answer",
  );
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
