"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CIRCLE_OS_STORAGE_KEY,
  DAY_PERIODS,
  MOODS,
  createEmptyState,
  ensureDay,
  getDateKey,
  getDayPeriod,
  minutesBetween,
  normalizeState,
  upsertCheckIn,
  upsertTimeBlock,
} from "./circle-os-model.js";

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
  profile: {
    identityFocus: string;
    name: string;
    age: number | null;
    gender: string;
    typicalTuesday: {
      wakeUp: string;
      morning: string;
      day: string;
      people: string;
      evening: string;
      feeling: string;
      completedAt: string | null;
    };
  };
  days: Record<string, CircleDay>;
};

const AWAKE_HOURS = Array.from({ length: 17 }, (_, index) => index + 7);

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function classifyActivity(title: string) {
  const normalized = title.toLowerCase();
  if (/\b(read|book|study)\b/.test(normalized)) return "Reading";
  if (/\b(walk|outside|park|nature)\b/.test(normalized)) return "Outside";
  if (/\b(gym|run|exercise|workout|sport)\b/.test(normalized)) return "Exercise";
  if (/\b(friend|family|call|date|social)\b/.test(normalized)) return "Social";
  if (/\b(rest|nap|sleep|relax)\b/.test(normalized)) return "Rest";
  if (/\b(game|movie|youtube|netflix|entertainment)\b/.test(normalized)) {
    return "Entertainment";
  }
  if (/\b(work|write|code|design|create|focus|project)\b/.test(normalized)) {
    return "Focus";
  }
  return "Life admin";
}

function freshTimeRange() {
  const now = new Date();
  const startHour = Math.min(22, now.getHours());
  return {
    start: `${String(startHour).padStart(2, "0")}:00`,
    end: `${String(startHour + 1).padStart(2, "0")}:00`,
  };
}

