import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE, assignLocalBadge, extractImages, mapValidLocal } from '@/utils/dataValidation';
import { translateLocalCategory } from '@/utils/translations';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { IconStar, IconHeart } from '@/components/icons';
import DestinationDetail from '@/pages/DestinationDetail';
import { localsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

interface ProvinciaFeedProps {
  provincia: string;
  onBack: () => void;
}

interface LocalItem {
  id: string; name: string; category: string; desc: string;
  image: string; rating: number; reviews: number;
  badge: string; badgeBg: string; melhorEpoca?: string;
  lat?: number; lng?: number; endereco?: string;
  // Localização — hierarquia completa (campos adicionais vindos de mapValidLocal)
  distrito?: string;
  administrative_post?: string;
  locality?: string;
  nearby_reference?: string;
  location?: {
    country?: string;
    province?: string;
    district?: string;
    administrative_post?: string;
    locality?: string;
    nearby_reference?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  // Contribuidor — opcional, apenas se vier da API
  contributor?: {
    name: string;
    avatar?: string;
    type?: string;
  };
  // Informações adicionais — opcionais, apenas se vierem da API
  tipo?: string;
  destaques?: string[];
  images?: string[];
  [key: string]: any; // permite campos extras de mapValidLocal
}export default function ProvinciaFeed({
  provincia, onBack }: ProvinciaFeedProps) {
  useScrollTop();
  const [locais, setLocais] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocal, setSelectedLocal] = useState<LocalItem | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [suggested, setSuggested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await localsApi.list({ page: 1, limit: 20, province: provincia });
        // Documenta��o 3.1: A API devolve { success: true, locals: [...] }
        const items: any[] = data?.locals || [];
        setLocais(
          items
            .map((item: any) => mapValidLocal(item))
            .filter((item): item is LocalItem => item !== null),
        );
      } catch {
        setLocais([]);
      } finally { setIsLoading(false); }
    };
    load();
  }, [provincia]);

  if (selectedLocal) {
    return (
      <DestinationDetail
        destination={{
          ...selectedLocal,
          // provincia vem via prop (não existe no objecto do local)
          provincia,
        }}
        onBack={() => setSelectedLocal(null)}
        onExploreMore={() => setSelectedLocal(null)}
      />
    );
  }

  return (
    <motion.div
      className="min-h-screen pb-24"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#F3F4F6' }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="text-left">
            <h1 className="text-xl font-black text-left" style={{ color: '#1A1A1A' }}>{provincia}</h1>
            <p className="text-xs text-left" style={{ color: '#9CA3AF' }}>
              {isLoading ? 'A carregar...' : `${locais.length} destinos encontrados`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : locais.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>
            Ainda n�o h� destinos em {provincia}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {locais.map((local) => (
            <motion.div
              key={local.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedLocal(local)}
              className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer"
            >
              {/* Image */}
              <div className="relative" style={{ height: 200 }}>
                <img
                  src={local.image}
                  alt={local.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
                
                {/* Rating - bottom left */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                  <IconStar size={12} fill={local.rating > 0 ? '#FBBF24' : 'none'} stroke={local.rating > 0 ? 'none' : '#9CA3AF'} />
                  <span className="text-white text-xs font-bold">
                    {local.rating > 0 ? local.rating.toFixed(1) : 'Novo'}
                  </span>
                  {local.rating > 0 && local.reviews > 0 && <span className="text-white/80 text-[10px]">({local.reviews})</span>}
                </div>

                {/* Badge - top left */}
                {local.badge && (
                  <span className="absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: local.badgeBg }}>
                    {local.badge}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-2.5">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <h3 className="text-sm font-black mb-0.5 leading-tight" style={{ color: '#1A1A1A' }}>{local.name}</h3>
                    <p className="text-[10px] leading-snug line-clamp-2" style={{ color: '#6B7280' }}>{local.desc}</p>
                  </div>
                  <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                    {local.category}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setLiked(p => ({ ...p, [local.id]: !p[local.id] })); }}
                      style={{ color: liked[local.id] ? '#0EA5E9' : '#9CA3AF' }}
                    >
                      <IconHeart size={13} fill={liked[local.id] ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className="flex items-center gap-0.5 transition-colors"
                      style={{ color: suggested[local.id] ? '#1B5E3B' : '#9CA3AF' }}
                      onClick={e => {
                        e.stopPropagation();
                        setSuggested(p => ({ ...p, [local.id]: !p[local.id] }));
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={suggested[local.id] ? '#1B5E3B' : 'currentColor'} strokeWidth="2">
                        <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                      </svg>
                      <span className="text-[9px] font-semibold">
                        {suggested[local.id] ? 'Sugerido!' : 'Sugerir'}
                      </span>
                    </button>
                  </div>
                  <button className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-white"
                    style={{ background: '#1B5E3B' }}>
                    Ver detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}


