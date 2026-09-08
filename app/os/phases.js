/**
 * How far into the journey a person is, and what that opens.
 *
 * The App is not a set of Apps that all arrive at once. It arrives in three
 * phases, and each one exists because the one before it earned the argument
 * for it. Sai laid the order out plainly:
 *
 *   "first time visit > onboarding ss > app. for one day commitment note app,
 *   thoughts, routine, log, are fully usable on day one ... Protocol, and Week
 *   app will have a cover screen, with the disabled button. for day two, is for
 *   Protocol ... the default commitment is a week. so for the whole week
 *   routine app and protocol app can be used to live for the week. at day 7,
 *   week and athena review would be able."
 *
 * The reasoning underneath it:
 *
 * 1. **One day.** Writing things down works on the first day; committing to
 *    seven of anything does not, because nothing has been lived yet. So day one
 *    hands over the four Apps that only need a person to be present — Note,
 *    Thoughts, Routine, Log — and asks for one two-minute thing. Doing it is
 *    the whole success condition. More habits, more tasks, more log is not
 *    breaking the rules; it is the point.
 *
 * 2. **One week.** A day kept is the argument for seven. Day two is the
 *    Protocol: one non-negotiable, seven days, because now there is evidence
 *    that a day can be kept.
 *
 * 3. **The week read.** A week lived is the argument for looking at it. Day
 *    seven opens the Week and the review, which are the only things that need
 *    a week of evidence to say anything true.
 *
 * A locked App is not hidden. It shows its cover with the key dark, so the
 * shape of the thing is visible from day one and the person knows what they are
 * walking toward.
 *
 * Days are counted in Circle days lived since day one was kept, not in
 * calendar days since install: somebody who comes back on Friday is on their
 * second day, not their fifth.
 */

export const PHASES = ["one-day", "one-week", "the-week-read"];

/** The day the Protocol opens, counting day one as day one. */
export const PROTOCOL_DAY = 2;

/** The day the Week and its review open. */
export const WEEK_DAY = 7;

/**
 * Which day of the journey a person is on, counting from one.
 *
 * Zero means day one has not been kept yet — they are still inside it, or have
 * not begun. Day one being *kept* is the run being completed, and a day turning
 * over after it.
 */
export function journeyDay(keptDayOneOn, todayKey) {
  const from = typeof keptDayOneOn === "string" ? keptDayOneOn.slice(0, 10) : "";
  const to = typeof todayKey === "string" ? todayKey.slice(0, 10) : "";
  if (!from || !to) return 0;
  const start = Date.parse(`${from}T12:00:00`);
  const now = Date.parse(`${to}T12:00:00`);
  if (Number.isNaN(start) || Number.isNaN(now) || now < start) return 0;
  return Math.round((now - start) / (24 * 60 * 60 * 1000)) + 1;
}

/** The phase a day belongs to. */
export function phaseForDay(day) {
  if (day >= WEEK_DAY) return "the-week-read";
  if (day >= PROTOCOL_DAY) return "one-week";
  return "one-day";
}

/**
 * Whether an App is open yet.
 *
 * Everything a person can use on the first day is open from the first day.
 * The two that need something lived behind them wait for it.
 */
export function appIsOpen(app, day) {
  if (app === "protocol") return day >= PROTOCOL_DAY;
  if (app === "week") return day >= WEEK_DAY;
  return true;
}

/**
 * What a locked App says on its cover.
 *
 * It names the day it opens rather than saying no, because the point of
 * showing a locked App at all is that the person can see where they are going.
 */
export function lockedUntil(app) {
  if (app === "protocol") return PROTOCOL_DAY;
  if (app === "week") return WEEK_DAY;
  return 0;
}
