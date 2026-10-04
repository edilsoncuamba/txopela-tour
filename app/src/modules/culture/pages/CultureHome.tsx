import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { cultureApi } from '../api';
import type { ProvinceInfo } from '../types';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import MozambiqueDetail from './MozambiqueDetail';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';

interface CultureHomeProps {
  onBack: () => void;
  onProvinceSelect: (province: ProvinceInfo) => void;
}

// Badge real por província
const PROVINCE_BADGE: Record<string, string> = {
  'maputo-cidade':    'Histórico e urbano',
  'maputo-provincia': 'Cultura Ronga',
  'gaza':             'Reino de Gaza',
  'inhambane':        'Costa swahili',
  'sofala':           'Rota do ouro',
  'manica':           'Arte rupestre',
  'tete':             'Rio Zambeze',
  'zambezia':         'Diversidade Lomwe',
  'nampula':          'Ilha Patrimônio UNESCO',
  'cabo-delgado':     'Escultura Maconde',
  'niassa':           'Lago e natureza',
  '__mozambique__':   'Descubra o país',
};

// Info real por província para o card lateral
const PROVINCE_INFO: Record<string, string> = {
  'maputo-cidade':    'Capital cultural, fortalezas e arquitectura colonial única.',
  'maputo-provincia': 'Tradições do povo Ronga, danças e patrimónios do sul.',
  'gaza':             'Berço do reino Gaza, cultura Changana e histórias de resistência.',
  'inhambane':        'Arquitectura colonial, mesquitas históricas e zimbabwes arqueológicos.',
  'sofala':           'Centro histórico do comércio de ouro e marfim da costa africana.',
  'manica':           'Arte rupestre, cultura Shona e tradições das terras altas de Manica.',
  'tete':             'Passagem histórica do Zambeze, cultura Sena e tradições ancestrais.',
  'zambezia':         'Diversidade Lomwe e Chuabo, arquitectura colonial de Quelimane.',
  'nampula':          'Ilha de Moçambique, Património Mundial UNESCO e cultura Macua.',
  'cabo-delgado':     'Escultura Maconde em ébano e arquitectura árabe-swahili da costa.',
  'niassa':           'Cultura Yao e Nyanja, Lago Niassa e florestas ancestrais do norte.',
  '__mozambique__':   'História, natureza e diversidade cultural reunidas num só país.',
};

// Descrições curtas por província — mostradas no hover no card lateral
const PROVINCE_SHORT: Record<string, string> = {
  'maputo-cidade':    'Património urbano',
  'maputo-provincia': 'Cultura do sul',
  'gaza':             'História e tradição',
  'inhambane':        'Cultura e natureza',
  'sofala':           'Herança marítima',
  'manica':           'Tradições serranas',
  'tete':             'Cultura do Zambeze',
  'zambezia':         'Arte e cultura',
  'nampula':          'Diversidade cultural',
  'cabo-delgado':     'Património ancestral',
  'niassa':           'Cultura e natureza',
  '__mozambique__':   'Todo o país',
};

function GeometricPattern() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 6 }).map((_, c) => (
          <rect key={`${r}-${c}`} x={c * 20 + 2} y={r * 20 + 2} width="16" height="16"
            rx="4" fill="#1B5E3B" opacity={(r + c) % 2 === 0 ? 0.18 : 0.07} />
        ))
      )}
    </svg>
  );
}

