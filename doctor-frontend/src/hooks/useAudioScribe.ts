/**
 * useAudioScribe.ts
 *
 * Real-time AI Scribe using the browser's built-in Web Speech API —
 * zero model download, no memory crash, words appear as the doctor speaks.
 *
 *   LIVE TRANSCRIPTION (Web Speech API)
 *   ─────────────────────────────────────
 *   SpeechRecognition runs continuously (continuous=true, interimResults=true).
 *   Final segments accumulate in finalTranscriptRef; interim results update the
 *   live display every 200 ms so the doctor sees text forming in real-time.
 *   If the browser auto-stops recognition (common after ~60 s of silence),
 *   the onend handler restarts it automatically.
 *
 *   EXTRACTION (Gemini via backend)
 *   ──────────────────────────────────
 *   On stopRecording(), the accumulated final transcript is POSTed to
 *   /api/extract (Gemini 1.5 Flash) which returns { symptoms, diagnosis, advice }.
 *   Fields are filled automatically and remain fully editable; doctor saves manually.
 *
 *   VISUALISATION
 *   ─────────────
 *   A separate AudioContext + AnalyserNode is connected to the mic stream
 *   (NOT to the destination) for the Siri-style VoiceWave canvas animation.
 *
 * Browser support: Chrome, Edge, Safari (webkitSpeechRecognition).
 * Firefox does not support SpeechRecognition — an error message is shown.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../lib/api';
import type { EMRState } from '../types/EMR';

const API = API_BASE_URL;

// ── Types ──────────────────────────────────────────────────
export type ScribeStatus =
  | 'idle'
  | 'recording'
  | 'extracting'
  | 'done'
  | 'error';

export interface UseAudioScribeOptions {
  patientId?:     string;
  appointmentId?: string;
  onFieldChange:  (field: keyof EMRState, value: string) => void;
}

export interface UseAudioScribeReturn {
  status:         ScribeStatus;
  error:          string | null;
  transcript:     string;              // live-accumulating transcript shown to doctor
  lines:          string[];            // each finalized phrase as a separate line
  interimText:    string;              // currently-forming (interim) speech
  modelReady:     boolean;             // always true — no model to load
  workerDevice:   string;              // always '' — no worker
  analyserNode:   AnalyserNode | null; // live audio analyser for VoiceWave
  startRecording: () => Promise<void>;
  stopRecording:  () => void;
  reset:          () => void;
}

// ── Hook ──────────────────────────────────────────────────
export function useAudioScribe({
  patientId,
  appointmentId,
  onFieldChange,
}: UseAudioScribeOptions): UseAudioScribeReturn {

  const [status,       setStatus]      = useState<ScribeStatus>('idle');
  const [error,        setError]       = useState<string | null>(null);
  const [transcript,   setTranscript]  = useState<string>('');
  const [lines,        setLines]       = useState<string[]>([]);
  const [interimText,  setInterimText] = useState<string>('');
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Keep prop refs fresh for async callbacks
  const patientIdRef     = useRef(patientId);
  const appointmentIdRef = useRef(appointmentId);
  const onFieldChangeRef = useRef(onFieldChange);
  useEffect(() => { patientIdRef.current     = patientId;     }, [patientId]);
  useEffect(() => { appointmentIdRef.current = appointmentId; }, [appointmentId]);
  useEffect(() => { onFieldChangeRef.current = onFieldChange; }, [onFieldChange]);

  // ── Persistent refs ───────────────────────────────────────
  // SpeechRecognition instance (null when not recording)
  const recognitionRef      = useRef<SpeechRecognition | null>(null);
  // Accumulated confirmed (final) transcript text
  const finalTranscriptRef  = useRef<string>('');
  // AudioContext for visualiser
  const vizCtxRef           = useRef<AudioContext | null>(null);
  // MediaStream (for releasing mic indicator on stop)
  const streamRef           = useRef<MediaStream | null>(null);
  // Set to true when we intentionally call stop() — prevents onend auto-restart
  const stoppingRef         = useRef(false);

  // ── Gemini extraction ─────────────────────────────────────
  const callExtract = useCallback(async (fullText: string) => {
    setStatus('extracting');
    try {
      const res = await fetch(`${API}/extract`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript:    fullText,
          patientId:     patientIdRef.current,
          appointmentId: appointmentIdRef.current,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();

      const fc = onFieldChangeRef.current;
      if (data.symptoms)  fc('symptoms',  data.symptoms);
      if (data.diagnosis) fc('diagnosis', data.diagnosis);
      if (data.advice)    fc('advice',    data.advice);

      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
      setStatus('error');
    }
  }, []);

  const callExtractRef = useRef(callExtract);
  useEffect(() => { callExtractRef.current = callExtract; }, [callExtract]);

  // ── Start recording ───────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    setLines([]);
    setInterimText('');
    finalTranscriptRef.current = '';
    stoppingRef.current        = false;

    // Check browser support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?? (window as any).webkitSpeechRecognition as (new () => SpeechRecognition) | undefined;

    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      setStatus('error');
      return;
    }

    // Acquire mic stream (needed for AnalyserNode visualiser)
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      setError('Microphone access denied. Allow mic permissions and try again.');
      setStatus('error');
      return;
    }
    streamRef.current = stream;

    // ── Visualiser: AnalyserNode on mic stream (NOT connected to destination) ──
    try {
      const vizCtx  = new AudioContext();
      const analyser = vizCtx.createAnalyser();
      analyser.fftSize              = 256;
      analyser.smoothingTimeConstant = 0.82;
      vizCtx.createMediaStreamSource(stream).connect(analyser);
      vizCtxRef.current = vizCtx;
      setAnalyserNode(analyser);
    } catch {
      // Visualiser is non-critical — scribe still works without it
    }

    // ── Web Speech API setup ──────────────────────────────────
    const recognition                = new SpeechRecognitionCtor();
    recognition.continuous           = true;
    recognition.interimResults       = true;
    recognition.lang                 = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const phrase = result[0].transcript.trim();
          if (phrase) {
            // Confirmed phrase — append permanently and add as a new line
            finalTranscriptRef.current += phrase + ' ';
            setLines((prev) => [...prev, phrase]);
          }
        } else {
          // Still-forming word — show but don't commit yet
          interim += result[0].transcript;
        }
      }
      setInterimText(interim.trim());
      // Show final + current interim together in real-time
      setTranscript((finalTranscriptRef.current + interim).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are normal — not fatal errors
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(`Speech error: ${event.error}`);
      setStatus('error');
    };

    recognition.onend = () => {
      // Browser stopped the session (common after ~60 s of silence in continuous mode).
      // Restart automatically unless we intentionally called stop().
      if (!stoppingRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* race: ignore */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus('recording');
  }, []);

  // ── Stop recording ────────────────────────────────────────
  const stopRecording = useCallback(() => {
    // Signal onend not to restart
    stoppingRef.current = true;

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    // Release mic indicator
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Tear down visualiser
    vizCtxRef.current?.close().catch(() => {});
    vizCtxRef.current = null;
    setAnalyserNode(null);

    const finalText = finalTranscriptRef.current.trim();
    if (!finalText) {
      setError('No speech detected. Try again.');
      setStatus('error');
      return;
    }

    callExtractRef.current(finalText);
  }, []);

  // ── Reset ─────────────────────────────────────────────────
  const reset = useCallback(() => {
    stoppingRef.current = true;

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    vizCtxRef.current?.close().catch(() => {});
    vizCtxRef.current = null;
    setAnalyserNode(null);

    finalTranscriptRef.current = '';
    setStatus('idle');
    setError(null);
    setTranscript('');
    setLines([]);
    setInterimText('');
  }, []);

  return {
    status,
    error,
    transcript,
    lines,
    interimText,
    modelReady:   true, // no model to wait for
    workerDevice: '',   // no worker
    analyserNode,
    startRecording,
    stopRecording,
    reset,
  };
}
