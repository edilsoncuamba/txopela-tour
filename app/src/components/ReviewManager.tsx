/**
 * ReviewManager - Sistema completo de avaliações e reviews (Refatorado)
 * 
 * Arquitetura limpa:
 * - useReviews: Custom hook para lógica de negócio
 * - ReviewForm: Componente de formulário isolado
 * - ReviewCard: Componente de card de review isolado
 * - ReviewManager: Componente orquestrador
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReviews } from './reviews/useReviews';
import ReviewForm from './reviews/ReviewForm';
import ReviewCard from './reviews/ReviewCard';

interface ReviewManagerProps {
  resourceType: 'local' | 'service';
  resourceId: string;
  onReviewsUpdated?: () => void;
  showCreateForm?: boolean;
}

export default function ReviewManager({
  resourceType,
  resourceId,
  onReviewsUpdated,
  showCreateForm = true,
}: ReviewManagerProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportingReview, setReportingReview] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const {
    reviews,
    loading,
    error,
    currentPage,
    totalPages,
    sortBy,
    setSortBy,
    setCurrentPage,
    createReview,
    markHelpful,
    markUnhelpful,
    reportReview,
    clearError,
  } = useReviews({
    resourceType,
    resourceId,
    userId: user?.id,
  });

  // Handle submit — apenas criação (editar/eliminar não suportado pelo backend)
  const handleSubmit = async () => {
    setSubmitting(true);

    const success = await createReview(rating, comment);

    if (success) {
      setShowForm(false);
      setRating(5);
      setComment('');
      onReviewsUpdated?.();
    }

    setSubmitting(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setRating(5);
    setComment('');
  };

  // Handle report
  const handleReport = async (reviewId: string) => {
    if (!reportReason.trim()) return;
    await reportReview(reviewId, reportReason);
    setReportingReview(null);
    setReportReason('');
  };

  return (
    <div className="space-y-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: '#1A1A1A' }}>
          Avaliações
        </h2>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            <option value="recent">Mais recentes</option>
            <option value="rating">Melhor avaliadas</option>
            <option value="helpful">Mais úteis</option>
          </select>

          {/* Create button */}
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
      </div>

      {/* Error message */}
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
            <button onClick={clearError}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
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
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
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
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onEdit={() => {}}
              onDelete={() => {}}
              onMarkHelpful={markHelpful}
              onMarkUnhelpful={markUnhelpful}
              onReport={(id) => setReportingReview(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: currentPage === 1 ? '#F3F4F6' : '#1B5E3B',
              color: currentPage === 1 ? '#9CA3AF' : 'white',
            }}
          >
            <ChevronLeft size={18} />
          </motion.button>

          <span className="text-sm font-bold px-3" style={{ color: '#6B7280' }}>
            {currentPage} de {totalPages}
          </span>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: currentPage === totalPages ? '#F3F4F6' : '#1B5E3B',
              color: currentPage === totalPages ? '#9CA3AF' : 'white',
            }}
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      )}

      {/* Report modal */}
      <AnimatePresence>
        {reportingReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setReportingReview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"
            >
              <h3 className="text-lg font-black" style={{ color: '#1A1A1A' }}>
                Reportar Avaliação
              </h3>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Descreve o motivo da denúncia..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: '#E5E7EB' }}
              />

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReport(reportingReview)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#DC2626' }}
                >
                  Enviar Denúncia
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setReportingReview(null);
                    setReportReason('');
                  }}
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
