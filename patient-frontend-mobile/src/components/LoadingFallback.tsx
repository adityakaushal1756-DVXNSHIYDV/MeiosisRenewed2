export function LoadingFallback() {
  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-8">
      <style>{`
        @keyframes patient-pulse {
          0% { transform: scale(0.95); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.7; }
          100% { transform: scale(0.95); opacity: 0.3; }
        }
        @keyframes patient-orbit {
          from { transform: rotate(0deg) translateX(24px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(24px) rotate(-360deg); }
        }
      `}</style>

      <div className="relative mb-8 h-20 w-20">
        {/* Glow backdrop */}
        <div className="absolute inset-0 rounded-full bg-neon/5 blur-2xl" />
        
        {/* Center icon / point */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-neon shadow-[0_0_20px_rgba(0,255,136,0.5)]" />
        </div>

        {/* Orbiting dot */}
        <div 
          className="absolute inset-0"
          style={{ animation: 'patient-orbit 2s linear infinite' }}
        >
          <div className="h-2 w-2 rounded-full bg-neon/40 shadow-[0_0_10px_rgba(0,255,136,0.3)]" />
        </div>

        {/* Outer Ring */}
        <div className="absolute inset-[-10px] rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/40">
          Syncing Module
        </h3>
        <p className="text-sm text-mist/60 animate-pulse">
          Wait, your data is coming up...
        </p>
      </div>

      {/* Futuristic scanning line */}
      <div className="mt-8 h-px w-32 overflow-hidden bg-white/5">
        <div 
          className="h-full w-12 bg-neon/30 blur-[2px]"
          style={{ 
            animation: 'mw-shimmer 2.5s ease-in-out infinite',
            background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.4), transparent)'
          }}
        />
      </div>
    </div>
  );
}
