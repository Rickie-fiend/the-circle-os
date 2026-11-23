# Current task

## Published Chapter progress and finish — 2026-11-23

**Verified locally.** The developer confirmed that legacy Chapters work on
the live app and reported that published Chapters restart and fail to finish
on the result-page swipe. The approved fix saves a live run when the reader
begins, restores its exact edition and answers, and returns to Explore after
the final swipe saves the finish.

The final 390px Chromium test began with an empty test account. It covered
answer retention and retry after a rejected device save, resuming version 1
from a version 2 Explore link, final swipe, and Home color after reload.
[Recorded checks](USER_JOURNEY_TESTING.md#published-chapter-first-start-and-finish--2026-11-23).

After an authorized deployment, use an invited test account on a physical
phone. Open a published Chapter in Explore, begin, answer and reload. Finish
with the left swipe from the result page, confirm Explore returns, then check
Home color and reload. Record the deployed build, device and browser.

[Work plan](WORK_PLAN.md#ordered-work) · [Home brief](PERSONAL_IMPRINT_HOME.md#signed-in-home-imprint--2026-11-23)
