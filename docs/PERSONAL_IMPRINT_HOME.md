# Personal Imprint: Circle OS Home

## Signed-in Home Imprint — 2026-11-23

The developer reviewed the Home Imprint changes and confirmed they look good.
The current signed-in review uses the fixed Sori strand artwork. Bone can
appear while the color layer loads. The renderer uses a 1,170 × 1,755 image at
higher pixel densities, with a 390 × 585 version available as a fallback.
Generating a personal form from replacement-onboarding answers remains planned.

Saved account activity colors six areas:

| Area | What counts |
| --- | --- |
| Starting/Chapters | A newly saved Chapter finish. |
| Note | A new saved Note with a title or body. |
| Deep Thoughts | A new submitted answer with text. |
| Routine | A tracked habit or Routine task completion. |
| Log/Week | A saved Log block with a known end that has passed, or a tracked Week task completion. |
| Protocol | A newly saved daily seal. |

Each area grows once per qualifying Circle day. Orange grows along nearby
strands, starting them one at a time and slowing after the 14th qualifying day.
Fresh Orange fades once at the first 06:00 in its recorded zone at least 24
hours after the contribution began. Failed saves leave the last saved color
intact. The relevant source rules below describe how Undo and clearing affect
the projection. The artwork reflects activity from this device's account records.
[Imprint test evidence](USER_JOURNEY_TESTING.md#home-imprint-strand-renderer--2026-11-23).

## When Home plays the pulse

A qualifying action queues a pulse after its local save succeeds. Home plays
one pulse per affected patch when it is visible and the artwork is ready, even
if the person takes longer than ten seconds to open it. A saved Log block can
queue its pulse once its end is observed while the app is open and visible.
Home only pulses for sources that still count. Reduced motion, reloading or
starting a new app session shows saved color at rest. The saved contribution
time sets its age.

## Deferred proposal: swipe-through Imprint tutorial — 2026-11-25

Review and finish the shared glass panel changes first. Then plan the Home
implementation using the shared App Box and Page components. The Imprint and
tutorial use the same glass frame, which stays in place as the content moves.
[Shared Page standard](../app/os/APP_SESSION_STANDARD.md#interaction).

- Home opens on the person's Imprint. Orange shows their saved activity.
- Swiping left on the Imprint opens the tutorial. Each Page starts with one
  illustration of the person's Imprint, with the relevant strands highlighted
  in Bone and the area name beneath it.
- Swiping up advances one Page. Proposed order: Chapters, Note, Deep Thoughts,
  Habits & Tasks, Log & Week, and Protocol.
- Swiping up from Protocol or swiping right from any tutorial Page returns to
  the Imprint.

The tutorial is read-only. The proposed starting Page on each visit is
Chapters. The illustrations also work on day one, before the Imprint has any
Orange. Use equivalent keyboard and assistive controls for opening, advancing,
and returning. Review whether the first left swipe needs a small visual cue
after the glass panel changes.

Verify at 360px and 390px that a swipe advances one Page, a diagonal drag picks
one direction, and both return paths work. Check that the frame stays steady,
the keyboard and assistive paths work, and returning to the Imprint does not
replay a pulse that already ran. This is a saved proposal for later review.

## Local Chapter finishes — 2026-11-22

The Starting/Chapters patch reads new finishes from saved runs in the signed-in
Home review. The existing finish action works on new and resumed runs. The
finish time determines the local 06:00 Circle day. Each successful finish queues
a pulse for Home. The first finish sets the
day's age and later finishes support the same growth. Reload, retries, previews,
History, and older completed runs create no pulse. Older run dates and
definitions are preserved. Home uses run identity and timing only.

## Local Log blocks — 2026-11-22

New blocks with a known end time support the signed-in Log/Week patch after
they are saved and have ended. A newly elapsed block can pulse when the app
is open and visible, and a late first save can pulse at acceptance. The
clock for a day first qualified by Log starts at the qualifying block's
recorded end. A Week check and multiple Log blocks share one day's growth.
The original day clock remains after clearing while a source still supports
the day. Word edits do not create another event. Reload and resume catch up
quietly. Older blocks without recorded timing, and newly recorded blocks
whose exact end is ambiguous because of a clock change, stay in Log history.

The adapter stores the original time zone and exact end alongside the block.
After midnight the saved Circle day remains the day of the start slot, including
05:00–06:00. Tracked clears reuse the dated receipt that suppresses stale
restoration. This is the local signed-in review scope. See
[Log journey evidence](USER_JOURNEY_TESTING.md#log-blocks-on-home-imprint--2026-11-22).

## Local daily Protocol seals — 2026-11-22

The signed-in Imprint review now projects newly saved Protocol seals from
the account's local Circle state. One dated seal supports the Protocol patch;
multiple seals on the same Circle day support one day's growth. Open Home in
the same app session to see the pulse. Checking terms alone
adds no color. Undoing a required term in a running phase removes that seal's
support. Changing an optional term or archiving a finished phase preserves it. A new
seal after Undo can pulse, keeping the original contribution's time and zone.
After the pulse has played, reopening Home shows the saved color at rest.
If neither local store saves the change, Home shows the last saved state.

This slice starts with new seals, following the local Routine and Week rollout.
Older seals remain available in Protocol history. The saved day, reward screen,
wording, and account boundary are the existing Protocol behavior. The source
metadata lives on the seal record alongside its status and is read by the same
Home projection and local save acknowledgement used for Routine and Week.
[Protocol journey evidence](USER_JOURNEY_TESTING.md#protocol-seals-on-home-imprint--2026-11-22).

## Activity model study — 2026-11-17

The developer approved [the activity proposal](IMPRINT_ACTIVITY_PROPOSAL.md),
including its event map and edit/Trash rules. The isolated preview is
`http://127.0.0.1:3024/?study=activity` (start with
`node scripts/preview-personal-imprint.mjs`). Production Home remains separate.

`imprint-activity-model.js` accepts receipt metadata, with stable owner, source,
operation, attributed day and application time; it stores no writing bodies.
Only successful, changed, qualifying actions count. A Note's first nonempty save,
a sent Thought, finished Chapter, Routine habit/task completion, Week task
completion, ended saved Log block or daily Protocol seal qualifies. Unknown task
origin is excluded. Edits, drafts, unchanged saves, retries and failed writes add
neither spread nor a pulse. The receipt boundary is synthetic; no production
durability adapter is claimed.

Each group/day grows once. Its first application time stays stable while sources
are added, removed or restored. Each day's new feathered field is the difference
between successive nested growth fields, with its own fresh/faded clock. Older
growth is not refreshed. Cross-group overlap retains the existing maximum-field
combination. The curve `1-exp(-days/22)` and Orange trial 1/.60/.35 remain visual
examples. Geometry, anchors and accepted Bone assets are unchanged.

The canvas gives accepted actions a 1.5-second smooth brightening of that area's
existing color. Rapid actions restart from the current pulse amplitude; reduced
motion shows the final state directly. Reconciliation and source restoration do
not pulse. A deliberate completion after Undo can pulse once with a new operation
ID while keeping the original day's growth clock. Trash/Undo/clearing temporarily
exclude a source, deletion is terminal in this model, and archiving a definition
retains its completed evidence. These are projection rules, not new writing UI.

The preview has two fictional owners, six accepted shapes, synthetic actions,
multiple saves/day, failures/retries, edits, future Log, lifecycle controls,
before/at-cutoff times and a quiet month. Reload synthetic records round-trips
the in-memory fixture; real browser reload returns to the seed without a pulse.
There is no persistent contribution store. Interactive coloring uses the existing
sampled phone coordinates and approximates fine edges; this does not resolve the
production phone renderer. The separate full-resolution Sori reference uses the
shared supersampled material capture. Its unchanged monochrome render reproduces
the accepted hash. [Four exports/report](design/personal-imprint-activity-v1.json)
cover mixed ages, all faded, quiet month and Trash. Faded and quiet images are
byte-identical; Restore reproduces the original mixed-age state.

### Read-only source coverage audit

| Source | Existing evidence | Limits for future adapters |
| --- | --- | --- |
| Account writing (`app/os/writing-model.js`, save/history/lifecycle) | Account-bound store; entry ID/kind/source; startedAt, createdAt, immutable version savedAt and attribution day/timeZone; receipts; active/trashed state and terminal tombstones | Determine first nonempty acceptance from versions/receipt, preserve starting day across 06:00; do not use updatedAt as new activity. Deleted bodies are scrubbed and retained usage is minimal. No new retention requirement is activated here. |
| Chapter (`chapters/chapter-types.ts`, `chapter-model.js`) | runId, exact chapter/version, completed status/completedAt, answer snapshots | Owner comes from the scoped store. Missing historical dates remain unknown; browsing/history is not completion. |
| Habits (`circle-os-model.js`, toggleHabitForDay) | habit/day completion ID, dateKey, completed, completedAt, wording snapshot | Undo clears completedAt. Original application time across Undo cannot always be recovered from current records alone. Never invent it. |
| Tasks (`circle-os-model.js`, task completion functions) | One task identity shared by Routine and Week; one-time completedAt or dated repeating completion records | No reliable historical completion-origin field. Missing Routine/Week origin stays unknown; never infer it from where the task is currently shown. Undo may clear original time. |
| Protocol (`circle-os-model.js`, daily seal) | run/day seal identity, dateKey, sealed flag, sealedAt/unsealedAt and accepted terms | A seal is distinct from a phase finish or term tick. Re-sealing can overwrite current timestamps; original contribution evidence needs separately reviewed handling. |
| Log (`circle-os-shell.tsx`, saveLog; `circle-os-model.js`, upsertTimeBlock) | Block ID, enclosing day, start/end strings, createdAt/updatedAt; corrections retain ID/day/range | Historical timezone/precise occurrence is not universal. Resolve cross-midnight/06:00 ranges from known attribution only. A late save needs a reviewed age mapping; current synthetic actions provide explicit savedAt/endAt/application time. |

No real record import, adapter, lifecycle mutation, persistent contribution store,
production clock, Home wiring, sync activation, migration or deployment is included.
Historical missing metadata stays unknown. Current account-separated local-first
storage and immutable Chapters/readings are untouched.

### Verification

Installed bundled Node v24.22.1 runs the focused activity/growth/fade/color/Orange
tests; scoped strict TypeScript and focused ESLint pass. The renderer verifies
the accepted monochrome hash before exporting. The independent asset test checks
hashes, 390x585 dimensions and byte-identical faded/quiet outputs. Browser checks
at 360/390/416/1280px cover owner isolation, qualifying/failure/retry/edit paths,
multiple sources, visible pulse and settling, Trash/Restore/Undo/clear/delete,
archive, future Log, unknown/Week task origin, exact cutoff, no extra fading,
reconciliation and reload without pulse replay, reduced motion and unavailable/
incomplete/corrupt assets. All six shape assets are exercised at 390px. Empty
activity reproduces the source Bone canvas exactly. No overflow, sub-44px targets,
storage writes or page errors were observed. Screenshots/report are in
`outputs/imprint/activity-*`; browser checks use installed Chromium outside the
sandbox. Full suite/build remain unrun for this bounded preview-only slice.

No further optimization is justified by these checks; repeated equal-age growth
layers are collapsed algebraically during painting. The developer still judges
the appearance, pulse and growth curve. Production renderer/cache measurements,
historical attribution decisions and Home integration remain separately reviewed.

Updated: 2026-11-16, Asia/Bangkok. Status: isolated synthetic artwork prototype;
production Home and personal-record integration remain unimplemented.

## Brighter fresh and faded Orange — 2026-11-16

**60% revision.** Developer requested trying 60% faded brightness after the 72%
comparison. Six fresh comparison PNG hashes stay identical; faded-dependent
states are regenerated. All 90 exports, eight focused tests, independent image
checks, scoped type/lint and four browser widths pass at 60%. The prior Sori 72%
image is retained at outputs/imprint/orange-faded-72-reference.png. Appearance
remains developer review; the single-fade timing is unchanged.

Developer asked for clearly visible Orange in both states and a visible fresh/
faded difference. The earlier tint only multiplied/darkened Bone channels; raising
its amount alone could not make dark fibres bright enough. The current display
trial uses brand Orange with a monotonic shade lift (exponent .35), fresh level
1 and faded level .60 (revised from .72). Temporal brightness is separated from the feathered area
weight: faded fibres keep their Orange hue at a lower luminance rather than
blending most of the area back toward Bone. Both levels remain developer visual
review. Lighting order within a colored area stays monotonic, but its contrast
is compressed by the lift; this is a display treatment, not physical re-lighting.

growthPaint combines maximum area weight and maximum weighted activity presence
separately, keeping overlapping fields continuous. The same-area fresh/faded
presets fix all spreads equally so appearance can be compared without confounding
growth. ?study=growth adds those two options and a side-by-side Sori disclosure.
Growth, anchors, geometry and the single fade cutoff are unchanged. The original
color study remains available as earlier evidence.

Brighter color made the sampled phone-coordinate stippling obvious. The growth
exporter now reuses createReliefGeometry and the shared material capture at full
resolution, evaluates material fields via 2,048-interval lookup tables, colors
only depth-winning fibre samples and reduces through the established antialias
pipeline. No sampled phone mask is used for these exported colors. Phone samples
are retained only for unchanged front-anchor calibration. All six accepted full
monochrome images reproduce byte-for-byte during export. The old color study's
interactive canvas remains sampled; a production phone renderer is still open.

render-imprint-growth.mjs outputs 15 states/90 phone images. The one-time faded
views still match byte-for-byte at next-day/two-days/month-later points. The new
inspect-imprint-orange.mjs independently checks all 90 asset hashes, accepted
baseline references, alpha/borders, fresh>=faded RGB ordering and internal Orange
visibility/separation diagnostics on each form. Faded Orange counts under its
threshold range 5,307–9,720 pixels; average fresh-minus-faded red difference on
those samples is 37.4–42.0 levels. These thresholds are diagnostics, not proof of
human at-a-glance recognition or a final brightness choice.

Focused orange/fade/growth/color tests pass 8/8: lit-core visibility, distinct
states, zero-color identity, smooth edge approach, shade order and prior timing/
growth cases. Scoped strict TypeScript and focused lint pass. Four browser widths
360/390/416/1280px pass all 90 image states/hashes, open side-by-side comparison,
44px controls, reload and missing/incomplete inspection. No page errors, overflow
or storage writes. Final comparison screenshot inspected. Browser execution used
approved outside-sandbox access; QA server closed. Existing local3024 retained.

Full build/suite/lint stay paused; the older preview's baseline lint issue remains.
No Page/tool geometry, real data, clock, persistence or sync changes. Existing
recovery/artwork preserved; no staging, commit or deployment. Next: developer
reviews Orange strength, fresh/faded separation and shaded depth on the same-area
comparison. Final numeric levels and Home execution/integration remain open.

## Single fade after 24 hours and local 06:00 — 2026-11-16

Developer confirmed one brightness change only, and clarified the cutoff as a
full 24-hour wait followed by the first local 06:00 at or after that wait. Examples:
Monday 21:00 -> Wednesday 06:00; Tuesday 05:30 -> Wednesday 06:00; Tuesday 06:00 ->
Wednesday 06:00; Tuesday 06:01 -> Thursday 06:00. No ongoing dimming follows.
Accumulated spread remains; a later application can start a fresh cycle.

colorFadeAt/colorBrightnessAt in imprint-growth-model.js implement that local
cutoff from application time, separately from growth. Invalid times fail visibly;
future application times do not create current color. usageState retains its
unique group/day growth and uses latest application time for group-level preview
brightness. Real per-contribution application evidence, timezone/travel handling
and production clock integration are not implemented. Fictional use-days in this
study all apply at 06:00; precise 21:00/05:30 cases are covered by timestamp tests.
The initial .95/.18 levels were illustrative; the brighter Orange trial above
replaces those display values without changing this cutoff. Growth remains a trial.

The growth gallery now includes next-day-06-faded-once, two-days-later-unchanged
and after-one-month-without-use. Renderer assertions verify these three exported
PNGs are byte-identical for each of six forms, so inactivity produces no further
fade. There are now 13 states/78 phone exports. The earlier quiet-month label and
exponential brightness curve are superseded; previous dated evidence remains
historical. No geometry or front-anchor placement changed.

Focused fade/growth/color selection passes 6/6, including exact cutoff, minimum
24-hour wait, 06:01 deferral, year rollover, later fresh application, future/invalid
times, identical inactivity states and retained spread. Scoped strict TypeScript
and focused lint are checked for the affected source/preview/scripts/tests.
Full suite/build/lint remain paused. The sampled-coordinate fine-edge/stipple
limit and the older preview's baseline lint error remain. No real records, sync,
Home integration, shared tool geometry or production Circle-day behavior changes.
No staging, commit or deployment. Current task/handoff record final browser checks.

## Front-facing cumulative growth — 2026-11-16

Developer approved visible front locations for all six areas and a fictional
few-month example. They chose retained cumulative spread with fading brightness.
This extends the earlier illustrative fixed-size color study. Geometry remains
unchanged; use of each area's tools affects that area's spread. Empty elapsed
days and duplicate saves do not add spread.

New imprint-growth-model.js separates spread from brightness. The synthetic
example deduplicates active use-days per group and uses a slowing exponential
spread curve, with separate recency brightness. These constants are visual trial
values, not production activity semantics or approved rates. Six area anchors are
calibrated once per form from visible, lit material-coordinate samples, then held
fixed throughout the timeline. Fields retain periodic asymmetric feathering.
Width calibration requires at least 550 front samples with baseline red >45 and
field weight >.4 in a fully grown isolated area. All 36 combinations pass
(565–6,195 such samples); this numerical floor is a prototype diagnostic, not
developer acceptance of equal visibility or group separation.

Review http://127.0.0.1:3024/?study=growth. One fictional person uses Routine
daily, Notes/Log every two days, Protocol every four, Thoughts every five and
Chapters every nine, all beginning day one. Day 1/week 2/month 1/month 3 and a
quiet following month are available alongside six fully grown isolated areas.
The quiet month retains exactly the same spread parameters; only brightness
declines. Visibly detectable colored pixels can decrease as feathered edges dim.
Groups may overlap; their final separation and placements need visual review.

The new exporter reuses hash-checked accepted Bone images and material coordinates;
it changes only pixel color. Output is a sampled phone study with fine edge/
stipple approximation inherited from the cached coordinate data, not a new
full-resolution material render or a phone production solution. All 66 export
hashes are verified in the browser at four widths. Four focused growth/color
tests pass: monotonic use-driven spread, inactivity retention, duplicate-day
deduplication, empty use, unequal groups, periodic feathering and local growth.
Scoped strict TypeScript and focused lint pass. Four browser widths
360/390/416/1280px pass all states, reset-by-reload, 44px targets and missing/
incomplete report handling, with no page errors, overflow or storage writes.
Final comparison screenshot was inspected. Full build/suite/lint remain paused;
the older preview's baseline lint issue persists. QA server closed; existing
local3024 retained. No real records, sync, account storage, feeling or Home wiring.
Shared Page geometry, Circle day and accepted geometry remain untouched.

[Timeline, anchors and measured visibility](design/personal-imprint-growth-v1.json).
Next: developer judges each isolated area and month-three/quiet-month appearance,
then selects actual activity semantics, growth/fade rates and final area placement.
Pre-existing work preserved; no staging, commit or deployment.

## Abstract bundle-area color study — 2026-11-16

**Approval and rule.** Developer accepted all six rounded forms, chose color
before Home integration and approved the color-study proposal with corrections:
color belongs to a local bundle area, not an entire closed strand. Each affected
area must be abstract/asymmetric with soft, uneven fades at every edge. A strand
can gradually enter Orange and return to Bone elsewhere. This supersedes the
earlier constant-hue-per-whole-thread rule. Geometry and the six groups remain.

**Implemented.** imprint-color-model.js defines six stable material-coordinate
fields along and across the bundle. Multiple periodic waves vary their centers,
widths and crosswise boundaries; quintic feathering reaches zero smoothly. These
are illustrative placements, not approved product weights or final navigation
regions. Overlap combines by maximum strength. Feeling is excluded.

The shared material renderer has an optional capture hook retaining visible
strand ownership, interpolated course position and shaded supersample pixels.
Only visible winning fibres receive color, preserving depth/occlusion and gaps.
Color tints existing shaded pixels toward brand Orange; it does not re-light an
Orange physical material. Full exports recolor before supersample reduction.
Per-strand lookup tables at 2,048 course intervals avoid repeating trigonometry
for every pixel. The field remains local along a strand and irregular across it.

http://127.0.0.1:3024/?study=color shows all six forms in 12 states: Bone, input,
completion, mixed, older, busy, and each of six groups alone. A selected-form
canvas exposes area, strength, strand coverage and Reset to Bone. Interactive
recoloring uses nearest sampled phone material coordinates, so edge coloring is
an approximation to the full gallery exports. Coordinate and baseline downloads
are hash-checked; corrupt data shows an explicit error while the gallery remains
available. The same-task Week/Routine and Chapter mappings are explained using
synthetic area selections; real completion-origin storage is not implemented.

**Verification.** Installed Node v24.22.1 ran render-imprint-color.mjs: all six
accepted generator full PNGs and the separate Sori v4 PNG reproduce byte-for-byte
with the extended renderer. Zero-color exports also reproduce the accepted phone
PNGs. Only renderer source stamps/compatibility metadata in the existing relevant
inspection records were refreshed; accepted geometry and image hashes stay fixed.
inspect-imprint-color.mjs independently reproduces six geometry hashes and checks
all 72 image hashes plus six coordinate files, alpha, clear borders, exact Bone
baseline, and weaker input/older color relative to completion/mixed. All pass.

Combined focused color/generator/Sori/loop/recipe tests pass 46/46. They include
periodic, bounded, local feathered fields, smooth sampled transitions, zero reset,
invalid states and existing recipe/geometry retention. Scoped strict TypeScript
and focused lint pass for new color sources, scripts, tests and the extended
renderer. The older preview's existing set-state-in-effect lint issue remains.
Full suite/build/lint remain paused.

review-imprint-color.mjs passes 360/390/416/1280px, including all 72 gallery images
at 390px, controls, exact canvas Bone reset, color response, reload, Geist, 44px
targets, and missing/incomplete/corrupt-coordinate cases. No overflow, page errors,
external requests or storage/cookie writes. Initial test range value `.95` was
corrected to `0.95`; the incomplete-report check exposed a real undefined-samples
crash, fixed with a guarded lookup and full browser rerun. Final comparison
screenshot was inspected. Browser execution required approved outside-sandbox
access to the installed browser. QA server closed; existing local3024 retained.
Codex panel opening returned queued.

**Measurements and limits.** Once the scene exists, observed full-state export
times are roughly .26–.98s on this desktop, including resize/PNG work. Each raw
phone coordinate file is 2,737,800 bytes, before transfer compression; this is
prototype data, not a certified phone/cache design. First geometry/material work
still takes tens of seconds. Production execution and data size need review.

Color appearance, area placements, strength/coverage and fading remain developer
visual review. Input/older numbers are illustrative; no production day window,
aggregation, opacity or fade duration is chosen. Synthetic fades do not delete
records. No production Home, real activity/persistence, sync, feeling or deployment
was added. Shared Page/tool geometry, immutable personal content and Circle day
remain untouched. Pre-existing recovery/artwork preserved; no staging or commit.
[Color artifacts and inspection](design/personal-imprint-color-v1.json).
Next: developer reviews each area alone, mixed, and older examples before choosing
the product color rules and the subsequent Home execution/integration slice.

## Shared rounded generator — 2026-11-16

Developer visually accepted Sori v4 and approved generalizing its rounded
construction before wiring Home. Approved scope: preserve v4/old recipes; new
versioned personal generation across three families; six fully rendered fictional
profiles and 30 additional synthetic checks; repeat/correction/missing-input
behavior; complete strands, small openings and broad overlap review; local
gallery, performance measurements and these records. New examples require
developer visual review. Home UI, real records/persistence, Orange, feeling and
phone execution are subsequent reviewed work.

**Implemented.** A separate rounded-loop v1 recipe stores its supported numeric
course, relief method and bounded deformation. Earlier recipe generators and the
accepted Sori sources/assets remain unchanged. Curl and sweep use rounded numeric
courses; return uses the accepted Sori construction. The exact v4 relief field
varies across each bundle and along its course. Only actual fibres render; the
invisible guide follows repaired strand depths and supplies lighting estimates.

The normalized onboarding fingerprint chooses the family, width/height, lean,
smooth bend/phase, depth and handedness. This is three constructions with
continuous deformations, not unlimited new topologies or an assurance of unique
forms. No semantic life score is assigned. The supported transform has nonzero
XY Jacobian; a final uniform fit keeps the complete relieved object in frame.
The actual analytical evaluator applies the same transforms. Fibre count,
material, reflectance and light settings remain those of the chosen construction.
Recipes contain no name, birthday, answer wording or input digest. Retention
ignores later profile corrections. Unsupported versions/settings fail visibly.
There is no account storage/migration or runtime phone generator in this slice.

**Attempts.** Initially widening/deepening independently perturbed courses left
large openings; thicker sections then exposed tight turns, out-of-frame points
and depth-clearance failures in the wider sample. Those results are not certified.
The final path uses coherent deformations of rounded constructions and fits the
final geometry. Initial same-family phone pairs looked too alike; binding
handedness to the broad bend phase improved separation, followed by fresh six-form
renders, all 30 population checks, focused tests and independent inspection.

**Artifacts and review.** http://127.0.0.1:3024/?study=generator shows Mira, Arun,
Lin, Noor, Tala and Sori, with exact phone/details, silhouette/depth modes,
repeat/reorder/correction/missing-input actions and front/angled complete strands.
Accepted Sori and the earlier gallery stay linked. Missing/incomplete inspection
hides candidates; a rejected sample and unavailable strand data have explicit
messages. Controls recompute recipes in memory; displayed material images are
offline exports. [Inspection](design/personal-imprint-generator-v1-inspection.json),
[30-case record](design/personal-imprint-generator-v1-population.json) and
[internal visual review](design/personal-imprint-generator-v1-visual-review.json)
bind the relevant hashes and qualify the claims.

**Verification.** Installed Node v24.22.1 ran:

- `node scripts/render-imprint-generator.mjs`: six full material exports, each
  with 11 hash-bound image/data outputs. The first full PNG repeats byte-for-byte.
- `node scripts/check-imprint-generator.mjs --population`: 30/30 pass, ten per
  family, selected by family before inspecting geometry; includes explicit
  uncertainty and Burmese inputs. Every attempted selected case is recorded.
- `node scripts/inspect-imprint-generator.mjs`: six recipes/geometries, 66 assets,
  exact phone derivation, all 128 contributing strands, opaque/unclipped pixels,
  preserved guide voids, source/fixture hashes and accepted Sori hashes pass.
- `node --test tests/personal-imprint-generator.test.mjs tests/personal-imprint-sori-relief.test.mjs tests/personal-imprint-sori.test.mjs tests/personal-imprint-loops.test.mjs tests/personal-imprint-recipe.test.mjs`:
  final combined selection 44/44 passes, including legacy recipe/artifact retention.
- `node scripts/review-imprint-generator.mjs`: 360/390/416/1280px pass, including
  96 recipe actions, 36 front/angled strand comparisons, three hash-checked image
  modes, links/reload, Geist, 44px targets and missing/incomplete/rejected/missing-
  strand cases. No overflow, page errors, external requests or storage/cookie
  writes. Final desktop and phone screenshots were visually inspected.
- Scoped strict TypeScript for both preview components passes; focused ESLint
  for all new source/scripts/tests passes. The older preview's existing
  `react-hooks/set-state-in-effect` error at its loop reset remains; the same
  error reproduces in a copy with this slice's two added lines removed.
  Full build/suite/lint stay paused. `git diff --check` passes.

Across the six and 30 additional geometries: 4,608 closed strands, no ends,
nonfinite/out-of-frame points or insufficient-depth proper projected crossings.
Maximum final sampled turn is 29.77745 degrees; wrap position <9.7e-13, first
derivative <6.4e-9, second derivative <1.05e-4. Main openings range 0–2; maximum
relative guide-hole width/height .15625/.082707 stays below .16355/.10324.
One population case needs 6,144 samples after the 3,072-sample turn check; both
attempts are retained. All six pictured forms use 3,072 samples.

**Performance/next.** Observed six-form construction is 8.2–12.6s, inspection
1.8–4.0s, full material rendering 19.5–30.8s on this desktop while independent
checks also ran. These are not phone or production latency measurements.
Retaining the recipe and reusing generated render data is the proposed Home
route; choose/measure its execution and caching before implementation. Whole-
strand Orange recoloring needs retained strand information, not just a flat PNG.
No broad optimization was made solely to finish a checklist.

The developer's acceptance of the six new forms remains open. Family members
remain related; some inner folds look sparse/dark/wire-like. Internal phone
inspection did not identify over ten broad overlapping bundles, but this is a
visual assessment, not an automatic count. Finite samples do not prove all future
inputs or full physical collision freedom. Review the six at phone size before
the next Home layout/navigation, renderer/storage, Orange and feeling proposal.
The existing local server returned HTTP 200/expected entry; Codex panel opening
was queued. QA's separate server was closed. Loopback/browser checks needed
approved execution outside sandbox. Production Home/onboarding, shared Page/tool
geometry, personal records, Circle day and sync remain untouched. No stage,
commit or deployment; pre-existing recovery/artwork changes remain preserved.

## Sori rounded bundle relief — 2026-11-16

Developer requested multiple rounded ridges and valleys within each broad bundle,
with height changes both across its width and along its curved length. Approved
a Sori-only geometry pass, preserved broad fold arrangement/small-opening limit,
closed strands, at most ten broad overlaps, comparison/depth views, checks and
records. The preceding Sori v3 remains the preserved before image.

**Implementation.** New scripts/lib/imprint-sori-relief.mjs modulates the rounded
section's thickness in its local bundle frame. A periodic field varies crosswise
and along the course, tapering to zero at the side rails. Its bounded profile
keeps at least 20% of the original section thickness. The actual strand paths and
invisible lighting guide receive the displacement; the existing material/light
settings and fibre count/thickness/reflectance remain unchanged. Sampled crossings
are repaired geometrically, and the guide follows the final fibre depths.
The original course recipe/control stations remain identical to v3.
This remains authored synthetic artwork, not a real personal recipe migration.

The relief changes local projected edges as the bundles swell. One main enclosed
opening remains (1,488 source pixels), plus four sub-threshold interstices. Its
relative width/height are .05286/.04630, below the reference rim's .16355/.10324.
Seven marked broad overlap regions remain the internal visual review count;
new ridges within one bundle are not counted as separate broad overlaps.
Developer visually accepted this v4 result on 2026-11-16. The finite inspection
limits below remain technical qualifications, not a remaining aesthetic gate.

**Review.** http://127.0.0.1:3024/?study=sori-depth shows v3, v4 and the reference,
with phone/detail images, 15-degree angled material view, guide depth, numbered
regions and three complete traced strands. Missing/rejected inspection data
suppresses candidate images and shows a readable message. The earlier ?study=sori
and default six-form gallery remain available. Canonical evidence:
[inspection](design/personal-imprint-sori-v4-inspection.json),
[internal visual review](design/personal-imprint-sori-v4-visual-review.json),
[phone](design/personal-imprint-sori-v4-390.png),
[depth](design/personal-imprint-sori-v4-depth.png).

**Verification.** Installed Node v24.22.1 ran:

- node scripts/render-imprint-sori-relief.mjs
- node scripts/inspect-imprint-sori-relief.mjs
- node --test tests/personal-imprint-sori-relief.test.mjs tests/personal-imprint-sori.test.mjs tests/personal-imprint-loops.test.mjs tests/personal-imprint-recipe.test.mjs
- node scripts/review-imprint-sori-relief.mjs

All 39 focused checks pass. After adding the positive-section regression assertion,
the two relief tests reran. Actual geometry has 128 closed strands, zero ends,
one main projected component and zero insufficient-depth proper projected
crossings under the existing finite rules. Maximum sampled turn is 15.41 degrees;
wrap position mismatch <8.3e-13, first derivative <3.8e-9, second derivative
<9.2e-5. Independently evaluated route samples match within 8.3e-13.
Measured crosswise relief ranges at five course stations are 41.36–120.94 fitted
source units; longitudinal ranges at three section positions are 20.25–64.38.
These measure geometry, not aesthetic quality. All 128 fibres contribute;
source/geometry/11 asset hashes, opaque/unclipped output, exact phone derivation
and preserved void pixels beyond a 2px antialias allowance pass.

Browser checks pass 360/390/416/1280px: five loaded/hash-checked images, depth
disclosure, local review links, reload, Geist, 44px targets, no overflow/errors,
external requests or storage/cookie writes. Missing/rejected states also pass.
Browser launch required approved access outside the redirected sandbox path.

The shared loop inspector now accepts an optional analytical sampler so it checks
the actual relieved curves. Its default behavior is unchanged; the six-form
source stamp was refreshed and all six independently reinspected with identical
geometry/image hashes and ready status. Original Sori v3 also reinspection-passes.

**Attempts/limits.** A blended screen-space field created steep transitions and
banded shading. Depth-only displacement looked too flat. Unbounded local offsets
exposed thin strands at the edges; the final bounded thickness profile avoids
section inversion. A whole-course crossing repair draft left unresolved crossings
and was discarded. The retained shared crossing repair passes the finite checks.
Some ridge lips still look thin/wire-like, particularly from the angled camera.
The depth guide makes the relief clearer than the phone render. These were the
implementation review's visual limits; the developer subsequently accepted v4.
Complete physical collision proof is not claimed.
No broad optimization, new dependency, production Home, real records, Orange,
sync activation, stage, commit or deployment. Full suite/build/lint remain paused.
Next: the approved shared-generator slice above extends the accepted construction.

## Sori-only fold revision — 2026-11-16

Developer approved smaller enclosed openings matched to the confirmed upper-left
reference opening, more broad bundle folds and tighter placement, a changed outline
if needed, and at most ten visible broad-bundle overlaps. Fine thread spacing was
not the target. This trial changes Sori only; the six original recipes/images and
the general fingerprint generator remain preserved.

An authored Sori course reuses the closed-loop geometry and material engines.
It keeps 128 fibres, their thickness/reflectance settings and monochrome light.
New artifacts use personal-imprint-sori-v3; the numeric recipe remains an isolated
authored study, not a migration of retained personal recipes. The comparison is
at http://127.0.0.1:3024/?study=sori with current/revised/reference images, phone
and detail links, a silhouette, three complete traced loops and numbered overlap
regions. Seven visible fold/overlap regions are marked in internal visual review.
This count requires developer review; it is not an automated proof of visibility.

Independent inspection regenerates the exact geometry and verifies source/material
asset hashes. Three main enclosed gaps have source areas 3,200/1,664/1,664 pixels.
Their width ratios are .09375/.04911/.08036 and height ratios .05696/.05063/.02848.
The reference's preserved authored rim measures .16355 width and .10324 height
relative to its sculpture envelope. Every measured gap is below both bounds.
The rim is an approximation of the pictured opening. Two sub-threshold interstices
are reported separately, using the existing mask rule.

All 128 loops have zero ends/closure failures, one main projected component,
finite in-frame points, smooth sampled turns and no insufficient-depth proper
projected crossings under the existing finite checks. Maximum turn is 26.44 degrees;
geometry reproduction, unclipped/opaque pixels and source/material hashes pass.
Full physical collision proof and final aesthetic acceptance remain unclaimed.

Commands: node scripts/render-imprint-sori.mjs;
node scripts/inspect-imprint-sori.mjs; node scripts/review-imprint-sori.mjs.
The browser review passes 360/390/416/1280px: three image hashes, Geist, 44px links,
no overflow/errors/external requests or storage/cookie writes.
The existing loop/recipe tests pass all 36 checks. The new Sori regression test
also passes original recipe immutability, 128 closed strands and actual geometry
gates at 3,072 steps. Full suite/build/lint stay paused.
Initial drafts had five gaps; tighter placement/depth revision reduced them to
three. A browser-check URL error was fixed in the check, then all widths reran.
Browser execution required approved access outside the sandbox browser path.

Evidence: [inspection](design/personal-imprint-sori-v3-inspection.json),
[phone](design/personal-imprint-sori-v3-390.png),
[numbered review](design/personal-imprint-sori-v3-overlaps.png).
No product Home, personal records, sync, Orange or deployment changes. No commit.
Next: developer reviews Sori against the original before any extension to other forms.

## Closed-loop forms prototype — 2026-11-16

**Approved direction.** Developer rejected subtle changes of the same master as
the long-term variation model. Keep the original reference's thread-made visual
language, but vary folds, curves and overall form enough to differ at a glance.
Each person gets one complex, organic, asymmetric sculpture. Every strand must
be a complete smooth circuit, including its hidden return: no loose ends, sharp
joins or buried terminations. Allow zero to three main openings, excluding fine
spaces between threads. Natural proportions share one review frame. Similar
answers need not produce related forms; the deterministic fingerprint approach
is accepted. This supersedes fixed folds and the concealed-end allowance for the
new prototype; it does not retroactively turn the historical master into loops.

Developer approved a new versioned construction, three related course families,
six fictional examples, full/phone/detail/silhouette/whole-strand views, focused
recipe and geometry checks, isolated browser verification and these records.
The original onboarding input/normalization/retention contract below continues.
No Orange, real records, persistence, accounts, production Home or deployment.

**Result for review.** The preview now defaults to six new sculptures: Mira,
Arun, Lin, Noor, Tala and Sori. Each has 128 complete strands, totalling 768
end-free loops. Sweep, return and curl courses have different fold arrangements;
the seeded controls change broad bends, lobe balance, width, depth and roll.
Mira/Lin are related curl forms; Arun/Noor are sweep forms; Tala/Sori are return
forms. Their projected main-opening counts are 3/3/3/1/3/3 respectively. The
allowed range is 0–3; this sample set does not demonstrate every allowed count.

[Canonical report](design/personal-imprint-loops-v2-inspection.json),
[internal visual review with limitations](design/personal-imprint-loops-v2-visual-review.json),
[Mira phone](design/personal-imprint-loops-v2-mira-390.png),
[Arun phone](design/personal-imprint-loops-v2-arun-390.png),
[Lin phone](design/personal-imprint-loops-v2-lin-390.png),
[Noor phone](design/personal-imprint-loops-v2-noor-390.png),
[Tala phone](design/personal-imprint-loops-v2-tala-390.png) and
[Sori phone](design/personal-imprint-loops-v2-sori-390.png) are current evidence.
Every example also has full/crown/shoulder/lower/shadow outputs, a silhouette,
three actual selected loops and a small numeric recipe. The gallery switches
between threads and silhouettes. Profile checks recompute/retain recipes in
memory; strand controls show one entire front/angled route, including its back.
Earlier personal/material/geometry studies remain at `?study=personal`,
`?study=material` and `?study=geometry`.

**Construction.** `imprint-loop-recipe.js` reuses the reviewed input normalizer.
SHA-256 seeds a family and bounded numeric controls; recipe v2 stores method,
family, periodic controls, fibre count, thickness, phase and grain, without input
words, birthday or the input digest. Retaining a supported recipe ignores later
corrections, including incomplete replacement input. No real storage contract
or guarantee of unique forms is implied. The old v1 recipe remains supported
by its own module and is not silently migrated.

`scripts/lib/imprint-loop-geometry.mjs` smooths each complete course periodically,
transports a rotation-minimizing frame with a periodic closure correction, and
places fibres around a rounded cross-section. Width changes respond smoothly
to curvature and nearby returns. The guide wraps in both directions; no cap,
nearest-end splice or final connector closes a strand. Periodic depth waves
separate measured self-crossings; constant per-strand depth offsets avoid
measured intersections between different loops without adding local kinks.
Only actual swept fibre tubes render and occlude one another. The invisible
guide estimates lighting; it neither clips fibres nor hides parts of a route.
The common frame fits proportions uniformly into 1024×1536, with a 390px export.
The browser shows pre-rendered images and small inspection traces, not a
production phone renderer.

Earlier drafts exposed sheet-like returns, projected-frame pinches and cascades
of narrow depth dips. These were replaced with complete courses, periodic
parallel transport and broad/self plus constant/inter-strand depth corrections.
Tala needs 3,072 course samples for the turn bound; the other five use 1,536.
No broad optimization or new dependency was introduced.

**Verification.** Installed Node v24.22.1 ran:

- `node --test tests/personal-imprint-loops.test.mjs tests/personal-imprint-recipe.test.mjs`:
  36 checks pass. New checks cover deterministic recipes, ignored feeling,
  retained correction, loop position/tangent/curvature closure, closed guide
  edges, route evaluation, JSON round-trip and invalid input/version handling.
- `node scripts/render-imprint-loops.mjs` and
  `node scripts/inspect-imprint-loops.mjs`: all six pass. The independent reader
  regenerates geometry, verifies source/recipe/geometry/assets, and compares
  selected-loop data with the exact strands. All 768 routes have zero ends and
  no closure failures, nonfinite points or out-of-frame points. Maximum wrap
  mismatch is below 5.1e-13 position, 3.9e-9 first derivative and 7.8e-5 second
  derivative in the sampled checks. Maximum discrete turn is below 30 degrees.
- All six have one main projected component and at most three main openings.
  Openings use a 256×384 guide mask; areas below 1,008 source pixels are reported
  separately as small interstices. Mirrored silhouette overlap is .264–.685;
  pairwise overlap is .354–.636. These are diagnostics, not aesthetic scores.
- At proper projected strand intersections separated by at least .06 of a
  course, zero insufficient-depth crossings remain. Endpoint/collinear cases
  and nearby course segments are excluded. This is finite inspection of these
  examples, not proof of full solid-body non-intersection or welded connectivity.
- All 128 fibres per form contribute to the render. All nine asset hashes per
  form pass, phone derivation is exact, pixels remain opaque/unclipped, and no
  material pixels leave the guide projection's 2px antialias allowance.
- `node scripts/review-imprint-loops.mjs`: 360/390/416/1280px pass, including
  96 recipe actions, 36 front/angled trace comparisons (all three selected
  loops for all six profiles at 390px), image hashes, reload, Geist and 44px
  targets. No overflow, page errors, external requests or storage/cookie writes.
  Missing manifest, rejected form and missing strand-data states pass. One
  initial browser check sampled silhouettes before image decoding; waiting for
  decoding fixes the check without changing the artwork or UI.
- Rerendering the legacy material and all three v1 personal forms preserves
  their original full-image hashes. All six material PNG hashes are identical.
  Their independent inspections remain ready; the legacy gallery's query is
  explicitly `?study=personal` after the default changed. Browser execution
  needs approved access to the installed browser outside the sandbox's
  redirected path; no browser download was needed.

**Acceptance and limits.** `readyForReview` means reproducible artifacts and a
matching internal review, not developer aesthetic approval. The forms are more
orderly, thinner and darker than the reference; tight folds can still appear
pinched, and Noor has less apparent fullness. Broad guide-derived shadows are
an approximation. Original-reference volume, consistency and the strength of
variation remain the developer's visual review. Future inputs require the same
inspections before display; these six do not certify every possible recipe.

Full suite/build/lint remain paused. Production Home/onboarding, records,
local-first persistence, shared App Box/Page geometry and sync remain untouched.
No stage, commit or deployment. Next: compare these six forms and their complete
strand views against the original reference before another artwork or Orange
integration proposal.

## Bounded personal-form prototype — 2026-11-16

Historical slice; the closed-loop direction above supersedes its fixed-fold scope.

Developer accepted the current artwork as a working baseline despite its known
visual weaknesses, then approved all four recommended prototype choices: a visual
fingerprint within fixed folds/openings; the complete proposed onboarding input
list; moderate bounded variation; and focused recipe tests alongside geometry and
browser inspection. Full test suite/build/lint remain paused. The earlier
one-fold-per-answer idea is deferred for this slice; no semantic answer-to-fold
mapping, life score or uniqueness guarantee is implemented.

**Historical result.** The isolated preview at `?study=personal` shows the master plus three
fictional profiles: Mira (uncertain starting point), Arun (several experiences)
and Lin (different daily rhythm). They share 1,281 strand identities, one shoulder
opening and the same construction. Mira is broader, Arun taller and Lin shorter
with a different lean. This is controlled variation of the working master, not
three independently authored topologies. Developer acceptance of variation strength
remains pending. The base's cut-looking entries and weaker layered volume remain.

[Canonical sample report](design/personal-imprint-personal-v1-inspection.json),
[visual review](design/personal-imprint-personal-v1-visual-review.json),
[Mira phone](design/personal-imprint-personal-v1-mira-390.png),
[Arun phone](design/personal-imprint-personal-v1-arun-390.png) and
[Lin phone](design/personal-imprint-personal-v1-lin-390.png) preserve that slice's evidence.
Each sample also has a numeric recipe, full image, crown/shoulder/lower views,
shadow diagnostic and construction report. Runtime screenshots include the
four-form comparison at outputs/imprint/personal-v1-comparison.png.

**Input contract for this prototype.** Explicitly supplied fictional inputs include
name/full birthday; current situations/life-right-now; each experience's category,
description and status; wanted changes/details/primary focus; usual wake/bed times;
and the confirmed habit's start/keep choice, wording and cue. Feeling, account
identifiers, credentials, activity and unreviewed fields are excluded. This is a
review adapter, not an implementation of replacement onboarding records/validation.

Unicode NFC, trimmed/collapsed spacing and lowercase normalize text; selection
sets are deduplicated/sorted and experience entries are sorted without inferring
chronology. Explicit uncertain/none answers remain explicit. They do not remove
material or invent an experience. Text length and answer count are not mapped to
size or worth. Missing inputs and invalid calendar dates/times show an input error.
Product eligibility, contradictory-answer routes and real-data schemas remain
separate onboarding work.

SHA-256 of normalized inputs supplies bounded numeric controls; neither that input
digest nor source words/birthday are retained in the recipe. Recipe v1 records
normalization version, pinned base geometry hash and eight numeric parameters.
Newly created recipes are frozen and can round-trip through JSON. Existing supported
recipes are retained even when corrected replacement inputs differ or are
incomplete. This demonstrates retention without adding account/local storage.
Unknown versions/bases or parameters outside limits are rejected. Recipes remain
derived personal data if real integration is later approved; numeric controls are
not an anonymity or deletion contract.

**Construction.** New recipe/sample modules live under app/os/home. The shared
deformation helper maps material boundaries, mesh vertices, routes and actual
covering-strand points together. It keeps offsets above/below the supporting
surface unchanged. Boundary edges use the base tessellation's scanline events;
route points use their supporting triangle's map. This avoids shifting strands
independently across an opening. Light is recalculated on the transformed geometry.
No new per-person 59MB base copy is stored; the pinned base and small recipe
reproduce a sample's geometry exactly.

Approved moderate controls are implemented as width bias ±6% plus lobe balance
±4% (combined local horizontal scale 90–110%), bend ±24 source pixels, lean ±.025,
height ±6%, vertical spacing offset ±18 pixels and surface depth ±8%. Phase covers
one turn. The common map has a positive analytic Jacobian bound; every rendered
sample also passes independent triangle/route/endpoint/coverage checks and keeps
at least 24 source pixels of outer margin. A failed variation is flagged and does
not acquire a rendered image. Previously rejected output is not silently shown.

The material shader and geometry inspection were extracted into shared helpers.
All six canonical Step 5 PNG hashes remain byte-identical after extraction:
base geometry b9b45f97d25e…, lit full image db99a242cf56…. Renderer entry/module
hashes are both checked. Earlier recipe formats/renderers remain available.
The canonical inspector continues to inspect its published endpoint companion;
variants inspect their embedded endpoint records through the same shared checks.

**Verification.** Installed Node v24.22.1 ran:

- `node --test tests/personal-imprint-recipe.test.mjs`: 32 checks pass, covering
  repeatability, every included input, ignored fields, order/format normalization,
  uncertain answers, retained corrections, invalid inputs and numeric recipe bounds.
- `node scripts/render-imprint-variations.mjs` and
  `node scripts/inspect-imprint-variations.mjs`: all three pass. Independent
  material support is Mira 48,260/48,260, Arun 47,707/47,707 and Lin 43,787/43,787.
  Every sample has zero outside vertices, invalid triangles, nonfinite coordinates,
  unsupported route points or same-depth foreground crossings. All 2,562 final
  ends per sample remain beneath named faces and actual covering strands.
- Pixel inspection verifies source/recipe/geometry/output hashes, dimensions,
  preserved voids, opaque output and exact phone derivation. No clipped channels
  or outside-material pixels beyond the 2px antialias allowance; channels span 16–223.
- `node scripts/review-imprint-personal.mjs`: 360/390/416/1280px pass, including
  12 live recipe actions per width (48 total), reload, hash-verified four-image
  loading, Geist, 44px targets, no overflow/page errors/external requests and no
  local/session/cookie writes. Missing-manifest and rejected-variation states pass.
- Canonical geometry/material inspections and the linked material browser review
  still pass. The legacy review command was adjusted for `?study=material` after
  changing the default gallery. Browser launch needed approved execution outside
  the sandbox's redirected installed-browser path. No browser install was needed.

Inspections bind all three recipes/geometry/render hashes and current source files.
Regeneration resets readiness until the inspector and matching internal visual
review are current. Only the three published samples are certified here; arbitrary
future generated inputs still need geometry/render verification. The browser
displays exported geometry renders and runs recipe checks; it does not generate
the full mesh on a phone. No measured optimization was needed for this slice.

Production Home, real answers/recipes/persistence, accounts/sync, Orange, activity,
shared App Box geometry and deployment remain untouched. No stage or commit.
That review led to the approved closed-loop forms above. Do not treat either
prototype as production integration.

## Step 5 material pass — 2026-11-16

Developer approved rounded fibres, broad upper-left light, weak fill, depth/contact
shadows, phone-size tuning, an exact-output comparison preview and continuity
records. The material implementation is rendered and inspected. **The final visual
gate remains open:** several strand entries still look cut from the front, and
the result has less layered volume and continuous flow than the reference.
Geometric endpoint concealment does not establish that visual result. The earlier
Step 4 unlit visual conclusion below is qualified by this newer lit inspection.

[Lit full image](design/personal-imprint-material-v1-full.png),
[390px image](design/personal-imprint-material-v1-390.png),
[crown](design/personal-imprint-material-v1-crown.png),
[shoulder](design/personal-imprint-material-v1-shoulder.png),
[lower return](design/personal-imprint-material-v1-lower.png),
[inspection](design/personal-imprint-material-v1-inspection.json) and
[visual review with limitations](design/personal-imprint-material-v1-visual-review.json)
are the material review artifacts. The isolated preview retains this lit result
beside the reference at `?study=material`. Step 4 remains at `?study=geometry`;
older studies stay linked. The default is now the personal-form comparison above.

**Implementation.** `scripts/render-imprint-material.mjs` reads the hash-verified
Step 4 geometry without altering it. Twelve-sided circular rings sweep along each
unchanged 3D route, with shared rings and interpolated normals avoiding separate
bright segment caps. A per-fragment depth buffer resolves visibility against the
material surface and other fibres. The actual final ends stay inside the volume.
The 2.4px fibre diameter is roughly 0.91px in the 390px export. The material uses
Bone fibres, an Ink background and a restrained Charcoal supporting surface.
It adds no Orange or personal meaning.

Normals come from the mesh depth; the explicit six-times depth-unit conversion
affects lighting, not projected paths or the stored mesh. A broad upper-left source,
weak ambient fill and restrained highlights shade the round fibres. Heightfield
horizon rays supply broad shadows; short rays against other generated fibres
supply contact shadows. These are a 2.5D orthographic lighting approximation, not
full global illumination or recovered physical topology. No reference colour or
shadow pixels, painted crease bands or opacity concealment contribute to this pass.
Lighting is calculated in linear colour space and exported in sRGB at 3x sampling.

**Verification.** Installed Node v24.22.1 ran:

- `node scripts/render-imprint-material.mjs`
- `node scripts/inspect-imprint-network.mjs`
- `node scripts/inspect-imprint-material.mjs`
- `node scripts/review-imprint-network.mjs --material`

Geometry remains `b9b45f97d25e…`; lit render is `db99a242cf56…`. The independent
Step 4 inspector still passes its coverage/support/crossing/endpoint gates:
45,095/45,095 supported samples, no unsupported route points or foreground
crossings, all 2,562 final ends buried beneath named faces and actual strands.
The material inspector verifies settings/renderer/output hashes, dimensions,
opaque pixels, phone derivation and preserved voids. All 1,281 strands are
represented; no nonfinite shades, clipped highlights or outside-material pixels
beyond the 2px antialias allowance. Full image channels range 16–223.

Full/phone and enlarged details were inspected. Browser comparisons at
360/390/416/1280px load the hash-verified render and reference with Geist, no
horizontal overflow and no page errors. A missing-report check shows the intended
refresh message. Screenshots/measurements are `outputs/imprint/material-v1-preview-*`.
Browser launch again required the installed browser outside the sandbox's redirected
path. Tests/build/lint remain paused at the developer's request.

**Corrections and limits.** Early constant-width shading produced blunt joint
highlights; swept round geometry replaced it. Harsh early shadows were softened.
The first exported reduction filter introduced six out-of-domain halo pixels and
one 255 channel value despite unclipped shader values. A positive linear reduction
filter removed both; the independent inspection then passed. No geometry was
revised, so the known visible-entry issue remains explicit. Material checks pass
and the artifact is ready for developer review; this is not final visual acceptance
or a claim that Steps 1–5 have achieved the reference. A structural refinement would
need to address visible entry placement and layered surface depth, not just shade.

Production Home, personal generation/records, shared App Box geometry and sync are
unchanged. No staging, commit, deployment or activation. Next: developer reviews
the linked lit master, phone image and entry details before selecting further work.

## Completed Step 4 — 2026-11-16

The approved isolated monochrome construction is complete. Final developer artwork
acceptance remains after Step 5. [Current render](design/personal-imprint-flow-network-v4-full.png),
[390px render](design/personal-imprint-flow-network-v4-390.png),
[coverage](design/personal-imprint-flow-network-v4-coverage.png) and
[canonical inspection](design/personal-imprint-flow-network-v4-inspection.json)
refer to the same geometry/image pair. The preview retains this at `?study=geometry`;
earlier masters remain at `?study=master`, prior procedural samples at `?study=previous`.

**Construction.** The complete silhouette/opening is tessellated from its boundary
events, independently of strand count. Three authored course families provide the
shared flow atlas; measured reference ridge direction refines the local curves.
This is a static reference-assisted master, not a personal generator or recovered
hidden physical topology. It uses whole surface trajectories, not distance contours,
fragment splicing or transverse connector fans. Neighbouring trajectories retain
individual IDs; local convergence becomes a supported concealed termination.
Each end records an actual neighbouring foreground strand and covering face.
Twenty-six same-depth crossings became short geometric underpasses. No colour,
opacity mask or raster reference supplies artwork pixels; only generated strands
are visible. Lighting/material refinement remains Step 5.

Implementation choice: the earlier independent pairs-of-rails strips could not
cover the full material without stretched joins. The completed model uses shared
surface coordinates across the whole boundary-conforming atlas, with the three
authored courses controlling direction. Reference-assisted local directions add
the visible fold detail. Surface transitions therefore share one geometry/function
instead of being patched together after strand generation. There is no constraint
that a construction zone must be a separate ribbon or a personal-data region.

**Files/commands.** `scripts/build-imprint-network.mjs` uses shared helpers under
`scripts/lib/imprint-network-*.mjs`, generating v4 geometry, image/detail/route/
coverage PNGs and endpoint records. `scripts/inspect-imprint-network.mjs` loads
that exact output, checks hashes and independently inspects actual mesh/route data.
It requires a hash-matching internal visual review; rebuilding invalidates that
acceptance until the new result is inspected. The historical v3 gap-audit source
is preserved as `scripts/inspect-imprint-network-baseline.mjs`.
Its outputs are isolated under outputs/imprint/v3-network-baseline-* so rerunning
historical diagnostics cannot overwrite the accepted current report. That baseline
still fails at 73.150% coverage; the current independent inspector exits 0.

Installed Node v24.22.1 ran both commands and the isolated
`scripts/review-imprint-network.mjs` browser-render review. Bare Node's shim was
unavailable in the sandbox, so the installed executable was used directly.
Final geometry hash begins `b9b45f97d25e`; render begins `840155b827f5`.

**Observed result.** Full-resolution material coverage is 721,551/721,551 (100%).
Independent coverage is 45,095/45,095 with zero interior gaps. All 1,281 published
strand IDs are unique; there are zero unsupported route points, outside mesh
vertices, invalid triangles, nonfinite coordinates or same-depth foreground
crossings. All 2,562 endpoints pass named-face and actual covering-strand checks.
Minimum supporting-face clearance is 16 reference-depth units. End continuations
extend at most 8.202 reference pixels locally. Visible-strand population within
the separately reported 12px radius is 99.99986%; this is not a material-coverage
substitute. Short rejected seed candidates are sampling attempts, not missing
published strands or personal records.

Full composition, 390px image, selected complete routes and enlarged crown,
shoulder/lower views were inspected. Detached strip islands and long bridge bands
are absent. Internal geometry review passes; developer final aesthetic acceptance
is still pending Step 5. Browser review at 360/390/416/1280px loads both exact images,
has no horizontal overflow/page errors, and uses the review Geist face. Runtime
screenshots and measurements are outputs/imprint/v4-preview-*.

**Corrections/limits.** Sparse integration initially failed population despite full
surface coverage; additional nonbranching trajectories filled those regions.
Long hidden-turn allowance caused apparent snips; subpixel turns corrected it.
Visible sideways endpoint shifts made ladder joins; shifts now occur underneath
the covering material. The independent crossing check found 26 intersections and
their geometric underpasses were rechecked. Binary image hashing was corrected
before final hash inspection. Sandbox browser launch failed on redirected browser
location; approved outside-sandbox review passed. Tests/build/lint remain paused.
Production Home, records, shared Page geometry, sync and deployment are unchanged.

At this checkpoint, Step 5 material/lighting was next; see the current pass above.
No Orange, answer-driven variation,
real recipe persistence, personal-record integration or public rollout is implied.

## Historical construction checkpoints

## Whole-composition repair contract and gap audit — 2026-11-16

Developer approved a complete network rebuild with ≥99% supporting coverage,
no unexplained interior gaps, supported routes, concealed named-fold endpoints,
ordered connections and no stretched bridge bands. Approval includes repeated
geometry/render inspection until those gates pass; no further approval is needed
within that scope. **This repair is still in progress, not complete.**

design/personal-imprint-flow-network-v4.json records three longer families:
N1 crown/central diagonal, N2 shoulder/left fan, N3 lower right fan/bottom return.
Authored cubic guide routes cross the organising zones continuously. J1–J3
require genuinely shared boundary stations/first derivatives rather than stretched
connectors. Paired rails, new surfaces and regenerated strands remain outstanding.
The blueprint overlays the reference and is explicitly a guide, not a new render.

`node scripts/inspect-imprint-network.mjs` audits inherited v3 geometry, generating
a missing-region map, reference blueprint and report. At 4px cell centers there
are 45,095 intended material cells, 32,987 supported (73.150%), 10,941 missing
interior cells and 1,167 missing edge cells within 4px of the silhouette/opening.
The slight difference from v3's raster-based 73.121% comes from direct triangle
coverage at cell centers rather than pixel-center depth lookup. It is not a
geometry improvement. The largest missing component touches much of the rim;
other large regions include crown, left fan and lower recesses. Orange in the
map means missing interior material, white means edge margin, green supported.

The source inspection intentionally exits 1 because coverage, interior-gap and
visual-transition gates fail. Prior support/endpoint checks pass, which does not
override those failures. No supporting surface or final strand geometry was
regenerated in this checkpoint. Tests/build/lint remain paused. Next implement
shared rails and full material surfaces from the new guides, then rerun all gates
and full/detail render inspection. Do not move to Step 5 on the strength of this
audit. App/runtime, personal data and sync remain untouched.

## Step 4: connections and concealed ends — 2026-11-16

Developer approved explicit joins/concealed terminations, missing-region coverage,
spacing work and records. New sibling
design/personal-imprint-strand-connections-v3.json inherits preserved v2 patches.
`node scripts/render-imprint-patches.mjs docs/design/personal-imprint-strand-connections-v3`
builds ordered B1→B4 pairs, reversing B1 to meet the start of B4. Each pair becomes
one identity; consumed segments cannot branch into another connection. Other
ports receive explicit named fold targets in patch u/v coordinates, buried below
that fold's actual surface. Closed loops are no longer mandatory. Curved strand
bridges preserve endpoint tangents and route through authored material.

Adjacent ordered strand routes generate actual connector surface triangles for
depth/coverage, rather than fake opacity concealment. Source inspection checks
whole-route material support, hidden final endpoints against rendered depth,
connector centroid containment and the existing patch winding/pitch checks.
The first run buried all endpoints but two surviving B4 continuations crossed the
right waist opening. Their target was changed to the crown fold. Discarded
pre-join diagnostic candidates are historical construction records, not geometry
published as surviving strands. Final run retains 160 identities after 39 ordered
joins: zero unsupported routes, visible final endpoints, outside connector
centroids, outside patch samples or folded base-patch cells. Pair mappings enforce
unique source/destination indices and monotonic order. Source end metadata reflects
the surviving outer ends after joining. The labelled connection map distinguishes
joined starts from remaining burial rules. Sampled supporting coverage is
32,974/45,095 (73.121%); this is explicitly incomplete. The inspection JSON owns
per-patch measurements and an explicit `readyForStep5: false` acceptance field.

**Coverage/appearance acceptance remains open.** The resulting image and enlarged
views must be inspected for visible connector fans, spacing and unmapped material.
Hidden endpoint success alone does not establish reference fidelity. Prior v1/v2
and surface studies remain preserved. Next continue this approved repair until
coverage and transitions meet the proposal; Step 5 is not authorized as a shortcut
around unresolved structure. Tests/build/lint remain paused; no app/data/sync change.

## Step 4 repair: authored flow patches — 2026-11-16

Developer approved replacing scalar contours with matched patches, stable strand
connections, boundary/return repair and spacing diagnostics. New sibling source
design/personal-imprint-flow-patches-v2.json and scripts/render-imprint-patches.mjs
author two cubic rails per patch with matched cross-sections. Strand v is fixed;
each front route maps identically to its own back through rounded depth turns.
No distance-field contours, inter-bundle endpoint joins or branched connections.
Curved patch boundaries generate the actual surface triangles, replacing the grid
edge inside their footprint. Old maps, mesh study and v1 strands are preserved.

Node v24.22.1 runs source inspection and full/connection/crown/shoulder/lower
rendering. These use triangle depth for actual overlap and strand-only visible
pixels. Renderer deliberately does not crop unsupported routes to the silhouette.
A measured narrowest-width rule caps strand count to preserve at least 1.2px
cross-section pitch; this is a construction setting, not final approved density.
Report records each patch's actual count, min/max pitch, inverted cells, outside
samples, route support/closure and sampled material coverage. Cache reuses exact
XY containment results for front/back routes; it does not change geometry.

Initial B3/B6 matched rails folded locally. B3 was rerouted; B6 was revised again
after a failed intermediate attempt. The first orientation check incorrectly
treated uniformly negative winding as invalid; it now counts mixed winding,
preserving genuine fold failures. Earlier unsupported-route/closure checks pass
with no routes deleted. Final result: 199 strands, zero unsupported routes,
zero closure failures, zero outside patch samples and zero folded cells. Pitch
ranges 1.246–9.132px across patches. Sampled coverage is 32,067/45,095 (71.110%).
The current inspection JSON owns the per-patch measured results.

**Repair remains in progress.** Authored patches leave substantial mapped material
uncovered (roughly 28% in intermediate measurements), so their boundaries/ports
remain visibly separate ribbons. This is not final reference fidelity or readiness
for Step 5. No omitted area is silently declared a void. Next extend connected
patch coverage and concealed port placement while preserving ordered, supported
routes, then repeat all inspection and full/detail rendering. Final review remains
after steps 1–5. Tests/build/lint stay paused; no product/data/sync changes.

## Step 4: thread routing study — 2026-11-16

Developer approved the complete Step 4 proposal. **Acceptance remains incomplete**:
the new study supplies surface contours, complete returns and diagnostic renders,
but the boundary-conforming revision, consistent spacing and smooth patch routing
still need work before Step 5. Do not treat passing closure checks as final flow.

`node scripts/render-imprint-threads.mjs` reads the preserved Step 3 meshes and
Step 2 guides. Across-course scalar contours intersect actual front triangles;
bundle/level/component IDs preserve each route. Rounded depth turns connect front
courses to their own shell backs. No nearest-end or inter-bundle joins. Depth-only
triangles conceal rear strands; only strands supply artwork pixels. Per-strand
maximum coverage avoids bright resampling joints. First nearest-guide field
created switching ridges; weighted field smoothing reduced them. First rendering
silently omitted unsupported samples; this was corrected to reject whole invalid
routes and name them in the report. No partial unsupported route is published.

[Full render](design/personal-imprint-threads-v1-full.png),
[selected whole routes without occlusion](design/personal-imprint-threads-v1-routes.png),
and enlarged crown/shoulder/lower PNGs are generated beside the source spec,
geometry and inspection JSON. 381 routes generated, 367 retained, 14 rejected
for unsupported projected turn/edge samples. Retained routes have finite points
and closed endpoints. Hundreds of short components are omitted and enumerated
by bundle. A reference scanline at y=600, x=110–240 finds peak gaps 3–14px;
the study uses 4px scalar spacing, not uniform physical/projected pitch. Per-bundle
projected pitch percentiles are reported. These do not establish the intended
density or promise faithful reference flow.

Full and enlarged views show remaining pinching/branching, artificial patch-edge
end treatments and insufficient sculptural flow. The inherited 4px boundary margin
remains; no boundary-conforming revision was produced. This is an explicit gap in
the approved scope. Next continue Step 4 with authored patch coordinates and edge
geometry, then repeat routing/spacing/visibility inspection. Final material work
must not hide these structural defects. Tests/build/lint remain paused. Prior
maps/meshes, app runtime, personal records, sync and shared tool geometry unchanged.

## Step 3: surface volume and overlap — 2026-11-16

Developer approved surface expansion, volume, explicit overlaps/returns and three
views. [Depth source](design/personal-imprint-depth-v1.json) develops the original
territories plus U3 ownership into six closed shell meshes. A conservative 4px
grid defines actual geometry; one-cell territory support overlap removes internal
construction seams without painting them shut. Depth varies smoothly along the
course and across a rounded profile. U1/U2 retain material with recessed depth.
Geometric backs and walls enclose each surface. Each course has a closed 3D
continuation: front guide, rounded depth turn, reversed back guide, return turn.
These authored interpretations do not recover the reference's hidden topology;
individual strand turns and full across-surface thread routing remain Step 4.

`node scripts/render-imprint-depth.mjs` generates reusable surface geometry,
inspection JSON and labelled [front](design/personal-imprint-depth-v1-front.png),
[oblique](design/personal-imprint-depth-v1-oblique.png) and
[depth](design/personal-imprint-depth-v1-depth.png) views. A CPU triangle depth
buffer determines visibility. Neutral face shading is diagnostic, not final
lighting. F1 puts B4 over B2, F2 B4 over B1, F3 B5 over B4, F4 B6 over B4.
Depth spacing is deliberately separated and provisional, particularly in the
oblique view. This is not yet the reference's finely sculpted appearance.

**Inspection.** Installed Node v24.22.1 ran the renderer. Final shells contain
no degenerate triangles or non-manifold edges by indexed edge incidence. All
continuation coordinates are finite and remain in projected allowed material.
Sampled minimum shell separation at the four named overlaps is respectively
127.05, 180.54, 49.17 and 133.01 depth units. This inspects those authored overlaps,
not a continuous all-surface intersection proof. Front cell coverage is
44,341/45,095 (98.328%); 754 conservative boundary cells remain unfilled. Exact
silhouette identity and watertight joining between different bundles are not
claimed. Each shell is individually closed; inter-bundle thread identity remains
unassigned. Dense thread generation must address the discretization margin.

First render showed nearest-guide switching ridges and region seams; smooth
weighted depth and explicit neighbouring geometry support corrected these.
One diagonal-touch corner produced a non-manifold pinch; removing that cell from
the affected shell repaired it. Final geometry inspection and views rerendered.
Prior Steps 1–2 and masters preserved. Tests/build/lint remain paused; production
Home, data, sync and shared tool geometry unchanged. Next propose Step 4 with
surface-aware thread routing and individual return turns. Final visual review
remains after steps 1–5.

## Step 2: bundle routes and width — 2026-11-16

Developer approved Step 2. [Route source](design/personal-imprint-bundle-routes-v1.json)
uses each Step 1 visible guide, normalized by distance, with authored full-width
stations and smooth width interpolation. The renderer derives paired cubic rails
and 201 ordered cross-sections per bundle. A fixed across-bundle position can later
follow these sections. These narrow courses establish routing; they are not a
complete covering surface or the finished sculpture. Source structure is preserved.

`node scripts/render-imprint-bundle-routes.mjs` produces portable SVG/PNG
[overlay](design/personal-imprint-bundle-routes-v1-overlay.png),
[ribbons](design/personal-imprint-bundle-routes-v1-ribbons.png) and
[sections](design/personal-imprint-bundle-routes-v1-sections.png).
The generated geometry JSON exports actual rail paths/sections for Step 3.
No clip/mask hides invalid routes. Straight end sections close the diagram fills;
they are construction ports, not final thread ends. Four junctions explicitly
disable automatic joining and retain hidden continuation/depth uncertainty.

U3 reserve samples now have proposed neighbouring ownership: B1=708, B2=9,
B3=115, B5=396, B6=42; none unowned or multiply owned. Rectangles select only
previously unassigned material, not fill shapes. Ownership does not extend rails
or permit threads outside their geometry. Remaining space between courses and
territory boundaries still needs surface development. U1/U2 remain provisional.
Sampling the same 4px grid against finer (100-per-cubic) boundary polylines finds
1,270 reserve samples versus Step 1's 1,269 at 32 samples; this is sampling precision,
not a changed source envelope. No exact pixel/continuous coverage claim is made.

Installed Node v24.22.1 ran the renderer and source inspection. All six bundles
have zero sampled material/territory violations, reversed cells or crossed
nonadjacent cross-sections. Inspection uses 17 points per section and 8 points per
small rail cubic; boundaries retain 100-per-cubic sampling. Initial dense rail
inspection also passed but was slow; sampling redundant small rail cubics was
reduced, retaining section/interior checks. Final rerender and inspection pass.
Full overlay, ribbon and diagnostic views were visually inspected. No tests,
build or lint ran, as instructed. No runtime or personal integration changed.

Next propose Step 3: depth, cross-sectional volume and explicit overlap/hidden
continuations. Surface coverage remains to be developed before dense threads;
do not treat the current narrow strips as a finished filled sculpture. Final
developer review remains after steps 1–5.

## Step 1: explicit structure map — 2026-11-16

Developer approved the structure-map proposal only. The five-step direction is
structure, bundle routes/width, depth, threads, then lighting; developer visual
review is intended after the full sequence. Steps 2–5 are not implemented here.

[Source map](design/personal-imprint-structure-v1.json) defines the authored
1024×1536 envelope, six projected bundle territories, one enclosed opening,
two exterior-connected background cores, six visible flow guides and four
provisional fold junctions. These are construction groups, not the six future
personal-data/color regions. Diagram colors carry no product meaning.

[Reference overlay](design/personal-imprint-structure-v1-overlay.png),
[structure alone](design/personal-imprint-structure-v1.png), and
[filled/empty silhouette](design/personal-imprint-structure-v1-silhouette.png)
are generated by `node scripts/render-imprint-structure.mjs`. Each has a portable
SVG sibling. Only the reference overlay embeds the reference bitmap; standalone
structure and silhouette contain no source artwork. SVGs embed the local Geist
font, with sans-serif fallback for rasterizers.

**Construction contract.** Allowed bundle area is its territory intersected with
the envelope, minus enclosed openings. Raw territories may overlap/extend outside
the envelope. Diagram order is not depth order. Exterior void markers name clear
background cores; the silhouette defines their full edges. Do not connect nearby
thread ends across these regions. Flow arrows indicate a reading direction, not
animation or evidence of a thread's hidden continuation.

U1 (crown recess) and U2 (lower recess) retain candidate material: visible faint
strands prevent treating darkness as proof of a hole. U3 is the unassigned rim/
transition reserve outside the six territories. Four-pixel sampling measures it
at 1,269 of 45,094 material samples, approximately 2.8%. It stays explicit and
must be assigned to authored routes before thread generation; it is not permission
to fill gaps automatically. Visible boundaries are authored approximations, not
exact physical reconstruction. Fold depth/hidden continuations remain unassigned.

**Inspection.** Installed Node v24.22.1 ran the renderer successfully. Source-level
inspection checks unique IDs, reference size, finite/in-bounds cubic coordinates,
closed areas, sampled proper boundary crossings, enclosed/exterior void placement,
fold references and guide confinement. All 710 guide samples stay in both the
allowed material and their territory. Full views and enlarged shoulder/lower-fold
diagrams were inspected. The first shoulder-hole outline was too narrow; visual
and source scanline inspection corrected its rim before final rerender. The
inspection report is design/personal-imprint-structure-v1-inspection.json.
These are sampled construction checks, not an analytic proof or app acceptance.
Tests, build and lint remain paused; no normal Home, renderer, personal-record,
shared-tool geometry, sync or deployment change occurred.

Next: propose Step 2 using the named territories and guides to author bundle
routes/width, resolve U3 and record seam/continuation choices. Preserve U1/U2
uncertainty until depth work. Final artwork acceptance remains after steps 1–5.

## Closed-route exploration — 2026-11-16

Developer approved a monochrome refinement pass and continuity records. The new
v2 SVG/PNG preserves v1 and is available in the comparison preview. It pairs full
reference-guided trajectories into 30 closed cubic circuits, with explicit
connecting geometry. These connections are design approximations, not recovered
hidden threads. Every exported circuit has one move and a smooth periodic closure;
no masks, dash gaps or embedded raster are used.

**Visual outcome remains incomplete.** Rendering at 390px and enlarged fold
inspection show conspicuous return bends/crossings and insufficient sculptural
depth. A parallel-return attempt produced hairpins; filtering shorter guides
lost too much of the silhouette. Neither is accepted. The retained circuit study
demonstrates geometric closure but does not meet the visual acceptance criteria.
Next: author bundle-level routes/overlap rather than rely on proximity pairing.
Tests/build/lint remain paused. Production Home and personal data are untouched.

## Previous review: reference-traced vector master

The developer rejected the procedural studies as unlike the supplied reference
and approved trying a faithful static vector master before more color or
onboarding variation. The default local preview now compares the
[continuous-line master](design/personal-imprint-continuous-master-v1.svg) with the
[reference](design/personal-imprint-thread-reference-v1.png). No Orange or
personalization is added to this master.

The developer then required each strand to be a genuine continuous line, rather
than disconnected strokes trying to connect, and explicitly paused tests until
the exact shape is settled. The script now measures reference strand directions
and integrates full trajectories through that flow field. It no longer joins
trace fragments. Short/truncated trajectories are omitted. Each of the 600 drawn
strands is one cubic SVG path with one initial move and no internal moves, dash
pattern, mask, or separately capped lighting pieces. A single whole-path gradient
supplies monochrome lighting. The prior segmented master remains preserved at
design/personal-imprint-thread-master-v1.svg.

This is a continuous drawing guided by the reference; it does not identify or
reconstruct the reference's hidden physical filaments or establish personalization.
The current SVG is 3,671,447 bytes with no embedded image. Source inspection found
600 paths, exactly one M per path, C commands thereafter, and no dash/mask/clipping
breaks. The standalone SVG render is outputs/imprint/continuous-master-390.png.

The preview at localhost:3024 shows the comparison. The prior studies remain at
`?study=previous`; their retained behavioral checks are not visual acceptance of
those studies. Earlier segmented-master checks passed 10/10 and 2/2, but those
results do not verify this revision. No tests, build or lint were run for the
continuity revision, following the developer's instruction. Only artwork generation,
SVG structure inspection and visual rendering were performed. Next: review the
exact shape and continuous lines before Orange, variation or resumed testing.
When tests resume, retarget the asset contract to the continuous master first.

## Approved artwork prototype — 2026-11-15

Developer approved an isolated renderer, synthetic preview, focused tests and
owning/continuity records. Only the central artwork is in scope. Explore both
supplied ribbon references. Name, birthday and other reviewed onboarding answers
generate the original form; feeling is excluded. Retain that original form after
profile corrections. Daily progress and completed Chapters change Orange only.

Six connected regions: starting answers/Chapters, Notes, Deep Thoughts,
Habits/Tasks, Log/Week, and Protocol. Completion origin chooses the color region:
the same task checked from Week colors Log/Week; checked from Routine colors
Habits/Tasks. Completed Chapters color the starting region. Existing completion
records and routing are unchanged; origin capture is future integration work.

The revised prototype uses version-3 recipes containing periodic three-dimensional
fold controls and synthetic sample controls. Existing version-1 and version-2
recipes retain their original geometry/renderers. It draws 256 complete filaments
through overlapping curved folds. An invisible depth pass hides rear filaments;
only individual strands contribute visible pixels. Each thread keeps one Bone
or Orange hue along its entire length, with lighting affecting brightness only.
Color no longer resets at section boundaries. Shape and scene remain fixed when
sample progress changes. Narrow seams from overlapping raster samples are removed
by compositing each filament's maximum pixel coverage once.
Its hash is a 32-bit variation seed, not a uniqueness guarantee or secure digest.
Recipes contain numeric geometry, not source names/birthdays/answer text. No
real recipe persistence, new onboarding records, migrations or sync are added.
The approved generator field list, normalization of multi-select answers,
empty/uncertain answer mapping, deletion of derived recipes and durable original
recipe storage still need review before personal integration. Synthetic color
amounts and region placement demonstrate the renderer; they do not establish
activity weights, save semantics, fading or a progress formula.

Run `node scripts/preview-personal-imprint.mjs` and open http://127.0.0.1:3024.
Normal `/os/home` remains empty. Tests: `node --test tests/personal-imprint.test.mjs
tests/personal-imprint.browser.mjs`. Screenshots are under outputs/imprint.

### Thread-reference revision — 2026-11-15

Developer's follow-up requires denser individual threads, retained paths, no
abrupt ends or hue changes, and multiple curves/folds rather than a single closed
ring silhouette. The current version-3 revision replaces the rejected sectioned
curve construction with complete, smoothly closing filaments and fuller overlapping
folds. The thread loops themselves have no exposed endpoint. Physical occlusion
can hide a thread behind another fold. This remains an isolated artwork study;
exact spatial area mapping and real completion-origin storage remain later work.
Final focused model/browser checks pass 8/8, including all three phone widths,
original-form retention, unchanged alpha geometry, smooth closing paths, constant
hue through lighting changes, and absence of raster sample-joint bands. Visual
acceptance remains developer review against the supplied art.

Developer approved the prompt/reference-generation and curve-renderer revision
after inspecting the first mesh-like study. Built-in imagegen generated the
[standalone reference](design/personal-imprint-thread-reference-v1.png) using the
two supplied phone images only as artwork/style references. This PNG is a design
benchmark, not the app renderer or a personal shape. The procedural renderer
still needs developer comparison against its richer folds; test passes certify
behavior, not visual equivalence.

The generation prompt was:

```text
Use case: stylized-concept. Generate a standalone abstract thread sculpture
closely matching ONLY the central artwork in the two reference images. The
images are style/shape references, not whole-screen edit targets. Show only the
sculpture on a uniform deep Ink background (#191813), high-resolution portrait.

Construct the entire form from hundreds of individually distinguishable, fine,
continuous strands. Each strand must remain visibly separate, with narrow dark
spaces between neighboring strands. The strands themselves create the shape,
its edges, folds, and apparent volume.

Gather the strands into flowing bundles that curl, fan outward, narrow, and
fold back around irregular openings. Combine a substantial layered lower body
with rising asymmetrical loops and curling lobes. Preserve the references' rich
sculptural silhouette and finely engraved detail. The second reference has
particularly good individual strand definition: preserve that legible string/
hair quality, not a smooth membrane with lines drawn across it.

Neighboring strands follow related long paths with subtle differences in
spacing, curvature, thickness, and brightness. Use warm Bone (#F1EFE8) for
illuminated threads, with subdued Charcoal threads receding into shadow.
Convincing front-to-back overlap: foreground bundles conceal strands passing
behind them.

Color a restrained selection of existing strands Orange (#E36B37). Orange
follows those individual curved threads through the bundles, with dark
separation still visible between them.

Crisp, tactile, calm, intricate. Avoid translucent mesh, crossing wireframe grid,
smooth solid membrane, fabric sheet, broad painted color bands, neon glow,
blurred filaments, symmetric helix and simple spiral tube. No phone, interface,
text, labels, arrows, borders, or surrounding objects. Comfortable negative
space around the complete sculpture.
```

## Start here in a new chat

Home should recognize the person's starting point before Circle and the life
they continue recording. Preserve the finely engraved flowing-ribbon aesthetic.
Keep simple labelled destinations for Habits, Tasks, Log and possibly Protocol.

Start with the [signed-in Home review](#signed-in-home-imprint--2026-11-23)
for the implemented artwork, source mapping and pulse rules. Tool shortcuts
from Home and generation from a person's onboarding answers remain future work.

Use the [replacement onboarding](ONBOARDING_SPEC.md), [Product](PRODUCT.md),
[record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md), [Design](../DESIGN.md)
and [Page standard](../app/os/APP_SESSION_STANDARD.md) when reviewing the
replacement onboarding and its Home destination.
Earlier concept discussion is [archived](archive/2026-11-11-doc-cleanup/PERSONAL_IMPRINT_HOME.md).

## Portable visual references

These are concept art, not working UI or real personal evidence.

![Original selected style](design/personal-imprint-original-style.png)

![Foundation unfolding](design/personal-imprint-foundation-unfolding.png)

![Imprint with a living edge](design/personal-imprint-living-edge.png)

## Earlier exploration (historical where superseded above)

The following exploration predates the approved six-region artwork scope above.
Its alternative groupings and geometry-growth proposals are not current decisions.

### Previously recorded direction and proposals

| Topic | Recorded direction | Status |
| --- | --- | --- |
| Home concept | Personal Imprint represents past and present. | Developer-selected direction. |
| Starting shape | Form the shape from onboarding answers, with one fold or bundle per answered question. No fold or bundle for Not sure yet. | Developer-proposed rule to preserve and explore. |
| Daily destinations | Give Habits, Tasks, and Log their own areas. | Developer direction. |
| Navigation | Tapping a tool area opens its main page. | Developer direction; routing is not built. |
| Input color | Input contributes faint Orange. | Developer-proposed behavior. Exact accepted-input and aggregation rules are open. |
| Completion color | Completion makes the relevant area brighter Orange. | Developer-proposed behavior; exact strength is open. |
| Log exception | Log brightens only once the saved record's time has passed. | Developer clarification. The working interpretation in the discussion is the block's end time. |
| Aging | Orange becomes fainter as days pass. | Developer direction; rate, window, and blending are open. |
| Protocol | Add its own area, or add Orange to Habits when Protocol is done. | Developer alternatives; no final choice. |
| Starting-area tap | Tapping the foundation could show the supplied starting answers. | Assistant proposal, not confirmed navigation. |
| Form selection | Substantial foundation with unfolding tool areas, or a living outer edge. | Two review concepts, not a final selection. |

The assistant suggested excluding account/verification/preview screens from the
fold count, grouping the fields for one repeated experience into one bundle,
giving Protocol a fourth area, and using a daily Protocol seal. These are
**recommendations, not decisions made by the developer**.

## Starting form

The developer proposed a fold/bundle for each answered onboarding question and
none for Not sure yet. Exact counting is not settled: the newer required-answer
flow still needs uncertain-answer routes. Excluding credentials/verification/
preview screens and grouping repeated-experience fields are recommendations,
not approved counting rules.

Use reported experiences, wanted change and chosen habit as distinct meanings.
No invented chronology, accomplishment, trait or progress toward an unrelated
ambition. The foundation is not a willpower/worth score. Name/birthday use,
unknown dates, corrections and removals need explicit mapping review.
Starting-area tap to a readable answer view remains proposed.

## Tool areas and daily color

Keep the areas recognizable and directly labelled. The developer simplified
away the need to create personal topic threads or tag everything before the
Home visual can work. Read the tools' existing records directly.

| Area | Proposed faint state | Proposed brighter state | Important boundary |
| --- | --- | --- | --- |
| Habits | Saved habit input. | A recorded habit completion. | Whether an unchanged recurring habit creates a fresh faint contribution each day is not decided. |
| Tasks | A saved task. | Its actual completed state. | A Week step and its Routine task are one record, not two contributions. |
| Log | A saved block whose end time is still ahead. | A saved block whose end time has been reached/passed. | Elapsed time is the visual condition; it does not create a Habit/Task completion or prove activity occurred. |
| Protocol | Possible active/draft input state. | Daily seal or completed phase, still to be chosen. | Daily sealing and finishing an entire phase are different events. |

The discussion used accepted saved input as the sensible starting point for
color, not keystrokes, untouched placeholders, previews, or incomplete drafts.
This is an implementation recommendation to confirm against each tool's save
contract. Reopening a screen or repeatedly saving the same text should not
manufacture activity.

The user has not chosen what one bright area means when several records have
different states. Options include separate colored filaments within the area or
a combined strength. Before implementation, decide whether one completion,
several completions, or all relevant items determines brightness. Do not quietly
adopt a percentage, action score, or equal weighting across unlike records.

### Log time rule

The concrete example discussed was a saved **14:00–15:00** block:

- Before 15:00, it contributes faint Orange.
- From 15:00, it can contribute brighter Orange.
- On later Circle days, that contribution becomes quieter under the chosen fade.

This interprets the developer's "saved record's time is passed" as **the block's
end time**. Keep that working rule explicit; single-time records or other time
formats need their own handling if introduced.

Derive the state from the saved attributed day, start/end range, and current time.
There is no need to add a synthetic completed flag to Log. A past block saved
late is already elapsed, but its color age should relate to its attributed day,
not be reset to today by the later save or correction. Editing the end into the
future can make its contribution faint again. Clearing/removing the record must
remove its current visual contribution under the owning data contract.

Handle blocks that cross midnight, the local 06:00 Circle-day boundary, app
background/resume, and reload. Old day/time attribution must not be silently
rewritten when the person travels. The exact timezone serialization remains an
existing broader contract to review.

### Fading and recent days

The developer wants faint Orange after input, stronger Orange after the relevant
completion/elapsed condition, and progressively fainter Orange as days pass.

No numeric opacities, fade duration, retention window, saturation ceiling, or
blending formula has been approved. Today and Yesterday should be represented;
the treatment of older app history is still open. The foundation should remain
present while recent color changes. Fading the presentation does not remove
underlying records.

Compute color from source state and dates, not from how often the app opens.
Recalculate after save, undo, correction, deletion, reload, and return from the
background. Honor the **06:00 Circle day**, rather than a midnight/UTC date slice.
Brightness is proposed to encode activity state and recency; the earlier study's
"Orange means selected thread only" rule has been superseded by this direction.

### Protocol placement remains open

The developer proposed either a fourth Protocol area or adding Orange to Habits
when a Protocol is done. The assistant recommended a fourth area because it adds
little rendering complexity and keeps the tap destination clear.

If Protocol shares Habits, review how Protocol remains directly discoverable,
whether the source is a term, daily seal, or full phase, and how to avoid duplicate
credit. Do not relabel Protocol evidence as a Habit completion. Do not add a new
completion condition, change duration choices, or reopen a sealed/past phase as
part of the Home design.

## Navigation and feeling

The [deferred swipe-through tutorial](#deferred-proposal-swipe-through-imprint-tutorial--2026-11-25)
supersedes the earlier direct-tool navigation idea for the Imprint.

Earlier direction: tapping **Habits, Tasks, or Log opens that tool's main page**.
It does not open a personal-thread detail panel below the imprint. A separate
Protocol area would follow the same direct-entry principle if chosen.

Both the labelled destination and a sensible part of its visual area should be
usable with at least a 44px effective target. Provide visible focus and meaningful
accessible names. Do not make individual hairlines the only way to navigate.
Tool entry and Back must retain drafts, selected pages, current records, and
existing access gates. Visiting Home creates no completion or Athena request.

The foundation's own tap behavior remains proposed. It could open a readable
view of the starting answers, but that page, its corrections, and its return path
have not been designed or implemented.

Feeling stays separate from activity brightness in the reviewed concepts. Preserve
the newer [onboarding feeling contract](ONBOARDING_SPEC.md#preview-and-feeling-behavior):
required initial 0–10 dial answer, later Home check-ins, daily popups off by default,
and opt-in Ask me each day. The onboarding answer counts for its actual Circle
day. A low feeling must not reduce the person's recorded effort. The sample
"Feeling 6 / 10 · 8:42 AM" is fictional, not approved permanent copy or real data.

## Craft and implementation review

Preserve a substantial asymmetrical flowing foundation with fine engraved
ribbons, clean negative space, subdued Bone/Ink depth and controlled Orange.
Do not require a learned mark vocabulary, counts, percentages or a legend.
Tool areas are directly labelled; hairlines are not the only touch targets.

Choose foundation-unfolding versus living-edge composition, final silhouette,
accepted-input mapping, unknown-answer treatment, brightness aggregation,
fading window, Log end-time cases and Protocol source/placement before coding.
Review correction/deletion/undo, cross-midnight blocks, 06:00 rollover, travel,
reload/background return, accessibility and reduced preferences.

Reuse existing domain/read models and Page/navigation engines. Compute from
saved source state and attributed dates, not app visits or duplicate saves.
Do not create records or completions to support the drawing. Personal data,
schema, signup activation, sync and deployment require separate approval.
