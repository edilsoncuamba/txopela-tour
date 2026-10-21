/**
 * VerifyEmail.tsx
 *
 * Fluxo real conforme OpenAPI v2.1.0 — dois modos:
 *
 *  a) Modo "aguardar" (sem ?token na URL):
 *     Mostra instruções e permite reenviar o e-mail de verificação.
 *     POST /api/auth/resend-verification/ { email }  — cooldown 60s
 *
 *  b) Modo "confirmar" (com ?token=XXXXX na URL):
 *     Chama automaticamente POST /api/auth/verify-email/ { token }
 *     e mostra o resultado (sucesso ou erro).
 *     Token válido 24 horas; reenvio disponível em caso de erro.
 *
 * Visual: segue exactamente o padrão Login / Register / ForgotPassword
 * (slideshow de fundo, overlay multicamada, logo desktop, card translúcido).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, ChevronLeft, Check, AlertCircle,
  RefreshCw, Loader2, CheckCircle,
} from 'lucide-react';
import { authApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

// ── Props ─────────────────────────────────────────────────────────────────────
interface VerifyEmailProps {
  /** E-mail da conta recém-criada — necessário para reenvio */
  email: string;
  /** Chamado após verificação bem-sucedida */
  onVerified: () => void;
  /** Volta para o ecrã anterior (login) */
  onBack: () => void;
}

