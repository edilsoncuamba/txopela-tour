import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollTop } from '@/hooks/useScrollTop';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({
  onComplete }: SplashScreenProps) {
  useScrollTop();
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // 100 steps × 25ms = 2.5 seconds total
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 1;
      });
    }, 25);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 overflow-hidden bg-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/local-1.jpg)' }}
      />
      
      {/* Gradient Overlay - 15% translucent */}
      <div className="absolute inset-0 bg-white/15" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-between px-6 py-12">
        {/* Logo Top - hidden, logo is now in center */}
        <div />

        {/* Center Content */}
        <div className="flex flex-col items-center">
          <motion.img
            src="/images/Logo1.png"
            alt="Txopela Tour Logo"
            className="w-[202px] h-[202px] object-contain drop-shadow-2xl mb-3"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />

          <motion.p
            className="text-white text-center text-lg font-bold -mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            Descubra o melhor de Moçambique
          </motion.p>
        </div>

        {/* Bottom Progress */}
        <div className="w-full flex flex-col items-center gap-4">
          <motion.div
            className="w-32 h-1 bg-white/20 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </motion.div>

          <motion.p
            className="text-white/70 text-xs font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {progress < 100 ? 'Carregando...' : 'Pronto!'}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
