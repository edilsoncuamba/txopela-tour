import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usersApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

interface ChangePasswordProps {
  onBack: () => void;
}

export default function ChangePassword({ onBack }: ChangePasswordProps) {
  useScrollTop();
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const [visibility, setVisibility] = useState({
    current: false,
    new:     false,
    confirm: false,
  });

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const toggle = (field: 'current' | 'new' | 'confirm') =>
    setVisibility(p => ({ ...p, [field]: !p[field] }));

  const handleSubmit = async () => {
    if (!form.currentPassword) { showToast('Insira a senha atual', false); return; }
    if (form.newPassword.length < 6) { showToast('A nova senha deve ter pelo menos 6 caracteres', false); return; }
    if (form.newPassword !== form.confirmPassword) { showToast('As senhas não coincidem', false); return; }

    setSaving(true);
    try {
      const res = await usersApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      if (res.error) {
        showToast(res.error, false);
      } else {
        showToast('Senha alterada com sucesso!', true);
        setTimeout(() => onBack(), 1500);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao alterar senha', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Campo de senha reutilizável (design translúcido) ──────────────────────
  const PasswordField = ({
    label, fieldKey, placeholder,
  }: {
    label: string;
    fieldKey: 'current' | 'new' | 'confirm';
    placeholder?: string;
  }) => {
    const valueKey = fieldKey === 'current' ? 'currentPassword' : fieldKey === 'new' ? 'newPassword' : 'confirmPassword';
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-left"
          style={{ color: 'rgba(255,255,255,0.85)' }}>
          {label}
        </label>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-white focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.2)]"
          style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}
        >
          <Lock size={15} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
          <input
            type={visibility[fieldKey] ? 'text' : 'password'}
            value={form[valueKey]}
            onChange={e => setForm(p => ({ ...p, [valueKey]: e.target.value }))}
            placeholder={placeholder}
            className="auth-input flex-1 text-sm focus:outline-none placeholder:text-white/40"
            style={{
              color: 'white',
              background: 'transparent',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              caretColor: 'white',
              colorScheme: 'dark' as any,
              border: 'none',
              outline: 'none',
            }}
          />
          <button type="button" onClick={() => toggle(fieldKey)}
            className="flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {visibility[fieldKey] ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: 'linear-gradient(135deg, #0a1f10 0%, #0d2b18 50%, #0a1a0e 100%)',
        fontFamily: 'Inter, Nunito, sans-serif',
      }}
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3"
            style={{
              background: toast.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
              border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              backdropFilter: 'blur(16px)',
              color: toast.ok ? '#4ADE80' : '#EF4444',
              minWidth: 300,
            }}>
            {toast.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-semibold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-5 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
            }}>
            <ArrowLeft size={20} color="white" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-left" style={{ color: 'white' }}>Alterar Senha</h1>
            <p className="text-sm text-left" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Defina uma nova senha para a sua conta
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Info header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(43,181,200,0.15)', border: '1px solid rgba(43,181,200,0.2)' }}>
              <Lock size={18} style={{ color: '#7DDCE8' }} />
            </div>
            <div>
              <p className="text-sm font-black text-left" style={{ color: 'white' }}>Segurança da conta</p>
              <p className="text-xs text-left" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Use uma senha forte com pelo menos 6 caracteres
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <PasswordField label="Senha Atual *"          fieldKey="current" />
            <PasswordField label="Nova Senha *"           fieldKey="new"     placeholder="Mín. 6 caracteres" />
            <PasswordField label="Confirmar Nova Senha *" fieldKey="confirm" />
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={onBack}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
              }}>
              Cancelar
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
              className="flex-[2] py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: saving ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #0F4C2A, #1B7A45)',
                boxShadow: saving ? 'none' : '0 4px 18px rgba(15,76,42,0.38)',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {saving ? 'Alterando...' : 'Confirmar Alteração'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
