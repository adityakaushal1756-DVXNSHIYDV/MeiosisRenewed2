/**
 * whisper.worker.js
 *
 * Runs Xenova/whisper-tiny.en (OpenAI Whisper architecture) locally in this
 * browser tab via @huggingface/transformers.  Each browser tab gets its own
 * worker instance → recordings never mix across devices or tabs.
 *
 * Speed strategy:
 *   1. Try WebGPU first (3-5x faster than WASM on supported hardware).
 *   2. Fall back to WASM automatically.
 *   3. Model is cached in IndexedDB after the first download — instant load on reload.
 *   4. Accepts individual 30-second audio chunks (chunkId tagged) so chunks
 *      can be processed in parallel with ongoing recording.
 */

import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache   = true;

let asr    = null;
let device = 'wasm'; // updated after successful load

// ── Model loader (singleton, tries WebGPU → WASM) ────────────
async function loadModel() {
  if (asr) return asr;

  const candidates = ['webgpu', 'wasm'];

  for (const d of candidates) {
    try {
      self.postMessage({ type: 'status', message: `Loading Whisper (${d})…` });

      const instance = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        {
          device: d,
          progress_callback(p) {
            self.postMessage({ type: 'progress', ...p });
          },
        }
      );

      asr    = instance;
      device = d;
      self.postMessage({ type: 'ready', device });
      return asr;
    } catch (err) {
      self.postMessage({ type: 'status', message: `${d} unavailable, trying next…` });
      if (d === 'wasm') {
        // Exhausted all options
        self.postMessage({ type: 'error', error: `Model load failed: ${err.message}` });
        throw err;
      }
    }
  }
}

// Pre-warm on worker boot so the model is ready before the first recording
loadModel().catch(() => {/* already reported via postMessage */});

// ── Transcription handler ─────────────────────────────────────
self.addEventListener('message', async ({ data }) => {
  if (data.type !== 'transcribe') return;

  const { audio, chunkId } = data; // audio = Float32Array at 16 kHz mono

  try {
    const model = await loadModel();

    const output = await model(audio, {
      sampling_rate:  16000,
      chunk_length_s: 30,   // Whisper internal chunking window
      stride_length_s: 5,   // overlap for continuity across windows
      language: 'english',
      task:     'transcribe',
    });

    const text = Array.isArray(output)
      ? output.map((o) => o.text).join(' ').trim()
      : (output.text ?? '').trim();

    self.postMessage({ type: 'chunk_result', chunkId, text });
  } catch (err) {
    self.postMessage({ type: 'error', error: err.message ?? 'Transcription failed', chunkId });
  }
});
