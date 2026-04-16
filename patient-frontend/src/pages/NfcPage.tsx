import { SmartphoneNfc, ShieldAlert, History, CreditCard, RotateCcw } from 'lucide-react';

export function NfcPage() {
  return (
    <div className="p-6 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">NFC ID Screen</h1>
        <p className="text-mist">MEIOSIS Universal ID</p>
      </header>

      <div className="flex-1 overflow-y-auto scroll-skin pb-12 queue-scroll space-y-6">
        
        {/* NFC Cards List */}
        <div className="glass-card p-6 border border-wire/10">
          <h2 className="section-title mb-6">Your NFC Cards</h2>
          <div className="flex gap-4 overflow-x-auto scroll-skin pb-4 queue-window-strip -mx-2 px-2">
            
            {/* Card 1 */}
            <div className="w-[300px] h-[180px] shrink-0 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-slate-700 p-6 flex flex-col justify-between relative overflow-hidden group queue-window-pill shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-3xl group-hover:bg-neon/20 transition-colors"></div>
              <div className="flex justify-between items-start relative z-10">
                <span className="text-white font-semibold tracking-wider uppercase">MEIOSIS</span>
                <SmartphoneNfc className="w-6 h-6 text-neon" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] text-mist tracking-wider uppercase mb-1 block">Patient ID</span>
                <div className="font-mono text-xl text-white tracking-widest">M-2024-001</div>
              </div>
            </div>

            {/* Empty Add Card */}
            <div className="w-[300px] h-[180px] shrink-0 rounded-2xl bg-white/[0.02] border-2 border-dashed border-wire/20 p-6 flex flex-col items-center justify-center queue-window-pill hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-wire/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-mist group-hover:text-white" />
              </div>
              <p className="text-mist text-sm font-medium">Link New Card</p>
            </div>
            
          </div>
          <div className="text-xs text-mist mt-2 text-center sm:text-left">Scroll horizontally to view all linked cards.</div>
        </div>

        {/* Live Status and Info */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 border border-wire/10">
            <h2 className="section-title mb-6">Identity Summary</h2>
            <ul className="space-y-4 text-sm mb-6">
              <li className="flex flex-col sm:flex-row justify-between pb-3 border-b border-wire/10 gap-1">
                <span className="text-mist">Unique ID</span>
                <span className="text-white font-mono">M-2024-001</span>
              </li>
              <li className="flex flex-col sm:flex-row justify-between pb-3 border-b border-wire/10 gap-1">
                <span className="text-mist">Universal ID Code</span>
                <span className="text-white font-mono tracking-widest">884-921-003</span>
              </li>
              <li className="flex flex-col sm:flex-row justify-between pb-3 border-b border-wire/10 gap-1">
                <span className="text-mist">NFC Card Status</span>
                <span className="chip chip-green !px-2 !py-0.5 !text-xs font-semibold">Encrypted & Active</span>
              </li>
              <li className="flex flex-col sm:flex-row justify-between pb-3 border-b border-wire/10 gap-1">
                <span className="text-mist">Card Passcode</span>
                <span className="text-white font-mono">••••</span>
              </li>
              <li className="flex flex-col sm:flex-row justify-between pb-3 border-b border-wire/10 gap-1">
                <span className="text-mist">Last Used</span>
                <span className="text-white">Mar 1, 2026</span>
              </li>
              <li className="flex flex-col sm:flex-row justify-between pb-3 border-b border-wire/10 gap-1">
                <span className="text-mist">Emergency Override</span>
                <span className="chip bg-white/5 border-wire/10 text-mist !px-2 !py-0.5 !text-xs">Off</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-6 border border-wire/10 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-transparent to-neon/[0.02]">
            <div className="w-48 h-48 rounded-full border border-neon/30 flex items-center justify-center relative group">
              <div className="absolute inset-0 rounded-full border border-sky/20 scale-110"></div>
              <div className="absolute inset-0 rounded-full border border-purple-500/10 scale-125"></div>
              
              {/* Radar Sweep */}
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(82,255,157,0.3)_360deg)] animate-[spin_3s_linear_infinite] pointer-events-none"></div>
              
              <div className="w-32 h-32 rounded-full bg-neon/10 backdrop-blur-md flex items-center justify-center border border-neon/50 shadow-[0_0_30px_rgba(82,255,157,0.2)] z-10 transition-transform group-hover:scale-105">
                <SmartphoneNfc className="w-12 h-12 text-neon" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mt-8 mb-2">Ready to Scan</h3>
            <p className="text-mist text-sm text-center max-w-xs">Tap your physical MEIOSIS NFC card on a compatible doctor's device.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-card p-6 border border-wire/10">
          <div className="flex flex-wrap gap-3">
            <button className="ghost-btn !border-red-500/30 !text-red-400 hover:!bg-red-500/10">Disable Card</button>
            <button className="ghost-btn"><RotateCcw className="w-4 h-4 mr-2" /> Regenerate Token</button>
            <button className="ghost-btn"><SmartphoneNfc className="w-4 h-4 mr-2" /> Simulate Doctor Scan</button>
            <button className="ghost-btn"><History className="w-4 h-4 mr-2" /> View Scan History</button>
            <div className="flex-1 sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
               <button className="action-btn !bg-red-500/20 !border-red-500/40 !text-red-300 hover:!scale-[1.02] shadow-[0_12px_30px_rgba(239,68,68,0.15)]"><ShieldAlert className="w-4 h-4 mr-2 inline" /> Emergency Override</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
