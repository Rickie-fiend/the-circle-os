/**
 * Goals, and the smallest step toward one.
 *
 * A goal belongs to a day of the week and says what that day is for. A step
 * says the smallest thing that can be done now to realise it. Sai: "my goal for
 * monday is to 'create a good content', so the task would be, 'write down 1
 * word or idea'. that task will shown in routine app, and the progress is
 * linked."
 *
 * The link is not a copy and there is no syncing.
 *
 * A step *is* a Routine task. The step record holds the shape of the plan — its
 * goal, its order — and the task holds the words and whether it is done. So
 * ticking it in Routine and ticking it here are the same write, and the two
 * surfaces cannot drift apart or disagree about what happened. Sai: "only the
 * sub task will be linked to the task in routine app."
 *
 * A goal's own completion is its own field, ticked only in the Week App: "the
 * actual goal completion will have to tick in week app." Finishing every step
 * is not finishing the goal — the steps are what you could do today, and the
 * goal is the thing they were in service of.
 */

const MAX_GOAL_TEXT = 240;

function clean(value, maximum = MAX_GOAL_TEXT) {
  return typeof value === "string" ? value.slice(0, maximum) : "";
}

function cleanId(value) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

export function normalizeGoals(value) {
  const source = value && typeof value === "object" ? value : {};
  const items = {};
  for (const [id, goal] of Object.entries(source.items || {})) {
    const goalId = cleanId(id);
    const dateKey = cleanId(goal?.dateKey);
    if (!goalId || !dateKey) continue;
    items[goalId] = {
      id: goalId,
      dateKey,
      // A day's goal is what today is for; the week's is what every day of it
      // is under. One record, two scopes, so a week goal ticks, carries steps
      // and merges across devices exactly as a day's does.
      scope: goal?.scope === "week" ? "week" : "day",
      text: clean(goal?.text),
      status: goal?.status === "done" ? "done" : "open",
      completedAt: cleanId(goal?.completedAt) || null,
      createdAt: cleanId(goal?.createdAt) || "",
      updatedAt: cleanId(goal?.updatedAt) || "",
    };
  }
  const steps = {};
  for (const [id, step] of Object.entries(source.steps || {})) {
    const stepId = cleanId(id);
    const goalId = cleanId(step?.goalId);
    const taskId = cleanId(step?.taskId);
    // A step with no goal or no task is not a step: it is debris.
    if (!stepId || !goalId || !taskId || !items[goalId]) continue;
    steps[stepId] = {
      id: stepId,
      goalId,
      taskId,
      createdAt: cleanId(step?.createdAt) || "",
    };
  }
  return { items, steps };
}

function write(state, goals) {
  return { ...state, goals };
}

export function addGoal(
  state,
  dateKey,
  id,
  at = new Date().toISOString(),
  scope = "day",
) {
  const goals = normalizeGoals(state.goals);
  const goalId = cleanId(id) || `goal-${Date.parse(at) || Date.now()}`;
  if (!cleanId(dateKey) || goals.items[goalId]) return { state, id: goalId };
  return {
    state: write(state, {
      ...goals,
      items: {
        ...goals.items,
        [goalId]: {
          id: goalId,
          dateKey: cleanId(dateKey),
          scope: scope === "week" ? "week" : "day",
          text: "",
          status: "open",
          completedAt: null,
          createdAt: at,
          updatedAt: at,
        },
      },
    }),
    id: goalId,
  };
}

export function updateGoal(state, goalId, text, at = new Date().toISOString()) {
  const goals = normalizeGoals(state.goals);
  const goal = goals.items[cleanId(goalId)];
  if (!goal) return state;
  return write(state, {
    ...goals,
    items: {
      ...goals.items,
      [goal.id]: { ...goal, text: clean(text), updatedAt: at },
    },
  });
}

/**
 * A goal is ticked here and nowhere else. Pressing it again gives it back,
 * because a goal marked done by accident has to be undoable.
 */
