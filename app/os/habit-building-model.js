import {
  addHabitDefinition,
  updateHabitDefinitionParts,
} from "./circle-os-model.js";
import {
  chapterAnswerText,
  renderChapterTemplate,
} from "./chapters/chapter-model.js";

/** Project a completed Habit building chapter onto its persistent Habit row. */
export function applyHabitBuildingCompletion(state, chapter, run) {
  if (run.status !== "completed") return state;
  if (
    Object.values(state.habits.definitions).some(
      (habit) => habit.setupRunId === run.runId,
    )
  ) {
    return state;
  }

  const idlePage = chapter.pages.find((page) => page.type === "idle");
  const missionText = renderChapterTemplate(
    idlePage?.body || chapter.title,
    run,
  );
  const action = chapterAnswerText(run, "habit-action");
  const cue = chapterAnswerText(run, "habit-time-place");
  const identity = chapterAnswerText(run, "habit-identity") || "Yourself";
  // Day One already creates the starter Habit. First-use setup completes that
  // row, so the Habit at the top of Routine reflects these answers instead of
  // leaving the earlier onboarding text in front of a second Habit.
  const starter = Object.values(state.habits.definitions)
    .filter((habit) => habit.status === "active")
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
  // Keep a run-derived id as a fallback for states without a Day One starter.
  const habitId = starter?.id || `chapter-run:${run.runId}`;
  const existing = starter || state.habits.definitions[habitId];
  const added = existing
    ? { state, id: habitId }
    : addHabitDefinition(state, habitId);
  let next = updateHabitDefinitionParts(added.state, added.id, {
    action,
    cue,
    identity,
    text: missionText,
  });
  next = {
    ...next,
    habits: {
      ...next.habits,
      definitions: {
        ...next.habits.definitions,
        [habitId]: {
          ...next.habits.definitions[habitId],
          setupRunId: run.runId,
        },
      },
    },
  };
  next = {
    ...next,
    profile: { ...next.profile, identityFocus: identity },
  };
  return next;
}
