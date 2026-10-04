import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, X, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { IconStar, IconHeart, IconMapPin } from '@/components/icons';
import { Heart } from 'lucide-react';
import PostDetail from '@/pages/PostDetail';
import { postsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { mapValidPost, filterValidPublications, extractImages, PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { translatePostCategory, postCategoryColor } from '@/utils/translations';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';

interface AllPostsProps {
  onBack: () => void;
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
  onEditPost?: (postId: string) => void;
}

const provincias = ['Todas', 'Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zamb�zia', 'Nampula', 'Cabo Delgado', 'Niassa'];

type ApiPost = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  content?: string;
  image?: string;
  images?: string[];
  category?: string;
  province?: string;
  provincia?: string;
  rating?: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  saves_count?: number;
  badge?: string;
  badgeBg?: string;
  melhorEpoca?: string;
  autor?: { name: string; type?: string; role?: string };
  author?: { id: string; name: string; avatar?: string; type?: string; role?: string };
  location?: { latitude?: number; longitude?: number; address?: string; province?: string; district?: string; city?: string; nearby_reference?: string };
  lat?: number;
  lng?: number;
  endereco?: string;
  distrito?: string;
  created_at?: string;
  createdAt?: string;
  userInteraction?: { hasLiked: boolean; hasSaved: boolean };
};

export default function AllPosts({
  onBack, onAuthorPress, onEditPost }: AllPostsProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isDark } = useTheme();
  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#6B7A99' : '#9CA3AF',
    input:   isDark ? '#22263A' : '#F8FAFC',
    inputBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
    pill:    isDark ? '#22263A' : '#ffffff',
    pillBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    skel:    isDark ? '#22263A' : '#E5E7EB',
    btnBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };
  const [posts, setPosts]         = useState<ApiPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [liked, setLiked]         = useState<Record<string, boolean>>({});
  const [suggested, setSuggested] = useState<Record<string, boolean>>({});
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('Todas');
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);

  const fetchPosts = async (reset = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const currentPage = reset ? 1 : page;
      const { data, error: apiError } = await postsApi.list({
        page: currentPage,
        limit: 20,
        search: search || undefined,
        province: filter !== 'Todas' ? filter : undefined,
        sortBy: 'recent',
      });

      if (apiError) {
        setError(apiError);
      } else if (data) {
        const items: ApiPost[] = data.posts ?? data.results ?? (Array.isArray(data) ? data : []);

        // VALIDA��O RIGOROSA: Filtrar apenas posts com imagens reais
        const validPosts = filterValidPublications(items);
        const mappedPosts = validPosts
          .map(p => mapValidPost(p))
          .filter((p): p is ApiPost => p !== null);

        // Inicializa estado de liked a partir dos dados da API
        const likedState: Record<string, boolean> = {};
        mappedPosts.forEach((p: ApiPost) => {
          if (p.userInteraction?.hasLiked) likedState[p.id] = true;
        });
        setLiked(prev => ({ ...prev, ...likedState }));

        if (reset) {
          setPosts(mappedPosts);
          setPage(2);
        } else {
          setPosts(prev => [...prev, ...mappedPosts]);
          setPage(p => p + 1);
        }

        setHasMore(data.pagination?.hasNext ?? mappedPosts.length === 20);
      }
    } catch (e) {
      setError('Falha ao carregar publica��es');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar ao montar e quando os filtros mudarem
  useEffect(() => {
    fetchPosts(true);
  }, [filter, search]);

  const handleDeletePost = async (postId: string) => {
    const { error } = await postsApi.delete(postId);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleLike = async (postId: string) => {
    const wasLiked = liked[postId];
    // Optimistic update
    setLiked(prev => ({ ...prev, [postId]: !wasLiked }));
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes_count: (p.likes_count || 0) + (wasLiked ? -1 : 1) }
        : p
    ));
    try {
      const { data, error } = wasLiked
        ? await postsApi.unlike(postId)   // DELETE /api/posts/{id}/like/
        : await postsApi.like(postId);    // POST /api/posts/{id}/like/
      
      if (error || !data) {
        console.error('[AllPosts] Erro ao dar like:', error);
        // Reverter optimistic update em caso de erro
        setLiked(prev => ({ ...prev, [postId]: wasLiked }));
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, likes_count: (p.likes_count || 0) + (wasLiked ? 1 : -1) }
            : p
        ));
      } else {
        // Confirmar com valores reais da API
        setLiked(prev => ({ ...prev, [postId]: data.hasLiked }));
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, likes_count: data.likesCount }
            : p
        ));
      }
    } catch (err) {
      console.error('[AllPosts] Exce��o ao dar like:', err);
      // Reverter optimistic update em caso de erro
      setLiked(prev => ({ ...prev, [postId]: wasLiked }));
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: (p.likes_count || 0) + (wasLiked ? 1 : -1) }
          : p
      ));
    }
  };

  const filtered = posts.filter(p => {
    const province = p.province || p.provincia || '';
    const matchProv = filter === 'Todas' || province === filter;
    if (!matchProv) return false;
    if (!search) return true;
    const text = `${p.description || p.content || ''} ${p.name || p.title || ''} ${p.autor?.name || p.author?.name || ''} ${province}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // Normaliza um item da API para o formato de exibição - com campos de localização completos
  const normalizePost = (p: ApiPost) => {
    const loc = (p as any).location || {};
    return {
      id:          p.id,
      name:        p.name || p.title || 'Post',
      category:    translatePostCategory(p.category) || 'Publicação',
      lat:         p.lat ?? loc.latitude  ?? 0,
      lng:         p.lng ?? loc.longitude ?? 0,
      endereco:    p.endereco || loc.address || '',
      autor:       p.autor || { name: p.author?.name || 'Utilizador', type: p.author?.type || p.author?.role || undefined },
      author:      p.author || { id: '', name: p.autor?.name || 'Utilizador', avatar: undefined },
      description: p.description || p.content || '',
      image:       extractImages(p)[0] ?? PLACEHOLDER_IMAGE,
      rating:      p.rating || 0,
      // Campos de localização — hierarquia completa, sem municipality
      province:    (p as any).province  || loc.province  || p.provincia || '',
      provincia:   (p as any).province  || loc.province  || p.provincia || '',
      district:    (p as any).district  || loc.district  || p.distrito  || '',
      distrito:    (p as any).district  || loc.district  || p.distrito  || '',
      administrative_post: (p as any).administrative_post || loc.administrative_post || loc.administrative_area || '',
      locality:    (p as any).locality  || loc.locality  || loc.city    || (p as any).city || '',
      nearby_reference: (p as any).nearby_reference || loc.nearby_reference || '',
      city:        (p as any).city      || loc.city      || loc.town    || '',
      address:     (p as any).address   || loc.address   || p.endereco  || '',
      // Objecto location nested — hierarquia completa preservada para fromApi()
      location: {
        country:            loc.country             || 'Moçambique',
        province:           (p as any).province     || loc.province  || p.provincia || '',
        district:           (p as any).district     || loc.district  || p.distrito  || '',
        administrative_post:(p as any).administrative_post || loc.administrative_post || loc.administrative_area || '',
        locality:           (p as any).locality     || loc.locality  || loc.city    || '',
        nearby_reference:   (p as any).nearby_reference || loc.nearby_reference || '',
        address:            (p as any).address      || loc.address   || p.endereco  || '',
        latitude:           p.lat ?? loc.latitude   ?? undefined,
        longitude:          p.lng ?? loc.longitude  ?? undefined,
      },
      badge:       p.badge || translatePostCategory(p.category),
      badgeBg:     p.badgeBg || postCategoryColor(p.category),
      likes_count: p.likes_count || 0,
      melhorEpoca: p.melhorEpoca || '',
    };
  };

  if (selectedPost) {
    const post = normalizePost(selectedPost);
    return (
      <PostDetail
        post={{
          id:             post.id,
          author:         { id: post.author.id || '', name: post.autor.name, avatar: post.author.avatar, type: post.autor.type || '' },
          description:    post.description,
          image:          post.image,
          images:         (selectedPost.images && selectedPost.images.length > 0) ? selectedPost.images : [post.image],
          likes_count:    post.likes_count,
          comments_count: (selectedPost as any).comments_count ?? 0,
          shares_count:   (selectedPost as any).shares_count ?? 0,
          saves_count:    (selectedPost as any).saves_count ?? 0,
          is_liked:       liked[post.id] ?? false,
          is_saved:       (selectedPost as any).userInteraction?.hasSaved ?? false,
          created_at:     (selectedPost as any).created_at || (selectedPost as any).createdAt || '',
          // Localização completa — hierarquia oficial
          province:       post.province,
          district:       post.district,
          city:           post.locality || post.city,
          address:        post.address,
          local_address:  post.address || post.endereco,
          local_lat:      post.lat ? String(post.lat) : undefined,
          local_lng:      post.lng ? String(post.lng) : undefined,
          location:       post.location,
        }}
        onBack={() => setSelectedPost(null)}
        onLike={(id) => {
          // Sincroniza o estado da lista quando o like muda no PostDetail
          setLiked(prev => ({ ...prev, [id]: !prev[id] }));
          setPosts(prev => prev.map(p =>
            p.id === id
              ? { ...p, likes_count: (p.likes_count || 0) + (liked[id] ? -1 : 1) }
              : p
          ));
        }}
        onSave={() => {}}
        onShare={() => {
          const title = post.name;
          const text = `${post.description}\nDescobre mais em Txopela Tour!`;
          if (navigator.share) navigator.share({ title, text, url: window.location.origin });
          else navigator.clipboard?.writeText(`${title}\n${text}\n${window.location.origin}`);
        }}
        onAuthorPress={a => {
          setSelectedPost(null);
          onAuthorPress?.({ id: a.id, name: a.name, avatar: a.avatar, type: a.type || '' });
        }}
      />
    );
  }

  return (
    <motion.div
      className="min-h-screen pb-24"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* -- HEADER -------------------------------------------------------- */}
      <div className="sticky top-0 z-30 px-4 pt-5 pb-3"
        style={{ background: dm.surface, borderBottom: `1px solid ${dm.border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? '#22263A' : '#F3F4F6' }}>
            <ChevronLeft size={20} style={{ color: dm.text }} />
          </button>
          <h1 className="text-lg font-black" style={{ color: dm.text }}>Publicações</h1>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3"
          style={{ background: dm.input, borderColor: dm.inputBorder }}>
          <Search size={15} style={{ color: dm.text2, flexShrink: 0 }} />
          <input type="text" placeholder="Pesquisar publicações..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: dm.text }} />
          {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: dm.text2 }} /></button>}
        </div>

        {/* Filtro por província */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {provincias.map(p => (
            <button key={p} onClick={() => setFilter(p)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: filter === p ? '#1B5E3B' : dm.pill,
                color: filter === p ? 'white' : dm.text2,
                border: `1px solid ${filter === p ? '#1B5E3B' : dm.pillBorder}`,
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* -- CONTE�DO ------------------------------------------------------- */}
      <div className="px-4 pt-4 max-w-5xl mx-auto">
        {isLoading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-sm animate-pulse"
                style={{ background: dm.surface }}>
                <div className="h-48" style={{ background: dm.skel }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded w-3/4" style={{ background: dm.skel }} />
                  <div className="h-3 rounded w-1/2" style={{ background: dm.skel }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            <p className="text-sm font-bold text-red-500">{error}</p>
            <button
              onClick={() => fetchPosts(true)}
              className="px-4 py-2 rounded-full text-xs font-bold text-white"
              style={{ background: '#1B5E3B' }}
            >
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>Nenhuma publica��o encontrada</p>
            <button
              onClick={() => { setSearch(''); setFilter('Todas'); }}
              className="text-xs font-bold"
              style={{ color: '#1B5E3B' }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((raw, i) => {
                const post = normalizePost(raw);
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    style={{ background: dm.surface }}
                  >
                    {/* Imagem */}
                    <div className="relative overflow-hidden" style={{ height: 200 }}>
                      <img
                        src={post.image}
                        alt={post.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />

                      {/* Options menu (for own posts) */}
                      {user && post.author.id === user.id && (
                        <div className="absolute top-3 left-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOptionsMenu(showOptionsMenu === post.id ? null : post.id);
                            }}
                            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                          >
                            <MoreVertical size={14} style={{ color: '#1A1A1A' }} />
                          </button>
                          
                          {/* Options dropdown */}
                          {showOptionsMenu === post.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="absolute top-10 left-0 rounded-xl shadow-lg overflow-hidden z-10"
                              style={{ minWidth: 150, background: dm.surface, border: `1px solid ${dm.border}` }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowOptionsMenu(null);
                                  onEditPost?.(post.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left"
                                style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
                                <Edit2 size={14} style={{ color: isDark ? '#93C5FD' : '#2563EB' }} />
                                <span style={{ color: dm.text }}>Editar</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowOptionsMenu(null);
                                  if (confirm('Tens a certeza de que queres apagar esta publica��o?')) {
                                    handleDeletePost(post.id);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 transition-colors text-left"
                              >
                                <Trash2 size={14} className="text-red-600" />
                                <span className="text-red-600">Apagar</span>
                              </button>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Indicador de múltiplas imagens — mesmo estilo dos dots do ImageCarousel */}
                      {raw.images && raw.images.length > 1 && (
                        <div className="absolute top-3 right-3 flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span className="text-[10px] font-black text-white leading-none">{raw.images.length}</span>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="absolute top-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow"
                        style={{ right: raw.images && raw.images.length > 1 ? '2.75rem' : '0.75rem' }}>
                        <IconStar size={11} fill="#FBBF24" stroke="none" />
                        <span className="text-xs font-black" style={{ color: '#1A1A1A' }}>{post.rating}</span>
                      </div>

                      {/* Badge */}
                      {post.badge && (
                        <span className="absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ background: post.badgeBg }}>
                          {post.badge}
                        </span>
                      )}

                      {/* Autor + descri��o */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <button
                          className="flex items-center gap-2 mb-1 w-full text-left"
                          onClick={(e) => { e.stopPropagation(); onAuthorPress?.({ id: post.author.id || '', name: post.autor.name, avatar: post.author.avatar, type: post.autor.type || 'traveler' }); }}
                          style={{ cursor: onAuthorPress ? 'pointer' : 'default' }}
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2BB5C8] to-[#1B5E3B] flex items-center justify-center flex-shrink-0 border border-white/60">
                            {post.author.avatar ? (
                              <img src={post.author.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span className="text-[9px] font-black text-white">{post.autor.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-black text-white leading-none text-left">{post.autor.name}</p>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <IconMapPin size={8} color="rgba(255,255,255,0.65)" />
                              <span className="text-[9px] text-white/65">{post.provincia}</span>
                            </div>
                          </div>
                        </button>
                        <p className="text-white font-bold text-xs leading-tight line-clamp-2">{post.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-3 py-2 flex items-center justify-between"
                      style={{ borderTop: `1px solid ${dm.border}` }}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleLike(post.id)} className="flex items-center gap-1">
                          <IconHeart size={15} fill={liked[post.id] ? '#EF4444' : 'none'}
                            color={liked[post.id] ? '#EF4444' : dm.text2} strokeWidth={1.8} />
                          <span className="text-xs" style={{ color: dm.text2 }}>
                            {(post.likes_count ?? 0) + (liked[post.id] && !raw.userInteraction?.hasLiked ? 1 : 0)}
                          </span>
                        </button>
                        {/* Botão guardar nos favoritos */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite({
                              id:    post.id,
                              type:  'post',
                              name:  post.description?.slice(0, 60) ?? post.name ?? 'Publicação',
                              image: post.image ?? PLACEHOLDER_IMAGE,
                              tag:   post.badge,
                              provincia: post.province ?? post.provincia ?? '',
                              categoryKey: 'post',
                              raw,
                            });
                          }}
                          className="flex items-center gap-1"
                          title={isFavorite(post.id) ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
                        >
                          <Heart
                            size={15}
                            fill={isFavorite(post.id) ? '#0077B6' : 'none'}
                            color={isFavorite(post.id) ? '#0077B6' : dm.text2}
                            strokeWidth={1.8}
                          />
                        </button>
                        <button onClick={() => setSuggested(p => ({ ...p, [post.id]: !p[post.id] }))}
                          className="flex items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke={suggested[post.id] ? '#1B5E3B' : dm.text2} strokeWidth="2.2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                          </svg>
                          <span className="text-xs" style={{ color: suggested[post.id] ? '#1B5E3B' : dm.text2 }}>
                            {suggested[post.id] ? 'Sugerido' : 'Sugerir'}
                          </span>
                        </button>
                      </div>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSelectedPost(raw)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black border"
                        style={{ borderColor: dm.btnBorder, color: dm.text }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="3" /><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                        </svg>
                        Detalhes
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && !isLoading && (
              <div className="flex justify-center pt-4 pb-2">
                <button
                  onClick={() => fetchPosts(false)}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-white"
                  style={{ background: '#1B5E3B' }}
                >
                  Carregar mais
                </button>
              </div>
            )}

            {/* Loading more indicator */}
            {isLoading && posts.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1B5E3B] rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
