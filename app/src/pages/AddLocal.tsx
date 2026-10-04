import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconChevronLeft, IconChevronDown, IconArrowRight, IconCheck, IconClose,
  IconMapPin, IconCamera, IconImage, IconTrash, IconStar,
  IconMountain, IconUsers, IconEye, IconAccessible, IconTheater,
  IconHeart, IconFlag, IconNavigation,
  CategoryIcon, STROKE,
} from '@/components/icons';
import { Zap, UtensilsCrossed, Mountain, Users, Eye, Accessibility, Camera as CameraIcon, Heart, Theater, MoreHorizontal, X, Check, ChevronLeft, ChevronDown, ArrowRight, MapPin, Camera, Trash2, Image as ImageIcon, Star, Loader2, Search, Globe, PartyPopper, HeartHandshake, AlertCircle, Sun, Maximize2, DoorOpen, EyeOff, Waves, Landmark, TreePine, Utensils, Hotel, Library, ShoppingBasket, Footprints, Anchor, CloudRain, Wind, Thermometer } from 'lucide-react';
import { localsApi } from '@/services/api';
import { uploadAndCache, cacheImages } from '@/utils/imageCache';
import SubmissionSuccessScreen from '@/components/shared/SubmissionSuccessScreen';
import { useScrollTop } from '@/hooks/useScrollTop';
import LocationPicker, { type GeoFields, type LocationSource } from '@/components/LocationPicker';
import { buildFullAddress } from '@/utils/normalizeLocation';

interface AddLocalProps {
  onSuccess: () => void;
  onBack: () => void;
}

const steps = [
  { n: 1, label: 'Informações' },
  { n: 2, label: 'Localização' },
  { n: 3, label: 'Fotos' },
  { n: 4, label: 'Revisão' },
];

const tipoOptions = [
  { id: 'Praia',         label: 'Praia',         icon: <Waves size={18} strokeWidth={1.8} />,        color: '#2BB5C8' },
  { id: 'Monumento',     label: 'Monumento',     icon: <Landmark size={18} strokeWidth={1.8} />,     color: '#7B5EA7' },
  { id: 'Parque Natural',label: 'Parque Natural',icon: <TreePine size={18} strokeWidth={1.8} />,     color: '#1B5E3B' },
  { id: 'Restaurante',   label: 'Restaurante',   icon: <Utensils size={18} strokeWidth={1.8} />,     color: '#E05A3A' },
  { id: 'Hotel',         label: 'Hotel',         icon: <Hotel size={18} strokeWidth={1.8} />,        color: '#F4821F' },
  { id: 'Museu',         label: 'Museu',         icon: <Library size={18} strokeWidth={1.8} />,      color: '#9B59B6' },
  { id: 'Mercado',       label: 'Mercado',       icon: <ShoppingBasket size={18} strokeWidth={1.8} />, color: '#E67E22' },
  { id: 'Trilha',        label: 'Trilha',        icon: <Footprints size={18} strokeWidth={1.8} />,   color: '#27AE60' },
  { id: 'Ilha',          label: 'Ilha',          icon: <Anchor size={18} strokeWidth={1.8} />,        color: '#3498DB' },
  { id: 'Outro',         label: 'Outro',         icon: <MoreHorizontal size={18} strokeWidth={1.8} />, color: '#6B7280' },
];

const epocaOptions = [
  {
    id: 'chuvosa',
    label: 'Época quente e chuvosa',
    subtitle: 'Novembro – Março',
    icon: <CloudRain size={18} strokeWidth={1.8} />,
    color: '#2563EB',
  },
  {
    id: 'transicao',
    label: 'Período de transição',
    subtitle: 'Abril – Maio',
    icon: <Wind size={18} strokeWidth={1.8} />,
    color: '#7B5EA7',
  },
  {
    id: 'seca',
    label: 'Época seca e fresca',
    subtitle: 'Junho – Outubro',
    icon: <Sun size={18} strokeWidth={1.8} />,
    color: '#F4821F',
  },
];
const destaquesOptions = [
  { id: 'panoramica',  label: 'Vista panorâmica',   icon: <Mountain size={18} strokeWidth={1.8} /> },
  { id: 'familias',    label: 'Ideal para famílias', icon: <Users size={18} strokeWidth={1.8} /> },
  { id: 'pouco',       label: 'Pouco conhecido',     icon: <Eye size={18} strokeWidth={1.8} /> },
  { id: 'acessivel',   label: 'Acessível',           icon: <Accessibility size={18} strokeWidth={1.8} /> },
  { id: 'fotos',       label: 'Bom para fotos',      icon: <CameraIcon size={18} strokeWidth={1.8} /> },
  { id: 'romantico',   label: 'Romântico',           icon: <Heart size={18} strokeWidth={1.8} /> },
  { id: 'aventura',    label: 'Aventura',            icon: <Zap size={18} strokeWidth={1.8} /> },
  { id: 'gastronomia', label: 'Gastronomia local',   icon: <UtensilsCrossed size={18} strokeWidth={1.8} /> },
  { id: 'cultura',     label: 'Cultura local',       icon: <Theater size={18} strokeWidth={1.8} /> },
  { id: 'outro2',      label: 'Outro',               icon: <MoreHorizontal size={18} strokeWidth={1.8} /> },
];
const provincias = ['Niassa','Cabo Delgado','Nampula','Zambézia','Tete','Manica','Sofala','Inhambane','Gaza','Maputo Província','Cidade de Maputo'];

