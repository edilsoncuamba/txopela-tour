import { useState, useEffect, useCallback } from 'react';
import { PLACEHOLDER_IMAGE, extractImages, resolveUserType } from '@/utils/dataValidation';
import { translateLocalCategory, translateServiceCategory, translateUserType } from '@/utils/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import {
  ChevronLeft, MapPin, Star, Heart, Share2, Eye,
  Phone, Mail, Globe, MessageCircle,
  Wifi, ParkingCircle, Waves, UtensilsCrossed, Wind,
  Dog, Coffee, Dumbbell, Anchor, TreePine, Check,
  DollarSign, Tag, CalendarDays, Info, Navigation,
  Clock, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import GalleryCarousel from '@/components/GalleryCarousel';
import ServiceDetail from './ServiceDetail';
import ServicesListing from './ServicesListing';
import LocationCard from '@/components/shared/LocationCard';
import { fromApi, hasLocation } from '@/utils/normalizeLocation';
import ReviewManager from '@/components/ReviewManager';
import { servicesApi, localsApi, reviewsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useSuggest } from '@/hooks/useSuggest';

// ─── Cores por tipo de utilizador ─────────────────────────────────────────────

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

// ─── Mapeamento de comodidades (id → label + ícone) ───────────────────────────

const AMENITY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  wifi:         { label: 'Wi-Fi',                icon: <Wifi size={14} strokeWidth={2} /> },
  parking:      { label: 'Estacionamento',       icon: <ParkingCircle size={14} strokeWidth={2} /> },
  sea_view:     { label: 'Vista para o mar',     icon: <Waves size={14} strokeWidth={2} /> },
  pool:         { label: 'Piscina',              icon: <Waves size={14} strokeWidth={2} /> },
  restaurant:   { label: 'Restaurante',          icon: <UtensilsCrossed size={14} strokeWidth={2} /> },
  bar:          { label: 'Bar',                  icon: <Coffee size={14} strokeWidth={2} /> },
  ac:           { label: 'Ar condicionado',      icon: <Wind size={14} strokeWidth={2} /> },
  accessible:   { label: 'Acessível',            icon: <Check size={14} strokeWidth={2} /> },
  pet_friendly: { label: 'Aceita animais',       icon: <Dog size={14} strokeWidth={2} /> },
  beach_access: { label: 'Acesso à praia',       icon: <Anchor size={14} strokeWidth={2} /> },
  tours:        { label: 'Excursões',            icon: <TreePine size={14} strokeWidth={2} /> },
  diving:       { label: 'Mergulho',             icon: <Anchor size={14} strokeWidth={2} /> },
  gym:          { label: 'Ginásio',              icon: <Dumbbell size={14} strokeWidth={2} /> },
};

// ─── Mapeamento faixa de preço ────────────────────────────────────────────────

const PRICE_MAP: Record<string, { label: string; description: string }> = {
  '$':    { label: '$',    description: 'Económico' },
  '$$':   { label: '$$',   description: 'Moderado' },
  '$$$':  { label: '$$$',  description: 'Elevado' },
  '$$$$': { label: '$$$$', description: 'Premium' },
};

// ─── Mapeamento da melhor época ───────────────────────────────────────────────

const SEASON_MAP: Record<string, { label: string; sub: string; color: string }> = {
  chuvosa:   { label: 'Época quente e chuvosa', sub: 'Novembro – Março',  color: '#2563EB' },
  transicao: { label: 'Período de transição',   sub: 'Abril – Maio',      color: '#7B5EA7' },
  seca:      { label: 'Época seca e fresca',     sub: 'Junho – Outubro',   color: '#F4821F' },
};

function resolveSeason(raw?: string): { label: string; sub?: string; color: string } {
  if (!raw) return { label: 'Todo o ano', color: '#1B5E3B' };
  const key = raw.toLowerCase().trim();
  if (SEASON_MAP[key]) return SEASON_MAP[key];
  // Se a API devolver o label completo
  for (const v of Object.values(SEASON_MAP)) {
    if (v.label.toLowerCase().includes(key) || key.includes(v.label.toLowerCase().slice(0, 5))) {
      return v;
    }
  }
  return { label: raw, color: '#1B5E3B' };
}

