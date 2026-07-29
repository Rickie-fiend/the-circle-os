# The Circle OS production architecture

## What exists now

```text
Phone or desktop browser
        |
        v
React / Next.js interface
        |
        +-- Today
        +-- Mission
        +-- Hourly activities and moments
        +-- Vision calculations
        |
        v
Browser localStorage
circle-os-state-v1
```

Vercel or Sites serves the application files. It does not currently receive or
store a user's lifestyle records.

## What “backend” means for this app

A production backend becomes necessary when the app needs:

- an account;
- phone-to-computer synchronization;
- durable survey and journal records;
- recovery after clearing browser data;
- shared access across a user's devices;
- server-side pattern generation;
- optional Oscar or AI conversations.

## Recommended Phase 2 structure

```text
Browser
  |
  +-- local cache for fast daily use
  |
  v
Next.js server routes
  |
  +-- authentication and authorization
  +-- validation
  +-- pattern service
  +-- AI provider boundary, optional
  |
  v
PostgreSQL
  |
  +-- profile and survey answers
  +-- desired identities and personal mission statement
  +-- daily check-ins
  +-- missions and feedback
  +-- hourly activities and moments
  +-- derived patterns with evidence references
```

Recommended first service: Supabase for PostgreSQL, authentication, and
row-level access control. The application should still access it through a
small server-side repository layer so it can be replaced later.

## Minimum production requirements

### Source and delivery

- GitHub repository.
- Vercel project connected to the main branch.
- Preview deployments for changes.
- Production domain, preferably `os.theonecircle.club`.

### Accounts and data

- Optional email magic-link account.
- PostgreSQL database.
- Row-level security so users can only access their own records.
- Versioned migrations.
- Local-storage-to-account migration.
- Export and permanent deletion.
- Backups and a retention policy.

### Privacy and safety

- A plain-language privacy policy before collecting surveys or free-text
  reflections in the cloud.
- Explicit consent for sensitive profile information.
- No private keys in browser code or GitHub.
- Server-side rate limits and input validation.
- Explainable patterns linked to the evidence that created them.
- No silent sharing with community or courses.

### AI later

- Oscar and the core app must work without AI.
- API keys live only in Vercel environment variables.
- An API provider is the simplest option for a public Vercel app.
- Sai's local PC model requires a secure authenticated gateway; Vercel cannot
  safely call a private home computer directly.
- Every AI conclusion must be editable, dismissible, and grounded in the
  user's own records.

## Phase 1 launch boundary

The current public test can launch without accounts or a database. It is an
actual working application, but records remain on each tester's device. The
backend should be added only after the daily interaction and Vision experience
are worth preserving.

