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

- The default App Box is a compact rounded rectangle, and it is the same
  rectangle everywhere. Note, Thoughts, Habit, Protocol, a short Chapter, a
  Cover, Vision, Athena and Gap all rest at exactly one height. Swiping between
  two Pages of the same App never resizes the frame.
- One foundation owns that size and the space inside it. `--os-app-box-min-height`
  is the height, `--os-app-box-padding-*` the inset,
  `--os-body-optical-shift` Main's optical correction,
  `--os-main-sub-gap` the space between Main and Sub, and
  `--os-body-footer-gap` the space between the last line of Body and the Footer.
  An App does not restate any of them.
- Main Body is the centred element. One, two and three lines centre in the Body
  region, measured in Main's own line height. At four lines its top pins where
  the three-line top was and the App Box grows down by every added line.
- Two lines was not enough. A Note title is usually two lines but the Thoughts
  placeholder is sometimes three, so two Pages of one App Box sat at different
  heights and the frame resized on the swipe between them. The reserve is what
  keeps Pages of one App identical, so it must cover the longest ordinary Page,
  not the shortest.
- A fluid App Box may grow for its content and ease back down, but never below
  the shared default minimum.
- The App Box does not jump when adjacent Pages have different heights.
- An App Box grows downward only. The top edge, the width, the radius and the
  Header stay where they are. Once Main reaches four lines, its top stays at the
  three-line position; the bottom edge is the only edge that travels.
- One written line costs one line of App Box. Main and Sub are two real rows
  that take the room they need. Written instead as a two-parts-to-one-part
  split of the Body, an absent Sub Body still claimed half of whatever Main
  took, so every line written added one and a half lines of box and opened a
  growing field of empty colour above the action. The two-to-one proportion
  describes where the eye should land, not a grid that reserves space nobody
  asked for.
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
- A completion followed by an Idle Page leaves by a quiet timed fade, whatever
  the chapter's Session is. This ending is the declared `dwell` capability.
  It cannot be swiped forward: the last page is usually the payoff, and a
  forward swipe there skipped it and retired the chapter in one gesture, which
  is what put a joke out of reach before it was read. Backward stays open, so
  the setup can be read again while the page is up.
- The last page holds long enough to be read, not merely seen.
- A chapter whose Result or Confirm is the final Page declares `swipe`; a
  deliberate forward swipe completes it. Page anatomy supplies these defaults
  for immutable chapters, while an unknown or conflicting ending fails the
  build. Session names never choose the ending.
- Page numbers appear only when there is more than one page to count. A chapter
  with one question showed "1/1", which is not progress.
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

## Reflect

- Reflect has three parts and no more: **the life you want**, **the life you
  are living**, and **the space between**. Athena's voice runs through all
  three; it is not a fourth part.
- The gap belongs inside the space between. It was its own section asking the
  same question as the reading, which made two App Boxes out of one idea.
- Reflect is for reading. Chapters ask a question and collect an answer, so
  they belong to Today. A publication assigned to Vision or Athena still
  delivers into its App Box, but Reflect never grows its own questionnaire.

## Lines

- A **Line** is one-beat content that gives and collects nothing: a quote, a
  joke, a small fact. It is not a Chapter. There is no run, no version, no
  cooldown and no completion, because all of that machinery exists to keep an
  answer and a Line never asks for one.
- Content that gives is unrationed. Content that asks stays rationed. Being
  asked constantly is what stops a person answering honestly, and honest
  answers are the whole input to Athena; a quote costs nothing to see.
- The Note label therefore always has an answer: a Chapter when the hour allows
  one, a Line when it does not.
- A Line takes the App Box the way a Chapter does and leaves the same way, on
  one swipe forward. It records only that it was read, so the pool rotates.
- Lines are white. The App Box paints Bone and owns that surface; the Page
  declares no colour of its own.
- Two-beat jokes stay Chapters. A punchline needs its own Page.

## Editions

- Athena's reading is published as **editions**: dated, immutable, and
  accumulating. A reading that is overwritten every morning can never be new,
  never be unread, and never be read back.
- An edition is identified by its own words, not by the morning it was
  prepared. Athena prepares daily whether or not the evidence moved, so a
  quiet morning publishes nothing and the tab does not claim something new
  when nothing was said.
- Only authored prose is published. The derived observations that stand in for
  a page Athena has not written are a fallback for display, never a
  publication.
- An edition never mixes with another day. A part Athena did not write in a
  past edition says so, rather than borrowing today's profile text.
- Editions merge as a union. A phone syncing from a copy that predates an
  edition never loses it.
- The phone carries a bounded archive; the vault keeps the full history.

## Note

- Note takes as much writing as a person wants, in Main Body and in Sub Body
  both. Neither is capped; the App Box grows downward for real content.
- While a Note is being written, the Header carries one right-hand action:
  **Clear**. It empties Main and Sub together and leaves the caret in Main, so
  the next thing that happens is writing.
- Clear is only present while writing. It never appears on a Note at rest,
  where the only thing to press would be a way to lose what is there.

## Protocol

- Protocol is the first Page of its App Box and Habit is one swipe across. A
  protocol is the agreement a habit is built inside, so it is what the box
  opens on.
- A running protocol can be changed. Its label is the mode control: tapping it
  turns the Page into an editor for the name and the terms, and tapping Done
  turns it back. A block is the button that keeps a term, so it cannot also be
  the way to rewrite one; editing is a mode rather than a second tap target.
- An edited term keeps its id, so the days already marked against it stay
  attached. A term taken out is archived, never deleted.
