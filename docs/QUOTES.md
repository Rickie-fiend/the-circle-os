# Managed quote library

Approved: 2026-11-03, Asia/Bangkok. Deep Thoughts opens a quote when its label
is tapped. Note retains its existing mixed Line pool. Neither reading action
requests Athena or submits writing.

## Managing quotes

Open the existing hidden Admin doorway through Deep Thoughts: enter `admin`
in a fresh answer and press Send, then enter the configured Admin password.
For an already answered question, choose Next question first. Open the Quotes
tab. Add quote text and an optional author. Remove quote requires confirmation.
The existing Admin styles and 44px controls are reused. The reserved entry is
not committed as a personal answer; the password uses its separate input.

The library starts empty. The developer owns the writing; this change adds no
authored quotes or automatic imports. Text and optional author each reuse the
existing Line text limit of 320 characters. Entries have stable database UUIDs;
the current controls add or remove them rather than silently edit existing text.

## Database and server setup

Apply [the migration](../supabase/migrations/202611030001_circle_quotes.sql)
once in the intended Supabase project. It creates only `public.circle_quotes`.
RLS and grants allow `anon` and `authenticated` SELECT. The server role can
SELECT, INSERT and DELETE; ordinary users have no mutation grant or policy.
This is public curated content, separate from personal evidence and its planned sync.

The server uses the existing `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Configure `SUPABASE_SECRET_KEY` only
in the ignored `.env.local` and the eventual server environment. Never prefix
the secret with `NEXT_PUBLIC_`, put it in Git, or send it to a browser or model.
Restart the server after changing environment files. These keys follow
[Supabase's server/public key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

`GET /os/quotes` reads the public catalog. `GET /os/admin/quotes` requires the
existing signed Admin cookie. Its POST and DELETE also require same-origin
JSON requests. The secret key is used only by server route modules. A missing
configuration or failed write is shown as a failure and preserves input.

The developer reported applying the SQL and configuring the ignored key.
Live verification confirmed public reading, server add/remove, and denied
anonymous add/delete. All temporary verification rows were removed. This
does not certify the wider personal-record database, authenticated A/B sessions,
hosted web routes or beta readiness. See [journey evidence](USER_JOURNEY_TESTING.md#deep-thoughts-and-managed-quotes-2026-11-03).

## Rotation and offline reading

Each deliberate label tap refreshes the catalog, then selects an unseen quote.
Once all have been seen it returns to the least recently seen. Seen IDs are
account-separated locally and retain the whole active pool, without the mixed
Line pool's 240-ID ceiling. Server pagination is followed until the catalog is read.

The last valid public catalog is cached on the device. A failed/offline request
can use that cache. A successful empty response clears the usable catalog;
removed quotes never return through a bundled fallback. An offline device may
still show a previously cached removal until its next successful refresh.

A quote stays until dismissed. Backward swipe returns to the same question and
answer. Forward swipe reveals optional reactions; another forward swipe or a
reaction returns. Quote visits never advance the question or commit its draft.
Quotes have no runs, cooldowns, completion or chapter versions.

## Verification commands

- `node --test tests/quotes.test.mjs`
- `node --test tests/writing.browser.mjs` (isolated components and synthetic data)
- `node scripts/check-quotes-live.mjs` (read-only configured catalog check)
- `node scripts/check-quotes-live.mjs --write` (temporary live access checks;
  cleanup runs in `finally`, and credentials are never printed)
- After a Next production build, `node scripts/check-quotes-live.mjs --app`
  serves the built quote routes on an ephemeral loopback port and verifies real
  signed-cookie add/read/remove plus unauthenticated/cross-origin denial against
  the configured database. It removes temporary rows and closes its server.

No deployment is part of this change.
