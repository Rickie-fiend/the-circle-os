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

- The default App Box is a compact rounded rectangle and the shared minimum
  everywhere. Empty and short Note, Thoughts, Habit, Protocol, Chapter, Cover,
  Vision, Athena and Gap Pages rest at exactly one height. Real content may grow
  the frame downward.
- One foundation owns that size and the space inside it. `--os-app-box-min-height`
  is the height, `--os-app-box-padding-*` the inset,
  `--os-label-gap` the forehead from Label to first visible content,
  `--os-main-sub-gap` the space between Main and Sub, and
  `--os-body-footer-gap` the space between the last line of Body and the Footer.
  An App does not restate any of them.
- Main Body begins at the forehead for every line count. One, two and three
  lines use the ordinary Body budget without changing that top anchor. At four
  lines the App Box grows down by every added line.
- Two lines was not enough. A Note title is usually two lines but the Thoughts
  placeholder is sometimes three, so two Pages of one App Box sat at different
  heights and the frame resized on the swipe between them. The reserve is what
  keeps Pages of one App identical, so it must cover the longest ordinary Page,
  not the shortest.
- A fluid App Box may grow for its content and ease back down, but never below
  the shared default minimum.
- The App Box does not jump when adjacent Pages have different heights.
- An App Box grows downward only. The top edge, width, radius, Header and Main
  forehead anchor stay where they are; the bottom edge is the only edge that
  travels.
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
- Protocol terms use the same continuous-page behavior in draft, running and
  finished states. They remain visible as the App Box grows downward rather
  than moving into an inner scrolling panel.
- A fluid App Box commits its first measured height only after child editors
  have sized and the font state has settled. It remeasures when fonts finish or
  fail and when an in-Page side changes; the CSS minimum carries first paint.
- Routine declares its editable identity as Main text, so it begins at the
  shared forehead. Record and Protocol home are content Pages and must never be
  measured from nested row text. An App-back handoff may reuse a surface, but
  it may not reuse the previous side's height.
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
- Every Result or Confirm Page has the same terminal interaction. For its first
  1.2 seconds, forward travel is closed and backward travel stays open. Then a
  quiet `Swipe when ready` cue appears and one deliberate forward swipe either
  reaches the chapter's Idle Page or gives the App back. It never fades itself.
- The old `dwell` and `swipe` declarations still validate the immutable Page
  anatomy and destination of published chapters; they no longer produce two
  different gestures. An unknown or conflicting ending still fails the build,
  and Session names never choose the ending.
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
- Character is the authoritative answer to who the person is becoming. Routine
  identity is the short daily focus; a habit identity belongs to one habit;
  Mission says how the person intends to live. When Character is absent, Athena
  may use Routine identity and then Mission only as labelled fallbacks.
- Vision, Character, Mission statement, Typical Tuesday, and Six months are
  distinct wanted-life records. Dreamline remains a separate finite plan.

## Lines

- A **Line** is one-beat content that gives and collects nothing: a quote, a
  joke, a small fact. It is not a Chapter. There is no run, no version, no
  cooldown and no completion, because all of that machinery exists to keep an
  answer and a Line never asks for one.
- Content that gives is unrationed. Content that asks stays rationed. Being
  asked constantly is what stops a person answering honestly, and honest
  answers are the whole input to Athena; a quote costs nothing to see.
- The Note label flips the same App Box to its Line back. It never summons a
  Chapter. Chapters arrive on their own in Thoughts and return to Thoughts when
  completed or dismissed.
- A quote is one Line Page. A fact or joke keeps setup and reveal as two
  adjacent Pages. Those Pages may rotate through the shared idle dwell; a Line
  never dismisses itself on a timer.
- The Line face has a text kind label, not a Note return button. Swiping
  backward past its first Page returns to Note. Swiping forward past its last
  Page first reveals reactions; choosing a reaction records feedback and
  returns to Note. Swiping forward past the end again returns without requiring
  a reaction. Reactions are optional feedback, not Chapter answers or completion.
- The neutral inset edge says that the arriving Page is not the person's Note.
  The top-right `FACT`, `JOKE`, or `QUOTE` label says what kind it is; colour
  does not encode kind.
- Lines are white. The App Box paints Bone and owns that surface; the Page
  declares no colour of its own.
- Facts and jokes keep their reveal shape. Jokes are exactly setup and
  punchline; a Line with a third clause is removed rather than padded out.

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
- An empty Note shows one short phrase from the separate Note placeholder pool.
  Clear advances to a different phrase. Placeholder words never become saved
  evidence and never use Line runs, cooldowns, or completion.

