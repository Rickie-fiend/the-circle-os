"use client";
import { useState } from "react";
import { InfoPage } from "./app-session";
import { useAppBack } from "./app-back";
import { useWritingSync } from "./writing-sync-provider";
import { writingSyncLabel } from "./writing-conflict-model.js";
import { canonicalWriting, type WritingCloudBundle, type WritingSnapshot } from "./writing-cloud-model.js";

function SavedCopy({ snapshot, label }: { snapshot: WritingSnapshot; label: string }) {
  const entry = snapshot.entry;
  if (!entry) return <section><h3>{label}</h3><p>Deleted forever</p></section>;
  const version = entry.versions.at(-1)!;
  return <section className="os-writing-sync-copy"><h3>{label}</h3><p><time dateTime={version.savedAt}>{new Date(version.savedAt).toLocaleString()}</time>{entry.status === "trashed" ? " · In Trash" : ""}</p>
    {entry.source?.question ? <h3>{entry.source.question}</h3> : null}{version.content.title ? <h3>{version.content.title}</h3> : null}<p>{version.content.body || "Empty writing"}</p>
    <details><summary>Saved history</summary>{entry.versions.map(item => <section key={item.id}><time dateTime={item.savedAt}>{new Date(item.savedAt).toLocaleString()}</time><p>{item.content.title}</p><p>{item.content.body || "Empty writing"}</p></section>)}</details></section>;
}
export function WritingSyncPage({ onBack, notes, className = "" }: { onBack: () => void; notes: boolean; className?: string }) {
  const sync = useWritingSync();
  const navigation = useAppBack<"list" | "review">("list");
  const [review, setReview] = useState<{ id: string; bundle: WritingCloudBundle } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bundle = sync?.bundle;
  const remote = review?.bundle.cloud.conflicts[review.id];
  const local = review ? review.bundle.state.entries[review.id] : null;
  const changed = Boolean(review && bundle && (canonicalWriting(bundle.state.entries[review.id]) !== canonicalWriting(local)
    || canonicalWriting(bundle.cloud.conflicts[review.id]) !== canonicalWriting(remote)));
  const queued = Boolean(review && bundle?.cloud.choices?.[review.id]);
  const resolved = Boolean(review && bundle && !bundle.cloud.conflicts[review.id] && !queued);
  const entries = bundle ? Object.values(bundle.state.entries).filter(entry => notes === (entry.kind === "note")) : [];
  const label = !bundle ? "Opening writing sync…" : !sync?.checked && sync?.enabled && !sync.error ? "Waiting to sync" : writingSyncLabel(bundle, sync || {});
  async function choose(choice: "local" | "cloud") {
    if (!review || !sync || busy) return;
    setBusy(true); setError("");
    try { await sync.choose(review.id, choice, review.bundle); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not choose a copy. Both copies are kept."); }
    finally { setBusy(false); }
  }
  const action = (text: string, onClick: () => void, disabled = false) => <button className="os-writing-action" type="button" disabled={disabled} onClick={onClick}>{text}</button>;
  return <InfoPage className={`os-writing-page os-writing-bounded os-writing-sync ${className} ${navigation.className}`} header={<button className="os-card-label os-writing-back" type="button" onClick={event => { if (review) navigation.flip("list", () => { setReview(null); setError(""); }, event.currentTarget); else onBack(); }}><span aria-hidden="true">‹</span> {review ? "Writing sync" : "History"}</button>}
    heading={<h2 className="os-writing-heading">{review ? "Review copies" : "Writing sync"}</h2>}
    footer={<div className="os-writing-footer">{error ? <p role="alert">{error}</p> : null}{review ? queued ? <><p role="status">Your choice is waiting to sync. Both copies are kept.</p>{sync?.error ? <>{<p role="alert">Could not sync your choice.</p>}{action("Try again", () => sync.retry(), sync.running || !sync.online)}</> : null}</> : resolved ? <p role="status">{bundle?.state.tombstones[review.id] ? "Deleted forever." : "Your choice is saved. Both histories are kept below."}</p> : changed ? action("Review updated copies", () => { if (bundle) { setReview({ id: review.id, bundle: structuredClone(bundle) }); setError(""); } }) : <>{action("Use this device’s copy", () => { void choose("local"); }, busy || !sync?.enabled || !sync.online)}{action("Use cloud copy", () => { void choose("cloud"); }, busy || !sync?.enabled || !sync.online)}</> : sync?.enabled || sync?.error ? action("Try again", () => sync?.retry(), sync?.running || !sync?.online) : null}</div>}>
    <div className="os-note-content"><div className="os-info-page-main os-writing-review os-writing-list">
      {!review ? <><p role="status">{label}</p><p>{sync?.enabled ? "This covers saved writing. Unsent drafts stay on this device." : "Cloud sync is off. Saved writing and unsent drafts stay on this device."}</p>
        {sync?.error ? <p role="alert">Could not check writing sync. Your saved writing stays on this device.</p> : null}
        {entries.map(entry => <div key={entry.id}>{bundle?.cloud.conflicts[entry.id] || Object.values(bundle?.cloud.resolved || {}).some(item => item.request.entryId === entry.id) ? <button className="os-writing-entry" type="button" onClick={event => navigation.flip("review", () => { setReview({ id: entry.id, bundle: structuredClone(bundle!) }); setError(""); }, event.currentTarget)}><strong>{entry.versions.at(-1)?.content.title || entry.source?.question || entry.versions.at(-1)?.content.body.slice(0,80) || "Untitled"}</strong><span>{bundle?.cloud.conflicts[entry.id] ? "Review copies" : "Kept histories"}{entry.status === "trashed" ? " · In Trash" : ""}</span></button> : <p>{entry.versions.at(-1)?.content.title || entry.source?.question || entry.versions.at(-1)?.content.body.slice(0,80) || "Untitled"} · {sync?.enabled ? sync.error ? "Could not sync" : !sync.checked || Object.values(bundle?.queue.pending || {}).some(item => item.entryId === entry.id) || !bundle?.cloud.heads[entry.id] ? "Waiting to sync" : "Synced" : "Saved on this device"}</p>}</div>)}
        {!entries.length && bundle ? <p>No saved writing yet.</p> : null}
      </> : <>{!resolved && remote && local ? <>{changed ? <p role="alert">These copies changed. Review them again before choosing.</p> : null}<p>Choose the copy to use now. Both saved histories will be kept.{!sync?.online ? " Connect before choosing." : ""}</p><SavedCopy label="This device" snapshot={{ entry: local, tombstone: null }} /><SavedCopy label="Cloud copy" snapshot={remote.snapshot} /></> : null}
        {Object.values(bundle?.cloud.resolved || {}).filter(item => item.request.entryId === review.id).map(item => <section key={item.request.requestId}><h3>Kept histories</h3><SavedCopy label="This device before the choice" snapshot={item.request.local} /><SavedCopy label="Cloud copy before the choice" snapshot={item.request.cloud.snapshot} /></section>)}
      </>}
    </div></div>
  </InfoPage>;
}
