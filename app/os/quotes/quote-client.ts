import { accountStorageKey, assertAccountScope, type AccountScope } from "../account-scope";
import { nextUnreadQuote, quoteCatalog, rememberQuote, type Quote } from "./quote-model.js";

const CACHE = "circle-os-public-quotes-v1";

function cached(): Quote[] | null {
  try {
    const value = localStorage.getItem(CACHE);
    return value === null ? null : quoteCatalog(JSON.parse(value));
  } catch { return null; }
}

/** Refresh on each deliberate opening; a failed request can use the last valid catalog. */
export async function pickQuote(scope: AccountScope): Promise<Quote | null> {
  assertAccountScope(scope);
  let pool = cached();
  try {
    const response = await fetch("/os/quotes", {
      cache: "no-store", signal: AbortSignal.any([scope.signal, AbortSignal.timeout(5000)]),
    });
    if (!response.ok) throw new Error("Quote library unavailable");
    pool = quoteCatalog(await response.json());
    assertAccountScope(scope);
    // An empty server catalog is authoritative, including after the last removal.
    try { localStorage.setItem(CACHE, JSON.stringify(pool)); } catch { /* Reading still works if this public cache is full. */ }
  } catch {
    assertAccountScope(scope);
    if (pool === null) throw new Error("Could not open quotes. Please try again.");
  }
  assertAccountScope(scope);
  const key = accountStorageKey(scope, "circle-os-quotes-seen-v1");
  let seen: string[] = [];
  try { seen = JSON.parse(localStorage.getItem(key) || "[]"); } catch { /* Start a fresh reading cycle. */ }
  const quote = nextUnreadQuote(pool, seen);
  if (quote) {
    // Do not claim rotation was remembered if the local write failed.
    localStorage.setItem(key, JSON.stringify(rememberQuote(pool, seen, quote.id)));
  }
  return quote;
}
