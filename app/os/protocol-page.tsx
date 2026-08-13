"use client";

import { useEffect, useRef, useState } from "react";
import { PageLayout } from "./app-session";
import { CreativeButton } from "./button-engine";
import { PROTOCOL_DURATIONS } from "./circle-os-model.js";

export type ProtocolItemView = {
  id: string;
  text: string;
  kind: "non-negotiable" | "negotiable";
  completed: boolean;
};

export type ProtocolView = {
  run: { id: string; name: string; days: number; status: string };
  day: number;
  isDraft: boolean;
  isOver: boolean;
  keptAll: boolean;
  nonNegotiable: ProtocolItemView[];
  negotiable: ProtocolItemView[];
} | null;

type ProtocolPageProps = {
  protocol: ProtocolView;
  canBegin: boolean;
  editingItemId: string | null;
  onStart: () => void;
  onRename: (name: string) => void;
  onSetDays: (days: number) => void;
  onAddItem: (kind: "non-negotiable" | "negotiable") => void;
  onChangeItem: (itemId: string, text: string) => void;
  onFinishItemEdit: (itemId: string) => void;
  onBegin: () => void;
  onToggleItem: (itemId: string) => void;
  onEndRun: () => void;
};

/**
 * The second page of the Habit App Box.
 *
 * A habit is open-ended; a protocol is a container of time. It starts, it ends,
 * and its terms were agreed before it began. The difference is carried by the
 * shape rather than the colour: habit rows are lines with a tick beside them,
 * protocol terms are blocks, and the whole block is the button. That works
 * because the terms are locked while a run is going, so there is nothing inside
 * a block to tap for editing.
 *
 * Solid means non-negotiable. Dashed means negotiable. That is the whole visual
 * language, which matters because this has to be usable by a child.
 *
 * It renders through the shared PageLayout so it keeps the same five regions as
 * every other Page: an App Page that builds its own frame gets none of the
 * padding, and its header runs into the edge of the App Box.
 */
