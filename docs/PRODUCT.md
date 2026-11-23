# Circle OS product

## Template review follow-up — 2026-11-13

Routine and Week open without their retired setup chapters. Old Habit/Week definitions, answers and unfinished runs remain available through explicit chapter/history paths. Day One/replacement onboarding and Protocol gating are not replaced by this change.

Template quantities are targets; optional difficulty is labelled Effort in Admin. Authors can arrange action wording using target/unit/effort slots. The Routine result is a read-only tool Page with shared header/body/rows, without generated preview disclaimers or per-item type labels. Numeric answers match 18px prose roles; glass time questions offer a Circle picker and unsaved 6:00 AM hint.


## Admin templates — local implementation, 2026-11-13

Local completion follow-up — 2026-11-14: Explore browses published Chapters,
Habit/Protocol templates and Articles in three bounded glass carousels. Each row
retains its title and two blank panels when empty, or a blank neighbour for one
item. Display only available saved cover/title/description fields, retain the
header/account control and bottom navigation on Today's background, and open
exact published versions. Browsing creates no personal evidence.

Explicit Add to Routine creates the confirmed group for 21 days from the current
Circle day, or ongoing when selected. Keep existing identity/items and permit
individual stopping. Reopening the same template opens its existing group while
any item remains active, including when a newer catalog edition exists. All
stopped/expired permits a deliberate fresh copy, retaining old records. Local
save acknowledgement precedes navigation; failure retains the preview/operation.
Circle marks disclose immutable source versions, resolved settings and answered
configuration/reflection snapshots. Other-domain cloud sync remains off.

Approved Protocol Start slice (2026-11-14): the signed-in exact-version reader can explicitly start a local Protocol from confirmed template terms/duration after Preview. Existing phases/drafts are protected; Day One remains required. Source/version, resolved settings and answered setup/reflection snapshots accompany the personal copy. Template terms remain fixed after starting, while phase name and ending remain accessible. Admin previews cannot adopt. This bounded slice does not provide Explore discovery, hosted template publication or cloud sync.

Admin has Habit/task and Protocol template editors with Explore titles,
descriptions, media, reorderable Pages and item groups. Questions configure
cue/time, target or Effort, or collect reflection. Fixed, direct-answer, choice
and bounded linear settings are authored in Admin; answers do not change the
authored task set. Previews stay temporary until explicit adoption in the signed-in
reader; Admin actions remain disabled. Completion is checkbox-only. Publishing
templates uses applied migration 004; bounded synthetic hosted/browser acceptance
passed on 2026-11-14. Real authored publication remains deliberate.


### Routine scheduling — 2026-11-13

Standalone Routine habits/tasks support Once, Daily for a chosen period, and Daily until stopped. New choices start on the current local Circle day. Once stays pending until completed or archived; finite daily periods count inclusive calendar Circle days, not successful ticks. Clear stops future occurrences and retains records. Existing habits retain ongoing repetition and existing tasks retain one-time behavior. Week-linked steps keep their existing date ownership. A repeat task has separate dated completion/undo records.


Updated 2026-11-23, Asia/Bangkok. This document owns product direction and
behavior. [Roadmap](ROADMAP.md) owns release dependencies; [decisions](DECISION_LOG.md)
records reasons and open choices. A target is not a claim of implementation.

## Purpose and destination

Circle OS helps a person notice the life they live, the life they want, and
what they learn between the two. It supports chosen actions and reflection.
Athena offers grounded feedback, motivation and clear questions; the person
decides how to live. Tasks and records do not measure a person's worth.

The [audience brief](AUDIENCE_AND_PURPOSE.md) describes the founder's working
audience: unemployed young graduates in Myanmar who feel stuck or unsure where
to begin. Its social claims and expected benefits remain hypotheses, not user
research. A person may begin without a purpose, goal or confident answer.

The delivery goal is a mobile-first web MVP for 10–20 friends/family testers,
mainly in Myanmar and Thailand, with Home Screen installation. The long-term
destination is iOS and Android backed by Supabase. The beta includes accounts,
safe sync and requested paid Athena. Critical data-safety and blocked journeys
are release gates; broad optimization is deferred.

