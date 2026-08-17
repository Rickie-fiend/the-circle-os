"use client";

import { type RefObject, useLayoutEffect } from "react";

const ANCHOR_TOLERANCE_PX = 1;

/**
 * Keeps a visible downstream reading surface still when an App Box above it
 * changes height on browsers whose native scroll anchoring misses the change.
 * Native anchoring gets two frames to settle first; this does nothing when the
 * browser already held the reader in place.
 */
export function useStableRouteAnchor(
  changingRef: RefObject<HTMLElement | null>,
  readingRef: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    const changing = changingRef.current;
    const reading = readingRef.current;
    if (!changing || !reading || typeof ResizeObserver === "undefined") return;

    let changingHeight = changing.getBoundingClientRect().height;
    let readingTop = reading.getBoundingClientRect().top;
    let frameOne = 0;
    let frameTwo = 0;

    const rememberReadingTop = () => {
      readingTop = reading.getBoundingClientRect().top;
    };

    const observer = new ResizeObserver(() => {
      const nextHeight = changing.getBoundingClientRect().height;
      if (Math.abs(nextHeight - changingHeight) <= ANCHOR_TOLERANCE_PX) return;
      changingHeight = nextHeight;

      const readingRect = reading.getBoundingClientRect();
      const wasVisible =
        readingTop < window.innerHeight &&
        readingTop + readingRect.height > 0;
      const protectedTop = readingTop;
      if (!wasVisible) {
        readingTop = readingRect.top;
        return;
      }

      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
      frameOne = window.requestAnimationFrame(() => {
        frameTwo = window.requestAnimationFrame(() => {
          const settledTop = reading.getBoundingClientRect().top;
          const missedDistance = settledTop - protectedTop;
          if (Math.abs(missedDistance) > ANCHOR_TOLERANCE_PX) {
            window.scrollBy(0, missedDistance);
          }
          readingTop = reading.getBoundingClientRect().top;
        });
      });
    });

    observer.observe(changing);
    window.addEventListener("scroll", rememberReadingTop, { passive: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
      window.removeEventListener("scroll", rememberReadingTop);
    };
  }, [changingRef, readingRef]);
}
