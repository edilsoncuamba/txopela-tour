import { useState, useEffect, useCallback } from 'react';
import { PLACEHOLDER_IMAGE, extractImages } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Camera, ChevronRight, X, ChevronLeft,
  Star, MapPin, Search, Users, Compass, Send, Heart,
  UserPlus, UserCheck, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DestinationDetail from '@/pages/DestinationDetail';
import { localsApi, usersApi } from '@/services/api';
import type { Local } from '@/types';
import { useScrollTop } from '@/hooks/useScrollTop';

interface ProfileProps {
  onSettings: () => void;
  onLocalPress: (local: Local) => void;
  onLogout: () => void;
  onAddPost: () => void;
  onEditProfile?: () => void;
  onSuggest?: () => void;  // Novo: abre AddService ou AddLocal baseado no tipo de usu�rio
}

// -- Tipos internos ----------------------------------------------------------
interface Review {
  id: string; place: string; rating: number; comment: string; date: string;
  image: string; category: string; catColor: string; desc: string;
  provincia: string; reviews: number;
}
interface Suggestion {
  id: string; place: string; desc: string; status: string; date: string;
  image: string; category: string; catColor: string; rating: number;
  reviews: number; provincia: string;
}
interface Destination {
  id: string; place: string; desc: string; date: string; image: string;
  category: string; catColor: string; rating: number; reviews: number; provincia: string;
}
interface SearchItem { id: string; query: string; date: string; }

const CAT_COLOR: Record<string, string> = {
  Praias: '#2BB5C8', Natureza: '#1B5E3B', Cultura: '#7B5EA7',
  Gastronomia: '#E05A3A', Aventura: '#F4821F', default: '#6B7280',
};

// -- Destination card ---------------------------------------------------------
function DestCard({ item, onLike, liked, onClick }: {
  item: Destination; onLike?: () => void; liked?: boolean; onClick?: () => void;
}) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer" 
      onClick={onClick}
    >
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        <motion.img 
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4 }}
          src={item.image} 
          alt={item.place} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)' }} />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        >
          <Star size={11} fill="#FBBF24" stroke="none" />
          <span className="text-white text-xs font-bold">{item.rating}</span>
          <span className="text-white/70 text-[10px]">({item.reviews})</span>
        </motion.div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <p className="text-sm font-black leading-tight flex-1" style={{ color: '#1A1A1A' }}>{item.place}</p>
          <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: item.catColor + '20', color: item.catColor }}>{item.category}</span>
        </div>
        <p className="text-[11px] leading-snug mb-2.5" style={{ color: '#6B7280' }}>{item.desc}</p>
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={e => { e.stopPropagation(); onLike?.(); }} 
              style={{ color: liked ? '#EF4444' : '#9CA3AF' }}
            >
              <motion.div
                animate={liked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
              </motion.div>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1" 
              style={{ color: '#9CA3AF' }} 
              onClick={e => e.stopPropagation()}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
              <span className="text-[10px] font-semibold">Sugerir</span>
            </motion.button>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white" 
            style={{ background: '#1B5E3B' }}
            onClick={e => { e.stopPropagation(); onClick?.(); }}
          >
            Ver detalhes
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// -- Reviews screen -----------------------------------------------------------
function ReviewsScreen({ onBack }: { onBack: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Review | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = (await usersApi.myReviews()) ?? { data: null };
        const items: any[] = Array.isArray(data) ? data : (data?.results ?? data?.reviews ?? []);
        setReviews(items.map((r: any) => ({
          id: String(r.id),
          place: r.local?.name || r.place || 'Local',
          rating: parseFloat(r.rating ?? 0) || 5,
          comment: r.comment || r.text || '',
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-PT') : '',
          image: extractImages(r.local)[0] ?? PLACEHOLDER_IMAGE,
          category: r.local?.category?.name || r.category || 'Local',
          catColor: CAT_COLOR[r.local?.category?.name] || CAT_COLOR.default,
          desc: r.local?.description || '',
          provincia: r.local?.location?.province || '',
          reviews: r.local?.rating?.count ?? 0,
        })));
      } catch {
        setReviews([]);
      } finally { setIsLoading(false); }
    };
    load();
  }, []);

  if (selected) {
    return (
      <DestinationDetail
        destination={{ 
          id: selected.id, 
          name: selected.place, 
          category: selected.category, 
          provincia: selected.provincia, 
          desc: selected.desc, 
          image: selected.image, 
          rating: selected.rating, 
          reviews: selected.reviews, 
          melhorEpoca: 'Todo o ano' 
        }}
        onBack={() => setSelected(null)} 
        onExploreMore={() => setSelected(null)} 
      />
    );
  }
  return (
    <motion.div 
      className="min-h-screen pb-24" 
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Avalia��es e coment�rios</h1>
      </div>
      <div className="px-4 pt-4 space-y-3">
        {isLoading ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <Star size={40} color="#D1D5DB" strokeWidth={1.5} />
            <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>Ainda n�o fizeste nenhuma avalia��o</p>
          </div>
        ) : (
          <>{reviews.map((r, index) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(r)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer"
            >
              <div className="flex gap-3 p-3">
                <div className="relative flex-shrink-0 overflow-hidden rounded-xl" style={{ width: 72, height: 72 }}>
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    src={r.image}
                    alt={r.place}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: r.catColor, color: 'white' }}>{r.category}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black mb-1" style={{ color: '#1A1A1A' }}>{r.place}</p>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1,2,3,4,5].map(star => (
                      <motion.div
                        key={star}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + star * 0.05 }}
                      >
                        <Star size={12} fill={r.rating >= star ? '#FBBF24' : 'none'} stroke={r.rating >= star ? '#FBBF24' : '#D1D5DB'} strokeWidth={1.5} />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs leading-snug" style={{ color: '#6B7280' }}>{r.comment}</p>
                  <p className="text-[10px] mt-1" style={{ color: '#C7C7CC' }}>{r.date}</p>
                </div>
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <ChevronRight size={16} className="flex-shrink-0 self-center" style={{ color: '#D1D5DB' }} />
                </motion.div>
              </div>
            </motion.div>
          ))}</>
        )}
      </div>
    </motion.div>
  );
}

