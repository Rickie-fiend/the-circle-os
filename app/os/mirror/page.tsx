"use client";

import { useRouter } from "next/navigation";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  appSessionIndex,
  editProfileSession,
  getDateKey,
  hasReadableProfileCase,
  minutesBetween,
  queueProfileUpdate,
  queueSuggestion,
  setAppSessionIndex,
  summarizeWeek,
} from "../circle-os-model.js";
import {
  PublishedChapterDelivery,
  useCircleState,
  type TimeBlock,
} from "../circle-os-shell";
import { SwipeSession } from "../app-session";
import { selectPendingAppPublication } from "../chapters/chapter-publication-store";
import { useChapterPublications } from "../chapters/use-chapter-publications";
import { buildAthenaReading } from "../athena-memory-model.js";

const READING_PAGES = ["days", "alive", "shape"] as const;

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

type AthenaReadingSection = {
  heading: string;
  text: string;
  paragraphs: string[];
};

/**
 * One published edition of Athena's reading. The model is JavaScript, so the
 * shape it hands back is stated here where it is read.
 */
type AthenaEdition = {
  id: string;
  publishedAt: string | null;
  pages: Record<(typeof READING_PAGES)[number], AthenaReadingSection[]>;
};

/** The morning an edition was written, as a person would say it. */
function editionDateLabel(edition: AthenaEdition | null) {
  if (!edition?.publishedAt) return "Undated";
  const date = new Date(edition.publishedAt);
  if (Number.isNaN(date.getTime())) return "Undated";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** What a past edition says for a part Athena did not write that day. */
function editionSilenceNote(edition: AthenaEdition | null) {
  return `Athena did not write this part on ${editionDateLabel(edition)}.`;
}

/** The first thing an edition says, so the archive reads as writing, not dates. */
function editionLeadLine(edition: AthenaEdition) {
  for (const page of READING_PAGES) {
    const section = edition.pages[page][0];
    if (section) return section.heading;
  }
  return "A reading";
}

function athenaFreshnessLabel(
  state: ReturnType<typeof useCircleState>["state"],
  reading: ReturnType<typeof buildAthenaReading>,
  fallbackUpdatedAt: string | null,
) {
  const hasUnsyncedEvidence =
    state.outbox.length > 0 ||
    state.evidence.localRevision > state.evidence.acknowledgedRevision;
  if (hasUnsyncedEvidence) return "Waiting to sync";
  if (state.profile.profileCase.status === "waiting") return "Preparing";
  const today = getDateKey();
  const preparedToday =
    reading.preparedAt && getDateKey(new Date(reading.preparedAt)) === today;
  const changedToday =
    reading.contentUpdatedAt &&
    getDateKey(new Date(reading.contentUpdatedAt)) === today;
  if (preparedToday && changedToday) return "Updated this morning";
  if (preparedToday) return "Checked this morning · No new evidence";
  return formatUpdated(reading.contentUpdatedAt || fallbackUpdatedAt);
}

function InlineProfileSessionEditor({
  label,
  onCommit,
  placeholder,
  value,
}: {
  label: string;
  onCommit: (text: string) => void;
  placeholder: string;
  value: string;
}) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const editingRef = useRef(false);
  const [draft, setDraft] = useState(value);

  useLayoutEffect(() => {
    if (!editingRef.current) setDraft(value);
  }, [value]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.style.height = "auto";
    editor.style.height = `${editor.scrollHeight}px`;
  }, [draft]);

  return (
    <textarea
      aria-label={`Edit ${label}`}
      className="profile-session-copy profile-session-inline"
      maxLength={1600}
      placeholder={placeholder}
      ref={editorRef}
      rows={1}
      value={draft}
      onBlur={() => {
        editingRef.current = false;
        const next = draft.trim();
        if (!next) {
          setDraft(value);
          return;
        }
        setDraft(next);
        if (next !== value) onCommit(next);
      }}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onFocus={() => {
        editingRef.current = true;
      }}
    />
  );
}

type GapVisualMode = "unclear" | "close" | "mixed" | "far";

