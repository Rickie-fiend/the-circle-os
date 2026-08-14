import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DISMISSED_RETURN_HOURS,
  HOURLY_CHAPTER_BUDGET,
  DAILY_PROBE_BUDGET,
  chapterApp,
  chapterBlockReason,
  chapterDeckSignal,
  chapterFacts,
  chapterKind,
  latestChapterVersions,
  scheduleChapters,
  selectScheduledChapter,
} from "../app/os/chapters/chapter-scheduler.js";
import {
  createEmptyState,
  declareLife,
  getDateKey,
  habitCompletionId,
  previousDateKey,
} from "../app/os/circle-os-model.js";
import { validateChapter } from "../scripts/chapter-compiler.mjs";
import { assertPublishedChapterCapabilities } from "../app/os/chapters/chapter-registry-check.js";
import { selectThoughtPrompt } from "../app/os/thought-prompt-model.js";

const sparks = JSON.parse(
  await readFile(
    new URL("../app/os/chapters/published/sparks.json", import.meta.url),
    "utf8",
  ),
);
const published = JSON.parse(
  await readFile(
    new URL("../app/os/chapters/published/index.json", import.meta.url),
    "utf8",
  ),
);

const NOW = new Date("2026-08-12T12:00:00.000Z");

function chapter(id, extra = {}) {
  return {
    schemaVersion: 1,
    id,
    version: 1,
    status: "published",
    session: "check-in",
    theme: "light",
    title: id,
    purpose: "test",
    estimatedMinutes: 1,
    pages: [
      { id: "cover", type: "cover", title: id },
      { id: "complete", type: "result", title: "Done" },
    ],
    ...extra,
  };
}

function run(target, extra = {}) {
  return {
    [`${target.id}@${target.version}`]: {
      runId: `${target.id}@${target.version}`,
      chapterId: target.id,
      chapterVersion: target.version,
      status: "not-started",
      currentPageId: "cover",
      furthestPageId: "cover",
      startedAt: null,
      updatedAt: NOW.toISOString(),
      completedAt: null,
      answers: [],
      ...extra,
    },
  };
}

test("kind and app capabilities do not inherit behavior from session", () => {
  assert.equal(chapterKind(chapter("plain")), "check-in");
  assert.equal(chapterKind(chapter("plain-habit", { session: "habit" })), "check-in");
  assert.equal(chapterKind(chapter("h", { kind: "lesson" })), "lesson");
  assert.equal(chapterApp(chapter("h", { app: "habit" })), "habit");
  assert.equal(chapterKind(chapter("s", { kind: "spark" })), "spark");
  assert.equal(chapterApp(chapter("p", { app: "protocol" })), "protocol");
  assert.throws(() => chapterKind(chapter("bad", { kind: "unknown" })), /unknown kind/);
});

test("chapterApp routes every declaration to Vision", () => {
  for (const [id, session] of [
    ["declare-vision", "declaration-vision"],
    ["declare-mission-statement", "declaration-mission-statement"],
    ["declare-typical-tuesday", "declaration-typical-tuesday"],
    ["declare-dreamline", "declaration-dreamline"],
  ]) {
    assert.equal(chapterApp(chapter(id, { session })), "vision");
  }
});

test("every shipped declaration publication opens in Vision", () => {
  const declarations = published.chapters.filter((chapter) =>
    chapter.id.startsWith("declare-"),
  );
  assert.deepEqual(
    declarations.map((chapter) => `${chapter.id}@${chapter.version}`).sort(),
    [
      "declare-dreamline@1",
      "declare-mission-statement@1",
      "declare-typical-tuesday@1",
      "declare-vision@1",
    ],
  );
  assert.ok(declarations.every((chapter) => chapterApp(chapter) === "vision"));
});

test("chapterApp rejects an unknown session with no explicit app", () => {
  assert.throws(
    () => chapterApp(chapter("unknown", { session: "unknown-session" })),
    /unknown-session.*has no app routing/,
  );
});

