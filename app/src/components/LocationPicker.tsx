/**
 * LocationPicker — componente reutilizável de mapa Leaflet com GPS + reverse geocoding
 * Usado em AddLocal e AddService para selecionar a localização do lugar/serviço.
 *
 * ARQUITECTURA:
 * - Reverse geocoding: GET /api/locals/geocode/?lat=&lon= (OpenAPI: GeocodeResponse)
 *   → devolve province, district, locality, country, address
 *   → se o backend falhar (500/rede), campos ficam vazios e utilizador preenche manualmente
 * - Pesquisa: GET /api/locals/search/?q= (OpenAPI: SearchResponse)
 *   → pesquisa locais já cadastrados na plataforma (não é geocoding geográfico geral)
 *   → se não devolver resultados, utilizador usa o mapa directamente
 * - Todos os campos geo ficam em state local → mostrados em tempo real
 * - useRef para applyPosition/moveMarker → evita closures stale no dragend
 * - Debounce 600ms no geocoding → dispara a cada clique/arraste/GPS
 *
 * BACKEND NECESSÁRIO (OpenAPI):
 *   GET /api/locals/geocode/?lat=&lon=  → GeocodeResponse { province, district, locality, country, address }
 *   GET /api/locals/search/?q=          → SearchResponse { data: { results: [...] } }
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { buildFullAddress } from '@/utils/normalizeLocation';
import { localsApi } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Search, X, AlertCircle,
  CheckCircle2, Loader2, Map, Target, Globe,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface GeoFields {
  lat: string;
  lng: string;
  accuracy?: number;
  country?: string;
  province?: string;
  district?: string;
  administrative_post?: string;
  city?: string;
  administrative_area?: string;
  locality?: string;
  suburb?: string;
  address?: string;
  nearby_reference?: string;
  nearby_reference_suggestion?: string;
}

export type LocationSource = 'gps' | 'map' | 'search' | null;

interface LocationPickerProps {
  initialLat?: string;
  initialLng?: string;
  onChange: (fields: GeoFields, source: LocationSource) => void;
  /** Chamado sempre que muda a validade — true quando País+Província+Distrito+Vila estão preenchidos */
  onValidityChange?: (valid: boolean) => void;
  mapHeight?: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MZ_CENTER: [number, number] = [-18.0, 35.0];
const MZ_ZOOM = 6;
const LOW_ACC = 200; // metros

// ─── Leaflet loader ───────────────────────────────────────────────────────────

async function loadLeaflet(): Promise<any> {
  if ((window as any).L) return (window as any).L;
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
  }
  await new Promise<void>((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => res();
    s.onerror = rej;
    document.head.appendChild(s);
  });
  return (window as any).L;
}

// ─── Reverse geocoding via backend ───────────────────────────────────────────
// OpenAPI: GET /api/locals/geocode/?lat=&lon=
// Resposta: GeocodeResponse { province, district, locality, country, address,
//           displayName, latitude, longitude, success }
//
// Se o backend falhar (500 / rede), devolve {} — os campos manuais ficam disponíveis
// para o utilizador preencher. O mapa continua a funcionar independentemente.
//
// NOTA: se este endpoint continua a retornar 500, é necessário corrigir o backend.
// Ver secção "O que o backend precisa" no README ou comunicar ao dev backend.

async function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoFields>> {
  try {
    // OpenAPI: GET /api/locals/geocode/?lat={lat}&lon={lon}
    // localsApi.geocode() usa este endpoint conforme definido em api.ts
    const res = await localsApi.geocode(lat, lng);
    if (!res.data) return {};

    const d = res.data;

    if (import.meta.env.DEV) {
      console.log('[LocationPicker] /geocode/ resposta:', d);
    }

    // GeocodeResponse: { province, district, locality, country, address, displayName }
    return {
      country:  d.country   || 'Moçambique',
      province: d.province  || undefined,
      district: d.district  || undefined,
      // locality = Localidade/Vila/Cidade
      city:     d.locality  || undefined,
      locality: d.locality  || undefined,
      // address = endereço formatado completo (displayName ou address)
      address:  d.address   || d.displayName || undefined,
    };
  } catch (e) {
    console.warn('[LocationPicker] /api/locals/geocode/ falhou:', e);
    return {};
  }
}