// -- Suggestions screen --------------------------------------------------------
function SuggestionsScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'Todos' | 'Aprovado' | 'Em revis�o' | 'Cancelado'>('Todos');
  const [selected, setSelected] = useState<Suggestion | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // GET /api/locals/ � filtra pelo owner.id do utilizador autenticado (via AuthContext)
        const { data } = await localsApi.list({ limit: 100 });
        const allLocals: any[] = data?.locals || [];
        const myLocals = user?.id
          ? allLocals.filter((l: any) =>
              l.owner?.id === user.id ||
              l.author?.id === user.id ||
              l.created_by?.id === user.id
            )
          : allLocals;
        setSuggestions(myLocals.map((s: any) => ({
          id: String(s.id),
          place: s.name || 'Local',
          desc: s.description || '',
          status: s.status === 'approved' ? 'Aprovado' : s.status === 'rejected' ? 'Cancelado' : 'Em revis�o',
          date: s.createdAt ? new Date(s.createdAt).toLocaleDateString('pt-PT') : '',
          image: extractImages(s)[0] ?? PLACEHOLDER_IMAGE,
          category: s.category || 'Local',
          catColor: CAT_COLOR[s.category] || CAT_COLOR.default,
          rating: s.rating?.average ?? 0,
          reviews: s.rating?.count ?? 0,
          provincia: s.location?.province || '',
        })));
      } catch {
        setSuggestions([]);
      } finally { setIsLoading(false); }
    };
    load();
  }, []);

  const statusColor: Record<string, string> = { 'Aprovado': '#1B5E3B', 'Em revis�o': '#F4821F', 'Cancelado': '#EF4444' };
  const statusBg: Record<string, string>    = { 'Aprovado': '#EEF7F0', 'Em revis�o': '#FFF3E0', 'Cancelado': '#FEF2F2' };
  const filters = ['Todos', 'Aprovado', 'Em revis�o', 'Cancelado'] as const;
  const filtered = filter === 'Todos' ? suggestions : suggestions.filter(s => s.status === filter);

  if (selected) {
    return (
      <DestinationDetail
        destination={{ id: selected.id, name: selected.place, category: selected.category,
          provincia: selected.provincia, desc: selected.desc, image: selected.image,
          rating: selected.rating, reviews: selected.reviews, melhorEpoca: 'Todo o ano' }}
        onBack={() => setSelected(null)} onExploreMore={() => setSelected(null)} />
    );
  }

  return (
    <motion.div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>
      <div className="bg-white px-4 pt-5 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Meus pontos sugeridos</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
              style={{ background: filter === f ? '#1B5E3B' : '#F3F4F6', color: filter === f ? 'white' : '#6B7280' }}>
              {f}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {isLoading
          ? [1, 2].map(i => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />)
          : filtered.length === 0
            ? (
              <div className="col-span-2 flex flex-col items-center py-16 gap-2">
                <Send size={40} color="#D1D5DB" strokeWidth={1.5} />
                <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>
                  {filter === 'Todos' ? 'Ainda n�o sugeriste nenhum local' : `Nenhuma sugest�o "${filter}"`}
                </p>
              </div>
            )
            : filtered.map((s, index) => (
              <motion.div key={s.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 15 }}
                whileTap={{ scale: 0.97 }} onClick={() => setSelected(s)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer">
                <div className="relative" style={{ height: 140 }}>
                  <img src={s.image || PLACEHOLDER_IMAGE} alt={s.place} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)' }} />
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: statusBg[s.status] || '#F3F4F6', color: statusColor[s.status] || '#6B7280' }}>
                    {s.status}
                  </span>
                  <motion.button whileTap={{ scale: 0.85 }}
                    onClick={e => { e.stopPropagation(); setLiked(prev => ({ ...prev, [s.id]: !prev[s.id] })); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.35)' }}>
                    <Heart size={13} fill={liked[s.id] ? '#0EA5E9' : 'none'} color={liked[s.id] ? '#0EA5E9' : 'white'} />
                  </motion.button>
                </div>
                <div className="p-2.5">
                  <h3 className="text-sm font-black mb-0.5 leading-tight" style={{ color: '#1A1A1A' }}>{s.place}</h3>
                  {s.provincia && (
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin size={10} style={{ color: '#9CA3AF' }} />
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{s.provincia}</span>
                    </div>
                  )}
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#EEF7F0', color: '#1B5E3B' }}>{s.category}</span>
                </div>
              </motion.div>
            ))
        }
      </div>
    </motion.div>
  );
}


