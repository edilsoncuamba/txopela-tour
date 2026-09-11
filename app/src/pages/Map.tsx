import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Layers, Navigation, Star, MapPin, X, Car, Footprints, Clock, Route, ChevronRight, ChevronLeft, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { CategoryIcon, CATEGORY_COLORS } from '@/components/icons';
import DestinationDetail from '@/pages/DestinationDetail';
import type { Local } from '@/types';
import { useScrollTop } from '@/hooks/useScrollTop';
import { localsApi, servicesApi } from '@/services/api';

interface MapProps {
  onLocalPress: (local: Local) => void;
  onBack?: () => void;
}

const categories = [
  { id: 'praias',     label: 'Praias',            color: '#2BB5C8' },
  { id: 'cultura',    label: 'Cultura',            color: '#7B5EA7' },
  { id: 'natureza',   label: 'Natureza',           color: '#1B5E3B' },
  { id: 'aventura',   label: 'Aventura',           color: '#F4821F' },
  { id: 'gastro',     label: 'Gastronomia',        color: '#E05A3A' },
  { id: 'mergulho',   label: 'Mergulho',           color: '#2563EB' },
  { id: 'ecoturismo', label: 'Ecoturismo',         color: '#22C55E' },
];

const provincias = ['Todas','Maputo','Gaza','Inhambane','Sofala','Manica','Tete','Zambézia','Nampula','Cabo Delgado','Niassa'];

// Default location: Maputo city centre
const DEFAULT_LOCATION: [number, number] = [-25.9692, 32.5732];

interface PlacePin {
  id: string; lat: number; lng: number;
  pinType: 'local' | 'service';          // tipo real — determina ícone e modo
  category: string; color: string;
  name: string; rating: number; reviews: number;
  categoryLabel: string; desc: string; dist: string;
  badge: string; image: string; melhorEpoca: string; provincia: string;
}

