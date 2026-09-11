import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Map Marker Interface
 * Defines the structure for markers displayed on the map
 */
export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  type: 'destination' | 'service';
  icon?: string;
  popup?: {
    title: string;
    description?: string;
    image?: string;
    link?: string;
  };
}

/**
 * InteractiveMap Props
 */
export interface InteractiveMapProps {
  /** Center coordinates for the map */
  center: { lat: number; lng: number };
  /** Initial zoom level (default: 13) */
  zoom?: number;
  /** Array of markers to display on the map */
  markers: MapMarker[];
  /** Callback when a marker is clicked */
  onMarkerClick?: (marker: MapMarker) => void;
  /** Enable marker clustering for multiple markers (default: true) */
  clustering?: boolean;
  /** Map container height (default: '400px') */
  height?: string;
  /** Show map controls (zoom, attribution) (default: true) */
  showControls?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * InteractiveMap Component
 * 
 * A Leaflet-based interactive map component with the following features:
 * - Map initialization with custom center and zoom
 * - Custom marker rendering with different icons for destinations and services
 * - Marker clustering for better visualization of multiple markers
 * - Popup functionality showing marker details
 * - Graceful error handling and loading states
 * - Proper cleanup on unmount
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 * 
 * @example
 * ```tsx
 * <InteractiveMap
 *   center={{ lat: -25.9655, lng: 32.5832 }}
 *   zoom={12}
 *   markers={[
 *     {
 *       id: '1',
 *       position: { lat: -25.9655, lng: 32.5832 },
 *       type: 'destination',
 *       popup: {
 *         title: 'Maputo Central',
 *         description: 'Historic city center',
 *         link: '/destinos/maputo/1'
 *       }
 *     }
 *   ]}
 *   onMarkerClick={(marker) => console.log('Clicked:', marker)}
 *   clustering={true}
 * />
 * ```
 */
export default function InteractiveMap({
  center,
  zoom = 13,
  markers,
  onMarkerClick,
  clustering = true,
  height = '400px',
  showControls = true,
  className,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cssLoaded, setCssLoaded] = useState(false);

  /**
   * Load Leaflet CSS dynamically
   * Requirement 9.8: Load tiles asynchronously without blocking interface
   */
  useEffect(() => {
    // Check if CSS is already loaded
    if (document.querySelector('link[href*="leaflet.css"]')) {
      setCssLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCss.onload = () => setCssLoaded(true);
    leafletCss.onerror = () => {
      setError('Falha ao carregar estilos do mapa');
      setIsLoading(false);
    };
    document.head.appendChild(leafletCss);

    // Load MarkerCluster CSS if clustering is enabled
    if (clustering) {
      const clusterCss = document.createElement('link');
      clusterCss.rel = 'stylesheet';
      clusterCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
      document.head.appendChild(clusterCss);

      const clusterDefaultCss = document.createElement('link');
      clusterDefaultCss.rel = 'stylesheet';
      clusterDefaultCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
      document.head.appendChild(clusterDefaultCss);
    }
  }, [clustering]);

  /**
   * Initialize map
   * Requirement 9.1: Integrate Leaflet library
   * Requirement 9.2: Implement map initialization with center and zoom
   * Requirement 9.3: Allow zoom and pan
   */
  useEffect(() => {
    if (!cssLoaded || !mapContainerRef.current || mapRef.current) {
      return;
    }

    try {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: showControls,
        attributionControl: showControls,
      });

      // Add tile layer (OpenStreetMap)
      // Requirement 9.8: Load tiles asynchronously
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Erro ao inicializar o mapa. Por favor, tente novamente.');
      setIsLoading(false);
    }
  }, [cssLoaded, center.lat, center.lng, zoom, showControls]);

