# Circle OS product

Updated: 2026-10-31. This document records the developer's product direction.
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

The immediate delivery priority is the approved
[web beta launch plan](WEB_BETA_LAUNCH_PLAN.md): 10-20 invited users mainly in
Myanmar and Thailand, with Home Screen installation, accounts, safe sync,
and paid Athena. This supersedes the earlier core-first release order.
Critical data-safety and blocked-journey fixes remain launch requirements;
broader optimization and further chapter simplification are paused. Supabase
and expanded Athena access are planned work, not the current runtime.

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
Supabase evidence for AI preparation or interaction. Provider, conversation
details, memory retention, and operating cost still need implementation review.
The beta reading flow below settles how a person starts a new reading.

The current launch plan includes personalized Athena in the invited web beta.
Athena replies only when asked. Saving a reflection or answering her question
saves dated personal evidence without triggering a reply. Requesting a reply
is separate and subject to the Athena allowance; saving reflections stays free.
This rule is confirmed for implementation, not built behavior.

The person requests a reading, and that requested reading appears automatically
when ready without a second request to reveal it. This does not authorize
automatic preparation of unrequested readings. This flow is confirmed for
implementation, not built behavior.

Athena readings live in Reflect; this beta location is confirmed. Each reading
includes one optional reflection question. The person may leave it unanswered;
answering saves a reflection without triggering a reply. Readings are short,
straight to the point, calm, and advisory. Exact tone and language guidance will
be configured later in a skill or similar instruction file. Follow-up questions
have no fixed count limit beyond usage allowance; requested replies may use all
evidence available to Athena for that person, including their whole history.
Exact controls, supported languages, allowance amounts, and counting rules
remain open. Provider/model selection is deferred until integration. Actual
processing terms and spending controls must be reviewed before real evidence
is sent to an AI provider.
Existing prepared readings, history, and chapter evidence remain preserved.

## Membership

The planned free tier includes existing core tools, records, and sync. Paid
membership enables new personalized Athena generation in the browser and Home
Screen app alike. The developer manually confirms payment and grants access
for 30, 90, 180, or 365 days, with automatic expiry. No
automatic payment collection is in the beta scope. Admin grants, revocation,
audit history, configurable usage limits, and spending controls need server
enforcement. Previously received readings remain readable after paid access
expires; expiry stops new Athena generation. Core tools, personal records, and
sync remain available. Exact allowances remain a launch-contract decision.
Reading access after expiry is separate from deletion and backup rules below.

Renewals add time from the current expiry while membership is active, or from
the grant time after expiry. This starting point is confirmed for implementation
and preserves unused paid time. The four standard durations use explicit day
counts rather than calendar months or years; 365 days is not twelve 30-day
periods. Month-end adjustments do not apply. Access expires at the same time
of day after the selected duration, measured from the agreed renewal starting
point, and expiry is displayed in the person's local timezone. Timestamp storage
and date-calculation details require implementation review; membership is not
yet built.

Daily usage resets in Myanmar time (`Asia/Yangon`). Unused daily allowance
carries within the person's membership cycle, then disappears at its monthly
reset. Monthly allowance does not carry over. Failed requests consume no user
allowance. Exact amounts/counting, reset hour, monthly-cycle calculation for
longer grants, renewal effects, and retry/no-change accounting remain open.
Total spending budget, prices, and payment details are deferred.

## Privacy and identity

The developer wants people to use Circle OS without disclosing a real-world
identity to other users. Email/password login with a separate display alias is
now confirmed, superseding the earlier username-only preference.

New users must verify their email before using their account. This beta
requirement is confirmed for implementation; the access gate is not yet built.

Password recovery uses a reset link sent to the account's verified email
address. Manual recovery will also be offered when the person loses access
to that email. Both beta routes are confirmed for implementation; how the
person proves ownership and the manual process remain open. No recovery flow
is built by this documentation decision.

Login should last until logout, and local records may remain stored. They must
remain account-separated and inaccessible to another account or a signed-out
person. Session renewal, revocation, and lost-device handling require design
and verification. For conflicting device edits, the person chooses. The Circle
day still starts at 06:00 and its timezone follows the person; exact handling
of travel and dated records requires implementation review.

Design for pseudonymous use and private personal records. Do not promise
complete anonymity: free writing can identify someone, and a service or AI
provider may process personal information even if signup collects no email.

The proposed architecture separates private evidence, authentication details,
and any intentionally public identity or score. It includes per-user access
rules, scoped Athena access, a data-use explanation, recovery, and manual
account/data deletion by admin on request. Users cannot download or export
their data during beta. Operational backups and restore still need verification.
Deleted data may remain in backups for at most 30 days. Deletion turnaround and
coverage of retained devices, logs, and provider copies remain to be designed.
These are requirements to implement and verify, not security
claims about the current prototype. See [architecture](PRODUCTION_ARCHITECTURE.md).

Singapore is the chosen database region for the invited beta. Connection checks
from Myanmar and Thailand are required before launch. This is a planned setup
choice, not a provisioned database or a verified connection. It does not settle
AI processing location or other infrastructure transfers.

Requesting an Athena reading requires no separate AI opt-in prompt. The person
requests the reading directly. This beta interaction is confirmed for
implementation. The developer will explain data use manually on the website
or social pages and tell users not to enter sensitive information. Exact
wording/publication remain pending. The developer accepts processing Athena
needs without additional provider privacy restrictions at this planning stage;
actual retention, training use, and processing locations must be documented
when a provider is selected. No processing capabilities are assumed verified.

For requested readings, Athena may use relevant notes, reflections, goals,
habits, and activity records belonging to that person. Login and payment details
stay out of the AI context. Relevant evidence may come from the person's whole
history, for readings and requested replies. These boundaries are confirmed for
implementation; selection and exclusion checks are not yet built or verified.

Admin has always-available read-only access to personal writing, without a
separate support-case approval. Admin-only error logs may contain personal
writing; retention and read-access audit details remain open. This read-only
access does not remove the separate manual account-deletion power. The developer
will monitor the beta; feedback and recovery/rollback procedures remain open.

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
