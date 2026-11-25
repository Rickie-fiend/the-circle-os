"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAccountScope } from "../account-scope";
import { PageLayout } from "../app-session";
import { savedChapterAnswers } from "../chapter-history.js";
import { SavedChapterAnswers } from "../chapter-history-page";
import { useCatalogRequest } from "../catalog/request";
import { isChapterSyncPilot } from "./chapter-sync-pilot";
import { chooseChapterCopy, readChapterSync, watchChapterSync, type ChapterCopies, type ChapterSyncEntry } from "./chapter-sync-store";
import type { ChapterDefinition } from "./chapter-types";

export function chapterReviewHref(id: string, version: number) {
  return "/os/catalog/read?" + new URLSearchParams({ id, version: String(version), review: "1" });
}

export function ChapterSyncReview({ id, version }: { id: string; version: number }) {
  const request = useCatalogRequest();
  const [entry, setEntry] = useState<ChapterSyncEntry>();
  const [chapter, setChapter] = useState<ChapterDefinition>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const scope = getAccountScope();
    if (scope.kind !== "account" || !isChapterSyncPilot(window.location.hostname)) return;
    let active = true;
    function refresh() {
      void readChapterSync(scope).then(ledger => {
        if (active) setEntry(ledger[`${id}@${version}`]);
      }).catch(() => {
        if (active && !scope.signal.aborted) setError("Could not open saved answers. Reopen this page to try again.");
      }).finally(() => { if (active) setLoading(false); });
    }
    refresh();
    const unwatch = watchChapterSync(scope, refresh);
    function readEdition() {
      void request("/os/catalog?" + new URLSearchParams({ id, version: String(version) })).then(async response => {
        if (!response.ok) return;
        const definition = (await response.json()).content?.chapter as ChapterDefinition | undefined;
        if (active && definition?.id === id && definition.version === version) setChapter(definition);
      }).catch(() => {});
    }
    if (navigator.onLine) readEdition();
    window.addEventListener("online", readEdition);
    return () => { active = false; unwatch(); window.removeEventListener("online", readEdition); };
  }, [id, version, request]);

  async function choose(useDevice: boolean) {
    if (!entry || saving) return;
    const scope = getAccountScope();
    setError("");
    setSaving(true);
    try {
      await chooseChapterCopy(scope, entry, useDevice);
    } catch (problem) {
      if (!scope.signal.aborted) setError(problem instanceof Error ? problem.message : "Could not save your choice. Try again.");
    } finally {
      if (!scope.signal.aborted) setSaving(false);
    }
  }

  const copies = ({ synced, device }: ChapterCopies) => <>
    <section aria-label="Synced answers">
      <h3>Synced answers</h3>
      <SavedChapterAnswers answers={savedChapterAnswers(synced, chapter)} />
    </section>
    <section aria-label="On this device">
      <h3>On this device</h3>
      <SavedChapterAnswers answers={savedChapterAnswers(device, chapter)} />
    </section>
  </>;
  const readHref = "/os/catalog/read?" + new URLSearchParams({ id, version: String(version) });
  return <PageLayout theme="dark" placement="content-flow" className="os-chapter-history-page"
    headerLeft={<Link href="/os/explore" className="os-card-label os-chapter-history-back">‹ Explore</Link>}
    heading={<h2>{chapter?.title || "Chapter answers"}</h2>}>
    <div className="os-chapter-history-detail os-chapter-copy-review">
      {error && <p role="alert">{error}</p>}
      {entry?.competing ? <>
        {entry.choice ? <p role="status">Choice saved on this device. Waiting to sync.</p>
          : entry.reviewAgain ? <p role="status">The synced answers changed. Review both copies again.</p> : null}
        {copies({ synced: entry.run, device: entry.competing })}
        {entry.run.status === "completed" ? <p>Chapter complete.</p> : !entry.choice && <div className="os-chapter-copy-actions">
          <button type="button" disabled={saving} onClick={() => void choose(false)}>Use synced answers</button>
          {entry.competing.status === "in-progress" && <button type="button" disabled={saving} onClick={() => void choose(true)}>Use this device’s answers</button>}
        </div>}
      </> : loading ? <p role="status">Opening saved answers…</p> : entry?.reviewed?.length ? <>
        <p role="status">Choice synced.</p>
        {entry.run.status === "in-progress" && <a className="os-chapter-review-link" href={readHref}>Continue Chapter</a>}
      </> : !error && <p>No saved copies to review.</p>}
      {entry?.reviewed?.length ? <details>
        <summary>Saved copies</summary>
        {entry.reviewed.map((review, index) => <article key={index}>{copies(review)}</article>)}
      </details> : null}
    </div>
  </PageLayout>;
}
