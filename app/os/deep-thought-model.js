export const DEEP_THOUGHT_MIN_WORDS = 15;
export const DEEP_THOUGHT_MIN_ACTIVE_MS = 20_000;

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

function short(value, maximum = 64) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  return clean.length > maximum ? `${clean.slice(0, maximum - 3).trim()}...` : clean;
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
    source: "follow-up",
    preparedAt: prompt.preparedAt,
  };
}
