@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI\"
set "API_OUT=%ROOT%publish\production\api"
set "API_CONFIG=%ROOT%API\appsettings.Production.json"

if not exist "%API_OUT%\API.exe" if not exist "%API_OUT%\API.dll" (
  echo File "%API_OUT%\API.exe" atau "%API_OUT%\API.dll" tidak ditemukan.
  echo Jalankan dulu publish-production.bat
  exit /b 1
)

if not exist "%API_CONFIG%" (
  echo File config "%API_CONFIG%" tidak ditemukan.
  echo Jalankan dulu prepare-production-config.bat
  exit /b 1
)

for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "$cfg = Get-Content -LiteralPath '%API_CONFIG%' -Raw | ConvertFrom-Json; $value = $cfg.Runtime.AspNetCoreUrls; if ($null -ne $value) { [string]$value }"`) do set "ASPNETCORE_URLS=%%A"
if not defined ASPNETCORE_URLS set "ASPNETCORE_URLS=http://0.0.0.0:5000"

set "ASPNETCORE_ENVIRONMENT=Production"
echo Menjalankan API Production di %ASPNETCORE_URLS%
cd /d "%API_OUT%"
if exist "%API_OUT%\API.exe" (
  API.exe
) else (
  dotnet API.dll
)
