# Circle OS local server

The phone app connects privately to this computer through Tailscale.

The server:

1. saves the profile and daily logs in the Obsidian vault;
2. returns to the phone immediately;
3. lets Qwen update the Profile Case in the background;
4. saves the finished draft and lets the phone find it later.

The Obsidian folder is:

`C:\Brain\10 Projects\The Circle\Circle OS`

It contains:

- `Profile.md`
- `Days\YYYY-MM-DD.md`
- `Rules\constitution.md`
- `Rules\profile-case.md`
- `State.json`

The rules are read again for every AI update, so they can be changed in
Obsidian. `State.json` is the recovery copy used by the app. It contains no
connection key.

On Windows:

1. Keep Ollama and Tailscale running.
2. Run `npm run ai:phone` once.
3. Enter the shown address in Circle OS.

The phone keeps a local copy when the computer is away and syncs later.
