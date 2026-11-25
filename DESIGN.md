# Circle Design Guide

## Template answer controls — 2026-11-14

Approved follow-up replaces the single full-time wheel with three immediately visible, separately scrollable Hour, Minute and AM/PM columns. Initial centres are 6, 00 and AM; the minute wheel shows 59/00/01. AM/PM has exactly one AM and one PM and stops at its ends; only Hour/Minute wrap. Options retain 44px targets and keyboard access. Untouched hints are not answers. Template written/numeric answers use a transparent writing area with a thin Bone line fading to transparent at both 24px content anchors. Multiline answers grow naturally; other text-entry contexts retain their existing rules. Result previews omit the generated daily schedule sentence and retain the ongoing checkbox.

Template opening Pages use shared PageLayout with 28px/700 heading, 18px/400 body, 24px inner anchors/gaps and unrestricted heading width. Their Begin › uses RoutineSwipeCue with a 44px target instead of the former large Swipe to begin button. This is scoped to template covers; existing Chapter covers are unchanged.

## Template review corrections — 2026-11-13

Glass numeric answers explicitly use the 18px/400 answer role, including under the legacy mobile 16px input floor. The Circle time control follows the approved 2026-11-14 three-column replacement above, with a 6:00 AM hint, 44px options and keyboard focus/arrow selection. Untouched hints are not answers. Template Routine result Pages use the shared PageLayout header and Routine body/copy presentation; per-item type badges and generated preview disclaimers are removed. Target means amount; optional Effort means difficulty and remains absent from a result when unused. Authored action wording may place target/unit/effort slots; existing plain wording stays readable.


## Template preview scope — 2026-11-13

Explore's approved 2026-11-14 design uses three independent glass carousels:
Chapters, Habit/Protocol, Articles. Headings sit outside the panels at the 24px
left anchor. Keep the logo/account header and bottom navigation, remove the
visible outer frame, and use Today's Ink background. Cards use the shared glass,
28px/700 headings, 18px/400 prose, 24px inner padding and compact-context minimum,
growing naturally. The page scrolls vertically. First/last cards show the inward
neighbour. Interior selections show both neighbours. The selected card is subtly
larger. Every card uses the shared panel shadow. Native scrolling snaps and stops
at both ends. Keyboard arrows/Home/End provide the equivalent path. Missing
cover, title and description fields stay absent. An empty row has two blank
panels, and a single item has a blank neighbour. Tapping authored content opens
its exact version.

Explicit Add to Routine uses the shared glass action rules, including disabled,
press and accessibility states. Circle source marks open flat saved-detail
disclosures with 44px targets. Source text retains the normal readable main and
supporting roles; disclosure does not add an App Box or save evidence.

Protocol Start follow-up (2026-11-14): setup says Preview; running preview's primary action is Start (disabled in Admin). Existing phase/draft uses Open Protocol. Measure the visible action rim at 24px from the inside bottom/side borders; remove the legacy 8px button top margin that overflowed its wrapper. Start remains mounted and returns to ready after a failed save so retry works.

Protocol correction approved 2026-11-14: result previews reuse ProtocolPage for fixed-term setup and a read-only running phase. The template name is the phase name; duration uses the live choices. Preview phase opens Day 1 of the selected duration. Back retains duration. Completion is disabled; Phases/Edit/End/seal actions are absent. Protocol's own labels, agreement rows and separators replace the Routine representation.

New Habit/task and Protocol templates reuse the glass Chapter player, shared Page anatomy and current brand/type tokens. Preview content is temporary; completion faces are visual only. Action wording uses the Routine main role; quantities/cues use its supporting role. Routine's ongoing choice has a 44px label target with a 28px checkbox. Optional numeric questions and before/after-text images apply only when explicitly declared. Unmarked historical Pages keep their rendering. Result preview Pages grow naturally and do not introduce nested rounded frames or scrollers.


Updated: 2026-11-11, Asia/Bangkok. This owns the visual contract.
[Product](docs/PRODUCT.md) owns meaning; the
[Page standard](app/os/APP_SESSION_STANDARD.md) owns interaction and motion.
Earlier trials are [historical](docs/archive/2026-11-11-doc-cleanup/DESIGN.md).

## Identity

**Whole. Human. Alive.** Circle is a calm place to notice life, choose actions
and reflect. It must not pressure someone through a score of their worth.

Use the exact palette and typefaces in [brand-system.ts](app/brand-system.ts).

| Token | Value | Role |
| --- | --- | --- |
| Bone | #F1EFE8 | Reading and primary wording |
| Ink | #191813 | Foundation and focused depth |
| Orange | #E36B37 | Action, identity and active state |
| Charcoal | #403E35 | Structure and secondary information |

Geist owns every functional app surface. Cormorant Garamond is only for outer
editorial headings. Use simple English. Do not shrink type to force a fit.

