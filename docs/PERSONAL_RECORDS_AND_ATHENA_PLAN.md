# Personal records and Athena evidence contract

## Template adoption and preview boundary — 2026-11-14

Explicit Routine adoption stores one immutable templateAdoptions group record:
source ID/version, retry operation, adoption time, resolved settings, answered
question/value/display snapshots, original schedule and item references. Habit
definitions/tasks point to it; answers are not duplicated into each item or
Chapter runs. Normalization and record merge preserve the map. Stopping/expiry
retains it and prior completions. Reopening reuses a still-active group; deliberate
later adoption uses a new operation after all items stop/expire. Reading source
details saves no evidence. This activates no sync, AI use, quantity tracking or
separate writing-history entry.

Approved Protocol adoption exception — 2026-11-14: only explicit Start in the signed-in published-template reader creates a local phase, using existing domain actions and the current Circle day. Admin Start stays disabled. A started run carries a sourceTemplate snapshot: exact source ID/version, stable pending operation ID, adoption time, confirmed resolved items, and answered configuration/reflection question/value snapshots. Preview alone remains transient. Catalog changes never rewrite that snapshot. Repeated operations reuse the same run; existing active/draft phases are protected. Terms remain fixed after starting. Normalization and run-level merge preserve the snapshot. This does not enable cloud sync, AI use or quantity tracking.

Admin and signed-in previews keep answers transient and excluded from personal
evidence/AI until explicit adoption. Reload restarts preview; no adoption or
completion is inferred. Accepted source snapshots retain original choice labels
as well as values. Catalog revisions never rewrite adopted records.


## Routine schedule records — 2026-11-13

Standalone definitions may carry a schedule (mode, start Circle day, inclusive end or no end, chosen days). Changing the mode or period starts the new schedule today; unchanged saves do nothing. Old completion records remain untouched. Repeating task completions live in tasks.completions, keyed by Circle day and task ID, with saved wording and explicit dated undo values. Normalization and the existing record merge retain these records independently of the current definition. This is bounded local behavior, not certification of other-domain hosted sync. Week steps retain their existing one-task ownership.


Updated: 2026-11-11, Asia/Bangkok. This owns source, revision, time, correction,
deletion and migration rules. [Product](PRODUCT.md) owns visible behavior;
[architecture](PRODUCTION_ARCHITECTURE.md) maps current/target systems;
[writing sync](ACCOUNT_WRITING_SYNC.md) specifies the implemented protocol.
Earlier proposals and implementation-stage reports are
[historical](archive/2026-11-11-doc-cleanup/PERSONAL_RECORDS_AND_ATHENA_PLAN.md).

## Scope and current state

The local writing engine, compatibility adapter, account-bound provider,
Note/Deep Thoughts UI and bounded App histories are implemented.
Writing cloud migrations/transport/resolution have bounded local/hosted evidence;
automatic activation is off. Published Chapter and Log sync have bounded pilots
for new account records. Live activation, wider domain sync, personal import,
operational recovery and requested live Athena remain incomplete.

Each account has one profile. A task linked from Week and Routine is one source,
not two actions. Different domains retain meaningful shapes rather than becoming
an undifferentiated text record. Exact future schemas need reviewed slices.

## Sources, recovery and revisions

| Layer | Meaning and rule |
| --- | --- |
| Recovery buffer | Uncommitted text/context, account-separated and excluded from saved evidence/AI |
| Source record | Intentional saved writing/action/answer with stable owner, identity, type, dates and source links |
| Saved revision | Accepted wording/status/date correction; preserve earlier accepted versions |
| Current projection | Derived App lists, day groups and summaries; no duplicate ownership |
| Tags | Optional explicit labels; inferred labels remain separate and correctable |
| Athena memory | Sourced facts/patterns/questions/corrections with validity state |
| Reading | Authored dated immutable edition |
| Sync metadata | Pending operations, exact receipts/server versions and deletion suppression |

Generated Untitled labels, placeholders, suggestions/previews and untouched
empty composers are not the person's writing. A Note without an authored title
may display Untitled. Unchanged content creates no new saved version.
Clearing an existing entry saves an explicit empty revision.

Note autosaves after pause/departure and recovers silently. New Note accepts
current text before opening a separate entry. Deep Thoughts retains explicit
Send/Save changes, its question/source links and deliberate Next question.
Clearing an unsent answer clears its recovery buffer. Neither account editor
has Versions/Undo UI or a Discard draft control; internal revisions remain.
Embedded reading answers retain their own existing controls.

