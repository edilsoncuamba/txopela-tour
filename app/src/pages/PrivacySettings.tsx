import { motion } from 'framer-motion';
import { ChevronLeft, Lock, Eye, Trash2, Download, Shield, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useScrollTop } from '@/hooks/useScrollTop';

interface PrivacySettingsProps {
  onBack: () => void;
}

interface PrivacySetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  currentValue: string;
  options: string[];
}

export default function PrivacySettings({
  onBack }: PrivacySettingsProps) {
  useScrollTop();
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      id: 'profile',
      label: 'Visibilidade do Perfil',
      description: 'Quem pode ver seu perfil',
      icon: <Eye size={20} />,
      color: 'bg-blue-100 text-blue-600',
      currentValue: 'P�blico',
      options: ['P�blico', 'Amigos apenas', 'Privado'],
    },
    {
      id: 'posts',
      label: 'Visibilidade de Postagens',
      description: 'Quem pode ver suas postagens',
      icon: <Eye size={20} />,
      color: 'bg-green-100 text-green-600',
      currentValue: 'P�blico',
      options: ['P�blico', 'Amigos apenas', 'Privado'],
    },
    {
      id: 'messages',
      label: 'Mensagens Diretas',
      description: 'Quem pode te enviar mensagens',
      icon: <Lock size={20} />,
      color: 'bg-purple-100 text-purple-600',
      currentValue: 'Todos',
      options: ['Todos', 'Amigos apenas', 'Ningu�m'],
    },
  ]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);

  const handlePrivacyChange = (id: string, newValue: string) => {
    setPrivacySettings(
      privacySettings.map(s => s.id === id ? { ...s, currentValue: newValue } : s)
    );
    setExpandedSetting(null);
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
          <h1 className="text-xl font-bold text-gray-900">Privacidade</h1>
        </div>
      </motion.div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-4 flex gap-3"
        >
          <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Controle quem pode ver seu perfil, postagens e outras informa��es.
          </p>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2 bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          {privacySettings.map((setting, index) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <motion.button
                onClick={() => setExpandedSetting(expandedSetting === setting.id ? null : setting.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition"
                style={{ borderBottom: index < privacySettings.length - 1 ? '1px solid #f3f4f6' : 'none' }}
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

                {/* Current Value */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600">{setting.currentValue}</span>
                  <ChevronLeft
                    size={16}
                    className="text-gray-400"
                    style={{ transform: expandedSetting === setting.id ? 'rotate(-90deg)' : 'rotate(90deg)' }}
                  />
                </div>
              </motion.button>

              {/* Expanded Options */}
              {expandedSetting === setting.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4 space-y-2 bg-gray-50 border-t border-gray-200"
                >
                  {setting.options.map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePrivacyChange(setting.id, option)}
                      className={`w-full p-3 rounded-lg text-sm font-medium transition ${
                        setting.currentValue === option
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden p-4 space-y-3"
        >
          <h3 className="font-semibold text-gray-900">Gest�o de Dados</h3>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
          >
            <Download size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Descarregar meus dados</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition"
          >
            <Trash2 size={18} className="text-red-600" />
            <span className="text-sm font-medium text-red-600">Eliminar conta</span>
          </motion.button>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3"
        >
          <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700">
            Eliminar sua conta � permanente e n�o pode ser desfeito. Todos os seus dados ser�o apagados.
          </p>
        </motion.div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl"
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Eliminar conta?</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Esta a��o � permanente e n�o pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2 rounded-lg font-semibold bg-red-500 text-white"
                >
                  Eliminar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
