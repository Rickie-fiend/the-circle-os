# Today's Note storage and safe sync plan

Date: 2026-10-31. Status: approved documentation scope; implementation proposed.

## Outcome and scope

Keep Today's Note available offline and copy saved changes to the person's
Supabase account when a connection is available. Never silently replace competing
writing, restore cleared text, or call a change backed up before it is confirmed.

This first slice covers the editable Note only. Thoughts, reflections, chapter
answers, other evidence, legacy profile-server migration, membership, Athena,
admin tools, and deployment remain separate. The sync structure should allow
later record types without uploading the whole application state now.

The developer approved saving this plan and updating architecture, current task,
and handoff. That approval does not authorize code, database configuration,
operational backup setup, or personal-data migration. No new product decision
is asserted by the implementation proposals below.

## Current evidence

- Supabase account entry and account-separated browser stores exist. Hosted
  sign-in, reset, logout, and basic offline return have developer-reported
  success; that is not cloud evidence-sync verification.
- `app/os/circle-os-store.ts` stores scoped state in IndexedDB with a
  localStorage copy. Writes can fail; a UI update alone is not proof of a
  durable save. The new flow must report failure rather than imply success.
- `answerSurveyQuestion` in `app/os/circle-os-model.js` stores the editable
  `checkin-note` answer, including an explicit empty answer when cleared.
  Preserve this legacy identifier and existing Note behavior.
- `queueProfileUpdate` groups pending changes by reason and updates their
  revision. `mergeServerState` selects survey answers by `answeredAt`.
  These are legacy mechanisms, not a safe conflict protocol for this slice.
- The provider in `app/os/circle-os-shell.tsx` runs remote sync only for legacy
  scope. `app/os/circle-os-ai.ts` rejects account-mode legacy requests.
  No Supabase note table or evidence transport is connected by these paths.

The current editable Note is not automatically a new note for each date.
Do not turn it into a daily archive as part of storage work. Record edit times
without changing which Note the product opens. The Circle day remains 06:00;
travel handling remains a separate open decision.

## Proposed save and sync contract

1. Open the account's local writing first. Network reads must not delay offline
   entry or replace pending local content.
2. Commit the Note value and its pending operation together in a durable local
   transaction. A localStorage fallback must retain both together and have a
   reviewed recovery rule. Never leave a saved note with no way to retry it.
3. Each operation has a unique stable ID, the Note identity, the server version
   it was based on, its value (including empty text), and its local edit time.
   Device identity is useful for diagnostics, never proof of account ownership.
4. Use the current authenticated session for upload. The server derives the
   owner from authentication, not a client-supplied owner field. An expired
   offline-entry proof grants no remote write permission.
5. Accept each operation atomically. Record its ID and result with the accepted
   revision, so an interrupted request can be retried without a duplicate.
   Reusing an ID with different content must fail rather than overwrite it.
6. Acknowledge only committed operation IDs and their outcomes. Locally persist
   that acknowledgement before retiring those operations. A response for an
   earlier edit must leave edits made during the request pending.
7. Pull the latest server records on entry, reconnect, and foreground, with
   retry/backoff while the app is open. No promise of background sync after the
   browser is closed. Realtime notifications may be added later; correctness
   must not depend on receiving one.
8. Merge downloaded data without discarding pending work. Coordinate same-account
   tabs and rebase transactions on persisted state so one tab's whole-state
   snapshot cannot erase another tab's Note or pending operations.
9. Cancel or reject late reads, writes, and acknowledgements after logout or
   scope changes. Retain local data under its original account. Signed-out,
   test, and legacy scopes cannot upload to this account's note storage.

Server version checks determine ordering; device clocks do not choose a winner.
The first slice can fetch the small set of current and unresolved Note records
without a change cursor. A later paginated feed needs a transaction-safe cursor;
timestamps alone must not cause missed records.

## Proposed records and access

Exact SQL, grants, indexes, function permissions, limits, and names require an
implementation proposal. Suggested logical records are:

| Record | Purpose |
| --- | --- |
| Current Note | One current projection per account and stable Note identity, with text and server version |
| Note revisions | Accepted changes and unresolved competing values, with parent version and server receipt time |
| Operation receipts | Per-owner operation ID and durable result for safe retries |

Unresolved revisions must survive reload and another-device access. This is
conflict protection, not a promise of a user-facing full edit-history feature.
Revision and receipt retention require review before cleanup is implemented;
an old retry must not become a new write after receipt removal.

Use Postgres text records rather than a public file bucket. Enable row-level
security and narrow grants for every exposed table/function. Own-account access
must succeed; other-account and unauthenticated access must fail. No privileged
secret goes into the browser. Review any elevated database function explicitly;
RLS alone is not proof that an elevated path is correctly scoped.

The approved beta contract includes protected read-only admin writing access
and separate manual account deletion. This Note slice must leave room for those
requirements without giving ordinary accounts admin rights. Admin implementation
and access auditing remain separate release work.

