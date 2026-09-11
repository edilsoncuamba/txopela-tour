/**
 * FavoritesContext — gestão de favoritos.
 *
 * Endpoints disponíveis (servidor remoto + backend local via alias):
 *   ✅ POST   /api/locals/{id}/save/  → toggle save de local → { message, saved }
 *   ✅ GET    /api/locals/saved/      → lista locais guardados
 *   ✅ POST   /api/posts/{id}/save/   → guarda post  → { success, hasSaved: true }
 *   ✅ DELETE /api/posts/{id}/save/   → remove post  → { success, hasSaved: false }
 *   ❌ Serviços: sem endpoint de save no servidor
 *
 * Após login: carrega locais e posts guardados da API.
 * Após logout: limpa estado local automaticamente.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { favoritesApi } from '@/services/api';
import { PLACEHOLDER_IMAGE, extractImages } from '@/utils/dataValidation';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type FavoriteType = 'local' | 'service' | 'heritage';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  name: string;
  image: string;
  tag?: string;
  tagBg?: string;
  rating?: number;
  provincia?: string;
  distrito?: string;
  categoryKey?: string;
  raw?: any;
}

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
  clearFavorites: () => void;
  countByType: (type: FavoriteType) => number;
  isLoading: boolean;
  error: string | null;
}

// ── Context ───────────────────────────────────────────────────────────────────

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapLocalToFavorite(raw: any): FavoriteItem {
  const loc = raw.location ?? raw;
  const image = extractImages(loc)[0] ?? PLACEHOLDER_IMAGE;
  const categoryName =
    typeof loc.category === 'object' && loc.category !== null
      ? (loc.category.name ?? '')
      : (loc.category ?? '');
  return {
    id:          String(loc.id),
    type:        'local',
    name:        loc.name ?? loc.title ?? 'Local',
    image,
    tag:         categoryName,
    rating:      parseFloat(loc.rating ?? 0) || 0,
    provincia:   loc.location?.province ?? loc.province ?? loc.provincia ?? '',
    // district é o Distrito real — municipality é apenas compatibilidade de envio, não leitura
    distrito:    loc.location?.district ?? loc.district ?? loc.distrito ?? '',
    categoryKey: categoryName,
    raw:         loc,
  };
}

function mapPostToFavorite(raw: any): FavoriteItem {
  const image = extractImages(raw)[0] ?? PLACEHOLDER_IMAGE;
  return {
    id:          String(raw.id),
    type:        'local',
    name:        raw.title ?? raw.content?.slice(0, 60) ?? 'Publicação',
    image,
    tag:         raw.category ?? 'Post',
    rating:      0,
    provincia:   raw.province ?? '',
    distrito:    '',
    categoryKey: 'post',
    raw,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const lastLoadedUserId = useRef<string | null>(null);

  // ── Carrega favoritos da API após login ───────────────────────────────────
  const loadFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavorites([]);
      lastLoadedUserId.current = null;
      return;
    }
    if (lastLoadedUserId.current === user.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const { locals, posts } = await favoritesApi.getAll();

      const mapped: FavoriteItem[] = [
        ...locals.map(mapLocalToFavorite),
        ...posts.map(mapPostToFavorite),
      ];

      const seen = new Set<string>();
      const deduped = mapped.filter(f => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      });

      setFavorites(deduped);
      lastLoadedUserId.current = user.id;
    } catch {
      setFavorites([]);
      lastLoadedUserId.current = user.id;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Carrega ao fazer login; limpa ao fazer logout
  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    } else {
      setFavorites([]);
      setError(null);
      lastLoadedUserId.current = null;
    }
  }, [user?.id, loadFavorites]);

  // ── isFavorite ────────────────────────────────────────────────────────────
  const isFavorite = useCallback((id: string): boolean => {
    return favorites.some(f => f.id === id);
  }, [favorites]);

  // ── toggleFavorite ────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (item: FavoriteItem): Promise<void> => {
    if (!user?.id) return;

    const alreadySaved = favorites.some(f => f.id === item.id);
    const isPost = item.categoryKey === 'post' ||
      (item.raw?.content !== undefined && item.raw?.stats !== undefined);

    // Optimistic update
    setFavorites(prev =>
      alreadySaved ? prev.filter(f => f.id !== item.id) : [...prev, item],
    );

    if (item.type === 'service' || item.type === 'heritage') return; // só memória por enquanto

    try {
      const res = isPost
        ? alreadySaved
          ? await favoritesApi.unsavePost(item.id)
          : await favoritesApi.savePost(item.id)
        : await favoritesApi.saveLocal(item.id); // toggle no backend

      if (res.error) {
        // Rollback
        setFavorites(prev =>
          alreadySaved ? [...prev, item] : prev.filter(f => f.id !== item.id),
        );
      }
    } catch {
      // Rollback em erro de rede
      setFavorites(prev =>
        alreadySaved ? [...prev, item] : prev.filter(f => f.id !== item.id),
      );
    }
  }, [user?.id, favorites]);

  // ── clearFavorites ────────────────────────────────────────────────────────
  const clearFavorites = useCallback(() => {
    setFavorites([]);
    lastLoadedUserId.current = null;
  }, []);

  // ── countByType ───────────────────────────────────────────────────────────
  const countByType = useCallback((type: FavoriteType): number => {
    return favorites.filter(f => f.type === type).length;
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      isFavorite,
      toggleFavorite,
      clearFavorites,
      countByType,
      isLoading,
      error,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider');
  return ctx;
}
