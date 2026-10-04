import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import {
  IconSearch, IconMapPin, IconChevronRight, IconStar, IconHeart,
  IconBell, IconChat, IconMap, IconMenu, IconUsers, IconPlus,
  CategoryIcon, CATEGORY_COLORS, CATEGORY_LABELS,
  STROKE,
} from '@/components/icons';
import DestinationDetail from '@/pages/DestinationDetail';
import ProvinciaFeed from '@/pages/ProvinciaFeed';
import ServiceDetail, { type ServiceData } from '@/pages/ServiceDetail';
import AllPosts from '@/pages/AllPosts';
import AllDiscoveries from '@/pages/AllDiscoveries';
import AllServices from '@/pages/AllServices';
import { useAuth } from '@/context/AuthContext';
import { postsApi, localsApi, servicesApi } from '@/services/api';
import type { Local } from '@/types';
import { mapValidLocal, mapValidService, mapValidPost, filterValidPublications } from '@/utils/dataValidation';
import { SERVICE_CATEGORY_COLOR, translateServiceCategory, itemMatchesFilter } from '@/utils/translations';
import { useFavorites } from '@/context/FavoritesContext';
import { useScrollTop } from '@/hooks/useScrollTop';

interface HomeProps {
  onLocalPress: (local: Local) => void;
  onNotifications: () => void;
  onChat: (query?: string) => void;
  onMyProfile: () => void;
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
  onEditPost?: (postId: string) => void;
  onCulture?: () => void;
  refreshKey?: number;
  sidebarCollapsed?: boolean;
}

const categories = Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
  id, label: label.replace(' & ', ' &\n'), bg: CATEGORY_COLORS[id],
}));

// ── Cache de módulo — persiste entre re-renders e navegações na mesma sessão ──
// Assim o conteúdo aparece instantaneamente ao voltar ao Início ou após login.
const _cache: {
  discoveries: any[];
  services: any[];
  posts: any[];
} = {
  discoveries: [],
  services: [],
  posts: [],
};

