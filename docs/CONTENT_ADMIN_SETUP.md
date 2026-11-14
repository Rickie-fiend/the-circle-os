# Content Admin foundation

## Hosted template acceptance completed — 2026-11-14

Developer explicitly approved migration 004 and the prepared synthetic hosted/
browser procedure. Migration applied once successfully; never reapply 001–004.
Final `--write --app --catalog --templates` run passed 88 functional checks plus
the real browser Explore → Routine/Protocol → completion → reload journey.
Both template kinds preserve immutable v1/v2 editions, source/reflection settings,
access boundaries, metadata, withdrawal and restore. Exact fixture absence was
confirmed after every attempt, including the successful final run. No real
authored content, deployment or sync activation occurred. Earlier pending notes
below describe the preparation stage and are superseded by this result.

The live journey exposed an actual destination defect: saved Routine selection
overrode Protocol's hash after Start. The reader now atomically saves the desired
shared page index with adoption; final build/TypeScript, lint, local retry cases
3/3 and hosted browser pass. Runner expectations now match signed-out 401 and
changed-image retry 503; retained original image bytes are independently checked.
The latter classification remains an operating/UI issue, not a claimed fix.
Fixture storage initialization now excludes opaque/foreign-origin pages, removing
its SecurityError. Phone, true contention and backup/restore gaps remain open.

## Template support and migration 004 — 2026-11-13

Local completion follow-up — 2026-11-14: Explore and Habit/Protocol adoption are
implemented with bounded local browser/model verification. A read-only check of
the configured CircleOS Server project confirmed circle_template_valid(jsonb)
is absent, so migration 004 remains unapplied. Its listing now also returns only
saved cover/description metadata; older lists still supply their existing titles.

Local Admin adds Habit templates and Protocol templates. Draft saving/recovery uses the existing hosted foundation; synthetic browser verification does not certify a new hosted template-save journey. Publishing the new kinds requires `supabase/migrations/202611130004_content_templates.sql`, prepared and exercised in isolated SQL tests only. Do not apply it without separate developer review/approval. Never reapply migrations 001/002/003.

Review migration 004, then authorize the bounded hosted slice below. Physical
phones, true contention and backup/restore remain separate verification gaps.

## Prepared hosted template acceptance

This procedure is prepared, not run. It requires separate approval for the live
database migration and synthetic writes. The target is the existing configured
CircleOS Server project; no new project, branch, deployment or account grant for
a real person is requested.

1. Recheck that migration 004 is absent; inspect current foundation objects and
   applicable advisors. Never reapply 001/002/003 or an already-applied 004.
2. Apply [migration 004](../supabase/migrations/202611130004_content_templates.sql)
   once, transactionally. It extends catalog kinds/validation/publication and
   listing metadata, preserving immutable editions, private media and receipts.
   It adds no hosted personal-record table or sync activation.
3. Using installed Node and Playwright with private existing configuration, run:

   ```text
   node --env-file=.env.local scripts/check-content-admin-live.mjs --write --app --catalog --templates
   ```

   The existing runner starts an isolated local production Next server and
   creates two temporary verified synthetic accounts, one temporary Admin grant,
   private image, drafts, publication versions and receipts. Template fixtures
   are clearly synthetic and briefly visible to signed-in catalog readers.
   The new helper verifies Routine/Protocol v1/v2 immutability, exact reads,
   metadata, denial, withdrawal/restore and real browser discovery/adoption.
   An isolated browser signs in as the synthetic ordinary account, seeds only its
   local Day One gate, then follows Explore → setup → Add/Start → real tool →
   completion → reload. It checks retained reflection/source settings. This is
   template acceptance, not onboarding certification. No personal owner data is
   used and no AI provider is called. Session values remain inside the isolated
   context; no credential dumps or traces are emitted.
4. Close the browser and remove only the registered synthetic drafts, immutable
   versions/references, image, receipts, grant and accounts, including after a
   failed check. Stop only the child server. Confirm exact fixture absence.
   Report any cleanup failure immediately; never delete broadly to clean up.
5. Record actual results and remaining gaps. Failure is not permission to alter
   real content, drop tables, reapply migrations or deploy. Preserve additive
   records and review recovery separately if an operational issue remains.

Implementation is in the [runner](../scripts/check-content-admin-live.mjs) and
[template helper](../scripts/check-content-templates-live.mjs). Syntax, lint and
write/dependency-gate checks are local preparation, not hosted acceptance.


## Hosted catalog verification — 2026-11-12

Developer reports applying migration 003; the approved hosted test pass verifies
its objects and policies operationally. Never reapply 001/002/003. Admin's
Catalog publishing panel supports exact saved-draft publication and withdrawal/
restore, with old links/images retained for signed-in readers. The optional
`--catalog` flag extends the explicitly write-gated hosted script with synthetic
publication/version/Article/image/access/withdrawal/restore checks and exact
cleanup. `--write --app --catalog` now passes 62 functional checks, followed by
exact fixture cleanup and absence checks. Real Supabase and isolated built Next
HTTP handlers were exercised. No agent-applied migration, real authored publication,
deployment or writing activation occurred. Actual link expiry, physical phones,
full Reflect acceptance and backup/restore remain open.

