import { useState, useEffect, Component, type ReactNode } from 'react';
import { PLACEHOLDER_IMAGE, mapValidService, mapValidLocal } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MapPin, Share2, Loader2,
  Images, Store,
} from 'lucide-react';
import DestinationDetail from '@/pages/DestinationDetail';
import PostDetail from '@/pages/PostDetail';
import ServiceDetail from '@/pages/ServiceDetail';
import UserListModal, { type UserSummary } from '@/components/UserListModal';
import LocationCard from '@/components/shared/LocationCard';
import { hasLocation, normalizeLocation } from '@/utils/normalizeLocation';
import { usersApi, postsApi, servicesApi, localsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';
import { useSuggest } from '@/hooks/useSuggest';
import { translateServiceCategory, translatePostCategory } from '@/utils/translations';

// ─── Imagens de capa ──────────────────────────────────────────────────────────
const COVER_IMAGES = [
  '/images/provincias_profile/inhambane.jpeg',
  '/images/provincias_profile/cabo_delgado.jpeg',
  '/images/provincias_profile/nampula.jpeg',
  '/images/provincias_profile/sofala.jpeg',
  '/images/provincias_profile/zambezia.jpeg',
  '/images/provincias_profile/manica.jpg',
  '/images/provincias_profile/maputo_cidade.jpg',
  '/images/provincias_profile/tete.jpg',
  '/images/provincias_profile/niassa.webp',
  '/images/provincias_profile/maputo_provicnia.jpeg',
];
function pickCover(id: string): string {
  const n = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COVER_IMAGES[n % COVER_IMAGES.length];
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Author {
  id: string;
  name: string;
  avatar?: string;
  type: string;
}

interface Post {
  id: string;
  author: Author;
  title?: string;
  category?: string;
  tags?: string[];
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
  province?: string;
  district?: string;
  city?: string;
  address?: string;
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
  };
}

interface PublicProfileProps {
  author: Author;
  allPosts?: Post[];
  onBack: () => void;
}

// ─── Labels e cores por tipo ──────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  guide:          'Guia Turístico',
  traveler:       'Viajante',
  tourist:        'Viajante',
  resident:       'Morador Local',
  local_resident: 'Morador Local',
  business:       'Negócio',
  local_business: 'Negócio',
  curator:        'Curador',
};
const TYPE_COLOR: Record<string, string> = {
  guide:          '#F4821F',
  traveler:       '#2BB5C8',
  tourist:        '#2BB5C8',
  resident:       '#1B5E3B',
  local_resident: '#1B5E3B',
  business:       '#7B5EA7',
  local_business: '#7B5EA7',
  curator:        '#F4821F',
};

// ─── Tabs por tipo de perfil ──────────────────────────────────────────────────
// Regras centralizadas — alinhadas com UserRoleEnum do openapi-schema-1:
//   tourist | local_resident → só Publicações
//   local_business | curator | admin → Publicações + Locais + Serviços
// Nota: 'guide' não existe no openapi-schema-1; valores mapeados pelo frontend também incluídos.
const SERVICE_TYPES = new Set(['local_business', 'business', 'curator', 'admin']);

/**
 * Resolve se um tipo de autor corresponde a um perfil de serviço.
 * Aceita tanto o valor raw da API (UserRole) como o valor mapeado pelo frontend (User.type).
 */
function isServiceProfile(type: string): boolean {
  return SERVICE_TYPES.has(type);
}

type TabId = 'posts' | 'locals' | 'services';
const TABS_SERVICE: { id: TabId; label: string }[] = [
  { id: 'posts',    label: 'Publicações' },
  { id: 'locals',   label: 'Locais'      },
  { id: 'services', label: 'Serviços'    },
];
const TABS_DEFAULT: { id: TabId; label: string }[] = [
  { id: 'posts', label: 'Publicações' },
];

// ─── Cores de categoria de serviço ───────────────────────────────────────────
const SVC_CAT_COLOR: Record<string, string> = {
  'Hospedagem':     '#2563EB',
  'Guia Turístico': '#F4821F',
  'Experiência':    '#E05A3A',
  'Transporte':     '#1B5E3B',
  'Outro':          '#7B5EA7',
};

// ─── Error Boundary para sub-páginas ─────────────────────────────────────────
class DetailBoundary extends Component<
  { children: ReactNode; onError: (err: Error) => void },
  { crashed: boolean }
