# Circle OS web beta launch plan

2026-11-05 scope update: Week reviews remain read only; review corrections are
removed from current scope. Past Habit completion corrections and the shared
day view are deferred, superseding their earlier prerequisite statements below.
The developer chose safe account sync next. The local queue and the later
approved account-writing SQL/access/transport slice are implemented and locally
verified. Hosted migration/activation and beta sync/recovery are not certified;
remaining hosted-access, backup/deletion, operational UI and wider-domain gates
still apply. See [the contract and activation steps](ACCOUNT_WRITING_SYNC.md).

Date: 2026-10-31. Updated: 2026-11-03 (Note contract). Status: launch planning approved;
account/local-isolation foundation exists; history/sync and live Athena remain
planned work. This update is documentation only.
The developer approved saving this plan and aligning the product, roadmap,
decision log, architecture, current task, and handoff. This is documentation
approval, not permission to provision accounts, migrate data, or deploy.

The developer approved aligning this plan with the
[personal records and Athena decisions](PERSONAL_RECORDS_AND_ATHENA_PLAN.md)
on 2026-11-02. Essential history/corrections across existing tools, safe sync and
basic sourced-memory controls are beta requirements. The single ongoing Note
assumption in the earlier storage proposal is superseded. No implementation is
authorized by these decisions or this document update.

The developer also approved the [Day One action plan](DAY_ONE_ACTION_PLAN.md)
and its documentation scope on 2026-11-02: optional setup of one explicitly
confirmed task or habit after the short introduction. Implement after the
personal-record/history and safe-sync work, before beta readiness. This bounded
addition does not reopen other deferred chapter work or authorize code.

## Launch target

The later approved 2026-11-03 writing slice replaces ordinary Thoughts with
Deep Thoughts in Today. It shares Note's History/Trash controls and bounded
scrolling while retaining Send/Save changes and source-linked recovery. Sending
keeps the answer visible with Next question. Its label opens a curated quote;
the existing Admin can add/remove quotes in a separate public Supabase catalog.
This supersedes the separate Thoughts controls below. It does not implement
personal evidence sync, migrate legacy writing or authorize deployment.

The approved 2026-11-03 account Note refinement moves New Note to its editor
Footer and bounds Note/History/Trash at 480px, reduced to 60% of a short viewport
but never below the shared minimum. Body scrolls with header/actions in place;
moving to Trash is silent. Other writing keeps its controls. See the
[current contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1411-bounded-note-pages---2026-11-03).
This local UI slice does not complete history/sync gates or change delivery order.

Invite 10-20 people, mainly in Myanmar and Thailand, to the current web app
with Home Screen installation, email/password login, safe sync, and paid Athena.
Keep the Circle identity, shared App Box/Page system, and existing core tools.
No native app or app-store distribution is in this release.

The users are Burmese people; some understand English well and most have basic
English. At web launch, the app UI and Athena's responses are in simple English.
Users may write in Burmese, English or mixed language. Athena must understand
that input and answer in English. Burmese/English UI and Athena responses follow
after web launch. Thai support is not part of this language scope. This records
the developer's 2026-11-02 clarification, not verified live AI capability.

This plan supersedes the earlier core-first, personalized-Athena-later release
order. It does not certify Phase 1, erase bugs, or waive the development cycle.
Fix data-safety failures and blocked launch journeys as they are found. Other
stabilization and optimization work remains visible and deferred where safe.

The earlier provisional 4-6 week estimate predates the added history scope.
Re-estimate after reviewing bounded implementation slices; no replacement
schedule or delivery commitment is chosen here. Migration, sync, device checks,
AI quality and unresolved choices still affect delivery.

## Product boundary

| Free | Paid |
| --- | --- |
| Existing core tools and chapters | New explicitly requested personalized Athena generation |
| Writing, reading, history, corrections, optional tags and sync | Configurable Athena allowance |
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
| 3. Records, history and sync | Reviewed local contracts; multiple Notes/Thoughts, drafts, saved versions, App histories, supported dated writing/Log corrections and writing Trash; ownership schema, exact sync and reviewed migration. Week reviews stay read only; past Habit corrections/shared day view deferred. | Essential histories within that scope; offline/retry/two-device/conflict/restore checks preserve records, attribution and links; free/expired core access passes |
| 4. Membership admin | Protected admin roles, grants/expiry/audit history, per-user and global controls | Unauthorized changes fail; extension, revocation, expiry, and simultaneous requests behave correctly |
| 5. Athena | Paid requested interpretation, relevant memory updates, constrained evidence, provider/model, validated readings/replies and sourced Wrong/Has changed/Forget controls | Grounded scenarios, source/version isolation, draft/Trash exclusion, correction propagation, enforced usage/cost and safe failure |
| 6. Beta readiness | Verified Day One action setup after Stage 3; Home Screen installation, app updates, critical fixes, manual deletion, backups/restore, admin-only diagnostics, operating and recovery instructions | Day One confirm/skip/recovery and compatibility checks pass; agreed real-phone journeys and production-build checks pass; deletion and 30-day backup expiration are verified; no user export/download in beta |
| 7. Release | Invite instructions, processing explanation, feedback route, deployment and monitoring | Explicit developer deployment approval, then verification in the deployed environment |

