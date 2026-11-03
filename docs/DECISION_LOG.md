# Circle OS decision log

## 2026-11-03 - Larger editable titles and tighter Page spacing

The developer approved 29px titles/questions with 18px content/answers on the
same editable surfaces as the earlier typography decision: Note/Deep Thoughts,
opened History/Trash entries, Athena replies, Vision declarations, Week goals/
steps, and Chapter text questions with matching Workshop previews. This
supersedes the earlier 24px main-text size, retaining weights and line heights.

The shared label gap changes from 80px to 48px because the top felt too empty.
Main-to-Sub and Body-to-Footer both use 25px for a consistent rhythm. These
values supersede the earlier forehead/footer numbers while retaining one top
anchor and the shared App Box minimum. Note/Deep Thoughts Trash detail removes
the “In Trash” status and divider and uses a 4px gap between Restore and Delete
forever. Touch targets and deletion confirmation remain. Other spacing is unchanged.

Record confirmed decisions, preferences, proposals, and unresolved questions
separately. Older handoff entries remain historical evidence; this log records
the decisions that supersede their active product assumptions.

## 2026-11-03 - Balance typography only where people read and write

After reviewing the 24px/18px preview and the wider typography audit, the
developer approved size changes only on reading-and-writing surfaces. Use a
4:3 main/body scale on account Note/Deep Thoughts and opened history/trash
entries, the embedded Athena reply editor, Vision declarations, Week goals/steps,
and Chapter short/long text questions with their matching Workshop preview.
Keep compact list rows and reading-only covers, lessons, Athena prose, Quest
descriptions, locked-app explanations and Protocol summaries at their existing
sizes. Only font sizes change; weights, line heights, spacing and behavior stay.

Reason: titles/questions should not overpower the person's writing. Scoped
roles also avoid the mobile 16px field rule making reading and editing differ.
This supersedes earlier same-size Cover/Note/Chapter requirements only for the
named editable surfaces; the shared forehead and App Box minimum remain.

## 2026-11-03 - Quiet Deep Thoughts writing

The developer requested removing saving/sent and recovered/discarded messages
and the Discard draft control from Deep Thoughts. Reason: users can discard an
unfinished answer by removing its text. Recovery remains automatic and silent;
clearing writes an empty recovery value so old text does not return on reload.
Send, Save changes, Next question and actual save/conflict errors remain.
This refines Deep Thoughts only; embedded reading answers keep their controls.

## 2026-11-03 - Note, Deep Thoughts and managed quotes

The developer approved replacing ordinary Thoughts in the visible Today flow
with Deep Thoughts, matching Note's History/Trash navigation, design and controls,
and adding an Admin-managed shared quote database. They chose to keep an answered
question and its answer visible after Send, with Next question as the next action,
then explicitly approved implementation, tests and owning records.

Reason: title versus no title does not give Note and ordinary Thoughts distinct
jobs. Note now receives all new free writing; Deep Thoughts starts with a question.
Note remains the first Page and its label opens the existing Line pool. Deep
Thoughts opens directly as the other Page; its label opens one curated quote.
Reading and returning restores the same question and unfinished answer.

Both account writing surfaces share direct HISTORY, orange navigation, dated
rows/times, saved-row bins, silent trashing, Trash/Restore/confirmed Delete
forever and the existing bounded Body scrolling. Deep Thoughts keeps explicit
Send, Save changes, automatic draft recovery and immutable question/source links.
Unsent recovery rows are marked Unsent and stay outside saved evidence. Existing
Thoughts and reading answers remain reachable, retaining their original kinds,
IDs, attribution and source links. Legacy writing is not imported or converted.

The quote catalog uses Supabase with public SELECT and server-only Admin
mutations through the existing signed cookie. The developer adds/removes content;
no new philosophy or quote text is authored here. Rotation visits the whole pool
before repeating; cached reading works offline, and an authoritative empty
catalog never falls back to bundled quotes. The existing Line exits/reactions
are reused. Quotes never gain a run, cooldown, completion or version.

