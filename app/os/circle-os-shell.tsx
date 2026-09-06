"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  CIRCLE_DAY_START_HOUR,
  addHabitDefinition,
  addTask,
  answerSurveyQuestion,
  connectLocalAi,
  createEmptyState,
  addDreamlineStep,
  commitDreamlineSteps,
  concludeExpiredDreamlines,
  currentDreamline,
  dreamlineIncome,
  dreamlineProgress,
  dreamlineRecords,
  dreamlineStrategy,
  ensureDay,
  activeProtocolRun,
  addProtocolItem,
  appSessionIndex,
  archiveProtocolRun,
  beginProtocolRun,
  discardProtocolDraft,
  setProtocolGoal,
  canBeginProtocolRun,
  completeTask,
  dayRecord,
  discardEmptyProtocolItem,
  endProtocolRun,
  latestCompletedProtocol,
  protocolPhaseRecords,
  protocolToday,
  renameProtocolRun,
  setProtocolDays,
  startProtocolDraft,
  sealProtocolDay,
  saveDreamlineItem,
  setDreamlineReached,
  setDreamlineStarred,
  setDreamlineStepDone,
  startDreamline,
  toggleProtocolItem,
  toggleProtocolRecordItem,
  updateProtocolItem,
  previousDateKey,
  reopenTask,
  discardEmptyHabit,
  discardEmptyTask,
  getDateKey,
  mergeServerState,
  minutesBetween,
  normalizeState,
  queueProfileUpdate,
  markLineSeen,
  reactToLineSeen,
  setAppSessionIndex,
  setDayLogRange,
  setDayTitle,
  toggleHabitForDay,
  updateHabitDefinition,
  updateHabitDefinitionDraft,
  updateHabitDefinitionParts,
  updateRoutineIdentity,
  updateDreamlineSetup,
  updateDreamlineStep,
  updateTask,
  upsertTimeBlock,
} from "./circle-os-model.js";
import {
  buildServerPayload,
  readCircleState,
  recoverCircleProfile,
  syncCircleState,
} from "./circle-os-ai";
import { loadCircleState, saveCircleState } from "./circle-os-store";
import {
  IDLE_PAGE_DWELL_MS,
  InfoPage,
  PageLayout,
  SwipeSession,
} from "./app-session";
import { sizeTextAreaToContent } from "./text-area-size";
import { useAppBack } from "./app-back";
import {
  DreamlineIdlePage,
  DreamlineSheetPage,
  type DreamlineCategory,
  type DreamlineItem,
  type DreamlineProgressView,
  type DreamlineRecord,
  type DreamlineStrategyLine,
  type DreamlineStep,
} from "./dreamline-pages";
import linePool from "./lines/lines.json";
import { selectLine } from "./lines/line-pool.js";
import {
  LINE_REACTION_WORDS,
  LINE_REACTION_LABELS,
  lineReaction,
  lineReactions,
} from "./lines/line-feedback.js";
import notePlaceholderPool from "./note-placeholders/note-placeholders.json";
import { nextNotePlaceholder } from "./note-placeholders/note-placeholder-pool.js";
import { ButtonRewardBackdrop, CreativeButton } from "./button-engine";
import {
  isDeepThoughtRewardEligible,
  selectDeepThoughtPrompt,
  type DeepThoughtPrompt,
} from "./deep-thought-model.js";
import { selectThoughtPrompt } from "./thought-prompt-model.js";
import { firstUsePlaceholder } from "./first-use.js";
import { weekDays, weekStartKey } from "./week-app-model.js";
import {
  addGoalStep,
  addWeekGoal,
  discardEmptyGoal,
  discardEmptyStep,
  goalById,
  goalStepForTask,

  taskIsUnderDoneGoal,
  toggleGoal,
  updateGoal,
  weekGoal,
  weekGoals,
} from "./goal-model.js";

/**
 * The name the Week's own row for a step answers to.
 *
 * Routine shows a row for the same task, addressed by the task's id and standing
 * earlier in the page, so a step written in the Week has to be reachable by a
 * name only the Week uses.
 */
function weekStepEditorId(taskId: string) {
  return `week-step-${taskId}`;
}
import { ChapterPlayer } from "./chapters/chapter-player";
import {
  ProtocolKeptPage,
  ProtocolPage,
  type ProtocolSealView,
} from "./protocol-page";
import {
  chapterEverCompleted,
  chapterRunId,
  chapterAnswerText,
  createChapterRun,
  renderChapterTemplate,
  storeChapterRun,
} from "./chapters/chapter-model.js";
import {
  getPublishedChapter,
} from "./chapters/registry";
import {
  normalizeChapterPublication,
  publicationIsNewerThanRun,
  firstUsePublicationDone,
  selectFirstUsePublication,
  selectPendingAppPublication,
  writeSyncedChapterPublications,
} from "./chapters/chapter-publication-store";
import {
  chapterFacts,
  countChaptersStartedOn,
  selectScheduledChapter,
} from "./chapters/chapter-scheduler.js";
import { useChapterPublications } from "./chapters/use-chapter-publications";
import type {
  ChapterPublication,
  ChapterRun,
  ChapterSubmission,
} from "./chapters/chapter-types";

/**
 * Whether the Dreamline is dealt into the Routine App Box.
 *
 * Off for v1. Sai: "can you hide the dreamline app for a while. i will come to
 * it later with the better system." The record, the model and the Pages all
 * stay exactly as they are — a Dreamline already in state keeps accumulating
 * and expiring — so turning this back on restores the two Pages where they
 * were. Nothing about the feature is being deleted or migrated here.
 */
const SHOW_DREAMLINE = false;

/**
 * How long a sent thought takes to leave the Page. Matches
 * `os-thought-departure` in the stylesheet; the draft is cleared as the last
 * of the words fade, so the placeholder never appears underneath them.
 */
const THOUGHT_DEPARTURE_MS = 420;

/**
 * The Send button's design.
 *
 * It used to be dealt from the rotating bag, so the one action Thoughts has
 * looked like a different button every time it appeared. Sai: "Make the button
 * design standard." The bag and its styles remain for Button Studio; the App
 * uses the standard key.
 */
const THOUGHT_BUTTON_STYLE = "default";

/**
 * The two faces of a habit row, and the height of whichever one is showing.
 *
 * This was a two-row grid collapsing one track to `minmax(0, 0fr)`. It measures
 * correctly in Chromium and did not collapse on Sai's phone across four
 * attempts, so the row kept the height of a four-line action while showing a
 * one-line identity, and the tick centred in the empty space.
 *
 * The height is measured here instead. A `height` transition is the oldest and
 * most boringly supported animation there is, and a measured number cannot be
 * reinterpreted by a layout engine.
 */
function HabitCopySwap({
  children,
  completed,
  showIdentity,
}: {
  children: ReactNode;
  completed: boolean;
  showIdentity: boolean;
}) {
  const frame = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  // Whether this row has been on screen before. Swiping away unmounts the Page
  // and coming back mounts it fresh, so a habit that was already showing its
  // identity would otherwise sit through the three-second wait again with no
  // height set — which is why the alignment was gone every time he came back.
  const firstRun = useRef(true);
  // The wait belongs to the tick, not to the identity being on screen.
  //
  // Sai: "identity flashes everytime i view the page." Three states all used to
  // arrive here as `showIdentity` going true, and only one of them is a change
  // worth animating: the habit being ticked. Coming back to the Page, and
  // closing the editor after a tap, are both just the row being what it already
  // is. Tracking `completed` separately is what tells them apart.
  const wasCompleted = useRef(completed);
  // Set when the identity is simply already here, so nothing fades.
  const [immediate, setImmediate] = useState(false);
  // The identity is shown by this flag, not by a delay of its own. A CSS delay
  // is counted from the tick, while the row's height is moved by a timer here,
  // and the two drifted apart by enough that the identity sometimes arrived
  // before the space for it did.
  const [settled, setSettled] = useState(false);

  // Only `showIdentity` belongs here. `children` is a fresh value on every
  // render, so depending on it re-ran this effect constantly and cleared the
  // three-second timer before it could ever fire — the row simply never
  // resized. Content changes are caught by the observer instead, which is what
  // it is for.
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const faces = () => Array.from(element.children) as HTMLElement[];

    const measure = () => {
      const face = faces()[showIdentity ? 1 : 0];
      if (!face) return;
      const next = Math.ceil(face.getBoundingClientRect().height);
      if (next > 0) setHeight(next);
    };

    // A face grows while it is being typed into, and a webfont can replace the
    // fallback after first layout.
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    let timer = 0;

    // Only a tick earns the wait. Arriving on the Page already done, or closing
    // the editor again, are not changes — they are the row's resting state.
    const justCompleted = completed && !wasCompleted.current;
    wasCompleted.current = completed;

    // A row that is already settled when it appears just measures. The wait is
    // for the change itself, not for the state.
    if (showIdentity && justCompleted && !firstRun.current) {
      setImmediate(false);
      // Turning into the identity is one deliberate motion: it waits out the
      // three seconds the crossed row stays readable, then moves once.
      timer = window.setTimeout(() => {
        window.setTimeout(() => setSettled(true), 480);
        // The App Box eases its own height for a Page change and snaps for a
        // content edit, so typing never lags behind the finger. This is
        // neither — it is one settling move — and without borrowing that ease
        // the row glided while the frame jumped underneath it.
        const box = element.closest(".os-app-window");
        box?.classList.add("page-resizing");
        window.setTimeout(() => box?.classList.remove("page-resizing"), 620);
        measure();
        for (const item of faces()) observer?.observe(item);
      }, 3240);
    } else {
      // Either the row is going back to its action, or the identity is already
      // what it says — a Page swiped away and returned to, or the editor
      // closing. None of these is a change to animate, and animating them is
      // what made the identity flash on arrival: the action sat there for three
      // seconds while the identity faded in over the top of it.
      setImmediate(showIdentity);
      setSettled(showIdentity);
      measure();
      for (const item of faces()) observer?.observe(item);
    }

    firstRun.current = false;

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [completed, showIdentity]);

  return (
    <div
      className={`os-habit-copy-swap${showIdentity ? " show-identity" : ""}${
        settled ? " has-settled" : ""
      }${immediate ? " is-immediate" : ""}`}
      ref={frame}
      style={height === null ? undefined : { height: `${height}px` }}
    >
      {children}
    </div>
  );
}

/**
 * A chapter with the screen to itself.
 *
 * Setting up is not one App among others, so it is not drawn as one. The
 * chapter inside is the same chapter, authored in the same Workshop, saved to
 * the same run — only the frame around it changes. Sai: "i am thinking the
 * first time user, splash screen for the first day set-up ... can we use the
 * splash screen as a chapter too?"
 *
 * It is fixed over the Page rather than replacing it, so nothing about the feed
 * underneath has to know a setup is happening; when the last question is
 * answered the splash stops rendering and the App is simply there.
 */
export function ChapterSplash({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div aria-label={label} aria-modal="true" className="os-splash" role="dialog">
      <div className="os-splash-frame">{children}</div>
    </div>
  );
}

export function PublishedChapterDelivery({
  publication,
  className,
  backApp,
  hideIdleHeading = false,
  label,
  onDismissed,
  onCompletedReturn,
  onCompleted,
  runId,
}: {
  publication: ChapterPublication;
  className: string;
  backApp?: ReactNode;
  hideIdleHeading?: boolean;
  label: string;
  onDismissed?: () => void;
  onCompletedReturn?: () => void;
  onCompleted?: (state: CircleState, run: ChapterRun) => CircleState;
  runId?: string;
}) {
  const { state, updateState } = useCircleState();
  const chapter = publication.chapter;
  const activeRunId = runId || chapterRunId(chapter);
  const createActiveRun = () => ({
    ...createChapterRun(chapter),
    runId: activeRunId,
  });
  const storedRun = state.chapters.runs[activeRunId];
  const run = publicationIsNewerThanRun(publication, storedRun)
    ? createActiveRun()
    : storedRun || createActiveRun();

  function saveRun(nextRun: ChapterRun) {
    if (nextRun.status === "completed" && run.status !== "completed") {
      onCompletedReturn?.();
    }
    updateState((current) => {
      const previous = current.chapters.runs[nextRun.runId];
      let next = storeChapterRun(current, nextRun, chapter.session);
      if (nextRun.status === "completed" && previous?.status !== "completed") {
        next = onCompleted
          ? onCompleted(next, nextRun)
          : queueProfileUpdate(next, "survey-answer");
      }
      return next;
    });
  }

  function dismiss() {
    onDismissed?.();
    const timestamp = new Date().toISOString();
    updateState((current) =>
      storeChapterRun(
        current,
        {
          ...run,
          deferCount: (run.deferCount || 0) + 1,
          deferredAt: timestamp,
          dismissedAt: timestamp,
          updatedAt: timestamp,
        },
        chapter.session,
      ),
    );
  }

  return (
    <ChapterPlayer
      attentionKey={`publication:${publication.targetApp}:${chapter.id}:${chapter.version}`}
      backApp={backApp}
      className={className}
      definition={chapter}
      hideIdleHeading={hideIdleHeading}
      key={activeRunId}
      label={label}
      onBackAppShown={backApp ? dismiss : undefined}
      onRunChange={saveRun}
      run={run}
    />
  );
}

function freshInlineEditorId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type CheckIn = {
  period: string;
  energy: number | null;
  mood: string | null;
  createdAt: string;
};

const ADMIN_THOUGHT = "admin";

type Mission = {
  text: string;
  why: string;
  identity: string;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string | null;
};

type ExtraMission = {
  id: string;
  text: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  kind?: "habit" | "task";
};

function InlineCheckInEditor({
  clearSignal = 0,
  note,
  onCommit,
  onEditingChange,
  placeholder,
  title,
}: {
  /** Increments when the Page's Clear action is pressed. */
  clearSignal?: number;
  note: string;
  onCommit: (title: string, note: string) => void;
  onEditingChange?: (editing: boolean) => void;
  placeholder: string;
  title: string;
}) {
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const editingRef = useRef(false);
  const lastClearSignal = useRef(clearSignal);
  const clearedAt = useRef(0);
  const [titleDraft, setTitleDraft] = useState(title);
  const [noteDraft, setNoteDraft] = useState(note);

  useLayoutEffect(() => {
    if (editingRef.current) return;
    setTitleDraft(title);
    setNoteDraft(note);
  }, [note, title]);

  // Clear empties both bodies and leaves the caret in the main one, so the next
  // thing that happens is writing. The rotating words stay a placeholder; they
  // are never committed as if the person wrote them.
  //
  // It also stays in editing. On a phone the press blurs the note, and that
  // blur is the tail of the clear rather than a separate edit: left alone it
  // could otherwise race the explicit empty commit.
  useLayoutEffect(() => {
    if (clearSignal === lastClearSignal.current) return;
    lastClearSignal.current = clearSignal;
    clearedAt.current = Date.now();
    editingRef.current = true;
    setTitleDraft("");
    setNoteDraft("");
    onCommit("", "");
    titleRef.current?.focus();
  }, [clearSignal, onCommit]);

  useLayoutEffect(() => {
    for (const editor of [titleRef.current, noteRef.current]) {
      sizeTextAreaToContent(editor);
    }
  }, [noteDraft, titleDraft]);

  function beginEditing() {
    editingRef.current = true;
    onEditingChange?.(true);
  }

  function commit() {
    // The blur that a press on Clear causes belongs to the clear. Writing here
    // would race the blank value it just committed.
    if (Date.now() - clearedAt.current < 600) {
      titleRef.current?.focus();
      return;
    }
    editingRef.current = false;
    onEditingChange?.(false);
    // Nothing written means the caption was the sentence. It is committed as
    // real, editable text rather than staying a hint that disappears the moment
    // anything else is typed.
    const nextTitle = titleDraft.trim() || placeholder.trim();
    const nextNote = noteDraft.trim();
    setTitleDraft(nextTitle);
    setNoteDraft(nextNote);
    onCommit(nextTitle, nextNote);
  }

  return (
    <div className="os-inline-checkin-note">
      <div className="os-info-page-main">
        <textarea
          aria-label="Edit idle title"
          className="os-inline-checkin-title"
          onBlur={commit}
          onChange={(event) => setTitleDraft(event.currentTarget.value)}
          onFocus={beginEditing}
          placeholder={placeholder}
          ref={titleRef}
          rows={1}
          value={titleDraft}
        />
      </div>
      <div className="os-info-page-sub">
        <textarea
          aria-label="Edit idle note"
          className="os-inline-checkin-copy"
          onBlur={commit}
          onChange={(event) => setNoteDraft(event.currentTarget.value)}
          onFocus={beginEditing}
          placeholder=""
          ref={noteRef}
          rows={1}
          value={noteDraft}
        />
      </div>
    </div>
  );
}

