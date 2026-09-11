import { useState } from 'react';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollTop } from '@/hooks/useScrollTop';
import {
  ChevronLeft, Heart, MessageCircle, Share2, Bookmark,
  MapPin, ChevronLeft as Prev, ChevronRight as Next,
  Navigation, Flag, X, Loader2,
} from 'lucide-react';
import Comments from '@/components/Comments';
import LocationCard from '@/components/shared/LocationCard';
import { fromApi, hasLocation } from '@/utils/normalizeLocation';
import { postsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Post {
  id: string;
  author: { id: string; name: string; avatar?: string; type: string };
  description: string;
  image?: string;
  images?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  local_name?: string;
  local_category?: string;
  local_address?: string;
  local_lat?: string;
  local_lng?: string;
  // Campos de localização detalhados
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    province?: string;
    district?: string;
    city?: string;
    administrative_area?: string;
    locality?: string;
    suburb?: string;
    nearby_reference?: string;
  };
  province?: string;
  district?: string;
  city?: string;
  address?: string;
}

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onAuthorPress?: (author: Post['author']) => void;
}

const categoryConfig: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  praias:      { label: 'Praias',      emoji: 'ðŸ–ï¸', color: 'text-sky-600',    bg: 'bg-sky-50'    },
  cultura:     { label: 'Cultura',     emoji: 'ðŸ›ï¸', color: 'text-amber-600',  bg: 'bg-amber-50'  },
  gastronomia: { label: 'Gastronomia', emoji: 'ðŸ½ï¸', color: 'text-orange-600', bg: 'bg-orange-50' },
  aventura:    { label: 'Aventura',    emoji: 'ðŸ„', color: 'text-emerald-600', bg: 'bg-emerald-50'},
  natureza:    { label: 'Natureza',    emoji: '🌿', color: 'text-green-600',   bg: 'bg-green-50'  },
};

const typeLabels: Record<string, string> = {
  guide: 'Guia Turístico', traveler: 'Viajante',
  resident: 'Morador Local', business: 'Negócio',
};

