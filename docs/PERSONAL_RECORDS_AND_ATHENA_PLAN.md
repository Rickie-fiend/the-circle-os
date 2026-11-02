# Personal records, history, and Athena plan

Date: 2026-11-02, Asia/Bangkok.
Status: developer-confirmed product decisions; local engine A implemented and
verified with synthetic data. Live writing/history integration has not started.

The developer reviewed the decision questions and approved creating this plan
and aligning eight owning/continuity documents. This approval covers documents
only. Each implementation slice still needs an exact file list, behavior and
test proposal, manual review, and explicit approval. No application, database,
personal-data migration, provider integration, or deployment is authorized here.

On 2026-11-02 the developer also confirmed the writing interactions below and
approved updating this plan, the decision log, current task and handoff only.
Sections 5 and 7 record those choices. Section 14 contains a proposed local
implementation and checks for the next review; no code scope is approved yet.

Later in the same session the developer reviewed and explicitly approved A's
five code/test files and updates to this plan, current task, handoff and journey
record. A's delivered contract and limits are in section 14.5. B/C, personal
import, cloud work and deployment remain outside that approval.

## 1. Outcome and boundaries

People can write, revisit, and correct their own records whether or not they
pay for Athena. The records remain useful on their own. Paid Athena interprets
relevant saved evidence when the person requests help.

The system must distinguish:

1. What the person actually entered or marked.
2. How the app organizes and links those records.
3. What Athena calculates or infers from them.
4. The authored readings Athena has already given the person.

The scope covers existing writing, habits/tasks, daily and weekly records,
goals/steps, Protocol, declarations, chapter-answer evidence, reading history,
and basic Athena memory controls. It does not enable hidden Dreamline/The Four
interfaces, redesign the brand, create a leaderboard, select a native framework,
or add unrelated features. Existing hidden/legacy data must still be preserved.

This plan supersedes the one-ongoing-Note product assumption in
[NOTE_SYNC_PLAN.md](NOTE_SYNC_PLAN.md). Its durable-write, acknowledgement,
retry, ownership, clearing, and conflict requirements remain useful inputs to
the later reviewed sync design. They are not an implemented backend.

## 2. Confirmed decisions

| ID | Decision | Practical result |
| --- | --- | --- |
| D01 | Multiple Notes, grouped by Circle day | A new entry does not overwrite another Note. |
| D02 | Notes are titled, revisitable writing; Thoughts are quick untitled captures | Keep distinct writing jobs, with independent entry IDs. |
| D03 | Recover drafts automatically; use Save for Notes and Send for Thoughts | A recoverable draft is separate from saved history. |
| D04 | Drafts stay outside history and Athena evidence until saved | Unsaved text does not become a personal observation. |
| D05 | History inside each App plus a shared day view | Find a record by its purpose or by the day it belongs to. |
| D06 | Past writing is editable with earlier saved versions available | Corrections preserve reviewable history. |
| D07 | Deleted Notes/Thoughts move to Trash; restore or permanently delete | Trash is a separate recoverable state, excluded from Athena. |
| D08 | Trash has no automatic expiry | It remains until restoration or deliberate permanent deletion. |
| D09 | Habit and active Protocol changes apply going forward | Earlier records keep the applicable wording and terms. |
| D10 | Weekly reviews can be corrected with earlier saved versions available | Replace the current account of the week through a visible revision. |
| D11 | Allow past-day Notes, Thoughts, Log entries, and habit-completion corrections | Retain both attributed time/day and actual recording/correction time. |
| D12 | Old records retain their assigned day/timezone; new records use current local time | Preserve the 06:00 Circle day without silently moving history during travel. |
| D13 | Tags are optional; Athena can suggest correctable topics/feelings when used | Writing does not require a classification exercise. |
| D14 | Show Athena observations with sources and Wrong / Has changed / Forget controls | The person can inspect and correct understanding. |
| D15 | AI interpretation runs when a paid user requests Athena | No model interpretation on every save or background profiling of free users. |
| D16 | Core writing, reading, history, corrections, and sync are free | Payment gates new personalized generation, not personal records. |
| D17 | Beta requires essential history/corrections across existing tools, safe sync, and basic memory controls | Advanced search/filtering follows later; essential review is a release gate. |
| D18 | A Note without a user-entered title is called Untitled | The generated label and placeholder are not user-authored evidence. |
| D19 | Save keeps the saved Note visible, with New Note available | Saving does not immediately open a fresh composer. |
| D20 | Return to unfinished writing by reopening its recovered draft; offer Discard draft | Saved entries remain intact; drafts have no automatic expiry and remain until successful Save/Send or deliberate discard. |
| D21 | History groups writing by Circle day, newest first; open entries in the same App Box | Versions exposes earlier saved wording; a correction creates a new saved version. |
| D22 | Saving requires user writing in the title or body; unchanged content creates no extra version | The automatic Untitled label alone is not writing. |
| D23 | New writing keeps the Circle day when writing began, with actual save time recorded separately | Starting at 05:50 and saving at 06:10 does not silently move the entry to the new Circle day. |
| D24 | Move to Trash is in the saved Note's menu, with immediate Undo; Trash is inside History | Trash offers Restore and Delete forever; Delete forever requires confirmation. |
| D25 | Thoughts share draft/date/history/version/Trash rules, using Send for new entries and Save changes for corrections | Preserve Deep Thought/reading-question sources; correction neither resends an entry nor requests an Athena reply. |
| D26 | Confirm Saved on this device or Sent only after the local write succeeds | Failed saves keep text open with safe retry; draft recovery-storage failures show a warning. |

The developer selected these choices after reviewing their tradeoffs. Earlier
one-Note-per-day and single-ongoing-Note recommendations are not the chosen
product. The reasons are flexible capture, reviewable personal history, accurate
corrections, deliberate AI use, and a paid boundary that preserves core access.

## 3. Current implementation versus target

