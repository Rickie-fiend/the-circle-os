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
4. stores source-linked Athena understanding in `Athena Memory.json` and a
   readable `Athena Memory.md` projection;
5. collects every person's product suggestions in one `Suggestions.md` file.

Raw Thoughts, logs, and day records remain unchanged. Immediate memory capture
is limited to clearly named facts such as a watched film or finished book.
Deeper interpretation belongs to Athena's 06:15 preparation and must keep its
source references.

The profile server stores and syncs evidence. It does not analyze a person.
Athena's current external scheduler owns the morning analysis, and the nightly
instructions live in Obsidian at:

`C:\Brain\10 Projects\The Circle\Circle OS\Nightly Profile Analysis.md`

Current analysis rules live in:

`C:\Brain\10 Projects\The Circle\Circle OS\Rules`

Chapter sources and the authoring guide live in:

`C:\Brain\10 Projects\The Circle\Circle OS\Chapters`

`GET /health` reports the server start time and the newest successful phone
sync. The analysis must name that timestamp and stop when evidence freshness
cannot be confirmed.

Install the current-user boot entry with:

`powershell.exe -NoProfile -ExecutionPolicy Bypass -File local-ai/install-local-ai-autostart.ps1`

The installer first attempts an S4U boot task and falls back to the current-user
Run key when Windows does not grant permission for a boot trigger. It starts the
server invisibly, records lifecycle events in
`%LOCALAPPDATA%\Circle OS\local-ai-startup.log`, records server output beside it
in `local-ai-server.log`, and exits without creating a duplicate when port 4317
is already healthy.
