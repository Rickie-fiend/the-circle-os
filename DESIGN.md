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
- Do not shrink type to fit content. Let the body grow or scroll.
- Write at a fourth-grade reading level whenever possible.

## Layout

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
  that previously belonged to Note use Thoughts. Preserve legacy immutable
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
- Protocol terms follow the same continuous-page rule. Draft, running and
  finished Protocol Pages grow to show their real terms instead of hiding them
  in a nested scrolling region.
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
- Main text uses the shared Info Page type token and top anchor. It looks
  identical to the Main text on Note and Thoughts Pages.

### Chapter Page

- Header has progress on the right only.
- Main Body contains one question or lesson. It uses the same shared Main type
  token and forehead anchor as Cover, Note and Thoughts, so a published Page and
  its authoring preview are the same words at the same size. Confirm and Result
  keep their own closing anchor.
- Sub Body contains one interaction: choice, slider, short input, or paragraph.
- Footer contains the full-width Continue or Confirm action.
- A choice, slider, or short answer stays at the default App Box height. Grow
  only for real content such as a paragraph, never for empty form space.
- Note, Thoughts, short Chapter, and empty Habit Pages share that same default
  App Box height. A feature does not invent its own empty-state height.
- Short and paragraph answers are borderless editable typography. Do not draw
  a field box or underline around the answer.

### Note Page

- Header shows the app label, and while writing, a Clear action on the right
  that empties Main and Sub together.
- Main and Sub both take unlimited writing.
- Header shows the app label or app action.
- Main text uses the same forehead anchor as a Cover Page. Optional Sub text
  follows Main at the shared gap without moving it.
- Text can be edited directly with its display typography.
- No separate edit box and no Save-message step.

### Thoughts Page

- Uses the Info Page geometry.
- Inviting editable typography in the body.
- Its placeholder uses the same size, weight, line-height, and forehead anchor
  as Cover and Note Main text.
- One full-width black Send action in the Footer.

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

- Dreamline lives after the hour-by-hour timeline inside Log's single saved
  journey. Log does not idle-rotate.
- Its front order is Setup, Having, Being, Doing and Income. Its shared App
  back is Now, Tomorrow and Day After.
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
  Line back; Thoughts changes between Thoughts and Deep Thoughts; Habit
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
  through Thoughts opens a password prompt in the same Page. The phrase is a
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
