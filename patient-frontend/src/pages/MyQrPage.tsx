import { useState } from 'react';
import { Shield, Clock, QrCode, UserCircle, Files, FileText, Beaker, XCircle } from 'lucide-react';

export function MyQrPage() {
  const [duration, setDuration] = useState(2); // 0=15m, 1=30m, 2=1h, 3=2h, 4=6h
  const durationLabels = ['15m', '30m', '1 hr', '2 hrs', '6 hrs'];

  return (
    <div className="p-6 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-5xl mx-auto h-full flex flex-col">
      <header className="mb-8 mt-2 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">My QR</h1>
        <p className="text-mist">Present to a doctor for instant verified access to your records.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 pb-8">
        
        {/* Main QR Card */}
        <div className="flex-1 max-w-md mx-auto w-full">
          <div className="glass-card overflow-hidden h-full flex flex-col">
            
            {/* QR Scanner Area */}
            <div className="p-8 pb-6 flex justify-center bg-gradient-to-b from-white/[0.02] to-transparent border-b border-wire/10 relative">
              <div className="relative w-64 h-64 p-4 rounded-3xl bg-white shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center group overflow-hidden">
                <QrCode className="w-full h-full text-slate-900" strokeWidth={1} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent h-12 w-full animate-[panel-float_3s_ease-in-out_infinite]" />
              </div>
            </div>

            {/* Identity Info */}
            <div className="p-6 text-center border-b border-wire/10">
              <h2 className="text-2xl font-bold text-white mb-1">Aditya Kaushal</h2>
              <p className="text-sm text-mist mb-4">ID: <strong className="text-white">M-2024-001</strong></p>
              
              <div className="flex items-center justify-center gap-2">
                <span className="chip chip-green !px-4"><Shield className="w-3.5 h-3.5" /> Full Record Access</span>
                <span className="chip bg-white/5 border-wire/20 text-white"><div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Live</span>
              </div>
            </div>

            {/* Access Grants Row */}
            <div className="grid grid-cols-2 p-6 gap-y-4 gap-x-2 border-b border-wire/10 flex-1 bg-white/[0.01]">
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-full bg-sky/10 border border-sky/20 flex items-center justify-center text-sky">
                  <Files className="w-4 h-4" />
                </div>
                Full Timeline
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                Prescriptions
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Beaker className="w-4 h-4" />
                </div>
                Lab Reports
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCircle className="w-4 h-4" />
                </div>
                Identity Match
              </div>
            </div>

            {/* Duration Slider */}
            <div className="p-6 bg-ink/30 mt-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-mist flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Valid for
                </span>
                <strong className="text-lg text-white font-semibold">{durationLabels[duration]}</strong>
              </div>
              
              <div className="relative mb-6">
                <input 
                  type="range" 
                  min="0" 
                  max="4" 
                  step="1" 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-neon cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between mt-2 pt-1 text-[11px] font-medium text-mist/60 px-1">
                  <span>15m</span>
                  <span>30m</span>
                  <span>1h</span>
                  <span>2h</span>
                  <span>6h</span>
                </div>
              </div>

              <button className="w-full ghost-btn !bg-red-500/5 !border-red-500/20 !text-red-400 hover:!bg-red-500/10 hover:!border-red-500/30 group">
                <XCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Revoke Access Now
              </button>
            </div>
            
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:w-80 shrink-0 flex flex-col gap-6">
          <div className="glass-card p-6 h-full border border-wire/10">
            <span className="chip bg-sky/10 border-sky/20 text-sky mb-4 inline-flex">Scan Guide</span>
            <h3 className="section-title mb-6">How it works</h3>
            
            <div className="space-y-6">
              <div className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-neon shadow-[0_0_8px_rgba(82,255,157,0.8)]"></div>
                <strong className="block text-white text-sm mb-1">What the doctor sees</strong>
                <p className="text-mist text-sm leading-relaxed">Full profile, appointments, prescriptions, and EMR context from one simple scan.</p>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-sky shadow-[0_0_8px_rgba(131,212,255,0.8)]"></div>
                <strong className="block text-white text-sm mb-1">How OTP works</strong>
                <p className="text-mist text-sm leading-relaxed">If prompted on the doctor's end, an OTP will appear on this screen. Read it to them to confirm access.</p>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                <strong className="block text-white text-sm mb-1">Duration control</strong>
                <p className="text-mist text-sm leading-relaxed">Use the slider to set how long access is valid before the link automatically expires.</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-wire/10 grid gap-3">
              <button className="ghost-btn w-full">Download Summary</button>
              <button className="ghost-btn w-full">Share Link via SMS</button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
