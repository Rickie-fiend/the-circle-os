# Circle OS chapter simplification plan

Date: 2026-10-31 (Asia/Bangkok).

## Status and authorization

The developer approved writing this plan and linking it from the current task.
This is a documentation-only change. Chapter edits, code, tests, migrations,
commits, and deployment are not authorized by that approval. The proposals below
remain reviewable design choices, not implemented behavior or replacements for
the current product decisions.

## Goal and user direction

Make the main path short while keeping the depth available by choice.

- Onboarding asks only what sets general direction and current priorities.
- Keep most of the useful questions; make deeper exploration optional.
- Reduce questions in the same lane without treating different answers as equal.
- Unopened exercises and saved reflections should not feel like unfinished tasks.
- Explore collapsible tools, beginning with Log; do not assume this is better.
- Preserve Circle OS as a lifestyle reflection system, with simple language,
  personal choice, and evidence-grounded Athena content.

## Baseline and limits

The supplied folder contains 32 Markdown files. Counting only the latest supplied
version per ID gives 27 chapters, 94 questions, and 77 required answers. These are
content-library totals, not one session or a certified count of the runtime.
The supplied source folder and bundled registry have different version inventories;
reconcile them before authoring. Do not overwrite a published ID/version.

Day One has nine required answers over 13 pages despite promising six lines.
The twelve Profile Sparks contain 36 questions. Week Review asks nine required
questions and includes next-week planning. Direction and small-action questions
recur across Day One, Habit Building, Day Open, Week Setup, and Dreamline.

The inspected scheduler permits three new chapters per hour and one probe per
day. Opened runs may still finish. Delivery is already rationed; changing its
budget or cadence is a separate product choice. Large cards and unfinished
indicators may add pressure, but that is a hypothesis from the screenshots and
developer feedback, not a completed usability study.

## Proposed onboarding

| Draft question | Purpose | Treatment |
| --- | --- | --- |
| What matters most to you right now? | Current priority | Main; allow 'I am not sure yet' |
| What would you like to be different? | General direction | Main; allow 'I am still thinking' |
| What is one small thing you would like to try? | Optional first action | Optional; explicit choice before adding a commitment |

Allow a few words or a sentence. Summarize the person's own words, then open
the app without automatically launching another exercise. Preserve a dismissible,
resumable journey. Unknown or skipped answers must never become invented evidence.

Store priority and direction with their actual source. Do not silently turn them
into a complete Character, Vision, Mission, or habit identity. Review whether a
new onboarding ID is needed after mapping existing Day One projections and gates.
Provisional usability target: reach the app in under two minutes without help.

### Day One draft for review - 2026-10-31

The developer approved adding this draft and dependency map to this plan only.
This does not authorize chapter publication or application changes. The wording
below is the reviewed starting draft; storage, action confirmation, and access
behavior still need a concrete implementation proposal.

| Page | Exact draft wording | Intended behavior |
| --- | --- | --- |
| Cover | **Start with what matters.** A few words are enough. You can explore more later. | Begin the short, dismissible journey. |
| Priority | **What matters most to you right now?** | Accept a few words or a sentence; allow 'I am not sure yet'. |
| Direction | **What would you like to be different?** | Accept a few words or a sentence; allow 'I am still thinking'. |
| Optional action | **What is one small thing you would like to try?** | Allow skipping. An answer alone does not create a commitment; require an explicit choice before saving one. |
| Finish | Show the person's own answers, then **Open the app**. | Do not invent a summary or automatically launch another exercise. |

#### Answer-to-record map

Keep the new answers as Day One responses with their source run, chapter version,
and recorded time. Proposed answer keys below are new names for review, not an
implemented schema. Preserve uncertainty as stated and skipped actions as absent.
Do not map these broad answers onto old keys with different meanings.

| Draft answer | Proposed answer key | Intended record or effect |
| --- | --- | --- |
| Current priority | `day-one-priority` | Source-labelled Day One response; no automatic goal, Character, or identity update. |
| Wanted change | `day-one-direction` | Source-labelled Day One response; no automatic Vision, Mission, or Character declaration. |
| Small thing to try | `day-one-optional-action` | Source-labelled Day One response. Create a commitment only after an explicit choice; its type, destination, and confirmation wording remain to be reviewed. |
| Uncertain response or skipped action | Respective key, when answered | No inferred trait, habit, rule, goal, or task. Show only what the person actually supplied. |

