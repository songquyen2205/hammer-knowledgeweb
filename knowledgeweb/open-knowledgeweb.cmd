@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%scripts\ensure-running.ps1"
if errorlevel 1 (
  echo Failed to ensure knowledgeweb runtime.
  exit /b 1
)
for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(Get-Content '%SCRIPT_DIR%.knowledgeweb-runtime.json' -Raw | ConvertFrom-Json).url"`) do set URL=%%A
if "%URL%"=="" (
  echo Runtime URL not found.
  exit /b 1
)
start "" "%URL%"
echo %URL%
exit /b 0
