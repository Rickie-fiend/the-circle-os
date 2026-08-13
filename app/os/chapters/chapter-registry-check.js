import { chapterApp } from "./chapter-scheduler.js";

/** A published registry must never gain the old silent Note fallback. */
export function assertPublishedChapterRouting(chapters) {
  for (const chapter of chapters) chapterApp(chapter);
  return chapters;
}
