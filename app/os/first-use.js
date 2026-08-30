/**
 * The first time an App is opened, before the person has put anything in it.
 *
 * An empty App is not a broken App, but it is a silent one. Thoughts showed a
 * rotating invitation written for somebody who already knows what Thoughts is,
 * and Note showed words that assume you know the label above them turns the
 * card over. Sai: "the first time placeholder for all apps."
 *
 * Nothing new is stored to know this. Whether an App has ever been used is
 * already the truth of the evidence in it: a thought that was sent, a note that
 * was written, a habit that was named. Asking the state directly means the
 * first-time words cannot survive into an App that has content, and cannot
 * come back wrongly on a new device that has synced.
 *
 * These say what the App is and what one action opens it. They are not a tour,
 * and they are never shown twice.
 */

/** The Apps that can greet a person who has not used them yet. */
export const FIRST_USE_APPS = Object.freeze([
  "note",
  "thoughts",
  "habit",
  "protocol",
  "log",
]);

/**
 * One line each. A placeholder has to name the App and the one thing to do,
 * inside the space a placeholder actually gets, so none of these explain a
 * second feature or a gesture the Page does not need yet.
 */
export const FIRST_USE_PLACEHOLDERS = Object.freeze({
  note: "This is your Note. Tap here to write.",
  thoughts: "Send anything here.",
  habit: "Name one small thing you want to repeat.",
  protocol: "Set the terms you will keep.",
  log: "Add the hour you are in.",
});

function answers(state) {
  const list = state?.profile?.profileCase?.survey?.answers;
  return Array.isArray(list) ? list : [];
}

function hasAnswerOfKind(state, kind) {
  return answers(state).some(
    (answer) => answer?.kind === kind && String(answer?.answer || "").trim(),
  );
}

function countValues(record) {
  return record && typeof record === "object" ? Object.keys(record).length : 0;
}

/**
 * Whether this App has ever received anything.
 *
 * Deep Thoughts counts as Thoughts: they are two faces of one App, and a person
 * who has answered a deep question has plainly found the App.
 */
export function hasUsedApp(state, app) {
  switch (app) {
    case "note":
      return hasAnswerOfKind(state, "note");
    case "thoughts":
      return (
        hasAnswerOfKind(state, "thought") ||
        hasAnswerOfKind(state, "deep-thought")
      );
    case "habit":
      return countValues(state?.habits?.definitions) > 0;
    case "protocol":
      return countValues(state?.protocol?.runs) > 0;
    case "log":
      return Object.values(state?.days || {}).some(
        (day) => Array.isArray(day?.timeBlocks) && day.timeBlocks.length > 0,
      );
    default:
      return true;
  }
}

/**
 * The words an App shows before it has been used, or an empty string once it
 * has. An empty string means "carry on with the ordinary placeholder", so a
 * caller never has to know whether a first-time state exists.
 */
export function firstUsePlaceholder(state, app) {
  if (!FIRST_USE_APPS.includes(app)) return "";
  if (hasUsedApp(state, app)) return "";
  return FIRST_USE_PLACEHOLDERS[app] || "";
}
