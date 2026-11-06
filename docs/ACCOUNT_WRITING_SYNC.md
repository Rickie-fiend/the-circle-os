# Account writing storage and transport

Repository implementation: 2026-11-05. Hosted migration applied and bounded
two-account RPC checks verified on 2026-11-06. Activation remains off.
Separate account-scoped IndexedDB reload checks also passed against the hosted
service on 2026-11-06; see the bounded recovery evidence below.
This covers the account writing ledger, not every Circle OS domain or legacy
profile-server data. No personal migration is authorized by this implementation.

## Writing status and conflict resolution - 2026-11-06

Saved copies now includes the latest saved Note above retained original snapshots;
its current-note history follows ledger updates. Archived Cloud/Device histories
stay unchanged. New notes remain in normal History. Hidden scrollbar chrome now
applies to all bounded writing Pages, not just Sync. This is shared app source,
not a demo-only override. No sync protocol, SQL or activation change.

Latest approved controls: History calls the action Sync and hides it when no
saved work, conflict or recoverable error needs attention. Draft-only/completed
states do not show it. Try again is error-only, hidden while retrying and after
success. Retained archives remain accessible via Saved copies on the owning
Note History row; normal row opening still edits. No SQL/activation change.

Later approved presentation refinement: Cloud/Device plus writing only; tap a
copy for its dated read-only history. Note-style Use Cloud / Use Device buttons
stack vertically. Confirmed success returns silently to the sync list. The
scrollbar chrome is hidden while Body remains scrollable. Failure/retry and
stale-review protection remain. No SQL or activation change follows this UI work.

Repository implementation now includes History → Writing sync. Note keeps silent
autosave and the global header has no save/sync label. The separate view shows
device-only, waiting, failure and confirmed-sync states, compares This device and
Cloud copy, and offers an explicit choice. Drafts remain device-local. A choice
is saved locally before upload; failure and response loss retain it for retry.
Changes during review require reviewing updated copies. Clean Note buffers adopt
the chosen current copy when leaving this view; unfinished writing is preserved.

The new [follow-up migration](../supabase/migrations/202611060001_writing_resolution.sql)
was **applied to the hosted project on 2026-11-06**, after developer approval.
It adds private owner-readable
`writing_resolutions`, the confirmed-account `circle_writing_resolve` action,
paged `circle_writing_resolution_history`, and a permanent-deletion scrub trigger.
The original applied migration is unchanged. SHA-256 of the follow-up file:
`60b823dcc45f8ca5ff3623913272501e8dba6886178111600e4c410ec6e929e2`.

Resolution compares the exact reviewed cloud snapshot/server version under the
same account transaction lock as normal uploads. It preserves both original
saved histories in an immutable resolution record, appends a new chosen revision
to the existing cloud history, and retains the chosen active/Trash state, source
and Circle-day attribution. Device clocks never choose a winner. Same-request
retry returns the original result; changed reuse is rejected. Permanent deletion
scrubs request/result bodies and makes an old choice unable to restore writing.
The history RPC recovers retained histories on another signed-in device.

Locally, optional `choices`, `resolved` and body-free `settled` maps extend
`cloud-v1` without replacing old stores. Exact captured pending operations are
settled by the resolution response, not falsely acknowledged as normal uploads.
Newer local edits stay pending and require another review. Both local deletion
and downloaded deletion remove choice/archive bodies. The coordinator recovers
pending choices before normal receipt recovery, inventory and uploads.

