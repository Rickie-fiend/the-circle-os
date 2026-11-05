"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { SupabaseConnection } from "./auth/supabase-context";
import { isAccountScopeCurrent, type AccountScope } from "./account-scope.js";
import { chooseWritingCopy, subscribeWritingChanges, writingCloudTransaction } from "./writing-store";
import type { WritingCloudBundle } from "./writing-cloud-model.js";
import { WritingCloudRunner, requestWritingSync } from "./writing-cloud-runner";

type SyncView = { bundle: WritingCloudBundle | null; enabled: boolean; online: boolean; error: boolean; running: boolean; checked: boolean;
  choose: (entryId: string, choice: "local" | "cloud", reviewed: WritingCloudBundle) => Promise<void>; retry: () => void };
const SyncContext = createContext<SyncView | null>(null);
export const useWritingSync = () => useContext(SyncContext);
export function WritingSyncProvider({ scope, enabled, children }: { scope: AccountScope; enabled: boolean; children: ReactNode }) {
  const connection = useContext(SupabaseConnection);
  const active = enabled && process.env.NEXT_PUBLIC_CIRCLE_WRITING_SYNC === "enabled" && Boolean(connection?.client && connection?.config);
  const [bundle, setBundle] = useState<WritingCloudBundle | null>(null);
  const [readError, setReadError] = useState(false);
  const [online, setOnline] = useState(true);
  const [runtime, setRuntime] = useState({ running: false, error: false, checked: false });
  const sequence = useRef(0);
  const live = useRef(false);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const next = await writingCloudTransaction(scope);
      if (live.current && isAccountScopeCurrent(scope) && sequence.current === request) { setBundle(next); setReadError(false); }
    } catch { if (live.current && isAccountScopeCurrent(scope) && sequence.current === request) setReadError(true); }
  }, [scope]);
  useEffect(() => {
    if (!enabled) return;
    live.current = true;
    let mounted = true;
    const update = () => { if (mounted) void refresh(); };
    const connectionChanged = () => { if (mounted) { setOnline(navigator.onLine); update(); } };
    connectionChanged();
    const unsubscribe = subscribeWritingChanges(scope, update);
    window.addEventListener("online", connectionChanged); window.addEventListener("offline", connectionChanged);
    return () => { mounted = false; live.current = false; unsubscribe(); window.removeEventListener("online", connectionChanged); window.removeEventListener("offline", connectionChanged); };
  }, [scope, enabled, refresh]);
  const current = isAccountScopeCurrent(scope) && bundle?.state.owner === `account:${scope.accountId}` ? bundle : null;
  const value: SyncView = { bundle: current, enabled: active, online, ...runtime, error: readError || runtime.error,
    async choose(entryId, choice, reviewed) {
      if (!active || !navigator.onLine || !isAccountScopeCurrent(scope)) throw new Error("Connect before choosing a copy. Both copies are kept.");
      await chooseWritingCopy(scope, entryId, choice, reviewed);
      requestWritingSync(scope);
    },
    retry() { void refresh(); if (active) requestWritingSync(scope); },
  };
  return <SyncContext.Provider value={value}><WritingCloudRunner scope={scope} enabled={enabled} onState={setRuntime} />{children}</SyncContext.Provider>;
}
