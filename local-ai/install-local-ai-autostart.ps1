$ErrorActionPreference = "Stop"

$startupScript = (Resolve-Path (Join-Path $PSScriptRoot "start-local-ai.ps1")).Path
$taskName = "CircleOSLocalAI"
$runPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$command = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startupScript`""
$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startupScript`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType S4U -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Seconds 0) `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -StartWhenAvailable
$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings

try {
  Register-ScheduledTask -TaskName $taskName -InputObject $task -Force | Out-Null
  $savedTask = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
  if ($savedTask.Triggers.CimClass.CimClassName -notcontains "MSFT_TaskBootTrigger") {
    throw "$taskName does not have a boot trigger."
  }

  if (Test-Path $runPath) {
    Remove-ItemProperty -Path $runPath -Name $taskName -ErrorAction SilentlyContinue
  }

  Write-Output "Scheduled task: $($savedTask.TaskName) ($($savedTask.State))"
  Write-Output "Principal: $userId (S4U)"
  Write-Output "Trigger: At startup"
  exit 0
} catch {
  Write-Warning "Boot task could not be installed; keeping the login fallback. $($_.Exception.Message)"
}

New-Item -Path $runPath -Force | Out-Null
Set-ItemProperty -Path $runPath -Name $taskName -Value $command

$saved = (Get-ItemProperty -Path $runPath -Name $taskName).CircleOSLocalAI
if ($saved -ne $command) {
  throw "$taskName did not persist in the current user's Run key."
}

Write-Output "Login fallback: $saved"
