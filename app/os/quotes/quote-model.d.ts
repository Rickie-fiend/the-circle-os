export type Quote = { id: string; text: string; author: string };
export const QUOTE_TEXT_LIMIT: number;
export function quoteInput(value: unknown): Pick<Quote, "text" | "author">;
export function quoteCatalog(value: unknown): Quote[];
export function nextUnreadQuote(pool: readonly Quote[], seen?: readonly string[]): Quote | null;
export function rememberQuote(pool: readonly Quote[], seen: readonly string[], id: string): string[];