test("the chapter compiler rejects an unknown session with no app", () => {
  assert.throws(
    () => validateChapter(chapter("compiler-unknown", { session: "unknown-session" })),
    /unknown-session.*has no app routing/,
  );
});

test("the published registry rejects an unknown session with no app", () => {
  assert.throws(
    () => assertPublishedChapterCapabilities([
      chapter("registry-unknown", { session: "unknown-session" }),
    ]),
    /unknown-session.*has no app routing/,
  );
});

test("only the highest version of a chapter id can be delivered", () => {
  const versions = [
    chapter("rotate", { version: 1 }),
    chapter("rotate", { version: 3 }),
    chapter("rotate", { version: 2 }),
    chapter("other"),
  ];
  const latest = latestChapterVersions(versions);
  assert.equal(latest.length, 2);
  assert.equal(latest.find((item) => item.id === "rotate").version, 3);
});

test("delivery windows, requirements and cooldowns each block with a reason", () => {
  const facts = { loggedDays: 3, hasVision: false, habitStreakBroken: false, weekday: 3 };
  const context = { now: NOW, facts };

  assert.equal(chapterBlockReason(chapter("open"), context), "");
  assert.equal(
    chapterBlockReason(chapter("early", { earliestAt: "2026-08-20T00:00:00.000Z" }), context),
    "not-yet",
  );
  assert.equal(
    chapterBlockReason(chapter("gone", { expiresAt: "2026-08-01T00:00:00.000Z" }), context),
    "expired",
  );
  assert.equal(
    chapterBlockReason(chapter("deep", { requires: { minLoggedDays: 7 } }), context),
    "requires-more-days",
  );
  assert.equal(
    chapterBlockReason(chapter("new", { requires: { maxLoggedDays: 2 } }), context),
    "requires-fewer-days",
  );
  assert.equal(
    chapterBlockReason(chapter("gap", { requires: { hasVision: true } }), context),
    "requires-vision",
  );
  assert.equal(
    chapterBlockReason(chapter("miss", { requires: { habitStreakBroken: true } }), context),
    "requires-habit-state",
  );
  assert.equal(
    chapterBlockReason(chapter("sun", { requires: { weekdays: [0] } }), context),
    "requires-weekday",
  );
  assert.equal(
    chapterBlockReason(chapter("wed", { requires: { weekdays: [3] } }), context),
    "",
  );
});

test("a finished chapter stays finished unless it carries a cooldown", () => {
  const plain = chapter("once");
  const repeating = chapter("again", { cooldownDays: 30 });
  const finishedYesterday = {
    status: "completed",
    completedAt: "2026-08-11T12:00:00.000Z",
  };
  const finishedLongAgo = {
    status: "completed",
    completedAt: "2026-06-01T12:00:00.000Z",
  };

  assert.equal(
    chapterBlockReason(plain, { now: NOW, run: { ...finishedLongAgo } }),
    "completed",
  );
  assert.equal(
    chapterBlockReason(repeating, { now: NOW, run: { ...finishedYesterday } }),
    "cooldown",
  );
  assert.equal(
    chapterBlockReason(repeating, { now: NOW, run: { ...finishedLongAgo } }),
    "",
  );
});

test("a chapter put aside waits a few hours and then comes back", () => {
  const dismissed = chapter("dismissed");
  const justNow = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString();

  // Not now.
  assert.equal(
    chapterBlockReason(dismissed, { now: NOW, run: { dismissedAt: justNow } }),
    "dismissed",
  );
  assert.equal(
    selectScheduledChapter([dismissed], run(dismissed, { dismissedAt: justNow }), {
      now: NOW,
    }),
    undefined,
  );

  // Not never.
  const earlier = new Date(
    NOW.getTime() - (DISMISSED_RETURN_HOURS + 1) * 60 * 60 * 1000,
  ).toISOString();
  assert.equal(
    chapterBlockReason(dismissed, { now: NOW, run: { dismissedAt: earlier } }),
    "",
  );
  assert.equal(
    selectScheduledChapter([dismissed], run(dismissed, { dismissedAt: earlier }), {
      now: NOW,
    })?.id,
    "dismissed",
  );
});

