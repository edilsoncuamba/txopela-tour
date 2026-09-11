import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, ChevronUp, MapPin, Star, Heart, Share2 } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import ImageCarousel from '@/components/ImageCarousel';
import ReviewManager from '@/components/ReviewManager';
import { cultureApi } from '../api';
import { useScrollTop } from '@/hooks/useScrollTop';
import type { CulturalHeritage } from '../types';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import LocationCard from '@/components/shared/LocationCard';
import { fromApi, hasLocation, buildFullAddress } from '@/utils/normalizeLocation';

interface HeritageDetailProps {
  heritage: CulturalHeritage;
  onBack: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function HeritageDetail({ heritage, onBack }: HeritageDetailProps) {
  useScrollTop();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [heritageDetails, setHeritageDetails] = useState<CulturalHeritage>(heritage);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [galleryPaused, setGalleryPaused] = useState(false);

  // Carregar detalhes completos do património da API
  useEffect(() => {
    const loadDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const { data, error } = await cultureApi.getHeritageDetail(heritage.id);
        
        if (error) {
          console.error('[HeritageDetail] Erro da API:', error);
        }
        
        if (data && data.success && data.data) {
          setHeritageDetails(data.data);
        }
      } catch (error) {
        console.error('[HeritageDetail] Erro ao carregar detalhes:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadDetails();
  }, [heritage.id]);

  // Incrementar visualizações
  useEffect(() => {
    if (!viewIncremented) {
      cultureApi.incrementView(heritage.id);
      setViewIncremented(true);
    }
  }, [heritage.id, viewIncremented]);

  const typeColors: Record<string, string> = { 
    guide: '#F4821F', 
    traveler: '#2BB5C8', 
    resident: '#1B5E3B', 
    business: '#7B5EA7' 
  };
  
  const typeBg: Record<string, string> = { 
    guide: '#FFF3E0', 
    traveler: '#E0F7FA', 
    resident: '#EEF7F0', 
    business: '#F3E8FF' 
  };
  
  const typeLabels: Record<string, string> = { 
    guide: 'Guia', 
    traveler: 'Viajante', 
    resident: 'Residente', 
    business: 'Instituição' 
  };

  const getClassBadgeColor = (classType: string) => {
    const colors = {
      'A': '#1B5E3B',
      'B': '#2BB5C8', 
      'C': '#F4821F',
      'D': '#7B5EA7'
    };
    return colors[classType as keyof typeof colors] || '#6B7280';
  };

  const getCriteriaBadgeColor = (criteria: string) => {
    const colors = {
      'Arqueológico': '#8B4513',
      'Histórico': '#1B5E3B',
      'Arquitetónico': '#2BB5C8',
      'Religioso': '#7B5EA7',
      'Cultural': '#F4821F'
    };
    return colors[criteria as keyof typeof colors] || '#6B7280';
  };

  // Divide a descrição em parágrafos — mantido para compatibilidade futura

  return (
    <motion.div className="pb-16"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>

      {/* CONTEÚDO — galeria + grid dentro do mesmo container */}
      <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:px-6 md:pt-6 px-4 pt-3 space-y-3 md:space-y-0">

        {/* GALERIA — ocupa as 2 colunas, alinhada com o conteúdo */}
        <div
          className="md:col-span-2 -mx-4 md:mx-0"
          onMouseEnter={() => setGalleryPaused(true)}
          onMouseLeave={() => setGalleryPaused(false)}
        >
          <div className="relative w-full overflow-hidden md:rounded-2xl"
            style={{ height: 'clamp(270px, 30vw, 370px)' }}>
            {heritageDetails.images && heritageDetails.images.length > 1 ? (
              <ImageCarousel 
                images={heritageDetails.images} 
                autoPlay 
                interval={3000} 
                showControls 
                showDots 
                className="w-full h-full" 
                objectFit="cover"
                paused={galleryPaused}
              />
            ) : (
              <img 
                src={heritageDetails.mainImage || PLACEHOLDER_IMAGE} 
                alt={heritageDetails.name} 
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} 
              />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />

            {/* Header buttons */}
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
                <motion.button 
                  whileTap={{ scale: 0.9 }} 
                  onClick={() => toggleFavorite({
                    id: heritageDetails.id,
                    type: 'heritage',
                    name: heritageDetails.name,
                    image: heritageDetails.mainImage || PLACEHOLDER_IMAGE,
                    tag: heritageDetails.category,
                    rating: heritageDetails.rating || 0,
                    provincia: heritageDetails.province,
                    distrito: heritageDetails.district,
                    raw: heritageDetails,
                  })}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ 
                    background: isFavorite(heritageDetails.id) ? '#0EA5E9' : 'rgba(0,0,0,0.35)', 
                    backdropFilter: 'blur(8px)' 
                  }}>
                  <Heart size={16} fill={isFavorite(heritageDetails.id) ? 'white' : 'none'} className="text-white" strokeWidth={2} />
                </motion.button>
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-white/70" />
                    <span className="text-white/80 text-xs">{heritageDetails.province}</span>
                  </div>
                  <span className="text-white/40">·</span>
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="#FBBF24" stroke="none" />
                    <span className="text-white font-black text-xs">{heritageDetails.rating || '0.0'}</span>
                    {heritageDetails.reviewsCount && heritageDetails.reviewsCount > 0 && (
                      <span className="text-white/60 text-[10px]">({heritageDetails.reviewsCount})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna esquerda */}
        <div className="space-y-3">

          {/* Nome + categoria */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black" style={{ color: '#1A1A1A' }}>{heritageDetails.name}</h1>
            <span className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0 ml-2"
              style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
              {heritageDetails.category}
            </span>
          </div>

          {/* Autor/Contribuidor */}
          {(() => {
            const author = heritageDetails.author;
            const color = typeColors[author.type] || '#6B7280';
            return (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${color}, #2BB5C8)` }}>
                  {author.avatar
                    ? <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                    : author.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-black flex-1 text-left" style={{ color: '#1A1A1A' }}>{author.name}</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: typeBg[author.type] || '#F3F4F6', color }}>
                  {typeLabels[author.type] || author.type}
                </span>
              </div>
            );
          })()}

          {/* Informações Gerais */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm text-left space-y-3">
            <h2 className="text-xs font-black" style={{ color: '#1A1A1A' }}>Informações Gerais</h2>

            <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>Nome do Património</p>
              <p className="text-xs font-bold" style={{ color: '#0F172A' }}>{heritageDetails.name}</p>
            </div>

            <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
              <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#94A3B8' }}>Classificação Patrimonial</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
                  style={{ background: getCriteriaBadgeColor(heritageDetails.criteria[0] || 'Cultural') }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  {heritageDetails.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
                  style={{ background: getClassBadgeColor(heritageDetails.classProposed) }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5"/>
                  </svg>
                  Classe {heritageDetails.classProposed}
                </span>
                {heritageDetails.criteria.map((criterion, index) => (
                  <span key={index} className="px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
                    style={{ background: getCriteriaBadgeColor(criterion) }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    {criterion}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Localização */}
          {(() => {
            const loc = fromApi({
              province:            heritageDetails.province,
              district:            heritageDetails.district,
              administrative_post: heritageDetails.administrativePost,
              city:                heritageDetails.locality,
              address: buildFullAddress({
                locality:           heritageDetails.locality,
                administrativePost: heritageDetails.administrativePost,
                district:           heritageDetails.district,
                province:           heritageDetails.province,
              }),
              lat: heritageDetails.coordinates?.latitude,
              lng: heritageDetails.coordinates?.longitude,
            });
            if (!hasLocation(loc)) return null;
            return (
              <LocationCard
                size="sm"
                data={loc}
                showMap={!!(heritageDetails.coordinates?.latitude && heritageDetails.coordinates?.longitude)}
                publicationName={heritageDetails.name}
              />
            );
          })()}

          {/* Bem Imóvel no Espaço Envolvente */}
          {heritageDetails.surroundingSpaceProperty && heritageDetails.surroundingSpaceProperty.length > 0 && (
            <div className="bg-white rounded-2xl p-3.5 shadow-sm text-left space-y-3">
              <h2 className="text-xs font-black" style={{ color: '#1A1A1A' }}>Bem Imóvel no Espaço Envolvente</h2>
              <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex flex-wrap gap-1.5">
                  {heritageDetails.surroundingSpaceProperty.map((property, index) => (
                    <span key={index} className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                      {property}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Centro de Interpretação */}
          {heritageDetails.interpretationCenter && (
            <div className="bg-white rounded-2xl p-3.5 shadow-sm text-left space-y-3">
              <h2 className="text-xs font-black" style={{ color: '#1A1A1A' }}>Centro de Interpretação</h2>
              <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                  {heritageDetails.interpretationCenter}
                </p>
              </div>
            </div>
          )}

          {/* Descrição histórica — colapsa após 10 linhas */}
          <div className="bg-white rounded-2xl shadow-sm text-left overflow-hidden"
            style={{ border: '1px solid #F3F4F6' }}>

            {/* Cabeçalho */}
            <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
              <h2 className="text-xs font-black" style={{ color: '#1A1A1A' }}>Descrição Histórica</h2>
            </div>

            {(() => {
              const text = heritageDetails.description || '';
              // Estima linhas a partir de caracteres (aprox. 60 chars/linha a 13px)
              const lines = text.split('\n');
              const estimatedLines = lines.reduce((acc, line) => acc + Math.max(1, Math.ceil((line.length || 1) / 58)), 0);
              const needsCollapse = estimatedLines > 10;

              return (
                <div className="relative">
                  {/* Texto */}
                  <div
                    style={{
                      maxHeight: expandedDesc ? 'none' : '14.5rem', // ~10 linhas a 1.45rem
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <p className="text-sm leading-relaxed text-justify px-3.5 py-3"
                      style={{ color: '#374151' }}>
                      {text}
                    </p>
                    {/* Gradiente que cobre as últimas linhas quando colapsado */}
                    {needsCollapse && !expandedDesc && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        height: '5rem',
                        background: 'linear-gradient(to bottom, transparent, white)',
                        pointerEvents: 'none',
                      }} />
                    )}
                  </div>

                  {/* Botão ver mais / ver menos — mesmo estilo da Localização */}
                  {needsCollapse && (
                    <button
                      type="button"
                      onClick={() => setExpandedDesc(v => !v)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        padding: '8px 14px',
                        borderTop: '1px solid #F3F4F6',
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {expandedDesc
                        ? <ChevronUp size={16} color="#1B5E3B" />
                        : <ChevronDown size={16} color="#1B5E3B" />
                      }
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Como chegar — removido daqui, movido para coluna direita */}
        </div>

        {/* Coluna direita - Reviews + Como chegar */}
        <div className="space-y-3">

          {/* Sistema de Avaliações - ReviewManager */}
          <ReviewManager
            resourceType="local"
            resourceId={heritageDetails.id}
            showCreateForm={true}
            onReviewsUpdated={() => {}}
          />

          {/* Como chegar */}
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }}>
            <p className="text-white font-black text-sm mb-0.5">Quer visitar este património?</p>
            <p className="text-white/75 text-xs mb-3 leading-snug">Clica para ver a rota até lá.</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              onClick={() => {
                const url = heritageDetails.coordinates
                  ? `https://www.google.com/maps/dir/?api=1&destination=${heritageDetails.coordinates.latitude},${heritageDetails.coordinates.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(heritageDetails.name + ' ' + heritageDetails.province + ' Moçambique')}`;
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