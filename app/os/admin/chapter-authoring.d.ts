import type { ChapterDefinition, ChapterPage, ChapterPageType } from "../chapters/chapter-types";

export type AuthorNote = { id: string; text: string; resolved: boolean };
export type ChapterDraft = {
  draftId: string;
  workflowStatus: "draft" | "ready" | "published";
  category: string;
  classification: "Foundation" | "Short" | "Guided Learning" | "Reflection" | "Information";
  tags: string[];
  appSpaces: string[];
  authorNotes: AuthorNote[];
  updatedAt: string;
  chapter: ChapterDefinition;
};

export const CHAPTER_PAGE_TYPES: ChapterPageType[];
export const CHAPTER_CLASSIFICATIONS: ChapterDraft["classification"][];
export function chapterSlug(value?: string): string;
export function createChapterPage(type: ChapterPageType, index?: number): ChapterPage;
export function createChapterDraft(now?: string): ChapterDraft;
export function duplicateChapterDraft(source: ChapterDraft, now?: string): ChapterDraft;
export function validateChapterDraft(draft: ChapterDraft): string[];
export function chapterDraftToMarkdown(draft: ChapterDraft): string;
export function chapterDraftToPreview(draft: ChapterDraft): ChapterDefinition;
