# Circle OS user-journey test record

Updated: 2026-10-30

## Goal

Verify that a new tester can complete first-use setup, record a daily activity
or moment, reload without losing it, and see Reflect observations grounded in
that test data. This remains the active task in `docs/CURRENT_TASK.md`.

## Test setup

- Browser automation: Playwright 1.64.1 with Chromium 156.0.8078.4.
- Device mode: isolated headless Chromium context with mobile emulation,
  viewport 390×844, touch enabled. No physical phone was used.
- Test identity: synthetic name `Journey Tester`, age 34.
- Data safety: each run used a fresh Playwright context. No existing browser
  profile or owner data was read, cleared, or changed. The test context was
  closed after the run, so its synthetic state is not available to continue.
- Local server: `node node_modules/vinext/dist/cli.js dev`, at
  `http://localhost:3000`.

## Completed and verified

- The initial name-and-age form accepted the synthetic test values and opened
  Today.
- The 11-page Day One chapter was completed. Text pages advanced with one
  Continue tap each; the two info pages advanced with a left swipe; the choice
  page advanced after choosing `Mind — how you think`.
- In a prior isolated run, the profile remained after a full reload. The saved
  Today content appeared after a brief empty shell; the name-and-age screen did
  not flash. The developer's reported onboarding flash was not reproduced.
- Reflect opened at `/os/mirror` and displayed Vision and Athena's Reading. It
  showed `Still learning` and `Waiting to sync` without a daily test entry.
  This verifies that the route rendered, not that an observation matched
  recorded activity.
- The Day One Continue pages advanced on their first click. This does not rule
  out the reported two-click issue in other flows.
- No Playwright `pageerror` events or ResizeObserver overlay were observed in
  the automated journey.

## Reproduced blocker: bug 17

Steps in the full journey run:

1. Open Today in the fresh context and complete name-and-age setup.
2. Complete the Day One chapter.
3. Scroll to `Set your usual day` and open Log setup.
4. Accept wake time `07:00`, advance to sleep, and set sleep time to `22:30`.
5. Tap Continue once on the sleep page.

Observed result: the Log setup cover, `Set your usual day. Swipe to begin`,
returned within 100–1,400 ms. The Log timeline and its `Now` action did not
become available. A right swipe on the returned cover did not dismiss it in
this run. This reproduces bug 17 as described in `bugs.md` and blocked recording
a daily activity.

The run did not show the `Your daily log is ready` page reported by the
developer; it returned to the setup cover after the sleep step. Keep that
difference in the reproduction notes rather than assuming the same intermediate
page was seen.

## Not completed

- No daily activity or moment was recorded because the Log timeline could not
  be reached.
- Persistence of a daily entry after reload is unverified. The earlier reload
  check verified only the synthetic profile.
- Reflect could not be checked against test activity. Its displayed reading
  without activity is not evidence that it reflects the test data.
- The user-reported bugs other than bug 17 remain unverified unless their
  status is explicitly updated in `bugs.md`.

## Follow-up journey run — 2026-10-30

### Completed and verified

- Repeated first-use setup in a fresh headless Playwright Chromium context at
  390×844 with mobile emulation and touch enabled. Used only the synthetic
  profile `Journey Tester`, age 34. The name-and-age form opened Today.
- Completed all 11 Day One pages with synthetic answers. Text answers advanced
  with one Continue tap each, the choice page advanced after choosing
  `Mind — how you think`, and the two information pages advanced by swiping
  left. The final protected completion swipe closed the chapter.
- Opened the Log setup card. The run showed two steps: wake time and sleep
  time. It accepted `07:00` and `22:30`.
- After Continue on the sleep step, the Log card returned to
  `Set your usual day. Swipe to begin`. The timeline and `Now` action were not
  available. Reopening the setup up to three times did not expose the timeline.
  This reproduces bug 17 again; this run did not show the `Your daily log is
  ready` page described in the user report.
