@echo off
title Install Meiosis STT on Startup
echo.
echo  This will make MeiosisSTT start automatically when Windows starts.
echo.

set ROOT=%~dp0

:: Prefer the compiled exe, fall back to a python launcher shortcut
if exist "%ROOT%dist\MeiosisSTT.exe" (
  set TARGET="%ROOT%dist\MeiosisSTT.exe"
) else (
  set TARGET="%ROOT%start-sidecar.bat"
  :: Create a silent launcher bat if it doesn't exist
  echo @echo off > "%ROOT%start-sidecar.bat"
  echo cd /d "%ROOT%" >> "%ROOT%start-sidecar.bat"
  echo start "" /min pythonw main.py >> "%ROOT%start-sidecar.bat"
)

:: Add to HKCU run key (no admin needed)
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" ^
  /v "MeiosisSTT" ^
  /t REG_SZ ^
  /d %TARGET% ^
  /f >nul

if %errorlevel%==0 (
  echo  [OK] MeiosisSTT will now start automatically with Windows.
  echo       It will appear as an icon in your system tray (bottom-right).
) else (
  echo  [ERROR] Could not write to registry. Try running as Administrator.
)
echo.

:: Also add a shortcut to the Startup folder as a fallback
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo  Adding shortcut to Startup folder as well...

powershell -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $s = $ws.CreateShortcut('%STARTUP%\MeiosisSTT.lnk'); ^
   $s.TargetPath = %TARGET%; ^
   $s.WorkingDirectory = '%ROOT%'; ^
   $s.Description = 'Meiosis STT Sidecar'; ^
   $s.Save()"

echo  [OK] Shortcut added to: %STARTUP%
echo.

:: Offer to remove from startup
echo  To REMOVE from startup, run:
echo    reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v MeiosisSTT /f
echo.
pause
