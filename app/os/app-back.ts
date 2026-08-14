"use client";

import { useEffect, useRef, useState } from "react";

export const APP_FLIP_EXIT_MS = 260;
export const APP_FLIP_TOTAL_MS = 620;

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
  const heldSession = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sideRef.current = side;
  }, [side]);

  useEffect(
    () => () => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      releaseFrame();
    },
    [],
  );

  function clearTimers() {
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    exitTimer.current = null;
    settleTimer.current = null;
  }

  function releaseFrame() {
    const session = heldSession.current;
    if (!session) return;
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
