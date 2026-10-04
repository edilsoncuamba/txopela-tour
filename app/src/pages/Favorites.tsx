/**
 * Favorites.tsx
 *
 * Endpoints usados (openapi-schema (3).yaml):
 *   POST   /api/locals/{id}/save/    → { success, hasSaved }
 *   DELETE /api/locals/{id}/save/    → { success, hasSaved }
 *   POST   /api/posts/{id}/save/     → { success, hasSaved }
 *   DELETE /api/posts/{id}/save/     → { success, hasSaved }
 *   POST   /api/services/{id}/save/  → { success, hasSaved }
 *   DELETE /api/services/{id}/save/  → { success, hasSaved }
 *   GET    /api/locals/{id}/         → LocalDetail
 *   GET    /api/services/{id}/       → ServiceDetail
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Search, X } from 'lucide-react';
import { useFavorites, type FavoriteItem, type FavoriteType } from '@/context/FavoritesContext';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import DestinationDetail from '@/pages/DestinationDetail';
import ServiceDetail from '@/pages/ServiceDetail';
import PostDetail from '@/pages/PostDetail';
import { CategoryIcon } from '@/components/icons';
import type { Local } from '@/types';
import { useScrollTop } from '@/hooks/useScrollTop';
import { itemMatchesFilter } from '@/utils/translations';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FavoritesProps {
  onLocalPress: (local: Local) => void;
  onNotifications?: () => void;
  onChat?: () => void;
}

type FilterType = 'todos' | FavoriteType;

// Filtros — SEM "Publicações" (openapi só tem local/service/post como save, heritage=local)
const FILTERS: { id: FilterType; label: string; color: string; tagId: string }[] = [
  { id: 'todos',   label: 'Todos',    color: '#1B5E3B', tagId: 'todos'     },
  { id: 'local',   label: 'Locais',   color: '#2BB5C8', tagId: 'natureza'  },
  { id: 'service', label: 'Serviços', color: '#F4821F', tagId: 'aventura'  },
  { id: 'heritage',label: 'Cultura',  color: '#7B5EA7', tagId: 'cultura'   },
];

// Mesma paleta que AllDiscoveries / ServicesListing
const LOCAL_CATS = ['Praias', 'Cultura & História', 'Natureza', 'Aventura', 'Gastronomia', 'Mergulho', 'Ecoturismo'];
const LOCAL_CAT_COLORS: Record<string, string> = {
  'Praias': '#2BB5C8', 'Cultura & História': '#7B5EA7', 'Natureza': '#22C55E',
  'Aventura': '#F4821F', 'Gastronomia': '#E05A3A', 'Mergulho': '#0EA5E9', 'Ecoturismo': '#1B5E3B',
};
const SERVICE_BADGE_COLORS: Record<string, string> = {
  'Hospedagem': '#2563EB', 'Guia Turístico': '#F4821F',
  'Experiência': '#E05A3A', 'Transporte': '#1B5E3B', 'Outro': '#7B5EA7',
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Favorites({ onLocalPress }: FavoritesProps) {
  useScrollTop();
  const { favorites, toggleFavorite } = useFavorites();

  const [filter, setFilter]           = useState<FilterType>('todos');
  const [search, setSearch]           = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailType, setDetailType]   = useState<FavoriteType | null>(null);

  // openapi: heritage é um subconjunto de local — incluir em 'todos' e 'heritage'
  const visible: FavoriteItem[] = (
    filter === 'todos'   ? favorites :
    filter === 'heritage'? favorites.filter(f => f.type === 'heritage' || (f.type === 'local' && f.categoryKey === 'cultura')) :
    favorites.filter(f => f.type === filter)
  ).filter(f =>
    !search ||
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.provincia ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  // ── Abrir detalhe — usa dados cached (raw) sem delay de API ─────────────
  const handleOpen = (item: FavoriteItem) => {
    const data = item.raw ?? item;
    if (item.type === 'post') {
      setDetailType('post');
      setSelectedDetail(data);
    } else if (item.type === 'heritage') {
      setDetailType('local');
      setSelectedDetail(data);
    } else if (item.type === 'local') {
      setDetailType('local');
      setSelectedDetail(data);
    } else {
      // service
      setDetailType('service');
      setSelectedDetail(data);
    }
  };

  // ── Detalhes ─────────────────────────────────────────────────────────────
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

  if (detailType === 'post' && selectedDetail) {
    return (
      <PostDetail
        post={selectedDetail}
        onBack={() => { setSelectedDetail(null); setDetailType(null); }}
        onLike={() => {}}
        onSave={() => {}}
        onShare={() => {}}
      />
    );
  }

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

  // ── Lista ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-3 shadow-sm sticky top-0 z-10">

        {/* Linha: barra de pesquisa + ícone funil (igual AllDiscoveries) */}
        <div className="flex items-center gap-2 mb-0">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <Search size={15} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Pesquisar favoritos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: '#1A1A1A' }}
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={13} style={{ color: '#9CA3AF' }} />
              </button>
            )}
          </div>

          {/* Ícone funil — mesmo estilo de AllDiscoveries */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#F3F4F6' }}
          >
            {/* Mesmo SVG de funil do AllDiscoveries */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={showFilters || filter !== 'todos' ? '#1B5E3B' : '#6B7280'}
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>

        {/* Filtros — pills com ícone + gradiente translúcido, sem contador */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              key="filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pt-3 overflow-x-auto scrollbar-hide pb-1">
                {FILTERS.map(f => {
                  const isActive = filter === f.id;
                  const c = f.color;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                      style={{
                        background: isActive ? c + '18' : '#F3F4F6',
                        color:      isActive ? c       : '#6B7280',
                        border:     isActive ? `1.5px solid ${c}60` : '1.5px solid transparent',
                      }}
                    >
                      {f.id === 'todos' ? (
                        /* grid 2×2 — igual ao "Todos" de AllDiscoveries */
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke={isActive ? c : '#6B7280'} strokeWidth="2.2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                      ) : (
                        <CategoryIcon id={f.tagId} size={15} color={isActive ? c : '#6B7280'} strokeWidth={1.6} />
                      )}
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
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
                {filter === 'todos'     ? 'Ainda não tens favoritos'
                 : filter === 'local'   ? 'Sem locais nos favoritos'
                 : filter === 'service' ? 'Sem serviços nos favoritos'
                 :                        'Sem cultura nos favoritos'}
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
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleOpen(item)}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer relative"
                >
                  {/* Local / Heritage — igual ao card de AllDiscoveries */}
                  {(item.type === 'local' || item.type === 'heritage') ? (
                    <LocalDiscoveryCard item={item} onRemove={e => { e.stopPropagation(); toggleFavorite(item); }} />
                  ) : (
                    /* Serviços e posts — imagem full com info sobreposta */
                    <FullImageCard item={item} onRemove={e => { e.stopPropagation(); toggleFavorite(item); }} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/**
 * LocalDiscoveryCard — layout igual ao card de ServicesListing / AllDiscoveries:
 *   imagem (200px) com badge topo-esq, rating badge fundo-esq
 *   corpo branco: nome + tag categoria à direita
 *   linha de ações: heart | sugerir | localização (centro) | Ver detalhes
 */
function LocalDiscoveryCard({
  item,
  onRemove,
}: {
  item: FavoriteItem;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const raw = item.raw ?? item;
  const matched = LOCAL_CATS.find(c => itemMatchesFilter(raw, c));
  const filterLabel = matched ?? item.tag ?? 'Local';
  const filterColor = matched ? LOCAL_CAT_COLORS[matched] : '#1B5E3B';

  const locStr = [item.distrito, item.provincia].filter(Boolean).join(' · ');

  return (
    <>
      {/* ── Imagem ── */}
      <div className="relative" style={{ height: 200 }}>
        <img
          src={item.image || PLACEHOLDER_IMAGE}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />

        {/* Rating badge — fundo escuro canto inferior esquerdo */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <Star size={12}
            fill={item.rating && item.rating > 0 ? '#FBBF24' : 'none'}
            stroke={item.rating && item.rating > 0 ? 'none' : '#9CA3AF'} />
          <span className="text-white text-xs font-bold">
            {item.rating && item.rating > 0 ? item.rating.toFixed(1) : '0'}
          </span>
          {item.rating && item.rating > 0 && raw?.reviews > 0 && (
            <span className="text-white/80 text-[10px]">({raw.reviews})</span>
          )}
        </div>

        {/* Badge (Raro / Secreto) — topo esquerdo */}
        {raw?.badge && (
          <span className="absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: raw.badgeBg ?? '#6B7280' }}>
            {raw.badge}
          </span>
        )}
      </div>

      {/* ── Corpo branco ── */}
      <div className="p-2.5 text-left">
        {/* Nome + tag categoria */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-black leading-tight flex-1" style={{ color: '#1A1A1A' }}>
            {item.name}
          </h3>
          <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: filterColor + '18', color: filterColor }}>
            {filterLabel}
          </span>
        </div>

        {/* Linha de ações — idêntica ao ServicesListing */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>

          {/* Esquerda: heart + sugerir */}
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.85 }} onClick={onRemove}
              className="flex items-center">
              <Heart size={13} fill="#0077B6" color="#0077B6" />
            </motion.button>

            <button
              className="flex items-center gap-0.5"
              style={{ color: '#9CA3AF' }}
              onClick={async e => {
                e.stopPropagation();
                const title = item.name;
                const text  = `${item.name}\nDescobre mais em Txopela Tour!`;
                const url   = window.location.origin;
                try {
                  if (navigator.share) await navigator.share({ title, text, url });
                  else await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                } catch { /* cancelado */ }
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
              <span className="text-[9px] font-semibold">Sugerir</span>
            </button>
          </div>

          {/* Centro: localização */}
          {locStr && (
            <div className="flex items-center flex-1 justify-center px-1 overflow-hidden">
              <span className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>{locStr}</span>
            </div>
          )}

          {/* Direita: Ver detalhes */}
          <button className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-white flex-shrink-0"
            style={{ background: '#1B5E3B' }}>
            Ver detalhes
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * FullImageCard — layout igual ao ServicesListing para serviços,
 * e full-image com overlay para posts.
 */
function FullImageCard({
  item,
  onRemove,
}: {
  item: FavoriteItem;
  onRemove: (e: React.MouseEvent) => void;
}) {
  // Serviços: mesmo layout que LocalDiscoveryCard (imagem + corpo branco)
  if (item.type === 'service') {
    const badgeBg = SERVICE_BADGE_COLORS[item.tag ?? ''] ?? '#1B5E3B';
    const locStr = [item.distrito, item.provincia].filter(Boolean).join(' · ');
    return (
      <>
        {/* Imagem */}
        <div className="relative" style={{ height: 200 }}>
          <img
            src={item.image || PLACEHOLDER_IMAGE}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
          {/* Rating badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <Star size={12} fill="#FBBF24" stroke="none" />
            <span className="text-white text-xs font-bold">
              {item.rating && item.rating > 0 ? item.rating.toFixed(1) : '0'}
            </span>
            {item.raw?.reviewsCount > 0 && (
              <span className="text-white/80 text-[10px]">({item.raw.reviewsCount})</span>
            )}
          </div>

          {/* Badge (Raro / Novidade / etc.) — topo esquerdo */}
          {(item.raw?.badge) && (
            <span className="absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: item.raw.badgeBg ?? '#6B7280' }}>
              {item.raw.badge}
            </span>
          )}
        </div>

        {/* Corpo branco */}
        <div className="p-2.5 text-left">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-sm font-black leading-tight flex-1" style={{ color: '#1A1A1A' }}>
              {item.name}
            </h3>
            {item.tag && (
              <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: badgeBg + '18', color: badgeBg }}>
                {item.tag}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.85 }} onClick={onRemove}
                className="flex items-center">
                <Heart size={13} fill="#0077B6" color="#0077B6" />
              </motion.button>
              <button
                className="flex items-center gap-0.5"
                style={{ color: '#9CA3AF' }}
                onClick={async e => {
                  e.stopPropagation();
                  const title = item.name;
                  const text  = `${item.name}\nDescobre mais em Txopela Tour!`;
                  const url   = window.location.origin;
                  try {
                    if (navigator.share) await navigator.share({ title, text, url });
                    else await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                  } catch { /* cancelado */ }
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
                <span className="text-[9px] font-semibold">Sugerir</span>
              </button>
            </div>
            {locStr && (
              <div className="flex items-center flex-1 justify-center px-1 overflow-hidden">
                <span className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>{locStr}</span>
              </div>
            )}
            <button className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-white flex-shrink-0"
              style={{ background: '#1B5E3B' }}>
              Ver detalhes
            </button>
          </div>
        </div>
      </>
    );
  }

  // Posts / heritage: full-image com gradiente e info sobreposta
  return (
    <div className="relative" style={{ height: 220 }}>
      <img
        src={item.image || PLACEHOLDER_IMAGE}
        alt={item.name}
        className="absolute inset-0 w-full h-full object-cover"
        onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
      />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)' }} />

      {/* Topo: badge + heart */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
        <FavBadge item={item} />
        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={onRemove}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,119,182,0.90)', backdropFilter: 'blur(4px)' }}>
          <Heart size={14} fill="white" color="white" />
        </motion.button>
      </div>

      {/* Fundo: nome + rating + pill */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="text-white font-extrabold text-sm leading-tight mb-2">{item.name}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={11}
              fill={item.rating && item.rating > 0 ? '#FBBF24' : 'none'}
              stroke={item.rating && item.rating > 0 ? 'none' : '#9CA3AF'} />
            <span className="text-white text-xs font-bold">
              {item.rating && item.rating > 0 ? item.rating.toFixed(1) : 'Novo'}
            </span>
          </div>
          <FavCategoryPill item={item} />
        </div>
      </div>
    </div>
  );
}

/** Badge topo-esquerdo */
function FavBadge({ item }: { item: FavoriteItem }) {
  if (item.type === 'service') {
    if (!item.tag) return <span />;
    const bg = SERVICE_BADGE_COLORS[item.tag] ?? '#1B5E3B';
    return (
      <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full"
        style={{ background: bg }}>
        {item.tag}
      </span>
    );
  }
  // post / heritage
  const badge: string = item.raw?.badge ?? item.tag ?? '';
  const badgeBg: string = item.raw?.badgeBg ?? item.tagBg ?? '#F4821F';
  if (!badge) return <span />;
  return (
    <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: badgeBg }}>
      {badge}
    </span>
  );
}

/** Pill de categoria — canto inferior direito (apenas para FullImageCard) */
function FavCategoryPill({ item }: { item: FavoriteItem }) {
  if (item.type === 'service') {
    if (!item.tag) return null;
    const bg = SERVICE_BADGE_COLORS[item.tag] ?? '#1B5E3B';
    return (
      <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: bg }}>
        {item.tag}
      </span>
    );
  }
  return (
    <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: '#F4821F' }}>
      {item.tag ?? 'Publicação'}
    </span>
  );
}
