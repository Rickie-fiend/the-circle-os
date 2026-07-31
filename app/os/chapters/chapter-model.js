const INPUT_PAGE_TYPES = new Set([
  "single-choice",
  "multi-choice",
  "yes-no",
  "slider",
  "short-text",
  "long-text",
  "time",
]);
const COMPLETION_PAGE_TYPES = new Set(["confirm", "result"]);

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
  const currentPage = answers.length
    ? firstUnanswered ||
      chapter.pages.find((page) => COMPLETION_PAGE_TYPES.has(page.type)) ||
      chapter.pages.at(-1)
    : chapter.pages[0];

  return {
    runId: chapterRunId(chapter),
    chapterId: chapter.id,
    chapterVersion: chapter.version,
    status: answers.length ? "in-progress" : "not-started",
    currentPageId: currentPage.id,
    furthestPageId: currentPage.id,
    startedAt: answers.length ? timestamp : null,
    updatedAt: timestamp,
    completedAt: null,
    deferCount: 0,
    deferredAt: null,
    dismissedAt: null,
    answers,
  };
}

export function findChapterAnswer(run, answerKey) {
  return run.answers.find((answer) => answer.answerKey === answerKey);
}

export function chapterAnswerText(run, answerKey) {
  const answer = findChapterAnswer(run, answerKey);
  if (!answer) return "";
  if (answer.displaySnapshot) return answer.displaySnapshot;
  return Array.isArray(answer.value)
    ? answer.value.join(", ")
    : String(answer.value ?? "");
}

export function renderChapterTemplate(value, run) {
  return String(value || "").replace(
    /\{\{([a-z0-9-]+)\}\}/gi,
    (_, answerKey) => chapterAnswerText(run, answerKey),
  );
}

function chapterHourKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
  ].join("-");
}

export function selectHourlyChapter(chapters, runs, nowValue = new Date()) {
  const ordered = [...chapters].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  if (!ordered.length) return undefined;
  const eligible = ordered.filter(
    (chapter) => !runs[chapterRunId(chapter)]?.dismissedAt,
  );
  if (!eligible.length) return undefined;
  const active = eligible.filter((chapter) => {
    const run = runs[chapterRunId(chapter)];
    return run?.status === "in-progress";
  });
  const deferredThisHour = active.find((chapter) => {
    const run = runs[chapterRunId(chapter)];
    return (
      run?.deferredAt &&
      chapterHourKey(run.deferredAt) === chapterHourKey(nowValue)
    );
  });
  // "Later" should hold the idle app in place for this hour. Without this,
  // another untouched chapter replaces the cover as soon as it is deferred.
  if (deferredThisHour) return deferredThisHour;
  const freshActive = active.find(
    (chapter) => !(runs[chapterRunId(chapter)]?.deferCount || 0),
  );
  if (freshActive) return freshActive;
  const completed = eligible
    .map((chapter) => ({
      chapter,
      run: runs[chapterRunId(chapter)],
    }))
    .filter(({ run }) => run?.status === "completed" && run.completedAt)
    .sort(({ run: left }, { run: right }) =>
      String(right.completedAt).localeCompare(String(left.completedAt)),
    );
  const latest = completed[0];
  if (
    latest &&
    chapterHourKey(latest.run.completedAt) === chapterHourKey(nowValue)
  ) {
    return latest.chapter;
  }
  return (
    eligible.find((chapter) => {
      const run = runs[chapterRunId(chapter)];
      return run?.status !== "completed" && !(run?.deferCount || 0);
    }) ||
    active[0] ||
    eligible.find(
      (chapter) => runs[chapterRunId(chapter)]?.status !== "completed",
    ) ||
    latest?.chapter ||
    eligible.at(-1)
  );
}

export function selectManualChapter(chapters, runs, currentChapterId = "") {
  const next = chapters.find((chapter) => {
    const run = runs[chapterRunId(chapter)];
    return (
      chapter.id !== currentChapterId &&
      run?.status !== "completed" &&
      !run?.dismissedAt
    );
  });
  if (next) return { chapter: next, repeat: false };

  const repeat =
    chapters.find((chapter) => chapter.id !== currentChapterId) || chapters[0];
  return repeat ? { chapter: repeat, repeat: true } : undefined;
}

export function moveChapterRun(chapter, run, pageId) {
  const nextIndex = chapter.pages.findIndex((page) => page.id === pageId);
  if (nextIndex < 0) return run;
  const furthestIndex = Math.max(
    chapter.pages.findIndex(
      (page) => page.id === (run.furthestPageId || run.currentPageId),
    ),
    chapter.pages.findIndex((page) => page.id === run.currentPageId),
  );
  return {
    ...run,
    currentPageId: pageId,
    furthestPageId: chapter.pages[Math.max(furthestIndex, nextIndex)].id,
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
  const completed = COMPLETION_PAGE_TYPES.has(page.type)
    ? !nextPage || nextPage.type === "idle"
    : !nextPage;
  const nextCurrentPage = nextPage || page;
  const furthestIndex = Math.max(
    chapter.pages.findIndex(
      (item) => item.id === (run.furthestPageId || run.currentPageId),
    ),
    chapter.pages.findIndex((item) => item.id === nextCurrentPage.id),
  );
  return {
    ...run,
    status: completed ? "completed" : "in-progress",
    currentPageId: nextCurrentPage.id,
    furthestPageId: chapter.pages[furthestIndex].id,
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
