import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEEP_THOUGHT_KINDS, LOCAL_DEEP_THOUGHTS, countDeepThoughtWords, createLocalDeepThoughtPrompt, isDeepThoughtRewardEligible, selectDeepThoughtPrompt, unaskedDeepThoughts } from "../app/os/deep-thought-model.js";
import * as deepThoughtModel from "../app/os/deep-thought-model.js";

test("deep reward follows a sentence, not an essay", () => {
  const sentence = "I love this day, I am grateful for today";
  assert.equal(countDeepThoughtWords(sentence), 9);
  assert.equal(isDeepThoughtRewardEligible({ text: sentence, activeMs: 5_000 }), true);

  // A single word earns the press effect only.
  assert.equal(isDeepThoughtRewardEligible({ text: "happy", activeMs: 30_000 }), false);

  // Six words is the floor, and five is still short of it.
  assert.equal(isDeepThoughtRewardEligible({ text: "one two three four five six", activeMs: 5_000 }), true);
  assert.equal(isDeepThoughtRewardEligible({ text: "one two three four five", activeMs: 30_000 }), false);

  // The time guard only rules out text that could not have been typed.
  assert.equal(isDeepThoughtRewardEligible({ text: sentence, activeMs: 4_999 }), false);
});

test("local deep questions may use reviewed mission evidence", () => {
  const prompt = createLocalDeepThoughtPrompt({ profile: { identityFocus: "Yourself" }, days: { "2026-08-01": { mission: { text: "Call my sister" } } } }, "2026-08-01", 0);
  assert.match(prompt.text, /Call my sister/);
  assert.equal(prompt.source, "local-personalized");
});

// One question, one answer. A deep question used to ask a softened second
// version of itself whenever the first answer fell short of the reward.
test("a deep question has no follow-up", () => {
  assert.equal(deepThoughtModel.deepThoughtFollowUp, undefined);
});

// The floor is meant to be answerable only out of the person's own life. A
// question that names nothing specific is the failure this list was rewritten
// to fix, so it stays measurable rather than a matter of taste.
test("every fallback question asks for something only this person can answer", () => {
  assert.ok(LOCAL_DEEP_THOUGHTS.length >= 8);
  for (const question of LOCAL_DEEP_THOUGHTS) {
    assert.match(question.text, /\?$/, `${question.text} is not a question`);
    assert.match(
      question.text,
      /\byou(r|rself)?\b/i,
      `${question.text} does not ask the person about themselves`,
    );
    assert.doesNotMatch(
      question.text,
      /\b(attention|meaningful|grateful|journey|authentic|abundance|mindful)\b/i,
      `${question.text} reaches for self-help vocabulary instead of a real thing`,
    );
  }
});

test("source-linked Athena curiosity is asked before the static list", () => {
  const state = {
    athenaMemory: {
      curiosity: [{
        id: "quiet-mornings",
        question: "What makes a quiet morning feel alive to you?",
        sourceRefs: [{ sourceType: "day", sourceId: "day:2026-08-17" }],
        status: "active",
      }],
    },
    profile: {
      identityFocus: "Yourself",
      profileCase: { survey: { answers: [] } },
    },
    days: {},
  };
  const prompt = selectDeepThoughtPrompt(state, "2026-08-18", 0);
  assert.equal(prompt.id, "deep-curiosity-quiet-mornings");
  assert.equal(prompt.text, "What makes a quiet morning feel alive to you?");
  assert.equal(prompt.source, "curiosity");
});

test("curiosity without evidence or already answered is not asked again", () => {
  const state = {
    athenaMemory: {
      curiosity: [
        { id: "invented", question: "A question without evidence?", sourceRefs: [] },
        {
          id: "answered",
          question: "A sourced question already answered?",
          sourceRefs: [{ sourceType: "thought", sourceId: "thought-1" }],
        },
      ],
    },
    profile: {
      identityFocus: "Yourself",
      profileCase: {
        survey: { answers: [{ questionId: "deep-curiosity-answered" }] },
      },
    },
    days: {},
  };
  const prompt = selectDeepThoughtPrompt(state, "2026-08-18", 0);
  assert.equal(prompt.source, "local");
});

