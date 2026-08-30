/**
 * What a person thought of a Line.
 *
 * A Line gives and collects nothing — that is the whole point of it, and the
 * reason it needs no run, version or cooldown. This is the one exception, and
 * it stays as small as the thing it is attached to: which line, which reaction,
 * when. No score, no streak, nothing that turns reading into answering.
 *
 * Sai: "on the last page of the joke, quotes, facts ... the footer should show
 * buttons for feedback ... jokes footer would be, haha icon and dislike icon
 * ... quotes and facts would be love icon and dislike icon."
 *
 * A joke is asked whether it landed. A quote or a fact is asked whether it was
 * worth keeping. They are different questions, so they get different words.
 */

/** The reactions a kind can be given, in the order they are shown. */
export const LINE_REACTIONS = Object.freeze({
  joke: Object.freeze(["funny", "flat"]),
  quote: Object.freeze(["loved", "not-for-me"]),
  fact: Object.freeze(["loved", "not-for-me"]),
});

/** What each reaction is called out loud, for anyone not seeing the icon. */
export const LINE_REACTION_LABELS = Object.freeze({
  funny: "Funny",
  flat: "Not funny",
  loved: "Loved this",
  "not-for-me": "Not for me",
});

/**
 * The word on each key.
 *
 * These were emoji. Sai: "i dont love the use of emojis ... it look ass and not
 * consistent." He was right — the App has no other pictographs anywhere, so two
 * in a Footer belonged to a different product, and an emoji renders differently
 * on every device besides. A word is what every other control here carries, and
 * it needs no legend.
 *
 * Shorter than the spoken label on purpose: the key says the answer, the label
 * says it in full for anyone who cannot see the key.
 */
export const LINE_REACTION_WORDS = Object.freeze({
  funny: "Funny",
  flat: "Not really",
  loved: "Loved it",
  "not-for-me": "Not for me",
});

/** The reactions offered for a Line, or none for a kind that is not asked. */
export function lineReactions(kind) {
  return LINE_REACTIONS[kind] || [];
}

export function isLineReaction(kind, reaction) {
  return lineReactions(kind).includes(reaction);
}

function cleanId(value) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

export function normalizeLineFeedback(value) {
  const source = value && typeof value === "object" ? value : {};
  const feedback = {};
  for (const [lineId, entry] of Object.entries(source)) {
    const id = cleanId(lineId);
    const reaction = cleanId(entry?.reaction);
    const at = cleanId(entry?.at);
    if (!id || !reaction) continue;
    feedback[id] = { reaction, at: at || "" };
  }
  return feedback;
}

/**
 * Record a reaction. Pressing the same one again takes it back, because a
 * reaction given by accident on a reading surface must be givable back, and
 * there is no other way out of it.
 */
export function reactToLine(feedback, lineId, reaction, at = new Date().toISOString()) {
  const current = normalizeLineFeedback(feedback);
  const id = cleanId(lineId);
  if (!id || !reaction) return current;
  if (current[id]?.reaction === reaction) {
    const rest = { ...current };
    delete rest[id];
    return rest;
  }
  return { ...current, [id]: { reaction, at } };
}

export function lineReaction(feedback, lineId) {
  return normalizeLineFeedback(feedback)[cleanId(lineId)]?.reaction || "";
}

/**
 * Two devices that reacted to different lines keep both. The same line reacted
 * to on both keeps whichever was later, because the newer press is the one the
 * person meant.
 */
export function mergeLineFeedback(left = {}, right = {}) {
  const a = normalizeLineFeedback(left);
  const b = normalizeLineFeedback(right);
  const merged = { ...a };
  for (const [id, entry] of Object.entries(b)) {
    const mine = merged[id];
    if (!mine || String(entry.at).localeCompare(String(mine.at)) > 0) {
      merged[id] = entry;
    }
  }
  return merged;
}
