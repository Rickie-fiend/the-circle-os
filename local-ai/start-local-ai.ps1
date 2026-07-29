$ErrorActionPreference = "Stop"

$env:CIRCLE_OS_VAULT_PATH = "C:\Brain\10 Projects\The Circle\Circle OS"
$env:CIRCLE_OS_ACCESS_PATH = "$env:LOCALAPPDATA\Circle OS\access.json"
$env:CIRCLE_OS_MAX_PROFILES = "25"
$tailscale = "C:\Program Files\Tailscale\tailscale.exe"
if (Test-Path -LiteralPath $tailscale) {
  $status = & $tailscale status --json | ConvertFrom-Json
  $userId = [string]$status.Self.UserID
  $user = $status.User.PSObject.Properties[$userId]
  if ($user) {
    $env:CIRCLE_AI_TAILSCALE_USER = $user.Value.LoginName
  }
}

Write-Host "Circle OS profile server is starting."
node (Join-Path $PSScriptRoot "server.mjs")
