# Archived current task — 2026-10-30

Snapshot of `docs/CURRENT_TASK.md` before the approved task cleanup.
This is historical context; follow the [current task](../CURRENT_TASK.md)
and [roadmap](../ROADMAP.md) for active work. Original wording and evidence
are preserved below. Relative Markdown links were adjusted for this folder.

---

# Current task

## Title

Stabilize and optimize the existing Circle OS web MVP

## Status

Active roadmap phase: [Phase 1 — stabilize existing behavior](../ROADMAP.md).
The developer confirmed a friends-and-family web MVP followed by iOS/Android,
Supabase, personalized Athena, and strong privacy. The immediate instruction
is to fix and optimize existing features before adding new ones, using
code -> test -> fix -> verify -> optimize -> test/verify again.

Product, roadmap, architecture, and workflow documents were aligned on
2026-10-30. No new backend, authentication, AI inference, or scoring feature
was implemented in that documentation update. Implementation baseline checks
and open journey verification are next. Previous results below remain useful
evidence for the paths they actually covered.

## Purpose

Operating rule: explain each proposed file change in simple terms and obtain
manual review and explicit approval before editing. Ask questions if the intent
or context is unclear. Verify all code changes and add meaningful tests when
necessary. This session approves recording those rules in documentation only;
the next implementation change still needs its reviewed proposal and approval.

Make the existing daily and weekly journey reliable and understandable before
feature expansion. Preserve local data and the established design while fixing
bugs and measuring justified optimizations. See [product](../PRODUCT.md),
[decisions](../DECISION_LOG.md), and [workflow](../DEVELOPMENT_WORKFLOW.md).

## Scope

- Use a separate test browser profile or another safe test context. Do not clear
  or overwrite the user's existing local app data.
- Complete first-use setup.
- Record at least one daily activity or moment.
- Reload the app and confirm the entry remains.
- Open Reflect and check that the displayed observations match the test data.
- Record exact steps, observed results, and any failures or uncertain behavior.
- Establish the current build/test/lint baseline and distinguish pre-existing
  failures from later regressions.
- Reproduce and resolve `bugs.md` one issue at a time, prioritizing data safety
  and blocked journeys. Preserve the chosen Habit right-swipe-back behavior.
- Verify recovery of an already-completed broken Habit run; the previous
  verification covered new completion and reload only.
- Measure a named problem before optimizing; repeat affected tests and browser
  verification after an optimization.

Relevant code to inspect if a step fails:

- `app/os/circle-os-shell.tsx`
- `app/os/circle-os-store.ts`
- `app/os/circle-os-model.js`
- `app/os/mirror/page.tsx` and its imported reflection components
- `tests/first-use-setup.test.mjs`
- `tests/circle-os-model.test.mjs`
- `tests/rendered-html.test.mjs`

Re-check paths and tests before starting; the repository may have changed.

## Out of scope

- Replacing the existing framework or redesigning the product.
- Database migrations, a new authentication provider, live AI, monetization,
  public social features, or native mobile apps.
- Deploying or changing production settings.
- Clearing real tester or owner data to create a clean test state.

## Acceptance criteria

- Setup completes on a phone-sized web viewport.
- A daily activity or moment can be recorded and is visible in the app.
- A full page reload preserves that entry.
- Reflect displays observations grounded in the recorded test data; any
  inference is distinguishable from directly recorded information.
- The test record separates verified outcomes from assumptions and lists
  unresolved issues.
- Existing local data is not deleted or overwritten.
- Chapter outcomes reach the same app records regardless of entry point.
- Optimizations have a measured purpose and repeat the affected tests and
  browser verification after changes.

## Next concrete action

Establish the implementation baseline on the existing branch, then close the
saved-state Habit recovery and Reflect-evidence checks. Continue the bug list
using the required development cycle. Resolve conflicting design rules before
using them as acceptance criteria.

Recreate synthetic activity in an isolated test context if the previous
temporary browser state was not retained. Browser isolation alone does not
isolate a shared backend; use a test endpoint or intercept remote sync.

Supabase/auth/AI implementation remains in later roadmap phases. Username and
password is a preference and email/recovery remains unresolved. The developer
confirmed that friends and family test the stabilized core first; new
personalized Athena comes afterward. Existing prepared readings and chapters
remain in the current audit.

## Historical journey progress

The entries below predate the new repository roadmap. Phase labels and missing
Obsidian requirements in older entries are historical; use the roadmap and
decision log above for current authority. No prior test was rerun merely by
updating this document.

- Detailed test steps and continuation notes are in
  `docs/USER_JOURNEY_TESTING.md`.

- The developer reports that admin protection behaved as intended during
  their test; exact steps and runtime configuration were not provided.
