# AGENTS.md - The Circle and Circle OS

This file governs the whole repository. Circle OS is the live product at
`/os`; the public Circle site and `/brand` share the same identity system.

## Source of truth

- Git is the source of truth for code.
- Obsidian is the source of truth for durable product thinking, brand rules,
  chapter rules, and AI continuity.
- Never store secrets in Obsidian or frontend code.

## Required preflight

Before changing Circle OS code, layout, interaction, chapters, AI behavior, or
project direction, read:

1. `C:\Brain\10 Projects\The Circle\Circle OS\START HERE.md`
2. `C:\Brain\10 Projects\The Circle\Circle OS\Circle OS Master Build Plan.md`
3. `C:\Brain\10 Projects\The Circle\BRAND_SYSTEM.md`
4. `C:\Brain\10 Projects\The Circle\CIRCLE_OS_BRAND_APPLICATION.md`
5. `C:\Brain\10 Projects\The Circle\Circle OS\App Box and Page Standard.md`
6. `app/os/APP_SESSION_STANDARD.md` for App Box, Page, swipe, chapter, or
   transition work
7. `DESIGN.md` for the short code-side design reference

Read memory-specific notes only when the task touches profiles, persistence,
Athena, Oscar, schedules, or chapter generation.

Then inspect the relevant source and run `git status --short`. Existing changes
belong to the user unless proven otherwise. Never discard or overwrite
unrelated work.

## Circle OS product rules

- Circle OS is a lifestyle reflection system, not a productivity dashboard.
- Today receives input. Vision helps the person notice the life they are
  living, the life they want, and the uncertain space between them.
- Athena observes and asks clear questions. Athena does not prescribe a life.
- Use simple language a fourth grader can understand.
- Never invent evidence about a person. Mark inference as inference.
- Preserve local-first behavior. Keep phone data safe before server sync.
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
- Every App Box rests at one shared default size. An idle App Box with more
  than one Page turns its own pages after a quiet dwell.
- One Page has one main action. Do not add decorative controls or explanatory
  words without a clear purpose.
- Motion is calm and meaningful. Existing page travel remains quick; only a
  genuinely new cover receives the slower staged reveal.
- The installed Taste skills are references, not authority. They may improve
  craft, but they must not override this file, `DESIGN.md`, the Obsidian brand
  system, or established Circle OS behavior.

## Implementation rules

- Expand the existing product instead of creating a disconnected replacement.
- Reuse existing App Box, Page, gesture, edit, persistence, and transition
  engines before adding feature-specific behavior.
- Keep legacy identifiers until there is an explicit migration plan.
- Do not put API keys or private vault paths into client bundles.
- Use `apply_patch` for intentional source edits.
- Do not deploy unless the user asks to publish or keep the live site updated.

## Working alongside another agent

Codex and Claude both change this repository, and Sai brainstorms with both.
Codex implements. Claude reviews, optimizes, and keeps the design system and
architecture coherent. Sai decides the product. Neither agent is the other's
approver: both answer to Sai, and Claude's review is advice with reasons, not
permission.

### Before starting

- Run `git status --short` and `git log --oneline -10`. Recent commits are the
  other agent's work and are usually the reason the code looks unfamiliar.
- Uncommitted changes are not yours. Read them before touching anything nearby.
  If they conflict with the task, stop and say so rather than resolving it alone.
- Read the note in `C:\Brain\10 Projects\The Circle\Circle OS` that owns the
  area you are about to change. If a decision already has a written reason, do
  not re-decide it silently; argue with it in the report or leave it alone.

### While working

- Stay inside the task. An unrelated improvement noticed on the way belongs in
  the report, not in the diff.
- Never `git add -A` or `git commit -a`. Stage the paths you actually changed,
  so half-finished work from the other agent is not swept into your commit.
- Do not rewrite history that has been pushed, and do not force-push.
- Leave the tree clean at the end of a session. Uncommitted work is invisible to
  the next agent and is the easiest thing in this setup to destroy by accident.

### What to prepare for handoff

Every piece of work ends with these, in the report and in the repository:

1. **The commit range**, so the work can be read as a diff rather than
   reconstructed from prose.
2. **What was verified and how.** Name the command and the result. `npm.cmd test`
   runs the build first, so a passing test run is also a passing build.
3. **What was not verified**, and why. Silence about a gap reads as a claim.
4. **Which invariants the change touched** from the list below, and what was
   measured to show they still hold.
5. **What remains uncertain or unfinished**, stated plainly enough that the next
   agent can pick it up without asking Sai to explain it again.
6. **The Obsidian update** — the reasoning note, the build record in
   `Circle OS Master Build Plan.md`, and a dated section in that folder's
   `START HERE.md` when app behaviour or an interaction rule changed.

### Invariants that need measuring, not reasoning

These were each established by finding a real defect. Changing one is allowed;
changing one by accident is the failure mode.

- **App Box geometry.** Every App Box rests at one shared default size, and
  `--os-body-top` is tuned to a two-line Main plus one-line Sub budget. After any
  geometry, type-scale or gap change, measure the rendered heights of Note,
  Thoughts, Habit and Protocol. They must be equal at rest.
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
- **No live-AI assumptions.** There is no API access. Anything Athena produces is
  authored ahead of time and delivered declaratively; the phone only does
  arithmetic on its own state.
- **The Circle day starts at 06:00.** Anything recorded before then belongs to
  the finished day.

### What an agent does not decide alone

- Visual language — colour, typography, brand. Those belong to a Claude Design
  session with Sai, not to code.
- The ratios and budgets that shape how the app feels. They are guesses awaiting
  lived use, and Sai is the only one using the app.
- Athena's philosophy. The wisdom and practice libraries are Sai's writing.
  An agent may build the structure and leave the positions empty.
- Deploying. Do not publish unless Sai asks. He ships to `main` himself with a
  fast-forward, because he is the only user until v1.

## Verification and handoff

- Run the smallest useful checks for the change. Prefer `npm.cmd` on Windows.
- For chapter changes, run `npm.cmd run chapters:check`.
- For app behavior, run focused tests, then lint/build in proportion to risk.
- For visual work, verify mobile first and inspect desktop when layout changes.
- Report what changed, what was verified, and what remains uncertain.
- Update the relevant Obsidian note and
  `C:\Brain\40 Logs\Decision Log.md` when work changes architecture, durable
  design rules, memory behavior, or project direction.

