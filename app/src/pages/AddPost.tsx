import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Camera, Trash2, Image as ImageIcon,
  Loader2, Check, X, ChevronDown, MapPin,
} from 'lucide-react';
import { postsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { uploadAndCache } from '@/utils/imageCache';
import { useScrollTop } from '@/hooks/useScrollTop';

// ── AddPost ──────────────────────────────────────────────────────────────────
// Implementa exactamente a secção 2.2 da documentação:
//
//   POST /api/posts
//   Content-Type: multipart/form-data
//   Campos: title, content, category, province, location (JSON), tags (JSON), images (File[])
//   Response: { success: true, post: {...} }
// ─────────────────────────────────────────────────────────────────────────────

interface AddPostProps {
  onSuccess: () => void;
  onBack: () => void;
}

const provincias = [
  'Niassa', 'Cabo Delgado', 'Nampula', 'Zambézia', 'Tete',
  'Manica', 'Sofala', 'Inhambane', 'Gaza', 'Maputo Província', 'Cidade de Maputo',
];

const categories = [
  { id: 'praias',    label: 'Praias',           color: '#2BB5C8' },
  { id: 'cultura',   label: 'Cultura & História', color: '#7B5EA7' },
  { id: 'natureza',  label: 'Natureza',          color: '#1B5E3B' },
  { id: 'aventura',  label: 'Aventura',          color: '#F4821F' },
  { id: 'gastronomia', label: 'Gastronomia',     color: '#E05A3A' },
  { id: 'mergulho',  label: 'Mergulho',          color: '#2563EB' },
  { id: 'ecoturismo', label: 'Ecoturismo',       color: '#22C55E' },
  { id: 'outro',     label: 'Outro',             color: '#6B7280' },
];

function PickerSheet({ title, options, value, onSelect, onClose }: {
  title: string;
  options: { id: string; label: string; color?: string }[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div className="relative bg-white rounded-t-3xl pb-8 flex flex-col" style={{ maxHeight: '75vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-4 pt-2 overflow-y-auto pb-4">
          {options.map(opt => (
            <button key={opt.id} onClick={() => { onSelect(opt.id); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-1 transition-all"
              style={{ background: value === opt.id ? '#EEF7F0' : 'transparent' }}>
              <div className="flex items-center gap-3">
                {opt.color && (
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                )}
                <span className="text-sm font-bold" style={{ color: value === opt.id ? '#1B5E3B' : '#1A1A1A' }}>
                  {opt.label}
                </span>
              </div>
              {value === opt.id && <Check size={16} style={{ color: '#1B5E3B' }} />}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AddPost({
  onSuccess, onBack }: AddPostProps) {
  useScrollTop();
  const { user } = useAuth();

  // Campos do formulário — mapeados directamente para os campos da API
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');
  const [tagsInput, setTagsInput] = useState('');   // "tag1, tag2, tag3"
  const [address,  setAddress]  = useState('');
  const [lat,      setLat]      = useState('');
  const [lng,      setLng]      = useState('');

  // Fotos
  const [photos,       setPhotos]       = useState<string[]>([]);  // preview local
  const [imageFiles,   setImageFiles]   = useState<File[]>([]);    // ficheiros reais para envio
  const fileRef = useRef<HTMLInputElement>(null);

  // UI state
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [error,         setError]         = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showProvPicker, setShowProvPicker] = useState(false);

  const selectedCategory = categories.find(c => c.id === category);
  const selectedProvince = provincias.find(p => p === province);

  // ── Selecção de imagens ──────────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 10 - imageFiles.length;
    const toAdd = files.slice(0, remaining);

    // Guarda os ficheiros para envio
    setImageFiles(prev => [...prev, ...toAdd]);

    // Gera previews locais
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(p => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });

    // Limpa o input para permitir re-seleccionar
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submissão — POST /api/posts (multipart/form-data) ────────────────────
  const handleSubmit = async () => {
    setError('');

    // Validação
    if (!title.trim())   return setError('O título é obrigatório.');
    if (!content.trim()) return setError('O conteúdo é obrigatório.');
    if (!category)       return setError('Seleciona a categoria.');
    if (!province)       return setError('Seleciona a província.');

    setIsSubmitting(true);
    try {
      // Constrói o FormData exactamente como a API espera
      const fd = new FormData();
      fd.append('title',    title.trim());
      fd.append('content',  content.trim());
      fd.append('category', category);
      fd.append('province', province);

      // location como JSON string (campo "location" da doc)
      const location = {
        latitude:  lat    ? parseFloat(lat)  : null,
        longitude: lng    ? parseFloat(lng)  : null,
        address:   address.trim() || null,
      };
      fd.append('location', JSON.stringify(location));

      // tags como JSON array (campo "tags" da doc)
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      fd.append('tags', JSON.stringify(tags));

      // images — máximo 10 ficheiros (campo "images" da doc)
      imageFiles.forEach(file => {
        fd.append('images', file);
      });

      const { data, error: apiError } = await postsApi.create(fd);

      if (apiError) {
        setError(typeof apiError === 'string' ? apiError : 'Erro ao publicar. Tenta novamente.');
        return;
      }

      // Guardar imagens no cache local associadas ao post
      const postId = data?.post?.id ?? data?.id;
      if (postId && imageFiles.length > 0) {
        await uploadAndCache(imageFiles, postId, 'post');
      }

      if (data?.success || data?.post || data?.id) {
        setSubmitted(true);
      } else {
        setError('Erro ao publicar. Tenta novamente.');
      }
    } catch {
      setError('Erro inesperado. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Tela de sucesso ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24"
        style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #1B5E3B, #2BB5C8)' }}>
            <Check size={44} className="text-white" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: '#1A1A1A' }}>
            Publicação criada! 🎉
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#6B7280' }}>
            A tua publicação foi partilhada com a comunidade Txopela Tour.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onSuccess}
            className="w-full py-4 rounded-2xl text-white font-black text-base shadow-md"
            style={{ background: '#1B5E3B' }}
          >
            Ver publicações
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Formulário ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
              <ChevronLeft size={20} style={{ color: '#1A1A1A' }} />
            </button>
            <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Nova publicação</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-black text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)' }}
          >
            {isSubmitting
              ? <><Loader2 size={14} className="animate-spin" /> A publicar...</>
              : <><Check size={14} /> Publicar</>
            }
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* Avatar + identificação */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#2BB5C8] to-[#1B5E3B] flex items-center justify-center">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-sm font-black text-white">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            }
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>{user?.name || 'Utilizador'}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Publicação pública</p>
          </div>
        </div>

        {/* Título — campo "title" da API */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            TÍTULO <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 100))}
            placeholder="Dá um título à tua publicação..."
            className="w-full text-base font-semibold focus:outline-none bg-transparent"
            style={{ color: '#1A1A1A' }}
          />
          <p className="text-right text-[10px] mt-1" style={{ color: '#C7C7CC' }}>{title.length}/100</p>
        </div>

        {/* Conteúdo — campo "content" da API */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            CONTEÚDO <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 2000))}
            placeholder="Partilha a tua experiência, dicas ou descobertas..."
            rows={5}
            className="w-full text-sm focus:outline-none bg-transparent resize-none leading-relaxed"
            style={{ color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
          />
          <p className="text-right text-[10px]" style={{ color: '#C7C7CC' }}>{content.length}/2000</p>
        </div>

        {/* Fotos — campo "images" da API (max 10) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-3" style={{ color: '#6B7280' }}>
            FOTOS <span style={{ color: '#9CA3AF' }}>(máx. 10)</span>
          </label>

          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-3">
              {photos.map((src, i) => (
                <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden"
                  style={{ width: 90, height: 90 }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: '#1B5E3B' }}>Principal</span>
                  )}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <button onClick={() => fileRef.current?.click()}
                  className="flex-shrink-0 rounded-xl border-2 border-dashed flex items-center justify-center"
                  style={{ width: 90, height: 90, borderColor: '#E5E7EB' }}>
                  <ImageIcon size={20} className="text-gray-300" />
                </button>
              )}
            </div>
          )}

          {photos.length === 0 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 py-6 rounded-2xl border-2 border-dashed"
              style={{ borderColor: '#1B5E3B', background: '#EEF7F0' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#1B5E3B' }}>
                <Camera size={22} className="text-white" />
              </div>
              <p className="text-sm font-black" style={{ color: '#1B5E3B' }}>Adicionar fotos</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>JPG, PNG até 10MB cada</p>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Categoria — campo "category" da API */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            CATEGORIA <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <button
            onClick={() => setShowCatPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm"
            style={{ borderColor: selectedCategory ? selectedCategory.color : '#E5E7EB', color: selectedCategory ? '#1A1A1A' : '#9CA3AF' }}
          >
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <div className="w-3 h-3 rounded-full" style={{ background: selectedCategory.color }} />
              )}
              <span className="font-semibold">
                {selectedCategory ? selectedCategory.label : 'Seleciona a categoria...'}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Província — campo "province" da API */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            PROVÍNCIA <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <button
            onClick={() => setShowProvPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm"
            style={{ borderColor: '#E5E7EB', color: selectedProvince ? '#1A1A1A' : '#9CA3AF' }}
          >
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: '#2BB5C8' }} />
              <span className="font-semibold">{selectedProvince || 'Seleciona a província...'}</span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Localização — campo "location" da API (JSON: latitude, longitude, address) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <label className="block text-xs font-black" style={{ color: '#6B7280' }}>
            LOCALIZAÇÃO <span style={{ color: '#9CA3AF' }}>(opcional)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Endereço ou referência..."
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder="Latitude"
              className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
            />
            <input
              type="number"
              value={lng}
              onChange={e => setLng(e.target.value)}
              placeholder="Longitude"
              className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
            />
          </div>
        </div>

        {/* Tags — campo "tags" da API (JSON array) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            TAGS <span style={{ color: '#9CA3AF' }}>(opcional, separadas por vírgula)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="praia, tofo, mergulho, moçambique..."
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
          />
          {tagsInput && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Erro */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-4 py-3 rounded-2xl flex items-center gap-2"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão publicar (mobile — em baixo) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl text-white font-black text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
          style={{
            background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
            boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
          }}
        >
          {isSubmitting
            ? <><Loader2 size={16} className="animate-spin" /> A publicar...</>
            : <><Check size={16} /> Publicar</>
          }
        </motion.button>

        <div className="h-4" />
      </div>

      {/* Pickers */}
      <AnimatePresence>
        {showCatPicker && (
          <PickerSheet
            title="Categoria"
            options={categories}
            value={category}
            onSelect={setCategory}
            onClose={() => setShowCatPicker(false)}
          />
        )}
        {showProvPicker && (
          <PickerSheet
            title="Província"
            options={provincias.map(p => ({ id: p, label: p }))}
            value={province}
            onSelect={setProvince}
            onClose={() => setShowProvPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
