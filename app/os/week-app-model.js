/**
 * The Week App.
 *
 * It replaces Week Review, which read as a set of claims about the week —
 * sentences with evidence stapled underneath. Sai never went back to it: "i
 * dont love it. i never go and read it." A claim is something to agree or
 * disagree with, and neither is a reason to open an App.
 *
 * So the week is shown rather than argued. Sai: "the top header be 7 days of
 * the week. and body would be summary or some what the data of that day. next
 * page would be few days either side, week preview sort of."
 *
 * Nothing here interprets. Every number is counted from evidence the person
 * put in themselves, and a day with nothing in it says so plainly instead of
 * being filled with an inference.
 */

import {
  dayRecord,
  getDateKey,
  previousDateKey,
} from "./circle-os-model.js";

/** The Circle week runs Monday to Sunday. */
export const WEEK_DAY_LETTERS = Object.freeze([
  "M",
  "T",
  "W",
  "T",
  "F",
  "S",
  "S",
]);

const DAY_NAMES = Object.freeze([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

/** How far either side of today the span Page reaches. */
export const WEEK_SPAN_BACK = 3;
export const WEEK_SPAN_FORWARD = 3;

/**
 * Midday, always.
 *
 * The Circle day starts at 06:00, so `getDateKey` subtracts six hours before
 * reading a date off the clock. A day built at midnight is therefore six hours
 * *inside the day before* and comes back as yesterday's key — which quietly
 * shortened the week by one. Anchoring at midday keeps every day comfortably
 * clear of that boundary in either direction.
 */
function dayAt(dateKey) {
  return new Date(`${dateKey}T12:00:00`);
}

function shiftDateKey(dateKey, days) {
  if (days === 0) return dateKey;
  if (days < 0) {
    let key = dateKey;
    for (let step = 0; step < -days; step += 1) key = previousDateKey(key);
    return key;
  }
  const date = dayAt(dateKey);
  date.setDate(date.getDate() + days);
  return getDateKey(date);
}

function weekdayIndex(dateKey) {
  const day = dayAt(dateKey).getDay();
  // JavaScript starts its week on Sunday; the Circle week starts on Monday.
  return (day + 6) % 7;
}

/** The Monday of the week a day belongs to. */
export function weekStartKey(dateKey) {
  return shiftDateKey(dateKey, -weekdayIndex(dateKey));
}

function loggedHours(state, dateKey) {
  const blocks = state?.days?.[dateKey]?.timeBlocks;
  return Array.isArray(blocks) ? blocks.length : 0;
}

/**
 * The things he actually wrote into a day, newest last, in the order they
 * happened. A block's title is what the hour was; its moments are what happened
 * inside it. Both are his words, so both belong here and neither is summarised.
 */
function dayMoments(state, dateKey, limit = 6) {
  const blocks = state?.days?.[dateKey]?.timeBlocks;
  if (!Array.isArray(blocks)) return [];
  const moments = [];
  for (const block of [...blocks].sort((left, right) =>
    String(left?.start || "").localeCompare(String(right?.start || "")),
  )) {
    const title = String(block?.title || block?.activity || "").trim();
    if (title) moments.push({ at: String(block?.start || ""), text: title });
    const inside = Array.isArray(block?.moments)
      ? block.moments
      : block?.note
        ? [block.note]
        : [];
    for (const moment of inside) {
      const text = String(moment || "").trim();
      if (text && text !== title) moments.push({ at: String(block?.start || ""), text });
    }
  }
  return moments.slice(0, limit);
}

function habitsDue(state) {
  return Object.values(state?.habits?.definitions || {}).filter(
    (habit) => habit?.status === "active",
  ).length;
}

/**
 * One day, counted rather than described.
 *
 * `kept` is out of the habits that exist now, not the habits that existed then,
 * because a habit added today was not available to keep last Tuesday. That
 * makes the ratio honest about the present and useless as a historical grade,
 * which is the right way round for something a person reads to notice a shape.
 */
export function weekDaySummary(state, dateKey, todayKey = getDateKey()) {
  const record = dayRecord(state, dateKey);
  const day = state?.days?.[dateKey];
  return {
    dateKey,
    letter: WEEK_DAY_LETTERS[weekdayIndex(dateKey)],
    name: DAY_NAMES[dayAt(dateKey).getDay()],
    title: String(day?.title || "").trim(),
    isToday: dateKey === todayKey,
    isFuture: dateKey.localeCompare(todayKey) > 0,
    /**
     * What the day was, in his own words.
     *
     * Sai: "when i want to know what have i done last few days, than i can have
     * a sense of that day when i check it. may be on monday i was working on my
     * project all day, and on sunday, i go to the market with mum."
     *
     * So the day leads with what he wrote in it — the hours he logged and the
     * moments inside them — and the counts sit underneath. A tally answers how
     * much; only his own words answer what it was.
     */
    moments: dayMoments(state, dateKey),
    kept: record.habits.length,
    due: habitsDue(state),
    tasks: record.tasks.length,
    hours: loggedHours(state, dateKey),
    /** Whether the person put anything into this day at all. */
    touched:
      record.total > 0 || loggedHours(state, dateKey) > 0 || Boolean(day?.title),
  };
}

/** The seven days of the week a day belongs to, Monday first. */
export function weekDays(state, todayKey = getDateKey()) {
  const monday = weekStartKey(todayKey);
  return Array.from({ length: 7 }, (_, index) =>
    weekDaySummary(state, shiftDateKey(monday, index), todayKey),
  );
}

/**
 * A few days either side of today, for the span Page. Not a week: the point is
 * the days close enough to still act on, which straddles the week boundary
 * rather than resetting at it.
 */
export function weekSpan(
  state,
  todayKey = getDateKey(),
  back = WEEK_SPAN_BACK,
  forward = WEEK_SPAN_FORWARD,
) {
  const days = [];
  for (let offset = -back; offset <= forward; offset += 1) {
    days.push(weekDaySummary(state, shiftDateKey(todayKey, offset), todayKey));
  }
  return days;
}

/**
 * What the week has in it so far. Days not yet lived are not counted as empty,
 * because a Thursday that has not happened is not a Thursday that was missed.
 */
export function weekTotals(state, todayKey = getDateKey()) {
  const days = weekDays(state, todayKey).filter((day) => !day.isFuture);
  return {
    days: days.length,
    touched: days.filter((day) => day.touched).length,
    kept: days.reduce((total, day) => total + day.kept, 0),
    tasks: days.reduce((total, day) => total + day.tasks, 0),
    hours: days.reduce((total, day) => total + day.hours, 0),
  };
}

/**
 * The words on the cover.
 *
 * Sai: "the cover page would be update often." So it names where the week
 * actually is rather than carrying one fixed title, and changes as the week is
 * lived. It states, it never praises: a quiet week is a fact about a week, not
 * a failure to be softened.
 */
export function weekCoverLine(state, todayKey = getDateKey()) {
  const totals = weekTotals(state, todayKey);
  if (totals.days === 0) return "A new week.";
  if (totals.touched === 0) return "Nothing written down yet.";
  if (totals.touched === totals.days) {
    return totals.days === 1 ? "Today is in." : `${totals.days} days, all in.`;
  }
  return `${totals.touched} of ${totals.days} days written down.`;
}
