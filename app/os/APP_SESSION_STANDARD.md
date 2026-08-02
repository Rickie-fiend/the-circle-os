# Circle OS App Box and Page Standard

## Terms

- **App Box**: the stable, rounded container. It owns the theme, clipping,
  border, radius, shadow, minimum size, and height transition.
- **Page**: one swipeable visual inside an App Box. Pages never own a second
  outer card.
- **Info Page**: the shared solid-background page template. Gestures, update
  reveals, and head-shake feedback move its text layer while the App Box stays
  still.
- **Cover Page**: an Info Page with a main line, optional sub line, and one
  `Swipe to begin` cue. It is never editable.
- **Note Page**: an editable Info Page with an app action label, main line, and
  optional sub line. It has no swipe cue.
- **Thoughts Page**: an Info Page for free writing with one black Save or Send
  action.
- **Blog Page**: a reading page with title, divider, and short paragraph
  sections. Athena Reading is the reference implementation.
- **App Label**: the small upper-left name shown only when a Page is itself an
  app surface. A non-app Page omits it.

## Page anatomy

Every Cover, Chapter, and App Page uses the same five regions.

1. **Header** stays at the top.
   - App Page: left App Label; optional right app action.
   - Chapter Page: no left label; right progress only.
   - Cover Page: empty. A Cover never shows an App Label.
2. **Heading** sits below the Header. It may be a small section title or a
   large title. It may be empty without leaving a gap.
3. **Body** stays in the middle and has two parts:
   - **Main Body** receives about two parts of the available body space. It is
     the large bold prompt, primary thought, or main habit.
   - **Sub Body** receives about one part. It holds an optional subtitle,
     typography input, choices, sliders, or added tasks. It may expand without
     shrinking the type.
4. **Footer** stays at the bottom.
   - Cover Page: right-aligned `Swipe to begin` or `Swipe to see` cue.
   - Chapter Page: full-width Continue or Confirm actions, stacked if needed.
   - App Page: the app's lasting action, such as Add task.

## App Box size

- The default App Box is a compact rounded rectangle.
- A fluid App Box may grow for its content and ease back down, but never below
  the shared default minimum.
- The App Box does not jump when adjacent Pages have different heights.
- Real added rows may extend a fluid App Box while the Footer remains below
  them. Habit tasks stay visible in one continuous Sub Body; they do not move
  into an inner scrolling panel.
- A content-heavy App may define a slightly larger stable minimum so its Main
  action and Footer never collide on a narrow phone.

## Structure

```text
Route
  Session: the stable place
    App window: owns radius, border, edge color, and shadow
      App page: a flat sheet that moves inside the window
```

## Two app behaviors

### Journey

Used for questions, teaching, setup, and habit creation.

- A new chapter or server question begins with one cover.
- Answered pages remain available while the chapter is an open draft.
- Before confirmation, the person may move backward and edit any answer.
- The last question leads to a separate completion page.
- A short Check-in completion may leave by one final left swipe or by a quiet
  timed fade. It returns to the real idle app without a confirmation button.
- After completion, the draft pages retire and only the useful idle app
  remains.
- A new immutable chapter version creates a new journey and cover.
- Only a genuinely new cover receives the staged update reveal. Its solid
  surface appears before its words, and the cover cannot be swiped until that
  reveal is complete.

### Library

Used for charts, weekly views, and other things worth reading again.

- Pages may move in both directions.
- The frame keeps one stable height.
- The selected page survives route changes and reloads.
- New server data may create a new cover once.

## Interaction

- The outer session frame stays still.
- The window is one uninterrupted shape. Moving pages never carry their own
  rounded outer corners, borders, or shadows.
- Only the inner page follows the finger.
- A swipe completes inside the clipped frame before state changes.
- Ordinary page travel stays quick enough for consecutive swipes. Ceremonial
  update motion never slows browsing through an existing app stack.
- An in-place app mode change uses that same ceremonial update transition:
  the current Page fades, the stable surface settles, then the new Page copy
  arrives. Thoughts to Deep Thoughts is the reference behavior.
- The active page is always kept in the navigation map while permissions or
  saved progress change. It never falls back to the cover by position.
- A required first-use cover has a hard right boundary. An optional Check-in
  cover may swipe right into its idle app to mean `Later`.