// ── Estado de verificação ────────────────────────────────────────────────────
type VerifyState =
  | { kind: 'waiting' }
  | { kind: 'verifying' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

// ── Slideshow de fundo — igual ao Login / Register / ForgotPassword ───────────
const slides = [
  { image: '/images/provincias_profile/inhambane.jpeg', province: 'Inhambane', caption: 'Arquipélago do Bazaruto' },
  { image: '/images/provincias_profile/nampula.jpeg',   province: 'Nampula',   caption: 'Ilha de Moçambique'      },
  { image: '/images/provincias_profile/maputo_provicnia.jpeg', province: 'Maputo', caption: 'Ponta de Ouro'       },
  { image: '/images/provincias_profile/tete.jpg',       province: 'Tete',      caption: 'Cahora Bassa'            },
];

// ── Utilitário: lê ?token da URL ──────────────────────────────────────────────
function readTokenFromUrl(): string | null {
  try {
    const search =
      window.location.search ||
      (window.location.hash.includes('?')
        ? '?' + window.location.hash.split('?')[1]
        : '');
    return new URLSearchParams(search).get('token');
  } catch {
    return null;
  }
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function VerifyEmail({ email, onVerified, onBack }: VerifyEmailProps) {
  useScrollTop();

  const [state,           setState]           = useState<VerifyState>({ kind: 'waiting' });
  const [slide,           setSlide]           = useState(0);
  const [resendLoading,   setResendLoading]   = useState(false);
  const [resendError,     setResendError]     = useState('');
  const [resendSuccess,   setResendSuccess]   = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Auto-rotate slides de fundo
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  // ── Verificar token automaticamente se presente na URL ───────────────────
  const verifyToken = useCallback(async (token: string) => {
    setState({ kind: 'verifying' });
    const res = await authApi.verifyEmail({ token });
    if (res.data?.email_verified) {
      setState({ kind: 'success', message: res.data.message || 'E-mail verificado com sucesso!' });
      setTimeout(onVerified, 2000);
    } else {
      const msg =
        res.error ||
        (res.data && !res.data.success ? res.data.message : '') ||
        'Link inválido ou expirado. Solicita um novo abaixo.';
      setState({ kind: 'error', message: msg });
    }
  }, [onVerified]);

  useEffect(() => {
    const token = readTokenFromUrl();
    if (token) verifyToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown de reenvio ─────────────────────────────────────────────────
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  // ── Reenviar e-mail ──────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCountdown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendError('');
    setResendSuccess('');

    const res = await authApi.resendVerification({ email });

    if (res.data?.success) {
      setResendSuccess(res.data.message || 'E-mail reenviado. Verifica a caixa de entrada.');
      setResendCountdown(60);
      if (state.kind === 'error') setState({ kind: 'waiting' });
    } else {
      setResendError(
        res.error ||
        (res.data ? res.data.message : '') ||
        'Não foi possível reenviar. Tenta novamente.'
      );
    }
    setResendLoading(false);
  };

  const current = slides[slide];

  // ── Fundo partilhado (slideshow + overlays) ──────────────────────────────
  const Background = () => (
    <>
      <AnimatePresence mode="sync">
        <motion.img
          key={current.image}
          src={current.image}
          alt={current.caption}
          className="fixed inset-0 w-full h-full object-cover object-center"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      <div className="fixed inset-0" style={{
        background: 'linear-gradient(105deg, rgba(5,30,15,0.82) 0%, rgba(5,30,15,0.60) 45%, rgba(5,20,10,0.45) 100%)',
      }} />
      <div className="fixed inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
      }} />
    </>
  );

  // ── A VERIFICAR — spinner fullscreen ────────────────────────────────────
  if (state.kind === 'verifying') {
    return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
    >
      <Background />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md mx-5"
        >
          <div
            className="rounded-3xl px-8 py-10 flex flex-col items-center gap-5 text-center"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}
            >
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
            <h2 className="text-xl font-black" style={{ color: '#0F172A', letterSpacing: '-0.025em' }}>
              A verificar o e-mail…
            </h2>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Aguarda um momento.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── SUCESSO ──────────────────────────────────────────────────────────────
  if (state.kind === 'success') {
    return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
    >
      <Background />
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md mx-5"
        >
          <div
            className="rounded-3xl px-8 py-10 flex flex-col items-center gap-5 text-center"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}
            >
              <CheckCircle size={40} className="text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-black mb-2" style={{ color: '#0F172A', letterSpacing: '-0.025em' }}>
                E-mail verificado!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                {state.message}
              </p>
              <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>
                A redirecionar…
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── AGUARDAR / ERRO — ecrã principal ────────────────────────────────────
  const hasError = state.kind === 'error';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
    >
      <Background />

      {/* ── Logo (desktop) ─────────────────────────────────────────────── */}
      <div className="absolute top-8 left-10 hidden md:flex items-center gap-2.5 z-20">
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

      {/* ── Conteúdo ───────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full h-full py-6 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-5 md:px-10 lg:px-16 xl:px-24 gap-8 lg:gap-12">

        {/* Copy lateral (desktop) */}
        <div className="hidden lg:flex flex-col max-w-sm xl:max-w-md flex-shrink-0" style={{ marginBottom: '4rem' }}>
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
        </div>

        {/* ── Card com scroll independente ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex-shrink-0"
          style={{
            maxWidth: 420,
            maxHeight: '100dvh',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
        >
          <div
            className="rounded-3xl px-6 py-6 md:px-8 md:py-7"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {/* Botão voltar */}
            <div className="mb-4">
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: '#64748B' }}
              >
                <ChevronLeft size={14} /> Voltar ao login
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={state.kind}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col items-center gap-4"
              >
                {/* Ícone */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: hasError
                      ? 'linear-gradient(135deg, #FEF2F2, #FEE2E2)'
                      : 'linear-gradient(135deg, #EBF5FB, #DBEAFE)',
                  }}
                >
                  {hasError
                    ? <AlertCircle size={32} style={{ color: '#EF4444' }} />
                    : <Mail size={32} style={{ color: '#2563EB' }} />
                  }
                </div>

                {/* Título e descrição */}
                <div className="text-center">
                  <h2 className="font-black mb-1.5" style={{ fontSize: '1.35rem', color: '#0F172A', letterSpacing: '-0.025em' }}>
                    {hasError ? 'Link inválido ou expirado' : 'Verifica o teu e-mail'}
                  </h2>

                  {hasError ? (
                    <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                      {(state as { kind: 'error'; message: string }).message}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm" style={{ color: '#64748B' }}>
                        Enviámos um link de verificação para
                      </p>
                      <p className="text-sm font-bold mt-0.5 break-all" style={{ color: '#0F172A' }}>
                        {email}
                      </p>
                    </>
                  )}
                </div>

                {/* Passos (apenas modo aguardar) */}
                {!hasError && (
                  <div
                    className="w-full rounded-2xl p-4"
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <p className="text-xs font-semibold mb-2.5 text-left" style={{ color: '#374151' }}>
                      Como verificar:
                    </p>
                    <ol className="space-y-2">
                      {[
                        'Abre o e-mail que enviámos.',
                        'Clica no botão "Verificar e-mail".',
                        'Serás redirecionado de volta.',
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: '#64748B' }}>
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-black text-[10px]"
                            style={{ background: '#1B5E3B', color: 'white' }}
                          >
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <p className="text-[11px] mt-3 text-left" style={{ color: '#94A3B8' }}>
                      Verifica também a pasta de spam. O link expira em 24 horas.
                    </p>
                  </div>
                )}

                {/* Feedback de reenvio — sucesso */}
                <AnimatePresence>
                  {resendSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl overflow-hidden"
                      style={{ background: '#F0FDF4' }}
                    >
                      <Check size={13} style={{ color: '#16A34A' }} className="flex-shrink-0" />
                      <p className="text-xs font-semibold" style={{ color: '#16A34A' }}>
                        {resendSuccess}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Feedback de reenvio — erro */}
                <AnimatePresence>
                  {resendError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl overflow-hidden"
                      style={{ background: '#FEF2F2' }}
                    >
                      <AlertCircle size={13} style={{ color: '#EF4444' }} className="flex-shrink-0" />
                      <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                        {resendError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botão de reenvio */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleResend}
                  disabled={resendLoading || resendCountdown > 0}
                  className="w-full py-3.5 rounded-xl text-white font-black text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                    boxShadow: '0 4px 18px rgba(15,76,42,0.35)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {resendLoading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <RefreshCw size={15} strokeWidth={2.2} />
                  }
                  {resendLoading
                    ? 'A reenviar…'
                    : resendCountdown > 0
                    ? `Reenviar novamente em ${resendCountdown}s`
                    : 'Reenviar e-mail de verificação'
                  }
                </motion.button>

                {/* Link para o login */}
                <div
                  className="flex items-center justify-center gap-1.5 w-full pt-1"
                  style={{ borderTop: '1px solid #F1F5F9' }}
                >
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    Já verificaste o e-mail?
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onBack}
                    className="text-xs font-black transition-opacity hover:opacity-75"
                    style={{ color: '#F4821F' }}
                  >
                    Fazer login →
                  </motion.button>
                </div>

              </motion.div>
            </AnimatePresence>


          </div>
        </motion.div>
      </div>
    </div>
  );
}
