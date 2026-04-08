$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $projectRoot 'scripts\ensure-running.ps1'
$taskName = 'KnowledgeWeb-Hammer-EnsureRunning'
$pwsh = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"

if (-not (Test-Path $scriptPath)) {
  Write-Error "Missing script: $scriptPath"
  exit 1
}

$action = New-ScheduledTaskAction -Execute $pwsh -Argument "-ExecutionPolicy Bypass -File \"$scriptPath\""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable

try {
  try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
  } catch {
    # ignore
  }

  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null
  Write-Output "Installed autostart task: $taskName"
  exit 0
} catch {
  $startupDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
  $startupCmd = Join-Path $startupDir 'knowledgeweb-ensure-running.cmd'
  $cmdContent = @"
@echo off
"$pwsh" -ExecutionPolicy Bypass -File "$scriptPath"
"@
  Set-Content -Path $startupCmd -Value $cmdContent -Encoding ASCII
  Write-Output "ScheduledTask denied. Installed Startup fallback: $startupCmd"
  exit 0
}
