"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageLayout } from "../app-session";
import { ButtonRewardBackdrop, CreativeButton } from "../button-engine";
import { BUTTON_STYLE_DEFINITIONS, BUTTON_STYLE_IDS, type ButtonStyleId } from "../button-engine-model.js";
import { ChapterPlayer } from "../chapters/chapter-player";
import { createChapterRun } from "../chapters/chapter-model.js";
import { publishedChapters } from "../chapters/registry";
import {
  writeChapterPublication,
  writeImmutableChapterPublication,
} from "../chapters/chapter-publication-store";
import type { AppTarget, ChapterPage, ChapterPageType, ChapterRun, ChapterTheme } from "../chapters/chapter-types";
import { publishPublicChapter } from "../circle-os-ai";
import { loadCircleState } from "../circle-os-store";
import {
  CHAPTER_CLASSIFICATIONS,
  CHAPTER_PAGE_TYPES,
  FIRST_USE_APP_SPACES,
  chapterDefinitionToDraft,
  chapterDraftToMarkdown,
  chapterDraftToPreview,
  chapterSlug,
  createChapterDraft,
  createChapterPage,
  createFirstUseChapterDraft,
  createNextVersionDraft,
  duplicateChapterDraft,
  validateChapterDraft,
  type ChapterDraft,
} from "./chapter-authoring.js";
import { readChapterDrafts, removeChapterDraft, writeChapterDraft } from "./chapter-draft-store";

type AdminModule = "chapters" | "buttons";
type ChapterView = "library" | "workshop";
type LibraryKind = "draft" | "starter" | "published";
type LibraryItem = { draft: ChapterDraft; kind: LibraryKind };
type ButtonStudioDraft = {
  styleId: ButtonStyleId;
  label: string;
  stylePrompt: string;
  rewardPreviewEnabled: boolean;
};

const INPUT_TYPES = new Set<ChapterPageType>(["single-choice", "multi-choice", "yes-no", "slider", "short-text", "long-text", "time"]);
const CUSTOM_FOOTER_TYPES = new Set<ChapterPageType>(["multi-choice", "slider", "short-text", "long-text", "time"]);
const AUTHORABLE_PAGE_TYPES = CHAPTER_PAGE_TYPES.filter((type) => type !== "idle");
const CHAPTER_THEMES: { label: string; value: ChapterTheme; color: string }[] = [
  { label: "Light", value: "light", color: "#f1efe8" },
  { label: "Orange", value: "orange", color: "#df642d" },
  { label: "Dark", value: "dark", color: "#222119" },
];
const BUTTON_STUDIO_STORAGE_KEY = "circle-os-button-studio-draft-v1";
const APP_TARGETS: { label: string; value: AppTarget }[] = [
  { label: "Note", value: "note" },
  { label: "Thoughts", value: "thoughts" },
  { label: "Habit", value: "habit" },
  { label: "Log", value: "log" },
  { label: "Vision", value: "vision" },
  { label: "Seven days", value: "seven-days" },
  { label: "Athena", value: "athena" },
];

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="os-admin-field"><span>{label}</span>{children}</label>;
}

