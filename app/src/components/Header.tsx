import { Bell, MessageCircle, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

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

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-blue-50 to-green-50 border-b border-white/50" />
      
      <div className="relative flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </motion.button>
          )}
          
          {title ? (
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          ) : (
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
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

        <div className="flex items-center gap-2">
          {showChat && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onChat}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <MessageCircle size={18} className="text-gray-700" />
            </motion.button>
          )}
          
          {showNotifications && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onNotifications}
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Bell size={18} className="text-gray-700" />
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
        </div>
      </div>
    </motion.header>
  );
}
