// Versioned drawing recipes contain geometry only, never the original answers.
import { createFoldRecipe } from "./imprint-folds.js";
export const IMPRINT_AREAS = Object.freeze(["starting", "notes", "thoughts", "routine", "log-week", "protocol"]);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}

/** Caller supplies reviewed onboarding fields only. Feeling is explicitly excluded. */
function onboardingRandom({ name, birthday, answers }) {
  const eligibleAnswers = Object.fromEntries(Object.entries(answers || {}).filter(([key]) => key !== "feeling"));
  const source = JSON.stringify(canonical({ name, birthday, answers: eligibleAnswers }));
  let hash = 2166136261;
  for (const character of source) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  return () => {
    hash += 0x6D2B79F5;
    let n = Math.imul(hash ^ hash >>> 15, hash | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

export function createImprintRecipe(input) {
  return Object.freeze(createFoldRecipe(onboardingRandom(input)));
}

/** Retained generator for the already-reviewed version-two recipe format. */
export function createThreadRecipe(input) {
  const random = onboardingRandom(input);
  const variation = { phase: random() * 6.283, bend: random() * 6.283,
    turns: 1.4 + random() * .7, spread: 75 + random() * 35,
    twist: 2.6 + random() * 1.2, fullness: 70 + random() * 30 };
  const scaleX = .82 + random() * .14;
  const scaleY = .86 + random() * .1;
  const flip = random() > .5 ? 1 : -1;
  const transform = ([x, y]) => [
    260 + flip * ((x - 260) * scaleX + 13 * Math.sin(y / 130 + variation.phase)),
    400 + (y - 400) * scaleY + 9 * Math.sin(x / 170 + variation.bend),
  ];
  // Store the actual accepted control points. Later generator changes must not
  // reinterpret a saved recipe. Layer order is part of this drawing recipe.
  const outer = smoothControls(STREAM_OUTER.map(transform));
  const inner = smoothControls(STREAM_INNER.map(transform));
  const bundles = STREAM_AREAS.map((area, index) => ({
    area,
    outer: outer.slice(index * 3, index * 3 + 4),
    inner: inner.slice(index * 3, index * 3 + 4),
    light: .9 + random() * .1,
    lightPhase: index * .8,
    accent: .28 + random() * .35,
  }));
  const foldOuter = smoothControls([[260,450],[125,470],[150,560],[290,580],[430,600],[420,705],[270,730]].map(transform));
  const foldInner = smoothControls([[260,450],[260,540],[220,550],[240,570],[270,610],[270,695],[270,730]].map(transform));
  bundles.push({ area: "starting", outer: foldOuter, inner: foldInner, light: .95, lightPhase: 3.2, accent: .46, occlude: true });
  const allPoints = bundles.flatMap(bundle => [...bundle.outer, ...bundle.inner]);
  const minX = Math.min(...allPoints.map(point => point[0]));
  const maxX = Math.max(...allPoints.map(point => point[0]));
  const minY = Math.min(...allPoints.map(point => point[1]));
  const maxY = Math.max(...allPoints.map(point => point[1]));
  const fit = Math.min(460 / (maxX - minX), 700 / (maxY - minY), 1);
  // Section endpoints share point objects. Transform each once to preserve joins.
  for (const point of new Set(allPoints)) {
    point[0] = 260 + (point[0] - (minX + maxX) / 2) * fit;
    point[1] = 400 + (point[1] - (minY + maxY) / 2) * fit;
  }
  return Object.freeze({ version: 2, ...variation, bundles });
}

// One continuous family weaves through the entire silhouette. Sections map to
// six color areas, not six detached ornaments. Neighboring sections share
// their exact endpoints and tangents; recipe variation warps them together.
const STREAM_AREAS = ["notes", "notes", "thoughts", "thoughts", "routine", "routine", "starting", "starting", "log-week", "protocol", "protocol"];
const STREAM_OUTER = [[290,390],[365,345],[465,325],[455,195],[455,80],[410,30],[340,70],[250,115],[280,200],[205,220],[145,235],[125,180],[80,245],[20,310],[45,415],[125,445],[165,470],[190,475],[190,510],[180,555],[80,590],[120,675],[150,755],[285,775],[365,705],[440,635],[430,510],[355,495],[300,480],[245,490],[260,430],[265,410],[280,400],[290,390]];
const STREAM_INNER = [[270,390],[320,300],[320,210],[340,160],[360,130],[350,120],[330,150],[310,180],[300,230],[220,270],[155,300],[160,300],[160,320],[155,350],[180,360],[220,360],[270,365],[290,400],[255,470],[220,550],[245,600],[270,630],[285,655],[275,660],[275,650],[275,640],[275,630],[270,630],[265,600],[230,510],[250,445],[260,420],[270,405],[270,390]];

function smoothControls(points) {
  const result = points.map(point => [...point]);
  for (let index = 3; index < points.length - 1; index += 3) {
    const [x, y] = points[index];
    const dx = points[index + 3][0] - points[index - 3][0];
    const dy = points[index + 3][1] - points[index - 3][1];
    const length = Math.hypot(dx, dy) || 1;
    const before = Math.hypot(points[index - 1][0] - x, points[index - 1][1] - y);
    const after = Math.hypot(points[index + 1][0] - x, points[index + 1][1] - y);
    result[index - 1] = [x - dx / length * before, y - dy / length * before];
    result[index + 1] = [x + dx / length * after, y + dy / length * after];
  }
  return result;
}

export function imprintThreads(recipe, count = 88) {
  if (recipe.version !== 2) return [];
  return recipe.bundles.map(bundle => ({ ...bundle,
    threads: Array.from({ length: count }, (_, index) => {
      // Correlated small variation preserves neighboring trajectories and gaps.
      const u = (index + .18 * Math.sin(index * 2.39)) / (count - 1);
      const points = bundle.outer.map((point, control) => [
        point[0] + (bundle.inner[control][0] - point[0]) * u,
        point[1] + (bundle.inner[control][1] - point[1]) * u,
      ]);
      return { points, u, width: .4 + .55 * (.5 + .5 * Math.sin(index * 1.71)),
        light: (.28 + .72 * Math.sin(Math.PI * (.12 + .84 * u)) ** 1.2) * bundle.light,
        grain: .7 + .3 * Math.sin(index * 2.14) };
    }),
  }));
}

/** Retain an accepted recipe across profile edits and generator revisions. */
export function retainImprintRecipe(existing, onboarding) {
  return existing ?? createImprintRecipe(onboarding);
}

export function imprintPoint(recipe, t, strand) {
  const angle = t * Math.PI * recipe.twist + .45 * Math.sin(t * 9 + recipe.bend);
  const taper = Math.sin(Math.PI * t) ** .42;
  const width = (recipe.fullness + 50 * Math.sin(t * Math.PI * 2 + recipe.phase) ** 2) * taper;
  const cross = strand * Math.PI;
  const u = Math.sin(cross) * width;
  const v = Math.cos(cross) * width * .55;
  return {
    x: 260 + recipe.spread * Math.sin(t * Math.PI * recipe.turns + recipe.phase) + u * Math.cos(angle) + v * Math.sin(angle) * .45,
    y: 80 + t * 640 + u * .32 * Math.sin(angle) + v * .55,
    z: u * Math.sin(angle) + v * Math.cos(angle) + 30 * Math.cos(t * 11 + recipe.bend),
    light: .18 + .82 * Math.max(0, Math.cos(cross - angle + .7)),
  };
}

/** Color is supplied separately so progress cannot change the geometry. */
export function imprintSegments(recipe, strands = 280, steps = 240) {
  const segments = [];
  for (let line = 0; line < strands; line++) {
    const strand = -1 + 2 * line / (strands - 1);
    for (let step = 0; step < steps; step += 8) {
      const points = [];
      for (let offset = 0; offset <= 8 && step + offset <= steps; offset++) points.push(imprintPoint(recipe, (step + offset) / steps, strand));
      const t = (step + 4) / steps;
      segments.push({ points, depth: points.reduce((sum, p) => sum + p.z, 0) / points.length,
        area: IMPRINT_AREAS[Math.min(5, Math.floor(t * 6))], t, strand: (strand + 1) / 2 });
    }
  }
  return segments.sort((a, b) => a.depth - b.depth);
}