export function ProtocolPage({
  protocol,
  canBegin,
  editingItemId,
  onStart,
  onRename,
  onSetDays,
  onAddItem,
  onChangeItem,
  onFinishItemEdit,
  onBegin,
  onToggleItem,
  onEndRun,
}: ProtocolPageProps) {
  const label = <p className="os-card-label">Protocol</p>;
  // Ending a run early is the one thing here that cannot be undone: the terms
  // were agreed before it began and the days do not come back. It asks once.
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    },
    [],
  );

  function endRun() {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    if (confirmingEnd) {
      confirmTimer.current = null;
      setConfirmingEnd(false);
      onEndRun();
      return;
    }
    setConfirmingEnd(true);
    // The question expires. A protocol left mid-question should not end
    // because the screen was still open an hour later.
    confirmTimer.current = window.setTimeout(() => {
      setConfirmingEnd(false);
      confirmTimer.current = null;
    }, 4000);
  }

  if (!protocol) {
    return (
      <PageLayout
        className="os-protocol"
        headerLeft={label}
        theme="orange"
        footer={
          <button className="os-protocol-begin" onClick={onStart} type="button">
            Start a protocol
          </button>
        }
      >
        <div className="os-page-main os-protocol-identity">
          <p className="os-protocol-invite">
            A protocol is a short stretch of days you agree with yourself, kept
            the same every day until it ends.
          </p>
        </div>
      </PageLayout>
    );
  }

  const { run, day, isDraft, isOver, nonNegotiable, negotiable } = protocol;

  if (isDraft) {
    return (
      <PageLayout
        className="os-protocol os-protocol-draft"
        headerLeft={label}
        theme="orange"
        footer={
          <button
            className="os-protocol-begin"
            disabled={!canBegin}
            onClick={onBegin}
            type="button"
          >
            {canBegin ? `Begin ${run.days} days` : "Add one non-negotiable"}
          </button>
        }
      >
        {/* What the protocol is goes in Main Body; its terms are the Sub Body
            stack. Written as four loose children they fell into the Body's two
            tracks by position, so the name alone was stretched to fill the
            Main track and the page ran on for 650px. */}
        <div className="os-page-main os-protocol-identity">
          <input
            aria-label="Protocol name"
            className="os-protocol-name-edit"
            maxLength={60}
            onChange={(event) => onRename(event.target.value)}
            placeholder="Monk Mode"
            value={run.name}
          />

          <div className="os-protocol-days" role="group" aria-label="How many days">
            {PROTOCOL_DURATIONS.map((days: number) => (
              <button
                aria-pressed={run.days === days}
                className="os-protocol-day-choice"
                key={days}
                onClick={() => onSetDays(days)}
                type="button"
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        <div className="os-page-sub os-protocol-terms">
          <ProtocolDraftGroup
            items={nonNegotiable}
            editingItemId={editingItemId}
            kind="non-negotiable"
            label="Non-negotiable"
            onAddItem={onAddItem}
            onChangeItem={onChangeItem}
            onFinishItemEdit={onFinishItemEdit}
          />
          <ProtocolDraftGroup
            items={negotiable}
            editingItemId={editingItemId}
            kind="negotiable"
            label="Negotiable"
            onAddItem={onAddItem}
            onChangeItem={onChangeItem}
            onFinishItemEdit={onFinishItemEdit}
          />
        </div>
      </PageLayout>
    );
  }

  if (isOver) {
    return (
      <PageLayout
        className="os-protocol os-protocol-over"
        headerLeft={label}
        theme="orange"
        footer={
          <button className="os-protocol-begin" onClick={onEndRun} type="button">
            Close this protocol
          </button>
        }
      >
        <div className="os-page-main os-protocol-identity">
          <p className="os-protocol-name">{run.name}</p>
          <p className="os-protocol-invite">
            {run.days} days finished. What you kept is in your record.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      className="os-protocol"
      headerLeft={label}
      headerRight={
        <span className="os-protocol-progress">
          Day {day} of {run.days}
        </span>
      }
      theme="orange"
      footer={
        <button
          className={`os-protocol-end${confirmingEnd ? " is-confirming" : ""}`}
          onClick={endRun}
          type="button"
        >
          {confirmingEnd ? "Tap again to end it" : "End this protocol"}
        </button>
      }
    >
      <div className="os-page-main os-protocol-identity">
        <p className="os-protocol-name">{run.name}</p>
      </div>

      <div className="os-page-sub os-protocol-terms">
        {nonNegotiable.length ? (
          <>
            <p className="os-record-label">Non-negotiable</p>
            {nonNegotiable.map((item) => (
              <ProtocolBlock item={item} key={item.id} onToggle={onToggleItem} />
            ))}
          </>
        ) : null}

        {negotiable.length ? (
          <>
            <p className="os-record-label os-protocol-second-label">Negotiable</p>
            {negotiable.map((item) => (
              <ProtocolBlock item={item} key={item.id} onToggle={onToggleItem} />
            ))}
          </>
        ) : null}
      </div>
    </PageLayout>
  );
}

/** The block is the button. Pressing it fills it in. */
function ProtocolBlock({
  item,
  onToggle,
}: {
  item: ProtocolItemView;
  onToggle: (itemId: string) => void;
}) {
  return (
    <CreativeButton
      aria-label={`${item.completed ? "Undo" : "Keep"}: ${item.text}`}
      aria-pressed={item.completed}
      className={`os-protocol-block${
        item.kind === "negotiable" ? " is-negotiable" : ""
      }${item.completed ? " is-kept" : ""}`}
      keepMountedOnSuccess
      onClick={() => onToggle(item.id)}
      role="habit"
      styleId="soft-clay"
      type="button"
    >
      <span className="os-protocol-block-text">{item.text}</span>
      <span aria-hidden="true" className="os-protocol-block-dot" />
    </CreativeButton>
  );
}

function ProtocolDraftGroup({
  items,
  editingItemId,
  kind,
  label,
  onAddItem,
  onChangeItem,
  onFinishItemEdit,
}: {
  items: ProtocolItemView[];
  editingItemId: string | null;
  kind: "non-negotiable" | "negotiable";
  label: string;
  onAddItem: (kind: "non-negotiable" | "negotiable") => void;
  onChangeItem: (itemId: string, text: string) => void;
  onFinishItemEdit: (itemId: string) => void;
}) {
  return (
    <section className="os-protocol-group" aria-label={label}>
      <p className="os-record-label">{label}</p>
      {items.map((item) => (
        <div
          className={`os-protocol-block is-draft${
            kind === "negotiable" ? " is-negotiable" : ""
          }`}
          key={item.id}
        >
          <textarea
            aria-label={`Edit ${label}: ${item.text || "new"}`}
            autoFocus={editingItemId === item.id}
            className="os-protocol-block-edit"
            data-inline-editor-id={item.id}
            maxLength={120}
            onBlur={() => onFinishItemEdit(item.id)}
            onChange={(event) => onChangeItem(item.id, event.target.value)}
            placeholder={
              kind === "non-negotiable" ? "Journaling 1 line" : "Read 1 chapter"
            }
            rows={1}
          value={item.text}
          />
        </div>
      ))}
      <button
        className="os-protocol-add"
        onClick={() => onAddItem(kind)}
        type="button"
      >
        <span aria-hidden="true">+</span>
        Add {kind === "non-negotiable" ? "a non-negotiable" : "a negotiable"}
      </button>
    </section>
  );
}
