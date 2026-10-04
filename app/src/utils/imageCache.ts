/**
 * imageCache — associa imagens a entidades.
 *
 * Contexto: a API devolve images:[] para locais e serviços mesmo após upload.
 * As URLs reais são obtidas via POST /api/upload/images/ e guardadas aqui.
 *
 * Cache de imagens usa localStorage (chave txopela_image_cache).
 * Isto NÃO é auth — é estado de aplicação persistente entre sessões.
 * Tokens JWT continuam em memória via tokenStore (sem localStorage).
 *
 * Upload via POST /api/upload/images/ (openapi-schema(3).yaml).
 */
import { tokenStore } from '@/services/tokenStore';

const CACHE_KEY  = 'txopela_image_cache';
const MAX_ENTRIES = 500;

type ImageCache = Record<string, string[]>;

function loadCache(): ImageCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: ImageCache): void {
  try {
    const keys = Object.keys(cache);
    if (keys.length > MAX_ENTRIES) {
      const trimmed: ImageCache = {};
      keys.slice(-MAX_ENTRIES).forEach(k => { trimmed[k] = cache[k]; });
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch { /* quota excedida */ }
}

/** Guarda URLs de imagens associadas a uma entidade */
export function cacheImages(entityId: string, urls: string[]): void {
  if (!entityId || !urls.length) return;
  const cache    = loadCache();
  const existing = cache[entityId] ?? [];
  const merged   = Array.from(new Set([...existing, ...urls]));
  cache[entityId] = merged;
  saveCache(cache);
}

/** Lê as URLs do cache para uma entidade */
export function getCachedImages(entityId: string): string[] {
  return loadCache()[entityId] ?? [];
}

/**
 * Resolve as imagens de um item da API.
 * Prioridade: imagens da API → cache → array vazio
 */
export function resolveImages(item: any): string[] {
  if (!item?.id) return [];

  const apiImages: string[] = [];

  if (Array.isArray(item.images)) {
    item.images.forEach((img: any) => {
      if (typeof img === 'string' && img.trim()) {
        apiImages.push(img.trim());
      } else if (img && typeof img === 'object') {
        const url = img.url ?? img.image ?? img.src ?? img.thumbnail;
        if (typeof url === 'string' && url.trim()) apiImages.push(url.trim());
      }
    });
  }

  const single = item.cover_image ?? item.coverImage ?? item.image ?? item.thumbnail;
  if (typeof single === 'string' && single.trim() && !single.includes('/images/local-')) {
    apiImages.push(single.trim());
  }

  if (apiImages.length > 0) return apiImages;

  return getCachedImages(String(item.id));
}

/**
 * POST /api/upload/images/
 * Faz upload de ficheiros e guarda no cache.
 * Retorna as URLs das imagens carregadas.
 */
export async function uploadAndCache(
  files: File[],
  entityId: string,
  context: 'local' | 'service' | 'post' | 'profile' | 'other',
): Promise<string[]> {
  if (!files.length) return [];

  const baseUrl = (import.meta.env.VITE_API_URL as string || '').replace(/\/api\/?$/, '');
  const token   = tokenStore.getAccess();

  const fd = new FormData();
  files.slice(0, 10).forEach(f => fd.append('files', f));
  fd.append('context', context);

  try {
    const res = await fetch(`${baseUrl}/api/upload/images/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd,
    });

    if (!res.ok) {
      console.warn('[imageCache] Upload falhou:', res.status);
      return [];
    }

    const raw     = await res.json();
    const payload = raw?.data ?? raw;
    const uploaded: any[] = payload?.images ?? (Array.isArray(payload) ? payload : []);

    const urls = uploaded
      .map((img: any) => (typeof img === 'string' ? img : img?.url ?? img?.thumbnail))
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);

    if (urls.length > 0) cacheImages(entityId, urls);

    return urls;
  } catch (err) {
    console.warn('[imageCache] Erro no upload:', err);
    return [];
  }
}
