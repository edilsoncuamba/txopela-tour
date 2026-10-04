import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Camera, Image as ImageIcon,
  Loader2, Check, X, ChevronDown, MapPin,
  AlertCircle, GripVertical, Star, Navigation, Target,
} from 'lucide-react';
import { postsApi, localsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { uploadAndCache, cacheImages } from '@/utils/imageCache';
import { useScrollTop } from '@/hooks/useScrollTop';

// ── AddPost ──────────────────────────────────────────────────────────────────
// POST /api/posts/   Content-Type: multipart/form-data
// Campos: title*, content*, category, province, location(JSON), tags(JSON), images(File[] max:10)
// Tipos aceites (OpenAPI): JPEG, PNG, WEBP, GIF — máx 10MB cada
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMAGES    = 10;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

interface AddPostProps {
  /**
   * Chamado quando o post é criado com sucesso.
   * @param postId  ID real devolvido pelo backend (para zoom no mapa)
   * @param hasLocation  true se o post tem latitude/longitude válidas
   */
  onSuccess: (postId?: string, hasLocation?: boolean) => void;
  onBack: () => void;
}

interface ImageItem {
  id: string;          // UUID local para key / drag
  preview: string;     // data-URL para pré-visualização
  file: File;          // ficheiro real para envio
}

const provincias = [
  'Niassa', 'Cabo Delgado', 'Nampula', 'Zambézia', 'Tete',
  'Manica', 'Sofala', 'Inhambane', 'Gaza', 'Maputo Província', 'Cidade de Maputo',
];

const POST_CATEGORIES = [
  { id: 'discovery', label: 'Descoberta',        color: '#2BB5C8' },
  { id: 'review',    label: 'Avaliação',          color: '#F4821F' },
  { id: 'tip',       label: 'Dica',               color: '#1B5E3B' },
  { id: 'story',     label: 'História',           color: '#7B5EA7' },
  { id: 'other',     label: 'Outro',              color: '#6B7280' },
];

// ── LocationMapPicker — selecciona localização via mapa Leaflet ───────────────
// Reverse geocoding usa EXCLUSIVAMENTE /api/locals/reverse-geocode/ (backend próprio)
// Sem Nominatim externo, sem Google Maps, sem APIs externas.

interface LocationMapPickerProps {
  lat: string;
  lng: string;
  address: string;
  onChangeCoords: (lat: string, lng: string) => void;
  onChangeAddress: (address: string) => void;
}

function LocationMapPicker({ lat, lng, address, onChangeCoords, onChangeAddress }: LocationMapPickerProps) {
  const [expanded,      setExpanded]      = useState(false);
  const [mapReady,      setMapReady]      = useState(false);
  const [geocoding,     setGeocoding]     = useState(false);
  const [gpsLoading,    setGpsLoading]    = useState(false);
  const [geocodeError,  setGeocodeError]  = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef   = useRef<any>(null);
  const markerRef       = useRef<any>(null);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasCoords = lat !== '' && lng !== '';

  // ── Reverse geocoding via backend /api/locals/reverse-geocode/ ──────────
  const reverseGeocode = useCallback(async (newLat: number, newLng: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setGeocoding(true);
    setGeocodeError('');

    debounceRef.current = setTimeout(async () => {
      try {
        // GET /api/locals/reverse-geocode/?latitude=&longitude=
        const res = await localsApi.reverseGeocode(newLat, newLng);
        if (res.data) {
          // ReverseGeocodeData: { formatted_address, country, province, city }
          // GeocodeResponse: { address, province, district, locality }
          const d = res.data;
          const formatted =
            d.formatted_address
            ?? d.address
            ?? d.displayName
            ?? `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`;
          onChangeAddress(formatted);
        }
      } catch {
        setGeocodeError('Não foi possível obter o endereço.');
      } finally {
        setGeocoding(false);
      }
    }, 600);
  }, [onChangeAddress]);

  // ── Mover marcador no mapa ────────────────────────────────────────────────
  const moveMarker = useCallback((newLat: number, newLng: number) => {
    if (!leafletMapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    } else {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:26px;height:34px;position:relative;">
          <div style="width:26px;height:26px;background:#7B5EA7;border:2.5px solid white;
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
          <div style="width:7px;height:7px;background:white;border-radius:50%;
            position:absolute;top:9px;left:9px;transform:rotate(45deg);"></div>
        </div>`,
        iconSize: [26, 34],
        iconAnchor: [13, 34],
      });
      markerRef.current = L.marker([newLat, newLng], { icon, draggable: true }).addTo(leafletMapRef.current);
      markerRef.current.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        onChangeCoords(pos.lat.toFixed(6), pos.lng.toFixed(6));
        reverseGeocode(pos.lat, pos.lng);
      });
    }
    leafletMapRef.current.setView([newLat, newLng], Math.max(leafletMapRef.current.getZoom(), 14), { animate: true });
  }, [onChangeCoords, reverseGeocode]);

  // ── Inicializar mapa quando o painel expandir ─────────────────────────────
  useEffect(() => {
    if (!expanded) return;
    if (leafletMapRef.current || !mapContainerRef.current) return;

    const initLat = lat !== '' ? parseFloat(lat) : -18.0;
    const initLng = lng !== '' ? parseFloat(lng) : 35.0;
    const initZoom = lat !== '' ? 14 : 6;

    const loadAndInit = async () => {
      // CSS Leaflet
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }
      // JS Leaflet
      if (!(window as any).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = () => res(); s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const L = (window as any).L;
      if (!mapContainerRef.current) return;
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLng],
        zoom: initZoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('click', (e: any) => {
        const { lat: cLat, lng: cLng } = e.latlng;
        onChangeCoords(cLat.toFixed(6), cLng.toFixed(6));
        moveMarker(cLat, cLng);
        reverseGeocode(cLat, cLng);
      });

      leafletMapRef.current = map;
      setTimeout(() => map.invalidateSize(false), 150);
      setMapReady(true);

      // Posicionar marcador se já havia coords
      if (lat !== '' && lng !== '') {
        moveMarker(parseFloat(lat), parseFloat(lng));
      }
    };

    loadAndInit().catch(console.error);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
        setMapReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // ── GPS ───────────────────────────────────────────────────────────────────
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: gLat, longitude: gLng } = pos.coords;
        setGpsLoading(false);
        onChangeCoords(gLat.toFixed(6), gLng.toFixed(6));
        moveMarker(gLat, gLng);
        reverseGeocode(gLat, gLng);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, [moveMarker, reverseGeocode, onChangeCoords]);

  // ── Limpar localização ────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    onChangeCoords('', '');
    onChangeAddress('');
    if (markerRef.current && leafletMapRef.current) {
      leafletMapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }, [onChangeCoords, onChangeAddress]);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Cabeçalho do bloco */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2">
          <MapPin size={16} style={{ color: '#7B5EA7' }} />
          <span className="text-xs font-black" style={{ color: '#6B7280' }}>
            LOCALIZAÇÃO{' '}
            <span style={{ color: '#9CA3AF' }}>(opcional)</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasCoords && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#F3EEFB', color: '#7B5EA7' }}>
              ✓ Definida
            </span>
          )}
          <ChevronDown
            size={15}
            className="text-gray-400"
            style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Botões GPS + limpar */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGPS}
                  disabled={gpsLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-black border-2 disabled:opacity-50"
                  style={{ borderColor: '#1B5E3B', color: '#1B5E3B', background: '#EEF7F0' }}
                >
                  {gpsLoading
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><Navigation size={14} /> Usar GPS</>}
                </button>
                {hasCoords && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-2.5 rounded-xl border-2 text-xs font-black"
                    style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Mapa */}
              <div
                className="relative rounded-xl overflow-hidden border-2"
                style={{ height: 200, borderColor: 'rgba(123,94,167,0.2)' }}
              >
                <div ref={mapContainerRef} className="absolute inset-0" />
                {!mapReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 border-3 border-[#7B5EA7]/30 border-t-[#7B5EA7] rounded-full animate-spin" />
                      <span className="text-[10px] text-gray-400 font-bold">A carregar mapa...</span>
                    </div>
                  </div>
                )}
                {mapReady && !hasCoords && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap pointer-events-none">
                    Toca no mapa para marcar a localização
                  </div>
                )}
                {/* Indicador de geocoding */}
                {geocoding && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 rounded-full px-3 py-1 flex items-center gap-1.5 shadow">
                    <Loader2 size={11} className="animate-spin" style={{ color: '#7B5EA7' }} />
                    <span className="text-[10px] font-bold" style={{ color: '#7B5EA7' }}>A obter endereço...</span>
                  </div>
                )}
              </div>

              {/* Endereço obtido do backend */}
              {(address || geocodeError) && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                  style={{ background: geocodeError ? '#FEF2F2' : '#F3EEFB' }}>
                  <Target size={13} style={{ color: geocodeError ? '#EF4444' : '#7B5EA7', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs font-semibold" style={{ color: geocodeError ? '#EF4444' : '#7B5EA7' }}>
                    {geocodeError || address}
                  </p>
                </div>
              )}

              {/* Coordenadas (informativo) */}
              {hasCoords && (
                <p className="text-[10px] text-center" style={{ color: '#C7C7CC' }}>
                  {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

// ── Grelha de imagens com reordenação ─────────────────────────────────────────
function ImageGrid({
  images,
  onRemove,
  onMoveToFront,
  onAdd,
}: {
  images: ImageItem[];
  onRemove: (id: string) => void;
  onMoveToFront: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((img, i) => (
        <motion.div
          key={img.id}
          layout
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.18 }}
          className="relative rounded-xl overflow-hidden flex-shrink-0"
          style={{ width: 90, height: 90 }}
        >
          <img src={img.preview} alt="" className="w-full h-full object-cover" />

          {/* Overlay gradiente */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />

          {/* Indicador "Principal" */}
          {i === 0 && (
            <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{ background: '#1B5E3B' }}>
              <Star size={8} className="text-white" fill="white" />
              <span className="text-[8px] font-black text-white leading-none">Principal</span>
            </div>
          )}

          {/* Botão remover */}
          <button
            onClick={() => onRemove(img.id)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <X size={10} className="text-white" />
          </button>

          {/* Botão "tornar principal" (só para não-principal) */}
          {i !== 0 && (
            <button
              onClick={() => onMoveToFront(img.id)}
              title="Tornar principal"
              className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              <GripVertical size={8} className="text-white" />
              <span className="text-[8px] text-white/90 leading-none">Principal</span>
            </button>
          )}
        </motion.div>
      ))}

      {/* Botão adicionar (quando já há imagens e ainda há espaço) */}
      {images.length < MAX_IMAGES && (
        <button
          onClick={onAdd}
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-colors hover:border-green-400"
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
export default function AddPost({ onSuccess, onBack }: AddPostProps) {
  useScrollTop();
  const { user } = useAuth();

  // Campos do formulário
  const [title,     setTitle]     = useState('');
  const [content,   setContent]   = useState('');
  const [category,  setCategory]  = useState('');
  const [province,  setProvince]  = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [address,   setAddress]   = useState('');
  const [lat,       setLat]       = useState('');
  const [lng,       setLng]       = useState('');

  // Imagens
  const [images,   setImages]   = useState<ImageItem[]>([]);
  const [imgErrors, setImgErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // UI
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [createdPostId,  setCreatedPostId]  = useState<string | undefined>(undefined);
  const [createdHasLoc,  setCreatedHasLoc]  = useState(false);
  const [error,          setError]          = useState('');
  const [showCatPicker,  setShowCatPicker]  = useState(false);
  const [showProvPicker, setShowProvPicker] = useState(false);

  const selectedCategory = POST_CATEGORIES.find(c => c.id === category);
  const selectedProvince = provincias.find(p => p === province);

  // ── Validação e selecção de imagens ──────────────────────────────────────
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const errors: string[] = [];
    const valid: ImageItem[] = [];

    const remaining = MAX_IMAGES - images.length;
    const candidates = files.slice(0, remaining); // apenas os ficheiros que cabem nas slots disponíveis

    candidates.forEach(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" — tipo não suportado (use JPEG, PNG, WEBP ou GIF).`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`"${file.name}" — tamanho excede 10 MB.`);
        return;
      }
      if (valid.length + images.length >= MAX_IMAGES) {
        errors.push(`Limite de ${MAX_IMAGES} imagens atingido — "${file.name}" ignorado.`);
        return;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { id, preview: reader.result as string, file }]);
      };
      reader.readAsDataURL(file);
      valid.push({ id, preview: '', file }); // placeholder para contagem
    });

    if (errors.length > 0) setImgErrors(errors);
    if (fileRef.current) fileRef.current.value = '';
  }, [images]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const moveToFront = useCallback((id: string) => {
    setImages(prev => {
      const idx = prev.findIndex(img => img.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }, []);

  // ── Submissão ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    setImgErrors([]);

    if (!title.trim())   return setError('O título é obrigatório.');
    if (!content.trim()) return setError('O conteúdo é obrigatório.');
    if (!category)       return setError('Seleciona a categoria.');
    if (!province)       return setError('Seleciona a província.');

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',    title.trim());
      fd.append('content',  content.trim());
      fd.append('category', category);
      fd.append('province', province);

      // location como JSON string
      const location = {
        latitude:  lat  ? parseFloat(lat)  : null,
        longitude: lng  ? parseFloat(lng)  : null,
        address:   address.trim() || null,
      };
      fd.append('location', JSON.stringify(location));

      // tags como JSON array
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      fd.append('tags', JSON.stringify(tags));

      // images — campo "images", máximo 10, primeiro = capa
      images.forEach(img => fd.append('images', img.file));

      const { data, error: apiError } = await postsApi.create(fd);

      if (apiError) {
        setError(typeof apiError === 'string' ? apiError : 'Erro ao publicar. Tenta novamente.');
        return;
      }

      const postId = data?.post?.id ?? data?.id;

      if (data?.success || data?.post || data?.id) {
        // ── Garantir que as URLs reais das imagens ficam no cache ────────────
        // O POST multipart já entrega as imagens ao backend.
        // Fazemos GET /api/posts/{id}/ para obter as URLs finais devolvidas
        // pelo backend e guardá-las no cache local — assim o frontend
        // apresenta as imagens imediatamente sem depender da listagem.
        if (postId && images.length > 0) {
          try {
            const { data: postData } = await postsApi.get(postId);
            // Extrair URLs do envelope: data.data.images[] ou data.images[]
            const payload = postData?.data ?? postData;
            const apiImages: string[] = [];
            const rawImages = payload?.images ?? [];
            rawImages.forEach((img: any) => {
              if (typeof img === 'string' && img.trim()) apiImages.push(img.trim());
              else if (img && typeof img === 'object') {
                const url = img.url ?? img.image ?? img.src ?? img.thumbnail;
                if (typeof url === 'string' && url.trim()) apiImages.push(url.trim());
              }
            });
            if (apiImages.length > 0) {
              // URLs reais do backend — fonte de verdade
              cacheImages(postId, apiImages);
            } else {
              // Backend ainda não devolveu URLs (processamento assíncrono) —
              // usar uploadAndCache como fallback para não ficar sem imagens
              await uploadAndCache(images.map(i => i.file), postId, 'post');
            }
          } catch {
            // Em caso de falha no GET, manter o cache de upload como fallback
            await uploadAndCache(images.map(i => i.file), postId, 'post');
          }
        }

        // Determinar se o post tem localização válida (para zoom no mapa)
        const hasLoc = lat !== '' && lng !== '' &&
          !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
        setCreatedPostId(postId);
        setCreatedHasLoc(hasLoc);
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
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 pb-24"
        style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col items-center text-center"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #1B5E3B, #2BB5C8)' }}
          >
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
            onClick={() => onSuccess(createdPostId, createdHasLoc)}
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
            <button
              onClick={onBack}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
            >
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

        {/* Título */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            TÍTULO <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 300))}
            placeholder="Dá um título à tua publicação..."
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
            placeholder="Partilha a tua experiência, dicas ou descobertas..."
            rows={5}
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
              <span style={{ color: '#9CA3AF' }}>
                ({images.length}/{MAX_IMAGES})
              </span>
            </label>
            {images.length > 0 && (
              <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
                A primeira imagem é a capa
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {images.length === 0 ? (
              /* Estado vazio — área de drop grande */
              <motion.button
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
              /* Grelha de pré-visualização */
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ImageGrid
                  images={images}
                  onRemove={removeImage}
                  onMoveToFront={moveToFront}
                  onAdd={() => fileRef.current?.click()}
                />
                {images.length < MAX_IMAGES && (
                  <p className="text-[10px] mt-2" style={{ color: '#9CA3AF' }}>
                    Podes adicionar mais {MAX_IMAGES - images.length} foto{MAX_IMAGES - images.length !== 1 ? 's' : ''}.
                    Toca numa imagem para definir como capa.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Erros de validação de imagens */}
          <AnimatePresence>
            {imgErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 space-y-1"
              >
                {imgErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-1.5 px-3 py-2 rounded-xl"
                    style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                    <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: '#92400E' }}>{err}</p>
                  </div>
                ))}
                <button
                  onClick={() => setImgErrors([])}
                  className="text-[10px] font-bold"
                  style={{ color: '#9CA3AF' }}
                >
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
          <label className="block text-xs font-black mb-2" style={{ color: '#6B7280' }}>
            CATEGORIA <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <button
            onClick={() => setShowCatPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm"
            style={{
              borderColor: selectedCategory ? selectedCategory.color : '#E5E7EB',
              color: selectedCategory ? '#1A1A1A' : '#9CA3AF',
            }}
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

        {/* Província */}
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

        {/* Localização opcional — picker de mapa */}
        <LocationMapPicker
          lat={lat}
          lng={lng}
          address={address}
          onChangeCoords={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
          onChangeAddress={setAddress}
        />

        {/* Tags */}
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
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: '#EEF7F0', color: '#1B5E3B' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Erro geral */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-4 py-3 rounded-2xl flex items-center gap-2"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <AlertCircle size={14} style={{ color: '#EF4444' }} />
              <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão publicar (mobile) */}
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
            options={POST_CATEGORIES}
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
