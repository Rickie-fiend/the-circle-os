# Circle Design Guide

This is the short repository guide for The Circle website and Circle OS. The
canonical durable documents remain:

- `C:\Brain\10 Projects\The Circle\BRAND_SYSTEM.md`
- `C:\Brain\10 Projects\The Circle\CIRCLE_OS_BRAND_APPLICATION.md`
- `C:\Brain\10 Projects\The Circle\Circle OS\App Box and Page Standard.md`

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
- Note remains the one deliberate, recallable destination: its idle Page stays
  visible until the person taps the Note mode label, and that label can recall
  the newest unfinished or dismissed Note chapter.
- Thoughts, Habit, Log, Vision, Seven Days, and Athena use one-time deliveries
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
  the shared default size. Every App Box rests at that one size, so swiping
  from Note to Thoughts or from Habit to Protocol never resizes the frame. One
  set of tokens owns the size, the padding, the drop to the first line, the
  Main-to-Sub gap and the Body-to-Footer gap; an App does not restate them.
- Main content anchors to the top of its Main Body and stays there. A Page grows
  downward for more writing; the words already on it never move.
  Optional Sub Body content begins directly beneath it.
- Main Body reserves three lines, so a two-line Note title and a three-line
  Thoughts placeholder rest at exactly the same height. The box grows at the
  fourth line.
- One written line costs one line of App Box, and the gap between the last line
  and the action stays the same as the box grows. On Cover, Note and Thoughts
  the two-to-one weight of Main and Sub is where the eye lands, not a
  reservation: an absent Sub Body takes no room at all.
- Real added rows may extend a fluid App Box without colliding with the Footer.
  Habit tasks stay visible in one continuous Sub Body rather than an inner
  scrolling panel.
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

Her reading is published as dated editions that accumulate, so there is such a
thing as a new one, and such a thing as reading back. A morning that says the
same thing publishes nothing.

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
- Main Body contains one question or lesson.
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
- Main and optional Sub text use the same top anchor as a Cover Page.
- Text can be edited directly with its display typography.
- No separate edit box and no Save-message step.

### Thoughts Page

- Uses the Info Page geometry.
- Inviting editable typography in the body.
- Its placeholder uses the same size, weight, line-height, and top anchor as
  Cover and Note Main text.
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
- An idle App Box turns its own pages after a shared dwell, so a Page nobody
  swiped to still comes past. It restarts on touch, waits out focus and a part
  written thought, and never runs in the background.
- Every action runs through the button engine. A feature does not draw its own
  button or its own checkbox.
- One style may break instead of pressing. Fractured Glass takes four strikes:
  the first three only crack it, and the last one shatters the button and the
  surface behind it. Breaking it is the action, never a delay before it.
- A breaking button is a reward, not a toll. It appears when the person has
  written a real sentence; a single word keeps the ordinary press.

## Content and AI

- Ask one thing at a time.
- Prefer one tap, one slide, or one clear text response per Page.
- Do not repeat the same question in different words.
- Athena observes evidence, expresses uncertainty, and helps the user notice a
  gap. Athena does not give life advice.
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

- The top-left app label is a mode control, not navigation. Note recalls a
  private chapter; Thoughts changes between Thoughts and Deep Thoughts; Habit
  cycles Habit, Habit Record, and Habit Tracker.
- A publication version targets exactly one app and one audience. Private work
  stays profile-scoped. Public/global work always requires explicit approval.
- The visible product tab is **Reflect**. Vision remains the inner white app
  about the life the person wants.
- Page refresh choreography is Body, Header, Footer. The background never
  blinks or remounts between those text layers.

## Secret Admin and authoring library

- Admin has no public tab, shortcut, or login page. A reserved phrase entered
  through Thoughts unlocks authoring for the current browser session only.
- The reserved phrase is intercepted before thought persistence. It is never
  saved as profile evidence or uploaded with normal Thoughts.
- An unauthorized direct Admin visit returns quietly to Today.
- Chapter Library groups follow the fixed authoring classification order:
  Foundation, Short, Guided Learning, Reflection, then Information. Empty
  groups stay hidden; free-form category metadata remains searchable.
