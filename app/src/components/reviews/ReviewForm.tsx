/**
 * ReviewForm - Formulário compacto de criação/edição de review
 */

import { motion } from 'framer-motion';
import { X, Star } from 'lucide-react';

interface ReviewFormProps {
  rating: number;
  comment: string;
  isEditing: boolean;
  isSubmitting: boolean;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ReviewForm({
  rating,
  comment,
  isEditing,
  isSubmitting,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl p-3 shadow-lg border"
      style={{ borderColor: '#E5E7EB' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>
          {isEditing ? 'Editar Avaliação' : 'Avaliar este local'}
        </h3>
        <button
          onClick={onCancel}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X size={14} style={{ color: '#6B7280' }} />
        </button>
      </div>

      <div className="space-y-2">
        {/* Rating Stars */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRatingChange(star)}
              className="cursor-pointer"
            >
              <Star
                size={24}
                fill={rating >= star ? '#FBBF24' : 'none'}
                stroke={rating >= star ? '#FBBF24' : '#D1D5DB'}
                strokeWidth={1.5}
              />
            </motion.button>
          ))}
        </div>

        {/* Comment — obrigatório segundo o schema (minLength: 1) */}
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Escreve o teu comentário..."
          rows={2}
          maxLength={500}
          className="w-full px-3 py-2 rounded-xl border text-sm leading-snug resize-none focus:outline-none focus:border-[#1B5E3B] transition-colors"
          style={{
            borderColor: comment.trim().length === 0 ? '#FCA5A5' : '#E5E7EB',
            color: '#1A1A1A',
            background: '#FAFAFA',
          }}
        />
        {comment.trim().length === 0 && (
          <p className="text-xs" style={{ color: '#EF4444' }}>
            O comentário é obrigatório.
          </p>
        )}

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          disabled={isSubmitting || comment.trim().length === 0}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{
            background: isSubmitting || comment.trim().length === 0 ? '#9CA3AF' : '#1B5E3B',
          }}
        >
          {isSubmitting
            ? 'A enviar...'
            : isEditing
            ? 'Atualizar avaliação'
            : 'Enviar avaliação'}
        </motion.button>
      </div>
    </motion.div>
  );
}
