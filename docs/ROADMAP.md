# Circle OS roadmap

Updated: 2026-10-31.

Destination: an Athena-powered iOS and Android app with Supabase as its backend.
Delivery goal for this project: a web MVP for friends and family to test before
the native app. [Product direction](PRODUCT.md) records the agreed intent.

Current priority: **prepare the invited web beta with accounts and paid
Athena**, following [the launch plan](WEB_BETA_LAUNCH_PLAN.md). The developer
approved recording this new sequence on 2026-10-31. Phase 1 is not certified;
its evidence and unresolved gaps remain. Critical data-safety and blocked launch
journeys must be fixed. Broad optimization and further chapter simplification
are deferred, not declared complete.

The active order is launch contract, accounts/local isolation, private records
and sync, membership admin, Athena, beta verification, then authorized release.
The development cycle still applies to each change. The numbered phases below
retain the earlier work breakdown; their original strict sequencing is
superseded where it conflicts with this approved beta route.

## Phase 0 — establish the product and working rules

Recorded in this documentation update:

- Web MVP first, followed by iOS and Android.
- Supabase as the intended backend and personalized Athena as the end-product
  differentiator.
- Privacy, pseudonymous identity, and recovery as explicit design concerns.
- Repository documents replace unavailable external product authorities.
- The development cycle is [documented](DEVELOPMENT_WORKFLOW.md).

Current test scope: 10-20 invited users mainly in Myanmar and Thailand, with
email/password, a separate alias, Home Screen installation, and paid Athena.
The launch contract now defines recovery routes, admin access, deletion/backup
limits, no user export, and Athena's requested reading/follow-up behavior.
Implementation details and the remaining choices in the launch plan stay open.
Gamification is deferred. See [decisions](DECISION_LOG.md).

## Phase 1 — stabilize existing behavior

Goal: make the current daily and weekly experience dependable before expansion.

Work:

1. Establish an exact baseline: branch, current changes, build, focused tests,
   lint, and the supported production build. Record existing failures rather
   than attributing them to later fixes.
2. Complete the two known verification gaps: recovery of an already-completed
   broken Habit run, and Reflect's response to saved synthetic activity.
3. Reproduce and resolve reported failures in order of impact: lost or wrong
   data, blocked journeys, unintended changes, then presentation defects.
4. Cover fresh setup, return visits, skipped/resumed chapters, edits, final
   completion, reload, server restart, and offline behavior.
5. Verify the same chapter outcome through built-in, publication, and Quest
   entry points. A saved answer must reach its intended app record.
6. Reconcile conflicting interaction rules before changing their behavior.
   Review idle rotation, Note/Line behavior, default frame sizing, and the
   meaning of character, identity, and declarations.

Exit criteria:

- The developer's approved core journey works on representative phone browsers.
- No known unresolved data-loss, cross-user disclosure, or core-path blocking
  defect remains; lower-impact deferrals name their reason and owner.
- Browser records demonstrate input, correction, persistence, and truthful
  reflection. Tests use isolated data.
- Bug statuses distinguish verified fixes, non-reproductions, decisions, and
  untested paths. Right-swipe-back remains as previously chosen unless changed
  by an explicit new product decision.
- Existing runtime regressions and failures are fixed or explicitly accepted.

## Phase 2 — optimize the existing system and verify again

Depends on: a measured problem and coverage of the paths being changed.
Broad Phase 2 work is deferred; launch-critical optimization may be proposed
with evidence without treating this entire phase as a beta prerequisite.

Work:

- Measure startup and time to usable local content under a slow/offline server.
- Establish shared domain actions for chapter outcomes so entry points agree.
- Separate persistence/sync, domain updates, chapter delivery, and app views
  from the large shell in small reversible changes.
- Consolidate duplicated state types and document authoritative records versus
  evidence and derived projections.
- Measure App Box geometry, transitions, typing, accessibility, and reduced
  motion on mobile; preserve the established visual language.
- Measure requests, payload size, and growing local history before optimizing
  them. Avoid changes justified only by preference or file size.

Exit criteria:

- Every optimization has a named problem, baseline, and result.
- Relevant checks run before and after the change, including the affected
  browser journey and data persistence.
- No accepted product behavior or measured invariant changes accidentally.

## Phase 3 — add the private Supabase foundation

Depends on: an agreed login/recovery and data-processing design, reviewed
implementation slices, and preservation of existing data. Accounts and safe
sync now precede the beta without requiring every broad Phase 2 refactor.

Work:

- Implement email/password with a separate alias, email verification before
  account use, verified-email reset links, and manually handled lost-email
  recovery. Ownership checks and operational procedures need review.
- Keep login persistent until logout, with account-separated retained local
  records. Review session renewal, revocation, and lost-device behavior.
- Define a versioned database schema and user ownership. Separate private
  lifestyle evidence from authentication and optional public summaries.
- Implement authorization policies and tests for both allowed access and
  denied cross-user access, including server and background-job paths.
- Migrate existing local/profile-server records with backup, validation, and
  a recovery plan. Retain local saves and an acknowledged sync outbox.
- Implement protected always-available read-only admin access to writing and
  admin-only error logs, which may contain personal writing. Audit/log retention
  details require review.
- Add manual admin account/data deletion on request, operational backups with
  deleted data retained for at most 30 days, and verified restore. No user
  download/export is offered in beta; this supersedes the earlier export gate.
- The developer explains data use on the website or social pages and warns
  against sensitive input. Publish actual provider processing facts when chosen.
