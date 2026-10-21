import { useState, useEffect, useRef } from 'react';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { translateUserType, translatePostCategory } from '@/utils/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';
import {
  ChevronLeft, Heart, Share2, ThumbsUp,
  MapPin, Tag, Info, Hash, ChevronDown, ChevronUp, Flag, X, Loader2,
} from 'lucide-react';
import GalleryCarousel from '@/components/GalleryCarousel';
import Comments from '@/components/Comments';
import LocationCard from '@/components/shared/LocationCard';
import { fromApi, hasLocation } from '@/utils/normalizeLocation';
import { postsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSuggest } from '@/hooks/useSuggest';
import { usePosts } from '@/context/PostsContext';
import { useFavorites } from '@/context/FavoritesContext';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  author: { id: string; name: string; avatar?: string; type: string; isFollowing?: boolean };
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
  // dados da publicação vindos do backend
  title?: string;
  category?: string;
  tags?: string[];
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
    administrative_post?: string;
    locality?: string;
    city?: string;
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
  // Callbacks opcionais — a sincronização feed↔detalhe é agora feita pelos
  // contexts partilhados (PostsContext p/ likes, FavoritesContext p/ favoritos),
  // pelo que estes callbacks são mantidos apenas por compatibilidade e são no-ops.
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onShare: (id: string) => void;
  onAuthorPress?: (author: Post['author']) => void;
}

// ── Paleta de tipos — igual DestinationDetail / HeritageDetail ────────────────

const TYPE_COLORS: Record<string, string> = {
  guide: '#F4821F', curator: '#F4821F',
  traveler: '#2BB5C8', tourist: '#2BB5C8',
  resident: '#1B5E3B', local_resident: '#1B5E3B',
  business: '#7B5EA7', local_business: '#7B5EA7',
};
const TYPE_BG: Record<string, string> = {
  guide: '#FFF3E0', curator: '#FFF3E0',
  traveler: '#E0F7FA', tourist: '#E0F7FA',
  resident: '#EEF7F0', local_resident: '#EEF7F0',
  business: '#F3E8FF', local_business: '#F3E8FF',
};

