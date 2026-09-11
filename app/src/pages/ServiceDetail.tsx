import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Star, Heart, Share2, Phone, MessageSquare, Mail, Clock, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import ImageCarousel from '@/components/ImageCarousel';
import ReviewManager from '@/components/ReviewManager';
import { usersApi, reviewsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';
import LocationCard from '@/components/shared/LocationCard';
import { fromApi, hasLocation } from '@/utils/normalizeLocation';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  // Campos de localização (hierarquia completa)
  provincia: string;
  distrito: string;
  endereco: string;
  // Campos adicionais que a API pode devolver
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
    type: 'guide' | 'traveler' | 'resident' | 'business';
  };
}

interface ProviderProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  joinedAt?: string;
  type: 'guide' | 'traveler' | 'resident' | 'business';
  isFollowing: boolean;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    servicesCount: number;
    localsCount: number;
  };
}

// Export para uso em outros arquivos
export type ServiceData = Service;

interface ServiceDetailProps {
  service: Service;
  onBack: () => void;
}

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size}
          fill={value >= s ? '#FBBF24' : 'none'}
          stroke={value >= s ? '#FBBF24' : '#D1D5DB'}
          strokeWidth={1.5} />
      ))}
    </div>
  );
}

export default function ServiceDetail({
  service, onBack }: ServiceDetailProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Provider profile modal states
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);
  const [isFollowingProvider, setIsFollowingProvider] = useState(false);

  // Reviews count � busca da API para mostrar formato "4.33 (3)"
  const [reviewsCount, setReviewsCount] = useState<number>(service.reviewsCount ?? 0);

  // Estado do bot�o Sugerir
  const [suggested, setSuggested] = useState(false);
  const [galleryPaused, setGalleryPaused] = useState(false);

  // Carregar contagem de reviews via API
  useEffect(() => {
    const loadReviewsCount = async () => {
      try {
        const { data } = await reviewsApi.getForService(service.id, { limit: 1 });
        if (data) {
          const count =
            data.pagination?.totalItems ??
            data.total ??
            data.count ??
            (Array.isArray(data.reviews) ? data.reviews.length : 0) ??
            0;
          setReviewsCount(count);
        }
      } catch { /* mant�m valor inicial */ }
    };
    loadReviewsCount();
  }, [service.id]);

  // Carregar perfil do provedor
  useEffect(() => {
    if (!service.contributor?.id) return;
    const load = async () => {
      setIsLoadingProvider(true);
      try {
        const { data, error } = await usersApi.getPublicProfile(service.contributor!.id!);
        if (error || !data?.user) {
          console.warn('Erro ao carregar perfil do provedor:', error);
          return;
        }
        const u = data.user;
        setProviderProfile({
          id: String(u.id || service.contributor!.id!),
          name: u.name || service.contributor!.name,
          avatar: u.avatar,
          bio: u.bio,
          joinedAt: u.joinedAt,
          type: service.contributor!.type,
          isFollowing: u.isFollowing ?? false,
          stats: {
            postsCount: u.stats?.postsCount ?? 0,
            followersCount: u.stats?.followersCount ?? 0,
            followingCount: u.stats?.followingCount ?? 0,
            servicesCount: u.stats?.servicesCount ?? 0,
            localsCount: u.stats?.localsCount ?? 0,
          },
        });
        setIsFollowingProvider(u.isFollowing ?? false);
      } catch (err) {
        console.warn('Erro ao carregar perfil do provedor:', err);
      } finally {
        setIsLoadingProvider(false);
      }
    };
    load();
  }, [service.contributor?.id, service.contributor?.name, service.contributor?.type]);

  const handleToggleFollowProvider = async () => {
    if (!providerProfile || isFollowingProvider === undefined) return;

    const willFollow = !isFollowingProvider;
    setIsFollowingProvider(willFollow);

    // Optimistic update
    setProviderProfile(prev => prev ? {
      ...prev,
      isFollowing: willFollow,
      stats: {
        ...prev.stats,
        followersCount: prev.stats.followersCount + (willFollow ? 1 : -1),
      },
    } : prev);

    try {
      const { data, error } = willFollow
        ? await usersApi.follow(providerProfile.id)
        : await usersApi.unfollow(providerProfile.id);

      if (error || !data) {
        // Reverter em caso de erro
        setIsFollowingProvider(!willFollow);
        setProviderProfile(prev => prev ? {
          ...prev,
          isFollowing: !willFollow,
          stats: {
            ...prev.stats,
            followersCount: prev.stats.followersCount + (willFollow ? -1 : 1),
          },
        } : prev);
        return;
      }

      // Confirmar com o estado real da API
      setIsFollowingProvider(data.isFollowing);
      setProviderProfile(prev => prev ? {
        ...prev,
        isFollowing: data.isFollowing,
      } : prev);

    } catch (err) {
      console.error('Erro ao seguir/deixar de seguir:', err);
      // Reverter otimista
      setIsFollowingProvider(!willFollow);
      setProviderProfile(prev => prev ? {
        ...prev,
        isFollowing: !willFollow,
        stats: {
          ...prev.stats,
          followersCount: prev.stats.followersCount + (willFollow ? -1 : 1),
        },
      } : prev);
    }
  };

  return (
    <motion.div className="pb-16"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>

      {/* -- CONTE�DO � mobile: stack | desktop: 2 colunas ------------------- */}
      <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-6 md:pt-6 px-4 pt-3 space-y-3 md:space-y-0">

        {/* GALERIA � ocupa as 2 colunas, alinhada com o conte�do */}
        <div
          className="md:col-span-2 -mx-4 md:mx-0"
          onMouseEnter={() => setGalleryPaused(true)}
          onMouseLeave={() => setGalleryPaused(false)}
        >
          <div className="relative w-full overflow-hidden md:rounded-2xl"
            style={{ height: 'clamp(270px, 30vw, 370px)' }}>
            {service.images && service.images.length > 1 ? (
              <ImageCarousel images={service.images} autoPlay={true} interval={3000} showControls={true} showDots={true} className="w-full h-full" objectFit="cover" paused={galleryPaused} />
            ) : (
              <img src={service.image} alt={service.name} className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = service.image; }} />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-5">
              <button onClick={onBack}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                  <Share2 size={16} className="text-white" strokeWidth={2} />
                </button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleFavorite({
                    id: service.id,
                    type: 'service',
                    name: service.name,
                    image: service.image,
                    tag: service.category,
                    rating: service.rating,
                    provincia: service.provincia,
                    distrito: service.distrito,
                    raw: service,
                  })}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: isFavorite(service.id) ? '#0EA5E9' : 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                  <Heart size={16} fill={isFavorite(service.id) ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                </motion.button>
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-white/70" />
                      <span className="text-white/80 text-xs">{service.provincia}</span>
                    </div>
                    <span className="text-white/40">�</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} fill="#FBBF24" stroke="none" />
                      <span className="text-white font-black text-xs">{service.rating?.toFixed(2) || '0.0'}</span>
                      {reviewsCount > 0 && (
                        <span className="text-white/70 text-[10px]">({reviewsCount})</span>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    const title = service.name;
                    const text  = `${service.name} � ${service.category || ''} em ${service.provincia || 'Mo�ambique'}\nDescobre mais em Txopela Tour!`;
                    const url   = window.location.origin;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title, text, url });
                      } else {
                        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                      }
                      setSuggested(true);
                      setTimeout(() => setSuggested(false), 2000);
                    } catch { /* utilizador cancelou */ }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold transition-colors"
                  style={{ background: suggested ? 'rgba(27,94,59,0.9)' : 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                  </svg>
                  <span>{suggested ? 'Sugerido!' : 'Sugerir'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna esquerda */}
        <div className="space-y-3">
          {/* Nome */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black" style={{ color: '#1A1A1A' }}>{service.name}</h1>
            <span className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0 ml-2"
              style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
              {service.category}
            </span>
          </div>

          {/* Contributor profile */}
          {service.contributor && (() => {
            const c = service.contributor;
            const typeColors: Record<string, string> = {
              guide: '#F4821F', traveler: '#2BB5C8', resident: '#1B5E3B', business: '#7B5EA7',
            };
            const typeBg: Record<string, string> = {
              guide: '#FFF3E0', traveler: '#E0F7FA', resident: '#EEF7F0', business: '#F3E8FF',
            };
            const typeLabels: Record<string, string> = {
              guide: 'Guia', traveler: 'Viajante', resident: 'Residente', business: 'Neg�cio',
            };
            const color = c.type ? (typeColors[c.type] || '#6B7280') : '#6B7280';
            return (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProviderModal(true)}
                className="flex items-center gap-2 w-full text-left"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${color}, #2BB5C8)` }}
                >
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black leading-none text-left" style={{ color: '#1A1A1A' }}>{c.name}</p>
                </div>
                {c.type && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: typeBg[c.type] || '#F3F4F6', color }}>
                    {typeLabels[c.type] || c.type}
                  </span>
                )}
              </motion.button>
            );
          })()}

          {/* Sobre este servi�o */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm text-left space-y-3">
            <h2 className="text-xs font-black" style={{ color: '#1A1A1A' }}>Sobre este servi�o</h2>

            {/* Tipo de servi�o */}
            <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>Tipo de servi�o</p>
              <p className="text-xs font-bold" style={{ color: '#0F172A' }}>{service.category || 'N�o informado'}</p>
            </div>

            {/* Descri��o */}
            {service.description && (
              <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>Descri��o</p>
                <p className="text-sm leading-relaxed text-justify" style={{ color: '#374151' }}>{service.description}</p>
              </div>
            )}

            {/* Pre�o */}
            {(service as any).preco && (
              <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>Pre�o</p>
                <p className="text-xs font-bold" style={{ color: '#1B5E3B' }}>{(service as any).preco}</p>
              </div>
            )}
          </div>

          {/* Localização — hierarquia completa via modelo canónico */}
          {(() => {
            const loc = fromApi(service);
            return hasLocation(loc) ? (
              <LocationCard
                data={loc}
                showMap
                publicationName={service.name}
              />
            ) : null;
          })()}

          {/* Hor�rio de funcionamento */}
          {service.horario && service.horario !== 'Consultar' && (
          <div className="bg-white rounded-2xl p-3.5 shadow-sm text-left">
            <h2 className="text-xs font-black mb-2.5" style={{ color: '#1A1A1A' }}>Hor�rio de funcionamento</h2>
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: '#1B5E3B' }} />
              <p className="text-xs font-bold" style={{ color: '#0F172A' }}>{service.horario}</p>
            </div>
          </div>
          )}

          {/* Contacto */}
          {(service.telefone || service.whatsapp || service.email) && (
          <div className="bg-white rounded-2xl p-3.5 shadow-sm text-left space-y-3">
            <h2 className="text-xs font-black" style={{ color: '#1A1A1A' }}>Contacto</h2>

            {service.telefone && (
              <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#94A3B8' }}>Telefone</p>
                <a href={`tel:${service.telefone}`} className="flex items-center gap-2">
                  <Phone size={14} style={{ color: '#1B5E3B' }} />
                  <p className="text-xs font-bold" style={{ color: '#0F172A' }}>{service.telefone}</p>
                </a>
              </div>
            )}

            {service.whatsapp && (
              <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#94A3B8' }}>WhatsApp</p>
                <a href={`https://wa.me/${service.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2">
                  <MessageSquare size={14} style={{ color: '#1B5E3B' }} />
                  <p className="text-xs font-bold" style={{ color: '#0F172A' }}>{service.whatsapp}</p>
                </a>
              </div>
            )}

            {service.email && (
              <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#94A3B8' }}>Email</p>
                <a href={`mailto:${service.email}`} className="flex items-center gap-2">
                  <Mail size={14} style={{ color: '#1B5E3B' }} />
                  <p className="text-xs font-bold" style={{ color: '#0F172A' }}>{service.email}</p>
                </a>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-3">
          {/* Sistema de Avalia��es - ReviewManager */}
          <ReviewManager
            resourceType="service"
            resourceId={service.id}
            showCreateForm={true}
            onReviewsUpdated={async () => {
              // Atualizar contagem de reviews quando uma nova � adicionada/removida
              try {
                const { data } = await reviewsApi.getForService(service.id, { limit: 1 });
                if (data) {
                  const count =
                    data.pagination?.totalItems ??
                    data.total ??
                    data.count ??
                    (Array.isArray(data.reviews) ? data.reviews.length : 0) ??
                    0;
                  setReviewsCount(count);
                }
              } catch { /* silencioso */ }
            }}
          />

          {/* Como chegar */}
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }}>
            <p className="text-white font-black text-sm mb-0.5">Quer visitar este destino?</p>
            <p className="text-white/75 text-xs mb-3 leading-snug">
              Clica para ver a rota at� l�.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              onClick={() => {
                const url = service.lat && service.lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.name + ' ' + service.endereco + ' ' + service.provincia + ' Mo�ambique')}`;
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

      {/* -- MODAL: PERFIL DO PROVEDOR -------------------------------------- */}
      <AnimatePresence>
        {showProviderModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowProviderModal(false)} />

            <motion.div
              className="relative w-full bg-white rounded-t-3xl px-5 pt-4 pb-24"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Handle */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              {/* Close */}
              <button onClick={() => setShowProviderModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} className="text-gray-500" />
              </button>

              {isLoadingProvider || !providerProfile ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 animate-spin" style={{ borderTopColor: '#1B5E3B' }} />
                </div>
              ) : (
                <>
                  <h3 className="text-base font-black mb-4" style={{ color: '#1A1A1A' }}>Perfil do Provedor</h3>

                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2BB5C8, #1B5E3B)' }}
                    >
                      {providerProfile.avatar ? (
                        <img src={providerProfile.avatar} alt={providerProfile.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-white">
                          {providerProfile.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>{providerProfile.name}</p>
                      {providerProfile.type && (
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                          {providerProfile.type === 'guide' ? 'Guia Tur�stico' :
                           providerProfile.type === 'traveler' ? 'Viajante' :
                           providerProfile.type === 'resident' ? 'Morador Local' :
                           providerProfile.type === 'business' ? 'Neg�cio' :
                           providerProfile.type}
                        </p>
                      )}
                      {providerProfile.joinedAt && (
                        <p className="text-[10px]" style={{ color: '#6B7280' }}>
                          Membro desde {new Date(providerProfile.joinedAt).getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {providerProfile.bio && (
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: '#374151' }}>
                      {providerProfile.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>
                        {providerProfile.stats.postsCount}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>publica��es</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>
                        {providerProfile.stats.servicesCount}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>servi�os</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>
                        {providerProfile.stats.followersCount}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>seguidores</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>
                        {providerProfile.stats.localsCount}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>locais</p>
                    </div>
                  </div>

                  {/* Bot�es de ac��o */}
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleToggleFollowProvider}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all"
                      style={isFollowingProvider ? {
                        background: '#F3F4F6',
                        color: '#374151',
                        border: '1.5px solid #E5E7EB',
                      } : {
                        background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                        color: 'white',
                        boxShadow: '0 2px 12px rgba(15,76,42,0.25)',
                      }}
                    >
                      {isFollowingProvider ? 'A seguir' : 'Seguir'}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black"
                      style={{ background: '#F3F4F6', color: '#374151', border: '1.5px solid #E5E7EB' }}
                    >
                      Mensagem
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}