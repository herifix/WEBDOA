@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI\"
set "CLIENT_DIR=%ROOT%client"
set "PWA_DIR=%ROOT%doa_donatur_pwa"
set "API_DIR=%ROOT%API"
set "PUBLISH_ROOT=%ROOT%publish\production"
set "CLIENT_OUT=%PUBLISH_ROOT%\client"
set "PWA_OUT=%PUBLISH_ROOT%\PWA"
set "API_OUT=%PUBLISH_ROOT%\api"
set "API_CONFIG=%ROOT%API\appsettings.Production.json"
set "CLIENT_CONFIG=%ROOT%client\.env.production"
set "PWA_CONFIG=%ROOT%doa_donatur_pwa\.env.production"

echo ========================================
echo Publish Production
echo ========================================

if not exist "%API_CONFIG%" (
  echo File config backend production tidak ditemukan:
  echo %API_CONFIG%
  echo Jalankan dulu prepare-production-config.bat
  exit /b 1
)

if not exist "%CLIENT_CONFIG%" (
  echo File config frontend production tidak ditemukan:
  echo %CLIENT_CONFIG%
  echo Jalankan dulu prepare-production-config.bat
  exit /b 1
)

if not exist "%PWA_CONFIG%" (
  echo File config PWA production tidak ditemukan:
  echo %PWA_CONFIG%
  echo Jalankan dulu prepare-production-config.bat
  exit /b 1
)

findstr /I /C:"YOUR_" "%API_CONFIG%" >nul
if not errorlevel 1 (
  echo.
  echo PERINGATAN: appsettings.Production.json masih berisi placeholder YOUR_*
  echo Silakan edit dulu file berikut:
  echo %API_CONFIG%
  exit /b 1
)

findstr /I /C:"\"DefaultConnection\": \"\"" "%API_CONFIG%" >nul
if not errorlevel 1 (
  echo.
  echo PERINGATAN: DefaultConnection di appsettings.Production.json masih kosong
  echo Silakan edit dulu file berikut:
  echo %API_CONFIG%
  exit /b 1
)

findstr /I /C:"\"AspNetCoreUrls\": \"\"" "%API_CONFIG%" >nul
if not errorlevel 1 (
  echo.
  echo PERINGATAN: Runtime:AspNetCoreUrls di appsettings.Production.json masih kosong
  echo Silakan edit dulu file berikut:
  echo %API_CONFIG%
  exit /b 1
)

findstr /I /C:"YOUR_" "%CLIENT_CONFIG%" >nul
if not errorlevel 1 (
  echo.
  echo PERINGATAN: .env.production frontend masih berisi placeholder YOUR_*
  echo Silakan edit dulu file berikut:
  echo %CLIENT_CONFIG%
  exit /b 1
)

findstr /B /C:"VITE_API_BASE_URL=" "%CLIENT_CONFIG%" | findstr /R /C:"^VITE_API_BASE_URL=$" >nul
if not errorlevel 1 (
  echo.
  echo PERINGATAN: VITE_API_BASE_URL di frontend .env.production masih kosong
  echo Silakan edit dulu file berikut:
  echo %CLIENT_CONFIG%
  exit /b 1
)

findstr /I /C:"YOUR_" "%PWA_CONFIG%" >nul
if not errorlevel 1 (
  echo.
  echo PERINGATAN: .env.production PWA masih berisi placeholder YOUR_*
  echo Silakan edit dulu file berikut:
  echo %PWA_CONFIG%
  exit /b 1
)

findstr /B /C:"VITE_API_BASE_URL=" "%PWA_CONFIG%" | findstr /R /C:"^VITE_API_BASE_URL=$" >nul
if not errorlevel 1 (
  echo.
  echo PERINGATAN: VITE_API_BASE_URL di PWA .env.production masih kosong
  echo Silakan edit dulu file berikut:
  echo %PWA_CONFIG%
  exit /b 1
)

findstr /B /L /C:"VITE_PWA_BASE=/pwa/" "%PWA_CONFIG%" >nul
if errorlevel 1 (
  echo.
  echo PERINGATAN: VITE_PWA_BASE di PWA .env.production harus /pwa/
  echo Silakan edit dulu file berikut:
  echo %PWA_CONFIG%
  exit /b 1
)

if exist "%CLIENT_OUT%" rmdir /s /q "%CLIENT_OUT%"
if exist "%PWA_OUT%" rmdir /s /q "%PWA_OUT%"
if exist "%API_OUT%" (
  echo.
  echo [0/3] Stop API production lama jika masih berjalan...
  set "TARGET_API_OUT=%API_OUT%"
  powershell -NoProfile -Command ^
    "$target = [System.IO.Path]::GetFullPath($env:TARGET_API_OUT);" ^
    "$exe = Join-Path $target 'API.exe';" ^
    "$dll = Join-Path $target 'API.dll';" ^
    "$procs = Get-CimInstance Win32_Process | Where-Object { " ^
    "  ($_.ExecutablePath -and [System.IO.Path]::GetFullPath($_.ExecutablePath) -eq $exe) -or " ^
    "  ($_.CommandLine -and $_.CommandLine -like ('*' + $dll.Replace('\','\\') + '*'))" ^
    "};" ^
    "foreach ($proc in $procs) { Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host ('Stop process API lama PID ' + $proc.ProcessId) }"
  timeout /t 2 /nobreak >nul
  rmdir /s /q "%API_OUT%"
)

echo.
echo [1/3] Build frontend UI (production)...
pushd "%CLIENT_DIR%"
call npm run build:production
if errorlevel 1 (
  popd
  goto :error
)
popd

mkdir "%CLIENT_OUT%" >nul 2>&1
xcopy "%CLIENT_DIR%\dist\*" "%CLIENT_OUT%\" /E /I /Y >nul

echo.
echo [2/3] Build PWA (production)...
pushd "%PWA_DIR%"
call npm run build:production
if errorlevel 1 (
  popd
  goto :error
)
popd

mkdir "%PWA_OUT%" >nul 2>&1
xcopy "%PWA_DIR%\dist\*" "%PWA_OUT%\" /E /I /Y >nul

echo.
echo [3/3] Publish backend (production)...
pushd "%API_DIR%"
call dotnet publish -c Release -o "%API_OUT%"
if errorlevel 1 (
  popd
  goto :error
)
popd

echo.
echo Selesai.
echo Frontend: %CLIENT_OUT%
echo PWA     : %PWA_OUT%
echo Backend : %API_OUT%
echo Jalankan API dengan: start-api-production.bat
echo URL PWA publish: /pwa/
exit /b 0

:error
echo.
echo Publish production gagal.
exit /b 1
