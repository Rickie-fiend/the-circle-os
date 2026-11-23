# Session handoff

## Published Chapter progress and finish — 2026-11-23, Asia/Bangkok

The developer approved fixing published Chapter restart and result-page exit.
The reader now saves a new exact-edition run from the first action, and routes
back to Explore after the protected finish swipe saves. Explore resumes an
unfinished edition, while Admin previews stay temporary. Catalog starts count
toward the existing Chapter limits. The developer's earlier live check covered
legacy Chapters.

The production Next.js webpack build and three production-CSS Chromium cases
at 390px passed. The new case verified an empty-account start, save failure and
retry, edition resume, finish, and Home color after reload. No new build was
deployed. [Journey evidence](USER_JOURNEY_TESTING.md#published-chapter-first-start-and-finish--2026-11-23).
[Current task](CURRENT_TASK.md) gives the next deployed check.

## Home Imprint review complete — 2026-11-23, Asia/Bangkok

**Approval and Git.** The developer reviewed the Home Imprint changes and
confirmed they look good, then approved this documentation update. The product
baseline is `main` at `602ef9d`, which matches the local `fork/main` reference.
`.codex-attachments/` and `supabase/.temp/` were already untracked. No new
commit, deployment or hosted change was part of this update.

**Completed.** Signed-in Home uses the 3× strand artwork and colors six
areas from saved Note, Deep Thoughts, Routine, Log/Week, Protocol and Chapter
activity. A qualifying save can wait for Home to open before it pulses.
Reload shows the settled color. The review uses the current artwork and local
account records. Generating a personal form from replacement onboarding answers
is future work. The [Home brief](PERSONAL_IMPRINT_HOME.md#signed-in-home-imprint--2026-11-23) describes the current behavior.

**Verified.** The six-file Node selection passed all 22 Imprint tests on
`602ef9d`. Earlier Chromium runs covered the local save, pulse and reload paths.
An isolated production Next.js build with hosted Auth and catalog data also
passed the 390px Chapter resume and finish check, including the original
answer and a persistent Home contribution. The hosted runner passed 17 checks
and confirmed exact synthetic cleanup. Catalog migration 004 and hosted template
acceptance were already completed on November 14.
[Journey evidence](USER_JOURNEY_TESTING.md#home-imprint-strand-renderer--2026-11-23).

**Limits and invariants.** The latest Home visual result is developer-reported.
The test record still lacks the deployed Chapter check and physical-phone
coverage. The archived Day One test failures that expect Week to stay locked
were outside this update. This was a documentation pass with no new runtime
measurements. The Chapter evidence covers device saves and exact published
versions. Chapter cloud sync and server-side Athena retrieval are still planned.
Automatic writing sync remains off. Hosted backups stay deferred until the
Supabase upgrade, with a 24-hour maximum loss window for synced beta edits
and the existing 30-day limit for backups containing deleted data.
[Backup runbook](BACKUP_RESTORE_RUNBOOK.md#deferred-until-the-supabase-upgrade).

**Durable records and next action.** The work plan and roadmap now reflect
the completed checks, and the earlier Chapter review has been
[archived](archive/2026-11-22-chapter-imprint/SESSION_HANDOFF.md). The next
proposed slice is the Chapter resume and finish check on the deployed app.
[Current task](CURRENT_TASK.md) gives the proposed steps and open checks.
