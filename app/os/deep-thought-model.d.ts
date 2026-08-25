export type DeepThoughtPrompt = {
  id: string;
  text: string;
  target: string;
  dateKey: string;
  source: "athena" | "curiosity" | "local" | "local-personalized";
  preparedAt: string;
};
export const DEEP_THOUGHT_MIN_WORDS: number;
export const DEEP_THOUGHT_MIN_ACTIVE_MS: number;
export const LOCAL_DEEP_THOUGHTS: readonly Readonly<{ text: string; target: string }>[];
export function countDeepThoughtWords(value?: string): number;
export function isDeepThoughtRewardEligible(options?: { text?: string; activeMs?: number }): boolean;
export function isSentenceWorthBreakingFor(text?: string): boolean;
export function createLocalDeepThoughtPrompt(state: unknown, dateKey: string, offset?: number): DeepThoughtPrompt;
export function selectDeepThoughtPrompt(state: unknown, dateKey: string): DeepThoughtPrompt;
export function deepThoughtSourceLabel(source?: string, questionId?: string): string;
