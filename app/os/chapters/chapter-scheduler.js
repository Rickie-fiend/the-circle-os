import {
  getDateKey,
  habitCompletionId,
  currentDeclaration,
  previousDateKey,
} from "../circle-os-model.js";

// Athena is a slow author; the phone is a fast scheduler. She never decides when
// a chapter appears, only what exists and under which conditions. Everything in
// this file is arithmetic, so delivery keeps working with the server offline.

export const CHAPTER_KINDS = Object.freeze([
  "spark",
  "check-in",
  "mirror",
  "lesson",
  "probe",
  "debate",
]);

// The budget cycles by the hour, not by the day.
//
// Three a day meant a person who opened the app in the morning had nothing for
// the rest of it, which is the opposite of a reason to come back. Three an hour
// keeps the door open all day without turning any single sitting into a feed:
// the fourth chapter in one hour still waits, it just waits minutes rather than
// until tomorrow.
//
// A probe asks for real thought, and rarity is what makes it answered instead
// of skipped, so it stays rationed by the day.
export const HOURLY_CHAPTER_BUDGET = 3;
export const DAILY_PROBE_BUDGET = 1;

// Putting a chapter aside means not now, not never. It comes back after a few
// hours, which is long enough that dismissing is a real way to clear the Page
// and short enough that a deck of twenty does not shrink every time one is
// waved off. It returns ranked last, because it has been seen most recently.
export const DISMISSED_RETURN_HOURS = 4;

// Among chapters nobody has seen yet, delight goes first. A person who opens the
// app for the first time in a week should meet a joke, not a survey.
const KIND_ORDER = Object.freeze([
  "spark",
  "mirror",
  "lesson",
  "check-in",
  "debate",
  "probe",
]);

const KIND_BY_SESSION = Object.freeze({
  "check-in": "check-in",
  habit: "lesson",
  protocol: "lesson",
  log: "check-in",
});

const APP_BY_SESSION = Object.freeze({
  "check-in": "note",
  thoughts: "thoughts",
  "deep-thoughts": "deep-thoughts",
  habit: "habit",
  protocol: "protocol",
  log: "log",
  vision: "vision",
  "seven-days": "seven-days",
  athena: "athena",
});

export function chapterKind(chapter) {
  return CHAPTER_KINDS.includes(chapter?.kind)
    ? chapter.kind
    : KIND_BY_SESSION[chapter?.session] || "check-in";
}

export function chapterApp(chapter) {
  return chapter?.app || APP_BY_SESSION[chapter?.session] || "note";
}

export function chapterWeight(chapter) {
  return Number.isFinite(Number(chapter?.weight)) ? Number(chapter.weight) : 0;
}

// Only the highest version of an id can be delivered. An older version stays in
// the library so a finished run keeps rendering the pages it was answered on.
export function latestChapterVersions(chapters = []) {
  const latest = new Map();
  for (const chapter of chapters) {
    if (!chapter?.id) continue;
    const previous = latest.get(chapter.id);
    if (!previous || previous.version < chapter.version) {
      latest.set(chapter.id, chapter);
    }
  }
  return [...latest.values()];
}

function dayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : getDateKey(date);
}

