/**
 * useReviews — hook de avaliações
 *
 * Fonte de verdade: openapi-schema(3).yaml
 *
 * Endpoints usados:
 *   GET  /api/locals/{id}/reviews/   → LocalReview[]
 *   GET  /api/services/{id}/reviews/ → ServiceReview[]
 *   POST /api/locals/{id}/reviews/   { rating: 1-5, comment: string }
 *   POST /api/services/{id}/reviews/ { rating: 1-5, comment: string }
 *
 * LocalReview: { id, rating, comment, author, createdAt, helpful }
 */

import { useState, useEffect } from 'react';
import { reviewsApi } from '@/services/api';
import type { LocalReview, ServiceReview } from '@/types/api';

type Review = LocalReview | ServiceReview;

export interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  rawDebug: unknown;           // debug: resposta bruta da API
  reload: () => void;
  createReview: (rating: number, comment: string) => Promise<boolean>;
  markHelpful: (id: string) => Promise<void>;
  clearError: () => void;
}

export function useReviews(
  resourceType: 'local' | 'service',
  resourceId: string,
): UseReviewsReturn {
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [rawDebug, setRawDebug] = useState<unknown>(null);
  const [tick,     setTick]     = useState(0);   // incrementado para forçar reload

  // ── fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!resourceId || resourceId === 'undefined' || resourceId === 'null') {
      console.warn('[useReviews] resourceId inválido:', resourceId);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      console.log(`[useReviews] GET ${resourceType} reviews — id: ${resourceId}`);

      const resp =
        resourceType === 'local'
          ? await reviewsApi.getForLocal(resourceId)
          : await reviewsApi.getForService(resourceId);

      if (cancelled) return;

      // Guardar resposta bruta para debug
      setRawDebug(resp);
      console.log('[useReviews] resposta bruta completa:', JSON.stringify(resp, null, 2));

      if (resp.error) {
        console.warn('[useReviews] erro da API:', resp.error);
        // 404 = sem reviews ainda — não é erro de UI
        if (!resp.error.includes('404')) setError(resp.error);
        setReviews([]);
        setLoading(false);
        return;
      }

      // ── Normalizar a resposta para sempre obter Review[] ──────────────────
      // O schema diz que a API retorna array directo.
      // O apiFetch extrai body.data se existir.
      // Possibilidades reais:
      //   resp.data = Review[]                    (array directo — schema)
      //   resp.data = { results: Review[] }       (DRF paginado)
      //   resp.data = { reviews: Review[] }       (envelope custom)
      //   resp.data = { data: Review[] }          (envelope duplo improvável)
      //   resp.data = null | undefined            (sem conteúdo)
      const raw = resp.data;
      let list: Review[] = [];

      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        if      (Array.isArray(r.results)) list = r.results as Review[];
        else if (Array.isArray(r.reviews)) list = r.reviews as Review[];
        else if (Array.isArray(r.data))    list = r.data    as Review[];
        else {
          // Último recurso: se for um objecto com id e rating, é uma review única
          if ('id' in r && 'rating' in r) list = [raw as Review];
        }
      }

      console.log(`[useReviews] ${list.length} review(s) extraída(s):`, list);
      setReviews(list);
      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [resourceId, resourceType, tick]);

  const reload = () => setTick(t => t + 1);

  // ── criar review ─────────────────────────────────────────────────────────────
  const createReview = async (rating: number, comment: string): Promise<boolean> => {
    if (!rating || rating < 1 || rating > 5) {
      setError('Selecciona uma classificação entre 1 e 5 estrelas.');
      return false;
    }
    if (!comment || !comment.trim()) {
      setError('Escreve um comentário antes de enviar.');
      return false;
    }
    if (!resourceId || resourceId === 'undefined') {
      setError('ID do recurso inválido.');
      return false;
    }

    setError(null);
    const body = { rating, comment: comment.trim() };
    console.log('[useReviews] POST review:', body, 'para', resourceId);

    const resp =
      resourceType === 'local'
        ? await reviewsApi.createForLocal(resourceId, body)
        : await reviewsApi.createForService(resourceId, body);

    console.log('[useReviews] resposta POST:', resp);

    if (resp.error) {
      setError(resp.error);
      return false;
    }

    // Inserir review criada imediatamente (optimistic)
    if (resp.data) {
      const created = ((resp.data as any).review ?? resp.data) as Review;
      if ((created as any)?.id) {
        setReviews(prev => [created, ...prev]);
      }
    }

    // Recarregar do backend para confirmar
    reload();
    return true;
  };

  // ── marcar como útil ─────────────────────────────────────────────────────────
  const markHelpful = async (id: string): Promise<void> => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    const wasHelpful = review.hasMarkedHelpful ?? false;

    // Optimistic update
    setReviews(prev => prev.map(r =>
      r.id === id
        ? { ...r, hasMarkedHelpful: !wasHelpful, helpful: wasHelpful ? Math.max(0, (r.helpful || 1) - 1) : (r.helpful || 0) + 1 }
        : r
    ));

    const resp = await reviewsApi.markHelpful(id);
    if (resp.error) {
      // Rollback
      setReviews(prev => prev.map(r =>
        r.id === id
          ? { ...r, hasMarkedHelpful: wasHelpful, helpful: wasHelpful ? (r.helpful || 0) + 1 : Math.max(0, (r.helpful || 1) - 1) }
          : r
      ));
      if (!resp.error.includes('404')) setError(resp.error);
    }
  };

  const clearError = () => setError(null);

  return { reviews, loading, error, rawDebug, reload, createReview, markHelpful, clearError };
}
