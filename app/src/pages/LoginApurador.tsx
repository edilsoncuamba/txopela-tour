import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useScrollTop } from '@/hooks/useScrollTop';

interface LoginApuradorProps {
  /** Chamado após login bem-sucedido com role aprovador */
  onSuccess: () => void;
  /** Chamado se utilizador não tem role aprovador (nem admin) */
  onWrongRole: () => void;
}

const slides = [
  { image: '/images/local-2.jpg', caption: 'Ilha de Moçambique, Nampula' },
  { image: '/images/local-3.jpg', caption: 'Reserva do Niassa' },
  { image: '/images/local-5.jpg', caption: 'Vilankulo, Inhambane' },
];

export default function LoginApurador({
  onSuccess, onWrongRole }: LoginApuradorProps) {
  useScrollTop();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [slide, setSlide]         = useState(0);
  const { login } = useAuth();

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Insere o teu email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Email inválido.'); return; }
    if (!password) { setError('Insere a tua senha.'); return; }

    setIsLoading(true);
    try {
      // POST /api/auth/login/ — mesmo endpoint para todos os roles
      const result = await login(email.trim(), password);

      if (!result.ok) {
        setError(result.error ?? 'Credenciais inválidas.');
        return;
      }

      // O AuthContext actualiza user assincronamente — aguarda um tick
      await new Promise(r => setTimeout(r, 100));

    } catch {
      setError('Erro inesperado. Tenta novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const current = slides[slide];

  return (
    <div className="h-screen w-full relative flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'Inter, Nunito, sans-serif' }}>

      {/* Fundo */}
      <AnimatePresence mode="sync">
        <motion.img key={current.image} src={current.image} alt={current.caption}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }} />
      </AnimatePresence>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(105deg, rgba(10,35,20,0.88) 0%, rgba(10,35,20,0.65) 50%, rgba(5,25,15,0.50) 100%)',
      }} />

      {/* Logo */}
      <div className="absolute top-8 left-10 hidden md:flex items-center gap-2.5 z-20">
        <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.95)', padding: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <img src="/images/Logo2.png" alt="Txopela Tour" className="w-full h-full object-contain" />
        </div>
        <div>
          <span className="font-black text-[15px] text-white block"
            style={{ fontFamily: 'Pacifico, cursive', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            Txopela Tour
          </span>
        </div>
      </div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full" style={{ maxWidth: 420, padding: '0 20px' }}>

        <div className="rounded-3xl px-6 py-7"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(32px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)' }}>

          {/* Header */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}>
              <ClipboardCheck size={26} color="white" strokeWidth={2} />
            </div>
            <h2 className="font-black text-xl" style={{ color: '#0F172A', letterSpacing: '-0.025em' }}>
              Acesso Aprovador
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Email</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all focus-within:border-[#1B5E3B] focus-within:shadow-[0_0_0_3px_rgba(27,94,59,0.1)]"
                style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="M2 8l10 6 10-6"/>
                </svg>
                <input type="email" placeholder="aprovador@txopela.co.mz" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 text-sm bg-transparent focus:outline-none" style={{ color: '#0F172A' }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Senha</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all focus-within:border-[#1B5E3B] focus-within:shadow-[0_0_0_3px_rgba(27,94,59,0.1)]"
                style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2.5"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="flex-1 text-sm bg-transparent focus:outline-none" style={{ color: '#0F172A' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: '#94A3B8' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl overflow-hidden"
                  style={{ background: '#FEF2F2' }}>
                  <AlertTriangle size={13} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão */}
            <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl text-white font-black text-sm disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                boxShadow: '0 4px 18px rgba(15,76,42,0.38)' }}>
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A autenticar...
                </div>
              ) : 'Entrar'}
            </motion.button>
          </form>

          <p className="text-center text-[10px] mt-4 font-medium" style={{ color: '#CBD5E1' }}>
            © 2026 Txopela Tour
          </p>
        </div>
      </motion.div>
    </div>
  );
}
