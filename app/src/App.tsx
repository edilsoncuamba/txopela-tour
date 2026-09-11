import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';

// ── Transições padrão — usadas em todo o App ──────────────────────────────────
// Ecrãs de detalhe (desktop): fade + deslize subtil para cima
const TX = { duration: 0.2, ease: 'easeOut' } as const;
// Props standard para motion.div de ecrã completo
const SCREEN_ANIM = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: 6 },
  transition: TX,
} as const;

// Contexts
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { TourismProvider } from '@/context/TourismContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

// Components
import BottomNav from '@/components/BottomNav';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages — Auth
import Login from '@/pages/Login';
import LoginAdmin from '@/pages/LoginAdmin';
import LoginApurador from '@/pages/LoginApurador';

// Pages — App
import SplashScreen from '@/pages/SplashScreen';
import Onboarding from '@/pages/Onboarding';
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import ForgotPassword from '@/pages/ForgotPassword';
import OAuthCallback from '@/pages/OAuthCallback';
import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import AddLocal from '@/pages/AddLocal';
import AddPost from '@/pages/AddPost';
import AddService from '@/pages/AddService';
import Map from '@/pages/Map';
import Profile from '@/pages/Profile';
import LocalDetail from '@/pages/LocalDetail';
import Favorites from '@/pages/Favorites';
import Notifications from '@/pages/Notifications';
import Chatbot from '@/pages/Chatbot';
import SmartSearch from '@/pages/SmartSearch';
import Settings from '@/pages/Settings';
import Bookings from '@/pages/Bookings';
import BookingForm from '@/pages/BookingForm';
import Chat from '@/pages/Chat';
import { CultureModule } from '@/modules/culture';
import AdminDashboard from '@/pages/AdminDashboard';
import ApuradorDashboard from '@/pages/ApuradorDashboard';
import EditProfile from '@/pages/EditProfile';
import NotificationSettings from '@/pages/NotificationSettings';
import PrivacySettings from '@/pages/PrivacySettings';
import PublicProfile from '@/pages/PublicProfile';
import EditPost from '@/pages/EditPost';
// Approver legacy removido — usar ApuradorDashboard

// Types
import type { Local, TabType } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Ecrã de acesso não autorizado
// ─────────────────────────────────────────────────────────────────────────────
function UnauthorizedScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#F8FAFC', fontFamily: 'Nunito, sans-serif' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: '#FEE2E2' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h2 className="text-lg font-black mb-2" style={{ color: '#1A1A1A' }}>Acesso não autorizado</h2>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>{message}</p>
      <button onClick={onBack}
        className="px-6 py-3 rounded-2xl text-white font-black text-sm"
        style={{ background: '#1B5E3B' }}>
        Voltar ao login
      </button>
    </div>
  );
}

