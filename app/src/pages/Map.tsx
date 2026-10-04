/**
 * Map.tsx — Mapa geográfico da Txopela Tour
 *
 * REGRA: Usa EXCLUSIVAMENTE dados do backend via endpoints do openapi-schema:
 *   GET /api/locals/         → locais com location{latitude,longitude}
 *   GET /api/services/       → serviços com location{latitude,longitude}
 *   GET /api/posts/          → posts com location{latitude,longitude}
 *   GET /api/locals/nearby/  → locais próximos com distância calculada
 *
 * Sem OSRM, sem Google Maps, sem Nominatim externo, sem coordenadas inventadas.
 * Sem routing externo (schema não define endpoint de rota).
 * Reverse geocoding via /api/locals/reverse-geocode/ (backend próprio).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Search, Navigation, Star, MapPin,
  X, ChevronDown,
} from 'lucide-react';
import type { Local } from '@/types';
import { useScrollTop } from '@/hooks/useScrollTop';
import { localsApi, servicesApi, postsApi } from '@/services/api';
import { useMapContext } from '@/context/MapContext';
import { extractImages } from '@/utils/dataValidation';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────────────────────────────────────

/** Tipo de recurso representado por um pin */
export type PinType = 'local' | 'service' | 'post';

/** Modo de filtro do mapa — posts aparecem sempre (sem filtro próprio) */
type MapMode = 'all' | 'locals' | 'services';

