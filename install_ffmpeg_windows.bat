@echo off
setlocal

echo ========================================
echo FFmpeg Windows Installer via winget
echo ========================================
echo.

where winget >nul 2>nul
if errorlevel 1 (
    echo ERROR: winget tidak ditemukan.
    echo Install/update "App Installer" dari Microsoft Store, lalu jalankan ulang file ini.
    pause
    exit /b 1
)

echo Menginstall FFmpeg package Gyan.FFmpeg...
winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
    echo.
    echo ERROR: Instalasi FFmpeg gagal.
    echo Alternatif manual: download build Windows dari https://www.gyan.dev/ffmpeg/builds/
    pause
    exit /b 1
)

echo.
echo Refresh PATH untuk session ini...
for /f "tokens=2,*" %%A in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%B"
for /f "tokens=2,*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%B"
set "PATH=%SYS_PATH%;%USER_PATH%;%PATH%"

echo.
echo Cek versi FFmpeg:
ffmpeg -version
if errorlevel 1 (
    echo.
    echo FFmpeg terinstall, tapi belum terbaca di PATH session ini.
    echo Tutup Command Prompt/PowerShell, buka lagi, lalu jalankan: ffmpeg -version
) else (
    echo.
    echo FFmpeg berhasil diinstall dan bisa dipanggil dari PATH.
)

echo.
pause
