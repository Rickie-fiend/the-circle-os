"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  HABIT_QUESTIONS,
  PROFILE_QUESTIONS,
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
  upsertTimeBlock,
} from "./circle-os-model.js";
import {
  buildServerPayload,
  readCircleState,
  syncCircleState,
} from "./circle-os-ai";
import { loadCircleState, saveCircleState } from "./circle-os-store";

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
  timeBlocks: TimeBlock[];
};

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
  outbox: Array<{
    id: string;
    reason: string;
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
const AWAKE_HOURS = Array.from({ length: 17 }, (_, index) => index + 7);
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
  target: string;
};

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
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
    outbox: payload.outbox,
  });
}

function currentSyncSlot(now = new Date()) {
  return `${getDateKey(now)}-night`;
}

function isNightSyncTime(now = new Date()) {
  return now.getHours() >= 20 || now.getHours() < CIRCLE_DAY_START_HOUR;
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
        isNightSyncTime()
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
            lastServerSignature.current = serverSignature(next);
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
        "profile-edit",
      ].includes(item.reason),
    );
    const needsFirstProfile = !state.ai.profileId || !state.ai.token;
    const scheduledSyncDue =
      state.outbox.some((item) => RECORD_REASONS.has(item.reason)) &&
      isNightSyncTime() &&
      state.ai.lastSyncSlot !== currentSyncSlot();
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
    }, 350);
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
            lastServerSignature.current = serverSignature(next);
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

  const value = {
    state,
    today,
    ready,
    dateKey,
    connectAi,
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
  active,
  children,
}: {
  active: "today" | "mirror" | "connect";
  children: ReactNode;
}) {
  const { state } = useCircleState();
  return (
    <div className="circle-os">
      <div className="os-future-room-background" aria-hidden="true" />
      <div className="os-app-shell">
        <header className="os-header">
          <Link className="os-wordmark" href="/" aria-label="The Circle website">
            <span className="mark mark-small" aria-hidden="true" />
            <span>THE CIRCLE OS</span>
          </Link>
          <span className="os-local-status">
            {state.ai.profileId ? "Saved · Obsidian" : "Saving…"}
          </span>
        </header>
        <nav className="os-nav" aria-label="Circle OS">
          <Link className={active === "today" ? "active" : ""} href="/os">
            Today
          </Link>
          <Link className={active === "mirror" ? "active" : ""} href="/os/mirror">
            Vision
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}

function SurveySlide({
  label,
  question,
  current,
  total,
  onAnswer,
}: {
  label: string;
  question: SurveyQuestion;
  current: number;
  total: number;
  onAnswer: (answer: string) => void;
}) {
  const sliderStart = Math.ceil(
    ((question.min ?? 1) + (question.max ?? 5)) / 2,
  );
  const [value, setValue] = useState(
    question.type === "slider" ? String(sliderStart) : "",
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
            <button type="button" key={choice} onClick={() => onAnswer(choice)}>
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
            autoFocus
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
    </div>
  );
}

export function TodayExperience() {
  const { state, today, ready, updateState, updateToday } = useCircleState();
  const router = useRouter();
  const [dateLabel, setDateLabel] = useState("");
  const [greeting, setGreeting] = useState("Hello.");
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
  }, [state.profile.name]);

  const surveyAnswers = state.profile.profileCase.survey.answers;
  const firstProfileQuestionIndex = PROFILE_QUESTIONS.findIndex(
    (question) =>
      !surveyAnswers.some((answer) => answer.questionId === question.id),
  );
  const profileQuestion =
    firstProfileQuestionIndex >= 0
      ? (PROFILE_QUESTIONS[firstProfileQuestionIndex] as SurveyQuestion)
      : null;
  const profileAnswersDone =
    PROFILE_QUESTIONS.length -
    PROFILE_QUESTIONS.filter(
      (question) =>
        !surveyAnswers.some((answer) => answer.questionId === question.id),
    ).length;
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
  const firstHabitQuestionIndex = HABIT_QUESTIONS.findIndex(
    (question) =>
      !surveyAnswers.some((answer) => answer.questionId === question.id),
  );
  const habitQuestion =
    firstHabitQuestionIndex >= 0
      ? (HABIT_QUESTIONS[firstHabitQuestionIndex] as SurveyQuestion)
      : null;

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

  function openHour(hour: number) {
    const hourStart = hourLabel(hour);
    const existing = today.timeBlocks.find((block) => block.start === hourStart);
    if (existing) {
      openEdit(existing);
      return;
    }

    resetLogForm();
    setStart(hourStart);
    setEnd(hourLabel(hour + 1));
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

  return (
    <OSFrame active="today">
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

          {profileQuestion ? (
            <SurveySlide
              key={profileQuestion.id}
              label="Check-in"
              question={profileQuestion}
              current={firstProfileQuestionIndex + 1}
              total={PROFILE_QUESTIONS.length}
              onAnswer={(answer) =>
                updateState((current) =>
                  answerSurveyQuestion(
                    current,
                    profileQuestion,
                    answer,
                    "profile",
                  ),
                )
              }
            />
          ) : unansweredCodexQuestion ? (
            <SurveySlide
              key={unansweredCodexQuestion.id}
              label="Check-in"
              question={unansweredCodexQuestion}
              current={1}
              total={1}
              onAnswer={(answer) =>
                updateState((current) =>
                  answerProfileQuestion(current, answer),
                )
              }
            />
          ) : (
            <div className="os-survey-card os-survey-complete">
              <div className="os-survey-head">
                <p className="os-card-label">Check-in</p>
                <span>{profileAnswersDone}/{PROFILE_QUESTIONS.length}</span>
              </div>
              <h2>Keep going.</h2>
              <p>Notice what feels like you today.</p>
            </div>
          )}
        </section>

        {habitQuestion ? (
          <section className="os-habit" aria-label="Habit questions">
            <SurveySlide
              key={habitQuestion.id}
              label="Habit"
              question={habitQuestion}
              current={firstHabitQuestionIndex + 1}
              total={HABIT_QUESTIONS.length}
              onAnswer={(answer) =>
                updateState((current) =>
                  answerSurveyQuestion(
                    current,
                    habitQuestion,
                    answer,
                    "habit",
                  ),
                )
              }
            />
          </section>
        ) : (
          <section
            className={`os-mission${today.mission.completed ? " completed" : ""}`}
            aria-labelledby="mission-heading"
          >
            <div>
              <div className="os-mission-meta">
                <p className="os-card-label">Habit</p>
                <span className="os-mission-status" aria-live="polite">
                  {today.mission.completed ? "Done today" : "Today"}
                </span>
              </div>
              <h2 id="mission-heading">{today.mission.text}</h2>
              <span className="os-mission-identity">
                Becoming: {today.mission.identity}
              </span>
            </div>
            <button
              type="button"
              className={today.mission.completed ? "completed" : ""}
              onClick={toggleMission}
              aria-pressed={today.mission.completed}
            >
              <span aria-hidden="true">{today.mission.completed ? "✓" : "○"}</span>
              {today.mission.completed ? "Done" : "Mark done"}
            </button>
          </section>
        )}

        <section className="os-day" aria-labelledby="day-heading">
          <div className="os-section-heading">
            <div>
              <p className="os-card-label">Log</p>
              <h2 id="day-heading">Your day, hour by hour</h2>
              <span className="os-day-hint">Tap any line to write or change it</span>
            </div>
          </div>

          <div className="os-timeline">
            <div className="os-sleep-block">
              <strong>00:00–07:00</strong>
              <span>Sleep · collapsed for now</span>
            </div>
            {AWAKE_HOURS.map((hour) => {
              const slotStart = hourLabel(hour);
              const block = today.timeBlocks.find(
                (item) => item.start === slotStart,
              );
              const editingMain = isLogOpen && start === slotStart;
              const moments =
                block?.moments?.length
                  ? block.moments
                  : block?.note
                    ? [block.note]
                    : [];

              return (
                <article
                  className={block ? "filled" : "empty"}
                  key={slotStart}
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
                      onClick={() => openHour(hour)}
                    >
                      Add main activity
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
          </div>

        </section>
      </main>
    </OSFrame>
  );
}
