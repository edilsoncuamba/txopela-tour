import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Grid, Star, MessageCircle, Share2, Expand, Loader2, UserPlus, UserCheck } from 'lucide-react';
import PostDetail from '@/pages/PostDetail';
import UserListModal, { type UserSummary } from '@/components/UserListModal';
import { usersApi, postsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  type: string;
}

interface Post {
  id: string;
  author: Author;
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
  // Campos de localização
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
  allPosts?: Post[];   // opcional � se n�o for passado, carrega da API
  onBack: () => void;
}

const typeLabels: Record<string, string> = {
  guide:    'Guia Tur�stico',
  traveler: 'Viajante',
  resident: 'Morador Local',
  business: 'Neg�cio',
  tourist:  'Turista',
};

// -- PublicProfile ------------------------------------------------------------
// Implementa exactamente a sec��o 1.3 da documenta��o:
//
//   GET    /api/users/{userId}        ? carrega perfil p�blico + isFollowing
//   POST   /api/users/{userId}/follow ? seguir   ? { success, isFollowing: true  }
//   DELETE /api/users/{userId}/follow ? deixar   ? { success, isFollowing: false }
// -----------------------------------------------------------------------------
export default function PublicProfile({
  author, allPosts, onBack }: PublicProfileProps) {
  useScrollTop();
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();
  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#6B7A99' : '#9CA3AF',
    back:    isDark ? '#22263A' : '#F3F4F6',
    skel:    isDark ? '#22263A' : '#E5E7EB',
  };

  // Estado do perfil p�blico (carregado via GET /api/users/{userId})
  const [profile, setProfile] = useState<{
    name:        string;
    avatar?:     string;
    bio?:        string;
    joinedAt?:   string;
    isFollowing: boolean;
    stats: {
      postsCount:     number;
      followersCount: number;
      followingCount: number;
      servicesCount:  number;
      localsCount:    number;
    };
  } | null>(null);

  const [isLoadingProfile,  setIsLoadingProfile]  = useState(true);
  const [isFollowLoading,   setIsFollowLoading]   = useState(false);
  const [posts,             setPosts]             = useState<Post[]>(allPosts || []);
  const [isLoadingPosts,    setIsLoadingPosts]    = useState(!allPosts);
  const [selectedPost,      setSelectedPost]      = useState<Post | null>(null);
  const [nestedProfile,     setNestedProfile]     = useState<Author | null>(null);
  const [userListModal,     setUserListModal]     = useState<{ title: string; users: UserSummary[] } | null>(null);

  // -- Carregar perfil p�blico ------------------------------------------------
  // GET /api/users/{userId} � sec��o 1.2 / 1.3
  useEffect(() => {
    const load = async () => {
      setIsLoadingProfile(true);
      try {
        const { data, error } = await usersApi.getPublicProfile(author.id);
        if (error || !data?.user) return;
        const u = data.user;
        setProfile({
          name:        u.name        || author.name,
          avatar:      u.avatar,
          bio:         u.bio,
          joinedAt:    u.joinedAt,
          isFollowing: u.isFollowing ?? false,
          stats: {
            postsCount:     u.stats?.postsCount     ?? 0,
            followersCount: u.stats?.followersCount ?? 0,
            followingCount: u.stats?.followingCount ?? 0,
            servicesCount:  u.stats?.servicesCount  ?? 0,
            localsCount:    u.stats?.localsCount    ?? 0,
          },
        });
      } catch {
        // usa dados passados via props como fallback
      } finally {
        setIsLoadingProfile(false);
      }
    };
    load();
  }, [author.id]);

  // -- Carregar posts do utilizador -------------------------------------------
  // GET /api/posts?userId={authorId} � sec��o 2.1
  useEffect(() => {
    if (allPosts) return; // j� tem posts, n�o precisa carregar
    const load = async () => {
      setIsLoadingPosts(true);
      try {
        const { data } = await postsApi.list({ userId: author.id, page: 1, limit: 50 });
        if (data) {
          // A API devolve { success, posts: [...], pagination: {...} }
          const items = data.posts ?? data.results ?? (Array.isArray(data) ? data : []);
          setPosts(items.map((p: any) => {
            const loc = p.location || {};
            return {
              id:             String(p.id),
              author:         { id: String(p.author?.id || ''), name: p.author?.name || 'Utilizador', avatar: p.author?.avatar, type: p.author?.role || p.author?.type || undefined },
              description:    p.title || p.content || '',
              image:          p.images?.[0] || p.cover_image,
              images:         p.images,
              likes_count:    p.stats?.likesCount    ?? p.likes_count    ?? 0,
              comments_count: p.stats?.commentsCount ?? p.comments_count ?? 0,
              shares_count:   p.stats?.sharesCount   ?? 0,
              saves_count:    0,
              is_liked:       p.userInteraction?.hasLiked  ?? false,
              is_saved:       p.userInteraction?.hasSaved  ?? false,
              created_at:     p.createdAt || p.created_at || new Date().toISOString(),
              // Campos de localização completos
              province:      p.province    || loc.province    || p.provincia || '',
              // district é o Distrito real — municipality é apenas compatibilidade de envio
              district:      p.district    || loc.district    || p.distrito || '',
              city:          p.city        || loc.city        || loc.town || '',
              address:       p.address     || loc.address     || p.endereco || '',
              local_address: p.address     || loc.address     || p.endereco || '',
              local_lat:     (p.lat ?? loc.latitude)  != null ? String(p.lat ?? loc.latitude)  : undefined,
              local_lng:     (p.lng ?? loc.longitude) != null ? String(p.lng ?? loc.longitude) : undefined,
              location: {
                latitude:  p.lat    ?? loc.latitude  ?? undefined,
                longitude: p.lng    ?? loc.longitude ?? undefined,
                address:   p.address || loc.address  || '',
                province:  p.province || loc.province || '',
                district:  p.district || loc.district || '',
                city:      p.city     || loc.city     || '',
              },
            };
          }));
        }
      } catch {
        // mant�m vazio
      } finally {
        setIsLoadingPosts(false);
      }
    };
    load();
  }, [author.id, allPosts]);

  // -- Seguir / Deixar de seguir ----------------------------------------------
  // POST   /api/users/{userId}/follow ? { success, isFollowing: true  }
  // DELETE /api/users/{userId}/follow ? { success, isFollowing: false }
  const handleToggleFollow = async () => {
    if (!profile || isFollowLoading) return;

    const willFollow = !profile.isFollowing;

    // Optimistic UI � actualiza imediatamente antes da resposta
    setProfile(prev => prev ? {
      ...prev,
      isFollowing: willFollow,
      stats: {
        ...prev.stats,
        followersCount: prev.stats.followersCount + (willFollow ? 1 : -1),
      },
    } : prev);

    setIsFollowLoading(true);
    try {
      const { data, error } = willFollow
        ? await usersApi.follow(author.id)     // POST /api/users/{userId}/follow
        : await usersApi.unfollow(author.id);  // DELETE /api/users/{userId}/follow

      if (error || !data) {
        // Reverter optimistic update em caso de erro
        setProfile(prev => prev ? {
          ...prev,
          isFollowing: !willFollow,
          stats: {
            ...prev.stats,
            followersCount: prev.stats.followersCount + (willFollow ? -1 : 1),
          },
        } : prev);
        return;
      }

      // Confirmar com o estado real da API { success, isFollowing }
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: data.isFollowing,
      } : prev);

    } catch {
      // Reverter optimistic update
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: !willFollow,
        stats: {
          ...prev.stats,
          followersCount: prev.stats.followersCount + (willFollow ? -1 : 1),
        },
      } : prev);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // -- Navega��o --------------------------------------------------------------
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
    return (
      <PublicProfile
        author={nestedProfile}
        onBack={() => setNestedProfile(null)}
      />
    );
  }

  const displayName   = profile?.name        || author.name;
  const displayAvatar = profile?.avatar      || author.avatar;
  const displayBio    = profile?.bio         || '';
  const stats         = profile?.stats       || { postsCount: 0, followersCount: 0, followingCount: 0, servicesCount: 0, localsCount: 0 };
  const isFollowing   = profile?.isFollowing ?? false;
  const isOwnProfile  = currentUser?.id === author.id;

  // -- Render ----------------------------------------------------------------
  return (
    <motion.div
      className="min-h-screen pb-24"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* -- Header -------------------------------------------------------- */}
      <div className="px-4 py-4 sticky top-0 z-30 flex items-center justify-between shadow-sm"
        style={{ background: dm.surface, borderBottom: `1px solid ${dm.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: dm.back }}>
            <ChevronLeft size={20} style={{ color: dm.text }} />
          </button>
          <h1 className="text-base font-black truncate max-w-[200px]" style={{ color: dm.text }}>
            {displayName}
          </h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <Share2 size={18} style={{ color: '#6B7280' }} />
        </motion.button>
      </div>

      {/* -- Perfil -------------------------------------------------------- */}
      <div className="px-4 pb-5" style={{ background: dm.surface }}>
        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={28} className="animate-spin" style={{ color: '#1B5E3B' }} />
          </div>
        ) : (
          <>
            {/* Avatar + Stats */}
            <div className="flex items-center gap-5 pt-5 pb-4">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #2BB5C8, #1B5E3B)' }}
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Stats � posts, seguidores, a seguir */}
              <div className="flex-1 flex items-center justify-around">
                <div className="text-center">
                  <p className="text-lg font-black" style={{ color: dm.text }}>{stats.postsCount}</p>
                  <p className="text-[11px] font-semibold" style={{ color: dm.text2 }}>publicações</p>
                </div>
                <button
                  className="text-center"
                  onClick={() => setUserListModal({ title: 'Seguidores', users: [] })}
                >
                  <p className="text-lg font-black" style={{ color: dm.text }}>
                    {stats.followersCount >= 1000
                      ? `${(stats.followersCount / 1000).toFixed(1)}k`
                      : stats.followersCount}
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: dm.text2 }}>seguidores</p>
                </button>
                <button
                  className="text-center"
                  onClick={() => setUserListModal({ title: 'A seguir', users: [] })}
                >
                  <p className="text-lg font-black" style={{ color: dm.text }}>{stats.followingCount}</p>
                  <p className="text-[11px] font-semibold" style={{ color: dm.text2 }}>a seguir</p>
                </button>
              </div>
            </div>

            {/* Nome + Bio + Localiza��o */}
            <div className="mb-4">
              <p className="text-sm font-black mb-0.5" style={{ color: dm.text }}>{displayName}</p>
              <p className="text-xs font-semibold mb-1" style={{ color: dm.text2 }}>
                {typeLabels[author.type] || author.type}
              </p>
              {displayBio && (
                <p className="text-sm leading-snug mb-1.5" style={{ color: isDark ? '#A8B4CC' : '#374151' }}>{displayBio}</p>
              )}
              {profile?.joinedAt && (
                <div className="flex items-center gap-1">
                  <MapPin size={11} style={{ color: '#2BB5C8' }} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    Membro desde {new Date(profile.joinedAt).getFullYear()}
                  </span>
                </div>
              )}
            </div>

            {/* Bot�es de ac��o � Seguir / A seguir */}
            {/* S� mostra se n�o for o pr�prio perfil */}
            {!isOwnProfile && (
              <div className="flex gap-2">
                {/* Bot�o Seguir / A seguir � sec��o 1.3 */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToggleFollow}
                  disabled={isFollowLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={isFollowing ? {
                    background: '#F3F4F6',
                    color: '#374151',
                    border: '1.5px solid #E5E7EB',
                  } : {
                    background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                    color: 'white',
                    boxShadow: '0 2px 12px rgba(15,76,42,0.25)',
                  }}
                >
                  {isFollowLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isFollowing ? (
                    <><UserCheck size={14} /> A seguir</>
                  ) : (
                    <><UserPlus size={14} /> Seguir</>
                  )}
                </motion.button>

                {/* Bot�o Mensagem */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
                  style={{ background: '#F3F4F6', color: '#374151', border: '1.5px solid #E5E7EB' }}
                >
                  <MessageCircle size={14} />
                  Mensagem
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Divider + Tab */}
      <div className="border-t flex items-center justify-center py-3 mb-1"
        style={{ background: dm.surface, borderColor: dm.border }}>
        <Grid size={18} style={{ color: dm.text }} strokeWidth={2.5} />
      </div>

      {/* -- Grid de Posts ------------------------------------------------- */}
      {isLoadingPosts ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={24} className="animate-spin" style={{ color: '#1B5E3B' }} />
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer group"
              onClick={() => setSelectedPost(post)}
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Grid size={24} className="text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-white text-xs font-bold">
                    <Star size={12} fill="white" stroke="none" />
                    {post.likes_count}
                  </div>
                  <div className="flex items-center gap-1 text-white text-xs font-bold">
                    <MessageCircle size={12} fill="white" stroke="none" />
                    {post.comments_count}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <Grid size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>Sem publica��es</p>
        </div>
      )}

      {/* -- User List Modal ----------------------------------------------- */}
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


