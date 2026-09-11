import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Star, Loader2, AlertCircle } from 'lucide-react';
import { useFavorites, type FavoriteItem, type FavoriteType } from '@/context/FavoritesContext';
import { PLACEHOLDER_IMAGE, mapValidLocal, mapValidService } from '@/utils/dataValidation';
import { localsApi, servicesApi } from '@/services/api';
import DestinationDetail from '@/pages/DestinationDetail';
import ServiceDetail from '@/pages/ServiceDetail';
import type { Local } from '@/types';
import { useScrollTop } from '@/hooks/useScrollTop';

interface FavoritesProps {
  onLocalPress: (local: Local) => void;
  onNotifications: () => void;
  onChat: () => void;
}

type FilterType = 'todos' | FavoriteType;

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'todos',    label: 'Todos'    },
  { id: 'local',    label: 'Locais'   },
  { id: 'service',  label: 'Serviços' },
  { id: 'heritage', label: 'Cultura'  },
];

export default function Favorites({
  onLocalPress }: FavoritesProps) {
  useScrollTop();
  const { favorites, toggleFavorite, countByType } = useFavorites();
  const [filter, setFilter]           = useState<FilterType>('todos');
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailType, setDetailType]   = useState<FavoriteType | null>(null);
  const [loadingId, setLoadingId]     = useState<string | null>(null);
  const [loadError, setLoadError]     = useState<string | null>(null);

  const visible: FavoriteItem[] = filter === 'todos'
    ? favorites
    : favorites.filter(f => f.type === filter);

  // Ao clicar num item, busca os dados completos da API e abre o detalhe
  const handleOpen = async (item: FavoriteItem) => {
    setLoadingId(item.id);
    setLoadError(null);
    try {
      if (item.type === 'local') {
        const { data, error } = await localsApi.get(item.id);
        if (error || !data) throw new Error(error || 'Erro ao carregar local');
        // A API devolve { local: {...} } ou o objecto directo
        const raw = data.local ?? data;
        const mapped = mapValidLocal(raw);
        if (mapped) {
          setDetailType('local');
          setSelectedDetail(mapped);
        } else {
          // Fallback: usar dados cached do favorito
          setDetailType('local');
          setSelectedDetail(item.raw ?? item);
        }
      } else {
        const { data, error } = await servicesApi.get(item.id);
        if (error || !data) throw new Error(error || 'Erro ao carregar serviço');
        const raw = data.service ?? data;
        const mapped = mapValidService(raw);
        if (mapped) {
          setDetailType('service');
          setSelectedDetail(mapped);
        } else {
          setDetailType('service');
          setSelectedDetail(item.raw ?? item);
        }
      }
    } catch (e: any) {
      // Se a API falhar, ainda assim abre com os dados que temos em cache
      setDetailType(item.type);
      setSelectedDetail(item.raw ?? item);
      setLoadError(null); // não bloquear — abre com dados parciais
    } finally {
      setLoadingId(null);
    }
  };

  // ── Detalhe de local ────────────────────────────────────────────────────────
  if (detailType === 'local' && selectedDetail) {
    return (
      <DestinationDetail
        destination={{
          id:          selectedDetail.id,
          name:        selectedDetail.name,
          category:    selectedDetail.tag      || selectedDetail.category || '',
          provincia:   selectedDetail.provincia || '',
          desc:        selectedDetail.desc      || selectedDetail.description || '',
          image:       selectedDetail.image     || PLACEHOLDER_IMAGE,
          images:      selectedDetail.images,
          rating:      selectedDetail.rating    || 0,
          reviews:     selectedDetail.reviews   || 0,
          badge:       selectedDetail.badge,
          badgeBg:     selectedDetail.badgeBg,
          melhorEpoca: selectedDetail.melhorEpoca,
          lat:         selectedDetail.lat,
          lng:         selectedDetail.lng,
          endereco:    selectedDetail.endereco,
          distrito:    selectedDetail.distrito,
          // Campos de localização completos — adicionados para garantir hierarquia correcta
          administrative_post: selectedDetail.administrative_post,
          locality:            selectedDetail.locality,
          nearby_reference:    selectedDetail.nearby_reference,
          location:            selectedDetail.location,
          destaques:   selectedDetail.destaques,
          tipo:        selectedDetail.tipo,
          contributor: selectedDetail.contributor,
        }}
        onBack={() => { setSelectedDetail(null); setDetailType(null); }}
        onExploreMore={() => { setSelectedDetail(null); setDetailType(null); }}
      />
    );
  }

  // ── Detalhe de serviço ──────────────────────────────────────────────────────
  if (detailType === 'service' && selectedDetail) {
    return (
      <ServiceDetail
        service={{
          id:          selectedDetail.id,
          name:        selectedDetail.name,
          category:    selectedDetail.category || selectedDetail.tag || 'Serviço',
          description: selectedDetail.description || selectedDetail.desc || '',
          provincia:   selectedDetail.provincia || '',
          distrito:    selectedDetail.distrito  || '',
          administrative_post: selectedDetail.administrative_post,
          locality:    selectedDetail.locality,
          nearby_reference: selectedDetail.nearby_reference,
          location:    selectedDetail.location,
          endereco:    selectedDetail.endereco  || '',
          telefone:    selectedDetail.telefone  || '',
          whatsapp:    selectedDetail.whatsapp  || '',
          email:       selectedDetail.email     || '',
          horario:     selectedDetail.horario   || '',
          rating:      selectedDetail.rating    || 0,
          image:       selectedDetail.image     || PLACEHOLDER_IMAGE,
          images:      selectedDetail.images,
          lat:         selectedDetail.lat,
          lng:         selectedDetail.lng,
          contributor: selectedDetail.contributor,
        }}
        onBack={() => { setSelectedDetail(null); setDetailType(null); }}
      />
    );
  }

  // ── Lista de favoritos ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-0 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={20} fill="#0077B6" color="#0077B6" />
          <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Favoritos</h1>
          {favorites.length > 0 && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: '#0077B6' }}>
              {favorites.length}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-0 border-b" style={{ borderColor: '#F3F4F6' }}>
          {FILTERS.map(f => {
            const count = f.id === 'todos' ? favorites.length : countByType(f.id as FavoriteType);
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="flex-1 py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5"
                style={{
                  color: filter === f.id ? '#0077B6' : '#9CA3AF',
                  borderBottom: filter === f.id ? '2px solid #0077B6' : '2px solid transparent',
                }}>
                {f.label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] text-white"
                    style={{ background: filter === f.id ? '#0077B6' : '#D1D5DB' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pt-4">
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <motion.div key="empty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: '#EFF8FF' }}>
                <Heart size={28} style={{ color: '#93C5FD' }} />
              </div>
              <p className="text-sm font-bold" style={{ color: '#6B7280' }}>
                {filter === 'todos'
                  ? 'Ainda não tens favoritos'
                  : filter === 'local'
                  ? 'Sem locais nos favoritos'
                  : filter === 'service'
                  ? 'Sem serviços nos favoritos'
                  : 'Sem património cultural nos favoritos'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="grid" className="grid grid-cols-2 gap-3">
              {visible.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: loadingId === item.id ? 1 : 0.97 }}
                  onClick={() => { if (!loadingId) handleOpen(item); }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer relative">

                  {/* Overlay de carregamento */}
                  {loadingId === item.id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl"
                      style={{ background: 'rgba(255,255,255,0.75)' }}>
                      <Loader2 size={24} className="animate-spin" style={{ color: '#1B5E3B' }} />
                    </div>
                  )}

                  {/* Imagem */}
                  <div className="relative" style={{ height: 175 }}>
                    <img
                      src={item.image || PLACEHOLDER_IMAGE}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                    />
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)' }} />

                    {/* Badge tipo */}
                    <span className="absolute top-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: item.type === 'local' ? '#1B5E3B' : item.type === 'heritage' ? '#7B5EA7' : '#2BB5C8' }}>
                      {item.type === 'local' ? 'Local' : item.type === 'heritage' ? 'Cultura' : 'Serviço'}
                    </span>

                    {/* Botão remover favorito */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={e => { e.stopPropagation(); toggleFavorite(item); }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,119,182,0.85)' }}>
                      <Heart size={13} fill="white" color="white" />
                    </motion.button>

                    {/* Rating */}
                    {item.rating !== undefined && (
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                        <Star size={10} fill={item.rating > 0 ? '#FBBF24' : 'none'} stroke={item.rating > 0 ? 'none' : '#9CA3AF'} />
                        <span className="text-white text-[10px] font-bold">
                          {item.rating > 0 ? item.rating.toFixed(1) : 'Novo'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <h3 className="text-sm font-black mb-0.5 leading-tight" style={{ color: '#1A1A1A' }}>
                      {item.name}
                    </h3>
                    {(item.provincia || item.distrito) && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <MapPin size={10} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                        <span className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>
                          {[item.distrito, item.provincia].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {item.tag && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                          {item.tag}
                        </span>
                      )}
                      <span className="text-[9px] font-bold ml-auto"
                        style={{ color: '#0077B6' }}>
                        Ver detalhes →
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
