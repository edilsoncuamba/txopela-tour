/**
 * GalleryCarousel
 *
 * Carousel de imagens — modelo exacto do HeritageDetail (Cultura).
 * Todos os elementos (imagens, gradiente, botões, dots, overlays do pai)
 * ficam no mesmo container position:relative, sem stacking contexts aninhados.
 *
 * Uso:
 *   <div className="relative w-full overflow-hidden md:rounded-2xl"
 *        style={{ height: 'clamp(270px, 30vw, 370px)' }}>
 *     <GalleryCarousel images={arr} alt="nome">
 *       <div className="absolute top-0 ..." style={{ zIndex: 30 }}>...</div>
 *     </GalleryCarousel>
 *   </div>
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';

interface GalleryCarouselProps {
  images: string[];
  alt?: string;
  objectFit?: 'cover' | 'contain';
  /** children = overlays do pai (top-bar, bottom-info) com zIndex >= 30 */
  children?: React.ReactNode;
}

export default function GalleryCarousel({
  images,
  alt = 'Imagem',
  objectFit = 'cover',
  children,
}: GalleryCarouselProps) {
  // Normalizar array — nunca vazio
  const list = images && images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const total = list.length;

  const [idx, setIdx]       = useState(0);
  const [hovered, setHovered] = useState(false);
  const touchStartX           = useRef<number | null>(null);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reiniciar índice quando o array de imagens mudar de tamanho
  useEffect(() => {
    setIdx(0);
  }, [total]);

  // Autoplay — pausa quando o cursor está sobre o carousel (igual ao modelo Cultura)
  useEffect(() => {
    if (total <= 1 || hovered) return;
    timerRef.current = setInterval(() => {
      setIdx(p => (p + 1) % total);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, hovered]);

  const prev = useCallback(() =>
    setIdx(p => (p - 1 + total) % total), [total]);

  const next = useCallback(() =>
    setIdx(p => (p + 1) % total), [total]);

  // Swipe táctil
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 40) prev();
    else if (delta < -40) next();
    touchStartX.current = null;
  }, [prev, next]);

  return (
    <div
      className="absolute inset-0"
      style={{ cursor: total > 1 ? 'pointer' : 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={total > 1 ? onTouchStart : undefined}
      onTouchEnd={total > 1 ? onTouchEnd : undefined}
    >
      {/* ── Camada 0: imagens (cross-fade) ─────────────────────────── */}
      {list.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} ${i + 1}`}
          draggable={false}
          className="absolute inset-0 w-full h-full select-none"
          style={{
            objectFit,
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 0.45s ease',
            willChange: 'opacity',
            zIndex: 0,
            cursor: total > 1 ? 'pointer' : 'default',
          }}
          onError={e => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
          }}
        />
      ))}

      {/* ── Camada 1: gradiente (não bloqueia eventos) ──────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)',
        }}
      />

      {/* ── Camada 2: botões de navegação — invisíveis mas funcionais ── */}
      {/* O botão ocupa a metade esquerda/direita da galeria para facilitar  */}
      {/* o clique em qualquer ponto dessa área, sem ícone visível.          */}
      {total > 1 && (
        <>
          {/* Área clicável esquerda — metade esquerda da galeria */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute top-0 left-0 h-full w-1/2"
            style={{ zIndex: 2, background: 'transparent', cursor: 'pointer' }}
            aria-label="Imagem anterior"
          />

          {/* Área clicável direita — metade direita da galeria */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute top-0 right-0 h-full w-1/2"
            style={{ zIndex: 2, background: 'transparent', cursor: 'pointer' }}
            aria-label="Próxima imagem"
          />
        </>
      )}

      {/* ── Camada 2: dots ──────────────────────────────────────────── */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
          style={{ zIndex: 2 }}
        >
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              style={{
                padding: 0,
                width: i === idx ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  i === idx
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.25)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Camada 3: overlays do pai (top-bar, bottom-info) ────────── */}
      {/* children devem ter zIndex >= 3 para ficarem acima dos botões  */}
      {children}
    </div>
  );
}