// -- Destinations screen
function DestinationsScreen({ onBack }: { onBack: () => void }) {
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Destination | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await localsApi.list({ sortBy: 'recent', limit: 20 });
        const items: any[] = data?.locals || [];
        setDestinations(items.map((d: any) => ({
          id: String(d.id), place: d.name || 'Local', desc: d.description || '',
          date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-PT') : '',
          image: extractImages(d)[0] ?? PLACEHOLDER_IMAGE,
          category: d.category || 'Local', catColor: CAT_COLOR[d.category] || CAT_COLOR.default,
          rating: d.rating?.average ?? 0, reviews: d.rating?.count ?? 0,
          provincia: d.location?.province || '',
        })));
      } catch { setDestinations([]); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  if (selected) {
    return (
      <DestinationDetail
        destination={{ id: selected.id, name: selected.place, category: selected.category,
          provincia: selected.provincia, desc: selected.desc, image: selected.image,
          rating: selected.rating, reviews: selected.reviews, melhorEpoca: 'Todo o ano' }}
        onBack={() => setSelected(null)} onExploreMore={() => setSelected(null)} />
    );
  }

  return (
    <motion.div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Destinos explorados</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {isLoading
          ? [1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />)
          : destinations.length === 0
            ? <div className="col-span-2 flex flex-col items-center py-16 gap-2">
                <Compass size={40} color="#D1D5DB" strokeWidth={1.5} />
                <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>Ainda nao exploraste destinos</p>
              </div>
            : destinations.map(d => (
                <DestCard key={d.id} item={d} liked={liked[d.id]}
                  onLike={() => setLiked(p => ({ ...p, [d.id]: !p[d.id] }))}
                  onClick={() => setSelected(d)} />
              ))
        }
      </div>
    </motion.div>
  );
}

