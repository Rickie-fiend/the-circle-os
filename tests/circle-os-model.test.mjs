import assert from "node:assert/strict";
import test from "node:test";

import {
  HABIT_QUESTIONS,
  LOG_SETUP_QUESTIONS,
  PROFILE_QUESTIONS,
  applyProfileResult,
  answerSurveyQuestion,
  buildVisionAnalysis,
  connectLocalAi,
  createEmptyState,
  createSampleState,
  getDateKey,
  getDayPeriod,
  minutesBetween,
  normalizeState,
  summarizeWeek,
  upsertTimeBlock,
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
  assert.equal(
    state.days[getDateKey()].mission.text,
    "Write for ten minutes",
  );
  assert.equal(
    state.days[getDateKey()].mission.identity,
    "A person who follows through",
  );
  assert.ok(state.outbox.some((item) => item.reason === "survey-answer"));
  assert.ok(state.outbox.some((item) => item.reason === "habit-answer"));
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
    state.profile.profileCase.survey.answers.some(
      (answer) => answer.questionId === note.id,
    ),
    false,
  );
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
