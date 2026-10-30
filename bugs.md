# Onboarding bugs

Reported during the mobile-web user journey on 2026-10-29.

1. **Today tab skips first-use setup.** On the first onboarding page, before entering a name or age, tapping the Today tab glitches and show the main app screen for less than a second.
2. **Brief glitch after Begin.** After entering a name and age and tapping Begin, the app glitches for less than a second.
3. **Left swipe skips onboarding.** After the brief glitch, swiping left (when the page prompts for a right swipe) goes straight to the main menu and skips the rest of onboarding.
4. **Dev overlay error when opening element inspection.** When trying to change the viewport, clicking the browser's Inspect Elements control shows an unhandled script error: `ResizeObserver loop completed with undelivered notifications.` The overlay points to `http://localhost:3000/node_modules/vinext/dist/server/dev-error-overlay.js?v=c6e4f696:26:44` and reports `1 of 8`.
5. **Today and Reflect overlap during tab switch.** Switching between Today and Reflect is not smooth; for about a second, both tabs are visible.
6. **Note inspiration quote becomes editable note text.** The Notes tab shows a low-opacity inspiration quote, but clicking it to write a note fills the note with that quote instead of opening a blank note.
7. **Admin password prompt text is clipped.** In Thoughts, entering `admin` opens the password prompt, but `Enter the admin password` does not wrap and is clipped after `Enter the admin pas`.
8. **Thoughts switches back to Note while idle.** If Thoughts is left open without entering anything, it eventually switches back to the Note tab.
9. **Habit returns to its first page while idle.** If the Habit tab is left without input for a while, it slides back to the first page. This may become annoying for users and seems undesirable.
10. **[Not reproduced in 2026-10-30 Playwright check] First Habit Continue tap does not advance.** During the Habit forming questions, the first time Continue is pressed, it takes two taps to reach the next page. After that, the button works with one tap.
11. **[Forward-swipe issue not reproduced; back-swipe retained 2026-10-30] Habit swipe directions feel reversed and inconsistently enabled.** A right swipe returns to the previous page. Swiping left to continue only works if you first swiped right to go back to the previous page. The earlier reported preference was for right swipes not to take users back; the developer chose to keep the current behavior for now.
12. **[Fixed and verified 2026-10-30] Habit results appear to ignore Habit answers.** Although the Habit flow asks questions, its results are filled with answers from onboarding. As a result, answering the Habit questions appears to have no effect.
13. **Habit task controls and first-line title are inconsistent.** The first checkmark button under `Task` has a different color from the `Habits` checkmark and newly created task buttons. The `Habits` checkmark is much larger than the other buttons. The very first line has no visible title (or its title blends into the background); only the user's entered text appears.
14. **Monk Mode start shows a nonfunctional arrow button.** Beside the text box is a button with up and down arrows, but clicking it does nothing.
15. **Negotiables and non-negotiables lack visual separation.** When adding multiple items in either list, the UI does not visually separate the first item from the second.
16. **Completed Monk Mode phases are unclear and easy to alter.** Past phases show negotiables and non-negotiables without labels or separation. When there is more than one item, a single click can change its count between `1 of 1 days` and `0 of 1 days` in either direction.
17. **[Fixed and verified 2026-10-30] Log usual-day setup loops back to its first slide.** The flow goes from `Set your usual day` through wake time, sleep time, and `Your daily log is ready`, then returns to `Set your usual day` instead of opening the Log tab. It took three attempts to reach Log.
18. **Log time picker has gaps and overflows the tab.** The time choices have a gap between 12 and 1 o'clock and between 59 and 00 minutes. The long list of numbers and limits extends past the bottom of the Log tab, so users must scroll and cannot see all choices at once. A better time-selection UX/UI is still to be decided.
19. **Continue often needs two clicks across the app.** The need to click `Continue` twice to advance persists in every place where the button is used, not only during Habit questions.

## Status

These are user-reported observations. Bug 17 was reproduced in the isolated
Playwright run recorded below and fixed in the 2026-10-30 follow-up. Bug 10 was
not reproduced in the focused 2026-10-30 check below. Bug 11's forward-left
failure was not reproduced, while its right-swipe-back behavior did occur and
matches the current Journey rule; the developer chose to retain that behavior
for now. Bug 12's Habit projection passes focused tests, build, isolated browser
completion, and reload persistence. The approved Phase 1 follow-up also verified
startup recovery of already-completed broken runs and preservation of later
manual edits at both mobile widths; see the dated evidence below. The other
reports retain their recorded statuses.
The password itself is intentionally not recorded here.

## Playwright journey check — 2026-10-30

### Test context

- Playwright Chromium 156.0.8078.4, headless, mobile emulation at 390×844.
- Fresh isolated browser context; synthetic profile `Journey Tester`, age 34.
- Existing browser profile and local app data were not accessed or changed.

### Completed and verified

- Name-and-age setup completed and Today greeted the synthetic profile.
- The 11-page Day One chapter completed. Each Continue action advanced on its
  first click; the two information pages advanced with a left swipe. No browser
  `pageerror` events were recorded.
- Reflect opened at `/os/mirror` and rendered Vision and Athena's Reading. With
  no daily activity recorded, Athena showed “Still learning” and “Waiting to
  sync.” This confirms the route loaded, but does not verify an observation
  against test activity.
- The previously reported onboarding flash was not reproduced in the earlier
  reload check. That reload briefly showed the app shell before the saved Today
  content, without showing the name-and-age setup screen.

