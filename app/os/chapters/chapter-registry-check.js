import { chapterCompletion } from "./chapter-capabilities.js";
import { chapterApp, chapterKind } from "./chapter-scheduler.js";

/** Every behavior capability must resolve before a publication can ship. */
export function assertPublishedChapterCapabilities(chapters) {
  for (const chapter of chapters) {
    chapterApp(chapter);
    chapterKind(chapter);
    chapterCompletion(chapter);
  }
  return chapters;
}

// Kept for callers and tests written when App routing was the only capability
// with a closed build-time check.
export const assertPublishedChapterRouting = assertPublishedChapterCapabilities;
