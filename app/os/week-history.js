import { getDateKey } from "./circle-os-model.js";
import { weekStartKey } from "./week-app-model.js";

function validWeek(key) {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = new Date(`${key}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key && date.getUTCDay() === 1;
}

/** Read saved weeks without normalizing, writing or replaying chapter outcomes.
 * Goal/task words are the saved records, not reconstructed historical versions.
 * @param {import("./circle-os-shell").CircleState} state
 * @param {string} todayKey
 */
export function weekHistory(state, todayKey = getDateKey()) {
  const currentWeek = weekStartKey(todayKey);
  const items = Object.values(state.goals?.items || {});
  const keys = new Set([
    ...Object.keys(state.weeks || {}),
    ...items.filter(goal => goal.scope === "week").map(goal => goal.dateKey),
  ]);
  return [...keys].filter(key => validWeek(key) && key < currentWeek).sort().reverse().flatMap(weekKey => {
    const goals = items.filter(goal => goal.scope === "week" && goal.dateKey === weekKey)
      .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || ""))).map(goal => ({
        id: goal.id, text: goal.text, done: goal.status === "done",
        steps: Object.values(state.goals?.steps || {}).filter(step => step.goalId === goal.id)
          .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || ""))).map(step => {
            const task = state.tasks?.items?.[step.taskId];
            return { id: step.id, dateKey: step.dateKey, text: task?.text || "", status: task ? task.status : "missing" };
          }),
      })).filter(goal => goal.text.trim() || goal.steps.length);
    const saved = state.weeks?.[weekKey];
    const review = saved ? { kept: saved.kept, fed: saved.fed, moved: saved.moved, blocked: saved.blocked, keep: saved.keep, reviewedAt: saved.reviewedAt } : null;
    return goals.length || review ? [{ weekKey, goals, review }] : [];
  });
}