## Protocol

- Routine is the first Page of its App Box and Protocol is one swipe across.
  The current Protocol phase is its front; `Phases` opens Protocol home on the
  shared App back.
- A running protocol can be changed through the explicit `Edit phase` action.
  Its App-back label names the visible side and never doubles as an editor.
  A block is the button that keeps a term, so it cannot also be the way to
  rewrite one.
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
- Ending a run early lives inside the editor reached by `Edit phase` and asks
  once. The terms were agreed before the run began and the days do not come
  back, so the action states what the next press does and the question expires
  rather than waiting all day. The running front keeps one Footer action.
  Closing a run that has already finished asks nothing; there is nothing left
  to lose.

## Idle rotation

- The Today check-in session is the only App session that turns its own Page.
  Note and Thoughts turn between themselves after one
  `IDLE_PAGE_DWELL_MS` dwell.
- Routine, Protocol, Log, Vision, Week Review, and Athena stay on the Page the
  person chose. A hidden action is a placement defect, not a reason to turn a
  working App while the person is reading it.
- Turning never interrupts. The dwell restarts on any touch or key inside the
  box, it waits while anything inside the box has focus, it holds while a
  thought is part written, and it does not run while the app is in the
  background.
- A turned Page arrives with the ordinary quick page travel, not the ceremonial
  update reveal. Nothing new has arrived; the box is only showing what it holds.
- A journey, a Chapter and a pending publication never rotate.

## Interaction

- The outer session frame stays still.
- The window is one uninterrupted shape. Moving pages never carry their own
  rounded outer corners, borders, or shadows.
- Only the inner page follows the finger.
- A swipe completes inside the clipped frame before state changes.
- Ordinary page travel stays quick enough for consecutive swipes. Ceremonial
  update motion never slows browsing through an existing app stack.
- Every in-place App side change uses the shared App-back controller. Feature
  code supplies only its two sides and never supplies another transition class,
  timer or height ease.
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
- **The forehead is one number for every App.** The space between the App Label
  and whatever comes under it is `--os-label-gap`, currently `80px`, and it
  hangs off the Label rather than off the Heading track. Sai set Routine as the
  reference first — *"i want the forehead size of the routine app to apply
  everywhere"* — and then set the number: **80px**. Every App matches it: Note,
  Thoughts, Routine, Protocol, Log, Dreamline, Vision, Week Review, Athena's
  Reading, Suggestion. Measured across **every Page**, not one per session:
  five Apps on Today at `80.9px`, and all twenty Pages on Reflect at `80px` or
  `80.9px` — the three Vision declarations, the nine Week Review Pages, the four
  Athena Pages and Suggestion. At phone width the App Box still sits on its
  `344px` floor with the Footer 22px inside it and nothing clipped: the forehead
  comes out of the Body's spare height, not out of the frame.
- **Body does not centre.** It begins at the forehead in every placement.
  Centring is what made a balanced Page put its first line wherever the text
  length left it: a short Note measured `105px` under its Label against
  Routine's `24px`. An App Box that holds less text is shorter; it does not move
  its first line.
