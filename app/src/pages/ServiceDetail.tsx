import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE, extractImages, resolveUserType } from '@/utils/dataValidation';
import { translateServiceCategory, translateUserType } from '@/utils/translations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import {
  ChevronLeft, MapPin, Star, Heart, Share2,
  Phone, MessageSquare, Mail, Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import GalleryCarousel from '@/components/GalleryCarousel';
import ImageCarousel from '@/components/ImageCarousel';
import LocationCard from '@/components/shared/LocationCard';
import { fromApi, hasLocation } from '@/utils/normalizeLocation';
import ReviewManager from '@/components/ReviewManager';
import { servicesApi, reviewsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useSuggest } from '@/hooks/useSuggest';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  provincia: string;
  distrito: string;
  endereco: string;
  country?: string;
  province?: string;
  district?: string;
  administrative_post?: string;
  locality?: string;
  nearby_reference?: string;
  city?: string;
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
  telefone: string;
  whatsapp: string;
  email: string;
  horario: string;
  rating: number;
  reviewsCount?: number;
  image: string;
  images?: string[];
  lat?: number;
  lng?: number;
  contributor?: {
    id?: string;
    name: string;
    type?: string;
    avatar?: string;
  };
  // Campos novos do formulário
  subcategory?: string;
  pricing?: {
    type: 'fixed' | 'variable' | 'free';
    amount?: number;
    currency?: string;
    details?: string;
  } | null;
  availability?: {
    isAvailable?: boolean;
    advanceBooking?: number;
  } | null;
  features?: string[];
  requirements?: string[];
}

export type ServiceData = Service;

interface ServiceDetailProps {
  service: Service;
  onBack: () => void;
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ServiceDetail({ service, onBack, onAuthorPress }: ServiceDetailProps) {
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
    input:   isDark ? '#22263A' : '#F8FAFC',
  };

  const [galleryPaused, setGalleryPaused] = useState(false);
  const [reviewCount, setReviewCount] = useState(service.reviewsCount || 0);
  const [avgRating, setAvgRating] = useState(service.rating || 0);

  // Estado para dados completos do serviço da API
  const [serviceDetails, setServiceDetails] = useState<Service>(service);
  // Sugerir = seguir o perfil do provider — POST /api/users/{id}/follow/ (OpenAPI)
  // O provider ID é carregado de serviceDetails.contributor.id (preenchido via raw.provider.id)
  const providerIdRef = serviceDetails.contributor?.id ?? service.contributor?.id ?? '';
  const { isSuggested, isLoading: isSuggestLoading, toggle: toggleSuggest, errorMessage: suggestError, isSelf: isSuggestSelf } =
    useSuggest(providerIdRef || null, false, user?.id);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  // Reviews embutidas vindas do ServiceDetail — campo obrigatório do schema
  const [serviceReviews, setServiceReviews] = useState<any[]>([]);

  const typeColors: Record<string, string> = { guide: '#F4821F', curator: '#F4821F', traveler: '#2BB5C8', tourist: '#2BB5C8', resident: '#1B5E3B', local_resident: '#1B5E3B', business: '#7B5EA7', local_business: '#7B5EA7' };
  const typeBg: Record<string, string>     = { guide: '#FFF3E0', curator: '#FFF3E0', traveler: '#E0F7FA', tourist: '#E0F7FA', resident: '#EEF7F0', local_resident: '#EEF7F0', business: '#F3E8FF', local_business: '#F3E8FF' };

