"""
Meiosis STT Sidecar  —  main.py
================================
Runs as a Windows system tray application.
- Orange icon  → model loading
- Green icon   → ready, accepting transcriptions
- Right-click  → Open Meiosis / Quit

FastAPI runs on a background thread.
The model loads on a second background thread.
pystray owns the main thread (Windows requirement).

Run directly:   python main.py
Build .exe:     build.bat   (uses PyInstaller, no Python needed after that)
"""

import io
import sys
import threading
import webbrowser

import torch
import uvicorn
import pystray
from PIL import Image, ImageDraw
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_SIZE   = "small"           # swap to "medium" for better Hindi accuracy
MEIOSIS_URL  = "http://localhost:5173"
PORT         = 8000
DEVICE       = "cuda" if torch.cuda.is_available() else "cpu"
COMPUTE_TYPE = "int8_float16" if DEVICE == "cuda" else "int8"

# ── Shared state ──────────────────────────────────────────────────────────────
_model:       WhisperModel | None = None
_model_ready: bool                = False

# ── Tray icon drawing ─────────────────────────────────────────────────────────
def _make_icon(color: tuple) -> Image.Image:
    """Draw a 64×64 circle icon with an 'M' letterform."""
    size = 64
    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d    = ImageDraw.Draw(img)
    # Filled circle
    d.ellipse([4, 4, size - 4, size - 4], fill=color)
    # Simple white 'M' shape using two lines
    m = [
        (16, 48), (16, 18),
        (32, 36),
        (48, 18), (48, 48),
    ]
    d.line(m, fill=(255, 255, 255, 230), width=5)
    return img

ICON_LOADING = _make_icon((210, 120, 20))   # amber
ICON_READY   = _make_icon((30, 200, 100))   # green
ICON_ERROR   = _make_icon((210, 50, 50))    # red

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Meiosis STT Sidecar")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "ok":     _model_ready,
        "device": DEVICE,
        "model":  MODEL_SIZE,
    }

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    if not _model_ready or _model is None:
        raise HTTPException(status_code=503, detail="Model still loading, please wait.")

    raw = await audio.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty audio file.")

    segments, info = _model.transcribe(
        io.BytesIO(raw),
        language="hi",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=400),
    )

    text = " ".join(seg.text.strip() for seg in segments).strip()
    return {"text": text}

# ── Background threads ────────────────────────────────────────────────────────
def _run_server():
    """Uvicorn lives here forever."""
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="error")

def _load_model(tray: pystray.Icon):
    """Load faster-whisper, then flip the tray icon to green."""
    global _model, _model_ready
    try:
        _model       = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
        _model_ready = True
        tray.icon    = ICON_READY
        tray.title   = f"Meiosis STT — Ready ({DEVICE.upper()})"
    except Exception as exc:
        tray.icon  = ICON_ERROR
        tray.title = f"Meiosis STT — Error: {exc}"

# ── Tray menu actions ─────────────────────────────────────────────────────────
def _open_meiosis(_icon, _item):
    webbrowser.open(MEIOSIS_URL)

def _quit(icon: pystray.Icon, _item):
    icon.stop()
    sys.exit(0)

# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    # Start the API server immediately (returns 503 until model is ready)
    threading.Thread(target=_run_server, daemon=True).start()

    # Build tray icon (amber = loading)
    tray = pystray.Icon(
        name  = "MeiosisSTT",
        icon  = ICON_LOADING,
        title = "Meiosis STT — Loading model…",
        menu  = pystray.Menu(
            pystray.MenuItem("Open Meiosis", _open_meiosis, default=True),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit", _quit),
        ),
    )

    # Load model in background; updates tray icon when done
    threading.Thread(target=_load_model, args=(tray,), daemon=True).start()

    # pystray must own the main thread on Windows
    tray.run()

if __name__ == "__main__":
    main()
