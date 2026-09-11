/**
 * ReviewCard - Card individual de review
 */

import { motion } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, MoreVertical, Flag } from 'lucide-react';
import { useState } from 'react';
import type { LocalReview, ServiceReview } from '@/types/api';

interface ReviewCardProps {
  review: LocalReview | ServiceReview;
  currentUserId?: string;
  onEdit: (review: LocalReview | ServiceReview) => void;
  onDelete: (id: string) => void;
  onMarkHelpful: (id: string) => void;
  onMarkUnhelpful: (id: string) => void;
  onReport: (id: string) => void;
}

export default function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
  onMarkHelpful,
  onMarkUnhelpful,
  onReport,
}: ReviewCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Handle different author types
  const author = 'author' in review && review.author ? review.author : null;
  const authorId   = author && typeof author === 'object' && 'id'     in author ? (author as any).id     : null;
  const authorName = author && typeof author === 'object' && 'name'   in author ? (author as any).name   : 'Utilizador';
  const authorAvatar = author && typeof author === 'object' && 'avatar' in author ? (author as any).avatar : null;
  
  const isAuthor = authorId === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm relative"
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
          style={{ background: '#E5E7EB' }}
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-lg font-bold"
              style={{ color: '#6B7280' }}
            >
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Stars */}
          <div className="flex items-center gap-2 mb-1">
            <p className="text-base font-black" style={{ color: '#1A1A1A' }}>
              {authorName}
            </p>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={review.rating >= s ? '#FBBF24' : 'none'}
                  stroke={review.rating >= s ? '#FBBF24' : '#D1D5DB'}
                  strokeWidth={1.5}
                />
              ))}
            </div>
          </div>

          {/* Comment */}
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#6B7280' }}>
            {review.comment}
          </p>

          {/* Helpful/Unhelpful Buttons - Bottom Left */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            {/* Útil */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMarkHelpful(review.id)}
              disabled={!currentUserId}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors"
              style={{
                background: (review.hasMarkedHelpful || false) ? '#E0F7FA' : '#F5F5F5',
                color: (review.hasMarkedHelpful || false) ? '#00ACC1' : '#9E9E9E',
              }}
            >
              <ThumbsUp
                size={14}
                fill={(review.hasMarkedHelpful || false) ? 'currentColor' : 'none'}
                strokeWidth={2}
              />
              {(review.helpful || 0) > 0 && (
                <span className="text-xs font-bold">{review.helpful}</span>
              )}
            </motion.button>

            {/* Inútil */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMarkUnhelpful(review.id)}
              disabled={!currentUserId}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors"
              style={{
                background: (review.hasMarkedUnhelpful || false) ? '#E0F7FA' : '#F5F5F5',
                color: (review.hasMarkedUnhelpful || false) ? '#00ACC1' : '#9E9E9E',
              }}
            >
              <ThumbsDown
                size={14}
                fill={(review.hasMarkedUnhelpful || false) ? 'currentColor' : 'none'}
                strokeWidth={2}
              />
              {(review.unhelpful || 0) > 0 && (
                <span className="text-xs font-bold">{review.unhelpful}</span>
              )}
            </motion.button>
          </div>

          {/* Date - Bottom Right */}
          <div className="absolute bottom-4 right-4">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              {new Date(review.createdAt).toLocaleDateString('pt-PT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Menu - Top Right */}
        {currentUserId && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={16} color="#9CA3AF" />
            </button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-10"
                style={{ minWidth: 160 }}
              >
                {isAuthor && (
                  <>
                    {/* Editar e Eliminar removidos: os endpoints DELETE/PUT /api/reviews/{id}/
                        não existem no OpenAPI. Apenas denúncia está disponível. */}
                  </>
                )}
                <button
                  onClick={() => {
                    onReport(review.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                  style={{ color: '#F59E0B' }}
                >
                  <Flag size={14} />
                  Reportar
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
