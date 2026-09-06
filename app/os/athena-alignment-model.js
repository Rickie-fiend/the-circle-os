/**
 * The chain of why, and where it breaks.
 *
 * Sai's structure: character > habits > protocol > goal > daily. Each level is
 * the reason for the one below it. A day is aligned when a task can be traced
 * up to something he said he wanted, and adrift when it cannot.
 *
 * Pricing says where the hours went. This says which of them were in service of
 * anything he named. That is the difference between "you walked a lot" and
 * "these hours belong to no part of what you said you are doing".
 *
 * Athena ranks nothing. Every level here is his own writing: his habits, his
 * protocol terms, his week goal, his tasks. She reports whether they connect.
 */

import { isLowSignalText } from "./athena-memory-model.js";
import { PRICING_CATEGORIES } from "./athena-pricing-model.js";

/**
 * The top of the chain has no home of its own yet.
 *
 * `DECLARATION_KINDS` holds vision, missionStatement, typicalTuesday and
 * dreamline. There is no `character`. The Habit App's own identity is the
 * closest thing he actually writes — "Being a Leader" — so that is read first
 * and the mission statement second. Both are stand-ins, and are reported as
 * stand-ins, never as a character he declared.
 */
export const CHARACTER_DECLARATION = "missionStatement";

/** A prohibition spends no hours; it is the opposite of a claim on them. */
const NEGATED_TERM = /\b(?:no|not|never|avoid|quit|stop|zero|without)\b/i;

/**
 * An atomic habit reads "I will ACTION after CUE". The cue is when it happens,
 * not what it is, so categorising the whole sentence files "write one thing
 * down after making coffee" under meals. Only the part before the cue counts.
 */
const CUE_JOIN = /\s+(?:after|before|when|once|during|while|then)\s+/i;

function habitSubstance(habit) {
  const action = (habit?.action || habit?.text || "").trim();
  return action.split(CUE_JOIN)[0].trim() || action;
}

function usable(value) {
  return typeof value === "string" && value.trim() && !isLowSignalText(value);
}

function categoryFor(...texts) {
  const text = texts.filter(usable).join(" · ");
  if (!text) return null;
  const found = PRICING_CATEGORIES.find((category) => category.match.test(text));
  return found ? found.id : null;
}

/** His newest declaration of a kind; superseded ones are never read as live. */
export function latestDeclaration(state, kind) {
  const records = Object.values(state?.declarations?.records || {}).filter(
    (record) => record?.kind === kind,
  );
  if (!records.length) return null;
  const superseded = new Set(records.map((record) => record.supersedesId).filter(Boolean));
  return (
    records
      .filter((record) => !superseded.has(record.id))
      .sort((left, right) =>
        String(right.declaredAt).localeCompare(String(left.declaredAt)),
      )[0] || null
  );
}

/**
 * `state.habits` is a container, not a list: an overall identity, the
 * definitions, and the day-by-day completions. Only active definitions are a
 * habit he is keeping; the rest are archived drafts and test text.
 */
function habitList(state) {
  return Object.values(state?.habits?.definitions || {})
    .filter((habit) => habit?.status === "active" && usable(habit.action || habit.text))
    .map((habit) => ({
      id: habit.id,
      text: (habit.action || habit.text || "").trim(),
      // "Yourself" is the placeholder the app ships with, not a stated identity.
      identity:
        usable(habit.identity) && habit.identity.trim() !== "Yourself"
          ? habit.identity.trim()
          : "",
      category: categoryFor(habitSubstance(habit)),
    }));
}

function protocolRuns(state) {
  return Object.values(state?.protocol?.runs || {})
    .filter((run) => run?.id)
    .map((run) => ({
      id: run.id,
      name: usable(run.name) ? run.name.trim() : "",
      status: run.status || "open",
      goalId: run.goalId || null,
      terms: Object.values(run.items || {})
        .filter((item) => usable(item?.text) && item.status !== "archived")
        .map((item) => item.text.trim()),
    }));
}

/**
 * Reads every level of the chain that exists in state today.
 *
 * @param {object} state the profile's synced state
 * @param {{weekKey?: string}} options
 */
export function readChain(state, options = {}) {
  const goals = state?.goals?.items || {};
  const steps = Object.values(state?.goals?.steps || {});
  // Only open tasks can be adrift. A task completed in July is history.
  const tasks = Object.values(state?.tasks?.items || {}).filter(
    (task) => task?.id && usable(task.text) && task.status !== "completed",
  );
  const weekKey = options.weekKey || null;

  const allGoals = Object.values(goals).filter((goal) => usable(goal?.text));
  const week = allGoals.filter(
    (goal) => goal.scope === "week" && (!weekKey || goal.dateKey === weekKey),
  );
  const dayGoals = allGoals.filter((goal) => goal.scope === "day");

  const habitIdentity = state?.habits?.identity;
  const mission = latestDeclaration(state, CHARACTER_DECLARATION);
  const character = usable(habitIdentity?.text)
    ? { text: habitIdentity.text.trim(), declaredAt: habitIdentity.updatedAt || null, source: "habit-identity" }
    : usable(mission?.content?.statement)
      ? { text: mission.content.statement.trim(), declaredAt: mission.declaredAt, source: "missionStatement" }
      : null;

  return {
    // Always a stand-in until `character` is a declaration kind of its own.
    character: character ? { ...character, standIn: true } : null,
    habits: habitList(state),
    protocol: protocolRuns(state),
    weekGoals: week,
    dayGoals,
    steps,
    tasks,
  };
}

