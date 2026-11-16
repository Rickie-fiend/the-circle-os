import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const generatorBase = "docs/design/personal-imprint-generator-v1";
export const generatorSources = [
  "app/os/home/imprint-relief-recipe.js", "app/os/home/imprint-relief-samples.js",
  "app/os/home/imprint-relief-courses.js",
  "app/os/home/imprint-loop-recipe.js", "app/os/home/imprint-personal-recipe.js",
  "scripts/lib/imprint-relief-geometry.mjs", "scripts/lib/imprint-relief-inspection.mjs",
  "scripts/lib/imprint-sori-relief.mjs", "scripts/lib/imprint-sori-geometry.mjs",
  "scripts/lib/imprint-loop-geometry.mjs", "scripts/lib/imprint-loop-crossings.mjs",
  "scripts/lib/imprint-loop-inspection.mjs", "scripts/lib/imprint-material-renderer.mjs",
  "scripts/lib/imprint-network-geometry.mjs", "scripts/lib/imprint-generator-artifacts.mjs",
  "scripts/render-imprint-generator.mjs", "docs/design/personal-imprint-loops-v2.json",
];
export const artifactHash = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
export async function generatorSourceHashes() {
  return Object.fromEntries(await Promise.all(generatorSources.map(async path => [path, artifactHash(await readFile(path))])));
}
export async function preservedSoriReference() {
  const report = JSON.parse(await readFile("docs/design/personal-imprint-sori-v4-inspection.json", "utf8"));
  const sourcesMatch = (await Promise.all(Object.entries(report.sourceHashes).map(async ([path, hash]) => artifactHash(await readFile(path)) === hash))).every(Boolean);
  const assetsMatch = (await Promise.all(Object.values(report.outputs).map(async output => artifactHash(await readFile(output.path)) === output.hash))).every(Boolean);
  return { geometryHash: report.geometryHash, renderHash: report.renderHash, sourcesMatch, assetsMatch, outputs: report.outputs };
}
