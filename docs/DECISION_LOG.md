# Circle OS decision log

## 2026-11-14 — Durable local offline entry and logout

Developer approved storing offline proof and signed-out state in one issuer-scoped
IndexedDB record, with transaction completion before accepting sign-in/sign-out.
Reason: crash tests retained writing but lost the localStorage proof. The store
uses strict durability, a new epoch for each update and expected-epoch checks to
reject stale proof publication. Offline validation rechecks the epoch before entry.
The screen locks immediately on logout; durable invalidation completes before
network logout. Storage failure reports incomplete sign-out and remains locked.
Revocation invalidation is asynchronous with handled failure, never an awaited
SDK call inside its Auth callback. Existing signature/owner/issuer/confirmation
checks and remote authorization remain unchanged.

Upgrade imports an existing signed proof only when no durable record exists,
legacy logout/password-flow markers permit it and signature checks pass. A durable
closed record wins over retained old proof. Legacy keys remain as compatibility
signals; no personal records or SDK refresh-token storage are migrated. Corrupt
records deny restore; an explicit fresh sign-in can replace them with a closed
record before online verification. No deployment, sync activation or phone
acceptance is authorized by this decision.

## 2026-11-14 — Approved hosted templates and exact cleanup

Developer explicitly approved applying migration 004 once and running the
prepared synthetic hosted/browser acceptance, then requested continuation.
Migration applied successfully; final runner passed 88 functional checks plus
real browser adoption/completion/reload, with exact cleanup confirmed for every
attempt. Necessary fixes within the approved verification scope included saving
the correct tool selection with adoption and updating runner expectations/fixture
initialization. No real authored publication, deployment or sync activation.
Never reapply migrations 001–004.

## 2026-11-14 — Complete templates, starting with Explore

Developer approved the reviewed local completion scope, then specified Explore:
three glass rows labelled Chapters, Habit/Protocol, Articles; outside titles;
available cover/title/description only; bounded horizontal swipes with a right
peek initially and both neighbours for interior selections; selected card closer
with subtle Orange shadow. Allow vertical scrolling, keep top logo/account and
bottom navigation, remove the visible outer frame on Today's background. Empty
rows have two blank panels; a single item has a blank neighbour. Taps open exact
published versions.

Developer chose to reopen an existing Habit group while any item remains active,
allowing a fresh copy after all stop/expire. Local completion includes 21-day/
ongoing adoption, protected existing records/phases, source/version/settings/
answered-question snapshots, Circle source marks, tests and owning/continuity
records. Migration 004 and synthetic hosted/browser acceptance are prepared for
final separate review. No remote write, authored publication, deployment or sync
activation is included in local approval.

## 2026-11-14 — Explicit local Protocol Start

Developer approved renaming Preview N days to Preview, restoring 24px visible footer spacing, and a real Start action after preview. Signed-in published-template readers start immediately after local save; Admin only displays disabled Start. Protect existing phases/drafts, preserve source/version and confirmed answers, prevent duplicate retries, retain preview on failure, and keep template terms fixed. This supersedes the former no-adoption boundary only for explicit Protocol Start. No migration, publication or sync activation is approved.

## 2026-11-14 — Faithful Protocol setup and running preview

Developer approved the concrete two-step preview proposal: reuse actual Protocol rendering for fixed-term setup and read-only running appearance; template name supplies phase identity; selected duration carries into Day 1; Back preserves it. Inactive completion and no live history/edit/end/seal actions. Authored target/unit/effort slots supply term text. Saved separate cue/result fields remain intact with Admin warning; no inferred conversion. Live Protocol behavior, personal evidence, adoption and publication are outside this change.

## 2026-11-14 — Template cover and bounded AM/PM

Developer approved removing AM/PM duplicates by using exactly two bounded entries, aligning the template cover to shared typography/24px anchors and gaps, and replacing Swipe to begin with the shared Routine Begin › cue. Reuse existing Page and navigation engines; preserve other Chapter covers. No publication, migration or deployment is included.

## 2026-11-14 — Follow-up: Effort, preview copy and separate time wheels

Developer approved clearing/removing Effort including its saved value and answer link, removing both generated daily schedule sentences while retaining the ongoing checkbox, and replacing the single full-time wheel with immediately visible independent Hour/Minute/AM-PM wheels. Untouched 6:00 AM remains an unsaved hint. Blank Effort must not borrow a cue or answer; authored existing Effort is retained until explicitly cleared/removed. No hosted migration, adoption or deployment is included.

## 2026-11-14 — Template authoring clarity and answer controls

Developer approved an immediately visible single full-time wheel with an unsaved 6:00 AM centre and adjacent minute cues, Page-specific question/reference errors and brief authoring guidance, and transparent typed template answers above a fading Bone line between the 24px anchors. This supersedes the earlier three-column picker direction. Setup Pages collect answers; items define outputs; optional preview Pages resolve answers so far and a final preview is automatic. No adoption, hosted migration, publication or deployment is included.

