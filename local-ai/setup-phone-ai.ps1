$ErrorActionPreference = "Stop"

$tailscale = "C:\Program Files\Tailscale\tailscale.exe"
if (-not (Test-Path -LiteralPath $tailscale)) {
  throw "Tailscale is not installed."
}

$status = & $tailscale status --json | ConvertFrom-Json
if ($status.BackendState -ne "Running") {
  throw "Sign in to Tailscale first."
}

$startScript = Join-Path $PSScriptRoot "start-local-ai.ps1"
$runCommand = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`""
$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
New-ItemProperty `
  -Path $runKey `
  -Name "CircleOSLocalAI" `
  -PropertyType String `
  -Value $runCommand `
  -Force | Out-Null

Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`"" `
  -WindowStyle Hidden
& $tailscale funnel --bg --yes http://127.0.0.1:4317 | Out-Null

$dnsName = $status.Self.DNSName.TrimEnd(".")

Write-Host ""
Write-Host "Circle OS is public at https://$dnsName"
Write-Host ""
