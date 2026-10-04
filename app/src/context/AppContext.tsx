import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { localsApi, notificationsApi } from '@/services/api';
import { wsService } from '@/services/websocket';
import { tokenStore } from '@/services/tokenStore';
import { extractImages } from '@/utils/dataValidation';
import type { Local, Notification } from '@/types';
import { MapContext } from '@/context/MapContext';

interface AppContextType {
  locais: Local[];
  notifications: Notification[];
  savedLocais: string[];
  categories: any[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchLocais: (params?: { category?: string; search?: string }) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchSavedLocais: () => Promise<void>;
  
  toggleSave: (localId: string) => Promise<void>;
  toggleLike: (localId: string) => Promise<void>;
  addLocal: (local: Omit<Local, 'id' | 'createdAt'>) => Promise<boolean>;
  
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locais, setLocais] = useState<Local[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savedLocais, setSavedLocais] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Guard defensivo — funciona mesmo que AppProvider seja usado sem MapProvider
  // (testes, ambientes isolados). Usa useContext directamente em vez do hook que lança.
  const mapCtx = useContext(MapContext);
  const notifyMapReloadFn = mapCtx?.notifyMapReload ?? (() => {});

  // Ref estável de notifyMapReload — o useEffect do WebSocket usa a ref,
  // por isso não precisa de notifyMapReload nas suas deps (corre só uma vez,
  // mas a callback que chama sempre a versão mais recente).
  const notifyMapReloadRef = useRef(notifyMapReloadFn);
  useEffect(() => {
    notifyMapReloadRef.current = notifyMapReloadFn;
  }, [notifyMapReloadFn]);