| Area | Current evidence | Target in this plan |
| --- | --- | --- |
| Note | One replaceable title/body in `checkin-idle-title` / `checkin-note` | Multiple dated entries and saved revisions. |
| Thoughts | Dated answers accumulate; no general history editor | Reviewable entries, corrections, revisions, Trash. |
| Drafts | Relevant composers use in-memory drafts | Verified account-separated local recovery. |
| Habits | Separate definitions and completions; older views can use current wording | Historical wording and deliberate dated corrections. |
| Log | Dated blocks; limited recent-day review | Essential all-recorded-day navigation and corrections. |
| Weekly review | Model refuses overwriting an existing weekly record | Versioned current review and accessible earlier versions. |
| Protocol | Run/item records and seals; active editing exists | Preserve effective terms and earlier-day meaning through edits. |
| Declarations | Dated versions and visible history for exposed kinds | Preserve and connect to the shared review model. |
| Chapters | Immutable definitions, versioned runs, answer snapshots | Essential answer review; no silent chapter-content or outcome rewrite. |
| Athena readings | Current reading visible; bounded 60-edition browser model | Reviewable reading history; storage/retention contract reviewed before expansion. |
| Athena memory | Local fact helpers, prepared memory and corrections; no complete user control surface | Sourced observations with basic user controls and safe correction propagation. |
| Accounts | Supabase entry and account-separated local stores exist | Preserve these boundaries through every record/history path. |
| Supabase evidence | Not connected | Verified owner-scoped record/revision sync and recovery. |

See [the capability audit](APP_CAPABILITY_AUDIT_2026-11-01.md) for source links.
This plan does not fix or certify those current gaps by documenting the target.

The later A implementation supplies an isolated local record engine. The live
composers still use their existing paths above; A does not make multi-entry
writing/history or honest save feedback available in the app yet.

## 4. Free and paid experience

| Experience | Free | Paid |
| --- | --- | --- |
| Notes, Thoughts, drafts, tags, history and corrections | Available | Same |
| Existing habits/tasks, Log/Week, goals, Protocol and declarations | Available | Same |
| Essential App history and shared day review | Available | Same |
| Chapters, Quests and Lines | Existing core access preserved | Same |
| Local saves, account sync and recovery | Available once implemented and verified | Same |
| Earlier saved versions and Trash | Available | Same |
| Previously received readings | Remain readable after paid expiry | Available |
| New personalized Athena readings/replies | Unavailable | Explicit requests within the enforced allowance |
| Existing understanding and correction controls | Previously available observations remain reviewable; correction does not require buying generation | Same, with requested interpretation updates |

The last row is an implementation proposal consistent with free reading and
correction. Control semantics and exact UI still need review. Recording a
correction must not secretly start a paid model call.

Existing membership decisions stay in force: manual grants of 30/90/180/365
days, renewal preserves unused active time, expiry stops new generation, and
received readings remain readable. Allowance quantities, reset details, prices,
and provider/model remain separate open decisions. No automated billing is added.

## 5. Writing journeys

### 5.1 Several Notes in a day

1. The person opens Note and writes a title, a body, or both. A missing title
   saves as **Untitled**. The automatic label and placeholder do not count as
   writing; a completely empty Note cannot be saved.
2. The app recovers and reopens unfinished writing under the correct account.
   **Discard draft** removes only the unsaved changes; saved Notes stay intact.
3. **Save** commits an entry and its first saved version. Only a successful
   durable local write earns **Saved on this device**.
4. The saved Note stays visible with **New Note** available. Another Note is a
   separate entry, even on the same Circle day or with identical text.
5. The next day starts no automatic replacement or clearing of saved entries.
6. **History** groups saved Notes by Circle day, newest first. Opening an entry
   shows it in the same App Box. The later shared day view reads the same source.

These controls and behaviors are confirmed. Exact button/menu placement,
keyboard/focus behavior and visual treatment still need the bounded UI review.
Preserve the Note label's existing Line action and the shared App Box engines.

### 5.2 Quick Thoughts

Thoughts keeps its quick untitled composer and Send action. Each newly sent
Thought becomes an entry. Deep Thoughts preserves the question, question source,
and related metadata so an answer can be understood later. A reading answer
also retains the reading/question connection.

The developer confirmed the same draft/date/history/version/Trash rules for
Thoughts. A new entry uses **Send**; a correction uses **Save changes** and
keeps the existing entry identity. **Sent** follows a successful local write.
Deep Thoughts and reading answers retain their original question/source links.
Opening or correcting an old answer must not send another entry, replay a
chapter outcome, or request an Athena reply.

### 5.3 Editing and saved versions

A saved entry has one stable identity and a current saved version. An edit is
a recoverable draft until the person saves the correction. Saving creates a
new version; earlier saved versions remain readable through **Versions**.
Saving without changes creates no extra version. Recovery must not turn every
keystroke into a user-facing permanent version.

Drafts have no automatic expiry. Keep them until successful Save/Send or
deliberate discard. If saving fails, keep the text open, explain the failure,
and allow retry without duplicate entries. If local recovery storage fails,
show a warning rather than promising recovery after reload. These are target
requirements, not verified behavior of the current in-memory editors.

Do not merge two Notes merely because their text matches. Do not count five
versions of one corrected sentence as five independent pieces of evidence.

### 5.4 Trash

Deleting a saved Note or Thought removes it from ordinary history and Athena
retrieval and places it in Trash. Trash remains until restored or permanently
deleted. Restoration keeps the identity/history. A stale device cannot silently
restore a trashed or permanently deleted entry through sync.

The confirmed interaction puts **Move to Trash** in the saved Note's menu,
with an immediate **Undo**. **Trash** lives inside History and offers **Restore**
and **Delete forever**. Delete forever asks for confirmation. Thoughts shares
these Trash rules. Undo/Restore must retain the entry's identity and saved versions.

Before implementing permanent deletion, review exact confirmation wording,
complete revision coverage, derived-memory removal/suppression, connected-device
handling, backup suppression and retry receipts. Choosing the confirmation step
does not settle complete deletion coverage or prove current implementation.

### 5.5 One-week walkthrough for implementation review

