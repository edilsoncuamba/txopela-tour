import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Heart } from 'lucide-react';
import { CategoryIcon, CATEGORY_COLORS } from '@/components/icons';
import { servicesApi } from '@/services/api';
import { mapValidService, filterValidPublications, PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { SERVICE_CATEGORY_COLOR } from '@/utils/translations';
import { useFavorites } from '@/context/FavoritesContext';
import { useScrollTop } from '@/hooks/useScrollTop';

interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  provincia: string;
  distrito: string;
  endereco: string;
  telefone: string;
  whatsapp: string;
  email: string;
  horario: string;
  lat?: number;
  lng?: number;
  contributor?: { 
    id?: string;
    name: string; 
    avatar?: string;
    type: 'guide' | 'traveler' | 'resident' | 'business' 
  };
}

interface AllServicesProps {
  onBack: () => void;
  onSelectService: (service: Service) => void;
}

const CATEGORIES = ['Todos', 'Transporte', 'Guia', 'Hospedagem', 'Experi�ncia', 'Equipamento'];
const PROVINCES_LIST = ['Todas', 'Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zamb�zia', 'Nampula', 'Cabo Delgado', 'Niassa'];

export default function AllServices({
  onBack, onSelectService }: AllServicesProps) {
  useScrollTop();
  const [services, setServices]       = useState<Service[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvincia, setSelectedProvincia] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [suggested, setSuggested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: apiError } = await servicesApi.list({ limit: 50, sortBy: 'recent' });
        if (apiError || !data) {
          setServices([]);
        } else {
          const items: any[] = data.services || [];
          // Filtrar e validar apenas servi�os com dados reais e imagens
          const validServices = filterValidPublications(items);
          const mappedServices = validServices
            .map(item => mapValidService(item))
            .filter((item): item is Service => item !== null);
          setServices(mappedServices);
        }
      } catch {
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const toggleLike = (id: string, svc: Service) => {
    toggleFavorite({
      id,
      type: 'service',
      name: svc.name,
      image: svc.image,
      tag: svc.category,
      rating: svc.rating,
      provincia: svc.provincia,
      distrito: svc.distrito,
      categoryKey: (svc as any).categoryKey,
      raw: svc,
    });
  };

  const filtered = services.filter(s => {
    const matchCat = !selectedCategory || selectedCategory === 'Todos' || s.category === selectedCategory;
    const matchProv = !selectedProvincia || selectedProvincia === 'Todas' || s.provincia === selectedProvincia;
    return matchCat && matchProv;
  });

  const serviceBadgeColors: Record<string, string> = {
    'Hospedagem':      SERVICE_CATEGORY_COLOR.accommodation,
    'Guia Tur�stico':  SERVICE_CATEGORY_COLOR.guide,
    'Transporte':      SERVICE_CATEGORY_COLOR.transport,
    'Experi�ncia':     SERVICE_CATEGORY_COLOR.experience,
    'Equipamento':     SERVICE_CATEGORY_COLOR.equipment,
  };

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
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#F3F4F6' }}>
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-xl font-black" style={{ color: '#1A1A1A' }}>Servi�os</h1>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#2BB5C8] rounded-full animate-spin ml-auto" />
          )}
        </div>

        {/* Category filters */}
        <div className="mb-3">
          <p className="text-xs font-bold mb-2" style={{ color: '#6B7280' }}>Categoria</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => {
              const tagMap: Record<string, string> = {
                'Transporte': 'transporte', 'Guia': 'guia', 'Hospedagem': 'hospedagem',
                'Experi�ncia': 'experiencia', 'Equipamento': 'equipamento',
              };
              const tagId = tagMap[cat] || 'servico';
              const isActive = selectedCategory === cat || (cat === 'Todos' && !selectedCategory);
              return (
                <button key={cat}
                  onClick={() => setSelectedCategory(cat === 'Todos' ? null : cat)}
                  className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2"
                  style={{ background: isActive ? '#1B5E3B' : '#F3F4F6', color: isActive ? 'white' : '#6B7280' }}>
                  <CategoryIcon id={tagId} size={16} color={isActive ? 'white' : (CATEGORY_COLORS[tagId] || '#6B7280')} strokeWidth={1.6} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Province filters */}
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: '#6B7280' }}>Prov�ncia</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {PROVINCES_LIST.map(prov => (
              <button key={prov}
                onClick={() => setSelectedProvincia(prov === 'Todas' ? null : prov)}
                className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                style={{
                  background: (selectedProvincia === prov || (prov === 'Todas' && !selectedProvincia)) ? '#2BB5C8' : '#F3F4F6',
                  color: (selectedProvincia === prov || (prov === 'Todas' && !selectedProvincia)) ? 'white' : '#6B7280',
                }}>
                {prov}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
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
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {filtered.map((svc) => {
            const badgeBg = serviceBadgeColors[svc.category] || '#1B5E3B';
            return (
              <motion.div key={svc.id} whileTap={{ scale: 0.98 }}
                onClick={() => onSelectService(svc)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer">
                <div className="relative" style={{ height: 200 }}>
                  <img src={svc.image} alt={svc.name} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <Star size={12} fill={svc.rating > 0 ? '#FBBF24' : 'none'} stroke={svc.rating > 0 ? 'none' : '#9CA3AF'} />
                    <span className="text-white text-xs font-bold">
                      {svc.rating > 0 ? svc.rating.toFixed(1) : 'Novo'}
                    </span>
                    {svc.rating > 0 && <span className="text-white/80 text-[10px]">({svc.reviews})</span>}
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h3 className="text-sm font-black mb-0.5 leading-tight" style={{ color: '#1A1A1A' }}>{svc.name}</h3>
                      <p className="text-[10px] leading-snug" style={{ color: '#6B7280' }}>
                        {[svc.provincia, svc.distrito].filter(Boolean).join(' � ') || 'Mo�ambique'}
                      </p>
                    </div>
                    <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: badgeBg + '20', color: badgeBg }}>
                      {svc.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); toggleLike(svc.id, svc); }}
                        style={{ color: isFavorite(svc.id) ? '#0EA5E9' : '#9CA3AF' }}>
                        <Heart size={13} fill={isFavorite(svc.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="flex items-center gap-0.5 transition-colors"
                        style={{ color: suggested[svc.id] ? '#1B5E3B' : '#9CA3AF' }}
                        onClick={async e => {
                          e.stopPropagation();
                          const title = svc.name;
                          const text  = `${svc.name} � ${svc.category || ''} em ${svc.provincia || 'Mo�ambique'}\nDescobre mais em Txopela Tour!`;
                          const url   = window.location.origin;
                          try {
                            if (navigator.share) {
                              await navigator.share({ title, text, url });
                            } else {
                              await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                            }
                            setSuggested((p: Record<string, boolean>) => ({ ...p, [svc.id]: true }));
                            setTimeout(() => setSuggested((p: Record<string, boolean>) => ({ ...p, [svc.id]: false })), 2000);
                          } catch { /* utilizador cancelou */ }
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke={suggested[svc.id] ? '#1B5E3B' : 'currentColor'} strokeWidth="2">
                          <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                        </svg>
                        <span className="text-[9px] font-semibold">
                          {suggested[svc.id] ? 'Sugerido!' : 'Sugerir'}
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
            );
          })}

          {filtered.length === 0 && !isLoading && (
            <div className="col-span-2 flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>Nenhum servi�o encontrado</p>
              <button onClick={() => { setSelectedCategory(null); setSelectedProvincia(null); }}
                className="text-xs font-bold" style={{ color: '#1B5E3B' }}>
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