const distritosPorProvincia: Record<string, string[]> = {
  'Niassa': ['Lago','Lichinga','Majune','Mandimba','Marrupa','Maúa','Mecúla','Mecanelas','Metarica','Muembe','N\'gauma','Sanga'],
  'Cabo Delgado': ['Ancuabe','Balama','Chiúre','Ibo','Macomia','Mecúfi','Meluco','Mocímboa da Praia','Montepuez','Mueda','Muidumbe','Namuno','Nangade','Palma','Pemba-Metuge','Quissanga'],
  'Nampula': ['Angoche','Eráti','Ilha de Moçambique','Lalaua','Larde','Liúpo','Malema','Meconta','Mecubúri','Memba','Mogincual','Mogovolas','Moma','Monapo','Mossuril','Muecate','Murrupula','Nacala-a-Velha','Nacala-Porto','Nampula','Rapale','Ribáuè'],
  'Zambézia': ['Alto Molócuè','Chinde','Derre','Gilé','Gurué','Ile','Inhassunge','Lugela','Maganja da Costa','Milange','Mocuba','Mopeia','Morrumbala','Mulevala','Namacurra','Namarroi','Nicoadala','Pebane','Quelimane'],
  'Tete': ['Angónia','Cahora-Bassa','Changara','Chifunde','Chiúta','Dôa','Macanga','Mágoè','Marara','Marávia','Moatize','Mutarara','Tsangano','Zumbo','Tete'],
  'Manica': ['Bárue','Gondola','Guro','Machaze','Macossa','Manica','Mossurize','Sussundenga','Tambara','Vanduzi','Chimoio'],
  'Sofala': ['Beira','Búzi','Caia','Cheringoma','Chibabava','Dondo','Gorongosa','Machanga','Maríngue','Marromeu','Muanza','Nhamatanda'],
  'Inhambane': ['Funhalouro','Govuro','Homoíne','Inhassoro','Inhambane','Jangamo','Mabote','Massinga','Morrumbene','Panda','Vilankulo','Zavala'],
  'Gaza': ['Bilene','Chibuto','Chicualacuala','Chigubo','Chókwè','Guijá','Limpopo','Mabalane','Manjacaze','Mapai','Massingir','Xai-Xai'],
  'Maputo Província': ['Boane','Magude','Manhiça','Marracuene','Matola','Matutuíne','Moamba','Namaacha'],
  'Cidade de Maputo': ['KaMpfumo','Nlhamankulu','KaMaxaquene','KaMavota','KaMubukwana','KaTembe','KaNyaka'],
};

// ── Shared components ─────────────────────────────────────────────────────────

// Uma cor por etapa — bola + linha que sai dela usam sempre a mesma cor
const STEP_COLORS = ['#1B5E3B', '#0077B6', '#2BB5C8', '#7B5EA7'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="w-full mt-4" style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px 1fr 28px 1fr 28px', alignItems: 'center' }}>
      {steps.map((s, i) => {
        const active = s.n === current;
        const done   = s.n < current;
        const color  = STEP_COLORS[i];
        return (
          <>
            {/* Círculo + label */}
            <div key={`step-${s.n}`} className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: (active || done) ? color : 'white', border: `2px solid ${(active || done) ? color : '#E5E7EB'}`, color: (active || done) ? 'white' : '#9CA3AF' }}>
                {done ? <Check size={12} /> : s.n}
              </div>
              <span className="text-[10px] font-bold mt-1 text-center whitespace-nowrap"
                style={{ color: (active || done) ? color : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
            {/* Linha — usa a cor da bola que a precede (índice i) */}
            {i < steps.length - 1 && (
              <div key={`line-${i}`} className="h-px" style={{ background: (active || done) ? color : '#E5E7EB', marginBottom: 16 }} />
            )}
          </>
        );
      })}
    </div>
  );
}

function PageHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div className="bg-white px-4 pt-5 pb-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black text-left" style={{ color: '#1A1A1A' }}>Sugerir local</h1>
        </div>
        <StepBar current={step} />
      </div>
    </div>
  );
}

// ── Category icons map ────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Praias': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  'Cultura & História': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="22" x2="22" y2="22"/><rect x="3" y="14" width="4" height="8"/><rect x="10" y="10" width="4" height="12"/><rect x="17" y="6" width="4" height="16"/>
    </svg>
  ),
  'Natureza': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 22"/><path d="M9.5 9.5C9.5 9.5 11 6 17 8c0 0-1 5-6 6.5"/>
      <path d="M3.82 22c0 0 2.18-6 8.18-8"/>
    </svg>
  ),
  'Aventura': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  'Gastronomia': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  'Mergulho': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  'Ecoturismo': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  'Outro': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