// -- Searches screen
function SearchesScreen({ onBack }: { onBack: () => void }) {
  return (
    <motion.div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Pesquisas recentes (IA)</h1>
      </div>
      <div className="flex flex-col items-center py-16 gap-2">
        <Search size={40} color="#D1D5DB" strokeWidth={1.5} />
        <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>Ainda nao fizeste pesquisas</p>
      </div>
    </motion.div>
  );
}

// -- Suggested Profiles screen
const ROLE_LABEL: Record<string, string> = {
  tourist: 'Turista', local_resident: 'Residente', local_business: 'Negocio',
  guide: 'Guia', curator: 'Apurador', admin: 'Admin', business: 'Negocio',
};

interface UserSuggestion {
  id: string; name: string; avatar?: string; role: string;
  bio?: string; followersCount: number; isFollowing: boolean;
}

function SuggestedProfilesScreen({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [loadingFollow, setLoadingFollow] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await usersApi.getSuggestions({ limit: 20 });
        const list: any[] = data?.users ?? data?.results ?? (Array.isArray(data) ? data : []);
        setUsers(list.map((u: any) => ({
          id: String(u.id), name: u.name || u.username || 'Utilizador',
          avatar: u.avatar, role: u.role || 'tourist', bio: u.bio,
          followersCount: u.stats?.followersCount ?? u.followersCount ?? 0,
          isFollowing: u.isFollowing ?? false,
        })));
      } catch { setUsers([]); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleToggleFollow = useCallback(async (userId: string) => {
    const isNowFollowing = following[userId] ?? users.find(u => u.id === userId)?.isFollowing ?? false;
    setLoadingFollow(p => ({ ...p, [userId]: true }));
    try {
      if (isNowFollowing) { await usersApi.unfollow(userId); setFollowing(p => ({ ...p, [userId]: false })); }
      else { await usersApi.follow(userId); setFollowing(p => ({ ...p, [userId]: true })); }
    } catch (e: any) { setError(e?.message || 'Erro ao seguir'); }
    finally { setLoadingFollow(p => ({ ...p, [userId]: false })); }
  }, [following, users]);

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>
      <div className="bg-white px-4 pt-5 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Perfis Sugeridos</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#F3F4F6' }}>
          <Search size={15} color="#9CA3AF" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar utilizadores..." className="flex-1 bg-transparent text-sm outline-none" />
          {search && <button onClick={() => setSearch('')}><X size={14} color="#9CA3AF" /></button>}
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mx-4 mt-3 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#FEF2F2', color: '#DC2626' }}>
            <AlertCircle size={16} /><p className="text-xs flex-1">{error}</p>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-4 pt-4 space-y-3">
        {loading
          ? [1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-2/3" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
                <div className="w-20 h-9 bg-gray-200 rounded-xl" />
              </div>
            ))
          : filtered.length === 0
            ? <div className="flex flex-col items-center py-16 gap-3">
                <Users size={32} color="#D1D5DB" strokeWidth={1.5} />
                <p className="text-sm font-bold text-center" style={{ color: '#9CA3AF' }}>
                  {search ? `Nenhum resultado para "${search}"` : 'Sem sugestoes de momento'}
                </p>
              </div>
            : filtered.map((u, index) => {
                const isFollowingUser = following[u.id] ?? u.isFollowing;
                const isBtnLoading = loadingFollow[u.id] ?? false;
                return (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid #F3F4F6' }}>
                      {u.avatar
                        ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl font-black"
                            style={{ background: 'linear-gradient(135deg,#2BB5C8,#1B5E3B)', color: 'white' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: '#1A1A1A' }}>{u.name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                      {u.bio && <p className="text-xs mt-1 line-clamp-1" style={{ color: '#6B7280' }}>{u.bio}</p>}
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleToggleFollow(u.id)} disabled={isBtnLoading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
                      style={{ background: isFollowingUser ? '#F3F4F6' : '#1B5E3B', color: isFollowingUser ? '#6B7280' : 'white' }}>
                      {isBtnLoading
                        ? <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderTopColor: 'currentColor' }} />
                        : isFollowingUser ? <UserCheck size={13} strokeWidth={2.5} /> : <UserPlus size={13} strokeWidth={2.5} />}
                      <span>{isBtnLoading ? '...' : isFollowingUser ? 'A seguir' : 'Seguir'}</span>
                    </motion.button>
                  </motion.div>
                );
              })
        }
      </div>
    </motion.div>
  );
}