export function useCircleState() {
  const dateKey = getDateKey();
  const [state, setState] = useState<CircleState>(() =>
    ensureDay(createEmptyState(), dateKey),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = window.localStorage.getItem(CIRCLE_OS_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : createEmptyState();
        const valid = normalizeState(parsed);
        setState(ensureDay(valid, getDateKey()));
      } catch {
        setState(ensureDay(createEmptyState(), getDateKey()));
      } finally {
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(CIRCLE_OS_STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const today = state.days[dateKey] ?? ensureDay(state, dateKey).days[dateKey];

  function updateToday(transform: (day: CircleDay) => CircleDay) {
    setState((current) => {
      const currentWithDay = ensureDay(current, dateKey);
      return {
        ...currentWithDay,
        days: {
          ...currentWithDay.days,
          [dateKey]: transform(currentWithDay.days[dateKey]),
        },
      };
    });
  }

  function updateProfile(
    transform: (profile: CircleState["profile"]) => CircleState["profile"],
  ) {
    setState((current) => ({
      ...current,
      profile: transform(current.profile),
    }));
  }

  return {
    state,
    today,
    ready,
    dateKey,
    updateProfile,
    updateToday,
  };
}

export function OSFrame({
  active,
  children,
}: {
  active: "today" | "mirror";
  children: ReactNode;
}) {
  return (
    <div className="circle-os">
      <div className="os-future-room-background" aria-hidden="true" />
      <div className="os-app-shell">
        <header className="os-header">
          <Link className="os-wordmark" href="/" aria-label="The Circle website">
            <span className="mark mark-small" aria-hidden="true" />
            <span>THE CIRCLE OS</span>
          </Link>
          <span className="os-local-status">Private · this device</span>
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

export function TodayExperience() {
  const { state, today, ready, updateToday } = useCircleState();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("morning");
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
  useEffect(() => {
    if (
      ready &&
      (!state.profile.name || !state.profile.age || !state.profile.gender)
    ) {
      router.replace("/os/mirror");
    }
  }, [
    ready,
    router,
    state.profile.age,
    state.profile.gender,
    state.profile.name,
  ]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const now = new Date();
      const period = getDayPeriod(now.getHours());
      const name = state.profile.name.trim();
      setSelectedPeriod(period);
      setDateLabel(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      );
      if (period === "morning") {
        setGreeting(`Good morning${name ? `, ${name}` : ""}.`);
      } else if (period === "midday" || period === "afternoon") {
        setGreeting(`Good afternoon${name ? `, ${name}` : ""}.`);
      } else {
        setGreeting(`Good evening${name ? `, ${name}` : ""}.`);
      }
    });
    return () => {
      active = false;
    };
  }, [state.profile.name]);

  const selectedCheckIn = today.checkIns.find(
    (checkIn) => checkIn.period === selectedPeriod,
  );
  const currentPeriod = DAY_PERIODS.find((period) => period.id === selectedPeriod);

  function saveCheckIn(fields: Partial<CheckIn>) {
    updateToday((day) =>
      upsertCheckIn(day, {
        period: selectedPeriod,
        energy: selectedCheckIn?.energy ?? null,
        mood: selectedCheckIn?.mood ?? null,
        createdAt: new Date().toISOString(),
        ...fields,
      }),
    );
  }

  function toggleMission() {
    updateToday((day) => ({
      ...day,
      mission: {
        ...day.mission,
        completed: !day.mission.completed,
        completedAt: day.mission.completed ? null : new Date().toISOString(),
      },
    }));
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
    if (!blockTitle.trim()) {
      setFormError("Add the main activity for this hour.");
      return;
    }
    const id =
      editingId ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `block-${Date.now()}`);
    updateToday((day) =>
      upsertTimeBlock(day, {
        id,
        start,
        end,
        activity: classifyActivity(blockTitle),
        note: "",
        title: blockTitle.trim(),
        moments: momentsText
          .split("\n")
          .map((moment) => moment.trim())
          .filter(Boolean),
        createdAt:
          day.timeBlocks.find((block) => block.id === id)?.createdAt ??
          new Date().toISOString(),
      }),
    );
    resetLogForm();
    setLogOpen(false);
  }

  function addMoment(event: FormEvent<HTMLFormElement>, hour: number) {
    event.preventDefault();
    const moment = newMoment.trim();
    if (!moment) return;
    const startTime = hourLabel(hour);
    updateToday((day) => ({
      ...day,
      timeBlocks: day.timeBlocks.map((block) =>
        block.start === startTime
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
    }));
    setNewMoment("");
    setMomentHour(null);
  }

  return (
    <OSFrame active="today">
      <main className="os-today">
        <section className="os-checkin" aria-labelledby="checkin-question">
          <div className="os-context-row">
            <div>
              <p className="os-eyebrow">{dateLabel}</p>
              <h1>{greeting}</h1>
            </div>
            <p className="os-save-state" aria-live="polite">
              {ready ? "Saved on this device" : "Opening your day…"}
            </p>
          </div>

          <div className="os-checkin-card">
            <p className="os-card-label">
              Check in · {currentPeriod?.label}
            </p>
            <h2 id="checkin-question">How&apos;s your energy?</h2>

            <div className="os-energy-scale" aria-label="Energy from one to five">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={selectedCheckIn?.energy === value ? "selected" : ""}
                  onClick={() => saveCheckIn({ energy: value })}
                  aria-label={`Energy ${value} of 5`}
                  aria-pressed={selectedCheckIn?.energy === value}
                >
                  <span>{value}</span>
                </button>
              ))}
            </div>
            <div className="os-scale-labels" aria-hidden="true">
              <span>Low</span>
              <span>Alive</span>
            </div>

            <div className="os-mood-row">
              <p>Mood</p>
              <div>
                {MOODS.map((mood) => (
                  <button
                    type="button"
                    key={mood}
                    className={selectedCheckIn?.mood === mood ? "selected" : ""}
                    onClick={() =>
                      saveCheckIn({
                        mood: selectedCheckIn?.mood === mood ? null : mood,
                      })
                    }
                    aria-pressed={selectedCheckIn?.mood === mood}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="os-period-tabs" aria-label="Choose a part of the day">
              {DAY_PERIODS.map((period) => {
                const recorded = today.checkIns.some(
                  (checkIn) => checkIn.period === period.id,
                );
                return (
                  <button
                    className={period.id === selectedPeriod ? "active" : ""}
                    type="button"
                    key={period.id}
                    onClick={() => setSelectedPeriod(period.id)}
                    aria-pressed={period.id === selectedPeriod}
                  >
                    <span>{period.label}</span>
                    <i className={recorded ? "recorded" : ""} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className={`os-mission${today.mission.completed ? " completed" : ""}`}
          aria-labelledby="mission-heading"
        >
          <div>
            <div className="os-mission-meta">
              <p className="os-card-label">Today&apos;s Mission</p>
              <span className="os-mission-status" aria-live="polite">
                {today.mission.completed ? "Completed today" : "Still to do"}
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
            {today.mission.completed ? "Completed" : "Mark complete"}
          </button>
        </section>

        <section className="os-day" aria-labelledby="day-heading">
          <div className="os-section-heading">
            <div>
              <p className="os-card-label">Today</p>
              <h2 id="day-heading">Your day, hour by hour</h2>
              <span className="os-day-hint">One main activity + small moments</span>
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
                        value={blockTitle}
                        onChange={(event) => setBlockTitle(event.target.value)}
                        placeholder="Type the main activity"
                        aria-label={`Main activity at ${slotStart}`}
                        maxLength={60}
                        autoFocus
                        required
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
                        <button type="button" onClick={() => openEdit(block)}>
                          {block.title ?? block.activity}
                        </button>
                        {block.activity && block.activity !== "Life admin" ? (
                          <span className="os-time-category">{block.activity}</span>
                        ) : null}
                        {moments.length ? (
                          <ul>
                            {moments.map((moment, index) => (
                              <li key={`${block.id}-${index}`}>{moment}</li>
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
                        if (!block) {
                          openHour(hour);
                          return;
                        }
                        setMomentHour(hour);
                        setNewMoment("");
                      }}
                    >
                      +
                    </button>
                  ) : null}
                  {momentHour === hour && block ? (
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

          <div className="os-day-coverage" aria-label="Today's check-in coverage">
            {DAY_PERIODS.map((period) => {
              const checkIn = today.checkIns.find(
                (item) => item.period === period.id,
              );
              return (
                <div key={period.id}>
                  <span>{period.label}</span>
                  <strong>
                    {checkIn?.energy ? `${checkIn.energy}/5` : "Not recorded"}
                  </strong>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </OSFrame>
  );
}
