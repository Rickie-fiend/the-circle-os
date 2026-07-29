"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import {
  editProfileSession,
  minutesBetween,
  queueProfileUpdate,
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
  const { state, ready, updateProfile, updateState } = useCircleState();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [sessionDraft, setSessionDraft] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    age: "",
    description: "",
  });
  const summary = summarizeWeek(state);
  const profileCase = state.profile.profileCase;
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
      profileCase: {
        ...profile.profileCase,
        status: "waiting",
        sessions: {
          ...profile.profileCase.sessions,
          typicalTuesday: {
            ...profile.profileCase.sessions.typicalTuesday,
            text: draft.description.trim(),
            confidence: 0.5,
            userEdited: true,
            updatedAt: new Date().toISOString(),
          },
        },
        survey: {
          ...profile.profileCase.survey,
          nextQuestion: null,
        },
      },
    }), "first-vision");
    setError("");
  }

  function beginEdit(key: string) {
    setEditing(key);
    setSessionDraft(profileCase.sessions[key].text);
  }

  function saveSession(key: string) {
    if (!sessionDraft.trim()) return;
    updateState((current) =>
      queueProfileUpdate(
        editProfileSession(current, key, sessionDraft),
        "profile-edit",
      ),
    );
    setEditing(null);
    setSessionDraft("");
  }

  function profileSession(
    key: string,
    label: string,
    options: { feature?: boolean; locked?: boolean } = {},
  ) {
    const session = profileCase.sessions[key];
    const isEditing = editing === key;
    return (
      <article
        className={options.feature ? "profile-session feature" : "profile-session"}
      >
        <div className="profile-session-head">
          <p className="os-card-label">{label}</p>
          {!options.locked ? (
            <button type="button" onClick={() => beginEdit(key)}>
              Edit
            </button>
          ) : null}
        </div>
        {options.locked ? (
          <p className="profile-session-copy">
            Answer {Math.max(0, 6 - profileCase.survey.answers.length)} more
            check-ins to build this.
          </p>
        ) : isEditing ? (
          <div className="profile-session-edit">
            <textarea
              aria-label={`Edit ${label}`}
              value={sessionDraft}
              onChange={(event) => setSessionDraft(event.target.value)}
              rows={6}
              autoFocus
            />
            <button type="button" onClick={() => saveSession(key)}>
              Save
            </button>
          </div>
        ) : (
          <p className="profile-session-copy">{session.text}</p>
        )}
      </article>
    );
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
          <p className="vision-ai-state" aria-live="polite">
            {profileCase.status === "thinking"
              ? "Updating…"
              : profileCase.status === "waiting"
                ? "Updates tonight"
              : state.ai.status === "offline"
                ? "Computer offline"
                : ""}
          </p>
        </header>

        <section className="vision-profile-case" aria-label="Your profile case">
          {profileSession("typicalTuesday", "Typical Tuesday", {
            feature: true,
          })}
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

        <header className="mirror-intro analysis-intro">
          <div>
            <p className="os-eyebrow">Your profile</p>
            <h1>What Codex understands</h1>
          </div>
        </header>

        <section className="vision-analysis" aria-label="AI profile analysis">
          {profileSession("currentLife", "Current life")}
          {profileSession("whatMatters", "What matters")}
          {profileSession("interests", "Interests")}
          {profileSession("gap", "The gap")}
          {profileSession("missionStatement", "Mission statement")}
          {profileSession("personality", "Personality")}
        </section>
      </main>
    </OSFrame>
  );
}
