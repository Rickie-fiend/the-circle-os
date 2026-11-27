"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { PageLayout } from "./app-session";
import { CreativeButton } from "./button-engine";
import { RoutineHeaderButton, RoutineSwipeCue } from "./routine-controls";
import { sizeTextAreaToContent } from "./text-area-size";
import type { GoalView } from "./goal-model.js";
import type { WeekDaySummary } from "./week-app-model.js";

function dateLabel(key: string, options: Intl.DateTimeFormatOptions) {
  const date = new Date(`${key}T12:00:00`);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-US", options) : "Date not recorded";
}

export function WeekPage({
  weekKey, goals, days, selectedDay, todayKey, newEditorId, leavingGoalIds, fadingGoalIds,
  onSelectDay, onHistory, onLog, onAddGoal, onAddStep, onGoalText,
  onFinishGoalEdit, onStepText, onFinishStepEdit, onToggleGoal, onToggleStep,
  review, leavingTaskIds, fadingTaskIds, onClearGoal, onClearStep,
}: {
  weekKey: string;
  goals: GoalView[];
  days: WeekDaySummary[];
  selectedDay: WeekDaySummary;
  todayKey: string;
  newEditorId: string | null;
  leavingGoalIds: string[];
  fadingGoalIds: string[];
  onSelectDay: (key: string) => void;
  onHistory: (event: MouseEvent<HTMLButtonElement>) => void;
  onLog: () => void;
  onAddGoal: () => string;
  onAddStep: (goalId: string, dateKey: string) => void;
  onGoalText: (goalId: string, text: string) => void;
  onFinishGoalEdit: (goalId: string) => void;
  onStepText: (taskId: string, text: string) => void;
  onFinishStepEdit: (stepId: string) => void;
  onToggleGoal: (goalId: string) => void;
  onToggleStep: (taskId: string) => void;
  review?: ReactNode;
  leavingTaskIds: string[];
  fadingTaskIds: string[];
  onClearGoal: (id: string) => void;
  onClearStep: (taskId: string) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const positionedWeek = useRef("");
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const plannedDays = days.filter(day => day.dateKey >= weekKey);
  const lastDay = plannedDays.at(-1)!;
  const startMonth = dateLabel(weekKey, { month: "long" });
  const endMonth = dateLabel(lastDay.dateKey, { month: "long" });
  const weekRange = `${startMonth} ${dateLabel(weekKey, { day: "numeric" })}–${startMonth === endMonth ? "" : `${endMonth} `}${dateLabel(lastDay.dateKey, { day: "numeric" })}`;
  const openGoals = goals.filter(goal => !goal.done || leavingGoalIds.includes(goal.id));

  useEffect(() => {
    for (const goal of goals.filter(goal => !goal.done)) {
      if (!goal.text.trim() && newEditorId !== goal.id && editingGoal !== goal.id) {
        onFinishGoalEdit(goal.id);
        continue;
      }
      for (const step of goal.steps) {
        if (!step.text.trim() && !step.done && newEditorId !== `week-step-${step.taskId}` && editingStep !== step.id) onFinishStepEdit(step.id);
      }
    }
  }, [goals, newEditorId, editingGoal, editingStep, onFinishGoalEdit, onFinishStepEdit]);


  useLayoutEffect(() => {
    body.current?.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(sizeTextAreaToContent);
  }, [goals, expanded, newEditorId]);

  useLayoutEffect(() => {
    const strip = rail.current;
    const chosen = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!strip || !chosen) return;
    if (positionedWeek.current !== weekKey) {
      const monday = strip.querySelector<HTMLElement>(`[data-date-key="${weekKey}"]`);
      strip.scrollLeft = monday?.offsetLeft || 0;
      positionedWeek.current = weekKey;
    }
    // Only move this rail; scrollIntoView would also move the document.
    if (chosen.offsetLeft < strip.scrollLeft || chosen.offsetLeft + chosen.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollLeft = chosen.offsetLeft - (strip.clientWidth - chosen.offsetWidth) / 2;
    }
  }, [selectedDay.dateKey, weekKey]);

  function renderGoal(goal: GoalView) {
    const editing = goal.steps.some(step => newEditorId === `week-step-${step.taskId}`);
    const isExpanded = expanded.includes(goal.id) || editing;
    const panelId = `${id}-${goal.id}`;
    return <section className={`os-week-goal-group${fadingGoalIds.includes(goal.id) ? " is-fading" : ""}`} key={goal.id} aria-label={goal.text || "New weekly goal"}>
      <div className="os-week-goal-head">
        <button className="os-routine-clear" type="button" aria-label={`Clear goal: ${goal.text || "New goal"}`} onClick={() => onClearGoal(goal.id)}><span className="os-routine-clear-cross" aria-hidden="true" /></button>
        <div className="os-week-goal-wording">
        <textarea aria-label="Goal for this week" className="os-week-goal-text"
          data-inline-editor-id={goal.id} data-os-padded-editor maxLength={240} rows={1} value={goal.text}
          placeholder="Goal for this week" onFocus={() => setEditingGoal(goal.id)}
          onBlur={() => { onFinishGoalEdit(goal.id); setEditingGoal(null); }}
          onChange={event => { onGoalText(goal.id, event.target.value); sizeTextAreaToContent(event.currentTarget); }} />
      <button className="os-week-goal-disclosure" type="button" aria-expanded={isExpanded} aria-controls={panelId}
        aria-label={`${isExpanded ? "Hide" : "Show"} steps for ${goal.text || "this goal"}`}
        onClick={() => setExpanded(current => isExpanded ? current.filter(value => value !== goal.id) : [...current, goal.id])}>
        <span aria-hidden="true">›</span>
      </button>
        </div>
        <CreativeButton aria-label={`${goal.done ? "Undo" : "Complete"} goal: ${goal.text || "this week"}`}
          aria-pressed={goal.done} className="os-row-tick os-row-tick-habit os-row-tick-week"
          disabled={!goal.text.trim()} keepMountedOnSuccess onClick={() => onToggleGoal(goal.id)}
          release="latch" role="habit" styleId="soft-clay" type="button" />
      </div>
      <div id={panelId} hidden={!isExpanded} className="os-week-goal-steps">
        {goal.steps.filter(step => step.dateKey === selectedDay.dateKey && (!step.done || leavingTaskIds.includes(step.taskId))).map(step => <div className={`os-week-step${fadingTaskIds.includes(step.taskId) ? " is-fading-task" : ""}`} key={step.id}>
          <button className="os-routine-clear" type="button" aria-label={`Clear task: ${step.text || "New task"}`} onClick={() => onClearStep(step.taskId)}><span className="os-routine-clear-cross" aria-hidden="true" /></button>
          <div className="os-week-step-copy">
            <textarea aria-label="One step toward this goal" className="os-week-step-text"
              data-inline-editor-id={`week-step-${step.taskId}`} data-os-padded-editor maxLength={240} rows={1}
              value={step.text} placeholder="One small step" onFocus={() => setEditingStep(step.id)} onBlur={() => { onFinishStepEdit(step.id); setEditingStep(null); }}
              onChange={event => { onStepText(step.taskId, event.target.value); sizeTextAreaToContent(event.currentTarget); }} />
          </div>
          <CreativeButton aria-label={`${step.done ? "Undo" : "Complete"} step: ${step.text || "this step"}`}
            aria-pressed={step.done} className="os-row-tick os-row-tick-task os-row-tick-week"
            disabled={!step.text.trim()} keepMountedOnSuccess onClick={() => onToggleStep(step.taskId)}
            release="latch" role="habit" styleId="soft-clay" type="button" />
        </div>)}
        {selectedDay.dateKey >= todayKey && selectedDay.dateKey >= weekKey && goal.text.trim() ? <button className="os-week-text-action os-week-add-action" aria-label="+ Add step" type="button" onClick={() => onAddStep(goal.id,
          plannedDays.some(day => day.dateKey === selectedDay.dateKey) ? selectedDay.dateKey : weekKey)}>
          <span>+</span><span>Add step</span>
        </button> : null}
      </div>
    </section>;
  }

  return <PageLayout className="os-log-page os-log-week os-week-overview" theme="dark" placement="content-flow"
    headerLeft={<span className="os-card-label">Week</span>}
    headerRight={<RoutineHeaderButton onClick={onHistory}>History</RoutineHeaderButton>}
    heading={<><h2>This week</h2><p className="os-week-date">{weekRange}</p></>}
    footer={review} footerNavigation={<RoutineSwipeCue back label="Log" onClick={onLog} />}>
    <div className="os-week-overview-body" ref={body}>
      <div className="os-week-date-rail" role="group" aria-label="Days of this week" ref={rail}
        onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
        {days.map(day => <button className={`os-week-date-button${day.isToday ? " is-today" : ""}`}
          type="button" key={day.dateKey} data-date-key={day.dateKey} aria-pressed={day.dateKey === selectedDay.dateKey}
          aria-current={day.isToday ? "date" : undefined}
          aria-label={`${day.name}, ${dateLabel(day.dateKey, { month: "long", day: "numeric", year: "numeric" })}${day.isToday ? ", today" : ""}${day.dateKey < weekKey ? ", previous week" : ""}`}
          onClick={() => onSelectDay(day.dateKey)}>
          <span>{day.name.slice(0, 3)}</span><strong>{dateLabel(day.dateKey, { day: "numeric" })}</strong>
        </button>)}
      </div>
      <div className="os-week-open-goals" aria-label="This week’s goals">
        {openGoals.map(goal => renderGoal(goal))}
        {!openGoals.length ? <p className="os-week-empty">What matters to you this week?</p> : null}
        <button className="os-week-text-action os-week-add-action" aria-label="+ Add goal" type="button" onClick={onAddGoal}><span>+</span><span>Add goal</span></button>
      </div>
      <details key={selectedDay.dateKey} className="os-week-record" aria-label={`Record for ${selectedDay.dateKey}`}>
        <summary><span>Day’s record<span className="os-week-inline-arrow" aria-hidden="true">›</span></span></summary>
        {selectedDay.activities.length ? <div className="os-week-activities">{selectedDay.activities.map(activity => <article key={activity.id}>
          <div className="os-week-activity-main"><strong>{activity.title}</strong><time>{activity.at}</time></div>
          {activity.moments.length ? <ul>{activity.moments.map((text, index) => <li key={index}>{text}</li>)}</ul> : null}
        </article>)}</div> : <p className="os-week-empty">{selectedDay.isFuture ? "This day is ahead of you." : "Nothing recorded in Log yet."}</p>}
      </details>
    </div>
  </PageLayout>;
}
