import assert from "node:assert/strict";
import test from "node:test";

import {
  HABIT_QUESTIONS,
  LOG_SETUP_QUESTIONS,
  PROFILE_QUESTIONS,
  PROTOCOL_DURATIONS,
  activeProtocolRun,
  addDreamlineStep,
  addHabitDefinition,
  addProtocolItem,
  addTask,
  answerSurveyQuestion,
  appSessionIndex,
  applyProfileResult,
  beginProtocolRun,
  buildVisionAnalysis,
  buildSevenDayClaims,
  buildWeekReview,
  buildWeekClaims,
  canBeginProtocolRun,
  completeTask,
  compareVisionDeclarations,
  connectLocalAi,
  concludeExpiredDreamlines,
  createEmptyState,
  createSampleState,
  currentDeclaration,
  currentDreamline,
  dayRecord,
  declarationVersions,
  declareLife,
  dreamlineIncome,
  dreamlineRecords,
  discardEmptyHabit,
  discardEmptyProtocolItem,
  discardEmptyTask,
  endProtocolRun,
  ensureDay,
  getDateKey,
  getDayPeriod,
  hasReadableProfileCase,
  latestCompletedProtocol,
  mergeServerState,
  minutesBetween,
  normalizeState,
  previousDateKey,
  protocolDay,
  protocolItems,
  protocolToday,
  queueSuggestion,
  reopenTask,
  setAppSessionIndex,
  setDayLogRange,
  setProtocolDays,
  sealProtocolDay,
  saveDreamlineItem,
  startProtocolDraft,
  startDreamline,
  summarizeWeek,
  toggleHabitForDay,
  toggleProtocolItem,
  toggleProtocolRecordItem,
  setDreamlineStarred,
  updateHabitDefinition,
  updateRoutineIdentity,
  updateDreamlineStep,
  updateProtocolItem,
  updateTask,
  upsertTimeBlock,
  weekActivityGroup,
  weekActivityTally,
} from "../app/os/circle-os-model.js";

test("profile and habit cards save structured answers immediately", () => {
  let state = createEmptyState();
  state = answerSurveyQuestion(
    state,
    PROFILE_QUESTIONS[0],
    "Making something",
    "profile",
  );
  state = answerSurveyQuestion(
    state,
    HABIT_QUESTIONS[1],
    "A person who follows through",
    "habit",
  );
  state = answerSurveyQuestion(
    state,
    HABIT_QUESTIONS[2],
    "Write for ten minutes",
    "habit",
  );

  assert.equal(state.profile.profileCase.survey.answers.length, 3);
  assert.equal(
    state.profile.profileCase.survey.answers[0].kind,
    "profile",
  );
  const savedHabit = Object.values(state.habits.definitions)[0];
  assert.equal(savedHabit.text, "Write for ten minutes");
  assert.equal(state.profile.identityFocus, "A person who follows through");
  assert.ok(state.outbox.some((item) => item.reason === "survey-answer"));
  assert.ok(state.outbox.some((item) => item.reason === "habit-answer"));
});

test("habits persist while their completion remains scoped to one Circle day", () => {
  let state = createEmptyState();
  const created = addHabitDefinition(state, "habit-steady");
  state = updateHabitDefinition(created.state, created.id, "Meditate");
  state = toggleHabitForDay(state, created.id, "2026-08-04");
  state = ensureDay(state, "2026-08-05");

  assert.equal(state.habits.definitions[created.id].text, "Meditate");
  assert.equal(state.habits.completions["2026-08-04:habit-steady"].completed, true);
  assert.equal(state.habits.completions["2026-08-05:habit-steady"], undefined);
});

test("Routine identity is dated, locally queued, and a clearing edit persists", () => {
  let state = createEmptyState();
  state = updateRoutineIdentity(state, "Leader");

  assert.equal(state.habits.identity.text, "Leader");
  assert.ok(state.habits.identity.updatedAt);
  assert.ok(state.outbox.some((item) => item.reason === "routine-identity"));

  const firstUpdate = state.habits.identity.updatedAt;
  state = updateRoutineIdentity(state, "");
  assert.equal(state.habits.identity.text, "");
  assert.ok(state.habits.identity.updatedAt >= firstUpdate);
});

test("Routine identity merge keeps the newest dated value, including empty", () => {
  const phone = createEmptyState();
  const server = createEmptyState();
  phone.habits.identity = {
    text: "",
    updatedAt: "2026-08-14T09:00:00.000Z",
  };
  server.habits.identity = {
    text: "Leader",
    updatedAt: "2026-08-14T08:00:00.000Z",
  };

  const merged = mergeServerState(phone, server);
  assert.deepEqual(merged.habits.identity, phone.habits.identity);
});

test("open tasks cross the day boundary and completed tasks remain records", () => {
  let state = createEmptyState();
  const created = addTask(state, "task-steady");
  state = updateTask(created.state, created.id, "Call the dentist");
  state = ensureDay(state, "2026-08-05");
  assert.equal(state.tasks.items[created.id].status, "open");

  state = completeTask(state, created.id);
  assert.equal(state.tasks.items[created.id].status, "completed");
  assert.ok(state.tasks.items[created.id].completedAt);
});

test("legacy day missions migrate without changing historical day evidence", () => {
  const legacyDay = {
    date: "2026-08-03",
    mission: {
      text: "Read",
      completed: true,
      completedAt: "2026-08-03T08:00:00.000Z",
      updatedAt: "2026-08-03T08:00:00.000Z",
    },
    missions: [
      {
        id: "habit-water",
        kind: "habit",
        text: "Drink water",
        completed: false,
        createdAt: "2026-08-03T07:00:00.000Z",
        updatedAt: "2026-08-03T07:00:00.000Z",
      },
      {
        id: "task-letter",
        kind: "task",
        text: "Post letter",
        completed: false,
        createdAt: "2026-08-03T07:30:00.000Z",
        updatedAt: "2026-08-03T07:30:00.000Z",
      },
    ],
    checkIns: [],
    timeBlocks: [],
  };
  const state = normalizeState({
    version: 4,
    profile: {},
    days: { "2026-08-03": legacyDay },
  });

  assert.equal(state.habits.definitions["legacy-primary-habit"].text, "Read");
  assert.equal(state.habits.definitions["habit-water"].text, "Drink water");
  assert.equal(state.tasks.items["task-letter"].status, "open");
  assert.deepEqual(state.days["2026-08-03"].missions, legacyDay.missions);
});

test("Thoughts remain raw while Athena captures only a clear source-linked fact", () => {
  const state = answerSurveyQuestion(
    createEmptyState(),
    {
      id: "thought-123",
      text: "A thought I wanted to keep",
      target: "currentLife",
    },
    "I watched Perfect Days. I loved how calm it felt.",
    "thought",
  );
  const raw = state.profile.profileCase.survey.answers.find(
    (answer) => answer.questionId === "thought-123",
  );
  assert.equal(raw.answer, "I watched Perfect Days. I loved how calm it felt.");
  assert.equal(state.athenaMemory.ledger[0].label, "Perfect Days");
  assert.equal(state.athenaMemory.ledger[0].sourceRefs[0].sourceId, "thought-123");
  assert.equal(state.athenaMemory.portrait.length, 0);
});

test("maps hours into the four lightweight check-in periods", () => {
  assert.equal(getDayPeriod(7), "morning");
  assert.equal(getDayPeriod(12), "midday");
  assert.equal(getDayPeriod(17), "afternoon");
  assert.equal(getDayPeriod(22), "evening");
});

