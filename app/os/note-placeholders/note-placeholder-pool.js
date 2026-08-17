/**
 * Empty-Note words are a tiny rotation, separate from Lines.
 *
 * The order is deliberate and local. Advancing needs no run, timestamp,
 * cooldown or completion; it only prevents Clear from returning the same words.
 */
export function normalizeNotePlaceholders(value) {
  const candidates = Array.isArray(value)
    ? value
    : Array.isArray(value?.placeholders)
      ? value.placeholders
      : [];
  return candidates
    .map((candidate) => ({
      id: String(candidate?.id || "").trim(),
      text: String(candidate?.text || "").trim(),
    }))
    .filter((candidate) => candidate.id && candidate.text);
}

export function nextNotePlaceholder(value, previousId = "") {
  const placeholders = normalizeNotePlaceholders(value);
  if (!placeholders.length) return null;
  const previousIndex = placeholders.findIndex(
    (placeholder) => placeholder.id === previousId,
  );
  return placeholders[(previousIndex + 1) % placeholders.length];
}
