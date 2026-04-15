/**
 * sarvamWorker.ts  —  Hindi-optimised local STT in a module Web Worker
 *
 * Runs entirely on the user's hardware. No API key. No server round-trip.
 *
 * MODEL
 * ─────
 * astronova001/whisper-tiny-hindi-ONNX
 * Whisper-tiny fine-tuned on Hindi speech, exported to ONNX.
 * ~40 MB download, cached by the browser after first load.
 *
 * COMPUTE BACKEND (auto-selected at runtime)
 * ──────────────────────────────────────────
 *   1. WebGPU  — GPU in-browser; fastest
 *   2. WASM    — CPU fallback; works on any device
 *
 * MESSAGES IN  (main → worker)
 * ────────────────────────────
 *   { type: 'load' }
 *   { type: 'transcribe', audio: Float32Array }
 *
 * MESSAGES OUT  (worker → main)
 * ─────────────────────────────
 *   { type: 'loading',  stage: string, progress: number }
 *   { type: 'ready' }
 *   { type: 'result',  text: string }
 *   { type: 'error',   message: string }
 */

import { pipeline, env } from '@huggingface/transformers';

// ── Model identifier ──────────────────────────────────────────────────────
const MODEL_ID = 'astronova001/whisper-tiny-hindi-ONNX';

// ── WASM config ───────────────────────────────────────────────────────────
// numThreads=1 avoids SharedArrayBuffer requirement in contexts where COOP/COEP
// headers are not set; still uses SIMD within the single thread.
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.proxy      = false; // we are already in a Worker
  env.backends.onnx.wasm.numThreads = 1;
}

// ── Pipeline singleton ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipe: any = null;

// ── Determine best available backend ─────────────────────────────────────
async function bestDevice(): Promise<'webgpu' | 'wasm'> {
  try {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      const adapter = await (navigator as unknown as { gpu: { requestAdapter(): Promise<unknown> } }).gpu.requestAdapter();
      if (adapter) return 'webgpu';
    }
  } catch { /* fall through */ }
  return 'wasm';
}

// ── Load pipeline ─────────────────────────────────────────────────────────
async function loadPipeline() {
  const device = await bestDevice();

  self.postMessage({ type: 'loading', stage: `Initialising on ${device.toUpperCase()}…`, progress: 0 });

  pipe = await pipeline(
    'automatic-speech-recognition',
    MODEL_ID,
    {
      device,
      // fp32 for tiny model — weights are already small (~40 MB), fp32 gives
      // best accuracy; quantising a tiny model hurts quality more than it helps.
      dtype: 'fp32',
      progress_callback: (p: { status: string; name?: string; progress?: number }) => {
        if (p.status === 'downloading' || p.status === 'loading') {
          self.postMessage({
            type:     'loading',
            stage:    p.name ? `Loading ${p.name}` : 'Loading weights…',
            progress: Math.round((p.progress ?? 0)),
          });
        }
      },
    },
  );

  self.postMessage({ type: 'ready' });
}

// ── Transcribe one audio chunk ────────────────────────────────────────────
async function transcribe(audio: Float32Array) {
  if (!pipe) {
    self.postMessage({ type: 'error', message: 'Model not loaded yet.' });
    return;
  }

  const result = await pipe(audio, {
    language:          'hindi',
    task:              'transcribe',
    return_timestamps: false,
  });

  const out  = Array.isArray(result) ? result[0] : result;
  const text = ((out?.text ?? '') as string).trim();
  self.postMessage({ type: 'result', text });
}

// ── Message router ────────────────────────────────────────────────────────
self.addEventListener('message', async (e: MessageEvent) => {
  const { type, audio } = e.data as {
    type:  'load' | 'transcribe';
    audio?: Float32Array;
  };

  try {
    if (type === 'load') {
      await loadPipeline();
    } else if (type === 'transcribe' && audio) {
      await transcribe(audio);
    }
  } catch (err) {
    self.postMessage({
      type:    'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
