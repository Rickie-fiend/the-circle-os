# Circle OS decision log

Record confirmed decisions, preferences, proposals, and unresolved questions
separately. Older handoff entries remain historical evidence; this log records
the decisions that supersede their active product assumptions.

## 2026-10-30 — product destination and stabilization

Confirmed by the developer:

- The long-term product is an iOS/Android app powered by Athena.
- Athena provides personal reflection, open questions, behavior analysis,
  feedback, and motivation around what a person wants and how they approach it.
- Supabase is the intended backend, with authorized evidence access for Athena.
- Personal information needs strong privacy protections. People should be able
  to participate without disclosing a real identity to other users.
- This project's endpoint is a web MVP for friends and family before mobile.
- Fix and optimize current features and the system before adding new features.
- Follow code, test, fix, verify, optimize, then test/verify again.
- Missing external documents can be ignored/removed or replaced locally.

Implementation status: documentation records this direction; no Supabase
database, new authentication, AI provider, scoring, or native app was added.

## 2026-10-30 — repository authorities

Implementation of the developer's missing-document instruction:

- `docs/PRODUCT.md`, `docs/ROADMAP.md`, and this log hold product direction.
- `docs/PRODUCTION_ARCHITECTURE.md` distinguishes the current prototype from
  the Supabase target; `docs/DEVELOPMENT_WORKFLOW.md` owns the work cycle.
- `DESIGN.md`, `app/os/APP_SESSION_STANDARD.md`, and `app/brand-system.ts` remain
  the accessible design references. No missing note's contents were inferred.
- Historical handoffs and current file-server integrations are retained. This
  documentation change does not migrate, discard, or disconnect vault records.
- Pending external-document updates in old handoffs are superseded by local
  decision recording for new work; they are not claims of external updates.

## 2026-10-30 — first test covers the stabilized core (O-02 resolved)

The developer chose: "Test the stabilized core first; add Athena afterward."
The first friends-and-family release validates current features after fixes
and optimization. New personalized Athena integration follows that core test
and its feedback. It is not a prerequisite for the first tester release.

This supersedes the earlier proposal to include new personalized Athena before
the first web MVP test. Existing prepared readings and chapters remain in the
current feature audit. No app behavior was changed to record this decision.

## 2026-10-30 — manual review, clarification, and code verification

Confirmed standing instructions from the developer:

1. Verify every code change works as intended; write tests when necessary.
   Repeat verification after fixes or optimizations and report any unverified gap.
2. Explain intended file changes in simple terms, ask for manual review and
   explicit approval, and wait before editing. This applies to documentation,
   tests, and handoff notes as well as application code.
3. Ask focused questions whenever necessary context or the intended outcome is
   unclear, and resolve that uncertainty before making dependent changes.

The developer explicitly approved this documentation update after reviewing
its proposal. That approval does not authorize application changes or the
broader documentation consolidation and test harness proposed in the audit.

These instructions supersede earlier permission to continue editing simply
because stabilization or a bug list had been prioritized. Work within a
reviewed, approved scope can proceed; new scope needs another review.

## 2026-10-30 — limited idle rotation confirmed

The developer approved retaining the current limited rotation and aligning
the five reviewed documents. This confirms the narrower rule deliberately
introduced in commit `2cd633e`, rather than restoring the older broad rule.

- Only the Today Note/Thoughts session turns automatically after the shared
  `IDLE_PAGE_DWELL_MS` dwell (currently 30 seconds).
- Two-page facts/jokes on the Line side of that same box may also turn.
  A one-page quote has no second Page to turn to.
- Routine, Protocol, Log, Vision, Week Review, and Athena stay on the chosen
  Page. Journeys, Chapters, and pending publications never rotate.