- Resolve timestamp details, person-chosen conflicting edits, duplicate requests,
  and clearing edits. The Circle day starts at 06:00 and follows the person's
  timezone; exact travel handling still needs review.

Exit criteria:

- Two synthetic users cannot read or change each other's private records.
- Restore, device/session loss, offline changes, retry, and corrections are
  verified without duplicate profiles or silently restored old values.
- Manual deletion, 30-day backup expiration, admin read-only access/admin-only
  logs, persistent sessions and retained-local isolation pass their checks.
- Migration preserves representative histories and can be recovered.
- Supabase is configured and tested; a schema document alone is insufficient.

## Phase 4 — deliver and evaluate the core web MVP

Depends on: launch-critical fixes, Supabase accounts/sync, manual membership
controls, the reviewed personalized Athena slice, privacy/recovery checks,
real-device verification, and explicit release authorization. This supersedes
the earlier proposal for a core trial before Supabase and new Athena.

Work:

- Agree tester count, test duration, supported browsers, and what useful
  reflection and motivation look like to a tester.
- Use a clear invitation, setup, privacy explanation, recovery path, and
  feedback channel. The developer monitors the beta. Error logs are admin-only
  and may contain personal writing; retention and the feedback route need review.
- Verify the chosen production runtime, update behavior, offline/reload paths,
  and existing installation support on real phones.
- Observe first-day and later-week use; fix and reverify reported problems.
- Evaluate existing prepared readings and the reviewed new Athena integration
  separately; do not claim live inference before implementation and verification.
- Assess whether the product helps people reflect and act on their own goals,
  rather than counting app visits as proof of value.

Exit criteria:

- The agreed journeys and privacy/recovery checks pass in the deployed tester
  environment. Local checks do not stand in for deployment verification.
- Testers can use the app repeatedly and report understandable outcomes.
- The final handoff records remaining defects, accepted limits, architecture,
  operating requirements, and the evidence informing mobile development.

## Phase 5 — personalized Athena workstream (now included in beta)

Depends on: authorized user-scoped evidence, server-enforced membership and
usage controls, and approved AI processing choices. A bounded first experience
now ships in the invited beta. Broader Athena development follows beta feedback.

Work:

- Implement person-requested readings that appear in Reflect when ready with
  one optional reflection question. Saving an answer triggers no reply; replies
  require a separate request. Follow-ups have no fixed count limit beyond usage.
- Use relevant evidence across the person's whole history for readings and
  requested replies, excluding login/payment details. Readings are short, direct,
  calm, and advisory; exact tone/language guidance will be configured later.
- No separate AI opt-in prompt is required. The developer accepts processing
  Athena needs without additional provider privacy restrictions at this stage;
  actual provider terms/locations and published data-use wording need review.
- Choose provider/model at integration. Exact allowances/counting, reset hour,
  monthly-cycle calculation, spending budget, prices/payment details, and
  retry/no-change rules remain open. Daily resets use Myanmar time; unused daily
  allowance carries within the person's membership cycle and clears at its
  monthly reset. Monthly allowance does not carry; failed requests consume none.
- Give Athena evidence through a constrained server service. The model receives
  selected records; it does not receive database administrator credentials.
- Deliver reflections, open questions, feedback, and motivation tied to the
  person's goals, completion history, and own words.
- Keep source references, observation versus inference, uncertainty, freshness,
  and the person's corrections explicit.
- Preserve authored reading editions and versioned content. Clarify when a
  conversational reply becomes evidence or a new reading.
- Handle empty evidence, stale data, service failure, cost limits, and prompt
  injection without altering unrelated records.

Exit criteria:

- Synthetic scenario checks demonstrate accurate reflection and useful open
  questions without invented evidence or cross-user leakage.
- A person can correct a wrong inference and understand how data is processed.
- The core app stays usable if AI is unavailable; recorded evidence stays safe.
- Membership-cycle allowance resets/carry-over, failed-request release, and
  concurrent quota reservations are verified. No budget amounts are assumed.
- Evaluate Athena's value, tone, latency, and cost in the invited beta, including
  whether the core remains useful and usable when generation is unavailable.

## Gamification decision track

Streaks and/or a leaderboard are intended possibilities, with points for
commitment and improvement. Their formula and MVP placement are not decided.
Do not add scoring while existing features are being stabilized.

Before implementation, settle what is measured, opt-in visibility, aliases,
missed days and corrections, differing abilities/goals, and manipulation of
self-reported activity. Compare private streaks with shared ranking in a
bounded experiment. Shared rankings require the private multi-user foundation;
they must not expose the evidence used for personal reflection.

## Phase 6 — mobile continuation after this project's web MVP

- Use the web trial to choose the mobile framework and supported platforms.
- Reuse domain rules, versioned data contracts, Supabase services, and privacy
  boundaries where appropriate; assess UI reuse separately.
- Verify native storage, secure session handling, offline sync, accessibility,
  lifecycle behavior, and release/update migrations on iOS and Android.
- Add notifications or other native capabilities only when their purpose and
  permission experience are decided.

This is the long-term destination, not an instruction to build native apps
during the current stabilization phase.

## Immediate next action

Review the open launch-contract decisions, then prepare a bounded accounts and
account-separated local storage proposal with exact files and synthetic-user
checks. Saved-state Habit recovery and fixture-based Reflect checks already
passed within their recorded scope; broader Phase 1 gaps remain. Follow
[the launch plan](WEB_BETA_LAUNCH_PLAN.md), keeping bugs visible and obtaining
approval before implementation, provisioning, migration, or deployment.
