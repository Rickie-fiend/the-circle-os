import {
  addHabitDefinition, updateHabitDefinitionParts, composeHabitText,
  updateRoutineIdentity, declareLife, setHabitDimension, startProtocolDraft,
  setProtocolDays, addProtocolItem, updateProtocolItem, beginProtocolRun,
  addTask, updateTask, getDateKey,
} from "./circle-os-model.js";
import { addWeekGoal, updateGoal, addGoalStep } from "./goal-model.js";
import { weekStartKey } from "./week-app-model.js";
import { chapterAnswerText, chapterRunId, storeChapterRun } from "./chapters/chapter-model.js";

/** Resume an older started journey before offering the newest Day One. */
export function selectDayOneChapter(chapters, runs) {
  const versions = chapters.filter((chapter) => chapter.id === "day-one")
    .sort((a, b) => b.version - a.version);
  return versions.find((chapter) => {
    const run = runs[chapterRunId(chapter)];
    return run && run.status !== "completed" &&
      (run.status === "in-progress" || run.startedAt || run.answers?.length);
  }) || versions[0];
}

/** The first completed Circle day remains valid across chapter versions. */
export function dayOneKeptBefore(runs, dateKey) {
  return Object.values(runs).some((run) => run.chapterId === "day-one" &&
    run.status === "completed" && run.completedAt &&
    getDateKey(new Date(run.completedAt)) < dateKey);
}

/** Save source-labelled answers and apply legacy outcomes exactly once. */
export function saveDayOneProgress(state, chapter, run, dateKey) {
  const previous = state.chapters.runs[run.runId];
  let next = storeChapterRun(state, run, chapter.session);
  if (run.status !== "completed" || previous?.status === "completed") return next;
  // v3 keeps priority, direction and optional action as evidence, not commitments.
  if (chapter.version >= 3) return next;

  const idealSelf = chapterAnswerText(run, "identity-focus");
  if (idealSelf) next = updateRoutineIdentity(next, idealSelf);
  const dimension = chapterAnswerText(run, "character-dimension");
  const trait = chapterAnswerText(run, "character-trait");
  if (dimension && trait) {
    next = declareLife(next, "character", {
      [dimension]: trait, past: chapterAnswerText(run, "character-past"), starting: dimension,
    });
  }
  const action = chapterAnswerText(run, "habit-action");
  const cue = chapterAnswerText(run, "habit-time-place");
  if (action) {
    const added = addHabitDefinition(next);
    next = updateHabitDefinitionParts(added.state, added.id, {
      action, cue, identity: trait, text: composeHabitText({ action, cue, identity: trait }),
    });
    next = setHabitDimension(next, added.id, dimension);
    if (trait) next = { ...next, profile: { ...next.profile, identityFocus: trait } };
  }
  const term = chapterAnswerText(run, "day-one-term");
  if (term) {
    const draft = startProtocolDraft(next);
    next = setProtocolDays(draft.state, draft.id, 1);
    const item = addProtocolItem(next, draft.id, "non-negotiable");
    next = updateProtocolItem(item.state, draft.id, item.id, term);
    next = beginProtocolRun(next, draft.id, dateKey);
  }
  const goal = chapterAnswerText(run, "day-one-goal");
  const step = chapterAnswerText(run, "day-one-step");
  if (goal) {
    const added = addWeekGoal(next, weekStartKey(dateKey), `goal-day-one-${dateKey}`);
    next = updateGoal(added.state, added.id, goal);
    if (step) {
      const task = addGoalStep(next, added.id, addTask, `step-day-one-${dateKey}`,
        undefined, dateKey);
      next = updateTask(task.state, task.taskId, step);
    }
  }
  return next;
}

/** Only the person's supplied words belong on the new finish Page. */
export function dayOneSummary(run) {
  return ["day-one-priority", "day-one-direction", "day-one-optional-action"]
    .map((key) => chapterAnswerText(run, key)).filter(Boolean);
}
