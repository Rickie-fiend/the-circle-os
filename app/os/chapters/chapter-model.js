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

/**
 * Whether a chapter has ever been finished, in any version of itself.
 *
 * A run is keyed by version, which is right for a chapter that is played: a new
 * version is a new thing to read. It is wrong for setup. Editing the Log's
 * setup and publishing version 2 asked a person who had already answered it to
 * answer it again, and version 3 asked a third time. Sai: "The setup is showing
 * 3 times for log app." Setting up is something that happens once.
 */
export function chapterEverCompleted(runs, chapterId) {
  const prefix = `${chapterId}@`;
  return Object.entries(runs || {}).some(
    ([id, run]) => id.startsWith(prefix) && run?.status === "completed",
  );
}

function now() {
  return new Date().toISOString();
}

/**
 * Every `{{blank}}` the chapter's own words ask to have filled in.
 *
 * A blank is not a question: it stands in a title or a body and is filled from
 * what the App already knows, so the Page can say "This week was for running
 * the business" instead of asking him to remember. `renderChapterTemplate`
 * looks these up by name across the whole run.
 */
function templateKeys(chapter) {
  const keys = new Set();
  for (const page of chapter.pages || []) {
    for (const field of [page.title, page.body, page.question, page.why, page.placeholder]) {
      for (const match of String(field || "").matchAll(/\{\{([a-z0-9-]+)\}\}/gi)) {
        keys.add(match[1]);
      }
    }
  }
  return keys;
}

