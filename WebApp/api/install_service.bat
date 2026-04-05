@echo off
:: Install SEOC Backup API as a Windows Service
:: Run as Administrator

echo Installing SEOC Backup API as Windows Service...

:: Create a wrapper script for NSSM
set PYTHON="C:\Program Files\Python312\python.exe"
set SCRIPT="C:\inetpub\wwwroot\seoc\api\seoc_api.py"

:: Method: Use Windows Task Scheduler to auto-start on boot
schtasks /Create /TN "SEOC_Backup_API" /TR "%PYTHON% %SCRIPT%" /SC ONSTART /RU SYSTEM /F

:: Also start it now
schtasks /Run /TN "SEOC_Backup_API"

echo.
echo Done. SEOC Backup API will auto-start on system boot.
echo Task name: SEOC_Backup_API
echo.
pause