| When | Action | Expected target result |
| --- | --- | --- |
| Monday | Write body text without a title; leave and return | Recover the draft automatically; it is absent from history/evidence. Discard would leave saved Notes intact. |
| Monday | Save, then choose New Note and save another | The first displays Untitled and stays visible after Save; two distinct saved Notes belong to Monday. |
| Tuesday before 06:00 | Start at 05:50, then save at 06:10 | Keep Monday's Circle day; retain the actual Tuesday save time separately. |
| Wednesday | Find Monday in History and correct an entry | Open it in the same App Box; Save creates a new current version; Versions still shows earlier wording. A second unchanged Save adds nothing. |
| Thursday | Move the entry to Trash; use Undo or later Restore | Remove it from ordinary history/context while trashed; restoration keeps its identity and versions. Delete forever asks first. |
| Friday | Send a quick Thought; correct an older question answer | New Thought uses Send; correction uses Save changes, retains source/question links, and triggers no new entry/outcome/AI reply. |
| Weekend | Reload offline, simulate failed writes and switch synthetic accounts | Recover only the correct account's drafts/saves; show failures honestly and retry without duplicates. No cloud backup is implied. |

This is a specification for synthetic checks. No week-long use or browser
verification was performed in this documentation pass.

## 6. History and correction across existing tools

| Record family | Essential review behavior | Correction boundary |
| --- | --- | --- |
| Notes/Thoughts/Deep Thoughts/reading answers | Dated list, entry detail, saved versions, source/question where relevant | Preserve current versus earlier wording; Trash applies to Notes/Thoughts. |
| Habit definitions/completions | View dated action/cue/identity and completion state | Ordinary changes are prospective; explicit past corrections retain recording time. |
| Tasks/goals/steps | Read open and completed records, dates and links | A shared task stays one record across Routine and Week; goal completion stays explicit. |
| Daily Log | Open any recorded day and its activities/moments | Edit attributed records without pretending they were entered at the occurrence time. |
| Week plans/reviews | Open prior goals, steps and reviews | Weekly-review corrections create saved versions. |
| Protocol | Read phases, applicable terms, completions/seals, outcome and dates | Preserve earlier terms; don't silently retick a day or rewrite a seal during an edit. |
| Declarations | Read current and superseded statements with dates | Preserve existing version semantics and distinct horizons. |
| Chapter answers | Read the answered questions and saved responses in context | Published `id@version` content remains immutable; correction/outcome application needs separate review. |
| Athena readings | Read received editions and their dates | Authored editions stay immutable; later qualifications are separate. |

App-specific history and shared day review read the same underlying records.
They must not create second editable copies. A goal step remains the Routine
task it already references. Reading history must not replay completion handlers.

Basic date navigation and source links are essential history. Advanced keyword
search, compound filters, saved searches, and richer discovery can follow beta.
Optional user tags are part of the agreed record experience; they do not require
advanced tag-search interfaces before beta.

This scope does not silently grant a new universal deletion action for goals,
habits, phases, declarations, chapters or readings. Their archive/delete and
correction interactions need record-specific review. Existing archived records
remain preserved; an archive is different from writing in Trash.

## 7. Time, backdating and travel

The Circle day starts at 06:00 in the person's current local timezone. Record
the attributed day/timezone when the entry is made. Later travel must not
recalculate all old day assignments from the current device timezone.

The developer confirmed that new Notes and Thoughts keep the Circle day when
writing began, even if the first Save/Send crosses 06:00. Record the actual
save time separately. For example, Tuesday 05:50 belongs to Monday's Circle day;
saving at Tuesday 06:10 preserves Monday attribution. Editing saved writing
keeps its assigned day unless the person deliberately corrects it.

A proposed common contract distinguishes:

- Attributed event day and timezone.
- Occurrence time when actually known or supplied by the person.
- First recording/saving time.
- Later correction time and version.
- Server receipt/version information used for sync, not to redefine when life happened.

Backdated entries are permitted. A Monday habit recorded Tuesday belongs to
Monday with Tuesday recorded as its entry time. Do not fabricate an exact
Monday completion clock time when only the day is known.

A deliberate date/timezone correction is a saved revision. Concurrent date
and text changes need the same conflict protection as text-only changes.
Exact timestamp serialization, timezone acquisition, DST handling and interface
must be reviewed and tested. These mechanisms are proposals, not database choices.

The Myanmar-time Athena allowance reset is a separate existing rule. It must
not replace the person's local Circle-day rule.

## 8. Proposed record architecture

Use shared ownership, revision, persistence and sync conventions while keeping
domain records meaningful. This is not a proposal to turn every habit, Log block
and declaration into an undifferentiated text blob.

| Layer | Content | Rule |
| --- | --- | --- |
| Drafts | Uncommitted text and editor context | Local recovery, account-separated, excluded from history/AI. |
| Source records | Saved writing, actions, commitments, answers | Stable identity, owner, type, dates, source links. |
| Saved revisions | Accepted wording/status/date corrections | Earlier saved versions reviewable; current version clearly identified. |
| Current read views | App lists, day view, completion summaries | Derived from source records; no duplicate ownership of the same fact. |
| Categorization | Optional tags, domain links, inferred labels | Separate explicit labels from inferred ones. |
| Athena memory | Facts, patterns, questions, corrections | Source/version references and validity state; rebuildable where appropriate. |
| Readings | Authored published editions | Dated and immutable, with controlled history access. |
| Sync bookkeeping | Pending operations, exact receipts and versions | Durable, idempotent and guarded by account/session. |

Candidate shared fields are owner, record ID/type, domain relationships,
attributed day/timezone, occurrence/recorded/updated times, current revision,
status and origin. A's new-writing local schema is now implemented in section
14.5. SQL, indexes, ownership/import mapping and integration remain reviewed
follow-up work, not database decisions hidden inside this document.

Automatic local draft recovery and reopening are required. Drafts have no
automatic expiry; successful Save/Send or deliberate discard ends that draft.
Cross-device draft sync, technical cleanup of completed/discarded drafts,
revision compaction and receipt retention still need review. No cleanup may
make an old retry become a new write or erase reviewable saved history.

## 9. Categories and meaning

The app knows type, owner, time and explicit links without a model. Users may
add tags but need not categorize every sentence. Athena may derive additional
topics and feelings during a requested paid interpretation.

