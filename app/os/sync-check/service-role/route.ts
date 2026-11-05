/** Local-only negative access probe. The secret stays on the server. */
export async function POST(request: Request) {
  const url = new URL(request.url), origin = request.headers.get("origin");
  if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1"].includes(url.hostname)
    || origin !== url.origin) return new Response(null, { status: 404 });
  const target = "https://gcqmblrkpfvjnewzdycj.supabase.co";
  const key = process.env.SUPABASE_SECRET_KEY || "";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== target || !key) return Response.json({ passed: false }, { status: 503 });
  try {
    for (const [name, body] of [["inventory", { after_id: "", page_size: 1 }], ["receipts", { operation_ids: [] }], ["apply", { request: {} }]] as const) {
      const response = await fetch(`${target}/rest/v1/rpc/circle_writing_${name}`, {
        method: "POST", headers: { apikey: key, "Content-Type": "application/json", ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
      });
      const error = await response.json();
      if (![401, 403].includes(response.status) || error.code !== "42501") return Response.json({
        passed: false, stage: name, status: response.status,
        code: typeof error.code === "string" && /^[A-Za-z0-9_]{1,30}$/.test(error.code) ? error.code : null,
      }, { status: 502 });
    }
    return Response.json({ passed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ passed: false, networkError: true }, { status: 502 }); }
}