These changes supersede the older "no resolver/status UI" descriptions below.
The bounded hosted checks below now verify the resolution protocol. Automatic
sync activation remains separately reviewed and disabled. Unconfirmed-session
hosted access, production-store/physical-device recovery, backups, retention and other-domain
sync remain open. Do not reapply either non-idempotent migration. Local proof is in the
[journey evidence](USER_JOURNEY_TESTING.md#writing-sync-status-and-conflict-resolution-2026-11-06).

## Durable hosted reload recovery - 2026-11-06

Developer approved `durable-checks.ts`, the existing development check page,
`writing-hosted-recovery.browser.mjs` and the four evidence records. The page now
offers explicit start/continue/reload controls. Synthetic runs live in the separate
`circle-os-writing-hosted-recovery-v1:account:<id>` IndexedDB database through
the existing account transaction engine. It never opens the product writing
database. The existing writing/queue/conflict models, coordinator and confirmed-
session transport are reused. Stored entry targets are restricted to that run.
Checkpoints record the document time origin and require an actual full reload;
hot reload alone cannot satisfy the check. Multi-request steps retain progress
for retry. Nothing runs automatically against the hosted service on page load.

Both existing confirmed hosted accounts passed the five reload transitions and
a final completion reload: pending save, accepted upload with reply deliberately
dropped, queued conflict choice, accepted choice with reply dropped, and queued
permanent deletion. Exact recovery retained newer local writing and original
histories. A fresh durable synthetic device recovered the archives. Final replay
checks preserved the terminal head; all three stored device fixtures and replay
snapshots were scrubbed. Completion survives another reload with no writing.
The final read-only hosted audit passed: two heads at server version 7 across two
owners, four archives with null request/result bodies, ten body-free receipts,
and no retained conflict bodies. Auth accounts and minimal server/local metadata
remain; synthetic writing bodies are deleted.

An already accepted upload replay returns its original body-free receipts even
after deletion; the unchanged terminal head proves no resurrection. A prior
resolution replay returns `deleted`. The new harness checks both behaviors.
No SQL, transport protocol, product store, environment, activation or deployment
changed in this slice. Four isolated Chromium cases at 360/390px, final targeted
lint and production Next/TypeScript build passed. Local browser cases also cover
real offline saving, aborted HTTP replies after SQL acceptance, account-separated
checkpoints and late-response scope cancellation; their JWTs are fixtures.

This closes the **separate test-store/page-reload** gap, not the production writing
adapter, cold browser restart, offline page load, physical phone, or operating-
system eviction/recovery path. Hosted lost replies are deliberately omitted from
local acknowledgement; local fixture cases additionally abort the HTTP response.
Hosted unconfirmed/expired/revoked valid sessions, true lock contention and
backup/retention remain open. Real sync stays disabled. See
[exact evidence and limits](USER_JOURNEY_TESTING.md#durable-hosted-reload-recovery-2026-11-06).

## Follow-up migration and hosted resolution checks - 2026-11-06

The developer approved the exact follow-up SQL, development harness extension,
synthetic two-account checks and these evidence records. Applied only
`202611060001_writing_resolution.sql` to `gcqmblrkpfvjnewzdycj` through SQL Editor;
the original migration and configuration are unchanged. The preflight found
none of the four follow-up objects. Supabase then reported success. Seven catalog
checks passed, including exact normalized hashes of all three installed function
bodies, owner-only RLS/select, denied direct writes, authenticated-only RPC grants,
fixed definer paths, inaccessible helper, deletion trigger and initially empty
archive. No CLI migration-history registration was performed; do not blindly
apply the file again.

Both confirmed hosted test accounts passed local/cloud choices, stale-review
rejection, exact/changed retries, accepted resolution response-loss recovery with
a newer local edit, fresh in-memory device archive recovery, Trash/restore,
permanent deletion and blocked stale upload/choice replay. All five RPCs denied
anonymous, invalid-JWT and direct server service-role requests. The current
service-role route passed; its earlier network-error result below is historical.

The second account could not read the first account's head, exact receipts or
still-live archive. It independently used the same entry IDs and rejected a
foreign-owner choice. Reciprocal rechecks verified hidden peer receipts/archives,
unchanged own heads/history and cleanup of both live synthetic archives.
The final read-only audit passed: four terminal heads across two owners, six
archives with null request/result bodies, two scrubbed conflict candidates and
26 body-free receipts. Test accounts remain; synthetic bodies are deleted.

The harness uses existing confirmed sessions and memory-only synthetic bundles,
never personal IndexedDB writing. This does not certify physical devices, durable
hosted IndexedDB reload, true multi-connection lock contention, expired/revoked
valid sessions, hosted unconfirmed-session access or backup/retention coverage.
`NEXT_PUBLIC_CIRCLE_WRITING_SYNC=disabled` remains unchanged. No personal import,
activation or deployment. See [exact checks, attempts and limits](USER_JOURNEY_TESTING.md#follow-up-migration-and-hosted-resolution-checks-2026-11-06).

## Hosted verification - 2026-11-06

The developer separately approved applying the exact migration to
`gcqmblrkpfvjnewzdycj`, then approved the local development harness and synthetic
two-account checks. Supabase reported success. The saved SQL matched the repo
after line-ending normalization and trimming (SHA-256
`28f44e9c4ee054d3ac097748ebfbb3a39bf9e0f1650413626b0dea23d428cec4`).
Eight read-only catalog checks passed for tables/RLS, owner policies, grants,
fixed-path definer RPCs, inaccessible helpers, cascading Auth references and
initially empty writing tables. The SQL Editor application did not register a
CLI migration-history entry; do not blindly run this non-idempotent migration again.

The development-only `/os/sync-check` uses each window's existing confirmed
session and the real authenticated transport. Synthetic writing and simulated
device bundles stay in memory, outside the person's IndexedDB ledger. Run the
first account, copy its credential-free witness into the other account's page,
run that account, then recheck the first. Leave automatic sync disabled.

Both accounts passed own saved-writing access, exact retry/recovery, changed
retry rejection, accepted response loss with a newer local edit, competing-copy
preservation/pause, Trash/restore and permanent-deletion/stale-device suppression.
The second account could not see the first account's head or exact receipts,
and could use the same entry ID independently. The first account's tombstone
and receipts remained unchanged afterward. Anonymous and invalid-JWT calls to
all three RPCs were denied. The developer operated the private-window run and
supplied its results; the normal-window run/recheck were observed directly.

The local server's service-role probe returned `networkError: true`, meaning
its request/response handling failed; the exact connection cause is unverified.
This is not proof of an authorization failure. A separately approved direct server-side probe using
the configured secret returned HTTP 403 / PostgreSQL `42501` for all three RPCs.
No secret was printed or sent to the browser. The page may still show STOP for
that local-server probe limitation; it does not display the separate
terminal result. A read-only hosted audit verified two terminal heads, both
conflict candidates scrubbed, and 16 exact receipts. Those synthetic tombstones,
receipts and scrubbed conflict metadata remain; test accounts were not removed.

See [the detailed evidence and limits](USER_JOURNEY_TESTING.md#hosted-account-writing-checks-2026-11-06).
Conflict/status UI, actual device/IndexedDB recovery against the hosted service,
expired/revoked valid-session behavior, real lock contention and operational
backup/deletion verification remain pending. No activation or deployment follows
automatically from these checks.

## Database contract

[The migration](../supabase/migrations/202611050001_account_writing.sql) creates
three tables in `circle_private`:

| Table | Purpose |
| --- | --- |
| `writing_heads` | One saved entry with its saved versions, or one permanent-deletion marker, per account and entry. |
| `writing_receipts` | Body-free operation identity, fingerprint, generation, original request hash, exact receipt and server version. |
| `writing_conflicts` | A competing saved snapshot and request identity. Candidate text is scrubbed when that entry is permanently deleted. |

All three tables have owner-scoped SELECT policies. Direct client mutations
are denied. Public RPCs derive the owner from `auth.uid()` and require the
authenticated role plus a confirmed account. They accept no owner argument.
Anonymous and service-role RPC calls are denied; no privileged transport or
admin reader is introduced. The functions use a fixed empty search path and
explicit qualified table names. Their execution grants are restricted.

`circle_writing_inventory` pages by entry ID, at most 100 heads per call;
the client requests 50. `circle_writing_receipts` returns only the caller's
named receipts, at most 1,000 IDs per call. `circle_writing_apply` serializes
same-account mutations with a transaction advisory lock. It validates the
saved snapshot, checks retry identity and compares the base server version,
then commits a head and all exact operation receipts together. Server versions
advance per accepted operation; device clocks do not choose a winner.

A changed retry fails rather than accepting different content under an old
operation identity. Existing saved versions and original source identity cannot
be rewritten. A competing base produces a durable conflict candidate without
changing the accepted head. The client keeps both copies and pauses uploads
for that entry. A person-facing conflict resolver remains separate work.

Permanent deletion is terminal for an entry ID. It replaces the saved snapshot
with the existing minimal tombstone shape, scrubs server conflict candidates,
and rejects later stale uploads. A local deletion also scrubs the local remote
conflict copy in the same transaction as the ledger/queue update. Downloaded
deletions remove local saved versions and related drafts and record body-free
suppression of pending operations, rather than inventing acceptance receipts.
Deletion can supersede a competing active server head. This deliberately gives
explicit permanent deletion priority over stale edits.

## Local and transport contract

`cloud-v1` shares the existing account writing IndexedDB object store with
`records` and `sync-v1`. Ledger updates, receipt retirement, cloud baselines and
conflict/deletion handling use account-guarded transactions. Baselines retain
version/lifecycle identity, not writing bodies. Remote conflict copies contain
saved writing; drafts never enter the upload protocol.

The coordinator first recovers exact receipts, then reads remote inventory,
then inventories previously saved account writing that has no queue coverage.
Inventory creates deterministic snapshot markers without replaying old draft
receipts. An untracked competing remote entry is preserved as a conflict.
Legacy/profile-server records and compatibility-only writing are not claimed.

Uploads carry a current saved snapshot and ordered operation references.
This permits a deletion to upload without recovering text already removed
locally. Stable request IDs and server request hashes protect exact retries.
An upload acknowledged while newer local edits exist retires only its named
operations. A lost response is recovered before building a newer upload.

Each HTTP request captures a session token, verifies that token's confirmed
user with Supabase Auth, checks it against the captured local account, and
sends that same token to the RPC. Offline-entry proofs are never sent as
authorization. Requests use POST, no-store, rejected redirects, a 15-second
timeout and the account abort signal. Late token checks, replies and parsed
bodies cannot update another account. Backend error bodies are not displayed
or logged by this transport.

The runner is mounted through the existing writing provider and Supabase
connection. It defaults to off. When enabled, it checks on entry, after local
notifications/reconnection/foreground events and every 30 seconds. Runs are
serialized within a tab; database transactions protect multiple tabs. Failures
retain local evidence and pending operations. Full inventory polling is a
bounded first implementation, not a measured scaling result.

One client upload is limited to 1,000 pending operations and approximately
1 MB of encoded JSON. The server rejects requests over 2 MB of its JSON text.
Oversized entries stay local and need a reviewed paging/compaction extension;
no text or versions are silently truncated. Trash has no automatic expiry.
Receipts and conflict metadata do not automatically expire in this slice.

## Checks and activation

Run the focused checks from the repository root:

```powershell
node --test tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-model.test.mjs tests/writing-sync.test.mjs tests/writing-compatibility.test.mjs
node --test tests/writing-cloud.browser.mjs tests/writing-storage.browser.mjs tests/writing-provider.browser.mjs
node node_modules/next/dist/bin/next build
```

The database tests execute the actual SQL in PGlite PostgreSQL with synthetic
Auth tables, roles and claim settings. Browser checks use real IndexedDB and
HTTP with a synthetic Auth/RPC fixture. These prove SQL access behavior and
transport plumbing, not hosted JWT validation, real session revocation,
multi-connection lock contention, physical-device recovery or production mail.
See [dated evidence](USER_JOURNEY_TESTING.md#account-writing-storage-and-transport-2026-11-05).

Before activation, separately approve applying the migration to the selected
Supabase environment. Leave `circle_private` outside the Data API's exposed
schemas; only the public RPC functions need exposure. Check the project's
actual roles/default privileges, confirmed-user behavior, public-function
grants, anonymous denial and two disposable accounts' allowed/denied access.
Verify response-loss recovery and deletion with the hosted RPC before real use.
Do not paste credentials into repository documents or browser fixtures.

Only after those checks should a separately reviewed environment change set
`NEXT_PUBLIC_CIRCLE_WRITING_SYNC=enabled` in a new build. Until then the deployed
app's local saves retain their existing behavior. No environment configuration
was changed by this slice. There is no new cloud-status or conflict-resolution
UI; activation for people must review those operational limits explicitly.

Manual account deletion, protected admin reading/logs, backup recovery and the
maximum 30-day retention of deleted backup data remain release gates. This
migration's live-table scrubbing does not certify deletion from backups,
disconnected devices, external systems or AI context. Other lifestyle domains,
personal/legacy import, membership, Athena and deployment remain separate work.

Technical references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[database functions](https://supabase.com/docs/guides/database/functions),
[PGlite API](https://pglite.dev/docs/api).
