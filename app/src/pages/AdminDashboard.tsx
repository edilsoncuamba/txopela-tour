import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE, extractImages } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MapPin, Users, Briefcase, BarChart2,
  Check, X, Eye, LogOut, RefreshCw, Loader2, AlertCircle, CheckCircle,
} from 'lucide-react';
import { adminApi, localsApi, servicesApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { translateStatus, translateLocalCategory, translateServiceCategory } from '@/utils/translations';
import { useScrollTop } from '@/hooks/useScrollTop';

const P  = '#1B5E3B';
const A  = '#2BB5C8';
const BG = '#F8FAFC';
const W  = '#FFFFFF';
const G1 = '#F3F4F6';
const G2 = '#E5E7EB';
const G5 = '#6B7280';
const G6 = '#4B5563';
const G8 = '#1F2937';

type Section = 'overview' | 'locals' | 'services' | 'users';

function statusColor(s: string) {
  const m: Record<string, { color: string; bg: string }> = {
    approved: { color: '#065F46', bg: '#D1FAE5' },
    pending:  { color: '#92400E', bg: '#FEF3C7' },
    rejected: { color: '#991B1B', bg: '#FEE2E2' },
  };
  return m[s?.toLowerCase()] ?? { color: G6, bg: G1 };
}

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: W, borderRadius: 14, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 800, color: G8, margin: 0 }}>{value}</p>
        <p style={{ fontSize: 11, color: G5, margin: '2px 0 0 0', fontWeight: 600 }}>{label}</p>
      </div>
    </div>
  );
}

interface AdminDashboardProps { onLogout?: () => void; }

