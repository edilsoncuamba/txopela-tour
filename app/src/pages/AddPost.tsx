import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, ArrowRight, Check, X,
  MapPin, Camera, Image as ImageIcon,
  Loader2, AlertCircle, Star, GripVertical,
  Waves, Landmark, TreePine, Utensils, Anchor,
  Compass, Fish, Leaf, MoreHorizontal, PartyPopper, Search, Globe,
} from 'lucide-react';
import { postsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { uploadAndCache, cacheImages } from '@/utils/imageCache';
import { useScrollTop } from '@/hooks/useScrollTop';
import LocationPicker, { type GeoFields, type LocationSource } from '@/components/LocationPicker';

// ── AddPost ──────────────────────────────────────────────────────────────────
// POST /api/posts/   Content-Type: multipart/form-data
// Schema (PostWriteRequest — OpenAPI):
//   title*  (str, max 300)
//   content* (str)
//   category  (discovery|review|tip|story|other, default: discovery)
//   province  (str, max 100)
//   location  (JSON: {"latitude":0,"longitude":0,"address":""})
//   tags      (JSON array: ["tag1","tag2"])
//   images    (File[], max 10, 10 MB cada — JPEG|PNG|WEBP|GIF)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMAGES     = 10;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

const STEP_COLORS = ['#1B5E3B', '#0077B6', '#2BB5C8', '#7B5EA7'];

const steps = [
  { n: 1, label: 'Detalhes'    },
  { n: 2, label: 'Localização' },
  { n: 3, label: 'Fotos'       },
  { n: 4, label: 'Revisão'     },
];

// Categorias alinhadas com as cores do AddLocal
const POST_CATEGORIES = [
  { id: 'discovery', label: 'Praias',          color: '#2BB5C8',
    icon: <Waves size={18} strokeWidth={1.8} /> },
  { id: 'story',     label: 'Cultura & História', color: '#7B5EA7',
    icon: <Landmark size={18} strokeWidth={1.8} /> },
  { id: 'tip',       label: 'Natureza',         color: '#1B5E3B',
    icon: <TreePine size={18} strokeWidth={1.8} /> },
  { id: 'review',    label: 'Aventura',          color: '#0077B6',
    icon: <Compass size={18} strokeWidth={1.8} /> },
  { id: 'other',     label: 'Gastronomia',       color: '#E05A3A',
    icon: <Utensils size={18} strokeWidth={1.8} /> },
  { id: 'tip2',      label: 'Mergulho',          color: '#3498DB',
    icon: <Fish size={18} strokeWidth={1.8} /> },
  { id: 'story2',    label: 'Ecoturismo',        color: '#27AE60',
    icon: <Leaf size={18} strokeWidth={1.8} /> },
  { id: 'outro',     label: 'Outro',             color: '#6B7280',
    icon: <MoreHorizontal size={18} strokeWidth={1.8} />,
    customLabel: 'Adicionar personalizado' },
];

// Mapeia o label de display para o valor aceite pela API (PostWriteCategoryEnum)
const CATEGORY_API_MAP: Record<string, string> = {
  'Praias':            'discovery',
  'Cultura & História':'story',
  'Natureza':          'tip',
  'Aventura':          'review',
  'Gastronomia':       'other',
  'Mergulho':          'discovery',
  'Ecoturismo':        'tip',
  'Outro':             'other',
};

// tags pré-definidas sugeridas
const TAG_OPTIONS = [
  { id: 'praia',      label: 'Praia',        color: '#2BB5C8',
    icon: <Waves size={16} strokeWidth={1.8} /> },
  { id: 'natureza',   label: 'Natureza',     color: '#1B5E3B',
    icon: <TreePine size={16} strokeWidth={1.8} /> },
  { id: 'historia',   label: 'História',     color: '#7B5EA7',
    icon: <Landmark size={16} strokeWidth={1.8} /> },
  { id: 'gastronomia',label: 'Gastronomia',  color: '#E05A3A',
    icon: <Utensils size={16} strokeWidth={1.8} /> },
  { id: 'cultura',    label: 'Cultura',      color: '#9B59B6',
    icon: <Leaf size={16} strokeWidth={1.8} /> },
  { id: 'aventura',   label: 'Aventura',     color: '#0077B6',
    icon: <Compass size={16} strokeWidth={1.8} /> },
  { id: 'mergulho',   label: 'Mergulho',     color: '#3498DB',
    icon: <Fish size={16} strokeWidth={1.8} /> },
  { id: 'ilha',       label: 'Ilha',         color: '#2BB5C8',
    icon: <Anchor size={16} strokeWidth={1.8} /> },
];

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface AddPostProps {
  onSuccess: (postId?: string, hasLocation?: boolean) => void;
  onBack: () => void;
}

interface ImageItem {
  id: string;
  preview: string;
  file: File;
}

// ── StepBar ───────────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div className="w-full mt-3" style={{
      display: 'grid',
      gridTemplateColumns: '28px 1fr 28px 1fr 28px 1fr 28px',
      alignItems: 'center',
    }}>
      {steps.map((s, i) => {
        const active = s.n === current;
        const done   = s.n < current;
        const color  = STEP_COLORS[i];
        return (
          <>
            <div key={`step-${s.n}`} className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{
                  background: (active || done) ? color : 'white',
                  border: `2px solid ${(active || done) ? color : '#E5E7EB'}`,
                  color: (active || done) ? 'white' : '#9CA3AF',
                }}>
                {done ? <Check size={12} /> : s.n}
              </div>
              <span className="text-[9px] font-bold mt-1 text-center whitespace-nowrap"
                style={{ color: (active || done) ? color : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div key={`line-${i}`} className="h-px"
                style={{ background: done ? color : '#E5E7EB', marginBottom: 16 }} />
            )}
          </>
        );
      })}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
function PageHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div className="bg-white px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#F3F4F6' }}
          >
            <ChevronLeft size={20} style={{ color: '#1A1A1A' }} strokeWidth={2} />
          </button>
          <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>Sugerir publicação</h1>
        </div>
        <StepBar current={step} />
      </div>
    </div>
  );
}

// ── MultiSelectSheet — padrão idêntico ao AddService ─────────────────────────
function MultiSelectSheet({ title, options, selected, color, onToggle, onAddCustom, onClose }: {
  title: string;
  options: { id: string; label: string; icon: React.ReactNode; color: string }[];
  selected: string[];
  color: string;
  onToggle: (v: string) => void;
  onAddCustom?: (v: string) => void;
  onClose: () => void;
}) {
  const [customValue, setCustomValue] = useState('');
  const [showCustom,  setShowCustom]  = useState(false);
  const customItems = selected.filter(s => !options.find(o => o.label === s));

  const handleAdd = () => {
    const v = customValue.trim();
    if (v && onAddCustom) { onAddCustom(v); setCustomValue(''); setShowCustom(false); }
  };

  return (
    <motion.div
      className="fixed z-50 flex items-center justify-center"
      style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        className="relative flex flex-col"
        style={{ width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(85vh - 40px)', background: 'white', borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div>
            <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>{title}</h3>
            {selected.length > 0 && (
              <p className="text-xs mt-0.5 font-bold" style={{ color }}>
                {selected.length} selecionado{selected.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
            <X size={15} style={{ color: '#6B7280' }} />
          </button>
        </div>
        <div className="mx-5 mb-1 h-px" style={{ background: '#F3F4F6' }} />

        {/* Lista */}
        <div className="px-3 py-2 overflow-y-auto flex-1">
          {options.map(opt => {
            const active = selected.includes(opt.label);
            return (
              <motion.button key={opt.id} whileTap={{ scale: 0.97 }}
                onClick={() => onToggle(opt.label)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1 transition-all"
                style={{ background: active ? opt.color + '12' : 'transparent' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: active ? opt.color : opt.color + '18', color: active ? 'white' : opt.color, boxShadow: active ? `0 4px 12px ${opt.color}40` : 'none' }}>
                  {opt.icon}
                </div>
                <span className="text-sm font-bold flex-1 text-left transition-all"
                  style={{ color: active ? opt.color : '#374151' }}>
                  {opt.label}
                </span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: active ? opt.color : '#F3F4F6' }}>
                  {active && <Check size={11} color="white" strokeWidth={3} />}
                </div>
              </motion.button>
            );
          })}

          {/* Itens custom */}
          {customItems.map(item => (
            <motion.button key={item} whileTap={{ scale: 0.97 }}
              onClick={() => onToggle(item)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1"
              style={{ background: color + '12' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}>
                <Check size={16} color="white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold flex-1 text-left" style={{ color }}>{item}</span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: color }}>
                <Check size={11} color="white" strokeWidth={3} />
              </div>
            </motion.button>
          ))}

          {/* Adicionar personalizado */}
          {onAddCustom && (
            showCustom ? (
              <div className="flex gap-2 mt-2 px-1">
                <input
                  autoFocus
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Escreve uma tag..."
                  className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: color, color: '#1A1A1A' }}
                />
                <button onClick={handleAdd}
                  className="px-3 py-2 rounded-xl text-white text-xs font-black"
                  style={{ background: color }}>
                  Adicionar
                </button>
              </div>
            ) : (
              <button onClick={() => setShowCustom(true)}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl mt-1 text-sm font-bold"
                style={{ color, background: color + '0D' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Adicionar personalizado
              </button>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pt-2 pb-5 flex-shrink-0">
          <div className="h-px mb-4" style={{ background: '#F3F4F6' }} />
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
            style={{ background: color, boxShadow: `0 4px 16px ${color}40` }}>
            <Check size={16} strokeWidth={2.5} /> Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PickerSheet — seleção única (Categoria / Província) ───────────────────────
function PickerSheet({ title, options, value, color, onSelect, onClose, onAddCustom }: {
  title: string;
  options: { id: string; label: string; icon?: React.ReactNode; color?: string; customLabel?: string }[];
  value: string;
  color: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  onAddCustom?: (v: string) => void;
}) {
  const [customValue, setCustomValue] = useState('');
  const [showCustom,  setShowCustom]  = useState(false);

  const handleAddCustom = () => {
    const v = customValue.trim();
    if (v && onAddCustom) {
      onAddCustom(v);
      setCustomValue('');
      setShowCustom(false);
      onClose();
    }
  };

  // Opções que têm customLabel são tratadas como "Adicionar personalizado"
  const regularOptions  = options.filter(o => !o.customLabel);
  const customOption    = options.find(o => !!o.customLabel);

  return (
    <motion.div
      className="fixed z-50 flex items-center justify-center"
      style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        className="relative flex flex-col"
        style={{ width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(85vh - 40px)', background: 'white', borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
            <X size={15} style={{ color: '#6B7280' }} />
          </button>
        </div>
        <div className="mx-5 mb-3 h-px" style={{ background: '#F3F4F6' }} />
        <div className="px-3 py-2 overflow-y-auto flex-1 pb-4">
          {regularOptions.map(opt => {
            const active = value === opt.id;
            const c = opt.color || color;
            return (
              <motion.button key={opt.id} whileTap={{ scale: 0.97 }}
                onClick={() => { onSelect(opt.id); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1 transition-all"
                style={{ background: active ? c + '12' : 'transparent' }}>
                {opt.icon && (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: active ? c : c + '18', color: active ? 'white' : c, boxShadow: active ? `0 4px 12px ${c}40` : 'none' }}>
                    {opt.icon}
                  </div>
                )}
                <span className="text-sm font-bold flex-1 text-left"
                  style={{ color: active ? c : '#374151' }}>
                  {opt.label}
                </span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: active ? c : '#F3F4F6' }}>
                  {active && <Check size={11} color="white" strokeWidth={3} />}
                </div>
              </motion.button>
            );
          })}

          {/* Adicionar personalizado */}
          {customOption && onAddCustom && (
            showCustom ? (
              <div className="flex gap-2 mt-2 px-1">
                <input
                  autoFocus
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  placeholder="Escreve a categoria..."
                  className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: color, color: '#1A1A1A' }}
                />
                <button onClick={handleAddCustom}
                  className="px-3 py-2 rounded-xl text-white text-xs font-black"
                  style={{ background: color }}>
                  Adicionar
                </button>
              </div>
            ) : (
              <button onClick={() => setShowCustom(true)}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl mt-1 text-sm font-bold"
                style={{ color, background: color + '0D' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {customOption.customLabel}
              </button>
            )
          )}
        </div>
        <div className="px-4 pt-2 pb-5 flex-shrink-0">
          <div className="h-px mb-4" style={{ background: '#F3F4F6' }} />
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
            style={{ background: color, boxShadow: `0 4px 16px ${color}40` }}>
            <Check size={16} strokeWidth={2.5} /> Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Grelha de imagens ─────────────────────────────────────────────────────────
function ImageGrid({ images, onRemove, onMoveToFront, onAdd }: {
  images: ImageItem[];
  onRemove: (id: string) => void;
  onMoveToFront: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((img, i) => (
        <motion.div key={img.id} layout
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.18 }}
          className="relative rounded-2xl overflow-hidden flex-shrink-0"
          style={{ width: 92, height: 92 }}
        >
          <img src={img.preview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />
          {i === 0 && (
            <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: '#1B5E3B' }}>
              <Star size={8} className="text-white" fill="white" />
              <span className="text-[8px] font-black text-white leading-none">Capa</span>
            </div>
          )}
          <button onClick={() => onRemove(img.id)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <X size={10} className="text-white" />
          </button>
          {i !== 0 && (
            <button onClick={() => onMoveToFront(img.id)} title="Tornar capa"
              className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <GripVertical size={8} className="text-white" />
              <span className="text-[8px] text-white/90 leading-none">Capa</span>
            </button>
          )}
        </motion.div>
      ))}
      {images.length < MAX_IMAGES && (
        <button onClick={onAdd}
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-colors"
          style={{ width: 92, height: 92, borderColor: '#D1D5DB' }}>
          <ImageIcon size={20} className="text-gray-300" />
          <span className="text-[9px] text-gray-400 font-semibold">Adicionar</span>
        </button>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AddPost({ onSuccess, onBack }: AddPostProps) {
  useScrollTop();
  const { user } = useAuth();

  const [step, setStep] = useState(1);

  // Campos
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [category, setCategory] = useState('');
  const [tags,     setTags]     = useState<string[]>([]);

  // Categoria "Outro" — input manual (no form) ou personalizada (via modal)
  const [outroCategory, setOutroCategory] = useState('');

  // Handler para categoria personalizada vinda do modal
  const addCustomCategory = (v: string) => {
    setOutroCategory(v);
    setCategory('custom');
  };

  const selectedCat = category === 'custom'
    ? { id: 'custom', label: outroCategory || 'Personalizado', color: '#6B7280', icon: <MoreHorizontal size={18} strokeWidth={1.8} /> }
    : POST_CATEGORIES.find(c => c.id === category);

  // Localização via LocationPicker
  const [geoFields, setGeoFields] = useState<GeoFields | null>(null);
  const [geoSource, setGeoSource] = useState<LocationSource>(null);

  // Imagens
  const [images,    setImages]    = useState<ImageItem[]>([]);
  const [imgErrors, setImgErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // UI
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | undefined>(undefined);
  const [createdHasLoc, setCreatedHasLoc] = useState(false);
  const [stepError,     setStepError]     = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // Nav
  const next = () => { setStepError(''); setStep(s => Math.min(s + 1, 4)); };
  const prev = () => { setStepError(''); if (step === 1) onBack(); else setStep(s => s - 1); };

  // Validação step 1
  const validateStep1 = () => {
    if (!title.trim())   { setStepError('O título é obrigatório.'); return false; }
    if (!content.trim()) { setStepError('O conteúdo é obrigatório.'); return false; }
    if (!category)       { setStepError('Seleciona a categoria.'); return false; }
    return true;
  };

  // Fotos
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const errors: string[] = [];
    const remaining = MAX_IMAGES - images.length;
    files.slice(0, remaining).forEach(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) { errors.push(`"${file.name}" — tipo não suportado.`); return; }
      if (file.size > MAX_SIZE_BYTES)          { errors.push(`"${file.name}" — excede 10 MB.`); return; }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, { id, preview: reader.result as string, file }]);
      reader.readAsDataURL(file);
    });
    if (errors.length) setImgErrors(errors);
    if (fileRef.current) fileRef.current.value = '';
  }, [images]);

  const removeImage    = useCallback((id: string) => setImages(prev => prev.filter(i => i.id !== id)), []);
  const moveToFront    = useCallback((id: string) => setImages(prev => {
    const idx = prev.findIndex(i => i.id === id);
    if (idx <= 0) return prev;
    const next = [...prev]; const [item] = next.splice(idx, 1); next.unshift(item); return next;
  }), []);

  // Tags
  const toggleTag  = (label: string) => setTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]);
  const addCustomTag = (v: string) => { if (!tags.includes(v)) setTags(prev => [...prev, v]); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setStepError('');
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',   title.trim());
      fd.append('content', content.trim());

      // Mapear label de display → valor aceite pela API
      const apiCategory = CATEGORY_API_MAP[selectedCat?.label || ''] || 'other';
      if (apiCategory) fd.append('category', apiCategory);

      // Província vem dos dados administrativos do LocationPicker
      const effectiveProvince = geoFields?.province || '';
      if (effectiveProvince) fd.append('province', effectiveProvince);

      // location como JSON string — usa geoFields do LocationPicker
      const lat = geoFields?.lat || '';
      const lng = geoFields?.lng || '';
      const addr = geoFields?.address || '';
      const location = {
        latitude:  lat  ? parseFloat(lat)  : null,
        longitude: lng  ? parseFloat(lng)  : null,
        address:   addr || null,
      };
      fd.append('location', JSON.stringify(location));

      if (tags.length > 0) fd.append('tags', JSON.stringify(tags));

      images.forEach(img => fd.append('images', img.file));

      const { data, error: apiError } = await postsApi.create(fd);

      if (apiError) {
        setStepError(typeof apiError === 'string' ? apiError : 'Erro ao publicar. Tenta novamente.');
        return;
      }

      const postId = data?.post?.id ?? data?.id;

      if (data?.success || data?.post || data?.id) {
        if (postId && images.length > 0) {
          try {
            const { data: postData } = await postsApi.get(postId);
            const apiImages: string[] = Array.isArray(postData?.images)
              ? postData.images.filter((img: any): img is string => typeof img === 'string' && img.trim().length > 0)
              : [];
            if (apiImages.length > 0) cacheImages(postId, apiImages);
            else await uploadAndCache(images.map(i => i.file), postId, 'post');
          } catch {
            await uploadAndCache(images.map(i => i.file), postId, 'post');
          }
        }
        const hasLoc = !!lat && !!lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
        setCreatedPostId(postId);
        setCreatedHasLoc(hasLoc);
        setSubmitted(true);
      } else {
        setStepError('Erro ao publicar. Tenta novamente.');
      }
    } catch {
      setStepError('Erro inesperado. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Sucesso ───────────────────────────────────────────────────────────────
  if (submitted) return (
    <div
      className="h-screen w-full flex flex-col relative overflow-hidden"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
    >
      {/* Faixa superior colorida */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{
        height: 270,
        background: 'linear-gradient(150deg, #0F4C2A 0%, #1B7A45 55%, #2BB5C8 100%)',
        borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
      }}>
        <div className="absolute" style={{ top: -60, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute" style={{ bottom: 10, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 44px)',
          borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
        }} />
      </div>

      {/* Scroll container */}
      <div className="relative z-10 flex flex-col items-center w-full h-full overflow-y-auto pb-8 px-5">

        {/* Ícone flutuante */}
        <motion.div className="relative" style={{ marginTop: 48, marginBottom: -40, zIndex: 20 }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 11, stiffness: 160, delay: 0.15 }}>
          <motion.div style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: 'rgba(27,122,69,0.18)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div style={{ position: 'absolute', inset: -7, borderRadius: '50%', background: 'rgba(43,181,200,0.15)' }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }} />
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 50%, #2BB5C8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 16px 48px rgba(15,76,42,0.4), 0 0 0 5px #F5F5F0, 0 0 0 7px rgba(27,90,59,0.1)',
          }}>
            <Check size={42} color="white" strokeWidth={3} />
          </div>
          <motion.div style={{
            position: 'absolute', top: -4, right: -8, width: 30, height: 30, borderRadius: '50%',
            background: '#F4821F', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(244,130,31,0.45)', border: '2.5px solid #F5F5F0',
          }} animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
            <PartyPopper size={14} color="white" strokeWidth={2} />
          </motion.div>
        </motion.div>

        {/* Card principal */}
        <motion.div
          className="w-full"
          style={{
            maxWidth: 400, background: 'white', borderRadius: 28,
            boxShadow: '0 4px 40px rgba(0,0,0,0.09), 0 1px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden', paddingTop: 52,
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Faixa de acento */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #0F4C2A, #1B7A45, #2BB5C8, #F4821F)' }} />

          <div className="px-6 pt-5 pb-6">
            {/* Título */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8, textAlign: 'center' }}>
                <span style={{ color: '#1A1A1A' }}>Publicação enviada </span>
                <span style={{
                  background: 'linear-gradient(90deg, #0F4C2A, #2BB5C8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>com sucesso!</span>
              </h1>
            </motion.div>

            {/* Descrição */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.46 }}
              style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, marginBottom: 20, textAlign: 'center' }}>
              A tua publicação foi criada e já está disponível na plataforma.
            </motion.p>

            <div style={{ height: 1, background: '#F0F0EC', marginBottom: 20 }} />

            {/* Timeline */}
            <motion.div className="flex items-start mb-6"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}>
              {[
                { Icon: Check,  label: 'Criada',      done: true  },
                { Icon: Globe,  label: 'Publicada',   done: true  },
                { Icon: Search, label: 'Disponível',  done: true  },
              ].map(({ Icon, label, done }, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1.5 relative">
                  {i < 2 && (
                    <div style={{
                      position: 'absolute', top: 17, left: '50%', width: '100%', height: 2, zIndex: 0,
                      background: done ? 'linear-gradient(to right, #1B5E3B, #E5E7EB)' : '#E5E7EB',
                    }} />
                  )}
                  <div style={{
                    position: 'relative', zIndex: 1,
                    width: 36, height: 36, borderRadius: 12,
                    background: done ? 'linear-gradient(135deg, #0F4C2A, #1B7A45)' : '#F5F5F0',
                    border: done ? 'none' : '1.5px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: done ? '0 4px 12px rgba(15,76,42,0.28)' : 'none',
                  }}>
                    <Icon size={16} color={done ? 'white' : '#9CA3AF'} strokeWidth={2.2} />
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase' as const,
                    letterSpacing: 0.6, textAlign: 'center' as const,
                    color: done ? '#1B5E3B' : '#9CA3AF',
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onSuccess(createdPostId, createdHasLoc)}
              className="w-full relative overflow-hidden rounded-2xl text-white font-black flex items-center justify-center"
              style={{
                height: 52, fontSize: 14, letterSpacing: '0.02em',
                background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                boxShadow: '0 6px 24px rgba(15,76,42,0.38)',
              }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68 }}
            >
              <motion.div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%)',
              }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
              />
              <span className="relative z-10">Voltar ao início</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // ── Bloco de erro ─────────────────────────────────────────────────────────
  const ErrorBlock = stepError ? (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="px-4 py-3 rounded-2xl flex items-center gap-2"
      style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
      <AlertCircle size={14} style={{ color: '#EF4444' }} />
      <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>{stepError}</p>
    </motion.div>
  ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Detalhes (título, conteúdo, categoria, tags)
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={1} onBack={prev} />

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">

        {/* Título */}
        <div>
          <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>
            Título <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 300))}
            placeholder="Ex.: Descobrindo as praias de Inhambane..."
            className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none"
            style={{ borderColor: '#E5E7EB', fontFamily: 'Nunito, sans-serif', color: '#1A1A1A' }}
          />
          <p className="text-right text-[10px] mt-1" style={{ color: title.length > 280 ? '#EF4444' : '#C7C7CC' }}>
            {title.length}/300
          </p>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>
            Categoria <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <button
            onClick={() => setShowCatPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border bg-white text-sm transition-all"
            style={{
              borderColor: selectedCat ? selectedCat.color : '#E5E7EB',
              background: selectedCat ? selectedCat.color + '0D' : 'white',
            }}
          >
            <div className="flex items-center gap-3">
              {selectedCat ? (
                <>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: selectedCat.color, color: 'white' }}>
                    {selectedCat.icon}
                  </div>
                  <span className="font-bold" style={{ color: selectedCat.color }}>{selectedCat.label}</span>
                </>
              ) : (
                <span className="font-semibold" style={{ color: '#9CA3AF' }}>Seleciona a categoria...</span>
              )}
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {/* Input manual para "Adicionar personalizado" */}
          <AnimatePresence>
            {category === 'outro' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <input
                  type="text"
                  value={outroCategory}
                  onChange={e => setOutroCategory(e.target.value.slice(0, 80))}
                  placeholder="Descreve a categoria..."
                  className="w-full mt-2 px-4 py-3 rounded-2xl border bg-white text-sm focus:outline-none"
                  style={{ borderColor: '#6B7280', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>
            Tags <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
          </label>
          <button
            onClick={() => setShowTagPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border bg-white text-sm transition-all"
            style={{ borderColor: tags.length > 0 ? '#1B5E3B' : '#E5E7EB', background: tags.length > 0 ? '#EEF7F0' : 'white' }}
          >
            <span className="font-semibold" style={{ color: tags.length > 0 ? '#1B5E3B' : '#9CA3AF' }}>
              {tags.length > 0 ? `${tags.length} tag${tags.length > 1 ? 's' : ''} selecionada${tags.length > 1 ? 's' : ''}` : 'Selecione as tags...'}
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                  #{tag}
                  <button onClick={() => toggleTag(tag)} className="ml-0.5 hover:opacity-70">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>
            Descrição <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div className="relative">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, 5000))}
              placeholder="Partilha a tua experiência, dicas ou descobertas..."
              rows={5}
              className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none resize-none"
              style={{ borderColor: '#E5E7EB', fontFamily: 'Nunito, sans-serif', color: '#1A1A1A' }}
            />
            <p className="text-right text-[10px] mt-1" style={{ color: content.length > 4800 ? '#EF4444' : '#C7C7CC' }}>
              {content.length}/5000
            </p>
          </div>
        </div>

        <AnimatePresence>{ErrorBlock}</AnimatePresence>

        {/* Botão Próximo — verde */}
        <motion.button whileTap={{ scale: 0.98 }}
          onClick={() => { if (validateStep1()) next(); }}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md"
          style={{ background: '#1B5E3B' }}>
          Próximo <ArrowRight size={20} />
        </motion.button>
        <div className="h-4" />
      </div>

      {/* Pickers */}
      <AnimatePresence>
        {showCatPicker && (
          <PickerSheet
            title="Categoria da publicação"
            options={POST_CATEGORIES}
            value={category}
            color="#2BB5C8"
            onSelect={setCategory}
            onAddCustom={addCustomCategory}
            onClose={() => setShowCatPicker(false)}
          />
        )}
        {showTagPicker && (
          <MultiSelectSheet
            title="Tags"
            options={TAG_OPTIONS}
            selected={tags}
            color="#2BB5C8"
            onToggle={toggleTag}
            onAddCustom={addCustomTag}
            onClose={() => setShowTagPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Localização
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 2) return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={2} onBack={prev} />

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">

        {/* LocationPicker — partilhado com AddLocal/AddService */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={15} style={{ color: '#0077B6' }} />
            <span className="text-xs font-black" style={{ color: '#6B7280' }}>
              LOCALIZAÇÃO <span style={{ color: '#9CA3AF' }}>(opcional)</span>
            </span>
            {geoFields?.lat && geoFields?.lng && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#EFF8FF', color: '#0077B6' }}>
                ✓ Definida
              </span>
            )}
          </div>
          <LocationPicker
            initialLat={geoFields?.lat}
            initialLng={geoFields?.lng}
            onChange={(fields, src) => {
              setGeoFields(fields);
              setGeoSource(src);
            }}
            mapHeight={260}
          />
        </div>

        <AnimatePresence>{ErrorBlock}</AnimatePresence>

        {/* Botão Próximo — localização é opcional, não bloqueia */}
        <motion.button whileTap={{ scale: 0.98 }}
          onClick={next}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md"
          style={{ background: '#1B5E3B' }}>
          Próximo <ArrowRight size={20} />
        </motion.button>
        <div className="h-4" />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Fotos
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 3) return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={3} onBack={prev} />

      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Adiciona fotos reais para atrair mais visitantes
        </p>

        {/* Área de upload — idêntica ao AddService */}
        {images.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed"
            style={{ borderColor: '#1B5E3B', background: '#EEF7F0' }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#1B5E3B' }}>
              <Camera size={26} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black" style={{ color: '#1B5E3B' }}>Adicionar fotos</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                JPEG, PNG, WEBP, GIF · máx. 10MB cada · até {MAX_IMAGES} fotos
              </p>
            </div>
          </button>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <div key={img.id} className="relative flex-shrink-0 rounded-2xl overflow-hidden" style={{ width: 110, height: 110 }}>
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{ background: '#1B5E3B' }}>
                    Principal
                  </span>
                )}
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 rounded-2xl border-2 border-dashed flex items-center justify-center"
                style={{ width: 110, height: 110, borderColor: '#E5E7EB' }}
              >
                <Camera size={24} className="text-gray-300" />
              </button>
            )}
          </div>
        )}

        <input ref={fileRef} type="file" accept={ACCEPTED_ACCEPT} multiple className="hidden" onChange={handlePhotoSelect} />

        {/* Erros de validação */}
        <AnimatePresence>
          {imgErrors.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1">
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

        <AnimatePresence>{ErrorBlock}</AnimatePresence>

        {/* Próximo — verde, igual ao AddService */}
        <motion.button whileTap={{ scale: 0.98 }} onClick={next}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md"
          style={{ background: '#1B5E3B' }}>
          Próximo <ArrowRight size={20} />
        </motion.button>

        {/* Dicas para boas fotos */}
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#D1FAE5' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#ECFDF5' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#1B5E3B' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <span className="text-sm font-black" style={{ color: '#1B5E3B' }}>Dicas para boas fotos</span>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 gap-2.5" style={{ background: 'white' }}>
            {[
              { text: 'Usa luz natural sempre que possível' },
              { text: 'Mostra diferentes ângulos do local' },
              { text: 'Inclui fotos da entrada e do interior' },
              { text: 'Evita fotos desfocadas ou escuras' },
            ].map(({ text }) => (
              <div key={text} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-xs font-semibold leading-tight" style={{ color: '#374151' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4 — Revisão + Publicar
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={4} onBack={prev} />

      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

        {/* Banner com foto de capa se existir */}
        {images.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ height: 160 }}>
            <img src={images[0].preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
            <div className="absolute bottom-3 left-3">
              <h2 className="text-white font-black text-lg leading-tight">{title}</h2>
              <span className="text-white/80 text-xs">{selectedCat?.label || '—'} • {geoFields?.province || '—'}</span>
            </div>
          </div>
        )}

        {/* Secção — Publicação */}
        {[
          {
            label: 'Publicação',
            editStep: 1,
            items: [
              { k: 'Título',    v: title },
              { k: 'Categoria', v: selectedCat?.label || '—' },
              { k: 'Tags',      v: tags.length > 0 ? tags.map(t => `#${t}`).join(' ') : '—' },
              { k: 'Descrição', v: content.length > 150 ? content.slice(0, 150) + '…' : content },
            ],
          },
          {
            label: 'Localização',
            editStep: 2,
            items: [
              { k: 'País',       v: geoFields?.country   || 'Moçambique' },
              { k: 'Província',  v: geoFields?.province  || '—' },
              { k: 'Distrito',   v: geoFields?.district  || '—' },
              { k: 'Endereço',   v: geoFields?.address   || '—' },
            ],
          },
          {
            label: 'Fotos',
            editStep: 3,
            items: [
              { k: 'Total', v: `${images.length} foto${images.length !== 1 ? 's' : ''}` },
            ],
          },
        ].map(section => (
          <div key={section.label} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>{section.label}</p>
              <button onClick={() => setStep(section.editStep)} className="text-xs font-bold" style={{ color: '#1B5E3B' }}>
                Editar
              </button>
            </div>
            {section.items.map(item => (
              <div key={item.k} className="flex items-start justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold flex-shrink-0 w-24" style={{ color: '#9CA3AF' }}>{item.k}</span>
                <span className="text-xs font-bold text-right ml-4 flex-1" style={{ color: '#1A1A1A' }}>{item.v}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Preview miniaturas fotos */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.slice(1, 6).map((img, i) => (
              <div key={img.id} className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 72, height: 72 }}>
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {images.length > 6 && (
              <div className="flex-shrink-0 rounded-xl flex items-center justify-center"
                style={{ width: 72, height: 72, background: '#F3F4F6' }}>
                <span className="text-xs font-black" style={{ color: '#6B7280' }}>+{images.length - 6}</span>
              </div>
            )}
          </div>
        )}

        <AnimatePresence>{ErrorBlock}</AnimatePresence>

        {/* Botão Publicar */}
        <motion.button whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
          style={{ background: '#1B5E3B', boxShadow: '0 4px 18px rgba(27,94,59,0.35)' }}>
          {isSubmitting
            ? <><Loader2 size={18} className="animate-spin" /> A publicar...</>
            : <><Check size={18} /> Publicar</>
          }
        </motion.button>

        <div style={{ background: 'linear-gradient(135deg,#EEF7F0 0%,#F0F9FF 100%)', borderRadius: 20, padding: 16, border: '1px solid rgba(27,94,59,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1B5E3B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(27,94,59,0.25)' }}>
              <Check size={18} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#1B5E3B', marginBottom: 4 }}>Quase lá!</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#4B7A5E', lineHeight: 1.6 }}>
                A tua publicação ficará disponível na plataforma imediatamente após o envio. Partilha o melhor de Moçambique!
              </p>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