Proposed categorization separates:

- Record type: Note, Thought, activity, habit completion, goal or other domain.
- Explicit topic/tag and links to goals, habits, phases or declarations.
- A feeling the person actually stated.
- A preference or intention the person actually stated.
- A calculated observation over recorded evidence.
- An inferred topic, feeling, preference or pattern with supporting sources.

Mind/Body/Spirit/Social remain useful lenses, not the only taxonomy. A record
may concern several topics or dimensions. No category is mandatory merely to
make a database simpler. English regex matches cannot establish universal
language understanding; Myanmar, English and mixed-language cases need checks.

Examples:

- Reading a book is not evidence that the person liked it.
- Missing a checkmark is not proof that the habit was not done.
- One sad day is not a permanent personality trait.
- Quoted, fictional or hypothetical text is not automatically autobiographical.
- No activity record means no recorded evidence, not no life lived.

## 10. Athena evidence and user controls

All intentional saved lifestyle input can contribute relevant evidence: writing,
reflections, goals, declarations, habits/tasks, activity, phases and answers.
That is not a requirement to send every record on every request or treat every
sentence as a durable personal fact. Passwords, login/payment details, admin
codes, unsaved drafts and trashed writing are outside the personal AI context.

The current version of a corrected source is authoritative for present claims.
Earlier saved versions can provide explicitly labelled historical context when
relevant. They must not become duplicate votes for a pattern or contradict a
correction without explanation. Original records and AI output stay separate.

### Request path

1. Authenticate the person and check the paid entitlement and allowance.
2. Select relevant same-owner saved evidence across permitted history.
3. Exclude drafts, Trash, deleted sources and invalid/suppressed derived context.
4. Include applicable corrections and version references.
5. Update relevant memory and generate the explicitly requested reading/reply.
6. Validate grounding, source isolation and output structure.
7. Store the dated reading and make the requested result appear when ready.

No AI interpretation runs automatically on every save, for free users in the
background, or as unrequested background preparation for paid users. Ordinary
storage, local organization and recording corrections do not require a model
call. This does not prohibit deterministic calculations in the free core.
Existing prepared-content integrations remain distinct until deliberately migrated.

The model never receives database administrator credentials. A constrained
service owns evidence authorization. Failure or exhausted allowance must not
disable writing, history, local recovery or sync. Existing failure-accounting
and requested-reply rules remain in force.

### Basic understanding controls

The confirmed controls are observations with source links, Wrong, Has changed,
and Forget. The following exact semantics are proposals for interaction review:

| Control | Proposed meaning |
| --- | --- |
| Wrong | Reject this interpretation and retain a correction so the same unsupported claim is not silently reinstated. |
| Has changed | Qualify when it stopped being current; do not erase an accurate earlier period. |
| Forget | Suppress this item from active memory/context; review how recurrence from the same sources is prevented. |

These actions are not automatic deletion of the person's original entries.
Trash/permanent deletion is a separate source-record action. The exact scope of
Forget, undo behavior, propagation timing and wording needs review before code.

Trashing/deleting a source must also exclude context derived solely from it.
Source/version dependencies must cover summaries and any future retrieval index,
not just visible ledger facts. If derived context cannot be safely refreshed,
exclude it instead of using known stale interpretation.

Old authored readings stay dated and immutable. How their display is qualified
when a source is corrected/deleted, and when a user may delete a reading itself,
requires review. Do not silently rewrite an old edition or feed its superseded
claims back as new personal evidence.

## 11. Data flow

The following is the target, not current implemented behavior.

```mermaid
flowchart TD
    Input[Person writes or records an action] --> Draft[Recoverable local draft where applicable]
    Draft -->|Save or Send| Source[Owned source record and saved revision]
    Action[Habit, Log, goal or Protocol action] --> Source
    Source --> Local[Durable account-scoped local save]
    Local --> History[App history and shared day view]
    Local --> Pending[Durable pending operation]
    Pending --> Cloud[Authorized cloud transaction and exact receipt]
    Cloud --> Local
    Source --> Tags[Explicit tags and domain links]
    Source --> Trash[Trash for deleted writing]
    Trash -->|Restore| Source
    Trash -->|Deliberate permanent deletion| Deleted[Deletion and recovery safeguards]
```

```mermaid
flowchart TD
    Request[Paid user explicitly requests Athena] --> Gate[Identity, entitlement and allowance checks]
    Gate --> Select[Relevant current and labelled historical evidence]
    Saved[Owned saved records and applicable corrections] --> Select
    Select --> Exclude[Exclude drafts, Trash, deleted and invalid derived context]
    Exclude --> Context[Evidence with source and version references]
    Context --> AI[Requested interpretation and relevant memory update]
    AI --> Validate[Grounding and isolation validation]
    Validate --> Edition[Dated immutable reading in Reflect]
    Validate --> Memory[Sourced correctable understanding]
    Memory --> Controls[Wrong, Has changed, Forget]
    Controls --> Corrections[Saved correction state for later retrieval]
    Corrections --> Select
```

Free users use the record/history path. Previously received readings remain
readable after expiry. Writing a new reflection does not itself request a reply.

## 12. Local-first sync and deletion requirements

Carry forward the useful contract from the earlier Note plan:

- Commit a local saved change and its retryable operation together.
- Confirm durable local save separately from confirmed cloud acceptance.
- Use stable operation IDs and server versions; device clocks do not pick a winner.
- Accept revision and receipt atomically; retry returns the original result.
- Reject reuse of an operation ID with different content.
- Persist exact acknowledgements before retiring only those named operations.
- Preserve edits made while an earlier upload is in flight.
- Preserve both competing versions until the person chooses/resolves them.
- Coordinate same-account tabs without overwriting unrelated records.
- Reject late reads/writes/acknowledgements after logout or account change.
- Never use an offline-entry proof as remote authorization.
- Represent clearing/deletion explicitly so stale copies cannot restore them.

The protocol must be reviewed per domain; writing in Trash, an archived habit,
a cleared field and a discarded draft are different lifecycle events. The
existing reason-grouped outbox is not assumed sufficient for this contract.

