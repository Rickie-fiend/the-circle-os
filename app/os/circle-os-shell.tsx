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
  ensureDay,
  activeProtocolRun,
  addProtocolItem,
  appSessionIndex,
  beginProtocolRun,
  canBeginProtocolRun,
  completeTask,
  dayRecord,
  discardEmptyProtocolItem,
  endProtocolRun,
  protocolToday,
  renameProtocolRun,
  setProtocolDays,
  startProtocolDraft,
  toggleProtocolItem,
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
  setAppSessionIndex,
  setDayLogRange,
  toggleHabitForDay,
  updateHabitDefinition,
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
import { InfoPage, SwipeSession } from "./app-session";
import { ButtonRewardBackdrop, CreativeButton } from "./button-engine";
import {
  revealButtonStyle,
  type ButtonStyleId,
} from "./button-engine-model.js";
import {
  createLocalDeepThoughtPrompt,
  deepThoughtFollowUp,
  isDeepThoughtRewardEligible,
  type DeepThoughtPrompt,
} from "./deep-thought-model.js";
import { selectThoughtPrompt } from "./thought-prompt-model.js";
import { ChapterPlayer } from "./chapters/chapter-player";
import { ProtocolPage } from "./protocol-page";
import {
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
  selectPendingAppPublication,
} from "./chapters/chapter-publication-store";
import {
  chapterFacts,
  countChaptersStartedOn,
  selectScheduledChapter,
} from "./chapters/chapter-scheduler.js";
import { useChapterPublications } from "./chapters/use-chapter-publications";
import type {
  ChapterDefinition,
  ChapterPublication,
  ChapterRun,
  ChapterSubmission,
} from "./chapters/chapter-types";

