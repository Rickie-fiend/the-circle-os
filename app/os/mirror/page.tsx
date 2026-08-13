"use client";

import { useRouter } from "next/navigation";
import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type FormEvent,
} from "react";
import {
  answerSurveyQuestion,
  appSessionIndex,
  buildWeekClaims,
  compareVisionDeclarations,
  declarationVersions,
  declareLife,
  editProfileSession,
  getDateKey,
  hasReadableProfileCase,
  queueProfileUpdate,
  queueSuggestion,
  setAppSessionIndex,
  summarizeWeek,
} from "../circle-os-model.js";
import {
  PublishedChapterDelivery,
  useCircleState,
  type CircleState,
} from "../circle-os-shell";
import {
  IDLE_PAGE_DWELL_MS,
  PageLayout,
  SwipeSession,
} from "../app-session";
import {
  normalizeChapterPublication,
  publicationIsNewerThanRun,
  selectPendingAppPublication,
} from "../chapters/chapter-publication-store";
import { chapterAnswerText, chapterRunId } from "../chapters/chapter-model.js";
import type { ChapterRun } from "../chapters/chapter-types";
import { useChapterPublications } from "../chapters/use-chapter-publications";
import { buildAthenaReading } from "../athena-memory-model.js";

const READING_PAGES = ["days", "alive", "shape"] as const;

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

type DeclarationKind =
  | "vision"
  | "missionStatement"
  | "typicalTuesday"
  | "dreamline";

type DeclarationRecord = {
  id: string;
  kind: DeclarationKind;
  content: Record<string, string>;
  declaredAt: string;
  supersedesId: string | null;
  targetAt?: string | null;
};

const DECLARATION_PAGES: Array<{
  kind: DeclarationKind;
  label: string;
  empty: string;
}> = [
  { kind: "vision", label: "Vision", empty: "What life is worth wanting?" },
  {
    kind: "missionStatement",
    label: "Mission statement",
    empty: "How do you intend to live?",
  },
  {
    kind: "typicalTuesday",
    label: "Typical Tuesday",
    empty: "What does an ordinary day in that life look like?",
  },
  {
    kind: "dreamline",
    label: "Dreamline",
    empty: "What do you want to make real in six months?",
  },
];

const DECLARATION_CHAPTERS: Record<DeclarationKind, string> = {
  vision: "declare-vision",
  missionStatement: "declare-mission-statement",
  typicalTuesday: "declare-typical-tuesday",
  dreamline: "declare-dreamline",
};

function subscribeToMirrorLocation() {
  return () => undefined;
}

function mirrorLocationSearch() {
  return window.location.search;
}

function serverMirrorLocationSearch() {
  return "";
}

function declarationFromRun(kind: DeclarationKind, run: ChapterRun) {
  if (kind === "vision") {
    return {
      life: chapterAnswerText(run, "vision-life"),
      why: chapterAnswerText(run, "vision-why"),
    };
  }
  if (kind === "missionStatement") {
    return { statement: chapterAnswerText(run, "mission-statement") };
  }
  if (kind === "typicalTuesday") {
    return {
      wake: chapterAnswerText(run, "tuesday-wake"),
      morning: chapterAnswerText(run, "tuesday-morning"),
      day: chapterAnswerText(run, "tuesday-day"),
      people: chapterAnswerText(run, "tuesday-people"),
      evening: chapterAnswerText(run, "tuesday-evening"),
      feeling: chapterAnswerText(run, "tuesday-feeling"),
    };
  }
  return {
    dream: chapterAnswerText(run, "dreamline-dream"),
    now: chapterAnswerText(run, "dreamline-now"),
    tomorrow: chapterAnswerText(run, "dreamline-tomorrow"),
    dayAfter: chapterAnswerText(run, "dreamline-day-after"),
  };
}

const DECLARATION_FIELDS: Record<
  DeclarationKind,
  Array<{ key: string; label: string }>
> = {
  vision: [
    { key: "life", label: "The life" },
    { key: "why", label: "Why it is worth wanting" },
  ],
  missionStatement: [{ key: "statement", label: "Mission statement" }],
  typicalTuesday: [
    { key: "wake", label: "Where you wake" },
    { key: "morning", label: "Morning" },
    { key: "day", label: "Day" },
    { key: "people", label: "People" },
    { key: "evening", label: "Evening" },
    { key: "feeling", label: "How it feels" },
  ],
  dreamline: [
    { key: "dream", label: "In six months" },
    { key: "now", label: "Now" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "dayAfter", label: "The day after" },
  ],
};

function declarationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Undated";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DeclarationPage({
  kind,
  label,
  empty,
  record,
  current,
  onCommit,
  onSetup,
}: {
  kind: DeclarationKind;
  label: string;
  empty: string;
  record?: DeclarationRecord;
  current: boolean;
  onCommit: (content: Record<string, string>) => void;
  onSetup: () => void;
}) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>(
    () => ({ ...(record?.content || {}) }),
  );
  const fields = DECLARATION_FIELDS[kind];

  useLayoutEffect(() => {
    for (const editor of pageRef.current?.querySelectorAll("textarea") || []) {
      editor.style.height = "auto";
      editor.style.height = `${editor.scrollHeight}px`;
    }
  }, [draft]);

  function commitWhenLeaving(event: FocusEvent<HTMLDivElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    if (!record || !current) return;
    const clean = Object.fromEntries(
      fields.map((field) => [field.key, String(draft[field.key] || "").trim()]),
    );
    if (fields.some((field) => !clean[field.key])) {
      setDraft({ ...record.content });
      return;
    }
    const changed = fields.some(
      (field) => clean[field.key] !== String(record.content[field.key] || "").trim(),
    );
    if (changed) onCommit(clean);
  }

  if (!record) {
    return (
      <PageLayout
        className="vision-declaration-page is-empty"
        footer={
          <button className="vision-declaration-setup" onClick={onSetup} type="button">
            Set up
          </button>
        }
        headerLeft={<p className="os-card-label">{label}</p>}
        theme="light"
      >
        <div className="os-page-main">
          <h2>{empty}</h2>
        </div>
      </PageLayout>
    );
  }

  const fieldViews = fields.map((field, index) => {
    const value = draft[field.key] || "";
    if (!current) {
      return (
        <div className="vision-declaration-field" key={field.key}>
          {index ? <span>{field.label}</span> : null}
          <p>{value}</p>
        </div>
      );
    }
    return (
      <label className="vision-declaration-field" key={field.key}>
        {index ? <span>{field.label}</span> : null}
        <textarea
          aria-label={`Edit ${label}: ${field.label}`}
          maxLength={1600}
          onChange={(event) =>
            setDraft((value) => ({
              ...value,
              [field.key]: event.currentTarget.value,
            }))
          }
          rows={1}
          value={value}
        />
      </label>
    );
  });

  return (
    <PageLayout
      className={`vision-declaration-page${current ? " is-current" : " is-earlier"}`}
      footer={
        <span className="vision-declaration-date">
          {current ? "Declared" : "Earlier"} {declarationDate(record.declaredAt)}
        </span>
      }
      headerLeft={
        <p className="os-card-label">
          {label}{current ? "" : " · Earlier"}
        </p>
      }
      theme="light"
    >
      <div onBlurCapture={commitWhenLeaving} ref={pageRef} className="vision-declaration-copy">
        <div className="os-page-main">{fieldViews[0]}</div>
        {fieldViews.length > 1 ? (
          <div className="os-page-sub">{fieldViews.slice(1)}</div>
        ) : null}
      </div>
    </PageLayout>
  );
}