export type TimeBlock = {
  id: string;
  start: string;
  end: string;
  activity: string;
  note: string;
  title?: string;
  moments?: string[];
  createdAt: string;
  updatedAt?: string;
};

type CircleDay = {
  date: string;
  title?: string;
  checkIns: CheckIn[];
  mission: Mission;
  missions?: ExtraMission[];
  timeBlocks: TimeBlock[];
  logRange?: {
    startHour: number;
    endHour: number;
  } | null;
};

function latestPublishedChapters(publications: ChapterPublication[]) {
  return Object.values(
    publications.reduce<Record<string, ChapterPublication>>(
      (latest, publication) => {
        const previous = latest[publication.chapter.id];
        if (
          !previous ||
          previous.publishedAt < publication.publishedAt ||
          (previous.publishedAt === publication.publishedAt &&
            previous.chapter.version < publication.chapter.version)
        ) {
          latest[publication.chapter.id] = publication;
        }
        return latest;
      },
      {},
    ),
  ).map((publication) => publication.chapter);
}

export type CircleState = {
  version: number;
  ai: {
    baseUrl: string;
    token: string;
    profileId: string;
    status: string;
    lastError: string;
    lastRunAt: string | null;
    lastSyncedAt: string | null;
    lastSyncSlot: string;
  };
  profile: {
    identityFocus: string;
    name: string;
    age: number | null;
    vision: {
      description: string;
      preview: string;
      understanding: string;
      gap: string;
      completedAt: string | null;
    };
    profileCase: {
      status: string;
      updatedAt: string | null;
      sessions: Record<
        string,
        {
          text: string;
          confidence: number;
          userEdited: boolean;
          updatedAt: string | null;
        }
      >;
      survey: {
        answers: Array<{
          questionId: string;
          question: string;
          answer: string;
          target: string;
          kind?: string;
          source?: "athena" | "curiosity" | "local" | "local-personalized";
          answeredAt: string;
        }>;
        nextQuestion: {
          id: string;
          text: string;
          target: string;
        } | null;
      };
      deepThoughtPrompt: {
        id: string;
        text: string;
        target: string;
        dateKey: string;
        source: "athena" | "curiosity" | "local" | "local-personalized";
        preparedAt: string;
      } | null;
    };
  };
  days: Record<string, CircleDay>;
  chapters: {
    runs: Record<string, ChapterRun>;
    sessions: Record<
      string,
      {
        activeRunId: string;
        lastSeenChapterVersion: number;
        updatedAt: string;
      }
    >;
  };
  appSessions: Record<
    string,
    {
      version: string;
      index: number;
      updatedAt: string;
    }
  >;
  habits: {
    identity: {
      text: string;
      updatedAt: string | null;
    };
    definitions: Record<
      string,
      {
        id: string;
        text: string;
        action: string;
        cue: string;
        identity: string;
        status: "active" | "archived";
        createdAt: string;
        updatedAt: string;
      }
    >;
    completions: Record<
      string,
      {
        id: string;
        habitId: string;
        dateKey: string;
        completed: boolean;
        completedAt: string | null;
        updatedAt: string;
      }
    >;
  };
  tasks: {
    items: Record<
      string,
      {
        id: string;
        text: string;
        status: "open" | "completed" | "archived";
        createdAt: string;
        updatedAt: string;
        completedAt: string | null;
      }
    >;
  };
  // What a day is for, and the smallest step toward it. A step holds the id of
  // the Routine task that *is* that step rather than a copy of its words.
  goals: {
    items: Record<
      string,
      {
        id: string;
        dateKey: string;
        text: string;
        status: "open" | "done";
        completedAt: string | null;
        createdAt: string;
        updatedAt: string;
      }
    >;
    steps: Record<
      string,
      { id: string; goalId: string; taskId: string; createdAt: string }
    >;
  };
  declarations: {
    records: Record<
      string,
      {
        id: string;
        kind: "vision" | "missionStatement" | "typicalTuesday" | "dreamline";
        content: Record<string, string>;
        declaredAt: string;
        supersedesId: string | null;
        targetAt?: string | null;
      }
    >;
  };
  dreamlines: {
    records: Record<
      string,
      {
        id: string;
        status: "active" | "concluded";
        months: number;
        monthlyExpensesCents: number;
        items: Record<
          string,
          {
            id: string;
            category: "having" | "being" | "doing";
            text: string;
            convertedDoing: string;
            costCents: number;
            cadence: "monthly" | "one-time";
            starred: boolean;
            steps: { now: string; tomorrow: string; dayAfter: string };
            createdAt: string;
            updatedAt: string;
          }
        >;
        createdAt: string;
        startedAt: string;
        targetAt: string | null;
        concludedAt: string | null;
        updatedAt: string;
      }
    >;
  };
  protocol: {
    runs: Record<string, Record<string, unknown>>;
    completions: Record<string, Record<string, unknown>>;
    seals: Record<string, Record<string, unknown>>;
  };
  evidence: {
    localRevision: number;
    acknowledgedRevision: number;
    lastChangedAt: string | null;
    lastAcknowledgedAt: string | null;
  };
  athenaMemory: {
    version: number;
    updatedAt: string;
    lastPreparedAt: string;
    lastEvidenceAt?: string | null;
    preparedEvidenceRevision?: number;
    ledger: Array<{
      id: string;
      kind: string;
      label: string;
      state: string;
      confidence: number;
      stability: string;
      sourceRefs: Array<{
        sourceId: string;
        sourceType: string;
        capturedAt: string;
        excerpt?: string;
      }>;
      firstSeenAt: string;
      lastSeenAt: string;
      status: "active" | "suppressed";
    }>;
    tastes: Array<Record<string, unknown>>;
    rhythms: Array<Record<string, unknown>>;
    portrait: Array<Record<string, unknown>>;
    curiosity: Array<Record<string, unknown>>;
    corrections: Array<Record<string, unknown>>;
    lowSignalEvidence: Array<Record<string, unknown>>;
  };
  /** Ids of lines read lately, newest first. */
  seenLines: string[];
  lineFeedback: Record<string, { reaction: string; at: string }>;
  outbox: Array<{
    id: string;
    reason: string;
    message?: string;
    createdAt: string;
    triedAt?: string;
    revision?: number;
  }>;
};

type CircleStateContextValue = {
  state: CircleState;
  today: CircleDay;
  ready: boolean;
  dateKey: string;
  connectAi: (baseUrl: string, token: string) => Promise<void>;
  recoverProfile: (profileId: string) => Promise<void>;
  updateProfile: (
    transform: (profile: CircleState["profile"]) => CircleState["profile"],
    reason?: string,
  ) => void;
  updateState: (transform: (state: CircleState) => CircleState) => void;
  updateDay: (
    key: string,
    transform: (day: CircleDay) => CircleDay,
    reason?: string,
  ) => void;
  updateToday: (
    transform: (day: CircleDay) => CircleDay,
    reason?: string,
  ) => void;
};

const CircleStateContext = createContext<CircleStateContextValue | null>(null);
function hourLabel(hour: number) {
  const normalized = ((hour % 24) + 24) % 24;
  return `${String(normalized).padStart(2, "0")}:00`;
}

function freshTimeRange() {
  const now = new Date();
  const startHour = Math.min(22, now.getHours());
  return {
    start: `${String(startHour).padStart(2, "0")}:00`,
    end: `${String(startHour + 1).padStart(2, "0")}:00`,
  };
}

function serverSignature(state: CircleState) {
  const payload = buildServerPayload(state);
  return JSON.stringify({
    profile: payload.profile,
    days: payload.days,
    chapters: payload.chapters,
    habits: payload.habits,
    tasks: payload.tasks,
    declarations: payload.declarations,
    dreamlines: payload.dreamlines,
    evidence: payload.evidence,
    outbox: payload.outbox,
  });
}

function currentSyncSlot(now = new Date()) {
  return `${getDateKey(now)}-night`;
}

function isAthenaSyncTime(now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= 20 * 60 || minutes < 6 * 60 + 15;
}

function applySyncResult(
  current: CircleState,
  result: {
    state: CircleState;
    profileId: string;
    accessKey: string;
    acknowledgedEvidenceRevision?: number;
    acknowledgedOutboxIds?: string[];
  },
) {
  const merged = ensureDay(
    mergeServerState(current, result.state),
    getDateKey(),
  );
  const acknowledgedIds = new Set(result.acknowledgedOutboxIds || []);
  const acknowledgedRevision = Math.max(
    Number(merged.evidence.acknowledgedRevision || 0),
    Number(result.acknowledgedEvidenceRevision || 0),
  );
  const next = {
    ...merged,
    evidence: {
      ...merged.evidence,
      acknowledgedRevision,
      lastAcknowledgedAt: new Date().toISOString(),
    },
    outbox: merged.outbox.filter((item: CircleState["outbox"][number]) => {
      const hasRevision = Number.isFinite(Number(item.revision));
      const revision = hasRevision ? Number(item.revision) : 0;
      if (
        acknowledgedIds.has(item.id) &&
        (!hasRevision || revision <= acknowledgedRevision)
      ) {
        return false;
      }
      return !hasRevision || revision > acknowledgedRevision;
    }),
  };
  return {
    ...next,
    ai: {
      ...next.ai,
      baseUrl: current.ai.baseUrl,
      profileId: result.profileId,
      token: result.accessKey,
      status: "ready",
      lastError: "",
      lastSyncedAt: new Date().toISOString(),
      lastSyncSlot: isAthenaSyncTime()
        ? currentSyncSlot()
        : current.ai.lastSyncSlot,
    },
  };
}

export function CircleStateProvider({ children }: { children: ReactNode }) {
  const dateKey = getDateKey();
  const [state, setState] = useState<CircleState>(() =>
    ensureDay(createEmptyState(), dateKey),
  );
  const [ready, setReady] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  const stateRef = useRef(state);
  const syncing = useRef(false);
  const syncPending = useRef(false);
  const lastServerSignature = useRef("");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let active = true;
    void loadCircleState().then(async (stored) => {
      let next = ensureDay(normalizeState(stored), getDateKey());
      if (next.ai.baseUrl) {
        try {
          const remote = await readCircleState(next);
          if (remote?.state) {
            next = ensureDay(mergeServerState(next, remote.state), getDateKey());
            lastServerSignature.current = serverSignature(
              normalizeState(remote.state),
            );
          }
          await writeSyncedChapterPublications(
            remote?.chapterPublications || [],
          );
        } catch {
          next = {
            ...next,
            ai: {
              ...next.ai,
              status: "offline",
              lastError: "Your computer is offline.",
            },
          };
        }
      }
      if (!active) return;
      stateRef.current = next;
      setState(next);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveCircleState(state);
  }, [ready, state]);

  useEffect(() => {
    if (!ready || !state.ai.baseUrl) return;
    if (!state.profile.name || !state.profile.age) return;
    const urgent = state.outbox.length > 0;
    const needsFirstProfile = !state.ai.profileId || !state.ai.token;
    if (!needsFirstProfile && !urgent) return;
    const signature = serverSignature(state);
    if (signature === lastServerSignature.current) return;
    if (syncing.current) {
      syncPending.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      syncing.current = true;
      const sentState = stateRef.current;
      const sentSignature = serverSignature(sentState);
      void syncCircleState(sentState)
        .then(async (result) => {
          await writeSyncedChapterPublications(result.chapterPublications);
          setState((current) => {
            if (serverSignature(current) !== sentSignature) {
              syncPending.current = true;
            }
            const next = applySyncResult(current, result);
            lastServerSignature.current = serverSignature(next);
            stateRef.current = next;
            return next;
          });
        })
        .catch((error) => {
          setState((current) => ({
            ...current,
            ai: {
              ...current.ai,
              status: "offline",
              lastError:
                error instanceof Error
                  ? error.message
                  : "Your computer is offline.",
            },
          }));
        })
        .finally(() => {
          syncing.current = false;
          if (syncPending.current) {
            syncPending.current = false;
            setSyncTick((value) => value + 1);
          }
        });
    }, urgent || needsFirstProfile ? 350 : 15_000);
    return () => window.clearTimeout(timer);
  }, [ready, state, syncTick]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      setSyncTick((value) => value + 1);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const retry = () => setSyncTick((value) => value + 1);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [ready]);

  useEffect(() => {
    if (!ready || !state.ai.baseUrl) return;
    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (
        syncing.current ||
        serverSignature(current) !== lastServerSignature.current
      ) {
        return;
      }
      syncing.current = true;
      void readCircleState(current)
        .then(async (remote) => {
          if (!remote?.state) return;
          await writeSyncedChapterPublications(remote.chapterPublications);
          setState((latest) => {
            if (serverSignature(latest) !== lastServerSignature.current) {
              syncPending.current = true;
              return latest;
            }
            const next = ensureDay(
              mergeServerState(latest, remote.state),
              getDateKey(),
            );
            lastServerSignature.current = serverSignature(
              normalizeState(remote.state),
            );
            stateRef.current = next;
            return next;
          });
        })
        .catch(() => {
          setState((latest) => ({
            ...latest,
            ai: {
              ...latest.ai,
              status: "offline",
              lastError: "Your computer is offline.",
            },
          }));
        })
        .finally(() => {
          syncing.current = false;
          if (syncPending.current) {
            syncPending.current = false;
            setSyncTick((value) => value + 1);
          }
        });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [ready, state.ai.baseUrl]);

  const today = state.days[dateKey] ?? ensureDay(state, dateKey).days[dateKey];

  function updateToday(
    transform: (day: CircleDay) => CircleDay,
    reason?: string,
  ) {
    setState((current) => {
      const currentWithDay = ensureDay(current, dateKey);
      const next = {
        ...currentWithDay,
        days: {
          ...currentWithDay.days,
          [dateKey]: transform(currentWithDay.days[dateKey]),
        },
      };
      return reason ? queueProfileUpdate(next, reason) : next;
    });
  }

  /**
   * The same as `updateToday`, for any day. Naming Thursday from the Week App
   * writes Thursday's own title, which is the field the Log shows, so a day is
   * named once and read everywhere.
   */
  function updateDay(
    key: string,
    transform: (day: CircleDay) => CircleDay,
    reason?: string,
  ) {
    setState((current) => {
      const currentWithDay = ensureDay(current, key);
      const next = {
        ...currentWithDay,
        days: {
          ...currentWithDay.days,
          [key]: transform(currentWithDay.days[key]),
        },
      };
      return reason ? queueProfileUpdate(next, reason) : next;
    });
  }

  function updateProfile(
    transform: (profile: CircleState["profile"]) => CircleState["profile"],
    reason?: string,
  ) {
    setState((current) => {
      const next = {
        ...current,
        profile: transform(current.profile),
      };
      return reason ? queueProfileUpdate(next, reason) : next;
    });
  }

  function updateState(transform: (state: CircleState) => CircleState) {
    setState(transform);
  }

  async function connectAi(baseUrl: string, token: string) {
    const connected = connectLocalAi(stateRef.current, baseUrl, token);
    const result = await syncCircleState(connected);
    await writeSyncedChapterPublications(result.chapterPublications);
    const next = applySyncResult(connected, result);
    lastServerSignature.current = serverSignature(next);
    stateRef.current = next;
    setState(next);
    await saveCircleState(next);
  }

  async function recoverProfile(profileId: string) {
    const current = stateRef.current;
    const result = await recoverCircleProfile(current.ai.baseUrl, profileId);
    await writeSyncedChapterPublications(result.chapterPublications);
    const restored = ensureDay(normalizeState(result.state), getDateKey());
    const next = {
      ...restored,
      ai: {
        ...restored.ai,
        baseUrl: current.ai.baseUrl,
        profileId: result.profileId,
        token: result.accessKey,
        status: "ready",
        lastError: "",
        lastSyncedAt: new Date().toISOString(),
      },
    };
    lastServerSignature.current = serverSignature(next);
    stateRef.current = next;
    setState(next);
    await saveCircleState(next);
  }

  const value = {
    state,
    today,
    ready,
    dateKey,
    connectAi,
    recoverProfile,
    updateProfile,
    updateState,
    updateDay,
    updateToday,
  };

  return (
    <CircleStateContext.Provider value={value}>
      {children}
    </CircleStateContext.Provider>
  );
}