- The incoming page is promoted in place after the swipe. Its horizontal
  entrance never replays during the state change.
- When pages have different heights, the frame keeps its old height until the
  swipe completes, then eases to the new page height.
- A tap never becomes a swipe.
- Text fields never focus because of a swipe.
- Every swipe also has a button or keyboard path.

## Visual rules

- White: primary reflection.
- Orange: identity and active change.
- Dark: practical tools and evidence.
- Radius, border, background, and shadow belong to the stable frame whenever
  pages share a theme.
- Fixed-height chart sessions scroll inside themselves when needed. They never
  push the whole route while changing pages.
- Fluid-height sessions use the shared frame resize. Reduced-motion settings
  make the resize immediate.
- All app interiors use Geist. Cormorant remains an outer editorial typeface.
- Pages of the same type reuse one component and typography scale. Do not make
  a one-off Cover, Note, Thoughts, or Blog visual inside a feature.
- Every Page keeps Header, Heading, Main Body, Sub Body, and Footer. Empty
  optional text does not move those anchors.
- Main Body content anchors to the lower edge of its larger two-part space.
  Sub Body follows directly beneath it and may grow for real content.
- On Cover, Note, and Thoughts Info Pages, Main and Sub read as one centered
  text group rather than floating near the top of the App Box.
- Cover Main text, Note Main text, and the Thoughts placeholder use one shared
  typography token and center anchor. They remain left-aligned inside that
  centered group.
- A Note Page keeps its Main text on the same center anchor as a Cover Page.
  Optional Sub text begins beneath that anchor without pushing the Main text up.
- Habit App Pages place `Your habit today` in Heading, the main habit in Main
  Body, added habits and tasks in Sub Body, and Add task in Footer. The divider
  appears only when Sub Body has an item.
- Repeated habits form one continuous Sub Body stack. Each added habit uses one
  quiet divider and one row rhythm; it never creates a nested card or double gap.
- When Habit has no Sub Body items, that empty region collapses so the main
  action meets the Add task Footer without a dead gap.
- Full-width actions use the same black button language across apps.
- Text answers use borderless editable typography, not a separate form-box or
  underline visual. The App Box grows for a paragraph; the text does not shrink.
- Choice, slider, and short-answer Chapter Pages remain at the default App Box
  height. Empty form geometry must never make a short page taller.
- Note, Thoughts, short Chapter, and empty Habit Pages all use the same default
  App Box height. Only real added content may request a larger stable height.

## State

- Journey progress is stored by chapter id and immutable version.
- Library position is stored by session id and data version.
- Note opens on its idle Note Page. No built-in chapter replaces it. The newest
  unfinished private publication assigned to Note enters only when the person
  taps the Note mode label. Dismissing means not now; it never deletes delivery.
- A private published chapter is immutable by id and version in this browser
  and remains available offline. A public published chapter is written as an
  immutable Markdown source through the connected Circle OS server, then
  cached locally for offline use.
- Every immutable publication names one destination app, one audience profile,
  visibility, delivery mode, source, and publication time. Publishing the same
  chapter elsewhere creates another immutable publication version.
- Admin publications default to manual delivery. Athena publications default to
  on-view delivery. Public publication always needs explicit approval.

## Page arrival

- Leaving is one flat content-layer fade. The App Box background stays stable.
- New or refreshed content enters Body first, Header second, Footer last.
- Ordinary swipes remain quick and never replay the refresh sequence.
- Completion leaves with a flat fade; its idle App Page enters Body, Header,
  Footer. Reduced-motion mode renders all groups immediately.

## Admin previews and access

- Chapter Workshop and Button Studio render the production App Box and Page
  anatomy. The bounded parent owns width; content can grow only downward.
- Choice options stack one full-width row at a time and wrap naturally.
- Button Studio keeps its preview action mounted. The `Background` toggle
  changes only the preview surface, never the button lifecycle.
- Admin is intentionally absent from public navigation. Entering `admin`
  (ignoring surrounding spaces and letter case) in Thoughts unlocks it for the
  current browser session and is intercepted before
  Thoughts persistence. Unauthorized direct visits return to Today.
- Chapter Library groups by Foundation, Short, Guided Learning, Reflection,
  and Information in that order, with empty groups hidden.
- A matching version restores the saved page.
- A new version returns to page zero.
