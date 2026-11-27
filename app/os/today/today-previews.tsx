import { useId, type ReactNode } from "react";
import { GlassCarousel } from "../explore/carousel";

export type TodayTool = "note" | "thoughts" | "routine" | "protocol" | "log" | "week";

type Preview = { tool: TodayTool; name: string; content?: ReactNode };
const noteTitle = (title: string) => title.trim() || "Untitled";

export function TodayPreviews({
  noteLabel, notes, questions, routine, protocol, hours, week, hidden, onOpen, onQuestion, onLogHour,
}: {
  noteLabel: string;
  notes: { title: string; body: string; dateTime: string; dateLabel: string }[];
  questions: { id: string; text: string }[];
  routine: { items: { id: string; kind: "habit" | "task"; text: string; cue?: string }[]; remaining: number; completed: number };
  protocol?: { name: string; terms: { id: string; kind: "non-negotiable" | "negotiable"; text: string; completed: boolean }[]; day: number; days: number; status: string };
  hours: { time: string; hour: number; activity?: string; current: boolean }[];
  week?: { range: string; goal?: string; step?: string; weekday?: string };
  hidden: boolean;
  onOpen: (tool: TodayTool, button: HTMLButtonElement) => void;
  onQuestion: (id: string, button: HTMLButtonElement) => void;
  onLogHour: (hour: number, button: HTMLButtonElement) => void;
}) {
  const firstQuestionId = useId();
  const [note, olderNote] = notes;
  const dayCue = routine.items.find(item => item.cue)?.id;
  const pairs: { label: string; previews: Preview[] }[] = [
    { label: `${noteLabel} and Deep Thoughts`, previews: [
      { tool: "note", name: noteLabel, content: note ? <>
        <strong className="os-today-preview-title">{noteTitle(note.title)}</strong>
        {note.body.trim() ? <p className="os-today-note-excerpt">{note.body.trim()}</p> : null}
        <time className="os-today-preview-meta" dateTime={note.dateTime}>{note.dateLabel}</time>
        {olderNote ? <p className="os-today-older-note os-today-preview-divider"><span className="os-today-preview-line">{noteTitle(olderNote.title)}</span></p> : null}
      </> : null },
      { tool: "thoughts", name: "Deep Thoughts", content: questions.length ? <div className={questions[1] ? "os-today-questions has-pair" : "os-today-questions"}>
        <p id={firstQuestionId}><span>{questions[0].text}</span></p>
        {questions[1] ? <button type="button" className="os-today-preview-shortcut os-today-preview-divider" onClick={event => onQuestion(questions[1].id, event.currentTarget)}><span>{questions[1].text}</span></button> : null}
      </div> : null },
    ] },
    { label: "Routine and Protocol", previews: [
      { tool: "routine", name: "Routine", content: routine.remaining || routine.completed ? <>
        {(["habit", "task"] as const).map(kind => {
          const items = routine.items.filter(item => item.kind === kind);
          return items.length ? <div className="os-today-preview-group" key={kind}>
            <h4>{kind === "habit" ? "Habits" : "Tasks"}</h4>
            {items.map(item => <div key={item.id}>
              <p className="os-today-preview-line">{item.text}</p>
              {item.id === dayCue ? <p className="os-today-preview-meta os-today-preview-line">{item.cue}</p> : null}
            </div>)}
          </div> : null;
        })}
        <p className="os-today-preview-meta">{routine.remaining ? <>{routine.remaining} left <span className="os-today-preview-dot">·</span>{" "}</> : null}{routine.completed} checked off</p>
      </> : null },
      { tool: "protocol", name: "Protocol", content: protocol ? <>
        {protocol.name ? <strong className="os-today-preview-title">{protocol.name}</strong> : null}
        {protocol.terms.map(term => <div className="os-today-preview-group" key={term.id}>
          <h4>{term.kind === "non-negotiable" ? "Non-negotiable" : "Negotiable"}</h4>
          <p className="os-today-preview-line">
            {term.completed ? <><span aria-hidden="true" className="os-today-kept">✓ </span><span className="os-visually-hidden">Kept: </span></> : null}{term.text}
          </p>
        </div>)}
        <p className="os-today-preview-meta">Day {protocol.day} of {protocol.days} <span className="os-today-preview-dot">·</span> {protocol.status}</p>
      </> : null },
    ] },
    { label: "Log and Week", previews: [
      { tool: "log", name: "Log", content: hours.length ? <ul className="os-today-preview-hours">
        {hours.map(hour => <li key={hour.time}>
          <time dateTime={hour.time} aria-current={hour.current ? "time" : undefined}>
            {hour.current ? <span className="os-visually-hidden">Current hour: </span> : null}{hour.time}
          </time>
          {hour.activity ? <span className="os-today-preview-line">{hour.activity}</span> : null}
          {hour.current && !hour.activity ? <button type="button" className="os-today-preview-shortcut os-today-log-plus" aria-label={`Add activity at ${hour.time}`} onClick={event => onLogHour(hour.hour, event.currentTarget)}>+</button> : null}
        </li>)}
      </ul> : null },
      { tool: "week", name: "Week", content: week ? <>
        <p className="os-today-preview-meta">{week.range}</p>
        {week.goal ? <div className="os-today-preview-group">
          <h4>Goal</h4>
          <p className="os-today-week-item">{week.goal}</p>
        </div> : null}
        {week.step ? <div className="os-today-preview-group">
          <h4>Step</h4>
          <p className="os-today-week-item">{week.weekday ? `${week.weekday} · ` : ""}{week.step}</p>
        </div> : null}
      </> : null },
    ] },
  ];

  return <div className="os-today-previews" hidden={hidden}>
    {pairs.map(({ label, previews }) => <GlassCarousel key={label} label={label} slides={previews.map(preview => ({
      key: preview.tool,
      label: preview.name,
      content: <>
        <h3>{preview.name}</h3>
        {preview.content ? <div className="os-today-preview-copy">{preview.content}</div> : null}
      </>,
      action: { label: preview.name, descriptionId: preview.tool === "thoughts" && questions[0] ? firstQuestionId : undefined, open: button => onOpen(preview.tool, button) },
    }))} />)}
  </div>;
}