export function useCircleState() {
  const value = useContext(CircleStateContext);
  if (!value) {
    throw new Error("CircleStateProvider is missing.");
  }
  return value;
}

type RouteView = {
  pathname: string;
  children: ReactNode;
};

function RouteCrossfade({
  pathname,
  children,
}: RouteView) {
  const currentViewRef = useRef<RouteView>({ pathname, children });
  const clearOutgoingTimer = useRef<number | null>(null);
  const routeFrame = useRef<number | null>(null);
  const [currentView, setCurrentView] = useState<RouteView>(() => ({
    pathname,
    children,
  }));
  const [outgoingView, setOutgoingView] = useState<RouteView | null>(null);

  useLayoutEffect(() => {
    const previousView = currentViewRef.current;

    if (routeFrame.current !== null) {
      window.cancelAnimationFrame(routeFrame.current);
      routeFrame.current = null;
    }

    if (previousView.pathname === pathname) {
      if (previousView.children !== children) {
        const updatedView = { pathname, children };
        currentViewRef.current = updatedView;
        routeFrame.current = window.requestAnimationFrame(() => {
          setCurrentView(updatedView);
          routeFrame.current = null;
        });
      }
      return;
    }

    const nextView = { pathname, children };
    currentViewRef.current = nextView;

    if (document.documentElement.dataset.osRouteTransition === "native") {
      routeFrame.current = window.requestAnimationFrame(() => {
        setOutgoingView(null);
        setCurrentView(nextView);
        routeFrame.current = null;
      });
      return;
    }

    routeFrame.current = window.requestAnimationFrame(() => {
      setOutgoingView(previousView);
      setCurrentView(nextView);
      routeFrame.current = null;
    });

    if (clearOutgoingTimer.current !== null) {
      window.clearTimeout(clearOutgoingTimer.current);
    }
    clearOutgoingTimer.current = window.setTimeout(() => {
      setOutgoingView(null);
      clearOutgoingTimer.current = null;
    }, 280);
  }, [children, pathname]);

  useEffect(() => {
    return () => {
      if (clearOutgoingTimer.current !== null) {
        window.clearTimeout(clearOutgoingTimer.current);
      }
      if (routeFrame.current !== null) {
        window.cancelAnimationFrame(routeFrame.current);
      }
    };
  }, []);

  return (
    <div
      className={`os-route-content${outgoingView ? " is-transitioning" : ""}`}
    >
      {outgoingView ? (
        <div
          aria-hidden="true"
          className="os-route-layer is-outgoing"
          key={`outgoing-${outgoingView.pathname}`}
        >
          {outgoingView.children}
        </div>
      ) : null}
      <div
        className={`os-route-layer is-current${outgoingView ? " is-incoming" : ""}`}
        key={currentView.pathname}
      >
        {currentView.children}
      </div>
    </div>
  );
}

