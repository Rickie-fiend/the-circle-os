# Content Admin and Explore plan

## Local template completion and Explore — 2026-11-14

The developer approved completing the local flow, starting with the specified
three-row glass Explore layout. Chapters, Habit/Protocol and Articles each have
an independent bounded carousel. Titles stay outside; available covers/titles/
descriptions stay inside. Retain header/account and bottom navigation on Today's
background, with no outer App Box. Empty rows have two blank panels; one item
has a blank neighbour. Interior selections show both neighbours and appear closer
with a subtle Orange shadow. Allow vertical scrolling. Taps open exact versions.

Explicit Add to Routine saves a 21-day or ongoing group without replacing current
items/identity. Reopen an active group rather than duplicate it; all stopped or
expired permits a deliberate fresh copy. Save one immutable source/settings/answer
snapshot with item references; retain old records. Protocol keeps its explicit
Start, Day One gate and phase protection. Both paths share an account-scoped
adoption lock, pending receipts and local acknowledgement before navigation.
Circle marks disclose original details without saving evidence. Admin stays
preview-only. This supersedes earlier local no-adoption/empty-Explore boundaries.

Migration 004 and the real synthetic hosted/browser test were separately approved
and completed on 2026-11-14: 88 functional checks plus browser adoption/reload and
exact cleanup. See [results](CONTENT_ADMIN_SETUP.md). No real authored content,
deployment or cloud-sync activation is included. Never reapply 001–004.

## Protocol preview correction — 2026-11-14

Approved Start follow-up: setup's primary action is Preview; the running preview offers Start. Signed-in exact-version readers deliberately save an active personal copy, retain the selected duration/resolved terms and source/answer snapshots, then open /os#protocol after local save acknowledgement. Admin Start is disabled. Existing active/draft phases offer Open Protocol instead. Day One access remains required. Account-scoped Web Locks serialize Start with a latest-local-state check; unsupported locking fails with an actionable error. Retry receipts survive reload in account-scoped session storage. Hosted migration 004, publication, cloud sync and Explore discovery remain separate.

Approved two-step result preview reuses ProtocolPage: template name as provisional phase name, fixed terms, existing duration choices, Preview N days and a read-only Day 1 appearance. Back preserves selection. Authored action wording supplies the agreement text, including existing target/unit/effort slots. Separate cue/result fields remain saved and editable, with an Admin warning when present because current Protocol cannot display them. No automatic rewrite, deletion, adoption or hosted migration.

## Template clarity update — 2026-11-14

Approved follow-up: Remove effort clears its stored value/source/link to an empty fixed setting and survives save/recovery. Empty/whitespace Effort produces no result wording or cue fallback. Existing authored Effort stays visible until explicitly cleared/removed. The Routine preview omits generated daily schedule sentences but retains its ongoing checkbox. Time controls now use immediately visible independent Hour/Minute/AM-PM wheels.

Approved local follow-up explains Setup Pages (reading/questions), Items (output habits/tasks), and optional intermediate result previews; a final result preview is automatic. Question wording is separate from optional Page title. Validation distinguishes missing wording, invalid references and duplicate references by Page number and displays those errors beside the affected Page. Internal references are not exposed as author-editable fields. Time and typed-answer controls follow the updated Design/Page standard. No adoption or hosted migration is included.

## Approved review corrections — 2026-11-13

Implemented locally after explicit developer approval: numeric answer typography; Circle time picker with unsaved placeholder; typed Admin connection/session/permission failures and editor-preserving transient errors; targeted/deduplicated image signing; eager account-scoped Admin-menu checks; shared full Routine Page preview, authored action wording and optional Effort; minimal preview text; retirement of Habit/Week tool-entry setup gates while retaining old records. Wording supports fixed text with target/unit/intensity slots (internal identifiers remain compatible). Unapplied migration 004 validates optional actionPattern; it has not been changed remotely. Existing templates without a pattern keep their original action plus separate quantity.


## Template builder result — 2026-11-13

The approved local builder slice adds Habit/task and fixed-task Protocol template types. Both reuse shared account/tab draft recovery, Media and Catalog operation retries. Editors support Explore name/description/cover, Page and item ordering/duplication/removal, text, image placement, choices, written/time/numeric questions, configuration/reflection purposes and result preview Pages. Questions used by result settings must be required configuration questions. Numeric targets support explicit authored lower/upper bounds, linear factor/offset/clamping, or exhaustive single-choice mappings; no code evaluation or automatic progression. No health formula or target is supplied by the implementation.

Publication freezes the template definition and asset references into a version. Source identity is the draft ID. Routine/protocol template types cannot replace one another or a Chapter/Article under the same identity. Local migration 004 extends Catalog through an owner-only delegate for the existing publisher and new template validation. It is NOT applied to hosted Supabase. Existing 001/002/003 remain applied and must not be reapplied.

