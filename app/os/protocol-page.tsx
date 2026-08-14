"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { PageLayout } from "./app-session";
import { ButtonRewardBackdrop, CreativeButton } from "./button-engine";
import { PROTOCOL_DURATIONS } from "./circle-os-model.js";
import { useAppBack } from "./app-back";

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
  sealed: boolean;
  nonNegotiable: ProtocolItemView[];
  negotiable: ProtocolItemView[];
} | null;

export type CompletedProtocolView = {
  run: { id: string; name: string; days: number; status: string };
  day: number;
  dateKey: string;
  sealed: boolean;
  nonNegotiable: ProtocolItemView[];
  negotiable: ProtocolItemView[];
} | null;

export type ProtocolSealView = {
  runId: string;
  dateKey: string;
  day: number;
  totalDays: number;
  phaseName: string;
  terms: Array<Pick<ProtocolItemView, "id" | "text" | "kind">>;
};

export type ProtocolPhaseRecord = {
  id: string;
  name: string;
  days: number;
  status: "completed" | "ended";
  endedEarly: boolean;
  keptDays: number;
  startDateKey: string | null;
  endDateKey: string | null;
  terms: Array<{
    id: string;
    text: string;
    kind: "non-negotiable" | "negotiable";
    keptDays: number;
  }>;
};

export function ProtocolKeptPage({ seal }: { seal: ProtocolSealView }) {
  return (
    <PageLayout
      className="os-protocol os-protocol-kept"
      headerLeft={<p className="os-card-label">Protocol</p>}
      headerRight={<span>{seal.phaseName}</span>}
      theme="orange"
      footer={<span className="os-protocol-close-hint">Swipe to close</span>}
    >
      <div className="os-page-main os-protocol-identity">
        <p className="os-protocol-kept-title">
          Day {seal.day} of {seal.totalDays} kept
        </p>
      </div>
      <div className="os-page-sub os-protocol-kept-terms">
        <p className="os-record-label">Terms kept</p>
        {seal.terms.map((term) => (
          <p className="os-protocol-kept-term" key={term.id}>{term.text}</p>
        ))}
      </div>
    </PageLayout>
  );
}

type ProtocolPageProps = {
  protocol: ProtocolView;
  completedProtocol: CompletedProtocolView;
  phaseRecords: ProtocolPhaseRecord[];
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
  onToggleCompletedItem: (runId: string, itemId: string, dateKey: string) => void;
  onSealToday: () => void;
  onEndRun: () => void;
};

