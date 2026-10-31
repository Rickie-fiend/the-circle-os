# Session handoff

## 2026-10-31 - Account-separated storage foundation

**Approval and Git context.** The developer explicitly approved the proposed
storage foundation, direct caller updates, synthetic tests, and updates to
current task, handoff, and journey evidence. Scope excludes Supabase login,
project setup, real-data migration, and deployment. Branch `paing-branch`, HEAD
`5bc8ccb`. Preserved all 11 modified tracked paths and eight untracked entries
present at session start, including Day One work. A `.vscode/settings.json`
appeared during verification and was left untouched. Nothing staged, committed,
pushed, provisioned, or deployed.

**Completed and verified.** Added `account-scope.js` with its declaration file.
Main-state reads/writes, private publication caches, and pins now select explicit
account storage. Legacy stores retain their names and content; account mode
never falls back to them. Scope transitions remount the provider subtree so old
forms and route state do not carry over. Old callbacks cannot change the next
account. Scoped IndexedDB work resolves after commit and cancels on switching;
late legacy network responses are rejected. Account mode cannot contact the
legacy evidence server. Admin's direct storage calls use a captured scope.
There is no new account-switch UI or authentication bypass in the product.

Final checks: 91/91 focused tests and 11/11 isolated browser cases passed. The
browser harness imports the actual provider, stores, and client, using real
IndexedDB at 390x844 and 360x844 with synthetic records and blocked external
traffic. It covers A/B switching, same-account return, reload, signed-out access,
cross-tab logout, pending reads/saves, transaction abort, late startup/sync,
offline edits/empty saves, newest-copy fallback, and immutable publications.
Next and Vinext production builds, the Vercel TypeScript configuration, and
focused lint passed. Shell lint still has the baseline nine errors and one
warning. All nine production Day One cases passed. Exact commands and limits
are in the [journey evidence](USER_JOURNEY_TESTING.md#account-separated-storage---2026-10-31).
The documentation check passed all 25 local links/fragments; `git diff --check`
passed with existing LF/CRLF warnings.

**Attempts and gaps.** Broader production checks were not clean: the combined
legacy run passed 20/21, an isolated Reflect case failed, and a core-only rerun
passed 9/12. Failures involved a directly installed prepared-memory reference
and first Reflect swipes. A disposable baseline kept the pre-existing Day One
work while restoring the original provider and the seven otherwise unchanged
files from HEAD. The same 360px authored-reading swipe timeout occurred there,
without any scope imports. That baseline used a Next Webpack production build
after cross-drive dependency links blocked the initial build attempts. The
generated in-repository comparison was removed and both test servers stopped.
The swipe issue exists before this change; the reference failure and full
Reflect certification remain unresolved. No Reflect bug was marked fixed.

**Invariants and next action.** Local records remain with their original scope;
no acknowledgement, merge, clearing-evidence, chapter, reading, day-boundary,
budget, type, or geometry rule changed. No geometry measurements are claimed.
The browser marker routes storage; it is not authentication or encryption.
Auth must verify ownership before mounting account content. Physical phones,
other browsers, real sync, and earlier broad checks remain uncertified. No
extra optimization was justified. Next: review the bounded Supabase auth
proposal, retaining the separate Reflect verification gap. Migration ownership,
provisioning, and deployment require their own reviewed scopes. Earlier
snapshots remain historical evidence.

---

## 2026-10-31 - Remaining beta contract choices recorded

**Approval and Git context.** The developer answered the remaining launch
choices in a batch, clarified that admin read-only access is always available
and daily carry-over clears at the person's membership-cycle monthly reset,
and explicitly approved all seven proposed documentation updates. Scope covers
the launch plan, product, roadmap, architecture, decision log, current task,
and this handoff, including changed export/release gates. Branch `paing-branch`,
HEAD `5bc8ccb`. The 11 modified tracked paths and eight untracked paths present
at startup remain preserved. Nothing staged, committed, provisioned, migrated,
or deployed.

**Completed.** Recorded always-available read-only admin access to personal
writing; admin-only error logs may contain writing. Manual account/data deletion
on request is a separate admin power. Deleted data may remain in backups for
at most 30 days. No user download/export is offered in beta; operational
backup/restore remains a gate. Lost-email recovery is handled manually, with
ownership proof/procedure still to be designed. The developer explains data use
on the website or social pages and warns against sensitive input. They accept
processing Athena needs without added provider privacy restrictions at this
stage; actual provider terms/locations and published wording still need review.

Athena may use relevant evidence across the person's whole history, excluding
login/payment details. Requested follow-ups have no fixed count limit beyond
usage and may use all evidence available to Athena for that person. Readings
are short, direct, calm, and advisory; exact tone/language guidance comes later.
Daily limits reset in Myanmar time. Unused daily allowance carries within the
person's membership cycle and clears at its monthly reset; monthly allowance
does not carry. Failed requests consume no user allowance.

Login should last until logout; retained local records must remain isolated
from signed-out/other-account access. The person chooses between conflicting
device edits. The Circle day still starts at 06:00 and follows the person's
timezone. The developer monitors the beta; live chapter publishing stays after
beta. All statements describe approved direction, not implemented behavior.

**Verification and gaps.** Reviewed consistency across all seven documents,
including updated export, privacy, usage, and release requirements. A read-only
Node script checked 54 local links/fragments: passed. `git diff --check` passed
with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, provider calls, or deployment verification
are claimed. Earlier snapshots retain unique evidence and unresolved gaps.
Allowance amounts/counting, reset hour/monthly-cycle formula and renewal effects,
retry/no-change accounting, spending budget, prices, migration, devices/browsers,
beta duration/success criteria, supported languages/exact tone, correction
behavior, log retention/auditing, deletion turnaround/coverage, recovery proof
and procedures, feedback route, and rollback details remain open. Provider/model
selection remains deferred until integration. The monthly reset decision does
not invent a cycle formula for longer grants.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve account isolation/local-first evidence, immutable chapters/readings,
and the 06:00 boundary. Next: review remaining reset/allowance choices and a
bounded accounts/account-separated-storage implementation proposal. Exact file
scope, migration ownership, synthetic-user checks, and operational details need
review before implementation. Earlier snapshots are historical where their
proposals conflict with this approved batch.

---

## 2026-10-31 - Reading evidence boundary confirmed

**Approval and Git context.** The developer confirmed that Athena may use
relevant notes, reflections, goals, habits, and activity records for readings,
while keeping login and payment details out of the AI context. They explicitly
approved recording this in the launch plan, product, architecture, decision
log, current task, and handoff. Scope is documentation only. Branch
`paing-branch`, HEAD `5bc8ccb`. All 11 modified tracked paths and eight untracked
paths present at startup remain preserved. Nothing staged, committed,
provisioned, migrated, or deployed.

**Completed.** Recorded the allowed evidence categories and excluded login
and payment details in all six approved documents. Reading evidence belongs
to the requesting person and remains subject to relevance selection and
user scoping. The architecture's evidence-selection step now reflects these
confirmed boundaries rather than allowing identity/contact details whenever
deemed needed. Exact selection and exclusion checks still require implementation
review and verification. No provider was configured, no personal evidence was
sent to AI, and no evidence-selection code was changed by this pass.

Previously confirmed behavior remains: the person requests a reading directly,
without a separate AI opt-in prompt. It appears in Reflect when ready and
includes one optional reflection question. Saving an answer triggers no reply;
Athena replies only when asked. Accounts require verified email, with reset
links and a manual lost-email recovery option. Singapore is the database region,
pending setup and Myanmar/Thailand connection checks. Membership durations are
30, 90, 180, and 365 days; renewals preserve unused time, expiry is shown locally,
and received readings remain readable after paid expiry.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps;
their open allowed-evidence category statements are superseded here. The
processing explanation, provider processing/retention, operator access,
deletion and recovery details, exact evidence selection/exclusion, remaining
layout and controls, conversation depth, allowances, and beta devices and
duration remain open. Provider/model selection remains deferred until
integration. Accounts, safe sync, membership admin, and live personalized
Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - No separate AI opt-in prompt for readings

**Approval and Git context.** The developer confirmed that a person requests
an Athena reading directly without a separate AI opt-in prompt. They explicitly
approved recording the choice in the launch plan, product, architecture,
decision log, current task, and handoff. Scope is documentation only. Branch
`paing-branch`, HEAD `5bc8ccb`. All 11 modified tracked paths and eight untracked
paths present at startup remain preserved. Nothing staged, committed,
provisioned, migrated, or deployed.

**Completed.** Recorded the request interaction in the six approved documents.
How AI processing is explained to users remains open, along with allowed
evidence, provider processing, retention, and other privacy details. The
architecture distinguishes the absence of a separate opt-in prompt from the
authentication, membership, and usage checks that still apply to generation.
This decision settles a prompt in the user flow, not the wider processing
contract. It does not configure a provider or authorize incidental processing
of real evidence during implementation tests. No user interaction or account
operation has been built or exercised by this pass.

Previously confirmed behavior remains: new users verify email before account
use; recovery uses verified-email reset links with a manual alternative for
lost email access. Singapore is the database region, with Myanmar/Thailand
connection checks still required. Membership durations are 30, 90, 180, and
365 days. Renewals preserve unused paid time, expiry is displayed locally,
and received readings remain readable after paid expiry. Requested readings
appear in Reflect when ready and include one optional reflection question.
Saving answers triggers no reply; Athena replies only when asked.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps.
The processing explanation, permitted evidence, provider processing/retention,
operator access, deletion and recovery details, remaining layout and controls,
conversation depth, allowances, and beta devices and duration remain open.
Provider/model selection remains deferred until integration. Accounts, safe
sync, membership admin, and live personalized Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Singapore database region confirmed

**Approval and Git context.** The developer chose Singapore as the database
region and explicitly approved recording this in the launch plan, product,
architecture, decision log, current task, and handoff. Scope is documentation
only. Branch `paing-branch`, HEAD `5bc8ccb`. All 11 modified tracked paths and
eight untracked paths present at startup remain preserved. Nothing staged,
committed, provisioned, migrated, or deployed.

**Completed.** Recorded Singapore as the chosen database region in the six
approved documents and removed database-region selection from the current open
choices. Setup availability and actual connections from both Myanmar and
Thailand remain required checks before launch. The decision log distinguishes
the database choice from still-open AI processing locations, other transfers,
and privacy details. This decision does not establish that any infrastructure
exists or that regional connectivity has been tested. No new technical
availability or performance claim is made by this documentation pass.

Previously confirmed account rules remain: new users verify their email before
account use; password recovery uses a reset link to that verified email; manual
recovery is offered for lost email access, with ownership checks still open.
Membership durations remain 30, 90, 180, and 365 days. Renewals preserve unused
paid time, and expiry is displayed locally. Received readings stay readable
after paid expiry. Requested Athena readings appear in Reflect when ready and
include one optional reflection question. Saving answers triggers no reply;
Athena replies only when asked.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, connectivity testing, or deployment
verification are claimed. Earlier snapshots retain unique evidence and
unresolved runtime gaps; their proposed database-region statements are
superseded here. Manual recovery ownership checks, verification/delivery and
session/device recovery implementation, privacy/consent, retention, operator
access, AI/other processing locations, exact layout and controls, conversation
depth, allowances, and beta devices and duration remain open. Provider/model
selection remains deferred until integration. Accounts, safe sync, membership
admin, and live personalized Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Email verification required before account use

**Approval and Git context.** The developer confirmed that new users must
verify their email before using their account. They explicitly approved
recording the requirement in the launch plan, product, architecture, decision
log, current task, and handoff. Scope is documentation only. Branch
`paing-branch`, HEAD `5bc8ccb`. All 11 modified tracked paths and eight untracked
paths present at startup remain preserved. Nothing staged, committed,
provisioned, migrated, or deployed.

**Completed.** Recorded the verification requirement in all six documents and
updated the decision log's open login item to separate the confirmed gate from
its implementation details. Verification delivery, link handling, and
enforcement still require implementation review and testing. This decision
settles whether verification is required; it does not configure delivery,
implement an account gate, or certify authentication. Password recovery remains
a reset link to the verified email, with manual recovery offered for lost email
access. Ownership checks and that manual process remain open.

Previously confirmed membership and Athena behavior remain unchanged. Standard
access durations are 30, 90, 180, and 365 days. Renewals start at current expiry
while active, or grant time after expiry; access ends at the same time of day
after the selected duration, displayed locally. Received readings remain
readable after paid expiry. A person requests a reading, which appears in
Reflect when ready and includes one optional reflection question. Saving an
answer triggers no reply; Athena replies only when explicitly asked.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps.
Manual recovery ownership checks, verification and delivery implementation,
session/device recovery, privacy/consent, retention, operator access, region,
exact layout and controls, conversation depth, allowances, and beta devices
and duration remain open. Provider/model selection remains deferred until
integration. Accounts, safe sync, membership admin, and live personalized
Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Manual recovery availability confirmed

**Approval and Git context.** The developer confirmed that manual recovery
will be offered when a person loses access to the account's email. They
explicitly approved recording this in the launch plan, product, architecture,
decision log, current task, and handoff. Scope is documentation only. Branch
`paing-branch`, HEAD `5bc8ccb`. All 11 modified tracked paths and eight untracked
paths present at startup remain preserved. Nothing staged, committed,
provisioned, migrated, or deployed.

**Completed.** Recorded the availability of manual lost-email recovery in all
six documents. Verified-email reset links remain the normal forgotten-password
route. The manual alternative is confirmed, but how a person proves ownership
and the manual process still require review before implementation. This choice
does not approve any ownership-proof method or account-transfer procedure.
The decision log's open login item now distinguishes availability of manual
recovery from its unresolved details. No recovery flow, email configuration,
or account operation was implemented or exercised by this documentation pass.

Previously confirmed membership and Athena behavior remain unchanged. Standard
access durations are 30, 90, 180, and 365 days. Renewals start at current expiry
while active, or grant time after expiry; access ends at the same time of day
after the selected duration, displayed locally. Received readings remain
readable after paid expiry. The person requests a reading, which appears in
Reflect when ready and includes one optional reflection question. Saving an
answer triggers no reply; Athena replies only when explicitly asked.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps;
their open lost-email-recovery availability statements are superseded here.
Ownership checks and the manual process, verification and delivery setup,
session/device recovery, privacy/consent, retention, operator access, region,
exact layout and controls, conversation depth, allowances, and beta devices
and duration remain open. Provider/model selection remains deferred until
integration. Accounts, safe sync, membership admin, and live personalized
Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Verified-email password recovery confirmed

**Approval and Git context.** The developer confirmed password recovery through
a reset link sent to the account's verified email address. They explicitly
approved recording the rule in the launch plan, product, architecture, decision
log, current task, and handoff. Scope is documentation only. Branch
`paing-branch`, HEAD `5bc8ccb`. All 11 modified tracked paths and eight untracked
paths present at startup remain preserved. Nothing staged, committed,
provisioned, migrated, or deployed.

**Completed.** Recorded the forgotten-password route in all six documents and
updated the decision log's open login item to distinguish this confirmed route
from remaining recovery details. Lost-email recovery, email-verification and
delivery setup, reset-link handling, expired sessions, and lost-device behavior
still require review. The architecture continues to require supported managed
authentication. This decision records intended behavior; it does not configure
email delivery, implement recovery, or verify that reset links work.

Previously confirmed membership and Athena behavior remain unchanged. Standard
access durations are 30, 90, 180, and 365 days. Renewals start at current expiry
while active, or grant time after expiry; access ends at the same time of day
after the selected duration, displayed locally. Received readings stay readable
after paid expiry. The person requests a reading, which appears in Reflect when
ready and includes one optional reflection question. Saving an answer triggers
no reply; Athena replies only when explicitly asked.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps.
Privacy/consent, retention, operator access, remaining recovery details, region,
exact layout and controls, conversation depth, allowances, and beta devices and
duration remain open. Provider/model selection remains deferred until
integration. Accounts, safe sync, membership admin, and live personalized
Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Expiry time and local display confirmed

**Approval and Git context.** The developer confirmed that access expires at
the same time of day after the selected duration, with expiry displayed in the
person's local timezone. They explicitly approved recording the rule in the
launch plan, product, architecture, decision log, current task, and handoff.
Scope is documentation only. Branch `paing-branch`, HEAD `5bc8ccb`. All 11
modified tracked paths and eight untracked paths present at startup remain
preserved. Nothing staged, committed, provisioned, migrated, or deployed.

**Completed.** Recorded expiry timing and local display in all six documents.
Apply the selected duration from the agreed starting point: current expiry
while membership is active, or grant time after expiry. A new 30-day grant at
3 pm ends 30 days later at 3 pm. The standard durations remain 30, 90, 180,
and 365 days, with no calendar-month or month-end adjustments. Timestamp storage
and date-calculation details require review in the implementation proposal.
These are confirmed requirements, not claims that grant calculations or
membership enforcement have been implemented.

Previously confirmed access and Athena behavior remain unchanged: expiry
stops new generation while received readings, personal records, core tools,
and sync remain available. A person requests a reading, which appears in
Reflect when ready and includes one optional reflection question. Saving an
answer triggers no reply; Athena replies only when explicitly asked through
a separate request subject to the allowance.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps;
their open expiry-time and display-timezone statements are superseded here.
Exact layout and controls, conversation depth, allowances, privacy/consent,
retention, operator access, recovery, region, and beta devices and duration
remain open. Provider/model selection remains deferred until integration.
Accounts, safe sync, membership admin, and live personalized Athena remain
planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Four fixed access durations confirmed

**Approval and Git context.** The developer specified access durations of 30,
90, 180, and 365 days and explicitly approved recording them in the launch
plan, product, architecture, decision log, current task, and handoff. Scope is
documentation only. Branch `paing-branch`, HEAD `5bc8ccb`. All 11 modified tracked
paths and eight untracked paths present at startup remain preserved. Nothing
staged, committed, provisioned, migrated, or deployed.

**Completed.** Recorded the four fixed durations in all six approved documents,
including the launch plan's required admin grant options. Use explicit day
counts rather than calendar months or years. The 365-day option is not twelve
30-day periods, and month-end adjustments do not apply. This expands and
clarifies the earlier 30/90-day decision without rewriting its historical
record. The renewal starting point remains the current expiry while active,
or the grant time after expiry, preserving unused paid time. Exact expiry-time
and storage/display timezone rules remain open. These are requirements for
future implementation, not claims that membership grant calculations exist.

Previously confirmed access and Athena behavior remain unchanged: expiry stops
new generation while received readings, personal records, core tools, and sync
stay available. A person requests a reading, which appears in Reflect when
ready and includes one optional reflection question. Saving an answer triggers
no reply; Athena replies only when asked through a separate request.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps.
Exact layout and controls, conversation depth, allowances, privacy/consent,
retention, operator access, recovery, region, exact expiry-time and timezone
rules, and beta devices and duration remain open. Provider/model selection
remains deferred until integration. Accounts, safe sync, membership admin,
and live personalized Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Fixed 30-day membership months confirmed

**Approval and Git context.** The developer chose always 30 days rather than
calendar months and explicitly approved recording that each membership month
is 30 days, with one month granting 30 days and three months granting 90 days.
Approved scope is documentation only in the launch plan, product, architecture,
decision log, current task, and handoff. Branch `paing-branch`, HEAD `5bc8ccb`.
All 11 modified tracked paths and eight untracked paths present at startup
remain preserved. Nothing staged, committed, provisioned, migrated, or deployed.

**Completed.** Recorded the fixed durations in all six documents and removed
calendar-month arithmetic and month-end handling from the current open choices.
Calendar months and month-end adjustments do not apply. The renewal starting
point remains the current expiry while membership is active, or the grant
time after expiry, preserving unused paid time. Storage/display timezone rules
remain open before implementation. These are requirements for future membership
implementation, not claims that grant calculations or enforcement exist.

Previously confirmed access and Athena behavior remain unchanged: expiry
stops new generation while received readings, personal records, core tools,
and sync stay available. A person requests a reading, which appears in Reflect
when ready and includes one optional reflection question. Saving an answer
triggers no reply; Athena replies only when asked through a separate request.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps;
their open calendar-month and month-end questions are superseded here. Exact
layout and controls, conversation depth, allowances, privacy/consent, retention,
operator access, recovery, region, storage/display timezone rules, and beta
devices and duration remain open. Provider/model selection remains deferred
until integration. Accounts, safe sync, membership admin, and live personalized
Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Renewal starting point confirmed

**Approval and Git context.** The developer confirmed that renewals add time
from the current expiry while membership is active, or from the grant time
after expiry. They explicitly approved recording the rule in the launch plan,
product, architecture, decision log, current task, and handoff. Scope is
documentation only. Branch `paing-branch`, HEAD `5bc8ccb`. All 11 modified tracked
paths and eight untracked paths present at startup remain preserved. Nothing
staged, committed, provisioned, migrated, or deployed.

**Completed.** Recorded the renewal starting point in the six approved
documents. Renewing an active membership preserves unused paid time by adding
to its current expiry; renewing an expired membership starts from the grant
time. The launch plan now marks this starting point confirmed rather than
proposed. This is a requirement for future membership implementation, not a
claim that grants or renewal enforcement exist. Calendar-month arithmetic,
month-end handling, and storage/display timezone rules remain open and must be
settled before implementing date calculations.

Previously confirmed access and Athena behavior remain: expiry stops new
generation while received readings, personal records, core tools, and sync
remain available. The person requests a reading, which appears in Reflect when
ready and includes one optional reflection question. Saving an answer triggers
no reply; Athena replies only when asked through a separate request.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique evidence and unresolved runtime gaps;
their proposed renewal-starting-point statements are superseded here. Exact
layout and controls, conversation depth, allowances, privacy/consent, retention,
operator access, recovery, region, remaining date rules, and beta devices and
duration remain open. Provider/model selection remains deferred until
integration. Accounts, safe sync, membership admin, and live personalized
Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Received readings remain readable after expiry

**Approval and Git context.** The developer confirmed that received Athena
readings remain readable after paid access expires and explicitly approved
recording the rule in the launch plan, product, architecture, decision log,
current task, and handoff. Scope is documentation only. Branch `paing-branch`,
HEAD `5bc8ccb`. All 11 modified tracked paths and eight untracked paths present
at startup remain preserved. Nothing staged, committed, provisioned, migrated,
or deployed.

**Completed.** Recorded that paid expiry stops new Athena generation while
received readings remain readable. Personal records, core tools, and sync stay
available. The architecture separates entitlement checks for new generation
from access to existing immutable reading editions. The launch plan's paid
column now describes time-limited Athena generation access rather than broad
account access. This decision concerns post-expiry access; it does not define
deletion or backup-retention policy. It is a requirement for implementation,
not a claim that membership enforcement exists.

The previously confirmed Athena flow remains unchanged: the person requests
a reading, it appears in Reflect when ready, and it includes one optional
reflection question. Saving an answer triggers no reply. Athena replies only
when asked, through a separate request subject to the allowance.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain unique evidence and unresolved runtime gaps; their
statements that post-expiry reading access remains proposed are superseded.
Exact layout and controls, conversation depth, allowances, privacy/consent,
retention, operator access, recovery, region, membership dates, and beta devices
and duration remain open. Provider/model selection remains deferred until
integration. Accounts, safe sync, membership admin, and live personalized
Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices
before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Optional reflection question confirmed

**Approval and Git context.** The developer confirmed that each Athena reading
includes one optional reflection question and explicitly approved recording
that choice in the launch plan, product, architecture, decision log, current
task, and handoff. Scope is documentation only. Branch `paing-branch`, HEAD
`5bc8ccb`. All 11 modified tracked paths and eight untracked paths present at
startup remain preserved. Nothing staged, committed, provisioned, migrated,
or deployed.

**Completed.** Recorded one optional reflection question per reading in the
six approved documents. The person may leave it unanswered. Answering saves
a dated personal reflection without triggering an AI reply. Athena replies
only when asked, through a separate request. The rest of the confirmed flow
remains: a person requests a reading; the requested reading appears
automatically when ready in Reflect. Saving reflections stays free, and
requested replies remain subject to the Athena allowance. The architecture
keeps saving and requesting separate so the reply rule can change later
without rewriting records. These are future implementation requirements,
not claims that personalized Athena generation has been built.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
Earlier snapshots retain their unique verification evidence and runtime gaps.
This decision supersedes their statements that the optional reflection question
remains proposed. Exact Page layout, controls, conversation depth, allowances,
privacy/consent, retention, operator access, recovery, region, membership dates,
and beta devices/duration remain open. Provider/model selection remains deferred
until integration. Accounts, safe sync, membership admin, and live personalized
Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving the remaining launch
choices before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Reflect confirmed as the reading location

**Approval and Git context.** The developer confirmed that Athena readings
belong in Reflect and explicitly approved recording that location in the launch
plan, product, architecture, decision log, current task, and handoff. Scope is
documentation only. Branch `paing-branch`, HEAD `5bc8ccb`. The 11 modified tracked
paths and eight untracked paths present at startup remain preserved. Nothing
staged, committed, provisioned, migrated, or deployed.

**Completed.** Recorded Reflect as the confirmed home for Athena readings in
all six approved documents. The confirmed flow is now: the person requests a
reading; the requested reading appears automatically when ready in Reflect.
Saving a reflection, including an answer to a question, saves dated personal
evidence without triggering an AI reply. Athena replies only when asked.
Keeping the save and reply actions separate remains the implementation
direction so the reply rule can change later without rewriting records.
These are requirements for planned personalized Athena, not claims of built
behavior. The location decision does not choose a new Page layout or controls.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
The previous snapshots retain their unique evidence and unresolved runtime
gaps. This decision supersedes their statements that Reflect as the reading
location remains proposed. One optional reflection question, exact layout and
controls, conversation depth, usage limits, privacy/consent, retention, operator
access, recovery, region, membership dates, and beta devices/duration still need
review. Provider/model selection remains deferred until integration. Accounts,
safe sync, membership admin, and live personalized Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving the remaining launch
choices before reviewing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier snapshots follow as historical evidence.

---

## 2026-10-31 - Requested reading delivery confirmed

**Approval and Git context.** The developer confirmed that a person requests
a reading and that it appears automatically when ready. They explicitly
approved recording this flow in the launch plan, product, architecture,
decision log, current task, and handoff. Scope is documentation only. Branch
`paing-branch`, HEAD `5bc8ccb`; all 11 modified tracked paths and eight untracked
paths present at the start remain preserved. Nothing staged, committed, or
deployed.

**Completed.** Recorded the reading trigger and delivery behavior in all six
approved documents. A requested reading appears without a second request to
reveal it. Automatic appearance does not authorize preparation of unrequested
readings. The separate reply rule remains: saving a reflection or answering a
question saves personal evidence; Athena replies only when explicitly asked.
The architecture distinguishes authorization of the initiating request from
possible asynchronous completion. No queue, polling, notification, or delivery
mechanism has been selected or implemented. Existing prepared-content behavior
is not changed by this planned generation flow.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, remote configuration, or deployment verification are claimed.
The earlier entries retain their unique verification evidence and gaps. This
decision resolves the previously open initial reading trigger; Reflect as the
location, one optional question, exact controls, conversation depth, and usage
limits remain open. Privacy/consent, retention, operator access, recovery,
region, membership date rules, and beta devices/duration still need review.
Provider/model selection remains deferred until integration. Accounts, sync,
and live personalized Athena remain planned work.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue reviewing the remaining launch
choices before preparing a bounded accounts/account-separated-storage proposal.
Implementation, provisioning, real-data migration, and deployment require their
own reviewed scopes. Earlier reply-rule and launch-planning snapshots follow
as historical evidence; their open reading-trigger statements are superseded
by this clarification.

---

## 2026-10-31 - Athena reply rule confirmed

**Approval and Git context.** The developer confirmed that Athena replies only
when asked and that saving a reflection should remain separate from requesting
a reply, with the rule easy to change later. They explicitly approved a
documentation-only update to the launch plan, decision log, product,
architecture, current task, and this handoff. Branch `paing-branch`, HEAD
`5bc8ccb`. The 11 modified tracked paths and eight untracked paths present at
this pass's start remain preserved. Nothing staged, committed, or deployed.

**Completed.** Recorded the reply rule in the six approved documents. Saving
a reflection, including an answer to Athena's question, saves dated personal
evidence without triggering an AI reply. A reply requires a separate explicit
request and is subject to Athena's allowance; saving reflections stays free.
The architecture direction keeps the save and request actions separate, with
the reply rule in one place so later behavior changes can preserve records.
These are confirmed requirements for future implementation, not built behavior.
The decision log records the reason: the person chooses when Athena joins the
conversation, and AI use stays deliberate.

**Verification and limits.** Reviewed consistency across the six documents.
A read-only Node script checked 49 local links/fragments: passed.
`git diff --check` passed with existing LF/CRLF warnings. No runtime checks, builds, lint,
browser checks, provisioning, or migration are part of this pass. Earlier
runtime verification and gaps remain in the snapshots below. Initial reading
cadence, the proposed Reflect reading with one optional question, exact controls,
conversation depth, privacy/consent, retention, recovery, region, budgets,
membership date rules, and beta devices/duration still need review. Provider
and model selection remain deferred until integration. The reply decision
does not approve automatic replies or open-ended chat.

**Invariants and next action.** No runtime invariant or geometry changed.
Preserve local-first evidence, one profile per account, immutable readings and
chapters, and the 06:00 Circle day. Continue resolving launch-contract choices,
then review a bounded accounts/account-separated-storage implementation
proposal. Code, provisioning, real-data migration, and deployment remain outside
this approval. Earlier unique planning and verification evidence follows.

---

## 2026-10-31 - Invited web beta launch planning

**Approval and Git context.** The developer approved saving the launch plan
and aligning product, roadmap, decision log, architecture, current task, and
handoff. Scope is documentation only. Branch `paing-branch`, HEAD `5bc8ccb`;
no staging, commit, push, account provisioning, migration, or deployment.
The eight modified tracked paths and seven untracked paths present at startup
belong to the existing Day One/planning work and remain preserved. This task
adds one plan and changes the six approved records; prior unique evidence is
retained below rather than archived away.

**Completed.** Added [WEB_BETA_LAUNCH_PLAN.md](WEB_BETA_LAUNCH_PLAN.md) with
seven stages: launch contract, accounts, records/sync, membership admin, Athena,
readiness, and release. Updated owning records to supersede the previous
core-first/Athena-after route. The beta targets 10-20 invited people mainly in
Myanmar and Thailand using the web app with Home Screen installation. Login
uses email/password and a separate alias. Paid Athena access is granted
manually with automatic expiry and configurable usage/spending controls.

Further chapter simplification, broad optimization, compact Log, timers,
leaderboards, and native delivery are paused/deferred. Existing bugs stay
visible; data-safety and blocked launch journeys remain gates. Completed Day
One v3 and prior verification are preserved. Live admin chapter publishing is
proposed after beta rather than assumed implemented. The 4-6 week estimate is
provisional and depends on decisions, migration, and verification.

**Verification and limits.** Reviewed document consistency and preserved prior
evidence. A read-only Node script checked 54 local links/fragments in all seven
documents: passed. `git diff --check` passed with existing LF/CRLF warnings.
Python was unavailable, so the link check used Node instead. No runtime checks,
builds, lint, browser checks, remote
configuration inspection, or deployment verification are claimed. Source audit
found reusable local storage/sync and reading models, but no implemented
Supabase account system or live provider integration. Shared browser storage
requires account separation. Do not mistake the existing header-based ChatGPT
helper or profile keys for the target general user-login system.

**Open decisions and invariants.** No runtime invariant changed or geometry
measurement was required. Preserve local-first acknowledgement/clearing rules,
one profile per account, immutable chapter/reading history, and the 06:00 day.
Singapore, on-demand Reflect plus a follow-up, old-reading access after expiry,
and renewal date rules are proposals. Privacy/consent, operator access,
retention, recovery, exact budget, beta devices/duration, and Athena response
semantics need review. Provider/model choice is deferred to integration. The
developer has no Supabase project or AI API account yet. Earlier TypeScript,
lint, broad-suite, real-sync, physical-phone, and other-browser gaps remain.

**Next action.** Resolve the launch-contract choices, then prepare a bounded
accounts/account-separated-local-storage proposal with exact file scope and
synthetic isolation/recovery checks. Implementation, provisioning, real-data
migration, and deployment are not covered by this documentation approval.

---

## 2026-10-31 - Shorter Day One implemented

**Approval and Git context.** The developer approved Day One implementation,
its tests and continuity records, and separately approved the shared-player
summary change. They clarified that the sole user may see the new onboarding
after completing an older version. This supersedes the plan's earlier completed-
user exclusion proposal. Branch `paing-branch`, HEAD `5bc8ccb`; no staging,
commit, push, or deployment. Preserved the existing plan, continuity changes,
decision-log changes, and two planning archives. Prior snapshots remain below
so their unique evidence is not lost.

**Completed and verified.** Added the separate external `Day One v3.md` source
and compiled only `day-one@3`; all 35 prior bundled versions are unchanged and
the Quest registry is untouched. The five-page journey saves two main answers
and an optional action as dated evidence. It shows the supplied words at the
end and creates no identity or commitments. The existing protected completion
swipe remains. Older started runs retain their own version, pages, and answers.

Shared Day One handling now serves splash, Quest, direct publication, and
scheduled Thoughts delivery. Access earned from older completions remains;
Week Setup timing reads all completed Day One versions. After v3, Routine can
show its usable empty view without storing a false Habit setup completion.
Protocol reuses Start a phase; no new setup engine or geometry rule was added.

Final checks: 85/85 focused tests and 9/9 isolated mobile Chromium cases passed
at 390x844 and 360x844. Browser checks used the production Next server with
Bangkok time, synthetic profiles, blocked external requests, and actual offline
entry. Both production build targets passed. Chapter validation checked 33
sources (no external Quest sources). Focused lint outside the shell passed;
shell lint matches HEAD's nine errors and one warning. Exact commands, attempts,
and outcomes are in [the journey record](USER_JOURNEY_TESTING.md#shorter-day-one---2026-10-31).

**Gaps and invariants.** Standalone TypeScript still fails on the recorded
`cloudflare:workers` declaration in `db/index.ts`. Physical phones, other browsers,
real sync acknowledgements/retries, full lint and the broad suite remain
unverified. Local reload, queued offline evidence, clearing/stale merge,
immutable chapter content, legacy outcomes, and this gate's 06:00 boundary were
checked. No geometry/type/gap tokens or chapter delivery budgets changed; no new
geometry measurements are claimed. Phase 1 is not certified. The shared handler
addresses a concrete outcome inconsistency; no further performance optimization
was justified or attempted.

**Records and next action.** Updated the current task and journey evidence.
The plan and earlier decision entry remain historical where the developer's
completed-user correction differs; that correction is recorded here and in the
current task. No personal data or external product notes were edited. Next is
developer use and wording review of the new Day One before any further chapter
slice. Earlier unresolved warnings remain below.

---

## 2026-10-31 - Chapter simplification planning

The developer approved saving the plan into the repository. Added
[the plan](CHAPTER_SIMPLIFICATION_PLAN.md) and updated
[the current task](CURRENT_TASK.md). Scope is documentation only.
Branch `paing-branch`, HEAD `5bc8ccb`; initial Git status was clean.
No chapters, application, profile/day data, or product/design authorities
changed. Nothing staged, committed, or deployed.

The plan covers shorter onboarding, overlap reduction, optional depth,
unfinished items, a Log trial, implementation stages, dependencies, and
verification. These remain proposals, including cadence, draft reappearance,
gate changes, and compact sizing. Saving the plan does not approve code.

Prior evidence remains below and in archived copies of both records under
docs/archive with suffix 2026-10-31_before-chapter-plan.md. Archive links are
adjusted for their location. Prior gaps remain open; Phase 1 is not certified.
Documentation links, preservation, and whitespace are checked for delivery;
no runtime tests, chapter compilation, or build are claimed for this pass.

Next: developer review, then agree a concrete content/dependency audit and
draft scope before implementation. The first future code slice is shorter
onboarding after resolving Day One outcomes and Protocol/Week access gates.

---

## 2026-10-30 — Phase 1 verification

**Approval and Git context.** The developer approved isolated Habit-recovery
and Reflect checks, focused model checks, and updates to the journey, bug,
task, and handoff records. Application fixes require separate review.
Branch `paing-branch`; HEAD `7ffd3b2`. All 20 pre-existing modified tracked
paths and ten pre-existing untracked status entries remain preserved.
This session adds one browser test and updates the four approved evidence
documents. No application code changed; nothing was staged, committed,
pushed, or deployed.

**Completed and verified.** Added
[core-recovery.browser.mjs](../tests/core-recovery.browser.mjs).
The final command `node --test --test-reporter=tap tests/core-recovery.browser.mjs`
passed **12/12**, using isolated Chromium at 390x844 and 360x844.
An old Habit starter was repaired, a missing row was created, and a later
manual edit was preserved. Two further reloads kept one row and unchanged
chapter answers in each case.

At both widths, activity saved through Log survived reload. Arithmetic
over the saved day returned one walking hour. Empty Reflect stayed in its
learning state; fixture-based derived observations displayed without creating
an edition; authored fixture text retained one unchanged edition. No final
browser page errors occurred. Exact setup, commands, and distinctions are in
[the journey evidence](USER_JOURNEY_TESTING.md#phase-1--saved-habit-recovery-and-reflect-grounding--2026-10-30).

Focused command:
`node --test tests/habit-identity.test.mjs tests/first-use-setup.test.mjs tests/athena-memory.test.mjs tests/athena-alignment.test.mjs tests/athena-pricing.test.mjs`
passed **64/64**. Targeted ESLint for the new browser test passed.
Documentation audit passed: 14 links and four heading fragments across the
four records. Whitespace checks passed with existing LF/CRLF warnings.

**Attempts and gaps.** Initial fixed browser time caused a server/client
hydration mismatch. The server and browser now share Bangkok and the actual
clock. Early interrupted/timed-out attempts, a wrong Habit role selector,
a fixture-normalization mismatch, and swipes sent before transition commit
were corrected in the test setup. The final full run passed without an app fix.

Prepared memory is synthetic: this does not certify external Athena
preparation, freshness, evidence selection, or profile sync. Physical phones,
other browsers, geometry, and the 06:00 boundary remain unverified.
No full build, broad suite/lint, or TypeScript check ran. The recorded
`cloudflare:workers` resolution failure and earlier broad test/lint failures
remain historical gaps rather than fresh results.

**Invariants and durable records.** No product invariant changed. Checks
exercised local reload persistence, no duplicate Habit projection, later-edit
protection, unchanged chapter answers, and unchanged authored editions.
No geometry tokens changed or required new measurements. Updated
[bugs](../bugs.md), [journey evidence](USER_JOURNEY_TESTING.md), and
[current task](CURRENT_TASK.md); product/design/architecture authorities
remain unchanged. No external notes or personal records were accessed.

The preceding continuity refresh preserved the
[task](archive/CURRENT_TASK_2026-10-30_before-continuity-refresh.md) and
[handoff](archive/SESSION_HANDOFF_2026-10-30_before-continuity-refresh.md);
its preservation comparison, 32-link/14-fragment audit, and whitespace checks
passed. Those archives retain earlier admin and interaction-rule evidence.

**Next action.** Developer review of this evidence, followed by a bounded
proposal for the next unresolved Phase 1 bug/journey. Broader implementation
still needs approval. Character/Six-month Reflect Page design remains separate.
