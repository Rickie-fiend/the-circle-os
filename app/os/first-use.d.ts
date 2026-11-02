export const FIRST_USE_APPS: readonly string[];
export const FIRST_USE_PLACEHOLDERS: Readonly<Record<string, string>>;
export function hasUsedApp(state: unknown, app: string, writing?: WritingCompatibilityView | null): boolean;
export function firstUsePlaceholder(state: unknown, app: string, writing?: WritingCompatibilityView | null): string;
import type { WritingCompatibilityView } from "./writing-compatibility-model.js";
