"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { InfoPage } from "./app-session";
import { useAppBack } from "./app-back";
import { CreativeButton, ButtonRewardBackdrop } from "./button-engine";
import { isDeepThoughtRewardEligible } from "./deep-thought-model.js";
import { sizeTextAreaToContent } from "./text-area-size";
import { useWriting, type WritingContextValue } from "./writing-provider";
import { WritingSyncPage } from "./writing-sync-page";
import { QuotePage, type QuoteNavigation } from "./quotes/quote-page";
import type { Quote } from "./quotes/quote-model.js";
import { writingAttribution, type WritingCommand, type WritingContent, type WritingDraft, type WritingDraftInput, type WritingHistoryEntry, type WritingKind, type WritingSource, type WritingVersion } from "./writing-model.js";

type Session = { draft: WritingDraftInput; version: number; revision: number; savedRevision: number; conflict: boolean };
type Page = "editor" | "history" | "sync" | "detail" | "versions" | "version" | "trash" | "trash-detail" | "delete" | "drafts" | "conflict" | "quote";
type Props = {
  kind: WritingKind;
  source?: WritingSource;
  placeholder?: string;
  onLabel?: (source: HTMLElement) => void;
  onBusyChange?: (busy: boolean) => void;
  onSent?: () => void;
  onAdmin?: () => void;
  onClear?: () => void;
  embedded?: boolean;
  onNextQuestion?: () => void;
  nextQuote?: () => Promise<Quote | null>;
  onQuoteNavigation?: (navigation: QuoteNavigation | null) => void;
  onQuoteReaction?: (quote: Quote, reaction: string) => void;
};
const blank = (): WritingContent => ({ title: "", body: "", tags: [] });
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const NOTE_SAVE_DELAY = 1000;
const isNote = (kind: WritingKind) => kind === "note";
const labelFor = (kind: WritingKind) => kind === "note" ? "Note" : kind === "deep-thought" ? "Deep Thoughts" : kind === "reading-answer" ? "Reply" : "Thoughts";
// Callbacks run on a user click, never while
// rendering the Page (including callbacks that read editor refs).
function Action({ text, click, disabled, danger = false }: { text: string; click: () => void; disabled: boolean; danger?: boolean }) {
  return <button className={`os-writing-action${danger ? " is-danger" : ""}`} type="button" disabled={disabled} onClick={click}>{text}</button>;
}
function TrashIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M10 10v7M14 10v7" /></svg>;
}

/** The live buffer is independent of provider refreshes. Commands are queued per
 * editor; only this editor's accepted Save may advance its optimistic base. */
