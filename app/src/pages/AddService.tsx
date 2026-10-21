import { useState, useRef, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconChevronLeft, IconChevronDown, IconArrowRight, IconCheck, IconClose,
  IconMapPin, IconCamera, IconTrash, IconPhone, IconMail, IconChat,
  IconLock, IconGlobe, IconNavigation,
  ServiceTypeIcon, STROKE,
} from '@/components/icons';
import { ChevronLeft, ChevronDown, ArrowRight, Check, X, MapPin, Camera, Trash2, Phone, Mail, MessageCircle, Lock, Globe, Hotel, Compass, UtensilsCrossed, Car, Building2, AlertCircle, Sun, Maximize2, DoorOpen, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { servicesApi } from '@/services/api';
import { canCreateBusiness, UPGRADE_MESSAGE, UPGRADE_STEPS } from '@/utils/permissions';
import { uploadAndCache, cacheImages } from '@/utils/imageCache';
import SubmissionSuccessScreen from '@/components/shared/SubmissionSuccessScreen';
import { useScrollTop } from '@/hooks/useScrollTop';
import LocationPicker, { type GeoFields, type LocationSource } from '@/components/LocationPicker';
import { buildFullAddress } from '@/utils/normalizeLocation';

interface AddServiceProps {
  onSuccess: () => void;
  onBack: () => void;
}

function ServiceIcon({ id, size = 28, color = 'white' }: { id: string; size?: number; color?: string }) {
  const props = { size, color, strokeWidth: 1.8 };
  switch (id) {
    case 'accommodation': return <Hotel {...props} />;
    case 'guide':         return <Compass {...props} />;
    case 'experience':    return <UtensilsCrossed {...props} />;
    case 'transport':     return <Car {...props} />;
    default:              return <Building2 {...props} />;
  }
}

const serviceTypes = [
  { id: 'accommodation', label: 'Hospedagem',      desc: 'Hotel, pousada, casa de hóspedes',    color: '#2BB5C8', bg: '#EBF8FB' },
  { id: 'guide',         label: 'Guia Turístico',   desc: 'Tours, excursões, guias locais',      color: '#1B5E3B', bg: '#EEF7F0' },
  { id: 'experience',    label: 'Experiência',      desc: 'Restaurante, café, bar, actividades', color: '#E05A3A', bg: '#FEF0EB' },
  { id: 'transport',     label: 'Transporte',       desc: 'Transfer, aluguer, táxi turístico',   color: '#7B5EA7', bg: '#F3EEFB' },
];

const steps = [
  { n: 1, label: 'Tipo' },
  { n: 2, label: 'Dados' },
  { n: 3, label: 'Localização' },
  { n: 4, label: 'Fotos' },
  { n: 5, label: 'Revisão' },
];

const STEP_COLORS = ['#1B5E3B', '#0077B6', '#2BB5C8', '#7B5EA7', '#F4821F'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="w-full mt-4" style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px 1fr 28px 1fr 28px 1fr 28px', alignItems: 'center' }}>
      {steps.map((s, i) => {
        const active = s.n === current;
        const done = s.n < current;
        const color = STEP_COLORS[i];
        return (
          <>
            <div key={`step-${s.n}`} className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: (active || done) ? color : 'white', border: `2px solid ${(active || done) ? color : '#E5E7EB'}`, color: (active || done) ? 'white' : '#9CA3AF' }}>
                {done ? <Check size={12} /> : s.n}
              </div>
              <span className="text-[9px] font-bold mt-1 text-center whitespace-nowrap"
                style={{ color: (active || done) ? color : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
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
    <div className="bg-white px-4 pt-5 pb-4">
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
          <h1 className="text-2xl font-black text-left" style={{ color: '#1A1A1A' }}>Cadastrar serviço</h1>
        </div>
        <StepBar current={step} />
      </div>
    </div>
  );
}

// ── Popup de seleção de tipo de preço ─────────────────────────────────────────
function PricingPickerSheet({ value, onSelect, onClose }: {
  value: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  const options = [
    { id: 'fixed',    label: 'Preço fixo', subtitle: 'Um valor fixo por serviço ou sessão',      color: '#1B5E3B',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
    { id: 'variable', label: 'Variável',   subtitle: 'O preço pode variar conforme o pedido',    color: '#0077B6',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { id: 'free',     label: 'Gratuito',   subtitle: 'O serviço não tem custo para o cliente',   color: '#22C55E',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
  ];
  return (
    <motion.div className="fixed z-50 flex items-center justify-center"
      style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div className="relative flex flex-col"
        style={{ width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(80vh - 50px)', background: 'white', borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        initial={{ opacity: 0, scale: 0.88, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }} transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>Como cobras pelo teu serviço?</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
            <X size={15} style={{ color: '#6B7280' }} />
          </button>
        </div>
        <div className="mx-5 mb-3 h-px" style={{ background: '#F3F4F6' }} />
        <div className="px-3 py-2 overflow-y-auto flex-1">
          {options.map(opt => {
            const active = value === opt.id;
            return (
              <motion.button key={opt.id} whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(opt.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1 transition-all"
                style={{ background: active ? opt.color + '12' : 'transparent' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: active ? opt.color : opt.color + '18', color: active ? 'white' : opt.color, boxShadow: active ? `0 4px 12px ${opt.color}40` : 'none' }}>
                  {opt.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold leading-tight" style={{ color: active ? opt.color : '#374151' }}>{opt.label}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: '#9CA3AF' }}>{opt.subtitle}</p>
                </div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: active ? opt.color : '#F3F4F6' }}>
                  {active && <Check size={11} color="white" strokeWidth={3} />}
                </div>
              </motion.button>
            );
          })}
        </div>
        <div className="px-4 pt-2 pb-5 flex-shrink-0">
          <div className="h-px mb-4" style={{ background: '#F3F4F6' }} />
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
            style={{ background: '#1B5E3B', boxShadow: '0 4px 16px rgba(27,94,59,0.3)' }}>
            <Check size={16} strokeWidth={2.5} /> Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Popup de seleção de moeda ─────────────────────────────────────────────────
function CurrencyPickerSheet({ value, onSelect, onClose }: {
  value: string; onSelect: (v: 'MZN' | 'USD' | 'EUR') => void; onClose: () => void;
}) {
  const currencies = [
    { id: 'MZN' as const, label: 'Metical Moçambicano', flag: '🇲🇿' },
    { id: 'USD' as const, label: 'Dólar Americano',     flag: '🇺🇸' },
    { id: 'EUR' as const, label: 'Euro',                flag: '🇪🇺' },
  ];
  return (
    <motion.div className="fixed z-50 flex items-center justify-center"
      style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div className="relative flex flex-col"
        style={{ width: 340, maxWidth: 'calc(100vw - 32px)', background: 'white', borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        initial={{ opacity: 0, scale: 0.88, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }} transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>Moeda</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
            <X size={15} style={{ color: '#6B7280' }} />
          </button>
        </div>
        <div className="mx-5 mb-3 h-px" style={{ background: '#F3F4F6' }} />
        <div className="px-3 py-2">
          {currencies.map((cur, idx, arr) => {
            const active = value === cur.id;
            return (
              <div key={cur.id}>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { onSelect(cur.id); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all"
                  style={{ background: active ? '#EEF7F0' : 'transparent' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: active ? '#1B5E3B' : '#F3F4F6', boxShadow: active ? '0 4px 12px rgba(27,94,59,0.3)' : 'none' }}>
                    {cur.flag}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold" style={{ color: active ? '#1B5E3B' : '#374151' }}>{cur.id}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{cur.label}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: active ? '#1B5E3B' : '#F3F4F6' }}>
                    {active && <Check size={11} color="white" strokeWidth={3} />}
                  </div>
                </motion.button>
                {idx < arr.length - 1 && <div style={{ height: 1, background: '#F9FAFB', marginLeft: 56, marginRight: 12 }} />}
              </div>
            );
          })}
        </div>
        <div className="px-4 pt-2 pb-5">
          <div className="h-px mb-3" style={{ background: '#F3F4F6' }} />
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
            style={{ background: '#1B5E3B', boxShadow: '0 4px 16px rgba(27,94,59,0.3)' }}>
            <Check size={16} strokeWidth={2.5} /> Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Popup de seleção múltipla (Características / Requisitos) ──────────────────
function MultiSelectSheet({ title, options, selected, color, onToggle, onAddCustom, onClose }: {
  title: string;
  options: { id: string; label: string; icon: React.ReactNode; color: string }[];
  selected: string[];
  color: string;
  onToggle: (v: string) => void;
  onAddCustom: (v: string) => void;
  onClose: () => void;
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue]         = useState('');
  const customItems = selected.filter(s => !options.find(o => o.label === s));

  const handleAddCustom = () => {
    const v = customValue.trim();
    if (v) { onAddCustom(v); setCustomValue(''); setShowCustomInput(false); }
  };

  return (
    <motion.div className="fixed z-50 flex items-center justify-center"
      style={{ top: 0, bottom: 0, left: 'var(--sidebar-w, 0px)', right: 0 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <motion.div className="relative flex flex-col"
        style={{ width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(85vh - 40px)', background: 'white', borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        initial={{ opacity: 0, scale: 0.88, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }} transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}>

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

          {/* Items custom já adicionados */}
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

          {/* Botão "Outro..." */}
          {!showCustomInput && (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1"
              style={{ background: 'transparent' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#F3F4F6', color: '#9CA3AF' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-left" style={{ color: '#9CA3AF' }}>Outro...</span>
              <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: '#F3F4F6' }} />
            </motion.button>
          )}

          {/* Input inline para "Outro" */}
          <AnimatePresence>
            {showCustomInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                className="overflow-hidden px-1 mb-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 mt-1"
                  style={{ borderColor: customValue ? color : '#E5E7EB', background: '#FAFAFA' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: color + '18', color }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <input autoFocus type="text" placeholder="Escreve aqui..."
                    value={customValue} onChange={e => setCustomValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
                    className="flex-1 text-sm bg-transparent focus:outline-none font-bold"
                    style={{ fontFamily: 'Nunito, sans-serif', color: '#1A1A1A' }} />
                  <button type="button" onClick={() => { setShowCustomInput(false); setCustomValue(''); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F3F4F6' }}>
                    <X size={11} style={{ color: '#9CA3AF' }} />
                  </button>
                </div>
                {customValue.trim() && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="button"
                    onClick={handleAddCustom}
                    className="w-full mt-2 py-2.5 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5"
                    style={{ background: color }}>
                    <Check size={13} strokeWidth={3} /> Adicionar
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 pt-2 pb-5 flex-shrink-0">
          <div className="h-px mb-3" style={{ background: '#F3F4F6' }} />
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
            style={{ background: '#1B5E3B', boxShadow: '0 4px 16px rgba(27,94,59,0.3)' }}>
            <Check size={16} strokeWidth={2.5} /> Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Listas de opções com ícones ───────────────────────────────────────────────
const FEATURE_OPTIONS_LIST = [
  { id: 'wifi',     label: 'Wi-Fi',                color: '#1B5E3B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> },
  { id: 'pickup',   label: 'Pickup',               color: '#1B5E3B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { id: 'meals',    label: 'Refeições incluídas',  color: '#1B5E3B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
  { id: 'guide',    label: 'Guia incluído',        color: '#1B5E3B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { id: 'equip',    label: 'Equipamento incluído', color: '#1B5E3B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  { id: 'access',   label: 'Acessível',            color: '#1B5E3B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
  { id: 'parking',  label: 'Estacionamento',       color: '#1B5E3B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg> },
  { id: 'ac',       label: 'Ar condicionado',      color: '#1B5E3B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="8" rx="2"/><line x1="6" y1="14" x2="4" y2="20"/><line x1="18" y1="14" x2="20" y2="20"/><line x1="12" y1="14" x2="12" y2="20"/></svg> },
];

const REQUIREMENT_OPTIONS_LIST = [
  { id: 'id',     label: 'Documento de identidade', color: '#7B5EA7', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { id: 'swim',   label: 'Roupa de banho',          color: '#7B5EA7', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg> },
  { id: 'shoes',  label: 'Calçado fechado',         color: '#7B5EA7', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> },
  { id: 'sun',    label: 'Protetor solar',          color: '#7B5EA7', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg> },
  { id: 'book',   label: 'Reserva antecipada',      color: '#7B5EA7', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'age18',  label: 'Idade mínima 18+',        color: '#7B5EA7', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'swim2',  label: 'Saber nadar',             color: '#7B5EA7', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1"/><path d="M2 17c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1"/><circle cx="12" cy="5" r="2"/></svg> },
];

const previewServices = [
  { id: 'hospedagem',  name: 'Casa da Praia',  type: 'Hospedagem',   rating: 4.8, reviews: 56,  image: '/images/local-5.jpg' },
  { id: 'guia',        name: 'Guias do Tofo',  type: 'Guias locais', rating: 4.9, reviews: 34,  image: '/images/local-6.jpg' },
  { id: 'restaurante', name: 'Sabor da Terra', type: 'Restaurante',  rating: 4.6, reviews: 41,  image: '/images/local-7.jpg' },
];

// ── Modal de upgrade — role sem permissão (Breaking Changes v2.1.0) ───────────
function UpgradeModal({ onClose, onSettings }: { onClose: () => void; onSettings: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg mx-2 mb-4 rounded-3xl p-6"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
            <Lock size={22} style={{ color: '#D97706' }} />
          </div>
          <div>
            <h3 className="font-black text-base" style={{ color: '#0F172A' }}>Upgrade necessário</h3>
            <p className="text-xs" style={{ color: '#64748B' }}>Permissão de negócio local requerida</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={16} style={{ color: '#64748B' }} />
          </button>
        </div>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: '#475569' }}>
          {UPGRADE_MESSAGE}
        </p>
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#374151' }}>Como fazer upgrade:</p>
          <ol className="space-y-2">
            {UPGRADE_STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: '#64748B' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-black text-[10px]"
                  style={{ background: '#1B5E3B', color: 'white' }}>
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold"
            style={{ background: '#F1F5F9', color: '#64748B' }}>
            Cancelar
          </button>
          <button onClick={onSettings}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B7A45)' }}>
            Ir para definições
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AddService({ onSuccess, onBack }: AddServiceProps) {
  useScrollTop();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Upgrade modal — Breaking Changes v2.1.0 ──────────────────────────────
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Step 1
  const [serviceType, setServiceType] = useState('');
  const [outroLabel, setOutroLabel]   = useState('');

  // Step 2 — dados básicos
  const [nome, setNome]       = useState('');
  const [desc, setDesc]       = useState('');
  const [telefone, setTelefone] = useState(() => user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(() => user?.phone || '');
  const [email, setEmail]     = useState(() => user?.email || '');

  // Horário
  type HorarioTipo = 'todos' | 'uteis' | 'fds' | 'personalizado';
  const [horarioTipo, setHorarioTipo]   = useState<HorarioTipo>('todos');
  const [horarioAbre, setHorarioAbre]   = useState('08:00');
  const [horarioFecha, setHorarioFecha] = useState('18:00');
  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
  const [diasCustom, setDiasCustom]     = useState<string[]>(['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);
  const buildHorario = (): string => {
    const h = `${horarioAbre.replace(':', 'h')}–${horarioFecha.replace(':', 'h')}`;
    if (horarioTipo === 'todos')  return `Todos os dias • ${h}`;
    if (horarioTipo === 'uteis')  return `Seg–Sex • ${h}`;
    if (horarioTipo === 'fds')    return `Sáb–Dom • ${h}`;
    if (diasCustom.length === 0)  return h;
    return `${diasCustom.join(', ')} • ${h}`;
  };
  const horario = buildHorario();

  // Preçário
  type PricingType = 'fixed' | 'variable' | 'free';
  const [pricingType, setPricingType]         = useState<PricingType>('fixed');
  const [pricingAmount, setPricingAmount]     = useState('');
  const [pricingCurrency, setPricingCurrency] = useState<'MZN' | 'USD' | 'EUR'>('MZN');
  const [pricingDetails, setPricingDetails]   = useState('');

  // Disponibilidade
  const [isAvailable, setIsAvailable]     = useState(true);
  const [advanceBooking, setAdvanceBooking] = useState('0');

  // Características e Requisitos
  const [selectedFeatures, setSelectedFeatures]       = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const toggleFeature    = (f: string) => setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const toggleRequirement = (r: string) => setSelectedRequirements(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  // Sheet visibility
  const [showPricing, setShowPricing]           = useState(false);
  const [showCurrency, setShowCurrency]         = useState(false);
  const [showFeatures, setShowFeatures]         = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  // Step 3 — localização
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito]   = useState('');
  const [endereco, setEndereco]   = useState('');
  const [lat, setLat]             = useState('');
  const [lng, setLng]             = useState('');
  const [geoSource, setGeoSource] = useState<LocationSource>(null);
  const [locationValid, setLocationValid] = useState(false);
  const [country, setCountry]                       = useState('');
  const [city, setCity]                             = useState('');
  const [administrativePost, setAdministrativePost] = useState('');
  const [administrativeArea, setAdministrativeArea] = useState('');
  const [locality, setLocality]                     = useState('');
  const [suburb, setSuburb]                         = useState('');
  const [nearbyReference, setNearbyReference]       = useState('');
  const [accuracy, setAccuracy]                     = useState<number | undefined>(undefined);

  // Step 4 — fotos
  const [photos, setPhotos]       = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, 20 - photos.length);
    setPhotoFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(p => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
    if (e.target) e.target.value = '';
  };

  const next = () => setStep(s => Math.min(s + 1, 5));
  const prev = () => { if (step === 1) onBack(); else setStep(s => s - 1); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // ── Breaking Changes v2.1.0: verificar role antes de enviar ──────────────
    if (!canCreateBusiness(user?.role, user?.type)) {
      setShowUpgradeModal(true);
      return;
    }

    if (!nome.trim())      { setSubmitError('O nome do serviço é obrigatório.'); return; }
    if (!desc.trim())      { setSubmitError('A descrição é obrigatória.'); return; }
    if (!telefone.trim())  { setSubmitError('O telefone é obrigatório.'); return; }
    if (!provincia.trim()) { setSubmitError('Seleciona a província.'); return; }
    setIsSubmitting(true); setSubmitError(null);

    const extractErrorMsg = (error: unknown): string => {
      if (!error) return 'Erro desconhecido';
      if (typeof error === 'string') return error;
      const e = error as any;
      if (e?.details && typeof e.details === 'object') return Object.entries(e.details).map(([f, m]) => `${f}: ${Array.isArray(m) ? (m as any[]).join(', ') : String(m)}`).join('\n');
      if (e?.error?.details && typeof e.error.details === 'object') return Object.entries(e.error.details).map(([f, m]) => `${f}: ${Array.isArray(m) ? (m as any[]).join(', ') : String(m)}`).join('\n');
      if (typeof e?.message === 'string') return e.message;
      if (typeof e?.detail  === 'string') return e.detail;
      if (typeof e?.error   === 'string') return e.error;
      try { return JSON.stringify(error, null, 2); } catch { return 'Erro ao processar resposta'; }
    };

    try {
      const backendCategory = serviceType === 'outro' ? 'experience' : (serviceType || 'experience');
      const payload: Record<string, any> = {
        title: nome.trim(), description: desc.trim(),
        category: backendCategory, phone: telefone.trim(), province: provincia.trim(),
      };
      if (serviceType === 'outro' && outroLabel.trim()) payload.notes = `Tipo de serviço: ${outroLabel.trim()}`;
      if (distrito.trim()) payload.municipality = distrito.trim();
      const fullAddress = buildFullAddress({ locality: city, administrativePost, district: distrito, province: provincia });
      if (fullAddress)       payload.address       = fullAddress;
      // Breaking Changes v2.1.0: latitude/longitude agora suportados pelo ServiceWriteRequest
      if (lat.trim())        payload.latitude      = parseFloat(lat);
      if (lng.trim())        payload.longitude     = parseFloat(lng);
      if (whatsapp.trim())   payload.whatsapp      = whatsapp.trim();
      if (email.trim())      payload.contact_email = email.trim();
      if (horario.trim())    payload.schedule      = horario.trim();

      // Preçário
      if (pricingType !== 'free' && pricingAmount.trim()) {
        payload.pricing = JSON.stringify({ type: pricingType, amount: parseFloat(pricingAmount) || 0, currency: pricingCurrency, details: pricingDetails.trim() });
      } else if (pricingType === 'free') {
        payload.pricing = JSON.stringify({ type: 'free', amount: 0, currency: pricingCurrency, details: pricingDetails.trim() });
      }
      // Disponibilidade
      payload.availability = JSON.stringify({ isAvailable, advanceBooking: parseInt(advanceBooking, 10) || 0 });
      // Características e Requisitos
      if (selectedFeatures.length > 0)    payload.features     = JSON.stringify(selectedFeatures);
      if (selectedRequirements.length > 0) payload.requirements = JSON.stringify(selectedRequirements);

      // O serviço é criado com TODOS os campos + imagens no mesmo POST multipart.
      // É o único ponto em que o backend associa as imagens ao registo
      // (POST /api/services/ → images: File[]). Upload e associação em passos
      // separados deixavam as fotos no Cloudinary mas sem vínculo ao serviço.
      const fd = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        fd.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
      photoFiles.slice(0, 20).forEach(f => fd.append('images', f));

      const { data, error } = await servicesApi.create(fd);
      if (error) {
        // 403 com dados de upgrade — mostrar modal
        const d403 = (data as any);
        if (d403?.action_required || d403?.current_role) {
          setShowUpgradeModal(true);
          return;
        }
        setSubmitError(extractErrorMsg(error));
        return;
      }

      const serviceId = data?.service?.id ?? data?.id;

      // Confirmar no backend as URLs das imagens e guardá-las no cache local
      if (photoFiles.length > 0 && serviceId) {
        try {
          const { data: getData } = await servicesApi.get(serviceId);
          const backendImages: string[] = Array.isArray(getData?.images) ? getData.images.filter((u: any) => typeof u === 'string' && u.trim()) : [];
          if (backendImages.length > 0) cacheImages(serviceId, backendImages);
          else await uploadAndCache(photoFiles.slice(0, 20), serviceId, 'service');
        } catch {
          await uploadAndCache(photoFiles.slice(0, 20), serviceId, 'service');
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message || 'Erro ao enviar serviço. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.type !== 'business' && user?.type !== 'guide') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#FEF2F2' }}>
          <Lock size={32} style={{ color: '#EF4444' }} />
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: '#1A1A1A' }}>Acesso restrito</h2>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          Esta funcionalidade está disponível apenas para negócios locais.<br />
          Actualiza o teu perfil para "Negócio" para aceder.
        </p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onBack}
          className="px-6 py-3 rounded-2xl text-white font-black" style={{ background: '#1B5E3B' }}>
          Voltar
        </motion.button>
      </div>
    );
  }

  if (submitted) return <SubmissionSuccessScreen entityType="Serviço" onSuccess={onSuccess} />;

  // ── Upgrade overlay (visível em qualquer step) ────────────────────────────
  const upgradeOverlay = (
    <AnimatePresence>
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onSettings={() => { setShowUpgradeModal(false); onBack(); }}
        />
      )}
    </AnimatePresence>
  );

  // ── STEP 1 ────────────────────────────────────────────────────────────────
  if (step === 1) return (
    <>
    {upgradeOverlay}
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={1} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        <p className="text-base font-black" style={{ color: '#1A1A1A' }}>Que tipo de serviço queres cadastrar?</p>
        <div className="space-y-3">
          {serviceTypes.map(st => {
            const active = serviceType === st.id;
            return (
              <motion.button key={st.id} whileTap={{ scale: 0.98 }}
                onClick={() => setServiceType(st.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
                style={{ borderColor: active ? st.color : '#E5E7EB', background: active ? st.bg : 'white' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: active ? st.color : st.bg }}>
                  <ServiceIcon id={st.id} size={24} color={active ? 'white' : st.color} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-base" style={{ color: active ? st.color : '#1A1A1A' }}>{st.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{st.desc}</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor: active ? st.color : '#E5E7EB', background: active ? st.color : 'transparent' }}>
                  {active && <Check size={13} color="white" strokeWidth={2.5} />}
                </div>
              </motion.button>
            );
          })}

          {/* Card Outro */}
          {(() => {
            const active = serviceType === 'outro';
            const color = '#64748B'; const bg = '#F8FAFC';
            return (
              <div>
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => setServiceType('outro')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
                  style={{ borderColor: active ? color : '#E5E7EB', background: active ? bg : 'white' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: active ? color : bg }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-base" style={{ color: active ? color : '#1A1A1A' }}>Outro</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Serviço não listado acima</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ borderColor: active ? color : '#E5E7EB', background: active ? color : 'transparent' }}>
                    {active && <Check size={13} color="white" strokeWidth={2.5} />}
                  </div>
                </motion.button>
                <AnimatePresence>
                  {active && (
                    <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <input autoFocus type="text" placeholder="Ex.: Fotografia, Mergulho, Artesanato..."
                        value={outroLabel} onChange={e => setOutroLabel(e.target.value)} maxLength={60}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 bg-white text-sm focus:outline-none"
                        style={{ borderColor: color, fontFamily: 'Nunito, sans-serif' }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}
        </div>
        <motion.button whileTap={{ scale: 0.98 }} onClick={next}
          disabled={!serviceType || (serviceType === 'outro' && !outroLabel.trim())}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
          style={{ background: '#1B5E3B' }}>
          Continuar <ArrowRight size={20} />
        </motion.button>
      </div>
    </div>
    </>
  );

  // ── STEP 2 ────────────────────────────────────────────────────────────────
  if (step === 2) {
    const st = serviceTypes.find(s => s.id === serviceType);
    return (
      <>
      {upgradeOverlay}
      <AnimatePresence>
        {showPricing && <PricingPickerSheet value={pricingType} onSelect={v => setPricingType(v as PricingType)} onClose={() => setShowPricing(false)} />}
        {showCurrency && <CurrencyPickerSheet value={pricingCurrency} onSelect={setPricingCurrency} onClose={() => setShowCurrency(false)} />}
        {showFeatures && (
          <MultiSelectSheet title="Características incluídas" color="#1B5E3B"
            options={FEATURE_OPTIONS_LIST} selected={selectedFeatures} onToggle={toggleFeature}
            onAddCustom={v => { if (!selectedFeatures.includes(v)) setSelectedFeatures(p => [...p, v]); }}
            onClose={() => setShowFeatures(false)} />
        )}
        {showRequirements && (
          <MultiSelectSheet title="Requisitos para o cliente" color="#7B5EA7"
            options={REQUIREMENT_OPTIONS_LIST} selected={selectedRequirements} onToggle={toggleRequirement}
            onAddCustom={v => { if (!selectedRequirements.includes(v)) setSelectedRequirements(p => [...p, v]); }}
            onClose={() => setShowRequirements(false)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
        <PageHeader step={2} onBack={prev} />
        <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

          {/* Tipo selecionado */}
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#EEF7F0' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: st?.color || '#64748B' }}>
              {st ? <ServiceIcon id={st.id} size={20} color="white" /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-black" style={{ color: '#1B5E3B' }}>{st ? st.label : outroLabel || 'Outro'}</p>
              <p className="text-[10px]" style={{ color: '#4B7A5E' }}>Categoria seleccionada</p>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Nome do serviço <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" placeholder={`Ex.: ${st?.label === 'Hospedagem' ? 'Casa da Praia' : 'Guias do Tofo'}...`}
              value={nome} onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none"
              style={{ borderColor: '#E5E7EB', fontFamily: 'Nunito, sans-serif' }} />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Descrição <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="relative">
              <textarea placeholder="Descreve o teu serviço, o que ofereces, diferenciais..."
                value={desc} onChange={e => setDesc(e.target.value.slice(0, 500))} rows={3}
                className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none resize-none"
                style={{ borderColor: '#E5E7EB', fontFamily: 'Nunito, sans-serif' }} />
              <span className="absolute bottom-3 right-3 text-[10px]" style={{ color: '#C7C7CC' }}>{desc.length}/500</span>
            </div>
          </div>

          {/* Horário */}
          <div>
            <label className="block text-sm font-black mb-2" style={{ color: '#1A1A1A' }}>Horário de funcionamento</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {([
                { id: 'todos', label: 'Todos os dias' }, { id: 'uteis', label: 'Dias úteis' },
                { id: 'fds', label: 'Fins de semana' }, { id: 'personalizado', label: 'Personalizado' },
              ] as { id: HorarioTipo; label: string }[]).map(opt => {
                const active = horarioTipo === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setHorarioTipo(opt.id)}
                    className="py-2.5 px-3 rounded-2xl border-2 text-xs font-black transition-all text-center"
                    style={{ borderColor: active ? '#0077B6' : '#E5E7EB', background: active ? '#EFF8FF' : 'white', color: active ? '#0077B6' : '#6B7280' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {horarioTipo === 'personalizado' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {DIAS.map(dia => {
                  const active = diasCustom.includes(dia);
                  return (
                    <button key={dia} type="button"
                      onClick={() => setDiasCustom(prev => active ? prev.filter(d => d !== dia) : [...prev, dia])}
                      className="w-10 h-10 rounded-full border-2 text-xs font-black transition-all"
                      style={{ borderColor: active ? '#0077B6' : '#E5E7EB', background: active ? '#0077B6' : 'white', color: active ? 'white' : '#6B7280' }}>
                      {dia}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold mb-1" style={{ color: '#6B7280' }}>Abre</p>
                <input type="time" value={horarioAbre} onChange={e => setHorarioAbre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 bg-white text-sm font-bold focus:outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }} />
              </div>
              <div>
                <p className="text-[11px] font-bold mb-1" style={{ color: '#6B7280' }}>Fecha</p>
                <input type="time" value={horarioFecha} onChange={e => setHorarioFecha(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 bg-white text-sm font-bold focus:outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }} />
              </div>
            </div>
            <div className="mt-2 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: '#F0FDF4' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-xs font-bold" style={{ color: '#16A34A' }}>{horario}</span>
            </div>
          </div>

          {/* Contacto */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>Contacto</p>
            {(user?.phone || user?.email) && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: '#EFF8FF', color: '#0077B6' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Preenchido do teu perfil
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white"
            style={{ borderColor: telefone && telefone === user?.phone ? '#0077B6' : '#E5E7EB' }}>
            <Phone size={18} className="flex-shrink-0" style={{ color: telefone && telefone === user?.phone ? '#0077B6' : '#9CA3AF' }} />
            <input type="tel" placeholder="Telefone *" value={telefone} onChange={e => setTelefone(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none" style={{ fontFamily: 'Nunito, sans-serif' }} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white"
            style={{ borderColor: whatsapp && whatsapp === user?.phone ? '#0077B6' : '#E5E7EB' }}>
            <MessageCircle size={18} className="flex-shrink-0" style={{ color: whatsapp && whatsapp === user?.phone ? '#0077B6' : '#9CA3AF' }} />
            <input type="tel" placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none" style={{ fontFamily: 'Nunito, sans-serif' }} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white"
            style={{ borderColor: email && email === user?.email ? '#0077B6' : '#E5E7EB' }}>
            <Mail size={18} className="flex-shrink-0" style={{ color: email && email === user?.email ? '#0077B6' : '#9CA3AF' }} />
            <input type="email" placeholder="Email (opcional)" value={email} onChange={e => setEmail(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none" style={{ fontFamily: 'Nunito, sans-serif' }} />
          </div>

          {/* ── Preçário ───────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Como cobras pelo teu serviço?</label>
            <button type="button" onClick={() => setShowPricing(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border bg-white text-sm"
              style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: pricingType === 'fixed' ? '#EEF7F0' : pricingType === 'variable' ? '#EFF8FF' : '#F0FDF4', color: pricingType === 'fixed' ? '#1B5E3B' : pricingType === 'variable' ? '#0077B6' : '#22C55E' }}>
                  {pricingType === 'fixed'    && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>}
                  {pricingType === 'variable' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                  {pricingType === 'free'     && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></svg>}
                </div>
                <span className="font-semibold" style={{ color: '#1A1A1A' }}>
                  {pricingType === 'fixed' ? 'Preço fixo' : pricingType === 'variable' ? 'Variável' : 'Gratuito'}
                </span>
              </div>
              <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
            </button>
          </div>

          {/* Valor + Moeda */}
          {pricingType !== 'free' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>
                  {pricingType === 'fixed' ? 'Valor' : 'Valor a partir de'}
                </label>
                <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border bg-white transition-colors"
                  style={{ borderColor: pricingAmount ? '#1B5E3B' : '#E5E7EB' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={pricingAmount ? '#1B5E3B' : '#9CA3AF'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <input type="number" placeholder="0" min="0" value={pricingAmount}
                    onChange={e => setPricingAmount(e.target.value)}
                    className="flex-1 text-sm font-bold bg-transparent focus:outline-none"
                    style={{ fontFamily: 'Nunito, sans-serif', color: '#1A1A1A' }} />
                </div>
              </div>
              <div style={{ width: 100 }}>
                <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Moeda</label>
                <button type="button" onClick={() => setShowCurrency(true)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border bg-white"
                  style={{ borderColor: '#E5E7EB' }}>
                  <span className="text-sm font-black" style={{ color: '#1A1A1A' }}>{pricingCurrency}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Detalhes do preço */}
          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>
              Detalhes do preço <span className="font-normal text-xs" style={{ color: '#9CA3AF' }}>(opcional)</span>
            </label>
            <input type="text" placeholder="Ex.: por pessoa, por noite..."
              value={pricingDetails} onChange={e => setPricingDetails(e.target.value.slice(0, 120))}
              className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none"
              style={{ borderColor: '#E5E7EB', fontFamily: 'Nunito, sans-serif', color: '#1A1A1A' }} />
          </div>

          {/* ── Disponibilidade ────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Disponibilidade</label>
            <div className="bg-white rounded-2xl border overflow-hidden mb-3" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isAvailable ? '#EEF7F0' : '#F3F4F6' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke={isAvailable ? '#1B5E3B' : '#9CA3AF'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>Disponível agora</p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                      {!isAvailable ? 'Inactivo · não aparece nos resultados' : ''}
                    </p>
                  </div>
                </div>
                {/* Toggle profissional */}
                <button type="button" onClick={() => setIsAvailable(v => !v)}
                  className="relative flex-shrink-0"
                  style={{ width: 52, height: 30, borderRadius: 15, background: isAvailable ? '#1B5E3B' : '#E5E7EB', transition: 'background 0.25s ease', boxShadow: isAvailable ? 'inset 0 1px 3px rgba(0,0,0,0.15)' : 'inset 0 1px 3px rgba(0,0,0,0.08)' }}>
                  <span className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: isAvailable ? 'linear-gradient(180deg,rgba(255,255,255,0.12) 0%,transparent 100%)' : 'none', borderRadius: 15 }} />
                  <span className="absolute" style={{ top: 3, width: 24, height: 24, borderRadius: '50%', background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.20),0 1px 2px rgba(0,0,0,0.12)', transform: isAvailable ? 'translateX(25px)' : 'translateX(3px)', transition: 'transform 0.22s cubic-bezier(0.34,1.2,0.64,1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isAvailable
                      ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1B5E3B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    }
                  </span>
                </button>
              </div>
            </div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Antecedência mínima</label>
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F3F4F6' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Dias antes da data do serviço</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button type="button" onClick={() => setAdvanceBooking(v => String(Math.max(0, parseInt(v, 10) - 1)))}
                    className="w-8 h-8 rounded-xl border flex items-center justify-center font-black text-base leading-none"
                    style={{ borderColor: '#E5E7EB', color: '#1A1A1A', background: 'white' }}>−</button>
                  <span className="text-sm font-black text-center" style={{ color: '#1A1A1A', minWidth: 60 }}>
                    {advanceBooking === '0' ? 'Sem mín.' : `${advanceBooking}d`}
                  </span>
                  <button type="button" onClick={() => setAdvanceBooking(v => String(parseInt(v, 10) + 1))}
                    className="w-8 h-8 rounded-xl border flex items-center justify-center font-black text-base leading-none"
                    style={{ borderColor: '#E5E7EB', color: '#1A1A1A', background: 'white' }}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Características ────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Características incluídas</label>
            <button type="button" onClick={() => setShowFeatures(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border bg-white"
              style={{ borderColor: selectedFeatures.length > 0 ? '#1B5E3B' : '#E5E7EB' }}>
              {selectedFeatures.length === 0 ? (
                <span className="text-sm" style={{ color: '#9CA3AF' }}>Selecione as características...</span>
              ) : (
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {selectedFeatures.slice(0, 3).map(f => (
                    <span key={f} className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: '#EEF7F0', color: '#1B5E3B' }}>{f}</span>
                  ))}
                  {selectedFeatures.length > 3 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: '#EEF7F0', color: '#1B5E3B' }}>+{selectedFeatures.length - 3}</span>
                  )}
                </div>
              )}
              <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
            </button>
          </div>

          {/* ── Requisitos ─────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Requisitos para o cliente</label>
            <button type="button" onClick={() => setShowRequirements(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border bg-white"
              style={{ borderColor: selectedRequirements.length > 0 ? '#7B5EA7' : '#E5E7EB' }}>
              {selectedRequirements.length === 0 ? (
                <span className="text-sm" style={{ color: '#9CA3AF' }}>Selecione os requisitos...</span>
              ) : (
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {selectedRequirements.slice(0, 3).map(r => (
                    <span key={r} className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: '#F3EEFB', color: '#7B5EA7' }}>{r}</span>
                  ))}
                  {selectedRequirements.length > 3 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: '#F3EEFB', color: '#7B5EA7' }}>+{selectedRequirements.length - 3}</span>
                  )}
                </div>
              )}
              <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
            </button>
          </div>

          <motion.button whileTap={{ scale: 0.98 }} onClick={next} disabled={!nome || !telefone}
            className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
            style={{ background: '#1B5E3B' }}>
            Continuar <ArrowRight size={20} />
          </motion.button>
        </div>
      </div>
      </>
    );
  }

  // ── STEP 3 ────────────────────────────────────────────────────────────────
  if (step === 3) return (
    <>
    {upgradeOverlay}
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={3} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">
        <div>
          <p className="text-sm font-black flex items-center gap-2" style={{ color: '#1A1A1A' }}>
            <MapPin size={16} style={{ color: '#1B5E3B' }} /> Localização
          </p>
        </div>
        <LocationPicker initialLat={lat} initialLng={lng} mapHeight={240}
          onValidityChange={setLocationValid}
          onChange={(fields: GeoFields, src: LocationSource) => {
            setLat(fields.lat); setLng(fields.lng); setGeoSource(src); setAccuracy(fields.accuracy);
            setCountry(fields.country || ''); setProvincia(fields.province || ''); setDistrito(fields.district || '');
            setAdministrativePost(fields.administrative_post || ''); setCity(fields.locality || '');
            setAdministrativeArea(fields.administrative_area || ''); setLocality(fields.locality || '');
            setSuburb(fields.suburb || ''); setEndereco(fields.address || '');
            setNearbyReference(fields.nearby_reference !== undefined ? fields.nearby_reference : '');
          }} />
        <motion.button whileTap={{ scale: 0.98 }} onClick={next} disabled={!lat || !locationValid}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
          style={{ background: '#1B5E3B' }}>
          Continuar <ArrowRight size={20} />
        </motion.button>
      </div>
    </div>
    </>
  );

  // ── STEP 4 ────────────────────────────────────────────────────────────────
  if (step === 4) return (
    <>
    {upgradeOverlay}
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={4} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>Adiciona fotos reais para atrair mais visitantes</p>
        <button onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed"
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
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {photos.map((p, i) => (
              <div key={i} className="relative flex-shrink-0 rounded-2xl overflow-hidden" style={{ width: 110, height: 110 }}>
                <img src={p} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1.5 left-1.5 text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: '#1B5E3B' }}>Principal</span>}
                <button onClick={() => { setPhotos(prev => prev.filter((_, j) => j !== i)); setPhotoFiles(prev => prev.filter((_, j) => j !== i)); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 20 && (
              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 rounded-2xl border-2 border-dashed flex items-center justify-center"
                style={{ width: 110, height: 110, borderColor: '#E5E7EB' }}>
                <Camera size={24} className="text-gray-300" />
              </button>
            )}
          </div>
        )}
        <motion.button whileTap={{ scale: 0.98 }} onClick={next}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md"
          style={{ background: '#1B5E3B' }}>
          Continuar <ArrowRight size={20} />
        </motion.button>
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
              { icon: <Sun size={14} />,      text: 'Usa luz natural sempre que possível' },
              { icon: <Maximize2 size={14} />, text: 'Mostra diferentes ângulos do serviço' },
              { icon: <DoorOpen size={14} />,  text: 'Inclui fotos da entrada e do interior' },
              { icon: <EyeOff size={14} />,    text: 'Evita fotos desfocadas ou escuras' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#EEF7F0', color: '#1B5E3B' }}>{icon}</div>
                <p className="text-xs font-semibold leading-tight" style={{ color: '#374151' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );

  // ── STEP 5 — Revisão ──────────────────────────────────────────────────────
  const st = serviceTypes.find(s => s.id === serviceType);
  return (
    <>
    {upgradeOverlay}
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={5} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

        {photos.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ height: 160 }}>
            <img src={photos[0]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
            <div className="absolute bottom-3 left-3">
              <h2 className="text-white font-black text-lg">{nome}</h2>
              <span className="text-white/80 text-xs">{st?.label} • {provincia}</span>
            </div>
          </div>
        )}

        {/* Serviço */}
        {[
          { label: 'Serviço', items: [{ k: 'Tipo', v: `${st?.label}` }, { k: 'Nome', v: nome }, { k: 'Horário', v: horario || '—' }, { k: 'Descrição', v: desc }], editStep: 2 },
          { label: 'Contacto', items: [{ k: 'Telefone', v: telefone }, { k: 'WhatsApp', v: whatsapp || '—' }, { k: 'Email', v: email || '—' }], editStep: 2 },
          { label: 'Localização', items: [
              { k: 'País', v: country || 'Moçambique' }, { k: 'Província', v: provincia }, { k: 'Distrito', v: distrito || '—' },
              { k: 'Cidade/Vila', v: city || '—' },
              ...(administrativeArea ? [{ k: 'Posto Administrativo', v: administrativeArea }] : []),
              ...(locality ? [{ k: 'Localidade', v: locality }] : []),
              ...(suburb ? [{ k: 'Bairro', v: suburb }] : []),
              { k: 'Endereço', v: endereco || '—' },
              ...(nearbyReference ? [{ k: 'Referência', v: nearbyReference }] : []),
            ], editStep: 3 },
        ].map(section => (
          <div key={section.label} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>{section.label}</p>
              <button onClick={() => setStep(section.editStep)} className="text-xs font-bold" style={{ color: '#1B5E3B' }}>Editar</button>
            </div>
            {section.items.map(item => (
              <div key={item.k} className="flex items-start justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#9CA3AF' }}>{item.k}</span>
                <span className="text-xs font-bold text-right ml-4" style={{ color: '#1A1A1A' }}>{item.v}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Preço & Disponibilidade */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>Preço & Disponibilidade</p>
            <button onClick={() => setStep(2)} className="text-xs font-bold" style={{ color: '#1B5E3B' }}>Editar</button>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Tipo de preço</span>
            <span className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: pricingType === 'fixed' ? '#EEF7F0' : pricingType === 'variable' ? '#EFF8FF' : '#F0FDF4', color: pricingType === 'fixed' ? '#1B5E3B' : pricingType === 'variable' ? '#0077B6' : '#16A34A' }}>
              {pricingType === 'fixed' ? 'Preço fixo' : pricingType === 'variable' ? 'Variável' : 'Gratuito'}
            </span>
          </div>
          {pricingType !== 'free' && pricingAmount && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Valor</span>
              <span className="text-sm font-black" style={{ color: '#1A1A1A' }}>{pricingAmount} <span className="text-xs font-bold" style={{ color: '#6B7280' }}>{pricingCurrency}</span></span>
            </div>
          )}
          {pricingDetails && (
            <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
              <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#9CA3AF' }}>Detalhes</span>
              <span className="text-xs font-bold text-right ml-4" style={{ color: '#1A1A1A' }}>{pricingDetails}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Disponível</span>
            <span className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: isAvailable ? '#EEF7F0' : '#F3F4F6', color: isAvailable ? '#1B5E3B' : '#6B7280' }}>
              {isAvailable ? '✓ Activo' : '✗ Inactivo'}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Antecedência mín.</span>
            <span className="text-xs font-bold" style={{ color: '#1A1A1A' }}>{advanceBooking === '0' ? 'Sem mínimo' : `${advanceBooking} dia(s)`}</span>
          </div>
        </div>

        {/* Características & Requisitos */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-black" style={{ color: '#1A1A1A' }}>Características & Requisitos</p>
            <button onClick={() => setStep(2)} className="text-xs font-bold" style={{ color: '#1B5E3B' }}>Editar</button>
          </div>
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Características incluídas</p>
            {selectedFeatures.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedFeatures.map(f => <span key={f} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#EEF7F0', color: '#1B5E3B' }}>{f}</span>)}
              </div>
            ) : <span className="text-xs" style={{ color: '#C7C7CC' }}>Nenhuma selecionada</span>}
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Requisitos para o cliente</p>
            {selectedRequirements.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedRequirements.map(r => <span key={r} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#F3EEFB', color: '#7B5EA7' }}>{r}</span>)}
              </div>
            ) : <span className="text-xs" style={{ color: '#C7C7CC' }}>Nenhum selecionado</span>}
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={isSubmitting}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          style={{ background: '#1B5E3B' }}>
          {isSubmitting ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A sugerir...</>
          ) : (
            <><Check size={20} /> Sugerir serviço</>
          )}
        </motion.button>

        {submitError && (
          <div className="flex flex-col gap-2 px-4 py-3 rounded-2xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div className="flex-1">
                <p className="text-xs font-bold mb-1" style={{ color: '#EF4444' }}>Erro ao enviar serviço</p>
                <pre className="text-xs whitespace-pre-wrap font-mono" style={{ color: '#991B1B' }}>{submitError}</pre>
              </div>
            </div>
            <button onClick={() => setSubmitError(null)} className="text-xs font-bold self-end" style={{ color: '#EF4444' }}>Fechar</button>
          </div>
        )}

        <div style={{ background: 'linear-gradient(135deg,#EEF7F0 0%,#F0F9FF 100%)', borderRadius: 20, padding: 16, border: '1px solid rgba(27,94,59,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1B5E3B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(27,94,59,0.25)' }}>
              <Check size={18} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#1B5E3B', marginBottom: 4 }}>Quase lá!</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#4B7A5E', lineHeight: 1.6 }}>
                A tua sugestão de serviço será analisada pela equipa <strong style={{ color: '#1B5E3B' }}>Txopela Tour</strong> antes de ser publicada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
