import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAccountScope, type AccountScope } from "./account-scope.js";
import type { AuthConfig } from "./auth/supabase-client";
import type { WritingRemote } from "./writing-cloud-sync.js";

/** Pin each request to the captured account's token, never an offline proof. */
export function createWritingTransport(client: Pick<SupabaseClient, "auth">,
  config: Pick<AuthConfig, "url" | "key">, scope: AccountScope,
  request: typeof fetch = fetch): WritingRemote {
  const origin = new URL(config.url);
  if (origin.origin !== config.url || origin.username || origin.password || !config.key ||
    (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)))) throw new Error("Invalid writing transport configuration.");
  async function rpc<T>(name: string, body: unknown): Promise<T> {
    assertAccountScope(scope);
    if (scope.kind !== "account") throw new Error("Writing sync requires an account.");
    const { data, error } = await client.auth.getSession();
    assertAccountScope(scope);
    const session = data.session;
    if (error || !session?.access_token || session.user.id !== scope.accountId) throw new Error("Sign in again before syncing writing.");
    const checked = await client.auth.getUser(session.access_token);
    assertAccountScope(scope);
    if (checked.error || checked.data.user?.id !== scope.accountId || !checked.data.user.email_confirmed_at) throw new Error("Sign in again before syncing writing.");
    const response = await request(`${origin.origin}/rest/v1/rpc/${name}`, {
      method: "POST", headers: { apikey: config.key, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store", redirect: "error",
      signal: AbortSignal.any([scope.signal, AbortSignal.timeout(15000)]),
    });
    assertAccountScope(scope);
    // Never print backend errors: they can include writing or credentials.
    if (!response.ok) throw new Error(`Writing sync could not finish (${response.status}). Your saved writing stays on this device.`);
    const result = await response.json();
    assertAccountScope(scope);
    return result as T;
  }
  return {
    receipts: operation_ids => rpc("circle_writing_receipts", { operation_ids }),
    inventory: after_id => rpc("circle_writing_inventory", { after_id, page_size: 50 }),
    apply: request => rpc("circle_writing_apply", { request }),
  };
}