## Conflicts and clearing

An operation based on the current server version can advance the current Note.
If that version has changed, preserve the submitted text as a competing revision
and return a conflict result. Persisting a competing revision is not the same
as resolving it. Never silently use the newest device timestamp as the answer.

The person chooses the saved version or combines the writing. The exact screen
and wording need a separate interaction review before implementation. Resolution
creates a new operation against the latest server version. If another edit
arrives meanwhile, preserve the new conflict and ask again. Both source values
remain recoverable until the resolution is safely saved and confirmed.

An empty string is an intentional clearing edit with its own operation and
version. Absence of a row is not a clear. An offline stale device cannot restore
the old text automatically. A concurrent clear and text edit are a conflict
for the person to choose, not a special last-writer shortcut.

## Recovery, migration, and backup

- First verify isolated synthetic accounts. Then separately review importing
  the existing account-scoped Note. Preserve the original local copy and record
  the migration version so repeated reloads/import attempts are idempotent.
- If both cloud and local values exist on first adoption, preserve both and
  resolve them explicitly. A download must not overwrite the local Note.
- Never silently claim legacy browser/profile-server data for a signed-in
  account. Ownership, backup, validation, and rollback for that migration need
  their own approval. Do not edit generated personal state by hand.
- Browser storage can be cleared or evicted. Offline availability requires a
  successful local save and retained app assets; it is not a device-loss backup.
  Only confirmed cloud changes can be recovered on a replacement device.
- Cloud sync alone cannot recover every accidental edit or deletion. Verify the
  project's actual backup arrangement, restore procedure, recovery coverage,
  and deletion suppression before claiming operational backup readiness.
- The existing contract allows deleted data in backups for at most 30 days.
  Apply deletion to live revisions and receipts as well as the current Note;
  restore must not revive deleted accounts/data. Retained-device handling and
  exact retention/deletion procedures remain open launch requirements.

There is no user export/download in beta. Operational recovery does not add one.

## Implementation sequence and likely file scope

Each step requires a concrete reviewed file list and developer approval before
editing. Reuse account scope, auth, Note domain actions, and existing storage.

1. Define SQL and local data contracts: versioned migrations under a proposed
   `supabase/migrations/` directory; a focused Note sync model and tests; access
   and conflict tests using synthetic users. Agree revision/receipt retention.
2. Wire durable Note operations into `app/os/circle-os-model.js`, its types,
   `app/os/circle-os-store.ts`, and the provider in
   `app/os/circle-os-shell.tsx`. Add an authenticated Note transport using the
   existing client in `app/os/auth/supabase-client.ts`. Keep legacy transport
   separate. Confirm exact files and whole-state/multi-tab integration first.
3. Review the smallest useful sync-status and conflict interaction. Distinguish
   local save, pending upload, confirmed cloud save, failure, and conflict.
   Do not show the whole app as backed up when only Note is covered. Preserve
   App Box geometry and established Note/Line behavior.
4. Verify hosted synthetic sync and recovery, then propose the account Note
   migration and operational backup configuration separately. No deployment
   is implied by any of these steps.

## Acceptance checks

Use isolated synthetic records, never private writing as fixtures.

| Check | Required result |
| --- | --- |
| Offline edit, reload, and reconnect | Local value and pending operation survive; cloud eventually matches |
| Lost response after server commit | Retry returns the same result without duplicate revisions |
| Edit while upload is in flight | Earlier acknowledgement cannot retire the later edit |
| Clear, then connect an old device | Old writing does not return automatically |
| Two devices edit the same version, with incorrect clocks | Both values survive; person chooses the result |
| Conflict reload and concurrent resolution | Unresolved writing survives; a later conflict is detected again |
| Two tabs save or upload together | Neither loses committed writing, operations, or other app records |
| Storage quota/transaction failure | Failure is visible; no false local-save or backup success |
| Logout, switch, revoked/expired session | No cross-account response application or unauthorized cloud access |
| Direct table/function requests | Own-user access passes; other-user and signed-out access fail |
| New device and repeated initial import | Confirmed Note restores; import does not duplicate or overwrite work |
| Operational restore and account deletion | Restore works; deleted data is suppressed and backup expiry meets policy |

Run focused model/storage/access tests, actual mobile browser offline/retry
journeys, hosted two-user/two-device checks, and risk-appropriate lint/build.
Record exact results and distinguish local harness checks from hosted proof.
No runtime checks were run to verify this documentation-only plan.

## References

- [Current architecture](PRODUCTION_ARCHITECTURE.md#data-and-sync-design-to-preserve)
- [Launch plan](WEB_BETA_LAUNCH_PLAN.md#delivery-sequence)
- [Confirmed conflict and privacy choices](DECISION_LOG.md#2026-10-31--remaining-beta-contract-choices-and-clarifications)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase database functions](https://supabase.com/docs/guides/database/functions)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)

Supabase references were consulted during planning. Backup coverage depends on
the configured project/plan; no remote database or backup inspection is claimed.
