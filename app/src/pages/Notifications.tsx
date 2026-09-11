import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Calendar, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import { notificationsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'booking' | 'approval' | 'share';
  title?: string;
  message: string;
  user: { name: string; avatar?: string };
  read: boolean;
  createdAt: string;
}

interface NotificationsProps {
  onNotifications: () => void;
  onChat: () => void;
}

// Mapeia resposta da API para NotificationItem
function mapApiNotification(item: any): NotificationItem {
  return {
    id:        String(item.id),
    type:      item.type || item.notification_type || 'follow',
    title:     item.title,
    message:   item.message || item.body || '',
    user: {
      name:   item.sender?.name || item.sender?.username || item.user?.name || 'Utilizador',
      avatar: item.sender?.avatar || item.user?.avatar,
    },
    read:      item.isRead ?? item.is_read ?? item.read ?? false,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
  };
}

export default function Notifications({
  onNotifications, onChat }: NotificationsProps) {
  useScrollTop();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await notificationsApi.list();

      if (data) {
        // A API pode devolver array directo ou { notifications: [...] }
        const items: any[] = Array.isArray(data)
          ? data
          : (data.notifications ?? data.results ?? []);

        setNotifications(items.map(mapApiNotification));
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling a cada 30 segundos (7.1 da documentação)
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // 7.2 — Marcar uma notificação como lida
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // 7.3 — Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Remover localmente (sem endpoint de DELETE na doc até 7.3)
  const handleRemove = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'unread' ? !n.read : true
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':     return <Heart     size={18} className="text-red-500"   />;
      case 'comment':  return <MessageCircle size={18} className="text-blue-500"  />;
      case 'follow':   return <UserPlus  size={18} className="text-green-500" />;
      case 'booking':  return <Calendar  size={18} className="text-orange-500"/>;
      default:         return <Bell      size={18} className="text-gray-500"  />;
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      like:     'curtiu a tua publicação',
      comment:  'comentou na tua publicação',
      follow:   'começou a seguir-te',
      booking:  'fez uma reserva',
      approval: 'o teu conteúdo foi aprovado',
    };
    return map[type] || 'enviou uma notificação';
  };

  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      const diff  = Date.now() - date.getTime();
      const min   = Math.floor(diff / 60_000);
      if (min < 1)   return 'Agora mesmo';
      if (min < 60)  return `${min}m atrás`;
      const hrs = Math.floor(min / 60);
      if (hrs < 24)  return `${hrs}h atrás`;
      return date.toLocaleDateString('pt-MZ');
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 scrollbar-hide">
      <Header onNotifications={onNotifications} onChat={onChat} />

      {/* Cabeçalho */}
      <motion.div
        className="px-4 py-4 flex items-center justify-between border-b border-gray-100 bg-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-[#1B5E3B]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleMarkAllAsRead}
            className="text-xs text-[#1B5E3B] font-semibold hover:underline px-3 py-1 rounded-full"
            style={{ background: '#EEF7F0' }}
          >
            Marcar tudo
          </motion.button>
        )}
      </motion.div>

      {/* Filtros */}
      <motion.div
        className="px-4 py-3 flex gap-2 border-b border-gray-100 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-[#1B5E3B] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f === 'all' ? 'Todas' : 'Não lidas'}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Lista */}
      <main className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {filteredNotifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`p-4 rounded-xl transition-all cursor-pointer border ${
                  notif.read
                    ? 'bg-white hover:bg-gray-50 border-gray-100'
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#1B5E3B] to-[#2BB5C8] flex items-center justify-center">
                    {notif.user.avatar ? (
                      <img src={notif.user.avatar} alt={notif.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {notif.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getIcon(notif.type)}
                      <p className="text-sm text-gray-900 leading-snug">
                        <span className="font-semibold">{notif.user.name}</span>
                        {' '}
                        <span className="text-gray-600">{getTypeLabel(notif.type)}</span>
                      </p>
                    </div>
                    {notif.message && notif.message !== getTypeLabel(notif.type) && (
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                  </div>

                  {/* Acções */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); handleRemove(notif.id); }}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {filter === 'unread' ? 'Sem notificações não lidas' : 'Nenhuma notificação'}
            </h3>
            <p className="text-sm text-gray-500">
              {filter === 'unread' ? 'Estás em dia com tudo!' : 'As tuas notificações aparecem aqui.'}
            </p>
            {filter === 'unread' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-3 text-sm font-bold"
                style={{ color: '#1B5E3B' }}
              >
                Ver todas →
              </button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
