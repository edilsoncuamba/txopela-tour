import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';

export interface UserSummary {
  id: string;
  name: string;
  avatar?: string;
  type: string;
  location?: string;
  bio?: string;
}

interface UserListModalProps {
  title: string;
  users: UserSummary[];
  onClose: () => void;
  onUserPress: (user: UserSummary) => void;
}

const typeLabels: Record<string, string> = {
  guide: 'Guia Turístico',
  traveler: 'Viajante',
  resident: 'Morador Local',
  business: 'Negócio',
};

export default function UserListModal({ title, users, onClose, onUserPress }: UserListModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Sheet */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 pb-6">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p className="text-sm font-medium">Nenhum utilizador encontrado</p>
              </div>
            ) : (
              users.map((user, index) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => onUserPress(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center flex-shrink-0">
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      : <span className="text-lg font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{typeLabels[user.type] || user.type}</p>
                    {user.location && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-[#0077B6] flex-shrink-0" />
                        <span className="text-xs text-gray-400 truncate">{user.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-300 text-lg">›</div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
