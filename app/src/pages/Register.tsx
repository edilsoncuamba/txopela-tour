import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, Plane, Home as HomeIcon, Store, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { googleOAuth } from '@/services/oauth';
import { usersApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

interface RegisterProps {
  onRegister: () => void;
  onBack: () => void;
  onOTPRequired?: (email: string) => void;
}

// Slides de destinos moçambicanos para o fundo — herda o mesmo padrão do Login
const slides = [
  { image: '/images/provincias_profile/inhambane.jpeg', province: 'Inhambane', caption: 'Arquipélago do Bazaruto' },
  { image: '/images/provincias_profile/nampula.jpeg',   province: 'Nampula',   caption: 'Ilha de Moçambique'      },
  { image: '/images/provincias_profile/maputo_provicnia.jpeg', province: 'Maputo', caption: 'Ponta de Ouro'       },
  { image: '/images/provincias_profile/tete.jpg',       province: 'Tete',      caption: 'Cahora Bassa'            },
];

const profileTypes = [
  { id: 'traveler', label: 'Viajante',      desc: 'Exploro e descubro lugares', bg: '#EBF5FB', accent: '#2563EB' },
  { id: 'resident', label: 'Morador Local', desc: 'Sou residente local',        bg: '#EDFAF1', accent: '#059669' },
  { id: 'business', label: 'Negócio',       desc: 'Tenho um negócio local',     bg: '#FEF0E7', accent: '#EA580C' },
];

function ProfileIcon({ id, size = 20, color = '#1B5E3B' }: { id: string; size?: number; color?: string }) {
  const props = { size, color, strokeWidth: 1.8 };
  switch (id) {
    case 'traveler': return <Plane {...props} />;
    case 'resident': return <HomeIcon {...props} />;
    case 'business': return <Store {...props} />;
    default:         return <Plane {...props} />;
  }
}

function passStrength(p: string): number {
  let s = 0;
  if (p.length >= 8)          s++;
  if (/[A-Z]/.test(p))        s++;
  if (/[0-9]/.test(p))        s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function Register({ onRegister, onBack, onOTPRequired }: RegisterProps) {
  useScrollTop();
  const [step, setStep]           = useState<'form' | 'profile' | 'avatar'>('form');
  const [slide, setSlide]         = useState(0);
  const [formData, setFormData]   = useState<{ name: string; email: string; password: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Passo 1 — dados básicos
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [formError, setFormError] = useState('');

  // Passo 2 — tipo de perfil
  const [selected, setSelected]         = useState('traveler');
  const [terms, setTerms]               = useState(false);
  const [profileError, setProfileError] = useState('');

  // Passo 3 — foto de perfil
  const [avatarFile, setAvatarFile]         = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview]   = useState<string | null>(null);
  const [avatarError, setAvatarError]       = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { register } = useAuth();

  // Auto-rotate background slides
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setAvatarError('Seleciona uma imagem válida.');
    if (file.size > 5 * 1024 * 1024)    return setAvatarError('A imagem deve ter no máximo 5 MB.');
    setAvatarError('');
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFormNext = () => {
    setFormError('');
    if (!name.trim())            return setFormError('O nome é obrigatório.');
    if (!email.trim())           return setFormError('O e-mail é obrigatório.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return setFormError('Insere um e-mail válido.');
    if (password.length < 8)     return setFormError('A senha deve ter no mínimo 8 caracteres.');
    if (!/[A-Z]/.test(password)) return setFormError('A senha deve ter pelo menos 1 letra maiúscula.');
    if (!/[0-9]/.test(password)) return setFormError('A senha deve ter pelo menos 1 número.');
    if (password !== confirm)    return setFormError('As senhas não coincidem.');
    setFormData({ name, email, password });
    setStep('profile');
  };

  const handleProfileSubmit = () => {
    if (!terms)    return setProfileError('Aceita os Termos de Uso para continuar.');
    if (!formData) return;
    setStep('avatar');
  };

  const handleFinalSubmit = async (skipAvatar = false) => {
    if (!formData) return;
    setIsLoading(true);
    try {
      const roleMap: Record<string, string> = {
        traveler: 'tourist',
        resident: 'tourist',
        business: 'business',
      };
      const role = roleMap[selected] ?? 'tourist';
      const result = await register(formData.name, formData.email, formData.password, role);
      if (!result.ok) {
        setAvatarError(result.error ?? 'Erro ao criar conta. Tenta novamente.');
        return;
      }
      if (!skipAvatar && avatarFile) {
        try {
          setUploadingAvatar(true);
          const response = await usersApi.uploadAvatar(avatarFile);
          if (response.error) console.warn('[Register] Falha ao enviar avatar:', response.error);
        } catch (err) {
          console.error('[Register] Excepção ao enviar avatar:', err);
        } finally {
          setUploadingAvatar(false);
        }
      }
      if (onOTPRequired) onOTPRequired(formData.email);
      else onRegister();
    } catch {
      setAvatarError('Erro inesperado. Tenta novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = passStrength(password);
  const strengthColors = ['#E5E7EB', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'];
  const strengthLabels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  const current = slides[slide];

  return (
    <div
      className="h-screen w-full relative flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}
    >
      {/* ── FUNDO: slideshow de destinos — herda padrão do Login ──────────── */}
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

      {/* ── LOGO — herda padrão do Login ──────────────────────────────────── */}
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
            <p className="text-sm font-bold text-white text-left" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
              {current.caption}
            </p>
            <p className="text-xs font-medium text-left" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {current.province}, Moçambique
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── CONTEÚDO PRINCIPAL ────────────────────────────────────────────── */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-center justify-center lg:justify-between px-5 md:px-10 lg:px-16 xl:px-24 gap-8 lg:gap-12">

        {/* ── LADO ESQUERDO — copy (desktop) ────────────────────────────── */}
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
            {/* Botão Voltar — passos 2 e 3 */}
            {(step === 'profile' || step === 'avatar') && (
              <div className="mb-4">
                <button
                  onClick={() => setStep(step === 'avatar' ? 'profile' : 'form')}
                  className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
                  style={{ color: '#64748B' }}
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* ── PASSO 1: Dados básicos ─────────────────────────────────── */}
              {step === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="mb-4 text-center">
                    <h2
                      className="font-black mb-1"
                      style={{ fontSize: '1.4rem', color: '#0F172A', letterSpacing: '-0.025em' }}
                    >
                      Criar conta
                    </h2>
                  </div>

                  <div className="space-y-3">

                    {/* Nome completo */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-left" style={{ color: '#374151' }}>
                        Nome completo
                      </label>
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-[#1B5E3B] focus-within:shadow-[0_0_0_3px_rgba(27,94,59,0.1)]"
                        style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" className="flex-shrink-0">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <input
                          type="text"
                          placeholder="Ex: Carlos Machava"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="flex-1 text-sm bg-transparent focus:outline-none text-left"
                          style={{ color: '#0F172A' }}
                        />
                      </div>
                    </div>

                    {/* E-mail */}
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
                          placeholder="Mínimo 8 caracteres"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="flex-1 text-sm bg-transparent focus:outline-none"
                          style={{ color: '#0F172A' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="flex-shrink-0 transition-colors hover:text-slate-600"
                          style={{ color: '#94A3B8' }}
                        >
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {/* Indicador de força da senha */}
                      {password.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex gap-1 flex-1">
                            {[1, 2, 3, 4].map(i => (
                              <div
                                key={i}
                                className="h-1 flex-1 rounded-full transition-all"
                                style={{ background: i <= strength ? strengthColors[strength] : '#E2E8F0' }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-semibold" style={{ color: strengthColors[strength] }}>
                            {strengthLabels[strength]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Confirmar senha */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-left" style={{ color: '#374151' }}>
                        Confirmar senha
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
                          type={showConf ? 'text' : 'password'}
                          placeholder="Repete a senha"
                          value={confirm}
                          onChange={e => setConfirm(e.target.value)}
                          className="flex-1 text-sm bg-transparent focus:outline-none"
                          style={{ color: '#0F172A' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConf(!showConf)}
                          className="flex-shrink-0 transition-colors hover:text-slate-600"
                          style={{ color: '#94A3B8' }}
                        >
                          {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Erro */}
                  <AnimatePresence>
                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mt-2.5 overflow-hidden"
                        style={{ background: '#FEF2F2' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{formError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Botão Próximo */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFormNext}
                    className="w-full py-3.5 rounded-xl text-white font-black text-sm mt-3 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                      boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    Próximo
                  </motion.button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
                    <span className="text-[11px] font-medium" style={{ color: '#94A3B8' }}>ou regista-te com</span>
                    <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
                  </div>

                  {/* Google OAuth */}
                  <div className="flex gap-2.5 mb-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { const u = googleOAuth.getAuthUrl(); if (u) window.location.href = u; }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all hover:bg-slate-50 active:bg-slate-100"
                      style={{ background: 'white', borderColor: '#E2E8F0' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-xs font-semibold" style={{ color: '#374151' }}>Google</span>
                    </motion.button>
                  </div>

                  {/* Já tens conta? */}
                  <div
                    className="flex items-center justify-center gap-1.5 pt-3"
                    style={{ borderTop: '1px solid #F1F5F9' }}
                  >
                    <span className="text-xs" style={{ color: '#64748B' }}>Já tens conta?</span>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={onBack}
                      className="text-xs font-black transition-opacity hover:opacity-75"
                      style={{ color: '#F4821F' }}
                    >
                      Entrar →
                    </motion.button>
                  </div>

                  <p className="text-center text-[10px] mt-3 font-medium" style={{ color: '#CBD5E1' }}>
                    © 2026 Txopela Tour · Todos os direitos reservados
                  </p>
                </motion.div>
              )}

              {/* ── PASSO 2: Tipo de perfil ────────────────────────────────── */}
              {step === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="mb-4 text-center">
                    <h2
                      className="font-black mb-1"
                      style={{ fontSize: '1.4rem', color: '#0F172A', letterSpacing: '-0.025em' }}
                    >
                      Tipo de perfil
                    </h2>
                    <p className="text-sm" style={{ color: '#64748B' }}>
                      Escolhe o teu perfil para personalizar a experiência.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {profileTypes.map(pt => (
                      <motion.button
                        key={pt.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelected(pt.id)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all"
                        style={{
                          background: selected === pt.id ? pt.bg : 'white',
                          borderColor: selected === pt.id ? '#1B5E3B' : '#E2E8F0',
                          borderWidth: selected === pt.id ? 2 : 1,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: selected === pt.id ? 'white' : pt.bg }}
                        >
                          <ProfileIcon id={pt.id} size={20} color={selected === pt.id ? '#1B5E3B' : pt.accent} />
                        </div>
                        <p className="font-black text-xs" style={{ color: '#0F172A' }}>{pt.label}</p>
                        <p className="text-[10px]" style={{ color: '#64748B' }}>{pt.desc}</p>
                        {selected === pt.id && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: '#1B5E3B' }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="2">
                              <polyline points="1 4 3 6 7 2"/>
                            </svg>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Nota de segurança */}
                  <div
                    className="flex items-start gap-2.5 p-3 rounded-xl mb-3"
                    style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
                  >
                    <Shield size={14} color="#16A34A" strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: '#15803D' }}>
                      <span className="font-bold">Seguro.</span> Podes alterar o teu perfil nas definições a qualquer momento.
                    </p>
                  </div>

                  {/* Aceitar termos */}
                  <label
                    className="flex items-start gap-2.5 cursor-pointer mb-3 select-none"
                    onClick={() => setTerms(!terms)}
                  >
                    <div
                      className="w-[17px] h-[17px] rounded flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{
                        background: terms ? '#1B5E3B' : 'white',
                        border: `2px solid ${terms ? '#1B5E3B' : '#CBD5E1'}`,
                      }}
                    >
                      {terms && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="white" strokeWidth="2">
                          <polyline points="1 4.5 3.5 7 8 2"/>
                        </svg>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#374151' }}>
                      Aceito os{' '}
                      <span className="font-bold" style={{ color: '#2BB5C8' }}>Termos de Uso</span>
                      {' '}e a{' '}
                      <span className="font-bold" style={{ color: '#2BB5C8' }}>Política de Privacidade</span>
                    </p>
                  </label>

                  {/* Erro de perfil */}
                  <AnimatePresence>
                    {profileError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2 overflow-hidden"
                        style={{ background: '#FEF2F2' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{profileError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProfileSubmit}
                    className="w-full py-3.5 rounded-xl text-white font-black text-sm transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                      boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    Próximo
                  </motion.button>

                  <p className="text-center text-[10px] mt-3 font-medium" style={{ color: '#CBD5E1' }}>
                    © 2026 Txopela Tour · Todos os direitos reservados
                  </p>
                </motion.div>
              )}

              {/* ── PASSO 3: Foto de perfil ────────────────────────────────── */}
              {step === 'avatar' && (
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="mb-4 text-center">
                    <h2
                      className="font-black mb-1"
                      style={{ fontSize: '1.4rem', color: '#0F172A', letterSpacing: '-0.025em' }}
                    >
                      Foto de perfil
                    </h2>
                    <p className="text-sm" style={{ color: '#64748B' }}>
                      Opcional — podes adicionar mais tarde.
                    </p>
                  </div>

                  <div className="flex flex-col items-center mb-4">
                    <div className="relative mb-3">
                      <div
                        className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
                        style={{
                          background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #0F4C2A, #2BB5C8)',
                          border: '4px solid white',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        }}
                      >
                        {avatarPreview
                          ? <img src={avatarPreview} alt="Pré-visualização do avatar" className="w-full h-full object-cover" />
                          : (
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                              stroke="rgba(255,255,255,0.85)" strokeWidth="1.4">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                          )
                        }
                      </div>
                      <label
                        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        style={{ background: '#1B5E3B', boxShadow: '0 2px 10px rgba(27,94,59,0.45)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {avatarPreview ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
                        <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>Foto selecionada</span>
                        <button
                          onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                          className="text-xs underline"
                          style={{ color: '#64748B' }}
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-center" style={{ color: '#94A3B8' }}>
                        JPG, PNG ou WebP · máx. 5 MB
                      </p>
                    )}
                  </div>

                  {/* Erro de avatar */}
                  <AnimatePresence>
                    {avatarError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 overflow-hidden"
                        style={{ background: '#FEF2F2' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{avatarError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Botão Concluir */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFinalSubmit(false)}
                    disabled={isLoading || uploadingAvatar}
                    className="w-full py-3.5 rounded-xl text-white font-black text-sm transition-all disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                      boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {isLoading || uploadingAvatar ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        A criar conta...
                      </div>
                    ) : 'Concluir'}
                  </motion.button>

                  {/* Saltar */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleFinalSubmit(true)}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold mt-2 transition-all disabled:opacity-60"
                    style={{ color: '#64748B' }}
                  >
                    Saltar por agora
                  </motion.button>

                  <p className="text-center text-[10px] mt-3 font-medium" style={{ color: '#CBD5E1' }}>
                    © 2026 Txopela Tour · Todos os direitos reservados
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