function AthenaAnswerPage({
  answer,
  label,
  onSend,
  prompt,
  theme = "light",
}: {
  answer: string;
  label: string;
  onSend: (answer: string) => void;
  prompt: { id: string; text: string; target: string };
  theme?: "light" | "orange";
}) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState(answer);
  const [sent, setSent] = useState(Boolean(answer));

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.style.height = "auto";
    editor.style.height = `${editor.scrollHeight}px`;
  }, [draft]);

  if (answer.trim()) {
    return (
      <PageLayout
        className="vision-athena-answer is-sent"
        footer={<span>Athena reads this tonight.</span>}
        headerLeft={<p className="os-card-label">{label}</p>}
        theme={theme}
      >
        <div className="os-page-main">
          <h2>Your answer is with Athena.</h2>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      className="vision-athena-answer"
      footer={
        <button
          className="vision-athena-send"
          disabled={!draft.trim()}
          onClick={() => {
            onSend(draft);
            setSent(true);
          }}
          type="button"
        >
          {sent && draft.trim() === answer.trim() ? "Sent" : "Send"}
        </button>
      }
      headerLeft={<p className="os-card-label">{label}</p>}
      theme={theme}
    >
      <div className="os-page-main">
        <h2>{prompt.text}</h2>
      </div>
      <div className="os-page-sub">
        <textarea
          aria-label="Answer Athena"
          maxLength={1600}
          onChange={(event) => {
            setDraft(event.currentTarget.value);
            setSent(false);
          }}
          placeholder="Write what comes up..."
          ref={editorRef}
          rows={2}
          value={draft}
        />
      </div>
    </PageLayout>
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
  });
  const summary = summarizeWeek(state);
  const weekClaims = buildWeekClaims(state);
  const profileCase = state.profile.profileCase;
  const publicationProfileId = state.ai.profileId || "local";
  const locationSearch = useSyncExternalStore(
    subscribeToMirrorLocation,
    mirrorLocationSearch,
    serverMirrorLocationSearch,
  );
  const requested = new URLSearchParams(locationSearch).get("declare");
  const requestedDeclaration = DECLARATION_PAGES.some(
    (page) => page.kind === requested,
  )
    ? (requested as DeclarationKind)
    : null;
  const firstMissingDeclaration = DECLARATION_PAGES.find(
    (page) => !declarationVersions(state, page.kind).length,
  )?.kind;
  const desiredDeclaration =
    requestedDeclaration && !declarationVersions(state, requestedDeclaration).length
      ? requestedDeclaration
      : firstMissingDeclaration;
  const desiredDeclarationPublication = desiredDeclaration
    ? publications
        .map(normalizeChapterPublication)
        .find((publication) => {
          if (publication.chapter.id !== DECLARATION_CHAPTERS[desiredDeclaration]) {
            return false;
          }
          if (
            publication.visibility !== "public" &&
            publication.audienceProfileId !== publicationProfileId &&
            publication.audienceProfileId !== "local"
          ) {
            return false;
          }
          const run = state.chapters.runs[chapterRunId(publication.chapter)];
          return (
            publicationIsNewerThanRun(publication, run) ||
            (run?.status !== "completed" && !run?.deferredAt)
          );
        }) || null
    : null;
  const visionPublication = desiredDeclarationPublication || selectPendingAppPublication(
    publications,
    "vision",
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
  const declarationComparison = compareVisionDeclarations(state);
  const gapReading =
    declarationComparison.different === null
      ? gapVisualReading(profileCase.sessions.gap.text, loggedPastDays)
      : {
          mode: declarationComparison.different
            ? ("far" as GapVisualMode)
            : ("close" as GapVisualMode),
          label: declarationComparison.text,
        };
  const weekJourneyVersion = [
    "week-claims-v1",
    ...weekClaims.map((claim: { key: string; sentence: string }) =>
      `${claim.key}:${claim.sentence}`,
    ),
  ].join("|");
  const profileJourneyVersion = [
    readingUpdatedAt,
    athenaReading.preparedAt,
    state.evidence.acknowledgedRevision,
    profileCase.status,
  ].join("|");
  const declarationPageRecords = DECLARATION_PAGES.reduce<
    Array<
      (typeof DECLARATION_PAGES)[number] & {
        record?: DeclarationRecord;
        current: boolean;
      }
    >
  >((pages, page) => {
    const versions = declarationVersions(state, page.kind) as DeclarationRecord[];
    if (versions.length) {
      pages.push(
        ...versions.map((record, index) => ({
          ...page,
          record,
          current: index === 0,
        })),
      );
    } else {
      pages.push({ ...page, current: true });
    }
    return pages;
  }, []);
  const athenaPrompt = profileCase.deepThoughtPrompt;
  const athenaAnswer = athenaPrompt
    ? profileCase.survey.answers.find(
        (answer) => answer.questionId === athenaPrompt.id,
      )?.answer || ""
    : "";
  const lifePageCount = declarationPageRecords.length;
  const lifeJourneyVersion = [
    "declarations-v1",
    ...declarationPageRecords.map((page) => page.record?.id || `${page.kind}-empty`),
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
      state.profile.age,
  );

  async function saveFirstProfile(event: FormEvent<HTMLFormElement>) {
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
    if (!draft.name.trim()) {
      setError("Please add your name.");
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
      profileCase: {
        ...profile.profileCase,
        status: "waiting",
        survey: {
          ...profile.profileCase.survey,
          nextQuestion: null,
        },
      },
    }), "profile-created");
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

  function commitDeclaration(
    kind: DeclarationKind,
    content: Record<string, string>,
  ) {
    updateState((current) => declareLife(current, kind, content));
  }

  function completeDeclaration(
    current: CircleState,
    run: ChapterRun,
  ) {
    const kind = (Object.entries(DECLARATION_CHAPTERS) as Array<
      [DeclarationKind, string]
    >).find(([, chapterId]) => chapterId === run.chapterId)?.[0];
    return kind
      ? declareLife(current, kind, declarationFromRun(kind, run))
      : current;
  }

  function sendAthenaAnswer(answer: string) {
    if (!athenaPrompt) return;
    updateState((current) =>
      answerSurveyQuestion(
        current,
        athenaPrompt,
        answer,
        "deep-thought",
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
            <p className="os-eyebrow">Circle OS</p>
            <h1 id="vision-start">Start with you.</h1>
            <form className="profile-form" onSubmit={saveFirstProfile}>
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
              onCompleted={completeDeclaration}
              publication={visionPublication}
            />
          ) : (
          <SwipeSession
            attentionKey={`vision-life:${lifeJourneyVersion}`}
            availableIndices={Array.from(
              { length: lifePageCount },
              (_, index) => index,
            )}
            className="vision-life-apps"
            index={visibleLifeApp}
            label="The life you want apps"
            maxIndex={Math.max(0, lifePageCount - 1)}
            rotateMs={IDLE_PAGE_DWELL_MS}
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
            {declarationPageRecords.map((page) => (
              <DeclarationPage
                current={page.current}
                empty={page.empty}
                key={page.record?.id || `${page.kind}-empty`}
                kind={page.kind}
                label={page.label}
                onCommit={(content) => commitDeclaration(page.kind, content)}
                onSetup={() => router.push(`/os/mirror?declare=${page.kind}`)}
                record={page.record}
              />
            ))}
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
          <SwipeSession
            attentionKey={`vision-week:${weekJourneyVersion}`}
            availableIndices={weekClaims.map((_: unknown, index: number) => index)}
            className="vision-week-apps"
            index={visibleWeekApp}
            label="Last seven days apps"
            maxIndex={Math.max(0, weekClaims.length - 1)}
            rotateMs={IDLE_PAGE_DWELL_MS}
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
            {weekClaims.map((claim: {
              key: string;
              label: string;
              sentence: string;
              evidence: Array<{
                label: string;
                shortLabel: string;
                value: string;
                tone: string;
              }>;
            }) => (
              <PageLayout
                className="vision-week-claim"
                headerLeft={<p className="os-card-label">{claim.label}</p>}
                key={claim.key}
                theme="dark"
              >
                <div className="os-page-main">
                  <h2>{claim.sentence}</h2>
                </div>
                <div
                  aria-label={`Evidence for ${claim.label}`}
                  className="os-page-sub week-claim-evidence"
                >
                  {claim.evidence.map((item, index) => (
                    <span
                      className={`is-${item.tone}`}
                      key={`${item.label}-${index}`}
                      title={item.label}
                    >
                      <i aria-hidden="true" />
                      <b>{item.shortLabel}</b>
                      <small>{item.value}</small>
                    </span>
                  ))}
                </div>
              </PageLayout>
            ))}
          </SwipeSession>
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
                ? [
                    0,
                    1,
                    2,
                    3,
                    4,
                    ...(editions.length > 1 ? [5] : []),
                    ...(athenaPrompt ? [editions.length > 1 ? 6 : 5] : []),
                  ]
                : [0, 1]
            }
            className="vision-between-apps athena-reader-session"
            index={visibleBetweenApp}
            label="The space between apps"
            maxIndex={
              profileReady
                ? (editions.length > 1 ? 5 : 4) + (athenaPrompt ? 1 : 0)
                : 1
            }
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
            {athenaPrompt ? (
              <AthenaAnswerPage
                answer={athenaAnswer}
                key={`athena-question-${athenaPrompt.id}`}
                label="Athena asks"
                onSend={sendAthenaAnswer}
                prompt={athenaPrompt}
                theme="orange"
              />
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