test("keeps after-midnight reflection in the finished day until 6 AM", () => {
  assert.equal(getDateKey(new Date(2026, 6, 30, 0, 1)), "2026-07-29");
  assert.equal(getDateKey(new Date(2026, 6, 30, 5, 59)), "2026-07-29");
  assert.equal(getDateKey(new Date(2026, 6, 30, 6, 0)), "2026-07-30");
});

test("keeps old device data and simplifies it into one Tuesday paragraph", () => {
  const state = normalizeState({
    version: 1,
    profile: {
      identityFocus: "Reader",
      name: "Sai",
      age: 30,
      typicalTuesday: {
        wakeUp: "I wake near the sea.",
        morning: "I write.",
        day: "I build with friends.",
        people: "",
        evening: "",
        feeling: "Calm.",
        completedAt: "2026-07-29T00:00:00.000Z",
      },
    },
    days: {},
  });

  assert.equal(state.profile.name, "Sai");
  assert.match(state.profile.vision.description, /wake near the sea/);
  assert.match(state.profile.vision.description, /build with friends/);
  assert.equal(
    state.profile.vision.completedAt,
    "2026-07-29T00:00:00.000Z",
  );
  assert.equal(
    state.profile.profileCase.sessions.typicalTuesday.text,
    "",
    "normalization must not copy a legacy vision into Athena's Typical Tuesday",
  );
  assert.deepEqual(
    state.declarations.records,
    {},
    "Sai's legacy writing stays where it is until he chooses to declare it",
  );
});

test("declarations append, date, and supersede without changing the old version", () => {
  let state = createEmptyState();
  state = declareLife(
    state,
    "vision",
    {
      life: "A home where people make useful things together.",
      why: "It makes work and friendship part of one life.",
    },
    { id: "vision-one", declaredAt: "2026-08-01T09:00:00.000Z" },
  );
  const firstSnapshot = structuredClone(state.declarations.records["vision-one"]);
  state = declareLife(
    state,
    "vision",
    {
      life: "A quiet life near the sea with room to write.",
      why: "Ease and attention matter more now.",
    },
    { id: "vision-two", declaredAt: "2026-08-14T09:00:00.000Z" },
  );

  assert.equal(currentDeclaration(state, "vision").id, "vision-two");
  assert.equal(
    state.declarations.records["vision-two"].supersedesId,
    "vision-one",
  );
  assert.deepEqual(state.declarations.records["vision-one"], firstSnapshot);
  assert.deepEqual(
    declarationVersions(state, "vision").map((record) => record.id),
    ["vision-two", "vision-one"],
  );
});

test("declaring preserves sibling declaration and task state", () => {
  let state = createEmptyState();
  state.declarations.sync = { cursor: "declaration-cursor" };
  state.tasks.sync = { cursor: "task-cursor" };

  state = declareLife(
    state,
    "dreamline",
    {
      dream: "Publish a small useful book.",
      now: "Write the first paragraph.",
      tomorrow: "Outline three chapters.",
      dayAfter: "Share the outline.",
    },
    { id: "dream-siblings", declaredAt: "2026-08-15T09:00:00.000Z" },
  );

  assert.deepEqual(state.declarations.sync, { cursor: "declaration-cursor" });
  assert.deepEqual(state.tasks.sync, { cursor: "task-cursor" });
});

test("two deliberately different declarations stay different in the app model", () => {
  let state = createEmptyState();
  state = declareLife(
    state,
    "vision",
    {
      life: "Build a generous creative home with friends.",
      why: "Shared work and close relationships feel worth protecting.",
    },
    { id: "different-vision", declaredAt: "2026-08-14T08:00:00.000Z" },
  );
  state = declareLife(
    state,
    "typicalTuesday",
    {
      wake: "Wake alone in a city hotel.",
      morning: "Trade markets before breakfast.",
      day: "Spend the day in meetings and airports.",
      people: "Meet clients I do not know yet.",
      evening: "Eat late while travelling.",
      feeling: "Fast and restless.",
    },
    { id: "different-tuesday", declaredAt: "2026-08-14T08:05:00.000Z" },
  );

  assert.deepEqual(compareVisionDeclarations(state), {
    mode: "different",
    different: true,
    text: "Your Vision and Typical Tuesday say different things.",
  });
});

test("a dreamline sends its now step to Today and a new version replaces the open step", () => {
  let state = createEmptyState();
  state = declareLife(
    state,
    "dreamline",
    {
      dream: "Publish the first small book.",
      now: "Write the first page.",
      tomorrow: "Read it out loud.",
      dayAfter: "Send it to one friend.",
    },
    { id: "dream-one", declaredAt: "2026-08-14T09:00:00.000Z" },
  );
  assert.equal(state.tasks.items["dreamline-now-dream-one"].text, "Write the first page.");
  assert.equal(state.tasks.items["dreamline-now-dream-one"].status, "open");
  assert.equal(
    state.declarations.records["dream-one"].targetAt,
    "2027-02-14T09:00:00.000Z",
  );

  state = declareLife(
    state,
    "dreamline",
    {
      dream: "Print the finished small book.",
      now: "Choose the final ten pages.",
      tomorrow: "Ask a printer for a quote.",
      dayAfter: "Make the cover list.",
    },
    { id: "dream-two", declaredAt: "2026-08-15T09:00:00.000Z" },
  );
  assert.equal(state.tasks.items["dreamline-now-dream-one"].status, "archived");
  assert.equal(state.tasks.items["dreamline-now-dream-two"].status, "open");
  assert.equal(state.tasks.items["dreamline-now-dream-two"].sourceDeclarationId, "dream-two");
});

test("the Dreamline App starts a separate finite record without migrating Vision writing", () => {
  let state = declareLife(
    createEmptyState(),
    "dreamline",
    {
      dream: "Publish the first small book.",
      now: "Write the first page.",
      tomorrow: "Read it out loud.",
      dayAfter: "Send it to one friend.",
    },
    { id: "legacy-dream", declaredAt: "2026-08-01T09:00:00.000Z" },
  );
  const started = startDreamline(state, {
    id: "lifestyle-one",
    months: 6,
    monthlyExpensesCents: 200000,
    startedAt: "2026-08-19T09:00:00.000Z",
  });
  state = started.state;

  assert.equal(currentDreamline(state, new Date("2026-08-20T09:00:00.000Z")).id, "lifestyle-one");
  assert.equal(state.dreamlines.records["lifestyle-one"].targetAt, "2027-02-19T09:00:00.000Z");
  assert.equal(state.declarations.records["legacy-dream"].content.dream, "Publish the first small book.");
  assert.equal(Object.keys(state.dreamlines.records).length, 1);
});

test("a Being is refused until it names the Doing that makes it real", () => {
  const started = startDreamline(createEmptyState(), {
    id: "being-test",
    startedAt: "2026-08-19T09:00:00.000Z",
  });
  const refused = saveDreamlineItem(
    started.state,
    "being-test",
    { category: "being", text: "An excellent storyteller", costCents: 0 },
    { id: "storyteller", updatedAt: "2026-08-19T09:01:00.000Z" },
  );
  assert.match(refused.error, /Doing that would make it real/i);
  assert.equal(started.state.dreamlines.records["being-test"].items.storyteller, undefined);

  const saved = saveDreamlineItem(
    started.state,
    "being-test",
    {
      category: "being",
      text: "An excellent storyteller",
      convertedDoing: "Give a one-minute story about anything",
      costCents: 0,
    },
    { id: "storyteller", updatedAt: "2026-08-19T09:02:00.000Z" },
  );
  assert.equal(saved.error, "");
  assert.equal(saved.item.convertedDoing, "Give a one-minute story about anything");
});