test("one selector keeps Athena daily, Curiosity, personalised, static order", () => {
  const state = {
    athenaMemory: {
      curiosity: [{
        id: "software-help",
        question: "What do you want your software to help someone feel or do?",
        sourceRefs: [{ sourceType: "thought", sourceId: "thought-1" }],
      }],
    },
    profile: {
      identityFocus: "A clear teacher",
      profileCase: {
        deepThoughtPrompt: {
          id: "deep-2026-08-18-daily",
          text: "What changed today?",
          target: "currentLife",
          dateKey: "2026-08-18",
          source: "athena",
          preparedAt: "2026-08-18T00:00:00.000Z",
        },
        survey: { answers: [] },
      },
    },
    days: {},
  };
  assert.equal(selectDeepThoughtPrompt(state, "2026-08-18", 0).id, "deep-2026-08-18-daily");
  state.profile.profileCase.survey.answers.push({
    questionId: "deep-2026-08-18-daily",
    question: "What changed today?",
    answer: "I noticed it.",
    kind: "deep-thought",
  });
  assert.equal(
    selectDeepThoughtPrompt(state, "2026-08-18", 0).id,
    "deep-curiosity-software-help",
  );
  state.profile.profileCase.survey.answers.push({
    questionId: "deep-curiosity-software-help",
    question: "What do you want your software to help someone feel or do?",
    answer: "Feel seen.",
    kind: "deep-thought",
  });
  assert.equal(selectDeepThoughtPrompt(state, "2026-08-18", 0).source, "local-personalized");
});

// Sai: "better be refresh with new question on every visit. so that there may
// be some questions that i am not in the mood now."
test("every visit offers a different question, and skipping spends nothing", () => {
  const state = {
    athenaMemory: {
      curiosity: [{
        id: "software-help",
        question: "What do you want your software to help someone feel or do?",
        sourceRefs: [{ sourceType: "thought", sourceId: "thought-1" }],
      }],
    },
    profile: {
      profileCase: {
        deepThoughtPrompt: {
          id: "deep-2026-08-18-daily",
          text: "What changed today?",
          target: "currentLife",
          dateKey: "2026-08-18",
          source: "athena",
          preparedAt: "2026-08-18T00:00:00.000Z",
        },
        survey: { answers: [] },
      },
    },
    days: {},
  };
  const at = (visit) => selectDeepThoughtPrompt(state, "2026-08-18", visit);

  // Her question first, then hers from the Queue, then the floor — the order
  // is unchanged; the visit is what moves along it.
  assert.equal(at(0).source, "athena");
  assert.equal(at(1).source, "curiosity");
  assert.equal(at(2).source, "local");
  assert.notEqual(at(3).text, at(2).text);

  // Coming back later is the same walk: nothing was spent by skipping.
  assert.equal(at(0).source, "athena");

  // And it never runs out — the walk comes round rather than going blank.
  const many = Array.from({ length: 60 }, (_, visit) => at(visit).text);
  assert.ok(many.every(Boolean));
  assert.ok(new Set(many).size > 10, "a visit is a real change, not a shuffle of two");
});

test("Curiosity does not repeat a question Athena already asked under another id", () => {
  const state = {
    athenaMemory: {
      curiosity: [
        {
          id: "same-words",
          question: "What made the last two days feel so beautiful?",
          sourceRefs: [{ sourceType: "day", sourceId: "2026-08-12" }],
        },
        {
          id: "new-words",
          question: "What do you want your software to help someone feel or do?",
          sourceRefs: [{ sourceType: "thought", sourceId: "thought-1" }],
        },
      ],
    },
    profile: {
      identityFocus: "Yourself",
      profileCase: {
        deepThoughtPrompt: null,
        survey: { answers: [{
          questionId: "deep-2026-08-12-beautiful-days",
          question: "What made the last two days feel so beautiful?",
          answer: "The people.",
          kind: "deep-thought",
        }] },
      },
    },
    days: {},
  };
  assert.equal(selectDeepThoughtPrompt(state, "2026-08-18", 0).id, "deep-curiosity-new-words");
});

