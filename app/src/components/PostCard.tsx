import { useState } from 'react';
import { Heart, Bookmark, MapPin, Star, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Local } from '@/types';
import { useApp } from '@/context/AppContext';

interface PostCardProps {
  local: Local;
  onPress: () => void;
  onAuthorPress?: () => void;
}

const categoryLabels: Record<string, string> = {
  praia: 'Praia',
  cultura: 'Cultura',
  restaurante: 'Gastronomia',
  aventura: 'Aventura',
  natureza: 'Natureza',
};

const categoryGradients: Record<string, string> = {
  praia: 'from-[#0077B6] to-[#00A8E8]',
  cultura: 'from-[#F4A261] to-[#E9C46A]',
  restaurante: 'from-[#2D6A4F] to-[#40916C]',
  aventura: 'from-[#7C3AED] to-[#A78BFA]',
  natureza: 'from-[#059669] to-[#34D399]',
};

export default function PostCard({ local, onPress, onAuthorPress }: PostCardProps) {
  const { toggleSave, toggleLike } = useApp();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLiked, setIsLiked] = useState(local.liked);
  const [likeCount, setLikeCount] = useState(local.likesCount);
  const [isSaved, setIsSaved] = useState(local.saved);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    toggleLike(local.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(prev => !prev); // toggle visual local — API não tem endpoint de save para locais
    toggleSave(local.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="mb-5"
    >
      {/* Image Container */}
      <div 
        className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100 cursor-pointer group"
        onClick={onPress}
      >
        {/* Skeleton Loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}
        
        {/* Image */}
        <motion.img
          src={local.images[0]}
          alt={local.name}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-105`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />

        {/* Category Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r ${categoryGradients[local.category]} shadow-lg`}>
          <span className="text-white text-xs font-semibold">{categoryLabels[local.category]}</span>
        </div>

        {/* Save Button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleSave}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20 hover:bg-white/30 transition-colors"
        >
          <Bookmark
            size={18}
            className={isSaved ? 'fill-white text-white' : 'text-white'}
          />
        </motion.button>

        {/* Rating Badge - Bottom Left */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
          <Star size={14} className="fill-[#F4A261] text-[#F4A261]" />
          <span className="text-white text-sm font-bold">{local.rating}</span>
          <span className="text-white/70 text-xs">({local.reviewsCount})</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-1 pt-4">
        {/* Title & Location */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-[#0077B6] transition-colors">
              {local.name}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin size={14} className="text-[#0077B6]" />
              <span className="text-sm truncate">{local.location.address}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mt-2 line-clamp-2 leading-relaxed">
          {local.description}
        </p>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              className="flex items-center gap-2 group"
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Heart
                  size={20}
                  className={`transition-colors ${
                    isLiked 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-400 group-hover:text-red-400'
                  }`}
                />
              </motion.div>
              <span className={`text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                {likeCount}
              </span>
            </motion.button>
            
            {/* Reviews */}
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="text-sm">{local.reviewsCount} avaliações</span>
            </div>
          </div>

          {/* View More */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onPress}
            className="flex items-center gap-1 text-[#0077B6] font-semibold text-sm hover:gap-2 transition-all"
          >
            Ver mais
            <ChevronRight size={16} />
          </motion.button>
        </div>

        {/* Author */}
        <motion.button
          className="flex items-center gap-3 mt-4 w-full text-left"
          onClick={onAuthorPress}
          whileHover={onAuthorPress ? { opacity: 0.8 } : {}}
          style={{ cursor: onAuthorPress ? 'pointer' : 'default' }}
        >
          <div className="relative">
            {local.author.avatar ? (
              <img
                src={local.author.avatar}
                alt={local.author.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-md"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center ring-2 ring-white shadow-md">
                <span className="text-xs font-bold text-white">{local.author.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex items-center gap-2 text-sm flex-1">
            <span className="font-semibold text-gray-900">{local.author.name}</span>
            {local.author.type && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: local.author.type === 'guide' ? '#FEF3C7'
                    : local.author.type === 'business' ? '#EBF5FF'
                    : local.author.type === 'resident' ? '#EEF7F0'
                    : '#F3F4F6',
                  color: local.author.type === 'guide' ? '#D97706'
                    : local.author.type === 'business' ? '#3B82F6'
                    : local.author.type === 'resident' ? '#1B5E3B'
                    : '#6B7280',
                }}>
                {local.author.type === 'guide' ? 'Guia'
                  : local.author.type === 'business' ? 'Negócio'
                  : local.author.type === 'resident' ? 'Residente'
                  : 'Viajante'}
              </span>
            )}
            <span className="text-gray-300">•</span>
            <span className="text-gray-400">{local.createdAt}</span>
          </div>
        </motion.button>
      </div>
    </motion.article>
  );
}