test("Dreamline costs carry one-time precision into A, B, C, TMI and TDI", () => {
  let state = startDreamline(createEmptyState(), {
    id: "worksheet",
    months: 6,
    monthlyExpensesCents: 200000,
    startedAt: "2026-08-19T09:00:00.000Z",
  }).state;
  const rows = [
    ["car", "having", "A car", 200300, "monthly"],
    ["assistant", "having", "An assistant", 40000, "monthly"],
    ["airfare", "doing", "Fly somewhere", 51400, "one-time"],
    ["rent", "doing", "Stay for a month", 42000, "one-time"],
  ];
  for (const [id, category, text, costCents, cadence] of rows) {
    state = saveDreamlineItem(
      state,
      "worksheet",
      { category, text, costCents, cadence },
      { id, updatedAt: `2026-08-19T09:0${rows.findIndex((row) => row[0] === id) + 1}:00.000Z` },
    ).state;
    state = setDreamlineStarred(state, "worksheet", id, true, {
      updatedAt: `2026-08-19T09:1${rows.findIndex((row) => row[0] === id)}:00.000Z`,
    }).state;
  }
  const income = dreamlineIncome(state.dreamlines.records.worksheet);
  assert.equal(income.having, 2403);
  assert.equal(income.being, 0);
  assert.ok(Math.abs(income.doing - 155.66666666666666) < 1e-9);
  assert.equal(income.expenseBuffer, 2600);
  assert.ok(Math.abs(income.monthly - 5158.666666666667) < 1e-9);
  assert.ok(Math.abs(income.daily - 171.95555555555558) < 1e-9);
});

test("only starred dreams take steps and unstarring preserves their writing", () => {
  let state = startDreamline(createEmptyState(), {
    id: "steps",
    startedAt: "2026-08-19T09:00:00.000Z",
  }).state;
  state = saveDreamlineItem(
    state,
    "steps",
    { category: "doing", text: "See Kyoto", costCents: 90000, cadence: "one-time" },
    { id: "kyoto", updatedAt: "2026-08-19T09:01:00.000Z" },
  ).state;
  const refused = addDreamlineStep(state, "steps", "kyoto", "Find the flight.", {
    updatedAt: "2026-08-19T09:02:00.000Z",
  });
  assert.match(refused.error, /Star a dream/i);
  state = setDreamlineStarred(state, "steps", "kyoto", true, {
    updatedAt: "2026-08-19T09:03:00.000Z",
  }).state;
  const added = addDreamlineStep(state, "steps", "kyoto", "Find the flight.", {
    id: "flight",
    updatedAt: "2026-08-19T09:04:00.000Z",
  });
  state = added.state;
  state = setDreamlineStarred(state, "steps", "kyoto", false, {
    updatedAt: "2026-08-19T09:05:00.000Z",
  }).state;
  const [step] = state.dreamlines.records.steps.items.kyoto.steps;
  assert.equal(step.text, "Find the flight.");
  assert.equal(state.dreamlines.records.steps.items.kyoto.starred, false);

  // Editing by id, and emptying one takes it out rather than leaving a blank
  // rung numbered in the middle of the track. Steps belong to a starred dream,
  // so this needs the star back first.
  state = setDreamlineStarred(state, "steps", "kyoto", true, {
    updatedAt: "2026-08-19T09:06:00.000Z",
  }).state;
  state = updateDreamlineStep(state, "steps", "kyoto", "flight", "", {
    updatedAt: "2026-08-19T09:07:00.000Z",
  }).state;
  assert.deepEqual(state.dreamlines.records.steps.items.kyoto.steps, []);
});

test("the three old step slots migrate into the ladder in order", () => {
  const migrated = normalizeState({
    ...createEmptyState(),
    days: { "2026-08-19": { date: "2026-08-19" } },
    profile: { name: "Sai" },
    dreamlines: {
      records: {
        old: {
          id: "old",
          status: "active",
          months: 6,
          createdAt: "2026-08-19T09:00:00.000Z",
          updatedAt: "2026-08-19T09:00:00.000Z",
          startedAt: "2026-08-19T09:00:00.000Z",
          items: {
            watch: {
              id: "watch",
              category: "having",
              text: "A watch",
              starred: true,
              steps: { now: "Find it", tomorrow: "Try it", dayAfter: "" },
              stepsDoneAt: { now: "2026-08-20T09:00:00.000Z", tomorrow: null, dayAfter: null },
              createdAt: "2026-08-19T09:00:00.000Z",
              updatedAt: "2026-08-19T09:00:00.000Z",
            },
          },
        },
      },
    },
  });
  const { steps } = migrated.dreamlines.records.old.items.watch;
  // The old key names carry over as ids, so a step keeps its identity and
  // nothing already ticked comes back undone.
  assert.deepEqual(
    steps.map((step) => [step.id, step.text, Boolean(step.doneAt)]),
    [
      ["now", "Find it", true],
      ["tomorrow", "Try it", false],
    ],
  );
});

test("an expired Dreamline reads concluded, persists once, and allows a new one", () => {
  let state = startDreamline(createEmptyState(), {
    id: "old-line",
    months: 1,
    startedAt: "2026-01-01T09:00:00.000Z",
  }).state;
  const now = new Date("2026-02-02T09:00:00.000Z");
  assert.equal(currentDreamline(state, now), null);
  assert.equal(dreamlineRecords(state, now)[0].status, "concluded");
  state = concludeExpiredDreamlines(state, now);
  assert.equal(state.dreamlines.records["old-line"].status, "concluded");
  assert.equal(state.dreamlines.records["old-line"].concludedAt, "2026-02-01T09:00:00.000Z");
  const next = startDreamline(state, {
    id: "new-line",
    months: 6,
    startedAt: "2026-02-02T09:01:00.000Z",
  });
  assert.equal(next.error, "");
  assert.equal(next.state.dreamlines.records["old-line"].status, "concluded");
  assert.equal(next.state.dreamlines.records["new-line"].status, "active");
});

test("declaration versions from two devices merge as an immutable union", () => {
  const base = createEmptyState();
  const remote = declareLife(
    base,
    "missionStatement",
    { statement: "Make useful things with care." },
    { id: "mission-remote", declaredAt: "2026-08-13T09:00:00.000Z" },
  );
  const local = declareLife(
    base,
    "missionStatement",
    { statement: "Be present and make useful things." },
    { id: "mission-local", declaredAt: "2026-08-14T09:00:00.000Z" },
  );
  const merged = mergeServerState(local, remote);
  assert.deepEqual(
    declarationVersions(merged, "missionStatement").map((record) => record.id),
    ["mission-local", "mission-remote"],
  );
});

test("Vision analysis stays cautious when the person has not logged a day", () => {
  const state = createEmptyState();
  state.profile.vision.description =
    "I wake slowly, make meaningful work, and spend dinner with friends.";
  state.profile.vision.completedAt = "2026-07-29T00:00:00.000Z";

  const analysis = buildVisionAnalysis(
    state,
    new Date("2026-07-29T12:00:00.000Z"),
  );

  assert.match(analysis.preview, /meaningful work/);
  assert.match(analysis.understanding, /do not know enough/i);
  assert.match(analysis.gap, /not enough evidence/i);
});

test("AI updates cannot overwrite a session the person edited", () => {
  const state = createEmptyState();
  state.profile.profileCase.sessions.whatMatters = {
    text: "Time with my brother matters to me.",
    confidence: 1,
    userEdited: true,
    updatedAt: "2026-07-29T00:00:00.000Z",
  };
  state.outbox = [{ id: "one", reason: "check-in", createdAt: "now" }];

  const updated = applyProfileResult(
    state,
    {
      sessions: {
        whatMatters: { text: "Only work matters.", confidence: 0.9 },
      },
      nextQuestion: null,
      dailyMission: "Call someone you love.",
    },
    "one",
  );

  assert.equal(
    updated.profile.profileCase.sessions.whatMatters.text,
    "Time with my brother matters to me.",
  );
  assert.equal(updated.outbox.length, 0);
});

