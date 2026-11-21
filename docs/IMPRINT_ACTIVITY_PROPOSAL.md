# Personal Imprint activity model proposal

Saved: 2026-11-16, Asia/Bangkok. Developer approved implementation, including
the event map and edit/Trash rules, on 2026-11-17. Implemented as an isolated
synthetic study; production Home is not activated. Current implementation,
source audit, verification and limits are in
[the Home brief](PERSONAL_IMPRINT_HOME.md#activity-model-study--2026-11-17).

## Confirmed choices

- Each group grows once per used local Circle day, beginning at 06:00. Five
  Notes in one day count like one used day for Notes.
- Every qualifying action gets a brief brightening, even if the day already
  counts. Only newly added growth remains fresh after that animation.
- Deletion or Undo removes its contribution. If another qualifying source remains
  in that group/day, that day still counts.
- Protocol qualifies through a completed daily seal.
- Log qualifies once a saved block's end time has passed.
- Color affects abstract, asymmetric local bundle areas, feathered at every edge.
- Accumulated spread remains through inactivity. Color waits 24 elapsed hours
  after application, then fades once at the first local 06:00 at or after that
  time. There is no further dimming. Current display trial: fresh 1, faded .60,
  Orange shade exponent .35; final appearance remains visual review.

## Approved qualifying-event map

| Area | Proposed action |
| --- | --- |
| Starting/Chapters | Finish a Chapter |
| Notes | First accepted save of a nonempty Note |
| Deep Thoughts | Send an answer |
| Habits/Tasks | Complete a habit or task from Routine |
| Log/Week | A saved Log block ends, or a task is completed from Week |
| Protocol | Complete a daily seal |

Later writing edits are corrections, not another contribution or pulse.
Drafts, unchanged saves, retries, reopening and reload do not qualify. This means
editing an old saved entry is not a new used-day contribution under this proposal.
The developer approved these save/edit details with the event map.

## Approved implementation slice

1. Add a pure activity model under app/os/home. Each owner/group/day contribution
   has its own original application time and supporting source identities, without
   writing bodies. Additional actions that day pulse but do not add spread or
   restart fade clocks. Model new contributions separately instead of using the
   current group's latest application to refresh its whole area.
2. Add a calm 1.5-second pulse on that tool's existing colored area. Its older
   color returns to its prior level while new growth stays fresh. Rapid actions
   restart one smooth pulse. Reduced-motion mode shows the final state directly.
   Trigger only after a successful durable action; failures create no growth or
   pulse. Merely loading/reconciling records must not replay animation.
3. Demonstrate source removal/recovery. Deleting one of five Notes leaves the
   day's contribution; removing its last qualifying source removes it. Approved
   Trash behavior: temporarily remove the contribution; Restore returns its
   original size and age without presenting it as new activity. This is not yet
   a production change to writing lifecycle or retained metadata.
4. Extend the isolated preview with realistic synthetic actions, multiple uses
   per day, mixed contribution ages, Undo, deletion, Trash/Restore, failed saves,
   reload and exact cutoff scenarios. Keep current growth curve illustrative.
5. Audit source coverage read-only: identities, owner, times, attributed days,
   statuses and completion origin. Existing task records have completion times
   but no reliable historical Routine/Week completion-origin field was found.
   Missing history must remain unknown. Do not infer old origin or invent times.

## Verification and boundaries

Test distinct owners; once-per-group/day growth; pulse per accepted action;
duplicates/retries; independent fresh/faded contribution ages; cutoff; removal
with/without another source on that day; restoration; reduced motion; failed saves;
reload without pulse replay. Verify the browser journey and preserve the accepted
geometry, Bone renders, local-first data and immutable chapter/readings.

Expected files: new Home activity model/types, growth model, isolated preview,
focused model/browser checks and owning Home/record/decision/continuity documents.
The record contract must distinguish Trash, deletion, clearing, archive and Undo;
do not silently substitute one generic lifecycle rule. Application times must
remain stable through retries/reloads and reviewed source removals.

No real profile import or personal-record mutation, new persistent contribution
store, production Home wiring, phone renderer rollout, sync activation, migration
or deployment is included. Those remain subsequent reviewed scopes.
