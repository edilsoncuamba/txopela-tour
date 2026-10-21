import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Clock, BookOpen, Share2 } from 'lucide-react';
import type { Story, StoryType } from '../types';
import { getStoryTypeName } from '../types';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';

const TYPE_COLOR: Record<StoryType, string> = {
  'legend':            '#7B5EA7',
  'historical-fact':   '#1B5E3B',
  'curiosity':         '#F4821F',
  'cultural-narrative':'#2BB5C8',
};

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

interface StoryDetailProps {
  story: Story;
  onBack: () => void;
}

export default function StoryDetail({ story, onBack }: StoryDetailProps) {
  useScrollTop();
  const { isDark } = useTheme();
  const [currentImg, setCurrentImg] = useState(0);

  const color  = TYPE_COLOR[story.type];
  const images = story.images ?? [];

  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#A8B4CC' : '#374151',
    muted:   isDark ? '#6B7A99' : '#94A3B8',
  };

  return (
    <motion.div
      className="min-h-screen pb-20 md:pb-4"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Hero image */}
      <div className="relative w-full overflow-hidden" style={{ height: 'clamp(240px, 35vw, 360px)' }}>
        {images.length > 0 ? (
          <img
            src={images[currentImg]}
            alt={story.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `${color}22` }}>
            <BookOpen size={64} color={color} strokeWidth={1} />
          </div>
        )}

        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />

        {/* Controls */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
            <ChevronLeft size={20} color="white" strokeWidth={2.5} />
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
            <Share2 size={16} color="white" strokeWidth={2} />
          </button>
        </div>

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrentImg(i)}
                className="transition-all"
                style={{
                  width: i === currentImg ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === currentImg ? 'white' : 'rgba(255,255,255,0.5)',
                }} />
            ))}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute bottom-4 left-4">
          <span className="text-xs font-black px-3 py-1.5 rounded-full"
            style={{ background: color, color: 'white' }}>
            {getStoryTypeName(story.type)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 max-w-3xl mx-auto space-y-4">

        {/* Title + meta */}
        <div>
          <h1 className="text-xl font-black leading-snug mb-3" style={{ color: dm.text }}>
            {story.title}
          </h1>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} color={dm.muted} />
              <span className="text-xs font-semibold" style={{ color: dm.muted }}>
                {story.locality ?? story.district ?? PROVINCE_LABELS[story.province] ?? story.province}
              </span>
            </div>
            {story.period && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} color={dm.muted} />
                <span className="text-xs font-semibold" style={{ color: dm.muted }}>
                  {story.period.start
                    ? `${story.period.start}${story.period.end ? ` – ${story.period.end}` : ''}`
                    : story.period.description}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-2xl" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
          <p className="text-sm font-semibold leading-relaxed italic" style={{ color: dm.text2 }}>
            {story.summary}
          </p>
        </div>

        {/* Full content */}
        <div className="rounded-2xl p-4" style={{ background: dm.surface }}>
          <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: dm.muted }}>
            A História
          </h2>
          {story.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-justify mb-3 last:mb-0"
              style={{ color: dm.text2 }}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Period timeline */}
        {story.period && (story.period.start || story.period.description) && (
          <div className="rounded-2xl p-4" style={{ background: dm.surface }}>
            <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: dm.muted }}>
              Período Histórico
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
              <div>
                {story.period.start && (
                  <p className="text-sm font-black" style={{ color: dm.text }}>
                    {story.period.start}{story.period.end ? ` — ${story.period.end}` : ''}
                  </p>
                )}
                {story.period.description && (
                  <p className="text-xs" style={{ color: dm.muted }}>{story.period.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sources */}
        {story.sources && story.sources.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: dm.surface }}>
            <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: dm.muted }}>
              Fontes
            </h2>
            <div className="space-y-1.5">
              {story.sources.map((src, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                  <p className="text-xs" style={{ color: dm.text2 }}>{src}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
