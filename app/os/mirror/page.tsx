"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import {
  buildVisionAnalysis,
  minutesBetween,
  summarizeWeek,
} from "../circle-os-model.js";
import {
  OSFrame,
  useCircleState,
  type TimeBlock,
} from "../circle-os-shell";

const ACTIVITY_COLORS = [
  "activity-focus",
  "activity-reading",
  "activity-exercise",
  "activity-outside",
  "activity-social",
  "activity-rest",
];

function activityColor(index: number) {
  return ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export default function CircleOSMirror() {
  const { state, ready, updateProfile } = useCircleState();
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    age: "",
    description: "",
  });
  const summary = summarizeWeek(state);
  const analysis = buildVisionAnalysis(state);
  const setupComplete = Boolean(
    ready &&
      state.profile.name &&
      state.profile.age &&
      state.profile.vision.completedAt,
  );

  function saveFirstVision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const age = Number(draft.age);
    if (!draft.name.trim() || !draft.description.trim()) {
      setError("Please answer all three.");
      return;
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("Please enter your age.");
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      name: draft.name.trim(),
      age,
      vision: {
        description: draft.description.trim(),
        preview: draft.description.trim(),
        understanding: "",
        gap: "",
        completedAt: new Date().toISOString(),
      },
    }));
    setError("");
  }

  function saveVisionField(
    field: "preview" | "understanding" | "gap",
    value: string,
  ) {
    const text = value.trim();
    if (!text) return;
    updateProfile((profile) => ({
      ...profile,
      vision: {
        ...profile.vision,
        [field]: text,
      },
    }));
  }

  if (!setupComplete) {
    return (
      <OSFrame active="mirror">
        <main className="os-mirror os-setup">
          <section className="vision-survey" aria-labelledby="vision-start">
            <p className="os-eyebrow">Vision</p>
            <h1 id="vision-start">Describe the life you want.</h1>
            <form className="profile-form" onSubmit={saveFirstVision}>
              <label>
                <span>Name</span>
                <input
                  autoComplete="name"
                  autoFocus
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Age</span>
                <input
                  inputMode="numeric"
                  min="1"
                  max="120"
                  type="number"
                  value={draft.age}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      age: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Describe your typical Tuesday</span>
                <textarea
                  rows={6}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <small>
                  Imagine a normal day in the life you want. Where are you?
                  What do you do? Who is with you? How does it feel? One
                  paragraph is enough.
                </small>
              </label>
              {error ? <p className="vision-error">{error}</p> : null}
              <button type="submit">Begin</button>
            </form>
          </section>
        </main>
      </OSFrame>
    );
  }

  return (
    <OSFrame active="mirror">
      <main className="os-mirror">
        <header className="vision-intro">
          <div>
            <p className="os-eyebrow">Vision</p>
            <h1>Your typical Tuesday</h1>
            <p className="vision-profile">
              {state.profile.name}, {state.profile.age}
            </p>
          </div>
        </header>

        <section className="vision-preview-card" aria-label="Typical Tuesday">
          <textarea
            aria-label="Edit your typical Tuesday"
            defaultValue={analysis.preview}
            key={`preview-${analysis.preview}`}
            onBlur={(event) => saveVisionField("preview", event.target.value)}
            rows={6}
          />
        </section>

        <header className="mirror-intro mirror-week-intro">
          <div>
            <p className="os-eyebrow">Last seven days</p>
            <h1>How you are living</h1>
          </div>
        </header>

        <section className="mirror-summary-card" aria-labelledby="mirror-sentence">
          <p className="os-card-label">Overview</p>
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
            of the week recorded
          </p>
        </section>

        <section className="mirror-card mirror-time" aria-labelledby="time-heading">
          <div className="mirror-card-head">
            <div>
              <p className="os-card-label">Time</p>
              <h2 id="time-heading">Your week</h2>
            </div>
            <strong>{formatMinutes(summary.totalMinutes)}</strong>
          </div>

          <div className="time-river">
            {summary.days.map((item) => (
              <div className="time-river-day" key={item.key}>
                <span>{item.label}</span>
                <div className="time-river-track">
                  {item.day.timeBlocks.length ? (
                    item.day.timeBlocks.map(
                      (block: TimeBlock, blockIndex: number) => {
                        const minutes = minutesBetween(block.start, block.end);
                        return (
                          <i
                            className={activityColor(blockIndex)}
                            key={block.id}
                            style={{ flexGrow: Math.max(15, minutes) }}
                            title={`${block.title || block.activity}: ${formatMinutes(minutes)}`}
                          />
                        );
                      },
                    )
                  ) : (
                    <em />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="time-allocation">
            {summary.time.length ? (
              summary.time.slice(0, 4).map((item, index) => (
                <div key={item.activity}>
                  <span className={activityColor(index)} aria-hidden="true" />
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

        <section className="mirror-card mirror-life" aria-label="Mood">
          <div className="mirror-life-block">
            <p className="os-card-label">Mood</p>
            <h2>Your week</h2>
            <div className="mood-list">
              {summary.moods.length ? (
                summary.moods.slice(0, 5).map((item) => (
                  <span key={item.mood}>
                    {item.mood} <strong>{item.count}</strong>
                  </span>
                ))
              ) : (
                <span>Nothing logged yet.</span>
              )}
            </div>
          </div>
        </section>

        <section className="vision-analysis" aria-label="Understanding and gap">
          <article>
            <p className="os-card-label">How I understand you</p>
            <textarea
              aria-label="Edit how the app understands you"
              defaultValue={analysis.understanding}
              key={`understanding-${analysis.understanding}`}
              onBlur={(event) =>
                saveVisionField("understanding", event.target.value)
              }
              rows={5}
            />
          </article>
          <article>
            <p className="os-card-label">The gap</p>
            <textarea
              aria-label="Edit the gap"
              defaultValue={analysis.gap}
              key={`gap-${analysis.gap}`}
              onBlur={(event) => saveVisionField("gap", event.target.value)}
              rows={5}
            />
          </article>
        </section>
      </main>
    </OSFrame>
  );
}