function gapVisualReading(text: string, recordedDays: number) {
  const normalized = text.toLowerCase();
  if (
    !recordedDays ||
    /not enough|too early|cannot say|unclear|more logged days|still learning/.test(
      normalized,
    )
  ) {
    return {
      mode: "unclear" as GapVisualMode,
      label: "Still taking shape.",
    };
  }

  const soundsClose =
    /close|match|align|already|overlap|same place|fits/.test(normalized);
  const soundsFar =
    /far|apart|wide|different|missing|rarely|not match|does not/.test(
      normalized,
    );

  if (soundsClose && !soundsFar) {
    return {
      mode: "close" as GapVisualMode,
      label: "Some parts seem close.",
    };
  }
  if (soundsFar && !soundsClose) {
    return {
      mode: "far" as GapVisualMode,
      label: "Some parts seem far.",
    };
  }
  return {
    mode: "mixed" as GapVisualMode,
    label: "Some parts meet. Some do not.",
  };
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
  const { publications } = useChapterPublications(ready);
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
  const publicationProfileId = state.ai.profileId || "local";
  const visionPublication = selectPendingAppPublication(
    publications,
    "vision",
    publicationProfileId,
    state.chapters.runs,
  );
  const weekPublication = selectPendingAppPublication(
    publications,
    "seven-days",
    publicationProfileId,
    state.chapters.runs,
  );
  const athenaPublication = selectPendingAppPublication(
    publications,
    "athena",
    publicationProfileId,
    state.chapters.runs,
  );
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
  const recentTimelineActivities = pastDays
    .flatMap((item) => item.day.timeBlocks)
    .map((block) => (block.title || block.activity || "").trim())
    .filter(
      (activity, index, activities) =>
        activity &&
        activities.findIndex(
          (item) => item.toLowerCase() === activity.toLowerCase(),
        ) === index,
    )
    .slice(0, 6);
  const weekObservation =
    recentTimelineActivities.length > 1
      ? `Your recent days moved through ${recentTimelineActivities
          .slice(0, -1)
          .join(", ")}, and ${recentTimelineActivities.at(-1)}.`
      : recentTimelineActivities.length === 1
        ? `Your recent days included ${recentTimelineActivities[0]}.`
        : weekReady
          ? "Your week is starting to show a pattern."
          : "Your week starts here.";
  const athenaReading = buildAthenaReading(state.athenaMemory);
  const profileReady = athenaReading.ready || hasReadableProfileCase(profileCase);
  const readingUpdatedAt =
    String(athenaReading.updatedAt || "").localeCompare(
      String(profileCase.updatedAt || ""),
    ) >= 0
      ? athenaReading.updatedAt
      : profileCase.updatedAt;
  const updateLabel = athenaFreshnessLabel(
    state,
    athenaReading,
    profileCase.updatedAt,
  );
  const gapReading = gapVisualReading(
    profileCase.sessions.gap.text,
    loggedPastDays,
  );
  const weekJourneyVersion = [
    "week-observation-cover-v1",
    loggedPastDays,
    pastMinutes,
    pastCheckIns,
    pastMissionWins,
  ].join("|");
  const profileJourneyVersion = [
    readingUpdatedAt,
    athenaReading.preparedAt,
    state.evidence.acknowledgedRevision,
    profileCase.status,
  ].join("|");
  const lifeJourneyVersion = [
    "vision-cover-v1",
    profileCase.sessions.typicalTuesday.updatedAt,
    profileCase.sessions.missionStatement.updatedAt,
  ].join("|");
  const visibleLifeApp = appSessionIndex(
    state,
    "vision-life",
    lifeJourneyVersion,
    0,
  );
  const visibleWeekApp = appSessionIndex(
    state,
    "vision-week",
    weekJourneyVersion,
    0,
  );
  // Athena's reading and the gap were two sections asking the same question.
  // They are one part now: what sits between the life you want and the one you
  // are living. Its own session key, so an old saved position cannot land on a
  // page that no longer exists.
  const betweenJourneyVersion = `${profileJourneyVersion}|${loggedPastDays}`;
  const visibleBetweenApp = appSessionIndex(
    state,
    "vision-between",
    betweenJourneyVersion,
    0,
  );
  // Which edition is open. Nothing chosen means the newest one.
  const [openEditionId, setOpenEditionId] = useState<string | null>(null);
  const editions: AthenaEdition[] = athenaReading.editions;
  const openEdition =
    editions.find((edition) => edition.id === openEditionId) || editions[0] || null;
  const readingLatest = !openEdition || openEdition.id === athenaReading.latestEditionId;
  // The live reading falls back to derived observations for a page Athena has
  // not written. That fallback belongs to today only: showing it beside an
  // older edition would mix this week's evidence into words written last month.
  const readingPages = Object.fromEntries(
    READING_PAGES.map((page) => [
      page,
      openEdition && openEdition.pages[page].length
        ? openEdition.pages[page]
        : readingLatest
          ? athenaReading.pages[page]
          : [],
    ]),
  ) as typeof athenaReading.pages;
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

  function commitProfileSession(key: string, nextText: string) {
    updateState((current) =>
      queueProfileUpdate(
        editProfileSession(current, key, nextText),
        "profile-edit",
      ),
    );
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
    options: {
      feature?: boolean;
      locked?: boolean;
      placeholder?: string;
    } = {},
  ) {
    const session = profileCase.sessions[key];
    return (
      <article
        key={key}
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
        ) : (
          <InlineProfileSessionEditor
            label={label}
            onCommit={(text) => commitProfileSession(key, text)}
            placeholder={options.placeholder || "Tap to write."}
            value={session.text}
          />
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

  /**
   * One page of a reading.
   *
   * `emptyNote` is what a past edition says for a part Athena did not write
   * that day. The profile fallback belongs to today: shown under an older
   * edition it would quietly mix this week's evidence into last month's words.
   */
  function athenaReaderApp(
    label: string,
    title: string,
    memorySections: Array<{ heading: string; text: string; paragraphs?: string[] }>,
    fallbackKeys: Array<[string, string]>,
    emptyNote?: string,
  ) {
    return (
      <article className="athena-reader-app" key={label}>
        <header>
          <p className="os-card-label">{label}</p>
          <h2>{title}</h2>
        </header>
        <div className="athena-reader-copy">
          {!memorySections.length && emptyNote ? (
            <p className="athena-memory-copy athena-reader-quiet">{emptyNote}</p>
          ) : memorySections.length
            ? memorySections.map((section) => (
                <section className="profile-article-part" key={section.heading}>
                  <div>
                    <h2>{section.heading}</h2>
                  </div>
                  {(section.paragraphs?.length
                    ? section.paragraphs
                    : [section.text]
                  ).map((paragraph, index) => (
                    <p className="athena-memory-copy" key={index}>
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))
            : fallbackKeys.map(([key, heading]) =>
                profileArticleSection(key, heading),
              )}
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

        <section className="vision-profile-case" aria-label="The life you want">
          {visionPublication ? (
            <PublishedChapterDelivery
              className="vision-life-apps"
              label="Vision chapter"
              publication={visionPublication}
            />
          ) : (
          <SwipeSession
            attentionKey={`vision-life:${lifeJourneyVersion}`}
            availableIndices={[0, 1, 2]}
            className="vision-life-apps"
            index={visibleLifeApp}
            label="The life you want apps"
            maxIndex={2}
            onIndexChange={(nextIndex) =>
              updateState((current) =>
                setAppSessionIndex(
                  current,
                  "vision-life",
                  lifeJourneyVersion,
                  nextIndex,
                ),
              )
            }
          >
            <div className="vision-life-cover">
              <p className="os-card-label">Vision</p>
              <h2>The life you want.</h2>
              <span>Swipe to see</span>
            </div>
            {profileSession("typicalTuesday", "Typical Tuesday", {
              feature: true,
            })}
            {profileSession("missionStatement", "Mission Statement", {
              feature: true,
              placeholder: "Tap to write your mission.",
            })}
          </SwipeSession>
          )}
        </section>

        <header className="mirror-intro mirror-week-intro">
          <div>
            <p className="os-eyebrow">Last seven days</p>
            <h1>How you are living</h1>
          </div>
        </header>

        <section className="vision-week-session" aria-label="Last seven days session">
          {weekPublication ? (
            <PublishedChapterDelivery
              className="vision-week-apps"
              label="Last seven days chapter"
              publication={weekPublication}
            />
          ) : (
          <SwipeSession
            attentionKey={`vision-week:${weekJourneyVersion}`}
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
            <div className="vision-week-cover">
              <p className="os-card-label">Last seven days</p>
              <h2>{weekObservation}</h2>
              <span>{weekReady ? "Swipe to see" : "Check tomorrow morning"}</span>
            </div>
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
          )}
        </section>

        <header className="mirror-intro between-intro">
          <div>
            <p className="os-eyebrow">The space between</p>
            <h1>What sits between</h1>
            <p className="profile-updated">{updateLabel}</p>
          </div>
        </header>

        <section
          className="vision-between-session"
          aria-label="The space between"
        >
          {athenaPublication ? (
            <PublishedChapterDelivery
              className="vision-between-apps athena-reader-session"
              label="Athena chapter"
              publication={athenaPublication}
            />
          ) : (
          <SwipeSession
            attentionKey={`between:${athenaReading.latestEditionId || betweenJourneyVersion}`}
            availableIndices={
              profileReady
                ? [0, 1, 2, 3, 4, ...(editions.length > 1 ? [5] : [])]
                : [0, 1]
            }
            className="vision-between-apps athena-reader-session"
            index={visibleBetweenApp}
            label="The space between apps"
            maxIndex={profileReady ? (editions.length > 1 ? 5 : 4) : 1}
            onIndexChange={(nextIndex) =>
              updateState((current) =>
                setAppSessionIndex(
                  current,
                  "vision-between",
                  betweenJourneyVersion,
                  nextIndex,
                ),
              )
            }
          >
            <div className="gap-cover">
              <p className="os-card-label">The space between</p>
              <h2>
                {profileReady
                  ? "Some parts meet. Some do not."
                  : "Athena is still learning."}
              </h2>
              <span>{profileReady ? "Swipe to see" : "Still learning"}</span>
            </div>

            <article className={`gap-visual-app is-${gapReading.mode}`}>
              <div className="gap-visual-head">
                <p className="os-card-label">Rough view</p>
                <span>Not a score</span>
              </div>
              <div
                className="gap-orbits"
                aria-label={`Athena's rough view: ${gapReading.label}`}
              >
                <div className="gap-orbit gap-orbit-wanted">
                  <span>Life you want</span>
                </div>
                <div className="gap-orbit gap-orbit-lived">
                  <span>Life now</span>
                </div>
              </div>
              <h2>{gapReading.label}</h2>
              <p>Athena is making a rough guess from the days you recorded.</p>
            </article>

            {athenaReaderApp(
              readingLatest ? "Your days" : `Your days · ${editionDateLabel(openEdition)}`,
              "The life you are living.",
              readingPages.days,
              [["currentLife", "Current life"]],
              readingLatest ? undefined : editionSilenceNote(openEdition),
            )}
            {athenaReaderApp(
              readingLatest
                ? "What feels alive"
                : `What feels alive · ${editionDateLabel(openEdition)}`,
              "What matters to you.",
              readingPages.alive,
              [
                ["whatMatters", "What matters"],
                ["interests", "Interests"],
              ],
              readingLatest ? undefined : editionSilenceNote(openEdition),
            )}
            {athenaReaderApp(
              readingLatest ? "Your shape" : `Your shape · ${editionDateLabel(openEdition)}`,
              "How you may move through life.",
              readingPages.shape,
              [["personality", "Personality"]],
              readingLatest ? undefined : editionSilenceNote(openEdition),
            )}

            {editions.length > 1 ? (
              <article className="athena-archive-app" key="archive">
                <header>
                  <p className="os-card-label">Earlier readings</p>
                  <h2>What Athena wrote before.</h2>
                </header>
                <div className="athena-archive-list">
                  {editions.map((edition) => (
                    <button
                      aria-pressed={edition.id === openEdition?.id}
                      className={`athena-archive-row${
                        edition.id === openEdition?.id ? " is-open" : ""
                      }`}
                      key={edition.id}
                      type="button"
                      onClick={() => setOpenEditionId(edition.id)}
                    >
                      <span className="athena-archive-date">
                        {editionDateLabel(edition)}
                      </span>
                      <span className="athena-archive-lead">
                        {editionLeadLine(edition)}
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            ) : null}
          </SwipeSession>
          )}
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
