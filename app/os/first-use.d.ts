export const FIRST_USE_APPS: readonly string[];
export const FIRST_USE_PLACEHOLDERS: Readonly<Record<string, string>>;
export function hasUsedApp(state: unknown, app: string): boolean;
export function firstUsePlaceholder(state: unknown, app: string): string;
