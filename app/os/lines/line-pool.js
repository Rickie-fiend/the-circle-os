/**
 * Lines: one-beat content that gives and collects nothing.
 *
 * A chapter is a journey. It has pages, a run, an immutable version, recorded
 * answers, a cooldown and a completion, and all of that exists because a
 * chapter asks something and the answer has to be kept. A quote asks nothing,
 * so every part of that machinery would be overhead: a one-line joke was
 * costing a four-page structured document to say.
 *
 * So a line is not a chapter. There is no run, no version and no cooldown. The
 * only rule is that it should not repeat while there is anything else to show,
 * which is why the pool only gets better as it grows. That is the whole reason
 * this exists: the deck of chapters is rationed on purpose, and something that
 * gives can be unrationed, so the Note label can always have an answer.
 */

export const LINE_KINDS = Object.freeze(["quote", "joke", "fact"]);

/** How many recently seen lines are remembered, so the pool rotates. */
export const LINE_MEMORY = 24;

function cleanText(value, maximum = 320) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maximum)
    : "";
}

export function normalizeLine(value) {
  const line = value && typeof value === "object" ? value : {};
  const text = cleanText(line.text);
  const id = cleanText(line.id, 80);
  if (!id || !text) return null;
  return {
    id,
    kind: LINE_KINDS.includes(line.kind) ? line.kind : "quote",
    text,
    sub: cleanText(line.sub),
  };
}

export function normalizeLinePool(value) {
  const source = Array.isArray(value) ? value : value?.lines;
  const seen = new Set();
  const lines = [];
  for (const candidate of Array.isArray(source) ? source : []) {
    const line = normalizeLine(candidate);
    if (!line || seen.has(line.id)) continue;
    seen.add(line.id);
    lines.push(line);
  }
  return lines;
}

/**
 * The next line to show.
 *
 * Unseen lines come first, so a fresh batch is met before anything repeats, and
 * once everything has been seen it falls back to whatever was seen longest ago.
 * The pool becomes a rotation rather than a wall.
 *
 * Kind is what decides between equals. Read in file order the pool served
 * fifteen quotes before the first joke, which is not a mix of anything; the
 * kind seen least recently goes next, so a quote is followed by a joke and then
 * a fact whatever order they happen to be written in.
 *
 * @param {Array|{lines?: Array}} pool the pool, or the file that holds it
 * @param {string[]} recentIds newest first
 */
export function selectLine(pool, recentIds = []) {
  const lines = normalizeLinePool(pool);
  if (!lines.length) return null;
  const recent = Array.isArray(recentIds) ? recentIds : [];
  const kindById = new Map(lines.map((line) => [line.id, line.kind]));

  // How long ago each kind was last read. Never read sorts oldest of all.
  const kindLastSeen = new Map();
  recent.forEach((id, index) => {
    const kind = kindById.get(id);
    if (kind && !kindLastSeen.has(kind)) kindLastSeen.set(kind, index);
  });
  const kindRank = (kind) =>
    kindLastSeen.has(kind) ? kindLastSeen.get(kind) : Number.POSITIVE_INFINITY;

  const unseen = lines.filter((line) => !recent.includes(line.id));
  const candidates = unseen.length ? unseen : lines;
  return [...candidates].sort((left, right) => {
    const kind = kindRank(right.kind) - kindRank(left.kind);
    if (kind) return kind > 0 ? 1 : -1;
    if (!unseen.length) {
      // Everything has been read: the one read longest ago goes next.
      const seen = recent.indexOf(right.id) - recent.indexOf(left.id);
      if (seen) return seen > 0 ? 1 : -1;
    }
    return lines.indexOf(left) - lines.indexOf(right);
  })[0];
}

/** Newest first, capped, no duplicates. */
export function rememberLine(recentIds = [], id) {
  const clean = cleanText(id, 80);
  if (!clean) return Array.isArray(recentIds) ? recentIds : [];
  const previous = (Array.isArray(recentIds) ? recentIds : []).filter(
    (value) => value !== clean,
  );
  return [clean, ...previous].slice(0, LINE_MEMORY);
}

/** Two devices that each read different lines should end up remembering both. */
export function mergeSeenLines(left = [], right = []) {
  const merged = [];
  const seen = new Set();
  const a = Array.isArray(left) ? left : [];
  const b = Array.isArray(right) ? right : [];
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    for (const value of [a[index], b[index]]) {
      const clean = cleanText(value, 80);
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      merged.push(clean);
    }
  }
  return merged.slice(0, LINE_MEMORY);
}