The internal `thoughts` app/delivery identifiers remain unchanged. Existing
chapters, editions, local-first writing and the 06:00 Circle day remain intact.
Personal sync, deployment and broader Admin/geometry optimization are separate.
See [the contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1412-note-deep-thoughts-and-quotes---2026-11-03),
[quote setup](QUOTES.md) and [verification](USER_JOURNEY_TESTING.md#deep-thoughts-and-managed-quotes-2026-11-03).

## 2026-11-03 - Bounded Note pages and editor New Note

The developer requested New Note on the Note page, bounded growth with scrolling
on Note/History/Trash, and removal of Moved to Trash feedback. They explicitly
approved the reviewed proposal: retain the shared minimum, cap the whole App Box
at 480px, reduce that ceiling to 60% of the dynamic viewport on short phones,
and never shrink below the shared minimum. Body alone scrolls; Header, Heading
and Footer stay in place. This is an account Note exception to continuous growth;
the Protocol/Routine reasons and behavior remain unchanged.

New Note is the editor Footer action, removed from History. It saves current
text before opening a fresh blank Note, including typing that arrives during
save. Failure, unfinished composition or conflict keeps text available. History
row bins still move only their Note; the move has no success text or Undo.
Restore and confirmed Delete forever remain in Trash. Keep actual error alerts.

Reason: bound the writing/history surfaces to a comfortable phone-sized area
while keeping navigation/actions reachable and starting another Note directly
from writing. This supersedes earlier New Note-in-History and unlimited Note
frame growth; it does not limit writing length. Implementation, focused checks
and owning records are approved. No personal migration, store/schema, cloud
service or deployment change is included. See the
[contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1411-bounded-note-pages---2026-11-03)
and [evidence](USER_JOURNEY_TESTING.md#bounded-note-pages-2026-11-03).

## 2026-11-03 - Direct Note History and row Trash controls

After trying the earlier Note refinement, the developer requested removal of
Versions, Saving/Saved on this device messages, and the orange input box. They
confirmed that the Trash page stays, with Move to Trash moved to an orange bin
icon beside each Note in History. HISTORY replaces the ellipsis and must align
with NOTE. They then explicitly rejected Undo and approved implementation,
tests and records with restoration only from the Trash page.

This is Note-only scope. Remove Note Versions controls/screens while retaining
internal revision records for save/conflict safety. Save silently; retain actual
failure alerts. Remove only writing-field focus outlines/boxes, preserving the
caret and button keyboard focus. Keep 44px header/bin targets, the shared App
Box geometry, autosave/recovery, History/New Note and Trash/Restore/Delete forever.
Read-only older sources stay read only. Thoughts/reading answers retain their
existing controls and Send behavior.

Reason: writing and history should stay direct, with removal handled in one
place and restoration handled in Trash. This supersedes Note Versions, Undo,
ellipsis and routine save-feedback requirements in earlier decisions below.
No personal/legacy migration, schema change, cloud sync or deployment is included.
See the [contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1410-note-history-controls---2026-11-03)
and [verification](USER_JOURNEY_TESTING.md#note-history-controls-2026-11-03).

## 2026-11-03 - Note autosave and simpler writing controls

The developer supplied the writing/history/Trash reference image, confirmed
Note-only scope and autosave after a short typing pause and on leaving, then
explicitly approved the concrete implementation, tests and owning records.
Thoughts, Deep Thoughts and reading answers retain Send and their draft flow.

- Use Circle Orange `#E36B37` for Note labels, navigation and text actions.
  Keep authored title/body in Ink, the shared App Box geometry and Geist.
- Remove Note Save, Clear, Discard, Drafts, draft recovery controls and draft
  messages. Keep automatic local recovery internally, preserving existing text.
- Autosave after a one-second pause and on leaving the editor; finish input
  composition first. A local success message requires durable acceptance.
- Keep the saved Note visible. History opens entries directly for editing,
  groups by Circle day with times, and carries New Note and Trash. Keep earlier
  versions, Move to Trash, Undo, Restore and confirmed Delete forever.
- Manual selection/deletion can clear an existing Note. Store that empty value
  as a new version so earlier text cannot return; retain its earlier versions.
  Empty new composers create no saved entry. Competing copies still need review.

Reason: writing should save naturally without a separate draft-management job.
These choices supersede earlier Note Save/draft/Clear requirements below and in
the writing plan. They do not migrate personal/legacy writing, enable cloud sync,
request Athena or authorize deployment. Verification is recorded in the
[journey record](USER_JOURNEY_TESTING.md#note-autosave-refinement-2026-11-03).

## 2026-11-02 - Account writing provider and deleted-question metadata

Later approval on the same day: the developer explicitly approved C's account
Note/Thought/reading-answer Save/Send editors, draft recovery, History, Versions
and Trash using the existing App Box, the five listed application/test paths,
Page standard, bug record and nine owning/evidence records. Existing older
writing remains read only pending separate migration review. The generated
preview was a placement aid, not authority to change Circle's visual language
or shared geometry. The local UI implementation and bounded verification are
recorded in [section 14.8](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#148-account-writing-ui-delivered---2026-11-02).

The developer chose to keep a permanently deleted Deep Thought's question
answered and skip first-use greetings. The answer and its saved versions are
removed. The reviewed provider scope retains only question/app-use metadata
beside the local deletion marker; it retains no answer text, saved versions or
drafts. Older markers without this metadata remain unknown. They do not justify
reopening questions, rewarding another answer or greeting the person again.

Reason: deleting writing does not mean the question was never answered or that
the person needs another first-use introduction. This does not change the
existing local question-pool exhaustion rule, which cycles after all questions
are spent. Complete remote/derived/log/backup deletion remains separate work.

The developer explicitly approved B2's exact provider/store/contract/consumer/
test files and nine records after review, then said to continue implementation.
The provider is mounted only inside an account's existing boundary. It exposes
current local views, rejects old-epoch and superseded reads, refreshes after
commits/cross-tab changes and separates write acceptance from refresh failures.
Deep Thought, first-use and Reflect consume read views without copying writing
into editable survey answers. Existing independent tool context and received
readings retain their separate paths. No model runs on saving.

Writing controls/history UI, personal owner mapping/import, cloud sync and
deployment remain separately reviewed. The delivered contract and actual
verification are in [plan section 14.7](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#147-account-bound-provider-delivered---2026-11-02)
and [the provider evidence](USER_JOURNEY_TESTING.md#account-bound-writing-provider-2026-11-02).
Earlier decisions below remain dated evidence; their open deletion-metadata and
unmounted-provider statements are superseded for this approved local scope.

---

## 2026-11-02 - Writing compatibility, Trash question status and launch languages

The developer confirmed that a trashed Deep Thought keeps its question marked
answered while its writing stays excluded from Athena. Trash does not reopen
the question. Question/first-use metadata after permanent deletion still needs
review before live activation; this decision does not choose its retention.

The users are Burmese people with varied English, mostly basic. At web launch,
the UI and Athena's responses use simple English. Users can write in Burmese,
English or mixed language; Athena must understand that writing and respond in
English. After web launch, UI and Athena support both Burmese and English.
Thailand is a location/connectivity requirement, not a Thai language requirement.
This supersedes the earlier open launch-language wording. Exact instructions,
provider quality and later dual-language delivery still require implementation
and verification. No live AI capability is certified by preserving Unicode text.

After a read-only source/test review, the developer explicitly approved the
compatibility/evidence adapter and record-update scope: three new adapter/type/
test files, changes to the memory model and memory tests, and eight documents
(personal-records plan, this log, Product, beta plan, Work Plan, Current Task,
Session Handoff and journey evidence). Provider/UI activation, personal import,
cloud work and deployment remain separate scopes. The earlier B grouping is
split into this adapter (B1) and a later account-bound provider (B2).

Reason: preserve existing saved writing without inventing ownership/dates,
prevent duplicate evidence, carry exact source/version dependencies and withhold
stale interpretations. The adapter is a pure read view over explicitly scoped
snapshots. Supplied compatibility links are synthetic mapping rehearsals, not
permission to claim/import records. It preserves authored reading history and
does not call a model. A legacy interpretation without verifiable dependencies
cannot become a current claim merely because it was copied into a new view.

Delivered contract and limits: [plan section 14.6](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#146-compatibility-and-evidence-adapter-delivered---2026-11-02).
Actual checks and remaining live gaps: [adapter evidence](USER_JOURNEY_TESTING.md#writing-compatibility-and-evidence-adapter-2026-11-02).
Earlier decisions and reasons follow unchanged.

---

## 2026-11-02 - Local writing interactions and save feedback

The developer confirmed the writing choices in conversation, then explicitly
approved a documentation-only update to the personal records plan, this log,
current task and handoff. The detailed target is in the
[writing journeys](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#5-writing-journeys).

- A missing Note title saves as **Untitled**. Actual user writing in title or
  body is required; the automatic label and placeholder alone do not count.
- Save leaves the saved Note visible with **New Note** available. Return to
  unfinished writing by reopening its recovered draft; **Discard draft** leaves
  saved Notes intact. Drafts have no automatic expiry and remain until successful
  Save/Send or deliberate discard.
- **History** groups writing by Circle day, newest first, and opens an entry in
  the same App Box. Corrections preserve earlier **Versions**; unchanged saves
  create no extra version.
- New writing keeps the Circle day when writing began, with actual save time
  recorded separately, including a 05:50 start and 06:10 save.
- **Move to Trash** is in the saved Note's menu with immediate **Undo**. **Trash**
  is inside History and offers **Restore** and **Delete forever**; permanent
  deletion requires confirmation. Complete deletion coverage still needs review.
- Thoughts shares draft/date/history/version/Trash rules. Use **Send** for new
  entries and **Save changes** for corrections. Keep Deep Thought/reading
  questions and sources; corrections do not resend, replay outcomes or request
  an Athena reply.
- **Saved on this device** or **Sent** follows successful local persistence.
  Failed saves keep text open with duplicate-safe retry; a failed recovery-store
  write shows a warning rather than a promise of draft recovery.

Reasons: remove the title barrier, keep saved writing visible, preserve unfinished
work and earlier wording, make review/removal deliberate, and distinguish local
save from typing or cloud backup. The starting-day choice avoids moving an entry
because writing crossed 06:00.

The plan's [local contracts and file proposal](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#141-proposed-local-contracts)
are engineering proposals for the next review. This decision approves no code,
schema, real-data migration, provider integration or deployment. Exact physical
layout, compatibility mapping and remaining technical contracts remain open.
Earlier decisions below retain their reasons; these choices resolve their
previously open writing details without certifying implementation or Phase 1.

## 2026-11-02 - Plan reconciliation, UI priority and five Protocol durations

The developer requested a review and ordering of current/previous plans, tasks,
fixes and UI work. They chose core flows and sign-in polish first, with broader
visual changes later. After reviewing the conflicts, they approved reconciliation
and explicitly chose to keep the current five Protocol durations: **1, 3, 7, 14
and 21 days**. This corrects the four-choice standard; it changes no runtime
duration, ratio, budget or layout.

Reconciled rules and facts:

- The later approved invited beta includes accounts, safe sync, membership and
  requested paid Athena. Correct earlier core-first/Athena-after summaries;
  critical data-safety and blocked journeys remain gates, broad optimization later.
- Account entry/local isolation exist; hosted settings and reported journeys
  have dated evidence. Lifestyle sync/backup, full hosted/device certification,
  membership and live Athena remain unfinished. Do not recreate the project or
  describe login as cloud evidence backup.
- The confirmed multi-entry target uses recovered drafts and explicit Note Save /
  Thought Send. Current single-Note blur commits are existing behavior, not the
  target save contract. Exact controls still require implementation review.
- Daily preparation describes legacy prepared content. New paid interpretation
  requires an explicit request, never a save/background profile. Preserve prepared
  content until reviewed migration and retain immutable editions.
- Keep one shared App Box minimum; real content grows downward. Remove the
  conflicting per-App minimum exception without changing geometry here.
- Log currently has daily/Week Pages. Dreamline remains hidden, with disabled
  idle/sheet Pages conditionally in Routine. Older Log/Dreamline prose is
  historical, not permission to enable it.
- Correct the Page standard's Admin shorthand to match the existing password
  gate: the reserved phrase opens a prompt; only a valid server-checked password
  grants access. This records current behavior, not a new access policy.

Reason: resolve contradictory instructions before turning plans into an execution
queue, preserve behavior/history already agreed, and avoid building storage around
an obsolete writing flow. [WORK_PLAN.md](WORK_PLAN.md) is an ordered index, not a
replacement for product, roadmap, architecture, design or detailed acceptance
criteria. Core interaction work belongs with its records; sign-in/loading polish
is now an early planning priority, superseding older deferral wording.

Approval is documentation only. Source concerns such as placeholder evidence,
Reflect failures and reported accidental phase changes still need reproduction
and separately reviewed fixes. No code, personal records, external runtime files,
database, remote settings or deployment changed. Earlier decisions/audits/handoffs
retain dated evidence; unresolved implementation choices are listed in the
work plan rather than silently decided.

## 2026-11-02 — Day One offers one confirmed action

The developer reviewed the step-by-step example, then explicitly approved the
five recommended choices and the documentation scope. The
[Day One action plan](DAY_ONE_ACTION_PLAN.md) records the flow and verification
requirements. Approval covers that new plan and targeted updates to product,
architecture, roadmap, beta plan, earlier chapter plan, current task and handoff.
It does not authorize application or chapter edits, migration or deployment.

Confirmed:

- Keep the short priority/direction/optional-action introduction. Offer Try once,
  Make a habit, or Keep for later. Create at most one task or one habit, and only
  after explicit confirmation; do not create other declarations or commitments.
- Finish after confirmation or explicit skip, using the shared terminal
  interaction. Leaving midway keeps resumable progress without completing setup.
- Try once defaults to today with another day available before confirmation.
  Today is the current Circle day starting at local 06:00. Habit setup asks for
  a cue, reuses the person's words and avoids unrelated identity questions.
- Preserve older completions, commitments, access and unfinished run versions.
  Offer the new setup optionally to completed users without resetting onboarding.
- Implement after current personal-record/history and safe-sync work, before
  beta readiness. This bounded addition is an exception to the broader chapter
  simplification deferral; other deferred work stays deferred.

Reason: answering Day One should lead to a usable chosen beginning while keeping
entry short and preserving the person's control. Saving an answer alone is not
permission to create a task, habit, declaration or AI reading. Broad priorities
remain dated source answers for later reflection, not permanent traits.

The V3 no-commitment behavior remains immutable. New behavior requires a new
published version and reviewed shared-engine integration. The existing Protocol
and Week gates, Week Setup offer timing and paid requested-Athena boundary stay
in force. Exact copy/layout, optional existing-user entry, supplemental runs,
task-date and confirmation/recovery contracts remain implementation review work.
Earlier decisions and handoffs remain historical where this entry supersedes
their no-new-Day-One-work direction. No runtime verification is claimed here.

## 2026-11-02 — reviewable personal records and requested Athena memory

The developer answered five batches of product questions, then reviewed and
explicitly approved the documentation scope: a new
[personal records and Athena plan](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) and
targeted updates to product, architecture, roadmap, beta plan, earlier Note plan,
current task and handoff. This is documentation approval, not code, database,
migration, provider or deployment approval.

Confirmed:

- Multiple titled Notes grouped by Circle day; separate quick untitled Thoughts.
- Automatic draft recovery, with Save for Notes and Send for Thoughts. Unsaved
  drafts stay outside history and Athena evidence.
- App-specific history plus a shared day view over the same underlying records.
- Editable past writing and weekly reviews with earlier saved versions available.
- Prospective habit/active Protocol changes preserve earlier wording and terms.
- Past-day writing, Log entries and habit-completion corrections are permitted;
  keep actual entry/correction time distinct from the attributed day/time.
- The 06:00 Circle day uses current local time for new entries. Old records keep
  their assigned day/timezone through travel; deliberate corrections are allowed.
- Deleted Notes/Thoughts enter Trash, can be restored/permanently deleted, stay
  excluded from Athena, and have no automatic expiry. The existing maximum
  30-day deleted-backup limit and account-deletion rules remain separate.
- Optional user tags and correctable topic/feeling suggestions when Athena is
  used; sourced observations with Wrong / Has changed / Forget controls.
- AI interpretation and relevant memory updates run when a paid user requests
  Athena. No model interpretation on every save or unrequested background
  profiling of either free or paid users. Saving a reflection still requests no reply.
- Writing/reading/history/corrections/core tools/sync are free; paid access
  enables new requested generation. Received readings stay readable after expiry.
- Essential histories/corrections across existing tools, safe sync and basic
  memory controls precede invited beta; advanced search/filtering follows later.

Reasons: preserve useful personal history, support flexible capture, correct
accidental or late records, keep original evidence distinct from interpretations,
and make AI use deliberate without charging for access to personal records.
These choices supersede the single-ongoing-Note product constraint in the
2026-10-31 storage plan; they do not discard its useful safety mechanisms.

Exact visuals/interaction, SQL/local contracts, retention of technical records,
Forget semantics, non-writing deletion, old-reading qualifications, draft sync,
personal migration and implementation files remain reviewed follow-up work.
Published chapters and authored readings remain immutable. Existing privacy,
membership, operator access, verification warnings and beta gates stay in force.

## 2026-10-30 — product destination and stabilization

Confirmed by the developer:

- The long-term product is an iOS/Android app powered by Athena.
- Athena provides personal reflection, open questions, behavior analysis,
  feedback, and motivation around what a person wants and how they approach it.
- Supabase is the intended backend, with authorized evidence access for Athena.
- Personal information needs strong privacy protections. People should be able
  to participate without disclosing a real identity to other users.
- This project's endpoint is a web MVP for friends and family before mobile.
- Fix and optimize current features and the system before adding new features.
- Follow code, test, fix, verify, optimize, then test/verify again.
- Missing external documents can be ignored/removed or replaced locally.

Implementation status: documentation records this direction; no Supabase
database, new authentication, AI provider, scoring, or native app was added.

## 2026-10-30 — repository authorities

Implementation of the developer's missing-document instruction:

- `docs/PRODUCT.md`, `docs/ROADMAP.md`, and this log hold product direction.
- `docs/PRODUCTION_ARCHITECTURE.md` distinguishes the current prototype from
  the Supabase target; `docs/DEVELOPMENT_WORKFLOW.md` owns the work cycle.
- `DESIGN.md`, `app/os/APP_SESSION_STANDARD.md`, and `app/brand-system.ts` remain
  the accessible design references. No missing note's contents were inferred.
- Historical handoffs and current file-server integrations are retained. This
  documentation change does not migrate, discard, or disconnect vault records.
- Pending external-document updates in old handoffs are superseded by local
  decision recording for new work; they are not claims of external updates.

## 2026-10-30 — first test covers the stabilized core (O-02 resolved)

The developer chose: "Test the stabilized core first; add Athena afterward."
The first friends-and-family release validates current features after fixes
and optimization. New personalized Athena integration follows that core test
and its feedback. It is not a prerequisite for the first tester release.

This supersedes the earlier proposal to include new personalized Athena before
the first web MVP test. Existing prepared readings and chapters remain in the
current feature audit. No app behavior was changed to record this decision.

## 2026-10-30 — manual review, clarification, and code verification

Confirmed standing instructions from the developer:

1. Verify every code change works as intended; write tests when necessary.
   Repeat verification after fixes or optimizations and report any unverified gap.
2. Explain intended file changes in simple terms, ask for manual review and
   explicit approval, and wait before editing. This applies to documentation,
   tests, and handoff notes as well as application code.
3. Ask focused questions whenever necessary context or the intended outcome is
   unclear, and resolve that uncertainty before making dependent changes.

The developer explicitly approved this documentation update after reviewing
its proposal. That approval does not authorize application changes or the
broader documentation consolidation and test harness proposed in the audit.

These instructions supersede earlier permission to continue editing simply
because stabilization or a bug list had been prioritized. Work within a
reviewed, approved scope can proceed; new scope needs another review.

## 2026-10-30 — limited idle rotation confirmed

The developer approved retaining the current limited rotation and aligning
the five reviewed documents. This confirms the narrower rule deliberately
introduced in commit `2cd633e`, rather than restoring the older broad rule.

- Only the Today Note/Thoughts session turns automatically after the shared
  `IDLE_PAGE_DWELL_MS` dwell (currently 30 seconds).
- Two-page facts/jokes on the Line side of that same box may also turn.
  A one-page quote has no second Page to turn to.
- Routine, Protocol, Log, Vision, Week Review, and Athena stay on the chosen
  Page. Journeys, Chapters, and pending publications never rotate.
- Interaction restarts the dwell; focus, a partly written Thought, and a
  background tab prevent turning under the
  [Page standard's rule](../app/os/APP_SESSION_STANDARD.md#idle-rotation).

Source inspection found the Today timer enabled, Routine's
`rotateIdleApps={false}`, and the chapter player's rotation default disabled.
These are source findings, not a fresh browser verification.

This keeps idle Thoughts-to-Note switching as intended policy. The reported
Habit reset remains a separate unresolved report; it was not explained,
fixed, or browser-verified by this decision. No bug status was changed.

## 2026-10-30 — Note and Line confirmed

The developer approved keeping Note/Line with the existing swipe/reaction
exits and aligning the five reviewed documents.

- The Note label opens a Line on the back of the same App Box, not an
  unfinished or dismissed Chapter. This confirms the change introduced by
  commit `df4cab2`.
- Preserve legacy immutable Note publications and their saved history.
  New Note-style chapter deliveries use Thoughts under the Page standard;
  other App destinations retain their existing delivery rules.
- A Line does not close itself on a timer. Its `FACT`, `JOKE`, or `QUOTE`
  label is text, not a return button.
- Swipe backward past the first Page to return to Note. Swipe forward past
  the last Page to reveal reactions; react or swipe forward past the end again
  to return. A reaction records optional feedback and does not create a
  Chapter run or completion.
- Two-page Lines retain the previously approved limited idle rotation.

Source inspection found `openNoteLine`, `closeNoteLine`,
`dismissLineBackward`, `passLineForward`, and `reactToRevealedLine` in
`app/os/circle-os-shell.tsx`. The prior review checked commit `df4cab2`
against the Page standard. Runtime exits and legacy-publication readability
were not browser-verified in this documentation update.

Bug 6 (placeholder text becoming saved Note text) remains unresolved and
separate from the Line-back decision. No bug status or personal record changed.

## 2026-10-30 — Protocol grows to show its terms

The developer chose continuous content growth for Protocol after reviewing the
fixed-height and growing alternatives.

- The shared App Box height is a minimum for empty and short Pages.
- Draft, running and finished Protocol Pages grow downward when their terms need
  more room. Terms stay visible in the Page instead of moving into an inner
  scrolling panel.
- This matches Routine's continuous rows and keeps one natural page scroll on
  mobile. Long Protocols may require more page scrolling; lived use will show
  whether a separate compact view is useful later.
- Current code already follows this behavior. Measurements found an active
  three-term Protocol at 548.70px and the empty Protocol home at 344px, with no
  horizontal overflow or page errors in the isolated mobile checks.

This decision replaces the fixed-height running/finished Protocol sentence
introduced in commit `722bd5b`. It does not create a term limit. Main placement
is governed by the forehead decision below.

## 2026-10-30 — Main content keeps the forehead anchor

The developer chose the later forehead placement over restoring vertical Main
text centring.

- `--os-label-gap`, currently 80px, owns the distance from the App Label to the
  first visible content. Main begins there for every line count.
- Adding or removing Main lines does not move the first line. After the ordinary
  three-line height budget is used, additional lines grow the App Box downward.
- This preserves the consistent cross-App starting position established in
  commit `d983c0a` and measured at 80.90–80.91px in the isolated mobile pass.
- Sparse Pages may leave more space below short text. That is accepted in favor
  of stable editing and swipe transitions.

The unused centring output may be removed while retaining the calculation that
grows the Body for long Main content.

## 2026-10-30 — Character is authoritative

The developer approved this relationship among wanted-life and identity
records:

- Vision names the life worth wanting.
- Character names who the person is becoming across mind, body, spirit, and
  social life. The newest unsuperseded Character is the authoritative top of
  Athena's chain of why.
- Mission statement says how the person intends to live. Typical Tuesday shows
  an ordinary day in that life. Six months is a nearer milestone.
- Routine identity is a short editable daily focus. Habit identity belongs to
  one habit. Neither overwrites or outranks Character.
- When Character is absent, Athena may use Routine identity and then Mission as
  explicit stand-ins. She must preserve the source label.
- Dreamline stays separate as a finite practical record with costs and steps.

The current Reflect front remains Vision, Mission statement, and Typical
Tuesday. Character and Six-month Page design is deferred to a separate review;
this decision changes authority and Athena's existing local alignment, not the
visible Reflect page count.

## 2026-10-30 — setup chapters control App access

The developer confirmed keeping the chapter-based gates introduced in commit
`9482fea`, superseding the day-based access plan in `3581804`:

- Protocol opens after completing Day One (`day-one`).
- Week opens after completing Week setup (`week-setup`).
- Completion in any published version satisfies that App's setup gate.
- Waiting alone does not open either App; finishing setup does not require an
  additional day-two or day-seven wait.
- Preserve existing offer timing: Week setup is automatically offered after
  the next Circle day begins following Day One completion. The Circle day
  starts at 06:00. Chapter offers and review timing are separate from App access.

Reason: setup supplies the records the App needs. A date could open an empty
App or keep a person out after they had already completed its setup.

The older phase narrative and elapsed-day helpers remain historical context,
not access rules. Their comments were clarified; runtime behavior, chapter
versions, budgets, personal records, and review timing were not changed.
Focused gate tests passed 4/4. No fresh browser verification was performed.

## 2026-10-31 — shorter Day One opens Protocol with setup when needed

The developer confirmed the Protocol dependency for the
[shorter Day One draft](CHAPTER_SIMPLIFICATION_PLAN.md#day-one-draft-for-review---2026-10-31):

- Completing the shorter Day One opens Protocol, retaining the existing
  completion-based access rule.
- If no Protocol exists, offer setup when needed through an intentional
  empty/on-demand setup path. Do not create terms from broad onboarding answers.
- Existing users retain their completion-based access and saved Protocols.
- Week's completion gate, next-Circle-day Week Setup offer, and the 06:00
  boundary remain unchanged.

Reason: Day One can establish priority and direction without requiring a rule
or commitment. Protocol remains available, and the person supplies its terms
when choosing to set it up. This refines the earlier rationale that Day One
must supply the first Protocol; it preserves the chapter-completion access rule.

Approval covers recording this decision in the plan, decision log, and current
task only. The exact empty state, setup interaction, new chapter version, and
outcome handling need a reviewed implementation proposal. No application code
changed and no runtime verification is claimed by this documentation update.

## 2026-10-31 — invited web beta with accounts and paid Athena

The developer approved saving the [web beta launch plan](WEB_BETA_LAUNCH_PLAN.md)
and aligning the six owning/continuity records. This approval is documentation
only; implementation, provisioning, real-data migration, and deployment require
their reviewed scopes. Existing Day One work is preserved.

Confirmed direction:

- Web app with Home Screen installation for now; no native/store release.
- 10-20 invited users, mainly in Myanmar and Thailand.
- Email/password with a separate display alias replaces the username-only
  preference.
- Free core and paid Athena; the developer manually confirms payment and grants
  one/three-month or otherwise specified access, which expires automatically.
- Configurable user allowances and overall spending controls; amounts are open.
- AI provider/model selection happens when integration is reached. Neither a
  Supabase project nor an AI API account currently exists per the developer.

The launch route now includes accounts, safe sync, membership admin, and a
bounded Athena integration before the invited release. This supersedes the
2026-10-30 core-first/Athena-after decision and the earlier broad optimization
gate. It does not complete Phase 1 or permit skipping data-safety and blocking
journey fixes. Further chapter simplification, compact Log, broad refactors,
cosmetic work, timers, leaderboards, and native work are paused/deferred.

Recommendations still requiring review: Singapore region; on-demand Reflect
reading plus one follow-up question; prior readings remaining readable after
expiry; renewal from the later of expiry/grant time; and live admin content
publishing after beta. Define privacy, recovery, Athena semantics, exact usage
budgets, month-end rules, and beta support before dependent implementation.
The 4-6 week estimate is provisional, not a deadline or verification result.

## 2026-10-31 — Athena replies only when asked

The developer confirmed that Athena should reply only when the person asks,
and approved recording this decision in the launch plan, product, architecture,
decision log, current task, and handoff. This approval is documentation only.

- Saving a reflection, including an answer to Athena's question, saves dated
  personal evidence without triggering an AI reply.
- Requesting a reply is a separate action subject to the Athena allowance;
  saving reflections stays free. Exact allowances remain open.
- Keep saving and reply requests separate, with the reply rule in one place.
  Later changes can then preserve existing records and immutable readings.

Reason: the person chooses when Athena joins the conversation. This also keeps
AI use deliberate and leaves the reply behavior easy to change later.
Initial reading cadence, the proposed Reflect reading/question format, exact
controls, conversation depth, provider/model, privacy, and budgets still need
review. Automatic replies and open-ended chat are not approved by this choice.
No implementation or runtime verification is claimed.

## 2026-10-31 — Requested readings appear when ready

The developer confirmed that a person requests a reading and that the requested
reading appears automatically when ready. They approved recording this flow in
the same six documents as the reply rule. Approval is documentation only.

Automatic appearance requires no second request to reveal the result. It does
not authorize automatic preparation of unrequested readings. Saving an answer
still triggers no reply; Athena replies only when asked. This clarification
settles the initial reading trigger left open in the earlier entries above.
Reflect as the location, one optional question, exact controls, conversation
depth, limits, and technical delivery details remain open. No implementation or
runtime verification is claimed.

## 2026-10-31 — Athena readings live in Reflect

The developer confirmed Reflect as the home for Athena readings and explicitly
approved recording the location in the launch plan, product, architecture,
decision log, current task, and handoff. Approval is documentation only.

This settles the reading location left open in the earlier entries. The person
requests a reading; it appears automatically when ready. Saving a reflection
triggers no reply, and Athena replies only when asked. One optional reflection
question, exact layout and controls, conversation depth, and limits remain open.
No implementation or runtime verification is claimed.

## 2026-10-31 — One optional reflection question per reading

The developer confirmed that each Athena reading includes one optional
reflection question and explicitly approved recording it in the launch plan,
product, architecture, decision log, current task, and handoff. Approval is
documentation only.

The person may leave the question unanswered. Answering saves a dated
reflection without triggering an AI reply; Athena replies only when asked.
This settles the optional-question proposal left open in earlier entries.
Readings remain person-requested and appear in Reflect when ready. Exact
layout, controls, conversation depth, and allowances remain open. No
implementation or runtime verification is claimed.

## 2026-10-31 — Received readings stay readable after paid expiry

The developer confirmed that previously received Athena readings remain
readable after paid access expires. They explicitly approved recording this
rule in the launch plan, product, architecture, decision log, current task,
and handoff. Approval is documentation only.

Expiry stops new Athena generation, not access to received readings, personal
records, core tools, or sync. Existing reading editions remain immutable. This
settles the post-expiry reading-access proposal in earlier entries; it does
not settle deletion, backup retention, or exact allowance and renewal rules.
No implementation or runtime verification is claimed.

## 2026-10-31 — Renewals preserve unused paid time

The developer confirmed that renewals add time from the current expiry while
membership is active, or from the grant time after expiry. They explicitly
approved recording this starting point in the launch plan, product,
architecture, decision log, current task, and handoff. Approval is documentation
only.

Reason: renewing an active membership preserves its unused paid time. This
settles the proposed later-of-expiry-or-grant-time starting point in earlier
entries. Calendar-month arithmetic, month-end handling, and storage/display
timezone rules remain open. No implementation or runtime verification is
claimed.

## 2026-10-31 — Membership months are fixed 30-day periods

The developer chose always 30 days rather than calendar months and explicitly
approved recording the rule in the launch plan, product, architecture, decision
log, current task, and handoff. One membership month grants 30 days; three
months grant 90 days. Approval is documentation only.

Calendar months and month-end adjustments do not apply. The confirmed renewal
starting point remains the current expiry while active, or grant time after
expiry. This resolves the calendar-month and month-end questions in earlier
entries. Storage/display timezone rules remain open. No implementation or
runtime verification is claimed.

## 2026-10-31 — Four fixed access durations

The developer specified 30, 90, 180, and 365 days of access and explicitly
approved recording those four durations in the launch plan, product,
architecture, decision log, current task, and handoff. Approval is documentation
only.

Use these explicit day counts rather than calendar-month or calendar-year
arithmetic. This expands and clarifies the earlier 30/90-day decision: the
365-day option is not twelve 30-day periods. Month-end adjustments do not
apply. The renewal starting point remains the current expiry while active,
or grant time after expiry. Exact expiry-time and storage/display timezone
rules remain open. No implementation or runtime verification is claimed.

## 2026-10-31 — Membership expiry time and local display

The developer confirmed that access expires at the same time of day after the
selected duration and is displayed in the person's local timezone. They
explicitly approved recording this in the launch plan, product, architecture,
decision log, current task, and handoff. Approval is documentation only.

Apply the duration from the agreed starting point: current expiry while active,
or grant time after expiry. A new 30-day grant at 3 pm therefore ends 30 days
later at 3 pm. This resolves the expiry-time and display-timezone choices in
earlier entries. Timestamp storage and date-calculation details require
implementation review. No implementation or runtime verification is claimed.

## 2026-10-31 — Password recovery through verified email

The developer confirmed that password recovery uses a reset link sent to the
account's verified email address. They explicitly approved recording this in
the launch plan, product, architecture, decision log, current task, and handoff.
Approval is documentation only.

This settles the forgotten-password route. Lost-email recovery, email
verification and delivery configuration, reset-link handling, expired sessions,
and lost-device behavior still require review. No implementation or runtime
verification is claimed.

## 2026-10-31 — Manual recovery for lost email access

The developer confirmed that manual recovery will be offered when a person
loses access to the account's email. They explicitly approved recording this
in the launch plan, product, architecture, decision log, current task, and
handoff. Approval is documentation only.

Verified-email reset links remain the normal password-recovery route. This
decision settles availability of a manual alternative; how the person proves
ownership and the manual process remain open for review before implementation.
No ownership-proof method or account-transfer procedure is approved by this
choice. No implementation or runtime verification is claimed.

## 2026-10-31 — Email verification before account use

The developer confirmed that new users must verify their email before using
their account. They explicitly approved recording this in the launch plan,
product, architecture, decision log, current task, and handoff. Approval is
documentation only.

This settles whether verification is required. Verification delivery, link
handling, and enforcement still need implementation review and testing.
Verified-email password reset and manual recovery for lost email access remain
the confirmed recovery routes; manual ownership checks remain open. No
implementation or runtime verification is claimed.

## 2026-10-31 — Singapore database region confirmed

The developer chose Singapore as the database region and explicitly approved
recording this in the launch plan, product, architecture, decision log, current
task, and handoff. Approval is documentation only.

Setup availability and actual connections from Myanmar and Thailand must be
checked before launch. This resolves the database-region proposal in earlier
entries. It does not settle AI processing location, other infrastructure
transfers, logs, or backup retention. No project provisioning, connectivity
verification, implementation, or deployment is claimed.

## 2026-10-31 — No separate AI opt-in prompt for readings

The developer confirmed that requesting an Athena reading requires no separate
AI opt-in prompt and explicitly approved recording that choice in the launch
plan, product, architecture, decision log, current task, and handoff. Approval
is documentation only.

The person requests the reading directly. How AI processing is explained to
users remains open, as do allowed evidence, provider processing, and retention.
This settles the separate prompt choice, not the wider processing contract.
Authentication, membership, and usage checks remain required. No implementation
or runtime verification is claimed.

## 2026-10-31 — Allowed reading evidence and excluded details

The developer confirmed that Athena may use relevant notes, reflections, goals,
habits, and activity records for readings, while keeping login and payment
details out of the AI context. They explicitly approved recording the boundary
in the launch plan, product, architecture, decision log, current task, and
handoff. Approval is documentation only.

Evidence belongs to the requesting person and remains subject to user scoping
and relevance selection. This settles the allowed-category choice left open in
earlier entries; exact selection and exclusion checks require implementation
review and verification. The processing explanation, provider processing, and
retention remain open. No real evidence was sent to a provider, and no
implementation or runtime verification is claimed.

## 2026-10-31 — Remaining beta contract choices and clarifications

The developer supplied the remaining choices in a batch, clarified admin
access and allowance carry-over, and explicitly approved documentation updates
to the launch plan, product, roadmap, architecture, decision log, current task,
and handoff. Approval is documentation only. These choices supersede conflicting
earlier proposals and open statuses; no runtime behavior is claimed implemented.

- Admin has always-available read-only access to personal writing; no separate
  support-case approval is required. Admin-only error logs may contain personal
  writing. Read-access audit details and log retention remain open. Manual
  account deletion is a separate approved admin power, not a writing-edit right.
- Lost-email recovery is handled manually. Ownership proof and the detailed
  procedure remain to be designed; no proof method is invented here.
- The developer explains AI data use manually on the website or social pages
  and tells users not to enter sensitive information. Exact wording/publication
  remain pending. The developer accepts processing Athena needs without added
  provider privacy restrictions at this stage. Actual provider retention,
  training use, and processing locations must be documented at integration.
  Login and payment details remain excluded from AI context.
- Admin manually deletes accounts and their data on request. Deleted data may
  remain in backups for at most 30 days. Deletion turnaround, retained
  devices/logs/provider copies, and restore suppression need design and checks.
- No user download/export is offered in beta. This supersedes the earlier
  user-export launch requirement; operational backups and recovery remain gates.
- Athena may use relevant evidence from the person's whole history. Requested
  replies may use all evidence available to Athena for that person. Readings
  are short, direct, calm, and advisory. Exact tone/language guidance will be
  configured later in a skill or similar file; no philosophy is authored here.
- Follow-up questions have no fixed count limit beyond usage allowance.
  Readings/replies remain explicitly requested; saving answers triggers no reply.
- Daily limits reset in Myanmar time (`Asia/Yangon`). Unused daily allowance
  carries within the person's membership cycle and disappears at its monthly
  reset; monthly allowance does not carry. The reset follows the person's
  membership cycle rather than a calendar month. Failed requests consume no
  user allowance. Exact reset hour, cycle calculation for 30/90/180/365-day
  grants, expiry/renewal effects, amounts/counting, and retry/no-change rules
  remain open. Do not infer those details from this choice.
- Login should last until logout. Local records may remain stored, with
  account separation and denied signed-out/other-account access preserved.
  Session renewal, revocation, and lost-device handling need implementation review.
- The person chooses between conflicting edits. The Circle day's timezone
  follows the person, preserving the 06:00 boundary. Exact UI/travel handling
  and preservation of dated evidence need implementation review.
- The developer monitors the beta. Live chapter publishing stays after beta.

Still open or deferred: total spending budget, prices/payment details, allowance
amounts/counting and remaining reset rules, migration ownership/recovery,
supported devices/browsers, beta duration/success criteria, supported languages
and exact tone guidance, correction behavior, log retention/auditing, deletion
turnaround/coverage, recovery/rollback procedures, and feedback route.
Provider/model selection remains deferred until integration. Provider facts and
published disclosure wording are not verified by accepting processing flexibility.
No real evidence was sent to a provider; no implementation, provisioning,
migration, staging, commit, or deployment is authorized by this entry.

## Preferences and open decisions

| ID | Topic | Status and next decision |
| --- | --- | --- |
| O-01 | Login | Verified email/password, separate alias, reset links, manual lost-email recovery, login until logout, and retained account-separated local records confirmed. Review proof/procedures, verification/delivery, session renewal/revocation/lost devices, and shared-device isolation. |
| O-03 | AI operation | Requested Reflect readings with one optional question; short/direct/calm/advisory; whole-history relevant evidence, no login/payment details. Requested follow-ups limited only by usage. Myanmar daily resets; carry-over clears at membership-cycle monthly reset; failures consume no allowance. Choose provider, exact tone/languages/controls, amounts/counting/reset details, correction behavior, and budget. |
| O-04 | Rewards | Streaks and/or leaderboard are intended possibilities. Formula, fairness, abuse handling, visibility, and MVP timing are undecided. |
| O-05 | Privacy contract | Singapore confirmed pending setup/connections. Always-available read-only admin writing access; admin-only logs may contain writing. Manual account/data deletion; deleted backup data expires within 30 days; no user export/download in beta. Website/social data-use explanation and flexible provider processing accepted; document actual provider facts. Log retention/auditing, deletion details, and published wording remain open. |
| O-06 | Trial and release | 10-20 invited Myanmar/Thailand users confirmed. Duration, supported devices, and success criteria remain open; deployment needs explicit authorization. |
| O-07 | Native implementation | Deferred; current scope is the web app with Home Screen installation. No native framework or distribution route selected. |

Evidence stays private from other ordinary users; approved admin read-only
access and admin-only writing-bearing error logs are defined above.
Recommendations awaiting product decisions: optional sharing of score summaries,
recovery that does not expose an identity,
and no ranking based on an AI judgment of a person. These are not a settled
scoring system or an approved login implementation. Paid Athena membership is
separate from the unconfirmed older Circle membership experiences below.

## Existing design conflicts to reconcile

- Idle rotation wording was reconciled by the limited-rotation decision above.
  Its browser behavior still needs verification; the other conflicts below remain open.
- Note/Line opening and swipe/reaction exits were reconciled by the Note and
  Line decision above. Runtime verification remains pending.
- Shared minimum height, Protocol growth, and forehead placement were reconciled
  by the decisions above. Their focused runtime evidence is recorded in the
  current task and handoff; broader device coverage remains pending.
- Character authority and identity relationships were reconciled by the
  decision above. Reflect Page design for Character and Six months remains a
  separate reviewed change.
- Elapsed-day versus completed-chapter gates were reconciled by the setup
  chapter decision above. Chapter completion controls App access; existing
  chapter-offer timing remains separate. Fresh browser verification is pending.

No interaction or visual rule was changed by this documentation update. The
previous decision to keep Habit right-swipe-back remains in force.

## Older roadmap ideas

Oscar, chat as a particular interface, the 3D Room, courses, and Circle
membership experiences appeared in prior documents. They have not been
reconfirmed as requirements for the web MVP or the mobile release. Do not
silently restore them as release gates.
