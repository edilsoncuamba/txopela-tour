import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, X, SlidersHorizontal, MapPin, Images } from 'lucide-react';
import { cultureApi } from '../api';
import type { CulturalHeritage, ProvinceInfo } from '../types';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';

import { useScrollTop } from '@/hooks/useScrollTop';

interface HeritageListProps {
  province: ProvinceInfo;
  onBack: () => void;
  onHeritageSelect: (heritage: CulturalHeritage) => void;
}

const CATEGORIES = ['Todos', 'Monumento', 'Conjunto', 'Sítio'];
const CLASSES     = ['Todas', 'A', 'B', 'C', 'D'];
const CRITERIA    = ['Todos', 'Arqueológico', 'Histórico', 'Histórico-Político', 'Sociocultural', 'Natural'];

// Cores por classe patrimonial
const CLASS_COLOR: Record<string, string> = {
  A: '#1B5E3B', B: '#2BB5C8', C: '#F4821F', D: '#7B5EA7',
};

export default function HeritageList({ province, onBack, onHeritageSelect }: HeritageListProps) {
  useScrollTop();
  const [heritage, setHeritage]         = useState<CulturalHeritage[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [classFilter, setClassFilter]   = useState('Todas');
  const [criteriaFilter, setCriteriaFilter] = useState('Todos');
  const [showFilters, setShowFilters]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: err } = await cultureApi.getHeritageList({
        province:  province.name,
        category:  categoryFilter !== 'Todos'  ? categoryFilter  : undefined,
        criteria:  criteriaFilter !== 'Todos'  ? criteriaFilter  : undefined,
        search:    search || undefined,
        limit:     200, // cobrir todos os registos estáticos disponíveis
      });
      if (cancelled) return;
      if (err) { setError(err); }
      else if (data?.success) { setHeritage(data.data.heritage); }
      else { setError('Erro ao carregar o património.'); }
      setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [province.name, categoryFilter, classFilter, criteriaFilter, search]);

  // Filtro de classe aplicado localmente (dados estáticos)
  const displayed = classFilter === 'Todas'
    ? heritage
    : heritage.filter(h => h.classProposed === classFilter);

  const hasActiveFilters = categoryFilter !== 'Todos' || classFilter !== 'Todas' || criteriaFilter !== 'Todos';

  // Divide em duas colunas com alturas alternadas (masonry visual)
  const left  = displayed.filter((_, i) => i % 2 === 0);
  const right = displayed.filter((_, i) => i % 2 !== 0);

  return (
    <motion.div
      className="min-h-screen pb-24"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ChevronLeft size={20} style={{ color: '#1A1A1A' }} strokeWidth={2.5} />
          </button>
          <div className="flex-1 text-left">
            <h1 className="text-lg font-black leading-tight" style={{ color: '#1A1A1A' }}>
              {province.name}
            </h1>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              {isLoading ? 'A carregar...' : `${displayed.length} ${displayed.length === 1 ? 'património' : 'patrimónios'}`}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowFilters(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center relative"
            style={{ background: showFilters || hasActiveFilters ? '#1B5E3B' : '#F3F4F6' }}
          >
            <SlidersHorizontal size={16}
              style={{ color: showFilters || hasActiveFilters ? 'white' : '#1A1A1A' }} />
            {hasActiveFilters && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-400 border border-white" />
            )}
          </motion.button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
          style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar património..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: '#1A1A1A' }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2.5">
                {/* Categoria */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#94A3B8' }}>Categoria</p>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCategoryFilter(c)}
                        className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all"
                        style={{
                          background: categoryFilter === c ? '#1B5E3B' : 'white',
                          color:      categoryFilter === c ? 'white' : '#6B7280',
                          border: `1px solid ${categoryFilter === c ? '#1B5E3B' : '#E5E7EB'}`,
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Classe */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#94A3B8' }}>Classe</p>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {CLASSES.map(c => (
                      <button key={c} onClick={() => setClassFilter(c)}
                        className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all"
                        style={{
                          background: classFilter === c ? (CLASS_COLOR[c] ?? '#1B5E3B') : 'white',
                          color:      classFilter === c ? 'white' : '#6B7280',
                          border: `1px solid ${classFilter === c ? (CLASS_COLOR[c] ?? '#1B5E3B') : '#E5E7EB'}`,
                        }}>
                        {c === 'Todas' ? c : `Classe ${c}`}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Critério */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#94A3B8' }}>Critério</p>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {CRITERIA.map(c => (
                      <button key={c} onClick={() => setCriteriaFilter(c)}
                        className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all"
                        style={{
                          background: criteriaFilter === c ? '#1B5E3B' : 'white',
                          color:      criteriaFilter === c ? 'white' : '#6B7280',
                          border: `1px solid ${criteriaFilter === c ? '#1B5E3B' : '#E5E7EB'}`,
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setCategoryFilter('Todos'); setClassFilter('Todas'); setCriteriaFilter('Todos'); }}
                    className="text-xs font-bold"
                    style={{ color: '#EF4444' }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────────── */}
      <div className="px-3 pt-4">
        {isLoading ? (
          // Skeleton masonry
          <div className="flex gap-3">
            {[
              [220, 160, 240], [160, 230, 170],
            ].map((heights, col) => (
              <div key={col} className="flex-1 flex flex-col gap-3">
                {heights.map((h, i) => (
                  <div key={i} className="w-full rounded-2xl bg-gray-200 animate-pulse" style={{ height: h }} />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            <p className="text-sm font-bold text-red-500 text-center">{error}</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="text-sm font-bold text-center" style={{ color: '#9CA3AF' }}>
              Nenhum património encontrado
            </p>
            <button
              onClick={() => { setSearch(''); setCategoryFilter('Todos'); setClassFilter('Todas'); setCriteriaFilter('Todos'); }}
              className="text-xs font-bold" style={{ color: '#1B5E3B' }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          /* ── MASONRY 2 COLUNAS ──────────────────────────────────────────── */
          <div className="flex gap-3">
            {/* Coluna esquerda */}
            <div className="flex-1 flex flex-col gap-3">
              {left.map((item, i) => (
                <HeritageCard
                  key={item.id}
                  item={item}
                  index={i * 2}
                  tall={i % 3 === 1}
                  onPress={() => onHeritageSelect(item)}
                />
              ))}
            </div>
            {/* Coluna direita — offset visual */}
            <div className="flex-1 flex flex-col gap-3 mt-6">
              {right.map((item, i) => (
                <HeritageCard
                  key={item.id}
                  item={item}
                  index={i * 2 + 1}
                  tall={i % 3 === 0}
                  onPress={() => onHeritageSelect(item)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── CARD ─────────────────────────────────────────────────────────────────────
function HeritageCard({
  item, index, tall, onPress,
}: {
  item: CulturalHeritage;
  index: number;
  tall: boolean;
  onPress: () => void;
}) {
  const CLASS_COLOR: Record<string, string> = {
    A: '#1B5E3B', B: '#2BB5C8', C: '#F4821F', D: '#7B5EA7',
  };
  const height = tall ? 260 : 190;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', damping: 20, stiffness: 260 }}
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      style={{ height }}
    >
      {/* Foto */}
      <img
        src={item.mainImage || PLACEHOLDER_IMAGE}
        alt={item.name}
        className="w-full h-full object-cover"
        onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
      />

      {/* Gradiente inferior */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, transparent 75%)' }} />

      {/* Nº de fotos — topo direito */}
      {item.images.length > 1 && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
          <Images size={11} color="white" />
          <span className="text-white text-[11px] font-bold">{item.images.length}</span>
        </div>
      )}

      {/* Classe badge — topo esquerdo */}
      <div className="absolute top-2.5 left-2.5 flex items-center justify-center px-2 py-0.5 rounded-full"
        style={{ background: CLASS_COLOR[item.classProposed] ?? '#6B7280' }}>
        <span className="text-white text-[10px] font-black">Classe {item.classProposed}</span>
      </div>

      {/* Info inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-end justify-between gap-2">
          {/* Localização + Nome — alinhados à esquerda */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1 mb-0.5">
              <MapPin size={10} color="rgba(255,255,255,0.75)" />
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {item.district}
              </span>
            </div>
            <h3 className="text-white font-black text-sm leading-tight text-left">
              {item.name}
            </h3>
          </div>

          {/* Botão seta */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={e => { e.stopPropagation(); onPress(); }}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'white' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}