// ── InfoRow — linha de informação com ícone + label + valor ──────────────────
// Mesmo componente do DestinationDetail
function InfoRow({
  icon, label, children, dm,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  dm: Record<string, string>;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-t" style={{ borderColor: dm.border }}>
      <span className="mt-0.5 flex-shrink-0" style={{ color: '#1B5E3B' }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold mb-0.5" style={{ color: dm.muted }}>{label}</p>
        {children}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PostDetail({
  post, onBack, onLike, onSave, onShare, onAuthorPress,
}: PostDetailProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const mountedRef = useRef(true);

  // ── Fonte de verdade partilhada ──────────────────────────────────────────
  // Likes → PostsContext (sincroniza com o feed automaticamente)
  // Favoritos → FavoritesContext (mesmo sistema de Locais/Serviços/Cultura)
  const { getLike, toggleLike, hydrateLike, isToggling } = usePosts();
  const { isFavorite, toggleFavorite, syncPostFromApi } = useFavorites();

  // ── Dados completos vindos da API (GET /api/posts/{id}/) ──────────────────
  // Começa com os dados passados via props e enriquece ao montar.
  // Estratégia igual ao DestinationDetail: props são dados imediatos (sem flickr),
  // API traz title, category, tags, location completa, imagens reais.
  const [detail, setDetail] = useState<Post>(post);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [expandedDesc,    setExpandedDesc]    = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const load = async () => {
      if (!post.id) return;
      setIsLoadingDetail(true);
      try {
        const { data, error } = await postsApi.get(post.id);
        if (!mountedRef.current) return;
        if (error || !data) return;

        // Desempacotar envelope: o backend pode devolver { post: {...} } ou o objecto directo
        const raw = (data as any)?.post ?? (data as any)?.data ?? data;

        // Extrair imagens reais — campo `images` (array de URLs Cloudinary)
        const apiImages: string[] = Array.isArray(raw.images)
          ? raw.images.filter((img: any): img is string => typeof img === 'string' && img.trim().length > 0)
          : [];

        // Extrair localização completa
        const loc = raw.location || {};

        // Extrair author com fallback para os dados das props (o GET nem sempre inclui author)
        const rawAuthor = raw.author ?? raw.created_by ?? null;
        const author: Post['author'] = rawAuthor ? {
          id:     String(rawAuthor.id     ?? post.author.id),
          name:   rawAuthor.name          ?? post.author.name,
          avatar: rawAuthor.avatar        ?? post.author.avatar,
          type:   rawAuthor.role ?? rawAuthor.type ?? post.author.type,
          isFollowing: rawAuthor.isFollowing ?? post.author.isFollowing,
        } : post.author;

        setDetail(prev => ({
          ...prev,
          // Campos da publicação — vindos do GET /api/posts/{id}/
          title:          raw.title    || prev.title    || '',
          category:       raw.category || prev.category || '',
          tags:           Array.isArray(raw.tags) ? raw.tags : (prev.tags ?? []),
          description:    raw.content  || raw.title || prev.description || '',
          // Imagens reais do backend
          images:         apiImages.length > 0 ? apiImages : prev.images,
          image:          apiImages[0] ?? prev.image,
          // Author enriquecido
          author,
          // Data de publicação
          created_at:     raw.createdAt || raw.created_at || prev.created_at || '',
          // Stats reais
          likes_count:    raw.stats?.likesCount    ?? raw.likes_count    ?? prev.likes_count,
          comments_count: raw.stats?.commentsCount ?? raw.comments_count ?? prev.comments_count,
          shares_count:   raw.stats?.sharesCount   ?? raw.shares_count   ?? prev.shares_count,
          saves_count:    raw.stats?.savesCount    ?? raw.saves_count    ?? prev.saves_count,
          is_liked:       raw.userInteraction?.hasLiked ?? prev.is_liked,
          is_saved:       raw.userInteraction?.hasSaved ?? prev.is_saved,
          // Localização completa da API
          province:       loc.province  || raw.province  || prev.province  || '',
          district:       loc.district  || loc.municipality || raw.district || prev.district || '',
          city:           loc.city      || loc.locality   || raw.city      || prev.city      || '',
          address:        loc.address   || raw.address    || prev.address   || '',
          location: {
            latitude:           loc.latitude            ?? prev.location?.latitude,
            longitude:          loc.longitude           ?? prev.location?.longitude,
            address:            loc.address             || raw.address    || prev.address   || '',
            province:           loc.province            || raw.province   || prev.province  || '',
            district:           loc.district            || loc.municipality || raw.district || prev.district || '',
            administrative_post:loc.administrative_post || '',
            locality:           loc.locality            || loc.city       || '',
            city:               loc.city                || loc.locality   || '',
            nearby_reference:   loc.nearby_reference    || '',
          },
          local_lat: loc.latitude  != null ? String(loc.latitude)  : prev.local_lat,
          local_lng: loc.longitude != null ? String(loc.longitude) : prev.local_lng,
        }));
      } catch {
        // silencioso — continua com os dados das props
      } finally {
        if (mountedRef.current) setIsLoadingDetail(false);
      }
    };
    load();
    return () => { mountedRef.current = false; };
  }, [post.id]);

  // Sincronizar like/save com a fonte de verdade partilhada (contexts).
  // O `detail` vem enriquecido pelo GET /api/posts/{id}/; hidratamos os contexts
  // para que feed e detalhe usem exatamente o mesmo estado.
  useEffect(() => {
    hydrateLike(detail.id, detail.is_liked, detail.likes_count);
    // syncPostFromApi espera o objeto raw com userInteraction.hasSaved;
    // como `detail` já espelha esses campos, passamos um formato compatível.
    syncPostFromApi({
      id: detail.id,
      userInteraction: { hasSaved: detail.is_saved },
      title: detail.title,
      content: detail.description,
      images: detail.images,
      category: detail.category,
      province: detail.province,
      location: detail.location,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.is_liked, detail.likes_count, detail.is_saved, detail.id]);

  // Sugerir = seguir o autor do post — POST /api/users/{id}/follow/
  const { isSuggested, isLoading: isSuggestLoading, toggle: toggleSuggest, isSelf: isSuggestSelf } =
    useSuggest(detail.author.id, detail.author.isFollowing ?? false, user?.id);

  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#A8B4CC' : '#374151',
    muted:   isDark ? '#6B7A99' : '#94A3B8',
    greenBg: isDark ? 'rgba(74,222,128,0.12)' : '#EEF7F0',
    fadeBg:  isDark ? '#1A1D27' : '#ffffff',
    input:   isDark ? '#22263A' : '#ffffff',
    inputBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    skel:    isDark ? '#22263A' : '#E5E7EB',
  };

  // Imagens (até 10 — limite do schema)
  const images = detail.images?.length
    ? detail.images.slice(0, 10)
    : detail.image
      ? [detail.image]
      : [PLACEHOLDER_IMAGE];

  // Título a mostrar
  const displayTitle = detail.title || detail.local_name || 'Publicação';
  // Categoria traduzida
  const displayCategory = detail.category
    ? translatePostCategory(detail.category)
    : (detail.local_category || '');
  // Província
  const displayProvince = detail.location?.province || detail.province;

  const authorColor = TYPE_COLORS[detail.author.type] ?? '#6B7280';
  const authorBg    = TYPE_BG[detail.author.type]     ?? '#F3F4F6';

  // ── Report ────────────────────────────────────────────────────────────────
  const [showReport,     setShowReport]     = useState(false);
  const [reportReason,   setReportReason]   = useState('spam');
  const [reportDetails,  setReportDetails]  = useState('');
  const [isReporting,    setIsReporting]    = useState(false);
  const [reportDone,     setReportDone]     = useState(false);

  const handleReport = async () => {
    if (isReporting || !reportReason) return;
    setIsReporting(true);
    try {
      const { error } = await postsApi.report(post.id, reportReason, reportDetails.trim() || undefined);
      if (!error) {
        setReportDone(true);
        setTimeout(() => { setShowReport(false); setReportDone(false); }, 2000);
      }
    } finally {
      setIsReporting(false);
    }
  };

  // Localização normalizada
  const loc = fromApi(detail);
  const locLat = detail.local_lat ?? (detail.location?.latitude != null ? String(detail.location.latitude) : undefined);
  const locLng = detail.local_lng ?? (detail.location?.longitude != null ? String(detail.location.longitude) : undefined);

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
        {/* CONTEÚDO — galeria + grid — mesmo padrão de DestinationDetail */}
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-6 md:pt-6 px-4 pt-3 space-y-3 md:space-y-0">

          {/* ── GALERIA — 2 colunas ─────────────────────────────────────────── */}
          <div className="md:col-span-2 -mx-4 md:mx-0">
            <div
              className="relative w-full overflow-hidden md:rounded-2xl"
              style={{ height: 'clamp(270px, 30vw, 370px)' }}
            >
              <GalleryCarousel images={images} alt={displayTitle}>

                {/* Top bar — z-30 */}
                <div
                  className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between"
                  style={{ zIndex: 3 }}
                >
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
                      onClick={() => onShare?.(detail.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                    >
                      <Share2 size={16} className="text-white" strokeWidth={2} />
                    </motion.button>
                    {/* LIKE — polegar para cima (ThumbsUp). Estado/contagem do PostsContext. */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { toggleLike(detail.id); onLike?.(detail.id); }}
                      disabled={isToggling(detail.id)}
                      aria-label={getLike(detail.id).isLiked ? 'Remover like' : 'Gostar'}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: getLike(detail.id).isLiked ? '#0EA5E9' : 'rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <ThumbsUp size={16} fill={getLike(detail.id).isLiked ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                    </motion.button>
                    {/* FAVORITO — coração azul, mesma posição/estilo do DestinationDetail.
                        Usa o FavoritesContext (mesma fonte de verdade do feed e de Locais/Serviços/Cultura). */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      aria-label={isFavorite(detail.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      onClick={() => toggleFavorite({
                        id:    detail.id,
                        type:  'post',
                        name:  detail.title || detail.description?.slice(0, 60) || 'Publicação',
                        image: detail.image || PLACEHOLDER_IMAGE,
                        tag:   displayCategory,
                        provincia: detail.province ?? detail.location?.province ?? '',
                        categoryKey: 'post',
                        raw: detail,
                      })}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: isFavorite(detail.id) ? '#0EA5E9' : 'rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Heart size={16} fill={isFavorite(detail.id) ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                    </motion.button>
                  </div>
                </div>

                {/* Bottom info — z-30 */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4" style={{ zIndex: 3 }}>
                  <div className="flex items-end justify-between">

                    {/* Localização + likes */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {displayProvince && (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-white/70" />
                          <span className="text-white/80 text-xs">{displayProvince}</span>
                        </div>
                      )}
                      <span className="text-white/40">·</span>
                      <div className="flex items-center gap-1">
                        <ThumbsUp size={12} fill="#0EA5E9" stroke="none" />
                        <span className="text-white font-black text-xs">{getLike(detail.id).likesCount}</span>
                      </div>
                    </div>

                    {/* Botão Sugerir — padrão DestinationDetail */}
                    {!isSuggestSelf && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleSuggest}
                        disabled={isSuggestLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                        style={{
                          background: isSuggested ? 'rgba(27,94,59,0.9)' : 'rgba(0,0,0,0.35)',
                          backdropFilter: 'blur(8px)',
                        }}
                        aria-label={isSuggested ? 'Sugerido' : 'Sugerir perfil do autor'}
                      >
                        <svg
                          width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ opacity: isSuggestLoading ? 0.5 : 1 }}
                        >
                          <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                        </svg>
                        <span className="text-white text-[11px] font-bold">
                          {isSuggestLoading ? 'A sugerir…' : isSuggested ? 'Sugerido' : 'Sugerir'}
                        </span>
                      </motion.button>
                    )}
                  </div>
                </div>

              </GalleryCarousel>
            </div>
          </div>

          {/* ── COLUNA ESQUERDA ──────────────────────────────────────────────── */}
          <div className="space-y-3">

            {/* Título + categoria — igual ao DestinationDetail */}
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-black leading-tight" style={{ color: dm.text }}>{displayTitle}</h1>
              {displayCategory && (
                <span
                  className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: dm.greenBg, color: '#1B5E3B' }}
                >
                  {displayCategory}
                </span>
              )}
            </div>

            {/* Autor — botão clicável: avatar + nome + badge tipo */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onAuthorPress?.(detail.author)}
              className="flex items-center gap-2 w-full text-left"
              style={{ cursor: onAuthorPress ? 'pointer' : 'default' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${authorColor}, #2BB5C8)` }}
              >
                {detail.author.avatar
                  ? <img src={detail.author.avatar} alt={detail.author.name} className="w-full h-full object-cover" />
                  : detail.author.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-black flex-1 text-left truncate" style={{ color: dm.text }}>
                {detail.author.name}
              </p>
              {/* Tipo de perfil */}
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: authorBg, color: authorColor }}
              >
                {translateUserType(detail.author.type)}
              </span>
            </motion.button>

            {/* ── Informações gerais — mesmo padrão do DestinationDetail ── */}
            <div
              className="rounded-2xl p-3.5 shadow-sm text-left space-y-0"
              style={{ background: dm.surface }}
            >
              <h2 className="text-xs font-black mb-2" style={{ color: dm.text }}>Informações gerais</h2>

              {/* Título */}
              {detail.title && (
                <InfoRow icon={<Tag size={13} strokeWidth={2} />} label="Título" dm={dm}>
                  <span className="text-xs font-bold" style={{ color: dm.text }}>{detail.title}</span>
                </InfoRow>
              )}

              {/* Categoria */}
              {displayCategory && (
                <InfoRow icon={<Info size={13} strokeWidth={2} />} label="Categoria" dm={dm}>
                  <span className="text-xs font-bold" style={{ color: '#1B5E3B' }}>{displayCategory}</span>
                </InfoRow>
              )}

              {/* Tags */}
              {detail.tags && detail.tags.length > 0 && (
                <InfoRow icon={<Hash size={13} strokeWidth={2} />} label="Tags" dm={dm}>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {detail.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: dm.greenBg, color: '#1B5E3B' }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </InfoRow>
              )}

              {/* Descrição — colapsável após 10 linhas, igual ao HeritageDetail */}
              {detail.description && (() => {
                const text = detail.description;
                const lines = text.split('\n');
                const estimatedLines = lines.reduce(
                  (acc, line) => acc + Math.max(1, Math.ceil((line.length || 1) / 58)), 0
                );
                const needsCollapse = estimatedLines > 10;
                return (
                  <div className="pt-2.5 border-t rounded-b-2xl overflow-hidden" style={{ borderColor: dm.border }}>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: dm.muted }}>Descrição</p>
                    <div className="relative">
                      <div style={{
                        maxHeight: expandedDesc ? 'none' : '14.5rem',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        <p className="text-sm leading-relaxed" style={{ color: dm.text2, whiteSpace: 'pre-line' }}>
                          {text}
                        </p>
                        {needsCollapse && !expandedDesc && (
                          <div style={{
                            position: 'absolute',
                            bottom: 0, left: 0, right: 0,
                            height: '5rem',
                            background: `linear-gradient(to bottom, transparent, ${dm.fadeBg})`,
                            pointerEvents: 'none',
                          }} />
                        )}
                      </div>
                      {needsCollapse && (
                        <button
                          type="button"
                          onClick={() => setExpandedDesc(v => !v)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            padding: '8px 0 0 0',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {expandedDesc
                            ? <ChevronUp size={16} color="#1B5E3B" />
                            : <ChevronDown size={16} color="#1B5E3B" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Localização — card separado, igual ao DestinationDetail ── */}
            {hasLocation(loc) && (
              <div
                className="rounded-2xl p-3.5 shadow-sm text-left"
                style={{ background: dm.surface }}
              >
                <h2 className="text-xs font-black mb-2" style={{ color: dm.text }}>Localização</h2>
                <LocationCard size="sm" data={loc} showMap={!!(locLat && locLng)} publicationName={displayTitle} />
              </div>
            )}

          </div>

          {/* ── COLUNA DIREITA ───────────────────────────────────────────────── */}
          <div className="space-y-3">

            {/* Comentários — header completo igual ao ReviewManager no DestinationDetail */}
            <div id="post-comments-section">
              <Comments
                postId={detail.id}
                commentsCount={detail.comments_count}
                onAuthorPress={onAuthorPress}
              />
            </div>

            {/* Como chegar — igual ao DestinationDetail / HeritageDetail */}
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
                  const url = (locLat && locLng)
                    ? `https://www.google.com/maps/dir/?api=1&destination=${locLat},${locLng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayTitle + ' Moçambique')}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs"
                style={{ background: 'white', color: '#1B5E3B' }}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                Como chegar
              </motion.button>
            </div>

          </div>
        </div>
      </motion.div>

      {/* ── MODAL REPORT ─────────────────────────────────────────────────────── */}
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
              style={{ background: dm.surface }}
            >
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
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold" style={{ color: dm.text2 }}>Denúncia enviada</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: dm.muted }}>Motivo</p>
                    {(['spam', 'inappropriate', 'fake', 'copyright', 'other'] as const).map(reason => (
                      <button
                        key={reason}
                        onClick={() => setReportReason(reason)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left"
                        style={reportReason === reason
                          ? {
                              background: isDark ? 'rgba(248,113,113,0.15)' : '#FEF2F2',
                              color: '#EF4444',
                              border: `1px solid ${isDark ? 'rgba(248,113,113,0.3)' : '#FECACA'}`,
                            }
                          : {
                              background: isDark ? '#22263A' : '#F9FAFB',
                              color: dm.text2,
                              border: '1px solid transparent',
                            }
                        }
                      >
                        {reportReason === reason && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" />
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
