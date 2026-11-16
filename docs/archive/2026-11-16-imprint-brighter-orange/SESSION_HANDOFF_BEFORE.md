# Session handoff

## Single 06:00 fade after full 24-hour wait — 2026-11-16, Asia/Bangkok

**Approval/Git.** Developer corrected continuous fading and explicitly chose a
full-day wait followed by 06:00, rather than the immediately next 06:00. This
refines the approved synthetic growth study. Rule: wait 24 elapsed hours after
application, fade once at the first local 06:00 at/after eligibility, then retain
that faded brightness. Spread remains; later applications can start a fresh cycle.
Branch paing-branch, HEAD 3d96cb1. Existing recovery/artwork changes retained.
No staging/commit/deployment. [Previous snapshot](../../archive/2026-11-16-imprint-single-fade/SESSION_HANDOFF_BEFORE.md).

**Implemented.** Growth model adds colorFadeAt/colorBrightnessAt with local clock
cutoff and invalid/future-time handling. Group latest application controls study
brightness; use-day growth and all anchors/accepted geometry remain unchanged.
The old exponential brightness decay is replaced. Monday 21:00 -> Wednesday
06:00; Tuesday 05:30 -> Wednesday 06:00; exactly 06:00 -> next day's 06:00;
06:01 -> the following day's 06:00 after the 24-hour wait. Existing .95/.18
levels and growth rate remain visual trial values, not confirmed product levels.

The gallery has 13 states/78 phone exports, adding next-day-06-faded-once and
two-days-later-unchanged and renaming the old quiet-month example to
after-one-month-without-use. It explains the cutoff and one-time change. Fictional
use days all apply at 06:00. No actual product clock/records are connected.

**Verified.** Renderer assertions confirm byte-identical faded exports for the
next-day, two-days-later and one-month-later views on all six forms; front-anchor
diagnostics remain unchanged/pass. Node v24.22.1 focused fade/growth/color selection
passes 6/6: exact cutoff/one millisecond before, 24-hour minimum, 06:01 deferral,
year rollover, invalid/future application times, later fresh cycle, duplicate-day
handling, monotonic growth and equal retained inactivity state. Scoped strict
TypeScript and focused lint pass. Browser review 360/390/416/1280px passes all
78 export hashes/states, reload, 44px controls and missing/incomplete states;
no page errors/overflow/storage writes. QA server closed; existing local3024
retained. Browser access needed approved outside-sandbox execution.

**Limits/invariants/next.** This remains a group-level latest-application preview,
not per-contribution evidence integration. Timestamp timezone/travel ownership and
real activity attribution need review before production; no phone clock/device
acceptance is claimed. Existing sampled-coordinate fine edge/stipple approximation
remains. Full suite/build/lint stay paused; old preview baseline lint issue remains.
Shared Page/tool geometry, accepted shape/Bone pixels, real records, Circle day,
sync and Home are untouched. Backup/deletion/device gaps persist; writing sync off.
[Home brief](../../PERSONAL_IMPRINT_HOME.md#single-fade-after-24-hours-and-local-0600--2026-11-16)
and decision log own the current rule and evidence. Developer next reviews the
bright/faded levels and front-area appearance at ?study=growth, then decides
activity semantics/rates and Home execution/integration. Work is uncommitted.