test("the hour is what refills, so an empty hour becomes a full one", () => {
  const deck = Array.from({ length: HOURLY_CHAPTER_BUDGET + 1 }, (_, index) =>
    chapter(`spark-${index}`),
  );
  const thisHour = NOW.toISOString();
  const runs = Object.assign(
    {},
    ...deck.slice(0, HOURLY_CHAPTER_BUDGET).map((item) =>
      run(item, { status: "completed", startedAt: thisHour, completedAt: thisHour }),
    ),
  );

  // The hour is spent.
  assert.equal(selectScheduledChapter(deck, runs, { now: NOW }), undefined);

  // An hour later the same runs no longer count against it.
  const nextHour = new Date(NOW.getTime() + 61 * 60 * 1000);
  assert.ok(selectScheduledChapter(deck, runs, { now: nextHour }));
});

test("the deck rotates to the chapter touched least recently", () => {
  const older = chapter("b-older");
  const newer = chapter("a-newer");
  const runs = {
    ...run(older, { updatedAt: "2026-08-01T12:00:00.000Z" }),
    ...run(newer, { updatedAt: "2026-08-11T12:00:00.000Z" }),
  };
  // Alphabetically "a-newer" wins; by rotation "b-older" should.
  assert.equal(
    selectScheduledChapter([newer, older], runs, { now: NOW }).id,
    "b-older",
  );
});

test("weight outranks rotation, and an unfinished chapter outranks both", () => {
  const light = chapter("light");
  const heavy = chapter("heavy", { weight: 5 });
  assert.equal(
    selectScheduledChapter([light, heavy], {}, { now: NOW }).id,
    "heavy",
  );

  const started = chapter("started");
  assert.equal(
    selectScheduledChapter(
      [heavy, started],
      run(started, { status: "in-progress", startedAt: NOW.toISOString() }),
      { now: NOW },
    ).id,
    "started",
  );
});

test("the hourly budget holds back new chapters but never a started one", () => {
  const opened = Array.from({ length: HOURLY_CHAPTER_BUDGET }, (_, index) =>
    chapter(`opened-${index}`),
  );
  const waiting = chapter("waiting");
  const runs = Object.assign(
    {},
    ...opened.map((item) =>
      run(item, {
        status: "completed",
        startedAt: NOW.toISOString(),
        completedAt: NOW.toISOString(),
      }),
    ),
  );

  assert.equal(
    selectScheduledChapter([...opened, waiting], runs, { now: NOW }),
    undefined,
  );

  const unfinished = chapter("unfinished");
  const withUnfinished = {
    ...runs,
    ...run(unfinished, { status: "in-progress", startedAt: NOW.toISOString() }),
  };
  assert.equal(
    selectScheduledChapter([...opened, waiting, unfinished], withUnfinished, {
      now: NOW,
    }).id,
    "unfinished",
  );
});

test("only one probe a day, while sparks keep flowing", () => {
  const answered = chapter("probe-answered", { kind: "probe" });
  const nextProbe = chapter("probe-next", { kind: "probe" });
  const spark = chapter("spark-free", { kind: "spark" });
  const runs = run(answered, {
    status: "completed",
    startedAt: NOW.toISOString(),
    completedAt: NOW.toISOString(),
  });

  assert.equal(DAILY_PROBE_BUDGET, 1);
  const ranked = scheduleChapters([answered, nextProbe, spark], runs, {
    now: NOW,
  });
  assert.deepEqual(
    ranked.map((item) => item.id),
    ["spark-free"],
  );
});

