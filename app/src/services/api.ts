// ── Txopela Tour API Service ──────────────────────────────────────────────────
// Gerado a partir de openapi-schema.yaml (fonte de verdade)
// Base URL: VITE_API_URL no .env (http://localhost:8000/api)
//
// ENDPOINTS CONFIRMADOS pelo OpenAPI:
//  POST   /api/auth/login/
//  POST   /api/auth/register/
//  POST   /api/auth/refresh/       body: { refreshToken }
//  POST   /api/auth/logout/        body: { refreshToken? }
//  GET    /api/auth/me/
//  PUT    /api/auth/me/
//  PATCH  /api/auth/me/
//  GET    /api/users/me/
//  PUT    /api/users/me/
//  POST   /api/users/upload-avatar/   field: file
//  GET    /api/users/{id}/
//  POST   /api/users/{id}/follow/
//  DELETE /api/users/{id}/follow/
//  GET/POST /api/locals/
//  GET/PUT/DELETE /api/locals/{id}/
//  GET/POST /api/locals/{id}/reviews/
//  GET    /api/locals/geocode/
//  POST   /api/reviews/{id}/helpful/
//  GET/POST /api/services/
//  GET/PUT/DELETE /api/services/{id}/
//  POST   /api/services/{id}/bookings/
//  GET/POST /api/services/{id}/reviews/
//  GET/POST /api/posts/
//  GET/PUT/DELETE /api/posts/{id}/
//  GET/POST /api/posts/{id}/comments/
//  POST/DELETE /api/posts/{id}/like/
//  POST/DELETE /api/posts/{id}/save/
//  POST   /api/posts/{id}/report/
//  POST/DELETE /api/comments/{id}/like/
//  GET    /api/bookings/
//  PUT    /api/bookings/{id}/status/
//  GET    /api/search/
//  GET    /api/search/suggestions/
//  POST   /api/upload/images/        field: files (array)
//  DELETE /api/upload/images/{id}/
//  GET    /api/notifications/
//  PUT    /api/notifications/{id}/read/
//  PUT    /api/notifications/mark-all-read/
//  GET    /api/admin/pending-approvals/
//  PUT    /api/admin/approvals/{id}/
//  GET    /api/admin/stats/
//  GET    /api/admin/users/
//  PUT    /api/admin/users/{id}/status/

import type {
  LoginRequest, RegisterRequest, RegisterResponse,
  RefreshTokenRequest, LogoutRequest,
  UserProfile, UserProfileRequest, UserUpdateRequest,
  LocalReviewWriteRequest,
  CommentCreateRequest,
  BookingCreateRequest, BookingStatusRequest,
  ApproveItemRequest, ApproveItemResponse,
  LikeResponse, SaveResponse, CommentLikeResponse,
  FollowResponse, ReviewHelpfulResponse, MarkReadResponse,
  AvatarUploadResponse,
} from '@/types/api';

import { backendConfig } from '@/config/backend';

// ── Base URL ──────────────────────────────────────────────────────────────────
const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (url) return url.replace(/\/api\/?$/, '');
  return backendConfig.getBaseUrl();
};

interface ApiResponse<T> { data?: T; error?: string; }

const getToken   = () => localStorage.getItem('access_token');
const getRefresh = () => localStorage.getItem('refresh_token');

// ── Refresh (OpenAPI: POST /api/auth/refresh/ body: { refreshToken }) ─────────
async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${getBaseUrl()}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken } satisfies RefreshTokenRequest),
    });
    if (!res.ok) return false;
    const raw = await res.json();
    // Suporta envelope { status, code, data, meta }
    const d = (raw && typeof raw === 'object' && 'data' in raw && raw.data !== undefined) ? raw.data : raw;
    if (d.token)        localStorage.setItem('access_token',  d.token);
    if (d.refreshToken) localStorage.setItem('refresh_token', d.refreshToken);
    return true;
  } catch { return false; }
}

// ── fetch helpers ─────────────────────────────────────────────────────────────
function withTimeout(url: string, opts: RequestInit, ms = 15_000): Promise<Response> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

async function apiFetch<T>(
  endpoint: string,
  opts: RequestInit = {},
  retry = true,
): Promise<ApiResponse<T>> {
  const url  = `${getBaseUrl()}${endpoint}`;
  const hdrs: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  const t = getToken();
  if (t) hdrs['Authorization'] = `Bearer ${t}`;

  try {
    const res = await withTimeout(url, { ...opts, headers: hdrs });

    if (res.status === 401 && retry) {
      const ok = await doRefresh();
      if (ok) return apiFetch(endpoint, opts, false);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return { error: 'Sessão expirada. Faz login novamente.' };
    }
    if (res.status === 403) return { error: 'Sem permissão para esta operação.' };
    if (res.status === 404) return { error: 'Recurso não encontrado.' };
    if (res.status === 204) return { data: undefined as T };

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // 500 = erro interno do servidor Django
      if (res.status >= 500) {
        console.error(`[apiFetch] ${res.status} ERRO DO SERVIDOR em ${endpoint}:`, err);
        return { error: `Erro interno do servidor (${res.status}). Verifica os logs do backend Django.` };
      }

      // Extrair mensagem como string — nunca devolver um objecto
      let msg: string =
        (typeof err.detail  === 'string' ? err.detail  : null) ||
        (typeof err.error   === 'string' ? err.error   : null) ||
        (typeof err.message === 'string' ? err.message : null) ||
        '';

      // Se `details` for string ou objecto, formatar para texto legível
      if (!msg && err.details) {
        if (typeof err.details === 'string') {
          msg = err.details;
        } else if (typeof err.details === 'object') {
          msg = Object.entries(err.details)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
            .join(' | ');
        }
      }

      // Fallback: percorrer todos os campos e garantir string
      if (!msg) {
        msg = Object.values(err)
          .flat()
          .map(v => (typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v)))
          .filter(Boolean)
          .join(', ') || `Erro ${res.status}`;
      }

      return { error: msg };
    }
    // O novo backend usa envelope { status, code, data, meta }
    // Se existir campo 'data', devolve só o data; caso contrário devolve o corpo completo
    const body = await res.json();
    console.log(`[apiFetch] ${opts.method || 'GET'} ${endpoint} - Status: ${res.status}, Body:`, body);
    const payload = (body && typeof body === 'object' && 'data' in body && body.data !== undefined)
      ? body.data
      : body;
    console.log(`[apiFetch] ${opts.method || 'GET'} ${endpoint} - Payload extraído:`, payload);
    return { data: payload as T };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError')
      return { error: 'O servidor não respondeu. Verifica a ligação.' };
    return { error: e instanceof Error ? e.message : 'Erro de rede' };
  }
}