### Reproduced — bug 17

1. From Today, opened `Set your usual day`.
2. Accepted the wake time (`07:00`), advanced to sleep, and set sleep to
   `22:30`.
3. Tapped Continue once on the sleep page.
4. The Log setup cover, `Set your usual day. Swipe to begin`, appeared again
   within 100–1,400 ms. The Log timeline and its `Now` action did not become
   available. A right swipe on the returned cover did not dismiss it in this
   run.

This reproduces the reported return to the start of Log setup and blocks this
journey from recording a daily activity. The journey therefore stopped before
entry persistence could be checked. No daily activity was saved in the test
context.

### Not reproduced or still unresolved

- The `ResizeObserver` error overlay and the two-tap Continue report were not
  reproduced during this journey. That only covers the Day One Continue pages,
  not every app flow.
- The daily activity, reload persistence for that activity, and Reflect's
  evidence match remain unverified because the Log timeline could not be
  reached.
- On server restart, Vinext printed a dependency-scan failure with parse errors
  on TypeScript declaration files and skipped dependency pre-bundling. The app
  still served `/os` successfully with HTTP 200, and Playwright recorded no
  page errors during the journey.

## Playwright follow-up — 2026-10-30

- Fresh isolated headless Chromium context, mobile emulation at 390×844;
  synthetic profile `Journey Tester`, age 34.
- Completed name-and-age setup and all 11 Day One pages. Text answers used one
  Continue tap each; both information pages advanced by left swipe. No
  Playwright `pageerror` occurred.
- Log setup showed wake and sleep as its two steps. It accepted `07:00` and
  `22:30`; after Continue on sleep, the card returned to
  `Set your usual day. Swipe to begin`. Reopening the setup up to three times
  did not reveal the Log timeline or `Now`.
- Reload preserved the synthetic profile and did not show the first-use form.
  Reflect rendered `Still learning` / `Waiting to sync` with no activity.
- No daily activity was recorded. Its visibility after reload and Reflect's
  grounding against it remain unverified. Bug 17 remains open; no fix was
  attempted.

## Bug 17 fix verification — 2026-10-30

- Fixed the publication selector so an App offers only the newest published
  version of a chapter. Older versions of `log-setup` had been offered in turn,
  making a completed setup appear to start over.
- When a published Log setup completes, save its wake and sleep answers as
  routine evidence as well as completing the chapter run.
- Verified in fresh isolated headless Chromium at 390×844 with synthetic
  profile `Journey Tester Log Fix 1030`: completed all 11 Day One pages, set
  wake `07:00` and sleep `22:30`, reached `Your daily log is ready`, and swiped
  into the Log timeline. The timeline showed `Now`, `Wake up` at 07:00, and
  `Sleep` at 22:00. Saved state contained completed `log-setup@3` and both
  routine answers.
- Added a synthetic small moment at 08:00 and reloaded. The moment remained
  visible in the same isolated browser context. No Playwright `pageerror`
  events occurred.
- Focused chapter tests passed (26/26); `node node_modules/vinext/dist/cli.js
  build` completed successfully.
- Bug 17 is fixed and verified. The other user reports remain open or
  unverified. Reflect's observation against the new activity was not checked.

## Continue check — 2026-10-30

- Bug 10 was not reproduced in an isolated headless Chromium context at
  390×844. After completing Day One, opened the first Habit chapter and swiped
  through its three information pages. On the first question (`4/6`, “What
  small habit will you do?”), filled the answer and tapped Continue once. The
  chapter advanced to `5/6`, “When and where will you do it?” within 450 ms.
- Checked a separate fresh context on Day One page `1/11`. After entering a
  synthetic answer, one Continue tap advanced to `2/11` within 450 ms.
- Neither check recorded a Playwright `pageerror`. These are two specific
  paths only; they do not verify every Continue action or disprove the
  developer's earlier report across other flows. No fix was made because the
  issue did not reproduce.

## Habit swipe check — 2026-10-30

- In a fresh isolated headless Chromium context at 390×844, completed Day One
  with a synthetic profile, opened the first Habit chapter, and advanced to
  its first information page (`1/6`).
- Swiping left advanced to `2/6`. Swiping right returned to `1/6`. Swiping left
  again advanced to `2/6`, and another left swipe advanced to `3/6`. No
  Playwright `pageerror` occurred.
- The reported condition “left swipe only works after first swiping right” did
  not reproduce. The right swipe did return to an earlier page, as the report
  says.
- `app/os/APP_SESSION_STANDARD.md` says an open Journey can move backward so a
  person can edit an answer before confirmation. The behavior is implemented
  by the shared `SwipeSession` used by all chapter journeys. Disabling it for
  Habit would change that established rule for Habit; disabling it in the
  shared engine would change all journeys. The developer chose to keep the
  current behavior for now. No code was changed.

## Phase 1 verification follow-up — 2026-10-30

[Detailed evidence](docs/USER_JOURNEY_TESTING.md#phase-1--saved-habit-recovery-and-reflect-grounding--2026-10-30):
the final isolated browser run passed 12/12 at 390x844 and 360x844. Bug 12's
remaining saved-state check now covers old/missing Habit rows, later edits,
and repeated reloads. No application fix was needed.

Reflect activity persistence and empty/derived/authored reading display
passed with synthetic prepared-content fixtures. This does not verify real
Athena preparation or external sync. Other bug statuses remain unchanged.
