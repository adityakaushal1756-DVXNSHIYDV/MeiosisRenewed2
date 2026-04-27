import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hammer, HardHat, Construction, ArrowLeft, Sparkles, LucideIcon } from 'lucide-react';

interface ClinicFeatureOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  version?: string;
  icon: LucideIcon;
  accentColor?: string; // Tailwind class like 'neon', 'blue-400', 'purple-400'
  accentHex?: string;   // Hex for shadows/glows
}

const ClinicFeatureOverlay: React.FC<ClinicFeatureOverlayProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  version = "v2", 
  icon: MainIcon,
  accentColor = "neon",
  accentHex = "#6EE7B7"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
          />

          {/* Sliding Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-[101] h-[calc(100vh-10px)] rounded-t-[32px] border-t border-white/10 bg-[#0A0F1E] shadow-2xl overflow-hidden"
          >
            {/* ── DYNAMIC ANIMATED BACKGROUND ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               {/* Primary Accent Glow (Slow ellipticial drift) */}
               <motion.div 
                 animate={{ 
                   x: ['-10%', '10%', '-5%', '5%', '-10%'],
                   y: ['-5%', '5%', '10%', '-10%', '-5%'],
                   scale: [1, 1.1, 0.95, 1.05, 1]
                 }}
                 transition={{ 
                   duration: 25, 
                   repeat: Infinity, 
                   ease: "linear" 
                 }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%]"
                 style={{
                   background: `radial-gradient(circle at center, ${accentHex}15 0%, ${accentHex}08 30%, transparent 70%)`,
                 }}
               />
               
               {/* Secondary Atmospheric Glow (Opposite drift) */}
               <motion.div 
                 animate={{ 
                   x: ['10%', '-10%', '5%', '-5%', '10%'],
                   y: ['5%', '-5%', '-10%', '10%', '5%'],
                   scale: [1.1, 0.9, 1.1, 0.9, 1.1]
                 }}
                 transition={{ 
                   duration: 35, 
                   repeat: Infinity, 
                   ease: "linear" 
                 }}
                 className="absolute -top-[20%] -right-[10%] w-[100%] h-[100%]"
                 style={{
                   background: `radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)`,
                 }}
               />

               {/* Noise Overlay (Static or very slow pan) */}
               <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay">
                 <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                   <filter id="noiseFilter">
                     <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                   </filter>
                   <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                 </svg>
               </div>
            </div>

            {/* Header / Nav */}
            <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10">
              <button
                onClick={onClose}
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/30"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </button>

              <div className="flex items-center gap-2">
                 <div className={`h-2 w-2 rounded-full bg-${accentColor} animate-pulse`} style={{ backgroundColor: accentHex }} />
                 <span className={`text-xs font-bold uppercase tracking-widest`} style={{ color: accentHex }}>
                   Experimental Beta {version}
                 </span>
              </div>

              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition-all hover:bg-red-500/20 hover:border-red-500/40"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="relative h-full flex flex-col items-center justify-center p-10 overflow-hidden">
              
              {/* Construction Animation / Visuals */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative mb-12"
              >
                <div className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-[32px] border border-${accentColor}/30 bg-${accentColor}/5 text-${accentColor}`} 
                     style={{ 
                       borderColor: `${accentHex}4d`,
                       backgroundColor: `${accentHex}0d`,
                       color: accentHex,
                       boxShadow: `0 0 60px -12px ${accentHex}66` 
                     }}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <MainIcon size={56} strokeWidth={1.5} />
                  </motion.div>
                </div>
                
                {/* Orbital Elements */}
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 -m-8 rounded-full border border-dashed border-white/10"
                />
                
                <motion.div
                  animate={{ 
                    rotate: -360,
                    x: [0, 10, 0, -10, 0],
                    y: [0, -10, 0, 10, 0]
                  }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-4 -right-4 h-10 w-10 flex items-center justify-center rounded-xl border border-blue-400/30 bg-blue-400/10 text-blue-400"
                >
                  <Hammer size={20} />
                </motion.div>

                <motion.div
                  animate={{ 
                    rotate: 360,
                    x: [0, -8, 0, 8, 0],
                    y: [0, 8, 0, -8, 0]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-2 -left-6 h-12 w-12 flex items-center justify-center rounded-xl border border-purple-400/30 bg-purple-400/10 text-purple-400"
                >
                  <HardHat size={24} />
                </motion.div>
              </motion.div>

              {/* Text Content */}
              <div className="text-center space-y-4 max-w-2xl relative z-10">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl font-bold text-white tracking-tight"
                >
                  {title} <span style={{ color: accentHex }}>{version}</span>
                </motion.h2>
                
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-mist font-medium"
                >
                  {subtitle}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="pt-8 flex flex-col items-center gap-6"
                >
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                    <Sparkles style={{ color: accentHex }} size={20} />
                    <span className="text-white/70 font-medium italic">High-density architecture & real-time synchronization coming soon.</span>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ duration: 2, delay: 1 }}
                          className={`h-full`} 
                          style={{ backgroundColor: accentHex }}
                        />
                      </div>
                      <span className="text-[10px] uppercase tracking-tighter text-white/30 font-bold">Refactoring Core</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '40%' }}
                          transition={{ duration: 2, delay: 1.5 }}
                          className="h-full bg-blue-500" 
                        />
                      </div>
                      <span className="text-[10px] uppercase tracking-tighter text-white/30 font-bold">UI Polish</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom Decorative Element */}
              <div className={`absolute bottom-0 left-0 right-0 h-px`} style={{ backgroundImage: `linear-gradient(to right, transparent, ${accentHex}33, transparent)` }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ClinicFeatureOverlay;