Recovery has no automatic expiry. Cross-device drafts, technical cleanup,
revision compaction and receipt retention need review. Cleanup cannot turn an
old retry into a new write or erase reviewable history.

## Time, backdating and travel

The Circle day begins at local 06:00. New writing keeps the Circle day when
writing began, even if its first save crosses the boundary. Starting Tuesday
05:50 and saving 06:10 retains Monday attribution, with actual save time separate.
Editing saved writing preserves assigned day unless deliberately corrected.

Old records retain assigned day/timezone through travel; new records use current
local time. Distinguish attributed event day/timezone, known occurrence time,
first recording time, correction/version and server receipt/version. Do not
fabricate a precise completion time from a known day alone.

Backdated input is allowed as a target where a reviewed tool supports it.
Current Log corrections change saved text, not block times or date; new past
Log entries/time changes are separate work. Past Habit completion corrections
are deferred. Do not infer universal backdating UI from the general contract.

Date/timezone corrections are saved revisions protected like text conflicts.
Serialization, timezone acquisition, DST, travel and deliberate correction
interfaces still need review/testing. Myanmar-time Athena quota reset is a
different rule and does not replace local Circle days.

## Histories and correction boundaries

| Domain | Current rule |
| --- | --- |
| Note/Deep Thoughts | Circle-day groups, current entry editing, internal immutable revisions; saved-row Trash and restore |
| Routine | Combined Record: today with Undo, earlier days read only; saved completion wording/parts |
| Habit definition | Prospective edits; preserve historical snapshots, never replace them with today's wording |
| Protocol | Prospective terms from next Circle day; saved seals/wording; past phases read only |
| Log | Saved past-day text correction with ID/day/time preserved; immutable before/after words, stale-edit rejection, unchanged-save no-op |
| Week | Shared goal/task records; dated History and completed reviews read only |
| Declarations | Deliberate Save declaration creates a dated version; distinct wanted-life meanings |
| Chapter answers | Read-only saved question/answer snapshots or exact original version; no replayed outcomes |
| Received reading | Read-only immutable authored edition; no borrowing today's prose for missing parts |

