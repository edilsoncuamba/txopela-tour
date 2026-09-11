import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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
      onClick: onEditProfile,
    },
    {
      icon: <Bell size={18} strokeWidth={2} />,
      label: 'Notificações',
      desc: 'Gerir alertas e avisos',
      color: '#F59E0B',
      bg: '#FFFBEB',
      onClick: onNotifications,
    },
    {
      icon: <Shield size={18} strokeWidth={2} />,
      label: 'Privacidade',
      desc: 'Dados e segurança',
      color: '#10B981',
      bg: '#ECFDF5',
      onClick: onPrivacy,
    },
  ];

  return (
    <div className="min-h-screen pb-24"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── Cabeçalho — mesmo padrão das Notificações ─────────────── */}
      <motion.div
        className="px-4 py-4 flex items-center justify-between border-b border-gray-100 bg-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} color="#1A1A1A" strokeWidth={2.5} />
          </motion.button>
          <h1 className="text-xl font-bold text-gray-900">Definições</h1>
        </div>
      </motion.div>

      <div className="px-4 pt-5 space-y-4 max-w-lg mx-auto">

        {/* ── Card de utilizador ─────────────────────────────────────── */}
        <motion.button
          onClick={onViewProfile}
          whileTap={{ scale: 0.98 }}
          className="w-full text-left bg-white rounded-2xl shadow-sm overflow-hidden"
          style={{ border: '1px solid #F3F4F6' }}
        >
          {/* Faixa de cor no topo */}
          <div className="h-16 w-full"
            style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }} />

          <div className="px-4 pb-4 -mt-6">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
                style={{ border: '3px solid white' }}>
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
                <p className="font-black text-base leading-tight" style={{ color: '#1A1A1A' }}>
                  {user?.name || 'Utilizador'}
                </p>
                {user?.type && (
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                    {typeLabels[user.type] || user.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.button>

        {/* ── Secção CONTA ──────────────────────────────────────────── */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden"
            style={{ border: '1px solid #F3F4F6' }}>
            {items.map((item, i) => (
              <motion.button
                key={item.label}
                onClick={item.onClick}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                {/* Ícone */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.desc}</p>
                </div>

                <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Botão Sair ────────────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FEE2E2' }}>
            <LogOut size={18} color="#DC2626" strokeWidth={2} />
          </div>
          <span className="flex-1 text-sm font-bold" style={{ color: '#DC2626' }}>Sair</span>
          <ChevronRight size={16} color="#FCA5A5" strokeWidth={2} />
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
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-white rounded-t-3xl px-5 pt-4 pb-10"
              style={{ maxWidth: 480 }}
            >
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="flex flex-col items-center text-center gap-3 pb-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: '#FEE2E2' }}>
                  <LogOut size={26} color="#DC2626" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>Sair da conta?</h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Será redirecionado para a página de login.
                </p>
              </div>

              <div className="flex gap-3 mt-5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold"
                  style={{ background: '#F3F4F6', color: '#374151' }}
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