test("connecting local AI queues an older profile for its first update", () => {
  const state = createEmptyState();
  state.profile.vision.completedAt = "2026-07-29T00:00:00.000Z";

  const connected = connectLocalAi(
    state,
    "https://computer.example.ts.net/",
  );

  assert.equal(connected.ai.baseUrl, "https://computer.example.ts.net");
  assert.equal(connected.outbox.length, 1);
  assert.equal(connected.outbox[0].reason, "connected");
});

test("reconnecting retries a profile update that failed earlier", () => {
  const state = createEmptyState();
  state.outbox = [
    {
      id: "old-update",
      reason: "first-vision",
      createdAt: "2026-07-29T00:00:00.000Z",
      triedAt: "2026-07-29T00:01:00.000Z",
    },
  ];

  const connected = connectLocalAi(state, "https://computer.example.ts.net");

  assert.equal(connected.outbox[0].triedAt, undefined);
});

test("keeps time-log correction deterministic", () => {
  const day = {
    date: "2026-07-28",
    checkIns: [],
    mission: null,
    timeBlocks: [],
  };

  const withLog = upsertTimeBlock(day, {
    id: "block-1",
    start: "09:00",
    end: "10:00",
    activity: "Focus",
    note: "",
    createdAt: "2026-07-28T09:00:00.000Z",
  });
  const corrected = upsertTimeBlock(withLog, {
    ...withLog.timeBlocks[0],
    activity: "Reading",
  });

  assert.equal(corrected.timeBlocks.length, 1);
  assert.equal(corrected.timeBlocks[0].activity, "Reading");
});

test("keeps added empty log hours after leaving Today", () => {
  const dateKey = "2026-07-28";
  let state = ensureDay(createEmptyState(), dateKey);
  state = {
    ...state,
    days: {
      ...state.days,
      [dateKey]: setDayLogRange(state.days[dateKey], 6, 25),
    },
  };

  const reopened = normalizeState(JSON.parse(JSON.stringify(state)));

  assert.deepEqual(reopened.days[dateKey].logRange, {
    startHour: 6,
    endHour: 25,
  });
  assert.equal(reopened.days[dateKey].timeBlocks.length, 0);
});

test("reopening keeps newer phone logs when the server day is older", () => {
  const phone = createEmptyState();
  const server = createEmptyState();
  const dateKey = "2026-07-30";
  phone.days[dateKey] = {
    ...ensureDay(phone, dateKey).days[dateKey],
    timeBlocks: [
      {
        id: "recent-phone-log",
        start: "21:00",
        end: "22:00",
        activity: "Talked with a friend",
        title: "Talked with a friend",
        note: "",
        moments: [],
        createdAt: "2026-07-30T21:00:00.000Z",
      },
    ],
  };
  phone.outbox = [
    {
      id: "pending-log",
      reason: "day-log",
      createdAt: "2026-07-30T21:01:00.000Z",
    },
  ];
  server.days[dateKey] = ensureDay(server, dateKey).days[dateKey];

  const reopened = mergeServerState(phone, server);

  assert.equal(
    reopened.days[dateKey].timeBlocks[0].title,
    "Talked with a friend",
  );
  assert.equal(reopened.outbox[0].id, "pending-log");
});

test("reopening keeps a newer habit edit made on the phone", () => {
  const phone = createEmptyState();
  const server = createEmptyState();
  const dateKey = "2026-07-30";
  phone.days[dateKey] = ensureDay(phone, dateKey).days[dateKey];
  server.days[dateKey] = ensureDay(server, dateKey).days[dateKey];
  phone.days[dateKey].mission = {
    ...phone.days[dateKey].mission,
    text: "Walk after lunch.",
    updatedAt: "2026-07-30T12:05:00.000Z",
  };
  server.days[dateKey].mission = {
    ...server.days[dateKey].mission,
    text: "Old server habit.",
    updatedAt: "2026-07-30T12:00:00.000Z",
  };

  const reopened = mergeServerState(phone, server);

  assert.equal(reopened.days[dateKey].mission.text, "Walk after lunch.");
});

test("reopening accepts a newer habit edit from the server", () => {
  const phone = createEmptyState();
  const server = createEmptyState();
  const dateKey = "2026-07-30";
  phone.days[dateKey] = ensureDay(phone, dateKey).days[dateKey];
  server.days[dateKey] = ensureDay(server, dateKey).days[dateKey];
  phone.days[dateKey].mission = {
    ...phone.days[dateKey].mission,
    text: "Old phone habit.",
    updatedAt: "2026-07-30T12:00:00.000Z",
  };
  server.days[dateKey].mission = {
    ...server.days[dateKey].mission,
    text: "Read after dinner.",
    updatedAt: "2026-07-30T12:05:00.000Z",
  };

  const reopened = mergeServerState(phone, server);

  assert.equal(reopened.days[dateKey].mission.text, "Read after dinner.");
});

test("a pending Athena update keeps the last readable profile", () => {
  const phone = createEmptyState();
  const server = createEmptyState();
  phone.profile.profileCase.updatedAt = "2026-07-30T06:15:00.000Z";
  phone.profile.profileCase.sessions.currentLife = {
    text: "You made time for creative work yesterday.",
    confidence: 0.7,
    userEdited: false,
    updatedAt: "2026-07-30T06:15:00.000Z",
  };
  server.profile.profileCase = structuredClone(phone.profile.profileCase);
  server.profile.profileCase.status = "waiting";

  const refreshed = mergeServerState(phone, server);

  assert.equal(refreshed.profile.profileCase.status, "waiting");
  assert.equal(
    refreshed.profile.profileCase.sessions.currentLife.text,
    "You made time for creative work yesterday.",
  );
  assert.equal(
    refreshed.profile.profileCase.updatedAt,
    "2026-07-30T06:15:00.000Z",
  );
});

test("routine answers unlock the day without becoming profile claims", () => {
  let state = createEmptyState();
  state = answerSurveyQuestion(
    state,
    LOG_SETUP_QUESTIONS[0],
    "07:00",
    "routine",
  );
  state = answerSurveyQuestion(
    state,
    LOG_SETUP_QUESTIONS[1],
    "00:00",
    "routine",
  );

  const routine = state.profile.profileCase.survey.answers.filter(
    (answer) => answer.kind === "routine",
  );

  assert.deepEqual(
    routine.map((answer) => answer.answer),
    ["07:00", "00:00"],
  );
  assert.equal(minutesBetween("23:00", "00:00"), 60);
});

test("the editable check-in note can be changed or cleared", () => {
  const note = {
    id: "checkin-note",
    prompt: "A note for later",
    type: "text",
  };
  let state = createEmptyState();
  state = answerSurveyQuestion(state, note, "Call Mum", "note");
  state = answerSurveyQuestion(state, note, "Bring the book", "note");

  assert.equal(
    state.profile.profileCase.survey.answers.find(
      (answer) => answer.questionId === note.id,
    ).answer,
    "Bring the book",
  );

  state = answerSurveyQuestion(state, note, "", "note");
  assert.equal(
    state.profile.profileCase.survey.answers.find(
      (answer) => answer.questionId === note.id,
    ).answer,
    "",
  );
});

test("a free thought becomes profile evidence", () => {
  const thought = {
    id: "thought-1",
    text: "A thought I wanted to keep",
    type: "text",
    target: "currentLife",
  };
  const state = answerSurveyQuestion(
    createEmptyState(),
    thought,
    "I felt peaceful on the walk.",
    "thought",
  );
  const saved = state.profile.profileCase.survey.answers.find(
    (answer) => answer.questionId === thought.id,
  );

  assert.equal(saved.answer, "I felt peaceful on the walk.");
  assert.equal(saved.kind, "thought");
  assert.equal(saved.target, "currentLife");
});