Launch UI and Athena responses use simple English. People may write Burmese,
English or both; live Athena must understand that input and respond in English.
Burmese/English UI and responses follow web launch. Thai is outside this scope.
Provider quality and language readiness still require verification.

## Current product and planned work

| Area | Current state | Target or limit |
| --- | --- | --- |
| Navigation | Home, Today, Reflect and Explore share bottom navigation. `/os` enters Today and `/os/mirror` opens Reflect. Home shows the signed-in Imprint where enabled, and Explore has three discovery rows. | Onboarding's Home destination is planned. |
| Daily tools | Full-page Note/Deep Thoughts, Routine/Protocol and Log/Week pairs, with supporting views | Preserve current functions while reviewing new root compositions. |
| Accounts | Supabase email/password entry and account-separated local stores; legacy and development-test modes remain distinct | Public signup is the new onboarding target; current invitation-only configuration is not changed by documenting it. |
| Writing sync | Both writing migrations applied. Bounded hosted checks cover access, conflicts and production-store recovery in an isolated build. | Automatic product activation remains off. Physical-device recovery and operational gates remain open. |
| Other lifestyle sync | Local records; legacy mode can use the file-based profile server | General Supabase domain sync and personal migration remain planned. |
| Athena | Prepared readings, immutable editions/history and local calculations | Live requested generation, membership enforcement and new memory controls remain planned. |
| Onboarding | Existing Day One versions/runs | Replace with the planned onboarding below. |
| Hidden tools | Dreamline and The Four retained behind disabled flags | No activation or data removal is implied. |

Implementation details and evidence limits belong in [architecture](PRODUCTION_ARCHITECTURE.md),
the [writing contract](ACCOUNT_WRITING_SYNC.md) and [journey record](USER_JOURNEY_TESTING.md).
Login is not a cloud backup. A historical passing test does not certify later code.

## Content Admin and Explore