export function OSFrame({
  children,
}: {
  children: ReactNode;
}) {
  const { state, ready } = useCircleState();
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname.startsWith("/os/mirror")
    ? "mirror"
    : pathname.startsWith("/os/admin")
      ? "connect"
    : pathname.startsWith("/os/connect")
      ? "connect"
      : "today";
  const evidenceWaiting =
    state.outbox.length > 0 ||
    state.evidence.localRevision > state.evidence.acknowledgedRevision;
  const syncLabel = !state.ai.profileId
    ? "Saved"
    : evidenceWaiting && state.ai.status === "offline"
      ? "Waiting to sync"
      : evidenceWaiting
        ? "Saved"
        : state.ai.lastSyncedAt
          ? "Synced"
          : "Saved";

  function moveToRoute(
    event: ReactMouseEvent<HTMLAnchorElement>,
    nextPathname: string,
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      pathname === nextPathname
    ) {
      return;
    }

    const transitionDocument = document as Document & {
      startViewTransition?: (
        update: () => Promise<void> | void,
      ) => { finished: Promise<void> };
    };

    if (!transitionDocument.startViewTransition) {
      return;
    }

    event.preventDefault();
    document.documentElement.dataset.osRouteTransition = "native";
    const transition = transitionDocument.startViewTransition(() => {
      router.push(nextPathname);
    });
    transition.finished.finally(() => {
      delete document.documentElement.dataset.osRouteTransition;
    });
  }

  return (
    <div className="circle-os">
      <div className="os-future-room-background" aria-hidden="true" />
      <div className="os-app-shell">
        <header className="os-header">
          <Link className="os-wordmark" href="/" aria-label="The Circle website">
            <span className="os-brand-mark" aria-hidden="true" />
            <span>CIRCLE OS</span>
          </Link>
          <span aria-live="polite" className="os-local-status">
            {syncLabel}
          </span>
        </header>
        <nav className="os-nav" aria-label="Circle OS" data-active={active}>
          <Link
            className={active === "today" ? "active" : ""}
            href="/os"
            onClick={(event) => moveToRoute(event, "/os")}
          >
            Today
          </Link>
          <Link
            className={active === "mirror" ? "active" : ""}
            href="/os/mirror"
            onClick={(event) => moveToRoute(event, "/os/mirror")}
          >
            Reflect
          </Link>
        </nav>
        <div
          aria-busy={!ready}
          className={`os-route-stage ${ready ? "is-ready" : "is-opening"}`}
        >
          <div aria-hidden={!ready}>
            <RouteCrossfade pathname={pathname}>{children}</RouteCrossfade>
          </div>
          {!ready ? (
            <div className="os-route-opening" aria-label="Opening Circle OS">
              <span aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function surveyAnswer(
  answers: CircleState["profile"]["profileCase"]["survey"]["answers"],
  questionId: string,
) {
  return answers.find((answer) => answer.questionId === questionId)?.answer ?? "";
}

function hourFromTime(value: string, fallback: number) {
  const hour = Number(String(value).split(":")[0]);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : fallback;
}

export function TodayExperience() {
  const { state, today, ready, dateKey, updateState, updateDay, updateToday } =
    useCircleState();
  const router = useRouter();
  const surveyAnswers = state.profile.profileCase.survey.answers;
  const wakeTime = surveyAnswer(surveyAnswers, "routine-wake");
  const sleepTime = surveyAnswer(surveyAnswers, "routine-sleep");
  const routineTimesKnown = Boolean(wakeTime && sleepTime);
  const wakeHour = hourFromTime(wakeTime, 7);
  const sleepClockHour = hourFromTime(sleepTime, 0);
  const sleepHour =
    sleepClockHour <= wakeHour ? sleepClockHour + 24 : sleepClockHour;
  const checkInIdleTitle =
    surveyAnswer(surveyAnswers, "checkin-idle-title");
  const checkInNote = surveyAnswer(surveyAnswers, "checkin-note");
  // Clear is a Page action, so it lives in the Header and only while writing.
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteClearSignal, setNoteClearSignal] = useState(0);
  const noteClearedAt = useRef(0);
  const firstNotePlaceholder = nextNotePlaceholder(notePlaceholderPool);
  const [notePlaceholderId, setNotePlaceholderId] = useState(
    firstNotePlaceholder?.id || "",
  );
  // The first-use words greet once; Clear hands the Page back to the rotation.
  //
  // They used to win outright until a note was written, so Clear advanced the
  // pool underneath and the words on screen never changed. Sai: "only for the
  // first time user, it will be prefilled. not the placeholder all the time.
  // now clear button doesnt show creative lines."
  const [noteGreeted, setNoteGreeted] = useState(false);
  const notePlaceholder =
    (!noteGreeted ? firstUsePlaceholder(state, "note") : "") ||
    notePlaceholderPool.placeholders.find(
      (placeholder) => placeholder.id === notePlaceholderId,
    )?.text ||
    firstNotePlaceholder?.text ||
    "";

  // Pointerdown clears and click is the keyboard path, so one press can call
  // this twice. The second call inside the same press is the same press.
  function clearNote() {
    const now = Date.now();
    if (now - noteClearedAt.current < 500) return;
    noteClearedAt.current = now;
    setNoteGreeted(true);
    setNotePlaceholderId((currentId) =>
      nextNotePlaceholder(notePlaceholderPool, currentId)?.id || currentId,
    );
    setNoteClearSignal((signal) => signal + 1);
  }
  const [dateLabel, setDateLabel] = useState("");
  const [greeting, setGreeting] = useState("Hello.");
  const [liveNow, setLiveNow] = useState(() => new Date());
  const [liveMarkerTop, setLiveMarkerTop] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { publications } = useChapterPublications(ready);
  const profileSparkChapters = useMemo(() => {
    const profileId = state.ai.profileId || "local";
    const eligiblePublications = publications
      .map(normalizeChapterPublication)
      .filter(
        (publication) =>
          (publication.targetApp === "note" ||
            publication.targetApp === "thoughts") &&
          (publication.visibility === "public" ||
            publication.audienceProfileId === profileId ||
            publication.audienceProfileId === "local"),
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return latestPublishedChapters(eligiblePublications);
  }, [publications, state.ai.profileId]);
  const schedulerFacts = useMemo(() => chapterFacts(state), [state]);
  // A republished chapter is offered again, so its finished run must not block
  // it. Dropping the run here keeps that behaviour without teaching the
  // scheduler what a publication is.
  const scheduledRuns = useMemo(() => {
    const runs = { ...state.chapters.runs };
    for (const publication of publications.map(normalizeChapterPublication)) {
      const runId = chapterRunId(publication.chapter);
      if (publicationIsNewerThanRun(publication, runs[runId])) delete runs[runId];
    }
    return runs;
  }, [publications, state.chapters.runs]);
  const scheduledSpark = useMemo(
    () =>
      selectScheduledChapter(profileSparkChapters, scheduledRuns, {
        facts: schedulerFacts,
      }),
    [profileSparkChapters, schedulerFacts, scheduledRuns],
  );
  const [checkInIdleEntering, setCheckInIdleEntering] = useState(false);
  // The Line currently shown as Note's back.
  const [revealedLine, setRevealedLine] = useState<
    { id: string; kind: string; text: string; sub: string } | null
  >(null);
  const [revealedLinePage, setRevealedLinePage] = useState(0);
  // A Line's last Page does not leave on the first swipe. The swipe opens the
  // footer, and the second one — or a reaction — closes it. Sai: "more like a
  // confirm swipe, user may click on it and the page fade, or swipe after the
  // footer show to continue."
  const [lineFeedbackOpen, setLineFeedbackOpen] = useState(false);
  const checkInIdleTimer = useRef<number | null>(null);
  const [checkInApp, setCheckInApp] = useState(0);
  const noteBack = useAppBack<"note" | "line">("note");
  const thoughtBack = useAppBack<"regular" | "deep">("regular");
  const thoughtMode = thoughtBack.side;
  const [regularThoughtDraft, setRegularThoughtDraft] = useState("");
  const [deepThoughtDraft, setDeepThoughtDraft] = useState("");
  const [deepThoughtPrompt, setDeepThoughtPrompt] = useState<DeepThoughtPrompt | null>(null);
  // How many times Deep Thoughts has been opened. It counts visits, not
  // answers, which is what makes the next one a different question.
  const deepThoughtVisits = useRef(0);
  const [thoughtRewarded, setThoughtRewarded] = useState(false);
  const thoughtDraft = thoughtMode === "deep" ? deepThoughtDraft : regularThoughtDraft;
  // liveNow already ticks every thirty seconds and the prompt is bucketed by the
  // hour, so this changes through the day without moving under the person.
  // Before a single thought has been sent, the placeholder says what this App
  // is rather than asking a question written for someone who already knows.
  const thoughtPlaceholder = useMemo(
    () =>
      firstUsePlaceholder(state, "thoughts") ||
      selectThoughtPrompt(state, dateKey, liveNow),
    [dateKey, liveNow, state],
  );
  const [thoughtSent, setThoughtSent] = useState(false);
  // "clicked" is the button's own success beat; "departing" is the written
  // thought leaving the Page. There is no third state, because the App Box no
  // longer empties and refills itself around a send.
  const [thoughtTransition, setThoughtTransition] = useState<
    "idle" | "clicked" | "departing"
  >("idle");
  const [holdThoughtsAfterSend, setHoldThoughtsAfterSend] = useState(false);
  const [thoughtButtonVisible, setThoughtButtonVisible] = useState(false);
  const thoughtSubmissionLocked = useRef(false);
  const thoughtOutcome = useRef({ deep: false, rewarded: false });
  const deepWritingActiveMs = useRef(0);
  const deepWritingFocusStartedAt = useRef<number | null>(null);
  const thoughtTextareaRef = useRef<HTMLTextAreaElement>(null);
  const thoughtResetTimer = useRef<number | null>(null);
  const routineBack = useAppBack<"habit" | "yesterday">("habit");
  const habitMode = routineBack.side;
  const [newProtocolItemId, setNewProtocolItemId] = useState<string | null>(null);
  const [sealedProtocolDay, setSealedProtocolDay] =
    useState<ProtocolSealView | null>(null);
  const [newHabitId, setNewHabitId] = useState<string | null>(null);
  // Sai: "identity edit, only show when i tap on text to edit. default should
  // not show identity. only action and cue." The row opens when anything in it
  // takes focus and closes when focus leaves it altogether.
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  // A new goal or step takes the cursor the same way a new habit or task does.
  const [newGoalEditorId, setNewGoalEditorId] = useState<string | null>(null);
  // Which goal a new step belongs to is asked only when there is a choice.
  const [choosingStepGoal, setChoosingStepGoal] = useState(false);
  const [editingDreamline, setEditingDreamline] = useState(false);
  const [leavingMissionIds, setLeavingMissionIds] = useState<string[]>([]);
  const [fadingMissionIds, setFadingMissionIds] = useState<string[]>([]);
  const taskExitTimers = useRef<
    Record<string, { fade: number; remove: number }>
  >({});
  const [isLogOpen, setLogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const initialRange = useMemo(() => freshTimeRange(), []);
  const [start, setStart] = useState(initialRange.start);
  const [end, setEnd] = useState(initialRange.end);
  const [blockTitle, setBlockTitle] = useState("");
  const [momentsText, setMomentsText] = useState("");
  const [momentHour, setMomentHour] = useState<number | null>(null);
  const [newMoment, setNewMoment] = useState("");
  const [editingMomentKey, setEditingMomentKey] = useState<string | null>(null);
  const [momentDraft, setMomentDraft] = useState("");

  useLayoutEffect(() => {
    sizeTextAreaToContent(thoughtTextareaRef.current);
  }, [thoughtDraft, thoughtMode]);

  useEffect(
    () => () => {
      Object.values(taskExitTimers.current).forEach(({ fade, remove }) => {
        window.clearTimeout(fade);
        window.clearTimeout(remove);
      });
    },
    [],
  );

  useEffect(
    () => () => {
      if (checkInIdleTimer.current) {
        window.clearTimeout(checkInIdleTimer.current);
      }
      if (thoughtResetTimer.current) {
        window.clearTimeout(thoughtResetTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      ready &&
      (!state.profile.name ||
        !state.profile.age)
    ) {
      router.replace("/os/mirror");
    }
  }, [
    ready,
    router,
    state.profile.age,
    state.profile.name,
  ]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const now = new Date();
      const circleDate = new Date(now);
      if (now.getHours() < CIRCLE_DAY_START_HOUR) {
        circleDate.setDate(circleDate.getDate() - 1);
      }
      const name = state.profile.name.trim();
      setDateLabel(
        circleDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      );
      if (now.getHours() < CIRCLE_DAY_START_HOUR) {
        setGreeting(`Good evening${name ? `, ${name}` : ""}.`);
      } else if (now.getHours() < 12) {
        setGreeting(`Good morning${name ? `, ${name}` : ""}.`);
      } else if (now.getHours() < 18) {
        setGreeting(`Good afternoon${name ? `, ${name}` : ""}.`);
      } else {
        setGreeting(`Good evening${name ? `, ${name}` : ""}.`);
      }
    });
    return () => {
      active = false;
    };
  }, [dateKey, state.profile.name]);

  useEffect(() => {
    const timer = window.setInterval(() => setLiveNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const checkInIdleApp = 0;
  const checkInThoughtsApp = 1;
  const checkInJourneyVersion = "manual-check-in-v1";
  const visibleCheckInApp = Math.min(checkInThoughtsApp, checkInApp);

  // The Thoughts App Label has no arrival of its own. It used to fade in on a
  // timer after every page change and every send, so the one word that names
  // the App was the last thing on the Page to settle. Sai: "the top label on
  // both of them, still have animation, remove that." It is simply there.
  const scheduledSparkRun = scheduledSpark
    ? state.chapters.runs[chapterRunId(scheduledSpark)]
    : undefined;
  // One chapter greets the first open of the day; the rest are asked for by
  // pressing Note. It stays while it is being answered, and swiping back to the
  // note puts it aside for good. Anything already put aside never returns here.
  const arrivingSpark =
    ready &&
    !holdThoughtsAfterSend &&
    scheduledSpark &&
    !scheduledSparkRun?.deferredAt &&
    (scheduledSparkRun?.status === "in-progress" ||
      !countChaptersStartedOn(profileSparkChapters, state.chapters.runs, dateKey)
        .total)
      ? scheduledSpark
      : null;
  const profileSparkChapter = arrivingSpark || null;
  const profileSparkPublication = useMemo(() => {
    if (!profileSparkChapter) return null;
    return publications
      .map(normalizeChapterPublication)
      .filter(
        (publication) =>
          (publication.targetApp === "note" ||
            publication.targetApp === "thoughts") &&
          chapterRunId(publication.chapter) === chapterRunId(profileSparkChapter),
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0] || null;
  }, [profileSparkChapter, publications]);
  const profileSparkRun = useMemo(() => {
    if (!profileSparkChapter) return null;
    const storedRun = state.chapters.runs[chapterRunId(profileSparkChapter)];
    if (
      profileSparkPublication &&
      publicationIsNewerThanRun(profileSparkPublication, storedRun)
    ) {
      return createChapterRun(profileSparkChapter);
    }
    return (
      storedRun ||
      createChapterRun(profileSparkChapter)
    );
  }, [
    profileSparkChapter,
    profileSparkPublication,
    state.chapters.runs,
  ]);
  const publicationProfileId = state.ai.profileId || "local";
  const thoughtsPublication = selectPendingAppPublication(
    publications,
    "thoughts",
    publicationProfileId,
    state.chapters.runs,
  );
  const habitPublication = selectPendingAppPublication(
    publications,
    "habit",
    publicationProfileId,
    state.chapters.runs,
  );
  const logPublication = selectPendingAppPublication(
    publications,
    "log",
    publicationProfileId,
    state.chapters.runs,
  );
  // A first-use chapter published from Admin stands in place of the compiled
  // setup chapter for its App. Sai authors these; the App must open on what he
  // wrote rather than on what shipped in the bundle.
  const habitSetupPublication = selectFirstUsePublication(
    publications,
    "habit",
    publicationProfileId,
    state.chapters.runs,
  );
  const logSetupPublication = selectFirstUsePublication(
    publications,
    "log",
    publicationProfileId,
    state.chapters.runs,
  );
  // And finishing one seals that App's setup for good. Without this the
  // published chapter retires on completion and the compiled one — still
  // unanswered — comes straight back, so the person is set up twice.
  const habitSetupSealed = firstUsePublicationDone(
    publications,
    "habit",
    state.chapters.runs,
  );
  const logSetupSealed = firstUsePublicationDone(
    publications,
    "log",
    state.chapters.runs,
  );
  const defaultLogStartHour = Math.max(CIRCLE_DAY_START_HOUR, wakeHour);
  const defaultLogEndHour = Math.min(
    CIRCLE_DAY_START_HOUR + 23,
    Math.min(wakeHour + 23, Math.max(wakeHour, sleepHour)),
  );
  const logStartHour = Math.max(
    CIRCLE_DAY_START_HOUR,
    Math.min(defaultLogStartHour, today.logRange?.startHour ?? defaultLogStartHour),
  );
  const logEndHour = Math.min(
    CIRCLE_DAY_START_HOUR + 23,
    Math.max(defaultLogEndHour, today.logRange?.endHour ?? defaultLogEndHour),
  );
  const visibleHours = Array.from(
    { length: Math.max(1, logEndHour - logStartHour + 1) },
    (_, index) => logStartHour + index,
  );
  const liveClockHour =
    liveNow.getHours() < CIRCLE_DAY_START_HOUR
      ? liveNow.getHours() + 24
      : liveNow.getHours();
  const liveHourProgress =
    (liveNow.getMinutes() * 60 + liveNow.getSeconds()) / 3600;

  // Where the current-time line sits, measured from the rendered rows.
  //
  // Two things made this arrive late. It ran in an effect, so the Log painted
  // once without the marker and then again with it. And `liveHourProgress`
  // changes every time the clock ticks, so having it in the dependency list
  // tore down the ResizeObserver and built a new one every thirty seconds,
  // re-measuring the whole timeline each time for a sub-pixel move.
  //
  // The progress is read from a ref now, so the observer is created once for a
  // given set of rows, and the measurement runs before paint.
  const liveHourProgressRef = useRef(liveHourProgress);

  useLayoutEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const updateMarker = () => {
      const current = timeline.querySelector<HTMLElement>(
        `[data-log-hour="${liveClockHour}"] .os-time-range`,
      );
      const next = timeline.querySelector<HTMLElement>(
        `[data-log-hour="${liveClockHour + 1}"] .os-time-range`,
      );
      if (!current || !next) {
        setLiveMarkerTop(null);
        return;
      }
      const timelineRect = timeline.getBoundingClientRect();
      const currentRect = current.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      const currentCenter =
        currentRect.top - timelineRect.top + timeline.scrollTop + currentRect.height / 2;
      const nextCenter =
        nextRect.top - timelineRect.top + timeline.scrollTop + nextRect.height / 2;
      setLiveMarkerTop(
        currentCenter + (nextCenter - currentCenter) * liveHourProgressRef.current,
      );
    };

    updateMarker();
    const observer = new ResizeObserver(updateMarker);
    observer.observe(timeline);
    window.addEventListener("resize", updateMarker);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMarker);
    };
  }, [liveClockHour, logEndHour, logStartHour]);

  // The clock still moves the marker; it just no longer rebuilds the observer
  // to do it.
  useEffect(() => {
    liveHourProgressRef.current = liveHourProgress;
    const timeline = timelineRef.current;
    if (!timeline) return;
    const current = timeline.querySelector<HTMLElement>(
      `[data-log-hour="${liveClockHour}"] .os-time-range`,
    );
    const next = timeline.querySelector<HTMLElement>(
      `[data-log-hour="${liveClockHour + 1}"] .os-time-range`,
    );
    if (!current || !next) return;
    const timelineRect = timeline.getBoundingClientRect();
    const currentRect = current.getBoundingClientRect();
    const nextRect = next.getBoundingClientRect();
    const currentCenter =
      currentRect.top - timelineRect.top + timeline.scrollTop + currentRect.height / 2;
    const nextCenter =
      nextRect.top - timelineRect.top + timeline.scrollTop + nextRect.height / 2;
    setLiveMarkerTop(currentCenter + (nextCenter - currentCenter) * liveHourProgress);
  }, [liveClockHour, liveHourProgress]);

  const logSetupChapter = getPublishedChapter("log-setup");
  const habitBuildingChapter = getPublishedChapter("habit-building");
  const habitBuildingRun = useMemo(() => {
    if (!habitBuildingChapter) return null;
    const stored =
      state.chapters.runs[chapterRunId(habitBuildingChapter)] ||
      createChapterRun(habitBuildingChapter);
    // A published setup chapter that has been finished seals this App's setup,
    // so the compiled chapter is done whether or not it was ever opened. It
    // stays a run rather than disappearing, because Routine reads a completed
    // run as "show the idle Page". An earlier version of the compiled chapter,
    // already answered, seals it the same way: setting up happens once.
    const sealed =
      habitSetupSealed ||
      chapterEverCompleted(state.chapters.runs, habitBuildingChapter.id);
    if (sealed && stored.status !== "completed") {
      return { ...stored, status: "completed" as const };
    }
    return stored;
  }, [habitBuildingChapter, habitSetupSealed, state.chapters.runs]);
  const activeHabitChapter = useMemo(() => {
    if (!habitBuildingChapter) return null;
    return {
      ...habitBuildingChapter,
      pages: habitBuildingChapter.pages.map((page) =>
        page.type === "idle" ? { ...page, title: "" } : page,
      ),
    };
  }, [habitBuildingChapter]);
  const activeHabitRun = habitBuildingRun;
  const habits = Object.values(state.habits.definitions)
    .filter((habit) => habit.status === "active")
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const habitCompletion = (habitId: string, key = dateKey) =>
    state.habits.completions[`${key}:${habitId}`];
  const oneTimeTasks = Object.values(state.tasks.items)
    .filter(
      (task) => task.status === "open" || leavingMissionIds.includes(task.id),
    )
    // A step under a goal he has called done is carried by the goal, so Routine
    // stops asking for it. It is not deleted: reopening the goal brings it back.
    .filter((task) => !taskIsUnderDoneGoal(state, task.id))
    // Today's tasks are today's steps, plus whatever was written straight into
    // Routine. A step planned for Thursday is not something to do today, and
    // showing it would put the whole week in front of him every morning. Sai:
    // "So the task in routine app will be act as a daily task for that day."
    .filter((task) => {
      const step = goalStepForTask(state, task.id);
      if (!step) return true;
      return !step.dateKey || step.dateKey === dateKey;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  // Habit shows one finished day behind the label, not a week of dots.
  const yesterdayKey = previousDateKey(dateKey);
  const yesterday = dayRecord(state, yesterdayKey);
  const todaySoFar = dayRecord(state, dateKey);

  // Habit leads this App Box and Protocol is one swipe across. Habits and Tasks
  // are what Sai touches most; a protocol is a stretch of days he does not need
  // in front of him every time he opens the app.
  // The version changes with the order: a saved index from the old arrangement
  // would land on the wrong Page, and a new version returns to page zero.
  const habitAppVersion = "habit-protocol-v5";
  const habitAppIndex = appSessionIndex(
    state,
    "today-habit",
    habitAppVersion,
  );
  const protocol = protocolToday(state, dateKey);
  const protocolRun = activeProtocolRun(state);
  const completedProtocol = latestCompletedProtocol(state);
  const phaseRecords = protocolPhaseRecords(state);

  useEffect(() => {
    const editorId = newHabitId || newTaskId || newProtocolItemId || newGoalEditorId;
    if (!editorId) return;
    const editor = document.querySelector<HTMLTextAreaElement>(
      `[data-inline-editor-id="${editorId}"]`,
    );
    editor?.focus();
  }, [
    habits.length,
    newGoalEditorId,
    newHabitId,
    newProtocolItemId,
    newTaskId,
    oneTimeTasks.length,
  ]);
  const logSetupRun = useMemo(() => {
    if (!logSetupChapter) return null;
    const stored = state.chapters.runs[chapterRunId(logSetupChapter)];
    if (stored) return stored;
    const timestamp = new Date().toISOString();
    const seedAnswers = logSetupChapter.pages.flatMap((page) => {
      if (!page.answerKey) return [];
      const value = surveyAnswer(surveyAnswers, page.answerKey);
      if (!value) return [];
      return [
        {
          pageId: page.id,
          answerKey: page.answerKey,
          value,
          displaySnapshot: value,
          answeredAt: timestamp,
          changedAt: timestamp,
        },
      ];
    });
    return createChapterRun(logSetupChapter, seedAnswers);
  }, [logSetupChapter, state.chapters.runs, surveyAnswers]);
  const logSetupDone =
    logSetupSealed ||
    // Any version of it, answered once. Editing the setup and publishing a new
    // version used to ask again from the top, which is how the same two
    // questions arrived three times.
    (logSetupChapter
      ? chapterEverCompleted(state.chapters.runs, logSetupChapter.id)
      : false) ||
    (logSetupRun ? logSetupRun.status === "completed" : routineTimesKnown);
  const activeDreamline = currentDreamline(state, liveNow) as DreamlineRecord | null;
  const pastDreamlines = dreamlineRecords(state, liveNow).filter(
    (record) => record.status === "concluded",
  ) as DreamlineRecord[];
  // Three Pages, not six, and the third only once the steps are saved.
  // Sai: "setup, having, being, doing, and income all should be in the same
  // page. Next page, Steps now, tomorrow, and next day, all should be in the
  // same page. after saving that, only then we may proceed to doing the actual
  // living."
  const dreamlineProgressView = dreamlineProgress(activeDreamline) as DreamlineProgressView | null;
  const dreamlineStrategyView = dreamlineStrategy(activeDreamline) as DreamlineStrategyLine[];
  // Sai: "after continue, leads to idle app ... and we will have edit button
  // somewhere, and it will reveal The Dream and Steps if needed." So the sheets
  // are not Pages he swipes past every day; they are what Edit opens.
  const dreamlineEditing = editingDreamline || !dreamlineProgressView;
  // Log is one Page again. The Dreamline moved into the Routine box, where it
  // sits after Protocol: the small daily, the weekly reset, the big goal.
  // Two Pages: the day, then the week. Sai: "week app should be the second page
  // of the log."
  //
  // The week belongs to the Log rather than to Reflect because planning a week
  // is the same act as logging a day, one size up — Reflect is for reading, and
  // he never read it there.
  const logAppVersion = "log-week-v3";
  const logAppMaxIndex = 1;
  const logWeekDays = weekDays(state, dateKey);
  // The week the Log is showing, and the goal every day of it is under. The
  // week key is worked out here rather than inside the goal model: the Circle
  // week is defined in `week-app-model.js`, which reads the state the goal
  // model writes, so that dependency has to run one way.
  // An unnamed day is still a day of the week. Sai: "Log day should be the day
  // of from the week, monday tuesday, market day, exam day etc." So the
  // placeholder is the weekday itself rather than a compliment about it, and
  // writing over it is how a Tuesday becomes market day.
  const logTodayName =
    logWeekDays.find((day) => day.isToday)?.name || "Today";
  const logWeekKey = weekStartKey(dateKey);
  const logWeekGoal = weekGoal(state, logWeekKey);
  // What the running phase is for. A phase begun from now on says so itself; a
  // phase that was already running when it had nowhere to say it stands under
  // this week's goal, because that is in fact what it is serving.
  const protocolGoalText =
    (protocolRun?.goalId ? goalById(state, protocolRun.goalId)?.text : "") ||
    (protocolRun?.goalId ? "" : logWeekGoal?.text || "");
  // A future day can be chosen here, unlike on the reading surface: this Page
  // is for planning the week, so Thursday has to be reachable before Thursday.
  const [logChosenDayKey, setLogChosenDayKey] = useState(dateKey);
  const logChosenDay =
    logWeekDays.find((day) => day.dateKey === logChosenDayKey) ||
    logWeekDays.find((day) => day.dateKey === dateKey) ||
    logWeekDays[0];

  const chosenWeekGoals = weekGoals(state, logWeekKey);

  // A goal and a step both arrive empty and take the cursor, the same way a new
  // habit or task does — writing is the point, so nothing asks twice.
  function addGoalToWeek(weekKey: string) {
    const id = `goal-${Date.now()}`;
    updateState((current) => addWeekGoal(current, weekKey, id).state);
    setNewGoalEditorId(id);
  }

  function addStepToGoal(goalId: string, dateKey: string) {
    let editorId = "";
    updateState((current) => {
      const added = addGoalStep(current, goalId, addTask, "", undefined, dateKey);
      editorId = added.taskId;
      return added.state;
    });
    // The step is a Routine task, and Routine has a row for that same task, so
    // the Week's row answers to a name of its own. Sai: "make it directly
    // editable in the week app rather than directing to routine app."
    if (editorId) setNewGoalEditorId(weekStepEditorId(editorId));
  }

  // A row opened and left blank goes when you look away, the same way an
  // unwritten habit or task does.
  function finishGoalEdit(goalId: string) {
    updateState((current) => discardEmptyGoal(current, goalId));
    setNewGoalEditorId((current) => (current === goalId ? null : current));
  }

  function finishStepEdit(stepId: string) {
    let editorId = "";
    updateState((current) => {
      const step = current.goals?.steps?.[stepId];
      editorId = step ? weekStepEditorId(step.taskId) : "";
      return discardEmptyStep(current, stepId, discardEmptyTask);
    });
    setNewGoalEditorId((current) => (current === editorId ? null : current));
  }

  const logAppIndex = Math.min(
    appSessionIndex(state, "today-log", logAppVersion),
    logAppMaxIndex,
  );
  const dreamlineIncomeView = dreamlineIncome(activeDreamline);

  useEffect(() => {
    updateState((current) => concludeExpiredDreamlines(current, liveNow));
  }, [liveNow, state.dreamlines.records, updateState]);

  function saveLogAppIndex(index: number) {
    updateState((current) =>
      setAppSessionIndex(current, "today-log", logAppVersion, index),
    );
  }

  function beginDreamline(months: number, monthlyExpensesCents: number, currency: string) {
    const result = startDreamline(state, { months, monthlyExpensesCents, currency });
    if (result.error || !result.record) return result.error || "The Dreamline could not begin.";
    // Land on the dream sheet, which is where the newly begun Dreamline is
    // actually filled in.
    const next = setAppSessionIndex(
      result.state,
      "today-log",
      `log-dreamline-v2:${result.record.id}:planning`,
      1,
    );
    updateState(() => next);
    return "";
  }

  function saveDreamlineSetup(months: number, monthlyExpensesCents: number, currency: string) {
    if (!activeDreamline) return "Begin the Dreamline first.";
    const result = updateDreamlineSetup(state, activeDreamline.id, {
      months,
      monthlyExpensesCents,
      currency,
    });
    if (!result.error) updateState(() => result.state);
    return result.error;
  }

  function saveDreamlineLine(
    value: {
      category: DreamlineCategory;
      text: string;
      convertedDoing: string;
      costCents: number;
      cadence: "monthly" | "one-time";
    },
    itemId?: string,
  ) {
    if (!activeDreamline) return "Begin the Dreamline first.";
    const result = saveDreamlineItem(state, activeDreamline.id, value, {
      ...(itemId ? { id: itemId } : {}),
    });
    if (!result.error) updateState(() => result.state);
    return result.error;
  }

  function starDreamlineLine(item: DreamlineItem, starred: boolean) {
    if (!activeDreamline) return "Begin the Dreamline first.";
    const result = setDreamlineStarred(
      state,
      activeDreamline.id,
      item.id,
      starred,
    );
    if (!result.error) updateState(() => result.state);
    return result.error;
  }

  // Leaving the editor. The sheet is where the dream and its money are set;
  // the steps are written on the Page that shows them. Committing the steps
  // still happens here, quietly, because it is what turns a plan into
  // something the day can ask for — it just no longer needs its own Page.
  function closeDreamlineEditor() {
    if (activeDreamline) {
      const result = commitDreamlineSteps(state, activeDreamline.id);
      if (!result.error) updateState(() => result.state);
    }
    setEditingDreamline(false);
  }

  // Both ways. A step taken by accident has to be givable back, or the Page
  // punishes a mis-tap with a plan that is permanently wrong.
  function tickDreamlineStep(itemId: string, step: DreamlineStep, done = true) {
    if (!activeDreamline) return "Begin the Dreamline first.";
    const result = setDreamlineStepDone(state, activeDreamline.id, itemId, step, done);
    if (!result.error) updateState(() => result.state);
    return result.error;
  }

  function saveDreamlineStep(itemId: string, step: DreamlineStep, value: string) {
    if (!activeDreamline) return "Begin the Dreamline first.";
    const result = updateDreamlineStep(
      state,
      activeDreamline.id,
      itemId,
      step,
      value,
    );
    if (!result.error) updateState(() => result.state);
    return result.error;
  }

  // The ladder goes on. Sai: "after the last step, there has to be a quiet
  // option to add on next step, and continuously."
  function addDreamlineStepToItem(itemId: string, value: string) {
    if (!activeDreamline) return "Begin the Dreamline first.";
    const result = addDreamlineStep(state, activeDreamline.id, itemId, value);
    if (!result.error) updateState(() => result.state);
    return result.error;
  }

  // Arriving is its own fact, not the last tick. Sai: "we need a way to
  // indicate we have reached it."
  function markDreamlineReached(itemId: string, reached: boolean) {
    if (!activeDreamline) return "Begin the Dreamline first.";
    const result = setDreamlineReached(state, activeDreamline.id, itemId, reached);
    if (!result.error) updateState(() => result.state);
    return result.error;
  }

  function beginNewHabit() {
    const existing = habits.find((habit) => !habit.text.trim());
    if (existing) {
      setNewHabitId(existing.id);
      return;
    }
    const id = freshInlineEditorId("habit");
    updateState((current) => addHabitDefinition(current, id).state);
    setNewHabitId(id);
  }

  function beginNewTask() {
    const existing = oneTimeTasks.find((task) => !task.text.trim());
    if (existing) {
      setNewTaskId(existing.id);
      return;
    }
    const id = freshInlineEditorId("task");
    updateState((current) => addTask(current, id).state);
    setNewTaskId(id);
  }

  function changeHabit(id: string, text: string) {
    updateState((current) =>
      updateHabitDefinitionDraft(current, id, { action: text }),
    );
  }

  // The identity is why the habit is worth keeping: "read 1 page after dinner"
  // is what he does, "I am a reader" is what it makes him. It is written while
  // the habit is being made and then gets out of the way, until the habit is
  // done for the day and it is the only thing the row says.
  function changeHabitIdentity(id: string, text: string) {
    updateState((current) =>
      updateHabitDefinitionDraft(current, id, { identity: text }),
    );
  }

  function finishHabitEdit(id: string) {
    updateState((current) => {
      const habit = current.habits.definitions[id];
      if (!habit) return current;
      return discardEmptyHabit(
        updateHabitDefinition(current, id, habit.action || ""),
        id,
      );
    });
    setNewHabitId((current) => (current === id ? null : current));
  }

  function changeTask(id: string, text: string) {
    updateState((current) => updateTask(current, id, text));
  }

  function finishTaskEdit(id: string) {
    updateState((current) => discardEmptyTask(current, id));
    setNewTaskId((current) => (current === id ? null : current));
  }

  function toggleHabit(id: string) {
    updateState((current) => toggleHabitForDay(current, id, dateKey));
  }

  function clearTaskExit(id: string) {
    const existingTimers = taskExitTimers.current[id];
    if (existingTimers) {
      window.clearTimeout(existingTimers.fade);
      window.clearTimeout(existingTimers.remove);
      delete taskExitTimers.current[id];
    }
  }

  // Undo while the row is still on the Page. A task finished by accident should
  // not be a one-way door just because it has started leaving.
  function reopenFinishedTask(id: string) {
    clearTaskExit(id);
    setLeavingMissionIds((ids) => ids.filter((missionId) => missionId !== id));
    setFadingMissionIds((ids) => ids.filter((missionId) => missionId !== id));
    updateState((current) => reopenTask(current, id));
  }

  function finishTask(id: string) {
    const task = state.tasks.items[id];
    if (!task || !task.text.trim()) return;
    if (task.status === "completed") {
      reopenFinishedTask(id);
      return;
    }
    clearTaskExit(id);
    updateState((current) => completeTask(current, id));
    setLeavingMissionIds((ids) => [...new Set([...ids, id])]);
    // The row stays put long enough to undo an accidental press before it
    // begins to leave. Three seconds, matching the habit swap, so a completed
    // task and a completed habit wait the same amount of time before the row
    // changes under him.
    const fade = window.setTimeout(() => {
      setFadingMissionIds((ids) => [...new Set([...ids, id])]);
    }, 3_000);
    const remove = window.setTimeout(() => {
      setLeavingMissionIds((ids) => ids.filter((missionId) => missionId !== id));
      setFadingMissionIds((ids) => ids.filter((missionId) => missionId !== id));
      delete taskExitTimers.current[id];
    }, 3_340);
    taskExitTimers.current[id] = { fade, remove };
  }

  // Habit and Yesterday are two modes of one App Page, changed in place. The
  // standard makes Thoughts to Deep Thoughts the reference for this, so it uses
  // the same ceremonial pause rather than swapping instantly.
  function saveHabitAppIndex(index: number) {
    updateState((current) =>
      setAppSessionIndex(current, "today-habit", habitAppVersion, index),
    );
  }

  function startProtocol() {
    updateState((current) => {
      const started = startProtocolDraft(current);
      return started.state;
    });
  }

  function addProtocolTerm(kind: "non-negotiable" | "negotiable") {
    if (!protocolRun) return;
    const id = freshInlineEditorId("pitem");
    updateState((current) =>
      addProtocolItem(current, protocolRun.id, kind, id).state,
    );
    setNewProtocolItemId(id);
  }

  function changeProtocolTerm(itemId: string, text: string) {
    if (!protocolRun) return;
    updateState((current) => updateProtocolItem(current, protocolRun.id, itemId, text));
  }

  function finishProtocolTermEdit(itemId: string) {
    if (!protocolRun) return;
    updateState((current) => discardEmptyProtocolItem(current, protocolRun.id, itemId));
    setNewProtocolItemId((current) => (current === itemId ? null : current));
  }

  function completeProtocolToday() {
    if (!protocol || !protocol.keptAll || protocol.sealed) return;
    const seal: ProtocolSealView = {
      runId: protocol.run.id,
      dateKey,
      day: protocol.day,
      totalDays: protocol.run.days,
      phaseName: protocol.run.name,
      terms: [...protocol.nonNegotiable, ...protocol.negotiable]
        .filter((item) => item.completed)
        .map((item) => ({
          id: item.id,
          text: item.text,
          kind: item.kind,
        })),
    };
    updateState((current) => sealProtocolDay(current, dateKey));
    setSealedProtocolDay(seal);
  }

  function changeHabitAppPage(index: number) {
    if (!sealedProtocolDay) {
      saveHabitAppIndex(index);
      return;
    }
    if (index === 1) return;
    setSealedProtocolDay(null);
    // The transient Page occupies the Protocol slot. Forward closes onto the
    // Protocol home/front at index one; backward returns to Routine at zero.
    saveHabitAppIndex(index > 1 ? 1 : 0);
  }

  function toggleHabitMode(event: ReactMouseEvent<HTMLButtonElement>) {
    const nextMode = habitMode === "yesterday" ? "habit" : "yesterday";
    routineBack.flip(nextMode, undefined, event.currentTarget);
  }

  function resetLogForm() {
    const range = freshTimeRange();
    setStart(range.start);
    setEnd(range.end);
    setBlockTitle("");
    setMomentsText("");
    setEditingId(null);
    setFormError("");
    setMomentHour(null);
    setNewMoment("");
    setEditingMomentKey(null);
    setMomentDraft("");
  }

  function openEdit(block: TimeBlock) {
    setEditingId(block.id);
    setStart(block.start);
    setEnd(block.end);
    setBlockTitle(block.title ?? block.activity);
    setMomentsText(
      block.moments?.join("\n") ?? (block.note ? block.note : ""),
    );
    setFormError("");
    setLogOpen(true);
  }

  function openHour(hour: number, defaultTitle = "") {
    const hourStart = hourLabel(hour);
    const existing = today.timeBlocks.find((block) => block.start === hourStart);
    if (existing) {
      openEdit(existing);
      return;
    }

    resetLogForm();
    setStart(hourStart);
    setEnd(hourLabel(hour + 1));
    setBlockTitle(defaultTitle);
    setLogOpen(true);
  }

  function saveTimeBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (minutesBetween(start, end) <= 0) {
      setFormError("The end time needs to be after the start.");
      return;
    }
    const cleanTitle = String(
      new FormData(event.currentTarget).get("mainActivity") || "",
    ).trim();
    const cleanMoments = momentsText
      .split("\n")
      .map((moment) => moment.trim())
      .filter(Boolean);
    if (!cleanTitle && !cleanMoments.length && !editingId) {
      resetLogForm();
      setLogOpen(false);
      return;
    }
    const id =
      editingId ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `block-${Date.now()}`);
    const updatedAt = new Date().toISOString();
    updateToday((day) => {
      if (!cleanTitle && !cleanMoments.length) {
        return {
          ...day,
          timeBlocks: day.timeBlocks.filter((block) => block.id !== id),
        };
      }
      return upsertTimeBlock(day, {
        id,
        start,
        end,
        activity: cleanTitle,
        note: "",
        title: cleanTitle,
        moments: cleanMoments,
        createdAt:
          day.timeBlocks.find((block) => block.id === id)?.createdAt ??
          updatedAt,
        updatedAt,
      });
    }, "day-log");
    resetLogForm();
    setLogOpen(false);
  }

  function addMoment(event: FormEvent<HTMLFormElement>, hour: number) {
    event.preventDefault();
    const moment = newMoment.trim();
    if (!moment) {
      setMomentHour(null);
      return;
    }
    const startTime = hourLabel(hour);
    const updatedAt = new Date().toISOString();
    updateToday((day) => {
      const existing = day.timeBlocks.find(
        (block) => block.start === startTime,
      );
      if (!existing) {
        return upsertTimeBlock(day, {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `block-${Date.now()}`,
          start: startTime,
          end: hourLabel(hour + 1),
          activity: "",
          note: "",
          title: "",
          moments: [moment],
          createdAt: updatedAt,
          updatedAt,
        });
      }
      return {
        ...day,
        timeBlocks: day.timeBlocks.map((block) =>
          block.id === existing.id
            ? {
                ...block,
                note: "",
                moments: [
                  ...(block.moments?.length
                    ? block.moments
                    : block.note
                      ? [block.note]
                      : []),
                  moment,
                ],
                updatedAt,
              }
            : block,
        ),
      };
    }, "day-log");
    setNewMoment("");
    setMomentHour(null);
  }

  function editMoment(block: TimeBlock, index: number, moment: string) {
    setEditingMomentKey(`${block.id}-${index}`);
    setMomentDraft(moment);
  }

  function saveMoment(
    event: FormEvent<HTMLFormElement>,
    block: TimeBlock,
    index: number,
  ) {
    event.preventDefault();
    const cleanMoment = String(
      new FormData(event.currentTarget).get("moment") || "",
    ).trim();
    const updatedAt = new Date().toISOString();
    updateToday((day) => {
      const nextBlocks = day.timeBlocks
        .map((item) => {
          if (item.id !== block.id) return item;
          const moments = [...(item.moments || [])];
          if (cleanMoment) {
            moments[index] = cleanMoment;
          } else {
            moments.splice(index, 1);
          }
          return { ...item, note: "", moments, updatedAt };
        })
        .filter(
          (item) =>
            Boolean((item.title || item.activity || "").trim()) ||
            Boolean(item.moments?.length),
        );
      return { ...day, timeBlocks: nextBlocks };
    }, "day-log");
    setEditingMomentKey(null);
    setMomentDraft("");
  }

  function saveProfileSparkRun(nextRun: ChapterRun) {
    if (!profileSparkChapter) return;
    const completedNow =
      nextRun.status === "completed" && profileSparkRun?.status !== "completed";
    if (completedNow) {
      setCheckInApp(checkInThoughtsApp);
      setCheckInIdleEntering(true);
      if (checkInIdleTimer.current) window.clearTimeout(checkInIdleTimer.current);
      checkInIdleTimer.current = window.setTimeout(() => {
        setCheckInIdleEntering(false);
        checkInIdleTimer.current = null;
      }, 420);
    }
    updateState((current) => {
      const previousRun = current.chapters.runs[nextRun.runId];
      let next = storeChapterRun(
        current,
        nextRun,
        profileSparkChapter.session,
      );
      if (
        nextRun.status === "completed" &&
        previousRun?.status !== "completed"
      ) {
        next = queueProfileUpdate(next, "survey-answer");
        next = setAppSessionIndex(
          next,
          "today-checkin",
          checkInJourneyVersion,
          checkInThoughtsApp,
        );
      }
      return next;
    });
  }

  function deferProfileSparkRun() {
    if (!profileSparkRun) return;
    setCheckInApp(checkInThoughtsApp);
    updateState((current) =>
      setAppSessionIndex(
        storeChapterRun(
          current,
          {
            ...profileSparkRun,
            deferCount: (profileSparkRun.deferCount || 0) + 1,
            deferredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          "check-in",
        ),
        "today-checkin",
        checkInJourneyVersion,
        checkInThoughtsApp,
      ),
    );
  }

  function returnToThoughtsAfterChapter() {
    setCheckInApp(checkInThoughtsApp);
    updateState((current) =>
      setAppSessionIndex(
        current,
        "today-checkin",
        checkInJourneyVersion,
        checkInThoughtsApp,
      ),
    );
  }

  function openNoteLine(event: ReactMouseEvent<HTMLButtonElement>) {
    if (noteBack.flipping) return;
    const line = selectLine(linePool, state.seenLines);
    if (!line) return;
    noteBack.flip("line", () => {
      setRevealedLine(line);
      setRevealedLinePage(0);
      setLineFeedbackOpen(false);
      updateState((current) => markLineSeen(current, line.id));
    }, event.currentTarget);
  }

  function closeNoteLine(source?: HTMLElement | null) {
    if (noteBack.flipping) return;
    noteBack.flip("note", () => {
      setRevealedLine(null);
      setRevealedLinePage(0);
      setLineFeedbackOpen(false);
    }, source);
  }

  // A Line waits. It used to leave by itself after a dwell, which took the
  // words away mid-sentence and, on a joke, sometimes before the punchline had
  // been read at all. Sai: "they should never fade away until i dismiss, react,
  // or complete." Three ways out, all of them his: swipe forward for the
  // reactions, answer one, or swipe back.

  /** Swiping back off the front of a Line puts it away. */
  function dismissLineBackward() {
    if (!revealedLine) return;
    closeNoteLine();
  }

  /**
   * A swipe off the end of a Line. The first one asks; the second one leaves.
   */
  function passLineForward() {
    if (!revealedLine) return;
    if (!lineFeedbackOpen) {
      setLineFeedbackOpen(true);
      return;
    }
    closeNoteLine();
  }

  /** A reaction is an answer and a goodbye: it records, then the Page goes. */
  function reactToRevealedLine(reaction: string) {
    if (!revealedLine) return;
    const line = revealedLine;
    updateState((current) => reactToLineSeen(current, line.id, reaction));
    closeNoteLine();
  }

  function saveHabitBuildingRun(nextRun: ChapterRun) {
    if (!habitBuildingChapter) return;
    updateState((current) => {
      const previousRun = current.chapters.runs[nextRun.runId];
      let next = storeChapterRun(
        current,
        nextRun,
        habitBuildingChapter.session,
      );
      if (
        nextRun.status === "completed" &&
        previousRun?.status !== "completed"
      ) {
        const idlePage = habitBuildingChapter.pages.find(
          (page) => page.type === "idle",
        );
        const missionText = renderChapterTemplate(
          idlePage?.body || habitBuildingChapter.title,
          nextRun,
        );
        const action = chapterAnswerText(nextRun, "habit-action");
        const cue = chapterAnswerText(nextRun, "habit-time-place");
        const identity =
          chapterAnswerText(nextRun, "habit-identity") || "Yourself";
        const added = addHabitDefinition(next);
        next = updateHabitDefinitionParts(added.state, added.id, {
          action,
          cue,
          identity,
          text: missionText,
        });
        next = {
          ...next,
          profile: { ...next.profile, identityFocus: identity },
        };
      }
      return next;
    });
  }

  function saveLogSetupRun(
    nextRun: ChapterRun,
    submission?: ChapterSubmission,
  ) {
    if (!logSetupChapter) return;
    updateState((current) => {
      let next = storeChapterRun(current, nextRun, logSetupChapter.session);
      const page = submission?.page;
      if (page?.answerKey && submission?.value !== undefined) {
        next = answerSurveyQuestion(
          next,
          {
            id: page.answerKey,
            text: page.question || page.title || logSetupChapter.title,
            type: page.type,
            target: "currentLife",
          },
          String(submission.value),
          "routine",
        );
      }
      return next;
    });
  }

  function commitCheckInNote(title: string, note: string) {
    updateState((current) => {
      const withTitle = answerSurveyQuestion(
        current,
        {
          id: "checkin-idle-title",
          text: "Check-in idle title",
          type: "text",
          target: "currentLife",
        },
        title,
        "note",
      );
      return answerSurveyQuestion(
        withTitle,
        {
          id: "checkin-note",
          text: "Today note",
          type: "text",
          target: "currentLife",
        },
        note,
        "note",
      );
    });
  }

  function setThoughtDraft(value: string) {
    if (thoughtMode === "deep") setDeepThoughtDraft(value);
    else setRegularThoughtDraft(value);
  }

  function pauseDeepWriting() {
    if (deepWritingFocusStartedAt.current !== null) {
      // This clock is read only after direct user interaction, never during render.
      deepWritingActiveMs.current += Date.now() - deepWritingFocusStartedAt.current;
      deepWritingFocusStartedAt.current = null;
    }
  }

  function resetDeepWritingClock() {
    deepWritingActiveMs.current = 0;
    deepWritingFocusStartedAt.current = null;
  }

  function openDeepThoughts(event: ReactMouseEvent<HTMLButtonElement>) {
    if (thoughtBack.flipping || thoughtTransition !== "idle") return;
    const nextMode = thoughtMode === "deep" ? "regular" : "deep";
    // A different question every time it is opened. Sai: "better be refresh
    // with new question on every visit. so that there may be some questions
    // that i am not in the mood now." Leaving without answering spends nothing,
    // so the one skipped is still there to come back to.
    const prompt =
      nextMode === "deep"
        ? selectDeepThoughtPrompt(state, dateKey, deepThoughtVisits.current)
        : null;
    if (nextMode === "deep") deepThoughtVisits.current += 1;
    pauseDeepWriting();
    concealThoughtButton();
    thoughtBack.flip(nextMode, () => {
      if (nextMode === "deep") {
        setDeepThoughtPrompt(prompt);
        resetDeepWritingClock();
      } else {
        setDeepThoughtPrompt(null);
      }
    }, event.currentTarget);
  }

  async function sendThought(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const thought = thoughtDraft.trim();
    if (!thought || thoughtSubmissionLocked.current) return;
    if (thought.toLowerCase() === ADMIN_THOUGHT) {
      thoughtSubmissionLocked.current = true;
      try {
        const response = await fetch("/os/admin/unlock", {
          method: "POST",
          body: new URLSearchParams({ code: thought }),
        });
        if (!response.ok) return;
        setThoughtDraft("");
        thoughtTextareaRef.current?.blur();
        router.push("/os/admin");
      } catch {
        // Keep the hidden phrase out of the thought stream even when the
        // local network is unavailable. A later attempt can unlock Admin.
        return;
      } finally {
        thoughtSubmissionLocked.current = false;
      }
      return;
    }
    pauseDeepWriting();
    const deep = thoughtMode === "deep" && Boolean(deepThoughtPrompt);
    const rewarded = deep && isDeepThoughtRewardEligible({
      text: thought,
      activeMs: deepWritingActiveMs.current,
    });
    thoughtSubmissionLocked.current = true;
    const createdAt = new Date();
    const prompt = deep ? deepThoughtPrompt! : null;
    updateState((current) =>
      answerSurveyQuestion(
        current,
        {
          id: prompt?.id || `thought-${createdAt.getTime()}`,
          text: prompt?.text || "A thought I wanted to keep",
          type: "text",
          target: prompt?.target || "currentLife",
          source: prompt?.source,
        },
        thought,
        deep ? "deep-thought" : "thought",
      ),
    );
    thoughtOutcome.current = { deep, rewarded };
    setThoughtRewarded(rewarded);
    setThoughtSent(true);
    setThoughtTransition("clicked");
  }

  function revealThoughtButton() {
    if (thoughtButtonVisible || thoughtSent) return;
    setThoughtButtonVisible(true);
  }

  function concealThoughtButton() {
    if (thoughtSent) return;
    pauseDeepWriting();
    setThoughtButtonVisible(false);
    thoughtTextareaRef.current?.blur();
  }

  // What a send looks like.
  //
  // It used to empty the whole App Box and play the arrival choreography over
  // it, so the answer to "did that go?" was the App vanishing and coming back
  // — the same thing that happens when a Page changes for any other reason,
  // and a second of it. Sai: "instead of whole app box refresh, what can we do
  // to obviously signal message sent?"
  //
  // The thing that was sent is the thing that leaves. The written words lift
  // off the Page and fade while the button under them holds on "Sent"; the App
  // Box, its Label and its Footer never move. Then the placeholder is back and
  // the App is ready for the next one.
  //
  // Nothing in the Footer moves either. The button is not taken away and put
  // back — it goes flat and disabled, exactly as it sits before a word is
  // typed, and lifts again on the next one.
  function beginThoughtDeparture() {
    if (thoughtTransition !== "clicked") return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setThoughtTransition("departing");
    if (thoughtResetTimer.current) {
      window.clearTimeout(thoughtResetTimer.current);
    }
    thoughtResetTimer.current = window.setTimeout(() => {
      const outcome = thoughtOutcome.current;
      // The button stays. Sai: "the button should stay flat and change into
      // disabled send button, the state before we type." Clearing the draft is
      // what disables it, and a disabled key has no leg and no light, so it
      // settles flat where it already is instead of leaving the Footer.
      if (outcome.deep) {
        setDeepThoughtDraft("");
        resetDeepWritingClock();
        // One question, one answer. A deep question used to ask a second time
        // for anything short of the reward, which turned the one deep thing
        // the day asks for into an interrogation. Sai: "i dont think we need
        // follow up."
        thoughtBack.reset("regular");
        setDeepThoughtPrompt(null);
      } else {
        setRegularThoughtDraft("");
      }
      setThoughtSent(false);
      setThoughtRewarded(false);
      setHoldThoughtsAfterSend(true);
      setThoughtTransition("idle");
      thoughtSubmissionLocked.current = false;
      thoughtTextareaRef.current?.blur();
      thoughtTextareaRef.current?.style.removeProperty("height");
      thoughtResetTimer.current = null;
    }, reducedMotion ? 40 : THOUGHT_DEPARTURE_MS);
  }

  function defaultTitleForHour(hour: number) {
    if (hour === wakeHour) return "Wake up";
    if (hour === sleepHour) return "Sleep";
    return "";
  }

  function checkInIdleCard() {
    return (
      <InfoPage
        className="os-note-page os-survey-card os-survey-complete"
        header={
          <button
            aria-label="Show a Line"
            className="os-card-label os-checkin-refresh-label"
            type="button"
            onClick={openNoteLine}
          >
            Note
          </button>
        }
        headerAction={
          noteEditing ? (
            <button
              className="os-note-clear"
              type="button"
              // The clear happens on press, not on click.
              //
              // The editor commits on blur and the action only exists while
              // writing, so a handler that waits for click is racing its own
              // unmount: the press blurs the note, the note commits, the
              // action disappears, and on touch the click never arrives at all
              // once default is prevented. Pointerdown lands before any of it.
              onPointerDown={(event) => {
                event.preventDefault();
                clearNote();
              }}
              // Keyboard and assistive presses never send pointerdown.
              onClick={clearNote}
            >
              Clear
            </button>
          ) : undefined
        }
      >
        <InlineCheckInEditor
          clearSignal={noteClearSignal}
          note={checkInNote}
          onCommit={commitCheckInNote}
          onEditingChange={setNoteEditing}
          placeholder={notePlaceholder}
          title={checkInIdleTitle}
        />
      </InfoPage>
    );
  }

  function noteLineCards() {
    if (!revealedLine) return [];
    const kindLabel = revealedLine.kind.toUpperCase();
    // The kind sits where an App Label sits, because on this side it is the
    // label. There is no button back: a Line leaves on its own.
    const kind = (
      <span aria-label={`Line kind: ${kindLabel}`} className="os-line-kind">
        {kindLabel}
      </span>
    );
    // The reactions sit in the Footer of the Line's last Page, on the right.
    // They are keys like every other control, and they latch, because choosing
    // one is the last thing that happens on this Page.
    const reactions = (
      <div className="os-line-reactions" role="group" aria-label="How was this?">
        {lineReactions(revealedLine.kind).map((reaction) => (
          <CreativeButton
            aria-label={LINE_REACTION_LABELS[reaction] || reaction}
            aria-pressed={lineReaction(state.lineFeedback, revealedLine.id) === reaction}
            className="os-line-reaction"
            key={reaction}
            onClick={() => reactToRevealedLine(reaction)}
            release="latch"
            sizing="content"
            styleId="default"
            type="button"
          >
            {LINE_REACTION_WORDS[reaction] || reaction}
          </CreativeButton>
        ))}
      </div>
    );
    // Nothing in the Footer until there is something to answer. Sai: "in joke
    // quotes and those flip side of notes, remove all the swipe to begins etc
    // labels in footer. only the first set-up page covers will have those."
    const lastPageFooter = lineFeedbackOpen ? reactions : undefined;
    const setup = (
      <PageLayout
        className="os-line-page"
        footer={revealedLine.kind === "quote" ? lastPageFooter : undefined}
        headerLeft={kind}
        key={`${revealedLine.id}:setup`}
        theme="light"
      >
        <div className="os-page-main">
          <h2>{revealedLine.text}</h2>
        </div>
        {revealedLine.kind === "quote" && revealedLine.sub ? (
          <div className="os-page-sub">
            <p className="os-line-sub">{revealedLine.sub}</p>
          </div>
        ) : null}
      </PageLayout>
    );
    if (revealedLine.kind === "quote") return [setup];
    return [
      setup,
      <PageLayout
        className="os-line-page os-line-reveal-page"
        footer={lastPageFooter}
        headerLeft={kind}
        key={`${revealedLine.id}:reveal`}
        theme="light"
      >
        <div className="os-page-main">
          <h2>{revealedLine.sub}</h2>
        </div>
      </PageLayout>,
    ];
  }

  function checkInThoughtsCard() {
    const deepThoughtsActive = thoughtMode === "deep" && Boolean(deepThoughtPrompt);
    const thoughtInput = (
      <textarea
        aria-label={deepThoughtsActive ? "Answer the deep thought" : "Write a thought"}
        className={deepThoughtsActive ? "os-deep-thought-answer" : "os-regular-thought-input"}
        maxLength={800}
        onBlur={pauseDeepWriting}
        onChange={(event) => {
          const input = event.currentTarget;
          const value = input.value;
          setThoughtDraft(value);
          sizeTextAreaToContent(input);
          if (deepThoughtsActive && value.trim() && deepWritingFocusStartedAt.current === null) {
            deepWritingFocusStartedAt.current = Date.now();
          }
        }}
        onFocus={(event) => {
          revealThoughtButton();
          sizeTextAreaToContent(event.currentTarget);
          if (deepThoughtsActive && thoughtDraft.trim() && deepWritingFocusStartedAt.current === null) {
            deepWritingFocusStartedAt.current = Date.now();
          }
        }}
        placeholder={deepThoughtsActive ? "Write what comes up..." : thoughtPlaceholder}
        ref={thoughtTextareaRef}
        rows={1}
        value={thoughtDraft}
      />
    );

    return (
      <InfoPage
        className={`os-thoughts-page os-survey-card${thoughtMode === "deep" ? " deep-mode" : ""}`}
        header={<button aria-pressed={thoughtMode === "deep"} className="os-card-label os-thoughts-mode-toggle" type="button" onClick={openDeepThoughts}>{thoughtMode === "deep" ? "Deep Thoughts" : "Thoughts"}</button>}
        footer={
          <div className="os-creative-button-slot">
            {thoughtButtonVisible ? (
              <CreativeButton
                disabled={!thoughtDraft.trim() || thoughtSent}
                form="check-in-thought-form"
                keepMountedOnSuccess
                onSuccessComplete={beginThoughtDeparture}
                // What replaces Send is the flat disabled Send, so coming back
                // up on the release and going down again would be a flinch.
                release="latch"
                styleId={THOUGHT_BUTTON_STYLE}
                type="submit"
              >
                {thoughtSent ? "Sent" : "Send"}
              </CreativeButton>
            ) : null}
            <span aria-live="polite" className="os-visually-hidden" role="status">
              {thoughtSent ? "Thought sent" : ""}
            </span>
          </div>
        }
      >
        <ButtonRewardBackdrop active={thoughtSent && thoughtRewarded} styleId={THOUGHT_BUTTON_STYLE} />
        <form
          className={`os-thoughts-form${deepThoughtsActive ? " deep-compose" : ""}${
            thoughtTransition === "departing" ? " is-departing" : ""
          }`}
          id="check-in-thought-form"
          onSubmit={sendThought}
        >
          {deepThoughtsActive ? (
            <>
              <div className="os-info-page-main os-deep-thought-question-wrap">
                <h2 className="os-deep-thought-question">{deepThoughtPrompt?.text}</h2>
              </div>
              <div className="os-info-page-sub os-deep-thought-response">
                {thoughtInput}
              </div>
            </>
          ) : (
            <div className="os-info-page-main">{thoughtInput}</div>
          )}
        </form>
      </InfoPage>
    );
  }

  const noteLineActive = noteBack.side === "line" && Boolean(revealedLine);
  const checkInCards = noteLineActive
    ? noteLineCards()
    : [checkInIdleCard(), checkInThoughtsCard()];
  const checkInIndex = noteLineActive
    ? revealedLinePage
    : visibleCheckInApp;
  const checkInAvailableIndices = noteLineActive
    ? revealedLine?.kind === "quote" ? [0] : [0, 1]
    : thoughtSent
      ? [checkInThoughtsApp]
      : [checkInIdleApp, checkInThoughtsApp];

  return (
      <main className="os-today">
        <section className="os-checkin" aria-label="Check-in questions">
          <div className="os-context-row">
            <div>
              <p className="os-eyebrow">{dateLabel}</p>
              <h1>{greeting}</h1>
            </div>
          </div>

          {!holdThoughtsAfterSend &&
          profileSparkChapter &&
          profileSparkRun &&
          profileSparkRun.status !== "completed" &&
          !profileSparkRun.deferredAt ? (
            <ChapterPlayer
              attentionKey={`check-in:${profileSparkChapter.id}:${profileSparkChapter.version}`}
              className="os-checkin-session"
              definition={profileSparkChapter}
              key={profileSparkRun.runId}
              label="Check-in chapter"
              run={profileSparkRun}
              backApp={checkInThoughtsCard()}
              onBackAppShown={deferProfileSparkRun}
              onRunChange={saveProfileSparkRun}
            />
          ) : thoughtsPublication ? (
            <PublishedChapterDelivery
              backApp={checkInThoughtsCard()}
              className="os-checkin-session"
              label="Thoughts chapter"
              onCompletedReturn={returnToThoughtsAfterChapter}
              onDismissed={returnToThoughtsAfterChapter}
              publication={thoughtsPublication}
            />
          ) : (
          <SwipeSession
            availableIndices={checkInAvailableIndices}
            attentionIndex={checkInThoughtsApp}
            className={`os-checkin-session${
              checkInIdleEntering ? " idle-arrival" : ""
            }${
              thoughtBack.className ? ` ${thoughtBack.className}` : ""
            }${
              noteBack.className ? ` ${noteBack.className}` : ""
            }`}
            index={checkInIndex}
            label={noteLineActive ? "A Line" : "Check-in session"}
            maxIndex={Math.max(...checkInAvailableIndices)}
            onBackwardBoundary={noteLineActive ? dismissLineBackward : undefined}
            onForwardBoundary={noteLineActive ? passLineForward : undefined}
            rotateMs={IDLE_PAGE_DWELL_MS}
            rotatePaused={!noteLineActive && Boolean(thoughtDraft.trim())}
            onIndexChange={(nextIndex) => {
              if (noteLineActive) {
                setRevealedLinePage(nextIndex);
                return;
              }
              if (nextIndex !== checkInThoughtsApp) {
                concealThoughtButton();
                setHoldThoughtsAfterSend(false);
              }
              setCheckInApp(nextIndex);
              updateState((current) =>
                setAppSessionIndex(
                  current,
                  "today-checkin",
                  checkInJourneyVersion,
                  nextIndex,
                ),
              );
            }}
          >
            {checkInCards}
          </SwipeSession>
          )}
        </section>

        {habitSetupPublication ? (
          <section className="os-habit" aria-label="Routine setup">
            <PublishedChapterDelivery
              className="os-habit-session"
              hideIdleHeading
              label="Routine setup"
              publication={habitSetupPublication}
            />
          </section>
        ) : habitPublication ? (
          <section className="os-habit" aria-label="Routine session">
            <PublishedChapterDelivery
              className="os-habit-session"
              hideIdleHeading
              label="Routine chapter"
              publication={habitPublication}
            />
          </section>
        ) : activeHabitChapter && activeHabitRun ? (
          <section className="os-habit" aria-label="Routine session">
            <ChapterPlayer
              className={`os-habit-session${routineBack.className ? ` ${routineBack.className}` : ""}`}
              definition={activeHabitChapter}
              key={activeHabitChapter.id}
              idleLabel={
                <button
                  aria-pressed={habitMode === "yesterday"}
                  className="os-card-label os-habit-mode-toggle"
                  onClick={toggleHabitMode}
                  type="button"
                >
                  {habitMode === "yesterday" ? "Record" : "Routine"}
                </button>
              }
              idleBody={habitMode === "yesterday" ? (
                <section className="os-habit-body-session os-yesterday" aria-label="Habit record">
                  <p className="os-record-label">Today so far</p>
                  {todaySoFar.total ? (
                    <div className="os-yesterday-list">
                      {todaySoFar.habits.map((habit: { id: string; text: string }) => (
                        <article className="os-extra-mission os-record-row" key={habit.id}>
                          <p className="os-record-text">{habit.text}</p>
                          <CreativeButton
                            aria-label={`Undo: ${habit.text}`}
                            aria-pressed
                            className="os-row-tick os-row-tick-habit"
                            keepMountedOnSuccess
                            onClick={() => toggleHabit(habit.id)}
                            release="latch"
                            role="habit"
                            styleId="soft-clay"
                            type="button"
                          />
                        </article>
                      ))}
                      {todaySoFar.tasks.map((task: { id: string; text: string }) => (
                        <article className="os-extra-mission os-record-row is-task" key={task.id}>
                          <p className="os-record-text">{task.text}</p>
                          <CreativeButton
                            aria-label={`Undo task: ${task.text}`}
                            aria-pressed
                            className="os-row-tick os-row-tick-task"
                            keepMountedOnSuccess
                            onClick={() => finishTask(task.id)}
                            release="latch"
                            role="habit"
                            styleId="soft-clay"
                            type="button"
                          />
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="os-yesterday-empty">Nothing completed yet today.</p>
                  )}
                  <hr className="os-record-seam" />
                  <p className="os-record-label">Yesterday</p>
                  {yesterday.total ? (
                    <div className="os-yesterday-list">
                      {yesterday.habits.map((habit: { id: string; text: string }) => (
                        <p className="os-yesterday-row" key={habit.id}>{habit.text}</p>
                      ))}
                      {yesterday.tasks.map((task: { id: string; text: string }) => (
                        <p className="os-yesterday-row is-task" key={task.id}>{task.text}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="os-yesterday-empty">Nothing was recorded yesterday.</p>
                  )}
                </section>
              ) : (
                <input
                  aria-label="Routine identity"
                  className="os-app-page-heading os-routine-name-edit"
                  data-os-app-heading
                  maxLength={60}
                  onChange={(event) =>
                    updateState((current) =>
                      updateRoutineIdentity(current, event.target.value),
                    )
                  }
                  placeholder="Habits"
                  value={state.habits.identity.text}
                />
              )}
              idleContent={habitMode === "yesterday" ? undefined : (
                <div className="os-routine-body">
                  <section className="os-habit-body-session" aria-labelledby="habit-session-title">
                    <p className="os-record-label" id="habit-session-title">Habits</p>
                    <div className="os-repeated-habits">
                      {habits.map((habit) => {
                        const completed = Boolean(habitCompletion(habit.id)?.completed);
                        const action = Object.hasOwn(habit, "action")
                          ? habit.action
                          : habit.text;
                        const identity = habit.identity.trim();
                        return (
                          <article
                            className={`os-extra-mission os-repeated-habit${completed ? " completed" : ""}${
                              editingHabitId === habit.id ? " is-editing" : ""
                            }`}
                            key={habit.id}
                            onBlurCapture={(event) => {
                              const next = event.relatedTarget as Node | null;
                              if (next && event.currentTarget.contains(next)) return;
                              setEditingHabitId((current) =>
                                current === habit.id ? null : current,
                              );
                            }}
                            onFocusCapture={() => setEditingHabitId(habit.id)}
                          >
                            <HabitCopySwap
                              completed={completed}
                              // Editing wins over the identity. Sai: "i want to
                              // be able to tap on the identity to see the full
                              // action cue and identity edit." A done habit
                              // reads as who it makes him until he asks for the
                              // words behind it, and then it is a habit again.
                              showIdentity={Boolean(
                                completed && identity && editingHabitId !== habit.id,
                              )}
                            >
                              <div className="os-habit-action-copy">
                                <textarea
                                  aria-label={`Edit habit: ${action || "New Habit"}`}
                                  autoFocus={newHabitId === habit.id}
                                  data-inline-editor-id={habit.id}
                                  className="os-extra-mission-copy os-mission-text-edit"
                                  maxLength={240}
                                  onBlur={() => finishHabitEdit(habit.id)}
                                  onChange={(event) => changeHabit(habit.id, event.target.value)}
                                  placeholder="New Habit"
                                  rows={1}
                                  value={action}
                                />
                                {habit.cue ? (
                                  <span className="os-habit-cue">{habit.cue}</span>
                                ) : null}
                                <textarea
                                  aria-label={`Who this makes you: ${action || "New Habit"}`}
                                  className="os-habit-identity-edit"
                                  maxLength={120}
                                  onBlur={() => finishHabitEdit(habit.id)}
                                  onChange={(event) =>
                                    changeHabitIdentity(habit.id, event.target.value)
                                  }
                                  placeholder="I am a reader"
                                  rows={1}
                                  value={habit.identity}
                                />
                              </div>
                              {identity ? (
                                // A button, not a line of text. It is the way
                                // back to the habit behind the identity, and
                                // focus is put in the identity field so the
                                // editor closes again on blur the way every
                                // other inline editor in the App does.
                                <button
                                  aria-label={`Edit habit behind: ${identity}`}
                                  className="os-habit-identity-copy"
                                  onClick={(event) => {
                                    setEditingHabitId(habit.id);
                                    const row = event.currentTarget.closest("article");
                                    // After the commit, not on the next frame.
                                    // The identity field is display:none until
                                    // the row is editing, and focusing a hidden
                                    // field does nothing — which left the row
                                    // open with focus still on the body, so it
                                    // never closed again on blur.
                                    window.setTimeout(() => {
                                      row
                                        ?.querySelector<HTMLTextAreaElement>(
                                          ".os-habit-identity-edit",
                                        )
                                        ?.focus();
                                    }, 0);
                                  }}
                                  type="button"
                                >
                                  {identity}
                                </button>
                              ) : null}
                            </HabitCopySwap>
                            <CreativeButton
                              aria-label={`${completed ? "Undo" : "Mark done"}: ${action || "New Habit"}`}
                              aria-pressed={completed}
                              className="os-row-tick os-row-tick-habit"
                              disabled={!habit.text.trim()}
                              keepMountedOnSuccess
                              onClick={() => toggleHabit(habit.id)}
                              release="latch"
                              role="habit"
                              styleId="soft-clay"
                              type="button"
                            />
                          </article>
                        );
                      })}
                    </div>
                  </section>
                  <section className="os-task-body-session" aria-labelledby="task-session-title">
                    <p className="os-task-session-label" id="task-session-title">Tasks</p>
                    <div className="os-one-time-tasks">
                      {oneTimeTasks.map((task) => (
                        <article
                          className={`os-extra-mission os-task-row${task.status === "completed" ? " completed" : ""}${fadingMissionIds.includes(task.id) ? " leaving" : ""}${goalStepForTask(state, task.id) ? " from-week" : ""}`}
                          key={task.id}
                        >
                          <textarea
                            aria-label={`Edit task: ${task.text || "New Task"}`}
                            autoFocus={newTaskId === task.id}
                            data-inline-editor-id={task.id}
                            className={`os-extra-mission-copy os-mission-text-edit${task.status === "completed" ? " completed" : ""}`}
                            maxLength={240}
                            onBlur={() => finishTaskEdit(task.id)}
                            onChange={(event) => changeTask(task.id, event.target.value)}
                            placeholder="New Task"
                            rows={1}
                            value={task.text}
                          />
                          <CreativeButton
                            aria-label={`${task.status === "completed" ? "Undo" : "Complete"} task: ${task.text || "New Task"}`}
                            aria-pressed={task.status === "completed"}
                            className={`os-row-tick os-row-tick-task${goalStepForTask(state, task.id) ? " os-row-tick-week" : ""}`}
                            disabled={!task.text.trim()}
                            keepMountedOnSuccess
                            onClick={() => finishTask(task.id)}
                            release="latch"
                            role="habit"
                            styleId="soft-clay"
                            type="button"
                          />
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}
              idlePlacement={
                habitMode === "yesterday" ? "content-flow" : "identity-stack"
              }
              idleHeaderAction={habitMode === "yesterday" ? undefined : (
                <button className="os-new-habit" type="button" onClick={beginNewHabit}>
                  New habit
                </button>
              )}
              idleFooter={
                habitBuildingRun?.status === "completed" && habitMode === "habit" ? (
                  <button
                    className="os-add-habit-row"
                    type="button"
                    onClick={beginNewTask}
                  >
                    <span aria-hidden="true">+</span>
                    Add task
                  </button>
                ) : undefined
              }
              hideIdleHeading
              idleApps={[
                ...(sealedProtocolDay ? [
                  <ProtocolKeptPage key="protocol-kept" seal={sealedProtocolDay} />,
                ] : []),
                <ProtocolPage
                  key={`protocol-${protocolRun?.id || "home"}`}
                  protocol={protocol}
                  completedProtocol={completedProtocol}
                  phaseRecords={phaseRecords}
                  canBegin={canBeginProtocolRun(protocolRun)}
                  editingItemId={newProtocolItemId}
                  onStart={startProtocol}
                  onRename={(name) =>
                    protocolRun &&
                    updateState((current) => renameProtocolRun(current, protocolRun.id, name))
                  }
                  onSetDays={(days) =>
                    protocolRun &&
                    updateState((current) => setProtocolDays(current, protocolRun.id, days))
                  }
                  onAddItem={addProtocolTerm}
                  onChangeItem={changeProtocolTerm}
                  onFinishItemEdit={finishProtocolTermEdit}
                  onBegin={() =>
                    protocolRun &&
                    updateState((current) =>
                      // The phase is begun and told what it is for in one act,
                      // so a phase started this week is explicitly serving this
                      // week's goal rather than inferring it later.
                      setProtocolGoal(
                        beginProtocolRun(current, protocolRun.id, dateKey),
                        protocolRun.id,
                        logWeekGoal?.id || "",
                      ),
                    )
                  }
                  onToggleItem={(itemId) =>
                    updateState((current) => toggleProtocolItem(current, itemId, dateKey))
                  }
                  onToggleCompletedItem={(runId, itemId, completedDateKey) =>
                    updateState((current) =>
                      toggleProtocolRecordItem(current, runId, itemId, completedDateKey)
                    )
                  }
                  onArchiveRecord={(runId) =>
                    updateState((current) => archiveProtocolRun(current, runId))
                  }
                  onSealToday={completeProtocolToday}
                  onEndRun={() =>
                    protocolRun &&
                    updateState((current) => endProtocolRun(current, protocolRun.id))
                  }
                  onDiscardDraft={() =>
                    protocolRun &&
                    updateState((current) =>
                      discardProtocolDraft(current, protocolRun.id),
                    )
                  }
                  goalText={protocolGoalText}
                />,
                ...(!SHOW_DREAMLINE || dreamlineEditing
                  ? []
                  : [
                      <DreamlineIdlePage
                        daysLeft={dreamlineProgressView?.daysLeft ?? null}
                        key="dreamline-idle"
                        onAddStep={addDreamlineStepToItem}
                        onEdit={() => setEditingDreamline(true)}
                        onReached={markDreamlineReached}
                        onSaveStep={saveDreamlineStep}
                        onStep={tickDreamlineStep}
                        strategy={dreamlineStrategyView}
                      />,
                    ]),
                ...(!SHOW_DREAMLINE || !dreamlineEditing ? [] : [
                <DreamlineSheetPage
                  history={pastDreamlines}
                  income={activeDreamline ? dreamlineIncomeView : null}
                  key={`dreamline-sheet-${activeDreamline?.id || "new"}`}
                  // The sheet is the whole editor now. Steps are written and
                  // ticked on the Page where they are read, so Continue and
                  // Done both mean the same thing: back to the plan.
                  onContinue={closeDreamlineEditor}
                  onDone={closeDreamlineEditor}
                  onSaveLine={saveDreamlineLine}
                  onSaveSetup={saveDreamlineSetup}
                  onStar={starDreamlineLine}
                  onStart={beginDreamline}
                  record={activeDreamline}
                />,
                ]),
              ]}
              idleAppIndex={habitAppIndex}
              onIdleAppIndexChange={changeHabitAppPage}
              rotateIdleApps={false}
              label="Routine chapter"
              run={activeHabitRun}
              onRunChange={saveHabitBuildingRun}
            />
          </section>
        ) : null}

        {logSetupPublication ? (
          <ChapterSplash label="Log setup">
            <PublishedChapterDelivery
              className="os-log-setup-session"
              label="Log setup"
              publication={logSetupPublication}
            />
          </ChapterSplash>
        ) : logPublication ? (
          <section className="os-day os-day-gated" aria-label="Log chapter">
            <PublishedChapterDelivery
              className="os-log-setup-session"
              label="Log chapter"
              publication={logPublication}
            />
          </section>
        ) : !logSetupDone && logSetupChapter && logSetupRun ? (
          <ChapterSplash label="Log setup">
            <ChapterPlayer
              className="os-log-setup-session"
              definition={logSetupChapter}
              label="Log setup"
              run={logSetupRun}
              onRunChange={saveLogSetupRun}
            />
          </ChapterSplash>
        ) : (
        <section className="os-log-section" aria-labelledby="day-heading">
          <SwipeSession
            attentionKey={`today-log:${logAppVersion}`}
            availableIndices={Array.from(
              { length: logAppMaxIndex + 1 },
              (_, index) => index,
            )}
            className="os-log-session"
            index={logAppIndex}
            label="Log apps"
            maxIndex={logAppMaxIndex}
            onIndexChange={saveLogAppIndex}
          >
            <PageLayout
              className="os-log-page"
              footer={
                <CreativeButton
                  className="os-log-add-current"
                  onClick={() => openHour(liveClockHour)}
                  sizing="content"
                  styleId="default"
                  type="button"
                >
                  Add this hour
                </CreativeButton>
              }
              heading={
                <input
                  aria-label="What this day is called"
                  className="os-app-page-heading os-day-name-edit"
                  data-os-app-heading
                  id="day-heading"
                  maxLength={60}
                  onChange={(event) =>
                    updateToday((day) => setDayTitle(day, event.target.value))
                  }
                  placeholder={logTodayName}
                  value={today.title || ""}
                />
              }
              headerLeft={<p className="os-card-label">Log</p>}
              placement="content-flow"
              theme="dark"
            >
              <div className="os-timeline" ref={timelineRef}>
            {liveMarkerTop !== null ? (
              <span
                aria-label="Current time"
                className="os-current-time"
                style={{ top: `${liveMarkerTop}px` }}
              />
            ) : null}
            {logStartHour > CIRCLE_DAY_START_HOUR ? (
              <button
                className="os-expand-hour"
                type="button"
                aria-label={`Add ${hourLabel(logStartHour - 1)} to the log`}
                onClick={() =>
                  updateToday((day) =>
                    setDayLogRange(day, logStartHour - 1, logEndHour),
                  )
                }
              >
                <span aria-hidden="true">+</span>
              </button>
            ) : null}
            {visibleHours.map((hour) => {
              const slotStart = hourLabel(hour);
              const block = today.timeBlocks.find(
                (item) => item.start === slotStart,
              );
              const defaultTitle = defaultTitleForHour(hour);
              const isCurrentHour = hour === liveClockHour;
              const editingMain = isLogOpen && start === slotStart;
              const moments =
                block?.moments?.length
                  ? block.moments
                  : block?.note
                    ? [block.note]
                    : [];

              return (
                <article
                  className={`${
                    block ? "filled" : defaultTitle ? "suggested" : "empty"
                  }${isCurrentHour ? " is-current-hour" : ""}`}
                  data-log-hour={hour}
                  key={hour}
                >
                  <div className="os-time-range">
                    <strong>{slotStart}</strong>
                  </div>
                  {editingMain ? (
                    <form
                      className="os-inline-main-form"
                      onSubmit={saveTimeBlock}
                    >
                      <input
                        type="text"
                        name="mainActivity"
                        value={blockTitle}
                        onChange={(event) => setBlockTitle(event.target.value)}
                        placeholder="Type the main activity"
                        aria-label={`Main activity at ${slotStart}`}
                        maxLength={60}
                        autoFocus
                      />
                      <button type="submit" aria-label="Save main activity">
                        ✓
                      </button>
                      {formError ? (
                        <span className="os-form-error">{formError}</span>
                      ) : null}
                    </form>
                  ) : block ? (
                    <>
                      <div className="os-log-copy">
                        <button
                          className={
                            block.title || block.activity ? "" : "is-empty"
                          }
                          type="button"
                          onClick={() => openEdit(block)}
                        >
                          {block.title || block.activity || "Add main activity"}
                        </button>
                        {moments.length ? (
                          <ul>
                            {moments.map((moment, index) => (
                              <li key={`${block.id}-${index}`}>
                                {editingMomentKey === `${block.id}-${index}` ? (
                                  <form
                                    className="os-edit-moment-form"
                                    onSubmit={(event) =>
                                      saveMoment(event, block, index)
                                    }
                                  >
                                    <input
                                      aria-label={`Edit small moment at ${slotStart}`}
                                      autoFocus
                                      maxLength={100}
                                      name="moment"
                                      value={momentDraft}
                                      onChange={(event) =>
                                        setMomentDraft(event.target.value)
                                      }
                                    />
                                    <button type="submit" aria-label="Save small moment">
                                      ✓
                                    </button>
                                  </form>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      editMoment(block, index, moment)
                                    }
                                  >
                                    {moment}
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <button
                      className="os-empty-hour"
                      type="button"
                      onClick={() => openHour(hour, defaultTitle)}
                    >
                      {defaultTitle || "Add main activity"}
                    </button>
                  )}
                  {!editingMain ? (
                    <button
                      className="os-add-moment"
                      type="button"
                      aria-label={`Add a small moment at ${slotStart}`}
                      onClick={() => {
                        setMomentHour(hour);
                        setNewMoment("");
                      }}
                    >
                      +
                    </button>
                  ) : null}
                  {momentHour === hour ? (
                    <form
                      className="os-inline-moment-form"
                      onSubmit={(event) => addMoment(event, hour)}
                    >
                      <span aria-hidden="true">+</span>
                      <input
                        type="text"
                        value={newMoment}
                        onChange={(event) => setNewMoment(event.target.value)}
                        placeholder="Add a smaller moment"
                        aria-label={`Small moment at ${slotStart}`}
                        maxLength={100}
                        autoFocus
                      />
                      <button type="submit" aria-label="Save small moment">
                        ✓
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
            {logEndHour < CIRCLE_DAY_START_HOUR + 23 ? (
              <button
                className="os-expand-hour"
                type="button"
                aria-label={`Add ${hourLabel(logEndHour + 1)} to the log`}
                onClick={() =>
                  updateToday((day) =>
                    setDayLogRange(day, logStartHour, logEndHour + 1),
                  )
                }
              >
                <span aria-hidden="true">+</span>
              </button>
            ) : null}
              </div>
            </PageLayout>

            <PageLayout
              className="os-log-page os-log-week"
              headerLeft={<p className="os-card-label">Week</p>}
              /* Opening a goal sits where Routine puts New habit: top right,
                 opposite the App Label. Sai: "Add week goal button on top
                 right." */
              headerRight={
                <button
                  className="os-new-habit"
                  onClick={() => addGoalToWeek(logWeekKey)}
                  type="button"
                >
                  Add goal
                </button>
              }
              key="log-week"
              theme="dark"
            >
              {/* The week's goals are the Page.
                *
                * They read as rows that tick, the way Routine's habits do. Sai:
                * "it should be the main screen for the week goals. Just like
                * habit in routine. We can tick there." The days below are where
                * each one is cut into steps. */}
              <div className="os-page-main os-week-goals">
                {chosenWeekGoals.length ? (
                  chosenWeekGoals.map((goal) => (
                    <div className="os-week-goal-head" key={goal.id}>
                      <textarea
                        aria-label="Goal for this week"
                        className={`os-week-goal-text${goal.done ? " is-done" : ""}`}
                        data-inline-editor-id={goal.id}
                        maxLength={240}
                        onBlur={() => finishGoalEdit(goal.id)}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateState((current) => updateGoal(current, goal.id, value));
                          sizeTextAreaToContent(event.currentTarget);
                        }}
                        placeholder="What is this week for?"
                        rows={1}
                        value={goal.text}
                      />
                      <CreativeButton
                        aria-label={`${goal.done ? "Undo" : "Complete"} goal: ${goal.text || "this week"}`}
                        aria-pressed={goal.done}
                        className="os-row-tick os-row-tick-habit os-row-tick-week"
                        disabled={!goal.text.trim()}
                        keepMountedOnSuccess
                        onClick={() => updateState((current) => toggleGoal(current, goal.id))}
                        release="latch"
                        role="habit"
                        styleId="soft-clay"
                        type="button"
                      />
                    </div>
                  ))
                ) : (
                  <p className="os-week-goal-empty">What is this week for?</p>
                )}
              </div>
              <div className="os-page-sub os-week-day-body">
                {/* The day names itself, and writes the same title the Log
                    shows, so naming a day here names it there. */}
                {/* The day and its date are one thing, so they are paired
                    rather than spaced by the body's own rhythm. */}
                <div className="os-week-day-head">
                  <input
                    aria-label={`What ${logChosenDay.name} is called`}
                    className="os-week-day-name"
                    maxLength={60}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateDay(logChosenDay.dateKey, (day) => setDayTitle(day, value));
                    }}
                    placeholder={logChosenDay.name}
                    value={logChosenDay.title}
                  />
                  {/* Which day this is, under whatever he has called it. */}
                  <p className="os-week-date">{logChosenDay.date}</p>
                </div>
                <div className="os-week-strip" role="group" aria-label="Days of this week">
                  {logWeekDays.map((day) => (
                    <button
                      aria-label={day.name}
                      aria-pressed={day.dateKey === logChosenDayKey}
                      className={`os-week-day${day.isToday ? " is-today" : ""}${
                        day.isFuture ? " is-future" : ""
                      }${day.touched ? " is-touched" : ""}`}
                      key={day.dateKey}
                      onClick={() => {
                        setChoosingStepGoal(false);
                        setLogChosenDayKey(day.dateKey);
                      }}
                      type="button"
                    >
                      <span aria-hidden="true">{day.letter}</span>
                    </button>
                  ))}
                </div>
                {/* One box per goal, holding what that goal asks of this day.
                  *
                  * A step is written under the goal it serves, which is how it
                  * gets assigned to one. Sai: "For each day, we can select goal
                  * of the week to assign the step for the day ... with boxes
                  * for each goal." The goal is named here but not ticked —
                  * finishing it belongs to the list above. */}
                {/* What this day asks of the week.
                  *
                  * Only the goals with something on this day are drawn: a box
                  * per goal, always, meant three headings and three buttons on
                  * an empty Tuesday. Sai: "It reads as clutter for each day."
                  * One way to add a step stands at the foot of it, and when
                  * there is more than one goal it asks which — the choice
                  * arrives when it is needed rather than sitting there. */}
                <div className="os-week-day-plan">
                  {chosenWeekGoals
                    .map((goal) => ({
                      goal,
                      steps: goal.steps.filter(
                        (step) => step.dateKey === logChosenDayKey,
                      ),
                    }))
                    .filter((entry) => entry.steps.length)
                    .map(({ goal, steps }) => (
                      <section className="os-week-goal-day" key={goal.id}>
                        <p className="os-week-goal-day-name">
                          {goal.text.trim() || "Unnamed goal"}
                        </p>
                        {steps.map((step) => (
                          <div className="os-week-step" key={step.id}>
                            <textarea
                              aria-label="Smallest step toward this goal"
                              className={`os-week-step-text${step.done ? " is-done" : ""}`}
                              data-inline-editor-id={weekStepEditorId(step.taskId)}
                              maxLength={240}
                              onBlur={() => finishStepEdit(step.id)}
                              onChange={(event) => {
                                const value = event.target.value;
                                updateState((current) =>
                                  updateTask(current, step.taskId, value),
                                );
                                sizeTextAreaToContent(event.currentTarget);
                              }}
                              placeholder="Smallest step you could take now"
                              rows={1}
                              value={step.text}
                            />
                            <CreativeButton
                              aria-label={`${step.done ? "Undo" : "Complete"} step: ${step.text || "this step"}`}
                              aria-pressed={step.done}
                              className="os-row-tick os-row-tick-task os-row-tick-week"
                              disabled={!step.text.trim()}
                              keepMountedOnSuccess
                              onClick={() => finishTask(step.taskId)}
                              release="latch"
                              role="habit"
                              styleId="soft-clay"
                              type="button"
                            />
                          </div>
                        ))}
                      </section>
                    ))}

                  {choosingStepGoal ? (
                    <div
                      aria-label="Which goal is this step for?"
                      className="os-week-goal-picker"
                      role="group"
                    >
                      {chosenWeekGoals.map((goal) => (
                        <button
                          className="os-week-goal-pick"
                          key={goal.id}
                          onClick={() => {
                            setChoosingStepGoal(false);
                            addStepToGoal(goal.id, logChosenDayKey);
                          }}
                          type="button"
                        >
                          {goal.text.trim() || "Unnamed goal"}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {chosenWeekGoals.length ? (
                    <button
                      className="os-week-add-step"
                      onClick={() => {
                        if (chosenWeekGoals.length === 1) {
                          addStepToGoal(chosenWeekGoals[0].id, logChosenDayKey);
                          return;
                        }
                        setChoosingStepGoal((open) => !open);
                      }}
                      type="button"
                    >
                      <span aria-hidden="true">+</span>
                      Add a step for {logChosenDay.title || logChosenDay.name}
                    </button>
                  ) : null}
                </div>

                <div className="os-week-day-summary">
                  {logChosenDay.moments.length ? (
                    <ul className="os-week-day-moments">
                      {logChosenDay.moments.map((moment, index) => (
                        <li key={`${moment.at}-${index}`}>
                          <b>{moment.at}</b>
                          <span>{moment.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="os-week-day-empty">
                      {logChosenDay.isFuture
                        ? "Not yet."
                        : logChosenDay.isToday
                          ? "Nothing written down yet."
                          : "Nothing written down."}
                    </p>
                  )}
                  {logChosenDay.touched ? (
                    <dl className="os-week-day-counts">
                      <div>
                        <dt>Habits</dt>
                        <dd>{logChosenDay.kept} of {logChosenDay.due}</dd>
                      </div>
                      <div>
                        <dt>Tasks</dt>
                        <dd>{logChosenDay.tasks}</dd>
                      </div>
                      <div>
                        <dt>Hours</dt>
                        <dd>{logChosenDay.hours}</dd>
                      </div>
                    </dl>
                  ) : null}
                </div>
              </div>
            </PageLayout>
          </SwipeSession>
        </section>
        )}
      </main>
  );
}