- Reloaded the same isolated context after the Log attempts. Today still
  greeted `Journey Tester`; the first-use screen did not reappear. The app used
  the `circle-os-state-v2` local-storage key.
- Opened Reflect at `/os/mirror`. Vision and Athena's Reading rendered, showing
  `Still learning` and `Waiting to sync` without a daily entry.
- No Playwright `pageerror` was recorded. The app server on port 3000 returned
  HTTP 200.

### Still not verified

- No daily activity or moment could be recorded because Log never exposed its
  timeline. Entry visibility and persistence after reload remain unverified.
- Reflect could not be compared with recorded activity, so grounded
  observations remain unverified. Its empty-state text is not evidence of a
  successful reflection check.
- The run used headless mobile emulation, not a physical phone or the
  developer's browser. Other reported bugs remain unverified except bug 17.
- No application code was changed and no bug was fixed. Per the developer's
  preference, this pass recorded findings only.

## Environment note

On server restart, Vinext reported a dependency-scan failure with parse errors
on TypeScript declaration files and skipped pre-bundling. The app still served
`/os` with HTTP 200, and the browser journey continued. No app code was changed
to address this warning.

## Bug 17 fix verification — 2026-10-30

### Change

- The ordinary-publication selector now collapses each chapter to its newest
  published version before choosing what to deliver. This prevents old
  `log-setup` versions from being offered one after another.
- A completed published Log setup now writes its wake and sleep answers to the
  profile's routine evidence.

### Verified journey

- Used fresh isolated headless Playwright Chromium at 390×844 with mobile
  emulation and touch enabled. Synthetic profile: `Journey Tester Log Fix
  1030`, age 34. No existing browser profile was opened or cleared.
- Completed name-and-age setup and all 11 Day One pages with synthetic answers.
- Completed the newest published Log setup (`log-setup@3`) with wake `07:00`
  and sleep `22:30`. After `Your daily log is ready`, a left swipe opened the
  Log timeline instead of returning to its setup cover.
- The timeline showed `Now`, `Wake up` at 07:00, and `Sleep` at 22:00. Saved
  `circle-os-state-v2` contained the completed setup run and routine answers
  `07:00` and `22:30`.
- Added the synthetic moment `Log setup smoke test` at 08:00, then reloaded
  within the same isolated context. The moment remained visible. No Playwright
  `pageerror` events occurred.
- Focused chapter tests: 26 passed, 0 failed. Build:
  `node node_modules/vinext/dist/cli.js build` completed successfully.

### Remaining journey work

- Reflect was not compared against this newly recorded moment, so evidence
  grounding remains unverified.
- Other user-reported bugs remain unverified or open. The run used headless
  mobile emulation, not a physical phone.

## Continue bug check — 2026-10-30

### Completed and verified

- Used the existing app at `http://localhost:3000/os/mirror` and isolated
  headless Playwright Chromium contexts at 390×844 with mobile emulation and
  touch enabled. Both profiles used synthetic names and age 34; no existing
  browser profile was opened or cleared.
- On the first Habit question (`4/6`, “What small habit will you do?”), filled
  a synthetic answer and tapped Continue once. Within 450 ms the page advanced
  to `5/6`, “When and where will you do it?” The reported first-tap failure
  did not reproduce on this path.
- In a separate context, filled the first Day One answer on `1/11` and tapped
  Continue once. Within 450 ms it advanced to `2/11`.
- Neither browser context recorded a Playwright `pageerror`.

### Limits and next step

- These checks cover the first Habit question and the first Day One question
  only. They do not verify all Continue controls or disprove the broader report
  in bug 19. No code was changed because the failure did not reproduce.
- Bug 10 remains a user-reported issue, marked “not reproduced in this check,”
  not fixed. To continue, collect the exact page and timing from the original
  report or test the next specific Continue path in an isolated context.

## Habit swipe check — 2026-10-30

