# Backup and restore runbook

Updated: 2026-11-15, Asia/Bangkok. Audit and approved synthetic local rehearsal
complete. Two normal restores and both mobile widths pass; restoring an older
snapshot demonstrably loses later edits and revives later-deleted data/accounts.
Operating recovery remains gated. No hosted or live-sync change was made.

## Executed local rehearsal

Run `node scripts/check-backup-restore.mjs --write` only for an approved disposable
local rehearsal. Optional CIRCLE_SUPABASE_CLI/CIRCLE_DOCKER_CLI select installed
executables; no hosted environment file is loaded. CLI 3.1.0 and Docker 29.9.3
were used. The runner creates unique source/target stacks, applies repository
migrations only to the local source, rebinds default published ports to loopback
before fixtures, and tracks its own cleanup. Official images remain cached.

Source data comes from models/real local RPCs; restored user journeys use an
isolated production webpack build. Schema ownership and a synthetic custom role,
16 selected data tables and one media object are checked. Auth coverage is users/
identities; full session/provider configuration is outside this rehearsal. The
Storage archive method uses the inspected local file-backend volume, not hosted
Storage object backup. Local credentials and bootstrap privilege stay out of the
app/browser. Synthetic SQL, media, keys, builds and owned infrastructure are removed.

Final run: two normal restores pass exact row digests, media hash, retry/receipts,
owner separation and 360/390px app/reload/clearing checks. A pre-commit marker proves
the import was reached before deliberately terminating its connection; metadata
then proves rollback. Missing/modified backup guards pass. This does not certify
mid-COPY failure or power loss. Focused suite 69/69, build/TypeScript and lint pass.

Measured: backup/archive 1090ms; SQL import/notification 626ms and 452ms; scripted
post-backup loss window 1321ms; cleanup 7967ms. SQL artifact 98,659 bytes; media
archive 5,632 bytes. SQL time excludes media transfer, service readiness, build
and browser work; no production RPO/RTO or safe-reopen time is claimed.