test("a deep-thought answer keeps the source of the question", () => {
  const state = answerSurveyQuestion(
    createEmptyState(),
    {
      id: "deep-curiosity-software-help",
      text: "What do you want your software to help someone feel or do?",
      target: "whatMatters",
      source: "curiosity",
    },
    "Help them feel that their life is theirs.",
    "deep-thought",
  );
  const answer = state.profile.profileCase.survey.answers.find(
    (item) => item.questionId === "deep-curiosity-software-help",
  );
  assert.equal(answer.source, "curiosity");
  assert.match(answer.questionId, /^deep-curiosity-/);
});

test("a cleared check-in subtitle stays clear after server merge", () => {
  const note = {
    id: "checkin-note",
    prompt: "A note for later",
    type: "text",
  };
  const remote = answerSurveyQuestion(
    createEmptyState(),
    note,
    "Notice what feels like you today.",
    "note",
  );
  const local = answerSurveyQuestion(remote, note, "", "note");
  const localAnswer = local.profile.profileCase.survey.answers.find(
    (answer) => answer.questionId === note.id,
  );
  localAnswer.answeredAt = "2026-07-31T12:00:00.000Z";
  remote.profile.profileCase.survey.answers[0].answeredAt =
    "2026-07-31T11:00:00.000Z";

  const merged = mergeServerState(local, remote);
  assert.equal(
    merged.profile.profileCase.survey.answers.find(
      (answer) => answer.questionId === note.id,
    ).answer,
    "",
  );
});

test("suggestions wait safely in the phone outbox", () => {
  const state = queueSuggestion(
    createEmptyState(),
    "Let me draw how I feel.",
  );

  assert.equal(state.outbox.length, 1);
  assert.equal(state.outbox[0].reason, "suggestion");
  assert.equal(state.outbox[0].message, "Let me draw how I feel.");
});

test("older saved profiles receive an empty chapter library safely", () => {
  const oldState = createEmptyState();
  delete oldState.chapters;

  const normalized = normalizeState(oldState);

  assert.deepEqual(normalized.chapters, { runs: {}, sessions: {} });
  assert.deepEqual(normalized.appSessions, {});
});

test("older saved days receive a safe list for additional missions", () => {
  const state = createEmptyState();
  state.days["2026-07-30"] = {
    date: "2026-07-30",
    checkIns: [],
    mission: {
      text: "One thing",
      why: "",
      identity: "Yourself",
      completed: false,
      completedAt: null,
    },
    timeBlocks: [],
  };

  assert.deepEqual(normalizeState(state).days["2026-07-30"].missions, []);
});

test("an unfinished legacy New mission becomes an empty task placeholder", () => {
  const state = createEmptyState();
  const dateKey = "2026-07-30";
  state.days[dateKey] = {
    ...ensureDay(state, dateKey).days[dateKey],
    missions: [
      {
        id: "legacy-placeholder",
        text: "New mission",
        completed: false,
        completedAt: null,
        createdAt: "2026-07-30T12:00:00.000Z",
      },
    ],
  };

  const normalized = normalizeState(state);

  assert.equal(normalized.days[dateKey].missions[0].text, "");
});

test("an app stays on its saved page until a new version arrives", () => {
  let state = createEmptyState();
  state = setAppSessionIndex(state, "vision-profile", "update-1", 1);

  const reopened = normalizeState(JSON.parse(JSON.stringify(state)));

  assert.equal(
    appSessionIndex(reopened, "vision-profile", "update-1", 0),
    1,
  );
  assert.equal(
    appSessionIndex(reopened, "vision-profile", "update-2", 0),
    0,
  );
});

test("a pending update does not hide the last readable profile", () => {
  const state = createEmptyState();
  assert.equal(hasReadableProfileCase(state.profile.profileCase), false);

  state.profile.profileCase.status = "waiting";
  state.profile.profileCase.updatedAt = "2026-07-30T06:15:00.000Z";

  assert.equal(hasReadableProfileCase(state.profile.profileCase), true);
});

test("weekly Vision keeps the person's own log words", () => {
  const state = createEmptyState();
  state.days["2026-07-29"] = {
    date: "2026-07-29",
    checkIns: [],
    mission: null,
    timeBlocks: [
      {
        id: "block-1",
        start: "09:00",
        end: "10:00",
        activity: "Walk with my friend",
        title: "Walk with my friend",
        note: "",
        createdAt: "2026-07-29T09:00:00.000Z",
      },
    ],
  };

  const summary = summarizeWeek(
    state,
    new Date("2026-07-29T12:00:00.000Z"),
  );

  assert.equal(summary.time[0].activity, "Walk with my friend");
  assert.doesNotMatch(summary.time[0].activity, /Outside|Focus|Life admin/);
});

test("empty Mirror reports uncertainty instead of an invented conclusion", () => {
  const summary = summarizeWeek(
    createEmptyState(),
    new Date("2026-07-28T12:00:00.000Z"),
  );

  assert.equal(summary.coverage.recorded, 0);
  assert.equal(summary.sentence, "There is not enough evidence to say.");
  assert.equal(summary.totalMinutes, 0);
});

test("sample Mirror includes the essential weekly evidence", () => {
  const summary = summarizeWeek(
    createSampleState(new Date("2026-07-28T12:00:00.000Z")),
    new Date("2026-07-28T12:00:00.000Z"),
  );

  assert.ok(summary.coverage.recorded >= 12);
  assert.ok(summary.totalMinutes > 0);
  assert.ok(summary.energy.length > 0);
  assert.ok(summary.moods.length > 0);
  assert.ok(summary.missions.completed > 0);
  assert.match(summary.sentence, /evidence|time|week/i);
});

test("two recorded days produce one honest silence and no pattern claims", () => {
  let state = createEmptyState();
  for (const [dateKey, start] of [["2026-08-12", "10:00"], ["2026-08-13", "12:00"]]) {
    state = ensureDay(state, dateKey);
    state.days[dateKey].timeBlocks.push({
      id: `block-${dateKey}`,
      start,
      end: "13:00",
      activity: "Project",
      title: "Project",
      note: "",
      moments: [],
      createdAt: `${dateKey}T12:00:00.000Z`,
    });
  }
  const claims = buildWeekClaims(state, new Date("2026-08-14T12:00:00.000Z"));
  assert.deepEqual(claims.map((claim) => claim.key), ["silence"]);
  assert.equal(claims[0].sentence, "There is not enough recorded life here to call a seven-day pattern yet.");
  assert.equal(claims[0].working.recordedDays, 2);
});

test("weekly claims are sentences backed by local evidence", () => {
  const state = createSampleState(new Date("2026-08-14T12:00:00.000Z"));
  const claims = buildWeekClaims(state, new Date("2026-08-14T12:00:00.000Z"));
  assert.ok(claims.length >= 3);
  assert.ok(claims.every((claim) => /[.!?]$/.test(claim.sentence)));
  assert.ok(claims.every((claim) => claim.evidence.length > 0));
  assert.equal(claims.some((claim) => claim.key === "silence"), false);
  assert.deepEqual(
    claims.slice(0, 4).map((claim) => claim.key),
    ["morning", "afternoon", "evening", "night"],
  );
  assert.ok(claims.some((claim) => claim.key === "weekday-weekend"));
  assert.ok(claims.some((claim) => claim.key === "hours"));
  assert.ok(claims.every((claim) => !/\d/.test(claim.sentence)));
  assert.ok(claims.every((claim) => !/\b(?:hour|hours|day|days)\b/i.test(claim.sentence)));
  assert.ok(claims.every((claim) => claim.working && Object.values(claim.working).every(Number.isFinite)));
  assert.equal(new Set(claims.map((claim) => claim.sentence)).size, claims.length);
});

