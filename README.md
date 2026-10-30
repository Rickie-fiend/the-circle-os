# The Circle OS

Circle OS helps a person connect the life they live with the life they want.
Athena's intended role is personal reflection, open questions, feedback, and
motivation grounded in that person's records and commitments.

This project's delivery goal is a web MVP for friends and family. The long-term
destination is an iOS/Android app with Supabase as its backend. Current priority:
fix, verify, and optimize existing features before adding new ones.

## Project documents

- [Product](docs/PRODUCT.md): destination, scope, and current inventory.
- [Roadmap](docs/ROADMAP.md): phases, dependencies, and completion criteria.
- [Decisions](docs/DECISION_LOG.md): confirmed choices and unresolved questions.
- [Architecture](docs/PRODUCTION_ARCHITECTURE.md): current and target systems.
- [Development workflow](docs/DEVELOPMENT_WORKFLOW.md): implementation and verification.
- [Current task](docs/CURRENT_TASK.md) and [handoff](docs/SESSION_HANDOFF.md).
- [Design](DESIGN.md) and [Page standard](app/os/APP_SESSION_STANDARD.md).

## Current product

- `/os` — Today: Note, Thoughts, Routine, Protocol, Log, Week, and chapter journeys.
- `/os/mirror` — Reflect: Vision declarations, Athena's Reading, and Quests.
- `/` — The Circle website.
- `/brand` — The Circle brand system.

Chapter authoring, profile synchronization, and prepared Athena content already
exist. Their presence does not certify every user path. Verified outcomes and
remaining gaps are in [the journey record](docs/USER_JOURNEY_TESTING.md).

## Current data behavior

The browser saves records in IndexedDB and a localStorage copy under
`circle-os-state-v2`, with migration support for older records. The current
file-based profile server can synchronize profile and day records into an
Obsidian vault using private profile keys. The app's default connection points
to that server; this is not a strictly device-only prototype.

Consequences:

- Supabase authentication and database storage have not been implemented;
- local records must remain safe while the server is unavailable;
- clearing browser data may require profile recovery;
- privacy, recovery, and cross-user access need explicit verification before
  treating the prototype as a private multi-user service.

See [Production architecture](docs/PRODUCTION_ARCHITECTURE.md) for the current
runtime and the requirements for durable accounts and sync.

## Local development

Requirements:

- Node.js `>=22.13.0`
- npm

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run lint
npm run build:vercel
```

- `npm test` verifies the existing Vinext/Cloudflare-compatible build and
  rendered routes.
- `npm run build:vercel` verifies the native Next.js production build used by
  Vercel.

## Deployment targets

- Sites/Vinext uses `npm run build`.
- Vercel uses `npm run build:vercel` through `vercel.json`.

## Admin editor access

The hidden Admin editor requires a private server-side password. To use the
editor locally, create an ignored `.env.local` file in the repository root and
add:

```text
CIRCLE_OS_ADMIN_CODE=replace-with-a-unique-random-password
```

Replace the example with a unique password of at least 16 characters. The app
will keep Admin locked if this setting is missing or shorter than 16
characters. Do not use a `NEXT_PUBLIC_` prefix, put the password in application
code, or commit the `.env.local` file.

For Vercel, add `CIRCLE_OS_ADMIN_CODE` as a server-side environment variable in
the project settings for the environments where you want Admin enabled, then
redeploy. The password is only used for the Admin editor; app users do not need
it. Lifestyle evidence may sync to the separate profile server described above.

## Roadmap

1. Stabilize the existing features and complete the missing journey checks.
2. Optimize measured problems and repeat tests and browser verification.
3. Add private Supabase accounts/storage after login and recovery are decided.
4. Deliver and evaluate the stabilized core with friends and family.
5. Add personalized Athena afterward through authorized server-side evidence access.
6. Continue to iOS/Android using the evidence from the web trial.

Streaks and/or a leaderboard are planned possibilities with undecided scoring
and release timing. The [roadmap](docs/ROADMAP.md) records their decision gates,
the confirmed core-first test, and the exit criteria for each phase.