- Interaction restarts the dwell; focus, a partly written Thought, and a
  background tab prevent turning under the
  [Page standard's rule](../app/os/APP_SESSION_STANDARD.md#idle-rotation).

Source inspection found the Today timer enabled, Routine's
`rotateIdleApps={false}`, and the chapter player's rotation default disabled.
These are source findings, not a fresh browser verification.

This keeps idle Thoughts-to-Note switching as intended policy. The reported
Habit reset remains a separate unresolved report; it was not explained,
fixed, or browser-verified by this decision. No bug status was changed.

## 2026-10-30 — Note and Line confirmed

The developer approved keeping Note/Line with the existing swipe/reaction
exits and aligning the five reviewed documents.

- The Note label opens a Line on the back of the same App Box, not an
  unfinished or dismissed Chapter. This confirms the change introduced by
  commit `df4cab2`.
- Preserve legacy immutable Note publications and their saved history.
  New Note-style chapter deliveries use Thoughts under the Page standard;
  other App destinations retain their existing delivery rules.
- A Line does not close itself on a timer. Its `FACT`, `JOKE`, or `QUOTE`
  label is text, not a return button.
- Swipe backward past the first Page to return to Note. Swipe forward past
  the last Page to reveal reactions; react or swipe forward past the end again
  to return. A reaction records optional feedback and does not create a
  Chapter run or completion.
- Two-page Lines retain the previously approved limited idle rotation.

Source inspection found `openNoteLine`, `closeNoteLine`,
`dismissLineBackward`, `passLineForward`, and `reactToRevealedLine` in
`app/os/circle-os-shell.tsx`. The prior review checked commit `df4cab2`
against the Page standard. Runtime exits and legacy-publication readability
were not browser-verified in this documentation update.

Bug 6 (placeholder text becoming saved Note text) remains unresolved and
separate from the Line-back decision. No bug status or personal record changed.

## 2026-10-30 — Protocol grows to show its terms

The developer chose continuous content growth for Protocol after reviewing the
fixed-height and growing alternatives.

- The shared App Box height is a minimum for empty and short Pages.
- Draft, running and finished Protocol Pages grow downward when their terms need
  more room. Terms stay visible in the Page instead of moving into an inner
  scrolling panel.
- This matches Routine's continuous rows and keeps one natural page scroll on
  mobile. Long Protocols may require more page scrolling; lived use will show
  whether a separate compact view is useful later.
- Current code already follows this behavior. Measurements found an active
  three-term Protocol at 548.70px and the empty Protocol home at 344px, with no
  horizontal overflow or page errors in the isolated mobile checks.

This decision replaces the fixed-height running/finished Protocol sentence
introduced in commit `722bd5b`. It does not create a term limit. Main placement
is governed by the forehead decision below.

## 2026-10-30 — Main content keeps the forehead anchor

The developer chose the later forehead placement over restoring vertical Main
text centring.

- `--os-label-gap`, currently 80px, owns the distance from the App Label to the
  first visible content. Main begins there for every line count.
- Adding or removing Main lines does not move the first line. After the ordinary
  three-line height budget is used, additional lines grow the App Box downward.
- This preserves the consistent cross-App starting position established in
  commit `d983c0a` and measured at 80.90–80.91px in the isolated mobile pass.
- Sparse Pages may leave more space below short text. That is accepted in favor
  of stable editing and swipe transitions.

The unused centring output may be removed while retaining the calculation that
grows the Body for long Main content.

## 2026-10-30 — Character is authoritative

The developer approved this relationship among wanted-life and identity
records:

- Vision names the life worth wanting.
- Character names who the person is becoming across mind, body, spirit, and
  social life. The newest unsuperseded Character is the authoritative top of
  Athena's chain of why.
- Mission statement says how the person intends to live. Typical Tuesday shows
  an ordinary day in that life. Six months is a nearer milestone.
- Routine identity is a short editable daily focus. Habit identity belongs to
  one habit. Neither overwrites or outranks Character.
- When Character is absent, Athena may use Routine identity and then Mission as
  explicit stand-ins. She must preserve the source label.
- Dreamline stays separate as a finite practical record with costs and steps.

The current Reflect front remains Vision, Mission statement, and Typical
Tuesday. Character and Six-month Page design is deferred to a separate review;
this decision changes authority and Athena's existing local alignment, not the
visible Reflect page count.

## 2026-10-30 — setup chapters control App access

The developer confirmed keeping the chapter-based gates introduced in commit
`9482fea`, superseding the day-based access plan in `3581804`:

- Protocol opens after completing Day One (`day-one`).
- Week opens after completing Week setup (`week-setup`).
- Completion in any published version satisfies that App's setup gate.
- Waiting alone does not open either App; finishing setup does not require an
  additional day-two or day-seven wait.
- Preserve existing offer timing: Week setup is automatically offered after
  the next Circle day begins following Day One completion. The Circle day
  starts at 06:00. Chapter offers and review timing are separate from App access.

Reason: setup supplies the records the App needs. A date could open an empty
App or keep a person out after they had already completed its setup.

The older phase narrative and elapsed-day helpers remain historical context,
not access rules. Their comments were clarified; runtime behavior, chapter
versions, budgets, personal records, and review timing were not changed.
Focused gate tests passed 4/4. No fresh browser verification was performed.

## Preferences and open decisions

| ID | Topic | Status and next decision |
| --- | --- | --- |
| O-01 | Login | Developer prefers a unique username and password. Email collection is undecided. Choose a supported authentication and recovery design before implementation. |
| O-03 | AI operation | Choose provider, scheduled/on-demand cadence, processing consent, retention, correction behavior, and cost budget. |
| O-04 | Rewards | Streaks and/or leaderboard are intended possibilities. Formula, fairness, abuse handling, visibility, and MVP timing are undecided. |
| O-05 | Privacy contract | Decide allowed data processing, retention/deletion, backup expiration, region, and operator access. Pseudonymity is not a claim of complete anonymity. |
| O-06 | Trial and release | Agree tester count, duration, supported devices, and meaningful success criteria. Preserve explicit deployment authorization. |
| O-07 | Native implementation | iOS and Android are confirmed destinations; framework and implementation schedule follow web learning. |

Recommendations awaiting product decisions: private-by-default evidence,
optional sharing of score summaries, recovery that does not expose an identity,
and no ranking based on an AI judgment of a person. These are not a settled
scoring system or an approved login implementation.

## Existing design conflicts to reconcile

- Idle rotation wording was reconciled by the limited-rotation decision above.
  Its browser behavior still needs verification; the other conflicts below remain open.
- Note/Line opening and swipe/reaction exits were reconciled by the Note and
  Line decision above. Runtime verification remains pending.
- Shared minimum height, Protocol growth, and forehead placement were reconciled
  by the decisions above. Their focused runtime evidence is recorded in the
  current task and handoff; broader device coverage remains pending.
- Character authority and identity relationships were reconciled by the
  decision above. Reflect Page design for Character and Six months remains a
  separate reviewed change.
- Elapsed-day versus completed-chapter gates were reconciled by the setup
  chapter decision above. Chapter completion controls App access; existing
  chapter-offer timing remains separate. Fresh browser verification is pending.

No interaction or visual rule was changed by this documentation update. The
previous decision to keep Habit right-swipe-back remains in force.

## Older roadmap ideas

Oscar, chat as a particular interface, the 3D Room, courses, and Circle
membership experiences appeared in prior documents. They have not been
reconfirmed as requirements for the web MVP or the mobile release. Do not
silently restore them as release gates.
