import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import type { Destination, DestinationType } from '../types';
import { getDestinationTypeName } from '../types';
import { PLACEHOLDER_IMAGE } from '@/utils/dataValidation';

const TYPE_COLOR: Record<DestinationType, string> = {
  'beach':          '#2BB5C8',
  'park':           '#1B5E3B',
  'monument':       '#F4821F',
  'museum':         '#7B5EA7',
  'natural-reserve':'#059669',
  'historical-site':'#B45309',
  'viewpoint':      '#0369A1',
  'cultural-center':'#DB2777',
};

interface DestinationCardProps {
  destination: Destination;
  index?: number;
  onPress: () => void;
}

export default function DestinationCard({ destination, index = 0, onPress }: DestinationCardProps) {
  const color    = TYPE_COLOR[destination.type];
  const mainPhoto = destination.photos?.[0]?.url;

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
      {/* Image */}
      <div className="relative w-full overflow-hidden" style={{ height: 160 }}>
        <img
          src={mainPhoto ?? PLACEHOLDER_IMAGE}
          alt={destination.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />

        {/* Type badge */}
        <span className="absolute top-2.5 left-2.5 text-[10px] font-black px-2.5 py-1 rounded-full"
          style={{ background: color, color: 'white' }}>
          {getDestinationTypeName(destination.type)}
        </span>

        {/* Rating */}
        {destination.rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
            <Star size={10} fill="#FBBF24" stroke="none" />
            <span className="text-white text-[11px] font-bold">{destination.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <h3 className="font-black text-sm leading-snug mb-1 line-clamp-1" style={{ color: '#1A1A1A' }}>
          {destination.name}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-2 mb-2.5" style={{ color: '#6B7280' }}>
          {destination.summary}
        </p>
        <div className="flex items-center gap-1">
          <MapPin size={10} color="#94A3B8" />
          <span className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>
            {destination.district}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
