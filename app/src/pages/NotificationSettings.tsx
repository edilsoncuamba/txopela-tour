import { motion } from 'framer-motion';
import { ChevronLeft, Bell, MessageSquare, Heart, MapPin, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useScrollTop } from '@/hooks/useScrollTop';

interface NotificationSettingsProps {
  onBack: () => void;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
}

export default function NotificationSettings({
  onBack }: NotificationSettingsProps) {
  useScrollTop();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'messages',
      label: 'Mensagens',
      description: 'Notifica��es de novas mensagens',
      icon: <MessageSquare size={20} />,
      color: 'bg-blue-100 text-blue-600',
      enabled: true,
    },
    {
      id: 'likes',
      label: 'Likes e Coment�rios',
      description: 'Quando algu�m gosta ou comenta suas postagens',
      icon: <Heart size={20} />,
      color: 'bg-red-100 text-red-600',
      enabled: true,
    },
    {
      id: 'bookings',
      label: 'Reservas',
      description: 'Atualiza��es sobre suas reservas',
      icon: <MapPin size={20} />,
      color: 'bg-green-100 text-green-600',
      enabled: true,
    },
    {
      id: 'promotions',
      label: 'Promo��es',
      description: 'Ofertas e promo��es especiais',
      icon: <Bell size={20} />,
      color: 'bg-orange-100 text-orange-600',
      enabled: false,
    },
    {
      id: 'alerts',
      label: 'Alertas Importantes',
      description: 'Notifica��es de seguran�a e atualiza��es importantes',
      icon: <AlertCircle size={20} />,
      color: 'bg-purple-100 text-purple-600',
      enabled: true,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="flex items-center gap-4 p-4">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} color="#1A1A1A" strokeWidth={2.5} />
          </motion.button>
          <h1 className="text-xl font-bold text-gray-900">Notifica��es</h1>
        </div>
      </motion.div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-4"
        >
          <p className="text-sm text-blue-700">
            Gerencie as notifica��es que deseja receber. Voc� pode alternar cada tipo a qualquer momento.
          </p>
        </motion.div>

        {/* Settings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2 bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          {settings.map((setting, index) => (
            <motion.button
              key={setting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => toggleSetting(setting.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition"
              style={{ borderBottom: index < settings.length - 1 ? '1px solid #f3f4f6' : 'none' }}
            >
              {/* Icon */}
              <div className={`p-2 rounded-xl ${setting.color}`}>
                {setting.icon}
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">{setting.label}</h3>
                <p className="text-xs text-gray-500">{setting.description}</p>
              </div>

              {/* Toggle */}
              <motion.div
                animate={{ backgroundColor: setting.enabled ? '#3b82f6' : '#e5e7eb' }}
                className="w-12 h-6 rounded-full flex items-center p-1 cursor-pointer"
              >
                <motion.div
                  animate={{ x: setting.enabled ? 24 : 0 }}
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                />
              </motion.div>
            </motion.button>
          ))}
        </motion.div>

        {/* Save Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-4"
        >
          <p className="text-xs text-gray-500">As altera��es s�o guardadas automaticamente</p>
        </motion.div>
      </div>
    </div>
  );
}
