# Circle OS work plan

Updated: 2026-11-03, Asia/Bangkok (Note contract refinement).
Status: documentation reconciliation and ordered planning approved. No application
implementation, database change, personal migration or deployment is authorized
by this file.

Start here to see what comes next. The [roadmap](ROADMAP.md) owns delivery order
and release gates; [Product](PRODUCT.md) owns behavior, and the
[decision log](DECISION_LOG.md) owns confirmed choices. Detailed plans retain
their rationale and acceptance checks. This queue links them rather than
creating a competing product specification.

## Start here

Latest approved slice (2026-11-03): Note now handles free writing and Deep
Thoughts opens directly as the other Today Page. Deep Thoughts shares Note's
History/Trash and bounded scrolling; Send retains the answer with Next question.
The label opens a managed quote, with add/remove controls in the existing Admin
and a separate public Supabase catalog. Existing record kinds and chapter IDs
are preserved. The developer applied the quote SQL/configuration; live public
read, denied public writes, server add/remove and cleanup passed. Final local
verification is recorded in [the journey evidence](USER_JOURNEY_TESTING.md#deep-thoughts-and-managed-quotes-2026-11-03).
This supersedes older separate Thoughts History/Versions descriptions, not the
personal-sync queue or its readiness gates.

The later approved 2026-11-03 Note controls supersede its earlier Versions/Undo/
save-feedback/ellipsis requirements: Note has direct HISTORY, silent borderless
writing and orange History row bins. Keep Trash for restoration. Internal save
revisions remain. The latest approved slice moves New Note to the editor Footer,
caps Note/History/Trash at 480px (60% of a short viewport, never below the shared
minimum), scrolls only Body and removes Moved to Trash text. Other writing
controls and the delivery sequence are unchanged. See the
[current Note contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1411-bounded-note-pages---2026-11-03).

The local writing engine, read-only compatibility/evidence adapter and account-bound provider are
implemented and verified for their approved synthetic scopes. See
[the delivered contracts](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#145-local-engine-a-delivered---2026-11-02)
and [provider contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#147-account-bound-provider-delivered---2026-11-02).
Account editors now use the shared local writing provider; older writing and
legacy editors retain their existing paths. See the
[UI contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#148-account-writing-ui-delivered---2026-11-02).

The developer approved C's exact UI scope, and it is connected and locally
verified. Next, walk through the working writing/history UI with synthetic
data before separately reviewing personal import and cloud sync. The week-long
writing/history walkthrough remains a lived acceptance journey; confirmed
Note autosave (approved 2026-11-03), Thought Send, title and Trash choices apply.
The Note refinement supersedes earlier explicit Note Save/draft controls.
Personal import and safe cloud
sync remain separately reviewed. Do not implement the old single-Note proposal
unchanged.

UI work belongs in this sequence. The developer chose **core flows and sign-in
polish first; broader visual changes later**. Early interaction review does not
authorize a brand redesign or unreviewed runtime changes.

## What already exists

| Area | Current evidence and limit |
| --- | --- |
| Account-separated browser storage | Implemented with focused storage/browser checks. This is not encryption or cloud evidence sync. |
| Supabase account entry | Implemented and locally tested. Hosted public settings were checked; sign-in/reset/logout/offline return have developer-reported success. Hosted refresh/revocation, other devices and final mail settings still need evidence. |
| Development onboarding mode | Implemented with isolated synthetic accounts; production rejects test mode. It does not verify hosted account records. |
| Day One V3 | Implemented and verified for its bounded scope. Saves source answers without creating commitments. Earlier versions/runs remain intact. |
| Habit answer projection, bug 12 | Fixed and verified, including old-run recovery and later-edit protection. Keep regression coverage. |
| Repeating Log setup, bug 17 | Fixed and verified. Keep regression coverage. |
| Prepared Athena content | Prepared-content display/local calculations exist. A live requested paid service is not implemented. |
| Local writing and records | Local engine, adapter, provider and account writing/history UI verified with synthetic data. General histories/corrections, lived acceptance, personal import and safe Supabase sync remain unfinished. |

Evidence: [journey record](USER_JOURNEY_TESTING.md), [bugs](../bugs.md), and
[capability audit](APP_CAPABILITY_AUDIT_2026-11-01.md). Separate test selections
overlap; do not add their counts together as unique coverage.

## Ordered work

Critical data loss, cross-account access or a blocked launch journey takes
priority whenever found. Reproduce it, agree the fix scope, and verify it before
dependent work. Lower-impact reports may be addressed in their owning slice or
explicitly deferred after severity review. Every broad refactor or cosmetic
change does not have to be finished before records work begins.

| Order | Work and status | Dependency | Evidence needed |
| --- | --- | --- | --- |
| 1 | **Records and UI contracts: partly delivered.** Writing choices, local engine, adapter and provider are confirmed/delivered for their scopes. Review remaining UI placement/routing and other tools' history/task scheduling. | Confirmed personal-record decisions and delivered local contracts. | Exact UI proposal and checks before activation; later week-long walkthrough. |
| 2 | **Critical checks and fixes: unresolved.** Reproduce the Note placeholder concern, accidental phase changes, broader Continue/onboarding reports, Routine idle reset and Reflect fixture/swipe failures. Verify hosted auth refresh/revocation and account switching. | Synthetic isolation and a recorded baseline. Triage begins alongside contract review; fixes precede affected implementation. | Reproduction or qualified non-reproduction; focused tests and affected mobile/runtime paths. Separate fixture faults from app faults. |
| 3 | **Local writing and early UI: account writing UI locally verified.** Multiple-entry Note/Thought/reading-answer editors, drafts, History, Versions and Trash are connected. Lived acceptance, older-writing migration, other-tool histories and sign-in/loading polish remain. | C's exact scope was explicitly approved; later slices need their own review. | Local write/reload/correct/restore, isolation, failure/conflict and geometry checks are recorded in the journey evidence; hosted/device/lived acceptance remains separate. |
| 4 | **Existing-tool history: planned.** Historical Habit/Protocol wording, dated completion corrections, Log all-recorded-day navigation, versioned weekly corrections, task/goal links, declaration/chapter-answer/reading review and shared day view. | Shared record/time contracts and reviewed record-specific behavior. | Same records in App/day history, no copied ownership or replayed outcomes, preserved terms/dates/seals/links and free/expired access. |
| 5 | **Safe account sync and recovery: planned.** Ownership schema/access policies, durable operations, exact receipts, retries, multi-tab/device conflicts, explicit clearing/deletion, protected admin access/logs, backup/restore and migration rehearsal. | Locally verified records/history and reviewed SQL, retention and conflict UI. | Real synthetic database allow/deny checks; offline/retry/clear/Trash/conflict/recovery; no late cross-account application. Personal import requires separate ownership/backup/rollback approval. |
| 6 | **Day One action setup: planned beta requirement.** New immutable version offering Try once, Make a habit or Keep for later, with at most one confirmed commitment. | Records/history and safe sync verified; reviewed task-date, confirmation and optional existing-user contracts. | Confirm/skip/interruption/offline/retry checks, no duplicates or replayed creation, all entry points, preserved old runs/access and no automatic AI request. |
| 7 | **Membership and admin: planned.** Manual 30/90/180/365-day grants, extension/revocation, expiry, audit history, usage reservations and spending controls. | Verified account/server ownership and reviewed allowance/reset/retention details. | Server-enforced expiry/access, concurrent requests, failed-request release and free core/received readings after expiry. |
| 8 | **Requested Athena and controls: planned.** Provider integration, relevant same-owner evidence, readings in Reflect, one optional question, separate requested replies, sourced observations and Wrong/Has changed/Forget. | Verified records/sync, entitlement/usage gates, reviewed control semantics and actual provider processing facts. | Grounded multilingual synthetic cases, source/version links, correction propagation, draft/Trash/deletion exclusion, isolation, safe failures and no model call on save. |
| 9 | **Beta readiness: not certified.** Finish critical bug gates, real-phone/browser/region checks, Home Screen installation/update/offline paths, deletion/backup/restore, recovery/support instructions and data-use wording. | Required histories, safe sync, Day One, membership and Athena verified. Define devices, duration and success criteria before claiming readiness. | Actual target-device and operating evidence, named accepted limits, no unresolved data-safety/core-path blocker. Local builds do not certify deployed behavior. |
| 10 | **Release and observation: not authorized.** Prepare invitations, feedback, monitoring and rollback; deploy only when requested. Observe first-day and later-week use. | Release evidence and explicit developer authorization. | Verification in the deployed tester environment, safe recovery and understandable tester outcomes. Use feedback to choose later work. |

Orders 1-2 prepare the next implementation; they are not permission to edit
application files. Each slice follows [the workflow](DEVELOPMENT_WORKFLOW.md):
code, focused test, fix, runtime verification, measured optimization when useful,
then repeat affected checks. Do not optimize without a named problem.

Day One is placed after safe sync and before beta. Its relative scheduling to
membership/Athena can be adjusted without removing either dependency or making
the broader chapter plan a beta gate. No deadline is promised: the old 4-6 week
estimate predates the expanded history scope and needs re-estimation.

## UI work in the queue

| Timing | UI review | Boundary and verification |
| --- | --- | --- |
| First, with record contracts | New Note, title/body, Note autosave/internal recovery, Thought Send/drafts, correction/version views, App history/shared day view, Trash/restore and meaningful source links. | The 2026-11-03 Note refinement supersedes its earlier Save/draft controls; other writing keeps Send. Saved on device, waiting for sync, cloud confirmation, failure and conflict must be distinguishable. |
| Early bounded slice | Sign-in, password setup/reset, alias entry, account menu and startup loading wording, including the recorded "Opening Circle OS…" / "Checking your sign-in." request. | Review actual mobile states. Preserve verified-email enforcement, offline entry limits, form state and account isolation. This request reopens planning, not implementation approval. |
| With each owning tool | Routine checkmarks/titles, Protocol separation/intentional corrections, Log time picker, history date controls, Day One confirmation and Reflect sources/memory controls. | Reproduce faults first; reuse shared Page, gesture, button, editing and App-back engines. Preserve the five Protocol durations. |
| Later, after the core | Broader Today/Reflect composition, optional Character/Six-month front Pages and general visual refinement. | Separate developer/design review. Existing Character authority/history remains required; new front Pages are not assumed to be a beta gate. |

Preserve Bone/Ink/Orange/Charcoal, Geist within Apps, Cormorant only for outer
editorial headings, comfortable mobile gutters and 44px targets. One shared
minimum and forehead anchor remain. Account Note views use their approved
bounded Body scrolling exception. Other real content grows downward; Habit/Protocol
rows do not become nested scrolling panels. Geometry/type/gap changes require
rendered Note, Thoughts, Habit and Protocol heights and forehead measurements,
including empty/short and real-content states. Check motion, keyboard, focus,
touch and reduced-motion behavior where affected.

Do not change Line behavior, idle rotation, chapter budgets, brand, ratios or
access gates as incidental polish. Note/Thoughts may idle-turn under the existing
focus/draft/background guards; Routine and other Apps stay on the chosen Page.

## Bug triage

This table carries the [original reports](../bugs.md), not new fix results.
Priority follows the reported consequence and is provisional until reproduction.
The owning bug/journey record changes only after new evidence exists.

| Bug | Recorded status | Next action and place in the queue |
| --- | --- | --- |
| 1. Today briefly bypasses first-use entry | Open/unverified in the reported flow. | Early entry-path reproduction; distinguish legacy, Supabase and development test modes. Fix before affected onboarding if reproduced. |
| 2. Glitch after Begin | Open/unverified. | Check the applicable first-use flow/timing/state; the old name/age screen does not apply to every account mode. |
| 3. Left swipe skips onboarding | Open/unverified. | Early required-cover/boundary reproduction across relevant modes; an actual setup bypass is a blocker. |
| 4. ResizeObserver development overlay | Not reproduced on limited recorded journeys; report remains open. | Reproduce inspection/resize and identify dev-only versus runtime impact before assigning a fix. |
| 5. Today/Reflect overlap | Open/unverified. | Measure route transition before changing shared motion; address with affected UI or earlier if it blocks use. |
| 6. Note inspiration becomes editable/saved writing | Unresolved; source concern identified in this review. | Early reproduction: `InlineCheckInEditor.commit` falls back to placeholder text for an empty title; `commitCheckInNote` saves that title. Check focus/blur, blank/body-only writing, Clear and reload. Placeholder text must never become evidence. |
| 7. Admin password prompt clipped | Open/unverified. | Check wrapping/mobile targets in the protected prompt. Keep reserved phrase/password outside evidence. |
| 8. Thoughts turns back to Note while idle | Limited rotation confirmed intended; full pause behavior needs runtime checks. | Verify dwell, touch/key restart, focus, partly written Thought and background guards. Do not disable approved rotation just to close the report. |
| 9. Habit returns to first Page while idle | Open/unverified; current rule forbids Routine auto-rotation. | Early reproduce on the actual Habit/Routine path; distinguish reset from scheduling/navigation. Preserve chosen Page/draft. |
| 10. First Habit Continue needs two taps | Not reproduced in the focused recorded check. | Retain status; reproduce exact path/device. Link to bug 19 without treating either as disproved. |
| 11. Habit swipe direction/advance | Forward failure not reproduced; backward travel intentionally retained. | Keep right-swipe-back; verify any reproducible forward fault in the shared engine. |
| 12. Habit result ignores answers | Fixed and verified, including saved-run recovery/later edits. | Regression coverage unless new evidence reopens it. |
| 13. Habit/task ticks and title inconsistent | Open/unverified. | Review with Routine UI, shared keys, contrast and first-row labeling; measure geometry if changed. |
| 14. Monk Mode arrow does nothing | Open/unverified. | Reproduce Protocol setup. Promote if it blocks creation; otherwise review the control's purpose first. |
| 15. Protocol items lack separation | Open/unverified. | Review with history/terms, reusing one continuous row rhythm and clear grouping. |
| 16. Finished phases unclear/easy to alter | Open/unverified; later intentional correction behavior matters. | Early data-integrity/interaction reproduction. Review deliberate dated corrections and historical terms/seals; preserve legitimate corrections without silently rewriting history. |
| 17. Log setup repeats | Fixed and verified. | Retain newest-version selection, completion and reload regression coverage. |
| 18. Log time-picker gaps/overflow | Open/unverified; replacement undecided. | Review before Log correction UI. Verify clock boundaries, mobile overflow, touch and keyboard use. |
| 19. Continue often needs two clicks | Broad report open; limited single-tap paths passed. | Early cross-flow reproduction with readiness/tap timing. A shared fix needs affected chapter/runtime checks. |

The source concern for bug 6 is not a browser reproduction or verified fix.
See [the editor/provider source](../app/os/circle-os-shell.tsx). No bug status
changes through this documentation pass.

## Conflicts reconciled

The developer approved resolving these before finalizing this queue and confirmed
the five Protocol durations on 2026-11-02. Owning documents are aligned;
historical decisions, dated audits and earlier handoffs remain evidence.

| Mismatch | Current rule or factual correction |
| --- | --- |
| Core-first/Athena-after versus paid Athena in beta | The later approved invited-beta route controls: accounts, safe sync, membership and requested Athena before release. Critical fixes remain gates; broad optimization is deferred. |
| Supabase project/login described as missing | Account entry/local isolation exist; hosted setup/reported journeys have dated evidence. Lifestyle sync/backup and remaining hosted/device verification are missing. Actual project region was not inspected here. |
| No Note Save step versus explicit Save | Current single-Note blur commits and future multi-entry draft/Save behavior are labeled separately. The target uses Save/Send; exact controls need implementation review. |
| Daily preparation versus paid requested interpretation | Daily preparation belongs to legacy prepared content. The planned paid service runs on explicit requests, never saving/background profiling. Preserve prepared content pending migration. |
| Per-App minimum versus one shared default | Use one shared minimum. Real content can grow the frame; empty reserved space does not justify another minimum. |
| Four Protocol choices versus five in source | Keep **1, 3, 7, 14 and 21 days**. Correct the standard; no runtime duration/layout change. |
| Dreamline behind Log versus disabled current code | Log has daily/Week Pages. Disabled Dreamline idle/sheet Pages are conditionally in Routine; keep it hidden and preserve data. Future placement stays deferred. |
| Sign-in UI deferred versus current request | Core flows and sign-in/loading polish are early planning priorities. Broader visual changes stay later; exact code/design review is required. |
| Older bundled chapter counts | Source has 27 main IDs/36 versions, 20 spark IDs/versions, and three Quests. Counts are not behavioral certification. |
| Admin phrase described as unlocking access | The phrase opens the existing password prompt. Only a valid server-checked password grants the protected session; neither input becomes personal evidence. |

The single-ongoing-Note proposal is explicitly superseded in product scope;
its sync safety mechanisms remain inputs. Day One V3's no-commitment behavior
remains valid for that version; new action setup needs another immutable version.
Neither is an unresolved choice to ask again.

Document reconciliation does not resolve runtime defects. Placeholder evidence,
Reflect failures, source corrections and sync limitations need actual work.

## Decisions still needed

Do not reopen confirmed product choices because implementation is unfinished.
Resolve these details before the slice that depends on them:

| Needed before | Remaining review |
| --- | --- |
| Local writing | New/Save/history/version/Trash placement, draft routing and status/failure/conflict wording. Provider freshness/read consumers have bounded verification; those checks do not verify the later editor/history journeys. Title/Save/Send/Trash choices are confirmed. |
| Time/history | Attributed day/timezone versus occurrence/recorded/corrected time; serialization/DST, deliberate backdating, unknown legacy dates/wording, scheduled tasks and historical Habit/Protocol snapshots. |
| Record-specific corrections | Weekly revisions; chapter-answer correction/outcome boundary; non-writing archive/delete rules; received-reading paging/retention beyond the current 60-edition browser bound. No blanket deletion or outcome replay. |
| Sync/recovery | SQL/grants/functions/indexes; operation/receipt/revision retention; conflict UI; cross-device drafts; stale-device suppression; migration ownership/rollback; admin auditing/log retention; deletion coverage/turnaround and restore suppression. |
| Day One | Copy/layout, optional completed-user entry, supplemental runs, source/version choice, scheduled-day and atomic confirmation/receipt recovery. Its five product choices are settled. |
| Membership/Athena | Allowance amounts/counting; reset hour/cycle math/renewal; retries/no-change accounting; spending/alert/pause levels; provider/model/processing facts; English response instructions and Burmese-input quality; control semantics/undo and source invalidation. English UI/responses at launch and Burmese/English UI/responses after launch are confirmed. |
| Beta readiness | Lost-email ownership proof; support/feedback/rollback; devices/browsers, regional connections, duration/success criteria, data-use wording and a new evidence-based estimate. |

Wrong, Has changed and Forget are confirmed controls; their scope, undo,
recurrence prevention and qualifications on old immutable readings need review.
Trashing a Deep Thought keeps its question answered while excluding its writing.
Permanent local deletion also keeps minimal question/app-use metadata, without
answer/version/draft text; older missing metadata remains unknown. Wider
derived/device/server/log/backup deletion still needs review and verification.
Corrections must not start a paid model call. Trash has no automatic expiry;
permanently deleted backup data has a separate maximum 30-day limit. No user data
download/export is offered in beta. Chapter authoring export is a different tool.

## Verification gaps to carry forward

- **Reflect:** later production regression runs retained a fixture-reference
  mismatch and first-swipe timeouts. One 360px swipe failure also occurred on a
  reconstructed pre-storage baseline. Cause is unresolved; earlier passing
  fixtures do not certify later runs.
- **Hosted accounts:** public settings/JWKS and developer reports do not certify
  final SMTP/templates, refresh/revocation, lost-device recovery or cross-device
  use. A retained offline proof cannot authorize remote writes.
- **Tests/tooling:** the dated capability audit ran 256 selected tests: 255 passed
  and one CRLF-sensitive source assertion failed. The older broad baseline had
  439 passes/9 failures; shell lint had nine errors/one warning. Standalone
  TypeScript had a `cloudflare:workers` failure, while the separate Vercel
  configuration passed later. These are different dated scopes, not fresh
  failing/passing certification. Dependency-audit gaps remain.
- **Devices/runtime:** physical phones, other browsers, production install/update
  behavior and real Myanmar/Thailand connections need checks. Use the chosen
  production target and risk-appropriate lint/build; prior build results do not
  verify later changes.
- **Data operations:** real Supabase evidence acknowledgements, two-device
  conflicts, migration recovery, backup restore, manual account deletion and
  backup expiry are unimplemented/unverified release work.

The earlier reconciliation-only pass ran no runtime checks. Subsequent provider
checks are in [the journey evidence](USER_JOURNEY_TESTING.md#account-bound-writing-provider-2026-11-02);
they do not certify UI, hosted/device, cloud or geometry work. Phase 1 and beta readiness remain
uncertified. Use synthetic isolated accounts; never clear or hand-edit personal
profile/day records to make tests pass.

## Later work

Keep these visible without making them beta requirements:

- Remaining chapter simplification: question-level overlap/dependency audit,
  optional depth, Profile Sparks, alternative daily prompts, visible answer reuse
  and put-away/reappearance behavior. Cadence/budgets need a developer decision.
  Day One action setup is the bounded beta exception.
- Compact/collapsible Log trial, including discoverability, focus, swipe and
  device-preference behavior; do not silently shrink the shared App Box.
- Broader visual changes, Character/Six-month front Pages and advanced search/
  filtering. Essential existing-record history is not deferred with them.
- Broad shell/domain refactoring, type consolidation and history payload/startup/
  rendering optimization. Launch-critical measured problems can be proposed
  earlier; file size or preference alone is insufficient.
- Live admin chapter publishing without compilation, after beta, with immutable
  versions, schema validation, preview/rollback and offline caching.
- Timers, streaks/points/leaderboards and richer AI/memory beyond requested
  follow-ups/basic sourced controls. Scoring, fairness, privacy, visibility and
  abuse rules remain undecided.
- Native iOS/Android, framework/distribution and purpose-led notifications after
  web beta learning. Dreamline/The Four remain hidden; Oscar, the 3D Room,
  courses and older Circle membership ideas are unconfirmed.

## Detailed plan index

| Record | Role and current use |
| --- | --- |
| [Personal records and Athena](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) | Active detailed plan. Start with Stage 1 contracts/interaction, then local writing, existing-tool history, sync, membership, Athena and readiness. |
| [Day One action setup](DAY_ONE_ACTION_PLAN.md) | Confirmed beta requirement after records/history and safe sync. Exact code/content version needs review. |
| [Web beta launch](WEB_BETA_LAUNCH_PLAN.md) | Launch contract, free/paid boundary, operations and release evidence. Accounts partly implemented; later stages planned. |
| [Earlier Note sync](NOTE_SYNC_PLAN.md) | Superseded single-Note scope; retain durable writes, receipts/retries, ownership, clearing and conflict mechanisms as design inputs. |
| [Chapter simplification](CHAPTER_SIMPLIFICATION_PLAN.md) | Mostly deferred proposals. V3 implemented; the newer Day One action plan controls the next bounded addition. No wholesale rewrite. |
| [Capability audit](APP_CAPABILITY_AUDIT_2026-11-01.md) | Dated source/test inventory for implementation discovery. Its open questions are superseded where November 2 decisions settled them. |
| [Roadmap](ROADMAP.md) | Authoritative delivery order/dependencies. Older numbered phases retain context where the active beta route supersedes their original order. |
| [Current task](CURRENT_TASK.md) and [handoff](SESSION_HANDOFF.md) | Current snapshot/next action; older entries retain evidence, not active authorization. |
| [Bugs](../bugs.md) and [journey evidence](USER_JOURNEY_TESTING.md) | Owning records for reproduction, verified fixes and actual coverage. The queue does not replace them. |

Keep [Product](PRODUCT.md), [Architecture](PRODUCTION_ARCHITECTURE.md),
[Design](../DESIGN.md), [the Page standard](../app/os/APP_SESSION_STANDARD.md)
and [brand tokens](../app/brand-system.ts) authoritative in their own areas.
Update the queue when a reviewed slice changes status; detailed evidence belongs
in its owning record. Stage/commit/publish only when the developer asks.
