import { Sparkles } from 'lucide-react';

export function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center bg-[#07101a]">
      <style>{`
        @keyframes spinner-scan {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.1); opacity: 0.5; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="relative">
        {/* Holographic Ring */}
        <div 
          className="absolute inset-[-12px] rounded-full border border-neon/20"
          style={{ animation: 'rotate-slow 4s linear infinite' }}
        />
        
        {/* Glowing Orb */}
        <div 
          className="h-16 w-16 rounded-3xl bg-neon/10 flex items-center justify-center border border-neon/30 shadow-[0_0_32px_rgba(0,255,136,0.15)]"
          style={{ animation: 'spinner-scan 3s ease-in-out infinite' }}
        >
          <Sparkles className="text-neon" size={24} />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-mist/40">
          Initializing Engine
        </span>
        <div className="h-[2px] w-12 overflow-hidden rounded-full bg-white/5">
          <div 
            className="h-full bg-neon/40 transition-all duration-500"
            style={{ width: '40%', animation: 'mw-shimmer 2s linear infinite' }}
          />
        </div>
      </div>
    </div>
  );
}
