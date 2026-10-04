﻿﻿import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollTop } from '@/hooks/useScrollTop';
import {
  LayoutDashboard, MapPin, Briefcase, Clock,
  LogOut, Check, X, RefreshCw, Eye,
  ChevronRight,
  AlertCircle, CheckCircle, Loader2, AlertTriangle,
  User, Edit3, Camera, Mail, Phone, Calendar, FileText,
  BarChart3, Users, Shield, Award, TrendingUp,
} from 'lucide-react';
import { adminApi, localsApi, servicesApi, usersApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  translateStatus,
  translateLocalCategory,
  translateServiceCategory,
} from '@/utils/translations';
import PublicationDetailModal from '@/components/PublicationDetailModal';
import EditProfile from './EditProfile';

// Keyframes para animação de spin
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes apd-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-apd-spin]')) {
  spinStyle.setAttribute('data-apd-spin', 'true');
  document.head.appendChild(spinStyle);
}

// ── Tokens idênticos à app principal ─────────────────────────────────────────
const BRAND   = '#1B5E3B';
const BLUE    = '#0077B6';
const BG      = '#F5F5F0';
const WHITE   = '#FFFFFF';
const GRAY_100= '#F3F4F6';
const GRAY_200= '#E5E7EB';
const GRAY_400= '#9CA3AF';
const GRAY_500= '#6B7280';
const GRAY_700= '#374151';
const GRAY_900= '#1A1A1A';

type Section    = 'visao' | 'locais' | 'servicos' | 'historico' | 'perfil' | 'edit-profile';
type ActionType = 'approve' | 'reject' | 'correction';

interface PendingItem {
  id: string;
  type: 'local' | 'service' | 'post';
  name: string;
  submittedBy: string;
  submittedAt: string;
  category: string;
  province: string;
  description: string;
  images: string[];
  status: string;
  raw: any;
}

interface StatsData {
  pending: number;
  approved: number;
  rejected: number;
  totalLocals: number;
  totalServices: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusStyle(s: string): { color: string; bg: string } {
  const m: Record<string, { color: string; bg: string }> = {
    pending:  { color: '#92400E', bg: '#FEF3C7' },
    approved: { color: '#065F46', bg: '#D1FAE5' },
    rejected: { color: '#991B1B', bg: '#FEE2E2' },
    review:   { color: '#1E40AF', bg: '#DBEAFE' },
  };
  return m[(s || '').toLowerCase()] ?? { color: GRAY_500, bg: GRAY_100 };
}

function statusLabel(s: string): string { return translateStatus(s); }

function relativeTime(iso: string): string {
  try {
    const ms  = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60_000);
    if (min < 1)  return 'Agora mesmo';
    if (min < 60) return `há ${min}min`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
  } catch { return iso; }
}

function mapToItem(raw: any, type: 'local' | 'service' | 'post'): PendingItem {
  const images: string[] = (raw.images || [])
    .map((img: any) => typeof img === 'string' ? img : img.url ?? img.image ?? '')
    .filter(Boolean);
  const rawCat = raw.category?.name || raw.category || '';
  const catPT  = type === 'service' ? translateServiceCategory(rawCat) : translateLocalCategory(rawCat);
  return {
    id:          String(raw.id || raw.pk || ''),
    type,
    name:        raw.name || raw.title || 'Sem nome',
    submittedBy: raw.author?.name || raw.owner?.name || raw.created_by?.name || 'Utilizador',
    submittedAt: relativeTime(raw.created_at || raw.createdAt || new Date().toISOString()),
    category:    catPT || '—',
    province:    raw.province || raw.location?.province || '—',
    description: raw.description || '',
    images,
    status:      raw.status || 'pending',
    raw,
  };
}

function typeIconEl(type: string): React.ReactNode {
  if (type === 'service') return <Briefcase size={18} />;
  if (type === 'post')    return <Eye size={18} />;
  return <MapPin size={18} />;
}
function typeColor(type: string): string {
  if (type === 'service') return '#7C3AED';
  if (type === 'post')    return '#0077B6';
  return BRAND;
}

// ── StatCard — mesmo estilo dos cards da app principal ────────────────────────
function StatCard({ label, value, color, icon }: {
  label: string; value: number | string; color: string; icon: React.ReactNode;
}) {
  return (
    <motion.div 
      key={`${label}-${value}`}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
      style={{ border: `1px solid ${GRAY_200}` }}>
      <div className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black leading-none" style={{ color: GRAY_900 }}>{value}</p>
        <p className="text-xs font-semibold mt-1" style={{ color: GRAY_500 }}>{label}</p>
      </div>
    </motion.div>
  );
}

