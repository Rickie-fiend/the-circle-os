"use client";

import { useEffect, useRef, useState } from "react";

export const APP_FLIP_EXIT_MS = 260;
export const APP_FLIP_RESIZE_MS = 440;
export const APP_FLIP_TOTAL_MS = 840;

type FlipPhase = "idle" | "leaving" | "arriving";

/**
 * One controller for the back of every App.
 *
 * A flip is not a new-content reveal. The current Page fades, the side changes
 * under the stable App Box, and the known Page settles in. Reduced motion makes
 * the change immediate. Feature code may prepare the incoming side at the
 * midpoint, but it does not own another timer or transition class.
 */
export function useAppBack<Side extends string>(initialSide: Side) {
  const [side, setSide] = useState(initialSide);
  const [phase, setPhase] = useState<FlipPhase>("idle");
  const sideRef = useRef(side);
  const exitTimer = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const releaseFrameOne = useRef<number | null>(null);
  const releaseFrameTwo = useRef<number | null>(null);
  const releaseFrameThree = useRef<number | null>(null);
  const releaseFrameFour = useRef<number | null>(null);
  const releaseFrameTimer = useRef<number | null>(null);
  const heldSession = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sideRef.current = side;
  }, [side]);

  useEffect(
    () => () => {
      clearTimers();
      releaseFrame();
    },
    [],
  );

  function clearTimers() {
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    exitTimer.current = null;
    settleTimer.current = null;
    if (releaseFrameOne.current) window.cancelAnimationFrame(releaseFrameOne.current);
    if (releaseFrameTwo.current) window.cancelAnimationFrame(releaseFrameTwo.current);
    if (releaseFrameThree.current) window.cancelAnimationFrame(releaseFrameThree.current);
    if (releaseFrameFour.current) window.cancelAnimationFrame(releaseFrameFour.current);
    if (releaseFrameTimer.current) window.clearTimeout(releaseFrameTimer.current);
    releaseFrameOne.current = null;
    releaseFrameTwo.current = null;
    releaseFrameThree.current = null;
    releaseFrameFour.current = null;
    releaseFrameTimer.current = null;
  }

  function releaseFrame() {
    const session = heldSession.current;
    if (!session) return;
    session.classList.remove("os-app-flip-resizing");
    session.classList.remove("os-app-flip-hold");
    session.style.removeProperty("--os-app-flip-height");
    heldSession.current = null;
  }

  function holdFrame(source?: HTMLElement | null) {
    releaseFrame();
    const session = source?.closest<HTMLElement>(".os-swipe-session") || null;
    const frame = session?.querySelector<HTMLElement>(".os-app-window") || null;
    if (!session || !frame) return;
    session.style.setProperty(
      "--os-app-flip-height",
      `${frame.getBoundingClientRect().height}px`,
    );
    session.classList.add("os-app-flip-hold");
    heldSession.current = session;
  }

  function easeFrameToIncomingSide() {
    // The incoming Page and its editable rows measure over two layout frames.
    // Release on the third so the frame's 440ms ease begins from the held old
    // height and the fully measured new height while the new copy is arriving.
    releaseFrameOne.current = window.requestAnimationFrame(() => {
      releaseFrameTwo.current = window.requestAnimationFrame(() => {
        releaseFrameThree.current = window.requestAnimationFrame(() => {
          const session = heldSession.current;
          const page = session?.querySelector<HTMLElement>(".os-app-page.current");
          const surface = page?.firstElementChild as HTMLElement | null;
          const targetHeight = Math.ceil(
            Math.max(
              page?.scrollHeight || 0,
              surface?.scrollHeight || 0,
              surface?.getBoundingClientRect().height || 0,
            ),
          );
          if (!session || targetHeight <= 0) {
            releaseFrame();
            return;
          }
          session.classList.add("os-app-flip-resizing");
          session.querySelector<HTMLElement>(".os-app-window")?.getBoundingClientRect();
          releaseFrameFour.current = window.requestAnimationFrame(() => {
            session.style.setProperty(
              "--os-app-flip-height",
              `${targetHeight}px`,
            );
            releaseFrameTimer.current = window.setTimeout(() => {
              releaseFrame();
              releaseFrameTimer.current = null;
            }, APP_FLIP_RESIZE_MS);
            releaseFrameFour.current = null;
          });
          releaseFrameOne.current = null;
          releaseFrameTwo.current = null;
          releaseFrameThree.current = null;
        });
      });
    });
  }

  function commit(nextSide: Side, prepare?: () => void) {
    prepare?.();
    sideRef.current = nextSide;
    setSide(nextSide);
  }

  function flip(
    nextSide: Side,
    prepare?: () => void,
    source?: HTMLElement | null,
  ) {
    if (phase !== "idle" || nextSide === sideRef.current) return;
    clearTimers();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commit(nextSide, prepare);
      setPhase("idle");
      return;
    }
    holdFrame(source);
    setPhase("leaving");
    exitTimer.current = window.setTimeout(() => {
      commit(nextSide, prepare);
      setPhase("arriving");
      easeFrameToIncomingSide();
      exitTimer.current = null;
    }, APP_FLIP_EXIT_MS);
    settleTimer.current = window.setTimeout(() => {
      setPhase("idle");
      releaseFrame();
      settleTimer.current = null;
    }, APP_FLIP_TOTAL_MS);
  }

  function reset(nextSide: Side) {
    clearTimers();
    releaseFrame();
    sideRef.current = nextSide;
    setSide(nextSide);
    setPhase("idle");
  }

  return {
    side,
    phase,
    flipping: phase !== "idle",
    className: phase === "idle" ? "" : `os-app-flip os-app-flip-${phase}`,
    flip,
    reset,
  };
}
