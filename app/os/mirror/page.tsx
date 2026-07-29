"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  createSampleState,
  minutesBetween,
  summarizeWeek,
} from "../circle-os-model.js";
import {
  OSFrame,
  useCircleState,
  type TimeBlock,
} from "../circle-os-shell";

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function activityClass(activity: string) {
  return `activity-${activity.toLowerCase().replace(/\s+/g, "-")}`;
}

export default function CircleOSMirror() {
  const { state } = useCircleState();
  const [showSample, setShowSample] = useState(false);
  const sampleState = useMemo(() => createSampleState(), []);
  const summary = summarizeWeek(showSample ? sampleState : state);
  const hasEvidence = summary.coverage.recorded > 0 || summary.totalMinutes > 0;

  return (
    <OSFrame active="mirror">
      <main className="os-mirror">
        <header className="mirror-intro">
          <div>
            <p className="os-eyebrow">Vision · last seven days</p>
            <h1>Your life in view</h1>
          </div>
          <button type="button" onClick={() => setShowSample(!showSample)}>
            {showSample ? "My week" : "See sample"}
          </button>
        </header>

        {showSample ? (
          <div className="mirror-sample-note" role="status">
            Sample data
          </div>
        ) : null}

        <section className="mirror-summary-card" aria-labelledby="mirror-sentence">
          <p className="os-card-label">Pattern</p>
          <h2 id="mirror-sentence">{summary.sentence}</h2>
          <div className="week-ribbon" aria-label="Data coverage">
            {summary.days.map((item) => (
              <article key={item.key}>
                <span>{item.label}</span>
                <div aria-label={`${item.recordedPeriods} of 4 periods recorded`}>
                  {[0, 1, 2, 3].map((period) => (
                    <i
                      className={period < item.recordedPeriods ? "recorded" : ""}
                      key={period}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="coverage-line">
            <strong>{summary.coverage.percent}%</strong>
            Data coverage · {summary.coverage.recorded}/28 check-ins
          </p>
        </section>

        <section className="mirror-card mirror-time" aria-labelledby="time-heading">
          <div className="mirror-card-head">
            <div>
              <p className="os-card-label">Time</p>
              <h2 id="time-heading">Where it went</h2>
            </div>
            <strong>{formatMinutes(summary.totalMinutes)}</strong>
          </div>

          <div className="time-river">
            {summary.days.map((item) => (
              <div className="time-river-day" key={item.key}>
                <span>{item.label}</span>
                <div className="time-river-track">
                  {item.day.timeBlocks.length ? (
                    item.day.timeBlocks.map((block: TimeBlock) => {
                      const minutes = minutesBetween(block.start, block.end);
                      return (
                        <i
                          className={activityClass(block.activity)}
                          key={block.id}
                          style={{ flexGrow: Math.max(15, minutes) }}
                          title={`${block.activity}: ${formatMinutes(minutes)}`}
                        />
                      );
                    })
                  ) : (
                    <em />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="time-allocation">
            {summary.time.length ? (
              summary.time.slice(0, 4).map((item) => (
                <div key={item.activity}>
                  <span className={activityClass(item.activity)} aria-hidden="true" />
                  <p>{item.activity}</p>
                  <strong>{formatMinutes(item.minutes)}</strong>
                </div>
              ))
            ) : (
              <p className="mirror-empty">Nothing logged yet.</p>
            )}
          </div>
        </section>

        <section
          className="mirror-card mirror-energy"
          aria-labelledby="energy-heading"
        >
          <div className="mirror-card-head">
            <div>
              <p className="os-card-label">Energy</p>
              <h2 id="energy-heading">Your rhythm</h2>
            </div>
          </div>
          <div className="energy-chart">
            {summary.energy.map((item) => (
              <div key={item.period}>
                <div className="energy-plot">
                  {item.value ? (
                    <i
                      style={
                        {
                          "--energy-height": `${(item.value / 5) * 100}%`,
                        } as CSSProperties
                      }
                    />
                  ) : (
                    <em>—</em>
                  )}
                </div>
                <strong>{item.value ? item.value.toFixed(1) : "—"}</strong>
                <span>{item.label.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mirror-card mirror-life" aria-label="Mood and identity">
          <div className="mirror-life-block">
            <p className="os-card-label">Mood</p>
            <h2>Mood field</h2>
            <div className="mood-list">
              {summary.moods.length ? (
                summary.moods.slice(0, 4).map((item) => (
                  <span key={item.mood}>
                    {item.mood} <strong>{item.count}</strong>
                  </span>
                ))
              ) : (
                <span>Nothing logged yet.</span>
              )}
            </div>
          </div>
          <div className="mirror-life-block">
            <p className="os-card-label">Becoming</p>
            <h2>{summary.identity.focus}</h2>
            <p className="identity-compact">
              <strong>{summary.identity.evidenceCount}</strong>
              pieces of evidence
            </p>
          </div>
        </section>

        <section className="mirror-next" aria-labelledby="next-heading">
          <p className="os-card-label">Try next</p>
          <h2 id="next-heading">{summary.experiment}</h2>
          {!hasEvidence && !showSample ? (
            <Link href="/os">Check in now <span>→</span></Link>
          ) : null}
        </section>
      </main>
    </OSFrame>
  );
}
