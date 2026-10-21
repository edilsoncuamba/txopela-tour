/**
 * useSuggest — hook centralizado para o botão "Sugerir"
 *
 * Semântica: Sugerir = seguir o perfil do autor da publicação.
 *
 * Endpoints OpenAPI (única fonte de verdade):
 *   POST   /api/users/{id}/follow/   → FollowResponse   { success, isFollowing }
 *   DELETE /api/users/{id}/follow/   → UnfollowResponse { success, isFollowing }
 *   GET    /api/users/{id}/          → perfil público (sem schema definido, mas inclui isFollowing
 *                                       em algumas respostas do backend — tratado com fallback)
 *
 * Persistência:
 *   1. Se initialIsFollowing for passado pelo pai (ex: PostAuthor.isFollowing do OpenAPI), usa-o
 *      directamente como estado inicial — fonte mais fiável.
 *   2. No mount, tenta GET /api/users/{id}/ para recuperar o estado real do backend.
 *      Se o campo isFollowing não existir na resposta (LocalOwner não tem no schema),
 *      mantém initialIsFollowing sem erro.
 *   3. Após cada POST/DELETE, guarda o resultado confirmado pelo backend no cache de sessão.
 *   4. O cache de módulo serve de fallback para navegações dentro da mesma sessão de página.
 *
 * Estados:
 *   idle       → botão "Sugerir"
 *   loading    → "Sugerindo…" — botão desabilitado
 *   suggested  → "Sugerido" (isFollowing=true confirmado pela API)
 *   error      → erro real da API, estado anterior preservado
 *
 * Regras:
 *   - isSelf=true  → botão oculto (utilizador não se pode auto-sugerir)
 *   - Estado visual só muda após resposta de sucesso da API
 *   - Erro da API → mostra mensagem, mantém estado anterior
 *   - Utilizador não autenticado → erro amigável
 *   - Sem fallback, sem mock, sem dados fictícios
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { usersApi } from '@/services/api';
import { tokenStore } from '@/services/tokenStore';

export type SuggestState = 'idle' | 'loading' | 'suggested' | 'error';

export interface UseSuggestReturn {
  state: SuggestState;
  isLoading: boolean;
  isSuggested: boolean;
  /** true quando o utilizador autenticado é o próprio autor — botão deve ser ocultado */
  isSelf: boolean;
  errorMessage: string | null;
  toggle: () => Promise<void>;
}

// ── Cache de sessão em memória ────────────────────────────────────────────────
// Partilhado entre todas as instâncias do hook na mesma sessão de página.
// Chave: authorId (string). Valor: isFollowing (boolean).
// Actualizado após cada POST/DELETE /api/users/{id}/follow/ confirmado.
// Limpo ao recarregar a página ou fazer logout.
const followCache = new Map<string, boolean>();

/**
 * Estado inicial do botão.
 * Prioridade: cache de sessão → initialIsFollowing → false
 */
function getInitialState(
  authorId: string | undefined | null,
  initialIsFollowing: boolean,
): SuggestState {
  if (!authorId) return 'idle';
  if (followCache.has(authorId)) {
    return followCache.get(authorId) ? 'suggested' : 'idle';
  }
  return initialIsFollowing ? 'suggested' : 'idle';
}

/**
 * @param authorId          — ID do perfil do autor
 *                            (post.author.id | local.owner.id | service.provider.id)
 * @param initialIsFollowing — estado inicial vindo da API.
 *                            PostAuthor.isFollowing é obrigatório no schema OpenAPI — usar sempre.
 *                            LocalOwner e Provider não têm → false (default).
 * @param currentUserId     — ID do utilizador autenticado (de useAuth().user?.id)
 *                            Quando igual a authorId, o botão deve ser ocultado.
 */