  // Carregar detalhes completos do serviço da API
  useEffect(() => {
    const loadServiceDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const { data, error } = await servicesApi.get(service.id);

        if (error) {
          console.error('[ServiceDetail] Erro da API:', error);
        }

        if (data && !error) {
          // Extrair dados da resposta — tentar todas as estruturas possíveis da API
          const raw = data?.service ?? data?.data ?? data;

          const apiImages = extractImages(raw);

          const mappedData: Service = {
            ...service,
            name:        raw.title        ?? raw.name        ?? service.name,
            description: raw.description  ?? service.description,
            category:    raw.category ? translateServiceCategory(raw.category) : service.category,
            telefone:    raw.phone        ?? raw.contact?.phone     ?? raw.telefone    ?? service.telefone,
            whatsapp:    raw.whatsapp     ?? raw.contact?.whatsapp  ?? service.whatsapp,
            email:       raw.contact_email ?? raw.contact?.email   ?? raw.email        ?? service.email,
            horario:     raw.schedule     ?? raw.availability?.schedule ?? raw.horario ?? service.horario,
            rating:      parseFloat(raw.rating?.average ?? raw.rating ?? service.rating),
            reviewsCount: raw.rating?.count ?? raw.reviews_count ?? raw.reviewsCount ?? service.reviewsCount,
            image:       apiImages[0] ?? service.image,
            images:      apiImages.length > 0 ? apiImages : (service.images ?? []),
            location:    raw.location     ?? service.location,
            lat:         raw.location?.latitude  ?? raw.lat ?? service.lat,
            lng:         raw.location?.longitude ?? raw.lng ?? service.lng,
            provincia:   (raw.location?.province    ?? raw.province   ?? service.provincia) || '',
            distrito:    (raw.location?.municipality ?? raw.location?.district ?? raw.district ?? service.distrito) || '',
            administrative_post: (raw.location?.administrative_post ?? service.administrative_post ?? '') || '',
            locality:    (raw.location?.locality ?? raw.location?.city ?? service.locality ?? '') || '',
            endereco:    (raw.location?.address  ?? raw.address ?? service.endereco ?? '') || '',
            contributor: (raw.provider || raw.author || raw.contributor || raw.created_by || raw.owner) ? {
              id:     String(raw.provider?.id   || raw.author?.id   || raw.contributor?.id   || raw.owner?.id   || ''),
              name:   raw.provider?.name         || raw.author?.name || raw.contributor?.name || raw.owner?.name || 'Prestador',
              avatar: raw.provider?.avatar       || raw.author?.avatar || raw.contributor?.avatar || raw.owner?.avatar,
              type:   resolveUserType(raw.provider?.role || raw.provider?.type || raw.author?.type || raw.contributor?.type || raw.owner?.role || raw.owner?.type),
            } : service.contributor,
            // ── Campos novos ───────────────────────────────────────────────
            subcategory: raw.subcategory ?? service.subcategory,
            pricing: (() => {
              const p = raw.pricing;
              if (!p) return service.pricing ?? null;
              if (typeof p === 'string') {
                try { return JSON.parse(p); } catch { return null; }
              }
              return p;
            })(),
            availability: (() => {
              const a = raw.availability;
              if (!a) return service.availability ?? null;
              if (typeof a === 'string') {
                try { return JSON.parse(a); } catch { return null; }
              }
              return a;
            })(),
            features: (() => {
              const f = raw.features;
              if (!f) return service.features ?? [];
              if (typeof f === 'string') {
                try { return JSON.parse(f); } catch { return []; }
              }
              return Array.isArray(f) ? f : [];
            })(),
            requirements: (() => {
              const r = raw.requirements;
              if (!r) return service.requirements ?? [];
              if (typeof r === 'string') {
                try { return JSON.parse(r); } catch { return []; }
              }
              return Array.isArray(r) ? r : [];
            })(),
          };

          setServiceDetails(mappedData);
          setAvgRating(mappedData.rating);
          setReviewCount(mappedData.reviewsCount ?? 0);

          // ── Carregar reviews ───────────────────────────────────────────────
          // Estratégia dupla conforme openapi-schema(3).yaml:
          //   1. raw.reviews — campo obrigatório do ServiceDetail embutido
          //   2. GET /api/services/{id}/reviews/ — endpoint dedicado como fallback

          const embedded: any[] = Array.isArray(raw.reviews) ? raw.reviews : [];

          let fromEndpoint: any[] = [];
          try {
            const revResp = await reviewsApi.getForService(raw.id || service.id);
            if (!revResp.error && revResp.data) {
              const d = revResp.data as any;
              if      (Array.isArray(d))          fromEndpoint = d;
              else if (Array.isArray(d.reviews))  fromEndpoint = d.reviews;
              else if (Array.isArray(d.results))  fromEndpoint = d.results;
              else if (Array.isArray(d.data))     fromEndpoint = d.data;
            }
          } catch { /* silencioso */ }

          const best = fromEndpoint.length >= embedded.length ? fromEndpoint : embedded;
          console.log(`[ServiceDetail] reviews — embutidas: ${embedded.length}, endpoint: ${fromEndpoint.length}, a usar: ${best.length}`);
          setServiceReviews(best);
        }
      } catch (error) {
        console.error('[ServiceDetail] Erro ao carregar detalhes do serviço:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadServiceDetails();
  }, [service.id]);

  return (
    <motion.div className="pb-16"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>

      {/* ── CONTEÚDO — mobile: stack | desktop: 2 colunas ── */}
      <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-6 md:pt-6 px-4 pt-3 space-y-3 md:space-y-0">

        {/* GALERIA — ocupa as 2 colunas, alinhada com o conteúdo */}
        <div
          className="md:col-span-2 -mx-4 md:mx-0"
        >
          <div className="relative w-full overflow-hidden md:rounded-2xl"
            style={{ height: 'clamp(270px, 30vw, 370px)' }}>
            <GalleryCarousel
              images={serviceDetails.images && serviceDetails.images.length > 0 ? serviceDetails.images : [serviceDetails.image || PLACEHOLDER_IMAGE]}
              alt={serviceDetails.name}
            >
              {/* Top bar — z-30 */}
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
                      id: serviceDetails.id,
                      type: 'service',
                      name: serviceDetails.name,
                      image: serviceDetails.image || PLACEHOLDER_IMAGE,
                      tag: serviceDetails.category,
                      rating: serviceDetails.rating,
                      provincia: serviceDetails.provincia,
                      distrito: serviceDetails.distrito,
                      raw: serviceDetails,
                    })}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: isFavorite(serviceDetails.id) ? '#0EA5E9' : 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                    <Heart size={16} fill={isFavorite(serviceDetails.id) ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                  </motion.button>
                </div>
              </div>

              {/* Bottom info — z-30 */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4" style={{ zIndex: 3 }}>
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-white/70" />
                      <span className="text-white/80 text-xs">{serviceDetails.provincia}</span>
                    </div>
                    <span className="text-white/40">·</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} fill="#FBBF24" stroke="none" />
                      <span className="text-white font-black text-xs">{avgRating}</span>
                      <span className="text-white/60 text-[10px]">({reviewCount})</span>
                    </div>
                  </div>
                  {!isSuggestSelf && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleSuggest}
                    disabled={isSuggestLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                    style={{ background: isSuggested ? 'rgba(27,94,59,0.9)' : 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                    title={suggestError ?? undefined}
                    aria-label={isSuggested ? 'Sugerido' : 'Sugerir perfil do autor'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ opacity: isSuggestLoading ? 0.5 : 1 }}>
                      <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
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

        {/* ── Coluna esquerda ── */}
        <div className="space-y-3">

          {/* Nome + categoria */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black" style={{ color: '#1A1A1A' }}>{serviceDetails.name}</h1>
            {serviceDetails.category && (
              <span className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0 ml-2"
                style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                {serviceDetails.category}
              </span>
            )}
          </div>

          {/* Contribuidor — só aparece se existir */}
          {serviceDetails.contributor && (() => {
            const c = serviceDetails.contributor!;
            const name   = c.name;
            const avatar = c.avatar;
            const type   = c.type || 'business';
            const color  = typeColors[type] || '#7B5EA7';
            const bg     = typeBg[type]     || '#F3E8FF';
            const hasId  = !!c.id;
            return (
              <button
                className="flex items-center gap-2 w-full text-left"
                onClick={() => { if (hasId && onAuthorPress) onAuthorPress({ id: c.id!, name, avatar, type }); }}
                style={{ cursor: hasId && onAuthorPress ? 'pointer' : 'default' }}
                aria-label={hasId && onAuthorPress ? `Ver perfil de ${name}` : undefined}
              >
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
              </button>
            );
          })()}

          {/* Sobre este serviço */}
          <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
            style={{ background: dm.surface }}>
            <h2 className="text-xs font-black" style={{ color: dm.text }}>Sobre este serviço</h2>

            {/* Categoria */}
            <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: dm.muted }}>Categoria</p>
              <p className="text-xs font-bold" style={{ color: dm.text }}>
                {serviceDetails.category || 'Serviço local'}
              </p>
            </div>

            {/* Horário */}
            {serviceDetails.horario && serviceDetails.horario !== 'Consultar' && (
              <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: dm.muted }}>Horário</p>
                <p className="text-xs font-bold" style={{ color: '#1B5E3B' }}>
                  <Clock size={11} className="inline mr-1" />
                  {serviceDetails.horario}
                </p>
              </div>
            )}

            {/* Descrição */}
            <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: dm.muted }}>Descrição</p>
              <p className="text-sm leading-relaxed text-justify" style={{ color: dm.text2 }}>
                {serviceDetails.description || 'Informações sobre este serviço em breve.'}
              </p>
            </div>

            {/* Localização — hierarquia completa via modelo canónico */}
            {(() => {
              const loc = fromApi(serviceDetails);
              return hasLocation(loc) ? (
                <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                  <LocationCard
                    size="sm"
                    data={loc}
                    showMap
                    publicationName={serviceDetails.name}
                  />
                </div>
              ) : null;
            })()}

          </div>

          {/* ── Preçário ─────────────────────────────────────────────────── */}
          {serviceDetails.pricing && (
            <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
              style={{ background: dm.surface }}>
              <h2 className="text-xs font-black" style={{ color: dm.text }}>Preçário</h2>
              <div className="pt-2 border-t flex flex-col gap-2.5" style={{ borderColor: dm.border }}>

                {/* Tipo de preço */}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>Tipo de preço</p>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full"
                    style={{
                      background: serviceDetails.pricing.type === 'fixed'    ? '#EEF7F0'
                                : serviceDetails.pricing.type === 'variable' ? '#EFF8FF'
                                : '#F0FDF4',
                      color:      serviceDetails.pricing.type === 'fixed'    ? '#1B5E3B'
                                : serviceDetails.pricing.type === 'variable' ? '#0077B6'
                                : '#16A34A',
                    }}>
                    {serviceDetails.pricing.type === 'fixed'    ? 'Preço fixo'
                   : serviceDetails.pricing.type === 'variable' ? 'Variável'
                   : 'Gratuito'}
                  </span>
                </div>

                {/* Valor */}
                {serviceDetails.pricing.type !== 'free' && serviceDetails.pricing.amount != null && serviceDetails.pricing.amount > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>Valor</p>
                    <p className="text-sm font-black" style={{ color: dm.text }}>
                      {serviceDetails.pricing.amount.toLocaleString('pt-MZ')}
                      <span className="text-xs font-bold ml-1" style={{ color: dm.muted }}>
                        {serviceDetails.pricing.currency ?? 'MZN'}
                      </span>
                    </p>
                  </div>
                )}

                {/* Detalhes */}
                {serviceDetails.pricing.details && (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[10px] font-semibold flex-shrink-0" style={{ color: dm.muted }}>Detalhes</p>
                    <p className="text-xs font-bold text-right" style={{ color: dm.text2 }}>
                      {serviceDetails.pricing.details}
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ── Disponibilidade ───────────────────────────────────────────── */}
          {serviceDetails.availability && (
            <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
              style={{ background: dm.surface }}>
              <h2 className="text-xs font-black" style={{ color: dm.text }}>Disponibilidade</h2>
              <div className="pt-2 border-t flex flex-col gap-2.5" style={{ borderColor: dm.border }}>

                {/* Estado */}
                {serviceDetails.availability.isAvailable != null && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>Estado</p>
                    <span className="flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-full"
                      style={{
                        background: serviceDetails.availability.isAvailable ? '#EEF7F0' : '#F3F4F6',
                        color:      serviceDetails.availability.isAvailable ? '#1B5E3B' : '#6B7280',
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ background: serviceDetails.availability.isAvailable ? '#1B5E3B' : '#9CA3AF' }} />
                      {serviceDetails.availability.isAvailable ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                )}

                {/* Antecedência mínima */}
                {serviceDetails.availability.advanceBooking != null && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>Reserva mínima</p>
                    <p className="text-xs font-bold" style={{ color: dm.text }}>
                      {serviceDetails.availability.advanceBooking === 0
                        ? 'Sem antecedência mínima'
                        : `${serviceDetails.availability.advanceBooking} dia(s) antes`}
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ── Características ───────────────────────────────────────────── */}
          {serviceDetails.features && serviceDetails.features.length > 0 && (
            <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
              style={{ background: dm.surface }}>
              <h2 className="text-xs font-black" style={{ color: dm.text }}>Características incluídas</h2>
              <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {serviceDetails.features.map(f => (
                    <span key={f}
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Requisitos ────────────────────────────────────────────────── */}
          {serviceDetails.requirements && serviceDetails.requirements.length > 0 && (
            <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
              style={{ background: dm.surface }}>
              <h2 className="text-xs font-black" style={{ color: dm.text }}>Requisitos para o cliente</h2>
              <div className="pt-2 border-t" style={{ borderColor: dm.border }}>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {serviceDetails.requirements.map(r => (
                    <span key={r}
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#F3EEFB', color: '#7B5EA7' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contactos */}
          {(serviceDetails.telefone || serviceDetails.whatsapp || serviceDetails.email) && (
            <div className="rounded-2xl p-3.5 shadow-sm text-left space-y-3"
              style={{ background: dm.surface }}>
              <h2 className="text-xs font-black" style={{ color: dm.text }}>Contacto</h2>
              <div className="pt-2 border-t flex flex-col gap-3" style={{ borderColor: dm.border }}>

                {serviceDetails.telefone && (
                  <a href={`tel:${serviceDetails.telefone}`}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: dm.input }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: isDark ? 'rgba(74,222,128,0.12)' : '#EEF7F0' }}>
                      <Phone size={16} style={{ color: '#1B5E3B' }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>Telefone</p>
                      <p className="text-sm font-black" style={{ color: dm.text }}>{serviceDetails.telefone}</p>
                    </div>
                  </a>
                )}

                {serviceDetails.whatsapp && (
                  <a href={`https://wa.me/${serviceDetails.whatsapp.replace(/\D/g, '')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: dm.input }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#E8F5E9' }}>
                      <MessageSquare size={16} style={{ color: '#25D366' }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>WhatsApp</p>
                      <p className="text-sm font-black" style={{ color: dm.text }}>{serviceDetails.whatsapp}</p>
                    </div>
                  </a>
                )}

                {serviceDetails.email && (
                  <a href={`mailto:${serviceDetails.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: dm.input }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF' }}>
                      <Mail size={16} style={{ color: '#2563EB' }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: dm.muted }}>Email</p>
                      <p className="text-sm font-black" style={{ color: dm.text }}>{serviceDetails.email}</p>
                    </div>
                  </a>
                )}

              </div>
            </div>
          )}

        </div>

        {/* ── Coluna direita ── */}
        <div className="space-y-3">

          {/* Sistema de Avaliações - ReviewManager */}
          <ReviewManager
            key={serviceDetails.id}
            resourceType="service"
            resourceId={serviceDetails.id}
            initialReviews={serviceReviews}
            showCreateForm={true}
            onReviewsUpdated={() => {}}
          />

          {/* Como chegar */}
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }}>
            <p className="text-white font-black text-sm mb-0.5">Quer visitar este serviço?</p>
            <p className="text-white/75 text-xs mb-3 leading-snug">Clica para ver a rota até lá.</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              onClick={() => {
                const url = serviceDetails.lat && serviceDetails.lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${serviceDetails.lat},${serviceDetails.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(serviceDetails.name + ' ' + serviceDetails.provincia + ' Moçambique')}`;
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
  );
}