  /**
   * Update map center when center prop changes
   */
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center.lat, center.lng, zoom]);

  /**
   * Create custom icons for different marker types
   * Requirement 9.4: Display custom markers differentiating types
   */
  const createCustomIcon = (type: 'destination' | 'service', customIcon?: string): L.Icon => {
    if (customIcon) {
      return L.icon({
        iconUrl: customIcon,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    }

    // Default icons based on type
    const iconColors = {
      destination: '#0077B6', // Blue for destinations
      service: '#F4A261',     // Orange for services
    };

    const color = iconColors[type];
    
    // Create SVG icon
    const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    `;

    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  /**
   * Update markers on the map
   * Requirement 9.3: Add marker rendering with custom icons
   * Requirement 9.5: Display clickable markers with popups
   * Requirement 9.6: Display multiple destinations/services on same map
   * Requirement 9.7: Cluster markers when close together
   */
  useEffect(() => {
    if (!mapRef.current || isLoading) {
      return;
    }

    // Clear existing markers
    if (markerLayerRef.current) {
      mapRef.current.removeLayer(markerLayerRef.current);
    }

    // Create marker layer (with or without clustering)
    const markerLayer = clustering && markers.length > 1
      ? (L as any).markerClusterGroup({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
        })
      : L.layerGroup();

    // Add markers to layer
    markers.forEach((marker) => {
      try {
        const icon = createCustomIcon(marker.type, marker.icon);
        const leafletMarker = L.marker([marker.position.lat, marker.position.lng], { icon });

        // Add popup if popup data is available
        // Requirement 9.5: Display popup with information and link
        if (marker.popup && marker.popup.title) {
          const popupContent = createPopupContent(marker.popup);
          leafletMarker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup',
          });
        }

        // Add click handler
        if (onMarkerClick) {
          leafletMarker.on('click', () => {
            onMarkerClick(marker);
          });
        }

        markerLayer.addLayer(leafletMarker);
      } catch (err) {
        console.error(`Error adding marker ${marker.id}:`, err);
      }
    });

    // Add marker layer to map
    markerLayer.addTo(mapRef.current);
    markerLayerRef.current = markerLayer;

    // Fit bounds to show all markers if there are multiple markers
    if (markers.length > 1) {
      try {
        const group = new L.FeatureGroup(
          markers.map(m => L.marker([m.position.lat, m.position.lng]))
        );
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      } catch (err) {
        console.warn('Could not fit bounds for markers:', err);
      }
    }
  }, [markers, clustering, onMarkerClick, isLoading]);

  /**
   * Create popup content HTML
   * Requirement 9.5: Display popup with summary and link
   */
  const createPopupContent = (popup: NonNullable<MapMarker['popup']>): string => {
    return `
      <div class="map-popup-content" style="min-width: 200px;">
        ${popup.image ? `
          <img 
            src="${popup.image}" 
            alt="${popup.title}"
            style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"
            onerror="this.style.display='none'"
          />
        ` : ''}
        <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">
          ${popup.title}
        </h3>
        ${popup.description ? `
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.4;">
            ${popup.description}
          </p>
        ` : ''}
        ${popup.link ? `
          <a 
            href="${popup.link}" 
            style="display: inline-block; font-size: 14px; color: #0077B6; font-weight: 500; text-decoration: none; margin-top: 4px;"
            onmouseover="this.style.textDecoration='underline'"
            onmouseout="this.style.textDecoration='none'"
          >
            Ver detalhes →
          </a>
        ` : ''}
      </div>
    `;
  };

  /**
   * Cleanup on unmount
   * Requirement: Ensure proper cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (markerLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerLayerRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /**
   * Loading State
   * Requirement: Handle loading states
   */
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 rounded-lg',
          className
        )}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0077B6] animate-spin" />
          <p className="text-sm text-gray-600">A carregar mapa...</p>
        </div>
      </div>
    );
  }

  /**
   * Error State
   * Requirement: Handle map loading errors gracefully
   */
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-red-50 rounded-lg border border-red-200',
          className
        )}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700 mb-1">Erro ao carregar mapa</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              setCssLoaded(false);
            }}
            className="text-xs text-red-700 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  /**
   * Map Container
   */
  return (
    <div
      ref={mapContainerRef}
      className={cn('rounded-lg overflow-hidden shadow-md', className)}
      style={{ height }}
      role="region"
      aria-label="Mapa interativo"
    />
  );
}
