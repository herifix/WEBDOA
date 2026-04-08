@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI\"
set "CLIENT_DIR=%ROOT%client"
set "API_DIR=%ROOT%API"
set "PUBLISH_ROOT=%ROOT%publish\production"
set "CLIENT_OUT=%PUBLISH_ROOT%\client"
set "API_OUT=%PUBLISH_ROOT%\api"
set "API_CONFIG=%ROOT%API\appsettings.Production.json"
set "CLIENT_CONFIG=%ROOT%client\.env.production"

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
  echo PERINGATAN: .env.production masih berisi placeholder YOUR_*
  echo Silakan edit dulu file berikut:
  echo %CLIENT_CONFIG%
  exit /b 1
)

findstr /B /C:"VITE_API_BASE_URL=" "%CLIENT_CONFIG%" | findstr /R /C:"^VITE_API_BASE_URL=$" >nul
if not errorlevel 1 (
  echo.
  echo PERINGATAN: VITE_API_BASE_URL di .env.production masih kosong
  echo Silakan edit dulu file berikut:
  echo %CLIENT_CONFIG%
  exit /b 1
)

if exist "%CLIENT_OUT%" rmdir /s /q "%CLIENT_OUT%"
if exist "%API_OUT%" rmdir /s /q "%API_OUT%"

echo.
echo [1/2] Build frontend (production)...
pushd "%CLIENT_DIR%"
call npm run build:production
if errorlevel 1 goto :error
popd

mkdir "%CLIENT_OUT%" >nul 2>&1
xcopy "%CLIENT_DIR%\dist\*" "%CLIENT_OUT%\" /E /I /Y >nul

echo.
echo [2/2] Publish backend (production)...
pushd "%API_DIR%"
call dotnet publish -c Release -o "%API_OUT%"
if errorlevel 1 goto :error
popd

echo.
echo Selesai.
echo Frontend: %CLIENT_OUT%
echo Backend : %API_OUT%
echo Jalankan API dengan: start-api-production.bat
exit /b 0

:error
echo.
echo Publish production gagal.
exit /b 1
