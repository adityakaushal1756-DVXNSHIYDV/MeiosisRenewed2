@echo off
title Build Meiosis STT Sidecar
echo.
echo  Building MeiosisSTT.exe with PyInstaller...
echo  This may take a few minutes on first run.
echo.

pip install pyinstaller >nul 2>&1

pyinstaller ^
  --onefile ^
  --windowed ^
  --name MeiosisSTT ^
  --hidden-import=faster_whisper ^
  --hidden-import=pystray._win32 ^
  --hidden-import=uvicorn.logging ^
  --hidden-import=uvicorn.loops ^
  --hidden-import=uvicorn.loops.auto ^
  --hidden-import=uvicorn.protocols ^
  --hidden-import=uvicorn.protocols.http ^
  --hidden-import=uvicorn.protocols.http.auto ^
  --hidden-import=uvicorn.lifespan ^
  --hidden-import=uvicorn.lifespan.on ^
  main.py

echo.
if exist dist\MeiosisSTT.exe (
  echo  [OK] Built successfully: stt-sidecar\dist\MeiosisSTT.exe
  echo  Copy MeiosisSTT.exe to any Windows machine and run it.
) else (
  echo  [ERROR] Build failed. Check output above.
)
echo.
pause
