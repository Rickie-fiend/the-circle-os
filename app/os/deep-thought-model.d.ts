export type DeepThoughtPrompt = {
  id: string;
  text: string;
  target: string;
  dateKey: string;
  source: "athena" | "local" | "local-personalized" | "follow-up";
  preparedAt: string;
};
export const DEEP_THOUGHT_MIN_WORDS: number;
export const DEEP_THOUGHT_MIN_ACTIVE_MS: number;
export const LOCAL_DEEP_THOUGHTS: readonly Readonly<{ text: string; target: string }>[];
export function countDeepThoughtWords(value?: string): number;
export function isDeepThoughtRewardEligible(options?: { text?: string; activeMs?: number }): boolean;
export function createLocalDeepThoughtPrompt(state: unknown, dateKey: string, offset?: number): DeepThoughtPrompt;
export function deepThoughtFollowUp(prompt: DeepThoughtPrompt): DeepThoughtPrompt;