export default function CultureHome({ onBack, onProvinceSelect }: CultureHomeProps) {
  useScrollTop();
  const { isDark } = useTheme();
  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#6B7A99' : '#9CA3AF',
    input:   isDark ? '#22263A' : '#ffffff',
    skel:    isDark ? '#22263A' : '#E5E7EB',
    greenBg: isDark ? 'rgba(74,222,128,0.12)' : '#EEF7F0',
  };
  const [provinces, setProvinces] = useState<ProvinceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hoveredProvince, setHoveredProvince] = useState<ProvinceInfo | null>(null);
  const [showMozambique, setShowMozambique] = useState(false);

  useEffect(() => {
    cultureApi.getProvinces().then(({ data }) => {
      if (data?.success) setProvinces(data.data.provinces);
      setIsLoading(false);
    });
  }, []);

  const filtered = provinces.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const defaultFeatured = filtered.find(p => p.id === 'inhambane') ?? filtered[0];

  const mozambiqueHero: ProvinceInfo = {
    id: '__mozambique__',
    name: 'MOÇAMBIQUE',
    description: 'Descubra toda a riqueza cultural do país',
    culturalDescription: 'História, natureza e diversidade cultural reunidas num só país',
    image: '/images/Cultura/MOZA.png',
    heritageCount: 0,
    districts: Array.from({ length: 154 }, (_, i) => `Distrito ${i + 1}`),
  };

  // Por defeito mostra Moçambique; ao fazer hover muda para a província
  const featured = hoveredProvince ?? mozambiqueHero;
  const badge = PROVINCE_BADGE[featured?.id ?? ''] ?? 'Rico e diverso';
  const infoText = PROVINCE_INFO[featured?.id ?? ''] ?? 'História, cultura, tradições e patrimónios únicos esperam por ti.';
  const isMozambique = featured?.id === '__mozambique__';

  if (showMozambique) return <MozambiqueDetail onBack={() => setShowMozambique(false)} />;

  return (
    <motion.div
      className="min-h-screen pb-20 md:pb-4"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-white px-5 pt-4 pb-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 pointer-events-none"><GeometricPattern /></div>

        <div className="relative z-10 flex items-center bg-white rounded-2xl shadow-lg px-4 py-3 gap-2">
          <Search size={17} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Pesquisar províncias ou patrimónios..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }} />
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 space-y-3 max-w-5xl mx-auto">
        {isLoading ? <LoadingSkeleton /> : (
          <>
            {/* ── HERO ─────────────────────────────────────────────────── */}
            {featured && (
              <div className="flex gap-3 items-stretch">
                {/* Foto hero */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => isMozambique ? setShowMozambique(true) : onProvinceSelect(featured)}
                  className="relative overflow-hidden rounded-2xl cursor-pointer flex-1"
                  style={{ minHeight: 255 }}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 }}
                >
                  <img key={featured.id} src={featured.image || PLACEHOLDER_IMAGE} alt={featured.name}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }} />

                  {/* Badge dinâmica */}
                  <AnimatePresence mode="wait">
                    <motion.div key={badge}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(27,94,59,0.92)', backdropFilter: 'blur(6px)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M3 22V8l9-6 9 6v14"/><path d="M9 22V12h6v10"/>
                      </svg>
                      <span className="text-white text-[11px] font-black">{badge}</span>
                    </motion.div>
                  </AnimatePresence>

                  {/* Info inferior */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <AnimatePresence mode="wait">
                      <motion.div key={featured.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        <p className="text-white/85 text-sm leading-snug mb-3">
                          {featured.culturalDescription}.
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={e => { e.stopPropagation(); isMozambique ? setShowMozambique(true) : onProvinceSelect(featured); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black"
                      style={{ background: 'white', color: '#1A1A1A' }}>
                      {isMozambique ? 'Conhecer Moçambique' : `Explorar ${featured.name}`}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Card lateral */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="flex flex-col justify-center rounded-2xl p-4 w-44 flex-shrink-0"
                  style={{ background: '#EEF7F0' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{ background: 'white' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E3B" strokeWidth="1.8">
                      <path d="M3 22V8l9-6 9 6v14"/><path d="M9 22V12h6v10"/>
                    </svg>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={featured.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                      <p className="text-3xl font-black leading-none" style={{ color: '#1A1A1A' }}>
                        {featured.districts.length}
                      </p>
                      <p className="text-xs font-black mt-1 uppercase tracking-widest" style={{ color: '#1B5E3B' }}>
                        Distritos
                      </p>
                      {PROVINCE_SHORT[featured.id] && (
                        <p className="text-xs font-semibold mt-2 leading-snug" style={{ color: '#4B7A5E' }}>
                          {PROVINCE_SHORT[featured.id]}
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* ── GRID PROVÍNCIAS ───────────────────────────────────────── */}
            <div>
              <p className="text-base font-black text-left mb-3" style={{ color: '#1A1A1A' }}>
                Todas as províncias de Moçambique
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {filtered.map((province, i) => (
                  <ProvinceCard key={province.id} province={province} index={i}
                    isFeatured={hoveredProvince !== null && province.id === hoveredProvince.id}
                    onPress={() => onProvinceSelect(province)}
                    onHover={() => setHoveredProvince(province)}
                    onLeave={() => setHoveredProvince(null)} />
                ))}
              </div>
            </div>

          </>
        )}
      </div>
    </motion.div>
  );
}

// ── PROVINCE CARD ─────────────────────────────────────────────────────────
function ProvinceCard({ province, index, isFeatured, onPress, onHover, onLeave }: {
  province: ProvinceInfo; index: number; isFeatured: boolean;
  onPress: () => void; onHover: () => void; onLeave: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 + index * 0.04, type: 'spring', damping: 20 }}
      whileTap={{ scale: 0.97 }}
      onClick={onPress} onMouseEnter={onHover} onMouseLeave={onLeave}
      className="flex items-center gap-2 p-2.5 rounded-2xl text-left w-full transition-all"
      style={{
        background: isFeatured ? '#EEF7F0' : 'white',
        border: isFeatured ? '2px solid #1B5E3B' : '2px solid transparent',
      }}
    >
      <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        <img src={province.image || PLACEHOLDER_IMAGE} alt={province.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[11px] font-black leading-tight truncate" style={{ color: '#1A1A1A' }}>
            {province.name}
          </p>
          {isFeatured && (
            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#1B5E3B' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
        <p className="text-[10px] leading-snug mt-0.5 line-clamp-2" style={{ color: '#9CA3AF' }}>
          {province.description}
        </p>
      </div>
    </motion.button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="flex-1 h-52 bg-gray-200 rounded-2xl" />
        <div className="w-44 h-52 bg-gray-200 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
