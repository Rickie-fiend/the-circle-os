"use client";
import { useContext, useRef, useState } from "react";
import { SupabaseConnection } from "../auth/supabase-context";
import { getAccountScope, isAccountScopeCurrent } from "../account-scope.js";
import { createWritingTransport } from "../writing-transport";
import { runHostedChecks, validateWitness, verifyOwnWitness } from "./hosted-checks.js";

const target = "https://gcqmblrkpfvjnewzdycj.supabase.co";
type Witness = { owner: string; entryId: string; operationIds: string[]; serverVersion: number };

export function SyncCheckClient() {
  const connection = useContext(SupabaseConnection);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false), [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState(""), [witness, setWitness] = useState<Witness | null>(null);
  const report = (line: string) => setLines(previous => [...previous, line]);
  async function run(verify = false) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setLines([]);
    try {
      if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1"].includes(location.hostname)
        || process.env.NEXT_PUBLIC_CIRCLE_WRITING_SYNC === "enabled" || connection?.config.url !== target) throw new Error("Use the local development server, approved project and disabled sync.");
      const scope = getAccountScope();
      if (scope.kind !== "account") throw new Error("Sign in with a disposable confirmed account.");
      const owner = `account:${scope.accountId}`;
      const remote = createWritingTransport(connection.client, connection.config, scope);
      report("Using the signed-in confirmed account; credentials are never shown.");
      if (verify) {
        if (!witness) throw new Error("Run this account's checks first.");
        await verifyOwnWitness(remote, witness, owner);
        report("PASS: original account's tombstone and receipts unchanged after the second account ran");
        return;
      }
      setWitness(null);
      const other = input.trim() ? validateWitness(JSON.parse(input)) : undefined;
      if (other?.owner === owner) throw new Error("Use the other account's window for the copied witness.");
      // Negative calls need actual gateway/permission rejection, not a network error.
      for (const authorization of [null, "Bearer invalid.synthetic.jwt"]) {
        for (const [name, body] of [["inventory", { after_id: "", page_size: 1 }], ["receipts", { operation_ids: [] }], ["apply", { request: {} }]] as const) {
          const response = await fetch(`${target}/rest/v1/rpc/circle_writing_${name}`, {
            method: "POST", headers: { apikey: connection.config.key, "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) },
            body: JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.any([scope.signal, AbortSignal.timeout(15000)]),
          });
          const error = await response.json();
          if (![401, 403].includes(response.status) || (!authorization && error.code !== "42501")) throw new Error(`Expected access denial for ${name}; got HTTP ${response.status}.`);
        }
        report(`PASS: all three RPCs reject ${authorization ? "an invalid JWT" : "anonymous access"}`);
      }
      if (!isAccountScopeCurrent(scope)) throw new Error("Account changed; stop this run.");
      const result = await runHostedChecks({ owner, remote, witness: other, report });
      setWitness(result);
      const response = await fetch("/os/sync-check/service-role", { method: "POST", cache: "no-store", signal: scope.signal });
      const resultCode = await response.json();
      if (!response.ok || resultCode.passed !== true) throw new Error("Service-role denial check did not pass; inspect server configuration locally.");
      report("PASS: all three RPCs reject the server service-role key");
      report("DONE: synthetic checks passed. Sync remains off. Copy the witness into the second account window, then recheck the first.");
    } catch (error) {
      // Only our fixed errors and transport's sanitized messages are displayed.
      report(`STOP: ${error instanceof SyntaxError ? "Invalid witness JSON." : error instanceof Error ? error.message : "Check failed."}`);
    } finally { lock.current = false; setBusy(false); }
  }
  const control = { minHeight: 44, padding: "8px 12px", border: "1px solid currentColor", borderRadius: 4 };
  return <section style={{ padding: 24, maxWidth: 900, margin: "auto", color: "#191813", background: "#F1EFE8", fontFamily: "Geist, sans-serif" }}>
    <h1>Hosted writing checks</h1>
    <p>Development only. Use disposable accounts. Synthetic saved writing is sent to Supabase and permanently deleted by the test. Body-free receipts and deletion markers remain. Automatic writing sync stays off.</p>
    <label htmlFor="other-witness">Other account’s witness (leave empty for the first account)</label>
    <textarea id="other-witness" value={input} onChange={event => setInput(event.target.value)} disabled={busy} rows={5} style={{ ...control, width: "100%" }} />
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
      <button style={control} disabled={busy} onClick={() => void run()}>{busy ? "Checking…" : "Run synthetic hosted checks"}</button>
      <button style={control} disabled={busy || !witness} onClick={() => void run(true)}>Recheck original account</button>
    </div>
    <pre aria-live="polite" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{lines.join("\n")}</pre>
    {witness && <><label htmlFor="test-witness">Test witness (IDs only; no credentials)</label><textarea id="test-witness" readOnly value={JSON.stringify(witness)} rows={6} style={{ ...control, width: "100%" }} /></>}
  </section>;
}