test("week activity vocabulary matches words and lets the particular meaning win", () => {
  assert.equal(weekActivityGroup("Have a great talk with cousin"), "Time with other people");
  assert.equal(weekActivityGroup("Woke up late"), "Waking up");
  assert.equal(weekActivityGroup("Coffee and journaling"), "Reading and reflection");
  assert.equal(weekActivityGroup("Walk with mom"), "Time with other people");
  assert.equal(weekActivityGroup("Walk and smoke"), "Smoking");
  assert.equal(weekActivityGroup("Eat a small meal"), "Meals and coffee");
});

test("period claims use distinctive recurring activities instead of four largest buckets", () => {
  let state = createEmptyState();
  const dateKeys = [
    "2026-08-08",
    "2026-08-09",
    "2026-08-10",
    "2026-08-11",
    "2026-08-12",
    "2026-08-13",
    "2026-08-14",
  ];
  for (const dateKey of dateKeys) {
    state = ensureDay(state, dateKey);
    state.days[dateKey].timeBlocks.push(
      { id: `${dateKey}-wake`, start: "10:00", end: "11:00", title: "Woke up", activity: "Woke up" },
      { id: `${dateKey}-project`, start: "13:00", end: "16:00", title: "Work on project", activity: "Work" },
      { id: `${dateKey}-walk`, start: "16:00", end: "18:00", title: "Walk", activity: "Walk" },
      { id: `${dateKey}-shower`, start: "20:00", end: "21:00", title: "Shower", activity: "Shower" },
      { id: `${dateKey}-sleep`, start: "03:00", end: "04:00", title: "Sleep", activity: "Sleep" },
    );
  }
  const claims = buildSevenDayClaims(state, new Date("2026-08-14T12:00:00.000Z"));
  const periods = claims.slice(0, 4);
  assert.deepEqual(periods.map((claim) => claim.key), ["morning", "afternoon", "evening", "night"]);
  assert.equal(new Set(periods.map((claim) => claim.sentence)).size, 4);
  assert.match(periods[0].sentence, /waking up/i);
  assert.match(periods[1].sentence, /project/i);
  assert.match(periods[2].sentence, /personal care/i);
  assert.match(periods[3].sentence, /sleep and rest/i);
});

test("the week activity tally keeps Other visible as a vocabulary floor", () => {
  let state = createEmptyState();
  state = ensureDay(state, "2026-08-14");
  state.days["2026-08-14"].timeBlocks.push(
    { id: "known", start: "12:00", end: "13:00", title: "Walk with mom", activity: "Walk" },
    { id: "unknown", start: "13:00", end: "14:00", title: "Sit common room", activity: "Other" },
  );
  assert.deepEqual(weekActivityTally(state), [
    { group: "Other recorded time", blocks: 1 },
    { group: "Time with other people", blocks: 1 },
  ]);
});

test("Week Review orders a recurring pattern, four periods, and one honest week", () => {
  let state = createEmptyState();
  const dateKeys = [
    "2026-08-08",
    "2026-08-09",
    "2026-08-10",
    "2026-08-11",
    "2026-08-12",
    "2026-08-13",
    "2026-08-14",
  ];
  state.habits.definitions.kept = {
    id: "kept",
    text: "Write after coffee",
    action: "Write after coffee",
    status: "active",
  };
  state.habits.definitions.dropped = {
    id: "dropped",
    text: "Wear socks",
    action: "Wear socks",
    status: "active",
  };
  for (const [index, dateKey] of dateKeys.entries()) {
    state = ensureDay(state, dateKey);
    state.days[dateKey].timeBlocks.push(
      { id: `${dateKey}-wake`, start: "10:00", end: "11:00", title: "Wake up", activity: "Wake" },
      { id: `${dateKey}-project`, start: "13:00", end: "15:00", title: "Project", activity: "Project" },
      { id: `${dateKey}-walk`, start: "15:00", end: "17:00", title: "Walk", activity: "Walk" },
      { id: `${dateKey}-shower`, start: "20:00", end: "21:00", title: "Shower", activity: "Shower" },
      { id: `${dateKey}-sleep`, start: "03:00", end: "04:00", title: "Sleep", activity: "Sleep" },
    );
    state.habits.completions[`kept-${dateKey}`] = {
      id: `kept-${dateKey}`,
      habitId: "kept",
      dateKey,
      completed: true,
    };
    if (index < 4) {
      state.habits.completions[`dropped-${dateKey}`] = {
        id: `dropped-${dateKey}`,
        habitId: "dropped",
        dateKey,
        completed: true,
      };
    }
  }
  const review = buildWeekReview(state, new Date("2026-08-14T12:00:00.000Z"));
  assert.match(review.dailyPattern.sentence, /project work|walking/i);
  assert.deepEqual(review.periods.map((claim) => claim.key), ["morning", "afternoon", "evening", "night"]);
  assert.equal(new Set(review.periods.map((claim) => claim.sentence)).size, 4);
  assert.match(review.week.sentence, /kept Write after coffee on 7 days/i);
  assert.match(review.week.sentence, /Wear socks stopped after 4 days/i);
  assert.ok(review.groupTally.length > 0);
  assert.equal("weekReview" in state, false);
});

test("Week Review keeps all seven Pages when recorded life is still sparse", () => {
  const review = buildWeekReview(createEmptyState(), new Date("2026-08-14T12:00:00.000Z"));
  assert.deepEqual(review.periods.map((claim) => claim.key), ["morning", "afternoon", "evening", "night"]);
  assert.match(review.dailyPattern.sentence, /not enough recorded life/i);
  assert.match(review.week.sentence, /Nothing was clearly kept yet/i);
});

test("Seven Days is recomputed from one week and stores no aggregate", () => {
  const state = createSampleState(new Date("2026-08-14T12:00:00.000Z"));
  const before = JSON.stringify(state);
  const first = buildSevenDayClaims(state, new Date("2026-08-14T12:00:00.000Z"));
  const next = buildSevenDayClaims(state, new Date("2026-08-21T12:00:00.000Z"));
  assert.notDeepEqual(first.map((claim) => claim.working), next.map((claim) => claim.working));
  assert.equal(JSON.stringify(state), before);
  assert.equal("sevenDays" in state, false);
  assert.equal("weekClaims" in state, false);
});

test("a reply to Athena's reading becomes source-linked evidence", () => {
  const question = {
    id: "athena-reading-edition-1-days",
    text: "What changed in your mornings?",
    target: "currentLife",
  };
  const state = answerSurveyQuestion(
    createEmptyState(),
    question,
    "I stopped reaching for my phone first.",
    "athena-reading",
  );
  const answer = state.profile.profileCase.survey.answers.find(
    (item) => item.questionId === question.id,
  );
  assert.equal(answer.kind, "athena-reading");
  assert.equal(answer.answer, "I stopped reaching for my phone first.");
  assert.ok(
    state.athenaMemory.processedEvidenceIds.includes(question.id),
    "the reply enters Athena's evidence memory",
  );
});