No automatic Trash expiry was chosen. The existing maximum 30-day retention of
permanently deleted data in backups remains a separate release requirement.
Review live revisions, receipts, memory, logs, retained devices and restore
suppression before claiming complete deletion. Manual account deletion and
admin read-only access remain the existing approved direction. No user export
is added to beta by this plan.

## 13. Migration and compatibility

1. Use isolated synthetic records before any personal migration.
2. Preserve the existing local/profile-server copies and their ownership.
3. Review an explicit owner mapping; never silently claim legacy data for a login.
4. Preserve `checkin-note`, `checkin-idle-title` and other legacy identifiers
   until the mapping/migration is approved and verified.
5. Import the current Note as one preserved legacy source with provenance.
   Its last edit time is not proof of its original creation day. Do not invent
   missing old Notes or split text into fictitious historical entries.
6. Preserve existing Thoughts, question IDs/text, answers, tasks, goal links,
   habit/completion records, phases/seals, declarations, chapters and readings.
7. Preserve published chapter versions and the definitions old runs used.
   A reading/history migration must not rerun completion side effects.
8. Preserve uncertainty where old habit/Protocol wording snapshots or precise
   timestamps do not exist. Do not label reconstructed data as original evidence.
9. Make repeated import idempotent and compare counts/content/references.
10. Verify backup, rollback, recovery and cloud/local conflicts before real use.

The 60-edition browser bound is not a promise of unlimited current reading
history. Review cloud archive/retention and local paging before removing a bound;
do not discard existing received readings to make the new design easier.

No generated profile or day state is to be edited by hand. External runtime
files remain integrations until a separately reviewed migration replaces them.

## 14. Implementation sequence

Each stage follows code, focused tests, bug fixes, runtime verification,
evidence-based optimization only when justified, then re-verification.

| Stage | Bounded purpose | Required evidence before moving on |
| --- | --- | --- |
| 1. Contracts and interaction review | Shared source/revision/draft/status/time contracts; Note/Thought/history/Trash flows; next exact file scope | Reviewed user journeys and synthetic contract cases; unresolved choices explicitly bounded. |
| 2. Writing locally | Notes, Thoughts, draft recovery, saved versions, optional tags, Trash, App history | Mobile writing/reload/correction/restore paths; quota/write-failure and account-isolation checks. |
| 3. Existing-tool history | Habit/Protocol historical meaning, Log/Week corrections, task/goal links, declaration/chapter/reading review, shared day view | Representative all-recorded-day journeys and no replay/duplication; geometry measurements if affected. |
| 4. Safe account sync | Reviewed ownership schema, local operations, receipts, conflicts, synthetic restore and later owner migration | Real database allow/deny tests; two tabs/devices; offline/retry/clear/Trash/recovery; safe migration approval. |
| 5. Membership | Existing grant/renewal/expiry and usage contract | Server enforcement, concurrent requests, failure accounting, free-core access after expiry. |
| 6. Requested Athena and controls | Provider integration, relevant evidence selection, sourced memory and Wrong/Has changed/Forget | Grounded multi-language synthetic cases, correction/deletion exclusion, source links, current-paid request checks. |
| 7. Beta readiness | Essential histories, corrections, safe sync, basic memory controls, operating/recovery checks | Critical bug gates, real-phone/Home Screen and region checks, backup/restore/deletion evidence, explicit release approval. |

Candidate code areas include the existing shared model/provider/store,
account/auth boundary, focused domain models, chapter/read models, Reflect,
App Box/Page/gesture/edit engines, legacy transport boundary and proposed
Supabase migrations/tests. These are areas to inspect, not an approved code list.
Reuse them rather than building a disconnected replacement.

Stage boundaries may be split further for review. A locally verified component
is not automatically safe to use with real cloud data. No new performance
budget, fixed schedule, geometry ratio or AI allowance is chosen here.

### 14.1 Proposed local contracts

The following table was the engineering proposal reviewed before A. Its local
engine subset is now implemented as described in section 14.5. It does not
approve B/C, a Supabase schema, or additional product decisions:

| Part | Proposed local contract |
| --- | --- |
| Source | Stable owner/entry ID and kind: Note, Thought, Deep Thought or reading answer. Keep question text/ID/source and reading/edition links where known. Identical text does not merge distinct entries. |
| Content version | Immutable saved content with a version ID and base version; one current version. Compare user content, tags and deliberate attribution edits for a meaningful change. Separate lifecycle events from user-facing wording versions. |
| Title | Retain whether a title was entered. Display Untitled for an absent Note title without representing the generated label as the person's words. A user-entered title alone or body alone can make a nonempty Note. |
| Draft | Separate account-owned draft ID, optional entry/base-version link, editor/question context, text/tags and start attribution. Draft writes do not enter saved history, derived memory, legacy payloads or an upload queue. |
| Time | Capture starting Circle day and timezone at the first user edit rather than opening an untouched composer. Use UTC instants for start/first save/later corrections, retain an IANA timezone and attributed day, and leave unknown occurrence times unknown. Serialization/DST and timezone fallback require review/tests. |
| Local commit | In one scoped IndexedDB transaction, save the accepted version/current pointer, retry operation/receipt and completion of its draft. Publish success after transaction completion, preserving edits typed while an earlier save is in flight. |
| Retry/conflict | Stable operation ID; repeating the same operation returns its existing result. Reject ID reuse with changed content. Check the base version inside the transaction; retain competing text for person-chosen resolution rather than selecting a device-clock winner. |
| Lifecycle | Active and trashed writing have explicit state. Permanent local deletion covers source text, versions and associated drafts; content-free deletion/operation metadata prevents stale retry resurrection. Wider memory/device/server/log/backup coverage needs its own verified contract. |
| Read views | History/Versions/Trash and later shared day review select the same source. Active evidence uses only the current saved version of active writing; exclude drafts, Trash and deletion, and suppress context derived solely from excluded or corrected versions. |

