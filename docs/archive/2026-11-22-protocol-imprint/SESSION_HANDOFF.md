# Session handoff

## Protocol seals on Home Imprint — 2026-11-22, Asia/Bangkok

**Scope and Git.** The developer asked to continue with the next task and
review later. This slice connects the existing daily seal to the Protocol patch
in the signed-in Imprint review. The checkout is `main` at `b95e51b`. The earlier
Habit and Routine/Week task changes were already present and remain local, along
with the existing attachment and Supabase CLI cache directories. There was no
staging, commit or deployment.

**Implemented.** The seal stores its first-use timestamp and timezone with the
existing local record and carries an operation ID for save acknowledgement.
Home reuses the account-scoped Routine/Week projection and pulse queue. The
first seal supports one day's growth, and a second seal can support the same
day. Required-term Undo removes the source. Optional changes and archive keep
it. Re-sealing can pulse with the old age. A reload or a failed save plays no
pulse. Tracking begins with new seals, leaving older seals in Protocol history.
The local model, signed-in Home, actual Protocol action and tests are wired
together through the existing save path.

**Checks.** Bundled Node v24.22.3 ran 41 passing focused model tests, the Vercel
TypeScript project check, focused ESLint and `next build --webpack`. The final
compiled-CSS Chromium selection passed eight cases, including the 390px seal
journey and forced storage failure, plus regression and geometry coverage.
The earlier 360px and 416px matrix cases passed. At 360px and 390px the reference
tool frames measured 648px with 24px anchors and no nested scrolling.
[Journey evidence](../../USER_JOURNEY_TESTING.md#protocol-seals-on-home-imprint--2026-11-22)
records the reruns, existing ResizeObserver notices, and the known stale
Protocol Footer source assertion that failed before editing.

**Limits and next action.** The review uses synthetic accounts and local
persistence. Physical phones, production runtime and the full suite were not
exercised. No sync activation, migration or real-record changes occurred.
Review the Protocol journey in a local signed-in Imprint build using
[Current Task](../../PERSONAL_IMPRINT_HOME.md#local-daily-protocol-seals--2026-11-22). Confirm Log end-time and late-save attribution
before starting that separate source. The [Home brief](../../PERSONAL_IMPRINT_HOME.md#local-daily-protocol-seals--2026-11-22)
records the current behavior. The [archived study handoff](../2026-11-17-imprint-activity/SESSION_HANDOFF_AFTER.md)
retains the earlier artwork evidence and limits.
