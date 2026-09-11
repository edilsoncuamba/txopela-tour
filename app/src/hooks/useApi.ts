/**
 * useApi — hook genérico para chamadas à API com estado de loading/error
 * Usa os módulos de api.ts e retorna { data, isLoading, error, refetch }
 */
import { useState, useEffect, useCallback } from 'react';

interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook genérico — recebe uma função que faz a chamada e retorna { data, error }
 * 
 * Exemplo:
 *   const { data, isLoading } = useApi(() => postsApi.list({ page: 1 }), []);
 */
export function useApi<T>(
  fetcher: () => Promise<{ data?: T; error?: string }>,
  deps: any[] = [],
): UseApiResult<T> {
  const [data, setData]       = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tick, setTick]       = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetcher()
      .then(res => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error);
          setData(null);
        } else {
          setData(res.data ?? null);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro de rede');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, isLoading, error, refetch };
}

export default useApi;
