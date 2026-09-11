import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Heart, Share2, Bookmark, MapPin,
  Star, MessageCircle, Send, Loader2,
} from 'lucide-react';
import { localsApi, reviewsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { Local } from '@/types';
import { translateUserType } from '@/utils/translations';
import { useScrollTop } from '@/hooks/useScrollTop';

interface LocalDetailProps {
  local: Local;
  onBack: () => void;
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
}

export default function LocalDetail({
  local, onBack, onAuthorPress }: LocalDetailProps) {
  useScrollTop();
  const { user } = useAuth();

  const [isLiked, setIsLiked]       = useState(local.liked || false);
  const [isSaved, setIsSaved]       = useState(local.saved || false);
  const [likesCount, setLikesCount] = useState(local.likesCount || 0);
  const [savesCount, setSavesCount] = useState(local.savesCount || 0);
  const [isActing, setIsActing]     = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reviews
  const [reviews, setReviews]               = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating]           = useState(0);
  const [newComment, setNewComment]         = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError]       = useState('');
  const [reviewSuccess, setReviewSuccess]   = useState('');

  // ── Carregar reviews ────────────────────────────────────────────────────────
  // GET /api/locals/{id}/reviews/
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingReviews(true);
        const { data, error } = await reviewsApi.getForLocal(local.id);
        if (error) {
          console.warn('[LocalDetail] reviews error:', error);
          setReviews([]);
          return;
        }
        // API devolve: array directo OU { reviews: [...] } OU { results: [...] }
        const list: any[] = Array.isArray(data)
          ? data
          : (data?.reviews ?? data?.results ?? []);
        setReviews(list);
      } catch (err) {
        console.error('[LocalDetail] reviews exception:', err);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    load();
  }, [local.id]);

  // ── Like ────────────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (isActing) return;
    try {
      setIsActing(true);
      setIsLiked(p => !p);
      setLikesCount(p => isLiked ? p - 1 : p + 1);
      // Backend doesn't have toggleLike for locals yet — visual only
      // await localsApi.toggleLike?.(local.id);
    } catch {
      setIsLiked(p => !p);
      setLikesCount(p => isLiked ? p + 1 : p - 1);
    } finally {
      setIsActing(false);
    }
  };

  // ── Guardar ─────────────────────────────────────────────────────────────────
  // Nota: API atual não tem endpoint de save para locais.
  // O toggle é feito apenas visualmente (em memória).
  const handleSave = () => {
    if (isActing) return;
    setIsSaved(p => !p);
    setSavesCount(p => isSaved ? p - 1 : p + 1);
  };

  // ── Partilhar ───────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: local.name, text: local.description, url: window.location.href });
      }
    } catch { /* cancelado pelo utilizador */ }
  };

  // ── Submeter avaliação ──────────────────────────────────────────────────────
  // POST /api/locals/{id}/reviews/  body: { rating: 1-5, comment: string }
  const handleSubmitReview = async () => {
    if (!user) {
      setReviewError('Faz login para deixar uma avaliação.');
      return;
    }
    if (newRating === 0) {
      setReviewError('Seleciona uma classificação de 1 a 5 estrelas.');
      return;
    }
    if (!newComment.trim()) {
      setReviewError('Escreve um comentário para enviar a avaliação.');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError('');
      setReviewSuccess('');

      const { data, error } = await reviewsApi.createForLocal(local.id, {
        rating:  newRating,
        comment: newComment.trim(),
      });

      if (error) {
        setReviewError(error);
        return;
      }

      // Adicionar a nova review ao topo da lista
      const newReview = data?.review ?? data;
      if (newReview) {
        setReviews(prev => [newReview, ...prev]);
      }

      setNewRating(0);
      setNewComment('');
      setReviewSuccess('Avaliação enviada com sucesso!');
      setTimeout(() => setReviewSuccess(''), 3000);

    } catch {
      setReviewError('Erro ao enviar avaliação. Tenta novamente.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const images: string[] = local.images?.length ? local.images : [PLACEHOLDER_IMAGE];

  return (
    <div className="min-h-screen bg-white pb-24">

      {/* ── GALERIA ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="relative w-full bg-gray-900 overflow-hidden"
        style={{ height: '70vh', maxHeight: 500, minHeight: 300 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <img
          src={images[currentImageIndex]}
          alt={local.name}
          className="w-full h-full object-contain"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
        />

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-2'
                }`}
              />
            ))}
          </div>
        )}

        {/* Botão voltar */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/90 rounded-lg"
        >
          <ChevronLeft size={24} className="text-gray-900" />
        </motion.button>

        {/* Acções */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike} disabled={isActing}
            className={`p-2 rounded-lg transition-colors ${isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-900'}`}>
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare}
            className="p-2 bg-white/90 rounded-lg text-gray-900">
            <Share2 size={20} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} disabled={isActing}
            className={`p-2 rounded-lg transition-colors ${isSaved ? 'bg-[#1B5E3B] text-white' : 'bg-white/90 text-gray-900'}`}>
            <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── CONTEÚDO ────────────────────────────────────────────────────────── */}
      <motion.div
        className="px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Título e rating */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{local.name}</h1>
          <div className="flex items-center gap-1">
            <Star size={18} className="text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-gray-900">{local.rating?.toFixed(1) ?? '0.0'}</span>
            <span className="text-sm text-gray-500">({local.reviewsCount ?? reviews.length} avaliações)</span>
          </div>
        </div>

        {/* Localização */}
        {local.location?.address && (
          <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <MapPin size={18} className="text-[#1B5E3B] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{local.location.address}</p>
              {local.location.lat !== 0 && (
                <p className="text-xs text-gray-500">
                  {local.location.lat?.toFixed(4)}, {local.location.lng?.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Descrição */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Sobre</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{local.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{likesCount}</p>
            <p className="text-xs text-gray-500">Curtidas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{savesCount}</p>
            <p className="text-xs text-gray-500">Guardados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-xs text-gray-500">Avaliações</p>
          </div>
        </div>

        {/* Autor */}
        {local.author?.name && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Adicionado por</p>
            <motion.button
              className="flex items-center gap-3 w-full text-left"
              onClick={() => onAuthorPress?.({
                id: local.author.id || '',
                name: local.author.name,
                avatar: local.author.avatar ?? undefined,
                type: local.author.type,
              })}
              whileHover={onAuthorPress ? { opacity: 0.75 } : {}}
              style={{ cursor: onAuthorPress ? 'pointer' : 'default' }}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#1B5E3B] to-[#2BB5C8] flex items-center justify-center flex-shrink-0">
                {local.author.avatar ? (
                  <img src={local.author.avatar} alt={local.author.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {local.author.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{local.author.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500">{translateUserType(local.author.type)}</p>
                  {onAuthorPress && <span className="text-xs text-[#1B5E3B] font-semibold">Ver perfil →</span>}
                </div>
              </div>
            </motion.button>
          </div>
        )}

        {/* ── LISTA DE AVALIAÇÕES ──────────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MessageCircle size={18} />
            Avaliações {reviews.length > 0 && `(${reviews.length})`}
          </h2>

          {loadingReviews ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review: any, idx: number) => (
                <div key={review.id ?? idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B5E3B] to-[#2BB5C8] flex items-center justify-center flex-shrink-0">
                      {review.author?.avatar ? (
                        <img src={review.author.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {(review.author?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{review.author?.name || 'Utilizador'}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11}
                            fill={i < review.rating ? '#FBBF24' : 'none'}
                            stroke={i < review.rating ? 'none' : '#D1D5DB'} />
                        ))}
                        <span className="text-[10px] text-gray-400 ml-1">
                          {new Date(review.createdAt || review.created_at || '').toLocaleDateString('pt-MZ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              Sem avaliações ainda. Sê o primeiro!
            </p>
          )}
        </div>

        {/* ── FORMULÁRIO DE AVALIAÇÃO ──────────────────────────────────────── */}
        {user ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-bold text-gray-900 mb-3">Deixa a tua avaliação</p>

            {/* Estrelas */}
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setNewRating(n)}>
                  <Star
                    size={28}
                    fill={n <= newRating ? '#FBBF24' : 'none'}
                    stroke={n <= newRating ? '#FBBF24' : '#D1D5DB'}
                    className="transition-transform hover:scale-110"
                  />
                </button>
              ))}
              {newRating > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  {['', 'Mau', 'Razoável', 'Bom', 'Muito bom', 'Excelente'][newRating]}
                </span>
              )}
            </div>

            <textarea
              placeholder="Partilha a tua experiência com este local..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B] resize-none mb-2"
            />

            <AnimatePresence mode="wait">
              {reviewError && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-500 font-semibold mb-2"
                >
                  {reviewError}
                </motion.p>
              )}
              {reviewSuccess && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-green-600 font-semibold mb-2"
                >
                  ✓ {reviewSuccess}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmitReview}
              disabled={submittingReview || newRating === 0}
              className="w-full py-3 flex items-center justify-center gap-2 text-white font-bold text-sm rounded-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}
            >
              {submittingReview ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  Enviar avaliação
                </>
              )}
            </motion.button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-[#1B5E3B]">Faz login</span> para deixar uma avaliação.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
