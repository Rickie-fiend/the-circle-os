# Circle OS user-journey test record

## Durable hosted reload recovery (2026-11-06)

**Approval and setup.** Developer approved the proposed recovery scope before
edits: new `app/os/sync-check/durable-checks.ts`, the existing check client, new
`tests/writing-hosted-recovery.browser.mjs`, and the four evidence documents.
Started on `paing-branch`, HEAD `d841643`, with 20 modified tracked paths and
untracked `debug.log`; preserved all prior work. No stage, commit, push or deploy.
The migration files, product writing store and `.env.local` are unchanged;
`NEXT_PUBLIC_CIRCLE_WRITING_SYNC=disabled` remains explicit.

The development-only page adds start/continue/reload controls below the existing
hosted checks. It stores one synthetic run in the separate account-scoped
`circle-os-writing-hosted-recovery-v1` IndexedDB database via `scopedTransaction`.
Three stored device bundles reuse writing/queue/conflict models and the actual
coordinator/transport. No product writing database is opened. The entry namespace
is `recovery_<24 hex characters>`; checkpoint validation restricts stored upload,
choice, writing, draft and pending-change targets to that entry. Each completed
phase stores `performance.timeOrigin`; continuation requires a different page
time origin, so development hot reload does not count as a full reload. Internal
multi-request steps are journaled for retry; checkpoint and bundle writes commit
through account scope guards. Start makes no network request. Completed reload
inspection makes no request either. The normal sync runner remains disabled.

**Final local commands.** `node` means the installed executable at
`C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`.
Browser commands set `PLAYWRIGHT_BROWSERS_PATH` to
`C:/Users/wickie''/AppData/Local/ms-playwright`; builds prepend the Node directory
to `PATH`. Tests/build ran outside the sandbox after the recorded network failure.

```text
node --test tests/writing-hosted-recovery.browser.mjs
Final 4/4 passed; exit 0 (62.254 seconds while the final build ran concurrently).

node node_modules/eslint/bin/eslint.js app/os/sync-check/durable-checks.ts app/os/sync-check/sync-check-client.tsx tests/writing-hosted-recovery.browser.mjs
Final targeted lint passed; exit 0.

node node_modules/next/dist/bin/next build
Final production build, TypeScript and all 14 static pages passed; exit 0.
```

The isolated browser page renders the actual `SyncCheckClient` with a synthetic
Auth client and intercepts every Supabase RPC into the actual migrated PGlite SQL;
no request reaches hosted Supabase. Other external requests are blocked. Cases:

- At 360px and 390px, start while genuinely browser-offline; save to IndexedDB
  with zero RPCs. Same-document continuation is rejected. Reconnect, fully reload
  at all five checkpoints, recover exact uploads/choices, preserve newer edits,
  recover histories into a fresh durable device, and finish deletion. Complete
  records survive a further reload. A synthetic sentinel in the product-named
  writing database remains unchanged. Server assertions verify one terminal head
  at version 7, two scrubbed resolution rows and five receipts per run. All three
  test bundles and stored replay snapshots contain no synthetic writing afterward.
- Abort an actual HTTP response after SQL accepts an upload, before a checkpoint
  advances. Reload/retry preserves its request ID and server version. Repeat for
  a resolution and verify exactly one archived resolution before continuing.
- Switch accounts while an accepted upload reply is held. The old account cannot
  checkpoint after the scope changes; the new account sees no old run. Each
  account restores its own entry/request on return. A queued IndexedDB read is
  aborted on scope change. All final cases have no page errors.

**Hosted execution.** Used the existing development server at
`http://localhost:3000/os/sync-check` and the two existing confirmed hosted accounts
in normal/private Opera windows. Windows Computer Use performed the page actions;
credentials stayed in their existing sessions. One app/window listing timed out;
a fresh listing succeeded. No password, token or server secret was transferred.
The private-window entry was `recovery_0cec3a3f24e4484aa9d4fe6e`; the normal-window
entry was `recovery_30ecc1ed34f74c5c8ea12944`. Each account used its own entry.

For **each** account, observed the six stored PASS lines and full page reloads:

1. Synthetic writing and one pending upload committed locally without a request.
2. Reload retained that upload. Hosted acceptance was received, deliberately
   omitted from local acknowledgement, and `upload-reply-lost` was committed.
3. Reload retained the request. A newer local save survived exact receipt recovery
   without a duplicate. Competing device/cloud copies and a choice were persisted.
4. Reload retained the identical choice. The hosted resolution was accepted and
   its reply deliberately omitted locally; `choice-reply-lost` was persisted.
5. Reload retained the choice for exact retry. A newer local edit stayed pending
   as a conflict; original histories remained unchanged. A fresh durable fixture
   recovered histories. The cloud copy was chosen, then permanent deletion queued.
6. Reload retained the deletion. Hosted deletion completed; old upload/choice
   replays could not change the terminal head. All three stored test devices and
   replay request bodies were scrubbed. `complete` survived another full reload;
   Check saved completion returned without an error in both windows.

The hosted loss simulation deliberately drops acknowledgement **after** a real
HTTP result returns; the separate local cases above also abort the HTTP response.
Hosted offline page loading and physical-device restart were not tested.

A final **read-only** SQL audit on the approved project returned four true rows:
two terminal heads across two owners at server version 7, four resolution rows
with null request/result bodies, ten body-free receipts across those owners, and
no non-null conflict candidate for the two recovery IDs. Synthetic text is deleted;
Auth accounts, tombstones/receipts and body-free local completion metadata remain.
No schema/configuration or personal record changes were needed.

**Attempts and correction.** The sandboxed browser suite failed all four cases
at loopback navigation with `ERR_NETWORK_ACCESS_DENIED`; the approved outside-
sandbox run reached the fixture. Its first three deletion assertions then failed
because the new harness incorrectly required an already-accepted upload replay to
return `deleted`. Inspection of the unchanged SQL showed exact accepted uploads
return their immutable body-free receipts before the tombstone branch. Corrected
the harness to accept exact receipt replay only when the terminal head remains
identical; old resolution replay must still return `deleted`. This was a harness
expectation error, not evidence of resurrection or a product/SQL fix. The corrected
four-case run passed, then passed again after adding stored-target validation.
Final lint/build and both hosted runs use that final code. No measured performance
problem justified optimization. Repeat runs overlap; do not add their counts.

**Limits and next gate.** This proves the shared transaction/models/coordinator
with a **separate synthetic IndexedDB adapter** and actual hosted page reloads.
It does not certify the product writing-store adapter, physical phone, cold browser
restart, private-window closure, eviction recovery or offline page load. Account
switching/late response here is local fixture proof; the preceding hosted slice
retains its real reciprocal-account access evidence. Hosted unconfirmed/expired/
revoked valid sessions, true multi-connection lock contention, backup/restore and
maximum deleted-backup retention remain open. No geometry/type/gap or Circle-day
rule changed or needed new measurement; prior date/ResizeObserver and broader
beta gaps remain. Next: separately review the hosted-session test scope. Real sync
stays disabled; activation and deployment remain separate.

## Follow-up migration and hosted resolution checks (2026-11-06)

**Scope and setup.** Developer explicitly approved applying the reviewed follow-up,
extending `app/os/sync-check/` and `tests/writing-hosted-harness.test.mjs`, and
updating the writing contract, current task, handoff and this record. Branch
`paing-branch`, HEAD `d841643`; all 15 pre-existing modified tracked paths and
untracked `debug.log` preserved. No stage, commit, push or public deployment.
The original migration and `.env.local` are unchanged; the latter still has
`NEXT_PUBLIC_CIRCLE_WRITING_SYNC=disabled`.

**Hosted migration.** Used the existing authenticated Opera Supabase SQL Editor
for `gcqmblrkpfvjnewzdycj`. A read-only preflight returned false for the resolution
table, both RPCs and deletion trigger. Applied only
`supabase/migrations/202611060001_writing_resolution.sql`, SHA-256
`60b823dcc45f8ca5ff3623913272501e8dba6886178111600e4c410ec6e929e2`.
Supabase reported `Success. No rows returned`. Seven subsequent catalog checks
all returned true: all three function bodies match the file after CR normalization;
table RLS and select-only authenticated access; owner-select policy; authenticated-
only RPC grants/fixed definer search paths; deletion trigger; inaccessible scrub
helper; initially empty resolution archive. Application used SQL Editor; no CLI
migration-history registration was performed. Neither migration should be reapplied.

**Hosted account execution.** Served the local development harness at
`http://localhost:3000/os/sync-check` using the ignored existing Supabase settings
and two existing confirmed hosted accounts, normal and private Opera windows.
Credentials stayed in their existing sessions; no token/password/secret was
copied into the chat, fixtures, browser fields or repository. The server-only
service-role probe uses its existing environment secret and returns sanitized
status only. Synthetic bundles and simulated devices stay in memory, outside the
person's IndexedDB ledger. Cross-window witnesses contain IDs and versions only.

Both accounts completed their runs, with the second using the first account's
witness and the same synthetic IDs. Observed passes:

- Own writing/inventory and exact receipt retry/recovery; changed operation reuse
  rejected; accepted upload response loss recovers before a newer local save.
- Competing saved copies remain intact and pause that entry. A cloud edit after
  review makes the old choice return `changed` and requires a fresh review.
- Local choice retains both original histories. Its accepted response is deliberately
  lost; a cloned bundle simulates reload, then a newer edit is saved. Recovery
  retains the newer edit and pending conflict. Exact resolution retry returns the
  same result; changed reuse of that request ID is rejected.
- Cloud choice settles the reviewed copy. A fresh in-memory device recovers the
  retained original histories through the real hosted history RPC.
- Trash/restore and permanent deletion work; stale uploads and old resolution
  requests return the deleted result, never restore text. Deleted archives disappear
  from owner history; the competing local fixture is scrubbed.
- Anonymous and invalid-JWT requests are rejected by all five RPCs. Both server
  service-role probes pass with actual HTTP permission denial; unlike the older
  run, the local server probe did not encounter a network failure.
- Account B cannot see A's head, exact receipts or still-live synthetic archive.
  B uses the same entry IDs independently and cannot resolve a foreign-owner choice.
  B's IDs-only witness is copied back to A; reciprocal rechecks reject peer access,
  verify each original tombstone/receipts/live archive remains unchanged, then
  delete each remaining archive and verify old-choice replay stays deleted.

Both final rechecks showed their two PASS lines. A final read-only SQL audit for
`hosted_c228416e8af14e08822dacd5` and its `_archive` entry returned four true rows:
four isolated terminal heads across two owners (main server version 11, archive
version 5); six resolution rows with null request/result bodies; two conflict
candidates with null bodies; 26 body-free receipts. Synthetic bodies are deleted.
Those minimal records and the two Auth accounts remain. No owner writing or
legacy profile-server records were read, edited, imported or cleared by the harness.

**Local verification.** `node` below is the installed executable at
`C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`.
Build/dev commands prepend that directory to `PATH` for child CSS workers.

```text
node --test tests/writing-resolution.test.mjs tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-hosted-harness.test.mjs
36/36 passed; exit 0.

node --test tests/writing-hosted-harness.test.mjs
Final reciprocal-isolation refinement: 3/3 passed; exit 0.

node node_modules/eslint/bin/eslint.js app/os/sync-check/hosted-checks.js app/os/sync-check/sync-check-client.tsx app/os/sync-check/service-role/route.ts tests/writing-hosted-harness.test.mjs
Final targeted lint passed; exit 0.

node node_modules/next/dist/bin/next build
Final production build, TypeScript and all 14 static pages passed; exit 0.
```

These selections overlap; their counts must not be added as unique tests.
The SQL-backed harness regression checks both same-ID accounts while live archives
exist, reciprocal rechecks, repeatable cleanup, six scrubbed resolution rows and
no readable histories afterward. Hosted runs exercised the final recheck logic
after development hot reload, retaining both in-memory witnesses.

**Attempts and limits.** Opera connector was unavailable; Windows Computer Use
was used. Earlier turns stopped when the tool could not establish the browser
URL; no migration occurred then. Browser input interruptions required fresh
observations. The first SQL application failed with `25006`: the editor value
setter inserted the migration into the read-only audit buffer rather than replacing
the whole buffer. No schema change occurred in that failed transaction. Explicit
editor Select All/replacement removed the audit text; standalone migration then
succeeded and installed-function hashes matched. An initial harness-test assertion
expected four conflict rows; only two are persisted (the archive-device conflicts
are detected during inventory before upload). Corrected the test expectation and
reran successfully; no application or SQL fix was needed. Sandboxed dev bind failed
with `EACCES`; sandboxed build CSS-worker connection failed. Approved outside-
sandbox dev/build runs succeeded. The dev server remains running on port 3000.

No product geometry/type/gap, persistence protocol, chapter content or AI behavior
changed. Local-first/newer-edit preservation, account boundaries, immutable
histories, terminal deletion and original Circle attribution use the existing
engines; no new geometry measurement or performance optimization was warranted.
Hosted unconfirmed/expired/revoked valid sessions, actual-device/IndexedDB reload,
true multi-connection lock contention, backups/retention and wider beta readiness
remain unverified. The hosted reload/new-device checks above are memory fixtures,
not durable device-store evidence. Earlier Week-date/ResizeObserver, physical-phone,
other-browser and broader checks remain open. Real sync stays disabled; activation
requires a separate review after outstanding gates. Earlier product/architecture/
roadmap statements that this follow-up was unapplied predate this evidence; the
current writing contract and task record this bounded result without changing
their wider requirements.

## This note label clarification (2026-11-06)

Developer clarified the reported unchanged note involved New Note, a separate
entry. Live synthetic-demo reproduction through the actual editor on the same
note updated Saved copies and ledger text correctly, with no page errors.
Approved label rename: Current note → This note, including its history lookup.

`node --test --test-name-pattern="mobile conflict" tests/writing-cloud.browser.mjs`
passed 2/2 at 360/390px using the installed Node/Playwright setup below. These
cases open This note history after later saves/reload and retain archived words.
`node node_modules/next/dist/bin/next build` passed including TypeScript and
14 static pages. Local review server rebuilt/restarted; no public deployment,
hosted SQL/configuration, activation, data or geometry changes. Prior gaps remain.

## Latest saved Note and shared scrollbar hiding (2026-11-06)

Approved UI scope: current saved Note first in Saved copies, unchanged retained
snapshots, hidden scrollbar chrome in Note/History/Trash, and normal review-server
rebuild/restart. Existing installed Node/Playwright paths and isolated fixtures
remain those recorded below. Exact commands from the repository root:

```text
node --test tests/writing-cloud.browser.mjs
15/15 passed.
node --test --test-name-pattern="Note, History and Trash stay bounded|shared App Box geometry|History bins move only" tests/writing.browser.mjs
5/5 passed; run after the cloud suite to avoid overlapping Vite fixtures.
node node_modules/eslint/bin/eslint.js app/os/writing-sync-page.tsx tests/writing-cloud.browser.mjs tests/writing.browser.mjs
Passed without warnings.
node node_modules/next/dist/bin/next build
Passed including TypeScript and 14 static pages.
```

Cloud cases now resolve a conflict, save newer words, reload, open Saved copies,
verify Current note and its latest historical version show those words, and
verify the original cloud history still contains its original two versions.
Normal Note return shows the latest words. Other account/conflict/deletion/retry
checks remain passing. No schema or upload behavior changed.

Full-component tests at 390x844 and 360x667 inspect `scrollbar-width: none` in
Note/History/Trash, while verifying actual long-content scrolling, touch/wheel,
keyboard caret, single Body scrolling, visible Footer, resize and restore/delete.
History creates two distinct notes, retains the newer entry through reload and
restores only the selected trashed note. Four resting frames remain 346px,
Page heights 344px and header gaps 48px at 360/390px. Long writing/Trash reaches
480px at 390x844 and 400.1875px at 360x667 without adding inner scroll panels.
Inspected `outputs/note-bounded-history-390.png`; writing/Trash captures generated.

The identified previous Next review process (PID 12720) was stopped, and the
verified production build restarted on port 3000. Read-only GET `/os` returned
200 with 12498 response bytes. This is local preview, not public deployment,
hosted login or physical-device verification. Browser/build/server commands used
approved outside-sandbox local networking. No remote SQL/configuration, sync
activation or personal import occurred. Previous beta/backup/device gaps remain.

## Conditional Sync controls (2026-11-06)

Approved UI-only scope: rename Writing sync to Sync, hide it without pending
saved work/conflicts/recoverable error, and show Try again only after an error.
Hide retry while recovering. Retained archives move to Saved copies on the
owning Note History row, independently of Sync visibility; row opening still
edits. Existing uncommitted comparison changes remain intact.

Commands use installed Node v24.22.1 and the installed Playwright cache, with
the same isolated local PostgreSQL/Auth/HTTP/IndexedDB fixtures as below:

```text
node --test tests/writing-cloud.browser.mjs
14/14 passed.
node --test --test-name-pattern="Sync is absent" tests/writing-cloud.browser.mjs
The additional visibility case passed (1/1).
node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx app/os/writing-sync-page.tsx app/os/writing-sync-provider.tsx tests/writing-cloud.browser.mjs
Passed.
node node_modules/next/dist/bin/next build
Passed including TypeScript and all 14 static pages.
```

At 360/390px, conflict review has no idle retry button; both choices still work.
After completion, Sync disappears from Note History. Saved copies still opens
the retained copies and their dated histories, and normal Note return shows the
selected text. A failed choice exposes Try again, clicking it removes the retry
presentation and persisted work recovers across reload. Separate real-store
checks prove empty and unsent-draft-only states do not expose Sync; a saved
change while offline exposes it; reconnect drains the queue and hides it again.
Cloud-off has no Sync/retry action. Existing transport/lifecycle/long-scroll/
deletion checks also passed in the full selection.

No geometry/type/gap tokens changed; no new measurements claimed. No new SQL,
environment configuration, activation, import or deployment. Browser/build
commands ran outside the sandbox for local networking. Hosted/device/backup and
broader beta gaps remain open. No measured issue justified optimization.

## Minimal writing comparison (2026-11-06)

Approved UI-only refinement: Note typography and default CreativeButton design;
Cloud above Device; Use Cloud above Use Device; no large comparison heading,
instruction paragraph, dates, inline Saved history or persistent success message.
Copy-tap opens dated read-only history; confirmed choice returns silently to the
list. Pending/error/retry and stale-review checks remain. Deletion while history
is open hides captured versions. No sync protocol, SQL or activation changes.

Using installed Node v24.22.1 and the installed Playwright cache (paths/fixture
isolation detailed in the preceding writing-sync entry), final checks were:

```text
node --test tests/writing-cloud.browser.mjs
13/13 passed before the final deletion-history guard.
node --test --test-name-pattern="mobile conflict|review detects|long comparison" tests/writing-cloud.browser.mjs
4/4 final affected cases passed; includes the new long-scrolling/deletion case.
node --test --test-name-pattern="shared App Box geometry" tests/writing.browser.mjs
2/2 passed on isolated rerun.
node node_modules/eslint/bin/eslint.js app/os/writing-sync-page.tsx tests/writing-cloud.browser.mjs
Passed without warnings.
node node_modules/next/dist/bin/next build
Final build including TypeScript and all 14 static pages passed.
```

Actual component tests at 360/390px verify both choices, copy/history/Back, silent
return, reopening retained histories, selected Note text on return, 44px choice
targets, vertical Cloud/Device button order, no horizontal overflow, and hidden
scrollbar style with actual long-content scrollTop movement. Offline choices stay
disabled; failed responses remain recoverable across reload. A deleted history
stops rendering its versions. Default Note remains silent and separate.

All four resting frames remain 346px, Page heights 344px, header gaps 48px;
visible gaps are 52px for Note/Thoughts and 51.09375px for Habit/Protocol. Long
Note retains its existing bounded Body behavior. Inspected
`outputs/writing-conflict-360.png`; 390px capture also generated.

Initial test syntax and ref-lint errors were fixed. The first concurrent geometry
run timed out waiting for fixture initialization at both widths; overlapping
Vite/HMR activity was observed. It measured no geometry and its exact cause was
not isolated. The unchanged run alone passed both widths. Browser and build
commands ran outside the sandbox for local networking as in previous slices.
No performance issue justified optimization. No hosted migration/activation,
physical-device or backup/retention verification is claimed; earlier gates stay.

Live isolated demo smoke at 390px with normal animations also passed: comparison,
Use Cloud and silent return to the synced list, with no page errors. An initial
smoke timed out after Reset sample navigation; a fresh-page run with settled
navigation passed. This demo uses synthetic local data, not hosted Supabase.

## Writing sync status and conflict resolution (2026-11-06)

**Scope and setup.** Approved repository implementation only. Used the installed
Node at `C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`.
The SQL fixture applies the unchanged original migration and the new
`202611060001_writing_resolution.sql` in isolated PGlite PostgreSQL with synthetic
Auth claims. Browser checks use actual writing provider/pages, IndexedDB,
authenticated transport and a local HTTP RPC fixture backed by that database.
No hosted credentials, personal writing, legacy profile-server writes or model
calls are part of these tests. Browser requests outside the fixture origin are
blocked. Test tokens/accounts are synthetic; this is not hosted JWT evidence.

**Final commands and results.** Commands run from the repository root. `node`
below means the installed executable above; PowerShell uses `&` and the quoted
absolute path. Browser runs set `PLAYWRIGHT_BROWSERS_PATH` to
`C:/Users/wickie''/AppData/Local/ms-playwright`. Build runs prepend the installed
Node directory to `PATH` so CSS-worker subprocesses use the same executable.

```text
node --test tests/writing-resolution.test.mjs tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-model.test.mjs tests/writing-sync.test.mjs tests/writing-compatibility.test.mjs
100/100 passed; exit 0.

node --test tests/writing-cloud.browser.mjs
13/13 passed; exit 0 after editor-return/shared-transition corrections.

node --test --test-name-pattern="writing sync view|mobile conflict|review detects" tests/writing-cloud.browser.mjs
Final 5/5 affected cases passed; exit 0 after conflict-reply validation tightening.

node --test --test-name-pattern="shared App Box geometry" tests/writing.browser.mjs
2/2 passed; exit 0.

node node_modules/next/dist/bin/next build
Final production build, TypeScript, all 14 static pages and route collection passed; exit 0.

node node_modules/eslint/bin/eslint.js app/os/writing-conflict-model.js app/os/writing-cloud-model.js app/os/writing-cloud-runner.tsx app/os/writing-cloud-sync.js app/os/writing-pages.tsx app/os/writing-provider.tsx app/os/writing-sync-provider.tsx app/os/writing-sync-page.tsx app/os/writing-store.ts app/os/writing-transport.ts tests/writing-resolution.test.mjs tests/writing-cloud.browser.mjs tests/writing-transport.test.mjs tests/helpers/writing-cloud.mjs
Passed without warnings; exit 0.
```

Documentation audit of added links passed: 14 local links, including 13 heading
fragments. `git diff --check` passed with the existing LF/CRLF notices.

**Observed behavior.** At 360x844 and 390x844 (Bangkok timezone, reduced motion),
History → Writing sync shows cloud-off/device-only states without putting status
back into the Note editor. Separate synthetic devices produce competing saved
copies; the screen shows both labels/text/dates, and both choice directions work.
Choice targets measure at least 44px; no horizontal page overflow. Histories can
be reopened after resolution, and the clean Note editor shows the chosen text.
Changes during review require updated review. Offline choices are disabled.
An accepted resolution with its HTTP response deliberately aborted stays locally
queued, survives reload, retries exactly once and leaves one server resolution.
The original browser transport cases also pass: normal/offline save/reload,
clearing/Trash/restore/deletion, failed acknowledgement storage, late old-account
responses, newer in-flight edits, conflicts and the enabled runner.

Focused SQL/model evidence checks immutable cloud-prefix versions and untouched
branch histories, exact retry/changed-request denial, owner-only archives and
denied anonymous/missing-identity/service-role resolution/history access. A new
device recovers both histories. Newer local work after lost replies remains a
conflict; stale server choices do not overwrite newer heads. Terminal deletion
scrubs server request/result bodies and local archived copies; replay cannot
restore writing. All four writing kinds preserve Unicode, original source and
the original Circle attribution across a choice made on a later day.

**Measurements and artifacts.** At both phone widths, Note/Thoughts/Habit/
Protocol outer frames are **346px**, Page heights **344px**, header gaps **48px**.
Visible text gaps are 52px for Note/Thoughts and 51.09375px for Habit/Protocol.
No resting inner scroll; short Note rests at the shared size, and long Note
grows within the existing 480px cap with only Body scrolling. Conflict screenshots:
`outputs/writing-conflict-360.png` and `outputs/writing-conflict-390.png`; inspected
the 360px image. It shows the first copy and fixed choice Footer; Body scrolling
reveals the second copy/history within the approved writing ceiling.

