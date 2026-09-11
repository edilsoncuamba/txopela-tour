/**
 * VALIDAÇÃO DE DADOS DA API
 *
 * Regras:
 * - Uma publicação é válida se tiver ID e nome/título.
 * - Imagens são OPCIONAIS. Publicações sem imagens recebem um placeholder
 *   em vez de serem descartadas.
 * - Os formatos de imagem devolvidos pela API são normalizados aqui, num
 *   único ponto, antes de qualquer outra parte do código os consumir.
 * - Nunca descartar uma publicação aprovada pela API só por falta de imagem.
 */

import {
  translateLocalCategory,
  translateServiceCategory,
  translatePostCategory,
  translateUserType,
  localCategoryColor,
} from './translations';

// ---------------------------------------------------------------------------
// Sistema de Badges Inteligentes
// ---------------------------------------------------------------------------

/**
 * Definição de cada badge — label, cor de fundo (bg), cor do texto.
 * Nunca reutilizar status administrativos (Aprovado, Verificado, Pendente…).
 */
export const BADGE_DEFS: Record<string, { label: string; bg: string; text: string }> = {
  imperdivel:   { label: 'Imperdível',  bg: '#7C3AED', text: '#fff' },
  popular:      { label: 'Popular',     bg: '#2563EB', text: '#fff' },
  favorito:     { label: 'Favorito',    bg: '#EF4444', text: '#fff' },
  destaque:     { label: 'Destaque',    bg: '#F97316', text: '#fff' },
  exclusivo:    { label: 'Exclusivo',   bg: '#EAB308', text: '#000' },
  autentico:    { label: 'Autêntico',   bg: '#16A34A', text: '#fff' },
  iconico:      { label: 'Icónico',     bg: '#1D4ED8', text: '#fff' },
  secreto:      { label: 'Secreto',     bg: '#6B7280', text: '#fff' },
  oculto:       { label: 'Oculto',      bg: '#1F2937', text: '#fff' },
  raro:         { label: 'Raro',        bg: '#6D28D9', text: '#fff' },
  unico:        { label: 'Único',       bg: '#B45309', text: '#fff' },
  novidade:     { label: 'Novidade',    bg: '#06B6D4', text: '#fff' },
  recomendado:  { label: 'Recomendado', bg: '#0F766E', text: '#fff' },
  // Serviços
  premium:      { label: 'Premium',     bg: '#92400E', text: '#fff' },
  especial:     { label: 'Especial',    bg: '#DB2777', text: '#fff' },
};

/**
 * Atribui um badge a um local turístico com base nos dados disponíveis.
 * Nunca devolve "Aprovado", "Verificado" ou outros estados administrativos.
 *
 * Ordem de prioridade:
 * 1. Imperdível  — rating ≥ 4.5 + reviews ≥ 20
 * 2. Popular     — reviews ≥ 15 ou views ≥ 200
 * 3. Favorito    — saves_count ≥ 10
 * 4. Destaque    — is_featured / featured
 * 5. Exclusivo   — categoria: luxury / unique / exclusive / glamping
 * 6. Icónico     — categoria: monument / historical / cultural / patrimonio
 * 7. Autêntico   — categoria: culture / tradition / indigenous / crafts
 * 8. Raro        — rating ≥ 4.0 mas reviews ≤ 5 (pouco conhecido mas bom)
 * 9. Secreto     — views < 30 e reviews < 3
 * 10. Oculto     — sem views, sem reviews, sem rating
 * 11. Novidade   — criado há ≤ 10 dias
 * 12. Recomendado — fallback
 */