export default function Map({
  onLocalPress }: MapProps) {
  useScrollTop();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clusterRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeProvincia, setActiveProvincia] = useState('Todas');
  const [search, setSearch] = useState('');
  const [allPins, setAllPins] = useState<PlacePin[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<PlacePin | null>(null);
  const [selectedPin, setSelectedPin] = useState<PlacePin | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [satelliteMode, setSatelliteMode] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'country' | 'nearby'>('country');
  const [mapMode, setMapMode] = useState<'all' | 'locals' | 'services'>('all'); // ← modo ativo: todos, locais ou serviços
  const [showModeSelector, setShowModeSelector] = useState(false); // ← popup de seleção de modo
  const modeBtnRef = useRef<HTMLButtonElement>(null); // ← ref para posicionar o portal
  const [popupPos, setPopupPos] = useState<{ top: number; right: number } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeShownForPin, setRouteShownForPin] = useState<string | null>(null);
  const [pinsLoading, setPinsLoading] = useState(true);

  // ── Carrega pins reais da API (locais com lat/lng) ─────────────────────────
  useEffect(() => {
    const toPin = (item: any, pinType: 'local' | 'service'): PlacePin | null => {
      // Coords no root OU dentro de location{}
      const rawLat = item.latitude  ?? item.lat  ?? item.location?.latitude  ?? item.location?.lat;
      const rawLng = item.longitude ?? item.lng  ?? item.lon ?? item.location?.longitude ?? item.location?.lng ?? item.location?.lon;
      const lat = parseFloat(rawLat);
      const lng = parseFloat(rawLng);
      if (isNaN(lat) || isNaN(lng)) return null;

      const image = item.main_image || item.image || (Array.isArray(item.images) && item.images[0]) || '/images/local-1.jpg';

      return {
        id:            String(item.id || Math.random()),
        lat, lng,
        pinType,                                   // ← tipo real vindo da API
        category:      item.category || item.subcategory || pinType, // categoria real para filtro
        color:         pinType === 'local' ? '#1B5E3B' : '#0077B6',
        categoryLabel: pinType === 'local' ? 'Local' : 'Serviço',
        name:          item.name || item.title || (pinType === 'local' ? 'Local' : 'Serviço'),
        rating:        parseFloat(item.average_rating ?? item.rating?.average ?? item.rating ?? 0) || 0,
        reviews:       parseInt(item.reviews_count ?? item.rating?.count ?? item.reviews ?? 0, 10) || 0,
        desc:          item.description || '',
        dist:          '',
        badge:         pinType === 'local' ? 'Local' : 'Serviço',
        image,
        melhorEpoca:   item.best_season || item.bestSeason || '',
        provincia:     item.province || item.location?.province || item.provincia || '',
      };
    };

    const fetchPins = async () => {
      setPinsLoading(true);
      try {
        const [localsRes, servicesRes] = await Promise.allSettled([
          localsApi.list({ page: 1, limit: 100, sortBy: 'recent' }),
          servicesApi.list({ page: 1, limit: 100, sortBy: 'recent' }),
        ]);

        const pins: PlacePin[] = [];

        if (localsRes.status === 'fulfilled' && localsRes.value.data) {
          const items: any[] = localsRes.value.data.locals
            ?? localsRes.value.data.results
            ?? (Array.isArray(localsRes.value.data) ? localsRes.value.data : []);
          items.forEach(item => { const p = toPin(item, 'local'); if (p) pins.push(p); });
        }

        if (servicesRes.status === 'fulfilled' && servicesRes.value.data) {
          const items: any[] = servicesRes.value.data.services
            ?? servicesRes.value.data.results
            ?? (Array.isArray(servicesRes.value.data) ? servicesRes.value.data : []);
          items.forEach(item => { const p = toPin(item, 'service'); if (p) pins.push(p); });
        }

        setAllPins(pins);
      } catch (err) {
        console.error('[Map] Erro ao carregar pins:', err);
      } finally {
        setPinsLoading(false);
      }
    };

    fetchPins();
  }, []);

  // Mapeamento das categorias UI → valores da API
  const CATEGORY_API_MAP: Record<string, string[]> = {
    praias:     ['praias', 'praia', 'beach', 'attraction'],
    cultura:    ['cultura', 'culture', 'heritage', 'attraction'],
    natureza:   ['natureza', 'nature', 'park', 'attraction'],
    aventura:   ['aventura', 'adventure', 'attraction'],
    gastro:     ['gastronomia', 'gastro', 'restaurant', 'food'],
    mergulho:   ['mergulho', 'diving', 'attraction'],
    ecoturismo: ['ecoturismo', 'ecotourism', 'attraction'],
  };

  // Filtered pins — filtra por modo (all/locals/services), categoria, província e pesquisa
  const filteredPins = allPins.filter(p => {
    // Filtro por modo
    if (mapMode !== 'all') {
      const expectedPinType = mapMode === 'locals' ? 'local' : 'service';
      if (p.pinType !== expectedPinType) return false;
    }
    // Filtro por categoria
    if (activeCategory) {
      const apiValues = CATEGORY_API_MAP[activeCategory] ?? [activeCategory];
      const catLower = (p.category || '').toLowerCase();
      if (!apiValues.some(v => catLower.includes(v))) return false;
    }
    if (activeProvincia !== 'Todas' && p.provincia !== activeProvincia) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.categoryLabel.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // -- Clear route polyline --------------------------------------------------
  const clearRoute = () => {
    if (routeLayerRef.current && leafletMap.current) {
      leafletMap.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteShownForPin(null);
  };

  // -- Draw route via OSRM ---------------------------------------------------
  const showRoute = async (pin: PlacePin) => {
    if (!leafletMap.current) return;

    // If route already shown for this pin, clear it (toggle off)
    if (routeShownForPin === pin.id) {
      clearRoute();
      return;
    }

    // Clear any existing route first
    clearRoute();

    const [fromLat, fromLng] = userLocation ?? DEFAULT_LOCATION;
    const toLat = pin.lat;
    const toLng = pin.lng;

    setRouteLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM request failed');
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes?.length) {
        console.warn('No route found from OSRM');
        return;
      }

      const L = (window as any).L;
      const geojson = data.routes[0].geometry;

      const polyline = L.geoJSON(geojson, {
        style: {
          color: '#2563EB',
          weight: 4,
          opacity: 0.85,
          dashArray: undefined,
          lineJoin: 'round',
          lineCap: 'round',
        },
      }).addTo(leafletMap.current);

      routeLayerRef.current = polyline;
      setRouteShownForPin(pin.id);

      // Fit map to show the full route
      leafletMap.current.fitBounds(polyline.getBounds(), { padding: [40, 40], animate: true });
    } catch (err) {
      console.error('Route error:', err);
    } finally {
      setRouteLoading(false);
    }
  };

  // -- Init Leaflet ----------------------------------------------------------
  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return;

    // Garante que o container est� limpo (evita "Map container is already initialized")
    if ((mapRef.current as any)._leaflet_id) {
      delete (mapRef.current as any)._leaflet_id;
    }

    const init = async () => {
      // Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }
      // Cluster CSS
      if (!document.querySelector('link[href*="MarkerCluster"]')) {
        const css2 = document.createElement('link');
        css2.rel = 'stylesheet';
        css2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
        document.head.appendChild(css2);
        const css3 = document.createElement('link');
        css3.rel = 'stylesheet';
        css3.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
        document.head.appendChild(css3);
      }
      // Leaflet JS
      if (!(window as any).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = () => res(); s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      // Cluster JS
      if (!(window as any).L?.MarkerClusterGroup) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
          s.onload = () => res(); s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      const L = (window as any).L;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [-18.0, 35.0],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      });

      // Base satellite layer
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);

      // Hybrid labels overlay (place names, roads, admin boundaries)
      labelsLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 1 }
      ).addTo(map);

      leafletMap.current = map;
      setMapReady(true);
    };

    init().catch(console.error);
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // -- Toggle satellite / street ---------------------------------------------
  useEffect(() => {
    if (!leafletMap.current || !mapReady) return;
    const L = (window as any).L;

    // Remove existing base + labels layers
    if (tileLayerRef.current) leafletMap.current.removeLayer(tileLayerRef.current);
    if (labelsLayerRef.current) leafletMap.current.removeLayer(labelsLayerRef.current);

    if (satelliteMode) {
      // Satellite base
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(leafletMap.current);
      // Hybrid labels overlay
      labelsLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 1 }
      ).addTo(leafletMap.current);
    } else {
      // Street map (no labels overlay needed � OSM already has labels)
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      ).addTo(leafletMap.current);
      labelsLayerRef.current = null;
    }
  }, [satelliteMode, mapReady]);

  // -- Update markers + clusters ---------------------------------------------
  useEffect(() => {
    if (!leafletMap.current || !mapReady) return;
    const L = (window as any).L;

    // Remove old cluster
    if (clusterRef.current) leafletMap.current.removeLayer(clusterRef.current);

    // Create cluster group with smaller icons (25x25)
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      iconCreateFunction: (c: any) => L.divIcon({
        html: `<div style="
          width:25px;height:25px;border-radius:50%;
          background:#1B5E3B;color:white;
          display:flex;align-items:center;justify-content:center;
          font-weight:900;font-size:11px;
          border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">${c.getChildCount()}</div>`,
        className: '', iconSize: [25, 25], iconAnchor: [12, 12],
      }),
    });

    filteredPins.forEach(pin => {
      // Ícone único por tipo: Local = pino verde, Serviço = círculo azul
      const icon = pin.pinType === 'local'
        ? L.divIcon({
            className: '',
            html: `<div style="
              width:26px;height:34px;position:relative;
            ">
              <div style="
                width:26px;height:26px;background:#1B5E3B;border:2px solid white;
                border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                box-shadow:0 2px 8px rgba(0,0,0,0.4);
              "></div>
              <div style="
                width:6px;height:6px;background:white;border-radius:50%;
                position:absolute;top:10px;left:10px;transform:rotate(45deg);
              "></div>
            </div>`,
            iconSize: [26, 34],
            iconAnchor: [13, 34],
          })
        : L.divIcon({
            className: '',
            html: `<div style="
              width:26px;height:26px;background:#0077B6;border:2.5px solid white;
              border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);
              display:flex;align-items:center;justify-content:center;
            ">
              <div style="
                width:8px;height:8px;background:white;border-radius:50%;
              "></div>
            </div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .on('click', () => {
          clearRoute();
          setSelectedDetail(pin);
        });
      cluster.addLayer(marker);
    });

    leafletMap.current.addLayer(cluster);
    clusterRef.current = cluster;
  }, [filteredPins, mapReady]);

  // -- Geolocation -----------------------------------------------------------
  const goToUserLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserLocation([lat, lng]);
      setViewMode('nearby');
      leafletMap.current?.setView([lat, lng], 14, { animate: true });
    });
  };

  const goToMozambique = () => {
    setViewMode('country');
    leafletMap.current?.setView([-18.0, 35.0], 6, { animate: true });
  };

  // -- Refresh map when returning from detail view --------------------------
  useEffect(() => {
    if (!selectedDetail && mapReady && leafletMap.current) {
      // Force map to recalculate its size and redraw
      setTimeout(() => {
        leafletMap.current?.invalidateSize(false);
      }, 100);
    }
  }, [selectedDetail, mapReady]);

  // -- Main render with AnimatePresence to prevent map destruction ----------
  return (
    <AnimatePresence mode="wait">
      {selectedDetail ? (
        <motion.div
          key="destination-detail"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <DestinationDetail
            destination={{
              id: selectedDetail.id, name: selectedDetail.name,
              category: selectedDetail.categoryLabel, provincia: selectedDetail.provincia,
              desc: selectedDetail.desc, image: selectedDetail.image,
              rating: selectedDetail.rating, reviews: selectedDetail.reviews,
              badge: selectedDetail.badge, badgeBg: selectedDetail.color,
              melhorEpoca: selectedDetail.melhorEpoca,
            }}
            onBack={() => setSelectedDetail(null)}
            onExploreMore={() => setSelectedDetail(null)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="map-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col h-screen overflow-hidden" style={{ fontFamily: 'Nunito, sans-serif' }}>

      {/* -- HEADER ------------------------------------------------------------ */}
      <div className="flex-shrink-0 z-40 px-3 pt-3 pb-2" style={{ background: 'transparent' }}>
        {/* Search bar */}
        <div className="flex items-center bg-white rounded-2xl shadow-lg px-4 py-3 mb-2 gap-2">
          <Search size={17} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar lugares, experi�ncias..."
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 pl-2 border-l border-gray-200 flex-shrink-0 relative"
          >
            <SlidersHorizontal size={16} className={showFilters || activeCategory || activeProvincia !== 'Todas' ? 'text-[#1B5E3B]' : 'text-gray-600'} />
            {(activeCategory || activeProvincia !== 'Todas') && (
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#1B5E3B]" />
            )}
          </button>
        </div>

        {/* Modo de visualização: botão compacto no canto direito */}
        <div className="flex justify-end mb-2">
          <motion.button
            ref={modeBtnRef}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (modeBtnRef.current) {
                const r = modeBtnRef.current.getBoundingClientRect();
                setPopupPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
              }
              setShowModeSelector(v => !v);
            }}
            className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-black border-2 shadow-sm transition-all"
            style={{ background: 'white', borderColor: '#1B5E3B', color: '#1B5E3B' }}
          >
            <div className="flex items-center gap-1.5">
              {mapMode === 'all' ? (
                <>
                  <MapPin size={14} color="#1B5E3B" strokeWidth={2.5} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0077B6', border: '2px solid #0077B6' }} />
                </>
              ) : mapMode === 'locals' ? (
                <MapPin size={16} color="#1B5E3B" strokeWidth={2.5} />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#0077B6', border: '2px solid #0077B6' }} />
              )}
            </div>
            <ChevronDown size={12} color="#1B5E3B" strokeWidth={2}
              style={{ transform: showModeSelector ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </motion.button>
        </div>

        {/* Portal — renderizado no body para ficar acima do mapa */}
        {showModeSelector && createPortal(
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
              onClick={() => setShowModeSelector(false)}
            />
            <div
              style={{
                position: 'fixed',
                top: popupPos?.top ?? 100,
                right: popupPos?.right ?? 12,
                zIndex: 9999,
                width: 'max-content',
                background: 'white',
                borderRadius: 16,
                border: '2px solid #1B5E3B',
                boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
                overflow: 'hidden',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {([
                {
                  id: 'all' as const,
                  label: 'Tudo',
                  icon: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={16} color={mapMode === 'all' ? 'white' : '#1B5E3B'} strokeWidth={2.5} />
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: mapMode === 'all' ? 'white' : '#0077B6', border: `2px solid ${mapMode === 'all' ? 'white' : '#0077B6'}` }} />
                    </div>
                  ),
                },
                {
                  id: 'locals' as const,
                  label: 'Locais',
                  icon: <MapPin size={16} color={mapMode === 'locals' ? 'white' : '#1B5E3B'} strokeWidth={2.5} />,
                },
                {
                  id: 'services' as const,
                  label: 'Serviços',
                  icon: <div style={{ width: 16, height: 16, borderRadius: '50%', background: mapMode === 'services' ? 'white' : '#0077B6', border: `2px solid ${mapMode === 'services' ? 'white' : '#0077B6'}` }} />,
                },
              ] as const).map((option) => {
                const active = mapMode === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => { setMapMode(option.id); setShowModeSelector(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 14px',
                      borderBottom: '1px solid #F0F0F0',
                      background: active ? '#1B5E3B' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    } as React.CSSProperties}
                  >
                    <div style={{ flexShrink: 0 }}>{option.icon}</div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: active ? 'white' : '#1A1A1A' }}>{option.label}</p>
                    {active && <Check size={14} color="white" strokeWidth={2.5} style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}

        {/* Province filter dropdown + categorias */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-2 bg-white rounded-2xl shadow-xl p-3 relative z-50"
            >
              {/* Categorias */}
              <p className="text-xs font-black mb-2" style={{ color: '#9CA3AF' }}>CATEGORIA</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                  style={{
                    background: !activeCategory ? '#1A1A1A' : 'white',
                    borderColor: !activeCategory ? '#1A1A1A' : '#E5E7EB',
                    color: !activeCategory ? 'white' : '#1A1A1A',
                  }}
                >
                  Todos
                </button>
                {categories.map(cat => {
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(active ? null : cat.id); setShowFilters(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                      style={{
                        background: active ? cat.color : 'white',
                        borderColor: active ? cat.color : '#E5E7EB',
                        color: active ? 'white' : '#1A1A1A',
                      }}
                    >
                      <CategoryIcon id={cat.id} size={12} color={active ? 'white' : cat.color} strokeWidth={2} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Divisor */}
              <div className="border-t mb-3" style={{ borderColor: '#F3F4F6' }} />

              {/* Províncias */}
              <p className="text-xs font-black mb-2" style={{ color: '#9CA3AF' }}>PROVÍNCIA</p>
              <div className="flex flex-wrap gap-2">
                {provincias.map(p => (
                  <button
                    key={p}
                    onClick={() => { setActiveProvincia(p); setShowFilters(false); }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                    style={{
                      background: activeProvincia === p ? '#1B5E3B' : 'white',
                      borderColor: activeProvincia === p ? '#1B5E3B' : '#E5E7EB',
                      color: activeProvincia === p ? 'white' : '#1A1A1A',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* -- MAP --------------------------------------------------------------- */}
      <div
        className="relative flex-1 mx-3 rounded-2xl overflow-hidden shadow-lg border-2"
        style={{ minHeight: 0, borderColor: 'rgba(27,94,59,0.2)' }}
      >
        <div ref={mapRef} className="absolute inset-0" />

        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-8 h-8 border-4 border-[#1B5E3B]/30 border-t-[#1B5E3B] rounded-full animate-spin" />
          </div>
        )}

        {/* Contador de pins */}
        {mapReady && (
          <div className="absolute top-3 left-3 z-10 bg-white/90 rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5">
            {pinsLoading ? (
              <><div className="w-3 h-3 border-2 border-[#1B5E3B]/30 border-t-[#1B5E3B] rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-400">A carregar...</span></>
            ) : (
              <><MapPin size={12} color="#1B5E3B" strokeWidth={2.5} />
              <span className="text-xs font-black" style={{ color: '#1B5E3B' }}>{filteredPins.length} lugar{filteredPins.length !== 1 ? 'es' : ''}</span></>
            )}
          </div>
        )}

        {/* Map controls � right side */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
          <button
            onClick={() => setSatelliteMode(!satelliteMode)}
            className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center"
            title={satelliteMode ? 'Vista de rua' : 'Vista sat�lite'}
          >
            <Layers size={18} color={satelliteMode ? '#1B5E3B' : '#6B7280'} strokeWidth={1.8} />
          </button>
        </div>

        {/* Route loading indicator */}
        {routeLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
            <span className="text-xs font-bold" style={{ color: '#2563EB' }}>A calcular rota�</span>
          </div>
        )}

        {/* Pin popup card removido � clique vai directamente para DestinationDetail */}
      </div>

      {/* -- NAVIGATION BUTTONS ------------------------------------------------ */}
      <div className="flex-shrink-0 flex gap-2 px-3 py-2">
        <button
          onClick={goToUserLocation}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 shadow-md text-xs font-bold border transition-all"
          style={{
            background: viewMode === 'nearby' ? '#1B5E3B' : 'white',
            color: viewMode === 'nearby' ? 'white' : '#1B5E3B',
            borderColor: '#1B5E3B',
          }}
        >
          <Navigation size={13} color={viewMode === 'nearby' ? 'white' : '#1B5E3B'} strokeWidth={2} />
          Perto de ti
        </button>
        <button
          onClick={goToMozambique}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 shadow-md text-xs font-bold border transition-all"
          style={{
            background: viewMode === 'country' ? '#1B5E3B' : 'white',
            color: viewMode === 'country' ? 'white' : '#6B7280',
            borderColor: viewMode === 'country' ? '#1B5E3B' : '#E5E7EB',
          }}
        >
          <MapPin size={13} color={viewMode === 'country' ? 'white' : '#6B7280'} strokeWidth={2} />
          Explorar o pa�s
        </button>
      </div>

      {/* -- BOTTOM SHEET ------------------------------------------------------ */}
      <div
        className="flex-shrink-0 rounded-t-3xl shadow-2xl overflow-y-auto"
        style={{ background: '#F2F2F7', maxHeight: '28vh' }}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="px-3 pb-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black" style={{ color: '#1A1A1A' }}>
              {activeCategory || activeProvincia !== 'Todas'
                ? `${filteredPins.length} resultado${filteredPins.length !== 1 ? 's' : ''}`
                : 'Explorar perto de ti'}
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {filteredPins.slice(0, 8).map((place, i) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 cursor-pointer"
                style={{ width: 115 }}
                onClick={() => {
                  if (routeShownForPin && routeShownForPin !== place.id) clearRoute();
                  setSelectedPin(place);
                  leafletMap.current?.setView([place.lat, place.lng], 14, { animate: true });
                }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ height: 85 }}>
                  <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                  <div
                    className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow"
                    style={{ background: place.color }}
                  >
                    <CategoryIcon id={place.category} size={13} color="white" strokeWidth={2} />
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedDetail(place); }}
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-white text-[10px] font-black"
                    style={{ background: 'rgba(27,94,59,0.85)' }}
                  >
                    Detalhes
                  </button>
                </div>
                <div className="pt-1.5">
                  <p className="text-xs font-black leading-tight truncate" style={{ color: '#1A1A1A' }}>
                    {place.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} fill="#FBBF24" stroke="none" />
                    <span className="text-[11px] font-bold" style={{ color: '#1A1A1A' }}>{place.rating}</span>
                    <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{place.dist}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
