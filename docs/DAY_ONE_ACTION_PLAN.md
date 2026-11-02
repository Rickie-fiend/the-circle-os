# Day One: from words to one chosen action

Date: 2026-11-02 (Asia/Bangkok).

## Status and authorization

The developer approved the five recommendations and the exact documentation
scope after reviewing the proposed flow. This plan records confirmed product
choices and proposed implementation work. It does not authorize code, chapter
publication, external source edits, tests, database changes, personal migration,
staging, commits, or deployment. No new runtime behavior is implemented here.

This is a bounded addition to the invited web beta. Implement it after the
current personal-record/history and safe-sync work, before beta readiness.
Continue the [personal records plan](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) first.
Broader chapter simplification remains deferred.

## Intended result

The person finishes with their own words saved and, if they choose, one usable
action in Today. They can enter without choosing a commitment. Day One offers
a beginning; it does not assign a life plan or require another chapter.

Keep the short V3 introduction: what matters now, what they want to change,
and one optional small action. Add an explicit choice about using that action.
Save dated, source-labelled answers for later reflection, without treating an
early answer as a permanent truth about the person.

## Confirmed decisions

| Decision | Agreed behavior |
| --- | --- |
| D01. Created records | At most one task or one habit from this setup. No automatic Protocol, goal, Vision, Mission, Character, or identity declaration. |
| D02. Completion | Finish after the person confirms an action or explicitly skips setup. Leaving midway preserves resumable progress; it is not completion. Keep the shared protected terminal interaction. |
| D03. Action timing | Try once defaults to today, with another day available before confirmation. Make a habit asks for a cue. Today means the current Circle day, which begins at local 06:00. |
| D04. Existing users | Preserve completed onboarding, existing commitments and access. Offer new setup optionally; unfinished older runs resume their original versions unchanged. |
| D05. Delivery | Plan now; implement after personal-record/history and safe-sync work and before invited beta. Other deferred chapter work stays deferred. |

Keep the existing Protocol and Week access rules and Week Setup offer timing.
Saving answers, confirming an action, or finishing Day One never requests an
Athena reading. Core onboarding and commitments remain free. A later paid
explicit Athena request may use relevant saved answers within the approved
evidence rules; it must distinguish stated hopes from recorded behavior.

## Proposed page flow and example

The behavior is confirmed; exact wording, page count, branch presentation and
setup integration need review with the implementation proposal. Labels below
describe choices, not a replacement for the shared Page and button engines.

| Step | Proposed wording or example | Result |
| --- | --- | --- |
| 1. Welcome | Start with what matters. A few words are enough. You can explore more later. | Begin the short journey. |
| 2. Priority | What matters most to you right now? Answer: My health. I feel tired most days. | Save the person's supplied words with their source. Allow uncertainty. |
| 3. Direction | What would you like to be different? Answer: I want more energy after work. | Save a wanted change, without creating a declaration. |
| 4. Optional action | What is one small thing you would like to try? Answer: Walk for ten minutes. | Save an answer. Skipping goes to the finish without creating a commitment. |
| 5. Use the action | Would you like to put this into practice? Show: Walk for ten minutes. | Choose Try once, Make a habit, or Keep for later. Nothing is created by choosing a branch. |
| 6a. Try once | Show the action and today as the proposed day; allow another day. | Explicitly confirm the task wording and day, then save one task. |
| 6b. Make a habit | When would you like to do it? Answer: After dinner. Show: Walk for ten minutes after dinner. | Explicitly confirm the action and cue, then save one habit. |
| 6c. Keep for later | Keep the supplied action as a Day One answer. | Create no task or habit; do not create a backlog item. |
| 7. Finish | A place to begin. Show their direction and, only when confirmed and saved, the chosen action. | Use the shared Result/Confirm ending, then open Today. |