Reuse [account-scope.js](../app/os/account-scope.js)'s account names and scoped
transaction/abort checks. A proposed dedicated local writing store separates
recoverable drafts from the whole-state legacy transport. This is an extension
of existing ownership/persistence engines, not another profile or login system.
IndexedDB failure/recovery behavior must be reviewed before claiming a durable
fallback; a memory-only editor or successful localStorage copy is not a committed
IndexedDB save.

### 14.2 Source findings that shape the proposal

- [The shell](../app/os/circle-os-shell.tsx) currently keeps Note/Thought drafts
  in React state. Its Note blur commit falls back to placeholder text when the
  title is empty; bug 6 still needs browser reproduction. Thought submission
  sets Sent after the state update, before the provider's async persistence
  effect completes. These are source findings, not fresh runtime reproductions.
- [The model](../app/os/circle-os-model.js)'s `answerSurveyQuestion` replaces an
  answer by question ID. Normalization and legacy merge do not supply the new
  writing-version/Trash contract. Existing IDs and their uncertainty must survive
  the separately reviewed compatibility mapping.
- [The store](../app/os/circle-os-store.ts) persists a whole-state copy using
  account scope; [the transport](../app/os/circle-os-ai.ts)'s `buildServerPayload`
  spreads that state. Adding recoverable drafts to that payload would breach the
  draft/evidence boundary. Account mode already rejects this legacy transport;
  it has no implemented Supabase writing sync.
- [Reflect](../app/os/mirror/page.tsx) currently saves a reading answer through
  the survey-answer path. Its original prompt/edition relationship and existing
  prepared readings must survive the future integration without replaying outcomes.

### 14.3 Proposed files and bounded order

A's exact five-file code scope and four evidence/continuity documents were
reviewed and explicitly approved after the documentation review. **A is now
implemented and verified for its synthetic engine scope.** B and C remain
proposals; their compatibility/UI details must be resolved before code approval.

| Slice | Exact proposed paths | Purpose and boundary |
| --- | --- | --- |
| A: local record engine | New `app/os/writing-model.js`, `app/os/writing-model.d.ts`, `app/os/writing-store.ts`, `tests/writing-model.test.mjs`, `tests/writing-storage.browser.mjs` | Implement/test the local contracts, lifecycle, selectors, atomic commits, drafts, retry/conflict handling and account guards using the existing scoped transaction helper. No live editor or personal import. |
| B: compatibility and evidence integration | New `app/os/writing-provider.tsx`; existing `app/os/circle-os-model.js`, `app/os/circle-os-shell.tsx`, `app/os/circle-os-ai.ts`, `app/os/athena-memory-model.js`, `app/os/mirror/page.tsx`; existing `tests/circle-os-model.test.mjs`, `tests/account-storage.browser.mjs`, `tests/athena-memory.test.mjs`, `tests/vision-declaration.test.mjs` | Bind shared writing state/actions to account changes; review legacy IDs/unknown dates, active-source selection and stale derived-context exclusion. Preserve prepared editions. Test compatibility with synthetic fixtures before any owner mapping/import. No new model call on save. |
| C: writing/history UI | New `app/os/writing-pages.tsx`, `tests/writing.browser.mjs`; existing `app/os/circle-os-shell.tsx`, `app/os/mirror/page.tsx`, `app/os/os-app.css` | Reuse InfoPage, shared App Box, App-back, editing, gesture and button engines for the agreed Note/Thought/history/version/Trash flows and honest status. Includes bounded sign-off on control placement; no new brand language. |

Proposed action placement for C: Save or Save changes is the editor's main
action; New Note is available on the saved Note. Keep History and entry actions
secondary, preserve the Note label's Line action and Thoughts/Deep Thoughts
entry, and use the same App Box for history details. Exact layout remains review
work rather than a silent replacement of the current Page standard. Each code
slice also needs approved continuity/evidence updates; this table is not blanket
permission to edit these paths or add others discovered later.

B must not silently assign legacy profile-server writing to an account or
invent old creation dates. Review backup, ownership, idempotent mapping and
rollback before any personal import/activation. Local permanent deletion is
not a claim about existing remote copies or backups. Shared day review across
other tools, SQL/cloud sync, membership, requested Athena and Day One remain
in their later stages; sign-in/loading polish remains a separate bounded slice.

### 14.4 Proposed synthetic checks

| Area | Checks required before the affected slice is considered verified |
| --- | --- |
| Model | Two Notes/day with distinct IDs; absent title displays Untitled; generated label/placeholder alone cannot save; user title-only/body-only can save; changed save creates a version and unchanged save does not. |
| Draft/time | Reload recovers the correct editor/context; Save removes only the committed draft revision, later typing survives; discard preserves saved content; 05:50-to-06:10 retains starting day; travel/DST and deliberate backdating retain actual save/correction times and unknown legacy dates. |
| Real local storage | Actual IndexedDB commit/abort, quota/unavailable-store cases and draft-write failure. Success cannot appear before commit; failed text stays open; reload after acknowledged save reads the accepted version. |
| Retry/concurrency | Same-operation retry creates no duplicate; changed payload with reused ID is rejected; two tabs preserve unrelated entries and competing same-entry edits; logout/account change rejects queued and late work. |
| Lifecycle/evidence | Trash leaves ordinary history/evidence, Undo/Restore retain IDs/versions, confirmed Delete forever covers local content and stale retries cannot recreate it. Drafts/Trash/deletion and invalid derived context stay excluded from legacy payloads and active evidence. |
| Questions/compatibility | Deep Thought/reading answers keep prompt and edition sources; correction updates the same entry with Save changes, no resend/outcome replay/AI request. Repeated synthetic compatibility import preserves counts/text and records unknown dates honestly. |
| App/browser | Run the week-long walkthrough in isolated mobile Chromium at 390x844 and 360x844, including actual offline reload, history navigation, failure/retry, confirmed deletion and account switching; block external backend effects. Reproduce the placeholder report before changing that path. |
| Geometry/regression | After UI geometry/type/gap changes, measure rendered Note, Thoughts, Habit and Protocol minimum heights and forehead gaps, short/empty equality and downward growth. Preserve focus, swipe/button/keyboard paths, Line exits, limited idle rotation and immutable chapters/readings. |

