"use client";

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  IDLE_PAGE_DWELL_MS,
  PageLayout,
  SessionIntro,
  SwipeSession,
} from "../app-session";
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

function EditableCopy({
  className,
  label,
  onChange,
  rows = 1,
  value,
}: {
  className: string;
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      aria-label={label}
      className={`os-chapter-inline-copy ${className}`}
      onChange={(event) => {
        const input = event.currentTarget;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        onChange(input.value);
        window.requestAnimationFrame(() => {
          input.focus();
          input.setSelectionRange(start, end);
        });
      }}
      ref={ref}
      rows={rows}
      value={value}
    />
  );
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
  idleLabel,
  idleBody,
  idleContent,
  idleFooter,
  hideIdleHeading,
  onEdit,
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
  idleLabel?: ReactNode;
  idleBody?: ReactNode;
  idleContent?: ReactNode;
  idleFooter?: ReactNode;
  hideIdleHeading?: boolean;
  onEdit?: (pageId: string, field: "title" | "body" | "question", value: string) => void;
}) {
  const required = Boolean(page.required);
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
  const renderedBody = renderChapterTemplate(page.body, run);
  const formId = `chapter-${chapter.id}-${page.id}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const progress = chapter.showPageNumbers === false ? undefined : (
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
    if (onEdit) {
      return (
        <PageLayout
          className={`os-cover-page os-chapter-editable-cover theme-${chapter.theme}`}
          footer={<button disabled type="button">Swipe to begin</button>}
          theme={chapter.theme}
          variant="cover"
        >
          <div className="os-session-intro-copy">
            <div className="os-info-page-main">
              <EditableCopy className="main" label="Edit cover title" onChange={(value) => onEdit(page.id, "title", value)} value={page.title || ""} />
            </div>
            <div className="os-info-page-sub">
              <EditableCopy className="sub" label="Edit cover subtitle" onChange={(value) => onEdit(page.id, "body", value)} rows={2} value={page.body || ""} />
            </div>
          </div>
        </PageLayout>
      );
    }
    return (
      <SessionIntro
        detail={renderedBody}
        label={chapter.session}
        theme={chapter.theme}
        title={title}
        onBegin={() => onComplete({ page })}
      />
    );
  }

  const isCompletionPage = COMPLETION_TYPES.has(page.type);
  const body = isCompletionPage ? "" : renderedBody;
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
    ) : onEdit ? (
      <EditableCopy className="main" label={`Edit ${page.type} title`} onChange={(value) => onEdit(page.id, "title", value)} rows={2} value={page.title || ""} />
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
        heading={isIdle && !hideIdleHeading ? <h2>{title}</h2> : undefined}
        headerLeft={isIdle ? (idleLabel ?? <p className="os-card-label">{chapter.session}</p>) : undefined}
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
            : onEdit && !isCompletionPage
              ? <EditableCopy className="sub" label={`Edit ${page.type} subtitle`} onChange={(value) => onEdit(page.id, "body", value)} rows={2} value={page.body || ""} />
              : body
                ? <p className="os-chapter-body">{body}</p>
                : null}
        </div>
      </PageLayout>
    );
  }

  let subContent: ReactNode = onEdit ? (
    <EditableCopy className="sub" label="Edit page subtitle" onChange={(value) => onEdit(page.id, "body", value)} rows={2} value={page.body || ""} />
  ) : body ? <p className="os-chapter-body">{body}</p> : null;
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
      className={`os-survey-card os-chapter-card os-chapter-${page.type} theme-${chapter.theme}`}
      footer={footer}
      headerRight={progress}
      theme={chapter.theme}
      variant="chapter"
    >
      <div className="os-page-main">
        {onEdit ? <EditableCopy className="main" label="Edit page question" onChange={(value) => onEdit(page.id, "question", value)} rows={2} value={page.question || page.title || ""} /> : <h2>{title}</h2>}
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
  idleLabel,
  idleBody,
  idleContent,
  idleFooter,
  hideIdleHeading = false,
  idleApps = [],
  idleAppIndex = 0,
  idleAppsFirst = false,
  onIdleAppIndexChange,
  rotateIdleApps = false,
  backApp,
  onBackAppShown,
  onBackAppHidden,
  startOnBackApp = false,
  onLongPress,
  attentionKey,
  exitOnFinalCompletion = false,
  previewMode = false,
  onEditPage,
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
  idleLabel?: ReactNode;
  idleBody?: ReactNode;
  idleContent?: ReactNode;
  idleFooter?: ReactNode;
  hideIdleHeading?: boolean;
  idleApps?: ReactNode[];
  idleAppIndex?: number;
  /** Puts the extra Apps before the chapter's own idle Page. */
  idleAppsFirst?: boolean;
  onIdleAppIndexChange?: (index: number) => void;
  rotateIdleApps?: boolean;
  backApp?: ReactNode;
  onBackAppShown?: () => void;
  onBackAppHidden?: () => void;
  startOnBackApp?: boolean;
  onLongPress?: () => void;
  attentionKey?: string;
  exitOnFinalCompletion?: boolean;
  previewMode?: boolean;
  onEditPage?: (pageId: string, field: "title" | "body" | "question", value: string) => void;
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
    Boolean(currentPage.required);
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
  const availableIndices = previewMode
    ? definition.pages.map((_, index) => index)
    : run.status === "completed"
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
  const canExitFinalCompletion = Boolean(
    exitOnFinalCompletion &&
    !previewMode &&
    run.status !== "completed" &&
    isCompletionPage &&
    idleIndex < 0,
  );

  useEffect(() => {
    if (
      definition.session !== "check-in" ||
      previewMode ||
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
      }, 900);
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
    previewMode,
  ]);

  const sessionClassName =
    `os-chapter-session theme-${definition.theme} ${className}${
      completionLeaving ? " completion-exit" : ""
    }`.trim();

  if (!previewMode && run.status === "completed" && idleApps.length) {
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
        idleLabel={idleLabel}
        idleBody={idleBody}
        idleContent={idleContent}
        idleFooter={idleFooter}
        hideIdleHeading={hideIdleHeading}
        onEdit={onEditPage}
      />,
    ];
    const orderedApps = idleAppsFirst ? [...idleApps, ...apps] : [...apps, ...idleApps];
    return (
      <SwipeSession
        attentionKey={attentionKey}
        availableIndices={orderedApps.map((_, index) => index)}
        className={sessionClassName}
        index={Math.max(0, Math.min(orderedApps.length - 1, idleAppIndex))}
        label={label}
        onLongPress={onLongPress}
        rotateMs={rotateIdleApps ? IDLE_PAGE_DWELL_MS : undefined}
        onIndexChange={(index) => onIdleAppIndexChange?.(index)}
      >
        {orderedApps}
      </SwipeSession>
    );
  }

  function changeIndex(nextIndex: number) {
    const nextPage = definition.pages[nextIndex];
    if (!nextPage) return;
    if (previewMode) {
      onRunChange({
        ...run,
        currentPageId: nextPage.id,
        furthestPageId: nextPage.id,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
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
        idleLabel={idleLabel}
        idleBody={idleBody}
        idleContent={idleContent}
        idleFooter={idleFooter}
        onEdit={onEditPage}
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
      onForwardBoundary={
        canExitFinalCompletion
          ? () =>
              onRunChange(
                advanceChapterRun(definition, run, { page: currentPage }),
              )
          : undefined
      }
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
          idleLabel={idleLabel}
          idleBody={idleBody}
          idleContent={idleContent}
          idleFooter={idleFooter}
          hideIdleHeading={hideIdleHeading}
          onEdit={onEditPage}
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
