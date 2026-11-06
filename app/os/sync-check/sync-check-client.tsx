"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { SupabaseConnection } from "../auth/supabase-context";
import { getAccountScope, isAccountScopeCurrent, subscribeAccountScope } from "../account-scope.js";
import { createWritingTransport } from "../writing-transport";
import { runHostedChecks, validateWitness, verifyOwnWitness, type TestWitness } from "./hosted-checks.js";
import { continueRecoveryRun, readRecoveryRun, startRecoveryRun, type RecoveryRun } from "./durable-checks";

const target = "https://gcqmblrkpfvjnewzdycj.supabase.co";

export function SyncCheckClient() {
  const connection = useContext(SupabaseConnection);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false), [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState(""), [witness, setWitness] = useState<TestWitness | null>(null);
  const [recovery, setRecovery] = useState<RecoveryRun | null>(null), [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const report = (line: string) => setLines(previous => [...previous, line]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setRecoveryReady(false); setRecovery(null); setRecoveryError("");
      const scope = getAccountScope();
      if (scope.kind !== "account" || connection?.config.url !== target) return;
      try {
        const saved = await readRecoveryRun(scope);
        if (active && isAccountScopeCurrent(scope)) { setRecovery(saved); setRecoveryReady(true); }
      } catch { if (active && isAccountScopeCurrent(scope)) setRecoveryError("Could not read the synthetic recovery checkpoint."); }
    };
    void load(); const unsubscribe = subscribeAccountScope(() => { void load(); });
    return () => { active = false; unsubscribe(); };
  }, [connection]);
  async function recover(start = false) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setRecoveryError("");
    const scope = getAccountScope();
    try {
      if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1"].includes(location.hostname)
        || process.env.NEXT_PUBLIC_CIRCLE_WRITING_SYNC === "enabled" || connection?.config.url !== target || scope.kind !== "account")
        throw new Error("Use local development, the approved project and disabled sync.");
      const next = start ? await startRecoveryRun(scope, performance.timeOrigin)
        : await continueRecoveryRun(scope, createWritingTransport(connection.client, connection.config, scope), performance.timeOrigin);
      if (isAccountScopeCurrent(scope)) setRecovery(next);
    } catch (error) {
      if (isAccountScopeCurrent(scope)) {
        setRecoveryError(error instanceof Error ? error.message : "Recovery check failed.");
        try { setRecovery(await readRecoveryRun(scope)); } catch { /* Keep the prior checkpoint visible. */ }
      }
    } finally { lock.current = false; setBusy(false); }
  }
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
      const other = input.trim() ? validateWitness(JSON.parse(input)) : undefined;
      if (verify) {
        if (!witness) throw new Error("Run this account's checks first.");
        await verifyOwnWitness(remote, witness, owner, other);
        if (other) report("PASS: other-account receipts and resolution archive remain hidden during recheck");
        report("PASS: original account's tombstone, receipts and live archive unchanged; synthetic archive deleted and replay blocked");
        return;
      }
      setWitness(null);
      if (other?.owner === owner) throw new Error("Use the other account's window for the copied witness.");
      // Negative calls need actual gateway/permission rejection, not a network error.
      for (const authorization of [null, "Bearer invalid.synthetic.jwt"]) {
        for (const [name, body] of [["inventory", { after_id: "", page_size: 1 }], ["receipts", { operation_ids: [] }], ["apply", { request: {} }], ["resolve", { request: {} }], ["resolution_history", { after_id: "", page_size: 1 }]] as const) {
          const response = await fetch(`${target}/rest/v1/rpc/circle_writing_${name}`, {
            method: "POST", headers: { apikey: connection.config.key, "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) },
            body: JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.any([scope.signal, AbortSignal.timeout(15000)]),
          });
          const error = await response.json();
          if (![401, 403].includes(response.status) || (!authorization && error.code !== "42501")) throw new Error(`Expected access denial for ${name}; got HTTP ${response.status}.`);
        }
        report(`PASS: all five RPCs reject ${authorization ? "an invalid JWT" : "anonymous access"}`);
      }
      if (!isAccountScopeCurrent(scope)) throw new Error("Account changed; stop this run.");
      const result = await runHostedChecks({ owner, remote, witness: other, report });
      setWitness(result);
      const response = await fetch("/os/sync-check/service-role", { method: "POST", cache: "no-store", signal: scope.signal });
      const resultCode = await response.json();
      if (!response.ok || resultCode.passed !== true) throw new Error("Service-role denial check did not pass; inspect server configuration locally.");
      report("PASS: all five RPCs reject the server service-role key");
      report("DONE: synthetic checks passed. Sync remains off. Run the second account with the first witness, copy the second witness back into the first window, then recheck BOTH accounts to verify isolation and delete both live archives.");
    } catch (error) {
      // Only our fixed errors and transport's sanitized messages are displayed.
      report(`STOP: ${error instanceof SyntaxError ? "Invalid witness JSON." : error instanceof Error ? error.message : "Check failed."}`);
    } finally { lock.current = false; setBusy(false); }
  }
  const control = { minHeight: 44, padding: "8px 12px", border: "1px solid currentColor", borderRadius: 4 };
  return <section style={{ padding: 24, maxWidth: 900, margin: "auto", color: "#191813", background: "#F1EFE8", fontFamily: "Geist, sans-serif" }}>
    <h1>Hosted writing checks</h1>
    <p>Development only. Use disposable accounts. Synthetic saved writing is sent to Supabase. One synthetic archive stays until Recheck original account; recheck both windows to delete it. Body-free receipts and deletion markers remain. Automatic writing sync stays off.</p>
    <label htmlFor="other-witness">Other account’s witness (leave empty for the first account)</label>
    <textarea id="other-witness" value={input} onChange={event => setInput(event.target.value)} disabled={busy} rows={5} style={{ ...control, width: "100%" }} />
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
      <button style={control} disabled={busy} onClick={() => void run()}>{busy ? "Checking…" : "Run synthetic hosted checks"}</button>
      <button style={control} disabled={busy || !witness} onClick={() => void run(true)}>Recheck original account</button>
    </div>
    <pre aria-live="polite" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{lines.join("\n")}</pre>
    {witness && <><label htmlFor="test-witness">Test witness (IDs only; no credentials)</label><textarea id="test-witness" readOnly value={JSON.stringify(witness)} rows={6} style={{ ...control, width: "100%" }} /></>}
    <section aria-label="Durable reload recovery checks" style={{ marginTop: 32 }}>
      <h2>Reload recovery checks</h2>
      <p>Use the two test accounts. This saves synthetic writing in a separate account-scoped test database. Personal writing stays untouched. Requests run only when you continue. Each checkpoint needs a full page reload. Accepted replies are deliberately dropped by the test; automatic sync stays off.</p>
      <p data-testid="recovery-phase">Checkpoint: {recovery?.phase || (recoveryReady ? "not started" : "loading")}</p>
      {recovery && <p>Test entry: <span data-testid="recovery-entry">{recovery.entryId}</span></p>}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
        <button style={control} disabled={busy || !recoveryReady || Boolean(recovery && recovery.phase !== "complete")} onClick={() => void recover(true)}>Start reload checks</button>
        <button style={control} disabled={busy || !recoveryReady || !recovery} onClick={() => void recover()}>{recovery?.phase === "complete" ? "Check saved completion" : "Continue after reload"}</button>
        <button style={control} disabled={busy} onClick={() => location.reload()}>Reload recovery page</button>
      </div>
      <pre data-testid="recovery-results" aria-live="polite" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{recovery?.checks.join("\n") || ""}</pre>
      {recoveryError && <p role="status">{recoveryError}</p>}
    </section>
  </section>;
}
