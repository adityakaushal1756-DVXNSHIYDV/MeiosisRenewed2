import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, RefreshCw, User, Plus, X, Search, Play, Pause, Mic, Trash2 } from 'lucide-react';
import { CURRENT_DOCTOR } from '../../config/doctorProfile';
import { API_BASE_URL, assetUrl } from '../../lib/api';

const MESSAGE_ATTACHMENT_PREFIX = '__MEIOSIS_ATTACHMENT__::';

/* ── Types ─────────────────────────────────────────────────── */

interface BackendMessage {
  id: string;
  threadId: string;
  sender: string;
  text: string;
  createdAt: string;
}

interface BackendThread {
  id: string;
  doctorId: string;
  patientId: string;
  updatedAt: string;
  doctor: { id: string; name: string };
  patient: { id: string; name: string; meiosisId?: string };
  messages: BackendMessage[];
}

interface PatientSummary {
  id: string;
  name: string;
  meiosisId?: string;
  phone?: string;
  email?: string;
}

const API = API_BASE_URL;

/* ── Helpers ───────────────────────────────────────────────── */

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0);
  if (diff === 0) return 'Today';
  if (diff === 86_400_000) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function parseMessagePayload(text: string) {
  if (!text.startsWith(MESSAGE_ATTACHMENT_PREFIX)) {
    return { kind: 'text' as const, text };
  }

  try {
    const payload = JSON.parse(text.slice(MESSAGE_ATTACHMENT_PREFIX.length));
    if (payload?.kind === 'attachment' && payload?.url) {
      return { kind: 'attachment' as const, ...payload, url: assetUrl(payload.url) };
    }
  } catch {
    // Ignore malformed payloads.
  }

  return { kind: 'text' as const, text };
}

function attachmentPreview(text: string) {
  const payload = parseMessagePayload(text);
  if (payload.kind !== 'attachment') return text;
  return payload.attachmentType === 'voice' ? 'Voice note' : 'Image attachment';
}

