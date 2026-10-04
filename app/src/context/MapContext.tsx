/**
 * MapContext — estado global escalável do mapa.
 *
 * Permite que qualquer parte da aplicação:
 *  1. Notifique o mapa que novos dados foram criados (post, local, serviço).
 *  2. Solicite um reload completo dos pins.
 *  3. Solicite zoom para um recurso específico.
 *
 * O Map.tsx subscreve este contexto e reage às notificações sem polling.
 * O WebSocket em AppContext.tsx chama `notifyMapReload()` quando um post é criado.
 */
import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MapResourceType = 'post' | 'local' | 'service';

interface MapZoomTarget {
  resourceType: MapResourceType;
  resourceId: string;
}

interface MapContextType {
  /**
   * Versão incremental — quando muda, o Map recarrega os pins.
   * Usar em vez de polling ou callbacks manuais.
   */
  mapDataVersion: number;

  /**
   * Recurso para o qual o mapa deve fazer zoom após o próximo reload.
   * Depois de consumido, o Map deve limpar via clearZoomTarget().
   */
  zoomTarget: MapZoomTarget | null;

  /**
   * Incrementa mapDataVersion → o Map recarrega os pins.
   * Chamar após criar/actualizar/eliminar um post, local ou serviço.
   */
  notifyMapReload: () => void;

  /**
   * Define o recurso para zoom + chama notifyMapReload() automaticamente.
   * Usar quando se cria um post com localização.
   */
  notifyNewResource: (type: MapResourceType, id: string) => void;

  /** Limpa o zoomTarget depois de o mapa o consumir. */
  clearZoomTarget: () => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

// Exportado para uso defensivo externo (ex: AppContext guard)
export const MapContext = createContext<MapContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mapDataVersion, setMapDataVersion] = useState(0);
  const [zoomTarget, setZoomTarget]         = useState<MapZoomTarget | null>(null);

  // Usar ref para versão interna — evita race conditions em callbacks
  const versionRef = useRef(0);

  const notifyMapReload = useCallback(() => {
    versionRef.current += 1;
    setMapDataVersion(versionRef.current);
  }, []);

  const notifyNewResource = useCallback((type: MapResourceType, id: string) => {
    setZoomTarget({ resourceType: type, resourceId: id });
    versionRef.current += 1;
    setMapDataVersion(versionRef.current);
  }, []);

  const clearZoomTarget = useCallback(() => {
    setZoomTarget(null);
  }, []);

  return (
    <MapContext.Provider value={{
      mapDataVersion,
      zoomTarget,
      notifyMapReload,
      notifyNewResource,
      clearZoomTarget,
    }}>
      {children}
    </MapContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMapContext(): MapContextType {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapContext must be used inside <MapProvider>');
  return ctx;
}
