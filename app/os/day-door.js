/**
 * What stands in the door when the App is opened.
 *
 * The splash used to be four independent conditions scattered through the
 * render, and the order between them lived in their negations — `dayOneDone &&
 * weekSetupDone && !logSetupDone && ...`. Nothing said out loud which came
 * first, adding a fifth meant editing the other four, and there was no notion
 * of a day being opened at all: a sheet was either a setup nobody had answered
 * or nothing.
 *
 * Sai: "whenever we log into the app, splash screen act as greeting ... when
 * the user first visit, the first set-up ss would be displayed. first
 * onboarding ss > app. for that day whenever the user login, it will be to use
 * app. next day, splash screen for new day ... so when its time to review for
 * the week, ss will inform that, and to continue the process."
 *
 * So: one door, and one list saying what may stand in it. The App asks once,
 * gets back a single answer, and draws that. Everything about precedence is
 * this file.
 *
 * The rules the order encodes:
 *
 * 1. Setting up comes before living. A person who has not answered day one has
 *    no character, no habit and no goal, so nothing behind the door works yet.
 * 2. The week's hinge comes before the day's greeting. Sunday's review is the
 *    one thing that cannot be done later — the week ends whether or not he
 *    looks at it — so it stands in front of the day.
 * 3. The greeting is last, and is the only one a person sees on an ordinary
 *    day. It opens the day once and then gets out of the way: "for that day
 *    whenever the user login, it will be to use app."
 *
 * Every door is dismissible and every dismissal is dated, so putting one down
 * stands it down for the rest of the Circle day and it is offered again
 * tomorrow. Nothing here traps anybody behind a sheet.
 */

/**
 * The order the doors are offered in. First one ready wins, and only one is
 * ever open, so a person answers at most one sheet per opening of the App.
 */
export const DAY_DOOR_ORDER = [
  "day-one",
  "week-setup",
  "log-setup",
  "week-review",
  "day-open",
];

/**
 * Which door to draw, or null to open straight into the App.
 *
 * `offers` is what the App knows about each door: whether it is ready to be
 * offered at all, and the Circle day it was last put down on. This decides
 * only which of them wins, because that is the part that has to be true in one
 * place.
 */
export function dayDoor(offers, todayKey) {
  const today = typeof todayKey === "string" ? todayKey.trim().slice(0, 10) : "";
  for (const kind of DAY_DOOR_ORDER) {
    const offer = offers?.[kind];
    if (!offer?.offered) continue;
    // Put down today: it stands down until tomorrow, from where he left it.
    if (today && offer.dismissedKey === today) continue;
    return kind;
  }
  return null;
}

/**
 * The greeting's run for one day.
 *
 * Keyed by the day it greets, the way the review is keyed by the week it
 * reads. A day is opened once: yesterday's answers are yesterday's, and
 * today's sheet starts blank rather than resuming a week-old one.
 */
export function dayOpenRunId(chapter, dateKey) {
  if (!chapter?.id) return "";
  const key = typeof dateKey === "string" ? dateKey.trim().slice(0, 10) : "";
  return `${chapter.id}@${chapter.version}:${key}`;
}

/**
 * Whether this Circle day has already been opened.
 *
 * Either answer counts. Finishing the greeting opens the day; so does putting
 * it down, because a person who waved it away has been greeted and does not
 * need greeting again at lunchtime.
 */
export function dayWasOpened(run) {
  if (!run) return false;
  return run.status === "completed" || Boolean(run.dismissedAt);
}

/**
 * The door a builder asked to see.
 *
 * Every door waits for something real — a setup nobody has answered, a Sunday
 * evening, a day that has not been opened — which is right for living with the
 * App and impossible to work with while building it. Sai: "let me have a way
 * to manually test the splash screen chapters."
 *
 * It is kept beside the state rather than in it. A pin is one device, one
 * moment, and one person: putting it in the synced state meant the first sync
 * after opening the OS rebuilt `chapters` from its runs and sessions and threw
 * the pin away, which is the right thing for sync to do and the wrong place
 * for this to live.
 */
const PINNED_DOOR_KEY = "circle-os-pinned-door";

export function readPinnedDoor() {
  if (typeof window === "undefined") return null;
  try {
    const kind = window.localStorage.getItem(PINNED_DOOR_KEY);
    return DAY_DOOR_ORDER.includes(kind) ? kind : null;
  } catch {
    return null;
  }
}

export function writePinnedDoor(kind) {
  if (typeof window === "undefined" || !DAY_DOOR_ORDER.includes(kind)) return;
  try {
    window.localStorage.setItem(PINNED_DOOR_KEY, kind);
  } catch {
    // A builder's convenience, not something to fail an App over.
  }
}

export function clearPinnedDoor() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PINNED_DOOR_KEY);
  } catch {
    // As above.
  }
}