const CATEGORY_COLORS: Record<string, string> = {
  'Praias': '#2BB5C8',
  'Cultura & História': '#7B5EA7',
  'Natureza': '#1B5E3B',
  'Aventura': '#F4821F',
  'Gastronomia': '#E05A3A',
  'Mergulho': '#2563EB',
  'Ecoturismo': '#22C55E',
  'Outro': '#6B7280',
};

// ── CategoryPickerSheet — modal centrado ─────────────────────────────────────
function CategoryPickerSheet({ value, onSelect, onClose }: {
  value: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  const cats = ['Praias', 'Cultura & História', 'Natureza', 'Aventura', 'Gastronomia', 'Mergulho', 'Ecoturismo', 'Outro'];
  return (
    <motion.div
      className="fixed z-50 flex items-center justify-center"
      style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        className="relative flex flex-col"
        style={{
          width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(80vh - 50px)',
          background: 'white', borderRadius: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)',
        }}
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div>
            <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>Categoria</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-gray-100"
            style={{ background: '#F3F4F6' }}>
            <X size={15} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="mx-5 mb-3 h-px" style={{ background: '#F3F4F6' }} />

        {/* List */}
        <div className="px-3 py-2 overflow-y-auto flex-1">
          {cats.map(cat => {
            const active = value === cat;
            const color = CATEGORY_COLORS[cat];
            return (
              <motion.button key={cat}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(cat)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1 transition-all"
                style={{ background: active ? color + '12' : 'transparent' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: active ? color : color + '18',
                    color: active ? 'white' : color,
                    boxShadow: active ? `0 4px 12px ${color}40` : 'none',
                  }}>
                  {CATEGORY_ICONS[cat]}
                </div>
                <span className="text-sm font-bold text-left flex-1 transition-all"
                  style={{ color: active ? color : '#374151' }}>
                  {cat}
                </span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: active ? color : '#F3F4F6' }}>
                  {active && <Check size={11} color="white" strokeWidth={3} />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pt-2 pb-5 flex-shrink-0">
          <div className="h-px mb-4" style={{ background: '#F3F4F6' }} />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
            style={{ background: '#1B5E3B', boxShadow: '0 4px 16px rgba(27,94,59,0.3)' }}>
            <Check size={16} strokeWidth={2.5} />
            Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function IconPickerSheet({ title, options, value, onSelect, onClose }: {
  title: string;
  options: { id: string; label: string; icon: React.ReactNode; color: string; subtitle?: string }[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed z-50 flex items-center justify-center"
      style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        className="relative flex flex-col"
        style={{
          width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(80vh - 50px)',
          background: 'white', borderRadius: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)',
        }}
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div>
            <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>{title}</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: '#F3F4F6' }}>
            <X size={15} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="mx-5 mb-3 h-px" style={{ background: '#F3F4F6' }} />

        {/* List */}
        <div className="px-3 py-2 overflow-y-auto flex-1">
          {options.map(opt => {
            const active = value === opt.id;
            return (
              <motion.button key={opt.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(opt.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1 transition-all"
                style={{ background: active ? opt.color + '12' : 'transparent' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: active ? opt.color : opt.color + '18',
                    color: active ? 'white' : opt.color,
                    boxShadow: active ? `0 4px 12px ${opt.color}40` : 'none',
                  }}>
                  {opt.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold leading-tight transition-all"
                    style={{ color: active ? opt.color : '#374151' }}>
                    {opt.label}
                  </p>
                  {opt.subtitle && (
                    <p className="text-xs mt-0.5 font-medium" style={{ color: '#9CA3AF' }}>{opt.subtitle}</p>
                  )}
                </div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: active ? opt.color : '#F3F4F6' }}>
                  {active && <Check size={11} color="white" strokeWidth={3} />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pt-2 pb-5 flex-shrink-0">
          <div className="h-px mb-4" style={{ background: '#F3F4F6' }} />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
            style={{ background: '#1B5E3B', boxShadow: '0 4px 16px rgba(27,94,59,0.3)' }}>
            <Check size={16} strokeWidth={2.5} />
            Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}


function PickerSheet({ title, options, value, onSelect, onClose }: {
  title: string; options: string[]; value: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed z-50 flex items-center justify-center"
      style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div
        className="relative flex flex-col"
        style={{
          width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(80vh - 50px)',
          background: 'white', borderRadius: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)',
        }}
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div>
            <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>{title}</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F3F4F6' }}>
            <X size={15} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="mx-5 mb-3 h-px" style={{ background: '#F3F4F6' }} />

        {/* List */}
        <div className="px-3 pb-4 overflow-y-auto">
          {options.map(opt => (
            <motion.button key={opt}
              whileTap={{ scale: 0.97 }}
              onClick={() => { onSelect(opt); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-1 transition-all"
              style={{ background: value === opt ? '#EEF7F0' : 'transparent' }}>
              <span className="text-sm font-bold text-left" style={{ color: value === opt ? '#1B5E3B' : '#374151' }}>
                {opt}
              </span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: value === opt ? '#1B5E3B' : '#F3F4F6' }}>
                {value === opt && <Check size={11} color="white" strokeWidth={3} />}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AddLocal({
  onSuccess, onBack }: AddLocalProps) {
  useScrollTop();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName]       = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc]       = useState('');
  const [tipo, setTipo]       = useState('');
  const [epoca, setEpoca]     = useState('');
  const [destaques, setDestaques] = useState<string[]>([]);
  const [step1Error, setStep1Error] = useState('');

  // Step 2
  const [provincia, setProvincia] = useState('');
  const [cidade, setCidade]       = useState('');
  const [endereco, setEndereco]   = useState('');
  const [lat, setLat]             = useState('');
  const [lng, setLng]             = useState('');
  const [step2Error, setStep2Error] = useState('');
  // Campos geo do LocationPicker
  const [geoSource, setGeoSource] = useState<LocationSource>(null);
  // Validade — true quando LocationPicker tem todos os campos obrigatórios preenchidos
  const [locationValid, setLocationValid] = useState(false);
  
  // Novos campos administrativos do LocationPicker melhorado
  const [country, setCountry]                           = useState('');
  const [district, setDistrict]                         = useState('');
  const [administrativePost, setAdministrativePost]     = useState('');
  const [administrativeArea, setAdministrativeArea]     = useState('');
  const [locality, setLocality]                         = useState('');
  const [suburb, setSuburb]                             = useState('');
  const [nearbyReference, setNearbyReference]           = useState('');
  const [accuracy, setAccuracy]                         = useState<number | undefined>(undefined);

  // Step 3
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]); // ⚠️ Guardar ficheiros reais separadamente
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sheets
  const [showCat, setShowCat]         = useState(false);
  const [showTipo, setShowTipo]       = useState(false);
  const [showEpoca, setShowEpoca]     = useState(false);
  const [showDest, setShowDest]       = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const toggleDest = (id: string) =>
    setDestaques(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setStep1Error('O nome do lugar é obrigatório.');
      setStep(1);
      return;
    }
    if (!desc.trim()) {
      setStep1Error('A descrição é obrigatória.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setStep1Error('');

    // Helper para extrair mensagem de erro legível — SEMPRE devolve string
    const extractErrorMsg = (error: unknown): string => {
      if (!error) return 'Erro desconhecido';
      if (typeof error === 'string') return error;
      const e = error as any;
      // {code, details, correlation_id} — formato do backend
      if (e?.details && typeof e.details === 'object') {
        return Object.entries(e.details)
          .map(([f, m]) => `${f}: ${Array.isArray(m) ? (m as any[]).join(', ') : String(m)}`)
          .join('\n');
      }
      if (e?.error?.details && typeof e.error.details === 'object') {
        return Object.entries(e.error.details)
          .map(([f, m]) => `${f}: ${Array.isArray(m) ? (m as any[]).join(', ') : String(m)}`)
          .join('\n');
      }
      if (typeof e?.message === 'string') return e.message;
      if (typeof e?.detail === 'string')  return e.detail;
      if (typeof e?.error  === 'string')  return e.error;
      // último recurso — serializar mas garantir string
      try { return JSON.stringify(error, null, 2); } catch { return 'Erro ao processar resposta'; }
    };

    try {
      const categoryMap: Record<string, string> = {
        'Gastronomia':        'restaurant',
        'Hotel':              'hotel',
        'Praias':             'attraction',
        'Natureza':           'attraction',
        'Aventura':           'attraction',
        'Mergulho':           'attraction',
        'Ecoturismo':         'attraction',
        'Cultura & História': 'attraction',
        'Outro':              'attraction',
        'restaurant':         'restaurant',
        'hotel':              'hotel',
        'attraction':         'attraction',
        'shop':               'shop',
        'service':            'service',
      };
      const backendCategory = categoryMap[category] || 'attraction';

      // Passo 1: Criar o local via JSON (sem imagens)
      const payload: Record<string, any> = {
        name:        name.trim(),
        description: desc.trim(),
        category:    backendCategory,
      };
      if (tipo.trim())               payload.subcategory          = (tipoOptions.find(o => o.id === tipo)?.label ?? tipo).trim();
      if (epoca.trim())              payload.best_season          = (() => { const e = epocaOptions.find(o => o.id === epoca); return e ? `${e.label} (${e.subtitle})` : epoca; })();
      if (provincia.trim())          payload.province             = provincia.trim();
      // municipality = Distrito — campo correcto no LocalWriteRequest do OpenAPI
      if (district.trim())           payload.municipality         = district.trim();
      if (administrativePost.trim()) payload.administrative_post  = administrativePost.trim();
      if (cidade.trim())             payload.locality             = cidade.trim();
      if (nearbyReference.trim())    payload.nearby_reference     = nearbyReference.trim();
      // Endereço gerado a partir dos dados reais, sem duplicações
      const fullAddress = buildFullAddress({
        locality:           cidade,
        administrativePost: administrativePost,
        district:           district,
        province:           provincia,
      });
      if (fullAddress)               payload.address              = fullAddress;
      if (lat.trim())                payload.latitude             = parseFloat(lat);
      if (lng.trim())                payload.longitude            = parseFloat(lng);
      if (destaques.length)          payload.highlights           = destaques;

      console.log('[AddLocal] Passo 1 — criar com JSON...');
      const { data, error } = await localsApi.createJson(payload);

      if (error) {
        setStep1Error(extractErrorMsg(error));
        return;
      }

      const localId = data?.local?.id ?? data?.id;
      console.log('[AddLocal] ✅ Local criado (id:', localId, ')');

      // Passo 2: upload de imagens via POST /api/upload/images/ (context=local)
      // + PUT multipart para associar ao local — dupla estratégia para máxima compatibilidade
      if (photoFiles.length > 0 && localId) {
        console.log('[AddLocal] Passo 2 — upload de imagens...');

        // 2a. Upload dedicado → guarda no cache para exibição imediata
        const uploadedUrls = await uploadAndCache(photoFiles.slice(0, 10), localId, 'local');
        console.log('[AddLocal] Upload dedicado:', uploadedUrls.length, 'URL(s) obtidas');

        // 2b. PUT multipart para associar imagens ao local no backend
        console.log('[AddLocal] Passo 2b — PUT multipart com imagens...');
        const fd = new FormData();
        // Campos administrativos completos
        fd.append('name',        name.trim());
        fd.append('description', desc.trim());
        fd.append('category',    backendCategory);
        if (tipo.trim())               fd.append('subcategory',         (tipoOptions.find(o => o.id === tipo)?.label ?? tipo).trim());
        if (epoca.trim())              fd.append('best_season',         (() => { const e = epocaOptions.find(o => o.id === epoca); return e ? `${e.label} (${e.subtitle})` : epoca; })());
        if (provincia.trim())          fd.append('province',            provincia.trim());
        // municipality = Distrito (LocalWriteRequest do OpenAPI)
        if (district.trim())           fd.append('municipality',        district.trim());
        if (administrativePost.trim()) fd.append('administrative_post', administrativePost.trim());
        if (cidade.trim())             fd.append('locality',            cidade.trim());
        if (nearbyReference.trim())    fd.append('nearby_reference',    nearbyReference.trim());
        const fullAddressMulti = buildFullAddress({ locality: cidade, administrativePost, district, province: provincia });
        if (fullAddressMulti)          fd.append('address',             fullAddressMulti);
        if (lat.trim())                fd.append('latitude',            lat.trim());
        if (lng.trim())                fd.append('longitude',           lng.trim());
        if (destaques.length)          fd.append('highlights',          JSON.stringify(destaques));
        photoFiles.slice(0, 10).forEach(f => fd.append('images', f));

        const { data: putData, error: putErr } = await localsApi.update(localId, fd);
        if (putErr) {
          console.warn('[AddLocal] ⚠️ PUT multipart falhou:', extractErrorMsg(putErr));
          // Imagens do upload dedicado ainda estão no cache — continuar
        } else {
          console.log('[AddLocal] ✅ Imagens associadas via PUT');
          // Guardar no cache as URLs que o backend devolveu na resposta do PUT
          const putImages: string[] = Array.isArray(putData?.images)
            ? putData.images.filter((u: any) => typeof u === 'string' && u.trim())
            : [];
          if (putImages.length > 0) {
            cacheImages(localId, putImages);
            console.log('[AddLocal] ✅ URLs do PUT guardadas no cache:', putImages);
          }
        }

        // Passo 2c: GET ao local para obter imagens reais confirmadas pelo backend
        try {
          const { data: getData } = await localsApi.get(localId);
          const backendImages: string[] = Array.isArray(getData?.images)
            ? getData.images.filter((u: any) => typeof u === 'string' && u.trim())
            : [];
          if (backendImages.length > 0) {
            cacheImages(localId, backendImages);
            console.log('[AddLocal] ✅ URLs confirmadas pelo GET guardadas no cache:', backendImages);
          }
        } catch {
          console.warn('[AddLocal] GET de confirmação falhou — cache mantém URLs do upload');
        }
      }

      setSubmitted(true);

    } catch (err: any) {
      console.error('[AddLocal] ❌ Exception:', err);
      setStep1Error(err?.message || 'Erro ao criar local. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - photos.length; // max 10 imagens para locais
    const toAdd = files.slice(0, remaining);
    
    // Adiciona ficheiros ao state separado
    setPhotoFiles(prev => [...prev, ...toAdd]);
    
    // Cria previews base64
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(p => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
    
    // Limpa o input para permitir re-selecção
    if (e.target) e.target.value = '';
  };

  const next = () => setStep(s => Math.min(s + 1, 4));
  const prev = () => { if (step === 1) onBack(); else setStep(s => s - 1); };

  // ── STEP 1 ─────────────────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={1} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Nome do lugar</label>
          <input type="text" placeholder="Ex.: Praia do Tofo, Fortaleza de São Sebastião..." value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none"
            style={{ borderColor: '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }} />
        </div>

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Categoria</label>
          <button onClick={() => setShowCat(true)} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border bg-white text-sm"
            style={{ borderColor: category ? (CATEGORY_COLORS[category] || '#E5E7EB') : '#E5E7EB', color: category ? '#1A1A1A' : '#9CA3AF' }}>
            <div className="flex items-center gap-2">
              {category && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: (CATEGORY_COLORS[category] || '#6B7280') + '20', color: CATEGORY_COLORS[category] || '#6B7280' }}>
                  {CATEGORY_ICONS[category]}
                </div>
              )}
              <span className="font-semibold">{category || 'Selecione a categoria...'}</span>
            </div>
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Tipo de lugar</label>
          <button onClick={() => setShowTipo(true)} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border bg-white text-sm"
            style={{ borderColor: tipo ? (tipoOptions.find(t => t.id === tipo)?.color || '#E5E7EB') : '#E5E7EB', color: tipo ? '#1A1A1A' : '#9CA3AF' }}>
            <div className="flex items-center gap-2">
              {tipo && (() => {
                const t = tipoOptions.find(o => o.id === tipo);
                return t ? (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: t.color + '20', color: t.color }}>
                    {t.icon}
                  </div>
                ) : null;
              })()}
              <span className="font-semibold">{tipo || 'Selecione o tipo de lugar...'}</span>
            </div>
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Melhor época para visitar</label>
          <button onClick={() => setShowEpoca(true)} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border bg-white text-sm"
            style={{ borderColor: epoca ? (epocaOptions.find(e => e.id === epoca)?.color || '#E5E7EB') : '#E5E7EB', color: epoca ? '#1A1A1A' : '#9CA3AF' }}>
            <div className="flex items-center gap-2">
              {epoca && (() => {
                const e = epocaOptions.find(o => o.id === epoca);
                return e ? (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: e.color + '20', color: e.color }}>
                    {e.icon}
                  </div>
                ) : null;
              })()}
              <div className="text-left">
                <span className="font-semibold block leading-tight">
                  {epoca ? epocaOptions.find(o => o.id === epoca)?.label : 'Selecione a melhor época...'}
                </span>
                {epoca && epocaOptions.find(o => o.id === epoca)?.subtitle && (
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    {epocaOptions.find(o => o.id === epoca)?.subtitle}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Destaques</label>
          <button onClick={() => setShowDest(true)} className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border bg-white text-sm"
            style={{ borderColor: '#E5E7EB', color: destaques.length ? '#1A1A1A' : '#9CA3AF' }}>
            <span className="truncate flex-1 text-left">
              {destaques.length ? destaquesOptions.filter(d => destaques.includes(d.id)).map(d => d.label).join(', ') : 'Selecione os destaques...'}
            </span>
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
          </button>
          {destaques.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {destaquesOptions.filter(d => destaques.includes(d.id)).map(d => (
                <span key={d.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                  {d.icon} {d.label}
                  <button onClick={() => toggleDest(d.id)} className="ml-1"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Descrição</label>
          <div className="relative">
            <textarea placeholder="O que torna este lugar único? Conte a sua história, curiosidades, dicas..." value={desc}
              onChange={e => setDesc(e.target.value.slice(0, 1000))} rows={4}
              className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none resize-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }} />
            <span className="absolute bottom-3 right-3 text-[10px]" style={{ color: '#C7C7CC' }}>{desc.length}/1000</span>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={() => {
          setStep1Error('');
          if (!name.trim())           return setStep1Error('O nome do lugar é obrigatório.');
          if (!category)              return setStep1Error('Seleciona a categoria.');
          if (!desc.trim())           return setStep1Error('A descrição é obrigatória.');
          if (!tipo)                  return setStep1Error('Seleciona o tipo de lugar.');
          if (!epoca)                 return setStep1Error('Seleciona a melhor época para visitar.');
          if (destaques.length === 0) return setStep1Error('Seleciona pelo menos um destaque.');
          next();
        }}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md"
          style={{ background: '#1B5E3B' }}>
          Continuar <ArrowRight size={20} />
        </motion.button>

        {step1Error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: '#FEF2F2' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{step1Error}</p>
          </div>
        )}

        <div style={{ background: 'linear-gradient(135deg, #EEF7F0 0%, #F0F9FF 100%)', borderRadius: 20, padding: '16px', border: '1px solid rgba(27,94,59,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1B5E3B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(27,94,59,0.25)' }}>
              <Check size={18} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#1B5E3B', marginBottom: 4 }}>
                Quase la!
              </p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#4B7A5E', lineHeight: 1.6 }}>
                A tua sugestao sera analisada pela equipa <strong style={{ color: '#1B5E3B' }}>Txopela Tour</strong> antes de ser publicada. Juntos mostramos o melhor de Mocambique!
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCat && <CategoryPickerSheet value={category} onSelect={setCategory} onClose={() => setShowCat(false)} />}
        {showTipo && <IconPickerSheet title="Tipo de lugar" options={tipoOptions} value={tipo} onSelect={setTipo} onClose={() => setShowTipo(false)} />}
        {showEpoca && <IconPickerSheet title="Melhor época para visitar" options={epocaOptions} value={epoca} onSelect={setEpoca} onClose={() => setShowEpoca(false)} />}
        {showDest && (
          <motion.div
            className="fixed z-50 flex items-center justify-center"
            style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDest(false)} />
            <motion.div
              className="relative flex flex-col"
              style={{
                width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(80vh - 50px)',
                background: 'white', borderRadius: 24,
                boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)',
              }}
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 16 }}
              transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
                <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>Destaques</h3>
                <button onClick={() => setShowDest(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#F3F4F6' }}>
                  <X size={15} style={{ color: '#6B7280' }} />
                </button>
              </div>

              <div className="mx-5 mb-1 h-px" style={{ background: '#F3F4F6' }} />

              {/* List */}
              <div className="px-3 py-2 overflow-y-auto">
                {destaquesOptions.map(opt => {
                  const active = destaques.includes(opt.id);
                  return (
                    <motion.button key={opt.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleDest(opt.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1 transition-all"
                      style={{ background: active ? '#EEF7F012' : 'transparent' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: active ? '#1B5E3B' : '#1B5E3B18',
                          color: active ? 'white' : '#1B5E3B',
                          boxShadow: active ? '0 4px 12px rgba(27,94,59,0.35)' : 'none',
                        }}>
                        {opt.icon}
                      </div>
                      <span className="text-sm font-bold flex-1 text-left transition-all"
                        style={{ color: active ? '#1B5E3B' : '#374151' }}>
                        {opt.label}
                      </span>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: active ? '#1B5E3B' : '#F3F4F6' }}>
                        {active && <Check size={11} color="white" strokeWidth={3} />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 pt-2 pb-5 flex-shrink-0">
                <div className="h-px mb-4" style={{ background: '#F3F4F6' }} />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDest(false)}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
                  style={{ background: '#1B5E3B', boxShadow: '0 4px 16px rgba(27,94,59,0.3)' }}>
                  <Check size={16} strokeWidth={2.5} />
                  Confirmar {destaques.length > 0 && `(${destaques.length})`}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── STEP 2 — Localização ───────────────────────────────────────────────────
  if (step === 2) return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={2} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

        {/* Título da secção */}
        <div>
          <p className="text-sm font-black flex items-center gap-2" style={{ color: '#1A1A1A' }}>
            <MapPin size={16} style={{ color: '#1B5E3B' }} />
            Localização
          </p>
        </div>

        {/* Mapa + GPS + pesquisa */}
        <LocationPicker
          initialLat={lat}
          initialLng={lng}
          mapHeight={260}
          onValidityChange={setLocationValid}
          onChange={(fields: GeoFields, src: LocationSource) => {
            setLat(fields.lat);
            setLng(fields.lng);
            setGeoSource(src);
            setAccuracy(fields.accuracy);
            setCountry(fields.country || '');
            setProvincia(fields.province || '');
            setDistrict(fields.district || '');
            setAdministrativePost(fields.administrative_post || '');
            // locality = Localidade/Vila/Cidade (nível exclusivo)
            setCidade(fields.locality || '');
            setAdministrativeArea(fields.administrative_area || '');
            setLocality(fields.locality || '');
            setSuburb(fields.suburb || '');
            setEndereco(fields.address || '');
            if (fields.nearby_reference !== undefined) {
              setNearbyReference(fields.nearby_reference);
            } else {
              setNearbyReference('');
            }
          }}
        />

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setStep2Error('');
            if (!lat) return setStep2Error('Define a localização no mapa antes de continuar.');
            if (!locationValid) return setStep2Error('País, Província e Distrito são obrigatórios para continuar.');
            next();
          }}
          disabled={!lat || !locationValid}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
          style={{ background: '#1B5E3B' }}
        >
          Continuar <ArrowRight size={20} />
        </motion.button>

        {step2Error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: '#FEF2F2' }}>
            <AlertCircle size={14} style={{ color: '#EF4444' }} />
            <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{step2Error}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── STEP 3 — Fotos ─────────────────────────────────────────────────────────
  if (step === 3) return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={3} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

        <div>
          <p className="text-sm font-black mb-0.5" style={{ color: '#1A1A1A' }}>Fotos do lugar</p>
          <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Adiciona até 10 fotos. A primeira será a foto principal.</p>
        </div>

        {/* Upload area */}
        <button onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed transition-all"
          style={{ borderColor: '#1B5E3B', background: '#EEF7F0' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#1B5E3B' }}>
            <Camera size={26} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black" style={{ color: '#1B5E3B' }}>Adicionar fotos</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>JPG, PNG até 10MB cada</p>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} className="hidden" />

        {/* Photo scroll */}
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {photos.map((p, i) => (
              <div key={i} className="relative flex-shrink-0 rounded-2xl overflow-hidden"
                style={{ width: 110, height: 110 }}>
                <img src={p} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{ background: '#1B5E3B' }}>Principal</span>
                )}
                <button onClick={() => {
                  setPhotos(prev => prev.filter((_, j) => j !== i));
                  setPhotoFiles(prev => prev.filter((_, j) => j !== i)); // Remove ficheiro também
                }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 10 && (
              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 rounded-2xl border-2 border-dashed flex items-center justify-center"
                style={{ width: 110, height: 110, borderColor: '#E5E7EB' }}>
                <ImageIcon size={24} className="text-gray-300" />
              </button>
            )}
          </div>
        )}

        {/* Tips */}
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
              { icon: <Sun size={14} />,          text: 'Usa luz natural sempre que possível' },
              { icon: <Maximize2 size={14} />,     text: 'Mostra diferentes ângulos do lugar' },
              { icon: <DoorOpen size={14} />,      text: 'Inclui fotos da entrada e do interior' },
              { icon: <EyeOff size={14} />,        text: 'Evita fotos desfocadas ou escuras' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                  {icon}
                </div>
                <p className="text-xs font-semibold leading-tight" style={{ color: '#374151' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={next}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md"
          style={{ background: '#1B5E3B' }}>
          Continuar <ArrowRight size={20} />
        </motion.button>
      </div>
    </div>
  );

  // ── STEP 4 — Revisão ───────────────────────────────────────────────────────

  // Tela de sucesso — reutilizando componente compartilhado
  if (submitted) {
    return <SubmissionSuccessScreen entityType="Local" onSuccess={onSuccess} />;
  }

  const catLabel = category || '—';  const tipoLabel = tipoOptions.find(o => o.id === tipo)?.label || tipo || '—';
  const provLabel = provincia || '—';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={4} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

        <div>
          <p className="text-sm font-black mb-0.5" style={{ color: '#1A1A1A' }}>Revisão final</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Confirma os dados antes de enviar a sugestão.</p>
        </div>

        {/* Photo preview */}
        {photos.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ height: 180 }}>
            <img src={photos[0]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
            <div className="absolute bottom-3 left-3 right-3">
              <h2 className="text-white font-black text-lg">{name || 'Sem nome'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/80 text-xs flex items-center gap-1"><MapPin size={11} />{provLabel}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-white" style={{ background: '#1B5E3B' }}>{catLabel}</span>
              </div>
            </div>
            {photos.length > 1 && (
              <span className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">+{photos.length - 1} fotos</span>
            )}
          </div>
        )}

        {/* Info cards */}
        {[
          { label: 'Informações', items: [
            { k: 'Nome', v: name || '—' },
            { k: 'Categoria', v: catLabel },
            { k: 'Tipo', v: tipoLabel },
            { k: 'Melhor época', v: (() => { const e = epocaOptions.find(o => o.id === epoca); return e ? `${e.label} · ${e.subtitle}` : '—'; })() },
          ]},
          { label: 'Localização', items: [
            { k: 'País', v: country || 'Moçambique' },
            { k: 'Província', v: provLabel },
            { k: 'Distrito', v: district || cidade || '—' },
            { k: 'Cidade/Vila', v: cidade || '—' },
            ...(administrativeArea ? [{ k: 'Posto Administrativo', v: administrativeArea }] : []),
            ...(locality ? [{ k: 'Localidade', v: locality }] : []),
            ...(suburb ? [{ k: 'Bairro', v: suburb }] : []),
            { k: 'Endereço', v: endereco || '—' },
            ...(nearbyReference ? [{ k: 'Referência / Perto de', v: nearbyReference }] : []),
          ]},
        ].map(section => (
          <div key={section.label} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>{section.label}</p>
              <button onClick={() => setStep(section.label === 'Informações' ? 1 : 2)}
                className="text-xs font-bold" style={{ color: '#1B5E3B' }}>Editar</button>
            </div>
            {section.items.map(item => (
              <div key={item.k} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{item.k}</span>
                <span className="text-xs font-bold text-right max-w-[60%]" style={{ color: '#1A1A1A' }}>{item.v}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Descrição */}
        {desc && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-black mb-2" style={{ color: '#1A1A1A' }}>Descrição</p>
            <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{desc}</p>
          </div>
        )}

        {/* Destaques */}
        {destaques.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-black mb-2" style={{ color: '#1A1A1A' }}>Destaques</p>
            <div className="flex flex-wrap gap-2">
              {destaquesOptions.filter(d => destaques.includes(d.id)).map(d => (
                <span key={d.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                  {d.icon} {d.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rating preview */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-black mb-2" style={{ color: '#1A1A1A' }}>Avaliação inicial</p>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={28} fill="none" stroke="#D1D5DB" strokeWidth={1.5} />
            ))}
            <span className="text-sm font-black ml-1" style={{ color: '#9CA3AF' }}>0.0</span>
          </div>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>A avaliação será actualizada pela comunidade</p>
        </div>

        {/* Submit */}
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md"
          style={{ background: '#1B5E3B' }}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" /> A enviar...
            </>
          ) : (
            <>
              <Check size={20} /> Enviar sugestão
            </>
          )}
        </motion.button>

        <div style={{ background: 'linear-gradient(135deg, #EEF7F0 0%, #F0F9FF 100%)', borderRadius: 20, padding: '16px', border: '1px solid rgba(27,94,59,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1B5E3B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(27,94,59,0.25)' }}>
              <Check size={18} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#1B5E3B', marginBottom: 4 }}>
                Quase la!
              </p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#4B7A5E', lineHeight: 1.6 }}>
                A tua sugestao sera analisada pela equipa <strong style={{ color: '#1B5E3B' }}>Txopela Tour</strong> antes de ser publicada. Juntos mostramos o melhor de Mocambique!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






