export const BUTTON_STYLE_IDS = Object.freeze([
  "default",
  "ink-burst",
  "soft-clay",
  "liquid-capsule",
  "fractured-glass",
]);

export const BUTTON_STYLE_DEFINITIONS = Object.freeze({
  default: Object.freeze({
    id: "default",
    name: "Default",
    world: "circle",
    tags: Object.freeze(["quiet", "press", "fade"]),
    haptic: Object.freeze([8]),
  }),
  "ink-burst": Object.freeze({
    id: "ink-burst",
    name: "Ink Burst",
    world: "paper",
    tags: Object.freeze(["gather", "press", "burst"]),
    haptic: Object.freeze([8, 18, 12]),
  }),
  "soft-clay": Object.freeze({
    id: "soft-clay",
    name: "Soft Clay",
    world: "toy",
    tags: Object.freeze(["rise", "depth", "compress"]),
    haptic: Object.freeze([14]),
  }),
  "liquid-capsule": Object.freeze({
    id: "liquid-capsule",
    name: "Liquid Capsule",
    world: "liquid",
    tags: Object.freeze(["draw", "ripple", "morph"]),
    haptic: Object.freeze([6, 28, 8]),
  }),
  // The only style that does not act on the first press. Each tap fractures it
  // further and the last one breaks it, so the action costs a little effort and
  // the breaking becomes the moment rather than a decoration on top of it.
  "fractured-glass": Object.freeze({
    id: "fractured-glass",
    name: "Fractured Glass",
    world: "glass",
    tags: Object.freeze(["strike", "fracture", "shatter"]),
    haptic: Object.freeze([9, 26, 12]),
    pressesToBreak: 4,
  }),
});

export function normalizeButtonStyleId(value) {
  return BUTTON_STYLE_IDS.includes(value) ? value : null;
}

function randomIndex(random, length) {
  const value = Number(random());
  if (!Number.isFinite(value)) return 0;
  return Math.min(length - 1, Math.max(0, Math.floor(value * length)));
}

// Styles that appear in the everyday rotation. Fractured Glass is deliberately
// absent: it is chosen for a moment that has earned it, never dealt at random,
// because a button that must be broken four times is not a neutral default.
export const BUTTON_ROTATION_STYLE_IDS = Object.freeze(
  BUTTON_STYLE_IDS.filter((id) => id !== "fractured-glass"),
);

export function shuffleButtonStyles(random = Math.random) {
  const styles = [...BUTTON_ROTATION_STYLE_IDS];
  for (let index = styles.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(random, index + 1);
    [styles[index], styles[swapIndex]] = [styles[swapIndex], styles[index]];
  }
  return styles;
}

export function takeNextButtonStyle(
  queue = [],
  previousStyleId = null,
  random = Math.random,
) {
  const safeQueue = queue.filter(
    (styleId, index, values) =>
      normalizeButtonStyleId(styleId) && values.indexOf(styleId) === index,
  );
  const nextQueue = safeQueue.length ? [...safeQueue] : shuffleButtonStyles(random);

  if (
    nextQueue.length > 1 &&
    previousStyleId &&
    nextQueue[0] === previousStyleId
  ) {
    [nextQueue[0], nextQueue[1]] = [nextQueue[1], nextQueue[0]];
  }

  const [styleId, ...remaining] = nextQueue;
  return { styleId, queue: remaining };
}

export function revealButtonStyle(
  currentStyleId = null,
  queue = [],
  previousStyleId = null,
  random = Math.random,
) {
  const current = normalizeButtonStyleId(currentStyleId);
  return current
    ? { styleId: current, queue: [...queue] }
    : takeNextButtonStyle(queue, previousStyleId, random);
}

export function reduceButtonLifecycle(state, event) {
  switch (event) {
    case "reveal":
      return state === "hidden" ? "entering" : state;
    case "entry-complete":
      return state === "entering" ? "ready" : state;
    case "press":
      return state === "ready" ? "pressed" : state;
    case "release":
      return state === "pressed" ? "ready" : state;
    case "succeed":
      return state === "ready" || state === "pressed" ? "success" : state;
    case "success-complete":
      return state === "success" ? "exiting" : state;
    case "preview-reset":
      return state === "success" ? "ready" : state;
    case "exit-complete":
      return state === "exiting" ? "hidden" : state;
    default:
      return state;
  }
}

export function canActivateButton({ disabled = false, committed = false } = {}) {
  return !disabled && !committed;
}

// How many presses a style needs before it commits. Every style answers 1
// except the ones that break, so callers never special-case a style id.
export function buttonPressesToBreak(styleId) {
  const id = normalizeButtonStyleId(styleId);
  const presses = id ? BUTTON_STYLE_DEFINITIONS[id].pressesToBreak : 1;
  return Number.isInteger(presses) && presses > 1 ? presses : 1;
}

function safeDamage(value) {
  const damage = Math.floor(Number(value));
  return Number.isFinite(damage) && damage > 0 ? damage : 0;
}

// One press worth of damage, never past the point where the button is gone.
export function nextButtonDamage(damage = 0, pressesToBreak = 1) {
  const limit = Number.isInteger(pressesToBreak) && pressesToBreak > 1 ? pressesToBreak : 1;
  return Math.min(limit, safeDamage(damage) + 1);
}

export function isButtonBroken(damage = 0, pressesToBreak = 1) {
  const limit = Number.isInteger(pressesToBreak) && pressesToBreak > 1 ? pressesToBreak : 1;
  return safeDamage(damage) >= limit;
}
