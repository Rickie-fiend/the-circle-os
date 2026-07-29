# The Circle OS

The Circle OS is a free lifestyle-designing app. It helps a person record how
they actually live, complete one meaningful identity mission, and see patterns
between daily life and the person they want to become.

## Current product

- `/os` — Today: energy, mood, mission, and an awake-day hourly timeline.
- `/os/mirror` — Vision: evidence coverage, time, energy, mood, identity, and
  cautious patterns.
- `/` — The Circle website.
- `/brand` — The Circle brand system.

The Phase 1 test deliberately excludes surveys, accounts, cloud sync, Oscar,
chat, AI, the 3D Room, community, and courses.

## Current data behavior

The app does not have a personal-data backend yet. Each browser stores its own
records in `localStorage` under `circle-os-state-v1`.

Consequences:

- no account is required;
- a phone and computer do not sync;
- different testers never see each other's data;
- clearing browser data can remove the records.

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

No production secrets are currently required because the online test is
device-local.

## Product phases

1. Online lifestyle-design test: Today, Mission, hourly reality, and Vision.
2. Foundation surveys, personal mission statement, identity and dream-life
   gaps, durable accounts, Oscar, chat, and optional local/API AI.
3. The living 3D Room and carefully separated Circle membership experiences.
