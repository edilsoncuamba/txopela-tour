/**
 * imageCache — associa imagens a entidades localmente.
 *
 * O backend guarda as fotos em /media/uploads/ via POST /api/upload/images/
 * mas o campo `images` das entidades (locals, services, posts) fica vazio
 * porque o backend não os associa automaticamente.
 *
 * Este módulo:
 *  1. Faz o upload via /api/upload/images/ e obtém as URLs reais do servidor
 *  2. Guarda a associação { entityId → [url1, url2, ...] } no localStorage
 *  3. Expõe `resolveImages(item)` que funde as imagens da API com as do cache
 */

const CACHE_KEY = 'txopela_image_cache';
const MAX_ENTRIES = 500; // evitar crescimento ilimitado

type ImageCache = Record<string, string[]>; // entityId → urls

function loadCache(): ImageCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: ImageCache): void {
  try {
    // Limitar entradas para não encher o localStorage
    const keys = Object.keys(cache);
    if (keys.length > MAX_ENTRIES) {
      const trimmed: ImageCache = {};
      keys.slice(-MAX_ENTRIES).forEach(k => { trimmed[k] = cache[k]; });
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch { /* quota excedida — ignorar */ }
}

/** Guarda URLs de imagens associadas a uma entidade */
export function cacheImages(entityId: string, urls: string[]): void {
  if (!entityId || !urls.length) return;
  const cache = loadCache();
  const existing = cache[entityId] || [];
  // Deduplica mantendo ordem
  const merged = Array.from(new Set([...existing, ...urls]));
  cache[entityId] = merged;
  saveCache(cache);
}

/** Lê as URLs do cache para uma entidade */
export function getCachedImages(entityId: string): string[] {
  return loadCache()[entityId] || [];
}

/**
 * Resolve as imagens de um item da API.
 * Prioridade: imagens da API (se existirem) → cache local → array vazio
 * Aceita qualquer formato que a API possa devolver.
 */
export function resolveImages(item: any): string[] {
  if (!item?.id) return [];

  const apiImages: string[] = [];

  // Extrair URLs do campo `images` da API (string[] ou object[])
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

  // Campos alternativos de imagem única
  const single = item.cover_image ?? item.coverImage ?? item.image ?? item.thumbnail;
  if (typeof single === 'string' && single.trim() && !single.includes('/images/local-')) {
    apiImages.push(single.trim());
  }

  if (apiImages.length > 0) return apiImages;

  // Fallback: cache local
  return getCachedImages(String(item.id));
}

/**
 * Faz upload de ficheiros via /api/upload/images/ e guarda no cache.
 * Retorna as URLs das imagens carregadas.
 */
export async function uploadAndCache(
  files: File[],
  entityId: string,
  context: 'local' | 'service' | 'post' | 'profile' | 'other',
): Promise<string[]> {
  if (!files.length) return [];

  const baseUrl = (import.meta.env.VITE_API_URL as string || '').replace(/\/api\/?$/, '');
  const token = localStorage.getItem('access_token');

  const fd = new FormData();
  files.slice(0, 10).forEach(f => fd.append('files', f)); // campo: 'files'
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

    const raw = await res.json();
    // Envelope { status, code, data: { images: [...] } } ou directo
    const payload = raw?.data ?? raw;
    const uploaded: any[] = payload?.images ?? (Array.isArray(payload) ? payload : []);

    const urls = uploaded
      .map((img: any) => (typeof img === 'string' ? img : img?.url ?? img?.thumbnail))
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);

    if (urls.length > 0) {
      cacheImages(entityId, urls);
      console.log(`[imageCache] ✅ ${urls.length} imagem(ns) cached para ${entityId}:`, urls);
    }

    return urls;
  } catch (err) {
    console.warn('[imageCache] Erro no upload:', err);
    return [];
  }
}
