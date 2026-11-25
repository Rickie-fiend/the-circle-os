"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type FormEvent } from "react";
import { PageLayout } from "./app-session";
import { useAppBack } from "./app-back";
import { CreativeButton } from "./button-engine";
import { RoutineHeaderButton } from "./routine-controls";
import { sizeTextAreaToContent } from "./text-area-size";
import type { TimeBlock } from "./circle-os-shell";
import { canUseLogDeviceWords, type LogConflict, type LogCopyPair } from "./log-sync-store";
import { logBlockSignature, logEntryWords, logHistoryWeekday, type logHistoryDays, type LogCorrection, type LogCorrectionRequest } from "./log-history.js";

type Draft = { id: string; blockId: string; expected: string; title: string; moments: string; start: string; end: string };

function LogCopies({ pair }: { pair: LogCopyPair }) {
  return ([
    ["Synced entry", pair.saved], ["On this device", pair.device],
  ] as const).map(([label, copy]) => {
    const { title, moments } = logEntryWords(copy.block);
    return <section aria-label={label} key={label}>
      <h3>{label}</h3>
      <p className="os-log-history-date">{copy.dateKey} · {copy.block.start}–{copy.block.end}</p>
      {copy.cleared ? <p>Entry cleared.</p> : <>{title && <p>{title}</p>}
        {moments.map((moment, index) => <p key={index}>{moment}</p>)}</>}
    </section>;
  });
}

