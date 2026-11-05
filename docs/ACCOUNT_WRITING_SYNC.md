# Account writing storage and transport

Repository implementation: 2026-11-05. Hosted migration applied and bounded
two-account RPC checks verified on 2026-11-06. Activation remains off.
This covers the account writing ledger, not every Circle OS domain or legacy
profile-server data. No personal migration is authorized by this implementation.

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