2026-11-11, Asia/Bangkok. Repository implementation and the subsequent bounded
hosted setup/verification were explicitly approved in chat. Publication and
deployment remain outside that approval.

## Hosted status

Both `202611110001_content_admin.sql` and the follow-up
`202611110002_content_admin_operations.sql` are applied. Do not reapply either.
Preflight confirmed no existing foundation objects/bucket or Storage object
policies. The follow-up gives the trusted service role explicit bootstrap,
inspection and exact-fixture cleanup permissions; browser requests still use
the verified caller's token. It adds no ordinary-user mutation grants.

Both requested accounts have content grants. The first is verified; the second
has been invited and must verify its email before its grant permits access.
No account addresses/UUIDs or credentials are stored in this record. Invitation
acceptance and the second owner's first sign-in remain manual acceptance steps.

The final hosted run passed 38 functional checks, including actual built Next
HTTP handlers, direct RPC/RLS, private Storage, retries and revocation. Exact
synthetic accounts, drafts, receipts, asset metadata and image objects were
removed, with follow-up absence checks. The first failed attempt's two accounts
were also removed; a final Auth inventory confirmed zero test accounts remain.
See [journey evidence](USER_JOURNEY_TESTING.md#hosted-content-admin-setup---2026-11-11).

The local Next preview on port 3012 was restarted from the final build; its
Admin status endpoint returns the expected 403 without a signed-in token.
Refresh the browser, then use Account -> Admin. No hosted web deployment occurred.
Operational rollback closes the new surface by revoking content grants while
preserving authored rows/assets. Do not drop applied tables or buckets to undo
access, or reapply the non-idempotent migrations. Full backup/restore remains
an operating gap rather than a claim from this additive schema change.

## Prepared implementation

Account mode uses verified Supabase bearer authentication plus a protected
`circle_content_admins` grant, checked on each protected request. The account
menu checks permission when opened. The legacy cookie/password cannot unlock
account mode. Legacy mode retains its existing doorway and separate local drafts.
Content permission does not grant access to personal writing or membership.

Chapters use shared mutable drafts with revision checks and exact operation
receipts. Browser recovery and pending saves are separated by account and tab;
they remain until acknowledged. Conflicts preserve the device text. Duplicate
the draft to work on a separate copy when an edit needs manual reconciliation.
Old browser drafts are neither uploaded nor assigned to a login automatically.

The Media library accepts JPEG/PNG/WebP up to 5 MiB, requires alternative text,
and checks file signatures. Files have immutable UUID paths in a private bucket.
An uncertain upload retry compares stored bytes before accepting metadata.
Five-minute signed previews can be refreshed by reopening Media. Copy image
reference provides a stable asset ID; content placement/rendering is a later slice.
There is no automatic cleanup or asset deletion in this foundation.

Published-version storage has no direct client mutation grants. Publication and
signed-in exact readers now have bounded hosted verification. Drafts remain
Admin-only; verified accounts can read exact published/withdrawn versions and
their referenced images. Explore is separate. Quote reading remains public.
Account Workshop publication and personal run-reset/door actions are blocked.
Editing an existing published chapter now prepares the next version.

## Hosted setup review

1. Confirm the intended project, backup/rollback procedure and verified account
   UUID without committing credentials or private account identifiers.
2. Review and apply `supabase/migrations/202611110001_content_admin.sql` once.
   It adds draft/version/asset tables, protected grant and receipt tables,
   authenticated RPCs and a private Storage bucket/policies. Existing migrations
   must not be reapplied. Apply the operations follow-up once for trusted
   bootstrap/cleanup. Both were already applied to the current project.
3. A trusted database operator inserts the chosen verified UUID into
   `public.circle_content_admins(account_id)`. The app cannot grant this role.
   Recovery uses verified account recovery followed by an operator-reviewed
   replacement grant. Removing the row denies the next protected request.
4. Verify actual admin/ordinary/signed-out sessions, direct REST/RPC and Storage
   denial, save/reload/conflicts, upload/retry and private image access. Use only
   synthetic drafts/images. Do not activate or publish content incidentally.

Local SQL tests model Storage tables; the separate hosted checks exercised the
real Storage service. Actual session revocation (distinct from grant removal),
true lock contention, backup/restore, production offline restart, signed-preview
expiration and physical-phone acceptance are not certified here.

Use `node --env-file=.env.local scripts/check-content-admin-live.mjs --write --app`
only with explicit hosted verification approval. It launches an isolated local
built Next server, creates synthetic accounts/content and removes exact fixtures.
It never prints credentials or signed URLs. A new environment needs its own
configuration and approval; the command is not an unattended health check.

## Boundaries and remaining work

Article drafting and Chapter image placement/captions now have local editor and
compiled-CSS browser evidence, including new-content glass and save/reload.
The existing shared draft schema is reused; no additional hosted migration was
needed. This is not a new hosted Article-save or physical-phone acceptance claim.

Template editors, general asset cleanup/retention, legacy-draft import and
Explore/adoption remain reviewed follow-up slices. No personal store, day rule,
chapter answer, authored reading or writing-sync activation is migrated.
