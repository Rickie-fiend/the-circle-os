"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { accountStorageKey, assertAccountScope, isAccountScopeCurrent, type AccountScope } from "./account-scope";
import { CIRCLE_OS_STORAGE_KEY } from "./circle-os-model.js";
import { loadCircleState } from "./circle-os-store";
import { commitWritingOperation, loadWritingState, subscribeWritingChanges, writingOwner } from "./writing-store";
import {
  buildWritingCompatibilityView, writingConsumerMemory,
  type ExistingWritingAnswer, type WritingCompatibilityView, type WritingMemorySnapshot,
} from "./writing-compatibility-model.js";
import {
  writingDrafts, writingHistory, writingVersions, WritingError,
  type WritingCommand, type WritingReceipt, type WritingState,
} from "./writing-model.js";

type Props = {
  scope: AccountScope;
  enabled: boolean;
  answers: ExistingWritingAnswer[];
  memory: WritingMemorySnapshot;
  children: ReactNode;
};
type Inputs = Pick<Props, "answers" | "memory" | "enabled">;
type Snapshot = { inputs: Inputs; request: number; ledger: WritingState; view: WritingCompatibilityView; memory: WritingMemorySnapshot };
type WriteStatus = {
  operationId: string | null;
  status: "idle" | "saving" | "error" | WritingReceipt["outcome"];
  receipt: WritingReceipt | null;
  error: string | null;
};
export type WritingContextValue = {
  owner: string;
  status: "loading" | "refreshing" | "ready" | "error";
  error: string | null;
  view: WritingCompatibilityView | null;
  memory: WritingMemorySnapshot;
  history: ReturnType<typeof writingHistory>;
  trash: ReturnType<typeof writingHistory>;
  drafts: ReturnType<typeof writingDrafts>;
  versions: (entryId: string) => ReturnType<typeof writingVersions>;
  write: WriteStatus;
  /** Resolves with local acceptance only. Render current views, never this receipt. */
  commit: (command: WritingCommand) => Promise<WritingReceipt>;
  refresh: () => Promise<boolean>;
};

const WritingContext = createContext<WritingContextValue | null>(null);
const idleWrite: WriteStatus = { operationId: null, status: "idle", receipt: null, error: null };
const closedMemory: WritingMemorySnapshot = Object.freeze({});

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Legacy transport remains on its existing path. No profile is claimed/imported. */
export function WritingProvider(props: Props) {
  return props.scope.kind === "account" ? <AccountWritingProvider {...props} /> : props.children;
}

