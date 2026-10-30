# AGENTS.md - The Circle and Circle OS

This file governs the whole repository. Circle OS is the live product at
`/os`; the public Circle site and `/brand` share the same identity system.

## Source of truth

- Git is the source of truth for code and repository-owned project documents.
- `docs/PRODUCT.md` owns the product direction; `docs/ROADMAP.md` owns the
  delivery sequence; `docs/DECISION_LOG.md` distinguishes decisions from open
  questions. `docs/PRODUCTION_ARCHITECTURE.md` owns the current/target system map.
- `DESIGN.md`, `app/os/APP_SESSION_STANDARD.md`, and `app/brand-system.ts` own
  the accessible design references. Record conflicts rather than guessing.
- Never store secrets in product documents, test fixtures, or frontend code.

## Manual review, approval, and understanding

- Before changing files, explain the proposed changes in simple terms: what
  will change, why, which files are involved, the intended result, and how it
  will be checked. Ask for the developer's manual review and explicit approval,
  then wait before editing. This includes code, tests, documentation, and handoffs.
- Approval covers the reviewed scope. A general roadmap, bug priority, or request
  to discuss an idea is not approval to edit. Obtain approval for changes outside
  the agreed scope. Read-only investigation may prepare the concrete proposal.
- If the intended outcome, context, or acceptance criteria are unclear, ask
  focused questions and resolve them before making dependent changes. Do not
  invent the developer's intent to keep moving.
- Verify every code change against its intended behavior. Write or update
  meaningful tests when necessary and use runtime/browser checks when appropriate.
  Reverify after subsequent fixes or optimizations. Report the checks and results;
  an unverified change remains explicitly unverified and is not declared done.

## Required preflight

At session start, read this file, `docs/DEVELOPMENT_WORKFLOW.md`,
`docs/CURRENT_TASK.md`, and the current `docs/SESSION_HANDOFF.md` snapshot.
Then read the owning references for the task before proposing changes:

| Task touches | Required references |
| --- | --- |
| Product behavior, Athena's role, or product scope/direction | Relevant sections of `docs/PRODUCT.md` |
| Delivery order, release gates, dependencies, or new features | Current phase and relevant sections of `docs/ROADMAP.md` |
| Any area being changed | Search `docs/DECISION_LOG.md` and read applicable decisions, reasons, and open conflicts |
| Profiles, persistence, auth, sync, or AI | Relevant sections of `docs/PRODUCTION_ARCHITECTURE.md` |
| Layout, visual design, or interaction | Relevant sections of `DESIGN.md` and `app/brand-system.ts` |
| App Box, Page, swipe, chapter, or transition behavior | Relevant sections of `app/os/APP_SESSION_STANDARD.md` |
| Bug fixes or existing behavior and its verification | Relevant reports in `bugs.md` and evidence in `docs/USER_JOURNEY_TESTING.md` |

Apply every matching row. Search headings and terms first, then read enough
surrounding context to understand the rules and exceptions. A link alone is
not a reason to load a whole document or archive. Expand the read when scope,
dependencies, or conflicting evidence make more context necessary. If required
context remains missing or unclear, ask before dependent edits. Do not reread
unchanged material already available in the session.

Inspect relevant source when the task touches profiles, persistence, Athena,
schedules, or chapter generation. Supabase is the target backend; the current
runtime is still the browser plus a file-based profile server.

Then inspect the relevant source and run `git status --short`. Existing changes
belong to the user unless proven otherwise. Never discard or overwrite
unrelated work.

## Legacy external notes and integrations

On 2026-10-30 the developer authorized replacing missing external documents
with repository-owned sources. Unavailable Obsidian notes are no longer
required preflight or pending update targets for new decisions. Historical
handoffs remain historical; never claim those notes were read or updated.

The current profile server and chapter compiler still use external files.
Changing document authority does not remove those runtime integrations or
migrate personal records. Plan and verify any migration separately. Never
invent the contents of an unavailable file or discard data to remove a path.

## Session continuity

