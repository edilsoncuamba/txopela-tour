import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, MapPin } from 'lucide-react';
import { getStories, getProvincesWithStories } from '../data';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';
import { ALL_STORY_TYPES, getStoryTypeName } from '../types';
import type { StoryType } from '../types';

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

const PROVINCE_IMAGE: Record<string, string> = {
  'maputo':       '/images/provincias_profile/maputo_provicnia.jpeg',
  'gaza':         '/images/provincias_profile/gaza.jpeg',
  'inhambane':    '/images/provincias_profile/inhambane.jpeg',
  'sofala':       '/images/provincias_profile/sofala.jpeg',
  'manica':       '/images/provincias_profile/manica.jpeg',
  'tete':         '/images/provincias_profile/tete.jpg',
  'zambezia':     '/images/provincias_profile/zambezia.jpeg',
  'nampula':      '/images/provincias_profile/nampula.jpeg',
  'niassa':       '/images/provincias_profile/niassa.jpeg',
  'cabo-delgado': '/images/provincias_profile/cabo_delgado.jpeg',
  'maputo-cidade':'/images/provincias_profile/maputo_provicnia.jpeg',
};

const TYPE_COLOR: Record<StoryType, string> = {
  'legend':            '#7B5EA7',
  'historical-fact':   '#1B5E3B',
  'curiosity':         '#F4821F',
  'cultural-narrative':'#2BB5C8',
};

interface StoriesHomeProps {
  onProvinceSelect: (province: string) => void;
}

export default function StoriesHome({ onProvinceSelect }: StoriesHomeProps) {
  useScrollTop();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');

  const provincesWithStories = getProvincesWithStories();
  const allStories = getStories();

  const filteredStories = search.trim()
    ? getStories({ searchQuery: search })
    : allStories;

  const storiesByProvince = provincesWithStories.map(p => ({
    province: p,
    count: allStories.filter(s => s.province === p).length,
    types: [...new Set(allStories.filter(s => s.province === p).map(s => s.type))],
  }));

  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#6B7A99' : '#9CA3AF',
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
      <div className="bg-white px-5 pt-5 pb-4">
        <div className="mb-3">
          <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>Histórias</h1>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Lendas, factos e narrativas de Moçambique
          </p>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            placeholder="Pesquisar histórias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: '#1A1A1A' }}
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5 max-w-5xl mx-auto">

        {/* Tipos de história */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
            Por tipo
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {ALL_STORY_TYPES.map((type, i) => {
              const count = allStories.filter(s => s.type === type).length;
              const color = TYPE_COLOR[type];
              return (
                <motion.button
                  key={type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onProvinceSelect(`__type__${type}`)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl text-left"
                  style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}>
                    <BookOpen size={18} color={color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-black text-sm leading-tight" style={{ color: '#1A1A1A' }}>
                      {getStoryTypeName(type)}
                    </p>
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color }}>
                      {count} {count === 1 ? 'história' : 'histórias'}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Por província */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
            Por província
          </p>
          <div className="space-y-2.5">
            {storiesByProvince.map((item, i) => (
              <motion.button
                key={item.province}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onProvinceSelect(item.province)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    src={PROVINCE_IMAGE[item.province] ?? '/images/provincias_profile/inhambane.jpeg'}
                    alt={PROVINCE_LABELS[item.province] ?? item.province}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-black text-sm" style={{ color: '#1A1A1A' }}>
                    {PROVINCE_LABELS[item.province] ?? item.province}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} color="#94A3B8" />
                    <span className="text-[11px]" style={{ color: '#94A3B8' }}>
                      {item.count} {item.count === 1 ? 'história' : 'histórias'}
                    </span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
