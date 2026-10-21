/**
 * AuthPageLayout — layout de ecrã completo para páginas de autenticação.
 *
 * Fornece:
 *  - Slideshow de fundo sem efeito de transição visível (igual ao Login)
 *  - Overlay de gradiente verde escuro + vinheta
 *  - Logo no topo esquerdo (desktop)
 *  - Copy "Vamos lá." no topo (mobile) / coluna esquerda (desktop)
 *  - Slot para o card do formulário que sobe do rodapé (mobile) ou fica centrado (desktop)
 *  - Indicadores de slide no canto inferior esquerdo (opcional)
 */

import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Slides partilhados ────────────────────────────────────────────────────────
const SLIDES = [
  { image: '/images/provincias_profile/inhambane.jpeg', province: 'Inhambane', caption: 'Arquipélago do Bazaruto' },
  { image: '/images/provincias_profile/nampula.jpeg',   province: 'Nampula',   caption: 'Ilha de Moçambique'      },
  { image: '/images/provincias_profile/maputo_provicnia.jpeg', province: 'Maputo', caption: 'Ponta de Ouro'       },
  { image: '/images/provincias_profile/tete.jpg',       province: 'Tete',      caption: 'Cahora Bassa'            },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface AuthPageLayoutProps {
  /** Card do formulário */
  children: ReactNode;
  /** Título desktop coluna esquerda (default: "Explore o melhor\nde Moçambique.") */
  desktopTitle?: ReactNode;
  /** Mostrar indicadores de slide no canto inferior esquerdo */
  showSlideIndicators?: boolean;
  /** Card não ocupa toda a largura mobile — útil para pages com card centrado verticalmente */
  centeredCard?: boolean;
}

export default function AuthPageLayout({
  children,
  desktopTitle,
  showSlideIndicators = false,
  centeredCard = false,
}: AuthPageLayoutProps) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const current = SLIDES[slide];

  return (
    /* Ecrã inteiro — fixo, sem scroll — o fundo slideshow é sempre visível */
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
    >
      {/* ── FUNDO: slideshow sem efeito de transição visível ─────────────── */}
      {SLIDES.map((s, i) => (
        <img
          key={s.image}
          src={s.image}
          alt={s.caption}
          className="fixed inset-0 w-full h-full object-cover object-center"
          style={{
            opacity: i === slide ? 1 : 0,
            transition: 'none',
            zIndex: i === slide ? 0 : -1,
          }}
        />
      ))}

      {/* Overlay gradiente principal */}
      <div
        className="fixed inset-0"
        style={{ background: 'linear-gradient(105deg, rgba(5,30,15,0.82) 0%, rgba(5,30,15,0.60) 45%, rgba(5,20,10,0.45) 100%)', zIndex: 1 }}
      />
      {/* Vinheta nas bordas */}
      <div
        className="fixed inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)', zIndex: 1 }}
      />

      {/* ── LOGO (desktop) ────────────────────────────────────────────────── */}
      <div className="absolute top-8 left-10 hidden md:flex items-center gap-2.5" style={{ zIndex: 20 }}>
        <div
          className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,1)',
            padding: 4,
          }}
        >
          <img src="/images/Logo2.png" alt="Txopela Tour" className="w-full h-full object-contain" />
        </div>
        <span
          className="font-black text-[15px] text-white leading-none block"
          style={{ fontFamily: 'Pacifico, cursive', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
        >
          Txopela Tour
        </span>
      </div>

      {/* ── INDICADORES DE SLIDE ──────────────────────────────────────────── */}
      {showSlideIndicators && (
        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10" style={{ zIndex: 20 }}>
          <div className="flex items-center gap-2 mb-2 justify-start">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className="transition-all duration-300"
                style={{
                  width: i === slide ? 24 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === slide ? 'white' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-sm font-bold text-white text-left" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                {current.caption}
              </p>
              <p className="text-xs font-medium text-left" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {current.province}, Moçambique
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── CONTEÚDO PRINCIPAL ────────────────────────────────────────────── */}
      <div
        className={`relative w-full h-full flex ${
          centeredCard
            ? 'flex-col lg:flex-row items-center justify-center lg:justify-between px-5 md:px-10 lg:px-16 xl:px-24 gap-8 lg:gap-12 py-6'
            : 'flex-col lg:flex-row items-end lg:items-center justify-end lg:justify-between px-0 lg:px-16 xl:px-24 gap-0 lg:gap-12'
        }`}
        style={{ zIndex: 10 }}
      >
        {/* ── COPY — desktop (coluna esquerda) ──────────────────────────────── */}
        <div className="hidden lg:flex flex-col max-w-sm xl:max-w-md flex-shrink-0" style={{ marginBottom: '4rem' }}>
          {desktopTitle ?? (
            <h1
              className="font-black leading-[1.05]"
              style={{
                fontSize: 'clamp(2.4rem, 3.5vw, 3.2rem)',
                color: 'white',
                letterSpacing: '-0.03em',
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              }}
            >
              Explore o melhor<br />
              <span style={{
                background: 'linear-gradient(90deg, #2BB5C8, #43E8A0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                de Moçambique.
              </span>
            </h1>
          )}
        </div>

        {/* ── CARD DO FORMULÁRIO — scroll independente ──────────────────────── */}
        {/* mobile: ocupa toda a largura, sobe do rodapé, scroll próprio        */}
        {/* desktop: max-w fixo, centralizado, scroll próprio se necessário     */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full flex-shrink-0 ${centeredCard ? '' : 'lg:max-w-[420px]'} flex flex-col`}
          style={{
            ...(centeredCard ? { maxWidth: 420 } : undefined),
            /* altura máxima = toda a viewport; overflow-y para scroll no card */
            maxHeight: '100dvh',
            overflowY: 'auto',
            overflowX: 'hidden',
            /* scrollbar invisível */
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
        >
          {/* espaçador topo no mobile — empurra o card para baixo */}
          {!centeredCard && <div className="flex-1 lg:hidden" style={{ minHeight: '4rem' }} />}
          {children}
        </motion.div>
      </div>
    </div>
  );
}