- Length is the one thing a running protocol cannot change. The day counter and
  the ending are arithmetic on it, and a run that can be shortened when it gets
  hard is not a protocol.
- Protocol carries its weight in Sub Body. The terms are the page; the name and
  the duration are one Main Body line above them. The two-parts-to-one rule is
  wrong here, so both tracks size to their content the way Habit's do once it
  has rows.
- A Page must put its content in Main Body and Sub Body. Loose children fall
  into the Body tracks by position, which is how the Protocol name alone came
  to be stretched to fill the Main track.
- The four durations are one even row, not a wrapping list.
- Ending a run early asks once. The terms were agreed before the run began and
  the days do not come back, so the action states what the next press does and
  the question expires rather than waiting all day. Closing a run that has
  already finished asks nothing; there is nothing left to lose.

## Idle rotation

- An idle App Box turns its own pages. A Page nobody swiped to still comes
  past, so a habit is not left unticked all day because its Page was behind
  Protocol and nothing on screen said so.
- Note and Thoughts turn between themselves. Habit and Protocol turn between
  themselves. One dwell, `IDLE_PAGE_DWELL_MS`, is shared by both.
- Turning never interrupts. The dwell restarts on any touch or key inside the
  box, it waits while anything inside the box has focus, it holds while a
  thought is part written, and it does not run while the app is in the
  background.
- A turned Page arrives with the ordinary quick page travel, not the ceremonial
  update reveal. Nothing new has arrived; the box is only showing what it holds.
- A journey, a Chapter and a pending publication never rotate. Only an idle App
  with more than one Page does.

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
- Main Body alone centres in the Body region through three lines. At four or
  more its top pins to the three-line position and writing grows downward.
  Sub Body follows directly beneath Main and may grow without moving it.
- A Page has four regions in one column: Header, Heading, Body, Footer. Body is
  the only one that flexes. Written with Heading flexible instead, spare height
  collects above the words, so a short thought sits low and jumps upward the
  moment it gains a second line.
- On Cover, Note, Thoughts and Vision declaration Pages, Main is the centred
  element and Sub hangs from its last line at the shared gap.
- Cover Main text, Note Main text, the Thoughts placeholder and the Vision
  declaration editor use one shared typography token and centring rule. They
  remain left-aligned.
- A Note Page keeps its Main text on the same centre or three-line pin as a
  Cover Page. Optional Sub text begins beneath Main without moving it.
- Routine App Pages place the editable app identity in Main Body, habits then
  Tasks in one continuous Sub Body, and Add task in Footer.
- Repeated habits form one continuous Sub Body stack. Each habit uses one
  quiet divider and one row rhythm; it never creates a nested card or double gap.
- Routine is the first Page and Protocol is one swipe across. Their Headers are
  equal and their editable identities begin on the same line.
- When Routine has no rows, the empty Sub Body collapses and the Page rests at
  the shared default height.
- Full-width actions use the same black button language across apps.
- Text answers use borderless editable typography, not a separate form-box or
  underline visual. The App Box grows for a paragraph; the text does not shrink.
- Choice, slider, and short-answer Chapter Pages remain at the default App Box
  height. Empty form geometry must never make a short page taller.
- Note, Thoughts, short Chapter, empty Routine and resting Protocol Pages all
  use the same default App Box height. Only real added content may request a
  larger stable height.
- A running or finished Protocol holds that default height and scrolls its
  terms inside the Body. Draft editing remains fluid.

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
- A pending publication renders directly inside its assigned App Box. Note is
  the only recallable destination in this testing release: its mode label can
  reopen the newest unfinished or dismissed Note journey.
- Thoughts, Habit, Log, Vision, Seven Days, and Athena publications are
  one-time journeys. Completion retires them and restores the normal App.
  Dismissal, when that App offers it, also retires the delivery rather than
  adding it to a recall queue.
- Closing a kept Protocol day writes a dated seal but never locks its ticks. A
  newer correction records an explicit unseal. The factual kept-day Page is
  transient, occupies the Protocol slot, pauses idle rotation, and one swipe
  removes it without adding a stack or chapter run.

## Page arrival

- Leaving is one flat content-layer fade. The App Box background stays stable.
- New or refreshed content enters Body first, Header second, Footer last.
- Ordinary swipes remain quick and never replay the refresh sequence.
- Completion leaves with a flat fade; its idle App Page enters Body, Header,
  Footer. Reduced-motion mode renders all groups immediately.

## App back

- An optional App back is a side change inside the same stable App Box. Its
  front is what is needed today; its back is what the App holds.
- Thoughts / Deep Thoughts, Routine / Record and Protocol / Phases use the same
  controller and timings: 260ms to leave, 620ms for the full handoff.
- The controller holds the measured frame height for the whole handoff.
  Reduced-motion mode changes sides immediately without an animation phase.
- A mode label names the visible side. It is never an edit or completion
  action. Returning to an already known side does not replay a staged arrival.

## Fixed evidence Apps

- Log uses the shared Page and frame rather than a route-level heading above a
  free-standing timeline. Its evidence surface remains dark.
- A long timeline uses `minmax(0, 1fr)` for Body and scrolls within that Body.
  The route and swipe page remain still.
- The App Box owns background, border, radius, clipping and shadow. Until its
  week Page exists, Log shows no back control.

## Protocol home

- With no running phase, Protocol home is front. With a running phase, the
  phase is front and home is the `Phases` back.
- Home reads completed and early-ended runs from existing local records. It
  stores no aggregate and presents only within-phase counts, dates and terms.
- Starting from home uses the existing one-run draft path. A second draft is
  never created to satisfy navigation.

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
