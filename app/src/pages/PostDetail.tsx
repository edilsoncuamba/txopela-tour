import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';
import {
  ChevronLeft, Heart, MessageCircle, Share2, Bookmark,
  MapPin, Flag, X, Loader2,
} from 'lucide-react';
import GalleryCarousel from '@/components/GalleryCarousel';
import ImageCarousel from '@/components/ImageCarousel';
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

const typeColors: Record<string, string> = {
  guide: '#F4821F', traveler: '#2BB5C8', resident: '#1B5E3B', business: '#7B5EA7',
};
const typeBg: Record<string, string> = {
  guide: '#FFF3E0', traveler: '#E0F7FA', resident: '#EEF7F0', business: '#F3E8FF',
};
const typeLabels: Record<string, string> = {
  guide: 'Guia', traveler: 'Viajante', resident: 'Residente', business: 'Negócio',
};

export default function PostDetail({
  post, onBack, onLike, onSave, onShare, onAuthorPress,
}: PostDetailProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#A8B4CC' : '#374151',
    text3:   isDark ? '#6B7A99' : '#9CA3AF',
    input:   isDark ? '#22263A' : '#ffffff',
    inputBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    reportBg:  isDark ? '#22263A' : '#F9FAFB',
    skel:    isDark ? '#22263A' : '#E5E7EB',
  };
  const [galleryPaused, setGalleryPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Like state
  const [isLiked, setIsLiked]       = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking]     = useState(false);

  // Save state
  const [isSaved, setIsSaved]       = useState(post.is_saved);
  const [savesCount, setSavesCount] = useState(post.saves_count);
  const [isSaving, setIsSaving]     = useState(false);

  // Report state
  const [showReport, setShowReport]       = useState(false);
  const [reportReason, setReportReason]   = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting]     = useState(false);
  const [reportDone, setReportDone]       = useState(false);

  // -- POST/DELETE /api/posts/{id}/like/ ------------------------------------
  const handleLike = async () => {
    if (isLiking) return;
    const prev = isLiked;
    setIsLiked(!prev);
    setLikesCount(n => prev ? Math.max(0, n - 1) : n + 1);
    setIsLiking(true);
    try {
      const { data, error } = prev
        ? await postsApi.unlike(post.id)
        : await postsApi.like(post.id);
      if (error || !data) {
        setIsLiked(prev);
        setLikesCount(n => prev ? n + 1 : Math.max(0, n - 1));
      } else {
        setIsLiked(data.hasLiked);
        setLikesCount(data.likesCount);
        onLike?.(post.id);
      }
    } catch {
      setIsLiked(prev);
      setLikesCount(n => prev ? n + 1 : Math.max(0, n - 1));
    } finally {
      setIsLiking(false);
    }
  };

  // -- POST/DELETE /api/posts/{id}/save/ ------------------------------------
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

  // -- POST /api/posts/{id}/report/ -----------------------------------------
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

  // Usa a lista completa devolvida pela API — até 10 imagens, sem truncar.
  // Mesmo padrão de HeritageDetail (módulo Cultura): images[] ? ImageCarousel.
  const images = post.images?.length
    ? post.images.slice(0, 10)           // respeita o limite máximo do schema (10)
    : post.image
      ? [post.image]
      : [PLACEHOLDER_IMAGE];

  const authorColor = typeColors[post.author.type] || '#6B7280';

  return (
    <>
      <motion.div
        className="pb-16"
        style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* CONTEÚDO — galeria + grid dentro do mesmo container */}
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-6 md:pt-6 px-4 pt-3 space-y-3 md:space-y-0">

          {/* GALERIA — ocupa as 2 colunas */}
          <div
            className="md:col-span-2 -mx-4 md:mx-0"
          >
            <div
              className="relative w-full overflow-hidden md:rounded-2xl"
              style={{ height: 'clamp(270px, 30vw, 370px)' }}
            >
              <GalleryCarousel
                images={images}
                alt={post.local_name || 'Publicação'}
              >
                {/* Top bar — z-30 para ficar acima dos botões do carousel (z-20) */}
                <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between" style={{ zIndex: 3 }}>
                  <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                  >
                    <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
                  </button>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onShare?.(post.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                    >
                      <Share2 size={16} className="text-white" strokeWidth={2} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleLike}
                      disabled={isLiking}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: isLiked ? '#F87171' : 'rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Heart size={16} fill={isLiked ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                    </motion.button>
                  </div>
                </div>

                {/* Bottom info — z-30 */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4" style={{ zIndex: 3 }}>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(post.location?.province || post.province) && (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-white/70" />
                          <span className="text-white/80 text-xs">{post.location?.province || post.province}</span>
                        </div>
                      )}
                      {post.local_name && (
                        <>
                          <span className="text-white/40">·</span>
                          <span className="text-white/80 text-xs">{post.local_name}</span>
                        </>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                    >
                      <Heart size={11} fill={isLiked ? '#F87171' : 'none'} stroke={isLiked ? '#F87171' : 'white'} />
                      <span className="text-white text-[11px] font-bold">{likesCount}</span>
                    </div>
                  </div>
                </div>
              </GalleryCarousel>
            </div>
          </div>

          {/* Coluna esquerda */}
          <div className="space-y-3">

            {/* Autor */}
            <div className="flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onAuthorPress?.(post.author)}
                className="flex items-center gap-2"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${authorColor}, #2BB5C8)` }}
                >
                  {post.author.avatar
                    ? <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                    : post.author.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-black" style={{ color: dm.text }}>{post.author.name}</p>
              </motion.button>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: typeBg[post.author.type] || '#F3F4F6', color: authorColor }}
              >
                {typeLabels[post.author.type] || post.author.type}
              </span>
            </div>

            {/* Descrição */}
            <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
              style={{ background: dm.surface }}>
              <h2 className="text-xs font-black" style={{ color: dm.text }}>Publicação</h2>
              <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                <p className="text-sm leading-relaxed text-justify" style={{ color: dm.text2 }}>
                  {post.description}
                </p>
              </div>
            </div>

            {/* Acções sociais */}
            <div className="rounded-2xl shadow-sm overflow-hidden"
              style={{ background: dm.surface, border: `1px solid ${dm.border}` }}>
              <div className="flex items-center divide-x" style={{ '--tw-divide-opacity': 1 } as any}>
                {/* Gosto */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex-1 flex flex-col items-center gap-0.5 py-3"
                >
                  <Heart
                    size={19}
                    fill={isLiked ? '#F87171' : 'none'}
                    stroke={isLiked ? '#F87171' : '#9CA3AF'}
                    strokeWidth={2}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: isLiked ? '#F87171' : '#9CA3AF' }}>
                    {likesCount}
                  </span>
                </motion.button>

                {/* Comentar */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setShowComments(!showComments)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-3"
                >
                  <MessageCircle
                    size={19}
                    fill={showComments ? '#2BB5C8' : 'none'}
                    stroke={showComments ? '#2BB5C8' : '#9CA3AF'}
                    strokeWidth={2}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: showComments ? '#2BB5C8' : '#9CA3AF' }}
                  >
                    {post.comments_count}
                  </span>
                </motion.button>

                {/* Partilhar */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => onShare?.(post.id)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-3"
                >
                  <Share2 size={19} stroke="#9CA3AF" strokeWidth={2} />
                  <span className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>
                    {post.shares_count}
                  </span>
                </motion.button>

                {/* Guardar */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex flex-col items-center gap-0.5 py-3"
                >
                  <Bookmark
                    size={19}
                    fill={isSaved ? '#0EA5E9' : 'none'}
                    stroke={isSaved ? '#0EA5E9' : '#9CA3AF'}
                    strokeWidth={2}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: isSaved ? '#0EA5E9' : '#9CA3AF' }}
                  >
                    {savesCount}
                  </span>
                </motion.button>

                {/* Reportar */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setShowReport(true)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-3"
                >
                  <Flag size={19} stroke="#9CA3AF" strokeWidth={2} />
                  <span className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>
                    Reportar
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Comentários — colapsável */}
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

            {/* Localização */}
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

          </div>

          {/* Coluna direita */}
          <div className="space-y-3">

            {/* Comentários expandidos */}
            <div className="rounded-2xl shadow-sm overflow-hidden"
              style={{ background: dm.surface, border: `1px solid ${dm.border}` }}>
              <div className="px-3.5 py-2.5"
                style={{ borderBottom: `1px solid ${dm.border}`, background: isDark ? '#22263A' : '#FAFAFA' }}>
                <h2 className="text-xs font-black" style={{ color: dm.text }}>Comentários</h2>
              </div>
              <div className="px-3.5 py-3">
                <Comments postId={post.id} commentsCount={post.comments_count} />
              </div>
            </div>

            {/* Como chegar */}
            {(post.local_lat && post.local_lng) && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }}
              >
                <p className="text-white font-black text-sm mb-0.5">Quer visitar este local?</p>
                <p className="text-white/75 text-xs mb-3 leading-snug">
                  Clica para ver a rota até lá.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${post.local_lat},${post.local_lng}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs"
                  style={{ background: 'white', color: '#1B5E3B' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  Como chegar
                </motion.button>
              </div>
            )}

          </div>
        </div>
      </motion.div>

      {/* Modal Report */}
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
              className="w-full rounded-t-3xl px-5 pt-4 pb-10 space-y-4 max-w-lg"
              style={{ background: dm.surface }}>
              <div className="flex justify-center mb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: dm.skel }} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black" style={{ color: dm.text }}>Denunciar publicação</h3>
                <button onClick={() => setShowReport(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {reportDone ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-700">Denúncia enviada</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Motivo</p>
                    {(['spam', 'inappropriate', 'fake', 'copyright', 'other'] as const).map(reason => (
                      <button
                        key={reason}
                        onClick={() => setReportReason(reason)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left`}
                        style={reportReason === reason
                          ? { background: isDark ? 'rgba(248,113,113,0.15)' : '#FEF2F2', color: '#EF4444', border: `1px solid ${isDark ? 'rgba(248,113,113,0.3)' : '#FECACA'}` }
                          : { background: isDark ? '#22263A' : '#F9FAFB', color: dm.text2, border: '1px solid transparent' }
                        }
                      >
                        {reportReason === reason && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                        {{ spam: 'Spam', inappropriate: 'Conteúdo inapropriado', fake: 'Informação falsa', copyright: 'Violação de direitos', other: 'Outro motivo' }[reason]}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Detalhes adicionais (opcional)..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
                    style={{ background: dm.input, border: `1px solid ${dm.inputBorder}`, color: dm.text }}
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
