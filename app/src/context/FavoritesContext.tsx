/**
 * FavoritesContext — favoritos persistidos pela API.
 *
 * Contrato openapi-schema(3).yaml (testado ao vivo):
 *
 *   POST   /api/locals/{id}/save/   → { data: { hasSaved: true } }   ✅
 *   DELETE /api/locals/{id}/save/   → { data: { hasSaved: false } }  ✅
 *   POST   /api/posts/{id}/save/    → { data: { hasSaved: true } }   ✅
 *   DELETE /api/posts/{id}/save/    → { data: { hasSaved: false } }  ✅
 *   POST   /api/services/{id}/save/ → { data: { hasSaved: true } }   ✅
 *   DELETE /api/services/{id}/save/ → { data: { hasSaved: false } }  ✅
 *
 * O que o servidor NÃO tem (confirmado ao vivo):
 *   ❌ userInteraction em LocalList / LocalDetail / ServiceList / ServiceDetail
 *   ❌ Nenhum endpoint GET /saved/ para locais ou serviços
 *
 * O que o servidor TEM (via schema):
 *   ✅ userInteraction.hasSaved em PostList / PostDetail
 *
 * Estratégia:
 *   - Ao login: carrega posts guardados via GET /api/posts/ (userInteraction.hasSaved)
 *   - Toggle: faz POST ou DELETE → reconcilia com hasSaved da resposta
 *   - Locais/serviços: estado correcto durante a sessão; ao recarregar reconstróem-se
 *     conforme o utilizador navega (toggle confirma via hasSaved)
 *   - Sem localStorage. Sem fallback. API é a única fonte de verdade.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { favoritesApi } from '@/services/api';
import { PLACEHOLDER_IMAGE, extractImages } from '@/utils/dataValidation';
import { translatePostCategory } from '@/utils/translations';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type FavoriteType = 'local' | 'post' | 'service' | 'heritage';

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

// ── Mapper (só posts têm userInteraction.hasSaved na listagem) ────────────────

function mapPostToFavorite(raw: any): FavoriteItem {
  const image = extractImages(raw)[0] ?? PLACEHOLDER_IMAGE;
  return {
    id:          String(raw.id),
    type:        'post',
    name:        raw.title ?? raw.content?.slice(0, 60) ?? 'Publicação',
    image,
    tag:         translatePostCategory(raw.category) ?? 'Publicação',
    rating:      0,
    provincia:   raw.province ?? raw.location?.province ?? '',
    distrito:    raw.location?.district ?? '',
    categoryKey: 'post',
    raw,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading]  = useState(false);
  const [error, setError]          = useState<string | null>(null);

  // ── Ao login: carrega posts guardados da API ───────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setFavorites([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    favoritesApi.getSavedPosts()
      .then(posts => {
        const mappedPosts = posts.map(mapPostToFavorite);
        setFavorites(prev => {
          // Mantém locais/serviços já em memória desta sessão, substitui posts pela lista da API
          const nonPosts = prev.filter(f => f.type !== 'post');
          const seenIds  = new Set(nonPosts.map(f => f.id));
          const newPosts = mappedPosts.filter(f => !seenIds.has(f.id));
          return [...nonPosts, ...newPosts];
        });
      })
      .catch(() => {
        // API falhou — não há fallback; posts ficam vazios até próxima tentativa
        setError('Não foi possível carregar favoritos. Verifica a ligação.');
        setTimeout(() => setError(null), 5000);
      })
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  // ── isFavorite ────────────────────────────────────────────────────────────
  const isFavorite = useCallback(
    (id: string) => favorites.some(f => f.id === id),
    [favorites],
  );

  // ── toggleFavorite ────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (item: FavoriteItem): Promise<void> => {
    if (!user?.id) return;

    // 'heritage' não tem endpoint no schema — apenas altera estado local da sessão
    if (item.type === 'heritage') {
      setFavorites(prev =>
        prev.some(f => f.id === item.id)
          ? prev.filter(f => f.id !== item.id)
          : [...prev, item],
      );
      return;
    }

    const alreadySaved = favorites.some(f => f.id === item.id);

    // Optimistic update — reflecte a intenção na UI imediatamente
    setFavorites(prev =>
      alreadySaved ? prev.filter(f => f.id !== item.id) : [...prev, item],
    );

    try {
      let res: { data?: { success?: boolean; hasSaved?: boolean } | null; error?: string };

      if (item.type === 'post') {
        res = alreadySaved
          ? await favoritesApi.unsavePost(item.id)
          : await favoritesApi.savePost(item.id);
      } else if (item.type === 'service') {
        res = alreadySaved
          ? await favoritesApi.unsaveService(item.id)
          : await favoritesApi.saveService(item.id);
      } else {
        // 'local'
        res = alreadySaved
          ? await favoritesApi.unsaveLocal(item.id)
          : await favoritesApi.saveLocal(item.id);
      }

      if (res.error) {
        // API recusou — rollback imediato para estado anterior
        console.warn('[FavoritesContext] API recusou:', res.error);
        setFavorites(prev =>
          alreadySaved ? [...prev, item] : prev.filter(f => f.id !== item.id),
        );
        setError(res.error);
        setTimeout(() => setError(null), 4000);
        return;
      }

      // Reconcilia com a resposta real do servidor
      // Resposta ao vivo: { data: { hasSaved: true/false } }
      const serverHasSaved = res.data?.hasSaved;
      if (serverHasSaved !== undefined) {
        setFavorites(prev => {
          const exists = prev.some(f => f.id === item.id);
          if (serverHasSaved && !exists) return [...prev, item];
          if (!serverHasSaved && exists) return prev.filter(f => f.id !== item.id);
          return prev; // já está no estado correcto
        });
      }

      setError(null);

    } catch (e) {
      // Erro de rede — rollback
      setFavorites(prev =>
        alreadySaved ? [...prev, item] : prev.filter(f => f.id !== item.id),
      );
      const msg = e instanceof Error ? e.message : 'Erro de rede';
      setError(msg);
      setTimeout(() => setError(null), 4000);
    }
  }, [user?.id, favorites]);

  // ── clearFavorites ────────────────────────────────────────────────────────
  const clearFavorites = useCallback(() => setFavorites([]), []);

  // ── countByType ───────────────────────────────────────────────────────────
  const countByType = useCallback(
    (type: FavoriteType) => favorites.filter(f => f.type === type).length,
    [favorites],
  );

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