export function assignLocalBadge(item: any): { badge: string; badgeBg: string } {
  const rating   = parseFloat(item.rating?.average ?? item.rating ?? 0) || 0;
  const reviews  = parseInt(item.rating?.count     ?? item.reviews  ?? 0, 10) || 0;
  const views    = parseInt(item.views_count        ?? item.views    ?? 0, 10) || 0;
  const saves    = parseInt(item.saves_count        ?? item.saved    ?? 0, 10) || 0;
  const featured = !!(item.is_featured || item.featured);
  const cat      = (item.category || '').toLowerCase();
  const createdAt = item.createdAt || item.created_at;
  const daysOld  = createdAt
    ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
    : 999;

  // 1. Imperdível
  if (rating >= 4.5 && reviews >= 20) return pick('imperdivel');
  // 2. Popular
  if (reviews >= 15 || views >= 200)   return pick('popular');
  // 3. Favorito
  if (saves >= 10)                     return pick('favorito');
  // 4. Destaque
  if (featured)                        return pick('destaque');
  // 5. Exclusivo
  if (/luxury|unique|exclusive|glamping|boutique/.test(cat)) return pick('exclusivo');
  // 6. Icónico
  if (/monument|histor|cultura|patrimonio|fort|castle/.test(cat)) return pick('iconico');
  // 7. Autêntico
  if (/culture|tradition|indigenous|craft|artisan|gastrono/.test(cat)) return pick('autentico');
  // 8. Raro — bom mas pouco visitado
  if (rating >= 4.0 && reviews > 0 && reviews <= 5) return pick('raro');
  // 9. Secreto — pouco visitado
  if (views < 30 && reviews < 3)       return pick('secreto');
  // 10. Oculto — nenhuma interação
  if (views === 0 && reviews === 0 && rating === 0) return pick('oculto');
  // 11. Novidade — recente (com prioridade apenas se não encaixar nos anteriores)
  if (daysOld <= 10)                   return pick('novidade');
  // 12. Fallback
  return pick('recomendado');
}

/**
 * Atribui um badge a um serviço turístico.
 *
 * Ordem de prioridade:
 * 1. Imperdível — rating ≥ 4.5 + reviews ≥ 20
 * 2. Popular    — reviews ≥ 15 ou views ≥ 200
 * 3. Favorito   — saves ≥ 10
 * 4. Premium    — categoria: luxury / premium / spa / boutique
 * 5. Destaque   — is_featured
 * 6. Autêntico  — categoria: culture / gastronomia / tradition
 * 7. Especial   — características únicas declaradas
 * 8. Novidade   — criado há ≤ 10 dias
 * 9. Recomendado — fallback
 */
export function assignServiceBadge(item: any): { badge: string; badgeBg: string } {
  const rating   = parseFloat(item.rating?.average ?? item.rating ?? 0) || 0;
  const reviews  = parseInt(item.rating?.count     ?? item.reviews  ?? 0, 10) || 0;
  const views    = parseInt(item.views_count        ?? item.views    ?? 0, 10) || 0;
  const saves    = parseInt(item.saves_count        ?? item.saved    ?? 0, 10) || 0;
  const featured = !!(item.is_featured || item.featured);
  const cat      = (item.category || '').toLowerCase();
  const createdAt = item.createdAt || item.created_at;
  const daysOld  = createdAt
    ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
    : 999;

  if (rating >= 4.5 && reviews >= 20) return pick('imperdivel');
  if (reviews >= 15 || views >= 200)   return pick('popular');
  if (saves >= 10)                     return pick('favorito');
  if (/luxury|premium|spa|boutique|vip/.test(cat)) return pick('premium');
  if (featured)                        return pick('destaque');
  if (/culture|gastro|tradition|artisan/.test(cat)) return pick('autentico');
  if (item.is_unique || item.unique)   return pick('especial');
  if (daysOld <= 10)                   return pick('novidade');
  return pick('recomendado');
}

