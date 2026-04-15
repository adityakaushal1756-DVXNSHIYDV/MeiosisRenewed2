/**
 * VoiceWave.tsx
 *
 * Siri-style voice animation driven by real-time microphone frequency data.
 * Renders four overlapping sine waves on a <canvas>.  Each wave tracks a
 * different frequency band from the AnalyserNode; the combined result looks
 * like the fluid, multilayered Siri/Hey-Siri waveform.
 *
 * When analyserNode is null the waves still animate (idle pulse) so the
 * component can be shown before the mic is fully ready.
 */

import { useEffect, useRef } from 'react';

// ── Wave definitions ───────────────────────────────────────────
// Each wave samples a different frequency band and has its own
// phase speed, spatial frequency, color, and line weight.
const WAVE_DEFS = [
  // primary — neon green, prominent, mid-lows
  { color: 'rgba(82,255,157,0.90)', lineW: 2.5, speed: 1.6, spatialF: 1.1, bandFrac: 0.08 },
  // secondary — sky blue, thinner, high-mids
  { color: 'rgba(56,189,248,0.70)', lineW: 1.8, speed: 2.3, spatialF: 1.5, bandFrac: 0.22 },
  // tertiary — violet, slowest, lows
  { color: 'rgba(167,139,250,0.55)', lineW: 1.4, speed: 1.1, spatialF: 0.8, bandFrac: 0.38 },
  // accent — soft neon, fastest, highs
  { color: 'rgba(82,255,157,0.28)', lineW: 1.2, speed: 3.1, spatialF: 2.0, bandFrac: 0.55 },
] as const;

const MIN_AMP = 3;   // px — minimum amplitude so waves are always visible
const MAX_AMP = 20;  // px — amplitude at full-volume voice input

// ── Component ──────────────────────────────────────────────────
interface VoiceWaveProps {
  analyser: AnalyserNode | null;
  /** Height of the canvas in CSS px (default 48) */
  height?: number;
}

export function VoiceWave({ analyser, height = 48 }: VoiceWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // Randomised initial phases so different tabs look different
  const phases = useRef(WAVE_DEFS.map(() => Math.random() * Math.PI * 2));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Allocate frequency buffer once; reuse each frame
    const freqBuf: Uint8Array<ArrayBuffer> | null = analyser
      ? new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
      : null;

    let prevTs = 0;

    function draw(ts: number) {
      rafRef.current = requestAnimationFrame(draw);

      // Clamp dt so a tab waking from sleep doesn't give a huge jump
      const dt = Math.min((ts - prevTs) / 1000, 0.05);
      prevTs = ts;

      // Resize canvas to its CSS display size (handles window resizes)
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas!.offsetWidth;
      const cssH = height;
      if (canvas!.width !== Math.round(cssW * dpr)) {
        canvas!.width  = Math.round(cssW * dpr);
        canvas!.height = Math.round(cssH * dpr);
        ctx!.scale(dpr, dpr);
      }

      const W  = cssW;
      const H  = cssH;
      const cy = H / 2;

      ctx!.clearRect(0, 0, W, H);

      // Pull fresh frequency data
      if (analyser && freqBuf) analyser.getByteFrequencyData(freqBuf);

      WAVE_DEFS.forEach((def, i) => {
        // Advance phase this frame
        phases.current[i] += def.speed * dt;

        // Amplitude: driven by the frequency band, with a floor for idle beauty
        let amp: number;
        if (freqBuf && freqBuf.length > 0) {
          const idx     = Math.floor(def.bandFrac * freqBuf.length);
          const bandVal = freqBuf[idx] / 255; // 0 → 1
          amp = MIN_AMP + bandVal * (MAX_AMP - MIN_AMP);
        } else {
          // No analyser — gentle idle pulse
          amp = MIN_AMP + Math.abs(Math.sin(ts / 900 + i * 1.1)) * 3;
        }

        // Draw the sine wave as a path across the full width
        ctx!.beginPath();
        ctx!.moveTo(0, cy);

        const step = 3; // px between samples — smooth enough, fast enough
        for (let x = 0; x <= W; x += step) {
          const angle = (x / W) * Math.PI * 2 * def.spatialF + phases.current[i];
          const y     = cy + Math.sin(angle) * amp;
          ctx!.lineTo(x, y);
        }
        ctx!.lineTo(W, cy); // close back to centre at the right edge

        ctx!.strokeStyle = def.color;
        ctx!.lineWidth   = def.lineW;
        ctx!.lineJoin    = 'round';
        ctx!.lineCap     = 'round';
        ctx!.stroke();
      });
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, height]);

  return (
    <canvas
      ref={canvasRef}
      // Intrinsic size — actual pixels set by effect via devicePixelRatio
      width={800}
      height={height}
      style={{ display: 'block', width: '100%', height: `${height}px` }}
    />
  );
}