- The developer exercised onboarding and multiple app areas and reported the
  findings in `bugs.md`. These reports include onboarding navigation, tab
  transitions, Note and Thoughts behavior, Habit and Monk Mode behavior, and
  Log setup and time selection.
- Bug 17 was reproduced, then fixed and verified in the 2026-10-30 follow-up.
  The selector now offers the newest chapter version only, and published Log
  setup saves its wake/sleep answers as routine evidence. The other reports
  remain user observations pending reproduction.
- In an isolated Playwright Chromium context at 390×844, entered the synthetic
  profile `Journey Tester`, age 34, and completed the name-and-age setup. The
  resulting Today view greeted that profile.
- A full reload in the same isolated context retained the profile. No
  first-use name-and-age screen appeared during the sampled reload; the shell
  was briefly empty before the saved Today content appeared. The developer's
  reported onboarding flash was not reproduced in this run.
- The 2026-10-30 fix run recorded a synthetic moment and verified it remained
  visible after a full reload. The test used mobile emulation, not a physical
  phone.
- Still to verify: check Reflect against the saved synthetic moment. The prior
  empty-state text (“Still learning” / “Waiting to sync”) did not verify
  evidence grounding.
- In a follow-up fresh 390×844 Playwright context, completed all 11 Day One
  pages, then reproduced the Log setup returning to `Set your usual day` after
  wake `07:00` and sleep `22:30`. Reopening it up to three times still did not
  show the timeline or `Now`. A reload preserved the synthetic profile, but no
  activity was recorded at that point. That earlier findings-only run is
  superseded by the fix verification below; no Playwright `pageerror` occurred.
- The repository README still places Today and Vision in Phase 1. This task
  remains aligned with that roadmap; no roadmap change is proposed.

## Current update — 2026-10-30

Bug 17 is now fixed and verified. The publication selector offers only the
newest version of a chapter, and a completed published Log setup saves its
wake and sleep answers as routine evidence. In a fresh synthetic Playwright
context at 390×844, setup reached the Log timeline; a small moment recorded at
08:00 remained visible after reload. The focused chapter tests passed (26/26)
and `node node_modules/vinext/dist/cli.js build` completed successfully.

Still unresolved: compare Reflect's content with the newly recorded moment.
Bug 10's first-tap Continue failure did not reproduce on the first Habit
question or first Day One question in focused Playwright checks; bug 19's
broader claim remains unverified. Other user-reported bugs remain open or
unverified. For bug 11, Habit left swipes advanced consistently and a right
swipe returned to the prior page. That backward movement matches the Journey
rule in `app/os/APP_SESSION_STANDARD.md`; the developer chose to keep the
current behavior for now.
The test used headless mobile emulation, not a physical phone.
Details are in
`docs/USER_JOURNEY_TESTING.md` and `bugs.md`.

## Verification

Use Playwright's isolated Chromium context with a 390×844 mobile viewport, or a
separate browser profile on a phone-sized viewport. Follow the journey above
and record the browser/device and viewport used. Run focused existing tests for
any failure investigated, then build or lint in proportion to the change.
Playwright and Chromium were installed with the developer's approval on
2026-10-30.

## Bug 12 follow-up — 2026-10-30

Browser testing showed that the built-in `habit-building@1` chapter uses the
regular publication delivery path, not the first-use path covered by the first
fix. The regular published path now projects completed answers into the
existing Day One Habit. Hydration recovery also finds completed built-in
`habit-building` runs. An isolated Playwright Chromium journey at 390×1400
completed Day One and Habit with three distinct values; the existing Habit row
showed those values, and both the row and completed run retained them after
reload. No browser page errors occurred.

Verified: `node --test tests/habit-identity.test.mjs
tests/first-use-setup.test.mjs` (17 passed) and
`node node_modules/vinext/dist/cli.js build` (complete). Bug 12 is fixed and
verified for a newly completed run. A browser check that injects an already
completed broken run to exercise hydration recovery remains unverified. Next,
check Reflect against the saved synthetic moment, then continue with the next
selected bug.

For local startup, `npm run dev` is the documented command. Both `npm` and
`npm.cmd` resolve in this PowerShell session, but NVM blocks npm execution in
the sandbox with NVM4306. The installed direct Vinext command is
`node node_modules/vinext/dist/cli.js dev`.

## References and limits

The repository documents listed in `AGENTS.md` are the current authorities.
Unavailable external product notes are no longer required. Existing runtime
integrations still use external files; replacing documents does not migrate
those records or certify the old server's privacy.

The ignored local `.env.local` currently contains the admin code that was
shared in chat. Replace it with a fresh secret before enabling Admin on any
shared Preview deployment. Never copy the value into this task or a commit.
