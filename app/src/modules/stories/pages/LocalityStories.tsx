import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, X } from 'lucide-react';
import { getStories } from '../data';
import type { Story, StoryType } from '../types';
import StoryCard from '../components/StoryCard';
import StoryFilter from '../components/StoryFilter';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';

const PROVINCE_LABELS: Record<string, string> = {
  'maputo':       'Maputo',
  'gaza':         'Gaza',
  'inhambane':    'Inhambane',
  'sofala':       'Sofala',
  'manica':       'Manica',
  'tete':         'Tete',
  'zambezia':     'Zambézia',
  'nampula':      'Nampula',
  'niassa':       'Niassa',
  'cabo-delgado': 'Cabo Delgado',
  'maputo-cidade':'Maputo Cidade',
};

const STORY_TYPE_LABELS: Record<string, string> = {
  'legend':            'Lendas',
  'historical-fact':   'Factos Históricos',
  'curiosity':         'Curiosidades',
  'cultural-narrative':'Narrativas Culturais',
};

interface LocalityStoriesProps {
  /** province id OR '__type__<StoryType>' para filtrar por tipo */
  filter: string;
  onBack: () => void;
  onStorySelect: (story: Story) => void;
}

export default function LocalityStories({ filter, onBack, onStorySelect }: LocalityStoriesProps) {
  useScrollTop();
  const { isDark } = useTheme();

  const isTypeFilter = filter.startsWith('__type__');
  const typeValue    = isTypeFilter ? (filter.replace('__type__', '') as StoryType) : null;

  const [search, setSearch]       = useState('');
  const [activeType, setActiveType] = useState<StoryType | null>(typeValue);

  const allForFilter = useMemo(() => {
    if (isTypeFilter) return getStories({ type: typeValue ?? undefined });
    return getStories({ province: filter as any });
  }, [filter, isTypeFilter, typeValue]);

  const displayed = useMemo(() => {
    let r = allForFilter;
    if (activeType) r = r.filter(s => s.type === activeType);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(s =>
        s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q)
      );
    }
    return r;
  }, [allForFilter, activeType, search]);

  const title = isTypeFilter
    ? (STORY_TYPE_LABELS[typeValue ?? ''] ?? 'Histórias')
    : (PROVINCE_LABELS[filter] ?? filter);

  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#6B7A99' : '#9CA3AF',
    back:    isDark ? '#22263A' : '#F3F4F6',
    input:   isDark ? '#22263A' : '#F8FAFC',
  };

  return (
    <motion.div
      className="min-h-screen pb-20 md:pb-4"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-5 pb-3"
        style={{ background: dm.surface, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6'}` }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: dm.back }}>
            <ChevronLeft size={20} style={{ color: dm.text }} strokeWidth={2.5} />
          </button>
          <div className="flex-1 text-left">
            <h1 className="text-lg font-black leading-tight" style={{ color: dm.text }}>{title}</h1>
            <p className="text-xs" style={{ color: dm.text2 }}>
              {displayed.length} {displayed.length === 1 ? 'história' : 'histórias'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
          style={{ background: dm.input, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}` }}>
          <Search size={14} color={dm.text2} />
          <input
            type="text"
            placeholder="Pesquisar histórias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: dm.text }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={13} color={dm.text2} />
            </button>
          )}
        </div>

        {/* Filter — só mostra se não for filtro por tipo */}
        {!isTypeFilter && (
          <StoryFilter activeType={activeType} onChange={setActiveType} />
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 max-w-5xl mx-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
            <p className="text-sm font-bold text-center" style={{ color: '#9CA3AF' }}>
              Nenhuma história encontrada
            </p>
            <button
              onClick={() => { setSearch(''); setActiveType(null); }}
              className="text-xs font-bold"
              style={{ color: '#1B5E3B' }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayed.map((story, i) => (
              <StoryCard
                key={story.id}
                story={story}
                index={i}
                onPress={() => onStorySelect(story)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