The separately approved C slice connects account Note/Thought/reading-answer
editors, drafts, saved versions, History and local Trash. The local engine,
adapter, provider and UI have bounded synthetic verification; see the
[UI contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#148-account-writing-ui-delivered---2026-11-02).
Older writing and legacy editors retain their previous paths. A lived writing
walkthrough, reviewed personal migration, other-tool histories and safe cloud
sync remain separate work; none is certified by the local UI tests.
Account entry/local separation exists; hosted/session/device gaps remain in the
current task. Real-data ownership and migration remain separate approval gates. A device
must never silently attach the previous person's records to the next account.

Confirmed target (Note refined 2026-11-03): silent Note autosave with internal
recovery/revisions, direct HISTORY and orange row trash-bin buttons. Note has
no Save/Clear/Discard/Drafts/Versions/Undo UI or focused writing box. Keep the
Trash page for Restore and confirmed Delete forever. Thoughts keep explicit Send
and drafts with their existing controls.
Recovery buffers stay outside saved evidence until committed;
editable saved writing/weekly reviews with accessible earlier versions; prospective
habit/Protocol changes; past-day correction with actual recording time; preserved
old day/timezone and current local 06:00 attribution for new records. Notes/Thoughts
Trash is recoverable, excluded from Athena and has no automatic expiry. Exact
deletion coverage and technical retention still require review. The developer
confirmed that permanent local deletion keeps the original Deep Thought question
answered and skips first-use greetings through minimal question/app-use metadata;
answer text, versions and drafts are removed from the writing ledger. This is
not proof of complete remote/derived/log/backup deletion.

Optional tags and correctable Athena topics/feelings are planned. AI interpretation
runs only when a paid user requests it; no background profiling or interpretation
on saves. Basic memory controls require no automatic model call. Exact UI/control
semantics remain separate from these confirmed product requirements.

Day One retains priority, direction and an optional action as dated source
answers. Try once defaults to the current Circle day with another day available;
Make a habit asks for a cue; Keep for later creates no commitment. Explicit
confirmation creates one task or one habit through shared engines. Finish after
confirmation or skip with the shared terminal interaction; leaving midway saves
resumable progress. Existing completed users receive only optional new setup,
older unfinished runs retain their versions, and access gates stay unchanged.
No automatic declaration, Protocol, goal, further chapter or AI request is added.
Review exact copy, task-date and confirmation/recovery contracts before code;
the current records slice remains next and V3 stays unchanged until a new
immutable version is implemented and verified.

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
outside scope. Exact controls, language instructions/quality checks within the
confirmed launch scope, and usage amounts remain open.

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

- Email/password and a separate display alias are confirmed. Supabase account
  entry/local isolation exist, and the developer created and connected a hosted
  project. Public auth settings have recorded checks; sign-in/reset/logout and
  offline return have developer-reported success. Lifestyle sync is not built.
- New users must verify their email before using their account (confirmed
  2026-10-31). The browser gate/link handling are implemented and locally tested;
  complete hosted mail/session/device verification remains open.
- Password recovery uses a reset link sent to the account's verified email
  address (confirmed 2026-10-31). Manual recovery will also be offered when
  the person loses access to that email (confirmed 2026-10-31). Ownership
  checks and the manual process remain to be reviewed. Verification-link and
  delivery settings and session/device recovery still need hosted verification.
  Browser reset-link handling exists; manual lost-email recovery is not built.
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

Other chapter simplification is paused. The bounded
[Day One action setup](DAY_ONE_ACTION_PLAN.md) is the approved beta exception;
publish it as a new immutable version after records/history and safe sync.
Completed Day One V3, older published versions and saved runs stay intact. Keep
the [simplification plan](CHAPTER_SIMPLIFICATION_PLAN.md) as historical proposal
evidence rather than deleting it. Compact Log, broad refactoring, cosmetic work,
timers, leaderboards, native apps, advanced search/filtering, and chat/memory
expansion beyond requested follow-ups and the confirmed basic sourced-memory
controls are not beta requirements. Essential history/corrections are not part
of that deferral. Keep
[bugs](../bugs.md) visible; deferrals need reasons when
the launch audit establishes their severity.

UI priority clarified on 2026-11-02: review and implement core writing/history
flows with their record contracts, and review sign-in/loading polish early.
This supersedes the earlier blanket sign-in-UI deferral as a planning priority;
exact UI/code scope still needs approval. Broader visual changes remain later.
See the [ordered work plan](WORK_PLAN.md) for the queue and bug triage.

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

The new history gates also cover multiple Notes/day, recovered drafts excluded
from evidence, saved-version review, historical habit/Protocol wording, corrected
weekly reviews, all-recorded-day access, writing Trash without automatic expiry,
restoration/permanent deletion, preserved timezone attribution, shared links and
no replayed chapter outcomes. Wrong/Has changed/Forget and source corrections
must affect later Athena retrieval. Old authored readings remain immutable and
readable after membership expiry. Exact interactions/deletion qualifications
require review; documenting a gate is not verification.

Day One release checks must cover both confirmed branches, skipped/kept actions,
local failed-save and interrupted-confirmation recovery, offline reload/retry,
duplicate prevention, chosen task days and 06:00 rollover, all entry points,
account isolation, later edits and legacy version/access preservation. Free and
expired users retain this setup, with no automatic Athena call. These checks are
planned requirements, not results of the documentation update.

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
