import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  FileText, 
  Calendar, 
  Pill, 
  Files, 
  Users, 
  MessageSquare, 
  QrCode, 
  Settings,
  X,
  Plus,
  Activity
} from 'lucide-react';
import { cn } from './Sidebar';

export type Section = 
  | 'home' 
  | 'records' 
  | 'nfc' 
  | 'appointments' 
  | 'medicines' 
  | 'prescriptions' 
  | 'network' 
  | 'messages' 
  | 'myqr' 
  | 'settings';

interface RadialMenuProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
}

const navItems: { id: Section; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, color: 'text-sky' },
  { id: 'records', label: 'Timeline', icon: <Activity className="w-5 h-5" />, color: 'text-neon' },
  { id: 'appointments', label: 'Visits', icon: <Calendar className="w-5 h-5" />, color: 'text-purple-400' },
  { id: 'medicines', label: 'Meds', icon: <Pill className="w-5 h-5" />, color: 'text-amber-400' },
  { id: 'prescriptions', label: 'Scripts', icon: <Files className="w-5 h-5" />, color: 'text-emerald-400' },
  { id: 'network', label: 'Network', icon: <Users className="w-5 h-5" />, color: 'text-sky' },
  { id: 'messages', label: 'Chat', icon: <MessageSquare className="w-5 h-5" />, color: 'text-blue-400' },
  { id: 'myqr', label: 'QR', icon: <QrCode className="w-5 h-5" />, color: 'text-neon' },
  { id: 'nfc', label: 'LifeLine', icon: <Plus className="w-5 h-5" />, color: 'text-rose-400' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, color: 'text-mist' },
];

export function RadialMenu({ currentSection, onSectionChange }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<Section | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  
  const centerRef = useRef<HTMLDivElement>(null);
  const radius = 130; 

  const currentItem = navItems.find(i => i.id === currentSection) || navItems[0];

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsPressing(true);
    setIsOpen(prev => !prev);
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isOpen || !centerRef.current) return;

    const rect = centerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 40 && distance < radius * 2) {
      const angle = Math.atan2(dy, dx);
      let normalizedAngle = angle + (Math.PI / 2);
      if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
      
      const itemIndex = Math.round((normalizedAngle / (2 * Math.PI)) * navItems.length) % navItems.length;
      const targetItem = navItems[itemIndex];
      
      if (hoveredSection !== targetItem.id) {
        setHoveredSection(targetItem.id);
        if ('vibrate' in navigator) navigator.vibrate(5);
      }
    } else {
      setHoveredSection(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPressing(false);
    if (hoveredSection) {
      onSectionChange(hoveredSection);
      setIsOpen(false);
      setHoveredSection(null);
    }
  };

  return (
    <>
      {/* 1. Global Page Subtle Blur (Uncoupled from menu animation) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[90]"
          />
        )}
      </AnimatePresence>

      <motion.div 
        ref={centerRef}
        animate={{ 
          x: isOpen ? -130 : 0, 
          y: isOpen ? -130 : 0 
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="fixed bottom-10 right-10 z-[100] flex items-center justify-center touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >

      {/* 2. Frosted Glass Halo (Circular Component Behind Menu) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, rotate: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-[24px] pointer-events-none z-0 overflow-hidden"
            style={{ 
               width: `${radius * 2 + 100}px`, 
               height: `${radius * 2 + 100}px`,
               boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05), 0 0 80px rgba(0,0,0,0.6)'
            }}
          >
             {/* Subtle internal shine for extra realism */}
             <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-20"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial Items */}
      <AnimatePresence>
        {isOpen && navItems.map((item, index) => {
          const angle = (index / navItems.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * (radius + (hoveredSection === item.id ? 15 : 0));
          const y = Math.sin(angle) * (radius + (hoveredSection === item.id ? 15 : 0));
          const isSelected = hoveredSection === item.id || (currentSection === item.id && !hoveredSection);

          return (
            <motion.button
              key={item.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ 
                x, 
                y, 
                scale: 1, 
                opacity: 1,
                transition: { 
                  type: 'spring', 
                  stiffness: 800, 
                  damping: 40, 
                }
              }}
              exit={{ 
                x: 0, 
                y: 0, 
                scale: 0, 
                opacity: 0,
                transition: { duration: 0.1, ease: 'easeIn' }
              }}
              onClick={() => {
                onSectionChange(item.id);
                setIsOpen(false);
              }}
              style={{
                boxShadow: isSelected ? `0 15px 50px ${item.color.includes('neon') ? 'rgba(82,255,157,0.4)' : 'rgba(255,255,255,0.15)'}` : 'none'
              }}
              className={cn(
                "absolute w-16 h-16 rounded-full border flex flex-col items-center justify-center transition-all duration-200 group bg-panel/95 backdrop-blur-3xl",
                isSelected 
                  ? "border-white/50 bg-white/20 scale-125 z-20 shadow-2xl" 
                  : "border-wire/10 opacity-70 scale-90"
              )}
            >
              <div className={cn(item.color, "flex items-center justify-center [&>svg]:w-7 [&>svg]:h-7 transition-transform", isSelected && "scale-110")}>
                {item.icon}
              </div>
              
              <AnimatePresence>
                {isSelected && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -top-12 text-[10px] font-semibold uppercase tracking-wider text-white whitespace-nowrap bg-ink px-4 py-1.5 rounded-full border border-wire/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-30"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Central Trigger Button */}
      <motion.button
        onPointerDown={handlePointerDown}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative w-20 h-20 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 shadow-2xl z-10 overflow-hidden outline-none",
          isOpen 
            ? "bg-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.5)] border-transparent" 
            : "bg-ink border-2 border-neon text-white shadow-[0_0_40px_rgba(82,255,157,0.25)]"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        {isOpen ? (
          <motion.div 
            initial={{ rotate: -90, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 1000, damping: 30 }}
          >
            <X className="w-10 h-10" />
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <div className={cn(currentItem.color, "[&>svg]:w-8 [&>svg]:h-8 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]")}>
              {currentItem.icon}
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-tight text-mist/80">
              {currentItem.label}
            </span>
          </div>
        )}
      </motion.button>

    </motion.div>
    </>
  );
}

