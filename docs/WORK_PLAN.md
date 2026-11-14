# Circle OS work plan

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
