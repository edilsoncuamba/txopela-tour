import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE, extractImages, mapValidService } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Filter, MapPin, Heart } from 'lucide-react';
import ServiceDetail from './ServiceDetail';
import { servicesApi } from '@/services/api';
import { useFavorites } from '@/context/FavoritesContext';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';

interface Service {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  distance: string;
  image: string;
  amenities: string[];
  description: string;
  // Localização — hierarquia completa
  provincia: string;
  distrito: string;
  administrative_post?: string;
  locality?: string;
  nearby_reference?: string;
  endereco: string;
  location?: {
    country?: string;
    province?: string;
    district?: string;
    administrative_post?: string;
    locality?: string;
    nearby_reference?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  telefone: string;
  whatsapp: string;
  email: string;
  horario: string;
  lat?: number;
  lng?: number;
  contributor?: {
    id?: string;
    name: string;
    type: 'guide' | 'traveler' | 'resident' | 'business';
  };
}

interface ServicesListingProps {
  onBack: () => void;
  onSelectService?: (service: any) => void;
  initialProvince?: string;
  initialDistrict?: string;
}



const SERVICE_CATEGORIES = [
  {
    id: 'Todas as categorias',
    label: 'Todas',
    color: '#1B5E3B',
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#1B5E3B' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'Hospedagem',
    label: 'Hospedagem',
    color: '#2563EB',
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#2563EB' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'Guia Turístico',
    label: 'Guia Turístico',
    color: '#F4821F',
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#F4821F' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    id: 'Experiência',
    label: 'Experiência',
    color: '#E05A3A',
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#E05A3A' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    id: 'Transporte',
    label: 'Transporte',
    color: '#1B5E3B',
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#1B5E3B' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'Outro',
    label: 'Outro',
    color: '#7B5EA7',
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7B5EA7' : '#6B7280'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

const normalizeCategory = (cat: string): string => {
  const map: Record<string, string> = {
    'guia': 'Guia Turístico',
    'guia turístico': 'Guia Turístico',
    'guia turistico': 'Guia Turístico',
    'guide': 'Guia Turístico',
    'hospedagem': 'Hospedagem',
    'accommodation': 'Hospedagem',
    'transporte': 'Transporte',
    'transport': 'Transporte',
    'experiência': 'Experiência',
    'experiencia': 'Experiência',
    'experience': 'Experiência',
    'restaurante': 'Experiência',
    'restaurant': 'Experiência',
    'guias locais': 'Guia Turístico',
    'agência de turismo': 'Guia Turístico',
    'agencia de turismo': 'Guia Turístico',
    'equipamento': 'Outro',
    'equipment': 'Outro',
  };
  return map[cat?.toLowerCase()] || cat;
};

export default function ServicesListing({ onBack, onSelectService }: ServicesListingProps) {
  useScrollTop();
  const { isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#6B7A99' : '#9CA3AF',
    back:    isDark ? '#22263A' : '#F3F4F6',
    skel:    isDark ? '#22263A' : '#E5E7EB',
  };
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Todas as categorias');
  const [showFilters, setShowFilters] = useState(false);
  const [suggested, setSuggested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await servicesApi.list({ limit: 100, sortBy: 'recent' });
        const items: any[] = Array.isArray(data) ? data : (data?.services ?? data?.results ?? []);
        setAllServices(
          items
            .map((s: any) => mapValidService(s))
            .filter((s): s is Service => s !== null),
        );
      } catch {
        setAllServices([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredServices = allServices.filter(service => {
    const categoryMatch = selectedCategory === 'Todas as categorias' || normalizeCategory(service.category) === selectedCategory;
    return categoryMatch;
  });

  if (selectedService) {
    return (
      <ServiceDetail 
        service={selectedService} 
        onBack={() => setSelectedService(null)} 
      />
    );
  }

  return (
    <motion.div className="pb-16"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>

      {/* Header */}
      <div className="px-4 py-4 shadow-sm"
        style={{ background: dm.surface, borderBottom: `1px solid ${dm.border}` }}>
        <div className="flex items-center justify-between px-0 py-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: dm.back }}>
              <ChevronLeft size={20} style={{ color: dm.text }} strokeWidth={2.5} />
            </button>
            <h1 className="text-lg font-black text-left" style={{ color: dm.text }}>Serviços locais</h1>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#F8FAFC' }}>
            <Filter size={18} style={{ color: showFilters || selectedCategory !== 'Todas as categorias' ? '#1B5E3B' : '#64748B' }} strokeWidth={2} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t px-4 py-3"
              style={{ borderColor: '#F3F4F6' }}
            >
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {SERVICE_CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
                      style={{
                        background: isActive ? cat.color + '18' : '#F3F4F6',
                        color: isActive ? cat.color : '#6B7280',
                        border: isActive ? `1.5px solid ${cat.color}60` : '1.5px solid transparent',
                      }}
                    >
                      {cat.icon(isActive)}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Services Grid - 2 columns */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-3xl overflow-hidden shadow-sm animate-pulse"
              style={{ background: dm.surface }}>
              <div style={{ height: 200, background: dm.skel }} />
              <div className="p-2.5 space-y-2">
                <div className="h-3 rounded w-3/4" style={{ background: dm.skel }} />
                <div className="h-3 rounded w-1/2" style={{ background: dm.skel }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#EEF7F0' }}>
              <MapPin size={24} style={{ color: '#1B5E3B' }} />
            </div>
            <p className="text-sm font-black mb-1" style={{ color: '#1A1A1A' }}>
              Nenhum servi�o encontrado
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              Tente ajustar os filtros de pesquisa
            </p>
          </div>
        ) : (
          filteredServices.map(service => {
            const serviceBadgeColors: Record<string, string> = {
              'Hospedagem':     '#2563EB',
              'Guia Turístico': '#F4821F',
              'Experiência':    '#E05A3A',
              'Transporte':     '#1B5E3B',
              'Outro':          '#7B5EA7',
            };
            const badgeBg = serviceBadgeColors[normalizeCategory(service.category)] || '#1B5E3B';

            return (
              <motion.div
                key={service.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectService ? onSelectService(service) : setSelectedService(service)}
                className="rounded-3xl overflow-hidden shadow-sm cursor-pointer"
                style={{ background: dm.surface }}
              >
                {/* Image */}
                <div className="relative" style={{ height: 200 }}>
                  <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
                  
                  {/* Rating badge - bottom left */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <Star size={12} fill="#FBBF24" stroke="none" />
                    <span className="text-white text-xs font-bold">{service.rating}</span>
                    <span className="text-white/80 text-[10px]">({service.reviewsCount})</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-2.5 text-left">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-black leading-tight flex-1" style={{ color: dm.text }}>{service.name}</h3>
                    <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: badgeBg + '18', color: badgeBg }}>
                      {normalizeCategory(service.category)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite({
                            id:    service.id,
                            type:  'service',
                            name:  service.name,
                            image: service.image ?? PLACEHOLDER_IMAGE,
                            tag:   normalizeCategory(service.category),
                            rating:    service.rating,
                            provincia: service.provincia,
                            distrito:  service.distrito,
                            categoryKey: service.category,
                            raw: service,
                          });
                        }}
                        className="flex items-center text-sm"
                        title={isFavorite(service.id) ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
                      >
                        <Heart
                          size={13}
                          fill={isFavorite(service.id) ? '#0077B6' : 'none'}
                          color={isFavorite(service.id) ? '#0077B6' : '#9CA3AF'}
                        />
                      </button>
                      <button className="flex items-center gap-0.5 text-sm transition-colors"
                        style={{ color: suggested[service.id] ? '#1B5E3B' : '#9CA3AF' }}
                        onClick={async e => {
                          e.stopPropagation();
                          const title = service.name;
                          const text  = `${service.name} � ${service.category || ''} em ${service.provincia || 'Mo�ambique'}\nDescobre mais em Txopela Tour!`;
                          const url   = window.location.origin;
                          try {
                            if (navigator.share) {
                              await navigator.share({ title, text, url });
                            } else {
                              await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                            }
                            setSuggested(p => ({ ...p, [service.id]: true }));
                            setTimeout(() => setSuggested(p => ({ ...p, [service.id]: false })), 2000);
                          } catch { /* utilizador cancelou */ }
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke={suggested[service.id] ? '#1B5E3B' : 'currentColor'} strokeWidth="2">
                          <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                        </svg>
                        <span className="text-[9px] font-semibold">
                          {suggested[service.id] ? 'Sugerido!' : 'Sugerir'}
                        </span>
                      </button>
                    </div>
                    {/* Localização — entre Sugerir e Ver detalhes */}
                    {(service.distrito || service.provincia) && (
                      <div className="flex items-center gap-1 flex-1 justify-center px-1">
                        <MapPin size={9} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                        <span className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>
                          {[service.distrito, service.provincia].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    )}
                    <button className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-white"
                      style={{ background: '#1B5E3B' }}>
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      )}
    </motion.div>
  );
}

