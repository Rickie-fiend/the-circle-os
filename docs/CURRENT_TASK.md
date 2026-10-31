# Current task

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
