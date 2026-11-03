import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminAccessTokenMatches } from "../admin-access";
import { addQuote, readQuotes, removeQuote } from "../../quotes/quote-server";

async function authorized(request: Request, mutation = false) {
  const store = await cookies();
  if (!adminAccessTokenMatches(store.get(ADMIN_COOKIE)?.value)) return false;
  if (!mutation) return true;
  try {
    const url = new URL(request.url);
    // Next normalizes loopback addresses in Request.url. Host retains the
    // address the browser actually opened, including its port.
    const host = request.headers.get("host");
    const expected = host ? new URL(`${url.protocol}//${host}`).origin : url.origin;
    return request.headers.get("origin") === expected
      && request.headers.get("content-type")?.split(";")[0] === "application/json";
  } catch { return false; }
}

export async function GET(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Admin access required." }, { status: 403 });
  try { return Response.json(await readQuotes(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Quote library is not connected yet. Complete the database setup." }, { status: 503 }); }
}

async function mutate(request: Request, action: "add" | "remove") {
  if (!await authorized(request, true)) return Response.json({ error: "Admin access required." }, { status: 403 });
  let value;
  try { value = await request.json(); } catch { return Response.json({ error: "Use valid quote text." }, { status: 400 }); }
  try {
    const quotes = action === "add" ? await addQuote(value) : await removeQuote(value.id);
    return Response.json(quotes, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not save quotes." }, { status: 400 }); }
}
export const POST = (request: Request) => mutate(request, "add");
export const DELETE = (request: Request) => mutate(request, "remove");
