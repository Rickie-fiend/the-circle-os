# Circle Design Guide

This is the repository design guide for The Circle website and Circle OS.
Together with `app/os/APP_SESSION_STANDARD.md` and `app/brand-system.ts`, it
replaces the requirement for unavailable external design notes. No missing
note's contents have been inferred. Product direction and open design conflicts
are recorded in `docs/PRODUCT.md` and `docs/DECISION_LOG.md`.

The live human-readable brand guide is `/brand`. The code tokens live in
`app/brand-system.ts`; Circle OS behavior details live in
`app/os/APP_SESSION_STANDARD.md`.

## Core idea

**Whole. Human. Alive.**

The interface should feel like a calm editorial object that happens to be
useful. It is a mirror, not a dashboard. It should help a person notice life,
not pressure them to optimize it.

## Foundations

- **Awareness:** show what is actually happening.
- **Presence:** make today's life feel worth noticing now.
- **Contribution:** invite honest input instead of extraction.
- **Living culture:** keep the system adaptable and human.

## Color

| Token | Value | Use |
| --- | --- | --- |
| Bone | `#F1EFE8` | reading, openness, calm primary pages |
| Ink | `#191813` | foundation, type, focused depth |
| Orange | `#E36B37` | identity, action, living attention |
| Charcoal | `#403E35` | structure, dividers, secondary text |

Use solid surfaces. Avoid gradients and decorative color noise. The three App
Box themes are Light, Orange, and Dark. Theme changes must preserve the same
geometry and hierarchy.

## Type

- **Geist:** all app labels, prompts, inputs, buttons, data, and functional UI.
- **Cormorant Garamond:** outer editorial headings only, such as section or
  route titles.
- Main app text is bold, direct, and easy to read.
- Supporting text is short and quieter, but never faint enough to feel broken.
- Editable reading surfaces use 29px titles/questions and 18px
  content/answers. This covers account Note/Deep Thoughts and opened history/trash
  entries, Athena's reply editor, Vision declarations, Week goals/steps, and
  Chapter short/long text questions with their matching Workshop preview.
  Retain existing weights and line heights; use the shared spacing below.
  Lists keep their compact row scale. Reading-only lessons, covers, Athena prose,
  Quest descriptions, locked-app explanations and Protocol summaries retain
  their existing typography. This developer-approved refinement supersedes
  the shared Cover/Note/Chapter size statements below for these editable surfaces.
- Do not shrink type to fit content. Let the body grow or scroll.
- Write at a fourth-grade reading level whenever possible.

## Layout

- Approved spacing refinement (2026-11-03): the shared label-to-content gap is
  48px; Main-to-Sub and Body-to-Footer gaps are both 25px. This supersedes older
  spacing statements for these values. Preserve the shared App Box minimum and
  downward growth. Note/Deep Thoughts Trash detail omits “In Trash” and its
  divider; Restore and Delete forever have a 4px layout gap and retain touch targets.

- Mobile first, with 24px as the normal phone gutter.
- Prefer centered containers and stable editorial alignment.
- Desktop may use a two-column layout with a calm 2:1 visual weight when the
  content benefits from it.
- Respect the rule of thirds in composition without drawing a visible grid.
- Minimum touch target: 44px.

## Chapter delivery