function AccountWritingProvider({ scope, enabled, answers, memory, children }: Props) {
  const owner = `account:${scope.accountId}`;
  const inputs = useMemo(() => ({ enabled, answers, memory }), [enabled, answers, memory]);
  const activeInputs = useRef<Inputs | null>(null);
  const sequence = useRef(0);
  const latestWrite = useRef(0);
  const mounted = useRef(false);
  const externalDirty = useRef(false);
  const externalSnapshot = useRef<{ inputs: Inputs; answers: ExistingWritingAnswer[]; memory: WritingMemorySnapshot } | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [read, setRead] = useState<{ status: WritingContextValue["status"]; error: string | null }>({ status: "loading", error: null });
  const [write, setWrite] = useState<WriteStatus>(idleWrite);

  const refresh = useCallback(async (fromStorage = false): Promise<boolean> => {
    if (!mounted.current || activeInputs.current !== inputs || !enabled || !isAccountScopeCurrent(scope)) return false;
    const request = ++sequence.current;
    const current = () => mounted.current && activeInputs.current === inputs
      && sequence.current === request && isAccountScopeCurrent(scope);
    setRead({ status: "refreshing", error: null });
    try {
      const ledger = await loadWritingState(scope);
      // A Circle-state storage event means its old-answer snapshot also changed.
      // This is a read for compatibility, never a replacement of editable state.
      const existing = fromStorage || externalDirty.current ? await loadCircleState(scope) : null;
      if (!current()) return false;
      const cached = externalSnapshot.current?.inputs === inputs ? externalSnapshot.current : null;
      const existingAnswers = existing?.profile.profileCase.survey.answers || cached?.answers || answers;
      const existingMemory = existing?.athenaMemory || cached?.memory || memory;
      const view = await buildWritingCompatibilityView({ owner, writingState: ledger,
        existingWriting: { owner, answers: existingAnswers } });
      if (!current()) return false;
      const consumerMemory = writingConsumerMemory({ owner, memory: existingMemory }, view);
      if (existing) externalSnapshot.current = { inputs, answers: existingAnswers, memory: existingMemory };
      externalDirty.current = false;
      setSnapshot({ inputs, request, ledger: freeze(ledger), view, memory: freeze(consumerMemory) });
      setRead({ status: "ready", error: null });
      return true;
    } catch {
      if (current()) setRead({ status: "error", error: "Could not open your saved writing. Try again." });
      return false;
    }
  }, [scope, inputs, enabled, answers, memory, owner]);
  const refreshCurrent = useRef(refresh);

  useLayoutEffect(() => {
    mounted.current = true;
    activeInputs.current = inputs;
    refreshCurrent.current = refresh;
    externalDirty.current = false;
    externalSnapshot.current = null;
    // Invalidate before a delayed read/hash can publish the previous inputs.
    ++sequence.current;
    const close = () => { mounted.current = false; ++sequence.current; };
    if (!enabled || !isAccountScopeCurrent(scope)) return close;
    const unsubscribe = subscribeWritingChanges(scope, () => { void refresh(); });
    const circleKey = accountStorageKey(scope, CIRCLE_OS_STORAGE_KEY);
    const storage = (event: StorageEvent) => {
      if (event.key === circleKey || event.key === null) {
        externalDirty.current = true;
        void refresh(true);
      }
    };
    window.addEventListener("storage", storage);
    queueMicrotask(() => { void refresh(); });
    return () => {
      close();
      unsubscribe();
      window.removeEventListener("storage", storage);
    };
  }, [scope, enabled, inputs, refresh]);

  const commit = useCallback(async (command: WritingCommand) => {
    assertAccountScope(scope);
    if (!mounted.current || !activeInputs.current?.enabled) throw new WritingError("view-not-ready", "Your writing is still opening.");
    if (command.owner !== writingOwner(scope)) throw new WritingError("owner-mismatch", "This writing belongs to another account.");
    const attempt = ++latestWrite.current;
    setWrite({ operationId: command.operationId, status: "saving", receipt: null, error: null });
    try {
      const result = await commitWritingOperation(scope, command);
      assertAccountScope(scope);
      if (!mounted.current) throw new WritingError("view-closed", "This writing session has closed.");
      // Do not render result.state: another tab may have changed it already.
      await refreshCurrent.current();
      assertAccountScope(scope);
      if (!mounted.current) throw new WritingError("view-closed", "This writing session has closed.");
      const receipt = freeze(structuredClone(result.receipt));
      if (attempt === latestWrite.current) setWrite({ operationId: receipt.operationId, status: receipt.outcome, receipt, error: null });
      return receipt;
    } catch (cause) {
      if (mounted.current && isAccountScopeCurrent(scope) && attempt === latestWrite.current) {
        setWrite({ operationId: command.operationId, status: "error", receipt: null, error: "Could not save on this device. Your open text is still yours to retry." });
      }
      throw cause;
    }
  }, [scope]);

  const scopeCurrent = isAccountScopeCurrent(scope);
  const current = enabled && read.status === "ready" && snapshot?.inputs === inputs && scopeCurrent ? snapshot : null;
  const safeMemory = useMemo(() => freeze(writingConsumerMemory({ owner, memory }, null)), [owner, memory]);
  const value: WritingContextValue = {
    owner,
    status: current ? "ready" : read.status === "error" ? "error" : read.status === "loading" ? "loading" : "refreshing",
    error: read.error,
    view: current?.view || null,
    memory: scopeCurrent ? current?.memory || safeMemory : closedMemory,
    history: current ? freeze(writingHistory(current.ledger)) : [],
    trash: current ? freeze(writingHistory(current.ledger, { status: "trashed" })) : [],
    drafts: current ? freeze(writingDrafts(current.ledger)) : [],
    versions(entryId) {
      assertAccountScope(scope);
      if (!current || !mounted.current || activeInputs.current !== inputs || current.request !== sequence.current) {
        throw new WritingError("view-not-ready", "Your saved writing is refreshing.");
      }
      return freeze(writingVersions(current.ledger, entryId));
    },
    write,
    commit,
    refresh: () => refresh(),
  };
  return <WritingContext.Provider value={value}>{children}</WritingContext.Provider>;
}

export function useWriting() {
  return useContext(WritingContext);
}
