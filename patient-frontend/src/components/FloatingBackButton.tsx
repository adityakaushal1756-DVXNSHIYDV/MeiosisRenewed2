import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface FloatingBackButtonProps {
  onBack: () => void;
  visible: boolean;
}

export function FloatingBackButton({ onBack, visible }: FloatingBackButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, x: -20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="floating-back fixed top-6 left-6 z-[60] w-16 h-16 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl group xl:hidden"
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
