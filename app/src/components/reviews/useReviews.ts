/**
 * useReviews - Hook customizado para gerenciar reviews
 */

import { useState, useEffect, useCallback } from 'react';
import { reviewsApi } from '@/services/api';
import type { LocalReview, ServiceReview } from '@/types/api';

type Review = LocalReview | ServiceReview;

interface UseReviewsParams {
  resourceType: 'local' | 'service';
  resourceId: string;
  userId?: string;
}

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  sortBy: 'recent' | 'rating' | 'helpful';
  setSortBy: (sort: 'recent' | 'rating' | 'helpful') => void;
  setCurrentPage: (page: number) => void;
  loadReviews: () => Promise<void>;
  createReview: (rating: number, comment: string) => Promise<boolean>;
  markHelpful: (id: string) => Promise<void>;
  markUnhelpful: (id: string) => Promise<void>;
  reportReview: (id: string, reason: string) => Promise<void>;
  clearError: () => void;
}

export function useReviews({
  resourceType,
  resourceId,
  userId,
}: UseReviewsParams): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'helpful'>('recent');

  // Load reviews
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response =
        resourceType === 'local'
          ? await reviewsApi.getForLocal(resourceId, { page: currentPage, limit: 10 })
          : await reviewsApi.getForService(resourceId, { page: currentPage, limit: 10 });

      if (response.error) {
        if (response.error.includes('404')) {
          setReviews([]);
          setError(null);
        } else if (response.error.includes('500')) {
          setReviews([]);
          setError('Sistema de avaliações temporariamente indisponível');
          console.warn('Endpoint retornou 500:', response.error);
        } else {
          setError(response.error);
        }
        return;
      }

      const data = response.data;
      const reviewsList = data?.reviews || data?.results || [];
      setReviews(Array.isArray(reviewsList) ? reviewsList : []);

      if (data?.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      setReviews([]);
      setError('Erro ao carregar avaliações');
      console.error('Erro ao carregar reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [resourceId, resourceType, currentPage, sortBy]);

  // Create review
  const createReview = async (rating: number, comment: string): Promise<boolean> => {
    try {
      setError(null);
      const body = { rating, comment };

      const response =
        resourceType === 'local'
          ? await reviewsApi.createForLocal(resourceId, body)
          : await reviewsApi.createForService(resourceId, body);

      if (response.error) {
        if (response.error.includes('500')) {
          setError('Erro no servidor. Contacta o administrador.');
        } else if (response.error.includes('404')) {
          setError('Recurso não encontrado.');
        } else {
          setError(response.error);
        }
        return false;
      }

      await loadReviews();
      return true;
    } catch (err) {
      setError('Erro ao submeter avaliação');
      console.error(err);
      return false;
    }
  };

  // Mark/Unmark helpful (toggle usando apenas POST - API faz toggle automático)
  const markHelpful = async (id: string): Promise<void> => {
    try {
      const review = reviews.find((r) => r.id === id);
      if (!review) return;

      const wasHelpful = review.hasMarkedHelpful || false;
      const wasUnhelpful = review.hasMarkedUnhelpful || false;

      // Otimistic update - toggle helpful e remover unhelpful se existir
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                hasMarkedHelpful: !wasHelpful,
                hasMarkedUnhelpful: false, // Remove unhelpful quando marca helpful
                helpful: wasHelpful
                  ? Math.max(0, (r.helpful || 1) - 1)
                  : (r.helpful || 0) + 1,
                unhelpful: wasUnhelpful
                  ? Math.max(0, (r.unhelpful || 1) - 1)
                  : (r.unhelpful || 0),
              }
            : r
        )
      );

      // API call - apenas POST (backend faz toggle automático)
      try {
        const response = await reviewsApi.markHelpful(id);

        if (response.error) {
          // 404 = endpoint helpful não suportado para este tipo de review (ex: serviços)
          // Manter o estado optimista local — não reverter, não mostrar erro
          if (response.error.includes('404')) {
            console.warn(`[markHelpful] Endpoint não suportado para review ${id} (provável review de serviço). Estado local mantido.`);
            return;
          }

          // Rollback para outros erros
          setReviews((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    hasMarkedHelpful: wasHelpful,
                    hasMarkedUnhelpful: wasUnhelpful,
                    helpful: wasHelpful
                      ? (r.helpful || 0) + 1
                      : Math.max(0, (r.helpful || 1) - 1),
                    unhelpful: wasUnhelpful
                      ? (r.unhelpful || 0) + 1
                      : (r.unhelpful || 0),
                  }
                : r
            )
          );

          if (response.error.includes('401')) {
            setError('Precisas de fazer login para marcar como útil');
          } else if (response.error.includes('403')) {
            setError('Não tens permissão para esta ação');
          } else {
            setError('Erro ao registar voto. Tenta novamente.');
          }
          return;
        }

        // Sucesso: Atualizar com dados da API se disponíveis
        if (response.data && 'helpfulCount' in response.data) {
          setReviews((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    helpful: (response.data as any).helpfulCount,
                  }
                : r
            )
          );
        }

      } catch (apiError) {
        // API call falhou completamente
        setReviews((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  hasMarkedHelpful: wasHelpful,
                  hasMarkedUnhelpful: wasUnhelpful,
                  helpful: wasHelpful
                    ? (r.helpful || 0) + 1
                    : Math.max(0, (r.helpful || 1) - 1),
                  unhelpful: wasUnhelpful
                    ? (r.unhelpful || 0) + 1
                    : (r.unhelpful || 0),
                }
              : r
          )
        );
        setError('Erro de conexão. Verifica a tua internet.');
        console.warn('[markHelpful] Erro de rede:', apiError);
      }

    } catch (err) {
      setError('Erro inesperado ao registar voto');
      console.error('Unexpected error in markHelpful:', err);
      await loadReviews(); // Full rollback
    }
  };

  // Mark/Unmark unhelpful (apenas estado local - backend não suporta)
  const markUnhelpful = async (id: string): Promise<void> => {
    try {
      const review = reviews.find((r) => r.id === id);
      if (!review) return;

      const wasHelpful = review.hasMarkedHelpful || false;
      const wasUnhelpful = review.hasMarkedUnhelpful || false;

      // Se estava marcado como helpful, remove primeiro
      if (wasHelpful) {
        // Chama markHelpful para desmarcar (usa toggle da API)
        await markHelpful(id);
        // Aguarda um pouco para o state atualizar
        setTimeout(() => {
          // Agora marca como unhelpful localmente
          setReviews((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    hasMarkedUnhelpful: !wasUnhelpful,
                    unhelpful: wasUnhelpful
                      ? Math.max(0, (r.unhelpful || 1) - 1)
                      : (r.unhelpful || 0) + 1,
                  }
                : r
            )
          );
        }, 100);
        return;
      }

      // Otimistic update - toggle unhelpful apenas
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                hasMarkedUnhelpful: !wasUnhelpful,
                unhelpful: wasUnhelpful
                  ? Math.max(0, (r.unhelpful || 1) - 1)
                  : (r.unhelpful || 0) + 1,
              }
            : r
        )
      );

      console.log(`Unhelpful ${wasUnhelpful ? 'removed' : 'marked'} for review ${id} (local only)`);

    } catch (err) {
      setError('Erro ao registar voto inútil');
      console.error('Error in markUnhelpful:', err);
    }
  };

  // Report review
  const reportReview = async (id: string, reason: string): Promise<void> => {
    try {
      const response = await reviewsApi.report(id, reason);
      if (response.error) {
        setError(response.error);
        return;
      }
      alert('Denúncia enviada com sucesso');
    } catch (err) {
      setError('Erro ao enviar denúncia');
      console.error(err);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Load on mount and when deps change
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return {
    reviews,
    loading,
    error,
    currentPage,
    totalPages,
    sortBy,
    setSortBy,
    setCurrentPage,
    loadReviews,
    createReview,
    markHelpful,
    markUnhelpful,
    reportReview,
    clearError,
  };
}
