# Circle OS work plan

## Backup work deferred — 2026-11-23

The developer approved a maximum loss window of 24 hours for synced edits in
the friends-and-family beta. Defer hosted backup work and spending until after
the planned Supabase upgrade. Resume by checking the upgraded plan's database
backup schedule and retention, then separately review media coverage, deletion
and revocation safeguards, and an isolated hosted restore. Safe restore and the
30-day deleted-backup limit remain beta requirements. [Backup runbook](BACKUP_RESTORE_RUNBOOK.md).

Continue with current journey verification. The direct hosted Chapter resume
and finish path is the next candidate for a reviewed slice. The Home visual
review can wait. [Latest Chapter evidence](USER_JOURNEY_TESTING.md#chapter-finishes-on-home-imprint--2026-11-22).

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

Queue status — 2026-11-14: developer approved completing local templates, starting
with the specified Explore layout. Explore and Habit/Protocol adoption are
implemented. Approved migration 004 and isolated hosted/browser acceptance are
complete, including exact cleanup. Never reapply 001–004. Next review the product
and author real content deliberately; remaining device/operating gaps persist.

Updated: 2026-11-11, Asia/Bangkok. This is the working queue under
[Roadmap](ROADMAP.md). A queued item is not approval to edit, provision, migrate,
activate sync or deploy. [Current Task](CURRENT_TASK.md) names the active job.

## Start here

The approved documentation cleanup aligns current rules and the replacement
[onboarding target](ONBOARDING_SPEC.md). Existing full-page tool work remains
uncommitted. The developer's lived review of the latest Protocol interaction
remains outstanding unless separately completed.

The active scope is local Explore/template completion and preparing the concrete
hosted acceptance procedure. Remote migration/testing remains separately gated.
Reflect implementation is explicitly deferred.

## Ordered work

| Order | Work | Current limit and next review |
| --- | --- | --- |
| 0 | Content Admin/catalog/media | Local Habit/Protocol authoring, Explore and adoption are implemented under the reviewed contract. Review the prepared migration 004 and real synthetic hosted/browser procedure for separate approval. Second invitation/operational/device gaps remain open. |
| 1 | Critical journey and current-tool acceptance | Preserve latest local tool/Protocol evidence. Reproduce open defects against current code; distinguish old fixture failures from current app defects. Phone keyboard/caret, other engines and ResizeObserver remain gaps. The stale Habit setup/identity source checks have verified behavioral replacements; see the 2026-11-14 cleanup journey entry. |
| 2 | Production writing recovery and activation readiness | Both migrations and bounded hosted resolution/test-store checks exist. Review production writing-store reload/restart, offline load, eviction/recovery, session expiry/revocation and actual phones before any activation proposal. Do not reapply migrations. |
| 3 | Remaining record sync and operating recovery | Review per-domain ownership, revisions, atomic local/outbox writes, exact receipts, conflicts, deletion, backup/restore and admin/log access. Personal import needs its own owner mapping, backup and rollback approval. |
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
| Home | Personal Imprint silhouette and source mapping, unanswered-question treatment, time-window/fading/brightness, Log end-time interpretation and Protocol placement |
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
- Personal Imprint production rendering until its mapping is reviewed:
  [Home brief](PERSONAL_IMPRINT_HOME.md).
- Past Habit completion corrections, shared day view, advanced search,
  timers, leaderboards, broad optimization/refactors and further chapter
  simplification.
- Native framework/delivery. Live chapter publishing is now in the Admin-first
  workstream, superseding its previous after-beta deferral.

## Verification to carry forward

Latest bounded local tool evidence does not certify physical phones, other
browser engines, hosted sync or the broad suite. The earlier Habit source-text
failures have passing behavioral replacements; ResizeObserver notices remain
open. Historical test/lint/TypeScript failures are dated scopes, not fresh
results against today's tree.

Hosted writing reload proof uses a separate test store, not the production
writing adapter. Activation remains off. Session expiry/revocation, lock
contention, device eviction, backup/retention and wider sync remain open.

Use [bugs](../bugs.md), [journey evidence](USER_JOURNEY_TESTING.md) and
[writing limits](ACCOUNT_WRITING_SYNC.md#verification-and-activation-gates).
Earlier queue entries and their evidence are preserved in the
[archive](archive/2026-11-11-doc-cleanup/WORK_PLAN.md).
