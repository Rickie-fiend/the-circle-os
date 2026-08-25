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

/**
 * The shape of one press, in milliseconds.
 *
 * `MIN_PRESS_MS` is the floor on how long a key is held down. A quick tap and a
 * deliberate hold have to feel like the same object, and without a floor a fast
 * tap never renders the down state at all — the key appears not to move. Sai:
 * "this click should be snappy and satisfying to click, in all conditions
 * either quick click or hold and release."
 *
 * `REGISTER_MS` is the beat between the release and the action firing. The
 * press finishes as a movement before anything happens because of it, which is
 * what makes it read as an act rather than a side effect of touching glass.
 */
const MIN_PRESS_MS = 55;
const REGISTER_MS = 70;

/**
 * How long a committed key waits before it is done being committed.
 *
 * This was 640ms, sized for the release animations that no longer exist. It is
 * the beat a toggle spends between registering and letting its own state own
 * the way it looks, so it has to be short enough that nothing is seen waiting.
 */
const SETTLE_MS = 240;

/**
 * What a key does when the finger lifts.
 *
 * `rebound` comes back up and then registers — the ordinary action, where the
 * button is still there afterwards to be pressed again.
 *
 * `latch` stays down, because what replaces it is also down: a ticked habit, a
 * kept term, a spent Send. Sai on Send: "it should not be up because it would
 * change to flat disable send button, and it should not flinch on key release."
 */
export type ButtonRelease = "rebound" | "latch";

type CreativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  styleId: string;
  role?: "thought" | "habit";
  release?: ButtonRelease;
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
  release = "rebound",
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
  const awaitingClick = useRef(false);
  const releaseGuard = useRef<number | undefined>(undefined);
  const pressStartedAt = useRef(0);
  const lifted = useRef(false);
  const registerTimer = useRef<number | undefined>(undefined);
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

  useEffect(
    () => () => {
      if (releaseGuard.current !== undefined) {
        window.clearTimeout(releaseGuard.current);
      }
      if (registerTimer.current !== undefined) {
        window.clearTimeout(registerTimer.current);
      }
    },
    [],
  );

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
          // A button that stays on the Page returns to ready. It used to be
          // stranded in `success` instead — still mounted, but `committedRef`
          // never cleared, so it could not be pressed again and the only way
          // out was for its owner to unmount it. That is what made Send
          // disappear after a thought was sent rather than settling back into
          // its resting state.
          if (previewMode || role === "habit" || keepMountedOnSuccess) {
            committedRef.current = false;
            dispatch("preview-reset");
          } else {
            dispatch("success-complete");
          }
        },
        reducedMotion ? 60 : SETTLE_MS,
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
    awaitingClick.current = true;
    lifted.current = false;
    // Read once, on a real press. Never during render.
    pressStartedAt.current = Date.now();
    dispatch("press");
    if (definition) runHaptic(definition.haptic.slice(0, 1));
  }

  // Lifting the finger.
  //
  // The key has been down for at least `MIN_PRESS_MS` by the time anything
  // happens here, so a tap too fast to render still shows the press. What
  // happens next is the style of the key: a `rebound` comes back up and waits
  // to register, a `latch` stays exactly where the finger left it.
  //
  // Neither one registers here. `pointerup` lands before `click`, and the
  // browser drops `:active` at the same moment, so anything decided on the lift
  // alone shows for one render and is then overruled — which is what used to
  // make the key flinch. The click registers; the lift only positions.
  function lift(
    event: PointerEvent<HTMLButtonElement>,
    callback?: (event: PointerEvent<HTMLButtonElement>) => void,
  ) {
    callback?.(event);
    if (!awaitingClick.current) return;
    lifted.current = true;
    if (releaseGuard.current !== undefined) {
      window.clearTimeout(releaseGuard.current);
    }
    const held = Date.now() - pressStartedAt.current;
    const settle = Math.max(0, MIN_PRESS_MS - held);
    releaseGuard.current = window.setTimeout(() => {
      // A latch is already where it belongs; a rebound comes up.
      if (release === "rebound") dispatch("release");
      // Either way, a press whose click never arrives — a swipe that began on
      // a button — must not leave a key stuck down.
      releaseGuard.current = window.setTimeout(() => {
        releaseGuard.current = undefined;
        if (!awaitingClick.current) return;
        awaitingClick.current = false;
        dispatch("release");
      }, 400);
    }, settle);
  }

  // Aborting a press: the finger left the key before committing to it, or the
  // gesture was taken away. Nothing will be registered, so the key comes
  // straight up.
  //
  // `pointerleave` needs care here, and getting it wrong is what made every
  // engine button bounce on a phone. A touch pointer stops existing the moment
  // it lifts, so the browser fires `pointerleave` immediately after
  // `pointerup` — not because the finger slid off the key, but as teardown.
  // Treating that as an abort put the key back up in the gap before the click,
  // and the click then pulled it down again: pressed, up, pressed. It never
  // showed on a mouse, where leave only fires when the cursor actually leaves,
  // and never in a synthetic test, which does not fire leave at all.
  //
  // A lift has already happened by then, so that is the thing to check.
  function abort(
    event: PointerEvent<HTMLButtonElement>,
    callback?: (event: PointerEvent<HTMLButtonElement>) => void,
  ) {
    callback?.(event);
    if (lifted.current) return;
    awaitingClick.current = false;
    dispatch("release");
  }

  const styleClass = resolvedStyleId
    ? `style-${resolvedStyleId}`
    : "style-fallback";

  return (
    <div
      className={`os-creative-button-shell role-${role} ${styleClass} phase-${lifecycle}`}
      data-button-release={release}
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
          // The click is what the held-down key was waiting for. Whatever it
          // decides below, the press is over and its guard stops running.
          awaitingClick.current = false;
          if (releaseGuard.current !== undefined) {
            window.clearTimeout(releaseGuard.current);
            releaseGuard.current = undefined;
          }
          if (!canActivateButton({ disabled, committed: committedRef.current })) {
            event.preventDefault();
            dispatch("release");
            return;
          }
          // A breaking style takes several presses. Each one fractures it a
          // little more and does nothing else; only the press that finishes it
          // commits, so the breaking and the action are the same moment. A
          // strike that does not finish it comes back up, ready for the next.
          if (pressesToBreak > 1) {
            const struck = nextButtonDamage(damage, pressesToBreak);
            setDamage(struck);
            if (!isButtonBroken(struck, pressesToBreak)) {
              if (definition) runHaptic(definition.haptic.slice(0, 1));
              event.preventDefault();
              dispatch("release");
              return;
            }
          }
          // The press registers a beat after it finishes, not inside the
          // release. Sai: "split sec delay > register ... this click should be
          // snappy and satisfying to click." The native default is cancelled
          // and replayed at the end of that beat, so a submit button still
          // submits — just once the key has finished moving.
          committedRef.current = true;
          event.preventDefault();
          const button = event.currentTarget;
          const submits = button.type === "submit";
          const owner = submits
            ? (button.form ??
              (button.getAttribute("form")
                ? (document.getElementById(button.getAttribute("form")!) as HTMLFormElement | null)
                : null))
            : null;
          if (registerTimer.current !== undefined) {
            window.clearTimeout(registerTimer.current);
          }
          registerTimer.current = window.setTimeout(() => {
            registerTimer.current = undefined;
            dispatch("succeed");
            if (definition) runHaptic(definition.haptic);
            onClick?.(event);
            owner?.requestSubmit();
          }, REGISTER_MS);
        }}
        onPointerCancel={(event) => abort(event, onPointerCancel)}
        onPointerDown={press}
        onPointerLeave={(event) => abort(event, onPointerLeave)}
        onPointerUp={(event) => lift(event, onPointerUp)}
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
