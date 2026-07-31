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

const seenAttentionKeys = new Set<string>();

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
  attentionKey,
  attentionIndex = 0,
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
  attentionKey?: string;
  attentionIndex?: number;
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
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const longPressCallback = useRef(onLongPress);
  const longPressEnabled = Boolean(onLongPress);

  useEffect(() => {
    longPressCallback.current = onLongPress;
  }, [onLongPress]);

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
      timer = window.setTimeout(() => setShowingAttentionKey(""), 2400);
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
        reveal();
      },
      { threshold: 0.45 },
    );
    observer.observe(session);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [activeIndex, attentionIndex, attentionKey]);

  useLayoutEffect(() => {
    const previousIndex = previousActiveIndex.current;
    if (previousIndex === activeIndex) return;
    previousActiveIndex.current = activeIndex;
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

  useLayoutEffect(() => {
    if (frameHeight || !currentPageRef.current) return;

    const page = currentPageRef.current;
    const measure = () => {
      const nextHeight = Math.ceil(page.scrollHeight);
      if (nextHeight <= 0) return;
      setContentHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(page);
    return () => observer.disconnect();
  }, [activeIndex, frameHeight]);

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
      attentionArmed ||
      attentionShowing ||
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
        showBoundaryCue();
        return;
      }
      moveToPosition(currentPosition + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (previousIndex === undefined) {
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
      attentionArmed ||
      attentionShowing ||
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
        }${attentionArmed ? " update-armed" : ""}${
          attentionShowing ? " update-arrival" : ""
        }`}
        ref={windowRef}
        style={
          frameHeight
            ? { height: frameHeight }
            : contentHeight
              ? { height: `${contentHeight}px` }
              : undefined
        }
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
    }, 600);
    return () => window.clearTimeout(timer);
  }, [detail, refreshKey, title]);

  return (
    <InfoPage
      className={refreshing ? "is-refreshing" : ""}
      label={<p className="os-card-label">{label}</p>}
      theme={theme}
      footer={ready ? (
        <button type="button" onClick={onBegin} aria-label={`Begin ${label}`}>
          Swipe to begin
        </button>
      ) : (
        <span className="os-session-wait">Available tomorrow morning</span>
      )}
    >
      <div className="os-session-intro-copy">
        <h2>{display.title}</h2>
        {display.detail ? <p className="os-session-detail">{display.detail}</p> : null}
      </div>
    </InfoPage>
  );
}

export function InfoPage({
  children,
  className = "",
  footer,
  label,
  theme = "light",
}: {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  label: ReactNode;
  theme?: "light" | "orange" | "dark";
}) {
  return (
    <div className={`os-info-page os-session-intro theme-${theme} ${className}`.trim()}>
      {label}
      {children}
      {footer ?? <span aria-hidden="true" className="os-info-page-spacer" />}
    </div>
  );
}
