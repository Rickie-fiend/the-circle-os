# Current task

## Log sync conflict choices — recorded 2026-11-25

**Verified locally and on disposable hosted Supabase.** Log History lets a reader keep the synced entry or use
the device's words when both copies are active and have the same day and
time range. Both copies stay in Saved copies on that device. The choice
survives offline reload and an interrupted reply. A newer revision requires
another review. Cleared entries stay cleared.

Two Chromium profiles passed against real Auth and PostgREST on separate
disposable local and hosted setups. The localhost route rejected missing and
mismatched hosted test URLs. The hosted project was deleted and checked absent.
The local 390px Log correction and six-tool browser checks also passed.
[Hosted evidence](USER_JOURNEY_TESTING.md#hosted-log-sync-rehearsal--2026-11-25) ·
[Local evidence](USER_JOURNEY_TESTING.md#log-sync-and-conflict-choices--2026-11-24).

**Next review.** Agree which physical phones and browser journeys to check.
Beta activation remains pending. [Release gates](ROADMAP.md#release-gates) ·
[Work plan](WORK_PLAN.md#ordered-work).
