# Circle OS product

Updated: 2026-10-30. This document records the developer's product direction.
Use [the decision log](DECISION_LOG.md) to distinguish confirmed decisions from
preferences and unresolved choices.

## Purpose and destination

Circle OS helps a person reflect on the life they live, the life they want,
and how their commitments connect the two. Athena is the AI that learns from
that person's records and offers reflections, open questions, feedback, and
motivation. The person remains in charge of their goals and choices.

The long-term product is an iOS and Android app backed by Supabase. This
repository's delivery goal is a mobile-friendly web MVP that friends and
family can test before the mobile app is built.

The immediate priority is to fix and optimize existing features and system
behavior before adding new features. Supabase and expanded Athena access are
planned work, not descriptions of the current runtime.

## The experience

1. Name something that matters and a direction worth trying.
2. Make a manageable commitment and decide how to approach it.
3. Live, record moments, write thoughts, and complete or correct commitments.
4. Read reflections grounded in those records and answer open questions.
5. Decide what to keep, change, or explore next.

Today receives input through Note, Thoughts, Routine, Protocol, Log, and Week.
Reflect holds the wanted life, readings of actual life, and the space between.
Chapters teach or ask one thing at a time. Quests group chapters into a path.

Tasks and completion records are evidence for reflection. They do not by
themselves measure the value of a life. Athena must distinguish what the person
said, what was recorded, and what she infers.

### Wanted-life records

- **Vision** names the life worth wanting.
- **Character** names who the person is becoming across mind, body, spirit, and
  social life. It is the authoritative top of Athena's chain of why.
- **Mission statement** says how the person intends to live.
- **Typical Tuesday** makes that wanted life concrete as an ordinary day.
- **Six-month picture** is a nearer milestone between today and the larger
  Vision.
- **Routine identity** is a short, editable focus for daily life. It may stand
  in when no Character exists, but it does not overwrite Character.
- A **habit identity** belongs to one habit and says who that action helps the
  person become. It is not the person's whole Character.
- **Dreamline** remains a separate finite, practical record with costs and
  immediate steps.

Declarations are dated and versioned. The newest unsuperseded Character is
authoritative; Routine identity and then Mission statement are clearly labelled
fallbacks for older or incomplete profiles.

## Athena

Confirmed responsibilities:

- Reflect on a person's own records, including task and habit completion.
- Ask open questions that help the person think and respond.
- Explore what the person wants and how they intend to approach it.
- Offer personal feedback and motivation without inventing evidence.

Current code consumes prepared readings and chapters and performs local
calculations. A future server-side service will provide authorized access to
Supabase evidence for AI preparation or interaction. Provider, inference
cadence, conversation format, memory retention, and operating cost are open.

The developer chose to test the stabilized core with friends and family first,
then add personalized Athena afterward. New AI inference and follow-up question
generation are not requirements for the first tester release. Existing prepared
readings and chapters remain part of the current core to audit and verify; this
scope decision does not remove them.

## Privacy and identity

The developer wants people to use Circle OS without disclosing a real-world
identity to other users. Username and password is the preferred login idea;
requiring email has not been decided.

Design for pseudonymous use and private personal records. Do not promise
complete anonymity: free writing can identify someone, and a service or AI
provider may process personal information even if signup collects no email.

The proposed architecture separates private evidence, authentication details,
and any intentionally public identity or score. It includes per-user access
rules, limited Athena access, clear data-processing choices, recovery, export,
and deletion. These are requirements to implement and verify, not security
claims about the current prototype. See [architecture](PRODUCTION_ARCHITECTURE.md).

## Commitments, streaks, points, and leaderboards

The developer intends to explore streaks, a leaderboard, or both, with points
for commitment and improvement. The formula, visibility, timing, fairness,
abuse handling, and inclusion in the web MVP remain undecided.

Proposals for later review:

- Begin by evaluating private personal progress before social comparison.
- Make participation in any shared leaderboard an explicit choice.
- Publish only approved score summaries and aliases, never private evidence.
- Define how edits, missed days, rest, differing goals, and self-reporting work.
- Avoid using an AI opinion of someone's life as a public ranking.

Do not implement these proposals as settled rules during stabilization.

## Current inventory

Source inspection on 2026-10-30 found:

| Area | Existing implementation |
| --- | --- |
| Daily input | Note, Thoughts, Deep Thoughts, Log and moments |
| Commitments | Habits, tasks, Protocol terms and phases, daily and weekly goals |
| Reflection | Vision declarations and history, Athena readings and replies |
| Learning | Chapter player, authoring, publishing, delivery, and Quests |
| Evidence | Browser state, migrations, outbox, revisions, profile sync |
| Personal memory | Source references, observations, confidence, corrections, editions |
| Installation | Web manifest and service worker |
| Hidden work | Dreamline and The Four behind disabled flags |

The bundled chapter registry contains 27 chapter IDs across 35 versions and
three Quests. This inventory means code exists; it does not certify each path.
[The journey record](USER_JOURNEY_TESTING.md) holds actual verification evidence.

The prototype uses browser storage and a file-based profile server. Supabase
accounts, production access policies, and mobile apps are not implemented.

## Boundaries

- Preserve the Circle identity and shared App Box/Page system while stabilizing.
- Keep records safe locally while a server is unavailable.
- Preserve chapter and reading history; migrate existing records deliberately.
- Keep real tester data out of development logs and synthetic test fixtures.
- Native framework choice follows web MVP learning; none is selected here.
- Oscar, the 3D Room, courses, and Circle membership integration appeared in
  older plans. They are unconfirmed future ideas, not current release gates.

## Authorities

- [Roadmap](ROADMAP.md): sequence, dependencies, and completion criteria.
- [Architecture](PRODUCTION_ARCHITECTURE.md): current and target systems.
- [Development workflow](DEVELOPMENT_WORKFLOW.md): required implementation cycle.
- [Design](../DESIGN.md) and [Page standard](../app/os/APP_SESSION_STANDARD.md).
- [Current task](CURRENT_TASK.md), [handoff](SESSION_HANDOFF.md), and
  [bugs](../bugs.md): active work and evidence.

Unavailable external notes are not required authorities. Preserve historical
references and existing runtime integrations until their migration is planned.
