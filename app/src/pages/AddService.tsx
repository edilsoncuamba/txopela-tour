import { useState, useRef } from 'react';
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
import SubmissionSuccessScreen from '@/components/shared/SubmissionSuccessScreen';
import { useScrollTop } from '@/hooks/useScrollTop';
import LocationPicker, { type GeoFields, type LocationSource } from '@/components/LocationPicker';
import { buildFullAddress } from '@/utils/normalizeLocation';

interface AddServiceProps {
  onSuccess: () => void;
  onBack: () => void;
}

// Service type icon component
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
  // Valores mapeados para ServiceWriteCategoryEnum do backend:
  // transport | guide | accommodation | experience | equipment
  { id: 'accommodation', label: 'Hospedagem',      desc: 'Hotel, pousada, casa de hóspedes',    color: '#2BB5C8', bg: '#EBF8FB' },
  { id: 'guide',         label: 'Guia Turístico',   desc: 'Tours, excursões, guias locais',      color: '#1B5E3B', bg: '#EEF7F0' },
  { id: 'experience',    label: 'Experiência',      desc: 'Restaurante, café, bar, actividades', color: '#E05A3A', bg: '#FEF0EB' },
  { id: 'transport',     label: 'Transporte',       desc: 'Transfer, aluguer, táxi turístico',   color: '#7B5EA7', bg: '#F3EEFB' },
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

