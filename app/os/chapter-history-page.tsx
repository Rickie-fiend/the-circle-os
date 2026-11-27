"use client";

import type { MouseEvent } from "react";
import { PageLayout } from "./app-session";
import type { chapterHistory, savedChapterAnswers } from "./chapter-history.js";

function CompletedDate({ value }: { value: string | null }) {
  return value && Number.isFinite(Date.parse(value)) ? <time dateTime={value}>{new Date(value).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  })}</time> : <>Completion date not recorded</>;
}

export function SavedChapterAnswers({ answers }: { answers: ReturnType<typeof savedChapterAnswers> }) {
  return answers.length ? answers.map(answer => <section key={answer.id}>
    <h3>{answer.question}</h3><p>{answer.text || "No answer recorded."}</p>
  </section>) : <p>No answers saved.</p>;
}

export function ChapterHistoryPage({ records, selectedId, onBack, onSelect }: {
  records: ReturnType<typeof chapterHistory>;
  selectedId: string | null;
  onBack: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (id: string, source: HTMLButtonElement) => void;
}) {
  const record = records.find(item => item.id === selectedId);
  return <PageLayout className="os-chapter-history-page" theme="dark" placement="content-flow"
    headerLeft={selectedId ? <button className="os-card-label os-chapter-history-back" type="button" onClick={onBack}>
      <span aria-hidden="true">‹</span> History
    </button> : undefined}
    heading={<h2>{record?.title || "Chapter History"}</h2>}
  >
    {selectedId ? record ? <article className="os-chapter-history-detail" aria-label="Saved chapter answers">
      <p className="os-chapter-history-date"><CompletedDate value={record.completedAt} /></p>
      <SavedChapterAnswers answers={record.answers} />
    </article> : <p>No chapter answers were saved.</p> : <div className="os-chapter-history-list" aria-label="Completed chapters">
      {records.length ? records.map(record => <button type="button" key={record.id} onClick={event => onSelect(record.id, event.currentTarget)}>
        <span>{record.title}</span><span className="os-chapter-history-date"><CompletedDate value={record.completedAt} /></span>
      </button>) : <p>No completed chapter answers saved yet.</p>}
    </div>}
  </PageLayout>;
}
