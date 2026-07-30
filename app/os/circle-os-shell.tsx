"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CIRCLE_DAY_START_HOUR,
  PROFILE_QUESTIONS,
  appSessionIndex,
  answerProfileQuestion,
  answerSurveyQuestion,
  connectLocalAi,
  createEmptyState,
  ensureDay,
  getDateKey,
  mergeServerState,
  minutesBetween,
  normalizeState,
  queueProfileUpdate,
  setAppSessionIndex,
  setDayLogRange,
  upsertTimeBlock,
} from "./circle-os-model.js";
import {
  buildServerPayload,
  readCircleState,
  recoverCircleProfile,
  syncCircleState,
} from "./circle-os-ai";
import { loadCircleState, saveCircleState } from "./circle-os-store";
import { SessionIntro, SwipeSession } from "./app-session";
import { ChapterPlayer } from "./chapters/chapter-player";
import {
  chapterRunId,
  chapterAnswerText,
  createChapterRun,
  renderChapterTemplate,
  selectHourlyChapter,
  storeChapterRun,
} from "./chapters/chapter-model.js";
import {
  getPublishedChapter,
  publishedChapters,
} from "./chapters/registry";
import type {
  ChapterDefinition,
  ChapterRun,
  ChapterSubmission,
} from "./chapters/chapter-types";

type CheckIn = {
  period: string;
  energy: number | null;
  mood: string | null;
  createdAt: string;
};

type Mission = {
  text: string;
  why: string;
  identity: string;
  completed: boolean;
  completedAt: string | null;
};

type ExtraMission = {
  id: string;
  text: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  kind?: "habit" | "task";
};

