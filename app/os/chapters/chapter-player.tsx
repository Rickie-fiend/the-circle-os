"use client";

import { useState, type FormEvent } from "react";
import { SessionIntro, SwipeSession } from "../app-session";
import {
  advanceChapterRun,
  findChapterAnswer,
  moveChapterRun,
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
}: {
  chapter: ChapterDefinition;
  page: ChapterPage;
  run: ChapterRun;
  current: number;
  total: number;
  onComplete: (submission: ChapterSubmission) => void;
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
        detail={page.body}
        label={chapter.session}
        theme={chapter.theme}
        title={page.title || chapter.title}
        onBegin={() => onComplete({ page })}
      />
    );
  }

  const isQuietPage = ["info", "confirm", "result", "idle"].includes(page.type);
  if (isQuietPage) {
    return (
      <div className={`os-chapter-card theme-${chapter.theme}`}>
        <div className="os-survey-head">
          <p className="os-card-label">{chapter.session}</p>
          {page.type !== "idle" ? <span>{current}/{total}</span> : null}
        </div>
        <h2>{page.title || chapter.title}</h2>
        {page.body ? <p className="os-chapter-body">{page.body}</p> : null}
        {page.type !== "idle" ? (
          <button
            className="os-chapter-continue"
            type="button"
            onClick={() => onComplete({ page })}
          >
            {page.button || "Continue"}
          </button>
        ) : null}
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
      <h2>{page.question || page.title}</h2>
      {page.body ? <p className="os-chapter-body">{page.body}</p> : null}

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
}: {
  definition: ChapterDefinition;
  run: ChapterRun;
  label: string;
  className?: string;
  onRunChange: (run: ChapterRun, submission?: ChapterSubmission) => void;
}) {
  const currentIndex = Math.max(
    0,
    definition.pages.findIndex((page) => page.id === run.currentPageId),
  );
  const currentPage = definition.pages[currentIndex];
  const currentAnswered = Boolean(
    currentPage.answerKey && findChapterAnswer(run, currentPage.answerKey),
  );
  const canMoveForward =
    run.status === "completed" ||
    !INPUT_TYPES.has(currentPage.type) ||
    currentAnswered;
  const maxIndex =
    run.status === "completed"
      ? definition.pages.length - 1
      : Math.min(
          definition.pages.length - 1,
          currentIndex + (canMoveForward ? 1 : 0),
        );
  const countedPages = definition.pages.filter(
    (page) => page.type !== "cover" && page.type !== "idle",
  );

  function changeIndex(nextIndex: number) {
    const nextPage = definition.pages[nextIndex];
    if (!nextPage) return;
    if (nextIndex < currentIndex || currentAnswered) {
      onRunChange(moveChapterRun(definition, run, nextPage.id));
      return;
    }
    onRunChange(advanceChapterRun(definition, run, { page: currentPage }));
  }

  return (
    <SwipeSession
      className={`os-chapter-session theme-${definition.theme} ${className}`.trim()}
      index={currentIndex}
      label={label}
      maxIndex={maxIndex}
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
