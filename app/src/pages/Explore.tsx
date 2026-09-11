import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Grid, List, MapPin, Star, Heart } from 'lucide-react';
import Header from '@/components/Header';
import { localsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';
import type { Local } from '@/types';
import { extractImages, PLACEHOLDER_IMAGE } from '@/utils/dataValidation';

interface ExploreProps {
  onLocalPress: (local: Local) => void;
  onNotifications: () => void;
  onChat: () => void;
}

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'praias', label: 'Praias' },
  { id: 'cultura', label: 'Cultura' },
  { id: 'gastronomia', label: 'Gastronomia' },
  { id: 'aventura', label: 'Aventura' },
  { id: 'natureza', label: 'Natureza' },
];

export default function Explore({
  onLocalPress, onNotifications, onChat }: ExploreProps) {
  useScrollTop();
  const [locais, setLocais] = useState<Local[]>([]);
  const [filteredLocais, setFilteredLocais] = useState<Local[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');

  // Fetch locations from real API (endpoint corrigido para /api/places)
  useEffect(() => {
    const fetchLocais = async () => {
      try {
        setIsLoading(true);
        const { data } = await localsApi.list();
        // Confirmado: API devolve { success, locals: [...], pagination: {...} }
        const results = data?.locals || data?.results || [];
        // Mapeia campos da API para o tipo Local do frontend
        const mapped = results.map((p: any) => ({
          id:          p.id,
          name:        p.name,
          description: p.description || '',
          category:    p.category || 'natureza',
          images:      (() => { const imgs = extractImages(p); return imgs.length > 0 ? imgs : [PLACEHOLDER_IMAGE]; })(),
          location: {
            lat:     p.location?.latitude || 0,
            lng:     p.location?.longitude || 0,
            address: p.location?.address || '',
          },
          rating:       parseFloat(p.rating?.average || p.average_rating || p.rating || 0),
          reviewsCount: p.rating?.count || p.total_reviews || p.reviews_count || 0,
          author:       p.author || { id: '', name: '', email: '', type: 'traveler' },
          createdAt:    p.created_at || new Date().toISOString(),
          saved:        p.is_saved || false,
          liked:        p.is_liked || false,
          likesCount:   p.likes_count || 0,
          savesCount:   p.saves_count || 0,
        }));
        setLocais(mapped);
        setFilteredLocais(mapped);
      } catch (err) {
        console.error('Failed to fetch locations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocais();
  }, []);

  // Filter and sort
  useEffect(() => {
    let filtered = locais;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(l => l.category === activeCategory);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'recent':
        filtered.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    setFilteredLocais(filtered);
  }, [locais, activeCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 scrollbar-hide">
      <Header onNotifications={onNotifications} onChat={onChat} />

      {/* Search Bar */}
      <motion.div
        className="px-4 py-4 sticky top-[73px] z-20 bg-gray-50/50 backdrop-blur-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar em todo Moçambique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#0077B6] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#0077B6] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List size={18} />
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077B6] hover:border-[#0077B6] transition-colors cursor-pointer"
          >
            <option value="popular">Populares</option>
            <option value="rating">Melhor avaliados</option>
            <option value="recent">Recentes</option>
          </select>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        className="sticky top-[140px] z-20 bg-gray-50/50 backdrop-blur-xl py-3 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat, index) => (
            <motion.button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#0077B6] text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <main className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#0077B6]/30 border-t-[#0077B6] rounded-full animate-spin" />
          </div>
        ) : filteredLocais.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}
          >
            {filteredLocais.map((local, index) => (
              <motion.div
                key={local.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onLocalPress(local)}
                className={`cursor-pointer group overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all ${
                  viewMode === 'list' ? 'flex gap-3' : ''
                }`}
              >
                {/* Image */}
                <div className={`relative overflow-hidden bg-gray-200 ${
                  viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'w-full h-40'
                }`}>
                  <img
                    src={local.images[0]}
                    alt={local.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>

                {/* Info */}
                <div className={`p-3 flex-1 flex flex-col justify-between ${
                  viewMode === 'list' ? '' : ''
                }`}>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                      {local.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1 flex items-center gap-1 mt-1">
                      <MapPin size={12} />
                      {local.location.address}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold text-gray-900">
                        {local.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{local.likesCount}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">??</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum local encontrado</h3>
            <p className="text-gray-500 text-sm text-center">
              Tente uma busca diferente ou explore outras categorias
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
