export type LineReactionEntry = { reaction: string; at: string };
export type LineFeedback = Record<string, LineReactionEntry>;

export const LINE_REACTIONS: Readonly<Record<string, readonly string[]>>;
export const LINE_REACTION_LABELS: Readonly<Record<string, string>>;
export const LINE_REACTION_GLYPHS: Readonly<Record<string, string>>;
export function lineReactions(kind: string): readonly string[];
export function isLineReaction(kind: string, reaction: string): boolean;
export function normalizeLineFeedback(value: unknown): LineFeedback;
export function reactToLine(
  feedback: unknown,
  lineId: string,
  reaction: string,
  at?: string,
): LineFeedback;
export function lineReaction(feedback: unknown, lineId: string): string;
export function mergeLineFeedback(left?: unknown, right?: unknown): LineFeedback;