export function useSuggest(
  authorId: string | undefined | null,
  initialIsFollowing = false,
  currentUserId?: string | null,
): UseSuggestReturn {
  const [state, setState] = useState<SuggestState>(() =>
    getInitialState(authorId, initialIsFollowing),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard para evitar set de estado após unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Detectar auto-sugestão
  const isSelf = Boolean(
    authorId &&
    currentUserId &&
    String(authorId).trim() === String(currentUserId).trim(),
  );

  // ── Recuperar estado do backend no mount ─────────────────────────────────
  // Tenta GET /api/users/{id}/ para obter o estado real de seguimento.
  // Condições para executar:
  //   - authorId válido
  //   - não é o próprio utilizador
  //   - utilizador autenticado (token presente)
  //   - initialIsFollowing=false (se já for true, não é necessário — já está confirmado)
  //   - sem cache de sessão (se o cache já tem o estado, não fazer chamada extra)
  useEffect(() => {
    if (!authorId || isSelf || !tokenStore.getAccess()) return;
    // Se já temos um estado confirmado no cache, não fazer chamada extra
    if (followCache.has(authorId)) return;
    // Se initialIsFollowing=true, o pai passou um estado confirmado pela API — confiar
    if (initialIsFollowing) return;

    // GET /api/users/{id}/ para recuperar isFollowing após reload
    // O schema oficial não define o response body, mas a API pode retornar isFollowing
    // em: data.isFollowing | data.stats.isFollowing | data.user.isFollowing
    const fetchFollowState = async () => {
      try {
        const { data } = await usersApi.getPublicProfile(authorId);
        if (!data || !mountedRef.current) return;

        // Tentar extrair isFollowing de várias estruturas possíveis
        const raw = data as any;
        const isFollowing: boolean | undefined =
          typeof raw.isFollowing === 'boolean'             ? raw.isFollowing :
          typeof raw.stats?.isFollowing === 'boolean'      ? raw.stats.isFollowing :
          typeof raw.user?.isFollowing === 'boolean'       ? raw.user.isFollowing :
          typeof raw.data?.isFollowing === 'boolean'       ? raw.data.isFollowing :
          undefined;

        if (typeof isFollowing === 'boolean') {
          followCache.set(authorId, isFollowing);
          if (mountedRef.current) {
            setState(isFollowing ? 'suggested' : 'idle');
          }
        }
        // Se isFollowing não existir na resposta (LocalOwner sem campo), manter estado atual — sem erro
      } catch {
        // Falha silenciosa — manter estado inicial
      }
    };

    fetchFollowState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId]);

  // ── Toggle follow/unfollow ───────────────────────────────────────────────
  const toggle = useCallback(async () => {
    if (state === 'loading') return;

    if (!authorId) {
      setErrorMessage('Não foi possível identificar o perfil do autor.');
      setState('error');
      return;
    }

    if (isSelf) {
      setErrorMessage('Não podes sugerir o teu próprio perfil.');
      setState('error');
      return;
    }

    if (!tokenStore.getAccess()) {
      setErrorMessage('Inicia sessão para sugerir este perfil.');
      setState('error');
      return;
    }

    const previousState = state;
    setErrorMessage(null);
    setState('loading');

    try {
      const isCurrentlySuggested = previousState === 'suggested';

      // POST   /api/users/{id}/follow/   → FollowResponse   { success, isFollowing }
      // DELETE /api/users/{id}/follow/   → UnfollowResponse { success, isFollowing }
      const { data, error } = isCurrentlySuggested
        ? await usersApi.unfollow(authorId)
        : await usersApi.follow(authorId);

      if (!mountedRef.current) return;

      if (error || !data) {
        setErrorMessage(error ?? 'Não foi possível processar o pedido. Tenta novamente.');
        setState(previousState);
        return;
      }

      // Sucesso — actualizar cache e estado com valor confirmado pelo backend
      followCache.set(authorId, data.isFollowing);
      setState(data.isFollowing ? 'suggested' : 'idle');
      setErrorMessage(null);
    } catch {
      if (mountedRef.current) {
        setErrorMessage('Erro de rede. Verifica a ligação e tenta novamente.');
        setState(previousState);
      }
    }
  }, [authorId, isSelf, state]);

  return {
    state,
    isLoading: state === 'loading',
    isSuggested: state === 'suggested',
    isSelf,
    errorMessage,
    toggle,
  };
}

/**
 * Limpa o cache de seguimento.
 * Deve ser chamado no logout para evitar que o estado de um utilizador
 * seja visto por outro utilizador na mesma sessão de browser.
 */
export function clearFollowCache(): void {
  followCache.clear();
}
