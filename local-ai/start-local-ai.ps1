$ErrorActionPreference = "Stop"

$env:CIRCLE_OS_VAULT_PATH = "C:\Brain\10 Projects\The Circle\Circle OS"
$env:CIRCLE_OS_ACCESS_PATH = "$env:LOCALAPPDATA\Circle OS\access.json"
$env:CIRCLE_OS_MAX_PROFILES = "25"

$runtimeDirectory = Join-Path $env:LOCALAPPDATA "Circle OS"
$serverLogPath = Join-Path $runtimeDirectory "local-ai-server.log"
$startupLogPath = Join-Path $runtimeDirectory "local-ai-startup.log"
$serverPath = Join-Path $PSScriptRoot "server.mjs"
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null

# Windows runs this at login, so it must not depend on anything that is still
# waking up. It used to read the Tailscale identity here, under
# ErrorActionPreference Stop, to set CIRCLE_AI_TAILSCALE_USER. Nothing in the
# server ever read that variable, and at login Tailscale is usually still
# starting, so the only thing this block could do was stop the server from
# running at all.
#
# The server needs the vault and nothing else. Tailscale carries its own funnel
# configuration across a restart and does not need to be asked about here.

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:4317/health" -TimeoutSec 2
  if ($health.ok) {
    Add-Content -Encoding utf8 -LiteralPath $startupLogPath -Value "$(Get-Date -Format o) already running"
    exit 0
  }
} catch {
  # Nothing is listening yet. This is the normal boot path.
}

$node = Get-Command node.exe -ErrorAction Stop
Add-Content -Encoding utf8 -LiteralPath $startupLogPath -Value "$(Get-Date -Format o) starting $serverPath"
& $node.Source $serverPath 2>&1 | ForEach-Object {
  Add-Content -Encoding utf8 -LiteralPath $serverLogPath -Value $_
}
$exitCode = $LASTEXITCODE
Add-Content -Encoding utf8 -LiteralPath $startupLogPath -Value "$(Get-Date -Format o) stopped with exit code $exitCode"
exit $exitCode