Solid Light/Orange/Dark themes remain available in existing compact/chapter
contexts. The six opened tools use the approved dark glass family below.
Glass reflections may derive from brand colors; decoration never implies data,
progress or new evidence. Do not apply generic editorial motion to app controls.

## Shared tool contract - 2026-11-11

Applies to Note, Deep Thoughts, Routine, Protocol, Log and Week, including
History, Trash, Record, phases, details, corrections, confirmations and writing
sync. Routine is the reference. Update this contract when a shared rule changes;
do not prepend another conflicting feature override.

| Role | Size / weight | Rule |
| --- | --- | --- |
| Heading | 28px / 700 | 1.2 leading, -0.015em tracking |
| Primary wording and action labels | 18px / 700 | Compact task leading 1.3 |
| Prose | 18px / 400 | 1.5 leading |
| Header navigation | 16px / 700 | 1.4 leading, sentence case |
| Supporting wording, time/location, cues | 16px / 400 | Week steps are supporting wording under bold goals |
| Metadata and dates | 12px / 400 | Preserve readability |

Only weights 400/700. Reading, editing and placeholders use matching role
metrics. Text entry remains borderless, including focus, with a visible caret.
Non-text controls keep visible keyboard focus.

### Spacing and geometry

- Use shared four-pixel spacing tokens. Standard padding is 24px, measured
  from the inside frame border to visible wording/glyph/rim edges.
- Header-to-first-Heading/Body, Main-to-Sub and Body-to-Footer are 24px.
  There is no 48px forehead exception in these six tools or supporting views.
- Main begins at that anchor and grows downward; changing line count never
  recentres it. Empty optional regions occupy no space.
- Section/action-to-cue gap is 40px; cue wording-to-arrow gap is 4px.
  App-to-App gap remains 16px where applicable.
- Reference Routine rhythm: 4px within Habit fields, 8px between rows, 12px
  list-to-creation-action and 40px between Habits and Tasks.
- Cross glyphs begin at the 24px left anchor; Routine copy retains its 20px
  indent. Visible completion rims meet the 24px right anchor. Invisible targets
  may enter gutters but must not overlap adjacent targets.
- Week columns: goal cross/Add goal plus at 24px; goal words/Add goal label
  and task cross/Add step plus at 44px; task words/Add step label at 64px.
  Goal-group gap is 24px, task/add gaps 8px and goal-to-task gap 12px.
- One focused minimum is measured against bottom navigation and safe areas.
  Short pages share it; real content grows downward with natural page scrolling.
  The retired 480px/60dvh writing/history cap does not apply to opened tools.
  Preserve frame width, top edge, radius and material during Page changes.

### Frame and controls

The App Box owns border, background, shadow, clipping, radius and height change.
Pages move inside it without another outer card. Reference frame radius is 36px,
with 12px backdrop blur at saturation 1.2, a 3% Charcoal base and a light
diagonal wash. The 1px Bone rim uses 16% opacity, with faint 1px reflections along
the top and left. Outer shadows use 16% Ink and 4% Orange. Use this finish for
existing tool and content glass, Explore panels and the bottom navigation.
Individual Notes collection panels use the shared Ink shadow and Bone inner
reflections. The enclosing Notes App Box uses the full glass shadow.
Controls have brighter silver reflections, 8px blur, Ink lower
edges and faint Orange shadows. Verify vendor prefixes in compiled production CSS.

| Control | Current visual rule |
| --- | --- |
| Glass action | Shared 52px height, 12px radius, 18px/700 label, full width between 24px anchors |
| Completion face | 28px Orange glass rim, 2px Ink gap, 22px Orange liquid |
| Checkmark | Immediate white Geist ✓, 16px/400, matching Log's save mark |
| Clear | 8px cross, 1.5px strokes, at least 44px target |
| Every interactive control | At least 44px effective target and meaningful accessible name |

Liquid rises over the shared 300ms completion response. Protocol word taps do
nothing: only its checkbox toggles. Kept words remain visible and fill Orange
with the same upward liquid clip, curve and 300ms duration, without strikethrough.

Use the shared glass variables under .circle-os in app/os/os-app.css, including
panel/action dimensions and blur. Keep the button engine and shared control
components; Button Studio experiments are not defaults.

### Motion and verification

