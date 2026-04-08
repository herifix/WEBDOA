@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI\"
set "API_OUT=%ROOT%publish\development\api"
set "API_CONFIG=%ROOT%API\appsettings.Development.json"

if not exist "%API_OUT%\API.exe" (
  echo File "%API_OUT%\API.exe" tidak ditemukan.
  echo Jalankan dulu publish-development.bat
  exit /b 1
)

if not exist "%API_CONFIG%" (
  echo File config "%API_CONFIG%" tidak ditemukan.
  echo Jalankan dulu prepare-development-config.bat
  exit /b 1
)

for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "$cfg = Get-Content -LiteralPath '%API_CONFIG%' -Raw | ConvertFrom-Json; $value = $cfg.Runtime.AspNetCoreUrls; if ($null -ne $value) { [string]$value }"`) do set "ASPNETCORE_URLS=%%A"
if not defined ASPNETCORE_URLS set "ASPNETCORE_URLS=http://127.0.0.1:5000"

set "ASPNETCORE_ENVIRONMENT=Development"
echo Menjalankan API Development di %ASPNETCORE_URLS%
cd /d "%API_OUT%"
API.exe
