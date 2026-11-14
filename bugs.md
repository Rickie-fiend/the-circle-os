# Circle OS bugs and verification gaps

## Offline entry after browser crash — 2026-11-14

**Locally fixed and verified:** approved durable proof/closed-state store now
passes the entire 360/390px crash journeys. Exact writing/drafts, offline edits,
clearing, empty composer, completed logout/crash and account-return checks pass.
Final recovery 18/18; controller/proof 12/12; build/TypeScript/lint pass. Historical
reproduction below is superseded for synthetic desktop Chromium only. New actual
phone/hosted acceptance, eviction and backup/restore remain open. Sync stays off.
See [final evidence](docs/USER_JOURNEY_TESTING.md#durable-offline-entry-and-crash-recovery--2026-11-14).

Reproduced in isolated production routes with synthetic Auth at 360/390px.
Save a Note, retain an unfinished Deep Thought, confirm local storage, crash the
test browser main process, then relaunch the same profile offline. Service-worker
navigation succeeds, but Welcome back appears instead of restored writing tools.
Expected: verified local account entry restores saved writing and its unfinished
answer. Final recovery selection 15/17; both crash cases fail, existing checks
pass. Approved investigation confirms exact saved entries/revisions and drafts
survive; the offline proof is present before crashing and absent after reopening.
Closed/password-flow markers remain absent. Launching offline from creation still
fails, with one blank startup tab; the startup-gap hypothesis does not explain
this run. Exact proof-loss mechanism remains unestablished. Later crash scenarios
are unreached. No product fix made; next review durable proof and safe logout
invalidation. Phone testing deferred; sync off. See
[evidence](docs/USER_JOURNEY_TESTING.md#forced-browser-crash-writing-recovery--2026-11-14).

## Unused template Effort showing “evening” — 2026-11-14

Developer report: Effort shows “evening” when intended to be unused. Exact original-draft cause remains untraced. Blank fixed Effort does not reproduce the display in model/browser checks; an existing Effort answer link can produce it and previously had no direct remove action. Approved local follow-up adds Remove effort to clear its whole setting/link, trims blank output, and verifies remove/save/reload, blank re-add and clearing typed wording. Final model/publication 10/10 and production-CSS template 5/5 pass. Developer review of the original draft remains necessary before declaring that specific report resolved. No authored draft was silently changed.

## Template review follow-up — 2026-11-13

Locally addressed: numeric answers inherited a mobile-wide 16px !important rule; new glass numeric role is 18px/400. Native time UI is replaced for glass questions by a Circle picker with unsaved 6:00 AM hint. Admin routes formerly collapsed network/timeouts into 403 and the client unmounted editors; typed 401/403/503 handling and recovery are now distinct. Historic individual network incidents were not traced, so no claim is made about the developer's connection. Menu checks formerly started on every open; eager account-scoped lookup is reused. Image previews previously signed the entire library per instance; stable-ID targeted reads are shared. Generated preview text and obsolete Habit/Week entry dependencies are retired with old data preserved. See dated journey evidence for checks; physical-device acceptance remains open. Earlier unrelated verification gaps below remain open.


Updated: 2026-11-11, Asia/Bangkok. This is the current triage index.
Detailed reproductions, attempts and old conclusions remain in the
[bug archive](docs/archive/2026-11-11-doc-cleanup/bugs.md) and
[journey record](docs/USER_JOURNEY_TESTING.md). No application checks ran during
documentation cleanup; statuses below carry their dated evidence forward.

A report, non-reproduction, local fix and device acceptance are different states.
Replacing a planned flow does not mark its current runtime defects fixed.

## Current gaps

Natural-expiry qualification — 2026-11-14: a real one-hour offline wait,
unchanged expired signed token, service-worker tab reopening and real renewal
pass at 390px with exact saved writing/drafts preserved. Both temporary accounts
were removed and absence confirmed. This closes the bounded natural-expiry gap
in earlier entries, not wider device/session certification. Phone acceptance is
deferred by the developer. See
[evidence](docs/USER_JOURNEY_TESTING.md#natural-session-expiry-and-writing-recovery--2026-11-14).

Hosted-session qualification — 2026-11-14: actual production-route early renewal,
revocation/rejected-refresh lock, offline return and exact writing restoration now
pass at 360/390px using two temporary hosted accounts (cleanup confirmed). This
qualifies the broader Auth/hosted-writing gaps below only for those cases.
Natural JWT expiry, phone acceptance and operating recovery remain open. See
[evidence](docs/USER_JOURNEY_TESTING.md#hosted-account-session-recovery--2026-11-14).

| Area | Status and next check |
| --- | --- |
| Auth menu typography fixture | Full 2026-11-14 Auth selection passes 15/17. Two unchanged tests expect Edit alias font weight 650, while the current design renders 700. HEAD contains the same old assertion. These remain separate from the passing 15-case authentication/recovery runner; no assertion was removed or product defect inferred. |
| Changed-image retry classification | Hosted acceptance confirmed replacement bytes are rejected and original bytes retained, but current Admin media route reports 503 rather than a client/conflict error. Kept as a classification gap; no unrelated route fix made. |
| Protocol source-test marker | Expanded 2026-11-14 selection passes 135/136. The unchanged Footer source assertion in tests/protocol-home.test.mjs searches for the absent exact comment `/** The block`, producing an empty slice. Reconstructed pre-task Protocol source also fails. This remains a stale fixture gap; adopted Protocol runtime checks pass. No runtime defect is inferred or test removed. |
| Phone writing/caret | Developer reports fixed on 2026-11-14. Device/browser and detailed steps were not supplied; this closes the reported symptom without claiming a new measured phone test. |
| Runtime notices | ResizeObserver notices remain in recent test records. Do not infer resolution from passing journeys. |
| Tool lived acceptance | Latest Protocol/shared-control work passes bounded local checks; developer lived review remains outstanding unless separately completed. |
| Hosted writing | Migrations and synthetic hosted/test-store checks passed. Actual store restart passes three local cases (37/37 combined checks). Real production-route service-worker offline startup, two restarts, Note/Deep Thoughts editing, logout and account separation also pass at 360/390 (15/15 Auth/recovery selection, 2026-11-14). Activation off; real-device restart/eviction, hosted session expiry/revocation, real lock contention and backup/deletion remain open. |
| Auth/device | Mail setup, session renewal/revocation, lost-device/manual lost-email recovery, regional/other-browser coverage remain incomplete. |
| Reflect regression | Older fixture-reference/first-swipe failures remain dated unresolved evidence, alongside earlier passing fixtures and later developer reports. Diagnose current code/fixture before a blanket closure or new release claim. |
| Chapter account chrome | Developer requested menu hiding during Chapters. Safe account/exit behavior needs review; saving the report did not approve a chrome change. |
| Beta | Broader safety, other-domain sync, deletion/recovery, installation/update and real-phone acceptance remain open under Roadmap. |

## Latest locally verified fixes

| Change | Evidence and scope |
| --- | --- |
| Outdated button source checks | Developer-approved removal of nine obsolete test blocks/comments, 2026-11-14. Remaining checks 14/14, syntax and focused lint pass. No tests added or runtime bug fixed; prior browser evidence remains historical. See [record](docs/USER_JOURNEY_TESTING.md#retire-outdated-button-source-checks---2026-11-14). |
| Week setup test date | Fixed synthetic declaration timestamps match the September fixture and preserve separate Character versions. Approved test-only correction, 2026-11-14: prior model selection now 24/24, related declaration checks 21/21 and focused lint pass. No runtime date bug or app change. See [evidence](docs/USER_JOURNEY_TESTING.md#week-setup-test-timestamps---2026-11-14). |
| Habit source test gap | Two obsolete setup/identity source assertions replaced by saved-answer/projection model coverage and visible restoration/motion browser coverage, 2026-11-14. Focused model selection 42/42; final affected production-CSS browser selection 3/3. The motion fixture now measures copy independently of Schedule. No product defect or broad-suite certification is inferred. See [cleanup evidence](docs/USER_JOURNEY_TESTING.md#routine-presentation-cleanup---2026-11-14). |
| Protocol checkbox-only action | Passive words, immediate ✓/press, synchronized Orange liquid text/face, no strike; reload, keyboard undo and reduced motion. Six production cases plus final recheck, 2026-11-11. Both previously open checked/press defects are resolved locally. |
| Checkbox edge seams | All 24 fractional-offset/device-scale endpoint comparisons match hidden/unclipped references, 2026-11-11. |
| Shared tool consistency | 24px anchors, typography and common engines; obsolete Week completion waits removed. 41 distinct compiled-CSS cases across runs/rechecks plus focused checks, 2026-11-11. |
| Week refinements | Current day-filtered shared tasks, corrected action columns/header, folded record/history and archive behavior have bounded local evidence, 2026-11-10/11. Earlier weight/gap/delay trials are superseded. |
| Routine motion/glass | Measured resize and production glass refinements verified locally, 2026-11-09. Separate notices and device acceptance remain open. |
| Account alias/direct entry | Scoped alias greeting/menu and direct entry after completed Day One locally verified, 2026-11-06. No claim that the original midweek trigger was reproduced as a date bug. |
| Protocol history | Read-only past terms and prospective wording locally verified. Work plan records later developer phone review; it does not certify real sync or unrelated defects. |
| Quest setup/history | Shared setup evidence, View/Hide steps, saved-answer readers and stale-pin handling locally verified, 2026-11-05. |

See [latest Protocol checks](docs/USER_JOURNEY_TESTING.md#protocol-checkbox-only-action-and-liquid-words---2026-11-11),
[seam checks](docs/USER_JOURNEY_TESTING.md#checkbox-edge-seam-and-protocol-audit---2026-11-11)
and [shared-tool checks](docs/USER_JOURNEY_TESTING.md#shared-tool-consistency-and-stale-code-cleanup---2026-11-11).
Other exact commands/limits remain in dated journey entries; counts overlap.

## Original numbered reports

Keep these IDs for existing references. These are scoped historical statuses,
not freshly reproduced results against every current mode.

| ID | Report | Status carried forward |
| --- | --- | --- |
| 1–3 | Initial Today flash, Begin flash and onboarding skip | Historical reports/non-reproductions; current paths need risk-based checks until replacement. New onboarding is planned, not a runtime fix. |
| 4 | ResizeObserver overlay | Still observed as notices in later work; unresolved. |
| 5 | Today/Reflect overlap | Historical presentation report; current navigation needs affected-device acceptance. No blanket fix claim. |
| 6 | Placeholder becomes Note text | Account Note fixed/browser-verified 2026-11-02. Legacy editor reproduced it then; no personal-writing migration or all-mode fix claim. |
| 7 | Admin password prompt clipping | Historical report; current affected-browser verification needed. |
| 8 | Thoughts turns back to Note | Legacy idle rotation was policy, not automatically a bug. Opened full-page writing now stays selected; actual focus/draft guards still require affected-path checks. |
| 9 | Habit returns to first Page while idle | Older concern/developer use report; recheck if reproduced. Current policy keeps Routine selected. |
| 10 | First Habit Continue needs two taps | Not reproduced on two specific 2026-10-30 paths; not proof about every Continue. |
| 11 | Habit swipe direction/forward failure | Forward failure not reproduced 2026-10-30; right-swipe-back retained by explicit decision. |
| 12 | Habit outcomes ignore answers | Fixed/verified 2026-10-30, including recovery, missing rows, later-edit protection and repeat reloads. Preserve regression coverage. |
| 13 | Inconsistent Habit/task controls/title | Earlier size fix and later shared-control/type work have bounded local evidence; old concern does not prove all current/device paths accepted. |
| 14 | Nonfunctional Protocol name-field arrow | Not closed by later term-scrollbar changes; original affected control needs confirmation. |
| 15 | Protocol term separation | Later presentation/prospective-wording work delivered for bounded scopes; old grouping report is not a new failure or blanket device closure. |
| 16 | Past phase easy to alter/unclear | Accidental past tick changes fixed locally; later removed correction UI keeps history read only. Historical receipts preserved; presentation/device limits remain. |
| 17 | Repeating Log setup | Fixed/verified 2026-10-30, outcome recording and reload checked. Keep regression coverage. |
| 18 | Time picker gaps/overflow | Historical report; current picker and replacement onboarding need reviewed small-screen/keyboard acceptance. |
| 19 | Continue often needs two taps | Broader report not certified by the two passing paths for bug 10. Reproduce affected current paths if reported again. |

## Archived mobile findings

The original [mobile report](docs/archive/2026-11-11-doc-cleanup/MOBILE_TEST_FINDINGS.md)
also recorded empty Habit cue placeholders and manually completable Week goals.
The current record/display contract omits empty fields. Manual goal completion
is the later approved behavior; linked unfinished tasks/history are preserved.
These directions do not manufacture a device test of the old reports.

Use [WORK_PLAN.md](docs/WORK_PLAN.md) for triage order and
[Roadmap](docs/ROADMAP.md#release-gates) for release requirements.
