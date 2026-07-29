# Circle OS profile server

The public phone app sends each person's profile and daily evidence to this
computer. Every phone receives a private profile key.

The server:

1. saves each person under the Obsidian `Circle OS\Profiles` folder;
2. keeps profile keys outside Obsidian;
3. never runs Qwen or another model;
4. returns the structured `Profile.md` to Vision;
5. collects every person's product suggestions in one `Suggestions.md` file.

Codex analyzes only profiles marked `analysis_pending: true`. The nightly
instructions live in Obsidian at:

`C:\Brain\10 Projects\The Circle\Circle OS\Nightly Profile Analysis.md`

Keep the computer and Codex app running for the nightly analysis.