export type TimeBlock = {
  id: string;
  start: string;
  end: string;
  activity: string;
  note: string;
  title?: string;
  moments?: string[];
  createdAt: string;
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

const PROFILE_SPARK_CHAPTERS = publishedChapters.filter((chapter) =>
  chapter.id.startsWith("profile-spark-"),
);
const PROFILE_SPARK_OPENED_AT = Date.now();

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
  outbox: Array<{
    id: string;
    reason: string;
    message?: string;
    createdAt: string;
    triedAt?: string;
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
const RECORD_REASONS = new Set(["day-log", "mission"]);

type SurveyQuestion = {
  id: string;
  text: string;
  type: string;
  options?: string[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
  defaultValue?: string;
  target: string;
};

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
  },
) {
  const next = ensureDay(
    mergeServerState(current, result.state),
    getDateKey(),
  );
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
      lastSyncSlot:
        current.outbox.some((item) => RECORD_REASONS.has(item.reason)) &&
        isAthenaSyncTime()
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
    const urgent = state.outbox.some((item) =>
      [
        "first-vision",
        "question-answered",
        "survey-answer",
        "habit-answer",
        "chapter-progress",
        "profile-edit",
        "suggestion",
      ].includes(item.reason),
    );
    const needsFirstProfile = !state.ai.profileId || !state.ai.token;
    const scheduledSyncDue =
      state.outbox.some((item) => RECORD_REASONS.has(item.reason)) &&
      isAthenaSyncTime();
    if (!needsFirstProfile && !urgent && !scheduledSyncDue) return;
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
              return current;
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

export function OSFrame({
  children,
}: {
  children: ReactNode;
}) {
  const { state, ready } = useCircleState();
  const pathname = usePathname();
  const active = pathname.startsWith("/os/mirror")
    ? "mirror"
    : pathname.startsWith("/os/connect")
      ? "connect"
      : "today";
  return (
    <div className="circle-os">
      <div className="os-future-room-background" aria-hidden="true" />
      <div className="os-app-shell">
        <header className="os-header">
          <Link className="os-wordmark" href="/" aria-label="The Circle website">
            <span className="os-brand-mark" aria-hidden="true" />
            <span>CIRCLE OS</span>
          </Link>
          <span className="os-local-status">
            {state.ai.profileId && state.outbox.length === 0
              ? "Saved · Obsidian"
              : "Saving…"}
          </span>
        </header>
        <nav className="os-nav" aria-label="Circle OS" data-active={active}>
          <Link className={active === "today" ? "active" : ""} href="/os">
            Today
          </Link>
          <Link className={active === "mirror" ? "active" : ""} href="/os/mirror">
            Vision
          </Link>
        </nav>
        <div
          aria-busy={!ready}
          className={`os-route-stage ${ready ? "is-ready" : "is-opening"}`}
        >
          <div
            aria-hidden={!ready}
            className="os-route-content"
            key={pathname}
          >
            {children}
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

function SurveySlide({
  label,
  question,
  current,
  total,
  existingAnswer = "",
  onAnswer,
}: {
  label: string;
  question: SurveyQuestion;
  current: number;
  total: number;
  existingAnswer?: string;
  onAnswer: (answer: string) => void;
}) {
  const sliderStart = Math.ceil(
    ((question.min ?? 1) + (question.max ?? 5)) / 2,
  );
  const [value, setValue] = useState(
    existingAnswer ||
      question.defaultValue ||
      (question.type === "slider" ? String(sliderStart) : ""),
  );

  const choices =
    question.type === "yesno" ? ["Yes", "No"] : question.options ?? [];

  return (
    <div className="os-survey-card">
      <div className="os-survey-head">
        <p className="os-card-label">{label}</p>
        <span aria-label={`Question ${current} of ${total}`}>
          {current}/{total}
        </span>
      </div>
      <h2>{question.text}</h2>

      {choices.length ? (
        <div
          className={`os-survey-choices${
            choices.length > 2 ? " many" : ""
          }`}
          role="group"
          aria-label={question.text}
        >
          {choices.map((choice) => (
            <button
              aria-pressed={existingAnswer === choice}
              className={existingAnswer === choice ? "selected" : ""}
              type="button"
              key={choice}
              onClick={() => onAnswer(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : null}

      {question.type === "slider" ? (
        <form
          className="os-survey-slider"
          onSubmit={(event) => {
            event.preventDefault();
            onAnswer(value);
          }}
        >
          <output>{value}</output>
          <input
            aria-label={question.text}
            type="range"
            min={question.min ?? 1}
            max={question.max ?? 5}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <div aria-hidden="true">
            <span>{question.minLabel}</span>
            <span>{question.maxLabel}</span>
          </div>
          <button type="submit">Continue</button>
        </form>
      ) : null}

      {question.type === "text" ? (
        <form
          className="os-survey-text"
          onSubmit={(event) => {
            event.preventDefault();
            if (!value.trim()) return;
            onAnswer(value);
          }}
        >
          <input
            aria-label={question.text}
            maxLength={180}
            placeholder={question.placeholder}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <button type="submit" disabled={!value.trim()}>
            Continue
          </button>
        </form>
      ) : null}

      {question.type === "time" ? (
        <form
          className="os-survey-time"
          onSubmit={(event) => {
            event.preventDefault();
            if (!value) return;
            onAnswer(value);
          }}
        >
          <input
            aria-label={question.text}
            type="time"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <button type="submit">Continue</button>
        </form>
      ) : null}
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
  const [profileSparkClock, setProfileSparkClock] = useState(
    PROFILE_SPARK_OPENED_AT,
  );
  const [checkInApp, setCheckInApp] = useState(0);
  const [seenCheckInJourney, setSeenCheckInJourney] = useState("");
  const [editingCheckInNote, setEditingCheckInNote] = useState(false);
  const [checkInTitleDraft, setCheckInTitleDraft] = useState("");
  const [checkInNoteDraft, setCheckInNoteDraft] = useState("");
  const [addingHabit, setAddingHabit] = useState(false);
  const [leavingMissionIds, setLeavingMissionIds] = useState<string[]>([]);
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
    const timer = window.setInterval(
      () => setProfileSparkClock(Date.now()),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setLiveNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const firstProfileQuestionIndex = PROFILE_QUESTIONS.findIndex(
    (question) =>
      !surveyAnswers.some((answer) => answer.questionId === question.id),
  );
  const codexQuestion = state.profile.profileCase.survey.nextQuestion;
  const unansweredCodexQuestion =
    codexQuestion &&
    !surveyAnswers.some((answer) => answer.questionId === codexQuestion.id)
      ? ({
          ...codexQuestion,
          type: "text",
          placeholder: "One honest answer is enough",
        } as SurveyQuestion)
      : null;
  const checkInCompletionApp = 12;
  const checkInIdleApp = 13;
  const checkInStartApp = unansweredCodexQuestion
    ? 11
    : firstProfileQuestionIndex >= 0
      ? firstProfileQuestionIndex + 1
      : 11;
  const checkInJourneyVersion = unansweredCodexQuestion
    ? `question-${unansweredCodexQuestion.id}`
    : "profile-foundation-v1";
  const checkInSurveyComplete =
    firstProfileQuestionIndex < 0 && !unansweredCodexQuestion;
  const savedCheckInApp = appSessionIndex(
    state,
    "today-checkin",
    checkInJourneyVersion,
    0,
  );
  const checkInConfirmed =
    checkInSurveyComplete && savedCheckInApp === checkInIdleApp;
  const visibleCheckInApp = checkInConfirmed
    ? checkInIdleApp
    : checkInSurveyComplete
      ? checkInApp || checkInCompletionApp
    : seenCheckInJourney === checkInJourneyVersion
      ? checkInApp
      : 0;
  const profileSparkChapter = selectHourlyChapter(
    PROFILE_SPARK_CHAPTERS,
    state.chapters.runs,
    profileSparkClock,
  );
  const profileSparkRun = useMemo(() => {
    if (!profileSparkChapter) return null;
    return (
      state.chapters.runs[chapterRunId(profileSparkChapter)] ||
      createChapterRun(profileSparkChapter)
    );
  }, [profileSparkChapter, state.chapters.runs]);
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
  const repeatHabitChapter = useMemo<ChapterDefinition | null>(() => {
    if (!habitBuildingChapter) return null;
    const reusablePageIds = new Set([
      "habit",
      "time-place",
      "identity",
      "complete",
      "idle",
    ]);
    return {
      ...habitBuildingChapter,
      id: "habit-repeat",
      pages: habitBuildingChapter.pages.filter((page) =>
        reusablePageIds.has(page.id),
      ),
    };
  }, [habitBuildingChapter]);
  const habitBuildingRun = useMemo(() => {
    if (!habitBuildingChapter) return null;
    return (
      state.chapters.runs[chapterRunId(habitBuildingChapter)] ||
      createChapterRun(habitBuildingChapter)
    );
  }, [habitBuildingChapter, state.chapters.runs]);
  const repeatHabitRun = useMemo(() => {
    if (!repeatHabitChapter) return null;
    return (
      state.chapters.runs[chapterRunId(repeatHabitChapter)] ||
      createChapterRun(repeatHabitChapter)
    );
  }, [repeatHabitChapter, state.chapters.runs]);
  const activeHabitChapter = addingHabit
    ? repeatHabitChapter || habitBuildingChapter
    : habitBuildingChapter;
  const activeHabitRun = addingHabit ? repeatHabitRun : habitBuildingRun;
  const habitAppVersion = "habit-record-v1";
  const habitAppIndex = appSessionIndex(
    state,
    "today-habit",
    habitAppVersion,
    0,
  );
  const extraHabits = (today.missions || []).filter(
    (mission) => mission.kind === "habit",
  );
  const oneTimeTasks = (today.missions || []).filter(
    (mission) =>
      mission.kind !== "habit" &&
      (!mission.completed || leavingMissionIds.includes(mission.id)),
  );
  const completedTaskRecords = (today.missions || []).filter(
    (mission) => mission.completed,
  );
  const completedHabitCount =
    (today.mission.completed ? 1 : 0) + completedTaskRecords.length;
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

  function toggleMission() {
    updateToday((day) => ({
      ...day,
      mission: {
        ...day.mission,
        completed: !day.mission.completed,
        completedAt: day.mission.completed ? null : new Date().toISOString(),
      },
    }), "mission");
  }

  function addExtraMission() {
    const timestamp = new Date().toISOString();
    updateToday(
      (day) => ({
        ...day,
        missions: [
          ...(day.missions || []),
          {
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `mission-${Date.now()}`,
            text: "New mission",
            completed: false,
            completedAt: null,
            createdAt: timestamp,
          },
        ],
      }),
      "mission",
    );
  }

  function changePrimaryMission(text: string) {
    updateToday(
      (day) => ({
        ...day,
        mission: {
          ...day.mission,
          text,
        },
      }),
      "mission",
    );
  }

  function changeExtraMission(id: string, text: string) {
    updateToday(
      (day) => ({
        ...day,
        missions: (day.missions || []).map((mission) =>
          mission.id === id ? { ...mission, text } : mission,
        ),
      }),
      "mission",
    );
  }

  function removeExtraMissionIfEmpty(id: string, value: string) {
    const text = value.trim();
    if (!text) {
      updateToday(
        (day) => ({
          ...day,
          missions: (day.missions || []).filter((mission) => mission.id !== id),
        }),
        "mission",
      );
    }
  }

  function toggleExtraMission(id: string) {
    const mission = today.missions?.find((item) => item.id === id);
    const isCompleting = !mission?.completed;
    updateToday(
      (day) => ({
        ...day,
        missions: (day.missions || []).map((mission) =>
          mission.id === id
            ? {
                ...mission,
                completed: !mission.completed,
                completedAt: mission.completed
                  ? null
                  : new Date().toISOString(),
              }
            : mission,
        ),
      }),
      "mission",
    );
    if (isCompleting && mission?.kind !== "habit") {
      setLeavingMissionIds((ids) => [...new Set([...ids, id])]);
      window.setTimeout(() => {
        setLeavingMissionIds((ids) => ids.filter((missionId) => missionId !== id));
      }, 620);
    }
  }

  function beginNewHabit() {
    if (!repeatHabitChapter) return;
    setAddingHabit(true);
    updateState((current) =>
      storeChapterRun(
        current,
        createChapterRun(repeatHabitChapter),
        repeatHabitChapter.session,
      ),
    );
  }

  function saveHabitAppIndex(index: number) {
    updateState((current) =>
      setAppSessionIndex(current, "today-habit", habitAppVersion, index),
    );
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
          new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
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
          return { ...item, note: "", moments };
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

  function answerCheckIn(
    question: SurveyQuestion,
    answer: string,
    appIndex: number,
  ) {
    if (question.id === unansweredCodexQuestion?.id) {
      setSeenCheckInJourney("profile-foundation-v1");
    }
    updateState((current) =>
      question.id === unansweredCodexQuestion?.id
        ? answerProfileQuestion(current, answer)
        : answerSurveyQuestion(current, question, answer, "profile"),
    );
    setCheckInApp(
      appIndex >= PROFILE_QUESTIONS.length
        ? checkInCompletionApp
        : appIndex + 1,
    );
  }

  function confirmCheckInChapter() {
    updateState((current) =>
      setAppSessionIndex(
        current,
        "today-checkin",
        checkInJourneyVersion,
        checkInIdleApp,
      ),
    );
    setCheckInApp(checkInIdleApp);
  }

  function saveProfileSparkRun(nextRun: ChapterRun) {
    if (!profileSparkChapter) return;
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

  function saveHabitBuildingRun(nextRun: ChapterRun) {
    if (!habitBuildingChapter) return;
    const isNewHabit = addingHabit;
    if (isNewHabit && nextRun.status === "completed") {
      setAddingHabit(false);
    }
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
        next = ensureDay(next, dateKey);
        next = {
          ...next,
          days: {
            ...next.days,
            [dateKey]: isNewHabit
              ? {
                  ...next.days[dateKey],
                  missions: [
                    ...(next.days[dateKey].missions || []),
                    {
                      id:
                        typeof crypto !== "undefined" && "randomUUID" in crypto
                          ? crypto.randomUUID()
                          : `habit-${Date.now()}`,
                      text: missionText,
                      kind: "habit",
                      completed: false,
                      completedAt: null,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : {
                  ...next.days[dateKey],
                  mission: {
                    text: missionText,
                    why: "",
                    identity,
                    completed: false,
                    completedAt: null,
                  },
                },
          },
        };
        next = queueProfileUpdate(next, "habit-answer");
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

  function saveCheckInNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateState((current) => {
      const withTitle = answerSurveyQuestion(
        current,
        {
          id: "checkin-idle-title",
          text: "Check-in idle title",
          type: "text",
          target: "currentLife",
        },
        checkInTitleDraft.trim() || "Keep going.",
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
        checkInNoteDraft,
        "note",
      );
    });
    setEditingCheckInNote(false);
  }

  function defaultTitleForHour(hour: number) {
    if (hour === wakeHour) return "Wake up";
    if (hour === sleepHour) return "Sleep";
    return "";
  }

  function checkInIdleCard() {
    return (
      <div className="os-survey-card os-survey-complete">
        <div className="os-survey-head">
          <p className="os-card-label">Check-in</p>
        </div>
        {editingCheckInNote ? (
          <form className="os-idle-note-form" onSubmit={saveCheckInNote}>
            <div className="os-idle-note-fields">
              <input
                aria-label="Edit idle title"
                autoFocus
                maxLength={54}
                placeholder="Keep going."
                value={checkInTitleDraft}
                onChange={(event) => setCheckInTitleDraft(event.target.value)}
              />
              <textarea
                aria-label="Edit idle note"
                maxLength={220}
                placeholder="Notice what feels like you today."
                rows={3}
                value={checkInNoteDraft}
                onChange={(event) => setCheckInNoteDraft(event.target.value)}
              />
            </div>
            <button type="submit" aria-label="Save note">âœ“</button>
          </form>
        ) : (
          <button
            aria-label="Edit check-in note"
            className="os-idle-note-display"
            type="button"
            onClick={() => {
              setCheckInTitleDraft(checkInIdleTitle);
              setCheckInNoteDraft(checkInNote);
              setEditingCheckInNote(true);
            }}
          >
            <h2>{checkInIdleTitle}</h2>
            <p>{checkInNote || "Notice what feels like you today."}</p>
          </button>
        )}
      </div>
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
            <p className="os-save-state" aria-live="polite">
              {ready ? "Saved" : "Opening your day…"}
            </p>
          </div>

          {checkInConfirmed && profileSparkChapter && profileSparkRun && profileSparkRun.status !== "completed" ? (
            <ChapterPlayer
              className="os-checkin-session os-checkin-refresh"
              definition={profileSparkChapter}
              key={profileSparkChapter.id}
              label="Check-in chapter"
              run={profileSparkRun}
              backApp={checkInIdleCard()}
              onRunChange={saveProfileSparkRun}
            />
          ) : (
          <SwipeSession
            availableIndices={
              checkInConfirmed
                ? [checkInIdleApp]
                : checkInSurveyComplete
                  ? [
                      ...Array.from(
                        { length: PROFILE_QUESTIONS.length + 1 },
                        (_, index) => index,
                      ),
                      checkInCompletionApp,
                    ]
                  : unansweredCodexQuestion
                    ? [0, 11]
                    : Array.from(
                        { length: checkInStartApp + 1 },
                        (_, index) => index,
                      )
            }
            className="os-checkin-session"
            index={visibleCheckInApp}
            label="Check-in session"
            maxIndex={
              checkInConfirmed
                ? checkInIdleApp
                : checkInSurveyComplete
                  ? checkInCompletionApp
                  : checkInStartApp
            }
            onIndexChange={(nextIndex) => {
              if (nextIndex > 0) {
                setSeenCheckInJourney(checkInJourneyVersion);
              }
              setCheckInApp(nextIndex);
            }}
          >
            <SessionIntro
              refreshKey={checkInJourneyVersion}
              label="Check-in"
              title={
                unansweredCodexQuestion
                  ? "A new question is ready."
                  : "A moment for you."
              }
              onBegin={() => {
                setSeenCheckInJourney(checkInJourneyVersion);
                setCheckInApp(checkInStartApp);
              }}
            />
            {PROFILE_QUESTIONS.map((question, index) => (
              <SurveySlide
                existingAnswer={surveyAnswer(surveyAnswers, question.id)}
                key={question.id}
                label="Check-in"
                question={question as SurveyQuestion}
                current={index + 1}
                total={PROFILE_QUESTIONS.length}
                onAnswer={(answer) =>
                  answerCheckIn(question as SurveyQuestion, answer, index + 1)
                }
              />
            ))}
            {unansweredCodexQuestion ? (
              <SurveySlide
                existingAnswer={surveyAnswer(
                  surveyAnswers,
                  unansweredCodexQuestion.id,
                )}
                key={unansweredCodexQuestion.id}
                label="Check-in"
                question={unansweredCodexQuestion}
                current={1}
                total={1}
                onAnswer={(answer) =>
                  answerCheckIn(unansweredCodexQuestion, answer, 11)
                }
              />
            ) : (
              <div
                aria-hidden="true"
                className="os-survey-card os-survey-placeholder"
              />
            )}
            <div className="os-survey-card os-chapter-completion">
              <p className="os-card-label">Check-in</p>
              <h2>You completed this chapter.</h2>
              <p>
                Go back if you want to change an answer. Press Continue when it
                feels right.
              </p>
              <button type="button" onClick={confirmCheckInChapter}>
                Continue
              </button>
            </div>
            <div className="os-survey-card os-survey-complete">
                <div className="os-survey-head">
                  <p className="os-card-label">Check-in</p>
                </div>
                {editingCheckInNote ? (
                  <form className="os-idle-note-form" onSubmit={saveCheckInNote}>
                    <div className="os-idle-note-fields">
                      <input
                        aria-label="Edit idle title"
                        autoFocus
                        maxLength={54}
                        placeholder="Keep going."
                        value={checkInTitleDraft}
                        onChange={(event) =>
                          setCheckInTitleDraft(event.target.value)
                        }
                      />
                      <textarea
                        aria-label="Edit idle note"
                        maxLength={220}
                        placeholder="Notice what feels like you today."
                        rows={3}
                        value={checkInNoteDraft}
                        onChange={(event) =>
                          setCheckInNoteDraft(event.target.value)
                        }
                      />
                    </div>
                    <button type="submit" aria-label="Save note">✓</button>
                  </form>
                ) : (
                  <button
                    className="os-idle-note-display"
                    type="button"
                    onClick={() => {
                      setCheckInTitleDraft(checkInIdleTitle);
                      setCheckInNoteDraft(checkInNote);
                      setEditingCheckInNote(true);
                    }}
                    aria-label="Edit check-in note"
                  >
                    <h2>{checkInIdleTitle}</h2>
                    <p>{checkInNote || "Notice what feels like you today."}</p>
                  </button>
                )}
            </div>
          </SwipeSession>
          )}
        </section>

        {activeHabitChapter && activeHabitRun ? (
          <section className="os-habit" aria-label="Habit session">
            <ChapterPlayer
              className="os-habit-session"
              definition={activeHabitChapter}
              key={activeHabitChapter.id}
              idleBody={
                <textarea
                  aria-label="Edit habit mission"
                  className={`os-primary-mission-copy os-mission-text-edit${
                    today.mission.completed ? " completed" : ""
                  }`}
                  maxLength={240}
                  rows={3}
                  value={today.mission.text}
                  onChange={(event) => changePrimaryMission(event.target.value)}
                />
              }
              idleContent={
                <>
                  {extraHabits.length ? (
                    <div className="os-repeated-habits">
                      {extraHabits.map((mission) => (
                        <article
                          className={`os-extra-mission os-repeated-habit${
                            mission.completed ? " completed" : ""
                          }`}
                          key={mission.id}
                        >
                          <textarea
                            aria-label={`Edit habit: ${mission.text}`}
                            className={`os-extra-mission-copy os-mission-text-edit${
                              mission.completed ? " completed" : ""
                            }`}
                            maxLength={240}
                            rows={1}
                            value={mission.text}
                            onChange={(event) =>
                              changeExtraMission(mission.id, event.target.value)
                            }
                            onBlur={(event) =>
                              removeExtraMissionIfEmpty(
                                mission.id,
                                event.currentTarget.value,
                              )
                            }
                          />
                          <button
                            className="os-extra-mission-done"
                            type="button"
                            aria-pressed={mission.completed}
                            onClick={() => toggleExtraMission(mission.id)}
                          >
                            {mission.completed ? "Completed" : "Mark done"}
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : null}
                  {oneTimeTasks.length ? (
                    <div className="os-one-time-tasks">
                      {oneTimeTasks.map((mission) => (
                      <article
                        className={`os-extra-mission${
                          mission.completed ? " completed" : ""
                        }${leavingMissionIds.includes(mission.id) ? " leaving" : ""}`}
                        key={mission.id}
                      >
                        <textarea
                          aria-label={`Edit mission: ${mission.text}`}
                          className={`os-extra-mission-copy os-mission-text-edit${
                            mission.completed ? " completed" : ""
                          }`}
                          maxLength={240}
                          rows={1}
                          value={mission.text}
                          onChange={(event) =>
                            changeExtraMission(mission.id, event.target.value)
                          }
                          onBlur={(event) =>
                            removeExtraMissionIfEmpty(
                              mission.id,
                              event.currentTarget.value,
                            )
                          }
                        />
                        <button
                          className="os-extra-mission-done"
                          type="button"
                          aria-pressed={mission.completed}
                          onClick={() => toggleExtraMission(mission.id)}
                        >
                          {mission.completed ? "Completed" : "Mark done"}
                        </button>
                      </article>
                      ))}
                    </div>
                  ) : null}
                </>
              }
              idleHeaderAction={
                <button className="os-new-habit" type="button" onClick={beginNewHabit}>
                  New habit
                </button>
              }
              idleActionLabel={
                today.mission.completed ? "1 day streak ✦" : undefined
              }
              idleActionPressed={today.mission.completed}
              idleApps={[
                <div className="os-habit-record" key="habit-record">
                  <p className="os-card-label">Habit record</p>
                  <h2>Today, so far.</h2>
                  <p className="os-habit-record-summary">
                    {completedHabitCount
                      ? `${completedHabitCount} completed today.`
                      : "Nothing completed yet."}
                  </p>
                  {completedHabitCount ? (
                    <div className="os-habit-record-list">
                      {today.mission.completed ? (
                        <div className="os-habit-record-row" key="repeat">
                          <span>Habit</span>
                          <textarea
                            aria-label="Edit completed habit"
                            className="os-habit-record-edit"
                            maxLength={240}
                            rows={1}
                            value={today.mission.text}
                            onChange={(event) =>
                              changePrimaryMission(event.target.value)
                            }
                          />
                        </div>
                      ) : null}
                      {completedTaskRecords.map((mission) => (
                        <div className="os-habit-record-row" key={mission.id}>
                          <span>{mission.kind === "habit" ? "Habit" : "Task"}</span>
                          <textarea
                            aria-label={`Edit completed task: ${mission.text}`}
                            className="os-habit-record-edit"
                            maxLength={240}
                            rows={1}
                            value={mission.text}
                            onChange={(event) =>
                              changeExtraMission(mission.id, event.target.value)
                            }
                            onBlur={(event) =>
                              removeExtraMissionIfEmpty(
                                mission.id,
                                event.currentTarget.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>,
              ]}
              idleAppIndex={habitAppIndex}
              onIdleAppIndexChange={saveHabitAppIndex}
              label="Habit chapter"
              run={activeHabitRun}
              backApp={
                addingHabit ? <div aria-hidden="true" className="os-habit-cancel-page" /> : undefined
              }
              onBackAppShown={addingHabit ? () => setAddingHabit(false) : undefined}
              onIdleAction={toggleMission}
              onRunChange={saveHabitBuildingRun}
            />
            {!addingHabit && habitBuildingRun?.status === "completed" && habitAppIndex === 0 ? (
              <button
                className="os-add-habit-row"
                type="button"
                onClick={addExtraMission}
              >
                <span aria-hidden="true">+</span>
                Add task
              </button>
            ) : null}
          </section>
        ) : null}

        {!logSetupDone && logSetupChapter && logSetupRun ? (
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
              <span className="os-day-hint">Tap any line to write or change it</span>
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