function ProtocolHome({
  className = "",
  completedProtocol,
  onReturnToPhase,
  onStart,
  onToggleCompletedItem,
  phaseRecords,
  running = false,
}: {
  className?: string;
  completedProtocol: CompletedProtocolView;
  onReturnToPhase?: (event: MouseEvent<HTMLButtonElement>) => void;
  onStart?: () => void;
  onToggleCompletedItem: ProtocolPageProps["onToggleCompletedItem"];
  phaseRecords: ProtocolPhaseRecord[];
  running?: boolean;
}) {
  const completedItems = completedProtocol
    ? [...completedProtocol.nonNegotiable, ...completedProtocol.negotiable]
    : [];
  return (
    <PageLayout
      className={`os-protocol os-protocol-home ${className}`.trim()}
      footer={
        !running && onStart ? (
          <button className="os-protocol-begin" onClick={onStart} type="button">
            Start a phase
          </button>
        ) : undefined
      }
      heading={<p className="os-protocol-home-heading">Past phases</p>}
      headerLeft={
        running ? (
          <button
            aria-pressed
            className="os-card-label os-protocol-mode-toggle"
            onClick={onReturnToPhase}
            type="button"
          >
            Phases
          </button>
        ) : (
          <p className="os-card-label">Protocol</p>
        )
      }
      theme="orange"
    >
      <div className="os-page-main os-protocol-home-records">
        {phaseRecords.length ? phaseRecords.map((record) => {
          const canCorrect = completedProtocol?.run.id === record.id;
          return (
            <article className="os-protocol-record" key={record.id}>
              <div className="os-protocol-record-head">
                <h3>{record.name}</h3>
                <span>{record.endedEarly ? "Ended early" : "Finished"}</span>
              </div>
              <p className="os-protocol-record-kept">
                {record.keptDays} of {record.days} days kept
              </p>
              <p className="os-protocol-record-dates">
                {record.startDateKey && record.endDateKey
                  ? `${record.startDateKey} — ${record.endDateKey}`
                  : record.startDateKey || record.endDateKey || "Not started"}
              </p>
              {record.terms.length ? (
                <div className="os-protocol-record-terms">
                  {record.terms.map((term) => {
                    const completedItem = completedItems.find(
                      (item) => item.id === term.id,
                    );
                    const contents = (
                      <>
                        <span>{term.text}</span>
                        <small>{term.keptDays} of {record.days} days</small>
                      </>
                    );
                    return canCorrect && completedItem && completedProtocol ? (
                      <button
                        aria-label={`${completedItem.completed ? "Undo" : "Mark"} last day: ${term.text}`}
                        className="os-protocol-record-term"
                        key={term.id}
                        onClick={() =>
                          onToggleCompletedItem(
                            record.id,
                            term.id,
                            completedProtocol.dateKey,
                          )
                        }
                        type="button"
                      >
                        {contents}
                      </button>
                    ) : (
                      <div className="os-protocol-record-term" key={term.id}>
                        {contents}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="os-protocol-record-empty">No terms were started.</p>
              )}
            </article>
          );
        }) : (
          <p className="os-protocol-invite">
            Finished and stopped phases will stay here.
          </p>
        )}
      </div>
    </PageLayout>
  );
}

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
  completedProtocol,
  phaseRecords,
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
  onToggleCompletedItem,
  onSealToday,
  onEndRun,
}: ProtocolPageProps) {
  const label = <p className="os-card-label">Protocol</p>;
  // Ending a run early is the one thing here that cannot be undone: the terms
  // were agreed before it began and the days do not come back. It asks once.
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rewarding, setRewarding] = useState(false);
  const protocolBack = useAppBack<"phase" | "home">("phase");
  const confirmTimer = useRef<number | null>(null);
  const rewardTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
      if (rewardTimer.current) window.clearTimeout(rewardTimer.current);
    },
    [],
  );

  function completeToday() {
    if (rewarding) return;
    setRewarding(true);
    rewardTimer.current = window.setTimeout(() => {
      onSealToday();
      setRewarding(false);
      rewardTimer.current = null;
    }, 900);
  }

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
      <ProtocolHome
        completedProtocol={completedProtocol}
        onStart={onStart}
        onToggleCompletedItem={onToggleCompletedItem}
        phaseRecords={phaseRecords}
      />
    );
  }

  const { run, day, isDraft, isOver, keptAll, sealed, nonNegotiable, negotiable } = protocol;

  if (run.status === "active" && protocolBack.side === "home") {
    return (
      <ProtocolHome
        className={protocolBack.className}
        completedProtocol={completedProtocol}
        onReturnToPhase={(event) =>
          protocolBack.flip("phase", undefined, event.currentTarget)
        }
        onToggleCompletedItem={onToggleCompletedItem}
        phaseRecords={phaseRecords}
        running
      />
    );
  }

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

  // Protocol names the daily front. Phases names the back. Editing is an action
  // on the front rather than pretending to be another side of the App.
  const runningLabel = (
    <button
      aria-pressed={false}
      className="os-card-label os-protocol-mode-toggle"
      onClick={(event: MouseEvent<HTMLButtonElement>) =>
        protocolBack.flip("home", undefined, event.currentTarget)
      }
      type="button"
    >
      Protocol
    </button>
  );

  if (editing) {
    return (
      <PageLayout
        className="os-protocol os-protocol-draft os-protocol-editing"
        headerLeft={<p className="os-card-label">Protocol</p>}
        headerRight={
          <span className="os-protocol-progress">
            Day {day} of {run.days}
          </span>
        }
        theme="orange"
        footer={
          <button
            className="os-protocol-begin"
            onClick={() => setEditing(false)}
            type="button"
          >
            Done
          </button>
        }
      >
        <div className="os-page-main os-protocol-identity">
          <input
            aria-label="Protocol name"
            className="os-protocol-name-edit"
            maxLength={60}
            onChange={(event) => onRename(event.target.value)}
            placeholder="Monk Mode"
            value={run.name}
          />
          {/* Length is not offered. The day counter and the ending are
              arithmetic on it, and a run that can be shortened when it gets
              hard is not a protocol. */}
          <p className="os-protocol-invite os-protocol-length-note">
            {run.days} days, agreed on day one.
          </p>
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

  return (
    <PageLayout
      className={`os-protocol ${protocolBack.className}`.trim()}
      headerLeft={runningLabel}
      headerRight={
        <span className="os-protocol-progress">
          Day {day} of {run.days}
        </span>
      }
      theme="orange"
      footer={
        keptAll && !sealed ? (
          <button
            className="os-protocol-begin os-protocol-complete"
            disabled={rewarding}
            onClick={completeToday}
            type="button"
          >
            Completed today
          </button>
        ) : (
          <button
            className="os-protocol-begin os-protocol-edit"
            onClick={() => setEditing(true)}
            type="button"
          >
            Edit phase
          </button>
        )
      }
    >
      <ButtonRewardBackdrop active={rewarding} styleId="ink-wash" />
      <span
        aria-live="polite"
        className={`os-protocol-reward-copy${rewarding ? " is-visible" : ""}`}
      >
        {rewarding ? "You did it" : ""}
      </span>
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

        <div className="os-protocol-front-links">
          {keptAll && !sealed ? (
            <button
              className="os-protocol-edit-link"
              onClick={() => setEditing(true)}
              type="button"
            >
              Edit phase
            </button>
          ) : null}
          <button
            className={`os-protocol-end os-protocol-end-demoted${
              confirmingEnd ? " is-confirming" : ""
            }`}
            onClick={endRun}
            type="button"
          >
            {confirmingEnd ? "Tap again to end it" : "End this protocol"}
          </button>
        </div>
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
