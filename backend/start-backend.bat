@echo off
setlocal
cd /d "%~dp0"

:restart
echo Starting MEIOSIS backend on https://meiosisfrontendtest1.onrender.com/
node src/server.js
echo.
echo Backend stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto restart
