import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Upload, X } from 'lucide-react';
import { postsApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

interface EditPostProps {
  postId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

const categories = ['Praias', 'Montanhas', 'Cidades', 'Cultura', 'Vida selvagem', 'Aventura', 'Gastronomia', 'Outro'];
const provinces = ['Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'];

export default function EditPost({
  postId, onBack, onSuccess }: EditPostProps) {
  useScrollTop();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do post
  useEffect(() => {
    const loadPost = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await postsApi.get(postId);
        if (error) {
          setError(error);
          return;
        }
        if (data) {
          // A API pode devolver o post directamente ou dentro de { post: {...} }
          const post = data.post ?? data;
          setTitle(post.title || '');
          setContent(post.content || '');
          setCategory(post.category || '');
          setProvince(post.province || '');
        }
      } catch (err) {
        setError('Erro ao carregar o post');
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [postId]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }
    if (!content.trim()) {
      setError('O conteúdo é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // PUT /api/posts/{id}/ — multipart/form-data conforme OpenAPI
      const fd = new FormData();
      fd.append('title',   title.trim());
      fd.append('content', content.trim());
      if (category) fd.append('category', category);
      if (province) fd.append('province', province);

      const { data, error: apiError } = await postsApi.update(postId, fd);
      if (apiError) {
        setError(apiError);
        return;
      }

      onSuccess?.();
      onBack();
    } catch (err) {
      setError('Erro ao guardar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-green-700 font-medium">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} color="#1B5E3B" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Editar Post</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-700 text-white rounded-full text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 max-w-2xl mx-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Título */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do post"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Conteúdo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Descreve o teu post..."
            rows={6}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Categoria */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Província */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Província
          </label>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Selecione uma província</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> Apenas o título, conteúdo, categoria e província podem ser editados. As imagens não podem ser alteradas após a criação.
          </p>
        </div>
      </div>
    </div>
  );
}