// ─── Normalizar número para wa.me ─────────────────────────────────────────────

function normalizeWhatsApp(phone: string): string {
  // Remover tudo excepto dígitos e o +
  const digits = phone.replace(/[^\d+]/g, '');
  // Se já tem indicativo (+258 Moçambique ou outro), usar directamente
  if (digits.startsWith('+')) return digits.replace('+', '');
  if (digits.startsWith('00')) return digits.slice(2);
  // Assumir Moçambique (+258) se o número começar por 8 (8x xxxxxxx)
  if (/^[89]\d{7,8}$/.test(digits)) return `258${digits}`;
  return digits;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface LocalContact {
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
}

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
    municipality?: string;
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
  // Campos novos — dados completos da API
  contact?: LocalContact;
  priceRange?: string;
  amenities?: string[];
  hours?: Record<string, { open?: string; close?: string; closed?: boolean }> | null;
  contributor?: {
    id?: string;
    name: string;
    avatar?: string;
    type?: string;
  };
}

interface DestinationDetailProps {
  destination: Destination;
  onBack: () => void;
  onExploreMore: () => void;
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
}

// ─── Dias da semana em PT ─────────────────────────────────────────────────────

const DAYS_PT: Record<string, string> = {
  monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo',
};
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DestinationDetail({
  destination, onBack, onExploreMore, onAuthorPress,
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
    chip:    isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
  };

  const [selectedService, setSelectedService]         = useState<any>(null);
  const [showServicesListing, setShowServicesListing] = useState(false);
  const [nearbyServices, setNearbyServices]           = useState<any[]>([]);
  const [reviewCount, setReviewCount]                 = useState(destination.reviews || 0);
  const [avgRating, setAvgRating]                     = useState(destination.rating  || 0);
  const [localDetails, setLocalDetails]               = useState<Destination>(destination);
  const [isLoadingDetails, setIsLoadingDetails]       = useState(false);
  const [loadError, setLoadError]                     = useState<string | null>(null);
  const [localReviews, setLocalReviews]               = useState<any[]>([]);
  const [showShareToast, setShowShareToast]           = useState(false);

  const ownerIdRef = localDetails.contributor?.id ?? destination.contributor?.id ?? '';
  const {
    isSuggested, isLoading: isSuggestLoading,
    toggle: toggleSuggest, errorMessage: suggestError, isSelf: isSuggestSelf,
  } = useSuggest(ownerIdRef || null, false, user?.id);

  // ── Carregar detalhes completos da API ──────────────────────────────────────
  useEffect(() => {
    const loadLocalDetails = async () => {
      setIsLoadingDetails(true);
      setLoadError(null);
      try {
        const { data, error } = await localsApi.get(destination.id);
        if (error) {
          console.error('[DestinationDetail] Erro da API:', error);
          setLoadError(error);
          return;
        }
        if (!data) return;

        const rawData = (data as any)?.local ?? (data as any)?.data ?? data;
        const apiImages = extractImages(rawData);

        // ── Normalizar amenities — pode vir como array ou string ─────────────
        let amenities: string[] = [];
        if (Array.isArray(rawData.amenities)) {
          amenities = rawData.amenities.map((a: any) => String(a).trim()).filter(Boolean);
        } else if (typeof rawData.amenities === 'string' && rawData.amenities) {
          try { amenities = JSON.parse(rawData.amenities); } catch {
            amenities = rawData.amenities.split(',').map((a: string) => a.trim()).filter(Boolean);
          }
        }

        // ── Normalizar highlights ────────────────────────────────────────────
        let destaques: string[] = [];
        if (Array.isArray(rawData.highlights)) {
          destaques = rawData.highlights.map((h: any) => String(h).trim()).filter(Boolean);
        } else if (typeof rawData.highlights === 'string' && rawData.highlights) {
          try { destaques = JSON.parse(rawData.highlights); } catch {
            destaques = rawData.highlights.split(',').map((h: string) => h.trim()).filter(Boolean);
          }
        }

        // ── Normalizar contact ───────────────────────────────────────────────
        const contact: LocalContact = {};
        const rawContact = rawData.contact || {};
        if (rawContact.phone)    contact.phone    = String(rawContact.phone).trim();
        if (rawContact.whatsapp) contact.whatsapp = String(rawContact.whatsapp).trim();
        if (rawContact.email)    contact.email    = String(rawContact.email).trim();
        if (rawContact.website)  contact.website  = String(rawContact.website).trim();

        const mappedData: Destination = {
          ...destination,
          name:        rawData.name        || destination.name,
          desc:        rawData.description || destination.desc,
          image:       apiImages[0] ?? destination.image,
          images:      apiImages.length > 0 ? apiImages : (destination.images ?? []),
          rating:      typeof rawData.rating === 'object'
                         ? parseFloat(rawData.rating?.average ?? 0)
                         : parseFloat(rawData.rating ?? destination.rating ?? 0),
          reviews:     rawData.rating?.count ?? destination.reviews,
          melhorEpoca: rawData.bestSeason || rawData.best_season || destination.melhorEpoca || '',
          tipo:        rawData.subcategory || rawData.place_type || rawData.type || destination.tipo || '',
          category:    rawData.category
            ? translateLocalCategory(rawData.category)
            : destination.category,
          destaques,
          amenities,
          contact:     Object.keys(contact).length > 0 ? contact : undefined,
          priceRange:  rawData.priceRange || rawData.price_range || destination.priceRange || '',
          hours:       rawData.hours ?? null,
          location:    rawData.location || destination.location,
          lat:         rawData.location?.latitude  ?? destination.lat,
          lng:         rawData.location?.longitude ?? destination.lng,
          provincia:   (rawData.location?.province ?? (rawData as any).province ?? destination.provincia) || '',
          distrito:    (rawData.location?.municipality ?? rawData.location?.district ?? (rawData as any).district ?? destination.distrito) || '',
          administrative_post: (rawData.location?.administrative_post ?? (rawData as any).administrative_post ?? '') || '',
          locality:    (rawData.location?.locality ?? rawData.location?.city ?? (rawData as any).locality ?? '') || '',
          nearby_reference: (rawData.location?.nearby_reference ?? (rawData as any).nearby_reference ?? '') || '',
          endereco:    (rawData.location?.address ?? (rawData as any).address ?? destination.endereco ?? '') || '',
          city:        (rawData.location?.city ?? rawData.location?.town ?? (rawData as any).city ?? '') || '',
          contributor: (rawData.owner || rawData.author || rawData.contributor || rawData.created_by) ? {
            id:     rawData.owner?.id     || rawData.author?.id     || rawData.contributor?.id     || rawData.created_by?.id     || '',
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

        // ── Carregar reviews — estratégia dupla ──────────────────────────────
        const embedded: any[] = Array.isArray(rawData.reviews) ? rawData.reviews : [];
        let fromEndpoint: any[] = [];
        try {
          const revResp = await reviewsApi.getForLocal(rawData.id || destination.id);
          if (!revResp.error && revResp.data) {
            const d = revResp.data as any;
            if      (Array.isArray(d))         fromEndpoint = d;
            else if (Array.isArray(d.reviews)) fromEndpoint = d.reviews;
            else if (Array.isArray(d.results)) fromEndpoint = d.results;
            else if (Array.isArray(d.data))    fromEndpoint = d.data;
          }
        } catch { /* fallback para embedded */ }

        setLocalReviews(fromEndpoint.length >= embedded.length ? fromEndpoint : embedded);

      } catch (err) {
        console.error('[DestinationDetail] Erro inesperado:', err);
        setLoadError('Não foi possível carregar os detalhes deste local.');
      } finally {
        setIsLoadingDetails(false);
      }
    };
    loadLocalDetails();
  }, [destination.id]);

  // ── Carregar serviços próximos ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await servicesApi.list({ province: localDetails.provincia, limit: 4 });
        const items: any[] = Array.isArray(data) ? data : (data?.posts ?? data?.services ?? data?.results ?? []);
        setNearbyServices(items.slice(0, 4).map((s: any) => ({
          id: String(s.id),
          name: s.title || s.name || 'Serviço',
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

  // ── Partilha ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const shareText = `${localDetails.name}${localDetails.provincia ? ` — ${localDetails.provincia}` : ''}, Moçambique`;
    const shareUrl  = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: localDetails.name, text: shareText, url: shareUrl });
      } catch { /* utilizador cancelou */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } catch { /* clipboard indisponível */ }
    }
  }, [localDetails.name, localDetails.provincia]);

  // ── Skeleton de carregamento ──────────────────────────────────────────────────
  const SkeletonLine = ({ w = 'w-full', h = 'h-3' }: { w?: string; h?: string }) => (
    <div className={`${w} ${h} rounded-full animate-pulse`} style={{ background: dm.skel }} />
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {showServicesListing ? (
        <ServicesListing
          onBack={() => setShowServicesListing(false)}
          initialProvince={destination.provincia}
          initialDistrict={destination.distrito}
        />
      ) : selectedService ? (
        <ServiceDetail service={selectedService} onBack={() => setSelectedService(null)} />
      ) : (
        <motion.div
          className="pb-24"
          style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* ── Toast de partilha ── */}
          <AnimatePresence>
            {showShareToast && (
              <motion.div
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg"
                style={{ background: '#1B5E3B', color: 'white', fontSize: 13, fontWeight: 700 }}
              >
                <Check size={14} strokeWidth={2.5} />
                Link copiado!
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Layout: mobile stack / desktop 2 colunas ── */}
          <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-6 md:pt-6 px-4 pt-3 space-y-3 md:space-y-0">

            {/* ── GALERIA — ocupa as 2 colunas ── */}
            <div className="md:col-span-2 -mx-4 md:mx-0">
              <div className="relative w-full overflow-hidden md:rounded-2xl"
                style={{ height: 'clamp(270px, 30vw, 370px)' }}>
                <GalleryCarousel
                  images={
                    localDetails.images && localDetails.images.length > 0
                      ? localDetails.images
                      : [localDetails.image || PLACEHOLDER_IMAGE]
                  }
                  alt={localDetails.name}
                >
                  {/* Top bar */}
                  <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between" style={{ zIndex: 3 }}>
                    <button
                      onClick={onBack}
                      aria-label="Voltar"
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                    >
                      <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShare}
                        aria-label="Partilhar"
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                      >
                        <Share2 size={16} className="text-white" strokeWidth={2} />
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        aria-label={isFavorite(localDetails.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        onClick={() => toggleFavorite({
                          id: localDetails.id, type: 'local', name: localDetails.name,
                          image: localDetails.image || PLACEHOLDER_IMAGE, tag: localDetails.category,
                          rating: localDetails.rating, provincia: localDetails.provincia,
                          distrito: localDetails.distrito, raw: localDetails,
                        })}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{
                          background: isFavorite(localDetails.id) ? '#0EA5E9' : 'rgba(0,0,0,0.35)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <Heart size={16} fill={isFavorite(localDetails.id) ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4" style={{ zIndex: 3 }}>
                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {localDetails.provincia && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-white/70" />
                            <span className="text-white/80 text-xs">{localDetails.provincia}</span>
                          </div>
                        )}
                        {(avgRating > 0 || reviewCount > 0) && (
                          <>
                            <span className="text-white/40">·</span>
                            <div className="flex items-center gap-1">
                              <Star size={12} fill="#FBBF24" stroke="none" />
                              <span className="text-white font-black text-xs">
                                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                              </span>
                              {reviewCount > 0 && (
                                <span className="text-white/60 text-[10px]">({reviewCount})</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
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
                          title={suggestError ?? undefined}
                          aria-label={isSuggested ? 'Sugerido' : 'Sugerir perfil do autor'}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ opacity: isSuggestLoading ? 0.5 : 1 }}>
                            <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                          </svg>
                          <span className="text-white text-[11px] font-bold">
                            {isSuggestLoading ? 'Sugerindo…' : isSuggested ? 'Sugerido' : 'Sugerir'}
                          </span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </GalleryCarousel>
              </div>
            </div>

            {/* ── Skeleton global enquanto carrega ── */}
            {isLoadingDetails && (
              <div className="md:col-span-2 space-y-3">
                <div className="rounded-2xl p-4 space-y-3" style={{ background: dm.surface }}>
                  <SkeletonLine w="w-2/3" h="h-5" />
                  <SkeletonLine w="w-full" />
                  <SkeletonLine w="w-5/6" />
                  <SkeletonLine w="w-4/6" />
                </div>
              </div>
            )}

            {/* ── Erro de carregamento ── */}
            {!isLoadingDetails && loadError && (
              <div className="md:col-span-2 rounded-2xl p-5 flex items-start gap-3"
                style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)' }}>
                <X size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm font-semibold" style={{ color: isDark ? '#FCA5A5' : '#B91C1C' }}>
                  {loadError}
                </p>
              </div>
            )}

            {/* ── Conteúdo principal ── */}
            {!isLoadingDetails && (
              <>
                {/* ════════ COLUNA ESQUERDA ════════ */}
                <div className="space-y-3">

                  {/* Nome + categoria */}
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="text-xl font-black leading-tight" style={{ color: dm.text }}>{localDetails.name}</h1>
                    {localDetails.category && (
                      <span className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0 mt-0.5"
                        style={{ background: dm.greenBg, color: '#1B5E3B' }}>
                        {translateLocalCategory(localDetails.category)}
                      </span>
                    )}
                  </div>

                  {/* Contribuidor */}
                  {localDetails.contributor && (() => {
                    const c   = localDetails.contributor!;
                    const type  = c.type || 'resident';
                    const color = TYPE_COLORS[type] || '#1B5E3B';
                    const bg    = TYPE_BG[type]     || '#EEF7F0';
                    const hasId = !!c.id;
                    return (
                      <button
                        className="flex items-center gap-2 w-full text-left"
                        onClick={() => { if (hasId && onAuthorPress) onAuthorPress({ id: c.id!, name: c.name, avatar: c.avatar, type }); }}
                        style={{ cursor: hasId && onAuthorPress ? 'pointer' : 'default' }}
                        aria-label={hasId && onAuthorPress ? `Ver perfil de ${c.name}` : undefined}
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${color}, #2BB5C8)` }}>
                          {c.avatar
                            ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                            : c.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-black flex-1 text-left" style={{ color: dm.text }}>{c.name}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: bg, color }}>{translateUserType(type)}</span>
                      </button>
                    );
                  })()}

                  {/* ── A. Informações Gerais ── */}
                  <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-0"
                    style={{ background: dm.surface }}>
                    <h2 className="text-xs font-black mb-2" style={{ color: dm.text }}>Informações gerais</h2>

                    {/* Tipo de lugar */}
                    {localDetails.tipo && (
                      <InfoRow icon={<Tag size={13} strokeWidth={2} />} label="Tipo de lugar" dm={dm}>
                        <span className="text-xs font-bold" style={{ color: dm.text }}>{localDetails.tipo}</span>
                      </InfoRow>
                    )}

                    {/* Categoria */}
                    {localDetails.category && (
                      <InfoRow icon={<Info size={13} strokeWidth={2} />} label="Categoria" dm={dm}>
                        <span className="text-xs font-bold" style={{ color: dm.text }}>
                          {translateLocalCategory(localDetails.category)}
                        </span>
                      </InfoRow>
                    )}

                    {/* Melhor época */}
                    {localDetails.melhorEpoca && (() => {
                      const s = resolveSeason(localDetails.melhorEpoca);
                      return (
                        <InfoRow icon={<CalendarDays size={13} strokeWidth={2} />} label="Melhor época" dm={dm}>
                          <span className="text-xs font-bold" style={{ color: s.color }}>
                            {s.label}{s.sub ? ` · ${s.sub}` : ''}
                          </span>
                        </InfoRow>
                      );
                    })()}

                    {/* Descrição */}
                    {localDetails.desc && (
                      <div className="pt-2.5 border-t" style={{ borderColor: dm.border }}>
                        <p className="text-[10px] font-semibold mb-1" style={{ color: dm.muted }}>Descrição</p>
                        <p className="text-sm leading-relaxed" style={{ color: dm.text2, whiteSpace: 'pre-line' }}>
                          {localDetails.desc}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── B. Localização ── */}
                  {(() => {
                    const loc = fromApi(localDetails);
                    return hasLocation(loc) ? (
                      <div className="rounded-2xl p-3.5 shadow-sm text-left"
                        style={{ background: dm.surface }}>
                        <h2 className="text-xs font-black mb-2" style={{ color: dm.text }}>Localização</h2>
                        <LocationCard size="sm" data={loc} showMap publicationName={localDetails.name} />
                      </div>
                    ) : null;
                  })()}

                  {/* ── C. Destaques ── */}
                  {localDetails.destaques && localDetails.destaques.length > 0 && (
                    <div className="rounded-2xl p-3.5 shadow-sm text-left"
                      style={{ background: dm.surface }}>
                      <h2 className="text-xs font-black mb-2" style={{ color: dm.text }}>Destaques</h2>
                      <div className="flex flex-wrap gap-1.5">
                        {localDetails.destaques.map((d, i) => (
                          <span key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: dm.greenBg, color: '#1B5E3B' }}>
                            <Check size={11} strokeWidth={2.5} />
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── D. Informações adicionais (preço + comodidades) ── */}
                  {(localDetails.priceRange || (localDetails.amenities && localDetails.amenities.length > 0)) && (
                    <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
                      style={{ background: dm.surface }}>
                      <h2 className="text-xs font-black" style={{ color: dm.text }}>Informações adicionais</h2>

                      {/* Faixa de preço */}
                      {localDetails.priceRange && (() => {
                        const pr = PRICE_MAP[localDetails.priceRange!] ?? {
                          label: localDetails.priceRange,
                          description: '',
                        };
                        return (
                          <div className="pt-2.5 border-t" style={{ borderColor: dm.border }}>
                            <p className="text-[10px] font-semibold mb-1.5" style={{ color: dm.muted }}>Faixa de preço</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                                style={{ background: isDark ? 'rgba(251,191,36,0.12)' : '#FEF9C3' }}>
                                <DollarSign size={12} style={{ color: '#D97706' }} strokeWidth={2.5} />
                                <span className="text-xs font-black" style={{ color: '#D97706' }}>{pr.label}</span>
                              </div>
                              {pr.description && (
                                <span className="text-xs font-semibold" style={{ color: dm.text2 }}>
                                  {pr.description}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Comodidades */}
                      {localDetails.amenities && localDetails.amenities.length > 0 && (
                        <div className="pt-2.5 border-t" style={{ borderColor: dm.border }}>
                          <p className="text-[10px] font-semibold mb-1.5" style={{ color: dm.muted }}>Comodidades</p>
                          <div className="flex flex-wrap gap-1.5">
                            {localDetails.amenities.map((amenityId, i) => {
                              const meta = AMENITY_MAP[amenityId] ?? { label: amenityId, icon: <Check size={12} strokeWidth={2} /> };
                              return (
                                <span key={i}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold"
                                  style={{ background: dm.chip, color: dm.text2 }}>
                                  <span style={{ color: '#2BB5C8' }}>{meta.icon}</span>
                                  {meta.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── E. Horário de funcionamento ── */}
                  {localDetails.hours && Object.keys(localDetails.hours).length > 0 && (
                    <div className="rounded-2xl p-3.5 shadow-sm text-left"
                      style={{ background: dm.surface }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={13} style={{ color: '#1B5E3B' }} strokeWidth={2} />
                        <h2 className="text-xs font-black" style={{ color: dm.text }}>Horário de funcionamento</h2>
                      </div>
                      <div className="space-y-1">
                        {DAYS_ORDER
                          .filter(day => localDetails.hours?.[day] !== undefined)
                          .map(day => {
                            const info = localDetails.hours![day];
                            return (
                              <div key={day} className="flex items-center justify-between py-1 border-b last:border-0"
                                style={{ borderColor: dm.border }}>
                                <span className="text-xs font-semibold" style={{ color: dm.text2 }}>
                                  {DAYS_PT[day] ?? day}
                                </span>
                                <span className="text-xs font-bold" style={{ color: info?.closed ? '#EF4444' : dm.text }}>
                                  {info?.closed
                                    ? 'Encerrado'
                                    : (info?.open && info?.close)
                                      ? `${info.open} – ${info.close}`
                                      : 'Aberto'}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* ── F. Contactos ── */}
                  {localDetails.contact && (
                    localDetails.contact.phone || localDetails.contact.whatsapp ||
                    localDetails.contact.email || localDetails.contact.website
                  ) && (
                    <div className="rounded-2xl p-3.5 shadow-sm text-left"
                      style={{ background: dm.surface }}>
                      <h2 className="text-xs font-black mb-2" style={{ color: dm.text }}>Contactos</h2>
                      <div className="space-y-2">

                        {localDetails.contact.phone && (
                          <ContactRow
                            href={`tel:${localDetails.contact.phone.replace(/\s/g, '')}`}
                            icon={<Phone size={14} strokeWidth={2} />}
                            label={localDetails.contact.phone}
                            color="#1B5E3B"
                            dm={dm}
                          />
                        )}

                        {localDetails.contact.whatsapp && (
                          <ContactRow
                            href={`https://wa.me/${normalizeWhatsApp(localDetails.contact.whatsapp)}`}
                            icon={<MessageCircle size={14} strokeWidth={2} />}
                            label={localDetails.contact.whatsapp}
                            color="#25D366"
                            dm={dm}
                            external
                          />
                        )}

                        {localDetails.contact.email && (
                          <ContactRow
                            href={`mailto:${localDetails.contact.email}`}
                            icon={<Mail size={14} strokeWidth={2} />}
                            label={localDetails.contact.email}
                            color="#0077B6"
                            dm={dm}
                          />
                        )}

                        {localDetails.contact.website && (
                          <ContactRow
                            href={localDetails.contact.website.startsWith('http')
                              ? localDetails.contact.website
                              : `https://${localDetails.contact.website}`}
                            icon={<Globe size={14} strokeWidth={2} />}
                            label={localDetails.contact.website.replace(/^https?:\/\//, '')}
                            color="#7B5EA7"
                            dm={dm}
                            external
                          />
                        )}

                      </div>
                    </div>
                  )}

                  {/* ── Serviços próximos ── */}
                  <div className="rounded-2xl p-3.5 shadow-sm text-left"
                    style={{ background: dm.surface }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-sm font-black" style={{ color: dm.text }}>Serviços locais em destaque</h2>
                        <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>
                          {localDetails.distrito
                            ? `Próximos a ${localDetails.distrito}`
                            : localDetails.provincia
                              ? `Em ${localDetails.provincia}`
                              : 'Serviços disponíveis'}
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
                                <span className="text-[10px] font-black text-white">
                                  {service.rating > 0 ? service.rating.toFixed(1) : 'Novo'}
                                </span>
                                {service.reviewsCount > 0 && (
                                  <span className="text-[9px] text-white/80">({service.reviewsCount})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {nearbyServices.length === 0 && (
                        <p className="col-span-2 text-xs text-center py-4" style={{ color: dm.muted }}>
                          Sem serviços disponíveis nesta área.
                        </p>
                      )}
                    </div>
                  </div>

                </div>
                {/* ════════ FIM COLUNA ESQUERDA ════════ */}

                {/* ════════ COLUNA DIREITA ════════ */}
                <div className="space-y-3">

                  {/* Sistema de Avaliações */}
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
                    <p className="text-white/75 text-xs mb-3 leading-snug">Clica para ver a rota até lá.</p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                      onClick={() => {
                        const url = localDetails.lat && localDetails.lng
                          ? `https://www.google.com/maps/dir/?api=1&destination=${localDetails.lat},${localDetails.lng}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${localDetails.name} ${localDetails.provincia} Moçambique`
                            )}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs"
                      style={{ background: 'white', color: '#1B5E3B' }}
                    >
                      <Navigation size={14} strokeWidth={2.5} />
                      Como chegar
                    </motion.button>
                  </div>

                </div>
                {/* ════════ FIM COLUNA DIREITA ════════ */}
              </>
            )}

          </div>
        </motion.div>
      )}
    </>
  );
}

// ─── Sub-componentes auxiliares ───────────────────────────────────────────────

interface DM {
  surface: string; border: string; text: string; text2: string; muted: string;
}

/** Linha de informação com ícone + label + conteúdo */
function InfoRow({
  icon, label, children, dm,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  dm: DM;
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

/** Linha de contacto clicável */
function ContactRow({
  href, icon, label, color, dm, external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  dm: DM;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all active:opacity-70"
      style={{ background: `${color}12`, textDecoration: 'none' }}
    >
      <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color}20`, color }}>
        {icon}
      </span>
      <span className="text-xs font-semibold truncate" style={{ color: dm.text2 }}>{label}</span>
      <svg className="ml-auto flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
      </svg>
    </a>
  );
}