## 2026-11-13 — Approved seven-point template review

Developer approved the complete review proposal, including the Circle three-column time-picker direction, then confirmed target/optional Effort semantics. Fix input roles, transient Admin failures, repeated Media/menu requests, actual Routine Page previews and authored wording, remove preview boilerplate, and retire Habit/Week first-open gates. This supersedes the former Week-setup access dependency and Habit-building tool wrapper, not the preservation of old runs or the separate replacement onboarding. Day One and Protocol prerequisites remain scoped as before. Local migration 004 may validate the new wording field; hosted application/deployment remains unauthorized.


## 2026-11-13 — Approved local Admin template builder

Developer explicitly approved the reviewed local builder/Catalog slice: groups, glass Pages, media ordering, configuration/reflection questions, fixed/answer/choice/bounded numeric settings, previews, immutable publication support, prepared migration and tests/owning records. Explore adoption, hosted migration application, real authored publication and deployment remain outside this approval. The shared player only gains optional fields and a caller-supplied result body; existing rendering and Chapter lifecycle stay intact. Health estimates require a separately reviewed source/rule; no formula is invented or included.


## 2026-11-13 — Routine scheduling and template personalization

Developer approved the bounded standalone Routine scheduling slice, tests and owning/continuity documentation after agreeing that one-time items remain until completed and template group schedules allow individual opt-out. Existing Week-linked steps remain day-assigned. Existing habits/tasks preserve their defaults. Developer confirmed group templates, fixed template Protocol tasks, setup/reflection questions, personal cues/times and amounts/intensities with checkbox-only completion. No quantity tracker or automatic progression. Full Admin builder/Explore implementation remains a later reviewed slice. See Product, record contract, Page standard and Content Admin plan for the contracts.


Updated: 2026-11-11, Asia/Bangkok. This records current decisions, reasons and
open choices. Owning documents hold the full current rules. Earlier decisions,
including superseded trials and their reasons, remain in the
[dated decision archive](archive/2026-11-11-doc-cleanup/DECISION_LOG.md).

A later timestamp alone is not authority. A change needs the developer's
decision and the reviewed scope. Proposed features remain proposed even when
their discussion is saved. Historical approval does not authorize a new edit.

## 2026-11-11 - Documentation cleanup and onboarding replacement

The developer approved consolidating rules, resolving discrepancies, shortening
active documents, archiving useful history and removing unnecessary active
documents. They explicitly clarified that the implemented onboarding will be
replaced by the already planned redesign. The replacement
[onboarding specification](ONBOARDING_SPEC.md) now owns that target; the older
optional-action Day One plan is historical.

Reason: agents and the developer need one clear direction instead of successive
updates above contradictory older requirements. Preserve unique existing work,
verification evidence, old immutable content and real records. Align authorities
without implementing planned features or declaring unrun checks passed.

The cleanup retains separate current behavior, confirmed target, proposal and
open-question status. Public signup target does not authorize enabling it or
public release. Current onboarding versions/runs remain unchanged pending a
reviewed implementation/migration.

## 2026-11-11 - Content Admin first, shared catalog and images

Developer requested audience-tailored Explore with chapters and adoptable habit/
Protocol templates, then prioritized Admin with a shared Supabase catalog and
articles/blogs plus images in both articles and chapters. They explicitly approved
the documentation update and committing/pushing all current repository work.

Reason: author and publish normal content from the app/account without editing
code for every item. Admin/catalog/media precede Explore consumption and
supersede the former after-beta publishing deferral. Critical safety gates and
other beta requirements remain. [The plan](CONTENT_ADMIN_PLAN.md) separates
confirmed scope, proposed mechanics, open contracts and implementation checks.
Code, hosted setup, personal migration and publication need their own scopes.

## Current decisions and reasons

On 2026-11-11 the developer approved local catalog publication, signed-in reading/
images, withdrawal and explicit restore. Exact old links remain readable by any
verified signed-in account, including first-time readers. Reason: preserve old
runs/references without per-reader entitlements. Publishing while withdrawn does
not restore discovery. Hosted migration, synthetic checks, authored publication
and deployment remain separate approvals.

On 2026-11-11 the developer reviewed the Media page and approved chapter/article
editing, image selection/preview and glass design for newly created content.
Existing chapters must retain their design. Persist an explicit design marker on
new chapters rather than inferring appearance from dates or changing old data.
New independent copies use glass; existing-version edits retain their design.
Articles begin with glass. This reviewed repository slice includes focused tests
and continuity records; catalog publishing remains a separate slice.
The developer subsequently approved Article ordering as cover image, title,
summary, then body, in both the editor and reading preview.

