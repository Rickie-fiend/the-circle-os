# Account writing storage and transport

## Local synthetic backup and restore — 2026-11-15

Approved rehearsal complete: two exact database/media restores and two complete
360/390px browser selections pass. Missing/corrupt backup rejection, pre-commit
connection-termination rollback, owner isolation and stable retry pass. Final
build/TypeScript, lint and existing focused suite 69/69 pass; cleanup confirmed.

**Open safety failure:** an older snapshot restores a later-deleted entry/account
and loses a newer accepted edit. Independent deletion suppression remains
unimplemented. Local timings do not certify production recovery or 30-day expiry.
No product-code, migration-file, hosted-resource or live-sync change; original backup untouched.
[Evidence](USER_JOURNEY_TESTING.md#local-synthetic-backup-and-restore--2026-11-15)
and [procedure](BACKUP_RESTORE_RUNBOOK.md).

Next: review independent deletion/account-revocation evidence and current/off-site
backup coverage before proposing the operating implementation.

## Backup readiness audit — 2026-11-15

Approved audit/documentation scope complete. [Runbook](BACKUP_RESTORE_RUNBOOK.md)
records connector-confirmed Free plan, Singapore/PostgreSQL 17 project and empty
branch list. Signed-in scheduled-backup Dashboard explicitly reports Free Plan
does not include project backups. Developer then identified the existing local
backup at D:/CircleOS-backups/before-catalog-003. Read-only inspection confirms
roles/schema/data SQL, four writing tables, Auth data and one image; file times
are 2026-11-12 06:56–06:58 Bangkok. This is a pre-catalog-003 historical copy,
not a restore-verified/current backup. Off-site copies and scheduling remain
unknown. Detailed coverage and limitations are in the runbook.

Deletion markers live in the same database; restoring an older backup can predate
them. Independent post-backup deletion/account/session reconciliation is proposed,
not implemented. Production loss window, restore time and 30-day deleted-backup
expiry remain unverified. The runbook prepares a synthetic local rehearsal and
separate hosted drill gates, acceptance matrix, cost/target checks and cleanup.

Next: review current/off-site coverage and independent deletion evidence, then
approve a concrete isolated rehearsal. No new dump, restore, provisioning, product code,
migration, live-sync activation, commit or deployment occurred.

Hosted recovery follow-up — 2026-11-15: final clearing-inclusive hosted
journeys pass twice at 360/390px with fresh A/B accounts per width. Corrected a
History-row click during a guarded Page transition; test-only Send diagnostics
remain. Earlier intermittent Send failure did not recur and is not marked fixed.
Build/TypeScript, focused lint and 58/58 model/transport tests pass. All temporary
accounts removed; scoped SQL confirms zero writing rows. No runtime/deployment
change; sync stays off, phones deferred. Next review backup/restore separately.
See [evidence](USER_JOURNEY_TESTING.md#hosted-recovery-diagnostics-and-repeat-acceptance--2026-11-15).

Hosted production-store recovery — 2026-11-14: isolated sync-enabled production
build now has real Auth/RPC recovery evidence at 360/390px using temporary accounts.
Accepted writing restores exactly; interrupted recovery retries, local-only work
does not return, deletion suppresses stale records and accounts remain separated.
Final clearing-inclusive acceptance fails: latest run times out waiting for Deep
Thought Send to create a saved entry; clearing remains unverified. Earlier complete
recovery selection passed both widths, but current acceptance is not complete.
Completed runs deleted temporary users; scoped writing-table cleanup is verified.
Diagnose the Send/fixture boundary before a separate product-fix proposal.
Live activation remains
off; database backup restoration, retention, local-only draft protection and phone
acceptance remain open. See [evidence](USER_JOURNEY_TESTING.md#hosted-production-writing-recovery--2026-11-14).

Storage-loss qualification — 2026-11-14: approved synthetic desktop checks now
cover partial and full local-data removal. Production recovery 24/24, store 22/22,
provider 16/16 and controller/proof 12/12 pass; build/TypeScript and lint pass.
Automatic writing sync stays off.
Full origin loss has no unbacked-writing recovery source. Phone/OS eviction,
hosted restore, retention and remote stale-copy suppression remain open.
Next review backup/restore separately. Earlier gap lists are qualified only by
this bounded evidence. See [results and limits](USER_JOURNEY_TESTING.md#storage-loss-and-recovery--2026-11-14).

Durable-entry update — 2026-11-14: approved IndexedDB proof/closed-state fix now
passes the complete 360/390px crash journeys, including exact writing/drafts,
offline edits, clearing, empty composer, completed logout and account return.
Recovery selection 18/18, controller/proof 12/12, build/TypeScript/lint pass.
This supersedes the bounded crash blocker below. Phone/hosted verification of
this runtime change and eviction/backup gates remain open; activation stays off.
See [final evidence](USER_JOURNEY_TESTING.md#durable-offline-entry-and-crash-recovery--2026-11-14).

Crash qualification — 2026-11-14: production-route synthetic Chromium crash
journeys fail at both 360/390px. The service worker serves offline /os after the
crash, but Auth shows Welcome back rather than the writing tools. Final recovery
selection 15/17; build/TypeScript/lint pass. Approved diagnostic follow-up confirms
exact saved entries/revisions and drafts survive. Offline proof exists before
crashing and is absent after reopening; logout/password-flow markers are absent.
Launch-time offline mode still fails with one blank startup tab. Exact proof-loss
mechanism remains unestablished; later crash steps were not reached.
Normal-restart evidence remains bounded as recorded. Activation stays off;
phone testing is deferred. See [crash evidence](USER_JOURNEY_TESTING.md#forced-browser-crash-writing-recovery--2026-11-14).

Updated: 2026-11-11, Asia/Bangkok. This is the implemented account-writing
protocol and its verification boundary. Automatic product activation remains off.
Other lifestyle domains and legacy profile-server records are outside this contract.

## Current status

Natural-expiry follow-up — 2026-11-14: the approved real one-hour offline wait
passes at 390px. An unchanged server-issued signed token actually expired; the
app reopened offline through the service worker with exact Note/draft text,
then renewed to an unexpired token on reconnect without changing saved entries,
versions or drafts. Hosted test 1/1 and cleanup pass. This qualifies the earlier
natural-expiry gap below for this bounded desktop-tab journey. Phone acceptance
is explicitly deferred; activation remains off. See
[natural-expiry evidence](USER_JOURNEY_TESTING.md#natural-session-expiry-and-writing-recovery--2026-11-14).

Hosted-session follow-up — 2026-11-14: actual production-route journeys at
360/390px pass real sign-in, early renewal/token rotation, offline return,
revoked-refresh rejection, lock and same-account restoration with exact saved
entries/drafts preserved. Two temporary hosted accounts were deleted and absence
confirmed. Natural JWT expiry was not tested: SDK scheduling metadata requested
renewal early without changing signed tokens. Physical devices and remaining
activation gates stay open; activation remains off. See
[hosted-session evidence](USER_JOURNEY_TESTING.md#hosted-account-session-recovery--2026-11-14).

Update — 2026-11-14: the actual writing-store adapter now has bounded normal
desktop Chromium browser-process restart verification with persistent synthetic
profiles and local PostgreSQL/HTTP/Auth fixtures. Saved history, unfinished drafts,
exact pending uploads, denied sends, accepted/lost replies and account separation
survive restart. Final storage/cloud browser suites pass 37/37, including three
new restart cases. This qualifies earlier unverified cold-restart statements below
only for this local fixture. The follow-up real Next production-route check also
passes at 360/390px: actual service-worker offline opening, Note/Deep Thoughts
recovery and offline edits through two browser-process restarts, offline logout,
account isolation and reconnection without duplicate saved revisions. Final
Auth/recovery selection passes 15/15; synthetic Auth does not certify real hosted
sessions. Real phones, crash/OS eviction and backups remain open. Activation stays off.
See [real-app evidence and phone checklist](USER_JOURNEY_TESTING.md#real-app-offline-writing-recovery--2026-11-14).
See [restart evidence](USER_JOURNEY_TESTING.md#writing-browser-restart-recovery--2026-11-14).

Both migrations were applied to the hosted project on 2026-11-06 after approval:

- [Original writing migration](../supabase/migrations/202611050001_account_writing.sql).
- [Resolution migration](../supabase/migrations/202611060001_writing_resolution.sql).

Do not reapply either non-idempotent migration. Bounded hosted two-account
RPC/access/conflict checks and separate synthetic IndexedDB reload checks passed
as recorded below. Those older hosted checks do not certify the production
adapter. The current local restart/offline-route evidence above closes its bounded
desktop-browser gap; physical devices, eviction and backups remain unverified.

The resolution migration SHA-256 is
60b823dcc45f8ca5ff3623913272501e8dba6886178111600e4c410ec6e929e2.
The dated [pre-cleanup contract](archive/2026-11-11-doc-cleanup/ACCOUNT_WRITING_SYNC.md)
preserves implementation history and exact attempts.

## Writing status and conflict resolution - 2026-11-06

History conditionally shows Sync for pending saved work, conflicts or recoverable
errors, not drafts/completed sync alone. Retry is error-only and hides during
recovery. Note autosave and the global header remain silent.

Comparison shows Cloud/Device authored content. Tap a copy for dated read-only
history; stacked Use Cloud/Use Device actions choose a current copy.
Success returns silently to the list. Saved copies on the owning History row
retains original branch histories and This note with its current saved history,
independent of whether Sync is visible. New Note creates a separate entry.

A choice commits locally before upload and survives failure/response loss.
If either reviewed copy changes, review again. Both original saved histories
remain in immutable resolution records; the chosen current revision appends
to the existing cloud history. No prose merge or device-clock winner.
New local typing remains pending; clean buffers adopt the chosen version on
leaving Sync. Permanent deletion scrubs choice/archive bodies and cannot be undone
by an old resolution retry. Drafts never enter the cloud protocol.

All these views follow current full-page Design/Page rules. Older compact
Body-scroll descriptions are retired.

## Database contract

Private circle_private tables are writing_heads, writing_receipts,
writing_conflicts and writing_resolutions. Heads hold saved entries/versions or
terminal deletion markers; receipts retain body-free operation identity/hash,
generation, exact acceptance and server version. Conflicts retain competing
snapshots; resolutions preserve both histories and the chosen result until
terminal deletion scrubs their bodies.

Owner-only SELECT policies apply. Direct client mutations are denied.
Public RPCs derive auth.uid(), accept no owner argument, require authenticated
confirmed accounts, fixed empty search paths and qualified names.
Anonymous/service-role function calls are denied. This adds no privileged
admin-writing reader.

| RPC | Contract |
| --- | --- |
| circle_writing_inventory | Entry-ID paging, maximum 100 heads; client requests 50 |
| circle_writing_receipts | Only caller's named receipts, maximum 1,000 IDs |
| circle_writing_apply | Account transaction lock; validate snapshot/retry/base version; commit head and exact receipts atomically |
| circle_writing_resolve | Same account lock, exact reviewed cloud version/snapshot, stable request hash; preserve histories and append chosen revision |
| circle_writing_resolution_history | Paged same-owner archive recovery |

Changed retry identity is rejected. Published saved versions/source identity
cannot be rewritten. A competing base preserves a conflict without altering the
accepted head. Resolution choice settles exact captured operations without
inventing normal upload receipts; newer edits stay pending.

Permanent deletion is terminal per entry ID and takes precedence over stale edits.
Local/downloaded deletion removes saved bodies, drafts and choice/archive text,
using body-free suppression for pending work. Server deletion scrubs conflict and
resolution request/result bodies. Previously accepted apply retries return their
original body-free receipts; a prior resolution retry returns deleted. Neither
can resurrect the terminal head.

## Local and transport contract

records, sync-v1 and cloud-v1 share the account writing IndexedDB transaction
engine. Optional choices/resolved/body-free settled maps preserve cloud-v1
compatibility. Local ledger, queue, receipt and deletion operations are atomic.

Recover pending choices first, then exact normal receipts, remote inventory,
uncovered saved-entry inventory and uploads. Deterministic inventory markers
cover earlier account writing without replaying draft receipts. Compatibility
or legacy records are never silently imported. Cloud baselines contain lifecycle/
version identity, not prose; remote conflict copies contain saved text, not drafts.

Uploads include a current saved snapshot and ordered exact operation references.
Stable request IDs/hashes protect response-loss retry. Acknowledgements retire
only named operations and preserve newer writing.

Each request captures a current session token, verifies its confirmed user through
Auth against the local scope and sends that same token. POST/no-store/rejected
redirects, 15-second timeout and account abort guard apply. Late checks/replies/
parsed data cannot update a closed account. Offline proof is not authorization;
backend error bodies are not shown/logged by this transport.

The runner requires NEXT_PUBLIC_CIRCLE_WRITING_SYNC=enabled and a valid connection;
default is off. If enabled, it checks entry/local notification/reconnection/
foreground and every 30 seconds. Runs serialize within a tab; database transactions
guard tabs. Failed work remains local and pending. Full inventory polling is a
bounded first implementation, not a measured scaling result.

Client limit: 1,000 pending operations and approximately 1 MB encoded JSON.
Server rejects over 2 MB JSON text. Oversized writing stays local; no truncation.
Paging/compaction needs review. Trash, receipts and conflict metadata have no
automatic expiry in this slice.

## Hosted verification - 2026-11-06

Original SQL was applied through SQL Editor, not CLI migration-history
registration. Eight catalog checks covered tables/RLS, grants, definer paths,
Auth references and initial emptiness. Original normalized/trimmed SHA-256:
28f44e9c4ee054d3ac097748ebfbb3a39bf9e0f1650413626b0dea23d428cec4.

The bounded two-account checks covered own access, foreign-owner denial,
same-ID isolation, exact/changed retries, response loss/newer local work,
conflicts, Trash/restore and terminal deletion. The first run's local-server
service-role probe had a network failure; a separate approved direct probe
denied all three original RPCs. Later resolution harness checks also passed
the current service-role route. The old network failure is not a current
authorization finding.

## Follow-up migration and hosted resolution checks - 2026-11-06

Seven catalog checks verified the follow-up objects/functions/RLS/grants/trigger.
Both confirmed accounts covered choices, stale review, retry identity, lost
resolution response, history recovery, Trash/restore, deletion/replay and reciprocal
owner isolation. All five RPCs denied anonymous, invalid JWT and service-role
requests. Final audit: four terminal heads, six scrubbed archives, two scrubbed
conflicts and 26 body-free receipts. Synthetic text was removed; Auth accounts
and minimal metadata remain. Local focused tests passed 36/36 with a later
overlapping 3/3 harness recheck, lint and Next build.

## Durable hosted reload recovery - 2026-11-06

The separate circle-os-writing-hosted-recovery-v1 account store reuses the
transaction/models/coordinator and confirmed-session transport. It never opens
product writing storage. Explicit controls/checkpoints require a changed document
time origin; HMR cannot satisfy reload. No hosted work runs on page load.

Both accounts passed pending save, accepted upload/lost reply, queued choice,
accepted resolution/lost reply, newer-writing/history recovery and queued terminal
deletion through reloads. Fresh synthetic-device recovery preserved archives.
Final audit: two version-7 terminal heads, four scrubbed archives, ten body-free
receipts and no conflict bodies. Replayed apply receipts left the head unchanged;
old resolution returned deleted. Four isolated Chromium cases passed, with
targeted lint and Next/TypeScript build.

This closes only the separate-test-store/page-reload gap. Product adapter,
cold restart, offline load, physical phones, eviction, valid-session expiry/
revocation/unconfirmed cases, lock contention and backup/retention remain open.

Exact commands, attempts, accounts' bounded scopes and cleanups are in the
[journey record](USER_JOURNEY_TESTING.md#hosted-account-writing-checks-2026-11-06),
[resolution evidence](USER_JOURNEY_TESTING.md#follow-up-migration-and-hosted-resolution-checks-2026-11-06)
and [reload evidence](USER_JOURNEY_TESTING.md#durable-hosted-reload-recovery-2026-11-06).
Counts overlap and are not a sum of unique coverage.

## Verification and activation gates

Focused commands from the repository root:

~~~powershell
node --test tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-model.test.mjs tests/writing-sync.test.mjs tests/writing-compatibility.test.mjs
node --test tests/writing-cloud.browser.mjs tests/writing-storage.browser.mjs tests/writing-provider.browser.mjs
node node_modules/next/dist/bin/next build
~~~

These are check entry points, not a claim they ran during this cleanup.
Database tests use PGlite synthetic Auth/roles; local browser checks use real
IndexedDB with synthetic HTTP/Auth fixtures. Hosted evidence above is separate.

Before a reviewed activation change, verify actual hosted roles/grants/config,
session expiry/revocation/unconfirmed denial, current protocol and production
writing-store recovery on target devices. Preserve private schemas outside the
Data API; expose only intended public RPCs. Verify lost responses, conflicts,
terminal deletion and stale-device recovery without personal migration.
Do not apply an already-applied migration to satisfy an outdated checklist.

Setting NEXT_PUBLIC_CIRCLE_WRITING_SYNC=enabled requires a separately approved
environment/build change. No activation is authorized by this documentation.
Real-device cold restart/offline load/eviction, true lock contention,
manual account deletion, protected admin/log access, backup/restore and 30-day
deleted-backup retention remain open release work.

The protocol's live-table scrubbing does not certify deletion from backups,
disconnected devices, logs, external services or future AI indexes.
Never put credentials or personal writing in fixtures or records.
