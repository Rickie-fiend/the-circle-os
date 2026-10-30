# Circle OS development workflow

The developer requires:

**code -> test -> fix bugs -> verify -> optimize -> test and verify again**

Existing features and system behavior must be fixed and optimized before new
features are added. The [roadmap](ROADMAP.md) identifies the current phase.

## Document responsibilities

| Document | Owns |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Standing approval, clarification, verification, product, safety, and invariant rules |
| This workflow | Shared session checklists, implementation cycle, and check selection |
| [Product](PRODUCT.md) | Purpose, intended experience, and current/target scope |
| [Roadmap](ROADMAP.md) | Phases, dependencies, and exit criteria |
| [Decision log](DECISION_LOG.md) | Confirmed decisions, open questions, and known conflicts |
| [Current task](CURRENT_TASK.md) | One active job, its status, scope, acceptance criteria, and next action |
| [Session handoff](SESSION_HANDOFF.md) | Short current snapshot: approved scope, state, relevant checks, gaps, and next action |
| [Bugs](../bugs.md) | Bug status and reproduction/fix evidence |
| [Journey record](USER_JOURNEY_TESTING.md) | Browser setup, tested paths, observed outcomes, and coverage gaps |
| [Architecture](PRODUCTION_ARCHITECTURE.md), [design](../DESIGN.md), and [Page standard](../app/os/APP_SESSION_STANDARD.md) | Task-specific system and interaction references; flag disagreements |
| Session prompts | Entry points to these checklists, not separate procedural authorities |
| Archives and older handoffs | Historical evidence; follow current authorities for active instructions |

Keep detailed results in their owning record and link to them from the current
task. A newer handoff does not silently override product decisions or grant
edit approval.

## Session start

1. Read `AGENTS.md`, this workflow, and `docs/CURRENT_TASK.md`.
2. Read the current snapshot in `docs/SESSION_HANDOFF.md`. Open archived
   handoffs only when relevant or linked; do not load the history by default.
3. Apply the task-specific reference table in `AGENTS.md`. Search first and
   read relevant sections, including applicable decisions and bug/verification
   evidence. Carry forward unresolved warnings from the current task and handoff.
   Broaden investigation when the task, dependencies, or uncertainty require it.
4. Run `git status --short`, `git branch --show-current`, and
   `git log --oneline -10`. Inspect changes relevant to the task and preserve them.
5. Give a short startup update: the task and intended outcome, relevant existing
   work or unresolved warnings, and the next action. Use the current task and
   handoff for the recorded phase; consult the roadmap when its reference trigger
   applies or those records conflict. Check agreement with applicable decisions.
6. Resolve missing context with focused questions. Explain the proposed file
   changes, purpose, intended result, and verification in simple terms; obtain
   manual review and explicit approval before editing. Existing approval covers
   its reviewed scope; ask again only for added scope.

## Before implementation

- State the user-visible outcome and acceptance criteria for the approved task.
- For a bug, reproduce it when possible. Record initial data, steps, viewport,
  actual result, and expected result. A non-reproduction remains unresolved.
- Establish the relevant baseline before changing or optimizing behavior.

## One implementation cycle

1. **Code:** make the smallest coherent change using shared engines and domain
   actions. Preserve existing records and immutable content.
2. **Test:** run focused behavioral checks that exercise the acceptance criteria.
   A source-string assertion is not proof that the user journey works.
3. **Fix:** investigate failures and correct the cause. Repeat focused tests.
4. **Verify:** reproduce the user path in an isolated browser where applicable,
   check reload/persistence, and inspect relevant errors. Record exact evidence.
5. **Optimize:** measure the verified implementation and address a named problem
   such as startup delay, repeated requests, rendering cost, or unsafe coupling.
   If there is no justified change, record that conclusion rather than churning
   code to complete a checklist.
6. **Test and verify again:** after any optimization, repeat the affected checks
   and journey. Earlier passing results do not verify later code.

Build or lint success complements user-level verification. It does not replace
it. Mark a bug fixed only after its expected behavior is verified; otherwise
record the limitation and next check.

Verify every code change, including small fixes and optimizations, against its
intended behavior. Write or update tests when needed to establish that behavior
or prevent a regression. If verification cannot be completed, report the gap
and leave the result explicitly unverified rather than declaring it complete.

## Choosing checks

- Model changes: focused behavioral tests, including correction/migration cases.
- App interaction: focused tests and browser reproduction; mobile first.
- Persistence/sync: reload, offline/retry, merge, clearing edits, and recovery.
- Geometry/type changes: measure Note, Thoughts, Habit, and Protocol at rest.
- Chapter changes: `npm run chapters:check`, preserving published versions.
- Risk-appropriate lint and build. `npm test` runs the Vinext build before the
  test suite; `npm run build:vercel` checks the separate Next.js build target.
- Database/auth changes, when reached: access tests for multiple users and
  unauthenticated requests, including privileged server paths.
- Documentation-only changes: review statements and references, check links and
  `git diff --check`; do not claim a new runtime verification.

Use the installed direct CLI when the shell cannot run npm, and record the
exact command. Separate baseline failures from new failures. Expand checks
when the change or a discovered risk requires them.

## Test data and privacy

- Use synthetic isolated profiles. Do not clear or repurpose the owner's data.
- Isolate backend effects as well as browser storage: configure a test server
  or intercept remote sync instead of creating test records on the shared
  profile server incidentally.
- Never print credentials, copy private writing into fixtures, or call an
  external AI provider with personal evidence as an incidental test.
- Record reproducible steps without passwords or sensitive screenshots.

## Session handoff

1. Check that continuity-document edits are within the approved scope; obtain
   approval before writing any that were outside it.
2. Inspect the final status/diff and run the checks relevant to the change.
   Preserve pre-existing work. Stage, commit, and deploy only when explicitly asked.
3. Update the current task's status and next action. Keep it focused on one job;
   retain a short result summary and links when moving to the next task.
4. Update bug/journey records when their outcomes changed. Record durable
   product, architecture, design, or memory decisions in the decision log and
   owning document, within approved scope. Do not change the roadmap silently.
5. Update the short dated snapshot in `docs/SESSION_HANDOFF.md` using the
   template below; aim for 300–600 words, with links to detailed evidence.
   Before replacing it, preserve unique completed-work evidence in an archive
   under `docs/archive/` or its owning record. Keep unresolved issues, verification
   gaps, and the next action in the active snapshot. Preserve existing archive
   entries and update links when moving evidence. Correct historical conclusions
   in current records rather than silently rewriting archived evidence.
6. Give a self-contained report. Do not claim completion while acceptance
   criteria remain unmet. Verification gaps stay explicit.

### Handoff entry template

Use this template for the current snapshot. Record detailed completed-work
history once in an owning record or archive, then link to it.

- **Date and task:** use the developer's timezone; name the job plainly.
- **Approval and Git context:** reviewed scope, branch, HEAD, and existing changes.
  Include a commit range only if commits were made; otherwise say no commit.
- **Completed and verified:** changed files/behavior, exact commands, results,
  and evidence. Identify baseline failures separately from later regressions.
- **Attempts, assumptions, and gaps:** failed attempts, inference, unrun checks
  with reasons, unresolved issues, and any needed developer verification.
- **Invariants:** which were touched and what was measured; say when none changed.
- **Durable records:** which owning documents were updated or remain pending.
  Never claim an external-note update that did not happen.
- **Next action:** one concrete starting point, its approval status, and blockers.