The developer subsequently explicitly approved hosted migration, both requested
content-admin grants, the second account's invitation and bounded synthetic
verification/cleanup. Both migrations were applied on 2026-11-11. This approval
does not include deployment, publication, personal migration or writing activation.

The developer approved the first bounded Content Admin repository implementation
in chat on 2026-11-11: account permission, shared chapter drafts/recovery,
catalog/media foundation, Quotes integration and verification records. Hosted
setup, publication, deployment and migration of personal/legacy drafts remain
outside that approval. See [prepared implementation and limits](CONTENT_ADMIN_SETUP.md).

| Decision | Current rule and reason | Owning reference |
| --- | --- | --- |
| Product and audience | Support chosen action/reflection without scoring a person's worth. Founder audience assumptions remain hypotheses, not research. | [Product](PRODUCT.md), [audience](AUDIENCE_AND_PURPOSE.md) |
| Delivery | Web beta includes accounts, safe sync, replacement onboarding, membership and requested Athena; native follows. Supersedes core-first/Athena-later. | [Roadmap](ROADMAP.md) |
| Work cycle | Critical safety/blocked journeys before dependent work; optimize only a named measured problem, then reverify. Broad optimization is not a blanket prerequisite. | [Workflow](DEVELOPMENT_WORKFLOW.md) |
| Document authority | Repository-owned documents replace unavailable external product notes. Runtime external files still require deliberate migration. | [AGENTS](../AGENTS.md), [architecture](PRODUCTION_ARCHITECTURE.md) |
| Manual review | Developer reviews the behavior, exact scope and checks before edits; approval covers that scope. Neither agent approves the other. | [AGENTS](../AGENTS.md) |
| Onboarding | Planned required-answer flow replaces current onboarding: public signup/verification, chosen name, private birthday, background/experience/wanted change, times, one chosen daily habit, previews and feeling. Reason: recognize the person's starting point and create a usable beginning. | [Onboarding](ONBOARDING_SPEC.md) |
| Onboarding preservation | Old published versions, unfinished runs, completed access and records remain intact until reviewed replacement. Never rewrite immutable content to simplify migration. | [Record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) |
| Identity | Name/nickname is enough; no required public real name or second alias field in the target. Current auth alias remains distinct from personal evidence. | [Product](PRODUCT.md#privacy-and-identity) |
| Home | Personal Imprint is selected direction. Exact silhouette/mapping/fading and Protocol placement are open; no worth/willpower percentage. | [Home brief](PERSONAL_IMPRINT_HOME.md) |
| Reflect | Today/Reflect previews serve different purposes. Replacement layout, discoveries and Keep in Reflect remain saved proposals; implementation deferred. | [Reflect proposal](REFLECT_PAGE_POTENTIAL_IMPLEMENTATION.md) |
| Tool family | Six opened tools/supporting views use Routine's shared visual/motion engines, 24px anchors, full-page floor and natural growth. Reason: measurable consistency and reusable behavior. | [Design](../DESIGN.md#shared-tool-contract---2026-11-11), [Page standard](../app/os/APP_SESSION_STANDARD.md) |
| Checkboxes | Shared Orange glass/liquid and immediate white Log ✓. Protocol toggles only through its checkbox; passive kept words fill Orange without strikethrough. Earlier whole-row action/no-tick rules are retired. | [Design](../DESIGN.md#frame-and-controls) |
| Completion timing | Shared immediate 300ms response; retire Week's checkbox-first and three-second waits. Structural change is 600ms; typing immediate. | [Page standard](../app/os/APP_SESSION_STANDARD.md#shared-tool-interaction-contract---2026-11-11) |
| Entry/navigation | Four-root nav exists; /os remains Today, Home/Explore empty. Completed Day One enters directly; no automatic setup/review/greeting. Opened tools stay selected. | [Page standard](../app/os/APP_SESSION_STANDARD.md#navigation-and-entry) |
| Content pause | Note Line entry hidden and automatic writing Sparks paused; retain content, versions and progress. Reason: developer's explicit temporary pause while designs are reviewed. | [Product](PRODUCT.md#current-daily-tools) |
| Writing | Multiple titled Notes, silent autosave/recovery; Deep Thoughts Send/correction/Next question. No ordinary Thoughts composer, Versions/Undo or Discard draft UI on account writing. | [Product](PRODUCT.md#current-daily-tools), [record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) |
| History/corrections | Preserve prior wording/dates. Week reviews remain read only; past Habit corrections/shared day view deferred. Trash has no expiry and stays out of Athena. | [Record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) |
| Deleted questions | Keep minimal question/app-use metadata after Deep Thought deletion without answer/version/draft bodies. Reason: deletion must not reset answered questions/first use. | [Record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#trash-permanent-deletion-and-retention) |
| Protocol | Separate editing, next-day agreement changes, immutable old terms/seals and read-only past phases. Five durations: 1/3/7/14/21 days. | [Page standard](../app/os/APP_SESSION_STANDARD.md#routine-and-protocol) |
| Week | Open goals stay across tabs, tasks are day-filtered/shared with Routine. Goals complete manually; archiving preserves linked words/history. Sunday review outcomes are deliberate. | [Product](PRODUCT.md#current-daily-tools) |
| Wanted life | Character is authoritative; Routine identity then Mission are labelled fallbacks. Vision/Character/Mission/Tuesday/Six months and finite Dreamline stay distinct. | [Product](PRODUCT.md#wanted-life-records) |
| Give versus ask | Lines are unrationed and have no run/version/cooldown/completion; Chapters that ask remain rationed. Check supply before proposing a budget increase. | [Page standard](../app/os/APP_SESSION_STANDARD.md#writing-and-lines) |
| Immutable content | Published chapter id@version and authored reading editions never change. New prose means a new version/edition; derived observations are not authored publication. | [Page standard](../app/os/APP_SESSION_STANDARD.md#reflect-declarations-and-editions) |
| Local-first | Keep local evidence until exact acknowledgement; explicit empty/deleted revisions prevent stale restoration. Device clocks never choose conflict winners. | [Writing sync](ACCOUNT_WRITING_SYNC.md), [record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md) |
| Day/time | Local Circle day starts 06:00. Writing retains its starting day; old records retain attribution through travel. Quota reset in Myanmar time is separate. | [Record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#time-backdating-and-travel) |
| Athena requests | Person requests a reading; it appears when ready. One optional question; saving answers triggers no reply. Requested follow-ups are limited by allowance. Reason: person controls when AI joins and incurs usage. | [Product](PRODUCT.md#athena) |
| Athena evidence | Relevant same-owner history with sources/corrections; no drafts/Trash/deleted/login/payment context, model calls on save or background profiling. No administrator credentials for a model. | [Record contract](PERSONAL_RECORDS_AND_ATHENA_PLAN.md#athena-evidence-and-user-controls) |
| Paid boundary | Core/history/sync and received readings stay free/available after expiry; only new generation is paid. | [Product](PRODUCT.md#membership) |
| Membership time | Manual 30/90/180/365-day grants, active renewals from expiry, expired renewals from grant, local expiry display. Myanmar daily carry clears at membership monthly reset; failed requests use no allowance. | [Product](PRODUCT.md#membership) |
| Language | Simple English UI/responses at launch; Burmese/English input. Burmese/English UI/responses after launch, no Thai requirement. | [Product](PRODUCT.md#purpose-and-destination) |
| Privacy/operations | Verified email/reset, manual lost-email recovery; Singapore target; admin read-only writing, admin-only writing-bearing logs, manual account deletion, deleted backups at most 30 days, no beta user export. Actual procedures/provider disclosures need evidence. | [Product](PRODUCT.md#privacy-and-identity) |
| Deployment | Explicit developer request only; no release authority from a plan or another agent's review. | [AGENTS](../AGENTS.md) |

## Preferences and open decisions

| ID | Topic | Next decision |
| --- | --- | --- |
| O-01 | Accounts/recovery | Public signup rollout, email recovery/delivery, lost-email proof, session renewal/revocation/lost devices and production-device recovery |
| O-03 | Athena/membership | Provider/processing facts; exact tone/quality; control semantics; allowance/counting/reset-cycle/renewal/retry math, prices and budget |
| O-04 | Rewards | Formula/fairness/abuse/privacy/visibility and timing remain undecided; no invented personal-worth score |
| O-05 | Privacy/operations | Log retention/read audit, deletion coverage/turnaround, backup/restore suppression and published data-use wording |
| O-06 | Trial/release | 10–20 testers remain the recorded scope; devices/browsers, regional checks, duration/success criteria and public rollout are open |
| O-07 | Native | Framework and distribution deferred until web learning |
| O-08 | Replacement onboarding | Validation/uncertain answers, age eligibility, exact new record contracts, final completion and existing-user transition |
| O-09 | Home | Silhouette/source mapping, unknown answers, brightness/fade window, Log time interpretation and Protocol placement |

Do not treat an unresolved detail as permission to revive an older rejected
direction. The [work plan](WORK_PLAN.md) schedules questions before dependent work.
Historical conflicts that have been resolved are not current open questions.

## Decision history

The [archive index](archive/2026-11-11-doc-cleanup/README.md) explains which old
plans were retired and where useful requirements now live. Full dated decisions
retain their reasons and original verification boundaries in the
[decision archive](archive/2026-11-11-doc-cleanup/DECISION_LOG.md).
