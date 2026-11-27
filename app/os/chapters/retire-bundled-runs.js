function omit(records, keys) {
  return Object.fromEntries(Object.entries(records || {}).filter(([key]) => !keys.has(key)));
}

/** Retire only runs and records whose source can be identified in device state. */
export function retireBundledRuns(state, isBundledVersion) {
  const retired = Object.values(state.chapters.runs).filter(run =>
    run?.runId && !run.catalogKind && isBundledVersion(run.chapterId, run.chapterVersion),
  );
  if (!retired.length) return state;

  const runIds = new Set(retired.map(run => run.runId));
  const completed = new Set(retired.filter(run => run.status === "completed" &&
    (run.chapterId !== "day-one" || run.chapterVersion < 3)).map(run => run.chapterId));
  const habitIds = new Set(retired.filter(run => run.chapterId === "habit-building")
    .map(run => `chapter-run:${run.runId}`));
  const linkedGoals = new Set(Object.values(state.protocol.runs).map(run => run.goalId));
  const goalIds = new Set(Object.keys(state.goals.items).filter(id => !linkedGoals.has(id) &&
    ((completed.has("day-one") && /^goal-day-one-\d{4}-\d{2}-\d{2}$/.test(id)) ||
      ((completed.has("week-setup") || completed.has("week-review")) && /^goal-week-\d{4}-\d{2}-\d{2}$/.test(id)))));
  const removedSteps = Object.values(state.goals.steps).filter(step => goalIds.has(step.goalId));
  const steps = omit(state.goals.steps, new Set(removedSteps.map(step => step.id)));
  const remainingTasks = new Set(Object.values(steps).map(step => step.taskId));
  const taskIds = new Set(removedSteps.filter(step =>
    /^step-(?:day-one|week)-\d{4}-\d{2}-\d{2}$/.test(step.id) && !remainingTasks.has(step.taskId),
  ).map(step => step.taskId));

  return {
    ...state,
    chapters: {
      ...state.chapters,
      runs: Object.fromEntries(Object.entries(state.chapters.runs).filter(([, run]) => !runIds.has(run.runId))),
      sessions: Object.fromEntries(Object.entries(state.chapters.sessions).filter(([, session]) => !runIds.has(session.activeRunId))),
    },
    habits: {
      ...state.habits,
      definitions: omit(state.habits.definitions, habitIds),
      completions: Object.fromEntries(Object.entries(state.habits.completions)
        .filter(([, completion]) => !habitIds.has(completion.habitId))),
    },
    goals: { ...state.goals, items: omit(state.goals.items, goalIds), steps },
    tasks: {
      ...state.tasks,
      items: omit(state.tasks.items, taskIds),
      completions: Object.fromEntries(Object.entries(state.tasks.completions || {})
        .filter(([, completion]) => !taskIds.has(completion.taskId))),
    },
    outbox: state.outbox.filter(item => item.reason !== "chapter-progress" || !runIds.has(item.message)),
  };
}
