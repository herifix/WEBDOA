@echo off
setlocal

set SERVER=gtc-server
set APPPOOL=WebDOA

echo Stopping IIS App Pool "%APPPOOL%" on server "%SERVER%" ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Invoke-Command -ComputerName '%SERVER%' -ScriptBlock { param($pool) Import-Module WebAdministration; if (Test-Path ('IIS:\AppPools\' + $pool)) { Stop-WebAppPool -Name $pool; Write-Host ('Stopped App Pool: ' + $pool) } else { Write-Host ('ERROR: App Pool not found: ' + $pool); Write-Host 'Daftar App Pool:'; Get-ChildItem IIS:\AppPools | Select-Object -ExpandProperty Name; exit 2 } } -ArgumentList '%APPPOOL%'"

if errorlevel 1 (
  echo.
  echo Gagal stop App Pool.
  echo Pastikan:
  echo 1. File ini dijalankan Run as Administrator.
  echo 2. User Windows punya akses admin ke server %SERVER%.
  echo 3. PowerShell Remoting / WinRM aktif di server.
  echo 4. Nama App Pool benar-benar "%APPPOOL%".
  pause
  exit /b 1
)

echo.
echo Selesai.
pause