export function createChapterRun(chapter, seedAnswers = []) {
  const timestamp = now();
  /* A seed survives if the chapter has somewhere to put it: a question it
   * answers ahead of time, or a blank in the words that asks for it.
   *
   * This used to keep only the first kind, so a `{{blank}}` on a cover or an
   * info Page could never be filled — the seed was dropped before the Page was
   * ever drawn, and the words rendered with a hole in them. The Week Review's
   * "This week was for it." had been blank since the day it was written. */
  const blanks = templateKeys(chapter);
  const answeredAhead = seedAnswers.filter((answer) =>
    chapter.pages.some(
      (page) =>
        page.id === answer.pageId &&
        page.answerKey === answer.answerKey &&
        INPUT_PAGE_TYPES.has(page.type),
    ),
  );
  // A blank belongs to the chapter, not to a Page: the same name can stand in a
  // cover and a body, and no Page declares it. So it is kept on the name alone,
  // which is how `renderChapterTemplate` looks it up.
  const filledBlanks = seedAnswers.filter(
    (answer) =>
      blanks.has(answer.answerKey) && !answeredAhead.includes(answer),
  );
  const answers = [...answeredAhead, ...filledBlanks];
  const firstUnanswered = chapter.pages.find(
    (page) =>
      INPUT_PAGE_TYPES.has(page.type) &&
      page.answerKey &&
      !answers.some((answer) => answer.answerKey === page.answerKey),
  );
  /* Only a question answered ahead of time moves the starting Page.
   *
   * A filled blank is not progress — it is the chapter knowing something before
   * it opens its mouth — so a greeting whose cover says the person's name must
   * still start on the cover. Counting blanks here opened the day's greeting on
   * its second Page. */
  const currentPage = answeredAhead.length
    ? firstUnanswered ||
      chapter.pages.find((page) => COMPLETION_PAGE_TYPES.has(page.type)) ||
      chapter.pages.at(-1)
    : chapter.pages[0];

  return {
    runId: chapterRunId(chapter),
    chapterId: chapter.id,
    chapterVersion: chapter.version,
    status: answeredAhead.length ? "in-progress" : "not-started",
    currentPageId: currentPage.id,
    furthestPageId: currentPage.id,
    startedAt: answeredAhead.length ? timestamp : null,
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
  const isUnfinished = (chapter) => {
    const run = runs[chapterRunId(chapter)];
    return run?.status !== "completed" && !run?.dismissedAt;
  };
  const next = chapters.find((chapter) => {
    const run = runs[chapterRunId(chapter)];
    return chapter.id !== currentChapterId && isUnfinished(chapter) && !run?.deferredAt;
  });
  if (next) return { chapter: next, repeat: false };

  const later = chapters.find(
    (chapter) =>
      chapter.id !== currentChapterId &&
      isUnfinished(chapter) &&
      runs[chapterRunId(chapter)]?.deferredAt,
  );
  if (later) return { chapter: later, repeat: false };

  const current = chapters.find(
    (chapter) => chapter.id === currentChapterId && isUnfinished(chapter),
  );
  return current ? { chapter: current, repeat: false } : undefined;
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
  const timestamp = new Date().toISOString();
  const revision = Number(state.evidence?.localRevision || 0) + 1;
  const progressItem = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `chapter-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    reason: "chapter-progress",
    message: run.runId,
    revision,
    createdAt: timestamp,
  };
  return {
    ...state,
    evidence: {
      ...(state.evidence || {}),
      localRevision: revision,
      lastChangedAt: timestamp,
    },
    profile: {
      ...state.profile,
      profileCase: {
        ...state.profile.profileCase,
        status: "waiting",
      },
    },
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

/**
 * A setup sheet, put down.
 *
 * The ladder was built as a sequence of sheets that each own the screen until
 * they are answered: day one, then the week the day after, then the Log's. Sai:
 * "allow the splash screen to be dismiss for now, it show up a number of times
 * now. so that i have to fill everytime." A person who opens the App to write
 * one line should not have to finish a chapter first.
 *
 * The deferral is written onto the run rather than held in the tab, so it
 * survives the App being closed, and it is dated rather than permanent: the
 * sheet stands down for the rest of the day and is offered again tomorrow.
 * Setting up is still something that has to happen — it just no longer happens
 * at gunpoint.
 */
export function deferChapterRun(run, at = now()) {
  return {
    ...run,
    deferCount: (run?.deferCount || 0) + 1,
    deferredAt: at,
    dismissedAt: at,
    updatedAt: at,
  };
}

/**
 * Offer a chapter again, as if it had never been answered.
 *
 * A setup chapter is offered until it has been answered once, which is right
 * for the person living with the App and wrong for the person building it: to
 * see day one again he would have to clear the whole device. Sai: "add a
 * feature to rerun the chapter, in workshop ... so that if i want to try and
 * re run the chapter on the splashscreen i could."
 *
 * The run is reset rather than deleted, and that is not a detail. `mergeServerState`
 * merges runs as a union with the server's copy and keeps whichever has the
 * later `updatedAt`, so a locally deleted run simply comes back on the next
 * sync — which is exactly what happened the first time this was written as a
 * delete. A reset run carries a fresh timestamp, so it wins the merge and the
 * gates see a chapter that has not been completed.
 *
 * Only the run is reset. What a completed run wrote — the habit, the goal, the
 * phase, the week's record — is his real data and is left where it is, so
 * running day one again does not hand him a second character.
 */
export function resetChapterRuns(state, chapterId, firstPageId, at = now()) {
  const id = typeof chapterId === "string" ? chapterId.trim() : "";
  if (!id) return state;
  const prefix = `${id}@`;
  const runs = state?.chapters?.runs || {};
  const matching = Object.keys(runs).filter((runId) => runId.startsWith(prefix));
  if (!matching.length) return state;
  const reset = { ...runs };
  for (const runId of matching) {
    const page = firstPageId || runs[runId]?.currentPageId || "";
    reset[runId] = {
      ...runs[runId],
      status: "not-started",
      answers: [],
      currentPageId: page,
      furthestPageId: page,
      startedAt: null,
      completedAt: null,
      deferCount: 0,
      deferredAt: null,
      dismissedAt: null,
      updatedAt: at,
    };
  }
  return { ...state, chapters: { ...state.chapters, runs: reset } };
}
