@echo off
title Meiosis Launcher
echo.
echo  ==========================================
echo   MEIOSIS  —  Starting all services
echo  ==========================================
echo.

set ROOT=%~dp0

:: ── 1. STT Sidecar (tray app) ─────────────────────────────────────────────
:: Use compiled .exe if available, otherwise fall back to python
if exist "%ROOT%stt-sidecar\dist\MeiosisSTT.exe" (
  echo  [1/3] Starting STT Sidecar (exe)...
  start "" "%ROOT%stt-sidecar\dist\MeiosisSTT.exe"
) else (
  echo  [1/3] Starting STT Sidecar (python)...
  start "" /min cmd /c "cd /d "%ROOT%stt-sidecar" && python main.py"
)

:: Give the sidecar 2 seconds to bind the port before the frontend opens
timeout /t 2 /nobreak >nul

:: ── 2. Node backend ───────────────────────────────────────────────────────
echo  [2/3] Starting Node backend (port 5000)...
start "" /min cmd /c "cd /d "%ROOT%backend" && npm run dev"

:: ── 3. Vite frontend ──────────────────────────────────────────────────────
echo  [3/3] Starting Vite frontend (port 5173)...
start "" /min cmd /c "cd /d "%ROOT%doctor-frontend" && npm run dev"

:: ── 4. Open browser after services have started ───────────────────────────
echo.
echo  Waiting for services to start...
timeout /t 5 /nobreak >nul

echo  Opening Meiosis in browser...
start "" "http://localhost:5173"

echo.
echo  All services running. You can close this window.
echo  The STT icon lives in your system tray (bottom-right).
echo.
pause