export default function AdminDashboard({
  onLogout }: AdminDashboardProps) {
  useScrollTop();
  const { user, logout } = useAuth();
  const [section, setSection] = useState<Section>('overview');
  const [locals,  setLocals]  = useState<any[]>([]);
  const [services,setServices]= useState<any[]>([]);
  const [users,   setUsers]   = useState<any[]>([]);
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsR, locR, svcR, usersR] = await Promise.all([
        adminApi.getStats(),
        localsApi.list({ limit: 50 }),
        servicesApi.list({ limit: 50 }),
        adminApi.getUsers({ limit: 50 }),
      ]);
      if (statsR.data?.stats)     setStats(statsR.data.stats);
      if (locR.data?.locals)      setLocals(locR.data.locals);
      if (svcR.data?.services)    setServices(svcR.data.services);
      if (usersR.data?.users)     setUsers(usersR.data.users);
    } catch {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleApprove = async (id: string) => {
    setActing(true);
    const res = await adminApi.approve(id);
    if (res.error) { showToast(res.error, false); }
    else {
      setLocals(p => p.map(l => l.id === id ? { ...l, status: 'approved' } : l));
      setServices(p => p.map(s => s.id === id ? { ...s, status: 'approved' } : s));
      showToast('✅ Aprovado!');
      if (stats) setStats({ ...stats, pending: Math.max(0, stats.pending - 1), approved: stats.approved + 1 });
    }
    setActing(false);
  };

  const handleReject = async (id: string) => {
    setActing(true);
    const res = await adminApi.reject(id, 'Rejeitado pelo administrador.');
    if (res.error) { showToast(res.error, false); }
    else {
      setLocals(p => p.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
      setServices(p => p.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
      showToast('âŒ Rejeitado.', false);
      if (stats) setStats({ ...stats, pending: Math.max(0, stats.pending - 1), rejected: stats.rejected + 1 });
    }
    setActing(false);
  };

  const pendingLocals   = locals.filter(l => l.status === 'pending');
  const pendingServices = services.filter(s => s.status === 'pending');
  const pendingTotal    = pendingLocals.length + pendingServices.length;

  const nav: { id: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview',  label: 'Visão Geral', icon: <LayoutDashboard size={17} /> },
    { id: 'locals',    label: 'Locais',      icon: <MapPin size={17} />,    badge: pendingLocals.length },
    { id: 'services',  label: 'Serviços',    icon: <Briefcase size={17} />, badge: pendingServices.length },
    { id: 'users',     label: 'Utilizadores',icon: <Users size={17} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Nunito, sans-serif', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 210, background: W, borderRight: `1px solid ${G1}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '18px 16px', borderBottom: `1px solid ${G1}` }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: P, margin: 0 }}>Txopela Tour</p>
          <p style={{ fontSize: 11, color: G5, margin: '2px 0 0 0' }}>Administração</p>
        </div>
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                borderRadius: 9, border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                background: section === n.id ? P + '15' : 'transparent',
                color: section === n.id ? P : G5, fontWeight: section === n.id ? 700 : 600, fontSize: 13 }}>
              {n.icon} <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge != null && n.badge > 0 && (
                <span style={{ background: '#EF4444', color: W, borderRadius: 9, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{n.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: 14, borderTop: `1px solid ${G1}` }}>
          {user && <p style={{ fontSize: 12, fontWeight: 700, color: G8, margin: '0 0 8px 0' }}>{user.name}</p>}
          <button onClick={async () => { await logout(); onLogout?.(); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: G8, margin: 0 }}>
            {nav.find(n => n.id === section)?.label}
          </h1>
          <button onClick={loadAll} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${G2}`, background: W, color: G6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', borderRadius: 10, padding: 14, marginBottom: 18,
            display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertCircle size={16} color="#EF4444" />
            <p style={{ fontSize: 13, color: '#991B1B', margin: 0 }}>{error}</p>
            <button onClick={loadAll} style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 12, color: '#991B1B', background: 'none', border: 'none', cursor: 'pointer' }}>Tentar novamente</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 12 }}>
            <Loader2 size={30} color={P} className="animate-spin" />
            <p style={{ fontSize: 13, color: G5 }}>A carregar dados...</p>
          </div>
        ) : (
          <>
            {section === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 22 }}>
                  <StatCard label="Pendentes"  value={stats?.pending      ?? pendingTotal}                color="#D97706" icon={<BarChart2 size={20} />} />
                  <StatCard label="Aprovados"  value={stats?.approved     ?? locals.filter(l=>l.status==='approved').length} color="#059669" icon={<CheckCircle size={20} />} />
                  <StatCard label="Rejeitados" value={stats?.rejected     ?? 0}                           color="#DC2626" icon={<AlertCircle size={20} />} />
                  <StatCard label="Locais"     value={stats?.totalLocals  ?? locals.length}               color={P}       icon={<MapPin size={20} />} />
                  <StatCard label="Serviços"   value={stats?.totalServices?? services.length}             color={A}       icon={<Briefcase size={20} />} />
                  <StatCard label="Utilizadores" value={stats?.totalUsers ?? users.length}                color="#7C3AED" icon={<Users size={20} />} />
                </div>
                {pendingTotal > 0 && (
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: G8, margin: '0 0 12px 0' }}>Itens pendentes</h2>
                    {[...pendingLocals.slice(0,3), ...pendingServices.slice(0,2)].map(item => (
                      <div key={item.id} style={{ background: W, borderRadius: 11, padding: '11px 14px', marginBottom: 7,
                        border: `1px solid ${G1}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={extractImages(item)[0] ?? PLACEHOLDER_IMAGE} alt="" onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER_IMAGE}}
                          style={{ width: 50, height: 50, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: G8, margin: 0 }}>{item.name || item.title}</p>
                          <p style={{ fontSize: 11, color: G5, margin: '2px 0 0 0' }}>{translateLocalCategory(item.category)} · {item.province || item.location?.province || '—'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button disabled={acting} onClick={() => handleApprove(item.id)}
                            style={{ padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#D1FAE5', color: '#065F46', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={13} /> Aprovar
                          </button>
                          <button disabled={acting} onClick={() => handleReject(item.id)}
                            style={{ padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <X size={13} /> Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {pendingTotal === 0 && (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <CheckCircle size={44} color="#22C55E" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: G8, margin: 0 }}>Tudo em dia!</p>
                    <p style={{ fontSize: 12, color: G5, marginTop: 4 }}>Sem itens pendentes de aprovação.</p>
                  </div>
                )}
              </div>
            )}

            {(section === 'locals' || section === 'services') && (
              <div>
                {(section === 'locals' ? locals : services).map((item: any) => {
                  const st = statusColor(item.status);
                  return (
                    <div key={item.id} style={{ background: W, borderRadius: 11, padding: '11px 14px', marginBottom: 7,
                      border: `1px solid ${G1}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={extractImages(item)[0] ?? PLACEHOLDER_IMAGE} alt="" onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER_IMAGE}}
                        style={{ width: 50, height: 50, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: G8, margin: 0 }}>{item.name || item.title}</p>
                          <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                            {translateStatus(item.status)}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: G5, margin: '2px 0 0 0' }}>
                          {section === 'locals'
                            ? translateLocalCategory(item.category)
                            : translateServiceCategory(item.category)
                          } · {item.province || item.location?.province || '—'}
                        </p>
                      </div>
                      {(item.status === 'pending') && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button disabled={acting} onClick={() => handleApprove(item.id)}
                            style={{ padding: '5px 9px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#D1FAE5', color: '#065F46', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Check size={12} />
                          </button>
                          <button disabled={acting} onClick={() => handleReject(item.id)}
                            style={{ padding: '5px 9px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(section === 'locals' ? locals : services).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: G5 }}>Sem dados disponíveis.</p>
                  </div>
                )}
              </div>
            )}

            {section === 'users' && (
              <div>
                {users.map((u: any) => (
                  <div key={u.id} style={{ background: W, borderRadius: 11, padding: '11px 14px', marginBottom: 7,
                    border: `1px solid ${G1}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${P}, ${A})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: W }}>
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: G8, margin: 0 }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: G5, margin: '2px 0 0 0' }}>{u.email} · {u.role}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: u.is_active !== false ? '#D1FAE5' : '#F3F4F6',
                      color: u.is_active !== false ? '#065F46' : G6 }}>
                      {u.is_active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
                {users.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: G5 }}>Sem utilizadores.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)',
              background: toast.ok ? '#065F46' : '#991B1B', color: W, padding: '10px 22px',
              borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 200, boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


