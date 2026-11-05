"use client";

import type { MouseEvent } from "react";
import { PageLayout } from "./app-session";
import type { weekHistory } from "./week-history.js";

export function WeekHistoryPage({ weeks, selectedWeek, onBack, onSelect }: {
  weeks: ReturnType<typeof weekHistory>;
  selectedWeek: string | null;
  onBack: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (weekKey: string, source: HTMLButtonElement) => void;
}) {
  const week = weeks.find(item => item.weekKey === selectedWeek);
  return <PageLayout
    className="os-log-page os-week-history-page"
    headerLeft={<button className="os-card-label os-log-history-label" type="button" onClick={onBack}>
      <span aria-hidden="true">‹</span> {selectedWeek ? "History" : "Week"}
    </button>}
    heading={<h2>{selectedWeek ? `Week of ${selectedWeek}` : "History"}</h2>}
    placement="content-flow" theme="dark"
  >
    {selectedWeek ? week ? <div className="os-week-history-detail" aria-label={`Saved week ${week.weekKey}`}>
      <section aria-label="Saved goals"><h3>Goals</h3>
        {week.goals.length ? week.goals.map(goal => <article key={goal.id}>
          <p>{goal.text || "Untitled goal"}</p><p className="os-log-history-date">{goal.done ? "Completed" : "Open"}</p>
          {goal.steps.length ? <ul>{goal.steps.map(step => <li key={step.id}>
            <p>{step.text || "Step unavailable"}</p>
            <p className="os-log-history-date">{step.dateKey || "Date not recorded"} · {step.status === "completed" ? "Completed" : step.status === "archived" ? "Archived" : step.status === "missing" ? "Task unavailable" : "Open"}</p>
          </li>)}</ul> : null}
        </article>) : <p>No goals saved.</p>}
      </section>
      <section aria-label="Saved review"><h3>Review</h3>
        {week.review ? <>
          {week.review.reviewedAt && Number.isFinite(Date.parse(week.review.reviewedAt)) ? <p className="os-log-history-date">Recorded <time dateTime={week.review.reviewedAt}>{new Date(week.review.reviewedAt).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></p> : null}
          <dl>{[
            ["Did it happen?", week.review.kept === true ? "Yes" : week.review.kept === false ? "No" : "Not recorded"],
            ["Which part of life did it feed?", week.review.fed === "" ? "None" : week.review.fed],
            ["What moved?", week.review.moved], ["What got in the way?", week.review.blocked], ["What will you keep?", week.review.keep],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not recorded"}</dd></div>)}</dl>
        </> : <p>No review saved.</p>}
      </section>
    </div> : <p>This week has no saved records.</p> : <div className="os-log-history-list" aria-label="Recorded weeks">
      {weeks.length ? weeks.map(item => <button type="button" key={item.weekKey} onClick={event => onSelect(item.weekKey, event.currentTarget)}>
        <span>Week of {item.weekKey}</span>
      </button>) : <p>No past weeks recorded yet.</p>}
    </div>}
  </PageLayout>;
}
