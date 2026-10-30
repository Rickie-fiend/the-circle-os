# Current task

## Admin chapter page removal — 2026-10-30

Approved scope: expose Remove page beside the live-preview move controls,
confirm removal, return the preview/settings to the previous page, and preserve
the cover and final Result/Confirm page. Include focused browser tests and
task/handoff evidence. Keep the existing Save draft flow.

Implementation: `app/os/admin/chapter-editor.tsx`. The existing Delete page
control in Page settings shares the confirmed removal action. Add page now
selects its new page in both preview and settings and avoids ID collisions
after removing an earlier page. No publication or profile records are changed.

Status: implemented; final verification results are recorded in the latest
admin-removal entry in [the handoff](../SESSION_HANDOFF.md). Browser regression
coverage is in `tests/chapter-editor.browser.mjs`; it requires an isolated local
server on port 3217 with the synthetic admin code declared in that file.

Acceptance: confirmation can be cancelled; confirmed removal selects the
previous page; saved removal survives reload; add/remove/add keeps unique IDs;
cover and ending remain protected. Check at 390px and 360px with isolated data.

Next action: review the local admin change. The wider Phase 1 work below still
needs its own approved scope. No staging, commit, or deployment was requested.

## Previous completed task and stabilization context

## Title

Review conflicting interaction rules with the developer

## Status

Complete: interaction-rule decisions (step 5 of the reviewed sequence).
Broader runtime verification and stabilization remain open.
Roadmap: [Phase 1 — stabilize existing behavior](../ROADMAP.md).
Idle rotation's documentation conflict is resolved by the developer-approved
[limited-rotation decision](../DECISION_LOG.md#2026-10-30--limited-idle-rotation-confirmed).
Note opening and Line exits are also resolved by the approved
[Note and Line decision](../DECISION_LOG.md#2026-10-30--note-and-line-confirmed).
The geometry measurement pass and approved empty-Routine fix are complete.
Protocol content growth is resolved by the approved
[Protocol sizing decision](../DECISION_LOG.md#2026-10-30--protocol-grows-to-show-its-terms).
Main placement is resolved by the approved
[forehead decision](../DECISION_LOG.md#2026-10-30--main-content-keeps-the-forehead-anchor).
Character authority is resolved by the approved
[Character decision](../DECISION_LOG.md#2026-10-30--character-is-authoritative).
Its alignment implementation and labelled fallbacks are verified. The earlier
rotation and Line-exit paths were not retested.
The final gate conflict is resolved by the developer-approved
[setup chapter decision](../DECISION_LOG.md#2026-10-30--setup-chapters-control-app-access).
Protocol opens after Day One; Week opens after Week setup. Existing automatic
offer timing is preserved. Comments were clarified without changing behavior.
Focused gate tests passed 4/4; these paths were not freshly browser-tested.

## Purpose

Agree on expected behavior before changing affected code or writing tests
that would silently choose one of the conflicting rules.

## Scope

Compare the relevant passages in `AGENTS.md`, `DESIGN.md`,
`app/os/APP_SESSION_STANDARD.md`, and the [decision log](../DECISION_LOG.md).
Inspect related code and prior rationale as needed. Review:

Resolved in documents: only the Today Note/Thoughts box and its two-page Line
side may turn automatically. Other Apps and chapter journeys do not rotate.
Note opens its Line back, not a recalled Chapter. Lines leave by the approved
swipe/reaction paths, not by a timer or Note return button.

Remaining conflicts in this review: none. This closes the rule decisions,
not the outstanding runtime verification or wider stabilization work.

## Geometry findings — 2026-10-30

[Measured evidence](SESSION_HANDOFF_2026-10-30.md#2026-10-30--step-5-mobile-geometry-measurements):
18 synthetic scenarios at 390x844 and 360x844; 72 surface captures, plus two
390px repeat inspections. Corrected runs had no page errors or unsettled samples.

| Resting surface | Height at both widths |
| --- | --- |
| Note / Thoughts, short text | 344px |
| Empty Routine, no active habits/tasks | 361.36px |
| Empty Protocol home | 344px |

Label-to-first-visible-content gaps were 80.90–80.91px. The common top anchor
holds on these surfaces; strict equal resting heights do not. Empty Routine
retains a 100.38px Sub Body containing its section labels despite zero rows.

Longer/populated content grew: four-line Note 375.34px; four-line Thoughts
378.38px at 390px / 375.73px at 360px; Routine with three habits and three
tasks 729.70px; Protocol draft with three terms 642.78px; active Protocol with
three terms 548.70px. An empty Protocol draft with controls was 561.22px.
A draft is not the same surface as empty Protocol home.

### Empty Routine fix verified

The developer approved omitting idle body content when both Routine lists are
empty. This lets the shared `:empty` rule collapse the Sub Body; New habit and
Add task remain available. Populated rendering and geometry tokens are unchanged.

Fresh Next production build, isolated Chromium at 390x844 and 360x844:
empty Note, Thoughts, Routine, and Protocol home now all measure 344px.
Routine was previously 361.36px. Adding a habit/task, clearing both, and
reloading returned Routine to 344px at both widths. Habits-only, tasks-only,
and three-habit/three-task fixtures rendered their expected row counts.
The populated Routine remains 729.70px; active Protocol remains 548.70px.
All eight browser cases passed, with 38 settled measurements and no page errors
or horizontal overflow flags. Label gaps remain 80.91px.

Focused tests: 18/18 passed. Next build/TypeScript passed. Targeted lint still
has the same baseline nine errors and one warning. This is not full journey,
normal-motion, physical-phone, or server-sync verification. Exact commands,
isolation details, and artifacts are in the
[empty Routine verification](SESSION_HANDOFF_2026-10-30.md#2026-10-30--step-5-empty-routine-fix-and-verification).

## Acceptance criteria

- Each conflict identifies the exact competing passages and any prior decision.
- Distinguish source inspection, observed runtime behavior, and untested inference.
- Present simple options, consequences, and a recommendation for developer review.
- Record no product decision without the developer's answer. Obtain approval
  for the specific documentation/code changes before editing.
- Keep unresolved points explicit; preserve personal records and existing work.

## Next action

Prepare a bounded proposal to resume Phase 1 verification: saved-state Habit
recovery and Reflect grounding. That implementation/verification scope needs
developer review and approval. Reflect Page design for Character and Six months
remains a separate future review.

## Existing evidence and open work

The [2026-10-30 baseline](SESSION_HANDOFF_2026-10-30.md#2026-10-30--step-3-implementation-baseline)
records both builds passing, focused tests 17/17, full suite 439 passed/9 failed,
and lint 9 errors/1 warning. NVM blocked npm; installed CLIs were used.
The unit/lint/build baseline was not rerun during this measurement pass.

Saved-state Habit recovery, Reflect grounding, and the [bug list](../../bugs.md)
remain open on their unverified paths. Keep the chosen Habit right-swipe-back
behavior. See the [journey record](../USER_JOURNEY_TESTING.md) for prior coverage.

## References

- [Workflow](../DEVELOPMENT_WORKFLOW.md): session checklists and verification.
- [Product](../PRODUCT.md) and [roadmap](../ROADMAP.md): direction and phase criteria.
- [Archived task](CURRENT_TASK_2026-10-30.md): earlier notes and evidence.
