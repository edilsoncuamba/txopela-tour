import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Calendar, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import { notificationsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';

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
  const { isDark } = useTheme();
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
    <div className="min-h-screen pb-24 scrollbar-hide"
      style={{ background: isDark ? '#0F1117' : '#F9FAFB' }}>
      <Header onNotifications={onNotifications} onChat={onChat} />

      {/* Cabeçalho */}
      <motion.div
        className="px-4 py-4 flex items-center justify-between border-b"
        style={{
          background: isDark ? '#1A1D27' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-[#1B5E3B]" />
          <div>
            <h1 className="text-xl font-bold" style={{ color: isDark ? '#F0F4FF' : '#111827' }}>
              Notificações
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs" style={{ color: isDark ? '#6B7A99' : '#6B7280' }}>
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleMarkAllAsRead}
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: isDark ? 'rgba(74,222,128,0.12)' : '#EEF7F0',
              color: '#1B5E3B',
            }}
          >
            Marcar tudo
          </motion.button>
        )}
      </motion.div>

      {/* Filtros */}
      <motion.div
        className="px-4 py-3 flex gap-2 border-b"
        style={{
          background: isDark ? '#1A1D27' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={filter === f
              ? { background: '#1B5E3B', color: '#ffffff' }
              : {
                  background: isDark ? '#22263A' : '#ffffff',
                  color: isDark ? '#A8B4CC' : '#4B5563',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}`,
                }
            }
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
              <div key={i} className="rounded-xl p-4 animate-pulse flex gap-3"
                style={{ background: isDark ? '#1A1D27' : '#ffffff' }}>
                <div className="w-12 h-12 rounded-full flex-shrink-0"
                  style={{ background: isDark ? '#22263A' : '#E5E7EB' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded w-3/4"
                    style={{ background: isDark ? '#22263A' : '#E5E7EB' }} />
                  <div className="h-3 rounded w-1/2"
                    style={{ background: isDark ? '#22263A' : '#E5E7EB' }} />
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
                className="p-4 rounded-xl transition-all cursor-pointer border"
                style={notif.read
                  ? {
                      background: isDark ? '#1A1D27' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
                    }
                  : {
                      background: isDark ? 'rgba(56,189,248,0.08)' : '#EFF6FF',
                      borderColor: isDark ? 'rgba(56,189,248,0.2)' : '#BFDBFE',
                    }
                }
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
                      <p className="text-sm leading-snug" style={{ color: isDark ? '#DDE4F5' : '#111827' }}>
                        <span className="font-semibold">{notif.user.name}</span>
                        {' '}
                        <span style={{ color: isDark ? '#A8B4CC' : '#4B5563' }}>{getTypeLabel(notif.type)}</span>
                      </p>
                    </div>
                    {notif.message && notif.message !== getTypeLabel(notif.type) && (
                      <p className="text-xs mt-0.5 line-clamp-2"
                        style={{ color: isDark ? '#6B7A99' : '#6B7280' }}>{notif.message}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: isDark ? '#4A5568' : '#9CA3AF' }}>
                      {formatDate(notif.createdAt)}
                    </p>
                  </div>

                  {/* Acções */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); handleRemove(notif.id); }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: isDark ? 'rgba(248,113,113,0.08)' : 'transparent' }}
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
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: isDark ? '#1A1D27' : '#F3F4F6' }}>
              <Bell size={32} style={{ color: isDark ? '#3A4460' : '#D1D5DB' }} />
            </div>
            <h3 className="text-lg font-semibold mb-1"
              style={{ color: isDark ? '#F0F4FF' : '#111827' }}>
              {filter === 'unread' ? 'Sem notificações não lidas' : 'Nenhuma notificação'}
            </h3>
            <p className="text-sm" style={{ color: isDark ? '#6B7A99' : '#6B7280' }}>
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