**Deletion safety FAIL:** post-backup accepted Note text is lost, and the deleted
entry/account return from the older snapshot. The target remained local. No
independent deletion journal/replay was implemented. Design that protection and
the ongoing/off-site backup route before operating restoration or activation.
[Detailed evidence](USER_JOURNEY_TESTING.md#local-synthetic-backup-and-restore--2026-11-15).

## Authority and limits

[Product](PRODUCT.md#privacy-and-identity), the
[record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#trash-permanent-deletion-and-retention)
and [writing protocol](ACCOUNT_WRITING_SYNC.md) own behavior. This document owns
the operating procedure and its evidence. Deleted backup data must expire within
30 days; Trash has no automatic expiry. This audit does not certify either
provider deletion timing or an operating backup system.

## Observed project and access

| Item | Evidence on audit date |
| --- | --- |
| Project | CircleOS Server, gcqmblrkpfvjnewzdycj |
| Organization | CircleOS, evejzffovocwzijytdjp; connector reports free/tier_free |
| Database | Singapore (ap-southeast-1), PostgreSQL 17.11.0.011, ACTIVE_HEALTHY |
| Isolated target | Hosted branch list empty; approved local source/target rehearsal completed and all owned resources removed |
| Scheduled backup availability | Signed-in Dashboard > Database > Backups > Scheduled backups explicitly says Free Plan does not include project backups |
| Provider restore dates | None displayed in the scheduled-backup Dashboard |
| Restore permission | Dashboard can be read. Restore authorization/ability was not exercised |
| PITR | Not verified enabled; not a recovery source this procedure can claim |
| Manual local backup | Developer identified D:/CircleOS-backups; before-catalog-003 contains roles.sql, schema.sql, data.sql, migration copies and one image; linked project reference matches CircleOS Server |
| Media backup | One 8,460-byte file in the local backup's images/circle-content directory; full coverage and restoration unverified |
| Cost | Audit incurred no provisioning. Future plan/target/storage cost needs a current quote and approval |

Dashboard evidence:
https://supabase.com/dashboard/project/gcqmblrkpfvjnewzdycj/database/backups/scheduled

Connector metadata and read-only pg_tables inspection confirm four
circle_private writing tables and eight public content/quote tables. A signed-in
dashboard check was used because the connector exposes no backup inventory tool.
After the developer identified the local backup, inspection used file metadata,
hashes, SQL table/COPY headers and aggregate row counts; record values,
credentials and personal writing were not displayed or copied into documents.

## Existing local backup found after the initial audit

Location: D:/CircleOS-backups/before-catalog-003. This is a local manual backup,
not a verified off-site copy. Its saved project-ref matches gcqmblrkpfvjnewzdycj.
SQL dump headers identify PostgreSQL/pg_dump 17.11.

| File | Bytes | File modification time, Asia/Bangkok |
| --- | --- | --- |
| roles.sql | 297 | 2026-11-12 06:56:44 |
| schema.sql | 41,453 | 2026-11-12 06:57:56 |
| data.sql | 68,482 | 2026-11-12 06:58:11 |
| One circle-content image | 8,460 | 2026-11-12 06:58:29 |

These are filesystem times, not a certified transaction-consistent recovery point.
Data contains 45 COPY blocks; all terminate and a database-dump completion marker
is present. The schema dump has no matching standard completion comment; its
completeness is unproven, not established as truncated. File hashes were computed
read-only; without an original manifest they do not establish original integrity.

Aggregate COPY-row inventory: auth.users 3; writing_heads 10; writing_receipts 68;
writing_conflicts 6; writing_resolutions 10; content_admins 2; content_assets 1;
content_drafts/content_receipts/content_versions 0; circle_quotes 1;
storage.buckets/storage.objects 1 each. Auth session/token COPY sections are also
present. Treat the dumps as sensitive recovery material and keep their contents
out of Git, reports and browser fixtures. Encryption/access/retention were not
audited; no source files were changed.

The schema/data cover the four writing tables and six public content/quote tables
from before catalog migration 003. Current live metadata has eight public tables:
circle_content_items and circle_content_version_assets are absent from this dump.
The backup contains migration 003 as a separate file, which does not make its
schema or later records part of the snapshot. Template migration 004 is not in
the copied migration set. Never replay those migrations on the live project.

This establishes that a historical local backup exists, including Auth data and
one image. It does not prove a successful restore, current coverage, backup
consistency, image integrity against the database, an ongoing schedule, off-site
durability or deletion after the snapshot. Later accepted records cannot be
assumed recoverable from this copy. Keep this real-data backup intact and use
synthetic data for the first rehearsal.

## Coverage to preserve

| Layer | Required recovery evidence |
| --- | --- |
| Auth | Same user UUIDs and ownership references, verified access rules; restored old sessions must not silently restore revoked access |
| Writing | writing_heads, writing_receipts, writing_conflicts, writing_resolutions; exact snapshots, immutable revisions, source links, server versions and retry identities |
| Deletions | Current entry tombstones and account deletions, including events after the backup point; scrub related saved/conflict/resolution bodies |
| Content | All circle_content_* tables and circle_quotes, immutable id/version links, publication/withdrawal state and permissions |
| Media | Private circle-content file bytes plus object metadata, bucket configuration, access policies and version-to-asset links |
| App/config | Git code and migrations, private recovery of required configuration, reviewed Auth/mail/redirect/keys and service settings |
| Local-only records | Unsent answers, unaccepted edits and other unsynced domains have no server backup here; keep this limitation explicit |
| External runtime | Legacy profile files/chapter compiler inputs require separately scoped ownership and backup; Git authority did not migrate these records |

Supabase database backups exclude Storage file bytes. New-project restoration
also requires service configuration review. A database-only restore is
insufficient evidence of a working app.
[Database backups](https://supabase.com/docs/guides/platform/backups),
[new-project restoration](https://supabase.com/docs/guides/platform/clone-project).

## Deletion finding

The reviewed writing migrations store terminal entry deletion in writing_heads;
all four writing tables reference auth.users with ON DELETE CASCADE.
Current-table tombstones stop stale devices while those tombstones survive.
They do not establish suppression after restoring a backup taken before deletion.
Account deletion can remove the same database's writing suppression records.

Inference: an older restored database could contain writing or an account deleted
later. Existing stale-ledger tests do not test that database rollback scenario.
No independently durable deletion journal was found in the reviewed repository
or circle_private/public table inventory. External procedures remain unknown.

Before any restored environment is exposed, a reviewed mechanism must preserve
and reconcile post-backup entry/account deletion events. A possible design is a
body-free, access-controlled deletion journal outside the restored failure domain,
with stable owner/entry IDs, operation IDs, deletion times and replay progress.
This is a proposal, not an approved schema or implemented guarantee. Its durability,
retention, access, account recreation and interrupted/repeated replay need review.
A second table inside the same rolled-back database alone does not solve this.
If current deletion evidence is missing or incomplete, keep the restore isolated.

## Proposed drill and prerequisites

The first approved rehearsal above used two disposable local Supabase environments
with synthetic data, PostgreSQL 17 and repository schema. About 124 GiB was free
on D: during preflight. The original real-data backup was not restored. Subsequent
operating drills require their own concrete source/target/cost/deletion review.
The remaining steps below describe that operating target; passing the bounded
local rehearsal does not establish its deletion/retention requirements.

An isolated local rehearsal proves logical recovery behavior, not hosted provider
backup restoration. A later hosted backup drill needs its own named destination,
available backup, current cost quote and approval. Never restore in place on
gcqmblrkpfvjnewzdycj for this rehearsal.

Before executing, record source/target IDs and URLs, exact backup timestamp,
backup method and tool versions, included schemas/roles/data, required Auth/Storage
handling, artifact encryption/location/access, deletion-evidence source, cleanup
plan, spending cap and maximum run duration. Validate commands against installed
CLI help and official docs; do not use a generic default dump without checking
its Auth/Storage/private-schema exclusions.

Execution order for the separately approved drill:

1. Create synthetic accounts A/B and representative accepted Notes/Deep Thoughts,
   multiple revisions, clearing, Trash, conflicts/resolution and exact receipts.
   Include immutable content versions and one synthetic media object.
2. Capture a consistent backup and protected manifest with expected identities,
   counts and hashes. Record start/end time and encryption/access handling.
3. After the backup, permanently delete an entry and a separate synthetic account;
   record deletion evidence independently. Revoke a synthetic session. Add a newer
   accepted edit so the backup's loss window can be measured.
4. Restore the backup into the verified disposable target with app access closed.
   Restore media/config through their separate reviewed routes. Do not copy real
   mail recipients, scheduled jobs or production callback destinations.
5. Reconcile later deletions and revocations before allowing any reader. Interrupt
   reconciliation once; restart it and repeat it to check safe resumption/no-ops.
   Missing deletion evidence must block access.
6. Run the acceptance matrix below through actual app/owner RPC paths, including
   old local copies and fresh stores. Record precise failures without private text.
7. Remove only the named disposable resources and artifacts under the approved
   cleanup plan; verify absence and record final cost. Do not delete live resources.

## Acceptance and stop rules

| Case | Required result |
| --- | --- |
| Normal restore | Exact accepted text, IDs, owner, dates, versions, source links and receipts match manifest; no invented newer data |
| Cleared entry | Expected dated empty revision survives with original history; test reconciliation of a clearing after the backup separately before claiming it preserved |
| Post-backup deletion | Deleted entry/account unavailable before any access; saved text/drafts/conflict/resolution bodies scrubbed under the domain contract |
| Stale device/retry | Captured old uploads cannot recreate deleted content or duplicate accepted operations |
| Isolation | A cannot read/write B, B starts empty where expected, unauthenticated requests denied |
| Interrupted restore | Target remains closed after failure; reviewed restart restores consistently |
| Missing artifact/evidence | Restore stops with a clear gap; no fallback fabricates records or exposes unsanitized backup data |
| Media/content | Exact version links and file hashes match; missing files stay unavailable, never substituted |
| Retention | Evidence of removal from every controlled backup/object copy within the 30-day deletion maximum; a configured interval alone is not proof |

Measure backup age at simulated loss, backup duration, restore duration,
deletion-reconciliation duration and time until access can safely reopen.
Agree acceptable loss/recovery targets before execution; none are selected here.
Production loss window and recovery time remain unknown because no production
backup restoration has been demonstrated. Synthetic timing is not production downtime.

## Review decisions and next action

1. Assess the existing local backup's consistency and restoreability in a separately
   approved isolated real-data scope if needed. Establish a current backup schedule,
   protected off-site copy and media coverage, or review a paid provider route.
   Obtain a current quote before committing costs; the historical local copy is
   not evidence of ongoing protection.
2. Review independent deletion evidence and how clears/newer accepted revisions,
   account/session revocations and retained device copies behave after rollback.
3. Use the completed local rehearsal's deletion failure to scope a durable
   safeguard, then separately review hosted recovery and retention verification.

Do not enable live writing sync on the basis of this runbook. Existing hosted
writing recovery passes twice at 360/390px, but the earlier intermittent Send
cause, phones, backup expiry, restore suppression and broader operations remain
qualified gaps. Initial audit verification used connector/dashboard reads,
read-only schema metadata, source/document review and the historical local backup
inventory. Later local runtime results are recorded above; hosted provider restore,
real-backup restore, off-site durability and deletion expiry remain unverified.
