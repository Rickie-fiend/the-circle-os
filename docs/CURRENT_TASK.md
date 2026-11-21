# Current task

## Imprint activity study — ready for review, 2026-11-17

Developer approved [the saved proposal](IMPRINT_ACTIVITY_PROPOSAL.md), including
the event map and edit/Trash rules. The isolated model/preview is implemented.
Review http://127.0.0.1:3024/?study=activity after starting
`node scripts/preview-personal-imprint.mjs`.

It demonstrates once-per-group/day growth, separate contribution ages, a
1.5-second pulse per accepted action, stable retry identities, source lifecycle,
two owners, mixed ages, exact fade cutoff and inactivity. Edits, failed saves
and unknown historical task origins add nothing. Interactive fine edges use the
existing phone-coordinate approximation; the Sori full-resolution reference
reproduces accepted monochrome geometry before coloring.

Verification: 18 focused activity/growth/fade/color/Orange checks pass; scoped
strict TypeScript and focused ESLint pass. Renderer baseline hash and four
export hashes/dimensions are checked; faded and quiet-month exports are identical.
Four-width browser verification covers the interaction/failure/reload paths,
reduced motion, six shapes at 390px and empty-canvas Bone equality.
Detailed evidence, source audit and limitations:
[Home brief](PERSONAL_IMPRINT_HOME.md#activity-model-study--2026-11-17).
[Prior task](archive/2026-11-17-imprint-activity/CURRENT_TASK_BEFORE.md).

Next: developer reviews the pulse, new versus old growth and removal/restoration.
Numeric growth/brightness and appearance remain visual review. Production Home
wiring, source adapters, original-time/origin gaps, persistent contribution
storage and phone renderer/cache require a separate reviewed slice.
No real records, production clock, shared Page geometry, sync, migration or
deployment changed. Full build/suite remain unrun; device/recovery gaps persist
and automatic writing sync stays off. Work is uncommitted on paing-branch
(HEAD 4a50c2f); pre-existing attachment/cache directories are preserved.
