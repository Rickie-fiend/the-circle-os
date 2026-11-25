# Circle OS work plan

Updated 2026-11-25, Asia/Bangkok. This is the working queue under
[Roadmap](ROADMAP.md). A queued item is not approval to edit, provision, migrate,
activate sync or deploy.

## Start here

Basic Chapter sync passed on disposable hosted Supabase. Later Chapter review
and deletion checks passed locally. Log sync and both conflict choices passed
locally. The next proposed review is an isolated hosted Log rehearsal.
[Current task](CURRENT_TASK.md) · [Chapter evidence](USER_JOURNEY_TESTING.md#chapter-sync-and-conflict-choices--2026-11-23) ·
[Log evidence](USER_JOURNEY_TESTING.md#log-sync-and-conflict-choices--2026-11-24).

The developer reviewed Home Imprint, reported checking published Chapters,
and reported Protocol working. Device and build details for the latest
Chapter and Protocol reports remain unrecorded. Replacement
[onboarding](ONBOARDING_SPEC.md) and [Reflect redesign](REFLECT_PAGE_POTENTIAL_IMPLEMENTATION.md)
remain future work.

## Backup work deferred — 2026-11-23

The developer approved a maximum loss window of 24 hours for synced edits in
the friends-and-family beta. Defer hosted backup work and spending until after
the planned Supabase upgrade. Resume by checking the upgraded plan's database
backup schedule and retention, then separately review media coverage, deletion
and revocation safeguards, and an isolated hosted restore. Safe restore and the
30-day deleted-backup limit remain beta requirements. [Backup runbook](BACKUP_RESTORE_RUNBOOK.md).

## Local synthetic backup and restore — 2026-11-15

Approved rehearsal complete: two exact database/media restores and two complete
360/390px browser selections pass. Missing/corrupt backup rejection, pre-commit
connection-termination rollback, owner isolation and stable retry pass. Final
build/TypeScript, lint and existing focused suite 69/69 pass; cleanup confirmed.

**Initial safety finding:** an older snapshot restores a later-deleted entry/account
and loses a newer accepted edit. Independent deletion suppression remains
unimplemented in production. The follow-up local replay is summarized in the
[runbook](BACKUP_RESTORE_RUNBOOK.md#local-reconciliation-follow-up).
Local timings do not certify production recovery or 30-day expiry.
No product-code, migration-file, hosted-resource or live-sync change; original backup untouched.
[Evidence](USER_JOURNEY_TESTING.md#local-synthetic-backup-and-restore--2026-11-15)
and [procedure](BACKUP_RESTORE_RUNBOOK.md).

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

The audit was followed by the local rehearsals above and in the runbook.
No new dump, restore, provisioning, product code, migration, live-sync
activation, commit or deployment occurred during the audit.

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

## Ordered work

| Order | Work | Current limit and next review |
| --- | --- | --- |
| 0 | Content Admin/catalog/media | Habit/Protocol authoring, Explore and local adoption are implemented. Migration 004 is applied. Synthetic hosted/browser acceptance passed with exact cleanup. Second invitation, operational and device gaps remain open. [Template evidence](USER_JOURNEY_TESTING.md#approved-hosted-template-acceptance--2026-11-14) |
| 1 | Critical journey and current-tool acceptance | Home Imprint review is complete. The developer reported checking published Chapters and reported Protocol working. Build and device details remain open, alongside broader phone/browser coverage and ResizeObserver notices. [Current gaps](../bugs.md#current-gaps) |
| 2 | Production writing recovery and activation readiness | Both migrations and bounded hosted checks passed, including production-store recovery and session cases at mobile Chromium widths. Real-device restart, offline load and eviction, true lock contention and operational safeguards remain open. Automatic sync stays off. [Writing evidence and gates](ACCOUNT_WRITING_SYNC.md#verification-and-activation-gates) |
| 3 | Remaining record sync and operating recovery | Chapter and Log pilots have bounded evidence. Hosted Log, hosted checks of the later Chapter changes, wider domains, device recovery and operating checks remain pending. Personal import needs its own owner mapping, backup and rollback approval. |
| 4 | Replacement onboarding and needed Home behavior | Use the planned required-answer/one-habit flow, replacing the old optional-action plan. Resolve records, existing-user transition, uncertain answers, final completion and Home mapping. Keep records/history and safe-sync prerequisites. |
| 5 | Membership/admin | Server-enforced fixed-day grants, renewal/expiry/revocation, audit and usage reservations. Set actual amounts, reset math, spending/alert/pause controls and operations. |
| 6 | Requested Athena | Provider/model, relevant same-owner evidence, English response/Burmese-input quality, short Reflect readings, optional question, separate replies and sourced correction controls. |
| 7 | Beta readiness and authorized release | Real devices, installation/update, regions, privacy/deletion/recovery, support, feedback and rollback. Agree duration/devices/success criteria; release only on request. |

A newly found data-safety or blocked-launch defect interrupts dependent work.
Membership/Athena and onboarding scheduling can be refined within
[Roadmap's dependencies](ROADMAP.md#dependency-sequence). No broad optimization
or cosmetic checklist must finish before all other work. Each optimization
needs a named measured problem and verification before/after.

## Decisions needed by slice

| Before | Review |
| --- | --- |
| Sync/recovery | Production adapter/device evidence; live-role/session cases; real lock contention; operation/receipt retention; stale-device and restore suppression; deletion coverage/turnaround; log retention/read auditing |
| Onboarding | Exact validation/uncertain answers; birthday eligibility; email-link recovery; final terminal placement; existing-user entry and preservation; owner/revision/history/deletion/sync contracts; feeling correction and multi-device prompting |
| Home | Replacement-onboarding inputs, unanswered-question treatment and how to carry the current signed-in Imprint forward. The review's current mapping and timing are in the [Home brief](PERSONAL_IMPRINT_HOME.md#signed-in-home-imprint--2026-11-23). |
| Athena | Wrong/Has changed/Forget scope, undo and recurrence prevention; old-reading qualifications; source invalidation; provider facts, tone/quality and budget |
| Membership | Allowance/counting, Myanmar reset hour, monthly-cycle/renewal math, retry/no-change accounting, price/payment operations |
| Release | Public signup rollout versus limited tester release; supported phones/browsers; Myanmar/Thailand connections; duration/success criteria; lost-email proof, data-use wording, support/feedback/rollback |

Do not reopen settled choices merely because implementation is unfinished.
The planned onboarding replaces the old flow; it requires one chosen daily
habit and has no Skip actions. Its uncertain-answer and existing-user details
are still open. A chosen name need not be a real name.

## Deferred work

- Reflect replacement layout, direct discovery writing and Keep in Reflect:
  [saved proposal](REFLECT_PAGE_POTENTIAL_IMPLEMENTATION.md).
- Personal form generation from replacement-onboarding answers and Home tool
  shortcuts. [Home brief](PERSONAL_IMPRINT_HOME.md).
- Past Habit completion corrections, shared day view, advanced search,
  timers, leaderboards, broad optimization/refactors and further chapter
  simplification.
- Native framework/delivery. Live chapter publishing is now in the Admin-first
  workstream, superseding its previous after-beta deferral.

## Verification to carry forward

Local tool and hosted-catalog checks cover desktop Chromium at mobile widths.
Physical phones, other engines, the deployed Chapter journey and the broad
suite remain outside that evidence. The earlier Habit source checks have passing
behavioral replacements. ResizeObserver notices remain open. Historical test
results carry their original dates and scopes.

The earlier writing test-store proof was followed by isolated hosted checks
using the production store. Activation remains off. True lock contention, device
eviction, hosted backup/retention and other-domain sync remain open.

Use [bugs](../bugs.md), [journey evidence](USER_JOURNEY_TESTING.md) and
[writing limits](ACCOUNT_WRITING_SYNC.md#verification-and-activation-gates).
Earlier queue entries and their evidence are preserved in the
[archive](archive/2026-11-11-doc-cleanup/WORK_PLAN.md).
