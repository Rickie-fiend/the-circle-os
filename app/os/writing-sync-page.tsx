"use client";
import { useEffect, useState, type ReactNode } from "react";
import { InfoPage } from "./app-session";
import { useAppBack } from "./app-back";
import { CreativeButton } from "./button-engine";
import { useWritingSync } from "./writing-sync-provider";
import { writingSyncLabel } from "./writing-conflict-model.js";
import { canonicalWriting, type WritingCloudBundle, type WritingSnapshot } from "./writing-cloud-model.js";

function CopyWords({ snapshot }: { snapshot: WritingSnapshot }) {
  const entry = snapshot.entry, version = entry?.versions.at(-1);
  return <>{entry?.status === "trashed" ? <small>In Trash</small> : null}{entry?.source?.question ? <h2>{entry.source.question}</h2> : null}{version?.content.title ? <h2>{version.content.title}</h2> : null}<p>{version?.content.body || "Empty writing"}</p></>;
}
export function WritingSyncPage({ onBack, notes, className = "", initialEntryId }: { onBack: () => void; notes: boolean; className?: string; initialEntryId?: string }) {
  const sync = useWritingSync(), navigation = useAppBack<"list" | "review" | "history">(initialEntryId ? "review" : "list");
  const [review, setReview] = useState<{ id: string; bundle: WritingCloudBundle } | null>(() => initialEntryId && sync?.bundle ? { id: initialEntryId, bundle: structuredClone(sync.bundle) } : null);
  const [history, setHistory] = useState<{ label: string; snapshot: WritingSnapshot } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaiting, setAwaiting] = useState<string | null>(null);
  const bundle = sync?.bundle;
  const remote = review?.bundle.cloud.conflicts[review.id], local = review?.bundle.state.entries[review.id];
  const queued = Boolean(review && bundle?.cloud.choices?.[review.id]);
  const changed = Boolean(review && bundle && (canonicalWriting(bundle.state.entries[review.id]) !== canonicalWriting(local)
    || canonicalWriting(bundle.cloud.conflicts[review.id]) !== canonicalWriting(remote)));
  const resolved = Boolean(review && bundle && !bundle.cloud.conflicts[review.id] && !queued);
  const currentEntry = review ? bundle?.state.entries[review.id] : null;
  const historySnapshot = history?.label === "This note" && currentEntry ? { entry: currentEntry, tombstone: null } : history?.snapshot;
  useEffect(() => {
    if (!review || !resolved || awaiting !== review.id || navigation.flipping) return;
    navigation.flip("list", () => { setAwaiting(null); setReview(null); setHistory(null); setError(""); });
  }, [review, resolved, navigation, awaiting]);
  const entries = bundle ? Object.values(bundle.state.entries).filter(entry => notes === (entry.kind === "note")) : [];
  const label = !bundle ? "Opening sync…" : !sync?.checked && sync?.enabled && !sync.error ? "Waiting to sync" : writingSyncLabel(bundle, sync || {});
  async function choose(choice: "local" | "cloud") {
    if (!review || !sync || busy) return;
    setBusy(true); setError(""); setAwaiting(review.id);
    try { await sync.choose(review.id, choice, review.bundle); }
    catch (cause) { setAwaiting(null); setError(cause instanceof Error ? cause.message : "Could not choose a copy."); }
    finally { setBusy(false); }
  }
  const action = (text: string, onClick: () => void, disabled = false) => <CreativeButton type="button" styleId="default" keepMountedOnSuccess disabled={disabled} onClick={onClick}>{text}</CreativeButton>;
  const copy = (snapshot: WritingSnapshot, name: string, key: string) => <button key={key} type="button" className="os-sync-copy" aria-label={`Open ${name} history`} onClick={event => navigation.flip("history", () => setHistory({ label: name, snapshot }), event.currentTarget)}><span className="os-sync-source">{name}</span><CopyWords snapshot={snapshot} /></button>;
  let body: ReactNode, footer: ReactNode;
  if (review && bundle?.state.tombstones[review.id]) {
    body = <p>Deleted forever.</p>;
  } else if (history && navigation.side === "history") {
    body = <div className="os-writing-review"><h3>{history.label}</h3>{historySnapshot?.entry?.versions.slice().reverse().map(version => <section className="os-sync-version" key={version.id}><time dateTime={version.savedAt}>{new Date(version.savedAt).toLocaleString()}</time>{version.content.title ? <h2>{version.content.title}</h2> : null}<p>{version.content.body || "Empty writing"}</p></section>)}</div>;
  } else if (review) {
    body = <div className="os-writing-review">{resolved && currentEntry ? copy({ entry: currentEntry, tombstone: null }, "This note", "current") : null}{!resolved && remote && local ? <>{copy(remote.snapshot, "Cloud", "cloud")}{copy({ entry: local, tombstone: null }, "Device", "device")}</> : null}
      {Object.values(bundle?.cloud.resolved || {}).filter(item => item.request.entryId === review.id).map(item => <section key={item.request.requestId}>{copy(item.request.cloud.snapshot, "Cloud", "cloud")}{copy(item.request.local, "Device", "device")}</section>)}</div>;
    if (queued) footer = sync?.error && !sync.running ? <><p role="alert">Could not sync.</p>{action("Try again", () => sync.retry(), !sync.online)}</> : <p role="status">Syncing…</p>;
    else if (!resolved) footer = changed ? action("Review updated copies", () => { if (bundle) { setReview({ id: review.id, bundle: structuredClone(bundle) }); setError(""); } }) : <>{action("Use Cloud", () => { void choose("cloud"); }, busy || !sync?.enabled || !sync.online)}{action("Use Device", () => { void choose("local"); }, busy || !sync?.enabled || !sync.online)}</>;
  } else {
    body = <div className="os-writing-list"><p role="status">{label}</p>{!sync?.enabled ? <p>Cloud sync is off.</p> : null}{sync?.error ? <p role="alert">Could not check writing sync.</p> : null}
      {entries.map(entry => {
        const conflict = bundle?.cloud.conflicts[entry.id], kept = Object.values(bundle?.cloud.resolved || {}).some(item => item.request.entryId === entry.id);
        const title = entry.versions.at(-1)?.content.title || entry.source?.question || entry.versions.at(-1)?.content.body.slice(0,80) || "Untitled";
        return conflict || kept ? <button key={entry.id} className="os-writing-entry" type="button" onClick={event => navigation.flip("review", () => { setReview({ id: entry.id, bundle: structuredClone(bundle!) }); setError(""); }, event.currentTarget)}><strong>{title}</strong><span>{conflict ? "Review copies" : "Synced"}</span></button> : <p key={entry.id}>{title}</p>;
      })}{!entries.length && bundle ? <p>No saved writing yet.</p> : null}</div>;
    if (sync?.error && !sync.running) footer = action("Try again", () => sync.retry(), !sync.online);
  }
  return <InfoPage className={`os-writing-page os-writing-bounded os-writing-sync ${className} ${navigation.className}`} header={<button className="os-card-label os-writing-back" type="button" onClick={event => {
    if (navigation.side === "history") navigation.flip("review", () => setHistory(null), event.currentTarget);
    else if (review && !initialEntryId) navigation.flip("list", () => { setReview(null); setError(""); }, event.currentTarget);
    else onBack();
  }}><span aria-hidden="true">‹</span> {navigation.side === "history" ? "Copies" : review && !initialEntryId ? "Sync" : "History"}</button>}
    footer={footer || error ? <div className="os-writing-footer">{error ? <p role="alert">{error}</p> : null}{footer}</div> : undefined}>
    <div className="os-note-content"><div className="os-info-page-main">{body}</div></div>
  </InfoPage>;
}