// -- Main Profile component
export default function Profile({
  onSettings, onLogout: _onLogout, onAddPost: _onAddPost, onEditProfile, onSuggest }: ProfileProps) {
  useScrollTop();
  const { user } = useAuth();
  const [communityDismissed, setCommunityDismissed] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'reviews'|'suggestions'|'destinations'|'searches'|'people'|null>(null);
  // name: user.name vem de mapApiUser que j� tenta u.name || u.username || email prefix
  const name = user?.name || user?.email?.split('@')[0] || 'Utilizador';

  const [liveStats, setLiveStats] = useState<Record<string, number> | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        setStatsLoading(true);
        // GET /api/users/me/ � perfil com stats
        // Envelope: { status, code, data: { id, username, stats: { localsCount, ... } } }
        // apiFetch j� extrai data do envelope
        const res = await usersApi.getProfile();
        if (cancelled) return;
        
        console.log('[Profile] getProfile response:', res);
        
        // res.data pode ser:
        // 1. { id, username, stats: { localsCount, ... } }  ? directo
        // 2. { user: { id, username, stats: { ... } } }      ? wrappado
        const profile = res.data?.user ?? res.data ?? {};
        const s = profile.stats ?? {};
        
        console.log('[Profile] stats:', s);
        console.log('[Profile] profile.username:', profile.username, 'profile.name:', profile.name);
        
        if (!cancelled) setLiveStats({
          locais:     s.localsCount   ?? s.locals_count   ?? 0,
          servicos:   s.servicesCount ?? s.services_count ?? 0,
          avaliacoes: s.reviewsCount  ?? s.reviews_count  ?? 0,
        });
      } catch (e) {
        console.error('[Profile] getProfile error:', e);
        if (!cancelled) setLiveStats({ locais: 0, servicos: 0, avaliacoes: 0 });
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const statsCount = {
    locaisAprovados: liveStats?.locais     ?? 0,
    servicos:        liveStats?.servicos   ?? 0,
    avaliacoes:      liveStats?.avaliacoes ?? 0,
    searches: 0,
  };

  const StatVal = ({ v }: { v: number }) => statsLoading
    ? <span className="inline-block w-7 h-5 rounded-md animate-pulse align-middle" style={{ background: '#E5E7EB' }} />
    : <>{v}</>;

  const stats = [
    { icon: <MapPin size={20} color="#1B5E3B" strokeWidth={1.8} />, value: statsCount.locaisAprovados, label: 'Locais',     bg: '#EEF7F0', screen: 'suggestions' as const },
    { icon: <Send   size={20} color="#2BB5C8" strokeWidth={1.8} />, value: statsCount.servicos,        label: 'Servicos',   bg: '#EBF8FB', screen: 'suggestions' as const },
    { icon: <Star   size={20} color="#FBBF24" fill="#FBBF24"  />,   value: statsCount.avaliacoes,      label: 'Avaliacoes', bg: '#FEF9EC', screen: 'reviews'     as const },
  ];

  const activities = [
    { icon: <MapPin  size={18} color="#1B5E3B" />, bg: '#EEF7F0', title: 'Meus pontos sugeridos',   desc: 'Locais turisticos que sugeriste', screen: 'suggestions'  as const, count: statsCount.locaisAprovados },
    { icon: <Users   size={18} color="#2BB5C8" />, bg: '#EBF8FB', title: 'Perfis Sugeridos',        desc: 'Pessoas que podes conhecer',     screen: 'people'       as const, count: 0 },
    { icon: <Compass size={18} color="#2BB5C8" />, bg: '#EBF8FB', title: 'Destinos explorados',     desc: 'Lugares que visitaste',          screen: 'destinations' as const, count: statsCount.locaisAprovados },
    { icon: <Search  size={18} color="#6B7280" />, bg: '#F3F4F6', title: 'Pesquisas recentes (IA)', desc: 'Ultimas buscas que fizeste',     screen: 'searches'     as const, count: statsCount.searches },
    { icon: <Star    size={18} color="#FBBF24" />, bg: '#FEF9EC', title: 'Avaliacoes e comentarios',desc: 'O que ja avaliaste',             screen: 'reviews'      as const, count: statsCount.avaliacoes },
  ];

  if (activeScreen === 'reviews')      return <ReviewsScreen           onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'suggestions')  return <SuggestionsScreen       onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'destinations') return <DestinationsScreen      onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'searches')     return <SearchesScreen          onBack={() => setActiveScreen(null)} />;
  if (activeScreen === 'people')       return <SuggestedProfilesScreen onBack={() => setActiveScreen(null)} />;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>

      {/* -- Hero banner ------------------------------------------------------ */}
      <div className="relative w-full" style={{ height: 180 }}>
        <img src="/images/local-1.jpg" alt="hero"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)' }} />
        {/* Settings btn */}
        <button onClick={onSettings}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <Settings size={20} className="text-white" strokeWidth={1.8} />
        </button>
      </div>

      {/* -- Conte�do principal centrado -------------------------------------- */}
      <div className="max-w-2xl mx-auto px-4">

        {/* Avatar + Nome � layout unificado mobile e desktop */}
        <div className="flex items-end -mt-14 mb-5 relative z-10">
          {/* Avatar + Nome lado a lado */}
          <div className="flex items-end gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg"
                style={{ border: '4px solid white' }}>
                {user?.avatar
                  ? <img src={user.avatar} alt={name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl font-black"
                      style={{ background: 'linear-gradient(135deg,#2BB5C8,#1B5E3B)', color: 'white' }}>
                      {name.charAt(0).toUpperCase()}
                    </div>}
              </div>
              {/* �cone de c�mara */}
              <button onClick={onEditProfile}
                className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow border-2 border-white"
                style={{ background: '#1B5E3B' }}>
                <Camera size={13} className="text-white" />
              </button>
            </div>
            {/* Nome ao lado do avatar */}
            <div className="pb-1">
              <h1 className="text-lg font-black leading-tight" style={{ color: '#1A1A1A' }}>{name}</h1>
              {user?.bio && (
                <p className="text-xs mt-0.5 leading-snug" style={{ color: '#6B7280' }}>{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats: Locais / Servi�os / Avalia��es */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {stats.map(s => (
            <motion.button key={s.label} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveScreen(s.screen)}
              className="rounded-2xl py-2.5 px-2 flex flex-col items-center gap-0.5 shadow-sm"
              style={{ background: s.bg }}>
              <span className="text-2xl font-black leading-tight" style={{ color: '#1A1A1A' }}>
                <StatVal v={s.value} />
              </span>
              <span className="text-[11px] font-semibold" style={{ color: '#6B7280' }}>{s.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Banner comunidade */}
        {!communityDismissed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl mb-5 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }}>
            {/* Padr�o decorativo de fundo */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 20% 80%, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }} />
            <div className="relative p-4">
              {/* Linha topo: t�tulo + fechar */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-white font-black text-sm leading-snug">
                  Faz parte da comunidade Txopela!
                </p>
                <button onClick={() => setCommunityDismissed(true)}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <X size={11} className="text-white" />
                </button>
              </div>
              <p className="text-white/75 text-xs leading-relaxed mb-3">
                A tua contribui��o ajuda a tornar Mo�ambique mais incr�vel para todos.
              </p>
              <button onClick={onSuggest}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white border border-white/30 transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.18)' }}>
                Sugerir local
              </button>
            </div>
          </motion.div>
        )}

        {/* Actividades / atalhos */}
        <div className="space-y-2 mb-5">
          {activities.map(a => (
            <motion.button key={a.title} whileTap={{ scale: 0.98 }}
              onClick={() => setActiveScreen(a.screen)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm text-left">
              {/* �cone */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: a.bg }}>
                {a.icon}
              </div>
              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate" style={{ color: '#1A1A1A' }}>{a.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{a.desc}</p>
              </div>
              {/* Contador + seta */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-sm font-black" style={{ color: '#1A1A1A' }}>{a.count}</span>
                <ChevronRight size={15} style={{ color: '#D1D5DB' }} />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Terminar sess�o � removido do perfil (dispon�vel em Defini��es) */}

      </div>{/* /max-w-2xl */}
    </div>
  );
}
