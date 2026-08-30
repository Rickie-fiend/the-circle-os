// A reward should follow a real sentence, not an essay. "happy" earns the press
// effect only; "I love this day, I am grateful for today" earns the reward.
// The active time is a guard against pasting, not a measure of effort, so it is
// only long enough that a sentence cannot appear instantly.
export const DEEP_THOUGHT_MIN_WORDS = 6;
export const DEEP_THOUGHT_MIN_ACTIVE_MS = 5_000;

/**
 * The floor Deep Thoughts falls back to when Athena has nothing dated and the
 * Curiosity Queue is empty.
 *
 * The old list asked about attention, trust and meaning — the vocabulary of a
 * self-help poster, which is answerable by anyone about anyone and therefore
 * asks nothing. Sai: "still asking shit questions ... This function is for deep
 * deep personal questions."
 *
 * A question earns its place here when only he can answer it, out of his own
 * life, and a slogan will not do.
 *
 * The first rewrite made every one of them cost something — avoided, given up,
 * ashamed of — which is honest and exhausting, and an App nobody wants to open
 * asks nothing at all. Sai: "deep thoughts should be fun to answer questions
 * that have a peak into the user's mind." So the list mixes weights now: some
 * are light and still revealing (what you are unreasonably good at, the pettiest
 * thing you feel strongly about), some are heavy. A question can be a pleasure
 * to answer and still show something true — that is the better trade.
 *
 * The language stays plain. Athena asks; she does not diagnose, advise, or imply
 * the answer she is hoping for.
 *
 * This is a floor, not the voice. The authored questions are Sai's writing and
 * belong in Athena's library; these keep the App honest until they arrive.
 */
export const LOCAL_DEEP_THOUGHTS = Object.freeze([
  Object.freeze({ text: "What is a small thing you are unreasonably good at?", target: "personality" }),
  Object.freeze({ text: "What did you believe at fifteen that you still quietly believe?", target: "personality" }),
  Object.freeze({ text: "What would you do all day if it paid nothing?", target: "whatMatters" }),
  Object.freeze({ text: "Who could ring you at 3am, and who could not?", target: "currentLife" }),
  Object.freeze({ text: "What is the last thing that made you laugh out loud, alone?", target: "currentLife" }),
  Object.freeze({ text: "What do you want that you have never said out loud?", target: "whatMatters" }),
  Object.freeze({ text: "Where are you lying to yourself, and how long have you known?", target: "currentLife" }),
  Object.freeze({ text: "What did you give up to get here, and was it worth it?", target: "gap" }),
  Object.freeze({ text: "What part of yourself did you put away to be liked?", target: "personality" }),
  Object.freeze({ text: "What do you keep promising yourself and not doing?", target: "gap" }),
  Object.freeze({ text: "Who do you love, and how would they know it from this week?", target: "currentLife" }),
  Object.freeze({ text: "What compliment do you never believe?", target: "personality" }),
  Object.freeze({ text: "What still makes you angry that you say you are over?", target: "personality" }),
  Object.freeze({ text: "Who taught you that rest had to be earned?", target: "currentLife" }),
  Object.freeze({ text: "If nobody was watching, what would you stop doing tomorrow?", target: "typicalTuesday" }),
  Object.freeze({ text: "What would you spend a completely free Saturday on?", target: "typicalTuesday" }),
  Object.freeze({ text: "What are you waiting for permission to do?", target: "whatMatters" }),
  Object.freeze({ text: "What is the pettiest thing you feel strongly about?", target: "personality" }),
  Object.freeze({ text: "What would someone who really knew you say about this year?", target: "gap" }),
  Object.freeze({ text: "What is a rule you live by that nobody gave you?", target: "whatMatters" }),
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
    personalized.push({ text: `What does being "${identity}" cost you that nobody sees?`, target: "personality" });
  }
  if (mission && mission !== "Do one small thing that feels like you.") {
    personalized.push({ text: `What are you avoiding by doing "${mission}" instead?`, target: "gap" });
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

// There is no follow-up. A deep question used to ask a second, softer version
// of itself for any answer short of the reward, which turned one honest
// question into an interrogation and taught that a short answer was a wrong
// one. Sai: "i dont think we need follow up." One question, one answer, done.