function formatDuration(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function VoiceNotePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sync = () => {
      setCurrentTime(audio.currentTime || 0);
      setDuration(audio.duration || 0);
      setPlaying(!audio.paused);
    };

    audio.addEventListener('loadedmetadata', sync);
    audio.addEventListener('timeupdate', sync);
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    audio.addEventListener('ended', sync);

    return () => {
      audio.removeEventListener('loadedmetadata', sync);
      audio.removeEventListener('timeupdate', sync);
      audio.removeEventListener('play', sync);
      audio.removeEventListener('pause', sync);
      audio.removeEventListener('ended', sync);
    };
  }, []);

  const handleToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const next = (Number(event.target.value) / 100) * duration;
    audio.currentTime = next;
    setCurrentTime(next);
  };

  return (
    <div className="grid min-w-[240px] grid-cols-[42px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-wire/10 bg-slate-950/26 p-3">
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neon/20 bg-neon/[0.12] text-neon transition hover:bg-neon/[0.18]"
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
      </button>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-mist/70">
          <span>Voice note</span>
          <span>{formatDuration(currentTime)} / {formatDuration(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={duration ? (currentTime / duration) * 100 : 0}
          onChange={handleSeek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#52ff9d]"
        />
      </div>
      <audio ref={audioRef} preload="metadata" src={src} className="hidden" />
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────── */

export function MessagePanel() {
  const [threads, setThreads]             = useState<BackendThread[]>([]);
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [draft, setDraft]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [showNewMsg, setShowNewMsg]       = useState(false);
  const [allPatients, setAllPatients]     = useState<PatientSummary[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [startingThread, setStartingThread] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Voice Recording States ── */
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<BlobPart[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  /* ── Fetch threads ── */
  const fetchThreads = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${API}/messages/threads?doctorId=${encodeURIComponent(CURRENT_DOCTOR.id)}`);
      if (!res.ok) throw new Error('fetch failed');
      const data: BackendThread[] = await res.json();
      setThreads(data);
      setActiveId((prev) => {
        if (!prev && data.length) return data[0].id;
        return data.find((t) => t.id === prev) ? prev : (data[0]?.id ?? null);
      });
    } catch {
      // backend offline — silently keep current state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* ── Fetch all patients for this doctor ── */
  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`${API}/doctors/${encodeURIComponent(CURRENT_DOCTOR.id)}/patients`);
      if (!res.ok) return;
      const data: PatientSummary[] = await res.json();
      setAllPatients(data);
    } catch {
      // silently ignore
    }
  }, []);

  /* Initial load + 5s poll */
  useEffect(() => {
    fetchThreads();
    fetchPatients();
    pollRef.current = setInterval(() => fetchThreads(true), 3_000);
    return () => { 
      if (pollRef.current) clearInterval(pollRef.current); 
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, [fetchThreads, fetchPatients]);

  /* Scroll to bottom when active thread or its messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, activeId]);

  /* Focus input when thread changes */
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  /* ── Start a new conversation with a patient ── */
  const handleStartThread = async (patient: PatientSummary) => {
    setStartingThread(patient.id);
    try {
      const res = await fetch(`${API}/messages/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: CURRENT_DOCTOR.id, patientId: patient.id })
      });
      if (!res.ok) throw new Error('failed');
      const thread: BackendThread = await res.json();
      setThreads((prev) => {
        const exists = prev.find((t) => t.id === thread.id);
        return exists ? prev : [thread, ...prev];
      });
      setActiveId(thread.id);
      setShowNewMsg(false);
      setPatientSearch('');
    } catch {
      // silently ignore
    } finally {
      setStartingThread(null);
    }
  };

  /* ── Send message ── */
  const handleSend = async () => {
    if (!activeThread || !draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    setSending(true);

    // Optimistic update
    const optimistic: BackendMessage = {
      id: `opt-${Date.now()}`,
      threadId: activeThread.id,
      sender: 'DOCTOR',
      text,
      createdAt: new Date().toISOString()
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, optimistic], updatedAt: optimistic.createdAt }
          : t
      )
    );

    try {
      await fetch(`${API}/messages/threads/${activeThread.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'DOCTOR', text })
      });
    } catch {
      // keep optimistic — will reconcile on next poll
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Voice Recording Logic ── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      voiceChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data);
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setRecordingDuration(0);
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      };

      mediaRecorder.start();
    } catch {
      // Ignored: browser may not support it or user denied permission
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Prevent sending
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    voiceChunksRef.current = [];
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        if (!activeThread) return;
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(voiceChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });

        const optimisticPayload = `${MESSAGE_ATTACHMENT_PREFIX}${JSON.stringify({
          kind: 'attachment',
          attachmentType: 'voice',
          url: URL.createObjectURL(file),
          name: file.name,
          mimeType: file.type,
          size: file.size
        })}`;

        const optimistic: BackendMessage = {
          id: `opt-${Date.now()}`,
          threadId: activeThread.id,
          sender: 'DOCTOR',
          text: optimisticPayload,
          createdAt: new Date().toISOString()
        };

        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
              ? { ...t, messages: [...t.messages, optimistic], updatedAt: optimistic.createdAt }
              : t
          )
        );

        setSending(true);
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('sender', 'DOCTOR');
          form.append('attachmentType', 'voice');

          await fetch(`${API}/messages/threads/${activeThread.id}/attachments`, {
            method: 'POST',
            body: form
          });
        } catch {
          // keep optimistic — will reconcile on next poll
        } finally {
          setSending(false);
          mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorderRef.current.stop();
    }
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  /* ── Patients not yet in a thread ── */
  const threadPatientIds = new Set(threads.map((t) => t.patientId));
  const newablePatients = allPatients.filter((p) => {
    if (threadPatientIds.has(p.id)) return false;
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.meiosisId || '').toLowerCase().includes(q);
  });
  const existingFiltered = threads.filter((t) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return t.patient.name.toLowerCase().includes(q) || (t.patient.meiosisId || '').toLowerCase().includes(q);
  });

  /* ── Empty / loading state ── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-mist">
          <RefreshCw size={22} className="animate-spin opacity-50" />
          <p className="text-sm">Loading conversations…</p>
        </div>
      </div>
    );
  }

  /* ── Layout ── */
  return (
    <div className="flex h-full min-h-0 overflow-hidden gap-5">

      {/* ── Thread list ── */}
      <aside className="glass-card flex min-h-0 w-[280px] flex-shrink-0 flex-col overflow-hidden xl:w-[300px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-wire/8 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Messages</h2>
            <p className="mt-0.5 text-[11px] text-mist">{threads.length} conversation{threads.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setShowNewMsg((v) => !v); setPatientSearch(''); }}
              className="ghost-btn p-2"
              aria-label={showNewMsg ? 'Close' : 'New message'}
              title="New message"
            >
              {showNewMsg ? <X size={13} /> : <Plus size={13} />}
            </button>
            <button
              type="button"
              onClick={() => fetchThreads(true)}
              className="ghost-btn p-2"
              aria-label="Refresh"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* New message panel */}
        {showNewMsg && (
          <div className="border-b border-wire/8 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neon/70">Start New Conversation</p>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist/40" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient…"
                className="input-shell w-full rounded-xl py-2 pl-8 pr-3 text-[12px] placeholder:text-mist/40 focus:outline-none focus:ring-1 focus:ring-neon/30"
                autoFocus
              />
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto scroll-skin">
              {newablePatients.length === 0 ? (
                <p className="py-3 text-center text-[11px] text-mist/50">
                  {allPatients.length === 0 ? 'No patients found.' : 'All patients already have conversations.'}
                </p>
              ) : (
                newablePatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleStartThread(p)}
                    disabled={startingThread === p.id}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.04] disabled:opacity-50"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky/30 to-neon/20 text-[10px] font-bold text-white">
                      {initials(p.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-white">{p.name}</p>
                      {p.meiosisId && <p className="text-[10px] text-mist/60">{p.meiosisId}</p>}
                    </div>
                    {startingThread === p.id && <RefreshCw size={11} className="ml-auto animate-spin text-neon/60" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Thread items */}
        <div className="scroll-skin flex-1 overflow-y-auto">
          {threads.length === 0 && !showNewMsg ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <MessageSquare size={28} className="opacity-20" />
              <p className="text-sm text-mist">No conversations yet.</p>
              <p className="text-xs text-mist/60">Click + to message a patient, or wait for a patient to message you.</p>
            </div>
          ) : (
            (showNewMsg ? existingFiltered : threads).map((thread) => {
              const lastMsg = thread.messages[thread.messages.length - 1];
              const isActive = thread.id === activeId;
              const unread = thread.messages.some((m) => m.sender === 'PATIENT' || m.sender === 'patient');

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveId(thread.id)}
                  className={[
                    'w-full border-b border-wire/6 px-4 py-3.5 text-left transition-all hover:bg-white/[0.03]',
                    isActive ? 'border-l-2 border-l-neon bg-neonSoft' : 'border-l-2 border-l-transparent'
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky/30 to-neon/20 text-xs font-bold text-white">
                      {initials(thread.patient.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[13px] font-semibold text-white">{thread.patient.name}</span>
                        {lastMsg && (
                          <span className="flex-shrink-0 text-[10px] text-mist/60">{fmtDate(lastMsg.createdAt)}</span>
                        )}
                      </div>
                      {lastMsg ? (
                        <p className="mt-0.5 truncate text-[11px] text-mist/70">
                          {lastMsg.sender === 'DOCTOR' || lastMsg.sender === 'doctor' ? 'You: ' : ''}{attachmentPreview(lastMsg.text)}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] italic text-mist/40">No messages yet</p>
                      )}
                    </div>
                    {unread && !isActive && (
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-neon" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Active thread ── */}
      <div className="glass-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {activeThread ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-4 border-b border-wire/8 px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky/30 to-neon/20 text-sm font-bold text-white">
                {initials(activeThread.patient.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white">{activeThread.patient.name}</h3>
                <p className="mt-0.5 text-[11px] text-mist">
                  Patient
                  {activeThread.patient.meiosisId ? ` · ${activeThread.patient.meiosisId}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-neon/20 bg-neon/8 px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-neon" />
                <span className="text-[11px] font-medium text-neon">Active thread</span>
              </div>
            </div>

            {/* Messages */}
            <div className="scroll-skin min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {activeThread.messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <MessageSquare size={28} className="opacity-20" />
                  <p className="text-sm text-mist">No messages yet.</p>
                  <p className="text-xs text-mist/50">Send the first message below.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeThread.messages.map((msg, i) => {
                    const isDoctor = msg.sender === 'DOCTOR' || msg.sender === 'doctor';
                    const prevMsg  = activeThread.messages[i - 1];
                    const showDate = !prevMsg || fmtDate(msg.createdAt) !== fmtDate(prevMsg.createdAt);
                    const payload = parseMessagePayload(msg.text);

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="my-3 flex items-center gap-3">
                            <div className="h-px flex-1 bg-wire/10" />
                            <span className="text-[10px] font-medium uppercase tracking-wider text-mist/50">
                              {fmtDate(msg.createdAt)}
                            </span>
                            <div className="h-px flex-1 bg-wire/10" />
                          </div>
                        )}
                        <div className={`flex items-end gap-2 ${isDoctor ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={[
                            'mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                            isDoctor
                              ? 'bg-gradient-to-br from-neon/40 to-sky/20 text-neon'
                              : 'bg-white/8 text-mist'
                          ].join(' ')}>
                            {isDoctor ? initials(CURRENT_DOCTOR.name) : <User size={12} />}
                          </div>
                          <div className={[
                            'max-w-[68%] rounded-2xl px-4 py-2.5',
                            isDoctor
                              ? 'rounded-br-sm bg-neon/15 border border-neon/20 text-white'
                              : 'rounded-bl-sm bg-white/[0.05] border border-wire/10 text-white/85'
                          ].join(' ')}>
                            {payload.kind === 'attachment' ? (
                              payload.attachmentType === 'voice' ? (
                                <VoiceNotePlayer src={payload.url} />
                              ) : (
                                <div className="grid gap-2">
                                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mist/70">{payload.name || 'Image attachment'}</p>
                                  <a href={payload.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
                                    <img src={payload.url} alt={payload.name || 'Shared attachment'} className="max-h-[240px] w-full max-w-[280px] object-cover" />
                                  </a>
                                </div>
                              )
                            ) : (
                              <p className="text-[13px] leading-5">{payload.text}</p>
                            )}
                            <p className={`mt-1 text-[10px] ${isDoctor ? 'text-neon/50 text-right' : 'text-mist/50'}`}>
                              {fmtTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-wire/8 px-5 py-4">
              <div className="flex items-end gap-3">
                {isRecording ? (
                  <div className="scroll-skin input-shell flex-1 flex items-center justify-between rounded-2xl px-4 py-3 h-[44px]">
                    <div className="flex items-center gap-3 text-neon animate-pulse">
                      <Mic size={16} />
                      <span className="text-sm font-medium">{formatDuration(recordingDuration)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="text-mist/60 hover:text-red-400 transition"
                      aria-label="Cancel recording"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="scroll-skin input-shell flex-1 resize-none rounded-2xl px-4 py-3 text-sm leading-5 placeholder:text-mist/40 focus:outline-none focus:ring-1 focus:ring-neon/30"
                  />
                )}
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecordingAndSend}
                    disabled={sending}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all border-neon/30 bg-neon/15 text-neon hover:bg-neon/25"
                    aria-label="Send voice note"
                  >
                    <Send size={15} />
                  </button>
                ) : draft.trim() ? (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all border-neon/30 bg-neon/15 text-neon hover:bg-neon/25"
                    aria-label="Send text"
                  >
                    <Send size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={sending}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all border-wire/20 bg-white/[0.04] text-mist/60 hover:bg-white/[0.08]"
                    aria-label="Record voice note"
                  >
                    <Mic size={15} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[10px] text-mist/40">Replies appear on the patient's Messages page in real time.</p>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-wire/10 bg-white/[0.03]">
              <MessageSquare size={26} className="opacity-25" />
            </div>
            <div>
              <p className="font-medium text-white/70">No conversation selected</p>
              <p className="mt-1 text-sm text-mist/50">Select a patient thread on the left, or click + to start one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
