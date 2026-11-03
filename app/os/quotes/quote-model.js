// The catalog is public reading material. Seen IDs belong to each local account.
export const QUOTE_TEXT_LIMIT = 320;

export function quoteInput(value) {
  const text = typeof value?.text === "string" ? value.text.trim() : "";
  const author = typeof value?.author === "string" ? value.author.trim() : "";
  if (!text || text.length > QUOTE_TEXT_LIMIT || author.length > QUOTE_TEXT_LIMIT) {
    throw new Error(`Use quote text and an optional author of up to ${QUOTE_TEXT_LIMIT} characters each.`);
  }
  return { text, author };
}

export function quoteCatalog(value) {
  if (!Array.isArray(value)) throw new Error("Could not read the quote library.");
  const ids = new Set();
  return value.map(item => {
    if (typeof item?.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id) || ids.has(item.id)) {
      throw new Error("Could not read the quote library.");
    }
    ids.add(item.id);
    return { id: item.id, ...quoteInput(item) };
  });
}

export function nextUnreadQuote(pool, seen = []) {
  const catalog = quoteCatalog(pool);
  if (!catalog.length) return null;
  const recent = Array.isArray(seen) ? seen : [];
  return catalog.find(item => !recent.includes(item.id)) || [...catalog].sort((a, b) => recent.indexOf(b.id) - recent.indexOf(a.id))[0];
}

export function rememberQuote(pool, seen, id) {
  const valid = new Set(pool.map(item => item.id));
  return [id, ...(Array.isArray(seen) ? seen : []).filter(value => value !== id && valid.has(value))];
}
