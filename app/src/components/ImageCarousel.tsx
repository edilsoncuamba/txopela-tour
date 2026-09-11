import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
  showControls?: boolean;
  showDots?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Controlo externo de pausa — quando true o autoplay para */
  paused?: boolean;
}

export default function ImageCarousel({
  images,
  autoPlay = true,
  interval = 3000,
  showControls = true,
  showDots = true,
  className = '',
  objectFit = 'cover',
  paused: externalPaused = false,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [internalPaused, setInternalPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pausa se qualquer fonte pedir — interna (touch) ou externa (hover no wrapper)
  const isPaused = internalPaused || externalPaused;

  useEffect(() => {
    if (!autoPlay || images.length <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoPlay, interval, images.length, isPaused]);

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);

  const goToSlide = (index: number) => setCurrentIndex(index);

  if (images.length === 0) {
    return <div className={`bg-gray-200 ${className}`} />;
  }

  return (
    <div
      className={`relative overflow-hidden group ${className}`}
      onTouchStart={() => setInternalPaused(true)}
      onTouchEnd={() => setInternalPaused(false)}
      style={{ background: '#111' }}
    >
      {/* Imagens empilhadas — cross-fade via opacity, sem movimento */}
      <div className="relative w-full h-full" style={{ minHeight: 120 }}>
        {images.map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`Slide ${index + 1}`}
            className="absolute inset-0 w-full h-full select-none"
            draggable={false}
            style={{
              objectFit,
              opacity: index === currentIndex ? 1 : 0,
              transition: 'opacity 0.45s ease',
              willChange: 'opacity',
            }}
          />
        ))}
      </div>

      {/* Controlos de navegação */}
      {showControls && images.length > 1 && (
        <>
          {/* Anterior */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center border border-white/10"
            style={{
              background: '#1B5E3B',
              transition: 'transform 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(-50%) scale(1)')}
          >
            <ChevronLeft size={22} className="text-white" strokeWidth={2.5} />
          </button>

          {/* Seguinte */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center border border-white/10"
            style={{
              background: '#1B5E3B',
              transition: 'transform 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(-50%) scale(1)')}
          >
            <ChevronRight size={22} className="text-white" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Indicadores */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: index === currentIndex ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: index === currentIndex ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.25)',
                transition: 'width 0.3s ease, background 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
