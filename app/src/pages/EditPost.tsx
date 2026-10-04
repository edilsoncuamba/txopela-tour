import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, MapPin,
  Camera, Image as ImageIcon, X, Star,
  GripVertical, AlertCircle, Loader2, Check,
} from 'lucide-react';
import { postsApi, uploadApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

// ── EditPost ──────────────────────────────────────────────────────────────────
// PUT /api/posts/{id}/   Content-Type: multipart/form-data
// PostWriteRequest: title*, content*, category, province, location(JSON),
//                  tags(JSON), images(File[] max:10)
// Imagens existentes (URLs) são preservadas ou removidas via
//   DELETE /api/upload/images/{id}/
// Novas imagens (File) são enviadas como campo "images" no PUT
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMAGES     = 10;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

interface EditPostProps {
  postId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

// Imagem já existente no servidor
interface ExistingImage {
  kind: 'existing';
  id: string;      // UUID da imagem no servidor (para DELETE)
  url: string;     // URL para pré-visualização
  toDelete: boolean;
}

// Nova imagem seleccionada localmente
interface NewImage {
  kind: 'new';
  id: string;      // UUID local (para key/reordenação)
  preview: string; // data-URL
  file: File;
}

type ImageSlot = ExistingImage | NewImage;

const POST_CATEGORIES = [
  { id: 'discovery', label: 'Descoberta',   color: '#2BB5C8' },
  { id: 'review',    label: 'Avaliação',    color: '#F4821F' },
  { id: 'tip',       label: 'Dica',         color: '#1B5E3B' },
  { id: 'story',     label: 'História',     color: '#7B5EA7' },
  { id: 'other',     label: 'Outro',        color: '#6B7280' },
];

const PROVINCES = [
  'Niassa', 'Cabo Delgado', 'Nampula', 'Zambézia', 'Tete',
  'Manica', 'Sofala', 'Inhambane', 'Gaza', 'Maputo Província', 'Cidade de Maputo',
];

// ── Picker reutilizável ───────────────────────────────────────────────────────
function PickerSheet({ title, options, value, onSelect, onClose }: {
  title: string;
  options: { id: string; label: string; color?: string }[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-t-3xl pb-8 flex flex-col"
        style={{ maxHeight: '75vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
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
            <button
              key={opt.id}
              onClick={() => { onSelect(opt.id); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-1 transition-all"
              style={{ background: value === opt.id ? '#EEF7F0' : 'transparent' }}
            >
              <div className="flex items-center gap-3">
                {opt.color && <div className="w-3 h-3 rounded-full" style={{ background: opt.color }} />}
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

// ── Grelha de imagens ─────────────────────────────────────────────────────────
function ImageGrid({
  slots,
  onRemoveExisting,
  onRemoveNew,
  onMoveToFront,
  onAdd,
  totalVisible,
}: {
  slots: ImageSlot[];
  onRemoveExisting: (id: string) => void;
  onRemoveNew: (id: string) => void;
  onMoveToFront: (id: string) => void;
  onAdd: () => void;
  totalVisible: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot, i) => {
        if (slot.kind === 'existing' && slot.toDelete) return null;

        const src = slot.kind === 'existing' ? slot.url : slot.preview;
        const isFirst = i === 0 || (slots[0].kind === 'existing' && (slots[0] as ExistingImage).toDelete && i === 1);

        return (
          <motion.div
            key={slot.id}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18 }}
            className="relative rounded-xl overflow-hidden flex-shrink-0"
            style={{ width: 90, height: 90 }}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />

            {/* Badge principal */}
            {i === 0 && (
              <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: '#1B5E3B' }}>
                <Star size={8} className="text-white" fill="white" />
                <span className="text-[8px] font-black text-white leading-none">Capa</span>
              </div>
            )}

            {/* Badge "existente" */}
            {slot.kind === 'existing' && (
              <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.55)' }}>
                <span className="text-[8px] text-white/80 leading-none">Guardada</span>
              </div>
            )}

            {/* Botão remover */}
            <button
              onClick={() => slot.kind === 'existing' ? onRemoveExisting(slot.id) : onRemoveNew(slot.id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              title="Remover imagem"
            >
              <X size={10} className="text-white" />
            </button>

            {/* Tornar capa */}
            {i !== 0 && (
              <button
                onClick={() => onMoveToFront(slot.id)}
                className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.55)' }}
                title="Tornar capa"
              >
                <GripVertical size={8} className="text-white" />
                <span className="text-[8px] text-white/90 leading-none">Capa</span>
              </button>
            )}
          </motion.div>
        );
      })}

      {/* Botão adicionar */}
      {totalVisible < MAX_IMAGES && (
        <button
          onClick={onAdd}
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 flex-shrink-0 hover:border-green-400 transition-colors"
          style={{ width: 90, height: 90, borderColor: '#D1D5DB' }}
        >
          <ImageIcon size={20} className="text-gray-300" />
          <span className="text-[9px] text-gray-400 font-semibold">Adicionar</span>
        </button>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function EditPost({ postId, onBack, onSuccess }: EditPostProps) {
  useScrollTop();

  // Campos de texto
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');
  const [address,  setAddress]  = useState('');
  const [lat,      setLat]      = useState('');
  const [lng,      setLng]      = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Imagens — mistura de existentes + novas
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [imgErrors, setImgErrors] = useState<string[]>([]);

  // UI
  const [isLoading,      setIsLoading]      = useState(true);
  const [isSaving,       setIsSaving]       = useState(false);
  const [loadError,      setLoadError]      = useState<string | null>(null);
  const [saveError,      setSaveError]      = useState('');
  const [showCatPicker,  setShowCatPicker]  = useState(false);
  const [showProvPicker, setShowProvPicker] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCategory = POST_CATEGORIES.find(c => c.id === category);
  const selectedProvince = PROVINCES.find(p => p === province);

  // Número de imagens visíveis (não marcadas para delete)
  const visibleCount = slots.filter(s => !(s.kind === 'existing' && s.toDelete)).length;

  // ── Carregar post existente ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await postsApi.get(postId);
        if (error) { setLoadError(error); return; }
        const post = data?.post ?? data;
        if (!post) { setLoadError('Post não encontrado.'); return; }

        setTitle(post.title || '');
        setContent(post.content || '');
        setCategory(post.category || '');
        setProvince(post.province || '');

        const loc = post.location || {};
        setAddress(loc.address || '');
        setLat(loc.latitude  != null ? String(loc.latitude)  : '');
        setLng(loc.longitude != null ? String(loc.longitude) : '');

        // Tags — o campo pode vir como array ou JSON string
        const rawTags = post.tags;
        if (Array.isArray(rawTags)) {
          setTagsInput(rawTags.join(', '));
        } else if (typeof rawTags === 'string' && rawTags.startsWith('[')) {
          try { setTagsInput((JSON.parse(rawTags) as string[]).join(', ')); } catch { setTagsInput(rawTags); }
        } else if (typeof rawTags === 'string') {
          setTagsInput(rawTags);
        }

        // Imagens existentes
        const imgs: string[] = post.images ?? [];
        const existing: ExistingImage[] = imgs.map((url, i) => ({
          kind: 'existing',
          // O OpenAPI não devolve IDs separados para as imagens dentro do PostDetail,
          // usamos o índice como fallback para key local; DELETE real usa o endpoint
          // /api/upload/images/{id}/ — quando disponível extrai ID do URL.
          id: extractImageId(url) ?? `existing-${i}-${Date.now()}`,
          url,
          toDelete: false,
        }));
        setSlots(existing);
      } catch {
        setLoadError('Erro ao carregar o post.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [postId]);

  // Tenta extrair UUID do URL da imagem (ex: /media/images/abc-uuid.jpg → abc-uuid)
  function extractImageId(url: string): string | null {
    const match = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return match ? match[1] : null;
  }

  // ── Marcar existente para remoção ─────────────────────────────────────────
  const markExistingForDelete = useCallback((id: string) => {
    setSlots(prev => prev.map(s =>
      s.kind === 'existing' && s.id === id ? { ...s, toDelete: true } : s
    ));
  }, []);

  // ── Remover nova imagem ───────────────────────────────────────────────────
  const removeNew = useCallback((id: string) => {
    setSlots(prev => prev.filter(s => !(s.kind === 'new' && s.id === id)));
  }, []);

  // ── Mover para frente (capa) ──────────────────────────────────────────────
  const moveToFront = useCallback((id: string) => {
    setSlots(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }, []);

  // ── Selecção de novas imagens ─────────────────────────────────────────────
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const errors: string[] = [];

    files.forEach(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" — tipo não suportado (use JPEG, PNG, WEBP ou GIF).`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`"${file.name}" — tamanho excede 10 MB.`);
        return;
      }
      // Conta imagens que serão mantidas
      const currentVisible = slots.filter(s => !(s.kind === 'existing' && (s as ExistingImage).toDelete)).length;
      const newImages = slots.filter(s => s.kind === 'new').length;
      if (currentVisible + newImages >= MAX_IMAGES) {
        errors.push(`Limite de ${MAX_IMAGES} imagens atingido — "${file.name}" ignorado.`);
        return;
      }

      const id = `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlots(prev => [...prev, { kind: 'new', id, preview: reader.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });

    if (errors.length > 0) setImgErrors(errors);
    if (fileRef.current) fileRef.current.value = '';
  }, [slots]);

  // ── Guardar alterações ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError('');
    setImgErrors([]);

    if (!title.trim())   return setSaveError('O título é obrigatório.');
    if (!content.trim()) return setSaveError('O conteúdo é obrigatório.');

    setIsSaving(true);
    try {
      // 1. Eliminar imagens marcadas para delete via /api/upload/images/{id}/
      const toDelete = slots.filter(
        s => s.kind === 'existing' && (s as ExistingImage).toDelete
      ) as ExistingImage[];

      for (const img of toDelete) {
        // Só tenta apagar se o ID parece um UUID real (não um fallback local)
        if (/^[0-9a-f-]{36}$/i.test(img.id)) {
          await uploadApi.deleteImage(img.id);
        }
      }

      // 2. PUT /api/posts/{id}/ com novos dados + novas imagens
      const fd = new FormData();
      fd.append('title',   title.trim());
      fd.append('content', content.trim());
      if (category) fd.append('category', category);
      if (province) fd.append('province', province);

      const location = {
        latitude:  lat     ? parseFloat(lat)  : null,
        longitude: lng     ? parseFloat(lng)  : null,
        address:   address.trim() || null,
      };
      fd.append('location', JSON.stringify(location));

      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      fd.append('tags', JSON.stringify(tags));

      // Novas imagens — campo "images" conforme PostWriteRequest
      const newImages = slots.filter(s => s.kind === 'new') as NewImage[];
      newImages.forEach(img => fd.append('images', img.file));

      const { error: apiError } = await postsApi.update(postId, fd);
      if (apiError) {
        setSaveError(typeof apiError === 'string' ? apiError : 'Erro ao guardar. Tenta novamente.');
        return;
      }

      onSuccess?.();
      onBack();
    } catch {
      setSaveError('Erro inesperado. Tenta novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Estados de carregamento / erro ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5F0' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#1B5E3B] rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">A carregar publicação...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F5F5F0' }}>
        <div className="text-center space-y-3">
          <AlertCircle size={40} className="mx-auto text-red-400" />
          <p className="text-sm font-bold text-red-500">{loadError}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl text-sm font-black text-white"
            style={{ background: '#1B5E3B' }}
          >
            Voltar
          </button>
        </div>
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
            <button
              onClick={onBack}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={20} style={{ color: '#1A1A1A' }} />
            </button>
            <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Editar publicação</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-sm font-black text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)' }}
          >
            {isSaving
              ? <><Loader2 size={14} className="animate-spin" /> A guardar...</>
              : <><Check size={14} /> Guardar</>
            }
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* Título */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            TÍTULO <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 300))}
            placeholder="Título da publicação..."
            className="w-full text-base font-semibold focus:outline-none bg-transparent"
            style={{ color: '#1A1A1A' }}
          />
          <p className="text-right text-[10px] mt-1" style={{ color: title.length > 280 ? '#EF4444' : '#C7C7CC' }}>
            {title.length}/300
          </p>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            CONTEÚDO <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 5000))}
            placeholder="Conteúdo da publicação..."
            rows={6}
            className="w-full text-sm focus:outline-none bg-transparent resize-none leading-relaxed"
            style={{ color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
          />
          <p className="text-right text-[10px]" style={{ color: content.length > 4800 ? '#EF4444' : '#C7C7CC' }}>
            {content.length}/5000
          </p>
        </div>

        {/* ── FOTOS ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-black" style={{ color: '#6B7280' }}>
              FOTOS{' '}
              <span style={{ color: '#9CA3AF' }}>({visibleCount}/{MAX_IMAGES})</span>
            </label>
            {visibleCount > 0 && (
              <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
                A primeira imagem é a capa
              </span>
            )}
          </div>

          {/* Imagens marcadas para remoção — aviso */}
          {slots.some(s => s.kind === 'existing' && (s as ExistingImage).toDelete) && (
            <div className="mb-3 px-3 py-2 rounded-xl flex items-start gap-2"
              style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: '#92400E' }}>
                {slots.filter(s => s.kind === 'existing' && (s as ExistingImage).toDelete).length} imagem(ns) será(ão) removida(s) ao guardar.{' '}
                <button
                  onClick={() => setSlots(prev => prev.map(s =>
                    s.kind === 'existing' ? { ...s, toDelete: false } : s
                  ))}
                  className="underline font-bold"
                >
                  Desfazer
                </button>
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {visibleCount === 0 ? (
              <motion.button
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-8 rounded-2xl border-2 border-dashed transition-colors hover:border-green-400 hover:bg-green-50/50"
                style={{ borderColor: '#1B5E3B', background: '#EEF7F0' }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}
                >
                  <Camera size={26} className="text-white" />
                </div>
                <p className="text-sm font-black" style={{ color: '#1B5E3B' }}>Adicionar fotos</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  JPEG, PNG, WEBP, GIF · máx. 10MB cada · até {MAX_IMAGES} fotos
                </p>
              </motion.button>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ImageGrid
                  slots={slots}
                  onRemoveExisting={markExistingForDelete}
                  onRemoveNew={removeNew}
                  onMoveToFront={moveToFront}
                  onAdd={() => fileRef.current?.click()}
                  totalVisible={visibleCount}
                />
                {visibleCount < MAX_IMAGES && (
                  <p className="text-[10px] mt-2" style={{ color: '#9CA3AF' }}>
                    Podes adicionar mais {MAX_IMAGES - visibleCount} foto{MAX_IMAGES - visibleCount !== 1 ? 's' : ''}.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Erros de validação */}
          <AnimatePresence>
            {imgErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="mt-3 space-y-1"
              >
                {imgErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-1.5 px-3 py-2 rounded-xl"
                    style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                    <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: '#92400E' }}>{err}</p>
                  </div>
                ))}
                <button onClick={() => setImgErrors([])} className="text-[10px] font-bold" style={{ color: '#9CA3AF' }}>
                  Fechar avisos
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_ACCEPT}
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Categoria */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>CATEGORIA</label>
          <button
            onClick={() => setShowCatPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm"
            style={{
              borderColor: selectedCategory ? selectedCategory.color : '#E5E7EB',
              color: selectedCategory ? '#1A1A1A' : '#9CA3AF',
            }}
          >
            <div className="flex items-center gap-2">
              {selectedCategory && <div className="w-3 h-3 rounded-full" style={{ background: selectedCategory.color }} />}
              <span className="font-semibold">
                {selectedCategory ? selectedCategory.label : 'Seleciona a categoria...'}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Província */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>PROVÍNCIA</label>
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

        {/* Localização */}
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

        {/* Tags */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            TAGS <span style={{ color: '#9CA3AF' }}>(separadas por vírgula)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="praia, tofo, mergulho..."
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

        {/* Erro de gravação */}
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="px-4 py-3 rounded-2xl flex items-center gap-2"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <AlertCircle size={14} style={{ color: '#EF4444' }} />
              <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>{saveError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão guardar (mobile) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 rounded-2xl text-white font-black text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
          style={{
            background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
            boxShadow: '0 4px 18px rgba(15,76,42,0.38)',
          }}
        >
          {isSaving
            ? <><Loader2 size={16} className="animate-spin" /> A guardar...</>
            : <><Check size={16} /> Guardar alterações</>
          }
        </motion.button>

        <div className="h-4" />
      </div>

      {/* Pickers */}
      <AnimatePresence>
        {showCatPicker && (
          <PickerSheet
            title="Categoria"
            options={POST_CATEGORIES}
            value={category}
            onSelect={setCategory}
            onClose={() => setShowCatPicker(false)}
          />
        )}
        {showProvPicker && (
          <PickerSheet
            title="Província"
            options={PROVINCES.map(p => ({ id: p, label: p }))}
            value={province}
            onSelect={setProvince}
            onClose={() => setShowProvPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
