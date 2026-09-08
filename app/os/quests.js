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
 */

import { chapterEverCompleted } from "./chapters/chapter-model.js";

/*
 * The manifest is authored in the vault beside the chapters it groups —
 * `Quests.md`, same folder, same `npm run chapters:publish`. It lived in this
 * file for one commit, which was one too many: a Quest is content, and content
 * he writes belongs where he writes everything else. Sai: "quest.md".
 *
 * It is handed in rather than imported here, for the same reason `getChapter`
 * is: this stays a plain function over data, so it can be read without a
 * bundler. `quest-registry.ts` is what binds the compiled manifest to it.
 *
 * The compiler refuses to publish a Quest naming a chapter that is not
 * published, so a step always has something behind it.
 */

/** Every topic a catalogue holds, in the order the Quests are listed. */
export function questTopics(quests) {
  const topics = [];
  for (const quest of quests || []) {
    if (!topics.includes(quest.topic)) topics.push(quest.topic);
  }
  return topics;
}

export function findQuest(quests, id) {
  return (quests || []).find((quest) => quest.id === id) || null;
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
export function questCatalogue(quests, runs, getChapter) {
  return (quests || []).map((quest) => questProgress(quest, runs, getChapter));
}
