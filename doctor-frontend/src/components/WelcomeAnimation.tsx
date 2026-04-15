import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CURRENT_DOCTOR } from '../config/doctorProfile';

type Phase = 'in' | 'hold' | 'out' | 'done';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const KEYFRAMES = `
@keyframes mw-in        { from{opacity:0}         to{opacity:1} }
@keyframes mw-out       { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.04)} }

@keyframes mw-orb1 {
  0%,100%{transform:translate(0,0)   scale(1);}
  40%    {transform:translate(44px,-32px) scale(1.13);}
  70%    {transform:translate(-22px,22px) scale(0.91);}
}
@keyframes mw-orb2 {
  0%,100%{transform:translate(0,0)   scale(1);}
  50%    {transform:translate(-52px,38px) scale(1.19);}
}
@keyframes mw-orb3 {
  0%,100%{transform:translate(0,0)   scale(1);}
  30%    {transform:translate(28px,-42px) scale(0.87);}
  65%    {transform:translate(-32px,16px) scale(1.15);}
}

@keyframes mw-scan {
  0%          {top:-1px;  opacity:0;}
  4%          {opacity:0.55;}
  90%         {opacity:0.35;}
  100%        {top:100%;  opacity:0;}
}

@keyframes mw-mark-in {
  0%  {opacity:0; transform:scale(0.45) rotate(-8deg);}
  62% {           transform:scale(1.08) rotate(1.5deg);}
  100%{opacity:1; transform:scale(1)    rotate(0deg);}
}
@keyframes mw-ring {
  0%  {transform:scale(1);   opacity:0.65;}
  100%{transform:scale(2.9); opacity:0;}
}
@keyframes mw-wordmark {
  0%  {opacity:0; letter-spacing:0.55em; filter:blur(8px);}
  100%{opacity:1; letter-spacing:0.24em; filter:blur(0);}
}
@keyframes mw-divider {
  0%  {transform:scaleX(0); opacity:0;}
  8%  {opacity:0.45;}
  100%{transform:scaleX(1); opacity:0.28;}
}
@keyframes mw-rise {
  0%  {opacity:0; transform:translateY(18px);}
  100%{opacity:1; transform:translateY(0);}
}
@keyframes mw-shimmer {
  0%  {background-position:200% center;}
  100%{background-position:-200% center;}
}
`;

