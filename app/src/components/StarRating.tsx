import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 16, 
  interactive = false,
  onRate 
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;
        
        return (
          <motion.button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starValue)}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
          >
            <Star
              size={size}
              className={`transition-all duration-200 ${
                isFilled 
                  ? 'fill-[#F4A261] text-[#F4A261] drop-shadow-sm' 
                  : 'fill-gray-100 text-gray-200'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
