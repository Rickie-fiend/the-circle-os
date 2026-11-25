import { chapterAnswerText, renderChapterTemplate } from "./chapters/chapter-model.js";

/** @param {import("./chapters/chapter-types").ChapterRun} run
 * @param {import("./chapters/chapter-types").ChapterDefinition} [definition] */
export function savedChapterAnswers(run, definition) {
  const original = definition?.id === run.chapterId && definition.version === run.chapterVersion ? definition : undefined;
  return run.answers.map((answer, index) => {
    const page = original?.pages.find(item => item.id === answer.pageId && item.answerKey === answer.answerKey);
    return {
      id: `${answer.pageId}:${answer.answerKey}:${index}`,
      question: answer.questionSnapshot || (page && renderChapterTemplate(page.question || page.title || "", run)) || "Original question unavailable",
      text: chapterAnswerText({ answers: [answer] }, answer.answerKey),
    };
  });
}

/** A pure reader: never instantiate a player or apply a chapter outcome.
 * @param {Record<string, import("./chapters/chapter-types").ChapterRun>} runs
 * @param {import("./chapters/chapter-types").ChapterDefinition[]} definitions
 */
export function chapterHistory(runs = {}, definitions = []) {
  return Object.entries(runs).filter(([, run]) => run?.status === "completed" && run.answers?.length)
    .map(([id, run]) => {
      const matches = definitions.filter(definition => definition.id === run.chapterId && definition.version === run.chapterVersion);
      // Conflicting definitions cannot establish which original wording was used.
      const definition = new Set(matches.map(item => JSON.stringify(item))).size === 1 ? matches[0] : undefined;
      return {
        id, chapterId: run.chapterId, version: run.chapterVersion,
        title: definition?.title ? renderChapterTemplate(definition.title, run) : "Chapter title unavailable",
        completedAt: run.completedAt,
        answers: savedChapterAnswers(run, definition),
      };
    }).sort((a, b) => String(b.completedAt || "").localeCompare(String(a.completedAt || "")) || a.id.localeCompare(b.id));
}