test("a task finished by accident can be reopened", () => {
  const base = createEmptyState();
  const withTask = updateTask(addTask(base, "t1").state, "t1", "Call the venue");
  const done = completeTask(withTask, "t1");
  assert.equal(done.tasks.items.t1.status, "completed");
  assert.ok(done.tasks.items.t1.completedAt);

  const reopened = reopenTask(done, "t1");
  assert.equal(reopened.tasks.items.t1.status, "open");
  assert.equal(reopened.tasks.items.t1.completedAt, null);
  assert.equal(reopened.tasks.items.t1.text, "Call the venue", "the words survive");

  // Reopening something already open changes nothing.
  assert.equal(reopenTask(reopened, "t1"), reopened);
  assert.equal(reopenTask(reopened, "missing"), reopened);
});

test("clearing a habit or task survives the server merge", () => {
  // The server merge walks its own records and lets a newer phone record win.
  // A removed record has no key left to compare, so the server copy used to
  // survive and the habit reappeared on the next sync. Archiving keeps a record
  // with a newer updatedAt for the merge to honour.
  let phone = createEmptyState();
  const habit = addHabitDefinition(phone);
  phone = updateHabitDefinition(habit.state, habit.id, "Walk before the first screen");
  const task = addTask(phone);
  phone = updateTask(task.state, task.id, "Call the venue");

  assert.equal(phone.habits.definitions[habit.id].status, "active");
  assert.equal(phone.tasks.items[task.id].status, "open");

  phone = discardEmptyHabit(updateHabitDefinition(phone, habit.id, ""), habit.id);
  phone = discardEmptyTask(updateTask(phone, task.id, ""), task.id);

  // The records stay, so the merge has something newer to compare against.
  assert.equal(phone.habits.definitions[habit.id].status, "archived");
  assert.equal(phone.tasks.items[task.id].status, "archived");

  // Neither is listed any more: the Page shows active habits and open tasks.
  const active = Object.values(phone.habits.definitions).filter((h) => h.status === "active");
  const open = Object.values(phone.tasks.items).filter((t) => t.status === "open");
  assert.equal(active.length, 0);
  assert.equal(open.length, 0);

  // Archiving twice is a no-op, and a named habit is never archived by a blur.
  assert.equal(discardEmptyHabit(phone, habit.id), phone);
  const named = updateHabitDefinition(phone, habit.id, "Read ten pages");
  assert.equal(discardEmptyHabit(named, habit.id).habits.definitions[habit.id].text, "Read ten pages");
});

test("yesterday's record shows one finished day and nothing else", () => {
  assert.equal(previousDateKey("2026-08-12"), "2026-08-11");
  assert.equal(previousDateKey("2026-08-01"), "2026-07-31");
  assert.equal(previousDateKey("2026-01-01"), "2025-12-31");
  assert.equal(previousDateKey("2028-03-01"), "2028-02-29", "leap year");

  let state = createEmptyState();
  const kept = addHabitDefinition(state, "h-kept");
  state = updateHabitDefinition(kept.state, "h-kept", "Walk before the first screen");
  const missed = addHabitDefinition(state, "h-missed");
  state = updateHabitDefinition(missed.state, "h-missed", "Read ten pages");

  state = toggleHabitForDay(state, "h-kept", "2026-08-11");
  state = toggleHabitForDay(state, "h-missed", "2026-08-12");

  const yesterday = dayRecord(state, "2026-08-11");
  assert.deepEqual(yesterday.habits.map((h) => h.text), ["Walk before the first screen"]);
  assert.equal(yesterday.total, 1, "today's tick does not leak into yesterday");

  // An archived habit never appears, even if it was ticked that day.
  state = discardEmptyHabit(updateHabitDefinition(state, "h-kept", ""), "h-kept");
  assert.equal(dayRecord(state, "2026-08-11").habits.length, 0);

  // A day with nothing recorded answers plainly rather than throwing.
  const empty = dayRecord(createEmptyState(), "2026-08-11");
  assert.deepEqual(empty, { dateKey: "2026-08-11", habits: [], tasks: [], total: 0 });
});


test("a protocol is drafted, edited while it runs, and kept for its days", () => {
  let state = createEmptyState();
  assert.equal(activeProtocolRun(state), null, "nothing runs by default");

  const draft = startProtocolDraft(state, "run-1");
  state = draft.state;
  // A draft arrives unnamed so the field can show what it would be called
  // rather than filling it in, which is what stopped anyone realising the name
  // was theirs to change. It takes the default at the moment it begins.
  assert.equal(activeProtocolRun(state).name, "");
  assert.equal(activeProtocolRun(state).days, 7);

  // One run at a time.
  const second = startProtocolDraft(state, "run-2");
  assert.equal(second.id, "run-1", "a second draft returns the first");

  // Only the offered durations are accepted.
  state = setProtocolDays(state, "run-1", 14);
  assert.equal(activeProtocolRun(state).days, 14);
  state = setProtocolDays(state, "run-1", 9);
  assert.equal(activeProtocolRun(state).days, 14, "9 days is not on offer");
  assert.deepEqual(PROTOCOL_DURATIONS, [3, 7, 14, 21]);

  const journal = addProtocolItem(state, "run-1", "non-negotiable", "i-journal");
  state = updateProtocolItem(journal.state, "run-1", "i-journal", "Journaling 1 line");
  const train = addProtocolItem(state, "run-1", "non-negotiable", "i-train");
  state = updateProtocolItem(train.state, "run-1", "i-train", "Working out 5 min");
  const read = addProtocolItem(state, "run-1", "negotiable", "i-read");
  state = updateProtocolItem(read.state, "run-1", "i-read", "Read 1 chapter");
  // Left blank on purpose; it must never become a term.
  state = addProtocolItem(state, "run-1", "negotiable", "i-blank").state;

  assert.equal(protocolItems(activeProtocolRun(state), "non-negotiable").length, 2);
  assert.ok(canBeginProtocolRun(activeProtocolRun(state)));

  state = beginProtocolRun(state, "run-1", "2026-08-12");
  const run = activeProtocolRun(state);
  assert.equal(run.status, "active");
  assert.equal(run.items["i-blank"].status, "archived", "a blank item never becomes a term");

  // A run can be changed while it is going. The item keeps its id through an
  // edit, so any day already marked against it stays attached to it.
  state = updateProtocolItem(state, "run-1", "i-journal", "Journaling 10 pages");
  assert.equal(activeProtocolRun(state).items["i-journal"].text, "Journaling 10 pages");
  assert.equal(activeProtocolRun(state).items["i-journal"].id, "i-journal");
  state = addProtocolItem(state, "run-1", "non-negotiable", "i-late").state;
  state = updateProtocolItem(state, "run-1", "i-late", "Cold shower");
  assert.equal(activeProtocolRun(state).items["i-late"].text, "Cold shower");
  assert.equal(protocolItems(activeProtocolRun(state), "non-negotiable").length, 3);

  // And taken back out again by emptying it, which archives rather than deletes
  // so the server merge has something to compare against.
  state = updateProtocolItem(state, "run-1", "i-late", "");
  state = discardEmptyProtocolItem(state, "run-1", "i-late");
  assert.equal(activeProtocolRun(state).items["i-late"].status, "archived");
  assert.equal(protocolItems(activeProtocolRun(state), "non-negotiable").length, 2);

  // Length is the one thing that stays fixed. A run that can be shortened when
  // it gets hard is not a protocol.
  state = setProtocolDays(state, "run-1", 3);
  assert.equal(activeProtocolRun(state).days, 14, "a running protocol keeps its length");

  // Day counting, from one.
  assert.equal(protocolDay(run, "2026-08-12"), 1);
  assert.equal(protocolDay(run, "2026-08-14"), 3);
  assert.equal(protocolDay(run, "2026-09-01"), 21, "counts across a month end");

  // A day is kept by ticking, and untick puts it back.
  let today = protocolToday(state, "2026-08-12");
  assert.equal(today.day, 1);
  assert.equal(today.nonNegotiable.length, 2);
  assert.equal(today.negotiable.length, 1, "the blank negotiable is gone");
  assert.equal(today.keptAll, false);

  state = toggleProtocolItem(state, "i-journal", "2026-08-12");
  state = toggleProtocolItem(state, "i-train", "2026-08-12");
  today = protocolToday(state, "2026-08-12");
  assert.equal(today.keptAll, true, "negotiables are not required to keep a day");

  state = toggleProtocolItem(state, "i-train", "2026-08-12");
  assert.equal(protocolToday(state, "2026-08-12").keptAll, false);

  // Ticks belong to their own day.
  assert.equal(protocolToday(state, "2026-08-13").nonNegotiable.every((i) => !i.completed), true);
});