test("an untouched deck offers delight before it offers a survey", () => {
  const survey = chapter("a-survey", { kind: "probe" });
  const lesson = chapter("m-lesson", { kind: "lesson" });
  const joke = chapter("z-joke", { kind: "spark" });
  // Alphabetically the probe wins and the joke loses; by kind it is the reverse.
  assert.deepEqual(
    scheduleChapters([survey, lesson, joke], {}, { now: NOW }).map(
      (item) => item.id,
    ),
    ["z-joke", "m-lesson", "a-survey"],
  );
});

test("a rotation that has begun outranks the kind order", () => {
  const joke = chapter("z-joke", { kind: "spark" });
  const lesson = chapter("m-lesson", { kind: "lesson" });
  // The joke was seen today, so the lesson is due even though sparks lead a
  // fresh deck.
  assert.equal(
    selectScheduledChapter(
      [joke, lesson],
      run(joke, { status: "in-progress", updatedAt: NOW.toISOString() }),
      { now: NOW },
    ).id,
    "z-joke",
    "an unfinished chapter still comes first",
  );
  assert.equal(
    selectScheduledChapter([joke, lesson], run(joke, {
      updatedAt: NOW.toISOString(),
    }), { now: NOW }).id,
    "m-lesson",
  );
});

test("the App Box signal is only fresh when something has never been opened", () => {
  const fresh = chapter("fresh", { app: "note" });
  const seen = chapter("seen", { app: "note" });
  assert.deepEqual(
    (({ count, hasFresh }) => ({ count, hasFresh }))(
      chapterDeckSignal([fresh], {}, { now: NOW, app: "note" }),
    ),
    { count: 1, hasFresh: true },
  );
  assert.equal(
    chapterDeckSignal(
      [seen],
      run(seen, { status: "in-progress", startedAt: NOW.toISOString() }),
      { now: NOW, app: "note" },
    ).hasFresh,
    false,
  );
  assert.equal(
    chapterDeckSignal([chapter("elsewhere", { app: "habit" })], {}, {
      now: NOW,
      app: "note",
    }).count,
    0,
  );
});

test("facts are read from the real shape of a Circle state", () => {
  const empty = createEmptyState();
  const base = chapterFacts(empty, NOW);
  assert.equal(base.loggedDays, 0);
  assert.equal(base.hasVision, false);
  // Nothing is defined, so no streak exists to be broken.
  assert.equal(base.habitStreakBroken, false);

  const todayKey = getDateKey(NOW);
  const yesterdayKey = previousDateKey(todayKey);
  const withVision = declareLife(
    empty,
    "vision",
    {
      life: "A calm home where people make things together.",
      why: "Shared work and friendship matter.",
    },
    { id: "scheduler-vision", declaredAt: NOW.toISOString() },
  );
  const withEvidence = {
    ...withVision,
    days: {
      [yesterdayKey]: {
        date: yesterdayKey,
        checkIns: [{ period: "morning" }],
        timeBlocks: [],
        missions: [],
        logRange: null,
      },
      [todayKey]: {
        date: todayKey,
        checkIns: [],
        timeBlocks: [{ id: "block" }],
        missions: [],
        logRange: null,
      },
    },
    habits: {
      definitions: { walk: { id: "walk", text: "Walk" } },
      completions: {},
    },
  };

  const missed = chapterFacts(withEvidence, NOW);
  assert.equal(missed.loggedDays, 2);
  assert.equal(missed.hasVision, true);
  assert.equal(missed.habitStreakBroken, true);

  const kept = chapterFacts(
    {
      ...withEvidence,
      habits: {
        ...withEvidence.habits,
        completions: {
          [habitCompletionId("walk", yesterdayKey)]: {
            habitId: "walk",
            dateKey: yesterdayKey,
            completed: true,
          },
        },
      },
    },
    NOW,
  );
  assert.equal(kept.habitStreakBroken, false);
});

