# Circle OS user-journey test record

## Hosted Log sync rehearsal — 2026-11-25

Two isolated 390 × 844 Chromium profiles used a localhost production Next.js
build and disposable Free Supabase in Singapore. The project received the
account-writing prerequisite and Log migrations. Two synthetic accounts used
hosted password sign-in. A separate account started with an empty inventory
and received 403 when it attempted a write for the first account.

The [browser journey](../tests/log-sync.browser.mjs) passed after including the
first-sign-in alias step. It checked an empty Log, offline saves and reload,
exact retry after a dropped server reply, both review choices, Saved copies,
the original time range and pre-06:00 Circle day, a newer clear during review,
a stale upload after clearing, and mismatched ranges. The independent offline
entry appeared once on the other profile. The final hosted database held three
records including one clear, seven receipts, and zero records for the second
account.

`next build --webpack`, focused ESLint, and all 14 tests from `node --test
tests/log-sync-database.test.mjs tests/log-history.test.mjs
tests/log-imprint.test.mjs` passed. The hosted route returned 404 with a missing
or mismatched `CIRCLE_LOG_SYNC_TEST_ORIGIN`. The disposable build and project
were removed, and the project was absent from the Supabase project list.
Physical phones and beta activation remain pending.

## Log sync and conflict choices — 2026-11-24

Two isolated 390px Chromium profiles used a production Next.js build with real
Auth and PostgREST on disposable local Supabase. Activities and moments saved
offline survived reload. A dropped reply retried the exact write without
duplication. Different hours synced independently. When two entries claimed
one hour, the first accepted entry appeared in Log and the other stayed
readable in History. An entry made before 06:00 kept its assigned Circle day
after reopening the same browser storage in a different time zone.

The follow-up checked both conflict choices. Using the device's words kept
the synced ID and timing and wrote a correction. The offline choice survived
reload and a lost reply, and both copies remained under Saved copies. When a
newer clear arrived during a same-entry choice, the app asked for a fresh
review. Keeping the synced copy kept the clear. Different ranges offered only
the synced choice. Stale uploads and a separate account were denied.

[Browser journey](../tests/log-sync.browser.mjs). The production webpack build,
focused lint and 14 tests from `node --test tests/log-sync-database.test.mjs
tests/log-history.test.mjs tests/log-imprint.test.mjs` passed. The 390px
compiled-CSS six-tool matrix and Log correction journey passed on a rerun
after Vite reloaded during the first selection. Shared focused floors measured
648px and content anchors 24px. Existing ResizeObserver notices remained.
Disposable stacks and builds were removed. Hosted Log and phone checks remain
open.

## Chapter sync and conflict choices — 2026-11-23

Two isolated 390px Chromium profiles passed exact-edition resume, offline save
and reader reopen, and exact finish retry after a lost reply. Home kept the
original finish color on both profiles and pulsed on the originating device.
A separate account could neither read nor change the run. The production
Next.js route, Auth and PostgREST ran on disposable local Supabase.

Basic sync also passed on disposable hosted Supabase. Simultaneous writes
produced one accepted revision and one competing copy. The exact finish retry
left one completed run at revision 3 with three receipts. A prerequisite
migration hit a timestamp collision in the migration tracker. Its schema was
verified before the remaining migrations continued. The Free project was
deleted and checked absent. [Hosted browser runner](../tests/catalog-chapter-live.browser.mjs).

The later review flow passed locally. Explore opened the original edition even
when a newer one was listed. Both choices, reload, a lost reply, and a newer edit
were covered. A synced finish stayed read-only and a finish present only on the
device remained readable. Both reviewed copies stayed on that device. The
production webpack build, focused lint, six focused tests and four Chapter
browser checks passed. [Local browser checks](../tests/content-admin.browser.mjs).
Hosted evidence covers basic sync. The later review and deletion have local
evidence.

## Chapter sync account deletion — 2026-11-23

Two isolated 390px Chromium profiles signed into the same synthetic account
through a production Next.js build, local Supabase Auth, and PostgREST. One
profile kept a competing copy, chose the synced answers, then saved its next
answer offline. Before deletion the server held one run and two receipts. The
offline profile held both the reviewed copies and the pending answer.

The local Auth admin deletion reduced that owner's run and receipt counts to
zero. The Chapter sync route denied the old token's read and the captured
pending upload. Reconnecting the offline profile returned it to sign-in.
Explore and the exact-edition review URL stayed behind the sign-in screen.
Recreating the same email produced a new account ID with empty Chapter
inventory, no review link, and a fresh cover. A request from the recreated
account claiming the old owner was denied. The control account's synced run
was identical before and after the deletion.

`node --test tests/chapter-sync-database.test.mjs` passed both tests. Focused
ESLint passed for the database and browser tests. The full-stack rehearsal
invoked [the browser journey](../tests/chapter-sync-deletion.browser.mjs) with
the disposable stack and isolated build helpers from the local backup runner.
The disposable containers, volumes and build were removed and cleanup passed.
This evidence covers account isolation for retained local copies. Physical
phones and hosted backup restoration and retention remain separate checks.

## Published Chapter first start and finish — 2026-11-23

The developer reported that published Chapters restarted and did not end on a
left swipe. The reader had been using temporary preview state unless an exact
run already existed. The earlier hosted check seeded a run before opening the
reader. The developer reported a pass for legacy Chapters on the deployed
site and later reported checking published Chapters. The later report did not
include the build, device, browser or steps.

The production-CSS Chromium selection passed three cases at 390px. The new
journey opened the reader with an empty account, began from the cover, entered
an answer, and forced both device stores to reject the save. The same answer
stayed available and retry succeeded. A version 2 Explore link resumed the
unfinished version 1 run. Reload retained the position, the final left swipe
returned to Explore, and the stored record showed one completion with the
original answer. Home rendered the new color and retained it after reload.
Opening the explicit version 2 link showed version 2. The other cases covered
existing-run reload and an Admin preview that saved no personal run.

`node node_modules/next/dist/bin/next build --webpack` passed. The browser
selection used `CIRCLE_PRODUCTION_CSS=1` and `node --test --test-name-pattern
'published Chapter starts|new Chapter exact-version|existing catalog run'
tests/content-admin.browser.mjs`. The updated hosted runner, deployed app and
physical phones were outside this verification.

## Home Imprint strand renderer — 2026-11-23

The developer reviewed the Home Imprint changes and confirmed they look good.
The focused Node checks passed 22/22 on `602ef9d`. They cover strand growth and
packed artwork coverage, distinct saved days, fading, pulse behavior, account
separation, Chapter finish retry and the Routine, Protocol and Log adapters.

```text
node --test tests/personal-imprint-strands.test.mjs tests/personal-imprint-activity.test.mjs tests/chapter-imprint.test.mjs tests/routine-imprint.test.mjs tests/protocol-imprint.test.mjs tests/log-imprint.test.mjs
```

The browser evidence below records the earlier local and hosted-data runs. The
documentation update added no browser run. The deployed Chapter journey and
physical-phone coverage remain open.

## Hosted catalog Chapter resume and finish — 2026-11-23

An isolated production Next.js build used real Supabase Auth and catalog reads
with writing sync off and the signed-in Imprint review enabled. At 390px in
Chromium, a temporary account with a saved version 1 run resumed on its question
after reload, with the original answer, while version 2 was published. The
normal finish swipe saved one completed run. A reload preserved the completion
and Home rendered its saved contribution. A second account previewed the same
Chapter with an empty run store and unchanged Home artwork. The unsigned
catalog request returned 403.

The real History projection, given the persisted run and both hosted versions,
returned the exact version 1 title, question and answer. The developer confirmed
that standalone catalog Chapters need saved evidence for internal use and future
Athena retrieval. A user-facing History entry is outside this acceptance scope.
The test verified device storage. Server-side Chapter sync and Athena's authorized
access to records for the same account remain future work under the
[evidence contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#athena-evidence-and-user-controls).
The browser used a local production build and hosted data. Physical devices
and the deployed UI remain unverified.

The production webpack build and nine focused catalog, Chapter History and
Imprint tests passed. The hosted runner
`node --env-file=.env.local scripts/check-content-admin-live.mjs --write --app --catalog --chapter-browser`
passed 17 checks before cleanup. Two temporary accounts, the grant, draft,
versions, and operation receipts were removed by exact identity. Absence checks
passed. The first hosted run stopped on an incorrect preview selector and also
confirmed cleanup. No product code, migration or deployment changed.

## Chapter finishes on Home Imprint — 2026-11-22

Two compiled-CSS Chromium cases passed at 390px in the synthetic signed-in
harness. The Chapter case resumes Day One and a bundled published Chapter
from their saved finish Pages. The actual final swipe saves each while
offline, Home pulses twice with one day's growth, and reload shows the
saved color without replay. Forced failures in both local stores leave the
last saved patch intact. The delayed-artwork Home pulse case also passed.
See the [November 23 follow-up](#hosted-catalog-chapter-resume-and-finish--2026-11-23)
for the hosted catalog route. Physical devices remain unverified.

40 focused model tests passed, including the 06:00 boundary, old-run exclusion,
retry age, and preservation of exact-version history. The Chapter compiler
checked 33 sources and zero quests. Focused ESLint and TypeScript passed.
Two other Day One simplification assertions still expect the retired Week
gate and fail independently of this Chapter Imprint change.

## Log blocks on Home Imprint — 2026-11-22

The synthetic signed-in Chromium journey at 390px saves a Log block offline
before its end, enters Home, advances the clock through the boundary, and
observes a single pulse. A later save for an already-ended slot pulses in the
same patch and preserves the first day's age. The journey also checks settled
color on reload, a forced failure of both local stores, removal of a supporting
block and the last block, and word edits without another pulse. The model
checks pin midnight and 06:00 attribution, DST
ambiguity, the shared Week clock, and stale-copy suppression after clearing.

The compiled-CSS selection also verified full-page Log adoption at
360/390/416px, past Log corrections at 360/390px, the Week task Imprint path,
and 360/416px tool matrices and reference geometry at 360/390px. The 390px
matrix missed a Deep Thoughts Trash header animation sample in that selection
and a Protocol draft header animation sample on rerun. It passed in isolation
against the freshly built CSS. The Log-specific and Week Imprint paths
passed both selections. Hosted and physical-phone journeys
remain outside this local evidence.

## Protocol seals on Home Imprint — 2026-11-22

The developer later reported reviewing Protocol and said it worked. The device
and browser were not recorded.

The 390px Chromium case uses the actual Protocol controls, account-scoped local
stores and Home canvas in the synthetic signed-in harness. A term tick alone
leaves the canvas unchanged. A seal while offline colors one patch and pulses on
Home arrival. Reload shows the same settled pixels without a pulse. Undo of a
required term removes the color, and re-sealing returns the same color and
original fade clock. When both local stores reject the next seal, Home stays
empty through reload. Browser networking was restricted to the local harness.

`CIRCLE_TEST_HOSTED_IMPRINT=1 CIRCLE_PRODUCTION_CSS=1 node --test` on the selected
`tests/writing.browser.mjs` cases passed the final eight-case run. It covered the
Protocol seal journey and interaction audit, Routine/Week and delayed Home pulse
regressions, the 390px tool matrix and both geometry checks. The 360px and 416px
tool matrices passed in the earlier run. The first 390px matrix missed a
Deep Thoughts Trash header animation sample and passed on rerun. The earlier
Protocol journey clicked the re-check during its busy state; waiting for the
control to settle allowed the failure and reload checks to run. The shared
Note, Deep Thoughts, Habit and Protocol references measured 648px high with
24px anchors and no nested scroller at 360/390px. Chromium emitted the known
ResizeObserver notification during other tool journeys.

41 focused model tests passed. They include original age after re-sealing,
duplicate acceptance, two seals sharing one day, older untracked seals, required
and optional terms, archive behavior and the 06:00 boundary. The pre-existing
Protocol Footer source assertion also failed before editing. This is local
Chromium evidence. Real phones and the deployed signed-in journey were not tested.

## Local synthetic backup and restore — 2026-11-15

Developer approved the automated local rehearsal, official image downloads,
disposable resources, deletion/interruption diagnostics and listed records.
Added scripts/check-backup-restore.mjs and tests/backup-restore.browser.mjs.
No product runtime, migration-file, hosted-resource, live-sync, commit or deployment
change. Existing working-tree changes and real November 12 backup preserved.

Final command: node scripts/check-backup-restore.mjs --write
(Supabase CLI 3.1.0; Docker engine 29.9.3; local PostgreSQL 17.11.0.011).
The runner creates unique source/target project IDs under outputs, copies only
repository migrations into the source, excludes hosted environment files/variables
and privileged app configuration, and uses generated local identities/keys.
CLI-default published ports are rebound to loopback before fixtures; gateway
certificates are retained in temporary snapshot images and dependent services
restart after DB rebinding. Source/target Auth uses ES256; no private key enters
the browser. Source public/private schema ownership and a synthetic custom role
are restored using the disposable local bootstrap administrator.

Fixtures use real writing models/sync/RPCs: 6 heads, 10 receipts, 1 stored conflict
and 1 resolution; Note revisions, dated empty clearing, Deep Thought source and
Trash are present. Three synthetic Auth users/identities, two immutable article
editions, catalog/media links, receipts and one pixel image are included.
Exact row digests across 16 selected tables compare all restored values without
printing Auth rows. Only auth.users/auth.identities are backed up here, not full
Auth sessions/provider configuration. Media uses a separately hashed 5,632-byte
archive of the actual owned local volume (/mnt), cleared before each restoration;
downloaded pixel bytes must match. This file-backend method is local-specific.

Final run circle-rehearsal-075be178 passes two normal restores. Each includes
exact rows, media hash, same-account login, empty B/anonymous denial and stable
retry preserving writing/receipts. Each restored app run passes 360/390px,
including Note/Deep Thought exact text, clearing, reload and empty B History:
1/1 browser test per restore, 30478ms and 32125ms, with no page errors.
Setup gates are seeded; writing fixture creation uses models/RPCs, not authoring UI.
Build/TypeScript and final focused lint pass. Existing writing/model/transport/
resolution suite passes 69/69 (23866ms). git diff --check passes.

Missing backup and modified digest are rejected. Interruption terminates the
actual import connection after a pre-commit marker; subsequent metadata confirms
rollback. This is a pre-commit SQL transaction failure test, not power-loss or
mid-COPY certification. No incomplete restore is offered to a production reader.

Measured diagnostic FAIL: after backup, a newer Note edit is accepted, an entry
is permanently deleted through the model/sync path, and another Auth account is
deleted. Restoring the older snapshot loses that newer edit and brings back
the deleted entry/account. No independent deletion safeguard was implemented;
the rehearsal intentionally records this open release gate.

Measurements: backup/archive creation 1090ms; SQL import/schema-notification
626ms and 452ms; simulated post-backup loss window 1321ms; cleanup 7967ms.
The data/schema/role SQL artifact is 98,659 bytes. Full run before cleanup is
227661ms including local stacks, build and both browser runs. These tiny-sample
timings are not a production RPO/RTO, media-inclusive restore time or safe
reopen time. The loss window is the scripted scenario, not a chosen backup cadence.

Evidence: outputs/backup-restore-final.log, outputs/backup-restore-result.json
and outputs/backup-restore-focused.log. Earlier iterative failures are in
outputs/backup-restore-run*.log: initial network binding, generated certificates,
stale DB connections, server-conflict fixture, storage path/copy, acknowledged
deletion state and restore role privilege. Those failures were not product fixes
or passes. One earlier successful rehearsal preceded the final measurement change.

All final owned containers/volumes, network, snapshot images, synthetic dumps,
credentials/build directories were removed and absence checked. Official image
caches remain for reuse; no global Docker prune. The owned preflight config was
removed. Historical schema.sql/data.sql hashes still match earlier inspection.
No real backup contents were imported. Phones, provider backups, off-site cadence,
full Auth/session configuration, 30-day retention and deletion replay remain open.
No geometry/type/motion, Circle-day or immutable product content change; no
geometry measurements or broad optimization were needed.

Next: review durable deletion/account-revocation evidence outside the restored
failure domain and the backup cadence/off-site route before an operating recovery
implementation. See [runbook](BACKUP_RESTORE_RUNBOOK.md).

## Hosted recovery diagnostics and repeat acceptance — 2026-11-15

Developer approved test-side diagnostics, isolated accounts per width, fixture
corrections, hosted writes/cleanup and seven records. paing-branch/main at
3d96cb1; ten pre-existing modified files and two untracked recovery files preserved.
No product runtime change, staging, commit, push, deployment or sync activation.

The browser test now uses a fresh A/B pair for each width. Test-only capture
records Send click/submit timing, answer lengths, button/form readiness and local
entry/draft/queue counts on failure; it does not log credentials or answer text.
The first diagnostic run passed Send and recovery but failed opening the restored
Note from History (59980ms). Source inspection shows History can render during
the App Back transition, while another flip is guarded. The fixture now waits
for the Note Page's os-app-flip class to clear before clicking the History row.
Its exact original-content assertion and all recovery assertions remain.

Final complete hosted runs both pass 1/1 with sequential 360/390px journeys:
77294ms and 71815ms. They cover exact accepted entries/versions/source links,
interrupted recovery/retry, deliberate loss of local-only writing, dated empty
Note revision/history after clearing, stale-copy/fresh-store deletion suppression
and empty account B. Deletion construction remains protocol-level, not new UI
deletion certification. Logs: outputs/writing-recovery-diagnostic.log (failed
History attempt), outputs/writing-recovery-diagnostic-second.log and
outputs/writing-recovery-diagnostic-repeat.log (passes).

Commands: node --env-file=.env.local scripts/check-writing-recovery-live.mjs
--write; node --test tests/writing-cloud-database.test.mjs
tests/writing-transport.test.mjs tests/writing-model.test.mjs
tests/writing-sync.test.mjs; node node_modules/eslint/bin/eslint.js
scripts/check-writing-recovery-live.mjs tests/writing-recovery-live.browser.mjs.
Both final disposable webpack builds/TypeScript and final lint pass; focused
tests pass 58/58 (3464ms). Sandbox Node shim failed; installed Node outside the
sandbox completed these checks. Existing multiple-lockfile warning persists.

All ten temporary users across three runs have confirmed 404 absence. Scoped
read-only SQL verifies zero heads/receipts/conflicts/resolutions for each pair.
The earlier intermittent Send failure did not reproduce; its cause remains
unestablished and it is not marked fixed. Diagnostics remain for recurrence.
No geometry/type/motion, immutable content, Circle-day or personal-data change;
no new geometry measurements or measured optimization were needed.

Next: review this bounded result, then separately scope operating backup/restore
and deletion suppression. Live sync stays off; phones remain deferred. These
passes do not certify backups, retention or protection of unsent/local-only work.
Earlier failed snapshots below are historical evidence.

## Hosted production-writing recovery — 2026-11-14

Developer approved the actual production-store hosted recovery proposal, isolated
sync-enabled build and temporary-account writes/cleanup. paing-branch/3d96cb1;
previous ten-file storage-loss work preserved. Two new files:
scripts/check-writing-recovery-live.mjs and tests/writing-recovery-live.browser.mjs.

The runner copies app/public/config into an outputs temporary build, excludes
.env files, passes public Auth config and enables writing sync only in that build.
The secret key reaches only the Node test worker for temporary-account lifecycle,
never the app server or client bundle. Real Auth, writing RPCs, production CSS,
actual account IndexedDB and production runner are used at 360/390px.
Unrelated setup/delivery gates are seeded while unmounted. Writing is authored
through actual Note and Deep Thought UI; no personal data is accessed.

The rehearsal compares accepted entries, stable IDs, original versions and
attribution against server inventory and recovered ledger. It checks an interrupted
restore with RPC requests blocked; retry recovers exact accepted records. A later
unsynced Note edit and unsent answer are deliberately erased and do not return.
Deletion is authored through existing model/queue code and authenticated RPC,
then tested through product recovery using a captured stale ledger and fresh store.
B's inventory/ledger stays empty. Final run adds actual UI clearing, exact server
empty-revision acceptance and fresh-browser restoration of its original history.

Commands (installed Node v24.22.1 on PATH; existing Playwright installation):

~~~powershell
node --env-file=.env.local scripts/check-writing-recovery-live.mjs --write
node --test tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-model.test.mjs tests/writing-sync.test.mjs
node node_modules/eslint/bin/eslint.js scripts/check-writing-recovery-live.mjs tests/writing-recovery-live.browser.mjs
git diff --check
~~~

Model/SQL/transport 58/58 pass (3865ms). Corrected hosted rehearsal passed 1/1,
sequential 360/390px journeys (124846ms); production build/TypeScript and lint pass.
Final clearing-inclusive acceptance is NOT complete. The clearing fixture initially
targeted a new blank composer; it now opens a saved History row and asserts its
exact original content before clearing. An assumed Untitled label failed, so the
fixture now selects an actual writing row with the exact-content assertion kept.
Latest final run (outputs/writing-recovery-live-final-result.log) fails at 360px
waiting 45 seconds for Deep Thought Send to create a saved entry (54916ms total).
The screen still shows the question and Send. There is no established cause:
runtime behavior versus fixture/timing remains unresolved. Clearing, stale-copy
and fresh-account checks are unreached in this final run, even though earlier
pre-clearing selection passed both widths. Retain the failing test. First attempt reached interrupted
recovery but assumed a missing ledger was persisted empty; fixture now accepts
absent storage. Second attempt hit default five-second polling during acceptance;
explicit 45-second network polling fixes the harness. No product runtime changed.
Earlier temporary users were deleted with 404 checks; scoped SQL confirmed zero
heads, receipts, conflicts and resolutions for each completed pair. Final users
also have confirmed 404 absence; scoped SQL verifies final writing-table cleanup.
The local account-ID report contains only generated IDs; no credentials or tokens.

Consulted Supabase changelog and official User Management documentation before
implementation. No relevant SDK/schema change required. Outside-sandbox execution
was approved for junctions, browser launch and hosted network access.

Limits: this proves recovery from surviving accepted server records. It does not
restore damaged/deleted server data, certify backups or 30-day deleted-backup
retention, protect unsent/local-only writing or certify physical devices. Terminal
deletion request construction is protocol-level; no new UI deletion acceptance
is claimed. Live sync remains disabled. No migration, personal import, deployment,
geometry/type/motion change or optimization. Next review diagnostics for the
intermittent Send/fixture boundary; any runtime fix needs separate approval.
Operating backup restore and deletion suppression remain later work.

## Storage loss and recovery — 2026-11-14

Developer approved the tests-and-records proposal. Clean paing-branch/3d96cb1;
product runtime, hosted configuration, migrations and writing activation unchanged.

Production checks use a disposable Next webpack build, production CSS, synthetic
signed Auth and disposable persistent Chromium profiles at 360/390px. Note saves
and unsent Deep Thoughts are made through actual UI; unrelated setup/delivery gates
are seeded. Cases remove localStorage only, all local Auth state only, or all origin
data through Chromium's storage API. These are explicit removal simulations, not
evidence of spontaneous OS/phone eviction.

Store cases delete A's writing database, retaining B's exact ledger and an opaque
older local copy. No old copy becomes a saved writing entry. This is a bounded
store-layer import check, not full compatibility-display or cloud resurrection proof.

Commands use installed Node v24.22.1 on PATH and installed Playwright browsers:

~~~powershell
node scripts/check-writing-offline.mjs
node --test tests/writing-storage.browser.mjs
node --test tests/writing-provider.browser.mjs
node --test tests/supabase-auth.test.mjs
node node_modules/eslint/bin/eslint.js tests/supabase-auth.browser.mjs tests/writing-storage.browser.mjs scripts/check-writing-offline.mjs
git diff --check
~~~

Final production recovery 24/24 (137424ms), store 22/22 (8025ms), provider 16/16
(57951ms), controller/proof 12/12 pass. Final isolated production webpack build
including TypeScript, focused lint after fixture corrections and diff checks pass.
Two unchanged menu typography cases remain outside the runner selection; they
are not counted as passing. Initial selection passed 24/24 with
a small raw-store sentinel for Auth loss; the final fixture was strengthened to
real saved writing and drafts. Intermediate stronger run found setup overlay
timing and a nullable empty-draft fixture assumption. Setup is now seeded while
the app is unmounted, and draft reads handle empty content. A Windows EBUSY during
disposable profile cleanup led to bounded retries after existing path validation.
Default Node shim failed; explicit installed Node resolved it. Sandbox junction
and browser-launch restrictions required approved outside-sandbox execution.

No backups, export feature, sync activation, migration, deployment or personal data
changes. Full origin erasure removes the offline shell and unbacked local writing;
sign-in is not a backup. Phone acceptance remains deferred. No measured optimization
or fresh geometry measurement justified. Logs are local ignored outputs/storage-loss-*.

| Removal/failure | Observed recovery boundary |
| --- | --- |
| localStorage only | Durable Auth permits offline return; saved entries, revisions and drafts match exactly. |
| All Auth state only | Offline entry locks; fresh online sign-in exposes unchanged saved Note and unfinished Deep Thought. |
| A writing database only | A ledger opens empty; B's exact ledger survives. Opaque old local copy is not imported by the writing store. |
| All origin data | Offline navigation fails after cached shell removal; online sign-in leaves writing empty. |
| Temporary storage refusal | Existing store/provider checks reject writes, retain retryable draft/open state and recover after storage works again. |
| Clearing/deletion | Existing crash regression checks clearing; store/provider checks scrub deleted bodies and prevent old receipt state from rendering. Remote/backup resurrection remains unverified. |

Next: review a backup/restore design covering saved records, local-only unsent drafts,
ownership, exact acknowledgements and deletion suppression. No such implementation
is authorized by these tests. The absence of recovery after full removal is a
release-readiness gap, not a defect newly repaired in this slice.

## Durable offline entry and crash recovery — 2026-11-14

Developer approved the implementation proposal. main/6a09b62; previous work
preserved, no stage/commit/deployment/hosted change or sync activation.
New offline-auth-store.ts stores proof or closed state in one IndexedDB row with
strict transaction durability and expected epochs. Adapter/controller/types await
local acceptance before opening/signing out. Offline entry rechecks its epoch
after signature validation. Legacy proof imports only into an absent row after
validation; durable closed state wins. Corrupt restore is denied; fresh sign-in
can first write a closed row. Signature validation and backend authorization are
unchanged; refresh tokens are not added to the new store.

Final production-route recovery selection **18/18**, 72938ms. Both 360/390px
crash journeys finish: saved entries/revisions and unsent drafts match; offline
edits survive; clearing remains empty; untouched empty composer creates no saved
entry; completed offline logout remains locked after crash; B is empty and
returning A has exact writing without duplicate revisions. Service worker serves
offline navigation. localStorage proof may still disappear, while the durable
record successfully restores local entry. That qualifies the earlier blocker.

New browser checks cover valid legacy upgrade, closed-state precedence, stale
epoch publication rejection, corrupt state and refused IndexedDB. Forged-proof
and expired-proof fixtures now modify the authoritative durable record. Existing
password recovery, rejection, late restore, alias and cross-tab cases pass.
Controller/proof tests **12/12**, including waiting for durable invalidation before
network logout and handling its rejection while keeping the screen locked.
Final isolated production webpack build/TypeScript, focused lint and diff checks
pass. No new geometry measurement or optimization justified.

Commands used installed Node v24.22.1 on PATH and the installed Playwright cache:

~~~powershell
node scripts/check-writing-offline.mjs
node --test tests/supabase-auth.test.mjs
node node_modules/eslint/bin/eslint.js app/os/auth/offline-auth-store.ts app/os/auth/supabase-client.ts app/os/auth/auth-controller.js tests/supabase-auth.test.mjs tests/supabase-auth.browser.mjs
git diff --check
~~~

Runner outside-sandbox access was approved. Initial run found the forged fixture
still targeting localStorage and a fresh B database without its writing store;
fixtures were corrected, preserving assertions of identity and empty state.
Logout helper now waits for completed sign-out rather than only the immediately
locked screen. Intermediate selection passed 18/18; final code was rerun after
the epoch recheck and expired durable-proof fixture updates. Existing Next/Vite
lockfile, asset and chunk warnings remain. Two old menu typography cases remain
outside the runner's printed behavior selection, not counted as passing here.
Supabase changelog and official onAuthStateChange reference were consulted; no
SDK dependency or hosted configuration changed.

Limits: synthetic local Auth and desktop Chromium; actual phones remain deferred.
Hosted renewal/revocation evidence predates this runtime change, so new hosted
acceptance is not claimed. OS/storage eviction, backup/restore, wider operations
and activation readiness remain open. No personal records, shared geometry,
Circle-day or immutable-content changes. Next review locally, then choose a
separately reviewed operating-recovery slice. Previous failure history follows.

## Forced browser crash writing recovery — 2026-11-14

### Approved diagnostic follow-up

Developer approved investigation, test corrections and the same six records.
Only tests/supabase-auth.browser.mjs changed further. The helper now passes
offline mode to launchPersistentContext before browser startup, and logs startup
tab paths. The test compares entries and drafts before requiring unlocked UI and
reports only proof-presence/shape/owner-match booleans, logout/password-flow markers
and navigator.onLine. No tokens, keys or credentials are logged.

Final runner result remains **15/17** (57908ms). Both crash cases report one blank
startup tab, offline=true, proof present/parsed/confirmed/owner-matching with token
and keys before crashing, and proof absent afterward. Closed marker is null and
password-flow marker false both times. Exact saved entries (including revisions)
and drafts compare equal at both widths before the restored-answer UI assertion
fails on Welcome back. This establishes writing retention and missing local proof
in this bounded journey. Startup-gap correction does not resolve it. The exact
proof-loss mechanism is still unknown; this does not certify hosted/phone behavior.
Later crash scenarios remain unreached. Earlier uncertainty below is qualified
by this follow-up rather than treated as current evidence.

Same documented runner/lint/diff commands: final isolated production build and
TypeScript pass, focused lint and scoped diff checks pass. Outside-sandbox runner
execution was approved for the dependency junction and local browser. All test
profiles are cleaned. No runner or runtime change was needed in this follow-up;
no measured optimization justified. Next review a concrete product proposal for
durable offline proof with safe logout invalidation, then repeat full crash
acceptance. Product sync stays off, phones remain deferred, prior work preserved;
no staging, commit, deployment, migration or hosted modification.

**Approval/Git.** Developer approved the test-and-six-records proposal. main/6a09b62;
pre-existing modified/untracked work preserved. Only tests/supabase-auth.browser.mjs,
scripts/check-writing-offline.mjs and the six named verification/continuity records
changed. No product runtime, hosted data, migration, deployment or sync activation.

**Implementation.** Existing persistent-profile helper now optionally crashes the
Chromium main process through CDP Browser.crash. Before the command it checks that
the browser command line names exactly its disposable profile under outputs.
Disconnection, rather than a normal close or a crash-command reply, proves exit.
The runner explicitly disables writing sync in its disposable production build.
Synthetic Auth and isolated setup gates remain; this does not verify onboarding.
New 360/390px journeys retain existing normal-restart coverage and add planned
crash/offline edits, clearing, empty composer, logout and account-return checks.
Exact entries/drafts are compared; expected downstream cases remain unreached.

**Final observed result: 15/17 pass, 2 fail.** Production webpack build/TypeScript
and focused lint pass. Both normal-restart writing cases and the existing Auth
selection pass. At both widths a saved Note and unfinished Deep Thought reach
IndexedDB before the crash. Offline navigation after actual browser disconnection
is served by the service worker, but the app shows Welcome back rather than the
writing tools. The first restored-answer assertion fails (textbox absent).
This is a reproducible offline-entry blocker in the synthetic Chromium crash
journey, not proof of writing deletion or of a hosted/phone defect. Stored writing
after the crash and the exact Auth cause have not been established. Subsequent
offline-edit/clearing/empty/logout/account-return crash assertions are unverified.
Failing tests remain enabled; no product correction was authorized in this slice.

Commands used installed Node v24.22.1 on PATH and PLAYWRIGHT_BROWSERS_PATH set to
the installed local ms-playwright cache:

~~~powershell
node scripts/check-writing-offline.mjs
node node_modules/eslint/bin/eslint.js tests/supabase-auth.browser.mjs scripts/check-writing-offline.mjs
git diff --check -- tests/supabase-auth.browser.mjs scripts/check-writing-offline.mjs bugs.md docs/USER_JOURNEY_TESTING.md docs/ACCOUNT_WRITING_SYNC.md docs/PRODUCTION_ARCHITECTURE.md docs/CURRENT_TASK.md docs/SESSION_HANDOFF.md
~~~

**Attempts.** Default Node shim could not find Node; used installed v24.22.1.
Sandbox dependency junction failed; approved outside-sandbox execution followed.
First run stopped at ownership inspection because --enable-automation was absent;
the helper now supplies it. Next run crashed the browser but awaited a command
reply that never arrived. The isolated test worker was stopped after checking its
command line; its residual synthetic profile was removed after checking its exact
resolved path remains under outputs. Waiting for disconnection fixes the harness.
Final run reaches the offline-entry failure at both widths. Existing Next
multiple-lockfile and Vite asset/chunk warnings remain. No optimization justified.

**Next/limits.** Review a focused Auth/offline-proof crash investigation and any
concrete product fix separately, then rerun the entire crash journey. Phone testing
stays deferred. OS eviction, cleared storage, backup/restore and hosted crash
acceptance remain open. Shared geometry/type/motion, Circle day and immutable
content are untouched; no new geometry measurement. Sync remains off.

## Natural session expiry and writing recovery — 2026-11-14

Developer approved the natural-expiry follow-up and explicitly deferred the phone
checklist. main/6a09b62; all pre-existing changes preserved. Extended only the
existing hosted verification runner/test and these six records. No product
runtime, hosted setting, migration, deployment or writing-sync activation change.

`--natural-expiry` selects a bounded 390px journey. The isolated Next production
build uses real public Supabase configuration with writing sync disabled; the
secret stays in the Node test process. Two disposable confirmed accounts are
created. Unrelated synthetic setup gates remain seeded, not onboarding proof.

Final production webpack build/TypeScript and focused lint pass. Final hosted
test **1/1 passes**, taking **3628 seconds** after build. The browser remained
offline for the real server-issued token lifetime (initial wait 3600 seconds),
using the signed JWT exp plus five seconds. No clock, token or SDK expiry metadata
was altered for this natural-expiry phase. After the wait the test verified the
issued token was unchanged and actually expired, closed the app tab and reopened
the real /os route in a new tab of the same browser context. Navigation came from
the service worker. The unfinished Deep Thought and saved Note returned exactly.
On reconnect/reload a different, unexpired signed token was issued. Saved entries,
versions and unfinished drafts matched the before-wait snapshots exactly.

The existing early-renewal/revocation/account-switch checks also passed at 390px:
refresh token rotation, rejected revoked refresh, app lock, empty B entry and
returning A. After revocation /user returned 403 with 3598 seconds remaining on
the issued token. Both exact synthetic accounts were deleted and GET absence
checks returned 404. Disposable build cleanup completed; process exit was zero.

Commands with installed Node v24.22.1 and installed Playwright cache:

~~~powershell
node --env-file=.env.local scripts/check-auth-recovery-live.mjs --write --natural-expiry
node node_modules/eslint/bin/eslint.js scripts/check-auth-recovery-live.mjs tests/auth-recovery-live.browser.mjs
git diff --check
~~~

The approved outside-sandbox command was needed for build junction, loopback and
hosted access. Existing Next multiple-lockfile warning remains. No product defect
was found and no optimization justified. Geometry/type/motion, Circle day and
personal evidence were untouched; no new geometry measurement claimed.

This closes the bounded natural-token-expiry gap left by the earlier early-refresh
run. It verifies tab reopening in desktop Chromium at 390px, not a physical phone,
new browser-process restart after expiry, crash or OS eviction. Phone acceptance
is deferred at the developer's request. Lost devices, unconfirmed hosted denial,
true contention, backup/deletion and other activation gates remain open.


## Hosted account-session recovery — 2026-11-14

Developer approved the verification-only runner/browser/records slice, including
two disposable hosted accounts. main/6a09b62; prior modified/untracked work
preserved. No product runtime, hosted configuration, migration, deployment,
personal evidence or writing-sync activation changes.

New `scripts/check-auth-recovery-live.mjs` copies the allowlisted production
sources into a disposable build without .env files, sets writing sync disabled,
and starts a separate loopback app. Only the public Auth configuration reaches
the app. The secret remains in the Node verification process. The browser allows
only that app and the configured Supabase origin. Two confirmed synthetic accounts
are created with harmless credentials/writing; exact account deletion and 404
absence checks run in finally, including after failed assertions.

Final production webpack build/TypeScript and focused lint pass. Browser test
passes **1/1**, containing sequential actual-app journeys at **360/390px**:
real sign-in; Note autosave; unfinished Deep Thought; offline reload/return;
real refresh-token rotation; global revocation; rejected refresh; app lock after
rejected renewal; fresh B onboarding without writing controls; logout and restored
A. Saved entry/revision and unfinished-draft snapshots match exactly after
revocation and return, without duplicate saved revisions. Unrelated setup/delivery
gates are seeded in synthetic A; onboarding is not certified.

The test deliberately sets only persisted SDK expires_at scheduling metadata to
request renewal early. Signed tokens are not forged or changed. **Natural JWT
expiry is not verified.** Direct hosted /user requests after global revocation
returned **403** at both widths with **3596 seconds** remaining on the issued
token. Revoked refresh requests were rejected. This measures the configured
service's immediate response in this run, not a universal revocation-time promise.

Commands (installed Node v24.22.1 and existing Playwright cache):

~~~powershell
node --env-file=.env.local scripts/check-auth-recovery-live.mjs --write
node node_modules/eslint/bin/eslint.js scripts/check-auth-recovery-live.mjs tests/auth-recovery-live.browser.mjs
git diff --check
~~~

Initial sandbox dependency-junction creation failed EPERM before hosted accounts
were created; approved outside-sandbox rerun was required. First hosted attempt
hit the default five-second sign-in wait and confirmed cleanup of both accounts.
With a 30-second browser assertion allowance the final run passed in 29 seconds
after build. Existing Next multiple-lockfile warning remains. Diff check passes
with an existing debug.log line-ending warning. No optimization justified.

Remaining: natural token expiry, physical phones/PWA, crash/OS eviction,
unconfirmed-user hosted denial, lost devices, true contention, backup/deletion
and activation readiness. This does not certify all writing-sync gates. The
previous phone checklist remains the immediate device acceptance action.


## Real-app offline writing recovery — 2026-11-14

**Scope/Git.** Developer approved the production-route offline verification proposal,
runner, existing Auth suite extension and six owning/continuity records.
main/6a09b62; prior modified/untracked work preserved. No product runtime code,
shared geometry, migration, hosted account/database, environment, staging, commit
or deployment changes. Product writing sync stays off.

**Implementation.** scripts/check-writing-offline.mjs copies an allowlist of app,
public and build configuration into a disposable workspace build, links installed
dependencies and builds Next with synthetic Auth configuration. It does not copy
.env files. A separate loopback server leaves the original review build intact.
Existing ES256/Auth fixtures are reused. Unrelated setup/delivery completions are
seeded only in isolated account A; this is not onboarding/delivery certification.
Notes and Deep Thoughts themselves are authored through the actual production UI.

At 360/390px, persistent Chromium profiles close completely and reopen with
offline mode set before navigation. Both offline navigation responses explicitly
come from the actual service worker. Saved Note and unfinished Deep Thought return;
offline Note edits and draft edits survive a second offline process restart.
The Deep Thought stays unsent, with no saved answer. Offline logout stays locked
through reload. Reconnecting and switching to fresh B gives an empty writing ledger;
returning to A retains its exact saved entries, with no duplicate revisions.
HTTP/Auth requests outside the approved local/synthetic fixtures are blocked;
synthetic Auth also refuses requests during the offline phases. Profiles/builds
are cleaned after checking resolved paths remain under workspace outputs.

**Checks.** Installed Node v24.22.1 on PATH and installed Playwright cache:

~~~powershell
node scripts/check-writing-offline.mjs
node node_modules/eslint/bin/eslint.js scripts/check-writing-offline.mjs tests/supabase-auth.browser.mjs
~~~

Final isolated production webpack build/TypeScript passes. Final focused Auth/
recovery browser selection passes **15/15**, including the two new real-app cases.
Focused lint and scoped diff checks pass. Earlier full Auth selection was 15/17:
two unchanged menu tests expect 650 weight, while current shared design renders
700. git show HEAD confirms the old assertion. They remain unchanged and are
explicitly outside the runner's printed authentication/recovery selection. No
blanket full-suite pass or product defect is inferred.

Earlier fixture attempts found absent fresh-account main-state bytes, then
body-free retired draft markers, then an empty B ledger that has never been
written. The fixtures now seed unrelated setup explicitly, wait for actual
accepted records/draft bodies, and accept an absent ledger only for the empty
account. No product correction was needed. Existing Vite asset/chunk-size and
Next multiple-lockfile warnings remain. No optimization was justified.

**Limits/next.** This establishes normal Chromium process restart of the real
production route using local signed Auth fixtures. Real phone browsers/installed
PWA, live hosted expiry/revocation, crash/OS eviction, cleared-site storage,
backup/deletion and other-domain sync remain open. Geometry/motion were untouched;
no fresh geometry measurement is claimed. Next run the phone checklist below,
then prepare separately reviewed hosted-session/operating recovery work.

### Phone acceptance checklist

Use the current reviewed build on your primary phone; record phone model, OS,
browser/version and whether opened from a browser or Home Screen. Use harmless
test text and an account that already has access to the writing tools.

1. While online, open Note and Deep Thoughts once. Save a short test Note and
   leave a different answer unfinished. Wait for the Note's normal autosave.
2. Turn on airplane mode and ensure Wi-Fi is off. Fully close the app/browser,
   then reopen Circle OS. Check both texts return with the same question.
3. Edit the Note and unfinished answer offline. Pause, fully close and reopen
   again while still offline. Check both exact texts return.
4. Reconnect. Check the Note appears once in History, with its latest wording;
   the unfinished answer remains unfinished.
5. If testing logout, sign out offline and reopen: local writing must stay hidden.
   Reconnect and sign into the same account to confirm the retained writing returns.
   Do not clear site data or remove the installation as part of this check.

Report the first failing step, or all passed, with the device details.
Device acceptance remains pending until actually run.

## Writing browser-restart recovery — 2026-11-14

**Approval and scope.** Developer approved the concrete test/documentation proposal.
main/6a09b62; prior modified/untracked work preserved. Only the two existing writing
browser suites and the five approved records changed. No product code, hosted
database, environment, migration, staging, commit or deployment changed.

**Developer reports.** Explore reviewed; Protocol and Article publishing tested.
The developer also reports the Note caret issue fixed. Device/browser and detailed
steps were not supplied; this is reported acceptance, not a new measured phone test.

**Implementation and evidence.** Persistent synthetic Chromium profiles retain
the actual writing-store IndexedDB across a full normal browser-process close
and relaunch on the same origin. Storage equality verifies saved history and
unfinished drafts; account B starts empty and returning to A retains its state.
The local PostgreSQL fixture remains alive independently of the browser. A denied
upload and a server-accepted upload with its reply lost both retain the exact
pending operation across restart. Recovery drains that operation; repeating sync
creates one saved version, and the lost-reply case leaves the accepted head exactly
unchanged. External requests are blocked. Profiles are removed only after checking
their resolved paths stay under the workspace outputs directory.

Final command with installed Node v24.22.1 on PATH and
PLAYWRIGHT_BROWSERS_PATH pointing to the installed ms-playwright cache:

~~~powershell
node --test --test-reporter=tap tests/writing-storage.browser.mjs tests/writing-cloud.browser.mjs
~~~

**37/37 pass**, including three new restart cases. Focused ESLint passes for both
files. Initial restart assertions passed, but Vite watchers emitted EBUSY on locked
Chromium Cookies files. Both test servers now ignore outputs; the final complete
run has no such failure. Earlier Note diagnostic browser checks hit sandbox
ERR_NETWORK_ACCESS_DENIED before reaching the app. The writing suites ran with
approved outside-sandbox loopback access.

**Boundaries.** This is normal desktop Chromium process restart using the actual
product adapter with synthetic local HTTP/Auth/PostgreSQL fixtures, not a crash,
hosted Auth/session test, real-phone test, offline page startup or OS eviction.
Existing offline writes, rollback, quota, corruption, conflicts and account guards
also pass in the final suites. No geometry/type/motion changes; previous measured
tool dimensions are unchanged by this test-only work, not remeasured here.
No measured optimization justified. Product writing sync remains off.
Next prepare a separately reviewed production-route offline-startup and target
device recovery slice; hosted expiry/revocation and operating recovery remain open.

## Approved hosted template acceptance — 2026-11-14

Developer explicitly approved the prepared migration/test/cleanup and requested
continuation. Preflight confirmed template helper absent and existing publisher
present. Applied migration 004 once successfully through Supabase; subsequent
query confirmed helper present, anonymous publisher execution false and ordinary
delegate execution false. Do not reapply 001–004.

Final command (installed Node v24.22.1/Playwright cache, approved outside sandbox):
`node --env-file=.env.local scripts/check-content-admin-live.mjs --write --app --catalog --templates`.
Final exit 0: **88 functional checks**, the real browser Explore → setup →
Routine Add/Protocol Start → checkbox completion → reload, followed by both
template types' withdrawal/restore and **Synthetic cleanup confirmed**. Both
accounts, temporary grant, four draft/catalog identities, immutable versions,
asset references/image and operation receipts were removed by exact registered
identities, with absence checks. All earlier attempts also confirmed cleanup.

Attempts identified old signed-out expectation (403 versus current 401), changed
image expectation (400 versus current 503), a real destination bug and a browser
fixture SecurityError. Changed-image rejection now independently checks original
stored bytes; the 503 classification remains unresolved. The actual product fix
stores the intended shared Routine/Protocol page index atomically with adoption,
using the unchanged shared version identifier. Final webpack build/TypeScript and
focused lint pass; updated production-CSS local Add/Start checks pass 3/3,
including persisted Protocol index 1. Hosted browser then passed both tools and
reload. Fixture initialization now skips opaque/foreign origins; errors are
audited with URL/token redaction. No unexpected product error remained.

Preflight advisors reported pre-existing RLS-without-policy informational entries,
definer execution warnings (including rls_auto_enable), and disabled leaked-password
protection. No unrelated policy/auth setting was altered or declared resolved.
No real authored publication, deployment, sync activation, staging or commit.
Physical phones, true contention, backup/restore, ResizeObserver, original Effort
draft diagnosis and earlier stale source assertion remain outside certification.

## Explore and local template completion — 2026-11-14

Developer approved local completion, then specified Explore's three glass rows,
retained header/navigation, optional saved fields, vertical scrolling, outside
titles, bounded carousels, two blank panels when empty, a blank neighbour for one
item and exact-version opening. They chose to reopen any active Habit group and
allow a fresh group after all items stop/expire. Work began on main/6a09b62 with
substantial modified/untracked work; it is preserved. No stage, commit, remote
write, authored publication, deployment or sync activation.

**Implemented.** Native scroll-snap rows use shared glass/type/spacing and Today's
compact minimum, with raised selections/Orange shadow. Explore excludes withdrawn
items for every role; migration 004 adds saved metadata in one listing. Routine
adoption reuses domain/schedule actions, one immutable group/source/answer record
and definition references. Add/Start share the account lock and await local save.
Epoch checks reject stale operations. Source disclosures save no evidence and
template tasks retain supporting wording. Protocol's fixed terms, protection and
Day One gate remain. Admin Add/Start are disabled.

**Verification.** Installed Node v24.22.1 and existing Playwright cache. Final
browser commands use `$env:CIRCLE_PRODUCTION_CSS='1'`.

- `node node_modules/next/dist/bin/next build --webpack`: final pass including
  TypeScript and the adoption account-epoch safeguard. Focused ESLint across
  changed app/model/route/source/runner/test files passes. Both runner files pass
  `node --check`. `node scripts/chapter-compiler.mjs --check`: 33 sources/0 quests.
- `node --test tests/routine-template-adoption.test.mjs tests/protocol-template-adoption.test.mjs tests/template-model.test.mjs tests/template-routes.test.mjs tests/template-publication.test.mjs tests/catalog-routes.test.mjs tests/content-template-live-gate.test.mjs tests/routine-schedule.test.mjs`: 30/30 pass. Covers source/choice-label snapshots, preserved items/identity, inclusive dates/ongoing, individual stopping, retry, active groups across editions, later re-adoption, history/merge, invalid answers/bounds/collisions, publication access/metadata and hosted-runner gates.
- `node --test --test-reporter=tap --test-name-pattern='template|Admin Protocol preview' tests/content-admin.browser.mjs`: 13/13 pass. Add/Start recover from both local-store failures, retain answers and save one copy. Cover/time/Effort/editor/image/Protocol-duration paths remain passing.
- `node --test --test-reporter=tap --test-name-pattern='adopted Routine template|adopted Protocol template|bottom navigation routes|tool consistency across six|shared App Box geometry' tests/writing.browser.mjs`: 10/10 pass. Real rows, first-row checkbox alignment, supporting wording, source reading without evidence mutation, completion/reload and fixed terms pass. Matrix covers 360/390/416; settled Note/Thoughts/Habit/Protocol references at 360/390 stay 648px/24px without nested scrolling.
- Final post-safeguard/Admin-denial recheck: `node --test --test-concurrency=1 --test-reporter=tap --test-name-pattern='Explore|Routine template Add|Protocol template Start|template Start cannot|Admin templates build' tests/content-admin.browser.mjs tests/explore.browser.mjs`: 12/12 pass, comprising 5 overlapping template checks and 7 Explore checks. Explore covers 360/390/416/1100, native touch, both neighbour edges, ends/Home/End, roles/24px anchors, no outer frame, blank/single-item rows, optional fields, exact opening, retry, normal depth motion, reduced motion/transparency, forced colors, account changes and late-response exclusion. Initial metadata request count is one.

**Expanded selection/baseline.** Adding circle-os-model, habit-identity,
protocol-home and protocol-wording produces 135/136 pass. The unchanged Protocol
Footer source assertion searches for absent exact comment `/** The block` and
slices an empty string. Reconstructing the file in memory without this task's
Protocol import/render additions also gives marker/start -1 and an empty slice.
Leave this fixture unchanged; no runtime defect or broad-suite pass is inferred.
Actual Protocol runtime checks above pass.

**Attempts/QA.** The Node shim was unavailable; installed Node worked. Sandbox
EPERM for generated output and loopback denial required approved outside-sandbox
execution. Initial virtual-fixture JSX/duplicate region labels were corrected.
Desktop scaling initially hid a neighbour; its scoped scale is corrected. Glass
initially borrowed the 648px focused floor; Explore now captures the existing
344px mobile/420px wider compact floor. The Add rim initially measured 28px from
the outer bottom due to a legacy 3px key lift; shared glass action rules restore
25px outside/24px inside. Visual QA corrected source opacity/roles and kept
adopted checkboxes on row one. Inspected outputs/explore-middle-390.png,
outputs/explore-empty-390.png and outputs/routine-template-adopted-390.png; other
widths are captured too. Expected synthetic disk-error logs and existing
ResizeObserver notices remain. No broad optimization justified; one listing and
shared targeted image reads avoid per-edition metadata requests.

**Hosted boundary/next.** Read-only discovery/query confirmed the configured
CircleOS Server project and absent template migration marker. Public config
matches the project and uses Supabase account mode. No hosted rows changed.
The write-gated runner prepares real synthetic publication plus an isolated
production-browser flow and exact cleanup; runtime remains unverified pending
separate approval. See [procedure](CONTENT_ADMIN_SETUP.md#prepared-hosted-template-acceptance).
Physical phones, true cross-tab contention, backup/restore, original Effort-draft
diagnosis and ResizeObserver remain open. debug.log has three added lines and is
preserved. The built local review server is ready at port 3012.

## Retire outdated button source checks — 2026-11-14

Developer approved removing nine outdated button test blocks/comments, retaining
the other 14 and adding no tests. Removed Protocol top-edge key lighting, universal
Page-action recipe, 18px App Box gap, universal action height, choice JSX/key
form, no release animation, tick active/sunk face, old Send persistence/departure
function and old Thoughts departure selector checks. These are the nine failures
recorded in the preceding Routine CSS cleanup; passing retained checks are intact.
Redundant blank lines tidied. No app code/style/data change or runtime bug fix.

Installed Node v24.22.1:

- `node --check tests/button-standard.test.mjs`: pass.
- `node --test tests/button-standard.test.mjs`: 14/14 pass after final cleanup. Log: `outputs/button-source-cleanup.log`.
- `node node_modules/eslint/bin/eslint.js tests/button-standard.test.mjs`: pass.
- Final diff review and `git diff --check`: pass.

No new tests or behavioral coverage. Browser/build were not repeated for this
test-only removal; earlier runtime evidence remains dated evidence. main/6a09b62;
prior modified/untracked work preserved. No stage, commit, migration, publication,
deployment or sync activation. Existing device/ResizeObserver/Effort-draft/hosted
gaps remain open. No broad-suite certification.

## Unused Routine/task CSS cleanup — 2026-11-14

Developer approved six unused CSS families and corresponding existing assertion
selector updates. Removed os-extra-mission-done, os-primary-mission-copy,
os-add-habit-row, os-task-done, os-habit-session-label and os-yesterday-undo.
Ten whole rules removed and six mixed rules trimmed; read-only PostCSS comparison
confirms every retained selector group's declarations match its pre-edit snapshot.
CSS parses and no retired selectors remain. Retired dotted-control comment was
removed. Two selector lists in button-standard now refer to retained controls.
No new tests or app/record/content/token/motion changes.

- Installed Node v24.22.1: `node --test tests/button-standard.test.mjs`: 14/23 pass. Nine source assertions fail on unchanged key-light, action-lift, 18px gap, survey-choice height, JSX formatting, sunk-key and Thoughts departure expectations. They are not repaired or removed within this scope. Log: `outputs/routine-css-cleanup-controls.log`.
- `node node_modules/eslint/bin/eslint.js tests/button-standard.test.mjs`: pass.
- `node node_modules/next/dist/bin/next build --webpack`: final production build/TypeScript pass. Sandbox generated-output mkdir hit EPERM; approved outside-sandbox rerun passes. Log: `outputs/routine-css-cleanup-build.log`.
- `CIRCLE_PRODUCTION_CSS=1 node --test --test-reporter=tap --test-name-pattern="Routine schedules repeat tasks|Habit result fades|Record matches Habits|tool consistency across six|shared App Box geometry" tests/writing.browser.mjs`: 9/9 pass with installed Node directory on PATH, installed Playwright cache and approved outside-sandbox execution. Log: `outputs/routine-css-cleanup-browser.log`.
- Final diff review and `git diff --check`: pass.

Isolated synthetic browsers block external backend/model requests. Repeat task
completion, Record Undo/reload, saved historical wording and restored Habit Undo
remain intact. Record styling passes at 360/390px, shared matrix at 360/390/416px.
Reference Note/Thoughts/Habit/Protocol frames remain 648px with 24px foreheads at
360/390px and no nested scrolling. `outputs/record-shared-style-390.png` inspected.
Existing ResizeObserver, physical-device, Effort-draft and hosted gaps remain
open. No full-suite or performance claim. main/6a09b62; prior modified/untracked
work preserved; no commit, deployment, migration, publication or sync activation.

## Unused Note/check-in CSS cleanup — 2026-11-14

Developer approved removing five unused Note/check-in style families and their
responsive variants. Removed 11 rules for os-save-state, os-checkin-card,
os-note-mode-toggle, os-line-cue and os-note-deck-note, plus the obsolete footer
status comment. No runtime app/public references to these classes were found.
Current writing tools, retained Line content, historical Chapters, records,
shared tokens and motion remain untouched. No new tests added.

- PostCSS parsing and retired-selector absence check pass. The first scan had a regex escaping error; corrected scanning identified all 11 rules. Patch hunk ordering was corrected before applying the source change.
- Installed Node v24.22.1: `node node_modules/next/dist/bin/next build --webpack` passes including TypeScript. Sandbox generated-directory EPERM required approved outside-sandbox execution. Log: `outputs/note-css-cleanup-build.log`.
- `CIRCLE_PRODUCTION_CSS=1 node --test --test-reporter=tap --test-name-pattern="writing pair shares glass|Deep Thoughts opens directly|tool consistency across six|shared App Box geometry" tests/writing.browser.mjs`: 9/9 pass with installed Node directory on PATH, installed Playwright cache and approved outside-sandbox execution. Log: `outputs/note-css-cleanup-browser.log`.
- Final diff review and `git diff --check` pass.

Synthetic isolated browser checks block external backend/model traffic. Writing
pair behavior and shared matrix pass at 360/390/416px; saved Deep Thoughts persist
and advance only on Next question. Reference Note/Thoughts/Habit/Protocol frames
remain 648px tall with 24px foreheads at 360/390px and no nested scroller.
`outputs/writing-pair-note-390.png` was inspected. No performance improvement,
broad-suite, physical-device or hosted acceptance claim. Existing ResizeObserver
and other recorded gaps remain open. main/6a09b62, prior modified/untracked work
preserved; no stage, commit, deployment, migration, publication or sync activation.

## Retired Log CSS cleanup — 2026-11-14

Developer approved removing unused old Log CSS and responsive variants. Removed
the os-log-gate, os-section-heading, os-day-hint, os-close-log, os-add-time,
os-hour-being-edited, os-main-activity-field, os-note-field and os-save-log rules.
No app source references remain; dynamic Log class construction was inspected.
Shared os-form-error grid placement and the responsive os-mission h2 rule remain.
Prior modified/untracked work preserved on main/6a09b62; no commit or deployment.

- Existing PostCSS parser successfully parses the stylesheet. A read-only selector scan finds none of the retired families and confirms `.circle-os .os-form-error { grid-column: 1 / -1; }` remains.
- Installed Node v24.22.1: `node node_modules/next/dist/bin/next build --webpack` passes, including TypeScript. Initial sandbox execution hit generated-directory EPERM; approved outside-sandbox rerun passes. Log: `outputs/log-css-cleanup-build.log`.
- `CIRCLE_PRODUCTION_CSS=1 node --test --test-reporter=tap --test-name-pattern="full-page Log adoption|Log corrections save, cancel and reload|tool consistency across six|shared App Box geometry" tests/writing.browser.mjs`: 10/10 pass with installed Node directory on PATH, installed Playwright cache and approved outside-sandbox execution. Log: `outputs/log-css-cleanup-browser.log`.
- Final diff review and `git diff --check` pass. No new tests added.

Synthetic isolated browser checks block external backend/model requests. Entry,
editing, save/reload and corrections remain functional. Shared matrix covers
360/390/416px; Note/Thoughts/Habit/Protocol reference frames remain 648px tall
with 24px foreheads at 360/390px and no nested scroller. The current Log screenshot
`outputs/log-adoption-390.png` was inspected. No app logic, record, published
Chapter, shared token or motion change. No measured performance improvement or
broad-suite/device/hosted acceptance is claimed. Existing ResizeObserver notices
and other recorded gaps remain open. No migration, publication or sync activation.

## Remove stale first-use tests — 2026-11-14

The developer explicitly requested deleting the three obsolete first-use tests,
with no replacement tests. Removed the published-setup precedence, setup-sealing
and cross-version setup source-assertion blocks/comments from
`tests/first-use-setup.test.mjs` (67 lines). Read-only baseline was 5/8: these
three failed on retired shell identifiers. The remaining five blocks are intact.

Installed Node v24.22.1: `node --check tests/first-use-setup.test.mjs` and
`node node_modules/eslint/bin/eslint.js tests/first-use-setup.test.mjs` pass.
Final diff review and `git diff --check` pass. No tests were added; no test
suite, browser or build was run for the removal. No new behavioral verification
is claimed. App code, personal records, published content and design are unchanged.
main/6a09b62, prior modified/untracked work preserved; no staging, commit,
migration, publication or deployment. Existing verification gaps remain open.

## Week setup test timestamps — 2026-11-14

Developer approved the test-only fixed-timestamp correction and bug/continuity
records. main/6a09b62; previous modified/untracked work preserved. No staging,
commit, runtime code change, migration, publication or deployment.

`tests/week-setup.test.mjs` now passes explicit `declaredAt` options to the
existing declaration API: September 7, 2026 at 08:00, 09:00 and 09:01 UTC. The
fixture already plans September 7 and expects a March 2027 six-month target.
Distinct Character timestamps keep the starter and later four-trait versions
separate. Existing assertions still verify both versions, retained earlier
wording, six-month target, Week goal/step and Protocol terms/link/slip line.
The prior failure expected 2027-03 but received 2027-05 using today's clock.

With installed Node v24.22.1:

- `node --test tests/phases.test.mjs tests/day-door.test.mjs tests/week-setup.test.mjs tests/chapter-history.test.mjs`: 24/24 pass. Log: `outputs/week-test-clock-model.log`.
- `node --test tests/character.test.mjs tests/vision-declaration.test.mjs tests/the-four.test.mjs`: 21/21 pass. Log: `outputs/week-test-clock-declarations.log`.
- `node node_modules/eslint/bin/eslint.js tests/week-setup.test.mjs`: pass.
- Final diff review and `git diff --check`: pass.

No new browser/build run was needed: app code, styles, stored data, content,
Circle-day boundaries and runtime date rules were untouched. Earlier browser
evidence remains dated evidence, not a new run. No broad-suite or physical-phone
acceptance is claimed. The date-dependent test gap is closed within this scope;
other previously recorded gaps remain open. No optimization was justified.

## Week lock cleanup — 2026-11-14

Developer approved removing the unreachable Week lock branch, redundant access
lookup, obsolete comments and matching test expectations. main/6a09b62; previous
modified/untracked work preserved. No staging, commit, migration or deployment.
Week now renders its current/history Page directly; its runtime access policy
was already open. Protocol's Day One gate, historical setup handlers, saved
records, phase helpers and shared CSS/tokens are unchanged.

- Installed Node v24.22.1: `node --test tests/phases.test.mjs tests/day-door.test.mjs tests/week-setup.test.mjs tests/chapter-history.test.mjs`: 23/24. Phase access checks pass, including unfinished Day One denial, completed old-version Day One access and unchanged Week setup records. The unmodified Week setup integration test fails at its hard-coded six-month target: expected 2027-03, actual 2027-05. Its declaration uses the current clock; the affected model code was not edited. This separate fixture issue remains open. Log: `outputs/week-lock-cleanup-model.log`.
- `node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx app/os/phases.js tests/phases.test.mjs`: pass.
- `node node_modules/next/dist/bin/next build --webpack`: final production build/TypeScript pass. Sandbox compilation/type checking passed but generated prerender directory creation hit EPERM; approved outside-sandbox execution completed. Log: `outputs/week-lock-cleanup-build.log`.
- `CIRCLE_PRODUCTION_CSS=1 node --test --test-reporter=tap --test-name-pattern="Routine and Week open without legacy|tool consistency across six|shared App Box geometry|Protocol interaction audit" tests/writing.browser.mjs`: 7/7 pass with installed Playwright cache, Node directory on PATH and approved outside-sandbox local browser execution. Log: `outputs/week-lock-cleanup-browser.log`.

The browser uses isolated synthetic accounts and blocks external backend/model
traffic. Saved unfinished Habit/Week runs survive entry and reload; no Routine
presentation run is saved. Live Protocol toggle/reload passes. The six-tool and
supporting-view matrix passes at 360/390/416px. Note/Thoughts/Habit/Protocol
reference frames remain 648px tall with 24px foreheads at 360/390px and no nested
scrolling. No visual or performance change is claimed. Existing ResizeObserver
notices and physical-device/hosted acceptance gaps remain. The date-dependent
test was not changed outside this scope; no broad-suite pass is claimed.
Final diff review and `git diff --check` pass.

## Routine presentation cleanup — 2026-11-14

Developer approved the bounded Routine frame/condition/comment cleanup, stale
Habit test replacement and continuity records. main/6a09b62; prior modified and
untracked work preserved. No commit, hosted write, migration or deployment.

**Change and baseline.** The shared Routine definition/run is created together
once. Always-completed presentation checks are removed; historical Chapter
definitions/runs, projection handlers, styling, gestures and local persistence
are unchanged. Two selected Habit source tests failed before editing because
they required removed `habitSetupPublication` wiring and old identity-timer
expressions. They are replaced by behavioral checks of saved setup answers,
one-time completion projection/reload and visible result restoration.

**Commands and results.** Use installed Node
`C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`,
its directory first on PATH, and
`PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/ms-playwright`.

- `node --test tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/routine-schedule.test.mjs tests/chapter-engine.test.mjs tests/chapter-history.test.mjs`: 42/42 pass. Covers legacy answer/version preservation, unfinished setup, starter/fallback projection, idempotence, historical words and schedule/Undo/merge behavior. Log: `outputs/routine-cleanup-model.log`.
- `node node_modules/next/dist/bin/next build --webpack`: final production build and TypeScript pass. Initial sandbox build compiled and type-checked, then hit EPERM creating a generated prerender directory; approved outside-sandbox execution passes. Log: `outputs/routine-cleanup-build.log`.
- `node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx app/os/routine-presentation.tsx tests/habit-identity.test.mjs tests/writing.browser.mjs`: passes after final test corrections.
- `CIRCLE_PRODUCTION_CSS=1 node --test --test-reporter=tap --test-name-pattern="Routine and Week open without legacy|completed Habit restores|Habit result fades in and out|tool consistency across six|shared App Box geometry|real Habit and Protocol rows|Protocol interaction audit" tests/writing.browser.mjs`: initial 8/10. Seven unaffected cases pass: live Protocol toggle/reload, matrix at 360/390/416px, geometry at 360/390px, long Habit/Protocol growth. The new result-restoration case also passes. Log: `outputs/routine-cleanup-browser.log`.
- Final affected selection uses `--test-name-pattern="Routine and Week open without legacy|completed Habit restores|Habit result fades in and out"` with the same production-CSS browser command: 3/3 pass, one case overlaps the main run. Ten distinct cases have passing final evidence. Log: `outputs/routine-cleanup-browser-final.log`.

**Fixture corrections and observed behavior.** Browser sandbox loopback access
was denied; approved outside-sandbox runs use isolated synthetic state and block
external backend/model requests. The baseline browser selection passed preserved
unfinished runs but failed the motion test's fixed 44px whole-row assumption:
Schedule makes the completed row 96px. Motion now measures the copy region and
its actual minimum (about 33.7px inside the existing top offset), preserving
300ms word response, 600ms settling, both directions and no overlap. The extended
reload check first tried the hidden Routine entry while Week's hash restored
Week; it now explicitly reloads Today. No product fix was made for either test
assumption. Final checks preserve unfinished setup runs through tool entry and
reload, never save `routine-surface`, restore completed wording without replay
through opening/edit return/reopen/reload, and keep deliberate tick/Undo motion.

**Measurements and limits.** Note/Thoughts/Habit/Protocol reference frames remain
648px with 24px foreheads at 360/390px, with no nested scroller. The cross-tool
matrix also covers 416px. Long Habit/Protocol frames measure approximately
1386/1016px and grow naturally. `outputs/routine-cleanup-restored.png` was visually
inspected. Existing ResizeObserver notices remain. Physical phones, other browser
engines, true contention, hosted template acceptance and the broad suite were
not certified. Shared tokens, old content/records, Circle-day rules and sync
activation are unchanged. No performance improvement or broad optimization is
claimed. `git diff --check` passes after final records.

## Explicit local Protocol Start and footer spacing — 2026-11-14

Approved Start slice on main/6a09b62, preserving prior work.

- `node --test tests/protocol-template-adoption.test.mjs tests/template-model.test.mjs tests/template-routes.test.mjs tests/template-publication.test.mjs`: 16/16. Fixed terms, source/answer snapshots, normalization/merge, retry identity, historical-ID collision protection, no skipped-reflection evidence, existing active/draft protection, length/answer validation and Day One gate.
- `node node_modules/next/dist/bin/next build --webpack`: final build/TypeScript pass. Focused ESLint covers changed model/Protocol/preview/reader and tests.
- With `$env:CIRCLE_PRODUCTION_CSS='1'`, `node --test --test-name-pattern='template|Admin Protocol preview' tests/content-admin.browser.mjs`: 10/10. Preview rim measures 25px from outer bottom, equal to 24px inside border, at 360/390/416 across durations. Admin Start disabled. Signed-in reader simulates both local-store failures, retains preview, retries successfully, saves one phase with exact source/version/reflection snapshot, opens destination and protects existing phase after reload.
- Final reader follow-up: `--test-name-pattern='template Start|signed-in template reader'`: 3/3, including new account-scope invalidation. Counts overlap the prior selection.
- Same production CSS, `node --test --test-name-pattern='adopted Protocol template|Protocol interaction audit|tool consistency across six|shared App Box geometry' tests/writing.browser.mjs`: 7/7. Adopted phase renders on actual Protocol, completion survives reload, name/End remain available while term editors are absent. Existing live toggle audit and shared tool matrix/geometry pass; reference Note/Thoughts/Habit/Protocol 648px/24px without nested scrolling.

The reader navigation/store test and real-Protocol rendering test use separate isolated fixtures; no real hosted template or owner's data was used. Initial footer measurement found the legacy 8px margin. A save failure exposed Start's one-shot lifecycle; keeping it mounted restores retry. Initial fixture seeded Day One before account load finished; corrected ready/valid-run fixture passes. Synthetic save-error console output is expected; existing ResizeObserver notifications remain. No broad optimization justified. True cross-tab contention, physical phones, hosted template acceptance and original Effort-draft diagnosis remain open. Migration 004, publication, deployment and cloud-sync activation remain untouched.

Final build/TypeScript and lint rechecked after the account-epoch guard and historical-ID/skipped-answer safeguards. Final reader recheck covered account scope and duration/spacing; its Start case initially raced a diagnostic DOM read against successful navigation. Replaced that diagnostic poll with waitForURL; isolated final Start save/failure/retry/reload case passes 1/1. The review server was restarted from the final build on 3012 and Admin returned HTTP 200. Inspected outputs/protocol-template-390.png with the Start action.

## Faithful Protocol template preview — 2026-11-14

Approved read-only setup/running preview on main/6a09b62, preserving prior changes.

- `node node_modules/next/dist/bin/next build --webpack`: final build/TypeScript pass.
- Focused ESLint for protocol-page.tsx, template-preview.tsx, template-editor.tsx and content-admin.browser.mjs: pass.
- Production CSS enabled, `node --test --test-name-pattern='template' tests/content-admin.browser.mjs`: final 8/8. Protocol checks all five durations at 360/390/416, Preview N days, Day 1 identity, Back retaining selection, disabled completion, absent Edit/Phases, 28px/700 heading, 18px/700 labels, 24px header gap, reload and no saved Chapter/Protocol evidence.
- Same environment, `node --test --test-name-pattern='Protocol interaction audit|tool consistency across six|shared App Box geometry' tests/writing.browser.mjs`: 6/6. Existing live toggle/reload behavior passes. Matrix 360/390/416, reference Note/Thoughts/Habit/Protocol 648px/24px, no nested scrolling.

Screenshot inspection found glass prose rules overriding scoped heading/label weights; reordered the scoped rules and rebuilt/reverified. Screenshot fixture waits for shared frame resize before capture. Outputs/protocol-template-360.png, -390.png and -416.png capture read-only phase presentation. Existing ResizeObserver notification appeared during the live audit; no fix claimed. Runtime checks used approved outside-sandbox execution. No broad optimization justified. No personal evidence, stored definitions, migration, adoption or deployment changed. Physical phones and original Effort-draft diagnosis remain open.

## Template cover and bounded AM/PM — 2026-11-14

Approved follow-up on main/6a09b62, preserving all prior work.

- `node node_modules/next/dist/bin/next build --webpack`: final build/TypeScript pass.
- Focused ESLint: time-picker.tsx, template-preview.tsx, content-admin.browser.mjs pass.
- Production CSS enabled with `$env:CIRCLE_PRODUCTION_CSS='1'`, `node --test --test-name-pattern='template' tests/content-admin.browser.mjs`: 8/8.
- Expanded `--test-name-pattern='template cover'` selection: 3/3, verifying keyboard (360px), tap (390px) and swipe (416px) entry. Headings 28px/700; prose 18px/400; top/left 25px outer-border offsets equal 24px inner anchors, body gap 24px, no 12ch heading cap, cue target at least 44px. Inspected outputs/template-cover-390.png.
- AM/PM option count is exactly two; ArrowDown at PM remains PM. Hour/minute independence, midnight, unsaved 6:00 AM hint, Back retention, Effort remove/save/reload and answer-line growth remain passing.
- Shared tool consistency/geometry selection initially 4/5: Week History animation response at 390px returned [] instead of [240]. Other matrices and both Note/Thoughts/Habit/Protocol geometry cases pass at 648px/24px without nested scrolling. No Week code changed. Isolated final 390px matrix rerun passes 1/1, including the animation assertion. Final lint passes and refreshed Admin returns HTTP 200 at localhost:3012.

Runtime checks used approved outside-sandbox execution. No broad optimization, publication, hosted migration or deployment. Physical phones and original-draft Effort diagnosis remain open.

## Effort removal and separate time columns — 2026-11-14

Approved local follow-up on main/6a09b62, preserving all earlier work.

- `node --test tests/template-model.test.mjs tests/template-routes.test.mjs tests/template-publication.test.mjs`: 10/10. Blank/whitespace/removed Effort cannot borrow an evening cue or answer; existing configured links remain explicit.
- `node node_modules/next/dist/bin/next build --webpack`: final production build and TypeScript pass.
- Focused ESLint over time-picker.tsx, template-editor.tsx, template-model.js, template-preview.tsx and the two edited tests: pass.
- `$env:CIRCLE_PRODUCTION_CSS='1'; node --test --test-name-pattern='template' tests/content-admin.browser.mjs`: final 5/5. Synthetic saved Effort linked to an evening answer is removed, saved, reloaded and remains absent; Add effort starts empty and clearing typed Effort also removes output. Cue “After dinner” is preserved. Independent Hour/Minute/AM-PM selection covers click, wheel, keyboard, initial unsaved 6/00/AM, minute 59/00 wrap without hour changes, midnight formatting and selected-answer retention after Back. No personal Chapter run is created. Both generated schedule sentences are absent before/after toggling the retained checkbox. Draft recovery, typed-answer lines and Protocol previews remain passing.
- Same CSS environment, `node --test --test-name-pattern='tool consistency across six|shared App Box geometry' tests/writing.browser.mjs`: 5/5. Matrix 360/390/416px; reference Note/Thoughts/Habit/Protocol frames stay 648px with 24px foreheads at 360/390, without nested scrolling.

Inspected outputs/template-time-picker.png with all three columns. The original reported draft was not inspected, so its precise “evening” origin remains unconfirmed. Empty Effort is not a baseline model reproduction; a stored answer link can reproduce the display and the new removal control clears it durably. Physical-phone acceptance and hosted template migration/publication/adoption are unverified. First build failed on an inferred string return type in fixedValue; the explicit TemplateValue return annotation passed the final build. Initial choice fixture waited for Continue despite automatic single-choice advance; corrected fixture passes. Runtime checks used approved outside-sandbox execution. No broad optimization justified; no deployment or personal evidence changes.

## Template wheel, authoring guidance and answer lines — 2026-11-14

Approved local follow-up on main/6a09b62, preserving pre-existing changes.

- `node --test tests/template-model.test.mjs tests/template-routes.test.mjs tests/template-publication.test.mjs`: 9/9. Missing question wording, invalid and duplicate references identify the Page; immutable publication/access checks remain passing.
- `node node_modules/next/dist/bin/next build --webpack`: final build/TypeScript pass.
- Focused ESLint for time-picker.tsx, template-editor.tsx, template-model.js, template-preview.tsx and the two edited tests: pass.
- `$env:CIRCLE_PRODUCTION_CSS='1'; node --test --test-name-pattern='template' tests/content-admin.browser.mjs`: final 4/4. Verifies initial visible 5:59/6:00/6:01 times with no selected answer, required Continue disabled, arrow/scroll/click selection, no personal Chapter evidence, fading Bone line and 25px outer-border offsets (24px inner anchors), multiline growth, draft recovery, personalized Routine results and Protocol preview.
- Same CSS environment, `node --test --test-name-pattern='tool consistency across six|shared App Box geometry' tests/writing.browser.mjs`: 5/5. Tool matrix at 360/390/416px; Note/Thoughts/Habit/Protocol reference heights 648px and foreheads 24px at 360/390px, without nested scrolling.

Inspected outputs/template-time-picker.png and outputs/template-answer-line.png. Initial answer-line test exposed shared transparent-input background and inherited 34ch width; moved the decoration to the scoped form and removed only its width cap. A subsequent geometry assertion caught intermediate Page travel; fixture now waits for settled position. First production-CSS attempt preceded build completion and found no os.html; final run uses completed output. Sandbox Node/runtime limitations required approved outside-sandbox execution. No physical-phone, hosted template migration/adoption/publication or deployment acceptance is claimed. No broad optimization justified.

## Seven-point template review corrections — 2026-11-13

Explicitly approved local changes on main/6a09b62 tracking fork/main, preserving all earlier uncommitted work. Synthetic browser fixtures intercept external requests; SQL uses isolated PGlite. No personal evidence edits, hosted migration, real authored publication, sync activation or deployment.

Final commands use the CodexPrimaryRuntime.v26-1111-570-0 bundled Node executable:

- `node node_modules/next/dist/bin/next build --webpack`: production build and tsconfig.vercel TypeScript pass.
- Focused ESLint covers Admin account server/client/menu/media/catalog/publication/status, template model/editor/preview, account menu, shared player/Routine presentation/time picker, shell, phases and day-door: pass without warnings.
- `node --test tests/template-model.test.mjs tests/template-publication.test.mjs tests/template-routes.test.mjs tests/content-admin-routes.test.mjs tests/content-admin.test.mjs tests/phases.test.mjs tests/day-door.test.mjs`: 33/33. New wording preserves saved definitions, private RPC validation, typed network/permission failures and updated Week access contract.
- `node scripts/chapter-compiler.mjs --check`: 33 sources/0 quests; immutable published definitions unchanged.
- `CIRCLE_PRODUCTION_CSS=1 node --test tests/content-admin.browser.mjs`: 17/17. Numeric answer measured 18px/400 at 390px, versus the initial failing 16px. Time hint cannot submit untouched; picker click/keyboard selections format 12-hour cues without saving Chapter evidence. Transient media failure keeps editor mounted; genuine denial locks access and Retry restores the owned recovery draft. Menu status is requested before opening, with no new request on repeated opens. Stable image ID produces one targeted request shared by editor/player across draft edits. Full Routine Page preview has Back/Record header, authored item content and no disclaimer. Existing Media/Article/Chapter/Catalog/recovery tests pass.
- `CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="^Routine and Week|^Routine schedules|^tool consistency|^real Habit and Protocol" tests/writing.browser.mjs`: 6/6. Habit Building and Week Setup runs are seeded unfinished; both tools open and the exact stored runs remain unchanged. Reference empty tools 648px/24px at 360/390/416; long Habit/Protocol fixtures 1385.96875/1015.90625px with no nested tool scroller. The picker's small listbox scrollers are intentional input controls, not tool scroll owners.

Visual QA inspected `outputs/template-result.png`, `outputs/template-number-page.png` and `outputs/template-time-picker.png`. Initial integration and font failures were corrected before the final production run; the important remaining typography cause was the legacy mobile-wide !important rule. Old native time controls remain for unmarked chapters. Menu/media work addresses measured repeated requests; no broad optimization was performed. No assertion is made about the cause of the developer's individual historical connectivity incidents.

Local review server restarted on 3012 from the final build. `/os/admin` returns 200; unsigned `/os/admin/status` returns 401. Physical-phone input/access, real session expiry/revocation, hosted template acceptance, contention and backup/restore remain open. Earlier unrelated Habit source assertion and Protocol-history return test gap remain recorded. Migration 004 remains unapplied remotely.

## Admin template builder and Catalog — 2026-11-13

Approved local implementation on main/6a09b62 tracking fork/main, preserving all uncommitted Routine scheduling work. Synthetic isolated browser accounts with external requests intercepted, plus isolated PGlite migrations/RPCs. No hosted write, migration application, real publication, personal answer/adoption, sync activation or deployment.

Commands below use the bundled Node executable under CodexPrimaryRuntime.v26-1111-570-0; the shell Node shim is unavailable:

- `node --test tests/template-model.test.mjs tests/template-publication.test.mjs tests/template-routes.test.mjs tests/catalog-publication.test.mjs tests/catalog-routes.test.mjs tests/content-admin-routes.test.mjs tests/content-admin.test.mjs tests/content-design.test.mjs`: 20/20. Direct answers, bounds, choice coverage, invalid/reflection-linked rules, duplicate/broken IDs, unchanged authored sets, numeric/image Markdown round trip; isolated migration 004 and old paths, Admin/ordinary/signed-out access, receipts/retry/conflicts, immutable editions, private-to-published images, withdrawal/restore, rejected type changes, unavailable-image rollback. New route validation rechecks live Admin before publication.
- Focused ESLint covers new template model/types/editor/preview, account Admin, Catalog manager/publication route/reader, shared player/types, authoring/compiler and new tests: pass without warnings.
- `node scripts/chapter-compiler.mjs --check`: 33 sources/0 quests; no published definitions changed.
- `node node_modules/next/dist/bin/next build --webpack`: production build and tsconfig.vercel TypeScript pass.
- `CIRCLE_PRODUCTION_CSS=1 node --test tests/content-admin.browser.mjs`: 14/14, including new group authoring, Page/item duplicate/reorder, media placement, quantity binding, unsaved account/tab recovery, save/reload, actual result preview, group duration choice and publication with the draft's identity. Protocol reader uses its existing durations, fixed terms and skipped optional numeric reflection; reload and no personal Chapter/Protocol evidence verified. Existing Admin/Media/Article/Chapter reader paths also pass.
- `CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="^Routine schedules|^tool consistency|^real Habit and Protocol" tests/writing.browser.mjs`: 5/5. Reference empty tools remain 648px with 24px anchors at 360/390/416; content-heavy Protocol draft 678.78125px. Long Habit/Protocol fixture 1385.96875/1015.90625px, no nested scrollers. New glass Chapter cover retains 704px frame/24px inner anchor at 390x900. Shared geometry/motion tokens were not edited.

Attempts/fixes: initial TypeScript missing result-item type corrected; initial model test used the wrong compiler export and was corrected. Browser checks found ambiguous wrapped-select labels, a fixture that tried Continue on swipe-only information Pages, and a navigation-before-Undo race in the preceding schedule slice. Optional numeric input now preserves empty rather than inventing zero. Screenshot review corrected 44px-stretched checkbox proportions, inherited Record opacity and missing UTF-8 fixture response headers. `outputs/template-result.png` inspected. No broad optimization was justified.

Migration 004 remains unapplied remotely. Hosted template saves/publication, real contention, backup/restore and physical phones remain unverified; existing Habit source assertion and Protocol-history return gap remain open. Developer review precedes hosted migration/acceptance. Personal adoption/reflection saving and Explore composition are separate reviewed work.

## Routine scheduling — 2026-11-13

Approved standalone Routine schedule implementation on main/6a09b62 tracking fork/main. Synthetic account/browser storage only; remote requests intercepted. No hosted personal writes, migration, deployment or writing activation.

Commands use the bundled Node executable under CodexPrimaryRuntime.v26-1111-570-0 because the shell Node shim reports no runtime:

- `node --test tests/routine-schedule.test.mjs tests/habit-identity.test.mjs tests/week-planning.test.mjs`: 30/31. Four new schedule cases pass (inclusive dates/06:00, repeating task snapshots/Undo/archive/stale merge, once/finite habits, legacy/Week isolation). The recorded pre-existing Habit source assertion expecting an obsolete identity-animation expression fails; do not interpret as a runtime regression.
- `node node_modules/next/dist/bin/next build --webpack`: final production build and tsconfig.vercel TypeScript pass after the checkbox alignment fix.
- `node node_modules/eslint/bin/eslint.js app/os/routine-schedule.js app/os/routine-schedule-control.tsx app/os/circle-os-model.js app/os/circle-os-shell.tsx tests/routine-schedule.test.mjs`: pass.
- `CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="^Routine schedules|^tool consistency|^real Habit and Protocol" tests/writing.browser.mjs`: final CSS selection 5/5. Schedule choice, dated task completion and reload; matrix at 360/390/416px; long content without a nested scroller. Schedule screenshot `outputs/routine-schedule.png` inspected. Reference empty Note/Thoughts/Routine/Protocol-home frames remain 648px, 24px content anchors; content-heavy Protocol draft measures 678.78125px. Long Habit/Protocol fixture measures 1385.96875/1015.90625px with no nested scrolling. No shared minimum/anchor/motion tokens changed. The new schedule disclosure intentionally adds content beneath each standalone row, keeping its checkbox in the first row.

The earlier expanded selection including `^Routine redesign keeps` failed at a Protocol-history return visibility assertion after its Routine editing/tick/Undo checks. Baseline attribution remains unresolved; no full Routine/Protocol regression pass is claimed. Physical phones, other engines and hosted other-domain sync remain open. Existing clock-based merge limitations are not solved by these bounded local checks. No optimization was justified.

Final additional checks: `node --test tests/routine-schedule.test.mjs tests/circle-os-model.test.mjs tests/week-planning.test.mjs` passes 75/75. The scheduling browser case now also checks invalid-period errors and Record Undo after reload. Its first extension navigated before the completion control delivered Undo; waiting for the actual saved Undo before Back fixes the fixture sequence. The focused production-CSS case passes 1/1. No product code changed for that test correction.

Final review also made duration validation use the actual current Circle day, so an oversized period cannot pass a different reference date and fail during the state update. After this fix, production build/TypeScript, focused lint, the 75 model checks and the full five-case production-CSS selection all pass again.


## Hosted catalog acceptance — 2026-11-12

Developer reported successful manual migration 003 application, then explicitly
approved extending the runner and hosted synthetic testing/cleanup. No migrations
were reapplied. main/9f2425f; pre-existing uncommitted work preserved. Only runner
and setup/verification/continuity records changed in this pass.

With bundled Node first on PATH,
`node --env-file=.env.local scripts/check-content-admin-live.mjs --write --app --catalog`
passes **62 functional checks**, then exact cleanup and absence checks. Real
Supabase Auth/RPC/RLS/Storage and an isolated built Next server verify protected
drafts, retry/conflicts, Chapter image placement, v1/v2 publication and unchanged
v1 content, Article publication, signed-in HTTP Article reading and image signing/
download, signed-out reader/signing denial, ordinary/anonymous publication denial,
withdrawal/discovery removal, original-version reads, restore/discovery return
and grant revocation. Image bytes match the uploaded synthetic fixture.

Both accounts, temporary grant, two drafts, all synthetic versions/references,
image object/metadata and all receipts were removed; exact-ID absence checks
passed. The isolated server stopped. No credentials, signed URLs, private writing
or account IDs are recorded. No real authored item was published or touched.

Syntax and focused ESLint pass. `node --test tests/catalog-publication.test.mjs tests/catalog-routes.test.mjs`
passes 3/3. `git diff --check` passes. First sandbox attempt failed to reach the
services, logged no successful resource creation and ended with fetch/cleanup
errors. Approved outside-sandbox execution passed fully and confirmed cleanup.
No product code/migration changed; earlier build/browser evidence retains its
dated scope. Real URL expiry, true contention, full Reflect, backup/restore,
second invitation and physical phones remain open. No optimization was justified.
No staging, commit, deployment, personal migration or writing activation occurred.

## Catalog publication local checks — 2026-11-11

Developer approved repository implementation. Migration 003 is prepared only;
001/002 were not reapplied. Pre-existing work remains preserved. No hosted writes,
authored publication, personal migration, deployment or writing activation.

Bundled Node was invoked directly because the first PATH entry is an unavailable
nvm shim. `node --test tests/catalog-publication.test.mjs tests/catalog-routes.test.mjs tests/content-admin.test.mjs tests/content-admin-routes.test.mjs` passes
11/11. Real local SQL covers publication, stale edits, exact retry, v1/v2 content,
reader denial, published-image RLS, withdrawal/restore. Transpiled reader/media
routes verify identity, caller-token transport, no-store and targeted signing.
Storage tables are stand-ins, not hosted proof.

`node --test tests/content-admin.browser.mjs` passes 9/9 in isolated Chromium.
The new test loses a publication response, reloads, retries the exact operation,
then withdraws while retaining version links. Existing editor/Media/recovery cases
pass. Glass still measures 25px from outer edge and 704px high. Sandbox loopback
denial required approved outside-sandbox execution.

Production `node node_modules/next/dist/bin/next build --webpack` passes including
TypeScript. Initial Turbopack worker found the nvm shim; the first webpack build
hit sandbox mkdir EPERM. Final run used bundled Node first on PATH outside the
sandbox. Production TypeScript and focused lint pass; full tsconfig still reports
cloudflare:workers. Chapter compiler checks 33 sources/0 quests. No optimization
was justified. Full Reflect presentation, true contention, real URL expiration,
hosted policies, second invitation and physical phones remain unverified.

Additional production-CSS browser selections pass: Article exact-version reload
and targeted image retry; new Chapter reading/reload without creating evidence;
existing Chapter run reload and exact-definition hook resolution. Together with
the prior 9-case Admin run, these cover 12 distinct cases (not one full 12-case
invocation). The reader fixture initially ignored query parameters, then a test
incorrectly assumed a region role; both fixture assertions were corrected.
Final focused selection of Chapter/Article/publication passes 3/3, followed by
the existing-run case passing 1/1. The reader waits for local hydration; completed
runs are protected and new previews do not bypass Chapter delivery budgets.

## Article cover-first order - 2026-11-11

Developer approved cover image, title, summary, body in both Article editing and
reading preview. Reordered article-editor.tsx without changing saved data or CSS.
Extended the existing isolated new-content browser journey to fill/save/reload
Summary, verify editor and preview DOM order and measure ascending visible top
positions for image/title/summary. The first run exposed an ambiguous filled
Summary textarea label; explicit aria-label fixes it.

Final `node node_modules/next/dist/bin/next build` passes including TypeScript.
Focused ESLint on article-editor.tsx and content-admin.browser.mjs passes.
With installed Node v24.22.1, Playwright cache and `CIRCLE_PRODUCTION_CSS=1`,
`node --test --test-name-pattern='new chapter glass' tests/content-admin.browser.mjs`
passes 1/1 after the final rebuild. The synthetic 390px journey verifies actual
image loading, saved paragraph/summary restoration and visible cover-first order.
Screenshot outputs/new-article-glass.png was inspected. No remote writes occurred.
The exact repository preview process was stopped and restarted from this build
with a hidden window on port 3012; /os/admin returns HTTP 200. git diff --check
passes. No shared geometry, chapter definition or personal record changed;
physical-phone acceptance remains manual. No commit or deployment.

## New glass Chapters and Articles - 2026-11-11

Developer confirmed Media review and approved the editor/images proposal with
glass design for newly created Chapters and Articles only. Existing published
JSON, drafts and runs are not converted. New blank/template chapters and new
independent copies carry glass-v1; revisions of existing definitions retain
their design. Images retain stable asset references, alternative text, captions
and natural proportions. Articles use the existing account/tab recovery and
revision-checked shared save protocol, separated from Chapter lists.

Commands use installed Node v24.22.1 on PATH and the installed Playwright cache:

- `node node_modules/next/dist/bin/next build`: final pass including TypeScript.
- Focused ESLint on article-editor, content-media, account-admin, chapter-editor,
  chapter-authoring, chapter-player and new/updated tests: pass.
- `node --test tests/content-design.test.mjs tests/content-admin.test.mjs tests/content-admin-routes.test.mjs tests/chapter-engine.test.mjs`:
  23/23 pass. Tests verify legacy design preservation, new-copy defaults, image/
  design Markdown round trips, invalid alt rejection and existing access/retry/
  immutability behavior.
- `node scripts/chapter-compiler.mjs --check`: 33 sources/0 quests pass.
- With `CIRCLE_PRODUCTION_CSS=1`, `node --test tests/content-admin.browser.mjs`:
  8/8 pass. New 390px journey selects/saves a Chapter image, checks the glass
  marker, creates an Article paragraph/cover/caption, saves, reloads and verifies
  actual image loading and restored text. Seven existing Media/account cases
  pass. All transport is intercepted and synthetic; no hosted records are written.
- With compiled CSS, `node --test --test-name-pattern="tool consistency|shared App Box geometry|reading-only Chapter" tests/writing.browser.mjs`:
  7/7 pass. Reference Note, Deep Thoughts, Habit and Protocol remain 648px with
  24px content gaps at 360/390px; matrix includes 360/390/416px. Legacy reading
  cover/info retain their type scale.
- After the final glass-only cover anchor correction and production rebuild,
  `node --test --test-name-pattern='new chapter glass' tests/content-admin.browser.mjs`:
  1/1 pass; cover title top/left 25px from the outer frame (24px inside border),
  704px frame at 390x900. Screenshots inspected under ignored outputs:
  new-chapter-glass.png and new-article-glass.png. Full browser logs are
  content-glass-admin-final.log and content-glass-regression-final.log.

Initial sandbox loopback access failed; outside-sandbox checks pass. A sandbox
build stalled in CSS workers and was stopped; the outside-sandbox build passes.
Browser testing caught an ambiguous textarea label; screenshot review caught
missing Admin field styling and inherited old-cover spacing. These were fixed
and affected checks repeated. No measured optimization justified further changes.

No physical-phone or new hosted Article/image acceptance, broad-suite result,
publication, migration, deployment or writing-sync activation is claimed. Existing
session-expiry, backup/restore, contention and other device gaps remain. Catalog
publishing, reader/asset audience and withdrawal require their own reviewed slice.

## Media controls and gallery - 2026-11-11

**Approval/scope.** Developer approved the concrete Media control/gallery
proposal before edits. Existing uncommitted Admin code was preserved. The slice
changes account-admin.tsx, Media-only os-app.css selectors, the Admin browser
harness and continuity records. No server route, Storage policy, personal data,
publication or writing-sync activation changed.

Choose file opens the native picker and shows the filename plus accepted formats
and size. Upload image is a distinct Orange primary action, enabled only with
an image and nonblank alternative text. A separate busy flag prevents duplicate
submits even if a gallery copy action changes the status message. Upload failure
retains the same bytes, reference and description; success clears the actual
file input/state, announces success and refreshes the gallery. Per-image copy
actions retain full accessible descriptions. Previews crop within square tiles;
captions clamp to two lines. A missing signed preview keeps a square placeholder.

**Final checks.** Installed Node v24.22.1 with its directory first on PATH;
PLAYWRIGHT_BROWSERS_PATH points to the installed ms-playwright cache. Browser
checks use CIRCLE_PRODUCTION_CSS=1 and the final Next-generated CSS:

- `node node_modules/next/dist/bin/next build`: pass, including TypeScript.
- `node --test tests/content-admin.browser.mjs`: **7/7 pass**. Four Media
  journeys cover native pointer picker opening, Tab/focus outline, selected long
  filename, disabled blank description, distinct button styling, 44px targets,
  busy-state duplicate prevention, copy action during upload, retained retry
  payload, success reset, same-file reselection and gallery reload. The earlier
  three Admin draft/account-scope cases also pass. All HTTP is intercepted with
  synthetic accounts/images; external requests are blocked and no uncaught
  browser errors occur. This is UI evidence, not a new hosted upload check.
- `node --test --test-name-pattern="tool consistency|shared App Box geometry" tests/writing.browser.mjs`:
  **5/5 pass**, after the final scoped button-weight correction/rebuild. Matrix
  covers six tools/supporting views at 360/390/416px. Note, Deep Thoughts, Habit
  and Protocol retain 648px frames, 24px content gaps and no nested tool scrolling
  in the reference measurements at 360/390px. Shared tokens are unchanged.
- `node node_modules/eslint/bin/eslint.js app/os/admin/account-admin.tsx tests/content-admin.browser.mjs`:
  pass. Standalone `tsc --noEmit --incremental false -p tsconfig.vercel.json` also
  passed before the final CSS-only adjustment. Final build rechecks TypeScript.
- `git diff --check`: pass.

| Viewport | Columns | Square thumbnail edge | Gallery width |
| --- | --- | --- | --- |
| 360px | 3 | 101.33px | 328px |
| 416px | 3 | 120px | 384px |
| 640px | 4 | 102.5px | 446px |
| 1280px | 4 | 290.5px | 1198px |

The 640px viewport retains the existing narrow app shell; the desktop shell
expands at its existing breakpoint. Every gallery fills its shell's available
width within the existing gutters, with no horizontal document overflow. Final
360px/1280px screenshots were visually inspected. Ignored evidence:
`outputs/admin-media-{360,416,640,1280}-production.png`,
`outputs/media-admin-production.log`, `outputs/media-tool-geometry-production.log`.

**Attempts/limits.** Original three-case baseline passes outside the sandbox;
inside it Chromium receives ERR_NETWORK_ACCESS_DENIED. Turbopack's CSS worker
also fails to connect inside the sandbox; the approved outside-sandbox build
passes. Initial focus and shell-border assumptions were corrected in the
harness, which now includes the real globals/app-shell structure. Headless
keyboard picker activation was intermittent in an earlier fixture run; final
picker opening uses pointer activation and Tab focus is separately verified.
Synthetic SVG fixtures were corrected to fill their declared aspect ratios.
Visual review found the existing Admin font shorthand overriding the new action
weight; scoped specificity was corrected and both final browser selections were
rerun. No additional measured optimization was justified. Physical-phone/native
picker acceptance, other browser engines and broad-suite acceptance remain open.

The exact existing local Next process on port 3012 was identified/restarted from
the final passing build. Fresh /os/admin returns HTTP 200 and linked production
CSS contains os-admin-media-grid. This refreshed only the local preview; no
deployment or commit occurred. Developer phone review is the next acceptance.

## Hosted Content Admin setup - 2026-11-11

**Approval and preflight.** Developer approved hosted policy review, migration,
two requested account grants, the second account's invitation, and temporary
synthetic verification/cleanup. The authenticated CircleOS SQL console was used
through the computer-use skill. A read-only query confirmed all four checks:
new tables absent, new functions absent, bucket absent, and no existing Storage
object policies. Earlier user SQL queries were preserved in their original tab.
No credential, private writing, account address/UUID or signed URL is recorded.

**Applied changes.** `202611110001_content_admin.sql` succeeded transactionally.
The first hosted check then found missing service-role grants for bootstrap and
cleanup. Its cleanup stopped at that permission error; the two created synthetic
Auth accounts were identified by the exact fixture format/recent creation and
removed. No draft or image had been created. The already applied foundation was
preserved; `202611110002_content_admin_operations.sql` separately added trusted
bootstrap/inspection/cleanup grants and succeeded. Browser permissions remain
unchanged; the service role receives no publication/update grants.
The initial cleanup failure masked the first grant failure; the live script now
attempts every cleanup step even after an individual error, as recorded in the
completed hosted-session handoff.

The existing verified account received its content grant. Supabase accepted an
email invitation for the second requested account, whose grant remains gated by
email verification. A final metadata check confirmed both grants, the first
verified and the second invited/unverified. Receipt/delivery and first sign-in
on the second account remain user acceptance, not a claim from the API response.

**Final checks.** With bundled Node on PATH:

- `node --env-file=.env.local scripts/check-content-admin-live.mjs --write --app`:
  **38 functional checks passed**, followed by exact fixture cleanup and absence
  checks. It starts a separate built Next server on an ephemeral loopback port;
  that server stops afterward. Real Supabase accounts/tokens, RPC/RLS and Storage
  verify admin allow, ordinary/anonymous denial, draft save/reload/exact replay,
  stale-edit rejection, private bucket metadata, image upload/read/signing,
  overwrite/public-read denial and grant revocation. Actual production HTTP
  routes verify status, forged-cookie denial, draft save/retry/reload, Media
  listing and signed previews, same-byte upload retry, changed-byte rejection,
  and ordinary upload denial. No browser mocking substitutes for these backend
  checks. The preceding direct-only run passed 27 checks and cleaned its fixtures.
- `node --test tests/content-admin.test.mjs tests/content-admin-routes.test.mjs tests/quotes.test.mjs tests/admin-access.test.mjs`:
  **18/18 pass**, including the operations grant regression.
- Focused ESLint for the live script and migration tests passes. `git diff --check`
  passes. Earlier three Admin browser cases/types/builds retain their dated scopes;
  no new full-suite or physical-phone result is claimed.

Both successful runs removed their exact synthetic accounts, grant, draft,
receipts, asset metadata and image. Post-cleanup checks found no matching rows
or image/account resources. The final Auth inventory found zero `admin-check-*`
accounts, including the first failed attempt. No authored content was published,
personal records changed, writing activated, deployment made or commit created.

**Remaining limits.** Second invitation acceptance, actual session revocation,
signed-preview expiry, real database contention, operational backup/restore,
production-store/device recovery and physical phones remain unverified. Existing
CSS assertions and broader beta gaps remain separate. The owner's long-running
local preview initially returned 404 for the new Admin endpoint. After the final
Next build passed, its exact repository-owned `next start -p 3012` process was
restarted with a hidden window and output under ignored `outputs/`. A fresh
HTTP check returned the expected unauthenticated 403. Refreshing the browser
loads the new UI. No hosted deployment or personal-record test was performed.

## Account Content Admin foundation - 2026-11-11

**Continuation: account-switch readiness check.** Review identified that draft
JSON decoding could finish after the request-level scope check and cache data
under a newly selected account. Admin now captures its mount's owner scope,
rechecks it after decoding and replay receipts, and refuses stale recovery writes.
Media state updates also recheck the captured scope. The regression harness
pauses the decoded draft body, switches accounts, then releases it; no old draft
enters the next account cache. All three Admin browser cases pass after the fix,
including the existing 360px/1280px save/reload/Media journeys. The 17 focused
SQL/route/access checks pass again; final type and focused lint checks pass.
No shared geometry changed. Existing CSS-only assertion failures remain separate.

Read-only hosted checks requested zero table rows and received HTTP 404 for all
five new Admin tables. Account metadata checks confirmed the first requested
account exists with verified email; the second requested account does not yet
exist. Addresses, UUIDs and credentials are not recorded here. No table, bucket,
role, account or invitation was created. The Opera connector was unavailable;
no SQL-console connection is established. Hosted migration and invitations still
need the separately reviewed scope. No deployment or writing activation occurred.

Developer approved the concrete first repository implementation proposal. Started
main/9f2425f with a clean tree; no commit/deployment/hosted setup. Details and
remaining scope are in [Content Admin setup](CONTENT_ADMIN_SETUP.md).

The isolated browser harness mounts the real AccountAdmin/ChapterEditor, auth
context, account scope and Admin CSS. It supplies a synthetic token and intercepts
all Admin HTTP; external requests are blocked. Chromium at 360x900 and 1280x900
verifies online save, failed save with edited title retained, reload/reopening
the recovered draft, Media entry and a 44px upload button. Both cases pass.
This is mock-transport browser evidence, not hosted Supabase acceptance.

Focused commands use bundled Node with its bin directory first on PATH:

- `node --test tests/content-admin.test.mjs tests/content-admin-routes.test.mjs tests/quotes.test.mjs tests/admin-access.test.mjs`: 17/17 pass. Real PGlite migration/RLS/RPC execution covers admin/ordinary/missing identity, grant denial/removal, exact retry receipts, changed-payload/stale-edit rejection and version/asset mutation denial. Actual transpiled route handlers cover old-cookie/forged/unconfirmed denial, live role rechecks, invalid MIME rejection and byte-compared immutable upload retry. Storage tables are local stand-ins, not the hosted service.
- `node --test --test-name-pattern='editing a published chapter' tests/chapter-authoring.test.mjs`: 1/1 pass; source version/Pages stay independent.
- `node --test tests/content-admin.browser.mjs`: 2/2 pass with `PLAYWRIGHT_BROWSERS_PATH` pointing to installed Chromium. Network-dependent loopback checks needed approved execution outside the sandbox.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false -p tsconfig.vercel.json`: pass.
- `node node_modules/eslint/bin/eslint.js app/os/admin app/os/auth/account-menu.tsx tests/content-admin*.mjs`: final check recorded with the slice; no shell-wide lint pass is claimed.
- `node scripts/chapter-compiler.mjs --check`: 33 chapter sources and zero quests checked. This command's source inventory differs from bundled runtime versions.
- `node node_modules/next/dist/bin/next build` and `node node_modules/vinext/dist/cli.js build`: production builds pass; Vinext retains its existing unknown-route classification notice.

Initial failures: the shell Node shim could not locate Node 22; bundled Node
works. Turbopack's CSS workers needed the real runtime on PATH and approved
execution outside the sandbox. The initial browser harness emitted an untransformed
JSX syntax error; using the existing createElement harness pattern corrected it.
The migration test caught an ambiguous PL/pgSQL argument, which was qualified
and rechecked. Two unchanged CSS-only typography assertions in the full chapter
authoring test file still fail; the stylesheet is unchanged by this slice.
No full-suite pass is claimed. No measured performance problem justified optimization.

Local-first personal stores, 06:00 attribution, immutable existing chapters/runs,
readings and shared tool geometry are untouched. New published edits prepare a
new version; account catalog code cannot invoke personal run-reset/door publication.
Legacy local drafts are preserved without automatic import. Remote migration,
actual Storage access/retry, signed-preview expiry, session revocation, true lock
contention, backup/rollback and physical phones remain unverified. Existing
writing/sync/ResizeObserver/device gaps carry forward; writing activation is off.

## Protocol checkbox-only action and liquid words - 2026-11-11

**Approval/change.** Developer rejected whole-term word tapping as approved
behavior and requested its removal, plus Orange liquid words without a
strikethrough. `ProtocolBlock` now renders passive wording alongside a shared
row checkbox. Orange text overlays are aria-hidden; the ordinary words remain
the accessible content. Text and circle share the same clip polygons, 300ms
duration and easing. Reduced motion switches directly; forced colors preserve
the checked words. This also repairs checked fill/tick and press feedback.
Phase editing, next-day changes, completion evidence and day-seal are unchanged.

**Checks.** Installed Node v24.22.1 on PATH; final Next production build passed
with TypeScript. Confirmed compiled CSS contains the final specificity override
removing the old strikethrough. Focused Protocol ESLint and design checks 2/2
passed. With PLAYWRIGHT_BROWSERS_PATH set to the installed ms-playwright path
and CIRCLE_PRODUCTION_CSS=1, ran `node --test
--test-name-pattern="^Protocol interaction audit|^tool consistency|^Routine redesign"
tests/writing.browser.mjs`: 6/6 passed. Final `^Protocol interaction audit`
recheck passed 1/1 after adding the delayed inert-word assertion, explicit
Orange-color check and screenshot. Log: `outputs/protocol-checkbox-only.log`.

The real synthetic phase proves tapping words leaves state false, checkbox
press scales to .86, tick opacity becomes 1, and Orange word/checkbox clips
match during intermediate frames. Checked text decoration is none; text stays
visible. Checked face is a direct child, target width 44px and face 28px.
State survives reload and Space undoes it. Reduced-motion text duration is 0s.
Inspected `outputs/protocol-orange-words.png`. The 17-view matrix passes at
360/390/416px, retaining reference frames and 24px anchors. Routine/Protocol
editing, completing and reloading journeys pass at 360/390px.

**State/limits.** Sandbox compiler/loopback access required approved reruns.
Existing ResizeObserver notices and the earlier unrelated Habit source-string
test mismatch remain. Physical phones, other engines, hosted sync and broad
suite were not rerun. No optimization was justified. Owning design/Page/
decision records supersede the rejected whole-row rule. Local preview was
restarted with the final build on port 3012 and returned HTTP 200. No deployment,
staging, commit or personal-data edits; all earlier work is preserved.

## Checkbox edge seam and Protocol audit - 2026-11-11

**Scope.** Developer requested the unchecked Orange sliver/checked dark seam
fixed, and Protocol differences investigated and reported. Changed only shared
liquid clipping and browser coverage; Protocol code and behavior are unchanged.

**Reproduction and fix.** Against the prior compiled CSS, compared actual
checkbox screenshots with a fully hidden liquid (unchecked) or an unclipped
liquid (checked). Tested offsets 0/.25/.5/.75 and device scales 1/2/3: 24 cases.
At scale 3, offset .5, 38 unchecked and 76 checked pixels differed. Original
clip vertices touched the bottom/side paint boundaries. Moving those vertices
outside the box eliminated all 24 differences. No opacity fade, new delay,
geometry, color or persistence change. Kept 300ms liquid and immediate tick.
Scratch diagnostic: `outputs/checkbox-edge-diagnostic.cjs`; prior defect pixel
crops are `outputs/checkbox-edge-*.png` (ignored synthetic local evidence).

**Checks.** Used installed Node v24.22.1 on PATH,
`PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/ms-playwright`, and
`CIRCLE_PRODUCTION_CSS=1`. Final `node node_modules/next/dist/bin/next build`
passed including TypeScript; `node --test tests/app-design-system.test.mjs`
passed 2/2; `git diff --check` passed. Production browser command:
`node --test --test-name-pattern="^checkbox endpoints|^Protocol interaction audit|^shared checkbox|^tool consistency|^Week tasks fade" tests/writing.browser.mjs`.
Eight of nine passed initially. Week's <220ms sample was missed during the
combined run; isolated `^Week tasks fade` recheck passed, showing liquid and
text start together and run for 300ms. Nine distinct cases verified across
runs/recheck, not an initial 9/9 claim. Full log:
`outputs/checkbox-seam-checks.log`. Pixel regressions cover shared/native faces
at scales 1/2/3. Tool matrix covers 17 views at 360/390/416px, retaining 648px
resting reference frames and 24px content gaps. Shared check covers immediate
tick, 300ms liquid, reload, reduced preferences and native states.

**Protocol findings.** Actual synthetic phase had two terms. Tapping the term
wording toggled its state; the kept term survived reload and undo worked.
Nevertheless `aria-pressed=true` produced tick opacity 0 and the empty liquid
clip: the face is inside `.os-creative-button-label`, but shared checked CSS
uses a direct-child selector. This is an open feedback defect, correcting the
earlier verification gap (state/size were checked, checked paint was not).
Pressing Protocol's 292px-wide row left its 28px face at scale 1: the shared
.86 compression only targets `os-row-tick`. Also observed visible line-through
wording at opacity 1; no inline textarea on the daily front; explicit Edit.
Source and the Page standard confirm that full-row toggling, separate editing,
next-Circle-day term changes at 06:00 and the 900ms authored day-seal reward
are existing Protocol rules. Both shared-control defects remain open/report
only; do not silently change those product rules in the follow-up.

**Limits/state.** Browser checks use isolated synthetic account state and block
external backend/model requests. Sandbox compiler/browser access required
approved reruns. Existing ResizeObserver notices persist. Physical phones,
other browser engines, hosted sync and broad suite were not rerun. Earlier
unrelated Habit source-text test gap remains. No extra optimization justified.
Local Next preview on 3012 was restarted for this build; no deployment, staging,
commit or personal-data edits. Existing work is preserved.

## Shared Orange glass checkboxes - 2026-11-11

**Approval/change.** Developer reviewed the preview and requested every page,
with the liquid duration matching text departure. Existing shared duration is
300ms. Added `CheckboxFace`, reused by row buttons, Protocol and retained
Dreamline. Native admin checkboxes share the visual CSS. Orange 28px glass
rim, 22px liquid, 2px dark gap and immediate white Geist ✓ (Log's 16px/400
glyph). Kept domain actions, storage and hidden-feature flags.

**Verification.** Used installed Node v24.22.1, its directory on PATH and
`PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/ms-playwright`.
`node node_modules/next/dist/bin/next build` passed on final source, including
TypeScript. Focused ESLint passed for checkbox-face, button-engine,
protocol-page and dreamline-pages. `node --test tests/app-design-system.test.mjs`
passed 2/2. `git diff --check` passed.

With `CIRCLE_PRODUCTION_CSS=1`, ran `node --test
--test-name-pattern="^shared checkbox|^tool consistency|^Routine redesign|^Week tasks fade"
tests/writing.browser.mjs`: six passed; native glyph check initially failed
because fixture CSS omitted UTF-8. Corrected fixture response encoding.
Focused `^shared checkbox|^Routine controls press` recheck passed the checkbox
and ordinary press cases; reduced-motion press exposed a test that measured
before the opening frame settled. Added the existing `logSettled` precondition;
final `^Routine controls press` recheck passed 2/2. Nine distinct cases verified
across these runs, not a claim of an initial 9/9 pass.

Coverage includes actual Routine/Protocol edit/complete/undo/reload journeys,
Week task text and fill moving together over 300ms, immediate ticks, native
checkbox rendering/toggling, 28/22px geometry, glass, reduced transparency,
reduced motion, forced-color styling and fixed 44px press bounds. The six-tool
matrix checks 17 views at 360/390/416px; resting Note, Thoughts, Routine and
Protocol references remain 648px/24px. Content grows without nested panels.
Inspected `outputs/checkbox-routine.png`; full main-run log is
`outputs/checkbox-production-checks.log` (ignored local evidence).

**Attempts/gaps.** Sandbox blocked compiler workers and browser loopback;
authorized outside-sandbox reruns used the same isolated synthetic harness.
Corrected old pseudo-element measurements for the new real liquid/face nodes,
the Done/Undo locator change and native fixture encoding. An earlier header
reflection sample missed its animation; final 390px matrix recheck passed.
Global reduced-motion timing was overridden to direct checkbox endpoints.
Existing ResizeObserver notices remain. Focused Habit/Protocol/Week/design
selection passed 46/47: `arriving on the Page is not an event the identity
animates through` expects an obsolete source string in untouched shell code.
That source-test mismatch was not changed in this visual slice. Broad suite,
physical phones, other engines, full admin authoring, hosted sync and the
hidden Dreamline journey remain unverified. No performance change was justified.
No deployment, staging, commit or personal-data edits.

## Shared tool consistency and stale-code cleanup - 2026-11-11

**Approval and scope.** The developer approved the reviewed Note, Deep Thoughts,
Routine, Protocol, Log and Week consistency pass, including supporting views,
24px content anchors, shared controls/motion, tests and owning/session records.
They also requested scanning obsolete/conflicting code, naming Week's delayed
task text as an example. Main/eb38011; extensive pre-existing tracked/untracked
work is preserved. No staging, commit, push, deployment or personal-data edits.

**Implemented.** Opened tools and supporting views share 16px/700 headers,
24px content anchors, 600ms structural growth and the existing Page/swipe/back
engines. Protocol, Week History and writing sync reuse the header-light control.
Week tasks and goals start the same 300ms completion fade immediately; the
checkbox-first path and three-second goal dwell are removed. Retired unreachable
Week day-view state/rendering, unused callbacks and unused legacy Week CSS.
Week/Protocol completion controls share the 28px glass rim/22px fill. Protocol
creation/footer actions and Week review use the common 52px/12px glass action.
Deep Thoughts sync keeps its tool-family class. Preserved domain actions, local
evidence, contextual labels, immutable content and historical wording.

**Final checks.** All **41 distinct compiled-production-CSS browser cases are
verified across the main run and rechecks**, not a single 41-case command.
The main run passed 32/35; its three failing test setups subsequently passed.
The 9-case recheck passed 6/9; its remaining three passed in the final history
run. An audit of case names across these logs reports 41 passed, zero unresolved:

- `outputs/tool-consistency-production-final.log`: 35 cases, with
  `CIRCLE_PRODUCTION_CSS=1 node --test --test-reporter=tap --test-name-pattern="tool consistency|Week tasks fade|Week goals share|Week compact|shared App Box geometry|writing pair shares|full-page Log adoption|Week day-filtered|Task completion shares|Routine redesign keeps|Deep Thoughts History/Trash|normal-motion Quote flips|Note shares immediate|normal-motion writing cues|real Habit and Protocol|Routine Record uses|Protocol finished history|Protocol wording edits" tests/writing.browser.mjs`.
- `outputs/tool-consistency-production-recheck.log`: 9 cases, using pattern
  `tool consistency.*390|Week goals share.*reduce|Routine redesign keeps.*390|Log history reads all|Week history reads saved|Log corrections save`.
- `outputs/tool-consistency-history-final.log`: final **3/3**, using pattern
  `Log history reads all|Log corrections save.*390`.

Commands use installed Node v24.22.1 at
`C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`
and `PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/ms-playwright`.
Tests use actual components/stores, the compiled Next CSS, isolated synthetic
accounts, Asia/Bangkok and blocked external requests. The matrix covers 17
views at 360/390/416px, normal/reduced header reflection, keyboard/touch sizing,
primary actions and Week's Sunday review. Related cases cover Trash/restore,
offline evidence, corrections, reload, task links, read-only Protocol/Week/Log
history, long content, reversible completion and motion/preference fallbacks.

Focused command
`node --test tests/app-design-system.test.mjs tests/week-app.test.mjs tests/week-history.test.mjs tests/week-planning.test.mjs tests/week-refinement.test.mjs tests/goal-model.test.mjs tests/protocol-home.test.mjs`
passed **58/58** (`outputs/tool-consistency-models-final.log`). Shared style
checks were rerun after final CSS: **2/2**
(`outputs/tool-consistency-style-final.log`). Next build and its TypeScript
check passed (`outputs/tool-consistency-release-build.log`). Focused ESLint
passed without warnings (`outputs/tool-consistency-lint-final.log`).
Final read-only Node link/fragment audit passed 20/20 targets across updated
current sections/workflow; `git diff --check` passed.

**Measurements.** Note/Thoughts/Habit/Protocol rest at 648px at 360/390x844,
all with 24px foreheads and no nested scroll. The matrix checks 24px visible
header edges, 44px minimum targets, 16px/700/1.4 headers, 600ms growth ownership,
and 52px/12px/18px-bold full-width actions. Week retains its 24/44/64px action
columns, 28px rims and 24/12/8px group/goal-task/task-add rhythm. Text and fill
animate together after completion; no extra Week dwell remains. Synthetic
writing, Week and updated Protocol screenshots were visually inspected.

**Attempts and limits.** Earlier runs found stale 48px assertions, tests that
did not open the full-page Note, midnight current-hour assumptions, measurements
taken during travel/release, incomplete synthetic pointer sequences, reduced
motion removing a row before a sample, and nested App-back waits ending early.
Corrected the setup to use complete pointer sequences, settled geometry,
keyboard focus, accepted-state timing and the actual nested transition lifecycle.
Old source-string Week tests that required retired layouts/delays were replaced
by browser coverage; meaningful model checks remain. Removed one obsolete
Protocol source assertion about a retired aggregate summary. Visual QA caught
and corrected the remaining Protocol pill action. Node shim/compiler-worker
failures required the installed Node path/PATH and authorized outside-sandbox
reruns. Existing ResizeObserver notifications remain; physical phones, other
engines, real hosted sync and the broad suite are not certified. No further
performance optimization was justified.

**Preview and next.** Refreshed the identified existing Next preview on port
3012. HTTP 200 and zero asset-set differences against the final built os.html
were verified. Developer lived review at http://localhost:3012/os is next.

## Week corrected action anchors and header - 2026-11-10

Developer corrected the prior action alignment and explicitly approved the
diagram plus bold Routine Header. Goal cross/Add goal plus share 24px; goal
wording/Add goal label and task cross/Add step plus share 44px; task wording/
Add step label share 64px. Tasks are regular 18px/400; goals remain bold.
Week Header is bold 16px/700 and Header-to-heading gap is 24px. Removed Day's
Record Open Log button and its unused callback; footer Log cue remains.

Source-CSS and final compiled-CSS Chromium selections each passed 5/5:
`CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="Week compact|shared App Box geometry" tests/writing.browser.mjs`.
Environment: Asia/Bangkok, installed Chromium. Final log:
`outputs/week-corrected-production.log`; source log:
`outputs/week-corrected-source.log`. Next build/TypeScript passed
(`outputs/week-corrected-build.log`); focused ESLint including Week, shell and
browser tests passed (`outputs/week-corrected-lint.log`); design checks 2/2
passed (`outputs/week-corrected-design.log`).

At 360/390/416px every measured plus/cross and label/text offset is exactly
zero. Header-to-heading gap is 24px. Header weight is 700, task weight 400,
task size 18px, add label 16px/400. Existing 24px goal-group, 12px goal/task,
8px task/add gaps and right-aligned 28px rims at 24px remain verified. No Open
Log button exists in the unfolded record. Reference frames at 360/390px remain
648px tall with 48/48/24/48px foreheads and no inner scroll. Inspected synthetic
390px screenshot at `outputs/week-compact-390.png`; 360/416 images generated.

Sandbox blocked initial localhost and CSS-worker connections; authorized
reruns passed. Existing ResizeObserver notices persist. Physical phones,
keyboards, other engines, hosted sync and broad-suite acceptance remain
unverified. No further optimization justified. Next: developer lived review.
No staging, commit or deployment performed.

## Week indentation follows Routine - 2026-11-10

Developer approved the concrete indentation/spacing/typography scope before
editing. Week CSS now indents tasks 20px, aligning task clear glyphs to goal
wording and add controls to their respective text columns. Task text adopts
Routine's bold 18px Geist role. Existing filters/actions/persistence stay intact.

Verification: source-CSS browser selection passed 5/5; after adding explicit
type-role assertions, final compiled production-CSS selection passed 5/5:
`CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="Week compact|shared App Box geometry" tests/writing.browser.mjs`.
Both browser runs use Asia/Bangkok and the installed Chromium runtime. Logs:
`outputs/week-indent-source.log`, `outputs/week-indent-production.log`.
Next build/TypeScript passed (`outputs/week-indent-build.log`), focused ESLint
passed (`outputs/week-indent-lint.log`), and the two app design-system checks
passed (`outputs/week-indent-design.log`).

At 360/390/416px, goal/task crosses measure 24/44px from the inner frame border;
task cross aligns with goal wording, task wording is 20px farther inward, and
Add goal/Add step match goal/task wording exactly. Actual goal-group gap is
24px, goal-to-task 12px, task/add gaps 8px. All 28px checkbox rims retain the
24px right anchor. Task font is 18px/700 and add control 16px/400. Header insets
and Orange arrow gap remain 24px and about 4px. The four reference frames at
360/390px retain 648px heights, 48/48/24/48px foreheads and no inner scroll.
Synthetic screenshot `outputs/week-compact-390.png` visually inspected;
corresponding 360/416 screenshots are also generated.

Sandbox localhost access and build-worker startup failed; authorized external
reruns passed. Existing ResizeObserver notices remain. Physical phones,
keyboards, other browser engines, hosted sync and broad-suite acceptance were
not certified by this visual slice. No extra optimization was justified.
Next is developer lived review; no commit or deployment performed.

## Week compact rhythm and folded records - 2026-11-10

**Approved scope.** The developer requested the disclosure beside goal wording,
a shared goal/task checkbox column, tighter grid spacing, checkbox response
before Routine-style text departure, matching 24px Log/Week Header insets,
folded structured Day’s Record and History grouped by day then goal. They
clarified that crosses belong on goal/task rows like Routine, not Log activity
rows. Main/eb38011; all earlier tracked/untracked work preserved. No stage,
commit, deployment or hand edits to personal records.

**Implementation.** Clear crosses reuse Routine’s styling and archive handlers.
The arrow follows field-sized wording rather than occupying the checkbox column.
Both circles use 28px rims, 22px checked faces and at least 44px targets. Week
task completion persists immediately, retains the row during the existing
300ms checkbox response, then uses Routine’s 300ms opacity fade before release.
Routine’s default path and reduced-motion direct updates remain unchanged.
Padded Week editors opt into padding-aware shared textarea measurement; other
callers retain the previous sizing contract.

Day’s Record starts folded, resets folded on day selection and renders each
saved main activity beside its hour, with smaller moments below. It reads
logEntryWords and sorts by the existing Circle-hour helper, including after-
midnight hours. History derives event-day groups using the 06:00 boundary,
then nests each goal and its own tasks. Both levels start folded. Read-only
saved calendar weeks/reviews remain reachable under folded Saved weeks.

**Final verification.** Installed Node v24.22.1 with TZ=Asia/Bangkok and the
existing PLAYWRIGHT_BROWSERS_PATH cache:

`CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="Week compact|Week checkbox response|Week day-filtered|Week history|shared App Box geometry|full-page Log adoption" tests/writing.browser.mjs`

Final selection passes **16/16** (outputs/week-rhythm-production-final.log).
It covers 360/390/416px measured geometry, disclosure/day filtering, clear
actions and linked-task archive/history, structured folded records, nested
day/goal History, offline/account separation, reload/no-write history, long
records/resize, Log entry and unchanged reference App Boxes. Normal-motion
frame samples show intermediate checkbox fill with text opacity 1, followed
by text opacity falling while checkbox fill stays 1, then row removal.

`node --test tests/week-refinement.test.mjs tests/week-planning.test.mjs tests/goal-model.test.mjs tests/week-history.test.mjs tests/log-history.test.mjs tests/app-design-system.test.mjs`
passes **43/43** (outputs/week-rhythm-model.log). Added checks verify day/goal
grouping, ownership, no state mutation, 05:59/06:00 grouping and main/moment
hierarchy with Circle-hour order. Next build including TypeScript passes
(outputs/week-rhythm-build.log); focused ESLint includes the changed Week/
History/Log projection, sizing helper and tests (outputs/week-rhythm-lint.log).
Whitespace and document references are checked for delivery. No broader
performance optimization was justified.

**Measured and inspected.** Header glyph boxes are exactly 24px from the top/
right inner edges on both Pages. Arrow-to-goal-wording gap is about 4.005px;
goal/task rim ends and cross starts are exactly 24px inside the relevant edges.
Rims measure 28px. Goal-to-first-task gap is 12px; task-to-task gap is 4px.
Goal groups use 8px and major blocks 16px. Note/Thoughts/Habit/Protocol remain
648px at 360/390x844 with 48/48/24/48px foreheads. Synthetic
outputs/week-compact-{360,390,416}.png and
outputs/week-grouped-history-{360,390,416}.png inspected. Local Next preview
was refreshed on port 3012.

**Attempts and limits.** The first build needed an explicit return type for the
new grouping helper; corrected without changing data behavior. Initial Header
measurements caught swipe travel, so checks now await settled geometry. Padded
textarea measurement counted padding as an extra line; the guarded Week path
corrects it. The first compiled selection passed 15/16; one legacy History
reload hit the harness’s five-second startup wait. The loader/API and route
wait now matches initial setup, its focused recheck passed 2/2, and the final
full selection passed 16/16. Existing Vite ResizeObserver notices remain.
Physical phones/keyboards, other engines, hosted lifestyle sync and broad-suite/
beta acceptance remain unverified. Next: developer lived review of the compact
Week, completion sequence and folded History.

## Day-filtered Week refinement - 2026-11-10

Developer approved all goals on every day, tasks filtered by selected tab,
folded goals with only an Orange downward arrowhead, no task date selector,
past-day reading without new tasks, shared task removal/completion and History,
reliable empty-row cleanup, aligned text/checkboxes and a date-free day record.
The prior all-week step presentation and in-page completed section are superseded.
Main/eb38011; existing working changes preserved; nothing staged or deployed.

Week uses the existing shared task IDs. Completed and archived tasks leave both
live views. Clearing an authored goal archives linked unfinished tasks while
preserving words and links. Removed goals retain removedAt and are distinguished
from completed goals; no unfinished task is falsely marked complete. previousText
backs up saved wording until an edit ends. Untouched blank composers do not
become History entries. Guarded cleanup also repairs abandoned blank rows from
the earlier UI, while new/focused editors stay usable. History derives current
and past completion/removal rows from those records, with Circle-day labels such
as Write a note  Tue 10. Day titles remain stored and editable in Log but are
omitted with the date from Week's day record. The reverse tappable Log cue stays.

Focused model/design command:
`node --test tests/week-refinement.test.mjs tests/week-planning.test.mjs tests/goal-model.test.mjs tests/week-history.test.mjs tests/app-design-system.test.mjs`
passes 30/30 (outputs/week-refinement-model.log). It covers retained wording,
task identity/history, blank cleanup, parent removal and unfinished-task
preservation, plus the prior date/merge/06:00 and design checks.

Production-CSS selection uses installed Node v24.22.1, TZ=Asia/Bangkok and the
existing PLAYWRIGHT_BROWSERS_PATH cache:
`CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="Week day-filtered|Week history|shared App Box geometry" tests/writing.browser.mjs`
Final selection passes 9/9 (outputs/week-refinement-production-final.log). The nine cases
cover 360/390/416px disclosure/day filtering, creation in selected future days,
past-day restrictions, no date selectors, clearing tasks/goals, preserved History
words and compact dates, completion/reload, existing blank-row cleanup, archived
linked tasks, read-only/offline/account-separated/long History and shared geometry.
Next build/TypeScript and focused lint pass (outputs/week-refinement-build.log,
outputs/week-refinement-lint.log). Whitespace is checked before delivery.

Initial alignment checks caught an inherited 4px raised-button offset; Week now
centres the control shell and suppresses that offset. Final goal-row centre
measurements pass within 2px at all three widths. Reference Note/Thoughts/Habit/
Protocol frames retain 648px heights and 48/48/24/48px foreheads at 360/390x844.
The first corrected run reached the expected Tue 10 history label but failed an
over-escaped test regex; corrected the test. A normal-motion legacy History
fixture changed shape during asynchronous normalization; seed normalization now
precedes the no-write snapshot. Existing Vite ResizeObserver notices remain.
Physical phones/keyboards, other engines, hosted lifestyle sync and the broad
suite remain unverified. No broad optimization or review/Protocol change was
introduced. Next: developer lived review after local preview refresh.

## Week goals and lived records - 2026-11-10

**Approval and scope.** The developer approved the Week preview and interaction
description, correcting only the Log return to a bottom-left tappable swipe
cue. Main/eb38011; extensive pre-existing tracked/untracked work preserved.
No stage, commit, push, deployment or owner-data edits. Existing Sunday review
and next-week/Protocol outcomes are unchanged. The new WeekPage reuses the
frame, SwipeSession, App-back, inline editors, button engine and domain actions.

**Implemented.** Week range and readable dated rail; folding goal groups with
all their dated steps; inline edits and contextual creation; step moves within
the parent week; current-week completed goals and Undo; selected-day Log preview
and complete count; current-day Log travel and past-day reading/corrections
with direct return to Week. The previous Sunday stays reachable and clearly
marked Previous week. Goal-step updatedAt falls back to createdAt on older
records; merges preserve a later date assignment in either order. Task identity,
words, actual completion time and unfinished status are preserved by a move.
The accepted preview's Orange/no-tick completion face supersedes the Week trial.

**Final checks.** Commands use installed Node v24.22.1 directly, its directory
first on PATH, TZ=Asia/Bangkok and PLAYWRIGHT_BROWSERS_PATH pointing to the
existing ms-playwright cache. The following production-CSS selection passes
**18/18**, log outputs/week-redesign-production-final.log:

`CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="Week overview|Week selected-day|Week glass checkbox|Week history|shared App Box geometry|full-page Log adoption|Entry leaves Sunday" tests/writing.browser.mjs`

This uses actual components and minified Next CSS with the existing synthetic
account/router harness. Cases cover 360/390/416px planning, typing/focus,
fold/unfold, task moves and reload, exclusion from Routine on another day,
completion from Routine reflected in Week, Week completion reflected in the
same task, Undo, separate goal completion, preserved unfinished steps, current
completed-goal recovery and empty-row cleanup. They also cover correct selected
past-day Log reading, all nine activities versus a six-entry preview, correction
and return, offline reading, account isolation, genuine rail touch/trackpad
ownership, manual Sunday entry and read-only History across resize/long records.

`node --test tests/goal-model.test.mjs tests/week-history.test.mjs tests/week-planning.test.mjs tests/app-design-system.test.mjs` passes **25/25** (outputs/week-redesign-model.log).
New behavior checks cover invalid/out-of-week/unchanged moves, stale merge in
both orders and legacy fallback, task/evidence identity, full preview counts,
independent Log words, Sunday 20:00 planning and the 06:00 Circle-day boundary.
Next production build, including TypeScript, passes
(outputs/week-redesign-build.log). Focused ESLint for WeekPage, goal/week models,
LogHistoryPage and the two changed/new test files passes
(outputs/week-redesign-lint.log). Whitespace and local-document references are
checked for delivery. No broad performance optimization was justified.

**Measurements and visual review.** Day targets measure approximately
56x73.58px. The Log cue is 44x44px with its visible left mark exactly 24px
inside the frame at all three widths. Week has no vertical inner scroller or
horizontal frame overflow; the rail owns horizontal scrolling. Note, Thoughts,
Habit and Protocol remain 648px at 360/390x844, with 48/48/24/48px foreheads.
History's forehead remains 48px; long saved records grow naturally.
Synthetic outputs/week-overview-{360,390,416}.png inspected. The local Next
preview on 3012 was refreshed and the new Week view observed after Opera reload;
no personal records were edited during that observation.

**Attempts and gaps.** The first build hit the Node shim, then the sandbox CSS
worker failure; direct Node/PATH plus unrestricted execution passed. Browser
navigation was denied in the sandbox; isolated unrestricted runs block external
requests. Early checks found the Log cue narrower than 44px and screenshot
review exposed a duplicate visible accessibility label; both were corrected
before final compiled checks. The date wording and rail's initial Monday
position were corrected too. A second-account onboarding overlay broke the
test's single-root audit; account restoration and auditing all app roots fixed
the setup. Rapid test re-clicks during the shared button's busy period were
corrected to await aria-busy=false. Sunday entry works without writing a review.
The earlier compiled pass was 14/18; the final corrected selection is 18/18.
Existing Vite ResizeObserver notices remain. Physical phones/keyboards, other
engines, hosted lifestyle sync, broad-suite and beta acceptance remain unverified.
The earlier read-only review's legacy Week-suite failures are baseline evidence,
not a passing broad-suite claim. Next: developer lived review; review/planning
and Protocol separation requires a separate proposal.

## Log fixes and Week goal hierarchy - 2026-11-10

Developer approved the combined Log fixes, Week hierarchy and four-size/two-weight typography proposal. Implemented in circle-os-shell.tsx/os-app.css with focused writing.browser.mjs regressions. Log's empty-hour plus opens the main editor; populated hours add a moment. Saved main text, hours and plus share the first row; moment bullets and copy stay together. Week now starts with day/date/tabs, then one goal heading per group with selected-day steps, actions and The day. History is regular 16px. Content uses 28/18/16/12px and 400/700; reading/editing/placeholders retain matching roles. Existing task identity, completion/Undo, History and dates remain.

Final compiled-CSS Chromium selection passes 13/13; Next build including TypeScript, focused ESLint, design checks 2/2 and git diff --check pass. Exact browser selection: CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="Log quiet hour|Week glass checkbox|full-page Log adoption|shared App Box geometry|Log history" tests/writing.browser.mjs, using installed Node and Chromium cache. Logs: outputs/log-week-layout-{build,lint,design,final}.log. Tests cover empty-hour plus/main entry, main/moment save/reload, actual text-node vertical alignment, 24px right glyph anchors, four-size roles, Week ordering/History/cues/completion/Undo, corrections/offline/isolation and geometry. Note/Thoughts/Habit/Protocol remain 648px at 360/390x844 with 48/48/24/48px foreheads. Synthetic final Log/Week screenshots inspected. Source ink checks pass 3/3.

Earlier box-only alignment checks missed real text drift. Screenshot review caught wrapping bullets and first-row plus placement. New visible-text checks exposed inherited column direction on hour labels; corrected and final production checks pass. The measurement excludes the visually hidden current-hour prefix and allows the existing 1px control border in box-top comparisons. Existing Vite ResizeObserver notices remain; physical phones/keyboards, other engines, hosted sync and broad-suite/beta acceptance remain unverified. No broad optimization justified. No domain/storage/owner-data changes. Prior work preserved; no staging, commit or deployment. Local Next preview refreshed on 3012. Next: developer lived review of Log and Week.

## Log and Week controls refinement - 2026-11-10

Approved Log/Week refinement implemented in circle-os-shell.tsx and os-app.css; focused writing.browser.mjs journeys updated. Production Next build (including TypeScript), focused ESLint and design checks 2/2 pass. Final compiled-CSS Chromium selection passes 13/13 at 360/390/416px, covering Log recording/reload, edited/new moments, History/corrections, Week goal/step completion/Undo, conditional Add Step, History and return cue, and shared geometry. All four reference frames remain 648px at 360/390x844, with 48px foreheads except Routine's 24px. Range measurements verify plus and all three save glyph types at the 24px inner right anchor with 44px targets. Synthetic screenshots inspected.

Commands use installed Node v24.22.1 and PLAYWRIGHT_BROWSERS_PATH pointing to the installed cache. Final browser command: CIRCLE_PRODUCTION_CSS=1 node --test --test-name-pattern="Log quiet hour|Week glass checkbox|full-page Log adoption|shared App Box geometry|Log history" tests/writing.browser.mjs. Logs: outputs/log-week-refinement-{source,build,production,lint}.log and outputs/log-week-alignment.log. Initial source checks passed 9/9; alignment checks 2/2. Sandbox build worker/browser-cache failures required unrestricted execution. Initial design checks caught literal font/spacing values; shared-token corrections pass. The first compiled-CSS selection exposed two obsolete Now assertions in older History tests; updated and final 13/13 pass. Existing Vite ResizeObserver notices remain. Physical devices/keyboards, other engines, hosted sync and broad-suite/beta acceptance remain unverified. No broad optimization justified.

## Quiet Log controls and Week checkbox glass (2026-11-10)

Approved shell/CSS refinement removes Log hour rules and the current-hour arrow,
colors the current time Orange, adds a screen-reader prefix/aria-current=time,
uses shared glass Add hour actions and plain Orange inline save ticks. Week's
checkbox-only trial preserves the existing Orange rim, Ink fill and warm Bone
tick with glass reflection and reversible 300ms fade/slight expansion. Existing
goal/step actions, linked task identity and restored completion remain.

Installed Node v24.22.1, PLAYWRIGHT_BROWSERS_PATH pointing to the installed cache:

`node --test --test-name-pattern="Log quiet hour|Week glass checkbox|full-page Log adoption|shared App Box geometry" tests/writing.browser.mjs`

With CIRCLE_PRODUCTION_CSS=1, **9/9 pass** (outputs/log-week-controls-production.log).
Log checks cover 360/390px new controls, three-width write/moment/reload/Week/exit
journeys, range expansion, no visible rules/arrow and accessible current-hour
wording. New and edited moment saves remain functional. Save controls measure
16px Orange, transparent backgrounds and 44x44px targets. Add hour measures
52px height/12px radius with solid glass rim. Week goal/step controls remain
30x30px with at least 44px hit areas and 8px blur, Orange rims, checked Ink
rgb(25,24,19) and tick rgb(255,248,241).

Normal-motion samples show intermediate tick opacity on completion and Undo;
reduced-motion samples show endpoints directly. Reload restores the checked
step directly. Undo returns its same underlying Task to open. Reduced-
transparency checks verify opaque Ink/no blur; forced-color checks verify
distinct mark/fill colors. Four reference App Boxes at 360/390x844 remain
648px high: Note/Deep Thoughts/Protocol foreheads 48px, Routine 24px, no inner
scrollers. Synthetic Log/Week screenshots were inspected.

Baseline Log checks passed 3/3 against the previous production CSS. Initial
new source checks exposed an actual accessibility issue: aria-label on strong
was not exposed in the accessibility tree. Replaced it with a visually hidden
prefix, verified through the browser accessibility snapshot. The Week fixture
also expected pending rather than the model's existing open status; corrected
the assertion. Final source checks passed 4/4; final built-CSS selection 9/9.
Next build/TypeScript, focused shell/browser-test ESLint, design checks 2/2 and
whitespace pass. Logs: outputs/log-week-controls-{source,production,build}.log
and outputs/log-week-design.log. No broader optimization was justified.

Source inspection corrected the recommendation's filled-circle shorthand:
Week already had a Bone tick, which is preserved. Week's broader Page design
remains pending. Existing Vite ResizeObserver notices persist. Physical devices/
keyboards, other engines, hosted auth/sync and the full suite remain unverified.
No model/schema/persistence, owner-data, staging, commit or deployment change.
Prior tracked/untracked work remains. Local preview refreshed on port 3012.

## Full-page Log adoption and left Note cue (2026-11-10)

Approved shell/Log History/CSS slice implemented using the existing Page, swipe,
header-light, activity/moment editing and correction engines. Today opens Log
at #log; reload retains the selected pair index and root Today exits. History/
Now use sentence-case shared headers. Now retains its earlier top-right place.
Saved-day/correction views use the same glass/type/action family; Week's own
controls remain outside adoption. Deep Thoughts' Note cue is left aligned.

Installed Node v24.22.1 and installed PLAYWRIGHT_BROWSERS_PATH:

`node --test --test-name-pattern="full-page Log adoption|Log history|Log corrections|writing pair shares|shared App Box geometry|normal-motion writing cues" tests/writing.browser.mjs`

With CIRCLE_PRODUCTION_CSS=1, the initial run passed 15/17. Two test faults
remained: a long-day case tried to reopen a Log already opened by its shared
fixture; a writing case measured frame growth before its resize settled. Fixed
the setup and added an eventual-growth assertion. The targeted final command
`node --test --test-name-pattern="writing pair shares.*390|Log history grows" tests/writing.browser.mjs`
passes 2/2. All 17 selected cases are covered by the initial passes and affected
rechecks; counts are not separate unique suites. Logs: outputs/log-adoption-
production.log and outputs/log-adoption-recheck.log.

New journeys at 360x740, 390x844 and 416x844 verify Today entry, Header/Now,
activity and small-moment saves, reload, Week cue/gesture return and root exit.
Existing cases cover all recorded days, original dates/legacy moments, no-write
browsing, offline/account separation, text correction/save/cancel/reload,
stale-edit rejection, clearing/merge safety, left Note cue/gap and normal-motion
travel. Synthetic screenshots outputs/log-adoption-*.png were inspected.

Log heights with the fixture's real hour rows: 1544.56/1541.34/1549.22px at the
three widths; forehead 48px, Bone color, zero inner scrollers. A 24-entry saved
day grows to 5680.44px at 360px and 4359.69px at 390px, with no horizontal or
inner scrolling overflow. Four reference frames remain 648px at 844px viewport
height: Note/Deep Thoughts/Protocol foreheads 48px, Routine 24px. The moved Note
cue has a 24px left inset, 44px target and unchanged 38.016px visible action gap.

Next production build/TypeScript, targeted ESLint, log-history/design tests
13/13 and whitespace pass. Source baseline passed 3/4; one existing correction
case timed out taking an unstable screenshot. Both final production correction
cases pass. Earlier source adoption faults were incorrect shared-class assertions;
the test now checks Week explicitly. No data/model/schema/sync/chapter change,
owner-data edit, staging, commit or deployment. Existing Vite ResizeObserver
notices remain. Physical devices/keyboards, other engines, hosted sync and the
full suite remain unverified. No broader optimization was justified.

The confirmed local Next process was refreshed on port 3012. A fresh isolated
390x844 browser loaded /os#log with HTTP 200 and no page errors, with external/
API requests blocked. This checks the production client load, without hosted
account/device sync acceptance or edits to owner records.

## Deep Thoughts and writing-pair cues (2026-11-10)

Approved adoption verified with actual components/stores, synthetic isolated
accounts and blocked external traffic. Deep Thoughts uses the Note glass family,
Quote/History Header, full-width question/body-scale answer and shared actions.
Today offers the writing pair. RoutineSwipeCue drives Note/Deep Thoughts through
the existing swipe index action; #thoughts reloads Deep Thoughts and root Today
navigation exits it. Note retains Back. Quote keeps its existing flip, reactions
and return to the same question/unfinished answer without submission.

Installed Node v24.22.1, with PLAYWRIGHT_BROWSERS_PATH set to the installed cache:

`node --test --test-name-pattern="writing pair shares|full-page Note is button-only|shared App Box geometry|Deep Thoughts History/Trash|Quote visits rotate|normal-motion Quote flips|normal-motion Deep Thoughts waits|Routine approved edges|automatic writing Sparks|bottom navigation" tests/writing.browser.mjs`

With CIRCLE_PRODUCTION_CSS=1, **21/21 pass** against final Next-built CSS
(outputs/deep-thoughts-production.log). New pair journeys cover 360x740,
390x844 and 416x844: entry/cues/swipes, Note persistence, Deep Thoughts draft
reload, same-question Quote return, long natural growth, Send, correction,
Next question, direct entry and root exit. Supporting cases verify History/
Trash/Restore/permanent deletion, offline/empty quotes, durable-acceptance and
normal-motion flips, unchanged Spark pause, navigation and four-frame geometry.

An additional production-CSS command,
`node --test --test-name-pattern="normal-motion writing cues" tests/writing.browser.mjs`,
passes 1/1 (outputs/deep-thoughts-motion.log). Intermediate-frame samples verify
forward/back cue taps and forward/back wheel gestures: each shows up to 30.6px
of actual Page travel, returns to its anchor, keeps the 648px frame at y=74px
and clips travel inside the shared frame. Note words survive all four moves.

| Measurement | Result |
| --- | --- |
| New habit-to-Tasks layout gap | 40px |
| Visible heading gap / Routine cue / both writing cues | 38px / 38.016px / 38.016px |
| Writing cue right inset / touch height | 24px / 44px |
| Writing action height | 52px |
| Note/Deep Thoughts/Routine/Protocol frame floor at 390x844 | 648px each |
| All four floors at 360x740 | 544px each |
| Note/Deep Thoughts/Protocol forehead / Routine forehead | 48px / 24px |
| Long Deep Thoughts frames at 360/390/416px | 1038.33 / 1065.75 / 1072.22px |
| Inner scrolling panels in long writing | 0 |

The 40px layout token is shared. Cue hit areas enter its upper gap; a static
2px optical shift matches Geist's heading/cue ink. Short Routine content now
follows Add task with this gap and leaves unused minimum-frame room below the
cue, superseding the old fixed bottom inset. Writing retains its bottom action/
cue group. Synthetic screenshots in outputs/writing-pair-{routine,note,deep}-*.png
were inspected; the new Deep Thoughts heading/body and stable single frame are
readable. Baseline full-page/geometry checks passed 5/5 before edits; the initial
new source checks exposed cue optical/CSS-specificity mismatches, then passed
3/3 after correction. Final production checks verify the later implementation.

Next production build including TypeScript, targeted ESLint on shell/writing/
shared controls/browser tests, design rules 2/2 and whitespace pass. The first
build hit the Node version shim; selecting installed Node in PATH fixed that,
then the sandbox blocked Turbopack's CSS worker. The authorized unrestricted
build passed. Browser localhost access also required unrestricted execution.
No broad optimization was justified. Existing Vite ResizeObserver notices
remain; no physical keyboard/device, other-engine, hosted auth/sync, full-suite
or beta-readiness claim. No owner records, schema, sync activation, content
versions, staging, commit or deployment changed. Existing work was preserved.

The confirmed older preview process on port 3012 was refreshed after an initial
EADDRINUSE attempt. A fresh isolated 390x844 browser with external/API traffic
blocked loads localhost:3012/os#thoughts with HTTP 200 and no page errors. This
is a production-client load check, not signed-in device/sync acceptance.

## Automatic writing Sparks paused (2026-11-10)

Approved temporary pause verified with actual published spark-animal-today@1
and spark-brain-noise@1 definitions, public on-view publications to Note and
Thoughts, and an unfinished animal Spark. With CIRCLE_PRODUCTION_CSS=1 and
PLAYWRIGHT_BROWSERS_PATH pointing to the installed browser cache:

`node --test --test-name-pattern="automatic writing Sparks" tests/writing.browser.mjs`

Installed Node v24.22.1: passed 2/2 at 360/390x844. The ordinary Note editor
opens without either question; text saves and survives reload; the unfinished
Spark run remains byte-for-byte unchanged; Deep Thoughts still shows its
separate question. Uses isolated synthetic account data and blocked external
requests, actual components/stores and Next-built production CSS. No live
AI/provider, hosted sync or personal profile data is involved. Initial fixture
attempts used the wrong brain-noise ID and lacked chapterRunId/createChapterRun
exports in the harness; corrected before final passing run. No product change
was needed to correct the fixture. Next build including TypeScript and focused
shell/test ESLint passed. No geometry changes or new measurements required.
No broad optimization justified; physical devices, hosted sync, broad suite and
Vinext build remain unverified. Existing geometry/runtime gaps remain in prior
entries. All previous working changes preserved; no staging/commit/deployment.

## Navigation and App Box matching glass (2026-11-10)

Approved material/spacing refinement implemented in os-app.css and the existing
RoutineThreadBackground shell measurement helper. The bar uses the panel's
background/wash, rim, shadow, radius and blur tokens. Its side edges follow the
opened frame; root pages use their content gutters. Focused frame sizing now
reserves the bar and a 16px gap. Note's inherited outer 8px top padding is removed.
This supersedes earlier 666px/562px focused floors in prior entries. Existing
foreheads, icons, labels, domain actions and natural long-content growth remain.

Final command, with installed Node v24.22.1, PLAYWRIGHT_BROWSERS_PATH pointing to
the user's ms-playwright cache, and CIRCLE_PRODUCTION_CSS=1:

`node --test --test-name-pattern="bottom navigation|full-page Note is button-only|shared App Box geometry" tests/writing.browser.mjs`

Passed 8/8 against final Next-built CSS and actual components/stores in isolated
synthetic accounts. Checks include computed rim/radius/shadow/backdrop-filter
equality, matching left/width, a 16px resting gap, all four routes, accepted writing
across route switches, simulated keyboard hiding, long-content Footer clearance,
reload, History/Trash/Restore and manual swipe geometry. Resting measurements:

| Viewport | Frame x / width / height | Nav x / width / y | Gap |
| --- | --- | --- | --- |
| 360x844 | 24 / 312 / 648 | 24 / 312 / 738 | 16 |
| 390x844 | 24 / 342 / 648 | 24 / 342 / 738 | 16 |
| 416x844 | 24 / 368 / 648 | 24 / 368 / 738 | 16 |
| 1280x900 resize | 49 / 652.953 / 665 | 49 / 652.953 / 794 | 16 |

At 360x740, the shared focused frame is 544px. At both 360x844 and 390x844,
Note/Thoughts/Habit/Protocol each measure 648px, with foreheads 48/48/24/48px
and no inner scroll panel. Inspected final outputs/navigation-paired-rest-390.png
and the phone/desktop resize evidence. Final build including TypeScript passed;
focused ESLint for shell/test passed; design checks passed 2/2; whitespace passed.
Local production preview refreshed on 3012 outside the sandbox.

Initial checks caught Note's extra padding, a route-transform measurement that
could alter the resting floor, desktop shell-border accounting, and temporary
height measurements before existing transitions settled. Fixed those causes;
the focused floor now uses the tool root's layout offsets, including parent
borders, rather than a moving Page or the temporary outer Deep Thoughts Back.
Checks wait for the established resting state before comparing geometry. The
final complete production-CSS run passed after these fixes. Existing Vite
ResizeObserver notifications remain, particularly during resizing. Physical
devices/keyboards, other engines, real hosted sync, broad suite and Vinext build
remain unverified. No merging animation or broad optimization was added. Prior
tracked/untracked work is preserved; nothing staged, committed or deployed.

## Hide Line below New Note (2026-11-10)

Developer requested removing the Line action and hiding jokes/facts pending a
future presentation decision. Removed the secondary Note Footer action only;
content/store identifiers remain. New Note is the only Footer action. Updated
the existing full-page phone checks to assert no Line/Show a Line action or
Line Page is exposed. Deep Thoughts quotes are unchanged.

With PowerShell `$env:CIRCLE_PRODUCTION_CSS = '1'`, installed Node runs
`--test --test-name-pattern="full-page Note is" tests/writing.browser.mjs`:
3/3 pass (outputs/note-hide-line-production.log). This also rechecks writing,
History/Trash/Restore, reload, Back and the shared full-page floors at 360x740,
390x844 and 416x844. Floors remain 562/666/666px, foreheads 48px, and long Note
has no inner scroller. Its long fixture is 52px shorter after action removal.
Next build including TypeScript, targeted ESLint and whitespace pass. The old
preview was paused during build and replaced with one current server on port
3012. Fresh Chromium at the exact localhost URL renders the sign-in screen
with no asset/client failures; this is not signed-in hosted acceptance.

Synthetic fixtures only. Physical-keyboard, other-engine, hosted-sync and
existing ResizeObserver gaps remain as recorded above/below. No content,
owner records, stage, commit or deployment changed. No optimization warranted.

## Full-page Note and button-only Today (2026-11-10)

Developer approved replacing Note's inline preview and compact cap with the
Routine/Protocol full-page floor and natural growth. Note stays mounted but
invisible/inert on Today, with its entry visible. Back moves into the editor
Header; History stays opposite. Footer New Note remains primary and Line text
preserves content access. The shared deck keeps one floor during manual travel;
neighboring content/control design remains its own slice. No store/schema change.

Using installed Node recorded below,
`node --test --test-name-pattern="full-page Note is" tests/writing.browser.mjs`
passes 3/3 against source (outputs/note-full-page-final-source.log) and 3/3 with
PowerShell `$env:CIRCLE_PRODUCTION_CSS = '1'`
(outputs/note-full-page-production.log). Each phone case uses the actual Today
entry and checks hidden surrounding tools, writing/autosave, long natural growth,
New Note, History/Trash/Restore, Line and its return, reload, Routine/Protocol
and browser Back. All evidence is synthetic with mocked transport.

| Viewport | Empty Note / Thoughts / Routine / Protocol frame floor | Long Note height | Inner scrollers |
| --- | --- | --- | --- |
| 360x740 | 562px each | 2483.875px | 0 |
| 390x844 | 666px each | 2483.875px | 0 |
| 416x844 | 666px each | 1403.875px | 0 |

Note/Thoughts/Protocol foreheads measure 48px. Routine keeps its existing 24px
exception; its CSS/behavior is unchanged. Frame growth is downward. Inspected
outputs/note-full-page-written-390.png: one frame with Back/History and bottom
New Note/Line. Empty/written screenshots exist for all three widths.
Next production build/TypeScript, targeted ESLint on shell/writing/browser test,
app-design-system 2/2 and whitespace pass. The first patch failed atomically on
an incorrect context and was reapplied. Initial source checks passed 3/3, then
the extended four-frame/Line checks passed against source and production CSS.
No performance change was justified.

The current preview was stopped during build and restarted once on port 3012,
avoiding the earlier stale IPv6/IPv4 pair. Broad historical browser scenarios
that assume inline/compact Note were not migrated or run in this focused slice;
the new three phone cases replace that sizing expectation. Physical keyboards,
other engines, hosted auth/sync and the 06:00 boundary remain unverified. Existing
Vite ResizeObserver notifications remain. No owner records, stage, commit or
deployment changed. Product/design/Page and continuity records were updated.

## Temporary Today Note entry (2026-11-10)

Developer requested a temporary Note entry like Routine/Protocol and deferred
Today redesign. Added a full-width Note button above that pair. #note opens the
existing deck in a focused view with Back to Today; other sections stay mounted
but hidden. Existing writing bounds and stores are retained. The opened view
pauses idle turning; ordinary Today behavior is unchanged.

`node --test --test-name-pattern="temporary Today Note entry|shared App Box geometry" tests/writing.browser.mjs`
passes 3/3 using the installed Node runtime recorded below and isolated Chromium.
The new path checks actual button entry, hidden surrounding tools, Back, saved
writing/reopen/reload, selection of Note after Deep Thoughts and browser Back.
Shared 346/346/666/666px heights and 48/48/24/48px foreheads remain at 360/390px.
Attempts to return automatic focus to the button failed; that optional behavior
was removed rather than claimed verified. Visible Back and text retention pass.
Final production-CSS recheck passes 3/3 (outputs/note-entry-production.log).
Next production build including TypeScript, targeted lint, design checks 2/2
and whitespace pass. Synthetic data only; no owner records, commit or deployment.
Existing ResizeObserver/device/hosted-sync gaps remain.

## Note adopts the Routine visual standard (2026-11-10)

Approved first redesign slice: account Note and its supporting views adopt
Routine's visual language. Panel/action material tokens are shared; the account
check-in deck owns one stable glass frame through Note/Line/Deep Thoughts travel.
Neighboring content layouts and the existing idle policy remain unchanged.

Baseline `node --test --test-name-pattern="Note, History and Trash stay bounded|shared App Box geometry" tests/writing.browser.mjs`
passed **4/4** before application edits (outputs/note-redesign-baseline.log).
Commands use installed Node
`C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`;
the ordinary launcher failed. Prepending that directory to PATH lets Next's
child workers find Node. Sandbox browser lookup/CSS-worker attempts failed;
successful browser/build commands used approved execution outside the sandbox.

Final production-CSS browser command passes **29/29**
(outputs/note-redesign-production-final.log). Set PowerShell
`$env:CIRCLE_PRODUCTION_CSS = '1'` and run the installed Node with:

```text
--test --test-name-pattern="Note adopts Routine|Note shares immediate|shared App Box geometry|Note header alignment|Note, History and Trash stay bounded|Note autosaves silently|New Note flushes|Note Line keeps|Deep Thoughts History/Trash|Routine fixed threads|Routine approved edges|Routine header reflection|older Note recovery|another tab's correction|leaving Note|new typing during delayed autosave|erasing a new Note|account change closes autosave|History bins move" tests/writing.browser.mjs
```

`node node_modules/next/dist/bin/next build` passes including TypeScript.
Targeted ESLint for writing-pages.tsx, routine-controls.tsx, circle-os-shell.tsx
and writing.browser.mjs passes. `node --test tests/app-design-system.test.mjs`
passes **2/2**. No dependency, provider, store or schema changed.

At 360x740, 390x844 and 416x844, empty Note rests at 346px. Actions are 52px
with 12px corners and visible 24px side anchors. Header wording is 16px/700
at matching 24px edges; History times use 12px. Note/Routine computed panel
backgrounds, borders and shadows match. At 360/390x844, Note/Thoughts/Habit/
Protocol heights remain 346/346/666/666px and foreheads 48/48/24/48px. Long
Note/History/Trash keep one Body scroller and fixed Header/Footer, capped at
480px or 400.1875px for 390x844/360x667. At a 560px viewport, controls remain
reachable. Routine background bounds/filtering also pass at 360/390/1280px.

Browser paths cover offline autosave/clearing/reload, delayed/failed saves,
older recovery, conflicts, account switching, History/Trash/restore/delete,
Line exits, neighboring Deep Thoughts, Routine navigation, header reflection,
reduced preferences and forced colors. Inspected synthetic screenshots:
outputs/note-glass-empty-360.png, note-glass-writing-390.png,
note-glass-history-390.png and note-bounded-trash-390.png.

Attempts: the first source run passed 14/15. The new test used an unsupported
emulateMedia transparency option; CDP now sets and verifies that preference.
An early return click raced the existing App-back handoff; the test waits for
its settled class. Initial production checks passed 25/27 and found a real new
pressed-state specificity defect under reduced motion. Giving that fallback
priority fixes it. Fast-clear/History also failed once. The pre-session Note
source and current source each passed that case in isolation; the affected
source recheck passed 2/2, and the final 29/29 includes it. No save/navigation
behavior was changed to conceal that non-reproduced timing failure. The first
documentation patch failed atomically on a mismatched heading; corrected and
reapplied without overwriting existing entries.

Existing Vite ResizeObserver notifications remain. These checks use isolated
Chromium fixtures and mocked transport with production CSS; they do not certify
hosted/auth/sync behavior. Actual device keyboards, other engines, 06:00 rollover
and lived visual acceptance remain open. No broad optimization was justified.
Existing working changes were preserved; no stage, commit, deployment or owner
record write occurred.

## Slim actions, bold headers and first-entry phone fit (2026-11-10)

Approved: 52px actions/12px corners, existing 18px bold labels/24px gutters and
finish, 16px/700 Back/Record with existing directional text light; standardize
the reusable appearance and interaction rules for later page-by-page adoption.
No frame floor, outer padding or data-model change was required.

Using installed Node v24.22.1 and the existing ms-playwright cache, Next build
and TypeScript pass (outputs/routine-slim-build.log). Targeted ESLint covers
routine-controls.tsx, circle-os-shell.tsx, app-session.tsx and protocol-page.tsx
(routine-slim-lint.log). `node --test tests/app-design-system.test.mjs` passes 2/2.
Whitespace passes. Root glass tokens are consumed by the approved controls/frame;
other pages keep their previous style until reviewed migration.

CIRCLE_PRODUCTION_CSS=1, `node --test --test-name-pattern="Routine first entries|
Routine approved edges|Routine header reflection|shared App Box geometry|Small
cross stays|Record matches Habits|Routine controls press|Task completion shares|
Habit result fades|Routine resize survives|real Habit and Protocol|Routine
reduced transparency" tests/writing.browser.mjs` passes 22/22
(routine-slim-production.log). Actual 52px/12px action geometry, bold Back/Record,
24px anchors, cue bounds, text-reflection directions, reduced motion/transparency,
completion/Undo, resizing, Record and manual navigation pass.

The final affected `Routine first entries` selection passes 3/3 against built
production CSS (routine-slim-entry-journey.log). Each viewport checks empty,
one Habit, one Task, and one of each by clicking actual New habit/Add task,
typing a short action/cue/task and leaving the editor. Synthetic fixture resets
isolate each state and mocked transport prevents external evidence writes.
Keyboard is closed. Every state yields:

| Viewport | Document height | Frame top / height / bottom |
| --- | --- | --- |
| 360x740 | 740px | 74 / 562 / 636px |
| 390x844 | 844px | 74 / 666 / 740px |
| 416x844 | 844px | 74 / 666 / 740px |

Thus the first short entries do not introduce whole-page scrolling. This is
not a guarantee for arbitrary wording, many entries or an open device keyboard.
The updated synthetic routine-approved-390.png was inspected: straight-sided
Slim controls, bold Back/Record and the current cue are visible.

Resting Note/Thoughts/Habit/Protocol sizes remain 346/346/666/666px and foreheads
48/48/24/48px at 360/390x844. Real Habit/Protocol rows grow to 975.56/959.91px in
the selected long-content fixtures, without nested scrolling. Initial header
bold specificity failed two press tests; corrected before the production run.
The first fit pass used stored fixture rows; the final recheck uses real typing
journeys. Existing Vite ResizeObserver notifications and device/other-engine/
hosted-sync gaps remain. No personal data, stage, commit or deployment.

## Routine visual trial and visible 24px anchors (2026-11-10)

Approved: softer shared panel, 64px creation buttons/18px bold labels/24px side
gaps, 40px section gap, stronger small controls, text-only directional header
light and tappable footer cues. Developer explicitly kept crosses at 24px and
row copy at 44px. Existing silver highlights/shadows and data behavior remain.

Used installed Node v24.22.1 and PLAYWRIGHT_BROWSERS_PATH=
`C:/Users/wickie''/AppData/Local/ms-playwright`. Production build command:
`node node_modules/next/dist/bin/next build` (routine-approved-build.log).
TypeScript passes as part of build. Targeted ESLint covers routine-controls,
circle-os-shell, app-session and protocol-page (routine-approved-lint.log).
`node --test tests/app-design-system.test.mjs` passes 2/2.

With CIRCLE_PRODUCTION_CSS=1, `node --test --test-name-pattern="Routine approved
edges|Routine header reflection|shared App Box geometry|Small cross stays|Record
matches Habits|Routine controls press|Task completion shares|Habit result fades|
Routine resize survives|real Habit and Protocol|Routine reduced transparency"
tests/writing.browser.mjs` passes 19/19 (routine-approved-production.log).
After the final cue padding correction, the affected pattern `Routine approved
edges|Routine header reflection|shared App Box geometry` passes 6/6 against the
rebuilt production CSS (routine-approved-final.log). Final design checks 2/2.

Measured at 360/390/416px: creation faces 64px high, Geist 18px, equal 24px
inside-border side gaps, widths 262/292/318px. Header labels, cross glyphs,
completion rims and cues meet their 24px anchors. Cross-to-copy offset remains
20px and visual gap 12px. Cue text/arrow gap is 4px; forward chevron's actual
element bounds are 24px from inside right and bottom borders. Tap cues use
existing switching; Record and Back return without changing Habit evidence.
Header native animations have complementary directions, 240ms duration and
text clipping; reduced motion omits them. Screenshots routine-approved-360,
-390 and -416.png use synthetic evidence; the 390px result was inspected.

At 360/390px, Note/Thoughts/Habit/Protocol resting heights remain
346/346/666/666px and forehead gaps 48/48/24/48px. Real Habit/Protocol content
grows without nested scroll (measured 1015.56/975.91px in the broader selection).
Existing completion/Undo, resizing, reduced transparency and type audits pass.

Attempts: sandbox denied browser localhost and the Turbopack CSS worker;
escalated runs passed. Initial Back text was 3.25px inward. Visual inspection
then exposed inherited footer action padding around the cue despite correct
button bounds; its visible arrow was corrected and remeasured. A new polling
assertion's syntax error and one Node-path quoting error were corrected.
Existing Vite ResizeObserver loop notifications persist. Owner data untouched;
physical-device, other-engine and actual hosted sync acceptance remain open.
No further optimization justified. Preview 3012 refreshed; no commit/deploy.

## Centered Routine buttons and reversed fades (2026-11-10)

**Approved behavior.** Creation faces have equal 48px inside-border side gaps,
48px height and existing 16px/700 labels/shadows. Habit check/uncheck should
feel like reversed motion; keep 300ms fades, response hold and 600ms settle.

**Change.** os-app.css uses 24px button side margins within existing 24px Page
padding. Checked results now enter with ease-in; uncheck and Task exits retain
ease-out. Both previously used ease-out, making incoming text readable early.
No runtime state or persistence code changed in this slice.

**Commands/results.** Installed Node v24.22.1, ms-playwright cache and
CIRCLE_PRODUCTION_CSS=1. node --test --test-reporter=tap with pattern
"Habit result fades|Habit completion hides|Routine controls press|Record matches Habits|shared App Box geometry|Task completion shares|Routine resize survives"
against tests/writing.browser.mjs passes 13/13 (outputs/routine-centered-browser.log).
Tests verify real incoming ease-in/outgoing ease-out transitions, complementary
native progress and opacity, no overlap, live/restored Undo, row holds/settle,
editor/reduced-motion behavior, Task Undo, controls, resize and geometry.
Next build/TypeScript passes (routine-centered-build.log), targeted ESLint
passes (routine-centered-lint.log), design tests pass 2/2
(routine-centered-rules.log), and git diff --check passes.

**Actual production client.** Isolated Chromium synthetic profile with mocked
auth/backend: existing/fresh Habit fades and restored Undo show intermediate
opacity with correct curves and no overlapping faces. Task fades without a
strike and leaves at about 311ms; Record Undo and final frame agreement pass.
Both creation faces measure inside gaps 48/48px, height 48px, weight 700 and
widths 214/244/270px at viewport widths 360/390/416px. See
outputs/routine-centered-production.log and visually inspected
outputs/routine-centered-production.png. Preview refreshed on port 3012.

**Invariants/gaps.** At 360/390px, Note/Thoughts/Habit/Protocol heights remain
346/346/666/666px and foreheads 48/48/24/48px, with no inner scrolling.
No real owner data edited. Existing Vite ResizeObserver warnings remain;
physical devices, other engines and real hosted auth/sync remain unverified.

## Mirrored Habit fades (2026-11-09)

**Approved behavior.** Habit result fades in on check and out on uncheck,
each over 300ms. Original words disappear cleanly on check and return only
after fade-out; no crossfade, uncover, blur or movement. Both directions hold
row geometry for the response then settle height over 600ms. Existing/fresh
Habits and deliberate Undo after a restored completed arrival must animate;
restoration/editor arrivals, reduced motion and unchanged words remain direct.
Task completion/Record Undo, bold labels and Orange shadows stay intact.

**Implementation.** Updated os-app.css and HabitCopySwap in circle-os-shell.tsx.
A scoped returning phase holds height on uncheck and expires after response
plus settle. The immediate-arrival flag no longer suppresses an unchecked
face. Its timer parses both CSS time units: compiled production CSS contains
--os-routine-text-ms:.3s, so plain parseFloat would expire the phase early.
That serialization was found during final inspection and corrected; the
strengthened test measures phase retention late in the visible settle and
cleanup afterward. No saved model fields or JavaScript domain actions changed.

**Commands/results.** Installed Node v24.22.1 and ms-playwright cache,
CIRCLE_PRODUCTION_CSS=1, synthetic isolated profiles and blocked external
traffic. Initial node --test --test-reporter=tap selection with pattern
"Habit result fades|Habit completion hides|Routine shares Task|Routine controls press|shared App Box geometry|Task completion shares|Routine resize survives"
against tests/writing.browser.mjs passes 12/12
(outputs/routine-bidirectional-browser.log). Return-state cleanup recheck
passes 1/1 (routine-bidirectional-return-recheck.log). After correcting CSS-time
units and rebuilding, final affected pattern
"Habit result fades|Habit completion hides" passes 3/3
(routine-bidirectional-final-browser.log). Samples verify partial result
opacity, no overlapping faces, held geometry, 600ms settle, complete endpoints,
live/restored Undo, phase lifetime/cleanup, editor return, reload, reduced motion
and unchanged words. Initial checks retain controls, Task Undo and resize
regression coverage. Next build/TypeScript passes (routine-bidirectional-build.log),
targeted ESLint passes (routine-bidirectional-lint.log), design tests 2/2 pass
(routine-bidirectional-rules.log), and whitespace passes.

**Actual Next client.** Read-only in-memory diagnostic uses generated synthetic
auth signatures and local fixture records, intercepted auth/JWKS and blocked
backend traffic. It verifies fade-in/out on an existing Habit, unchecking after
a real reload of its completed record, and both directions on a freshly edited
Habit. Every sequence has intermediate opacity with no overlapping original
words, no mask and correct final row height. The final diagnostic also checks
the return flag stays active late in the full settle with minified .3s CSS.
Task text still fades without a strike and leaves at about 325ms, Record Undo
restores it, and Back ends at the live page height. Logs:
outputs/routine-bidirectional-production.log (initial) and
outputs/routine-bidirectional-final-production.log (final). Settled screenshot:
outputs/routine-bidirectional-production.png, visually inspected. No real token,
owner data or external provider used.

Shared Note/Thoughts/Habit/Protocol heights remain 346/346/666/666px and foreheads
48/48/24/48px at 360/390px, no inner scrolling. Existing Vite ResizeObserver
notifications remain open. Physical devices, other engines and actual hosted
auth/sync are not certified. Preview refreshed on port 3012; no staging,
commit or deployment.

## Habit result uncover and bold creation labels (2026-11-09)

**Approval/change.** Developer approved a 100ms old-word hold followed by a
200ms top-to-bottom uncover of the supplied Habit result, retaining its position,
sharp Bone text and the existing 300ms response/600ms settle. They clarified
only New habit/Add task labels should become bold. os-app.css uses an atomic
opacity handoff at 100ms and a delayed 200ms clip-path transition. Restored/
editing/reduced-motion faces reveal directly. Creation labels now use 16px/700;
the shared normal-weight rule excludes them, while Back/Record remain 400.
Existing control faces, shadows, Task fade/removal, saved records and model
behavior stay intact. No JavaScript runtime edits were required.

**Checks.** Installed Node v24.22.1 and ms-playwright browser cache,
CIRCLE_PRODUCTION_CSS=1, synthetic isolated profiles with external traffic
blocked. Command: node --test --test-reporter=tap with test-name-pattern
"Habit identity uncovers|Habit completion hides|Routine shares Task|Routine controls press|shared App Box geometry|Task completion shares"
against tests/writing.browser.mjs. Result: 10/10 pass in
outputs/routine-uncover-browser.log. Samples verify hidden result/visible old
words during the first 100ms, partial reveal between 100-300ms, full reveal
afterward, atomic opacity, no overlap/blur/travel, fixed anchors and the held
row/600ms settle. Other cases verify fully uncovered restored/reduced-motion
results, editing/Undo/reload, unchanged Habit words, bold creation labels and
normal header labels, existing Task completion/Record Undo and control geometry.

Next build/TypeScript passes (routine-uncover-build.log), targeted test ESLint
passes (routine-uncover-lint.log), design tests 2/2 pass
(routine-uncover-rules.log) and whitespace passes. The existing normal-weight
creation override was corrected before browser verification and the build was
repeated. No failing browser run preceded the final 10/10 selection.

**Full production client.** Repeated the isolated in-memory diagnostic against
the actual Next preview with generated synthetic auth signatures, local fixture
records and mocked backend/JWKS requests. Both existing and freshly edited
Habit results show an intermediate reveal mask with full opacity, then a fully
open mask; creation labels compute to [700,700]. Task fade/no strike and Record
Undo still pass; frame calls remain [600,600,600,600], checkbox effects 0.3s,
and the restored Orange control shadow remains. Log:
outputs/routine-uncover-production.log. Settled screenshot:
outputs/routine-uncover-production.png, visually inspected.

At 360/390px shared Note/Thoughts/Habit/Protocol heights remain
346/346/666/666px, foreheads 48/48/24/48px, no inner scrolling. Existing Vite
ResizeObserver notifications remain unresolved. Physical devices, other engines
and real hosted auth/sync were not certified. Local preview refreshed on 3012;
no owner-data editing, staging, commit or deployment.

## Quiet shared Habit and Task response (2026-11-09)

**Approval/implementation.** Developer approved quiet replacement, a shared
300ms checkbox/text response and 600ms row/frame settle, no Task strikethrough
or three-second dwell. CSS uses an end-step opacity switch for Habit words:
both faces remain at opacity 0 or 1, with a shared anchor; no overlapping fade.
Unchanged words do not pulse. Task text fades immediately while row geometry
holds, then the row departs at 300ms. Checkbox fill and opacity share that clock.
Completion still uses the existing saved model action; Record Undo and reload
retain their behavior. Reduced motion is direct. No data schema/geometry change.

**Browser verification.** Installed Node v24.22.1, installed ms-playwright
cache, CIRCLE_PRODUCTION_CSS=1, synthetic isolated accounts and external traffic
blocked. Initial command used node --test --test-reporter=tap with pattern
"Task completion shares|Habit identity switches|Routine shares Task|Habit completion hides|Routine controls press|Routine field hierarchy|Record matches Habits|shared App Box geometry|Routine resize survives"
against tests/writing.browser.mjs. Result: 14/16 in
outputs/routine-quiet-browser.log. Both new Task assertions read state before
the shared button's existing press-registration beat; they now poll for that
registration. The runtime does not add a waiting period. Also aligned remaining
checkbox opacity from 400ms to 300ms, rebuilt and repeated affected checks.

Final affected pattern:
"Task completion shares|Habit identity switches|Routine shares Task|Habit completion hides|Routine controls press".
Result: 8/8 in outputs/routine-quiet-final-browser.log. Tests capture real frames,
assert sharp old/new Habit faces with no partial opacity, hold/settle timing,
unchanged-word stability, Task intermediate fade, no strike/color change,
held row geometry, prompt departure, matched checkbox timing, final frame/page
agreement, Record Undo, reload and normal/reduced motion. Existing clearing
tests now expect completed Tasks in Record rather than a three-second on-page
Undo window. Broader initial checks also preserve Routine/Record shadows,
clearing and 360/390px geometry.

**Actual production client.** Repeated the read-only in-memory diagnostic on
the final Next preview with an isolated synthetic account, generated test
signatures and mocked auth/JWKS/backend requests. Existing and freshly edited
Habit faces stay at opacity 0 or 1; Task text visibly fades with no strike,
leaves at 306ms, checkbox transform/opacity both compute to 0.3s, frame calls
remain [600,600,600,600], and Record Undo returns the Task. Log:
outputs/routine-quiet-final-production.log. Synthetic screenshot:
outputs/routine-quiet-production.png. No real token, owner data or external
provider used. Preview restarted on port 3012 with the final build.

The first screenshot was taken during the Back transition. A repeat waited
for the flip to finish and frame/page heights to agree before capture:
outputs/routine-quiet-settled-production.log passes, including Task departure
at about 304ms and Record Undo. The settled screenshot was visually inspected.
Strengthened Task checks also wait for that endpoint after Undo; both motion
modes pass 2/2 in outputs/routine-quiet-undo-recheck.log.

**Other checks/gaps.** Next build/TypeScript passes
(outputs/routine-quiet-build.log), targeted ESLint for shell/browser tests
passes (routine-quiet-lint.log), design tests 2/2 pass
(routine-quiet-rules.log); whitespace passes. Shared heights remain
346/346/666/666px and foreheads 48/48/24/48px at 360/390px without inner scrolling.
Vite ResizeObserver notifications persist and are not declared fixed.
Physical devices, other engines and real hosted auth/sync remain unverified.
No staging, commit or deployment. Earlier snapshots remain historical evidence.

## Balanced Routine motion and Orange shadows (2026-11-09)

**Scope/cause.** Developer approved restoring the faint Orange shadow on
New habit/Add task and Habit/Task checkbox rims, including Record, then selected
700ms text/checkbox feedback, 600ms row/frame resize and 300ms clear fade.
They confirmed Windows animation settings caused the prior missing-motion
report: matchMedia returned true with No emulation in DevTools. Full production
diagnostics with normal motion reproduce the existing effects; reduced motion
suppresses Routine while Log-to-Week still uses its 260ms JavaScript resize.
No system/browser preference or reduced-motion policy changed in code.

**Implementation.** os-app.css shares local timing variables between text,
fill and frame rules; circle-os-shell.tsx retains clears for 300ms after the
immediate archive. The 10% Orange 0/3/9px shadow returns beneath existing Ink
edges/reflections, with a quieter pressed shadow. Existing targets, glass,
new-row fade/lead, anchored text, curves, saved records and geometry remain.
Design, Page standard and decision records describe the superseding values.

**Commands/results.** Installed Node v24.22.1, installed ms-playwright cache,
CIRCLE_PRODUCTION_CSS=1; synthetic profiles and blocked external requests.
Initial command: node --test --test-reporter=tap with test-name-pattern
"Routine resize survives|Routine additions stagger|Routine small growth|Habit identity dissolves|Routine Record uses|Routine controls press|Routine shares Task|Habit completion hides|Record matches Habits|Routine reduced transparency|shared App Box geometry"
against tests/writing.browser.mjs. Initial result 15/18
(outputs/routine-balanced-browser.log). Failures were late observations of
already-finished 600ms animations and an addition sequence no longer overlapping.
Tests now capture frame/clear events at their start and deliberately slow a
test animation while issuing an interrupt, without changing its 600ms duration.

Affected runs:
- routine-balanced-recheck.log: rapid additions and reduced-motion case pass;
  typing capture and a post-transition CSS assertion still required correction.
- routine-balanced-final-recheck.log: Record passes with actual intermediate
  600ms frames; clear sampling landed after its shorter visual row was removed.
- routine-balanced-clear-recheck.log: final normal-motion typing/clear path
  passes 1/1, sampling the 300ms inert fade from its attribute event and verifying
  live endpoints, saved archive and reload.

Thus all 18 selected paths have passing coverage across the initial and affected
runs. No runtime source changed after the production build. Targeted ESLint
passes (routine-balanced-lint.log), design tests 2/2
(routine-balanced-rules.log), Next build/TypeScript
(routine-balanced-build.log) and whitespace pass.

**Actual production client.** A read-only in-memory Playwright diagnostic opened
localhost:3012 with an isolated synthetic signed-in account, generated test
signing keys, synthetic local records, mocked auth/JWKS and blocked backend
requests. No real token or owner evidence was used. The actual Next JS/CSS
verified existing and freshly edited identity transitions at 0.7s, intermediate
clear opacity and removal before 500ms, frame calls [600,600,600], and 10% brand
Orange shadows on both creation faces and rims. Proof log:
outputs/routine-balanced-production.log; screenshot
outputs/routine-balanced-production.png was visually inspected.

**Invariants/gaps.** At 360/390px Note/Thoughts/Habit/Protocol remain
346/346/666/666px with 48/48/24/48px foreheads and no inner scrolling.
Vite ResizeObserver notifications remain open. Physical devices, other engines
and actual hosted auth/sync are not certified by synthetic interception.
Preview refreshed on port 3012; no staging, commit or deployment.

## Routine resize coordination (2026-11-09)

Approved runtime/test/continuity scope. app-session.tsx shifts active growth
keyframes with typing and animated-row deltas, preserving the clock and live
endpoint, including subpixel deltas. circle-os-shell.tsx and os-app.css retain
cleared rows inert for a 500ms fade after immediate archive; reduced motion
removes directly. Existing timings, minimum geometry and data semantics remain.

New checks cover wrapping input during growth, clear while another Habit is
edited, immediate archive, intermediate fade opacity, final frame/page
agreement and reload in normal/reduced motion. Initial source-CSS selection
passed identity/Record but failed its obsolete original-target assertion.
Addition checks now measure the live content endpoint and tolerate minified
numeric easing syntax. Small-growth fixtures measure content at a short
viewport before choosing a floor-crossing viewport, accounting for compact rows.

Final run uses installed Node v24.22.1, installed ms-playwright browser cache,
CIRCLE_PRODUCTION_CSS=1 and synthetic isolated profiles with external traffic
blocked. Command: node --test --test-reporter=tap with test-name-pattern
"Routine resize survives|Routine additions stagger|Routine small growth|Habit identity dissolves|Routine Record uses|shared App Box geometry"
against tests/writing.browser.mjs: 10/10 pass. Log:
outputs/routine-resize-production.log. Next build/types pass:
outputs/routine-resize-build.log. Targeted ESLint passes for app-session.tsx,
circle-os-shell.tsx and writing.browser.mjs; design tests 2/2 pass in
outputs/routine-resize-design.log. Whitespace passes.

At 360/390px Note/Thoughts/Habit/Protocol heights remain 346/346/666/666px,
foreheads 48/48/24/48px, without inner scrolling. Vite ResizeObserver
notifications persist as an unresolved warning. Physical devices, other engines
and hosted sync were not certified. No owner-data edits. Local production
preview restarted on port 3012 for developer lived review.

## Stronger Routine control glass (2026-11-09)

Approved CSS-only finish for New habit/Add task and Habit/Task checkboxes,
including Record. Brighter Bone rims/reflections, clearer centres, dark lower
edges and checked Orange sheen; no owner data or domain engine changes.

Exact production CSS verified with `CIRCLE_PRODUCTION_CSS=1` and
`node --test --test-reporter=tap --test-name-pattern="Routine controls press|Routine reduced transparency|Record matches Habits|shared App Box geometry" tests/writing.browser.mjs`:
7/7 pass (`outputs/control-glass-browser.log`). Normal/reduced-motion press,
release, cancellation, completion and Undo work. Creation faces remain 48px;
checkbox targets 44px, rims 28px, Orange fills 22px with 3px inset. Orange base
remains rgb(227,107,55) under sheen. Compiled standard filters: controls 8px,
panel 24px, both saturation 1.2. Reduced transparency removes filters/sheen
and makes control faces opaque Charcoal. Record/type/alignment pass at
360/390px. Note/Thoughts/Habit/Protocol heights at 390px remain
346/346/666/666px; forehead gaps 48/48/24/48px.

Next build/TypeScript, targeted browser-test lint and 2/2 design-rule tests pass:
`node node_modules/next/dist/bin/next build`,
`node node_modules/eslint/bin/eslint.js tests/writing.browser.mjs`,
`node --test tests/app-design-system.test.mjs`. Logs:
`outputs/control-glass-{build,lint,rules}.log`. Whitespace checked separately.
Visually inspected synthetic `outputs/routine-controls-glass-checked.png` and
loaded Opera preview at 416x747 after production rebuild/restart on port3012.
No owner clear/checkbox actions performed. No measured optimization needed.
Existing motion/source-string/no-snap and Vite ResizeObserver reports,
physical-device/other-engine and real auth/sync gaps remain outside scope.

## Shell-contained threads, production glass and small crosses (2026-11-09)

**Approval/scope.** Developer approved correcting actual preview blur, fading
threads over 16px into the outer app-shell border, and 8px/1px cross glyphs with
44px targets/row alignment retained. Main at eb38011; existing tracked/untracked
work preserved. No staging, commit, deployment or owner-data editing.

**Cause and correction.** Owner's Opera preview at localhost:3012 still showed
sharp strands inside Habits after reload. Readonly inspection of compiled Next
CSS found only trailing `-webkit-backdrop-filter`; the editable stylesheet used
in prior tests still had the standard property. Reordering prefix before standard
retains both in the production output and restores actual blur. Earlier isolated
source-CSS evidence did not verify this production result.

`RoutineThreadBackground` reads the outer shell's bounds/radius with a layout
effect and ResizeObserver; scroll/resize updates are batched into one animation
frame, without React state/layout writes. The fixed layer clips to that rounded
rectangle and intersects horizontal/vertical 16px fades. No thread pixels escape
the shell. Crosses are 8x8px, strokes 1px; 44px targets, heading alignment, 20px
copy offset and creation-button edges stay. Visible cross-to-copy gap is 12px.

**Production verification.** Browser harness now supports `CIRCLE_PRODUCTION_CSS=1`,
reading stylesheet paths from the built `/os` HTML and serving those exact
minified assets instead of Vite's editable CSS. Components/stores remain real,
with synthetic accounts, blocked external traffic and Bangkok time. Used Node
v24.22.1 on PATH and
`PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/ms-playwright`.

- With `CIRCLE_PRODUCTION_CSS=1`, final command
  `node --test --test-reporter=tap --test-name-pattern="Routine fixed threads|Small cross|Record matches Habits|Routine reduced transparency|shared App Box geometry|real Habit and Protocol|Routine full-page touch|Page spacing across" tests/writing.browser.mjs`
  passed 14/14; `outputs/routine-shell-glass-verified.log`. Includes mixed
  lowercase/capital/number Habit and Task names, keyboard clear without clearing
  the same-named Task, 8px/1px glyphs, 44px targets, 12px visual gap, fixed
  background, border bounds during scroll/Record changes, no horizontal overflow,
  route/shell close restoration, reduced transparency, navigation and geometry.
- Sharp pixel analysis on actual production styles gives inside-glass fine-edge
  ratios 0.755/0.735/0.915 at 360/390/1280px; outside-panel pixels are unchanged
  when toggling only the glass filter. Comparing shown/hidden threads confirms
  the last border pixel has less than one quarter of the inner strip's thread
  difference, and no difference exists outside the desktop shell rectangle.
- `node --test tests/app-design-system.test.mjs`: 2/2;
  `outputs/routine-shell-glass-rules.log`.
- `node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx tests/writing.browser.mjs`
  passes; `outputs/routine-shell-glass-lint.log`.
- `node node_modules/next/dist/bin/next build` passes compilation, TypeScript and
  prerender; `outputs/routine-shell-glass-build.log`. Built CSS contains both
  prefixed and standard backdrop-filter. Whitespace check passes.

**Actual Opera and visual review.** Opera connector was unavailable. Computer-use
skill inspected the owner preview read only. Its console paste protection blocked
a readonly diagnostic expression; no protection was bypassed. Compiled styles
were inspected from disk instead. After rebuild/restart and normal reload,
Opera's 416px emulated view visibly shows diffuse strands beneath Habits and
smaller glyphs. No owner habit/task was clicked or edited. DevTools returned
to the original Elements panel. Inspected synthetic production images
`outputs/routine-shell-fade-production-1280.png` and
`outputs/routine-small-cross-production-390.png`.

**Measurements/limits.** Resting Note/Thoughts/Habit/Protocol remain
346/346/666/666px, foreheads 48/48/24/48px at mobile widths. Record keeps its 24px
anchor and button-edge alignment. Long Habit/Protocol rows grow to
891.5625/891.90625px with no inner scroller. An initial fade comparison was
timing-sensitive; waiting for compositor paint after hiding the layer fixed
the test setup. Final production-focused recheck 8/8 preceded the 14/14 pass.
No separate optimization was justified. Existing ResizeObserver notifications,
motion/source-assertion/no-snap reports, physical-device/other-engine and real
sync/auth gaps remain. Preview is rebuilt and running on 3012 for lived review.

## Sharp fixed full-page threads (2026-11-09)

**Approval/scope.** Developer rejected thread softening and explicitly approved
a fixed, sharp full-page background for Routine, Record and Protocol. Existing
tracked/untracked work preserved on main at eb38011. No staging, commit,
deployment, personal-data editing or external transmission.

**Implementation.** Added one aria-hidden, noninteractive root background layer
beside the app shell. Reused the existing SVG ribbon, filling viewport width
across the lower 72% from bottom to right. It no longer has a blur or frame-edge
mask, and remains fixed while the App Box scrolls. Opened tools make the shell
transparent over Ink, including on mobile; close hides artwork/restores normal
shell styling. Reduced transparency and forced colors hide the layer.

Actual backdrop filtering required scoped compositing corrections: opened tools
release the named route capture and the completed arrival animation's retained
opacity fill. Close restores both normal route settings. Frame isolation,
24px blur/1.2 saturation, Page motion timings, dimensions and data remain.

**Verification.** Installed Node v24.22.1 on PATH, existing synthetic account/
component harness with blocked external traffic and Bangkok time, plus
`PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/ms-playwright`.

- `node --test --test-reporter=tap --test-name-pattern="Routine fixed threads|Record matches Habits|Routine reduced transparency|shared App Box geometry|real Habit and Protocol|Routine full-page touch|Page spacing across|Routine field hierarchy" tests/writing.browser.mjs`
  passed 14/14; `outputs/routine-fixed-threads-final.log`. At 360/390/1280x844,
  verifies fixed 0,0 viewport bounds through scroll/Record/Protocol, App Box
  movement over that background, no horizontal overflow, noninteractive artwork,
  close/restored route capture/fill/shell and existing type/controls/geometry.
- Pixel checks use the existing Next Sharp dependency to decode screenshot PNGs.
  Temporarily disable only the glass filter, then compare the same inside and
  outside regions. Fine-edge energy inside glass is 0.758/0.738/0.916 of the
  unfiltered reference at 360/390/1280px (threshold below 0.95). Outside RGB
  pixels are exactly identical. This verifies actual glass filtering while
  source artwork stays sharp, rather than trusting computed CSS or PNG bytes.
- `node --test tests/app-design-system.test.mjs`: 2/2;
  `outputs/routine-fixed-threads-rules.log`.
- `node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx tests/writing.browser.mjs`
  passed; `outputs/routine-fixed-threads-lint.log`.
- `node node_modules/next/dist/bin/next build` passes compilation, TypeScript
  and prerender; `outputs/routine-fixed-threads-build.log`. Whitespace passes.

**Geometry and visual review.** Note/Thoughts/Habit/Protocol retain resting
346/346/666/666px heights and 48/48/24/48px anchors at 360/390px. Record's 24px
anchor/44px targets and both creation-button edges remain. Real Habit/Protocol
frames grow to 891.5625/891.90625px with no inner scroll panel. Inspected fresh
full viewport images `outputs/routine-fixed-threads-final-390.png` and
`outputs/routine-fixed-threads-final-1280.png`: crisp strands outside the glass,
softened covered portions, continuing across the frame boundary. Source PNGs
with filter on/off are retained as `outputs/routine-thread-glass-{on,off}-{width}.png`.

**Attempts/limits.** Initial placement/scroll checks passed, but visual review
showed strands still sharp inside. PNG byte differences were insufficient:
decoded edge detail was unchanged. Releasing the retained opacity fill and named
route capture fixed actual compositing; a lower-specificity fill override did
not apply and was corrected. Frame isolation was tested independently and kept
at its original value. Final pixel-based checks now guard the real result.
Vite ResizeObserver notifications continue; their cause and earlier missing-motion/
rapid-addition/no-snap/source-assertion gaps remain open. Physical devices,
other engines and real sync/auth are not certified. No separate optimization
was justified. Local preview rebuilt/restarted on 3012 for developer review.

## Literal Record, compact rows and glass (2026-11-09)

**Approval/scope.** Developer explicitly approved literal Record fields,
compact heading-aligned crosses/rows, creation-button edges, background thread
and richer glass, including selectors, tests and owning records. Preserved
existing tracked/untracked work on main at eb38011. No staging, commit,
deployment, generated-state editing or owner-data testing.

**Implementation.** `habitHistoryRecord` projects detached saved parts, retaining
its existing text/provenance fallback. Structured snapshots supply raw fields;
text-only snapshots do not borrow later definition fields. Shared readonly
`HabitRecordCopy` renders name/cue/result independently, hides empty fields and
adds no sentence framing. Today's displayed words use the same snapshot, while
`dayRecord` membership/counts and Undo remain. Past records stay read only.
Snapshots, composed compatibility text, merge and storage are untouched.

Row grids reserve 20px before copy. The 12px Orange two-stroke cross begins at
the heading edge; its 44px target extends 24px into the existing gutter and
ends at the copy edge. Both creation buttons start there and end at tick-target
start. The thread is now outside the frame on Routine's background; the frame
above it has 24px blur/1.2 saturation and stronger translucency/rim. A 4px thread
diffusion removes the sharp surface-ink appearance. Reduced transparency uses
opaque Ink, no thread/blur; forced colors hides artwork too.

**Checks.** Existing synthetic account/component harness, Bangkok time, blocked
external traffic, installed Node v24.22.1 on PATH and
`PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/ms-playwright`.

- `node --test --test-reporter=tap --test-name-pattern="Record matches Habits|Routine reduced transparency|Routine field hierarchy|Habit dated history|shared App Box geometry|real Habit and Protocol|Routine shares Task|Habit identity dissolves|Routine redesign|Routine full-page touch|Habit completion hides" tests/writing.browser.mjs`
  passed 17/17; `outputs/routine-fields-glass-final.log`. Includes normal/reduced
  motion, literal saved fields after rename, no read writes, mobile history/
  reload/Undo, optional fields, full-page touch switching, first-line alignment,
  cross clearing, frame floors and long content without inner scrolling.
- Final recheck after thread diffusion, open Task fixture and legacy alignment:
  `node --test --test-reporter=tap --test-name-pattern="Record matches Habits|Routine reduced transparency|Record keeps text-only|Habit dated history" tests/writing.browser.mjs`
  passed 6/6; `outputs/routine-fields-glass-visual-final.log`. Both Habit and Task
  glyphs align to heading edges; copy is 20px inward with 8px glyph gap; creation
  edges match actual remove/tick targets. CDP reduced-transparency preference
  removes thread/blur. Hit-testing both ends of the remove target confirms an
  effective 44px target without text overlap. Record Undo controls are visible
  and hittable; snapshot fields remain unchanged through browsing. Text-only
  legacy records keep raw wording, first-line Undo and a saved-wording action
  label without borrowing current fields; Undo leaves their past evidence intact.
- `node --test --test-name-pattern="one-click archive|Habit history|legacy Habit|new completion|saved empty|Record fields|unnamed|resuming|completed Habit setup|chapter-shaped|two habits|legacy text-only|editing action|habit typing|published and compiled|one gap|normalising|committing|habit is still|app typography|app layout" tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/app-design-system.test.mjs`
  passed 23/23; `outputs/routine-fields-glass-model-verified.log`. Includes raw
  snapshot parts, detached projection, text-only/empty legacy cases, stale merge,
  immutable wording, existing typing/draft behavior and design-rule checks.
- `node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx app/os/circle-os-model.js tests/habit-identity.test.mjs tests/writing.browser.mjs`
  passed; `outputs/routine-fields-glass-lint.log`. Final
  `node node_modules/next/dist/bin/next build` passes compile/TypeScript/prerender;
  `outputs/routine-fields-glass-build-final.log`. Whitespace check passes.

**Measurements/visuals.** At 360/390x844, Note/Thoughts/Habit/Protocol remain
346/346/666/666px with 48/48/24/48px gaps. Record remains 24px below Header; glass
surface height is 664px inside the 666px frame, ending 1px before its border.
All Undo targets measure 44x44; the name shares its first-line anchor with Undo,
and the secondary cue follows beneath it. Text-only fallback uses that anchor too.
Long Habit/Protocol frames reach 891.5625/891.90625px with no inner scroller.
Inspected fresh copies of final screenshots:
`outputs/routine-layout-glass-final-390.png`,
`outputs/routine-record-fields-final-390.png`, plus 360px Record and controls.

**Attempts/limits.** First browser pass 12/14: two history assertions still
expected sentence text or assumed timestamp-tied row order. Replaced them with
field assertions located by the saved action; affected recheck 4/4 passed.
Moved artwork outside the actual glass frame so it can sit under the surface;
final 17-case pass followed. Added diffusion after visual review and rechecked
3/3 initially, then 6/6 including the final legacy fallback alignment and label.
A broad model attempt was 23/24; the already-recorded source-string arrival
assertion still expects a removed motion branch. It remains unchanged; the
positive focused selection passes. Vite ResizeObserver notifications continue;
their cause is not certified by this task. Other engines, physical-device feel,
real sync/auth and earlier rapid-addition/no-snap/missing-motion reports remain
open. No further optimization was justified. Local preview rebuilt/restarted
on 3012; `Invoke-WebRequest http://localhost:3012/os -UseBasicParsing` returned
HTTP 200 after the final restart. Developer reload and lived review are next.

## App-wide type, spacing and Record (2026-11-09)

**Approval and scope.** Developer explicitly approved matching Record to Habits,
reducing x spacing, and migrating all functional app surfaces to shared four-size/
two-weight type and a four-pixel spacing grid. Changes: app-scoped roles/legacy
aliases and component declarations in `app/os/os-app.css`; only the Circle OS
section of `app/globals.css`; spacing primitives in `app/tokens.css`; shared
tokens in the dev sync-check control; browser tests and a new design-rule guard.
Existing unrelated changes remain. No model, data, motion engine or transport
changed in this pass. No staging, commit or deployment.

**Implemented.** Geist, sizes 12/16/18/28px, weights 400/700. Removed fluid/raw app
font sizes and intermediate weights; retained role aliases so existing components
share the scale. Placeholders inherit field metrics. Layout declarations use
shared `--space-*` tokens, including 24px Main/Sub/Footer and 16px App gaps.
Typography leading/tracking and derived centering remain separate from layout
spacing. Record headings/wording now use full Bone, 28px/700 and 18px/700, 8px
lists and the same 24px forehead as Habits. Old dimming/dividers/padding removed.
The x is aligned to the text-side edge of its 44px target, giving an actual 8px
glyph-to-copy gap. Record keeps Undo/read-only history and two-column rows.

**Verification.** Used installed Node v24.22.1 on PATH, the existing isolated
component/store browser harness, synthetic accounts, Bangkok time, blocked
external traffic, and `PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/ms-playwright`.

- Final command: `node --test --test-reporter=tap --test-name-pattern="Record matches Habits|Routine field hierarchy|shared App Box geometry|Page spacing across|read and write typography|Chapter .*typography|Vision and Week read|reading-only Chapter|Habit dated history|real Habit and Protocol|Routine shares Task|Note header alignment|Protocol term inputs|Note, History and Trash stay bounded|Habit identity dissolves|Routine redesign|Quotes Admin|real Reflect reading reply" tests/writing.browser.mjs`
  passed 34/34; `outputs/app-type-spacing-verified.log`. Covers 360/390px and
  360x667 bounded writing, plus 1280px Protocol fields. Every checked screen is
  audited for computed family, size, weight and placeholder metrics. Existing
  editing/reload, Undo/history, Chapter runtime/Workshop, Vision/Week, Admin and
  Reflect paths passed, as did completion dissolve and Routine/Protocol flows.
- After the final two Log/Week list indents moved from 1em to shared 16px,
  `node --test --test-reporter=tap --test-name-pattern="Log history|Week history|Record matches Habits" tests/writing.browser.mjs`
  passed 10/10; `outputs/app-type-spacing-history.log`. Includes account isolation,
  offline/reload, resize, long and incomplete history with unchanged evidence.
- `node --test tests/app-design-system.test.mjs` passed 2/2;
  `outputs/app-type-spacing-rules.log`. Guards app/base declarations against raw
  type/intermediate weights, serif app text, off-grid/raw layout spacing.
- `node node_modules/eslint/bin/eslint.js app/os/sync-check/sync-check-client.tsx tests/writing.browser.mjs tests/app-design-system.test.mjs`
  passed; `outputs/app-type-spacing-lint.log`. Final
  `node node_modules/next/dist/bin/next build` passed compile, TypeScript and
  prerender; `outputs/app-type-spacing-build-final.log`. `git diff --check` passed.

**Measurements.** At 360/390x844, Note/Thoughts/Habit/Protocol retain heights
346/346/666/666px, forehead gaps 48/48/24/48px and no inner overflow. Record's
heading matches Habits' computed size/weight/leading/color and its 24px anchor;
clear glyph spacing is 8px, targets at least 44px. Long Habit/Protocol rows grow
to 891.5625/891.90625px without nested scrolling. Checked Page body/footer gaps
are 24px. Inspected final Routine 390px, Record 360/390px and Note 390px images.
Confirmed the public/brand prefix of globals.css is byte-identical to startup.

**Attempts and limits.** Sandbox localhost access was denied; reran outside the
sandbox. First affected browser pass 27/27 passed; the added computed audit then
found inherited 550-weight time labels in the older global app section. Migrated
that section; audit recheck 4/4 passed. The rule guard caught a faulty serif
matcher (it matched sans-serif), then the two 1em list indents; both were corrected.
The earlier expanded pass was 34/34 too (`outputs/app-type-spacing-final.log`).
Vite emitted ResizeObserver loop notifications during navigation; selected cases
had no uncaught page errors, but the notifications' cause is not certified here.
No animation issue, general performance issue, real sync/auth or physical-device
acceptance is declared resolved. The prior source-string animation assertion,
rapid-addition/no-snap failure and other earlier gaps remain open. No extra
optimization was justified. Rebuilt local preview restarted on port 3012.

## Routine type hierarchy and clearing (2026-11-09)

**Scope.** Developer explicitly approved the reviewed Routine-only 28/18/16/12px
scale, 400/700 weights, inherited placeholder metrics, left Orange x controls
inside 44px targets, necessary model helpers, tests and owning records. Existing
shell/CSS changes were preserved. Archive helpers keep original wording and
completion evidence, write updatedAt and queue the existing revision/outbox.
Completed Tasks keep completed status/Record while their visible exit is ended.
Record retains two columns; editable rows have clear/copy/completion columns.

**Checks.** Installed Node v24.22.1 on PATH and PLAYWRIGHT_BROWSERS_PATH set to
`C:/Users/wickie''/AppData/Local/ms-playwright`, using the existing synthetic
account/component harness, Bangkok time and blocked external requests.

- Initial broader browser command, `node --test --test-reporter=tap
  --test-name-pattern="Routine field hierarchy|Routine shares Task|shared App Box geometry|real Habit and Protocol|Habit identity dissolves|Routine redesign|new Habit accepts|Habit dated history"
  tests/writing.browser.mjs`: 13/13; `outputs/routine-type-clear-browser.log`.
- Final affected command after protecting completed Tasks and restricting row
  layout, `node --test --test-reporter=tap
  --test-name-pattern="Routine field hierarchy|Habit dated history|shared App Box geometry|Routine shares Task|real Habit and Protocol"
  tests/writing.browser.mjs`: 8/8; `outputs/routine-type-clear-final.log`.
  Covers 360/390px field/placeholder computed size, weight and color; clear target
  size/color/position; Habit/Task clear and reload; past wording; draft clearing;
  completed-Task Record preservation; today's Undo; alignment and row gaps.
- Focused model command, `node --test
  --test-name-pattern="one-click archive|Habit history|legacy Habit|new completion|saved empty|unnamed|resuming|habit typing|chapter-shaped|two habits|legacy text-only|editing action|published and compiled|completed Habit setup"
  tests/habit-identity.test.mjs`: 16/16; `outputs/routine-type-clear-model.log`.
  New archive check verifies unchanged wording/completion evidence, reload,
  stale merge, idempotence and completed-Task preservation.
- Targeted ESLint for model/shell/two changed tests passes;
  `outputs/routine-type-clear-lint.log`. Final `node node_modules/next/dist/bin/next build`
  passes compile, TypeScript and prerender; `outputs/routine-type-clear-build.log`.
  `git diff --check` passes. Synthetic `outputs/routine-design-390.png` inspected.

**Measurements and limits.** At 360/390x844, Note/Thoughts/Habit/Protocol heights
are 346/346/666/666px; forehead gaps 48/48/24/48px. Real Habit/Protocol rows grow
to 891.5625/900.65625px without nested scrolling. Existing motion timings and
engines were not changed; no measured optimization was warranted.

Sandbox localhost denial and CSS-worker startup failure required reruns outside
the sandbox. Early completed-Task test attempts used an unnamed draft that
collapsed on blur, the wrong completion label, and then failed to wait for the
shared completion lifecycle; final setup names the draft and waits for Undo.
Full habit-identity.test.mjs was 17/18: its older source-string arrival assertion
expects a removed branch in the already-modified motion code. That unrelated
baseline assertion remains unchanged. Physical phones, wider engines, real sync
and the previously recorded rapid-addition/no-snap issue remain unverified/open.
Computer skill previewed the owner's Routine read-only before edits; later
window captures returned the wrong foreground surface, so final visual QA used
the isolated component screenshot. No owner records were modified for testing.

## Compact Routine UI (2026-11-09)

Developer approved only two UI corrections before further motion diagnosis:
remove Record's right-hand label, and reduce Habit/Task list gaps from 24px to
8px. Existing font metrics, 44px targets, controls, data and motion engines/
timings are unchanged. Updated the existing shell/CSS and focused assertions.

Final UI-only browser command (installed Node/cache paths below):
`node --test --test-reporter=tap --test-name-pattern="Habit dated history|Routine shares Task" tests/writing.browser.mjs`
passes 3/3, log `outputs/routine-compact-ui.log`. It verifies both 8px list gaps,
unchanged 18px/540 content, first-line alignment/44px controls, and a Back-only
Record header at 360/390px while preserving today Undo and dated snapshots.
Targeted shell/test ESLint passes. Production Next build/types passes, log
`outputs/routine-compact-build.log`. Whitespace passes. Browser/build used
isolated synthetic data and outside-sandbox local worker/socket access.

A broader five-case run (`outputs/routine-compact-browser.log`) passed 4/5;
its normal-motion rapid-addition test failed the final-height/no-snap assertion
at the former test line 308. Do not call motion fixed or dismiss that failure:
retain it as the starting evidence for the separately deferred animation audit.
No animation implementation was changed to satisfy this bounded UI task.
Preview rebuilt/restarted on port 3012. Developer should reload for current
client code. Physical-device acceptance and the reported missing effects remain
open. Nothing staged, committed or deployed.

## Unified Routine audit, typography and Record (2026-11-09)

Developer approved consolidated Routine styles/timing, Task-matched Habit
typography, ordinary-checkoff feedback and a merged Record page. Changed the
existing shell, CSS, App-back/session controllers and focused browser tests.
Removed the superseded separate Record rendering branch and redundant earlier
Routine bubble appearance/checked-state overrides; shared legacy styles remain.
No store, model, migration or personal records changed.

Served production CSS from port 3012 was exercised with real components and
synthetic accounts in an isolated mobile browser. Both headings measure
28px/700/33.6px; Habit, Task and identity content measure 18px/540/23.4px.
The dedicated alignment check measures first-line centers against the 44px
completion target. Ordinary labels retain their element/anchor and pulse from
opacity 1 through 0.65 near 701ms to 1 near 1401ms. Identity incoming/outgoing
opacity measures 0.226/0.774 near 312ms and 0.512/0.488 near 713ms, using the
1400ms dissolve. The served header reads Back / Record. Reported identity-fade
absence in the developer's actual tab remains unreproduced, not declared fixed.

The audit found App-back resize still used 440ms and released on its shorter
schedule. It now reads Routine's local 1800ms duration, preserving other apps'
defaults. A dedicated normal-motion check found the session growth controller
competing with App-back. It now yields while App-back owns the held frame.
After correction, actual Record height starts at 664px, passes 1147.55px while
the 1800ms transition is running, and finishes at 1585.52px without snapping
back. Reduced motion stays direct. The 3px inset fill remains unchanged.

Record now contains today's Undo rows followed by read-only past dates newest
first. Tests retain original snapshots despite definition edits/archiving,
verify Undo affects today only, and check Back, reload, empty/long records and
no inner scrolling at 360/390px. Legacy side identifiers are retained.

Verification used installed Node/cache paths below, Bangkok time, synthetic
accounts and blocked external traffic. Main selected run in
`outputs/routine-unified-final.log`: 20/22 passed; two tests still clicked the
old Record-labelled return control. Updated to Back. A separate normal-motion
test exposed the real controller conflict described above. Final affected
recheck in `outputs/routine-unified-recheck.log`: 10/10 pass; dedicated Record
resize recheck in `outputs/routine-record-motion.log`: 1/1 passes. An earlier
control polling timeout passed its isolated 3/3 rerun and the main final run.
A temporary new-test syntax error was corrected before the final checks.

Commands: `node --test --test-reporter=tap --test-name-pattern=... tests/writing.browser.mjs`
(patterns cover identity, typography/pulse/alignment, controls, additions,
small growth/shrink/typing, completion variants, Routine/Protocol flows,
merged records, drafts, empty records and geometry); final affected pattern:
`Routine redesign|Routine Record uses|Routine small growth|Routine shares Task|Habit dated history|empty Habit History`.
`node node_modules/eslint/bin/eslint.js app/os/app-back.ts app/os/app-session.tsx app/os/circle-os-shell.tsx tests/writing.browser.mjs`
passes. Final production Next build/types passes, log
`outputs/routine-unified-build.log`. Whitespace passes. Browser/build required
outside-sandbox local socket/worker access. No external AI or owner data used.

Resting App Boxes remain 346/346/666/666px and forehead gaps 48/48/24/48px at
360/390x844. Physical devices, other engines and hosted sync/auth are not newly
certified. Rebuilt local preview runs on 3012. Developer should reload the tab
to load the rebuilt client code before lived review. No deployment or commit.

## Anchored Bone text and matched slow height motion (2026-11-09)

**Approval/baseline.** Developer approved the recommendation after rejecting
the blur/Orange-text trial. A read-only isolated browser audit reproduced the
legacy 4px parent offset and extra re-centering (one label moved 11.5px despite
unchanged 24px type), a nearly invisible middle of the blur exchange, a 15px
instant frame expansion, and a row hitting its visible floor in about 500ms
despite a nominal 1200ms transition. Earlier child-transform assertions missed
the parent offset. These findings supersede those earlier completeness claims.

**Implementation.** Checked words stay Bone. Name-only/name-cue habits retain
their original textareas, with no text swap or strikethrough. Only a supplied
identity dissolves in: simultaneous 1400ms linear opacity crossfade, no blur
or travel. The whole copy block is anchored to the first line and checkbox,
overriding the old checkbox-state offset and removing vertical re-centering.
The row holds its height through the dissolve, then settles spare space over
1800ms. Measurement includes its actual 44px row floor. Restored/edit arrivals
are direct; undo removes the hold. Orange inset fill now takes 1400ms.

The existing frame engine gives local structural growth and reduction the
same 1800ms timeline, including small deltas. Actual captured input/focus
identifies typing instead of guessing from a 40px threshold. Typing follows
directly; an already settling copy supplies the page geometry without another
frame animation competing with it. Other App Box defaults remain unchanged.

**Measured behavior.** At 390px, the identity's x/y relative to its row stays
0/7.59375px through every sampled frame, matching the outgoing text. Font
size/weight/line-height/letter-spacing match throughout; filter stays none.
At 717ms incoming/outgoing opacity is 0.512/0.488. At 1350ms it is
0.964/0.036 and row height is still 69.59px. After the dissolve, row height
is 65.61px near 1817ms, 47.69px near 2501ms, 44.02px near 3117ms and 44px
at rest. It remains visibly in motion near the end of the full settle period.
Both faces remain Bone. No empty-opacity interval or parent movement.

The new floor-crossing test measures actual expansion from 692px to 709.56px
and reduction back to 692px: both 1800ms, real intermediate heights, anchored
headings and final endpoints. It deliberately exercises deltas below 40px.
Reduced motion creates no height animations. A real multiline fill creates no
decorative height animation and frame/page heights match immediately. Existing
normal/reduced tests cover rapid additions, cancellation, stable 44px targets,
the 3px glass inset, name/cue variants, editing, early undo, reload, keyboard
creation, history and existing touch switching.

**Checks.** Installed Node v24.22.1 and cache paths remain recorded below.
Synthetic accounts, Bangkok time, blocked external traffic:

```text
node --test --test-reporter=tap --test-name-pattern="Habit identity dissolves|Routine controls press|Routine additions stagger|Routine small growth|Habit completion hides|Routine redesign|shared App Box geometry|new Habit accepts|Habit dated history|real Habit and Protocol|Routine full-page" tests/writing.browser.mjs
node node_modules/eslint/bin/eslint.js app/os/app-session.tsx app/os/circle-os-shell.tsx tests/writing.browser.mjs
node node_modules/next/dist/bin/next build
git diff --check
```

Final browser regression **19/19 passes**, targeted lint passes, production
Next build/types/static generation passes, whitespace passes. Logs:
`outputs/routine-stable-focused.log`, `outputs/routine-stable-regression.log`,
`outputs/routine-stable-build.log`. Browser/build ran outside the sandbox for
local socket/worker access, with installed Node on PATH. Inspected actual
`outputs/habit-completion-refined-390.png`; Bone text, inset glass and anchored
first-line alignment are visible. No owner records or external AI used.

**Invariants/limits.** At 360/390x844, resting frames stay 346/346/666/666px
and forehead gaps 48/48/24/48px. Real Habit rows grow to 1085.94px after the
first-line alignment change; Protocol remains 900.66px, without inner scroll.
No model/store, migration, chapter or shared page-travel change. No measured
performance issue called for more optimization. Physical-device feel, other
engines and hosted sync/auth remain unverified. Rebuilt local preview on 3012
serves /os. Next: developer lived review, rather than treating pixel checks as
proof of preference. Nothing staged, committed or deployed.

## Routine blur handover and inset fill (2026-11-09)

**Approval/scope.** Developer explicitly approved the full reviewed pass:
300ms outgoing blur/fade, incoming Orange words starting at 220ms over 1000ms,
no upward travel, no habit strikethrough, retained name/cue when identity is
absent, 900ms inset fill, 1200ms gentler growth and 24px rows without dividers.
Existing shell/CSS and shared growth easing hook changed, plus tests and owning
design/session records. No model, store, dependency or publication change.

**Actual frames.** Browser sampling confirms outgoing opacity 0.500/blur 3px
around 157ms; incoming opacity 0.002/blur 5.99px with outgoing 0.056 around
257ms; incoming 0.163/blur 5.02px around 505ms; incoming 0.787/blur 1.28px
around 905ms; final Orange at opacity 1/blur 0 around 1256ms. Both faces have
nonzero opacity in the overlap. Vertical offset stays zero throughout.
The Orange disc's scale progresses through 0.056 near 157ms, 0.160 near 257ms,
0.595 near 505ms and 1 near 905ms. Its final 22px diameter inside the 28px
glass bubble gives a measured 3px inset. Rim color remains distinct from fill;
the hit area remains 44px. Actual new-row gaps measure 24px, borders 0px.

**Behavioral coverage.** Name-only and name/cue habits show their original
words on the completed Orange face, retain a quieter Bone cue, omit empty
placeholders and have no strikethrough. Their completed face opens the original
action editor. Identity-backed habits open their identity field. Edit return
and reload restore completed faces directly without replay. Early undo removes
the in-progress reveal. Normal/reduced-motion tests also cover cancellation,
Orange fill, rapid additions, anchored growth, keyboard creation, persistence,
history, existing touch switching and Protocol journeys. Inspected actual
`outputs/habit-completion-refined-390.png` for inset glass and Orange hierarchy.

**Checks.** Using installed Node v24.22.1/cache paths recorded below, synthetic
accounts, Bangkok time and blocked external traffic:

```text
node --test --test-reporter=tap --test-name-pattern="Habit identity blurs|Routine controls press|Routine additions stagger|Habit completion hides|Routine redesign|shared App Box geometry|new Habit accepts|Habit dated history|real Habit and Protocol|Routine full-page" tests/writing.browser.mjs
node node_modules/eslint/bin/eslint.js app/os/app-session.tsx app/os/circle-os-shell.tsx tests/writing.browser.mjs
node node_modules/next/dist/bin/next build
git diff --check
```

Final regression **17/17 passes**, targeted lint passes, production Next build
including types/static generation passes, whitespace passes. Logs:
`outputs/routine-blur-regression.log`, `outputs/routine-blur-build.log`.
Initial focused run verified blur/fill but its new no-strike assertion matched
two textareas; corrected the test to address the action field, then reran the
full selected suite. Browser/build used outside-sandbox local socket/worker
access and the installed Node on PATH. No personal records used.

**Geometry and limits.** At 360/390x844, Note/Thoughts remain 346px with 48px
gaps; Routine/Protocol remain 666px with 24/48px gaps. Eight real Habit rows
now grow to 1025.19px after divider/padding removal; Protocol remains 900.66px.
Neither has inner scrolling. Other shared growth keeps its prior defaults.
No measured performance issue justified further optimization. Physical-device
feel, other engines and hosted sync/auth remain unverified. Rebuilt local
preview on 3012 serves /os; developer visual review remains. Nothing deployed.

## Slower, staggered Routine motion (2026-11-09)

**Approval/scope.** Developer approved slowing Routine, then approved immediate
control feedback with an 80ms identity lead and 100ms new-row lead. Changed
the existing shared growth engine, shell row classes, CSS, focused browser
checks and owning design/session records. Domain actions, storage and page
travel are unchanged. Earlier timing entries below are historical.

**Implemented.** Identity uses 750ms/8px after 80ms; frame/copy growth uses
700ms; press/release use 150/400ms; fill uses 350ms. New Habit/Task rows fade
over 500ms after 100ms. The shared engine reads a local Routine timing token,
leaving other tools' default growth at 260ms. Reduced motion bypasses this
JavaScript height animation and shows row/text states directly. Creation
classes are local UI state and do not replay on reload.

**Actual growth evidence/fixes.** A real New habit followed rapidly by Add task
exercises interruption. First growth starts at 967.19px toward 1079.19px; the
next begins at the visible 1039.67px edge. Subsequent field-size changes
retarget from the current edge and settle around 1104.19px, within 0.5px of
the final measured target. Samples contain intermediate heights and a constant
heading anchor. Initial checks found two real issues: focus scrolled the
overflow-hidden frame (briefly shifting the heading 28px), and small final
field-size adjustments could leave a snap when growth finished. Routine now
uses overflow:clip and active growth tracks small final changes; ordinary
typing outside expansion still follows directly. Retested after both fixes.

**Checks.** Installed Node v24.22.1 and Playwright cache paths remain as
recorded below. Synthetic accounts, Bangkok time, blocked external traffic:

```text
node --test --test-reporter=tap --test-name-pattern="Habit identity follows|Routine controls press|Routine additions stagger|Habit completion hides|Routine redesign|shared App Box geometry|new Habit accepts|Habit dated history|real Habit and Protocol|Routine full-page" tests/writing.browser.mjs
node --test --test-reporter=tap --test-name-pattern="Habit completion hides.*360px" tests/writing.browser.mjs
node node_modules/eslint/bin/eslint.js app/os/app-session.tsx app/os/circle-os-shell.tsx tests/writing.browser.mjs
node node_modules/next/dist/bin/next build
git diff --check
```

Main regression: 16/17 passed; the remaining reduced-motion assertion expected
a zero-translation matrix instead of the equivalent transform:none. Changed
it to measure actual zero travel, then the affected completion case passed
1/1. All 17 selected cases pass across the final main run and recheck. Final
lint, production Next build/types and whitespace pass. Browser/build ran
outside the sandbox for local socket/worker access, with installed Node on
PATH. Logs: `outputs/routine-slow-motion-regression.log`,
`outputs/routine-slow-motion-reduced-recheck.log`,
`outputs/routine-slow-motion-build.log`. Earlier focused/recheck logs retain
the initial attempts. Inspected `outputs/routine-design-390.png`.

**Geometry/limits.** At 360/390x844, Note/Thoughts stay 346px with 48px gaps;
Routine/Protocol stay 666px with 24/48px gaps. Long rows grow to
1056.19/900.66px without nested scrolling. Tests exercise normal/reduced motion,
real intermediate opacity/travel/growth, lead times, cancellation, rapid
additions, editing, undo, persistence/reload and existing touch switching.
No measured performance issue justifies further optimization. Local rebuilt
preview on 3012 returns HTTP 200 for /os. Nothing deployed. Physical-device
feel and other browser engines remain unverified; developer review is next.

## Routine motion trial (2026-11-09)

**Scope and baseline.** Developer approved the 450ms/8px identity reveal,
soft glass creation-button press and completion-bubble compression. Existing
CSS and the focused browser harness changed; no shell, lifecycle, model or
store change was necessary. Baseline isolated Chromium reproduced 300ms/4px
motion. The developer's completely unseen reveal was not reproduced on their
device; reduced-motion preferences intentionally suppress it.

**Behavioral checks.** The sampled reveal starts at opacity 0/rise 8px, has
opacity 0.218/rise 6.25px near 107ms, 0.465/4.28px near 157ms,
0.907/0.74px near 307ms and reaches opacity 1/rise 0 near 457ms.
The CSS transition is 450ms and begins immediately. An early attempt's strict
300–400ms sampling window failed under load; the assertion now checks actual
intermediate opacity/travel and the computed duration, without requiring a
frame in that narrow window. Actual frame sampling remains in place.

Normal/reduced-motion control tests verify press, cancelled press without
committing, release, Orange fill, undo, fixed 44px targets, stable App Box height
while held and keyboard creation. Existing completion cases verify optional
fields, identity editing, reload without replay and early undo. Actual completed
Routine screenshot `outputs/habit-completion-refined-360.png` was inspected.

**Commands/results.** Used the installed Node v24.22.1 and browser cache paths
recorded below. Browser checks run outside the sandbox with synthetic accounts,
Bangkok time and external traffic blocked:

```text
node --test --test-reporter=tap --test-name-pattern="Habit identity starts|Routine controls press|Habit completion hides|Routine redesign|shared App Box geometry|new Habit accepts|Habit dated history|real Habit and Protocol|Routine full-page" tests/writing.browser.mjs
node --test --test-reporter=tap --test-name-pattern="Habit completion hides.*390px" tests/writing.browser.mjs
node node_modules/eslint/bin/eslint.js tests/writing.browser.mjs
git diff --check
```

Main run: 14/15 passed; the remaining assertion expected the old 0.3s duration.
Updated to 0.45s and its isolated recheck passed 1/1. All 15 selected cases
therefore pass across the main run and corrected recheck. Logs:
`outputs/routine-motion-trial-browser.log`, `outputs/routine-motion-trial-recheck.log`.
Targeted lint and whitespace pass. Initial shell Node shim was unavailable;
direct installed Node was used. Browser access to the local server required
leaving the sandbox. Production Next build (including types/static generation)
passes: `node node_modules/next/dist/bin/next build`, log
`outputs/routine-motion-trial-build.log`. Its process PATH was prefixed with
the installed Node directory. Two sandbox attempts failed to launch/connect
the CSS worker; the final build outside the sandbox passed. Local rebuilt Next
preview started on port 3012, leaving the prior preview process alone.

**Geometry/limits.** At 360/390x844, Note/Thoughts remain 346px with 48px gaps;
Routine/Protocol remain 666px with 24/48px gaps. Real row stacks grow to
1056.19/900.66px without inner scrolling. No measured performance issue calls
for optimization. Physical-device feel, non-Chromium engines and the cause of
the developer's missing animation remain unverified. Hosted sync/auth are not
certified by synthetic fixtures. Developer visual review is the next action.

## Immediate habit reveal and natural thread flow (2026-11-09)

**Scope.** Developer approved removing the completion pause/settling gate and
allowing smooth decorative threads behind buttons, keeping 7px border fades.
Existing shell/CSS only; no data model or store changes.

**Behavioral evidence.** The new browser test samples every animation frame
after the row becomes completed. The final run starts at opacity 0/rise 4px,
shows opacity 0.048/rise 3.81px around 43ms, opacity 0.464/rise 2.14px around
109ms, and opacity 1/rise approximately 0px around 310ms. This verifies actual
intermediate motion rather than only a final state. No second tap or dwell.
Undo restores action. Existing completed arrivals do not replay.

**Checks.** Direct installed Node v24.22.1 ran:

```text
node --test --test-reporter=tap --test-name-pattern="Habit identity starts|Habit completion hides|Routine redesign|shared App Box geometry|new Habit accepts|Habit dated history|real Habit and Protocol|Routine full-page" tests/writing.browser.mjs
node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx tests/writing.browser.mjs
node node_modules/next/dist/bin/next build
git diff --check
```

All 13 browser cases, lint, whitespace and build/types pass. Logs:
`outputs/habit-immediate-regression.log`, `outputs/habit-immediate-build.log`.
Browser fixtures cover 360/390px, normal/reduced motion, filled/empty optional
fields, undo, reload, editing, drafts/history and touch switching. At 844px
viewport height: Note/Thoughts 346px with 48px heading gap; Habit/Protocol
666px with 24/48px gaps. Long Habit/Protocol grow to 1056.19/915.58px without
inner scrolling. Synthetic screenshot `outputs/routine-design-390.png`
visually inspected for smooth natural thread placement; path no longer
steers around controls. Build preview restarted on 3011.

**Limits.** Developer visual review remains. Physical devices and non-Chromium
engines were not newly tested; isolated synthetic fixtures do not certify
hosted authentication/sync. No measured optimization was needed.

## Habit completion and flowing corner ribbon (2026-11-08)

**Approved scope.** Existing Routine shell/copy-swap, styles, tests and design
records. Developer approved a smooth intertwined corner bundle from their
reference, completed rows showing only supplied fields, and automatic identity
reveal after the existing pause (300ms fade/4px rise). No model/store change.

**Cause/fix.** Row-wide focus handling treated the completion button as an
editor. This exposed optional placeholders and blocked `showIdentity` until
focus left. Actual input focus now opens editing; control focus/completion
clears editing/new-row state. Existing inline editing and domain completion
actions remain. The copy-swap engine owns the same completion dwell/height
settling; its reveal uses 300ms opacity/4px travel and its nested settle/resize
timers are cleaned up on undo/edit/unmount. Already-completed arrivals remain
immediate. Reduced motion keeps the existing near-zero duration/no-rise rule.

**Verification.** With installed Node and Chromium cache paths recorded below:
`node --test --test-reporter=tap --test-name-pattern="Habit completion hides|Routine redesign|shared App Box geometry|new Habit accepts|Habit dated history|real Habit and Protocol" tests/writing.browser.mjs`
passed **11/11**, `outputs/habit-completion-verified.log`. New cases use 360px
reduced motion and 390px normal motion. Name-only, name/cue, name/identity and
all-field rows show no empty placeholders after completion. Identity reaches
full opacity without another interaction, settles to zero vertical offset,
opens its editor on deliberate tap, and supports undo. Early undo prevents a
later reveal; reload retains completion and shows existing identity immediately.
Existing cue/identity-first drafts, Habit history/Undo, Routine/Protocol flows
and geometry pass. No external calls or uncaught page errors in the fixtures.

Four resting frames remain Note/Thoughts 346px and opened tools 666px at
360/390x844; gaps remain 48/48/24/48px respectively. Eight real row/term stacks
settled at 1056.19px without inner scrolling. Production Next build including
types/static generation passed, `outputs/habit-completion-build.log`. Targeted
lint/whitespace checks passed. Inspected synthetic screenshots at
`outputs/habit-completion-refined-360.png` and `outputs/habit-completion-refined-390.png`.

**Attempts/artwork/limits.** Initial reduced-motion assertion expected literal
zero; the app's existing override reports 0.00001s, so the check now verifies
near-zero duration. Immediate second presses must wait for the shared button
engine's busy state; test guards now respect it. Fixed a fixture entry race
by waiting for the entry click when the tool is not yet open, and checked all
empty cue matches after reload. Final full selection passed. No button timing
or completion rule was changed to accommodate tests.

The thread fragment has twenty-four smoothly joined cubic curves forming a
small ribbon. Refined its path to the border gutters after visual inspection
found it crossing button faces on a long page. The 7px border fades and round
strokes remain. Physical phones, other engines, formal contrast and subjective
reference matching remain review limits; previous broader sync/beta gaps remain.
No further optimization was justified. Local preview port 3011 is refreshed;
no staging, commit or publishing. Next: developer review of completion/reveal
and the corner fragment.

## Stronger glass and border-only fades (2026-11-08)

Developer explicitly approved the reviewed stronger-glass/short-border-fade
adjustment. Changed only existing CSS and design/continuity records. Stronger
frame/button reflections and 16px backdrop blur preserve the Orange shadow and
center readability. Twelve existing deterministic curves now reach the frame
edges and use intersecting 7px bottom/right masks; their bodies no longer fade.
Rounded ends and reduced-transparency fallback remain.

Using the installed Node/cache paths below, command
`node --test --test-reporter=tap --test-name-pattern="Routine redesign|shared App Box geometry" tests/writing.browser.mjs`
passed **4/4**, `outputs/routine-edge-glass-browser.log`. Existing edits,
completion/undo, setup, offline sealing/reload and frame checks pass at phone
widths. Frame heights/gaps remain 346px/48px for Note/Thoughts, 666px/24px for
Routine and 666px/48px for Protocol at 360/390x844. Inspected the fresh synthetic
Routine screenshot for glass and border treatment. Production Next build,
including types/static generation, passed: `outputs/routine-edge-glass-build.log`.
Whitespace checks passed. No function, record, account or global geometry change.

This CSS-only pass justified no additional optimization. Physical-phone blur
performance, other engines, formal contrast and subjective material preference
remain review limits. Prior broader sync/beta/ResizeObserver gaps remain.
Local review is port 3011; no stage, commit, push or deployment. Next: developer
review of the stronger glass and short fades.

## Routine headings and glass finish (2026-11-08)

Approved the original 24px/28px proposal, then explicitly approved the added
material/threads scope through the follow-up question. Changed existing shell,
styles and browser checks; aligned Design, Page standard, decision log and the
shared page record. Domain actions/stores and user data are unchanged.

Using the installed Node/browser-cache paths recorded below, ran:
`node --test --test-reporter=tap --test-name-pattern="Routine full-page touch|Routine redesign|shared App Box geometry|real Habit and Protocol|Protocol wording|Protocol finished" tests/writing.browser.mjs`.
Passed **10/10**; `outputs/routine-glass-browser.log`. Checked 28px/700 semantic
section headings and the Routine-only 24px gap, existing controls/edits,
completion/undo, draft exit, offline sealing/reload, touch/hidden-writing pause,
dated wording and read-only phases. All four frame measurements at 360/390x844
remain 346px for Note/Thoughts and 666px for opened tools; Routine's gap is 24px
while the other three remain 48px. Long row/term stacks measured 1056.19px with
no inner scroller. Browser fixtures are isolated/synthetic with external calls
blocked. No owner data was accessed.

Visual review caught inherited uppercase/muted h2 styling after changing the
semantic elements. Explicitly retained sentence case, Bone and existing tight
tracking, then repeated the affected `Routine redesign|shared App Box geometry`
selection: **4/4**, `outputs/routine-glass-final.log`. Final production Next
build including types/static generation passed; `outputs/routine-glass-build.log`.
Targeted lint and whitespace checks passed. Inspected the updated synthetic
Routine screenshot. Twelve deterministic curves cross irregularly; each uses
its own fade-in/fade-out gradient and rounded ends. Glass reflections and a
10px backdrop blur remain scoped to the tool; reduced transparency removes
blur and artwork. No further performance optimization was justified.

Physical phones, other engines, formal composited-contrast conformance and
subjective material preference remain review limits. Prior standalone tsc,
other-surface ResizeObserver and sync/beta gaps remain. Local review is port
3011; nothing committed, staged or published. Next: review Routine's heading
hierarchy/material before the next approved polish slice.

## Routine and Protocol refinement (2026-11-08)

**Approved scope.** Existing shell/Protocol/styles/tests and design records;
borderless text entry as a standing app-wide rule, smaller controls, equal
padding/aligned headers, denser threads, faint Orange button shadow, removal of
Focus and temporary navigation, and simpler historical metadata. No record,
domain action, persistence, auth configuration or deployment change.

Used the installed Node executable and explicit Chromium cache described in the
implementation entry below. Final command:
`node --test --test-reporter=tap --test-name-pattern="Routine full-page touch|Routine redesign|Day One v3 Routine|Habit dated history|new Habit accepts|empty Habit History|Protocol wording|Protocol finished|Protocol term inputs|Protocol past phases|shared App Box geometry|real Habit and Protocol|Page spacing across Today" tests/writing.browser.mjs`
passed **25/25**. Log: `outputs/routine-refinement-browser.log`.
Production Next build including TypeScript/static generation passed;
`outputs/routine-refinement-build.log`. Targeted ESLint for the shell, Protocol
and browser test, and whitespace checks passed.

At 360x667 and 390x844, checked focused new-task fields have transparent
background, no border, outline or shadow; caret and editing still work. Checked
48px creation buttons with 18px labels, equal 24px Page padding, actual Header
text tops agreeing within 0.5px, 28px visible bubbles and 44px hit targets,
hidden temporary navigation and no Focus editor. History no longer contains
the days-kept paragraph; original period, term words/counts and prospective
records survive. Existing completion/undo, draft, reload/offline, touch and
historical-write protections pass. Inspected refreshed synthetic screenshots
at `outputs/routine-design-*.png` and `outputs/protocol-design-*.png`.

Four-frame measurements at 360/390x844: Note/Deep Thoughts remain 346px and
empty Routine/Protocol 666px; each gap remains 48px. Real row/term stacks settle
at 1077.78px without nested scrolling. Exact-pixel checks initially found a
legacy mobile 22px override despite the new padding tokens; replaced that
override with the shared tokens, then reran all 25 checks and the build.

Existing other-surface ResizeObserver notices remain in the broader spacing
audit, as previously recorded. Physical-phone keyboard, other browser engines,
formal composited contrast, and every auth/admin editor state are not newly
certified. The standing borderless rule applies in shared CSS; those additional
surfaces still need lived/browser review. Existing live-sync/beta gaps remain.
No further optimization was justified. Local review uses port 3011; no publish,
stage or commit. Next: developer review of Routine before action-motion polish
and the separately scoped bottom-navigation task.

## Routine and Protocol glass redesign (2026-11-08)

**Scope/setup.** Approved design slice in the existing shell, Protocol component,
styles and records; no domain model, store, account configuration or deployment
change. Reused ChapterPlayer, SwipeSession, PageLayout, App-back and the button
engine. Removed overall totals while retaining per-phase evidence. See
[the design record](archive/2026-11-11-doc-cleanup/PAGE_DESIGNS.md#first-implementation-slice---2026-11-08).

Used installed Node at
`C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`.
Browser runs set `PLAYWRIGHT_BROWSERS_PATH` to
`C:/Users/wickie''/AppData/Local/ms-playwright`. The existing isolated Vite/
Chromium harness uses real components/CSS/stores, synthetic accounts, Bangkok
time and blocked external traffic. No owner records were opened.

**Checks.**

- Baseline: 50/50 tests in the five model files below. Final command:
  `node --test --test-reporter=dot tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/protocol-home.test.mjs tests/protocol-wording.test.mjs tests/phases.test.mjs`
  passed 49/49. One obsolete empty-Sub-Body source assertion was removed because
  the new empty Routine exposes creation buttons. Removed totals-strip source
  assertions while retaining the legacy arithmetic test. Both presentation
  rules are now verified in the browser.
- Main browser command:
  `node --test --test-reporter=tap --test-name-pattern="Routine full-page touch|Routine redesign|Day One v3 Routine|Habit dated history|new Habit accepts|empty Habit History|Protocol wording|Protocol finished|Protocol term inputs|Protocol past phases|shared App Box geometry|real Habit and Protocol|Page spacing across Today" tests/writing.browser.mjs`.
  Its 24 established cases passed. The new touch case initially started the
  reverse swipe before the forward swipe committed. Corrected its selector to
  assert the current Page instead of a visible adjacent Page. Final
  `--test-name-pattern="Routine full-page touch"` run passed 1/1. All 25 cases
  therefore pass across the final main run and touch recheck. Logs:
  `outputs/routine-design-verification.log`, `outputs/routine-design-touch.log`.
- Installed Node running `node_modules/next/dist/bin/next build` passed,
  including TypeScript/static generation. Prepended its installed directory to
  PATH for child processes. Log: `outputs/routine-design-build.log`.
- Targeted ESLint on shell, Protocol and the changed tests passed. Standalone
  `tsc --noEmit` still reports the existing `db/index.ts` resolution of
  `cloudflare:workers`; the supported Next type check passes. No broad suite,
  full lint or Vinext build is claimed.

**Behavior.** 360x667 and 390x844 verified Habit/Task creation/edit/undo, cue and
identity-first drafts, Record and dated history, leave/return/reload, discarded
Protocol drafts without past records, all five durations, Begin validation,
term checks and conditional sealing, offline seal persistence, no reseal after
reload, prospective wording and original dated history, read-only finished
phases, and confirmed archival. Long term inputs also passed at 1280px. Twelve
past phases retain their records while growing with the document. Inspected
`outputs/routine-design-*.png`, `outputs/protocol-design-*.png` and
`outputs/phases-design-*.png`; data is synthetic.

The real-touch check at 390x844 verifies both swipe directions, unchanged hidden
writing after a 31-second idle advance, and Record > Focus saving through the
existing store. Browser Back leaves the tool. Selected fixtures made no external
backend/model calls and had no uncaught page errors.

**Measurements.** At 360x844 and 390x844: Note/Deep Thoughts frames remain 346px;
empty Routine/Protocol are 666px. All four have 48px header-to-content gaps.
Measured and removed an extra 25px before Routine's first section. Eight Habit
rows/eight Protocol terms each settled at 1146.56px without inner scrolling.
Twelve past phases measured 2939.19px with no inner/horizontal scroll. Compact
writing tokens are unchanged; full-page tools have their own scoped floor.

**Attempts/limits.** Used the installed executable after the default Node
launcher failed, and an explicit browser cache after redirected lookup failed.
Restricted loopback/compiler attempts failed; approved local runs completed.
Corrected a small completion hit target and inherited Protocol tick/block
styling, then rechecked. Keeping hidden mounted editors measurable resolved
the new hidden-editor resize loop. The cross-app spacing audit still logs the
previously recorded ResizeObserver notifications on other surfaces; global
absence is not certified. No physical-phone keyboard, other browser, formal
composited-contrast conformance, live sync or beta/release certification is
claimed. No further measured optimization was justified. Next: developer review
of the local pages. Nothing staged, committed, pushed or deployed.

## Durable hosted reload recovery (2026-11-06)

**Approval and setup.** Developer approved the proposed recovery scope before
edits: new `app/os/sync-check/durable-checks.ts`, the existing check client, new
`tests/writing-hosted-recovery.browser.mjs`, and the four evidence documents.
Started on `paing-branch`, HEAD `d841643`, with 20 modified tracked paths and
untracked `debug.log`; preserved all prior work. No stage, commit, push or deploy.
The migration files, product writing store and `.env.local` are unchanged;
`NEXT_PUBLIC_CIRCLE_WRITING_SYNC=disabled` remains explicit.

The development-only page adds start/continue/reload controls below the existing
hosted checks. It stores one synthetic run in the separate account-scoped
`circle-os-writing-hosted-recovery-v1` IndexedDB database via `scopedTransaction`.
Three stored device bundles reuse writing/queue/conflict models and the actual
coordinator/transport. No product writing database is opened. The entry namespace
is `recovery_<24 hex characters>`; checkpoint validation restricts stored upload,
choice, writing, draft and pending-change targets to that entry. Each completed
phase stores `performance.timeOrigin`; continuation requires a different page
time origin, so development hot reload does not count as a full reload. Internal
multi-request steps are journaled for retry; checkpoint and bundle writes commit
through account scope guards. Start makes no network request. Completed reload
inspection makes no request either. The normal sync runner remains disabled.

**Final local commands.** `node` means the installed executable at
`C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`.
Browser commands set `PLAYWRIGHT_BROWSERS_PATH` to
`C:/Users/wickie''/AppData/Local/ms-playwright`; builds prepend the Node directory
to `PATH`. Tests/build ran outside the sandbox after the recorded network failure.

```text
node --test tests/writing-hosted-recovery.browser.mjs
Final 4/4 passed; exit 0 (62.254 seconds while the final build ran concurrently).

node node_modules/eslint/bin/eslint.js app/os/sync-check/durable-checks.ts app/os/sync-check/sync-check-client.tsx tests/writing-hosted-recovery.browser.mjs
Final targeted lint passed; exit 0.

node node_modules/next/dist/bin/next build
Final production build, TypeScript and all 14 static pages passed; exit 0.
```

The isolated browser page renders the actual `SyncCheckClient` with a synthetic
Auth client and intercepts every Supabase RPC into the actual migrated PGlite SQL;
no request reaches hosted Supabase. Other external requests are blocked. Cases:

- At 360px and 390px, start while genuinely browser-offline; save to IndexedDB
  with zero RPCs. Same-document continuation is rejected. Reconnect, fully reload
  at all five checkpoints, recover exact uploads/choices, preserve newer edits,
  recover histories into a fresh durable device, and finish deletion. Complete
  records survive a further reload. A synthetic sentinel in the product-named
  writing database remains unchanged. Server assertions verify one terminal head
  at version 7, two scrubbed resolution rows and five receipts per run. All three
  test bundles and stored replay snapshots contain no synthetic writing afterward.
- Abort an actual HTTP response after SQL accepts an upload, before a checkpoint
  advances. Reload/retry preserves its request ID and server version. Repeat for
  a resolution and verify exactly one archived resolution before continuing.
- Switch accounts while an accepted upload reply is held. The old account cannot
  checkpoint after the scope changes; the new account sees no old run. Each
  account restores its own entry/request on return. A queued IndexedDB read is
  aborted on scope change. All final cases have no page errors.

**Hosted execution.** Used the existing development server at
`http://localhost:3000/os/sync-check` and the two existing confirmed hosted accounts
in normal/private Opera windows. Windows Computer Use performed the page actions;
credentials stayed in their existing sessions. One app/window listing timed out;
a fresh listing succeeded. No password, token or server secret was transferred.
The private-window entry was `recovery_0cec3a3f24e4484aa9d4fe6e`; the normal-window
entry was `recovery_30ecc1ed34f74c5c8ea12944`. Each account used its own entry.

For **each** account, observed the six stored PASS lines and full page reloads:

1. Synthetic writing and one pending upload committed locally without a request.
2. Reload retained that upload. Hosted acceptance was received, deliberately
   omitted from local acknowledgement, and `upload-reply-lost` was committed.
3. Reload retained the request. A newer local save survived exact receipt recovery
   without a duplicate. Competing device/cloud copies and a choice were persisted.
4. Reload retained the identical choice. The hosted resolution was accepted and
   its reply deliberately omitted locally; `choice-reply-lost` was persisted.
5. Reload retained the choice for exact retry. A newer local edit stayed pending
   as a conflict; original histories remained unchanged. A fresh durable fixture
   recovered histories. The cloud copy was chosen, then permanent deletion queued.
6. Reload retained the deletion. Hosted deletion completed; old upload/choice
   replays could not change the terminal head. All three stored test devices and
   replay request bodies were scrubbed. `complete` survived another full reload;
   Check saved completion returned without an error in both windows.

The hosted loss simulation deliberately drops acknowledgement **after** a real
HTTP result returns; the separate local cases above also abort the HTTP response.
Hosted offline page loading and physical-device restart were not tested.

A final **read-only** SQL audit on the approved project returned four true rows:
two terminal heads across two owners at server version 7, four resolution rows
with null request/result bodies, ten body-free receipts across those owners, and
no non-null conflict candidate for the two recovery IDs. Synthetic text is deleted;
Auth accounts, tombstones/receipts and body-free local completion metadata remain.
No schema/configuration or personal record changes were needed.

**Attempts and correction.** The sandboxed browser suite failed all four cases
at loopback navigation with `ERR_NETWORK_ACCESS_DENIED`; the approved outside-
sandbox run reached the fixture. Its first three deletion assertions then failed
because the new harness incorrectly required an already-accepted upload replay to
return `deleted`. Inspection of the unchanged SQL showed exact accepted uploads
return their immutable body-free receipts before the tombstone branch. Corrected
the harness to accept exact receipt replay only when the terminal head remains
identical; old resolution replay must still return `deleted`. This was a harness
expectation error, not evidence of resurrection or a product/SQL fix. The corrected
four-case run passed, then passed again after adding stored-target validation.
Final lint/build and both hosted runs use that final code. No measured performance
problem justified optimization. Repeat runs overlap; do not add their counts.

**Limits and next gate.** This proves the shared transaction/models/coordinator
with a **separate synthetic IndexedDB adapter** and actual hosted page reloads.
It does not certify the product writing-store adapter, physical phone, cold browser
restart, private-window closure, eviction recovery or offline page load. Account
switching/late response here is local fixture proof; the preceding hosted slice
retains its real reciprocal-account access evidence. Hosted unconfirmed/expired/
revoked valid sessions, true multi-connection lock contention, backup/restore and
maximum deleted-backup retention remain open. No geometry/type/gap or Circle-day
rule changed or needed new measurement; prior date/ResizeObserver and broader
beta gaps remain. Next: separately review the hosted-session test scope. Real sync
stays disabled; activation and deployment remain separate.

## Follow-up migration and hosted resolution checks (2026-11-06)

**Scope and setup.** Developer explicitly approved applying the reviewed follow-up,
extending `app/os/sync-check/` and `tests/writing-hosted-harness.test.mjs`, and
updating the writing contract, current task, handoff and this record. Branch
`paing-branch`, HEAD `d841643`; all 15 pre-existing modified tracked paths and
untracked `debug.log` preserved. No stage, commit, push or public deployment.
The original migration and `.env.local` are unchanged; the latter still has
`NEXT_PUBLIC_CIRCLE_WRITING_SYNC=disabled`.

**Hosted migration.** Used the existing authenticated Opera Supabase SQL Editor
for `gcqmblrkpfvjnewzdycj`. A read-only preflight returned false for the resolution
table, both RPCs and deletion trigger. Applied only
`supabase/migrations/202611060001_writing_resolution.sql`, SHA-256
`60b823dcc45f8ca5ff3623913272501e8dba6886178111600e4c410ec6e929e2`.
Supabase reported `Success. No rows returned`. Seven subsequent catalog checks
all returned true: all three function bodies match the file after CR normalization;
table RLS and select-only authenticated access; owner-select policy; authenticated-
only RPC grants/fixed definer search paths; deletion trigger; inaccessible scrub
helper; initially empty resolution archive. Application used SQL Editor; no CLI
migration-history registration was performed. Neither migration should be reapplied.

**Hosted account execution.** Served the local development harness at
`http://localhost:3000/os/sync-check` using the ignored existing Supabase settings
and two existing confirmed hosted accounts, normal and private Opera windows.
Credentials stayed in their existing sessions; no token/password/secret was
copied into the chat, fixtures, browser fields or repository. The server-only
service-role probe uses its existing environment secret and returns sanitized
status only. Synthetic bundles and simulated devices stay in memory, outside the
person's IndexedDB ledger. Cross-window witnesses contain IDs and versions only.

Both accounts completed their runs, with the second using the first account's
witness and the same synthetic IDs. Observed passes:

- Own writing/inventory and exact receipt retry/recovery; changed operation reuse
  rejected; accepted upload response loss recovers before a newer local save.
- Competing saved copies remain intact and pause that entry. A cloud edit after
  review makes the old choice return `changed` and requires a fresh review.
- Local choice retains both original histories. Its accepted response is deliberately
  lost; a cloned bundle simulates reload, then a newer edit is saved. Recovery
  retains the newer edit and pending conflict. Exact resolution retry returns the
  same result; changed reuse of that request ID is rejected.
- Cloud choice settles the reviewed copy. A fresh in-memory device recovers the
  retained original histories through the real hosted history RPC.
- Trash/restore and permanent deletion work; stale uploads and old resolution
  requests return the deleted result, never restore text. Deleted archives disappear
  from owner history; the competing local fixture is scrubbed.
- Anonymous and invalid-JWT requests are rejected by all five RPCs. Both server
  service-role probes pass with actual HTTP permission denial; unlike the older
  run, the local server probe did not encounter a network failure.
- Account B cannot see A's head, exact receipts or still-live synthetic archive.
  B uses the same entry IDs independently and cannot resolve a foreign-owner choice.
  B's IDs-only witness is copied back to A; reciprocal rechecks reject peer access,
  verify each original tombstone/receipts/live archive remains unchanged, then
  delete each remaining archive and verify old-choice replay stays deleted.

Both final rechecks showed their two PASS lines. A final read-only SQL audit for
`hosted_c228416e8af14e08822dacd5` and its `_archive` entry returned four true rows:
four isolated terminal heads across two owners (main server version 11, archive
version 5); six resolution rows with null request/result bodies; two conflict
candidates with null bodies; 26 body-free receipts. Synthetic bodies are deleted.
Those minimal records and the two Auth accounts remain. No owner writing or
legacy profile-server records were read, edited, imported or cleared by the harness.

**Local verification.** `node` below is the installed executable at
`C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`.
Build/dev commands prepend that directory to `PATH` for child CSS workers.

```text
node --test tests/writing-resolution.test.mjs tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-hosted-harness.test.mjs
36/36 passed; exit 0.

node --test tests/writing-hosted-harness.test.mjs
Final reciprocal-isolation refinement: 3/3 passed; exit 0.

node node_modules/eslint/bin/eslint.js app/os/sync-check/hosted-checks.js app/os/sync-check/sync-check-client.tsx app/os/sync-check/service-role/route.ts tests/writing-hosted-harness.test.mjs
Final targeted lint passed; exit 0.

node node_modules/next/dist/bin/next build
Final production build, TypeScript and all 14 static pages passed; exit 0.
```

These selections overlap; their counts must not be added as unique tests.
The SQL-backed harness regression checks both same-ID accounts while live archives
exist, reciprocal rechecks, repeatable cleanup, six scrubbed resolution rows and
no readable histories afterward. Hosted runs exercised the final recheck logic
after development hot reload, retaining both in-memory witnesses.

**Attempts and limits.** Opera connector was unavailable; Windows Computer Use
was used. Earlier turns stopped when the tool could not establish the browser
URL; no migration occurred then. Browser input interruptions required fresh
observations. The first SQL application failed with `25006`: the editor value
setter inserted the migration into the read-only audit buffer rather than replacing
the whole buffer. No schema change occurred in that failed transaction. Explicit
editor Select All/replacement removed the audit text; standalone migration then
succeeded and installed-function hashes matched. An initial harness-test assertion
expected four conflict rows; only two are persisted (the archive-device conflicts
are detected during inventory before upload). Corrected the test expectation and
reran successfully; no application or SQL fix was needed. Sandboxed dev bind failed
with `EACCES`; sandboxed build CSS-worker connection failed. Approved outside-
sandbox dev/build runs succeeded. The dev server remains running on port 3000.

No product geometry/type/gap, persistence protocol, chapter content or AI behavior
changed. Local-first/newer-edit preservation, account boundaries, immutable
histories, terminal deletion and original Circle attribution use the existing
engines; no new geometry measurement or performance optimization was warranted.
Hosted unconfirmed/expired/revoked valid sessions, actual-device/IndexedDB reload,
true multi-connection lock contention, backups/retention and wider beta readiness
remain unverified. The hosted reload/new-device checks above are memory fixtures,
not durable device-store evidence. Earlier Week-date/ResizeObserver, physical-phone,
other-browser and broader checks remain open. Real sync stays disabled; activation
requires a separate review after outstanding gates. Earlier product/architecture/
roadmap statements that this follow-up was unapplied predate this evidence; the
current writing contract and task record this bounded result without changing
their wider requirements.

## This note label clarification (2026-11-06)

Developer clarified the reported unchanged note involved New Note, a separate
entry. Live synthetic-demo reproduction through the actual editor on the same
note updated Saved copies and ledger text correctly, with no page errors.
Approved label rename: Current note → This note, including its history lookup.

`node --test --test-name-pattern="mobile conflict" tests/writing-cloud.browser.mjs`
passed 2/2 at 360/390px using the installed Node/Playwright setup below. These
cases open This note history after later saves/reload and retain archived words.
`node node_modules/next/dist/bin/next build` passed including TypeScript and
14 static pages. Local review server rebuilt/restarted; no public deployment,
hosted SQL/configuration, activation, data or geometry changes. Prior gaps remain.

## Latest saved Note and shared scrollbar hiding (2026-11-06)

Approved UI scope: current saved Note first in Saved copies, unchanged retained
snapshots, hidden scrollbar chrome in Note/History/Trash, and normal review-server
rebuild/restart. Existing installed Node/Playwright paths and isolated fixtures
remain those recorded below. Exact commands from the repository root:

```text
node --test tests/writing-cloud.browser.mjs
15/15 passed.
node --test --test-name-pattern="Note, History and Trash stay bounded|shared App Box geometry|History bins move only" tests/writing.browser.mjs
5/5 passed; run after the cloud suite to avoid overlapping Vite fixtures.
node node_modules/eslint/bin/eslint.js app/os/writing-sync-page.tsx tests/writing-cloud.browser.mjs tests/writing.browser.mjs
Passed without warnings.
node node_modules/next/dist/bin/next build
Passed including TypeScript and 14 static pages.
```

Cloud cases now resolve a conflict, save newer words, reload, open Saved copies,
verify Current note and its latest historical version show those words, and
verify the original cloud history still contains its original two versions.
Normal Note return shows the latest words. Other account/conflict/deletion/retry
checks remain passing. No schema or upload behavior changed.

Full-component tests at 390x844 and 360x667 inspect `scrollbar-width: none` in
Note/History/Trash, while verifying actual long-content scrolling, touch/wheel,
keyboard caret, single Body scrolling, visible Footer, resize and restore/delete.
History creates two distinct notes, retains the newer entry through reload and
restores only the selected trashed note. Four resting frames remain 346px,
Page heights 344px and header gaps 48px at 360/390px. Long writing/Trash reaches
480px at 390x844 and 400.1875px at 360x667 without adding inner scroll panels.
Inspected `outputs/note-bounded-history-390.png`; writing/Trash captures generated.

The identified previous Next review process (PID 12720) was stopped, and the
verified production build restarted on port 3000. Read-only GET `/os` returned
200 with 12498 response bytes. This is local preview, not public deployment,
hosted login or physical-device verification. Browser/build/server commands used
approved outside-sandbox local networking. No remote SQL/configuration, sync
activation or personal import occurred. Previous beta/backup/device gaps remain.

## Conditional Sync controls (2026-11-06)

Approved UI-only scope: rename Writing sync to Sync, hide it without pending
saved work/conflicts/recoverable error, and show Try again only after an error.
Hide retry while recovering. Retained archives move to Saved copies on the
owning Note History row, independently of Sync visibility; row opening still
edits. Existing uncommitted comparison changes remain intact.

Commands use installed Node v24.22.1 and the installed Playwright cache, with
the same isolated local PostgreSQL/Auth/HTTP/IndexedDB fixtures as below:

```text
node --test tests/writing-cloud.browser.mjs
14/14 passed.
node --test --test-name-pattern="Sync is absent" tests/writing-cloud.browser.mjs
The additional visibility case passed (1/1).
node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx app/os/writing-sync-page.tsx app/os/writing-sync-provider.tsx tests/writing-cloud.browser.mjs
Passed.
node node_modules/next/dist/bin/next build
Passed including TypeScript and all 14 static pages.
```

At 360/390px, conflict review has no idle retry button; both choices still work.
After completion, Sync disappears from Note History. Saved copies still opens
the retained copies and their dated histories, and normal Note return shows the
selected text. A failed choice exposes Try again, clicking it removes the retry
presentation and persisted work recovers across reload. Separate real-store
checks prove empty and unsent-draft-only states do not expose Sync; a saved
change while offline exposes it; reconnect drains the queue and hides it again.
Cloud-off has no Sync/retry action. Existing transport/lifecycle/long-scroll/
deletion checks also passed in the full selection.

No geometry/type/gap tokens changed; no new measurements claimed. No new SQL,
environment configuration, activation, import or deployment. Browser/build
commands ran outside the sandbox for local networking. Hosted/device/backup and
broader beta gaps remain open. No measured issue justified optimization.

## Minimal writing comparison (2026-11-06)

Approved UI-only refinement: Note typography and default CreativeButton design;
Cloud above Device; Use Cloud above Use Device; no large comparison heading,
instruction paragraph, dates, inline Saved history or persistent success message.
Copy-tap opens dated read-only history; confirmed choice returns silently to the
list. Pending/error/retry and stale-review checks remain. Deletion while history
is open hides captured versions. No sync protocol, SQL or activation changes.

Using installed Node v24.22.1 and the installed Playwright cache (paths/fixture
isolation detailed in the preceding writing-sync entry), final checks were:

```text
node --test tests/writing-cloud.browser.mjs
13/13 passed before the final deletion-history guard.
node --test --test-name-pattern="mobile conflict|review detects|long comparison" tests/writing-cloud.browser.mjs
4/4 final affected cases passed; includes the new long-scrolling/deletion case.
node --test --test-name-pattern="shared App Box geometry" tests/writing.browser.mjs
2/2 passed on isolated rerun.
node node_modules/eslint/bin/eslint.js app/os/writing-sync-page.tsx tests/writing-cloud.browser.mjs
Passed without warnings.
node node_modules/next/dist/bin/next build
Final build including TypeScript and all 14 static pages passed.
```

Actual component tests at 360/390px verify both choices, copy/history/Back, silent
return, reopening retained histories, selected Note text on return, 44px choice
targets, vertical Cloud/Device button order, no horizontal overflow, and hidden
scrollbar style with actual long-content scrollTop movement. Offline choices stay
disabled; failed responses remain recoverable across reload. A deleted history
stops rendering its versions. Default Note remains silent and separate.

All four resting frames remain 346px, Page heights 344px, header gaps 48px;
visible gaps are 52px for Note/Thoughts and 51.09375px for Habit/Protocol. Long
Note retains its existing bounded Body behavior. Inspected
`outputs/writing-conflict-360.png`; 390px capture also generated.

Initial test syntax and ref-lint errors were fixed. The first concurrent geometry
run timed out waiting for fixture initialization at both widths; overlapping
Vite/HMR activity was observed. It measured no geometry and its exact cause was
not isolated. The unchanged run alone passed both widths. Browser and build
commands ran outside the sandbox for local networking as in previous slices.
No performance issue justified optimization. No hosted migration/activation,
physical-device or backup/retention verification is claimed; earlier gates stay.

Live isolated demo smoke at 390px with normal animations also passed: comparison,
Use Cloud and silent return to the synced list, with no page errors. An initial
smoke timed out after Reset sample navigation; a fresh-page run with settled
navigation passed. This demo uses synthetic local data, not hosted Supabase.

## Writing sync status and conflict resolution (2026-11-06)

**Scope and setup.** Approved repository implementation only. Used the installed
Node at `C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`.
The SQL fixture applies the unchanged original migration and the new
`202611060001_writing_resolution.sql` in isolated PGlite PostgreSQL with synthetic
Auth claims. Browser checks use actual writing provider/pages, IndexedDB,
authenticated transport and a local HTTP RPC fixture backed by that database.
No hosted credentials, personal writing, legacy profile-server writes or model
calls are part of these tests. Browser requests outside the fixture origin are
blocked. Test tokens/accounts are synthetic; this is not hosted JWT evidence.

**Final commands and results.** Commands run from the repository root. `node`
below means the installed executable above; PowerShell uses `&` and the quoted
absolute path. Browser runs set `PLAYWRIGHT_BROWSERS_PATH` to
`C:/Users/wickie''/AppData/Local/ms-playwright`. Build runs prepend the installed
Node directory to `PATH` so CSS-worker subprocesses use the same executable.

```text
node --test tests/writing-resolution.test.mjs tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-model.test.mjs tests/writing-sync.test.mjs tests/writing-compatibility.test.mjs
100/100 passed; exit 0.

node --test tests/writing-cloud.browser.mjs
13/13 passed; exit 0 after editor-return/shared-transition corrections.

node --test --test-name-pattern="writing sync view|mobile conflict|review detects" tests/writing-cloud.browser.mjs
Final 5/5 affected cases passed; exit 0 after conflict-reply validation tightening.

node --test --test-name-pattern="shared App Box geometry" tests/writing.browser.mjs
2/2 passed; exit 0.

node node_modules/next/dist/bin/next build
Final production build, TypeScript, all 14 static pages and route collection passed; exit 0.

node node_modules/eslint/bin/eslint.js app/os/writing-conflict-model.js app/os/writing-cloud-model.js app/os/writing-cloud-runner.tsx app/os/writing-cloud-sync.js app/os/writing-pages.tsx app/os/writing-provider.tsx app/os/writing-sync-provider.tsx app/os/writing-sync-page.tsx app/os/writing-store.ts app/os/writing-transport.ts tests/writing-resolution.test.mjs tests/writing-cloud.browser.mjs tests/writing-transport.test.mjs tests/helpers/writing-cloud.mjs
Passed without warnings; exit 0.
```

Documentation audit of added links passed: 14 local links, including 13 heading
fragments. `git diff --check` passed with the existing LF/CRLF notices.

**Observed behavior.** At 360x844 and 390x844 (Bangkok timezone, reduced motion),
History → Writing sync shows cloud-off/device-only states without putting status
back into the Note editor. Separate synthetic devices produce competing saved
copies; the screen shows both labels/text/dates, and both choice directions work.
Choice targets measure at least 44px; no horizontal page overflow. Histories can
be reopened after resolution, and the clean Note editor shows the chosen text.
Changes during review require updated review. Offline choices are disabled.
An accepted resolution with its HTTP response deliberately aborted stays locally
queued, survives reload, retries exactly once and leaves one server resolution.
The original browser transport cases also pass: normal/offline save/reload,
clearing/Trash/restore/deletion, failed acknowledgement storage, late old-account
responses, newer in-flight edits, conflicts and the enabled runner.

Focused SQL/model evidence checks immutable cloud-prefix versions and untouched
branch histories, exact retry/changed-request denial, owner-only archives and
denied anonymous/missing-identity/service-role resolution/history access. A new
device recovers both histories. Newer local work after lost replies remains a
conflict; stale server choices do not overwrite newer heads. Terminal deletion
scrubs server request/result bodies and local archived copies; replay cannot
restore writing. All four writing kinds preserve Unicode, original source and
the original Circle attribution across a choice made on a later day.

**Measurements and artifacts.** At both phone widths, Note/Thoughts/Habit/
Protocol outer frames are **346px**, Page heights **344px**, header gaps **48px**.
Visible text gaps are 52px for Note/Thoughts and 51.09375px for Habit/Protocol.
No resting inner scroll; short Note rests at the shared size, and long Note
grows within the existing 480px cap with only Body scrolling. Conflict screenshots:
`outputs/writing-conflict-360.png` and `outputs/writing-conflict-390.png`; inspected
the 360px image. It shows the first copy and fixed choice Footer; Body scrolling
reveals the second copy/history within the approved writing ceiling.

**Attempts, limits and next step.** An initial deletion assertion found an archive
left in the local-tombstone receive path; fixed and rerun. Code review found a
clean Note buffer retaining old text after a choice; fixed and browser-verified.
Initial `node` resolved to an unavailable version launcher; used installed Node.
The sandbox's altered browser path was corrected to the installed browser cache;
Chromium then hit `ERR_NETWORK_ACCESS_DENIED` on loopback. Production builds first
failed through the Node launcher and then a sandboxed CSS-worker connection.
Approved outside-sandbox browser/build runs passed. These attempts do not certify
or disprove hosted behavior. Final affected counts overlap the full selections;
do not add them as unique coverage. No performance issue justified optimization.

The new SQL file is **not applied remotely**. No environment change, activation,
personal import, deployment, physical-phone/Opera acceptance, real hosted device
recovery, true multi-connection lock contention or backup/retention proof.
Existing Week model date expectation, ResizeObserver and wider beta gaps remain.
Next is developer UI review and separately reviewed follow-up migration/hosted
checks under [the current contract](ACCOUNT_WRITING_SYNC.md#writing-status-and-conflict-resolution---2026-11-06).

## Account header and alias greeting (2026-11-06)

Font correction: Chromium's `CSS.getPlatformFontsForNode` confirmed the prior
menu already used custom Geist. Actions used regular weight; they now use the
existing **650** control weight, with an explicit brand-family binding. The
test checks the actual platform font (Geist, custom) and computed 650 weight.
All **3 affected browser cases**, **2 geometry cases** and targeted test lint
passed after this change. Menu now measures **100.89px** at both phone widths,
still with **24px left/right** and **44px** actions. Inspected the updated 360px
capture. No new full production build for this CSS correction; previous build
results remain dated to the earlier implementation. The measurements below
describe prior refinements where they differ.

Latest spacing correction: fit the action menu to its labels rather than a
fixed 192px. At 360px and 390px it measures **97.25px**, with **24px left and
24px right** around the longest label and **44px** action heights. Only the
alias editing form retains 192px. The three affected alias/browser cases passed
again using the `account header|edited alias` selection; targeted lint passed.
Inspected the new 360px capture. The first geometry run passed both resting-frame
measurements but failed the immediate long-Note growth assertion at 390px;
timing is an inference. An unchanged rerun passed **2/2**, including growth,
with the same 346px frames/48px gaps. No product or test fix was made for that
intermittent assertion. No new full Next build was run for this spacing-only
correction; previous build evidence remains dated to the prior refinement.

Follow-up requested by the developer: the account trigger now shows three dots
instead of the alias, and the menu is **192px** wide rather than 288px. The full
alias remains in the greeting. Reverified with
`node --test --test-reporter=spec --test-name-pattern="account header|edited alias|invite link is scrubbed" tests/supabase-auth.browser.mjs`:
**4/4 passed**, including the measured menu width at both phone widths and the
44px target. Geometry cases passed **2/2** again with the same measurements
below. Targeted lint and a new Next production build including types passed.
Inspected the updated 360px menu capture. This supersedes the initial alias-on-
button description below; other behavior and limitations remain.

Developer approved the reviewed header/account-menu and missing-alias fix and
explicitly removed the header Saved status. Started with a clean tree on
`paing-branch`, HEAD `df2b397`. No staging, commit, push, deployment, hosted
configuration or personal-data change by this slice.

### Behavior and verification setup

The existing header now contains the alias button, opening Edit alias and Sign
out. The separate signed-in account bar and header Saved/Waiting to sync/Synced
status are removed. A context supplies verified, account-scoped display identity
and reuses the current auth controller/adapter for alias changes. The greeting
reads this alias instead of the account's empty legacy profile-name field. No
alias is copied into personal records; legacy mode retains its old name source.
Changing accounts unmounts the old menu. Full-screen chapter dialogs expose an
account control while the covered header control is hidden, preserving logout
during first onboarding. Long aliases fit the button and wrap in the greeting.

The existing auth browser harness now includes the actual OSFrame and an
optional actual Today shell. Tests run the real Supabase JS client, auth
controller, offline proof, account storage and UI against synthetic Auth
responses/signed tokens. Accounts A and B use different aliases. Chromium uses
Bangkok time and 360x844/390x844 mobile viewports. No real hosted identities,
credentials or personal evidence are used.

### Checks

- `node --test --test-reporter=spec tests/supabase-auth.test.mjs tests/account-scope.test.mjs`:
  **18/18 passed**.
- `node --test --test-reporter=spec tests/supabase-auth.browser.mjs`:
  **13 passed, 2 optional production-origin cases skipped**. Covers account
  alias in header/greeting, 44px targets within the header, keyboard open/Escape
  and restored focus, outside dismissal, cancelled/Unicode/40-character alias
  edits, unchanged profile name, reload, A/B/A isolation, closed menus on account
  change, onboarding logout access, offline alias return and rejected offline
  edit. Existing login/recovery/revocation/offline record checks also passed.
- After the long-alias wrapping fix,
  `node --test --test-reporter=spec --test-name-pattern="account header|edited alias" tests/supabase-auth.browser.mjs`:
  **3/3 passed**. Includes a direct scroll-width assertion against clipped
  greeting text. Inspected `work/account-menu-360.png` before and after the fix.
- `node --test --test-reporter=spec --test-name-pattern="shared App Box geometry" tests/writing.browser.mjs`:
  **2/2 passed**, repeated after the wrap fix. Note, Thoughts, Habit and Protocol
  each rest at **346px**, rendered page **344px**, shared header gap **48px** at
  both widths, no inner scroller. Visible glyph gaps remain **52px** for writing
  and **51.09px** for Habit/Protocol. Short Note stays at rest; long Note grows
  within its existing bound and scrolls only its body.
- Targeted ESLint passed for both new account modules, auth boundary, shell
  and auth browser test. Final
  `node node_modules/next/dist/bin/next build` passed including TypeScript after
  the wrap fix. Final `git diff --check` passed with existing LF/CRLF notices;
  29 current-section local links/fragments passed.

### Attempts and limits

The first test-harness build found a missing parenthesis in new test wiring;
the harness root was rewritten as JSX. Initial inspection then exposed a
40-character alias clipped by the heading's existing sizing. Added local
greeting wrapping/min-width rules and reran affected browser/geometry checks
plus lint/build. No App Box type scale, spacing token or default size changed.
No measured performance issue justified further optimization.

The static harness emits unresolved-at-build asset-path and large-chunk notices;
these are test-build notices, not a new product build failure. Optional tests
requiring `CIRCLE_AUTH_PRODUCTION_ORIGIN` were skipped; the Next build is separate
evidence. Actual hosted alias edits, physical phones, Opera and desktop layouts
remain unverified. Existing Week date-test/ResizeObserver and broader beta
gaps are not closed. Saving/queue/error behavior, account boundaries, 06:00 day,
sync activation and hosted data are unchanged by this UI slice.

## Direct entry after Day One (2026-11-06)

Developer approved removing automatic entry prompts after Day One, retaining
explicit setup/review controls, focused tests and related records. Branch
`paing-branch`, HEAD `ccdbe77`; existing tracked and untracked work is preserved.
No staging, commit, migration, personal-data change or deployment by this slice.

### Behavior and setup

The automatic door offers only unfinished Day One. Any completed version is
enough for direct entry; a newer version remains selectable manually. Week/Log
setup, weekly review and daily greeting no longer interrupt entry. Explicit
setup/review Quest pins use existing domain players/handlers so manual Week
completion still creates its goal, step and phase. Other Quest chapters keep
their existing player. Saved chapters, answers and access gates are retained.

Mobile checks use the actual shell, providers, players, CSS and IndexedDB in
the existing Vite harness, isolated synthetic account scopes, Chromium at
360x844 and 390x844, Bangkok time and blocked external requests. This is not a
hosted Supabase login, Opera or physical-phone certification. Fixed browser
times cover Friday 2026-11-06 at noon, Sunday 2026-11-08 at 21:00 and Monday
2026-11-09 at noon. Reload and simulated scope logout/re-entry preserve the
saved chapter snapshot and show no splash. Both widths cover older Day One
completion, chosen Week setup, unfinished Day One and the manual Sunday review
button. At 360px, Week setup is fully answered through Quest entry; its goal,
task and Protocol phase survive reload without another entry sheet. Opening a
review alone creates no completed weekly review. Inspected the 360px quiet
entry capture under `outputs/quiet-entry-360.png`.

### Checks and limits

`node --test --test-reporter=spec tests/day-door.test.mjs tests/week-review.test.mjs tests/day-one-simplification.test.mjs tests/phases.test.mjs tests/chapter-splash.test.mjs tests/account-scope.test.mjs`
passed **46/46**. Targeted ESLint passed for `circle-os-shell.tsx`, `day-door.js`,
`day-door.test.mjs`, `week-setup.test.mjs`, `writing.browser.mjs` and
`day-one.browser.mjs`. Final `node node_modules/next/dist/bin/next build` passed
including TypeScript after the manual-route change.
Final `git diff --check` passed with existing LF/CRLF notices; the current-section
document audit checked 29 local links/fragments successfully.

Browser command:
`node --test --test-reporter=spec --test-name-pattern="^Entry" tests/writing.browser.mjs`.
Final result: **8/8 passed**, including clean teardown and process exit 0.
An initial startup attempt exceeded the first test's deadline and was
interrupted; the next run passed seven cases and failed the old generic-player
selector after the chosen setup route was changed. The selector was corrected
and the final run also added full Week completion and account-scope return.

Baseline selection passed 25/29 before edits. Three stale source assertions
were updated for affected entry behavior. The unrelated Week setup model test
still fails with actual `2027-05` versus expected `2027-03`;
`node --test --test-reporter=spec tests/week-setup.test.mjs` passes 2/3. The
existing ResizeObserver notification loop was observed during manual Sunday
review and remains unresolved; the harness counts these separately from page
errors. No new runtime page errors or external backend requests were observed.
The adapted production-server `day-one.browser.mjs` suite was not run in this
slice; the actual-component tests above provide this slice's browser evidence.

The original midweek prompt's exact trigger was not reproduced. Removal is an
approved product change, not proof of a repaired calendar bug. No geometry,
type or gap code changed; no geometry measurement or performance optimization
is claimed. Hosted/device checks, Habit/setup sync, writing activation,
conflict/status UI, backup/retention and wider beta gates remain separate work.

## Hosted account writing checks (2026-11-06)

### Authorization and setup

Developer approved the previously reviewed migration, followed by the concrete
development-only harness, hosted synthetic records/deletion checks and records
updates. Project `gcqmblrkpfvjnewzdycj` / CircleOS Server / production / Singapore,
PostgreSQL 17.11.0.011. Branch `paing-branch`, HEAD `ccdbe77`; all prior work
preserved. SQL Editor execution reported Success. No rows returned. The saved
migration matched the repo after CRLF normalization/trim, SHA-256
`28f44e9c4ee054d3ac097748ebfbb3a39bf9e0f1650413626b0dea23d428cec4`.
The dashboard migration history was empty before application; SQL Editor does
not register the file as a CLI migration. Do not rerun CREATE statements blindly.

Before application: no `circle_private`, only public `circle_quotes` with four
columns and its anon/authenticated reading policy, and `rls_auto_enable` in
public functions. Data API enabled, exposed schemas `public`/`graphql_public`,
automatic new-table exposure off. No exposure settings changed.

After application, eight catalog checks returned true: three private tables
with RLS; three authenticated owner SELECT policies; authenticated SELECT-only
table grants; no anon/service-role table privileges; three authenticated-only
definer RPCs with empty search paths; seven helpers without client EXECUTE;
three cascading Auth references; initially empty writing tables.

### Hosted execution and results

`http://localhost:3000/os/sync-check` uses the existing Supabase context,
captured-token transport and sync coordinator. It requires local development,
the exact target and sync off. It keeps synthetic bundles in memory and never
opens the person's writing ledger. Two confirmed disposable sessions: normal
Opera and private Opera. The normal run and final recheck were observed by
Codex; private-window controls did not target reliably, so the developer copied
the witness, ran account B and reported the PASS/STOP lines. No passwords or
tokens were read into chat, logs, fixtures or evidence.

Both accounts passed:

- Anonymous and invalid-JWT calls denied for inventory, receipts and apply.
- Own save/inventory, identical retry receipts and exact receipt recovery.
- Changed request content rejected under an already accepted operation ID.
- Simulated accepted-response loss followed by a newer local edit: receipt
  recovery precedes the newer upload; three saved versions and no pending work.
- Two in-memory devices' saved edits: server conflict response, both copies
  retained by the coordinator, one conflict and one paused pending operation.
- Trash, restore, Trash and terminal deletion; stale upload returns deleted;
  the other simulated device removes its saved text and pending stale edit.

Account B additionally verified that A's exact operation IDs returned no receipts
and its head was absent, then independently used the same entry ID. A's final
recheck verified its original server version, tombstone and all receipts remained
unchanged. Synthetic entry ID: `hosted_ac60da4b88b247cd9f339d87`.

Both pages stopped at the separate local-server service-role probe. A localhost
diagnostic returned 502 with `networkError: true`; it did not reach a valid
permission result. The route's catch covers fetch and response parsing, so the
exact connection/response failure cause is not independently established.
The developer approved a direct server-side probe using
the existing `.env.local` key only in memory. Node `process.loadEnvFile`, exact
project assertion and POST requests with `{after_id:"",page_size:1}`,
`{operation_ids:[]}` and `{request:{}}` returned, respectively:

```text
inventory: HTTP 403, code 42501
receipts:  HTTP 403, code 42501
apply:     HTTP 403, code 42501
```

The probe asserts HTTP 401/403 plus exact `42501`, so a network failure or invalid
key response cannot count as success. Secrets/error prose were not printed.
This direct result is separate from the page's STOP, which remains a local
server probe limitation. A read-only SQL query restricted to the exact
synthetic entry returned three true checks: two owner-isolated terminal heads
at server version 8, two conflict candidates set to SQL NULL and 16 exact
receipts across both owners. No active synthetic writing remains. Minimal
tombstones, receipts, scrubbed conflict metadata and test accounts remain.

### Local verification, attempts and limits

Using installed Node `C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`:

```powershell
node --test tests/writing-hosted-harness.test.mjs tests/writing-transport.test.mjs
node node_modules/eslint/bin/eslint.js app/os/sync-check tests/writing-hosted-harness.test.mjs
```

Final 11/11 tests passed: three harness/probe checks plus eight transport checks.
Harness tests execute actual PGlite SQL and the real coordinator, verify both
owners, scrubbed conflicts, retained receipts and reject malformed witnesses.
Probe checks reject production/cross-origin requests and distinguish real
permission denial from invalid credentials and network failure. Targeted lint
passed after the diagnostic change. The first harness run had an incorrect
expected result-line count (13 versus 11); fixed and rerun successfully.

Ordinary `tsc --noEmit --incremental false` failed in existing generated
`.next/dev/types/routes.d.ts` and `validator.ts` syntax. Source checking with
the broad config also hit existing `db/index.ts` / `cloudflare:workers` typing.
Final source type check passed using TypeScript's `readConfigFile` and
`parseJsonConfigFileContent` for `tsconfig.vercel.json`, filtering `.next/`
generated paths, then `createProgram(..., {incremental:false})` and
`getPreEmitDiagnostics`. This covers app source, not generated route validation
or a new production build. No full build was run against the active dev server.

No environment flag was set, no deployment/import/staging/commit occurred, and
no product Page/geometry tokens changed. Local-first evidence, account scopes,
immutable saved versions and terminal deletion remain. No measured problem
justified optimization. Expired/revoked *valid* JWTs, unconfirmed hosted users,
true multi-connection lock contention, physical-device/IndexedDB recovery with
the hosted service, private schema direct SQL access under real user sessions,
admin/logs, backup restore/30-day deletion and broader beta readiness remain
unverified. Invalid JWT denial is not revocation proof. Conflict/status UI is
still absent. Writing sync remains off and activation requires separate review.

## Account writing storage and transport (2026-11-05)

Developer approved the concrete repository SQL/access/transport, initial
inventory, conflict/deletion safety, tests and owning records. Branch
`paing-branch`, HEAD `ccdbe77`; all existing changes preserved. No staging,
commit, hosted SQL/configuration change, personal migration or deployment.
[The contract and activation guide](ACCOUNT_WRITING_SYNC.md) describes tables,
RPCs, lifecycle rules, bounds and remaining release gates.

### Setup and verification

PGlite `0.5.15` is a pinned development-only dependency. The actual migration
runs in embedded PostgreSQL with synthetic `auth.users`, `anon`, `authenticated`
and `service_role` roles and request-claim settings. No hosted credentials or
real evidence are used. PostgreSQL's grants, RLS, functions and transactions
execute; this is not a source-string or mocked SQL check. Concurrent client
requests are serialized by PGlite's connection, so this does not certify
multi-connection advisory-lock contention or hosted JWT validation.

Focused command:

```powershell
node --test tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-model.test.mjs tests/writing-sync.test.mjs tests/writing-compatibility.test.mjs
```

**89/89 passed:** 14 database/coordinator cases, eight transport cases and 67
existing local-model/queue/compatibility cases. Covers own reads/writes;
cross-account isolation for heads/receipts/conflicts; denied anonymous,
missing-identity, unconfirmed-account and service-role RPC calls; denied direct
mutations; exact retry and changed-ID rejection; atomic failed requests;
immutable source/version checks; null/extra-field rejection; inventory paging;
lost responses; competing edits; clearing/Trash/restore; terminal deletion and
conflict-body scrubbing; all four kinds with Burmese/English/emoji and retained
day/timezone; pre-queue saved/deleted inventory. Transport checks pin the token,
verify its confirmed owner, reject mismatched stored identity, failed verification
and late account callbacks, and avoid displaying backend error bodies.

Browser command:

```powershell
node --test tests/writing-cloud.browser.mjs tests/writing-storage.browser.mjs tests/writing-provider.browser.mjs
```

**43/43 passed:** eight new cloud cases, 19 existing store cases and 16 provider
cases. The new harness uses real IndexedDB and HTTP against the actual SQL with
synthetic Auth/RPC handling, isolated Chromium contexts at 390x844 and blocked
external requests. Existing store/provider checks also use 360x844 and actual
same-account tabs. New coverage includes real offline save/reload; restoration
in a separate browser-storage context; clear/Trash/restore/delete propagation;
failed acknowledgement transaction and receipt recovery; old-account request
abort; newer typing during an upload; preserved conflicts and deletion scrubbing;
absent session denial; and the enabled React runner automatically uploading a
save. Two browser contexts are synthetic device equivalents, not physical phones.
The runner's final affected case was rerun after removing unused internal status
bookkeeping. No new user-facing status/conflict UI was added.

Targeted ESLint covered the new source/test files plus changed auth boundary,
writing provider/store and storage browser test. The Next production command
`node node_modules/next/dist/bin/next build` passed including TypeScript.
Final whitespace and local-document link checks are recorded at handoff.
`git diff --check` passed with existing LF/CRLF notices. A read-only link audit
checked 61 local links/fragments in the new guide and current updated sections;
all passed. The final targeted lint, production build and affected runner case
passed after source cleanup.

### Attempts and limits

An initial database test exposed receipt recovery marking a newer local edit as
a conflict after a lost upload response. The coordinator now recognizes the
server head named by its recovered receipt; the final test passes. Local deletion
also clears an existing remote conflict in its transaction and bypasses the
conflict upload pause so the terminal marker can reach the server.

The account-switch browser test initially expected only a scope error; actual
fetch cancellation correctly raised AbortError. The test now accepts either
and waits for the intercepted callback to settle. The runner test initially
used an asynchronous page predicate that returned before IndexedDB acceptance;
explicit Node-side polling now waits for the durable acknowledgement. The
existing transaction-completion test assumed one put; the queue already writes
more than one record. It now verifies all request successes precede the single
transaction commit and promise resolution, without assuming a write count.

Standalone `tsc` initially found malformed generated `.next/dev/types` files.
No tracked source was changed to hide this; subsequent Next production builds
and their type checks passed. The npm shim was blocked by NVM, so the installed
direct npm CLI was used. Its sandbox download failed with EACCES; the approved
dependency download succeeded through escalation. No trust settings were changed.

The runner stays off by default. Actual Supabase roles/default privileges,
JWT validation, real token refresh/revocation, target-region networking, hosted
RPC and device/Home Screen recovery remain unverified. The migration has not
been applied remotely. Conflict/status UI, protected admin access/logs, complete
account deletion, backup restore/30-day deleted-backup limits, other lifestyle
domains and personal migration remain open. Prior unrelated Week/ResizeObserver
and beta-readiness gaps remain. Full lint/broad suite and Vinext build were not
run; the targeted checks above are the evidence for this slice.

No visual tokens or geometry changed, so no geometry measurements are claimed.
Local-first evidence, draft exclusion, retained assigned days/06:00 attribution,
immutable saved versions and received readings/chapters remain. No measured
performance issue justified optimization; full-inventory polling and per-entry
upload limits remain explicit implementation bounds.

## Durable local writing sync queue (2026-11-05)

Developer approved the durable local writing queue, acknowledgement guards,
focused tests and owning records. Branch `paing-branch`, HEAD `ccdbe77`; 32
tracked changes and 11 untracked paths at startup preserved. No owner writing,
remote database, credentials, migration or deployment used. Baseline writing,
compatibility and account-scope tests passed 66/66 before edits.

### Delivered and verified boundary

The existing writing store now writes its ledger and a separate `sync-v1` key
in one account-scoped IndexedDB transaction. Only new accepted saved/lifecycle
changes queue. Drafts, no-op saves, local conflicts, redundant lifecycle actions
and retries of prior receipts do not. Entries contain IDs/hashes, saved-version
references, generations, lifecycle kind, local sequence and predecessor, never
copied body/draft text. Clearing preserves the saved empty version. Trash,
restore and permanent deletion remain distinct. No automatic prior-record
backfill or legacy upload occurs.

Exact synthetic acknowledgements validate owner/operation/hash/entry/generation,
receipt identity and server version ordering. Only named operations retire, in
the same transaction as their acknowledgement. Replays must match. Invalid
batches do not partially retire records. A newer saved change/draft remains
untouched by an older receipt. Corrupt queues fail closed. Scope changes abort
in-flight work; callbacks check their original scope before continuing.

### Final checks

- `node --test --test-reporter=dot tests/writing-sync.test.mjs tests/writing-model.test.mjs tests/writing-compatibility.test.mjs tests/account-scope.test.mjs`:
  **75/75 passed**, `outputs/writing-sync-model.log`. Nine new cases cover
  queue selection/no-ops, stable retries, all writing kinds, clearing/lifecycle
  markers, deletion without retained bodies, preserved newer saves/drafts,
  partial/out-of-order/replayed acknowledgements, rejected mismatches/reused
  receipt IDs, corrupt data and unsupported owners.
- `node --test --test-reporter=tap --test-name-pattern="durable writing sync|new typing during delayed autosave|normal-motion Deep Thoughts waits|History bins move only|New Note flushes" tests/writing.browser.mjs`:
  **9/9 passed**, `outputs/writing-sync-final-browser.log`. Five new queue cases
  plus four affected existing journeys. Isolated Chromium at 360x667/390x844,
  Bangkok timezone, reduced/normal motion, actual IndexedDB and blocked external
  traffic. Offline saves survive restored-connectivity reload; offline history
  opens the latest saved text. Synthetic older acknowledgements leave newer
  operations pending and writing untouched. Injected record/queue/ack write
  failures abort atomically, retain the recoverable draft/pending operation and
  allow stable retry. In-flight account switching/logout and captured old-scope
  receipts are rejected. Concurrent same-account tabs retain all changes.
- `node --test --test-reporter=tap --test-name-pattern="Deep Thought save failures|failed local commit|a recovered History row|another tab.s correction|real Reflect reading reply|account change closes autosave" tests/writing.browser.mjs`:
  **6/6 passed**, `outputs/writing-sync-regression-browser.log`. Additional
  existing failure/retry, stale-editor review, reading-answer source and
  account-switch recovery journeys. This selection is disjoint from the nine
  above, giving **15 browser cases**. Harness assertions found no uncaught page
  errors or backend/AI requests in final runs.
- `node node_modules/next/dist/bin/next build`: passed including types/static
  generation; `outputs/writing-sync-final-build.log`.
- After strengthening the transaction test to abort after both put requests
  succeeded, `node --test --test-reporter=tap --test-name-pattern="durable writing sync transaction failures" tests/writing.browser.mjs`
  passed **1/1**, `outputs/writing-sync-transaction-abort.log`. The saved change
  and queue both roll back; request success never reports a committed save.
  This repeats one of the fifteen cases, rather than adding another case.
- `node node_modules/eslint/bin/eslint.js app/os/writing-sync-model.js app/os/writing-store.ts tests/writing-sync.test.mjs tests/writing.browser.mjs`:
  passed without warnings, `outputs/writing-sync-lint.log`.

### Attempts and remaining work

Initial mobile tests used an incorrect history selector and clicked before the
normal-motion flip settled; corrected to open the actual row after settling.
Initial failure injection also interrupted the draft commit instead of the
saved change. Existing quota tests assumed every value in the writing store
was a ledger; they now target only ledger-shaped values. The account-switch
case exposed an uncaught second abort after the scope had already aborted the
transaction; callbacks now return when the captured scope is no longer current.
Two unused-variable lint warnings were removed. Final checks above ran after
the source fixes. No measured performance issue justified optimization.

No UI/CSS/geometry token changed; no new geometry measurements are claimed.
The browser acknowledges local synthetic receipts only: no remote authentication,
Supabase transport/RLS, actual server version arbitration, two-device conflicts,
initial inventory, prior-writing import or backup/recovery is certified. Drafts
remain local; a future transport must honor deletion tombstones rather than
recovering removed content from an old pending reference. Technical queue
receipts do not expire automatically. Server/deletion/backup retention and stale
device suppression require reviewed implementation. Hosted/physical-device,
other-browser, Vinext and broad-suite gaps remain, along with earlier unrelated
warnings. Next: bounded server ownership/access and transport proposal.

## Protocol prospective wording (2026-11-05)

Developer approved next-Circle-day term changes, dated history, tests and owning
records. Branch `paing-branch`, HEAD `ccdbe77`; pre-existing 31 tracked changes
and ten untracked paths preserved. No owner data or remote services used. The
previously recorded defect was phase summaries reading current item text for
earlier days. Independent immutable snapshots now resolve each day's agreement.
Edits/additions/clearing start next local Circle day at 06:00; the front retains
today's terms and the editor shows pending words. History separates intervals
and counts; each day's outcome uses its required terms or saved seal. An early
ending before 06:00 stays on the finished Circle day. Unticked optional terms
remain visible. Legacy baselines are observed without backdating; available
seal/completion words are used and missing originals are explicitly unavailable.

Checks:

- `node --test --test-reporter=dot tests/protocol-wording.test.mjs tests/protocol-home.test.mjs tests/circle-os-model.test.mjs tests/account-scope.test.mjs`:
  **96/96 passed**, `outputs/protocol-wording-model.log`. Nine new cases cover
  repeated edits, additions/removals, interval counts, immutable existing
  evidence, legacy words/optional terms, closed-phase guards, 06:00/early ending,
  normalization and both stale-merge directions.
- `node --test --test-reporter=tap --test-name-pattern="Protocol wording|Protocol finished|Protocol past phases|shared App Box geometry" tests/writing.browser.mjs`:
  **8/8 passed**, `outputs/protocol-wording-verified-browser.log`. Actual
  components in isolated Chromium, synthetic account/storage, Bangkok timezone,
  360x667/390x844, reduced/normal motion, blocked external traffic. Actual edits
  retain today's tick, save offline, reload pending words and show dated
  read-only history; existing finished/bounded-history cases also pass. Harness
  assertions found no uncaught page errors or backend/AI requests.
- `node node_modules/next/dist/bin/next build`: passed including types/static
  generation; `outputs/protocol-wording-verified-build.log`.
- Targeted ESLint on `circle-os-model.js`, `protocol-page.tsx`,
  `protocol-wording.test.mjs`, `circle-os-model.test.mjs` and
  `writing.browser.mjs`: passed; `outputs/protocol-wording-lint.log`.
- Resting Note/Thoughts/Habit/Protocol frames **346px**, Pages **344px**, header
  gaps **48px**. History ceilings **400.19px**/**480px**, one Body scroller,
  **44x44px** Remove targets, **10.39px** row/removal gaps, no horizontal overflow.
  Inspected `outputs/protocol-wording-360.png` and
  `outputs/protocol-wording-390.png`. No CSS/shared geometry tokens changed.

Initial checks needed the new empty-map migration assertion, a wait for the
animated tick's deferred commit before Edit, and a count selector excluding
date labels. Corrected tests pass. Early-end Circle-day, snapshot-order and
legacy sealed-day baseline refinements were tested again in the final runs.
An intermediate four-case
selection overlaps the final eight; it is not extra coverage. Screenshots also
scroll to the later wording when needed. Product code stayed fixed during the
final selection.

No measured issue justified optimization. Independent snapshot merging retains
history against stale runs; it does not solve concurrent editable-run conflicts
or certify real sync/acknowledgements. Physical-device/hosted use, other browsers,
real sync/recovery, Vinext and broad checks remain unverified. Existing
ResizeObserver/Week/beta gaps remain open. Historical phase names/goals and
past-day corrections remain separate. Next: developer phone use across a real
Circle-day boundary.

## Contextual chapter review cleanup (2026-11-05)

The developer approved removing the standalone Chapter History control and
visible version labels. Finished steps and completed Quests' View history keep
the shared reader. Removed only that header markup, its two scoped CSS rules
and version text in the reader/list. Original run/version references, exact
definition lookup, stored questions/answers and setup/replay guards remain.
Branch `paing-branch`, HEAD `ccdbe77`; all existing work is preserved, with no
new source paths, staging, commit, deployment, import or remote changes.

- `node --test tests/chapter-history.test.mjs tests/quests.test.mjs`:
  **12/12 passed**, exit 0. Existing immutable/version-specific read and setup
  evidence cases are preserved. Log: `outputs/quest-history-cleanup-model.log`.
- `node --test --test-reporter=tap --test-name-pattern="Chapter history|Completed Quests|shared App Box geometry" tests/writing.browser.mjs`:
  final **6/6 passed**, exit 0. Actual components/stores/CSS, isolated synthetic
  accounts, external requests blocked, Bangkok timezone. At 360x667/390x844 with
  reduced/normal motion: standalone control absent; contextual lists/detail
  contain no version labels; saved paragraphs/publication instants, original
  missing-question fallback, false/zero handling, unchanged domain records/
  evidence/outbox/writing ledger, Back to the same non-first Quest, reload,
  offline reading, account isolation, long-record resize, finished Quest review
  and genuine unfinished launch passed. Fixtures keep repeated/internal versions
  while entering only through the now-retained View history action.
  Log: `outputs/quest-history-cleanup-browser-final.log`.
- Resting Note, Deep Thoughts, Habit and Protocol still measure **346px** with
  **48px** header gaps at both widths. The reader keeps the 48px anchor, no
  horizontal overflow and downward growth without inner scrolling. Inspected
  `outputs/chapter-history-390.png` after version-label removal.
- `node node_modules/eslint/bin/eslint.js app/os/mirror/page.tsx app/os/chapter-history-page.tsx tests/writing.browser.mjs`:
  clean, exit 0. Log: `outputs/quest-history-cleanup-lint-final.log`.
- `node node_modules/next/dist/bin/next build`: passed including TypeScript and
  static generation. Log: `outputs/quest-history-cleanup-build.log`.

The first selection passed five of six. The normal-motion case tried to select
a step before the deferred View history button/flip had settled. The fixture
now waits for the list to appear, then for shared settling; the final selection
passed without another runtime change. Existing ResizeObserver notifications
remain visible. No shared tokens, engine, model/write/merge path, publication
content, IDs, budgets or 06:00 attribution changed. No measured performance issue
justified optimization. Physical-phone/hosted use, real sync/recovery, other
browsers, Vinext and broad checks remain unverified; prior independent warnings
remain. Next: developer phone review of the cleaner Quest header and saved-answer
reader. A broader all-chapter archive is deferred.

## Chapter History and Quest setup review (2026-11-05)

The developer approved read-only Chapter History, then separately approved the
reported Quest fixes: reusable View/Hide, existing setup status, finished-step
answer reading, complete-Quest View history and affected setup/pinning guards.
They confirmed the preceding Athena Reading History on their phone. Branch
`paing-branch`, starting HEAD `ccdbe77`; all 27 changed tracked and seven
untracked paths present at implementation start are preserved. Three new
source/test files are added. Nothing staged, committed, deployed, imported or
changed remotely; no personal records were used as fixtures.

Global Chapter History reads completed answer-bearing runs, preserving repeated
runs/versions. Stored question/display snapshots win; only exact original
definitions may fill missing prompts, and conflicting/missing definitions never
borrow newer text. Quest-specific History also represents completed setup with
no saved answers, without manufacturing a chapter record/date/version. Shared
App-back preserves catalogue position and locks outer travel while reading.

Unfinished Quests keep View/Hide through the existing reusable button setting.
Complete Quests offer View history; completed steps open readers. The shared
status check reads named active Habits, both Log routine answers, corresponding
nonempty declarations and audience-allowed completed replacement first-use
publications at their original version. An unlocked App, draft Habit, partial
Log answers or unrelated record does not complete a step. Habit/Log surfaces
share this status and suppress duplicate setup; stale Quest pins are cleared.
Ordinary reflections/Week setup/reviews still need their own completed runs;
existing access gates and named Workshop/weekly doors remain.

Checks:

- `node --test tests/chapter-history.test.mjs tests/quests.test.mjs tests/first-use-setup.test.mjs tests/chapter-engine.test.mjs tests/habit-identity.test.mjs`:
  **51/51 passed**, exit 0. New cases cover exact/missing/conflicting definitions,
  snapshots, repeated runs, clone-isolated reads, false/zero/array/blank values,
  unknown dates, actual setup evidence, insufficient/unrelated evidence,
  first-use App/version/audience proof and actual completed-run links.
  Log: `outputs/chapter-quest-model-verified.log`.
- `node --test --test-reporter=tap --test-name-pattern="Quest setup status|Completed Quests|Chapter history" tests/writing.browser.mjs`:
  final **6/6 passed**, exit 0. Actual product components/stores/CSS in isolated
  synthetic accounts, Bangkok timezone, external requests blocked, at
  360x667/390x844 with reduced/normal motion. Three consecutive View/Hide cycles,
  Habit/Log Already set up without fabricated answers, finished Quest History,
  genuine unfinished launch, stale Habit/Log pin rejection, exact saved answers,
  versioned/repeated runs, missing originals, unchanged domain records/evidence/
  outbox/writing ledger, return to a non-first Quest/reload, account isolation,
  actual offline reading and long 26-answer detail/resize passed.
  Log: `outputs/chapter-quest-browser-delivery.log`.
- Screenshot review then aligned only the new header control with the existing
  topic/counter. After this scoped CSS fix,
  `node --test --test-reporter=tap --test-name-pattern="Quest setup status|shared App Box geometry" tests/writing.browser.mjs`:
  **4/4 passed**, exit 0. Rechecks the new control and all three toggle cycles,
  setup/status readers and stale pins at both widths. Four resting Note, Deep
  Thoughts, Habit and Protocol frames remain **346px** with **48px** header gaps.
  Chapter History detail also retains the 48px anchor. Long detail grows past
  480px without inner scrolling or horizontal overflow. Log:
  `outputs/chapter-quest-header-final.log`. The selections overlap; do not add
  their counts as unique coverage.
- `node node_modules/eslint/bin/eslint.js app/os/quests.js app/os/quests.d.ts app/os/chapter-history.js app/os/chapter-history-page.tsx app/os/mirror/page.tsx app/os/circle-os-shell.tsx tests/chapter-history.test.mjs tests/quests.test.mjs tests/writing.browser.mjs`:
  final direct invocation clean, exit 0. The earlier state-in-effect error was
  fixed by removing an unnecessary state update; the effect now synchronizes
  only the stale pin in storage.
- `node node_modules/next/dist/bin/next build`: final production rebuild after
  header alignment passed, exit 0, including TypeScript and static generation.
  Log: `outputs/chapter-quest-build-delivery.log`. The preceding JS/types build
  also passed in `outputs/chapter-quest-build-verified.log`.
  Builds use the installed Next CLI because the previous npm-launcher trust
  problem remains; no trust settings changed.
- Inspected `outputs/chapter-history-390.png`, `outputs/chapter-history-360.png`,
  `outputs/quest-setup-390.png` and `outputs/completed-quest-history-390.png`.

Attempts: old source-string assertions needed matching updates for dynamic
classes and the new action branch; behavioral assertions were retained/added.
The first new Quest browser selection used Log in a selector although that
chapter's displayed title does not contain Log; corrected to its manifest step.
An earlier ten-case regression selection passed before the final pin/publication
cleanup. A later affected run passed five of six, timing out on full-load reload
under concurrent build load; DOMContentLoaded plus the existing ready signal
passed the complete final six-case run. No application change was made for that
timeout. Existing ResizeObserver notifications remain visible. A redirected lint
attempt returned failure without diagnostics; the direct final command passed.
No measured performance issue justified further optimization.

No published chapter/reading words, IDs/versions, budgets, 06:00 attribution,
App access gates, personal evidence, sync/merge protocol or shared geometry/
type/gap tokens changed. Navigation positions may persist through their existing
engine; clearing a stale Quest pin is intentional navigation cleanup, not a
personal-record write. Physical-phone/hosted use, real sync/recovery, offline
network reload, Vinext and broad tests/lint remain unverified. Previous Week
source-test failures and other independent gaps remain. Next: developer phone
review of Chapter History, repeated View/Hide and completed/setup Quest steps.

## Read-only Athena Reading History (2026-11-05)

Approved source/UI/tests and owning-record slice after read-only audit. The
developer confirmed the preceding Week History on their phone; that is lived
acceptance, not new hosted/cloud certification. Branch `paing-branch`, starting
HEAD `ccdbe77`; all 24 changed tracked and six untracked paths at implementation
start are preserved. One new component is added; existing Mirror/CSS, model and
browser tests and the approved design/architecture/decision/continuity records
are updated. Nothing staged, committed, deployed, imported or changed remotely.

The Athena cover label opens dated saved editions, then their saved cover and
three prose parts. Missing parts say No saved words for this part; unknown dates
say Date not recorded. Shared App-back returns through History to current cover,
and outer travel stays locked to that slot while open. The current four Pages,
reply flow, authored-edition semantics and 60-edition bound remain unchanged.

Verification:

- `node --test tests/athena-memory.test.mjs tests/athena-alignment.test.mjs`:
  **39/39 passed**, exit 0. Added a pure-read case proving old sections/unknown
  dates stay separate from live derived content, and read-model mutation cannot
  alter input memory. Existing immutable/union/bounded-edition checks passed.
  Log: `outputs/athena-history-model.log`.
- `node --test --test-reporter=tap --test-name-pattern="Athena history|real Reflect reading reply|shared App Box geometry" tests/writing.browser.mjs`:
  final **7/7 passed**, exit 0. Isolated actual components/stores/CSS, synthetic
  accounts, external requests blocked, Bangkok timezone. At 360x667/390x844 with
  reduced/normal motion: dated and undated editions, exact old paragraphs,
  absent sections without current prose/derived fallback, keyboard/touch, 44px
  targets, unchanged memory/profile/chapters/evidence/outbox/writing ledger,
  return to current cover, reload, actual offline reading after load, account
  switching, empty archive, all 60 retained rows and long 28-paragraph detail
  through resize. The existing reading-answer Send/source case also passed.
  Log: `outputs/athena-history-browser-final.log`.
- Four resting frames (Note, Deep Thoughts, Habit, Protocol) remain **346px**
  with **48px** header gaps at both widths. History retains the 48px anchor,
  no horizontal overflow and natural downward growth without inner scrolling.
  Long detail measured 2509.67px at both widths. Inspected
  `outputs/athena-history-360.png` and `outputs/athena-history-390.png`.
- `node node_modules/eslint/bin/eslint.js app/os/athena-history-page.tsx app/os/mirror/page.tsx tests/athena-memory.test.mjs tests/writing.browser.mjs`:
  clean, exit 0. Log: `outputs/athena-history-lint-final.log`.
- `node node_modules/next/dist/bin/next build`: passed including types and static
  generation. Log: `outputs/athena-history-build.log`. Used the installed Next
  CLI because the prior slice established an NVM trust block on the npm launcher;
  no trust settings were changed.

Attempts: initial seven-case browser selection passed five; two new cases
sampled a 44px cover target during entrance motion. Waiting for shared frame
settling and tolerating subpixel rounding fixed the test; no runtime fix was
needed. Both affected cases then passed and the final seven-case selection
passed after adding 60-row coverage. Existing ResizeObserver notifications
remain visible. No measured performance issue justified optimization.

No shared geometry/type/gap tokens, publication budgets, chapter/reading words,
06:00 rule, persistence/merge protocol or account scope changed. This is access
to existing local editions, not live generation, full server archive paging,
safe sync or backup. Physical-phone/hosted use, offline network reload, real
sync/recovery, Vinext and broad tests/lint remain unverified. The prior two Week
source-test failures and other independent gaps remain. Next: developer phone
review of Athena Reading History.

## Read-only Week History (2026-11-05)

The developer approved the concrete read-only Week History slice after a source
audit, and confirmed the preceding past Log editor/caret behavior on their
phone. That confirmation is developer-reported acceptance, not a new automated
device check. Branch `paing-branch`, starting HEAD `ccdbe77`; 24 changed tracked
paths and three untracked paths present at implementation start are preserved.
Nothing staged, committed, deployed, imported or changed remotely.

New `week-history.js` and `week-history-page.tsx` read existing weekly goals,
linked tasks and saved reviews. Week's label opens the list, then a detail;
shared App-back returns to History then current Week. Blank/current/future or
invalid weeks stay out; goals-only/review-only weeks remain. Archived and
missing task links are retained honestly. Goal/task words are current saved
values, not reconstructed historical snapshots. Actual review recording time
is formatted locally while its exact instant remains in the time element.

Final checks:

- `node --test tests/week-history.test.mjs tests/week-review.test.mjs tests/goal-model.test.mjs`:
  **22/22 passed**, exit 0. Covers selection, invalid/future/current weeks,
  incomplete/missing/archived links, pure reads, normalized JSON reload and
  existing goal/review behavior. Log: `outputs/week-history-model-final.log`.
- `node --test --test-name-pattern="Week history|shared App Box geometry|Log history grows" tests/writing.browser.mjs`:
  **7/7 passed**, exit 0. Actual product components/stores/CSS in the isolated
  Vite harness, synthetic accounts, blocked external effects, Bangkok timezone.
  At 360x667 and 390x844 (reduced/normal motion), checked saved goals/reviews,
  linked archived steps, keyboard/touch, 44px list targets, unchanged saved
  goals/tasks/weeks/chapters/Protocol/outbox/evidence, reload, return to current
  Week, account switch, actual offline reading after load, 26-week list,
  25 missing links, resize and long downward growth without an inner scroller.
  Includes existing Log-history-to-Week regression. Log:
  `outputs/week-history-browser-final.log`.
- Four resting frames (Note, Deep Thoughts, Habit, Protocol) remain **346px**
  with **48px** header gaps at both widths. History detail retains the 48px
  anchor and no horizontal overflow. Long detail grows beyond 480px with no
  inner scroll panel. Inspected `outputs/week-history-390.png` and
  `outputs/week-history-360.png`.
- `node node_modules/eslint/bin/eslint.js app/os/week-history.js app/os/week-history-page.tsx tests/week-history.test.mjs tests/writing.browser.mjs app/os/circle-os-shell.tsx`:
  clean, exit 0. Log: `outputs/week-history-lint-final.log`.
- `node node_modules/next/dist/bin/next build`: passed including TypeScript,
  static generation and route output. Log: `outputs/week-history-build-final.log`.

Attempts and limits: first 5/5 browser selection passed before recording-time
formatting and longer-history coverage; final seven cases verify the final code.
The first production build found a TypeScript narrowing problem in the missing
task fallback; explicit fallback selection fixed it before the final passing
build. `npm run build:vercel` could not start because NVM distrusts its delegated
npm entrypoint; the build used the installed Next CLI directly without changing
trust settings. Initial wider Week selection passed 39/41, including all new
selector cases; the two recorded `week-app.test.mjs` source assertions still
fail (CRLF-sensitive font-ready regex and editable-line CSS expectation).
No unrelated test/engine fixes were made. Existing ResizeObserver notifications
remain visible. No measured performance issue justified optimization.

No shared geometry/type/gap tokens, chapter/reading versions, attribution/06:00
rules, review write/merge semantics or persistence protocol changed. Physical
phone/hosted Week History, real sync/recovery, offline network reload, Vinext
and broad suite/lint remain unverified. Weekly correction/versioning, historical
goal/task wording, chapter answer review and shared day review remain separate.
Next: developer phone review of Week History.

## Past Log caret-only focus (2026-11-05)

The developer requested removal of the orange writing-field box while keeping
the cursor, then approved the scoped CSS, existing browser checks and records.
Added `outline: 0` only to past-Log correction textareas. Other focus indicators,
caret behavior, borders, sizing and saving retain their behavior. All existing
working-tree changes are preserved; nothing staged, committed or deployed.

- `node --test --test-name-pattern="Log corrections save" tests/writing.browser.mjs`:
  final **2/2 passed**, exit 0, at 360x667/390x844 with reduced/normal motion.
  Both writing fields stay focused, have no outline and keep a visible caret
  color. Actual Tab/Shift+Tab navigation retains Cancel's keyboard focus ring.
  The same journeys verify typing, Save/Cancel, reload, offline saving and
  unchanged/legacy no-ops. Log: `outputs/log-caret-browser-final.log`.
- `node node_modules/eslint/bin/eslint.js tests/writing.browser.mjs`: **clean**,
  exit 0. Log: `outputs/log-caret-lint-final.log`.
- Inspected the updated `outputs/log-correction-editor-390.png`.

The initial two cases failed only on the button focus assertion: programmatic
focus after pointer use did not activate `:focus-visible`. The check now uses
real keyboard navigation; no further runtime change was needed. No geometry,
font or gap changed, so no new geometry measurements are claimed. Model/build
checks were not repeated for this outline-only CSS follow-up. Existing
ResizeObserver and hosted/physical-device/sync gaps remain. Next: developer
confirmation of caret-only focus on the affected device.

## Past Log text corrections (2026-11-05)

The developer confirmed the preceding History on their device, then approved
the bounded text-correction proposal: domain/merge rules, shell types/wiring,
history editor, scoped styling, tests, Page standard, architecture, decisions
and evidence/continuity records. Branch `paing-branch`, HEAD `ccdbe77`; the
22 pre-existing changed tracked paths and three untracked paths remain
preserved/refined within scope. No staging, commit, deployment, import or
remote configuration/personal-record changes.

Tapping a saved past activity/moment opens one text editor. Save changes
accepts activity/moment words; Cancel returns without a write. Original date,
time range, entry ID, first-recorded time and unknown metadata remain fixed.
Legacy notes are converted only by an accepted change; unchanged multiline
legacy words keep their original representation. Actual correction time and
exact before/after snapshots accumulate in `days[dateKey].logCorrections`.
A saved clearing retains its dated empty block in the receipt, while active
timeBlocks excludes it. Normalization/merge suppress older matching blocks;
Week/Reflect readers therefore do not count cleared time. Stale editors cannot
overwrite a newer change. Time/date changes and new past entries are not added.

### Checks and results

- Baseline `node --test tests/log-history.test.mjs tests/circle-os-model.test.mjs`:
  **66/66 passed**. Log: `outputs/log-corrections-baseline.log`.
- Final `node --test tests/log-history.test.mjs tests/log-app-box.test.mjs tests/circle-os-model.test.mjs`:
  **78/78 passed**, exit 0. Log: `outputs/log-corrections-model-final.log`.
  Covers before/after immutability, unchanged dates/ranges/metadata, unknown
  legacy times, revisions/queue, stale/missing/current/future/invalid targets,
  non-increasing timestamps, no-op/replayed saves, accumulating receipts,
  clearing/normalization/stale merge in both directions, zero cleared-time
  totals, a genuinely newer edit, and unchanged multiline legacy content.
- Broader `node --test --test-name-pattern="Log corrections|Log history|shared App Box geometry" tests/writing.browser.mjs`:
  **10/10 passed** before the final legacy comparison fix. These include the
  four preceding History journeys plus four correction/two geometry cases.
  Log after the clearing fix: `outputs/log-corrections-browser-final.log`.
- Final affected `node --test --test-name-pattern="Log corrections|shared App Box geometry" tests/writing.browser.mjs`:
  **6/6 passed**, exit 0. Log: `outputs/log-corrections-browser-verified.log`.
  Existing actual-component Vite harness, isolated synthetic accounts, Bangkok
  timezone, Chromium at 360x667/390x844, reduced/normal motion, blocked external
  requests. Save/cancel/reload, unchanged saves and multiline legacy no-ops pass
  at both widths. A 360px save and clearing use actual offline browser mode;
  network reload occurs after reconnecting to the local harness. Stale changes
  show an alert and disable Save without overwriting; account switching closes
  the draft and preserves only the owner's saved entry. Clearing both original
  and legacy entries retains two receipts, zero active blocks, and stays empty
  through stale merge and reload. Counts overlap the broader run.
- Note, Deep Thoughts, Habit and Protocol frames still measure **346px**, Pages
  **344px**, header gaps **48px** at both widths. No shared geometry/type tokens
  changed. Inspected the mobile editor screenshot, saved as
  `outputs/log-correction-editor-360.png` / `outputs/log-correction-editor-390.png`.
- `node node_modules/eslint/bin/eslint.js app/os/log-history.js app/os/log-history-page.tsx app/os/circle-os-shell.tsx app/os/circle-os-model.js tests/log-history.test.mjs tests/writing.browser.mjs`:
  **clean**, exit 0. Log: `outputs/log-corrections-lint-verified.log`.
- `node node_modules/next/dist/bin/next build`: **passed**, exit 0, including
  TypeScript/static generation after all runtime fixes. Log:
  `outputs/log-corrections-next-verified.log`. Vinext/broad suite/lint not repeated.

### Attempts, invariants and limits

The initial 76 model/structure and ten browser cases passed. Review then found
that retaining cleared blocks in active timeBlocks would still count their
duration in existing summaries. The dated empty value now stays in the receipt;
normalization and merge prevent stale restoration into active blocks. Added
summary/newer-edit regression coverage passed with 77 checks and ten browser
cases. A targeted multiline-legacy no-op test then failed against the old
comparison (`outputs/log-corrections-legacy-baseline.log`). Shared visible-word
comparison now prevents an unnecessary correction or a pending editor; the
final 78 checks and affected six-case rerun pass. No source change followed.

No measured performance problem justified optimization. Immutable chapters and
authored readings, the 06:00 boundary, account epochs and original date/time
attribution remain intact. This is the existing local queue/timestamp merge,
not the planned Supabase durable-operation/conflict system. Physical-device
correction use, hosted/real sync acknowledgements, recovery and offline network
reload remain unverified. Previously recorded ResizeObserver notifications
still appear in the harness; existing checks report no external backend calls
or uncaught page errors. Other prior unrelated verification gaps remain.
Next: developer use/review of the past-entry editor.

## Read-only Log history (2026-11-05)

The developer approved the audited read-only slice, exact source/test/record
scope and correction of the stale Log scrolling sentence in the Page standard.
Branch `paing-branch`, starting HEAD `ccdbe77`; all 15 pre-existing changed
tracked paths preserved. No staging, commit, deployment, personal-data edits,
external records, database changes or sync implementation.

The Log label opens History through `useAppBack`, within the existing daily
SwipeSession slot. All past dates with saved titles, activities or moments
appear newest first. Empty/range-only generated days, today and future plans
are excluded. Day reading shows assigned dates and saved block times/content,
including legacy `activity`/`note`, in 06:00 order. Title-only days remain
readable. Today's routine never fills historical gaps. Back returns to History
then today; Week remains available from today. Both history surfaces grow
downward, reading the existing account records without writing another store.

### Checks and results

- Baseline `node --test tests/log-app-box.test.mjs`: **4/4 passed** before edits.
- Final `node --test tests/log-history.test.mjs tests/log-app-box.test.mjs`:
  **7/7 passed**: three behavioral model cases and four existing structure
  checks. Covers filtering, old dates, title-only content, legacy notes,
  moments-only entries, non-hour times, midnight ordering, nonmutation,
  assigned date labels and the local 06:00 boundary.
- Final `node --test --test-name-pattern="Log history|shared App Box geometry" tests/writing.browser.mjs`:
  **6/6 passed**, exit 0. Actual components/CSS/stores in the existing Vite
  harness; isolated synthetic accounts, Bangkok timezone, mobile Chromium,
  360x667/390x844, reduced/normal motion and blocked external traffic.
  Covers 20 dates reaching back to 2020, sorting, empty/title-only days,
  activities/legacy moments, no editing/Now controls or routine suggestions,
  no Week swipe from history, unchanged days/outbox/evidence revisions,
  back navigation, reload, Now return, account switching and offline reading
  after an online harness reload. A 24-block long day grows naturally, reaches
  its last moment, resizes across 360/390px without an inner scroller or
  horizontal overflow, accepts keyboard/touch, and returns to Week.
- History's settled header-to-heading gap is **48px** at both widths; list
  controls retain **44x44px** or larger targets. Note, Deep Thoughts, Habit and
  Protocol rest at **346px** frames, **344px** Pages and **48px** header gaps.
  Long Log content grows beyond 480px without an inner scroller.
- `node node_modules/eslint/bin/eslint.js app/os/log-history.js app/os/log-history-page.tsx app/os/circle-os-shell.tsx tests/log-history.test.mjs tests/log-app-box.test.mjs tests/writing.browser.mjs`:
  **clean**, exit 0. Final log: `outputs/log-history-lint-final.log`.
- `node node_modules/next/dist/bin/next build`: **passed**, exit 0, including
  TypeScript/static generation after the final runtime edits. Log:
  `outputs/log-history-next.log`. No Vinext build or broad suite/lint repeated.
- Inspected `outputs/log-history-day-390.png` after the header correction.
  Final browser log: `outputs/log-history-browser-final.log`.

### Attempts and limits

The initial five-case selection passed before final refinements. Screenshot
review found extra space from an in-flow 44px label; the scoped control now
uses the existing out-of-flow header pattern. The next selection passed 5/6:
the 360px measurement sampled a 29px gap during shared frame growth. The check
now waits across queued resize animations and polls the settled 48px gap.
The affected two-case rerun and final full six-case run passed without further
runtime changes. Counts overlap.

The harness still emits the previously recorded ResizeObserver notifications;
their cause is not diagnosed or fixed here. Its existing checks report no
external backend traffic or uncaught page errors. Physical-device/hosted use,
real sync/recovery, offline network reload and DST/travel attribution migration
remain unverified. Existing date keys are read directly; unknown historical
timezone/occurrence metadata is not invented. Past-day editing needs separate
correction-time review. No measured issue justified further optimization.
Shared tokens, immutable chapters/readings and persistence behavior are unchanged.

The developer separately reports Past phases presentation, placeholder,
Continue/Routine-idle and Reflect-swipe concerns resolved in use. These are not
fresh regression checks in this selection. Grey-input-box confirmation and
other independent gaps remain. Next: developer device review of Log History.

## Tighter past-phase spacing (2026-11-03)

The developer approved matching past-term and Remove spacing to the page's
existing roughly 10px rhythm. Branch `paing-branch`, HEAD `a4cd328`; all 16
already-modified paths preserved. Runtime edits are scoped CSS: record-local
0.65rem spacing, no read-only row touch minimum/padding, and a top-aligned Remove
label with a retained 44x44px target. Existing browser checks and owning records
updated; no model/personal-data/remote/staging/commit/deployment changes.

Final checks:

- `node --test --test-name-pattern="Protocol finished|Protocol past phases|shared App Box geometry" tests/writing.browser.mjs`:
  **6/6 passed**. Actual components/CSS, isolated synthetic accounts, Bangkok
  time, blocked external requests, 360x667/390x844 and reduced/normal motion.
  Existing history tests now measure all 12 records' term/Remove gaps, read-only
  row heights, label alignment and touch targets. Also verify two-tap Remove
  confirmation/archive without deleting completion evidence, touch/wheel scroll,
  resize, reload, unchanged counts, fixed Header/Footer and return to a running
  phase. No new standalone test suite or unrelated model checks were added.
- Both widths measure **10.390625px** between terms and before Remove. Read-only
  rows are **20.625px** tall; Remove is **44x44px** and its visible label begins
  **2px** below its top. Long-history frames remain **400.1875px** at 360x667 and
  **480px** at 390x844 with one Body scroller. Body overflow is 2340px/2260px for
  the 12-record fixtures; Header/Footer remain fixed when scrolling.
- Note, Deep Thoughts, Habit and Protocol resting frames remain **346px**, Pages
  **344px**, header gaps **48px** at both widths. Shared geometry/type/gap tokens
  are unchanged.
- `node node_modules/eslint/bin/eslint.js tests/writing.browser.mjs`: **clean**.
- `node node_modules/next/dist/bin/next build`: **passed**, including TypeScript
  and static generation. The model suite, broad lint and Vinext build were not
  repeated for this scoped CSS refinement; affected runtime/geometry journeys
  and the Next production target were selected. Whitespace and added local
  links/fragments passed.
- Inspected `outputs/protocol-history-bounded-top-390.png`: compact term and
  Remove spacing is visible, with existing summary/count/divider rules retained.

Attempts: the initial run passed 5/6 but the normal-motion test tapped Phases
while its App-back transition was still active. It now waits for that transition
to finish. A rerun also sampled the frame before ResizeObserver began its growth
animation and compared it with the settled scrolled frame. The test now waits
two animation frames and for the frame's current animations to finish before
recording fixed positions. The final 6/6 run passed with no additional runtime
fix. These are timing corrections to the verification setup, not new motion
behavior. No measured issue justified further optimization.

Physical-device/hosted/sync verification, historical term versions, prior
unrelated bug/test gaps and the original grey-input-box confirmation remain
separate. Next is developer use/review of the tighter past-phase list.

## Bounded Protocol past phases (2026-11-03)

### Approved scope and baseline

The developer approved the proposal to bound expanded Past phases like Note,
keep full phase summaries, shorten term counts and remove white term-row lines.
Branch `paing-branch`, HEAD `a4cd328`; 15 already-modified tracked paths preserved.
The preceding verified history grew to 819.56px on a short phone without scrolling.
No personal data, remote configuration, staging, commits or deployment.

### Delivered behavior

The shared existing bounded-page CSS now also matches Protocol home while Past
phases is open. Its frame uses the same 480px/60dvh ceiling and shared minimum;
only Body scrolls, with Header and Footer outside the scroll area. Direct Body
children retain their intrinsic height rather than shrinking to fit. Closing
Past phases removes that bound. Draft/running term Pages retain natural growth.

Full `1 of 7 days kept` summaries stay under titles. Individual terms display
`1/7` and `0/7`, with white row borders removed and between-phase separation kept.
No model, stored record, count formula or correction permission changes. DESIGN,
Page standard and the decision log record the approved history-only exception.

### Checks and measurements

- `node --test --test-reporter=dot tests/protocol-home.test.mjs tests/circle-os-model.test.mjs tests/habit-spacing.test.mjs`:
  **82/82 passed**, covering phase read models, finished-record protection and
  existing model/spacing behavior.
- `node --test --test-name-pattern="Protocol finished|Protocol past phases|Protocol term inputs|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
  **10/10 passed**. Actual components/CSS with synthetic isolated accounts,
  Bangkok time and blocked external traffic. Retains input-scrollbar and
  running-row regression checks alongside the new bounded history journeys.
- `node --test --test-name-pattern="Protocol past phases" tests/writing.browser.mjs`:
  **2/2 passed** after removing an unused test alias and adding the active-phase
  history/return check. These overlap the 10 cases. Checks include empty/collapsed
  rest, 12 finished/early-ended phases, exact 1/1/0/1/1/7/0/7 text, no white row
  borders, wheel and CDP touch scrolling, last-record reachability, fixed Header/
  Footer, close/reopen, resize to 560px height, reload and unchanged saved records.
  The 390px case also opens history behind an active eight-term phase and returns
  to its naturally growing running Page. Both reduced and normal motion used.
- `node node_modules/eslint/bin/eslint.js app/os/protocol-page.tsx tests/writing.browser.mjs`:
  **clean** after removing the unused test alias.
- `node node_modules/next/dist/bin/next build` and
  `node node_modules/vinext/dist/cli.js build`: **both passed** on the final
  application changes. Next includes TypeScript/static generation. Vinext's
  route-classification notice and a plugin-timing advisory remain build output,
  not runtime failures. Whitespace and added local links/fragments were checked.
- At 360x667: expanded frame **400.1875px**, Body **210px**, Header offset **23px**,
  Footer offset **300.1875px**. At 390x844: frame **480px**, Body **290px**, Header
  offset **23px**, Footer offset **380px**. Exactly one inner scroller, no
  horizontal overflow. A wheel scroll moves Body by 260px without moving either
  fixed area. Empty/collapsed frames remain **346px**. At 560px viewport height,
  the shared minimum wins and the frame remains 346px.
- Resting Note, Deep Thoughts, Habit and Protocol frames remain **346px**, Pages
  **344px**, header-box gaps **48px** at 360/390px. Real Habit/running Protocol
  rows still grow naturally with no inner scroller. Shared geometry/type/gap
  tokens unchanged.
- Inspected `outputs/protocol-history-bounded-top-390.png` and
  `outputs/protocol-history-bounded-390.png`: title/summary/count hierarchy stays
  readable, white row dividers are absent and the footer remains visible at the
  bottom of the list. A short-phone screenshot is also retained at
  `outputs/protocol-history-bounded-360.png`.

### Limits and next action

The first lint run identified an unused test-only alias; it was removed and lint
and both affected browser cases passed again. No application failure required a
follow-up fix, and no measured issue justified additional optimization. This
reuses existing bounded Page rules instead of introducing a separate scroller.

Physical devices/native keyboards, hosted sessions, real cloud sync and beta
readiness remain unverified. Historical term versions and other prior bug/test
gaps remain separate. The earlier grey-box cause still needs developer
confirmation. Next is developer use/review of Past phases. Earlier entries retain
their unique evidence, with unbounded finished-history rules superseded here.

## Protocol simplification and input scrollbars (2026-11-03)

### Approved scope and behavior

The developer approved hiding the small grey box on the term input and requested
removal of Correct last day as unnecessary. Branch `paing-branch`, HEAD `a4cd328`,
with 15 modified tracked paths at startup. Existing Habit/history work is
preserved. No personal data, remote configuration, staging or deployment.

Removed the correction action/editor, its transient navigation/state, shell
props/callback and dedicated model draft/write functions. Finished-phase terms
remain read only; running-day ticks and phase creation still work. Existing
correction receipts remain accepted by normalization and merge for compatibility.
Both Protocol term kinds share scoped native-scrollbar suppression; content
sizing and multiline input remain.

### Checks and measurements

- `node --test --test-reporter=dot tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/circle-os-model.test.mjs tests/protocol-home.test.mjs tests/account-scope.test.mjs tests/first-use-setup.test.mjs tests/phases.test.mjs`:
  **120/120 passed** after the final cleanup. Includes completed/archived/date
  guards, immutable finished results through reload/merge, retained older receipts,
  ordinary running-day edits and the pre-existing Habit/account/setup checks.
- `node --test --test-name-pattern="Protocol finished|Protocol term inputs|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
  **9/9 passed** after final cleanup. Actual components/CSS with synthetic
  account/storage, blocked external requests and Bangkok time. Mobile history
  checks use 360/390px with reduced/normal motion. Input checks use 360/390/1280px,
  verify empty/short/wrapped text, phase creation, reload and a running-day tick.
  The 1280px case uses the harness's touch/mobile context at a wide viewport;
  it is not physical desktop-browser certification.
- Targeted ESLint on model, shell, Protocol page and the three changed test files:
  **no errors**, existing `renderChapterTemplate` unused-import warning only.
- `node node_modules/next/dist/bin/next build` and
  `node node_modules/vinext/dist/cli.js build`: **both passed** after final cleanup.
  Next includes TypeScript/static generation. Vinext retains its existing
  route-classification notice. No deployment/runtime certification is inferred.
- `git diff --check`: passed with existing LF/CRLF warnings. Local links/fragments
  in the updated sections were checked; historical evidence remains below.
- Four resting frames remain **346px**, Pages **344px**, header-box gaps **48px**
  at 360/390px. Wrapped input grows from **20px to 60px** on mobile with equal
  client/scroll heights and no horizontal overflow. Wide inputs grow to 45px
  (required) and 35px (optional). Expanded finished history measures **819.56px**
  at 360x667 with no inner/horizontal scroll and a 48px first-content gap. Real
  Habit/Protocol rows still grow downward. Shared sizing/type/gap tokens unchanged.
- Inspected `outputs/protocol-inputs-390.png`: wrapped terms are fully visible
  and there is no grey box or scrollbar chrome. The baseline isolated browser
  also did not show the reported box; this is not a reproduction of its cause.

### Attempts and remaining limits

The first model run was 119/120: the new compatibility test compared independently
created fixtures whose timestamps differed by one millisecond. Reusing the same
baseline with only its receipt removed fixes the test setup. The first browser
selection was 8/9: its history measurement targeted the nested term list instead
of the first visible standing section. Correcting the measurement yielded 9/9;
the final run after removing leftover correction navigation also passed 9/9.
An initial patch attempt failed verification because PowerShell decoded UTF-8
as a legacy encoding. Re-reading explicitly as UTF-8 allowed the intended patch;
no encoding rewrite is part of this change.

Native scrollbar chrome is the inferred cause of the original grey box, pending
developer confirmation in the affected browser. Physical phones, native
keyboards, hosted sessions and real cloud sync remain unverified. Earlier
ResizeObserver, placeholder, bug 13, past-phase grouping/labels, full prospective
term history and historical Week-assertion gaps remain. No wider correction UI,
stylesheet split, personal migration or deployment is included. No measured
problem justified further optimization.

## Protocol correction protections (2026-11-03)

### Scope and baseline

The developer approved the bounded correction proposal after read-only History
review. Branch `paing-branch`, HEAD `a4cd328`, with 11 pre-existing modified paths
preserved. No personal data, remote configuration, staging or deployment.
The History baseline passed 114 focused tests and 11 actual-component cases.
An in-memory reuse of this browser harness reproduced bug 16 at 360/390px:
one last-day term tap changed 1/1 to 0/1, unsealed the day and survived reload.
Synthetic model probes also accepted malformed/out-of-run dates and archived
targets, and showed later wording replacing earlier wording in phase summaries.
Full prospective term history remains a separate gap.

### Delivered behavior

Past term rows are read only. The latest completed phase opens Correct last day
on its scheduled final date, with selected booleans, Save correction, Cancel
and Phases back. Returning preserves expanded Past phases. Selection/cancellation
does not write evidence. Each accepted correction keeps an immutable receipt
with available wording, actual time and before/after completions/seal. Required
changes explicitly unseal; optional changes preserve the seal. Reticking never
silently reseals. No-op/repeated saves, stale edits, invalid/out-of-run/future
dates and archived targets are rejected. Existing running-day controls remain.

### Final checks

- `node --test tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/circle-os-model.test.mjs tests/protocol-home.test.mjs tests/account-scope.test.mjs tests/first-use-setup.test.mjs tests/phases.test.mjs`:
  **123/123 passed**, log `outputs/protocol-correction-model.log`. Covers explicit
  values/no-ops/repeated IDs, stale run/completion changes, target guards, original
  seal/completion retention, optional/required semantics, missing seals, actual
  time versus merge ordering under clock skew, reload and both stale-merge
  directions. Earlier receipts survive later corrections and merges.
- `node --test --test-name-pattern="Habit dated history|new Habit accepts|empty Habit History|Day One v3 Routine task controls|shared App Box geometry|real Habit and Protocol rows|Protocol correction|Protocol deliberate|Protocol stale" tests/writing.browser.mjs`:
  **17/17 passed**, log `outputs/protocol-correction-browser.log`. Isolated
  Chromium, synthetic account/storage, blocked external traffic, 360/390px,
  reduced motion and normal motion. Six new cases cover read-only taps, keyboard
  selection, disabled unchanged saves, Cancel/back, three consecutive accepted
  corrections with retained evidence, reload and a competing accepted edit.
  No uncaught page errors or external backend/model requests.
- `node --test --test-name-pattern="Protocol deliberate" tests/writing.browser.mjs`:
  **2/2 passed** after extending the 360px case to save all three corrections
  with `context.setOffline(true)`, verify local persistence, restore the harness
  connection and reload. Log `outputs/protocol-correction-offline.log`. These
  reruns overlap the 17 cases; they are not two extra distinct cases.
- `node node_modules/next/dist/bin/next build`: passed, including TypeScript and
  static generation; log `outputs/protocol-correction-next.log`.
- `node node_modules/vinext/dist/cli.js build`: passed; log
  `outputs/protocol-correction-vinext.log`. Its route-classification notice
  remains build output, not runtime certification.
- Targeted ESLint for model, shell, Protocol page and the three changed test files:
  no errors, one existing `renderChapterTemplate` unused-import warning in shell.
  `git diff --check` passed with existing LF/CRLF warnings.
  A read-only document audit passed 14 added local links/fragments (including
  the preserved Habit additions) and confirmed four earlier HEAD record bodies
  remain intact in the decision log, task, handoff and journey record.

### Geometry, attempts and limits

Note, Deep Thoughts, Habit and Protocol rest at **346px frames / 344px Pages**
with **48px header-box gaps** at both widths. Visible text gaps are 52px for
writing and 51.09px for Habit/Protocol. History ceilings remain 400.19px at
360x667 and 480px at 390x844. Real Habit/Protocol rows grow naturally. Eight
required correction terms plus one optional term measure **1103.92px** at
360x667, with a 48px top gap, 44px controls, no horizontal overflow and no inner
scroll panel. Inspected `outputs/protocol-correction-360.png`. No shared sizing,
type or gap token changed; no measured issue justified further optimization.

The first six-case browser attempt failed: two assertions retained the old
accessible term name; returning collapsed Past phases; and the new back control
needed a 44px target outside header flow. A five-case follow-up passed cancellation
and stale protection but exposed a shared footer button retaining its committed
state between editor visits. Each correction now keys its own save button.
The final six-case run, combined 17-case run and offline reruns passed after
these fixes. Some exploratory runs overlapped local edits and builds; only the
stable final runs above establish verification. The initial Next build failed
on nullable-date inference; the explicit string guard passes the fresh build.

Bug 16 is partially resolved: its accidental count-change behavior is fixed
locally; past-phase labels/separation and full prospective wording remain open.
Other-day/early-ended corrections, physical phones/native touch, hosted sessions,
real acknowledgements/cross-device conflicts/recovery and beta readiness are
unverified. Existing ResizeObserver, legacy placeholder, remaining bug 13 reports
and two recorded Week source assertions remain separate. No real data migration,
cloud schema, paid AI request, chapter/reading version or delivery budget changed.

## Habit History page and flexible entry (2026-11-03)

### Approved scope and implementation

The developer approved a separate History Page, opened from Record's top right,
with scrollable past-day groups, Yesterday without its date, older-day dates,
no dropdown/wording notices/dark divider, and unchanged today Undo. They also
explicitly requested any-field-first Habit entry with action/name required to
save and remain visible. Runtime remains limited to model, shell and scoped CSS;
the existing Habit model/browser checks and owning records are updated.
Branch `paing-branch`, HEAD `a4cd328`; all 11 already-modified paths are preserved.
No personal data, import, remote service or deployment was involved.

History reuses the shared App-back controller and the bounded writing-body CSS.
It reads the same completion snapshots and keeps provenance internal. Record
stays today-only. The existing inline Habit editor now keeps a new unnamed
definition in draft status. All three fields are visible while adding it.
Moving between fields does not archive it; committing a nonblank action makes
it active. Unnamed work is hidden when leaving and reopens through New habit,
including after reload. Drafts cannot be completed or counted as active habits.
Saved-Habit clearing retains the existing archive behavior.

### Verification

- `node --test tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/circle-os-model.test.mjs tests/protocol-home.test.mjs tests/account-scope.test.mjs tests/first-use-setup.test.mjs`:
  **114/114 passed**. Log: `outputs/habit-history-refinement-model-verified.log`.
  The new draft case first failed on the old archive behavior, then passed for
  optional-field-first draft persistence, whitespace name rejection, no queued
  active save/completion, and promotion with preserved cue/identity. A further
  regression confirms that resuming an older unnamed active placeholder keeps
  its existing optional fields instead of recreating it. Prior
  snapshot/merge/archive, spacing, account and setup cases remain passing.
- `node --test --test-name-pattern="Habit dated history|new Habit accepts|empty Habit History|Day One v3 Routine task controls|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
  **11/11 passed** after the last runtime change. Log:
  `outputs/habit-history-refinement-browser-final.log`. Isolated Chromium,
  synthetic account/storage and blocked external requests. New-history journeys
  use 360x667 reduced motion and 390x844 normal motion; other cases use
  360x844/390x844 reduced motion. No uncaught page errors or external traffic.
  Covered Record/History/back, untouched domain records while browsing, fixed
  headers during actual wheel scrolling, Yesterday/older labels, no dropdown or
  notices, read-only snapshots and legacy rows, today Undo across reload, and
  empty History. Cue-first and identity-first both retain all fields through
  saving/reload; unfinished and whitespace-name drafts hide and recover without
  becoming active. Existing task controls and completion snapshots still pass.
- Long History frames: **400.19px at 360x667**, **480px at 390x844**, with one
  Body scroller and no horizontal overflow. Empty History rests at **346px**.
  Note, Deep Thoughts, Habit and Protocol resting frames remain **346px** with
  **48px** header-box gaps at 360/390px. Visible text gaps remain 52px for writing
  and 51.09px for Habit/Protocol. Real Habit/Protocol rows still grow naturally
  without inner scrolling. Visually inspected `outputs/habit-history-list-360.png`;
  the 390px image is also saved. No shared geometry/type/gap value changed.
- `node node_modules/next/dist/bin/next build`: passed after the last runtime
  change, including TypeScript. Log: `outputs/habit-history-refinement-next.log`.
- `node node_modules/vinext/dist/cli.js build`: passed again after the final
  compatibility fix. Log: `outputs/habit-history-refinement-vinext.log`.
- `node node_modules/eslint/bin/eslint.js app/os/circle-os-model.js app/os/circle-os-shell.tsx tests/habit-identity.test.mjs tests/writing.browser.mjs`:
  passed with the existing `renderChapterTemplate` unused-import warning only.
  `git diff --check` passed with line-ending warnings. The read-only document
  audit passed nine added local links/fragments and preserved all four earlier
  continuity/evidence/decision record bodies from HEAD.

### Attempts and limits

The first focused model run was 101/102: an existing source-wiring assertion
still expected the old yesterday-only conditional; updated it for both back
Pages and reran. The first browser run was 8/9: a reduced-motion History test
asserted the frame ceiling before the shared frame had settled. Waiting for
the measured frame required no runtime sizing fix. The next two History cases
passed; the final expanded 11-case run also passed with actual wheel scrolling,
short-phone ceilings and empty History checks.

The older-placeholder compatibility case initially failed because recreating
its ID cleared the optional fields. The model now resumes that existing empty
record as a draft and the shell uses that action. After this fix the final
114-case model selection, 11-case browser selection and Next build all passed
again. Reopening an existing draft leaves it unchanged; named/archived records
are not overwritten by the draft-resume path.

The previous dated-history evidence remains below, including its two pre-existing
Week source-assertion failures; they were not fixed or recertified here. Protocol's
direct historical toggle/seal issue, bug 13 color/title reports, legacy placeholder
and ResizeObserver warnings remain open. Physical phones/native touch scrolling,
hosted auth/session, real sync/receipts, recovery and beta readiness remain
unverified. Normal-motion History now has synthetic browser coverage; this is
not physical-device certification. Old wording reconstruction, uncompleted-day
definition versions, explicit past corrections and task date/timezone migration
remain outside scope. No chapter/reading version, delivery budget, paid AI,
cloud schema or local-first clearing/acknowledgement rule changed. No measured
performance issue justified an optimization.

## Habit dated history (2026-11-03)

### Scope and baseline

The developer approved recorded-day browsing, new completion wording snapshots,
legacy wording notices, unchanged today Undo, focused checks and owning records.
Starting HEAD `a4cd328`, branch `paing-branch`, clean tree. The preceding Habit
controls were confirmed by the developer in use; this is separate from the new
history checks. No personal records or external services were used.

The existing `dayRecord` reads today's definition and hides archived habits.
The focused regression demonstrates rename then archive on that unchanged
reader. History now uses `habitHistoryRecord` over the same completions, retaining
snapshot wording and archived/orphan records, without changing Week's current
habit-count semantics. Five initial new model cases failed before implementation
(missing snapshots/readers); all pass after implementation, with a sixth edge
case for known-empty snapshots and missing definitions.

### Final checks

- `node --test tests/habit-identity.test.mjs tests/circle-os-model.test.mjs tests/protocol-home.test.mjs tests/account-scope.test.mjs`: **101/101 passed**.
  Covers rename/archive/reload, stale merge and explicit false values, snapshot
  retention, legacy current/unknown wording, empty snapshots, missing definitions,
  recorded-day selection, independent new-day wording and existing domain/account
  behavior. Log: `outputs/habit-history-focused.log`.
- `node --test --test-name-pattern="Habit dated history|Day One v3 Routine task controls|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
  **7/7 passed** after the last model change. Isolated Chromium, 360x844 and
  390x844, Bangkok timezone, reduced motion, synthetic account/storage, blocked
  external requests. New journeys open an older day, show original archived-habit
  wording, label legacy current/missing wording, retain tasks, expose no past-day
  writing/toggle controls and leave domain records byte-for-byte unchanged while
  browsing. Today's Undo persists across reload and leaves past ticks intact.
  A 44px day picker, no horizontal overflow, existing task controls and natural
  row growth pass. Log: `outputs/habit-history-browser-verified.log`.
- Resting Note, Deep Thoughts, Habit and Protocol: **346px frames / 344px Pages**
  and **48px header-box gaps** at both widths. Visible text gaps: 52px for writing,
  51.09px for Habit/Protocol. Final real-row frames: 600.09px Habit and 926.11px
  Protocol, with no inner scrolling. Scoped history CSS changes no shared tokens.
  Visually inspected `outputs/habit-history-360.png`; the 390px image is also saved.
- `node node_modules/next/dist/bin/next build`: passed after final runtime code,
  including TypeScript. Log: `outputs/habit-history-next-final.log`.
- `node node_modules/vinext/dist/cli.js build`: passed. Log:
  `outputs/habit-history-vinext-final.log`. Initial attempt used the wrong CLI
  path (`dist/cli/index.js`); corrected using the installed package's bin entry.
- Targeted ESLint for model, shell and both changed tests: no errors; the existing
  shell `renderChapterTemplate` unused-import warning remains. `git diff --check`
  passed with line-ending warnings. A read-only Node audit passed all five added
  local links/fragments and confirmed preservation of four earlier record bodies.

### Attempts and retained gaps

The first seven-case browser run was 6/7: the existing 360px control test sent
its second tick while the button's success lifecycle was busy. It now waits
for aria-busy=false. Both subsequent seven-case runs passed; the last followed
the empty-snapshot model fix. No button-engine runtime change was made.

An expanded model/Week run passed 121/123. Both failures are existing source
assertions in `week-app.test.mjs`: the newline-sensitive font-ready assertion
reads unchanged `app-session.tsx`, and the 16px-floor assertion rejects the
already-approved Week `!important` typography rule also present in HEAD's CSS.
Those failures are retained, not fixed in this scope. Protocol's latest-finished
term still directly toggles its last day and may unseal it; that remains the next
separate correction review. Bug 13 color/title reports, legacy placeholder and
ResizeObserver warnings remain open.

Physical phones/native select behavior, normal-motion history transitions,
hosted auth/session history, real server acknowledgement/backup/recovery and
cross-device sync are unverified. This slice does not reconstruct old wording,
version uncompleted-day definitions, add past-day corrections or migrate task
date/timezone semantics. No model call, chapter/reading mutation, account schema,
cloud setting or deployment changed. Local Circle-day rules and dated empty/false
values are preserved. No measured performance problem justified optimization;
Phase 1 and beta readiness remain uncertified.

## Habit task controls (2026-11-03)

Approved scope: restore Add task on normal Routine, match Habit checkbox sizes
to Tasks, focused checks and bug/continuity records. Runtime edits are limited
to `circle-os-shell.tsx` and `os-app.css`; existing changes remain preserved.
No personal records were edited.

The fresh-v3 fixture removes synthetic Habit setup runs/recovery markers while
retaining completed Day One v3. Before the fix the 360px case failed because
Add task was absent. The Footer required the real Habit Building completion,
while the displayed idle Page uses a separate usable view after v3. The fix
shows Add task whenever normal Routine is open; Record omits it and no false
setup completion is stored.

Final command:
`node --test --test-name-pattern="Day One v3 Routine task controls|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
**5/5 passed** in isolated Chromium at 360x844 and 390x844, Bangkok timezone,
synthetic account/storage and blocked external requests. No uncaught page
errors or external traffic. Covered task/habit entry, habit toggling, task
completion, local persisted reload, Record undo and unchanged setup completion.
Discs measure 30px with 5x11px checks and 44px label hit regions. An off-disc
Habit tap in the extended hit region works.

Four resting App Boxes measure 346px (344px Pages) with 48px header-box gaps
at both widths. Visible gaps are 52px for Note/Deep Thoughts and 51.09px for
Habit/Protocol. Eight Habit rows and Protocol terms grow without inner scrolling.
No shared geometry token changed.

Intermediate failures were test locators retaining old accessible names after
editing/completion, and an initial 40px hit area because absolute insets start
inside the 2px border. Corrected locators and extended insets to 9px; the final
run verifies 44px and actual off-disc input. No optimization was justified.

`node node_modules/next/dist/bin/next build` passed after final CSS changes.
`node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx tests/writing.browser.mjs`
passed with one existing `renderChapterTemplate` unused-import warning.
`git diff --check` passed with existing line-ending warnings. Physical devices,
hosted sessions, real sync and a fresh Vinext build remain unverified; earlier
ResizeObserver gaps remain. Only bug 13's checkbox-size portion is closed.

## Editable titles and shared spacing (2026-11-03)

The developer approved 29px editable titles/questions with 18px content/answers,
a 48px shared label gap, equal 25px Main-to-Sub/Body-to-Footer gaps, and the
Note/Deep Thoughts Trash cleanup. Removed the status line and divider; the
Restore-to-Delete layout gap is 4px. Existing raised-button geometry means the
visible button face and its layout box have different bounds. Touch targets
remain at least 44px and deletion still requires confirmation.

Verification used actual components, synthetic account records and isolated
mobile Chromium with external requests blocked:

- `node --test tests/writing.browser.mjs`: 41/43 passed initially. Both new
  typography cases failed because the Trash measurement used the lifted button
  face instead of its shell. Corrected the assertion; no runtime fix was needed.
  Log: `outputs/type-spacing-browser.log`.
- Final `node --test --test-name-pattern="Page spacing across|read and write typography" tests/writing.browser.mjs`:
  4/4 passed. This covers both corrected cases and two added Page audits, bringing
  the distinct passing cases across the runs to 45. Log:
  `outputs/type-spacing-final.log`.
- The Page audit measures 17 states at each of 360px and 390px: Note, Deep
  Thoughts, Routine, Protocol, Log, Week, three Vision declarations, four Athena
  Pages, three Quest categories and Suggestion. All measured top gaps are 48px.
  Initial audit attempts selected Protocol's supporting paragraph and hidden
  Week content; corrected the measurement to the first visible layout anchor.
  Route auditing waits for the outgoing Today session to unmount.
- Note/Deep Thoughts/Habit/Protocol resting frames remain 346px, with 344px
  Pages, 48px header gaps and no internal resting scroll at both widths. Real
  Habit/Protocol rows still grow continuously. Long Note/History/Trash retain
  one Body scroller and the 480px/400.19px tested ceilings. Footer padding is
  25px. Restore and confirmed deletion journeys pass for both writing kinds.
- Computed sizes pass for Note, Deep Thoughts, opened Trash entries, Athena's
  reply, Vision read/edit, Week goals/steps, Chapter short/long questions and
  Workshop previews. Reading-only Chapter cover/info retain 32px type.
- `node node_modules/next/dist/bin/next build`: passed, including TypeScript
  and route generation. Log: `outputs/type-spacing-build.log`.
- `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx tests/writing.browser.mjs`:
  passed. Whitespace verification passed.

Visually inspected `outputs/writing-type-note-390.png` and
`outputs/note-bounded-trash-360.png`. Existing ResizeObserver notifications
remain on navigation/Workshop paths, as recorded by the earlier baseline.
Physical phones, native keyboards, hosted sessions, hidden Week Review flows
and a fresh Vinext build are not certified here. No persistence, cloud,
chapter content, edition or budget changed. No measured performance problem
justified an optimization. The test servers shut down after verification.


## Editable reading typography (2026-11-03)

The developer approved 24px main / 18px body sizes only where people both read
and write. Scoped CSS covers account Note/Deep Thoughts and opened history/trash,
Athena's embedded reply editor, Vision declarations, Week goals/steps and Chapter
short/long text questions with the same Workshop preview. Only sizes change;
list rows, reading-only pages, weights, line heights and spacing retain their
rules. New tests use actual components and synthetic account data, not personal
records or external services.

Commands and results:

- `node --test tests/writing.browser.mjs`: 40/41 passed. The Note header test at
  390px encountered `.os-splash-host` intercepting History during the run across
  06:00. Other cases, including bounded Note/History/Trash at both phone sizes,
  passed. Log: `outputs/type-writing-final.log`.
- `node --test --test-name-pattern="Note header alignment.*390px|reading-only Chapter|read and write typography" tests/writing.browser.mjs`:
  final 5/5 passed. Includes the previously blocked header case and two new
  cover/info exclusions. In total 43 distinct cases have passed across these
  runs. Log: `outputs/type-final-recheck.log`.
- `node --test --test-name-pattern="Vision and Week|real Reflect reading reply" tests/writing.browser.mjs`:
  3/3 passed. Vision read/edit sizes match, corrections save, Week goals/steps
  remain editable, and the actual Athena reply keeps its ledger/source behavior.
- `node node_modules/next/dist/bin/next build`: passed including TypeScript and
  static generation. Log: `outputs/type-next-build.log`.
- `node node_modules/eslint/bin/eslint.js tests/writing.browser.mjs` and
  `git -c core.safecrlf=false diff --check`: passed.

At 360px and 390px, empty Note, Deep Thoughts, Habit and Protocol frames remain
346px (344px Pages), with 80px header gaps and no internal resting scroll.
Short Note remains at its minimum; real Habit/Protocol rows still grow naturally.
Writing/History/Trash remain bounded with one Body scroller. Actual Note image:
`outputs/writing-type-note-390.png`.

Earlier new-test attempts used Add step instead of the actual Add a step toward
a goal label; corrected the selector and reran successfully. ResizeObserver
notifications appear on Workshop/route transitions. A diagnostic with only the
new type block removed also emitted them (`outputs/type-baseline.log`); those
separate layout warnings are not claimed fixed here. Physical phones, hosted
sessions and a fresh Vinext production build remain unverified. No persistence,
day-boundary logic, immutable content, cloud configuration or performance
optimization changed. No further optimization was justified by these checks.

## Quiet Deep Thoughts writing (2026-11-03)

The developer requested removing routine saving/sent and recovered/discarded
messages and the Discard draft control. The shared writing Page now suppresses
these on Deep Thoughts while preserving actual errors, local recovery, Send,
Save changes and Next question. Embedded reading-answer controls remain separate.

Actual-component isolated Chromium checks passed at 360x844 and 390x844 using
synthetic account data; no personal data or external service was used:

- `node --test --test-name-pattern="Deep Thoughts quietly|Deep Thoughts opens directly|failed.*commit" tests/writing.browser.mjs`: 3/3 passed. Held answer,
  correction, reload, silent recovery, cleared draft remaining empty after reload,
  absence of Discard draft, and failed local save/retry verified.
- `node --test --test-name-pattern="normal-motion Deep Thoughts" tests/writing.browser.mjs`: 1/1 passed. Deliberately delayed durable acceptance;
  Footer stays free of routine saving/sent messages both during and after Send.
- `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx tests/writing.browser.mjs`
  and `git -c core.safecrlf=false diff --check`: passed.

The first new assertion matched sent inside the synthetic answer itself. Scoped
it to the Footer and reran successfully; no product fix was required for that
test failure. No geometry/type tokens or persistence commands changed. No new
build, physical-device, cloud-sync or deployed-session certification is claimed.
Existing Admin resize and legacy placeholder gaps remain as recorded below.

## Deep Thoughts and managed quotes (2026-11-03)

### Approval, setup and behavior

The developer approved replacing ordinary Thoughts in Today with Deep Thoughts,
matching Note's History/Trash, keeping an answered question visible with Next
question, and Admin-managed shared quotes. Work began on `paing-branch` at
`2bd8502` with a clean tracked tree. No staging, commit or deployment is included.

The existing Vite harness imports actual Today/Reflect, shared writing/Page/CSS,
Admin and account stores. Synthetic accounts and isolated Chromium use
360x667/360x844/390x844, Bangkok and both motion settings. Quote API responses
are synthetic; other external traffic is blocked. No personal records are read.
The legacy fixture uses only its intercepted transport and is not a migration.

New browser journeys cover direct Deep Thoughts, held answers and reload,
Next question, source-preserving correction, old untitled Thoughts without an
invented question, failed Send/recovered drafts, typing during a delayed save,
question/answer Trash/Restore/Delete forever and retained answered metadata.
History matches Note's controls and bounded Body scrolling. Unsent recovery rows
are marked Unsent. Quotes rotate through a full pool, preserve the live draft and
question, retain reading position across reload, use cached content offline,
honor an empty catalog, and preserve normal-motion travel and Line exits.
Admin checks add/remove confirmation, 44px controls and retained failed input.
The existing Note/Line, Note autosave/failure/conflict, Reflect reply, account
switching and geometry checks remain in the consolidated browser command.

### Verification

The focused model/route selection passed **105/105**. It includes actual
transpiled Admin route handlers with missing/forged/expired cookie and cross-origin
denial before backend access; public versus server key separation; input/failure
handling; pagination when the server returns smaller pages; full 300-quote
rotation; writing compatibility, immutable revisions and account ownership.

The developer reported applying the SQL and saving the ignored server key.
`node scripts/check-quotes-live.mjs --write` then passed against the configured
project: public SELECT, server INSERT, denied anonymous INSERT/DELETE, server
DELETE and a final zero temporary-row check. The catalog was empty before the
test and afterward; no authored quotes were added. The model never received the
secret value. Initial checks saw a missing saved key/table; the developer
completed setup. Sandboxed networking returned EACCES; approved network checks
then succeeded. Shell quoting was corrected before any live request.

The final consolidated actual-component browser run passed **32/32**. Focused
strict types and both Next/Vinext production builds passed. Selected ESLint has
zero errors and the starting shell's one unused `renderChapterTemplate` warning.
The generated Next and Vinext browser outputs were checked: **59 files**, zero
occurrences of the configured Supabase secret or Admin code. `.env.local` remains
ignored and untracked. The 13-record link audit passed 243 local links and 102
heading fragments after final result edits; whitespace checks passed.

`node scripts/check-quotes-live.mjs --app` also passed against the final built
Next app and live catalog: public reading, missing/forged Admin cookie denial,
cross-origin denial, accepted signed Admin add/read/remove and zero remaining
fixture rows. Its temporary loopback server closed afterward. No app was deployed.
The subsequent server-only fixes were rechecked by the 105-case route/model
selection, strict types, production builds and this live HTTP journey; the 32-case
browser run verifies the final writing/CSS and mocked quote/Admin UI behavior.

Commands (direct installed CLIs):

```text
node --test tests/writing.browser.mjs
node --test tests/quotes.test.mjs tests/deep-thought-model.test.mjs tests/writing-model.test.mjs tests/writing-compatibility.test.mjs tests/account-scope.test.mjs tests/admin-access.test.mjs tests/line-pool.test.mjs tests/line-feedback.test.mjs
node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx app/os/circle-os-shell.tsx app/os/admin/quote-editor.tsx app/os/quotes app/os/admin/quotes/route.ts app/os/admin/chapter-editor.tsx tests/quotes.test.mjs tests/writing.browser.mjs tests/deep-thought-model.test.mjs tests/line-feedback.test.mjs scripts/check-quotes-live.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx app/os/quotes/quote-server.ts app/os/admin/quote-editor.tsx
node node_modules/next/dist/bin/next build
node node_modules/vinext/dist/cli.js build
node scripts/check-quotes-live.mjs --write
node scripts/check-quotes-live.mjs --app
git -c core.safecrlf=false diff --check
```

### Attempts, measurements and limits

Early assertions sampled Note after reload instead of opening Deep Thoughts,
sampled frame growth before settling, and used an exact textarea label that
included its controlled text; the harness now follows the actual Page/role.
One intermediate broad run overlapped source HMR/build load and was not final
verification. A clearing-edit assertion now permits extra accepted revisions
while checking original and empty current text. An immediate native caret offset
is sampled after layout has committed. An obsolete source-regex mode test was
replaced by actual-component behavior, and boundary routing is browser-checked.

A repeated small-phone check exposed a real transient Footer gap: the global
reduced-motion duration transitioned every property, showing 0px before 26px.
Adding a render-presence class did not solve it and was removed. Scoped writing
Footers now set `transition-property: none`, retaining the shared Page motion
and gap token; the focused 360x667 run then kept 26px before/after body scrolling.

Live HTTP testing also caught two server integration issues that mocks did not:
Next normalizes loopback IPs in Request.url, so origin checking now uses the
actual Host with the request protocol, keeping host/port and cross-site rejection.
A real NextRequest regression covers this. PostgREST rejected ordering an INSERT
by a column absent from its returned projection; INSERT now selects its returned
fields without a reading-order clause. Actual module and built HTTP add/remove
checks passed afterward. Failed attempts and final runs left zero temporary rows.

The measured resting frames are 346px (344px Page) for Note, Deep Thoughts,
Habit and Protocol at both widths, with an 80px header-box gap. Deep History
ceilings are 480px at 390x844 and 400.19px at 360x667, with one Body scroller.
Existing Habit/Protocol rows still grow naturally. Screenshots inspected include
`outputs/deep-thoughts-history-390.png` and `outputs/quote-admin-390.png`;
motion/return and small-phone captures are retained under ignored `outputs/`.

Admin navigation emits ResizeObserver loop notifications before opening Quotes.
A separate isolated baseline loaded the unchanged HEAD shell, writer, CSS and
Admin using Vite read overrides (no checkout or source replacement): `2bd8502`
also emitted **10** notifications. The current Quotes control journey checks it
adds no notifications after that navigation settles. This existing shared-route
issue remains unresolved; no shared geometry/route engine was modified for it.

Physical phones/keyboards, deployed app/session routes and live authenticated A/B
quote-table sessions were not exercised. The hosted data checks certify the
public/server quote path, not personal sync or beta readiness. The older legacy
Note placeholder concern remains reproducible and unresolved. No personal data
or immutable chapter/reading content changed. No further measured performance
problem justified optimization; pagination fixes completeness rather than
expanding a content budget. See [quote setup](QUOTES.md) and the
[current contract](archive/2026-11-11-doc-cleanup/PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1412-note-deep-thoughts-and-quotes---2026-11-03).

## Bounded Note pages (2026-11-03)

### Approval and setup

The developer explicitly approved moving New Note from History to the Note
editor Footer, a shared 480px App Box ceiling reduced to 60% of a short dynamic
viewport (never below the shared minimum), Body scrolling and silent Note Trash.
Runtime scope is `writing-pages.tsx`, scoped `os-app.css` and the existing UI
browser tests; owning/continuity records are included. The 254-file baseline and
before-copies are ignored outputs. Branch `paing-branch`, HEAD `8890fb1`;
earlier uncommitted/untracked work is preserved. No staging, commit, deployment,
personal import, schema/store/provider, account/authentication or cloud change.

The actual-component loopback Vite harness uses synthetic account data, real
IndexedDB, Bangkok time and blocked external traffic. Existing 360x844/390x844
cases remain; the new bounded journeys also run at 360x667 and resize to 560px
height. Both normal and reduced motion are covered. Account cases assert no
legacy transport/model requests. The separate legacy placeholder baseline remains
a qualified known defect; these changes do not migrate that editor.

### Checks and measurements

- `node --test --test-reporter=tap tests/writing.browser.mjs`: **23/23 passed**
  in the final run, separately from builds, with no source changes during it.
- New Note appears only in the Note editor Footer. It waits for local saving,
  including typing during an in-flight save, before showing a blank Note. A
  simulated quota failure and unfinished composition keep the current writing.
  Retry/repeated New Note use succeeds without losing accepted entries.
- Long Note content, many History rows, many Trash rows and an opened long
  trashed Note each have exactly one scrolling Body. Last rows remain reachable.
  Native wheel and touch input leave History on the chosen page. Header/Footer
  positions within the frame remain stable while content scrolls. Typing at the
  end of a long Note keeps the caret line visible, with no textarea scroll area.
- Trash retains Restore and confirmed Delete forever/Cancel. Its actions remain
  visible at the ceiling and after a short viewport resize. Navigation and new
  writing reset content to the top. Moving a Note to Trash shows no success text
  or Undo. Error alerts remain, and other writing keeps Send.
- `node --test tests/writing-model.test.mjs tests/account-scope.test.mjs`:
  **35/35 passed**. No model/store changes; regression covers immutable revisions,
  conflicts, empty dated corrections, lifecycle, account epochs and day attribution.
- `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx tests/writing.browser.mjs`:
  final rerun passed with no errors or warnings.
- Strict targeted types passed after the final component sizing change:
  `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx`.
- `node node_modules/vinext/dist/cli.js build` and
  `node node_modules/next/dist/bin/next build`: both passed with exit 0 after
  the final scoped CSS correction. They ran sequentially after the final UI run.

| Measured frame | 390x844 | 360x667 |
| --- | --- | --- |
| Long Note / History / Trash ceiling | 480px | 400.19px |
| Long Note Body | 257px | 177px |
| Opened long Trash Note Body | 152px | 72px |
| Overflowing scroll areas per Note view | 1 | 1 |

At both 360x844 and 390x844, empty/short Note, Thoughts, Habit and Protocol retain
344px Pages/346px frames and an 80px Header box-to-content gap. Visible label
gaps remain Note/Thoughts 84px and Habit/Protocol 83.09px; NOTE/HISTORY tops and
bottoms match exactly. Habit/Protocol rows retain natural growth without nested
scrolling. No shared geometry/type/gap token changed. At a 560px-high viewport,
Note keeps the shared 346px minimum frame instead of shrinking below it.

Inspected screenshots: `outputs/note-bounded-write-390.png`,
`outputs/note-bounded-history-390.png`, `outputs/note-bounded-trash-360.png`.
The corresponding 360px write/history and 390px Trash captures are also saved.
The write and Trash captures intentionally show scrolled content with stationary
navigation/actions. No further runtime optimization was justified by measurements.

### Attempts, preservation and limits

Targeted checks caught the shared CreativeButton's default one-use lifecycle
when moved onto a persistent editor. New Note now uses its existing repeatable
mode, keeps clicks available during short provider refreshes, and guards duplicate
pending starts. Save completion flushes newer typing before replacing the buffer.
Tests now wait for the shared button's registration/focus and normal page-flip
settling; synthetic seeding reads the store result's actual receipt. The targeted
header/New Note checks then passed 3/3 and the bounded journeys passed 2/2.

The first full regression run passed 21/23. A second-tab harness startup timed
out waiting for `window.api` while builds also ran. The row-isolation test began
typing before New Note's shared button registration; it now waits for the blank
editor. The final full run was repeated separately from builds. Vinext
emitted Build complete, but PowerShell redirection converted its plugin-timing
warning into a NativeCommandError; direct CLI execution then passed with exit 0.
These earlier attempts are not counted as final passes.

The next full run passed 22/23: the short-screen caret check caught a transient
22px textarea scroll offset after the shared zero-height sizing pass. Note now
resets that internal field offset after sizing, leaving scrolling to Body. The
affected bounded journeys passed 2/2 after the correction; targeted types passed.

A subsequent full run passed 22/23 and exposed a 26px Trash footer shift on the
short viewport. The Note grid now gives Footer its full intrinsic content row
instead of an automatic row. That alone did not fix the repeated 22/23 result:
diagnostics showed Footer padding briefly at 0px while detail actions were
already present, then 26px after scrolling. The Note rule now attaches that gap
to actual footer content. The final full run passed **23/23**, with stable 26px
padding. Exact Header/Footer and field-offset assertions were not relaxed.

Final `node outputs/note-bounds-audit.mjs`: passed 224 local links, including
89 fragments across 12 records, and whitespace-format checks. The baseline
comparison found exactly 15 approved changed files, 239 byte-identical files and
no Git-visible additions/removals. `git diff --check` passed with existing
LF/CRLF warnings. Baseline, before-copies, screenshots and helper are ignored
outputs; prior working-tree work remains preserved.

Internal recovery/revisions, original day/timezone and account separation remain.
Shared Page/App-back/swipe/button engines are reused; Habit/Protocol, immutable
chapters/readings and no-AI-on-save remain intact. Physical phones/native
keyboards, hosted authentication, cloud/two-device sync, personal migration and
week-long lived acceptance remain unverified. Next: developer use/review of the
bounded Note flow, with migration/sync/publication separately reviewed.

## Note History controls (2026-11-03)

### Approval and setup

The developer approved the Note controls proposal with a final correction:
remove Undo and use the retained Trash page for restoration. Runtime scope:
`writing-pages.tsx`, scoped `os-app.css` and `tests/writing.browser.mjs`.
Owning/continuity records were approved too. The existing 254-file working tree,
including earlier untracked writing files, is preserved. Branch `paing-branch`,
HEAD `8890fb1`; nothing staged, committed or deployed. No personal/legacy import,
schema, store/provider, account/authentication or cloud-service change occurred.

The existing loopback Vite harness imports actual Today/Reflect, provider, Page,
stores and CSS. Checks use synthetic accounts, real IndexedDB, Bangkok time,
360x844/390x844 touch/mobile viewports and reduced/normal motion. External traffic
is blocked, and account cases assert no legacy transport/model calls. The legacy
placeholder baseline remains a qualified known defect outside this refinement.

### Final checks

- `node --test --test-reporter=tap tests/writing.browser.mjs`: **20/20**.
  Note exposes direct HISTORY, with no ellipsis/menu, Versions or Undo controls.
  Routine Saving/Saved on this device text is absent during a delayed save and
  after acceptance. Autosave, offline reload, empty corrections, composition,
  source/question retention, newer typing and account closure still pass.
- The same run verifies that the orange row bin moves only its own Note and
  leaves History open; another Note remains active. Trashed state survives
  reload, and restoration occurs through the Trash page. Restore retains IDs
  and internal revisions; Delete forever still asks for confirmation.
- A recovery row saves its exact stored snapshot before Trash. Simulated quota
  failure keeps both recovery buffers and leaves the row available; retrying
  its bin succeeds. A stale recovery cannot trash a newer accepted Note; current
  saved text stays active and the older text remains recoverable. Legacy sources
  remain read only. Thought/Deep Thought/Reflect answer Send behavior still passes.
- `node --test tests/writing-model.test.mjs tests/account-scope.test.mjs`:
  **35/35**. Models/stores are unchanged in this slice; this focused regression
  selection covers empty dated corrections, conflict preservation, revisions,
  lifecycle rules, account epochs and 06:00/DST attribution.
- `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx tests/writing.browser.mjs`:
  passed with no errors or warnings. No broader lint claim.
- Strict targeted types passed:
  `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx`.
- `node node_modules/vinext/dist/cli.js build` and
  `node node_modules/next/dist/bin/next build`: both passed.

### Alignment, focus and geometry

NOTE/HISTORY have identical measured text tops and bottoms at both widths
(0px difference), with matching Geist, 10px size, 700 weight, 17.2px line-height
and 1.3px letter spacing. Both header targets and row bins are at least 44x44px.
Navigation/bin color resolves to `rgb(227, 107, 55)`. Focused title/body fields
have no outline, border or shadow, remain the active text input and retain a
nontransparent caret. Real Tab/Shift+Tab keeps the bin's keyboard focus visible;
removing the writing box did not remove button focus.

| At 360px and 390px | Note | Thoughts | Habit | Protocol |
| --- | --- | --- | --- | --- |
| Resting Page | 344px | 344px | 344px | 344px |
| Frame with border | 346px | 346px | 346px | 346px |
| Header box to first content | 80px | 80px | 80px | 80px |
| Visible label text to first content | 84px | 84px | 83.09px | 83.09px |

Short writing retains the shared minimum; long writing and actual Habit/Protocol
rows grow without nested scrolling. No shared geometry/type/gap token changed.
Inspected ignored screenshots: `outputs/note-controls-write-390.png`,
`outputs/note-controls-history-390.png`, `outputs/note-controls-trash-390.png`
and `outputs/note-controls-history-360.png` (the latter intentionally shows
keyboard focus on one bin).

### Attempts and limits

The first 17-case run passed 15/17: wrapping header labels in spans moved Note's
visible gap to 81.81px while the header-box gap stayed 80px. Plain text in the
matching header buttons restored the original 84px visible gap; the targeted
geometry/header selection then passed 4/4. The first expanded run passed 19/20:
programmatic focus after touch did not trigger `:focus-visible`. The test now
uses actual Tab/Shift+Tab; its focused rerun passed 1/1, then the final full
20-case run passed. No product focus rule was weakened to pass that check.
No additional runtime performance change was justified.

Final record audit: `node outputs/note-controls-audit.mjs` passed 214 local
links, including 79 fragments across 12 records, and whitespace-format checks.
`git diff --check` passed with existing LF/CRLF warnings. The approval-baseline
audit found exactly 15 approved changed files, 239 byte-identical files and no
Git-visible additions/removals. Earlier uncommitted/untracked work is preserved;
the baseline, before-copies, screenshots and audit helper are ignored outputs.

Internal revisions remain for autosave/conflict safety, with no Note version
browser. The shared schema/provider/store, saved evidence, original dates and
chapter/reading content remain intact. No AI runs on save. Physical phones/native
keyboards, hosted auth, cross-device/cloud sync, personal migration and week-long
lived acceptance remain unverified. The earlier 46/184 selections below are
historical results, not reruns for this UI-only slice. Next: developer use/review
of the simpler Note flow, followed by separately reviewed migration/safe sync.

## Note autosave refinement (2026-11-03)

### Approved scope and setup

The developer approved Note-only autosave and the reference-based UI refinement,
tests and owning records after confirming pause/departure saving and retaining
Send elsewhere. Changes use `writing-pages.tsx`, scoped CSS, the account Note
connection and the existing writing model's empty-correction guard; no provider,
store/schema, personal migration, cloud service or authentication flow changed.
The pre-existing 254-file working tree and untracked writing work are preserved.
Branch `paing-branch`, HEAD `8890fb1`; nothing staged, committed or deployed.

The actual-component loopback Vite/Chromium harness uses synthetic accounts,
real IndexedDB, touch/mobile viewports 360x844 and 390x844, Bangkok time and both
reduced/normal motion. External traffic is blocked; account cases assert no
legacy transport/model calls. The separate legacy baseline retains its known
placeholder defect; this Note refinement does not claim to migrate/fix that path.

### Final checks

- `node --test --test-reporter=tap tests/writing.browser.mjs`: **17/17**.
  Autosave works after a pause, after offline reload/recovery, on leaving the
  editor, pagehide and Today-route departure. Composition defers publication;
  mixed Burmese/English is retained. Focus does not create writing. The writer
  has no manual Save/draft/Clear/Discard controls or draft messages. Orange
  controls resolve to `rgb(227, 107, 55)` with at least 44x44px header targets.
- The same run checks direct History editing, Today/day groups and entry times,
  New Note separation, immutable Versions, Trash/Undo/Restore and confirmed
  deletion. Selecting/deleting all title/body text saves an empty current version
  that survives reload while the original stays in Versions. Erasing a new
  composer before autosave creates no empty History entry. Two older recovery
  copies remain reachable and save once without a Drafts screen. Failed local
  commits keep text and retry once; delayed saves retain newer typing and save
  it subsequently. Another tab's saved correction requires explicit review.
  Account switching cannot move autosave/recovery to the next account.
- Existing Thought, Deep Thought, normal-motion send and actual Reflect-answer
  cases pass in the same UI run, preserving Send, source/question/edition links,
  local acceptance before departure and no automatic Athena reply.
- `node --test --test-reporter=tap tests/writing-provider.browser.mjs tests/writing-storage.browser.mjs tests/account-storage.browser.mjs`:
  **46/46** (16 provider, 19 storage, 11 account storage). These are a separate
  selection, not extra UI scenarios. It checks actual transactions, rollback,
  retry, cross-tab refresh, account epochs, no stale resurrection and attribution.
- `node --test tests/writing-compatibility.test.mjs tests/writing-model.test.mjs tests/account-scope.test.mjs tests/circle-os-model.test.mjs tests/athena-memory.test.mjs tests/vision-declaration.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs`:
  **184/184**. A new model case checks empty existing-Note versions and unchanged
  retries while keeping empty new Notes/Thoughts/answers invalid. Earlier model
  checks retain the 06:00/DST/timezone and immutable reading/chapter boundaries.
- Focused strict types passed:
  `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx`.
- Selected lint:
  `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx app/os/writing-model.js app/os/circle-os-shell.tsx tests/writing-model.test.mjs tests/writing.browser.mjs`.
  No errors; the shell's existing unused-import warning is tracked separately
  from the clean component/model/test selection. No full-repository lint claim.
- `node node_modules/vinext/dist/cli.js build` and
  `node node_modules/next/dist/bin/next build`: both passed.

### Geometry and visual verification

| At both 360px and 390px | Note | Thoughts | Habit | Protocol |
| --- | --- | --- | --- | --- |
| Resting Page | 344px | 344px | 344px | 344px |
| Frame with border | 346px | 346px | 346px | 346px |
| Header box to first content | 80px | 80px | 80px | 80px |
| Visible label text to first content | 84px | 84px | 83.09px | 83.09px |

Short Notes retain the shared minimum. Long writing and real Habit/Protocol
rows grow downward without nested scrolling. The final real-row sample measured
Habit at 615.06px and Protocol at 978.27px; transition timing gives different
intermediate growth samples across runs, so these are observed bounds rather
than a new sizing rule. No shared geometry/type/gap token was changed. Note body
text is 18px; headings retain the shared type. Inspected ignored artifacts:
`outputs/note-autosave-write-390.png`, `outputs/note-autosave-history-390.png`,
`outputs/note-autosave-trash-390.png` and the existing geometry screenshot.

### Attempts, boundaries and next action

Baseline model selection passed 26/26 before editing. The first UI run passed
14/15: initial navigation to the unchanged legacy fixture exceeded 30 seconds
during dependency optimization. The fixture now waits for DOM content with a
60-second startup allowance. The next full run passed 15/15. After status/spacing
refinements and two recovery/empty-composer cases, the final full run passed
17/17. Initial unused purity suppressions were removed before final clean lint.
No additional runtime performance change was justified.

Final record audit: `node outputs/note-refinement-audit.mjs` passed all 206
local links, including 71 heading fragments across 12 records, plus whitespace
format checks. `git diff --check` passed with the existing LF/CRLF warnings.
The 254-file approval baseline comparison found exactly 18 approved changed
paths, 236 byte-identical paths and no additions/removals among Git-visible
files. The Chromium GPU `debug.log` created during the browser run was moved
to ignored `outputs/note-refinement-chromium-debug.log`; no pre-existing file
was removed. The audit helper and baseline are also ignored outputs.

The Note UI removes draft management, while internal legacy-named recovery IDs
and the schema remain. Recovery rows are not accepted evidence until saved;
no recovery text was silently discarded. Browser/account closure may stop a
final flush, so only accepted local writes are claimed and durable recovery is
used on return. The ledger remains outside CircleState, its outbox and legacy
payloads. Saving makes no model call and changes no received edition/chapter.

Physical phones/native keyboards, hosted auth, cross-device/cloud sync, personal
legacy import, complete remote/backup deletion and week-long lived acceptance
remain unverified. Local synthetic success does not certify beta readiness.
Next: developer use/review, then separately review personal migration/safe sync.

## Account writing UI (2026-11-02)

### Scope and setup

The developer explicitly approved C: `writing-pages.tsx`, `writing.browser.mjs`,
shell/Reflect/CSS, Page standard, bug record and nine owning/evidence records.
Older writing remains read only pending separately reviewed migration. Branch
`paing-branch`, HEAD `8890fb1`; pre-existing A/B1/B2 work was preserved. No real
owner data, mapping/import, remote account/service or deployment was changed.

The isolated loopback Vite harness imports actual Today/Reflect, provider,
stores, Page and CSS modules. It uses synthetic accounts, real IndexedDB,
Bangkok timezone, touch viewports 360x844 and 390x844 with a proper mobile
viewport, and reduced/normal motion. External traffic is blocked. A legacy-only
fixture intercepts its loopback profile transport; account tests assert no
legacy transport calls. No production test route or authentication bypass was
added. This does not certify hosted Supabase sign-in or a physical keyboard.

### Results

- `node --test tests/writing.browser.mjs`: 13/13. Focus alone creates no writing;
  Note recovers after reload, saves offline, stays saved and offers New Note.
  Corrections preserve immutable versions. History, version reading, Trash,
  Undo, Restore and confirmed Delete forever use the actual controls.
- The same run checks normal Thoughts, Deep Thought source retention, the real
  Reflect reading reply and edition link; failed commits retain the buffer;
  cross-tab corrections require review; A/B/A returns only that account's draft;
  newer typing survives delayed Save; normal-motion text waits for durable
  acceptance before departure. Draft discard preserves the saved entry. Clear
  keeps an empty draft unsaved; a body-only correction records an empty title
  as a new version, rather than removing the field or restoring older text.
- `node --test tests/writing-provider.browser.mjs tests/writing-storage.browser.mjs tests/account-storage.browser.mjs`:
  46/46 (16 provider, 19 writing storage, 11 account storage).
- `node --test tests/writing-compatibility.test.mjs tests/writing-model.test.mjs tests/account-scope.test.mjs tests/circle-os-model.test.mjs tests/athena-memory.test.mjs tests/vision-declaration.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs`:
  183/183. These are a separate model selection, not extra UI scenarios.
- ESLint API selection: `app/os/writing-pages.tsx`, `app/os/circle-os-shell.tsx`,
  `app/os/mirror/page.tsx`, `tests/writing.browser.mjs`. No errors; one existing
  shell unused-import warning (`renderChapterTemplate`). No full-repository
  lint claim. Two local purity suppressions document event-only active-writing
  clock reads followed through button callbacks by the React compiler.
- Focused types: `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx` passed.
- `node node_modules/vinext/dist/cli.js build` and
  `node node_modules/next/dist/bin/next build` passed. NVM rejected the npm
  entrypoint as untrusted; no trust setting was changed. The repository-local
  framework CLIs were used for these builds.

### Geometry and visual check

| At both 360px and 390px | Note | Thoughts | Habit | Protocol |
| --- | --- | --- | --- | --- |
| Empty Page height | 344px | 344px | 344px | 344px |
| Frame including border | 346px | 346px | 346px | 346px |
| Header box to first content | 80px | 80px | 80px | 80px |
| Visible label text to first content | 84px | 84px | 83.09px | 83.09px |

Short Note equality, long writing growth, and real Habit/Protocol row growth
were measured without nested scrolling. An inspected generated screenshot is
`outputs/writing-ui-390.png` (ignored artifact, not a committed design asset).
Header actions keep 44px targets outside label flow. No token or shared layout
engine was changed. The earlier 420px measurements came from a fixture missing
the viewport meta tag and were superseded by the mobile measurements above.

### Attempts and remaining boundaries

Final review: the 252-file pre-C SHA-256 baseline found exactly 14 approved
existing paths changed, two new UI/test files, 238 unchanged files and no
removals. Prior engine/provider/adapter source and tests are unchanged by C.
The two new files are untracked alongside five pre-existing untracked files;
nothing was staged. All 187 local links, including 62 heading fragments, passed
across the 11 approved Markdown records. `git diff --check` passed with the
existing LF/CRLF warnings. This audit includes the final evidence text.

Fixture fixes: the registry is an array, session selectors use the actual
container, artificial Habit completion has archived setup markers for an empty
measurement, and legacy requests are intercepted at loopback. A slow concurrent
run hit a navigation timeout; final checks run against the corrected fixture.
An empty-save test exposed an overly permissive UI guard; Save now matches the
approved rule that completely empty writing cannot be saved. Legacy's original
placeholder bug remains reproducible and is not called fixed by the account UI.

No private writing was imported; no cloud acknowledgement, server merge,
cross-device/native-phone behavior, complete old-writing migration, broader
deletion coverage or week-long lived acceptance is claimed. Other-tool histories
and sign-in polish remain separately reviewed work.

## Account-bound writing provider (2026-11-02)

### Approved scope and setup

The developer explicitly approved the reviewed B2 scope and later said to
continue. New `app/os/writing-provider.tsx` and `tests/writing-provider.browser.mjs`;
updates to writing store/model/types, compatibility model/types, shell, Deep
Thought/first-use models/types, Reflect and five affected tests; nine approved
plan/product/architecture/continuity/evidence records. Branch `paing-branch`,
HEAD `8890fb1`. Ten tracked modifications and three untracked B1 files were
present initially and are preserved. No personal data, owner mapping/import,
environment, external profile server, remote account/service or deployment changed.

Baseline before edits: the existing 177-case focused selection and 29 storage-
browser cases passed. Other overlapping read-only selections passed 93/93 and
83/83; these are not additional unique coverage. New browser tests use ephemeral
loopback Vite pages importing the actual provider/store, real isolated IndexedDB,
synthetic accounts, mobile touch at 390x844/360x844, Bangkok timezone and blocked
external requests. They add no production test route/auth bypass and use no
owner browser, private writing, hosted account or AI provider.

### Behavior checked

- Account epochs, delayed IndexedDB opens, hashing and captured callbacks:
  closed A/B/A or logout work cannot populate another session. Older hashes
  cannot replace new inputs or a newer committed entry in the same account.
- Actual commits/reloads, draft recovery, saved corrections and earlier Versions:
  views come from current storage. Retrying an old successful Save after deletion
  returns its receipt without restoring an entry/history/evidence.
- Two tabs with BroadcastChannel and with storage-event fallback: notifications
  refresh saved views; competing corrections retain accepted and candidate text.
  An older in-flight action cannot replace the latest action status/newer typing.
  Cross-tab old-answer snapshots stay fresh across later writing notifications.
- Failed local reads/writes, recovery and stable-operation retry: failed saves
  preserve drafts; committed saves with failed refresh remain saved alongside a
  separate read error. Notification failures cannot undo accepted writes.
- Permanent local deletion: only question/use metadata survives; answer/version/
  draft text is removed. Metadata survives actual store reload, keeps questions
  answered and skips first-use greetings. Missing older metadata stays unknown.
- Exact current writing dependencies gate derived context. Mixed/unknown/stale/
  forgotten sources are withheld; duplicate observation IDs cannot borrow another
  item's valid dependencies. Independent unscoped day/tool context retains its
  existing path. Received prose/editions are copied separately and unchanged.
- The actual CircleStateProvider mounts the writing provider for accounts and
  opens no writing ledger for legacy mode. Ledger writing/drafts do not enter
  CircleState/profile answers, its outbox or `buildServerPayload`; saves do not
  mutate stored Athena memory or make an external model/backend request.

### Commands, results and attempts

| Check | Result |
| --- | --- |
| `node --test tests/writing-compatibility.test.mjs tests/writing-model.test.mjs tests/account-scope.test.mjs tests/circle-os-model.test.mjs tests/athena-memory.test.mjs tests/vision-declaration.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs` | 183/183 passed on the final model/type input changes; six added behavioral cases over the 177-case baseline. |
| `node --test --test-reporter=tap tests/writing-provider.browser.mjs tests/writing-storage.browser.mjs tests/account-storage.browser.mjs` | 46/46 passed on the final source: 16 provider, 19 writing-storage and 11 account-storage cases; final reported duration about 50.8 seconds. |
| `node node_modules/eslint/bin/eslint.js app/os/writing-provider.tsx app/os/writing-store.ts app/os/writing-model.js app/os/writing-model.d.ts app/os/writing-compatibility-model.js app/os/writing-compatibility-model.d.ts app/os/deep-thought-model.js app/os/deep-thought-model.d.ts app/os/first-use.js app/os/first-use.d.ts tests/writing-provider.browser.mjs tests/writing-storage.browser.mjs tests/writing-model.test.mjs tests/writing-compatibility.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs` | Passed on the final source. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-provider.tsx` | Passed targeted strict provider/contracts typing. Imported JavaScript is included for inference, not strict `checkJs` certification. |
| `node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx app/os/mirror/page.tsx --format json` | Shell retains nine errors/one warning, with the same rule/severity sequence as `git show HEAD:app/os/circle-os-shell.tsx` through ESLint stdin; Reflect has zero diagnostics. This is not a full-lint pass. |
| `node node_modules/next/dist/bin/next build` | Passed after the raw-memory input-type correction, including TypeScript and static generation. |
| `node node_modules/vinext/dist/cli.js build` | Passed after the Next pass. Existing unknown-route classification notice and plugin timing warnings remain. |

Initial focused run had one failure in an existing source-call assertion after
adding the explicit read-view argument; its expectation was updated. The next
78-case selection passed. Initial new-provider browser run passed 11/13: both
Versions reads occurred before React published the refreshed view and received
the intended refreshing error. The harness now waits for the observable ready
state. Expanded runs passed 45/45, then 46/46 after a competing-action check.

Initial targeted TypeScript without JavaScript inference could not find a
declaration for the existing `circle-os-model.js`; including JS for inference
resolved that targeted setup. Initial new-provider lint found a render-time ref
read and two dependency warnings; these were removed. The first Next build then
found that existing raw-memory arrays can contain incomplete records while the
input type required an ID. The input now honestly permits raw records; runtime
selection still rejects missing IDs/dependencies. The next Next build passed.
Patch context failures applied no files before corrected patches. Verbose lint
JSON exceeded output limits; reduced summaries confirmed
the same baseline shell counts/rules. No runtime fix was hidden by test retries.

The nine-record read-only link/format audit passed 175 local links including
51 heading fragments. `git diff --check` passed with existing LF/CRLF warnings.
The 250-file startup SHA-256 comparison found exactly 25 approved existing-file
changes and two approved additions, 225 unchanged and no removals. Normalized
suffix hashes preserve the complete earlier task/handoff/journey histories;
pre-existing memory-model/test files retain their startup bytes. No staging,
commit, push or deployment occurred.

### Limits and next action

This proves the local provider/read-view slice, not the future product editors,
history/Trash controls, week-long writing journey or sign-in polish. Existing
Note placeholder/blur and premature Sent paths remain unchanged. Actual Reflect
route/swipe fixtures remain a separate unresolved gap; this provider harness
checks its shared memory input, not the whole Reflect gesture journey.

No geometry/type/gap tokens, budget, immutable chapter or received edition changed;
no new geometry measurement or justified performance optimization is claimed.
Existing account/clearing, local atomicity and 06:00/DST regressions passed.
If both cross-tab notification channels fail, refresh waits for foreground;
old whole-state concurrency is unchanged. Full lint/broad suite/repository-wide
TypeScript, real phones/other browsers, hosted auth/session/device, real import,
Supabase evidence sync, backup/complete deletion and AI quality remain unverified.
Phase 1/beta readiness is not certified. Next: C's exact UI/routing/file/check
review and manual approval; personal migration/cloud/deployment remain separate.

---

## Writing compatibility and evidence adapter (2026-11-02)

### Approved scope and setup

Developer-approved scope: new `app/os/writing-compatibility-model.js`, its type
declaration and `tests/writing-compatibility.test.mjs`; existing memory model and
memory tests; eight plan/product/continuity/evidence records. Branch
`paing-branch`, starting HEAD `8890fb1`; initial working tree clean. No real
profiles/day records, environment files, external vault, remote service,
account mapping/import, provider/UI activation or deployment changed.

Read-only baseline before edits: 127 selected model/account/memory/declaration
checks, 19 Deep Thought/first-use checks and 29 isolated storage-browser checks
passed. Extra synthetic probes reproduced stale fact capture after a legacy
answer correction, forgotten-fact resurrection on merge, incomplete composite
invalidation and discarded source-version metadata. Those legacy live paths
are not declared fixed merely because the new unmounted gate handles them.

### Behavior verified

The adapter takes explicitly same-owner snapshots; a legacy snapshot is not
assigned to a login. It reads without changing inputs, writing storage or
calling a model. Existing Note title/body form one source with preserved IDs,
exact text and per-field provenance. Start/day/timezone remain null when
unknown. Canonical field edit time is labelled separately; ambiguous timestamp
text remains original metadata. Repeated reads are stable; a correction changes
a comparison fingerprint without inventing lost authored versions. Distinct
entries with the same words stay distinct. Competing same-ID answers fail.

Explicit supplied links rehearse deduplication only. Unknown/cross-owner,
many-to-one, split-Note and cross-kind mappings fail. An old snapshot cannot
become fallback evidence after a mapped source is trashed/deleted. No mapping
is generated or persisted and no actual import/backup/rollback is verified.

Current saved active versions supply writing evidence; drafts and older saved
versions do not. Exact Burmese, English and mixed text survives without an
English-regex eligibility gate. Question sources remain intact; missing old
edition links are not invented. Trash keeps Deep Thought question metadata but
not answer text in the read view. Restore retains the same source/version.
Permanent-deletion question/first-use metadata still needs review before live use.

Every writing-derived ledger/taste/rhythm/portrait/curiosity item needs current
owner/namespace/type/ID/version dependencies. A missing, malformed, unversioned,
stale, trashed, deleted, forgotten or suppressed dependency withholds the whole
item. Scoped references survive merges, including distinct versions and invalid
markers; subtracting a citation does not revalidate a composite's wording.
Existing suppression/forget corrections still block a stale merged item.
Received prose/editions are copied separately without mutation or publication.
An old successful Save receipt cannot reconstruct an entry deleted in current state.

### Commands, attempts and actual results

| Check | Final result |
| --- | --- |
| `node --test tests/writing-compatibility.test.mjs tests/writing-model.test.mjs tests/account-scope.test.mjs tests/circle-os-model.test.mjs tests/athena-memory.test.mjs tests/vision-declaration.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs` | 177/177 passed, including 29 new adapter cases and two added memory cases. |
| `node --test --test-reporter=tap tests/writing-storage.browser.mjs tests/account-storage.browser.mjs` | 29/29 passed using the existing isolated harnesses at 390x844/360x844. |
| `node node_modules/eslint/bin/eslint.js app/os/writing-compatibility-model.js app/os/writing-compatibility-model.d.ts app/os/athena-memory-model.js tests/writing-compatibility.test.mjs tests/athena-memory.test.mjs` | Passed after the fixes. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler app/os/writing-compatibility-model.d.ts app/os/writing-store.ts` | Passed. This checks the declarations/store, not strict static typing of all JavaScript implementation. |
| Strict in-memory TypeScript consumer via `node --input-type=module` | Passed. Compiler-host virtual source exercises adapter inputs/outputs, required source version and readonly views; no file is written. |
| `node node_modules/next/dist/bin/next build` | Passed, including Next's TypeScript/static generation. |
| `node node_modules/vinext/dist/cli.js build` | Passed; existing unknown-route classification notice remains. |

The initial adapter/memory run passed 50/50. Review then added three checks:
`node --test --test-name-pattern='forgetting one versioned|malformed dependency|different writing kind' tests/writing-compatibility.test.mjs`
failed 3/3. One forgotten dependency left a composite active; malformed metadata
disappeared on merge; a link could hide a Note behind a Thought. Fixed by
withholding affected versioned items, retaining an invalid scoped dependency
marker and checking target kind. The full final selection passed 177/177 after
those changes; lint and both builds also ran after them. Counts from overlapping
runs are not added as unique coverage.

An additional ad-hoc `node --input-type=module` Vite/Playwright smoke passed at
both phone widths. It imports the actual account-scope, model/store and adapter
into an ephemeral loopback-only page; contexts have Bangkok time, mobile touch,
isolated synthetic accounts and all external requests blocked. Steps: save a
Burmese/English Deep Thought through real IndexedDB; read an unknown-date existing
answer; supply a link and verify one current source; select version-linked
memory; Trash and check no evidence/one answered question; Restore; Trash/delete;
retry the old Save and reload. Text, source counts, exclusions, reading bytes and
deleted state were asserted with no page errors. This is two direct module/store
browser checks, not a persistent new browser fixture or a product UI journey.

An initial baseline capture included too much history text and exceeded output
limits; a hash/length-only retry captured 247 Git-visible files without edits.
Two documentation patches failed context validation and applied no changes;
corrected patches succeeded. No code optimization was justified by a measurement.

The final eight-document audit passed 155 local links, including 38 heading
fragments, plus conflict-marker/fence/format checks. `git diff --check` passed
with existing LF/CRLF warnings. The 247-file startup hash comparison found
exactly ten approved existing paths changed and the three approved new files;
237 existing files stayed unchanged, with no removals. Normalized history hashes
preserved all earlier task/handoff/journey text and reconstructed the earlier
Decision Log exactly after removing only this pass's new entry. No staging or
commit occurred.

### Limits and next action

The adapter is unmounted. It requires fresh owned snapshots and is not an auth
boundary, account-epoch guard, live subscription, importer, cloud outbox or
complete Athena evidence selector for other domains. The later provider must
rebuild it after writes/cross-tab changes, reject old-session results and render
current state rather than old receipts. Existing editors/transport still use
their original paths. The stored ledger/schema and personal data were untouched.

No geometry, type/gap token, budget, chapter or authored-edition content changed;
no geometry measurements are claimed. Existing local-first/account/06:00/DST
regressions passed. Provider/editor/history journeys, physical phones/other
browsers, hosted refresh/revocation/devices, real import/sync/backup/deletion and
AI language quality remain unverified. Existing placeholder/Sent and Reflect
fixture/swipe gaps remain; Phase 1 is not certified. No full lint/broad suite or
standalone repository TypeScript result is claimed beyond the checks above.
Next is an exact account-bound provider proposal, followed by separate UI review.

---

## Local writing engine (2026-11-02)

Approved scope: five new local-engine/type/store/test files, plus personal-records
plan, current task, handoff and this evidence record. Branch `paing-branch`,
HEAD `f08c117`; the four existing modified documentation paths are preserved.
No live UI/provider/legacy transport, personal records, environment, database
service or remote setting was edited. Nothing staged, committed or deployed.

### Setup and actual coverage

`tests/writing-storage.browser.mjs` starts a test-only Vite harness on an
ephemeral loopback port, importing the actual model/store/account-scope modules.
Chromium contexts use Bangkok time, mobile touch and 390x844 or 360x844 viewports.
Each context has isolated synthetic browser storage; external requests are
blocked. There is no production test route, account bypass or new app control.
The browser cases exercise IndexedDB directly through the actual public store
API. These are local-storage integration checks, not the future writing UI.

At both widths, the browser checks recover a draft after reload, exclude it from
saved history/evidence, save it as Untitled, retry the same request after a
simulated lost response/reload, correct it with the earlier version retained,
and keep two Notes/day. Offline operations run while the harness is already
loaded; reconnection followed by reload retains both a saved Note and a draft.
There is no claim of offline app-shell loading/reloading from this test harness.
Trash hides entries and their edit drafts; Restore preserves identity/versions/
drafts; confirmed deletion and stale-retry rejection survive reload.

Further browser cases establish request-success before transaction completion
before promise resolution; abort after put success rolls back content and its
receipt together. Injected `QuotaExceededError` on an actual transaction's put
leaves the prior draft/version intact, rejects the operation and allows the
same Save to retry once. Unavailable IndexedDB rejects reads/writes; unknown
schema bytes remain unchanged rather than being reset. Separate draft-update
failure rejects instead of claiming the newer editor text is recoverable.
These are synthetic injected failures, not a device filled to its physical limit.

Account cases preserve a legacy localStorage sentinel, keep A/B records separate,
reject owner-mismatched requests, and reject delayed reads or writes across
hashing/session change and live transaction abort. Two actual tabs preserve
unrelated entries and competing corrections: one accepted version and one
recoverable candidate, with no duplicate recovery copy. A real Save/draft-update
race retains newer typing. A 05:50 start/06:10 save retains the starting Circle day,
timezone, actual save time and unknown occurrence time after browser reload.
Final browser contexts recorded no uncaught page errors.

Model cases additionally check unchanged-save suppression, tag normalization,
immutable original source/question/edition links, clone-isolated read views,
discard/stale-discard handling, both Save/draft-update commit orders, explicit
conflict resolution, immutable earlier versions, deliberate backdating and
travel, both New York DST transitions, canonical timestamp/named-timezone
validation and content-free deletion metadata. A's evidence selector excludes
drafts/Trash/deletion; existing Athena/legacy-source integration remains B work.

### Commands and results

| Command | Final result |
| --- | --- |
| `node --test tests/writing-model.test.mjs tests/account-scope.test.mjs` | 33/33 passed: 25 new model cases and eight existing account-scope cases. |
| `node --test --test-reporter=tap tests/writing-storage.browser.mjs` | 18/18 passed; final reported suite duration about 8.4 seconds, including setup. |
| `node node_modules/eslint/bin/eslint.js app/os/writing-model.js app/os/writing-model.d.ts app/os/writing-store.ts tests/writing-model.test.mjs tests/writing-storage.browser.mjs` | Passed on the final five files. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler app/os/writing-store.ts` | Passed; checks the new store and imported type contracts without repository build/cache output. |

Baseline before edits: `node --test tests/account-scope.test.mjs` passed 8/8.
Initial implementation passed 31/31 model/account cases and 15/15 storage cases.
Review then added three focused edge assertions. The command
`node --test --test-name-pattern='conflicting saved correction|timestamps require|Trash hides' tests/writing-model.test.mjs`
failed 3/3: conflict recovery duplicated an already durable candidate, timestamp
validation accepted ambiguous dates, and ordinary draft recovery included
trashed entries. The fixes reused an existing identical candidate, required
canonical UTC/named timezone input, and hid associated drafts until Restore.
After these fixes the full model/account run passed 33/33 and storage passed
15/15. The three final additional storage cases cover the actual Save/update
race, failed draft update and browser timestamp round-trip; the final complete
storage run passed 18/18 and focused lint passed again. Earlier attempts are
not added together as separate unique coverage.

Documentation review passed 88 local links including 29 heading fragments across
the plan, current task, handoff, this record and the preserved decision log.
Whitespace/tables/fences/conflict-marker checks and `git diff --check` passed
with existing LF/CRLF warnings. A 242-file startup hash baseline found only the
four approved record changes, 238 unchanged files and five approved new files,
with no removals. Hash checks preserved each startup historical tail after
newline normalization and the decision log byte-for-byte. New-file formatting
checks also passed. These are document/scope checks, not further runtime tests.

### Limits, invariants and next action

This is the new local engine, not a connected multi-entry editor or general
history UI. Actual New Note/Save/Send/Versions/Undo/confirmation placement,
failure/recovery wording, focus, accessibility and idle/swipe integration still
need B/C implementation and app/browser verification. The existing Note
placeholder fallback and premature Sent source concerns are unchanged.
No full app build, broad suite/lint, repository TypeScript, chapter check,
physical phone/other browser, hosted auth/revocation, Supabase evidence sync,
backup/restore or personal import ran for A. Earlier Reflect fixture/swipe and
tooling gaps remain. Local deletion does not certify remote/derived/log/backup
deletion. Phase 1 is not certified.

The engine reused scoped transactions and verified local atomicity, retry,
account separation, no stale resurrection and local 06:00/DST behavior. No App
Box geometry/type/gap, published chapter/reading, cadence/budget or personal state
changed. No new geometry measurement is claimed. No performance optimization
was justified; the whole-ledger layout is not a measured large-history/startup
budget. Future capacity/retention work must preserve saved versions, drafts,
receipts and deletion protection until a reviewed replacement exists.

Next: review the compatibility/evidence contract and precise B file/check scope
before code, including legacy ownership/unknown dates and invalid derived
context. UI, real import, SQL/cloud work and deployment remain separately reviewed.

---

## Hosted Supabase connection - 2026-10-31

Developer follow-up: after guided Gmail SMTP/template setup, the developer
reported successful sign-in to Circle OS. This is user-reported evidence only;
the agent did not observe the complete journey or inspect final SMTP/templates.
The developer subsequently reported that password reset and logout also work;
these are user-reported results, not agent-observed journeys. Sign-in UI/UX
changes are deferred.

Basic offline return passed in developer testing at the local app address:
Wi-Fi was turned off and the page reloaded; an existing note remained. The
developer edited while offline, reconnected, and confirmed the notes remained.
A further online reload retained those edits. This is user-reported evidence of
local persistence across reload and reconnection. Device/browser details and
network traces were not supplied, and the agent did not observe the journey.
It does not verify Supabase evidence sync (not implemented), cloud backup,
cross-device access or remote session revocation. Refresh/revocation and
cross-device cases remain unverified.

Approved setup scope: project/login configuration, synthetic verification and
evidence. Developer created the project and supplied public connection details.
Ignored `.env.local` selects Supabase mode with its URL and publishable key.
No personal data migration or remote setting change occurred.

Read-only PowerShell `Invoke-RestMethod` requests checked `/auth/v1/settings`
with the public key and `/auth/v1/.well-known/jwks.json`. The initial sandboxed
network attempt failed; an approved retry succeeded. Observed email auth enabled,
`mailer_autoconfirm=false`, `disable_signup=false`, and an EC/ES256 signing key.
Thus confirmation was required, but public signup initially needed disabling.
After the developer changed settings, a read-only settings recheck returned
`external.email=true`, `disable_signup=true`, and `mailer_autoconfirm=false`.
Public signup is now disabled and confirmation remains required. The sandboxed
attempt failed; the approved network retry succeeded. This checks public settings,
not email delivery or a complete hosted account journey.

`node --test tests/supabase-auth.test.mjs`: 10/10 passed. These are focused
synthetic auth tests, not hosted user journeys. No new build/browser verification.
Browser automation stopped because it could not verify Opera's URL. SMTP,
origin/redirects, templates, invitation/password setup, actual login/refresh,
recovery, logout/revocation and offline return remain unverified. Restart the
development server and fully reload after the environment change.

---

## Development onboarding test mode - 2026-10-31

Approved scope: development-only `test` auth mode, isolated synthetic state,
fresh-session action, persistence on reload, production rejection, tests, and
implementation records. This extends the uncommitted login implementation;
HEAD remains `e3dcb3e`. `.env.local`, the existing owner and remote services
were not changed. All browser records below are synthetic, isolated and local.

`tests/development-test-mode.browser.mjs` seeds distinct legacy/account/auth
sentinels and a real-account selection marker before opening the actual app.
At 390x844 and 360x844 it checks Day One without login/name/age, saves priority,
reloads into direction on the same test owner, starts a new empty test, and
checks that the first run and all real/legacy/auth sentinels remain. The control
works above the onboarding splash. External requests are blocked and counted;
final cases made none. No final page errors occurred. Production case checks
the locked configuration screen, absent test controls/reader, and absent test
marker. Browser timezone is Bangkok.

Final commands and results:

- With `NEXT_PUBLIC_CIRCLE_AUTH_MODE=test` and `TZ=Asia/Bangkok`, start
  `node node_modules/vinext/dist/cli.js dev --hostname 127.0.0.1 --port 3222`.
  Build Next with `NEXT_PUBLIC_CIRCLE_AUTH_MODE=test` using
  `node node_modules/next/dist/bin/next build`, then start it on `127.0.0.1:3218`.
  Set `CIRCLE_PRODUCTION_TEST_MODE_ORIGIN=http://127.0.0.1:3218` and run
  `node --test --test-reporter=tap tests/development-test-mode.browser.mjs`:
  **3/3 passed**, including actual production rejection.
- Start Next development on `127.0.0.1:3223` with the same test flag. With
  `CIRCLE_TEST_ORIGIN=http://127.0.0.1:3223`, run the same file: **2/2 development
  cases passed**; the optional production case was skipped in that run.
- The preceding focused command with the same twelve test files now passes
  **103/103**, adding two namespace/production-guard cases to account-scope tests.
- `node --test --test-reporter=tap tests/account-storage.browser.mjs`:
  **11/11 passed**. `node --test --test-reporter=tap tests/supabase-auth.browser.mjs`:
  **10/10 harness cases passed**, with two optional Supabase production cases
  skipped because the production server in this slice used `test` configuration.
- `node node_modules/eslint/bin/eslint.js app/os/account-scope.js app/os/account-scope.d.ts app/os/auth tests/account-scope.test.mjs tests/development-test-mode.browser.mjs`:
  passed. Vercel TypeScript passed. Next and Vinext production builds passed
  with the test flag; default legacy build artifacts were restored afterward.
- Read-only document audit: **36 local links/fragments passed**.
  `git diff --check` passed with existing LF/CRLF notices.

Initial attempts: Vinext with its default localhost binding was not reachable
at the test's IPv4 address; startup also emitted declaration-file scan warnings.
Using the explicit IPv4 host opened the server. Initial optimizer reloads then
reported invalid-hook/multiple-renderer messages; a clean restart after dependency
optimization passed both cases with no source/framework configuration change.
The test initially read state before the provider's first save and seeded the
Next dev tools' sandboxed frames. It now waits for persisted state and seeds
only its own origin. Those failed attempts are not counted as verification.

No shared App Box geometry, chapter versions, budget, Athena, merge/clearing or
06:00-day rule changed. No new geometry measurements or broad optimization are
claimed. Hosted auth/SMTP, physical phones, prior Reflect failures, broad
lint/suite and dependency-audit gaps remain as recorded above/below. Test mode
never authorizes a server request or claims legacy data for a new account.

---

## Supabase account entry - 2026-10-31

### Scope and isolation

Approved browser login slice: invitations only, confirmed email, password entry
and recovery, alias, persistent sessions, offline local use, and logout. No real
account, owner profile/day records, provider, or hosted Supabase project was
accessed. The existing `.vscode/settings.json` was preserved. Branch
`paing-branch`, starting HEAD `e3dcb3e`; application changes remain uncommitted.

`tests/supabase-auth.browser.mjs` bundles a static harness importing the real
auth boundary, official SDK, provider, and local stores. Its isolated Auth fixture
signs ES256 JWTs and intercepts token, user, verification, recovery, logout, and
JWKS requests at a synthetic origin. All other external traffic is blocked.
The two production cases use the actual Next app at `127.0.0.1:3218`. Chromium
viewports are 390x844 and 360x844 with Bangkok timezone. The actual service worker
and `context.setOffline(true)` verify cached navigation/code, rather than merely
mocking an online flag. Generated harnesses/screenshots stay under ignored `work/`.

### Final checks

- `node --test tests/account-scope.test.mjs tests/day-one.test.mjs tests/day-one-simplification.test.mjs tests/phases.test.mjs tests/chapter-engine.test.mjs tests/day-door.test.mjs tests/protocol-home.test.mjs tests/first-use-setup.test.mjs tests/habit-identity.test.mjs tests/chapter-capabilities.test.mjs tests/chapter-splash.test.mjs tests/supabase-auth.test.mjs`: **101/101 passed**.
- Build Next with `NEXT_PUBLIC_CIRCLE_AUTH_MODE=supabase`,
  `NEXT_PUBLIC_SUPABASE_URL=https://circle-auth.test`, and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=synthetic-publishable-key`, using
  `node node_modules/next/dist/bin/next build`. Start with
  `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3218`.
  With `CIRCLE_AUTH_PRODUCTION_ORIGIN=http://127.0.0.1:3218`, run
  `node --test --test-reporter=tap tests/supabase-auth.browser.mjs`:
  **12/12 passed, none skipped** on final application code.
- `node --test --test-reporter=tap tests/account-storage.browser.mjs`:
  **11/11 passed**. Earlier storage invariants remain covered.
- Rebuilt Next in default legacy mode, started the same production server,
  then ran `node --test --test-reporter=tap tests/day-one.browser.mjs` with
  `TZ=Asia/Bangkok`: **9/9 passed**. Existing Day One, old-version resume,
  publication/Quest paths, and Protocol/Week setup remain covered.
- `node node_modules/next/dist/bin/next build` passed in Supabase and default
  legacy modes, including the Vercel TypeScript configuration.
- `node node_modules/vinext/dist/cli.js build`: passed; existing route
  classification limitations remain. No server configuration was published.
- `node node_modules/eslint/bin/eslint.js app/os/auth app/os/pwa-register.tsx public/os-sw.js tests/supabase-auth.test.mjs tests/supabase-auth.browser.mjs app/os/layout.tsx app/os/mirror/page.tsx`: passed.
- Shell ESLint JSON diagnostics were compared against `git show HEAD:app/os/circle-os-shell.tsx`
  using `--stdin --stdin-filename app/os/circle-os-shell.tsx`. Both retain
  six memoization, two purity, and one immutability errors, plus one unused-import
  warning. The changed condition adds no diagnostic; full lint is not clean.
- A read-only Node audit checked 34 local document links/fragments: passed.
  `git diff --check` passed with existing LF/CRLF notices.

Coverage includes A/B login and return, reload, retained legacy bytes, empty
other-account state, wrong credentials, unconfirmed email, reset request,
invalid/expired links, invitation password/alias steps, password-step reload,
successful recovery retaining evidence, offline reload with an expired signed
proof, offline edits and logout, reconnect rejection, cross-tab logout, delayed
session checks, forged markers/proofs, and invalid configuration. Production
accounts enter Day One without real name/age and can log out above its splash.
No final browser page errors occurred. Synthetic login/logout screenshots at
both widths were inspected; login had no horizontal overflow and its account
touch target measured at least 44px. Shared App Box tokens were not changed.

### Attempts, fixes, and remaining limits

The npm shim was blocked by NVM, so installation used the installed npm CLI
directly; network installation required escalation. Initial interrupted network
installation and two incorrect CLI paths are not successful checks. Installation
reported 43 audit findings across the dependency tree; they were not triaged
here. The new dependency versions are pinned in the manifest/lockfile.

Early development-harness offline runs failed due to environment/caching and
readiness issues; the harness now builds static production-style resources.
Subsequent checks exposed the root `/os` scope, first-load asset priming, and
client-claim timing. The worker now awaits claims and acknowledges completed
cache priming before the test disconnects. A production run exposed the splash
blocking the account control; its menu now stays above the splash without
unmounting the underlying form. All affected cases were rerun after these fixes.

Synthetic Auth responses do not certify actual email delivery, invitation-only
project settings, real token rotation/revocation, redirect configuration, hosted
policies, or phone/browser behavior. No Supabase evidence schema or sync exists
yet. Cached keys/records are not device encryption; expired-token acceptance is
only for the approved local offline path. The default legacy runtime and owner
data remain separate until migration is reviewed. Manual lost-email recovery,
existing Reflect failures, broad-suite/lint, and wider release gates remain open.

---

## Account-separated storage - 2026-10-31

### Scope and setup

The developer approved the storage boundary, pending-work guards, direct admin
callers, synthetic tests, and continuity records. Supabase auth, provisioning,
real-data migration, membership, and deployment are excluded. The legacy app
continues using its existing records. Account mode is a foundation for a later
verified-auth adapter; the local marker alone is not proof of identity.

New tests: [account-scope.test.mjs](../tests/account-scope.test.mjs) and
[account-storage.browser.mjs](../tests/account-storage.browser.mjs). The latter
starts a test-only Vite page at `http://127.0.0.1:3220` that imports the real
React provider, store, publication hook, pin helper, and sync client. No test
route or account-switch control was added to production. Chromium uses isolated
contexts, Bangkok time, synthetic accounts A/B and legacy data, and real
IndexedDB. External requests are blocked. Basic switching/reload/publication
cases run at 390x844 and 360x844; the remaining race/failure cases run at 390x844.
No owner browser, private writing, profile server, or AI provider was used.

### Final storage checks

- `node --test tests/account-scope.test.mjs tests/day-one.test.mjs tests/day-one-simplification.test.mjs tests/phases.test.mjs tests/chapter-engine.test.mjs tests/day-door.test.mjs tests/protocol-home.test.mjs tests/first-use-setup.test.mjs tests/habit-identity.test.mjs tests/chapter-capabilities.test.mjs tests/chapter-splash.test.mjs`: **91/91 passed** (six new scope cases and 85 existing cases).
- `node --test --test-reporter=tap tests/account-storage.browser.mjs`: **11/11 passed** on final application code, without page errors.
- `node node_modules/next/dist/bin/next build`: passed on final code, including TypeScript and static generation.
- `node node_modules/vinext/dist/cli.js build`: passed on final code; existing static route-classification limitations remain.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false -p tsconfig.vercel.json`: passed. This is the Vercel configuration, not a fresh result for the previously failing standalone configuration.
- `node node_modules/eslint/bin/eslint.js app/os/account-scope.js app/os/account-scope.d.ts app/os/circle-os-store.ts app/os/circle-os-ai.ts app/os/chapters/chapter-publication-store.ts app/os/chapters/use-chapter-publications.ts app/os/day-door.js app/os/day-door.d.ts app/os/admin/chapter-editor.tsx tests/account-scope.test.mjs tests/account-storage.browser.mjs`: passed. Shell ESLint JSON diagnostics retain the pre-edit six memoization errors, two purity errors, one immutability error, and one unused-import warning.
- A read-only Node check verified all 25 local links/fragments in the three updated continuity records. `git diff --check` passed with the existing LF/CRLF warnings.

Account A starts without legacy records, private chapters, or pins. After saving
A, switching to B shows neither A's saved evidence nor unsaved form text. B saves
and reloads separately. Logout removes the evidence subtree in both open tabs;
signed-out store reads fail. Signing back into A restores only A. Legacy
localStorage bytes captured immediately before switching remain identical.
Account entry does not claim an old profile.

Queued reads, saves, and chapter writes reject after their captured scope
closes. A live IndexedDB transaction aborts without overwriting its previous
durable value; another-tab logout also aborts a live transaction. Old provider
callbacks are inert. An intentionally delayed legacy fetch is aborted/rejected,
including when a mock ignores cancellation; a delayed startup cannot repopulate
the newly mounted account. Account-mode sync makes no legacy server request.
Writes accepted into localStorage before switching stay in that account's copy.

Newer localStorage wins within an account; corrupt/missing local JSON falls
back to that account's IndexedDB. It does not read legacy v1 or another account.
Offline edits and an empty save survive a reload after connectivity returns.
Conflicting edits to an existing private chapter version reject and retain the
original content. No server-merge, real acknowledgement, or migration result is
implied by these local checks.

### Broader production regression checks and unresolved failures

The final Next build ran at `http://127.0.0.1:3218` with `TZ=Asia/Bangkok`.
With the same timezone, the command
`node --test --test-reporter=tap tests/day-one.browser.mjs tests/core-recovery.browser.mjs`
passed **20/21**. All nine Day One cases passed, including offline completion,
reload, Protocol, old versions, Quest/publication delivery, and Week Setup.
Core recovery passed 11/12. The 360px authored Reflect case retained the
placeholder `synthetic-walk-block` instead of the test's newly installed block
reference after its direct fixture replacement. No real evidence was involved.

An isolated rerun using
`node --test --test-reporter=tap --test-name-pattern='Reflect evidence and authored reading at 360px' tests/core-recovery.browser.mjs`
failed at the first swipe: saved `vision-between.index` stayed undefined rather
than becoming 1. A subsequent core-only run with
`node --test --test-reporter=tap tests/core-recovery.browser.mjs`
passed **9/12**: derived/authored at 390px and authored at 360px timed out at that
swipe. These are failed checks, not a passing regression certification.

For comparison, a disposable source copy preserved the working tree's existing
Day One and chapter bundle. The seven previously unchanged storage/client/
publication/pin/admin files were restored from HEAD `5bc8ccb`; the shell's
original provider block was restored from HEAD and its scope import removed.
The comparison had no remaining imports of the scope helper. A Next Webpack
production build passed, and the same isolated 360px authored-reading command
failed with the same first-swipe timeout. This establishes that swipe failure
also occurs before the storage change; it does not establish the cause of the
initial fixture-reference mismatch. Fixture/autosave timing and cover readiness
are possible explanations, not confirmed fixes. Reflect's broader verification
remains open. No production gesture, reading model, or existing test was changed
to make this check pass.

The temporary in-repository comparison was removed after verification, its
dependency junction removed without touching the real dependencies, and both
local Next servers stopped. Preliminary cross-drive Turbopack and Webpack
comparison builds failed on dependency-junction resolution; the successful
comparison used a same-drive copy and `next build --webpack`. Early Vite harness
attempts also needed a JSX-free virtual entry and a test-only `process.env`
definition for Next imports. Final harness and production checks use their
reported configurations. Verification ran on Node 24.22.1; older Node versions,
physical phones, other browsers, and production Supabase auth/sync remain untested.

### Invariants and next action

No geometry, typography, gap, budget, chapter content, edition content, merge,
acknowledgement, or 06:00 day rule changed. Focused tests retain the existing
clearing/stale-merge and day-boundary coverage; no new geometry measurements or
live-sync proof is claimed. The new runtime helper uses JavaScript and a matching
declaration so existing JavaScript callers need no TypeScript runtime loader.
The storage routing is not encryption or server authorization. Future auth must
verify ownership before mounting personal content and must handle recovery and
revocation. Next: review that auth implementation scope; separately resolve the
Reflect fixture/swipe verification gap before release. No extra performance
optimization was justified. Existing Phase 1 and broader verification gaps stay open.

Updated: 2026-10-30

## Goal

Verify that a new tester can complete first-use setup, record a daily activity
or moment, reload without losing it, and see Reflect observations grounded in
that test data. This remains the active task in `docs/CURRENT_TASK.md`.

## Test setup

- Browser automation: Playwright 1.64.1 with Chromium 156.0.8078.4.
- Device mode: isolated headless Chromium context with mobile emulation,
  viewport 390×844, touch enabled. No physical phone was used.
- Test identity: synthetic name `Journey Tester`, age 34.
- Data safety: each run used a fresh Playwright context. No existing browser
  profile or owner data was read, cleared, or changed. The test context was
  closed after the run, so its synthetic state is not available to continue.
- Local server: `node node_modules/vinext/dist/cli.js dev`, at
  `http://localhost:3000`.

## Completed and verified

- The initial name-and-age form accepted the synthetic test values and opened
  Today.
- The 11-page Day One chapter was completed. Text pages advanced with one
  Continue tap each; the two info pages advanced with a left swipe; the choice
  page advanced after choosing `Mind — how you think`.
- In a prior isolated run, the profile remained after a full reload. The saved
  Today content appeared after a brief empty shell; the name-and-age screen did
  not flash. The developer's reported onboarding flash was not reproduced.
- Reflect opened at `/os/mirror` and displayed Vision and Athena's Reading. It
  showed `Still learning` and `Waiting to sync` without a daily test entry.
  This verifies that the route rendered, not that an observation matched
  recorded activity.
- The Day One Continue pages advanced on their first click. This does not rule
  out the reported two-click issue in other flows.
- No Playwright `pageerror` events or ResizeObserver overlay were observed in
  the automated journey.

## Reproduced blocker: bug 17

Steps in the full journey run:

1. Open Today in the fresh context and complete name-and-age setup.
2. Complete the Day One chapter.
3. Scroll to `Set your usual day` and open Log setup.
4. Accept wake time `07:00`, advance to sleep, and set sleep time to `22:30`.
5. Tap Continue once on the sleep page.

Observed result: the Log setup cover, `Set your usual day. Swipe to begin`,
returned within 100–1,400 ms. The Log timeline and its `Now` action did not
become available. A right swipe on the returned cover did not dismiss it in
this run. This reproduces bug 17 as described in `bugs.md` and blocked recording
a daily activity.

The run did not show the `Your daily log is ready` page reported by the
developer; it returned to the setup cover after the sleep step. Keep that
difference in the reproduction notes rather than assuming the same intermediate
page was seen.

## Not completed

- No daily activity or moment was recorded because the Log timeline could not
  be reached.
- Persistence of a daily entry after reload is unverified. The earlier reload
  check verified only the synthetic profile.
- Reflect could not be checked against test activity. Its displayed reading
  without activity is not evidence that it reflects the test data.
- The user-reported bugs other than bug 17 remain unverified unless their
  status is explicitly updated in `bugs.md`.

## Follow-up journey run — 2026-10-30

### Completed and verified

- Repeated first-use setup in a fresh headless Playwright Chromium context at
  390×844 with mobile emulation and touch enabled. Used only the synthetic
  profile `Journey Tester`, age 34. The name-and-age form opened Today.
- Completed all 11 Day One pages with synthetic answers. Text answers advanced
  with one Continue tap each, the choice page advanced after choosing
  `Mind — how you think`, and the two information pages advanced by swiping
  left. The final protected completion swipe closed the chapter.
- Opened the Log setup card. The run showed two steps: wake time and sleep
  time. It accepted `07:00` and `22:30`.
- After Continue on the sleep step, the Log card returned to
  `Set your usual day. Swipe to begin`. The timeline and `Now` action were not
  available. Reopening the setup up to three times did not expose the timeline.
  This reproduces bug 17 again; this run did not show the `Your daily log is
  ready` page described in the user report.
- Reloaded the same isolated context after the Log attempts. Today still
  greeted `Journey Tester`; the first-use screen did not reappear. The app used
  the `circle-os-state-v2` local-storage key.
- Opened Reflect at `/os/mirror`. Vision and Athena's Reading rendered, showing
  `Still learning` and `Waiting to sync` without a daily entry.
- No Playwright `pageerror` was recorded. The app server on port 3000 returned
  HTTP 200.

### Still not verified

- No daily activity or moment could be recorded because Log never exposed its
  timeline. Entry visibility and persistence after reload remain unverified.
- Reflect could not be compared with recorded activity, so grounded
  observations remain unverified. Its empty-state text is not evidence of a
  successful reflection check.
- The run used headless mobile emulation, not a physical phone or the
  developer's browser. Other reported bugs remain unverified except bug 17.
- No application code was changed and no bug was fixed. Per the developer's
  preference, this pass recorded findings only.

## Environment note

On server restart, Vinext reported a dependency-scan failure with parse errors
on TypeScript declaration files and skipped pre-bundling. The app still served
`/os` with HTTP 200, and the browser journey continued. No app code was changed
to address this warning.

## Bug 17 fix verification — 2026-10-30

### Change

- The ordinary-publication selector now collapses each chapter to its newest
  published version before choosing what to deliver. This prevents old
  `log-setup` versions from being offered one after another.
- A completed published Log setup now writes its wake and sleep answers to the
  profile's routine evidence.

### Verified journey

- Used fresh isolated headless Playwright Chromium at 390×844 with mobile
  emulation and touch enabled. Synthetic profile: `Journey Tester Log Fix
  1030`, age 34. No existing browser profile was opened or cleared.
- Completed name-and-age setup and all 11 Day One pages with synthetic answers.
- Completed the newest published Log setup (`log-setup@3`) with wake `07:00`
  and sleep `22:30`. After `Your daily log is ready`, a left swipe opened the
  Log timeline instead of returning to its setup cover.
- The timeline showed `Now`, `Wake up` at 07:00, and `Sleep` at 22:00. Saved
  `circle-os-state-v2` contained the completed setup run and routine answers
  `07:00` and `22:30`.
- Added the synthetic moment `Log setup smoke test` at 08:00, then reloaded
  within the same isolated context. The moment remained visible. No Playwright
  `pageerror` events occurred.
- Focused chapter tests: 26 passed, 0 failed. Build:
  `node node_modules/vinext/dist/cli.js build` completed successfully.

### Remaining journey work

- Reflect was not compared against this newly recorded moment, so evidence
  grounding remains unverified.
- Other user-reported bugs remain unverified or open. The run used headless
  mobile emulation, not a physical phone.

## Continue bug check — 2026-10-30

### Completed and verified

- Used the existing app at `http://localhost:3000/os/mirror` and isolated
  headless Playwright Chromium contexts at 390×844 with mobile emulation and
  touch enabled. Both profiles used synthetic names and age 34; no existing
  browser profile was opened or cleared.
- On the first Habit question (`4/6`, “What small habit will you do?”), filled
  a synthetic answer and tapped Continue once. Within 450 ms the page advanced
  to `5/6`, “When and where will you do it?” The reported first-tap failure
  did not reproduce on this path.
- In a separate context, filled the first Day One answer on `1/11` and tapped
  Continue once. Within 450 ms it advanced to `2/11`.
- Neither browser context recorded a Playwright `pageerror`.

### Limits and next step

- These checks cover the first Habit question and the first Day One question
  only. They do not verify all Continue controls or disprove the broader report
  in bug 19. No code was changed because the failure did not reproduce.
- Bug 10 remains a user-reported issue, marked “not reproduced in this check,”
  not fixed. To continue, collect the exact page and timing from the original
  report or test the next specific Continue path in an isolated context.

## Habit swipe check — 2026-10-30

### Completed and verified

- Used a fresh isolated headless Playwright Chromium context at 390×844 with
  mobile emulation and touch enabled. Completed Day One using a synthetic
  profile, then opened the first Habit chapter.
- On Habit page `1/6`, one left swipe advanced to `2/6`. One right swipe
  returned to `1/6`. A left swipe then advanced to `2/6`, and a second left
  swipe advanced to `3/6`. No Playwright `pageerror` occurred.
- The report that left swipe only advances after first swiping right did not
  reproduce. Right-swipe-back itself did reproduce.

### Product rule conflict and next action

- `app/os/APP_SESSION_STANDARD.md` says a person may move backward in an open
  Journey to edit an answer before confirmation. Habit uses the shared
  `SwipeSession` engine; disabling backward swipes there would affect every
  chapter Journey. The developer chose to keep the current behavior for now.
  No code was changed.

## Next session: resume here

1. Read `AGENTS.md`, `docs/CURRENT_TASK.md`, this file, the latest
   `docs/SESSION_HANDOFF.md` entry, and `bugs.md`. Do not read or print
   `.env.local`.
2. Start the local server with `node node_modules/vinext/dist/cli.js dev` if it
   is not already running.
3. Bug 17 is fixed and verified: `log-setup@3` completed into the Log timeline,
   and the synthetic 08:00 moment survived reload. Do not repeat that setup
   unless checking another change.
4. Bug 10 did not reproduce on the first Habit question or first Day One
   question after one Continue tap. Keep it open as a user report; bug 19's
   broader claim remains unverified.
5. Bug 11's left-swipe failure did not reproduce; right-swipe-back worked as
   designed by the current Journey standard. The developer chose to keep this
   behavior for now; no gesture code change is planned.
6. Continue the journey by opening Reflect in the same isolated context and
   comparing its observations with `Log setup smoke test`. Record whether it
   states direct evidence or inference, then update `bugs.md` and this record.
7. Keep the other user-reported findings separate; reproduce them before
   changing their statuses.
8. Update `docs/CURRENT_TASK.md` and append a dated entry to
   `docs/SESSION_HANDOFF.md` after further work.

Playwright is installed as a development dependency, and Chromium is installed
in the machine's Playwright browser cache. No reusable journey test file or npm
script has been added yet.

## Bug 12 — Habit answers not reflected in the result — 2026-10-30

### Reproduced before the fix

- In a fresh isolated headless Playwright Chromium context at 390×844, completed
  Day One with the synthetic answer `ONBOARDING ANSWER`, then completed the
  first-use Habit setup using three distinct answers.
- The completed `habit-building@1` run retained all three Habit answers, but
  `habits.definitions` still contained only the Day One Habit with
  `ONBOARDING ANSWER`. The Habit answers had no effect on the saved Habit.
- No Playwright `pageerror` occurred during the reproduction.

### Fix and verification

- The first fix covered the first-use publication path, but browser testing
  still reproduced the bug. The built-in `habit-building@1` chapter is delivered
  through the regular publication branch, which still had no Habit projection
  callback. The saved run therefore contained the three answers while the Day
  One Habit still showed its onboarding answers.
- Added `applyHabitBuildingCompletion` to the regular published
  `habit-building` completion path as well as the first-use and compiled paths.
  The hydration repair also recognizes completed `habit-building`
  publications that are not marked first-use. It updates the existing starter
  Habit, keyed by run ID, and avoids overwriting a later manual edit.
- Playwright Chromium, isolated context, mobile emulation at 390x1400: completed
  Day One and `habit-building@1` using distinct action, cue, and identity
  answers. After the final forward swipe, the run was `completed`; the existing
  Habit row showed all three answers and matching rendered text. After reload,
  the run and Habit values were still present. No page errors occurred.
- `node --test tests/habit-identity.test.mjs tests/first-use-setup.test.mjs`:
  17 passed, 0 failed.
- `node node_modules/vinext/dist/cli.js build` completed successfully.
- `node node_modules/vinext/dist/cli.js build`: completed successfully.

### Remaining check

- The browser test covered a newly completed run and reload persistence. It did
  not inject an already-completed broken run to exercise the hydration repair
  branch directly. The regression tests cover projection and repair wiring;
  stored-state recovery remains a useful follow-up check.

## Phase 1 — saved Habit recovery and Reflect grounding — 2026-10-30

The developer approved browser regression coverage, focused checks, and
updates to the journey, bugs, task, and handoff records. No application fix
was authorized or made. Branch `paing-branch`, HEAD `7ffd3b2`.

### Setup and commands

- Added [tests/core-recovery.browser.mjs](../tests/core-recovery.browser.mjs).
  Start the isolated server with PowerShell:
  `$env:TZ = 'Asia/Bangkok'; node node_modules/next/dist/bin/next dev --port 3218`.
  The browser uses the same timezone and current clock. The test computes
  the Circle date using the 06:00 boundary; it does not test the boundary itself.
- Fresh Chromium context per case, mobile/touch emulation at 390x844 and
  360x844, default motion. Only requests to `http://localhost:3218` are
  allowed. No owner browser, profile server, personal records, or AI service
  was used. Synthetic completed setup runs bypass unrelated onboarding.
- `node --test --test-reporter=tap tests/core-recovery.browser.mjs`:
  **12 passed, 0 failed** on final code (about 696 seconds).
- `node --test tests/habit-identity.test.mjs tests/first-use-setup.test.mjs tests/athena-memory.test.mjs tests/athena-alignment.test.mjs tests/athena-pricing.test.mjs`:
  **64 passed, 0 failed**.
- `node node_modules/eslint/bin/eslint.js tests/core-recovery.browser.mjs`:
  passed. Documentation audit passed (14 links, four heading fragments);
  whitespace and `git diff --check` passed with existing LF/CRLF warnings.
  This session ran no full build or broad test/lint suite.

### Observed behavior

At both widths, loading a completed `habit-building@1` run repaired the old
starter's action, cue, and identity. With no starter it created one Habit.
Two further reloads kept one row, the same answers, and the run marker.
A later manual edit remained intact across the same reloads. This directly
covers the startup recovery path left unverified in the earlier Bug 12 entry.

For each Reflect mode, the test saved `Walk in the park` at 08:00 through
Log's actual controls and verified it after reload. Applying `priceDays`
to that saved browser day returned one recorded hour and one walking hour.
This is an arithmetic assertion on saved evidence, not proof that Reflect
recalculates prepared prose when a Log entry changes.

An empty reading stayed in `Athena is still learning.` A synthetic derived
observation displayed the recorded walk, with a separately labelled working
guess; it minted no edition. Synthetic authored prose displayed its cover
and reading text and retained exactly one unchanged edition. Fixture source
references were linked to the UI-created Log record. Navigation preserved
the activity and edition archive. Final cases had no browser page errors.

### Attempts and remaining limits

Initial fixed browser time disagreed with server-rendered time and caused a
hydration mismatch. Both now use Bangkok and the actual clock. Early attempts
were stopped during diagnosis; a startup wait also timed out. Corrected the
Habit selector to a text field, compared manual edits with normalized state,
and waited for saved page indices and transition completion between reading
swipes. The corrected full run passed; no runtime fix was needed.
Next dev also warned about smooth scrolling during route transitions; no
application change was made for that warning.

Prepared memory was deliberately installed as a synthetic fixture, not
produced by Athena from the activity. Generation quality, scheduler freshness,
real source selection, server acknowledgements/merges, offline retry, other
browsers, physical phones, and geometry remain outside this verification.
Existing TypeScript/build and broader-suite limitations were not rerun.
No bug beyond this bounded coverage is newly declared fixed.

## Shorter Day One - 2026-10-31

### Scope and setup

The developer approved Day One v3 implementation, its tests, continuity records,
and the finish summary in the shared player. Their correction allows the sole
user to see v3 after completing an older version. Existing access and records
remain preserved. Tests used synthetic isolated profiles, never owner data.

Final browser setup: `TZ=Asia/Bangkok`, Next production server at
`http://127.0.0.1:3218`, Chromium at 390x844 and 360x844, mobile emulation and touch
capability. The test intercepts and blocks every request outside that origin.
Fresh isolated browser contexts include isolated IndexedDB publication storage.
Four main-flow cases also enter and finish while the browser is offline, then
restore local-server connectivity before reloading.

### Commands and results

- Baseline: `node --test tests/phases.test.mjs tests/chapter-engine.test.mjs tests/day-door.test.mjs tests/protocol-home.test.mjs` passed 42/42 before implementation.
- Final: `node --test tests/day-one.test.mjs tests/day-one-simplification.test.mjs tests/phases.test.mjs tests/chapter-engine.test.mjs tests/day-door.test.mjs tests/protocol-home.test.mjs tests/first-use-setup.test.mjs tests/habit-identity.test.mjs tests/chapter-capabilities.test.mjs tests/chapter-splash.test.mjs` passed 85/85.
- With Bangkok time set, `node --test --test-reporter=tap tests/day-one.browser.mjs` passed 9/9 against the final production build.
- `node scripts/chapter-compiler.mjs --check` passed: 33 sources, zero external Quest sources; baseline was 32 sources. The bundled Quest registry was left unchanged.
- `node node_modules/next/dist/bin/next build` and `node node_modules/vinext/dist/cli.js build` passed on the final application code.
- `node node_modules/eslint/bin/eslint.js app/os/day-one-model.js app/os/chapters/chapter-player.tsx tests/day-one.test.mjs tests/day-one-simplification.test.mjs tests/day-one.browser.mjs` passed. Shell ESLint was compared with HEAD using JSON reports: both have six memoization errors, two purity errors, one immutability error, and one unused-import warning. No new lint finding remains.
- `node node_modules/typescript/bin/tsc --noEmit` still fails with TS2307 for `cloudflare:workers` in `db/index.ts`. This matches the recorded baseline gap; the Next production build's own TypeScript phase passed.
- A comparison against HEAD confirmed every one of the 35 pre-existing bundled chapter versions retained identical content. Only `day-one@3` was added. Source `Day One.md` was preserved; the new external file is `D:/CircleOS/Chapters/Published Soruces/Day One v3.md`.

### Observed outcomes

At both widths, two uncertain answers and either a skipped or supplied optional
action reached the finish Page. The Page displayed only the supplied words.
Reload during the journey resumed the next question with earlier answers intact.
Offline progress remained in the local outbox. Completion returned to the app
without another automatic exercise and created no declarations, identities,
Habits, goals, tasks, or Protocols. Habit Building was not stored as completed.

Routine's idle view made Protocol reachable. Its existing Start a phase action
created one draft only when chosen; the draft and Day One answers survived reload.
An older completed profile could see the new automatic cover. Quest entry saved
the same new answers while retaining the older run. A partially answered v2
resumed its original info Page and answers across reloads. A synthetic Day One
publication delivered through Thoughts completed without a duplicate setup sheet
or automatic greeting, using the shared outcome handler.

Week Setup was offered after a synthetic v3 completion on the prior Circle day.
Without any old Day One Character, habit, or commitment records, the full Week
Setup journey completed and saved one goal, linked task, and Protocol, with no
Habit invented. Reload retained completion. Focused tests separately checked
legacy outcome idempotence, new completion preserving existing records, dated
answer clearing through a stale merge, and the 05:59/06:00 Week-offer boundary
for old and new Day One versions. No final browser page errors occurred.

### Attempts, limits, and next action

Early browser selectors assumed the cover's authored Begin label and a Routine
region role. They were corrected to the actual accessible Begin name and named
session element. The first publication fixture marked an empty Habit run complete
and triggered normal recovery; it now defers that unrelated setup instead.
Publication integration exposed a second route through the Thoughts scheduler;
both it and direct delivery now use the same Day One handler and completion return.
Finishing no longer opens a second automatic greeting in that case.

A reload aborted during a development-server refresh while source edits/builds
were ongoing. That run was stopped; the final full run used the stable production
server and passed. A synthetic mobile summary screenshot was visually inspected.
No geometry tokens, typography, gaps, or chapter budgets changed, so no new
Note/Thoughts/Habit/Protocol geometry measurement is claimed. No additional
performance optimization was justified beyond sharing the inconsistent outcomes.

These results do not certify real server acknowledgements, offline recovery to
that server, personal Athena preparation, physical phones, other browsers, the
broad suite, or full lint. Earlier Phase 1 gaps remain open. Next is developer
use and wording review; no other chapter revision or deployment is included.
## Bottom navigation (2026-11-10)

Approved dark-glass navigation and intentionally empty Home/Explore routes.
Final production-CSS run: 8/8 passed at 360/390/416px. Commands use installed
Node v24.22.1 at C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/
v24.22.1/node.exe and PLAYWRIGHT_BROWSERS_PATH=C:/Users/wickie''/AppData/Local/
ms-playwright. With CIRCLE_PRODUCTION_CSS=1:

`node --test --test-name-pattern="bottom navigation|full-page Note is button-only|shared App Box geometry" tests/writing.browser.mjs`

The tests use actual components, stores and final Next-built CSS with synthetic
accounts and blocked external requests. They verify four destinations/current-page
semantics, empty Home/Explore bodies, 28px SVGs, 44px minimum targets, in-tool
visibility, Today-root return, accepted Note preservation across route switches,
simulated keyboard viewport hiding/reappearance and scrollable Footer clearance.
Full-page Note paths cover reload/browser hash Back, long writing, History,
Trash and Restore. Root routing in the harness is a test router, not a full Next
browser-history certification. Keyboard geometry is simulated, not a real phone
keyboard. Inspected outputs/bottom-navigation-390.png; companion 360/416 images
are available. Existing ResizeObserver loop notifications remain.

At 360x844 and 390x844, opened Note, Thoughts, Habit and Protocol frames each
measure 666px; foreheads are 48/48/24/48px, with no inner scroll panel. The
360x740 Note journey retains a 562px floor and 48px forehead; long writing grows
downward. All Footer actions can be scrolled above navigation.

Final Next build (node node_modules/next/dist/bin/next build), including TypeScript,
passed and includes /os/home and /os/explore. Focused ESLint for bottom-navigation,
the two new route files and writing.browser.mjs passed; design-system tests pass
2/2. A shared-token correction was followed by rebuild and the final 8/8 run.
Initial sandbox browser requests failed with ERR_NETWORK_ACCESS_DENIED and the
CSS worker could not connect; both passed on authorized outside-sandbox runs.
An initial Note 416px acceptance timeout passed in final reruns. Historical
geometry tests expected compact/hidden writing; updated their fixture to open
Note and check the already approved full-page contract. Fixed the test router
to clear tool hashes like actual cross-route navigation. No application data
or save engine was changed to satisfy tests. No broad optimization justified.
Physical keyboards/devices, other engines, hosted sync, broad suite and Vinext
build remain unverified in this slice. Local Next preview refreshed outside the
sandbox on 3012; HTTP checks for /os/home and /os/explore each return 200.
Prior work preserved; no staging, commit or deployment.