// ─── Pesquisa via backend ─────────────────────────────────────────────────────
// OpenAPI: GET /api/locals/search/?q=
// Resposta: SearchResponse { data: { results: [...LocalList] } }
//
// NOTA: este endpoint pesquisa locais JÁ CADASTRADOS na plataforma.
// Não é um geocoder geográfico geral como o Nominatim.
// O utilizador encontra apenas lugares que outros já submeteram.
// Para pesquisa geográfica livre, o backend precisaria de expor um endpoint
// de geocoding de texto → coordenadas (não está no OpenAPI actual).

async function searchLocals(query: string): Promise<Array<{
  name: string;
  lat: number;
  lng: number;
  province?: string;
  display_name?: string;
}>> {
  try {
    // OpenAPI: GET /api/locals/search/?q={query}
    const res = await localsApi.search(query.trim());
    const items: any[] = res.data?.results ?? (Array.isArray(res.data) ? res.data : []);

    return items
      .map(r => {
        const rLat = parseFloat(r.location?.latitude ?? r.location?.lat ?? r.lat ?? '0');
        const rLng = parseFloat(r.location?.longitude ?? r.location?.lng ?? r.lon ?? r.lng ?? '0');
        if (isNaN(rLat) || isNaN(rLng) || (rLat === 0 && rLng === 0)) return null;
        return {
          name:         r.name || r.title || '',
          lat:          rLat,
          lng:          rLng,
          province:     r.location?.province || r.province || undefined,
          display_name: [r.name, r.location?.province].filter(Boolean).join(', '),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  } catch (e) {
    console.warn('[LocationPicker] /api/locals/search/ falhou:', e);
    return [];
  }
}

// ─── Marcador ────────────────────────────────────────────────────────────────

function createDraggableIcon(L: any, color = '#1B5E3B') {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:42px;position:relative;">
      <div style="width:32px;height:32px;background:${color};border:3px solid white;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        box-shadow:0 3px 12px rgba(0,0,0,0.4);"></div>
      <div style="width:8px;height:8px;background:white;border-radius:50%;
        position:absolute;top:12px;left:12px;transform:rotate(45deg);"></div>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LocationPicker({
  initialLat, initialLng, onChange, onValidityChange, mapHeight = 260,
}: LocationPickerProps) {
  // ── Refs do mapa (nunca causam re-render) ───────────────────────────────────
  const mapRef       = useRef<HTMLDivElement>(null);
  const leafletMap   = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef  = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ── Estado do mapa / GPS ────────────────────────────────────────────────────
  const [mapReady,    setMapReady]    = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [gpsSuccess,  setGpsSuccess]  = useState(false);
  const [gpsError,    setGpsError]    = useState<string | null>(null);
  const [lowAccuracy, setLowAccuracy] = useState(false);
  const [source,      setSource]      = useState<LocationSource>(null);

  // ── Coordenadas em state → actualizadas em tempo real ──────────────────────
  const [lat,      setLat]      = useState(() => parseFloat(initialLat || '') || null as number | null);
  const [lng,      setLng]      = useState(() => parseFloat(initialLng || '') || null as number | null);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);

  // ── Campos geo em state → mostrados em tempo real ──────────────────────────
  const [geo, setGeo] = useState<Partial<GeoFields>>({});
  const [geocoding, setGeocoding] = useState(false); // spinner enquanto busca

  // ── Campos manuais editáveis pelo utilizador ────────────────────────────────
  // Sugestão automática preenche, utilizador pode corrigir
  // Reset quando localização muda (nova GPS/clique/pesquisa)
  const [manualAdminPost, setManualAdminPost] = useState('');
  const [manualCity,      setManualCity]      = useState('');
  const [manualProvince,  setManualProvince]  = useState('');
  const [manualDistrict,  setManualDistrict]  = useState('');
  const manualEditedRef = useRef({ adminPost: false, city: false, province: false, district: false });

  // ── Validade dos campos obrigatórios ────────────────────────────────────────
  // REGRA: só País + Província + Distrito são obrigatórios.
  // Posto Administrativo e Vila/Cidade são OPCIONAIS — não bloqueiam.
  useEffect(() => {
    if (!onValidityChange) return;
    const effectiveProvince = manualProvince || geo.country && geo.province;
    const effectiveDistrict = manualDistrict || geo.district;
    const valid = !!(lat && lng && (geo.country || 'Moçambique') && effectiveProvince && effectiveDistrict);
    onValidityChange(valid);
  }, [lat, lng, geo, manualProvince, manualDistrict, onValidityChange]);

  // ── Notificar pai quando campos manuais mudam ──────────────────────────────
  useEffect(() => {
    if (lat === null || lng === null) return;
    onChangeRef.current({
      lat:               lat.toFixed(6),
      lng:               lng.toFixed(6),
      accuracy,
      country:            geo.country || 'Moçambique',
      province:           manualProvince  || geo.province  || '',
      district:           manualDistrict  || geo.district  || '',
      administrative_post: manualAdminPost || geo.administrative_post || '',
      locality:           manualCity      || geo.city      || geo.locality || '',
      nearby_reference:  nearbyRefEditedRef.current ? nearbyRef : undefined,
      address:           geo.address,
      nearby_reference_suggestion: geo.nearby_reference_suggestion,
    }, source);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualAdminPost, manualCity, manualProvince, manualDistrict]);

  // ── Referência editável pelo utilizador ────────────────────────────────────
  const [nearbyRef, setNearbyRef] = useState('');

  // ── Pesquisa ────────────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults,   setShowResults]   = useState(false);

  // ── Aplicar posição — chamado em TODOS os eventos (GPS / clique / arraste / pesquisa)
  // Usa ref para não criar closures stale no listener de dragend
  const applyPositionRef = useRef<((lat: number, lng: number, acc: number | undefined, src: LocationSource) => void) | null>(null);
  applyPositionRef.current = (newLat: number, newLng: number, acc: number | undefined, src: LocationSource) => {
    // 1. Actualizar coordenadas imediatamente → UI actualiza
    setLat(newLat);
    setLng(newLng);
    setAccuracy(acc);
    setSource(src);

    // Reset indicadores de edição manual quando há nova localização
    manualEditedRef.current = { adminPost: false, city: false, province: false, district: false };

    // 2. Limpar timer anterior e iniciar debounce para geocoding
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setGeocoding(true);
    debounceRef.current = setTimeout(async () => {
      // Reverse geocoding: GET /api/locals/geocode/?lat=&lon= (OpenAPI)
      // GeocodeResponse → province, district, locality, country, address
      // Se o backend retornar erro, result = {} → campos ficam vazios para preenchimento manual
      const result = await reverseGeocode(newLat, newLng);

      // nearby_reference_suggestion não está disponível sem Overpass (API externa removida).
      // O campo fica undefined — o utilizador pode preencher manualmente o campo "Perto de".
      const resultWithPoi: Partial<GeoFields> = {
        ...result,
        nearby_reference_suggestion: undefined,
      };

      // Sempre atualizar TODOS os campos, mesmo que vazios
      setGeo(resultWithPoi);
      setGeocoding(false);

      // Reset campos manuais quando nova localização chega (API tem novos valores)
      if (!manualEditedRef.current.adminPost) {
        setManualAdminPost(resultWithPoi.administrative_post || '');
      }
      if (!manualEditedRef.current.city) {
        setManualCity(resultWithPoi.city || '');
      }
      if (!manualEditedRef.current.province) {
        setManualProvince(resultWithPoi.province || '');
      }
      if (!manualEditedRef.current.district) {
        setManualDistrict(resultWithPoi.district || '');
      }

      // Se utilizador não editou manualmente, actualizar sugestão (ou limpar se não há POI)
      if (!nearbyRefEditedRef.current) {
        setNearbyRef('');  // sempre limpar para mostrar nova sugestão (ou nada)
      }

      // 3. Notificar o pai com TODOS os campos (mesmo os undefined)
      onChangeRef.current(
        {
          lat:      newLat.toFixed(6),
          lng:      newLng.toFixed(6),
          accuracy: acc,
          // Valores manuais têm prioridade sobre os da API
          country:            resultWithPoi.country || 'Moçambique',
          province:           manualEditedRef.current.province  ? manualProvince  : (resultWithPoi.province  || ''),
          district:           manualEditedRef.current.district  ? manualDistrict  : (resultWithPoi.district  || ''),
          administrative_post: resultWithPoi.administrative_post || '',
          // locality é Localidade/Vila — nunca confundir com district
          locality:           resultWithPoi.city || resultWithPoi.locality || '',
          nearby_reference:   nearbyRefEditedRef.current ? nearbyRef : undefined,
          address:            resultWithPoi.address,
          nearby_reference_suggestion: resultWithPoi.nearby_reference_suggestion,
        },
        src,
      );
    }, 500);
  };

  // ── Mover marcador no mapa ─────────────────────────────────────────────────
  const moveMarkerRef = useRef<((lat: number, lng: number, pan?: boolean) => void) | null>(null);
  moveMarkerRef.current = (mLat: number, mLng: number, pan = true) => {
    if (!leafletMap.current) return;
    const L = (window as any).L;
    if (!L) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([mLat, mLng]);
    } else {
      markerRef.current = L.marker([mLat, mLng], {
        icon: createDraggableIcon(L),
        draggable: true,
      }).addTo(leafletMap.current);

      // dragend — usa ref para ter sempre o applyPosition mais recente
      markerRef.current.on('dragend', (e: any) => {
        const p = e.target.getLatLng();
        applyPositionRef.current?.(p.lat, p.lng, undefined, 'map');
      });
    }
    if (pan) {
      leafletMap.current.setView([mLat, mLng], Math.max(leafletMap.current.getZoom(), 14), { animate: true });
    }
  };

  // ── Inicializar Leaflet ────────────────────────────────────────────────────
  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return;
    if ((mapRef.current as any)._leaflet_id) delete (mapRef.current as any)._leaflet_id;

    let cancelled = false;
    const initLat = lat ?? MZ_CENTER[0];
    const initLng = lng ?? MZ_CENTER[1];
    const initZoom = (lat !== null && lng !== null) ? 14 : MZ_ZOOM;

    loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [initLat, initLng],
        zoom: initZoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Clique no mapa
      map.on('click', (e: any) => {
        const { lat: cLat, lng: cLng } = e.latlng;
        moveMarkerRef.current?.(cLat, cLng, false);
        applyPositionRef.current?.(cLat, cLng, undefined, 'map');
      });

      leafletMap.current = map;
      setMapReady(true);

      // Modo edição — marcador inicial
      if (lat !== null && lng !== null) {
        moveMarkerRef.current?.(lat, lng, false);
      }
    }).catch(console.error);

    return () => {
      cancelled = true;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current  = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Invalidar tamanho ao ficar visível — delay maior para garantir que a animação terminou
  useEffect(() => {
    if (!mapReady) return;
    // Dois passes: 150ms para o layout inicial, 500ms para o caso de animações de transição
    const t1 = setTimeout(() => leafletMap.current?.invalidateSize(false), 150);
    const t2 = setTimeout(() => leafletMap.current?.invalidateSize(false), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mapReady]);

  // Pedir GPS automaticamente ao montar se não há coords iniciais
  useEffect(() => {
    if (lat === null && mapReady) requestGPS();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  // ── GPS ───────────────────────────────────────────────────────────────────
  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('O teu dispositivo não suporta geolocalização.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    setGpsSuccess(false);
    setLowAccuracy(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: pLat, longitude: pLng, accuracy: pAcc } = pos.coords;
        setGpsLoading(false);
        setGpsSuccess(true);
        setLowAccuracy(pAcc > LOW_ACC);
        moveMarkerRef.current?.(pLat, pLng, true);
        applyPositionRef.current?.(pLat, pLng, pAcc, 'gps');
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED)
          setGpsError('Não foi possível aceder à localização. Seleciona manualmente no mapa ou usa a pesquisa.');
        else if (err.code === err.TIMEOUT)
          setGpsError('Tempo limite excedido. Tenta novamente.');
        else
          setGpsError('Não foi possível obter a localização. Usa o mapa ou a pesquisa.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  // ── Pesquisa — usa GET /api/locals/search/?q= (OpenAPI: SearchResponse) ──────
  // Pesquisa locais JÁ CADASTRADOS na plataforma. Não é geocoding geográfico.
  // Se o backend não devolver resultados, o utilizador usa o mapa directamente.
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setShowResults(false);
    try {
      const results = await searchLocals(searchQuery.trim());
      setSearchResults(results);
      setShowResults(true);
    } catch {
      setSearchResults([]);
      setShowResults(true); // mostra "sem resultados"
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const selectResult = useCallback((r: any) => {
    const rLat = typeof r.lat === 'number' ? r.lat : parseFloat(r.lat ?? 0);
    const rLng = typeof r.lng === 'number' ? r.lng : parseFloat(r.lng ?? 0);
    if (isNaN(rLat) || isNaN(rLng) || (rLat === 0 && rLng === 0)) return;
    setShowResults(false);
    setSearchQuery(r.name || r.display_name?.split(',')[0] || '');
    moveMarkerRef.current?.(rLat, rLng, true);
    applyPositionRef.current?.(rLat, rLng, undefined, 'search');
  }, []);

  // Rastreia se o utilizador editou manualmente a referência
  const nearbyRefEditedRef = useRef(false);

  // ── Referência editável — notifica pai imediatamente ─────────────────────
  const handleRefChange = useCallback((value: string) => {
    nearbyRefEditedRef.current = value.length > 0;
    setNearbyRef(value);
    if (lat === null || lng === null) return;
    onChangeRef.current(
      {
        lat:      lat.toFixed(6),
        lng:      lng.toFixed(6),
        accuracy,
        country:            geo.country || 'Moçambique',
        province:           manualProvince  || geo.province  || '',
        district:           manualDistrict  || geo.district  || '',
        administrative_post: manualAdminPost || geo.administrative_post || '',
        locality:           manualCity      || geo.city      || geo.locality || '',
        nearby_reference:   value || undefined,
        address:            geo.address,
        nearby_reference_suggestion: geo.nearby_reference_suggestion,
      },
      source,
    );
  }, [lat, lng, accuracy, geo, source, manualAdminPost, manualCity, manualProvince, manualDistrict]);

  // ── Etiqueta de origem ────────────────────────────────────────────────────
  const srcLabel =
    source === 'gps'    ? { icon: <Target   size={13} />, text: 'Localização do dispositivo',        color: '#1B5E3B', bg: '#EEF7F0' } :
    source === 'map'    ? { icon: <Map      size={13} />, text: 'Localização selecionada no mapa',   color: '#0077B6', bg: '#EFF8FF' } :
    source === 'search' ? { icon: <Search   size={13} />, text: 'Localização encontrada na pesquisa',color: '#7B5EA7', bg: '#F3EEFB' } :
    null;

  const hasCoords = lat !== null && lng !== null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* Erro GPS */}
      <AnimatePresence>
        {gpsError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-4 py-3 rounded-2xl" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <AlertCircle size={15} style={{ color: '#C2410C' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-snug" style={{ color: '#C2410C' }}>{gpsError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aviso baixa precisão */}
      <AnimatePresence>
        {lowAccuracy && !gpsLoading && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-4 py-3 rounded-2xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <AlertCircle size={15} style={{ color: '#B45309' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-snug" style={{ color: '#B45309' }}>
              A localização pode não ser precisa. Confirma a posição no mapa.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pesquisa */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-white rounded-2xl border px-4 py-3 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Pesquisar localização..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ fontFamily: 'Nunito, sans-serif', color: '#1A1A1A' }} />
          {searchQuery && (
            <button type="button" onClick={() => { setSearchQuery(''); setShowResults(false); }}>
              <X size={14} className="text-gray-400" />
            </button>
          )}
          <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={handleSearch}
            disabled={searchLoading || !searchQuery.trim()}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-white text-xs font-black disabled:opacity-40"
            style={{ background: '#7B5EA7' }}>
            {searchLoading ? <Loader2 size={12} className="animate-spin" /> : 'Pesquisar'}
          </motion.button>
        </div>
        <AnimatePresence>
          {showResults && searchResults.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border z-50"
              style={{ borderColor: '#E5E7EB', maxHeight: 200, overflowY: 'auto' }}>
              {searchResults.map((r, i) => (
                <button key={i} type="button" onClick={() => selectResult(r)}
                  className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 transition-colors"
                  style={{ borderColor: '#F3F4F6' }}>
                  <MapPin size={14} style={{ color: '#7B5EA7', flexShrink: 0, marginTop: 2 }} />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold leading-snug block truncate" style={{ color: '#1A1A1A' }}>
                      {r.name || r.display_name || ''}
                    </span>
                    {r.province && (
                      <span className="text-[10px] leading-tight" style={{ color: '#6B7280' }}>
                        {r.province}
                      </span>
                    )}
                    {!r.province && r.display_name && (
                      <span className="text-[10px] leading-tight block truncate" style={{ color: '#6B7280' }}>
                        {r.display_name}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
          {showResults && searchResults.length === 0 && !searchLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border px-4 py-3 z-50"
              style={{ borderColor: '#E5E7EB' }}>
              <p className="text-xs font-bold text-gray-400">Nenhum resultado encontrado</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mapa Leaflet */}
      <div className="relative rounded-2xl overflow-hidden shadow-md border-2"
        style={{ height: mapHeight, borderColor: 'rgba(27,94,59,0.2)' }}>
        <div ref={mapRef} className="absolute inset-0" style={{ zIndex: 0 }} />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#1B5E3B]/30 border-t-[#1B5E3B] rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-400">A carregar mapa...</span>
            </div>
          </div>
        )}
        {mapReady && !hasCoords && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            Toca no mapa para marcar a localização
          </div>
        )}
      </div>

      {/* Origem + botão GPS compacto — na mesma linha */}
      <AnimatePresence>
        {srcLabel && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: srcLabel.bg }}>
            <span style={{ color: srcLabel.color }}>{srcLabel.icon}</span>
            <span className="text-xs font-black flex-1" style={{ color: srcLabel.color }}>{srcLabel.text}</span>
            {/* Botão compacto inline */}
            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={requestGPS} disabled={gpsLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all disabled:opacity-60"
              style={{
                borderColor: '#1B5E3B',
                background: gpsSuccess ? '#1B5E3B' : 'white',
                color: gpsSuccess ? 'white' : '#1B5E3B',
              }}>
              {gpsLoading
                ? <Loader2 size={12} className="animate-spin" />
                : gpsSuccess
                ? <><CheckCircle2 size={12} /> Atualizada</>
                : <><Navigation size={12} /> Atualizar</>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão largo inicial — só antes de ter origem */}
      {!srcLabel && (
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={requestGPS} disabled={gpsLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm border-2 transition-all disabled:opacity-70"
          style={{ borderColor: '#1B5E3B', background: gpsSuccess ? '#EEF7F0' : '#1B5E3B', color: gpsSuccess ? '#1B5E3B' : 'white' }}>
          {gpsLoading
            ? <><Loader2 size={15} className="animate-spin" /> A obter localização...</>
            : gpsSuccess
            ? <><CheckCircle2 size={15} /> Localização atualizada</>
            : <><Navigation size={15} /> Atualizar minha localização</>}
        </motion.button>
      )}

      {/* Dados administrativos — Localização */}
      {hasCoords && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '16px 16px 0 0',
          }}>
            <Globe size={14} style={{ color: '#1B5E3B', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 900, color: '#1A1A1A', flex: 1 }}>Dados administrativos</span>
            {geocoding && <Loader2 size={12} className="animate-spin" style={{ color: '#9CA3AF' }} />}
          </div>

          {geocoding && !geo.province ? (
            <div style={{ padding: '12px', background: 'white', border: '1px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="h-4 rounded-lg animate-pulse mb-2" style={{ background: '#F3F4F6', width: `${55 + i*12}%` }} />
              ))}
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
              {/* País — fixo Moçambique, não editável */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>País</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1A1A1A', marginLeft: 12 }}>Moçambique</span>
              </div>

              {/* Província — editável */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
                  Província
                </p>
                <input
                  type="text"
                  value={manualProvince}
                  onChange={e => {
                    manualEditedRef.current.province = true;
                    setManualProvince(e.target.value);
                  }}
                  placeholder="Ex.: Inhambane..."
                  className="w-full px-4 py-3 rounded-2xl border bg-white text-sm focus:outline-none"
                  style={{ borderColor: manualProvince ? '#1B5E3B' : '#EF4444', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
                />
              </div>

              {/* Distrito — editável */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
                  Distrito
                </p>
                <input
                  type="text"
                  value={manualDistrict}
                  onChange={e => {
                    manualEditedRef.current.district = true;
                    setManualDistrict(e.target.value);
                  }}
                  placeholder="Ex.: Morrumbene..."
                  className="w-full px-4 py-3 rounded-2xl border bg-white text-sm focus:outline-none"
                  style={{ borderColor: manualDistrict ? '#1B5E3B' : '#EF4444', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
                />
              </div>

              {/* Posto Administrativo */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
                  Posto Administrativo <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
                </p>
                <input
                  type="text"
                  value={manualAdminPost}
                  onChange={e => {
                    manualEditedRef.current.adminPost = e.target.value.length > 0;
                    setManualAdminPost(e.target.value);
                  }}
                  placeholder="Ex.: Massinga Sede..."
                  className="w-full px-4 py-3 rounded-2xl border bg-white text-sm focus:outline-none"
                  style={{ borderColor: manualAdminPost ? '#1B5E3B' : '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
                />
              </div>

              {/* Localidade / Vila / Cidade */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
                  Localidade / Vila / Cidade <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
                </p>
                <input
                  type="text"
                  value={manualCity}
                  onChange={e => {
                    manualEditedRef.current.city = e.target.value.length > 0;
                    setManualCity(e.target.value);
                  }}
                  placeholder="Ex.: Chimoio..."
                  className="w-full px-4 py-3 rounded-2xl border bg-white text-sm focus:outline-none"
                  style={{ borderColor: manualCity ? '#1B5E3B' : '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
                />
              </div>

              {/* Perto de */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
                  Perto de <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
                </p>
                <input
                  type="text"
                  placeholder="Ex.: Mercado Central, Escola, Hospital..."
                  value={nearbyRef}
                  onChange={e => handleRefChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border bg-white text-sm focus:outline-none"
                  style={{ borderColor: nearbyRef ? '#1B5E3B' : '#E5E7EB', color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
                />
              </div>

              {/* Endereço completo — gerado a partir dos campos actuais, actualiza em tempo real */}
              {(manualCity || manualAdminPost || manualDistrict || manualProvince || geo.address) && (
                <div style={{ padding: '12px', background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <MapPin size={14} color="#1B5E3B" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Endereço completo</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.5 }}>
                        {buildFullAddress({
                          locality:           manualCity,
                          administrativePost: manualAdminPost,
                          district:           manualDistrict,
                          province:           manualProvince,
                        }) || geo.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}

