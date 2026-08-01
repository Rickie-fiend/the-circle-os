export const BUTTON_STYLE_IDS = Object.freeze([
  "default",
  "ink-burst",
  "soft-clay",
  "liquid-capsule",
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
});

export function normalizeButtonStyleId(value) {
  return BUTTON_STYLE_IDS.includes(value) ? value : null;
}

function randomIndex(random, length) {
  const value = Number(random());
  if (!Number.isFinite(value)) return 0;
  return Math.min(length - 1, Math.max(0, Math.floor(value * length)));
}

export function shuffleButtonStyles(random = Math.random) {
  const styles = [...BUTTON_STYLE_IDS];
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
    case "exit-complete":
      return state === "exiting" ? "hidden" : state;
    default:
      return state;
  }
}

export function canActivateButton({ disabled = false, committed = false } = {}) {
  return !disabled && !committed;
}
