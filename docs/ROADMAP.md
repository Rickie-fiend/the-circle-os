# Circle OS roadmap

Updated 2026-11-23, Asia/Bangkok. This owns delivery dependencies and release
gates. [Product](PRODUCT.md) owns behavior; [Work plan](WORK_PLAN.md) owns the
ordered queue. No plan grants implementation or deployment approval.

## Delivery direction

Ship a mobile-first web beta for 10–20 friends/family testers, mainly in Myanmar
and Thailand, with accounts, safe sync, redesigned onboarding, manual membership
and requested paid Athena. iOS/Android follows learning from the web beta.

The replacement onboarding is [ONBOARDING_SPEC.md](ONBOARDING_SPEC.md).
The optional-action Day One plan is superseded as the future target. Current
Day One versions and old runs remain intact pending reviewed replacement.
Public signup is a target; public rollout and beta release are separate choices.

The earlier sequence requiring all stabilization and broad optimization before
accounts/Athena is retired. Critical safety and blocked launch journeys still
gate dependent work. Each approved slice follows the
[development cycle](DEVELOPMENT_WORKFLOW.md); optimize only a measured problem.
Already approved visual slices are not undone by the broad-optimization deferral.

## Admin-first priority

The developer prioritizes [Content Admin and the shared catalog](CONTENT_ADMIN_PLAN.md)
first: account-bound access, Supabase content/media, then editors for chapters,
articles/blogs with images, habits and Protocols; Explore consumption follows.
This supersedes the earlier after-beta publishing deferral. Critical safety and
blocked journeys still gate dependent changes; other release requirements remain.
Implementation, remote setup and publication need reviewed scopes.

## Current delivery state

| Workstream | State and practical limit |
| --- | --- |
| Accounts/local isolation | Implemented. Hosted entry/reset/logout and offline return have recorded or developer-reported evidence. Isolated Chromium checks covered session renewal, rejected refresh and natural expiry. Mail delivery, lost-device recovery and wider-device coverage remain open. |
| Content Admin foundation | Chapters/Articles/media/Catalog, Routine/Protocol editors, Explore and local adoption have bounded evidence. Migration 004 is applied and synthetic hosted template acceptance passed with exact cleanup. The catalog Chapter resume and finish check passed in a local production build with hosted data. The deployed journey, second invitation and operational/device gaps remain open. |
| Existing tools and histories | Writing, Habit Record, prospective Protocol terms, Log correction/history, read-only Week/chapter/reading history delivered for bounded scopes. Six-tool local visual/interaction evidence is recorded; lived/device acceptance is separate. |
| Writing cloud foundation | Both writing migrations are applied. Bounded two-account, conflict, reload and production-store recovery checks passed against hosted services. Automatic product sync remains off. |
| General safe sync and operations | Other-domain sync, wider device recovery, personal migration, deletion and protected admin operations remain incomplete. Local synthetic backup and reconciliation passed in a rehearsal. Hosted backup and restore work is deferred until the Supabase upgrade. |
| Onboarding/Home | The developer reviewed the implemented signed-in Personal Imprint. Replacement onboarding, personal form generation from its answers and transition rules remain planned. |
| Membership/live Athena | Planned; no provider, live generation or server-enforced paid service is certified. |
| Beta readiness/release | Not certified or authorized. Historical Phase 1 is not certified either. |

Use [architecture](PRODUCTION_ARCHITECTURE.md), the
[sync contract](ACCOUNT_WRITING_SYNC.md), [bugs](../bugs.md) and
[journey evidence](USER_JOURNEY_TESTING.md) for bounded claims.
Applied non-idempotent migrations must not be reapplied.

## Dependency sequence

| Stage | Required outcome | Exit evidence |
| --- | --- | --- |
| 1. Contracts and critical journeys | Agree each bounded slice; resolve data-safety, cross-account or blocked-path defects before affected work | Reproduction or qualified non-reproduction, intended behavior, focused checks and isolated mobile runtime evidence |
| 2. Records and safe sync | Reviewable histories, durable owner-scoped local/remote writes, exact acknowledgements, chosen conflicts, clearing/deletion and recovery | Production adapters, offline/retry/lost response, two-account denial, device restart, account changes, stale devices and backup/restore checks |
| 3. Replacement onboarding | Implement the planned flow after records/history and safe-sync prerequisites; preserve old access, versions and runs | Public signup/verification recovery, branching, interruption/offline resume, one habit creation, actual previews, birthday/feeling ownership, no duplicate outcome or AI request |
| 4. Membership/admin | Manual grants/revocation/expiry, audit, usage reservations and spending controls | Server-enforced entitlement, fixed-day renewal, concurrency, failed-request release, free core/old readings after expiry |
| 5. Requested Athena | Authorized same-owner evidence, requested reading/reply, sourced observations and reviewed correction controls | Grounded multilingual synthetic cases, exclusion/correction propagation, safe failures, no generation on save, observed cost/latency |
| 6. Beta readiness | Working target journeys, installation/update, privacy/recovery and operations in the chosen environment | Actual phone/browser/region evidence, deletion/restore, feedback/support/rollback, named accepted limits |
| 7. Authorized release and observation | Developer-authorized deployment; observe first days and later weeks | Verification in the deployed tester environment, understandable tester outcomes and reverified fixes |

Onboarding stays after records/history and safe sync and before readiness.
Its scheduling relative to membership/Athena can be reviewed without removing
those dependencies. A finished Personal Imprint formula or the deferred Reflect
redesign is not silently added as a release gate. Required Home destination
behavior must be reviewed with onboarding; do not invent placeholder content.

## Release gates

- No unresolved data-loss, cross-user disclosure or core-path blocker.
- Representative phone browsers verify setup, returning use, chapter resume,
  completion/corrections, reload, offline behavior and installation/update.
- One profile per account; owner checks also cover server/background paths.
  Offline-entry proof never grants remote write authorization.
- Migrations preserve representative histories and have backup/rollback.
  Personal legacy import has explicit ownership and approval.
- Manual deletion, backup expiration within 30 days, restore suppression,
  retained-local isolation, protected admin writing access and admin-only logs
  have evidence. No beta user export/download is required.
- Essential histories preserve wording, dates, immutable chapters/readings and
  deliberate corrections. Completed Week reviews stay read only; past Habit
  corrections and the shared day view are deferred.
- Free/expired users retain core tools, history, sync and received readings.
  Paid generation has verified ownership, allowance and failure accounting.
- Published data-use/provider facts, lost-email recovery, support/feedback,
  rollback and accepted operating limits are understandable.
- Agree supported devices/browsers, regional checks, duration and success
  criteria before readiness. The old 4–6 week estimate is retired.
- Local builds and synthetic checks do not stand in for hosted/device acceptance.
  Release always needs explicit authorization.

## Later work

Use beta evidence to choose broad performance/refactor work, search, further
chapter simplification and optional gamification. Define fairness, privacy and
scoring before any leaderboard. Content Admin now follows the Admin-first priority above.
Native continuation requires separate framework, storage/session, accessibility,
lifecycle and release-migration decisions.

Next work is selected from [WORK_PLAN.md](WORK_PLAN.md), not from the retired
numbered-phase history in the [archive](archive/2026-11-11-doc-cleanup/ROADMAP.md).
