"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  appSessionIndex,
  editProfileSession,
  hasReadableProfileCase,
  minutesBetween,
  queueProfileUpdate,
  queueSuggestion,
  setAppSessionIndex,
  summarizeWeek,
} from "../circle-os-model.js";
import {
  useCircleState,
  type TimeBlock,
} from "../circle-os-shell";
import { SessionIntro, SwipeSession } from "../app-session";

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
  const {
    state,
    ready,
    dateKey,
    recoverProfile,
    updateProfile,
    updateState,
  } = useCircleState();
  const router = useRouter();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [sessionDraft, setSessionDraft] = useState("");
  const [suggestionDraft, setSuggestionDraft] = useState("");
  const [suggestionSaved, setSuggestionSaved] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    age: "",
    description: "",
  });
  const summary = summarizeWeek(state);
  const profileCase = state.profile.profileCase;
  const pastDays = summary.days.filter((item) => item.key !== dateKey);
  const loggedPastDays = pastDays.filter(
    (item) => item.day.timeBlocks.length > 0,
  ).length;
  const pastMinutes = pastDays.reduce(
    (total: number, item: (typeof pastDays)[number]) =>
      total +
      item.day.timeBlocks.reduce(
        (dayTotal: number, block: TimeBlock) =>
          dayTotal + minutesBetween(block.start, block.end),
        0,
      ),
    0,
  );
  const pastCheckIns = pastDays.reduce(
    (total: number, item: (typeof pastDays)[number]) =>
      total + item.day.checkIns.length,
    0,
  );
  const pastMissionWins = pastDays.filter(
    (item) => item.day.mission?.completed,
  ).length;
  const weekReady = Boolean(
    loggedPastDays || summary.coverage.recorded || summary.missions.available,
  );
  const profileReady = hasReadableProfileCase(profileCase);
  const updateLabel = formatUpdated(profileCase.updatedAt);
  const weekJourneyVersion = `${loggedPastDays}|${pastMinutes}|${pastCheckIns}|${pastMissionWins}`;
  const profileJourneyVersion = profileCase.updatedAt || profileCase.status;
  const visibleWeekApp = appSessionIndex(
    state,
    "vision-week",
    weekJourneyVersion,
    0,
  );
  const visibleProfileApp = appSessionIndex(
    state,
    "vision-profile",
    profileJourneyVersion,
    0,
  );
  const setupComplete = Boolean(
    ready &&
      state.profile.name &&
      state.profile.age &&
      state.profile.vision.completedAt,
  );

  async function saveFirstVision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recoveryCode = draft.name.trim();
    if (/^p_[A-Za-z0-9_-]{16}$/.test(recoveryCode)) {
      setRecovering(true);
      setError("");
      try {
        await recoverProfile(recoveryCode);
        router.push("/os");
      } catch (recoveryError) {
        setError(
          recoveryError instanceof Error
            ? recoveryError.message
            : "That recovery code was not found.",
        );
      } finally {
        setRecovering(false);
      }
      return;
    }
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
    const nextText = sessionDraft.trim();
    if (!nextText) {
      setEditing(null);
      setSessionDraft("");
      return;
    }
    if (nextText === profileCase.sessions[key].text) {
      setEditing(null);
      setSessionDraft("");
      return;
    }
    updateState((current) =>
      queueProfileUpdate(
        editProfileSession(current, key, nextText),
        "profile-edit",
      ),
    );
    setEditing(null);
    setSessionDraft("");
  }

  function saveSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!suggestionDraft.trim()) return;
    updateState((current) => queueSuggestion(current, suggestionDraft));
    setSuggestionDraft("");
    setSuggestionSaved(true);
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
            onBlur={() => saveSession(key)}
            rows={6}
            autoFocus
          />
          </div>
        ) : (
          <button
            aria-label={`Edit ${label}`}
            className="profile-session-copy"
            type="button"
            onClick={() => beginEdit(key)}
          >
            {session.text}
          </button>
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
        </div>
        {isEditing ? (
          <div className="profile-session-edit">
            <textarea
              aria-label={`Edit ${label}`}
            value={sessionDraft}
            onChange={(event) => setSessionDraft(event.target.value)}
            onBlur={() => saveSession(key)}
            rows={6}
            autoFocus
          />
          </div>
        ) : (
          <button
            aria-label={`Edit ${label}`}
            type="button"
            onClick={() => beginEdit(key)}
          >
            {session.text}
          </button>
        )}
      </section>
    );
  }

  function profileReaderApp(
    label: string,
    title: string,
    keys: Array<[string, string]>,
  ) {
    return (
      <article className="athena-reader-app" key={label}>
        <header>
          <p className="os-card-label">{label}</p>
          <h2>{title}</h2>
        </header>
        <div className="athena-reader-copy">
          {keys.map(([key, heading]) => profileArticleSection(key, heading))}
        </div>
      </article>
    );
  }

  if (!setupComplete) {
    return (
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
              <button type="submit" disabled={recovering}>
                {recovering ? "Recovering..." : "Begin"}
              </button>
            </form>
          </section>
        </main>
    );
  }

  return (
      <main className="os-mirror">
        <header className="vision-intro">
          <div>
            <p className="os-eyebrow">Vision</p>
            <h1>The life you want.</h1>
          </div>
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
            availableIndices={
              visibleWeekApp === 0
                ? [0, 1]
                : [1, 2, 3, 4]
            }
            className="vision-week-apps"
            frameHeight="360px"
            index={visibleWeekApp}
            label="Last seven days apps"
            maxIndex={weekReady ? 4 : 0}
            onIndexChange={(nextIndex) =>
              updateState((current) =>
                setAppSessionIndex(
                  current,
                  "vision-week",
                  weekJourneyVersion,
                  nextIndex,
                ),
              )
            }
          >
            <SessionIntro
              detail={
                weekReady
                  ? "Four views of your time, rhythm, and record."
                  : "Log today. Your first charts unlock tomorrow morning."
              }
              label="Last seven days"
              onBegin={() => {
                updateState((current) =>
                  setAppSessionIndex(
                    current,
                    "vision-week",
                    weekJourneyVersion,
                    1,
                  ),
                );
              }}
              ready={weekReady}
              theme="light"
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
            <p className="os-eyebrow">Athena</p>
            <h1>A reading of you</h1>
          </div>
        </header>

        <section
          className="vision-analysis-session"
          aria-label="AI profile session"
        >
          <SwipeSession
            availableIndices={
              profileReady
                ? [0, 1, 2, 3, 4]
                : [0]
            }
            className="vision-analysis-apps athena-reader-session"
            index={visibleProfileApp}
            label="Athena reading apps"
            maxIndex={profileReady ? 4 : 0}
            onIndexChange={(nextIndex) =>
              updateState((current) =>
                setAppSessionIndex(
                  current,
                  "vision-profile",
                  profileJourneyVersion,
                  nextIndex,
                ),
              )
            }
          >
            <div className="athena-reader-cover">
              <p className="os-card-label">Athena</p>
              <h2>
                {profileReady ? "What Athena sees." : "Athena is still learning."}
              </h2>
              {profileReady ? (
                <span className="athena-reader-begin">Swipe to begin</span>
              ) : null}
            </div>
              {profileReaderApp("Your days", "The life you are living.", [
                ["currentLife", "Current life"],
              ])}
              {profileReaderApp("What feels alive", "What matters to you.", [
                ["whatMatters", "What matters"],
                ["interests", "Interests"],
              ])}
              {profileReaderApp("Your shape", "How you may move through life.", [
                ["personality", "Personality"],
              ])}
              {profileReaderApp("The space", "What life may be asking for.", [
                ["gap", "The gap"],
                ["missionStatement", "Mission statement"],
              ])}
          </SwipeSession>
        </section>

        <section
          className="vision-suggestion-session"
          aria-label="Suggestion app"
        >
          <article className="vision-suggestion-app">
            <p className="os-card-label">Suggestion</p>
            <h2>What should be better?</h2>
            <form onSubmit={saveSuggestion}>
              <textarea
                aria-label="Your suggestion"
                maxLength={800}
                placeholder="Write one idea."
                rows={4}
                value={suggestionDraft}
                onChange={(event) => {
                  setSuggestionDraft(event.target.value);
                  setSuggestionSaved(false);
                }}
              />
              <button type="submit">Send</button>
            </form>
            {suggestionSaved ? (
              <p className="vision-suggestion-saved" role="status">
                Saved. Thank you.
              </p>
            ) : null}
          </article>
        </section>
      </main>
  );
}
