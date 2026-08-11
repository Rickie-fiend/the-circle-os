"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  BUTTON_STYLE_DEFINITIONS,
  buttonPressesToBreak,
  canActivateButton,
  isButtonBroken,
  nextButtonDamage,
  normalizeButtonStyleId,
  reduceButtonLifecycle,
  type ButtonLifecycle,
} from "./button-engine-model.js";

// Fracture lines drawn over a breaking button, grouped by the strike that
// opens them. They run in the 100x52 space of the button and are deliberately
// jagged and branching: a straight line reads as a scratch, not a crack.
const CRACK_STAGES: readonly (readonly string[])[] = [
  [
    "M50 26 L41 19 L33 10 L27 2",
    "M50 26 L60 32 L69 41 L74 51",
  ],
  [
    "M50 26 L63 22 L75 16 L88 9",
    "M50 26 L38 33 L27 39 L14 47",
    "M33 10 L28 12",
  ],
  [
    "M50 26 L49 14 L53 6 L50 0",
    "M50 26 L52 38 L48 45 L51 52",
    "M75 16 L79 12",
    "M27 39 L23 43",
  ],
];

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
  role?: "thought" | "habit";
  keepMountedOnSuccess?: boolean;
  onAnimationComplete?: () => void;
  onSuccessComplete?: () => void;
  previewMode?: boolean;
};

export function ButtonRewardBackdrop({
  active,
  staticPreview = false,
  styleId,
}: {
  active: boolean;
  staticPreview?: boolean;
  styleId: string;
}) {
  const resolvedStyleId = normalizeButtonStyleId(styleId) || "default";
  return (
    <span
      aria-hidden="true"
      className={`os-button-reward-backdrop reward-${resolvedStyleId}${staticPreview ? " static-preview" : ""}${active ? " active" : ""}`}
    >
      <i /><i /><i /><i />
    </span>
  );
}

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
  keepMountedOnSuccess = false,
  onAnimationComplete,
  onClick,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  onSuccessComplete,
  previewMode = false,
  role = "thought",
  styleId,
  ...props
}: CreativeButtonProps) {
  const resolvedStyleId = normalizeButtonStyleId(styleId);
  const definition = resolvedStyleId
    ? BUTTON_STYLE_DEFINITIONS[resolvedStyleId]
    : null;
  const [lifecycle, dispatch] = useReducer(
    reduceButtonLifecycle,
    (previewMode ? "ready" : "hidden") as ButtonLifecycle,
  );
  const committedRef = useRef(false);
  const completionRef = useRef(onAnimationComplete);
  const successCompletionRef = useRef(onSuccessComplete);
  const pressesToBreak = buttonPressesToBreak(resolvedStyleId);
  const [damage, setDamage] = useState(0);

  useEffect(() => {
    completionRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    successCompletionRef.current = onSuccessComplete;
  }, [onSuccessComplete]);

  useEffect(() => {
    if (!previewMode) dispatch("reveal");
  }, [previewMode]);

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
        () => {
          successCompletionRef.current?.();
          if (previewMode || role === "habit") {
            committedRef.current = false;
            dispatch("preview-reset");
          } else if (!keepMountedOnSuccess) {
            dispatch("success-complete");
          }
        },
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
  }, [keepMountedOnSuccess, lifecycle, previewMode, role]);

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
      className={`os-creative-button-shell role-${role} ${styleClass} phase-${lifecycle}`}
      data-button-damage={pressesToBreak > 1 ? damage : undefined}
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
        className={`${role === "thought" ? "os-thoughts-send " : ""}os-creative-button ${className}`.trim()}
        disabled={disabled}
        onClick={(event) => {
          if (!canActivateButton({ disabled, committed: committedRef.current })) {
            event.preventDefault();
            return;
          }
          // A breaking style takes several presses. Each one fractures it a
          // little more and does nothing else; only the press that finishes it
          // commits, so the breaking and the action are the same moment.
          if (pressesToBreak > 1) {
            const struck = nextButtonDamage(damage, pressesToBreak);
            setDamage(struck);
            if (!isButtonBroken(struck, pressesToBreak)) {
              if (definition) runHaptic(definition.haptic.slice(0, 1));
              event.preventDefault();
              return;
            }
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
        {pressesToBreak > 1 ? (
          <svg
            aria-hidden="true"
            className="os-crack-web"
            preserveAspectRatio="none"
            viewBox="0 0 100 52"
          >
            {CRACK_STAGES.map((paths, stage) => (
              <g className="os-crack-stage" data-stage={stage + 1} key={stage}>
                {paths.map((d) => (
                  <path d={d} key={d} vectorEffect="non-scaling-stroke" />
                ))}
              </g>
            ))}
          </svg>
        ) : null}
        <span className="os-creative-button-label">{children}</span>
      </button>
    </div>
  );
}
