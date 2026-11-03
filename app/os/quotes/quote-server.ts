import { quoteCatalog, quoteInput } from "./quote-model.js";

// Imported exclusively by server route modules. Never expose the write key to a client.
function config(write: boolean) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = write ? process.env.SUPABASE_SECRET_KEY || "" : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) throw new Error("Quote library is not connected yet.");
  const parsed = new URL(url);
  if (parsed.username || parsed.password || (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname)))) throw new Error("Invalid quote library configuration.");
  return { url: parsed.origin, key };
}

async function request(method: "POST" | "DELETE", value?: unknown) {
  const { url, key } = config(true);
  const path = method === "DELETE" ? `?id=eq.${value}` : "?select=id,text,author";
  const response = await fetch(`${url}/rest/v1/circle_quotes${path}`, {
    method, cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: { apikey: key, "Content-Type": "application/json", Prefer: "return=representation" },
    ...(method === "POST" ? { body: JSON.stringify(quoteInput(value)) } : {}),
  });
  if (!response.ok) throw new Error("Could not update or open the quote library. Check its database setup.");
  return quoteCatalog(await response.json());
}

export async function readQuotes() {
  const { url, key } = config(false);
  const rows = [];
  // Respect PostgREST pagination, so a larger library never becomes a repeating first page.
  const pageSize = 1000;
  for (let offset = 0; ;) {
    const response = await fetch(`${url}/rest/v1/circle_quotes?select=id,text,author&order=created_at.asc,id.asc&offset=${offset}&limit=${pageSize}`, {
      cache: "no-store", signal: AbortSignal.timeout(10000), headers: { apikey: key, Prefer: "count=exact" },
    });
    if (!response.ok) throw new Error("Could not open the quote library. Check its database setup.");
    const page = quoteCatalog(await response.json());
    rows.push(...page);
    const total = response.headers.get("content-range")?.split("/")[1];
    if (!page.length || (total && total !== "*" ? rows.length >= Number(total) : page.length < pageSize)) break;
    offset += page.length;
  }
  return quoteCatalog(rows);
}
export const addQuote = (value: unknown) => request("POST", value);
export function removeQuote(id: unknown) {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Choose a quote from the library.");
  return request("DELETE", id);
}