export interface PlacePin {
  id: string;
  lat: number;
  lng: number;
  pinType: PinType;
  name: string;
  /** Categoria textual (para filtro e exibição) */
  category: string;
  /** Cor principal do marcador */
  color: string;
  rating: number;
  reviews: number;
  desc: string;
  /** Imagem principal vinda do backend (null = sem imagem) */
  image: string | null;
  provincia: string;
  /** Para posts: autor */
  author?: { id: string; name: string; avatar?: string };
  /** Para posts: conteúdo */
  content?: string;
  /** Para locais: best season */
  melhorEpoca?: string;
  /** Distância calculada pelo backend (nearby) em km */
  distance?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const PROVINCIAS = [
  'Todas', 'Maputo', 'Gaza', 'Inhambane', 'Sofala',
  'Manica', 'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa',
];

/** Centro de Moçambique */
const MZ_CENTER: [number, number] = [-18.0, 35.0];
const MZ_ZOOM = 6;

/** Cores por tipo de pin */
const PIN_COLORS: Record<PinType, string> = {
  local:   '#1B5E3B',
  service: '#0077B6',
  post:    '#7B5EA7',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de extracção de coordenadas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrai lat/lng de um item da API.
 * LocalWriteRequest usa latitude/longitude no root.
 * LocalDetail/PostDetail/ServiceDetail usam location{latitude,longitude}.
 */
function extractCoords(item: any): { lat: number; lng: number } | null {
  // Root level (LocalWriteRequest & respostas que colocam no root)
  const rootLat = item.latitude  ?? item.lat;
  const rootLng = item.longitude ?? item.lng ?? item.lon;

  // Dentro de location object (PostDetail, LocalDetail, ServiceDetail)
  const loc = item.location;
  const locLat = loc?.latitude  ?? loc?.lat;
  const locLng = loc?.longitude ?? loc?.lng ?? loc?.lon;

  const rawLat = rootLat ?? locLat;
  const rawLng = rootLng ?? locLng;

  if (rawLat == null || rawLng == null) return null;
  const lat = parseFloat(String(rawLat));
  const lng = parseFloat(String(rawLng));
  if (isNaN(lat) || isNaN(lng)) return null;

  // Coordenadas zero (0,0) são inválidas no contexto de Moçambique
  if (lat === 0 && lng === 0) return null;

  return { lat, lng };
}

/**
 * Extrai a imagem principal de um item da API.
 * Usa extractImages (dataValidation) que resolve URLs relativas, usa cache local
 * e suporta todos os formatos que o backend pode devolver.
 */
function extractImage(item: any): string | null {
  return extractImages(item)[0] ?? null;
}

/** Extrai a província de um item da API */
function extractProvince(item: any): string {
  return (
    item.province
    ?? item.location?.province
    ?? item.location?.state
    ?? item.provincia
    ?? ''
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversão de item da API → PlacePin
// ─────────────────────────────────────────────────────────────────────────────

function localToPin(item: any): PlacePin | null {
  const coords = extractCoords(item);
  if (!coords) return null;
  return localToCard(item, coords);
}

/** Converte local para card — sem exigir coordenadas (para o bottom sheet) */
function localToCard(item: any, coords?: { lat: number; lng: number }): PlacePin {
  return {
    id:          `local-${item.id}`,
    lat:         coords?.lat ?? 0,
    lng:         coords?.lng ?? 0,
    pinType:     'local',
    name:        item.name || 'Local',
    category:    item.category || item.subcategory || 'local',
    color:       PIN_COLORS.local,
    rating:      parseFloat(item.rating?.average ?? item.average_rating ?? item.rating ?? 0) || 0,
    reviews:     parseInt(item.rating?.count ?? item.reviews_count ?? item.reviews ?? 0, 10) || 0,
    desc:        item.description || '',
    image:       extractImage(item),
    provincia:   extractProvince(item),
    melhorEpoca: item.bestSeason || item.best_season || '',
    distance:    item.distance != null ? parseFloat(item.distance) : undefined,
  };
}

function serviceToPin(item: any): PlacePin | null {
  const coords = extractCoords(item);
  if (!coords) return null;
  return serviceToCard(item, coords);
}

/** Converte serviço para card — sem exigir coordenadas (para o bottom sheet) */
function serviceToCard(item: any, coords?: { lat: number; lng: number }): PlacePin {
  return {
    id:        `service-${item.id}`,
    lat:       coords?.lat ?? 0,
    lng:       coords?.lng ?? 0,
    pinType:   'service',
    name:      item.title || item.name || 'Serviço',
    category:  item.category || 'service',
    color:     PIN_COLORS.service,
    rating:    parseFloat(item.rating?.average ?? item.average_rating ?? item.rating ?? 0) || 0,
    reviews:   parseInt(item.rating?.count ?? item.reviews_count ?? item.reviews ?? 0, 10) || 0,
    desc:      item.description || '',
    image:     extractImage(item),
    provincia: extractProvince(item),
  };
}

function postToPin(item: any): PlacePin | null {
  const coords = extractCoords(item);
  if (!coords) return null;
  return {
    id:       `post-${item.id}`,
    lat:      coords.lat,
    lng:      coords.lng,
    pinType:  'post',
    name:     item.title || 'Publicação',
    category: item.category || 'post',
    color:    PIN_COLORS.post,
    rating:   0,
    reviews:  parseInt(item.stats?.comments ?? item.stats?.likes ?? 0, 10) || 0,
    desc:     item.content || '',
    image:    extractImage(item),
    provincia: extractProvince(item),
    author:   item.author ? {
      id:     item.author.id,
      name:   item.author.name,
      avatar: item.author.avatar,
    } : undefined,
    content: item.content,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ícones Leaflet por tipo
// ─────────────────────────────────────────────────────────────────────────────

function createPinIcon(L: any, pinType: PinType) {
  const color = PIN_COLORS[pinType];

  if (pinType === 'local') {
    // Pino clássico — verde
    return L.divIcon({
      className: '',
      html: `<div style="width:26px;height:34px;position:relative;">
        <div style="width:26px;height:26px;background:${color};border:2.5px solid white;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
        <div style="width:7px;height:7px;background:white;border-radius:50%;
          position:absolute;top:9px;left:9px;transform:rotate(45deg);"></div>
      </div>`,
      iconSize: [26, 34],
      iconAnchor: [13, 34],
    });
  }

  if (pinType === 'service') {
    // Pino quadrado azul (diamante) — distinto do pino verde dos locais
    return L.divIcon({
      className: '',
      html: `<div style="width:30px;height:30px;position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="width:22px;height:22px;background:${color};border:2.5px solid white;
          transform:rotate(45deg);border-radius:4px;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }

  // Post — losango roxo
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="width:20px;height:20px;background:${color};border:2.5px solid white;
        transform:rotate(45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createClusterIcon(L: any) {
  return (cluster: any) => L.divIcon({
    html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:#1B5E3B;color:white;
      display:flex;align-items:center;justify-content:center;
      font-weight:900;font-size:11px;
      border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    ">${cluster.getChildCount()}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Loader Leaflet (async, sem CDN externo de dados)
// ─────────────────────────────────────────────────────────────────────────────

async function loadLeaflet(): Promise<any> {
  if ((window as any).L?.MarkerClusterGroup) return (window as any).L;

  // CSS base
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
  }
  // CSS cluster
  if (!document.querySelector('link[href*="MarkerCluster"]')) {
    ['MarkerCluster.Default', 'MarkerCluster'].forEach(name => {
      const c = document.createElement('link');
      c.rel = 'stylesheet';
      c.href = `https://unpkg.com/leaflet.markercluster@1.5.3/dist/${name}.css`;
      document.head.appendChild(c);
    });
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
  // JS Cluster
  if (!(window as any).L?.MarkerClusterGroup) {
    await new Promise<void>((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      s.onload = () => res(); s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  return (window as any).L;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface MapProps {
  onLocalPress?: (local: Local) => void;
  onBack?: () => void;
  /** ID de post recém-criado — se tiver coords válidas, mapa faz zoom para ele */
  newPostId?: string | null;
  /** Chamado pelo mapa após consumir newPostId — App.tsx deve chamar setNewPostId(null) */
  onNewPostIdConsumed?: () => void;
  /** Chamado quando o utilizador clica num pin/card para abrir os detalhes — App.tsx gere a tela */
  onDetailPress?: (pin: PlacePin) => void;
  /** Abre perfil público de um autor */
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function Map({ onLocalPress, newPostId, onNewPostIdConsumed, onDetailPress, onAuthorPress }: MapProps) {
  useScrollTop();

  // ── Refs do mapa ──────────────────────────────────────────────────────────
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletMap  = useRef<any>(null);
  const clusterRef  = useRef<any>(null);
  const tileRef     = useRef<any>(null);
  const labelsRef   = useRef<any>(null);

  // Ref estável para onDetailPress — garante que o closure do marcador Leaflet
  // usa sempre a versão mais recente, mesmo que a prop mude entre renders.
  const onDetailPressRef = useRef(onDetailPress);
  useEffect(() => { onDetailPressRef.current = onDetailPress; }, [onDetailPress]);

  // ── MapContext — subscrever reloads e zoom targets ────────────────────────
  const { mapDataVersion, zoomTarget, clearZoomTarget } = useMapContext();

  // ── Estado UI ─────────────────────────────────────────────────────────────
  const [mapReady,        setMapReady]        = useState(false);
  const [satelliteMode,   setSatelliteMode]   = useState(true);
  const [viewMode,        setViewMode]        = useState<'country' | 'nearby'>('country');
  const [mapMode,         setMapMode]         = useState<MapMode>('all');
  const [showModeMenu,    setShowModeMenu]     = useState(false);
  const [activeProvincia, setActiveProvincia] = useState('Todas');
  const [search,          setSearch]          = useState('');
  const [pinsLoading,     setPinsLoading]     = useState(true);
  const [pinsError,       setPinsError]       = useState<string | null>(null);

  // ── Pins — apenas recursos COM coordenadas (para marcadores no mapa) ─────
  const [allPins, setAllPins] = useState<PlacePin[]>([]);

  // ── Cards — todos os locais e serviços (com ou sem coords), para o bottom sheet
  const [allCardLocals,   setAllCardLocals]   = useState<PlacePin[]>([]);
  const [allCardServices, setAllCardServices] = useState<PlacePin[]>([]);

  // ── Localização do utilizador ─────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // ── Ref para botão modo (portal positioning) ──────────────────────────────
  const modeBtnRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; right: number } | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Carregamento de dados — APENAS via endpoints do schema
  // ─────────────────────────────────────────────────────────────────────────

  const loadPins = useCallback(async (): Promise<PlacePin[]> => {
    setPinsLoading(true);
    setPinsError(null);

    try {
      const [localsRes, servicesRes, postsRes] = await Promise.allSettled([
        // GET /api/locals/?limit=100
        localsApi.list({ page: 1, limit: 100, sortBy: 'recent' }),
        // GET /api/services/?limit=100
        servicesApi.list({ page: 1, limit: 100, sortBy: 'recent' }),
        // GET /api/posts/?limit=100
        postsApi.list({ page: 1, limit: 100, sortBy: 'recent' }),
      ]);

      const pins: PlacePin[] = [];
      const cardLocals:   PlacePin[] = [];
      const cardServices: PlacePin[] = [];

      // ── Locais ─────────────────────────────────────────────────────────
      if (localsRes.status === 'fulfilled' && localsRes.value.data) {
        const items: any[] = (
          localsRes.value.data.locals
          ?? localsRes.value.data.results
          ?? (Array.isArray(localsRes.value.data) ? localsRes.value.data : [])
        );
        items.forEach(item => {
          const coords = extractCoords(item);
          // Pin no mapa — só com coords
          const pin = localToPin(item);
          if (pin) pins.push(pin);
          // Card no bottom sheet — sempre (com ou sem coords)
          cardLocals.push(localToCard(item, coords ?? undefined));
        });
      }

      // ── Serviços ───────────────────────────────────────────────────────
      if (servicesRes.status === 'fulfilled' && servicesRes.value.data) {
        const items: any[] = (
          servicesRes.value.data.services
          ?? servicesRes.value.data.results
          ?? (Array.isArray(servicesRes.value.data) ? servicesRes.value.data : [])
        );
        items.forEach(item => {
          const coords = extractCoords(item);
          // Pin no mapa — só com coords
          const pin = serviceToPin(item);
          if (pin) pins.push(pin);
          // Card no bottom sheet — sempre
          cardServices.push(serviceToCard(item, coords ?? undefined));
        });
      }

      // ── Posts ─────────────────────────────────────────────────────────
      if (postsRes.status === 'fulfilled' && postsRes.value.data) {
        const items: any[] = (
          postsRes.value.data.posts
          ?? postsRes.value.data.results
          ?? (Array.isArray(postsRes.value.data) ? postsRes.value.data : [])
        );
        items.forEach(item => {
          const pin = postToPin(item);
          if (pin) pins.push(pin);
        });
      }

      setAllPins(pins);
      setAllCardLocals(cardLocals);
      setAllCardServices(cardServices);
      return pins;
    } catch (err) {
      console.error('[Map] Erro ao carregar pins:', err);
      setPinsError('Não foi possível carregar os dados. Tenta novamente.');
      return [];
    } finally {
      setPinsLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => { loadPins(); }, [loadPins]);

  // ─────────────────────────────────────────────────────────────────────────
  // MapContext — recarregar quando mapDataVersion muda (WebSocket ou AddPost)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (mapDataVersion === 0) return; // ignorar carga inicial (já tratada acima)
    loadPins().then(freshPins => {
      // Se existe zoomTarget, fazer zoom para o recurso após o reload
      if (!zoomTarget) return;
      const pinId = `${zoomTarget.resourceType}-${zoomTarget.resourceId}`;
      const pin = freshPins.find(p => p.id === pinId);
      if (pin && leafletMap.current) {
        leafletMap.current.setView([pin.lat, pin.lng], 14, { animate: true });
        onDetailPressRef.current?.(pin);
      }
      clearZoomTarget();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapDataVersion]);

  // ─────────────────────────────────────────────────────────────────────────
  // newPostId prop — compatibilidade com a prop legacy do App.tsx
  // Usa os pins frescos retornados por loadPins (sem stale closure)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!newPostId) return;
    loadPins().then(freshPins => {
      const pin = freshPins.find(p => p.id === `post-${newPostId}`);
      if (pin && leafletMap.current) {
        leafletMap.current.setView([pin.lat, pin.lng], 14, { animate: true });
        onDetailPressRef.current?.(pin);
      }
      // Notificar o pai que o id foi consumido — evita re-trigger em remount
      onNewPostIdConsumed?.();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPostId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtros
  // ─────────────────────────────────────────────────────────────────────────

  const filteredPins = allPins.filter(p => {
    if (mapMode !== 'all') {
      const expectedType: PinType =
        mapMode === 'locals'   ? 'local' : 'service';
      if (p.pinType !== expectedType) return false;
    }
    if (activeProvincia !== 'Todas' && p.provincia !== activeProvincia) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.desc.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Inicialização do Leaflet
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return;
    if ((mapRef.current as any)._leaflet_id) {
      delete (mapRef.current as any)._leaflet_id;
    }

    loadLeaflet().then(L => {
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: MZ_CENTER,
        zoom: MZ_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      // Tile base — satélite por defeito
      tileRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 },
      ).addTo(map);

      // Labels overlay
      labelsRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 1 },
      ).addTo(map);

      leafletMap.current = map;
      map.invalidateSize({ animate: false });
      setMapReady(true);
    }).catch(err => {
      console.error('[Map] Erro ao inicializar Leaflet:', err);
      setPinsError('Não foi possível carregar o mapa.');
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle camada satélite/rua
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!leafletMap.current || !mapReady) return;
    const L = (window as any).L;

    if (tileRef.current)  leafletMap.current.removeLayer(tileRef.current);
    if (labelsRef.current) leafletMap.current.removeLayer(labelsRef.current);

    if (satelliteMode) {
      tileRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 },
      ).addTo(leafletMap.current);
      labelsRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 1 },
      ).addTo(leafletMap.current);
    } else {
      tileRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 },
      ).addTo(leafletMap.current);
      labelsRef.current = null;
    }
  }, [satelliteMode, mapReady]);

  // ─────────────────────────────────────────────────────────────────────────
  // Actualizar marcadores no mapa quando os pins filtrados mudam
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!leafletMap.current || !mapReady) return;
    const L = (window as any).L;

    // Remove cluster anterior
    if (clusterRef.current) leafletMap.current.removeLayer(clusterRef.current);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      iconCreateFunction: createClusterIcon(L),
    });

    filteredPins.forEach(pin => {
      const icon   = createPinIcon(L, pin.pinType);
      const marker = L.marker([pin.lat, pin.lng], { icon });

      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        // Usa ref estável — garante a versão actual mesmo em closures antigos
        onDetailPressRef.current?.(pin);
      });

      cluster.addLayer(marker);
    });

    leafletMap.current.addLayer(cluster);
    clusterRef.current = cluster;
  }, [filteredPins, mapReady]);

  // ─────────────────────────────────────────────────────────────────────────
  // Geolocalização
  // ─────────────────────────────────────────────────────────────────────────

  const goToUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserLocation([lat, lng]);
      setViewMode('nearby');
      leafletMap.current?.setView([lat, lng], 14, { animate: true });
    });
  }, []);

  const goToMozambique = useCallback(() => {
    setViewMode('country');
    leafletMap.current?.setView(MZ_CENTER, MZ_ZOOM, { animate: true });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render principal — mapa
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-col h-screen overflow-hidden" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 z-40 px-3 pt-3 pb-2">

        {/* Barra de pesquisa */}
        <div className="flex items-center bg-white rounded-2xl shadow-lg px-4 py-3 mb-2 gap-2">
          <Search size={17} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar lugares, publicações..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: '#1A1A1A', fontFamily: 'Nunito, sans-serif' }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Províncias + botão modo */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 w-max">
              {PROVINCIAS.map(p => (
                <button
                  key={p}
                  onClick={() => setActiveProvincia(p)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all whitespace-nowrap"
                  style={{
                    background:   activeProvincia === p ? 'rgba(27,94,59,0.08)' : 'white',
                    borderColor:  activeProvincia === p ? '#1B5E3B' : '#E5E7EB',
                    color:        activeProvincia === p ? '#1B5E3B' : '#1A1A1A',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Botão modo */}
          <button
            ref={modeBtnRef}
            onClick={() => {
              if (modeBtnRef.current) {
                const r = modeBtnRef.current.getBoundingClientRect();
                setPopupPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }
              setShowModeMenu(v => !v);
            }}
            className="flex-shrink-0 flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-sm font-black shadow-sm border-2"
            style={{
              borderColor: mapMode === 'services' ? '#0077B6' : '#1B5E3B',
              background:  mapMode === 'services' ? 'rgba(0,119,182,0.08)' : 'rgba(27,94,59,0.08)',
              color:       mapMode === 'services' ? '#0077B6' : '#1B5E3B',
            }}
          >
            <div className="flex items-center gap-0.5">
              {mapMode === 'all' ? (
                <>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B5E3B' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0077B6' }} />
                </>
              ) : (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: mapMode === 'services' ? '#0077B6' : '#1B5E3B' }} />
              )}
            </div>
            <ChevronDown
              size={11}
              strokeWidth={2}
              style={{ transform: showModeMenu ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
            />
          </button>
        </div>
      </div>

      {/* ── MENU MODO (portal) ───────────────────────────────────────────────── */}
      {showModeMenu && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setShowModeMenu(false)}
          />
          <div
            style={{
              position: 'fixed',
              top:   popupPos?.top  ?? 100,
              right: popupPos?.right ?? 12,
              zIndex: 9999,
              background: 'white',
              borderRadius: 16,
              border: '2px solid #1B5E3B',
              boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
              overflow: 'hidden',
              fontFamily: 'Nunito, sans-serif',
              minWidth: 140,
            }}
          >
            {([
              { id: 'all'      as MapMode, label: 'Tudo',     dot: 'multi'   },
              { id: 'locals'   as MapMode, label: 'Locais',   dot: '#1B5E3B' },
              { id: 'services' as MapMode, label: 'Serviços', dot: '#0077B6' },
            ]).map(option => {
              const active = mapMode === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => { setMapMode(option.id); setShowModeMenu(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderBottom: '1px solid #F0F0F0',
                    background: active ? 'rgba(27,94,59,0.07)' : 'white',
                    cursor: 'pointer',
                  } as React.CSSProperties}
                >
                  <div style={{ flexShrink: 0, display: 'flex', gap: 3 }}>
                    {option.dot === 'multi'
                      ? <>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1B5E3B' }} />
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0077B6' }} />
                        </>
                      : <div style={{ width: 12, height: 12, borderRadius: '50%', background: option.dot }} />
                    }
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 800 : 600, color: active ? '#1B5E3B' : '#1A1A1A' }}>
                    {option.label}
                  </p>
                </button>
              );
            })}
          </div>
        </>,
        document.body,
      )}

      {/* ── MAPA ────────────────────────────────────────────────────────────── */}
      <div
        className="relative mx-3 rounded-2xl overflow-hidden shadow-lg border-2 flex-1"
        style={{ borderColor: 'rgba(27,94,59,0.2)', minHeight: 200 }}
      >
        {/* Container Leaflet — apenas o mapa e os seus pins */}
        <div ref={mapRef} className="absolute inset-0" />
      </div>

      {/* ── BOTTOM SHEET ────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 rounded-t-3xl shadow-2xl"
        style={{ background: '#F2F2F7' }}
      >
        <div className="px-3 pt-2 pb-3">

          {/* Botões navegação */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={goToUserLocation}
              className="flex items-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold border-2 transition-all"
              style={{
                background: viewMode === 'nearby' ? '#1B5E3B' : 'rgba(27,94,59,0.07)',
                borderColor: '#1B5E3B',
                color: viewMode === 'nearby' ? 'white' : '#1B5E3B',
              }}
            >
              <Navigation size={12} strokeWidth={2} color={viewMode === 'nearby' ? 'white' : '#1B5E3B'} />
              Perto de ti
            </button>
            <button
              onClick={goToMozambique}
              className="flex items-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold border-2 transition-all"
              style={{
                background: viewMode === 'country' ? '#1B5E3B' : 'rgba(27,94,59,0.07)',
                borderColor: '#1B5E3B',
                color: viewMode === 'country' ? 'white' : '#1B5E3B',
              }}
            >
              <MapPin size={12} strokeWidth={2} color={viewMode === 'country' ? 'white' : '#1B5E3B'} />
              Todo o país
            </button>
          </div>

          {/* Cards horizontais — separados por Locais e Serviços */}
          {(() => {
            // Filtrar cards por província e pesquisa (independente de coords)
            const filterCard = (p: PlacePin) => {
              if (mapMode === 'locals'   && p.pinType !== 'local')   return false;
              if (mapMode === 'services' && p.pinType !== 'service') return false;
              if (activeProvincia !== 'Todas' && p.provincia !== activeProvincia) return false;
              if (search) {
                const q = search.toLowerCase();
                if (!p.name.toLowerCase().includes(q) && !p.desc.toLowerCase().includes(q)) return false;
              }
              return true;
            };

            const locals   = allCardLocals.filter(filterCard).slice(0, 8);
            const services = allCardServices.filter(filterCard).slice(0, 8);

            const renderCard = (place: typeof filteredPins[0], i: number) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex-shrink-0 cursor-pointer"
                style={{ width: 112 }}
                onClick={() => {
                  // Fazer zoom no mapa se tiver coordenadas reais
                  if (place.lat !== 0 || place.lng !== 0) {
                    leafletMap.current?.setView([place.lat, place.lng], 14, { animate: true });
                  }
                  // Delegar ao App.tsx que abre a tela de detalhe correcta
                  onDetailPressRef.current?.(place);
                }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ height: 82 }}>
                  {place.image
                    ? <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                        style={{ background: `${place.color}15` }}>
                        <MapPin size={20} color={place.color} strokeWidth={1.5} />
                      </div>
                  }
                  {/* Ponto identificador de tipo — verde=local, azul=serviço */}
                  <div
                    className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ background: place.color }}
                  />
                  {/* Rating */}
                  {place.rating > 0 && (
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/40 rounded px-1 py-0.5">
                      <Star size={8} fill="#FBBF24" stroke="none" />
                      <span className="text-[9px] font-bold text-white">{place.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <p className="pt-1 text-[11px] font-black leading-tight truncate text-left"
                  style={{ color: '#1A1A1A' }}>
                  {place.name}
                </p>
              </motion.div>
            );

            // Intercalar locais e serviços numa única linha: local, serviço, local, serviço...
            const maxLen = Math.max(locals.length, services.length);
            const interleaved: PlacePin[] = [];
            for (let i = 0; i < maxLen; i++) {
              if (i < locals.length)   interleaved.push(locals[i]);
              if (i < services.length) interleaved.push(services[i]);
            }
            if (interleaved.length === 0) return null;

            return (
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
                {interleaved.map((place, i) => renderCard(place, i))}
              </div>
            );
          })()}

          {/* Estado vazio */}
          {!pinsLoading && allCardLocals.length === 0 && allCardServices.length === 0 && !pinsError && (
            <p className="text-center text-xs font-bold py-2" style={{ color: '#9CA3AF' }}>
              Nenhum local ou serviço disponível nesta vista.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
