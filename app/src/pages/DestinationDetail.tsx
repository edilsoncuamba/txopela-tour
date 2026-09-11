import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE, extractImages, resolveUserType } from '@/utils/dataValidation';
import { motion } from 'framer-motion';
import {
  ChevronLeft, MapPin, Star, Heart, Share2,
  ChevronRight, Eye, Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import ImageCarousel from '@/components/ImageCarousel';
import ServiceDetail from './ServiceDetail';
import ServicesListing from './ServicesListing';
import LocationCard from '@/components/shared/LocationCard';
import { fromApi, hasLocation } from '@/utils/normalizeLocation';
import ReviewManager from '@/components/ReviewManager';
import { servicesApi, localsApi } from '@/services/api';
import { translateServiceCategory } from '@/utils/translations';
import { useScrollTop } from '@/hooks/useScrollTop';

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
  // Campos de localização completos (hierarquia oficial)
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
  // Destaques
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

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size}
          fill={value >= s ? '#FBBF24' : 'none'}
          stroke={value >= s ? '#FBBF24' : '#D1D5DB'}
          strokeWidth={1.5} />
      ))}
    </div>
  );
}

// InfoRow � linha de detalhe reutiliz�vel
function InfoRow({ icon, label, value, highlight = false }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#F8FAFC' }}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748B' }}>{label}</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-bold" style={{ color: highlight ? '#1B5E3B' : '#0F172A' }}>{value}</p>
      </div>
    </div>
  );
}

