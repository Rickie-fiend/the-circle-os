# Session handoff

## Log blocks on Home Imprint — 2026-11-22, Asia/Bangkok

**Approval and Git.** The developer approved the Log/Week proposal, including a
single pulse on a late first save and age measured from the block's recorded
end. Work is local and uncommitted on `main` at `b95e51b`. The earlier Habit,
Routine/Week and Protocol changes remain present, as do the pre-existing
attachment and Supabase CLI cache directories. No staging or deployment.

**Implemented.** The signed-in review uses the actual Log save and correction
paths. Newly saved blocks store their original time zone and exact end, while
their existing Circle day and first-recorded time remain intact. A block can
support Home after both the save and the end. A qualifying late write pulses
from the save while its age comes from the end. Week tasks and Log blocks share
one day's growth. The first eligible source anchors the day through later saves
or clearing. Tracked clears reuse dated receipts to prevent stale restoration.
Reload and background catch-up show settled color. A rejected local save gives
Home no color or pulse. Older or ambiguous records stay in Log History.

**Checks and limitations.** The local scope uses synthetic account records.
28 focused model tests, focused ESLint and `next build --webpack` passed.
The build required a retry outside the sandbox after an EPERM writing a
generated route folder. Chromium covered timing, late saves, offline
saves, clearing, failed saves and reload. Geometry checks at 360/390px and the
full Log cases passed. The 390px consistency matrix missed header animation
samples in Deep Thoughts Trash and Protocol draft in combined runs. It passed
in isolation against the freshly built CSS.
[Journey evidence](../../USER_JOURNEY_TESTING.md#log-blocks-on-home-imprint--2026-11-22)
records the test scope. Physical phones, hosted runtime and the full suite
remain unverified. There were no real-record, sync or migration changes.

**Review.** [Current Task](../../PERSONAL_IMPRINT_HOME.md#local-log-blocks--2026-11-22) describes the local visual steps.
The [Protocol handoff](../2026-11-22-protocol-imprint/SESSION_HANDOFF.md)
keeps the earlier seal checks and known limits. A later proposal can connect
finished Chapters after checking the saved-run evidence.