function LogCopyReview({ pair, onChoose }: { pair: LogConflict; onChoose: (pair: LogConflict, useDevice: boolean) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function choose(useDevice: boolean) {
    if (saving) return;
    setSaving(true);
    setError("");
    try { await onChoose(pair, useDevice); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Could not save your choice. Try again."); }
    finally { setSaving(false); }
  }
  return <details className="os-log-sync-review">
    <summary>Review Log copies · {pair.device.dateKey} · {pair.device.block.start}</summary>
    {pair.waiting ? <p role="status">Choice saved on this device. Waiting to sync.</p>
      : pair.reviewAgain && <p role="status">The synced entry changed. Review both copies again.</p>}
    <LogCopies pair={pair} />
    {!pair.waiting && <div className="os-log-sync-actions">
      <button type="button" disabled={saving} onClick={() => void choose(false)}>Use synced entry</button>
      {canUseLogDeviceWords(pair) && <button type="button" disabled={saving} onClick={() => void choose(true)}>Use this device’s words</button>}
    </div>}
    {error && <p role="alert">{error}</p>}
  </details>;
}

export function LogHistoryPage({ days, selectedDay, sourceDay, todayKey, onBack, onSelect, onSave, backLabel, conflicts = [], savedCopies = [], onChooseCopy }: {
  days: ReturnType<typeof logHistoryDays>;
  selectedDay: string | null;
  sourceDay?: { title?: string; timeBlocks: TimeBlock[]; logCorrections?: Record<string, LogCorrection> };
  todayKey: string;
  onBack: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (dateKey: string, source: HTMLButtonElement) => void;
  onSave: (request: LogCorrectionRequest) => Promise<void>;
  backLabel?: string;
  conflicts?: LogConflict[];
  savedCopies?: LogCopyPair[];
  onChooseCopy?: (pair: LogConflict, useDevice: boolean) => Promise<void>;
}) {
  const editor = useAppBack<"reading" | "editing">("reading");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const source = useRef<HTMLElement | null>(null);
  const formId = useId();
  const day = days.find((item) => item.dateKey === selectedDay)
    || (selectedDay && sourceDay ? { dateKey: selectedDay, title: sourceDay.title || "", blocks: [] } : undefined);
  const current = sourceDay?.timeBlocks.find((block) => block.id === draft?.blockId);
  const receipt = draft ? sourceDay?.logCorrections?.[draft.id] : undefined;
  const stale = Boolean(draft && !receipt && logBlockSignature(current) !== draft.expected);
  const editing = editor.side === "editing" && draft;

  useLayoutEffect(() => {
    form.current?.querySelectorAll("textarea").forEach(sizeTextAreaToContent);
  }, [draft, editor.side]);

  useEffect(() => {
    if (receipt) editor.flip("reading", () => { setDraft(null); setPending(false); }, source.current);
  }, [receipt, editor]);

  function begin(blockId: string, target: HTMLButtonElement) {
    const block = sourceDay?.timeBlocks.find((item) => item.id === blockId);
    if (!block) return;
    editor.flip("editing", () => {
      setDraft({ id: crypto.randomUUID(), blockId, expected: logBlockSignature(block), title: block.title || block.activity || "",
        moments: (block.moments?.length ? block.moments : block.note ? [block.note] : []).join("\n"), start: block.start, end: block.end });
      setPending(false); setError("");
    }, target);
  }

  function cancel(target: HTMLButtonElement) {
    editor.flip("reading", () => { setDraft(null); setPending(false); setError(""); }, target);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !selectedDay || !current || stale || pending) return;
    const title = draft.title.trim(), moments = draft.moments.split("\n").map((text) => text.trim()).filter(Boolean);
    source.current = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const original = logEntryWords(current);
    if (title === original.title && JSON.stringify(moments) === JSON.stringify(original.moments)) {
      editor.flip("reading", () => setDraft(null), source.current); return;
    }
    const at = new Date().toISOString();
    if (selectedDay >= todayKey || Date.parse(at) <= Date.parse(current.updatedAt || current.createdAt)) {
      setError("This entry has a newer change. Cancel and open it again."); return;
    }
    setPending(true);
    void onSave({ id: draft.id, blockId: draft.blockId, expected: draft.expected, dateKey: selectedDay, title, moments, at }).catch(problem => {
      setPending(false);
      setError(problem instanceof Error ? problem.message : "Could not save your correction. Try again.");
    });
  }

  return (
    <PageLayout
      className={`os-log-page os-log-history-page ${editor.className}`}
      headerLeft={<RoutineHeaderButton reflectionDirection="back" className="os-card-label os-log-history-label" onClick={editing ? (event) => cancel(event.currentTarget) : onBack}>
        <span aria-hidden="true">‹</span> {editing ? "Cancel" : backLabel || (selectedDay ? "History" : "Log")}
      </RoutineHeaderButton>}
      heading={day ? <><h2>{day.title || logHistoryWeekday(day.dateKey)}</h2><p className="os-log-history-date">{day.dateKey}</p></> : <h2>History</h2>}
      footer={editing ? <CreativeButton key={draft.id} type="submit" form={formId} styleId="default" keepMountedOnSuccess disabled={pending || stale || editor.flipping}>Save changes</CreativeButton> : undefined}
      placement="content-flow"
      theme="dark"
    >
      {editing ? (
        <form className="os-log-correction-form" id={formId} ref={form} onSubmit={submit}>
          <p className="os-log-history-date">{draft.start}–{draft.end}</p>
          <label>Activity<textarea aria-label="Past activity" rows={1} value={draft.title} disabled={pending}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label>Moments<textarea aria-label="Past moments" rows={1} value={draft.moments} disabled={pending}
            onChange={(event) => setDraft({ ...draft, moments: event.target.value })} /></label>
          {stale || error ? <p role="alert">{stale ? "This entry changed. Cancel and open it again." : error}</p> : null}
        </form>
      ) : selectedDay ? day ? (
        <div className="os-timeline" aria-label={`Log for ${day.dateKey}`}>
          {day.blocks.length ? day.blocks.map((block) => (
            <article className="filled" key={block.id}>
              <div className="os-time-range"><strong>{block.start}</strong><span>{block.end}</span></div>
              <button type="button" className="os-log-history-copy" aria-label={`Edit entry at ${block.start}`} onClick={(event) => begin(block.id, event.currentTarget)}>
                {block.title ? <p>{block.title}</p> : null}
                {block.moments.length ? <ul>{block.moments.map((moment, index) => <li key={index}>{moment}</li>)}</ul> : null}
              </button>
            </article>
          )) : <p>No activities recorded.</p>}
        </div>
      ) : <p>This day has no saved Log.</p> : (
        <div className="os-log-history-list" aria-label="Recorded Log days">
          {onChooseCopy && conflicts.map(pair => <LogCopyReview key={pair.id} pair={pair} onChoose={onChooseCopy} />)}
          {savedCopies.length > 0 && <details className="os-log-sync-review">
            <summary>Saved copies</summary>
            {savedCopies.map(pair => <article key={pair.id}><LogCopies pair={pair} /></article>)}
          </details>}
          {days.length ? days.map((record) => (
            <button key={record.dateKey} onClick={(event) => onSelect(record.dateKey, event.currentTarget)} type="button">
              <span>{record.title || logHistoryWeekday(record.dateKey)}</span>
              <span className="os-log-history-date">{record.dateKey}</span>
            </button>
          )) : !conflicts.length && !savedCopies.length && <p>No past days recorded yet.</p>}
        </div>
      )}
    </PageLayout>
  );
}