/**
 * Where the chain is broken, and which hours serve nothing it names.
 *
 * A break is never a verdict. A week with no goal may be a week that did not
 * need one. The finding is the disconnection, and what it means is his.
 */
export function alignChain(chain, pricing) {
  const breaks = [];

  if (!chain.character || !usable(chain.character.text)) {
    breaks.push({
      level: "character",
      kind: "unnamed",
      detail: "Nothing in the app says who the habits are for.",
    });
  }

  const orphanHabits = chain.habits.filter((habit) => !habit.identity);
  if (orphanHabits.length) {
    breaks.push({
      level: "habits",
      kind: "unowned",
      detail: `${orphanHabits.length} habit${orphanHabits.length === 1 ? "" : "s"} name no one they are for.`,
      items: orphanHabits.map((habit) => habit.text),
    });
  }

  const openRuns = chain.protocol.filter((run) => run.status !== "ended");
  const unattached = openRuns.filter((run) => !run.goalId);
  if (unattached.length) {
    breaks.push({
      level: "protocol",
      kind: "serves-nothing",
      detail: `${unattached.length} running protocol${unattached.length === 1 ? "" : "s"} not attached to a goal.`,
      items: unattached.map((run) => run.name || "unnamed"),
    });
  }

  const stepsByGoal = new Map();
  for (const step of chain.steps) {
    stepsByGoal.set(step.goalId, (stepsByGoal.get(step.goalId) || 0) + 1);
  }

  for (const goal of chain.weekGoals) {
    if (!stepsByGoal.get(goal.id)) {
      breaks.push({
        level: "goal",
        kind: "uncut",
        detail: "A week goal with no steps is a wish until it is cut into days.",
        items: [goal.text],
      });
    }
  }

  if (!chain.weekGoals.length) {
    breaks.push({
      level: "goal",
      kind: "absent",
      detail: "No goal set for this week.",
    });
  }

  const stepTaskIds = new Set(chain.steps.map((step) => step.taskId));
  const looseTasks = chain.tasks.filter(
    (task) => task?.id && usable(task.text) && !stepTaskIds.has(task.id),
  );
  if (looseTasks.length) {
    breaks.push({
      level: "daily",
      kind: "unlinked",
      detail: `${looseTasks.length} task${looseTasks.length === 1 ? "" : "s"} under no goal.`,
      items: looseTasks.map((task) => task.text),
    });
  }

  return {
    computedAt: pricing?.computedAt || null,
    recordedDays: pricing?.recordedDays ?? 0,
    characterText: chain.character?.text || "",
    characterSource: chain.character?.source || "",
    levels: {
      character: Boolean(chain.character && usable(chain.character.text)),
      habits: chain.habits.length,
      protocol: openRuns.length,
      goal: chain.weekGoals.length,
      daily: chain.tasks.length,
    },
    breaks,
    unclaimed: unclaimedHours(chain, pricing),
  };
}

/**
 * Hours the chain does not account for.
 *
 * Unclaimed is not wasted. A walk may be rest, thinking, or the best part of
 * his day — the model says only that no level of the chain names it, and the
 * question of what it is worth stays his. Sleep, meals and upkeep are never
 * counted here; they are not in service of anything and never should be.
 */
const PROTECTED = new Set(["rest", "eating", "upkeep"]);

function unclaimedHours(chain, pricing) {
  if (!pricing?.categories?.length) return [];

  const claimed = new Set(
    [
      ...chain.habits.map((habit) => habit.category),
      ...chain.weekGoals.map((goal) => categoryFor(goal.text)),
      ...chain.dayGoals.map((goal) => categoryFor(goal.text)),
      // Only a protocol still running claims hours, and a term that forbids a
      // thing never claims the hours of the thing it forbids.
      ...chain.protocol
        .filter((run) => run.status !== "ended")
        .flatMap((run) =>
          run.terms.filter((term) => !NEGATED_TERM.test(term)).map((term) => categoryFor(term)),
        ),
    ].filter(Boolean),
  );

  return pricing.categories
    .filter((category) => !PROTECTED.has(category.id) && !claimed.has(category.id))
    .map((category) => ({
      id: category.id,
      label: category.label,
      hoursPerDay: category.hoursPerRecordedDay,
      share: category.share,
    }));
}

export function serializeAlignmentMarkdown(alignment) {
  if (!alignment) return "Not aligned yet.";
  const { levels } = alignment;
  const spine = [
    `- character: ${levels.character ? `${alignment.characterText} (stand-in, from ${alignment.characterSource})` : "not named"}`,
    `- habits: ${levels.habits}`,
    `- protocol running: ${levels.protocol}`,
    `- week goal: ${levels.goal}`,
    `- tasks: ${levels.daily}`,
  ];

  const breaks = alignment.breaks.length
    ? ["", "Where the chain breaks:", ...alignment.breaks.map((item) => `- ${item.level}: ${item.detail}`)]
    : ["", "The chain holds."];

  const unclaimed = alignment.unclaimed.length
    ? [
        "",
        "Hours no level of the chain names:",
        ...alignment.unclaimed.map(
          (item) => `- ${item.label} — ${item.hoursPerDay}h a day, ${item.share}% of logged time`,
        ),
      ]
    : [];

  return [...spine, ...breaks, ...unclaimed].join("\n");
}
