// A reward should follow a real sentence, not an essay. "happy" earns the press
// effect only; "I love this day, I am grateful for today" earns the reward.
// The active time is a guard against pasting, not a measure of effort, so it is
// only long enough that a sentence cannot appear instantly.
export const DEEP_THOUGHT_MIN_WORDS = 6;
export const DEEP_THOUGHT_MIN_ACTIVE_MS = 5_000;

/**
 * What a Deep Thought is for, and what it is not.
 *
 * Deep Thoughts asks the questions that are a pleasure to answer and still show
 * something true — the hidden talent, the petty conviction, the thing you would
 * do all day for nothing. Sai: "deep thoughts should be fun to answer questions
 * that have a peak into the user's mind ... like 'whats your hidden talent' or
 * smt, which ask user to think a little deeper and fun to answer question."
 *
 * The heavy ones are not here. What you gave up, where you are lying to
 * yourself, what you put away to be liked — those are life questions, and they
 * belong to Athena's session, in his voice, at a moment she chose. "Life
 * questions will be ask in athena session." Asking them here, in an App Box on
 * the way past, is asking them badly.
 *
 * So the floor is built out of six shapes rather than one long list. Each shape
 * is a different door into the same room, and rotating them means two days
 * running never feel like the same question twice.
 */
export const DEEP_THOUGHT_KINDS = Object.freeze({
  /** What you are quietly good at, and did not think to mention. */
  talent: "talent",
  /** What you love or cannot stand out of all proportion. */
  taste: "taste",
  /** The private habit, the thing you do when the house is empty. */
  oddity: "oddity",
  /** One specific thing that actually happened, not a summary of a year. */
  memory: "memory",
  /** A position you would defend, cheerfully, to someone who disagreed. */
  stance: "stance",
  /** A door held open: what you would do, given the room to do it. */
  imagination: "imagination",
});

/**
 * A question earns its place here when three things are true: only he can
 * answer it out of his own life, it can be answered in a sentence, and he would
 * want to. A slogan will not do, and neither will an interrogation.
 *
 * This is a floor, not the voice. The authored questions are Sai's writing and
 * belong in Athena's library; these keep the App honest until they arrive.
 */
export const LOCAL_DEEP_THOUGHTS = Object.freeze([
  Object.freeze({ text: "What is your hidden talent?", kind: "talent", target: "personality" }),
  Object.freeze({ text: "What is a small thing you are unreasonably good at?", kind: "talent", target: "personality" }),
  Object.freeze({ text: "What could you give a twenty-minute talk on with no preparation?", kind: "talent", target: "personality" }),
  Object.freeze({ text: "What do people always come to you for?", kind: "talent", target: "currentLife" }),

  Object.freeze({ text: "What is the pettiest thing you feel strongly about?", kind: "taste", target: "personality" }),
  Object.freeze({ text: "What do you love that you cannot defend?", kind: "taste", target: "personality" }),
  Object.freeze({ text: "What is overrated, and you will not be talked out of it?", kind: "taste", target: "personality" }),
  Object.freeze({ text: "What tiny thing ruins your whole mood?", kind: "taste", target: "currentLife" }),

  Object.freeze({ text: "What do you do when there is nobody in the house?", kind: "oddity", target: "typicalTuesday" }),
  Object.freeze({ text: "What is a rule you live by that nobody gave you?", kind: "oddity", target: "whatMatters" }),
  Object.freeze({ text: "What is the strangest thing you own, and why do you still have it?", kind: "oddity", target: "personality" }),
  Object.freeze({ text: "What do you always do the same way, for no good reason?", kind: "oddity", target: "typicalTuesday" }),

  Object.freeze({ text: "What is the last thing that made you laugh out loud, alone?", kind: "memory", target: "currentLife" }),
  Object.freeze({ text: "What smell takes you straight back somewhere?", kind: "memory", target: "personality" }),
  Object.freeze({ text: "What compliment do you still remember word for word?", kind: "memory", target: "personality" }),
  Object.freeze({ text: "What is the best day you have had that cost nothing?", kind: "memory", target: "whatMatters" }),

  Object.freeze({ text: "What do most people get wrong about you?", kind: "stance", target: "personality" }),
  Object.freeze({ text: "What advice do you keep being given and keep ignoring?", kind: "stance", target: "personality" }),
  Object.freeze({ text: "What would you happily be late for?", kind: "stance", target: "whatMatters" }),
  Object.freeze({ text: "What would you happily argue about all night?", kind: "stance", target: "personality" }),

  Object.freeze({ text: "What would you do all day if it paid nothing?", kind: "imagination", target: "whatMatters" }),
  Object.freeze({ text: "What would you spend a completely free Saturday on?", kind: "imagination", target: "typicalTuesday" }),
  Object.freeze({ text: "If you had to teach one thing for a year, what would you teach?", kind: "imagination", target: "personality" }),
  Object.freeze({ text: "What would you put on a billboard for a week?", kind: "imagination", target: "whatMatters" }),
]);

