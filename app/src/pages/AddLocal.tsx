import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconChevronLeft, IconChevronDown, IconArrowRight, IconCheck, IconClose,
  IconMapPin, IconCamera, IconImage, IconTrash, IconStar,
  IconMountain, IconUsers, IconEye, IconAccessible, IconTheater,
  IconHeart, IconFlag, IconNavigation,
  CategoryIcon, STROKE,
} from '@/components/icons';
import { Zap, UtensilsCrossed, Mountain, Users, Eye, Accessibility, Camera as CameraIcon, Heart, Theater, MoreHorizontal, X, Check, ChevronLeft, ChevronDown, ArrowRight, MapPin, Camera, Trash2, Image as ImageIcon, Star, Loader2, Search, Globe, PartyPopper, HeartHandshake, AlertCircle, Sun, Maximize2, DoorOpen, EyeOff } from 'lucide-react';
import { localsApi } from '@/services/api';
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

const tipoOptions = ['Praia', 'Monumento', 'Parque Natural', 'Restaurante', 'Hotel', 'Museu', 'Mercado', 'Trilha', 'Ilha', 'Outro'];
const epocaOptions = [
  'Época seca — Maio a Outubro (safáris e praias)',
  'Época quente e húmida — Novembro a Abril',
  'Verão austral — Dezembro a Fevereiro (praias e mergulho)',
  'Inverno austral — Junho a Agosto (fauna e flora)',
  'Setembro a Novembro (baleias e mantas em Inhambane)',
  'Todo o ano',
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

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between px-1 mt-4">
      {steps.map((s, i) => {
        const active = s.n === current;
        const done   = s.n < current;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2"
                style={{ background: done ? '#1B5E3B' : active ? '#1B5E3B' : 'white', borderColor: done || active ? '#1B5E3B' : '#E5E7EB', color: done || active ? 'white' : '#9CA3AF' }}>
                {done ? <Check size={12} /> : s.n}
              </div>
              <span className="text-[10px] font-bold mt-1 text-center"
                style={{ color: active ? '#1B5E3B' : done ? '#1B5E3B' : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-1 mb-4"
                style={{ background: done ? '#1B5E3B' : '#E5E7EB' }} />
            )}
          </div>
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
          <button onClick={onBack} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ChevronLeft size={20} style={{ color: '#1A1A1A' }} />
          </button>
          <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>Sugerir local</h1>
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

// ── CategoryPickerSheet — grid layout with icons ──────────────────────────────
function CategoryPickerSheet({ value, onSelect, onClose }: {
  value: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  const cats = ['Praias', 'Cultura & História', 'Natureza', 'Aventura', 'Gastronomia', 'Mergulho', 'Ecoturismo', 'Outro'];
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div className="relative bg-white rounded-t-3xl pb-8"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>Categoria</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-4 pt-2 pb-4 max-h-[60vh] overflow-y-auto">
          {cats.map(cat => {
            const active = value === cat;
            const color = CATEGORY_COLORS[cat];
            return (
              <button key={cat} onClick={() => { onSelect(cat); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 transition-all"
                style={{ background: active ? color + '15' : 'transparent' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: active ? color : color + '20', color: active ? 'white' : color }}>
                  {CATEGORY_ICONS[cat]}
                </div>
                <span className="text-sm font-bold text-left flex-1"
                  style={{ color: active ? color : '#1A1A1A' }}>
                  {cat}
                </span>
                {active && <Check size={16} style={{ color }} />}
              </button>
            );
          })}
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
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div className="relative bg-white rounded-t-3xl pb-8 flex flex-col" style={{ maxHeight: '75vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-4 pt-2 max-h-[60vh] overflow-y-auto pb-4">
          {options.map(opt => (
            <button key={opt} onClick={() => { onSelect(opt); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-1 transition-all"
              style={{ background: value === opt ? '#EEF7F0' : 'transparent' }}>
              <span className="text-sm font-bold text-left" style={{ color: value === opt ? '#1B5E3B' : '#1A1A1A' }}>{opt}</span>
              {value === opt && <Check size={16} style={{ color: '#1B5E3B' }} />}
            </button>
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
      if (tipo.trim())               payload.subcategory          = tipo.trim();
      if (epoca.trim())              payload.best_season          = epoca.trim();
      if (provincia.trim())          payload.province             = provincia.trim();
      // district é o nível administrativo Distrito — enviado também como municipality para compatibilidade
      if (district.trim()) {
        payload.district             = district.trim();
        payload.municipality         = district.trim(); // compatibilidade backend
      }
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

      console.log('[AddLocal] ✅ Local criado (id:', data?.id, ')');

      // Passo 2: Se há imagens, actualizar via PUT multipart com todos os campos + images
      // O PUT multipart funciona porque reenvia TODOS os campos obrigatórios
      if (photoFiles.length > 0 && data?.id) {
        console.log('[AddLocal] Passo 2 — PUT multipart com imagens...');
        const fd = new FormData();
        // Campos administrativos completos
        fd.append('name',        name.trim());
        fd.append('description', desc.trim());
        fd.append('category',    backendCategory);
        if (tipo.trim())               fd.append('subcategory',         tipo.trim());
        if (epoca.trim())              fd.append('best_season',         epoca.trim());
        if (provincia.trim())          fd.append('province',            provincia.trim());
        if (district.trim()) {
          fd.append('district',            district.trim());
          fd.append('municipality',        district.trim()); // compatibilidade
        }
        if (administrativePost.trim()) fd.append('administrative_post', administrativePost.trim());
        if (cidade.trim())             fd.append('locality',            cidade.trim());
        if (nearbyReference.trim())    fd.append('nearby_reference',    nearbyReference.trim());
        const fullAddressMulti = buildFullAddress({ locality: cidade, administrativePost, district, province: provincia });
        if (fullAddressMulti)          fd.append('address',             fullAddressMulti);
        if (lat.trim())                fd.append('latitude',            lat.trim());
        if (lng.trim())                fd.append('longitude',           lng.trim());
        if (destaques.length)          fd.append('highlights',          JSON.stringify(destaques));
        photoFiles.slice(0, 10).forEach(f => fd.append('images', f));

        const { error: putErr } = await localsApi.update(data.id, fd);
        if (putErr) {
          console.warn('[AddLocal] ⚠️ Imagens não associadas:', extractErrorMsg(putErr));
        } else {
          console.log('[AddLocal] ✅ Imagens associadas via PUT');
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
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Nome do lugar <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" placeholder="Ex.: Praia do Tofo, Fortaleza de São Sebastião..." value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none"
            style={{ borderColor: '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }} />
        </div>

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Categoria <span style={{ color: '#EF4444' }}>*</span></label>
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
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Tipo de lugar <span style={{ color: '#EF4444' }}>*</span></label>
          <button onClick={() => setShowTipo(true)} className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border bg-white text-sm"
            style={{ borderColor: '#E5E7EB', color: tipo ? '#1A1A1A' : '#9CA3AF' }}>
            <span className="truncate">{tipo || 'Selecione...'}</span>
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Melhor época para visitar <span style={{ color: '#EF4444' }}>*</span></label>
          <button onClick={() => setShowEpoca(true)} className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border bg-white text-sm"
            style={{ borderColor: '#E5E7EB', color: epoca ? '#1A1A1A' : '#9CA3AF' }}>
            <span className="truncate text-left flex-1">{epoca || 'Selecione a melhor época...'}</span>
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Destaques <span style={{ color: '#EF4444' }}>*</span></label>
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
          <label className="block text-sm font-black mb-1.5 text-left" style={{ color: '#1A1A1A' }}>Descrição <span style={{ color: '#EF4444' }}>*</span></label>
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
        {showTipo && <PickerSheet title="Tipo de lugar" options={tipoOptions} value={tipo} onSelect={setTipo} onClose={() => setShowTipo(false)} />}
        {showEpoca && <PickerSheet title="Melhor época para visitar" options={epocaOptions} value={epoca} onSelect={setEpoca} onClose={() => setShowEpoca(false)} />}
        {showDest && (
          <motion.div className="fixed inset-0 z-50 flex flex-col justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDest(false)} />
            <motion.div className="relative bg-white rounded-t-3xl pb-8" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>Destaques</h3>
                <button onClick={() => setShowDest(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16} className="text-gray-500" /></button>
              </div>
              <div className="px-4 pt-2 max-h-72 overflow-y-auto">
                {destaquesOptions.map(opt => {
                  const active = destaques.includes(opt.id);
                  return (
                    <button key={opt.id} onClick={() => toggleDest(opt.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-1 transition-all"
                      style={{ background: active ? '#EEF7F0' : 'transparent' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{opt.icon}</span>
                        <span className="text-sm font-bold" style={{ color: active ? '#1B5E3B' : '#1A1A1A' }}>{opt.label}</span>
                      </div>
                      <div className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all"
                        style={{ background: active ? '#1B5E3B' : 'white', borderColor: active ? '#1B5E3B' : '#D1D5DB' }}>
                        {active && <Check size={12} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 pt-3">
                <button onClick={() => setShowDest(false)} className="w-full py-3.5 rounded-2xl text-white font-black text-sm" style={{ background: '#1B5E3B' }}>
                  Confirmar ({destaques.length} selecionados)
                </button>
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
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Usa o GPS, clica no mapa ou pesquisa para definir a localização do lugar.
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

  const catLabel = category || '—';  const tipoLabel = tipo || '—';
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
            { k: 'Melhor época', v: epoca || '—' },
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






