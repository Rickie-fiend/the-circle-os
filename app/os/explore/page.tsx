"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ContentRequest, PublishedImages } from "../admin/content-media";
import { getAccountScope, getServerAccountScope, subscribeAccountScope } from "../account-scope.js";
import { useCatalogRequest } from "../catalog/request";
import { isChapterSyncPilot } from "../chapters/chapter-sync-pilot";
import { chapterReviewHref } from "../chapters/chapter-sync-review";
import { readChapterSync, watchChapterSync } from "../chapters/chapter-sync-store";
import type { ChapterRun } from "../chapters/chapter-types";
import { ExploreCarousel, type ExploreItem } from "./carousel";

export default function CircleOSExplore() {
  const scope = useSyncExternalStore(subscribeAccountScope, getAccountScope, getServerAccountScope);
  return <ExploreCatalog key={scope.epoch} />;
}

function ExploreCatalog() {
  const request = useCatalogRequest();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Opening Explore…");
  const [chapterCopies, setChapterCopies] = useState<ChapterRun[]>([]);

  useEffect(() => {
    const scope = getAccountScope();
    if (scope.kind !== "account" || !isChapterSyncPilot(window.location.hostname)) return;
    let active = true;
    const refresh = () => void readChapterSync(scope).then(ledger => {
      if (active) setChapterCopies(Object.values(ledger).filter(entry => entry.competing || entry.reviewed?.length).map(entry => entry.run));
    }).catch(() => {});
    refresh();
    const unsubscribe = watchChapterSync(scope, refresh);
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    void request("/os/catalog?view=explore").then(async response => {
      if (response.status === 401 || response.status === 403) throw Error("Sign in to browse Explore.");
      if (!response.ok) throw Error("Could not open Explore. Try again.");
      const data = await response.json();
      if (!Array.isArray(data)) throw Error("Could not open Explore. Try again.");
      if (active) { setItems(data.filter(item => !item.withdrawn)); setStatus("ready"); setMessage(""); }
    }).catch(error => {
      if (active) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Could not open Explore. Try again."); }
    });
    return () => { active = false; };
  }, [request, attempt]);

  return <ContentRequest.Provider value={request}><PublishedImages.Provider value={true}>
    <main className="os-explore" aria-label="Explore" aria-busy={status === "loading"}>
      {message ? <div className="os-explore-status" role={status === "error" ? "alert" : "status"}>{message}{status === "error" ? <button type="button" onClick={() => { setStatus("loading"); setMessage("Opening Explore…"); setAttempt(value => value + 1); }}>Try again</button> : null}</div> : null}
      <ExploreCarousel title="Chapters" items={items.filter(item => item.kind === "chapter")} />
      {chapterCopies.length > 0 && <ul className="os-explore-status" aria-label="Saved Chapter copies">
        {chapterCopies.map(run => {
          const item = items.find(item => item.id === run.chapterId && item.version === run.chapterVersion);
          return <li key={run.runId}><a className="os-chapter-review-link" href={chapterReviewHref(run.chapterId, run.chapterVersion)}>
            Review answers{item?.title ? ` · ${item.title}` : ""}
          </a></li>;
        })}
      </ul>}
      <ExploreCarousel title="Habit/Protocol" items={items.filter(item => item.kind === "routine-template" || item.kind === "protocol-template")} />
      <ExploreCarousel title="Articles" items={items.filter(item => item.kind === "article")} />
    </main>
  </PublishedImages.Provider></ContentRequest.Provider>;
}
