"use client";

import type { MouseEvent } from "react";
import { PageLayout } from "./app-session";
import type { chapterHistory } from "./chapter-history.js";
import type { QuestView } from "./quests";

function CompletedDate({ value }: { value: string | null }) {
  return value && Number.isFinite(Date.parse(value)) ? <time dateTime={value}>{new Date(value).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  })}</time> : <>Completion date not recorded</>;
}

export function ChapterHistoryPage({ records, selectedId, onBack, onSelect, quest }: {
  records: ReturnType<typeof chapterHistory>;
  selectedId: string | null;
  onBack: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (id: string, source: HTMLButtonElement) => void;
  quest?: QuestView;
}) {
  const step = quest?.steps.find(item => `step:${item.chapterId}` === selectedId);
  const record = records.find(item => item.id === (step ? step.runId : selectedId));
  return <PageLayout className="os-chapter-history-page" theme="dark" placement="content-flow"
    headerLeft={<button className="os-card-label os-chapter-history-back" type="button" onClick={onBack}>
      <span aria-hidden="true">‹</span> {selectedId ? "History" : "Quests"}
    </button>}
    heading={<h2>{record?.title || step?.title || quest?.title || "Chapter History"}</h2>}
  >
    {selectedId ? record ? <article className="os-chapter-history-detail" aria-label="Saved chapter answers">
      <p className="os-chapter-history-date"><CompletedDate value={record.completedAt} /></p>
      {record.answers.map(answer => <section key={answer.id}><h3>{answer.question}</h3><p>{answer.text || "No answer recorded."}</p></section>)}
    </article> : <p>{step?.alreadySetUp ? "Already set up. No chapter answers were saved." : "No chapter answers were saved."}</p> : <div className="os-chapter-history-list" aria-label="Completed chapters">
      {quest ? quest.steps.filter(item => item.done).map(item => <button type="button" key={item.chapterId} onClick={event => onSelect(`step:${item.chapterId}`, event.currentTarget)}>
        <span>{item.title}</span><span className="os-chapter-history-date">{item.alreadySetUp ? "Already set up" : "Completed"}</span>
      </button>) : records.length ? records.map(record => <button type="button" key={record.id} onClick={event => onSelect(record.id, event.currentTarget)}>
        <span>{record.title}</span><span className="os-chapter-history-date"><CompletedDate value={record.completedAt} /></span>
      </button>) : <p>No completed chapter answers saved yet.</p>}
    </div>}
  </PageLayout>;
}