test("missing a non-negotiable costs nothing, and a run ends without failing", () => {
  let state = startProtocolDraft(createEmptyState(), "run-1").state;
  state = setProtocolDays(state, "run-1", 3);
  state = updateProtocolItem(
    addProtocolItem(state, "run-1", "non-negotiable", "i-1").state,
    "run-1", "i-1", "Meditation 5 min",
  );
  state = beginProtocolRun(state, "run-1", "2026-08-12");

  // Day two is missed entirely. Nothing resets and the run carries on.
  state = toggleProtocolItem(state, "i-1", "2026-08-12");
  const dayThree = protocolToday(state, "2026-08-14");
  assert.equal(dayThree.day, 3);
  assert.equal(activeProtocolRun(state).status, "active", "a missed day does not end it");
  assert.equal(dayThree.isOver, false);
  assert.equal(dayThree.keptAll, false, "day three is simply not kept yet");

  // The run is over the day after the last one, by arithmetic rather than by grading.
  assert.equal(protocolToday(state, "2026-08-15").isOver, true);

  // Ending early is recorded and clears the slot for the next run.
  state = endProtocolRun(state, "run-1");
  assert.equal(state.protocol.runs["run-1"].status, "ended");
  assert.ok(state.protocol.runs["run-1"].endedAt);
  assert.equal(activeProtocolRun(state), null, "a finished run is history");
  assert.equal(
    state.protocol.completions["2026-08-12:i-1"].completed,
    true,
    "what was kept survives the run ending",
  );

  // A finished run cannot be ticked into.
  const after = toggleProtocolItem(state, "i-1", "2026-08-16");
  assert.equal(after, state);
});

test("a kept Protocol day seals once, stays editable, and ignores negotiables", () => {
  let state = startProtocolDraft(createEmptyState(), "run-close").state;
  state = setProtocolDays(state, "run-close", 3);
  for (const [id, kind, text] of [
    ["i-write", "non-negotiable", "Write one line"],
    ["i-walk", "non-negotiable", "Walk outside"],
    ["i-read", "negotiable", "Read a chapter"],
  ]) {
    state = addProtocolItem(state, "run-close", kind, id).state;
    state = updateProtocolItem(state, "run-close", id, text);
  }
  state = beginProtocolRun(state, "run-close", "2026-08-12");

  state = toggleProtocolItem(state, "i-write", "2026-08-12");
  assert.equal(protocolToday(state, "2026-08-12").keptAll, false);
  assert.equal(
    sealProtocolDay(state, "2026-08-12"),
    state,
    "the action cannot seal before the last non-negotiable",
  );

  state = toggleProtocolItem(state, "i-walk", "2026-08-12");
  assert.equal(protocolToday(state, "2026-08-12").keptAll, true);
  assert.equal(protocolToday(state, "2026-08-12").sealed, false);

  state = toggleProtocolItem(state, "i-read", "2026-08-12");
  assert.equal(
    protocolToday(state, "2026-08-12").keptAll,
    true,
    "a negotiable never changes whether the day can close",
  );
  state = sealProtocolDay(state, "2026-08-12");
  const sealed = protocolToday(state, "2026-08-12");
  assert.equal(sealed.sealed, true);
  assert.equal(sealed.seal.day, 1);
  assert.equal(sealed.seal.totalDays, 3);
  assert.deepEqual(
    sealed.seal.terms.map((term) => term.text),
    ["Write one line", "Walk outside", "Read a chapter"],
    "the closing Page receives the real kept terms",
  );

  state = toggleProtocolItem(state, "i-read", "2026-08-12");
  assert.equal(
    protocolToday(state, "2026-08-12").sealed,
    true,
    "changing an extra does not reopen a kept day",
  );
  state = toggleProtocolItem(state, "i-walk", "2026-08-12");
  assert.equal(protocolToday(state, "2026-08-12").keptAll, false);
  assert.equal(protocolToday(state, "2026-08-12").sealed, false);
  state = toggleProtocolItem(state, "i-walk", "2026-08-12");
  assert.equal(protocolToday(state, "2026-08-12").keptAll, true);
  assert.equal(
    protocolToday(state, "2026-08-12").sealed,
    false,
    "reticking offers Completed today again instead of silently resealing",
  );
});

test("the last kept day lands home with the finished phase and remains reversible", () => {
  let state = startProtocolDraft(createEmptyState(), "run-finish").state;
  state = setProtocolDays(state, "run-finish", 3);
  state = updateProtocolItem(
    addProtocolItem(state, "run-finish", "non-negotiable", "i-sit").state,
    "run-finish", "i-sit", "Sit for five minutes",
  );
  state = beginProtocolRun(state, "run-finish", "2026-08-12");
  state = toggleProtocolItem(state, "i-sit", "2026-08-14");
  state = sealProtocolDay(state, "2026-08-14");

  assert.equal(activeProtocolRun(state), null, "the completed run leaves the active slot");
  const finished = latestCompletedProtocol(state);
  assert.equal(finished.run.name, "Monk Mode");
  assert.equal(finished.day, 3);
  assert.equal(finished.dateKey, "2026-08-14");
  assert.equal(finished.nonNegotiable[0].completed, true);

  state = toggleProtocolRecordItem(
    state,
    "run-finish",
    "i-sit",
    "2026-08-14",
  );
  const corrected = latestCompletedProtocol(state);
  assert.equal(corrected.nonNegotiable[0].completed, false);
  assert.equal(corrected.sealed, false, "the dated seal is reversed, not deleted");

  const server = structuredClone(state);
  server.protocol.seals["run-finish:2026-08-14"] = {
    ...server.protocol.seals["run-finish:2026-08-14"],
    sealed: true,
    updatedAt: "2026-08-14T00:00:00.000Z",
  };
  const merged = mergeServerState(state, server);
  assert.equal(
    merged.protocol.seals["run-finish:2026-08-14"].sealed,
    false,
    "an older server seal cannot restore a correction",
  );
});

test("clearing a protocol term survives the server merge", () => {
  let state = startProtocolDraft(createEmptyState(), "run-1").state;
  state = updateProtocolItem(
    addProtocolItem(state, "run-1", "non-negotiable", "i-1").state,
    "run-1", "i-1", "Cold shower",
  );
  state = updateProtocolItem(state, "run-1", "i-1", "");
  state = discardEmptyProtocolItem(state, "run-1", "i-1");

  const item = state.protocol.runs["run-1"].items["i-1"];
  assert.equal(item.status, "archived", "the record stays for the merge to compare");
  assert.equal(protocolItems(state.protocol.runs["run-1"]).length, 0);
  assert.equal(discardEmptyProtocolItem(state, "run-1", "i-1"), state, "archiving twice is a no-op");
});

test("an older saved state receives a protocol slice", () => {
  const migrated = normalizeState({ version: 4, profile: {}, days: {} });
  assert.deepEqual(migrated.protocol, { runs: {}, completions: {}, seals: {} });
  assert.equal(activeProtocolRun(migrated), null);
});