The existing terminal interaction protects forward travel for 1.2 seconds,
then allows a deliberate swipe. Its exact placement alongside commitment
confirmation must be reviewed under the [Page standard](../app/os/APP_SESSION_STANDARD.md#journey).
Do not replace it with an unreviewed auto-exit or a second ending engine.

An answer alone creates no commitment. A person can change branch, edit words,
or leave before confirmation without creating a partial task or habit. Do not
require habit identity, dimension, a goal, or Protocol terms in the Habit branch.
Prefill from their words and ask only for missing setup information.

After confirmation, the action is available through the existing Today/Routine
task or habit view. A future-dated task retains its chosen day and does not
appear as something due today. With no action, open the normal usable empty
view. Keep the dated Day One answers revisitable through the planned chapter
history; do not add a compulsory dashboard, next chapter, or AI result.

## Source records and confirmation boundary

Keep three meanings separate:

| Record | Meaning | Required relationship |
| --- | --- | --- |
| Day One answer | What the person said at that time | Owner, run, chapter ID/version, question/answer identity and actual recorded time; preserve the original wording. |
| Setup progress | A branch and proposed details still being considered | Recoverable progress, not an active commitment or proof of completed behavior. |
| Confirmed commitment | The task or habit the person explicitly chose | Stable domain record and confirmation/source link back to the setup and relevant answer. |

Task timing keeps the chosen Circle day separate from actual creation time.
Habit cue and later completions use the existing habit domain. Do not invent a
goal or mark Habit Building complete merely to create or expose the record.
Do not mark the habit done or the task completed when it is created.

Use existing domain actions, shared setup/edit controls, account-scoped local
stores, and the reviewed sync protocol. Repeated confirmation, reload, sync
retry, another tab, or a late server response must resolve to the same confirmed
record. Preserve an explicit confirmation/source link and receipt; exact local
and server contracts need review. Similar wording alone is not proof two actions
are duplicates.

Locally durable confirmation must be recoverable with its linked record and
completion state. A failed local save must not show success. A successful local
save can finish offline while its operation awaits an exact server acknowledgement.
Recovery must handle interruption between saving a commitment and finishing
Day One without creating another record or reporting that nothing was saved.

Before confirmation, branch changes may update setup progress. After
confirmation, later edits use ordinary task/habit editing and the approved
history rules. Reopening an answer or reading chapter history must not replay
creation, erase a commitment, or overwrite a later manual edit. Clearing an
answer records an explicit dated empty value under the existing evidence rules.

Setup choices are not model-authored memory or evidence that the action was
performed. Draft setup details are not saved lifestyle evidence for Athena.
Only explicitly saved source answers and confirmed domain records can inform
a later requested reading under the applicable evidence boundaries.

## Compatibility and source audit

Read-only source inspection found:

- [day-one-model.js](../app/os/day-one-model.js) stores V3 answers and returns
  before legacy completion effects for every version at or above 3. New behavior
  needs explicit version handling that preserves V1/V2 effects and V3's contract.
- [circle-os-shell.tsx](../app/os/circle-os-shell.tsx) contains V3-specific checks
  for Habit publication suppression and empty Routine access. Audit these along
  with splash, Thoughts delivery, Quest and direct publication paths.
- [circle-os-model.js](../app/os/circle-os-model.js) has shared task/habit actions;
  the basic task creation record does not itself supply a scheduled-day field.
  Review existing task/goal-step date handling and the new record/time contracts
  before choosing a standalone task date representation. Do not create a false
  goal or unlock Week as a shortcut.
- [existing focused tests](../tests/day-one-simplification.test.mjs) preserve
  legacy effects, V3's no-commitment behavior, and started older runs. They also
  cover offering V3 after an older completion. The new existing-user policy must
  be version-specific, not a rewrite of that historical behavior.

Publish a new immutable Day One version through the existing chapter process;
never change the content of a published version. Confirm the next version and
source inventory during implementation review. External chapter sources remain
runtime integrations and are outside this documentation approval.

For people who already finished any older Day One, retain completion and gates.
The new action setup is optional and must not reset their onboarding or replay
legacy effects. Exact discovery and supplemental-run representation need review.
For unfinished older runs, keep their original pages, answers and completion
behavior. Do not force them onto the new branch or overwrite an existing habit.

## Implementation sequence

1. Finish the approved personal-record/history and safe-sync work, including
   the source, revision, time, account ownership and acknowledgement contracts.
2. Review exact Day One wording and shared-Page interactions. Audit setup
   reuse, scheduled tasks, version selection, entry points, optional existing-user
   discovery, recovery and confirmation links. Present exact code, content,
   source-file and test scope; obtain separate implementation approval.
3. Implement the approved new version and branches using shared engines.
   Keep published versions and real personal data untouched. Verify local
   behavior with synthetic isolated accounts, including offline recovery.
4. Verify the affected sync, account-switching and mobile journeys. Fix defects,
   optimize only a measured problem, then repeat affected checks. Include the
   result in beta readiness evidence before an authorized release.

The [web beta plan](WEB_BETA_LAUNCH_PLAN.md) owns release order. This addition
does not postpone the current records work or reopen broad chapter simplification.

## Acceptance and verification plan

- Unsure answers and skipped/kept actions can finish; they create no commitment,
  invented identity, rule, declaration, goal, AI request or exercise backlog.
- Try once creates one open task with confirmed wording and chosen day. Check
  today's default before and after local 06:00, another day, and rollover while
  setup is open. Show the actual proposed date before confirmation.
- Make a habit prefills the action, accepts a cue, and creates one uncompleted
  habit visible in Routine without requiring unrelated identity/setup answers.
- Leaving before confirmation resumes the words and branch with no active
  commitment. Failed saves keep progress and show no success. Offline confirmation
  survives reload, finishing, reconnection and exact acknowledgement.
- Repeated input, interrupted confirmation, another tab, two-device retries and
  late responses create no duplicate or cross-account record. Existing edits,
  archived/completed records and explicit clearing survive recovery and merging.
- V1/V2 and V3 keep their definitions and effects. Old unfinished runs resume;
  old completed users retain access and receive only an optional new setup.
  Reading history never reruns creation. All supported entry points agree.
- Protocol stays available after a completed Day One without invented terms.
  Week still requires Week Setup, offered from the next Circle day as before.
  A task chosen in Day One does not depend on Week being unlocked.
- New flow works for free/expired users and makes no AI request. Later requested
  Athena can distinguish saved wishes, confirmed commitments and actual activity;
  draft setup stays excluded. This integration needs its own verified retrieval.
- Use isolated synthetic profiles/accounts and intercepted or isolated sync.
  Run chapter validation, focused behavioral and mobile browser checks, and
  appropriate lint/build after implementation. Recheck after fixes/optimization.
  Any geometry/type/gap change requires Note, Thoughts, Habit and Protocol height
  and forehead measurements at rest under the shared standard.

For this documentation change, check consistency, local links/fragments,
preservation of existing work and whitespace only. No new runtime, browser,
sync, device, build or chapter-compilation result is claimed.

## Remaining implementation review

The five product decisions are settled. Exact copy and layout, optional
existing-user discovery, supplemental-run representation, scheduled-task fields,
confirmation/receipt contracts, recovery and conflict presentation, external
source/version selection and exact code/test files remain bounded review work.
They do not authorize changes to brand, ratios, delivery budgets or personal data.

## References

- [Product](PRODUCT.md), [decisions](DECISION_LOG.md), [architecture](PRODUCTION_ARCHITECTURE.md).
- [Roadmap](ROADMAP.md), [web beta plan](WEB_BETA_LAUNCH_PLAN.md), [workflow](DEVELOPMENT_WORKFLOW.md).
- [Earlier chapter plan](CHAPTER_SIMPLIFICATION_PLAN.md), [current task](CURRENT_TASK.md), [handoff](SESSION_HANDOFF.md).
