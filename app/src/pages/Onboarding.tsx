import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, Users, ChevronRight, Sparkles } from 'lucide-react';
import { useScrollTop } from '@/hooks/useScrollTop';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: MapPin,
    title: 'Descubra Moçambique',
    description: 'De Maputo ao Niassa, explore praias, parques, culturas e experiências únicas em todas as 11 províncias de Moçambique.',
    image: '/images/local-1.jpg',
    gradient: 'from-[#0077B6] to-[#00A8E8]',
  },
  {
    icon: Camera,
    title: 'Compartilhe Momentos',
    description: 'Publique fotos, avalie locais e compartilhe suas aventuras — do Rovuma ao Maputo — com uma comunidade apaixonada.',
    image: '/images/local-3.jpg',
    gradient: 'from-[#F4A261] to-[#E9C46A]',
  },
  {
    icon: Users,
    title: 'Conecte-se com Moçambique',
    description: 'Faça parte de uma comunidade que descobre e preserva os tesouros de todo o país, de norte a sul.',
    image: '/images/local-6.jpg',
    gradient: 'from-[#2D6A4F] to-[#40916C]',
  },
];

export default function Onboarding({
  onComplete }: OnboardingProps) {
  useScrollTop();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="h-full flex flex-col"
        >
          {/* Image Section */}
          <div className="relative h-[60%] overflow-hidden">
            <motion.img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8 }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
            
            {/* Skip Button */}
            <motion.button
              onClick={skip}
              className="absolute top-12 right-4 px-5 py-2.5 bg-white/20 backdrop-blur-xl rounded-full text-white text-sm font-semibold border border-white/30 hover:bg-white/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Pular
            </motion.button>
          </div>

          {/* Content Section */}
          <div className="flex-1 px-8 pb-8 flex flex-col -mt-16 relative z-10">
            {/* Icon Card */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-6 shadow-2xl`}
            >
              <Icon size={36} className="text-white" strokeWidth={2} />
            </motion.div>

            {/* Text */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 mb-3 leading-tight"
            >
              {slide.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500 leading-relaxed text-lg"
            >
              {slide.description}
            </motion.p>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom Section */}
            <div className="flex items-center justify-between pt-4">
              {/* Dots */}
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-8 bg-gradient-to-r from-[#0077B6] to-[#2D6A4F]' 
                        : 'w-2 bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>

              {/* Next Button */}
              <motion.button
                onClick={nextSlide}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-6 py-4 bg-gradient-to-r ${slide.gradient} text-white rounded-2xl font-semibold shadow-xl`}
              >
                {currentSlide === slides.length - 1 ? (
                  <>
                    <Sparkles size={18} />
                    Começar
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight size={18} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
