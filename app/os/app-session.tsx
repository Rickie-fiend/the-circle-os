"use client";

import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
} from "react";
import { pageTextLayout } from "./page-text-layout.js";

const seenAttentionKeys = new Set<string>();

/**
 * How long an idle App Box rests on one Page before it quietly turns to the
 * next one.
 *
 * An idle App Box holds more than one Page, and the second Page is easy to
 * forget: a habit stays unticked all day because the Habit Page is behind
 * Protocol, and nothing on screen says so. An idle box turns its own pages, so
 * everything it holds comes past on its own.
 *
 * It never takes a Page away from someone using it. The dwell restarts on any
 * touch, it waits while anything inside the box has focus, and it does not run
 * while the phone is asleep or the app is in the background.
 */
/* The box's own growth: long enough to read as a movement, short enough that
 * it never keeps you waiting to see what opened. The curve is the Page's own
 * arrival curve, so everything in an App Box moves the same way. */
const GROWTH_MS = 260;
const GROWTH_EASE = "cubic-bezier(0.22, 0.72, 0.22, 1)";
/* Below a line of text the box just follows: that is typing, not expanding. */
const GROWTH_MIN_PX = 40;

export const IDLE_PAGE_DWELL_MS = 30000;

export type AppPagePlacement =
  | "balanced"
  | "identity-stack"
  | "content-flow";

