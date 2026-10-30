# Circle OS roadmap

Updated: 2026-10-30.

Destination: an Athena-powered iOS and Android app with Supabase as its backend.
Delivery goal for this project: a web MVP for friends and family to test before
the native app. [Product direction](PRODUCT.md) records the agreed intent.

Current phase: **Phase 1 — stabilize existing behavior**. Planning documents
have been aligned, but the implementation baseline and current feature audit
remain to be completed. Existing browser checks are evidence for their recorded
paths only. No phase is complete merely because its code exists.

The developer's required order is: fix and verify current features, optimize
and verify again, then add features. The later sequence below is a proposed
delivery plan; its open product decisions are not silently resolved by a date.

## Phase 0 — establish the product and working rules

Recorded in this documentation update:

- Web MVP first, followed by iOS and Android.
- Supabase as the intended backend and personalized Athena as the end-product
  differentiator.
- Privacy, pseudonymous identity, and recovery as explicit design concerns.
- Repository documents replace unavailable external product authorities.
- The development cycle is [documented](DEVELOPMENT_WORKFLOW.md).

Confirmed test scope: friends and family test the stabilized core first; new
personalized Athena follows afterward. Existing prepared readings remain in
the current feature audit. Still open: login and recovery, initial tester
scope, and whether gamification belongs in a later MVP iteration. See
[decisions](DECISION_LOG.md).

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

Depends on: Phase 1's baseline and coverage of the paths being changed.

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

Depends on: stabilization and optimization gates; agreed login/recovery and
data-processing design. This phase implements new infrastructure after the
current-feature work.

Work:

- Select authentication that satisfies the approved identity and recovery
  requirements. Email collection remains an open decision.
- Define a versioned database schema and user ownership. Separate private
  lifestyle evidence from authentication and optional public summaries.
- Implement authorization policies and tests for both allowed access and
  denied cross-user access, including server and background-job paths.
- Migrate existing local/profile-server records with backup, validation, and
  a recovery plan. Retain local saves and an acknowledged sync outbox.
- Add session handling, account recovery, export, deletion, operational backups,
  restore checks, and a clear explanation of data destinations.
- Resolve timestamps, the 06:00 Circle day, timezone changes, conflicts,
  duplicate requests, and edits that clear values.

Exit criteria:

- Two synthetic users cannot read or change each other's private records.
- Restore, device/session loss, offline changes, retry, and corrections are
  verified without duplicate profiles or silently restored old values.
- Migration preserves representative histories and can be recovered.
- Supabase is configured and tested; a schema document alone is insufficient.

## Phase 4 — deliver and evaluate the core web MVP

Depends on: stabilization, verified optimizations, the privacy/recovery checks
required for the selected test environment, and explicit release authorization.
New personalized Athena integration is not a gate. Supabase remains the target;
an earlier bounded core trial need not wait for that migration if the developer
agrees its data environment and limits.

Work:

- Agree tester count, test duration, supported browsers, and what useful
  reflection and motivation look like to a tester.
- Use a clear invitation, setup, privacy explanation, recovery path, and
  feedback channel. Keep private evidence out of bug-report collection.
- Verify the chosen production runtime, update behavior, offline/reload paths,
  and existing installation support on real phones.
- Observe first-day and later-week use; fix and reverify reported problems.
- Evaluate current prepared readings without introducing a new AI provider or
  claiming new personalized inference is present.
- Assess whether the product helps people reflect and act on their own goals,
  rather than counting app visits as proof of value.

Exit criteria:

- The agreed journeys and privacy/recovery checks pass in the deployed tester
  environment. Local checks do not stand in for deployment verification.
- Testers can use the app repeatedly and report understandable outcomes.
- The final handoff records remaining defects, accepted limits, architecture,
  operating requirements, and the evidence informing mobile development.

## Phase 5 — add personalized Athena after the core test

Depends on: feedback from the stabilized-core trial, authorized user-scoped
evidence, and approved AI processing choices. This is a follow-up to the first
web MVP test.

Work:

- Use core-test feedback to choose the first reflection and follow-up question
  experience, then choose provider, retention, cost budget, and cadence.
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
- Repeat the friends-and-family test with Athena to evaluate its value, tone,
  latency, and cost against the experience of using the core alone.

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

Establish the current implementation baseline, then close the saved-state
Habit recovery and Reflect-evidence verification gaps. Continue through
`bugs.md` one issue at a time using the documented development cycle.