- A published chapter cover appears directly inside its assigned App Box.
- Note opens on its editable front. Its label flips the same App Box to a
  Line (a quote, fact, or joke); it does not recall a Chapter. New deliveries
  that previously belonged to Note use Deep Thoughts (internal `thoughts`). Preserve legacy immutable
  Note publications, their versions, and saved records as required by the
  [Page standard](app/os/APP_SESSION_STANDARD.md#state).
- Thoughts, Habit, Log, Vision, Week Review, and Athena use one-time deliveries
  in this testing release. After completion or dismissal, their ordinary App
  content returns and the chapter is not recalled from the mode label.
- Private publications stay on that browser and work offline. Public
  publications use immutable Markdown sources through the connected Circle OS
  server and are cached on the device.
- A chapter id and version identify one immutable publication. Editing a
  published chapter requires a new version.
- Avoid nested cards. One visual surface should read as one object.

## App Box

An **App Box** is the stable rounded frame. A **Page** is the sheet that moves
inside it.

```text
Session
  App Box
    Header
    Heading
    Body
      Main Body (about 2 parts)
      Sub Body (about 1 part)
    Footer
```

- The App Box owns radius, clipping, border, shadow, theme, and height change.
- Pages never add a second outer card.
- The App Box starts as a compact rounded rectangle and never contracts below
  the shared default minimum. Empty and short Pages rest at that size. Real
  content may grow the frame downward, including Routine rows and Protocol
  terms. One set of tokens owns the minimum, padding, drop to the first line,
  Main-to-Sub gap and Body-to-Footer gap; an App does not restate them.
- Account Note and Deep Thoughts are the approved bounded-growth exception:
  their writing, History and Trash Pages
  grow from that minimum to a 480px App Box ceiling, reduced to 60% of the dynamic
  viewport on short screens, never below the shared minimum. Only Body scrolls
  past the ceiling; Header, Heading and Footer remain in place. Expanded
  Protocol Past phases uses the same ceiling and Body scrolling. Routine and
  draft/running Protocol keep their continuous downward growth.
- Main content begins at the shared forehead anchor for every line count. It
  never recentres as text changes; a fourth and every later line grows the Page
  downward after the ordinary three-line height budget is used.
- Optional Sub Body content hangs directly beneath Main's last line. It is not
  part of Main's height budget and never moves Main.
- One written line costs one line of App Box, and the gap between the last line
  and the action stays the same as the box grows. On Cover, Note and Thoughts
  the two-to-one weight of Main and Sub is where the eye lands, not a
  reservation: an absent Sub Body takes no room at all.
- Real added rows may extend a fluid App Box without colliding with the Footer.
  Habit tasks stay visible in one continuous Sub Body rather than an inner
  scrolling panel.
- Draft and running Protocol terms follow the same continuous-page rule and
  grow downward. Expanded Past phases is the approved history exception: its
  Body scrolls at the same 480px/60dvh frame ceiling as Note, never below the
  shared minimum. Header and Footer stay fixed. Past terms show compact counts
  such as `1/7`, without white row dividers; each phase keeps its title, full
  days-kept summary, dates and separation from other phases.
- Repeated habits use that same continuous stack: one quiet divider and one row
  rhythm per habit, with no nested card or doubled spacing.
- Empty optional regions collapse cleanly and leave no dead gap.
- A Page puts its content in Main Body and Sub Body. Loose children fall into
  the Body tracks by position and get stretched by them.
- Where an App carries its weight in Sub Body, as Habit and Protocol do, both
  tracks size to their content instead of holding the two-to-one weight.

## Reflect

Reflect is where a person reads about their life. It has three parts: the life
you want, the life you are living, and the space between. Athena's voice runs
through all three rather than sitting beside them.

The wanted life has distinct records: Vision names the life, Character names
who the person is becoming, Mission names how they intend to live, Typical
Tuesday shows an ordinary day there, and Six months names a nearer milestone.
Routine identity is a short daily focus and habit identity belongs to one
habit. Neither silently replaces the versioned Character. Dreamline remains a
separate finite plan.

The current Vision surface still shows Vision, Mission statement, and Typical
Tuesday. Adding Character and Six months to that surface requires a separate
review of their Pages; the data authority decision does not invent that UI.

Her reading is published as dated editions that accumulate in state. Reflect
shows only the current four-Page reading; its archive is not another Page in
the session. A morning that says the same thing publishes nothing.

The latest authored Reading may end with a real question and accept one reply
as evidence. Week Review is local arithmetic: its seven Pages hold a cover, a
recurring daily pattern, four distinct parts of the day, and what held or did
not hold during the week. Its counts stay in local working except when a count
is itself the point of the final week Page.

## Page types

### Cover Page

- No header labels.
- One main hook.
- One optional short subtitle.
- Footer cue: `Swipe to begin` or `Swipe to see`.
- Never editable.
- Main text retains the shared Cover type token and top anchor. Editable Note
  and Deep Thoughts share that anchor with their own 29px main-text size.

### Chapter Page

- Header has progress on the right only.
- Main Body contains one question or lesson. Short/long text questions use 29px
  main text and 18px supporting copy/answers; the Workshop preview matches.
  Other types retain their existing scale. All retain the shared forehead anchor.
  Confirm and Result keep their own closing anchor.
- Sub Body contains one interaction: choice, slider, short input, or paragraph.
- Footer contains the full-width Continue or Confirm action.
- A choice, slider, or short answer stays at the default App Box height. Grow
  only for real content such as a paragraph, never for empty form space.
- Note, Thoughts, short Chapter, and empty Habit Pages share that same default
  App Box height. A feature does not invent its own empty-state height.
- Short and paragraph answers are borderless editable typography. Do not draw
  a field box or underline around the answer.

### Note Page

- Account Note uses NOTE on the left and direct HISTORY navigation on the right.
  Both labels share typography, baseline and 44px touch targets. Labels,
  navigation and text actions use Circle Orange (`#E36B37`); authored title and
  body stay Ink. Use Geist, the shared minimum and forehead, and 44px targets.
- Main and Sub both take unlimited writing. Account Note scrolls its Body after
  the shared Note ceiling; writing length itself is not limited.
- Header shows the app label or app action.
- Main text uses the same forehead anchor as a Cover Page. Optional Sub text
  follows Main at the shared gap without moving it.
- Text can be edited directly with its display typography.
- Keep the borderless writing surface. Account Note saves after a short typing
  pause and when leaving; it has no Save, Clear, Discard or Drafts controls or
  draft messages. Writing fields have no focus outline or box; the text cursor
  remains. Save silently, with failure alerts when needed. Local recovery
  remains automatic behind the scenes.
- HISTORY opens the list directly. Note has no Versions controls or screens.
  History groups entries by Circle day, shows times, opens writing directly for
  editing, and carries Trash in the header. The full-width New Note action lives
  in the Note editor Footer and saves the current text before opening a blank Note.
  Each editable local Note row has a Circle Orange trash-bin button on its right.
  That button moves only its Note to Trash, without a Moved to Trash message.
  There is no Note Undo action;
  restoration happens from the Trash page.
  Trash detail keeps the title/body hierarchy with Restore and Delete forever.
- Selecting and deleting all text saves an empty correction of an existing Note;
  internal revision records remain for save/conflict safety. Untouched empty
  composers create no saved entry.
  Thoughts and reading answers retain Send and their draft workflow. The legacy
  single-Note editor remains separate pending migration. See the
  [writing journeys](docs/PERSONAL_RECORDS_AND_ATHENA_PLAN.md#5-writing-journeys).

### Deep Thoughts Page

- Uses the Info Page geometry.
- Inviting editable typography in the body.
- Its question uses the same 29px size as Note Main text, with 18px answers.
  Existing weights, line heights and forehead anchors remain.
- Question in Main, answer in Sub, with a full-width black Send action.
- Keep an accepted answer visible; Next question advances only on a deliberate
  press. Corrections use Save changes and preserve the original question.
- Recover unfinished answers silently. Omit routine saving/sent and
  recovered/discarded messages and the Discard draft control. Clearing the answer
  clears its recovery text; keep actual save errors visible.
- Match Note's direct HISTORY/header baseline, orange navigation and row bins,
  dated grouping/times, silent trashing, Trash/Restore and confirmed Delete forever.
  Reuse its bounded Body scrolling and shared resting geometry. Internal revisions
  remain; Versions UI and Undo are absent from this surface. Recovery stays local
  and unsent rows are marked Unsent. Reading-answer embedded controls stay separate.
- Its label flips to one quote from the managed catalog. Return to the same
  question and answer, with existing Line swipe/reaction exits. Keep quote travel
  on the shared App-back engine; quote reading has no timer or question advance.
- Ordinary Thoughts is retained as a historical record kind, including correction;
  it has no new-writing composer in Today. Legacy sources remain read only.

### Blog Page

- Title, divider, and short paragraph sections.
- Athena Reading is the reference.
- Reading rhythm matters more than packing information into one viewport.

## Motion

- Everyday page travel should respond quickly enough for consecutive swipes.
- A new cover reveal is ceremonial: old page fades, solid surface settles, then
  text appears in sequence.
- In-place app mode changes reuse that reveal instead of swapping instantly.
  Thoughts to Deep Thoughts is the reference transition.
- Only newly updated content receives that reveal. Returning to a known Page
  must not replay entrance animation.
- Frame height eases only after a Page transition finishes.
- Required-input feedback uses a brief, clear head shake of the text layer.
- Respect reduced-motion preferences.
- The page moves; the App Box does not.
- Only the Today Note/Thoughts session turns its pages after the shared
  `IDLE_PAGE_DWELL_MS` dwell. Two-page facts and jokes on its Line side may
  also turn; a single-page quote has no next Page to turn to.
- Routine, Protocol, Log, Vision, Week Review, and Athena stay on the chosen
  Page. Journeys, Chapters, and pending publications never rotate.
- The idle dwell restarts on touch or key input, waits out focus and a part
  written Thought, and never runs in the background. See the
  [Page standard](app/os/APP_SESSION_STANDARD.md#idle-rotation).
- Every action runs through the button engine. A feature does not draw its own
  button or its own checkbox.
- Where an action cannot go through the engine, it is still the same key. See
  **Buttons** below.
- One style may break instead of pressing. Fractured Glass takes four strikes:
  the first three only crack it, and the last one shatters the button and the
  surface behind it. Breaking it is the action, never a delay before it.
- A breaking button is a reward, not a toll. It appears when the person has
  written a real sentence; a single word keeps the ordinary press.

## Buttons

Circle OS has one pressable object. A face raised on a solid leg, lit along its
top edge, that drives flat onto the surface when pressed and comes back up a
little slower. Row ticks, Protocol terms, the button engine's default style and
every full-width Page action are the same key at different sizes.

- The recipe is the `--os-key-*` tokens in `app/os/os-app.css`. A control names
  its size and its leg colour and gets the rest. Nothing restates a shadow.
- Sizes are lifts, not heights: 4px, 3px, 2px. The leg is exactly as tall as the
  lift, so a press removes both and the face lands where the leg was.
- Legs are never blurred. A blur reads as floating; these are seated in the box.
- The top light is drawn only where it can be seen: strong on a light or orange
  face, soft on Ink, absent on a Bone face. The absent value is a transparent
  shadow, never `none` — `none` is legal only as a whole box-shadow and voids
  the leg with it.
- Down is near instant. Pressed and held states are sunk, so the light comes
  from inside the hole rather than off the top edge.
- A ghost control is not a key. A dotted invitation such as Add task stays flat,
  because a control that presses like a commitment claims to be one.
- The rotating bag of button styles belongs to Button Studio. The App sends with
  the standard key.

## Dreamline

Hidden for v1 behind `SHOW_DREAMLINE` in `app/os/circle-os-shell.tsx`. The
record, the model and the Pages are untouched, so returning to it is a flag
rather than a migration.

- Log currently has a daily timeline and a Week Page; neither idle-rotates.
- Disabled Dreamline idle/sheet Pages are conditionally attached to the Routine
  session in current source, not an enabled sequence behind Log. Older
  Setup/Having/Being/Doing/Income and Now/Tomorrow/Day After layouts are historical,
  not instructions to rebuild or enable them. Future placement needs review.
- Being requires the Doing that proves it. Only starred lines receive steps
  or enter the income calculation.
- Dreamline is dated, costed and finite. Vision declarations remain separate
  and timeless.

## Content and AI

- Ask one thing at a time.
- Prefer one tap, one slide, or one clear text response per Page.
- Do not repeat the same question in different words.
- Athena reflects on evidence, expresses uncertainty, asks open questions, and
  offers feedback and motivation tied to the person's own goals. The person
  decides how to live. See `docs/PRODUCT.md` for the intended AI role and the
  distinction between current prepared content and planned server-side AI.
- Oscar may be playful later, but must not blur truth or consent.
- Weekly views show real recorded life. AI interpretation belongs in Athena,
  clearly separated from observed data.

## Taste skills

Project-local design skills live in `.agents/skills/`. Use them for critique,
reference generation, and craft checks. Circle's own identity and the App Box
standard always win when a generic skill recommends a conflicting layout,
typeface, motion pattern, or interaction.

## Admin previews use the production App Box contract

- Runtime, Chapter Workshop, and Button Studio use one responsive width rule:
  the bounded parent owns width and content may only grow the box downward.
- Choice interactions use one full-width option per row so authoring preview
  and published behavior cannot diverge on phones.
- Button Studio uses the shared Page anatomy. Its `Background` control lives
  in the Page Header, while the preview button stays mounted in the Footer.
- Button motion prompts are local draft metadata exported for Codex. They do
  not call AI or generate assets in this version.

## App modes and publications

- The top-left app label is a mode control, not navigation. Note opens its
  Line back; Deep Thoughts opens a Quote; Habit
  cycles Habit, Habit Record, and Habit Tracker.
- A Line does not dismiss itself on a timer. Swipe backward past its first
  Page to return to Note. Swiping forward past its last Page reveals reactions;
  choosing a reaction or swiping forward past the end again returns to Note.
  Its kind label is text, not a Note return button.
- A publication version targets exactly one app and one audience. Private work
  stays profile-scoped. Public/global work always requires explicit approval.
- The visible product tab is **Reflect**. Vision remains the inner white app
  about the life the person wants.
- Page refresh choreography is Body, Header, Footer. The background never
  blinks or remounts between those text layers.

## Secret Admin and authoring library

- Admin has no public tab, shortcut, or login page. A reserved phrase entered
  through a fresh Deep Thoughts answer opens a password prompt in the same Page. The phrase is a
  hidden doorway, not the password itself. The password lives only in the
  server-side CIRCLE_OS_ADMIN_CODE environment setting; there is no fallback
  password, and missing or too-short configuration keeps Admin locked.
- The reserved phrase and admin password are intercepted before thought
  persistence. Neither is saved as profile evidence or uploaded with normal
  Thoughts.
- A successful unlock uses an HttpOnly, SameSite=Strict browser-session cookie.
  The signed session expires after eight hours, and direct unauthorized Admin
  visits return quietly to Today.
- Chapter Library groups follow the fixed authoring classification order:
  Foundation, Short, Guided Learning, Reflection, then Information. Empty
  groups stay hidden; free-form category metadata remains searchable.
