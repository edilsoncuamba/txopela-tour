/**
 * AuthContext — autenticação via API (openapi-schema(3).yaml).
 *
 * Endpoints usados:
 *   POST /api/auth/login/    body: { email, password }          → { user, token, refreshToken }
 *   POST /api/auth/register/ body: { name, email, password, ... } → RegisterResponse
 *   POST /api/auth/refresh/  body: { refreshToken }             → { token, refreshToken }
 *   POST /api/auth/logout/   body: { refreshToken? }
 *   GET  /api/users/me/                                         → perfil completo com stats
 *
 * Sem localStorage. Sem sessionStorage. Sem cookies.
 * Tokens em memória via tokenStore. Ao recarregar a página o utilizador
 * tem de fazer login novamente — comportamento correcto sem storage.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usersApi } from '@/services/api';
import { tokenStore } from '@/services/tokenStore';
import type { User } from '@/types';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (url) return url.replace(/\/api\/?$/, '');
  return (import.meta.env.VITE_BACKEND_PROTOCOL ?? 'https') + '://' +
         (import.meta.env.VITE_BACKEND_HOST     ?? 'api-txopela-tour-3tdq.onrender.com');
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login:      (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginLocal: (user: User) => void;
  register:   (name: string, email: string, password: string, role: string) => Promise<{ ok: boolean; error?: string }>;
  logout:     () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  refreshUser:(signal?: AbortSignal, silent?: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapRole(role: string | undefined | null): 'traveler' | 'guide' | 'business' | 'resident' {
  if (!role) return 'traveler';
  if (role === 'guide' || role === 'curator')                return 'guide';
  if (role === 'business' || role === 'local_business')      return 'business';
  if (role === 'resident' || role === 'local_resident')      return 'resident';
  return 'traveler';
}

function mapApiUser(raw: any): User {
  const u = raw?.user ?? raw ?? {};
  return {
    id:              String(u.id || u.pk || ''),
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
}

function extractError(data: any, status: number): string {
  if (data.non_field_errors) return Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
  if (data.email)    return Array.isArray(data.email)    ? data.email[0]    : data.email;
  if (data.password) return Array.isArray(data.password) ? data.password[0] : data.password;
  if (data.name)     return Array.isArray(data.name)     ? data.name[0]     : data.name;
  if (data.detail)   return data.detail;
  if (data.error)    return data.error;
  if (data.message && typeof data.message === 'string') return data.message;
  if (status === 400) return 'Dados inválidos. Verifica os campos.';
  if (status === 401) return 'Email ou senha incorrectos.';
  if (status === 403) return 'Sem permissão.';
  if (status === 409) return 'Este email já está registado.';
  if (status === 429) return 'Demasiadas tentativas. Aguarda uns momentos.';
  if (status >= 500)  return 'Servidor indisponível. Tenta mais tarde.';
  return `Erro ${status}.`;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(false);

  // ── GET /api/users/me/ — carrega perfil completo ──────────────────────────
  // silent=true → chamado em background após login; falhas NÃO deslogam o utilizador
  // silent=false (padrão) → chamado para verificar sessão; falhas deslogam
  const refreshUser = useCallback(async (signal?: AbortSignal, silent = false) => {
    if (!tokenStore.getAccess()) { if (!silent) setLoading(false); return; }

    try {
      const res = await fetch(`${getBaseUrl()}/api/users/me/`, {
        headers: {
          Authorization: `Bearer ${tokenStore.getAccess()}`,
          Accept: 'application/json',
        },
        signal,
      });

      if (res.ok) {
        const raw = await res.json();
        const payload = (raw && typeof raw === 'object' && 'data' in raw) ? raw.data : raw;
        setUser(mapApiUser(payload));
      } else if (res.status === 401 && !silent) {
        // Só tenta refresh se não for chamada silent
        const rf = tokenStore.getRefresh();
        if (!rf) { tokenStore.clear(); setUser(null); return; }
        const rfRes = await fetch(`${getBaseUrl()}/api/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rf }),
        });
        if (rfRes.ok) {
          const rfRaw = await rfRes.json();
          const d = rfRaw?.data ?? rfRaw;
          if (d.token && d.refreshToken) {
            tokenStore.set({ token: d.token, refreshToken: d.refreshToken });
            await refreshUser(signal, false);
          } else {
            tokenStore.clear(); setUser(null);
          }
        } else {
          tokenStore.clear(); setUser(null);
        }
      } else if (!silent) {
        // Erro não-401 em chamada não-silent: deslogar
        tokenStore.clear(); setUser(null);
      }
      // Em modo silent, qualquer erro é ignorado — o user já foi definido pelo login
    } catch (e: any) {
      if (e?.name !== 'AbortError' && !silent) { tokenStore.clear(); setUser(null); }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Sem useEffect de inicialização — sem tokens em memória ao arrancar
  // O utilizador tem de fazer login explicitamente

  // ── POST /api/auth/login/ ─────────────────────────────────────────────────
  // Nota: não chamamos setLoading(true) aqui para não substituir a tela de login
  // durante o processo. O componente Login.tsx tem o seu próprio estado isLoading local.
  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000); // 30s — Render pode demorar a acordar
      const res   = await fetch(`${getBaseUrl()}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      let d: any = {};
      try { d = await res.json(); } catch { /* empty */ }
      if (!res.ok) {
        return { ok: false, error: extractError(d, res.status) };
      }

      // A API devolve:
      //   { status, data: { user }, token, refreshToken, meta }
      // token e refreshToken estão SEMPRE na raiz — nunca dentro de data.
      // Suportamos também o formato legacy onde estariam dentro de data.
      const token        = d.token        ?? d.data?.token;
      const refreshToken = d.refreshToken ?? d.data?.refreshToken;

      if (!token || !refreshToken) {
        return { ok: false, error: 'Resposta inválida do servidor (tokens em falta).' };
      }

      // Guardar tokens em memória
      tokenStore.set({ token, refreshToken });

      // Utilizador pode estar em data.user, data, ou na raiz
      const userData = d.data?.user ?? d.data ?? d.user ?? d;
      if (userData?.id || userData?.pk || userData?.email) {
        // Temos dados suficientes do utilizador na resposta — usar directamente
        setUser(mapApiUser(userData));
        // Carregar perfil completo em background (silent=true: falhas não deslogam)
        refreshUser(undefined, true).catch(() => {});
      } else {
        // Sem dados do utilizador na resposta — buscar perfil de forma síncrona
        await refreshUser();
      }

      return { ok: true };
    } catch (e: any) {
      if (e?.name === 'AbortError')
        return { ok: false, error: 'O servidor demorou demasiado a responder. O servidor pode estar a iniciar — tenta novamente em 30 segundos.' };
      return { ok: false, error: e?.message?.includes('Failed to fetch')
        ? `Sem conexão com o servidor. Verifica a ligação à internet.`
        : `Erro: ${e?.message}` };
    }
  };

  const loginLocal = (u: User) => { setUser(u); setLoading(false); };

  // ── POST /api/auth/register/ ──────────────────────────────────────────────
  const register = async (
    name: string, email: string, password: string, role: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true);
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res   = await fetch(`${getBaseUrl()}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role, termsAccepted: true }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      let d: any = {};
      try { d = await res.json(); } catch { /* empty */ }
      if (!res.ok) return { ok: false, error: extractError(d, res.status) };

      // token e refreshToken estão na raiz, user dentro de data.user
      const token        = d.token        ?? d.data?.token;
      const refreshToken = d.refreshToken ?? d.data?.refreshToken;

      if (!token || !refreshToken) {
        return { ok: false, error: 'Resposta inválida do servidor (tokens em falta).' };
      }

      tokenStore.set({ token, refreshToken });

      const userData = d.data?.user ?? d.data ?? d.user ?? d;
      if (userData?.id || userData?.pk || userData?.email) {
        setUser(mapApiUser(userData));
      } else {
        await refreshUser();
      }

      return { ok: true };
    } catch (e: any) {
      if (e?.name === 'AbortError') return { ok: false, error: 'Tempo de espera esgotado.' };
      return { ok: false, error: e?.message?.includes('Failed to fetch')
        ? 'Sem conexão com o servidor.'
        : 'Erro inesperado.' };
    } finally {
      setLoading(false);
    }
  };

  // ── POST /api/auth/logout/ ────────────────────────────────────────────────
  const logout = async () => {
    const rf = tokenStore.getRefresh();
    try {
      if (tokenStore.getAccess()) {
        await fetch(`${getBaseUrl()}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenStore.getAccess()}`,
          },
          body: JSON.stringify(rf ? { refreshToken: rf } : {}),
        });
      }
    } catch { /* logout silencioso */ } finally {
      tokenStore.clear();
      setUser(null);
    }
  };

  // ── Actualizar perfil ─────────────────────────────────────────────────────
  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (userData.avatar !== undefined && Object.keys(userData).length === 1) {
        setUser(prev => prev ? { ...prev, avatar: userData.avatar } : null);
        return true;
      }
      const body: Record<string, any> = {};
      if (userData.name                    !== undefined) body.name        = userData.name;
      if (userData.phone                   !== undefined) body.phone       = userData.phone;
      if ((userData as any).dateOfBirth    !== undefined) body.dateOfBirth = (userData as any).dateOfBirth;
      if (userData.bio                     !== undefined) body.bio         = userData.bio;
      const { data, error } = await usersApi.updateProfile(body);
      if (error || !data) return false;
      setUser(prev => prev ? { ...prev, ...mapApiUser(data) } : null);
      return true;
    } catch { return false; }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginLocal,
      register,
      logout,
      updateUser,
      refreshUser,
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
