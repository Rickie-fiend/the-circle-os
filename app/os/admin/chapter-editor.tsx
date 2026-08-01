"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChapterPlayer } from "../chapters/chapter-player";
import { createChapterRun } from "../chapters/chapter-model.js";
import { publishedChapters } from "../chapters/registry";
import type { ChapterPage, ChapterPageType, ChapterRun, ChapterTheme } from "../chapters/chapter-types";
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

type AdminView = "library" | "editor" | "preview";
type LibraryKind = "draft" | "starter" | "published";
type LibraryItem = { draft: ChapterDraft; kind: LibraryKind };

const INPUT_TYPES = new Set<ChapterPageType>(["single-choice", "multi-choice", "yes-no", "slider", "short-text", "long-text", "time"]);
const CUSTOM_FOOTER_TYPES = new Set<ChapterPageType>(["multi-choice", "slider", "short-text", "long-text", "time", "idle"]);
const CHAPTER_THEMES: { label: string; value: ChapterTheme }[] = [
  { label: "Light", value: "light" },
  { label: "Orange", value: "orange" },
  { label: "Dark", value: "dark" },
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

function footerHint(type: ChapterPageType) {
  if (type === "cover") return "The cover always uses Swipe to begin.";
  if (["single-choice", "yes-no"].includes(type)) return "Choosing an answer moves to the next page.";
  if (type === "info") return "Information pages move by swipe and have no button.";
  if (["confirm", "result"].includes(type)) return "Completion pages move by swipe into the idle app.";
  if (type === "idle") return "The idle app may keep one useful action.";
  return "One full-width action stays in the page footer.";
}

export function ChapterEditor() {
  const [view, setView] = useState<AdminView>("library");
  const [drafts, setDrafts] = useState<ChapterDraft[]>([]);
  const [draft, setDraft] = useState<ChapterDraft>(() => createChapterDraft());
  const [activeKind, setActiveKind] = useState<LibraryKind>("draft");
  const [selectedPage, setSelectedPage] = useState(0);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState("Saved on this device");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | LibraryKind>("all");
  const [appFilter, setAppFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState<"all" | ChapterTheme>("all");
  const [starters] = useState(() => FIRST_USE_APP_SPACES.map((space) => createFirstUseChapterDraft(space)));
  const published = useMemo(() => publishedChapters.map((chapter) => chapterDefinitionToDraft(chapter)), []);
  const [previewRun, setPreviewRun] = useState<ChapterRun>(() => createChapterRun(chapterDraftToPreview(createChapterDraft())));
  const errors = useMemo(() => validateChapterDraft(draft), [draft]);
  const preview = useMemo(() => chapterDraftToPreview(draft), [draft]);
  const page = draft.chapter.pages[selectedPage] || draft.chapter.pages[0];
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
      return [item.chapter.title, item.chapter.id, item.category, item.classification, ...item.tags, ...item.appSpaces]
        .join(" ").toLowerCase().includes(term);
    });
  }, [appFilter, drafts, kindFilter, published, search, starters, themeFilter]);

  useEffect(() => {
    readChapterDrafts()
      .then((stored) => {
        if (stored.length) {
          setDrafts(stored);
          setDraft(stored[0]);
        } else {
          const first = createChapterDraft();
          setDrafts([first]);
          setDraft(first);
          return writeChapterDraft(first);
        }
      })
      .catch(() => {
        const first = createChapterDraft();
        setDrafts([first]);
        setDraft(first);
      })
      .finally(() => setReady(true));
  }, []);

  function updateDraft(change: (current: ChapterDraft) => ChapterDraft) {
    setSaveState("Unsaved changes");
    setDraft((current) => {
      const next = change(structuredClone(current));
      next.workflowStatus = "draft";
      return next;
    });
  }

  function updateChapter(key: keyof ChapterDraft["chapter"], value: unknown) {
    updateDraft((next) => {
      (next.chapter as unknown as Record<string, unknown>)[key] = value;
      if (key === "title" && next.chapter.pages[0]) next.chapter.pages[0].title = String(value);
      return next;
    });
  }

  function updatePage(key: keyof ChapterPage, value: unknown) {
    updateDraft((next) => {
      (next.chapter.pages[selectedPage] as unknown as Record<string, unknown>)[key] = value;
      return next;
    });
  }

  function changePageType(type: ChapterPageType) {
    updateDraft((next) => {
      const current = next.chapter.pages[selectedPage];
      const replacement = createChapterPage(type, selectedPage);
      next.chapter.pages[selectedPage] = {
        ...replacement,
        id: current.id,
        title: current.title || replacement.title,
        body: current.body || replacement.body,
        button: CUSTOM_FOOTER_TYPES.has(type) ? current.button || replacement.button : replacement.button,
      };
      return next;
    });
  }

  async function persistDraft(next: ChapterDraft) {
    await writeChapterDraft(next);
    setDraft(next);
    setDrafts((current) => [next, ...current.filter((item) => item.draftId !== next.draftId)]);
    setActiveKind("draft");
  }

  async function saveDraft(workflowStatus = draft.workflowStatus) {
    const next = { ...structuredClone(draft), workflowStatus, updatedAt: new Date().toISOString() };
    await persistDraft(next);
    setSaveState(workflowStatus === "ready" ? "Ready for approval" : "Saved on this device");
  }

  function openDraft(next: ChapterDraft) {
    setDraft(structuredClone(next));
    setActiveKind("draft");
    setSelectedPage(0);
    setSaveState("Saved on this device");
    setView("editor");
  }

  function previewChapter(next: ChapterDraft, kind: LibraryKind) {
    const definition = chapterDraftToPreview(next);
    setDraft(structuredClone(next));
    setActiveKind(kind);
    setSelectedPage(0);
    setPreviewRun(createChapterRun(definition));
    setView("preview");
  }

  function openView(nextView: AdminView) {
    if (nextView === "editor" && activeKind !== "draft") return;
    if (nextView === "preview") setPreviewRun(createChapterRun(preview));
    setView(nextView);
  }

  async function newDraft() {
    const next = createChapterDraft();
    await persistDraft(next);
    openDraft(next);
  }

  async function createFromStarter(source: ChapterDraft) {
    const next = createFirstUseChapterDraft(source.appSpaces[0]);
    next.chapter.theme = source.chapter.theme;
    await persistDraft(next);
    openDraft(next);
  }

  async function newPublishedVersion(source: ChapterDraft) {
    const next = createNextVersionDraft(source);
    await persistDraft(next);
    openDraft(next);
  }

  async function copyDraft(source: ChapterDraft) {
    const next = duplicateChapterDraft(source);
    await persistDraft(next);
    openDraft(next);
  }

  async function deleteDraft(source: ChapterDraft) {
    if (!window.confirm(`Delete “${source.chapter.title}” from this device?`)) return;
    await removeChapterDraft(source.draftId);
    const remaining = drafts.filter((item) => item.draftId !== source.draftId);
    if (!remaining.length) {
      const first = createChapterDraft();
      await writeChapterDraft(first);
      setDrafts([first]);
      setDraft(first);
      setSelectedPage(0);
      return;
    }
    setDrafts(remaining);
    if (source.draftId === draft.draftId) setDraft(remaining[0]);
  }

  function addPage() {
    updateDraft((next) => {
      const insertAt = Math.max(1, next.chapter.pages.length - 2);
      next.chapter.pages.splice(insertAt, 0, createChapterPage("info", next.chapter.pages.length));
      setSelectedPage(insertAt);
      return next;
    });
  }

  function duplicatePage() {
    updateDraft((next) => {
      const copy = structuredClone(next.chapter.pages[selectedPage]);
      copy.id = `${copy.id}-copy`;
      next.chapter.pages.splice(selectedPage + 1, 0, copy);
      setSelectedPage(selectedPage + 1);
      return next;
    });
  }

  function movePage(direction: -1 | 1) {
    updateDraft((next) => {
      const target = selectedPage + direction;
      if (selectedPage === 0 || selectedPage === next.chapter.pages.length - 1 || target <= 0 || target >= next.chapter.pages.length - 1) return next;
      [next.chapter.pages[selectedPage], next.chapter.pages[target]] = [next.chapter.pages[target], next.chapter.pages[selectedPage]];
      setSelectedPage(target);
      return next;
    });
  }

  function deletePage() {
    if (selectedPage === 0 || selectedPage >= draft.chapter.pages.length - 2) return;
    updateDraft((next) => {
      next.chapter.pages.splice(selectedPage, 1);
      setSelectedPage(Math.max(0, selectedPage - 1));
      return next;
    });
  }

  function jumpPreview(pageId: string) {
    setPreviewRun((current) => ({
      ...current,
      currentPageId: pageId,
      furthestPageId: pageId,
      updatedAt: new Date().toISOString(),
    }));
  }

  function choosePreviewTheme(theme: ChapterTheme) {
    if (activeKind === "draft") {
      updateChapter("theme", theme);
      return;
    }
    setDraft((current) => ({
      ...structuredClone(current),
      chapter: { ...current.chapter, theme },
    }));
  }

  if (!ready) return <main className="os-admin"><p className="os-admin-loading">Opening chapter library…</p></main>;

  return (
    <main className="os-admin">
      <header className="os-admin-head">
        <div><p>Admin mode</p><h1>Chapter authoring</h1></div>
        <span>{saveState}</span>
      </header>
      <div className="os-admin-views" role="tablist" aria-label="Chapter authoring views">
        {(["library", "editor", "preview"] as AdminView[]).map((item) => (
          <button aria-selected={view === item} disabled={item === "editor" && activeKind !== "draft"} key={item} role="tab" type="button" onClick={() => openView(item)}>{item}</button>
        ))}
      </div>

      {view === "library" ? (
        <section className="os-admin-library" aria-label="Chapter library">
          <div className="os-admin-section-head"><div><p>Library</p><h2>{libraryItems.length} chapters to explore</h2></div><button type="button" onClick={newDraft}>Blank chapter</button></div>
          <div className="os-admin-library-tools">
            <Field label="Search"><input placeholder="Title, tag, or app" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></Field>
            <Field label="Source"><select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)}><option value="all">All sources</option><option value="draft">My drafts</option><option value="starter">First-use starters</option><option value="published">Published versions</option></select></Field>
            <Field label="App"><select value={appFilter} onChange={(event) => setAppFilter(event.target.value)}><option value="all">All apps</option>{FIRST_USE_APP_SPACES.map((space) => <option key={space} value={space}>{pageLabel(space)}</option>)}</select></Field>
            <Field label="Theme"><select value={themeFilter} onChange={(event) => setThemeFilter(event.target.value as typeof themeFilter)}><option value="all">All themes</option>{CHAPTER_THEMES.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}</select></Field>
          </div>
          <div className="os-admin-draft-list">
            {libraryItems.map(({ draft: item, kind }) => (
              <article key={`${kind}-${item.draftId}`}>
                <button className="os-admin-draft-open" type="button" onClick={() => kind === "draft" ? openDraft(item) : previewChapter(item, kind)}>
                  <span>{kind === "starter" ? "First-use starter" : kind === "published" ? "Published" : item.workflowStatus} · {item.appSpaces.map(pageLabel).join(", ")}</span>
                  <strong>{item.chapter.title}</strong>
                  <small>{item.chapter.pages.length} pages · v{item.chapter.version} · {item.classification}</small>
                </button>
                <div className={kind === "draft" ? "three" : ""}>
                  <button type="button" onClick={() => previewChapter(item, kind)}>Preview</button>
                  {kind === "draft" ? <><button type="button" onClick={() => copyDraft(item)}>Duplicate</button><button type="button" onClick={() => deleteDraft(item)}>Delete</button></> : null}
                  {kind === "starter" ? <button type="button" onClick={() => createFromStarter(item)}>Use template</button> : null}
                  {kind === "published" ? <button type="button" onClick={() => newPublishedVersion(item)}>Create next version</button> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {view === "editor" ? (
        <section className="os-admin-editor" aria-label="Chapter editor">
          <div className="os-admin-actions"><button type="button" onClick={() => saveDraft()}>Save draft</button><button disabled={errors.length > 0} type="button" onClick={() => saveDraft("ready")}>Mark ready</button><button type="button" onClick={() => downloadMarkdown(draft)}>Export Markdown</button></div>
          <details className="os-admin-panel" open><summary>Chapter details</summary>
            <div className="os-admin-fields two">
              <Field label="Title"><input value={draft.chapter.title} onChange={(event) => updateChapter("title", event.target.value)} /></Field>
              <Field label="Chapter ID"><input value={draft.chapter.id} onChange={(event) => updateChapter("id", chapterSlug(event.target.value))} /></Field>
              <Field label="Category"><input value={draft.category} onChange={(event) => updateDraft((next) => ({ ...next, category: event.target.value }))} /></Field>
              <Field label="Classification"><select value={draft.classification} onChange={(event) => updateDraft((next) => ({ ...next, classification: event.target.value as ChapterDraft["classification"] }))}>{CHAPTER_CLASSIFICATIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
              <Field label="Session"><input value={draft.chapter.session} onChange={(event) => updateChapter("session", chapterSlug(event.target.value))} /></Field>
              <Field label="Theme"><select value={draft.chapter.theme} onChange={(event) => updateChapter("theme", event.target.value as ChapterTheme)}>{CHAPTER_THEMES.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}</select></Field>
              <Field label="Version"><input min="1" type="number" value={draft.chapter.version} onChange={(event) => updateChapter("version", Number(event.target.value))} /></Field>
              <Field label="Minutes"><input min="1" type="number" value={draft.chapter.estimatedMinutes} onChange={(event) => updateChapter("estimatedMinutes", Number(event.target.value))} /></Field>
              <Field label="Purpose"><textarea rows={3} value={draft.chapter.purpose} onChange={(event) => updateChapter("purpose", event.target.value)} /></Field>
              <Field label="Tags (comma separated)"><input value={draft.tags.join(", ")} onChange={(event) => updateDraft((next) => ({ ...next, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} /></Field>
              <Field label="App spaces (comma separated)"><input value={draft.appSpaces.join(", ")} onChange={(event) => updateDraft((next) => ({ ...next, appSpaces: event.target.value.split(",").map((space) => chapterSlug(space)).filter(Boolean) }))} /></Field>
            </div>
          </details>

          <div className="os-admin-page-strip" aria-label="Chapter pages">
            {draft.chapter.pages.map((item, index) => <button className={index === selectedPage ? "active" : ""} key={`${item.id}-${index}`} type="button" onClick={() => setSelectedPage(index)}><span>{index + 1}</span>{pageLabel(item.type)}</button>)}
            <button className="add" type="button" onClick={addPage}>+ Page</button>
          </div>

          <section className="os-admin-panel os-admin-page-editor">
            <div className="os-admin-section-head"><div><p>Page {selectedPage + 1}</p><h2>{pageLabel(page.type)}</h2></div><div className="os-admin-icon-actions"><button aria-label="Move page left" type="button" onClick={() => movePage(-1)}>←</button><button aria-label="Move page right" type="button" onClick={() => movePage(1)}>→</button></div></div>

            <section className="os-admin-page-zone"><header><span>Header</span><small>Page function and rules</small></header><div className="os-admin-fields two">
              <Field label="Page type"><select disabled={selectedPage === 0 || selectedPage === draft.chapter.pages.length - 1} value={page.type} onChange={(event) => changePageType(event.target.value as ChapterPageType)}>{CHAPTER_PAGE_TYPES.map((item) => <option key={item} value={item}>{pageLabel(item)}</option>)}</select></Field>
              <Field label="Page ID"><input value={page.id} onChange={(event) => updatePage("id", chapterSlug(event.target.value))} /></Field>
              {INPUT_TYPES.has(page.type) ? <label className="os-admin-check"><input checked={Boolean(page.required)} type="checkbox" onChange={(event) => updatePage("required", event.target.checked)} /><span>Answer required before moving on</span></label> : null}
            </div></section>

            <section className="os-admin-page-zone"><header><span>Main Body</span><small>One dominant idea</small></header><div className="os-admin-fields">
              {INPUT_TYPES.has(page.type)
                ? <Field label="Question"><textarea rows={2} value={page.question || ""} onChange={(event) => updatePage("question", event.target.value)} /></Field>
                : <Field label="Title"><textarea rows={2} value={page.title || ""} onChange={(event) => updatePage("title", event.target.value)} /></Field>}
            </div></section>

            <section className="os-admin-page-zone"><header><span>Sub Body</span><small>{INPUT_TYPES.has(page.type) ? "One interaction" : "Short supporting words"}</small></header><div className="os-admin-fields two">
              <Field label="Body"><textarea rows={3} value={page.body || ""} onChange={(event) => updatePage("body", event.target.value)} /></Field>
              {INPUT_TYPES.has(page.type) ? <Field label="Answer key"><input value={page.answerKey || ""} onChange={(event) => updatePage("answerKey", chapterSlug(event.target.value))} /></Field> : null}
              {["short-text", "long-text"].includes(page.type) ? <Field label="Placeholder"><input value={page.placeholder || ""} onChange={(event) => updatePage("placeholder", event.target.value)} /></Field> : null}
              {page.type === "slider" ? <><Field label="Minimum"><input type="number" value={page.min ?? 1} onChange={(event) => updatePage("min", Number(event.target.value))} /></Field><Field label="Maximum"><input type="number" value={page.max ?? 5} onChange={(event) => updatePage("max", Number(event.target.value))} /></Field><Field label="Minimum label"><input value={page.minLabel || ""} onChange={(event) => updatePage("minLabel", event.target.value)} /></Field><Field label="Maximum label"><input value={page.maxLabel || ""} onChange={(event) => updatePage("maxLabel", event.target.value)} /></Field></> : null}
            </div>
            {["single-choice", "multi-choice"].includes(page.type) ? <div className="os-admin-options"><h3>Choices</h3>{(page.options || []).map((option, index) => <div key={`${option.id}-${index}`}><input aria-label={`Option ${index + 1} ID`} value={option.id} onChange={(event) => updateDraft((next) => { next.chapter.pages[selectedPage].options![index].id = chapterSlug(event.target.value); return next; })} /><input aria-label={`Option ${index + 1} label`} value={option.label} onChange={(event) => updateDraft((next) => { next.chapter.pages[selectedPage].options![index].label = event.target.value; return next; })} /><button aria-label={`Remove option ${index + 1}`} type="button" onClick={() => updateDraft((next) => { next.chapter.pages[selectedPage].options!.splice(index, 1); return next; })}>×</button></div>)}<button type="button" onClick={() => updateDraft((next) => { const options = next.chapter.pages[selectedPage].options ||= []; options.push({ id: `option-${options.length + 1}`, label: `Option ${options.length + 1}` }); return next; })}>Add choice</button></div> : null}
            </section>

            <section className="os-admin-page-zone"><header><span>Footer</span><small>{footerHint(page.type)}</small></header>{CUSTOM_FOOTER_TYPES.has(page.type) ? <div className="os-admin-fields"><Field label="Button text"><input value={page.button || ""} onChange={(event) => updatePage("button", event.target.value)} /></Field></div> : null}</section>

            <div className="os-admin-page-actions"><button type="button" onClick={duplicatePage}>Duplicate page</button><button disabled={selectedPage === 0 || selectedPage >= draft.chapter.pages.length - 2} type="button" onClick={deletePage}>Delete page</button></div>
          </section>

          <details className="os-admin-panel"><summary>Author notes ({draft.authorNotes.length})</summary>
            <div className="os-admin-notes">{draft.authorNotes.map((note, index) => <label key={note.id}><input checked={note.resolved} type="checkbox" onChange={(event) => updateDraft((next) => { next.authorNotes[index].resolved = event.target.checked; return next; })} /><textarea aria-label={`Author note ${index + 1}`} rows={2} value={note.text} onChange={(event) => updateDraft((next) => { next.authorNotes[index].text = event.target.value; return next; })} /><button type="button" onClick={() => updateDraft((next) => { next.authorNotes.splice(index, 1); return next; })}>Remove</button></label>)}<button type="button" onClick={() => updateDraft((next) => { next.authorNotes.push({ id: `note-${Date.now()}`, text: "", resolved: false }); return next; })}>Add note for Codex</button></div>
          </details>
          {errors.length ? <div className="os-admin-errors" role="status"><strong>Before ready</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : <p className="os-admin-valid">Ready checks passed.</p>}
        </section>
      ) : null}

      {view === "preview" ? (
        <section className="os-admin-preview" aria-label="Chapter preview">
          <div className="os-admin-section-head"><div><p>{activeKind === "published" ? "Published test" : activeKind === "starter" ? "Starter test" : "Live App Box"}</p><h2>{draft.chapter.title}</h2></div><div className="os-admin-preview-controls"><Field label="Theme"><select aria-label="Preview theme" value={draft.chapter.theme} onChange={(event) => choosePreviewTheme(event.target.value as ChapterTheme)}>{CHAPTER_THEMES.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}</select></Field><button type="button" onClick={() => setPreviewRun(createChapterRun(preview))}>Restart</button></div></div>
          <p className="os-admin-preview-note">This is the real Chapter Player. Test answers stay inside this preview and never enter your profile.</p>
          <div className="os-admin-preview-pages" aria-label="Preview pages">{preview.pages.map((item, index) => <button aria-pressed={index === previewPageIndex} key={item.id} type="button" onClick={() => jumpPreview(item.id)}><span>{index + 1}</span>{pageLabel(item.type)}</button>)}</div>
          <ChapterPlayer definition={preview} label="Chapter preview" onIdleAction={() => undefined} previewMode run={previewRun} onRunChange={setPreviewRun} />
          {activeKind === "starter" ? <button className="os-admin-preview-use" type="button" onClick={() => createFromStarter(draft)}>Use this starter</button> : null}
          {activeKind === "published" ? <button className="os-admin-preview-use" type="button" onClick={() => newPublishedVersion(draft)}>Create next version</button> : null}
        </section>
      ) : null}
    </main>
  );
}
