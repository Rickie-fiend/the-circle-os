"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { SessionIntro, SwipeSession } from "../app-session";
import {
  advanceChapterRun,
  findChapterAnswer,
  moveChapterRun,
  renderChapterTemplate,
} from "./chapter-model.js";
import type {
  ChapterAnswerValue,
  ChapterDefinition,
  ChapterPage,
  ChapterRun,
  ChapterSubmission,
} from "./chapter-types";

const INPUT_TYPES = new Set([
  "single-choice",
  "multi-choice",
  "yes-no",
  "slider",
  "short-text",
  "long-text",
  "time",
]);
const COMPLETION_TYPES = new Set(["confirm", "result"]);

function displayValue(value: ChapterAnswerValue) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function ChapterPageView({
  chapter,
  page,
  run,
  current,
  total,
  onComplete,
  onIdleAction,
  idleActionLabel,
  idleActionDisabled,
  idleActionPressed,
  idleHeaderAction,
  idleBody,
  idleContent,
}: {
  chapter: ChapterDefinition;
  page: ChapterPage;
  run: ChapterRun;
  current: number;
  total: number;
  onComplete: (submission: ChapterSubmission) => void;
  onIdleAction?: (page: ChapterPage, run: ChapterRun) => void;
  idleActionLabel?: string;
  idleActionDisabled?: boolean;
  idleActionPressed?: boolean;
  idleHeaderAction?: ReactNode;
  idleBody?: ReactNode;
  idleContent?: ReactNode;
}) {
  const answer = page.answerKey
    ? findChapterAnswer(run, page.answerKey)
    : undefined;
  const sliderDefault = Math.ceil(((page.min ?? 1) + (page.max ?? 5)) / 2);
  const initialValue =
    answer?.value ?? page.defaultValue ?? (page.type === "slider" ? sliderDefault : "");
  const [value, setValue] = useState<ChapterAnswerValue>(initialValue);
  const choices =
    page.type === "yes-no"
      ? [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
        ]
      : page.options ?? [];
  const title = renderChapterTemplate(
    page.title || page.question || chapter.title,
    run,
  );
  const body = renderChapterTemplate(page.body, run);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const empty =
      value === "" || (Array.isArray(value) && value.length === 0);
    if (page.required && empty) return;
    onComplete({
      page,
      value,
      displaySnapshot: displayValue(value),
    });
  }

  if (page.type === "cover") {
    return (
      <SessionIntro
        detail={body}
        label={chapter.session}
        theme={chapter.theme}
        title={title}
        onBegin={() => onComplete({ page })}
      />
    );
  }

  const isCompletionPage = COMPLETION_TYPES.has(page.type);
  const isQuietPage = ["info", "confirm", "result", "idle"].includes(page.type);
  if (isQuietPage) {
    return (
      <div
        className={`os-chapter-card os-chapter-${page.type} theme-${chapter.theme}`}
      >
        <div className="os-survey-head">
          <p className="os-card-label">{chapter.session}</p>
          {page.type === "idle" ? (
            idleHeaderAction
          ) : !isCompletionPage ? (
            <span>{current}/{total}</span>
          ) : null}
        </div>
        <h2>{title}</h2>
        {page.type === "idle" && idleBody !== undefined
          ? idleBody
          : body
            ? <p className="os-chapter-body">{body}</p>
            : null}
        {page.type !== "idle" && page.type !== "info" ? (
          <button
            className="os-chapter-continue"
            type="button"
            onClick={() => onComplete({ page })}
          >
            {page.button || "Continue"}
          </button>
        ) : null}
        {page.type === "idle" && page.button && onIdleAction ? (
          <button
            className="os-chapter-continue os-chapter-idle-action"
            type="button"
            aria-pressed={idleActionPressed}
            disabled={idleActionDisabled}
            onClick={() => onIdleAction(page, run)}
          >
            {idleActionLabel || page.button}
          </button>
        ) : null}
        {page.type === "idle" ? idleContent : null}
      </div>
    );
  }

  return (
    <div className={`os-survey-card os-chapter-card theme-${chapter.theme}`}>
      <div className="os-survey-head">
        <p className="os-card-label">{chapter.session}</p>
        <span aria-label={`Page ${current} of ${total}`}>
          {current}/{total}
        </span>
      </div>
      <h2>{title}</h2>
      {body ? <p className="os-chapter-body">{body}</p> : null}

      {choices.length ? (
        <div
          className={`os-survey-choices${choices.length > 2 ? " many" : ""}`}
          role="group"
          aria-label={page.question || page.title}
        >
          {choices.map((choice) => {
            const selected = Array.isArray(value)
              ? value.includes(choice.id)
              : value === choice.id;
            return (
              <button
                aria-pressed={selected}
                className={selected ? "selected" : ""}
                key={choice.id}
                type="button"
                onClick={() => {
                  if (page.type === "multi-choice") {
                    const selectedValues = Array.isArray(value) ? value : [];
                    setValue(
                      selected
                        ? selectedValues.filter((item) => item !== choice.id)
                        : [...selectedValues, choice.id],
                    );
                    return;
                  }
                  onComplete({
                    page,
                    value: choice.id,
                    displaySnapshot: choice.label,
                  });
                }}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {page.type === "multi-choice" ? (
        <button
          className="os-chapter-continue"
          type="button"
          disabled={page.required && (!Array.isArray(value) || !value.length)}
          onClick={() =>
            onComplete({
              page,
              value,
              displaySnapshot: displayValue(value),
            })
          }
        >
          {page.button || "Continue"}
        </button>
      ) : null}

      {page.type === "slider" ? (
        <form className="os-survey-slider" onSubmit={submit}>
          <output>{String(value)}</output>
          <input
            aria-label={page.question || page.title}
            max={page.max ?? 5}
            min={page.min ?? 1}
            type="range"
            value={String(value)}
            onChange={(event) => setValue(Number(event.target.value))}
          />
          <div aria-hidden="true">
            <span>{page.minLabel}</span>
            <span>{page.maxLabel}</span>
          </div>
          <button type="submit">{page.button || "Continue"}</button>
        </form>
      ) : null}

      {page.type === "short-text" || page.type === "long-text" ? (
        <form className="os-survey-text" onSubmit={submit}>
          {page.type === "long-text" ? (
            <textarea
              aria-label={page.question || page.title}
              maxLength={1200}
              placeholder={page.placeholder}
              rows={5}
              value={String(value)}
              onChange={(event) => setValue(event.target.value)}
            />
          ) : (
            <input
              aria-label={page.question || page.title}
              maxLength={180}
              placeholder={page.placeholder}
              value={String(value)}
              onChange={(event) => setValue(event.target.value)}
            />
          )}
          <button
            type="submit"
            disabled={page.required && !String(value).trim()}
          >
            {page.button || "Continue"}
          </button>
        </form>
      ) : null}

      {page.type === "time" ? (
        <form className="os-survey-time" onSubmit={submit}>
          <input
            aria-label={page.question || page.title}
            type="time"
            value={String(value)}
            onChange={(event) => setValue(event.target.value)}
          />
          <button type="submit" disabled={page.required && !value}>
            {page.button || "Continue"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function ChapterPlayer({
  definition,
  run,
  label,
  className = "",
  onRunChange,
  onIdleAction,
  idleActionLabel,
  idleActionDisabled = false,
  idleActionPressed = false,
  idleHeaderAction,
  idleBody,
  idleContent,
  idleApps = [],
  idleAppIndex = 0,
  onIdleAppIndexChange,
  backApp,
  onBackAppShown,
  onBackAppHidden,
  startOnBackApp = false,
}: {
  definition: ChapterDefinition;
  run: ChapterRun;
  label: string;
  className?: string;
  onRunChange: (run: ChapterRun, submission?: ChapterSubmission) => void;
  onIdleAction?: (page: ChapterPage, run: ChapterRun) => void;
  idleActionLabel?: string;
  idleActionDisabled?: boolean;
  idleActionPressed?: boolean;
  idleHeaderAction?: ReactNode;
  idleBody?: ReactNode;
  idleContent?: ReactNode;
  idleApps?: ReactNode[];
  idleAppIndex?: number;
  onIdleAppIndexChange?: (index: number) => void;
  backApp?: ReactNode;
  onBackAppShown?: () => void;
  onBackAppHidden?: () => void;
  startOnBackApp?: boolean;
}) {
  const [showingBackApp, setShowingBackApp] = useState(startOnBackApp);
  const currentIndex = Math.max(
    0,
    definition.pages.findIndex((page) => page.id === run.currentPageId),
  );
  const currentPage = definition.pages[currentIndex];
  const furthestIndex = Math.max(
    currentIndex,
    definition.pages.findIndex(
      (page) => page.id === (run.furthestPageId || run.currentPageId),
    ),
  );
  const currentAnswered = Boolean(
    currentPage.answerKey && findChapterAnswer(run, currentPage.answerKey),
  );
  const currentAnswerRequired =
    INPUT_TYPES.has(currentPage.type) && Boolean(currentPage.required);
  const canMoveForward =
    run.status === "completed" ||
    !currentAnswerRequired ||
    currentAnswered;
  const idleIndex = definition.pages.findIndex((page) => page.type === "idle");
  const lastDraftIndex =
    idleIndex >= 0 ? idleIndex - 1 : definition.pages.length - 1;
  const reviewMaxIndex = Math.min(
    lastDraftIndex,
    Math.max(furthestIndex, currentIndex + (canMoveForward ? 1 : 0)),
  );
  const availableIndices =
    run.status === "completed"
      ? [idleIndex >= 0 ? idleIndex : currentIndex]
      : Array.from({ length: reviewMaxIndex + 1 }, (_, index) => index);
  const countedPages = definition.pages.filter(
    (page) =>
      page.type !== "cover" &&
      page.type !== "idle" &&
      !COMPLETION_TYPES.has(page.type),
  );

  if (run.status === "completed" && idleApps.length) {
    const idlePage = definition.pages[idleIndex >= 0 ? idleIndex : currentIndex];
    const apps = [
      <ChapterPageView
        chapter={definition}
        current={Math.max(1, countedPages.findIndex((item) => item.id === idlePage.id) + 1)}
        key={idlePage.id}
        page={idlePage}
        run={run}
        total={Math.max(1, countedPages.length)}
        onComplete={() => undefined}
        onIdleAction={onIdleAction}
        idleActionLabel={idleActionLabel}
        idleActionDisabled={idleActionDisabled}
        idleActionPressed={idleActionPressed}
        idleHeaderAction={idleHeaderAction}
        idleBody={idleBody}
        idleContent={idleContent}
      />,
      ...idleApps,
    ];
    return (
      <SwipeSession
        availableIndices={apps.map((_, index) => index)}
        className={`os-chapter-session theme-${definition.theme} ${className}`.trim()}
        index={Math.max(0, Math.min(apps.length - 1, idleAppIndex))}
        label={label}
        onIndexChange={(index) => onIdleAppIndexChange?.(index)}
      >
        {apps}
      </SwipeSession>
    );
  }

  function changeIndex(nextIndex: number) {
    const nextPage = definition.pages[nextIndex];
    if (!nextPage) return;
    if (nextIndex <= furthestIndex) {
      onRunChange(moveChapterRun(definition, run, nextPage.id));
      return;
    }
    onRunChange(advanceChapterRun(definition, run, { page: currentPage }));
  }

  if (run.status !== "completed" && backApp) {
    const stackedApps = [backApp, ...definition.pages.map((page) => (
      <ChapterPageView
        chapter={definition}
        current={Math.max(1, countedPages.findIndex((item) => item.id === page.id) + 1)}
        key={page.id}
        page={page}
        run={run}
        total={Math.max(1, countedPages.length)}
        onIdleAction={onIdleAction}
        idleActionLabel={idleActionLabel}
        idleActionDisabled={idleActionDisabled}
        idleActionPressed={idleActionPressed}
        idleHeaderAction={idleHeaderAction}
        idleBody={idleBody}
        idleContent={idleContent}
        onComplete={(submission) =>
          onRunChange(
            advanceChapterRun(definition, run, submission),
            submission,
          )
        }
      />
    ))];
    const stackedAvailableIndices = [0, ...availableIndices.map((item) => item + 1)];
    return (
      <SwipeSession
        availableIndices={stackedAvailableIndices}
        className={`os-chapter-session theme-${definition.theme} ${className}`.trim()}
        index={showingBackApp ? 0 : currentIndex + 1}
        label={label}
        maxIndex={stackedAvailableIndices.at(-1) ?? currentIndex + 1}
        onIndexChange={(index) => {
          if (index === 0) {
            if (!showingBackApp) {
              setShowingBackApp(true);
              onBackAppShown?.();
            }
            return;
          }
          if (showingBackApp) onBackAppHidden?.();
          setShowingBackApp(false);
          changeIndex(index - 1);
        }}
      >
        {stackedApps}
      </SwipeSession>
    );
  }

  return (
    <SwipeSession
      availableIndices={
        availableIndices
      }
      className={`os-chapter-session theme-${definition.theme} ${className}`.trim()}
      index={currentIndex}
      label={label}
      maxIndex={availableIndices.at(-1) ?? currentIndex}
      onIndexChange={changeIndex}
    >
      {definition.pages.map((page) => (
        <ChapterPageView
          chapter={definition}
          current={Math.max(1, countedPages.findIndex((item) => item.id === page.id) + 1)}
          key={page.id}
          page={page}
          run={run}
          total={Math.max(1, countedPages.length)}
          onIdleAction={onIdleAction}
          idleActionLabel={idleActionLabel}
          idleActionDisabled={idleActionDisabled}
          idleActionPressed={idleActionPressed}
          idleHeaderAction={idleHeaderAction}
          idleBody={idleBody}
          idleContent={idleContent}
          onComplete={(submission) =>
            onRunChange(
              advanceChapterRun(definition, run, submission),
              submission,
            )
          }
        />
      ))}
    </SwipeSession>
  );
}
