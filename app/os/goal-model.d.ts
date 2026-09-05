export type GoalStepView = {
  id: string;
  goalId: string;
  taskId: string;
  text: string;
  done: boolean;
};

export type GoalView = {
  id: string;
  dateKey: string;
  /** A day's goal, or the week's — the thing every day of it is under. */
  scope: "day" | "week";
  text: string;
  status: "open" | "done";
  done: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  steps: GoalStepView[];
};

export function normalizeGoals(value: unknown): {
  items: Record<string, unknown>;
  steps: Record<string, unknown>;
};
export function addGoal(
  state: unknown,
  dateKey: string,
  id?: string,
  at?: string,
  scope?: "day" | "week",
): { state: never; id: string };
export function updateGoal(state: unknown, goalId: string, text: string, at?: string): never;
export function toggleGoal(state: unknown, goalId: string, at?: string): never;
export function removeGoal(state: unknown, goalId: string): never;
export function goalsForDay(state: unknown, dateKey: string): GoalView[];
export function goalSteps(state: unknown, goalId: string): GoalStepView[];
export function goalStepForTask(
  state: unknown,
  taskId: string,
): { id: string; goalId: string; taskId: string } | null;
export function addGoalStep(
  state: unknown,
  goalId: string,
  addTask: (state: unknown) => { state: unknown; id: string },
  id?: string,
  at?: string,
): { state: never; id: string; taskId: string };
export function removeGoalStep(state: unknown, stepId: string): never;
export function mergeGoals(left: unknown, right: unknown): unknown;
export function discardEmptyGoal(state: unknown, goalId: string): never;
export function discardEmptyStep(
  state: unknown,
  stepId: string,
  discardTask: (state: unknown, taskId: string) => unknown,
): never;
export function taskIsUnderDoneGoal(state: unknown, taskId: string): boolean;
export function weekGoalId(weekKey: string): string;
export function weekGoal(state: unknown, weekKey: string): GoalView | null;
export function setWeekGoal(
  state: unknown,
  weekKey: string,
  text: string,
  at?: string,
): never;
export function goalById(state: unknown, goalId: string): GoalView | null;