export function toggleGoal(state, goalId, at = new Date().toISOString()) {
  const goals = normalizeGoals(state.goals);
  const goal = goals.items[cleanId(goalId)];
  if (!goal) return state;
  const done = goal.status !== "done";
  return write(state, {
    ...goals,
    items: {
      ...goals.items,
      [goal.id]: {
        ...goal,
        status: done ? "done" : "open",
        completedAt: done ? at : null,
        updatedAt: at,
      },
    },
  });
}

export function removeGoal(state, goalId) {
  const goals = normalizeGoals(state.goals);
  const goal = goals.items[cleanId(goalId)];
  if (!goal) return state;
  const items = { ...goals.items };
  delete items[goal.id];
  const steps = Object.fromEntries(
    Object.entries(goals.steps).filter(([, step]) => step.goalId !== goal.id),
  );
  return write(state, { items, steps });
}

/**
 * The week's goal — the thing every day of that week is under.
 *
 * Its id is the week itself, so there can only ever be one and writing it twice
 * is the same write. The key is the week's Monday, which the caller supplies:
 * the Circle week lives in `week-app-model.js`, and that module reads the state
 * this one writes, so the dependency has to run one way.
 *
 * Sai: "i have no goal for the week so the protocol did not build upon that
 * goal, so i dont know the progress even i am keeping with my protocol, because
 * i cant see what i am going for clearly."
 */
export function weekGoalId(weekKey) {
  return `week-${cleanId(weekKey)}`;
}

export function weekGoal(state, weekKey) {
  const key = cleanId(weekKey);
  if (!key) return null;
  const goal = normalizeGoals(state.goals).items[weekGoalId(key)];
  if (!goal || goal.scope !== "week") return null;
  return {
    ...goal,
    done: goal.status === "done",
    steps: goalSteps(state, goal.id),
  };
}

export function setWeekGoal(state, weekKey, text, at = new Date().toISOString()) {
  const key = cleanId(weekKey);
  if (!key) return state;
  const goals = normalizeGoals(state.goals);
  const id = weekGoalId(key);
  const existing = goals.items[id];
  return write(state, {
    ...goals,
    items: {
      ...goals.items,
      [id]: existing
        ? { ...existing, text: clean(text), updatedAt: at }
        : {
            id,
            dateKey: key,
            scope: "week",
            text: clean(text),
            status: "open",
            completedAt: null,
            createdAt: at,
            updatedAt: at,
          },
    },
  });
}

/** Every goal written for a day, oldest first. */
export function goalsForDay(state, dateKey) {
  const goals = normalizeGoals(state.goals);
  const key = cleanId(dateKey);
  return Object.values(goals.items)
    .filter((goal) => goal.scope === "day" && goal.dateKey === key)
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
    .map((goal) => ({
      ...goal,
      done: goal.status === "done",
      steps: goalSteps(state, goal.id),
    }));
}

/**
 * A goal's steps, each read through the Routine task that holds it. The task is
 * where the words and the done-ness live, so a step that has lost its task is
 * dropped rather than shown as an empty row.
 */
export function goalSteps(state, goalId) {
  const goals = normalizeGoals(state.goals);
  const tasks = state?.tasks?.items || {};
  return Object.values(goals.steps)
    .filter((step) => step.goalId === cleanId(goalId))
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
    .flatMap((step) => {
      const task = tasks[step.taskId];
      if (!task || task.status === "archived") return [];
      return [
        {
          id: step.id,
          goalId: step.goalId,
          taskId: step.taskId,
          text: task.text || "",
          done: task.status === "completed",
        },
      ];
    });
}

/** One goal by id, whatever its scope. */
export function goalById(state, goalId) {
  const goal = normalizeGoals(state.goals).items[cleanId(goalId)];
  if (!goal) return null;
  return {
    ...goal,
    done: goal.status === "done",
    steps: goalSteps(state, goal.id),
  };
}

