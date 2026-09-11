import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollableModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  maxHeight?: string;
}

export default function ScrollableModal({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = 1200,
  maxHeight = '95vh' 
}: ScrollableModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.6)', 
            zIndex: 100, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 16, 
            backdropFilter: 'blur(4px)',
            overflowY: 'auto' // Allow scrolling the entire modal
          }}
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 30, opacity: 0 }} 
            animate={{ scale: 1, y: 0, opacity: 1 }} 
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: '#FFFFFF', 
              borderRadius: 16, 
              width: '100%', 
              maxWidth: maxWidth, 
              maxHeight: maxHeight,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)', 
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden',
              margin: '20px auto', // Center and add margin
              minHeight: 0 // Important for flex children
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}