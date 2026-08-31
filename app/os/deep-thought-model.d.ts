export type DeepThoughtKind =
  | "talent"
  | "taste"
  | "oddity"
  | "memory"
  | "stance"
  | "imagination";
export type DeepThoughtQuestion = {
  text: string;
  kind: DeepThoughtKind;
  target: string;
};
export type DeepThoughtPrompt = {
  id: string;
  text: string;
  kind?: DeepThoughtKind;
  target: string;
  dateKey: string;
  source: "athena" | "curiosity" | "local" | "local-personalized";
  preparedAt: string;
};
export const DEEP_THOUGHT_MIN_WORDS: number;
export const DEEP_THOUGHT_MIN_ACTIVE_MS: number;
export const DEEP_THOUGHT_KINDS: Readonly<Record<DeepThoughtKind, DeepThoughtKind>>;
export const LOCAL_DEEP_THOUGHTS: readonly Readonly<DeepThoughtQuestion>[];
export function unaskedDeepThoughts(
  state: unknown,
  questions?: readonly Readonly<DeepThoughtQuestion>[],
): Readonly<DeepThoughtQuestion>[];
export function countDeepThoughtWords(value?: string): number;
export function isDeepThoughtRewardEligible(options?: { text?: string; activeMs?: number }): boolean;
export function isSentenceWorthBreakingFor(text?: string): boolean;
export function createLocalDeepThoughtPrompt(state: unknown, dateKey: string, offset?: number): DeepThoughtPrompt;
export function selectDeepThoughtPrompt(state: unknown, dateKey: string, visit?: number): DeepThoughtPrompt;
export function deepThoughtSourceLabel(source?: string, questionId?: string): string;
