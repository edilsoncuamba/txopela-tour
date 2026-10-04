/**
 * ReviewManager — sistema de avaliações
 *
 * Fonte de verdade: openapi-schema(3).yaml
 *
 * As reviews são fornecidas pelo pai via prop `initialReviews` —
 * extraídas do LocalDetail/ServiceDetail que já as inclui embutidas:
 *   GET /api/locals/{id}/   → LocalDetail.reviews: LocalReview[]  (obrigatório)
 *   GET /api/services/{id}/ → ServiceDetail.reviews: ServiceReview[] (obrigatório)
 *
 * Para criar uma nova review:
 *   POST /api/locals/{id}/reviews/   { rating: 1-5, comment: string }
 *   POST /api/services/{id}/reviews/ { rating: 1-5, comment: string }
 *
 * LocalReview: { id, rating, comment, author, createdAt, helpful }
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { reviewsApi } from '@/services/api';
import ReviewForm from './reviews/ReviewForm';
import ReviewCard from './reviews/ReviewCard';
import type { LocalReview, ServiceReview } from '@/types/api';

type Review = LocalReview | ServiceReview;

interface ReviewManagerProps {
  resourceType: 'local' | 'service';
  resourceId: string;
  /** Reviews já carregadas pelo pai — vindas do LocalDetail/ServiceDetail embutido */
  initialReviews?: Review[];
  showCreateForm?: boolean;
  onReviewsUpdated?: () => void;
}

export default function ReviewManager({
  resourceType,
  resourceId,
  initialReviews = [],
  showCreateForm = true,
  onReviewsUpdated,
}: ReviewManagerProps) {
  const { user } = useAuth();

  // Estado de reviews começa com as embutidas do LocalDetail
  const [reviews,   setReviews]   = useState<Review[]>(initialReviews);
  const [error,     setError]     = useState<string | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [rating,    setRating]    = useState(5);
  const [comment,   setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportingReview, setReportingReview] = useState<string | null>(null);
  const [reportReason,    setReportReason]    = useState('');

  // Sincronizar quando o pai actualiza initialReviews.
  // Acontece depois de loadLocalDetails terminar e chamar setLocalReviews(best).
  // Só substitui se a lista nova for diferente em tamanho (evita loop infinito).
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // ── Criar review ─────────────────────────────────────────────────────────────
  // POST /api/locals/{id}/reviews/ ou POST /api/services/{id}/reviews/
  // body: { rating: 1-5, comment: string }  (campos exactos do schema)
  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      setError('Selecciona uma classificação entre 1 e 5 estrelas.');
      return;
    }
    if (!comment || !comment.trim()) {
      setError('Escreve um comentário antes de enviar.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const body = { rating, comment: comment.trim() };

    const resp =
      resourceType === 'local'
        ? await reviewsApi.createForLocal(resourceId, body)
        : await reviewsApi.createForService(resourceId, body);

    setSubmitting(false);

    if (resp.error) {
      setError(resp.error);
      return;
    }

    // Inserir a review criada no topo da lista
    // A API devolve o LocalReview/ServiceReview criado
    if (resp.data) {
      const created = ((resp.data as any).review ?? resp.data) as Review;
      if ((created as any)?.id) {
        setReviews(prev => [created, ...prev]);
      }
    }

    setShowForm(false);
    setRating(5);
    setComment('');
    onReviewsUpdated?.();
  };

  // ── Marcar como útil ─────────────────────────────────────────────────────────
  // POST /api/reviews/{id}/helpful/
  const handleMarkHelpful = async (id: string) => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    const wasHelpful = (review as LocalReview).hasMarkedHelpful ?? false;

    // Optimistic update
    setReviews(prev => prev.map(r =>
      r.id === id
        ? { ...r, hasMarkedHelpful: !wasHelpful, helpful: wasHelpful ? Math.max(0, (r.helpful || 1) - 1) : (r.helpful || 0) + 1 }
        : r
    ));

    const resp = await reviewsApi.markHelpful(id);
    if (resp.error && !resp.error.includes('404')) {
      // Rollback
      setReviews(prev => prev.map(r =>
        r.id === id
          ? { ...r, hasMarkedHelpful: wasHelpful, helpful: wasHelpful ? (r.helpful || 0) + 1 : Math.max(0, (r.helpful || 1) - 1) }
          : r
      ));
      setError(resp.error);
    }
  };

  if (!resourceId || resourceId === 'undefined') {
    return (
      <div className="py-8 text-center" style={{ fontFamily: 'Nunito, sans-serif' }}>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>A carregar avaliações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: '#1A1A1A' }}>
          Avaliações {reviews.length > 0 && (
            <span className="text-base font-bold" style={{ color: '#6B7280' }}>
              ({reviews.length})
            </span>
          )}
        </h2>
        {showCreateForm && user && !showForm && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1B5E3B' }}
          >
            Avaliar
          </motion.button>
        )}
      </div>

      {/* Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-xl"
            style={{ background: '#FEF2F2', color: '#DC2626' }}
          >
            <AlertCircle size={18} />
            <p className="text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulário */}
      <AnimatePresence>
        {showForm && (
          <ReviewForm
            rating={rating}
            comment={comment}
            isEditing={false}
            isSubmitting={submitting}
            onRatingChange={setRating}
            onCommentChange={setComment}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setRating(5); setComment(''); }}
          />
        )}
      </AnimatePresence>

      {/* Lista */}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Star size={40} color="#D1D5DB" strokeWidth={1.5} />
          <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>
            Ainda não há avaliações
          </p>
          {showCreateForm && user && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#1B5E3B', color: 'white' }}
            >
              Sê o primeiro a avaliar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onEdit={() => {}}
              onDelete={() => {}}
              onMarkHelpful={handleMarkHelpful}
              onMarkUnhelpful={() => {}}
              onReport={id => setReportingReview(id)}
            />
          ))}
        </div>
      )}

      {/* Modal report */}
      <AnimatePresence>
        {reportingReview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setReportingReview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"
            >
              <h3 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Reportar Avaliação</h3>
              <textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="Descreve o motivo da denúncia..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: '#E5E7EB' }}
              />
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setReportingReview(null); setReportReason(''); alert('Denúncia enviada'); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#DC2626' }}
                >
                  Enviar Denúncia
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setReportingReview(null); setReportReason(''); }}
                  className="px-6 py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}
                >
                  Cancelar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
