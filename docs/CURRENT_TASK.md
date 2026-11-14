# Current task

## Durable offline sign-in and crash recovery — 2026-11-14

**Status:** Approved implementation complete for bounded local acceptance. Offline
proof and signed-out state share a strict-durability IndexedDB record. Final
production build/TypeScript, focused lint and diff checks pass. Recovery selection
18/18; controller/proof tests 12/12. Full 360/390px crash journeys pass, including
exact saved writing/drafts, offline edits, clearing, empty composer, completed
logout, account separation and return without duplicate revisions.
[Evidence](USER_JOURNEY_TESTING.md#durable-offline-entry-and-crash-recovery--2026-11-14).

**Scope/Git:** main/6a09b62; earlier work preserved. New offline-auth-store.ts,
Supabase adapter, controller/types, two Auth test files and seven records changed.
No hosted change, sync activation, staging, commit or deployment.

**Next:** Review the local result, then choose a separately reviewed operating
recovery slice (backup/restore or storage eviction). Phone testing stays deferred.
New hosted/device acceptance and broader activation readiness remain open.

## Natural session expiry and writing recovery — 2026-11-14

**Status:** Approved follow-up complete for the bounded automated scope. Real
one-hour offline signed-token expiry, service-worker tab reopening and hosted
renewal pass at 390px. Exact saved entries/revisions and unfinished drafts remain
unchanged. Subsequent renewal/revocation/account switching and exact hosted
cleanup pass. Final hosted test 1/1 (3628 seconds), production build/TypeScript
and focused lint pass. [Evidence](USER_JOURNEY_TESTING.md#natural-session-expiry-and-writing-recovery--2026-11-14).

**Scope/Git:** main/6a09b62; prior work preserved. Verification runner/test and six
records only; no product runtime, hosted settings, migration, deployment, commit
or sync activation changes. Earlier natural-expiry gaps below are now qualified
by this evidence.

**Next:** Phone acceptance is deferred at the developer's explicit request.
Prepare a reviewed operating-recovery slice (crash/eviction or backup/restore)
from the remaining gates; no such implementation is authorized by this record.
Device acceptance and wider activation readiness remain open.

## Hosted account-session recovery — 2026-11-14

**Status:** Approved runner/browser/records slice implemented and bounded hosted
checks pass (1 test, sequential 360/390px journeys). Production build/TypeScript,
focused lint and diff checks pass. Real early renewal, offline return, revocation,
rejected-refresh lock and account restoration preserve exact writing/drafts.
Two temporary hosted accounts deleted; absence confirmed. Natural JWT expiry
remains unverified; no complete session-expiry certification is claimed.

**Git/scope:** main/6a09b62; earlier changes preserved. Two new verification files
and six records only. No product runtime, migration, deployment, commit or writing
sync activation change. [Detailed evidence](USER_JOURNEY_TESTING.md#hosted-account-session-recovery--2026-11-14).

**Next:** Complete the existing phone checklist; review a natural-token-expiry
run separately from the verified early-renewal case. Phone/crash/OS eviction,
operating recovery and other activation gates remain open. Earlier task below
retains the phone checklist context.

## Real-app offline writing recovery — 2026-11-14

**Status:** Approved automated test/runner/records slice complete; real-phone
acceptance pending. Final isolated Next production build/TypeScript and focused
lint pass. Auth/recovery selection passes **15/15**, including new 360/390px
real-app Note/Deep Thoughts journeys through two offline browser restarts.

Service-worker navigation, saved Notes, unfinished answers, offline edits,
offline logout, empty B and restored A all pass. Reconnection preserves exact
saved entries without duplicate revisions. These use synthetic Auth and unrelated
seeded setup/delivery gates; live hosted sessions and onboarding are not certified.
[Commands, attempts and phone checklist](USER_JOURNEY_TESTING.md#real-app-offline-writing-recovery--2026-11-14).

Earlier full Auth selection passed 15/17: unchanged menu assertions expect 650
instead of current 700. Recorded separately, not removed or counted as passes.
No product runtime, shared geometry, migration, hosted data or sync activation
changes. main/6a09b62; prior modified/untracked work preserved; no staging/commit/
deployment. Previous restart/template evidence remains in the journey and handoff.

**Next:** Developer runs the phone checklist and supplies device/browser details
and results. Hosted session expiry/revocation and crash/OS eviction/operating
recovery remain separate reviewed work. Existing template/source/ResizeObserver
gaps remain recorded.
