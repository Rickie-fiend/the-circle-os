"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  editProfileSession,
  minutesBetween,
  queueProfileUpdate,
  summarizeWeek,
} from "../circle-os-model.js";
import {
  OSFrame,
  SessionIntro,
  SwipeSession,
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

function formatUpdated(value: string | null) {
  if (!value) return "Not updated yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated yet";
  return `Updated ${date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function CircleOSMirror() {
  const { state, ready, dateKey, updateProfile, updateState } = useCircleState();
  const router = useRouter();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [weekApp, setWeekApp] = useState(0);
  const [profileApp, setProfileApp] = useState(0);
  const [seenWeekJourney, setSeenWeekJourney] = useState("");
  const [seenProfileJourney, setSeenProfileJourney] = useState("");
  const [sessionDraft, setSessionDraft] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    age: "",
    description: "",
  });
  const summary = summarizeWeek(state);
  const profileCase = state.profile.profileCase;
  const loggedPastDays = summary.days.filter(
    (item) => item.key !== dateKey && item.day.timeBlocks.length > 0,
  ).length;
  const weekReady = loggedPastDays > 0;
  const profileReady = Boolean(
    profileCase.status === "ready" && profileCase.updatedAt,
  );
  const updateLabel = formatUpdated(profileCase.updatedAt);
  const weekJourneyVersion = `${loggedPastDays}|${summary.totalMinutes}|${summary.coverage.recorded}`;
  const profileJourneyVersion = profileCase.updatedAt || profileCase.status;
  const visibleWeekApp =
    seenWeekJourney === weekJourneyVersion ? weekApp : 0;
  const visibleProfileApp =
    seenProfileJourney === profileJourneyVersion ? profileApp : 0;
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
    router.push("/os");
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

  function profileArticleSection(key: string, label: string) {
    const session = profileCase.sessions[key];
    const isEditing = editing === key;
    return (
      <section className="profile-article-part" key={key}>
        <div>
          <h2>{label}</h2>
          <button type="button" onClick={() => beginEdit(key)}>
            Edit
          </button>
        </div>
        {isEditing ? (
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
          <p>{session.text}</p>
        )}
      </section>
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
                ? "Updates tomorrow morning"
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

        <section className="vision-week-session" aria-label="Last seven days session">
          <SwipeSession
            className="vision-week-apps"
            index={visibleWeekApp}
            label="Last seven days apps"
            maxIndex={weekReady ? 4 : 0}
            onIndexChange={(nextIndex) => {
              if (nextIndex > 0) {
                setSeenWeekJourney(weekJourneyVersion);
              }
              setWeekApp(nextIndex);
            }}
          >
            <SessionIntro
              detail={
                weekReady
                  ? "Four views of your time, rhythm, and record."
                  : "Log today. Your first charts unlock tomorrow morning."
              }
              label="Last seven days"
              onBegin={() => {
                setSeenWeekJourney(weekJourneyVersion);
                setWeekApp(1);
              }}
              ready={weekReady}
              theme="dark"
              title={weekReady ? "Your week is ready." : "Your week starts here."}
            />
              <article
                className="mirror-summary-card vision-week-app"
                aria-labelledby="mirror-sentence"
              >
                <p className="os-card-label">Overview</p>
                <h2 id="mirror-sentence">{summary.sentence}</h2>
                <div className="week-ribbon" aria-label="Data coverage">
                  {summary.days.map((item) => (
                    <article key={item.key}>
                      <span>{item.label}</span>
                      <div
                        aria-label={`${item.recordedPeriods} of 4 periods recorded`}
                      >
                        {[0, 1, 2, 3].map((period) => (
                          <i
                            className={
                              period < item.recordedPeriods ? "recorded" : ""
                            }
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
              </article>

              <article
                className="mirror-card mirror-time vision-week-app"
                aria-labelledby="time-heading"
              >
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
                              const minutes = minutesBetween(
                                block.start,
                                block.end,
                              );
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
                        <span
                          className={activityColor(index)}
                          aria-hidden="true"
                        />
                        <p>{item.activity}</p>
                        <strong>{formatMinutes(item.minutes)}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="mirror-empty">Nothing logged yet.</p>
                  )}
                </div>
              </article>

              <article
                className="mirror-card mirror-energy vision-week-app"
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
                      <strong>
                        {item.value ? item.value.toFixed(1) : "—"}
                      </strong>
                      <span>{item.label.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article
                className="mirror-card mirror-life vision-week-app"
                aria-label="Recorded days"
              >
                <div className="mirror-life-block">
                  <p className="os-card-label">Record</p>
                  <h2>{loggedPastDays} days recorded</h2>
                  <p className="mirror-record-copy">
                    Your own words become clearer here over time.
                  </p>
                </div>
              </article>
          </SwipeSession>
        </section>

        <header className="mirror-intro analysis-intro">
          <div>
            <p className="os-eyebrow">Your profile</p>
            <h1>What Codex understands</h1>
            <p className="profile-updated">{updateLabel}</p>
          </div>
        </header>

        <section
          className="vision-analysis-session"
          aria-label="AI profile session"
        >
          <SwipeSession
            className="vision-analysis-apps"
            index={visibleProfileApp}
            label="AI profile apps"
            maxIndex={profileReady ? 1 : 0}
            onIndexChange={(nextIndex) => {
              if (nextIndex > 0) {
                setSeenProfileJourney(profileJourneyVersion);
              }
              setProfileApp(nextIndex);
            }}
          >
            <div className="profile-ai-intro">
              <p className="os-card-label">Before you read</p>
              <h2>
                {profileReady ? "A working picture of you." : "Still learning you."}
              </h2>
              <p>
                AI can be wrong. Keep what helps. Edit anything that does not
                feel true.
              </p>
              <span>{profileReady ? updateLabel : "Ready after the morning update."}</span>
              {profileReady ? (
                <button
                  type="button"
                  onClick={() => {
                    setSeenProfileJourney(profileJourneyVersion);
                    setProfileApp(1);
                  }}
                  aria-label="Read your profile"
                >
                  Swipe to read
                </button>
              ) : (
                <strong className="os-session-wait">
                  Available tomorrow morning
                </strong>
              )}
            </div>
              <article className="profile-article">
                <header>
                  <p className="os-card-label">Your profile</p>
                  <h2>What I understand so far</h2>
                  <span>{updateLabel}</span>
                </header>
                {profileArticleSection("currentLife", "Current life")}
                {profileArticleSection("whatMatters", "What matters")}
                {profileArticleSection("interests", "Interests")}
                {profileArticleSection("gap", "The gap")}
                {profileArticleSection("missionStatement", "Mission statement")}
                {profileArticleSection("personality", "Personality")}
              </article>
          </SwipeSession>
        </section>
      </main>
    </OSFrame>
  );
}
