"use client";

import {
  Children,
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
}: {
  children: ReactNode;
  index: number;
  maxIndex?: number;
  onIndexChange: (index: number) => void;
  className?: string;
  label: string;
}) {
  const apps = Children.toArray(children);
  const lastIndex = Math.min(
    apps.length - 1,
    maxIndex ?? Math.max(0, apps.length - 1),
  );
  const pointerStart = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const didSwipe = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [motionDirection, setMotionDirection] = useState<
    "none" | "next" | "previous"
  >("none");

  function move(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(lastIndex, nextIndex));
    setDragX(0);
    setDragging(false);
    if (boundedIndex === index) return;
    setMotionDirection(boundedIndex > index ? "next" : "previous");
    onIndexChange(boundedIndex);
  }

  function blocksSwipe(target: EventTarget | null) {
    return target instanceof Element
      ? Boolean(target.closest("input, textarea, select, a"))
      : false;
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (blocksSwipe(event.target)) return;
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
    const movingPastStart = index === 0 && distanceX > 0;
    const movingPastEnd = index === lastIndex && distanceX < 0;
    const resistance = movingPastStart || movingPastEnd ? 0.16 : 0.72;
    setDragging(true);
    setDragX(Math.max(-96, Math.min(96, distanceX * resistance)));
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
    move(distance < 0 ? index + 1 : index - 1);
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
      move(index + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(index - 1);
    }
  }

  return (
    <div
      aria-label={label}
      className={`os-swipe-session ${className}`.trim()}
      onClickCapture={stopClickAfterSwipe}
      onKeyDown={useArrowKey}
      onPointerCancel={() => {
        pointerStart.current = null;
        setDragX(0);
        setDragging(false);
      }}
      onPointerDown={startSwipe}
      onPointerMove={continueSwipe}
      onPointerUp={finishSwipe}
      tabIndex={0}
    >
      <div className="os-app-window">
        {dragging && index > 0 ? (
          <div
            aria-hidden="true"
            className="os-app-page adjacent previous"
            style={{ "--swipe-x": `${dragX}px` } as CSSProperties}
          >
            {apps[index - 1]}
          </div>
        ) : null}
        <div
          className={`os-app-page current motion-${motionDirection}${
            dragging ? " dragging" : ""
          }`}
          key={index}
          style={{ "--swipe-x": `${dragX}px` } as CSSProperties}
        >
          {apps[index]}
        </div>
        {dragging && index < lastIndex ? (
          <div
            aria-hidden="true"
            className="os-app-page adjacent next"
            style={{ "--swipe-x": `${dragX}px` } as CSSProperties}
          >
            {apps[index + 1]}
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
}: {
  label: string;
  title: string;
  onBegin: () => void;
  theme?: "light" | "orange" | "dark";
  detail?: string;
  ready?: boolean;
}) {
  return (
    <div className={`os-session-intro theme-${theme}`}>
      <p className="os-card-label">{label}</p>
      <h2>{title}</h2>
      {detail ? <p className="os-session-detail">{detail}</p> : null}
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