For A, proposed commands are
`node --test tests/writing-model.test.mjs tests/account-scope.test.mjs` and
`node --test --test-reporter=tap tests/writing-storage.browser.mjs`.
For B, run affected model/memory tests and the existing account-storage browser
harness. For C, add `node --test --test-reporter=tap tests/writing.browser.mjs`
against the app and run affected account/reading/chapter regressions. Use focused
lint and the relevant build targets (`npm run build:vercel` and `npm run build`)
when integration changes reach the app, distinguishing recorded baseline failures.
Repeat affected checks after fixes or any measured optimization. A's test files
are now delivered and its commands passed as recorded below. B/C tests and live
app journeys remain proposed and unrun for this slice. The preceding writing-
interaction documentation pass itself ran no implementation checks.

### 14.5 Local engine A delivered - 2026-11-02

Approved and implemented: [writing-model.js](../app/os/writing-model.js), its
[type contract](../app/os/writing-model.d.ts), [writing-store.ts](../app/os/writing-store.ts),
[model tests](../tests/writing-model.test.mjs) and the
[browser storage harness](../tests/writing-storage.browser.mjs).
This plan, current task, handoff and journey record are the four approved record
updates. Pre-existing decision-log work is preserved without additional edits.

The model owns schema version 1 with owner, entries, drafts, receipts and
tombstones. Commands are write-draft, save, discard-draft, trash, restore and
confirmed delete. Sources keep stable entry IDs/kinds and original question/
reading links; saved content versions are immutable. History/Versions/evidence
selectors return copies. Untitled is a display label, not authored evidence.
Drafts and inactive sources do not enter the active saved-evidence selector.

The store reuses the existing account-scope/transaction helper. It reads and
updates one dedicated `circle-os-writing-v1` ledger inside the same IndexedDB
transaction, with the existing account-name suffix for signed-in scopes.
Legacy mode has a separate new writing database; no old profile/state store is
read, claimed or imported. There is no localStorage fallback. Failures reject
the operation, and success resolves only after transaction completion.

`prepareWritingOperation` copies/normalizes the command, computes its SHA-256
fingerprint before the transaction, and freezes the prepared request. The store
checks the captured owner/session again after that await. Receipts retain retry
identity and result metadata without retaining command text. A repeated operation
returns its original receipt; changed content with that ID is refused. These are
local receipts, not cloud acknowledgements or a completed sync outbox.

Base versions/generations and draft counters protect competing writes. A
conflicting candidate remains a draft without creating duplicate recovery copies
when that candidate is already stored. Explicit rebasing can accept a chosen
candidate; the person-facing resolution controls remain B/C work. Edits made
during an earlier Save stay recoverable in either commit order and can follow
their own accepted version. Discard closes stale draft writes. Trash hides
associated edit drafts from ordinary recovery without erasing them; Restore
reveals them again. Saved/discarded draft markers contain no title/body/tags.

New-write APIs require canonical UTC ISO instants and an explicit supported
named timezone. Starting attribution uses local wall-clock 06:00, including DST;
actual first-save/correction times stay separate and unknown occurrence time is
null. The future UI must capture the first user edit and retain its day/zone.
Unknown legacy creation dates still need B's provenance/compatibility design;
the new-write API must not fabricate them for an import.

Confirmed deletion requires Trash and the current generation. It removes the
entry, all saved versions and associated drafts/markers from this ledger, while
retaining content-free deletion/receipt metadata. An exact old retry may return
its original receipt, but the returned current state stays deleted: consumers
must render current state, not reconstruct an entry from a receipt. This does
not delete existing profile-server data, prepared memory, logs or backups.

