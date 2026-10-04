import { Bell, MessageCircle, ChevronLeft, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotifications?: boolean;
  showChat?: boolean;
  onNotifications?: () => void;
  onChat?: () => void;
}

export default function Header({
  title,
  showBack = false,
  onBack,
  showNotifications = true,
  showChat = true,
  onNotifications,
  onChat,
}: HeaderProps) {
  const { unreadCount } = useApp();
  const { isDark, toggleTheme } = useTheme();

  const btnBg = isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6';
  const iconColor = isDark ? '#A8B4CC' : '#374151';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40"
      style={{ transition: 'background 0.3s ease' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'rgba(26,29,39,0.97)'
            : 'linear-gradient(to right, #e0f2fe, #eff6ff, #f0fdf4)',
          borderBottom: isDark
            ? '1px solid rgba(255,255,255,0.07)'
            : '1px solid rgba(255,255,255,0.5)',
          backdropFilter: isDark ? 'blur(20px)' : 'none',
        }}
      />

      <div className="relative flex items-center justify-between px-4 py-3.5">

        {/* ── Lado esquerdo: back / logo ── */}
        <div className="flex items-center gap-3">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ background: btnBg }}
            >
              <ChevronLeft size={20} style={{ color: iconColor }} />
            </motion.button>
          )}

          {title ? (
            <h1 className="text-lg font-bold" style={{ color: isDark ? '#F0F4FF' : '#111827' }}>
              {title}
            </h1>
          ) : (
            <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.02 }}>
              <img
                src="/images/Logo2.png"
                alt="Txopela Tour Logo"
                className="w-[40px] h-[40px] object-contain"
              />
              <span className="font-bold text-lg bg-gradient-to-r from-[#0077B6] to-[#2D6A4F] bg-clip-text text-transparent">
                TxopelaTour
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Lado direito: chat + notificações + toggle dark ── */}
        <div className="flex items-center gap-2">
          {showChat && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onChat}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ background: btnBg }}
            >
              <MessageCircle size={18} style={{ color: iconColor }} />
            </motion.button>
          )}

          {showNotifications && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onNotifications}
              className="relative w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ background: btnBg }}
            >
              <Bell size={18} style={{ color: iconColor }} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm"
                >
                  <span className="text-[10px] font-bold text-white px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </motion.span>
              )}
            </motion.button>
          )}

          {/* ── Toggle dark / light ── */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={toggleTheme}
            aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            aria-pressed={isDark}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            style={{
              background: isDark
                ? 'rgba(56,189,248,0.15)'
                : 'rgba(0,0,0,0.06)',
            }}
          >
            <AnimatedThemeIcon isDark={isDark} />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

// Ícone animado que troca entre lua e sol com rotação suave
function AnimatedThemeIcon({ isDark }: { isDark: boolean }) {
  return (
    <motion.span
      key={isDark ? 'moon' : 'sun'}
      initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
      animate={{ rotate: 0, opacity: 1, scale: 1 }}
      exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {isDark
        ? <Sun size={18} style={{ color: '#FCD34D' }} strokeWidth={2} />
        : <Moon size={18} style={{ color: '#374151' }} strokeWidth={2} />
      }
    </motion.span>
  );
}
