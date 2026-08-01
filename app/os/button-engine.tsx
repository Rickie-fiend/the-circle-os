"use client";

import {
  useEffect,
  useReducer,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  BUTTON_STYLE_DEFINITIONS,
  canActivateButton,
  normalizeButtonStyleId,
  reduceButtonLifecycle,
  type ButtonLifecycle,
} from "./button-engine-model.js";

const INK_PARTICLES = [
  [-58, -22, 8, "ink"],
  [-42, 20, 6, "orange"],
  [-20, -31, 5, "bone"],
  [4, -36, 7, "orange"],
  [26, -27, 5, "bone"],
  [51, -16, 8, "ink"],
  [57, 20, 6, "orange"],
  [31, 31, 7, "ink"],
  [2, 37, 5, "orange"],
  [-31, 32, 7, "ink"],
] as const;

type CreativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  styleId: string;
  onAnimationComplete?: () => void;
};

function runHaptic(pattern: readonly number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate([...pattern]);
  } catch {
    // Haptics are a progressive enhancement.
  }
}

export function CreativeButton({
  children,
  className = "",
  disabled = false,
  onAnimationComplete,
  onClick,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  styleId,
  ...props
}: CreativeButtonProps) {
  const resolvedStyleId = normalizeButtonStyleId(styleId);
  const definition = resolvedStyleId
    ? BUTTON_STYLE_DEFINITIONS[resolvedStyleId]
    : null;
  const [lifecycle, dispatch] = useReducer(
    reduceButtonLifecycle,
    "hidden" as ButtonLifecycle,
  );
  const committedRef = useRef(false);
  const completionRef = useRef(onAnimationComplete);

  useEffect(() => {
    completionRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    dispatch("reveal");
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (lifecycle === "entering") {
      timer = window.setTimeout(
        () => dispatch("entry-complete"),
        reducedMotion ? 40 : 620,
      );
    } else if (lifecycle === "success") {
      timer = window.setTimeout(
        () => dispatch("success-complete"),
        reducedMotion ? 160 : 640,
      );
    } else if (lifecycle === "exiting") {
      timer = window.setTimeout(() => {
        dispatch("exit-complete");
        completionRef.current?.();
      }, reducedMotion ? 40 : 140);
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [lifecycle]);

  function press(event: PointerEvent<HTMLButtonElement>) {
    onPointerDown?.(event);
    if (event.defaultPrevented || !canActivateButton({ disabled })) return;
    dispatch("press");
    if (definition) runHaptic(definition.haptic.slice(0, 1));
  }

  function release(
    event: PointerEvent<HTMLButtonElement>,
    callback?: (event: PointerEvent<HTMLButtonElement>) => void,
  ) {
    callback?.(event);
    dispatch("release");
  }

  const styleClass = resolvedStyleId
    ? `style-${resolvedStyleId}`
    : "style-fallback";

  return (
    <div
      className={`os-creative-button-shell ${styleClass} phase-${lifecycle}`}
      data-button-lifecycle={lifecycle}
      data-button-style={resolvedStyleId || "fallback"}
    >
      {resolvedStyleId === "ink-burst" ? (
        <span aria-hidden="true" className="os-ink-particles">
          {INK_PARTICLES.map(([x, y, size, color], index) => (
            <span
              className={`os-ink-particle color-${color}`}
              key={`${x}-${y}`}
              style={
                {
                  "--particle-delay": `${index * 24}ms`,
                  "--particle-size": `${size}px`,
                  "--particle-x": `${x}px`,
                  "--particle-y": `${y}px`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      ) : null}
      <button
        {...props}
        aria-busy={lifecycle === "success" || lifecycle === "exiting"}
        className={`os-thoughts-send os-creative-button ${className}`.trim()}
        disabled={disabled}
        onClick={(event) => {
          if (!canActivateButton({ disabled, committed: committedRef.current })) {
            event.preventDefault();
            return;
          }
          committedRef.current = true;
          dispatch("succeed");
          if (definition) runHaptic(definition.haptic);
          onClick?.(event);
        }}
        onPointerCancel={(event) => release(event, onPointerCancel)}
        onPointerDown={press}
        onPointerLeave={(event) => release(event, onPointerLeave)}
        onPointerUp={(event) => release(event, onPointerUp)}
      >
        {resolvedStyleId === "liquid-capsule" ? (
          <span aria-hidden="true" className="os-liquid-sweep" />
        ) : null}
        <span className="os-creative-button-label">{children}</span>
      </button>
    </div>
  );
}
