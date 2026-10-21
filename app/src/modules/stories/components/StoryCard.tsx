import { motion } from 'framer-motion';
import { BookOpen, Clock, MapPin } from 'lucide-react';
import type { Story, StoryType } from '../types';
import { getStoryTypeName } from '../types';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';

const TYPE_COLOR: Record<StoryType, string> = {
  'legend':            '#7B5EA7',
  'historical-fact':   '#1B5E3B',
  'curiosity':         '#F4821F',
  'cultural-narrative':'#2BB5C8',
};

const TYPE_BG: Record<StoryType, string> = {
  'legend':            '#F3E8FF',
  'historical-fact':   '#EEF7F0',
  'curiosity':         '#FFF3E0',
  'cultural-narrative':'#E0F7FA',
};

interface StoryCardProps {
  story: Story;
  index?: number;
  onPress: () => void;
}

export default function StoryCard({ story, index = 0, onPress }: StoryCardProps) {
  const color = TYPE_COLOR[story.type];
  const bg    = TYPE_BG[story.type];
  const mainImage = story.images?.[0];

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', damping: 22, stiffness: 260 }}
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      className="w-full text-left rounded-2xl overflow-hidden"
      style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
    >
      {/* Imagem */}
      {mainImage ? (
        <div className="relative w-full overflow-hidden" style={{ height: 140 }}>
          <img
            src={mainImage}
            alt={story.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
          {/* tipo badge */}
          <span className="absolute top-2.5 left-2.5 text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ background: color, color: 'white' }}>
            {getStoryTypeName(story.type)}
          </span>
        </div>
      ) : (
        /* sem imagem — banner colorido */
        <div className="w-full flex items-center justify-center" style={{ height: 80, background: bg }}>
          <BookOpen size={28} color={color} strokeWidth={1.5} />
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-3">
        {!mainImage && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full mb-2 inline-block"
            style={{ background: bg, color }}>
            {getStoryTypeName(story.type)}
          </span>
        )}

        <h3 className="font-black text-sm leading-snug mb-1.5 line-clamp-2"
          style={{ color: '#1A1A1A' }}>
          {story.title}
        </h3>

        <p className="text-xs leading-relaxed line-clamp-2 mb-2.5"
          style={{ color: '#6B7280' }}>
          {story.summary}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <MapPin size={10} color="#94A3B8" />
            <span className="text-[10px] font-semibold capitalize"
              style={{ color: '#94A3B8' }}>
              {story.district ?? story.province}
            </span>
          </div>
          {story.period?.description && (
            <div className="flex items-center gap-1">
              <Clock size={10} color="#94A3B8" />
              <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                {story.period.start ?? story.period.description}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
