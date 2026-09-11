import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Play,
  Pause,
  Download,
  Share2,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/modules/culture/types';

// ─── Public Interface ────────────────────────────────────────────────────────

export interface MediaGalleryProps {
  items: MediaItem[];
  onItemClick?: (item: MediaItem, index: number) => void;
  /** @default 'grid' */
  layout?: 'grid' | 'masonry' | 'carousel';
  /** Number of columns for grid / masonry layouts. @default 3 */
  columns?: number;
  /** Show captions below / over media items. @default true */
  showCaptions?: boolean;
  /** Enable full-screen lightbox on click. @default true */
  enableLightbox?: boolean;
}

// ─── Spring presets (GPU-accelerated: transform + opacity only) ───────────────

const SPRING_CARD = { type: 'spring', stiffness: 260, damping: 20 } as const;
const SPRING_LIGHTBOX = { type: 'spring', stiffness: 300, damping: 25 } as const;
const SPRING_CAROUSEL = { type: 'spring', stiffness: 240, damping: 22 } as const;

// ─── Root Component ───────────────────────────────────────────────────────────

/**
 * MediaGallery
 *
 * Displays a collection of images / videos in three switchable layouts:
 *   • grid     – uniform aspect-ratio grid
 *   • masonry  – Pinterest-style column stacking
 *   • carousel – full-width slideshow with thumbnail strip
 *
 * Features:
 *   - Lazy loading via IntersectionObserver (Req 6.5)
 *   - Lightbox with keyboard navigation (Req 1.3, 1.4)
 *   - Caption display (Req 6.3)
 *   - GPU-accelerated spring animations (transform + opacity only)
 *   - Fully responsive (mobile → desktop)
 *   - Accessible: keyboard nav, aria-labels, alt text
 */
