@echo off
setlocal

set APPPOOL=WebDOA
set APPCMD=%windir%\system32\inetsrv\appcmd.exe

echo Recycling IIS App Pool "%APPPOOL%" on LOCAL SERVER ...

if not exist "%APPCMD%" (
  echo ERROR: appcmd.exe tidak ditemukan.
  echo Pastikan IIS Management Scripts and Tools terinstall.
  pause
  exit /b 1
)

"%APPCMD%" list apppool /name:"%APPPOOL%" >nul 2>&1
if errorlevel 1 (
  echo ERROR: App Pool "%APPPOOL%" tidak ditemukan.
  echo.
  echo Daftar App Pool:
  "%APPCMD%" list apppool
  pause
  exit /b 1
)

"%APPCMD%" recycle apppool /apppool.name:"%APPPOOL%"

if errorlevel 1 (
  echo.
  echo Gagal recycle App Pool "%APPPOOL%".
  pause
  exit /b 1
)

echo.
echo App Pool "%APPPOOL%" berhasil di-recycle.
pause