The current `day-one@2` bundled definition and external `Day One.md` both contain
nine required answers across 13 pages. The bundled registry also retains version
1. `saveDayOneRun` in `app/os/circle-os-shell.tsx` currently applies these outcomes:

| Current answer keys | Current completion effect | Shorter Day One consequence |
| --- | --- | --- |
| `identity-focus` | Updates Routine identity. | Broad priority/direction answers must not replace it. |
| `character-past`, `character-dimension`, `character-trait` | Calls the Character declaration action. | The completion handler needs a separate path for the new draft; it must not call this action with missing answers. |
| `habit-action`, `habit-time-place`, `character-trait`, `character-dimension` | Creates a Habit with its cue, identity, and dimension; may update profile identity focus. | No automatic starter Habit from the new answers. Review later Habit setup and recovery without a starter. |
| `day-one-term` | Creates and begins a one-day Protocol. | The shorter draft supplies no Protocol term. |
| `day-one-goal`, `day-one-step` | Creates a weekly goal and, when supplied, a linked task for today. | Neither new priority nor optional action silently becomes this goal/task pair. |

This is a source inspection, not a new runtime verification. Preserve published
versions and old answers. Decide the new chapter ID/version and how unfinished
older runs resume before implementation; do not restart completed users.

#### Confirmed Protocol access decision - 2026-10-31

