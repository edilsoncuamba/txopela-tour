import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { googleOAuth } from '@/services/oauth';
import { useAuth } from '@/context/AuthContext';
import { useScrollTop } from '@/hooks/useScrollTop';

interface LoginProps {
  onLogin: () => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

// Slides de destinos moçambicanos para o fundo
const slides = [
  {
    image: '/images/provincias_profile/inhambane.jpeg',
    province: 'Inhambane',
    caption: 'Arquipélago do Bazaruto',
  },
  {
    image: '/images/provincias_profile/nampula.jpeg',
    province: 'Nampula',
    caption: 'Ilha de Moçambique',
  },
  {
    image: '/images/provincias_profile/maputo_provicnia.jpeg',
    province: 'Maputo',
    caption: 'Ponta de Ouro',
  },
  {
    image: '/images/provincias_profile/tete.jpg',
    province: 'Tete',
    caption: 'Cahora Bassa',
  },
];

export default function Login({
  onLogin, onRegister, onForgotPassword }: LoginProps) {
  useScrollTop();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [slide, setSlide]         = useState(0);
  const { login } = useAuth();

  // Auto-rotate background slides
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação local antes de chamar o backend
    if (!email.trim()) {
      setError('Por favor, insere o teu email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor, insere um email válido.');
      return;
    }
    if (!password) {
      setError('Por favor, insere a tua senha.');
      return;
    }

    setIsLoading(true);
    try {
      // Delega toda a lógica ao AuthContext — que chama POST /api/auth/login
      const result = await login(email, password);

      if (result.ok) {
        onLogin();
      } else {
        setError(result.error ?? 'Credenciais inválidas. Tenta novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const current = slides[slide];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
    >
      {/* ── FUNDO: slideshow de destinos — troca sem efeito visível ────────── */}
      {slides.map((s, i) => (
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

      {/* Overlay multicamada */}
      <div className="fixed inset-0" style={{
        background: 'linear-gradient(105deg, rgba(5,30,15,0.82) 0%, rgba(5,30,15,0.60) 45%, rgba(5,20,10,0.45) 100%)',
      }} />
      {/* Vinheta nas bordas */}
      <div className="fixed inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
      }} />

      {/* ── LOGO ──────────────────────────────────────────────────────────── */}
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
        <div>
          <span className="font-black text-[15px] text-white leading-none block"
            style={{ fontFamily: 'Pacifico, cursive', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            Txopela Tour
          </span>
        </div>
      </div>



      {/* ── CONTEÚDO PRINCIPAL ────────────────────────────────────────────── */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-end lg:items-center justify-end lg:justify-between px-0 lg:px-16 xl:px-24 gap-0 lg:gap-12">

        {/* spacer — empurra o card para baixo no mobile */}
        <div className="flex-1 lg:hidden" style={{ minHeight: '4rem' }} />

        {/* ── LADO ESQUERDO — copy (desktop only) ───────────────────────────── */}
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

        {/* ── CARD DO FORMULÁRIO — scroll independente ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex-shrink-0 lg:max-w-[420px]"
          style={{
            maxHeight: '100dvh',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
        >
          <div
            className="rounded-t-3xl lg:rounded-3xl px-6 py-6 md:px-8 md:py-7"
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderBottom: 'none',
            }}
          >
            {/* Header */}
            <div className="mb-4 text-center">
              <h2
                className="font-black mb-1"
                style={{ fontSize: '1.4rem', color: 'white', letterSpacing: '-0.025em', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
              >
                Bem-vindo(a)!
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-left" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  E-mail
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-white focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.2)]"
                  style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" className="flex-shrink-0">
                    <rect x="2" y="4" width="20" height="16" rx="2.5"/>
                    <path d="M2 8l10 6 10-6"/>
                  </svg>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="login-input flex-1 text-sm focus:outline-none text-left placeholder:text-white/40"
                    style={{ color: 'white', background: 'transparent', backgroundColor: 'transparent', boxShadow: 'none', caretColor: 'white', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-left" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Senha
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-white focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.2)]"
                  style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" className="flex-shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2.5"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="login-input flex-1 text-sm focus:outline-none placeholder:text-white/40"
                    style={{ color: 'white', background: 'transparent', backgroundColor: 'transparent', boxShadow: 'none', caretColor: 'white', colorScheme: 'dark' }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="flex-shrink-0 transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#7DDCE8' }}
                >
                  Esqueci a senha
                </button>
              </div>

              {/* Erro */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl overflow-hidden"
                    style={{ background: '#FEF2F2' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão Entrar */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl text-white font-black text-sm disabled:opacity-60 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                  boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
                  letterSpacing: '0.01em',
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : 'Entrar'}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>ou continua com</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Social */}
            <div className="flex gap-2.5 mb-3">
              {[
                {
                  label: 'Google',
                  onClick: () => { const u = googleOAuth.getAuthUrl(); if (u) window.location.href = u; },
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  ),
                },
              ].map(s => (
                <motion.button
                  key={s.label}
                  whileTap={{ scale: 0.96 }}
                  onClick={s.onClick}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  {s.icon}
                  <span className="text-xs font-semibold" style={{ color: 'white' }}>{s.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Criar conta */}
            <div
              className="flex items-center justify-center gap-1.5 pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
            >
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Ainda não tens conta?</span>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onRegister}
                className="text-xs font-black transition-opacity hover:opacity-75"
                style={{ color: '#F4821F' }}
              >
                Criar conta →
              </motion.button>
            </div>


          </div>
        </motion.div>
      </div>
    </div>
  );
}
