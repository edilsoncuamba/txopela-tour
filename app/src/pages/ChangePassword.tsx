import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usersApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

const BRAND   = '#1B5E3B';
const BLUE    = '#0077B6';
const BG      = '#F5F5F0';
const WHITE   = '#FFFFFF';
const GRAY_50 = '#F8FAFC';
const GRAY_200= '#E5E7EB';
const GRAY_400= '#9CA3AF';
const GRAY_500= '#6B7280';
const GRAY_700= '#374151';
const GRAY_900= '#1A1A1A';

interface ChangePasswordProps {
  onBack: () => void;
}

export default function ChangePassword({
  onBack }: ChangePasswordProps) {
  useScrollTop();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [visibility, setVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const toggle = (field: 'current' | 'new' | 'confirm') =>
    setVisibility(p => ({ ...p, [field]: !p[field] }));

  const handleSubmit = async () => {
    if (!form.currentPassword) {
      showToast('Insira a senha atual', false);
      return;
    }
    if (form.newPassword.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres', false);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('As senhas não coincidem', false);
      return;
    }

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

  // ── campo de senha reutilizável ──────────────────────────────────────────────
  const PasswordField = ({
    label, fieldKey, placeholder,
  }: {
    label: string;
    fieldKey: 'current' | 'new' | 'confirm';
    placeholder?: string;
  }) => (
    <div>
      <label
        className="text-xs font-bold uppercase tracking-wide mb-2 block text-left"
        style={{ color: GRAY_500 }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={visibility[fieldKey] ? 'text' : 'password'}
          value={form[fieldKey === 'current' ? 'currentPassword' : fieldKey === 'new' ? 'newPassword' : 'confirmPassword']}
          onChange={e =>
            setForm(p => ({
              ...p,
              [fieldKey === 'current' ? 'currentPassword' : fieldKey === 'new' ? 'newPassword' : 'confirmPassword']:
                e.target.value,
            }))
          }
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 rounded-xl border outline-none text-sm"
          style={{ borderColor: GRAY_200, background: GRAY_50, fontFamily: 'Nunito, sans-serif' }}
          onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
          onBlur={e =>  { e.target.style.borderColor = GRAY_200; e.target.style.boxShadow = 'none'; }}
        />
        <button
          type="button"
          onClick={() => toggle(fieldKey)}
          className="absolute right-4 top-1/2 -translate-y-1/2"
          style={{ color: GRAY_400, background: 'none', border: 'none', cursor: 'pointer' }}>
          {visibility[fieldKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: 'Nunito, sans-serif' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3"
            style={{
              background: toast.ok ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${toast.ok ? '#D1FAE5' : '#FECACA'}`,
              color: toast.ok ? '#065F46' : '#991B1B',
              minWidth: 300,
            }}>
            {toast.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-semibold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: WHITE, border: `1px solid ${GRAY_200}`, cursor: 'pointer' }}>
            <ArrowLeft size={20} color={GRAY_700} />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-left" style={{ color: GRAY_900 }}>Alterar Senha</h1>
            <p className="text-sm text-left" style={{ color: GRAY_500 }}>Defina uma nova senha para a sua conta</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${GRAY_200}` }}>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: `${BLUE}12` }}>
              <Lock size={18} color={BLUE} />
            </div>
            <div>
              <p className="text-sm font-black text-left" style={{ color: GRAY_900 }}>Segurança da conta</p>
              <p className="text-xs text-left" style={{ color: GRAY_500 }}>Use uma senha forte com pelo menos 6 caracteres</p>
            </div>
          </div>

          <div className="space-y-5 mb-8">
            <PasswordField label="Senha Atual *" fieldKey="current" />
            <PasswordField label="Nova Senha *" fieldKey="new" placeholder="Mín. 6 caracteres" />
            <PasswordField label="Confirmar Nova Senha *" fieldKey="confirm" />
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={onBack}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ border: `1.5px solid ${GRAY_200}`, background: WHITE, color: GRAY_700, cursor: 'pointer' }}>
              Cancelar
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
              className="flex-[2] py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
              style={{
                background: saving ? GRAY_400 : `linear-gradient(135deg, ${BRAND}, #2BB5C8)`,
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
