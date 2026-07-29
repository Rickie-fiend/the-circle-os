$ErrorActionPreference = "Stop"

$tokenPath = Join-Path $PSScriptRoot ".token"
if (-not (Test-Path -LiteralPath $tokenPath)) {
  $bytes = New-Object byte[] 32
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $generator.GetBytes($bytes)
  $generator.Dispose()
  $newToken = [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
  Set-Content -LiteralPath $tokenPath -Value $newToken -NoNewline
}

$env:CIRCLE_AI_TOKEN = (Get-Content -Raw -LiteralPath $tokenPath).Trim()
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "qwen2.5:1.5b"

Write-Host "Circle OS local AI is starting."
node (Join-Path $PSScriptRoot "server.mjs")
