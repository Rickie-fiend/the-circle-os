import type { ReactNode } from "react";
import { GlassCarousel } from "../explore/carousel";

export type TodayTool = "note" | "thoughts" | "routine" | "protocol" | "log" | "week";

type Preview = {
  tool: TodayTool;
  name: string;
  content?: ReactNode;
};

export function TodayPreviews({
  noteLabel, note, question, routine, protocol, hours, week, hidden, onOpen,
}: {
  noteLabel: string;
  note?: { title: string; body: string };
  question?: string;
  routine: { habit?: string; task?: string; more: number; completed: number };
  protocol?: { name: string; nonNegotiable?: string; negotiable?: string; day: number; days: number };
  hours: { time: string; activity?: string; current: boolean }[];
  week?: { goal: string; step?: string };
  hidden: boolean;
  onOpen: (tool: TodayTool, button: HTMLButtonElement) => void;
}) {
  const pairs: { label: string; previews: Preview[] }[] = [
    { label: `${noteLabel} and Deep Thoughts`, previews: [
      { tool: "note", name: noteLabel, content: note ? <>
        <strong className="os-today-preview-title">{note.title.trim() || "Untitled"}</strong>
        {note.body.trim() ? <p className="os-today-note-excerpt">{note.body.trim()}</p> : null}
      </> : null },
      { tool: "thoughts", name: "Deep Thoughts", content: question ? <p>{question}</p> : null },
    ] },
    { label: "Routine and Protocol", previews: [
      { tool: "routine", name: "Routine", content: routine.habit || routine.task || routine.completed ? <>
        {routine.habit ? <p>{routine.habit}</p> : null}
        {routine.task ? <p>{routine.task}</p> : null}
        {routine.more > 0 ? <p className="os-today-preview-meta">+{routine.more} more</p> : null}
        <p className="os-today-preview-meta">{routine.completed} checked off</p>
      </> : null },
      { tool: "protocol", name: "Protocol", content: protocol ? <>
        {protocol.name ? <strong className="os-today-preview-title">{protocol.name}</strong> : null}
        {protocol.nonNegotiable ? <p>{protocol.nonNegotiable}</p> : null}
        {protocol.negotiable ? <p>{protocol.negotiable}</p> : null}
        <p className="os-today-preview-meta">Day {protocol.day} of {protocol.days}</p>
      </> : null },
    ] },
    { label: "Log and Week", previews: [
      { tool: "log", name: "Log", content: hours.length ? <ul className="os-today-preview-hours">
        {hours.map(hour => <li key={hour.time}>
          <time dateTime={hour.time} aria-current={hour.current ? "time" : undefined}>
            {hour.current ? <span className="os-visually-hidden">Current hour: </span> : null}{hour.time}
          </time>
          {hour.activity ? <span>{hour.activity}</span> : null}
        </li>)}
      </ul> : null },
      { tool: "week", name: "Week", content: week ? <>
        <strong className="os-today-preview-title">{week.goal}</strong>
        {week.step ? <p>{week.step}</p> : null}
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
      action: { label: preview.name, open: button => onOpen(preview.tool, button) },
    }))} />)}
  </div>;
}