export default function Home({
  onLocalPress, onNotifications, onChat, onMyProfile, onAuthorPress, onEditPost, onCulture, refreshKey, sidebarCollapsed }: HomeProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Número de cards visíveis depende do estado da sidebar (desktop)
  const discoveriesLimit = sidebarCollapsed ? 5 : 4;
  const servicesLimit    = sidebarCollapsed ? 6 : 5;
  const [suggested, setSuggested] = useState<Record<string, boolean>>({});
  const [selectedProvincia, setSelectedProvincia] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [selectedProvinciaFeed, setSelectedProvinciaFeed] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllDiscoveries, setShowAllDiscoveries] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  
  // Estados da API — inicializados com cache para evitar flash de loading
  const [apiPosts, setApiPosts] = useState<any[]>(_cache.posts);
  const [apiDiscoveries, setApiDiscoveries] = useState<any[]>(_cache.discoveries);
  const [apiServices, setApiServices] = useState<any[]>(_cache.services);
  const [isLoadingPosts, setIsLoadingPosts] = useState(_cache.posts.length === 0);
  const [isLoadingDiscoveries, setIsLoadingDiscoveries] = useState(_cache.discoveries.length === 0);
  const [isLoadingServices, setIsLoadingServices] = useState(_cache.services.length === 0);

  // ── "Explorar perto de ti" — usa GET /api/locals/nearby/ com GPS do utilizador
  const [nearbyLocals, setNearbyLocals]         = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby]   = useState(false);
  const [nearbyError, setNearbyError]           = useState<string | null>(null);
  const [userPosition, setUserPosition]         = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRequested, setNearbyRequested]   = useState(false);

  const fetchNearby = () => {
    if (!navigator.geolocation) {
      setNearbyError('O teu dispositivo não suporta geolocalização.');
      return;
    }
    setIsLoadingNearby(true);
    setNearbyError(null);
    setNearbyRequested(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition({ lat: latitude, lng: longitude });
        try {
          const { data, error } = await localsApi.nearby({ latitude, longitude, radius: 50, limit: 10 });
          if (error || !data) { setNearbyLocals([]); setNearbyError(null); }
          else {
            const items: any[] = data.results ?? data.locals ?? (Array.isArray(data) ? data : []);
            const mapped = items.map(mapValidLocal).filter(Boolean);
            setNearbyLocals(mapped);
          }
        } catch { setNearbyLocals([]); }
        finally { setIsLoadingNearby(false); }
      },
      () => {
        setIsLoadingNearby(false);
        setNearbyError('Não foi possível obter a tua localização.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  // Carregar posts da API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const { data } = await postsApi.list({ page: 1, limit: 10, sortBy: 'recent' });
        if (data) {
          const posts = data.posts ?? data.results ?? (Array.isArray(data) ? data : []);
          // Filtrar e validar apenas posts com dados reais e imagens
          const validPosts = filterValidPublications(posts);
          _cache.posts = validPosts.slice(0, 10);
          setApiPosts(_cache.posts);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    fetchPosts();
  }, [refreshKey]);

  // Carregar locais da API — GET /api/locals/ (backend filtra approved hardcoded)
  useEffect(() => {
    let isMounted = true;
    
    const fetchDiscoveries = async (retryCount = 0) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 3000; // 3 segundos
      
      if (!isMounted) return;
      
      try {
        if (retryCount === 0) {
          setIsLoadingDiscoveries(true);
        }
        
        console.log(`[HOME] Tentativa ${retryCount + 1}/${MAX_RETRIES + 1} de carregar descobertas da API...`);
        const { data, error } = await localsApi.list({ page: 1, limit: 20, sortBy: 'recent' });
        console.log('[HOME] Resposta da API locais:', { data, error, tentativa: retryCount + 1 });
        
        // Se houver erro 503 e ainda temos tentativas, aguardar e tentar novamente
        if (error && (error.includes('503') || error.includes('Erro interno do servidor')) && retryCount < MAX_RETRIES) {
          console.log(`[HOME] ⚠️ Erro 503 detectado. Aguardando ${RETRY_DELAY}ms antes da tentativa ${retryCount + 2}...`);
          if (isMounted) {
            setTimeout(() => {
              if (isMounted) {
                fetchDiscoveries(retryCount + 1);
              }
            }, RETRY_DELAY);
          }
          return;
        }
        
        if (error) {
          console.error('[HOME] ❌ Erro final ao carregar locais após', retryCount + 1, 'tentativas:', error);
          if (isMounted) {
            setApiDiscoveries([]);
            setIsLoadingDiscoveries(false);
          }
          return;
        }
        
        if (data) {
          // Backend filtra status='approved' hardcoded — feed só mostra aprovados
          const places: any[] = data.locals ?? data.results ?? (Array.isArray(data) ? data : []);
          console.log('[HOME] ✅ Locais recebidos da API:', places.length, 'locais');
          
          // Filtrar e validar apenas locais com dados reais e imagens
          const validPlaces = filterValidPublications(places);
          console.log('[HOME] ✅ Locais válidos após validação:', validPlaces.length);
          
          if (isMounted) {
            _cache.discoveries = validPlaces;
            setApiDiscoveries(validPlaces); // guardar todos — slice feito em render
            setIsLoadingDiscoveries(false);
          }
        } else {
          console.warn('[HOME] ⚠️ Nenhum dado recebido da API de locais');
          if (isMounted) {
            setApiDiscoveries([]);
            setIsLoadingDiscoveries(false);
          }
        }
      } catch (err) {
        console.error('[HOME] 💥 Exceção ao carregar descobertas:', err);
        // Tentar novamente se ainda temos tentativas
        if (retryCount < MAX_RETRIES && isMounted) {
          console.log(`[HOME] 🔄 Tentando novamente após exceção (tentativa ${retryCount + 2}/${MAX_RETRIES + 1})...`);
          setTimeout(() => {
            if (isMounted) {
              fetchDiscoveries(retryCount + 1);
            }
          }, RETRY_DELAY);
        } else if (isMounted) {
          setApiDiscoveries([]);
          setIsLoadingDiscoveries(false);
        }
      }
    };
    
    fetchDiscoveries();
    
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Carregar serviços da API
  useEffect(() => {
    const fetchServices = async (retryCount = 0) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 2000;
      
      try {
        if (retryCount === 0) setIsLoadingServices(true);
        console.log(`[HOME] Tentativa ${retryCount + 1} de carregar serviços da API...`);
        const { data, error } = await servicesApi.list({ page: 1, limit: 20, sortBy: 'recent' });
        
        // Se houver erro 503 e ainda temos tentativas, aguardar e tentar novamente
        if (error && error.includes('503') && retryCount < MAX_RETRIES) {
          console.log(`[HOME] Erro 503 em serviços. Aguardando ${RETRY_DELAY}ms antes de tentar novamente...`);
          setTimeout(() => fetchServices(retryCount + 1), RETRY_DELAY);
          return;
        }
        
        if (data) {
          // Backend filtra status='approved' hardcoded — feed só mostra aprovados
          const services: any[] = data.services ?? data.results ?? (Array.isArray(data) ? data : []);
          // Filtrar e validar apenas serviços com dados reais e imagens
          const validServices = filterValidPublications(services);
          _cache.services = validServices;
          setApiServices(validServices); // guardar todos — slice feito em render
        } else {
          setApiServices([]);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => fetchServices(retryCount + 1), RETRY_DELAY);
          return;
        } else {
          setApiServices([]);
        }
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, [refreshKey]);

  // Transform API data — mapeamento completo com validação rigorosa
  const discoveries = apiDiscoveries
    .map(item => {
      const mapped = mapValidLocal(item);
      if (!mapped) {
        console.warn('[HOME] Local inválido após mapeamento:', item);
      }
      return mapped;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  console.log('[HOME] Descobertas após mapeamento:', discoveries.length, discoveries);

  const services = apiServices
    .map(item => mapValidService(item))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Transform posts from API - COM VALIDAÇÃO RIGOROSA
  const posts = apiPosts
    .map(item => mapValidPost(item))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Filtra descobertas pela categoria activa E pela pesquisa em tempo real
  const filteredDiscoveries = discoveries.filter(d => {
    const matchesCategory = !activeCategory ||
      d.tag.toLowerCase().includes(activeCategory.toLowerCase()) ||
      d.categoryKey?.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.provincia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.distrito?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  console.log('[HOME] Descobertas filtradas por categoria:', {
    activeCategory,
    total: discoveries.length,
    filtered: filteredDiscoveries.length,
    categories: discoveries.map(d => d.tag)
  });
  
  // Mostra discoveriesLimit por defeito, todas se showAllDiscoveries
  const visibleDiscoveries = showAllDiscoveries ? filteredDiscoveries : filteredDiscoveries.slice(0, discoveriesLimit);

  const handleFavoriteLocal = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    toggleFavorite({
      id: item.id, type: 'local', name: item.name, image: item.image,
      tag: item.tag, tagBg: item.tagBg, rating: item.rating,
      provincia: item.provincia, distrito: item.distrito,
      categoryKey: item.categoryKey, raw: item,
    });
  };

  const handleFavoriteService = (e: React.MouseEvent, svc: any) => {
    e.stopPropagation();
    toggleFavorite({
      id: svc.id, type: 'service', name: svc.name, image: svc.image,
      tag: svc.category, rating: svc.rating,
      provincia: svc.provincia, distrito: svc.distrito,
      categoryKey: svc.categoryKey, raw: svc,
    });
  };

  // Serviços filtrados pela província seleccionada ou da publicação activa
  const filteredServices = selectedProvincia
    ? services.filter(s => s.provincia === selectedProvincia)
    : services.slice(0, servicesLimit);

  const serviceSectionTitle = selectedProvincia
    ? `Serviços em ${selectedProvincia}`
    : 'Serviços locais em destaque';

  // Show service detail - data already correctly mapped
  if (selectedService) {
    return <ServiceDetail service={selectedService} onBack={() => setSelectedService(null)} />;
  }

  // Show all discoveries
  if (showAllDiscoveries) {
    return (
      <AllDiscoveries
        onBack={() => setShowAllDiscoveries(false)}
        onSelectDiscovery={(discovery) => {
          setShowAllDiscoveries(false);
          setSelectedDestination(discovery);
        }}
      />
    );
  }

  // Show all services
  if (showAllServices) {
    return (
      <AllServices
        onBack={() => setShowAllServices(false)}
        onSelectService={(service) => {
          setShowAllServices(false);
          setSelectedService({
            id: service.id,
            name: service.name,
            category: service.category,
            description: service.description ?? '',
            provincia: service.provincia,
            distrito: service.distrito,
            endereco: service.endereco,
            image: service.image,
            images: service.images,
            rating: service.rating,
            reviewsCount: service.reviews,
            telefone: service.telefone,
            whatsapp: service.whatsapp,
            email: service.email,
            horario: service.horario,
            lat: service.lat,
            lng: service.lng,
            contributor: service.contributor,
          });
        }}
      />
    );
  }

  // Show all posts
  if (showAllPosts) {
    return <AllPosts onBack={() => setShowAllPosts(false)} onAuthorPress={onAuthorPress} onEditPost={onEditPost} />;
  }

  // Show provincia feed
  if (selectedProvinciaFeed) {
    return (
      <ProvinciaFeed
        provincia={selectedProvinciaFeed}
        onBack={() => setSelectedProvinciaFeed(null)}
      />
    );
  }

  // Show destination detail
  if (selectedDestination) {
    return (
      <AnimatePresence>
        <DestinationDetail
          destination={{
            // Passa TODOS os dados reais da API — sem sobrescrever com valores estáticos
            ...selectedDestination,
            // Garante campos obrigatórios do componente com fallbacks mínimos
            category:    selectedDestination.tag        || selectedDestination.category || '',
            provincia:   selectedDestination.provincia  || '',
            melhorEpoca: selectedDestination.melhorEpoca || '',
            tipo:        selectedDestination.tipo        || selectedDestination.tag || '',
            destaques:   selectedDestination.destaques  || [],
          }}
          onBack={() => setSelectedDestination(null)}
          onExploreMore={() => setSelectedDestination(null)}
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: isDark ? '#0F1117' : '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Hero image — compacta */}
        <div className="relative overflow-hidden" style={{ height: 66 }}>
          <img
            src="/images/splash-bg.jpg"
            alt="Inhambane"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,80,160,0.65) 0%, rgba(0,80,160,0.25) 60%, rgba(0,0,0,0.05) 100%)' }} />

          {/* Título à esquerda */}
          <div className="absolute inset-0 flex items-center px-5">
            <h1
              className="text-xl text-white leading-none"
              style={{ fontFamily: 'Pacifico, cursive', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              Txopela Tour
            </h1>
          </div>
        </div>

        {/* Search bar — overlapping hero bottom */}
        <div className="absolute left-4 right-4" style={{ bottom: -45 }}>
          <form onSubmit={e => { e.preventDefault(); if (searchQuery.trim()) { onChat(searchQuery); setSearchQuery(''); } }}
            className="flex items-center rounded-2xl shadow-lg px-4 py-3 gap-2"
            style={{ background: isDark ? '#1A1D27' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
            <IconSearch size={17} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Que tipo de experiência procuras hoje?"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-sm text-gray-500 placeholder:text-gray-400 bg-transparent focus:outline-none"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
            {searchQuery.trim() ? (
              <motion.button
                type="submit"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#7B5EA7' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={() => onChat()}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-full"
                style={{ background: 'rgba(123,94,167,0.10)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B5EA7" strokeWidth="2">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                <span className="text-xs font-bold text-[#7B5EA7]">IA</span>
              </motion.button>
            )}
          </form>
        </div>
      </div>

      {/* Spacer for search overlap */}
      <div style={{ height: 41 }} />


      {/* ── DESCOBERTAS ───────────────────────────────────────────────────── */}
      <div className="pt-5 pb-2" style={{ background: isDark ? '#0F1117' : '#F5F5F0' }}>
        {/* Section header */}
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-1.5">
            {/* Sparkle */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4821F" strokeWidth="2">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            <div>
              <span className="text-base font-extrabold" style={{ color: isDark ? '#F0F4FF' : '#111827' }}>Descobertas para ti hoje</span>
            </div>
          </div>
          <button className="flex items-center gap-0.5 text-sm font-semibold"
            style={{ color: isDark ? '#6B7A99' : '#6B7280' }}
            onClick={() => setShowAllDiscoveries(true)}>
            Ver mais <IconChevronRight size={16} />
          </button>
        </div>

        {/* Cards scroll */}
        {isLoadingDiscoveries ? (
          /* Loader centralizado — identidade Txopela Tour */
          <div className="flex items-center justify-center w-full py-12">
            <div className="flex flex-col items-center gap-4">
              {/* Cinco dots com pulse escalonado */}
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i === 2 ? '#2BB5C8' : '#2BB5C899',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="discoveries-scroll flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
              {filteredDiscoveries.slice(0, discoveriesLimit).map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedDestination(item)}
                className="flex-shrink-0 rounded-2xl overflow-hidden relative cursor-pointer"
                style={{ width: 200, height: 270 }}
              >
                <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                {/* Dark gradient bottom */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.30) 55%, transparent 100%)' }} />

                {/* Badge + Heart */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                  <span
                    className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: item.badgeBg }}
                  >
                    {item.badge}
                  </span>
                  <button
                    onClick={(e) => handleFavoriteLocal(e, item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
                  >
                    <IconHeart
                      size={15}
                      className={isFavorite(item.id) ? 'text-[#0077B6]' : 'text-white'}
                      fill={isFavorite(item.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                  <h3 className="text-white font-extrabold text-sm leading-tight mb-1.5">{item.name}</h3>
                  <p className="text-white/80 text-[11px] leading-snug mb-2">
                    {item.desc ? item.desc.split(' ').slice(0, 4).join(' ') + (item.desc.split(' ').length > 4 ? '...' : '') : ''}
                  </p>
                  {/* Rating à esquerda, categoria à direita */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <IconStar size={11} fill={item.rating > 0 ? '#FBBF24' : 'none'} stroke={item.rating > 0 ? 'none' : '#9CA3AF'} />
                      <span className="text-white text-xs font-bold">
                        {item.rating > 0 ? (typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating) : 'Novo'}
                      </span>
                      {item.rating > 0 && <span className="text-white/60 text-[10px]">({item.reviews})</span>}
                    </div>
                    <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: (() => {
                        const cats = ['Praias','Cultura & História','Natureza','Aventura','Gastronomia','Mergulho','Ecoturismo'];
                        const colors: Record<string,string> = { 'Praias':'#2BB5C8','Cultura & História':'#7B5EA7','Natureza':'#22C55E','Aventura':'#F4821F','Gastronomia':'#E05A3A','Mergulho':'#0EA5E9','Ecoturismo':'#1B5E3B' };
                        const match = cats.find(c => itemMatchesFilter(item, c));
                        return match ? colors[match] : '#6B7280';
                      })() }}>
                      {(() => {
                        const cats = ['Praias','Cultura & História','Natureza','Aventura','Gastronomia','Mergulho','Ecoturismo'];
                        return cats.find(c => itemMatchesFilter(item, c)) || 'Outro';
                      })()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
            {filteredDiscoveries.slice(0, discoveriesLimit).length === 0 && (
              <div className="mx-4 py-8 rounded-2xl flex flex-col items-center gap-2"
                style={{ background: isDark ? '#1A1D27' : '#F3F4F6' }}>
                <CategoryIcon id={activeCategory || 'outro'} size={32} color="#D1D5DB" />
                <p className="text-sm font-bold text-center px-4" style={{ color: '#9CA3AF' }}>
                  {searchQuery.trim()
                    ? `Nenhum resultado para "${searchQuery}"`
                    : activeCategory
                      ? 'Sem descobertas nesta categoria'
                      : 'Nenhum lugar encontrado'}
                </p>
                {(activeCategory || searchQuery.trim()) && (
                  <button onClick={() => { setActiveCategory(null); setSearchQuery(''); }}
                    className="text-xs font-bold" style={{ color: '#1B5E3B' }}>
                    Ver todos
                  </button>
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* ── EXPLORAR POR PROVÍNCIA + BANNER CULTURA ── fundo contínuo ── */}
      <div style={{ background: isDark ? '#1A1D27' : '#ffffff' }}>

      {/* ── EXPLORAR POR PROVÍNCIA ────────────────────────────────────────── */}
      <div className="py-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <IconMapPin size={18} style={{ color: '#1B5E3B' }} />
            <h3 className="text-base font-black" style={{ color: isDark ? '#F0F4FF' : '#1A1A1A' }}>Explorar por província</h3>          </div>
          {selectedProvincia && (
            <button onClick={() => setSelectedProvincia(null)}
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
              Limpar filtro ×
            </button>
          )}
        </div>
        
        {/* Grid 2 linhas x 5 colunas */}
        <div className="px-4 space-y-3">
          {/* Primeira linha - 5 províncias */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { name: 'Maputo',       image: '/images/provincias_profile/maputo_cidade.jpg' },
              { name: 'Gaza',         image: '/images/provincias_profile/maputo_provicnia.jpeg' },
              { name: 'Inhambane',    image: '/images/provincias_profile/inhambane.jpeg' },
              { name: 'Sofala',       image: '/images/provincias_profile/sofala.jpeg' },
              { name: 'Manica',       image: '/images/provincias_profile/manica.jpg' },
            ].map((prov, i) => {
              const isActive = selectedProvincia === prov.name;
              return (
                <motion.button
                  key={prov.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedProvinciaFeed(prov.name)}
                  className="relative rounded-2xl overflow-hidden shadow-sm"
                  style={{ height: 80, outline: isActive ? `3px solid #1B5E3B` : 'none', outlineOffset: 2 }}
                >
                  <img src={prov.image} alt={prov.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: isActive ? 'rgba(27,94,59,0.45)' : 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
                  <span className="absolute bottom-2 left-2 text-white text-xs font-black">{prov.name}</span>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <IconStar size={10} color="#1B5E3B" strokeWidth={2.5} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Segunda linha - 5 províncias */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { name: 'Tete',         image: '/images/provincias_profile/tete.jpg' },
              { name: 'Zambézia',     image: '/images/provincias_profile/zambezia.jpeg' },
              { name: 'Nampula',      image: '/images/provincias_profile/nampula.jpeg' },
              { name: 'Cabo Delgado', image: '/images/provincias_profile/cabo_delgado.jpeg' },
              { name: 'Niassa',       image: '/images/provincias_profile/niassa.webp' },
            ].map((prov, i) => {
              const isActive = selectedProvincia === prov.name;
              return (
                <motion.button
                  key={prov.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i + 5) * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedProvinciaFeed(prov.name)}
                  className="relative rounded-2xl overflow-hidden shadow-sm"
                  style={{ height: 80, outline: isActive ? `3px solid #1B5E3B` : 'none', outlineOffset: 2 }}
                >
                  <img src={prov.image} alt={prov.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: isActive ? 'rgba(27,94,59,0.45)' : 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
                  <span className="absolute bottom-2 left-2 text-white text-xs font-black">{prov.name}</span>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <IconStar size={10} color="#1B5E3B" strokeWidth={2.5} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BANNER PATRIMÔNIO CULTURAL ────────────────────────────────────── */}
      {onCulture && (
        <div className="px-4 py-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onCulture}
            className="w-full relative overflow-hidden rounded-2xl"
            style={{ height: 120 }}
          >
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }} />
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            <div className="relative flex items-center justify-between px-5 py-4 h-full">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <h3 className="text-white text-lg font-black leading-tight">
                    Património Cultural
                  </h3>
                </div>
                <p className="text-white/75 text-xs mt-0.5">
                  Descobre os sítios, monumentos e conjuntos históricos de Moçambique
                </p>
              </div>
              <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-white/20 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </motion.button>
        </div>
      )}

      </div>{/* ── fim fundo branco contínuo ── */}

      {/* ── SERVIÇOS LOCAIS ───────────────────────────────────────────────── */}
      <div className="pt-5 pb-0" style={{ background: isDark ? '#0F1117' : '#F5F5F0' }}>
        {/* Section header */}
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-1.5">
            {/* Business/Store icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2BB5C8" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-base font-extrabold" style={{ color: isDark ? '#F0F4FF' : '#111827' }}>{serviceSectionTitle}</span>
          </div>
          <button
            className="flex items-center gap-0.5 text-sm font-semibold"
            style={{ color: isDark ? '#6B7A99' : '#6B7280' }}
            onClick={() => setShowAllServices(true)}
          >
            Ver mais <IconChevronRight size={16} />
          </button>
        </div>

        {isLoadingServices ? (
          /* Loader animado — identidade Txopela Tour */
          /* Loader animado — identidade Txopela Tour */
          <div className="flex items-center justify-center w-full py-12">
            <div className="flex flex-col items-center gap-4">
              {/* Cinco dots com pulse escalonado */}
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i === 2 ? '#2BB5C8' : '#2BB5C899',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : filteredServices.length > 0 ? (
          /* Cards scroll horizontal - matching Descobertas style */
          <div className="services-scroll flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
            {filteredServices.map((svc) => {
              const badgeBg = svc.badgeBg || '#0F766E';
              const badgeLabel = svc.badge || translateServiceCategory(svc.category);
              const SVC_CAT_COLOR: Record<string, string> = {
                'Hospedagem':     '#2563EB',
                'Guia Turístico': '#F4821F',
                'Experiência':    '#22C55E',
                'Transporte':     '#1B5E3B',
                'Equipamento':    '#E05A3A',
                'Outro':          '#7B5EA7',
              };
              const catLabel = translateServiceCategory(svc.category);
              const catColor = SVC_CAT_COLOR[catLabel] || '#7B5EA7';
              
              return (
                <motion.div
                  key={svc.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedService({
                    id: svc.id,
                    name: svc.name,
                    category: svc.category,
                    description: svc.description ?? '',
                    provincia: svc.provincia,
                    distrito: svc.distrito,
                    endereco: svc.endereco,
                    image: svc.image,
                    images: svc.images,
                    rating: svc.rating,
                    reviewsCount: svc.reviews,
                    telefone: svc.telefone,
                    whatsapp: svc.whatsapp,
                    email: svc.email,
                    horario: svc.horario,
                    lat: svc.lat,
                    lng: svc.lng,
                    contributor: svc.contributor,
                  })}
                  className="flex-shrink-0 rounded-2xl overflow-hidden relative cursor-pointer"
                  style={{ width: 200, height: 270 }}
                >
                  <img src={svc.image} alt={svc.name} className="absolute inset-0 w-full h-full object-cover" />
                  {/* Dark gradient bottom */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.30) 55%, transparent 100%)' }} />

                  {/* Badge + Heart */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <span
                      className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: badgeBg }}
                    >
                      {badgeLabel}
                    </span>
                    <button
                      onClick={(e) => { handleFavoriteService(e, svc); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
                    >
                      <IconHeart
                        size={15}
                        className={isFavorite(svc.id) ? 'text-[#0077B6]' : 'text-white'}
                        fill={isFavorite(svc.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                    <h3 className="text-white font-extrabold text-sm leading-tight mb-1.5">{svc.name}</h3>
                    <p className="text-white/80 text-[11px] leading-snug mb-2">
                      {svc.description ? svc.description.split(' ').slice(0, 4).join(' ') + (svc.description.split(' ').length > 4 ? '...' : '') : ''}
                    </p>
                    {/* Rating à esquerda, categoria à direita */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <IconStar size={11} fill={svc.rating > 0 ? '#FBBF24' : 'none'} stroke={svc.rating > 0 ? 'none' : '#9CA3AF'} />
                        <span className="text-white text-xs font-bold">
                          {svc.rating > 0 ? (typeof svc.rating === 'number' ? svc.rating.toFixed(1) : svc.rating) : 'Novo'}
                        </span>
                        {svc.rating > 0 && <span className="text-white/60 text-[10px]">({svc.reviews})</span>}
                      </div>
                      <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: catColor }}>
                        {catLabel}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="mx-4 py-8 rounded-2xl flex flex-col items-center gap-2"
            style={{ background: isDark ? '#1A1D27' : '#F3F4F6' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>Nenhum serviço encontrado</p>
          </div>
        )}
      </div>


    </div>
  );
}