test("every shipped spark is a valid, deliverable chapter", () => {
  assert.ok(sparks.chapters.length >= 20);
  const keys = new Set();
  for (const spark of sparks.chapters) {
    validateChapter(spark, spark.id);
    assert.equal(chapterKind(spark), "spark");
    assert.equal(chapterApp(spark), "note");
    assert.equal(spark.status, "published");
    keys.add(`${spark.id}@${spark.version}`);
    // A spark that cannot come back around is a spark used once.
    assert.ok(spark.cooldownDays > 0, `${spark.id} needs a cooldown`);
    // Templated idle bodies must name an answer the chapter actually collects.
    const answerKeys = new Set(
      spark.pages.map((page) => page.answerKey).filter(Boolean),
    );
    for (const [, key] of String(
      spark.pages.at(-1)?.body || "",
    ).matchAll(/\{\{([a-z0-9-]+)\}\}/gi)) {
      assert.ok(answerKeys.has(key), `${spark.id} templates unknown ${key}`);
    }
  }
  assert.equal(keys.size, sparks.chapters.length);
});

test("a third of the sparks ask for nothing but a tap", () => {
  const inputTypes = new Set([
    "single-choice",
    "multi-choice",
    "yes-no",
    "slider",
    "short-text",
    "long-text",
    "time",
  ]);
  const effortless = sparks.chapters.filter(
    (spark) => !spark.pages.some((page) => inputTypes.has(page.type)),
  );
  // Sparks that give without asking are what buy the right to ask a probe.
  assert.ok(
    effortless.length >= 4,
    `only ${effortless.length} sparks ask for nothing`,
  );
});

test("the Thoughts placeholder changes through the day and never repeats a stale line", () => {
  const state = createEmptyState();
  const dateKey = getDateKey(NOW);
  const morning = selectThoughtPrompt(state, dateKey, new Date("2026-08-12T09:00:00"));
  const evening = selectThoughtPrompt(state, dateKey, new Date("2026-08-12T21:00:00"));
  assert.notEqual(morning, evening);
  assert.equal(
    selectThoughtPrompt(state, dateKey, new Date("2026-08-12T09:40:00")),
    morning,
    "the prompt must hold still within an hour",
  );
  assert.notEqual(
    selectThoughtPrompt(state, getDateKey(new Date("2026-08-13T12:00:00.000Z")), new Date("2026-08-13T09:00:00")),
    morning,
  );

  const named = {
    ...state,
    profile: { ...state.profile, identityFocus: "a calm man" },
  };
  const prompts = new Set(
    Array.from({ length: 24 }, (_, hour) =>
      selectThoughtPrompt(named, dateKey, new Date(2026, 7, 12, hour)),
    ),
  );
  assert.ok(prompts.size >= 8, `only ${prompts.size} distinct prompts in a day`);
  assert.ok(
    [...prompts].some((prompt) => prompt.includes("a calm man")),
    "an identity should reach the placeholder",
  );
});

test("a capitalised identity reads correctly inside the placeholder", () => {
  const state = createEmptyState();
  const dateKey = getDateKey(NOW);
  const article = {
    ...state,
    profile: {
      ...state.profile,
      identityFocus: "A person who builds in the morning",
    },
  };
  const named = {
    ...state,
    profile: { ...state.profile, identityFocus: "Sai at forty" },
  };
  const promptsFor = (input) =>
    Array.from({ length: 24 }, (_, hour) =>
      selectThoughtPrompt(input, dateKey, new Date(2026, 7, 12, hour)),
    );

  assert.ok(
    promptsFor(article).some((prompt) =>
      prompt.includes("would a person who builds in the morning say"),
    ),
    "an opening article is lowered mid-sentence",
  );
  // A name is not an article, so it keeps the capital the person gave it.
  assert.ok(
    promptsFor(named).some((prompt) => prompt.includes("would Sai at forty say")),
    "a name keeps its capital",
  );
});
