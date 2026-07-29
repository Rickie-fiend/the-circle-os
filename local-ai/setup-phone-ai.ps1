$ErrorActionPreference = "Stop"

$tailscale = "C:\Program Files\Tailscale\tailscale.exe"
if (-not (Test-Path -LiteralPath $tailscale)) {
  throw "Tailscale is not installed."
}

$status = & $tailscale status --json | ConvertFrom-Json
if ($status.BackendState -ne "Running") {
  throw "Sign in to Tailscale first."
}

$tokenPath = Join-Path $PSScriptRoot ".token"
if (-not (Test-Path -LiteralPath $tokenPath)) {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $newToken = [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
  Set-Content -LiteralPath $tokenPath -Value $newToken -NoNewline
}

$startScript = Join-Path $PSScriptRoot "start-local-ai.ps1"
$taskAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`""
$taskTrigger = New-ScheduledTaskTrigger -AtLogOn
$taskSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask `
  -TaskName "Circle OS Local AI" `
  -Description "Runs the private Circle OS profile helper on this computer." `
  -Action $taskAction `
  -Trigger $taskTrigger `
  -Settings $taskSettings `
  -Force | Out-Null

Start-ScheduledTask -TaskName "Circle OS Local AI"
& $tailscale serve --bg --yes http://127.0.0.1:4317 | Out-Null

$dnsName = $status.Self.DNSName.TrimEnd(".")
$token = (Get-Content -Raw -LiteralPath $tokenPath).Trim()

Write-Host ""
Write-Host "Open Circle OS on your phone and tap 'Private - this device'."
Write-Host "Address: https://$dnsName"
Write-Host "Key: $token"
Write-Host ""
