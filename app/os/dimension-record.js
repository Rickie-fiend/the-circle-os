/**
 * Where a life has actually gone, by the four parts of it.
 *
 * Reflect's deepest layer. The top of that tab holds what he said he wanted and
 * the middle holds the gap; this is the evidence the gap is measured against.
 *
 * Three rules hold it to being a mirror rather than a game:
 *
 * 1. Nothing here awards points. Every filled week is a week he himself said
 *    was fed, in the Sunday review. There is no currency to earn and no way to
 *    play for the number.
 * 2. Nothing ever subtracts. A count that falls is a punishment, and this App
 *    does not punish. Depth only accumulates; what changes is recency, and
 *    neglect shows as a gap at the near end rather than as a loss.
 * 3. What it says out loud is the starved part, never the strongest one. "Social
 *    has not been fed since June" is worth knowing. "Mind is winning" is not.
 *
 * The window is twenty-six weeks because that is the six-month horizon he
 * declares on day two, so the picture and the declaration agree about how far
 * ahead — and behind — a person is looking.
 */

import { CHARACTER_DIMENSIONS, currentCharacter } from "./circle-os-model.js";
import { planningWeekStartKey, weekRecords } from "./week-app-model.js";

/** Six months of weeks: the same horizon the six-month picture is declared at. */
export const DIMENSION_WINDOW_WEEKS = 26;

function shiftWeeks(weekKey, weeks) {
  const date = new Date(`${weekKey}T12:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

/**
 * The weeks of the window, oldest first, ending on the week being planned.
 *
 * The current week is included even though it has not been reviewed: a week in
 * progress is part of the picture, drawn empty until it is read.
 */
export function dimensionWeeks(todayKey, hour = 0, window = DIMENSION_WINDOW_WEEKS) {
  const current = planningWeekStartKey(todayKey, hour);
  const span = Math.max(1, Math.trunc(window));
  return Array.from({ length: span }, (_, index) =>
    shiftWeeks(current, index - (span - 1)),
  );
}

/**
 * Each part of a life, with what he named it and what has been put into it.
 *
 * `weeks` is the window in order, so a row can be drawn straight from it and
 * the gaps land where they happened. `fed` counts every week on record, not
 * only the ones inside the window: the window is how far back the eye reaches,
 * not how much of a life counts.
 */
export function dimensionRecord(state, todayKey, hour = 0) {
  const window = dimensionWeeks(todayKey, hour);
  const records = weekRecords(state);
  const him = currentCharacter(state);
  const traits = new Map((him?.traits || []).map((entry) => [entry.dimension, entry.trait]));
  const habits = Object.values(state?.habits?.definitions || {}).filter(
    (habit) => habit && habit.status !== "archived",
  );

  return CHARACTER_DIMENSIONS.map((dimension) => {
    const fedWeeks = records.filter((week) => week.fed === dimension);
    const fedKeys = new Set(fedWeeks.map((week) => week.weekKey));
    const lastFed = fedWeeks.length ? fedWeeks[fedWeeks.length - 1].weekKey : "";
    return {
      dimension,
      /** What he called this part of himself, if he has named it yet. */
      trait: traits.get(dimension) || "",
      /** The window, oldest first: one entry a week, fed or not. */
      weeks: window.map((weekKey) => ({ weekKey, fed: fedKeys.has(weekKey) })),
      /** Every week on record, not only the ones the window reaches. */
      fed: fedWeeks.length,
      lastFed,
      /**
       * Weeks since it was last fed, counting the current week as zero. Null
       * when it has never been fed, which is a different thing from a long
       * time ago and is said differently.
       */
      weeksSince: lastFed
        ? Math.max(
            0,
            Math.round(
              (Date.parse(`${window[window.length - 1]}T12:00:00`) -
                Date.parse(`${lastFed}T12:00:00`)) /
                (7 * 24 * 60 * 60 * 1000),
            ),
          )
        : null,
      /** The habits standing under it, which is how it gets fed day to day. */
      habits: habits
        .filter((habit) => habit.dimension === dimension)
        .map((habit) => ({ id: habit.id, action: habit.action, identity: habit.identity })),
    };
  });
}

/**
 * The part that has gone longest without anything.
 *
 * Never fed beats a long time ago, because a part of a life that has never been
 * named is further away than one that has merely lapsed. Nothing is returned
 * when nothing has gone hungry: there is no news then, and saying something
 * anyway would be the App talking for the sake of it.
 *
 * A month is the line, and it follows from the arithmetic. One week feeds one
 * part, so four parts take four weeks to come round — a person living in
 * perfect balance is always three weeks from something. At a fortnight this
 * function had a verdict every single week, including for a life with nothing
 * wrong with it, which is exactly the nagging the App is not for. Past four
 * weeks the rotation has actually been missed.
 */
const STARVED_WEEKS = 4;

export function starvedDimension(record) {
  const ranked = [...record].sort((left, right) => {
    if (left.weeksSince === null && right.weeksSince === null) return 0;
    if (left.weeksSince === null) return -1;
    if (right.weeksSince === null) return 1;
    return right.weeksSince - left.weeksSince;
  });
  const worst = ranked[0];
  if (!worst) return null;
  if (worst.weeksSince === null) return worst;
  return worst.weeksSince >= STARVED_WEEKS ? worst : null;
}