Use the shared [session-start checklist](docs/DEVELOPMENT_WORKFLOW.md#session-start)
and [handoff checklist and template](docs/DEVELOPMENT_WORKFLOW.md#session-handoff).
The workflow also defines [document responsibilities](docs/DEVELOPMENT_WORKFLOW.md#document-responsibilities).

Historical handoffs and archives are evidence, not current authorization.
Flag conflicts with current authorities and ask about unresolved decisions.
A recorded bug is not permission to edit. Mark it fixed only after verification;
if verification is blocked, record the gap and remind the developer.

## Circle OS product rules

- Circle OS is a lifestyle reflection system, not a productivity dashboard.
- Today receives input. Vision helps the person notice the life they are
  living, the life they want, and the uncertain space between them.
- Athena observes and asks clear questions. Athena does not prescribe a life.
- Athena's intended role includes personal feedback, motivation, and reflection
  on goals and behavior. Ground these in the user's evidence and choices.
- Use simple language a fourth grader can understand.
- Never invent evidence about a person. Mark inference as inference.
- Preserve local-first behavior. Keep phone data safe before server sync.
- The current delivery goal is a web MVP for friends and family. iOS/Android
  and Supabase-backed personalized Athena are the long-term direction.
- The first friends-and-family test covers the stabilized core. Add new
  personalized Athena afterward; audit existing prepared content as core.
- Fix and verify existing features, optimize with evidence, then test and verify
  again before feature expansion. Follow `docs/DEVELOPMENT_WORKFLOW.md`.
- One user has one profile. Do not edit generated profile state or day data by
  hand unless the task explicitly requires that workflow.

## Design rules

- Preserve the Circle identity: Whole. Human. Alive.
- Use Geist inside functional app surfaces. Use Cormorant Garamond only for
  outer editorial headings.
- Use Bone, Ink, Orange, and Charcoal from `app/brand-system.ts`.
- Mobile is the primary experience. Use comfortable gutters and at least 44px
  touch targets.
- An App Box is the stable frame. Pages move inside it. The frame must not jolt,
  flash, or expose gaps during a swipe or resize.
- Reuse the shared Page anatomy: Header, Heading, Main Body, Sub Body, Footer.
- Main Body receives roughly two parts of body space; Sub Body receives one.
  On Cover, Note and Thoughts that weight is where the eye lands, not reserved
  space: an empty Sub Body costs nothing and the App Box stays at its default.
- Every App Box has one shared default minimum size. Empty and short Pages rest
  there; real content may grow the frame downward.
- Only the Today Note/Thoughts session turns its pages automatically after the
  shared idle dwell. Two-page facts and jokes on its Line side may also turn.
  Other Apps stay on the chosen Page; journeys, Chapters, and pending
  publications never rotate. Follow the Page standard's idle-rotation rules.
- One Page has one main action. Do not add decorative controls or explanatory
  words without a clear purpose.
- Motion is calm and meaningful. Existing page travel remains quick; only a
  genuinely new cover receives the slower staged reveal.
- The installed Taste skills are references, not authority. They may improve
  craft, but they must not override this file, `DESIGN.md`, the Page standard,
  or established Circle OS behavior.

## Implementation rules

- Expand the existing product instead of creating a disconnected replacement.
- Reuse existing App Box, Page, gesture, edit, persistence, and transition
  engines before adding feature-specific behavior.
- Keep legacy identifiers until there is an explicit migration plan.
- Do not put API keys or private vault paths into client bundles.
- Use `apply_patch` for intentional source edits.
- Do not deploy unless the user asks to publish or keep the live site updated.

## Working alongside another agent

Codex and Claude both change this repository, and the developer brainstorms
with both. Codex implements. Claude reviews, optimizes, and keeps the design
system and architecture coherent. The developer decides the product. Neither
agent is the other's approver: both answer to the developer, and Claude's
review is advice with reasons, not permission.

### Before starting

- Follow the shared session-start checklist, including Git status and history.
- Read nearby uncommitted changes before editing. If they conflict with the
  task, stop and explain the conflict instead of resolving it alone.
- Read the owning document and relevant decision before changing an area.
  If a decision has a written reason, explain any disagreement to the developer.

### While working

- Stay inside the task. An unrelated improvement noticed on the way belongs in
  the report, not in the diff.
- Never `git add -A` or `git commit -a`. Stage the paths you actually changed,
  so half-finished work from the other agent is not swept into your commit.
- Do not rewrite history that has been pushed, and do not force-push.
- Preserve pre-existing working-tree changes and leave your edits reviewable.
  Stage or commit only when the developer explicitly asks. Report uncommitted
  and untracked work; never discard changes to force a clean tree.

### What to prepare for handoff

Use the shared handoff checklist and template. Include actual verification,
unverified work, touched invariants and measurements, remaining uncertainty,
and the next action. Give a commit range only when commits were made.

### Invariants that need measuring, not reasoning

These were each established by finding a real defect. Changing one is allowed;
changing one by accident is the failure mode.

- **App Box geometry.** Every App Box has one shared default minimum size, and
  `--os-label-gap` owns the forehead from the App Label to the first visible
  content. Main begins at that anchor and grows downward; it does not centre as
  its line count changes. After any geometry, type-scale or gap change, measure
  the rendered heights and forehead gaps of Note, Thoughts, Habit and Protocol.
  Empty and short Pages must be equal at rest; real Habit and Protocol rows may
  grow downward without an inner scroll panel.
- **Give versus ask.** Content that gives is unrationed; content that asks stays
  rationed. A Line never acquires a run, version, cooldown or completion. Before
  raising any chapter budget, check supply rather than raising the number.
- **Chapter versions are immutable.** A published `id@version` never changes its
  content. Change means a new version, because a finished run still renders the
  pages it was answered on.
- **Athena's editions accumulate.** A reading is dated and immutable. A morning
  that says the same thing publishes nothing. Only authored prose becomes an
  edition; derived observations may stand in on screen but never be published.
- **Local-first persistence.** The phone keeps evidence until the server
  acknowledges a revision. A clearing edit writes a dated empty value rather than
  removing a record, or an older server copy restores it on merge.
- **Current versus planned AI.** The current phone consumes prepared Athena
  content and performs local calculations. The target includes server-side AI
  with authorized Supabase evidence access. Do not assume a provider, credentials,
  live inference, or database access exists before implementation and verification.
  The model never receives database administrator credentials.
- **The Circle day starts at 06:00.** Anything recorded before then belongs to
  the finished day.

### What an agent does not decide alone

- Visual language — colour, typography, brand. Those belong to a Claude Design
  session with the developer, not to code.
- The ratios and budgets that shape how the app feels. They are guesses awaiting
  lived use, and the developer is the only one using the app.
- Athena's philosophy. The wisdom and practice libraries are the developer's
  writing.
  An agent may build the structure and leave the positions empty.
- Deploying. Do not publish unless the developer asks. The developer ships to
  `main` with a fast-forward, because they are the only user until v1.

## Verification and handoff

Use the workflow's [check selection](docs/DEVELOPMENT_WORKFLOW.md#choosing-checks)
and session-handoff checklist. Run the smallest useful checks that verify the
approved change. Preserve the invariants above and report any verification gap.