Admin and signed-in exact-version template previews collect temporary answers, show actual resolved targets and preview 21-day/ongoing Routine or existing Protocol durations. They never adopt items, start phases, save reflection answers or create Chapter evidence. Explore adoption remains the next separately reviewed implementation slice. The earlier planning sections below are historical context where superseded by this result and the confirmed template direction.


## Confirmed template direction — 2026-11-13

Developer reviewed the Admin/Catalog flow and its functions. Next implement standalone Routine scheduling before the template builder and Explore adoption. A template may add a group of habits/tasks, daily for 21 days by default; an unchecked “Keep going until I stop” choice applies to the group, with individual items stoppable later. Template Protocol tasks stay fixed after starting; users choose the existing phase durations. Questions support configuration and saved reflections. Everyone receives the same authored task set; cues, times and confirmed quantities/intensities may vary. Completion remains a single checkbox, without quantity logging or automatic progression.

The planned shared builder uses reorderable glass Pages with text, media-library images before/after text, choices, written/time/numeric questions and an actual personalized result preview. Explore display titles stay separate from task wording. Fixed, user-chosen and explicitly authored-rule suggestions are proposed value sources; health calculations require a separately reviewed source/rule. Template-origin Circle marks and source/version preservation are planned. Builder, personalization, Catalog template types and Explore adoption are not implemented by the scheduling slice.


## Catalog follow-up — 2026-11-11

Developer approved local publication, signed-in reading/images and withdrawal/
restore. Migration 003 is prepared, not applied. Publication snapshots exact saved
drafts with revision checks and retry receipts. Each new version is immutable;
Article identity uses its draft ID rather than the placeholder chapter ID.
Bundled IDs are reserved at the application boundary; use independent copies.
Withdrawal hides discovery while any verified signed-in account can still read
exact old links. Publishing while withdrawn does not restore discovery.
Images remain private; published references permit targeted signing. The app
issues five-minute links, which are temporarily shareable and cannot be recalled
on logout. Chapter reading uses local runs; Reflect resolves exact definitions.
New Chapter links preview without saving evidence; existing unfinished runs resume
locally and completed runs cannot be rewritten. Starting new runs through Explore
remains separate, preserving current rationing. New reads/image refresh need a
connection. Explore, legacy import and deployment
remain separate. See Current Task and journey evidence for acceptance gaps.

Approved direction: 2026-11-11, Asia/Bangkok. Documentation approved; application,
SQL, Storage setup, content publication and deployment need bounded implementation
approval. The developer separately requested committing/pushing current repository work.

## Priority and purpose

Build Admin and the shared Supabase catalog first, then Explore.
This supersedes the old after-beta deferral of live chapter publishing.
Critical data-safety and blocked journeys still gate dependent work; existing
safe-sync, onboarding, membership and Athena release requirements remain.

Explore helps the audience understand themselves, discover interests and choose
small actions within reach. Use the founder's [audience brief](AUDIENCE_AND_PURPOSE.md)
without treating its hypotheses as research. Simple English, limited money/time,
uncertainty and returning after interruptions must inform editorial review.
The developer owns authored philosophy and approves content.

## Confirmed scope

- Shared Supabase catalog managed inside the app through the developer's account.
- Chapters, articles/blogs, habit templates and Protocol templates.
- Image support in chapters and articles/blogs.
- Users preview/personalize templates and explicitly add them to Routine/Protocol.
- Ordinary content additions and edits require no code edit or redeployment.
- Reuse current authoring, Page, persistence and domain engines.

## Existing foundation and gaps

The approved first implementation has bounded hosted setup/verification. See
[setup, access and remaining limits](CONTENT_ADMIN_SETUP.md). The second Admin
invitation awaits verification. The inventory below describes the starting foundation; the account
path now has shared-draft/recovery and private-media code, with publishing,
content images and additional editors still pending.

Repository inventory: 47 distinct chapter IDs across 56 versions, plus three
Quests. This does not inventory external publications or browser-only drafts.

| Group | Distinct chapters | Review |
| --- | --- | --- |
| Self-understanding | 12 | Rhythm, attention, support, surroundings, choice, rest, meaning, interests/growth, gratitude and daily learning |
| Daily opening/check-in | 6 | Five short feeling/day prompts and Day Open |
| Wanted-life declarations | 4 | Vision, Mission, Typical Tuesday and Dreamline; some assume clarity the audience may lack |
| Setup/review | 5 | Day One, Habit, Log, Week setup/review; not automatically general Explore content |
| Playful Sparks | 20 | Prompts, jokes and games; automatic writing delivery remains paused |

Existing Quests: Getting started, The life you want, Knowing yourself.
Audit relevance/copy/length before inclusion. Preserve published versions and
old runs; improved content uses new versions. Do not publish every old item
or resume paused delivery merely because a catalog exists.

Chapter Workshop has authoring, validation, preview and browser-local drafts.
Public publishing uses the legacy profile server and rejects account mode.
Admin unlock is password/cookie based, not an account-bound author role.
Quotes already have a separate shared Supabase catalog.
There is no general article editor, media library or adoptable habit/Protocol
catalog in the inspected app. Chapter schema/player have no image field/rendering.

