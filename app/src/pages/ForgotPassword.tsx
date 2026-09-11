import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, ChevronLeft, CheckCircle, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useScrollTop } from '@/hooks/useScrollTop';

interface ForgotPasswordProps {
  onBack: () => void;
}

// Slides de destinos mo�ambicanos para o fundo
const slides = [
  {
    image: '/images/provincias_profile/inhambane.jpeg',
    province: 'Inhambane',
    caption: 'Arquip�lago do Bazaruto',
  },
  {
    image: '/images/provincias_profile/nampula.jpeg',
    province: 'Nampula',
    caption: 'Ilha de Mo�ambique',
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

type PasswordRecoveryStep = 'email' | 'code' | 'reset' | 'success';

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1">
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
    </div>
  );
}

export default function ForgotPassword({
  onBack }: ForgotPasswordProps) {
  useScrollTop();
  const [step, setStep] = useState<PasswordRecoveryStep>('email');
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-rotate background slides
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email � obrigat�rio');
      return;
    }

    setIsLoading(true);
    try {
      // Simular chamada � API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('code');
    } catch (err) {
      setError('Erro ao enviar email. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('C�digo � obrigat�rio');
      return;
    }

    setIsLoading(true);
    try {
      // Simular chamada � API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('reset');
    } catch (err) {
      setError('C�digo inv�lido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Senha deve ter no m�nimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Senhas n�o conferem');
      return;
    }

    setIsLoading(true);
    try {
      // Simular chamada � API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('success');
    } catch (err) {
      setError('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'email') {
      onBack();
    } else if (step === 'code') {
      setStep('email');
    } else if (step === 'reset') {
      setStep('code');
    }
  };

  const current = slides[slide];
  // Tela de sucesso
  if (step === 'success') {
    return (
      <div
        className="h-screen w-full relative flex items-center justify-center overflow-hidden"
        style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
      >
        {/* Background slideshow */}
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

        {/* Overlays */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(105deg, rgba(5,30,15,0.82) 0%, rgba(5,30,15,0.60) 45%, rgba(5,20,10,0.45) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }} />

        {/* Success content */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md mx-5"
        >
          <div
            className="rounded-3xl px-6 py-6 text-center"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}
            >
              <CheckCircle size={40} className="text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-black mb-3"
              style={{ color: '#0F172A', letterSpacing: '-0.025em' }}
            >
              Senha redefinida!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm mb-8"
              style={{ color: '#64748B', lineHeight: 1.5 }}
            >
              Sua senha foi redefinida com sucesso. Voc� pode fazer login com sua nova senha.
            </motion.p>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              className="w-full py-3.5 rounded-xl text-white font-black text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
                letterSpacing: '0.01em',
              }}
            >
              Voltar para o login
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }
  return (
    <div
      className="h-screen w-full relative flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
    >
      {/* Background slideshow */}
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

      {/* Overlays */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(105deg, rgba(5,30,15,0.82) 0%, rgba(5,30,15,0.60) 45%, rgba(5,20,10,0.45) 100%)',
      }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
      }} />

      {/* Logo */}
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
        <span className="font-black text-[15px] text-white leading-none block"
          style={{ fontFamily: 'Pacifico, cursive', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
          Txopela Tour
        </span>
      </div>

      {/* Slide indicators */}
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
              {current.province}, Mo�ambique
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Conte�do principal */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-center justify-center lg:justify-between px-5 md:px-10 lg:px-16 xl:px-24 gap-8 lg:gap-12">

        {/* Lado esquerdo - copy (desktop only) */}
        <div className="hidden lg:flex flex-col max-w-sm xl:max-w-md flex-shrink-0" style={{ marginBottom: '4rem' }}>
          <h1 className="font-black leading-[1.05]"
            style={{ fontSize: 'clamp(2.4rem, 3.5vw, 3.2rem)', color: 'white',
              letterSpacing: '-0.03em', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Explore o melhor<br />
            <span style={{ background: 'linear-gradient(90deg, #2BB5C8, #43E8A0)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              de Mo�ambique.
            </span>
          </h1>
        </div>

        {/* Card do formul�rio */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex-shrink-0"
          style={{ maxWidth: 420 }}
        >
          <div
            className="rounded-3xl px-6 py-4 md:px-8 md:py-5"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {/* Back button */}
            {step !== 'email' && (
              <div className="mb-4">
                <button onClick={handleBack}
                  className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#64748B' }}>
                  <ChevronLeft size={14} /> Voltar
                </button>
              </div>
            )}

            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: '#374151' }}>
                  Etapa {step === 'email' ? 1 : step === 'code' ? 2 : 3} de 3
                </span>
                <span className="text-xs font-semibold" style={{ color: '#1B5E3B' }}>
                  {step === 'email' ? '33%' : step === 'code' ? '66%' : '100%'}
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #1B5E3B, #22C55E)' }}
                  initial={{ width: '33%' }}
                  animate={{ width: step === 'email' ? '33%' : step === 'code' ? '66%' : '100%' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Email */}
              {step === 'email' && (
                <motion.div key="email"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                  
                  {/* Header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}>
                        <Mail size={13} color="white" strokeWidth={2.2} />
                      </div>
                      <h2 className="font-black" style={{ fontSize: '1.35rem', color: '#0F172A', letterSpacing: '-0.025em' }}>
                        Esqueceu sua senha?
                      </h2>
                    </div>

                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-left" style={{ color: '#374151' }}>
                        E-mail
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-[#1B5E3B] focus-within:shadow-[0_0_0_3px_rgba(27,94,59,0.1)]"
                        style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                        <Mail size={15} color="#94A3B8" strokeWidth={1.8} className="flex-shrink-0" />
                        <input
                          type="email"
                          placeholder="exemplo@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex-1 text-sm bg-transparent focus:outline-none"
                          style={{ color: '#0F172A' }}
                          required
                        />
                      </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl overflow-hidden"
                          style={{ background: '#FEF2F2' }}>
                          <AlertCircle size={13} color="#EF4444" strokeWidth={2.2} />
                          <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <motion.button 
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }} 
                      className="w-full py-3.5 rounded-xl text-white font-black text-sm mt-4 transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                        boxShadow: '0 4px 18px rgba(15,76,42,0.38)', letterSpacing: '0.01em' }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingDots />
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Enviar c�digo</span>
                          <ArrowRight size={16} />
                        </div>
                      )}
                    </motion.button>
                  </form>

                  {/* Footer */}
                  <div className="flex items-center justify-center gap-1.5 pt-4 mt-4" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <span className="text-xs" style={{ color: '#64748B' }}>Lembrou da senha?</span>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={onBack}
                      className="text-xs font-black transition-opacity hover:opacity-75" style={{ color: '#F4821F' }}>
                      Fazer login ?
                    </motion.button>
                  </div>
                </motion.div>
              )}
              {/* Step 2: Code */}
              {step === 'code' && (
                <motion.div key="code"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                  
                  {/* Header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}>
                        <Mail size={13} color="white" strokeWidth={2.2} />
                      </div>
                      <h2 className="font-black" style={{ fontSize: '1.35rem', color: '#0F172A', letterSpacing: '-0.025em' }}>
                        Confirme seu email
                      </h2>
                    </div>
                    <p className="text-sm" style={{ color: '#64748B', lineHeight: 1.5 }}>
                      Enviamos um c�digo para <span className="font-bold" style={{ color: '#0F172A' }}>{email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleCodeSubmit} className="space-y-3">
                    {/* C�digo */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-left" style={{ color: '#374151' }}>
                        C�digo de confirma��o
                      </label>
                      <input
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:border-[#1B5E3B] focus:shadow-[0_0_0_3px_rgba(27,94,59,0.1)] text-center text-2xl tracking-widest font-semibold"
                        style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A' }}
                        required
                      />
                      <p className="text-xs text-center mt-2" style={{ color: '#94A3B8' }}>
                        Verifique seu email (spam tamb�m)
                      </p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl overflow-hidden"
                          style={{ background: '#FEF2F2' }}>
                          <AlertCircle size={13} color="#EF4444" strokeWidth={2.2} />
                          <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <motion.button 
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }} 
                      className="w-full py-3.5 rounded-xl text-white font-black text-sm mt-4 transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                        boxShadow: '0 4px 18px rgba(15,76,42,0.38)', letterSpacing: '0.01em' }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingDots />
                          <span>Verificando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Confirmar c�digo</span>
                          <ArrowRight size={16} />
                        </div>
                      )}
                    </motion.button>

                    {/* Reenviar */}
                    <button type="button" onClick={() => setStep('email')} 
                      className="w-full text-sm font-semibold transition-opacity hover:opacity-70 mt-3"
                      style={{ color: '#2BB5C8' }}>
                      N�o recebeu? Enviar novamente
                    </button>
                  </form>
                </motion.div>
              )}
              {/* Step 3: Reset Password */}
              {step === 'reset' && (
                <motion.div key="reset"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                  
                  {/* Header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}>
                        <Lock size={13} color="white" strokeWidth={2.2} />
                      </div>
                      <h2 className="font-black" style={{ fontSize: '1.35rem', color: '#0F172A', letterSpacing: '-0.025em' }}>
                        Nova senha
                      </h2>
                    </div>
                    <p className="text-sm" style={{ color: '#64748B', lineHeight: 1.5 }}>
                      Escolha uma senha segura com no m�nimo 8 caracteres.
                    </p>
                  </div>

                  <form onSubmit={handleResetSubmit} className="space-y-3">
                    {/* Nova senha */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-left" style={{ color: '#374151' }}>
                        Nova senha
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-[#1B5E3B] focus-within:shadow-[0_0_0_3px_rgba(27,94,59,0.1)]"
                        style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                        <Lock size={15} color="#94A3B8" strokeWidth={1.8} className="flex-shrink-0" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="M�nimo 8 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="flex-1 text-sm bg-transparent focus:outline-none"
                          style={{ color: '#0F172A' }}
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="flex-shrink-0 transition-colors hover:text-slate-600" style={{ color: '#94A3B8' }}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirmar senha */}
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-left" style={{ color: '#374151' }}>
                        Confirmar senha
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-[#1B5E3B] focus-within:shadow-[0_0_0_3px_rgba(27,94,59,0.1)]"
                        style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                        <Lock size={15} color="#94A3B8" strokeWidth={1.8} className="flex-shrink-0" />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repete a senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="flex-1 text-sm bg-transparent focus:outline-none"
                          style={{ color: '#0F172A' }}
                          required
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="flex-shrink-0 transition-colors hover:text-slate-600" style={{ color: '#94A3B8' }}>
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl overflow-hidden"
                          style={{ background: '#FEF2F2' }}>
                          <AlertCircle size={13} color="#EF4444" strokeWidth={2.2} />
                          <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <motion.button 
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }} 
                      className="w-full py-3.5 rounded-xl text-white font-black text-sm mt-4 transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                        boxShadow: '0 4px 18px rgba(15,76,42,0.38)', letterSpacing: '0.01em' }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingDots />
                          <span>Redefinindo...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle size={16} />
                          <span>Redefinir senha</span>
                        </div>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Copyright */}
            <p className="text-center text-[10px] mt-4 font-medium" style={{ color: '#CBD5E1' }}>
              � 2026 Txopela Tour � Todos os direitos reservados
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}