# Circle OS web beta launch plan

Date: 2026-10-31. Status: launch planning approved; implementation not started.
The developer approved saving this plan and aligning the product, roadmap,
decision log, architecture, current task, and handoff. This is documentation
approval, not permission to provision accounts, migrate data, or deploy.

## Launch target

Invite 10-20 people, mainly in Myanmar and Thailand, to the current web app
with Home Screen installation, email/password login, safe sync, and paid Athena.
Keep the Circle identity, shared App Box/Page system, and existing core tools.
No native app or app-store distribution is in this release.

This plan supersedes the earlier core-first, personalized-Athena-later release
order. It does not certify Phase 1, erase bugs, or waive the development cycle.
Fix data-safety failures and blocked launch journeys as they are found. Other
stabilization and optimization work remains visible and deferred where safe.

Planning estimate: 4-6 weeks of focused collaboration, including developer
review and verification. This is not a delivery commitment. Migration, sync,
real-device failures, AI quality, and unresolved choices may extend it.

## Product boundary

| Free | Paid |
| --- | --- |
| Existing core tools and chapters | New personalized Athena generation |
| Personal records and sync | Configurable Athena allowance |
| Previously received readings remain readable after paid expiry | Time-limited Athena generation access |

Membership belongs to the account and applies in the browser and Home Screen
app. Do not infer paid status from installation. No automatic billing is planned
for beta: the developer confirms payment and grants prepaid access manually.

Required admin capabilities: find an account, grant 30, 90, 180, or 365 days, choose
an exact expiry, extend or revoke access, inspect usage, adjust limits, and
review an audit history. Ordinary users cannot edit grants or limits. The
server checks current entitlement on every generation request; expiry must
not depend on a cleanup job or a stale browser/JWT flag.

Confirmed renewal starting point (2026-10-31): extend from the current expiry
while membership is active, or from the grant time once it has expired. This
preserves unused paid time. Standard access durations are fixed 30, 90, 180,
or 365 days (confirmed 2026-10-31), rather than calendar months or years.
Use these explicit day counts; the 365-day option is not twelve 30-day periods.
Month-end adjustments do not apply. Access ends at the same time of day after
the selected duration, measured from the agreed renewal starting point;
display expiry in the person's local timezone (confirmed 2026-10-31).
Timestamp storage and date-calculation details require implementation review.
Expiry stops new generation, not local
saves, sync, or access to personal records. Previously received readings remain
readable after paid access expires (confirmed 2026-10-31). This access rule is
separate from the deletion and backup rules below.

## Delivery sequence

| Stage | Scope | Exit evidence |
| --- | --- | --- |
| 1. Launch contract | Confirm free/paid boundary, recovery, privacy, Athena behavior, budget, and beta support | Reviewed decisions and acceptance criteria |
| 2. Accounts | Create/configure Supabase, verified email/password recovery, alias, persistent login/logout, account-separated local storage | Own-account access passes; other-account and signed-out access fail, including retained local data and shared-device switching |
| 3. Records and sync | Versioned ownership schema, policies, acknowledged/idempotent sync, clearing/conflict rules, validated owner migration | Offline edits, retries, repeated reloads, two devices, stale merges, backup and restore preserve records |
| 4. Membership admin | Protected admin roles, grants/expiry/audit history, per-user and global controls | Unauthorized changes fail; extension, revocation, expiry, and simultaneous requests behave correctly |
| 5. Athena | Choose provider/model, constrained evidence selection, generation, validated readings, follow-up behavior, quotas and failure handling | Grounded synthetic scenarios, source isolation, freshness/corrections, enforced usage/cost limits, safe failure |
| 6. Beta readiness | Home Screen installation, app updates, critical fixes, manual deletion, backups/restore, admin-only diagnostics, operating and recovery instructions | Agreed real-phone journeys and production-build checks pass; deletion and 30-day backup expiration are verified; no user export/download in beta |
| 7. Release | Invite instructions, processing explanation, feedback route, deployment and monitoring | Explicit developer deployment approval, then verification in the deployed environment |

First code slice: propose accounts and account-separated local storage with
synthetic-user tests. Confirm how an authenticated account claims an existing
profile before implementing any migration. A device must never silently attach
the previous person's local records to the next account.

