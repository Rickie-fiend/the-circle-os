# Circle OS profile server

The public phone app sends each person's profile and daily evidence to this
computer. Every phone receives a private profile key.

The profile folder name is also the recovery code. On a fresh phone, paste a
code such as `p_1234567890abcdef` into the first Name field and press Begin.
The saved profile is restored and the new phone receives a fresh private key.
Keep the recovery code private: anyone who has it can restore that profile, and
recovery disconnects the old phone.

The server:

1. saves each person under the Obsidian `Circle OS\Profiles` folder;
2. keeps profile keys outside Obsidian;
3. returns the structured `Profile.md` to Vision;
4. collects every person's product suggestions in one `Suggestions.md` file.

Codex analyzes only profiles marked `analysis_pending: true`. The nightly
instructions live in Obsidian at:

`C:\Brain\10 Projects\The Circle\Circle OS\Nightly Profile Analysis.md`

Current analysis rules live in:

`C:\Brain\10 Projects\The Circle\Circle OS\Rules`

Chapter sources and the authoring guide live in:

`C:\Brain\10 Projects\The Circle\Circle OS\Chapters`

Keep the computer and Codex app running for the nightly analysis.