export function SwipeSession({
  children,
  index,
  maxIndex,
  onIndexChange,
  className = "",
  label,
  availableIndices,
  frameHeight,
  onLongPress,
  onBackwardBoundary,
  onForwardBoundary,
  attentionKey,
  attentionIndex = 0,
  rotateMs,
  rotatePaused = false,
}: {
  children: ReactNode;
  index: number;
  maxIndex?: number;
  onIndexChange: (index: number) => void;
  className?: string;
  label: string;
  availableIndices?: number[];
  frameHeight?: CSSProperties["height"];
  onLongPress?: () => void;
  /** A swipe back off the front, where there is no previous Page. */
  onBackwardBoundary?: () => void;
  onForwardBoundary?: () => void;
  attentionKey?: string;
  attentionIndex?: number;
  rotateMs?: number;
  rotatePaused?: boolean;
}) {
  const apps = Children.toArray(children);
  const lastIndex = Math.max(0, Math.min(
    apps.length - 1,
    maxIndex ?? Math.max(0, apps.length - 1),
  ));
  const activeIndex = Math.max(0, Math.min(lastIndex, index));
  const configuredIndices = (
    availableIndices?.length
      ? availableIndices
      : Array.from({ length: lastIndex + 1 }, (_, itemIndex) => itemIndex)
  )
    .filter(
      (itemIndex, position, values) =>
        itemIndex >= 0 &&
        itemIndex <= lastIndex &&
        values.indexOf(itemIndex) === position,
    )
    .sort((left, right) => left - right);
  const allowedIndices = configuredIndices.includes(activeIndex)
    ? configuredIndices
    : [...configuredIndices, activeIndex].sort((left, right) => left - right);
  const currentPosition = allowedIndices.indexOf(activeIndex);
  const previousIndex = allowedIndices[currentPosition - 1];
  const nextIndex = allowedIndices[currentPosition + 1];
  const pointerStart = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const sessionRef = useRef<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef<HTMLDivElement | null>(null);
  const settleTimer = useRef<number | null>(null);
  const blockedTimer = useRef<number | null>(null);
  const commitFrame = useRef<number | null>(null);
  const externalMotionTimer = useRef<number | null>(null);
  const previousActiveIndex = useRef(activeIndex);
  const boxHeight = useRef<number | null>(null);
  const growth = useRef<Animation | null>(null);

  /**
   * Move the box's edge from where it was to where it now is.
   *
   * Called from both places a height can change: the Page you arrive at, and
   * the Page in front of you growing. They share one record of the height so
   * they cannot disagree about where the edge was.
   */
  function playGrowth(nextHeight: number) {
    const frame = windowRef.current;
    const from = boxHeight.current;
    boxHeight.current = nextHeight;
    if (!frame || frameHeight || from === null) return;
    // A line of text appearing under the caret is not an expansion, and
    // animating it would put the box behind the typing.
    if (Math.abs(nextHeight - from) <= GROWTH_MIN_PX) return;
    growth.current?.cancel();
    growth.current = frame.animate(
      [{ height: `${from}px` }, { height: `${nextHeight}px` }],
      { duration: GROWTH_MS, easing: GROWTH_EASE },
    );
  }
  const internalCommit = useRef(false);
  const wheelTimer = useRef<number | null>(null);
  const wheelDistance = useRef(0);
  const longPressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const didSwipe = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [showingBlockedCue, setShowingBlockedCue] = useState(false);
  const [externalMotion, setExternalMotion] = useState("");
  const attentionIsNew = Boolean(
    attentionKey &&
    activeIndex === attentionIndex &&
    !seenAttentionKeys.has(attentionKey),
  );
  const [showingAttentionKey, setShowingAttentionKey] = useState("");
  const attentionShowing = showingAttentionKey === attentionKey;
  const attentionArmed = attentionIsNew && !attentionShowing;
  const longPressCallback = useRef(onLongPress);
  const longPressEnabled = Boolean(onLongPress);

  const rotation = useRef({ allowedIndices, activeIndex, onIndexChange });

  useEffect(() => {
    longPressCallback.current = onLongPress;
  }, [onLongPress]);

  useEffect(() => {
    rotation.current = { allowedIndices, activeIndex, onIndexChange };
  });

  // An idle App Box turns its own pages, so a Page nobody swiped to still comes
  // past. Everything here is about not interrupting: the dwell restarts on any
  // touch or key, it waits out focus rather than pulling a Page away from
  // someone writing on it, and a background tab never advances quietly.
  useEffect(() => {
    const session = sessionRef.current;
    if (
      !session ||
      !rotateMs ||
      rotatePaused ||
      allowedIndices.length < 2 ||
      dragging ||
      settling ||
      committing
    ) {
      return;
    }

    let timer: number | null = null;

    const stop = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (document.hidden) return;
      timer = window.setTimeout(turn, rotateMs);
    };

    const turn = () => {
      const {
        allowedIndices: indices,
        activeIndex: current,
        onIndexChange: change,
      } = rotation.current;
      if (document.hidden || session.contains(document.activeElement)) {
        start();
        return;
      }
      const next = indices[(indices.indexOf(current) + 1) % indices.length];
      if (next === undefined || next === current) return;
      change(next);
    };

    start();
    session.addEventListener("pointerdown", start);
    session.addEventListener("keydown", start);
    session.addEventListener("focusin", stop);
    session.addEventListener("focusout", start);
    document.addEventListener("visibilitychange", start);
    return () => {
      stop();
      session.removeEventListener("pointerdown", start);
      session.removeEventListener("keydown", start);
      session.removeEventListener("focusin", stop);
      session.removeEventListener("focusout", start);
      document.removeEventListener("visibilitychange", start);
    };
  }, [
    activeIndex,
    allowedIndices.length,
    committing,
    dragging,
    rotateMs,
    rotatePaused,
    settling,
  ]);

  useEffect(() => {
    const session = sessionRef.current;
    if (
      !session ||
      !attentionKey ||
      activeIndex !== attentionIndex ||
      seenAttentionKeys.has(attentionKey)
    ) {
      return;
    }

    let timer: number | null = null;
    const reveal = () => {
      seenAttentionKeys.add(attentionKey);
      setShowingAttentionKey(attentionKey);
      // Just past the arrival in `--os-arrival-ms`. This held the class for
      // 2.4s to cover a staggered reveal that no longer exists.
      timer = window.setTimeout(() => setShowingAttentionKey(""), 420);
    };

    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return () => {
        if (timer) window.clearTimeout(timer);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        window.clearTimeout(safety);
        reveal();
      },
      { threshold: 0.45 },
    );
    observer.observe(session);

    // An armed App Box is invisible: `update-armed` holds it at opacity 0 until
    // the arrival runs. That is fine for a box the reveal will reach, and it is
    // an App that shows nothing for one it will not — Sai opened Today and the
    // Log was an empty frame, because the Log sits below the fold and the
    // observer only fires once 45% of it is on screen. Zooming forced a
    // re-evaluation and it appeared, which is what the symptom was telling us.
    //
    // Nothing may stay invisible waiting on an observer. The arrival is an
    // ornament; the content is the App.
    const safety = window.setTimeout(() => {
      observer.disconnect();
      reveal();
    }, 900);

    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
      if (timer) window.clearTimeout(timer);
    };
  }, [activeIndex, attentionIndex, attentionKey]);

  useLayoutEffect(() => {
    const previousIndex = previousActiveIndex.current;
    if (previousIndex === activeIndex) return;
    previousActiveIndex.current = activeIndex;
    // The Page has already been swapped in and laid out at its own height, so
    // this reads where the box has to end up and moves its edge there. Driven
    // from here rather than left to the observer, because arriving at a Page is
    // the change he watches most and it must not wait on a delivery.
    if (windowRef.current && !frameHeight) {
      playGrowth(windowRef.current.getBoundingClientRect().height);
    }
    if (internalCommit.current) {
      internalCommit.current = false;
      return;
    }
    if (externalMotionTimer.current) window.clearTimeout(externalMotionTimer.current);
    setExternalMotion(activeIndex > previousIndex ? "motion-next" : "motion-previous");
    externalMotionTimer.current = window.setTimeout(() => {
      setExternalMotion("");
      externalMotionTimer.current = null;
    }, 300);
  }, [activeIndex]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session || !longPressEnabled) return;

    let start: { x: number; y: number } | null = null;
    let timer: number | null = null;

    const clear = () => {
      start = null;
      if (timer) window.clearTimeout(timer);
      timer = null;
    };
    const startHold = (event: globalThis.TouchEvent) => {
      if (event.touches.length !== 1) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("select, a, [contenteditable='true']")
      ) {
        return;
      }
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
      longPressed.current = false;
      timer = window.setTimeout(() => {
        timer = null;
        if (longPressed.current) return;
        longPressed.current = true;
        if ("vibrate" in navigator) navigator.vibrate(12);
        longPressCallback.current?.();
      }, 960);
    };
    const moveHold = (event: globalThis.TouchEvent) => {
      if (!start || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (
        Math.abs(touch.clientX - start.x) > 22 ||
        Math.abs(touch.clientY - start.y) > 22
      ) {
        clear();
      }
    };

    session.addEventListener("touchstart", startHold, { passive: true });
    session.addEventListener("touchmove", moveHold, { passive: true });
    session.addEventListener("touchend", clear, { passive: true });
    session.addEventListener("touchcancel", clear, { passive: true });
    return () => {
      clear();
      session.removeEventListener("touchstart", startHold);
      session.removeEventListener("touchmove", moveHold);
      session.removeEventListener("touchend", clear);
      session.removeEventListener("touchcancel", clear);
    };
  }, [longPressEnabled]);

  /* The box's edge moves; nothing inside it does.
   *
   * The box takes its height from the Page in flow, so any change in height —
   * a Page arrived at, a section opened, past phases unfolded — was over before
   * it read as anything. Sai: "Fix the expend animation for all so that it
   * smoothly expend and with ease."
   *
   * So the change is played back: the box is animated from the height it had to
   * the height it now has, once, after the layout is already final. This is
   * safe in a way the old measured height was not. Nothing is laid out at an
   * interim size — a Page waiting at either side already keeps its own height,
   * so its content is where it belongs before the box ever moves. Only the
   * box's own edge travels: "the forehead and the main text all of the position
   * is still and already in placed, only it extend to the end of the app."
   *
   * A change smaller than a line of text is exempt. That is a textarea
   * following the caret, and animating it would leave the box behind the
   * typing. */
  useLayoutEffect(() => {
    const frame = windowRef.current;
    if (!frame || frameHeight || typeof ResizeObserver === "undefined") return;

    boxHeight.current = frame.getBoundingClientRect().height;
    const observer = new ResizeObserver(() => {
      if (dragging || settling) return;
      playGrowth(frame.getBoundingClientRect().height);
    });
    observer.observe(frame);
    return () => {
      observer.disconnect();
      growth.current?.cancel();
    };
  }, [dragging, frameHeight, settling]);

  /* The App Box is as tall as the Page in it, and nothing measures that.
   *
   * The height used to be read from the DOM and written back as an inline
   * pixel value, which meant the box could only learn its size after the Page
   * existed — so it stood at the outgoing Page's height, then corrected. Every
   * version of that correction was visible. Sai: "the app box expend then it
   * adjust to the real position. what should happen is, the forehead and the
   * main text all of the position is still and already in placed, only it
   * extend to the end of the app."
   *
   * The current Page is in normal flow, so the box is already exactly its
   * height with no height set at all: it arrives right, on the first frame,
   * and follows a textarea growing with no measurement in between. Only the
   * Pages either side are taken out of flow, and they are only there mid-swipe.
   */

  useEffect(
    () => () => {
      if (settleTimer.current) {
        window.clearTimeout(settleTimer.current);
      }
      if (commitFrame.current) {
        window.cancelAnimationFrame(commitFrame.current);
      }
      if (externalMotionTimer.current) {
        window.clearTimeout(externalMotionTimer.current);
      }
      if (blockedTimer.current) {
        window.clearTimeout(blockedTimer.current);
      }
      if (wheelTimer.current) {
        window.clearTimeout(wheelTimer.current);
      }
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }
    },
    [],
  );

  function showBoundaryCue() {
    if (blockedTimer.current) {
      window.clearTimeout(blockedTimer.current);
    }
    setShowingBlockedCue(false);
    window.requestAnimationFrame(() => {
      setShowingBlockedCue(true);
      blockedTimer.current = window.setTimeout(() => {
        setShowingBlockedCue(false);
        blockedTimer.current = null;
      }, 960);
    });
  }

  function moveToPosition(nextPosition: number) {
    const boundedPosition = Math.max(
      0,
      Math.min(allowedIndices.length - 1, nextPosition),
    );
    const boundedIndex = allowedIndices[boundedPosition];
    setDragX(0);
    setDragging(false);
    setSettling(false);
    if (boundedIndex === activeIndex) return;
    onIndexChange(boundedIndex);
  }

  function blocksSwipe(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    if (target.closest("select, a, [contenteditable='true']")) return true;
    const input = target.closest("input");
    if (!(input instanceof HTMLInputElement)) return false;
    return !["text", "search", "email", "tel", "url"].includes(input.type);
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (
      settling ||
      committing ||
      blocksSwipe(event.target)
    ) {
      return;
    }
    didSwipe.current = false;
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    longPressed.current = false;
    if (onLongPress) {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is an enhancement, not a requirement.
        }
      }
      longPressTimer.current = window.setTimeout(() => {
        if (longPressed.current) return;
        longPressed.current = true;
        longPressTimer.current = null;
        if ("vibrate" in navigator) navigator.vibrate(12);
        onLongPress();
      }, 960);
    }
  }

  function continueSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!pointerStart.current) return;
    const distanceX = event.clientX - pointerStart.current.x;
    const distanceY = event.clientY - pointerStart.current.y;
    if (Math.abs(distanceX) > 18 || Math.abs(distanceY) > 18) {
      if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (Math.abs(distanceX) < 6 || Math.abs(distanceX) <= Math.abs(distanceY)) {
      return;
    }
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic tests and older webviews may not expose pointer capture.
      }
    }
    event.preventDefault();
    didSwipe.current = true;
    const movingPastStart = previousIndex === undefined && distanceX > 0;
    const movingPastEnd = nextIndex === undefined && distanceX < 0;
    const resistance = movingPastStart || movingPastEnd ? 0 : 0.72;
    const width = windowRef.current?.clientWidth || 320;
    setDragging(true);
    setDragX(
      Math.max(-width * 0.92, Math.min(width * 0.92, distanceX * resistance)),
    );
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!pointerStart.current) return;
    const distance = event.clientX - pointerStart.current.x;
    if (event.currentTarget.hasPointerCapture(pointerStart.current.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(pointerStart.current.pointerId);
      } catch {
        // The pointer may already have been released by the browser.
      }
    }
    pointerStart.current = null;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    if (longPressed.current) {
      setDragX(0);
      setDragging(false);
      return;
    }
    if (Math.abs(distance) < 48) {
      setDragX(0);
      setDragging(false);
      return;
    }
    const targetIndex = distance < 0 ? nextIndex : previousIndex;
    if (targetIndex === undefined) {
      setDragX(0);
      setDragging(false);
      if (distance < 0 && onForwardBoundary) {
        onForwardBoundary();
        return;
      }
      if (distance > 0 && onBackwardBoundary) {
        onBackwardBoundary();
        return;
      }
      showBoundaryCue();
      return;
    }
    const width = windowRef.current?.clientWidth || 320;
    setDragging(false);
    setSettling(true);
    setDragX(distance < 0 ? -width : width);
    settleTimer.current = window.setTimeout(() => {
      // The adjacent page is already in its final visual position. Promote it
      // without replaying the horizontal transition on the reused current node.
      setCommitting(true);
      internalCommit.current = true;
      onIndexChange(targetIndex);
      setDragX(0);
      setSettling(false);
      settleTimer.current = null;
      commitFrame.current = window.requestAnimationFrame(() => {
        commitFrame.current = window.requestAnimationFrame(() => {
          setCommitting(false);
          commitFrame.current = null;
        });
      });
    }, 250);
  }

  function stopClickAfterSwipe(event: MouseEvent<HTMLDivElement>) {
    if (!didSwipe.current && !longPressed.current) return;
    event.preventDefault();
    event.stopPropagation();
    didSwipe.current = false;
    longPressed.current = false;
  }

  function useArrowKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (nextIndex === undefined) {
        if (onForwardBoundary) {
          onForwardBoundary();
          return;
        }
        showBoundaryCue();
        return;
      }
      moveToPosition(currentPosition + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (previousIndex === undefined) {
        if (onBackwardBoundary) {
          onBackwardBoundary();
          return;
        }
        showBoundaryCue();
        return;
      }
      moveToPosition(currentPosition - 1);
    }
  }

  function useTrackpadSwipe(event: WheelEvent<HTMLDivElement>) {
    if (
      settling ||
      committing ||
      event.ctrlKey ||
      blocksSwipe(event.target) ||
      Math.abs(event.deltaX) <= Math.abs(event.deltaY)
    ) {
      return;
    }
    event.preventDefault();
    wheelDistance.current += event.deltaX;
    if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => {
      wheelDistance.current = 0;
      wheelTimer.current = null;
    }, 160);
    if (Math.abs(wheelDistance.current) < 48) return;

    const movingForward = wheelDistance.current > 0;
    wheelDistance.current = 0;
    if (wheelTimer.current) {
      window.clearTimeout(wheelTimer.current);
      wheelTimer.current = null;
    }
    const targetIndex = movingForward ? nextIndex : previousIndex;
    if (targetIndex === undefined) {
      if (movingForward && onForwardBoundary) {
        onForwardBoundary();
        return;
      }
      if (!movingForward && onBackwardBoundary) {
        onBackwardBoundary();
        return;
      }
      showBoundaryCue();
      return;
    }
    moveToPosition(currentPosition + (movingForward ? 1 : -1));
  }

  return (
    <div
      aria-label={label}
      className={`os-swipe-session ${className}${
        showingBlockedCue ? " required-nudge" : ""
      }`.trim()}
      ref={sessionRef}
      onClickCapture={stopClickAfterSwipe}
      onContextMenu={(event) => {
        if (onLongPress) event.preventDefault();
      }}
      onKeyDown={useArrowKey}
      onWheel={useTrackpadSwipe}
      onPointerCancel={() => {
        pointerStart.current = null;
        if (settleTimer.current) {
          window.clearTimeout(settleTimer.current);
          settleTimer.current = null;
        }
        if (commitFrame.current) {
          window.cancelAnimationFrame(commitFrame.current);
          commitFrame.current = null;
        }
        if (blockedTimer.current) {
          window.clearTimeout(blockedTimer.current);
          blockedTimer.current = null;
        }
        if (wheelTimer.current) {
          window.clearTimeout(wheelTimer.current);
          wheelTimer.current = null;
        }
        if (longPressTimer.current) {
          window.clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        wheelDistance.current = 0;
        setShowingBlockedCue(false);
        setDragX(0);
        setDragging(false);
        setSettling(false);
        setCommitting(false);
      }}
      onPointerDown={startSwipe}
      onPointerMove={continueSwipe}
      onPointerUp={finishSwipe}
      tabIndex={0}
    >
      <div
        className={`os-app-window${
          frameHeight ? " fixed-height" : " fluid-height"
        }${
          attentionArmed ? " update-armed" : ""
        }${
          attentionShowing ? " update-arrival" : ""
        }`}
        ref={windowRef}
        style={frameHeight ? { height: frameHeight } : undefined}
      >
        {(dragging || settling) && previousIndex !== undefined ? (
          <div
            aria-hidden="true"
            className={`os-app-page adjacent previous${
              dragging ? " dragging" : ""
            }`}
            style={{ "--swipe-x": `${dragX}px` } as CSSProperties}
          >
            {apps[previousIndex]}
          </div>
        ) : null}
        <div
          className={`os-app-page current${
            dragging ? " dragging" : ""
          }${committing ? " committing" : ""}${
            externalMotion ? ` ${externalMotion}` : ""
          }`}
          ref={currentPageRef}
          style={{ "--swipe-x": `${dragX}px` } as CSSProperties}
        >
          {apps[activeIndex]}
        </div>
        {(dragging || settling) && nextIndex !== undefined ? (
          <div
            aria-hidden="true"
            className={`os-app-page adjacent next${
              dragging ? " dragging" : ""
            }`}
            style={{ "--swipe-x": `${dragX}px` } as CSSProperties}
          >
            {apps[nextIndex]}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SessionIntro({
  label,
  title,
  onBegin,
  theme = "light",
  detail,
  ready = true,
  refreshKey,
}: {
  label: string;
  title: string;
  onBegin: () => void;
  theme?: "light" | "orange" | "dark";
  detail?: string;
  ready?: boolean;
  refreshKey?: string;
}) {
  const lastRefreshKey = useRef(refreshKey);
  const [display, setDisplay] = useState({ title, detail });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!refreshKey || refreshKey === lastRefreshKey.current) {
      setDisplay({ title, detail });
      return;
    }
    lastRefreshKey.current = refreshKey;
    setRefreshing(true);
    const timer = window.setTimeout(() => {
      setDisplay({ title, detail });
      setRefreshing(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [detail, refreshKey, title]);

  return (
    <PageLayout
      className={`os-cover-page${refreshing ? " is-refreshing" : ""}`}
      theme={theme}
      variant="cover"
      footer={ready ? (
        <button type="button" onClick={onBegin} aria-label={`Begin ${label}`}>
          Swipe to begin
        </button>
      ) : (
        <span className="os-session-wait">Available tomorrow morning</span>
      )}
    >
      {/* A Cover is one line.
        *
        * It carried a second paragraph under the title, so the first thing an
        * App ever showed was a block of explanation. Sai: "all the cover pages,
        * including the one for Athena, they all must be just simple one liner.
        * not the paragraph." The authored body is still on the chapter and
        * still editable in the Workshop; it is simply not what a Cover is for.
        */}
      <div className="os-session-intro-copy">
        <div className="os-info-page-main">
          <h2>{display.title}</h2>
        </div>
      </div>
    </PageLayout>
  );
}

export function PageLayout({
  children,
  className = "",
  footer,
  heading,
  headerLeft,
  headerRight,
  theme = "light",
  placement = "balanced",
  variant = "app",
}: {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  heading?: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  theme?: "light" | "orange" | "dark";
  placement?: AppPagePlacement;
  variant?: "app" | "chapter" | "cover";
}) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const variantClass =
    variant === "app" ? "os-app-content-page" : `os-${variant}-page`;
  const placementClass = `os-placement-${placement}`;

  useLayoutEffect(() => {
    const page = pageRef.current;
    const body = bodyRef.current;
    if (!page || !body) return;
    const clearMeasurement = () => {
      delete body.dataset.osTextLayout;
      body.style.removeProperty("--os-measured-body-min-height");
      body.style.removeProperty("--os-measured-main-top");
    };
    if (placement === "content-flow") {
      clearMeasurement();
      return;
    }
    const main = body.querySelector<HTMLElement>(
      ".os-page-main, .os-info-page-main",
    );
    const mainText = placement === "identity-stack"
      ? body.querySelector<HTMLElement>("[data-os-app-heading]")
      : main?.querySelector<HTMLElement>(
          // An input belongs here too: the Week Page's Main text is the day's
          // name, which is written in place. Without it that Page fell out of
          // the measured layout entirely and stood where flow left it, so
          // arriving from the Log's day Page moved everything under the
          // forehead.
          "textarea, input, h1, h2, h3, p, [data-os-main-text]",
        );
    if (!main || !mainText) {
      clearMeasurement();
      return;
    }

    let active = true;
    let frame = 0;
    /* Where the Main text sits under the forehead.
     *
     * This used to be computed a frame after the Page was shown, so a Page you
     * swiped to was painted once with the Page before it still measured, and
     * the text under the forehead jumped as the new numbers landed. Sai: "The
     * forehead jolt issue is still there for log app." It is computed before
     * the browser paints now, so a Page arrives already laid out; the frame
     * below is kept for a webfont or a resize, which arrive later by nature. */
    const commit = () => {
      if (!active) return;
      const pageStyle = window.getComputedStyle(page);
      const textStyle = window.getComputedStyle(mainText);
      const minPageHeight = Number.parseFloat(pageStyle.minHeight);
      const lineHeight = Number.parseFloat(textStyle.lineHeight);
      if (!minPageHeight || !lineHeight) return;

      const header = page.querySelector<HTMLElement>(":scope > .os-page-header");
      const heading = page.querySelector<HTMLElement>(":scope > .os-page-heading");
      const footer = page.querySelector<HTMLElement>(":scope > .os-page-footer");
      const baseBodyHeight =
        minPageHeight -
        Number.parseFloat(pageStyle.paddingTop) -
        Number.parseFloat(pageStyle.paddingBottom) -
        (header?.getBoundingClientRect().height || 0) -
        (heading?.getBoundingClientRect().height || 0) -
        (footer?.getBoundingClientRect().height || 0);
      const opticalShift = Number.parseFloat(
        window.getComputedStyle(page).getPropertyValue("--os-body-optical-shift"),
      ) || 0;
      const metrics = pageTextLayout({
        baseBodyHeight,
        lineHeight,
        mainHeight:
          placement === "identity-stack"
            ? mainText.getBoundingClientRect().height
            : main.getBoundingClientRect().height,
        opticalShift,
      });

      body.dataset.osTextLayout = "measured";
      body.style.setProperty(
        "--os-measured-body-min-height",
        `${metrics.bodyMinHeight}px`,
      );
      body.style.setProperty("--os-measured-main-top", `${metrics.mainTop}px`);
    };
    const measure = () => {
      if (!active) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(commit);
    };

    window.addEventListener("resize", measure);
    commit();
    void document.fonts.ready.then(measure);

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [children, footer, heading, headerLeft, headerRight, placement]);

  return (
    <div
      className={`os-page-layout ${variantClass} ${placementClass} os-session-intro theme-${theme} ${className}`.trim()}
      data-os-placement={placement}
      ref={pageRef}
    >
      <div className="os-page-header">
        <div className="os-page-header-left">{headerLeft}</div>
        <div className="os-page-header-right">{headerRight}</div>
      </div>
      <div className="os-page-heading">{heading}</div>
      <div className="os-page-body" ref={bodyRef}>{children}</div>
      <div className="os-page-footer">
        {footer ?? <span aria-hidden="true" className="os-info-page-spacer" />}
      </div>
    </div>
  );
}

export function InfoPage({
  children,
  className = "",
  footer,
  header,
  headerAction,
  heading,
  theme = "light",
}: {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  header?: ReactNode;
  /** The Page's optional right-hand app action, per the Header rule. */
  headerAction?: ReactNode;
  heading?: ReactNode;
  theme?: "light" | "orange" | "dark";
}) {
  return (
    <PageLayout
      className={`os-info-page ${className}`.trim()}
      footer={footer}
      headerLeft={header}
      headerRight={headerAction}
      heading={heading}
      theme={theme}
      variant="app"
    >
      {children}
    </PageLayout>
  );
}
