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
} from "react";

export function SwipeSession({
  children,
  index,
  maxIndex,
  onIndexChange,
  className = "",
  label,
  availableIndices,
  frameHeight,
  blockedForward = false,
}: {
  children: ReactNode;
  index: number;
  maxIndex?: number;
  onIndexChange: (index: number) => void;
  className?: string;
  label: string;
  availableIndices?: number[];
  frameHeight?: CSSProperties["height"];
  blockedForward?: boolean;
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
  const windowRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef<HTMLDivElement | null>(null);
  const settleTimer = useRef<number | null>(null);
  const blockedTimer = useRef<number | null>(null);
  const commitFrame = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [showingBlockedCue, setShowingBlockedCue] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

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
      if (blockedTimer.current) {
        window.clearTimeout(blockedTimer.current);
      }
    },
    [],
  );

  function showBlockedForwardCue() {
    if (!blockedForward) return;
    if (blockedTimer.current) {
      window.clearTimeout(blockedTimer.current);
    }
    setShowingBlockedCue(false);
    window.requestAnimationFrame(() => {
      setShowingBlockedCue(true);
      blockedTimer.current = window.setTimeout(() => {
        setShowingBlockedCue(false);
        blockedTimer.current = null;
      }, 520);
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
    return target instanceof Element
      ? Boolean(target.closest("input, select, a, [contenteditable='true']"))
      : false;
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (settling || committing || blocksSwipe(event.target)) return;
    didSwipe.current = false;
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  }

  function continueSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!pointerStart.current) return;
    const distanceX = event.clientX - pointerStart.current.x;
    const distanceY = event.clientY - pointerStart.current.y;
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
    if (Math.abs(distance) < 48) {
      setDragX(0);
      setDragging(false);
      return;
    }
    const targetIndex = distance < 0 ? nextIndex : previousIndex;
    if (targetIndex === undefined) {
      setDragX(0);
      setDragging(false);
      if (distance < 0) showBlockedForwardCue();
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
    if (!didSwipe.current) return;
    event.preventDefault();
    event.stopPropagation();
    didSwipe.current = false;
  }

  function useArrowKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (nextIndex === undefined) {
        showBlockedForwardCue();
        return;
      }
      moveToPosition(currentPosition + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveToPosition(currentPosition - 1);
    }
  }

  return (
    <div
      aria-label={label}
      className={`os-swipe-session ${className}${
        showingBlockedCue ? " required-nudge" : ""
      }`.trim()}
      onClickCapture={stopClickAfterSwipe}
      onKeyDown={useArrowKey}
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
          }${committing ? " committing" : ""}`}
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
    }, 180);
    return () => window.clearTimeout(timer);
  }, [detail, refreshKey, title]);

  return (
    <div className={`os-session-intro theme-${theme}${
      refreshing ? " is-refreshing" : ""
    }`}>
      <p className="os-card-label">{label}</p>
      <h2>{display.title}</h2>
      {display.detail ? <p className="os-session-detail">{display.detail}</p> : null}
      {ready ? (
        <button type="button" onClick={onBegin} aria-label={`Begin ${label}`}>
          Swipe to begin
        </button>
      ) : (
        <span className="os-session-wait">Available tomorrow morning</span>
      )}
    </div>
  );
}
