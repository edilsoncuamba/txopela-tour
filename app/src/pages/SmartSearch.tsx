import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, X, MapPin, User, FileText } from 'lucide-react';
import { localsApi, usersApi, postsApi } from '@/services/api';
import type { Local } from '@/types';
import { useScrollTop } from '@/hooks/useScrollTop';

interface SmartSearchProps {
  onLocalPress: (local: Local) => void;
  onBack: () => void;
}

interface SearchResult {
  type: 'location' | 'user' | 'post';
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data: any;
}

export default function SmartSearch({
  onLocalPress, onBack }: SmartSearchProps) {
  useScrollTop();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Histórico de pesquisa em memória (sessão actual)
  useEffect(() => {}, []);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const searchResults: SearchResult[] = [];

      // Search locations
      const { data: localsData } = await localsApi.list({
        search: searchQuery,
      });
      // Documentação 3.1: A API devolve { success: true, locals: [...] }
      const locations = localsData?.locals || [];
      if (locations.length > 0) {
        locations.slice(0, 3).forEach((loc: any) => {
          searchResults.push({
            type: 'location',
            id: loc.id,
            title: loc.name,
            subtitle: loc.location?.address || '',
            icon: <MapPin size={16} className="text-[#0077B6]" />,
            data: loc,
          });
        });
      }

      // Search users
      const { data: usersData } = await usersApi.listUsers();
      if (Array.isArray(usersData)) {
        usersData
          .filter((u: any) =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
          .forEach((user: any) => {
            searchResults.push({
              type: 'user',
              id: user.id,
              title: user.name,
              subtitle: user.type,
              icon: <User size={16} className="text-green-500" />,
              data: user,
            });
          });
      }

      // Search posts
      const { data: postsData } = await postsApi.list({ search: searchQuery, limit: 10 });
      const postsItems = postsData?.posts ?? postsData?.results ?? (Array.isArray(postsData) ? postsData : []);
      postsItems
        .slice(0, 3)
        .forEach((post: any) => {
          searchResults.push({
            type: 'post',
            id: post.id,
            title: (post.title || post.content || '').substring(0, 50),
            subtitle: `por ${post.author?.name || 'Utilizador'}`,
            icon: <FileText size={16} className="text-purple-500" />,
            data: post,
          });
        });

      setResults(searchResults);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);

    // Add to history
    if (searchQuery.trim()) {
      const newHistory = [
        searchQuery,
        ...history.filter(h => h !== searchQuery),
      ].slice(0, 10);
      setHistory(newHistory);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'location') {
      onLocalPress(result.data);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <motion.div
        className="px-4 py-4 flex items-center gap-3 border-b border-gray-100"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} className="text-gray-700" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar lugares, utilizadores, posts..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
          />
        </div>
      </motion.div>

      {/* Content */}
      <main className="px-4 py-4">
        <AnimatePresence mode="wait">
          {query ? (
            // Search Results
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-3 border-[#0077B6]/30 border-t-[#0077B6] rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="flex flex-col items-center justify-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl">??</span>
                  </div>
                  <p className="text-gray-500 text-sm">Nenhum resultado encontrado</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            // Search History
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {history.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Histórico de Pesquisa
                    </h3>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-[#0077B6] hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {history.map((item, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSearch(item)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  className="flex flex-col items-center justify-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl">??</span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    O teu histórico de pesquisa aparecerá aqui.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
