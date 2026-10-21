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
import { clearFollowCache } from '@/hooks/useSuggest';

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
  register:   (name: string, email: string, password: string, role: string, phone?: string, dateOfBirth?: string, extra?: Record<string, unknown>) => Promise<{ ok: boolean; error?: string; emailVerified?: boolean; ambiguous?: boolean }>;
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

function safeString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val))      return safeString(val[0]);
  if (typeof val === 'object') {
    // { code, details, correlation_id } — formato da API Txopela
    if (typeof val.details === 'string') return val.details;
    if (typeof val.detail  === 'string') return val.detail;
    if (typeof val.message === 'string') return val.message;
    if (typeof val.error   === 'string') return val.error;
    // fallback: nunca retornar o objecto raw
    return '';
  }
  return String(val);
}

function extractError(data: any, status: number): string {
  if (!data || typeof data !== 'object') {
    if (status === 409) return 'Este email já está registado.';
    if (status === 400) return 'Dados inválidos. Verifica os campos.';
    if (status === 401) return 'Email ou senha incorrectos.';
    if (status === 403) return 'Sem permissão.';
    if (status === 429) return 'Demasiadas tentativas. Aguarda uns momentos.';
    if (status >= 500)  return 'Servidor indisponível. Tenta mais tarde.';
    return `Erro ${status}.`;
  }

  // Formato { code, details, correlation_id } — API Txopela Tour
  if (data.code && data.details) {
    const details = safeString(data.details);
    if (details) return details;
    // mapear códigos conhecidos
    if (data.code === 'USER_ALREADY_EXISTS' || data.code === 'EMAIL_EXISTS') return 'Este email já está registado.';
    if (data.code === 'VALIDATION_ERROR')   return 'Dados inválidos. Verifica os campos.';
    if (data.code === 'INVALID_CREDENTIALS') return 'Email ou senha incorrectos.';
  }

  const s = safeString(data.non_field_errors) || safeString(data.email) ||
            safeString(data.password) || safeString(data.name) ||
            safeString(data.detail)   || safeString(data.error) ||
            safeString(data.message)  || safeString(data.details);
  if (s) return s;

  if (status === 409) return 'Este email já está registado.';
  if (status === 400) return 'Dados inválidos. Verifica os campos.';
  if (status === 401) return 'Email ou senha incorrectos.';
  if (status === 403) return 'Sem permissão.';
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
    phone?: string, dateOfBirth?: string,
    extra?: Record<string, unknown>,
  ): Promise<{ ok: boolean; error?: string; emailVerified?: boolean; ambiguous?: boolean }> => {
    // Nota: NÃO usamos setLoading(true) aqui — isso causaria a tela branca global
    // no App.tsx. O componente Register.tsx tem o seu próprio estado isLoading local.
    try {
      const ctrl  = new AbortController();
      // 45s — servidor Render pode ter cold-start de 20-30s; 15s causava falsos timeouts
      // com a conta já criada no backend mas o frontend a tratar como erro.
      const timer = setTimeout(() => ctrl.abort(), 45000);
      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        termsAccepted: true,
        // Campos adicionais do negócio (extra) — enviados quando role === 'business'
        ...extra,
      };
      if (phone)       body.phone = phone.trim();
      if (dateOfBirth) body.dateOfBirth = dateOfBirth;
      const res   = await fetch(`${getBaseUrl()}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      let d: any = {};
      try { d = await res.json(); } catch { /* empty */ }
      if (!res.ok) return { ok: false, error: extractError(d, res.status) };

      // Resposta real confirmada da API (HTTP 201):
      // { status, code, data: { user: { id, name, email, role, avatar,
      //   emailVerified, createdAt, token, refreshToken } }, meta }
      // Os tokens e os dados do utilizador estão em d.data.user.
      const userPayload  = d?.data?.user ?? d?.data ?? d?.user;
      const token        = userPayload?.token        ?? d?.token;
      const refreshToken = userPayload?.refreshToken ?? d?.refreshToken;

      if (!token || !refreshToken || !userPayload?.id) {
        // A API respondeu 201 mas sem os campos esperados — erro real, não fallback.
        return { ok: false, error: 'Resposta inválida do servidor após cadastro. Tenta novamente.' };
      }

      // Guardar tokens em memória (igual ao login)
      tokenStore.set({ token, refreshToken });

      // Definir o utilizador com os dados de d.data.user.
      // NÃO chamar refreshUser em background — evita race condition.
      setUser(mapApiUser(userPayload));

      // Propagar emailVerified para que Register.tsx possa decidir o próximo ecrã:
      //   false → mostrar tela de verificação de e-mail
      //   true  → conta pronta, navegar para Home
      const emailVerified: boolean = userPayload?.emailVerified ?? userPayload?.email_verified ?? false;
      return { ok: true, emailVerified };
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // AbortError após 45s: o servidor pode ter processado o pedido mas a rede
        // não devolveu a resposta a tempo. Sinalizar como ambíguo para que o
        // frontend não trate isto como falha definitiva nem repita o cadastro.
        return {
          ok: false,
          ambiguous: true,
          error: 'A ligação demorou demasiado. A conta pode já ter sido criada — tenta fazer login, ou aguarda e tenta novamente.',
        };
      }
      return { ok: false, error: e?.message?.includes('Failed to fetch')
        ? 'Sem conexão com o servidor. Verifica a ligação à internet.'
        : 'Erro inesperado. Tenta novamente.' };
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
      clearFollowCache();
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