function WritingPage({ writing, kind, source = null, placeholder = "Write what comes up...", onLabel, onBusyChange, onSent, onAdmin, onClear, embedded = false, onNextQuestion, nextQuote, onQuoteNavigation, onQuoteReaction }: Props & { writing: WritingContextValue }) {
  const back = useAppBack<Page>("editor");
  const noteNavigation = isNote(kind) || (kind === "deep-thought" && !embedded);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteFeedback, setQuoteFeedback] = useState(false);
  const quoteFeedbackRef = useRef(false);
  const [openingQuote, setOpeningQuote] = useState(false);
  const [quoteError, setQuoteError] = useState(false);
  const formId = useId();
  const [menu, setMenu] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const live = useRef<Session | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<WritingVersion | null>(null);
  const [versions, setVersions] = useState<WritingVersion[]>([]);
  const [fresh, setFresh] = useState(false);
  const [undo, setUndo] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [departing, setDeparting] = useState(false);
  const animationDone = useRef(false);
  const acceptedSend = useRef<Session | null>(null);
  const saving = useRef<Promise<boolean> | null>(null);
  const startingNote = useRef(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveLatest = useRef<() => Promise<boolean>>(() => Promise.resolve(true));
  const composing = useRef(false);
  const initializedNote = useRef(false);
  const [focused, setFocused] = useState(false);
  const activeMs = useRef(0);
  const focusAt = useRef<number | null>(null);
  const mounted = useRef(true);
  const [snapshot, setSnapshot] = useState(writing);
  // Keep the last readable screen during the provider's short refresh. Actions
  // still use the current provider and are disabled while it is not ready.
  if (writing.status === "ready" && snapshot !== writing) setSnapshot(writing);
  const read = writing.status === "ready" ? writing : snapshot;
  const current = useRef(writing);
  useLayoutEffect(() => { current.current = writing; }, [writing]);
  const ready = writing.status === "ready";
  const belongs = (entry: { kind: WritingKind }) => isNote(kind) ? entry.kind === "note" : entry.kind !== "note";
  const entries = read.history.filter(belongs);
  const trashed = read.trash.filter(belongs);
  const matchingDrafts = read.drafts.filter(draft => draft.kind === kind && (draft.source?.questionId || "") === (source?.questionId || "")
    && (!isNote(kind) || draft.baseVersionId || draft.content.title.trim() || draft.content.body.trim()));
  const recovered = !fresh && (isNote(kind) || matchingDrafts.length === 1) ? matchingDrafts[0] : null;
  const selectedEntry = [...entries, ...trashed].find(entry => entry.id === selected);
  const defaultEntry = !fresh && isNote(kind) ? entries[0] : !fresh && (embedded || kind === "deep-thought") && source?.questionId ? entries.find(entry => entry.source?.questionId === source.questionId) : undefined;
  const shown = session?.draft.content || recovered?.content || defaultEntry?.content || blank();
  const sourceShown = session ? session.draft.source : recovered ? recovered.source : defaultEntry ? defaultEntry.source : source;
  const composingKind = session?.draft.kind || recovered?.kind || defaultEntry?.kind || kind;
  const editingSaved = Boolean(session ? session.draft.baseVersionId : recovered ? recovered.baseVersionId : defaultEntry);
  const spentQuestion = kind === "deep-thought" && !session && !recovered && !defaultEntry
    && Boolean(read.view?.answeredQuestions.some(item => item.questionId === source?.questionId));
  const dirty = Boolean(session ? session.revision !== session.savedRevision : recovered);
  const textareas = useRef<HTMLFormElement | null>(null);
  const noteContent = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => { if (noteContent.current?.parentElement) noteContent.current.parentElement.scrollTop = 0; }, [back.side]);
  useLayoutEffect(() => {
    textareas.current?.querySelectorAll("textarea").forEach(editor => {
      sizeTextAreaToContent(editor);
      // Native caret scrolling can outlive the temporary zero-height sizing
      // pass. Note scrolls the enclosing Body, never an offset inside a field.
      if (noteNavigation) editor.scrollTop = 0;
    });
  }, [shown.title, shown.body, back.side, noteNavigation]);
  useEffect(() => { onBusyChange?.(focused || dirty || pending > 0 || openingQuote || back.side !== "editor" || menu); }, [focused, dirty, pending, openingQuote, back.side, menu, onBusyChange]);
  useEffect(() => () => onQuoteNavigation?.(null), [onQuoteNavigation]);
  useLayoutEffect(() => { saveLatest.current = save; });
  useEffect(() => {
    mounted.current = true;
    if (!isNote(kind)) return () => { mounted.current = false; };
    const flush = () => { if (!composing.current) void saveLatest.current(); };
    const visibility = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", flush);
    return () => {
      mounted.current = false;
      clearNoteTimer();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", flush);
      // Route changes can finish a save while the account provider stays open.
      // A closing browser/account may stop it; the per-input recovery survives.
      flush();
    };
  }, [kind]);
  useEffect(() => {
    if (!isNote(kind) || !ready || initializedNote.current) return;
    initializedNote.current = true;
    // Capture recovery only at entry. An idle second tab must not adopt and
    // autosave a different tab's newly arriving recovery buffer.
    queueMicrotask(() => {
      if (!mounted.current || live.current) return;
      if (recovered || defaultEntry) publish(ensureSession());
      else setFresh(true);
      if (recovered) scheduleNoteSave();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, ready, recovered?.id]);

  function publish(next: Session | null) {
    live.current = next;
    if (mounted.current) setSession(next ? { ...next, draft: { ...next.draft, content: { ...next.draft.content } } } : null);
  }
  function ensureSession(): Session {
    if (live.current) return live.current;
    const at = now();
    const draft: WritingDraftInput = recovered ? { ...recovered, content: { ...recovered.content } } : {
      id: id(), entryId: defaultEntry?.id || id(), kind: defaultEntry?.kind || kind,
      startedAt: defaultEntry?.startedAt || at,
      attribution: defaultEntry?.attribution || writingAttribution(at, Intl.DateTimeFormat().resolvedOptions().timeZone),
      content: { ...shown }, source: defaultEntry?.source || source,
      baseVersionId: defaultEntry?.versionId || null, baseGeneration: defaultEntry?.generation || 0,
    };
    const next = { draft, version: recovered?.version || 0, revision: recovered ? 1 : 0, savedRevision: 0, conflict: false };
    live.current = next;
    return next;
  }
  function enqueue<T,>(work: () => Promise<T>) {
    if (mounted.current) setPending(count => count + 1);
    const result = queue.current.then(work);
    queue.current = result.catch(() => undefined);
    void result.catch(() => { if (mounted.current && !live.current?.conflict) setError("Could not save on this device. Your open text is still here. Try again."); })
      .finally(() => { if (mounted.current) setPending(count => count - 1); });
    return result;
  }
  function header() { return { owner: writing.owner, operationId: id(), at: now() }; }
  async function persist(target: Session, content: WritingContent) {
    if (target.conflict) throw new Error("Review both copies first");
    const receipt = await current.current.commit({ ...header(), type: "write-draft", draft: { ...target.draft, content }, expectedDraftVersion: target.version });
    if (receipt.draftId) target.draft.id = receipt.draftId;
    if (receipt.draftVersion !== null) target.version = receipt.draftVersion;
    if (receipt.outcome === "conflict") {
      target.conflict = true;
      if (mounted.current) { setError(isNote(kind) ? "Another copy changed. Your text is kept. Review both copies." : "Another copy changed. Your draft is kept. Review both before saving."); back.reset("conflict"); }
      throw new Error("draft conflict");
    }
  }
  function change(field: "title" | "body", value: string) {
    const target = ensureSession();
    target.draft.content = { ...target.draft.content, [field]: value };
    ++target.revision;
    setNotice(""); setError(""); setQuoteError(false); setSent(false); acceptedSend.current = null;
    animationDone.current = false;
    // Called only by input/Clear handlers. The compiler follows Action callbacks
    // as if they ran during render; this clock belongs to user interaction.
    if (value.trim() && focusAt.current === null) focusAt.current = performance.now();
    publish(target);
    const content = { ...target.draft.content };
    void enqueue(async () => { await persist(target, content); }).catch(() => undefined);
    if (isNote(kind)) scheduleNoteSave();
  }
  function clearNoteTimer() {
    if (noteTimer.current !== null) clearTimeout(noteTimer.current);
    noteTimer.current = null;
  }
  function scheduleNoteSave() {
    clearNoteTimer();
    if (!composing.current) noteTimer.current = setTimeout(() => { noteTimer.current = null; void saveLatest.current(); }, NOTE_SAVE_DELAY);
  }
  function pauseClock() {
    if (focusAt.current !== null) activeMs.current += performance.now() - focusAt.current;
    focusAt.current = null;
  }
  function finishDeparture() {
    const target = acceptedSend.current;
    if (!target || live.current !== target || target.revision !== target.savedRevision) return;
    acceptedSend.current = null;
    publish(null); setFresh(true); setSent(false); setDeparting(false); setRewarded(false);
    activeMs.current = 0; focusAt.current = null;
    onSent?.();
  }
  function maybeDepart() {
    const target = acceptedSend.current;
    if (!target || !animationDone.current || target.revision !== target.savedRevision) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finishDeparture();
    else setDeparting(true);
  }
  function save(): Promise<boolean> {
    clearNoteTimer();
    if (isNote(kind) && composing.current) return Promise.resolve(false);
    if (isNote(kind) && (!live.current || live.current.revision === live.current.savedRevision)) return Promise.resolve(true);
    // A departure must also save newer typing that arrived during an earlier save.
    if (saving.current) return saving.current.then(accepted => accepted && isNote(kind) ? save() : accepted);
    const target = ensureSession();
    if (target.conflict) { if (mounted.current) back.reset("conflict"); return Promise.resolve(false); }
    const content = { ...target.draft.content };
    if (!content.title.trim() && !content.body.trim() && !target.draft.baseVersionId) {
      target.savedRevision = target.revision;
      publish(target);
      return Promise.resolve(true);
    }
    const revision = target.revision;
    const wasSaved = Boolean(target.draft.baseVersionId);
    pauseClock(); if (mounted.current) { setError(""); setNotice(""); }
    const operation = enqueue(async () => {
      await persist(target, content);
      if (!isNote(kind) && content.body.trim().toLowerCase() === "admin" && onAdmin && !wasSaved) {
        await current.current.commit({ ...header(), type: "discard-draft", draftId: target.draft.id, expectedDraftVersion: target.version });
        publish(null); onAdmin(); return true;
      }
      const receipt = await current.current.commit({ ...header(), type: "save", draft: { ...target.draft, content, version: target.version } });
      if (receipt.outcome === "conflict") {
        target.conflict = true;
        if (receipt.draftId) target.draft.id = receipt.draftId;
        if (receipt.draftVersion !== null) target.version = receipt.draftVersion;
        if (mounted.current) { setError(isNote(kind) ? "Another copy changed. Your text is kept. Review both copies." : "Another copy changed. Your draft is kept. Review both before saving."); back.reset("conflict"); }
        return false;
      }
      if (receipt.outcome !== "saved" && receipt.outcome !== "unchanged") throw new Error("Save was not accepted");
      target.draft.baseVersionId = receipt.versionId;
      target.draft.baseGeneration = receipt.generation;
      target.savedRevision = revision;
      if (!mounted.current || live.current !== target) return true;
      publish(target); setNotice(noteNavigation || target.revision !== revision ? "" : wasSaved ? "Saved on this device." : "Sent.");
      if (!isNote(kind) && !wasSaved && target.revision === revision) {
        setSent(true);
        setRewarded(kind === "deep-thought" && isDeepThoughtRewardEligible({ text: content.body, activeMs: activeMs.current }));
        if (kind === "deep-thought") onSent?.();
        else { acceptedSend.current = target; maybeDepart(); }
      }
      return true;
    }).catch(() => false).finally(() => { saving.current = null; });
    saving.current = operation;
    void operation.then(accepted => {
      if (accepted && isNote(kind) && mounted.current && live.current === target && target.revision !== target.savedRevision) scheduleNoteSave();
    });
    // A departing Note must include typing that arrived while its save was in
    // flight, before New Note is allowed to replace the open buffer.
    return operation.then(accepted => accepted && isNote(kind) && live.current === target && target.revision !== target.savedRevision ? save() : accepted);
  }
  function go(page: Page, element?: HTMLElement) {
    setMenu(false);
    if (noteNavigation && page !== "editor") setNotice("");
    if (isNote(kind) && back.side === "editor" && page !== "editor") {
      void save().then(accepted => { if (accepted && mounted.current) back.flip(page, undefined, element); });
    } else back.flip(page, undefined, element);
  }
  function newNote() {
    if (startingNote.current) return;
    startingNote.current = true;
    void save().then(accepted => {
      if (!accepted || !mounted.current) return;
      publish(null); setFresh(true); setNotice(""); setError(""); go("editor");
      requestAnimationFrame(() => { if (noteContent.current?.parentElement) noteContent.current.parentElement.scrollTop = 0; textareas.current?.querySelector("textarea")?.focus(); });
    }).finally(() => { startingNote.current = false; });
  }
  function openEntry(entry: WritingHistoryEntry, element: HTMLElement) {
    if (noteNavigation && entry.status === "active") { setSelected(entry.id); editEntry(entry); return; }
    if (noteNavigation) setNotice("");
    setSelected(entry.id); go(entry.status === "trashed" ? "trash-detail" : "detail", element);
  }
  function editEntry(entry: WritingHistoryEntry) {
    // Existing open drafts stay in the ledger and can be recovered separately.
    const draft = read.drafts.find(item => item.entryId === entry.id);
    publish({ draft: draft ? { ...draft, content: { ...draft.content } } : {
      id: id(), entryId: entry.id, kind: entry.kind, startedAt: entry.startedAt, attribution: entry.attribution,
      content: { ...entry.content }, source: entry.source, baseVersionId: entry.versionId, baseGeneration: entry.generation,
    }, version: draft?.version || 0, revision: draft ? 1 : 0, savedRevision: 0, conflict: false });
    setFresh(true); setNotice(""); setSent(false); setRewarded(false); go("editor");
    if (isNote(kind) && draft) scheduleNoteSave();
  }
  function discard() {
    const target = ensureSession();
    void enqueue(async () => {
      // Queue follows any pending draft writes, so this discards the shown draft.
      const receipt = await current.current.commit({ ...header(), type: "discard-draft", draftId: target.draft.id, expectedDraftVersion: target.version });
      if (receipt.outcome === "conflict") throw new Error("Draft changed");
      if (live.current === target) publish(null);
      setFresh(true); setError(""); setNotice(kind === "deep-thought" ? "" : "Draft discarded."); go("editor");
    }).catch(() => undefined);
  }
  async function applyLifecycle(type: "trash" | "restore" | "delete", entry: Pick<WritingHistoryEntry, "id" | "generation">) {
    if (!isNote(kind) || live.current?.draft.entryId === entry.id) clearNoteTimer();
    const command: WritingCommand = type === "delete"
      ? { ...header(), type, entryId: entry.id, expectedGeneration: entry.generation, confirmed: true }
      : { ...header(), type, entryId: entry.id, expectedGeneration: entry.generation };
    const receipt = await current.current.commit(command);
    if (receipt.outcome === "conflict") { setError("This entry changed. Review the latest copy and try again."); return; }
    if (!mounted.current) return;
    if (live.current?.draft.entryId === entry.id) publish(null);
    setFresh(true); setError("");
    if (type === "trash") { if (!noteNavigation) setUndo(entry.id); setNotice(noteNavigation ? "" : "Moved to Trash."); go("history"); }
    else { setUndo(null); setNotice(type === "restore" ? "Restored." : "Deleted forever."); go(type === "restore" ? "history" : "trash"); }
  }
  function lifecycle(type: "trash" | "restore" | "delete", entry: WritingHistoryEntry) {
    void enqueue(() => applyLifecycle(type, entry)).catch(() => undefined);
  }
  function trashRecovery(draft: WritingDraft & { content: WritingContent }) {
    // A recovered row can be trashed without opening the editor. Save its exact
    // snapshot first; conflicts/failures retain all text and leave the row here.
    void enqueue(async () => {
      const receipt = await current.current.commit({ ...header(), type: "save", draft });
      if (receipt.outcome === "conflict") { setError("This note changed. Open it to review both copies before moving it to Trash."); return; }
      if (receipt.outcome !== "saved" && receipt.outcome !== "unchanged") throw new Error("Save was not accepted");
      await applyLifecycle("trash", { id: draft.entryId, generation: receipt.generation });
    }).catch(() => undefined);
  }
  function reviewDraft() {
    const target = ensureSession();
    const latest = read.history.find(entry => entry.id === target.draft.entryId);
    if (!latest) { setError(isNote(kind) ? "This entry is no longer active. Your text is kept. Check Trash." : "This entry is no longer active. Your draft is kept. Check Trash."); return; }
    // This explicit choice authorizes a correction of the displayed saved copy.
    target.draft.baseVersionId = latest.versionId; target.draft.baseGeneration = latest.generation;
    target.conflict = false; publish(target); setError(""); setNotice(isNote(kind) ? "" : "Your draft is open. Save changes when ready."); go("editor");
    if (isNote(kind)) scheduleNoteSave();
  }
  function closeQuote() {
    back.flip("editor", () => { setQuote(null); onQuoteNavigation?.(null); });
  }
  function passQuote() {
    if (quoteFeedbackRef.current) closeQuote();
    else { quoteFeedbackRef.current = true; setQuoteFeedback(true); }
  }
  async function openQuote(element: HTMLElement) {
    if (!nextQuote || openingQuote || composing.current || back.flipping) return;
    setOpeningQuote(true); setError("");
    try {
      // Preserve the unfinished answer as a draft, without submitting it.
      await queue.current;
      if (live.current?.conflict) return;
      const selectedQuote = await nextQuote();
      if (!mounted.current) return;
      if (!selectedQuote) { setQuoteError(true); setError("No quotes are available yet."); return; }
      quoteFeedbackRef.current = false; setQuoteFeedback(false);
      back.flip("quote", () => {
        setQuote(selectedQuote);
        onQuoteNavigation?.({ back: closeQuote, forward: passQuote });
      }, element);
    } catch (cause) { if (mounted.current) { setQuoteError(true); setError(cause instanceof Error ? cause.message : "Could not open quotes. Try again."); } }
    finally { if (mounted.current) setOpeningQuote(false); }
  }
  const disabled = pending > 0 || !ready || openingQuote;
  const status = <>{error || writing.error ? <p role="alert">{error || writing.error} <button className="os-writing-action" type="button" disabled={pending > 0 || openingQuote} onClick={event => { setError(""); if (quoteError) { void openQuote(event.currentTarget); return; } void writing.refresh().then(open => { if (open && isNote(kind)) void save(); }); }}>Try again</button></p> : null}<span role="status" aria-live="polite">{noteNavigation ? notice : pending ? "Saving on this device…" : notice}</span></>;
  let body: ReactNode;
  let footer: ReactNode;
  let heading = "";
  if (back.side === "sync") return <WritingSyncPage notes={isNote(kind)} className={`${isNote(kind) ? "os-note-page" : "os-thoughts-page"} ${back.className}`} onBack={() => {
    const target = live.current;
    const latest = [...writing.history, ...writing.trash].find(entry => entry.id === target?.draft.entryId);
    // A reviewed cloud choice may replace this editor's already-saved copy.
    // Only retire a clean buffer; unfinished writing keeps its conflict guard.
    if (target && target.revision === target.savedRevision && (!latest || latest.generation !== target.draft.baseGeneration)) {
      publish(null); setFresh(false); setError("");
    }
    go("history");
  }} />;
  if (back.side === "editor") {
    const input = spentQuestion ? <p>This question was answered.</p> : <textarea aria-label={isNote(kind) ? "Write a note" : embedded ? `Reply to Athena: ${sourceShown?.question || ""}` : sourceShown?.question ? "Answer the deep thought" : "Write a thought"} className={sourceShown?.question ? "os-deep-thought-answer" : "os-regular-thought-input"} disabled={read.status !== "ready"} rows={1} maxLength={isNote(kind) ? undefined : (session?.draft.kind || kind) === "reading-answer" ? 1600 : 800} placeholder={isNote(kind) ? "Write a note..." : placeholder} value={shown.body} onFocus={() => { if (shown.body.trim() && focusAt.current === null) focusAt.current = performance.now(); }} onBlur={pauseClock} onChange={event => change("body", event.currentTarget.value)} />;
    body = <><ButtonRewardBackdrop active={sent && rewarded} styleId="default" /><form id={formId} ref={textareas}
      onFocus={() => setFocused(true)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); if (isNote(kind)) void save(); } }}
      onCompositionStart={() => { composing.current = true; clearNoteTimer(); }}
      onCompositionEnd={() => { composing.current = false; if (isNote(kind)) scheduleNoteSave(); }}
      onSubmit={event => { event.preventDefault(); if (!disabled && (shown.title.trim() || shown.body.trim())) void save(); }} onAnimationEnd={event => { if (event.target === event.currentTarget.firstElementChild || event.animationName === "os-thought-departure") finishDeparture(); }} className={`${isNote(kind) ? "os-inline-checkin-note" : "os-thoughts-form"}${sourceShown?.question ? " deep-compose" : ""}${departing ? " is-departing" : ""} os-writing-editor`}>
      {isNote(kind) ? <><div className="os-info-page-main"><textarea aria-label="Note title" disabled={read.status !== "ready"} className="os-inline-checkin-title" rows={1} placeholder={placeholder} value={shown.title} onChange={event => change("title", event.currentTarget.value)} /></div><div className="os-info-page-sub">{input}</div></> : sourceShown?.question ? <><div className="os-info-page-main os-deep-thought-question-wrap"><h2 className="os-deep-thought-question">{sourceShown.question}</h2></div><div className="os-info-page-sub os-deep-thought-response">{input}</div></> : <div className="os-info-page-main">{input}</div>}
    </form></>;
    footer = <div className="os-writing-footer">{status}{!isNote(kind) ? <>{recovered && !session && kind !== "deep-thought" ? <span>Recovered draft. {<Action text={"Discard draft"} click={discard} disabled={disabled} />}</span> : null}{matchingDrafts.length > 1 && !session ? <Action text={"Review drafts"} click={() => go("drafts")} disabled={disabled} /> : null}
      {kind === "deep-thought" && (editingSaved || spentQuestion) && !dirty && onNextQuestion ? <CreativeButton type="button" disabled={disabled} styleId="default" keepMountedOnSuccess onClick={onNextQuestion}>Next question</CreativeButton> : <CreativeButton disabled={disabled || (!dirty && editingSaved) || (!shown.title.trim() && !shown.body.trim()) || (composingKind === "deep-thought" && !sourceShown?.question)} form={formId} type="submit" release="latch" styleId="default" keepMountedOnSuccess onSuccessComplete={() => { animationDone.current = true; if (kind === "deep-thought") setRewarded(false); else maybeDepart(); }}>{sent && kind !== "deep-thought" ? "Sent" : editingSaved ? "Save changes" : "Send"}</CreativeButton>}</> : <CreativeButton type="button" disabled={read.status !== "ready" || Boolean(session?.conflict)} onClick={newNote} styleId="default" keepMountedOnSuccess>New Note</CreativeButton>}
    </div>;
  } else if (back.side === "history" || back.side === "trash") {
    const list = back.side === "trash" ? trashed : entries;
    // Older recovery buffers stay reachable as ordinary Note rows. They are
    // adopted only when opened; no wording, ownership or dates are invented.
    const rows = [
      ...list.map(entry => ({ key: entry.id, content: entry.content, day: entry.attribution.day, at: entry.createdAt, kind: entry.kind,
        open: (element: HTMLElement) => openEntry(entry, element), trash: noteNavigation && back.side === "history" ? () => lifecycle("trash", entry) : null })),
      ...(noteNavigation && back.side === "history" ? (isNote(kind) ? matchingDrafts : read.drafts.filter(item => belongs(item) && !entries.some(entry => entry.id === item.entryId) && (item.content.title.trim() || item.content.body.trim()))).map(item => ({
        key: item.id, content: item.content, day: item.attribution.day, at: item.updatedAt, kind: item.kind,
        open: () => { publish({ draft: { ...item, content: { ...item.content } }, version: item.version, revision: 1, savedRevision: 0, conflict: false }); setFresh(true); setNotice(""); setSent(false); go("editor"); if (isNote(kind)) scheduleNoteSave(); },
        trash: isNote(kind) ? () => trashRecovery(item) : null,
      })) : []),
    ].sort((a, b) => b.day.localeCompare(a.day) || b.at.localeCompare(a.at) || a.key.localeCompare(b.key));
    heading = back.side === "trash" ? "Trash" : "History";
    let day = "";
    const today = writingAttribution(now(), Intl.DateTimeFormat().resolvedOptions().timeZone).day;
    const previousDay = new Date(`${today}T12:00:00Z`); previousDay.setUTCDate(previousDay.getUTCDate() - 1);
    const dayLabel = (value: string) => value === today ? "Today" : value === previousDay.toISOString().slice(0, 10) ? "Yesterday" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
    body = <div className="os-writing-list os-info-page-main">{back.side === "history" ? <Action text="Writing sync" click={() => go("sync")} disabled={disabled} /> : null}{rows.length ? rows.map(row => {
      const showDay = day !== row.day; day = row.day;
      const entry = [...entries, ...trashed].find(item => item.id === row.key);
      const title = row.kind === "note" ? row.content.title || "Untitled" : entry?.source?.question || row.content.body.slice(0, 100) || "Untitled";
      const open = <button className="os-writing-entry" type="button" onClick={event => row.open(event.currentTarget)}><strong>{title}</strong><span>{noteNavigation ? <><time dateTime={row.at}>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(row.at))}</time>{!isNote(kind) && !entry ? " · Unsent" : null}</> : labelFor(row.kind)}</span></button>;
      return <div key={row.key}>{showDay ? <p className="os-writing-day">{noteNavigation ? dayLabel(day) : day}</p> : null}{row.trash ? <div className="os-writing-history-row">{open}<button className="os-writing-trash-button" type="button" aria-label={`Move ${title} to Trash`} disabled={disabled} onClick={row.trash}><TrashIcon /></button></div> : open}</div>;
    }) : <p>{back.side === "trash" ? "Trash is empty." : "No saved writing yet."}</p>}
      {back.side === "history" ? read.view?.sources.filter(item => item.sourceSystem === "existing" && belongs(item)).map(item => <details key={item.id}><summary>{item.content.title || item.content.body.slice(0, 80) || "Untitled"}</summary><p>{item.content.body}</p><small>{item.attribution.day || "Date unknown"} · Older writing · Read only</small></details>) : null}
    </div>;
    footer = noteNavigation ? error || writing.error || notice ? <div className="os-writing-footer">{status}</div> : undefined : <div className="os-writing-footer">{status}{undo && trashed.find(entry => entry.id === undo) ? <Action text={"Undo"} click={() => lifecycle("restore", trashed.find(entry => entry.id === undo)!)} disabled={disabled} /> : null}{back.side === "history" ? <Action text={"Trash"} click={() => go("trash")} disabled={disabled} /> : null}</div>;
  } else if (back.side === "drafts") {
    heading = "Drafts";
    body = <div className="os-info-page-main os-writing-list">{read.drafts.filter(belongs).map(draft => <button key={draft.id} type="button" onClick={() => { publish({ draft: { ...draft, content: { ...draft.content } }, version: draft.version, revision: 1, savedRevision: 0, conflict: false }); setFresh(true); go("editor"); }}><strong>{draft.content.title || draft.content.body || "Empty draft"}</strong><span>{draft.source?.question || labelFor(draft.kind)}</span></button>)}</div>;
    footer = status;
  } else if (back.side === "conflict") {
    heading = "Review both copies";
    const latest = entries.find(entry => entry.id === session?.draft.entryId);
    body = <div className="os-info-page-main os-writing-review"><h3>{isNote(kind) ? "Your text" : "Your draft"}</h3><p>{shown.title}</p><p>{shown.body}</p><h3>Saved copy</h3><p>{latest?.content.title}</p><p>{latest?.content.body || "This entry is no longer active."}</p></div>;
    footer = <div className="os-writing-footer">{status}{<Action text={isNote(kind) ? "Keep my text" : "Keep editing my draft"} click={reviewDraft} disabled={disabled} />}{!noteNavigation ? <Action text={"Discard draft"} click={discard} disabled={disabled} /> : null}</div>;
  } else if (!isNote(kind) && back.side === "version" && selectedVersion && selectedEntry) {
    heading = `Version ${selectedVersion.sequence}`;
    body = <div className="os-info-page-main os-writing-review"><p>{selectedVersion.savedAt}</p><h2>{selectedVersion.content.title}</h2><p>{selectedVersion.content.body || "Empty writing"}</p></div>;
  } else if (!isNote(kind) && back.side === "versions") {
    heading = "Versions";
    body = <div className="os-info-page-main os-writing-list">{selectedEntry ? versions.map(version => <button key={version.id} type="button" onClick={event => { setSelectedVersion(version); go("version", event.currentTarget); }}><strong>Version {version.sequence}</strong><span>{version.savedAt}</span></button>) : <p>This entry is no longer here.</p>}</div>;
  } else if (back.side === "delete") {
    heading = "Delete forever?";
    body = <div className="os-info-page-main os-writing-review"><p>{isNote(kind) ? "This removes this note from this device. You cannot undo this." : "This removes this saved entry, its versions, and its drafts from this device. You cannot undo this."}</p></div>;
    footer = <div className="os-writing-footer">{status}{selectedEntry ? <Action text={"Delete forever"} click={() => lifecycle("delete", selectedEntry)} disabled={disabled} danger={true} /> : null}{<Action text={"Cancel"} click={() => go("trash-detail")} disabled={disabled} />}</div>;
  } else {
    heading = noteNavigation ? "" : back.side === "trash-detail" ? "In Trash" : "Saved writing";
    if (noteNavigation && selectedEntry) {
      body = <><div className="os-info-page-main os-writing-review"><h2>{selectedEntry.source?.question || selectedEntry.content.title || (isNote(kind) ? "Untitled" : "Thoughts")}</h2></div><div className="os-info-page-sub os-writing-review"><p>{selectedEntry.content.body}</p></div></>;
      footer = <div className={`os-writing-footer${back.side === "trash-detail" ? " is-trash-detail" : ""}`}>{status}{back.side === "trash-detail" ? <><CreativeButton type="button" disabled={disabled} onClick={() => lifecycle("restore", selectedEntry)} styleId="default">Restore</CreativeButton><Action text="Delete forever" click={() => go("delete")} disabled={disabled} /></> : <Action text="Edit" click={() => editEntry(selectedEntry)} disabled={disabled} />}</div>;
    } else {
    body = <div className="os-info-page-main os-writing-review">{selectedEntry ? <><small>{selectedEntry.attribution.day} · {labelFor(selectedEntry.kind)}</small>{selectedEntry.source?.question ? <h2>{selectedEntry.source.question}</h2> : null}<h2>{selectedEntry.content.title}</h2><p>{selectedEntry.content.body || "Empty writing"}</p>{selectedEntry.source?.editionId ? <small>Reading: {selectedEntry.source.editionId}</small> : null}</> : <p>This entry is no longer here.</p>}</div>;
    footer = <div className="os-writing-footer">{status}{selectedEntry ? back.side === "trash-detail" ? <>{<Action text={"Restore"} click={() => lifecycle("restore", selectedEntry)} disabled={disabled} />}{<Action text={"Delete forever"} click={() => go("delete")} disabled={disabled} danger={true} />}</> : <>{<Action text={"Edit"} click={() => editEntry(selectedEntry)} disabled={disabled} />}{<Action text={"Versions"} click={() => { setVersions(writing.versions(selectedEntry.id)); go("versions"); }} disabled={disabled} />}{<Action text={"Move to Trash"} click={() => lifecycle("trash", selectedEntry)} disabled={disabled} />}</> : null}</div>;
    }
  }
  const headerLeft = back.side === "editor" ? <button className="os-card-label" type="button" aria-label={isNote(kind) ? "Show a Line" : kind === "deep-thought" ? "Show Thoughts" : "Show Deep Thoughts"} disabled={disabled || !onLabel} onClick={event => onLabel?.(event.currentTarget)}>{labelFor(kind)}</button> : <button className="os-card-label" type="button" onClick={event => go(back.side === "version" ? "versions" : back.side === "versions" ? "detail" : back.side === "trash-detail" || back.side === "delete" ? "trash" : "editor", event.currentTarget)}>Back</button>;
  const menuButton = <div className="os-writing-menu"><button className="os-card-label" type="button" aria-label="Writing options" aria-expanded={menu} onClick={() => setMenu(!menu)}>More</button>{menu ? <div className="os-writing-menu-items">{<Action text={"History"} click={() => go("history")} disabled={disabled} />}{<Action text={"Drafts"} click={() => go("drafts")} disabled={disabled} />}{<Action text={"Trash"} click={() => go("trash")} disabled={disabled} />}{dirty ? <>{<Action text={"Clear"} click={() => { change("title", ""); change("body", ""); onClear?.(); setMenu(false); }} disabled={disabled} />}{<Action text={"Discard draft"} click={discard} disabled={disabled} />}</> : null}</div> : null}</div>;
  if (kind === "deep-thought" && back.side === "quote" && quote) return <QuotePage className={back.className} quote={quote} feedback={quoteFeedback} onReact={reaction => { onQuoteReaction?.(quote, reaction); closeQuote(); }} />;
  if (noteNavigation) {
    const returnPage: Page = back.side === "delete" ? "trash-detail" : back.side === "trash-detail" ? "trash" : back.side === "trash" ? "history" : "editor";
    const returnLabel = returnPage === "trash" || returnPage === "trash-detail" ? "Trash" : returnPage === "history" ? "History" : labelFor(kind);
    const left = back.side === "editor" ? <button className="os-card-label" type="button" data-os-note-header-text aria-label={isNote(kind) ? "Show a Line" : "Show a Quote"} disabled={!ready || openingQuote || (isNote(kind) ? !onLabel : !nextQuote)} onClick={event => { const element = event.currentTarget; if (!isNote(kind)) { void openQuote(element); return; } void save().then(accepted => { if (accepted && mounted.current) onLabel?.(element); }); }}>{labelFor(kind)}</button> : <button className="os-card-label os-writing-back" type="button" onClick={event => go(returnPage, event.currentTarget)}><span aria-hidden="true">‹</span> {returnLabel}</button>;
    const right = back.side === "history" ? <button className="os-card-label" type="button" onClick={event => go("trash", event.currentTarget)} disabled={disabled}>Trash</button> : back.side === "editor" ? <button className="os-card-label" type="button" data-os-note-header-text onClick={event => go("history", event.currentTarget)} disabled={!ready || openingQuote}>History</button> : undefined;
    return <InfoPage className={`os-writing-page os-writing-bounded ${isNote(kind) ? "os-note-page" : "os-thoughts-page os-deep-thoughts-page"} ${back.className}`} header={left} headerAction={right} heading={heading ? <h2 className="os-writing-heading">{heading}</h2> : undefined} footer={footer}><div className="os-note-content" ref={noteContent}>{body}</div></InfoPage>;
  }
  if (embedded) return <section className="athena-reading-reply-form os-writing-embedded" aria-label="Reading answer"><div className="os-writing-embedded-header">{headerLeft}{menuButton}</div>{heading ? <h3>{heading}</h3> : null}{body}{footer}</section>;
  return <InfoPage className={`os-writing-page ${isNote(kind) ? "os-note-page" : "os-thoughts-page"} ${back.className}`} header={headerLeft} headerAction={menuButton} heading={heading || undefined} footer={footer}>{body}</InfoPage>;
}

export function AccountWritingPage(props: Props) {
  const writing = useWriting();
  return writing ? <WritingPage key={`${writing.owner}:${props.kind}:${props.source?.questionId || ""}`} {...props} writing={writing} /> : null;
}

export function WritingReadingAnswer({ prompt, editionId }: { prompt: { id: string; text: string; target: string }; editionId?: string | null }) {
  return <AccountWritingPage kind="reading-answer" embedded source={{ questionId: prompt.id, question: prompt.text, source: prompt.target, ...(editionId ? { editionId } : {}) }} />;
}
