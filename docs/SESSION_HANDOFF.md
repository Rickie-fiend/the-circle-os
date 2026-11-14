# Session handoff

## Durable offline entry and crash recovery — 2026-11-14

**Approval/Git.** Developer approved durable proof/logout implementation, tests
and seven records. main/6a09b62; earlier modified/untracked work preserved.
No staging, commit, deployment, hosted changes, migration or sync activation.

**Implemented.** New issuer-namespaced IndexedDB Auth store uses strict durability,
transaction completion and expected epochs. Offline entry verifies proof and
rechecks its epoch; logout locks immediately and awaits durable invalidation
before network logout. Revocation handles asynchronous failure outside SDK awaits.
Valid legacy proof imports only into an absent record; closed/corrupt records
cannot fall back to old proof. Fresh explicit sign-in can reset corrupt state.
Existing verification and server authorization rules remain intact. Auth boundary
needed no source change. Writing/SDK refresh-token storage remain unchanged.

**Final verification.** Isolated production webpack build/TypeScript and focused
lint pass. Recovery selection 18/18 (72938ms), controller/proof tests 12/12.
Both 360/390px crash cases now finish: exact saved writing/drafts, offline edits,
clearing, empty composer, completed logout/crash, B isolation and restored A without
duplicate revisions. Upgrade, stale writes, corrupt/refused storage, forged and
expired durable proof, recovery and cross-tab cases pass. Initial forged-proof
fixture targeted only legacy storage; it now tests the authoritative row. Fresh
B may have no writing object store, which the read-only fixture now accepts.
Logout fixture waits until the sign-in button is enabled before proceeding.
[Commands/details](USER_JOURNEY_TESTING.md#durable-offline-entry-and-crash-recovery--2026-11-14).

**Limits/invariants/next.** Desktop Chromium with synthetic Auth; this does not
certify hosted changes, actual phones, OS eviction or backup/restore. Phone tests
remain deferred. Shared geometry/type/motion, Circle day, personal evidence and
immutable content untouched; no fresh geometry measurement. No optimization
justified. Review locally, then choose a separately reviewed operating-recovery
slice. Earlier failing snapshots below are historical evidence superseded by this
bounded fix. Sync remains off.

## Forced browser crash writing recovery — 2026-11-14

**Approval/Git.** Developer approved tests, isolated runner and six records.
main/6a09b62; pre-existing work preserved. No staging, commit, deployment, hosted
change or sync activation. No product runtime changed.

**Implemented/results.** Persistent Chromium helper verifies its exact disposable
profile before Browser.crash and waits for disconnection. Runner explicitly keeps
sync disabled. Final production webpack build/TypeScript and focused lint pass.
Recovery selection passes 15/17: existing Auth and normal-restart cases pass;
both new crash cases at 360/390px fail. Offline /os navigation is served by the
service worker after a real browser crash, but Welcome back appears instead of
the writing tools. First recovered-answer assertion fails. This establishes a
bounded synthetic offline-entry blocker, not writing deletion or phone/hosted
failure. Approved investigation now confirms exact saved entries/revisions and
drafts survive both crashes. Offline proof is present beforehand and absent
afterward; closed/password-flow markers are absent. Browser starts offline from
creation and reports one blank tab, so the launch-gap hypothesis does not explain
this run. Precise proof-loss mechanism remains unestablished.
Later crash steps (edits, clearing, empty composer, logout/account return) are
unreached. Tests remain enabled. [Commands/attempts](USER_JOURNEY_TESTING.md#forced-browser-crash-writing-recovery--2026-11-14).

**Attempts/invariants.** Sandbox junction required approved external execution.
Ownership check needed explicit automation flag; waiting for a crash-command
reply then stalled the test. Disconnection-based completion corrects that harness.
Stopped only the command-line-verified isolated worker; checked and removed its
residual outputs profile. Shared geometry/type/motion, Circle day and immutable
content untouched; no fresh geometry measurement or optimization justified.

**Follow-up scope/checks.** Developer approved diagnostic/test correction and six
records. Only the browser suite changed further: launch-time offline mode,
sanitized proof/marker/startup diagnostics, ledger assertions before UI checks.
Final runner still passes 15/17 (57908ms); production build/TypeScript, focused
lint and scoped diff checks pass. No optimization justified or runtime edit made.

**Next.** Review durable offline proof and safe logout invalidation as a concrete
product fix proposal. Rerun complete crash acceptance afterward.
Phone testing remains deferred; OS eviction, backup/restore and wider activation
gates remain open. Earlier snapshots retain bounded completed evidence.

## Natural session expiry and writing recovery — 2026-11-14

**Approval/Git.** Developer approved natural expiry verification and explicitly
deferred phone testing. main/6a09b62; earlier modified/untracked work preserved.
Only the hosted runner/browser test and six records extended. No staging, commit,
deployment, migration, hosted setting, personal evidence or sync activation change.

**Completed/verified.** New --natural-expiry mode runs one 390px production-route
journey. Full real offline wait used signed JWT exp plus five seconds (3600-second
initial wait); no clock, token or SDK expiry metadata changed in this phase.
The expired issued token stayed unchanged. Closing/reopening the tab loaded /os
from the service worker and restored the exact saved Note and unfinished Deep
Thought. Reconnection/reload issued a different unexpired token; saved entries,
versions and drafts matched exact snapshots with no duplicate revisions.
Subsequent early-refresh/revocation/account-switch checks also pass. Both temporary
hosted accounts were deleted with 404 absence checks. Final browser test 1/1 took
3628 seconds after build; production webpack build/TypeScript, focused lint and
diff checks pass. Existing Next multiple-lockfile and debug.log line-ending
warnings remain. [Detailed commands/evidence](USER_JOURNEY_TESTING.md#natural-session-expiry-and-writing-recovery--2026-11-14).

**Limits/invariants/records.** This closes bounded natural expiry for desktop
Chromium tab reopening, not physical phones, a new browser process after expiry,
crash or OS eviction. No product defect found or optimization justified. Shared
geometry/type/motion, immutable definitions and Circle day untouched; no geometry
measurement claimed. Writing contract, architecture, bug/journey records and
Current Task updated. Earlier natural-expiry statements below are historical.

**Next.** Phone checklist stays deferred by developer request. Next agent scope
should review a remaining operating-recovery gate before implementation. Lost
devices, unconfirmed hosted denial, true contention, backup/deletion and broader
activation readiness remain open; sync stays off.

## Hosted account-session recovery — 2026-11-14

**Approval/Git.** Developer approved verification-only isolated runner/browser
checks and records, including creation/revocation/deletion of two synthetic hosted
accounts. main/6a09b62; all prior work preserved. No staging, commit, deployment,
hosted settings, migration, personal writing or sync activation changes.

**Completed/verified.** New check-auth-recovery-live runner builds allowlisted
production sources separately, excludes .env files and keeps writing sync off.
The secret stays in Node; only public Auth config enters the app. New browser
test passes 1/1 with 360/390px real hosted sign-in, early refresh-token rotation,
offline return, global revocation, rejected refresh, app lock, empty B entry and
returning A. Saved entries/revisions and unfinished draft snapshots remain exact.
Both temporary accounts were deleted with 404 absence checks. Final production
webpack build/TypeScript and focused lint pass. Diff check passes with the existing
debug.log line-ending warning. [Commands/evidence](USER_JOURNEY_TESTING.md#hosted-account-session-recovery--2026-11-14).

**Attempts/limits.** Sandbox dependency junction failed before hosted setup;
approved outside-sandbox rerun required. First hosted run's five-second sign-in
wait failed with both accounts cleaned; a 30-second assertion allowance passes.
SDK expires_at metadata requests early renewal without altering signed tokens;
natural JWT expiry is explicitly unverified. After revocation /user returned 403
at both widths while issued tokens retained 3596 seconds. This bounded observation
does not establish universal immediate revocation. Setup/delivery gates are seeded
synthetically, not onboarding proof. No measured optimization justified.

**Invariants/records/next.** No product geometry, motion, Circle-day, immutable
definitions or personal evidence changed; no new geometry measurement claimed.
Writing contract, architecture, bug/journey records and Current Task updated.
Phone/PWA acceptance, natural expiry, crash/OS eviction, unconfirmed hosted denial,
backup/deletion and other activation gates remain open. Next developer completes
the existing phone checklist; natural-expiry verification remains a distinct
uncompleted part of session acceptance. Prior snapshots below preserve context.

## Real-app offline writing recovery — 2026-11-14

**Approval/Git.** Developer approved production-route offline verification,
isolated runner, Auth-suite extension and six records. main/6a09b62; earlier
modified/untracked work preserved. No product runtime, shared geometry, hosted
data, migration, sync activation, staging, commit or deployment changes.

**Completed/verified.** New check-writing-offline.mjs prepares a disposable Next
production build with synthetic Auth settings and its own loopback server.
It preserves the original review build and excludes .env files. Existing Auth
fixtures now support persistent browser restarts. Actual Note/Deep Thoughts UI
retains saved Note and unfinished answer through two offline process restarts;
navigation is explicitly served by the service worker. Offline edits survive,
logout remains locked, empty B sees no writing, and returning A keeps exact saved
entries without duplicate revisions. Setup/delivery gates are isolated fixtures,
not newly verified onboarding.

Final production build/TypeScript and focused lint pass. Final Auth/recovery
selection passes 15/15, including both new 360/390 cases. Full selection previously
passed 15/17: two unchanged menu tests expect 650 instead of current 700. Runner
prints its behavioral selection; no assertions removed or blanket suite pass.
Initial attempts corrected fresh-state, retired-draft and empty-ledger assumptions.
Temporary profiles/builds are cleaned within checked workspace paths.
[Detailed evidence and phone checklist](USER_JOURNEY_TESTING.md#real-app-offline-writing-recovery--2026-11-14).

**Limits/invariants.** Normal Chromium restart of actual production routes is
verified with synthetic Auth. Phone/installed PWA acceptance, real hosted session
expiry/revocation, crash/OS eviction and backup/deletion remain open. Existing
template/source-test/ResizeObserver gaps persist. Shared geometry/type/motion,
Circle day, immutable definitions and phone evidence remain unchanged; no geometry
remeasurement or optimization claimed. Sync remains off.

**Records/next.** Writing contract, architecture, bug/journey records, Current Task
and this snapshot updated. Next developer runs the documented phone checklist;
hosted-session and operating recovery require separate reviewed scope.
Earlier snapshots retain the completed writing/template evidence.

## Writing browser-restart recovery — 2026-11-14

**Approval/Git.** Developer approved tests and the five named records.
main/6a09b62; prior work preserved, no staging/commit/deployment or hosted changes.
Developer reports Explore reviewed, Protocol/Article publishing tested and the
Note caret issue fixed. Device/browser details were not supplied.

**Completed/verified.** Existing storage/cloud browser suites now close and relaunch
persistent synthetic Chromium profiles with the actual writing store. Drafts and
saved history survive; empty B and restored A remain separate. Denied upload and
accepted/lost-reply upload preserve exact pending work across restart, then recover
without a duplicate saved version or changed accepted head. Synthetic local
PostgreSQL/HTTP/Auth, external traffic blocked. Final two suites pass 37/37;
focused lint passes. Initial assertions passed but locked Cookies files caused Vite
watcher EBUSY failures; ignoring outputs in both test servers fixes the final run.
Temporary profiles are cleaned within checked workspace paths.
[Commands and evidence](USER_JOURNEY_TESTING.md#writing-browser-restart-recovery--2026-11-14).

**Limits/invariants.** No product code or shared geometry/type/motion changes,
therefore no new geometry measurement. No broad optimization justified. Normal
desktop process restart is verified; crash/OS eviction, offline production-route
startup, target phones and real hosted session expiry/revocation remain open.
Product sync stays off. The earlier Note diagnostic was blocked by sandbox
loopback denial; the new suites used approved outside-sandbox access.
Earlier template operational gaps remain, including changed-image 503, stale
Protocol source assertion, original Effort draft and broader operating recovery.

**Records/next.** Bug index, writing contract, journey, Current Task and this snapshot
updated. Next prepare the separate offline-startup/target-device recovery proposal.
No further implementation/activation approval is implied. Earlier snapshots retain
template evidence and the completed hosted migration status; never reapply it.

## Approved hosted template acceptance — 2026-11-14

Developer approved applying migration 004 once and the prepared synthetic hosted/
browser procedure, then requested continuation. Applied successfully to the
configured CircleOS Server project; verified template helper present and anonymous
publication/ordinary delegate access denied. Never reapply migrations 001–004.
The final runner passed 88 functional checks plus actual signed-in browser
Explore → Routine/Protocol → tick → reload, withdrawal/restore and exact cleanup.
Each failed attempt also confirmed removal of its registered accounts, grant,
drafts, versions/references, asset and receipts. No real authored publication,
deployment, staging, commit or sync activation; prior working-tree work preserved.

The real-browser chain found Protocol Start returning to Routine because its
saved Page index won over the URL hash. Adoption now saves the desired index in
the same local state, sharing the existing version constant. Production build/
TypeScript and focused lint pass; updated local Add/Start retry cases pass 3/3;
final hosted browser passes both destinations and reload. Test-harness fixes:
signed-out 401, current changed-image 503 plus byte-retention verification, and
origin-guarded fixture storage initialization. The 503 classification remains a
gap. Preflight security-advisor findings were recorded without changing unrelated
policies/settings. Existing phone, contention, backup/restore, ResizeObserver,
original Effort-draft and stale Protocol source-assertion gaps remain.

Current Task and Admin setup record completion; detailed evidence is in the
latest journey entry. Next: developer reviews Explore and authors/publishes real
content deliberately. Do not rerun migration or publish authored material as an
incidental follow-up. Earlier snapshots below remain dated historical evidence.

## Explore and local template completion — 2026-11-14

**Approval/Git.** Developer approved the local completion proposal and specified
Explore first: three glass rows, outside titles, saved fields only, retained
logo/account/navigation, Today background, no outer frame, vertical scrolling,
bounded horizontal carousels and raised Orange-shadow selections. Empty rows have
two blank panels; a single item has a blank neighbour. They chose to reopen an
active Habit group and allow a fresh copy only after all items stop/expire.
main/6a09b62; pre-existing modified/untracked work preserved. No stage, commit,
remote write, authored publication, deployment or sync activation.

**Completed/verified.** Explore uses native scroll-snap and the existing compact
floor, glass/roles/24px anchors. Exact-version links use one metadata listing;
withdrawn items stay out for every role. Explicit Routine Add reuses domain/
schedule actions and stores immutable group/settings/answer snapshots with item
references. Existing identity/items/history remain. Add/Start share an account
lock, retry operation and acknowledged local save; stale epochs are rejected.
Source marks reveal original details without evidence mutation. Admin adoption
is disabled; Protocol's existing gate/fixed terms/phase protection stay intact.

Final production webpack build/TypeScript, focused lint and compiler (33 sources/
0 quests) pass. Focused model/route/SQL/gate checks pass 30/30. Production-CSS
template selection passes 13/13; adopted tools/navigation/matrix/geometry 10/10;
late epoch/Admin-denial plus Explore recheck 12/12 (5 overlapping template checks
and all 7 Explore checks). Settled reference Note/Thoughts/Habit/Protocol frames
stay 648px/24px at 360/390; matrix covers 416 and Explore also covers 1100.
Screenshots inspected. The final built review server is ready on local port 3012.
[Detailed commands/evidence](USER_JOURNEY_TESTING.md#explore-and-local-template-completion---2026-11-14).

**Attempts/gaps/invariants.** Sandbox output/loopback denial required approved
outside-sandbox execution. Corrected virtual-fixture parsing/region labels,
desktop neighbour scale, unintended focused height, old 3px action lift, source
typography and checkbox placement; affected checks pass after correction. Expanded
selection passes 135/136: the unchanged Protocol Footer source assertion searches
for a missing comment marker and fails against reconstructed pre-task source too.
No full-suite certification. Existing ResizeObserver, physical-phone, original
Effort-draft, true contention and operating recovery gaps remain. Published
definitions, shared geometry/motion tokens, 06:00 day and sync activation stay
unchanged. debug.log has three added lines and is preserved. No broad optimization
was justified; one listing/shared image reads avoid added metadata fan-out.

**Records/next.** Product, design/Page standard, record contract, architecture,
decisions, Admin plan/setup, roadmap/queue, bug index and Current Task updated.
Read-only hosted discovery/query confirmed the configured project and absent
template-migration marker. Migration 004 and the write-gated synthetic runner are
prepared, not executed. Developer reviews the [exact procedure](CONTENT_ADMIN_SETUP.md#prepared-hosted-template-acceptance)
before separate approval to apply once, run real hosted/browser acceptance and
clean only exact fixtures. No deployment or real authored publication is requested.
Earlier snapshots below remain historical evidence.

## Retire outdated button source checks — 2026-11-14

Developer approved removing the nine outdated blocks, retaining the other 14
and adding no tests. Removed the blocks and associated comments from
`tests/button-standard.test.mjs` and tidied redundant blank lines. Remaining
checks pass 14/14; Node syntax, focused ESLint and final diff checks pass.
No app code, CSS, personal records, published definitions or runtime behavior
changed. No new behavioral coverage or runtime fix is claimed. No browser/build
rerun for this test-only change. [Journey evidence](USER_JOURNEY_TESTING.md#retire-outdated-button-source-checks---2026-11-14)
lists removed expectations and commands.

main/6a09b62; all prior modified/untracked work preserved. No staging, commit,
publication, migration, deployment or sync activation. Current Task and bug
index reflect retirement of the stale source checks; earlier failing results
below remain historical. Physical phones, ResizeObserver notices, original
Effort-draft diagnosis and hosted/operational gaps remain open. Migration 004
remains unapplied; no broad-suite certification. Next: select another bounded
cleanup scope before editing.

## Unused Routine/task CSS cleanup — 2026-11-14

**Approval/Git.** Developer approved six unused style families, trimming mixed
rules, two existing button-standard assertions and continuity notes.
main/6a09b62; prior modified/untracked work preserved. No stage, commit,
publication, migration, deployment or sync activation.

**Completed/verified.** Removed os-extra-mission-done, os-primary-mission-copy,
os-add-habit-row, os-task-done, os-habit-session-label and os-yesterday-undo.
Ten whole rules removed; six mixed rules keep active selectors and identical
declarations, verified against a pre-edit AST snapshot. Retired dotted-control
comment removed. Existing assertion selector names updated; no new tests added.
CSS parsing/absence check, production webpack build/TypeScript and focused lint
pass. Existing compiled-CSS browser selection passes 9/9: repeat task completion,
Record Undo/reload, Record styling at 360/390, Habit response/restored Undo,
shared matrix at 360/390/416 and geometry at 360/390. Reference frames remain
648px with 24px foreheads and no nested scroller. Record screenshot inspected;
final diff checks pass. [Journey evidence](USER_JOURNEY_TESTING.md#unused-routine-task-css-cleanup---2026-11-14)
holds commands/logs.

**Attempts/gaps.** Button-standard source tests pass 14/23. Nine fail on unchanged
old key-light, action lift/height, 18px gap, JSX formatting, sunk-key and Thoughts
departure expectations. They remain unfixed; no full-suite pass. Sandbox output
EPERM required approved outside-sandbox build execution. Browser execution was
also approved outside the sandbox. No app logic, record, content version, shared
token, motion or Circle-day change. No performance claim. Existing physical-phone,
ResizeObserver, original Effort-draft and hosted/operational gaps remain open;
migration 004 remains unapplied. Next: separately review stale button-standard
expectations before further edits. Prior evidence remains below.

## Unused Note/check-in CSS cleanup — 2026-11-14

**Approval/Git.** Developer approved removal of the five unused style families
and their responsive rules. main/6a09b62; prior modified/untracked work preserved.
No stage, commit, publication, migration, deployment or sync activation.

**Completed/verified.** Removed 11 rules for os-save-state, os-checkin-card,
os-note-mode-toggle, os-line-cue and os-note-deck-note plus the obsolete footer
status comment. These classes have no app/public runtime references; retained
Line content, writing logic and historical Chapter rendering remain untouched.
CSS parses and the retired selectors are absent. Production webpack build and
TypeScript pass. Existing compiled-CSS browser checks pass 9/9: writing pair at
360/390/416px, shared matrix at those widths, saved Deep Thoughts/Next question
and geometry at 360/390px. Note screenshot inspected. Reference frames remain
648px with 24px foreheads and no nested scroller. Final diff checks pass; no new
tests added. [Journey evidence](USER_JOURNEY_TESTING.md#unused-note-check-in-css-cleanup---2026-11-14)
contains exact commands/logs.

**Attempts/gaps/invariants.** The initial selector-scan escaping error and patch
hunk ordering were corrected before files were changed. Sandbox generated-output
EPERM required an approved outside-sandbox build; browser execution was also
approved outside the sandbox. No records, versions, shared tokens, motion,
Circle-day or sync rule changed. No performance claim. Physical phones,
ResizeObserver notices, original Effort-draft diagnosis and hosted/operational
gaps remain open; migration 004 remains unapplied. No broad-suite certification.
Current Task records this completed slice; earlier evidence remains below.
Next: select a separately reviewed cleanup scope.

## Retired Log CSS cleanup — 2026-11-14

**Approval/Git.** Developer approved removing the unused old Log styles and
responsive variants while retaining shared/error/Chapter styling. main/6a09b62;
all prior modified/untracked work preserved. No stage, commit, deployment,
publication, migration or sync activation.

**Completed/verified.** Removed nine unused class families from os-app.css:
log-gate, section-heading, day-hint, close-log, add-time, hour-being-edited,
main-activity-field, note-field and save-log (all with os- prefixes). Shared
form-error grid placement and active mission responsive heading remain intact.
App source had no references to the removed classes; dynamic Log class usage
was inspected. CSS parsing and absence/shared-rule checks pass. Production Next
webpack build/TypeScript pass. Existing compiled-CSS browser selection passes
10/10: Log entry/save/reload at three widths, corrections at 360/390px, shared
tool/supporting-view matrix at three widths and geometry at 360/390px. Reference
Note/Thoughts/Habit/Protocol remain 648px with 24px foreheads and no nested
scrolling. The 390px Log screenshot was inspected. No new tests were added.
Final diff review/check passes. [Journey evidence](USER_JOURNEY_TESTING.md#retired-log-css-cleanup---2026-11-14)
holds commands and logs.

**Attempts/gaps/invariants.** Sandbox generated-directory EPERM required an
approved outside-sandbox build; browser checks also used approved execution.
No behavior, personal data, published content, shared token, motion or Circle-day
rule changed. No performance improvement is claimed. Existing ResizeObserver
notices, physical devices, original Effort-draft diagnosis and hosted template/
operational gaps remain open. Migration 004 remains unapplied. No broad-suite
certification. Current Task records this completed slice; prior evidence remains
below. Next: select a separately reviewed cleanup scope.

## Remove stale first-use tests — 2026-11-14

Developer explicitly requested removal of the three stale first-use tests
without replacement tests. Removed their blocks/comments from
`tests/first-use-setup.test.mjs` (67 lines); the other five remain unchanged.
No app code, saved records, published definitions or runtime behavior changed.
Node syntax check, focused ESLint and final diff checks pass. No test suite,
browser or build was run; no new behavioral coverage is claimed.
[Journey record](USER_JOURNEY_TESTING.md#remove-stale-first-use-tests---2026-11-14)
holds the checks and removed expectations.

main/6a09b62; all prior modified/untracked work preserved. Nothing staged,
committed, published, migrated or deployed. Current Task records the completed
removal. Further cleanup needs a bounded scope. Physical phones, ResizeObserver
notices, original Effort-draft diagnosis, hosted template acceptance and earlier
operational gaps remain open. Migration 004 remains unapplied; writing activation
is unchanged. Prior cleanup evidence remains below.

## Week setup test timestamps — 2026-11-14

**Approval/Git.** Developer approved the reviewed fixed-date test cleanup and
bug/continuity notes. main/6a09b62; prior modified/untracked work preserved. No
staging, commit, migration, publication, deployment or sync activation.

**Completed and verified.** Only the Week setup test changed: three synthetic
declarations use explicit September 7 timestamps through the existing API.
The six-month target now matches the fixture's March 2027 expectation without
depending on today's clock. Character versions have separate timestamps and
retain the existing two-version/earlier-wording assertions. The previous
Week/phase/entry/history model selection now passes 24/24, and related Character,
Vision declaration and Reflect model checks pass 21/21. Focused ESLint and final
diff checks pass. [Journey evidence](USER_JOURNEY_TESTING.md#week-setup-test-timestamps---2026-11-14)
contains exact commands and logs. No failures occurred after the correction.

**Invariants/gaps.** No app/model code, personal evidence, published Chapter,
geometry, motion, Circle-day rule or runtime date calculation changed. Browser
and build checks were not repeated for this test-only slice; earlier runtime
results remain historical. No broad-suite certification or performance claim.
The prior date-dependent test gap is closed. Physical phones, ResizeObserver
notices, true contention, the original Effort-draft diagnosis, hosted template
acceptance and earlier operational gaps remain open. Migration 004 remains
unapplied and writing activation stays off.

**Records/next.** Current Task and bug index reflect the verified correction;
previous cleanup evidence is retained below and in the journey record. Select
the next bounded cleanup proposal before further edits. No new product decision
or optimization was needed.

## Week lock cleanup — 2026-11-14

**Approval/Git.** Developer approved the concrete Week lock cleanup proposal.
main/6a09b62; all prior modified/untracked work preserved. No staging, commit,
publication, migration, deployment or sync activation.

**Completed.** Removed the unreachable Week locked screen, its redundant
`weekIsOpen` lookup/guard and stale waiting-for-a-week comment. Current/history
Week rendering is direct. Phase comments/test wording distinguish current Week
access from historical thresholds. Added behavioral coverage that Week remains
open for absent/unfinished/completed setup, access checks do not mutate runs,
and Protocol still waits for completed Day One, including earlier versions.
The shared LockedAppPage remains available for Protocol. Old setup definitions,
handlers, stored runs and answers remain intact; no identifiers were migrated.

**Verified.** Production Next webpack build/TypeScript and focused lint pass.
Production-CSS browser selection passes 7/7: Routine/Week entry with unfinished
runs preserved through reload, Protocol toggle/reload, matrix at 360/390/416px
and reference geometry at 360/390px. Note/Thoughts/Habit/Protocol remain 648px
with 24px foreheads and no nested scroller. Shared tokens and motion are unchanged.
Exact commands/logs are in the [journey entry](USER_JOURNEY_TESTING.md#week-lock-cleanup---2026-11-14).

**Attempts/gaps.** Model selection passes 23/24. The unmodified Week setup test
expects a six-month target of 2027-03 while creating the declaration with today's
clock (2027-05 actual). The failing declaration model was not edited. This
separate date-dependent fixture remains unfixed; no broad-suite pass is claimed.
Sandbox build passed compilation and TypeScript but hit generated-directory
EPERM; approved outside-sandbox execution completed. Existing ResizeObserver
notices remain. Physical phones, hosted template acceptance, true contention,
the original Effort-draft diagnosis and earlier operational gaps remain open.
Migration 004 remains unapplied. No performance optimization was justified.

**Records/next.** Current Task names this completed slice; prior Routine evidence
remains below and in the owning journey record. Bug index records the newly
observed test gap. Developer reviews Week/History and Protocol access; further
cleanup or the date-dependent test repair needs a separately reviewed scope.

## Routine presentation cleanup — 2026-11-14

**Approval/Git.** Developer explicitly approved the reviewed first cleanup slice:
one Routine presentation frame, redundant completed-frame conditions, setup
comments, stale Habit tests and continuity records. main/6a09b62; all prior
modified/untracked work, including template and Protocol Start implementation,
is preserved. No staging, commit, publication, migration or deployment.

**Completed and verified.** Routine creates its transient shared-player
definition/run together in one memo. Entry/navigation use that guaranteed
completed presentation directly. Saved Habit Building handlers and historical
rendering remain separate and unchanged. The helper's imports/frame definition
are readable, and comments describe independent Routine entry. Two obsolete
source assertions are replaced by a legacy setup projection/reload test and a
normal-motion browser check for immediate completed-result restoration across
opening, edit return, reopening and reload. Opening Routine/Week also verifies
unchanged unfinished setup runs and no saved presentation run after reload.

Production Next webpack build/TypeScript and focused lint pass. Five focused
model files pass 42/42. Ten distinct compiled-CSS browser cases pass across the
main selection and final affected rerun: initial 8/10; final 3/3, one overlapping
case. Protocol toggle/reload, the three-width cross-tool matrix, reference
geometry, long growth and deliberate Habit tick/Undo remain covered.
[Journey evidence](USER_JOURNEY_TESTING.md#routine-presentation-cleanup---2026-11-14)
holds exact commands, logs and the reviewed screenshot.

**Attempts and gaps.** Baseline source assertions expected retired setup wiring
and timers. The old motion test measured the whole row, now including Schedule;
it now measures the animated copy against its actual minimum. The extended
reload fixture needed to clear Week's hash before reloading Today. These were
test corrections; no layout or motion code changed. Sandbox loopback denial
and generated-directory EPERM required approved outside-sandbox runs. Existing
ResizeObserver notices persist. Physical phones, true contention, hosted
template acceptance, original Effort-draft diagnosis and earlier operational
gaps remain unverified. Migration 004 remains unapplied; writing activation is off.

**Invariants and records.** Reference Note/Thoughts/Habit/Protocol frames remain
648px with 24px foreheads at 360/390px; the matrix also covers 416px. Long frames
grow without nested scrolling. Shared tokens, old versions, data ownership,
Circle-day rules and publication/sync behavior are untouched. No measured
performance optimization was justified. Current Task is one job; its prior
snapshot is archived. Journey/bug/work-plan records reflect the resolved source
test gap; previous dated evidence below remains historical.

**Next.** Developer reviews local Routine opening, completed Habit editing/Undo,
Record and Protocol. Further cleanup needs another bounded proposal. Existing
template review and separately approved hosted acceptance remain pending.

## Explicit Protocol Start and footer spacing — 2026-11-14

**Approval/Git.** Developer approved measured spacing, Preview label and immediate Start adoption in the signed-in published reader, with disabled Admin Start, safe retry and existing-phase protection. main/6a09b62; prior modified/untracked work preserved. No staging, commit, hosted migration, publication or deployment.

**Implemented.** Removed the legacy 8px button margin that pushed the visible footer rim too close to the border. Preview is now the label. Start creates an active personal phase through existing domain actions, saves source ID/version, confirmed resolved items and answered configuration/reflection snapshots, and navigates only after local save acknowledgement. Skipped optional reflections create no evidence. Existing active/draft phases offer Open Protocol; Day One remains required. Stable account/session pending-operation IDs prevent duplicate retries and historical ID collisions. Account-scoped Web Lock plus latest stored state check guard Start; unavailable locks fail safely. Account changes invalidate loaded template responses. Failed saves retain the mounted preview and reusable Start button. Adopted terms stay fixed; name editing and End remain available.

**Verification.** Final production webpack build/TypeScript and focused lint pass. Adoption/model/route/SQL 16/16; production-CSS template 10/10; account-scope/final-reader follow-up 3/3 (overlaps); adopted real Protocol/live toggle/reload and shared matrix/geometry 7/7. Tests cover 24px inner bottom inset at 360/390/416, all durations, disabled Admin Start, disk failure/retry, one saved phase, source/reflection snapshots, reload/conflict protection, account change and real phase completion/name/ending access. Reference frames remain 648px with 24px foreheads.

**Attempts/gaps.** Initial spacing measured 17px outer instead of 25px; margin fix passes. The failure test exposed Start's committed button lifecycle; keepMountedOnSuccess restores retry. The first Day One fixture raced account loading; valid chapter fixture now waits for ready UI. Expected synthetic save errors and existing ResizeObserver notifications are retained as such. True tab contention, physical phones, hosted template acceptance and the original Effort-draft diagnosis remain unverified. Migration 004 stays unapplied. No cloud sync or AI integration was activated; no broad optimization justified.

**Next.** Review Preview/disabled Start in local Admin. Real published use requires separately reviewed hosted template acceptance.

## Faithful Protocol template preview — 2026-11-14

**Approval/Git.** Developer approved the reviewed two-step preview, fixed terms and unsupported cue/result warnings. main/6a09b62; all prior modified/untracked work preserved; no stage, commit, publication, migration or deployment.

**Implemented.** ProtocolPage has an opt-in preview presentation: read-only name/terms during setup, live duration choices, Preview N days, read-only running Page and Day 1 of selected duration. Back retains selection. Completion is disabled; live history/edit/end/seal actions are absent. Template preview reuses this rendering rather than Routine rows. Existing cue/result fields stay saved/editable with Admin warning. Agreement wording uses authored action/target/unit/effort slots.

**Verification.** Final production webpack build/TypeScript and focused lint pass. Production-CSS template selection 8/8; expanded Protocol journey exercises five durations at 360/390/416, Back retention, disabled completion, hidden live controls, 28px/700 phase name, 18px/700 labels, 24px header-to-heading gap, reload and empty saved evidence. Live Protocol toggle/reload and shared matrix/geometry 6/6 pass; reference Note/Thoughts/Habit/Protocol remain 648px/24px. Screenshot review caught a later glass prose rule overriding preview weights; moving the scoped rules after it passed rechecks. Shared resize must settle before screenshots.

**Gaps/next.** Review Protocol templates at localhost:3012. No physical-phone, adoption or hosted template acceptance claimed. Original Effort-draft origin remains untraced; migration 004 remains unapplied. Existing ResizeObserver notification appeared in the live audit; no resolution claimed. No broad optimization justified; evidence/version/sync invariants unchanged.

## Template cover and bounded AM/PM — 2026-11-14

Developer approved the reviewed correction. AM/PM now renders one AM and one PM, stopping at either end; only Hour/Minute wrap. Template cover rendering reuses PageLayout, the existing chapter advance engine and RoutineSwipeCue labelled Begin ›. Heading 28px/700, body 18px/400, 24px anchors/gaps, unrestricted title width; other Chapter covers remain unchanged.

Final Next webpack build/TypeScript and focused lint pass. Production-CSS template selection 8/8; expanded cover keyboard/tap/swipe paths 3/3 at 360/390/416px. Cover screenshots inspected; measured heading top/left 25px from outer edge (24px inner), body gap 24px, cue target at least 44px. Shared geometry references remain 648px/24px. Initial shared matrix had an unrelated Week History animation-timing assertion at 390px; isolated recheck is recorded in the journey entry.

main/6a09b62, all prior modified/untracked work preserved; nothing staged/committed/published. Review server restarted on 3012. No evidence, stored definitions, adoption, migration or sync behavior changed. No broad optimization justified. Developer reviews cover and two-entry AM/PM; physical phones and the original Effort draft's precise “evening” origin remain unverified. Earlier snapshots below retain evidence.

## Effort removal and independent time wheels — 2026-11-14

**Approval/Git.** Developer explicitly approved the reviewed follow-up. main/6a09b62, preserving all prior modified/untracked work; no stage, commit, push, migration or deployment.

**Implemented.** Remove effort resets the entire setting to an empty fixed value, clearing old answer links; output trims whitespace-only Effort and never borrows a cue. Existing authored Effort is preserved until explicitly removed. Routine result previews omit both generated daily schedule sentences and retain the ongoing checkbox. Immediately visible Hour/Minute/AM-PM wheels wrap independently, preserve other columns, and keep 6:00 AM unsaved until explicit selection.

**Verification.** Final Next webpack build/TypeScript and focused lint pass. Model/publication checks 10/10; final production-CSS template journeys 5/5; six-tool consistency/geometry selection 5/5. Checks cover linked “evening” Effort removal/save/reload, blank Add effort and clearing a typed value, independent wheels, click/scroll/keyboard, placeholder selection, Back retention and midnight/minute wraparound, schedule-copy absence and retained checkbox. Screenshot inspected. Note/Thoughts/Habit/Protocol references remain 648px/24px at 360/390; matrix also covers 416px. Review server restarted at localhost:3012.

**Attempts/gaps/next.** The reported original draft was not inspected; its precise source of “evening” remains untraced. Synthetic blank Effort does not reproduce it; an explicitly saved answer link does, and Remove effort clears it durably. Developer should review the original draft and remove unwanted Effort. Physical phones and hosted template acceptance remain open. Type checking caught the JS helper's widened source return type; a proper return annotation fixed it. The initial fixture incorrectly expected Continue after a single choice; it now follows automatic advance. No broad optimization was justified; no personal evidence, chapter versions, shared geometry tokens or sync behavior changed. See the dated journey entry; earlier evidence/gaps remain below.

## Template wheel and authoring clarity — 2026-11-14

**Approval/Git.** Developer approved the concrete three-part proposal in chat. main/6a09b62; all earlier uncommitted work preserved. No staging, commit, push, hosted migration or deployment.

**Implemented.** The full-time wheel is immediately visible, centred on unsaved 6:00 AM with 5:59/6:01 neighbours. Click, scroll and keyboard select explicitly. Editor guidance explains setup questions, output items, optional intermediate previews and automatic final preview. Validation identifies missing wording versus invalid/duplicate internal references by Page number, also beside the Page. Template written/numeric answers use a fading Bone line within the 24px anchors and retain natural growth.

**Verified.** Final Next webpack build/TypeScript and focused lint pass; model/route/SQL checks 9/9; final production-CSS template checks 4/4. Tool consistency and geometry checks 5/5; reference Note/Thoughts/Habit/Protocol frames remain 648px with 24px foreheads at 360/390px; matrix also covers 416px. Wheel and long-answer screenshots inspected. Shared transparent-input and 34ch rules initially hid/shortened the line; scoped form decoration/width fixes pass. Geometry fixture now waits for Page travel to settle. First CSS test attempt ran before build output existed; final runs use completed build CSS.

**Gaps/next.** Physical phone selection/keyboard acceptance and hosted template acceptance remain unverified. Preview answers remain temporary; no personal evidence, adoption or historical definitions changed. No broad optimization justified. Review server restarted on 3012; developer reviews local templates next. Earlier recorded gaps and unapplied migration 004 remain unchanged. Detailed commands are in the dated journey entry.

## Template review corrections — 2026-11-13

**Approval/Git.** Developer approved all seven review items and the Circle picker, then confirmed target versus optional Effort. main/6a09b62 tracks fork/main; earlier uncommitted scheduling/builder work preserved. No staging, commit, push, remote migration or deployment.

**Implemented.** Glass numeric answers use 18px/400, including the mobile !important override. Circle time picker supports scroll/click/keyboard with an unsaved 6:00 AM hint. Read-only Routine previews share PageLayout/header/body/copy with the app; authored target/unit/effort wording slots and optional Effort replace forced word ordering. Generated preview disclaimers/type labels are removed. Routine no longer depends on Habit Building completion; Week's setup gate and stale raw setup pins retire without modifying old definitions, runs or evidence. Explicit old chapter paths remain, with original domain handlers.

**Admin reliability/performance.** Protected routes distinguish 401/403/503. Transient failures retain the mounted editor; access retry recovers the account-owned local draft. Menu lookup starts before opening, deduplicates by AccountScope and reuses confirmed UI visibility; server checks still enforce each operation. Images request a single asset and share reads by stable ID/request scope. Measured synthetic menu request count is one before opening and zero extra on repeat opens; editor/player share one targeted read across draft edits.

**Verified.** Final production webpack build/TypeScript, lint and compiler (33/0) pass. Model/SQL/access/entry selection 33/33; production-CSS Admin suite 17/17; fresh-account preserved unfinished runs, scheduling, cross-tool matrix and growth 6/6. Numeric 18px/400, square completion controls and preview/picker screenshots inspected. Shared reference heights/anchors remain 648px/24px; long content grows naturally. Browser tests cover picker placeholder/keyboard, revoked access versus transient failure, retry recovery and no-evidence preview. Initial font check found the mobile 16px override; the scoped correction passed final checks.

**Gaps/next.** Physical phones/real session revocation and historic network incidents remain untraced; no claim about the developer's internet. Earlier unrelated Habit source assertion and Protocol-history return gap remain. Migration 004 (including wording validation) is local and unapplied; no hosted template publication/adoption. Review server restarted at localhost:3012 using the final build, Admin 200 and signed-out status 401. Developer refreshes/reviews the changes, then separately reviews hosted migration/acceptance. Previous snapshots below are historical evidence.

## Admin template builder and Catalog — 2026-11-13

**Approval/Git.** Developer explicitly approved the bounded local builder, Catalog support, prepared migration, tests and owning/continuity records. main/6a09b62 tracks fork/main (Rickie-fiend/the-circle-os). Prior uncommitted Routine scheduling work is preserved; no stage, commit, push or deployment.

**Implemented.** Shared Admin recovery/Media/Catalog now support separate Routine-group and fixed-task Protocol template definitions. Author reorderable/duplicable text/image/question/preview Pages and item groups; numeric questions, configuration/reflection purposes, fixed/direct-answer/choice/bounded linear value settings. The existing player gains optional numeric/image-placement fields and caller-supplied preview bodies; published old content is untouched. Admin and signed-in exact-version previews keep answers transient and create no personal records. Group 21-day/ongoing and existing phase durations are previews only. Adoption, saved personal reflections and Circle-origin marks remain the next slice.

**Database.** Migration 004 is prepared locally, NOT applied remotely. It adds template kinds and transactional immutable publication, source/type checks, image references and RPC validation. The original Chapter/Article publisher is an owner-only delegate. Applied hosted 001/002/003 must not be reapplied. No real authored template was published.

**Checks.** Production webpack build/TypeScript, focused lint and compiler (33/0) pass. Template/old Admin/Catalog model/SQL/route selection 20/20; compiled-CSS Admin browser suite 14/14; scheduling/tool matrix/long growth 5/5. Tests cover numeric/choice rules, permissions, retries, old versions, media access, withdrawal, unsaved recovery, Page reordering, image placement, publishing identity and no-evidence previews. Screenshot review corrected checkbox dimensions and action opacity. Fixture selector labels/navigation and UTF-8 responses were repaired. No measured optimization justified. Journey record holds commands and final results.

**Invariants/gaps/next.** Shared minimum/motion tokens unchanged: empty reference tools 648px/24px at 360/390/416px; long content grows without nested scrolling. Existing glass Chapter cover 704px with 24px inner anchors. Physical phones, hosted template acceptance, contention and backup/restore remain open, as do the earlier Habit source assertion and unrelated Protocol-history return check. Developer reviews the local builder and migration 004, then separately approves hosted migration/acceptance. Earlier snapshots below retain historical evidence.

## Routine scheduling — 2026-11-13

**Approval/Git.** Developer explicitly approved standalone Routine scheduling, focused tests and listed documentation. Started clean on main/6a09b62 tracking fork/main (Rickie-fiend/the-circle-os); no staging, commit or deployment this session.

**Implemented.** Shared schedule logic and accessible collapsed controls support Once, finite daily periods and ongoing daily repetition. Choices take effect today; finite end dates are inclusive Circle days. Unfinished once stays pending. Clear stops future occurrences without deleting history. Legacy defaults and Week-linked steps remain unchanged. Repeat tasks use dated completion/wording and explicit Undo records that survive normalization, reload and the existing merge. Templates and personalization remain planned; confirmed choices are recorded in Content Admin plan.

**Verification/gaps.** Final production webpack build/TypeScript and focused ESLint pass. New scheduling cases 4/4; combined Habit/Week/schedule cases 30/31 with the existing Habit source-regex failure. Final compiled-CSS browser selection passes 5/5: new schedule/reload journey, tool matrix at 360/390/416 and long growth. Screenshot inspected. Empty reference tool height 648px, anchor 24px; long Habit/Protocol grow without nested scrolling. A broader Routine/Protocol journey failed on visibility when returning from Protocol history; baseline attribution is unresolved. Physical phones and hosted other-domain sync remain unverified. No measured optimization justified.

**Next.** Developer reviews standalone Schedule controls; prepare a separately reviewed Admin template-builder scope. No current data was edited by hand. See journey evidence for commands. Earlier catalog snapshots below are retained historical evidence.

**Additional final checks.** Core model/schedule/Week selection passes 75/75. Expanded production-CSS schedule case passes 1/1 with invalid-duration and Record Undo coverage. Its initial failure navigated before Undo delivery; the fixture now waits for saved state before Back. No product fix was needed for that sequence.


## Hosted catalog acceptance — 2026-11-12

**Approval/Git.** Developer approved extending the runner and hosted synthetic
testing/cleanup after reporting successful manual migration 003 application.
main/9f2425f, all pre-existing changes preserved; no staging/commit/deployment.

**Prepared.** Catalog publishing snapshots saved online drafts with revision
checks, next-version confirmation and durable account/tab pending operations.
Transactional SQL preserves versions/images and withdrawal state; exact links
remain readable by verified signed-in accounts. Restore is explicit. Reader
images use targeted caller-token signing. New Chapter links preview without
saving evidence or bypassing delivery budgets; unfinished runs use the local
engine and completed runs cannot be rewritten by the reader. Reflect resolves
exact definitions. Article IDs use draft identity. Bundled chapter IDs remain
reserved at the application boundary; legacy import is separate.

**Checks.** 11 focused SQL/route cases pass. Production webpack build/TypeScript
pass. Original 9 Admin cases pass with production CSS. Added Article reload/image
retry and Chapter preview/no-evidence checks pass. A fixture query-routing bug
and incorrect test region-role assumption were corrected. Compiler: 33 sources/
0 quests. No shared geometry tokens changed; no optimization was justified.

**Hosted result.** The extended script with --write --app --catalog passes 62
functional checks using real Supabase and isolated production Next HTTP handlers.
Chapter v1/v2 immutability, Article reading, reader-image access, signed-out denial,
retry/conflict, withdrawal/restore and grant removal pass. Exact cleanup and
absence checks pass for both accounts, drafts, versions/references, image and
receipts. No real authored content was published. Syntax/lint, 3 focused local
cases and diff checks pass. Sandbox fetch denial required approved execution
outside the sandbox. See the dated journey entry for details.

**Gaps/next.** Migration 003 is operationally verified; never reapply 001/002/003.
Added existing-run reload and
exact-definition resolution pass, as do Article reload/image retry and new Chapter
preview/no-evidence checks (12 distinct browser cases across selections). Full
Reflect presentation, real URL expiry/contention, second invitation and physical
phones, backup/restore and true contention remain open. Next review the local
Catalog publishing flow and choose the first authored item; deployment remains
separate. No product code/migration was changed in this verification pass.
Nothing authored
was published and writing activation is unchanged. See journey evidence.

## Previous editor snapshot (retained evidence)

## New glass Chapters and Articles — 2026-11-11

**Approved follow-up.** Developer approved cover-first Article ordering in both
editor and reading preview: cover image, title, summary, body. article-editor.tsx
and its focused browser case changed. Explicit Summary accessible labeling fixes
a filled/reloaded textarea lookup found by that case. Final production build with
TypeScript, focused lint and compiled-CSS order/save/reload journey pass (1/1).
Screenshot inspected; local preview restarted from the final build at port 3012,
Admin HTTP 200. No shared CSS, chapter data, publication or deployment changed.

**Approval/Git.** Developer confirmed Media review and explicitly approved the
reviewed editor/images proposal with glass only for newly created Chapters and
Articles. main/9f2425f; all pre-existing Admin changes preserved. No staging,
commit, push, hosted migration or deployment.

**Implemented.** New blank/template chapters and independent copies persist
designVersion glass-v1. Unmarked chapters, saved drafts, published versions and
existing-version edits retain their appearance. Shared ChapterPlayer gates the
new glass styling; schema, validation and Markdown preserve design and image
references. Image picking uses the existing private Media library, alt text,
optional captions and signed previews with refresh/retry. Articles use the same
account/tab draft/recovery protocol through a separate typed envelope and editor:
title, summary, cover and movable heading/paragraph/image blocks. Preview is
read-only and uses the glass design. Account Chapter lists filter Article drafts.
Article form changes lock during save; invalid required image descriptions block
save. Published catalog operations remain disconnected.

**Verification.** Next production build with TypeScript and focused ESLint pass.
23 focused model/SQL/route tests pass; compiler check passes 33 sources/0 quests.
Compiled-CSS Admin suite passes 8/8 and geometry/tool/legacy chapter checks 7/7.
The final glass-only cover anchor fix was rebuilt and its new-content browser
journey rechecked: text begins 25px from outer top/left (24px within the border),
704px frame at 390x900. Prior reference tools measure 648px/24px at 360/390px.
Screenshots were inspected. Exact commands and attempts are in
[evidence](USER_JOURNEY_TESTING.md#new-glass-chapters-and-articles---2026-11-11).

**Attempts/gaps.** Sandbox browser loopback denial and stalled CSS-worker build
required outside-sandbox execution. Browser review corrected an ambiguous
textarea label, field styling and inherited old-cover top spacing. No broad
suite, physical phone, new hosted Article save/upload, true concurrency or
signed-link-expiry acceptance is claimed. Existing access/session/recovery and
backup gaps remain in [setup](CONTENT_ADMIN_SETUP.md). Both hosted migrations
are already applied; never reapply them. Second invitation verification remains
manual. Media has developer review; new editor/device acceptance remains open.

**Invariants/records.** Existing published JSON and chapter answers/runs are
untouched. Glass uses shared tokens with scoped selectors. No Circle-day,
personal evidence, reading edition, budget, shared tool token or writing
activation changed. Design, Page standard, decision log, plan and current task
record the approved boundary. No measured optimization was justified.

**Next.** Review the new local editor and previews; prepare the separate catalog
publishing/read-access/withdrawal proposal. No authored publication is authorized.
