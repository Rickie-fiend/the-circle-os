import { catalogAccount } from "../catalog/server";
import { isLogSyncPilot } from "../log-sync-pilot";

export async function POST(request: Request) {
  if (!isLogSyncPilot(new URL(request.url).hostname)) return new Response(null, { status: 404 });
  if (process.env.NEXT_PUBLIC_CIRCLE_LOG_SYNC === "hosted-test" &&
    process.env.CIRCLE_LOG_SYNC_TEST_ORIGIN !== process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new Response(null, { status: 404 });
  }
  try {
    const { url, headers } = await catalogAccount(request);
    const body = await request.text();
    if (Buffer.byteLength(body) > 262144) return new Response(null, { status: 413 });
    const response = await fetch(url + "/rest/v1/rpc/circle_log_sync", {
      method: "POST", headers, body, cache: "no-store", redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(12000)]),
    });
    if (!response.ok) return new Response(null, { status: response.status });
    return Response.json(await response.json(), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return new Response(null, { status: 503 });
  }
}