export default function DestinationDetail({
  destination, onBack, onExploreMore }: DestinationDetailProps) {
  useScrollTop();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [suggested, setSuggested]       = useState(false);
  const [galleryPaused, setGalleryPaused] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showServicesListing, setShowServicesListing] = useState(false);
  const [nearbyServices, setNearbyServices] = useState<any[]>([]);
  const [reviewCount, setReviewCount] = useState(destination.reviews || 0);
  const [avgRating, setAvgRating] = useState(destination.rating || 0);
  
  // Estado para dados completos do local da API
  const [localDetails, setLocalDetails] = useState<Destination>(destination);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Carregar detalhes completos do local da API
  useEffect(() => {
    const loadLocalDetails = async () => {
      setIsLoadingDetails(true);
      try {
        console.log('[DestinationDetail] Carregando detalhes para local ID:', destination.id);
        const { data, error } = await localsApi.get(destination.id);
        
        if (error) {
          console.error('[DestinationDetail] Erro da API:', error);
        }
        
        if (data && !error) {
          console.log('[DestinationDetail] Dados recebidos da API:', data);
          
          // Mapear dados da API para o formato do componente
          const mappedData: Destination = {
            ...destination, // Manter dados básicos como fallback
            // Sobrescrever com dados completos da API
            name: data.name || destination.name,
            desc: data.description || destination.desc,
            image: extractImages(data)[0] ?? destination.image,
            images: extractImages(data),
            rating: parseFloat(data.rating?.average ?? data.rating ?? destination.rating),
            reviews: data.rating?.count ?? destination.reviews,
            melhorEpoca: data.best_season || destination.melhorEpoca || 'Todo o ano',
            tipo: data.place_type || data.type || destination.tipo || 'Local',
            destaques: Array.isArray(data.highlights)
              ? data.highlights
              : (typeof data.highlights === 'string' && data.highlights)
                ? data.highlights.split(',').map((h: string) => h.trim()).filter(Boolean)
                : destination.destaques || [],
            // Localização — preservar objecto nested e campos flat
            location:   data.location || undefined,
            lat:        data.location?.latitude  ?? destination.lat,
            lng:        data.location?.longitude ?? destination.lng,
            // Campos flat — a API devolve municipality (não district)
            provincia:           (data.location?.province           ?? (data as any).province   ?? destination.provincia) || '',
            distrito:            (data.location?.municipality       ?? data.location?.district  ?? (data as any).district ?? destination.distrito) || '',
            administrative_post: (data.location?.administrative_post ?? (data as any).administrative_post ?? '') || '',
            locality:            (data.location?.locality ?? data.location?.city ?? (data as any).locality ?? '') || '',
            nearby_reference:    (data.location?.nearby_reference   ?? (data as any).nearby_reference ?? '') || '',
            endereco:            (data.location?.address            ?? (data as any).address    ?? destination.endereco ?? '') || '',
            city:                (data.location?.city ?? data.location?.town ?? (data as any).city ?? '') || '',
            // Contribuidor
            contributor: (data.author || data.contributor || data.created_by || data.owner) ? {
              name:   data.author?.name   || data.contributor?.name   || data.created_by?.name   || data.owner?.name   || 'Contribuidor',
              avatar: data.author?.avatar || data.contributor?.avatar || data.created_by?.avatar || data.owner?.avatar,
              type:   data.author?.type   || data.contributor?.type   || data.created_by?.type   || data.owner?.role   || data.owner?.type,
            } : destination.contributor,
          };
          
          console.log('[DestinationDetail] Dados mapeados finais:', {
            tipo: mappedData.tipo,
            melhorEpoca: mappedData.melhorEpoca,
            desc: mappedData.desc,
            endereco: mappedData.endereco,
            distrito: mappedData.distrito,
            destaques: mappedData.destaques,
            contributor: mappedData.contributor
          });
          
          console.log('[DestinationDetail] Dados mapeados:', mappedData);
          setLocalDetails(mappedData);
          setAvgRating(mappedData.rating);
          setReviewCount(mappedData.reviews);
        } else {
          console.log('[DestinationDetail] API n�o retornou dados v�lidos, usando dados iniciais');
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
            id: String(s.provider.id || ''),
            name: s.provider.name || s.provider.businessName || 'Prestador',
            type: resolveUserType(s.provider.role || s.provider.type),
          } : s.author ? {
            id: String(s.author.id || ''),
            name: s.author.name || 'Autor',
            type: resolveUserType(s.author.role || s.author.type),
          } : undefined,
        })));
      } catch { setNearbyServices([]); }
    };
    load();
  }, [localDetails.provincia]);

  const typeColors: Record<string, string> = { guide:'#F4821F', traveler:'#2BB5C8', resident:'#1B5E3B', business:'#7B5EA7' };
  const typeBg: Record<string, string>     = { guide:'#FFF3E0', traveler:'#E0F7FA', resident:'#EEF7F0', business:'#F3E8FF' };
  const typeLabels: Record<string, string> = { guide:'Guia', traveler:'Viajante', resident:'Residente', business:'Neg�cio' };

  return (
    <>
      {showServicesListing ? (
        <ServicesListing onBack={() => setShowServicesListing(false)}
          initialProvince={destination.provincia} initialDistrict={destination.distrito} />
      ) : selectedService ? (
        <ServiceDetail service={selectedService} onBack={() => setSelectedService(null)} />
      ) : (
        <motion.div className="pb-16"
          style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}>

          {/* -- CONTE�DO � mobile: stack | desktop: 2 colunas ------------ */}
          <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-6 md:pt-6 px-4 pt-3 space-y-3 md:space-y-0">

            {/* GALERIA � ocupa as 2 colunas, alinhada com o conte�do */}
            <div
              className="md:col-span-2 -mx-4 md:mx-0"
              onMouseEnter={() => setGalleryPaused(true)}
              onMouseLeave={() => setGalleryPaused(false)}
            >
              <div className="relative w-full overflow-hidden md:rounded-2xl"
                style={{ height: 'clamp(270px, 30vw, 370px)' }}>
                {localDetails.images && localDetails.images.length > 1 ? (
                  <ImageCarousel images={localDetails.images} autoPlay interval={3000} showControls showDots className="w-full h-full" objectFit="cover" paused={galleryPaused} />
                ) : (
                  <img src={localDetails.image || PLACEHOLDER_IMAGE} alt={localDetails.name} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />

                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-5">
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
                        id: localDetails.id,
                        type: 'local',
                        name: localDetails.name,
                        image: localDetails.image || PLACEHOLDER_IMAGE,
                        tag: localDetails.category,
                        rating: localDetails.rating,
                        provincia: localDetails.provincia,
                        distrito: localDetails.distrito,
                        raw: localDetails,
                      })}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: isFavorite(localDetails.id) ? '#0EA5E9' : 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                      <Heart size={16} fill={isFavorite(localDetails.id) ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                    </motion.button>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4">
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
              </div>
            </div>

            {/* Coluna esquerda */}
            <div className="space-y-3">

              {/* Nome + categoria */}
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-black" style={{ color: '#1A1A1A' }}>{localDetails.name}</h1>
                {localDetails.category && (
                  <span className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0 ml-2"
                    style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                    {localDetails.category}
                  </span>
                )}
              </div>

              {/* Contribuidor */}
              {localDetails.contributor && (() => {
                const c = localDetails.contributor!;
                const color = c.type ? (typeColors[c.type] || '#6B7280') : '#6B7280';
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${color}, #2BB5C8)` }}>
                      {c.avatar
                        ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        : c.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-black flex-1 text-left" style={{ color: '#1A1A1A' }}>{c.name}</p>
                    {c.type && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: typeBg[c.type] || '#F3F4F6', color }}>
                        {typeLabels[c.type] || c.type}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Sobre este local */}
              <div className="bg-white rounded-2xl p-3.5 shadow-sm text-left space-y-3">
                <h2 className="text-xs font-black" style={{ color: '#1A1A1A' }}>Sobre este local</h2>

                {/* Sempre mostra tipo de lugar */}
                <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>Tipo de lugar</p>
                  <p className="text-xs font-bold" style={{ color: '#0F172A' }}>
                    {localDetails.tipo || localDetails.category || 'Local de interesse'}
                  </p>
                </div>

                {/* Sempre mostra melhor �poca */}
                <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>Melhor �poca para visitar</p>
                  <p className="text-xs font-bold" style={{ color: '#1B5E3B' }}>
                    {localDetails.melhorEpoca || 'Todo o ano'}
                  </p>
                </div>

                {/* Sempre mostra descri��o */}
                <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>Descri��o</p>
                  <p className="text-sm leading-relaxed text-justify" style={{ color: '#374151' }}>
                    {localDetails.desc || 'Informa��es sobre este local em breve.'}
                  </p>
                </div>

                {/* Localização — hierarquia completa via modelo canónico */}
                {(() => {
                  const loc = fromApi(localDetails);
                  return hasLocation(loc) ? (
                    <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                      <LocationCard
                        size="sm"
                        data={loc}
                        showMap
                        publicationName={localDetails.name}
                      />
                    </div>
                  ) : null;
                })()}

                {/* Destaques - s� mostra se existir */}
                {localDetails.destaques && localDetails.destaques.length > 0 && (
                  <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                    <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#94A3B8' }}>Destaques</p>
                    <div className="flex flex-wrap gap-1.5">
                      {localDetails.destaques.map((d, index) => (
                        <span key={index} className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Servi�os pr�ximos */}
              <div className="bg-white rounded-2xl p-3.5 shadow-sm text-left">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-black" style={{ color: '#1A1A1A' }}>Servi�os locais em destaque</h2>
                    <p className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>
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

            {/* Coluna direita */}
            <div className="space-y-3">

              {/* Sistema de Avalia��es - ReviewManager */}
              <ReviewManager
                resourceType="local"
                resourceId={localDetails.id}
                showCreateForm={true}
                onReviewsUpdated={() => {
                  // Callback quando reviews s�o atualizadas
                  // Pode ser usado para recarregar dados do local se necess�rio
                }}
              />

            </div>
          </div>

        </motion.div>
      )}
    </>
  );
}
