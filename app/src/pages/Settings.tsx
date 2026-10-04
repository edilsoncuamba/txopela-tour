import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, LogOut, ChevronRight, ChevronLeft, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useScrollTop } from '@/hooks/useScrollTop';

interface SettingsProps {
  onBack?: () => void;
  onLogout?: () => void;
  onViewProfile?: () => void;
  onEditProfile?: () => void;
  onNotifications?: () => void;
  onPrivacy?: () => void;
}

const typeLabels: Record<string, string> = {
  guide:    'Guia Turístico',
  traveler: 'Viajante',
  resident: 'Morador Local',
  business: 'Negócio',
};

export default function Settings({
  onBack, onLogout, onViewProfile, onEditProfile, onNotifications, onPrivacy,
}: SettingsProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleBack = () => onBack ? onBack() : navigate(-1);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout?.();
  };

  const items = [
    {
      icon: <User size={18} strokeWidth={2} />,
      label: 'Editar perfil',
      desc: 'Nome, foto e bio',
      color: '#3B82F6',
      bg: '#EFF6FF',
      colorDark: '#60A5FA',
      bgDark: 'rgba(59,130,246,0.15)',
      onClick: onEditProfile,
    },
    {
      icon: <Bell size={18} strokeWidth={2} />,
      label: 'Notificações',
      desc: 'Gerir alertas e avisos',
      color: '#F59E0B',
      bg: '#FFFBEB',
      colorDark: '#FCD34D',
      bgDark: 'rgba(252,211,77,0.12)',
      onClick: onNotifications,
    },
    {
      icon: <Shield size={18} strokeWidth={2} />,
      label: 'Privacidade',
      desc: 'Dados e segurança',
      color: '#10B981',
      bg: '#ECFDF5',
      colorDark: '#4ADE80',
      bgDark: 'rgba(74,222,128,0.12)',
      onClick: onPrivacy,
    },
  ];

  return (
    <div className="min-h-screen pb-24"
      style={{
        background: isDark ? '#0F1117' : '#F5F5F0',
        fontFamily: 'Nunito, sans-serif',
      }}>

      {/* ── Cabeçalho — mesmo padrão das Notificações ─────────────── */}
      <motion.div
        className="px-4 py-4 flex items-center justify-between border-b"
        style={{
          background: isDark ? '#1A1D27' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'transparent' }}
          >
            <ChevronLeft size={24} color={isDark ? '#A8B4CC' : '#1A1A1A'} strokeWidth={2.5} />
          </motion.button>
          <h1 className="text-xl font-bold" style={{ color: isDark ? '#F0F4FF' : '#111827' }}>
            Definições
          </h1>
        </div>
      </motion.div>

      <div className="px-4 pt-5 space-y-4 max-w-lg mx-auto">

        {/* ── Card de utilizador ─────────────────────────────────────── */}
        <motion.button
          onClick={onViewProfile}
          whileTap={{ scale: 0.98 }}
          className="w-full text-left rounded-2xl shadow-sm overflow-hidden"
          style={{
            background: isDark ? '#1A1D27' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6'}`,
          }}
        >
          {/* Faixa de cor no topo */}
          <div className="h-16 w-full"
            style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }} />

          <div className="px-4 pb-4 -mt-6">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
                style={{ border: `3px solid ${isDark ? '#1A1D27' : '#ffffff'}` }}>
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #2BB5C8, #1B5E3B)' }}>
                      <span className="text-xl font-black text-white">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>}
              </div>

              {/* Textos */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-base leading-tight"
                  style={{ color: isDark ? '#F0F4FF' : '#1A1A1A' }}>
                  {user?.name || 'Utilizador'}
                </p>
                {user?.type && (
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: isDark ? 'rgba(74,222,128,0.15)' : '#EEF7F0',
                      color: isDark ? '#4ADE80' : '#1B5E3B',
                    }}>
                    {typeLabels[user.type] || user.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.button>

        {/* ── Secção CONTA ──────────────────────────────────────────── */}
        <div>
          <div className="rounded-2xl shadow-sm overflow-hidden"
            style={{
              background: isDark ? '#1A1D27' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6'}`,
            }}>
            {items.map((item, i) => (
              <motion.button
                key={item.label}
                onClick={item.onClick}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{
                  borderBottom: i < items.length - 1
                    ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'}`
                    : 'none',
                }}
              >
                {/* Ícone */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isDark ? item.bgDark : item.bg,
                    color: isDark ? item.colorDark : item.color,
                  }}>
                  {item.icon}
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold"
                    style={{ color: isDark ? '#F0F4FF' : '#1A1A1A' }}>{item.label}</p>
                  <p className="text-xs"
                    style={{ color: isDark ? '#6B7A99' : '#9CA3AF' }}>{item.desc}</p>
                </div>

                <ChevronRight size={16} color={isDark ? '#3A4460' : '#D1D5DB'} strokeWidth={2} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Aparência — toggle dark mode ──────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider px-1 mb-2"
            style={{ color: isDark ? '#6B7A99' : '#9CA3AF' }}>
            Aparência
          </p>
          <div className="rounded-2xl shadow-sm overflow-hidden"
            style={{
              background: isDark ? '#1A1D27' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6'}`,
            }}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Ícone */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: isDark ? 'rgba(56,189,248,0.15)' : '#EFF6FF',
                  color: isDark ? '#38BDF8' : '#3B82F6',
                }}>
                {isDark ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold"
                  style={{ color: isDark ? '#F0F4FF' : '#1A1A1A' }}>
                  Modo escuro
                </p>
                <p className="text-xs"
                  style={{ color: isDark ? '#6B7A99' : '#9CA3AF' }}>
                  {isDark ? 'Activado' : 'Desactivado'}
                </p>
              </div>

              {/* Toggle switch */}
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.92 }}
                className="relative flex-shrink-0"
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  background: isDark
                    ? 'linear-gradient(135deg, #0077B6, #38BDF8)'
                    : '#E5E7EB',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease',
                }}
                aria-label={isDark ? 'Desactivar modo escuro' : 'Activar modo escuro'}
                role="switch"
                aria-checked={isDark}
              >
                <motion.span
                  animate={{ x: isDark ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDark
                    ? <Moon size={12} color="#0077B6" strokeWidth={2.5} />
                    : <Sun size={12} color="#F59E0B" strokeWidth={2.5} />}
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Botão Sair ────────────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
          style={{
            background: isDark ? 'rgba(248,113,113,0.1)' : '#FEF2F2',
            border: `1px solid ${isDark ? 'rgba(248,113,113,0.25)' : '#FECACA'}`,
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? 'rgba(248,113,113,0.15)' : '#FEE2E2' }}>
            <LogOut size={18} color="#DC2626" strokeWidth={2} />
          </div>
          <span className="flex-1 text-sm font-bold" style={{ color: '#DC2626' }}>Sair</span>
          <ChevronRight size={16} color={isDark ? 'rgba(248,113,113,0.4)' : '#FCA5A5'} strokeWidth={2} />
        </motion.button>
      </div>

      {/* ── Modal de confirmação ───────────────────────────────────── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-full rounded-t-3xl px-5 pt-4 pb-10"
              style={{
                maxWidth: 480,
                background: isDark ? '#1A1D27' : '#ffffff',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full"
                  style={{ background: isDark ? '#2A2F44' : '#E5E7EB' }} />
              </div>

              <div className="flex flex-col items-center text-center gap-3 pb-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(248,113,113,0.15)' : '#FEE2E2' }}>
                  <LogOut size={26} color="#DC2626" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-black"
                  style={{ color: isDark ? '#F0F4FF' : '#1A1A1A' }}>
                  Sair da conta?
                </h3>
                <p className="text-sm"
                  style={{ color: isDark ? '#6B7A99' : '#6B7280' }}>
                  Será redirecionado para a página de login.
                </p>
              </div>

              <div className="flex gap-3 mt-5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold"
                  style={{
                    background: isDark ? '#22263A' : '#F3F4F6',
                    color: isDark ? '#A8B4CC' : '#374151',
                  }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-2xl text-sm font-black text-white"
                  style={{ background: '#DC2626' }}
                >
                  Sair
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
