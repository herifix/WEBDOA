@echo off
setlocal
set "SCRIPT_DIR=%~dp0scripts\deploy\"

:menu
cls
echo ========================================
echo            MENU DEPLOY WEB DOA
echo ========================================
echo.
echo Development
echo   1. Prepare Config Development
echo   2. Cek Config Development
echo   3. Publish Development
echo   4. Start API Development
echo.
echo Production / Live
echo   5. Prepare Config Production
echo   6. Cek Config Production
echo   7. Publish Production
echo   8. Start API Production
echo.
echo Lainnya
echo   9. Clean Folder Publish
echo   10. Buka README Publish Singkat
echo   11. Buka Deployment Config
echo   0. Keluar
echo.
set /p choice=Pilih nomor: 

if "%choice%"=="1" goto prepare_dev
if "%choice%"=="2" goto check_dev
if "%choice%"=="3" goto publish_dev
if "%choice%"=="4" goto start_dev
if "%choice%"=="5" goto prepare_prod
if "%choice%"=="6" goto check_prod
if "%choice%"=="7" goto publish_prod
if "%choice%"=="8" goto start_prod
if "%choice%"=="9" goto clean_publish
if "%choice%"=="10" goto open_readme
if "%choice%"=="11" goto open_deploy_doc
if "%choice%"=="0" goto end

echo.
echo Pilihan tidak dikenali.
pause
goto menu

:prepare_dev
call "%SCRIPT_DIR%prepare-development-config.bat"
pause
goto menu

:check_dev
call :checkDevelopmentConfig
pause
goto menu

:publish_dev
call "%SCRIPT_DIR%publish-development.bat"
pause
goto menu

:start_dev
call "%SCRIPT_DIR%start-api-development.bat"
pause
goto menu

:prepare_prod
call "%SCRIPT_DIR%prepare-production-config.bat"
pause
goto menu

:check_prod
call :checkProductionConfig
pause
goto menu

:publish_prod
call "%SCRIPT_DIR%publish-production.bat"
pause
goto menu

:start_prod
call "%SCRIPT_DIR%start-api-production.bat"
pause
goto menu

:clean_publish
call "%SCRIPT_DIR%clean-publish.bat"
pause
goto menu

:open_readme
start "" "%~dp0README_PUBLISH_SINGKAT.md"
goto menu

:open_deploy_doc
start "" "%~dp0DEPLOYMENT_CONFIG.md"
goto menu

:checkDevelopmentConfig
set "API_CONFIG=%~dp0API\appsettings.Development.json"
set "CLIENT_CONFIG=%~dp0client\.env.development"

echo.
echo ========================================
echo Cek Config Development
echo ========================================

if not exist "%API_CONFIG%" (
  echo File backend belum ada:
  echo %API_CONFIG%
  goto :eof
)

if not exist "%CLIENT_CONFIG%" (
  echo File frontend belum ada:
  echo %CLIENT_CONFIG%
  goto :eof
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
goto :eof

:checkProductionConfig
set "API_CONFIG=%~dp0API\appsettings.Production.json"
set "CLIENT_CONFIG=%~dp0client\.env.production"

echo.
echo ========================================
echo Cek Config Production
echo ========================================

if not exist "%API_CONFIG%" (
  echo File backend belum ada:
  echo %API_CONFIG%
  goto :eof
)

if not exist "%CLIENT_CONFIG%" (
  echo File frontend belum ada:
  echo %CLIENT_CONFIG%
  goto :eof
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
goto :eof

:end
exit /b 0
