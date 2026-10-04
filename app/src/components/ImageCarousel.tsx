import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Limiar mínimo de deslocamento (px) para considerar um swipe/drag ─────────
const SWIPE_THRESHOLD = 40;

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
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  // ── Posição inicial de um gesto (touch ou mouse drag) ─────────────────────
  const gestureStartX = useRef<number | null>(null);
  const isDragging    = useRef(false);

  // ── Autoplay — pausa apenas via prop externa ──────────────────────────────
  // O autoplay NÃO é pausado durante hover: os botões e dots estão sempre
  // visíveis quando images.length > 1, sem depender de estado de hover.
  useEffect(() => {
    if (!autoPlay || images.length <= 1 || externalPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoPlay, interval, images.length, externalPaused]);

  const goToPrevious = useCallback(() =>
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length),
    [images.length]);

  const goToNext = useCallback(() =>
    setCurrentIndex(prev => (prev + 1) % images.length),
    [images.length]);

  const goToSlide = (index: number) => setCurrentIndex(index);

  // ── Handlers de TOUCH ─────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    gestureStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (gestureStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - gestureStartX.current;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      delta < 0 ? goToNext() : goToPrevious();
    }
    gestureStartX.current = null;
  }, [goToNext, goToPrevious]);

  // ── Handlers de MOUSE drag ────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Ignorar cliques nos botões de navegação e nos dots
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    gestureStartX.current = e.clientX;
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || gestureStartX.current === null) return;
    const delta = e.clientX - gestureStartX.current;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      delta < 0 ? goToNext() : goToPrevious();
    }
    gestureStartX.current = null;
    isDragging.current = false;
  }, [goToNext, goToPrevious]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    // Só cancela o drag se o cursor saiu realmente para fora do carousel
    // (não para um elemento filho — o relatedTarget não está dentro do container)
    const related = e.relatedTarget as Node | null;
    if (related && containerRef.current?.contains(related)) return;
    gestureStartX.current = null;
    isDragging.current = false;
  }, []);

  if (images.length === 0) {
    return <div className={`bg-gray-200 ${className}`} />;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: '#111',
        cursor: images.length > 1 ? 'grab' : 'default',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={images.length > 1 ? handleMouseDown : undefined}
      onMouseUp={images.length > 1 ? handleMouseUp : undefined}
      onMouseLeave={images.length > 1 ? handleMouseLeave : undefined}
    >
      {/* Imagens empilhadas — cross-fade via opacity */}
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

      {/* Controlos de navegação — sempre visíveis quando há mais de 1 imagem */}
      {showControls && images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 transition-transform duration-150 hover:scale-105 active:scale-95"
            style={{ background: '#1B5E3B' }}
          >
            <ChevronLeft size={22} className="text-white" strokeWidth={2.5} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 transition-transform duration-150 hover:scale-105 active:scale-95"
            style={{ background: '#1B5E3B' }}
          >
            <ChevronRight size={22} className="text-white" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Indicadores (dots) — sempre visíveis quando há mais de 1 imagem */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              style={{
                width: index === currentIndex ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: index === currentIndex
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.40)',
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
