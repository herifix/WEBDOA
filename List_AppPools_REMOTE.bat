@echo off
setlocal

set SERVER=gtc-server

echo Daftar IIS App Pool di server "%SERVER%" ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Invoke-Command -ComputerName '%SERVER%' -ScriptBlock { Import-Module WebAdministration; Get-ChildItem IIS:\AppPools | Select-Object -ExpandProperty Name }"

echo.
pause