// App Content Component
function AppContent() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  
  // ── Determinar painel activo via URL hash ──────────────────────────────────
  // #admin       → painel admin
  // #apurador    → painel aprovador
  // (sem hash)   → app normal
  const getInitialPortal = (): 'app' | 'admin' | 'apurador' => {
    const hash = window.location.hash;
    if (hash === '#admin')    return 'admin';
    if (hash === '#apurador') return 'apurador';
    return 'app';
  };
  const [portal, setPortal] = useState<'app' | 'admin' | 'apurador'>(getInitialPortal);

  // Actualiza portal quando o hash muda
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin')    setPortal('admin');
      else if (hash === '#apurador') setPortal('apurador');
      else setPortal('app');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  
  // Check if we're on an OAuth callback page
  const isOAuthCallback = window.location.pathname.includes('/auth/');
  
  // App State
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // loginMode: qual formulário de login mostrar
  const [loginMode, setLoginMode] = useState<'user' | 'admin' | 'apurador'>(() => {
    if (portal === 'admin') return 'admin';
    if (portal === 'apurador') return 'apurador';
    return 'user';
  });
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  
  // Estado de acesso negado
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // Navigation State
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [previousTab, setPreviousTab] = useState<TabType>('home');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [showSmartSearch, setShowSmartSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [bookingLocal, setBookingLocal] = useState<Local | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<{ id: string; name: string; avatar?: string; type: string } | null>(null);
  const [showCulture, setShowCulture] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('txopela_onboarding', 'true');
  }, []);

  // ── Após login bem-sucedido, redireciona conforme role ────────────────────
  // O AuthContext actualiza `user` — quando muda e estamos autenticados,
  // verificamos o role e navegamos para o portal correcto
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const role = user.role || '';

    // Painel admin
    if (loginMode === 'admin') {
      if (role === 'admin') {
        setPortal('admin');
      } else {
        setAccessDenied(`A tua conta tem role "${role}". O painel admin requer role "admin".`);
        logout();
      }
      return;
    }

    // Painel apurador
    if (loginMode === 'apurador') {
      if (role === 'curator' || role === 'admin') {
        setPortal('apurador');
      } else {
        setAccessDenied(`A tua conta tem role "${role}". O painel do aprovador requer role "curator" ou "admin".`);
        logout();
      }
      return;
    }

    // App normal — bloqueia admin/curator de entrar no app normal
    if (loginMode === 'user') {
      if (role === 'admin') {
        setPortal('admin');
      } else if (role === 'curator') {
        setPortal('apurador');
      }
      // Outros roles (tourist, guide, business, etc.) ficam no app normal
    }
  }, [isAuthenticated, user, loginMode]);

  // Actualiza loginMode quando portal muda (sincroniza os dois)
  useEffect(() => {
    if (portal === 'admin')    setLoginMode('admin');
    else if (portal === 'apurador') setLoginMode('apurador');
    else setLoginMode('user');
  }, [portal]);

  const handleLogout = async () => {
    await logout();
    setAccessDenied(null);
    setPortal('app');
    setLoginMode('user');
    window.location.hash = '';
    setShowFavorites(false);
    setShowNotifications(false);
    setShowSettings(false);
    setSelectedAuthor(null);
    setActiveTab('home');
  };

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    if (tab === 'culture') {
      setShowCulture(true);
      return;
    }
    setShowCulture(false);
    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  // Handle local press
  const handleLocalPress = (local: Local) => {
    setPreviousTab(activeTab);
    setSelectedLocal(local);
  };

  // Handle back from local detail
  const handleBackFromDetail = () => {
    setSelectedLocal(null);
    setActiveTab(previousTab);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#1B5E3B]/30 border-t-[#1B5E3B] rounded-full animate-spin" />
      </div>
    );
  }

  // OAuth callback
  if (isOAuthCallback) {
    return <OAuthCallback />;
  }

  // ── PAINEL ADMIN ────────────────────────────────────────────────────────────
  if (portal === 'admin') {
    if (!isAuthenticated) {
      return (
        <LoginAdmin
          onSuccess={() => { /* tratado no useEffect de role */ }}
          onWrongRole={() => setAccessDenied('Não possui permissão para este painel.')}
        />
      );
    }
    return (
      <ProtectedRoute
        requiredRole="admin"
        onUnauthorized={(reason) => {
          const msg = reason === 'no_token'
            ? 'Sessão expirada. Faz login novamente.'
            : 'Acesso não autorizado para este painel. Requer role "admin".';
          setAccessDenied(msg);
          if (reason === 'no_token') logout();
        }}
      >
        <AdminDashboard onLogout={handleLogout} />
      </ProtectedRoute>
    );
  }

  // ── PAINEL APURADOR ─────────────────────────────────────────────────────────
  if (portal === 'apurador') {
    if (!isAuthenticated) {
      return (
        <LoginApurador
          onSuccess={() => { /* tratado no useEffect de role */ }}
          onWrongRole={() => setAccessDenied('Não possui permissão para este painel.')}
        />
      );
    }
    return (
      <ProtectedRoute
        requiredRole="curator"
        onUnauthorized={(reason) => {
          const msg = reason === 'no_token'
            ? 'Sessão expirada. Faz login novamente.'
            : 'Acesso não autorizado para este painel. Requer role "curator" ou "admin".';
          setAccessDenied(msg);
          if (reason === 'no_token') logout();
        }}
      >
        <ApuradorDashboard onLogout={handleLogout} />
      </ProtectedRoute>
    );
  }

  // ── ECRÃ DE ACESSO NEGADO ───────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <UnauthorizedScreen
        message={accessDenied}
        onBack={() => {
          setAccessDenied(null);
          setPortal('app');
          setLoginMode('user');
          window.location.hash = '';
        }}
      />
    );
  }

  // Splash / Onboarding
  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (showOnboarding) return <Onboarding onComplete={() => { localStorage.setItem('txopela_onboarding', 'true'); setShowOnboarding(false); }} />;

  // ── AUTH SCREENS (app normal) ───────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        {authScreen === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Login
              onLogin={() => { /* tratado no useEffect de role */ }}
              onRegister={() => setAuthScreen('register')}
              onForgotPassword={() => setAuthScreen('forgot')}
            />
          </motion.div>
        )}
        {authScreen === 'register' && (
          <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Register onRegister={() => { }} onBack={() => setAuthScreen('login')}
              onOTPRequired={(email) => { setVerifyEmail(email); setAuthScreen('verify'); }} />
          </motion.div>
        )}
        {authScreen === 'verify' && verifyEmail && (
          <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <VerifyEmail email={verifyEmail} onVerified={() => { setVerifyEmail(null); setAuthScreen('login'); }}
              onBack={() => setAuthScreen('login')} />
          </motion.div>
        )}
        {authScreen === 'forgot' && (
          <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ForgotPassword onBack={() => setAuthScreen('login')} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── DESKTOP LAYOUT ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex min-h-screen" style={{ background: '#F8F9FB' }}>

        {/* Sidebar colapsável */}
        {(()=> {
          const collapsed = sidebarCollapsed;
          const setCollapsed = setSidebarCollapsed;
          const W = collapsed ? 64 : 240;
          return (
            <motion.aside
              animate={{ width: W }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 h-full z-40 flex flex-col overflow-hidden group"
              style={{
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(24px)',
                borderRight: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.04)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {/* Topo: Logo + Txopela Tour (fora do home) + Hamburger */}
              <div className="flex items-center px-4 pt-4 pb-3"
                style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>

                {/* EXPANDIDO */}
                {!collapsed && (
                  <>
                    {/* Logo + texto + botão fechar — gap uniforme entre os 3 */}
                    <div className="flex items-center gap-2.5 flex-1">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                        <img src="/images/Logo2.png" alt="Txopela Tour" className="w-full h-full object-contain" />
                      </div>
                      {/* Texto — visível fora do home, invisível no home (mantém espaço) */}
                      <span
                        className="text-lg font-black whitespace-nowrap leading-normal flex-1"
                        style={{
                          fontFamily: 'Pacifico, cursive',
                          color: '#0077B6',
                          opacity: (activeTab === 'home' && !showCulture) ? 0 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        Txopela Tour
                      </span>

                      {/* Seta fechar (aponta à esquerda ««) */}
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
                  </>
                )}

                {/* COLAPSADO: logo + botão abrir sempre visível no hover */}
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

              {/* Divider */}
              <div className="mx-3 mb-2" style={{ height: 1, background: 'rgba(0,0,0,0.05)' }} />

              {/* Nav items — ordem: Início, Cultura, Mapa, Favoritos, Perfil, Sugerir */}
              <nav className="flex-1 px-2 space-y-0.5">
                {(() => {
                  const isBusiness = user?.type === 'business' || user?.type === 'guide';
                  const sugerirLabel = isBusiness ? 'Sugerir serviço' : 'Sugerir local';

                  // Itens principais unificados (inclui Cultura na posição correcta)
                  const allItems: { key: string; label: string; onClick: () => void; isActive: () => boolean; icon: (a: boolean) => React.ReactNode }[] = [
                    {
                      key: 'home',
                      label: 'Início',
                      onClick: () => { setShowCulture(false); handleTabChange('home'); },
                      isActive: () => !showCulture && activeTab === 'home',
                      icon: (a) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#0077B6' : '#64748B'} strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
                    },
                    {
                      key: 'culture',
                      label: 'Cultura',
                      onClick: () => setShowCulture(true),
                      isActive: () => showCulture,
                      icon: (a) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#0077B6' : '#64748B'} strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
                    },
                    {
                      key: 'map',
                      label: 'Mapa',
                      onClick: () => { setShowCulture(false); handleTabChange('map'); },
                      isActive: () => !showCulture && activeTab === 'map',
                      icon: (a) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#0077B6' : '#64748B'} strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
                    },
                    {
                      key: 'explore',
                      label: 'Favoritos',
                      onClick: () => { setShowCulture(false); handleTabChange('explore'); },
                      isActive: () => !showCulture && activeTab === 'explore',
                      icon: (a) => <svg width="18" height="18" viewBox="0 0 24 24" fill={a ? '#0077B6' : 'none'} stroke={a ? '#0077B6' : '#64748B'} strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
                    },
                    {
                      key: 'profile',
                      label: 'Perfil',
                      onClick: () => { setShowCulture(false); handleTabChange('profile'); },
                      isActive: () => !showCulture && activeTab === 'profile',
                      icon: (a) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#0077B6' : '#64748B'} strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                    },
                  ];

                  return (
                    <>
                      {allItems.map(item => {
                        const active = item.isActive();
                        return (
                          <motion.button key={item.key}
                            onClick={item.onClick}
                            whileTap={{ scale: 0.97 }}
                            title={collapsed ? item.label : undefined}
                            className="w-full flex items-center rounded-xl transition-all"
                            style={{
                              gap: collapsed ? 0 : 12,
                              padding: collapsed ? '10px 0' : '10px 12px',
                              justifyContent: collapsed ? 'center' : 'flex-start',
                              background: active ? 'rgba(0,119,182,0.1)' : 'transparent',
                              color: active ? '#0077B6' : '#475569',
                              fontWeight: active ? 600 : 500,
                            }}>
                            <span className="flex-shrink-0">{item.icon(active)}</span>
                            <AnimatePresence>
                              {!collapsed && (
                                <motion.span
                                  key={`${item.key}-label`}
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="text-sm whitespace-nowrap overflow-hidden">
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}

                      {/* Divider antes do Sugerir */}
                      <div className="my-2 mx-1" style={{ height: 1, background: 'rgba(0,0,0,0.05)' }} />

                      {/* Sugerir local / serviço */}
                      <motion.button onClick={() => { setShowCulture(false); handleTabChange('add'); }} whileTap={{ scale: 0.97 }}
                        title={collapsed ? sugerirLabel : undefined}
                        className="w-full flex items-center rounded-xl text-white"
                        style={{
                          gap: collapsed ? 0 : 10,
                          padding: collapsed ? '10px 0' : '10px 12px',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)',
                          boxShadow: '0 2px 10px rgba(15,76,42,0.3)',
                        }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        {!collapsed && (
                          <motion.span
                            key="sugerir-label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.18 }}
                            className="text-sm font-semibold whitespace-nowrap">
                            {sugerirLabel}
                          </motion.span>
                        )}
                      </motion.button>
                    </>
                  );
                })()}
              </nav>

              {/* Bottom — logout */}
              <div className="px-2 pb-5 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <motion.button onClick={handleLogout} whileTap={{ scale: 0.97 }}
                  title={collapsed ? 'Sair' : undefined}
                  className="w-full flex items-center rounded-xl hover:bg-red-50 transition-all"
                  style={{
                    gap: collapsed ? 0 : 12,
                    padding: collapsed ? '10px 0' : '10px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {!collapsed && (
                    <motion.span
                      key="logout-label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-bold whitespace-nowrap" style={{ color: '#DC2626' }}>
                      Sair
                    </motion.span>
                  )}
                </motion.button>
              </div>
            </motion.aside>
          );
        })()}

        {/* Main content */}
        <motion.main
          animate={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="flex-1 min-h-screen overflow-y-auto relative"
        >
          <AnimatePresence mode="wait">
            {!selectedLocal && !showFavorites && !showNotifications && !showChatbot && !showSmartSearch && !showSettings && !showEditProfile && !showProfileView && !showNotificationSettings && !showPrivacySettings && !showBookings && !bookingLocal && !showChat && !selectedAuthor && !showCulture && !showAddPost && !editPostId && activeTab !== 'add' && (
              <motion.div key={activeTab} {...SCREEN_ANIM}>
                {activeTab === 'home' && <Home refreshKey={homeRefreshKey} sidebarCollapsed={sidebarCollapsed} onLocalPress={handleLocalPress} onNotifications={() => setShowNotifications(true)} onChat={(query) => { if (query) setChatInitialQuery(query); setShowChatbot(true); }} onMyProfile={() => setActiveTab('profile')} onAuthorPress={(author) => setSelectedAuthor(author)} onEditPost={(postId) => setEditPostId(postId)} onCulture={() => setShowCulture(true)} />}
                {activeTab === 'explore' && <Favorites onLocalPress={handleLocalPress} onNotifications={() => setShowNotifications(true)} onChat={() => setShowChatbot(true)} />}
                {activeTab === 'map' && <Map onLocalPress={handleLocalPress} onBack={() => setActiveTab('home')} />}
                {activeTab === 'profile' && <Profile onSettings={() => setShowSettings(true)} onLocalPress={handleLocalPress} onLogout={handleLogout} onAddPost={() => setShowAddPost(true)} onEditProfile={() => setShowEditProfile(true)} onSuggest={() => setActiveTab('add')} />}
              </motion.div>
            )}
            {activeTab === 'add' && !selectedLocal && (
              <motion.div key="add" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {(user?.type === 'business' || user?.type === 'guide') ? (
                  <AddService onSuccess={() => { setHomeRefreshKey(prev => prev + 1); setActiveTab('home'); }} onBack={() => setActiveTab('home')} />
                ) : (
                  <AddLocal onSuccess={() => { setHomeRefreshKey(prev => prev + 1); setActiveTab('home'); }} onBack={() => setActiveTab('home')} />
                )}
              </motion.div>
            )}
            {selectedLocal && <motion.div key="detail" {...SCREEN_ANIM}><LocalDetail local={selectedLocal} onBack={handleBackFromDetail} onAuthorPress={(author) => { setSelectedLocal(null); setSelectedAuthor(author); }} /></motion.div>}
            {showFavorites && <motion.div key="favorites" {...SCREEN_ANIM}><Favorites onLocalPress={handleLocalPress} onNotifications={() => { setShowFavorites(false); setShowNotifications(true); }} onChat={() => { setShowFavorites(false); setShowChatbot(true); }} /></motion.div>}
            {showNotifications && <motion.div key="notifications" {...SCREEN_ANIM}><Notifications onNotifications={() => setShowNotifications(false)} onChat={() => { setShowNotifications(false); setShowChatbot(true); }} /></motion.div>}
            {showChatbot && <motion.div key="chatbot" {...SCREEN_ANIM}><Chatbot onBack={() => { setShowChatbot(false); setChatInitialQuery(undefined); }} initialQuery={chatInitialQuery} /></motion.div>}
            {showEditProfile && <motion.div key="edit-profile" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-white overflow-y-auto"><EditProfile onBack={() => setShowEditProfile(false)} /></motion.div>}
            {showAddPost && <motion.div key="add-post" {...SCREEN_ANIM}><AddPost onBack={() => setShowAddPost(false)} onSuccess={() => { setShowAddPost(false); setHomeRefreshKey(prev => prev + 1); setActiveTab('home'); }} /></motion.div>}
            {editPostId && <motion.div key="edit-post" {...SCREEN_ANIM}><EditPost postId={editPostId} onBack={() => setEditPostId(null)} onSuccess={() => { setEditPostId(null); setHomeRefreshKey(prev => prev + 1); }} /></motion.div>}
            {showNotificationSettings && <motion.div key="notif-settings" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-white overflow-y-auto"><NotificationSettings onBack={() => setShowNotificationSettings(false)} /></motion.div>}
            {showPrivacySettings && <motion.div key="privacy" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-white overflow-y-auto"><PrivacySettings onBack={() => setShowPrivacySettings(false)} /></motion.div>}
            {showSettings && <div key="settings" className="fixed inset-0 bg-white overflow-y-auto" style={{ zIndex: 50 }}><Settings onBack={() => setShowSettings(false)} onLogout={handleLogout} onViewProfile={() => { setShowSettings(false); setActiveTab('profile'); }} onEditProfile={() => setShowEditProfile(true)} onNotifications={() => setShowNotificationSettings(true)} onPrivacy={() => setShowPrivacySettings(true)} /></div>}
            {showBookings && <motion.div key="bookings" {...SCREEN_ANIM}><Bookings onBack={() => setShowBookings(false)} onLocalPress={(local) => { setShowBookings(false); handleLocalPress(local); }} /></motion.div>}
            {bookingLocal && <motion.div key="booking-form" {...SCREEN_ANIM}><BookingForm local={bookingLocal} onBack={() => setBookingLocal(null)} onSuccess={() => { setBookingLocal(null); setShowBookings(true); }} /></motion.div>}
            {showChat && <motion.div key="chat" {...SCREEN_ANIM}><Chat onBack={() => setShowChat(false)} /></motion.div>}
            {selectedAuthor && <motion.div key="public-profile" {...SCREEN_ANIM}><PublicProfile author={selectedAuthor} onBack={() => setSelectedAuthor(null)} /></motion.div>}
            {showCulture && <motion.div key="culture" className="absolute inset-0 bg-white overflow-y-auto" {...SCREEN_ANIM}><CultureModule onBack={() => setShowCulture(false)} onAuthorPress={(author) => { setShowCulture(false); setSelectedAuthor(author); }} /></motion.div>}
          </AnimatePresence>
        </motion.main>
      </div>

      {/* ── MOBILE LAYOUT ──────────────────────────────────────────────────── */}
      <div className="md:hidden w-full bg-white min-h-screen shadow-xl">
        <AnimatePresence mode="wait">
          {!selectedLocal && !showFavorites && !showNotifications && !showChatbot && !showSmartSearch && !showSettings && !showEditProfile && !showProfileView && !showNotificationSettings && !showPrivacySettings && !showBookings && !bookingLocal && !showChat && !selectedAuthor && !showCulture && !showAddPost && !editPostId && activeTab !== 'add' && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'home' && (
                <Home
                  refreshKey={homeRefreshKey}
                  onLocalPress={handleLocalPress}
                  onNotifications={() => setShowNotifications(true)}
                  onChat={(query) => { if (query) setChatInitialQuery(query); setShowChatbot(true); }}
                  onMyProfile={() => setActiveTab('profile')}
                  onAuthorPress={(author) => setSelectedAuthor(author)}
                  onEditPost={(postId) => setEditPostId(postId)}
                  onCulture={() => setShowCulture(true)}
                />
              )}
              {activeTab === 'explore' && (
                <Favorites
                  onLocalPress={handleLocalPress}
                  onNotifications={() => setShowNotifications(true)}
                  onChat={() => setShowChatbot(true)}
                />
              )}
              {activeTab === 'map' && (
                <Map
                  onLocalPress={handleLocalPress}
                  onBack={() => setActiveTab('home')}
                />
              )}
              {activeTab === 'profile' && (
                <Profile
                  onSettings={() => setShowSettings(true)}
                  onLocalPress={handleLocalPress}
                  onLogout={handleLogout}
                  onAddPost={() => setShowAddPost(true)}
                  onEditProfile={() => setShowEditProfile(true)}
                  onSuggest={() => setActiveTab('add')}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'add' && !selectedLocal && (
            <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              {(user?.type === 'business' || user?.type === 'guide') ? (
                <AddService onSuccess={() => { setHomeRefreshKey(prev => prev + 1); setActiveTab('home'); }} onBack={() => setActiveTab('home')} />
              ) : (
                <AddLocal onSuccess={() => { setHomeRefreshKey(prev => prev + 1); setActiveTab('home'); }} onBack={() => setActiveTab('home')} />
              )}
            </motion.div>
          )}

          {selectedLocal && <motion.div key="detail" {...SCREEN_ANIM}><LocalDetail local={selectedLocal} onBack={handleBackFromDetail} onAuthorPress={(author) => { setSelectedLocal(null); setSelectedAuthor(author); }} /></motion.div>}
          {showFavorites && <motion.div key="favorites" {...SCREEN_ANIM}><Favorites onLocalPress={handleLocalPress} onNotifications={() => { setShowFavorites(false); setShowNotifications(true); }} onChat={() => { setShowFavorites(false); setShowChatbot(true); }} /></motion.div>}
          {showNotifications && <motion.div key="notifications" {...SCREEN_ANIM}><Notifications onNotifications={() => setShowNotifications(false)} onChat={() => { setShowNotifications(false); setShowChatbot(true); }} /></motion.div>}
          {showChatbot && <motion.div key="chatbot" {...SCREEN_ANIM}><Chatbot onBack={() => { setShowChatbot(false); setChatInitialQuery(undefined); }} initialQuery={chatInitialQuery} /></motion.div>}
          {showSmartSearch && <motion.div key="smartsearch" {...SCREEN_ANIM}><SmartSearch onBack={() => setShowSmartSearch(false)} onLocalPress={handleLocalPress} /></motion.div>}
          {showEditProfile && <motion.div key="edit-profile" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-white overflow-y-auto"><EditProfile onBack={() => setShowEditProfile(false)} /></motion.div>}
          {showAddPost && <motion.div key="add-post" {...SCREEN_ANIM}><AddPost onBack={() => setShowAddPost(false)} onSuccess={() => { setShowAddPost(false); setHomeRefreshKey(prev => prev + 1); setActiveTab('home'); }} /></motion.div>}
          {editPostId && <motion.div key="edit-post" {...SCREEN_ANIM}><EditPost postId={editPostId} onBack={() => setEditPostId(null)} onSuccess={() => { setEditPostId(null); setHomeRefreshKey(prev => prev + 1); }} /></motion.div>}
          {showNotificationSettings && <motion.div key="notif-settings" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-white overflow-y-auto"><NotificationSettings onBack={() => setShowNotificationSettings(false)} /></motion.div>}
          {showPrivacySettings && <motion.div key="privacy" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-white overflow-y-auto"><PrivacySettings onBack={() => setShowPrivacySettings(false)} /></motion.div>}
          {showSettings && <div key="settings" className="fixed inset-0 bg-white overflow-y-auto" style={{ zIndex: 50 }}><Settings onBack={() => setShowSettings(false)} onLogout={handleLogout} onViewProfile={() => { setShowSettings(false); setActiveTab('profile'); }} onEditProfile={() => setShowEditProfile(true)} onNotifications={() => setShowNotificationSettings(true)} onPrivacy={() => setShowPrivacySettings(true)} /></div>}
          {showBookings && <motion.div key="bookings" {...SCREEN_ANIM}><Bookings onBack={() => setShowBookings(false)} onLocalPress={(local) => { setShowBookings(false); handleLocalPress(local); }} /></motion.div>}
          {bookingLocal && <motion.div key="booking-form" {...SCREEN_ANIM}><BookingForm local={bookingLocal} onBack={() => setBookingLocal(null)} onSuccess={() => { setBookingLocal(null); setShowBookings(true); }} /></motion.div>}
          {showChat && <motion.div key="chat" {...SCREEN_ANIM}><Chat onBack={() => setShowChat(false)} /></motion.div>}
          {selectedAuthor && <motion.div key="public-profile" {...SCREEN_ANIM}><PublicProfile author={selectedAuthor} onBack={() => setSelectedAuthor(null)} /></motion.div>}
          {showCulture && <motion.div key="culture" className="fixed inset-0 z-40 bg-white overflow-y-auto" style={{ paddingBottom: 'max(72px, env(safe-area-inset-bottom))' }} {...SCREEN_ANIM}><CultureModule onBack={() => setShowCulture(false)} onAuthorPress={(author) => { setShowCulture(false); setSelectedAuthor(author); }} /></motion.div>}
        </AnimatePresence>

        {/* Bottom nav — mobile only */}
        {!selectedLocal && !showFavorites && !showNotifications && !showChatbot && !showSmartSearch && !showSettings && !showEditProfile && !showProfileView && !showNotificationSettings && !showPrivacySettings && !showBookings && !bookingLocal && !showChat && !selectedAuthor && !showAddPost && !editPostId && activeTab !== 'add' && (
          <BottomNav activeTab={showCulture ? 'culture' : activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </div>
  );
}

// Main App with Providers
function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <FavoritesProvider>
        <TourismProvider>
          <AppContent />
        </TourismProvider>
        </FavoritesProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