/** The bucket a moment falls in, as plain local hours. */
export function hourKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${getDateKey(date)}T${String(date.getHours()).padStart(2, "0")}`;
}

/** Milliseconds until the next hour opens, for telling someone when to return. */
export function millisecondsUntilNextHour(now = new Date()) {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next.getTime() - now.getTime();
}

function hoursBetween(fromValue, now) {
  const from = new Date(fromValue);
  if (Number.isNaN(from.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - from.getTime()) / 3_600_000;
}

function daysBetween(fromValue, now) {
  const from = new Date(fromValue);
  if (Number.isNaN(from.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - from.getTime()) / 86_400_000;
}

// Facts the phone can work out for itself. Kept to counts and booleans so a
// chapter written three nights ago still lands on the right day.
export function chapterFacts(state, now = new Date()) {
  const days = state?.days && typeof state.days === "object" ? state.days : {};
  const definitions = state?.habits?.definitions || {};
  const completions = state?.habits?.completions || {};
  const habitIds = Object.keys(definitions);
  const yesterdayKey = previousDateKey(getDateKey(now));
  const keptYesterday = habitIds.some(
    (habitId) => completions[habitCompletionId(habitId, yesterdayKey)]?.completed,
  );

  return {
    loggedDays: Object.values(days).filter((day) =>
      Boolean(
        day &&
          (day.checkIns?.length ||
            day.timeBlocks?.length ||
            day.missions?.length ||
            day.logRange ||
            day.mission?.completed),
      ),
    ).length,
    hasVision: Boolean(currentDeclaration(state, "vision")),
    // Only a real streak can break. With no habits defined there is nothing to
    // miss, so a lesson about missing twice would be noise.
    habitStreakBroken: Boolean(habitIds.length) && !keptYesterday,
    weekday: now.getDay(),
  };
}

function requirementUnmet(requires, facts) {
  if (!requires) return "";
  if (
    Number.isFinite(requires.minLoggedDays) &&
    Number(facts.loggedDays || 0) < requires.minLoggedDays
  ) {
    return "requires-more-days";
  }
  if (
    Number.isFinite(requires.maxLoggedDays) &&
    Number(facts.loggedDays || 0) > requires.maxLoggedDays
  ) {
    return "requires-fewer-days";
  }
  if (
    typeof requires.hasVision === "boolean" &&
    Boolean(facts.hasVision) !== requires.hasVision
  ) {
    return "requires-vision";
  }
  if (
    typeof requires.habitStreakBroken === "boolean" &&
    Boolean(facts.habitStreakBroken) !== requires.habitStreakBroken
  ) {
    return "requires-habit-state";
  }
  if (
    Array.isArray(requires.weekdays) &&
    requires.weekdays.length &&
    !requires.weekdays.includes(Number(facts.weekday))
  ) {
    return "requires-weekday";
  }
  return "";
}

// An empty string means the chapter may be delivered. A reason is returned
// instead of false so a quiet deck can explain itself.
export function chapterBlockReason(chapter, { now = new Date(), run, facts = {} } = {}) {
  if (!chapter) return "missing";
  if (run?.dismissedAt && hoursBetween(run.dismissedAt, now) < DISMISSED_RETURN_HOURS) {
    return "dismissed";
  }
  if (chapter.earliestAt && new Date(chapter.earliestAt) > now) return "not-yet";
  if (chapter.expiresAt && new Date(chapter.expiresAt) <= now) return "expired";

  const unmet = requirementUnmet(chapter.requires, facts);
  if (unmet) return unmet;

  if (run?.status === "completed" && run.completedAt) {
    const cooldown = Number(chapter.cooldownDays);
    if (!Number.isFinite(cooldown) || cooldown <= 0) return "completed";
    if (daysBetween(run.completedAt, now) < cooldown) return "cooldown";
  }
  return "";
}

// A chapter counts against the hour once it has been opened, not once it has
// been finished, so putting three aside does not buy three more.
export function countChaptersStartedOn(chapters, runs = {}, dateKey) {
  const ids = new Set();
  for (const chapter of chapters) {
    const run = runs[`${chapter.id}@${chapter.version}`];
    const moment = run?.startedAt || run?.updatedAt;
    if (moment && dayKey(moment) === dateKey) ids.add(chapter.id);
  }
  return {
    total: ids.size,
    probes: chapters.filter(
      (chapter) => ids.has(chapter.id) && chapterKind(chapter) === "probe",
    ).length,
  };
}

/** What has been opened in this hour, and how many probes today. */
export function countChaptersStartedInHour(chapters, runs = {}, now = new Date()) {
  const bucket = hourKey(now);
  const today = getDateKey(now);
  const inHour = new Set();
  const probesToday = new Set();
  for (const chapter of chapters) {
    const run = runs[`${chapter.id}@${chapter.version}`];
    const moment = run?.startedAt || run?.updatedAt;
    if (!moment) continue;
    if (hourKey(moment) === bucket) inHour.add(chapter.id);
    if (dayKey(moment) === today && chapterKind(chapter) === "probe") {
      probesToday.add(chapter.id);
    }
  }
  return { hour: inHour.size, probesToday: probesToday.size };
}

// Ranked, not filtered by app: the caller asks for the app it is drawing.
export function scheduleChapters(chapters = [], runs = {}, context = {}) {
  const now = context.now || new Date();
  const facts = context.facts || {};
  const candidates = latestChapterVersions(chapters);
  const spent = countChaptersStartedInHour(candidates, runs, now);

  return candidates
    .map((chapter) => {
      const run = runs[`${chapter.id}@${chapter.version}`];
      return {
        chapter,
        run,
        kind: chapterKind(chapter),
        blockReason: chapterBlockReason(chapter, { now, run, facts }),
        unfinished: run?.status === "in-progress",
      };
    })
    .filter((entry) => {
      if (entry.blockReason) return false;
      // An opened chapter can always be finished. The budget only holds back
      // chapters the person has not started yet.
      if (entry.unfinished) return true;
      if (spent.hour >= HOURLY_CHAPTER_BUDGET) return false;
      return !(entry.kind === "probe" && spent.probesToday >= DAILY_PROBE_BUDGET);
    })
    .sort((left, right) => {
      if (left.unfinished !== right.unfinished) return left.unfinished ? -1 : 1;
      const weight = chapterWeight(right.chapter) - chapterWeight(left.chapter);
      if (weight) return weight;
      // Least recently touched first, so a large deck rotates instead of
      // showing the alphabetically luckiest chapter every time.
      const seen = String(left.run?.updatedAt || "").localeCompare(
        String(right.run?.updatedAt || ""),
      );
      if (seen) return seen;
      const kind = KIND_ORDER.indexOf(left.kind) - KIND_ORDER.indexOf(right.kind);
      if (kind) return kind;
      return left.chapter.id.localeCompare(right.chapter.id);
    })
    .map((entry) => entry.chapter);
}

export function selectScheduledChapter(chapters = [], runs = {}, context = {}) {
  const app = context.app;
  const ranked = scheduleChapters(chapters, runs, context);
  return (
    (app ? ranked.filter((chapter) => chapterApp(chapter) === app) : ranked)[0] ||
    undefined
  );
}

// What the App Box needs to know: is there something here, and is any of it new.
// The dot has to be honest, or it stops meaning anything.
export function chapterDeckSignal(chapters = [], runs = {}, context = {}) {
  const ranked = scheduleChapters(chapters, runs, context);
  const forApp = context.app
    ? ranked.filter((chapter) => chapterApp(chapter) === context.app)
    : ranked;
  return {
    count: forApp.length,
    hasFresh: forApp.some(
      (chapter) => !runs[`${chapter.id}@${chapter.version}`]?.startedAt,
    ),
    next: forApp[0],
  };
}