Final checks: 33/33 model/account tests and 18/18 isolated Chromium storage cases
passed; focused lint and the standalone strict TypeScript check for the new store
passed. Full commands, fault injection, initial failures/fixes and coverage limits:
[journey evidence](USER_JOURNEY_TESTING.md#local-writing-engine-2026-11-02).
No full build, application UI/browser journey, hosted/device, cloud sync, backup
or migration result is claimed. The existing UI placeholder/Sent issues remain.
No performance optimization was justified; large-history footprint and live
startup/rendering were not measured. Geometry, budgets and immutable published
chapter/reading content are unchanged.

## 15. Acceptance checks

| Journey or risk | Required result |
| --- | --- |
| Two Notes on one Circle day | Separate entries; both readable next day. |
| Draft interruption | Correct account/editor recovers; draft is absent from history and AI context. |
| Save/Send | Durable local result is distinguishable from typing, failure and cloud acknowledgement. |
| Untitled/empty save | A missing title displays Untitled; only actual user writing permits Save, and placeholder/generated words are not personal evidence. |
| Saved Note and return | Successful Save leaves the Note visible with New Note available; returning to unfinished writing reopens its recovered draft. |
| Saved correction | Stable entry identity, new current version, readable earlier versions. |
| Unchanged save | No additional saved version or duplicate entry. |
| Multiple history views | Same source record appears consistently; no copied editable record or double evidence count. |
| Today rolls at 06:00 | New attribution follows the boundary; earlier writing remains. |
| Draft crosses 06:00 | Save/Send keeps the Circle day when writing began and records actual save time separately. |
| Backdated habit/log/writing | Attributed day is distinct from actual entry/correction time; no fabricated clock time. |
| Travel or DST | Old day/timezone is retained; new attribution/corrections follow reviewed rules. |
| Habit/Protocol edit | Historical action/terms remain accurate, including earlier activity on the same day where relevant. |
| Weekly correction | Earlier weekly version remains readable; goals/phases are not duplicated by replay. |
| Completed task/goal review | Links and completion dates remain consistent across Routine and Week. |
| Chapter answer review | Original definition/version and prompt snapshots remain; no side effects from reading history. |
| Trash and restoration | Excluded from active history/context while trashed; restoration preserves identity/revisions. |
| Permanent deletion | Required copies/context are covered; stale devices/retries/restore cannot silently revive data. |
| Offline edit and retry | Local evidence survives; eventual cloud outcome acknowledged exactly. |
| Lost committed response | Same operation retry creates no duplicate revision. |
| Edit during upload | Earlier acknowledgement leaves later work pending. |
| Concurrent devices or wrong clocks | Competing values survive and the person resolves them. |
| Same-account tabs | No erased operations, writing, or unrelated records. |
| Other account/signed-out requests | Browser, tables, functions, server jobs and AI paths deny unauthorized access. |
| Free or expired account | Core writing/history/corrections/sync and received readings remain usable; new AI generation denied. |
| Optional tags | Saving needs no mandatory category; user and inferred labels stay distinguishable. |
| AI evidence selection | Relevant same-owner saved evidence only; latest corrections apply; no draft/Trash/login/payment leakage. |
| AI interpretation | Explicit statement/calculation/inference distinguished; no missing-data or temporary-feeling personality invention. |
| Memory correction | Wrong/Has changed/Forget persist without an unintended model call; later retrieval respects them. |
| Source edit/Trash/delete | Dependent stale memory/summaries/index entries are excluded or safely refreshed. |
| Requested result/failure | Requested reading appears when ready; errors retain user records and obey failure-allowance rules. |
| Repeated migration | Ownership, counts, content, links and immutable versions preserved; repeat does not duplicate. |
| Geometry/interaction changes | Measure Note, Thoughts, Habit and Protocol heights/forehead; preserve mobile targets and stable frame. |

Use focused behavioral tests, isolated mobile browser journeys and hosted
synthetic-user checks appropriate to each slice. Build/lint complements those
checks. Physical devices, production deployment and backup restoration each
need their own actual evidence; source assertions alone do not verify them.

## 16. Open implementation details and retained warnings

The following are not reopened confirmed decisions; they are details still
needed for concrete implementation:

- Exact visual placement of the confirmed writing controls, remaining failure/
  conflict/status wording, shared day view and memory-control layout. Untitled,
  saved-Note visibility/New Note, reopening/discard, History/Versions/Trash and
  Save/Send/Save changes choices are settled in section 5; do not ask them again.
  Preserve Circle identity and obtain the appropriate UI review before visuals.
- Local schema, SQL, grants/functions, indexes, operation order, transaction
  fallback, revision/receipt retention, paging and resource limits.
- Cross-device draft behavior, per-editor routing/multiple unfinished drafts,
  technical cleanup after Save/Send/discard and comparison rules for content,
  tags and attribution. Draft automatic expiry is rejected and unchanged saves
  create no extra version; those are no longer open choices.
- Record-specific deletion for non-writing types; Forget semantics/undo and
  qualifications of old readings after source correction/deletion.
- Source attribution for imported records with unknown historical dates/wording.
- Provider/model, supported languages, tone instructions, allowances, remaining
  reset math, spending controls, payment/prices and real region connectivity.
- Manual lost-email recovery proof, admin audit/log retention, deletion coverage,
  restore suppression, operating/rollback instructions, beta devices/duration/success.

Supabase login/local isolation exists; lifestyle sync and operational backup do
not become implemented through this plan. Hosted refresh/revocation, physical
phones/other browsers, prior Reflect fixture/swipe failures and broader release
checks remain open. Sign-in/loading polish is an early separate proposal under
the later [work queue](WORK_PLAN.md), not part of this writing scope. Phase 1
is not certified.

The preceding audit ran 256 selected local tests: 255 passed and one source
assertion failed because of CRLF-sensitive matching; normalizing in memory
matched. No fix or new runtime test is claimed in this planning pass. Earlier
standalone TypeScript, shell lint, broad-suite and dependency-audit gaps remain
qualified by their dated evidence in [the journey record](USER_JOURNEY_TESTING.md).

## 17. Document delivery and next action

Approved document scope: this plan, product, architecture, decision log, roadmap,
web beta launch plan, the supersession notice on the old Note plan, current task
and handoff. Preserve the existing untracked capability audit and all prior
unique handoff/task evidence. No staging, commit, push or deployment is requested.

Check agreement between decisions and owning documents, local links/fragments,
and whitespace. Documentation checks are not runtime verification.

Delivery checks: consistency review completed; 95 local links including 20
heading fragments passed across all nine approved documents. Tracked whitespace
checks passed with existing LF/CRLF warnings; the new plan's whitespace and code
fences were checked separately. No runtime checks were run for this document task.

The later writing review approved recording D18-D26 and the concrete proposal
in section 14, plus the decision log/current task/handoff updates. This four-file
pass is documentation only. Its checks are recorded in the latest handoff;
the initial 95-link audit above remains dated evidence, not a result for new text.

This update's consistency/format review and read-only link audit passed: 75
local links, including 24 heading fragments, across the four approved documents.
Prior task/handoff/decision entries remain unchanged after newline normalization.
The 242-file baseline comparison found exactly the four intended changes and
238 unchanged files, with no additions/removals. `git diff --check` passed with
the existing LF/CRLF warnings. No runtime or implementation check is claimed.

Next: review B's compatibility/evidence contract, including unknown legacy dates,
owner mapping, stale derived-context exclusion and consumers of local receipts;
present a bounded file/test proposal before integration. Review C's exact control
placement and draft routing before UI code. Personal import/activation, cloud
work and deployment remain separately reviewed. A is verified only for its local
engine scope; the earlier single-Note sync proposal is not the next unchanged step.

## References

- [Product direction](PRODUCT.md)
- [Architecture](PRODUCTION_ARCHITECTURE.md)
- [Decisions](DECISION_LOG.md)
- [Delivery roadmap](ROADMAP.md)
- [Web beta plan](WEB_BETA_LAUNCH_PLAN.md)
- [Earlier Note sync mechanisms](NOTE_SYNC_PLAN.md)
- [Capability audit and source guide](APP_CAPABILITY_AUDIT_2026-11-01.md)
- [Design](../DESIGN.md) and [Page standard](../app/os/APP_SESSION_STANDARD.md)
- [Development workflow](DEVELOPMENT_WORKFLOW.md)
- [Journey evidence](USER_JOURNEY_TESTING.md)
- [Bugs](../bugs.md)
- [Current task](CURRENT_TASK.md) and [handoff](SESSION_HANDOFF.md)