## Athena launch contract still to review

Confirmed reply rule (2026-10-31): Athena replies only when the person asks.
Saving a reflection, including an answer to Athena's question, saves dated
personal evidence without requesting an AI reply. A requested reply is a
separate action subject to the Athena allowance; saving reflections stays free.
Keep saving and reply requests separate, with the reply rule in one place so
it can change later without changing existing records. This is an approved
implementation direction, not a claim that the behavior is built.

Confirmed reading flow (2026-10-31): the person requests a reading. The
requested reading appears automatically when ready, without a second request
to reveal it. Automatic appearance does not mean automatic preparation of
unrequested readings. This is planned behavior, not implemented behavior.

Confirmed reading location (2026-10-31): Athena readings live in the existing
Reflect experience. Each reading includes one optional reflection question
(confirmed 2026-10-31). The person may leave it unanswered; answering saves a
reflection without triggering a reply.
Readings are short, straight to the point, calm, and advisory. Exact tone and
language guidance will be configured later in a skill or similar instruction
file; no new file or Athena philosophy is authored by this plan.
Requested follow-up questions have no fixed count limit beyond usage allowance.
Replies may use all evidence available to Athena for that person, including
their whole history within the allowed categories. This supersedes the earlier
bounded-follow-up proposal. Automatic replies and autonomous actions remain
outside scope. Exact controls, supported languages, and usage amounts remain open.

Provider/model selection is deliberately deferred until integration. No AI API
account exists yet according to the developer. No provider, credentials, or
operational scheduler is assumed. Do not invent Athena's philosophy or author
the developer's wisdom/practice positions as part of plumbing.

Confirmed usage rules (2026-10-31): daily limits reset in Myanmar time
(`Asia/Yangon`). Unused daily allowance carries forward within the person's
membership cycle, then disappears at the monthly reset for that cycle; monthly
allowance does not carry forward. Failed requests consume no user allowance.
The monthly reset follows the person's membership cycle, not a calendar month.
Exact reset hour, monthly-cycle calculation for the 30/90/180/365-day grants,
expiry/renewal effects, allowance amounts, counting units, input/output limits,
per-user overrides, retry/no-change accounting, total budget, and pause/alert
thresholds remain open. Do not invent these values from the reset decision.
Reserve usage atomically before requests and settle or release reservations
so failed requests are not charged and concurrent calls cannot bypass limits.
Failed calls may still incur provider cost; account for that separately from
the user's allowance. Expose simple allowance/reset information without
internal prompt or billing details. Prices and payment details are deferred.

Generation uses server-selected, user-scoped evidence and never receives
database administrator credentials. Preserve original records, source links,
inference labels, corrections, immutable reading editions, and no-change
publication behavior. The core app must work when Athena is unavailable.

## Infrastructure and privacy decisions

- Email/password and a separate display alias are confirmed. Supabase project
  creation is pending; the developer does not yet have a project.
- New users must verify their email before using their account (confirmed
  2026-10-31). Verification delivery and link handling require implementation
  review and testing; this is not an implemented access gate.
- Password recovery uses a reset link sent to the account's verified email
  address (confirmed 2026-10-31). Manual recovery will also be offered when
  the person loses access to that email (confirmed 2026-10-31). Ownership
  checks and the manual process remain to be reviewed. Verification-link and
  delivery setup, reset-link handling, and session/device recovery still need
  implementation review. This decision does not mean recovery is implemented.
- Singapore is the chosen database region for Myanmar/Thailand users (confirmed
  2026-10-31). Check setup availability and measure actual connections from both
  Myanmar and Thailand before launch. Region selection
  does not settle AI processing location or every infrastructure transfer.
- No separate AI opt-in prompt is required before requesting an Athena reading
  (confirmed 2026-10-31). The person requests the reading directly. The developer
  will explain data use manually on the website or social pages and tell users
  not to enter sensitive information. Exact wording and publication remain pending.
  The developer accepts processing Athena needs without additional provider
  privacy restrictions at this planning stage. Actual provider retention,
  training use, and processing locations must still be documented at integration;
  no provider terms or capabilities are assumed verified.
