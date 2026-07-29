# Circle OS local AI

This helper reads the phone's request, asks Ollama for a Profile Case update,
returns the update, and forgets the request. It does not save user records.

Rules live in `rules/`. The response shape lives in `profile-schema.json`.

On Windows:

1. Install Ollama and the `qwen2.5:1.5b` model.
2. Install Tailscale on the computer and phone. Sign in to both.
3. Run `npm run ai:phone` once.
4. Enter the shown address and key in Circle OS.

The computer must be awake for AI updates. The phone app still logs normally
when it is away and updates Vision later.
