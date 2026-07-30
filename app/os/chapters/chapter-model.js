const INPUT_PAGE_TYPES = new Set([
  "single-choice",
  "multi-choice",
  "yes-no",
  "slider",
  "short-text",
  "long-text",
  "time",
]);

export function chapterRunId(chapter) {
  return `${chapter.id}@${chapter.version}`;
}

function now() {
  return new Date().toISOString();
}

export function createChapterRun(chapter, seedAnswers = []) {
  const timestamp = now();
  const answers = seedAnswers.filter((answer) =>
    chapter.pages.some(
      (page) =>
        page.id === answer.pageId &&
        page.answerKey === answer.answerKey &&
        INPUT_PAGE_TYPES.has(page.type),
    ),
  );
  const firstUnanswered = chapter.pages.find(
    (page) =>
      INPUT_PAGE_TYPES.has(page.type) &&
      page.answerKey &&
      !answers.some((answer) => answer.answerKey === page.answerKey),
  );
  const currentPage =
    firstUnanswered ||
    chapter.pages.find((page) => page.type === "idle") ||
    chapter.pages.at(-1);
  const complete = !firstUnanswered && answers.length > 0;

  return {
    runId: chapterRunId(chapter),
    chapterId: chapter.id,
    chapterVersion: chapter.version,
    status: complete ? "completed" : "not-started",
    currentPageId:
      complete || answers.length ? currentPage.id : chapter.pages[0].id,
    startedAt: answers.length ? timestamp : null,
    updatedAt: timestamp,
    completedAt: complete ? timestamp : null,
    answers,
  };
}

export function findChapterAnswer(run, answerKey) {
  return run.answers.find((answer) => answer.answerKey === answerKey);
}

export function moveChapterRun(chapter, run, pageId) {
  if (!chapter.pages.some((page) => page.id === pageId)) return run;
  return {
    ...run,
    currentPageId: pageId,
    updatedAt: now(),
  };
}

export function advanceChapterRun(
  chapter,
  run,
  { page, value, displaySnapshot = "" },
) {
  const pageIndex = chapter.pages.findIndex((item) => item.id === page.id);
  if (pageIndex < 0) return run;
  const timestamp = now();
  let answers = run.answers;

  if (page.answerKey && INPUT_PAGE_TYPES.has(page.type) && value !== undefined) {
    const previous = findChapterAnswer(run, page.answerKey);
    const answer = {
      pageId: page.id,
      answerKey: page.answerKey,
      questionSnapshot: page.question || page.title || page.answerKey,
      value,
      displaySnapshot: String(displaySnapshot || value),
      answeredAt: previous?.answeredAt || timestamp,
      changedAt: timestamp,
    };
    answers = [
      ...run.answers.filter((item) => item.answerKey !== page.answerKey),
      answer,
    ];
  }

  const nextPage = chapter.pages[pageIndex + 1];
  const completed = !nextPage || nextPage.type === "idle";
  return {
    ...run,
    status: completed ? "completed" : "in-progress",
    currentPageId: nextPage?.id || page.id,
    startedAt: run.startedAt || timestamp,
    updatedAt: timestamp,
    completedAt: completed ? run.completedAt || timestamp : null,
    answers,
  };
}

export function storeChapterRun(state, run, session) {
  const progressItem = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `chapter-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    reason: "chapter-progress",
    message: run.runId,
    createdAt: new Date().toISOString(),
  };
  return {
    ...state,
    chapters: {
      ...state.chapters,
      runs: {
        ...state.chapters.runs,
        [run.runId]: run,
      },
      sessions: {
        ...state.chapters.sessions,
        [session]: {
          activeRunId: run.runId,
          lastSeenChapterVersion: run.chapterVersion,
          updatedAt: run.updatedAt,
        },
      },
    },
    outbox: [
      ...(state.outbox || []).filter(
        (item) =>
          item.reason !== "chapter-progress" || item.message !== run.runId,
      ),
      progressItem,
    ],
  };
}
