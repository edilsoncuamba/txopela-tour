import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE, extractImages, resolveUserType } from '@/utils/dataValidation';
import { translateLocalCategory, translateServiceCategory, translateUserType } from '@/utils/translations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import {
  ChevronLeft, MapPin, Star, Heart, Share2,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import GalleryCarousel from '@/components/GalleryCarousel';
import ImageCarousel from '@/components/ImageCarousel';
import ServiceDetail from './ServiceDetail';
import ServicesListing from './ServicesListing';
import LocationCard from '@/components/shared/LocationCard';
import { fromApi, hasLocation } from '@/utils/normalizeLocation';
import ReviewManager from '@/components/ReviewManager';
import { servicesApi, localsApi, reviewsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

// --- Cores por tipo de utilizador --------------------------------------------

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

// --- Tipos --------------------------------------------------------------------

interface Destination {
  id: string;
  name: string;
  category: string;
  provincia: string;
  desc: string;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  badge?: string;
  badgeBg?: string;
  melhorEpoca?: string;
  lat?: number;
  lng?: number;
  endereco?: string;
  distrito?: string;
  city?: string;
  country?: string;
  province?: string;
  district?: string;
  administrative_post?: string;
  locality?: string;
  nearby_reference?: string;
  location?: {
    country?: string;
    province?: string;
    district?: string;
    administrative_post?: string;
    administrative_area?: string;
    locality?: string;
    city?: string;
    nearby_reference?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  destaques?: string[];
  tipo?: string;
  contributor?: {
    name: string;
    avatar?: string;
    type?: string;
  };
}

interface DestinationDetailProps {
  destination: Destination;
  onBack: () => void;
  onExploreMore: () => void;
}

// --- Componente principal -----------------------------------------------------

export default function DestinationDetail({
  destination, onBack, onExploreMore,
}: DestinationDetailProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isDark } = useTheme();
  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#A8B4CC' : '#374151',
    muted:   isDark ? '#6B7A99' : '#94A3B8',
    skel:    isDark ? '#22263A' : '#E5E7EB',
    greenBg: isDark ? 'rgba(74,222,128,0.12)' : '#EEF7F0',
  };

  const [suggested, setSuggested]         = useState(false);
  const [galleryPaused, setGalleryPaused] = useState(false);
  const [selectedService, setSelectedService]     = useState<any>(null);
  const [showServicesListing, setShowServicesListing] = useState(false);
  const [nearbyServices, setNearbyServices] = useState<any[]>([]);
  const [reviewCount, setReviewCount] = useState(destination.reviews || 0);
  const [avgRating, setAvgRating]     = useState(destination.rating  || 0);

  const [localDetails, setLocalDetails]       = useState<Destination>(destination);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  // Reviews embutidas vindas do LocalDetail — campo obrigatório do schema
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  // Carregar detalhes completos do local da API
  useEffect(() => {
    const loadLocalDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const { data, error } = await localsApi.get(destination.id);
        if (error) {
          console.error('[DestinationDetail] Erro da API:', error);
        }
        if (data && !error) {
          // ── DEBUG: ver exactamente o que o backend retorna ─────────────────
          console.group(`%c[REVIEWS DEBUG] localsApi.get(${destination.id})`, 'color:orange;font-weight:bold');
          console.log('data (após apiFetch extrair envelope):', JSON.stringify(data, null, 2));
          console.log('data?.local:', data?.local);
          console.log('data?.data:', data?.data);
          console.groupEnd();
          // ──────────────────────────────────────────────────────────────────

          // Extrair imagens da resposta — tentar todas as estruturas possíveis da API
          const rawData = data?.local ?? data?.data ?? data;

          // ── DEBUG: rawData.reviews ─────────────────────────────────────────
          console.group('%c[REVIEWS DEBUG] rawData', 'color:orange;font-weight:bold');
          console.log('rawData.reviews:', rawData.reviews);
          console.log('rawData.rating:', rawData.rating);
          console.groupEnd();
          // ──────────────────────────────────────────────────────────────────
          const apiImages = extractImages(rawData);

          const mappedData: Destination = {
            ...destination,
            name:        rawData.name        || destination.name,
            desc:        rawData.description || destination.desc,
            image:       apiImages[0] ?? destination.image,
            images:      apiImages.length > 0 ? apiImages : (destination.images ?? []),
            rating:      parseFloat(rawData.rating?.average ?? rawData.rating ?? destination.rating),
            reviews:     rawData.rating?.count ?? destination.reviews,
            // LocalDetail usa bestSeason (camelCase) — openapi-schema(3).yaml
            melhorEpoca: rawData.bestSeason || rawData.best_season || destination.melhorEpoca || 'Todo o ano',
            // LocalDetail usa subcategory para tipo de lugar — openapi-schema(3).yaml
            tipo:        rawData.subcategory || rawData.place_type || rawData.type || destination.tipo || 'Local',
            category:    rawData.category
              ? translateLocalCategory(rawData.category)
              : destination.category,
            destaques: Array.isArray(rawData.highlights)
              ? rawData.highlights
              : (typeof rawData.highlights === 'string' && rawData.highlights)
                ? rawData.highlights.split(',').map((h: string) => h.trim()).filter(Boolean)
                : destination.destaques || [],
            location:    rawData.location || undefined,
            lat:         rawData.location?.latitude  ?? destination.lat,
            lng:         rawData.location?.longitude ?? destination.lng,
            provincia:           (rawData.location?.province           ?? (rawData as any).province   ?? destination.provincia) || '',
            distrito:            (rawData.location?.municipality       ?? rawData.location?.district  ?? (rawData as any).district ?? destination.distrito) || '',
            administrative_post: (rawData.location?.administrative_post ?? (rawData as any).administrative_post ?? '') || '',
            locality:            (rawData.location?.locality ?? rawData.location?.city ?? (rawData as any).locality ?? '') || '',
            nearby_reference:    (rawData.location?.nearby_reference   ?? (rawData as any).nearby_reference ?? '') || '',
            endereco:            (rawData.location?.address            ?? (rawData as any).address    ?? destination.endereco ?? '') || '',
            city:                (rawData.location?.city ?? rawData.location?.town ?? (rawData as any).city ?? '') || '',
            // LocalDetail usa owner (LocalOwner: { id, name, avatar, role }) — openapi-schema(3).yaml
            contributor: (rawData.owner || rawData.author || rawData.contributor || rawData.created_by) ? {
              name:   rawData.owner?.name   || rawData.author?.name   || rawData.contributor?.name   || rawData.created_by?.name   || 'Contribuidor',
              avatar: rawData.owner?.avatar || rawData.author?.avatar || rawData.contributor?.avatar || rawData.created_by?.avatar,
              type:   resolveUserType(
                rawData.owner?.role    || rawData.owner?.type    ||
                rawData.author?.role   || rawData.author?.type   ||
                rawData.contributor?.type || rawData.created_by?.type
              ),
            } : destination.contributor,
          };
          setLocalDetails(mappedData);
          setAvgRating(mappedData.rating);
          setReviewCount(mappedData.reviews);

          // ── Carregar reviews ───────────────────────────────────────────────
          // Estratégia dupla conforme openapi-schema(3).yaml:
          //   1. rawData.reviews — campo obrigatório do LocalDetail embutido
          //   2. GET /api/locals/{id}/reviews/ — endpoint dedicado como fallback
          // Usa a lista que tiver mais entradas para garantir persistência.

          // Fonte 1: reviews embutidas no LocalDetail
          const embedded: any[] = Array.isArray(rawData.reviews) ? rawData.reviews : [];

          // Fonte 2: endpoint dedicado GET /api/locals/{id}/reviews/
          let fromEndpoint: any[] = [];
          try {
            const revResp = await reviewsApi.getForLocal(rawData.id || destination.id);

            // ── DEBUG: ver resposta do endpoint dedicado ───────────────────
            console.group('%c[REVIEWS DEBUG] reviewsApi.getForLocal', 'color:purple;font-weight:bold');
            console.log('revResp.error:', revResp.error);
            console.log('revResp.data (raw):', JSON.stringify(revResp.data, null, 2));
            console.groupEnd();
            // ────────────────────────────────────────────────────────────────

            if (!revResp.error && revResp.data) {
              const d = revResp.data as any;
              // Normalizar: array directo | { reviews: [] } | { results: [] } | { data: [] }
              if      (Array.isArray(d))          fromEndpoint = d;
              else if (Array.isArray(d.reviews))  fromEndpoint = d.reviews;
              else if (Array.isArray(d.results))  fromEndpoint = d.results;
              else if (Array.isArray(d.data))     fromEndpoint = d.data;
            }
          } catch { /* silencioso — usa embedded como fallback */ }

          // Escolher a lista com mais reviews
          const best = fromEndpoint.length >= embedded.length ? fromEndpoint : embedded;
          console.log(`[DestinationDetail] reviews — embutidas: ${embedded.length}, endpoint: ${fromEndpoint.length}, a usar: ${best.length}`);
          setLocalReviews(best);
        }
      } catch (error) {
        console.error('[DestinationDetail] Erro ao carregar detalhes do local:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    loadLocalDetails();
  }, [destination.id]);

  // Carregar servi�os pr�ximos
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await servicesApi.list({ province: localDetails.provincia, limit: 4 });
        const items: any[] = Array.isArray(data) ? data : (data?.services ?? data?.results ?? []);
        setNearbyServices(items.slice(0, 4).map((s: any) => ({
          id: String(s.id),
          name: s.title || s.name || 'Servi�o',
          category: translateServiceCategory(s.category),
          rating: parseFloat(s.rating?.average ?? s.rating ?? 0),
          reviewsCount: s.rating?.count ?? 0,
          distance: s.location?.distance || '',
          image: extractImages(s)[0] ?? PLACEHOLDER_IMAGE,
          description: s.description || '',
          provincia: s.location?.province || '',
          distrito: s.location?.municipality || '',
          endereco: s.location?.address || '',
          telefone: s.contact?.phone || s.provider?.phone || '',
          whatsapp: s.contact?.whatsapp || s.provider?.whatsapp || '',
          email: s.contact?.email || s.provider?.email || '',
          horario: s.availability?.schedule || 'Consultar',
          lat: s.location?.latitude,
          lng: s.location?.longitude,
          contributor: s.provider ? {
            id:   String(s.provider.id || ''),
            name: s.provider.name || s.provider.businessName || 'Prestador',
            type: resolveUserType(s.provider.role || s.provider.type),
          } : s.author ? {
            id:   String(s.author.id || ''),
            name: s.author.name || 'Autor',
            type: resolveUserType(s.author.role || s.author.type),
          } : undefined,
        })));
      } catch { setNearbyServices([]); }
    };
    load();
  }, [localDetails.provincia]);

  return (
    <>
      {showServicesListing ? (
        <ServicesListing onBack={() => setShowServicesListing(false)}
          initialProvince={destination.provincia} initialDistrict={destination.distrito} />
      ) : selectedService ? (
        <ServiceDetail service={selectedService} onBack={() => setSelectedService(null)} />
      ) : (
        <motion.div className="pb-16"
          style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}>

          {/* -- CONTE�DO � mobile: stack | desktop: 2 colunas -- */}
          <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-6 md:pt-6 px-4 pt-3 space-y-3 md:space-y-0">

            {/* GALERIA � ocupa as 2 colunas */}
            <div
              className="md:col-span-2 -mx-4 md:mx-0"
            >
              <div className="relative w-full overflow-hidden md:rounded-2xl"
                style={{ height: 'clamp(270px, 30vw, 370px)' }}>
                <GalleryCarousel
                  images={localDetails.images && localDetails.images.length > 0 ? localDetails.images : [localDetails.image || PLACEHOLDER_IMAGE]}
                  alt={localDetails.name}
                >
                  {/* Top bar � z-30 */}
                  <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between" style={{ zIndex: 3 }}>
                    <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                      <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                        <Share2 size={16} className="text-white" strokeWidth={2} />
                      </button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleFavorite({
                          id: localDetails.id, type: 'local', name: localDetails.name,
                          image: localDetails.image || PLACEHOLDER_IMAGE, tag: localDetails.category,
                          rating: localDetails.rating, provincia: localDetails.provincia,
                          distrito: localDetails.distrito, raw: localDetails,
                        })}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: isFavorite(localDetails.id) ? '#0EA5E9' : 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                        <Heart size={16} fill={isFavorite(localDetails.id) ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Bottom info � z-30 */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4" style={{ zIndex: 3 }}>
                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-white/70" />
                          <span className="text-white/80 text-xs">{localDetails.provincia}</span>
                        </div>
                        <span className="text-white/40">�</span>
                        <div className="flex items-center gap-1">
                          <Star size={12} fill="#FBBF24" stroke="none" />
                          <span className="text-white font-black text-xs">{avgRating}</span>
                          <span className="text-white/60 text-[10px]">({reviewCount})</span>
                        </div>
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSuggested(!suggested)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                        style={{ background: suggested ? 'rgba(27,94,59,0.9)' : 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                        </svg>
                        <span className="text-white text-[11px] font-bold">{suggested ? 'Sugerido' : 'Sugerir'}</span>
                      </motion.button>
                    </div>
                  </div>
                </GalleryCarousel>
              </div>
            </div>

            {/* -- Coluna esquerda -- */}
            <div className="space-y-3">

              {/* Nome + categoria */}
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-black" style={{ color: dm.text }}>{localDetails.name}</h1>
                {localDetails.category && (
                  <span className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0 ml-2"
                    style={{ background: dm.greenBg, color: '#1B5E3B' }}>
                    {translateLocalCategory(localDetails.category)}
                  </span>
                )}
              </div>

              {/* Contribuidor � s� aparece se existir */}
              {localDetails.contributor && (() => {
                const c = localDetails.contributor!;
                const name   = c.name;
                const avatar = c.avatar;
                const type   = c.type || 'resident';
                const color  = TYPE_COLORS[type] || '#1B5E3B';
                const bg     = TYPE_BG[type]     || '#EEF7F0';
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${color}, #2BB5C8)` }}>
                      {avatar
                        ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                        : name.charAt(0).toUpperCase()}
                    </div>
                <p className="text-xs font-black flex-1 text-left" style={{ color: dm.text }}>{name}</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: bg, color }}>
                      {translateUserType(type)}
                    </span>
                  </div>
                );
              })()}

              {/* Sobre este local */}
              <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
                style={{ background: dm.surface }}>
                <h2 className="text-xs font-black" style={{ color: dm.text }}>Sobre este local</h2>

                <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: dm.muted }}>Tipo de lugar</p>
                  <p className="text-xs font-bold" style={{ color: dm.text }}>
                    {localDetails.tipo || localDetails.category || 'Local de interesse'}
                  </p>
                </div>

                <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: dm.muted }}>Melhor �poca para visitar</p>
                  <p className="text-xs font-bold" style={{ color: '#1B5E3B' }}>
                    {localDetails.melhorEpoca || 'Todo o ano'}
                  </p>
                </div>

                <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: dm.muted }}>Descri��o</p>
                  <p className="text-sm leading-relaxed text-justify" style={{ color: dm.text2 }}>
                    {localDetails.desc || 'Informa��es sobre este local em breve.'}
                  </p>
                </div>

                {(() => {
                  const loc = fromApi(localDetails);
                  return hasLocation(loc) ? (
                    <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                      <LocationCard size="sm" data={loc} showMap publicationName={localDetails.name} />
                    </div>
                  ) : null;
                })()}

                {localDetails.destaques && localDetails.destaques.length > 0 && (
                  <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                    <p className="text-[10px] font-semibold mb-1.5" style={{ color: dm.muted }}>Destaques</p>
                    <div className="flex flex-wrap gap-1.5">
                      {localDetails.destaques.map((d, index) => (
                        <span key={index} className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: dm.greenBg, color: '#1B5E3B' }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Servi�os pr�ximos */}
              <div className="rounded-2xl p-3.5 shadow-sm text-left"
                style={{ background: dm.surface }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-black" style={{ color: dm.text }}>Servi�os locais em destaque</h2>
                    <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>
                      {localDetails.distrito ? `Pr�ximos a ${localDetails.distrito}` : `Em ${localDetails.provincia}`}
                    </p>
                  </div>
                  <button onClick={() => setShowServicesListing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: '#EEF7F0' }}>
                    <Eye size={12} style={{ color: '#1B5E3B' }} />
                    <span className="text-xs font-black" style={{ color: '#1B5E3B' }}>Ver todos</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {nearbyServices.slice(0, 2).map(service => (
                    <motion.div key={service.id} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedService(service)}
                      className="relative overflow-hidden rounded-xl cursor-pointer group"
                      style={{ aspectRatio: '1.2/1' }}>
                      <img src={service.image} alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute inset-0 p-2.5 flex flex-col justify-between">
                        <div className="flex justify-end">
                          <span className="text-[8px] font-bold px-2 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.9)', color: '#1B5E3B' }}>
                            {service.category}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-white mb-0.5 leading-tight">{service.name}</h3>
                          <div className="flex items-center gap-1">
                            <Star size={10} fill="#FBBF24" stroke="none" />
                            <span className="text-[10px] font-black text-white">{service.rating || 'Novo'}</span>
                            <span className="text-[9px] text-white/80">({service.reviewsCount})</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {nearbyServices.length === 0 && (
                    <p className="col-span-2 text-xs text-gray-400 text-center py-4">
                      Sem servi�os dispon�veis nesta �rea.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* -- Coluna direita -- */}
            <div className="space-y-3">

              {/* Sistema de Avalia��es */}
              <ReviewManager
                key={localDetails.id}
                resourceType="local"
                resourceId={localDetails.id}
                initialReviews={localReviews}
                showCreateForm={true}
                onReviewsUpdated={() => {}}
              />

              {/* Como chegar */}
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }}>
                <p className="text-white font-black text-sm mb-0.5">Quer visitar este destino?</p>
                <p className="text-white/75 text-xs mb-3 leading-snug">Clica para ver a rota at� l�.</p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  onClick={() => {
                    const url = localDetails.lat && localDetails.lng
                      ? `https://www.google.com/maps/dir/?api=1&destination=${localDetails.lat},${localDetails.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localDetails.name + ' ' + localDetails.provincia + ' Mo�ambique')}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs"
                  style={{ background: 'white', color: '#1B5E3B' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  Como chegar
                </motion.button>
              </div>

            </div>
          </div>

        </motion.div>
      )}
    </>
  );
}