The confirmed [setup-gate decision](DECISION_LOG.md#2026-10-30--setup-chapters-control-app-access)
opens Protocol after any published Day One version completes. Its stated reason
is that setup supplies the records the App needs. `app/os/phases.js` implements
that completion gate; the current Day One handler supplies the first Protocol.
The shorter draft would complete without supplying that record.

The developer confirmed keeping the access gate: completing the shorter Day One
opens Protocol. If no Protocol exists, offer setup when needed through an
intentional empty/on-demand setup path. Do not create a Protocol or invent its
terms from the new Day One answers. Existing completed users keep their access
and records. See the [decision and reason](DECISION_LOG.md#2026-10-31--shorter-day-one-opens-protocol-with-setup-when-needed).

The exact empty-state wording, setup entry interaction, and implementation remain
to be proposed and reviewed. This decision is not application-edit approval.
Week remains gated by Week Setup; its offer still begins on the next Circle day
after Day One completion, with the 06:00 boundary unchanged. Check that later
setup works without the records removed from Day One.

Before an implementation proposal, also review completion through the splash,
publication, and Getting started Quest entry points, including the Quest's
current description and six-minute estimate. Keep existing shared journey and
persistence engines. No access gate, outcome handler, chapter, or Quest was
changed by this documentation update.

## Chapter treatment

Main means central to an exercise, not mandatory for every user. Optional means
the person chooses to open it. Alternative means another way into a similar topic.
Later means offered when the person needs the tool or exercise.

| Chapter | Main purpose or draft question | Optional, alternative, or later |
| --- | --- | --- |
| Day One | Priority and wanted change | Past self, ideal identity, dimension, trait, rule, habit cue, separate goal and step |
| Day Open | What matters to you today? | Mood as an alternative invitation; avoid another automatic Time question |
| Happy | How does today feel? | Explanation; support mixed feelings and uncertainty |
| Time | What would you like more time for today? | Example; alternative to Day Open |
| Hard | What was hard today? | Categories as help and optional explanation; allow nothing to name |
| Miss | What do you want to make more room for? | Reason; original miss question as an alternative; review changed meaning before retaining the ID |
| Color | Playful alternative to naming a feeling | Explanation; no extra automatic mood rating |
| Habit Building | Choose one small habit | Cue when scheduling; identity as optional depth; review an existing action rather than ask again |
| Log Setup | Usual wake and sleep times | Open when choosing to set up Log |
| Vision | What would you like your life to be like? | Why it matters |
| Mission | How the person intends to live | Deeper exercise within the wanted-life path |
| Typical Tuesday | Picture an ordinary day in that life. What happens? | Place, morning, people, evening, and feeling as prompts |
| Dreamline | Name a specific dream | Date and next step when choosing to plan; further immediate steps optional; retain its practical costs and finite scope |
| Week Setup | What matters most this week? | First step; move six-month and Character exploration into deeper exercises |
| Week Review | What felt good? What was hard? What would you carry forward? | Questions skippable; next-week planning by choice; rules and recovery plans optional |

Vision, Character, Mission, Typical Tuesday, Six-month picture, Routine identity,
habit identity, and Dreamline retain distinct meanings and histories. A common
entry point is not a data merge. Respect Character's existing authority and
labelled fallbacks. Reflect remains for reading; its invitations launch the
existing chapter journey rather than creating a second form engine there.

## Profile Spark treatment

Keep all twelve topics. Start with one question and offer the remaining prompts
through an explicit optional action such as 'Explore this'. Review exact wording
against the originals so brevity does not remove useful distinctions.

| Spark | Draft main question | Optional depth |
| --- | --- | --- |
| Rhythm | When do you usually feel at your best? | Energy sources and recovery |
| Attention | What holds your attention? | Distractions and helpful focus settings |
| People | What helps you feel supported? | Energy after company and ease of honesty |
| Space | Where do you feel most at ease? | Friction and inside/outside preferences |
| Choice | What helps you make a choice? | Current decision and plans versus open time |
| Rest | What helps you feel rested? | Missed fun and difficulty allowing rest |
| Meaning | What makes a day feel worthwhile? | Quiet pride and what to protect |
| Growth | What change would help you feel more like yourself? | Curiosity and signs of change, if any |
| Small Good | Was there a good moment today? | Feeling awake and making the day kinder |
| What Stood Out | What stood out today? | Surprise and unexpected energy cost |
| Listen In | What do you need right now? | Helpful people and a kind next step |
| Carry Forward | What would you like to carry into tomorrow? | Repeat, release, and hope |

Rhythm/Rest, Space/Attention, Happy/Small Good/Carry Forward, and
Meaning/Miss/Mission/Vision share lanes. Use alternatives and visible reuse,
not silent equivalence. A dated daily experience is not a lasting preference.

## Optional questions and delivery

- Marking Required false alone may leave the same number of pages. Optional
  depth must be bypassable without traversing each question.
- Offer one clear automatic daily reflection invitation as a trial proposal,
  with further exercises available by choice. Review this against the current
  hourly budget and chapter offers before changing any scheduling behavior.
- Use authored branches and deterministic rules; no new personalized AI is needed.
- Do not immediately replace a finished exercise with another expected task.
- Show reusable answers with date and source, and let the person accept, update,
  or expand them. Never overwrite separate records because their topics overlap.
- Use neutral completion copy. Avoid claiming Athena understands a trait from
  a few answers. Remove gender assumptions and allow uncertainty or no example.
- Keep reading/giving content distinct from rationed question/asking content.

## Unfinished work

| State | Proposed presentation |
| --- | --- |
| Available, unopened | Optional invitation; no unfinished badge or task debt |
| Started | Saved draft with Continue and Put away |
| Put away | Out of active attention; answers preserved and recoverable |
| Completed | Saved and available to revisit |
| Chosen commitment | Action or habit explicitly selected by the person |

Use one quiet draft entry rather than a stack of unfinished reflection cards.
Do not hide or complete actual user-created commitments. Specify how Put away
differs from today's dismissal, the scheduler's four-hour return, and deletion.
Review storage, sync, reopening, and multiple-draft behavior before implementation.
Optional profile exercises should not display a completeness target.

## Collapsible Log trial

Prototype Log only before considering other tools. Distinguish the everyday Log
tool from its setup chapter. A closed tool shows its name, factual summary, and
Open control. Avoid private note text in the summary unless explicitly reviewed.

Check touch, keyboard, screen-reader expanded state, focus after closing, swipe
conflicts, reduced motion, discoverability, draft retention, and offline reload.
Choose whether open/closed state persists as a device preference during design
review; do not sync it as personal evidence by accident.

A compact state conflicts with the shared App Box minimum-size contract. Review
it as a separate presentation rather than globally shrinking App Boxes. Preserve
the expanded frame, forehead anchor, typography, colors, and stable transitions.
Compare with the current Log before deciding whether to keep or expand the trial.

## Delivery sequence and outputs

Follow [the development workflow](DEVELOPMENT_WORKFLOW.md). Existing Phase 1
gaps remain open; planning does not certify stabilization or change release order.

1. **Audit and dependencies:** map every original question to purpose, overlap,
   revised treatment, answer key, record/projection, entry points, and empty-value
   behavior. Reconcile supplied Markdown with all bundled versions. Deliver a
   question-level matrix; this plan's chapter map is not that completed audit.
2. **Reviewable drafts:** prepare exact onboarding and revised chapter text,
   optional branches, draft states, gate choices, and before/after Log layouts.
   Obtain review of the concrete implementation scope before file changes.
3. **First implementation slice:** new onboarding Markdown/version, compiled
   registry, outcome handling, and approved gate behavior. Verify before proceeding.
4. **Question depth and unfinished work:** implement optional paths, visible
   reuse, delivery rules, recoverable drafts, and reviewed chapter revisions.
5. **Log trial:** implement the reviewed compact presentation in isolation.
6. **Evaluate:** observe first and return visits with friends and family, refine
   only against evidence, and repeat affected checks after optimizations.

## Files and integration points

Paths below identify likely areas, not approval to edit them all.

- External chapter sources: D:/CircleOS/Chapters/Published Soruces. Use new
  immutable versions; existing sources are not safe overwrite targets.
- Bundled registry and Quests: app/os/chapters/published/index.json and
  app/os/chapters/published/quests.json, through the existing publishing process.
- Scheduling: app/os/chapters/chapter-scheduler.js.
- Day-opening and access: app/os/day-door.js and app/os/phases.js.
- Setup outcomes, projections, Today, and chapter integration:
  app/os/circle-os-shell.tsx and existing shared player/model modules discovered
  during the dependency audit. Extend shared engines rather than duplicate them.
- Reflect entry points: app/os/mirror/page.tsx.
- Approved product decisions: PRODUCT.md, DECISION_LOG.md, and, only if release
  order changes, ROADMAP.md. Layout decisions: ../DESIGN.md and
  ../app/os/APP_SESSION_STANDARD.md. Keep CURRENT_TASK.md and SESSION_HANDOFF.md
  focused on the active slice and actual verification.

## Decisions to resolve before dependent code

- Protocol will continue to open after any published Day One version completes,
  including the shorter version. The developer chose setup when needed if no
  Protocol exists; review the exact empty state and setup interaction before
  implementation. Preserve old completion access. Week opens after Week Setup,
  whose offers begin the next Circle day; check it works without omitted records.
- Review final question text, the identity of changed exercises, new answer keys,
  and the desired onboarding exit behavior before publishing.
- Review optional branch completion semantics, Quest progress, and recovery of
  older/in-progress runs. Do not restart old users just because a new version exists.
- Decide delivery cadence, draft dismissal/reappearance, compact Log sizing,
  and whether open/closed preference persists. These remain hypotheses.
- Supabase, mobile delivery, new AI providers, and personalized generation remain
  outside this change. Existing prepared Athena content remains part of the core.

## Acceptance and verification

- New users can enter via the shorter setup, including uncertain responses and
  no selected action, without fabricated identity, rules, habits, or goals.
- Optional follow-ups can be bypassed, revisited, and saved. Unopened exercises
  create no backlog. Put-away drafts remain recoverable.
- Test old completed and in-progress versions, later manual edits, and outcomes
  through built-in, publication, and Quest entry points. Prevent duplicate habits
  or tasks; preserve existing declarations and reading editions.
- Verify access gates, the 06:00 Circle day, local reload, offline retries,
  acknowledged revisions, clearing edits, and sync merges for affected records.
- Use isolated synthetic profiles and blocked/intercepted external sync. Never
  hand-edit owner profile/day records or use personal writing as fixtures.
- Run npm run chapters:check for content changes, focused behavioral tests,
  appropriate lint/build, and mobile browser journeys at representative widths.
  Geometry changes require measured Note, Thoughts, Habit, and Protocol heights
  and forehead gaps, plus Log expansion/collapse checks.
- Measure first-visit duration, hesitation, skips, understood priority, perceived
  pressure, discoverability of depth and Log, and usefulness of reflection.
  Under two minutes is a trial target, not a verified result. Chapter completion
  is not the measure of a worthwhile life or the sole success metric.
- After each optimization repeat affected checks. Record failures and gaps;
  do not declare a path verified from lint/build alone.

## Current documentation delivery

This plan and the current-task link are the approved deliverable. Preserve the
previous task and handoff before replacing active continuity records. Keep
product authorities unchanged until concrete behavior decisions are reviewed.
No implementation, chapter publication, migration, staging, commit, or deployment
is part of this documentation pass.
