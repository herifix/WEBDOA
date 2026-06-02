@echo off
setlocal
set "ROOT_DIR=%~dp0..\.."
set "API_CONFIG=%ROOT_DIR%\API\appsettings.Production.json"
set "CLIENT_CONFIG=%ROOT_DIR%\client\.env.production"
set "PWA_CONFIG=%ROOT_DIR%\doa_donatur_pwa\.env.production"

echo.
echo ========================================
echo Cek Config Production
echo ========================================

if not exist "%API_CONFIG%" (
  echo File backend belum ada:
  echo %API_CONFIG%
  exit /b 0
)

if not exist "%CLIENT_CONFIG%" (
  echo File frontend belum ada:
  echo %CLIENT_CONFIG%
  exit /b 0
)

if not exist "%PWA_CONFIG%" (
  echo File PWA belum ada:
  echo %PWA_CONFIG%
  exit /b 0
)

findstr /I /C:"YOUR_" "%API_CONFIG%" >nul
if not errorlevel 1 (
  echo Backend config: MASIH ADA PLACEHOLDER
  echo   %API_CONFIG%
) else (
  findstr /I /C:"\"DefaultConnection\": \"\"" "%API_CONFIG%" >nul
  if not errorlevel 1 (
    echo Backend config: DEFAULT CONNECTION MASIH KOSONG
    echo   %API_CONFIG%
  ) else (
    findstr /I /C:"\"AspNetCoreUrls\": \"\"" "%API_CONFIG%" >nul
    if not errorlevel 1 (
      echo Backend config: ASPNETCORE_URLS MASIH KOSONG
      echo   %API_CONFIG%
    ) else (
      echo Backend config: OK
      echo   %API_CONFIG%
    )
  )
)

findstr /I /C:"YOUR_" "%CLIENT_CONFIG%" >nul
if not errorlevel 1 (
  echo Frontend config: MASIH ADA PLACEHOLDER
  echo   %CLIENT_CONFIG%
) else (
  findstr /B /C:"VITE_API_BASE_URL=" "%CLIENT_CONFIG%" | findstr /R /C:"^VITE_API_BASE_URL=$" >nul
  if not errorlevel 1 (
    echo Frontend config: VITE_API_BASE_URL MASIH KOSONG
    echo   %CLIENT_CONFIG%
  ) else (
    echo Frontend config: OK
    echo   %CLIENT_CONFIG%
  )
)

findstr /I /C:"YOUR_" "%PWA_CONFIG%" >nul
if not errorlevel 1 (
  echo PWA config: MASIH ADA PLACEHOLDER
  echo   %PWA_CONFIG%
) else (
  findstr /B /C:"VITE_API_BASE_URL=" "%PWA_CONFIG%" | findstr /R /C:"^VITE_API_BASE_URL=$" >nul
  if not errorlevel 1 (
    echo PWA config: VITE_API_BASE_URL MASIH KOSONG
    echo   %PWA_CONFIG%
  ) else (
    findstr /B /L /C:"VITE_PWA_BASE=/pwa/" "%PWA_CONFIG%" >nul
    if errorlevel 1 (
      echo PWA config: VITE_PWA_BASE HARUS /pwa/
      echo   %PWA_CONFIG%
    ) else (
      echo PWA config: OK
      echo   %PWA_CONFIG%
    )
  )
)

exit /b 0
