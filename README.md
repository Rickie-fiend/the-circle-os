# The Circle OS

Circle OS helps a person connect the life they live with the life they want.
Athena's intended role is personal reflection, open questions, feedback, and
motivation grounded in that person's records and commitments.

This project's delivery goal is a web MVP for friends and family. The long-term
destination is an iOS/Android app with Supabase as its backend. Current priority:
the invited web beta with accounts, safe sync, and requested paid Athena. Fix
data-safety failures and blocked journeys before dependent changes; broad
optimization and broader visual changes follow later.

## Project documents

- [Product](docs/PRODUCT.md): destination, scope, and current inventory.
- [Roadmap](docs/ROADMAP.md): phases, dependencies, and completion criteria.
- [Work plan](docs/WORK_PLAN.md): ordered work, UI priorities, fixes, and open choices.
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

The browser saves records in IndexedDB and a localStorage copy, with migration
support for older records. Supabase mode uses verified accounts and separate
local stores. Legacy mode uses `circle-os-state-v2` and can synchronize profile
and day records through the file-based profile server. Signed-in account mode
does not use that legacy transport. Development test mode uses isolated synthetic
accounts and is rejected in production.

Consequences:

- Supabase authentication/local isolation exist; lifestyle database sync does not;
- hosted sign-in/reset/logout/offline return have developer-reported success,
  while refresh/revocation, cross-device behavior, and wider device checks remain open;
- local records must remain safe while the server is unavailable;
- clearing unsynced browser data can lose records; login is not a cloud backup;
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

1. Review record/history interactions and contracts; reproduce critical defects.
2. Build and verify local writing and essential histories; polish sign-in early.
3. Implement safe Supabase evidence sync and separately reviewed migration/recovery.
4. Add optional confirmed Day One action setup after history and safe sync.
5. Implement membership controls and requested paid Athena with sourced corrections.
6. Verify real-phone, installation, privacy, recovery, and release journeys.
7. Release only with developer authorization, then use beta evidence for later work.

Streaks and/or a leaderboard are planned possibilities with undecided scoring
and release timing. The [roadmap](docs/ROADMAP.md) records their decision gates,
the invited beta route, and the exit criteria for each phase. The
[work plan](docs/WORK_PLAN.md) links the detailed plans without replacing them.