// Sai: "like 'whats your hidden talent' or smt, which ask user to think a
// little deeper and fun to answer question. Life questions will be ask in
// athena session." The floor is six shapes rather than one long list, and the
// heavy ones are gone from it — those are Athena's, in his voice.
test("the floor asks for a peek, not for a reckoning", () => {
  const kinds = new Set(LOCAL_DEEP_THOUGHTS.map((question) => question.kind));
  assert.deepEqual([...kinds].sort(), Object.keys(DEEP_THOUGHT_KINDS).sort());
  for (const kind of kinds) {
    assert.ok(
      LOCAL_DEEP_THOUGHTS.filter((question) => question.kind === kind).length >= 3,
      `${kind} needs enough questions to come back to`,
    );
  }
  // A life question is one that asks what something cost. Those are asked in
  // Athena's session, where she chose the moment.
  for (const question of LOCAL_DEEP_THOUGHTS) {
    assert.doesNotMatch(
      question.text,
      /\b(give up|gave up|lying to yourself|ashamed|regret|worth it)\b/i,
      `${question.text} is a life question and belongs to Athena`,
    );
  }
});

// The offset used to count the answers given today, which reset every morning:
// the same question opened every day and the rest was never reached.
test("a question he has answered is not asked again", () => {
  const answered = (texts) => ({
    profile: {
      profileCase: {
        survey: {
          answers: texts.map((text, index) => ({
            kind: "deep-thought",
            question: text,
            answeredAt: `2026-08-${String(index + 1).padStart(2, "0")}T09:00:00.000Z`,
          })),
        },
      },
    },
  });

  const first = LOCAL_DEEP_THOUGHTS[0].text;
  const pool = unaskedDeepThoughts(answered([first]));
  assert.equal(pool.length, LOCAL_DEEP_THOUGHTS.length - 1);
  assert.ok(!pool.some((question) => question.text === first));

  // Two mornings running do not open on the same question.
  const day = (state, key) => createLocalDeepThoughtPrompt(state, key, 0).text;
  const monday = day({}, "2026-08-31");
  assert.notEqual(day(answered([monday]), "2026-09-01"), monday);

  // Nor on the same shape, so the second morning is a different kind of door.
  const shapeOf = (text) =>
    LOCAL_DEEP_THOUGHTS.find((question) => question.text === text)?.kind;
  assert.notEqual(shapeOf(day(answered([monday]), "2026-09-01")), shapeOf(monday));

  // Every one answered: the pool comes round rather than the App going quiet.
  const spent = answered(LOCAL_DEEP_THOUGHTS.map((question) => question.text));
  assert.equal(unaskedDeepThoughts(spent).length, LOCAL_DEEP_THOUGHTS.length);
  assert.ok(createLocalDeepThoughtPrompt(spent, "2026-09-02", 0).text);
});

// The counter is visits, not answers: that is the whole point of it.
test("the App counts openings, and holds the question while it is answered", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /const deepThoughtVisits = useRef\(0\)/);
  assert.match(
    shell,
    /selectDeepThoughtPrompt\(state, dateKey, deepThoughtVisits\.current\)/,
  );
  // Counted on the way in only, so closing the side does not skip a question.
  assert.match(shell, /if \(nextMode === "deep"\) deepThoughtVisits\.current \+= 1;/);
  // And the question is captured once, into state, rather than re-read on every
  // render — a question must not change under someone who is answering it.
  assert.match(shell, /setDeepThoughtPrompt\(prompt\)/);
  assert.match(shell, /\{deepThoughtPrompt\?\.text\}/);
});