export function countDeepThoughtWords(value = "") {
  const text = String(value).trim();
  if (!text) return 0;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
    return [...segmenter.segment(text)].filter((part) => part.isWordLike).length;
  }
  return (text.match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu) || []).length;
}

export function isDeepThoughtRewardEligible({ text = "", activeMs = 0 } = {}) {
  return countDeepThoughtWords(text) >= DEEP_THOUGHT_MIN_WORDS && Number(activeMs) >= DEEP_THOUGHT_MIN_ACTIVE_MS;
}

// Whether the Send button should be the one that breaks. This reads only the
// text, so it is safe during render and the button can change as the sentence
// is written. "happy" keeps the ordinary press; a real sentence earns the
// button that has to be broken.
export function isSentenceWorthBreakingFor(text = "") {
  return countDeepThoughtWords(text) >= DEEP_THOUGHT_MIN_WORDS;
}

function short(value, maximum = 64) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  return clean.length > maximum ? `${clean.slice(0, maximum - 3).trim()}...` : clean;
}

function questionKey(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function unansweredCuriosityPrompt(state, dateKey) {
  const answers = state?.profile?.profileCase?.survey?.answers || [];
  const answeredQuestions = new Set(
    answers
      .filter((answer) => answer?.kind === "deep-thought")
      .map((answer) => questionKey(answer?.question))
      .filter(Boolean),
  );
  const curiosity = (Array.isArray(state?.athenaMemory?.curiosity)
    ? state.athenaMemory.curiosity
    : [])
    .filter((item) => {
      const id = String(item?.id || "").trim();
      const question = String(item?.question || "").trim();
      const sourceRefs = Array.isArray(item?.sourceRefs) ? item.sourceRefs : [];
      return Boolean(
        id &&
          question &&
          item?.status !== "suppressed" &&
          sourceRefs.length &&
          !answers.some((answer) => answer.questionId === `deep-curiosity-${id}`) &&
          !answeredQuestions.has(questionKey(question)),
      );
    });
  if (curiosity.length) {
    const item = curiosity[0];
    return {
      id: `deep-curiosity-${item.id}`,
      text: short(item.question, 280),
      target: short(item.target, 40) || "whatMatters",
      dateKey,
      source: "curiosity",
      preparedAt: new Date().toISOString(),
    };
  }
  return null;
}

/** Every deep question this person has already answered, whenever it was. */
function answeredQuestionKeys(state) {
  const answers = state?.profile?.profileCase?.survey?.answers || [];
  return new Set(
    answers
      .filter(
        (answer) =>
          answer?.kind === "deep-thought" ||
          String(answer?.questionId || "").startsWith("deep-"),
      )
      .map((answer) => questionKey(answer?.question))
      .filter(Boolean),
  );
}

/**
 * The questions still waiting to be asked.
 *
 * The offset used to be the count of answers given *today*, which reset every
 * morning — so the same question opened every day and the rest of the list was
 * never reached. A question he has answered is spent; when every one is spent
 * the pool comes round again rather than the App going quiet.
 */
export function unaskedDeepThoughts(state, questions = LOCAL_DEEP_THOUGHTS) {
  const asked = answeredQuestionKeys(state);
  const unasked = questions.filter(
    (question) => !asked.has(questionKey(question.text)),
  );
  return unasked.length ? unasked : [...questions];
}

/** The shape of the last one he answered, so the next one is a different door. */
function lastAnsweredKind(state) {
  const answers = [...(state?.profile?.profileCase?.survey?.answers || [])].sort(
    (left, right) =>
      String(left?.answeredAt || "").localeCompare(String(right?.answeredAt || "")),
  );
  for (let index = answers.length - 1; index >= 0; index -= 1) {
    const key = questionKey(answers[index]?.question);
    const question = LOCAL_DEEP_THOUGHTS.find(
      (item) => questionKey(item.text) === key,
    );
    if (question) return question.kind;
  }
  return "";
}

export function createLocalDeepThoughtPrompt(state, dateKey, offset = 0) {

  const identity = short(state?.profile?.identityFocus);
  const mission = short(state?.days?.[dateKey]?.mission?.text);
  const personalized = [];
  if (identity && identity.toLowerCase() !== "yourself") {
    personalized.push({ text: `What does being "${identity}" cost you that nobody sees?`, kind: "stance", target: "personality" });
  }
  if (mission && mission !== "Do one small thing that feels like you.") {
    personalized.push({ text: `What are you avoiding by doing "${mission}" instead?`, kind: "stance", target: "gap" });
  }
  const pool = unaskedDeepThoughts(state);
  const avoid = lastAnsweredKind(state);
  const differentDoor = pool.filter((question) => question.kind !== avoid);
  const questions = [...personalized, ...(differentDoor.length ? differentDoor : pool)];
  const index = Math.max(0, Number(offset) || 0) % questions.length;
  return {
    id: `deep-local-${dateKey}-${Math.max(0, Number(offset) || 0)}`,
    text: questions[index].text,
    kind: questions[index].kind,
    target: questions[index].target,
    dateKey,
    source: personalized.includes(questions[index]) ? "local-personalized" : "local",
    preparedAt: new Date().toISOString(),
  };
}

// One selector owns the full order. Athena's dated prompt gets the first turn;
// her sourced Curiosity Queue gets the next; the phone's personalised lines
// and static floor remain the same local source and are separated only so the
// report can say which fallback was used.
export function selectDeepThoughtPrompt(state, dateKey) {
  const answers = state?.profile?.profileCase?.survey?.answers || [];
  const athenaPrompt = state?.profile?.profileCase?.deepThoughtPrompt;
  if (
    athenaPrompt?.dateKey === dateKey &&
    !answers.some((answer) => answer?.questionId === athenaPrompt.id)
  ) {
    return { ...athenaPrompt, source: "athena" };
  }
  const localOffset = answers.filter((answer) =>
    String(answer?.questionId || "").startsWith(`deep-local-${dateKey}-`),
  ).length;
  return (
    unansweredCuriosityPrompt(state, dateKey) ||
    createLocalDeepThoughtPrompt(state, dateKey, localOffset)
  );
}

export function deepThoughtSourceLabel(source, questionId = "") {
  if (source === "curiosity" || String(questionId).startsWith("deep-curiosity-")) {
    return "Athena Curiosity Queue";
  }
  if (source === "athena" || /^deep-\d{4}-\d{2}-\d{2}-/.test(String(questionId))) {
    return "Athena daily";
  }
  if (source === "local-personalized") return "Local personalised";
  if (source === "local") return "Local static floor";
  if (String(questionId).startsWith("deep-local-")) return "Legacy local detail unreported";
  return "Legacy source unreported";
}

// There is no follow-up. A deep question used to ask a second, softer version
// of itself for any answer short of the reward, which turned one honest
// question into an interrogation and taught that a short answer was a wrong
// one. Sai: "i dont think we need follow up." One question, one answer, done.
