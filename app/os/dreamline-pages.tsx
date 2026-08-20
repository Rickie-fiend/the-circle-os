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
  currency: string;
  items: Record<string, DreamlineItem>;
  stepsCommittedAt: string | null;
  createdAt: string;
  startedAt: string;
  targetAt: string | null;
  concludedAt: string | null;
  updatedAt: string;
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

export const DREAMLINE_CURRENCY_CODES = ["USD", "MMK", "THB"] as const;
export type DreamlineCurrency = (typeof DREAMLINE_CURRENCY_CODES)[number];

/* Kyat has no minor unit in practice, so it is shown whole. Formatters are
 * built once each rather than per render. */
const moneyFormatters: Record<DreamlineCurrency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }),
  MMK: new Intl.NumberFormat("en-US", {
    style: "currency", currency: "MMK", minimumFractionDigits: 0, maximumFractionDigits: 0,
  }),
  THB: new Intl.NumberFormat("en-US", {
    style: "currency", currency: "THB", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }),
};

export function formatDreamlineMoney(value: number, currency: string = "USD") {
  const formatter =
    moneyFormatters[(currency as DreamlineCurrency)] ?? moneyFormatters.USD;
  return formatter.format(Number.isFinite(value) ? value : 0);
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

function currencySymbol(code: string) {
  return ({ USD: "$", MMK: "K", THB: "\u0e3f" } as Record<string, string>)[code] || "$";
}

function moneyInput(cents: number) {
  return cents ? String(cents / 100) : "";
}

function toCents(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}


export type DreamlineStrategyLine = {
  id: string;
  group: string;
  name: string;
  complete: boolean;
  steps: Array<{
    step: DreamlineStep;
    label: string;
    text: string;
    done: boolean;
    state: "done" | "active" | "undoable" | "locked";
  }>;
};

/**
 * The Dreamline at rest: the whole strategy, and the one step that is live.
 *
 * Sai: "those all 3 steps be visible and only able to click one after another
 * ... so that we can see the whole strategy and our goal."
 *
 * A dream is a short sequence rather than a task, and seeing the sequence is
 * the point — a watch takes three steps and all three are on the Page. Only
 * one is live: the next one not yet taken. The steps ahead of it are shown but
 * not offered, because offering step three before step one turns a plan into a
 * list, which is what made this Page confusing to read.
 *
 * The step just taken stays live so it can be given back. Sai: "when i
 * accidently click on it, and no way to revert."
 *
 * The form is deliberately its own. Routine ticks a circle, Protocol fills a
 * block, and this is a track: each step numbered and threaded to the next, so
 * the shape on the Page is the shape of the plan.
 */
export function DreamlineIdlePage({
  daysLeft,
  onEdit,
  onStep,
  strategy,
}: {
  daysLeft: number | null;
  onEdit: () => void;
  onStep: (itemId: string, step: DreamlineStep, done: boolean) => string;
  strategy: DreamlineStrategyLine[];
}) {
  const [error, setError] = useState("");
  const live = strategy.filter((line) => !line.complete).length;

  return (
    <PageLayout
      className="os-dreamline-page os-dreamline-idle"
      footer={
        daysLeft === null ? undefined : (
          <span className="os-dreamline-days-left">{daysLeft} days left</span>
        )
      }
      headerLeft={<p className="os-card-label">Dreamline</p>}
      headerRight={
        <button className="os-new-habit" onClick={onEdit} type="button">
          Edit
        </button>
      }
      heading={
        <h2>
          {!strategy.length
            ? "Nothing planned yet."
            : live
              ? "The way there."
              : "Every step is taken."}
        </h2>
      }
      placement="content-flow"
      theme="orange"
    >
      {strategy.length ? (
        <div className="os-dreamline-strategy">
          {strategy.map((line) => (
            <section
              className={`os-dreamline-goal${line.complete ? " is-complete" : ""}`}
              key={line.id}
            >
              <p className="os-dreamline-goal-name">
                <span>{line.group}</span> {line.name}
              </p>
              <ol className="os-dreamline-track">
                {line.steps.map((item, index) => {
                  const pressable = item.state === "active" || item.state === "undoable";
                  return (
                    <li
                      className={`os-dreamline-step-row is-${item.state}`}
                      key={item.step}
                    >
                      <button
                        aria-label={`${item.done ? "Undo" : "Done"}: ${item.text}`}
                        aria-pressed={item.done}
                        className="os-dreamline-step-mark"
                        disabled={!pressable}
                        onClick={() => setError(onStep(line.id, item.step, !item.done))}
                        type="button"
                      >
                        <span aria-hidden="true">{index + 1}</span>
                      </button>
                      <span className="os-dreamline-step-text">{item.text}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <p className="os-dreamline-quiet">
          Open Edit, name what you want, and give it the steps that get you there.
        </p>
      )}
      {error ? <p className="os-dreamline-error" role="alert">{error}</p> : null}
    </PageLayout>
  );
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
  onSaveSetup: (months: number, monthlyExpensesCents: number, currency: string) => string;
  onStar: (item: DreamlineItem, starred: boolean) => string;
  onStart: (months: number, monthlyExpensesCents: number, currency: string) => string;
  record: DreamlineRecord | null;
}) {
  const onSave = onSaveSetup;
  const [months, setMonths] = useState(String(record?.months || 6));
  const [expenses, setExpenses] = useState(
    moneyInput(record?.monthlyExpensesCents || 0),
  );
  const [currency, setCurrency] = useState(record?.currency || "USD");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMonths = Math.max(1, Math.min(60, Math.round(Number(months) || 6)));
    const message = record
      ? onSave(cleanMonths, toCents(expenses), currency)
      : onStart(cleanMonths, toCents(expenses), currency);
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
          <span>Currency</span>
          <select
            aria-label="Currency"
            onChange={(event) => setCurrency(event.currentTarget.value)}
            value={currency}
          >
            {DREAMLINE_CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Monthly expenses</span>
          <span className="os-dreamline-money-field">
            <span aria-hidden="true">{currencySymbol(currency)}</span>
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
                <strong>{formatDreamlineMoney(income.monthly, record.currency)}</strong>
                <span>Only starred dreams enter this number.</span>
              </div>
              <dl className="os-dreamline-income-terms">
                <div><dt>A · Having</dt><dd>{formatDreamlineMoney(income.having, record.currency)}</dd></div>
                <div><dt>B · Being</dt><dd>{formatDreamlineMoney(income.being, record.currency)}</dd></div>
                <div><dt>C · Doing</dt><dd>{formatDreamlineMoney(income.doing, record.currency)}</dd></div>
                <div><dt>Expenses × 1.3</dt><dd>{formatDreamlineMoney(income.expenseBuffer, record.currency)}</dd></div>
              </dl>
              <div className="os-dreamline-daily">
                <span>Target daily income</span>
                <strong>{formatDreamlineMoney(income.daily, record.currency)}</strong>
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

function lineCost(item: DreamlineItem, months: number, currency: string) {
  const cost = item.costCents / 100;
  return item.cadence === "one-time"
    ? `${formatDreamlineMoney(cost, currency)} once · ${formatDreamlineMoney(cost / months, currency)}/month`
    : `${formatDreamlineMoney(cost, currency)}/month`;
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
                <small>{lineCost(item, record.months, record.currency)}</small>
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
  items,
  onCommit,
  onSave,
}: {
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
            Continue
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

export type DreamlineProgressView = {
  lines: Array<{ id: string; label: string; written: number; done: number }>;
  written: number;
  done: number;
  daysLeft: number | null;
  committed: boolean;
  sentence: string;
};
