# Current task

## Title

Validate the core mobile-web user journey

## Status

Ready. The admin access investigation and code fix are recorded in
`docs/SESSION_HANDOFF.md`. The fix has not been deployed.

## Purpose

Confirm that a new tester can set up Circle OS, record part of a day, reload the
web app without losing that entry, and reflect on the recorded life using a
phone-sized browser.

## Scope

- Use a separate test browser profile or another safe test context. Do not clear
  or overwrite the user's existing local app data.
- Complete first-use setup.
- Record at least one daily activity or moment.
- Reload the app and confirm the entry remains.
- Open Reflect and check that the displayed observations match the test data.
- Record exact steps, observed results, and any failures or uncertain behavior.

Relevant code to inspect if a step fails:

- `app/os/circle-os-shell.tsx`
- `app/os/circle-os-store.ts`
- `app/os/circle-os-model.js`
- `app/os/mirror/page.tsx` and its imported reflection components
- `tests/first-use-setup.test.mjs`
- `tests/circle-os-model.test.mjs`
- `tests/rendered-html.test.mjs`

Re-check paths and tests before starting; the repository may have changed.

## Out of scope

- Replacing the existing framework or redesigning the product.
- Database migrations, a new authentication provider, live AI, monetization,
  public social features, or native mobile apps.
- Deploying or changing production settings.
- Clearing real tester or owner data to create a clean test state.

## Acceptance criteria

- Setup completes on a phone-sized web viewport.
- A daily activity or moment can be recorded and is visible in the app.
- A full page reload preserves that entry.
- Reflect displays observations grounded in the recorded test data; any
  inference is distinguishable from directly recorded information.
- The test record separates verified outcomes from assumptions and lists
  unresolved issues.
- Existing local data is not deleted or overwritten.

## Verification

Use an available browser on a phone or phone-sized viewport. Follow the journey
above and record the browser/device and viewport used. Run focused existing
tests for any failure investigated, then build or lint in proportion to the
change. Do not install browser tooling or dependencies for this task without
asking.

## References and limits

The root `AGENTS.md` and repository-local `DESIGN.md` remain available
authorities. The Obsidian vault at `C:\Brain` remains unavailable from this
machine; do not infer its contents or claim its notes were updated.
