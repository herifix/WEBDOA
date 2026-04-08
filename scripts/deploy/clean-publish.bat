@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI\"
set "DEV_OUT=%ROOT%publish\development"
set "PROD_OUT=%ROOT%publish\production"

echo ========================================
echo Clean Publish Output
echo ========================================

if exist "%DEV_OUT%" (
  rmdir /s /q "%DEV_OUT%"
  echo Folder development publish dihapus.
) else (
  echo Folder development publish tidak ada.
)

if exist "%PROD_OUT%" (
  rmdir /s /q "%PROD_OUT%"
  echo Folder production publish dihapus.
) else (
  echo Folder production publish tidak ada.
)

echo.
echo Selesai membersihkan folder publish.
exit /b 0