**Attempts, limits and next step.** An initial deletion assertion found an archive
left in the local-tombstone receive path; fixed and rerun. Code review found a
clean Note buffer retaining old text after a choice; fixed and browser-verified.
Initial `node` resolved to an unavailable version launcher; used installed Node.
The sandbox's altered browser path was corrected to the installed browser cache;
Chromium then hit `ERR_NETWORK_ACCESS_DENIED` on loopback. Production builds first
failed through the Node launcher and then a sandboxed CSS-worker connection.
Approved outside-sandbox browser/build runs passed. These attempts do not certify
or disprove hosted behavior. Final affected counts overlap the full selections;
do not add them as unique coverage. No performance issue justified optimization.

The new SQL file is **not applied remotely**. No environment change, activation,
personal import, deployment, physical-phone/Opera acceptance, real hosted device
recovery, true multi-connection lock contention or backup/retention proof.
Existing Week model date expectation, ResizeObserver and wider beta gaps remain.
Next is developer UI review and separately reviewed follow-up migration/hosted
checks under [the current contract](ACCOUNT_WRITING_SYNC.md#writing-status-and-conflict-resolution---2026-11-06).

## Account header and alias greeting (2026-11-06)

Font correction: Chromium's `CSS.getPlatformFontsForNode` confirmed the prior
menu already used custom Geist. Actions used regular weight; they now use the
existing **650** control weight, with an explicit brand-family binding. The
test checks the actual platform font (Geist, custom) and computed 650 weight.
All **3 affected browser cases**, **2 geometry cases** and targeted test lint
passed after this change. Menu now measures **100.89px** at both phone widths,
still with **24px left/right** and **44px** actions. Inspected the updated 360px
capture. No new full production build for this CSS correction; previous build
results remain dated to the earlier implementation. The measurements below
describe prior refinements where they differ.

Latest spacing correction: fit the action menu to its labels rather than a
fixed 192px. At 360px and 390px it measures **97.25px**, with **24px left and
24px right** around the longest label and **44px** action heights. Only the
alias editing form retains 192px. The three affected alias/browser cases passed
again using the `account header|edited alias` selection; targeted lint passed.
Inspected the new 360px capture. The first geometry run passed both resting-frame
measurements but failed the immediate long-Note growth assertion at 390px;
timing is an inference. An unchanged rerun passed **2/2**, including growth,
with the same 346px frames/48px gaps. No product or test fix was made for that
intermittent assertion. No new full Next build was run for this spacing-only
correction; previous build evidence remains dated to the prior refinement.

Follow-up requested by the developer: the account trigger now shows three dots
instead of the alias, and the menu is **192px** wide rather than 288px. The full
alias remains in the greeting. Reverified with
`node --test --test-reporter=spec --test-name-pattern="account header|edited alias|invite link is scrubbed" tests/supabase-auth.browser.mjs`:
**4/4 passed**, including the measured menu width at both phone widths and the
44px target. Geometry cases passed **2/2** again with the same measurements
below. Targeted lint and a new Next production build including types passed.
Inspected the updated 360px menu capture. This supersedes the initial alias-on-
button description below; other behavior and limitations remain.

Developer approved the reviewed header/account-menu and missing-alias fix and
explicitly removed the header Saved status. Started with a clean tree on
`paing-branch`, HEAD `df2b397`. No staging, commit, push, deployment, hosted
configuration or personal-data change by this slice.

### Behavior and verification setup

The existing header now contains the alias button, opening Edit alias and Sign
out. The separate signed-in account bar and header Saved/Waiting to sync/Synced
status are removed. A context supplies verified, account-scoped display identity
and reuses the current auth controller/adapter for alias changes. The greeting
reads this alias instead of the account's empty legacy profile-name field. No
alias is copied into personal records; legacy mode retains its old name source.
Changing accounts unmounts the old menu. Full-screen chapter dialogs expose an
account control while the covered header control is hidden, preserving logout
during first onboarding. Long aliases fit the button and wrap in the greeting.

The existing auth browser harness now includes the actual OSFrame and an
optional actual Today shell. Tests run the real Supabase JS client, auth
controller, offline proof, account storage and UI against synthetic Auth
responses/signed tokens. Accounts A and B use different aliases. Chromium uses
Bangkok time and 360x844/390x844 mobile viewports. No real hosted identities,
credentials or personal evidence are used.

### Checks

- `node --test --test-reporter=spec tests/supabase-auth.test.mjs tests/account-scope.test.mjs`:
  **18/18 passed**.
- `node --test --test-reporter=spec tests/supabase-auth.browser.mjs`:
  **13 passed, 2 optional production-origin cases skipped**. Covers account
  alias in header/greeting, 44px targets within the header, keyboard open/Escape
  and restored focus, outside dismissal, cancelled/Unicode/40-character alias
  edits, unchanged profile name, reload, A/B/A isolation, closed menus on account
  change, onboarding logout access, offline alias return and rejected offline
  edit. Existing login/recovery/revocation/offline record checks also passed.
- After the long-alias wrapping fix,
  `node --test --test-reporter=spec --test-name-pattern="account header|edited alias" tests/supabase-auth.browser.mjs`:
  **3/3 passed**. Includes a direct scroll-width assertion against clipped
  greeting text. Inspected `work/account-menu-360.png` before and after the fix.
- `node --test --test-reporter=spec --test-name-pattern="shared App Box geometry" tests/writing.browser.mjs`:
  **2/2 passed**, repeated after the wrap fix. Note, Thoughts, Habit and Protocol
  each rest at **346px**, rendered page **344px**, shared header gap **48px** at
  both widths, no inner scroller. Visible glyph gaps remain **52px** for writing
  and **51.09px** for Habit/Protocol. Short Note stays at rest; long Note grows
  within its existing bound and scrolls only its body.
- Targeted ESLint passed for both new account modules, auth boundary, shell
  and auth browser test. Final
  `node node_modules/next/dist/bin/next build` passed including TypeScript after
  the wrap fix. Final `git diff --check` passed with existing LF/CRLF notices;
  29 current-section local links/fragments passed.

### Attempts and limits

The first test-harness build found a missing parenthesis in new test wiring;
the harness root was rewritten as JSX. Initial inspection then exposed a
40-character alias clipped by the heading's existing sizing. Added local
greeting wrapping/min-width rules and reran affected browser/geometry checks
plus lint/build. No App Box type scale, spacing token or default size changed.
No measured performance issue justified further optimization.

The static harness emits unresolved-at-build asset-path and large-chunk notices;
these are test-build notices, not a new product build failure. Optional tests
requiring `CIRCLE_AUTH_PRODUCTION_ORIGIN` were skipped; the Next build is separate
evidence. Actual hosted alias edits, physical phones, Opera and desktop layouts
remain unverified. Existing Week date-test/ResizeObserver and broader beta
gaps are not closed. Saving/queue/error behavior, account boundaries, 06:00 day,
sync activation and hosted data are unchanged by this UI slice.

## Direct entry after Day One (2026-11-06)

Developer approved removing automatic entry prompts after Day One, retaining
explicit setup/review controls, focused tests and related records. Branch
`paing-branch`, HEAD `ccdbe77`; existing tracked and untracked work is preserved.
No staging, commit, migration, personal-data change or deployment by this slice.

### Behavior and setup

The automatic door offers only unfinished Day One. Any completed version is
enough for direct entry; a newer version remains selectable manually. Week/Log
setup, weekly review and daily greeting no longer interrupt entry. Explicit
setup/review Quest pins use existing domain players/handlers so manual Week
completion still creates its goal, step and phase. Other Quest chapters keep
their existing player. Saved chapters, answers and access gates are retained.

Mobile checks use the actual shell, providers, players, CSS and IndexedDB in
the existing Vite harness, isolated synthetic account scopes, Chromium at
360x844 and 390x844, Bangkok time and blocked external requests. This is not a
hosted Supabase login, Opera or physical-phone certification. Fixed browser
times cover Friday 2026-11-06 at noon, Sunday 2026-11-08 at 21:00 and Monday
2026-11-09 at noon. Reload and simulated scope logout/re-entry preserve the
saved chapter snapshot and show no splash. Both widths cover older Day One
completion, chosen Week setup, unfinished Day One and the manual Sunday review
button. At 360px, Week setup is fully answered through Quest entry; its goal,
task and Protocol phase survive reload without another entry sheet. Opening a
review alone creates no completed weekly review. Inspected the 360px quiet
entry capture under `outputs/quiet-entry-360.png`.

### Checks and limits

`node --test --test-reporter=spec tests/day-door.test.mjs tests/week-review.test.mjs tests/day-one-simplification.test.mjs tests/phases.test.mjs tests/chapter-splash.test.mjs tests/account-scope.test.mjs`
passed **46/46**. Targeted ESLint passed for `circle-os-shell.tsx`, `day-door.js`,
`day-door.test.mjs`, `week-setup.test.mjs`, `writing.browser.mjs` and
`day-one.browser.mjs`. Final `node node_modules/next/dist/bin/next build` passed
including TypeScript after the manual-route change.
Final `git diff --check` passed with existing LF/CRLF notices; the current-section
document audit checked 29 local links/fragments successfully.

Browser command:
`node --test --test-reporter=spec --test-name-pattern="^Entry" tests/writing.browser.mjs`.
Final result: **8/8 passed**, including clean teardown and process exit 0.
An initial startup attempt exceeded the first test's deadline and was
interrupted; the next run passed seven cases and failed the old generic-player
selector after the chosen setup route was changed. The selector was corrected
and the final run also added full Week completion and account-scope return.

Baseline selection passed 25/29 before edits. Three stale source assertions
were updated for affected entry behavior. The unrelated Week setup model test
still fails with actual `2027-05` versus expected `2027-03`;
`node --test --test-reporter=spec tests/week-setup.test.mjs` passes 2/3. The
existing ResizeObserver notification loop was observed during manual Sunday
review and remains unresolved; the harness counts these separately from page
errors. No new runtime page errors or external backend requests were observed.
The adapted production-server `day-one.browser.mjs` suite was not run in this
slice; the actual-component tests above provide this slice's browser evidence.

The original midweek prompt's exact trigger was not reproduced. Removal is an
approved product change, not proof of a repaired calendar bug. No geometry,
type or gap code changed; no geometry measurement or performance optimization
is claimed. Hosted/device checks, Habit/setup sync, writing activation,
conflict/status UI, backup/retention and wider beta gates remain separate work.

## Hosted account writing checks (2026-11-06)

### Authorization and setup

Developer approved the previously reviewed migration, followed by the concrete
development-only harness, hosted synthetic records/deletion checks and records
updates. Project `gcqmblrkpfvjnewzdycj` / CircleOS Server / production / Singapore,
PostgreSQL 17.11.0.011. Branch `paing-branch`, HEAD `ccdbe77`; all prior work
preserved. SQL Editor execution reported Success. No rows returned. The saved
migration matched the repo after CRLF normalization/trim, SHA-256
`28f44e9c4ee054d3ac097748ebfbb3a39bf9e0f1650413626b0dea23d428cec4`.
The dashboard migration history was empty before application; SQL Editor does
not register the file as a CLI migration. Do not rerun CREATE statements blindly.

Before application: no `circle_private`, only public `circle_quotes` with four
columns and its anon/authenticated reading policy, and `rls_auto_enable` in
public functions. Data API enabled, exposed schemas `public`/`graphql_public`,
automatic new-table exposure off. No exposure settings changed.

After application, eight catalog checks returned true: three private tables
with RLS; three authenticated owner SELECT policies; authenticated SELECT-only
table grants; no anon/service-role table privileges; three authenticated-only
definer RPCs with empty search paths; seven helpers without client EXECUTE;
three cascading Auth references; initially empty writing tables.

### Hosted execution and results

`http://localhost:3000/os/sync-check` uses the existing Supabase context,
captured-token transport and sync coordinator. It requires local development,
the exact target and sync off. It keeps synthetic bundles in memory and never
opens the person's writing ledger. Two confirmed disposable sessions: normal
Opera and private Opera. The normal run and final recheck were observed by
Codex; private-window controls did not target reliably, so the developer copied
the witness, ran account B and reported the PASS/STOP lines. No passwords or
tokens were read into chat, logs, fixtures or evidence.

Both accounts passed:

- Anonymous and invalid-JWT calls denied for inventory, receipts and apply.
- Own save/inventory, identical retry receipts and exact receipt recovery.
- Changed request content rejected under an already accepted operation ID.
- Simulated accepted-response loss followed by a newer local edit: receipt
  recovery precedes the newer upload; three saved versions and no pending work.
- Two in-memory devices' saved edits: server conflict response, both copies
  retained by the coordinator, one conflict and one paused pending operation.
- Trash, restore, Trash and terminal deletion; stale upload returns deleted;
  the other simulated device removes its saved text and pending stale edit.

Account B additionally verified that A's exact operation IDs returned no receipts
and its head was absent, then independently used the same entry ID. A's final
recheck verified its original server version, tombstone and all receipts remained
unchanged. Synthetic entry ID: `hosted_ac60da4b88b247cd9f339d87`.

Both pages stopped at the separate local-server service-role probe. A localhost
diagnostic returned 502 with `networkError: true`; it did not reach a valid
permission result. The route's catch covers fetch and response parsing, so the
exact connection/response failure cause is not independently established.
The developer approved a direct server-side probe using
the existing `.env.local` key only in memory. Node `process.loadEnvFile`, exact
project assertion and POST requests with `{after_id:"",page_size:1}`,
`{operation_ids:[]}` and `{request:{}}` returned, respectively:

```text
inventory: HTTP 403, code 42501
receipts:  HTTP 403, code 42501
apply:     HTTP 403, code 42501
```

The probe asserts HTTP 401/403 plus exact `42501`, so a network failure or invalid
key response cannot count as success. Secrets/error prose were not printed.
This direct result is separate from the page's STOP, which remains a local
server probe limitation. A read-only SQL query restricted to the exact
synthetic entry returned three true checks: two owner-isolated terminal heads
at server version 8, two conflict candidates set to SQL NULL and 16 exact
receipts across both owners. No active synthetic writing remains. Minimal
tombstones, receipts, scrubbed conflict metadata and test accounts remain.

### Local verification, attempts and limits

Using installed Node `C:/Users/wickie''/AppData/Local/Author Software/nvm/installs/v24.22.1/node.exe`:

```powershell
node --test tests/writing-hosted-harness.test.mjs tests/writing-transport.test.mjs
node node_modules/eslint/bin/eslint.js app/os/sync-check tests/writing-hosted-harness.test.mjs
```

Final 11/11 tests passed: three harness/probe checks plus eight transport checks.
Harness tests execute actual PGlite SQL and the real coordinator, verify both
owners, scrubbed conflicts, retained receipts and reject malformed witnesses.
Probe checks reject production/cross-origin requests and distinguish real
permission denial from invalid credentials and network failure. Targeted lint
passed after the diagnostic change. The first harness run had an incorrect
expected result-line count (13 versus 11); fixed and rerun successfully.

Ordinary `tsc --noEmit --incremental false` failed in existing generated
`.next/dev/types/routes.d.ts` and `validator.ts` syntax. Source checking with
the broad config also hit existing `db/index.ts` / `cloudflare:workers` typing.
Final source type check passed using TypeScript's `readConfigFile` and
`parseJsonConfigFileContent` for `tsconfig.vercel.json`, filtering `.next/`
generated paths, then `createProgram(..., {incremental:false})` and
`getPreEmitDiagnostics`. This covers app source, not generated route validation
or a new production build. No full build was run against the active dev server.

No environment flag was set, no deployment/import/staging/commit occurred, and
no product Page/geometry tokens changed. Local-first evidence, account scopes,
immutable saved versions and terminal deletion remain. No measured problem
justified optimization. Expired/revoked *valid* JWTs, unconfirmed hosted users,
true multi-connection lock contention, physical-device/IndexedDB recovery with
the hosted service, private schema direct SQL access under real user sessions,
admin/logs, backup restore/30-day deletion and broader beta readiness remain
unverified. Invalid JWT denial is not revocation proof. Conflict/status UI is
still absent. Writing sync remains off and activation requires separate review.

## Account writing storage and transport (2026-11-05)

Developer approved the concrete repository SQL/access/transport, initial
inventory, conflict/deletion safety, tests and owning records. Branch
`paing-branch`, HEAD `ccdbe77`; all existing changes preserved. No staging,
commit, hosted SQL/configuration change, personal migration or deployment.
[The contract and activation guide](ACCOUNT_WRITING_SYNC.md) describes tables,
RPCs, lifecycle rules, bounds and remaining release gates.

### Setup and verification

PGlite `0.5.15` is a pinned development-only dependency. The actual migration
runs in embedded PostgreSQL with synthetic `auth.users`, `anon`, `authenticated`
and `service_role` roles and request-claim settings. No hosted credentials or
real evidence are used. PostgreSQL's grants, RLS, functions and transactions
execute; this is not a source-string or mocked SQL check. Concurrent client
requests are serialized by PGlite's connection, so this does not certify
multi-connection advisory-lock contention or hosted JWT validation.

Focused command:

```powershell
node --test tests/writing-cloud-database.test.mjs tests/writing-transport.test.mjs tests/writing-model.test.mjs tests/writing-sync.test.mjs tests/writing-compatibility.test.mjs
```

**89/89 passed:** 14 database/coordinator cases, eight transport cases and 67
existing local-model/queue/compatibility cases. Covers own reads/writes;
cross-account isolation for heads/receipts/conflicts; denied anonymous,
missing-identity, unconfirmed-account and service-role RPC calls; denied direct
mutations; exact retry and changed-ID rejection; atomic failed requests;
immutable source/version checks; null/extra-field rejection; inventory paging;
lost responses; competing edits; clearing/Trash/restore; terminal deletion and
conflict-body scrubbing; all four kinds with Burmese/English/emoji and retained
day/timezone; pre-queue saved/deleted inventory. Transport checks pin the token,
verify its confirmed owner, reject mismatched stored identity, failed verification
and late account callbacks, and avoid displaying backend error bodies.

Browser command:

```powershell
node --test tests/writing-cloud.browser.mjs tests/writing-storage.browser.mjs tests/writing-provider.browser.mjs
```

**43/43 passed:** eight new cloud cases, 19 existing store cases and 16 provider
cases. The new harness uses real IndexedDB and HTTP against the actual SQL with
synthetic Auth/RPC handling, isolated Chromium contexts at 390x844 and blocked
external requests. Existing store/provider checks also use 360x844 and actual
same-account tabs. New coverage includes real offline save/reload; restoration
in a separate browser-storage context; clear/Trash/restore/delete propagation;
failed acknowledgement transaction and receipt recovery; old-account request
abort; newer typing during an upload; preserved conflicts and deletion scrubbing;
absent session denial; and the enabled React runner automatically uploading a
save. Two browser contexts are synthetic device equivalents, not physical phones.
The runner's final affected case was rerun after removing unused internal status
bookkeeping. No new user-facing status/conflict UI was added.

Targeted ESLint covered the new source/test files plus changed auth boundary,
writing provider/store and storage browser test. The Next production command
`node node_modules/next/dist/bin/next build` passed including TypeScript.
Final whitespace and local-document link checks are recorded at handoff.
`git diff --check` passed with existing LF/CRLF notices. A read-only link audit
checked 61 local links/fragments in the new guide and current updated sections;
all passed. The final targeted lint, production build and affected runner case
passed after source cleanup.

### Attempts and limits

An initial database test exposed receipt recovery marking a newer local edit as
a conflict after a lost upload response. The coordinator now recognizes the
server head named by its recovered receipt; the final test passes. Local deletion
also clears an existing remote conflict in its transaction and bypasses the
conflict upload pause so the terminal marker can reach the server.

The account-switch browser test initially expected only a scope error; actual
fetch cancellation correctly raised AbortError. The test now accepts either
and waits for the intercepted callback to settle. The runner test initially
used an asynchronous page predicate that returned before IndexedDB acceptance;
explicit Node-side polling now waits for the durable acknowledgement. The
existing transaction-completion test assumed one put; the queue already writes
more than one record. It now verifies all request successes precede the single
transaction commit and promise resolution, without assuming a write count.

Standalone `tsc` initially found malformed generated `.next/dev/types` files.
No tracked source was changed to hide this; subsequent Next production builds
and their type checks passed. The npm shim was blocked by NVM, so the installed
direct npm CLI was used. Its sandbox download failed with EACCES; the approved
dependency download succeeded through escalation. No trust settings were changed.

The runner stays off by default. Actual Supabase roles/default privileges,
JWT validation, real token refresh/revocation, target-region networking, hosted
RPC and device/Home Screen recovery remain unverified. The migration has not
been applied remotely. Conflict/status UI, protected admin access/logs, complete
account deletion, backup restore/30-day deleted-backup limits, other lifestyle
domains and personal migration remain open. Prior unrelated Week/ResizeObserver
and beta-readiness gaps remain. Full lint/broad suite and Vinext build were not
run; the targeted checks above are the evidence for this slice.

No visual tokens or geometry changed, so no geometry measurements are claimed.
Local-first evidence, draft exclusion, retained assigned days/06:00 attribution,
immutable saved versions and received readings/chapters remain. No measured
performance issue justified optimization; full-inventory polling and per-entry
upload limits remain explicit implementation bounds.

## Durable local writing sync queue (2026-11-05)

Developer approved the durable local writing queue, acknowledgement guards,
focused tests and owning records. Branch `paing-branch`, HEAD `ccdbe77`; 32
tracked changes and 11 untracked paths at startup preserved. No owner writing,
remote database, credentials, migration or deployment used. Baseline writing,
compatibility and account-scope tests passed 66/66 before edits.

### Delivered and verified boundary

The existing writing store now writes its ledger and a separate `sync-v1` key
in one account-scoped IndexedDB transaction. Only new accepted saved/lifecycle
changes queue. Drafts, no-op saves, local conflicts, redundant lifecycle actions
and retries of prior receipts do not. Entries contain IDs/hashes, saved-version
references, generations, lifecycle kind, local sequence and predecessor, never
copied body/draft text. Clearing preserves the saved empty version. Trash,
restore and permanent deletion remain distinct. No automatic prior-record
backfill or legacy upload occurs.

Exact synthetic acknowledgements validate owner/operation/hash/entry/generation,
receipt identity and server version ordering. Only named operations retire, in
the same transaction as their acknowledgement. Replays must match. Invalid
batches do not partially retire records. A newer saved change/draft remains
untouched by an older receipt. Corrupt queues fail closed. Scope changes abort
in-flight work; callbacks check their original scope before continuing.

### Final checks

- `node --test --test-reporter=dot tests/writing-sync.test.mjs tests/writing-model.test.mjs tests/writing-compatibility.test.mjs tests/account-scope.test.mjs`:
  **75/75 passed**, `outputs/writing-sync-model.log`. Nine new cases cover
  queue selection/no-ops, stable retries, all writing kinds, clearing/lifecycle
  markers, deletion without retained bodies, preserved newer saves/drafts,
  partial/out-of-order/replayed acknowledgements, rejected mismatches/reused
  receipt IDs, corrupt data and unsupported owners.
- `node --test --test-reporter=tap --test-name-pattern="durable writing sync|new typing during delayed autosave|normal-motion Deep Thoughts waits|History bins move only|New Note flushes" tests/writing.browser.mjs`:
  **9/9 passed**, `outputs/writing-sync-final-browser.log`. Five new queue cases
  plus four affected existing journeys. Isolated Chromium at 360x667/390x844,
  Bangkok timezone, reduced/normal motion, actual IndexedDB and blocked external
  traffic. Offline saves survive restored-connectivity reload; offline history
  opens the latest saved text. Synthetic older acknowledgements leave newer
  operations pending and writing untouched. Injected record/queue/ack write
  failures abort atomically, retain the recoverable draft/pending operation and
  allow stable retry. In-flight account switching/logout and captured old-scope
  receipts are rejected. Concurrent same-account tabs retain all changes.
- `node --test --test-reporter=tap --test-name-pattern="Deep Thought save failures|failed local commit|a recovered History row|another tab.s correction|real Reflect reading reply|account change closes autosave" tests/writing.browser.mjs`:
  **6/6 passed**, `outputs/writing-sync-regression-browser.log`. Additional
  existing failure/retry, stale-editor review, reading-answer source and
  account-switch recovery journeys. This selection is disjoint from the nine
  above, giving **15 browser cases**. Harness assertions found no uncaught page
  errors or backend/AI requests in final runs.
- `node node_modules/next/dist/bin/next build`: passed including types/static
  generation; `outputs/writing-sync-final-build.log`.
- After strengthening the transaction test to abort after both put requests
  succeeded, `node --test --test-reporter=tap --test-name-pattern="durable writing sync transaction failures" tests/writing.browser.mjs`
  passed **1/1**, `outputs/writing-sync-transaction-abort.log`. The saved change
  and queue both roll back; request success never reports a committed save.
  This repeats one of the fifteen cases, rather than adding another case.
- `node node_modules/eslint/bin/eslint.js app/os/writing-sync-model.js app/os/writing-store.ts tests/writing-sync.test.mjs tests/writing.browser.mjs`:
  passed without warnings, `outputs/writing-sync-lint.log`.

### Attempts and remaining work

Initial mobile tests used an incorrect history selector and clicked before the
normal-motion flip settled; corrected to open the actual row after settling.
Initial failure injection also interrupted the draft commit instead of the
saved change. Existing quota tests assumed every value in the writing store
was a ledger; they now target only ledger-shaped values. The account-switch
case exposed an uncaught second abort after the scope had already aborted the
transaction; callbacks now return when the captured scope is no longer current.
Two unused-variable lint warnings were removed. Final checks above ran after
the source fixes. No measured performance issue justified optimization.

No UI/CSS/geometry token changed; no new geometry measurements are claimed.
The browser acknowledges local synthetic receipts only: no remote authentication,
Supabase transport/RLS, actual server version arbitration, two-device conflicts,
initial inventory, prior-writing import or backup/recovery is certified. Drafts
remain local; a future transport must honor deletion tombstones rather than
recovering removed content from an old pending reference. Technical queue
receipts do not expire automatically. Server/deletion/backup retention and stale
device suppression require reviewed implementation. Hosted/physical-device,
other-browser, Vinext and broad-suite gaps remain, along with earlier unrelated
warnings. Next: bounded server ownership/access and transport proposal.

## Protocol prospective wording (2026-11-05)

Developer approved next-Circle-day term changes, dated history, tests and owning
records. Branch `paing-branch`, HEAD `ccdbe77`; pre-existing 31 tracked changes
and ten untracked paths preserved. No owner data or remote services used. The
previously recorded defect was phase summaries reading current item text for
earlier days. Independent immutable snapshots now resolve each day's agreement.
Edits/additions/clearing start next local Circle day at 06:00; the front retains
today's terms and the editor shows pending words. History separates intervals
and counts; each day's outcome uses its required terms or saved seal. An early
ending before 06:00 stays on the finished Circle day. Unticked optional terms
remain visible. Legacy baselines are observed without backdating; available
seal/completion words are used and missing originals are explicitly unavailable.

Checks:

- `node --test --test-reporter=dot tests/protocol-wording.test.mjs tests/protocol-home.test.mjs tests/circle-os-model.test.mjs tests/account-scope.test.mjs`:
  **96/96 passed**, `outputs/protocol-wording-model.log`. Nine new cases cover
  repeated edits, additions/removals, interval counts, immutable existing
  evidence, legacy words/optional terms, closed-phase guards, 06:00/early ending,
  normalization and both stale-merge directions.
- `node --test --test-reporter=tap --test-name-pattern="Protocol wording|Protocol finished|Protocol past phases|shared App Box geometry" tests/writing.browser.mjs`:
  **8/8 passed**, `outputs/protocol-wording-verified-browser.log`. Actual
  components in isolated Chromium, synthetic account/storage, Bangkok timezone,
  360x667/390x844, reduced/normal motion, blocked external traffic. Actual edits
  retain today's tick, save offline, reload pending words and show dated
  read-only history; existing finished/bounded-history cases also pass. Harness
  assertions found no uncaught page errors or backend/AI requests.
- `node node_modules/next/dist/bin/next build`: passed including types/static
  generation; `outputs/protocol-wording-verified-build.log`.
- Targeted ESLint on `circle-os-model.js`, `protocol-page.tsx`,
  `protocol-wording.test.mjs`, `circle-os-model.test.mjs` and
  `writing.browser.mjs`: passed; `outputs/protocol-wording-lint.log`.
- Resting Note/Thoughts/Habit/Protocol frames **346px**, Pages **344px**, header
  gaps **48px**. History ceilings **400.19px**/**480px**, one Body scroller,
  **44x44px** Remove targets, **10.39px** row/removal gaps, no horizontal overflow.
  Inspected `outputs/protocol-wording-360.png` and
  `outputs/protocol-wording-390.png`. No CSS/shared geometry tokens changed.

Initial checks needed the new empty-map migration assertion, a wait for the
animated tick's deferred commit before Edit, and a count selector excluding
date labels. Corrected tests pass. Early-end Circle-day, snapshot-order and
legacy sealed-day baseline refinements were tested again in the final runs.
An intermediate four-case
selection overlaps the final eight; it is not extra coverage. Screenshots also
scroll to the later wording when needed. Product code stayed fixed during the
final selection.

No measured issue justified optimization. Independent snapshot merging retains
history against stale runs; it does not solve concurrent editable-run conflicts
or certify real sync/acknowledgements. Physical-device/hosted use, other browsers,
real sync/recovery, Vinext and broad checks remain unverified. Existing
ResizeObserver/Week/beta gaps remain open. Historical phase names/goals and
past-day corrections remain separate. Next: developer phone use across a real
Circle-day boundary.

## Contextual chapter review cleanup (2026-11-05)

The developer approved removing the standalone Chapter History control and
visible version labels. Finished steps and completed Quests' View history keep
the shared reader. Removed only that header markup, its two scoped CSS rules
and version text in the reader/list. Original run/version references, exact
definition lookup, stored questions/answers and setup/replay guards remain.
Branch `paing-branch`, HEAD `ccdbe77`; all existing work is preserved, with no
new source paths, staging, commit, deployment, import or remote changes.

- `node --test tests/chapter-history.test.mjs tests/quests.test.mjs`:
  **12/12 passed**, exit 0. Existing immutable/version-specific read and setup
  evidence cases are preserved. Log: `outputs/quest-history-cleanup-model.log`.
- `node --test --test-reporter=tap --test-name-pattern="Chapter history|Completed Quests|shared App Box geometry" tests/writing.browser.mjs`:
  final **6/6 passed**, exit 0. Actual components/stores/CSS, isolated synthetic
  accounts, external requests blocked, Bangkok timezone. At 360x667/390x844 with
  reduced/normal motion: standalone control absent; contextual lists/detail
  contain no version labels; saved paragraphs/publication instants, original
  missing-question fallback, false/zero handling, unchanged domain records/
  evidence/outbox/writing ledger, Back to the same non-first Quest, reload,
  offline reading, account isolation, long-record resize, finished Quest review
  and genuine unfinished launch passed. Fixtures keep repeated/internal versions
  while entering only through the now-retained View history action.
  Log: `outputs/quest-history-cleanup-browser-final.log`.
- Resting Note, Deep Thoughts, Habit and Protocol still measure **346px** with
  **48px** header gaps at both widths. The reader keeps the 48px anchor, no
  horizontal overflow and downward growth without inner scrolling. Inspected
  `outputs/chapter-history-390.png` after version-label removal.
- `node node_modules/eslint/bin/eslint.js app/os/mirror/page.tsx app/os/chapter-history-page.tsx tests/writing.browser.mjs`:
  clean, exit 0. Log: `outputs/quest-history-cleanup-lint-final.log`.
- `node node_modules/next/dist/bin/next build`: passed including TypeScript and
  static generation. Log: `outputs/quest-history-cleanup-build.log`.

The first selection passed five of six. The normal-motion case tried to select
a step before the deferred View history button/flip had settled. The fixture
now waits for the list to appear, then for shared settling; the final selection
passed without another runtime change. Existing ResizeObserver notifications
remain visible. No shared tokens, engine, model/write/merge path, publication
content, IDs, budgets or 06:00 attribution changed. No measured performance issue
justified optimization. Physical-phone/hosted use, real sync/recovery, other
browsers, Vinext and broad checks remain unverified; prior independent warnings
remain. Next: developer phone review of the cleaner Quest header and saved-answer
reader. A broader all-chapter archive is deferred.

## Chapter History and Quest setup review (2026-11-05)

The developer approved read-only Chapter History, then separately approved the
reported Quest fixes: reusable View/Hide, existing setup status, finished-step
answer reading, complete-Quest View history and affected setup/pinning guards.
They confirmed the preceding Athena Reading History on their phone. Branch
`paing-branch`, starting HEAD `ccdbe77`; all 27 changed tracked and seven
untracked paths present at implementation start are preserved. Three new
source/test files are added. Nothing staged, committed, deployed, imported or
changed remotely; no personal records were used as fixtures.

Global Chapter History reads completed answer-bearing runs, preserving repeated
runs/versions. Stored question/display snapshots win; only exact original
definitions may fill missing prompts, and conflicting/missing definitions never
borrow newer text. Quest-specific History also represents completed setup with
no saved answers, without manufacturing a chapter record/date/version. Shared
App-back preserves catalogue position and locks outer travel while reading.

Unfinished Quests keep View/Hide through the existing reusable button setting.
Complete Quests offer View history; completed steps open readers. The shared
status check reads named active Habits, both Log routine answers, corresponding
nonempty declarations and audience-allowed completed replacement first-use
publications at their original version. An unlocked App, draft Habit, partial
Log answers or unrelated record does not complete a step. Habit/Log surfaces
share this status and suppress duplicate setup; stale Quest pins are cleared.
Ordinary reflections/Week setup/reviews still need their own completed runs;
existing access gates and named Workshop/weekly doors remain.

Checks:

- `node --test tests/chapter-history.test.mjs tests/quests.test.mjs tests/first-use-setup.test.mjs tests/chapter-engine.test.mjs tests/habit-identity.test.mjs`:
  **51/51 passed**, exit 0. New cases cover exact/missing/conflicting definitions,
  snapshots, repeated runs, clone-isolated reads, false/zero/array/blank values,
  unknown dates, actual setup evidence, insufficient/unrelated evidence,
  first-use App/version/audience proof and actual completed-run links.
  Log: `outputs/chapter-quest-model-verified.log`.
- `node --test --test-reporter=tap --test-name-pattern="Quest setup status|Completed Quests|Chapter history" tests/writing.browser.mjs`:
  final **6/6 passed**, exit 0. Actual product components/stores/CSS in isolated
  synthetic accounts, Bangkok timezone, external requests blocked, at
  360x667/390x844 with reduced/normal motion. Three consecutive View/Hide cycles,
  Habit/Log Already set up without fabricated answers, finished Quest History,
  genuine unfinished launch, stale Habit/Log pin rejection, exact saved answers,
  versioned/repeated runs, missing originals, unchanged domain records/evidence/
  outbox/writing ledger, return to a non-first Quest/reload, account isolation,
  actual offline reading and long 26-answer detail/resize passed.
  Log: `outputs/chapter-quest-browser-delivery.log`.
- Screenshot review then aligned only the new header control with the existing
  topic/counter. After this scoped CSS fix,
  `node --test --test-reporter=tap --test-name-pattern="Quest setup status|shared App Box geometry" tests/writing.browser.mjs`:
  **4/4 passed**, exit 0. Rechecks the new control and all three toggle cycles,
  setup/status readers and stale pins at both widths. Four resting Note, Deep
  Thoughts, Habit and Protocol frames remain **346px** with **48px** header gaps.
  Chapter History detail also retains the 48px anchor. Long detail grows past
  480px without inner scrolling or horizontal overflow. Log:
  `outputs/chapter-quest-header-final.log`. The selections overlap; do not add
  their counts as unique coverage.
- `node node_modules/eslint/bin/eslint.js app/os/quests.js app/os/quests.d.ts app/os/chapter-history.js app/os/chapter-history-page.tsx app/os/mirror/page.tsx app/os/circle-os-shell.tsx tests/chapter-history.test.mjs tests/quests.test.mjs tests/writing.browser.mjs`:
  final direct invocation clean, exit 0. The earlier state-in-effect error was
  fixed by removing an unnecessary state update; the effect now synchronizes
  only the stale pin in storage.
- `node node_modules/next/dist/bin/next build`: final production rebuild after
  header alignment passed, exit 0, including TypeScript and static generation.
  Log: `outputs/chapter-quest-build-delivery.log`. The preceding JS/types build
  also passed in `outputs/chapter-quest-build-verified.log`.
  Builds use the installed Next CLI because the previous npm-launcher trust
  problem remains; no trust settings changed.
- Inspected `outputs/chapter-history-390.png`, `outputs/chapter-history-360.png`,
  `outputs/quest-setup-390.png` and `outputs/completed-quest-history-390.png`.

Attempts: old source-string assertions needed matching updates for dynamic
classes and the new action branch; behavioral assertions were retained/added.
The first new Quest browser selection used Log in a selector although that
chapter's displayed title does not contain Log; corrected to its manifest step.
An earlier ten-case regression selection passed before the final pin/publication
cleanup. A later affected run passed five of six, timing out on full-load reload
under concurrent build load; DOMContentLoaded plus the existing ready signal
passed the complete final six-case run. No application change was made for that
timeout. Existing ResizeObserver notifications remain visible. A redirected lint
attempt returned failure without diagnostics; the direct final command passed.
No measured performance issue justified further optimization.

No published chapter/reading words, IDs/versions, budgets, 06:00 attribution,
App access gates, personal evidence, sync/merge protocol or shared geometry/
type/gap tokens changed. Navigation positions may persist through their existing
engine; clearing a stale Quest pin is intentional navigation cleanup, not a
personal-record write. Physical-phone/hosted use, real sync/recovery, offline
network reload, Vinext and broad tests/lint remain unverified. Previous Week
source-test failures and other independent gaps remain. Next: developer phone
review of Chapter History, repeated View/Hide and completed/setup Quest steps.

## Read-only Athena Reading History (2026-11-05)

Approved source/UI/tests and owning-record slice after read-only audit. The
developer confirmed the preceding Week History on their phone; that is lived
acceptance, not new hosted/cloud certification. Branch `paing-branch`, starting
HEAD `ccdbe77`; all 24 changed tracked and six untracked paths at implementation
start are preserved. One new component is added; existing Mirror/CSS, model and
browser tests and the approved design/architecture/decision/continuity records
are updated. Nothing staged, committed, deployed, imported or changed remotely.

The Athena cover label opens dated saved editions, then their saved cover and
three prose parts. Missing parts say No saved words for this part; unknown dates
say Date not recorded. Shared App-back returns through History to current cover,
and outer travel stays locked to that slot while open. The current four Pages,
reply flow, authored-edition semantics and 60-edition bound remain unchanged.

Verification:

- `node --test tests/athena-memory.test.mjs tests/athena-alignment.test.mjs`:
  **39/39 passed**, exit 0. Added a pure-read case proving old sections/unknown
  dates stay separate from live derived content, and read-model mutation cannot
  alter input memory. Existing immutable/union/bounded-edition checks passed.
  Log: `outputs/athena-history-model.log`.
- `node --test --test-reporter=tap --test-name-pattern="Athena history|real Reflect reading reply|shared App Box geometry" tests/writing.browser.mjs`:
  final **7/7 passed**, exit 0. Isolated actual components/stores/CSS, synthetic
  accounts, external requests blocked, Bangkok timezone. At 360x667/390x844 with
  reduced/normal motion: dated and undated editions, exact old paragraphs,
  absent sections without current prose/derived fallback, keyboard/touch, 44px
  targets, unchanged memory/profile/chapters/evidence/outbox/writing ledger,
  return to current cover, reload, actual offline reading after load, account
  switching, empty archive, all 60 retained rows and long 28-paragraph detail
  through resize. The existing reading-answer Send/source case also passed.
  Log: `outputs/athena-history-browser-final.log`.
- Four resting frames (Note, Deep Thoughts, Habit, Protocol) remain **346px**
  with **48px** header gaps at both widths. History retains the 48px anchor,
  no horizontal overflow and natural downward growth without inner scrolling.
  Long detail measured 2509.67px at both widths. Inspected
  `outputs/athena-history-360.png` and `outputs/athena-history-390.png`.
- `node node_modules/eslint/bin/eslint.js app/os/athena-history-page.tsx app/os/mirror/page.tsx tests/athena-memory.test.mjs tests/writing.browser.mjs`:
  clean, exit 0. Log: `outputs/athena-history-lint-final.log`.
- `node node_modules/next/dist/bin/next build`: passed including types and static
  generation. Log: `outputs/athena-history-build.log`. Used the installed Next
  CLI because the prior slice established an NVM trust block on the npm launcher;
  no trust settings were changed.

Attempts: initial seven-case browser selection passed five; two new cases
sampled a 44px cover target during entrance motion. Waiting for shared frame
settling and tolerating subpixel rounding fixed the test; no runtime fix was
needed. Both affected cases then passed and the final seven-case selection
passed after adding 60-row coverage. Existing ResizeObserver notifications
remain visible. No measured performance issue justified optimization.

No shared geometry/type/gap tokens, publication budgets, chapter/reading words,
06:00 rule, persistence/merge protocol or account scope changed. This is access
to existing local editions, not live generation, full server archive paging,
safe sync or backup. Physical-phone/hosted use, offline network reload, real
sync/recovery, Vinext and broad tests/lint remain unverified. The prior two Week
source-test failures and other independent gaps remain. Next: developer phone
review of Athena Reading History.

## Read-only Week History (2026-11-05)

The developer approved the concrete read-only Week History slice after a source
audit, and confirmed the preceding past Log editor/caret behavior on their
phone. That confirmation is developer-reported acceptance, not a new automated
device check. Branch `paing-branch`, starting HEAD `ccdbe77`; 24 changed tracked
paths and three untracked paths present at implementation start are preserved.
Nothing staged, committed, deployed, imported or changed remotely.

New `week-history.js` and `week-history-page.tsx` read existing weekly goals,
linked tasks and saved reviews. Week's label opens the list, then a detail;
shared App-back returns to History then current Week. Blank/current/future or
invalid weeks stay out; goals-only/review-only weeks remain. Archived and
missing task links are retained honestly. Goal/task words are current saved
values, not reconstructed historical snapshots. Actual review recording time
is formatted locally while its exact instant remains in the time element.

Final checks:

- `node --test tests/week-history.test.mjs tests/week-review.test.mjs tests/goal-model.test.mjs`:
  **22/22 passed**, exit 0. Covers selection, invalid/future/current weeks,
  incomplete/missing/archived links, pure reads, normalized JSON reload and
  existing goal/review behavior. Log: `outputs/week-history-model-final.log`.
- `node --test --test-name-pattern="Week history|shared App Box geometry|Log history grows" tests/writing.browser.mjs`:
  **7/7 passed**, exit 0. Actual product components/stores/CSS in the isolated
  Vite harness, synthetic accounts, blocked external effects, Bangkok timezone.
  At 360x667 and 390x844 (reduced/normal motion), checked saved goals/reviews,
  linked archived steps, keyboard/touch, 44px list targets, unchanged saved
  goals/tasks/weeks/chapters/Protocol/outbox/evidence, reload, return to current
  Week, account switch, actual offline reading after load, 26-week list,
  25 missing links, resize and long downward growth without an inner scroller.
  Includes existing Log-history-to-Week regression. Log:
  `outputs/week-history-browser-final.log`.
- Four resting frames (Note, Deep Thoughts, Habit, Protocol) remain **346px**
  with **48px** header gaps at both widths. History detail retains the 48px
  anchor and no horizontal overflow. Long detail grows beyond 480px with no
  inner scroll panel. Inspected `outputs/week-history-390.png` and
  `outputs/week-history-360.png`.
- `node node_modules/eslint/bin/eslint.js app/os/week-history.js app/os/week-history-page.tsx tests/week-history.test.mjs tests/writing.browser.mjs app/os/circle-os-shell.tsx`:
  clean, exit 0. Log: `outputs/week-history-lint-final.log`.
- `node node_modules/next/dist/bin/next build`: passed including TypeScript,
  static generation and route output. Log: `outputs/week-history-build-final.log`.

Attempts and limits: first 5/5 browser selection passed before recording-time
formatting and longer-history coverage; final seven cases verify the final code.
The first production build found a TypeScript narrowing problem in the missing
task fallback; explicit fallback selection fixed it before the final passing
build. `npm run build:vercel` could not start because NVM distrusts its delegated
npm entrypoint; the build used the installed Next CLI directly without changing
trust settings. Initial wider Week selection passed 39/41, including all new
selector cases; the two recorded `week-app.test.mjs` source assertions still
fail (CRLF-sensitive font-ready regex and editable-line CSS expectation).
No unrelated test/engine fixes were made. Existing ResizeObserver notifications
remain visible. No measured performance issue justified optimization.

No shared geometry/type/gap tokens, chapter/reading versions, attribution/06:00
rules, review write/merge semantics or persistence protocol changed. Physical
phone/hosted Week History, real sync/recovery, offline network reload, Vinext
and broad suite/lint remain unverified. Weekly correction/versioning, historical
goal/task wording, chapter answer review and shared day review remain separate.
Next: developer phone review of Week History.

## Past Log caret-only focus (2026-11-05)

The developer requested removal of the orange writing-field box while keeping
the cursor, then approved the scoped CSS, existing browser checks and records.
Added `outline: 0` only to past-Log correction textareas. Other focus indicators,
caret behavior, borders, sizing and saving retain their behavior. All existing
working-tree changes are preserved; nothing staged, committed or deployed.

- `node --test --test-name-pattern="Log corrections save" tests/writing.browser.mjs`:
  final **2/2 passed**, exit 0, at 360x667/390x844 with reduced/normal motion.
  Both writing fields stay focused, have no outline and keep a visible caret
  color. Actual Tab/Shift+Tab navigation retains Cancel's keyboard focus ring.
  The same journeys verify typing, Save/Cancel, reload, offline saving and
  unchanged/legacy no-ops. Log: `outputs/log-caret-browser-final.log`.
- `node node_modules/eslint/bin/eslint.js tests/writing.browser.mjs`: **clean**,
  exit 0. Log: `outputs/log-caret-lint-final.log`.
- Inspected the updated `outputs/log-correction-editor-390.png`.

The initial two cases failed only on the button focus assertion: programmatic
focus after pointer use did not activate `:focus-visible`. The check now uses
real keyboard navigation; no further runtime change was needed. No geometry,
font or gap changed, so no new geometry measurements are claimed. Model/build
checks were not repeated for this outline-only CSS follow-up. Existing
ResizeObserver and hosted/physical-device/sync gaps remain. Next: developer
confirmation of caret-only focus on the affected device.

## Past Log text corrections (2026-11-05)

The developer confirmed the preceding History on their device, then approved
the bounded text-correction proposal: domain/merge rules, shell types/wiring,
history editor, scoped styling, tests, Page standard, architecture, decisions
and evidence/continuity records. Branch `paing-branch`, HEAD `ccdbe77`; the
22 pre-existing changed tracked paths and three untracked paths remain
preserved/refined within scope. No staging, commit, deployment, import or
remote configuration/personal-record changes.

Tapping a saved past activity/moment opens one text editor. Save changes
accepts activity/moment words; Cancel returns without a write. Original date,
time range, entry ID, first-recorded time and unknown metadata remain fixed.
Legacy notes are converted only by an accepted change; unchanged multiline
legacy words keep their original representation. Actual correction time and
exact before/after snapshots accumulate in `days[dateKey].logCorrections`.
A saved clearing retains its dated empty block in the receipt, while active
timeBlocks excludes it. Normalization/merge suppress older matching blocks;
Week/Reflect readers therefore do not count cleared time. Stale editors cannot
overwrite a newer change. Time/date changes and new past entries are not added.

### Checks and results

- Baseline `node --test tests/log-history.test.mjs tests/circle-os-model.test.mjs`:
  **66/66 passed**. Log: `outputs/log-corrections-baseline.log`.
- Final `node --test tests/log-history.test.mjs tests/log-app-box.test.mjs tests/circle-os-model.test.mjs`:
  **78/78 passed**, exit 0. Log: `outputs/log-corrections-model-final.log`.
  Covers before/after immutability, unchanged dates/ranges/metadata, unknown
  legacy times, revisions/queue, stale/missing/current/future/invalid targets,
  non-increasing timestamps, no-op/replayed saves, accumulating receipts,
  clearing/normalization/stale merge in both directions, zero cleared-time
  totals, a genuinely newer edit, and unchanged multiline legacy content.
- Broader `node --test --test-name-pattern="Log corrections|Log history|shared App Box geometry" tests/writing.browser.mjs`:
  **10/10 passed** before the final legacy comparison fix. These include the
  four preceding History journeys plus four correction/two geometry cases.
  Log after the clearing fix: `outputs/log-corrections-browser-final.log`.
- Final affected `node --test --test-name-pattern="Log corrections|shared App Box geometry" tests/writing.browser.mjs`:
  **6/6 passed**, exit 0. Log: `outputs/log-corrections-browser-verified.log`.
  Existing actual-component Vite harness, isolated synthetic accounts, Bangkok
  timezone, Chromium at 360x667/390x844, reduced/normal motion, blocked external
  requests. Save/cancel/reload, unchanged saves and multiline legacy no-ops pass
  at both widths. A 360px save and clearing use actual offline browser mode;
  network reload occurs after reconnecting to the local harness. Stale changes
  show an alert and disable Save without overwriting; account switching closes
  the draft and preserves only the owner's saved entry. Clearing both original
  and legacy entries retains two receipts, zero active blocks, and stays empty
  through stale merge and reload. Counts overlap the broader run.
- Note, Deep Thoughts, Habit and Protocol frames still measure **346px**, Pages
  **344px**, header gaps **48px** at both widths. No shared geometry/type tokens
  changed. Inspected the mobile editor screenshot, saved as
  `outputs/log-correction-editor-360.png` / `outputs/log-correction-editor-390.png`.
- `node node_modules/eslint/bin/eslint.js app/os/log-history.js app/os/log-history-page.tsx app/os/circle-os-shell.tsx app/os/circle-os-model.js tests/log-history.test.mjs tests/writing.browser.mjs`:
  **clean**, exit 0. Log: `outputs/log-corrections-lint-verified.log`.
- `node node_modules/next/dist/bin/next build`: **passed**, exit 0, including
  TypeScript/static generation after all runtime fixes. Log:
  `outputs/log-corrections-next-verified.log`. Vinext/broad suite/lint not repeated.

### Attempts, invariants and limits

The initial 76 model/structure and ten browser cases passed. Review then found
that retaining cleared blocks in active timeBlocks would still count their
duration in existing summaries. The dated empty value now stays in the receipt;
normalization and merge prevent stale restoration into active blocks. Added
summary/newer-edit regression coverage passed with 77 checks and ten browser
cases. A targeted multiline-legacy no-op test then failed against the old
comparison (`outputs/log-corrections-legacy-baseline.log`). Shared visible-word
comparison now prevents an unnecessary correction or a pending editor; the
final 78 checks and affected six-case rerun pass. No source change followed.

No measured performance problem justified optimization. Immutable chapters and
authored readings, the 06:00 boundary, account epochs and original date/time
attribution remain intact. This is the existing local queue/timestamp merge,
not the planned Supabase durable-operation/conflict system. Physical-device
correction use, hosted/real sync acknowledgements, recovery and offline network
reload remain unverified. Previously recorded ResizeObserver notifications
still appear in the harness; existing checks report no external backend calls
or uncaught page errors. Other prior unrelated verification gaps remain.
Next: developer use/review of the past-entry editor.

## Read-only Log history (2026-11-05)

The developer approved the audited read-only slice, exact source/test/record
scope and correction of the stale Log scrolling sentence in the Page standard.
Branch `paing-branch`, starting HEAD `ccdbe77`; all 15 pre-existing changed
tracked paths preserved. No staging, commit, deployment, personal-data edits,
external records, database changes or sync implementation.

The Log label opens History through `useAppBack`, within the existing daily
SwipeSession slot. All past dates with saved titles, activities or moments
appear newest first. Empty/range-only generated days, today and future plans
are excluded. Day reading shows assigned dates and saved block times/content,
including legacy `activity`/`note`, in 06:00 order. Title-only days remain
readable. Today's routine never fills historical gaps. Back returns to History
then today; Week remains available from today. Both history surfaces grow
downward, reading the existing account records without writing another store.

### Checks and results

- Baseline `node --test tests/log-app-box.test.mjs`: **4/4 passed** before edits.
- Final `node --test tests/log-history.test.mjs tests/log-app-box.test.mjs`:
  **7/7 passed**: three behavioral model cases and four existing structure
  checks. Covers filtering, old dates, title-only content, legacy notes,
  moments-only entries, non-hour times, midnight ordering, nonmutation,
  assigned date labels and the local 06:00 boundary.
- Final `node --test --test-name-pattern="Log history|shared App Box geometry" tests/writing.browser.mjs`:
  **6/6 passed**, exit 0. Actual components/CSS/stores in the existing Vite
  harness; isolated synthetic accounts, Bangkok timezone, mobile Chromium,
  360x667/390x844, reduced/normal motion and blocked external traffic.
  Covers 20 dates reaching back to 2020, sorting, empty/title-only days,
  activities/legacy moments, no editing/Now controls or routine suggestions,
  no Week swipe from history, unchanged days/outbox/evidence revisions,
  back navigation, reload, Now return, account switching and offline reading
  after an online harness reload. A 24-block long day grows naturally, reaches
  its last moment, resizes across 360/390px without an inner scroller or
  horizontal overflow, accepts keyboard/touch, and returns to Week.
- History's settled header-to-heading gap is **48px** at both widths; list
  controls retain **44x44px** or larger targets. Note, Deep Thoughts, Habit and
  Protocol rest at **346px** frames, **344px** Pages and **48px** header gaps.
  Long Log content grows beyond 480px without an inner scroller.
- `node node_modules/eslint/bin/eslint.js app/os/log-history.js app/os/log-history-page.tsx app/os/circle-os-shell.tsx tests/log-history.test.mjs tests/log-app-box.test.mjs tests/writing.browser.mjs`:
  **clean**, exit 0. Final log: `outputs/log-history-lint-final.log`.
- `node node_modules/next/dist/bin/next build`: **passed**, exit 0, including
  TypeScript/static generation after the final runtime edits. Log:
  `outputs/log-history-next.log`. No Vinext build or broad suite/lint repeated.
- Inspected `outputs/log-history-day-390.png` after the header correction.
  Final browser log: `outputs/log-history-browser-final.log`.

### Attempts and limits

The initial five-case selection passed before final refinements. Screenshot
review found extra space from an in-flow 44px label; the scoped control now
uses the existing out-of-flow header pattern. The next selection passed 5/6:
the 360px measurement sampled a 29px gap during shared frame growth. The check
now waits across queued resize animations and polls the settled 48px gap.
The affected two-case rerun and final full six-case run passed without further
runtime changes. Counts overlap.

The harness still emits the previously recorded ResizeObserver notifications;
their cause is not diagnosed or fixed here. Its existing checks report no
external backend traffic or uncaught page errors. Physical-device/hosted use,
real sync/recovery, offline network reload and DST/travel attribution migration
remain unverified. Existing date keys are read directly; unknown historical
timezone/occurrence metadata is not invented. Past-day editing needs separate
correction-time review. No measured issue justified further optimization.
Shared tokens, immutable chapters/readings and persistence behavior are unchanged.

The developer separately reports Past phases presentation, placeholder,
Continue/Routine-idle and Reflect-swipe concerns resolved in use. These are not
fresh regression checks in this selection. Grey-input-box confirmation and
other independent gaps remain. Next: developer device review of Log History.

## Tighter past-phase spacing (2026-11-03)

The developer approved matching past-term and Remove spacing to the page's
existing roughly 10px rhythm. Branch `paing-branch`, HEAD `a4cd328`; all 16
already-modified paths preserved. Runtime edits are scoped CSS: record-local
0.65rem spacing, no read-only row touch minimum/padding, and a top-aligned Remove
label with a retained 44x44px target. Existing browser checks and owning records
updated; no model/personal-data/remote/staging/commit/deployment changes.

Final checks:

- `node --test --test-name-pattern="Protocol finished|Protocol past phases|shared App Box geometry" tests/writing.browser.mjs`:
  **6/6 passed**. Actual components/CSS, isolated synthetic accounts, Bangkok
  time, blocked external requests, 360x667/390x844 and reduced/normal motion.
  Existing history tests now measure all 12 records' term/Remove gaps, read-only
  row heights, label alignment and touch targets. Also verify two-tap Remove
  confirmation/archive without deleting completion evidence, touch/wheel scroll,
  resize, reload, unchanged counts, fixed Header/Footer and return to a running
  phase. No new standalone test suite or unrelated model checks were added.
- Both widths measure **10.390625px** between terms and before Remove. Read-only
  rows are **20.625px** tall; Remove is **44x44px** and its visible label begins
  **2px** below its top. Long-history frames remain **400.1875px** at 360x667 and
  **480px** at 390x844 with one Body scroller. Body overflow is 2340px/2260px for
  the 12-record fixtures; Header/Footer remain fixed when scrolling.
- Note, Deep Thoughts, Habit and Protocol resting frames remain **346px**, Pages
  **344px**, header gaps **48px** at both widths. Shared geometry/type/gap tokens
  are unchanged.
- `node node_modules/eslint/bin/eslint.js tests/writing.browser.mjs`: **clean**.
- `node node_modules/next/dist/bin/next build`: **passed**, including TypeScript
  and static generation. The model suite, broad lint and Vinext build were not
  repeated for this scoped CSS refinement; affected runtime/geometry journeys
  and the Next production target were selected. Whitespace and added local
  links/fragments passed.
- Inspected `outputs/protocol-history-bounded-top-390.png`: compact term and
  Remove spacing is visible, with existing summary/count/divider rules retained.

Attempts: the initial run passed 5/6 but the normal-motion test tapped Phases
while its App-back transition was still active. It now waits for that transition
to finish. A rerun also sampled the frame before ResizeObserver began its growth
animation and compared it with the settled scrolled frame. The test now waits
two animation frames and for the frame's current animations to finish before
recording fixed positions. The final 6/6 run passed with no additional runtime
fix. These are timing corrections to the verification setup, not new motion
behavior. No measured issue justified further optimization.

Physical-device/hosted/sync verification, historical term versions, prior
unrelated bug/test gaps and the original grey-input-box confirmation remain
separate. Next is developer use/review of the tighter past-phase list.

## Bounded Protocol past phases (2026-11-03)

### Approved scope and baseline

The developer approved the proposal to bound expanded Past phases like Note,
keep full phase summaries, shorten term counts and remove white term-row lines.
Branch `paing-branch`, HEAD `a4cd328`; 15 already-modified tracked paths preserved.
The preceding verified history grew to 819.56px on a short phone without scrolling.
No personal data, remote configuration, staging, commits or deployment.

### Delivered behavior

The shared existing bounded-page CSS now also matches Protocol home while Past
phases is open. Its frame uses the same 480px/60dvh ceiling and shared minimum;
only Body scrolls, with Header and Footer outside the scroll area. Direct Body
children retain their intrinsic height rather than shrinking to fit. Closing
Past phases removes that bound. Draft/running term Pages retain natural growth.

Full `1 of 7 days kept` summaries stay under titles. Individual terms display
`1/7` and `0/7`, with white row borders removed and between-phase separation kept.
No model, stored record, count formula or correction permission changes. DESIGN,
Page standard and the decision log record the approved history-only exception.

### Checks and measurements

- `node --test --test-reporter=dot tests/protocol-home.test.mjs tests/circle-os-model.test.mjs tests/habit-spacing.test.mjs`:
  **82/82 passed**, covering phase read models, finished-record protection and
  existing model/spacing behavior.
- `node --test --test-name-pattern="Protocol finished|Protocol past phases|Protocol term inputs|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
  **10/10 passed**. Actual components/CSS with synthetic isolated accounts,
  Bangkok time and blocked external traffic. Retains input-scrollbar and
  running-row regression checks alongside the new bounded history journeys.
- `node --test --test-name-pattern="Protocol past phases" tests/writing.browser.mjs`:
  **2/2 passed** after removing an unused test alias and adding the active-phase
  history/return check. These overlap the 10 cases. Checks include empty/collapsed
  rest, 12 finished/early-ended phases, exact 1/1/0/1/1/7/0/7 text, no white row
  borders, wheel and CDP touch scrolling, last-record reachability, fixed Header/
  Footer, close/reopen, resize to 560px height, reload and unchanged saved records.
  The 390px case also opens history behind an active eight-term phase and returns
  to its naturally growing running Page. Both reduced and normal motion used.
- `node node_modules/eslint/bin/eslint.js app/os/protocol-page.tsx tests/writing.browser.mjs`:
  **clean** after removing the unused test alias.
- `node node_modules/next/dist/bin/next build` and
  `node node_modules/vinext/dist/cli.js build`: **both passed** on the final
  application changes. Next includes TypeScript/static generation. Vinext's
  route-classification notice and a plugin-timing advisory remain build output,
  not runtime failures. Whitespace and added local links/fragments were checked.
- At 360x667: expanded frame **400.1875px**, Body **210px**, Header offset **23px**,
  Footer offset **300.1875px**. At 390x844: frame **480px**, Body **290px**, Header
  offset **23px**, Footer offset **380px**. Exactly one inner scroller, no
  horizontal overflow. A wheel scroll moves Body by 260px without moving either
  fixed area. Empty/collapsed frames remain **346px**. At 560px viewport height,
  the shared minimum wins and the frame remains 346px.
- Resting Note, Deep Thoughts, Habit and Protocol frames remain **346px**, Pages
  **344px**, header-box gaps **48px** at 360/390px. Real Habit/running Protocol
  rows still grow naturally with no inner scroller. Shared geometry/type/gap
  tokens unchanged.
- Inspected `outputs/protocol-history-bounded-top-390.png` and
  `outputs/protocol-history-bounded-390.png`: title/summary/count hierarchy stays
  readable, white row dividers are absent and the footer remains visible at the
  bottom of the list. A short-phone screenshot is also retained at
  `outputs/protocol-history-bounded-360.png`.

### Limits and next action

The first lint run identified an unused test-only alias; it was removed and lint
and both affected browser cases passed again. No application failure required a
follow-up fix, and no measured issue justified additional optimization. This
reuses existing bounded Page rules instead of introducing a separate scroller.

Physical devices/native keyboards, hosted sessions, real cloud sync and beta
readiness remain unverified. Historical term versions and other prior bug/test
gaps remain separate. The earlier grey-box cause still needs developer
confirmation. Next is developer use/review of Past phases. Earlier entries retain
their unique evidence, with unbounded finished-history rules superseded here.

## Protocol simplification and input scrollbars (2026-11-03)

### Approved scope and behavior

The developer approved hiding the small grey box on the term input and requested
removal of Correct last day as unnecessary. Branch `paing-branch`, HEAD `a4cd328`,
with 15 modified tracked paths at startup. Existing Habit/history work is
preserved. No personal data, remote configuration, staging or deployment.

Removed the correction action/editor, its transient navigation/state, shell
props/callback and dedicated model draft/write functions. Finished-phase terms
remain read only; running-day ticks and phase creation still work. Existing
correction receipts remain accepted by normalization and merge for compatibility.
Both Protocol term kinds share scoped native-scrollbar suppression; content
sizing and multiline input remain.

### Checks and measurements

- `node --test --test-reporter=dot tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/circle-os-model.test.mjs tests/protocol-home.test.mjs tests/account-scope.test.mjs tests/first-use-setup.test.mjs tests/phases.test.mjs`:
  **120/120 passed** after the final cleanup. Includes completed/archived/date
  guards, immutable finished results through reload/merge, retained older receipts,
  ordinary running-day edits and the pre-existing Habit/account/setup checks.
- `node --test --test-name-pattern="Protocol finished|Protocol term inputs|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
  **9/9 passed** after final cleanup. Actual components/CSS with synthetic
  account/storage, blocked external requests and Bangkok time. Mobile history
  checks use 360/390px with reduced/normal motion. Input checks use 360/390/1280px,
  verify empty/short/wrapped text, phase creation, reload and a running-day tick.
  The 1280px case uses the harness's touch/mobile context at a wide viewport;
  it is not physical desktop-browser certification.
- Targeted ESLint on model, shell, Protocol page and the three changed test files:
  **no errors**, existing `renderChapterTemplate` unused-import warning only.
- `node node_modules/next/dist/bin/next build` and
  `node node_modules/vinext/dist/cli.js build`: **both passed** after final cleanup.
  Next includes TypeScript/static generation. Vinext retains its existing
  route-classification notice. No deployment/runtime certification is inferred.
- `git diff --check`: passed with existing LF/CRLF warnings. Local links/fragments
  in the updated sections were checked; historical evidence remains below.
- Four resting frames remain **346px**, Pages **344px**, header-box gaps **48px**
  at 360/390px. Wrapped input grows from **20px to 60px** on mobile with equal
  client/scroll heights and no horizontal overflow. Wide inputs grow to 45px
  (required) and 35px (optional). Expanded finished history measures **819.56px**
  at 360x667 with no inner/horizontal scroll and a 48px first-content gap. Real
  Habit/Protocol rows still grow downward. Shared sizing/type/gap tokens unchanged.
- Inspected `outputs/protocol-inputs-390.png`: wrapped terms are fully visible
  and there is no grey box or scrollbar chrome. The baseline isolated browser
  also did not show the reported box; this is not a reproduction of its cause.

### Attempts and remaining limits

The first model run was 119/120: the new compatibility test compared independently
created fixtures whose timestamps differed by one millisecond. Reusing the same
baseline with only its receipt removed fixes the test setup. The first browser
selection was 8/9: its history measurement targeted the nested term list instead
of the first visible standing section. Correcting the measurement yielded 9/9;
the final run after removing leftover correction navigation also passed 9/9.
An initial patch attempt failed verification because PowerShell decoded UTF-8
as a legacy encoding. Re-reading explicitly as UTF-8 allowed the intended patch;
no encoding rewrite is part of this change.

Native scrollbar chrome is the inferred cause of the original grey box, pending
developer confirmation in the affected browser. Physical phones, native
keyboards, hosted sessions and real cloud sync remain unverified. Earlier
ResizeObserver, placeholder, bug 13, past-phase grouping/labels, full prospective
term history and historical Week-assertion gaps remain. No wider correction UI,
stylesheet split, personal migration or deployment is included. No measured
problem justified further optimization.

## Protocol correction protections (2026-11-03)

### Scope and baseline

The developer approved the bounded correction proposal after read-only History
review. Branch `paing-branch`, HEAD `a4cd328`, with 11 pre-existing modified paths
preserved. No personal data, remote configuration, staging or deployment.
The History baseline passed 114 focused tests and 11 actual-component cases.
An in-memory reuse of this browser harness reproduced bug 16 at 360/390px:
one last-day term tap changed 1/1 to 0/1, unsealed the day and survived reload.
Synthetic model probes also accepted malformed/out-of-run dates and archived
targets, and showed later wording replacing earlier wording in phase summaries.
Full prospective term history remains a separate gap.

### Delivered behavior

Past term rows are read only. The latest completed phase opens Correct last day
on its scheduled final date, with selected booleans, Save correction, Cancel
and Phases back. Returning preserves expanded Past phases. Selection/cancellation
does not write evidence. Each accepted correction keeps an immutable receipt
with available wording, actual time and before/after completions/seal. Required
changes explicitly unseal; optional changes preserve the seal. Reticking never
silently reseals. No-op/repeated saves, stale edits, invalid/out-of-run/future
dates and archived targets are rejected. Existing running-day controls remain.

### Final checks

- `node --test tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/circle-os-model.test.mjs tests/protocol-home.test.mjs tests/account-scope.test.mjs tests/first-use-setup.test.mjs tests/phases.test.mjs`:
  **123/123 passed**, log `outputs/protocol-correction-model.log`. Covers explicit
  values/no-ops/repeated IDs, stale run/completion changes, target guards, original
  seal/completion retention, optional/required semantics, missing seals, actual
  time versus merge ordering under clock skew, reload and both stale-merge
  directions. Earlier receipts survive later corrections and merges.
- `node --test --test-name-pattern="Habit dated history|new Habit accepts|empty Habit History|Day One v3 Routine task controls|shared App Box geometry|real Habit and Protocol rows|Protocol correction|Protocol deliberate|Protocol stale" tests/writing.browser.mjs`:
  **17/17 passed**, log `outputs/protocol-correction-browser.log`. Isolated
  Chromium, synthetic account/storage, blocked external traffic, 360/390px,
  reduced motion and normal motion. Six new cases cover read-only taps, keyboard
  selection, disabled unchanged saves, Cancel/back, three consecutive accepted
  corrections with retained evidence, reload and a competing accepted edit.
  No uncaught page errors or external backend/model requests.
- `node --test --test-name-pattern="Protocol deliberate" tests/writing.browser.mjs`:
  **2/2 passed** after extending the 360px case to save all three corrections
  with `context.setOffline(true)`, verify local persistence, restore the harness
  connection and reload. Log `outputs/protocol-correction-offline.log`. These
  reruns overlap the 17 cases; they are not two extra distinct cases.
- `node node_modules/next/dist/bin/next build`: passed, including TypeScript and
  static generation; log `outputs/protocol-correction-next.log`.
- `node node_modules/vinext/dist/cli.js build`: passed; log
  `outputs/protocol-correction-vinext.log`. Its route-classification notice
  remains build output, not runtime certification.
- Targeted ESLint for model, shell, Protocol page and the three changed test files:
  no errors, one existing `renderChapterTemplate` unused-import warning in shell.
  `git diff --check` passed with existing LF/CRLF warnings.
  A read-only document audit passed 14 added local links/fragments (including
  the preserved Habit additions) and confirmed four earlier HEAD record bodies
  remain intact in the decision log, task, handoff and journey record.

### Geometry, attempts and limits

Note, Deep Thoughts, Habit and Protocol rest at **346px frames / 344px Pages**
with **48px header-box gaps** at both widths. Visible text gaps are 52px for
writing and 51.09px for Habit/Protocol. History ceilings remain 400.19px at
360x667 and 480px at 390x844. Real Habit/Protocol rows grow naturally. Eight
required correction terms plus one optional term measure **1103.92px** at
360x667, with a 48px top gap, 44px controls, no horizontal overflow and no inner
scroll panel. Inspected `outputs/protocol-correction-360.png`. No shared sizing,
type or gap token changed; no measured issue justified further optimization.

The first six-case browser attempt failed: two assertions retained the old
accessible term name; returning collapsed Past phases; and the new back control
needed a 44px target outside header flow. A five-case follow-up passed cancellation
and stale protection but exposed a shared footer button retaining its committed
state between editor visits. Each correction now keys its own save button.
The final six-case run, combined 17-case run and offline reruns passed after
these fixes. Some exploratory runs overlapped local edits and builds; only the
stable final runs above establish verification. The initial Next build failed
on nullable-date inference; the explicit string guard passes the fresh build.

Bug 16 is partially resolved: its accidental count-change behavior is fixed
locally; past-phase labels/separation and full prospective wording remain open.
Other-day/early-ended corrections, physical phones/native touch, hosted sessions,
real acknowledgements/cross-device conflicts/recovery and beta readiness are
unverified. Existing ResizeObserver, legacy placeholder, remaining bug 13 reports
and two recorded Week source assertions remain separate. No real data migration,
cloud schema, paid AI request, chapter/reading version or delivery budget changed.

## Habit History page and flexible entry (2026-11-03)

### Approved scope and implementation

The developer approved a separate History Page, opened from Record's top right,
with scrollable past-day groups, Yesterday without its date, older-day dates,
no dropdown/wording notices/dark divider, and unchanged today Undo. They also
explicitly requested any-field-first Habit entry with action/name required to
save and remain visible. Runtime remains limited to model, shell and scoped CSS;
the existing Habit model/browser checks and owning records are updated.
Branch `paing-branch`, HEAD `a4cd328`; all 11 already-modified paths are preserved.
No personal data, import, remote service or deployment was involved.

History reuses the shared App-back controller and the bounded writing-body CSS.
It reads the same completion snapshots and keeps provenance internal. Record
stays today-only. The existing inline Habit editor now keeps a new unnamed
definition in draft status. All three fields are visible while adding it.
Moving between fields does not archive it; committing a nonblank action makes
it active. Unnamed work is hidden when leaving and reopens through New habit,
including after reload. Drafts cannot be completed or counted as active habits.
Saved-Habit clearing retains the existing archive behavior.

### Verification

- `node --test tests/habit-identity.test.mjs tests/habit-spacing.test.mjs tests/circle-os-model.test.mjs tests/protocol-home.test.mjs tests/account-scope.test.mjs tests/first-use-setup.test.mjs`:
  **114/114 passed**. Log: `outputs/habit-history-refinement-model-verified.log`.
  The new draft case first failed on the old archive behavior, then passed for
  optional-field-first draft persistence, whitespace name rejection, no queued
  active save/completion, and promotion with preserved cue/identity. A further
  regression confirms that resuming an older unnamed active placeholder keeps
  its existing optional fields instead of recreating it. Prior
  snapshot/merge/archive, spacing, account and setup cases remain passing.
- `node --test --test-name-pattern="Habit dated history|new Habit accepts|empty Habit History|Day One v3 Routine task controls|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
  **11/11 passed** after the last runtime change. Log:
  `outputs/habit-history-refinement-browser-final.log`. Isolated Chromium,
  synthetic account/storage and blocked external requests. New-history journeys
  use 360x667 reduced motion and 390x844 normal motion; other cases use
  360x844/390x844 reduced motion. No uncaught page errors or external traffic.
  Covered Record/History/back, untouched domain records while browsing, fixed
  headers during actual wheel scrolling, Yesterday/older labels, no dropdown or
  notices, read-only snapshots and legacy rows, today Undo across reload, and
  empty History. Cue-first and identity-first both retain all fields through
  saving/reload; unfinished and whitespace-name drafts hide and recover without
  becoming active. Existing task controls and completion snapshots still pass.
- Long History frames: **400.19px at 360x667**, **480px at 390x844**, with one
  Body scroller and no horizontal overflow. Empty History rests at **346px**.
  Note, Deep Thoughts, Habit and Protocol resting frames remain **346px** with
  **48px** header-box gaps at 360/390px. Visible text gaps remain 52px for writing
  and 51.09px for Habit/Protocol. Real Habit/Protocol rows still grow naturally
  without inner scrolling. Visually inspected `outputs/habit-history-list-360.png`;
  the 390px image is also saved. No shared geometry/type/gap value changed.
- `node node_modules/next/dist/bin/next build`: passed after the last runtime
  change, including TypeScript. Log: `outputs/habit-history-refinement-next.log`.
- `node node_modules/vinext/dist/cli.js build`: passed again after the final
  compatibility fix. Log: `outputs/habit-history-refinement-vinext.log`.
- `node node_modules/eslint/bin/eslint.js app/os/circle-os-model.js app/os/circle-os-shell.tsx tests/habit-identity.test.mjs tests/writing.browser.mjs`:
  passed with the existing `renderChapterTemplate` unused-import warning only.
  `git diff --check` passed with line-ending warnings. The read-only document
  audit passed nine added local links/fragments and preserved all four earlier
  continuity/evidence/decision record bodies from HEAD.

### Attempts and limits

The first focused model run was 101/102: an existing source-wiring assertion
still expected the old yesterday-only conditional; updated it for both back
Pages and reran. The first browser run was 8/9: a reduced-motion History test
asserted the frame ceiling before the shared frame had settled. Waiting for
the measured frame required no runtime sizing fix. The next two History cases
passed; the final expanded 11-case run also passed with actual wheel scrolling,
short-phone ceilings and empty History checks.

The older-placeholder compatibility case initially failed because recreating
its ID cleared the optional fields. The model now resumes that existing empty
record as a draft and the shell uses that action. After this fix the final
114-case model selection, 11-case browser selection and Next build all passed
again. Reopening an existing draft leaves it unchanged; named/archived records
are not overwritten by the draft-resume path.

The previous dated-history evidence remains below, including its two pre-existing
Week source-assertion failures; they were not fixed or recertified here. Protocol's
direct historical toggle/seal issue, bug 13 color/title reports, legacy placeholder
and ResizeObserver warnings remain open. Physical phones/native touch scrolling,
hosted auth/session, real sync/receipts, recovery and beta readiness remain
unverified. Normal-motion History now has synthetic browser coverage; this is
not physical-device certification. Old wording reconstruction, uncompleted-day
definition versions, explicit past corrections and task date/timezone migration
remain outside scope. No chapter/reading version, delivery budget, paid AI,
cloud schema or local-first clearing/acknowledgement rule changed. No measured
performance issue justified an optimization.

## Habit dated history (2026-11-03)

### Scope and baseline

The developer approved recorded-day browsing, new completion wording snapshots,
legacy wording notices, unchanged today Undo, focused checks and owning records.
Starting HEAD `a4cd328`, branch `paing-branch`, clean tree. The preceding Habit
controls were confirmed by the developer in use; this is separate from the new
history checks. No personal records or external services were used.

The existing `dayRecord` reads today's definition and hides archived habits.
The focused regression demonstrates rename then archive on that unchanged
reader. History now uses `habitHistoryRecord` over the same completions, retaining
snapshot wording and archived/orphan records, without changing Week's current
habit-count semantics. Five initial new model cases failed before implementation
(missing snapshots/readers); all pass after implementation, with a sixth edge
case for known-empty snapshots and missing definitions.

### Final checks

- `node --test tests/habit-identity.test.mjs tests/circle-os-model.test.mjs tests/protocol-home.test.mjs tests/account-scope.test.mjs`: **101/101 passed**.
  Covers rename/archive/reload, stale merge and explicit false values, snapshot
  retention, legacy current/unknown wording, empty snapshots, missing definitions,
  recorded-day selection, independent new-day wording and existing domain/account
  behavior. Log: `outputs/habit-history-focused.log`.
- `node --test --test-name-pattern="Habit dated history|Day One v3 Routine task controls|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
  **7/7 passed** after the last model change. Isolated Chromium, 360x844 and
  390x844, Bangkok timezone, reduced motion, synthetic account/storage, blocked
  external requests. New journeys open an older day, show original archived-habit
  wording, label legacy current/missing wording, retain tasks, expose no past-day
  writing/toggle controls and leave domain records byte-for-byte unchanged while
  browsing. Today's Undo persists across reload and leaves past ticks intact.
  A 44px day picker, no horizontal overflow, existing task controls and natural
  row growth pass. Log: `outputs/habit-history-browser-verified.log`.
- Resting Note, Deep Thoughts, Habit and Protocol: **346px frames / 344px Pages**
  and **48px header-box gaps** at both widths. Visible text gaps: 52px for writing,
  51.09px for Habit/Protocol. Final real-row frames: 600.09px Habit and 926.11px
  Protocol, with no inner scrolling. Scoped history CSS changes no shared tokens.
  Visually inspected `outputs/habit-history-360.png`; the 390px image is also saved.
- `node node_modules/next/dist/bin/next build`: passed after final runtime code,
  including TypeScript. Log: `outputs/habit-history-next-final.log`.
- `node node_modules/vinext/dist/cli.js build`: passed. Log:
  `outputs/habit-history-vinext-final.log`. Initial attempt used the wrong CLI
  path (`dist/cli/index.js`); corrected using the installed package's bin entry.
- Targeted ESLint for model, shell and both changed tests: no errors; the existing
  shell `renderChapterTemplate` unused-import warning remains. `git diff --check`
  passed with line-ending warnings. A read-only Node audit passed all five added
  local links/fragments and confirmed preservation of four earlier record bodies.

### Attempts and retained gaps

The first seven-case browser run was 6/7: the existing 360px control test sent
its second tick while the button's success lifecycle was busy. It now waits
for aria-busy=false. Both subsequent seven-case runs passed; the last followed
the empty-snapshot model fix. No button-engine runtime change was made.

An expanded model/Week run passed 121/123. Both failures are existing source
assertions in `week-app.test.mjs`: the newline-sensitive font-ready assertion
reads unchanged `app-session.tsx`, and the 16px-floor assertion rejects the
already-approved Week `!important` typography rule also present in HEAD's CSS.
Those failures are retained, not fixed in this scope. Protocol's latest-finished
term still directly toggles its last day and may unseal it; that remains the next
separate correction review. Bug 13 color/title reports, legacy placeholder and
ResizeObserver warnings remain open.

Physical phones/native select behavior, normal-motion history transitions,
hosted auth/session history, real server acknowledgement/backup/recovery and
cross-device sync are unverified. This slice does not reconstruct old wording,
version uncompleted-day definitions, add past-day corrections or migrate task
date/timezone semantics. No model call, chapter/reading mutation, account schema,
cloud setting or deployment changed. Local Circle-day rules and dated empty/false
values are preserved. No measured performance problem justified optimization;
Phase 1 and beta readiness remain uncertified.

## Habit task controls (2026-11-03)

Approved scope: restore Add task on normal Routine, match Habit checkbox sizes
to Tasks, focused checks and bug/continuity records. Runtime edits are limited
to `circle-os-shell.tsx` and `os-app.css`; existing changes remain preserved.
No personal records were edited.

The fresh-v3 fixture removes synthetic Habit setup runs/recovery markers while
retaining completed Day One v3. Before the fix the 360px case failed because
Add task was absent. The Footer required the real Habit Building completion,
while the displayed idle Page uses a separate usable view after v3. The fix
shows Add task whenever normal Routine is open; Record omits it and no false
setup completion is stored.

Final command:
`node --test --test-name-pattern="Day One v3 Routine task controls|shared App Box geometry|real Habit and Protocol rows" tests/writing.browser.mjs`:
**5/5 passed** in isolated Chromium at 360x844 and 390x844, Bangkok timezone,
synthetic account/storage and blocked external requests. No uncaught page
errors or external traffic. Covered task/habit entry, habit toggling, task
completion, local persisted reload, Record undo and unchanged setup completion.
Discs measure 30px with 5x11px checks and 44px label hit regions. An off-disc
Habit tap in the extended hit region works.

Four resting App Boxes measure 346px (344px Pages) with 48px header-box gaps
at both widths. Visible gaps are 52px for Note/Deep Thoughts and 51.09px for
Habit/Protocol. Eight Habit rows and Protocol terms grow without inner scrolling.
No shared geometry token changed.

Intermediate failures were test locators retaining old accessible names after
editing/completion, and an initial 40px hit area because absolute insets start
inside the 2px border. Corrected locators and extended insets to 9px; the final
run verifies 44px and actual off-disc input. No optimization was justified.

`node node_modules/next/dist/bin/next build` passed after final CSS changes.
`node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx tests/writing.browser.mjs`
passed with one existing `renderChapterTemplate` unused-import warning.
`git diff --check` passed with existing line-ending warnings. Physical devices,
hosted sessions, real sync and a fresh Vinext build remain unverified; earlier
ResizeObserver gaps remain. Only bug 13's checkbox-size portion is closed.

## Editable titles and shared spacing (2026-11-03)

The developer approved 29px editable titles/questions with 18px content/answers,
a 48px shared label gap, equal 25px Main-to-Sub/Body-to-Footer gaps, and the
Note/Deep Thoughts Trash cleanup. Removed the status line and divider; the
Restore-to-Delete layout gap is 4px. Existing raised-button geometry means the
visible button face and its layout box have different bounds. Touch targets
remain at least 44px and deletion still requires confirmation.

Verification used actual components, synthetic account records and isolated
mobile Chromium with external requests blocked:

- `node --test tests/writing.browser.mjs`: 41/43 passed initially. Both new
  typography cases failed because the Trash measurement used the lifted button
  face instead of its shell. Corrected the assertion; no runtime fix was needed.
  Log: `outputs/type-spacing-browser.log`.
- Final `node --test --test-name-pattern="Page spacing across|read and write typography" tests/writing.browser.mjs`:
  4/4 passed. This covers both corrected cases and two added Page audits, bringing
  the distinct passing cases across the runs to 45. Log:
  `outputs/type-spacing-final.log`.
- The Page audit measures 17 states at each of 360px and 390px: Note, Deep
  Thoughts, Routine, Protocol, Log, Week, three Vision declarations, four Athena
  Pages, three Quest categories and Suggestion. All measured top gaps are 48px.
  Initial audit attempts selected Protocol's supporting paragraph and hidden
  Week content; corrected the measurement to the first visible layout anchor.
  Route auditing waits for the outgoing Today session to unmount.
- Note/Deep Thoughts/Habit/Protocol resting frames remain 346px, with 344px
  Pages, 48px header gaps and no internal resting scroll at both widths. Real
  Habit/Protocol rows still grow continuously. Long Note/History/Trash retain
  one Body scroller and the 480px/400.19px tested ceilings. Footer padding is
  25px. Restore and confirmed deletion journeys pass for both writing kinds.
- Computed sizes pass for Note, Deep Thoughts, opened Trash entries, Athena's
  reply, Vision read/edit, Week goals/steps, Chapter short/long questions and
  Workshop previews. Reading-only Chapter cover/info retain 32px type.
- `node node_modules/next/dist/bin/next build`: passed, including TypeScript
  and route generation. Log: `outputs/type-spacing-build.log`.
- `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx tests/writing.browser.mjs`:
  passed. Whitespace verification passed.

Visually inspected `outputs/writing-type-note-390.png` and
`outputs/note-bounded-trash-360.png`. Existing ResizeObserver notifications
remain on navigation/Workshop paths, as recorded by the earlier baseline.
Physical phones, native keyboards, hosted sessions, hidden Week Review flows
and a fresh Vinext build are not certified here. No persistence, cloud,
chapter content, edition or budget changed. No measured performance problem
justified an optimization. The test servers shut down after verification.


## Editable reading typography (2026-11-03)

The developer approved 24px main / 18px body sizes only where people both read
and write. Scoped CSS covers account Note/Deep Thoughts and opened history/trash,
Athena's embedded reply editor, Vision declarations, Week goals/steps and Chapter
short/long text questions with the same Workshop preview. Only sizes change;
list rows, reading-only pages, weights, line heights and spacing retain their
rules. New tests use actual components and synthetic account data, not personal
records or external services.

Commands and results:

- `node --test tests/writing.browser.mjs`: 40/41 passed. The Note header test at
  390px encountered `.os-splash-host` intercepting History during the run across
  06:00. Other cases, including bounded Note/History/Trash at both phone sizes,
  passed. Log: `outputs/type-writing-final.log`.
- `node --test --test-name-pattern="Note header alignment.*390px|reading-only Chapter|read and write typography" tests/writing.browser.mjs`:
  final 5/5 passed. Includes the previously blocked header case and two new
  cover/info exclusions. In total 43 distinct cases have passed across these
  runs. Log: `outputs/type-final-recheck.log`.
- `node --test --test-name-pattern="Vision and Week|real Reflect reading reply" tests/writing.browser.mjs`:
  3/3 passed. Vision read/edit sizes match, corrections save, Week goals/steps
  remain editable, and the actual Athena reply keeps its ledger/source behavior.
- `node node_modules/next/dist/bin/next build`: passed including TypeScript and
  static generation. Log: `outputs/type-next-build.log`.
- `node node_modules/eslint/bin/eslint.js tests/writing.browser.mjs` and
  `git -c core.safecrlf=false diff --check`: passed.

At 360px and 390px, empty Note, Deep Thoughts, Habit and Protocol frames remain
346px (344px Pages), with 80px header gaps and no internal resting scroll.
Short Note remains at its minimum; real Habit/Protocol rows still grow naturally.
Writing/History/Trash remain bounded with one Body scroller. Actual Note image:
`outputs/writing-type-note-390.png`.

Earlier new-test attempts used Add step instead of the actual Add a step toward
a goal label; corrected the selector and reran successfully. ResizeObserver
notifications appear on Workshop/route transitions. A diagnostic with only the
new type block removed also emitted them (`outputs/type-baseline.log`); those
separate layout warnings are not claimed fixed here. Physical phones, hosted
sessions and a fresh Vinext production build remain unverified. No persistence,
day-boundary logic, immutable content, cloud configuration or performance
optimization changed. No further optimization was justified by these checks.

## Quiet Deep Thoughts writing (2026-11-03)

The developer requested removing routine saving/sent and recovered/discarded
messages and the Discard draft control. The shared writing Page now suppresses
these on Deep Thoughts while preserving actual errors, local recovery, Send,
Save changes and Next question. Embedded reading-answer controls remain separate.

Actual-component isolated Chromium checks passed at 360x844 and 390x844 using
synthetic account data; no personal data or external service was used:

- `node --test --test-name-pattern="Deep Thoughts quietly|Deep Thoughts opens directly|failed.*commit" tests/writing.browser.mjs`: 3/3 passed. Held answer,
  correction, reload, silent recovery, cleared draft remaining empty after reload,
  absence of Discard draft, and failed local save/retry verified.
- `node --test --test-name-pattern="normal-motion Deep Thoughts" tests/writing.browser.mjs`: 1/1 passed. Deliberately delayed durable acceptance;
  Footer stays free of routine saving/sent messages both during and after Send.
- `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx tests/writing.browser.mjs`
  and `git -c core.safecrlf=false diff --check`: passed.

The first new assertion matched sent inside the synthetic answer itself. Scoped
it to the Footer and reran successfully; no product fix was required for that
test failure. No geometry/type tokens or persistence commands changed. No new
build, physical-device, cloud-sync or deployed-session certification is claimed.
Existing Admin resize and legacy placeholder gaps remain as recorded below.

## Deep Thoughts and managed quotes (2026-11-03)

### Approval, setup and behavior

The developer approved replacing ordinary Thoughts in Today with Deep Thoughts,
matching Note's History/Trash, keeping an answered question visible with Next
question, and Admin-managed shared quotes. Work began on `paing-branch` at
`2bd8502` with a clean tracked tree. No staging, commit or deployment is included.

The existing Vite harness imports actual Today/Reflect, shared writing/Page/CSS,
Admin and account stores. Synthetic accounts and isolated Chromium use
360x667/360x844/390x844, Bangkok and both motion settings. Quote API responses
are synthetic; other external traffic is blocked. No personal records are read.
The legacy fixture uses only its intercepted transport and is not a migration.

New browser journeys cover direct Deep Thoughts, held answers and reload,
Next question, source-preserving correction, old untitled Thoughts without an
invented question, failed Send/recovered drafts, typing during a delayed save,
question/answer Trash/Restore/Delete forever and retained answered metadata.
History matches Note's controls and bounded Body scrolling. Unsent recovery rows
are marked Unsent. Quotes rotate through a full pool, preserve the live draft and
question, retain reading position across reload, use cached content offline,
honor an empty catalog, and preserve normal-motion travel and Line exits.
Admin checks add/remove confirmation, 44px controls and retained failed input.
The existing Note/Line, Note autosave/failure/conflict, Reflect reply, account
switching and geometry checks remain in the consolidated browser command.

### Verification

The focused model/route selection passed **105/105**. It includes actual
transpiled Admin route handlers with missing/forged/expired cookie and cross-origin
denial before backend access; public versus server key separation; input/failure
handling; pagination when the server returns smaller pages; full 300-quote
rotation; writing compatibility, immutable revisions and account ownership.

The developer reported applying the SQL and saving the ignored server key.
`node scripts/check-quotes-live.mjs --write` then passed against the configured
project: public SELECT, server INSERT, denied anonymous INSERT/DELETE, server
DELETE and a final zero temporary-row check. The catalog was empty before the
test and afterward; no authored quotes were added. The model never received the
secret value. Initial checks saw a missing saved key/table; the developer
completed setup. Sandboxed networking returned EACCES; approved network checks
then succeeded. Shell quoting was corrected before any live request.

The final consolidated actual-component browser run passed **32/32**. Focused
strict types and both Next/Vinext production builds passed. Selected ESLint has
zero errors and the starting shell's one unused `renderChapterTemplate` warning.
The generated Next and Vinext browser outputs were checked: **59 files**, zero
occurrences of the configured Supabase secret or Admin code. `.env.local` remains
ignored and untracked. The 13-record link audit passed 243 local links and 102
heading fragments after final result edits; whitespace checks passed.

`node scripts/check-quotes-live.mjs --app` also passed against the final built
Next app and live catalog: public reading, missing/forged Admin cookie denial,
cross-origin denial, accepted signed Admin add/read/remove and zero remaining
fixture rows. Its temporary loopback server closed afterward. No app was deployed.
The subsequent server-only fixes were rechecked by the 105-case route/model
selection, strict types, production builds and this live HTTP journey; the 32-case
browser run verifies the final writing/CSS and mocked quote/Admin UI behavior.

Commands (direct installed CLIs):

```text
node --test tests/writing.browser.mjs
node --test tests/quotes.test.mjs tests/deep-thought-model.test.mjs tests/writing-model.test.mjs tests/writing-compatibility.test.mjs tests/account-scope.test.mjs tests/admin-access.test.mjs tests/line-pool.test.mjs tests/line-feedback.test.mjs
node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx app/os/circle-os-shell.tsx app/os/admin/quote-editor.tsx app/os/quotes app/os/admin/quotes/route.ts app/os/admin/chapter-editor.tsx tests/quotes.test.mjs tests/writing.browser.mjs tests/deep-thought-model.test.mjs tests/line-feedback.test.mjs scripts/check-quotes-live.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx app/os/quotes/quote-server.ts app/os/admin/quote-editor.tsx
node node_modules/next/dist/bin/next build
node node_modules/vinext/dist/cli.js build
node scripts/check-quotes-live.mjs --write
node scripts/check-quotes-live.mjs --app
git -c core.safecrlf=false diff --check
```

### Attempts, measurements and limits

Early assertions sampled Note after reload instead of opening Deep Thoughts,
sampled frame growth before settling, and used an exact textarea label that
included its controlled text; the harness now follows the actual Page/role.
One intermediate broad run overlapped source HMR/build load and was not final
verification. A clearing-edit assertion now permits extra accepted revisions
while checking original and empty current text. An immediate native caret offset
is sampled after layout has committed. An obsolete source-regex mode test was
replaced by actual-component behavior, and boundary routing is browser-checked.

A repeated small-phone check exposed a real transient Footer gap: the global
reduced-motion duration transitioned every property, showing 0px before 26px.
Adding a render-presence class did not solve it and was removed. Scoped writing
Footers now set `transition-property: none`, retaining the shared Page motion
and gap token; the focused 360x667 run then kept 26px before/after body scrolling.

Live HTTP testing also caught two server integration issues that mocks did not:
Next normalizes loopback IPs in Request.url, so origin checking now uses the
actual Host with the request protocol, keeping host/port and cross-site rejection.
A real NextRequest regression covers this. PostgREST rejected ordering an INSERT
by a column absent from its returned projection; INSERT now selects its returned
fields without a reading-order clause. Actual module and built HTTP add/remove
checks passed afterward. Failed attempts and final runs left zero temporary rows.

The measured resting frames are 346px (344px Page) for Note, Deep Thoughts,
Habit and Protocol at both widths, with an 80px header-box gap. Deep History
ceilings are 480px at 390x844 and 400.19px at 360x667, with one Body scroller.
Existing Habit/Protocol rows still grow naturally. Screenshots inspected include
`outputs/deep-thoughts-history-390.png` and `outputs/quote-admin-390.png`;
motion/return and small-phone captures are retained under ignored `outputs/`.

Admin navigation emits ResizeObserver loop notifications before opening Quotes.
A separate isolated baseline loaded the unchanged HEAD shell, writer, CSS and
Admin using Vite read overrides (no checkout or source replacement): `2bd8502`
also emitted **10** notifications. The current Quotes control journey checks it
adds no notifications after that navigation settles. This existing shared-route
issue remains unresolved; no shared geometry/route engine was modified for it.

Physical phones/keyboards, deployed app/session routes and live authenticated A/B
quote-table sessions were not exercised. The hosted data checks certify the
public/server quote path, not personal sync or beta readiness. The older legacy
Note placeholder concern remains reproducible and unresolved. No personal data
or immutable chapter/reading content changed. No further measured performance
problem justified optimization; pagination fixes completeness rather than
expanding a content budget. See [quote setup](QUOTES.md) and the
[current contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#1412-note-deep-thoughts-and-quotes---2026-11-03).

## Bounded Note pages (2026-11-03)

### Approval and setup

The developer explicitly approved moving New Note from History to the Note
editor Footer, a shared 480px App Box ceiling reduced to 60% of a short dynamic
viewport (never below the shared minimum), Body scrolling and silent Note Trash.
Runtime scope is `writing-pages.tsx`, scoped `os-app.css` and the existing UI
browser tests; owning/continuity records are included. The 254-file baseline and
before-copies are ignored outputs. Branch `paing-branch`, HEAD `8890fb1`;
earlier uncommitted/untracked work is preserved. No staging, commit, deployment,
personal import, schema/store/provider, account/authentication or cloud change.

The actual-component loopback Vite harness uses synthetic account data, real
IndexedDB, Bangkok time and blocked external traffic. Existing 360x844/390x844
cases remain; the new bounded journeys also run at 360x667 and resize to 560px
height. Both normal and reduced motion are covered. Account cases assert no
legacy transport/model requests. The separate legacy placeholder baseline remains
a qualified known defect; these changes do not migrate that editor.

### Checks and measurements

- `node --test --test-reporter=tap tests/writing.browser.mjs`: **23/23 passed**
  in the final run, separately from builds, with no source changes during it.
- New Note appears only in the Note editor Footer. It waits for local saving,
  including typing during an in-flight save, before showing a blank Note. A
  simulated quota failure and unfinished composition keep the current writing.
  Retry/repeated New Note use succeeds without losing accepted entries.
- Long Note content, many History rows, many Trash rows and an opened long
  trashed Note each have exactly one scrolling Body. Last rows remain reachable.
  Native wheel and touch input leave History on the chosen page. Header/Footer
  positions within the frame remain stable while content scrolls. Typing at the
  end of a long Note keeps the caret line visible, with no textarea scroll area.
- Trash retains Restore and confirmed Delete forever/Cancel. Its actions remain
  visible at the ceiling and after a short viewport resize. Navigation and new
  writing reset content to the top. Moving a Note to Trash shows no success text
  or Undo. Error alerts remain, and other writing keeps Send.
- `node --test tests/writing-model.test.mjs tests/account-scope.test.mjs`:
  **35/35 passed**. No model/store changes; regression covers immutable revisions,
  conflicts, empty dated corrections, lifecycle, account epochs and day attribution.
- `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx tests/writing.browser.mjs`:
  final rerun passed with no errors or warnings.
- Strict targeted types passed after the final component sizing change:
  `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx`.
- `node node_modules/vinext/dist/cli.js build` and
  `node node_modules/next/dist/bin/next build`: both passed with exit 0 after
  the final scoped CSS correction. They ran sequentially after the final UI run.

| Measured frame | 390x844 | 360x667 |
| --- | --- | --- |
| Long Note / History / Trash ceiling | 480px | 400.19px |
| Long Note Body | 257px | 177px |
| Opened long Trash Note Body | 152px | 72px |
| Overflowing scroll areas per Note view | 1 | 1 |

At both 360x844 and 390x844, empty/short Note, Thoughts, Habit and Protocol retain
344px Pages/346px frames and an 80px Header box-to-content gap. Visible label
gaps remain Note/Thoughts 84px and Habit/Protocol 83.09px; NOTE/HISTORY tops and
bottoms match exactly. Habit/Protocol rows retain natural growth without nested
scrolling. No shared geometry/type/gap token changed. At a 560px-high viewport,
Note keeps the shared 346px minimum frame instead of shrinking below it.

Inspected screenshots: `outputs/note-bounded-write-390.png`,
`outputs/note-bounded-history-390.png`, `outputs/note-bounded-trash-360.png`.
The corresponding 360px write/history and 390px Trash captures are also saved.
The write and Trash captures intentionally show scrolled content with stationary
navigation/actions. No further runtime optimization was justified by measurements.

### Attempts, preservation and limits

Targeted checks caught the shared CreativeButton's default one-use lifecycle
when moved onto a persistent editor. New Note now uses its existing repeatable
mode, keeps clicks available during short provider refreshes, and guards duplicate
pending starts. Save completion flushes newer typing before replacing the buffer.
Tests now wait for the shared button's registration/focus and normal page-flip
settling; synthetic seeding reads the store result's actual receipt. The targeted
header/New Note checks then passed 3/3 and the bounded journeys passed 2/2.

The first full regression run passed 21/23. A second-tab harness startup timed
out waiting for `window.api` while builds also ran. The row-isolation test began
typing before New Note's shared button registration; it now waits for the blank
editor. The final full run was repeated separately from builds. Vinext
emitted Build complete, but PowerShell redirection converted its plugin-timing
warning into a NativeCommandError; direct CLI execution then passed with exit 0.
These earlier attempts are not counted as final passes.

The next full run passed 22/23: the short-screen caret check caught a transient
22px textarea scroll offset after the shared zero-height sizing pass. Note now
resets that internal field offset after sizing, leaving scrolling to Body. The
affected bounded journeys passed 2/2 after the correction; targeted types passed.

A subsequent full run passed 22/23 and exposed a 26px Trash footer shift on the
short viewport. The Note grid now gives Footer its full intrinsic content row
instead of an automatic row. That alone did not fix the repeated 22/23 result:
diagnostics showed Footer padding briefly at 0px while detail actions were
already present, then 26px after scrolling. The Note rule now attaches that gap
to actual footer content. The final full run passed **23/23**, with stable 26px
padding. Exact Header/Footer and field-offset assertions were not relaxed.

Final `node outputs/note-bounds-audit.mjs`: passed 224 local links, including
89 fragments across 12 records, and whitespace-format checks. The baseline
comparison found exactly 15 approved changed files, 239 byte-identical files and
no Git-visible additions/removals. `git diff --check` passed with existing
LF/CRLF warnings. Baseline, before-copies, screenshots and helper are ignored
outputs; prior working-tree work remains preserved.

Internal recovery/revisions, original day/timezone and account separation remain.
Shared Page/App-back/swipe/button engines are reused; Habit/Protocol, immutable
chapters/readings and no-AI-on-save remain intact. Physical phones/native
keyboards, hosted authentication, cloud/two-device sync, personal migration and
week-long lived acceptance remain unverified. Next: developer use/review of the
bounded Note flow, with migration/sync/publication separately reviewed.

## Note History controls (2026-11-03)

### Approval and setup

The developer approved the Note controls proposal with a final correction:
remove Undo and use the retained Trash page for restoration. Runtime scope:
`writing-pages.tsx`, scoped `os-app.css` and `tests/writing.browser.mjs`.
Owning/continuity records were approved too. The existing 254-file working tree,
including earlier untracked writing files, is preserved. Branch `paing-branch`,
HEAD `8890fb1`; nothing staged, committed or deployed. No personal/legacy import,
schema, store/provider, account/authentication or cloud-service change occurred.

The existing loopback Vite harness imports actual Today/Reflect, provider, Page,
stores and CSS. Checks use synthetic accounts, real IndexedDB, Bangkok time,
360x844/390x844 touch/mobile viewports and reduced/normal motion. External traffic
is blocked, and account cases assert no legacy transport/model calls. The legacy
placeholder baseline remains a qualified known defect outside this refinement.

### Final checks

- `node --test --test-reporter=tap tests/writing.browser.mjs`: **20/20**.
  Note exposes direct HISTORY, with no ellipsis/menu, Versions or Undo controls.
  Routine Saving/Saved on this device text is absent during a delayed save and
  after acceptance. Autosave, offline reload, empty corrections, composition,
  source/question retention, newer typing and account closure still pass.
- The same run verifies that the orange row bin moves only its own Note and
  leaves History open; another Note remains active. Trashed state survives
  reload, and restoration occurs through the Trash page. Restore retains IDs
  and internal revisions; Delete forever still asks for confirmation.
- A recovery row saves its exact stored snapshot before Trash. Simulated quota
  failure keeps both recovery buffers and leaves the row available; retrying
  its bin succeeds. A stale recovery cannot trash a newer accepted Note; current
  saved text stays active and the older text remains recoverable. Legacy sources
  remain read only. Thought/Deep Thought/Reflect answer Send behavior still passes.
- `node --test tests/writing-model.test.mjs tests/account-scope.test.mjs`:
  **35/35**. Models/stores are unchanged in this slice; this focused regression
  selection covers empty dated corrections, conflict preservation, revisions,
  lifecycle rules, account epochs and 06:00/DST attribution.
- `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx tests/writing.browser.mjs`:
  passed with no errors or warnings. No broader lint claim.
- Strict targeted types passed:
  `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx`.
- `node node_modules/vinext/dist/cli.js build` and
  `node node_modules/next/dist/bin/next build`: both passed.

### Alignment, focus and geometry

NOTE/HISTORY have identical measured text tops and bottoms at both widths
(0px difference), with matching Geist, 10px size, 700 weight, 17.2px line-height
and 1.3px letter spacing. Both header targets and row bins are at least 44x44px.
Navigation/bin color resolves to `rgb(227, 107, 55)`. Focused title/body fields
have no outline, border or shadow, remain the active text input and retain a
nontransparent caret. Real Tab/Shift+Tab keeps the bin's keyboard focus visible;
removing the writing box did not remove button focus.

| At 360px and 390px | Note | Thoughts | Habit | Protocol |
| --- | --- | --- | --- | --- |
| Resting Page | 344px | 344px | 344px | 344px |
| Frame with border | 346px | 346px | 346px | 346px |
| Header box to first content | 80px | 80px | 80px | 80px |
| Visible label text to first content | 84px | 84px | 83.09px | 83.09px |

Short writing retains the shared minimum; long writing and actual Habit/Protocol
rows grow without nested scrolling. No shared geometry/type/gap token changed.
Inspected ignored screenshots: `outputs/note-controls-write-390.png`,
`outputs/note-controls-history-390.png`, `outputs/note-controls-trash-390.png`
and `outputs/note-controls-history-360.png` (the latter intentionally shows
keyboard focus on one bin).

### Attempts and limits

The first 17-case run passed 15/17: wrapping header labels in spans moved Note's
visible gap to 81.81px while the header-box gap stayed 80px. Plain text in the
matching header buttons restored the original 84px visible gap; the targeted
geometry/header selection then passed 4/4. The first expanded run passed 19/20:
programmatic focus after touch did not trigger `:focus-visible`. The test now
uses actual Tab/Shift+Tab; its focused rerun passed 1/1, then the final full
20-case run passed. No product focus rule was weakened to pass that check.
No additional runtime performance change was justified.

Final record audit: `node outputs/note-controls-audit.mjs` passed 214 local
links, including 79 fragments across 12 records, and whitespace-format checks.
`git diff --check` passed with existing LF/CRLF warnings. The approval-baseline
audit found exactly 15 approved changed files, 239 byte-identical files and no
Git-visible additions/removals. Earlier uncommitted/untracked work is preserved;
the baseline, before-copies, screenshots and audit helper are ignored outputs.

Internal revisions remain for autosave/conflict safety, with no Note version
browser. The shared schema/provider/store, saved evidence, original dates and
chapter/reading content remain intact. No AI runs on save. Physical phones/native
keyboards, hosted auth, cross-device/cloud sync, personal migration and week-long
lived acceptance remain unverified. The earlier 46/184 selections below are
historical results, not reruns for this UI-only slice. Next: developer use/review
of the simpler Note flow, followed by separately reviewed migration/safe sync.

## Note autosave refinement (2026-11-03)

### Approved scope and setup

The developer approved Note-only autosave and the reference-based UI refinement,
tests and owning records after confirming pause/departure saving and retaining
Send elsewhere. Changes use `writing-pages.tsx`, scoped CSS, the account Note
connection and the existing writing model's empty-correction guard; no provider,
store/schema, personal migration, cloud service or authentication flow changed.
The pre-existing 254-file working tree and untracked writing work are preserved.
Branch `paing-branch`, HEAD `8890fb1`; nothing staged, committed or deployed.

The actual-component loopback Vite/Chromium harness uses synthetic accounts,
real IndexedDB, touch/mobile viewports 360x844 and 390x844, Bangkok time and both
reduced/normal motion. External traffic is blocked; account cases assert no
legacy transport/model calls. The separate legacy baseline retains its known
placeholder defect; this Note refinement does not claim to migrate/fix that path.

### Final checks

- `node --test --test-reporter=tap tests/writing.browser.mjs`: **17/17**.
  Autosave works after a pause, after offline reload/recovery, on leaving the
  editor, pagehide and Today-route departure. Composition defers publication;
  mixed Burmese/English is retained. Focus does not create writing. The writer
  has no manual Save/draft/Clear/Discard controls or draft messages. Orange
  controls resolve to `rgb(227, 107, 55)` with at least 44x44px header targets.
- The same run checks direct History editing, Today/day groups and entry times,
  New Note separation, immutable Versions, Trash/Undo/Restore and confirmed
  deletion. Selecting/deleting all title/body text saves an empty current version
  that survives reload while the original stays in Versions. Erasing a new
  composer before autosave creates no empty History entry. Two older recovery
  copies remain reachable and save once without a Drafts screen. Failed local
  commits keep text and retry once; delayed saves retain newer typing and save
  it subsequently. Another tab's saved correction requires explicit review.
  Account switching cannot move autosave/recovery to the next account.
- Existing Thought, Deep Thought, normal-motion send and actual Reflect-answer
  cases pass in the same UI run, preserving Send, source/question/edition links,
  local acceptance before departure and no automatic Athena reply.
- `node --test --test-reporter=tap tests/writing-provider.browser.mjs tests/writing-storage.browser.mjs tests/account-storage.browser.mjs`:
  **46/46** (16 provider, 19 storage, 11 account storage). These are a separate
  selection, not extra UI scenarios. It checks actual transactions, rollback,
  retry, cross-tab refresh, account epochs, no stale resurrection and attribution.
- `node --test tests/writing-compatibility.test.mjs tests/writing-model.test.mjs tests/account-scope.test.mjs tests/circle-os-model.test.mjs tests/athena-memory.test.mjs tests/vision-declaration.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs`:
  **184/184**. A new model case checks empty existing-Note versions and unchanged
  retries while keeping empty new Notes/Thoughts/answers invalid. Earlier model
  checks retain the 06:00/DST/timezone and immutable reading/chapter boundaries.
- Focused strict types passed:
  `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx`.
- Selected lint:
  `node node_modules/eslint/bin/eslint.js app/os/writing-pages.tsx app/os/writing-model.js app/os/circle-os-shell.tsx tests/writing-model.test.mjs tests/writing.browser.mjs`.
  No errors; the shell's existing unused-import warning is tracked separately
  from the clean component/model/test selection. No full-repository lint claim.
- `node node_modules/vinext/dist/cli.js build` and
  `node node_modules/next/dist/bin/next build`: both passed.

### Geometry and visual verification

| At both 360px and 390px | Note | Thoughts | Habit | Protocol |
| --- | --- | --- | --- | --- |
| Resting Page | 344px | 344px | 344px | 344px |
| Frame with border | 346px | 346px | 346px | 346px |
| Header box to first content | 80px | 80px | 80px | 80px |
| Visible label text to first content | 84px | 84px | 83.09px | 83.09px |

Short Notes retain the shared minimum. Long writing and real Habit/Protocol
rows grow downward without nested scrolling. The final real-row sample measured
Habit at 615.06px and Protocol at 978.27px; transition timing gives different
intermediate growth samples across runs, so these are observed bounds rather
than a new sizing rule. No shared geometry/type/gap token was changed. Note body
text is 18px; headings retain the shared type. Inspected ignored artifacts:
`outputs/note-autosave-write-390.png`, `outputs/note-autosave-history-390.png`,
`outputs/note-autosave-trash-390.png` and the existing geometry screenshot.

### Attempts, boundaries and next action

Baseline model selection passed 26/26 before editing. The first UI run passed
14/15: initial navigation to the unchanged legacy fixture exceeded 30 seconds
during dependency optimization. The fixture now waits for DOM content with a
60-second startup allowance. The next full run passed 15/15. After status/spacing
refinements and two recovery/empty-composer cases, the final full run passed
17/17. Initial unused purity suppressions were removed before final clean lint.
No additional runtime performance change was justified.

Final record audit: `node outputs/note-refinement-audit.mjs` passed all 206
local links, including 71 heading fragments across 12 records, plus whitespace
format checks. `git diff --check` passed with the existing LF/CRLF warnings.
The 254-file approval baseline comparison found exactly 18 approved changed
paths, 236 byte-identical paths and no additions/removals among Git-visible
files. The Chromium GPU `debug.log` created during the browser run was moved
to ignored `outputs/note-refinement-chromium-debug.log`; no pre-existing file
was removed. The audit helper and baseline are also ignored outputs.

The Note UI removes draft management, while internal legacy-named recovery IDs
and the schema remain. Recovery rows are not accepted evidence until saved;
no recovery text was silently discarded. Browser/account closure may stop a
final flush, so only accepted local writes are claimed and durable recovery is
used on return. The ledger remains outside CircleState, its outbox and legacy
payloads. Saving makes no model call and changes no received edition/chapter.

Physical phones/native keyboards, hosted auth, cross-device/cloud sync, personal
legacy import, complete remote/backup deletion and week-long lived acceptance
remain unverified. Local synthetic success does not certify beta readiness.
Next: developer use/review, then separately review personal migration/safe sync.

## Account writing UI (2026-11-02)

### Scope and setup

The developer explicitly approved C: `writing-pages.tsx`, `writing.browser.mjs`,
shell/Reflect/CSS, Page standard, bug record and nine owning/evidence records.
Older writing remains read only pending separately reviewed migration. Branch
`paing-branch`, HEAD `8890fb1`; pre-existing A/B1/B2 work was preserved. No real
owner data, mapping/import, remote account/service or deployment was changed.

The isolated loopback Vite harness imports actual Today/Reflect, provider,
stores, Page and CSS modules. It uses synthetic accounts, real IndexedDB,
Bangkok timezone, touch viewports 360x844 and 390x844 with a proper mobile
viewport, and reduced/normal motion. External traffic is blocked. A legacy-only
fixture intercepts its loopback profile transport; account tests assert no
legacy transport calls. No production test route or authentication bypass was
added. This does not certify hosted Supabase sign-in or a physical keyboard.

### Results

- `node --test tests/writing.browser.mjs`: 13/13. Focus alone creates no writing;
  Note recovers after reload, saves offline, stays saved and offers New Note.
  Corrections preserve immutable versions. History, version reading, Trash,
  Undo, Restore and confirmed Delete forever use the actual controls.
- The same run checks normal Thoughts, Deep Thought source retention, the real
  Reflect reading reply and edition link; failed commits retain the buffer;
  cross-tab corrections require review; A/B/A returns only that account's draft;
  newer typing survives delayed Save; normal-motion text waits for durable
  acceptance before departure. Draft discard preserves the saved entry. Clear
  keeps an empty draft unsaved; a body-only correction records an empty title
  as a new version, rather than removing the field or restoring older text.
- `node --test tests/writing-provider.browser.mjs tests/writing-storage.browser.mjs tests/account-storage.browser.mjs`:
  46/46 (16 provider, 19 writing storage, 11 account storage).
- `node --test tests/writing-compatibility.test.mjs tests/writing-model.test.mjs tests/account-scope.test.mjs tests/circle-os-model.test.mjs tests/athena-memory.test.mjs tests/vision-declaration.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs`:
  183/183. These are a separate model selection, not extra UI scenarios.
- ESLint API selection: `app/os/writing-pages.tsx`, `app/os/circle-os-shell.tsx`,
  `app/os/mirror/page.tsx`, `tests/writing.browser.mjs`. No errors; one existing
  shell unused-import warning (`renderChapterTemplate`). No full-repository
  lint claim. Two local purity suppressions document event-only active-writing
  clock reads followed through button callbacks by the React compiler.
- Focused types: `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-pages.tsx` passed.
- `node node_modules/vinext/dist/cli.js build` and
  `node node_modules/next/dist/bin/next build` passed. NVM rejected the npm
  entrypoint as untrusted; no trust setting was changed. The repository-local
  framework CLIs were used for these builds.

### Geometry and visual check

| At both 360px and 390px | Note | Thoughts | Habit | Protocol |
| --- | --- | --- | --- | --- |
| Empty Page height | 344px | 344px | 344px | 344px |
| Frame including border | 346px | 346px | 346px | 346px |
| Header box to first content | 80px | 80px | 80px | 80px |
| Visible label text to first content | 84px | 84px | 83.09px | 83.09px |

Short Note equality, long writing growth, and real Habit/Protocol row growth
were measured without nested scrolling. An inspected generated screenshot is
`outputs/writing-ui-390.png` (ignored artifact, not a committed design asset).
Header actions keep 44px targets outside label flow. No token or shared layout
engine was changed. The earlier 420px measurements came from a fixture missing
the viewport meta tag and were superseded by the mobile measurements above.

### Attempts and remaining boundaries

Final review: the 252-file pre-C SHA-256 baseline found exactly 14 approved
existing paths changed, two new UI/test files, 238 unchanged files and no
removals. Prior engine/provider/adapter source and tests are unchanged by C.
The two new files are untracked alongside five pre-existing untracked files;
nothing was staged. All 187 local links, including 62 heading fragments, passed
across the 11 approved Markdown records. `git diff --check` passed with the
existing LF/CRLF warnings. This audit includes the final evidence text.

Fixture fixes: the registry is an array, session selectors use the actual
container, artificial Habit completion has archived setup markers for an empty
measurement, and legacy requests are intercepted at loopback. A slow concurrent
run hit a navigation timeout; final checks run against the corrected fixture.
An empty-save test exposed an overly permissive UI guard; Save now matches the
approved rule that completely empty writing cannot be saved. Legacy's original
placeholder bug remains reproducible and is not called fixed by the account UI.

No private writing was imported; no cloud acknowledgement, server merge,
cross-device/native-phone behavior, complete old-writing migration, broader
deletion coverage or week-long lived acceptance is claimed. Other-tool histories
and sign-in polish remain separately reviewed work.

## Account-bound writing provider (2026-11-02)

### Approved scope and setup

The developer explicitly approved the reviewed B2 scope and later said to
continue. New `app/os/writing-provider.tsx` and `tests/writing-provider.browser.mjs`;
updates to writing store/model/types, compatibility model/types, shell, Deep
Thought/first-use models/types, Reflect and five affected tests; nine approved
plan/product/architecture/continuity/evidence records. Branch `paing-branch`,
HEAD `8890fb1`. Ten tracked modifications and three untracked B1 files were
present initially and are preserved. No personal data, owner mapping/import,
environment, external profile server, remote account/service or deployment changed.

Baseline before edits: the existing 177-case focused selection and 29 storage-
browser cases passed. Other overlapping read-only selections passed 93/93 and
83/83; these are not additional unique coverage. New browser tests use ephemeral
loopback Vite pages importing the actual provider/store, real isolated IndexedDB,
synthetic accounts, mobile touch at 390x844/360x844, Bangkok timezone and blocked
external requests. They add no production test route/auth bypass and use no
owner browser, private writing, hosted account or AI provider.

### Behavior checked

- Account epochs, delayed IndexedDB opens, hashing and captured callbacks:
  closed A/B/A or logout work cannot populate another session. Older hashes
  cannot replace new inputs or a newer committed entry in the same account.
- Actual commits/reloads, draft recovery, saved corrections and earlier Versions:
  views come from current storage. Retrying an old successful Save after deletion
  returns its receipt without restoring an entry/history/evidence.
- Two tabs with BroadcastChannel and with storage-event fallback: notifications
  refresh saved views; competing corrections retain accepted and candidate text.
  An older in-flight action cannot replace the latest action status/newer typing.
  Cross-tab old-answer snapshots stay fresh across later writing notifications.
- Failed local reads/writes, recovery and stable-operation retry: failed saves
  preserve drafts; committed saves with failed refresh remain saved alongside a
  separate read error. Notification failures cannot undo accepted writes.
- Permanent local deletion: only question/use metadata survives; answer/version/
  draft text is removed. Metadata survives actual store reload, keeps questions
  answered and skips first-use greetings. Missing older metadata stays unknown.
- Exact current writing dependencies gate derived context. Mixed/unknown/stale/
  forgotten sources are withheld; duplicate observation IDs cannot borrow another
  item's valid dependencies. Independent unscoped day/tool context retains its
  existing path. Received prose/editions are copied separately and unchanged.
- The actual CircleStateProvider mounts the writing provider for accounts and
  opens no writing ledger for legacy mode. Ledger writing/drafts do not enter
  CircleState/profile answers, its outbox or `buildServerPayload`; saves do not
  mutate stored Athena memory or make an external model/backend request.

### Commands, results and attempts

| Check | Result |
| --- | --- |
| `node --test tests/writing-compatibility.test.mjs tests/writing-model.test.mjs tests/account-scope.test.mjs tests/circle-os-model.test.mjs tests/athena-memory.test.mjs tests/vision-declaration.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs` | 183/183 passed on the final model/type input changes; six added behavioral cases over the 177-case baseline. |
| `node --test --test-reporter=tap tests/writing-provider.browser.mjs tests/writing-storage.browser.mjs tests/account-storage.browser.mjs` | 46/46 passed on the final source: 16 provider, 19 writing-storage and 11 account-storage cases; final reported duration about 50.8 seconds. |
| `node node_modules/eslint/bin/eslint.js app/os/writing-provider.tsx app/os/writing-store.ts app/os/writing-model.js app/os/writing-model.d.ts app/os/writing-compatibility-model.js app/os/writing-compatibility-model.d.ts app/os/deep-thought-model.js app/os/deep-thought-model.d.ts app/os/first-use.js app/os/first-use.d.ts tests/writing-provider.browser.mjs tests/writing-storage.browser.mjs tests/writing-model.test.mjs tests/writing-compatibility.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs` | Passed on the final source. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --allowJs --checkJs false --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler --jsx react-jsx app/os/writing-provider.tsx` | Passed targeted strict provider/contracts typing. Imported JavaScript is included for inference, not strict `checkJs` certification. |
| `node node_modules/eslint/bin/eslint.js app/os/circle-os-shell.tsx app/os/mirror/page.tsx --format json` | Shell retains nine errors/one warning, with the same rule/severity sequence as `git show HEAD:app/os/circle-os-shell.tsx` through ESLint stdin; Reflect has zero diagnostics. This is not a full-lint pass. |
| `node node_modules/next/dist/bin/next build` | Passed after the raw-memory input-type correction, including TypeScript and static generation. |
| `node node_modules/vinext/dist/cli.js build` | Passed after the Next pass. Existing unknown-route classification notice and plugin timing warnings remain. |

Initial focused run had one failure in an existing source-call assertion after
adding the explicit read-view argument; its expectation was updated. The next
78-case selection passed. Initial new-provider browser run passed 11/13: both
Versions reads occurred before React published the refreshed view and received
the intended refreshing error. The harness now waits for the observable ready
state. Expanded runs passed 45/45, then 46/46 after a competing-action check.

Initial targeted TypeScript without JavaScript inference could not find a
declaration for the existing `circle-os-model.js`; including JS for inference
resolved that targeted setup. Initial new-provider lint found a render-time ref
read and two dependency warnings; these were removed. The first Next build then
found that existing raw-memory arrays can contain incomplete records while the
input type required an ID. The input now honestly permits raw records; runtime
selection still rejects missing IDs/dependencies. The next Next build passed.
Patch context failures applied no files before corrected patches. Verbose lint
JSON exceeded output limits; reduced summaries confirmed
the same baseline shell counts/rules. No runtime fix was hidden by test retries.

The nine-record read-only link/format audit passed 175 local links including
51 heading fragments. `git diff --check` passed with existing LF/CRLF warnings.
The 250-file startup SHA-256 comparison found exactly 25 approved existing-file
changes and two approved additions, 225 unchanged and no removals. Normalized
suffix hashes preserve the complete earlier task/handoff/journey histories;
pre-existing memory-model/test files retain their startup bytes. No staging,
commit, push or deployment occurred.

### Limits and next action

This proves the local provider/read-view slice, not the future product editors,
history/Trash controls, week-long writing journey or sign-in polish. Existing
Note placeholder/blur and premature Sent paths remain unchanged. Actual Reflect
route/swipe fixtures remain a separate unresolved gap; this provider harness
checks its shared memory input, not the whole Reflect gesture journey.

No geometry/type/gap tokens, budget, immutable chapter or received edition changed;
no new geometry measurement or justified performance optimization is claimed.
Existing account/clearing, local atomicity and 06:00/DST regressions passed.
If both cross-tab notification channels fail, refresh waits for foreground;
old whole-state concurrency is unchanged. Full lint/broad suite/repository-wide
TypeScript, real phones/other browsers, hosted auth/session/device, real import,
Supabase evidence sync, backup/complete deletion and AI quality remain unverified.
Phase 1/beta readiness is not certified. Next: C's exact UI/routing/file/check
review and manual approval; personal migration/cloud/deployment remain separate.

---

## Writing compatibility and evidence adapter (2026-11-02)

### Approved scope and setup

Developer-approved scope: new `app/os/writing-compatibility-model.js`, its type
declaration and `tests/writing-compatibility.test.mjs`; existing memory model and
memory tests; eight plan/product/continuity/evidence records. Branch
`paing-branch`, starting HEAD `8890fb1`; initial working tree clean. No real
profiles/day records, environment files, external vault, remote service,
account mapping/import, provider/UI activation or deployment changed.

Read-only baseline before edits: 127 selected model/account/memory/declaration
checks, 19 Deep Thought/first-use checks and 29 isolated storage-browser checks
passed. Extra synthetic probes reproduced stale fact capture after a legacy
answer correction, forgotten-fact resurrection on merge, incomplete composite
invalidation and discarded source-version metadata. Those legacy live paths
are not declared fixed merely because the new unmounted gate handles them.

### Behavior verified

The adapter takes explicitly same-owner snapshots; a legacy snapshot is not
assigned to a login. It reads without changing inputs, writing storage or
calling a model. Existing Note title/body form one source with preserved IDs,
exact text and per-field provenance. Start/day/timezone remain null when
unknown. Canonical field edit time is labelled separately; ambiguous timestamp
text remains original metadata. Repeated reads are stable; a correction changes
a comparison fingerprint without inventing lost authored versions. Distinct
entries with the same words stay distinct. Competing same-ID answers fail.

Explicit supplied links rehearse deduplication only. Unknown/cross-owner,
many-to-one, split-Note and cross-kind mappings fail. An old snapshot cannot
become fallback evidence after a mapped source is trashed/deleted. No mapping
is generated or persisted and no actual import/backup/rollback is verified.

Current saved active versions supply writing evidence; drafts and older saved
versions do not. Exact Burmese, English and mixed text survives without an
English-regex eligibility gate. Question sources remain intact; missing old
edition links are not invented. Trash keeps Deep Thought question metadata but
not answer text in the read view. Restore retains the same source/version.
Permanent-deletion question/first-use metadata still needs review before live use.

Every writing-derived ledger/taste/rhythm/portrait/curiosity item needs current
owner/namespace/type/ID/version dependencies. A missing, malformed, unversioned,
stale, trashed, deleted, forgotten or suppressed dependency withholds the whole
item. Scoped references survive merges, including distinct versions and invalid
markers; subtracting a citation does not revalidate a composite's wording.
Existing suppression/forget corrections still block a stale merged item.
Received prose/editions are copied separately without mutation or publication.
An old successful Save receipt cannot reconstruct an entry deleted in current state.

### Commands, attempts and actual results

| Check | Final result |
| --- | --- |
| `node --test tests/writing-compatibility.test.mjs tests/writing-model.test.mjs tests/account-scope.test.mjs tests/circle-os-model.test.mjs tests/athena-memory.test.mjs tests/vision-declaration.test.mjs tests/deep-thought-model.test.mjs tests/first-use.test.mjs` | 177/177 passed, including 29 new adapter cases and two added memory cases. |
| `node --test --test-reporter=tap tests/writing-storage.browser.mjs tests/account-storage.browser.mjs` | 29/29 passed using the existing isolated harnesses at 390x844/360x844. |
| `node node_modules/eslint/bin/eslint.js app/os/writing-compatibility-model.js app/os/writing-compatibility-model.d.ts app/os/athena-memory-model.js tests/writing-compatibility.test.mjs tests/athena-memory.test.mjs` | Passed after the fixes. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler app/os/writing-compatibility-model.d.ts app/os/writing-store.ts` | Passed. This checks the declarations/store, not strict static typing of all JavaScript implementation. |
| Strict in-memory TypeScript consumer via `node --input-type=module` | Passed. Compiler-host virtual source exercises adapter inputs/outputs, required source version and readonly views; no file is written. |
| `node node_modules/next/dist/bin/next build` | Passed, including Next's TypeScript/static generation. |
| `node node_modules/vinext/dist/cli.js build` | Passed; existing unknown-route classification notice remains. |

The initial adapter/memory run passed 50/50. Review then added three checks:
`node --test --test-name-pattern='forgetting one versioned|malformed dependency|different writing kind' tests/writing-compatibility.test.mjs`
failed 3/3. One forgotten dependency left a composite active; malformed metadata
disappeared on merge; a link could hide a Note behind a Thought. Fixed by
withholding affected versioned items, retaining an invalid scoped dependency
marker and checking target kind. The full final selection passed 177/177 after
those changes; lint and both builds also ran after them. Counts from overlapping
runs are not added as unique coverage.

An additional ad-hoc `node --input-type=module` Vite/Playwright smoke passed at
both phone widths. It imports the actual account-scope, model/store and adapter
into an ephemeral loopback-only page; contexts have Bangkok time, mobile touch,
isolated synthetic accounts and all external requests blocked. Steps: save a
Burmese/English Deep Thought through real IndexedDB; read an unknown-date existing
answer; supply a link and verify one current source; select version-linked
memory; Trash and check no evidence/one answered question; Restore; Trash/delete;
retry the old Save and reload. Text, source counts, exclusions, reading bytes and
deleted state were asserted with no page errors. This is two direct module/store
browser checks, not a persistent new browser fixture or a product UI journey.

An initial baseline capture included too much history text and exceeded output
limits; a hash/length-only retry captured 247 Git-visible files without edits.
Two documentation patches failed context validation and applied no changes;
corrected patches succeeded. No code optimization was justified by a measurement.

The final eight-document audit passed 155 local links, including 38 heading
fragments, plus conflict-marker/fence/format checks. `git diff --check` passed
with existing LF/CRLF warnings. The 247-file startup hash comparison found
exactly ten approved existing paths changed and the three approved new files;
237 existing files stayed unchanged, with no removals. Normalized history hashes
preserved all earlier task/handoff/journey text and reconstructed the earlier
Decision Log exactly after removing only this pass's new entry. No staging or
commit occurred.

### Limits and next action

The adapter is unmounted. It requires fresh owned snapshots and is not an auth
boundary, account-epoch guard, live subscription, importer, cloud outbox or
complete Athena evidence selector for other domains. The later provider must
rebuild it after writes/cross-tab changes, reject old-session results and render
current state rather than old receipts. Existing editors/transport still use
their original paths. The stored ledger/schema and personal data were untouched.

No geometry, type/gap token, budget, chapter or authored-edition content changed;
no geometry measurements are claimed. Existing local-first/account/06:00/DST
regressions passed. Provider/editor/history journeys, physical phones/other
browsers, hosted refresh/revocation/devices, real import/sync/backup/deletion and
AI language quality remain unverified. Existing placeholder/Sent and Reflect
fixture/swipe gaps remain; Phase 1 is not certified. No full lint/broad suite or
standalone repository TypeScript result is claimed beyond the checks above.
Next is an exact account-bound provider proposal, followed by separate UI review.

---

## Local writing engine (2026-11-02)

Approved scope: five new local-engine/type/store/test files, plus personal-records
plan, current task, handoff and this evidence record. Branch `paing-branch`,
HEAD `f08c117`; the four existing modified documentation paths are preserved.
No live UI/provider/legacy transport, personal records, environment, database
service or remote setting was edited. Nothing staged, committed or deployed.

### Setup and actual coverage

`tests/writing-storage.browser.mjs` starts a test-only Vite harness on an
ephemeral loopback port, importing the actual model/store/account-scope modules.
Chromium contexts use Bangkok time, mobile touch and 390x844 or 360x844 viewports.
Each context has isolated synthetic browser storage; external requests are
blocked. There is no production test route, account bypass or new app control.
The browser cases exercise IndexedDB directly through the actual public store
API. These are local-storage integration checks, not the future writing UI.

At both widths, the browser checks recover a draft after reload, exclude it from
saved history/evidence, save it as Untitled, retry the same request after a
simulated lost response/reload, correct it with the earlier version retained,
and keep two Notes/day. Offline operations run while the harness is already
loaded; reconnection followed by reload retains both a saved Note and a draft.
There is no claim of offline app-shell loading/reloading from this test harness.
Trash hides entries and their edit drafts; Restore preserves identity/versions/
drafts; confirmed deletion and stale-retry rejection survive reload.

Further browser cases establish request-success before transaction completion
before promise resolution; abort after put success rolls back content and its
receipt together. Injected `QuotaExceededError` on an actual transaction's put
leaves the prior draft/version intact, rejects the operation and allows the
same Save to retry once. Unavailable IndexedDB rejects reads/writes; unknown
schema bytes remain unchanged rather than being reset. Separate draft-update
failure rejects instead of claiming the newer editor text is recoverable.
These are synthetic injected failures, not a device filled to its physical limit.

Account cases preserve a legacy localStorage sentinel, keep A/B records separate,
reject owner-mismatched requests, and reject delayed reads or writes across
hashing/session change and live transaction abort. Two actual tabs preserve
unrelated entries and competing corrections: one accepted version and one
recoverable candidate, with no duplicate recovery copy. A real Save/draft-update
race retains newer typing. A 05:50 start/06:10 save retains the starting Circle day,
timezone, actual save time and unknown occurrence time after browser reload.
Final browser contexts recorded no uncaught page errors.

Model cases additionally check unchanged-save suppression, tag normalization,
immutable original source/question/edition links, clone-isolated read views,
discard/stale-discard handling, both Save/draft-update commit orders, explicit
conflict resolution, immutable earlier versions, deliberate backdating and
travel, both New York DST transitions, canonical timestamp/named-timezone
validation and content-free deletion metadata. A's evidence selector excludes
drafts/Trash/deletion; existing Athena/legacy-source integration remains B work.

### Commands and results

| Command | Final result |
| --- | --- |
| `node --test tests/writing-model.test.mjs tests/account-scope.test.mjs` | 33/33 passed: 25 new model cases and eight existing account-scope cases. |
| `node --test --test-reporter=tap tests/writing-storage.browser.mjs` | 18/18 passed; final reported suite duration about 8.4 seconds, including setup. |
| `node node_modules/eslint/bin/eslint.js app/os/writing-model.js app/os/writing-model.d.ts app/os/writing-store.ts tests/writing-model.test.mjs tests/writing-storage.browser.mjs` | Passed on the final five files. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false --strict --skipLibCheck --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution bundler app/os/writing-store.ts` | Passed; checks the new store and imported type contracts without repository build/cache output. |

Baseline before edits: `node --test tests/account-scope.test.mjs` passed 8/8.
Initial implementation passed 31/31 model/account cases and 15/15 storage cases.
Review then added three focused edge assertions. The command
`node --test --test-name-pattern='conflicting saved correction|timestamps require|Trash hides' tests/writing-model.test.mjs`
failed 3/3: conflict recovery duplicated an already durable candidate, timestamp
validation accepted ambiguous dates, and ordinary draft recovery included
trashed entries. The fixes reused an existing identical candidate, required
canonical UTC/named timezone input, and hid associated drafts until Restore.
After these fixes the full model/account run passed 33/33 and storage passed
15/15. The three final additional storage cases cover the actual Save/update
race, failed draft update and browser timestamp round-trip; the final complete
storage run passed 18/18 and focused lint passed again. Earlier attempts are
not added together as separate unique coverage.

Documentation review passed 88 local links including 29 heading fragments across
the plan, current task, handoff, this record and the preserved decision log.
Whitespace/tables/fences/conflict-marker checks and `git diff --check` passed
with existing LF/CRLF warnings. A 242-file startup hash baseline found only the
four approved record changes, 238 unchanged files and five approved new files,
with no removals. Hash checks preserved each startup historical tail after
newline normalization and the decision log byte-for-byte. New-file formatting
checks also passed. These are document/scope checks, not further runtime tests.

### Limits, invariants and next action

This is the new local engine, not a connected multi-entry editor or general
history UI. Actual New Note/Save/Send/Versions/Undo/confirmation placement,
failure/recovery wording, focus, accessibility and idle/swipe integration still
need B/C implementation and app/browser verification. The existing Note
placeholder fallback and premature Sent source concerns are unchanged.
No full app build, broad suite/lint, repository TypeScript, chapter check,
physical phone/other browser, hosted auth/revocation, Supabase evidence sync,
backup/restore or personal import ran for A. Earlier Reflect fixture/swipe and
tooling gaps remain. Local deletion does not certify remote/derived/log/backup
deletion. Phase 1 is not certified.

The engine reused scoped transactions and verified local atomicity, retry,
account separation, no stale resurrection and local 06:00/DST behavior. No App
Box geometry/type/gap, published chapter/reading, cadence/budget or personal state
changed. No new geometry measurement is claimed. No performance optimization
was justified; the whole-ledger layout is not a measured large-history/startup
budget. Future capacity/retention work must preserve saved versions, drafts,
receipts and deletion protection until a reviewed replacement exists.

Next: review the compatibility/evidence contract and precise B file/check scope
before code, including legacy ownership/unknown dates and invalid derived
context. UI, real import, SQL/cloud work and deployment remain separately reviewed.

---

## Hosted Supabase connection - 2026-10-31

Developer follow-up: after guided Gmail SMTP/template setup, the developer
reported successful sign-in to Circle OS. This is user-reported evidence only;
the agent did not observe the complete journey or inspect final SMTP/templates.
The developer subsequently reported that password reset and logout also work;
these are user-reported results, not agent-observed journeys. Sign-in UI/UX
changes are deferred.

Basic offline return passed in developer testing at the local app address:
Wi-Fi was turned off and the page reloaded; an existing note remained. The
developer edited while offline, reconnected, and confirmed the notes remained.
A further online reload retained those edits. This is user-reported evidence of
local persistence across reload and reconnection. Device/browser details and
network traces were not supplied, and the agent did not observe the journey.
It does not verify Supabase evidence sync (not implemented), cloud backup,
cross-device access or remote session revocation. Refresh/revocation and
cross-device cases remain unverified.

Approved setup scope: project/login configuration, synthetic verification and
evidence. Developer created the project and supplied public connection details.
Ignored `.env.local` selects Supabase mode with its URL and publishable key.
No personal data migration or remote setting change occurred.

Read-only PowerShell `Invoke-RestMethod` requests checked `/auth/v1/settings`
with the public key and `/auth/v1/.well-known/jwks.json`. The initial sandboxed
network attempt failed; an approved retry succeeded. Observed email auth enabled,
`mailer_autoconfirm=false`, `disable_signup=false`, and an EC/ES256 signing key.
Thus confirmation was required, but public signup initially needed disabling.
After the developer changed settings, a read-only settings recheck returned
`external.email=true`, `disable_signup=true`, and `mailer_autoconfirm=false`.
Public signup is now disabled and confirmation remains required. The sandboxed
attempt failed; the approved network retry succeeded. This checks public settings,
not email delivery or a complete hosted account journey.

`node --test tests/supabase-auth.test.mjs`: 10/10 passed. These are focused
synthetic auth tests, not hosted user journeys. No new build/browser verification.
Browser automation stopped because it could not verify Opera's URL. SMTP,
origin/redirects, templates, invitation/password setup, actual login/refresh,
recovery, logout/revocation and offline return remain unverified. Restart the
development server and fully reload after the environment change.

---

## Development onboarding test mode - 2026-10-31

Approved scope: development-only `test` auth mode, isolated synthetic state,
fresh-session action, persistence on reload, production rejection, tests, and
implementation records. This extends the uncommitted login implementation;
HEAD remains `e3dcb3e`. `.env.local`, the existing owner and remote services
were not changed. All browser records below are synthetic, isolated and local.

`tests/development-test-mode.browser.mjs` seeds distinct legacy/account/auth
sentinels and a real-account selection marker before opening the actual app.
At 390x844 and 360x844 it checks Day One without login/name/age, saves priority,
reloads into direction on the same test owner, starts a new empty test, and
checks that the first run and all real/legacy/auth sentinels remain. The control
works above the onboarding splash. External requests are blocked and counted;
final cases made none. No final page errors occurred. Production case checks
the locked configuration screen, absent test controls/reader, and absent test
marker. Browser timezone is Bangkok.

Final commands and results:

- With `NEXT_PUBLIC_CIRCLE_AUTH_MODE=test` and `TZ=Asia/Bangkok`, start
  `node node_modules/vinext/dist/cli.js dev --hostname 127.0.0.1 --port 3222`.
  Build Next with `NEXT_PUBLIC_CIRCLE_AUTH_MODE=test` using
  `node node_modules/next/dist/bin/next build`, then start it on `127.0.0.1:3218`.
  Set `CIRCLE_PRODUCTION_TEST_MODE_ORIGIN=http://127.0.0.1:3218` and run
  `node --test --test-reporter=tap tests/development-test-mode.browser.mjs`:
  **3/3 passed**, including actual production rejection.
- Start Next development on `127.0.0.1:3223` with the same test flag. With
  `CIRCLE_TEST_ORIGIN=http://127.0.0.1:3223`, run the same file: **2/2 development
  cases passed**; the optional production case was skipped in that run.
- The preceding focused command with the same twelve test files now passes
  **103/103**, adding two namespace/production-guard cases to account-scope tests.
- `node --test --test-reporter=tap tests/account-storage.browser.mjs`:
  **11/11 passed**. `node --test --test-reporter=tap tests/supabase-auth.browser.mjs`:
  **10/10 harness cases passed**, with two optional Supabase production cases
  skipped because the production server in this slice used `test` configuration.
- `node node_modules/eslint/bin/eslint.js app/os/account-scope.js app/os/account-scope.d.ts app/os/auth tests/account-scope.test.mjs tests/development-test-mode.browser.mjs`:
  passed. Vercel TypeScript passed. Next and Vinext production builds passed
  with the test flag; default legacy build artifacts were restored afterward.
- Read-only document audit: **36 local links/fragments passed**.
  `git diff --check` passed with existing LF/CRLF notices.

Initial attempts: Vinext with its default localhost binding was not reachable
at the test's IPv4 address; startup also emitted declaration-file scan warnings.
Using the explicit IPv4 host opened the server. Initial optimizer reloads then
reported invalid-hook/multiple-renderer messages; a clean restart after dependency
optimization passed both cases with no source/framework configuration change.
The test initially read state before the provider's first save and seeded the
Next dev tools' sandboxed frames. It now waits for persisted state and seeds
only its own origin. Those failed attempts are not counted as verification.

No shared App Box geometry, chapter versions, budget, Athena, merge/clearing or
06:00-day rule changed. No new geometry measurements or broad optimization are
claimed. Hosted auth/SMTP, physical phones, prior Reflect failures, broad
lint/suite and dependency-audit gaps remain as recorded above/below. Test mode
never authorizes a server request or claims legacy data for a new account.

---

## Supabase account entry - 2026-10-31

### Scope and isolation

Approved browser login slice: invitations only, confirmed email, password entry
and recovery, alias, persistent sessions, offline local use, and logout. No real
account, owner profile/day records, provider, or hosted Supabase project was
accessed. The existing `.vscode/settings.json` was preserved. Branch
`paing-branch`, starting HEAD `e3dcb3e`; application changes remain uncommitted.

`tests/supabase-auth.browser.mjs` bundles a static harness importing the real
auth boundary, official SDK, provider, and local stores. Its isolated Auth fixture
signs ES256 JWTs and intercepts token, user, verification, recovery, logout, and
JWKS requests at a synthetic origin. All other external traffic is blocked.
The two production cases use the actual Next app at `127.0.0.1:3218`. Chromium
viewports are 390x844 and 360x844 with Bangkok timezone. The actual service worker
and `context.setOffline(true)` verify cached navigation/code, rather than merely
mocking an online flag. Generated harnesses/screenshots stay under ignored `work/`.

### Final checks

- `node --test tests/account-scope.test.mjs tests/day-one.test.mjs tests/day-one-simplification.test.mjs tests/phases.test.mjs tests/chapter-engine.test.mjs tests/day-door.test.mjs tests/protocol-home.test.mjs tests/first-use-setup.test.mjs tests/habit-identity.test.mjs tests/chapter-capabilities.test.mjs tests/chapter-splash.test.mjs tests/supabase-auth.test.mjs`: **101/101 passed**.
- Build Next with `NEXT_PUBLIC_CIRCLE_AUTH_MODE=supabase`,
  `NEXT_PUBLIC_SUPABASE_URL=https://circle-auth.test`, and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=synthetic-publishable-key`, using
  `node node_modules/next/dist/bin/next build`. Start with
  `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3218`.
  With `CIRCLE_AUTH_PRODUCTION_ORIGIN=http://127.0.0.1:3218`, run
  `node --test --test-reporter=tap tests/supabase-auth.browser.mjs`:
  **12/12 passed, none skipped** on final application code.
- `node --test --test-reporter=tap tests/account-storage.browser.mjs`:
  **11/11 passed**. Earlier storage invariants remain covered.
- Rebuilt Next in default legacy mode, started the same production server,
  then ran `node --test --test-reporter=tap tests/day-one.browser.mjs` with
  `TZ=Asia/Bangkok`: **9/9 passed**. Existing Day One, old-version resume,
  publication/Quest paths, and Protocol/Week setup remain covered.
- `node node_modules/next/dist/bin/next build` passed in Supabase and default
  legacy modes, including the Vercel TypeScript configuration.
- `node node_modules/vinext/dist/cli.js build`: passed; existing route
  classification limitations remain. No server configuration was published.
- `node node_modules/eslint/bin/eslint.js app/os/auth app/os/pwa-register.tsx public/os-sw.js tests/supabase-auth.test.mjs tests/supabase-auth.browser.mjs app/os/layout.tsx app/os/mirror/page.tsx`: passed.
- Shell ESLint JSON diagnostics were compared against `git show HEAD:app/os/circle-os-shell.tsx`
  using `--stdin --stdin-filename app/os/circle-os-shell.tsx`. Both retain
  six memoization, two purity, and one immutability errors, plus one unused-import
  warning. The changed condition adds no diagnostic; full lint is not clean.
- A read-only Node audit checked 34 local document links/fragments: passed.
  `git diff --check` passed with existing LF/CRLF notices.

Coverage includes A/B login and return, reload, retained legacy bytes, empty
other-account state, wrong credentials, unconfirmed email, reset request,
invalid/expired links, invitation password/alias steps, password-step reload,
successful recovery retaining evidence, offline reload with an expired signed
proof, offline edits and logout, reconnect rejection, cross-tab logout, delayed
session checks, forged markers/proofs, and invalid configuration. Production
accounts enter Day One without real name/age and can log out above its splash.
No final browser page errors occurred. Synthetic login/logout screenshots at
both widths were inspected; login had no horizontal overflow and its account
touch target measured at least 44px. Shared App Box tokens were not changed.

### Attempts, fixes, and remaining limits

The npm shim was blocked by NVM, so installation used the installed npm CLI
directly; network installation required escalation. Initial interrupted network
installation and two incorrect CLI paths are not successful checks. Installation
reported 43 audit findings across the dependency tree; they were not triaged
here. The new dependency versions are pinned in the manifest/lockfile.

Early development-harness offline runs failed due to environment/caching and
readiness issues; the harness now builds static production-style resources.
Subsequent checks exposed the root `/os` scope, first-load asset priming, and
client-claim timing. The worker now awaits claims and acknowledges completed
cache priming before the test disconnects. A production run exposed the splash
blocking the account control; its menu now stays above the splash without
unmounting the underlying form. All affected cases were rerun after these fixes.

Synthetic Auth responses do not certify actual email delivery, invitation-only
project settings, real token rotation/revocation, redirect configuration, hosted
policies, or phone/browser behavior. No Supabase evidence schema or sync exists
yet. Cached keys/records are not device encryption; expired-token acceptance is
only for the approved local offline path. The default legacy runtime and owner
data remain separate until migration is reviewed. Manual lost-email recovery,
existing Reflect failures, broad-suite/lint, and wider release gates remain open.

---

## Account-separated storage - 2026-10-31

### Scope and setup

The developer approved the storage boundary, pending-work guards, direct admin
callers, synthetic tests, and continuity records. Supabase auth, provisioning,
real-data migration, membership, and deployment are excluded. The legacy app
continues using its existing records. Account mode is a foundation for a later
verified-auth adapter; the local marker alone is not proof of identity.

New tests: [account-scope.test.mjs](../tests/account-scope.test.mjs) and
[account-storage.browser.mjs](../tests/account-storage.browser.mjs). The latter
starts a test-only Vite page at `http://127.0.0.1:3220` that imports the real
React provider, store, publication hook, pin helper, and sync client. No test
route or account-switch control was added to production. Chromium uses isolated
contexts, Bangkok time, synthetic accounts A/B and legacy data, and real
IndexedDB. External requests are blocked. Basic switching/reload/publication
cases run at 390x844 and 360x844; the remaining race/failure cases run at 390x844.
No owner browser, private writing, profile server, or AI provider was used.

### Final storage checks

- `node --test tests/account-scope.test.mjs tests/day-one.test.mjs tests/day-one-simplification.test.mjs tests/phases.test.mjs tests/chapter-engine.test.mjs tests/day-door.test.mjs tests/protocol-home.test.mjs tests/first-use-setup.test.mjs tests/habit-identity.test.mjs tests/chapter-capabilities.test.mjs tests/chapter-splash.test.mjs`: **91/91 passed** (six new scope cases and 85 existing cases).
- `node --test --test-reporter=tap tests/account-storage.browser.mjs`: **11/11 passed** on final application code, without page errors.
- `node node_modules/next/dist/bin/next build`: passed on final code, including TypeScript and static generation.
- `node node_modules/vinext/dist/cli.js build`: passed on final code; existing static route-classification limitations remain.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false -p tsconfig.vercel.json`: passed. This is the Vercel configuration, not a fresh result for the previously failing standalone configuration.
- `node node_modules/eslint/bin/eslint.js app/os/account-scope.js app/os/account-scope.d.ts app/os/circle-os-store.ts app/os/circle-os-ai.ts app/os/chapters/chapter-publication-store.ts app/os/chapters/use-chapter-publications.ts app/os/day-door.js app/os/day-door.d.ts app/os/admin/chapter-editor.tsx tests/account-scope.test.mjs tests/account-storage.browser.mjs`: passed. Shell ESLint JSON diagnostics retain the pre-edit six memoization errors, two purity errors, one immutability error, and one unused-import warning.
- A read-only Node check verified all 25 local links/fragments in the three updated continuity records. `git diff --check` passed with the existing LF/CRLF warnings.

Account A starts without legacy records, private chapters, or pins. After saving
A, switching to B shows neither A's saved evidence nor unsaved form text. B saves
and reloads separately. Logout removes the evidence subtree in both open tabs;
signed-out store reads fail. Signing back into A restores only A. Legacy
localStorage bytes captured immediately before switching remain identical.
Account entry does not claim an old profile.

Queued reads, saves, and chapter writes reject after their captured scope
closes. A live IndexedDB transaction aborts without overwriting its previous
durable value; another-tab logout also aborts a live transaction. Old provider
callbacks are inert. An intentionally delayed legacy fetch is aborted/rejected,
including when a mock ignores cancellation; a delayed startup cannot repopulate
the newly mounted account. Account-mode sync makes no legacy server request.
Writes accepted into localStorage before switching stay in that account's copy.

Newer localStorage wins within an account; corrupt/missing local JSON falls
back to that account's IndexedDB. It does not read legacy v1 or another account.
Offline edits and an empty save survive a reload after connectivity returns.
Conflicting edits to an existing private chapter version reject and retain the
original content. No server-merge, real acknowledgement, or migration result is
implied by these local checks.

### Broader production regression checks and unresolved failures

The final Next build ran at `http://127.0.0.1:3218` with `TZ=Asia/Bangkok`.
With the same timezone, the command
`node --test --test-reporter=tap tests/day-one.browser.mjs tests/core-recovery.browser.mjs`
passed **20/21**. All nine Day One cases passed, including offline completion,
reload, Protocol, old versions, Quest/publication delivery, and Week Setup.
Core recovery passed 11/12. The 360px authored Reflect case retained the
placeholder `synthetic-walk-block` instead of the test's newly installed block
reference after its direct fixture replacement. No real evidence was involved.

An isolated rerun using
`node --test --test-reporter=tap --test-name-pattern='Reflect evidence and authored reading at 360px' tests/core-recovery.browser.mjs`
failed at the first swipe: saved `vision-between.index` stayed undefined rather
than becoming 1. A subsequent core-only run with
`node --test --test-reporter=tap tests/core-recovery.browser.mjs`
passed **9/12**: derived/authored at 390px and authored at 360px timed out at that
swipe. These are failed checks, not a passing regression certification.

For comparison, a disposable source copy preserved the working tree's existing
Day One and chapter bundle. The seven previously unchanged storage/client/
publication/pin/admin files were restored from HEAD `5bc8ccb`; the shell's
original provider block was restored from HEAD and its scope import removed.
The comparison had no remaining imports of the scope helper. A Next Webpack
production build passed, and the same isolated 360px authored-reading command
failed with the same first-swipe timeout. This establishes that swipe failure
also occurs before the storage change; it does not establish the cause of the
initial fixture-reference mismatch. Fixture/autosave timing and cover readiness
are possible explanations, not confirmed fixes. Reflect's broader verification
remains open. No production gesture, reading model, or existing test was changed
to make this check pass.

The temporary in-repository comparison was removed after verification, its
dependency junction removed without touching the real dependencies, and both
local Next servers stopped. Preliminary cross-drive Turbopack and Webpack
comparison builds failed on dependency-junction resolution; the successful
comparison used a same-drive copy and `next build --webpack`. Early Vite harness
attempts also needed a JSX-free virtual entry and a test-only `process.env`
definition for Next imports. Final harness and production checks use their
reported configurations. Verification ran on Node 24.22.1; older Node versions,
physical phones, other browsers, and production Supabase auth/sync remain untested.

### Invariants and next action

No geometry, typography, gap, budget, chapter content, edition content, merge,
acknowledgement, or 06:00 day rule changed. Focused tests retain the existing
clearing/stale-merge and day-boundary coverage; no new geometry measurements or
live-sync proof is claimed. The new runtime helper uses JavaScript and a matching
declaration so existing JavaScript callers need no TypeScript runtime loader.
The storage routing is not encryption or server authorization. Future auth must
verify ownership before mounting personal content and must handle recovery and
revocation. Next: review that auth implementation scope; separately resolve the
Reflect fixture/swipe verification gap before release. No extra performance
optimization was justified. Existing Phase 1 and broader verification gaps stay open.

Updated: 2026-10-30

## Goal

Verify that a new tester can complete first-use setup, record a daily activity
or moment, reload without losing it, and see Reflect observations grounded in
that test data. This remains the active task in `docs/CURRENT_TASK.md`.

## Test setup

- Browser automation: Playwright 1.64.1 with Chromium 156.0.8078.4.
- Device mode: isolated headless Chromium context with mobile emulation,
  viewport 390×844, touch enabled. No physical phone was used.
- Test identity: synthetic name `Journey Tester`, age 34.
- Data safety: each run used a fresh Playwright context. No existing browser
  profile or owner data was read, cleared, or changed. The test context was
  closed after the run, so its synthetic state is not available to continue.
- Local server: `node node_modules/vinext/dist/cli.js dev`, at
  `http://localhost:3000`.

## Completed and verified

- The initial name-and-age form accepted the synthetic test values and opened
  Today.
- The 11-page Day One chapter was completed. Text pages advanced with one
  Continue tap each; the two info pages advanced with a left swipe; the choice
  page advanced after choosing `Mind — how you think`.
- In a prior isolated run, the profile remained after a full reload. The saved
  Today content appeared after a brief empty shell; the name-and-age screen did
  not flash. The developer's reported onboarding flash was not reproduced.
- Reflect opened at `/os/mirror` and displayed Vision and Athena's Reading. It
  showed `Still learning` and `Waiting to sync` without a daily test entry.
  This verifies that the route rendered, not that an observation matched
  recorded activity.
- The Day One Continue pages advanced on their first click. This does not rule
  out the reported two-click issue in other flows.
- No Playwright `pageerror` events or ResizeObserver overlay were observed in
  the automated journey.

## Reproduced blocker: bug 17

Steps in the full journey run:

1. Open Today in the fresh context and complete name-and-age setup.
2. Complete the Day One chapter.
3. Scroll to `Set your usual day` and open Log setup.
4. Accept wake time `07:00`, advance to sleep, and set sleep time to `22:30`.
5. Tap Continue once on the sleep page.

Observed result: the Log setup cover, `Set your usual day. Swipe to begin`,
returned within 100–1,400 ms. The Log timeline and its `Now` action did not
become available. A right swipe on the returned cover did not dismiss it in
this run. This reproduces bug 17 as described in `bugs.md` and blocked recording
a daily activity.

The run did not show the `Your daily log is ready` page reported by the
developer; it returned to the setup cover after the sleep step. Keep that
difference in the reproduction notes rather than assuming the same intermediate
page was seen.

## Not completed

- No daily activity or moment was recorded because the Log timeline could not
  be reached.
- Persistence of a daily entry after reload is unverified. The earlier reload
  check verified only the synthetic profile.
- Reflect could not be checked against test activity. Its displayed reading
  without activity is not evidence that it reflects the test data.
- The user-reported bugs other than bug 17 remain unverified unless their
  status is explicitly updated in `bugs.md`.

## Follow-up journey run — 2026-10-30

### Completed and verified

- Repeated first-use setup in a fresh headless Playwright Chromium context at
  390×844 with mobile emulation and touch enabled. Used only the synthetic
  profile `Journey Tester`, age 34. The name-and-age form opened Today.
- Completed all 11 Day One pages with synthetic answers. Text answers advanced
  with one Continue tap each, the choice page advanced after choosing
  `Mind — how you think`, and the two information pages advanced by swiping
  left. The final protected completion swipe closed the chapter.
- Opened the Log setup card. The run showed two steps: wake time and sleep
  time. It accepted `07:00` and `22:30`.
- After Continue on the sleep step, the Log card returned to
  `Set your usual day. Swipe to begin`. The timeline and `Now` action were not
  available. Reopening the setup up to three times did not expose the timeline.
  This reproduces bug 17 again; this run did not show the `Your daily log is
  ready` page described in the user report.
- Reloaded the same isolated context after the Log attempts. Today still
  greeted `Journey Tester`; the first-use screen did not reappear. The app used
  the `circle-os-state-v2` local-storage key.
- Opened Reflect at `/os/mirror`. Vision and Athena's Reading rendered, showing
  `Still learning` and `Waiting to sync` without a daily entry.
- No Playwright `pageerror` was recorded. The app server on port 3000 returned
  HTTP 200.

### Still not verified

- No daily activity or moment could be recorded because Log never exposed its
  timeline. Entry visibility and persistence after reload remain unverified.
- Reflect could not be compared with recorded activity, so grounded
  observations remain unverified. Its empty-state text is not evidence of a
  successful reflection check.
- The run used headless mobile emulation, not a physical phone or the
  developer's browser. Other reported bugs remain unverified except bug 17.
- No application code was changed and no bug was fixed. Per the developer's
  preference, this pass recorded findings only.

## Environment note

On server restart, Vinext reported a dependency-scan failure with parse errors
on TypeScript declaration files and skipped pre-bundling. The app still served
`/os` with HTTP 200, and the browser journey continued. No app code was changed
to address this warning.

## Bug 17 fix verification — 2026-10-30

### Change

- The ordinary-publication selector now collapses each chapter to its newest
  published version before choosing what to deliver. This prevents old
  `log-setup` versions from being offered one after another.
- A completed published Log setup now writes its wake and sleep answers to the
  profile's routine evidence.

### Verified journey

- Used fresh isolated headless Playwright Chromium at 390×844 with mobile
  emulation and touch enabled. Synthetic profile: `Journey Tester Log Fix
  1030`, age 34. No existing browser profile was opened or cleared.
- Completed name-and-age setup and all 11 Day One pages with synthetic answers.
- Completed the newest published Log setup (`log-setup@3`) with wake `07:00`
  and sleep `22:30`. After `Your daily log is ready`, a left swipe opened the
  Log timeline instead of returning to its setup cover.
- The timeline showed `Now`, `Wake up` at 07:00, and `Sleep` at 22:00. Saved
  `circle-os-state-v2` contained the completed setup run and routine answers
  `07:00` and `22:30`.
- Added the synthetic moment `Log setup smoke test` at 08:00, then reloaded
  within the same isolated context. The moment remained visible. No Playwright
  `pageerror` events occurred.
- Focused chapter tests: 26 passed, 0 failed. Build:
  `node node_modules/vinext/dist/cli.js build` completed successfully.

### Remaining journey work

- Reflect was not compared against this newly recorded moment, so evidence
  grounding remains unverified.
- Other user-reported bugs remain unverified or open. The run used headless
  mobile emulation, not a physical phone.

## Continue bug check — 2026-10-30

### Completed and verified

- Used the existing app at `http://localhost:3000/os/mirror` and isolated
  headless Playwright Chromium contexts at 390×844 with mobile emulation and
  touch enabled. Both profiles used synthetic names and age 34; no existing
  browser profile was opened or cleared.
- On the first Habit question (`4/6`, “What small habit will you do?”), filled
  a synthetic answer and tapped Continue once. Within 450 ms the page advanced
  to `5/6`, “When and where will you do it?” The reported first-tap failure
  did not reproduce on this path.
- In a separate context, filled the first Day One answer on `1/11` and tapped
  Continue once. Within 450 ms it advanced to `2/11`.
- Neither browser context recorded a Playwright `pageerror`.

### Limits and next step

- These checks cover the first Habit question and the first Day One question
  only. They do not verify all Continue controls or disprove the broader report
  in bug 19. No code was changed because the failure did not reproduce.
- Bug 10 remains a user-reported issue, marked “not reproduced in this check,”
  not fixed. To continue, collect the exact page and timing from the original
  report or test the next specific Continue path in an isolated context.

## Habit swipe check — 2026-10-30

### Completed and verified

- Used a fresh isolated headless Playwright Chromium context at 390×844 with
  mobile emulation and touch enabled. Completed Day One using a synthetic
  profile, then opened the first Habit chapter.
- On Habit page `1/6`, one left swipe advanced to `2/6`. One right swipe
  returned to `1/6`. A left swipe then advanced to `2/6`, and a second left
  swipe advanced to `3/6`. No Playwright `pageerror` occurred.
- The report that left swipe only advances after first swiping right did not
  reproduce. Right-swipe-back itself did reproduce.

### Product rule conflict and next action

- `app/os/APP_SESSION_STANDARD.md` says a person may move backward in an open
  Journey to edit an answer before confirmation. Habit uses the shared
  `SwipeSession` engine; disabling backward swipes there would affect every
  chapter Journey. The developer chose to keep the current behavior for now.
  No code was changed.

## Next session: resume here

1. Read `AGENTS.md`, `docs/CURRENT_TASK.md`, this file, the latest
   `docs/SESSION_HANDOFF.md` entry, and `bugs.md`. Do not read or print
   `.env.local`.
2. Start the local server with `node node_modules/vinext/dist/cli.js dev` if it
   is not already running.
3. Bug 17 is fixed and verified: `log-setup@3` completed into the Log timeline,
   and the synthetic 08:00 moment survived reload. Do not repeat that setup
   unless checking another change.
4. Bug 10 did not reproduce on the first Habit question or first Day One
   question after one Continue tap. Keep it open as a user report; bug 19's
   broader claim remains unverified.
5. Bug 11's left-swipe failure did not reproduce; right-swipe-back worked as
   designed by the current Journey standard. The developer chose to keep this
   behavior for now; no gesture code change is planned.
6. Continue the journey by opening Reflect in the same isolated context and
   comparing its observations with `Log setup smoke test`. Record whether it
   states direct evidence or inference, then update `bugs.md` and this record.
7. Keep the other user-reported findings separate; reproduce them before
   changing their statuses.
8. Update `docs/CURRENT_TASK.md` and append a dated entry to
   `docs/SESSION_HANDOFF.md` after further work.

Playwright is installed as a development dependency, and Chromium is installed
in the machine's Playwright browser cache. No reusable journey test file or npm
script has been added yet.

## Bug 12 — Habit answers not reflected in the result — 2026-10-30

### Reproduced before the fix

- In a fresh isolated headless Playwright Chromium context at 390×844, completed
  Day One with the synthetic answer `ONBOARDING ANSWER`, then completed the
  first-use Habit setup using three distinct answers.
- The completed `habit-building@1` run retained all three Habit answers, but
  `habits.definitions` still contained only the Day One Habit with
  `ONBOARDING ANSWER`. The Habit answers had no effect on the saved Habit.
- No Playwright `pageerror` occurred during the reproduction.

### Fix and verification

- The first fix covered the first-use publication path, but browser testing
  still reproduced the bug. The built-in `habit-building@1` chapter is delivered
  through the regular publication branch, which still had no Habit projection
  callback. The saved run therefore contained the three answers while the Day
  One Habit still showed its onboarding answers.
- Added `applyHabitBuildingCompletion` to the regular published
  `habit-building` completion path as well as the first-use and compiled paths.
  The hydration repair also recognizes completed `habit-building`
  publications that are not marked first-use. It updates the existing starter
  Habit, keyed by run ID, and avoids overwriting a later manual edit.
- Playwright Chromium, isolated context, mobile emulation at 390x1400: completed
  Day One and `habit-building@1` using distinct action, cue, and identity
  answers. After the final forward swipe, the run was `completed`; the existing
  Habit row showed all three answers and matching rendered text. After reload,
  the run and Habit values were still present. No page errors occurred.
- `node --test tests/habit-identity.test.mjs tests/first-use-setup.test.mjs`:
  17 passed, 0 failed.
- `node node_modules/vinext/dist/cli.js build` completed successfully.
- `node node_modules/vinext/dist/cli.js build`: completed successfully.

### Remaining check

- The browser test covered a newly completed run and reload persistence. It did
  not inject an already-completed broken run to exercise the hydration repair
  branch directly. The regression tests cover projection and repair wiring;
  stored-state recovery remains a useful follow-up check.

## Phase 1 — saved Habit recovery and Reflect grounding — 2026-10-30

The developer approved browser regression coverage, focused checks, and
updates to the journey, bugs, task, and handoff records. No application fix
was authorized or made. Branch `paing-branch`, HEAD `7ffd3b2`.

### Setup and commands

- Added [tests/core-recovery.browser.mjs](../tests/core-recovery.browser.mjs).
  Start the isolated server with PowerShell:
  `$env:TZ = 'Asia/Bangkok'; node node_modules/next/dist/bin/next dev --port 3218`.
  The browser uses the same timezone and current clock. The test computes
  the Circle date using the 06:00 boundary; it does not test the boundary itself.
- Fresh Chromium context per case, mobile/touch emulation at 390x844 and
  360x844, default motion. Only requests to `http://localhost:3218` are
  allowed. No owner browser, profile server, personal records, or AI service
  was used. Synthetic completed setup runs bypass unrelated onboarding.
- `node --test --test-reporter=tap tests/core-recovery.browser.mjs`:
  **12 passed, 0 failed** on final code (about 696 seconds).
- `node --test tests/habit-identity.test.mjs tests/first-use-setup.test.mjs tests/athena-memory.test.mjs tests/athena-alignment.test.mjs tests/athena-pricing.test.mjs`:
  **64 passed, 0 failed**.
- `node node_modules/eslint/bin/eslint.js tests/core-recovery.browser.mjs`:
  passed. Documentation audit passed (14 links, four heading fragments);
  whitespace and `git diff --check` passed with existing LF/CRLF warnings.
  This session ran no full build or broad test/lint suite.

### Observed behavior

At both widths, loading a completed `habit-building@1` run repaired the old
starter's action, cue, and identity. With no starter it created one Habit.
Two further reloads kept one row, the same answers, and the run marker.
A later manual edit remained intact across the same reloads. This directly
covers the startup recovery path left unverified in the earlier Bug 12 entry.

For each Reflect mode, the test saved `Walk in the park` at 08:00 through
Log's actual controls and verified it after reload. Applying `priceDays`
to that saved browser day returned one recorded hour and one walking hour.
This is an arithmetic assertion on saved evidence, not proof that Reflect
recalculates prepared prose when a Log entry changes.

An empty reading stayed in `Athena is still learning.` A synthetic derived
observation displayed the recorded walk, with a separately labelled working
guess; it minted no edition. Synthetic authored prose displayed its cover
and reading text and retained exactly one unchanged edition. Fixture source
references were linked to the UI-created Log record. Navigation preserved
the activity and edition archive. Final cases had no browser page errors.

### Attempts and remaining limits

Initial fixed browser time disagreed with server-rendered time and caused a
hydration mismatch. Both now use Bangkok and the actual clock. Early attempts
were stopped during diagnosis; a startup wait also timed out. Corrected the
Habit selector to a text field, compared manual edits with normalized state,
and waited for saved page indices and transition completion between reading
swipes. The corrected full run passed; no runtime fix was needed.
Next dev also warned about smooth scrolling during route transitions; no
application change was made for that warning.

Prepared memory was deliberately installed as a synthetic fixture, not
produced by Athena from the activity. Generation quality, scheduler freshness,
real source selection, server acknowledgements/merges, offline retry, other
browsers, physical phones, and geometry remain outside this verification.
Existing TypeScript/build and broader-suite limitations were not rerun.
No bug beyond this bounded coverage is newly declared fixed.

## Shorter Day One - 2026-10-31

### Scope and setup

The developer approved Day One v3 implementation, its tests, continuity records,
and the finish summary in the shared player. Their correction allows the sole
user to see v3 after completing an older version. Existing access and records
remain preserved. Tests used synthetic isolated profiles, never owner data.

Final browser setup: `TZ=Asia/Bangkok`, Next production server at
`http://127.0.0.1:3218`, Chromium at 390x844 and 360x844, mobile emulation and touch
capability. The test intercepts and blocks every request outside that origin.
Fresh isolated browser contexts include isolated IndexedDB publication storage.
Four main-flow cases also enter and finish while the browser is offline, then
restore local-server connectivity before reloading.

### Commands and results

- Baseline: `node --test tests/phases.test.mjs tests/chapter-engine.test.mjs tests/day-door.test.mjs tests/protocol-home.test.mjs` passed 42/42 before implementation.
- Final: `node --test tests/day-one.test.mjs tests/day-one-simplification.test.mjs tests/phases.test.mjs tests/chapter-engine.test.mjs tests/day-door.test.mjs tests/protocol-home.test.mjs tests/first-use-setup.test.mjs tests/habit-identity.test.mjs tests/chapter-capabilities.test.mjs tests/chapter-splash.test.mjs` passed 85/85.
- With Bangkok time set, `node --test --test-reporter=tap tests/day-one.browser.mjs` passed 9/9 against the final production build.
- `node scripts/chapter-compiler.mjs --check` passed: 33 sources, zero external Quest sources; baseline was 32 sources. The bundled Quest registry was left unchanged.
- `node node_modules/next/dist/bin/next build` and `node node_modules/vinext/dist/cli.js build` passed on the final application code.
- `node node_modules/eslint/bin/eslint.js app/os/day-one-model.js app/os/chapters/chapter-player.tsx tests/day-one.test.mjs tests/day-one-simplification.test.mjs tests/day-one.browser.mjs` passed. Shell ESLint was compared with HEAD using JSON reports: both have six memoization errors, two purity errors, one immutability error, and one unused-import warning. No new lint finding remains.
- `node node_modules/typescript/bin/tsc --noEmit` still fails with TS2307 for `cloudflare:workers` in `db/index.ts`. This matches the recorded baseline gap; the Next production build's own TypeScript phase passed.
- A comparison against HEAD confirmed every one of the 35 pre-existing bundled chapter versions retained identical content. Only `day-one@3` was added. Source `Day One.md` was preserved; the new external file is `D:/CircleOS/Chapters/Published Soruces/Day One v3.md`.

### Observed outcomes

At both widths, two uncertain answers and either a skipped or supplied optional
action reached the finish Page. The Page displayed only the supplied words.
Reload during the journey resumed the next question with earlier answers intact.
Offline progress remained in the local outbox. Completion returned to the app
without another automatic exercise and created no declarations, identities,
Habits, goals, tasks, or Protocols. Habit Building was not stored as completed.

Routine's idle view made Protocol reachable. Its existing Start a phase action
created one draft only when chosen; the draft and Day One answers survived reload.
An older completed profile could see the new automatic cover. Quest entry saved
the same new answers while retaining the older run. A partially answered v2
resumed its original info Page and answers across reloads. A synthetic Day One
publication delivered through Thoughts completed without a duplicate setup sheet
or automatic greeting, using the shared outcome handler.

Week Setup was offered after a synthetic v3 completion on the prior Circle day.
Without any old Day One Character, habit, or commitment records, the full Week
Setup journey completed and saved one goal, linked task, and Protocol, with no
Habit invented. Reload retained completion. Focused tests separately checked
legacy outcome idempotence, new completion preserving existing records, dated
answer clearing through a stale merge, and the 05:59/06:00 Week-offer boundary
for old and new Day One versions. No final browser page errors occurred.

### Attempts, limits, and next action

Early browser selectors assumed the cover's authored Begin label and a Routine
region role. They were corrected to the actual accessible Begin name and named
session element. The first publication fixture marked an empty Habit run complete
and triggered normal recovery; it now defers that unrelated setup instead.
Publication integration exposed a second route through the Thoughts scheduler;
both it and direct delivery now use the same Day One handler and completion return.
Finishing no longer opens a second automatic greeting in that case.

A reload aborted during a development-server refresh while source edits/builds
were ongoing. That run was stopped; the final full run used the stable production
server and passed. A synthetic mobile summary screenshot was visually inspected.
No geometry tokens, typography, gaps, or chapter budgets changed, so no new
Note/Thoughts/Habit/Protocol geometry measurement is claimed. No additional
performance optimization was justified beyond sharing the inconsistent outcomes.

These results do not certify real server acknowledgements, offline recovery to
that server, personal Athena preparation, physical phones, other browsers, the
broad suite, or full lint. Earlier Phase 1 gaps remain open. Next is developer
use and wording review; no other chapter revision or deployment is included.
