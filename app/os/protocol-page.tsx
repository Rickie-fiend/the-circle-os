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
      placement="content-flow"
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
  onArchiveRecord: (runId: string) => void;
  onSealToday: () => void;
  onEndRun: () => void;
};

function ProtocolHome({
  className = "",
  completedProtocol,
  currentPhase,
  onReturnToPhase,
  onStart,
  onArchiveRecord,
  onToggleCompletedItem,
  phaseRecords,
  running = false,
}: {
  currentPhase?: {
    name: string;
    day: number;
    days: number;
    keptToday: number;
    termsToday: number;
  } | null;
  className?: string;
  completedProtocol: CompletedProtocolView;
  onReturnToPhase?: (event: MouseEvent<HTMLButtonElement>) => void;
  onStart?: () => void;
  onArchiveRecord: ProtocolPageProps["onArchiveRecord"];
  onToggleCompletedItem: ProtocolPageProps["onToggleCompletedItem"];
  phaseRecords: ProtocolPhaseRecord[];
  running?: boolean;
}) {
  const [confirmingRemoval, setConfirmingRemoval] = useState<string | null>(null);
  const removalTimer = useRef<number | null>(null);
  const completedItems = completedProtocol
    ? [...completedProtocol.nonNegotiable, ...completedProtocol.negotiable]
    : [];

  useEffect(
    () => () => {
      if (removalTimer.current) window.clearTimeout(removalTimer.current);
    },
    [],
  );

  function removeRecord(runId: string) {
    if (removalTimer.current) window.clearTimeout(removalTimer.current);
    if (confirmingRemoval === runId) {
      removalTimer.current = null;
      setConfirmingRemoval(null);
      onArchiveRecord(runId);
      return;
    }
    setConfirmingRemoval(runId);
    removalTimer.current = window.setTimeout(() => {
      setConfirmingRemoval(null);
      removalTimer.current = null;
    }, 4000);
  }

  return (
    <PageLayout
      className={`os-protocol os-protocol-home ${className}`.trim()}
      footer={
        // A button, not an empty outline, and on the Footer line where every
        // other App puts its one action. Sai: "start phases button rather than
        // dotted box, make it a darktheme button. And the alignment is not
        // right. Footer also." With nothing running there is nothing for a box
        // to hold, and the Footer was reserving 52px for no action at all.
        !running && onStart ? (
          <CreativeButton
            className="os-protocol-begin os-protocol-start"
            onClick={onStart}
            sizing="content"
            styleId="default"
            type="button"
          >
            Start a phase
          </CreativeButton>
        ) : undefined
      }
      heading={
        // No heading. The App Label above already says Phases, and a Page that
        // says its own name twice is saying it once too often — which is what
        // Sai's screenshot shows: PHASES, a gap, then PHASES again.
        undefined
      }
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
      placement="content-flow"
      theme="orange"
    >
      {/* One box, two states.
        *
        * A running phase is the box; with none running the same box is where
        * one begins, rather than a separate action in the Footer. Sai: "rather
        * than start the phase as a button, we can make the current phase, a
        * place to start a phase when we dont currently have one. and i love the
        * current phase monk mode or smt, a box that we can click on." */}
      {/* The slot exists only when there is a phase in it. With none running
        * the Page is its heading and the action on the Footer line. */}
      {currentPhase ? (
      <section className="os-protocol-home-part" aria-label="Current phase">
        {(
          <button
            className="os-protocol-current"
            onClick={onReturnToPhase}
            type="button"
          >
            <span className="os-protocol-current-name">{currentPhase.name}</span>
            <span className="os-protocol-current-meta">
              Day {currentPhase.day} of {currentPhase.days}
              {currentPhase.termsToday
                ? ` · ${currentPhase.keptToday} of ${currentPhase.termsToday} kept today`
                : ""}
            </span>
          </button>
        )}
      </section>
      ) : null}

      {/* Folded by default. Sai: "Past phases, i dont really care, i dont read
        * back at all so it should be just stored within reach." So the record
        * is kept and reachable, and stops being the body of the Page. */}
      <details className="os-protocol-home-part os-protocol-past" aria-label="Past phases">
        <summary className="os-protocol-past-head">
          <span className="os-record-label">Past phases</span>
          <span className="os-protocol-past-count">{phaseRecords.length}</span>
        </summary>
      <div className="os-page-main os-protocol-home-records">
        {phaseRecords.length ? phaseRecords.map((record) => {
          const canCorrect = completedProtocol?.run.id === record.id;
          return (
            <article className="os-protocol-record" key={record.id}>
              <div className="os-protocol-record-head">
                <h3>{record.name}</h3>
                <span>{record.endedEarly ? "Ended early" : "Finished"}</span>
              </div>
              <div className="os-protocol-record-meta">
                <p className="os-protocol-record-kept">
                  {record.keptDays} of {record.days} days kept
                </p>
                <p className="os-protocol-record-dates">
                  {record.startDateKey && record.endDateKey
                    ? `${record.startDateKey} — ${record.endDateKey}`
                    : record.startDateKey || record.endDateKey || "Not started"}
                </p>
              </div>
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
              <button
                aria-label={`Remove phase record: ${record.name}`}
                className={`os-protocol-record-remove${
                  confirmingRemoval === record.id ? " is-confirming" : ""
                }`}
                onClick={() => removeRecord(record.id)}
                type="button"
              >
                {confirmingRemoval === record.id ? "Tap again to remove" : "Remove"}
              </button>
            </article>
          );
        }) : (
          <p className="os-protocol-invite">
            Finished and stopped phases will stay here.
          </p>
        )}
      </div>
      </details>
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
  onArchiveRecord,
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

  function finishEditing() {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
    setConfirmingEnd(false);
    setEditing(false);
  }

  if (!protocol) {
    return (
      <ProtocolHome
        completedProtocol={completedProtocol}
        onArchiveRecord={onArchiveRecord}
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
        currentPhase={{
          name: run.name,
          day,
          days: run.days,
          keptToday: [...nonNegotiable, ...negotiable].filter((item) => item.completed).length,
          termsToday: nonNegotiable.length + negotiable.length,
        }}
        onArchiveRecord={onArchiveRecord}
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
        placement="identity-stack"
        theme="orange"
        footer={
          <CreativeButton
            className="os-protocol-begin"
            disabled={!canBegin}
            onClick={onBegin}
            sizing="content"
            styleId="default"
            type="button"
          >
            {canBegin ? `Begin ${run.days} days` : "Add one non-negotiable"}
          </CreativeButton>
        }
      >
        {/* What the protocol is goes in Main Body; its terms are the Sub Body
            stack. Written as four loose children they fell into the Body's two
            tracks by position, so the name alone was stretched to fill the
            Main track and the page ran on for 650px. */}
        <div className="os-page-main os-protocol-identity">
          <input
            aria-label="Protocol name"
            className="os-app-page-heading os-protocol-name-edit"
            data-os-app-heading
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

        <div className="os-page-sub os-app-page-stacks os-protocol-terms">
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
        placement="identity-stack"
        theme="orange"
        footer={
          <CreativeButton
            className="os-protocol-begin"
            onClick={onEndRun}
            sizing="content"
            styleId="default"
            type="button"
          >
            Close this protocol
          </CreativeButton>
        }
      >
        <div className="os-page-main os-protocol-identity">
          <p className="os-app-page-heading os-protocol-name" data-os-app-heading>
            {run.name}
          </p>
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
        placement="identity-stack"
        headerRight={
          <button
            className={`os-new-habit os-protocol-editor-end${
              confirmingEnd ? " is-confirming" : ""
            }`}
            onClick={endRun}
            type="button"
          >
            {confirmingEnd ? "Tap again" : "End"}
          </button>
        }
        theme="orange"
        footer={
          <div className="os-protocol-footer">
            <span className="os-protocol-progress">
              Day {day} of {run.days}
            </span>
            <CreativeButton
              className="os-protocol-begin"
              onClick={finishEditing}
              sizing="content"
              styleId="default"
              type="button"
            >
              Done
            </CreativeButton>
          </div>
        }
      >
        <div className="os-page-main os-protocol-identity">
          <input
            aria-label="Protocol name"
            className="os-app-page-heading os-protocol-name-edit"
            data-os-app-heading
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

        <div className="os-page-sub os-app-page-stacks os-protocol-terms">
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
      placement="identity-stack"
      /* Edit sits top right, where New habit sits on Routine: the same class,
       * so it lines up with the App Label opposite it the same way. */
      headerRight={
        <button
          className="os-new-habit"
          onClick={() => setEditing(true)}
          type="button"
        >
          Edit
        </button>
      }
      theme="orange"
      /* The day count moved down to where the day is actually finished. Sai:
       * "move day 7 of 7 progress to the bottom where complete the day button
       * will be shown." It reads as the state of the thing the button acts on
       * rather than as a tally in the corner. */
      footer={
        <div className="os-protocol-footer">
          <span className="os-protocol-progress">
            Day {day} of {run.days}
          </span>
          {keptAll && !sealed ? (
            <CreativeButton
              className="os-protocol-begin os-protocol-complete"
              disabled={rewarding}
              onClick={completeToday}
              sizing="content"
              styleId="default"
              type="button"
            >
              Completed today
            </CreativeButton>
          ) : null}
        </div>
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
        <p className="os-app-page-heading os-protocol-name" data-os-app-heading>
          {run.name}
        </p>
      </div>

      <div className="os-page-sub os-app-page-stacks os-protocol-terms">
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
      release="latch"
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
