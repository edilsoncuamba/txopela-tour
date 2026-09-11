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
  const [remember, setRemember]   = useState(true);
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
      className="h-screen w-full relative flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
    >
      {/* ── FUNDO: slideshow de destinos ──────────────────────────────────── */}
      <AnimatePresence mode="sync">
        <motion.img
          key={current.image}
          src={current.image}
          alt={current.caption}
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Overlay multicamada */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(105deg, rgba(5,30,15,0.82) 0%, rgba(5,30,15,0.60) 45%, rgba(5,20,10,0.45) 100%)',
      }} />
      {/* Vinheta nas bordas */}
      <div className="absolute inset-0" style={{
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

      {/* ── SLIDE INDICATOR — canto inferior esquerdo ─────────────────────── */}
      <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20">
        <div className="flex items-center gap-2 mb-2 justify-start">
          {slides.map((_, i) => (
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
            <p className="text-sm font-bold text-white text-left" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>{current.caption}</p>
            <p className="text-xs font-medium text-left" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {current.province}, Moçambique
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── CONTEÚDO PRINCIPAL ────────────────────────────────────────────── */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-center justify-center lg:justify-between px-5 md:px-10 lg:px-16 xl:px-24 gap-8 lg:gap-12">

        {/* ── LADO ESQUERDO — copy ──────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col max-w-sm xl:max-w-md flex-shrink-0" style={{ marginBottom: '4rem' }}>

          {/* Headline principal */}
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

        {/* ── CARD DO FORMULÁRIO ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex-shrink-0"
          style={{ maxWidth: 420 }}
        >
          <div
            className="rounded-3xl px-6 py-6 md:px-8 md:py-7"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {/* Header */}
            <div className="mb-4 text-center">
              <h2
                className="font-black mb-1"
                style={{ fontSize: '1.4rem', color: '#0F172A', letterSpacing: '-0.025em' }}
              >
                Bem-vindo(a)!
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-left" style={{ color: '#374151' }}>
                  E-mail
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-[#1B5E3B] focus-within:shadow-[0_0_0_3px_rgba(27,94,59,0.1)]"
                  style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" className="flex-shrink-0">
                    <rect x="2" y="4" width="20" height="16" rx="2.5"/>
                    <path d="M2 8l10 6 10-6"/>
                  </svg>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 text-sm bg-transparent focus:outline-none text-left"
                    style={{ color: '#0F172A' }}
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-left" style={{ color: '#374151' }}>
                  Senha
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-[#1B5E3B] focus-within:shadow-[0_0_0_3px_rgba(27,94,59,0.1)]"
                  style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" className="flex-shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2.5"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="flex-1 text-sm bg-transparent focus:outline-none"
                    style={{ color: '#0F172A' }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="flex-shrink-0 transition-colors hover:text-slate-600" style={{ color: '#94A3B8' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setRemember(!remember)}>
                  <div
                    className="flex items-center justify-center rounded transition-all duration-150 flex-shrink-0"
                    style={{
                      width: 17, height: 17,
                      background: remember ? '#1B5E3B' : 'white',
                      border: `2px solid ${remember ? '#1B5E3B' : '#CBD5E1'}`,
                    }}
                  >
                    {remember && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="white" strokeWidth="2">
                        <polyline points="1 4.5 3.5 7 8 2"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: '#374151' }}>Lembrar-me</span>
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#2BB5C8' }}
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
                    A entrar...
                  </div>
                ) : 'Entrar'}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
              <span className="text-[11px] font-medium" style={{ color: '#94A3B8' }}>ou continua com</span>
              <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all hover:bg-slate-50 active:bg-slate-100"
                  style={{ background: 'white', borderColor: '#E2E8F0' }}
                >
                  {s.icon}
                  <span className="text-xs font-semibold" style={{ color: '#374151' }}>{s.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Criar conta */}
            <div
              className="flex items-center justify-center gap-1.5 pt-3"
              style={{ borderTop: '1px solid #F1F5F9' }}
            >
              <span className="text-xs" style={{ color: '#64748B' }}>Ainda não tens conta?</span>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onRegister}
                className="text-xs font-black transition-opacity hover:opacity-75"
                style={{ color: '#F4821F' }}
              >
                Criar conta →
              </motion.button>
            </div>

            {/* Copyright — dentro do card */}
            <p className="text-center text-[10px] mt-3 font-medium" style={{ color: '#CBD5E1' }}>
              © 2026 Txopela Tour · Todos os direitos reservados
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
