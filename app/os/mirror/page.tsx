"use client";

import { useRouter } from "next/navigation";
import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  answerSurveyQuestion,
  appSessionIndex,

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
  PageLayout,
  SwipeSession,
} from "../app-session";
import { sizeTextAreaToContent } from "../text-area-size";
import { useAppBack } from "../app-back";
import { useStableRouteAnchor } from "../stable-route-anchor";
import {
  normalizeChapterPublication,
  publicationIsNewerThanRun,
  selectPendingAppPublication,
} from "../chapters/chapter-publication-store";
import { chapterAnswerText, chapterRunId } from "../chapters/chapter-model.js";
import type { ChapterRun } from "../chapters/chapter-types";
import { useChapterPublications } from "../chapters/use-chapter-publications";
import {
  buildAthenaReading,
  buildAthenaReadingReplyPrompt,
} from "../athena-memory-model.js";
import {
  DIMENSION_WINDOW_WEEKS,
  dimensionRecord,
  starvedDimension,
} from "../dimension-record.js";
import type { DimensionRow } from "../dimension-record";

type AthenaReadingPage = "days" | "alive" | "shape";

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
  cover: string;
  pages: Record<AthenaReadingPage, AthenaReadingSection[]>;
};

/**
 * The Four's session, named by its shape.
 *
 * The record, then one Page for each part of a life. A saved position can only
 * be wrong if that number changes, which is what the version is for.
 */
/**
 * Whether Reflect's deepest layer is dealt into the tab.
 *
 * Off while the phases are being rebuilt. Sai: "Hide The Four app session for
 * now." Nothing about it is deleted: the record it reads keeps accumulating
 * every Sunday, `dimension-record.js` is untouched, and turning this back on
 * puts the App back where it was with its whole history intact.
 */
const SHOW_THE_FOUR = false;

const FOUR_APP_VERSION = "four-v1";

/** When a part of a life was last given anything, said as a person would. */
function sinceLine(row: DimensionRow) {
  if (row.weeksSince === null) return "Never fed";
  if (row.weeksSince === 0) return "Fed this week";
  return `${row.weeksSince} ${row.weeksSince === 1 ? "week" : "weeks"} ago`;
}

/**
 * What the Page says out loud, which is always the part that has gone hungry.
 *
 * Never fed is said differently from a long time ago: a part of a life nobody
 * has named is further away than one that has merely lapsed.
 */
