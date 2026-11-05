"use client";
import { useContext, useEffect } from "react";
import { SupabaseConnection } from "./auth/supabase-context";
import { isAccountScopeCurrent, type AccountScope } from "./account-scope.js";
import { inventoryWritingStore, subscribeWritingChanges, writingCloudTransaction } from "./writing-store";
import { syncAccountWriting } from "./writing-cloud-sync.js";
import { createWritingTransport } from "./writing-transport";

/** Activation stays off until real database access checks pass in the target project. */
export function requestWritingSync(scope: AccountScope) {
  if (isAccountScopeCurrent(scope)) window.dispatchEvent(new CustomEvent("circle-writing-sync-now", { detail: scope.accountId }));
}
export function WritingCloudRunner({ scope, enabled, onState }: { scope: AccountScope; enabled: boolean;
  onState?: (state: { running: boolean; error: boolean; checked: boolean }) => void }) {
  const connection = useContext(SupabaseConnection);
  const client = connection?.client, config = connection?.config;
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_CIRCLE_WRITING_SYNC !== "enabled" || !enabled || !client || !config || scope.kind !== "account") return;
    let active = true, running = false, checked = false;
    const current = () => active && isAccountScopeCurrent(scope);
    const run = async () => {
      if (!current() || running || !navigator.onLine) return;
      running = true;
      onState?.({ running: true, error: false, checked });
      try {
        await syncAccountWriting({
          current, remote: createWritingTransport(client, config, scope),
          store: { read: () => writingCloudTransaction(scope), inventory: () => inventoryWritingStore(scope),
            update: transform => writingCloudTransaction(scope, transform) },
        });
        checked = true;
        if (current()) onState?.({ running: false, error: false, checked });
      } catch { if (current()) onState?.({ running: false, error: true, checked }); }
      finally { running = false; }
    };
    // Local/remote commits both notify; debounce and never recursively sync a commit.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => { if (!running) { clearTimeout(timer); timer = setTimeout(() => { void run(); }, 750); } };
    const unsubscribe = subscribeWritingChanges(scope, schedule);
    const retry = (event: Event) => { if ((event as CustomEvent).detail === scope.accountId) schedule(); };
    window.addEventListener("circle-writing-sync-now", retry);
    window.addEventListener("online", schedule);
    const interval = setInterval(schedule, 30000);
    schedule();
    return () => { active = false; clearTimeout(timer); clearInterval(interval); unsubscribe(); window.removeEventListener("online", schedule); window.removeEventListener("circle-writing-sync-now", retry); };
  }, [client, config, scope, enabled, onState]);
  return null;
}
