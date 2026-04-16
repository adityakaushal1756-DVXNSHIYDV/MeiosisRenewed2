import { useState } from 'react';
import { MessageSquare, Paperclip, Mic, Send } from 'lucide-react';
import { cn } from '../components/Sidebar';
import { CheckCircle2 } from 'lucide-react';

export function MessagesPage() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const doctors = [
    { id: '1', name: 'Dr. Sarah Mitchell', role: 'General Medicine', online: true, unread: 2, last: 'I have reviewed your latest tests.' },
    { id: '2', name: 'Dr. Arjun Rao', role: 'Cardiology', online: false, unread: 0, last: 'Please see me next week.' },
  ];

  return (
    <div className="p-6 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto h-full flex flex-col relative overflow-hidden">
      <header className="mb-8 mt-2 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Messages</h1>
          <p className="text-mist mt-1 text-sm font-medium">Secure clinical consultation & encrypted channels.</p>
        </div>
        
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-white/5 backdrop-blur-3xl shadow-2xl">
           <div className="px-6 py-2.5 text-xs font-semibold text-neon uppercase tracking-wider flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-neon animate-pulse shadow-[0_0_10px_rgba(82,255,157,0.8)]"></div>
             Direct Care Thread
           </div>
        </div>
      </header>

      <div className="flex-1 glass-card border border-wire/10 flex overflow-hidden lg:rounded-[28px] rounded-2xl relative">
        
        {/* Sidebar */}
        <aside className={cn(
          "w-full lg:w-[320px] shrink-0 border-r border-wire/10 flex flex-col bg-panel/40",
          selectedDoc ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-6 border-b border-wire/10 shrink-0">
            <span className="text-[10px] font-semibold text-sky uppercase tracking-wider mb-3 block opacity-50">Private Inbox</span>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Active Doctors</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scroll-skin divide-y divide-wire/5">
            {doctors.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc.id)}
                className={cn(
                  "w-full text-left p-4 hover:bg-white/5 transition-colors flex gap-3 relative",
                  selectedDoc === doc.id ? "bg-white/[0.08]" : ""
                )}
              >
                {selectedDoc === doc.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon shadow-[0_0_10px_rgba(82,255,157,0.5)]" />}
                
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-sky/10 border border-sky/20 flex items-center justify-center text-sky font-bold">
                    {doc.name.split(' ')[1][0]}
                  </div>
                  {doc.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-panel"></div>}
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-white truncate">{doc.name}</h4>
                    <span className="text-xs text-mist">12:30 PM</span>
                  </div>
                  <p className="text-xs text-mist truncate">{doc.last}</p>
                </div>
                {doc.unread > 0 && (
                   <div className="w-5 h-5 rounded-full bg-neon text-ink flex items-center justify-center text-[10px] font-bold shrink-0 self-center">
                     {doc.unread}
                   </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-ink/40 relative",
          !selectedDoc ? "hidden lg:flex" : "flex"
        )}>
          {!selectedDoc ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-mist" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your secure care conversation</h3>
              <p className="text-sm text-mist max-w-sm">Select a doctor from the left to open the encrypted consultation chat.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-[72px] shrink-0 border-b border-wire/10 flex items-center justify-between px-6 bg-panel/60 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedDoc(null)} className="lg:hidden w-8 h-8 rounded-lg text-mist hover:text-white hover:bg-white/10 flex justify-center items-center">
                    {'<'}
                  </button>
                  <div className="w-10 h-10 rounded-full bg-sky/10 border border-sky/20 flex items-center justify-center text-sky font-bold">S</div>
                  <div>
                    <h2 className="text-white font-bold tracking-tight">Dr. Sarah Mitchell</h2>
                    <p className="text-xs text-neon">Encrypted consultation channel</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="chip !text-[10px] !py-0.5 border-wire/10 bg-white/5 text-mist hidden sm:flex">Private thread</span>
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto scroll-skin p-6 flex flex-col gap-6">
                <div className="text-center">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-mist/60 bg-white/5 px-3 py-1 rounded-full border border-wire/5">Today</span>
                </div>
                
                {/* Received */}
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-sky/10 border border-sky/20 flex items-center justify-center text-sky font-bold shrink-0 text-xs mt-1">S</div>
                  <div className="glass-card !rounded-2xl !rounded-tl flex flex-col p-3 border-wire/10">
                    <p className="text-sm text-white leading-relaxed">Aditya, I have reviewed your latest tests. The blood pressure is looking much more stable now.</p>
                    <span className="text-[10px] text-mist mt-2 self-end">12:30 PM</span>
                  </div>
                </div>

                {/* Sent */}
                <div className="flex gap-3 max-w-[85%] self-end flex-row-reverse">
                  <div className="glass-card !bg-sky/20 !border-sky/30 !rounded-2xl !rounded-tr flex flex-col p-3">
                    <p className="text-sm text-white leading-relaxed">That is great to hear doctor. Should I continue the same dosage of Amlodipine?</p>
                    <span className="text-[10px] text-sky mt-2 self-end">12:35 PM <CheckCircle2 className="w-3 h-3 inline ml-1 opacity-70" /></span>
                  </div>
                </div>
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-wire/10 shrink-0 bg-panel/60 backdrop-blur-md">
                <div className="flex gap-2 items-end">
                  <button className="w-11 h-11 rounded-xl ghost-btn shrink-0 flex items-center justify-center group">
                    <Paperclip className="w-5 h-5 text-mist group-hover:text-white transition-colors" />
                  </button>
                  <button 
                    onClick={() => setIsRecording(true)}
                    className="w-11 h-11 rounded-xl ghost-btn shrink-0 flex items-center justify-center group"
                  >
                    <Mic className="w-5 h-5 text-mist group-hover:text-white transition-colors" />
                  </button>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="w-full h-11 bg-black/20 border border-wire/10 rounded-xl px-4 text-sm text-white placeholder-mist outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                    />
                  </div>
                  <button className="w-11 h-11 rounded-xl action-btn shrink-0 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-center text-mist/60 mt-3 hidden md:block">Attach a medical image or record a voice note directly in this secure thread.</p>
              </div>
            </>
          )}

          {/* Voice Overlay */}
          {isRecording && (
            <div className="absolute inset-x-0 bottom-0 top-0 bg-ink/80 backdrop-blur-md z-20 flex flex-col items-center justify-center animate-[page-enter_0.2s_ease-out_forwards]">
              <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/40 relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                <Mic className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Recording Voice Note</h3>
              <p className="text-mist mb-8">Tap done when you finish.</p>
              
              <div className="flex gap-1 items-center mb-8 h-8">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-1.5 bg-red-400/80 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsRecording(false)} className="ghost-btn !px-6">Cancel</button>
                <button onClick={() => setIsRecording(false)} className="action-btn !px-6 bg-white !text-slate-900 border-none">Done</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
