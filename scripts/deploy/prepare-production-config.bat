@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI\"
set "API_SAMPLE=%ROOT%API\appsettings.Production.sample.json"
set "API_TARGET=%ROOT%API\appsettings.Production.json"
set "CLIENT_SAMPLE=%ROOT%client\.env.production.sample"
set "CLIENT_TARGET=%ROOT%client\.env.production"

echo ========================================
echo Prepare Production Config
echo ========================================

if not exist "%API_SAMPLE%" (
  echo File sample backend tidak ditemukan:
  echo %API_SAMPLE%
  exit /b 1
)

if not exist "%CLIENT_SAMPLE%" (
  echo File sample frontend tidak ditemukan:
  echo %CLIENT_SAMPLE%
  exit /b 1
)

if not exist "%API_TARGET%" (
  copy "%API_SAMPLE%" "%API_TARGET%" >nul
  echo Backend config dibuat dari sample.
) else (
  echo Backend config sudah ada, tidak ditimpa.
)

if not exist "%CLIENT_TARGET%" (
  copy "%CLIENT_SAMPLE%" "%CLIENT_TARGET%" >nul
  echo Frontend config dibuat dari sample.
) else (
  echo Frontend config sudah ada, tidak ditimpa.
)

echo.
echo Langkah berikutnya:
echo 1. Edit file production yang baru dibuat
echo 2. Jalankan publish-production.bat
echo 3. Pastikan placeholder YOUR_* sudah diganti semua
exit /b 0
