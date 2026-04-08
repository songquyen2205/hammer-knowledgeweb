$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$nodeCandidates = @('node', 'C:\Program Files\nodejs\node.exe')
$nodePath = $null
foreach ($candidate in $nodeCandidates) {
  try {
    $cmd = Get-Command $candidate -ErrorAction Stop
    $nodePath = $cmd.Source
    break
  } catch {
    # try next
  }
}

if (-not $nodePath) {
  Write-Error 'Node runtime not found. Cannot ensure knowledgeweb is running.'
  exit 1
}

$portFile = Join-Path $projectRoot '.knowledgeweb-port'
$slug = (Split-Path -Leaf (Split-Path -Parent $projectRoot)).ToLower() -replace '[^a-z0-9]+', '-'
$computedPort = 3100
foreach ($ch in $slug.ToCharArray()) {
  $computedPort = (($computedPort - 3100) * 33 + [int][char]$ch) % 900 + 3100
}

$port = $computedPort
if (Test-Path $portFile) {
  $raw = (Get-Content $portFile -Raw).Trim()
  if ($raw -match '^\d+$') {
    $port = [int]$raw
  }
}
if ($port -lt 1024 -or $port -gt 65535) {
  $port = $computedPort
  Set-Content -Path $portFile -Value "$port`n" -Encoding UTF8
}

function Test-Health($url) {
  try {
    $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    return $res.StatusCode -eq 200
  } catch {
    return $false
  }
}

$healthUrl = "http://localhost:$port/health"
if (Test-Health $healthUrl) {
  Write-Output "knowledgeweb already running on http://localhost:$port"
  exit 0
}

for ($attempt = 1; $attempt -le 3; $attempt++) {
  if ($attempt -gt 1) {
    # Repair cycle: reset sticky port and terminate stale node server.js processes.
    Set-Content -Path $portFile -Value "$computedPort`n" -Encoding UTF8
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
      Where-Object { $_.CommandLine -like '*server.js*' -and $_.CommandLine -like "*$projectRoot*" } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
  }

  Start-Process -FilePath $nodePath -ArgumentList 'server.js' -WorkingDirectory $projectRoot -WindowStyle Hidden
  Start-Sleep -Seconds 3

  $runtimeFile = Join-Path $projectRoot '.knowledgeweb-runtime.json'
  if (Test-Path $runtimeFile) {
    try {
      $runtime = Get-Content $runtimeFile -Raw | ConvertFrom-Json
      if ($runtime.url -and (Test-Health "$($runtime.url)/health")) {
        Write-Output "knowledgeweb started at $($runtime.url)"
        exit 0
      }
    } catch {
      # continue retry
    }
  }

  if (Test-Health $healthUrl) {
    Write-Output "knowledgeweb started on http://localhost:$port"
    exit 0
  }
}

Write-Error 'Failed to ensure knowledgeweb runtime after 3 repair attempts.'
exit 1