### Completed and verified

- Used a fresh isolated headless Playwright Chromium context at 390×844 with
  mobile emulation and touch enabled. Completed Day One using a synthetic
  profile, then opened the first Habit chapter.
- On Habit page `1/6`, one left swipe advanced to `2/6`. One right swipe
  returned to `1/6`. A left swipe then advanced to `2/6`, and a second left
  swipe advanced to `3/6`. No Playwright `pageerror` occurred.
- The report that left swipe only advances after first swiping right did not
  reproduce. Right-swipe-back itself did reproduce.

### Product rule conflict and next action

- `app/os/APP_SESSION_STANDARD.md` says a person may move backward in an open
  Journey to edit an answer before confirmation. Habit uses the shared
  `SwipeSession` engine; disabling backward swipes there would affect every
  chapter Journey. The developer chose to keep the current behavior for now.
  No code was changed.

## Next session: resume here

1. Read `AGENTS.md`, `docs/CURRENT_TASK.md`, this file, the latest
   `docs/SESSION_HANDOFF.md` entry, and `bugs.md`. Do not read or print
   `.env.local`.
2. Start the local server with `node node_modules/vinext/dist/cli.js dev` if it
   is not already running.
3. Bug 17 is fixed and verified: `log-setup@3` completed into the Log timeline,
   and the synthetic 08:00 moment survived reload. Do not repeat that setup
   unless checking another change.
4. Bug 10 did not reproduce on the first Habit question or first Day One
   question after one Continue tap. Keep it open as a user report; bug 19's
   broader claim remains unverified.
5. Bug 11's left-swipe failure did not reproduce; right-swipe-back worked as
   designed by the current Journey standard. The developer chose to keep this
   behavior for now; no gesture code change is planned.
6. Continue the journey by opening Reflect in the same isolated context and
   comparing its observations with `Log setup smoke test`. Record whether it
   states direct evidence or inference, then update `bugs.md` and this record.
7. Keep the other user-reported findings separate; reproduce them before
   changing their statuses.
8. Update `docs/CURRENT_TASK.md` and append a dated entry to
   `docs/SESSION_HANDOFF.md` after further work.

Playwright is installed as a development dependency, and Chromium is installed
in the machine's Playwright browser cache. No reusable journey test file or npm
script has been added yet.

## Bug 12 — Habit answers not reflected in the result — 2026-10-30

### Reproduced before the fix

- In a fresh isolated headless Playwright Chromium context at 390×844, completed
  Day One with the synthetic answer `ONBOARDING ANSWER`, then completed the
  first-use Habit setup using three distinct answers.
- The completed `habit-building@1` run retained all three Habit answers, but
  `habits.definitions` still contained only the Day One Habit with
  `ONBOARDING ANSWER`. The Habit answers had no effect on the saved Habit.
- No Playwright `pageerror` occurred during the reproduction.

### Fix and verification

- The first fix covered the first-use publication path, but browser testing
  still reproduced the bug. The built-in `habit-building@1` chapter is delivered
  through the regular publication branch, which still had no Habit projection
  callback. The saved run therefore contained the three answers while the Day
  One Habit still showed its onboarding answers.
- Added `applyHabitBuildingCompletion` to the regular published
  `habit-building` completion path as well as the first-use and compiled paths.
  The hydration repair also recognizes completed `habit-building`
  publications that are not marked first-use. It updates the existing starter
  Habit, keyed by run ID, and avoids overwriting a later manual edit.
- Playwright Chromium, isolated context, mobile emulation at 390x1400: completed
  Day One and `habit-building@1` using distinct action, cue, and identity
  answers. After the final forward swipe, the run was `completed`; the existing
  Habit row showed all three answers and matching rendered text. After reload,
  the run and Habit values were still present. No page errors occurred.
- `node --test tests/habit-identity.test.mjs tests/first-use-setup.test.mjs`:
  17 passed, 0 failed.