/** Helper — extrai label e bg de BADGE_DEFS */
function pick(key: string): { badge: string; badgeBg: string } {
  const def = BADGE_DEFS[key] ?? BADGE_DEFS['recomendado'];
  return { badge: def.label, badgeBg: def.bg };
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolução de tipo de utilizador — ponto único de verdade
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converte o role raw da API para o tipo interno normalizado.
 * Devolve undefined quando o role está ausente — nunca inventa um valor.
 *
 * DIAGNÓSTICO: Se esta função receber undefined/null, significa que o backend
 * não está a incluir o campo role/type no objecto author/owner/provider.
 * Endpoint afectado deve ser corrigido para incluir o role do utilizador.
 * Todos os utilizadores têm role obrigatório na base de dados.
 */
export function resolveUserType(
  role: string | undefined | null,
  _context?: string,
): 'guide' | 'traveler' | 'resident' | 'business' | undefined {
  if (!role) return undefined;
  const r = role.toLowerCase();
  if (r === 'guide' || r === 'curator') return 'guide';
  if (r === 'business' || r === 'local_business') return 'business';
  if (r === 'resident' || r === 'local_resident') return 'resident';
  if (r === 'tourist' || r === 'traveler') return 'traveler';
  return undefined;
}

// ---------------------------------------------------------------------------
// Placeholder único para publicações sem imagem
// ---------------------------------------------------------------------------

/**
 * Gera um placeholder SVG inline que funciona sem rede e sem ficheiros
 * externos — evita qualquer pedido HTTP adicional.
 */
function buildPlaceholder(label: string): string {
  const encoded = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#E8EFF5"/>
      <rect x="150" y="100" width="100" height="70" rx="8" fill="#C5D5E2"/>
      <circle cx="175" cy="125" r="12" fill="#A0B8C8"/>
      <polygon points="155,165 185,135 200,150 220,130 245,165" fill="#A0B8C8"/>
      <text x="200" y="215" font-family="system-ui,sans-serif" font-size="14" fill="#6B8FA3" text-anchor="middle">${label}</text>
    </svg>`
  );
  return `data:image/svg+xml,${encoded}`;
}

export const PLACEHOLDER_IMAGE = buildPlaceholder('Sem imagem');

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ValidationResult<T> {
  isValid: boolean;
  data: T | null;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Normalização de imagens — ponto único de verdade
// ---------------------------------------------------------------------------

/**
 * Extrai URLs de imagens de qualquer formato que a API possa devolver:
 *   - `images: string[]`               <- Posts, Locals, Services (formato normal)
 *   - `images: {url: string}[]`        <- variante de objeto
 *   - `cover_image / coverImage`       <- campo único
 *   - `image / thumbnail`              <- campos alternativos
 *
 * Se a API devolver `images: []` (vazio), consulta o cache local criado no
 * momento do upload (`imageCache.ts`) para recuperar as URLs reais.
 *
 * Devolve sempre um array (pode ser vazio — nunca null/undefined).
 */
export function extractImages(item: any): string[] {
  if (!item || typeof item !== 'object') return [];

  const seen = new Set<string>();
  const result: string[] = [];

  const add = (raw: unknown): void => {
    if (!raw || typeof raw !== 'string') return;
    const url = raw.trim();
    if (!url) return;
    // Rejeitar apenas placeholders gerados pelo próprio frontend
    if (
      url.includes('/images/local-') ||
      url.includes('/images/service-') ||
      url.includes('placeholder.com') ||
      url.includes('via.placeholder')
    ) return;
    if (!seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  };

  const extractFromEntry = (entry: unknown): void => {
    if (typeof entry === 'string') { add(entry); return; }
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, unknown>;
      const val = (e.url ?? e.image ?? e.src ?? e.thumbnail) as string | undefined;
      add(val ?? null);
    }
  };

  // Prioridade 1: campo `images` (formato principal da API)
  if (Array.isArray(item.images)) item.images.forEach(extractFromEntry);

  // Prioridade 2: campos de array alternativos
  if (Array.isArray(item.gallery)) item.gallery.forEach(extractFromEntry);
  if (Array.isArray(item.photos))  item.photos.forEach(extractFromEntry);

  // Prioridade 3: campos de imagem única
  add(item.cover_image);
  add(item.coverImage);
  add(item.image);
  add(item.thumbnail);

  // Prioridade 4: montar URL completa se o campo for caminho relativo
  // Ex: /media/uploads/... → https://api-txopela-tour-3tdq.onrender.com/media/uploads/...
  const BASE_URL = (import.meta.env.VITE_API_URL as string || 'https://api-txopela-tour-3tdq.onrender.com')
    .replace(/\/api\/?$/, '');

  return result.map(url =>
    url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
  );
}

// ---------------------------------------------------------------------------
// Validação de publicação
// ---------------------------------------------------------------------------

/**
 * Valida se uma publicação tem os dados mínimos obrigatórios.
 * IMAGENS NÃO SÃO OBRIGATÓRIAS — publicações sem imagem recebem placeholder.
 * Só descarta quando não há ID ou nome/título.
 */
export function validatePublication(item: any): ValidationResult<any> {
  if (!item?.id) {
    return { isValid: false, data: null, errors: ['ID da publicação não encontrado'] };
  }
  if (!item.name && !item.title) {
    return { isValid: false, data: null, errors: [`Publicação ${item.id} não possui nome ou título`] };
  }
  return { isValid: true, data: item, errors: [] };
}

/**
 * Filtra apenas publicações válidas de um array.
 * Publicações sem imagem passam — receberão placeholder downstream.
 */
export function filterValidPublications<T>(items: any[]): T[] {
  if (!Array.isArray(items)) return [];
  return items
    .map(item => {
      const v = validatePublication(item);
      if (!v.isValid) {
        console.warn('[DATA VALIDATION]', v.errors.join(', '));
        return null;
      }
      return item as T;
    })
    .filter((item): item is T => item !== null);
}

// ---------------------------------------------------------------------------
// Mappers — convertem dados da API para o formato interno da aplicação
// ---------------------------------------------------------------------------

/**
 * Mapeia um local turístico da API para o formato interno.
 * Nunca devolve null por falta de imagem — usa placeholder.
 */
export function mapValidLocal(item: any): any | null {
  const v = validatePublication(item);
  if (!v.isValid) {
    console.warn('[INVALID LOCAL]', v.errors);
    return null;
  }

  const images = extractImages(item);
  const primaryImage = images[0] ?? PLACEHOLDER_IMAGE;

  const { badge, badgeBg } = assignLocalBadge(item);

  return {
    id: String(item.id),
    name: item.name || item.title,
    badge,
    badgeBg,
    rating: parseFloat(item.rating?.average ?? 0) || 0,
    reviews: item.rating?.count ?? 0,
    desc: item.description || '',
    tag: translateLocalCategory(item.category),
    tagBg: localCategoryColor(item.category),
    categoryKey: (item.category || '').toLowerCase(),   // chave original EN para filtros
    subcategory: item.subcategory || '',                // subcategoria original (ex: "Praia")
    image: primaryImage,
    images: images.length > 0 ? images : [PLACEHOLDER_IMAGE],
    // ── Localização ────────────────────────────────────────────────────────────
    // A API devolve 'municipality' para o Distrito (não 'district').
    // Lemos municipality como fonte primária de distrito; district como fallback.
    // administrative_post, locality e nearby_reference são enviados pelo utilizador
    // mas a API pode não os devolver na listagem (só no GET /id).
    provincia:          item.location?.province                                   ?? item.province           ?? '',
    distrito:           item.location?.municipality ?? item.location?.district    ?? item.municipality       ?? item.district ?? '',
    administrative_post:item.location?.administrative_post                         ?? item.administrative_post ?? '',
    locality:           item.location?.locality     ?? item.location?.city        ?? item.locality           ?? item.city ?? '',
    nearby_reference:   item.location?.nearby_reference                            ?? item.nearby_reference   ?? '',
    // address: o utilizador submete o gerado por buildFullAddress
    // Se vier endereço da API, usar — nunca gerar automaticamente aqui
    endereco:           item.location?.address                                    ?? item.address            ?? '',
    lat:                item.location?.latitude     ?? item.latitude              ?? null,
    lng:                item.location?.longitude    ?? item.longitude             ?? null,
    // Objecto location nested — preservado para fromApi() e DestinationDetail
    // Inclui municipality para que normalizeLocation o encontre
    location: item.location ? {
      country:            item.location.country             || 'Moçambique',
      province:           item.location.province            || '',
      municipality:       item.location.municipality        || '',
      district:           item.location.district            || item.location.municipality || '',
      administrative_post:item.location.administrative_post || '',
      locality:           item.location.locality            || item.location.city || '',
      nearby_reference:   item.location.nearby_reference    || '',
      address:            item.location.address             || '',
      latitude:           item.location.latitude            ?? undefined,
      longitude:          item.location.longitude           ?? undefined,
    } : undefined,
    melhorEpoca: item.bestSeason || item.best_season || '',
    destaques: Array.isArray(item.highlights) ? item.highlights : [],
    tipo: item.subcategory || '',
    phone: item.contact?.phone ?? item.phone ?? '',
    email: item.contact?.email ?? item.email ?? '',
    website: item.contact?.website ?? item.website ?? '',
    whatsapp: item.contact?.whatsapp ?? item.whatsapp ?? '',
    horario: item.hours ? JSON.stringify(item.hours) : '',
    priceRange: item.priceRange || item.price_range || '',
    contributor: item.owner
      ? (() => {
          const ownerType = resolveUserType(
            item.owner.role || item.owner.type,
            `local:${item.id} owner:${item.owner.id}`
          );
          return {
            id: String(item.owner.id || ''),
            name: item.owner.name || item.owner.username || 'Utilizador',
            avatar: item.owner.avatar || undefined,
            type: ownerType,
          };
        })()
      : undefined,
  };
}

/**
 * Mapeia um serviço da API para o formato interno.
 * Nunca devolve null por falta de imagem — usa placeholder.
 */
export function mapValidService(item: any): any | null {
  const v = validatePublication(item);
  if (!v.isValid) {
    console.warn('[INVALID SERVICE]', v.errors);
    return null;
  }

  const images = extractImages(item);
  const primaryImage = images[0] ?? PLACEHOLDER_IMAGE;

  const provider = item.provider ?? item.owner ?? item.author ?? item.created_by;
  let contributor: any = undefined;

  if (provider) {
    contributor = {
      id: String(provider.id || ''),
      name: provider.name || provider.username || 'Fornecedor',
      avatar: provider.avatar || undefined,
      type: resolveUserType(
        provider.role || provider.type,
        `service:${item.id} provider:${provider.id}`
      ),
    };
  }

  const { badge: svcBadge, badgeBg: svcBadgeBg } = assignServiceBadge(item);

  return {
    id: String(item.id),
    name: item.title || item.name,
    badge: svcBadge,
    badgeBg: svcBadgeBg,
    category: translateServiceCategory(item.category),
    categoryKey: item.category || 'experience',
    description: item.description || '',
    rating: parseFloat(item.rating?.average ?? 0) || 0,
    reviews: item.rating?.count ?? 0,
    image: primaryImage,
    images: images.length > 0 ? images : [PLACEHOLDER_IMAGE],
    // ── Localização ────────────────────────────────────────────────────────────
    // A API devolve 'municipality' para o Distrito e 'serviceArea' para o endereço.
    provincia:           item.location?.province                                    ?? '',
    distrito:            item.location?.municipality ?? item.location?.district     ?? '',
    administrative_post: item.location?.administrative_post                          ?? item.administrative_post ?? '',
    locality:            item.location?.locality     ?? item.location?.city         ?? '',
    nearby_reference:    item.location?.nearby_reference                             ?? item.nearby_reference    ?? '',
    // serviceArea é o campo de endereço nos serviços; address é fallback
    endereco:            item.location?.serviceArea  ?? item.location?.address      ?? '',
    lat:                 item.location?.latitude     ?? null,
    lng:                 item.location?.longitude    ?? null,
    // Objecto location nested — preservado para fromApi() e ServiceDetail
    location: item.location ? {
      country:            item.location.country             || 'Moçambique',
      province:           item.location.province            || '',
      municipality:       item.location.municipality        || '',
      district:           item.location.district            || item.location.municipality || '',
      administrative_post:item.location.administrative_post || '',
      locality:           item.location.locality            || item.location.city || '',
      nearby_reference:   item.location.nearby_reference    || '',
      address:            item.location.serviceArea         || item.location.address || '',
      latitude:           item.location.latitude            ?? undefined,
      longitude:          item.location.longitude           ?? undefined,
    } : undefined,
    telefone: item.contact?.phone ?? '',
    whatsapp: item.contact?.whatsapp ?? '',
    email: item.contact?.email ?? '',
    horario: item.availability?.schedule ?? 'Consultar',
    preco: item.pricing?.amount
      ? `${item.pricing.amount} ${item.pricing.currency || 'MZN'}`
      : '',
    contributor,
  };
}

/**
 * Mapeia um post da API para o formato interno.
 * Nunca devolve null por falta de imagem — usa placeholder.
 */
export function mapValidPost(item: any): any | null {
  const v = validatePublication(item);
  if (!v.isValid) {
    console.warn('[INVALID POST]', v.errors);
    return null;
  }

  const images = extractImages(item);
  const primaryImage = images[0] ?? PLACEHOLDER_IMAGE;

  // Normalizar todos os campos de localização — cobrir todos os formatos da API
  const loc = item.location || {};
  const province  = loc.province  || item.province  || item.provincia  || '';
  const district  = loc.district  || loc.municipality || item.district  || item.distrito  || '';
  const city      = loc.city      || loc.town        || item.city       || item.cidade     || '';
  const address   = loc.address   || item.address    || item.endereco   || '';
  const lat       = loc.latitude  ?? loc.lat  ?? item.latitude  ?? item.lat  ?? null;
  const lng       = loc.longitude ?? loc.lng  ?? item.longitude ?? item.lng  ?? null;

  return {
    id: String(item.id),
    author: {
      id: item.author?.id || undefined,
      name: item.author?.name || 'Utilizador',
      avatar: item.author?.avatar || undefined,
      type: resolveUserType(
        item.author?.role || item.author?.type,
        `post:${item.id} author:${item.author?.id}`
      ),
      typeLabel: translateUserType(item.author?.role || item.author?.type),
    },
    description: item.title || item.content || '',
    image: primaryImage,
    images: images.length > 0 ? images : [PLACEHOLDER_IMAGE],
    rating: parseFloat(item.rating?.average ?? item.rating ?? 0),
    reviews: item.rating?.count ?? item.stats?.likesCount ?? 0,
    // ── Localização completa ──────────────────────────────────────────
    province,
    district,
    city,
    address,
    provincia: province, // alias para compatibilidade
    distrito:  district, // alias para compatibilidade
    lat:  lat  !== null ? parseFloat(lat)  : undefined,
    lng:  lng  !== null ? parseFloat(lng)  : undefined,
    local_address: address,
    local_lat:  lat  !== null ? String(lat)  : undefined,
    local_lng:  lng  !== null ? String(lng)  : undefined,
    location: {
      latitude:  lat  !== null ? parseFloat(lat)  : undefined,
      longitude: lng  !== null ? parseFloat(lng)  : undefined,
      address,
      province,
      district,
      city,
      administrative_area: loc.administrative_area || '',
      locality:    loc.locality    || '',
      suburb:      loc.suburb      || '',
      nearby_reference: loc.nearby_reference || item.nearby_reference || '',
    },
    // ─────────────────────────────────────────────────────────────────
    badge: translatePostCategory(item.category),
    badgeKey: item.category || 'other',
    likes_count:    item.stats?.likesCount    ?? item.likes_count    ?? 0,
    comments_count: item.stats?.commentsCount ?? item.comments_count ?? 0,
    shares_count:   item.stats?.sharesCount   ?? item.shares_count   ?? 0,
    saves_count:    item.stats?.savesCount    ?? item.saves_count    ?? 0,
    is_liked:  item.userInteraction?.hasLiked ?? false,
    is_saved:  item.userInteraction?.hasSaved ?? false,
    created_at: item.createdAt || item.created_at || new Date().toISOString(),
  };
}
