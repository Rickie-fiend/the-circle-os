"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CHAPTER_PUBLICATION_EVENT,
  readChapterPublications,
  type StoredChapterPublication,
} from "./chapter-publication-store";

export function useChapterPublications(enabled = true) {
  const [publications, setPublications] = useState<StoredChapterPublication[]>([]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setPublications(await readChapterPublications().catch(() => []));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    queueMicrotask(() => void refresh());
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener(CHAPTER_PUBLICATION_EVENT, refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(CHAPTER_PUBLICATION_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, refresh]);

  return { publications, refresh };
}