- `node node_modules/vinext/dist/cli.js build` completed successfully.
- `node node_modules/vinext/dist/cli.js build`: completed successfully.

### Remaining check

- The browser test covered a newly completed run and reload persistence. It did
  not inject an already-completed broken run to exercise the hydration repair
  branch directly. The regression tests cover projection and repair wiring;
  stored-state recovery remains a useful follow-up check.

## Phase 1 — saved Habit recovery and Reflect grounding — 2026-10-30

The developer approved browser regression coverage, focused checks, and
updates to the journey, bugs, task, and handoff records. No application fix
was authorized or made. Branch `paing-branch`, HEAD `7ffd3b2`.

### Setup and commands

- Added [tests/core-recovery.browser.mjs](../tests/core-recovery.browser.mjs).
  Start the isolated server with PowerShell:
  `$env:TZ = 'Asia/Bangkok'; node node_modules/next/dist/bin/next dev --port 3218`.
  The browser uses the same timezone and current clock. The test computes
  the Circle date using the 06:00 boundary; it does not test the boundary itself.
- Fresh Chromium context per case, mobile/touch emulation at 390x844 and
  360x844, default motion. Only requests to `http://localhost:3218` are
  allowed. No owner browser, profile server, personal records, or AI service
  was used. Synthetic completed setup runs bypass unrelated onboarding.
- `node --test --test-reporter=tap tests/core-recovery.browser.mjs`:
  **12 passed, 0 failed** on final code (about 696 seconds).
- `node --test tests/habit-identity.test.mjs tests/first-use-setup.test.mjs tests/athena-memory.test.mjs tests/athena-alignment.test.mjs tests/athena-pricing.test.mjs`:
  **64 passed, 0 failed**.
- `node node_modules/eslint/bin/eslint.js tests/core-recovery.browser.mjs`:
  passed. Documentation audit passed (14 links, four heading fragments);
  whitespace and `git diff --check` passed with existing LF/CRLF warnings.
  This session ran no full build or broad test/lint suite.

### Observed behavior

At both widths, loading a completed `habit-building@1` run repaired the old
starter's action, cue, and identity. With no starter it created one Habit.
Two further reloads kept one row, the same answers, and the run marker.
A later manual edit remained intact across the same reloads. This directly
covers the startup recovery path left unverified in the earlier Bug 12 entry.

For each Reflect mode, the test saved `Walk in the park` at 08:00 through
Log's actual controls and verified it after reload. Applying `priceDays`
to that saved browser day returned one recorded hour and one walking hour.
This is an arithmetic assertion on saved evidence, not proof that Reflect
recalculates prepared prose when a Log entry changes.

An empty reading stayed in `Athena is still learning.` A synthetic derived
observation displayed the recorded walk, with a separately labelled working
guess; it minted no edition. Synthetic authored prose displayed its cover
and reading text and retained exactly one unchanged edition. Fixture source
references were linked to the UI-created Log record. Navigation preserved
the activity and edition archive. Final cases had no browser page errors.

### Attempts and remaining limits

Initial fixed browser time disagreed with server-rendered time and caused a
hydration mismatch. Both now use Bangkok and the actual clock. Early attempts
were stopped during diagnosis; a startup wait also timed out. Corrected the
Habit selector to a text field, compared manual edits with normalized state,
and waited for saved page indices and transition completion between reading
swipes. The corrected full run passed; no runtime fix was needed.
Next dev also warned about smooth scrolling during route transitions; no
application change was made for that warning.

Prepared memory was deliberately installed as a synthetic fixture, not
produced by Athena from the activity. Generation quality, scheduler freshness,
real source selection, server acknowledgements/merges, offline retry, other
browsers, physical phones, and geometry remain outside this verification.
Existing TypeScript/build and broader-suite limitations were not rerun.
No bug beyond this bounded coverage is newly declared fixed.