function starvedLine(row: DimensionRow) {
  const name = row.dimension.charAt(0).toUpperCase() + row.dimension.slice(1);
  if (row.weeksSince === null) return `${name} has never been fed.`;
  return `${name} has not been fed in ${row.weeksSince} weeks.`;
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

type AthenaReadingPrompt = {
  id: string;
  text: string;
  target: string;
};

function AthenaReadingReply({
  answer,
  onSend,
  prompt,
}: {
  answer: string;
  onSend: (answer: string) => void;
  prompt: AthenaReadingPrompt;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(answer);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    if (editing && editorRef.current) sizeTextAreaToContent(editorRef.current);
  }, [draft, editing]);

  if (!editing) {
    return (
      <button
        className="athena-reading-reply-open"
        onClick={() => {
          setDraft(answer);
          setEditing(true);
        }}
        type="button"
      >
        {answer ? "Replied" : "Reply"}
      </button>
    );
  }

  return (
    <form
      className="athena-reading-reply-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.trim()) return;
        onSend(draft.trim());
        setEditing(false);
      }}
    >
      <textarea
        aria-label={`Reply to Athena: ${prompt.text}`}
        autoFocus
        maxLength={1600}
        onChange={(event) => setDraft(event.currentTarget.value)}
        placeholder="Write what comes up..."
        ref={editorRef}
        rows={2}
        value={draft}
      />
      <button disabled={!draft.trim()} type="submit">Send</button>
    </form>
  );
}

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
  historyAvailable,
  onCommit,
  onSetup,
  onToggleHistory,
}: {
  kind: DeclarationKind;
  label: string;
  empty: string;
  record?: DeclarationRecord;
  current: boolean;
  historyAvailable: boolean;
  onCommit: (content: Record<string, string>) => void;
  onSetup: () => void;
  onToggleHistory: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const fields = DECLARATION_FIELDS[kind];

  useLayoutEffect(() => {
    for (const editor of pageRef.current?.querySelectorAll("textarea") || []) {
      sizeTextAreaToContent(editor);
    }
  }, [draft, editing]);

  const clean = Object.fromEntries(
    fields.map((field) => [field.key, String(draft[field.key] || "").trim()]),
  );
  const complete = fields.every((field) => clean[field.key]);
  const changed = Boolean(
    record && fields.some(
      (field) => clean[field.key] !== String(record.content[field.key] || "").trim(),
    ),
  );

  function beginEditing() {
    if (!record || !current) return;
    setDraft({ ...record.content });
    setEditing(true);
  }

  function beginEditingFromKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    beginEditing();
  }

  function saveDeclaration() {
    if (!record || !current || !complete || !changed) return;
    onCommit(clean);
    setDraft(clean);
    setEditing(false);
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
    const value = editing
      ? draft[field.key] || ""
      : record.content[field.key] || "";
    if (!current || !editing) {
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
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            setDraft((value) => ({
              ...value,
              [field.key]: nextValue,
            }));
          }}
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
        current && editing ? (
          <button
            className="vision-declaration-save os-page-primary-action"
            disabled={!complete || !changed}
            onClick={saveDeclaration}
            type="button"
          >
            Save declaration
          </button>
        ) : (
          <span className="vision-declaration-date">
            {current ? "Declared" : "Earlier"} {declarationDate(record.declaredAt)}
          </span>
        )
      }
      headerLeft={
        historyAvailable || !current ? (
          <button
            className="os-card-label vision-history-toggle"
            onClick={onToggleHistory}
            aria-label={current ? `Show history for ${label}` : `Show current ${label}`}
            type="button"
          >
            {label}
          </button>
        ) : (
          <p className="os-card-label">{label}</p>
        )
      }
      headerRight={
        !current ? (
          <span className="os-card-label vision-history-indicator">History</span>
        ) : undefined
      }
      theme="light"
    >
      <div
        className={`vision-declaration-copy${current && !editing ? " is-tappable" : ""}`}
        onClick={current && !editing ? beginEditing : undefined}
        onKeyDown={current && !editing ? beginEditingFromKeyboard : undefined}
        ref={pageRef}
        role={current && !editing ? "button" : undefined}
        tabIndex={current && !editing ? 0 : undefined}
      >
        <div className="os-page-main">{fieldViews[0]}</div>
        {fieldViews.length > 1 ? (
          <div className="os-page-sub">{fieldViews.slice(1)}</div>
        ) : null}
      </div>
    </PageLayout>
  );
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
  // One part opened at a time: the deeper it goes the more it expands.
  const visionSessionRef = useRef<HTMLElement>(null);
  const athenaSessionRef = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState({
    name: "",
    age: "",
  });
  const lifeBack = useAppBack<"current" | "history">("current");
  useStableRouteAnchor(visionSessionRef, athenaSessionRef);
  const [declarationHistoryIndex, setDeclarationHistoryIndex] = useState(0);
  const summary = summarizeWeek(state);
  // The day just gone opens the Week Review rather than standing in its own App
  // Box. Sai: "Yesterday, doesnt need its own app box, it should be inside the
  // week review." It is the same mirror at a finer grain, so the reading widens
  // from the day to the week instead of asking for a second box to do it.
  const profileCase = state.profile.profileCase;
  const publicationProfileId = state.ai.profileId || "local";
  const locationSearch = useSyncExternalStore(
    subscribeToMirrorLocation,
    mirrorLocationSearch,
    serverMirrorLocationSearch,
  );
  const declarationSearch = new URLSearchParams(locationSearch);
  const requested = declarationSearch.get("declare");
  const requestedAttempt = declarationSearch.get("attempt");
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
  const requestedSetupAttempt =
    requestedDeclaration &&
    desiredDeclaration === requestedDeclaration &&
    requestedAttempt &&
    /^\d+$/.test(requestedAttempt)
      ? requestedAttempt
      : null;
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
          if (requestedSetupAttempt) {
            return true;
          }
          const run = state.chapters.runs[chapterRunId(publication.chapter)];
          return (
            publicationIsNewerThanRun(publication, run) ||
            (run?.status !== "completed" && !run?.deferredAt)
          );
        }) || null
    : null;
  const declarationSetupRunId =
    desiredDeclarationPublication && requestedSetupAttempt
      ? `${chapterRunId(desiredDeclarationPublication.chapter)}:setup:${requestedSetupAttempt}`
      : undefined;
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
  /**
   * The four parts of a life, and the one that has gone longest without.
   *
   * The hour matters because the week rolls on a Sunday evening: after that the
   * window ends on the week he is planning rather than the one just lived.
   */
  const dimensions = dimensionRecord(state, getDateKey(), new Date().getHours());
  const starved = starvedDimension(dimensions);
  /**
   * Which of The Four's Pages is showing.
   *
   * Kept in `appSessions` like every other App's, so the part of himself he
   * was reading is still there when he comes back to the tab. The version is
   * the shape of the session rather than its contents: the Pages only change
   * in number if the four parts of a life ever do.
   */
  const visibleFourApp = appSessionIndex(
    state,
    "mirror-four",
    FOUR_APP_VERSION,
    0,
  );
  const openFourPage = (index: number) =>
    updateState((current) =>
      setAppSessionIndex(current, "mirror-four", FOUR_APP_VERSION, index),
    );
  const updateLabel = athenaFreshnessLabel(
    state,
    athenaReading,
    profileCase.updatedAt,
  );
  const profileJourneyVersion = [
    readingUpdatedAt,
    athenaReading.preparedAt,
    state.evidence.acknowledgedRevision,
    profileCase.status,
  ].join("|");
  const currentDeclarationPages = DECLARATION_PAGES.map((page) => {
    const versions = declarationVersions(state, page.kind) as DeclarationRecord[];
    return {
      ...page,
      record: versions[0],
      current: true,
    };
  });
  const declarationHistoryPages = DECLARATION_PAGES.reduce<
    Array<
      (typeof DECLARATION_PAGES)[number] & {
        record?: DeclarationRecord;
        current: boolean;
      }
    >
  >((pages, page) => {
    const versions = declarationVersions(state, page.kind) as DeclarationRecord[];
    pages.push(
      ...versions.slice(1).map((record) => ({
        ...page,
        record,
        current: false,
      })),
    );
    return pages;
  }, []);
  const declarationPageRecords =
    lifeBack.side === "history"
      ? declarationHistoryPages
      : currentDeclarationPages;
  const lifePageCount = declarationPageRecords.length;
  // The current deck always has the same three kinds. Legacy Dreamline
  // declaration records remain immutable in state, but desired lifestyle now
  // belongs to the finite Dreamline App behind Log.
  const lifeJourneyVersion = "declarations-current-v3";
  const visibleLifeApp = appSessionIndex(
    state,
    "vision-life",
    lifeJourneyVersion,
    0,
  );
  const visibleDeclarationPage = lifeBack.side === "history"
    ? Math.max(0, Math.min(declarationHistoryPages.length - 1, declarationHistoryIndex))
    : visibleLifeApp;
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
  const latestEdition = athenaReading.editions[0] as AthenaEdition | undefined;
  const latestEditionIsToday = Boolean(
    latestEdition?.publishedAt &&
      getDateKey(new Date(latestEdition.publishedAt)) === getDateKey(),
  );
  // The cover never borrows yesterday's authored line. The three reading Pages
  // may still use today's source-linked observations when prose is quiet.
  const readingCoverLine =
    latestEditionIsToday && latestEdition?.cover
      ? latestEdition.cover
      : "Athena has not written this morning.";
  const readingPages = athenaReading.pages;
  const betweenPageCount = profileReady ? 4 : 1;
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

  function toggleDeclarationHistory(
    kind: DeclarationKind,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    const nextSide = lifeBack.side === "current" ? "history" : "current";
    lifeBack.flip(
      nextSide,
      () => {
        if (nextSide !== "history") return;
        const matchingIndex = declarationHistoryPages.findIndex(
          (page) => page.kind === kind,
        );
        setDeclarationHistoryIndex(Math.max(0, matchingIndex));
      },
      event.currentTarget,
    );
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

  function sendAthenaReadingReply(
    prompt: AthenaReadingPrompt,
    answer: string,
  ) {
    updateState((current) =>
      answerSurveyQuestion(current, prompt, answer, "athena-reading"),
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
    page: AthenaReadingPage,
    label: string,
    title: string,
    memorySections: Array<{ heading: string; text: string; paragraphs?: string[] }>,
    fallbackKeys: Array<[string, string]>,
  ) {
    // Only one Page in a reading asks anything. Sai: "only your shape page
    // would be a reply to Athena's question." Days and Alive are what she
    // noticed; Shape is where she hands it back, so that is where a reply
    // belongs and the other two stay reading surfaces.
    const prompt: AthenaReadingPrompt | null =
      page === "shape"
        ? buildAthenaReadingReplyPrompt(
            page,
            memorySections,
            athenaReading.latestEditionId,
          )
        : null;
    const answer = prompt
      ? profileCase.survey.answers.find(
          (item) => item.questionId === prompt.id,
        )?.answer || ""
      : "";
    return (
      <article className="athena-reader-app" key={label}>
        <header>
          <p className="os-card-label">{label}</p>
          <h2>{title}</h2>
        </header>
        <div className="athena-reader-copy">
          {memorySections.length
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
        {prompt ? (
          <AthenaReadingReply
            answer={answer}
            onSend={(value) => sendAthenaReadingReply(prompt, value)}
            prompt={prompt}
          />
        ) : null}
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

        <section
          className="vision-profile-case"
          aria-label="The life you want"
          ref={visionSessionRef}
        >
          {visionPublication ? (
            <PublishedChapterDelivery
              className="vision-life-apps"
              label="Vision chapter"
              onCompleted={completeDeclaration}
              publication={visionPublication}
              runId={declarationSetupRunId}
            />
          ) : (
          <SwipeSession
            attentionKey={`vision-life:${lifeJourneyVersion}`}
            availableIndices={Array.from(
              { length: lifePageCount },
              (_, index) => index,
            )}
            className={`vision-life-apps${lifeBack.className ? ` ${lifeBack.className}` : ""}`}
            index={visibleDeclarationPage}
            label="The life you want apps"
            maxIndex={Math.max(0, lifePageCount - 1)}
            onIndexChange={(nextIndex) => {
              if (lifeBack.side === "history") {
                setDeclarationHistoryIndex(nextIndex);
                return;
              }
              updateState((current) =>
                setAppSessionIndex(
                  current,
                  "vision-life",
                  lifeJourneyVersion,
                  nextIndex,
                ),
              );
            }}
          >
            {declarationPageRecords.map((page) => (
              <DeclarationPage
                current={page.current}
                empty={page.empty}
                historyAvailable={declarationHistoryPages.length > 0}
                key={page.current ? `current-${page.kind}` : page.record?.id}
                kind={page.kind}
                label={page.label}
                onCommit={(content) => commitDeclaration(page.kind, content)}
                onSetup={() =>
                  router.push(
                    `/os/mirror?declare=${page.kind}&attempt=${Date.now()}`,
                  )
                }
                onToggleHistory={(event) =>
                  toggleDeclarationHistory(page.kind, event)
                }
                record={page.record}
              />
            ))}
          </SwipeSession>
          )}
        </section>

        {/* The Week moved into the Log.
          *
          * Sai: "can we remove the week session temporarily. Move Week app to
          * the back of the log app." Planning a week is the same act as logging
          * a day, one size up, and Reflect is for reading — which is why he
          * never opened it here. The Week App itself is unchanged; only where
          * it lives has. `week-app-model.js` is still its source of truth.
          */}

        <header className="mirror-intro between-intro">
          <div>
            <p className="os-eyebrow">Athena&apos;s Reading</p>
            <h1>A reading of your life</h1>
            <p className="profile-updated">{updateLabel}</p>
          </div>
        </header>

        <section
          className="vision-between-session"
          aria-label="Athena's Reading"
          ref={athenaSessionRef}
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
              Array.from({ length: betweenPageCount }, (_, index) => index)
            }
            className="vision-between-apps athena-reader-session"
            index={visibleBetweenApp}
            label="Athena's Reading apps"
            maxIndex={betweenPageCount - 1}
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
              <p className="os-card-label">Athena&apos;s Reading</p>
              <h2>{profileReady ? readingCoverLine : "Athena is still learning."}</h2>
              {/* When this reading was written, said once. Athena writes on her
                  own schedule, so the reading has to say how old it is — but on
                  the Cover, which is where you arrive, not on all three Pages.
                  Sai: "the updated date would be on the cover page. we dont need
                  it for every page." */}
              <div className="gap-cover-foot">
                <p className="athena-reader-updated">{updateLabel}</p>
                <span>{profileReady ? "Swipe to see" : "Still learning"}</span>
              </div>
            </div>

            {athenaReaderApp(
              "days",
              "Your days",
              "The life you are living.",
              readingPages.days,
              [["currentLife", "Current life"]],
            )}
            {athenaReaderApp(
              "alive",
              "What feels alive",
              "What matters to you.",
              readingPages.alive,
              [
                ["whatMatters", "What matters"],
                ["interests", "Interests"],
              ],
            )}
            {athenaReaderApp(
              "shape",
              "Your shape",
              "How you may move through life.",
              readingPages.shape,
              [["personality", "Personality"]],
            )}
          </SwipeSession>
          )}
        </section>

        {/* Reflect's deepest layer.
          *
          * The tab is a pyramid at longer horizons than Today's: what he said
          * he wanted on top, the gap in the middle, and this at the foundation.
          * Athena sits above it because the gap she reads is between the claim
          * and this evidence.
          *
          * It says one thing out loud, and it is the part that has gone
          * hungry. Nothing here is a score: every filled week is a week he
          * himself said was fed, and nothing ever subtracts. */}
        <section className="vision-four-session" aria-label="The Four" hidden={!SHOW_THE_FOUR}>
          {/* An App, not something shaped like one.
            *
            * This was a hand-rolled article, then a lone Page in a box. Both
            * were still only the shape of an App: no window to size itself
            * against, no session, and nothing to swipe. Sai: "and still the
            * four is not an app. the sizing, the swiping, nothing works."
            *
            * It is a session of five Pages now, the way every App in the OS is
            * built. The first is the record — the one thing it says out loud,
            * over four rows of twenty-six weeks. Behind it stands one Page for
            * each part of a life, which is where the detail went: the quality
            * he named it, when it was last fed, and the habits standing under
            * it. Tapping a row opens its Page, and the index is kept in
            * `appSessions` like every other App's, so the part he was reading
            * is still there when he comes back. */}
          <SwipeSession
            attentionKey={`mirror-four:${FOUR_APP_VERSION}`}
            availableIndices={Array.from(
              { length: dimensions.length + 1 },
              (_, index) => index,
            )}
            className="vision-four-apps"
            index={visibleFourApp}
            label="The Four apps"
            maxIndex={dimensions.length}
            onIndexChange={openFourPage}
          >
            <PageLayout
              className="vision-four-app"
              footer={
                <p className="vision-four-window">
                  {DIMENSION_WINDOW_WEEKS} weeks · one square a week
                </p>
              }
              headerLeft={<p className="os-card-label">The Four</p>}
              key="four-record"
              theme="dark"
            >
              <div className="os-page-main">
                <h2>{starved ? starvedLine(starved) : "Four parts of a life."}</h2>
              </div>
              <div className="os-page-sub vision-four-rows">
                {dimensions.map((row, index) => (
                  <button
                    className="vision-four-head"
                    key={row.dimension}
                    onClick={() => openFourPage(index + 1)}
                    type="button"
                  >
                    <span className="vision-four-title">
                      <span className="vision-four-name">{row.dimension}</span>
                      <span className="vision-four-count">{row.fed}</span>
                    </span>
                    <span aria-hidden="true" className="vision-four-weeks">
                      {row.weeks.map((week) => (
                        <i
                          className={week.fed ? "is-fed" : undefined}
                          key={week.weekKey}
                        />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </PageLayout>

            {dimensions.map((row) => (
              <PageLayout
                className="vision-four-app vision-four-part"
                footer={
                  <p className="vision-four-window">
                    {row.fed
                      ? `${row.fed} ${row.fed === 1 ? "week" : "weeks"} on record`
                      : "No week on record"}
                  </p>
                }
                headerLeft={<p className="os-card-label">{row.dimension}</p>}
                headerRight={
                  <p className="vision-four-since">{sinceLine(row)}</p>
                }
                key={row.dimension}
                theme="dark"
              >
                <div className="os-page-main">
                  <h2>{row.trait || "Not named yet."}</h2>
                </div>
                <div className="os-page-sub vision-four-part-body">
                  <span aria-hidden="true" className="vision-four-weeks">
                    {row.weeks.map((week) => (
                      <i
                        className={week.fed ? "is-fed" : undefined}
                        key={week.weekKey}
                      />
                    ))}
                  </span>
                  {row.habits.length ? (
                    <ul className="vision-four-habits">
                      {row.habits.map((habit) => (
                        <li key={habit.id}>{habit.action}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="vision-four-empty">
                      No habit stands under it yet.
                    </p>
                  )}
                </div>
              </PageLayout>
            ))}
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