function pageLabel(value: string) {
  return value.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function downloadMarkdown(draft: ChapterDraft) {
  const blob = new Blob([chapterDraftToMarkdown(draft)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${draft.chapter.id || "chapter-draft"}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadButtonStudioDraft(draft: ButtonStudioDraft) {
  const payload = {
    ...draft,
    exportedAt: new Date().toISOString(),
    note: "Saved for Codex. No AI or asset generation runs in this version.",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "circle-os-button-style.json";
  link.click();
  URL.revokeObjectURL(url);
}

function ThemePicker({ value, onChange, label = "Chapter theme" }: { value: ChapterTheme; onChange: (theme: ChapterTheme) => void; label?: string }) {
  return (
    <div className="os-admin-theme-picker" role="group" aria-label={label}>
      {CHAPTER_THEMES.map((theme) => (
        <button aria-label={theme.label} aria-pressed={theme.value === value} key={theme.value} type="button" onClick={() => onChange(theme.value)}>
          <span style={{ background: theme.color }} />
          {theme.label}
        </button>
      ))}
    </div>
  );
}

function ButtonStudio() {
  const [styleId, setStyleId] = useState<ButtonStyleId>("default");
  const [label, setLabel] = useState("Send");
  const [background, setBackground] = useState(true);
  const [stylePrompt, setStylePrompt] = useState("");
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(BUTTON_STUDIO_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<ButtonStudioDraft>;
          if (parsed.styleId && BUTTON_STYLE_IDS.includes(parsed.styleId)) setStyleId(parsed.styleId);
          if (typeof parsed.label === "string") setLabel(parsed.label);
          if (typeof parsed.stylePrompt === "string") setStylePrompt(parsed.stylePrompt);
          if (typeof parsed.rewardPreviewEnabled === "boolean") setBackground(parsed.rewardPreviewEnabled);
        }
      } catch {
        // A damaged local preview draft should never block the Studio.
      } finally {
        setDraftReady(true);
      }
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const next: ButtonStudioDraft = { styleId, label, stylePrompt, rewardPreviewEnabled: background };
    window.localStorage.setItem(BUTTON_STUDIO_STORAGE_KEY, JSON.stringify(next));
  }, [background, draftReady, label, styleId, stylePrompt]);

  const studioDraft: ButtonStudioDraft = { styleId, label, stylePrompt, rewardPreviewEnabled: background };

  return (
    <section className="os-button-studio" aria-label="Button Studio">
      <div className="os-admin-section-head"><div><p>Button Engine</p><h2>Button Studio</h2></div></div>
      <p className="os-admin-preview-note">Choose an approved design, edit its label, and tap the live button. The Background switch previews the App Box treatment without changing the button.</p>
      <div className={`os-button-studio-stage style-${styleId}`}>
        <ButtonRewardBackdrop active={background} staticPreview styleId={styleId} />
        <PageLayout
          className="os-button-studio-page"
          footer={
            <CreativeButton
              previewMode
              styleId={styleId}
              type="button"
            >
              {label || "Button"}
            </CreativeButton>
          }
          headerLeft={<span className="os-card-label">Live preview</span>}
          headerRight={
            <label className="os-button-studio-reward-toggle">
              <input checked={background} type="checkbox" onChange={(event) => setBackground(event.target.checked)} />
              <span>Background</span>
            </label>
          }
          theme="light"
          variant="app"
        >
          <div className="os-page-main"><h3>Button in motion</h3></div>
          <div className="os-page-sub" />
        </PageLayout>
      </div>
      <div className="os-button-studio-grid">
        {BUTTON_STYLE_IDS.map((id) => {
          const definition = BUTTON_STYLE_DEFINITIONS[id];
          return <button aria-pressed={styleId === id} key={id} type="button" onClick={() => setStyleId(id)}><strong>{definition.name}</strong><span>{definition.tags.join(" · ")}</span></button>;
        })}
      </div>
      <div className="os-admin-panel os-button-studio-settings">
        <Field label="Button label"><input maxLength={32} value={label} onChange={(event) => setLabel(event.target.value)} /></Field>
        <Field label="Button style prompt"><textarea placeholder="Describe how this button should feel or move." rows={5} value={stylePrompt} onChange={(event) => setStylePrompt(event.target.value)} /></Field>
        <button className="os-button-studio-export" type="button" onClick={() => downloadButtonStudioDraft(studioDraft)}>Export for Codex</button>
      </div>
    </section>
  );
}

export function ChapterEditor() {
  const [module, setModule] = useState<AdminModule>("chapters");
  const [view, setView] = useState<ChapterView>("library");
  const [drafts, setDrafts] = useState<ChapterDraft[]>([]);
  const [draft, setDraft] = useState<ChapterDraft>(() => createChapterDraft());
  const [activeKind, setActiveKind] = useState<LibraryKind>("draft");
  const [selectedPage, setSelectedPage] = useState(0);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState("Saved on this device");
  const [publishState, setPublishState] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [lastAction, setLastAction] = useState<"" | "saved" | "ready" | "published">("");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | LibraryKind>("all");
  const [appFilter, setAppFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState<"all" | ChapterTheme>("all");
  const [starters] = useState(() => FIRST_USE_APP_SPACES.map((space) => createFirstUseChapterDraft(space)));
  const published = useMemo(() => publishedChapters.map((chapter) => chapterDefinitionToDraft(chapter)), []);
  const preview = useMemo(() => chapterDraftToPreview(draft), [draft]);
  const [previewRun, setPreviewRun] = useState<ChapterRun>(() => createChapterRun(chapterDraftToPreview(createChapterDraft())));
  const errors = useMemo(() => validateChapterDraft(draft), [draft]);
  const page = draft.chapter.pages[Math.min(selectedPage, draft.chapter.pages.length - 1)] || draft.chapter.pages[0];
  const previewPageIndex = Math.max(0, preview.pages.findIndex((item) => item.id === previewRun.currentPageId));

  const libraryItems = useMemo(() => {
    const items: LibraryItem[] = [
      ...drafts.map((item) => ({ draft: item, kind: "draft" as const })),
      ...starters.map((item) => ({ draft: item, kind: "starter" as const })),
      ...published.map((item) => ({ draft: item, kind: "published" as const })),
    ];
    const term = search.trim().toLowerCase();
    return items.filter(({ draft: item, kind }) => {
      if (kindFilter !== "all" && kind !== kindFilter) return false;
      if (appFilter !== "all" && !item.appSpaces.includes(appFilter)) return false;
      if (themeFilter !== "all" && item.chapter.theme !== themeFilter) return false;
      if (!term) return true;
      return [item.chapter.title, item.chapter.id, item.category, item.classification, ...item.tags, ...item.appSpaces].join(" ").toLowerCase().includes(term);
    });
  }, [appFilter, drafts, kindFilter, published, search, starters, themeFilter]);
  const libraryGroups = useMemo(
    () => CHAPTER_CLASSIFICATIONS
      .map((classification) => ({
        classification,
        items: libraryItems.filter(({ draft: item }) => item.classification === classification),
      }))
      .filter((group) => group.items.length > 0),
    [libraryItems],
  );

  useEffect(() => {
    readChapterDrafts().then((stored) => {
      if (stored.length) { setDrafts(stored); setDraft(stored[0]); return; }
      const first = createChapterDraft(); setDrafts([first]); setDraft(first); return writeChapterDraft(first);
    }).catch(() => { const first = createChapterDraft(); setDrafts([first]); setDraft(first); }).finally(() => setReady(true));
  }, []);

  function updateDraft(change: (current: ChapterDraft) => ChapterDraft) {
    setSaveState("Unsaved changes");
    setLastAction("");
    setDraft((current) => { const next = change(structuredClone(current)); next.workflowStatus = "draft"; return next; });
  }

  function updateChapter(key: keyof ChapterDraft["chapter"], value: unknown) {
    updateDraft((next) => { (next.chapter as unknown as Record<string, unknown>)[key] = value; return next; });
  }

  function updatePage(key: keyof ChapterPage, value: unknown) {
    updateDraft((next) => { (next.chapter.pages[selectedPage] as unknown as Record<string, unknown>)[key] = value; return next; });
  }

  function editPreviewPage(pageId: string, field: "title" | "body" | "question", value: string) {
    const index = draft.chapter.pages.findIndex((item) => item.id === pageId);
    if (index < 0) return;
    setSelectedPage(index);
    updateDraft((next) => { next.chapter.pages[index][field] = value; return next; });
  }

  function changePageType(type: ChapterPageType) {
    updateDraft((next) => {
      const current = next.chapter.pages[selectedPage];
      const replacement = createChapterPage(type, selectedPage);
      next.chapter.pages[selectedPage] = { ...replacement, id: current.id, title: current.title || replacement.title, body: current.body || replacement.body };
      return next;
    });
  }

  async function persistDraft(next: ChapterDraft) {
    await writeChapterDraft(next); setDraft(next); setDrafts((current) => [next, ...current.filter((item) => item.draftId !== next.draftId)]); setActiveKind("draft");
  }

  async function saveDraft(workflowStatus = draft.workflowStatus) {
    const next = { ...structuredClone(draft), workflowStatus, updatedAt: new Date().toISOString() };
    await persistDraft(next); setSaveState(workflowStatus === "ready" ? "Ready for approval" : "Saved on this device");
    setLastAction(workflowStatus === "ready" ? "ready" : "saved");
  }

  async function publishChapter(scope: "private" | "public") {
    if (errors.length || publishing) return;
    const targetApp = draft.appSpaces[0] as AppTarget | undefined;
    if (!targetApp || !APP_TARGETS.some((item) => item.value === targetApp)) {
      setPublishState("Choose one destination app before publishing.");
      return;
    }
    if (scope === "public" && !window.confirm("Publish this chapter for everyone?")) return;
    setPublishing(true);
    setPublishState(scope === "private" ? "Publishing on this device…" : "Publishing to Circle OS…");
    try {
      const publishedDraft = {
        ...structuredClone(draft),
        workflowStatus: "published" as const,
        updatedAt: new Date().toISOString(),
      };
      const chapter = chapterDraftToPreview(publishedDraft);
      const source = chapterDraftToMarkdown(publishedDraft);
      const state = await loadCircleState();
      const audienceProfileId = state.ai.profileId || "local";
      if (scope === "public") {
        await publishPublicChapter(state, chapter, source);
        await writeChapterPublication({
          visibility: scope,
          source: "admin",
          publishedAt: publishedDraft.updatedAt,
          chapter,
          targetApp,
          audienceProfileId: "public",
          delivery: "manual",
        });
      } else {
        await writeImmutableChapterPublication({
          visibility: scope,
          source: "admin",
          publishedAt: publishedDraft.updatedAt,
          chapter,
          targetApp,
          audienceProfileId,
          delivery: "manual",
        });
      }
      await persistDraft(publishedDraft);
      setSaveState(scope === "private" ? "Published on this device" : "Published for connected Circle OS users");
      setPublishState(scope === "private" ? "Private chapter published." : "Public chapter published.");
      setLastAction("published");
    } catch (error) {
      setPublishState(error instanceof Error ? error.message : "The chapter was not published.");
    } finally {
      setPublishing(false);
    }
  }

  function openWorkshop(next: ChapterDraft, kind: LibraryKind) {
    const definition = chapterDraftToPreview(next);
    setDraft(structuredClone(next)); setActiveKind(kind); setSelectedPage(0); setPreviewRun(createChapterRun(definition)); setSaveState(kind === "draft" ? "Saved on this device" : kind === "starter" ? "Starter preview" : "Published preview"); setView("workshop");
  }

  async function newDraft() { const next = createChapterDraft(); await persistDraft(next); openWorkshop(next, "draft"); }
  async function createFromStarter(source: ChapterDraft) { const next = createFirstUseChapterDraft(source.appSpaces[0]); next.chapter.theme = source.chapter.theme; await persistDraft(next); openWorkshop(next, "draft"); }
  async function newPublishedVersion(source: ChapterDraft) { const next = createNextVersionDraft(source); await persistDraft(next); openWorkshop(next, "draft"); }
  async function copyDraft(source: ChapterDraft) { const next = duplicateChapterDraft(source); await persistDraft(next); openWorkshop(next, "draft"); }

  async function deleteDraft(source: ChapterDraft) {
    if (!window.confirm(`Delete “${source.chapter.title}” from this device?`)) return;
    await removeChapterDraft(source.draftId);
    const remaining = drafts.filter((item) => item.draftId !== source.draftId);
    if (!remaining.length) { const first = createChapterDraft(); await writeChapterDraft(first); setDrafts([first]); setDraft(first); return; }
    setDrafts(remaining); if (source.draftId === draft.draftId) setDraft(remaining[0]);
  }

  function addPage() {
    updateDraft((next) => { const insertAt = Math.max(1, next.chapter.pages.length - 1); next.chapter.pages.splice(insertAt, 0, createChapterPage("info", insertAt)); setSelectedPage(insertAt); return next; });
  }

  function duplicatePage() {
    if (selectedPage === 0 || selectedPage === draft.chapter.pages.length - 1) return;
    updateDraft((next) => { const copy = structuredClone(next.chapter.pages[selectedPage]); copy.id = `${copy.id}-copy`; next.chapter.pages.splice(selectedPage + 1, 0, copy); setSelectedPage(selectedPage + 1); return next; });
  }

  function movePage(direction: -1 | 1) {
    updateDraft((next) => { const target = selectedPage + direction; if (selectedPage === 0 || selectedPage === next.chapter.pages.length - 1 || target <= 0 || target >= next.chapter.pages.length - 1) return next; [next.chapter.pages[selectedPage], next.chapter.pages[target]] = [next.chapter.pages[target], next.chapter.pages[selectedPage]]; setSelectedPage(target); return next; });
  }

  function deletePage() {
    if (selectedPage === 0 || selectedPage >= draft.chapter.pages.length - 1) return;
    updateDraft((next) => { next.chapter.pages.splice(selectedPage, 1); setSelectedPage(Math.max(0, selectedPage - 1)); return next; });
  }

  function jumpPreview(pageId: string) {
    const index = draft.chapter.pages.findIndex((item) => item.id === pageId);
    if (index >= 0) setSelectedPage(index);
    setPreviewRun((current) => ({ ...current, currentPageId: pageId, furthestPageId: pageId, updatedAt: new Date().toISOString() }));
  }

  function openDraftForPublish(next: ChapterDraft) {
    const validation = validateChapterDraft(next);
    const firstIncompletePage = next.chapter.pages.findIndex((item) => {
      if (!item.id.trim()) return true;
      if (["cover", "info", "result", "confirm"].includes(item.type)) {
        return !item.title?.trim() || item.title.trim() === "Edit Here";
      }
      if (INPUT_TYPES.has(item.type)) {
        return !item.question?.trim() || item.question.trim() === "Edit Here";
      }
      return false;
    });
    openWorkshop(next, "draft");
    if (validation.length > 0) {
      const target = firstIncompletePage >= 0 ? firstIncompletePage : 0;
      const definition = chapterDraftToPreview(next);
      setSelectedPage(target);
      const run = createChapterRun(definition);
      setPreviewRun({
        ...run,
        currentPageId: next.chapter.pages[target]?.id || run.currentPageId,
        furthestPageId: next.chapter.pages[target]?.id || run.furthestPageId,
      });
      setPublishState("Finish the highlighted page, then publish.");
      return;
    }
    setPublishState("Ready to publish. Choose the destination below.");
  }

  function syncPreviewRun(next: ChapterRun) {
    setPreviewRun(next);
    const index = draft.chapter.pages.findIndex((item) => item.id === next.currentPageId);
    if (index >= 0) setSelectedPage(index);
  }

  function chooseTheme(theme: ChapterTheme) {
    if (activeKind === "draft") updateChapter("theme", theme);
    else setDraft((current) => ({ ...structuredClone(current), chapter: { ...current.chapter, theme } }));
  }

  if (!ready) return <main className="os-admin"><p className="os-admin-loading">Opening chapter library…</p></main>;

  return (
    <main className="os-admin">
      <header className="os-admin-head"><div><p>Admin mode</p><h1>{module === "chapters" ? "Chapter Workshop" : "Button Studio"}</h1></div><span>{module === "chapters" ? saveState : "Safe preview"}</span></header>
      <div className="os-admin-modules" role="tablist" aria-label="Admin tools">
        <button aria-selected={module === "chapters"} role="tab" type="button" onClick={() => setModule("chapters")}>Chapters</button>
        <button aria-selected={module === "buttons"} role="tab" type="button" onClick={() => setModule("buttons")}>Button Studio</button>
      </div>

      {module === "buttons" ? <ButtonStudio /> : null}

      {module === "chapters" && view === "library" ? (
        <section className="os-admin-library" aria-label="Chapter library">
          <div className="os-admin-section-head"><div><p>Library</p><h2>{libraryItems.length} chapters to explore</h2></div><button type="button" onClick={newDraft}>Blank chapter</button></div>
          <div className="os-admin-library-tools">
            <Field label="Search"><input placeholder="Title, tag, or app" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></Field>
            <Field label="Source"><select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)}><option value="all">All sources</option><option value="draft">My drafts</option><option value="starter">First-use starters</option><option value="published">Published versions</option></select></Field>
            <Field label="App"><select value={appFilter} onChange={(event) => setAppFilter(event.target.value)}><option value="all">All apps</option>{FIRST_USE_APP_SPACES.map((space) => <option key={space} value={space}>{pageLabel(space)}</option>)}</select></Field>
            <Field label="Theme"><select value={themeFilter} onChange={(event) => setThemeFilter(event.target.value as typeof themeFilter)}><option value="all">All themes</option>{CHAPTER_THEMES.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}</select></Field>
          </div>
          <div className="os-admin-draft-list">
            {libraryGroups.map((group) => (
              <details className="os-admin-library-group" key={group.classification} open>
                <summary className="os-admin-library-group-head">
                  <h3>{group.classification}</h3>
                  <span>{group.items.length}</span>
                </summary>
                <div className="os-admin-library-group-items">
                  {group.items.map(({ draft: item, kind }) => <article key={`${kind}-${item.draftId}`}><button className="os-admin-draft-open" type="button" onClick={() => openWorkshop(item, kind)}><span>{kind === "starter" ? "First-use starter" : kind === "published" ? "Published" : item.workflowStatus} · {item.appSpaces.map(pageLabel).join(", ")}</span><strong>{item.chapter.title}</strong><small>{chapterDraftToPreview(item).pages.length} pages · v{item.chapter.version} · {item.category}</small></button><div className={kind === "draft" ? "three" : ""}><button type="button" onClick={() => kind === "draft" ? openDraftForPublish(item) : openWorkshop(item, kind)}>{kind === "draft" ? "Publish" : "Open"}</button>{kind === "draft" ? <><button type="button" onClick={() => copyDraft(item)}>Duplicate</button><button type="button" onClick={() => deleteDraft(item)}>Delete</button></> : null}{kind === "starter" ? <button type="button" onClick={() => createFromStarter(item)}>Use template</button> : null}{kind === "published" ? <button type="button" onClick={() => newPublishedVersion(item)}>Create next version</button> : null}</div></article>)}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {module === "chapters" && view === "workshop" ? (
        <section className="os-admin-workshop" aria-label="Chapter Workshop">
          <div className="os-admin-workshop-bar"><button type="button" onClick={() => setView("library")}>← Library</button><span>{activeKind === "draft" ? "Tap the page text to edit" : activeKind === "starter" ? "Starter preview" : "Published preview"}</span></div>
          <div className="os-admin-workshop-title"><div><p>{activeKind === "draft" ? "Live editor" : "Preview"}</p><h2>{draft.chapter.title}</h2></div><ThemePicker value={draft.chapter.theme} onChange={chooseTheme} /></div>
          <div className="os-admin-preview-pages" aria-label="Chapter pages">{preview.pages.map((item, index) => <button aria-pressed={index === previewPageIndex} key={item.id} type="button" onClick={() => jumpPreview(item.id)}><span>{index + 1}</span>{pageLabel(item.type)}</button>)}</div>
          {activeKind === "draft" ? <div className="os-admin-preview-order"><button disabled={selectedPage <= 1} type="button" onClick={() => movePage(-1)}>Move earlier</button><button disabled={selectedPage === 0 || selectedPage >= draft.chapter.pages.length - 2} type="button" onClick={() => movePage(1)}>Move later</button></div> : null}
          <ChapterPlayer definition={preview} label="Editable chapter preview" onEditPage={activeKind === "draft" ? editPreviewPage : undefined} previewMode run={previewRun} onRunChange={syncPreviewRun} />
          {activeKind === "draft" ? <button className="os-admin-add-page-preview" type="button" onClick={addPage}><span aria-hidden="true">+</span><strong>Add page</strong></button> : null}

          {activeKind === "starter" ? <button className="os-admin-preview-use" type="button" onClick={() => createFromStarter(draft)}>Use this starter</button> : null}
          {activeKind === "published" ? <button className="os-admin-preview-use" type="button" onClick={() => newPublishedVersion(draft)}>Create next version</button> : null}

          {activeKind === "draft" ? <>
            <details className="os-admin-panel"><summary>Chapter settings</summary><div className="os-admin-fields two">
              <Field label="Title"><input value={draft.chapter.title} onChange={(event) => updateChapter("title", event.target.value)} /></Field><Field label="Chapter ID"><input value={draft.chapter.id} onChange={(event) => updateChapter("id", chapterSlug(event.target.value))} /></Field><Field label="Category"><input value={draft.category} onChange={(event) => updateDraft((next) => ({ ...next, category: event.target.value }))} /></Field><Field label="Classification"><select value={draft.classification} onChange={(event) => updateDraft((next) => ({ ...next, classification: event.target.value as ChapterDraft["classification"] }))}>{CHAPTER_CLASSIFICATIONS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Session"><input value={draft.chapter.session} onChange={(event) => updateChapter("session", chapterSlug(event.target.value))} /></Field><Field label="Version"><input min="1" type="number" value={draft.chapter.version} onChange={(event) => updateChapter("version", Number(event.target.value))} /></Field><Field label="Minutes"><input min="1" type="number" value={draft.chapter.estimatedMinutes} onChange={(event) => updateChapter("estimatedMinutes", Number(event.target.value))} /></Field><Field label="Purpose"><textarea rows={3} value={draft.chapter.purpose} onChange={(event) => updateChapter("purpose", event.target.value)} /></Field><Field label="Tags"><input value={draft.tags.join(", ")} onChange={(event) => updateDraft((next) => ({ ...next, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} /></Field>
            </div></details>
            <details className="os-admin-panel" open><summary>Page settings · {pageLabel(page.type)}</summary><div className="os-admin-fields two">
              <Field label="Page type"><select disabled={selectedPage === 0 || selectedPage === draft.chapter.pages.length - 1} value={page.type} onChange={(event) => changePageType(event.target.value as ChapterPageType)}>{AUTHORABLE_PAGE_TYPES.map((item) => <option key={item} value={item}>{pageLabel(item)}</option>)}</select></Field><Field label="Page ID"><input value={page.id} onChange={(event) => updatePage("id", chapterSlug(event.target.value))} /></Field>{INPUT_TYPES.has(page.type) ? <><Field label="Answer key"><input value={page.answerKey || ""} onChange={(event) => updatePage("answerKey", chapterSlug(event.target.value))} /></Field><label className="os-admin-check"><input checked={Boolean(page.required)} type="checkbox" onChange={(event) => updatePage("required", event.target.checked)} /><span>Answer required</span></label></> : null}{["short-text", "long-text"].includes(page.type) ? <Field label="Placeholder"><input value={page.placeholder || ""} onChange={(event) => updatePage("placeholder", event.target.value)} /></Field> : null}{CUSTOM_FOOTER_TYPES.has(page.type) ? <Field label="Button text"><input value={page.button || ""} onChange={(event) => updatePage("button", event.target.value)} /></Field> : null}
            </div>{["single-choice", "multi-choice"].includes(page.type) ? <div className="os-admin-options"><h3>Choices</h3>{(page.options || []).map((option, index) => <div key={`${option.id}-${index}`}><input aria-label={`Option ${index + 1} ID`} value={option.id} onChange={(event) => updateDraft((next) => { next.chapter.pages[selectedPage].options![index].id = chapterSlug(event.target.value); return next; })} /><input aria-label={`Option ${index + 1} label`} value={option.label} onChange={(event) => updateDraft((next) => { next.chapter.pages[selectedPage].options![index].label = event.target.value; return next; })} /><button aria-label={`Remove option ${index + 1}`} type="button" onClick={() => updateDraft((next) => { next.chapter.pages[selectedPage].options!.splice(index, 1); return next; })}>×</button></div>)}<button type="button" onClick={() => updateDraft((next) => { const options = next.chapter.pages[selectedPage].options ||= []; options.push({ id: `option-${options.length + 1}`, label: `Option ${options.length + 1}` }); return next; })}>Add choice</button></div> : null}<div className="os-admin-page-actions"><button disabled={selectedPage === 0 || selectedPage === draft.chapter.pages.length - 1} type="button" onClick={duplicatePage}>Duplicate page</button><button disabled={selectedPage === 0 || selectedPage >= draft.chapter.pages.length - 1} type="button" onClick={deletePage}>Delete page</button><button disabled={selectedPage <= 1} type="button" onClick={() => movePage(-1)}>Move earlier</button><button disabled={selectedPage === 0 || selectedPage >= draft.chapter.pages.length - 2} type="button" onClick={() => movePage(1)}>Move later</button></div></details>
            <div className="os-admin-panel os-admin-publish-settings">
              <Field label="Destination app"><select value={draft.appSpaces[0] || ""} onChange={(event) => updateDraft((next) => ({ ...next, appSpaces: event.target.value ? [event.target.value] : [] }))}><option value="">Choose an app</option>{APP_TARGETS.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}</select></Field>
              <label className="os-admin-check"><input checked={draft.chapter.showPageNumbers !== false} type="checkbox" onChange={(event) => updateChapter("showPageNumbers", event.target.checked)} /><span>Show page numbers</span></label>
            </div>
            {errors.length ? <div className="os-admin-errors" role="status"><strong>Before ready</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : <p className="os-admin-valid">Ready checks passed.</p>}
            <div className="os-admin-actions os-admin-final-actions"><button type="button" onClick={() => downloadMarkdown(draft)}>Export Markdown</button><button type="button" onClick={() => saveDraft()}>Save draft</button><button disabled={errors.length > 0} type="button" onClick={() => saveDraft("ready")}>Mark ready</button><button disabled={errors.length > 0 || publishing} type="button" onClick={() => publishChapter("private")}>Publish privately</button><button disabled={errors.length > 0 || publishing} type="button" onClick={() => publishChapter("public")}>Publish publicly</button></div>
            {lastAction ? <p className="os-admin-publish-status success" role="status">{lastAction === "saved" ? "Saved ✓" : lastAction === "ready" ? "Ready ✓" : "Published ✓"}</p> : null}
            {publishState ? <p className="os-admin-publish-status" role="status">{publishState}</p> : null}
          </> : null}
        </section>
      ) : null}
    </main>
  );
}