> {
  state = { crashed: false };
  componentDidCatch(err: Error) {
    console.error('[PublicProfile] DetailBoundary caught:', err);
    this.props.onError(err);
  }
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) return null; // o pai já tratou o estado
    return this.props.children;
  }
}

// ─── Badge dinâmico baseado em dados reais (sem "Classe") ────────────────────
function resolveBadge(rating: number, reviewsCount: number): { label: string; color: string } | null {
  if (rating >= 4.5 && reviewsCount > 0) return { label: 'Raro',     color: '#1B5E3B' };
  if (reviewsCount === 0)                 return { label: 'Novidade', color: '#2BB5C8' };
  if (rating >= 3.5)                      return { label: 'Destaque', color: '#F4821F' };
  return null;
}

// ─── Card padrão dos 3 tabs ───────────────────────────────────────────────────
// Layout igual à referência:
//   top-left: badge dinâmico   top-right: ⊞ N (múltiplas imagens)
//   bottom-left: localização + nome
//   bottom-right: ⭐ rating + categoria
function ProfileCard({
  image, images, name, location, rating, reviewsCount, category, categoryColor,
  isDark, dm, onPress,
}: {
  image?: string;
  images?: string[];
  name: string;
  location?: string;
  rating: number;
  reviewsCount: number;
  category: string;
  categoryColor: string;
  isDark: boolean;
  dm: Record<string, string>;
  onPress: () => void;
}) {
  const badge = resolveBadge(rating, reviewsCount);
  const multiCount = (images?.length ?? 0) > 1 ? images!.length : null;
  const ratingDisplay = rating > 0 ? (typeof rating === 'number' ? rating.toFixed(1) : rating) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      className="relative overflow-hidden rounded-xl cursor-pointer group"
      style={{ aspectRatio: '4 / 3', background: isDark ? '#22263A' : '#E5E7EB' }}
      onClick={onPress}
    >
      {/* Imagem */}
      {image ? (
        <img src={image} alt={name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: isDark ? '#1A1D27' : '#E5E7EB' }}>
          <Images size={18} style={{ color: dm.text2 }} />
        </div>
      )}

      {/* Gradiente escuro na base */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)' }} />

      {/* ── Topo ── */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2">
        {/* Badge — canto superior esquerdo */}
        {badge && (
          <span className="text-white text-[9px] font-black px-2 py-0.5 rounded-full"
            style={{ background: badge.color }}>
            {badge.label}
          </span>
        )}
        {!badge && <span />}
        {/* Múltiplas imagens — canto superior direito */}
        {multiCount && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <Images size={9} className="text-white" />
            <span className="text-white text-[9px] font-bold">{multiCount}</span>
          </div>
        )}
      </div>

      {/* ── Base ── */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 flex items-end justify-between gap-1">
        {/* Esquerda: localização + nome */}
        <div className="flex-1 min-w-0">
          {location && (
            <div className="flex items-center gap-0.5 mb-0.5">
              <MapPin size={7} className="text-white/70 flex-shrink-0" />
              <span className="text-white/70 text-[8px] font-semibold truncate">{location}</span>
            </div>
          )}
          <p className="text-white font-black text-[10px] leading-tight line-clamp-1">{name}</p>
        </div>
        {/* Direita: rating + categoria */}
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {ratingDisplay && (
            <div className="flex items-center gap-0.5">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
              <span className="text-white text-[9px] font-black">{ratingDisplay}</span>
            </div>
          )}
          <span className="text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none"
            style={{ background: categoryColor + 'CC' }}>
            {category}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
// Padrão idêntico ao tab Publicações: grid 3 colunas, aspectRatio 4/3, sem dados mock
export default function PublicProfile({ author, allPosts, onBack }: PublicProfileProps) {
  useScrollTop();
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();

  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#6B7A99' : '#6B7280',
    back:    isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.30)',
    skel:    isDark ? '#22263A' : '#E5E7EB',
    card:    isDark ? '#22263A' : '#F8FAFC',
  };

  const isService = isServiceProfile(author.type);
  const TABS = isService ? TABS_SERVICE : TABS_DEFAULT;

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [activeTab,        setActiveTab]        = useState<TabId>('posts');
  const [profile,          setProfile]          = useState<{
    name:        string;
    avatar?:     string;
    bio?:        string;
    joinedAt?:   string;
    location?:   string;
    rawLocation?: any;
    isFollowing: boolean;
    stats: { postsCount: number; followersCount: number; followingCount: number };
  } | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isFollowLoading,  setIsFollowLoading]  = useState(false);

  // Posts
  const [posts,          setPosts]          = useState<Post[]>(allPosts || []);
  const [isLoadingPosts, setIsLoadingPosts] = useState(!allPosts);

  // Serviços (só para negócios)
  const [services,          setServices]          = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [selectedService,   setSelectedService]   = useState<any | null>(null);

  // Locais sugeridos pelo negócio (só para negócios)
  const [locals,          setLocals]          = useState<any[]>([]);
  const [isLoadingLocals, setIsLoadingLocals] = useState(false);
  const [selectedLocal,   setSelectedLocal]   = useState<any | null>(null);

  // Navegação aninhada
  const [selectedPost,   setSelectedPost]   = useState<Post | null>(null);
  const [nestedProfile,  setNestedProfile]  = useState<Author | null>(null);
  const [userListModal,  setUserListModal]  = useState<{ title: string; users: UserSummary[] } | null>(null);

  // ── Limpar estado ao mudar de perfil ──────────────────────────────────────
  // Garante que não se vê conteúdo do perfil anterior enquanto o novo carrega.
  useEffect(() => {
    setActiveTab('posts');
    setPosts(allPosts || []);
    setServices([]);
    setLocals([]);
    setProfile(null);
    setIsLoadingProfile(true);
    setIsLoadingPosts(!allPosts);
    setSelectedPost(null);
    setSelectedService(null);
    setSelectedLocal(null);
    setNestedProfile(null);
  }, [author.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sugerir
  const { isSuggested, isLoading: isSuggestLoading, isSelf: isSuggestSelf, toggle: toggleSuggest } =
    useSuggest(author.id, false, currentUser?.id);

  // ── Carregar perfil ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoadingProfile(true);
      try {
        const { data, error } = await usersApi.getPublicProfile(author.id);
        if (error || !data?.user) return;
        const u = data.user;
        setProfile({
          name:        u.name || author.name,
          avatar:      u.avatar,
          bio:         u.bio,
          joinedAt:    u.joinedAt,
          location:    u.location || u.province || '',
          rawLocation: u.location ?? null,
          isFollowing: u.isFollowing ?? false,
          stats: {
            postsCount:     u.stats?.postsCount     ?? 0,
            followersCount: u.stats?.followersCount ?? 0,
            followingCount: u.stats?.followingCount ?? 0,
          },
        });
      } catch {
        // usa props como fallback
      } finally {
        setIsLoadingProfile(false);
      }
    };
    load();
  }, [author.id]);

  // ── Carregar posts ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (allPosts) { setPosts(allPosts); setIsLoadingPosts(false); return; }
    let cancelled = false;
    const load = async () => {
      setIsLoadingPosts(true);
      try {
        const { data } = await postsApi.list({ userId: author.id, page: 1, limit: 50 });
        if (cancelled) return;
        if (data) {
          const items = Array.isArray(data) ? data : (data?.posts ?? data?.results ?? []);
          setPosts(items.map((p: any) => {
            const loc = p.location || {};
            return {
              id:             String(p.id),
              author:         { id: String(p.author?.id || ''), name: p.author?.name || 'Utilizador', avatar: p.author?.avatar, type: p.author?.role || p.author?.type || '' },
              title:          p.title || '',
              category:       p.category || '',
              tags:           Array.isArray(p.tags) ? p.tags : [],
              description:    p.content || p.title || '',
              image:          p.images?.[0] || p.cover_image,
              images:         p.images,
              likes_count:    p.stats?.likesCount    ?? p.likes_count    ?? 0,
              comments_count: p.stats?.commentsCount ?? p.comments_count ?? 0,
              shares_count:   p.stats?.sharesCount   ?? 0,
              saves_count:    0,
              is_liked:       p.userInteraction?.hasLiked ?? false,
              is_saved:       p.userInteraction?.hasSaved ?? false,
              created_at:     p.createdAt || p.created_at || new Date().toISOString(),
              province:       p.province  || loc.province  || '',
              district:       p.district  || loc.district  || '',
              city:           p.city      || loc.city       || '',
              address:        p.address   || loc.address    || '',
              local_address:  p.address   || loc.address    || '',
              local_lat:      (p.lat ?? loc.latitude)  != null ? String(p.lat ?? loc.latitude)  : undefined,
              local_lng:      (p.lng ?? loc.longitude) != null ? String(p.lng ?? loc.longitude) : undefined,
              location: {
                latitude:           p.lat    ?? loc.latitude  ?? undefined,
                longitude:          p.lng    ?? loc.longitude ?? undefined,
                address:            p.address   || loc.address   || '',
                province:           p.province  || loc.province  || '',
                district:           p.district  || loc.district  || loc.municipality || '',
                administrative_post:loc.administrative_post || '',
                locality:           loc.locality || loc.city || '',
                city:               p.city      || loc.city      || '',
                nearby_reference:   loc.nearby_reference || '',
              },
            };
          }));
        }
      } catch {
        if (!cancelled) { /* mantém vazio */ }
      } finally {
        if (!cancelled) setIsLoadingPosts(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [author.id, allPosts]);

  // ── Carregar serviços (só para perfis de serviço, lazy ao activar o separador) ──
  useEffect(() => {
    if (!isService || activeTab !== 'services') return;
    const load = async () => {
      setIsLoadingServices(true);
      try {
        // Carrega serviços e filtra pelo contributor.id do autor
        const { data } = await servicesApi.list({ limit: 100, sortBy: 'recent' });
        const items: any[] = Array.isArray(data) ? data : (data?.posts ?? data?.services ?? data?.results ?? []);
        const mapped = items
          .map((s: any) => mapValidService(s))
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .filter((s: any) => s.contributor?.id === author.id || s.contributor?.id === String(author.id));
        setServices(mapped);
      } catch {
        setServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    };
    load();
  }, [isService, activeTab, author.id]);

  // ── Carregar locais sugeridos pelo perfil de serviço (lazy ao activar o separador Locais) ──
  useEffect(() => {
    if (!isService || activeTab !== 'locals') return;
    const load = async () => {
      setIsLoadingLocals(true);
      try {
        const { data } = await localsApi.list({ limit: 100, sortBy: 'recent' });
        const items: any[] = Array.isArray(data) ? data : (data?.locals ?? data?.results ?? []);
        const mapped = items
          .map((l: any) => mapValidLocal(l))
          .filter((l): l is NonNullable<typeof l> => l !== null)
          .filter((l: any) =>
            l.contributor?.id === author.id || l.contributor?.id === String(author.id)
          );
        setLocals(mapped);
      } catch {
        setLocals([]);
      } finally {
        setIsLoadingLocals(false);
      }
    };
    load();
  }, [isService, activeTab, author.id]);

  // ── Seguir / Deixar de seguir ──────────────────────────────────────────────
  const handleToggleFollow = async () => {
    if (!profile || isFollowLoading) return;
    const willFollow = !profile.isFollowing;
    setProfile(prev => prev ? {
      ...prev,
      isFollowing: willFollow,
      stats: { ...prev.stats, followersCount: prev.stats.followersCount + (willFollow ? 1 : -1) },
    } : prev);
    setIsFollowLoading(true);
    try {
      const { data, error } = willFollow
        ? await usersApi.follow(author.id)
        : await usersApi.unfollow(author.id);
      if (error || !data) {
        setProfile(prev => prev ? {
          ...prev,
          isFollowing: !willFollow,
          stats: { ...prev.stats, followersCount: prev.stats.followersCount + (willFollow ? -1 : 1) },
        } : prev);
        return;
      }
      setProfile(prev => prev ? { ...prev, isFollowing: data.isFollowing } : prev);
    } catch {
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: !willFollow,
        stats: { ...prev.stats, followersCount: prev.stats.followersCount + (willFollow ? -1 : 1) },
      } : prev);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // ── Partilhar ──────────────────────────────────────────────────────────────
  const handleShare = () => {
    const text = `${displayName} no Txopela Tour`;
    if (navigator.share) navigator.share({ title: text, url: window.location.origin });
    else navigator.clipboard?.writeText(`${text} — ${window.location.origin}`);
  };

  // ── Valores derivados ──────────────────────────────────────────────────────
  const displayName   = profile?.name   || author.name;
  const displayAvatar = profile?.avatar || author.avatar;
  const displayBio    = profile?.bio    || '';
  const displayLoc    = profile?.location || '';
  const isFollowing   = profile?.isFollowing ?? false;
  const isOwnProfile  = currentUser?.id === author.id;
  const stats         = profile?.stats ?? { postsCount: 0, followersCount: 0, followingCount: 0 };
  const typeKey       = author.type || 'traveler';
  const typeLabel     = TYPE_LABEL[typeKey] || typeKey;
  const typeColor     = TYPE_COLOR[typeKey] || '#1B5E3B';
  const coverImage    = pickCover(author.id);

  // Localização normalizada para o separador Local (negócio)
  const normalizedLoc = profile?.rawLocation ? normalizeLocation({ location: profile.rawLocation }) : null;
  const locHasData    = normalizedLoc ? hasLocation(normalizedLoc) : false;

  // ── Navegação aninhada — tratada DENTRO do return para não quebrar o AnimatePresence do App ──
  if (selectedService) {
    const svcForDetail = {
      ...selectedService,
      reviewsCount: selectedService.reviewsCount ?? selectedService.reviews ?? 0,
      description:  selectedService.description  ?? '',
      telefone:     selectedService.telefone      ?? '',
      whatsapp:     selectedService.whatsapp      ?? '',
      email:        selectedService.email         ?? '',
      horario:      selectedService.horario       ?? 'Consultar',
      endereco:     selectedService.endereco      ?? '',
      provincia:    selectedService.provincia     ?? '',
      distrito:     selectedService.distrito      ?? '',
    };
    return (
      <ServiceDetail
        service={svcForDetail}
        onBack={() => setSelectedService(null)}
        onAuthorPress={a => { setSelectedService(null); setNestedProfile(a); }}
      />
    );
  }
  if (selectedLocal) {
    const localForDetail = {
      ...selectedLocal,
      id:          selectedLocal.id          || '',
      name:        selectedLocal.name        || '',
      desc:        selectedLocal.desc        || selectedLocal.description || '',
      category:    selectedLocal.tag         || selectedLocal.category    || '',
      provincia:   selectedLocal.provincia   || '',
      melhorEpoca: selectedLocal.melhorEpoca || '',
      tipo:        selectedLocal.tipo        || selectedLocal.tag         || '',
      destaques:   selectedLocal.destaques   || [],
      reviews:     selectedLocal.reviews     ?? 0,
      rating:      selectedLocal.rating      ?? 0,
      image:       selectedLocal.image       || PLACEHOLDER_IMAGE,
    };
    return (
      <DetailBoundary onError={() => setSelectedLocal(null)}>
        <DestinationDetail
          destination={localForDetail}
          onBack={() => setSelectedLocal(null)}
          onExploreMore={() => setSelectedLocal(null)}
          onAuthorPress={a => { setSelectedLocal(null); setNestedProfile(a); }}
        />
      </DetailBoundary>
    );
  }
  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onLike={() => {}}
        onSave={() => {}}
        onShare={() => {}}
        onAuthorPress={a => { setSelectedPost(null); setNestedProfile(a); }}
      />
    );
  }
  if (nestedProfile) {
    return <PublicProfile author={nestedProfile} onBack={() => setNestedProfile(null)} />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="min-h-screen pb-24"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >

      {/* ── CAPA + HEADER ─────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="w-full overflow-hidden" style={{ height: 'clamp(140px, 28vw, 200px)' }}>
          <img
            src={coverImage}
            alt="Capa do perfil"
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = '/images/splash-bg.jpg'; }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.20) 100%)' }} />
        </div>

        {/* Botões sobrepostos */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: dm.back, backdropFilter: 'blur(8px)' }} aria-label="Voltar">
            <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
          </button>
          <button onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: dm.back, backdropFilter: 'blur(8px)' }} aria-label="Partilhar perfil">
            <Share2 size={16} className="text-white" strokeWidth={2} />
          </button>
        </div>

        {/* Avatar sobreposto */}
        <div className="absolute left-5" style={{ bottom: 'calc(-36px)' }}>
          <div className="rounded-full overflow-hidden flex items-center justify-center"
            style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${typeColor}, #2BB5C8)`, border: `3px solid ${isDark ? '#0F1117' : '#ffffff'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
            {displayAvatar
              ? <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
              : <span className="text-2xl font-black text-white select-none">{displayName.charAt(0).toUpperCase()}</span>
            }
          </div>
        </div>
      </div>

      {/* ── IDENTIDADE ────────────────────────────────────────────────────── */}
      <div className="px-5 pt-12 pb-5" style={{ background: dm.surface }}>
        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={26} className="animate-spin" style={{ color: '#1B5E3B' }} />
          </div>
        ) : (
          <>
            {/* Nome + tipo + sugestões — card moderno compacto */}
            <div className="mb-4 rounded-2xl p-3"
              style={{ background: isDark ? '#22263A' : '#F8FAF9', border: `1px solid ${dm.border}` }}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-lg font-black leading-tight truncate" style={{ color: dm.text }}>{displayName}</h1>
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: typeColor + '18', color: typeColor }}>
                    {typeLabel}
                  </span>
                </div>
                {/* Sugestões + botão Sugerir à direita */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className="flex items-center gap-1 transition-opacity active:opacity-70"
                    onClick={() => setUserListModal({ title: 'Sugestões', users: [] })}
                  >
                    <span className="text-sm font-black" style={{ color: dm.text }}>
                      {stats.followersCount >= 1000 ? `${(stats.followersCount / 1000).toFixed(1)}k` : stats.followersCount}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: dm.text2 }}>sugestões</span>
                  </button>
                  {!isOwnProfile && !isSuggestSelf && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={toggleSuggest} disabled={isSuggestLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-black transition-all disabled:opacity-60"
                      style={isSuggested
                        ? { background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)', color: 'white' }
                        : { background: isDark ? '#0F1117' : '#ffffff', color: dm.text, border: `1px solid ${dm.border}` }}>
                      {isSuggestLoading ? <Loader2 size={11} className="animate-spin" /> : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                          </svg>
                          {isSuggested ? 'Sugerido' : 'Sugerir'}
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
              {displayBio && (
                <p className="text-xs leading-relaxed mt-2" style={{ color: isDark ? '#A8B4CC' : '#374151' }}>{displayBio}</p>
              )}
              {displayLoc && (
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin size={11} style={{ color: '#2BB5C8' }} />
                  <span className="text-xs font-semibold" style={{ color: dm.text2 }}>{displayLoc}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-stretch"
        style={{ background: dm.surface, borderBottom: `1px solid ${dm.border}` }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-black transition-colors relative"
              style={{ color: isActive ? '#1B5E3B' : dm.text2 }}
              aria-selected={isActive}
            >
              {tab.id === 'posts' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
              )}
              {tab.id === 'locals' && <MapPin size={14} />}
              {tab.id === 'services' && <Store size={14} />}
              {tab.label}
              {/* Indicador activo */}
              {isActive && (
                <motion.div layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#1B5E3B' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── CONTEÚDO DOS TABS ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>

        {/* ── TAB: PUBLICAÇÕES ────────────────────────────────────────────── */}
        {activeTab === 'posts' && (
          <motion.div key="posts"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 size={24} className="animate-spin" style={{ color: '#1B5E3B' }} />
              </div>
            ) : posts.length > 0 ? (
              /* Grid 3 colunas — aspecto 4/3, scroll vertical, igual à referência */
              <div className="grid grid-cols-3 gap-1 p-1">
                {posts.map((post) => {
                  const CAT_COLOR: Record<string, string> = {
                    discovery: '#2BB5C8', review: '#F4821F', tip: '#1B5E3B',
                    story: '#7B5EA7', photo: '#E05A3A', other: '#6B7280',
                  };
                  const rawCategory = (post as any).category ?? '';
                  const catLabel = translatePostCategory(rawCategory);
                  const catColor = CAT_COLOR[rawCategory] ?? '#6B7280';
                  return (
                    <ProfileCard
                      key={post.id}
                      image={post.image}
                      images={post.images}
                      name={post.description}
                      location={post.province || post.city}
                      rating={0}
                      reviewsCount={post.likes_count}
                      category={catLabel}
                      categoryColor={catColor}
                      isDark={isDark}
                      dm={dm}
                      onPress={() => setSelectedPost(post)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-8 gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? '#22263A' : '#EEF7F0' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B5E3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-base font-black mb-1" style={{ color: dm.text }}>Ainda sem publicações</p>
                  <p className="text-sm leading-relaxed" style={{ color: dm.text2 }}>
                    As experiências deste perfil aparecerão aqui.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: LOCAIS ─────────────────────────────────────────────────── */}
        {activeTab === 'locals' && (
          <motion.div key="locals"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>

            {/* Cartão de localização do perfil — sempre visível quando disponível */}
            {!isLoadingProfile && locHasData && normalizedLoc && (
              <div className="px-2 py-3 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: '#EEF7F0' }}>
                    <MapPin size={15} style={{ color: '#1B5E3B' }} />
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: dm.text }}>Localização do negócio</p>
                    {normalizedLoc.province && (
                      <p className="text-xs font-semibold" style={{ color: dm.text2 }}>{normalizedLoc.province}</p>
                    )}
                  </div>
                </div>
                <LocationCard data={normalizedLoc} size="md" title="Morada" />
                {normalizedLoc.lat && normalizedLoc.lng && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${normalizedLoc.lat},${normalizedLoc.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black"
                    style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)', color: 'white', boxShadow: '0 2px 12px rgba(27,94,59,0.25)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    Como chegar
                  </motion.button>
                )}
              </div>
            )}

            {/* Grid de locais — separador sempre visível, estado vazio quando sem conteúdo */}
            {isLoadingLocals ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin" style={{ color: '#1B5E3B' }} />
              </div>
            ) : locals.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 p-1">
                {locals.map((loc: any) => (
                  <ProfileCard
                    key={loc.id}
                    image={loc.image}
                    images={loc.images}
                    name={loc.name}
                    location={loc.distrito || loc.provincia}
                    rating={loc.rating ?? 0}
                    reviewsCount={loc.reviews ?? 0}
                    category={loc.tag}
                    categoryColor={loc.tagBg ?? '#1B5E3B'}
                    isDark={isDark}
                    dm={dm}
                    onPress={() => setSelectedLocal(loc)}
                  />
                ))}
              </div>
            ) : (
              /* Estado vazio — o separador permanece visível */
              <div className="flex flex-col items-center justify-center py-20 px-8 gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? '#22263A' : '#EEF7F0' }}>
                  <MapPin size={26} style={{ color: '#1B5E3B' }} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-base font-black mb-1" style={{ color: dm.text }}>Ainda sem locais</p>
                  <p className="text-sm leading-relaxed" style={{ color: dm.text2 }}>
                    Os locais sugeridos por este perfil aparecerão aqui.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: SERVIÇOS ───────────────────────────────────────────────── */}
        {activeTab === 'services' && (
          <motion.div key="services"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="p-1">

            {isLoadingServices ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 size={24} className="animate-spin" style={{ color: '#1B5E3B' }} />
              </div>
            ) : services.length > 0 ? (
              /* Grid 3 colunas — aspecto 4/3, scroll vertical, padrão igual a Publicações */
              <div className="grid grid-cols-3 gap-1">
                {services.map((svc: any) => {
                  const catLabel = translateServiceCategory(svc.category);
                  const catColor = SVC_CAT_COLOR[catLabel] || '#7B5EA7';
                  return (
                    <ProfileCard
                      key={svc.id}
                      image={svc.image}
                      images={svc.images}
                      name={svc.name}
                      location={svc.distrito || svc.provincia}
                      rating={svc.rating ?? 0}
                      reviewsCount={svc.reviewsCount ?? svc.reviews ?? 0}
                      category={catLabel}
                      categoryColor={catColor}
                      isDark={isDark}
                      dm={dm}
                      onPress={() => setSelectedService(svc)}
                    />
                  );
                })}
              </div>
            ) : (
              /* Estado vazio — sem serviços */
              <div className="flex flex-col items-center justify-center py-20 px-8 gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? '#22263A' : '#F3EEFB' }}>
                  <Store size={26} style={{ color: '#7B5EA7' }} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-base font-black mb-1" style={{ color: dm.text }}>Ainda sem serviços</p>
                  <p className="text-sm leading-relaxed" style={{ color: dm.text2 }}>
                    Os serviços deste negócio aparecerão aqui quando forem registados.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Modal de lista de utilizadores ───────────────────────────────── */}
      {userListModal && (
        <UserListModal
          title={userListModal.title}
          users={userListModal.users}
          onClose={() => setUserListModal(null)}
          onUserPress={u => {
            setUserListModal(null);
            setNestedProfile({ id: u.id, name: u.name, avatar: u.avatar, type: u.type });
          }}
        />
      )}
    </motion.div>
  );
}