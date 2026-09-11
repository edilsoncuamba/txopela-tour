import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, usersApi } from '@/services/api';
import type { UserProfile } from '@/types/api';
import { backendConfig } from '@/config/backend';
import type { User } from '@/types';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (url) return url.replace(/\/api\/?$/, '');
  return backendConfig.getBaseUrl();
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login:      (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginLocal: (user: User) => void;
  register:   (name: string, email: string, password: string, type: string) => Promise<{ ok: boolean; error?: string }>;
  logout:     () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  refreshUser:(signal?: AbortSignal) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapeia UserProfile (OpenAPI) para User (frontend)
// OpenAPI /api/users/me/ retorna: { id, email, username, role, phone, bio, avatar, stats, ... }
function mapApiUser(raw: any): User {
  // Suporta envelope { status, code, data: { ... } } e resposta directa
  // O refreshUser já extrai o data do envelope antes de chamar esta função
  const u = raw?.user ?? raw ?? {};
  
  console.log('[mapApiUser] input:', JSON.stringify(u, null, 2));
  
  const mapped: User = {
    id:              String(u.id || u.pk || ''),
    // OpenAPI usa 'username' como campo de exibição; UserUpdateRequest aceita 'name'
    name:            u.name || u.username || u.email?.split('@')[0] || 'Utilizador',
    username:        u.username || u.name || '',
    email:           u.email || '',
    avatar:          u.avatar || null,
    type:            mapRole(u.role),
    role:            u.role,
    bio:             u.bio || '',
    location:        u.location,
    phone:           u.phone || '',
    dateOfBirth:     u.dateOfBirth || u.date_of_birth || '',
    emailVerified:   u.emailVerified ?? u.email_verified ?? false,
    followers_count: u.stats?.followersCount ?? u.followers_count ?? 0,
    following_count: u.stats?.followingCount ?? u.following_count ?? 0,
    posts_count:     u.stats?.postsCount     ?? u.posts_count     ?? 0,
    services_count:  u.stats?.servicesCount  ?? u.services_count  ?? 0,
    locals_count:    u.stats?.localsCount    ?? u.locals_count    ?? 0,
    is_verified:     u.is_verified ?? u.emailVerified ?? false,
    date_joined:     u.date_joined || u.created_at || u.createdAt || new Date().toISOString(),
    stats:           u.stats ?? {},
  };
  
  console.log('[mapApiUser] mapped:', mapped);
  return mapped;
}

// OpenAPI RegisterRoleEnum: tourist | local_resident | business
// OpenAPI UserRoleEnum: tourist | local_resident | local_business | guide | curator | admin
function mapRole(role: string | undefined | null): 'traveler' | 'guide' | 'business' | 'resident' {
  if (!role) return 'traveler'; // sem role da API — não deve acontecer pois todos os utilizadores têm role
  if (role === 'guide' || role === 'curator') return 'guide';
  if (role === 'business' || role === 'local_business') return 'business';
  if (role === 'resident' || role === 'local_resident') return 'resident';
  // tourist → traveler
  return 'traveler';
}
function extractError(data: any, status: number): string {
  if (data.non_field_errors) return Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
  if (data.email)    return Array.isArray(data.email)    ? data.email[0]    : data.email;
  if (data.password) return Array.isArray(data.password) ? data.password[0] : data.password;
  if (data.name)     return Array.isArray(data.name)     ? data.name[0]     : data.name;
  if (data.detail)   return data.detail;
  if (data.error)    return data.error;
  if (data.message)  return data.message;
  if (status === 400) return 'Dados inválidos. Verifica os campos.';
  if (status === 401) return 'Email ou senha incorrectos.';
  if (status === 403) return 'Sem permissão.';
  if (status === 409) return 'Este email já está registado.';
  if (status === 429) return 'Demasiadas tentativas. Aguarda uns momentos.';
  if (status >= 500)  return 'Servidor indisponível. Tenta mais tarde.';
  return `Erro ${status}.`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  // Refresh token usando a api.ts centralizada
  const tryRefresh = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),   // campo: refreshToken (camelCase)
      });
      if (!res.ok) return false;
      const d = await res.json();
      if (d.token)        localStorage.setItem('access_token',  d.token);
      if (d.refreshToken) localStorage.setItem('refresh_token', d.refreshToken);
      return true;
    } catch { return false; }
  };

  /**
   * GET /api/users/me/  →  perfil completo com stats
   * Conforme OpenAPI: retorna envelope { status, code, data } onde data é o perfil
   * O apiFetch já extrai data do envelope automaticamente
   */
  const refreshUser = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }

    const ctrl    = signal ? undefined : new AbortController();
    const sig     = signal ?? ctrl?.signal;
    const timeout = ctrl ? setTimeout(() => ctrl.abort(), 8000) : undefined;

    try {
      // Tenta /api/users/me/ primeiro (resposta com stats)
      const res = await fetch(`${getBaseUrl()}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: sig,
      });
      if (timeout) clearTimeout(timeout);

      if (res.ok) {
        const raw = await res.json();
        console.log('[AuthContext] /api/users/me/ resposta raw:', raw);
        
        // Suporta envelope { status, code, data } E resposta directa
        const payload = (raw && typeof raw === 'object' && 'data' in raw)
          ? raw.data
          : raw;
        
        const mapped = mapApiUser(payload);
        console.log('[AuthContext] user mapeado:', mapped);
        setUser(mapped);
      } else if (res.status === 401) {
        const ok = await tryRefresh();
        if (ok) await refreshUser(signal);
        else { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); setUser(null); }
      } else {
        console.warn('[AuthContext] /api/users/me/ status:', res.status);
        localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); setUser(null);
      }
    } catch (e: any) {
      if (timeout) clearTimeout(timeout);
      if (e?.name !== 'AbortError') { console.error('[AuthContext] refreshUser erro:', e); setUser(null); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    if (localStorage.getItem('access_token')) refreshUser(ctrl.signal);
    else setLoading(false);
    return () => ctrl.abort();
  }, [refreshUser]);

  /**
   * POST /api/auth/login/
   * body: { email, password }
   * 200: { user, token, refreshToken }
   */
  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const baseUrl = getBaseUrl();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${baseUrl}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      let d: any = {};
      try { d = await res.json(); } catch { /* empty */ }
      if (!res.ok) return { ok: false, error: extractError(d, res.status) };

      if (d.token)        localStorage.setItem('access_token',  d.token);
      if (d.refreshToken) localStorage.setItem('refresh_token', d.refreshToken);

      console.log('[AuthContext] login resposta:', d);
      
      const userData = d.user ?? d;
      if (userData?.id) {
        setUser(mapApiUser(userData));
        // Faz refresh para obter perfil completo com stats
        refreshUser().catch(() => {});
      } else {
        await refreshUser();
      }

      return { ok: true };
    } catch (e: any) {
      if (e?.name === 'AbortError')
        return { ok: false, error: `Servidor não respondeu. Verifica se o backend está activo.` };
      const net = e?.message?.includes('Failed to fetch') || e?.message?.includes('ERR_CONNECTION_REFUSED');
      return { ok: false, error: net ? `Sem conexão com ${baseUrl}.` : `Erro: ${e?.message}` };
    }
  };

  const loginLocal = (u: User) => { setUser(u); setLoading(false); };

  /**
   * POST /api/auth/register/
   * body: { name, email, password, role, termsAccepted }
   * 201: RegisterResponse { id, name, email, role, token, refreshToken, ... }
   */
  const register = async (
    name: string, email: string, password: string, type: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${getBaseUrl()}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), password,
          role: type,           // tourist | local_resident | business
          termsAccepted: true,  // required
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      let d: any = {};
      try { d = await res.json(); } catch { /* empty */ }
      if (!res.ok) return { ok: false, error: extractError(d, res.status) };

      // RegisterResponse: tokens no root (não dentro de user)
      const token   = d.token        ?? d.user?.token;
      const refresh = d.refreshToken ?? d.user?.refreshToken;
      if (token)   localStorage.setItem('access_token',  token);
      if (refresh) localStorage.setItem('refresh_token', refresh);

      // Dados do utilizador também no root da RegisterResponse
      if (d.id || d.email) setUser(mapApiUser(d));
      else if (token) await refreshUser();

      return { ok: true };
    } catch (e: any) {
      if (e?.name === 'AbortError') return { ok: false, error: 'Tempo de espera esgotado.' };
      const net = e?.message?.includes('Failed to fetch');
      return { ok: false, error: net ? 'Sem conexão com o servidor.' : 'Erro inesperado.' };
    }
  };

  /**
   * POST /api/auth/logout/
   * body: { refreshToken? }  — invalida token na blacklist
   */
  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (userData.avatar !== undefined && Object.keys(userData).length === 1) {
        setUser(prev => prev ? { ...prev, avatar: userData.avatar } : null);
        return true;
      }
      const payload: Record<string, any> = {};
      if (userData.name        !== undefined) payload.name        = userData.name;
      if (userData.phone       !== undefined) payload.phone       = userData.phone;
      if ((userData as any).dateOfBirth !== undefined) payload.dateOfBirth = (userData as any).dateOfBirth;
      if (userData.bio         !== undefined) payload.bio         = userData.bio;
      const { data, error } = await usersApi.updateProfile(payload);
      if (error || !data) return false;
      setUser(prev => prev ? { ...prev, ...mapApiUser(data) } : null);
      return true;
    } catch { return false; }
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, loginLocal, register, logout, updateUser, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
