import { motion, AnimatePresence } from 'framer-motion';
import { ALL_STORY_TYPES, getStoryTypeName } from '../types';
import type { StoryType } from '../types';

const TYPE_COLOR: Record<StoryType, string> = {
  'legend':            '#7B5EA7',
  'historical-fact':   '#1B5E3B',
  'curiosity':         '#F4821F',
  'cultural-narrative':'#2BB5C8',
};

interface StoryFilterProps {
  activeType: StoryType | null;
  onChange: (type: StoryType | null) => void;
}

export default function StoryFilter({ activeType, onChange }: StoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {/* Todos */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(null)}
        className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black transition-all"
        style={{
          background: activeType === null ? '#1A1A1A' : 'white',
          color:      activeType === null ? 'white'   : '#6B7280',
          border: `1.5px solid ${activeType === null ? '#1A1A1A' : '#E5E7EB'}`,
        }}
      >
        Todos
      </motion.button>

      {ALL_STORY_TYPES.map(type => {
        const active = activeType === type;
        const color  = TYPE_COLOR[type];
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(active ? null : type)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black transition-all"
            style={{
              background: active ? color   : 'white',
              color:      active ? 'white' : '#6B7280',
              border: `1.5px solid ${active ? color : '#E5E7EB'}`,
            }}
          >
            {getStoryTypeName(type)}
          </motion.button>
        );
      })}
    </div>
  );
}