## Proposed Admin experience

One library with Chapters, Articles, Habits, Protocols and existing Quotes.
Use Create -> Save draft -> Preview -> Publish. Drafts are admin-only;
published items feed Explore. Exact catalog read audience needs implementation
review. Admin access must be checked server-side against the verified account,
never a client toggle or user-editable alias/metadata.

| Editor | Proposed fields and behavior |
| --- | --- |
| Chapter | Current typed Pages/questions/choices plus images; preserve the shared player and immutable versions |
| Article/blog | Title, summary, cover image, headings, paragraphs and inline images; treat blogs/articles as one reading type initially |
| Habit | Action, cue, optional result/supporting explanation; preview the actual Routine representation |
| Protocol | Name/purpose, allowed duration, required/optional terms and supporting explanation; preview an editable draft |
| Media | Upload/reuse images, alternative text, optional caption and mobile preview |

Article block editing and image placement received the subsequent review below.
The developer subsequently approved cover/title/summary and movable heading,
paragraph and image blocks, shared draft saving/recovery and previews. Newly
created Chapters and Articles use the current glass design; existing chapters
retain their appearance. Image selection uses stable private Media references,
alternative text and optional captions. Catalog publication remains separate.
Do not introduce arbitrary executable HTML. Normal content editing uses supported
fields/blocks; entirely new interaction types still need reviewed code.

## Supabase catalog and media direction

Store catalog identities, drafts, published versions, metadata and asset
references in Supabase Postgres; image files in Supabase Storage.
Review exact schema, admin ownership/grants and migrations before provisioning.

Separate editable drafts from immutable published versions. Withdrawing an item
hides future discovery; it must not destroy old answered chapters or adopted
personal records. Keep original chapter versions available for saved runs.
Catalog content is curated shared material, not private personal evidence.

Proposed media behavior: private draft access, controlled published access,
validated types/sizes, stable asset identities, alt text/captions and responsive
rendering. Published assets must not be overwritten beneath an immutable version.
Review replacement, unused-upload cleanup, retention and withdrawal semantics
before deletion. A removed image must not break an earlier saved chapter.

Storage supports private buckets/RLS and limited-time signed URLs; public buckets
allow anyone with a URL to retrieve content. Choose actual access policies
deliberately; shared catalog does not by itself mean public-web media.
[Storage access models](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[access controls](https://supabase.com/docs/guides/storage/security/access-control).

## Explore and adoption

Explore offers audience-relevant chapters, articles and practical templates.
Candidate themes: interests, recognizing effort, manageable experiments,
obstacles, chosen habits and returning after a missed day. These are editorial
proposals, not approved authored lessons or promises of employment/income.

Browse -> preview -> personalize -> explicit Add to Routine/Protocol.
Preview alone saves no commitment. Adopted items become personal copies with
source/version provenance; catalog changes never rewrite them.
Suggested first Protocol behavior is an editable draft, followed by deliberate
Start phase. Protect any existing active/draft phase; exact conflict handling
needs review. Reuse domain actions, not the first-use Habit projection that can
replace an existing starter and change identity focus.

Prevent duplicates on retries/double clicks. Do not mark a newly added habit
done, start a phase incidentally, replay setup or fabricate personal evidence.
Review optional chapter-to-template links and manual chapter budgets without
silently changing current rationing. Catalog publication needs no personal AI.

## Implementation slices and acceptance

1. Account-bound Admin, shared catalog and media foundation: exact schema,
   policies, drafts/versions/assets and recovery. Verify admin allow, ordinary/
   signed-out denial, draft privacy and cross-account boundaries.
2. Editors: chapter/article images and habit/Protocol templates, retaining Quotes.
   Verify save/reload, upload failure/retry, preview, mobile layout, publication,
   new versions, withdrawal and immutable old content. Test real hosted policies
   separately from synthetic/local proof.
3. Explore consumption and adoption: reviewed browse/reader/preview flows,
   offline/cache behavior and local-first domain creation. Verify retry,
   existing-phase protection, reload, account switching and old-run preservation.
4. Audience content review: retain/improve/retire existing entries with developer
   approval, then add authored material. No bulk legacy migration/publication
   or invented content is authorized by this plan.

Review each slice's exact source/test/SQL/config scope before implementation.
No remote setup, migration or deployment is authorized by this documentation.

## Open details and next action

Confirm admin-account bootstrap/recovery; signed-in versus public catalog reads;
article controls/image placement; media limits/access/cache/retention; authoring
draft recovery/concurrency; existing local-draft migration; template provenance,
duplicate handling and active-phase conflict behavior; exact Explore composition
and content cadence. Routine packs with several habits are not yet specified.

Next: prepare the bounded first implementation proposal for account-bound Admin,
Supabase catalog and media foundation. Preserve the current personal stores,
06:00 Circle day, immutable chapters/readings and all earlier verification gaps.