// ── ItemRow — idêntico ao estilo de lista da app principal ───────────────────
function ItemRow({ item, onDetail, onQuickAction, acting }: {
  item: PendingItem; 
  onDetail: (i: PendingItem) => void;
  onQuickAction: (id: string, action: ActionType) => void;
  acting: boolean;
}) {
  const st = statusStyle(item.status);
  const tc = typeColor(item.type);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 mb-3 flex items-center gap-4 shadow-sm"
      style={{ border: `1px solid ${GRAY_200}` }}>

      {/* Ícone do tipo */}
      <div className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: `${tc}12`, color: tc, border: `1px solid ${tc}20` }}>
        {typeIconEl(item.type)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-black" style={{ color: GRAY_900 }}>{item.name}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: st.bg, color: st.color }}>
            {statusLabel(item.status)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.category !== '—' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${tc}10`, color: tc }}>{item.category}</span>
          )}
          {item.province !== '—' && (
            <span className="flex items-center gap-1 text-xs" style={{ color: GRAY_400 }}>
              <MapPin size={9} /> {item.province}
            </span>
          )}
          <span className="text-xs" style={{ color: GRAY_400 }}>· {item.submittedAt}</span>
          <span className="text-xs" style={{ color: GRAY_400 }}>
            · <strong style={{ color: GRAY_500 }}>{item.submittedBy}</strong>
          </span>
        </div>
      </div>

      {/* Acções */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => onDetail(item)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ border: `1.5px solid ${GRAY_200}`, background: WHITE, color: GRAY_700, cursor: 'pointer' }}>
          <Eye size={13} /> Detalhes
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} disabled={acting}
          onClick={() => onQuickAction(item.id, 'approve')}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: '#ECFDF5', color: '#059669', border: 'none', cursor: acting ? 'not-allowed' : 'pointer' }}>
          <Check size={14} strokeWidth={2.5} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} disabled={acting}
          onClick={() => onQuickAction(item.id, 'reject')}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', cursor: acting ? 'not-allowed' : 'pointer' }}>
          <X size={14} strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="bg-white rounded-2xl p-14 text-center" style={{ border: `1px solid ${GRAY_200}` }}>
      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: GRAY_100 }}>
        {icon}
      </div>
      <p className="text-base font-black mb-1" style={{ color: GRAY_900 }}>{title}</p>
      {subtitle && <p className="text-sm" style={{ color: GRAY_400 }}>{subtitle}</p>}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
interface ApuradorDashboardProps { onLogout?: () => void; }

export default function ApuradorDashboard({
  onLogout }: ApuradorDashboardProps) {
  useScrollTop();
  const { user, logout } = useAuth();
  const [section, setSection]       = useState<Section>('visao');
  const [pendingLocals, setPLocals] = useState<PendingItem[]>([]);
  const [pendingServices, setPSvcs] = useState<PendingItem[]>([]);
  const [history, setHistory]       = useState<PendingItem[]>([]);
  const [stats, setStats]           = useState<StatsData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [acting, setActing]         = useState(false);
  const [detailItem, setDetailItem] = useState<PendingItem | null>(null);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const userRole  = user?.role || '';
  const hasAccess = userRole === 'curator' || userRole === 'admin';

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProfile = useCallback(async () => {
    try {
      console.log('[ApuradorDashboard] Iniciando carregamento do perfil...');
      
      // Carrega perfil básico primeiro
      const res = await usersApi.getProfile();
      console.log('[ApuradorDashboard] Resposta do perfil:', res);
      
      let profile = null;
      if (res.data && res.data.user) {
        profile = res.data.user;
      } else if (res.data) {
        profile = res.data;
      }

      if (!profile) {
        console.warn('[ApuradorDashboard] Perfil não encontrado na resposta');
        showToast('Erro ao carregar dados do perfil', false);
        return;
      }

      console.log('[ApuradorDashboard] Perfil carregado:', profile);

      // Inicializa com dados básicos primeiro
      setProfileData(profile);

      // Carrega estatísticas em paralelo, com melhor tratamento de erros
      console.log('[ApuradorDashboard] Carregando estatísticas...');
      
      const loadStats = async () => {
        let postsCount = 0;
        let localsCount = 0; 
        let servicesCount = 0;

        // Carrega posts com fallback silencioso
        try {
          console.log('[ApuradorDashboard] Tentando carregar posts...');
          const postsResult = await usersApi.myPosts();
          if (postsResult.data) {
            postsCount = postsResult.data.posts?.length || postsResult.data.results?.length || 0;
            console.log('[ApuradorDashboard] Posts carregados:', postsCount);
          }
        } catch (err: any) {
          // Silencia 404s e erros de endpoints não implementados
          if (!err.message?.includes('404')) {
            console.warn('[ApuradorDashboard] Falha ao carregar posts:', err);
          }
        }

        // Carrega locais com fallback silencioso
        try {
          console.log('[ApuradorDashboard] Tentando carregar locais...');
          const localsResult = await usersApi.myLocals();
          if (localsResult.data) {
            localsCount = localsResult.data.locals?.length || localsResult.data.results?.length || 0;
            console.log('[ApuradorDashboard] Locais carregados:', localsCount);
          }
        } catch (err: any) {
          // Silencia 404s e erros de endpoints não implementados
          if (!err.message?.includes('404')) {
            console.warn('[ApuradorDashboard] Falha ao carregar locais:', err);
          }
        }

        // Carrega serviços com fallback silencioso
        try {
          console.log('[ApuradorDashboard] Tentando carregar serviços...');
          const servicesResult = await usersApi.myServices();
          if (servicesResult.data) {
            servicesCount = servicesResult.data.services?.length || servicesResult.data.results?.length || 0;
            console.log('[ApuradorDashboard] Serviços carregados:', servicesCount);
          }
        } catch (err: any) {
          // Silencia 404s e erros de endpoints não implementados
          if (!err.message?.includes('404')) {
            console.warn('[ApuradorDashboard] Falha ao carregar serviços:', err);
          }
        }

        // Calcula estatísticas reais com os dados obtidos (ou fallback para 0)
        const realStats = {
          postsCount,
          localsCount,
          servicesCount,
          followersCount: profile.stats?.followersCount || 0,
          followingCount: profile.stats?.followingCount || 0,
        };

        console.log('[ApuradorDashboard] Estatísticas finais calculadas:', realStats);

        // Atualiza perfil com estatísticas reais
        const updatedProfile = {
          ...profile,
          stats: realStats
        };

        setProfileData(updatedProfile);
      };

      // Executa carregamento de estatísticas sem bloquear a interface
      loadStats();
      
    } catch (err) {
      console.error('[ApuradorDashboard] Erro geral ao carregar perfil:', err);
      showToast(`Erro ao carregar perfil: ${err instanceof Error ? err.message : 'Erro desconhecido'}`, false);
    }
  }, []);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('[ApuradorDashboard] Iniciando upload de avatar:', file);

    // Validação básica
    if (!file.type.startsWith('image/')) {
      showToast('Selecione uma imagem válida', false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      showToast('Imagem muito grande (máx: 5MB)', false);
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await usersApi.uploadAvatar(file);
      console.log('[ApuradorDashboard] Resposta do upload:', res);
      
      if (res.data && res.data.avatarUrl) {
        setProfileData((prev: any) => ({ ...prev, avatar: res.data!.avatarUrl }));
        showToast('✓ Foto atualizada com sucesso!', true);
      } else if (res.error) {
        console.error('[ApuradorDashboard] Erro no upload:', res.error);
        showToast(res.error, false);
      } else {
        console.warn('[ApuradorDashboard] Resposta inesperada do upload:', res);
        showToast('Resposta inesperada do servidor', false);
      }
    } catch (err) {
      console.error('[ApuradorDashboard] Erro ao enviar foto:', err);
      showToast(`Erro ao enviar foto: ${err instanceof Error ? err.message : 'Erro desconhecido'}`, false);
    } finally {
      setUploadingAvatar(false);
      // Limpa o input para permitir reenvio do mesmo arquivo
      event.target.value = '';
    }
  };

  const loadAll = useCallback(async () => {
    if (!hasAccess) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      // 1. Busca pendentes + stats em paralelo
      const [pr, statsRes] = await Promise.all([
        adminApi.getPendingApprovals(),
        adminApi.getStats(),
      ]);

      if (pr.error) { setError(pr.error); return; }

      const pendingItems: PendingItem[] = (pr.data?.items || pr.data?.results || pr.data || []).map((r: any) => {
        const t = r.type === 'service' ? 'service' : r.type === 'post' ? 'post' : 'local';
        return mapToItem(r, t);
      });

      // Separa pendentes por tipo
      const locaisPendentes   = pendingItems.filter(i => i.type === 'local'   && i.status === 'pending');
      const servicosPendentes = pendingItems.filter(i => i.type === 'service' && i.status === 'pending');
      setPLocals(locaisPendentes);
      setPSvcs(servicosPendentes);

      // 2. Stats da API admin (fonte de verdade)
      const s = statsRes.data?.stats ?? statsRes.data ?? {};

      // Tenta vários nomes de campo possíveis que o backend pode usar
      const apiApproved      = s.approved       ?? s.approvedCount    ?? s.total_approved   ?? null;
      const apiRejected      = s.rejected        ?? s.rejectedCount    ?? s.total_rejected   ?? null;
      const apiPending       = s.pending         ?? s.pendingCount     ?? s.total_pending    ?? null;
      const apiTotalLocals   = s.totalLocals     ?? s.locals_approved  ?? s.approved_locals  ?? s.localsCount   ?? null;
      const apiTotalServices = s.totalServices   ?? s.services_approved ?? s.approved_services ?? s.servicesCount ?? null;

      // 3. Busca locais e serviços para histórico e fallback de stats
      const [localsRes, servicesRes] = await Promise.all([
        localsApi.list({ limit: 100 }),
        servicesApi.list({ limit: 100 }),
      ]);

      const allLocals   = Array.isArray(localsRes.data?.locals)    ? localsRes.data.locals
                        : Array.isArray(localsRes.data?.results)   ? localsRes.data.results
                        : Array.isArray(localsRes.data)            ? localsRes.data
                        : [];
      const allServices = Array.isArray(servicesRes.data?.services) ? servicesRes.data.services
                        : Array.isArray(servicesRes.data?.results)  ? servicesRes.data.results
                        : Array.isArray(servicesRes.data)           ? servicesRes.data
                        : [];

      // Histórico: itens processados (não pending)
      const processedLocals   = allLocals  .filter((l: any) => l.status && l.status !== 'pending').map((l: any) => mapToItem(l, 'local'));
      const processedServices = allServices.filter((s: any) => s.status && s.status !== 'pending').map((s: any) => mapToItem(s, 'service'));

      // Merge histórico: API + sessão actual
      setHistory(prev => {
        const fromApi = new Map<string, PendingItem>();
        [...processedLocals, ...processedServices].forEach(i => fromApi.set(i.id, i));
        prev.filter(i => !fromApi.has(i.id) && i.status !== 'pending').forEach(i => fromApi.set(i.id, i));
        return Array.from(fromApi.values()).sort((a, b) => {
          const dA = new Date(a.raw.updated_at || a.raw.updatedAt || a.raw.created_at || a.raw.createdAt || 0).getTime();
          const dB = new Date(b.raw.updated_at || b.raw.updatedAt || b.raw.created_at || b.raw.createdAt || 0).getTime();
          return dB - dA;
        });
      });

      // 4. Estatísticas: API admin tem prioridade, fallback para cálculo local
      const fallbackLocaisActivos   = allLocals  .filter((l: any) => l.status === 'approved').length;
      const fallbackServicosActivos = allServices.filter((s: any) => s.status === 'approved').length;
      const fallbackAprovados       = [...processedLocals, ...processedServices].filter(i => i.status === 'approved').length;
      const fallbackRejeitados      = [...processedLocals, ...processedServices].filter(i => i.status === 'rejected').length;
      const fallbackPending         = locaisPendentes.length + servicosPendentes.length;

      setStats(prev => ({
        pending:       apiPending       ?? fallbackPending,
        approved:      apiApproved      ?? Math.max(prev?.approved ?? 0, fallbackAprovados),
        rejected:      apiRejected      ?? Math.max(prev?.rejected ?? 0, fallbackRejeitados),
        totalLocals:   apiTotalLocals   ?? fallbackLocaisActivos,
        totalServices: apiTotalServices ?? fallbackServicosActivos,
      }));

    } catch { setError('Erro inesperado ao comunicar com o servidor.'); }
    finally  { setLoading(false); }
  }, [hasAccess]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAction = async (itemId: string, action: ActionType, note: string) => {
    setActing(true);

    // Captura o item agora, antes de qualquer setState
    const allPending = [...pendingLocals, ...pendingServices];
    const source = allPending.find(i => i.id === itemId);

    // ── Optimistic update imediato (UI não espera pela API) ────────────────────
    const newStatus =
      action === 'approve' ? 'approved' :
      action === 'reject'  ? 'rejected'  :
                             'review';

    // Remove dos pendentes já
    setPLocals(p => p.filter(i => i.id !== itemId));
    setPSvcs(p  => p.filter(i => i.id !== itemId));

    // Adiciona ao histórico já
    if (source) {
      const updatedItem: PendingItem = {
        ...source,
        status: newStatus,
        raw: { ...source.raw, status: newStatus },
      };
      setHistory(prev => [updatedItem, ...prev.filter(i => i.id !== itemId)]);
    }

    // Actualiza contadores já
    setStats(prev => {
      if (!prev) return prev;
      return {
        pending:       Math.max(0, prev.pending - 1),
        approved:      action === 'approve' ? prev.approved + 1 : prev.approved,
        rejected:      action === 'reject'  ? prev.rejected + 1 : prev.rejected,
        totalLocals:   source?.type === 'local'   && action === 'approve' ? prev.totalLocals   + 1 : prev.totalLocals,
        totalServices: source?.type === 'service' && action === 'approve' ? prev.totalServices + 1 : prev.totalServices,
      };
    });

    // ── Chama a API em background ──────────────────────────────────────────────
    try {
      const res = action === 'approve'
        ? await adminApi.approve(itemId, note || undefined)
        : action === 'reject'
        ? await adminApi.reject(itemId, note || 'Rejeitado.')
        : await adminApi.requestCorrection(itemId, note || 'Correcções necessárias.');

      if (res.error) {
        // Reverte o optimistic update em caso de erro
        if (source) {
          setPLocals(p => source.type === 'local'   ? [source, ...p] : p);
          setPSvcs(p  => source.type === 'service'  ? [source, ...p] : p);
          setHistory(prev => prev.filter(i => i.id !== itemId));
          setStats(prev => {
            if (!prev) return prev;
            return {
              pending:       prev.pending + 1,
              approved:      action === 'approve' ? Math.max(0, prev.approved - 1) : prev.approved,
              rejected:      action === 'reject'  ? Math.max(0, prev.rejected - 1) : prev.rejected,
              totalLocals:   source.type === 'local'   && action === 'approve' ? Math.max(0, prev.totalLocals   - 1) : prev.totalLocals,
              totalServices: source.type === 'service' && action === 'approve' ? Math.max(0, prev.totalServices - 1) : prev.totalServices,
            };
          });
        }
        showToast(res.error, false);
        return;
      }

      showToast(
        action === 'approve' ? '✓ Aprovado com sucesso!'  :
        action === 'reject'  ? '✗ Rejeitado.'             :
                               '⟲ Correcção solicitada.',
        action !== 'reject',
      );

      // Sincroniza com a API em background (sem bloquear a UI)
      // O loadAll preserva o histórico local no merge
      setTimeout(() => { loadAll(); }, 800);

    } catch {
      showToast('Erro ao processar.', false);
    } finally {
      setActing(false);
    }
  };

  const handleLogout = async () => { await logout(); onLogout?.(); };
  const pendingAll   = pendingLocals.length + pendingServices.length;

  const navItems: { id: Section | 'perfil'; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'visao',     label: 'Visão Geral', icon: <LayoutDashboard size={18} /> },
    { id: 'locais',    label: 'Locais',       icon: <MapPin size={18} />,    count: pendingLocals.length },
    { id: 'servicos',  label: 'Serviços',     icon: <Briefcase size={18} />, count: pendingServices.length },
    { id: 'historico', label: 'Histórico',    icon: <Clock size={18} /> },
    { id: 'perfil',    label: 'Perfil',       icon: <User size={18} /> },
  ];

  // Sem acesso
  if (!hasAccess) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: BG, fontFamily: 'Nunito, sans-serif' }}>
      <div className="bg-white rounded-2xl p-12 max-w-sm w-full text-center shadow-sm" style={{ border: `1px solid ${GRAY_200}` }}>
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} color="#DC2626" />
        </div>
        <h2 className="text-lg font-black mb-2" style={{ color: GRAY_900 }}>Acesso restrito</h2>
        <p className="text-sm mb-1" style={{ color: GRAY_500 }}>Requer role <strong>curator</strong> ou <strong>admin</strong>.</p>
        <p className="text-sm mb-6" style={{ color: GRAY_500 }}>Role actual: <strong style={{ color: GRAY_900 }}>{userRole || '—'}</strong></p>
        <button onClick={() => { logout(); onLogout?.(); }}
          className="px-6 py-3 rounded-2xl text-white font-black text-sm"
          style={{ background: 'linear-gradient(135deg,#0F4C2A,#1B7A45)' }}>
          Voltar ao login
        </button>
      </div>
    </div>
  );

  // Página de edição de perfil
  if (section === 'edit-profile') {
    return <EditProfile onBack={() => setSection('perfil')} />;
  }

  const [collapsed, setCollapsed] = useState(false);
  const W = collapsed ? 64 : 260;

  return (
    <div className="min-h-screen flex" style={{ background: BG, fontFamily: 'Nunito, sans-serif' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <motion.aside
        className="fixed left-0 top-0 h-full z-40 flex flex-col group"
        animate={{ width: W }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(0,0,0,0.06)', boxShadow: '4px 0 24px rgba(0,0,0,0.04)',
          fontFamily: 'Nunito, sans-serif', overflow: 'hidden' }}>

        {/* Logo + texto + botão */}
        <div className="flex items-center gap-2.5 px-3 pt-4 pb-3"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>

          {/* EXPANDIDO */}
          {!collapsed && (
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                <img src="/images/Logo2.png" alt="Txopela Tour" className="w-full h-full object-contain" />
              </div>
              <span className="block text-lg leading-tight font-black flex-1 whitespace-nowrap"
                style={{ fontFamily: 'Pacifico, cursive', color: BLUE }}>Txopela Tour</span>
              {/* Seta fechar «« */}
              <button
                onClick={() => setCollapsed(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Fechar barra lateral"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 18 5 12 11 6" />
                  <polyline points="17 18 11 12 17 6" />
                </svg>
              </button>
            </div>
          )}

          {/* COLAPSADO: logo com seta » no hover */}
          {collapsed && (
            <div className="relative w-10 h-10 group/logo">
              <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm transition-opacity duration-200 group-hover/logo:opacity-0 pointer-events-none">
                <img src="/images/Logo2.png" alt="Txopela Tour" className="w-full h-full object-contain" />
              </div>
              <button
                onClick={() => setCollapsed(false)}
                className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover/logo:opacity-100 transition-all duration-200 hover:bg-gray-100"
                title="Abrir barra lateral"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="7 18 13 12 7 6" />
                  <polyline points="13 18 19 12 13 6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="mx-3 mb-2" style={{ height: 1, background: 'rgba(0,0,0,0.05)' }} />

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5">
          {navItems.map(nav => {
            const active = section === nav.id;
            return (
              <motion.button key={nav.id} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (nav.id === 'perfil') {
                    setSection('perfil');
                    if (!profileData) loadProfile();
                  } else {
                    setSection(nav.id as Section);
                  }
                }}
                title={collapsed ? nav.label : undefined}
                className="w-full flex items-center rounded-xl text-sm transition-all hover:bg-opacity-100"
                style={{ 
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? `rgba(0,119,182,0.1)` : 'transparent',
                  color: active ? BLUE : '#475569', 
                  fontWeight: active ? 700 : 500 
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(0,119,182,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}>
                <span className="flex-shrink-0">{nav.icon}</span>
                {!collapsed && (
                  <motion.span
                    key={`${nav.id}-label`}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 text-left whitespace-nowrap overflow-hidden"
                  >
                    {nav.label}
                  </motion.span>
                )}
                {!collapsed && (nav.count ?? 0) > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ background: '#EF4444' }}>{nav.count}</span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="mx-3 my-2" style={{ height: 1, background: 'rgba(0,0,0,0.05)' }} />

        {/* Logout */}
        <div className="px-2 pb-5">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
            title={collapsed ? 'Sair' : undefined}
            className="w-full flex items-center rounded-xl text-sm font-bold transition-all"
            style={{
              gap: collapsed ? 0 : 12,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: '#DC2626', background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
              e.currentTarget.style.color = '#B91C1C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#DC2626';
            }}>
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && (
              <motion.span
                key="logout-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="whitespace-nowrap"
              >
                Sair
              </motion.span>
            )}
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Conteúdo principal ───────────────────────────────────────── */}
      <motion.main
        className="flex-1 overflow-y-auto"
        animate={{ marginLeft: W }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ padding: '32px 36px' }}>

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-left" style={{ color: GRAY_900, letterSpacing: '-0.02em' }}>
              {navItems.find(n => n.id === section)?.label}
            </h1>
            {pendingAll > 0 && section !== 'historico' && (
              <p className="flex items-center gap-1.5 text-xs font-semibold mt-1"
                style={{ color: '#D97706' }}>
                <AlertTriangle size={12} />
                {pendingAll} {pendingAll === 1 ? 'publicação pendente' : 'publicações pendentes'} de revisão
              </p>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.96 }} onClick={loadAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ border: `1.5px solid ${GRAY_200}`, background: WHITE, color: GRAY_700,
              cursor: loading ? 'not-allowed' : 'pointer' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'apd-spin 1s linear infinite' : 'none' }} />
            Actualizar
          </motion.button>
        </div>

        {/* Erro API */}
        {error && (
          <div className="rounded-2xl p-5 mb-6 flex items-start gap-4"
            style={{ background: '#FFF8F8', border: '1px solid #FECACA' }}>
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-red-50">
              <AlertCircle size={18} color="#DC2626" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold mb-0.5" style={{ color: '#991B1B' }}>
                {error.includes('403') || error.includes('permissão') ? 'Sem permissão (403)' : 'Erro do servidor'}
              </p>
              <p className="text-xs" style={{ color: '#B91C1C' }}>{error}</p>
            </div>
            <button onClick={loadAll} className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ border: '1px solid #FECACA', background: WHITE, color: '#DC2626', cursor: 'pointer' }}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${BRAND}10` }}>
              <Loader2 size={26} color={BRAND} style={{ animation: 'apd-spin 1s linear infinite' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: GRAY_400 }}>A carregar dados…</p>
          </div>
        ) : (
          <>
            {/* VISÃO GERAL */}
            {section === 'visao' && (
              <div>
                <div className="grid gap-4 mb-8"
                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                  <StatCard label="Pendentes"        value={stats?.pending ?? pendingAll} color="#F59E0B" icon={<Clock size={20} />} />
                  <StatCard label="Aprovados"         value={stats?.approved ?? 0}         color="#10B981" icon={<CheckCircle size={20} />} />
                  <StatCard label="Rejeitados"        value={stats?.rejected ?? 0}          color="#EF4444" icon={<AlertCircle size={20} />} />
                  <StatCard label="Locais activos"    value={stats?.totalLocals ?? 0}       color={BRAND}   icon={<MapPin size={20} />} />
                  <StatCard label="Serviços activos"  value={stats?.totalServices ?? 0}     color={BLUE}    icon={<Briefcase size={20} />} />
                </div>

                {pendingAll > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-black" style={{ color: GRAY_900 }}>Pendentes de revisão</h2>
                      {pendingAll > 5 && (
                        <button onClick={() => setSection('locais')}
                          className="flex items-center gap-1 text-sm font-bold"
                          style={{ color: BLUE, background: 'none', border: 'none', cursor: 'pointer' }}>
                          Ver todos ({pendingAll}) <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                    {[...pendingLocals.slice(0, 3), ...pendingServices.slice(0, 2)].map(item => (
                      <ItemRow key={item.id} item={item} onDetail={setDetailItem}
                        onQuickAction={(id, a) => handleAction(id, a, '')} acting={acting} />
                    ))}
                  </div>
                ) : !error && (
                  <EmptyState
                    icon={<CheckCircle size={26} color="#10B981" />}
                    title="Tudo em dia!"
                    subtitle="Não há publicações pendentes de revisão."
                  />
                )}
              </div>
            )}

            {/* LOCAIS */}
            {section === 'locais' && (
              pendingLocals.length === 0
                ? <EmptyState icon={<MapPin size={26} color={BRAND} />} title="Sem locais pendentes" subtitle="Todos os locais foram revistos." />
                : pendingLocals.map(item => (
                  <ItemRow key={item.id} item={item} onDetail={setDetailItem}
                    onQuickAction={(id, a) => handleAction(id, a, '')} acting={acting} />
                ))
            )}

            {/* SERVIÇOS */}
            {section === 'servicos' && (
              pendingServices.length === 0
                ? <EmptyState icon={<Briefcase size={26} color="#7C3AED" />} title="Sem serviços pendentes" subtitle="Todos os serviços foram revistos." />
                : pendingServices.map(item => (
                  <ItemRow key={item.id} item={item} onDetail={setDetailItem}
                    onQuickAction={(id, a) => handleAction(id, a, '')} acting={acting} />
                ))
            )}

            {/* HISTÓRICO */}
            {section === 'historico' && (
              history.length === 0
                ? <EmptyState icon={<Clock size={26} color={GRAY_400} />} title="Sem histórico" subtitle="Ainda não processaste nenhuma publicação." />
                : <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold" style={{ color: GRAY_500 }}>
                        {history.length} {history.length === 1 ? 'publicação processada' : 'publicações processadas'}
                      </p>
                    </div>
                    {history.map(item => {
                      const st = statusStyle(item.status);
                      const tc = typeColor(item.type);
                      return (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl p-4 mb-3 flex items-center gap-4 shadow-sm"
                          style={{ border: `1px solid ${GRAY_200}` }}>
                          <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ background: `${tc}10`, color: tc }}>
                            {typeIconEl(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-black truncate" style={{ color: GRAY_900 }}>{item.name}</p>
                              <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full"
                                style={{ background: st.bg, color: st.color }}>
                                {statusLabel(item.status)}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: GRAY_400 }}>
                              {item.type === 'local' ? 'Local' : item.type === 'service' ? 'Serviço' : 'Post'}
                              {item.category !== '—' && ` · ${item.category}`}
                              {item.province !== '—' && ` · ${item.province}`}
                              {' · '}{item.submittedAt}
                            </p>
                          </div>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDetailItem(item)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                            style={{ border: `1.5px solid ${GRAY_200}`, background: WHITE, color: GRAY_700, cursor: 'pointer' }}>
                            <Eye size={13} /> Ver
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
            )}

            {/* PERFIL */}
            {section === 'perfil' && (
              <div>
                {!profileData ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${BLUE}10` }}>
                      <Loader2 size={26} color={BLUE} style={{ animation: 'apd-spin 1s linear infinite' }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: GRAY_400 }}>A carregar perfil…</p>
                  </div>
                ) : (
                  <div style={{ maxWidth: 900 }}>

                    {/* Card principal */}
                    <div className="bg-white rounded-2xl shadow-sm mb-6" style={{ border: `1px solid ${GRAY_200}` }}>
                      <div className="p-8">
                        <div className="flex items-start gap-8">
                          {/* Avatar */}
                          <div className="flex-shrink-0 relative">
                            <div className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center text-white text-4xl font-black relative"
                              style={{ background: 'linear-gradient(135deg,#1B5E3B,#2BB5C8)' }}>
                              {profileData.avatar
                                ? <img src={profileData.avatar} alt={profileData.name} className="w-full h-full object-cover" />
                                : (profileData.name || 'A').charAt(0).toUpperCase()}
                              {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <Loader2 size={22} color="white" style={{ animation: 'apd-spin 1s linear infinite' }} />
                                </div>
                              )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer"
                              style={{ border: `2px solid ${GRAY_200}` }}>
                              <Camera size={15} color={GRAY_700} />
                              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                            </label>
                          </div>
                          {/* Dados */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h1 className="text-2xl font-black mb-2" style={{ color: GRAY_900 }}>
                                  {profileData.name || 'Sem nome'}
                                </h1>

                              </div>
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => setSection('edit-profile')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold flex-shrink-0"
                                style={{
                                  border: `1.5px solid ${BLUE}`,
                                  background: `${BLUE}08`,
                                  color: BLUE,
                                  cursor: 'pointer',
                                }}>
                                <Edit3 size={15} />
                                Editar Perfil
                              </motion.button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <Mail size={16} color={GRAY_500} />
                                <span className="text-sm font-semibold" style={{ color: GRAY_700 }}>{profileData.email}</span>
                              </div>
                              {profileData.phone && (
                                <div className="flex items-center gap-2.5">
                                  <Phone size={16} color={GRAY_500} />
                                  <span className="text-sm font-semibold" style={{ color: GRAY_700 }}>{profileData.phone}</span>
                                </div>
                              )}
                              {profileData.createdAt && (
                                <div className="flex items-center gap-2.5">
                                  <Calendar size={16} color={GRAY_500} />
                                  <span className="text-sm font-semibold" style={{ color: GRAY_700 }}>
                                    Membro desde {new Date(profileData.createdAt).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {profileData.bio && (
                          <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${GRAY_200}` }}>
                            <div className="flex items-start gap-2.5">
                              <FileText size={16} color={GRAY_500} style={{ marginTop: 2, flexShrink: 0 }} />
                              <p className="text-sm leading-relaxed" style={{ color: GRAY_700 }}>{profileData.bio}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grid estatisticas + conta */}
                    <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 300px' }}>
                      <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: `1px solid ${GRAY_200}` }}>
                        <div className="flex items-center gap-3 mb-6">
                          <BarChart3 size={22} color={BLUE} />
                          <h3 className="text-lg font-black" style={{ color: GRAY_900 }}>Estatísticas de Atividade</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Posts Criados',    value: profileData.stats?.postsCount     ?? 0, color: BLUE,      icon: <FileText size={20} /> },
                            { label: 'Locais Sugeridos', value: profileData.stats?.localsCount    ?? 0, color: BRAND,     icon: <MapPin size={20} /> },
                            { label: 'Serviços',   value: profileData.stats?.servicesCount  ?? 0, color: '#F59E0B', icon: <Briefcase size={20} /> },
                            { label: 'Seguidores',       value: profileData.stats?.followersCount ?? 0, color: '#10B981', icon: <Users size={20} /> },
                          ].map(({ label, value, color, icon }) => (
                            <motion.div key={label} whileHover={{ scale: 1.02 }}
                              className="p-5 rounded-xl"
                              style={{ background: `${color}06`, border: `1px solid ${color}20` }}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                  style={{ background: `${color}15`, color }}>
                                  {icon}
                                </div>
                                <TrendingUp size={14} color={color} />
                              </div>
                              <p className="text-3xl font-black mb-1" style={{ color: GRAY_900 }}>{value}</p>
                              <p className="text-xs font-semibold" style={{ color: GRAY_500 }}>{label}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: `1px solid ${GRAY_200}` }}>
                        <div className="flex items-center gap-3 mb-6">
                          <Shield size={22} color={BLUE} />
                          <h3 className="text-lg font-black" style={{ color: GRAY_900 }}>Conta</h3>
                        </div>
                        <div className="space-y-5">
                          <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${GRAY_200}` }}>
                            <div className="flex items-center gap-2.5">
                              <CheckCircle size={17} color="#10B981" />
                              <span className="text-sm font-semibold" style={{ color: GRAY_500 }}>Status</span>
                            </div>
                            <span className="text-sm font-bold px-2.5 py-1 rounded-full"
                              style={{ background: '#ECFDF5', color: '#059669' }}>Ativa</span>
                          </div>
                          <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${GRAY_200}` }}>
                            <div className="flex items-center gap-2.5">
                              <Mail size={17} color={profileData.emailVerified ? '#10B981' : '#EF4444'} />
                              <span className="text-sm font-semibold" style={{ color: GRAY_500 }}>Email</span>
                            </div>
                            <span className="text-sm font-bold"
                              style={{ color: profileData.emailVerified ? '#10B981' : '#EF4444' }}>
                              {profileData.emailVerified ? 'Verificado' : 'Pendente'}
                            </span>
                          </div>
                          {profileData.role && (
                            <div className="flex items-center justify-between py-3">
                              <div className="flex items-center gap-2.5">
                                <Award size={17} color={BLUE} />
                                <span className="text-sm font-semibold" style={{ color: GRAY_500 }}>Cargo</span>
                              </div>
                              <span className="text-sm font-bold capitalize" style={{ color: BLUE }}>
                                {profileData.role === 'curator' ? 'Aprovador' :
                                 profileData.role === 'admin'   ? 'Administrador' :
                                 profileData.role}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
          </>
        )}
      </motion.main>

      {/* Modais */}
      <AnimatePresence>
        {detailItem && (
          <PublicationDetailModal
            id={detailItem.id}
            type={detailItem.type === 'post' ? 'post' : detailItem.type === 'service' ? 'service' : 'local'}
            displayName={detailItem.name}
            onClose={() => setDetailItem(null)}
            onAction={handleAction}
            acting={acting}
          />
        )}
      </AnimatePresence>

      {/* Toast — mesmo estilo da app */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.95 }}
            className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-white text-sm font-black z-50 shadow-2xl whitespace-nowrap"
            style={{ background: toast.ok ? 'linear-gradient(135deg,#0F4C2A,#1B7A45)' : 'linear-gradient(135deg,#991B1B,#DC2626)' }}>
            {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes apd-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
