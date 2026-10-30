/**
 * How far into the journey a person is, and what that opens.
 *
 * Current rule: Protocol opens after Day One is completed; Week opens after
 * Week setup is completed, in any published version. Dates do not unlock Apps.
 * Week setup is automatically offered after the next Circle day begins
 * following Day One completion. That offer timing is separate from App access.
 *
 * Historical rationale for the earlier day-based plan follows. Its day-two
 * and day-seven thresholds are not current App gates. Sai originally said:
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
 * The legacy day helpers below count date boundaries since Day One completion,
 * not visits or days with recorded activity. They do not control App access.
 */

import { chapterEverCompleted } from "./chapters/chapter-model.js";

export const PHASES = ["one-day", "one-week", "the-week-read"];

/** Historical Protocol threshold; not an App access gate. */
export const PROTOCOL_DAY = 2;

/** Historical Week threshold; not an App access or review gate. */
export const WEEK_DAY = 7;

/**
 * Legacy elapsed-day count from Day One completion, counting from one.
 *
 * Zero means the dates are missing, invalid, or reversed. The completion date
 * itself is day one. This does not count active days or open an App.
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

/** Historical phase for an elapsed-day count; not an App access gate. */
export function phaseForDay(day) {
  if (day >= WEEK_DAY) return "the-week-read";
  if (day >= PROTOCOL_DAY) return "one-week";
  return "one-day";
}

/**
 * The chapter that opens each gated App.
 *
 * An App opens when the chapter that sets it up has been answered, not when a
 * date arrives. Sai: "For protocol and week app, unlock after completing the
 * set-up chapter."
 *
 * A date was the wrong key. It let day seven arrive with no week goal written
 * and no phase running, so the Week Page opened onto nothing — and it locked
 * somebody who had done all the work out of the App that work was for. The
 * chapter is the actual dependency: day one writes the first phase from the
 * term he names, and the week's setup writes the goal and the seven-day phase
 * the Week Page is built to show.
 *
 * Nothing here traps anybody. Every chapter can be put down and picked up
 * again from its Quest, so a locked App is a thing waiting rather than a
 * thing withheld. Sai: "make all the chapter dismissable to skip to the app.
 * We can always rerun from the quest."
 */
export const SETUP_CHAPTER = {
  protocol: "day-one",
  week: "week-setup",
};

/**
 * Whether an App is open yet.
 *
 * Everything a person can use on the first day is open from the first day.
 * The two that need something set up behind them wait for that chapter.
 */
export function appIsOpen(app, runs) {
  const chapterId = SETUP_CHAPTER[app];
  if (!chapterId) return true;
  return chapterEverCompleted(runs, chapterId);
}

/** The chapter a locked App is waiting for, if it is waiting for one. */
export function lockedUntil(app) {
  return SETUP_CHAPTER[app] || "";
}
