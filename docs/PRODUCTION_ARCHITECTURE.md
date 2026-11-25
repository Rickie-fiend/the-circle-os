# Circle OS architecture

## Local synthetic backup and restore — 2026-11-15

Approved rehearsal complete: two exact database/media restores and two complete
360/390px browser selections pass. Missing/corrupt backup rejection, pre-commit
connection-termination rollback, owner isolation and stable retry pass. Final
build/TypeScript, lint and existing focused suite 69/69 pass; cleanup confirmed.

**Open safety failure:** an older snapshot restores a later-deleted entry/account
and loses a newer accepted edit. Independent deletion suppression remains
unimplemented. Local timings do not certify production recovery or 30-day expiry.
No product-code, migration-file, hosted-resource or live-sync change; original backup untouched.
[Evidence](USER_JOURNEY_TESTING.md#local-synthetic-backup-and-restore--2026-11-15)
and [procedure](BACKUP_RESTORE_RUNBOOK.md).

Next: review independent deletion/account-revocation evidence and current/off-site
backup coverage before proposing the operating implementation.

## Backup readiness audit — 2026-11-15

Approved audit/documentation scope complete. [Runbook](BACKUP_RESTORE_RUNBOOK.md)
records connector-confirmed Free plan, Singapore/PostgreSQL 17 project and empty
branch list. Signed-in scheduled-backup Dashboard explicitly reports Free Plan
does not include project backups. Developer then identified the existing local
backup at D:/CircleOS-backups/before-catalog-003. Read-only inspection confirms
roles/schema/data SQL, four writing tables, Auth data and one image; file times
are 2026-11-12 06:56–06:58 Bangkok. This is a pre-catalog-003 historical copy,
not a restore-verified/current backup. Off-site copies and scheduling remain
unknown. Detailed coverage and limitations are in the runbook.

Deletion markers live in the same database; restoring an older backup can predate
them. Independent post-backup deletion/account/session reconciliation is proposed,
not implemented. Production loss window, restore time and 30-day deleted-backup
expiry remain unverified. The runbook prepares a synthetic local rehearsal and
separate hosted drill gates, acceptance matrix, cost/target checks and cleanup.

Next: review current/off-site coverage and independent deletion evidence, then
approve a concrete isolated rehearsal. No new dump, restore, provisioning, product code,
migration, live-sync activation, commit or deployment occurred.

Hosted recovery follow-up — 2026-11-15: final clearing-inclusive hosted
journeys pass twice at 360/390px with fresh A/B accounts per width. Corrected a
History-row click during a guarded Page transition; test-only Send diagnostics
remain. Earlier intermittent Send failure did not recur and is not marked fixed.
Build/TypeScript, focused lint and 58/58 model/transport tests pass. All temporary
accounts removed; scoped SQL confirms zero writing rows. No runtime/deployment
change; sync stays off, phones deferred. Next review backup/restore separately.
See [evidence](USER_JOURNEY_TESTING.md#hosted-recovery-diagnostics-and-repeat-acceptance--2026-11-15).

Hosted production-store recovery — 2026-11-14: isolated sync-enabled production
build now has real Auth/RPC recovery evidence at 360/390px using temporary accounts.
Accepted writing restores exactly; interrupted recovery retries, local-only work
does not return, deletion suppresses stale records and accounts remain separated.
Final clearing-inclusive acceptance fails: latest run times out waiting for Deep
Thought Send to create a saved entry; clearing remains unverified. Earlier complete
recovery selection passed both widths, but current acceptance is not complete.
Completed runs deleted temporary users; scoped writing-table cleanup is verified.
Diagnose the Send/fixture boundary before a separate product-fix proposal.
Live activation remains
off; database backup restoration, retention, local-only draft protection and phone
acceptance remain open. See [evidence](USER_JOURNEY_TESTING.md#hosted-production-writing-recovery--2026-11-14).

Storage-loss qualification — 2026-11-14: approved synthetic desktop checks now
cover partial and full local-data removal. Production recovery 24/24, store 22/22,
provider 16/16 and controller/proof 12/12 pass; build/TypeScript and lint pass.
Automatic writing sync stays off.
Full origin loss has no unbacked-writing recovery source. Phone/OS eviction,
hosted restore, retention and remote stale-copy suppression remain open.
Next review backup/restore separately. Earlier gap lists are qualified only by
this bounded evidence. See [results and limits](USER_JOURNEY_TESTING.md#storage-loss-and-recovery--2026-11-14).

## Durable offline entry — 2026-11-14

Approved implementation adds issuer-namespaced IndexedDB proof/closed state with
strict transaction durability and expected epochs. Local entry verifies proof and
rechecks its epoch; logout locks immediately and awaits durable closure before
network logout. Valid legacy proof imports only into an absent record; an existing
closed record wins. SDK session/refresh-token storage and server authorization
remain unchanged. Controller handles asynchronous invalidation errors.
Full synthetic production crash journeys pass at 360/390px: recovery 18/18,
controller/proof 12/12; build/TypeScript/lint pass. Earlier blocker below is
superseded for this bounded desktop scope. New phone/hosted acceptance, eviction
and backup/restore remain open; no deployment or activation occurred.
See [evidence](USER_JOURNEY_TESTING.md#durable-offline-entry-and-crash-recovery--2026-11-14).

## Browser crash recovery blocker — 2026-11-14

Forced Chromium main-process crash now has production-route synthetic evidence
at 360/390px: service-worker offline navigation succeeds but Auth displays Welcome
back, blocking writing recovery. Final selection 15/17; build/TypeScript/lint pass.
Approved diagnostic follow-up confirms exact saved entries/revisions and drafts
survive. Offline proof exists before the crash and is absent afterward, with no
closed/password-flow markers. Launching offline from creation still reproduces
the failure, and startup reports one blank tab. Exact proof-loss mechanism is
unestablished; downstream crash assertions remain unreached. Review durable proof
and safe logout invalidation separately. No product/hosted/runtime setting changed.
Sync remains off and phones remain deferred. See
[evidence](USER_JOURNEY_TESTING.md#forced-browser-crash-writing-recovery--2026-11-14).

## Natural session expiry — 2026-11-14

The isolated production app now has 390px real natural-expiry evidence: a full
one-hour offline wait with an unchanged issued JWT, service-worker tab reopening,
exact saved Note/unfinished Deep Thought restoration and real renewal on reconnect.
Saved entries/revisions/drafts remain identical. Test and exact temporary-account
cleanup pass. This qualifies the natural-expiry gap in earlier entries only for
desktop Chromium tab reopening; phone testing is deferred by the developer.
No runtime/settings or sync activation changed. See
[evidence](USER_JOURNEY_TESTING.md#natural-session-expiry-and-writing-recovery--2026-11-14).

## Hosted session verification — 2026-11-14

An isolated production build with sync disabled now has bounded real Supabase
sign-in, early token renewal, offline return and revoked-session lock/return
evidence at 360/390px. Saved writing and unfinished drafts remain exact through
account switching. Temporary hosted accounts were removed with absence checks.
Natural JWT expiry and physical-device recovery remain open; early refresh is
driven by SDK scheduling metadata, not an expired signed token. No runtime or
hosted settings changed. See [evidence](USER_JOURNEY_TESTING.md#hosted-account-session-recovery--2026-11-14).

## Admin reliability and independent tool entry — 2026-11-13

Admin routes distinguish 401 session, 403 confirmed role denial and 503 service/transport errors. Transient failures leave the mounted editor and account/tab recovery intact. Account-menu role lookup starts at account-control mount and shares its pending/positive result by current AccountScope; sign-out/account changes invalidate the scope. This UI cache never authorizes server operations: each protected request still verifies identity and role.

ContentFigure uses stable asset IDs and deduplicates targeted image reads per request function/account context for the existing signed-link interval. The private media route can sign only the requested asset instead of listing/signing the whole library per preview. Routine's presentation frame is independent of legacy habit completion; Week setup no longer gates Week. Historical chapter storage/readers and explicit entry remain separate.


## Local template authoring — 2026-11-13

2026-11-14 completion: Explore uses the verified-caller catalog request path and
one listing. Its route removes withdrawn items for every role; migration 004 adds
optional saved description/cover metadata without per-edition reads. Older lists
still render available titles. Account-scope keys discard late responses and
remount browsing. Routine adoption reuses Habit/Task/schedule actions and stores
one immutable templateAdoptions group plus definition references. Normalization
and merge preserve it. Both adoption kinds share an account-scoped
circle-template-adoption Web Lock, read/merge latest local state, and await the
scoped store before navigation. Existing Protocol pending keys remain compatible;
Routine has its own pending operation. An active group blocks another copy of
the same source across catalog versions. Native source disclosures do not commit
an edit. General whole-state editing contention and cloud sync remain separate.

Protocol Start uses a pure adoption model and existing Protocol domain actions.
Source template metadata survives normalization and merge. The reader checks
account scope, serializes Start under the shared account-scoped Web Lock,
merges current and latest local state, and saves before navigation. Session-scoped
operation IDs allow retries without duplicate runs. Browsers without Web Locks
stop adoption safely. The hosted acceptance below covers local adoption.

Template definitions are separate typed envelopes in the existing shared Admin draft/recovery repository. The editor uses the existing private Media picker and Chapter player with optional numeric inputs, image placement and caller-supplied result content. Template settings are declarative fixed/answer/choice/linear-bound values; no executable expressions or provider calls. Published template identity follows draft identity. Exact-version previews retain temporary run state only and never write personal domain records.

Migration 004 is applied after explicit approval (2026-11-14). It adds template
catalog kinds, validates questions/rules, freezes editions/assets, preserves
receipts/withdrawal and supplies saved browse metadata. The original publisher is
an owner-only delegate under the catalog lock. Never reapply 001–004. Bounded
hosted acceptance passed 88 functional checks plus actual browser adoption/tick/
reload and exact cleanup. Adoption now also saves the intended shared Page index
before navigation. General contention and backup/restore remain unverified.


Updated 2026-11-23, Asia/Bangkok. This owns the current/target system map.
[Product](PRODUCT.md) owns direction; [record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md)
owns evidence lifecycles; [writing sync](ACCOUNT_WRITING_SYNC.md) owns its protocol.
Dated implementation history remains [archived](archive/2026-11-11-doc-cleanup/PRODUCTION_ARCHITECTURE.md).

## Current system

| Layer | Implementation and boundary |
| --- | --- |
| Web runtime | Existing Vinext/Cloudflare-compatible and separate Next.js/Vercel build targets. Verify the intended target; passing one does not certify the other. |
| App shell | CircleStateProvider and shared Page/swipe/App-back/button engines. Full-page daily-tool pairs coexist with existing Reflect/chapter contexts. |
| Roots | `/os/home`, `/os` (Today), `/os/mirror` (Reflect) and `/os/explore` share bottom navigation. Home renders Personal Imprint for eligible signed-in accounts. Explore uses three native glass carousels. |
| Account entry | Supabase verified email/password and auth alias, reset-link handling, account scope and retained offline-entry proof. Current setup is invitation-only; public signup belongs to the replacement onboarding target. |
| Main local state | IndexedDB plus localStorage copy, migrations and legacy outbox. Account-separated keys in account mode; circle-os-state-v2 in legacy mode. |
| Account writing | Separate owner-scoped IndexedDB ledger and local queue/cloud state; not copied into CircleState or the legacy server payload. |
| Writing cloud | Private SQL tables and authenticated RPC transport, conflict resolver/status UI; both migrations applied with bounded hosted checks. Automatic product sync flag remains off. |
| Chapter and Log sync pilots | Separate owner-scoped IndexedDB ledgers keep each save with its pending upload. Private Supabase tables use server revisions and exact retry receipts. Accepted records feed the existing CircleState views. Both pilots require explicit test configuration. |
| Legacy server | local-ai/server.mjs and circle-os-ai.ts use external profile/day files, recovery/device attachment and prepared content. Account mode rejects that transport. |
| Prepared Athena | Existing authored editions, memory/source models, chapters and deterministic local observations. No live provider integration is certified. |
| Public quote catalog | Supabase catalog with Admin-managed add/remove and local offline cache; separate from private personal evidence. |

db/schema.ts remains scaffolding; the D1 adapter is not the Supabase lifestyle
database. A hosted account does not imply all lifestyle domains sync.

### Accounts and mode boundaries

Supabase account entry selects separate local stores. Auth aliases remain in
authentication metadata; current header controls are Edit alias and Sign out.
The greeting reads that alias, including offline return. Editing it requires
a connection and failed changes retain the accepted value.

Verified-email entry and browser recovery exist. Hosted settings and developer
reports of sign-in/reset/logout/offline return have dated evidence, but not
complete mail/session/device certification. Offline proof permits retained local
entry only; remote RPC authorization requires a confirmed current Supabase
session. Scope epochs/abort guards reject late responses after account changes.

Development test mode uses isolated synthetic accounts and is rejected in
production; a mode change requires restart. It is not evidence of a real user's
hosted storage. Legacy mode retains its own server/identity behavior.
Never silently assign its records to a signed-in account.

### Account writing

The local engine, compatibility adapter, provider and editors are implemented.
Recovery/drafts, committed entries and immutable revisions are separate.
Older same-account answers can appear as read-only compatibility evidence;
unknown dates stay unknown. No personal import is implied.

Each command captures account, generation/version and retry identity. A save
receipt establishes local acceptance; a fresh store read renders accepted state.
New typing stays a newer buffer. Failed writes retain recoverable text.
Same-tab/BroadcastChannel/storage notifications carry no writing bodies;
foreground refresh is the fallback if background channels are unavailable.
This does not fix the older whole-state store's concurrency protocol.

Local writing deletion scrubs answer/version/draft bodies but retains minimal
question/app-use metadata. Reflect's writing-derived context checks current
owner/source/version dependencies and withholds mixed or unknown dependencies.
That bounded behavior is not a new authorization system for unrelated domains.

Both writing SQL migrations were applied on 2026-11-06. Hosted owner-denial,
conflict resolution and separate-test-store reload/replay checks are recorded.
Product activation remains off. See the exact
[protocol and remaining gates](ACCOUNT_WRITING_SYNC.md), not older pending-migration
statements. No admin-writing reader or service-role evidence transport is added
by those RPCs.

The 2026-11-14 local verification now includes the actual production Note/Deep
Thoughts routes with real service-worker offline opening through two persistent
Chromium process restarts. Saved text/drafts, offline edits/logout, empty accounts
and reconnection without duplicate saved revisions pass. Auth/recovery selection
passes 15/15 with synthetic signed Auth fixtures. The isolated runner keeps the
review build intact. Live sessions and target phones remain separate evidence.
See [offline recovery](USER_JOURNEY_TESTING.md#real-app-offline-writing-recovery--2026-11-14).

### Tool and domain behavior

Published Chapter sync uses `app/os/catalog/chapter-sync/route.ts` and
`app/os/chapters/chapter-sync-store.ts`. Log uses
`app/os/log-sync/route.ts` and `app/os/log-sync-store.ts`.
The Chapter and Log migrations were rehearsed in disposable stacks. Chapter
basic sync also passed in a disposable hosted project that was removed.
Chapter and Log conflict choices have local evidence. Pilot flags are
`NEXT_PUBLIC_CIRCLE_CHAPTER_SYNC` and `NEXT_PUBLIC_CIRCLE_LOG_SYNC`.
The app must run on localhost. Chapter's hosted test mode also requires one
explicit test origin on the server. Live sync activation remains pending.
[Chapter evidence](USER_JOURNEY_TESTING.md#chapter-sync-and-conflict-choices--2026-11-23) ·
[Log evidence](USER_JOURNEY_TESTING.md#log-sync-and-conflict-choices--2026-11-24).

- Goal steps are the same tasks Routine shows. Week groups open goals and filters
  steps by selected day; it does not duplicate task ownership. Goal/task archive
  and completion feed saved History. Day's Record derives from existing Log.
- Log text corrections retain the original day, range and identity with immutable
  before/after words. Unchanged saves write nothing; stale edits are rejected.
  Empty corrections suppress stale resurrection.
- Routine records use saved completion wording/parts, not today's renamed habit.
  Unnamed Habit work stays a draft; later manual edits survive recovery.
- Protocol terms are prospective from next Circle day, with saved dated wording
  and seals. Past phases are read only; prior correction receipts remain.
- Entry after completed Day One is direct. Setup/review/greeting prompts do not
  interrupt it. Genuine unfinished runs preserve their version.
- Chapter answers/history and received reading history are read only; browsing
  never reapplies completion, creates goals/phases or publishes readings.
- Automatic writing Sparks are paused. Note's mixed Line entry is hidden;
  Deep Thoughts keeps its managed Quote. Retained records/content are not removed.
- Declarations version only on deliberate Save declaration. Character is the
  highest wanted-life authority; current visible fronts remain separate from
  planned Character/Six-month layouts.

The [Page standard](../app/os/APP_SESSION_STANDARD.md) owns interaction and
[Design](../DESIGN.md) owns visual contracts. Full-page tool adoption does not
globally migrate compact/chapter surfaces.

## Source map

| Responsibility | Entry points |
| --- | --- |
| State/startup | app/os/circle-os-shell.tsx, app/os/circle-os-store.ts |
| Account scope/entry | app/os/account-scope.js, app/os/auth/ |
| Writing engine/provider | app/os/writing-model.js, writing-store.ts, writing-provider.tsx, writing-pages.tsx |
| Sync protocol | app/os/writing-sync-model.js, writing-cloud-model.js, writing-cloud-sync.js, writing-conflict-model.js |
| Sync runtime/UI | app/os/writing-transport.ts, writing-cloud-runner.tsx, writing-sync-provider.tsx, writing-sync-page.tsx |
| Hosted diagnostic | app/os/sync-check/; durable-checks.ts uses a separate synthetic store |
| SQL | supabase/migrations/202611050001_account_writing.sql and 202611060001_writing_resolution.sql |
| Chapters | app/os/chapters/, scripts/chapter-compiler.mjs |
| Legacy integration | app/os/circle-os-ai.ts, local-ai/server.mjs and local-ai/README.md |

Legacy filenames remain until a reviewed migration. Runtime external files are
not replaced by changing product-document authority.

## Content Admin and shared catalog

The catalog stores mutable item/discovery state and immutable version/image
references. Transactional RPCs snapshot saved drafts and
record exact retry receipts. Signed-in reads separate discovery from exact old
versions. Withdrawal preserves content/assets. Targeted image signing uses the
caller token and Storage policies. Catalog migrations 003 and 004 are applied
and have bounded hosted evidence. Direct Chapter readers resume existing local
runs of the exact edition. For a signed-in reader, Begin saves a new run.
Admin previews keep temporary answers. Reflect's History projection resolves saved runs
against their original editions. Those editions stay readable after a newer
version is published.
[Hosted Chapter verification](USER_JOURNEY_TESTING.md#hosted-catalog-chapter-resume-and-finish--2026-11-23).

[The Admin-first plan](CONTENT_ADMIN_PLAN.md) extends existing authoring with
server-verified developer-account privileges, a shared Supabase Postgres catalog
and Supabase Storage media. Chapters and articles/blogs support images; habit
and Protocol templates create user-personalized copies through existing domain
actions. Shared material stays separate from personal evidence.

The first account-Admin/catalog/media implementation and both foundation/operations
migrations have bounded hosted verification; see [setup and current limits](CONTENT_ADMIN_SETUP.md).
Two content grants exist, with the second invitation awaiting email verification.
Account Workshop saves shared drafts,
uses account/tab recovery, and blocks the legacy publisher and run-reset paths.

Hosted private Storage and shared draft access were verified using synthetic
accounts and built HTTP routes. Explore consumes the published catalog, and
explicit template adoption writes an account-scoped copy to device storage.
Content authoring and operational/device verification remain separate work.

## Target system and constraints

The target is Supabase accounts/private evidence shared across web and future
native clients, with a constrained server evidence service for requested Athena.
Each account owns one profile. Enforce owner checks on server/background paths,
not merely UI filtering. Keep private evidence apart from auth/payment details,
optional public summaries, source revisions and derived memory.

Local writes stay durable until exact server acknowledgement. Existing writing
protocol is one bounded implementation, not a blanket protocol for every domain.
Review schemas, policies, transaction/receipt/retention and migration per domain.
Backups, manual deletion, restore suppression and account/session recovery are
part of the release architecture, not assumed provider guarantees.

### Replacement onboarding and Home

[ONBOARDING_SPEC.md](ONBOARDING_SPEC.md) replaces the old optional Day One action
target. Public signup, chosen name, private birthday, reported experiences,
wanted changes, usual times, one confirmed habit and feeling are distinct data.
Do not mix identity, self-report, intention, behavior or inferred progress.

Reuse current account/local/domain engines. Review new record/revision/history/
deletion/sync contracts, uncertain answers, age eligibility and existing-user
transition before implementation. Preserve immutable old runs, access and records;
never rewrite a published id@version in place.

The signed-in [Personal Imprint](PERSONAL_IMPRINT_HOME.md#signed-in-home-imprint--2026-11-23)
combines saved activity from the owner-scoped writing ledger and Circle state.
Its strand renderer uses attributed Circle days and timing to display growth
and fading. The hosted review is configured for production `main` and the
protected `paing-branch` preview. The latest deployed build still needs journey
verification. Generating a personal form from onboarding and opening tools from
Home remain planned. Feeling stays separate from activity state.

### Athena access boundary

Only a paid explicit request authorizes new interpretation/memory update.
Authenticate, check entitlement/reserve usage, select relevant same-owner saved
history with sources/current corrections, exclude drafts/Trash/deleted/invalid
context and login/payment data, then generate/validate/store the requested result.
A requested result appears when ready; asynchronous mechanism remains unselected.

The model receives selected evidence, never administrator credentials.
Corrections and source deletion invalidate dependent context. Wrong / Has changed /
Forget are confirmed controls with exact semantics still open. Old authored
editions stay immutable; how to qualify them after source correction/deletion
requires review. No-save model calls or background profiling are authorized.

Provider/model, processing facts, quality, cost/latency, quotas, retry and
no-change rules remain integration decisions. Existing prepared content and its
external scheduler are separate; source presence is not operating evidence.

### Membership, privacy and operations

Follow [Product](PRODUCT.md#membership) for fixed-day grants/renewal, expiry,
Myanmar allowance resets and free-core access. Server-side enforcement and
concurrent reservations remain planned.

Target admin has always-available read-only personal-writing access and manual
account deletion on request. Admin-only logs may contain writing; retention/read
auditing remain open. Backups must expire deleted data within 30 days and prevent
restore resurrection. No user export/download is in beta.

Singapore is the chosen database region. Actual project/connection and provider
processing facts need their own evidence. Publish understandable data-use facts;
the accepted lack of another AI opt-in prompt does not verify provider terms.

## Required proof before wider use

Target-device writing recovery beyond the verified local desktop restart/offline
production routes; hosted session expiry/revocation and lost
devices; true database lock contention; regional connections; other-domain sync;
approved legacy owner mapping/import/rollback; backup/restore/deletion/retention;
protected admin/log operations; explicit entitlement/evidence boundaries; target
phone/keyboard/install/update behavior; and actual hosted release journeys.

Use the [roadmap release gates](ROADMAP.md#release-gates) and
[journey record](USER_JOURNEY_TESTING.md). The local actual-route restart/offline
tests qualify the earlier store-only gap, not real hosted sessions, physical
phones, crash recovery or operating-system eviction.

