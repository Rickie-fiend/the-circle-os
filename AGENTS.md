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

1. `C:\Brain\10 Projects\Grimm App\Project Home.md`
2. `C:\Brain\10 Projects\Grimm App\Agent Operating Rules.md`
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

## Verification and handoff

- Run the smallest useful checks for the change. Prefer `npm.cmd` on Windows.
- For chapter changes, run `npm.cmd run chapters:check`.
- For app behavior, run focused tests, then lint/build in proportion to risk.
- For visual work, verify mobile first and inspect desktop when layout changes.
- Report what changed, what was verified, and what remains uncertain.
- Update the relevant Obsidian note and
  `C:\Brain\40 Logs\Decision Log.md` when work changes architecture, durable
  design rules, memory behavior, or project direction.

