# Current task

## Durable hosted reload recovery - 2026-11-06

Approved recovery harness implemented with a separate account-scoped IndexedDB
test database, explicit start/continue/reload checkpoints and the existing models,
transaction engine, coordinator and authenticated transport. Personal writing
storage, SQL and real-sync configuration remain unchanged.

Both confirmed hosted accounts passed five full-reload transitions plus a final
completion reload: pending save, upload reply loss, queued choice, choice reply
loss, newer-edit/history recovery and queued permanent deletion. All three durable
synthetic devices and replay snapshots were scrubbed. Read-only hosted audit:
two terminal version-7 heads, four scrubbed archives, ten body-free receipts and
no retained conflict bodies. Four final isolated Chromium cases (360/390px,
offline save, HTTP loss, account separation/late reply), targeted lint and the
production Next build including TypeScript passed. See
[full evidence](USER_JOURNEY_TESTING.md#durable-hosted-reload-recovery-2026-11-06)
and [contract/limits](ACCOUNT_WRITING_SYNC.md#durable-hosted-reload-recovery---2026-11-06).

Real sync stays disabled. No migration, environment change, import, stage, commit
or deployment. Prior 20 modified tracked paths and untracked `debug.log` preserved
on `paing-branch` at `d841643`; the two new harness/test files are untracked.
This proves durable separate-test-store recovery, not production-store/phone,
cold browser restart, offline page load or eviction recovery. Hosted unconfirmed/
expired/revoked valid sessions, true lock contention and backup/retention remain
open. Next: review a bounded hosted-session test scope; activation stays separate.

## Follow-up migration and hosted resolution checks - 2026-11-06

Approved follow-up applied to `gcqmblrkpfvjnewzdycj`; seven catalog checks passed,
including exact function-body hashes, RLS/grants and deletion trigger. Extended
the development-only harness and verified both confirmed hosted accounts:
local/cloud conflicts, stale reviews, exact/changed retries, response-loss recovery
with newer work, retained histories, reciprocal account isolation and terminal
deletion/replay suppression. Both cleanup rechecks passed. Final hosted audit:
four terminal heads, six scrubbed archives, two scrubbed conflict candidates and
26 body-free receipts. Synthetic bodies are deleted; test accounts remain.

36/36 focused local tests passed; the final reciprocal recheck refinement passed
3/3 affected harness tests, targeted lint and the production Next build including
TypeScript. See [full evidence and limits](USER_JOURNEY_TESTING.md#follow-up-migration-and-hosted-resolution-checks-2026-11-06)
and [current writing contract](ACCOUNT_WRITING_SYNC.md#follow-up-migration-and-hosted-resolution-checks---2026-11-06).

Real sync remains explicitly disabled. No original-migration/environment change,
personal import, staging, commit or deployment. Prior uncommitted UI/docs/tests
and `debug.log` preserved on `paing-branch` at `d841643`. Older statements that
the follow-up is unapplied predate this evidence; they do not authorize activation.
Hosted unconfirmed/expired/revoked sessions, actual-device/IndexedDB recovery,
lock contention, backup/retention and broader beta gaps remain unverified.
Next: review those remaining gates before separately reviewing activation.

## This note label clarification - 2026-11-06

Developer clarified the stale-copy report involved New Note, a separate entry.
Actual-editor reproduction on the original note worked. Approved rename:
Current note → This note in Saved copies and its history control. Both 360/390px
affected browser cases and the production Next build including types passed.
Prior UI changes remain uncommitted at `d841643`; no geometry or data rules
changed. Next: review/apply the follow-up resolution SQL and verify its two new
RPCs against hosted test accounts before separately reviewing activation.

## Latest saved note and writing scrollbars - 2026-11-06

Approved fix implemented: Saved copies includes the current Note above retained
Cloud/Device snapshots. Current-note history follows later ledger saves; old
snapshots stay unchanged. New notes remain visible in ordinary History. All
bounded writing Pages hide scrollbar chrome while retaining actual scrolling.

15/15 writing-sync browser cases, five focused Note/History/Trash/geometry cases,
targeted lint and production Next build including types passed. Normal review
server restarted with that build at port 3000; `/os` returned HTTP 200. Inspected
390px History capture. Four resting frames remain 346px with 48px header gaps.
No schema, hosted SQL/configuration, activation, import or deployment change.
Work remains uncommitted at `d841643`; preceding UI edits and `debug.log` preserved.
Next: developer review on the refreshed normal app/demo, then separately review
the hosted migration and remaining sync/beta gates.

## Conditional Sync controls - 2026-11-06

Approved UI scope implemented: History shows Sync only for pending saved work,
unresolved copies or recoverable errors. Draft-only, cloud-off without errors,
empty and completed states hide it. Try again is error-only and hides during
retry/recovery. Saved copies on each owning Note History row keeps retained
histories readable when Sync is absent; normal row opening still edits.

14/14 browser checks and the additional empty/draft-only/pending/completed-state
case passed. Final targeted lint and Next production build including types
passed. No geometry/type/gap tokens changed; no new measurements claimed.
Prior uncommitted comparison changes and `debug.log` preserved on `paing-branch`
at `d841643`. No staging, commit, push, remote SQL/configuration, activation or
deployment. Next: developer review in the refreshed demo, then separately
review the follow-up hosted migration/checks. Broader beta gaps remain open.

## Minimal writing comparison - 2026-11-06

Approved refinement implemented: Cloud/Device plus writing only, hidden scrollbar
chrome with working Body scrolling, copy-tap dated history, and Note's default
CreativeButtons stacked Use Cloud above Use Device. Confirmed success returns
silently to the list; pending/error/retry and changed-copy review remain.
Normal Note History editing and the sync protocol are unchanged.

13/13 browser cases passed, followed by 4/4 final affected cases including long
scrolling and deletion while history is open. Final lint and Next production
build including types passed. Geometry rerun alone passed 2/2: all four frames
346px and header gaps 48px at 360/390px. The initial overlapping geometry run
timed out before fixture initialization; it is not recorded as a geometry defect.
See the latest journey entry. Changes are uncommitted on `paing-branch` at
`d841643`; unrelated `debug.log` retained. No remote SQL/configuration, activation,
commit or deployment. Next: developer review of the updated demo; hosted gates
from the preceding slice remain open.

## Writing sync status and conflict resolution - 2026-11-06

Developer reviewed direct entry and approved this bounded repository slice.
Implemented History → Writing sync, distinct device/waiting/synced/failure
states, comparison of This device and Cloud copy, explicit choice, retained
histories, stale-review protection, durable retries and deletion scrubbing.
Note keeps silent autosave; the global header keeps its existing account menu.
The chosen current revision retains source, Circle attribution and active/Trash
state. A clean Note editor returns to the selected copy; unfinished work stays.

100/100 focused checks, 13/13 isolated browser cases, final 5/5 affected reruns,
2/2 shared geometry cases, targeted lint and final Next production build including
types passed. Note/Thoughts/Habit/Protocol rest at 346px with 48px header gaps at
360px and 390px. See [commands, attempts and limits](USER_JOURNEY_TESTING.md#writing-sync-status-and-conflict-resolution-2026-11-06).

The new resolution SQL migration is prepared and locally tested, **not applied
remotely**. Original migration unchanged; no environment change or activation,
personal import, staging, commit or deployment. Changes remain uncommitted on
`paing-branch` at `df2b397`; existing account-menu/alias work is preserved.
Hosted checks for the two new RPCs, actual devices, backup/retention and broader
sync/beta gaps remain open. Prior Week date-test/ResizeObserver gaps remain.

Next: developer review of the Writing sync view, then separately review applying
the [follow-up migration and hosted checks](ACCOUNT_WRITING_SYNC.md#writing-status-and-conflict-resolution---2026-11-06).
Activation follows its own review; this slice does not certify live cloud sync.

## Account menu and alias greeting - 2026-11-06

Latest font correction: explicit Geist and existing 650 menu-action weight.
Browser platform-font inspection verifies the actual custom Geist face.
Three affected browser cases, two geometry cases and lint pass; menu now
measures 100.89px with equal 24px side spacing. Prior measurements below are
historical. No full build rerun for this CSS correction.

Developer follow-up: use a three-dot header button and compact 192px menu.
The greeting still shows the alias; editing/sign-out behavior stays the same.
Latest spacing correction: the action menu now fits its labels with equal
left/right space; only the alias form keeps 192px. This replaces the fixed
action-menu width above.
Latest checks: three affected browser cases and lint passed. Menu measured
97.25px with 24px spacing on both sides of its longest label. Geometry rerun
passed 2/2 after one intermittent immediate long-Note-growth assertion; no new
full build for this final spacing correction.
Four affected auth/browser cases, both geometry cases, targeted lint and a new
Next production build including types passed after the refinement.

Approved slice implemented: account button in the existing top-right header,
Edit alias/Sign out within its menu, no separate signed-in account row or
header save-status text. Today greets the verified alias, including edits and
offline return, without copying it into profile evidence. Long aliases wrap;
account controls remain reachable during onboarding. Legacy names remain.

18/18 model checks, 13 runnable auth browser cases (two optional production-
origin cases skipped), three affected post-fix reruns, two post-fix geometry
cases, targeted lint and final Next build including types passed. Four resting
frames remain 346px with 48px header gaps. See
[evidence and limits](USER_JOURNEY_TESTING.md#account-header-and-alias-greeting-2026-11-06).

Started clean on `paing-branch`, HEAD `df2b397`; changes are uncommitted and
the two new account modules are untracked. No staging, push, deployment, hosted
account/configuration change or personal import. Hosted/Opera/phone acceptance,
the existing Week date-test/ResizeObserver issues and broader beta gaps remain.

Next: developer review of header placement, alias editing and the greeting on
the affected device, then resume the separately reviewed conflict/status and
sync-readiness work. Earlier entries retain their dated evidence below.

## Direct entry after Day One - 2026-11-06

Approved entry slice implemented: any completed Day One enters the app without
automatic Week/Log setup, weekly review or daily greeting. Unfinished Day One
remains resumable. Explicit Quest/Week/Workshop entry keeps saved progress and
uses the existing setup/review handlers; completing chosen Week setup still
creates its goal, step and phase.

46/46 focused checks, targeted lint and final Next production build including
types passed. All eight actual-component mobile cases passed at 360px
and 390px; see [verification and run limits](USER_JOURNEY_TESTING.md#direct-entry-after-day-one-2026-11-06).
The unrelated Week setup date expectation and existing ResizeObserver warning
remain. Original midweek trigger, hosted sign-in and physical Opera/phone
acceptance are not certified. No geometry/type/gap changes or new measurements.

Branch `paing-branch`, HEAD `ccdbe77`; prior tracked/untracked work preserved,
including concurrent sync-check/hosted-harness files. Nothing staged, committed,
applied remotely, imported or deployed by this slice. Habit/setup state remains
browser-local; a private window does not restore it. Writing sync activation,
hosted access, conflict UI and backup verification remain separate work.

Next: developer review of direct entry and chosen setup/review on the affected
browser, then resume the separately reviewed writing migration/hosted checks.
Earlier entries retain their dated evidence below.

## Hosted account writing checks - 2026-11-06

Developer approved the migration, then the development-only harness and synthetic
two-account checks against `gcqmblrkpfvjnewzdycj`. Migration applied successfully;
eight catalog checks passed. Both confirmed accounts passed authenticated RPC
writing/lifecycle, retry, response-loss/newer-edit and conflict/deletion checks.
Account B could not read A's head/receipts; the same entry ID remained independent
and A's final recheck passed. Anonymous/invalid-JWT requests were denied.
Direct server-side service-role probes returned 403/42501 for all three RPCs.
The dev-server version of that probe fails in request/response handling and still stops;
this limitation is distinct from the passing direct hosted probe.

Final read-only audit: two account-owned terminal heads, both conflict bodies
scrubbed and 16 receipts retained. Test accounts and minimal synthetic metadata
remain. 11/11 focused harness/transport tests, targeted lint and the source-only
Next-target type check passed. No new full build claim; existing generated
`.next/dev` syntax errors prevented the ordinary full type command. See
[evidence and limits](USER_JOURNEY_TESTING.md#hosted-account-writing-checks-2026-11-06).

Writing sync remains off. No app environment change, personal migration,
deployment, staging or commit. Existing work on `paing-branch` at `ccdbe77`
preserved; new harness paths remain untracked. No product geometry changes or
new geometry measurements. Conflict/status UI, real-device recovery, backups,
retention, privileged admin/logs and broader beta gates remain pending.

Next: review the hosted evidence, then agree the conflict/status UI slice before
any user-facing activation. Activation remains separately approved work.

Earlier dated implementation records below retain their original scope;
statements that hosted SQL has not been applied are superseded by this entry.

## Account writing storage and transport - 2026-11-05

Approved repository slice implemented: private Supabase SQL, owner-scoped
access, exact atomic receipts, authenticated transport, initial saved-writing
inventory and safe conflict/deletion handling. Existing account writing and
the local queue remain the foundation. Cloud activation defaults to off through
`NEXT_PUBLIC_CIRCLE_WRITING_SYNC`; no environment or hosted database was changed.

89/89 focused database/model/transport tests and 43/43 Chromium browser checks
passed. The SQL runs in embedded PostgreSQL with synthetic Auth claims; browser
checks use real IndexedDB/HTTP and synthetic authentication. Next production
build including types passed; final checks are recorded in
[the journey evidence](USER_JOURNEY_TESTING.md#account-writing-storage-and-transport-2026-11-05).
No geometry/type/gap changes or new geometry measurements. Prior work preserved
on `paing-branch`, HEAD `ccdbe77`; no staging, commit, import or deployment.

Next: review [the migration and activation guide](ACCOUNT_WRITING_SYNC.md), then
separately approve applying the SQL to the selected Supabase environment and
running hosted two-account/anonymous/JWT checks. Keep activation off until that
evidence and operational limits are reviewed. Conflict-resolution/status UI,
real-device/hosted recovery, other domains, privileged admin access/logs,
backup/retention and personal migration remain open; beta sync is not certified.

Earlier entries retain their dated scope and evidence below.

## Durable local writing sync queue - 2026-11-05

Approved first sync slice implemented and locally verified. Accepted account
writing changes and pending references commit in one IndexedDB transaction.
Drafts stay outside the queue. Clearing/Trash/restore/deletion retain distinct
markers without copied writing bodies. Exact acknowledgement validation retires
only named operations, preserves newer work and rejects old-account callbacks.

75/75 focused model cases and 15/15 browser cases (nine queue/writing checks plus
six additional existing writing regressions), targeted lint and Next production
build including types passed. See [evidence](USER_JOURNEY_TESTING.md#durable-local-writing-sync-queue-2026-11-05).
No UI/geometry tokens changed; no new geometry measurements claimed.

Recorded the developer's read-only Week-review decision and deferrals of past
Habit completion corrections/shared day view across owning plans. Protocol
wording was reviewed by the developer; a real 06:00 device-boundary check is not
independently claimed. Branch `paing-branch`, HEAD `ccdbe77`; previous work
preserved. No staging, commit, database change, import or deployment.

Next: review the account-writing server schema/access policies and authenticated
transport, including initial inventory, conflict receipts and deletion handling.
These are not implemented or approved by the local-queue slice. Cloud sync,
real two-device recovery, backup/retention and broader beta gates remain open.

## Protocol prospective wording - 2026-11-05

Approved slice implemented and locally verified. Term edits, additions and
removals start next Circle day at local 06:00. Today retains its terms and ticks;
the editor shows pending words. Past phases shows wording intervals with their
own counts. Existing seals/IDs remain intact; missing legacy originals stay
explicitly unavailable. Historical phase-name/goal versioning remains separate.

96/96 focused model checks, 8/8 actual-component mobile checks, targeted lint
and Next production build including types passed. Four resting frames remain
346px with 48px header gaps; bounded history/44px Remove targets remain. See
[evidence and limits](USER_JOURNEY_TESTING.md#protocol-prospective-wording-2026-11-05).

Branch `paing-branch`, HEAD `ccdbe77`; prior work preserved. Nothing staged,
committed, deployed, imported or changed remotely. Next: developer phone review
of editing a phase today and reading its terms tomorrow. Physical-device,
hosted, real-sync/concurrent-edit and broader beta gaps remain open. Earlier
records listing all Protocol wording history as pending are superseded only
for this bounded slice.

## Contextual chapter review cleanup - 2026-11-05

Approved cleanup implemented and locally verified. Removed the standalone
Chapter History control and visible version labels. Finished steps and completed
Quests' View history retain saved-answer review. The counter, internal versions,
original questions/answers, setup status and replay guards remain unchanged.
A broader all-chapter archive is deferred.

12/12 focused model cases, 6/6 actual-component mobile cases, targeted lint and
Next production build including types passed. Four resting frames remain 346px
with 48px header gaps. See
[evidence and limits](USER_JOURNEY_TESTING.md#contextual-chapter-review-cleanup-2026-11-05).

Branch `paing-branch`, HEAD `ccdbe77`; existing work preserved. Nothing staged,
committed, deployed, imported or changed remotely. Next: developer phone review
of the cleaner Quest header and contextual reader. Earlier global-entry/version
display instructions below are superseded. Existing ResizeObserver, Week source
test and physical-device/hosted/sync gaps remain; no beta certification.

## Chapter History and Quest setup review - 2026-11-05

Approved History slice and separately approved Quest fixes implemented and
locally verified. Chapter History opens beside the Quest counter; completed
answer-bearing runs keep their original questions, answers, version and date.
Missing originals stay honest. Shared Back returns to the same Quest.

View/Hide works repeatedly. Existing Habit/Log setup and matching saved
declarations/replacement first-use evidence count as Already set up without
inventing answers or a completed run. Finished steps open readers; completed
Quests offer View history. Habit/Log surfaces share readiness and stale Quest
pins cannot reopen completed setup. Other reflection/Week steps require actual
completion; access gates remain unchanged.

51/51 focused model checks, final 6/6 affected mobile cases and 4/4 header/frame
checks passed (overlapping selections). Targeted lint and final production build
including types pass. Four resting frames remain
346px with 48px header gaps. See
[evidence and limits](USER_JOURNEY_TESTING.md#chapter-history-and-quest-setup-review-2026-11-05).

Branch `paing-branch`, starting HEAD `ccdbe77`; prior changes preserved. Nothing
staged, committed, deployed, imported or changed remotely. The developer's
Athena Reading History phone acceptance supersedes its reminder below.
Next: developer phone review of Chapter History, View/Hide and finished/setup
Quest steps. Historical wording, weekly corrections, shared day review and safe
sync remain separately reviewed work. ResizeObserver, prior Week source-test
failures and hosted/device/sync gaps remain; no beta certification.

## Read-only Athena Reading History - 2026-11-05

Approved slice implemented and locally verified. Tap Athena's Reading on its
cover to open locally saved editions newest first, then read an edition's own
cover, three prose parts and publication date. Missing parts/unknown dates stay
honest. Shared Back returns to History then current cover; the four swipe Pages
and current reply flow remain. Browsing changes no records and requests no AI.
The existing 60-edition bound is unchanged; full server paging remains separate.

39/39 focused Athena model checks, 7/7 actual-component mobile browser cases,
targeted lint and Next production build including types passed. Four resting
frames remain 346px with 48px header gaps. See
[evidence and limits](USER_JOURNEY_TESTING.md#read-only-athena-reading-history-2026-11-05).

Branch `paing-branch`, starting HEAD `ccdbe77`; pre-existing work preserved.
Nothing staged, committed, deployed, imported or changed remotely. The developer
confirmed Week History on their phone, superseding its reminder below.
Next: developer phone review of Athena Reading History. Chapter-answer review,
historical Habit/Protocol wording, weekly corrections, shared day view and safe
sync remain separately reviewed work. ResizeObserver, prior Week source-test
failures and hosted/device/sync gaps remain; beta readiness is not certified.

## Read-only Week History - 2026-11-05

Approved slice implemented and locally verified. Tap Week to open past saved
calendar weeks newest first; open a week to read goals/status, linked steps and
dates, and saved review answers/recording time. Shared Back returns to History
then current Week. Missing records stay unavailable, archived steps remain
readable, and browsing never writes or replays chapter outcomes. Current saved
goal/task words are shown; historical wording is not reconstructed.

22/22 focused model checks, 7/7 actual-component mobile browser cases, targeted
lint and Next production build including types passed. Four resting frames
remain 346px with 48px header gaps. See
[checks, attempts and limits](USER_JOURNEY_TESTING.md#read-only-week-history-2026-11-05).

Branch `paing-branch`, starting HEAD `ccdbe77`; all pre-existing changes
preserved. Nothing staged, committed, deployed, imported or changed remotely.
The developer confirmed the preceding past Log editor and caret-only focus on
their phone; its earlier confirmation reminders below are superseded.
Next: developer phone review of Week History. Weekly corrections/versioning,
historical wording, remaining histories/shared day view and safe sync remain
separate reviewed slices. Existing ResizeObserver, two wider Week source-test
failures and other hosted/device/sync gaps remain; no beta certification.

## Past Log text corrections - 2026-11-05

Approved follow-up: removed the orange focus outline only from past-Log
writing fields, keeping the caret and button keyboard focus. Both affected
mobile browser journeys and targeted test lint pass. No sizing/record changes
or new build/geometry claims. See
[focus checks](USER_JOURNEY_TESTING.md#past-log-caret-only-focus-2026-11-05).
Next: device confirmation of the cursor without the orange box.

Approved slice implemented and locally verified. Tap a saved activity/moment
in Log History to edit its words, then Save changes or Cancel. Dates, ranges,
IDs and first-recorded times stay fixed. Actual correction time and exact
before/after words are retained internally. Clearing stores a dated empty
receipt, removes active evidence and resists stale restoration. Stale editors
cannot overwrite newer changes; unchanged saves write nothing.

78/78 focused model/structure checks passed. The broader ten-case browser
selection passed after the clearing fix; the final 6/6 affected cases passed
after the legacy no-op fix. Targeted lint and Next production build pass.
Four resting frames remain 346px with 48px header gaps. See
[evidence, attempts and limits](USER_JOURNEY_TESTING.md#past-log-text-corrections-2026-11-05).

Branch `paing-branch`, HEAD `ccdbe77`; all 22 pre-existing changed tracked and
three untracked paths preserved/refined within scope. No staging, commit,
deployment, personal import or remote changes. The developer confirmed the
preceding Log History on their device. Next: device review of this editor.
Adding missed entries, changing dates/times, safe sync/recovery and broader
history remain separately reviewed work. Physical-device/hosted/sync gaps,
ResizeObserver, grey-input-box confirmation and prior unrelated gaps remain.

## Read-only Log history - 2026-11-05

Approved slice implemented and locally verified. The Log label opens all saved
past days, newest first; opening one reads saved activities/moments and its
assigned date. Shared App-back returns to History then today. Empty generated
days/future plans are excluded; legacy moments remain visible, without routine
suggestions or past-day editors. History reads existing account records and
grows downward. Week remains available from today.

7/7 focused model/structure checks and the final 6/6 actual-component mobile
browser cases passed. Targeted lint and the Next production build are clean.
Four resting frames remain 346px with 48px header gaps; History retains the
48px anchor and 44px controls. See
[checks, attempts and limits](USER_JOURNEY_TESTING.md#read-only-log-history-2026-11-05).

Branch `paing-branch`, starting HEAD `ccdbe77`; all 15 pre-existing changed
paths preserved. No staging, commit, deployment, import or cloud changes.
Next: developer device review of Log History. Past-day editing/correction
times need a separate proposal. Physical-device/hosted/sync checks,
ResizeObserver notifications, grey-input-box confirmation and other prior gaps
remain. The developer confirmed Past phases looks good and reports placeholder,
Continue, Routine idle reset and Reflect swipe concerns resolved in use; this
selection does not independently re-test those reports.

## Tighter past-phase spacing - 2026-11-03

Approved CSS refinement implemented and locally verified. Read-only term rows
no longer reserve a 44px control height or vertical padding. Terms and Remove
use the same 0.65rem gap, measured at 10.39px. Remove keeps a 44x44px target
with its label at the top. Six affected mobile browser cases passed; targeted
test lint and the Next production build passed. Counts, confirmation, scrolling and records retain their
behavior. Four resting frames remain 346px with 48px header gaps. See
[verification](USER_JOURNEY_TESTING.md#tighter-past-phase-spacing-2026-11-03).

Branch `paing-branch`, HEAD `a4cd328`; all 16 already-modified paths are preserved.
Runtime change is scoped CSS only, with existing browser tests and owning records
updated. No shared tokens, personal data, staging, commit or deployment.
Next: developer review of the tighter list on the affected device. Previous
historical-term/device/hosted/sync gaps and grey-input-box confirmation remain.

## Bounded Protocol past phases - 2026-11-03

Approved cleanup implemented and locally verified. Expanded Past phases uses
Note's 480px/60dvh frame ceiling, never below the shared minimum; only Body
scrolls, leaving Header/Footer fixed. Phase titles retain the full days-kept
summary. Individual term counts use `1/7`/`0/7`, without white row dividers.
Different phases retain separation. Running/draft Pages keep natural growth.

82/82 focused model/spacing checks and 10/10 distinct actual-component browser
cases passed; the two affected cases passed again after adding a running-phase
return check. Both production builds passed and targeted lint is clean.
Resting frames remain 346px with 48px
header gaps; long history caps at 400.19px on 360x667 and 480px on 390x844.
See [verification and limits](USER_JOURNEY_TESTING.md#bounded-protocol-past-phases-2026-11-03).

Branch `paing-branch`, HEAD `a4cd328`; 15 existing modified paths preserved,
with DESIGN.md also updated for the explicitly approved history exception.
Nothing staged, committed or deployed. Next: developer review of the cleaned
Past phases on the affected device. Historical term versions, other remaining
bug/device/hosted/sync gaps and the prior input-grey-box confirmation remain
separate. Earlier unbounded-history instructions below are superseded.

## Protocol simplification and input scrollbars - 2026-11-03

The developer approved the input fix and requested removal of Correct last day.
The action, editor, dedicated model write functions and shell wiring are removed.
Finished-phase terms remain read only. Already-saved correction receipts remain
intact through normalization and merge. Both Protocol term inputs hide native
scrollbar chrome while wrapped text grows downward.

120/120 focused model/account/setup/phase checks and 9/9 actual-component browser
cases passed at 360, 390 and 1280px. Both production builds passed after final
cleanup. Targeted lint has no errors and the existing
shell unused-import warning. Resting Note, Deep Thoughts, Habit and Protocol
remain 346px with 48px header gaps. See
[checks and limits](USER_JOURNEY_TESTING.md#protocol-simplification-and-input-scrollbars-2026-11-03).

Branch `paing-branch`, HEAD `a4cd328`; all 15 pre-existing modified paths remain
preserved/refined within the approved scope. Nothing staged, committed or
deployed. The reported grey box was not visible in isolated Chromium: native
scrollbar attribution remains an inference. Next: developer confirmation of
the input in the affected browser. Earlier correction-editor instructions below
are superseded. Past-phase grouping/labels, full term history and the previous
physical-device/hosted/sync and other bug gaps remain separate work.

## Protocol correction protections - 2026-11-03

Approved bounded slice implemented and locally verified. Finished-phase term
rows are read only. `Correct last day` opens the latest completed phase's
scheduled final date, with explicit Save correction, Cancel and Phases back.
Returning keeps Past phases expanded. Draft selections write nothing; accepted
corrections retain before/after completion and seal evidence with actual time.
Required-term changes explicitly unseal; optional changes leave the seal alone.
Repeated/unchanged saves do nothing. Invalid dates, archived targets and stale
edits are rejected. Running-day controls and durations retain their behavior.

123/123 focused model/account/setup/phase checks and 17/17 distinct mobile browser
cases passed. Two affected cases passed again with actual offline saving at
360px. Both production builds, targeted lint (one existing shell warning) and
whitespace checks passed. Four resting frames remain 346px with 48px header gaps;
long correction terms grow naturally without an inner scroller. Exact checks,
attempts and limits are in
[the evidence](USER_JOURNEY_TESTING.md#protocol-correction-protections-2026-11-03).

Branch `paing-branch`, HEAD `a4cd328`. All 11 pre-existing modified paths remain
preserved, with the approved additions reviewable and uncommitted. Nothing
staged, deployed, imported or changed remotely. Bug 16 is partially resolved;
past-phase separation/labels, full term history, other-day corrections, bug 13,
ResizeObserver, legacy placeholder, two recorded Week source assertions and
physical-device/hosted/sync gaps remain. Next: developer use/review of the local
History and explicit Protocol correction flow before another bounded slice.
Earlier snapshots retain their evidence and superseded interaction rules.

## Habit History page and flexible entry - 2026-11-03

Approved refinement implemented and locally verified. Record shows today's
completions/Undo and opens a separate History Page from its top-right label.
Past groups scroll within the shared writing ceiling; Yesterday has no date,
older days do. Dropdown, wording notices and dark divider are removed. Snapshots
and internal provenance remain unchanged.

New habit accepts action, time/location or identity first. A name is required
to save as active; unnamed work stays a hidden recoverable draft, reopened by
New habit after leaving or reload. Routine's editable focus/title is unchanged.

114/114 focused model/account/spacing/setup checks and 11/11 actual-component
mobile cases passed. Both production builds, targeted lint (one existing warning),
whitespace and document checks passed. Details are in
[the evidence](USER_JOURNEY_TESTING.md#habit-history-page-and-flexible-entry-2026-11-03).
Resting App Boxes remain 346px with 48px header gaps. Long History measures
400.19px at 360x667 and 480px at 390x844, with only Body scrolling.

Branch `paing-branch`, starting HEAD `a4cd328`; all 11 pre-existing modified
paths are preserved and refined within scope. Nothing staged, committed or
deployed. Protocol's direct historical toggle, bug 13 color/title, ResizeObserver,
legacy placeholder, two recorded Week source assertions and physical-device/
hosted/sync gaps remain open. Next: developer use/review of the new History and
unordered Habit entry, then a separately reviewed Protocol correction slice.
Earlier snapshots retain historical checks and superseded picker/notices rules.

## Habit dated history - 2026-11-03

Approved slice implemented and locally verified. Record retains today's Undo
and adds Past days, initially Yesterday. New completion snapshots keep text,
action, cue and identity through later edits/archiving. Legacy entries remain
reachable with clear missing-original-wording notices. Past days are read only;
Week's counts and task date/wording rules retain their existing meaning.

101/101 focused model/account checks and 7/7 actual-component mobile browser
cases passed. Both production builds passed. Four resting App Boxes remain
346px with 48px header gaps; real rows grow without inner scrolling. Exact
commands, attempts and remaining limits are in
[the evidence](USER_JOURNEY_TESTING.md#habit-dated-history-2026-11-03).
The developer confirmed the preceding Habit task controls in use. No new
physical-device or hosted history verification is claimed.

Branch `paing-branch`, starting HEAD `a4cd328`, initially clean. Changes remain
uncommitted; nothing staged or deployed. Protocol's direct historical toggle,
bug 13 color/title reports, ResizeObserver warnings and two pre-existing Week
source-assertion failures remain open. Past corrections, full definition history,
task date migration and safe sync remain separate scopes. Next: developer use
of Record's dated history, then review Protocol's deliberate correction flow.
Earlier entries retain their unique evidence and superseded startup Git state.

## Habit task controls - 2026-11-03

Approved fix implemented and locally verified: Add task is available on the
normal Routine Page after Day One v3 without completing Habit Building. Habit
discs/checkmarks match Tasks at 30px and 5x11px, with 44px touch areas. Five
focused mobile browser cases, Next production build and targeted lint passed
(one existing lint warning). Four Apps retain 346px frames and 48px top gaps.
See [evidence and limits](USER_JOURNEY_TESTING.md#habit-task-controls-2026-11-03).
Existing work is preserved; nothing staged, committed or deployed. Next:
developer use/review of the local Habit controls. Earlier records follow.

## Larger editable titles and tighter Page spacing - 2026-11-03

Implemented the developer-approved 29px title/question and 18px content/answer
scale on the named editable surfaces and Chapter previews. Shared label spacing
is 48px; Main-to-Sub and Body-to-Footer use 25px. Note/Deep Thoughts Trash detail
omits “In Trash” and its divider, with a 4px layout gap between Restore and Delete
forever. Touch targets and deletion confirmation remain.

45 distinct actual-component browser cases passed across the broad run and
focused reruns; the final 4/4 includes mobile spacing audits and corrected
button-shell measurements. Seventeen Page states per width measured 48px top
gaps; Note/Deep Thoughts/Habit/Protocol still rest at equal 346px frames.
Next production build, targeted lint and whitespace passed. See
[verification and gaps](USER_JOURNEY_TESTING.md#editable-titles-and-shared-spacing-2026-11-03).
Prior ResizeObserver warnings and physical-device/hosted gaps remain. All
pre-existing work is preserved; nothing staged, committed or deployed. The
development server remains stopped. Next: developer use of the approved sizes
and spacing. Earlier entries retain their historical measurements.


## Balance editable reading typography - 2026-11-03

Implemented the developer-approved 24px main / 18px body scale only on editable
reading surfaces: Note/Deep Thoughts and opened history/trash, Athena replies,
Vision declarations, Week goals/steps, and short/long text Chapter questions
with matching Workshop preview. Only font sizes change. Compact lists and
reading-only pages retain their sizes; weights, spacing and behavior remain.

Verified 43 distinct browser cases across the broad run and focused reruns,
including reading/editing parity, saved writing, History/Trash, Chapter preview,
reading-only exclusions and geometry. The broad run was 40/41; the blocked Note
header case passed in the final 5/5 rerun after the 06:00 new-day splash.
Next production build, targeted lint and whitespace passed. Four resting frames
remain 346px with 80px header gaps at 360/390px. See [the evidence](USER_JOURNEY_TESTING.md#editable-reading-typography-2026-11-03).
Existing resize notifications also occur with the new type rules removed;
physical-device and hosted checks remain separate. Work remains uncommitted;
nothing staged or deployed. Next: developer use of the local font-size changes.

## Quiet Deep Thoughts writing - 2026-11-03

Implemented the developer's request to remove routine saving/sent and
recovered/discarded messages and the Discard draft control from Deep Thoughts.
Draft recovery remains silent; clearing an unfinished answer persists an empty
value. Send/Save changes, Next question and actual error alerts remain.
Four focused actual-component browser journeys passed, including reload,
clearing, delayed acceptance in normal motion and failed-save retry. Targeted
lint and whitespace checks passed. See [the evidence](USER_JOURNEY_TESTING.md#quiet-deep-thoughts-writing-2026-11-03).
Existing uncommitted work remains preserved; no staging, commit or deployment.
Next: developer use of the updated local page. Prior scope and gaps follow.

## Note, Deep Thoughts and managed quotes - 2026-11-03

Status: explicitly approved scope implemented and verified for the bounded
writing/quote scope. Today retains Note first and replaces the ordinary Thoughts
composer with Deep Thoughts. Answers stay visible after Send with Next question.
History/Trash matches Note, preserving source links, older account entries,
unsent recovery, revisions and the existing bounded geometry. The label opens
one managed quote, returning to the same question/answer.

The existing Admin gains Quotes add/remove controls. The developer applied the
Supabase SQL and configured the ignored server-only key. Live public read,
denied public writes, server add/remove and zero temporary rows passed. The
focused model/route suite passed 105/105 and actual-component browser journeys
passed 32/32. Strict types, selected lint (one existing warning), both production
builds and the built Next quote routes against the live catalog passed. Client
asset checks found no configured secret values in 59 files. Exact evidence and
attempts are in [the journey record](USER_JOURNEY_TESTING.md#deep-thoughts-and-managed-quotes-2026-11-03).
Setup is in [Quotes](QUOTES.md); the [current contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1412-note-deep-thoughts-and-quotes---2026-11-03)
supersedes dated ordinary-Thoughts controls below.

Branch `paing-branch`, starting HEAD `2bd8502`, initially clean tracked tree.
All changes remain reviewable and uncommitted. No staging, push, deployment,
personal import or lifestyle sync. The existing Admin navigation resize
notifications also reproduce on the unchanged starting commit; legacy Note
placeholder, physical-device and hosted-session gaps remain separate.

Next: developer use/review of Note, Deep Thoughts and Admin Quotes. Older
snapshots below retain their unique checks and superseded
instructions; they do not grant new scope.

## Bounded Note pages - 2026-11-03

Status: explicitly approved Note-only changes implemented and locally verified.
New Note is in the Note editor Footer and
saves current text before opening a blank Note. History has no New Note action.
Moving a Note to Trash is silent, with restoration still in Trash.

Note, History and Trash grow from the shared minimum to a 480px App Box ceiling,
reduced to 60% of a short dynamic viewport, never below the shared minimum.
Only Body scrolls; Header, Heading and Footer stay in place. At 390x844 the
measured ceiling is 480px; at 360x667 it is 400.19px. Empty/short frames still
measure 346px with the shared 80px header gap. Habit/Protocol grow naturally.
See the [current contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1411-bounded-note-pages---2026-11-03)
and [verification](USER_JOURNEY_TESTING.md#bounded-note-pages-2026-11-03).

Final checks: 23/23 actual-component browser journeys and 35/35 focused model/
account tests passed. Focused lint, strict targeted types and both Vinext/Next
production builds passed. Tests caught and verified fixes for a native textarea
offset and a transient Trash footer gap. The journey record owns attempts,
screenshots, exact commands and limits. No further optimization was justified.

Runtime scope: existing writing Page and scoped CSS, with browser tests and
owning records. Branch `paing-branch`, HEAD `8890fb1`; earlier working-tree work
is preserved. No staging, commit, deployment, store/schema/provider, personal
data or cloud-service change. Physical phones/native keyboards, hosted sessions,
cloud sync and lived acceptance remain separate checks. Next: developer
use/review of bounded writing and histories; migration/sync remain separate.

## Note History controls - 2026-11-03

Status: explicitly approved Note-only controls implemented and locally verified.
The developer approved the proposal with one correction: remove Undo, keeping
restoration in the Trash page. See the
[current contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1410-note-history-controls---2026-11-03)
and [verification](USER_JOURNEY_TESTING.md#note-history-controls-2026-11-03).

NOTE and direct HISTORY align exactly and use matching header typography. Note
has no ellipsis/menu, Versions UI, Undo or routine Saving/Saved on this device
messages. Focused writing keeps the cursor without an orange box. Each local
History row has a separate orange trash-bin button; the Trash page retains
Restore and confirmed Delete forever. Recovery rows save before moving to Trash;
failures/conflicts keep text available. Internal revisions and other writing
controls remain unchanged.

Final checks: 20/20 actual-component UI browser cases and 35/35 focused model/
account tests passed. Focused lint/types and both production builds passed.
At 360px/390px the NOTE/HISTORY text bounds match exactly; all four measured
Apps retain 344px Pages, 346px frames and an 80px header gap. The journey record
owns commands, screenshots, corrected attempts and limits. No additional
performance change was justified.

Branch `paing-branch`, HEAD `8890fb1`; prior uncommitted/untracked work preserved.
No staging, commit, deployment, data import, schema/store/provider or cloud
change. Physical phones/native keyboards, hosted sessions, cloud sync and lived
acceptance remain unverified. Next: developer use/review of the simpler Note
flow; personal migration and safe sync remain separately reviewed. Prior
snapshots below preserve their dated checks and superseded Note controls.

## Note autosave refinement - 2026-11-03

Status: explicitly approved Note-only scope implemented and locally verified.
The developer confirmed autosave after a short typing pause and when leaving;
Thoughts/Deep Thoughts/Athena answers retain Send and their draft workflow.
See the [current contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#149-note-autosave-refinement---2026-11-03)
and [verification](USER_JOURNEY_TESTING.md#note-autosave-refinement-2026-11-03).

Note labels/navigation/text actions use `#E36B37`. The writer has no Save,
Clear, Discard, Drafts or draft messages. Internal recovery remains, with
one-second pause/departure saves, composition handling, newer-typing protection,
failure retry and explicit conflict review. History groups by Circle day with
times, opens Notes for editing, and carries New Note and Trash. Earlier versions,
Undo/Restore and confirmed Delete forever remain. Manually deleting all text
saves an empty version of an existing Note; empty new writing saves no entry.

Final checks: 17/17 actual-component UI browser scenarios, 46/46 account/provider/
storage browser cases and 184/184 focused model cases passed. Selected lint has
no errors; focused strict types and both Vinext/Next production builds passed.
At 360px/390px, empty and short Note/Thoughts/Habit/Protocol frames remain 346px
(344px Page) with the shared 80px header gap; long content grows without an
inner scroll panel. Commands, screenshots, initial timeout and exact limits are
in the journey record. No further measured runtime optimization was justified.

Branch `paing-branch`, HEAD `8890fb1`; earlier uncommitted work is preserved.
No staging, commit, deployment, personal/legacy import or cloud change. Real
phone keyboards, hosted sessions, cloud sync and week-long lived acceptance
remain unverified. Next: developer use/review of this Note flow; personal
migration and safe sync remain separately reviewed. Earlier snapshots below
retain their dated evidence; their manual Note Save/draft controls are superseded.

## Account writing UI - 2026-11-02

Status: explicitly approved C scope implemented and locally verified with
synthetic accounts. Final evidence and boundaries are in
[the journey record](USER_JOURNEY_TESTING.md#account-writing-ui-2026-11-02) and
[section 14.8](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#148-account-writing-ui-delivered---2026-11-02).

Added `app/os/writing-pages.tsx` and `tests/writing.browser.mjs`; connected
Today/Reflect and scoped CSS. Note Save/New Note, Thought/reading-answer Send,
corrections, durable drafts, History, Versions and Trash use the shared local
provider and App Box. Competing edits require review; newer typing survives
Save. Prompts remain placeholders. Existing older writing stays read only.

Checks: 13 actual-UI browser scenarios, 46 provider/account/storage browser
cases and 183 model cases passed. Focused types and both production builds
passed. The selected lint check has one existing shell unused-import warning;
the new UI/test and Reflect have no diagnostics. Mobile geometry is measured
in the journey record. These checks do not certify hosted auth, physical
keyboards/devices, cloud sync or a week of lived use.

Branch `paing-branch`, HEAD `8890fb1`; all prior work preserved. No staging,
commit, deployment, personal import, owner mapping or remote service change.
Next: try the working writing/history flow with synthetic data, then review
any personal migration/cloud slice separately. Neither is authorized here.

The earlier provider snapshot below is retained as dated evidence. Its
then-pending UI review was resolved by the developer's explicit C approval.

## Account-bound writing provider - 2026-11-02

Status: approved provider/read-consumer scope implemented and verified locally
with synthetic data. Writing/history UI (C) awaits its own exact review/approval.

The developer approved the concrete B2 proposal and confirmed continuing.
Scope: new `app/os/writing-provider.tsx` and provider browser harness; writing
store/model/types, compatibility model/types, shell, Deep Thought/first-use
models/types, Reflect and five affected tests; nine owning/continuity/evidence
records. Branch `paing-branch`, HEAD `8890fb1`. Preserved all ten modified tracked
paths and three untracked B1 paths present at startup. Nothing staged, committed,
pushed or deployed; no personal account mapping/import or remote change.

The account-only provider captures session epochs, refreshes after writes and
cross-tab/foreground changes, rejects old input/read/hash results, and exposes
current history/versions/drafts/Trash/evidence. It separates accepted local
writes from read/refresh errors and keeps conflict candidates recoverable.
Old receipts never rebuild deleted writing. Notifications carry no writing.
Deep Thought, first-use and Reflect read the shared view without editable
survey copies; no model runs on saving. Existing writers still use their old paths.

The developer chose to retain minimal question/app-use metadata after permanent
deletion, while removing the answer, versions and drafts. Older missing metadata
stays unknown and cannot reset questions/first use. Received readings remain
unchanged. The [delivered contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#147-account-bound-provider-delivered---2026-11-02)
records the exact behavior, scope and limitations.

Verification and attempts are in [the provider evidence](USER_JOURNEY_TESTING.md#account-bound-writing-provider-2026-11-02).
The focused selection passed 183/183; browser selection passed 46/46, including
16 provider cases and 30 existing/extended storage cases at 390x844/360x844.
Focused lint/strict provider types and both production build targets passed;
the journey record owns exact commands and the corrected build/harness attempts.
Shell lint retains HEAD's nine errors/one warning; Reflect lint passes.

Record audit passed 175 local links including 51 fragments across nine files,
plus format/whitespace checks. The 250-file startup comparison found exactly
25 approved existing-file changes, two additions, 225 unchanged files and no
removals. Prior task/handoff/journey histories remain intact after newline
normalization; pre-existing memory-model/test bytes are unchanged by this slice.

No geometry/type/gap, budget, immutable chapter or received reading changed;
no new geometry measurements are claimed. Physical devices, hosted auth/session,
real import, Supabase evidence sync, backup/complete deletion and live AI quality
remain unverified. Existing placeholder/Sent and Reflect fixture/swipe gaps
remain; Phase 1 is not certified. No measured problem justified optimization.

Next: review C's Note/Thought/reading-answer controls, draft routing, conflict/
failure states and exact files/checks. Reproduce the placeholder path before
affected edits and verify the week-long mobile writing/history walkthrough.
Personal migration, cloud work and deployment remain separately reviewed.
Earlier snapshots below retain their unique evidence and historical next actions.

---

## Writing compatibility and evidence adapter - 2026-11-02

Status: approved adapter/record scope implemented and verified with synthetic
data. The account-bound provider and live writing/history UI remain unapproved.

The developer explicitly approved three new files (`writing-compatibility-model.js`,
its `.d.ts`, and `tests/writing-compatibility.test.mjs`), updates to the memory
model/tests, and eight records: personal-records plan, Decision Log, Product,
beta plan, Work Plan, this task, Session Handoff and journey evidence. Branch
`paing-branch`, starting HEAD `8890fb1`; initial tree clean. No staging, commit,
push, deployment, real account mapping/import or remote-service change.

Delivered a pure read-only adapter over explicitly owned snapshots. Existing
Note fields form one source; original text/IDs/prompts and unknown dates remain
honest. Supplied links prevent double counting or fallback from old snapshots
after Trash/deletion. Current saved versions alone supply writing evidence.
The writing-memory gate checks every dependency's owner, namespace, ID, type
and version, excludes stale/unknown/forgotten sources, and keeps received prose
separate and unchanged. Scoped dependencies survive merges, including invalid
ones needed to reject a whole summary. No AI runs on save.

Recorded the confirmed language scope: simple English UI/Athena responses at
launch, Burmese/English/mixed writing accepted, dual Burmese/English UI/responses
after web launch. A trashed Deep Thought keeps its question answered; its answer
text stays outside evidence. The adapter exposes this metadata, but no live
consumer is connected. Permanent-deletion question/first-use retention still
needs review before activation. Work Plan now reflects the engine/adapter status.

Final verification: 177/177 focused model/compatibility/consumer checks, 29/29
isolated browser-storage checks, two additional browser adapter/store smokes at
390x844/360x844, focused lint, declaration/strict virtual-consumer type checks,
and both Next.js/Vinext production builds passed. Initial 50 focused checks
passed; three added edge checks failed and were fixed before the final run.
Exact commands, attempts and scope limits are in
[the adapter evidence](USER_JOURNEY_TESTING.md#writing-compatibility-and-evidence-adapter-2026-11-02).
The delivered contract is [plan section 14.6](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#146-compatibility-and-evidence-adapter-delivered---2026-11-02).

The eight-record audit passed 155 local links, including 38 heading fragments;
format and `git diff --check` passed with existing LF/CRLF warnings. The
247-file startup comparison found ten approved existing-file changes, three
approved additions, 237 unchanged files and no removals. All prior task/handoff/
decision/journey history was preserved after newline normalization.

No geometry/type/gap, delivery budget, chapter version, authored edition or
personal record changed. No performance optimization was justified. Provider
epoch/freshness, actual editor/history journeys, real import, hosted/device,
Supabase evidence sync, backup/deletion coverage and AI language quality remain
unverified. Existing placeholder/Sent, Reflect fixture/swipe and wider release
gaps remain; Phase 1 is not certified.

Next: review the account-bound provider and its exact files/tests before code.
Require fresh views after writes/cross-tab changes, rejected old-epoch results,
honest failure/status handling, current-state rather than old-receipt rendering,
and Deep Thought/first-use consumers without copied editable writing. UI,
personal migration, cloud work and deployment retain separate approval boundaries.
Earlier snapshots below preserve their unique evidence and historical next actions.

---

## Local writing engine A - 2026-11-02

Status: implemented and verified for the approved synthetic local engine scope.
Live writing/history integration, personal import and cloud work remain unapproved.

The developer explicitly approved five new files: `app/os/writing-model.js`,
`app/os/writing-model.d.ts`, `app/os/writing-store.ts`,
`tests/writing-model.test.mjs` and `tests/writing-storage.browser.mjs`; plus updates
to the personal records plan, this task, handoff and journey evidence. Branch
`paing-branch`, HEAD `f08c117`. The four pre-existing modified documentation
paths remain preserved, including the decision log, which this slice did not edit.
Nothing staged, committed, pushed or deployed.

Delivered the account-scoped IndexedDB ledger, stable sources, separate drafts,
saved versions, starting-day attribution, current/history/evidence selectors,
durable receipts, retry/conflict handling, Trash/Restore and confirmed local
deletion. Newer typing survives an earlier Save; conflicts retain candidates;
session changes reject late work. Untitled is display-only. Invalid storage,
ambiguous timestamps and unsupported timezones fail without resetting records.
The live editor/provider/transport and personal records are untouched.

Final verification: `node --test tests/writing-model.test.mjs tests/account-scope.test.mjs`
passed 33/33; `node --test --test-reporter=tap tests/writing-storage.browser.mjs`
passed 18/18 using isolated Chromium at 390x844/360x844. Focused ESLint across
all five new files and strict targeted TypeScript for the store passed. Initial
31/31 and 15/15 passes preceded three added failing edge checks, fixed before
the final runs. Detailed commands, attempts and limits are in
[the journey record](USER_JOURNEY_TESTING.md#local-writing-engine-2026-11-02);
the delivered contract is in [plan section 14.5](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#145-local-engine-a-delivered---2026-11-02).

Documentation format/link audit passed 88 local links, including 29 fragments,
across five records; `git diff --check` passed with existing LF/CRLF warnings.
Compared with the 242-file startup baseline, only the four approved records
changed, 238 files stayed unchanged and the five approved code/test files were
added. No removals; startup histories and the decision-log bytes are preserved.

No geometry/type/gap, cadence/budget, published chapter/reading or live app state
changed. The 06:00 boundary, DST, local atomicity, retry and account isolation were
checked for A. No full build/app journey, physical phone/other browser, hosted,
sync, backup or real import result is claimed. Local deletion covers only this
new ledger; existing remote/derived copies are B/later work. Existing Note
placeholder/Sent concerns, Reflect fixture/swipe failures, hosted refresh/
revocation/device and broad-tooling gaps remain. Phase 1 is not certified.
No performance optimization was justified or attempted.

Next: review B's compatibility/evidence contract and exact file/test scope,
including unknown legacy dates/ownership, active-source and stale-memory handling,
and rendering current state rather than old receipts. Obtain manual approval
before integration; C's physical controls/draft routing, personal import, SQL/
cloud work and deployment remain separate. Earlier snapshots retain evidence.

---

## Local writing interactions and implementation proposal - 2026-11-02

Status: writing behavior confirmed; four-file documentation update approved.
Documentation completed and checked. No application implementation authorized.

The developer confirmed Untitled for an absent title; saved Note visibility with
New Note; automatic reopening and deliberate discard of recovered drafts;
day-grouped History in the same App Box with Versions; real-writing-only Save
and no version for unchanged content; starting Circle day with separate actual
save time; menu-based Trash/Undo, Trash inside History, Restore and confirmed
Delete forever; shared Thought rules with Send/Save changes and retained question
sources; durable save feedback, failure/retry handling and no automatic draft expiry.

Approved paths: `docs/PERSONAL_RECORDS_AND_ATHENA_PLAN.md`,
`docs/DECISION_LOG.md`, this task and `docs/SESSION_HANDOFF.md`. The plan owns the
[walkthrough](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#55-one-week-walkthrough-for-implementation-review)
and [proposed contracts/files/checks](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#141-proposed-local-contracts).
Technical choices and the A/B/C implementation split remain proposals. The
recommended first code review is A's synthetic local engine; compatibility,
live UI and personal import/activation have later review boundaries.

Branch `paing-branch`, starting HEAD `f08c117`; initial working tree clean.
Preserve prior task/handoff/decision evidence. No code, test, private record,
environment, external runtime file, database or remote service changed. No
runtime invariant or geometry changed; nothing staged, committed or deployed.

Verification: consistency/format review passed; the read-only audit checked 75
local links including 24 heading fragments. Earlier task/handoff/decision entries
remain intact after newline normalization. The 242-file hash comparison found
only these four documents changed and 238 files unchanged, with no additions or
removals. `git diff --check` passed with existing LF/CRLF warnings. No new runtime,
build/lint, browser, chapter, hosted, sync or backup result is claimed.

Source findings: Note still replaces legacy answer values and its blur fallback
can use placeholder text; drafts are in memory and Sent precedes the async local
save. These are source findings requiring runtime checks, not bug fixes.
Reflect fixture/swipe failures, hosted refresh/revocation/cross-device checks,
physical phones/other browsers, broad suite/lint/TypeScript/dependency-audit gaps
and real evidence sync/backup/deletion remain open. Phase 1 is not certified.
Sign-in/loading polish remains an early separate proposal; Day One follows
history/safe sync. No confirmed writing choice needs to be asked again.

Next: review the proposed local contracts and A's exact five code/test files and
synthetic checks, settle dependent engineering questions, and obtain manual code
approval. B/C need compatibility and control-placement review before integration;
owner mapping/import, cloud work and deployment stay separately reviewed.
Earlier snapshots below retain unique evidence and historical next actions.

---

## Plan reconciliation and ordered work queue - 2026-11-02

Status: approved documentation reconciliation and work queue completed and
checked. No application implementation is authorized by this task.

The developer approved resolving the reviewed conflicts and confirmed keeping
Protocol's five current durations: 1, 3, 7, 14 and 21 days. Core flows and sign-in
polish come first; broader visual changes come later.

Added [WORK_PLAN.md](WORK_PLAN.md) as the ordered queue and detailed-plan index.
Aligned beta order, account/hosted status, current versus planned Note saving,
legacy versus requested Athena, shared minimum sizing and hidden Dreamline in
the owning documents. Preserved the detailed plans, bug statuses and all earlier
task/handoff evidence. The new queue does not replace their authorities.

Documentation scope: AGENTS, README, DESIGN, the Page standard, Product,
Architecture, beta plan, Decision Log, Roadmap, this task, Session Handoff and
the new work plan. Branch `paing-branch`, HEAD `a0a96e6`; nine modified tracked
documents and three untracked documents were present at the start. Preserve
their prior work. Nothing staged, committed, pushed or deployed.

Verification: consistency and incremental-diff review completed. A read-only Node
audit passed 377 local links, including 59 heading fragments, across 20 active
Markdown documents. Format checks passed for all 12 edited/new documents,
including the untracked work plan; `git diff --check` passed with existing
LF/CRLF warnings. Snapshot comparison found only the 11 intended existing
documents changed, 230 existing files unchanged and one new work-plan file.
Earlier task/handoff/decision entries remain intact after newline normalization.

No runtime invariant or geometry changed. No new runtime, build/lint, browser,
chapter, hosted, sync or backup result is claimed. The Note placeholder fallback
is a source concern requiring browser reproduction, not a verified fix. Reflect
fixture/swipe failures, hosted refresh/revocation/device checks, broad-check gaps
and real evidence sync/backup/deletion remain unresolved. Bugs 12 and 17 retain
their earlier verified status.

Next: walk through one week of writing/history under the
[personal records plan](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#14-implementation-sequence)
and [work queue](WORK_PLAN.md#start-here). Review source/revision/draft/time and
Save/Send/history/Trash interactions, then present exact local Notes/Thoughts
implementation files and synthetic checks for approval. Reproduce critical
reports before affected code. Early sign-in/loading polish needs its own bounded
UI proposal. Day One follows history/safe sync; migration and deployment remain
separate reviewed work. Earlier snapshots below are historical where superseded.

---

## Day One action setup planning - 2026-11-02

Status: five decisions and documentation scope explicitly approved; plan and
owning-document updates recorded and checked.
No Day One implementation or chapter publication is authorized by this approval.

The developer confirmed: at most one explicitly confirmed task or habit;
completion after confirmation or explicit skip with resumable unfinished progress;
Try once defaults to the current Circle day with another day available, while
Habit asks for a cue; existing completions/commitments/access remain and new
setup is optional for completed users, with old unfinished versions unchanged;
implementation follows personal-record/history and safe sync, before beta.

Added [DAY_ONE_ACTION_PLAN.md](DAY_ONE_ACTION_PLAN.md), including the example,
branches, provenance and confirmation boundary, compatibility audit, delivery
dependencies and acceptance checks. Aligned product, decision log, architecture,
roadmap, beta plan, earlier chapter plan and handoff. The bounded Day One change
is now a beta requirement; broader chapter simplification remains deferred.
Saved answers create no automatic declaration, Protocol, goal or Athena request.
Current V3 stays unchanged pending a new reviewed immutable version.

Branch `paing-branch`, HEAD `a0a96e6`. Preserved the eight modified tracked
documents and two untracked documents present at this pass's start, including
the personal records plan and capability audit. No application, test, environment,
database, private record, external source or remote service changed. Nothing
staged, committed, pushed or deployed. No runtime invariant or geometry changed.

Verification: consistency review completed; a read-only Node audit passed all
102 local links, including 20 heading fragments, across the nine approved
documents. Reversing this pass's patches in memory reproduced the normalized
SHA-256 baselines of all 11 pre-existing documents checked. Whitespace/fences
passed, including the new plan; `git diff --check` passed with existing LF/CRLF
warnings. No new runtime, lint/build, browser, sync or chapter check is claimed.

Exact copy/layout, optional existing-user entry, supplemental-run representation,
task-date fields, confirmation/receipt/recovery contracts and implementation
files remain review work. Source inspection found V3-specific integration and
the basic task record's missing scheduled-day field; neither is fixed here.
Existing hosted/device, Reflect, broad-check and real-sync gaps remain below.

Next: continue Stage 1 of the
[personal records and Athena plan](PERSONAL_RECORDS_AND_ATHENA_PLAN.md): review
source/revision/draft/time contracts and writing/history interaction, then obtain
approval for the exact local implementation. Review Day One code/content scope
after records/history and safe sync; personal migration and deployment remain
separate. Earlier snapshots retain their unique evidence.

---

## Personal records, history and Athena planning - 2026-11-02

Status: approved documentation scope completed and checked.
Implementation has not started. The developer answered five decision batches,
reviewed the proposed scope and explicitly approved the
[complete plan](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) plus targeted updates to
product, architecture, decision log, roadmap, beta plan, earlier Note plan,
this task and handoff. Scope is documentation only.

Confirmed: multiple titled Notes by Circle day; untitled Thoughts; recovered
drafts with Save/Send; drafts outside evidence; App histories plus shared day
review; editable past writing/weekly reviews with earlier versions; prospective
habit/Protocol wording; past-day records/corrections with actual recording time;
old day/timezone retained and new local 06:00 attribution; optional tags and
correctable inferred categories; sourced Wrong/Has changed/Forget controls;
paid requested interpretation/relevant memory updates only. Notes/Thoughts Trash
has no automatic expiry, supports restore/permanent deletion and is excluded
from Athena. Core writing/reading/history/corrections/sync stay free.

Essential histories/corrections across existing tools, safe sync and basic
memory controls are beta requirements. Advanced search/filtering follows later.
The old single-ongoing-Note scope is superseded; its sync safety requirements
remain useful. Exact UI, schemas, technical retention, Forget/deletion semantics,
provider/allowances and personal migration still need bounded implementation review.

Branch `paing-branch`, starting HEAD `a0a96e6`. The pre-existing untracked
capability audit remains unchanged. No application, environment, database,
personal state, external files or remote service changed. Nothing staged,
committed, pushed or deployed. Earlier entries retain unique evidence and are
historical where their next action conflicts with this one.

Verification: consistency review completed; a read-only Node check passed all
95 local links, including 20 heading fragments, across the nine approved
documents. `git diff --check` passed with existing LF/CRLF warnings; the new
plan's whitespace/fences were checked separately. No new runtime, lint/build,
browser, database or restore result is claimed. The audit's
255/256 local-test result and line-ending-sensitive failure remain prior evidence.
Hosted refresh/revocation, Reflect fixture/swipe failures, phones/other browsers,
broad checks and real sync/backup gaps remain open; sign-in UI stays deferred.

Next: review Stage 1's concrete source/revision/draft/time contracts and
writing/history interaction, then propose exact local implementation files and
synthetic tests. Obtain manual approval before code. Personal migration,
provisioning, provider integration and deployment remain separate reviewed work.

---

## Today's Note storage and safe sync planning - 2026-10-31

Status: approved documentation scope completed; implementation not started.
Session closed at the developer's request after following `.handoff-prmopt.md`.
The developer authorized committing all pending repository changes and pushing
the existing `paing-branch` upstream to `fork/paing-branch`; ignored environment
files remain excluded. Git delivery results are reported with the final commit.
The developer approved saving [the bounded plan](NOTE_SYNC_PLAN.md) and updating
architecture, this task, and handoff. Scope is the editable Today's Note first,
with offline local saves, exact cloud acknowledgements, safe retries, explicit
clearing, and person-chosen conflicts. Other writing, database setup, personal
migration, and deployment require separate reviewed scope.

The plan preserves `checkin-note` and current Note behavior; it does not add a
daily archive. It proposes durable local operations, server versions and receipts,
protected current/revision records, multi-tab safeguards, synthetic access and
recovery checks, and a separate existing-account import. Existing reason-grouped
queue/timestamp merge behavior is not sufficient for this proposed protocol.

Login is connected. The prior developer-reported offline journey verifies local
persistence only; Supabase note sync and operational backup remain unimplemented
and unverified. Hosted auth refresh/revocation, physical phones/other browsers,
prior Reflect failures, and wider release gaps remain open. Sign-in UI remains
deferred. Existing uncommitted documentation and `.vscode/` work is preserved.

Checks: reviewed scope and source claims; 39 local links/fragments passed across
the four planning documents, and `git diff --check` passed with existing line-ending
warnings. No runtime tests, database checks, build, migration, or deployment
are claimed. Detailed planning scope and acceptance checks are in the plan.

Next: prepare a bounded implementation proposal with exact SQL/local contracts,
file list, revision/receipt retention, and synthetic access/conflict checks.
Review the conflict/status interaction before dependent UI changes. Obtain
developer approval before implementation. Earlier entries below retain evidence;
their next actions are historical where superseded by this planning task.

---

## Hosted Supabase connection - 2026-10-31

Status: local configuration connected; developer reports successful hosted
sign-in. Sign-in UI/UX changes are deferred at the developer's request.
The developer also reports successful password reset, logout and basic offline
return: an existing note survived offline reload, offline edits remained after
reconnection, and another online reload retained them. This verifies the reported
local persistence journey, not Supabase evidence sync or cloud backup. Remaining
hosted checks, including refresh/revocation and cross-device cases, stay open.
The developer approved project/login setup, local configuration, synthetic
verification and setup evidence, then created the project and supplied public
connection details. Ignored `.env.local` now selects `supabase` instead of `test`.
Restart the server and fully reload to apply. No personal records were migrated.

Hosted read-only checks accepted the publishable key, confirmed email auth and
required email confirmation, and returned an ES256 signing key. Public signup
was initially enabled. After the developer changed settings, a read-only recheck
confirmed public signup disabled, email login enabled and confirmation required.
SMTP, redirect URLs,
templates and real login/recovery/offline journeys remain unverified. Focused
auth tests passed 10/10; no new build/browser result is claimed.

Next: guided dashboard configuration and synthetic hosted verification. Browser
automation stopped because it could not verify Opera's URL; no remote settings
were changed. Migration, sync, membership, Athena and deployment remain separate.
Earlier entries retain historical evidence.

Deferred developer request (2026-10-31): revisit the startup sign-in loading
screen, currently "Opening Circle OS…" / "Checking your sign-in." in
`app/os/auth/auth-boundary.tsx`. The developer requested recording this for later;
replacement wording/design and implementation scope remain undecided. No UI
change is authorized by this note.

Local hosted-auth test address confirmed by the developer:
`http://localhost:3000/os`. Configure Site URL as `http://localhost:3000` and
allow `http://localhost:3000/os/auth/confirm`. Invite/reset templates must use
the fragment-based token-hash links in the architecture instructions. These
dashboard changes are guidance pending developer application and verification.

---

## Development onboarding test mode - 2026-10-31

Status: implemented and locally verified. The developer approved a development-only
mode that skips login/name/age, isolates synthetic data, resumes on reload, and
starts empty through **New test session**. `NEXT_PUBLIC_CIRCLE_AUTH_MODE=test`
enables it only under a development server. Production rejects that setting.
Restart the server and fully reload after changing modes. `.env.local` remains
unchanged; legacy remains the default.

Test mode has a separate selection marker and reuses existing account-specific
state, chapter-cache, pin and provider lifecycle engines. Starting another test
keeps prior test records and leaves real/legacy records and auth markers intact.
No auth/profile-server connection or real data migration is involved.

Checks: 103/103 focused cases, two mobile test-mode cases on each of Vinext and
Next development servers, one actual production rejection case, 11/11 storage
browser cases, and 10/10 auth harness cases passed. The latter suite's two
optional Supabase production cases were skipped in this slice. Both build
targets, Vercel TypeScript and focused lint passed. Detailed commands and early
attempts: [journey record](USER_JOURNEY_TESTING.md#development-onboarding-test-mode---2026-10-31).

Next: developer onboarding use with test mode. Hosted Supabase/SMTP verification,
owner migration, existing Reflect issues, and wider release gates remain open.
All earlier uncommitted work is preserved; nothing staged, committed, pushed or
deployed. Earlier task entries retain their evidence and are historical.

---

## Supabase account entry - 2026-10-31

Status: browser implementation verified locally with synthetic authentication;
hosted Supabase settings and real email delivery remain unverified. Legacy
profile mode stays the default. The owner's profile was not migrated.
Branch `paing-branch`, starting HEAD `e3dcb3e`; this slice is uncommitted.

The developer approved invitations only, email/password entry, verified email,
alias, password reset, persistent login, offline use after a prior online
sign-in, logout, tests, and implementation records. Account mode uses the
existing scoped stores and requires no real name or exact age. A browser
marker alone cannot grant access. Invitation/recovery sessions finish password
entry before evidence opens. The account menu remains usable over onboarding
without unmounting unsaved forms. Worker scope, first-load static caching, and
client claiming/readiness were corrected for the approved offline journey.

Checks: 101/101 focused cases, 12/12 auth browser cases (including two actual
Next production app cases), 11/11 storage and 9/9 legacy Day One browser cases, Next builds in both
auth modes, Vinext build, focused lint, and the Vercel TypeScript configuration
passed. Commands, attempts, and limits:
[journey record](USER_JOURNEY_TESTING.md#supabase-account-entry---2026-10-31).

Next: review project/SMTP setup and synthetic hosted verification using the
[architecture instructions](PRODUCTION_ARCHITECTURE.md#supabase-account-entry-implementation---2026-10-31).
No provisioning, real-data migration, evidence sync, membership, live Athena,
manual lost-email recovery procedure, or deployment was performed. Prior
Reflect and wider release gaps remain open. Earlier entries retain historical
evidence; their next actions are superseded by this entry.

---

## Account-separated storage foundation - 2026-10-31

Status: implemented and verified for the approved storage scope. Supabase login
is not connected. Broader Reflect verification has unresolved failures, described
in the [journey record](USER_JOURNEY_TESTING.md#account-separated-storage---2026-10-31).
Branch `paing-branch`, HEAD `5bc8ccb`; nothing staged, committed, or deployed.

The developer approved scoped main-state storage, private chapter caches, pins,
provider/sync lifecycle protection, direct admin callers, synthetic tests, and
these three continuity records. The shared helper uses JavaScript plus a
TypeScript declaration, matching the existing models and avoiding a TypeScript
runtime import from the JavaScript pin helper.

Accounts use separate browser keys and databases. Changing scope remounts the
app subtree, clears unsaved displayed forms, invalidates old callbacks, and
aborts or rejects pending reads, transactions, and legacy server responses.
Signed-out scope mounts no evidence reader. Account mode cannot use the legacy
profile server. Existing legacy keys, profile credentials, records, and chapter
versions remain in their original location; no account silently claims them.
A localStorage copy accepted before a switch remains under its original owner.

Verification: 91/91 focused tests, 11/11 isolated storage browser cases, both
production builds, the Vercel TypeScript configuration, and focused lint passed.
All nine Day One production browser cases passed. Shell lint retains its
pre-change nine errors and one warning. The combined legacy browser run passed
20/21; a separate core rerun passed 9/12. Failures involved a prepared-memory
fixture reference and initial Reflect swipes. The 360px authored-reading swipe
failure also occurred on a reconstructed pre-change baseline; its cause and
the fixture-reference failure are not resolved. No Reflect fix is claimed.

This is a storage foundation, not authentication, encryption, account provisioning,
or Supabase sync. A future auth adapter must supply verified account ownership
before opening these stores; the browser marker is not an identity credential.
No real profile/day data, external runtime records, or secrets were migrated.
Physical phones, other browsers, real sync acknowledgements, and the prior
standalone TypeScript/broad-suite gaps remain outside this verification.

Next: review a bounded Supabase login/verification/recovery/alias proposal that
wires this boundary to verified sessions. Existing-profile ownership and recovery
must be agreed before migration. Reflect test/fixture diagnosis remains separate
reviewed work and a release verification gap. Further implementation, project
provisioning, migration, and deployment are not approved by this result.
Earlier task entries retain their evidence; their next actions are superseded.

---

## Invited web beta launch plan - 2026-10-31

Status: documentation prepared and approved in scope; implementation not
started. Branch `paing-branch`, HEAD `5bc8ccb`. No staging, commit, provisioning,
migration, or deployment. The developer approved creating the
[launch plan](WEB_BETA_LAUNCH_PLAN.md) and aligning product, roadmap, decisions,
architecture, this task, and the handoff. The developer subsequently approved
the remaining launch-contract batch and clarifications across these same seven
documents, including changed export/release requirements. Pre-existing Day One application,
tests, chapter bundle, planning, and evidence changes remain preserved.

Target: 10-20 invited users mainly in Myanmar and Thailand; web/Home Screen
app, email/password with separate alias, Supabase accounts and safe sync,
manual timed paid access, and limited personalized Athena. This supersedes the
older core-first/Athena-later order. Phase 1 is not certified. Further chapter
simplification and broad optimization are paused; critical data-safety and
blocked launch journeys remain release requirements.

Confirmed reply rule (2026-10-31): Athena replies only when asked. Saving a
reflection or answering her question saves dated evidence without requesting
a reply. Reply requests are separate and subject to the Athena allowance;
saving reflections stays free. Keep that rule in one place so it can change
without rewriting records. The developer approved recording this in the launch
plan, product, architecture, decision log, this task, and handoff. No code is
approved or implemented by this documentation update.

Confirmed reading flow (2026-10-31): a person requests a reading; the requested
reading appears automatically when ready, without a second reveal request.
This does not approve automatic preparation of unrequested readings. The
developer approved recording this clarification in the same six documents;
implementation and technical delivery details remain outside that approval.

Confirmed location and question (2026-10-31): Athena readings live in Reflect.
Each reading includes one optional reflection question; the person may leave
it unanswered. Answering saves a reflection without triggering a reply. The
developer approved recording these choices in the same six documents, with no
code change.

Confirmed post-expiry access (2026-10-31): received Athena readings remain
readable after paid access expires. Expiry stops new generation; core tools,
personal records, and sync stay available. The developer approved recording
this access rule in the same six documents. Admin manually deletes accounts
and their data on request; deleted data may remain in backups for at most
30 days. No user download/export is offered in beta; operational backup/restore
remains required. Deletion turnaround/coverage still need design; no
implementation is approved by these documentation decisions.

Confirmed renewal starting point (2026-10-31): add time from the current expiry
while membership is active, or from the grant time after expiry, preserving
unused paid time. The developer approved recording this in the same six
documents. The developer also confirmed and approved recording four fixed
access durations: 30, 90, 180, and 365 days (2026-10-31). Use explicit day counts,
not calendar months or years; 365 days is not twelve 30-day periods. Month-end
adjustments do not apply. Access expires at the same time of day after the
selected duration, from the agreed starting point, and expiry is displayed in
the person's local timezone (confirmed and approved for documentation
2026-10-31). Timestamp storage and date-calculation details require implementation
review; this is not an implemented membership feature.

Confirmed password recovery (2026-10-31): use a reset link sent to the account's
verified email address. The developer approved recording this in the same six
documents. Manual recovery will also be offered for lost email access
(confirmed and approved for documentation 2026-10-31). Ownership checks and the
manual process, verification/delivery setup, reset-link handling, and
session renewal/revocation and lost-device handling still need review. Login
should last until logout; retained local records must stay account-separated
and inaccessible to signed-out/other-account users. No flow is implemented here.

Confirmed verification requirement (2026-10-31): new users must verify their
email before using their account. The developer approved recording this in the
same six documents. Delivery, link handling, and enforcement require
implementation review and testing; the gate is not yet built.

Confirmed database region (2026-10-31): Singapore. The developer approved
recording the choice in the same six documents. Setup availability and actual
connections from Myanmar and Thailand must be checked before launch. Actual AI
processing location and other transfers must be documented at integration; no project
is provisioned or connectivity verified by this documentation update.

Confirmed request flow (2026-10-31): no separate AI opt-in prompt before
requesting a reading. The person requests it directly. The developer approved
recording this in the same six documents. The developer will explain data use
manually on the website or social pages and warn against sensitive input.
Provider processing needed by Athena is accepted without added privacy
restrictions at this planning stage; actual terms/locations and disclosure
wording/publication still require review. No
interaction is implemented by this documentation update.

Confirmed reading evidence (2026-10-31): Athena may use relevant notes,
reflections, goals, habits, and activity records belonging to the requesting
person. Login and payment details stay out of the AI context. The developer
approved recording this in the same six documents. Exact selection and
exclusion checks require implementation review and verification. Relevant
evidence may come from the person's whole history, for readings and requested
replies. Nothing is
implemented by this documentation update.

Confirmed batch and clarifications (2026-10-31):

- Admin has always-available read-only access to writing. Admin-only error logs
  may contain personal writing. Manual account deletion is a separate power;
  read-access audit details and log retention remain open.
- Readings are short, direct, calm, and advisory. Exact tone/language guidance
  will be configured later. Requested follow-ups have no fixed count limit
  beyond usage and may use all evidence available to Athena for that person.
- Daily resets use Myanmar time. Unused daily allowance carries within the
  person's membership cycle and disappears at its monthly reset; monthly
  allowance does not carry. Failed requests consume no user allowance. Reset
  hour, monthly-cycle calculation, renewal effects, amounts/counting, and
  retry/no-change accounting still need review.
- The person chooses between conflicting edits. The 06:00 Circle day follows
  the person's timezone; exact conflict UI and travel handling need review.
- The developer monitors the beta. Live chapter publishing stays after beta.

Open/deferred: allowance amounts/counting and remaining reset rules, total
spending budget, prices/payment details, owner migration/recovery, supported
devices/browsers, beta duration/success criteria, supported languages and exact
tone/controls, correction behavior, log retention/auditing, deletion
turnaround/coverage, manual recovery proof/procedures, feedback route, and
recovery/rollback instructions. Provider/model is chosen at integration, when
actual processing terms must be documented. No project/API account exists yet
per the developer; these choices do not provision anything.

Acceptance: save a concrete launch sequence and gates, distinguish decisions
from recommendations/current runtime, preserve earlier evidence, check local
links and whitespace. Documentation checks are recorded in the handoff; no
runtime verification is claimed for this pass.

Next: review launch-contract choices and prepare a bounded accounts plus
account-separated local storage implementation proposal. Exact files, migration
ownership rules, and synthetic-user verification must be reviewed before code
changes. Historical tasks below retain their evidence; their next actions are
superseded by this task. No new implementation is approved.

---

## Shorter Day One implementation - 2026-10-31

Status: implemented and verified for the isolated scope. Branch `paing-branch`,
HEAD `5bc8ccb`; no commit, staging, or deployment. The developer approved the
implementation proposal and the small shared-player summary change. Their
correction allows the sole current user to see v3 after an older completion;
this supersedes the plan's earlier proposal to keep completed users out.

Day One v3 asks priority, direction, and an optional action. Answers remain
dated chapter evidence without automatic identity, Habit, Protocol, goal, or
task creation. Its finish Page shows supplied words and returns to the app.
Protocol opens with its existing Start a phase setup. Routine shows its usable
empty view without marking Habit Building complete. Older started runs resume
their original version; older completions still count for access and Week timing.

Verification: 85/85 focused tests and 9/9 mobile Chromium cases passed against
the production Next build. Both Next and Vinext builds passed; chapter validation
checked 33 sources. All 35 previously bundled chapter versions are unchanged.
Details and exact commands: [journey evidence](USER_JOURNEY_TESTING.md#shorter-day-one---2026-10-31).

Remaining gaps: standalone TypeScript still reports `cloudflare:workers` in
`db/index.ts`; shell lint retains the same nine errors and one warning as HEAD.
No broad suite or full lint, real profile-server acknowledgement, physical phone,
or other-browser certification is claimed. Earlier Phase 1 gaps remain open.

Next: developer use and wording review of Day One v3 before selecting another
chapter slice. No further feature work is approved by this result. The planning
and verification records below are retained as historical evidence; their next
actions and claims of implementation not started are superseded by this entry.

---

## Chapter simplification planning - 2026-10-31

Status: plan saved; implementation not started. Branch `paing-branch`, HEAD
`5bc8ccb`. The developer approved documentation only. See the
[full plan](CHAPTER_SIMPLIFICATION_PLAN.md) for onboarding, chapter and Spark
maps, optional paths, unfinished items, Log trial, dependencies, and checks.

Day One now has an exact starting draft and answer-to-record/dependency map in
the plan. The developer confirmed that completing the shorter Day One opens
Protocol, with setup offered when needed if no Protocol exists. Existing users
keep access and records. See the [decision](DECISION_LOG.md#2026-10-31--shorter-day-one-opens-protocol-with-setup-when-needed).

Next: prepare a bounded Day One implementation proposal covering the new
chapter ID/version, source-labelled responses, explicit optional-action choice,
completion outcomes, Protocol empty/setup interaction, and old-run recovery.
Check later setup without the omitted records and all chapter entry points.
Exact storage and interaction details, delivery cadence, draft behavior, and
Log sizing still require review. Existing product/design authorities stay in force.
No chapters, code, data, staging, commits, or deployment are included.

Acceptance: save a reviewable plan, link it here, preserve prior evidence,
and check documentation links and whitespace. Prior completed work follows
as historical evidence; its next action is superseded by this planning task.
Its verification gaps remain open. No runtime tests were rerun.
Original snapshots are archived as CURRENT_TASK_2026-10-31_before-chapter-plan.md
and SESSION_HANDOFF_2026-10-31_before-chapter-plan.md under docs/archive.

---

## Phase 1 verification — saved Habit recovery and Reflect grounding

Date: 2026-10-30. Branch: `paing-branch`; HEAD: `7ffd3b2`.
The developer approved isolated browser checks, focused model checks, and
updates to this task, the handoff, journey evidence, and bug record.
Application fixes require a separate reviewed proposal.

## Scope and acceptance

- Load synthetic already-completed Habit runs with an old starter, no starter,
  or a later manual edit. Verify startup repair where needed, no duplicate
  Habit, preserved answers, and persistence across repeated reloads.
- Save activity through Log, reload, and compare Reflect's empty, derived,
  and authored reading modes with known synthetic evidence. Check local
  arithmetic separately from prepared-content display.
- Use isolated mobile Chromium at 390x844 and 360x844, block external requests,
  preserve personal data and all pre-existing working-tree changes.

## Result

Complete for the approved isolated scope: browser tests 12/12 and focused
model tests 64/64 passed. Targeted test lint passed. No application change
was needed. This closes the saved-state recovery browser gap and adds
fixture-level Reflect evidence coverage; it does not complete Phase 1.

Coverage lives in [the browser test](../tests/core-recovery.browser.mjs);
detailed commands, attempts, outcomes, and limits are in the
[journey record](USER_JOURNEY_TESTING.md#phase-1--saved-habit-recovery-and-reflect-grounding--2026-10-30)
and [current handoff](SESSION_HANDOFF.md).

## Limits and next action

Prepared memory is a synthetic fixture. Actual Athena preparation, external
profile sync, physical phones, other browsers, normal-motion geometry,
and the 06:00 boundary were not certified. No full build, TypeScript check,
broad suite, or full lint was rerun. Earlier failures remain historical gaps.

Next: developer review of this verification evidence, then a separately
scoped proposal for the next unresolved Phase 1 bug or journey.
Character/Six-month Reflect Page design remains separate. No staging,
commit, push, or deployment was requested or performed.

## Prior completed work

Admin page removal is committed in `7ffd3b2`; its
[verification record](archive/SESSION_HANDOFF_2026-10-30_before-continuity-refresh.md#2026-10-30--admin-chapter-page-removal)
and the completed
[interaction-rule task](archive/CURRENT_TASK_2026-10-30_before-continuity-refresh.md)
remain available. This pass did not reverify all earlier work.
