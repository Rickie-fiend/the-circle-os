// A reward should follow a real sentence, not an essay. "happy" earns the press
// effect only; "I love this day, I am grateful for today" earns the reward.
// The active time is a guard against pasting, not a measure of effort, so it is
// only long enough that a sentence cannot appear instantly.
export const DEEP_THOUGHT_MIN_WORDS = 6;
export const DEEP_THOUGHT_MIN_ACTIVE_MS = 5_000;

export const LOCAL_DEEP_THOUGHTS = Object.freeze([
  Object.freeze({ text: "What are you pretending not to know right now?", target: "currentLife" }),
  Object.freeze({ text: "What deserves more of your attention than it is getting?", target: "whatMatters" }),
  Object.freeze({ text: "What would change if you trusted yourself a little more?", target: "personality" }),
  Object.freeze({ text: "Which part of your life feels true, but unfinished?", target: "gap" }),
  Object.freeze({ text: "What are you carrying that no longer belongs to you?", target: "currentLife" }),
  Object.freeze({ text: "What kind of ordinary day would feel quietly meaningful?", target: "typicalTuesday" }),
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

export function createLocalDeepThoughtPrompt(state, dateKey, offset = 0) {

  const identity = short(state?.profile?.identityFocus);
  const mission = short(state?.days?.[dateKey]?.mission?.text);
  const personalized = [];
  if (identity && identity.toLowerCase() !== "yourself") {
    personalized.push({ text: `What would becoming "${identity}" ask you to be honest about today?`, target: "personality" });
  }
  if (mission && mission !== "Do one small thing that feels like you.") {
    personalized.push({ text: `What does "${mission}" really mean to you today?`, target: "whatMatters" });
  }
  const questions = [...personalized, ...LOCAL_DEEP_THOUGHTS];
  const index = Math.max(0, Number(offset) || 0) % questions.length;
  return {
    id: `deep-local-${dateKey}-${Math.max(0, Number(offset) || 0)}`,
    text: questions[index].text,
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

export function deepThoughtFollowUp(prompt) {
  const byTarget = {
    gap: "What part of that feels hardest to name honestly?",
    whatMatters: "Why does that matter to you more than it first appears?",
    personality: "What would listening to that part of yourself change?",
    typicalTuesday: "What is one detail that would make that life feel real?",
    currentLife: "What do you think is underneath that answer?",
  };
  return {
    id: `${prompt.id}-follow-up`,
    text: byTarget[prompt.target] || "What feels most important underneath that answer?",
    target: prompt.target || "currentLife",
    dateKey: prompt.dateKey,
    source: prompt.source,
    stage: "follow-up",
    preparedAt: prompt.preparedAt,
  };
}