export default function MediaGallery({
  items,
  onItemClick,
  layout = 'grid',
  columns = 3,
  showCaptions = true,
  enableLightbox = true,
}: MediaGalleryProps) {
  const [displayLayout, setDisplayLayout] = useState<'grid' | 'masonry' | 'carousel'>(layout);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const markLoaded = useCallback((id: string) => {
    setLoadedImages((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleItemClick = useCallback(
    (item: MediaItem, index: number) => {
      if (enableLightbox) {
        setLightboxIndex(index);
        setLightboxOpen(true);
      }
      onItemClick?.(item, index);
    },
    [enableLightbox, onItemClick],
  );

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-500">Nenhuma mídia disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Layout Switcher ── */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Galeria de Mídia
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </span>
        </h3>

        <div
          className="flex items-center gap-1 bg-gray-100 rounded-lg p-1"
          role="group"
          aria-label="Selecionar layout"
        >
          {(
            [
              { key: 'grid', icon: <Grid3x3 size={16} />, label: 'Grade' },
              { key: 'masonry', icon: <LayoutGrid size={16} />, label: 'Mosaico' },
              { key: 'carousel', icon: <ChevronRight size={16} />, label: 'Carrossel' },
            ] as const
          ).map(({ key, icon, label }) => (
            <Button
              key={key}
              variant="ghost"
              size="icon-sm"
              onClick={() => setDisplayLayout(key)}
              aria-pressed={displayLayout === key}
              title={label}
              className={cn(
                'transition-colors',
                displayLayout === key
                  ? 'bg-white shadow-sm text-[#0077B6]'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {icon}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Layouts ── */}
      {displayLayout === 'grid' && (
        <GridLayout
          items={items}
          columns={columns}
          showCaptions={showCaptions}
          onItemClick={handleItemClick}
          loadedImages={loadedImages}
          markLoaded={markLoaded}
        />
      )}

      {displayLayout === 'masonry' && (
        <MasonryLayout
          items={items}
          columns={columns}
          showCaptions={showCaptions}
          onItemClick={handleItemClick}
          loadedImages={loadedImages}
          markLoaded={markLoaded}
        />
      )}

      {displayLayout === 'carousel' && (
        <CarouselLayout
          items={items}
          showCaptions={showCaptions}
          onItemClick={handleItemClick}
          loadedImages={loadedImages}
          markLoaded={markLoaded}
        />
      )}

      {/* ── Lightbox ── */}
      {enableLightbox && (
        <Lightbox
          items={items}
          isOpen={lightboxOpen}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
          showCaptions={showCaptions}
        />
      )}
    </div>
  );
}

// ─── Shared layout prop types ─────────────────────────────────────────────────

interface LayoutProps {
  items: MediaItem[];
  columns: number;
  showCaptions: boolean;
  onItemClick: (item: MediaItem, index: number) => void;
  loadedImages: Set<string>;
  markLoaded: (id: string) => void;
}

// ─── Grid Layout ──────────────────────────────────────────────────────────────

function GridLayout({ items, columns, showCaptions, onItemClick, loadedImages, markLoaded }: LayoutProps) {
  const gridCols =
    ({
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    } as Record<number, string>)[columns] ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={cn('grid gap-4', gridCols)}>
      {items.map((item, index) => (
        <MediaCard
          key={item.id}
          item={item}
          index={index}
          showCaption={showCaptions}
          onClick={() => onItemClick(item, index)}
          isLoaded={loadedImages.has(item.id)}
          onLoad={() => markLoaded(item.id)}
          aspectRatio="square"
        />
      ))}
    </div>
  );
}

// ─── Masonry Layout ───────────────────────────────────────────────────────────

function MasonryLayout({ items, columns, showCaptions, onItemClick, loadedImages, markLoaded }: LayoutProps) {
  // Distribute items across columns in order (left-to-right fill)
  const cols = Math.max(1, columns);
  const columnArrays: Array<Array<{ item: MediaItem; originalIndex: number }>> = Array.from(
    { length: cols },
    () => [],
  );
  items.forEach((item, index) => {
    columnArrays[index % cols].push({ item, originalIndex: index });
  });

  const colClass =
    ({
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    } as Record<number, string>)[cols] ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={cn('grid gap-4 items-start', colClass)}>
      {columnArrays.map((colItems, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-4">
          {colItems.map(({ item, originalIndex }) => (
            <MediaCard
              key={item.id}
              item={item}
              index={originalIndex}
              showCaption={showCaptions}
              onClick={() => onItemClick(item, originalIndex)}
              isLoaded={loadedImages.has(item.id)}
              onLoad={() => markLoaded(item.id)}
              aspectRatio="auto"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Carousel Layout ──────────────────────────────────────────────────────────

interface CarouselLayoutProps extends Omit<LayoutProps, 'columns'> {}

function CarouselLayout({ items, showCaptions, onItemClick, loadedImages, markLoaded }: CarouselLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, 3000);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, items.length]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(((index % items.length) + items.length) % items.length);
      setIsAutoPlaying(false);
    },
    [items.length],
  );

  const currentItem = items[currentIndex];

  return (
    <div className="relative">
      {/* Main slide */}
      <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={SPRING_CAROUSEL}
            className="absolute inset-0"
          >
            {currentItem.type === 'image' ? (
              <LazyImage
                src={currentItem.url}
                alt={currentItem.caption || `Imagem ${currentIndex + 1}`}
                className="w-full h-full object-contain"
                isLoaded={loadedImages.has(currentItem.id)}
                onLoad={() => markLoaded(currentItem.id)}
              />
            ) : (
              <video
                src={currentItem.url}
                poster={currentItem.thumbnail}
                controls
                className="w-full h-full object-contain"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next */}
        <button
          onClick={() => goTo(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
        <button
          onClick={() => goTo(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight size={24} className="text-white" />
        </button>

        {/* Auto-play toggle */}
        <button
          onClick={() => setIsAutoPlaying((v) => !v)}
          className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
          aria-label={isAutoPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isAutoPlaying ? (
            <Pause size={18} className="text-white" />
          ) : (
            <Play size={18} className="text-white ml-0.5" />
          )}
        </button>

        {/* Expand to lightbox */}
        <button
          onClick={() => onItemClick(currentItem, currentIndex)}
          className="absolute bottom-4 left-4 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
          aria-label="Ampliar"
        >
          <Maximize2 size={18} className="text-white" />
        </button>

        {/* Caption overlay */}
        {showCaptions && currentItem.caption && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_CARD}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12 pointer-events-none"
          >
            <p className="text-white text-sm font-medium">{currentItem.caption}</p>
            {currentItem.credit && (
              <p className="text-white/70 text-xs mt-1">Crédito: {currentItem.credit}</p>
            )}
          </motion.div>
        )}

        {/* Counter badge */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none">
          <span className="text-white text-sm font-medium">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div
        className="mt-4 flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Miniaturas"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={currentIndex === index}
            onClick={() => goTo(index)}
            className={cn(
              'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all',
              'hover:ring-2 hover:ring-[#0077B6] hover:ring-offset-2',
              currentIndex === index
                ? 'ring-4 ring-[#0077B6] ring-offset-2 scale-105'
                : 'opacity-60 hover:opacity-100',
            )}
          >
            <img
              src={item.thumbnail ?? item.url}
              alt={item.caption ?? `Miniatura ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play size={14} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Media Card ───────────────────────────────────────────────────────────────

interface MediaCardProps {
  item: MediaItem;
  index: number;
  showCaption: boolean;
  onClick: () => void;
  isLoaded: boolean;
  onLoad: () => void;
  aspectRatio?: 'square' | 'video' | 'auto';
}

function MediaCard({ item, index, showCaption, onClick, isLoaded, onLoad, aspectRatio = 'square' }: MediaCardProps) {
  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...SPRING_CARD, delay: Math.min(index * 0.04, 0.4) }}
      className="group relative"
    >
      <button
        onClick={onClick}
        aria-label={item.caption ?? `Abrir mídia ${index + 1}`}
        className={cn(
          'relative w-full overflow-hidden rounded-xl bg-gray-100',
          'transition-shadow duration-300 hover:shadow-xl',
          aspectClass,
        )}
      >
        {/* Media */}
        {item.type === 'image' ? (
          <LazyImage
            src={item.url}
            alt={item.caption ?? `Imagem ${index + 1}`}
            className="w-full h-full object-cover"
            isLoaded={isLoaded}
            onLoad={onLoad}
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={item.thumbnail ?? item.url}
              alt={item.caption ?? `Vídeo ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                <Play size={22} className="text-[#0077B6] ml-1" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="absolute bottom-3 right-3">
            <ZoomIn size={18} className="text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Caption slide-up */}
        {showCaption && item.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none">
            <p className="text-white text-sm font-medium line-clamp-2">{item.caption}</p>
          </div>
        )}
      </button>
    </motion.div>
  );
}

// ─── Lazy Image ───────────────────────────────────────────────────────────────

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  isLoaded: boolean;
  onLoad: () => void;
}

/**
 * Defers loading until the element enters the viewport (IntersectionObserver).
 * Shows an animated skeleton while loading.
 * Uses only opacity transitions (GPU-accelerated).
 */
function LazyImage({ src, alt, className, isLoaded, onLoad }: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className={cn('relative overflow-hidden', className)}>
      {/* Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" aria-hidden="true" />
      )}

      {/* Image — only rendered once in viewport */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={onLoad}
        />
      )}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  items: MediaItem[];
  isOpen: boolean;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  showCaptions: boolean;
}

/**
 * Full-screen lightbox with:
 *   - Keyboard navigation (← → Esc)
 *   - Download button
 *   - Web Share API (when available)
 *   - Body scroll lock while open
 *   - Spring-animated entrance / exit
 */
function Lightbox({ items, isOpen, currentIndex, onClose, onNavigate, showCaptions }: LightboxProps) {
  const currentItem = items[currentIndex];
  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + items.length) % items.length);
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % items.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, currentIndex, items.length, onClose, onNavigate]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = currentItem.url;
    a.download = `media-${currentItem.id}`;
    a.click();
  }, [currentItem]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({ title: currentItem.caption ?? 'Mídia', url: currentItem.url });
    } catch {
      // User cancelled or API unavailable — silently ignore
    }
  }, [currentItem]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de mídia"
          onClick={onClose}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Action buttons */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
              aria-label="Baixar"
            >
              <Download size={18} className="text-white" />
            </button>
            {canShare && (
              <button
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                aria-label="Partilhar"
              >
                <Share2 size={18} className="text-white" />
              </button>
            )}
          </div>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full pointer-events-none">
            <span className="text-white text-sm font-medium">
              {currentIndex + 1} / {items.length}
            </span>
          </div>

          {/* Main content */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-4 pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={SPRING_LIGHTBOX}
                className="relative flex flex-col items-center max-w-7xl w-full"
              >
                {currentItem.type === 'image' ? (
                  <img
                    src={currentItem.url}
                    alt={currentItem.caption ?? `Imagem ${currentIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                ) : (
                  <video
                    src={currentItem.url}
                    poster={currentItem.thumbnail}
                    controls
                    autoPlay
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                )}

                {/* Caption */}
                {showCaptions && currentItem.caption && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={SPRING_CARD}
                    className="mt-4 text-center px-4"
                  >
                    <p className="text-white text-base font-medium">{currentItem.caption}</p>
                    {currentItem.credit && (
                      <p className="text-white/60 text-sm mt-1">Crédito: {currentItem.credit}</p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex - 1 + items.length) % items.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors hover:scale-110"
                aria-label="Anterior"
              >
                <ChevronLeft size={28} className="text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex + 1) % items.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors hover:scale-110"
                aria-label="Próximo"
              >
                <ChevronRight size={28} className="text-white" />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