The [shared interaction table](app/os/APP_SESSION_STANDARD.md#shared-tool-interaction-contract---2026-11-11)
owns timing. Week no longer waits for a checkbox-first sequence or a three-second
goal dwell. Evidence saves immediately; text responds over 300ms. Structural
resize is 600ms; typing is immediate. Header reflection is 240ms inside letters;
glass press/release is 150/400ms.

Reduced motion uses direct endpoints, reduced transparency removes glass/artwork,
and forced colors preserve readable/announced states. Decoration never delays
an action. Existing Page travel stays quick; staged arrival belongs only to a
genuinely new cover.

Run the tool-consistency browser matrix and affected journeys using compiled
production CSS. Measure visible edges, role typography, all Note/Deep Thoughts/
Habit/Protocol reference frames, forehead gaps, long growth and intermediate
motion. Token assertions alone do not establish visual consistency. Include
focus/targets, preferences and relevant persistence with synthetic isolated data.
Record actual results in the [journey record](docs/USER_JOURNEY_TESTING.md).

## Shared Page anatomy

Header, Heading, Main Body, Sub Body and Footer are the shared regions.
Main/Sub carry roughly two-to-one visual weight, not reserved blank space on
Cover or writing pages. Content-heavy Routine/Protocol tracks size to real rows.
The frame stays still and paints one uninterrupted shape while Pages move.

Existing unmarked chapter contexts retain their shared default minimum and existing
tokens unless explicitly adopted into the opened-tool contract. Do not copy the
six-tool dimensions into Reflect, chapters or Admin as an unreviewed redesign.
The [Page standard](app/os/APP_SESSION_STANDARD.md) distinguishes those contexts.

- **Cover:** one hook, optional subtitle, no Header label, never editable;
  Swipe to begin / Swipe to see cue.
- **Chapter:** progress at right only, one question/lesson and one interaction;
  Continue/Confirm action. Short inputs do not manufacture extra height.
  Existing editable short/long question and declaration contexts retain their
  approved 29px main / 18px body scale until separately changed.
- **Notes:** use two columns of compact glass panels within one App Box. The
  newest two align at the top, newest on the left. Each column stacks with
  a 4px gap between panels, and the columns are 4px apart. Panels use 12px
  padding and the shared 12px action radius. Show the title at 18px/700, the
  body excerpt at 16px/400 with 1.5 leading, and the time or date at 12px/400.
  Preview up to two lines for bodies of 120 characters or fewer, four for
  121–400, and six above 400. Clip longer previews with an ellipsis. Today's
  items show the time. Earlier items show a short date such as `Nov 25`.
  Trash sits at the collection's top right, and the centered Orange plus
  sits in its footer. The full-page note has an Orange bin at the top right.
  An empty collection uses the same frame and action layout.
- **Deep Thoughts:** Quote/History, question/answer and Send or Save changes;
  Next question is deliberate.
- **Reading:** distinct authored prose and source evidence; no invented missing
  words or borrowing current observations into an old edition.

## Navigation and materials

Today uses the same glass panels, sizing, horizontal snap and selected-panel
scale as Explore. The three independent rows pair Notes with Deep Thoughts,
Routine with Protocol, and Log with Week. The first panel leads and the next
peeks in from the right. At the end of a row the first panel peeks from the
left. The tool names sit inside the panels. One tap anywhere on a panel opens
that tool. Preview copy stays brief, and there is no empty-state filler.

The bottom navigation spans the tool frame's width and is 60px tall. Today,
Home and Reflect share one glass pill. A matching 60px Explore circle sits
8px to its right. All links have 22px icons, 12px labels and a 4px gap between
them, with at least 44px tap targets. The group stays available in opened
tools and hides together for the keyboard. Home shows the signed-in Personal
Imprint where enabled. Explore uses the three approved discovery rows above.

Reuse PageLayout, SwipeSession, useAppBack, RoutineHeaderButton, RoutineSwipeCue
and the button engine. Their legacy names do not restrict reuse to one tool.
Manual pairs remain Note/Deep Thoughts, Routine/Protocol and Log/Week. Deep
Thoughts' Note cue and Week's Log cue begin at the left anchor.

Opened tools sit over the same shell background as Today. The Personal Imprint
is the artwork on Home, Today and Reflect, with Ink behind it. Honor
reduced-transparency and motion preferences.

## Future design boundaries

The [signed-in Personal Imprint](docs/PERSONAL_IMPRINT_HOME.md#signed-in-home-imprint--2026-11-23)
uses the reviewed strand artwork and saved-activity color. A form generated from
replacement-onboarding answers and tool shortcuts from Home remain future work.
[Onboarding](docs/ONBOARDING_SPEC.md) is the replacement target, not implemented.
The [Reflect proposal](docs/REFLECT_PAGE_POTENTIAL_IMPLEMENTATION.md) is saved
for later; no new discovery-writing or declaration layout is adopted here.

The developer decides visual language. Installed Taste skills can improve craft
but cannot override Circle identity, this guide or the Page standard.
Admin previews use the production frame/anatomy and bounded parent width;
choice options remain one full-width row each. Preview metadata does not call AI.

Newly created Chapters and Articles use the current glass frame, role typography,
24px anchors and focused minimum with natural downward growth. Chapters persist
`designVersion: glass-v1`; an absent marker retains the existing design, including
saved drafts, published versions and old runs. New blank/template chapters and
new independent copies receive the marker. A new version of an existing chapter
preserves its design. Previews use the same rendering path. Images retain their
natural proportions, with alternative text and optional captions. This adoption
does not restyle historical chapters or alter completion/answer rules.
