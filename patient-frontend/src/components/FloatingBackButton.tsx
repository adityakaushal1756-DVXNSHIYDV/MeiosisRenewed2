import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { cn } from './Sidebar';

interface FloatingBackButtonProps {
  onBack: () => void;
  visible: boolean;
}

export function FloatingBackButton({ onBack, visible }: FloatingBackButtonProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Reveal when scrolling up and not at the very top
      if (currentScrollY < lastScrollY && currentScrollY > 100) {
        setShouldShow(true);
      } 
      // Hide when scrolling down or at the top
      else if (currentScrollY > lastScrollY || currentScrollY <= 50) {
        setShouldShow(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // If the parent explicitly says 'visible' (e.g. we are not on home), 
  // and our internal 'shouldShow' is true.
  const finalVisibility = visible && shouldShow;

  return (
    <AnimatePresence>
      {finalVisibility && (
        <motion.button
          initial={{ opacity: 0, x: -20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="fixed top-6 left-6 z-[60] w-16 h-16 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl group xl:hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full" />
          <ChevronLeft className="w-8 h-8 text-white transition-transform group-hover:-translate-x-1" />
          
          {/* Label for "spacious" feedback */}
          <span className="sr-only">Go Back</span>
          
          {/* Subtle ring pulse */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-white/20"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
