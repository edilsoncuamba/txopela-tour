/**
 * BusinessForm — cadastro de Serviço / Negócio.
 *
 * Etapa 1 — Dados do responsável
 * Etapa 2 — Informações do negócio
 * Etapa 3 — Localização (mapa)
 *
 * NOTA: o estado `catOpen` (popup de categoria) vive no BusinessForm,
 * fora das motion.div filhas — assim não é resetado pela AnimatePresence.
 */

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Store,
  Waves, Landmark, TreePine, Utensils, Hotel,
  Library, ShoppingBasket, Footprints,
  Briefcase, Zap, X, MapPin,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  AuthField,
  AuthSubmitButton,
  AuthErrorMessage,
} from '@/components/shared/AuthFieldWrapper';
import CommonFormFields from './CommonFormFields';
import { validateCommonFields } from './registerValidation';
import { BUSINESS_CATEGORIES } from './types';
import type { CommonFormData, BusinessFormData } from './types';
import LocationPicker, { type GeoFields } from '@/components/LocationPicker';

// ── Ícones inline ─────────────────────────────────────────────────────────────
function IconGlobe({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}
function IconPhone({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}
function IconWhatsApp({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
function IconBriefcase({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
      <rect x="2" y="7" width="20" height="14" rx="2.5" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}

// ── Categorias: ícones e cores ────────────────────────────────────────────────
const CAT_ICONS: Record<string, React.ReactNode> = {
  restaurant: <Utensils  size={20} strokeWidth={1.8} />,
  hotel:      <Hotel     size={20} strokeWidth={1.8} />,
  attraction: <Landmark  size={20} strokeWidth={1.8} />,
  shop:       <ShoppingBasket size={20} strokeWidth={1.8} />,
  service:    <Briefcase size={20} strokeWidth={1.8} />,
  beach:      <Waves     size={20} strokeWidth={1.8} />,
  nature:     <TreePine  size={20} strokeWidth={1.8} />,
  culture:    <Library   size={20} strokeWidth={1.8} />,
  adventure:  <Footprints size={20} strokeWidth={1.8} />,
  nightlife:  <Zap       size={20} strokeWidth={1.8} />,
};
const CAT_COLORS: Record<string, string> = {
  restaurant: '#E05A3A', hotel:     '#F4821F', attraction: '#7B5EA7',
  shop:       '#E67E22', service:   '#0077B6', beach:      '#2BB5C8',
  nature:     '#1B5E3B', culture:   '#9B59B6', adventure:  '#27AE60',
  nightlife:  '#E74C3C',
};

// ── Modal do picker de categorias ─────────────────────────────────────────────
// Recebe `open` e `onClose` do pai — o estado NÃO vive aqui, evitando reset
function CategoryModal({
  open, onClose, value, onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
}) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(10,22,14,0.97)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="font-black text-sm" style={{ color: 'white', letterSpacing: '-0.01em' }}>
            Categoria do negócio
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <X size={13} color="white" />
          </button>
        </div>

        {/* Grelha 3 colunas */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-5">
          {BUSINESS_CATEGORIES.map(cat => {
            const sel   = value === cat.value;
            const color = CAT_COLORS[cat.value] ?? '#6B7280';
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => { onChange(cat.value); onClose(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95"
                style={{
                  background:   sel ? `${color}28` : 'rgba(255,255,255,0.05)',
                  borderColor:  sel ? color         : 'rgba(255,255,255,0.08)',
                  borderWidth:  sel ? 2 : 1,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: sel ? `${color}30` : 'rgba(255,255,255,0.07)',
                    color,
                  }}
                >
                  {CAT_ICONS[cat.value] ?? <Briefcase size={20} strokeWidth={1.8} />}
                </div>
                <span
                  className="text-[10px] font-bold text-center leading-tight"
                  style={{ color: sel ? 'white' : 'rgba(255,255,255,0.65)' }}
                >
                  {/* primeira palavra do label */}
                  {cat.label.split(' ')[0]}
                </span>
                {sel && (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: color }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="2">
                      <polyline points="1 4 3 6 7 2" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

// ── Botão de selecção de categoria ────────────────────────────────────────────
function CategoryTrigger({
  value, onClick,
}: {
  value: string;
  onClick: () => void;
}) {
  const sel = BUSINESS_CATEGORIES.find(c => c.value === value);
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-left" style={{ color: 'rgba(255,255,255,0.85)' }}>
        Categoria do negócio
      </label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
        style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)' }}
      >
        {sel ? (
          <>
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${CAT_COLORS[sel.value]}25`, color: CAT_COLORS[sel.value] }}
            >
              {CAT_ICONS[sel.value]}
            </div>
            <span className="flex-1 text-sm text-left font-semibold" style={{ color: 'white' }}>
              {sel.label}
            </span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="flex-1 text-sm text-left" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Seleccionar categoria…
            </span>
          </>
        )}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" className="flex-shrink-0 pointer-events-none">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}

// ── TextareaField ─────────────────────────────────────────────────────────────
function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-left" style={{ color: 'rgba(255,255,255,0.85)' }}>
        {label}
      </label>
      <div
        className="px-4 py-3 rounded-xl border transition-all focus-within:border-white focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.2)]"
        style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)' }}
      >
        <textarea
          value={value} onChange={e => onChange(e.target.value)}
          rows={rows} placeholder={placeholder}
          className="auth-input w-full text-sm focus:outline-none resize-none placeholder:text-white/40"
          style={{ color: 'white', background: 'transparent', backgroundColor: 'transparent', boxShadow: 'none', caretColor: 'white', colorScheme: 'dark' as any, border: 'none', outline: 'none' }}
        />
      </div>
    </div>
  );
}

// ── Cabeçalho sem subtítulo ───────────────────────────────────────────────────
function BusinessHeader() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(234,88,12,0.25)', border: '1.5px solid rgba(251,146,60,0.4)' }}
      >
        <Store size={18} color="#FB923C" strokeWidth={1.8} />
      </div>
      <h2
        className="font-black"
        style={{ fontSize: '1.2rem', color: 'white', letterSpacing: '-0.025em', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
      >
        Serviço / Negócio
      </h2>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface BusinessFormProps {
  commonData: Partial<CommonFormData>;
  businessData: Partial<BusinessFormData>;
  onChangeCommon:  (field: keyof CommonFormData,  value: string | boolean) => void;
  onChangeBusiness:(field: keyof BusinessFormData, value: string) => void;
  showPassword: boolean;
  showConfirm:  boolean;
  onTogglePassword: () => void;
  onToggleConfirm:  () => void;
  onSubmit: () => void;
  onBack:   () => void;
  isLoading: boolean;
  error?: string;
  businessStep: 1 | 2 | 3;
  onBusinessStepChange: (step: 1 | 2 | 3) => void;
  step1Error?: string;
  onClearStep1Error: () => void;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function BusinessForm({
  commonData, businessData,
  onChangeCommon, onChangeBusiness,
  showPassword, showConfirm,
  onTogglePassword, onToggleConfirm,
  onSubmit, onBack,
  isLoading, error,
  businessStep, onBusinessStepChange,
  step1Error, onClearStep1Error,
}: BusinessFormProps) {
  const anchorRef = useRef<HTMLDivElement>(null);

  // ── Estado do popup de categoria elevado para fora das motion.div ──────────
  // Se ficasse dentro da motion.div, o AnimatePresence mode="wait" resetava-o
  // ao desmontar o child anterior antes de montar o novo.
  const [catOpen, setCatOpen] = useState(false);

  const handleNextStep1 = () => {
    onClearStep1Error();
    const v = validateCommonFields({ ...commonData, termsAccepted: true });
    if (!v.valid) {
      window.dispatchEvent(new CustomEvent('business-step1-error', { detail: v.error }));
      return;
    }
    onBusinessStepChange(2);
  };

  // ── Portal do modal de categoria — renderizado fora de qualquer motion.div ─
  // Fica fora do AnimatePresence para não ser desmontado com as etapas
  const catModal = (
    <CategoryModal
      open={catOpen}
      onClose={() => setCatOpen(false)}
      value={businessData.businessCategory ?? ''}
      onChange={v => { onChangeBusiness('businessCategory', v); setCatOpen(false); }}
    />
  );

  return (
    <>
      {/* Modal de categoria — sempre montado, controlado por `catOpen` */}
      {catModal}

      <AnimatePresence mode="wait">

        {/* ── ETAPA 1: Dados do responsável ────────────────────────────── */}
        {businessStep === 1 && (
          <motion.div key="biz-1"
            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="mb-3">
              <button type="button" onClick={onBack}
                className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                <ChevronLeft size={14} /> Tipo de perfil
              </button>
            </div>

            <BusinessHeader />

            <div ref={anchorRef}>
              <CommonFormFields
                data={commonData} onChange={onChangeCommon}
                showPassword={showPassword} showConfirm={showConfirm}
                onTogglePassword={onTogglePassword} onToggleConfirm={onToggleConfirm}
                datePickerAnchorRef={anchorRef}
                nameLabel="Nome completo do responsável"
                namePlaceholder="Ex: Carlos Machava"
                emailLabel="E-mail"
                emailPlaceholder="exemplo@email.com"
                phoneLabel="Telefone"
                phonePlaceholder="+258 84 000 0000"
                dateLabel="Data de nascimento"
                datePlaceholder="Data de nascimento"
                hideTerms
              />
            </div>

            <AnimatePresence>
              {step1Error && (
                <motion.div key="s1err"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                  <AuthErrorMessage message={step1Error} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4">
              <AuthSubmitButton type="button" onClick={handleNextStep1}>
                <span className="flex items-center justify-center gap-2">
                  Próximo <ChevronRight size={15} />
                </span>
              </AuthSubmitButton>
            </div>
          </motion.div>
        )}

        {/* ── ETAPA 2: Informações do negócio ─────────────────────────── */}
        {businessStep === 2 && (
          <motion.div key="biz-2"
            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="mb-3">
              <button type="button" onClick={() => onBusinessStepChange(1)}
                className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                <ChevronLeft size={14} /> Dados do responsável
              </button>
            </div>

            <BusinessHeader />

            <div className="space-y-3">
              {/* Nome do negócio */}
              <AuthField
                label="Nome do negócio"
                icon={<IconBriefcase />}
                type="text"
                placeholder="Ex: Restaurante Baobab"
                value={businessData.businessName ?? ''}
                onChange={e => onChangeBusiness('businessName', e.target.value)}
              />

              {/* Categoria — botão abre modal controlado pelo pai */}
              <CategoryTrigger
                value={businessData.businessCategory ?? ''}
                onClick={() => setCatOpen(true)}
              />

              {/* Descrição */}
              <TextareaField
                label="Descrição"
                value={businessData.businessDescription ?? ''}
                onChange={v => onChangeBusiness('businessDescription', v)}
                placeholder="Descreve o teu negócio ou serviço…"
                rows={3}
              />

              {/* Contactos em coluna */}
              <AuthField
                label="Website"
                icon={<IconGlobe />}
                type="url"
                placeholder="https://meunegocio.co.mz"
                value={businessData.businessWebsite ?? ''}
                onChange={e => onChangeBusiness('businessWebsite', e.target.value)}
              />
              <AuthField
                label="Telefone"
                icon={<IconPhone />}
                type="tel"
                placeholder="+258 84 000 0000"
                value={businessData.businessPhone ?? ''}
                onChange={e => onChangeBusiness('businessPhone', e.target.value)}
              />
              <AuthField
                label="WhatsApp"
                icon={<IconWhatsApp />}
                type="tel"
                placeholder="+258 84 000 0000"
                value={businessData.businessWhatsapp ?? ''}
                onChange={e => onChangeBusiness('businessWhatsapp', e.target.value)}
              />

              {/* Termos */}
              <div
                className="flex items-start gap-2.5 cursor-pointer select-none pt-1"
                onClick={() => onChangeCommon('termsAccepted', !commonData.termsAccepted)}
                role="checkbox" aria-checked={!!commonData.termsAccepted} tabIndex={0}
                onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChangeCommon('termsAccepted', !commonData.termsAccepted)}
              >
                <div
                  className="w-[17px] h-[17px] rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                  style={{ background: commonData.termsAccepted ? '#1B5E3B' : 'rgba(255,255,255,0.15)', border: `2px solid ${commonData.termsAccepted ? '#1B5E3B' : 'rgba(255,255,255,0.4)'}` }}
                >
                  {commonData.termsAccepted && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="white" strokeWidth="2">
                      <polyline points="1 4.5 3.5 7 8 2" />
                    </svg>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Aceito os{' '}
                  <span className="font-bold" style={{ color: '#7DDCE8' }}>Termos de Uso</span>
                  {' '}e a{' '}
                  <span className="font-bold" style={{ color: '#7DDCE8' }}>Política de Privacidade</span>
                </p>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div key="biz2err"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                  <AuthErrorMessage message={error} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => onBusinessStepChange(3)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-all hover:opacity-80"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.08)' }}
              >
                <MapPin size={15} />
                Adicionar localização no mapa
              </button>
              <AuthSubmitButton
                type="button" onClick={onSubmit}
                loading={isLoading} loadingText="A criar conta…" disabled={isLoading}
              >
                Criar conta
              </AuthSubmitButton>
            </div>
          </motion.div>
        )}

        {/* ── ETAPA 3: Localização ─────────────────────────────────────── */}
        {businessStep === 3 && (
          <motion.div key="biz-3"
            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="mb-3">
              <button type="button" onClick={() => onBusinessStepChange(2)}
                className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                <ChevronLeft size={14} /> Informações do negócio
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(27,94,59,0.25)', border: '1.5px solid rgba(52,211,153,0.4)' }}>
                <MapPin size={16} color="#34D399" strokeWidth={1.8} />
              </div>
              <h2 className="font-black" style={{ fontSize: '1.1rem', color: 'white', letterSpacing: '-0.025em' }}>
                Localização do negócio
              </h2>
            </div>

            <div className="rounded-2xl overflow-hidden mb-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <LocationPicker
                initialLat={businessData.businessLatitude  || ''}
                initialLng={businessData.businessLongitude || ''}
                onChange={(fields: GeoFields) => {
                  onChangeBusiness('businessLatitude',  fields.lat);
                  onChangeBusiness('businessLongitude', fields.lng);
                  if (fields.address) onChangeBusiness('businessAddress', fields.address);
                }}
                mapHeight={240}
              />
            </div>

            {(businessData.businessLatitude || businessData.businessLongitude) && (
              <div className="flex gap-2 mb-4">
                <div className="flex-1 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Latitude</p>
                  <p className="text-xs font-bold" style={{ color: 'white' }}>{businessData.businessLatitude}</p>
                </div>
                <div className="flex-1 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Longitude</p>
                  <p className="text-xs font-bold" style={{ color: 'white' }}>{businessData.businessLongitude}</p>
                </div>
              </div>
            )}

            <AuthSubmitButton type="button" onClick={() => onBusinessStepChange(2)}>
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Confirmar localização
              </span>
            </AuthSubmitButton>
          </motion.div>
        )}

      </AnimatePresence>
    </>
  );
}