- Allowed reading evidence (confirmed 2026-10-31): relevant notes, reflections,
  goals, habits, and activity records belonging to the requesting person.
  Athena may draw on the person's whole history; login and payment details
  stay out of the AI context. Exact evidence selection
  and exclusion checks require implementation review and verification.
- Admin has always-available read-only access to personal writing; a separate
  user-approved support case is not required. Admin-only error logs may contain
  personal writing. Log retention and read-access audit details remain open.
  Read-only writing access is distinct from the approved account-deletion power.
- Account deletion is manual: admin deletes the account and its data on request.
  Deleted data may remain in backups for at most 30 days. Deletion turnaround,
  coverage of retained devices/logs/provider copies, and restore suppression
  require an implementation proposal and verification.
- Users cannot download or export their data in beta. This supersedes earlier
  user-export launch requirements; operational backups and recovery remain gates.
- Login should persist until the person logs out. Local records may remain
  stored, but must stay account-separated and inaccessible to another account
  or a signed-out person. Session renewal, revocation/lost-device handling, and
  logout behavior require implementation review; no permanent-session guarantee
  is claimed for the current runtime.
- The person chooses between conflicting device edits. The Circle day still
  starts at 06:00 and its timezone follows the person. Exact conflict UI and
  timezone-change handling must preserve dated evidence and need review.
- Use synthetic accounts until isolation and recovery checks pass. Never clear
  or hand-edit the owner's generated profile/day data as a shortcut.

## Paused and deferred scope

Further chapter simplification is paused; completed Day One v3 stays. Keep
the [simplification plan](CHAPTER_SIMPLIFICATION_PLAN.md) as historical proposal
evidence rather than deleting it. Compact Log, broad refactoring, cosmetic work,
timers, leaderboards, native apps, and advanced chat/memory expansion beyond
the approved requested follow-ups are not beta requirements. Keep
[bugs](../bugs.md) visible; deferrals need reasons when
the launch audit establishes their severity.

Live admin chapter publishing without compilation stays after beta (confirmed
2026-10-31).
The existing chapter-authoring editor/export flow remains; it is separate from
the user personal-data export deferred above. Future live publishing needs validated
supported page types, preview/publish/rollback, offline caching, and immutable
versions for existing runs. Arbitrary new actions and page types still need
code. Promote it into launch scope only after reviewing the added work.

## Verification and release gate

Follow the [workflow](DEVELOPMENT_WORKFLOW.md): code, test, fix, verify, measured
optimization when justified, then reverify. Run focused model and mobile browser
checks plus appropriate production build/lint. Preserve local-first revisions,
clearing edits, one profile per account, immutable chapters/readings, 06:00 Circle
days, and existing geometry. Geometry changes require the standard measurements.

Release evidence must cover two-user/signed-out isolation through client,
server, admin, and AI paths; session expiry/recovery; account switching;
offline edits and retries; sync acknowledgements/conflicts; migration recovery;
grant expiry and quota concurrency; AI empty/stale/hostile evidence and outages;
admin read-only writing access and admin-only logs; manual deletion and backup
expiration within 30 days; operational restore; no user export/download;
membership-cycle allowance resets/carry-over and failed-request release;
person-chosen conflicts and timezone changes; Home Screen install/update; and agreed real devices in
the target regions. Neither source inspection nor a passing build certifies
these paths. The developer will monitor the beta. The feedback route, detailed
recovery/rollback procedure, accepted limits, and release evidence remain to be
reviewed. Supported devices/browsers, beta duration, and success criteria are open.

Existing gaps remain: standalone TypeScript's recorded `cloudflare:workers`
failure, shell lint baseline, broad suite/lint, physical phones, other browsers,
and real sync acknowledgement/retry certification. Historical results live in
[journey evidence](USER_JOURNEY_TESTING.md) and the [handoff](SESSION_HANDOFF.md).

## References

- [Product](PRODUCT.md), [roadmap](ROADMAP.md), [decisions](DECISION_LOG.md),
  [architecture](PRODUCTION_ARCHITECTURE.md), [current task](CURRENT_TASK.md).
- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords).
- [Supabase data residency](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq)
  and [region migration](https://supabase.com/kb/troubleshooting/change-project-region-eWJo5Z).

No application changes, runtime verification, staging, commits, account
provisioning, migration, or deployment are claimed by this documentation task.