const steps = [
  { n: 1, label: 'Tipo' },
  { n: 2, label: 'Dados' },
  { n: 3, label: 'Localização' },
  { n: 4, label: 'Fotos' },
  { n: 5, label: 'Revisão' },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between px-1 mt-4">
      {steps.map((s, i) => {
        const active = s.n === current;
        const done = s.n < current;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2"
                style={{ background: done || active ? '#1B5E3B' : 'white', borderColor: done || active ? '#1B5E3B' : '#E5E7EB', color: done || active ? 'white' : '#9CA3AF' }}>
                {done ? <Check size={12} /> : s.n}
              </div>
              <span className="text-[9px] font-bold mt-1 text-center"
                style={{ color: active ? '#1B5E3B' : done ? '#1B5E3B' : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-1 mb-4" style={{ background: done ? '#1B5E3B' : '#E5E7EB' }} />
            )}
          </div>
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
          <button onClick={onBack} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ChevronLeft size={20} style={{ color: '#1A1A1A' }} />
          </button>
          <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>Cadastrar serviço</h1>
        </div>
        <StepBar current={step} />
      </div>
    </div>
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
      <motion.div className="relative bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '75vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-4 pt-2 pb-6 overflow-y-auto">
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

const previewServices = [
  { id: 'hospedagem',  name: 'Casa da Praia',  type: 'Hospedagem',   rating: 4.8, reviews: 56,  image: '/images/local-5.jpg' },
  { id: 'guia',        name: 'Guias do Tofo',  type: 'Guias locais', rating: 4.9, reviews: 34,  image: '/images/local-6.jpg' },
  { id: 'restaurante', name: 'Sabor da Terra', type: 'Restaurante',  rating: 4.6, reviews: 41,  image: '/images/local-7.jpg' },
];

export default function AddService({
  onSuccess, onBack }: AddServiceProps) {
  useScrollTop();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1
  const [serviceType, setServiceType] = useState('');
  const [outroLabel, setOutroLabel]   = useState(''); // label personalizado quando type === 'outro'
  // Step 2
  const [nome, setNome]       = useState('');
  const [desc, setDesc]       = useState('');
  const [telefone, setTelefone] = useState(() => user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(() => user?.phone || ''); // phone serve de whatsapp por defeito
  const [email, setEmail]     = useState(() => user?.email || '');

  // Horário estruturado
  type HorarioTipo = 'todos' | 'uteis' | 'fds' | 'personalizado';
  const [horarioTipo, setHorarioTipo]   = useState<HorarioTipo>('todos');
  const [horarioAbre, setHorarioAbre]   = useState('08:00');
  const [horarioFecha, setHorarioFecha] = useState('18:00');
  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
  const [diasCustom, setDiasCustom]     = useState<string[]>(['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);

  // Gera a string de horário para o backend
  const buildHorario = (): string => {
    const h = `${horarioAbre.replace(':', 'h')}–${horarioFecha.replace(':', 'h')}`;
    if (horarioTipo === 'todos')        return `Todos os dias • ${h}`;
    if (horarioTipo === 'uteis')        return `Seg–Sex • ${h}`;
    if (horarioTipo === 'fds')          return `Sáb–Dom • ${h}`;
    if (diasCustom.length === 0)        return h;
    return `${diasCustom.join(', ')} • ${h}`;
  };
  const horario = buildHorario();
  // Step 3
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito]   = useState('');
  const [endereco, setEndereco]   = useState('');
  const [lat, setLat]             = useState('');
  const [lng, setLng]             = useState('');
  // Campos geo do LocationPicker
  const [geoSource, setGeoSource] = useState<LocationSource>(null);
  // Validade — true quando LocationPicker tem todos os campos obrigatórios preenchidos
  const [locationValid, setLocationValid] = useState(false);
  
  // Novos campos administrativos do LocationPicker melhorado
  const [country, setCountry]                           = useState('');
  const [city, setCity]                                 = useState('');
  const [administrativePost, setAdministrativePost]     = useState('');
  const [administrativeArea, setAdministrativeArea]     = useState('');
  const [locality, setLocality]                         = useState('');
  const [suburb, setSuburb]                             = useState('');
  const [nearbyReference, setNearbyReference]           = useState('');
  const [accuracy, setAccuracy]                         = useState<number | undefined>(undefined);
  // Step 4
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]); // ⚠️ Guardar ficheiros reais separadamente
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 20 - photos.length; // max 20 imagens para serviços
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

  const next = () => setStep(s => Math.min(s + 1, 5));
  const prev = () => { if (step === 1) onBack(); else setStep(s => s - 1); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!nome.trim())      { setSubmitError('O nome do serviço é obrigatório.'); return; }
    if (!desc.trim())      { setSubmitError('A descrição é obrigatória.'); return; }
    if (!telefone.trim())  { setSubmitError('O telefone é obrigatório.'); return; }
    if (!provincia.trim()) { setSubmitError('Seleciona a província.'); return; }

    setIsSubmitting(true);
    setSubmitError(null);

    // Helper para extrair mensagem de erro legível — SEMPRE devolve string
    const extractErrorMsg = (error: unknown): string => {
      if (!error) return 'Erro desconhecido';
      if (typeof error === 'string') return error;
      const e = error as any;
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
      try { return JSON.stringify(error, null, 2); } catch { return 'Erro ao processar resposta'; }
    };

    try {
      // Passo 1: Criar o serviço via JSON (sem imagens)
      // 'outro' não é um valor válido no backend — mapeia para 'experience' (mais genérico)
      // O label personalizado vai para a descrição via notes se necessário
      const backendCategory = serviceType === 'outro' ? 'experience' : (serviceType || 'experience');
      const payload: Record<string, any> = {
        title:       nome.trim(),
        description: desc.trim(),
        category:    backendCategory,
        phone:       telefone.trim(),
        province:    provincia.trim(),
      };
      if (serviceType === 'outro' && outroLabel.trim()) {
        payload.notes = `Tipo de serviço: ${outroLabel.trim()}`;
      }
      // Todos os campos administrativos com os seus atributos correctos
      if (distrito.trim()) {
        payload.district     = distrito.trim();
        payload.municipality = distrito.trim(); // compatibilidade backend
      }
      if (administrativePost.trim()) payload.administrative_post = administrativePost.trim();
      if (city.trim())               payload.locality            = city.trim();
      if (nearbyReference.trim())    payload.nearby_reference    = nearbyReference.trim();
      // Endereço gerado sem duplicações a partir dos dados reais
      const fullAddress = buildFullAddress({
        locality:           city,
        administrativePost: administrativePost,
        district:           distrito,
        province:           provincia,
      });
      if (fullAddress)               payload.address             = fullAddress;
      if (lat.trim())                payload.latitude            = parseFloat(lat);
      if (lng.trim())                payload.longitude           = parseFloat(lng);
      if (whatsapp.trim())           payload.whatsapp            = whatsapp.trim();
      if (email.trim())              payload.contact_email       = email.trim();
      if (horario.trim())            payload.schedule            = horario.trim();

      console.log('[AddService] Passo 1 — criar com JSON...');
      const { data, error } = await servicesApi.createJson(payload);

      if (error) {
        setSubmitError(extractErrorMsg(error));
        return;
      }

      console.log('[AddService] ✅ Serviço criado (id:', data?.id, ')');

      // Passo 2: Se há imagens, actualizar via PUT multipart com todos os campos + images
      if (photoFiles.length > 0 && data?.id) {
        console.log('[AddService] Passo 2 — PUT multipart com imagens...');
        const fd = new FormData();
        fd.append('title',       nome.trim());
        fd.append('description', desc.trim());
        fd.append('category',    serviceType || 'experience');
        fd.append('phone',       telefone.trim());
        fd.append('province',    provincia.trim());
        if (distrito.trim()) {
          fd.append('district',            distrito.trim());
          fd.append('municipality',        distrito.trim()); // compatibilidade
        }
        if (administrativePost.trim()) fd.append('administrative_post', administrativePost.trim());
        if (city.trim())               fd.append('locality',            city.trim());
        if (nearbyReference.trim())    fd.append('nearby_reference',    nearbyReference.trim());
        const fullAddrMulti = buildFullAddress({ locality: city, administrativePost, district: distrito, province: provincia });
        if (fullAddrMulti)             fd.append('address',             fullAddrMulti);
        if (lat.trim())                fd.append('latitude',            lat.trim());
        if (lng.trim())                fd.append('longitude',           lng.trim());
        if (whatsapp.trim())           fd.append('whatsapp',            whatsapp.trim());
        if (email.trim())              fd.append('contact_email',       email.trim());
        if (horario.trim())            fd.append('schedule',            horario.trim());
        photoFiles.slice(0, 20).forEach(f => fd.append('images', f));

        const { error: putErr } = await servicesApi.update(data.id, fd);
        if (putErr) {
          console.warn('[AddService] ⚠️ Imagens não associadas:', extractErrorMsg(putErr));
        } else {
          console.log('[AddService] ✅ Imagens associadas via PUT');
        }
      }

      setSubmitted(true);

    } catch (err: any) {
      console.error('[AddService] ❌ Exception:', err);
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

  // Sucesso — reutilizando componente compartilhado
  if (submitted) {
    return <SubmissionSuccessScreen entityType="Serviço" onSuccess={onSuccess} />;
  }

  // ── STEP 1 — Tipo de serviço ───────────────────────────────────────────────
  if (step === 1) return (
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
                {/* Ícone colorido */}
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
            const color = '#64748B';
            const bg    = '#F8FAFC';
            return (
              <div>
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => setServiceType('outro')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
                  style={{ borderColor: active ? color : '#E5E7EB', background: active ? bg : 'white' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: active ? color : bg }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke={active ? 'white' : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
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

                {/* Input inline para descrever o tipo quando Outro está seleccionado */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Ex.: Fotografia, Mergulho, Artesanato..."
                        value={outroLabel}
                        onChange={e => setOutroLabel(e.target.value)}
                        maxLength={60}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 bg-white text-sm focus:outline-none"
                        style={{ borderColor: color, fontFamily: 'Nunito, sans-serif' }}
                      />
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
  );

  // ── STEP 2 — Dados do serviço ──────────────────────────────────────────────
  if (step === 2) {
    const st = serviceTypes.find(s => s.id === serviceType);
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
        <PageHeader step={2} onBack={prev} />
        <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

          {/* Tipo selecionado */}
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#EEF7F0' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: st?.color || '#64748B' }}>
              {st ? (
                <ServiceIcon id={st.id} size={20} color="white" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-black" style={{ color: '#1B5E3B' }}>
                {st ? st.label : outroLabel || 'Outro'}
              </p>
              <p className="text-[10px]" style={{ color: '#4B7A5E' }}>Categoria seleccionada</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Nome do serviço <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" placeholder={`Ex.: ${st?.label === 'Hospedagem' ? 'Casa da Praia' : st?.label === 'Restaurante' ? 'Sabor da Terra' : 'Guias do Tofo'}...`}
              value={nome} onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none"
              style={{ borderColor: '#E5E7EB', fontFamily: 'Nunito, sans-serif' }} />
          </div>

          <div>
            <label className="block text-sm font-black mb-1.5" style={{ color: '#1A1A1A' }}>Descrição <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="relative">
              <textarea placeholder="Descreve o teu serviço, o que ofereces, diferenciais..." value={desc}
                onChange={e => setDesc(e.target.value.slice(0, 500))} rows={3}
                className="w-full px-4 py-3.5 rounded-2xl border bg-white text-sm focus:outline-none resize-none"
                style={{ borderColor: '#E5E7EB', fontFamily: 'Nunito, sans-serif' }} />
              <span className="absolute bottom-3 right-3 text-[10px]" style={{ color: '#C7C7CC' }}>{desc.length}/500</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black mb-2" style={{ color: '#1A1A1A' }}>Horário de funcionamento</label>

            {/* Tipo de horário — chips */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {([
                { id: 'todos',        label: 'Todos os dias' },
                { id: 'uteis',        label: 'Dias úteis'    },
                { id: 'fds',          label: 'Fins de semana'},
                { id: 'personalizado',label: 'Personalizado' },
              ] as { id: HorarioTipo; label: string }[]).map(opt => {
                const active = horarioTipo === opt.id;
                return (
                  <button key={opt.id} type="button"
                    onClick={() => setHorarioTipo(opt.id)}
                    className="py-2.5 px-3 rounded-2xl border-2 text-xs font-black transition-all text-center"
                    style={{
                      borderColor: active ? '#0077B6' : '#E5E7EB',
                      background:  active ? '#EFF8FF' : 'white',
                      color:       active ? '#0077B6' : '#6B7280',
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Dias personalizados */}
            {horarioTipo === 'personalizado' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {DIAS.map(dia => {
                  const active = diasCustom.includes(dia);
                  return (
                    <button key={dia} type="button"
                      onClick={() => setDiasCustom(prev =>
                        active ? prev.filter(d => d !== dia) : [...prev, dia]
                      )}
                      className="w-10 h-10 rounded-full border-2 text-xs font-black transition-all"
                      style={{
                        borderColor: active ? '#0077B6' : '#E5E7EB',
                        background:  active ? '#0077B6' : 'white',
                        color:       active ? 'white'   : '#6B7280',
                      }}>
                      {dia}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Horas Abre / Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold mb-1" style={{ color: '#6B7280' }}>Abre</p>
                <input type="time" value={horarioAbre}
                  onChange={e => setHorarioAbre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 bg-white text-sm font-bold focus:outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }} />
              </div>
              <div>
                <p className="text-[11px] font-bold mb-1" style={{ color: '#6B7280' }}>Fecha</p>
                <input type="time" value={horarioFecha}
                  onChange={e => setHorarioFecha(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 bg-white text-sm font-bold focus:outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }} />
              </div>
            </div>

            {/* Preview gerado */}
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

          {/* Telefone */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white transition-colors"
            style={{ borderColor: telefone && telefone === user?.phone ? '#0077B6' : '#E5E7EB' }}>
            <Phone size={18} className="flex-shrink-0" style={{ color: telefone && telefone === user?.phone ? '#0077B6' : '#9CA3AF' }} />
            <input type="tel" placeholder="Telefone *" value={telefone} onChange={e => setTelefone(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none" style={{ fontFamily: 'Nunito, sans-serif' }} />
            {telefone && telefone === user?.phone && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: '#EFF8FF', color: '#0077B6' }}>perfil</span>
            )}
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white transition-colors"
            style={{ borderColor: whatsapp && whatsapp === user?.phone ? '#0077B6' : '#E5E7EB' }}>
            <MessageCircle size={18} className="flex-shrink-0" style={{ color: whatsapp && whatsapp === user?.phone ? '#0077B6' : '#9CA3AF' }} />
            <input type="tel" placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none" style={{ fontFamily: 'Nunito, sans-serif' }} />
            {whatsapp && whatsapp === user?.phone && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: '#EFF8FF', color: '#0077B6' }}>perfil</span>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white transition-colors"
            style={{ borderColor: email && email === user?.email ? '#0077B6' : '#E5E7EB' }}>
            <Mail size={18} className="flex-shrink-0" style={{ color: email && email === user?.email ? '#0077B6' : '#9CA3AF' }} />
            <input type="email" placeholder="Email (opcional)" value={email} onChange={e => setEmail(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none" style={{ fontFamily: 'Nunito, sans-serif' }} />
            {email && email === user?.email && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: '#EFF8FF', color: '#0077B6' }}>perfil</span>
            )}
          </div>

          <motion.button whileTap={{ scale: 0.98 }} onClick={next} disabled={!nome || !telefone}
            className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
            style={{ background: '#1B5E3B' }}>
            Continuar <ArrowRight size={20} />
          </motion.button>
        </div>
      </div>
    );
  }

  // ── STEP 3 — Localização ───────────────────────────────────────────────────
  if (step === 3) return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}>
      <PageHeader step={3} onBack={prev} />
      <div className="px-4 pt-4 space-y-4 text-left max-w-2xl mx-auto">

        {/* Título */}
        <div>
          <p className="text-sm font-black flex items-center gap-2" style={{ color: '#1A1A1A' }}>
            <MapPin size={16} style={{ color: '#1B5E3B' }} />
            Localização
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Usa o GPS, clica no mapa ou pesquisa para definir a localização do serviço.
          </p>
        </div>

        {/* Mapa + GPS + pesquisa */}
        <LocationPicker
          initialLat={lat}
          initialLng={lng}
          mapHeight={240}
          onValidityChange={setLocationValid}
          onChange={(fields: GeoFields, src: LocationSource) => {
            setLat(fields.lat);
            setLng(fields.lng);
            setGeoSource(src);
            setAccuracy(fields.accuracy);
            setCountry(fields.country || '');
            setProvincia(fields.province || '');
            setDistrito(fields.district || '');
            setAdministrativePost(fields.administrative_post || '');
            // locality = Localidade/Vila/Cidade (nível exclusivo)
            setCity(fields.locality || '');
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
          onClick={next}
          disabled={!lat || !locationValid}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
          style={{ background: '#1B5E3B' }}
        >
          Continuar <ArrowRight size={20} />
        </motion.button>
      </div>
    </div>
  );

  // ── STEP 4 — Fotos ─────────────────────────────────────────────────────────
  if (step === 4) return (
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

        {/* Dicas de fotos */}
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
              { icon: <Maximize2 size={14} />,     text: 'Mostra diferentes ângulos do serviço' },
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
      </div>
    </div>
  );

  // ── STEP 5 — Revisão ───────────────────────────────────────────────────────
  const st = serviceTypes.find(s => s.id === serviceType);
  return (
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

        {[
          { label: 'Serviço', items: [{ k: 'Tipo', v: `${st?.label}` }, { k: 'Nome', v: nome }, { k: 'Horário', v: horario || '—' }, { k: 'Descrição', v: desc }], editStep: 2 },
          { label: 'Contacto', items: [{ k: 'Telefone', v: telefone }, { k: 'WhatsApp', v: whatsapp || '—' }, { k: 'Email', v: email || '—' }], editStep: 2 },
          { label: 'Localização', items: [
              { k: 'País', v: country || 'Moçambique' },
              { k: 'Província', v: provincia },
              { k: 'Distrito', v: distrito || '—' },
              { k: 'Cidade/Vila', v: city || '—' },
              ...(administrativeArea ? [{ k: 'Posto Administrativo', v: administrativeArea }] : []),
              ...(locality ? [{ k: 'Localidade', v: locality }] : []),
              ...(suburb ? [{ k: 'Bairro', v: suburb }] : []),
              { k: 'Endereço', v: endereco || '—' },
              ...(nearbyReference ? [{ k: 'Referência / Perto de', v: nearbyReference }] : []),
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

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          style={{ background: '#1B5E3B' }}>
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              A enviar...
            </>
          ) : (
            <><Check size={20} /> Enviar para aprovação</>
          )}
        </motion.button>

        {/* Erro de submissão */}
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
            <button onClick={() => setSubmitError(null)} 
              className="text-xs font-bold self-end" style={{ color: '#EF4444' }}>
              Fechar
            </button>
          </div>
        )}
        <div style={{
          background: 'linear-gradient(135deg, #EEF7F0 0%, #F0F9FF 100%)',
          borderRadius: 20,
          padding: '16px',
          border: '1px solid rgba(27,94,59,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#1B5E3B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 2px 8px rgba(27,94,59,0.25)',
            }}>
              <Check size={18} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#1B5E3B', marginBottom: 4 }}>
                Quase lá!
              </p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#4B7A5E', lineHeight: 1.6 }}>
                O teu serviço será analisado pela equipa <strong style={{ color: '#1B5E3B' }}>Txopela Tour</strong> antes de ser publicado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