The developer's priority is account-bound Admin and a shared Supabase catalog,
followed by Explore. Manage chapters, articles/blogs, habit and Protocol templates
inside the app, with images in chapters/articles. Ordinary content updates need
no code change. Users preview/personalize templates before adding personal copies;
catalog edits never rewrite their habits/phases or immutable chapter answers.
See the [approved direction and proposed contracts](CONTENT_ADMIN_PLAN.md).
Explore browsing and local template adoption are implemented. Migration 004
is applied, and synthetic hosted publication, adoption and reload checks
passed with exact cleanup. Real authored publication remains deliberate.
[Hosted template evidence](USER_JOURNEY_TESTING.md#approved-hosted-template-acceptance--2026-11-14).

## The experience

- **Home** shows the developer-reviewed Personal Imprint in the signed-in
  review. Saved activity colors the artwork as the person uses Circle OS.
  The long-term design also recognizes the person's starting point using
  their replacement-onboarding answers. [Personal Imprint](PERSONAL_IMPRINT_HOME.md#signed-in-home-imprint--2026-11-23).
- **Today:** receives input through Note, Deep Thoughts, Routine, Protocol, Log
  and Week. Proposed recent-input previews need a reviewed selection contract.
- **Reflect:** holds wanted-life records, received readings and reflection on
  actual life. The [saved Reflect proposal](REFLECT_PAGE_POTENTIAL_IMPLEMENTATION.md)
  is deferred. New discovery records, Keep in Reflect and replacement layouts
  are proposals, not adopted behavior. Today and Reflect previews should serve
  different purposes.
- **Explore** browses published Chapters, Habit and Protocol templates, and
  articles. Previewing a catalog Chapter keeps answers temporary when there is
  no saved run. Existing Chapters and Quests remain reachable through their
  established paths.

Chapters teach or ask one thing at a time. Quests group chapters into paths.
Saving, browsing or answering does not request an AI reply.

### Replacement onboarding

The developer confirmed on 2026-11-11 that the
[planned onboarding](ONBOARDING_SPEC.md) will replace the implemented flow.
It supersedes the older optional Try once / Make a habit / Keep for later plan
as the future onboarding target.

The target includes public signup with verified email; one chosen name or
nickname; private full birthday; current situations and repeated past experiences;
wanted changes with one focus; required wake/bed times; read-only Log/Habit
previews; one explicitly confirmed daily habit; and an initial 0–10 feeling dial.
Each question has its own screen. No Skip actions are planned. Uncertain-answer
routes and validation still need review; do not invent an accomplishment, goal
or confident answer to satisfy a required screen.

A habit may be unrelated to the wanted change. Never infer progress toward an
ambition from an unrelated habit. Later Home feeling check-ins are available;
automatic daily popups are off by default and require Ask me each day opt-in.
The onboarding answer counts for its local Circle day, preventing a duplicate.

Implement after record/history and safe-sync prerequisites, before beta
readiness. Signup availability does not grant paid Athena or decide public
rollout. Existing-user entry/migration, final completion placement and record
contracts require review. Existing completed access, published versions,
unfinished old runs and personal records remain preserved until that reviewed
replacement is implemented. The current direct-entry rule remains in force.

### Current daily tools

- **Note:** titled entries with silent pause/departure autosave and local
  recovery. New Note saves current text before opening a blank composer.
  Clearing an existing Note saves an empty revision; an untouched empty
  composer creates nothing. History opens entries and offers row trash controls.
  No Save, Versions, Undo, Discard or routine save-status UI.
- **Deep Thoughts:** a question with Send, correction through Save changes,
  and a saved answer that remains until Next question. Quote returns to the
  same question/answer without sending it. Recovery is silent; clearing the
  answer clears its buffer. Historical ordinary Thoughts keep their record kind.
- **Writing pair:** manual swipes and tappable footer cues; Note has Back/History,
  Deep Thoughts Quote/History. Line access is temporarily hidden. Automatic
  writing Sparks are paused; published content and unfinished runs remain.
- **Routine:** habits and tasks share existing completion/undo and archive
  actions. An Orange clear cross archives a row without erasing prior evidence.
  Record combines today with Undo and read-only earlier days. Saved name,
  time/location and result stay distinct; omit empty fields and invented prefixes.
- **Protocol:** draft/running phases keep their agreed terms and dated seals.
  Only the checkbox toggles a term; words are passive, remain visible and fill
  Orange without strikethrough. Editing is separate; changed agreements begin
  next Circle day. Past phases are read only. Durations are 1, 3, 7, 14 or 21 days.
- **Log:** main activities and smaller moments retain original dates/times and
  deliberate past-day text corrections. Plus opens a main activity in an empty
  hour and a smaller moment once one exists. History remains; Now is removed.
- **Week:** every open goal appears on every day tab; folded goals show only
  the selected day's tasks. Add tasks only to today/future days. Steps are the
  same Routine tasks. Completion/clear actions update both views and preserve
  History. Clearing a goal archives linked unfinished tasks. Day's Record and
  day/goal History start folded. Saved Week reviews remain read only; Sunday
  review and its Protocol outcomes stay deliberate, not automatic entry.

[Design](../DESIGN.md) owns dimensions and type;
[Page standard](../app/os/APP_SESSION_STANDARD.md) owns interaction and motion.
These full-page tools grow naturally without the retired compact writing cap.

### Personal records and history

Free core access includes writing, corrections, tools, reviewable history,
received readings and sync. Paid access gates new AI generation.

The [record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) owns source/revision,
time, correction, deletion and migration rules. Keep one profile per account.
Old wording and dates remain evidence. Completed Week reviews are read only;
past Habit completion corrections and the shared day view are deferred.

Trash is recoverable, excluded from Athena and has no automatic expiry.
Delete forever requires confirmation and must prevent stale restoration.
Trashing/deleting a Deep Thought keeps minimal question/app-use metadata so
the question remains answered, without retaining its answer/version/draft text.
Wider deletion coverage still needs verification.

### Wanted-life records

| Record | Meaning |
| --- | --- |
| Vision | The life worth wanting |
| Character | Who the person is becoming; authoritative top of Athena's chain of why |
| Mission statement | How the person intends to live |
| Typical Tuesday | An ordinary day in the wanted life |
| Six-month picture | A nearer milestone |
| Routine identity | Editable daily focus; a labelled fallback when Character is absent |
| Habit identity/result | Belongs to that habit; never replaces whole-person Character |
| Dreamline | Separate finite practical plan with costs and steps |

Declarations are dated/versioned. Newest unsuperseded Character is authoritative;
Routine identity, then Mission, are labelled fallbacks. Current visible Vision
pages remain Vision, Mission and Typical Tuesday. Adding other pages needs review.

## Athena

Athena distinguishes the person's words, recorded events, calculations and
inference. Never invent evidence. Keep uncertainty and sources explicit.
Authoritative philosophy and authored wisdom belong to the developer.

The paid target is person-requested readings in Reflect with one optional
reflection question. A requested result appears when ready without a second
reveal request; this does not authorize unrequested preparation. Saving an answer
saves evidence only. AI follow-ups require a separate request and have no fixed
count limit beyond the allowance.

Readings are short, direct, calm and advisory, grounded in relevant same-owner
history. Drafts, Trash, deleted writing and login/payment details are excluded.
Saving or correcting records starts no model call or background profiling.
Sourced observations and Wrong / Has changed / Forget are beta requirements;
their exact scope, undo, recurrence prevention and old-reading qualifications
remain open. Original evidence and derived memory stay distinct.

Authored editions are dated and immutable. Unchanged prose creates no edition;
derived screen observations are never published as authored readings. Preserve
received readings and chapter versions. The present browser archive is bounded;
older-edition paging/retention requires review.

Provider/model, prompt instructions, evidence service, processing facts, quality
checks and operating budget remain integration work. The model receives selected
authorized evidence through a constrained server service, never administrator
credentials. Existing prepared-content operation is separate and not certified
merely because its source exists.

## Membership

Planned free core remains usable when AI expires or fails. Paid membership
enables new requested Athena generation. Previously received readings remain
readable after expiry.

Admin manually confirms payment and grants 30, 90, 180 or 365 days. There is no
automatic payment collection in beta. Renew active access from current expiry;
renew expired access from grant time. Durations are fixed days, not calendar
months; expiry retains the starting time of day and displays in local time.

Server enforcement must cover grants/revocation/audit, expiry, concurrent usage
reservations and spending controls. Daily allowance resets in Myanmar time
(Asia/Yangon). Unused daily allowance carries within the membership cycle until
its monthly reset; monthly allowance does not carry. Failed requests use none.
Amounts/counting, reset hour, longer-grant cycle math, renewal effects,
retry/no-change accounting, prices and budget remain open.

## Privacy and identity

Email/password and verified email remain the account basis. The new target asks
for one chosen name/nickname and private birthday; it does not require a public
real name or a separate second alias field. Current account controls still edit
the existing auth alias. Review future storage/mapping before implementation.

Reset links use verified email. Manual lost-email recovery is intended; proof
and operating procedure remain open. Login should persist until logout, with
retained local data account-separated and unavailable to signed-out/other users.
Session renewal, revocation and lost-device behavior need verification.

Singapore is the chosen database region; actual regional connections need
measurement. A requested reading requires no additional AI opt-in prompt.
The developer will explain data use and discourage sensitive input on the
website/social pages. Actual provider retention, training use and processing
locations must be documented when selected; none is assumed verified.

Admin's target includes always-available read-only personal-writing access,
without a per-case support approval. Admin-only error logs may contain writing;
retention and read auditing need review. This planned access is not supplied by
the current writing RPCs.

Account/data deletion is manual on request. Deleted backup data expires within
30 days. Deletion coverage/turnaround, device/log/provider copies, restore
suppression and operating backups remain release gates. No user download/export
is offered in beta; authoring export is a different function.

## Deferred work and boundaries

Broad refactors/optimization, further chapter simplification, advanced search,
timers, gamification and native delivery are deferred. Streak/leaderboard
possibilities have no agreed score, fairness or release timing; never rank a
person through invented AI judgments. Oscar, the 3D Room, courses and older
Circle membership ideas are not current release gates.

Use repository-owned authorities. External runtime files remain integrations
until separately migrated; unavailable external product notes are not preflight.
Keep secrets and personal writing out of frontend bundles, docs and test fixtures.

Earlier requirements and verification remain in the
[dated archive](archive/2026-11-11-doc-cleanup/README.md), not as competing rules.
