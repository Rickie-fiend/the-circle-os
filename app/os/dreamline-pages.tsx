"use client";

import { useState, type FormEvent } from "react";

import { PageLayout } from "./app-session";

export type DreamlineCategory = "having" | "being" | "doing";
export type DreamlineStep = "now" | "tomorrow" | "dayAfter";

export type DreamlineItem = {
  id: string;
  category: DreamlineCategory;
  text: string;
  convertedDoing: string;
  costCents: number;
  cadence: "monthly" | "one-time";
  starred: boolean;
  steps: Record<DreamlineStep, string>;
  stepsDoneAt: Record<DreamlineStep, string | null>;
  createdAt: string;
  updatedAt: string;
};

export type DreamlineRecord = {
  id: string;
  status: "active" | "concluded";
  months: number;
  monthlyExpensesCents: number;
  items: Record<string, DreamlineItem>;
  stepsCommittedAt: string | null;
  createdAt: string;
  startedAt: string;
  targetAt: string | null;
  concludedAt: string | null;
  updatedAt: string;
};

/** What the Today Page shows: one step, or the fact that all of them are done. */
export type DreamlineTodayView = {
  itemId: string;
  item: DreamlineItem | null;
  step: DreamlineStep | null;
  text: string;
  done: boolean;
};

type DreamlineLineDraft = {
  category: DreamlineCategory;
  text: string;
  convertedDoing: string;
  costCents: number;
  cadence: "monthly" | "one-time";
};

