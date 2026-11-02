# Circle OS user-journey test record

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
