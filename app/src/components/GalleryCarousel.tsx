/**
 * GalleryCarousel
 *
 * Carousel de imagens — usa apenas URLs reais da API (Cloudinary).
 * Sem placeholders nem imagens externas.
 * Quando não há imagens, exibe um fundo CSS neutro.
 * Quando uma imagem falha, oculta-a (não substitui por placeholder).
 */
import { useState, useEffect, useRef, useCallback } from 'react';

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
  // Apenas URLs reais não-vazios
  const list = (images ?? []).filter(s => typeof s === 'string' && s.trim() !== '');
  const total = list.length;

  const [idx, setIdx]         = useState(0);
  const [hovered, setHovered] = useState(false);
  const [failed, setFailed]   = useState<Set<number>>(new Set());
  const touchStartX           = useRef<number | null>(null);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reiniciar índice e falhas quando o array mudar
  useEffect(() => {
    setIdx(0);
    setFailed(new Set());
  }, [total]);

  // Autoplay — só quando há mais de 1 imagem e não está em hover
  useEffect(() => {
    if (total <= 1 || hovered) return;
    timerRef.current = setInterval(() => {
      setIdx(p => (p + 1) % total);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, hovered]);

  const prev = useCallback(() => setIdx(p => (p - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx(p => (p + 1) % total), [total]);

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

  const markFailed = useCallback((i: number) => {
    setFailed(prev => new Set(prev).add(i));
  }, []);

  // Sem imagens — fundo CSS neutro, sem nenhum pedido HTTP
  if (total === 0) {
    return (
      <div className="absolute inset-0" style={{ background: '#E8EFF5' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="#A0B8C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ color: '#A0B8C8', fontSize: 12, fontWeight: 600 }}>Sem imagem</span>
        </div>
        {/* Camada de gradiente para overlays do pai ficarem legíveis */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />
        {children}
      </div>
    );
  }

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
            opacity: i === idx && !failed.has(i) ? 1 : 0,
            transition: 'opacity 0.45s ease',
            willChange: 'opacity',
            zIndex: 0,
            cursor: total > 1 ? 'pointer' : 'default',
          }}
          onError={() => markFailed(i)}
        />
      ))}

      {/* Fundo neutro visível quando a imagem activa falhou */}
      {failed.has(idx) && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0, background: '#E8EFF5' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#A0B8C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}

      {/* ── Camada 1: gradiente ──────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />

      {/* ── Camada 2: botões de navegação ────────────────────────────── */}
      {total > 1 && (
        <>
          <button type="button" onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute top-0 left-0 h-full w-1/2"
            style={{ zIndex: 2, background: 'transparent', cursor: 'pointer' }}
            aria-label="Imagem anterior" />
          <button type="button" onClick={e => { e.stopPropagation(); next(); }}
            className="absolute top-0 right-0 h-full w-1/2"
            style={{ zIndex: 2, background: 'transparent', cursor: 'pointer' }}
            aria-label="Próxima imagem" />
        </>
      )}

      {/* ── Camada 2: dots ──────────────────────────────────────────── */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5" style={{ zIndex: 2 }}>
          {list.map((_, i) => (
            <button key={i} type="button"
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              style={{
                padding: 0,
                width: i === idx ? 22 : 8, height: 8, borderRadius: 4,
                background: i === idx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.25)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }} />
          ))}
        </div>
      )}

      {/* ── Camada 3: overlays do pai ───────────────────────────────── */}
      {children}
    </div>
  );
}
