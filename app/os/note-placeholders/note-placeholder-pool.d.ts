export type NotePlaceholder = { id: string; text: string };

export function normalizeNotePlaceholders(
  value: unknown,
): NotePlaceholder[];
export function nextNotePlaceholder(
  value: unknown,
  previousId?: string,
): NotePlaceholder | null;
