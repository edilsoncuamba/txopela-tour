/**
 * PostsContext — fonte de verdade partilhada para o estado de LIKE das publicações.
 *
 * Resolve o problema de sincronização entre o feed (AllPosts) e os detalhes
 * (PostDetail): ambos consomem o mesmo estado, pelo que dar like num lado
 * reflete imediatamente no outro, sem callbacks manuais sujeitos a divergência.
 *
 * ENDPOINTS (openapi-schema):
 *   POST   /api/posts/{id}/like/  → LikeResponse { success, hasLiked, likesCount }
 *   DELETE /api/posts/{id}/like/  → LikeResponse { success, hasLiked, likesCount }
 *
 * PERSISTÊNCIA:
 *   O estado em memória é re-hidratado a partir da API em cada carregamento
 *   (feed: GET /api/posts/ traz userInteraction.hasLiked + likes_count;
 *    detalhe: GET /api/posts/{id}/ traz userInteraction.hasLiked + stats.likesCount).
 *   Não há localStorage — a API é a única fonte de verdade.
 *
 * NOTA: Favoritos (save) NÃO vivem aqui — vivem no FavoritesContext, que é a
 * fonte de verdade partilhada para favoritos de todos os tipos (local/post/service).
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { postsApi } from '@/services/api';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PostLikeState {
  isLiked: boolean;
  likesCount: number;
}

interface PostsContextValue {
  /** Estado de like de um post (default: não gostado, 0 likes). */
  getLike: (id: string) => PostLikeState;
  /** Alterna o like de um post (POST/DELETE /api/posts/{id}/like/). */
  toggleLike: (id: string) => Promise<void>;
  /** Hidata o estado a partir de dados frescos da API (sem chamar a API). */
  hydrateLike: (id: string, isLiked: boolean, likesCount: number) => void;
  /** True se um toggle está em curso (para desativar o botão e evitar duplo clique). */
  isToggling: (id: string) => boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const DEFAULT_STATE: PostLikeState = { isLiked: false, likesCount: 0 };

const PostsContext = createContext<PostsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function PostsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [likes,    setLikes]    = useState<Record<string, PostLikeState>>({});
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  // Ref espelha `likes` para leitura sem stale-closure dentro de toggleLike.
  const likesRef    = useRef(likes);
  const togglingRef = useRef<Set<string>>(new Set());

  useEffect(() => { likesRef.current = likes; }, [likes]);

  // ── Logout → limpa estado (não há likes sem sessão) ──────────────────────
  useEffect(() => {
    if (!user?.id) {
      setLikes({});
      setToggling({});
      togglingRef.current.clear();
    }
  }, [user?.id]);

  // ── getLike ──────────────────────────────────────────────────────────────
  const getLike = useCallback(
    (id: string): PostLikeState => likes[id] ?? DEFAULT_STATE,
    [likes],
  );

  // ── hydrateLike ──────────────────────────────────────────────────────────
  // Chamado pelo feed (GET /api/posts/) e pelo detalhe (GET /api/posts/{id}/).
  // Não clobber um toggle em curso (otimista) — a API desse toggle reconcilia depois.
  const hydrateLike = useCallback(
    (id: string, isLiked: boolean, likesCount: number) => {
      if (!id) return;
      if (togglingRef.current.has(id)) return; // toggle em curso: não sobrescrever
      setLikes(prev => {
        const cur = prev[id];
        if (cur && cur.isLiked === isLiked && cur.likesCount === likesCount) return prev;
        return { ...prev, [id]: { isLiked, likesCount } };
      });
    },
    [],
  );

  // ── toggleLike ───────────────────────────────────────────────────────────
  // Atualização optimista + reconciliação com LikeResponse { hasLiked, likesCount }.
  const toggleLike = useCallback(async (id: string): Promise<void> => {
    if (!user?.id) return;
    if (!id) return;
    if (togglingRef.current.has(id)) return; // idempotência: ignora duplo clique

    const current = likesRef.current[id] ?? DEFAULT_STATE;
    const wasLiked = current.isLiked;

    togglingRef.current.add(id);
    setToggling(prev => ({ ...prev, [id]: true }));

    // Optimistic
    const optimistic: PostLikeState = {
      isLiked: !wasLiked,
      likesCount: Math.max(0, current.likesCount + (wasLiked ? -1 : 1)),
    };
    setLikes(prev => ({ ...prev, [id]: optimistic }));

    try {
      const { data, error } = wasLiked
        ? await postsApi.unlike(id)   // DELETE /api/posts/{id}/like/
        : await postsApi.like(id);    // POST   /api/posts/{id}/like/

      if (error || !data) {
        // Rollback para estado anterior
        setLikes(prev => ({ ...prev, [id]: current }));
      } else {
        // Reconcilia com valores reais do servidor
        setLikes(prev => ({
          ...prev,
          [id]: { isLiked: data.hasLiked, likesCount: data.likesCount },
        }));
      }
    } catch {
      // Erro de rede — rollback
      setLikes(prev => ({ ...prev, [id]: current }));
    } finally {
      togglingRef.current.delete(id);
      setToggling(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [user?.id]);

  // ── isToggling ────────────────────────────────────────────────────────────
  const isToggling = useCallback(
    (id: string) => toggling[id] === true,
    [toggling],
  );

  return (
    <PostsContext.Provider value={{ getLike, toggleLike, hydrateLike, isToggling }}>
      {children}
    </PostsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts deve ser usado dentro de PostsProvider');
  return ctx;
}