/** The step a Routine task belongs to, if it is one. */
export function goalStepForTask(state, taskId) {
  const goals = normalizeGoals(state.goals);
  return (
    Object.values(goals.steps).find((step) => step.taskId === cleanId(taskId)) ||
    null
  );
}

/**
 * Whether a task is a step of a goal that has been marked done.
 *
 * Routine stops asking for it either way. Sai: "when a goal is completed,
 * respective task for the steps, whether they complete or not, must not show in
 * routine task, since its part of the goal." Calling the goal done is calling
 * the whole of it done — a step still open underneath it was made unnecessary by
 * that, not left undone. Nothing is deleted: reopening the goal brings the step
 * back to Routine exactly as it was.
 */
export function taskIsUnderDoneGoal(state, taskId) {
  const step = goalStepForTask(state, taskId);
  if (!step) return false;
  return normalizeGoals(state.goals).items[step.goalId]?.status === "done";
}

/**
 * Add a step to a goal, and the Routine task that is that step.
 *
 * Returns the task id so the caller can put the cursor in the right row: a step
 * is written in the Week App but it is the same record Routine shows.
 */
export function addGoalStep(state, goalId, addTask, id, at = new Date().toISOString()) {
  const goals = normalizeGoals(state.goals);
  const goal = goals.items[cleanId(goalId)];
  if (!goal) return { state, id: "", taskId: "" };
  const stepId = cleanId(id) || `step-${Date.parse(at) || Date.now()}`;
  if (goals.steps[stepId]) return { state, id: stepId, taskId: goals.steps[stepId].taskId };
  const created = addTask(state);
  return {
    state: write(created.state, {
      ...goals,
      steps: {
        ...goals.steps,
        [stepId]: { id: stepId, goalId: goal.id, taskId: created.id, createdAt: at },
      },
    }),
    id: stepId,
    taskId: created.id,
  };
}

export function removeGoalStep(state, stepId) {
  const goals = normalizeGoals(state.goals);
  const step = goals.steps[cleanId(stepId)];
  if (!step) return state;
  const steps = { ...goals.steps };
  delete steps[step.id];
  return write(state, { ...goals, steps });
}

/**
 * A goal opened and then left alone is not a goal.
 *
 * Sai: "When i tap on goal and i dont want to add anything, the input box is
 * open all the time." Adding a row is how you find out what a row is, so an
 * empty one has to cost nothing — it goes when you look away, the same way an
 * unwritten habit or task does.
 */
export function discardEmptyGoal(state, goalId) {
  const goals = normalizeGoals(state.goals);
  const goal = goals.items[cleanId(goalId)];
  if (!goal || goal.text.trim()) return state;
  // A goal with steps under it has been worked on even if it is still unnamed.
  if (goalSteps(state, goal.id).length) return state;
  return removeGoal(state, goal.id);
}

/**
 * The same for a step, which also takes its Routine task with it: the task was
 * created by opening the row, so an unwritten one was never work.
 */
export function discardEmptyStep(state, stepId, discardTask) {
  const goals = normalizeGoals(state.goals);
  const step = goals.steps[cleanId(stepId)];
  if (!step) return state;
  const task = state?.tasks?.items?.[step.taskId];
  if (task && task.text.trim() && task.status !== "archived") return state;
  return removeGoalStep(discardTask(state, step.taskId), step.id);
}

/** Two devices that wrote different goals keep both; the later edit wins a clash. */
export function mergeGoals(left, right) {
  const a = normalizeGoals(left);
  const b = normalizeGoals(right);
  const items = { ...a.items };
  for (const [id, goal] of Object.entries(b.items)) {
    const mine = items[id];
    if (!mine || String(goal.updatedAt).localeCompare(String(mine.updatedAt)) > 0) {
      items[id] = goal;
    }
  }
  const steps = { ...a.steps, ...b.steps };
  return normalizeGoals({ items, steps });
}
