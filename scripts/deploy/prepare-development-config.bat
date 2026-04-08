@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI\"
set "API_SAMPLE=%ROOT%API\appsettings.Development.sample.json"
set "API_TARGET=%ROOT%API\appsettings.Development.json"
set "CLIENT_SAMPLE=%ROOT%client\.env.development.sample"
set "CLIENT_TARGET=%ROOT%client\.env.development"

echo ========================================
echo Prepare Development Config
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
  echo Backend config development dibuat dari sample.
) else (
  echo Backend config development sudah ada, tidak ditimpa.
)

if not exist "%CLIENT_TARGET%" (
  copy "%CLIENT_SAMPLE%" "%CLIENT_TARGET%" >nul
  echo Frontend config development dibuat dari sample.
) else (
  echo Frontend config development sudah ada, tidak ditimpa.
)

echo.
echo Langkah berikutnya:
echo 1. Edit file development yang baru dibuat bila perlu
echo 2. Jalankan publish-development.bat
echo 3. Pastikan config development sudah sesuai komputer dev
exit /b 0
