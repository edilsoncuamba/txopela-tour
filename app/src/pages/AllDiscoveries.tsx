import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Heart } from 'lucide-react';
import { CategoryIcon, CATEGORY_COLORS } from '@/components/icons';
import { localsApi } from '@/services/api';
import { mapValidLocal, filterValidPublications, PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { itemMatchesFilter } from '@/utils/translations';
import { useFavorites } from '@/context/FavoritesContext';
import { useScrollTop } from '@/hooks/useScrollTop';

interface Discovery {
  id: string;
  name: string;
  badge: string;
  badgeBg: string;
  rating: number;
  reviews: number;
  desc: string;
  tag: string;
  tagBg: string;
  image: string;
  images?: string[];
  categoryKey?: string;
  subcategory?: string;
  contributor?: { name: string; type: 'guide' | 'traveler' | 'resident' | 'business' };
}

interface AllDiscoveriesProps {
  onBack: () => void;
  onSelectDiscovery: (discovery: Discovery) => void;
}

// Cores por nome de categoria em PT (tag já vem traduzido do mapValidLocal)
const TAG_COLORS: Record<string, string> = {
  'Restaurante': '#E05A3A',
  'Hospedagem':  '#2563EB',
  'Atração':     '#1B5E3B',
  'Loja':        '#7B5EA7',
  'Serviço':     '#F4821F',
  'Praia':       '#2BB5C8',
  'Parque':      '#22C55E',
  'Museu':       '#7B5EA7',
  'Monumento':   '#F4821F',
  'Mercado':     '#E05A3A',
};

const CATEGORIES = ['Todos', 'Praias', 'Cultura & História', 'Natureza', 'Aventura', 'Gastronomia', 'Mergulho', 'Ecoturismo'];

export default function AllDiscoveries({
  onBack, onSelectDiscovery }: AllDiscoveriesProps) {
  useScrollTop();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [suggested, setSuggested] = useState<Record<string, boolean>>({});

  const fetchLocals = async (reset = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const currentPage = reset ? 1 : page;
      const { data, error: apiError } = await localsApi.list({
        page: currentPage,
        limit: 20,
        sortBy: 'recent',
      });

      if (apiError || !data) {
        setDiscoveries([]);
        setHasMore(false);
      } else {
        const items: any[] = data.locals || [];
        // Filtrar e validar apenas locais com dados reais e imagens
        const validLocals = filterValidPublications(items);
        const mapped = validLocals
          .map(item => mapValidLocal(item))
          .filter((item): item is Discovery => item !== null);
        
        if (reset) {
          setDiscoveries(mapped);
          setPage(2);
        } else {
          setDiscoveries(prev => [...prev, ...mapped]);
          setPage(p => p + 1);
        }
        setHasMore(data.pagination?.hasNext ?? items.length === 20);
      }
    } catch {
      setDiscoveries([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLocals(true); }, []);

  const handleFavorite = (e: React.MouseEvent, item: Discovery) => {
    e.stopPropagation();
    toggleFavorite({
      id: item.id,
      type: 'local',
      name: item.name,
      image: item.image,
      tag: item.tag,
      tagBg: item.tagBg,
      rating: item.rating,
      provincia: (item as any).provincia,
      distrito: (item as any).distrito,
      categoryKey: (item as any).categoryKey,
      raw: item,
    });
  };

  // Filtro: usa itemMatchesFilter para comparar category/subcategory da API
  const filtered = selectedCategory && selectedCategory !== 'Todos'
    ? discoveries.filter(d => itemMatchesFilter(d, selectedCategory))
    : discoveries;

  return (
    <motion.div
      className="min-h-screen pb-24"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#F3F4F6' }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black" style={{ color: '#1A1A1A' }}>Descobertas</h1>
            {/* Contador dinâmico */}
            {!isLoading && (
              <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                {filtered.length > 0
                  ? `${filtered.length} lugar${filtered.length !== 1 ? 'es' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`
                  : 'Nenhum lugar encontrado'}
              </p>
            )}
          </div>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#1B5E3B] rounded-full animate-spin ml-auto" />
          )}
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => {
            const tagMap: Record<string, string> = {
              'Todos':              'outro',
              'Praias':             'praias',
              'Cultura & História': 'cultura',
              'Natureza':           'natureza',
              'Aventura':           'aventura',
              'Gastronomia':        'gastro',
              'Mergulho':           'mergulho',
              'Ecoturismo':         'ecoturismo',
            };
            const tagId = tagMap[cat] || 'outro';
            const isActive = selectedCategory === cat || (cat === 'Todos' && !selectedCategory);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'Todos' ? null : cat)}
                className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2"
                style={{ background: isActive ? '#1B5E3B' : '#F3F4F6', color: isActive ? 'white' : '#6B7280' }}
              >
                <CategoryIcon id={tagId} size={16} color={isActive ? 'white' : (CATEGORY_COLORS[tagId] || '#6B7280')} strokeWidth={1.6} />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading && discoveries.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-4 pt-4">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectDiscovery(item)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer"
              >
                {/* Image */}
                <div className="relative" style={{ height: 200 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <Star size={12} fill={item.rating > 0 ? '#FBBF24' : 'none'} stroke={item.rating > 0 ? 'none' : '#9CA3AF'} />
                    <span className="text-white text-xs font-bold">
                      {item.rating > 0 ? item.rating.toFixed(1) : 'Novo'}
                    </span>
                    {item.rating > 0 && <span className="text-white/80 text-[10px]">({item.reviews})</span>}
                  </div>
                  {item.badge && (
                    <span className="absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: item.badgeBg }}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-2.5">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h3 className="text-sm font-black mb-0.5 leading-tight" style={{ color: '#1A1A1A' }}>{item.name}</h3>
                      <p className="text-[10px] leading-snug line-clamp-2" style={{ color: '#6B7280' }}>{item.desc}</p>
                    </div>
                    <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                      {item.tag}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { handleFavorite(e, item); }}
                        style={{ color: isFavorite(item.id) ? '#0EA5E9' : '#9CA3AF' }}
                      >
                        <Heart size={13} fill={isFavorite(item.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="flex items-center gap-0.5 transition-colors"
                        style={{ color: suggested[item.id] ? '#1B5E3B' : '#9CA3AF' }}
                        onClick={async e => {
                          e.stopPropagation();
                          const title = item.name;
                          const text  = `${item.name} — ${item.desc || item.tag || ''}\nDescobre mais em Txopela Tour!`;
                          const url   = window.location.origin;
                          try {
                            if (navigator.share) {
                              await navigator.share({ title, text, url });
                            } else {
                              await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                            }
                            setSuggested((p: Record<string, boolean>) => ({ ...p, [item.id]: true }));
                            setTimeout(() => setSuggested((p: Record<string, boolean>) => ({ ...p, [item.id]: false })), 2000);
                          } catch { /* utilizador cancelou */ }
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke={suggested[item.id] ? '#1B5E3B' : 'currentColor'} strokeWidth="2">
                          <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                        </svg>
                        <span className="text-[9px] font-semibold">
                          {suggested[item.id] ? 'Sugerido!' : 'Sugerir'}
                        </span>
                      </button>
                    </div>
                    <button className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-white"
                      style={{ background: '#1B5E3B' }}>
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {hasMore && !isLoading && !selectedCategory && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => fetchLocals(false)}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white"
                style={{ background: '#1B5E3B' }}
              >
                Carregar mais
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
