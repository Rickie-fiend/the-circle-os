"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { minutesBetween, summarizeWeek } from "../circle-os-model.js";
import {
  OSFrame,
  useCircleState,
  type TimeBlock,
} from "../circle-os-shell";

type TuesdayKey =
  | "wakeUp"
  | "morning"
  | "day"
  | "people"
  | "evening"
  | "feeling";

const TUESDAY_QUESTIONS: Array<{
  id: TuesdayKey;
  question: string;
  label: string;
}> = [
  { id: "wakeUp", question: "Where do you wake up?", label: "Wake up" },
  {
    id: "morning",
    question: "What happens in your morning?",
    label: "Morning",
  },
  {
    id: "day",
    question: "What do you spend your day doing?",
    label: "Day",
  },
  { id: "people", question: "Who is around you?", label: "People" },
  {
    id: "evening",
    question: "What happens in the evening?",
    label: "Evening",
  },
  { id: "feeling", question: "How does this life feel?", label: "Feeling" },
];

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
  const { state, ready, updateProfile } = useCircleState();
  const [modeOverride, setMode] = useState<
    "profile" | "tuesday" | "view" | null
  >(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [visionDraft, setVisionDraft] = useState(() => ({
    ...state.profile.typicalTuesday,
  }));

  const summary = summarizeWeek(state);
  const hasEvidence = summary.coverage.recorded > 0 || summary.totalMinutes > 0;
  const question = TUESDAY_QUESTIONS[step];
  const profileComplete = Boolean(
    state.profile.name && state.profile.age && state.profile.gender,
  );
  const visionComplete = Boolean(state.profile.typicalTuesday.completedAt);
  const mode =
    modeOverride ??
    (ready && profileComplete
      ? visionComplete
        ? "view"
        : "tuesday"
      : "profile");

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const age = Number(profileDraft.age);
    if (!profileDraft.name.trim() || !profileDraft.gender.trim()) {
      setError("Please answer all three.");
      return;
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("Please enter your age.");
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      name: profileDraft.name.trim(),
      age,
      gender: profileDraft.gender.trim(),
    }));
    setError("");
    setStep(0);
    setMode("tuesday");
  }

  function saveTuesdayAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!visionDraft[question.id].trim()) {
      setError("Please write your answer.");
      return;
    }
    setError("");
    if (step < TUESDAY_QUESTIONS.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    updateProfile((profile) => ({
      ...profile,
      typicalTuesday: {
        ...visionDraft,
        completedAt: new Date().toISOString(),
      },
    }));
    setMode("view");
  }

  function changeVision() {
    setProfileDraft({
      name: state.profile.name,
      age: state.profile.age ? String(state.profile.age) : "",
      gender: state.profile.gender,
    });
    setVisionDraft({ ...state.profile.typicalTuesday });
    setStep(0);
    setError("");
    setMode("profile");
  }

  if (mode === "profile") {
    return (
      <OSFrame active="mirror">
        <main className="os-mirror os-setup">
          <section className="vision-survey" aria-labelledby="profile-heading">
            <p className="os-eyebrow">First time</p>
            <h1 id="profile-heading">Tell us about you.</h1>
            <form className="profile-form" onSubmit={saveProfile}>
              <label>
                <span>Name</span>
                <input
                  autoComplete="name"
                  autoFocus
                  value={profileDraft.name}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
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
                  value={profileDraft.age}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      age: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Gender</span>
                <input
                  autoComplete="sex"
                  value={profileDraft.gender}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      gender: event.target.value,
                    }))
                  }
                />
              </label>
              {error ? <p className="vision-error">{error}</p> : null}
              <button type="submit">Continue</button>
            </form>
          </section>
        </main>
      </OSFrame>
    );
  }

  if (mode === "tuesday") {
    return (
      <OSFrame active="mirror">
        <main className="os-mirror os-setup">
          <section className="vision-survey" aria-labelledby="tuesday-question">
            <p className="os-eyebrow">
              Your typical Tuesday · {step + 1} of {TUESDAY_QUESTIONS.length}
            </p>
            <form onSubmit={saveTuesdayAnswer}>
              <h1 id="tuesday-question">{question.question}</h1>
              <textarea
                autoFocus
                rows={4}
                value={visionDraft[question.id]}
                onChange={(event) =>
                  setVisionDraft((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
              />
              {error ? <p className="vision-error">{error}</p> : null}
              <button type="submit">
                {step === TUESDAY_QUESTIONS.length - 1
                  ? "See my Tuesday"
                  : "Continue"}
              </button>
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
              {state.profile.name}, {state.profile.age} · {state.profile.gender}
            </p>
          </div>
          <button type="button" onClick={changeVision}>
            Change
          </button>
        </header>

        <section className="vision-summary" aria-label="Your typical Tuesday">
          {TUESDAY_QUESTIONS.map((item) => (
            <article key={item.id}>
              <p>{item.label}</p>
              <h2>{state.profile.typicalTuesday[item.id]}</h2>
            </article>
          ))}
        </section>

        <header className="mirror-intro mirror-week-intro">
          <div>
            <p className="os-eyebrow">Your last seven days</p>
            <h1>How you are living</h1>
          </div>
        </header>

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
          {!hasEvidence ? (
            <Link href="/os">
              Check in now <span>→</span>
            </Link>
          ) : null}
        </section>
      </main>
    </OSFrame>
  );
}
