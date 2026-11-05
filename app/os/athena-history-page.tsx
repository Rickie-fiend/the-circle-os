"use client";

import type { MouseEvent } from "react";
import { PageLayout } from "./app-session";

export type AthenaSavedEdition = {
  id: string;
  publishedAt: string | null;
  cover: string;
  pages: Record<"days" | "alive" | "shape", { heading: string; text: string; paragraphs: string[] }[]>;
};

function EditionDate({ value }: { value: string | null }) {
  if (!value || !Number.isFinite(Date.parse(value))) return <>Date not recorded</>;
  return <time dateTime={value}>{new Date(value).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  })}</time>;
}

export function AthenaHistoryPage({ editions, selectedId, onBack, onSelect }: {
  editions: AthenaSavedEdition[];
  selectedId: string | null;
  onBack: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (id: string, source: HTMLButtonElement) => void;
}) {
  const edition = editions.find(item => item.id === selectedId);
  return <PageLayout
    className="athena-history-page"
    headerLeft={<button className="os-card-label athena-history-back" type="button" onClick={onBack}>
      <span aria-hidden="true">‹</span> {selectedId ? "History" : "Athena’s Reading"}
    </button>}
    heading={<h2>{selectedId ? "Reading" : "History"}</h2>}
    placement="content-flow" theme="dark"
  >
    {selectedId ? edition ? <article className="athena-history-detail" aria-label="Saved reading">
      <p className="athena-history-date"><EditionDate value={edition.publishedAt} /></p>
      {edition.cover ? <p className="athena-history-cover">{edition.cover}</p> : null}
      {([ ["days", "Your days"], ["alive", "What feels alive"], ["shape", "Your shape"] ] as const).map(([key, label]) =>
        <section aria-label={label} key={key}>
          <h3>{label}</h3>
          {edition.pages[key].length ? edition.pages[key].map((section, index) => <section key={index}>
            {section.heading ? <h4>{section.heading}</h4> : null}
            {(section.paragraphs.length ? section.paragraphs : [section.text]).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          </section>) : <p className="athena-history-date">No saved words for this part.</p>}
        </section>)}
    </article> : <p>This reading is no longer on this device.</p> : <div className="athena-history-list" aria-label="Saved readings">
      {editions.length ? editions.map(item => <button type="button" key={item.id} onClick={event => onSelect(item.id, event.currentTarget)}>
        <span className="athena-history-date"><EditionDate value={item.publishedAt} /></span>
        <span>{item.cover || "Reading"}</span>
      </button>) : <p>No saved readings yet.</p>}
    </div>}
  </PageLayout>;
}