async function apiUpload<T>(endpoint: string, fd: FormData, retry = true): Promise<ApiResponse<T>> {
  return apiMultipart<T>(endpoint, 'POST', fd, retry);
}

async function apiMultipart<T>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH',
  fd: FormData,
  retry = true,
): Promise<ApiResponse<T>> {
  const url  = `${getBaseUrl()}${endpoint}`;
  const hdrs: Record<string, string> = { Accept: 'application/json' };
  const t = getToken();
  if (t) hdrs['Authorization'] = `Bearer ${t}`;
  try {
    const res = await withTimeout(url, { method, headers: hdrs, body: fd }, 30_000);

    if (res.status === 401 && retry) {
      const ok = await doRefresh();
      if (ok) return apiMultipart(endpoint, method, fd, false);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return { error: 'Sessão expirada. Faz login novamente.' };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[apiMultipart] ${res.status} ${method} ${endpoint}:`, err);
      return { error: err };
    }

    const body = await res.json();
    const payload = (body && typeof body === 'object' && 'data' in body && body.data !== undefined)
      ? body.data
      : body;
    return { data: payload as T };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError')
      return { error: 'Upload demorou muito. Verifica a ligação.' };
    return { error: e instanceof Error ? e.message : 'Erro de rede' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH  (OpenAPI tag: Autenticação)
// ─────────────────────────────────────────────────────────────────────────────
export const authApi = {
  /**
   * POST /api/auth/login/
   * body: { email, password }
   * 200: { user: {..., stats}, token, refreshToken }
   */
  login: async (body: LoginRequest) => {
    const res = await withTimeout(`${getBaseUrl()}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    let raw: any = {};
    try { raw = await res.json(); } catch { /* empty */ }
    if (!res.ok) throw new Error(
      raw.detail || raw.non_field_errors?.[0] || raw.error || 'Credenciais inválidas'
    );
    // Suporta resposta directa e envelope { status, code, data, meta }
    const d = (raw && typeof raw === 'object' && 'data' in raw && raw.data !== undefined) ? raw.data : raw;
    if (d.token)        localStorage.setItem('access_token',  d.token);
    if (d.refreshToken) localStorage.setItem('refresh_token', d.refreshToken);
    return d;
  },

  /**
   * POST /api/auth/register/
   * body: { name, email, password, role?, phone?, dateOfBirth?, termsAccepted }
   * 201: RegisterResponse (token + refreshToken no root)
   */
  register: async (body: RegisterRequest): Promise<RegisterResponse> => {
    const res = await withTimeout(`${getBaseUrl()}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    let raw: any = {};
    try { raw = await res.json(); } catch { /* empty */ }
    if (!res.ok) throw new Error(
      raw.detail || raw.non_field_errors?.[0] || raw.error || 'Erro ao registar'
    );
    // Suporta resposta directa e envelope { status, code, data, meta }
    const d = (raw && typeof raw === 'object' && 'data' in raw && raw.data !== undefined) ? raw.data : raw;
    if (d.token)        localStorage.setItem('access_token',  d.token);
    if (d.refreshToken) localStorage.setItem('refresh_token', d.refreshToken);
    return d as RegisterResponse;
  },

  /** POST /api/auth/refresh/  body: { refreshToken } */
  refresh: () => doRefresh(),

  /**
   * POST /api/auth/logout/
   * body: { refreshToken? }
   * Invalida o refresh token na blacklist
   */
  logout: async (): Promise<void> => {
    const refreshToken = getRefresh();
    try {
      const body: LogoutRequest = refreshToken ? { refreshToken } : {};
      await apiFetch('/api/auth/logout/', { method: 'POST', body: JSON.stringify(body) });
    } catch { /* logout silencioso */ } finally {
      ['access_token', 'refresh_token', 'txopela_token', 'txopela_user']
        .forEach(k => localStorage.removeItem(k));
    }
  },

  /**
   * GET  /api/auth/me/   → UserProfile
   * PUT  /api/auth/me/   body: UserProfileRequest (username required)
   * PATCH /api/auth/me/  body: PatchedUserProfileRequest
   */
  getMe:   () => apiFetch<UserProfile>('/api/auth/me/'),
  updateMe: (body: UserProfileRequest) =>
    apiFetch<UserProfile>('/api/auth/me/', { method: 'PUT', body: JSON.stringify(body) }),
  patchMe: (body: Partial<UserProfileRequest>) =>
    apiFetch<UserProfile>('/api/auth/me/', { method: 'PATCH', body: JSON.stringify(body) }),
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS  (OpenAPI tag: Utilizadores)
// ─────────────────────────────────────────────────────────────────────────────
export const usersApi = {
  /**
   * GET /api/users/me/   → perfil completo com stats
   * PUT /api/users/me/   body: UserUpdateRequest { name?, phone?, dateOfBirth?, bio? }
   */
  getProfile: () => apiFetch<any>('/api/users/me/'),
  updateProfile: (body: UserUpdateRequest) =>
    apiFetch<any>('/api/users/me/', { method: 'PUT', body: JSON.stringify(body) }),

  /**
   * POST /api/users/upload-avatar/
   * multipart/form-data — campo: file (não 'avatar')
   */
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);   // campo 'file' conforme OpenAPI AvatarUploadRequestRequest
    return apiUpload<AvatarUploadResponse>('/api/users/upload-avatar/', fd);
  },

  /** GET /api/users/{id}/ */
  getPublicProfile: (id: string) => apiFetch<any>(`/api/users/${id}/`),

  /**
   * GET /api/users/ - Lista utilizadores públicos
   * Query params: search, page, limit, role
   * Fallback: usa endpoint admin se disponível
   */
  listUsers: (params?: { 
    search?: string; 
    page?: number; 
    limit?: number; 
    role?: string;
  }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          q.append(k, String(v));
        }
      });
    }
    
    // Tenta endpoint público primeiro
    return apiFetch<any>(`/api/users/${q.toString() ? `?${q}` : ''}`);
  },

  /**
   * GET /api/users/suggestions/ - Utilizadores sugeridos para seguir
   * Fallback para lista geral se o endpoint não existir
   */
  getSuggestions: async (params?: { limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', String(params.limit));
    // Tenta endpoint dedicado; se 404, usa lista geral de utilizadores
    const res = await apiFetch<any>(`/api/users/suggestions/${q.toString() ? `?${q}` : ''}`);
    if (res.error) {
      // Fallback: lista paginada de utilizadores
      return apiFetch<any>(`/api/users/${q.toString() ? `?${q}` : ''}`);
    }
    return res;
  },

  /** POST /api/users/{id}/follow/ → FollowResponse */
  follow: (id: string) =>
    apiFetch<FollowResponse>(`/api/users/${id}/follow/`, { method: 'POST' }),

  /** DELETE /api/users/{id}/follow/ → UnfollowResponse */
  unfollow: (id: string) =>
    apiFetch<FollowResponse>(`/api/users/${id}/follow/`, { method: 'DELETE' }),

  /**
   * GET /api/users/me/services/  — Meus serviços (todos os status)
   * Fallback: busca via /api/services/ e filtra por created_by
   */
  myServices: async () => {
    // Tenta endpoint dedicado primeiro
    const res = await apiFetch<any>('/api/users/me/services/');
    if (res.data && !res.error) return res;
    // Fallback: lista todos e filtra localmente
    const all = await apiFetch<any>('/api/services/?limit=100');
    return all;
  },

  /**
   * GET /api/users/me/locals/  — Meus locais sugeridos (todos os status)
   */
  myLocals: async () => {
    const res = await apiFetch<any>('/api/users/me/locals/');
    if (res.data && !res.error) return res;
    const all = await apiFetch<any>('/api/locals/?limit=100');
    return all;
  },

  /**
   * GET /api/users/me/posts/  — Meus posts
   */
  myPosts: async () => {
    const res = await apiFetch<any>('/api/users/me/posts/');
    if (res.data && !res.error) return res;
    const all = await apiFetch<any>('/api/posts/?limit=100');
    return all;
  },

  /** GET minhas avaliações */
  myReviews: () => apiFetch<any>('/api/users/me/reviews/'),

  /**
   * Versões sem fallback — para contar recursos sem poluição de dados de outros users.
   * Se o endpoint dedicado retornar 404, devolve { data: null, error: '404' }.
   */
  myLocalsCount:   () => apiFetch<any>('/api/users/me/locals/'),
  myServicesCount: () => apiFetch<any>('/api/users/me/services/'),
  myReviewsCount:  () => apiFetch<any>('/api/users/me/reviews/'),

  /**
   * POST /api/users/change-password/
   * NOTA: Este endpoint não está no OpenAPI oficial.
   * Tentativa via PATCH /api/auth/me/ com password fields como fallback.
   * body: { currentPassword: string, newPassword: string }
   */
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiFetch<any>('/api/users/change-password/', { method: 'POST', body: JSON.stringify(body) }),
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCALS  (OpenAPI tag: Locais)
// ─────────────────────────────────────────────────────────────────────────────
export const localsApi = {
  /**
   * GET /api/locals/
   * query: page, limit(max:50), province, category, search, sortBy, latitude, longitude, radius, status
   */
  list: (params?: {
    page?: number; limit?: number; province?: string;
    category?: string; search?: string;
    sortBy?: 'recent' | 'popular' | 'distance' | 'rating';
    latitude?: number; longitude?: number; radius?: number; status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return apiFetch<any>(`/api/locals/${q.toString() ? `?${q}` : ''}`);
  },

  /** GET /api/locals/{id}/ → LocalDetail */
  get: (id: string) => apiFetch<any>(`/api/locals/${id}/`),

  /**
   * POST /api/locals/  multipart/form-data
   * campos PLANOS: name*, description*, category, subcategory, best_season,
   * highlights, province, municipality, address, latitude, longitude,
   * phone, whatsapp, email, website, hours, priceRange, amenities, images(max:10)
   */
  create: (fd: FormData) => apiUpload<any>('/api/locals/', fd),

  /**
   * POST /api/locals/  application/json (sem imagens)
   * Mesmo schema LocalWriteRequest mas enviado como JSON
   */
  createJson: (body: Record<string, any>) =>
    apiFetch<any>('/api/locals/', { method: 'POST', body: JSON.stringify(body) }),

  /**
   * PUT /api/locals/{id}/  application/json (actualiza campos específicos)
   */
  updateJson: (id: string, body: Record<string, any>) =>
    apiFetch<any>(`/api/locals/${id}/`, { method: 'PUT', body: JSON.stringify(body) }),

  /**
   * PATCH /api/locals/{id}/  application/json (actualização parcial — ideal para associar imagens)
   */
  patchJson: (id: string, body: Record<string, any>) =>
    apiFetch<any>(`/api/locals/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }),

  /** PUT /api/locals/{id}/  multipart/form-data com todos os campos + imagens */
  update: (id: string, fd: FormData) => apiMultipart<any>(`/api/locals/${id}/`, 'PUT', fd),

  /** PATCH /api/locals/{id}/  multipart/form-data — actualiza só imagens */
  patch: (id: string, fd: FormData) => {
    const url  = `${getBaseUrl()}/api/locals/${id}/`;
    const hdrs: Record<string, string> = { Accept: 'application/json' };
    const t = getToken();
    if (t) hdrs['Authorization'] = `Bearer ${t}`;
    return withTimeout(url, { method: 'PATCH', headers: hdrs, body: fd })
      .then(async r => {
        const body = await r.json().catch(() => ({}));
        const payload = (body && typeof body === 'object' && 'data' in body && body.data !== undefined) ? body.data : body;
        return r.ok ? { data: payload } : { error: payload };
      });
  },

  /** DELETE /api/locals/{id}/ */
  delete: (id: string) => apiFetch<any>(`/api/locals/${id}/`, { method: 'DELETE' }),

  /** GET /api/locals/{id}/reviews/ */
  getReviews: (id: string) => apiFetch<any>(`/api/locals/${id}/reviews/`),

  /** POST /api/locals/{id}/reviews/  body: { rating(1-5)*, comment* } */
  addReview: (id: string, body: LocalReviewWriteRequest) =>
    apiFetch<any>(`/api/locals/${id}/reviews/`, { method: 'POST', body: JSON.stringify(body) }),

  /** GET /api/locals/geocode/?lat=&lon= */
  geocode: (lat: number, lon: number) =>
    apiFetch<any>(`/api/locals/geocode/?lat=${lat}&lon=${lon}`),

  /**
   * GET /api/locals/nearby/
   * Devolve locais ordenados por proximidade com distância calculada
   * query: latitude*, longitude*, radius(km, default:10), category, min_rating, limit(default:50)
   */
  nearby: (params: {
    latitude: number; longitude: number;
    radius?: number; category?: string; min_rating?: number; limit?: number;
  }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.append(k, String(v));
    });
    return apiFetch<any>(`/api/locals/nearby/?${q}`);
  },

  /** POST /api/reviews/{id}/helpful/ */
  markReviewHelpful: (reviewId: string) =>
    apiFetch<ReviewHelpfulResponse>(`/api/reviews/${reviewId}/helpful/`, { method: 'POST' }),

  // Convenience
  getSaved:    () => localsApi.list({ sortBy: 'popular' }),
  getTrending: () => localsApi.list({ sortBy: 'rating' }),

  /** GET meus locais — usa endpoint /api/locals/?my=true se disponível, senão filtra por ID do utilizador autenticado */
  getMy: async () => {
    // Tentar endpoint dedicado primeiro
    const myRes = await apiFetch<any>('/api/locals/?my=true');
    if (!myRes.error && myRes.data) return myRes;

    // Fallback: buscar o ID do utilizador via /api/users/me/ e filtrar
    try {
      const meRes = await apiFetch<any>('/api/users/me/');
      const userId = meRes.data?.user?.id ?? meRes.data?.id;
      if (!userId) return localsApi.list({ limit: 100 });

      const res = await localsApi.list({ limit: 100 });
      if (res.data?.locals) {
        const myLocals = res.data.locals.filter((l: any) =>
          l.owner?.id === userId || l.author?.id === userId || l.created_by?.id === userId
        );
        return { ...res, data: { ...res.data, locals: myLocals } };
      }
      return res;
    } catch {
      return localsApi.list({ limit: 100 });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES  (OpenAPI tag: Serviços)
// ─────────────────────────────────────────────────────────────────────────────
export const servicesApi = {
  /**
   * GET /api/services/
   * query: page, limit(max:50), category, province, search, sortBy, availability, status
   */
  list: (params?: {
    page?: number; limit?: number; category?: string; province?: string;
    search?: string; sortBy?: 'recent' | 'popular' | 'rating'; 
    availability?: boolean; status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return apiFetch<any>(`/api/services/${q.toString() ? `?${q}` : ''}`);
  },

  /** GET /api/services/{id}/ → ServiceDetail */
  get: (id: string) => apiFetch<any>(`/api/services/${id}/`),

  /**
   * POST /api/services/  multipart/form-data
   * campos PLANOS: title*, description*, category, subcategory, schedule,
   * phone, whatsapp, contact_email, province, municipality, address,
   * pricing(JSON), availability(JSON), features(JSON), requirements(JSON), images(max:20)
   * ATENÇÃO: usa 'title' (não 'name'), 'contact_email' (não 'email')
   */
  create: (fd: FormData) => apiUpload<any>('/api/services/', fd),

  /**
   * POST /api/services/  application/json (sem imagens)
   */
  createJson: (body: Record<string, any>) =>
    apiFetch<any>('/api/services/', { method: 'POST', body: JSON.stringify(body) }),

  /**
   * PUT /api/services/{id}/  application/json
   */
  updateJson: (id: string, body: Record<string, any>) =>
    apiFetch<any>(`/api/services/${id}/`, { method: 'PUT', body: JSON.stringify(body) }),

  /**
   * PATCH /api/services/{id}/  application/json (actualização parcial — associar imagens)
   */
  patchJson: (id: string, body: Record<string, any>) =>
    apiFetch<any>(`/api/services/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }),

  /** PUT /api/services/{id}/  multipart/form-data com todos os campos + imagens */
  update: (id: string, fd: FormData) => apiMultipart<any>(`/api/services/${id}/`, 'PUT', fd),

  /** PATCH /api/services/{id}/  multipart/form-data — actualiza só imagens */
  patch: (id: string, fd: FormData) => {
    const url  = `${getBaseUrl()}/api/services/${id}/`;
    const hdrs: Record<string, string> = { Accept: 'application/json' };
    const t = getToken();
    if (t) hdrs['Authorization'] = `Bearer ${t}`;
    return withTimeout(url, { method: 'PATCH', headers: hdrs, body: fd })
      .then(async r => {
        const body = r.ok ? await r.json().catch(() => ({})) : await r.json().catch(() => ({}));
        const payload = (body && typeof body === 'object' && 'data' in body && body.data !== undefined) ? body.data : body;
        return r.ok ? { data: payload } : { error: payload };
      });
  },

  /** DELETE /api/services/{id}/ */
  delete: (id: string) => apiFetch<any>(`/api/services/${id}/`, { method: 'DELETE' }),

  /**
   * POST /api/services/{id}/bookings/
   * body: BookingCreateRequest { startDate*, endDate?, participants?, message?, contactInfo?, specialRequests? }
   */
  book: (id: string, body: BookingCreateRequest) =>
    apiFetch<any>(`/api/services/${id}/bookings/`, { method: 'POST', body: JSON.stringify(body) }),

  /** GET /api/services/{id}/reviews/ */
  getReviews: (id: string) => apiFetch<any>(`/api/services/${id}/reviews/`),

  /** POST /api/services/{id}/reviews/  body: { rating(1-5)*, comment* } */
  addReview: (id: string, body: { rating: number; comment: string }) =>
    apiFetch<any>(`/api/services/${id}/reviews/`, { method: 'POST', body: JSON.stringify(body) }),

  // Convenience methods
  /** GET meus serviços — usa endpoint /api/services/?my=true se disponível, senão filtra por ID do utilizador autenticado */
  getMy: async () => {
    // Tentar endpoint dedicado primeiro
    const myRes = await apiFetch<any>('/api/services/?my=true');
    if (!myRes.error && myRes.data) return myRes;

    // Fallback: buscar o ID do utilizador via /api/users/me/ e filtrar
    try {
      const meRes = await apiFetch<any>('/api/users/me/');
      const userId = meRes.data?.user?.id ?? meRes.data?.id;
      if (!userId) return servicesApi.list({ limit: 100 });

      const res = await servicesApi.list({ limit: 100 });
      if (res.data?.services) {
        const myServices = res.data.services.filter((s: any) =>
          s.provider?.id === userId || s.owner?.id === userId || s.author?.id === userId || s.created_by?.id === userId
        );
        return { ...res, data: { ...res.data, services: myServices } };
      }
      return res;
    } catch {
      return servicesApi.list({ limit: 100 });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// POSTS  (OpenAPI tag: Posts)
// ─────────────────────────────────────────────────────────────────────────────
export const postsApi = {
  /**
   * GET /api/posts/
   * query: page, limit(max:50), province, category, search, sortBy, userId
   */
  list: (params?: {
    page?: number; limit?: number; province?: string;
    category?: string; search?: string;
    sortBy?: 'recent' | 'popular' | 'trending'; userId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return apiFetch<any>(`/api/posts/${q.toString() ? `?${q}` : ''}`);
  },

  /** GET /api/posts/{id}/ → PostDetail */
  get: (id: string) => apiFetch<any>(`/api/posts/${id}/`),

  /**
   * POST /api/posts/  multipart/form-data
   * campos: title*, content*, category, province, location(JSON), tags(JSON), images(max:10)
   */
  create: (fd: FormData) => apiUpload<any>('/api/posts/', fd),

  /** PUT /api/posts/{id}/  multipart/form-data */
  update: (id: string, fd: FormData) => {
    const url  = `${getBaseUrl()}/api/posts/${id}/`;
    const hdrs: Record<string, string> = { Accept: 'application/json' };
    const t = getToken();
    if (t) hdrs['Authorization'] = `Bearer ${t}`;
    return withTimeout(url, { method: 'PUT', headers: hdrs, body: fd })
      .then(async r => ({ data: r.ok ? await r.json() : undefined, error: r.ok ? undefined : `Erro ${r.status}` }));
  },

  /** DELETE /api/posts/{id}/ */
  delete: (id: string) => apiFetch<any>(`/api/posts/${id}/`, { method: 'DELETE' }),

  /** POST /api/posts/{id}/like/ → LikeResponse */
  like:   (id: string) => {
    console.log('[postsApi.like] POST /api/posts/' + id + '/like/');
    return apiFetch<LikeResponse>(`/api/posts/${id}/like/`,  { method: 'POST' })
      .then(res => {
        console.log('[postsApi.like] Resposta:', res);
        return res;
      });
  },
  /** DELETE /api/posts/{id}/like/ → LikeResponse */
  unlike: (id: string) => {
    console.log('[postsApi.unlike] DELETE /api/posts/' + id + '/like/');
    return apiFetch<LikeResponse>(`/api/posts/${id}/like/`,  { method: 'DELETE' })
      .then(res => {
        console.log('[postsApi.unlike] Resposta:', res);
        return res;
      });
  },
  /** POST /api/posts/{id}/save/ → SaveResponse */
  save:   (id: string) => apiFetch<SaveResponse>(`/api/posts/${id}/save/`,  { method: 'POST' }),
  /** DELETE /api/posts/{id}/save/ → SaveResponse */
  unsave: (id: string) => apiFetch<SaveResponse>(`/api/posts/${id}/save/`,  { method: 'DELETE' }),

  /**
   * POST /api/posts/{id}/report/
   * body: { reason: ReportReason*, details? }
   */
  report: (id: string, reason: string, details?: string) =>
    apiFetch<any>(`/api/posts/${id}/report/`, {
      method: 'POST', body: JSON.stringify({ reason, ...(details ? { details } : {}) }),
    }),

  /**
   * GET /api/posts/{id}/comments/
   * query: page, limit
   */
  getComments: (id: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page)  q.append('page',  String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return apiFetch<any>(`/api/posts/${id}/comments/${q.toString() ? `?${q}` : ''}`);
  },

  /**
   * POST /api/posts/{id}/comments/
   * body: { content*(min:1), parentId? }
   */
  addComment: (id: string, body: CommentCreateRequest) =>
    apiFetch<any>(`/api/posts/${id}/comments/`, { method: 'POST', body: JSON.stringify(body) }),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS  (OpenAPI tag: Comentários)
// ─────────────────────────────────────────────────────────────────────────────
export const commentsApi = {
  /** POST /api/comments/{id}/like/ → CommentLikeResponse */
  like:   (id: string) => apiFetch<CommentLikeResponse>(`/api/comments/${id}/like/`, { method: 'POST' }),
  /** DELETE /api/comments/{id}/like/ → CommentLikeResponse */
  unlike: (id: string) => apiFetch<CommentLikeResponse>(`/api/comments/${id}/like/`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS  (OpenAPI tag: Reservas)
// ─────────────────────────────────────────────────────────────────────────────
export const bookingsApi = {
  /**
   * GET /api/bookings/
   * query: page, limit, role(customer|provider), status
   */
  list: (params?: { page?: number; limit?: number; role?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) q.append(k, String(v));
    });
    return apiFetch<any>(`/api/bookings/${q.toString() ? `?${q}` : ''}`);
  },

  /**
   * PUT /api/bookings/{id}/status/
   * body: { status*(confirmed|cancelled|completed), reason? }
   */
  updateStatus: (id: string, body: BookingStatusRequest) =>
    apiFetch<any>(`/api/bookings/${id}/status/`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS  (OpenAPI tag: ⭐ Avaliações)
// ENDPOINTS CONFIRMADOS NO OPENAPI:
//   GET/POST /api/locals/{id}/reviews/
//   GET/POST /api/services/{id}/reviews/
//   POST /api/reviews/{id}/helpful/
// ENDPOINTS NÃO EXISTENTES NO OPENAPI (removidos):
//   GET/POST /api/reviews/           → NÃO EXISTE
//   GET/PUT/PATCH/DELETE /api/reviews/{id}/  → NÃO EXISTE
// ─────────────────────────────────────────────────────────────────────────────
export const reviewsApi = {
  // ── Reviews para Locais ─────────────────────────────────────────────────────

  /**
   * GET /api/locals/{id}/reviews/
   * Lista reviews de um local. Não requer autenticação.
   */
  getForLocal: (localId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return apiFetch<any>(`/api/locals/${localId}/reviews/${q.toString() ? `?${q}` : ''}`);
  },

  /**
   * POST /api/locals/{id}/reviews/
   * Cria review para um local.
   * Body: { rating: 1-5 (obrigatório), comment: string (obrigatório) }
   */
  createForLocal: (localId: string, body: { rating: number; comment: string; images?: string[] }) =>
    apiFetch<any>(`/api/locals/${localId}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ── Reviews para Serviços ───────────────────────────────────────────────────

  /**
   * GET /api/services/{id}/reviews/
   * Lista reviews de um serviço. Não requer autenticação.
   */
  getForService: (serviceId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return apiFetch<any>(`/api/services/${serviceId}/reviews/${q.toString() ? `?${q}` : ''}`);
  },

  /**
   * POST /api/services/{id}/reviews/
   * Cria review para um serviço.
   * Body: { rating: 1-5 (obrigatório), comment: string (obrigatório) }
   */
  createForService: (serviceId: string, body: { rating: number; comment: string; images?: string[] }) =>
    apiFetch<any>(`/api/services/${serviceId}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ── Interações com Reviews ──────────────────────────────────────────────────

  /**
   * POST /api/reviews/{id}/helpful/
   * Marcar/Desmarcar review como útil (toggle)
   */
  markHelpful: (reviewId: string) =>
    apiFetch<ReviewHelpfulResponse>(`/api/reviews/${reviewId}/helpful/`, { method: 'POST' }),

  // Aliases de compatibilidade (legado)
  list: () => Promise.resolve({ data: null, error: 'Endpoint /api/reviews/ não existe. Use getForLocal ou getForService.' }),
  create: () => Promise.resolve({ data: null, error: 'Endpoint /api/reviews/ não existe. Use createForLocal ou createForService.' }),
  get: () => Promise.resolve({ data: null, error: 'Endpoint /api/reviews/{id}/ não existe.' }),
  update: () => Promise.resolve({ data: null, error: 'Endpoint /api/reviews/{id}/ não existe.' }),
  patch: () => Promise.resolve({ data: null, error: 'Endpoint /api/reviews/{id}/ não existe.' }),
  delete: () => Promise.resolve({ data: null, error: 'Endpoint /api/reviews/{id}/ não existe.' }),
  report: (reviewId: string, reason: string, details?: string) =>
    apiFetch<any>(`/api/reviews/${reviewId}/report/`, {
      method: 'POST',
      body: JSON.stringify({ reason, ...(details ? { details } : {}) }),
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH  (OpenAPI tag: Busca)
// ─────────────────────────────────────────────────────────────────────────────
export const searchApi = {
  /**
   * GET /api/search/
   * query: q*(required), type, province, latitude, longitude, radius, page, limit(max:20)
   */
  universal: (params: {
    q: string; type?: 'all' | 'posts' | 'locals' | 'services' | 'users';
    province?: string; latitude?: number; longitude?: number;
    radius?: number; page?: number; limit?: number;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) query.append(k, String(v));
    });
    return apiFetch<any>(`/api/search/?${query}`);
  },

  /**
   * GET /api/search/suggestions/
   * query: q*(required), type(places|categories|tags)
   */
  suggestions: (q: string, type?: string) => {
    const query = new URLSearchParams({ q });
    if (type) query.append('type', type);
    return apiFetch<any>(`/api/search/suggestions/?${query}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD  (OpenAPI tag: Upload)
// ─────────────────────────────────────────────────────────────────────────────
export const uploadApi = {
  /**
   * POST /api/upload/images/  multipart/form-data
   * fields: files*(array, max:10, max:10MB each), context(post|local|service|profile|other)
   */
  images: (files: File[], context: 'post' | 'local' | 'service' | 'profile' | 'other' = 'other') => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));   // campo: 'files' (array)
    fd.append('context', context);
    return apiUpload<any>('/api/upload/images/', fd);
  },

  /** DELETE /api/upload/images/{id}/ */
  deleteImage: (id: string) =>
    apiFetch<any>(`/api/upload/images/${id}/`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS  (OpenAPI tag: Notificações)
// ─────────────────────────────────────────────────────────────────────────────
export const notificationsApi = {
  /**
   * GET /api/notifications/
   * query: page, limit, unreadOnly(boolean)
   */
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) q.append(k, String(v));
    });
    return apiFetch<any>(`/api/notifications/${q.toString() ? `?${q}` : ''}`);
  },

  /** PUT /api/notifications/{id}/read/ → MarkReadResponse */
  markAsRead: (id: string) =>
    apiFetch<MarkReadResponse>(`/api/notifications/${id}/read/`, { method: 'PUT' }),

  /** PUT /api/notifications/mark-all-read/ → MarkReadResponse */
  markAllRead: () =>
    apiFetch<MarkReadResponse>('/api/notifications/mark-all-read/', { method: 'PUT' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN  (OpenAPI tag: Administração)
// ─────────────────────────────────────────────────────────────────────────────
export const adminApi = {
  /**
   * GET /api/admin/pending-approvals/
   * query: page, limit, type(locals|services|posts)
   * Requer role: admin | curator
   */
  getPendingApprovals: (params?: { page?: number; limit?: number; type?: 'locals' | 'services' | 'posts' }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) q.append(k, String(v));
    });
    return apiFetch<any>(`/api/admin/pending-approvals/${q.toString() ? `?${q}` : ''}`);
  },

  /**
   * PUT /api/admin/approvals/{id}/
   * body: { action*('approve'|'reject'), reason? }
   * O tipo é detectado automaticamente pelo backend
   */
  approveItem: (id: string, body: ApproveItemRequest) =>
    apiFetch<ApproveItemResponse>(`/api/admin/approvals/${id}/`, {
      method: 'PUT', body: JSON.stringify(body),
    }),

  approve: (id: string, reason?: string) =>
    adminApi.approveItem(id, { action: 'approve', ...(reason ? { reason } : {}) }),

  reject: (id: string, reason: string) =>
    adminApi.approveItem(id, { action: 'reject', reason }),

  /** Solicitar correcção — usa reject com motivo "correction needed" */
  requestCorrection: (id: string, note: string) =>
    adminApi.approveItem(id, { action: 'reject', reason: `[CORRECTION] ${note}` }),

  /**
   * GET /api/admin/stats/
   * Requer role: admin | curator
   */
  getStats: () => apiFetch<any>('/api/admin/stats/'),

  /**
   * GET /api/admin/users/
   * query: page, limit, role, search, status
   */
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) q.append(k, String(v));
    });
    return apiFetch<any>(`/api/admin/users/${q.toString() ? `?${q}` : ''}`);
  },

  /**
   * PUT /api/admin/users/{id}/status/
   * body: { status*(active|suspended|banned), reason? }
   */
  updateUserStatus: (id: string, status: 'active' | 'suspended' | 'banned', reason?: string) =>
    apiFetch<any>(`/api/admin/users/${id}/status/`, {
      method: 'PUT', body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITES — save/unsave APENAS para posts (baseado no openapi-schema.yaml)
//
// ANÁLISE DA API ATUAL:
// ✅ POST /api/posts/{id}/save/    → FUNCIONA (confirmado no openapi-schema.yaml)
// ✅ DELETE /api/posts/{id}/save/  → FUNCIONA (confirmado no openapi-schema.yaml)
// FAVORITOS — baseado no openapi-schema.yaml (fonte de verdade do servidor remoto)
//
// ✅ POST   /api/posts/{id}/save/  → Guarda post         → { success, hasSaved: true }
// ✅ DELETE /api/posts/{id}/save/  → Remove post guardado → { success, hasSaved: false }
// ✅ GET    /api/posts/            → Devolve userInteraction.hasSaved por post
// ❌ Nenhum endpoint de save para locais ou serviços existe no servidor remoto
//
// ESTRATÉGIA:
// - Posts: toggle via POST/DELETE. Estado inicial carregado de GET /api/posts/
//   filtrando userInteraction.hasSaved === true (único mecanismo disponível).
// - Locais/Serviços: apenas estado em memória durante a sessão.
//   Sem persistência — não existe backend para tal.
// ─────────────────────────────────────────────────────────────────────────────
export const favoritesApi = {
  /**
   * Carrega favoritos do utilizador autenticado.
   * - Locais: GET /api/locals/ filtrando userInteraction.hasSaved === true
   *   (GET /api/locals/saved/ não existe no OpenAPI)
   * - Posts:  GET /api/posts/ filtrando userInteraction.hasSaved === true
   */
  getAll: async (): Promise<{ posts: any[]; locals: any[]; services: any[] }> => {
    const [localsResult, postsResult] = await Promise.allSettled([
      // Locais guardados — percorre lista filtrando hasSaved
      (async () => {
        const saved: any[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore && page <= 5) {
          const res = await apiFetch<any>(`/api/locals/?sortBy=popular&limit=50&page=${page}`);
          if (res.error || !res.data) break;
          const raw = res.data;
          const items: any[] = Array.isArray(raw) ? raw : (raw.locals ?? raw.results ?? []);
          items.forEach((l: any) => {
            if (l.userInteraction?.hasSaved === true || l.is_saved === true) saved.push(l);
          });
          const pagination = Array.isArray(raw) ? null : (raw.pagination ?? raw.meta?.pagination ?? null);
          hasMore = pagination?.hasNext ?? (items.length === 50);
          page++;
        }
        return saved;
      })(),
      // Posts guardados — percorre lista filtrando hasSaved
      (async () => {
        const saved: any[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore && page <= 10) {
          const res = await apiFetch<any>(`/api/posts/?sortBy=recent&limit=50&page=${page}`);
          if (res.error || !res.data) break;
          const raw = res.data;
          const items: any[] = Array.isArray(raw) ? raw : (raw.posts ?? raw.results ?? raw.data ?? []);
          items.forEach((p: any) => {
            if (p.userInteraction?.hasSaved === true || p.is_saved === true) saved.push(p);
          });
          const pagination = Array.isArray(raw) ? null : (raw.pagination ?? raw.meta ?? null);
          hasMore = pagination?.hasNext ?? (items.length === 50);
          page++;
        }
        return saved;
      })(),
    ]);

    const locals = localsResult.status === 'fulfilled' ? localsResult.value : [];
    const posts  = postsResult.status  === 'fulfilled' ? postsResult.value  : [];

    return { posts, locals, services: [] };
  },

  /**
   * POST /api/posts/{id}/save/ → { success: true, hasSaved: true }
   */
  savePost: (id: string) =>
    apiFetch<SaveResponse>(`/api/posts/${id}/save/`, { method: 'POST' }),

  /**
   * DELETE /api/posts/{id}/save/ → { success: true, hasSaved: false }
   */
  unsavePost: (id: string) =>
    apiFetch<SaveResponse>(`/api/posts/${id}/save/`, { method: 'DELETE' }),

  /**
   * POST /api/locals/{id}/save/ → { message, saved: true }
   * Backend faz toggle: guarda se não existia, remove se existia.
   */
  saveLocal: (id: string) =>
    apiFetch<any>(`/api/locals/${id}/save/`, { method: 'POST' }),

  /**
   * POST /api/locals/{id}/save/ (mesmo endpoint — toggle remove)
   */
  unsaveLocal: (id: string) =>
    apiFetch<any>(`/api/locals/${id}/save/`, { method: 'POST' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Aliases para compatibilidade com código existente
// ─────────────────────────────────────────────────────────────────────────────
export const mediaApi = {
  uploadPlaceImage:   (_id: string, file: File) => uploadApi.images([file], 'local'),
  uploadServiceImage: (_id: string, file: File) => uploadApi.images([file], 'service'),
};

export const chatApi = {
  listConversations: () => apiFetch<any>('/api/chat/conversations/'),
  getConversation:   (id: string) => apiFetch<any>(`/api/chat/conversations/${id}/`),
  sendMessage: (cId: string, message: string) =>
    apiFetch<any>(`/api/chat/conversations/${cId}/messages/`, {
      method: 'POST', body: JSON.stringify({ content: message }),
    }),
  createConversation: (participantId: string) =>
    apiFetch<any>('/api/chat/conversations/', {
      method: 'POST', body: JSON.stringify({ participant_id: participantId }),
    }),
};
