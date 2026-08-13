$ErrorActionPreference = "Stop"

$env:CIRCLE_OS_VAULT_PATH = "C:\Brain\10 Projects\The Circle\Circle OS"
$env:CIRCLE_OS_ACCESS_PATH = "$env:LOCALAPPDATA\Circle OS\access.json"
$env:CIRCLE_OS_MAX_PROFILES = "25"

# Windows runs this at login, so it must not depend on anything that is still
# waking up. It used to read the Tailscale identity here, under
# ErrorActionPreference Stop, to set CIRCLE_AI_TAILSCALE_USER. Nothing in the
# server ever read that variable, and at login Tailscale is usually still
# starting, so the only thing this block could do was stop the server from
# running at all.
#
# The server needs the vault and nothing else. Tailscale carries its own funnel
# configuration across a restart and does not need to be asked about here.

Write-Host "Circle OS profile server is starting."
node (Join-Path $PSScriptRoot "server.mjs")
