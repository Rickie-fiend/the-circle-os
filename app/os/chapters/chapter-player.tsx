"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { PageLayout, SessionIntro, SwipeSession } from "../app-session";
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
  idleFooter,
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
  idleFooter?: ReactNode;
}) {
  const required =
    Boolean(page.required) ||
    (chapter.session === "check-in" && INPUT_TYPES.has(page.type));
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
  const formId = `chapter-${chapter.id}-${page.id}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const progress = (
    <span aria-label={`Page ${current} of ${total}`}>
      {current}/{total}
    </span>
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const empty =
      value === "" || (Array.isArray(value) && value.length === 0);
    if (required && empty) return;
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
    const isIdle = page.type === "idle";
    const mainContent = isIdle ? (
      <>
        {idleBody !== undefined
          ? idleBody
          : body
            ? <p className="os-chapter-body">{body}</p>
            : null}
        {page.button && onIdleAction ? (
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
      </>
    ) : (
      <h2>{title}</h2>
    );
    const quietFooter =
      !isIdle && page.type !== "info" && !isCompletionPage ? (
        <button
          className="os-chapter-continue os-page-primary-action"
          type="button"
          onClick={() => onComplete({ page })}
        >
          {page.button || "Continue"}
        </button>
      ) : undefined;

    return (
      <PageLayout
        className={`os-chapter-card os-chapter-${page.type} theme-${chapter.theme}`}
        footer={isIdle ? idleFooter : quietFooter}
        heading={isIdle ? <h2>{title}</h2> : undefined}
        headerLeft={isIdle ? <p className="os-card-label">{chapter.session}</p> : undefined}
        headerRight={isIdle ? idleHeaderAction : !isCompletionPage ? progress : undefined}
        theme={chapter.theme}
        variant={isIdle ? "app" : "chapter"}
      >
        <div className="os-page-main">
          {mainContent}
        </div>
        <div className="os-page-sub">
          {isIdle
            ? idleContent
            : body
              ? <p className="os-chapter-body">{body}</p>
              : null}
        </div>
      </PageLayout>
    );
  }

  let subContent: ReactNode = body ? <p className="os-chapter-body">{body}</p> : null;
  let footer: ReactNode;

  if (choices.length) {
    subContent = (
      <>
        {subContent}
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
      </>
    );
    if (page.type === "multi-choice") {
      footer = (
        <button
          className="os-chapter-continue os-page-primary-action"
          type="button"
          disabled={required && (!Array.isArray(value) || !value.length)}
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
      );
    }
  }

  if (page.type === "slider") {
    subContent = (
      <form className="os-survey-slider" id={formId} onSubmit={submit}>
        {subContent}
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
      </form>
    );
    footer = (
      <button className="os-chapter-continue os-page-primary-action" form={formId} type="submit">
        {page.button || "Continue"}
      </button>
    );
  }

  if (page.type === "short-text" || page.type === "long-text") {
    subContent = (
      <form className="os-survey-text" id={formId} onSubmit={submit}>
        {subContent}
        <textarea
          aria-label={page.question || page.title}
          className="os-chapter-text-input"
          maxLength={page.type === "long-text" ? 1200 : 180}
          placeholder={page.placeholder}
          rows={page.type === "long-text" ? 4 : 1}
          value={String(value)}
          onChange={(event) => setValue(event.target.value)}
        />
      </form>
    );
    footer = (
      <button
        className="os-chapter-continue os-page-primary-action"
        disabled={required && !String(value).trim()}
        form={formId}
        type="submit"
      >
        {page.button || "Continue"}
      </button>
    );
  }

  if (page.type === "time") {
    subContent = (
      <form className="os-survey-time" id={formId} onSubmit={submit}>
        {subContent}
        <input
          aria-label={page.question || page.title}
          type="time"
          value={String(value)}
          onChange={(event) => setValue(event.target.value)}
        />
      </form>
    );
    footer = (
      <button
        className="os-chapter-continue os-page-primary-action"
        disabled={required && !value}
        form={formId}
        type="submit"
      >
        {page.button || "Continue"}
      </button>
    );
  }

  return (
    <PageLayout
      className={`os-survey-card os-chapter-card theme-${chapter.theme}`}
      footer={footer}
      headerRight={progress}
      theme={chapter.theme}
      variant="chapter"
    >
      <div className="os-page-main">
        <h2>{title}</h2>
      </div>
      <div className="os-page-sub">{subContent}</div>
    </PageLayout>
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
  idleFooter,
  idleApps = [],
  idleAppIndex = 0,
  onIdleAppIndexChange,
  backApp,
  onBackAppShown,
  onBackAppHidden,
  startOnBackApp = false,
  onLongPress,
  attentionKey,
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
  idleFooter?: ReactNode;
  idleApps?: ReactNode[];
  idleAppIndex?: number;
  onIdleAppIndexChange?: (index: number) => void;
  backApp?: ReactNode;
  onBackAppShown?: () => void;
  onBackAppHidden?: () => void;
  startOnBackApp?: boolean;
  onLongPress?: () => void;
  attentionKey?: string;
}) {
  const [showingBackApp, setShowingBackApp] = useState(startOnBackApp);
  const [leavingCompletionKey, setLeavingCompletionKey] = useState("");
  const runChangeRef = useRef(onRunChange);
  useEffect(() => {
    runChangeRef.current = onRunChange;
  }, [onRunChange]);
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
    INPUT_TYPES.has(currentPage.type) &&
    (definition.session === "check-in" || Boolean(currentPage.required));
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
      : [
          ...Array.from({ length: reviewMaxIndex + 1 }, (_, index) => index),
          ...(COMPLETION_TYPES.has(currentPage.type) && idleIndex >= 0
            ? [idleIndex]
            : []),
        ];
  const countedPages = definition.pages.filter(
    (page) =>
      page.type !== "cover" &&
      page.type !== "idle" &&
      !COMPLETION_TYPES.has(page.type),
  );
  const isCompletionPage = COMPLETION_TYPES.has(currentPage.type);
  const completionKey = `${run.runId}:${currentPage.id}:${run.updatedAt}`;
  const completionLeaving = leavingCompletionKey === completionKey;

  useEffect(() => {
    if (
      definition.session !== "check-in" ||
      run.status === "completed" ||
      !isCompletionPage
    ) {
      return;
    }

    let finishTimer: number | null = null;
    const pauseTimer = window.setTimeout(() => {
      setLeavingCompletionKey(completionKey);
      finishTimer = window.setTimeout(() => {
        runChangeRef.current(
          advanceChapterRun(definition, run, { page: currentPage }),
        );
      }, 700);
    }, 2400);

    return () => {
      window.clearTimeout(pauseTimer);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, [
    currentPage,
    completionKey,
    definition,
    isCompletionPage,
    run,
    run.status,
  ]);

  const sessionClassName =
    `os-chapter-session theme-${definition.theme} ${className}${
      completionLeaving ? " completion-exit" : ""
    }`.trim();

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
        idleFooter={idleFooter}
      />,
      ...idleApps,
    ];
    return (
      <SwipeSession
        attentionKey={attentionKey}
        availableIndices={apps.map((_, index) => index)}
        className={sessionClassName}
        index={Math.max(0, Math.min(apps.length - 1, idleAppIndex))}
        label={label}
        onLongPress={onLongPress}
        onIndexChange={(index) => onIdleAppIndexChange?.(index)}
      >
        {apps}
      </SwipeSession>
    );
  }

  function changeIndex(nextIndex: number) {
    const nextPage = definition.pages[nextIndex];
    if (!nextPage) return;
    if (
      nextPage.type === "idle" &&
      COMPLETION_TYPES.has(currentPage.type)
    ) {
      onRunChange(advanceChapterRun(definition, run, { page: currentPage }));
      return;
    }
    if (nextIndex <= furthestIndex) {
      onRunChange(moveChapterRun(definition, run, nextPage.id));
      return;
    }
    onRunChange(advanceChapterRun(definition, run, { page: currentPage }));
  }

  if (run.status !== "completed" && backApp) {
    const stackedApps = [
      <Fragment key="idle-before">{backApp}</Fragment>,
      ...definition.pages.map((page) => (
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
        idleFooter={idleFooter}
        onComplete={(submission) =>
          onRunChange(
            advanceChapterRun(definition, run, submission),
            submission,
          )
        }
      />
      )),
      ...(isCompletionPage
        ? [<Fragment key="idle-after">{backApp}</Fragment>]
        : []),
    ];
    const completionIdleIndex = stackedApps.length - 1;
    const stackedAvailableIndices = [
      0,
      ...availableIndices
        .filter((item) => item !== idleIndex)
        .map((item) => item + 1),
      ...(isCompletionPage ? [completionIdleIndex] : []),
    ];
    return (
      <SwipeSession
        attentionKey={attentionKey}
        attentionIndex={1}
        availableIndices={stackedAvailableIndices}
        className={sessionClassName}
        index={showingBackApp ? 0 : currentIndex + 1}
        label={label}
        onLongPress={onLongPress}
        maxIndex={stackedAvailableIndices.at(-1) ?? currentIndex + 1}
        onIndexChange={(index) => {
          if (isCompletionPage && index === completionIdleIndex) {
            onRunChange(
              advanceChapterRun(definition, run, { page: currentPage }),
            );
            return;
          }
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
      attentionKey={attentionKey}
      availableIndices={
        availableIndices
      }
      className={sessionClassName}
      index={currentIndex}
      label={label}
      onLongPress={onLongPress}
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
          idleFooter={idleFooter}
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
