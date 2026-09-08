import manifest from "./published/quests.json";
import type { Quest } from "../quests";

/**
 * The compiled Quest manifest, bound to the App.
 *
 * `quests.js` stays a plain function over data so it can be read without a
 * bundler; this is the one place that knows where the compiled manifest lives,
 * exactly as `registry.ts` does for the chapters themselves.
 */
export const QUESTS: Quest[] = manifest.quests as Quest[];
