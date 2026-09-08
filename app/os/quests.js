/**
 * Quests: chapters, grouped into something worth finishing.
 *
 * A Quest is not a new kind of thing. Sai: "they are just chapters, like any
 * other chapters. we will be using splash screen and easy inputs for those
 * quest chapters too, while still having those same chapters, load onto the
 * app boxes." So nothing here delivers, plays, schedules or stores anything —
 * the chapter engine already does all of it, and a chapter in a Quest is the
 * same chapter it was outside one.
 *
 * What a Quest adds is the only thing chapters could not say about themselves:
 * that these ones belong together, in this order, and that finishing them all
 * is an arrival. A person reading one chapter is answering a question. A person
 * on step nine of twelve is somewhere.
 *
 * Two consequences worth being explicit about:
 *
 * 1. **Several can run at once.** Sai: "several." A Quest is a thread of
 *    attention, not a mode the App is in, so nothing here is exclusive and
 *    nothing gets cancelled by starting something else.
 *
 * 2. **Answers reach the record.** Sai, on whether a Quest writes to the
 *    record: "yes it should." A Quest that keeps its answers inside itself is
 *    content; the whole App is the argument that what you said should become
 *    evidence you can be shown later. That wiring lives in each chapter's own
 *    save — this file only says which chapters make a Quest.
 *
 * Progress is read from the chapter runs that already exist, so a chapter
 * answered before its Quest existed is already counted. Nothing is duplicated
 * and there is no second source of truth about what has been done.
 *
 * The manifest lives here for now. It belongs in the vault beside the chapter
 * sources, compiled like they are, once there is a second person authoring.
 */

import { chapterEverCompleted } from "./chapters/chapter-model.js";

/**
 * The Quests, in the order the catalogue offers them.
 *
 * `topic` groups them the way Sai described — "under 'topic' such as happiness
 * personal growth" — and `steps` are chapter ids in the order they are meant
 * to be walked. `minutes` is what a step actually costs, because the honest
 * number is what makes a person start.
 */
export const QUESTS = [
  {
    id: "getting-started",
    topic: "Foundation",
    title: "Getting started",
    blurb:
      "The first week: who you are becoming, one habit, one line you will not cross, and a week you can read.",
    steps: [
      { chapterId: "day-one", minutes: 6 },
      { chapterId: "habit-building", minutes: 4 },
      { chapterId: "log-setup", minutes: 2 },
      { chapterId: "week-setup", minutes: 7 },
      { chapterId: "week-review", minutes: 6 },
    ],
  },
  {
    id: "the-life-you-want",
    topic: "Direction",
    title: "The life you want",
    blurb:
      "Four declarations, from an ordinary Tuesday to a dream with a date on it. What you are aiming at, written down where it can be checked.",
    steps: [
      { chapterId: "declare-vision", minutes: 4 },
      { chapterId: "declare-typical-tuesday", minutes: 6 },
      { chapterId: "declare-mission-statement", minutes: 5 },
      { chapterId: "declare-dreamline", minutes: 5 },
    ],
  },
  {
    id: "knowing-yourself",
    topic: "Personal growth",
    title: "Knowing yourself",
    blurb:
      "Twelve short readings on how you actually work — your rhythm, your attention, what rest is for, what makes a day worth it.",
    steps: Array.from({ length: 12 }, (_, index) => ({
      chapterId: `profile-spark-${String(index + 1).padStart(2, "0")}`,
      minutes: 3,
    })),
  },
];

/** Every topic the catalogue holds, in the order the Quests are listed. */
export function questTopics() {
  const topics = [];
  for (const quest of QUESTS) {
    if (!topics.includes(quest.topic)) topics.push(quest.topic);
  }
  return topics;
}

export function findQuest(id) {
  return QUESTS.find((quest) => quest.id === id) || null;
}

/**
 * A Quest with its steps resolved against what has actually been answered.
 *
 * `getChapter` is passed in rather than imported so this stays a plain
 * function over data — the registry is a React-side concern and this has to be
 * testable without it.
 *
 * A step whose chapter is not in the published library is dropped rather than
 * shown broken: a Quest naming a chapter that no longer exists should be a
 * shorter Quest, not an error in front of somebody trying to use it.
 */
export function questProgress(quest, runs, getChapter) {
  const steps = [];
  for (const step of quest?.steps || []) {
    const chapter = getChapter(step.chapterId);
    if (!chapter) continue;
    steps.push({
      chapterId: step.chapterId,
      minutes: step.minutes || 0,
      title: chapter.title || step.chapterId,
      session: chapter.session || "",
      // Any version of it, answered once — the same rule the setup gates use.
      done: chapterEverCompleted(runs, step.chapterId),
    });
  }
  const done = steps.filter((step) => step.done).length;
  return {
    id: quest.id,
    topic: quest.topic,
    title: quest.title,
    blurb: quest.blurb,
    steps,
    done,
    total: steps.length,
    minutes: steps.reduce((sum, step) => sum + step.minutes, 0),
    /** Nothing answered yet: the Quest has not been started. */
    started: done > 0,
    complete: steps.length > 0 && done === steps.length,
    /** Where to pick it up. Null once there is nothing left to answer. */
    next: steps.find((step) => !step.done) || null,
  };
}

/** The whole catalogue, each Quest read against the runs. */
export function questCatalogue(runs, getChapter) {
  return QUESTS.map((quest) => questProgress(quest, runs, getChapter));
}