- **Three things break the forehead, and all three have.** A Label that restates
  its own type (`line-height: 1` gave the Note Label a 10px box against every
  other Label's 17.2px, and 4px of extra forehead under it). A Label that
  animates from an offset (`translate3d(0, -4px, 0)` held the Thoughts Label
  above its own line). An App Box built outside the contract (Athena's Reading
  carried its own `330px` floor and a `0.85rem` gap; Suggestion had `22px`
  padding and no forehead at all; Athena's cover centred its heading in a `1fr`
  row, so its forehead was whatever the row left over). Check those before
  adding a rule, and measure every Page of a session rather than the one that
  happens to be showing — the Athena cover was the only Page of twenty that was
  wrong, and only walking all of them found it.
- **A Label that is also a button resets what the button adds and nothing
  more.** It never restates font, size, weight, tracking or line height — those
  come from `.os-card-label`, whose line height is `--os-card-label-line-height`
  so that a `<p>`, a `<button>` and a `<span>` share one box. This exact fault
  has shipped four times: the Habit toggle, the Protocol toggle, the Vision
  label, and New habit.
- **A header action sits on the header's line, not in the middle of its touch
  target.** New habit kept a 44px target but centred its text inside it, so it
  hung roughly 17px below the App Label opposite. The target stays; the word
  goes to the top of it.
- Main Body begins at the forehead and grows downward. Sub Body follows
  directly beneath Main and may grow without moving it. Main used to centre
  through three lines and pin at four; that is what made the forehead differ
  from App to App, and it was removed on 2026-08-20.
- A Page has four regions in one column: Header, Heading, Body, Footer. Body is
  the only one that flexes. Written with Heading flexible instead, spare height
  collects above the words, so a short thought sits low and jumps upward the
  moment it gains a second line.
- On Cover, Note, Thoughts and Vision declaration Pages, Main begins at the
  forehead and Sub hangs from its last line at the shared gap.
- Cover Main text, Note Main text, the Thoughts placeholder and the Vision
  declaration editor use one shared typography token and forehead anchor. They
  remain left-aligned.
- **A label is dimmed by choosing a lighter step, never by using the surface's
  own text colour on the wrong surface.** Section labels on a dark App Box use
  a neutral step that clears 4.5:1 against it. The Dreamline shipped its section
  labels in Ink on `--c-neutral-950`, which measures 1.13:1 — invisible rather
  than quiet. `--c-neutral-400` on that surface is 6.42:1 and reads as the quiet
  signpost the label is meant to be.
- A Note Page keeps its Main text at the same forehead anchor as a Cover Page.
  Optional Sub text begins beneath Main without moving it.
- Routine App Pages place the editable app identity in Main Body, habits then
  Tasks in one continuous Sub Body, and Add task in Footer.
- Repeated habits form one continuous Sub Body stack. Each habit uses one
  quiet divider and one row rhythm; it never creates a nested card or double gap.
- Routine is the first Page and Protocol is one swipe across. Their Headers are
  equal and their editable identities begin on the same line.
- Their title box, title-to-first-label gap and Footer action outer height are
  equal too. A feature-specific Footer or duplicate content gap must not move
  one identity below the other.
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
- Draft, running and finished Protocol Pages grow downward for their real terms.
  They share the default minimum but do not hold that height or nest a terms
  scroller.

## State

- Journey progress is stored by chapter id and immutable version.
- Library position is stored by session id and data version.
- Note opens on its editable front and its label flips to a Line. New chapters
  target Thoughts and arrive there on their own. Legacy immutable publications
  already assigned to Note remain readable, but authoring and compilation no
  longer create new Note deliveries.
- A private published chapter is immutable by id and version in this browser
  and remains available offline. A public published chapter is written as an
  immutable Markdown source through the connected Circle OS server, then
  cached locally for offline use.
- Every immutable publication names one destination app, one audience profile,
  visibility, delivery mode, source, and publication time. Publishing the same
  chapter elsewhere creates another immutable publication version.
- Admin publications default to manual delivery. Athena publications default to
  on-view delivery. Public publication always needs explicit approval.
- A pending Thoughts publication visits the whole App Box rather than becoming
  a Thoughts or Deep Thoughts face. Completion or dismissal restores the
  Thoughts front. Habit, Log, Vision, Seven Days, and Athena publications are
  likewise one-time journeys that retire back to their normal App.
  Dismissal, when that App offers it, also retires the delivery rather than
  adding it to a recall queue.
- Closing a kept Protocol day writes a dated seal but never locks its ticks. A
  newer correction records an explicit unseal. The factual kept-day Page is
  transient, occupies the Protocol slot, pauses idle rotation, and one swipe
  removes it without adding a stack or chapter run.

## The key

Every pressable thing in Circle OS is one object, described once in the
`--os-key-*` tokens and consumed everywhere: a face raised on a solid leg, lit
along its top edge, that drives flat onto the surface when pressed and comes
back up a little slower.

- A control names its size and its leg colour. It never restates a shadow.
- Sizes are lifts, not heights — `--os-key-lift-lg / -md / -sm`, 4px / 3px /
  2px — so one recipe fits a 30px task tick and a 52px footer action. The leg is
  exactly as tall as the lift, so a press removes both and the face lands where
  the leg was.
- A leg is never blurred. A blur reads as floating; a key is seated in the box.
- The top light is drawn only where it can be seen: `--os-key-light` on a light
  or orange face, `--os-key-light-soft` on Ink, `--os-key-unlit` on a Bone face
  that is already the lightest thing on the Page. The unlit value is a
  transparent shadow, never `none` — `none` is legal only as a whole box-shadow
  and voids the leg with it, leaving a face floating above nothing.
- Down is `--os-key-press-ms` (40ms). Anything slower reads as lag rather than
  contact. Pressed and held states are sunk, so the light comes from inside the
  hole rather than off the top edge.
- Row ticks, Protocol terms, the button engine's default style and every plain
  full-width Page action are built from this, and so is anything added later.
- A ghost control is not a key. `.os-add-habit-row` stays flat, because a dotted
  invitation that presses like a commitment claims to be one.
- The rotating bag of button styles belongs to Button Studio. The App's own
  actions use the standard key.

## Page arrival

- Leaving is one flat content-layer fade. The App Box background stays stable.
- New or refreshed content enters Body first, Header second, Footer last.
- Ordinary swipes remain quick and never replay the refresh sequence.
- **An App Box never empties and replays its arrival to confirm an action.**
  That is what it does when a Page changes for any other reason, so it answers
  "something happened" rather than "that went". A send is signalled by the thing
  that was sent leaving: the written words lift and fade while the frame, the
  Label and the Footer hold still and the action holds on its completed word.
  Where a Page carries a question and an answer, only the answer travels.
- **An App Label has no arrival of its own.** It is present with its Page. A
  word that names where you are may not be the last thing on the Page to settle.
- A terminal Page never fades itself. After its protected pause, the person's
  deliberate swipe uses ordinary Page travel. Reduced-motion removes the cue's
  small arrival animation but not the 1.2-second accidental-swipe guard.

## App back

- An optional App back is a side change inside the same stable App Box. Its
  front is what is needed today; its back is what the App holds.
- Note / Line, Thoughts / Deep Thoughts, Routine / Record and Protocol / Phases
  use the same controller and timings: 260ms to leave, a 500ms calm arrival and
  840ms for the complete handoff.
- The controller holds the old measured height through the leave, then eases
  the frame to the fully measured incoming Page over 440ms while that Page
  arrives. Copy and geometry settle together instead of flashing first and
  resizing afterwards. Reduced-motion mode changes sides immediately.
- A mode label names the visible side. It is never an edit or completion
  action. Returning to an already known side does not replay a staged arrival.

## Named placement

- `AppPagePlacement` is the Page placement contract. A Page declares
  `balanced`, `identity-stack` or `content-flow`; feature CSS does not borrow
  another App's placement class.
- `identity-stack` owns one Header track, an optional absolute right action,
  the shared `.os-app-page-heading`, labelled `.os-app-page-stacks`, and the
  direct Footer action geometry.
- Routine and a running Protocol both declare `identity-stack`. Log, Record and
  Protocol home declare `content-flow`. Moving a shared heading or Footer rule
  moves every Page that names the contract.
- A Vision declaration versions only through `Save declaration`. Blur, route
  reload and ordinary typing never create a declaration. The current front
  shows three kinds: Vision, Mission statement, and Typical Tuesday. Tapping a
  declaration's top-left kind label flips to superseded immutable records on
  the shared App back. On that back, `History` is a passive top-right state
  label rather than a second action. Character and Six months already exist as
  versioned records; their front-Page design remains a separate review.

## Athena Reading replies

- An authored Reading paragraph may end with one real question. Only the
  latest Reading can be replied to; an older immutable edition stays read-only.
- `Reply` opens one textarea on that Reading Page. Sending uses the shared
  survey and evidence queue with kind `athena-reading`; it does not create a
  score, count, reaction, or separate feedback store.

## Fixed evidence Apps

- Log uses the shared Page and frame rather than a route-level heading above a
  free-standing timeline. Its evidence surface remains dark.
- A long timeline uses `minmax(0, 1fr)` for Body and scrolls within that Body.
  The route and swipe page remain still.
- The App Box owns background, border, radius, clipping and shadow. Until its
  second App exists, Log shows no back control.
- Log owns one persisted outer `SwipeSession` and never rotates itself. Its
  first Page remains the hour-by-hour timeline. Its saved Dreamline journey
  follows as Setup, Having, Being, Doing and Income.
- Dreamline uses the shared App-back controller. Its back contains Now,
  Tomorrow and Day After only. The top-left `Dreamline` mode label flips the
  current record; it does not start, save, conclude or edit one.
- A Dreamline is separate from Vision declarations. It is dated, costed and
  finite; a concluded record remains immutable and readable while a new
  Dreamline begins with a new id.

## Protocol home

- With no running phase, Protocol home is front. With a running phase, the
  phase is front and home is the `Phases` back.
- Home reads completed and early-ended runs from existing local records. It
  stores no aggregate and presents only within-phase counts, dates and terms.
- Starting from home uses the existing one-run draft path. A second draft is
  never created to satisfy navigation.
- Removing a finished or early-ended record archives its run with a newer
  timestamp. Archived runs stay out of the Page and its read models but remain
  present for local-first merge. A draft or running phase cannot be archived.
- Phase records and their dividers fill the Body width. Their name, outcome,
  kept days, dates and term counts stay grouped as one reading rhythm rather
  than being pushed to opposite edges.

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
