export const CIRCLE_OS_STORAGE_KEY = "circle-os-state-v1";

export const DAY_PERIODS = [
  { id: "morning", label: "Morning", hours: "5–10" },
  { id: "midday", label: "Midday", hours: "10–14" },
  { id: "afternoon", label: "Afternoon", hours: "14–19" },
  { id: "evening", label: "Evening", hours: "19–5" },
];

export const ACTIVITIES = [
  "Focus",
  "Reading",
  "Exercise",
  "Outside",
  "Social",
  "Rest",
  "Entertainment",
  "Life admin",
];

export const MOODS = ["Clear", "Calm", "Restless", "Heavy", "Alive"];

const DEFAULT_MISSION = {
  text: "Put the book where you will see it tonight.",
  why: "Make the next page easier to begin.",
  identity: "Reader",
  completed: false,
  completedAt: null,
};

export function createEmptyState() {
  return {
    version: 1,
    profile: {
      identityFocus: "Reader",
      name: "",
      age: null,
      vision: {
        description: "",
        preview: "",
        understanding: "",
        gap: "",
        completedAt: null,
      },
    },
    days: {},
  };
}

export function normalizeState(state) {
  const empty = createEmptyState();
  if (!state || state.version !== 1 || !state.days || !state.profile) {
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

  return {
    ...state,
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
    },
  };
}

export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
    timeBlocks: [],
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
  if (index === -1) {
    return {
      ...day,
      timeBlocks: [...day.timeBlocks, nextBlock].sort((a, b) =>
        a.start.localeCompare(b.start),
      ),
    };
  }

  const timeBlocks = [...day.timeBlocks];
  timeBlocks[index] = nextBlock;
  timeBlocks.sort((a, b) => a.start.localeCompare(b.start));
  return { ...day, timeBlocks };
}

export function minutesBetween(start, end) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
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
  const missionDays = days.filter(({ day }) => day.mission);
  const completedMissions = missionDays.filter(
    ({ day }) => day.mission?.completed,
  );
  const readingBlocks = days.flatMap(({ day }) =>
    day.timeBlocks.filter((block) => block.activity === "Reading"),
  );

  let sentence = "There is not enough evidence to say.";
  let experiment = "Record one honest part of today. Nothing more.";
  if (recorded >= 4 || totalMinutes >= 180) {
    const top = time[0];
    if (top) {
      sentence = `${top.activity} held the largest share of the time you recorded this week.`;
      experiment =
        top.activity === "Reading"
          ? "Leave the next book cue visible before the day gets busy."
          : "Protect one small reading window before your most crowded part of the day.";
    } else {
      sentence =
        "Your check-ins show more of your inner rhythm than where your hours went.";
      experiment = "Add one time block after your next check-in.";
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
      available: missionDays.length,
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
