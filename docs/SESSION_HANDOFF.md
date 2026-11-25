# Session handoff

## Chapter and Log sync pilots — 2026-11-25, Asia/Bangkok

**Approval and Git.** The developer approved the bounded pilots, the
disposable hosted Chapter rehearsal, local conflict reviews and the Chapter
account-deletion rehearsal. The working tree is on `main` at `3115ad0`.
The pilot code, migrations and tests are uncommitted. The developer approved
this documentation update separately. The existing `.codex-attachments/`
and `supabase/.temp/` directories remain untracked.

**Completed and verified.** Published Chapters keep the exact edition, answers
and page position across test devices. A finish stays closed and carries its
original Home color. Basic sync passed on disposable local and hosted Supabase
through production Next.js routes. The hosted trial exercised simultaneous
writes, one finish after retry and cross-account denial. The Free project was
removed and checked absent. Later local browser checks verified the Chapter
conflict choices and saved copies. The local Auth deletion rehearsal verified
server cleanup, denied stale uploads, and kept the old copies out of a new
account using the same email.
[Chapter evidence](USER_JOURNEY_TESTING.md#chapter-sync-and-conflict-choices--2026-11-23) ·
[Deletion evidence](USER_JOURNEY_TESTING.md#chapter-sync-account-deletion--2026-11-23).

Log sync and its conflict choices passed with two 390px Chromium profiles
and disposable local Supabase. The checks covered offline reload, exact
retry, same-hour conflicts, original timing, a newer clear during review
and mismatched ranges. The production build, focused lint and 14 focused
tests passed. The compiled-CSS Log correction and six-tool matrix passed on
an isolated rerun. Focused floors measured 648px, anchors 24px, and the new
choice controls measured at least 44px. Existing ResizeObserver notices
remained. The disposable stacks and builds were removed.
[Log evidence](USER_JOURNEY_TESTING.md#log-sync-and-conflict-choices--2026-11-24).

**Hosted Log rehearsal.** The developer approved a disposable Free project in
CircleOS. The localhost production route returned 404 when the exact project
URL was missing or mismatched. Two 390px Chromium profiles passed the existing
Log journey with hosted Auth and PostgREST, including both choices, offline
reload, dropped replies, timing, clears, and second-account isolation. Final
inventory was three records including one clear, seven receipts, and zero
records for the second account. The production webpack build, focused lint and
14 focused tests passed. The project and isolated build were removed. The
Supabase project list confirmed removal. No commit or deployment.
[Hosted Log evidence](USER_JOURNEY_TESTING.md#hosted-log-sync-rehearsal--2026-11-25).

**Open checks.** Hosted Chapter evidence covers basic sync. The later Chapter
review and deletion have local evidence. The developer
reported checking published Chapters and reported Protocol working. Exact
device and build details were not supplied. The physical-phone and beta
checks remain pending. Automatic writing sync remains off. Hosted backup
and restore work remains deferred until the Supabase upgrade.
[Release gates](ROADMAP.md#release-gates) ·
[Backup runbook](BACKUP_RESTORE_RUNBOOK.md#deferred-until-the-supabase-upgrade).

**Next review.** Agree which physical phones and browser journeys to check.
[Current task](CURRENT_TASK.md) · [Approved decisions](DECISION_LOG.md#2026-11-2324--chapter-and-log-sync-pilots).
