const INPUT_TYPES = new Set([
  "single-choice",
  "multi-choice",
  "yes-no",
  "slider",
  "short-text",
  "long-text",
  "time",
]);

const COMPLETION_TYPES = new Set(["confirm", "result"]);
const LEGACY_SUBMIT_CHAPTERS = new Set(["log-setup@1"]);

export const CHAPTER_COMPLETION_MODES = Object.freeze(["dwell", "swipe"]);

/**
 * How a chapter leaves its completion Page.
 *
 * Old published chapters predate the field, so their immutable Page anatomy is
 * the default declaration: completion -> idle dwells, while a final completion
 * leaves on a deliberate forward swipe. New chapters may state the same answer
 * explicitly. A shape that cannot answer fails before it reaches the player.
 */
export function chapterCompletion(chapter) {
  const id = chapter?.id || "(unknown)";
  const pages = Array.isArray(chapter?.pages) ? chapter.pages : [];
  if (!pages.length) {
    throw new Error(`Chapter ${id} cannot answer how it ends: it has no pages.`);
  }

  const completionIndices = pages
    .map((page, index) => (COMPLETION_TYPES.has(page?.type) ? index : -1))
    .filter((index) => index >= 0);

  // One immutable historical definition completed as its last answer was
  // submitted. Keep that exact publication readable without allowing a new
  // input-final chapter to ship with an undeclared ending.
  if (
    !completionIndices.length &&
    INPUT_TYPES.has(pages.at(-1)?.type) &&
    LEGACY_SUBMIT_CHAPTERS.has(`${chapter.id}@${chapter.version}`)
  ) {
    if (chapter.completion) {
      throw new Error(
        `Chapter ${id} declares completion "${chapter.completion}" but has no completion page.`,
      );
    }
    return "submit";
  }

  if (completionIndices.length !== 1) {
    throw new Error(
      `Chapter ${id} cannot answer how it ends: it needs exactly one Result or Confirm page.`,
    );
  }

  const completionIndex = completionIndices[0];
  const idleIndices = pages
    .map((page, index) => (page?.type === "idle" ? index : -1))
    .filter((index) => index >= 0);
  let inferred;
  if (
    idleIndices.length === 1 &&
    idleIndices[0] === pages.length - 1 &&
    completionIndex === pages.length - 2
  ) {
    inferred = "dwell";
  } else if (!idleIndices.length && completionIndex === pages.length - 1) {
    inferred = "swipe";
  } else {
    throw new Error(
      `Chapter ${id} cannot answer how it ends: Result or Confirm must be final or lead directly to one final Idle page.`,
    );
  }

  if (
    chapter.completion !== undefined &&
    !CHAPTER_COMPLETION_MODES.includes(chapter.completion)
  ) {
    throw new Error(
      `Chapter ${id} names unknown completion "${chapter.completion}". Use dwell or swipe.`,
    );
  }
  if (chapter.completion && chapter.completion !== inferred) {
    throw new Error(
      `Chapter ${id} declares completion "${chapter.completion}" but its pages require "${inferred}".`,
    );
  }
  return chapter.completion || inferred;
}