export function WelcomeAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('in');

  // hold → exit after 3.2 s total
  useEffect(() => {
    const t = setTimeout(() => setPhase('out'), 3200);
    return () => clearTimeout(t);
  }, []);

  // unmount after exit animation (0.65 s)
  useEffect(() => {
    if (phase !== 'out') return;
    const t = setTimeout(() => { setPhase('done'); onDone(); }, 680);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  if (phase === 'done') return null;

  const exiting = phase === 'out';

  return createPortal(
    <>
      <style>{KEYFRAMES}</style>

      {/* ── Full-screen overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: '#07101a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        animation: exiting
          ? 'mw-out 0.65s cubic-bezier(0.4,0,1,1) forwards'
          : 'mw-in  0.28s ease forwards',
      }}>

        {/* ── Drifting ambient orbs ── */}
        <div style={{
          position:'absolute', top:'6%', right:'12%',
          width:520, height:520, borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle,rgba(0,255,136,0.09) 0%,transparent 68%)',
          animation:'mw-orb1 9s ease-in-out infinite',
        }}/>
        <div style={{
          position:'absolute', bottom:'6%', left:'8%',
          width:600, height:600, borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle,rgba(56,182,255,0.07) 0%,transparent 68%)',
          animation:'mw-orb2 11s ease-in-out infinite',
        }}/>
        <div style={{
          position:'absolute', top:'38%', right:'3%',
          width:400, height:400, borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle,rgba(130,80,255,0.06) 0%,transparent 68%)',
          animation:'mw-orb3 13s ease-in-out infinite',
        }}/>

        {/* ── Scanning line ── */}
        <div style={{
          position:'absolute', left:0, right:0, height:1, pointerEvents:'none',
          background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.55),rgba(56,182,255,0.45),transparent)',
          animation:'mw-scan 2.4s cubic-bezier(0.4,0,0.6,1) 0.15s forwards',
          opacity:0,
        }}/>

        {/* ── Center content stack ── */}
        <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'0 32px', userSelect:'none' }}>

          {/* M mark + glow rings */}
          <div style={{ position:'relative', display:'inline-block', marginBottom:26 }}>
            {/* Expanding ring 1 */}
            <div style={{
              position:'absolute', inset:-18, borderRadius:'50%',
              border:'1px solid rgba(0,255,136,0.38)',
              animation:'mw-ring 2.1s ease-out 0.35s infinite',
              pointerEvents:'none',
            }}/>
            {/* Expanding ring 2 — offset so they feel staggered */}
            <div style={{
              position:'absolute', inset:-18, borderRadius:'50%',
              border:'1px solid rgba(0,255,136,0.18)',
              animation:'mw-ring 2.1s ease-out 1.05s infinite',
              pointerEvents:'none',
            }}/>

            {/* Badge */}
            <div style={{
              width:76, height:76, borderRadius:22,
              background:'linear-gradient(140deg,rgba(0,255,136,0.14) 0%,rgba(0,200,108,0.06) 100%)',
              border:'1.5px solid rgba(0,255,136,0.42)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 36px rgba(0,255,136,0.18), inset 0 1px 0 rgba(255,255,255,0.07)',
              animation:'mw-mark-in 0.72s cubic-bezier(0.34,1.56,0.64,1) 0.12s both',
            }}>
              <span style={{
                fontSize:38, fontWeight:800, lineHeight:1,
                color:'rgba(0,255,136,0.92)',
                fontFamily:'Outfit, system-ui, sans-serif',
                letterSpacing:'-0.02em',
                textShadow:'0 0 22px rgba(0,255,136,0.55)',
              }}>M</span>
            </div>
          </div>

          {/* MEIOSIS wordmark */}
          <div style={{
            fontSize:12, fontWeight:700,
            color:'rgba(255,255,255,0.45)',
            fontFamily:'Outfit, system-ui, sans-serif',
            letterSpacing:'0.24em',
            marginBottom:30,
            animation:'mw-wordmark 0.7s cubic-bezier(0.4,0,0.2,1) 0.42s both',
          }}>
            MEIOSIS
          </div>

          {/* Divider */}
          <div style={{
            height:1, marginBottom:30,
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)',
            transformOrigin:'center',
            animation:'mw-divider 0.55s cubic-bezier(0.4,0,0.2,1) 0.88s both',
          }}/>

          {/* Greeting */}
          <div style={{
            fontSize:14, fontWeight:400, letterSpacing:'0.05em',
            color:'rgba(180,210,230,0.5)',
            fontFamily:'Outfit, system-ui, sans-serif',
            marginBottom:10,
            animation:'mw-rise 0.5s cubic-bezier(0.4,0,0.2,1) 1.12s both',
          }}>
            {greeting()}
          </div>

          {/* Doctor name — shimmer finish */}
          <div style={{
            fontSize:36, fontWeight:700, letterSpacing:'-0.01em', lineHeight:1.18,
            fontFamily:'Outfit, system-ui, sans-serif',
            marginBottom:14,
            background:'linear-gradient(100deg,rgba(255,255,255,0.94) 30%,rgba(0,255,136,0.75) 50%,rgba(255,255,255,0.94) 70%)',
            backgroundSize:'200% auto',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
            animation:'mw-rise 0.5s cubic-bezier(0.4,0,0.2,1) 1.32s both, mw-shimmer 3s linear 1.8s 1',
          }}>
            {CURRENT_DOCTOR.name}
          </div>

          {/* Specialty / hospital */}
          {(CURRENT_DOCTOR.specialty || CURRENT_DOCTOR.hospital) && (
            <div style={{
              fontSize:12, fontWeight:500, letterSpacing:'0.07em',
              color:'rgba(140,190,170,0.58)',
              fontFamily:'Outfit, system-ui, sans-serif',
              animation:'mw-rise 0.5s cubic-bezier(0.4,0,0.2,1) 1.52s both',
            }}>
              {[CURRENT_DOCTOR.specialty, CURRENT_DOCTOR.hospital]
                .filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
