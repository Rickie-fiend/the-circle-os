import { readQuotes } from "./quote-server";

export async function GET() {
  try { return Response.json(await readQuotes(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Quote library is not connected yet." }, { status: 503 }); }
}