export default function PostDetail({
  post, onBack, onLike, onSave, onShare, onAuthorPress }: PostDetailProps) {
  useScrollTop();
  const { user } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [showComments, setShowComments] = useState(false);

  // Like state — inicializado com o que vem do post
  const [isLiked, setIsLiked]       = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking]     = useState(false);

  // Save state
  const [isSaved, setIsSaved]       = useState(post.is_saved);
  const [savesCount, setSavesCount] = useState(post.saves_count);
  const [isSaving, setIsSaving]     = useState(false);

  // Report state
  const [showReport, setShowReport]   = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportDone, setReportDone]   = useState(false);

  // ── POST/DELETE /api/posts/{id}/like/ ──────────────────────────────────────
  const handleLike = async () => {
    if (isLiking) return;
    // Optimistic update
    const prev = isLiked;
    setIsLiked(!prev);
    setLikesCount(n => prev ? Math.max(0, n - 1) : n + 1);
    setIsLiking(true);
    try {
      const { data, error } = prev
        ? await postsApi.unlike(post.id)   // DELETE /api/posts/{id}/like/
        : await postsApi.like(post.id);    // POST   /api/posts/{id}/like/
      if (error || !data) {
        // Reverter
        setIsLiked(prev);
        setLikesCount(n => prev ? n + 1 : Math.max(0, n - 1));
      } else {
        // Confirmar com valores reais
        setIsLiked(data.hasLiked);
        setLikesCount(data.likesCount);
        onLike?.(post.id); // notifica o pai se necessário
      }
    } catch {
      setIsLiked(prev);
      setLikesCount(n => prev ? n + 1 : Math.max(0, n - 1));
    } finally {
      setIsLiking(false);
    }
  };

  // ── POST/DELETE /api/posts/{id}/save/ ──────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return;
    const prev = isSaved;
    setIsSaved(!prev);
    setSavesCount(n => prev ? Math.max(0, n - 1) : n + 1);
    setIsSaving(true);
    try {
      const { data, error } = prev
        ? await postsApi.unsave(post.id)
        : await postsApi.save(post.id);
      if (error || !data) {
        setIsSaved(prev);
        setSavesCount(n => prev ? n + 1 : Math.max(0, n - 1));
      } else {
        setIsSaved(data.hasSaved);
        onSave?.(post.id);
      }
    } catch {
      setIsSaved(prev);
      setSavesCount(n => prev ? n + 1 : Math.max(0, n - 1));
    } finally {
      setIsSaving(false);
    }
  };

  // ── POST /api/posts/{id}/report/ ───────────────────────────────────────────
  const handleReport = async () => {
    if (isReporting || !reportReason) return;
    setIsReporting(true);
    try {
      const { error } = await postsApi.report(
        post.id,
        reportReason,
        reportDetails.trim() || undefined,
      );
      if (!error) {
        setReportDone(true);
        setTimeout(() => { setShowReport(false); setReportDone(false); }, 2000);
      }
    } finally {
      setIsReporting(false);
    }
  };

  const images = post.images?.length ? post.images.slice(0, 5)
    : post.image ? [post.image] : [];

  const cat = categoryConfig[post.local_category || ''];

  return (
    <>
    <motion.div
      className="min-h-screen bg-[#f8fafc] pb-28"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative w-full bg-gray-900" style={{ height: '70vh', maxHeight: 500, minHeight: 300 }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage}
            src={images[currentImage] || PLACEHOLDER_IMAGE}
            alt="foto"
            className="absolute inset-0 w-full h-full object-contain"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        </AnimatePresence>

        {/* dark gradient bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-10 pb-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20"
          >
            <ChevronLeft size={20} className="text-white" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSave}
            disabled={isSaving}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20"
          >
            <Bookmark size={18} className={isSaved ? 'text-[#0077B6] fill-[#0077B6]' : 'text-white'} fill={isSaved ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {/* carousel arrows */}
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrentImage(i => (i === 0 ? images.length - 1 : i - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Prev size={16} className="text-white" />
            </button>
            <button onClick={() => setCurrentImage(i => (i === images.length - 1 ? 0 : i + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Next size={16} className="text-white" />
            </button>
          </>
        )}

        {/* dots */}
        {images.length > 1 && (
          <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrentImage(i)}
                className={`rounded-full transition-all duration-300 ${i === currentImage ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* author pill — bottom of hero */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAuthorPress?.(post.author)}
            className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/15 active:bg-black/50 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center flex-shrink-0">
              {post.author.avatar
                ? <img src={post.author.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                : <span className="text-[10px] font-bold text-white">{post.author.name.charAt(0)}</span>}
            </div>
            <div className="text-left">
              <p className="text-white text-xs font-semibold leading-tight">{post.author.name}</p>
              <p className="text-white/60 text-[10px]">{typeLabels[post.author.type]}</p>
            </div>
          </motion.button>

          <div className="flex flex-col items-end gap-1.5">
            {post.local_name && (
              <div className="flex items-center bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/15">
                <span className="text-white text-xs font-semibold">{post.local_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Thumbnail strip ────────────────────── */}
      {images.length > 1 && (
        <div className="flex items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {images.map((img, i) => (
              <motion.button key={i} onClick={() => setCurrentImage(i)} whileTap={{ scale: 0.93 }}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === currentImage ? 'border-[#0077B6] shadow-md' : 'border-transparent opacity-60'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </motion.button>
            ))}
            <div className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-semibold">
              {images.length}/5
            </div>
          </div>
        </div>
      )}

      {/* ── Action bar (simplified) ───────────────────────────────────── */}
      <div className="flex items-center bg-white border-b border-gray-100 px-2">
        {/* Like */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={handleLike} disabled={isLiking}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl transition-colors ${isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400'}`}>
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-semibold">Gosto</span>
        </motion.button>

        {/* Comentários */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl transition-colors ${showComments ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <MessageCircle size={20} fill={showComments ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-semibold">Comentar</span>
        </motion.button>

        {/* Partilhar */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => onShare?.(post.id)}
          className="flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl transition-colors text-gray-400">
          <Share2 size={20} />
          <span className="text-[10px] font-semibold">Partilhar</span>
        </motion.button>

        {/* Guardar */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={handleSave} disabled={isSaving}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl transition-colors ${isSaved ? 'text-[#0077B6] bg-blue-50' : 'text-gray-400'}`}>
          <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-semibold">Guardar</span>
        </motion.button>

        {/* Denunciar */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowReport(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl transition-colors text-gray-400 hover:text-amber-500">
          <Flag size={20} />
          <span className="text-[10px] font-semibold">Reportar</span>
        </motion.button>
      </div>

      {/* ── Comments Section ──────────────────────────────── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <Comments postId={post.id} commentsCount={post.comments_count} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="px-4 pt-5 space-y-4">

        {/* Description */}
        <p className="text-gray-800 text-sm leading-relaxed">{post.description}</p>

        {/* Suggested Services Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Serviços Recomendados
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {post.local_address ? `Próximos a ${post.local_address.split(',')[0]}` : 'Na sua região'}
            </p>
          </div>
          
          <div className="p-4">
            {/* Empty State */}
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Sem serviços publicados
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Explore por província ou distrito
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0077B6] to-[#2D6A4F] text-white text-xs font-semibold rounded-full shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/>
                  <line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
                Explorar Serviços
              </motion.button>
            </div>
          </div>
        </div>

        {/* Localização — hierarquia completa via modelo canónico */}
        {(() => {
          const loc = fromApi(post);
          return hasLocation(loc) ? (
            <LocationCard
              data={loc}
              showMap={!!(post.local_lat && post.local_lng)}
              publicationName={post.local_name}
            />
          ) : null;
        })()}

        {/* Map preview */}
        {post.local_lat && post.local_lng && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Map full width */}
            <div className="h-44 relative bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-100">
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#0077B6" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0077B6] shadow-xl flex items-center justify-center border-3 border-white">
                    <Navigation size={18} className="text-white" />
                  </div>
                  <div className="w-2 h-2 bg-[#0077B6]/30 rounded-full mt-1 blur-sm" />
                </motion.div>
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <p className="text-[9px] font-bold text-gray-500">
                    {parseFloat(post.local_lat).toFixed(3)}°, {parseFloat(post.local_lng).toFixed(3)}°
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>

      {/* ── Modal Report ─────────────────────────────────── */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowReport(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-white rounded-t-3xl px-5 pt-4 pb-10 space-y-4 max-w-lg"
            >
              {/* Handle */}
              <div className="flex justify-center mb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900">Denunciar publicação</h3>
                <button onClick={() => setShowReport(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {reportDone ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <p className="text-sm font-bold text-gray-700">Denúncia enviada</p>
                </div>
              ) : (
                <>
                  {/* Motivo */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Motivo</p>
                    {(['spam', 'inappropriate', 'fake', 'copyright', 'other'] as const).map(reason => (
                      <button
                        key={reason}
                        onClick={() => setReportReason(reason)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                          reportReason === reason
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-gray-50 text-gray-700 border border-transparent'
                        }`}
                      >
                        {reportReason === reason && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        )}
                        {{ spam: 'Spam', inappropriate: 'Conteúdo inapropriado', fake: 'Informação falsa', copyright: 'Violação de direitos', other: 'Outro motivo' }[reason]}
                      </button>
                    ))}
                  </div>

                  {/* Detalhes opcionais */}
                  <textarea
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Detalhes adicionais (opcional)..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                  />

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleReport}
                    disabled={isReporting}
                    className="w-full py-3 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: '#DC2626' }}
                  >
                    {isReporting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                    Enviar denúncia
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


