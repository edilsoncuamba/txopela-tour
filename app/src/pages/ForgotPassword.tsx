/**
 * ForgotPassword.tsx
 *
 * Fluxo real conforme OpenAPI v2.1.0 — dois passos:
 *
 *  Passo 1 — "email":
 *    POST /api/auth/request-password-reset/ { email }
 *    A API retorna sempre 200, mesmo que o e-mail não exista (segurança).
 *
 *  Passo 2 — "reset" (activado pelo link no e-mail):
 *    POST /api/auth/reset-password/ { token, password, password_confirm }
 *    Token válido por 1 hora. Após reset bem-sucedido, redireciona para login.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, ArrowRight, CheckCircle,
  Lock, AlertCircle, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { authApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';
import AuthPageLayout from '@/components/shared/AuthPageLayout';
import {
  AuthField, AuthErrorMessage,
  AUTH_CARD_ROUNDED_TOP,
  IconEmail, IconLock,
} from '@/components/shared/AuthFieldWrapper';

interface ForgotPasswordProps {
  onBack: () => void;
}

type Step = 'email' | 'email_sent' | 'reset' | 'success';

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

function passStrength(p: string): number {
  let s = 0;
  if (p.length >= 8)          s++;
  if (/[A-Z]/.test(p))        s++;
  if (/[0-9]/.test(p))        s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const strengthColors = ['#E5E7EB', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'];
const strengthLabels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

// ── Estilo do card ────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.18)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  boxShadow: '0 -8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderBottom: 'none',
};

// ── Componente ────────────────────────────────────────────────────────────────
export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  useScrollTop();

  const [step,      setStep]      = useState<Step>(() => readTokenFromUrl() ? 'reset' : 'email');
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');

  // Passo 1
  const [email, setEmail] = useState('');

  // Passo 2
  const [token,           setToken]           = useState(() => readTokenFromUrl() ?? '');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  // ── Passo 1: solicitar reset ───────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed) { setError('O e-mail é obrigatório.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setError('Insere um e-mail válido.'); return; }

    setIsLoading(true);
    const res = await authApi.requestPasswordReset({ email: trimmed });
    setIsLoading(false);

    if (res.data || !res.error) {
      setStep('email_sent');
    } else {
      setError(res.error ?? 'Erro ao enviar o pedido. Tenta novamente.');
    }
  };

  // ── Passo 2: redefinir senha ───────────────────────────────────────────────
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token)              { setError('Token de recuperação em falta. Usa o link recebido no e-mail.'); return; }
    if (password.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }

    setIsLoading(true);
    const res = await authApi.resetPassword({ token, password, password_confirm: confirmPassword });
    setIsLoading(false);

    if (res.data?.success) {
      setStep('success');
    } else {
      const msg = res.error || (res.data ? res.data.message : '') || 'Token inválido ou expirado. Solicita um novo link.';
      setError(msg);
    }
  };

  const strength = passStrength(password);

  // ── Sucesso ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <AuthPageLayout centeredCard>
        <div
          className="rounded-3xl px-6 py-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
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
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-2xl font-black mb-3" style={{ color: 'white', letterSpacing: '-0.025em' }}
          >
            Senha redefinida!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-sm mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            A tua senha foi redefinida com sucesso. Podes fazer login com a nova senha.
          </motion.p>

          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="w-full py-3.5 rounded-xl text-white font-black text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
              boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
              letterSpacing: '0.01em',
            }}
          >
            Fazer login
          </motion.button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>

      {/* Card */}
      <div className="rounded-t-3xl lg:rounded-3xl px-6 py-6 md:px-8 md:py-7" style={CARD}>
        <AnimatePresence mode="wait">

          {/* ── Passo 1: E-mail ───────────────────────────────────────────── */}
          {step === 'email' && (
            <motion.div key="email"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}>
                    <Mail size={13} color="white" strokeWidth={2.2} />
                  </div>
                  <h2 className="font-black" style={{ fontSize: '1.35rem', color: 'white', letterSpacing: '-0.025em', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
                    Esqueceu a senha?
                  </h2>
                </div>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                  Insere o teu e-mail e enviamos um link para redefinires a senha.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <AuthField
                  label="E-mail"
                  icon={<IconEmail />}
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <AnimatePresence>
                  {error && (
                    <motion.div key="err"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      <AuthErrorMessage message={error} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl text-white font-black text-sm mt-2 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)', boxShadow: '0 4px 18px rgba(15,76,42,0.38)', letterSpacing: '0.01em' }}>
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {isLoading ? 'A enviar…' : 'Enviar link de recuperação'}
                </motion.button>
              </form>

              <div className="flex items-center justify-center gap-1.5 pt-4 mt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Lembrou da senha?</span>
                <motion.button whileTap={{ scale: 0.97 }} onClick={onBack}
                  className="text-xs font-black transition-opacity hover:opacity-75"
                  style={{ color: '#F4821F' }}>
                  Fazer login →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Passo 1b: Link enviado ────────────────────────────────────── */}
          {step === 'email_sent' && (
            <motion.div key="email_sent"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col items-center text-center gap-4 py-2"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
                <Mail size={30} style={{ color: '#60A5FA' }} />
              </div>
              <h2 className="font-black text-xl" style={{ color: 'white', letterSpacing: '-0.025em' }}>
                Verifica o teu e-mail
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Se <span className="font-bold text-white">{email}</span> estiver registado, receberás um link para redefinires a senha nos próximos minutos.
              </p>

              <div className="w-full rounded-2xl p-4 text-left"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>O que fazer a seguir:</p>
                <ol className="space-y-2">
                  {[
                    'Abre o e-mail de recuperação que enviámos.',
                    'Clica no botão "Redefinir senha".',
                    'Escolhe uma nova senha segura.',
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-black text-[10px]"
                        style={{ background: '#1B5E3B', color: 'white' }}>{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <p className="text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Verifica também a pasta de spam. O link expira em 1 hora.
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 w-full pt-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Não recebeste o e-mail?</span>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setStep('email'); setError(''); }}
                  className="text-xs font-black transition-opacity hover:opacity-75"
                  style={{ color: '#7DDCE8' }}>
                  Tentar novamente
                </motion.button>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={onBack}
                className="w-full py-3 rounded-xl text-sm font-black transition-all"
                style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                Voltar ao login
              </motion.button>
            </motion.div>
          )}

          {/* ── Passo 2: Nova senha (token na URL) ───────────────────────── */}
          {step === 'reset' && (
            <motion.div key="reset"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}>
                    <Lock size={13} color="white" strokeWidth={2.2} />
                  </div>
                  <h2 className="font-black" style={{ fontSize: '1.35rem', color: 'white', letterSpacing: '-0.025em', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
                    Nova senha
                  </h2>
                </div>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                  Escolhe uma senha segura com no mínimo 8 caracteres.
                </p>
              </div>

              {/* Alerta: token em falta */}
              {!token && (
                <div className="flex items-start gap-2 px-3 py-3 rounded-xl mb-4"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle size={14} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                    Token de recuperação não encontrado. Usa o link recebido por e-mail.
                  </p>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-3">
                {/* Nova senha */}
                <AuthField
                  label="Nova senha"
                  icon={<IconLock />}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  required
                  extra={
                    password.length > 0 ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all"
                              style={{ background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.15)' }} />
                          ))}
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: strengthColors[strength] }}>
                          {strengthLabels[strength]}
                        </span>
                      </div>
                    ) : undefined
                  }
                />

                {/* Confirmar senha */}
                <AuthField
                  label="Confirmar senha"
                  icon={<IconLock />}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repete a senha"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  showPassword={showConfirm}
                  onTogglePassword={() => setShowConfirm(!showConfirm)}
                  required
                  invalid={!!(confirmPassword && password !== confirmPassword)}
                  error={confirmPassword && password !== confirmPassword ? 'As senhas não coincidem.' : undefined}
                />

                <AnimatePresence>
                  {error && (
                    <motion.div key="err"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      <AuthErrorMessage message={error} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={isLoading || !token} whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl text-white font-black text-sm mt-2 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)', boxShadow: '0 4px 18px rgba(15,76,42,0.38)', letterSpacing: '0.01em' }}>
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {isLoading ? 'A redefinir…' : 'Redefinir senha'}
                </motion.button>
              </form>

              <div className="flex items-center justify-center gap-1.5 pt-4 mt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Link expirado?</span>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setStep('email'); setToken(''); setError(''); setPassword(''); setConfirmPassword(''); }}
                  className="text-xs font-black transition-opacity hover:opacity-75"
                  style={{ color: '#7DDCE8' }}>
                  Solicitar novo link
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>


      </div>
    </AuthPageLayout>
  );
}