In the Chapter pilot, the first accepted run stays active until the reader
chooses a copy. The device copy can replace progress while both copies are
unfinished. A synced finish stays read-only. In Log, the first accepted entry
occupies its hour. The device's words can become a correction only when both
entries are active and their day and time range match. The correction keeps
the accepted entry's ID, day, range and first-recorded time. A synced clear
remains cleared. Both pilots keep the reviewed copies on the device. A choice
can wait offline, and a newer server revision requires another review.
[Approved decisions](DECISION_LOG.md#2026-11-2324--chapter-and-log-sync-pilots).

The shared combined day view and past Habit corrections remain deferred.
Missing original dates, wording, chapter definitions and links stay visibly
unknown/unavailable. Derived setup satisfaction never manufactures completed runs.

## Trash, permanent deletion and retention

Approved Imprint study (2026-11-17): the isolated synthetic projection excludes
trashed, cleared, undone and deleted sources; another active source keeps the
group/day contribution. Restore keeps its original application age and does not
pulse. Definition archive retains completed evidence. Permanent deletion is
terminal in the study. This distinguishes projection from the existing writing
lifecycle below; it creates no production store or retention obligation. Missing
historical times/origins remain unknown. See the
[source audit and study boundaries](PERSONAL_IMPRINT_HOME.md#read-only-source-coverage-audit).

Trash is recoverable, excluded from Athena and has no automatic expiry.
Restore and confirmed Delete forever are distinct actions. Permanent deletion
must scrub accepted text, versions and drafts within its reviewed domain and
prevent stale copies from restoring it.

Deep Thought deletion retains minimal question/app-use metadata beside its
tombstone, so a deleted answer does not reset question/first-use state. No answer,
version or draft body remains in that metadata. Old missing metadata stays unknown.

Archived habits/tasks/phases, empty fields, discarded recovery and writing Trash
are different lifecycles; do not substitute one generic delete rule. Explicit
clearing writes a dated empty value; it does not remove all trace of the edit.

Wider derived/device/server/log/provider deletion and restore suppression need
review and evidence. The maximum 30-day deleted-backup retention is separate
from non-expiring recoverable Trash. Manual account deletion is the target;
no user download/export is offered in beta.

## Local-first sync requirements

- Commit a saved local change and its retryable operation together.
- Distinguish local durability from confirmed remote acceptance.
- Use stable operation IDs and server versions; device clocks never choose a winner.
- Accept revisions/receipts atomically; changed reuse of an ID is rejected.
- Persist exact acknowledgements before retiring only their named operations.
- Keep newer edits made during an upload and both competing versions until review.
- Reject late callbacks/reads/writes after logout or account change.
- Coordinate tabs without overwriting unrelated records.
- Offline-entry proof is never remote authorization.
- Represent clearing/deletion explicitly; stale upload/retry/restore cannot resurrect text.

The legacy reason-grouped outbox is not assumed to satisfy every new protocol.
Review domain schemas, owners, transaction/receipt/retention and deletion paths.
[ACCOUNT_WRITING_SYNC.md](ACCOUNT_WRITING_SYNC.md) supplies the current writing
implementation, limits and activation gates.

## Athena evidence and user controls

Intentional saved lifestyle inputs may contribute relevant evidence, not every
record to every request and not every sentence as a permanent fact.
Passwords, login/payment details, Admin codes, drafts, Trash and deleted/invalid
context are excluded. Optional tags are not a required classification exercise.

For present claims, the corrected current source is authoritative. Earlier saved
versions may provide labelled historical context; never duplicate their votes
or silently override a correction. Original evidence and AI output stay separate.

The planned request path authenticates/checks entitlement and allowance, selects
same-owner evidence with current corrections/source references, excludes invalid
material, updates relevant memory and generates the requested reading/reply.
Validate grounding/ownership and store a dated result. No interpretation on save,
correction or background profiling of free/paid people. Deterministic local
calculations remain allowed.

Wrong / Has changed / Forget and source links are confirmed controls. Exact
semantics remain proposals:

| Control | Proposed scope to review |
| --- | --- |
| Wrong | Reject an interpretation and keep enough correction to prevent silent reinstatement |
| Has changed | End its current validity without erasing an accurate earlier period |
| Forget | Suppress active context; decide source recurrence, scope and undo |

These do not automatically delete original entries. Trash/deletion must invalidate
context derived solely from those sources, including summaries/retrieval indexes.
If refresh cannot be safe, withhold stale derived context.
Old authored readings remain dated/immutable; qualifications or user deletion
after source changes require review. Never feed superseded claims back as new
personal evidence. No provider receives database administrator credentials.

## Replacement onboarding records

[The planned onboarding](ONBOARDING_SPEC.md) replaces the old optional-action
plan. Account identity, private birthday, reported situations/experiences,
wanted changes, usual times, confirmed habit and feeling remain distinct.
A habit need not serve a stated ambition. Self-reported experience is not a
measured trait or completed life percentage.

Review owners, revisions/history, correction/deletion/sync, uncertain answers,
eligibility, existing-user transition and one-time outcome receipts before code.
One explicitly confirmed daily habit must not duplicate on resume/retry.
No new record schema or migration is chosen by aligning this target.

## Migration and compatibility

Use synthetic records first. Before personal import, preserve local/profile-server
copies and review ownership, backup, rollback and idempotent mapping.
Keep legacy identifiers such as checkin-note/checkin-idle-title until mapped.
Never silently claim old records for a login.

Preserve an old ongoing Note as a source with provenance; last-edit time does
not establish original creation day. Do not split it into fictitious old entries.
Preserve question IDs/text, answers, commitments, goal links, completions,
phases/seals, declarations, chapter versions/runs and reading editions.
Repeated import must compare counts/content/links and replay no outcome.
Unknown old snapshots/dates remain unknown.

The current 60-edition browser bound is not an unlimited archive promise.
Review server history/paging rather than discarding received readings.
External runtime files stay integrations until separately migrated. Never
hand-edit generated profile/day data to make migration or tests pass.

## Verification and remaining work

Use the workflow's focused model and runtime checks, synthetic accounts and
isolated backend effects. Verify reload/offline/retry, conflict, empty correction,
Trash/restore/terminal deletion, ownership, source exclusion and old-run preservation.
Physical-device/production-store recovery, hosted session denial, backup/deletion,
other-domain sync and actual AI quality remain separate gates.

Exact source/revision retention, DST/corrections, import ownership, memory control
semantics, old-reading qualifications and new onboarding record contracts remain
open. [WORK_PLAN.md](WORK_PLAN.md) schedules the reviewed next slice.