type DreamlineIncome = {
  having: number;
  being: number;
  doing: number;
  expenseBuffer: number;
  monthly: number;
  daily: number;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatDreamlineMoney(value: number) {
  return money.format(Number.isFinite(value) ? value : 0);
}

function dateLabel(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function moneyInput(cents: number) {
  return cents ? String(cents / 100) : "";
}

function toCents(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

/**
 * The dream sheet: setup, Having, Being, Doing and the income it all adds up
 * to, on one Page. It is long and it scrolls, which is right - a worksheet is
 * a sheet, not five cards you swipe between.
 */
export function DreamlineSheetPage({
  history,
  income,
  onContinue,
  onSaveLine,
  onSaveSetup,
  onStar,
  onStart,
  record,
}: {
  history: DreamlineRecord[];
  income: DreamlineIncome | null;
  onContinue: () => void;
  onSaveLine: (value: DreamlineLineDraft, itemId?: string) => string;
  onSaveSetup: (months: number, monthlyExpensesCents: number) => string;
  onStar: (item: DreamlineItem, starred: boolean) => string;
  onStart: (months: number, monthlyExpensesCents: number) => string;
  record: DreamlineRecord | null;
}) {
  const onSave = onSaveSetup;
  const [months, setMonths] = useState(String(record?.months || 6));
  const [expenses, setExpenses] = useState(
    moneyInput(record?.monthlyExpensesCents || 0),
  );
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMonths = Math.max(1, Math.min(60, Math.round(Number(months) || 6)));
    const message = record
      ? onSave(cleanMonths, toCents(expenses))
      : onStart(cleanMonths, toCents(expenses));
    setError(message);
    // Saving a sheet that already exists is not the end of anything on its own.
    // Continue is the finish: it keeps the setup and moves to the steps, which
    // is the next thing this Page is for.
    if (!message && record) onContinue();
  }

  return (
    <PageLayout
      className="os-dreamline-page os-dreamline-setup"
      footer={
        <button className="os-dreamline-primary" form="dreamline-setup" type="submit">
          {record ? "Continue" : "Begin Dreamline"}
        </button>
      }
      headerLeft={<p className="os-card-label">Dreamline</p>}
      headerRight={<span className="os-card-label">The dream</span>}
      heading={<h2>In {record?.months || Number(months) || 6} months I dream of.</h2>}
      placement="content-flow"
      theme="dark"
    >
      <form className="os-dreamline-setup-form" id="dreamline-setup" onSubmit={submit}>
        <label>
          <span>Timeline</span>
          <span className="os-dreamline-number-field">
            <input
              aria-label="Dreamline months"
              inputMode="numeric"
              max={60}
              min={1}
              onChange={(event) => setMonths(event.currentTarget.value)}
              type="number"
              value={months}
            />
            months
          </span>
        </label>
        <label>
          <span>Monthly expenses</span>
          <span className="os-dreamline-money-field">
            <span aria-hidden="true">$</span>
            <input
              aria-label="Monthly expenses"
              inputMode="decimal"
              min={0}
              onChange={(event) => setExpenses(event.currentTarget.value)}
              placeholder="0"
              step="0.01"
              type="number"
              value={expenses}
            />
          </span>
        </label>
        {record?.targetAt ? (
          <p className="os-dreamline-target">This Dreamline concludes {dateLabel(record.targetAt)}.</p>
        ) : null}
        {error ? <p className="os-dreamline-error" role="alert">{error}</p> : null}
      </form>

      {record ? (
        <>
          <DreamlineLinesSection
            category="having"
            onSave={onSaveLine}
            onStar={onStar}
            record={record}
          />
          <DreamlineLinesSection
            category="being"
            onSave={onSaveLine}
            onStar={onStar}
            record={record}
          />
          <DreamlineLinesSection
            category="doing"
            onSave={onSaveLine}
            onStar={onStar}
            record={record}
          />

          {income ? (
            <section className="os-dreamline-section os-dreamline-income" aria-label="Target income">
              <p className="os-record-label">Target monthly income</p>
              <div className="os-dreamline-income-total">
                <strong>{formatDreamlineMoney(income.monthly)}</strong>
                <span>Only starred dreams enter this number.</span>
              </div>
              <dl className="os-dreamline-income-terms">
                <div><dt>A · Having</dt><dd>{formatDreamlineMoney(income.having)}</dd></div>
                <div><dt>B · Being</dt><dd>{formatDreamlineMoney(income.being)}</dd></div>
                <div><dt>C · Doing</dt><dd>{formatDreamlineMoney(income.doing)}</dd></div>
                <div><dt>Expenses × 1.3</dt><dd>{formatDreamlineMoney(income.expenseBuffer)}</dd></div>
              </dl>
              <div className="os-dreamline-daily">
                <span>Target daily income</span>
                <strong>{formatDreamlineMoney(income.daily)}</strong>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {history.length ? (
        <details className="os-dreamline-history">
          <summary>Past Dreamlines</summary>
          {history.map((past) => (
            <article key={past.id}>
              <strong>Concluded {dateLabel(past.concludedAt || past.targetAt)}</strong>
              <ul>
                {Object.values(past.items).map((item) => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            </article>
          ))}
        </details>
      ) : null}
    </PageLayout>
  );
}

function DreamlineLineForm({
  category,
  item,
  onCancel,
  onSave,
}: {
  category: DreamlineCategory;
  item?: DreamlineItem;
  onCancel: () => void;
  onSave: (value: DreamlineLineDraft) => string;
}) {
  const [text, setText] = useState(item?.text || "");
  const [convertedDoing, setConvertedDoing] = useState(item?.convertedDoing || "");
  const [cost, setCost] = useState(moneyInput(item?.costCents || 0));
  const [cadence, setCadence] = useState<"monthly" | "one-time">(
    item?.cadence || "monthly",
  );
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) {
      setError("Name the dream before saving it.");
      return;
    }
    if (category === "being" && !convertedDoing.trim()) {
      setError("A Being needs the Doing that would make it real.");
      return;
    }
    const message = onSave({
      category,
      text,
      convertedDoing,
      costCents: toCents(cost),
      cadence,
    });
    setError(message);
    if (!message) onCancel();
  }

  return (
    <form className="os-dreamline-line-form" onSubmit={submit}>
      <label>
        <span>{category === "being" ? "Being" : category === "having" ? "Having" : "Doing"}</span>
        <textarea
          aria-label={`${category} dream`}
          autoFocus
          maxLength={480}
          onChange={(event) => setText(event.currentTarget.value)}
          placeholder={
            category === "having"
              ? "Something worth having"
              : category === "being"
                ? "Someone you want to be"
                : "Something worth doing"
          }
          rows={2}
          value={text}
        />
      </label>
      {category === "being" ? (
        <label>
          <span>Becomes Doing</span>
          <textarea
            aria-label="Doing that makes this Being real"
            maxLength={480}
            onChange={(event) => setConvertedDoing(event.currentTarget.value)}
            placeholder="What would prove this in action?"
            rows={2}
            value={convertedDoing}
          />
        </label>
      ) : null}
      <div className="os-dreamline-cost-fields">
        <label>
          <span>Cost</span>
          <span className="os-dreamline-money-field">
            <span aria-hidden="true">$</span>
            <input
              aria-label={`${category} cost`}
              inputMode="decimal"
              min={0}
              onChange={(event) => setCost(event.currentTarget.value)}
              placeholder="0"
              step="0.01"
              type="number"
              value={cost}
            />
          </span>
        </label>
        <label>
          <span>How often</span>
          <select
            aria-label={`${category} cost cadence`}
            onChange={(event) => setCadence(event.currentTarget.value as "monthly" | "one-time")}
            value={cadence}
          >
            <option value="monthly">Monthly</option>
            <option value="one-time">One time</option>
          </select>
        </label>
      </div>
      {error ? <p className="os-dreamline-error" role="alert">{error}</p> : null}
      <div className="os-dreamline-form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Save</button>
      </div>
    </form>
  );
}

function lineCost(item: DreamlineItem, months: number) {
  const cost = item.costCents / 100;
  return item.cadence === "one-time"
    ? `${formatDreamlineMoney(cost)} once · ${formatDreamlineMoney(cost / months)}/month`
    : `${formatDreamlineMoney(cost)}/month`;
}

/**
 * One column of the worksheet. A section rather than a Page: Sai asked for
 * "setup, having, being, doing, and income all ... in the same page", which is
 * how the paper worksheet reads too — one sheet you look down, not five cards
 * you swipe between.
 */
function DreamlineLinesSection({
  category,
  onSave,
  onStar,
  record,
}: {
  category: DreamlineCategory;
  onSave: (value: DreamlineLineDraft, itemId?: string) => string;
  onStar: (item: DreamlineItem, starred: boolean) => string;
  record: DreamlineRecord;
}) {
  const items = Object.values(record.items)
    .filter((item) => item.category === category)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const label = category === "having" ? "Having" : category === "being" ? "Being" : "Doing";

  return (
    <section className="os-dreamline-section" aria-label={label}>
      <p className="os-record-label">{label}</p>
      <div className="os-dreamline-list">
        {items.map((item) =>
          editingId === item.id ? (
            <DreamlineLineForm
              category={category}
              item={item}
              key={item.id}
              onCancel={() => setEditingId(null)}
              onSave={(value) => onSave(value, item.id)}
            />
          ) : (
            <article className={item.starred ? "is-starred" : ""} key={item.id}>
              <button
                aria-label={`${item.starred ? "Unstar" : "Star"}: ${item.text}`}
                aria-pressed={item.starred}
                className="os-dreamline-star"
                onClick={() => setError(onStar(item, !item.starred))}
                type="button"
              >
                {item.starred ? "★" : "☆"}
              </button>
              <button className="os-dreamline-line-copy" onClick={() => setEditingId(item.id)} type="button">
                <strong>{item.text}</strong>
                {category === "being" ? <span>→ {item.convertedDoing}</span> : null}
                <small>{lineCost(item, record.months)}</small>
              </button>
            </article>
          ),
        )}
        {editingId === "new" ? (
          <DreamlineLineForm
            category={category}
            key={`new-${category}`}
            onCancel={() => setEditingId(null)}
            onSave={(value) => onSave(value)}
          />
        ) : null}
        {!items.length && editingId !== "new" ? (
          <p className="os-dreamline-quiet">Up to five. Star only the few you will pursue.</p>
        ) : null}
        {error ? <p className="os-dreamline-error" role="alert">{error}</p> : null}
      </div>
      {editingId || items.length >= 5 ? null : (
        <button className="os-dreamline-add" onClick={() => setEditingId("new")} type="button">
          <span aria-hidden="true">+</span> Add {label}
        </button>
      )}
    </section>
  );
}

function DreamlineStepField({
  item,
  onSave,
  step,
}: {
  item: DreamlineItem;
  onSave: (itemId: string, step: DreamlineStep, value: string) => string;
  step: DreamlineStep;
}) {
  const [draft, setDraft] = useState(item.steps[step] || "");
  const [error, setError] = useState("");

  return (
    <label className="os-dreamline-step-field">
      <span>{item.category === "being" ? item.convertedDoing : item.text}</span>
      <textarea
        aria-label={`${step} step for ${item.text}`}
        maxLength={600}
        onBlur={() => setError(onSave(item.id, step, draft))}
        onChange={(event) => setDraft(event.currentTarget.value)}
        placeholder={step === "now" ? "Something you can do from this chair." : "One clear next move."}
        rows={2}
        value={draft}
      />
      {error ? <small className="os-dreamline-error">{error}</small> : null}
    </label>
  );
}

const STEP_SECTIONS: Array<{ step: DreamlineStep; label: string; hint: string }> = [
  { step: "now", label: "Now", hint: "Something you can do from this chair." },
  { step: "tomorrow", label: "Tomorrow", hint: "One clear next move." },
  { step: "dayAfter", label: "Day After", hint: "One clear next move." },
];

/**
 * The steps sheet: Now, Tomorrow and Day After together on one Page, and the
 * Save that ends the planning.
 *
 * Saving is the hinge of the whole app. Sai: "after saving that, only then we
 * may proceed to doing the actual living, the first thing for today, and come
 * and tick complete back." Until this is pressed there is no Today Page at all.
 */
export function DreamlineStepsPage({
  committed,
  items,
  onCommit,
  onSave,
}: {
  committed: boolean;
  items: DreamlineItem[];
  onCommit: () => string;
  onSave: (itemId: string, step: DreamlineStep, value: string) => string;
}) {
  const [error, setError] = useState("");

  return (
    <PageLayout
      className="os-dreamline-page os-dreamline-steps"
      footer={
        items.length ? (
          <button
            className="os-dreamline-primary"
            onClick={() => setError(onCommit())}
            type="button"
          >
            {committed ? "Save steps" : "Save and begin"}
          </button>
        ) : null
      }
      headerLeft={<p className="os-card-label">Dreamline</p>}
      headerRight={<span className="os-card-label">Steps</span>}
      heading={<h2>What you do about it.</h2>}
      placement="content-flow"
      theme="dark"
    >
      {items.length ? (
        STEP_SECTIONS.map(({ step, label, hint }) => (
          <section className="os-dreamline-section" aria-label={label} key={step}>
            <p className="os-record-label">{label}</p>
            <p className="os-dreamline-quiet">{hint}</p>
            <div className="os-dreamline-step-list">
              {items.map((item) => (
                <DreamlineStepField
                  item={item}
                  key={`${item.id}-${step}-${item.updatedAt}`}
                  onSave={onSave}
                  step={step}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className="os-dreamline-quiet">
          Star up to four dreams on the sheet before this. Only those take steps.
        </p>
      )}
      {error ? <p className="os-dreamline-error" role="alert">{error}</p> : null}
    </PageLayout>
  );
}

/**
 * One thing, and a tick. This Page does not exist until the steps are saved.
 */
export function DreamlineTodayPage({
  onTick,
  today,
}: {
  onTick: (itemId: string, step: DreamlineStep) => string;
  today: DreamlineTodayView;
}) {
  const [error, setError] = useState("");
  const label = STEP_SECTIONS.find((section) => section.step === today.step)?.label || "";

  return (
    <PageLayout
      className="os-dreamline-page os-dreamline-today"
      footer={
        today.done || !today.step ? null : (
          <button
            className="os-dreamline-primary"
            onClick={() => setError(onTick(today.itemId, today.step as DreamlineStep))}
            type="button"
          >
            Done
          </button>
        )
      }
      headerLeft={<p className="os-card-label">Dreamline</p>}
      headerRight={<span className="os-card-label">{label || "Today"}</span>}
      heading={
        today.done ? (
          <h2>Every step you wrote is done.</h2>
        ) : (
          <h2>{today.text}</h2>
        )
      }
      placement="content-flow"
      theme="dark"
    >
      <p className="os-dreamline-quiet">
        {today.done
          ? "Write the next ones on the steps sheet, or let the Dreamline run."
          : today.item?.category === "being"
            ? today.item.convertedDoing
            : today.item?.text || ""}
      </p>
      {error ? <p className="os-dreamline-error" role="alert">{error}</p> : null}
    </PageLayout>
  );
}

export type DreamlineProgressView = {
  lines: Array<{ id: string; label: string; written: number; done: number }>;
  written: number;
  done: number;
  daysLeft: number | null;
  committed: boolean;
  sentence: string;
};

/**
 * The Dreamline's front Page: am I getting closer.
 *
 * It leads with a sentence rather than a number, because a fraction on its own
 * reads as a score and this app does not score. The counts sit under it, per
 * dream, where they answer "which one is stuck" instead of "how am I doing".
 */
export function DreamlineProgressPage({
  onOpenSheet,
  progress,
}: {
  onOpenSheet: () => void;
  progress: DreamlineProgressView;
}) {
  return (
    <PageLayout
      className="os-dreamline-page os-dreamline-progress"
      footer={
        <button className="os-dreamline-add" onClick={onOpenSheet} type="button">
          The dream
        </button>
      }
      headerLeft={<p className="os-card-label">Dreamline</p>}
      headerRight={
        progress.daysLeft === null ? undefined : (
          <span className="os-card-label">{progress.daysLeft} days left</span>
        )
      }
      heading={<h2>{progress.sentence}</h2>}
      placement="content-flow"
      theme="dark"
    >
      {progress.lines.length ? (
        <div className="os-dreamline-progress-list">
          {progress.lines.map((line) => (
            <article key={line.id}>
              <strong>{line.label}</strong>
              <span aria-label={`${line.done} of ${line.written} steps done`}>
                {Array.from({ length: line.written }, (_, index) => (
                  <i className={index < line.done ? "is-done" : ""} key={index} />
                ))}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="os-dreamline-quiet">
          Star the dreams you will actually pursue, and they appear here.
        </p>
      )}
    </PageLayout>
  );
}