export function PublishedChapterDelivery({
  publication,
  className,
  backApp,
  hideIdleHeading = false,
  label,
}: {
  publication: ChapterPublication;
  className: string;
  backApp?: ReactNode;
  hideIdleHeading?: boolean;
  label: string;
}) {
  const { state, updateState } = useCircleState();
  const chapter = publication.chapter;
  const storedRun = state.chapters.runs[chapterRunId(chapter)];
  const run = publicationIsNewerThanRun(publication, storedRun)
    ? createChapterRun(chapter)
    : storedRun || createChapterRun(chapter);

  function saveRun(nextRun: ChapterRun) {
    updateState((current) => {
      const previous = current.chapters.runs[nextRun.runId];
      let next = storeChapterRun(current, nextRun, chapter.session);
      if (nextRun.status === "completed" && previous?.status !== "completed") {
        next = queueProfileUpdate(next, "survey-answer");
      }
      return next;
    });
  }

  function dismiss() {
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
      exitOnFinalCompletion
      hideIdleHeading={hideIdleHeading}
      key={chapterRunId(chapter)}
      label={label}
      onBackAppShown={backApp ? dismiss : undefined}
      onRunChange={saveRun}
      run={run}
    />
  );
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
  note,
  onCommit,
  title,
}: {
  note: string;
  onCommit: (title: string, note: string) => void;
  title: string;
}) {
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const editingRef = useRef(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [noteDraft, setNoteDraft] = useState(note);

  useLayoutEffect(() => {
    if (editingRef.current) return;
    setTitleDraft(title);
    setNoteDraft(note);
  }, [note, title]);

  useLayoutEffect(() => {
    for (const editor of [titleRef.current, noteRef.current]) {
      if (!editor) continue;
      editor.style.height = "auto";
      editor.style.height = `${editor.scrollHeight}px`;
    }
  }, [noteDraft, titleDraft]);

  function commit() {
    editingRef.current = false;
    const nextTitle = titleDraft.trim() || "Keep going.";
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
          maxLength={54}
          onBlur={commit}
          onChange={(event) => setTitleDraft(event.currentTarget.value)}
          onFocus={() => {
            editingRef.current = true;
          }}
          placeholder="Keep going."
          ref={titleRef}
          rows={1}
          value={titleDraft}
        />
      </div>
      <div className="os-info-page-sub">
        <textarea
          aria-label="Edit idle note"
          className="os-inline-checkin-copy"
          maxLength={220}
          onBlur={commit}
          onChange={(event) => setNoteDraft(event.currentTarget.value)}
          onFocus={() => {
            editingRef.current = true;
          }}
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
  checkIns: CheckIn[];
  mission: Mission;
  missions?: ExtraMission[];
  timeBlocks: TimeBlock[];
  logRange?: {
    startHour: number;
    endHour: number;
  } | null;
};

function latestPublishedChapters(chapters: ChapterDefinition[]) {
  return Object.values(
    chapters
    .reduce<Record<string, ChapterDefinition>>((latest, chapter) => {
      if (!latest[chapter.id] || latest[chapter.id].version < chapter.version) {
        latest[chapter.id] = chapter;
      }
      return latest;
    }, {}),
  );
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
        source: "athena" | "local" | "local-personalized" | "follow-up";
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
    definitions: Record<
      string,
      {
        id: string;
        text: string;
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
          if (remote) {
            next = ensureDay(mergeServerState(next, remote), getDateKey());
            lastServerSignature.current = serverSignature(
              normalizeState(remote),
            );
          }
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
    if (!state.profile.vision.completedAt) return;
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
        .then((result) => {
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
        .then((remote) => {
          if (!remote) return;
          setState((latest) => {
            if (serverSignature(latest) !== lastServerSignature.current) {
              syncPending.current = true;
              return latest;
            }
            const next = ensureDay(
              mergeServerState(latest, remote),
              getDateKey(),
            );
            lastServerSignature.current = serverSignature(
              normalizeState(remote),
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
    const next = applySyncResult(connected, result);
    lastServerSignature.current = serverSignature(next);
    stateRef.current = next;
    setState(next);
    await saveCircleState(next);
  }

  async function recoverProfile(profileId: string) {
    const current = stateRef.current;
    const result = await recoverCircleProfile(current.ai.baseUrl, profileId);
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
  const { state, today, ready, dateKey, updateState, updateToday } =
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
    surveyAnswer(surveyAnswers, "checkin-idle-title") || "Keep going.";
  const checkInNote = surveyAnswer(surveyAnswers, "checkin-note");
  const [dateLabel, setDateLabel] = useState("");
  const [greeting, setGreeting] = useState("Hello.");
  const [liveNow, setLiveNow] = useState(() => new Date());
  const [liveMarkerTop, setLiveMarkerTop] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { publications } = useChapterPublications(ready);
  const profileSparkChapters = useMemo(() => {
    const profileId = state.ai.profileId || "local";
    const chapters = publications
      .map(normalizeChapterPublication)
      .filter(
        (publication) =>
          publication.targetApp === "note" &&
          (publication.visibility === "public" ||
            publication.audienceProfileId === profileId ||
            publication.audienceProfileId === "local"),
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map((publication) => publication.chapter);
    return latestPublishedChapters(chapters);
  }, [publications, state.ai.profileId]);
  const [forcedProfileSparkId, setForcedProfileSparkId] = useState("");
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
        app: "note",
        facts: schedulerFacts,
      }),
    [profileSparkChapters, schedulerFacts, scheduledRuns],
  );
  const [manualProfileSparkRunId, setManualProfileSparkRunId] = useState("");
  const [checkInAttention, setCheckInAttention] = useState(0);
  const [checkInRefreshing, setCheckInRefreshing] = useState(false);
  const [checkInIdleEntering, setCheckInIdleEntering] = useState(false);
  const checkInRefreshTimer = useRef<number | null>(null);
  const checkInIdleTimer = useRef<number | null>(null);
  const [checkInApp, setCheckInApp] = useState(0);
  const [thoughtMode, setThoughtMode] = useState<"regular" | "deep">("regular");
  const [regularThoughtDraft, setRegularThoughtDraft] = useState("");
  const [deepThoughtDraft, setDeepThoughtDraft] = useState("");
  const [deepThoughtPrompt, setDeepThoughtPrompt] = useState<DeepThoughtPrompt | null>(null);
  const [deepFollowUpUsed, setDeepFollowUpUsed] = useState(false);
  const [thoughtRewarded, setThoughtRewarded] = useState(false);
  const thoughtDraft = thoughtMode === "deep" ? deepThoughtDraft : regularThoughtDraft;
  // liveNow already ticks every thirty seconds and the prompt is bucketed by the
  // hour, so this changes through the day without moving under the person.
  const thoughtPlaceholder = useMemo(
    () => selectThoughtPrompt(state, dateKey, liveNow),
    [dateKey, liveNow, state],
  );
  const [thoughtSent, setThoughtSent] = useState(false);
  const [thoughtTransition, setThoughtTransition] = useState<
    "idle" | "clicked" | "paused" | "exiting"
  >("idle");
  const [thoughtModeRefreshing, setThoughtModeRefreshing] = useState(false);
  const [thoughtRefreshKey, setThoughtRefreshKey] = useState("");
  const [thoughtLabelVisible, setThoughtLabelVisible] = useState(false);
  const [holdThoughtsAfterSend, setHoldThoughtsAfterSend] = useState(false);
  const [thoughtButtonVisible, setThoughtButtonVisible] = useState(false);
  const [thoughtButtonStyle, setThoughtButtonStyle] =
    useState<ButtonStyleId | null>(null);
  const thoughtButtonQueue = useRef<ButtonStyleId[]>([]);
  const previousThoughtButtonStyle = useRef<ButtonStyleId | null>(null);
  const thoughtSubmissionLocked = useRef(false);
  const thoughtOutcome = useRef({ deep: false, rewarded: false, followUpUsed: false });
  const deepWritingActiveMs = useRef(0);
  const deepWritingFocusStartedAt = useRef<number | null>(null);
  const thoughtTextareaRef = useRef<HTMLTextAreaElement>(null);
  const thoughtLabelTimer = useRef<number | null>(null);
  const thoughtResetTimer = useRef<number | null>(null);
  const thoughtModeTimer = useRef<number | null>(null);
  const [habitMode, setHabitMode] = useState<"habit" | "yesterday">("habit");
  const [habitModeRefreshing, setHabitModeRefreshing] = useState(false);
  const habitModeTimer = useRef<number | null>(null);
  const [newProtocolItemId, setNewProtocolItemId] = useState<string | null>(null);
  const [newHabitId, setNewHabitId] = useState<string | null>(null);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
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
      if (checkInRefreshTimer.current) {
        window.clearTimeout(checkInRefreshTimer.current);
      }
      if (checkInIdleTimer.current) {
        window.clearTimeout(checkInIdleTimer.current);
      }
      if (thoughtResetTimer.current) {
        window.clearTimeout(thoughtResetTimer.current);
      }
      if (thoughtLabelTimer.current) {
        window.clearTimeout(thoughtLabelTimer.current);
      }
      if (thoughtModeTimer.current) {
        window.clearTimeout(thoughtModeTimer.current);
      }
      if (habitModeTimer.current) {
        window.clearTimeout(habitModeTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      ready &&
      (!state.profile.name ||
        !state.profile.age ||
        !state.profile.vision.completedAt)
    ) {
      router.replace("/os/mirror");
    }
  }, [
    ready,
    router,
    state.profile.age,
    state.profile.name,
    state.profile.vision.completedAt,
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

  useEffect(() => {
    if (visibleCheckInApp !== checkInThoughtsApp) return;
    if (thoughtLabelTimer.current) {
      window.clearTimeout(thoughtLabelTimer.current);
    }
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    thoughtLabelTimer.current = window.setTimeout(() => {
      setThoughtLabelVisible(true);
      thoughtLabelTimer.current = null;
    }, reducedMotion ? 0 : 760);
    return () => {
      if (thoughtLabelTimer.current) {
        window.clearTimeout(thoughtLabelTimer.current);
        thoughtLabelTimer.current = null;
      }
    };
  }, [thoughtRefreshKey, visibleCheckInApp]);
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
  const profileSparkChapter =
    profileSparkChapters.find(
      (chapter) => chapter.id === forcedProfileSparkId,
    ) ||
    arrivingSpark ||
    null;
  const profileSparkPublication = useMemo(() => {
    if (!profileSparkChapter) return null;
    return publications
      .map(normalizeChapterPublication)
      .filter(
        (publication) =>
          publication.targetApp === "note" &&
          chapterRunId(publication.chapter) === chapterRunId(profileSparkChapter),
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0] || null;
  }, [profileSparkChapter, publications]);
  const profileSparkRun = useMemo(() => {
    if (!profileSparkChapter) return null;
    if (
      manualProfileSparkRunId.startsWith(
        `${chapterRunId(profileSparkChapter)}:manual:`,
      )
    ) {
      return (
        state.chapters.runs[manualProfileSparkRunId] || {
          ...createChapterRun(profileSparkChapter),
          runId: manualProfileSparkRunId,
        }
      );
    }
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
    manualProfileSparkRunId,
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

  useEffect(() => {
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
        currentCenter + (nextCenter - currentCenter) * liveHourProgress,
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
  }, [liveClockHour, liveHourProgress, logEndHour, logStartHour]);

  const logSetupChapter = getPublishedChapter("log-setup");
  const habitBuildingChapter = getPublishedChapter("habit-building");
  const habitBuildingRun = useMemo(() => {
    if (!habitBuildingChapter) return null;
    return (
      state.chapters.runs[chapterRunId(habitBuildingChapter)] ||
      createChapterRun(habitBuildingChapter)
    );
  }, [habitBuildingChapter, state.chapters.runs]);
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
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  // Habit shows one finished day behind the label, not a week of dots.
  const yesterdayKey = previousDateKey(dateKey);
  const yesterday = dayRecord(state, yesterdayKey);
  const todaySoFar = dayRecord(state, dateKey);

  // Protocol is the second page of this App Box, so the box keeps a saved
  // page index again now that it has more than one page.
  const habitAppVersion = "habit-protocol-v1";
  const habitAppIndex = appSessionIndex(
    state,
    "today-habit",
    habitAppVersion,
  );
  const protocol = protocolToday(state, dateKey);
  const protocolRun = activeProtocolRun(state);

  useEffect(() => {
    const editorId = newHabitId || newTaskId || newProtocolItemId;
    if (!editorId) return;
    const editor = document.querySelector<HTMLTextAreaElement>(
      `[data-inline-editor-id="${editorId}"]`,
    );
    editor?.focus();
  }, [habits.length, newHabitId, newProtocolItemId, newTaskId, oneTimeTasks.length]);
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
  const logSetupDone = logSetupRun
    ? logSetupRun.status === "completed"
    : routineTimesKnown;

  function beginNewHabit() {
    const existing = habits.find((habit) => !habit.text.trim());
    if (existing) {
      setNewHabitId(existing.id);
      return;
    }
    updateState((current) => {
      const added = addHabitDefinition(current);
      setNewHabitId(added.id);
      return added.state;
    });
  }

  function beginNewTask() {
    const existing = oneTimeTasks.find((task) => !task.text.trim());
    if (existing) {
      setNewTaskId(existing.id);
      return;
    }
    updateState((current) => {
      const added = addTask(current);
      setNewTaskId(added.id);
      return added.state;
    });
  }

  function changeHabit(id: string, text: string) {
    updateState((current) => updateHabitDefinition(current, id, text));
  }

  function finishHabitEdit(id: string) {
    updateState((current) => discardEmptyHabit(current, id));
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
    // begins to fade, and the fade itself is unhurried for the same reason.
    const fade = window.setTimeout(() => {
      setFadingMissionIds((ids) => [...new Set([...ids, id])]);
    }, 5_000);
    const remove = window.setTimeout(() => {
      setLeavingMissionIds((ids) => ids.filter((missionId) => missionId !== id));
      setFadingMissionIds((ids) => ids.filter((missionId) => missionId !== id));
      delete taskExitTimers.current[id];
    }, 9_000);
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
    updateState((current) => {
      const added = addProtocolItem(current, protocolRun.id, kind);
      if (added.id) setNewProtocolItemId(added.id);
      return added.state;
    });
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

  function toggleHabitMode() {
    if (habitModeRefreshing) return;
    const nextMode = habitMode === "yesterday" ? "habit" : "yesterday";
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setHabitModeRefreshing(true);
    if (habitModeTimer.current) window.clearTimeout(habitModeTimer.current);
    habitModeTimer.current = window.setTimeout(() => {
      setHabitMode(nextMode);
      setHabitModeRefreshing(false);
      habitModeTimer.current = null;
    }, reducedMotion ? 40 : 620);
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
      setCheckInIdleEntering(true);
      if (checkInIdleTimer.current) window.clearTimeout(checkInIdleTimer.current);
      checkInIdleTimer.current = window.setTimeout(() => {
        setCheckInIdleEntering(false);
        checkInIdleTimer.current = null;
      }, 1100);
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
      }
      return next;
    });
  }

  function deferProfileSparkRun() {
    if (!profileSparkRun) return;
    updateState((current) =>
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
    );
  }

  function refreshProfileSpark() {
    const refreshedAt = new Date().toISOString();
    if (profileSparkRun?.status === "in-progress") {
      updateState((current) =>
        storeChapterRun(
          current,
          {
            ...profileSparkRun,
            deferCount: (profileSparkRun.deferCount || 0) + 1,
            deferredAt: refreshedAt,
            updatedAt: refreshedAt,
          },
          "check-in",
        ),
      );
    }
    const chapter = scheduledSpark;
    if (!chapter) return false;
    const selectedRun = state.chapters.runs[chapterRunId(chapter)];
    if (selectedRun?.deferredAt) {
      updateState((current) =>
        storeChapterRun(
          current,
          {
            ...selectedRun,
            deferredAt: null,
            updatedAt: refreshedAt,
          },
          "check-in",
        ),
      );
    }
    setManualProfileSparkRunId("");
    setForcedProfileSparkId(chapter.id);
    setCheckInAttention((current) => current + 1);
    return true;
  }

  function revealProfileSpark() {
    if (checkInRefreshing) return;
    setCheckInRefreshing(true);
    checkInRefreshTimer.current = window.setTimeout(() => {
      const loaded = refreshProfileSpark();
      setCheckInRefreshing(false);
      if (!loaded) {
        setCheckInIdleEntering(true);
        if (checkInIdleTimer.current) window.clearTimeout(checkInIdleTimer.current);
        checkInIdleTimer.current = window.setTimeout(() => {
          setCheckInIdleEntering(false);
          checkInIdleTimer.current = null;
        }, 1100);
      }
      checkInRefreshTimer.current = null;
    }, 900);
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
        const identity =
          chapterAnswerText(nextRun, "habit-identity") || "Yourself";
        const added = addHabitDefinition(next);
        next = updateHabitDefinition(added.state, added.id, missionText);
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
      // eslint-disable-next-line react-hooks/purity
      deepWritingActiveMs.current += Date.now() - deepWritingFocusStartedAt.current;
      deepWritingFocusStartedAt.current = null;
    }
  }

  function resetDeepWritingClock() {
    deepWritingActiveMs.current = 0;
    deepWritingFocusStartedAt.current = null;
  }

  function openDeepThoughts() {
    if (thoughtModeRefreshing || thoughtTransition !== "idle") return;
    const nextMode = thoughtMode === "deep" ? "regular" : "deep";
    const answers = state.profile.profileCase.survey.answers;
    const athenaPrompt = state.profile.profileCase.deepThoughtPrompt;
    const athenaAnswered = Boolean(
      athenaPrompt && answers.some((answer) => answer.questionId === athenaPrompt.id),
    );
    const deepAnswersToday = answers.filter(
      (answer) => answer.kind === "deep-thought" && getDateKey(new Date(answer.answeredAt)) === dateKey,
    ).length;
    const prompt = athenaPrompt?.dateKey === dateKey && !athenaAnswered
      ? athenaPrompt
      : createLocalDeepThoughtPrompt(state, dateKey, deepAnswersToday);
    pauseDeepWriting();
    concealThoughtButton();
    setThoughtModeRefreshing(true);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (thoughtModeTimer.current) window.clearTimeout(thoughtModeTimer.current);
    thoughtModeTimer.current = window.setTimeout(() => {
      if (nextMode === "deep") {
        setDeepThoughtPrompt(prompt);
        setDeepFollowUpUsed(false);
        resetDeepWritingClock();
      } else {
        setDeepThoughtPrompt(null);
        setDeepFollowUpUsed(false);
      }
      setThoughtMode(nextMode);
      setThoughtLabelVisible(reducedMotion);
      setThoughtRefreshKey(`thought-mode:${nextMode}:${Date.now()}`);
      setThoughtModeRefreshing(false);
      thoughtModeTimer.current = null;
    }, reducedMotion ? 40 : 900);
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
        },
        thought,
        deep ? "deep-thought" : "thought",
      ),
    );
    thoughtOutcome.current = { deep, rewarded, followUpUsed: deepFollowUpUsed };
    setThoughtRewarded(rewarded);
    setThoughtSent(true);
    setThoughtTransition("clicked");
  }

  function revealThoughtButton() {
    if (thoughtButtonVisible || thoughtSent) return;
    const next = revealButtonStyle(
      thoughtButtonStyle,
      thoughtButtonQueue.current,
      previousThoughtButtonStyle.current,
    );
    thoughtButtonQueue.current = next.queue;
    setThoughtButtonStyle(next.styleId);
    setThoughtButtonVisible(true);
  }

  function concealThoughtButton() {
    if (thoughtSent) return;
    pauseDeepWriting();
    setThoughtButtonVisible(false);
    thoughtTextareaRef.current?.blur();
  }

  function beginThoughtRefreshTransition() {
    if (thoughtTransition !== "clicked") return;
    setThoughtTransition("paused");
    if (thoughtResetTimer.current) {
      window.clearTimeout(thoughtResetTimer.current);
    }
    thoughtResetTimer.current = window.setTimeout(() => {
      setThoughtTransition("exiting");
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      thoughtResetTimer.current = window.setTimeout(() => {
        const outcome = thoughtOutcome.current;
        previousThoughtButtonStyle.current = thoughtButtonStyle;
        setThoughtButtonVisible(false);
        setThoughtButtonStyle(null);
        if (outcome.deep) {
          setDeepThoughtDraft("");
          resetDeepWritingClock();
          if (!outcome.rewarded && !outcome.followUpUsed && deepThoughtPrompt) {
            setDeepThoughtPrompt(deepThoughtFollowUp(deepThoughtPrompt));
            setDeepFollowUpUsed(true);
          } else {
            setThoughtMode("regular");
            setDeepThoughtPrompt(null);
            setDeepFollowUpUsed(false);
          }
        } else {
          setRegularThoughtDraft("");
        }
        setThoughtSent(false);
        setThoughtRewarded(false);
        setThoughtLabelVisible(reducedMotion);
        setHoldThoughtsAfterSend(true);
        setThoughtTransition("idle");
        thoughtSubmissionLocked.current = false;
        thoughtTextareaRef.current?.blur();
        thoughtTextareaRef.current?.style.removeProperty("height");
        if (!reducedMotion) {
          setThoughtRefreshKey(`thought-refresh:${Date.now()}`);
        }
        thoughtResetTimer.current = null;
      }, reducedMotion ? 40 : 900);
    }, 240);
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
            aria-label="Load a private Note chapter"
            className="os-card-label os-checkin-refresh-label"
            type="button"
            onClick={revealProfileSpark}
          >
            Note
          </button>
        }
      >
        <InlineCheckInEditor
          note={checkInNote}
          onCommit={commitCheckInNote}
          title={checkInIdleTitle}
        />
      </InfoPage>
    );
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
          input.style.height = "auto";
          input.style.height = `${input.scrollHeight}px`;
          if (deepThoughtsActive && value.trim() && deepWritingFocusStartedAt.current === null) {
            deepWritingFocusStartedAt.current = Date.now();
          }
        }}
        onFocus={(event) => {
          revealThoughtButton();
          event.currentTarget.style.height = "auto";
          event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
          if (deepThoughtsActive && thoughtDraft.trim() && deepWritingFocusStartedAt.current === null) {
            deepWritingFocusStartedAt.current = Date.now();
          }
        }}
        placeholder={deepThoughtsActive ? "Write what comes up..." : thoughtPlaceholder}
        ref={thoughtTextareaRef}
        rows={deepThoughtsActive ? 2 : 1}
        value={thoughtDraft}
      />
    );

    return (
      <InfoPage
        className={`os-thoughts-page os-survey-card${thoughtMode === "deep" ? " deep-mode" : ""}`}
        header={<button aria-pressed={thoughtMode === "deep"} className={`os-card-label os-thoughts-mode-toggle${thoughtLabelVisible ? " is-visible" : " is-waiting"}`} type="button" onClick={openDeepThoughts}>{thoughtMode === "deep" ? "Deep Thoughts" : "Thoughts"}</button>}
        footer={
          <div className="os-creative-button-slot">
            {thoughtButtonVisible ? (
              <CreativeButton
                disabled={!thoughtDraft.trim() || thoughtSent}
                form="check-in-thought-form"
                keepMountedOnSuccess
                onSuccessComplete={beginThoughtRefreshTransition}
                styleId={thoughtButtonStyle || "fallback"}
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
        <ButtonRewardBackdrop active={thoughtSent && thoughtRewarded} styleId={thoughtButtonStyle || "default"} />
        <form
          className={`os-thoughts-form${deepThoughtsActive ? " deep-compose" : ""}`}
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
              attentionKey={`check-in:${profileSparkChapter.id}:${profileSparkChapter.version}:${checkInAttention}`}
              className="os-checkin-session"
              definition={profileSparkChapter}
              key={profileSparkRun.runId}
              label="Check-in chapter"
              run={profileSparkRun}
              backApp={checkInIdleCard()}
              onBackAppShown={deferProfileSparkRun}
              onRunChange={saveProfileSparkRun}
            />
          ) : thoughtsPublication ? (
            <PublishedChapterDelivery
              backApp={checkInThoughtsCard()}
              className="os-checkin-session"
              label="Thoughts chapter"
              publication={thoughtsPublication}
            />
          ) : (
          <SwipeSession
            availableIndices={thoughtSent ? [checkInThoughtsApp] : [checkInIdleApp, checkInThoughtsApp]}
            attentionIndex={checkInThoughtsApp}
            attentionKey={thoughtRefreshKey || undefined}
            className={`os-checkin-session${
              checkInRefreshing ? " update-exit" : ""
            }${
              checkInIdleEntering ? " idle-arrival" : ""
            }${
              thoughtTransition === "exiting" ? " update-exit" : ""
            }${
              thoughtModeRefreshing ? " update-exit" : ""
            }`}
            index={visibleCheckInApp}
            label="Check-in session"
            maxIndex={checkInThoughtsApp}
            onIndexChange={(nextIndex) => {
              setThoughtLabelVisible(false);
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
            {checkInIdleCard()}
            {checkInThoughtsCard()}
          </SwipeSession>
          )}
        </section>

        {habitPublication ? (
          <section className="os-habit" aria-label="Habit session">
            <PublishedChapterDelivery
              className="os-habit-session"
              hideIdleHeading
              label="Habit chapter"
              publication={habitPublication}
            />
          </section>
        ) : activeHabitChapter && activeHabitRun ? (
          <section className="os-habit" aria-label="Habit session">
            <ChapterPlayer
              className={`os-habit-session${habitModeRefreshing ? " mode-refreshing" : ""}`}
              definition={activeHabitChapter}
              key={activeHabitChapter.id}
              idleLabel={
                <button
                  aria-pressed={habitMode === "yesterday"}
                  className="os-card-label os-habit-mode-toggle"
                  onClick={toggleHabitMode}
                  type="button"
                >
                  {habitMode === "yesterday" ? "Record" : "Habit"}
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
                <section className="os-habit-body-session" aria-label="Habits">
                  <div className="os-repeated-habits">
                    {habits.map((habit) => {
                      const completed = Boolean(habitCompletion(habit.id)?.completed);
                      return (
                        <article
                          className={`os-extra-mission os-repeated-habit${completed ? " completed" : ""}`}
                          key={habit.id}
                        >
                          <textarea
                            aria-label={`Edit habit: ${habit.text || "New Habit"}`}
                            autoFocus={newHabitId === habit.id}
                            data-inline-editor-id={habit.id}
                            className={`os-extra-mission-copy os-mission-text-edit${completed ? " completed" : ""}`}
                            maxLength={240}
                            onBlur={() => finishHabitEdit(habit.id)}
                            onChange={(event) => changeHabit(habit.id, event.target.value)}
                            placeholder="New Habit"
                            rows={1}
                            value={habit.text}
                          />
                          <CreativeButton
                            aria-label={`${completed ? "Undo" : "Mark done"}: ${habit.text || "New Habit"}`}
                            aria-pressed={completed}
                            className="os-row-tick os-row-tick-habit"
                            disabled={!habit.text.trim()}
                            keepMountedOnSuccess
                            onClick={() => toggleHabit(habit.id)}
                            role="habit"
                            styleId="soft-clay"
                            type="button"
                          />
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
              idleContent={habitMode === "yesterday" ? undefined : (
                <section className="os-task-body-session" aria-labelledby="task-session-title">
                  <p className="os-task-session-label" id="task-session-title">Tasks</p>
                  <div className="os-one-time-tasks">
                    {oneTimeTasks.map((task) => (
                      <article
                        className={`os-extra-mission os-task-row${task.status === "completed" ? " completed" : ""}${fadingMissionIds.includes(task.id) ? " leaving" : ""}`}
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
                          className="os-row-tick os-row-tick-task"
                          disabled={!task.text.trim()}
                          keepMountedOnSuccess
                          onClick={() => finishTask(task.id)}
                          role="habit"
                          styleId="soft-clay"
                          type="button"
                        />
                      </article>
                    ))}
                  </div>
                </section>
              )}
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
                <ProtocolPage
                  key="protocol"
                  protocol={protocol}
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
                    updateState((current) => beginProtocolRun(current, protocolRun.id, dateKey))
                  }
                  onToggleItem={(itemId) =>
                    updateState((current) => toggleProtocolItem(current, itemId, dateKey))
                  }
                  onEndRun={() =>
                    protocolRun &&
                    updateState((current) => endProtocolRun(current, protocolRun.id))
                  }
                />,
              ]}
              idleAppIndex={habitAppIndex}
              onIdleAppIndexChange={saveHabitAppIndex}
              label="Habit chapter"
              run={activeHabitRun}
              onRunChange={saveHabitBuildingRun}
            />
          </section>
        ) : null}

        {logPublication ? (
          <section className="os-day os-day-gated" aria-label="Log chapter">
            <PublishedChapterDelivery
              className="os-log-setup-session"
              label="Log chapter"
              publication={logPublication}
            />
          </section>
        ) : !logSetupDone && logSetupChapter && logSetupRun ? (
          <section
            className="os-day os-day-gated"
            aria-label="Log setup session"
          >
            <div className="os-log-gate">
              <ChapterPlayer
                className="os-log-setup-session"
                definition={logSetupChapter}
                label="Log setup"
                run={logSetupRun}
                onRunChange={saveLogSetupRun}
              />
            </div>
          </section>
        ) : (
        <section className="os-day" aria-labelledby="day-heading">
          <div className="os-section-heading">
            <div>
              <p className="os-card-label">Log</p>
              <h2 id="day-heading">Your day, hour by hour</h2>
            </div>
          </div>

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

        </section>
        )}
      </main>
  );
}
