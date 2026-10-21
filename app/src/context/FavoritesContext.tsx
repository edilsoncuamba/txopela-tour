/**
 * FavoritesContext — favoritos persistidos pela API (openapi-schema(5).yaml).
 *
 * ENDPOINTS CONFIRMADOS (schema 5):
 *
 *   POST   /api/posts/{id}/save/    → PostSaveResponse       { success, hasSaved: true }
 *   DELETE /api/posts/{id}/save/    → PostSaveResponse       { success, hasSaved: false }
 *   POST   /api/locals/{id}/save/   → LocalSaveResponse      { success, hasSaved: true }
 *   DELETE /api/locals/{id}/save/   → LocalRemoveSaveResponse{ success, hasSaved: false }
 *   POST   /api/services/{id}/save/ → ServiceSaveResponse    { success, hasSaved: true }
 *   DELETE /api/services/{id}/save/ → ServiceRemoveSaveResponse{ success, hasSaved: false }
 *
 * O QUE O SCHEMA(5) TEM:
 *   ✅ userInteraction.hasSaved em PostList / PostDetail
 *   ✅ GET /api/posts/ com paginação — usado para carregar posts guardados ao login
 *
 * O QUE O SCHEMA(5) NÃO TEM:
 *   ❌ userInteraction em LocalList / LocalDetail / ServiceList / ServiceDetail
 *   ❌ GET /api/locals/saved/ — não existe
 *   ❌ GET /api/services/saved/ — não existe
 *   ❌ query param saved=true no GET /api/posts/
 *
 * ESTRATÉGIA DE PERSISTÊNCIA:
 *   Posts:           ao login → paginar GET /api/posts/ filtrando userInteraction.hasSaved=true
 *   Locais/Serviços: estado em memória durante a sessão; confirmado via hasSaved da resposta
 *                    do toggle (POST/DELETE). Sem persistência entre sessões — limitação do schema.
 *
 * REGRAS:
 *   - Sem localStorage. Sem fallback de storage. A API é a única fonte de verdade.
 *   - Qualquer utilizador autenticado (tourist, local_resident, business) pode usar favoritos.
 *   - Atualização optimista com rollback automático em caso de erro da API.
 *   - Ao logout → limpa imediatamente (useEffect reage a user?.id === undefined).
 *   - Ao login → recarrega posts guardados do backend.
 *   - Pedidos duplicados são ignorados (idempotência garantida pelo optimistic update).
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
  /**
   * Sincroniza o estado de um post nos favoritos a partir de dados frescos
   * da API (GET /api/posts/{id}/ → userInteraction.hasSaved), SEM chamar a API
   * de save. Usado pelo PostDetail para reconciliar o coração azul quando o
   * post é aberto fora do feed (e.g. via notificação), mantendo feed e detalhe
   * sincronizados pela mesma fonte de verdade.
   */
  syncPostFromApi: (rawPost: any) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// ── Mapper: PostList → FavoriteItem ───────────────────────────────────────────

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Reage a mudanças de sessão ─────────────────────────────────────────────
  // user?.id === undefined → logout → limpa favoritos imediatamente
  // user?.id definido → login → carrega posts guardados do backend
  useEffect(() => {
    if (!user?.id) {
      // Logout ou sem sessão — limpar tudo imediatamente
      setFavorites([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Login — carregar posts guardados via GET /api/posts/ + filtro hasSaved
    // Locais e serviços não têm endpoint GET /saved/ no schema(5).
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    favoritesApi.getSavedPosts()
      .then(posts => {
        if (cancelled) return;
        const mappedPosts = posts.map(mapPostToFavorite);
        setFavorites(prev => {
          // Preserva locais/serviços já em memória nesta sessão (e.g. de navegação anterior).
          // Substitui a lista de posts pela resposta fresca do backend.
          const nonPosts  = prev.filter(f => f.type !== 'post');
          const seenIds   = new Set(nonPosts.map(f => f.id));
          const newPosts  = mappedPosts.filter(f => !seenIds.has(f.id));
          return [...nonPosts, ...newPosts];
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Falha de rede — não há fallback; posts ficam vazios até próxima tentativa.
        // Não bloqueia o utilizador — pode ainda navegar e usar a app.
        setError('Não foi possível carregar favoritos. Verifica a ligação.');
        setTimeout(() => setError(null), 5000);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    // Cleanup: se o user mudar antes de terminar o pedido, ignorar a resposta
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── isFavorite ────────────────────────────────────────────────────────────
  const isFavorite = useCallback(
    (id: string) => favorites.some(f => f.id === id),
    [favorites],
  );

  // ── toggleFavorite ────────────────────────────────────────────────────────
  // Funciona para tourist, local_resident e business — sem restrição de role.
  // Todos os endpoints de save no schema(5) requerem apenas jwtAuth.
  const toggleFavorite = useCallback(async (item: FavoriteItem): Promise<void> => {
    if (!user?.id) return;

    // 'heritage' não tem endpoint no schema(5) — estado local apenas
    if (item.type === 'heritage') {
      setFavorites(prev =>
        prev.some(f => f.id === item.id)
          ? prev.filter(f => f.id !== item.id)
          : [...prev, item],
      );
      return;
    }

    const alreadySaved = favorites.some(f => f.id === item.id);

    // ── Atualização optimista — UI responde imediatamente ──────────────────
    setFavorites(prev =>
      alreadySaved ? prev.filter(f => f.id !== item.id) : [...prev, item],
    );

    try {
      let res: { data?: { success?: boolean; hasSaved?: boolean } | null; error?: string };

      if (item.type === 'post') {
        // POST /api/posts/{id}/save/  ou  DELETE /api/posts/{id}/save/
        res = alreadySaved
          ? await favoritesApi.unsavePost(item.id)
          : await favoritesApi.savePost(item.id);
      } else if (item.type === 'service') {
        // POST /api/services/{id}/save/  ou  DELETE /api/services/{id}/save/
        res = alreadySaved
          ? await favoritesApi.unsaveService(item.id)
          : await favoritesApi.saveService(item.id);
      } else {
        // 'local' — POST /api/locals/{id}/save/  ou  DELETE /api/locals/{id}/save/
        res = alreadySaved
          ? await favoritesApi.unsaveLocal(item.id)
          : await favoritesApi.saveLocal(item.id);
      }

      if (res.error) {
        // API recusou (e.g. 401, 403, 404) — rollback para estado anterior
        console.warn('[FavoritesContext] API recusou toggle:', res.error);
        setFavorites(prev =>
          alreadySaved ? [...prev, item] : prev.filter(f => f.id !== item.id),
        );
        setError(res.error);
        setTimeout(() => setError(null), 4000);
        return;
      }

      // ── Reconciliação com o servidor ────────────────────────────────────
      // Schema(5): { success: boolean, hasSaved: boolean }
      // hasSaved=true  → item guardado no servidor → deve estar nos favoritos
      // hasSaved=false → item removido no servidor → não deve estar nos favoritos
      const serverHasSaved = res.data?.hasSaved;
      if (serverHasSaved !== undefined) {
        setFavorites(prev => {
          const exists = prev.some(f => f.id === item.id);
          if (serverHasSaved && !exists) return [...prev, item];
          if (!serverHasSaved && exists) return prev.filter(f => f.id !== item.id);
          return prev; // já está no estado correto
        });
      }

      setError(null);

    } catch (e) {
      // Erro de rede — rollback imediato
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

  // ── syncPostFromApi ────────────────────────────────────────────────────────
  // Reconcilia o estado de favorito de um post a partir de dados da API, sem
  // chamar o endpoint de save. Mantém feed e detalhe sincronizados.
  const syncPostFromApi = useCallback((rawPost: any) => {
    if (!rawPost?.id) return;
    const id = String(rawPost.id);
    const hasSaved = rawPost?.userInteraction?.hasSaved === true;
    setFavorites(prev => {
      const exists = prev.some(f => f.id === id && f.type === 'post');
      if (hasSaved && !exists) {
        // A API confirma que está guardado → adiciona aos favoritos em memória
        const item = mapPostToFavorite(rawPost);
        return prev.some(f => f.id === id) ? prev : [...prev, item];
      }
      if (!hasSaved && exists) {
        // A API confirma que NÃO está guardado → remove dos favoritos em memória
        return prev.filter(f => !(f.id === id && f.type === 'post'));
      }
      return prev;
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      isFavorite,
      toggleFavorite,
      clearFavorites,
      countByType,
      isLoading,
      error,
      syncPostFromApi,
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