  // Fetch locations — seguindo documentação 3.1
  const fetchLocais = useCallback(async (params?: { category?: string; search?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await localsApi.list(params);
      if (data) {
        // Documentação 3.1: A API devolve { success: true, locals: [...], pagination: {...} }
        const items = data.locals || [];
        
        // Transform API data to match Local type
        const transformedData = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category || 'all',
          images: extractImages(item),
          location: {
            lat: item.location?.latitude || 0,
            lng: item.location?.longitude || 0,
            address: item.location?.address || '',
          },
          rating: item.rating?.average || 0,
          reviewsCount: item.rating?.count || 0,
          author: item.owner,
          createdAt: item.createdAt,
          saved: false, // Será atualizado via getSavedLocais()
          liked: false, // Será atualizado via interações
          likesCount: 0,
          savesCount: 0,
        }));
        setLocais(transformedData);
        if (apiError) setError(apiError ?? null);
      }
    } catch (err) {
      setError('Failed to fetch locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch categories (derived from places list)
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await localsApi.list({ limit: 100 });
      if (data?.locals) {
        const items = data.locals;
        const seen = new Set<string>();
        const cats: any[] = [];
        items.forEach((item: any) => {
          const slug = item.category || 'other';
          const name = item.category || 'Outros';
          if (slug && !seen.has(slug)) {
            seen.add(slug);
            cats.push({ slug, name });
          }
        });
        setCategories(cats);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error: apiError } = await notificationsApi.list();
      if (data && Array.isArray(data)) {
        // Transform API data to match Notification type
        const transformedData = data.map((item: any) => ({
          id: item.id,
          type: item.notification_type,
          message: item.message,
          user: item.sender,
          local: item.location,
          read: item.is_read,
          createdAt: item.created_at,
        }));
        setNotifications(transformedData);
      } else if (apiError) {
        console.error('Failed to fetch notifications:', apiError);
      }
      
      // Also fetch count — endpoint may not exist, use list with unreadOnly
      const { data: countData } = await notificationsApi.list({ unreadOnly: true });
      if (countData && typeof countData === 'object') {
        const list = (countData as any).notifications ?? (countData as any).results ?? [];
        setUnreadCount(Array.isArray(list) ? list.length : 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Fetch saved locations
  // ⚠️ TEMPORÁRIO: API atual não tem endpoints de save para locais
  // Quando a API tiver suporte, usar: GET /api/locals/saved/ ou GET /api/users/me/saves/
  const fetchSavedLocais = useCallback(async () => {
    // Silencia os 404s — a API não tem estes endpoints ainda
    setSavedLocais([]);
  }, []);

  // Toggle save
  const toggleSave = useCallback(async (localId: string) => {
    // ⚠️ TEMPORÁRIO: API atual não suporta save para locais
    console.warn('[AppContext] toggleSave: Funcionalidade não disponível - API não tem endpoint /api/locals/{id}/save/');
    return;
    
    /* Código original quando a API tiver suporte:
    try {
      const { data } = await localsApi.toggleSave(localId);
      if (data) {
        setSavedLocais(prev => {
          if (data.saved) {
            return [...prev, localId];
          } else {
            return prev.filter(id => id !== localId);
          }
        });
        
        // Update local's saves_count
        setLocais(prev => prev.map(local => 
          local.id === localId 
            ? { 
                ...local, 
                saved: data.saved,
                savesCount: data.saved 
                  ? (local.savesCount || 0) + 1 
                  : Math.max(0, (local.savesCount || 0) - 1)
              }
            : local
        ));
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
    */
  }, []);

  // Toggle like
  const toggleLike = useCallback(async (localId: string) => {
    // ⚠️ TEMPORÁRIO: localsApi.toggleLike não existe na API atual
    // A API atual não tem endpoint de like para locais
    console.warn('[AppContext] toggleLike: Endpoint de like para locais não disponível na API atual');
  }, []);

  // Add local
  const addLocal = useCallback(async (localData: Omit<Local, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const fd = new FormData();
      // Campos obrigatórios
      fd.append('name', (localData as any).name || '');
      fd.append('description', (localData as any).description || '');
      fd.append('category', (localData as any).category || '');
      const result = await localsApi.create(fd);
      const data = (result as any)?.data;
      const apiError = (result as any)?.error;
      if (data) {
        setLocais(prev => [data, ...prev]);
        return true;
      }
      if (apiError) setError(apiError);
      return false;
    } catch (err) {
      setError('Failed to create location');
      return false;
    }
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Initial fetch — só se houver token em memória
  useEffect(() => {
    if (tokenStore.getAccess()) {
      const timer = setTimeout(() => {
        fetchLocais();
        fetchCategories();
        fetchNotifications();
        fetchSavedLocais();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fetchLocais, fetchCategories, fetchNotifications, fetchSavedLocais]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!tokenStore.getAccess()) return;

    // Verifica se o token actual é o access token real (não legacy)
    const checkBackendAndConnect = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL as string || 'http://192.168.88.127:8000/api').replace(/\/api$/, '');
        const tk = tokenStore.getAccess();
        const response = await fetch(`${baseUrl}/api/notifications/count/`, {
          headers: { 'Authorization': `Bearer ${tk}` },
        });
        
        if (!response.ok) return; // Backend not ready
        
        // Backend is available, connect WebSocket
        await wsService.connect({
          onLocationCreated: (location: any) => {
            console.log('📍 New location created:', location);
            setLocais(prev => [location, ...prev]);
          },
          onLocationUpdated: (location: any) => {
            console.log('📍 Location updated:', location);
            setLocais(prev => prev.map(l => l.id === location.id ? location : l));
          },
          onLocationDeleted: (locationId: string) => {
            console.log('📍 Location deleted:', locationId);
            setLocais(prev => prev.filter(l => l.id !== locationId));
          },
          onPostCreated: (post: any) => {
            console.log('📝 New post created:', post);
            // Notificar o mapa para recarregar os pins em tempo real (via ref estável)
            notifyMapReloadRef.current();
          },
          onPostUpdated: (post: any) => {
            console.log('📝 Post updated:', post);
            notifyMapReloadRef.current();
          },
          onPostDeleted: (postId: string) => {
            console.log('📝 Post deleted:', postId);
            notifyMapReloadRef.current();
          },
          onReviewCreated: (review: any) => {
            console.log('⭐ New review created:', review);
          },
          onReviewUpdated: (review: any) => {
            console.log('⭐ Review updated:', review);
          },
          onReviewDeleted: (reviewId: string) => {
            console.log('⭐ Review deleted:', reviewId);
          },
          onNotificationCreated: (notification: any) => {
            console.log('🔔 New notification:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          },
          onConnected: () => {
            console.log('✅ WebSocket connected');
          },
          onDisconnected: () => {
            console.log('❌ WebSocket disconnected');
          },
          onError: (error: string) => {
            console.error('❌ WebSocket error:', error);
          },
        });
      } catch (error) {
        // Backend not available yet, skip WebSocket connection
        console.log('⏳ Backend not available yet, WebSocket will connect when backend is ready');
      }
    };

    checkBackendAndConnect();

    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        locais,
        notifications,
        savedLocais,
        categories,
        unreadCount,
        isLoading,
        error,
        fetchLocais,
        fetchCategories,
        fetchNotifications,
        fetchSavedLocais,
        toggleSave,
        toggleLike,
        addLocal,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
