import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Eye,
  MessageCircle,
  Trash2,
  Download,
  Shield,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useScrollTop } from '@/hooks/useScrollTop';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface PrivacySettingsProps {
  onBack: () => void;
}

type PrivacyValue = 'public' | 'followers' | 'private' | 'everyone' | 'nobody';

interface PrivacyOption {
  value: PrivacyValue;
  label: string;
  hint: string;
}

interface PrivacySetting {
  id: 'profile' | 'posts' | 'messages';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  colorDark: string;
  bgDark: string;
  currentValue: PrivacyValue;
  options: PrivacyOption[];
}

const STORAGE_KEY = 'txopela.privacy.prefs';

const DEFAULT_SETTINGS: Omit<PrivacySetting, 'icon'>[] = [
  {
    id: 'profile',
    label: 'Visibilidade do perfil',
    description: 'Quem pode ver o teu perfil público',
    color: '#3B82F6',
    bg: '#EFF6FF',
    colorDark: '#60A5FA',
    bgDark: 'rgba(59,130,246,0.15)',
    currentValue: 'public',
    options: [
      { value: 'public', label: 'Público', hint: 'Qualquer pessoa na Txopela' },
      { value: 'followers', label: 'Seguidores', hint: 'Só quem te segue' },
      { value: 'private', label: 'Só eu', hint: 'O perfil fica oculto' },
    ],
  },
  {
    id: 'posts',
    label: 'Visibilidade das publicações',
    description: 'Quem pode ver o que partilhas',
    color: '#10B981',
    bg: '#ECFDF5',
    colorDark: '#4ADE80',
    bgDark: 'rgba(74,222,128,0.12)',
    currentValue: 'public',
    options: [
      { value: 'public', label: 'Público', hint: 'Aparece no feed e na pesquisa' },
      { value: 'followers', label: 'Seguidores', hint: 'Só a tua comunidade' },
      { value: 'private', label: 'Só eu', hint: 'Guardado só para ti' },
    ],
  },
  {
    id: 'messages',
    label: 'Mensagens directas',
    description: 'Quem te pode enviar mensagens',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    colorDark: '#A78BFA',
    bgDark: 'rgba(139,92,246,0.15)',
    currentValue: 'everyone',
    options: [
      { value: 'everyone', label: 'Todos', hint: 'Qualquer utilizador autenticado' },
      { value: 'followers', label: 'Seguidores', hint: 'Só quem já te segue' },
      { value: 'nobody', label: 'Ninguém', hint: 'Desactiva mensagens novas' },
    ],
  },
];

function loadSavedValues(): Partial<Record<PrivacySetting['id'], PrivacyValue>> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function optionLabel(setting: PrivacySetting): string {
  return setting.options.find(o => o.value === setting.currentValue)?.label ?? '';
}

export default function PrivacySettings({ onBack }: PrivacySettingsProps) {
  useScrollTop();
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const titleId = useId();
  const confirmTitleId = useId();
  const confirmInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<PrivacySetting[]>(() => {
    const saved = loadSavedValues();
    return DEFAULT_SETTINGS.map(s => ({
      ...s,
      currentValue: saved[s.id] ?? s.currentValue,
      icon:
        s.id === 'profile' ? <Eye size={18} strokeWidth={2} /> :
        s.id === 'posts' ? <Shield size={18} strokeWidth={2} /> :
        <MessageCircle size={18} strokeWidth={2} />,
    }));
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [exportState, setExportState] = useState<'idle' | 'done' | 'error'>('idle');
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const persist = useCallback((next: PrivacySetting[]) => {
    const payload = Object.fromEntries(next.map(s => [s.id, s.currentValue]));
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* sessão sem storage — as escolhas ficam só em memória */
    }
  }, []);

  const handlePrivacyChange = (id: PrivacySetting['id'], newValue: PrivacyValue) => {
    setSettings(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, currentValue: newValue } : s));
      persist(next);
      return next;
    });
    setSavedFlash(true);
  };

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 1800);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  useEffect(() => {
    if (!showDeleteSheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDeleteSheet(false);
    };
    window.addEventListener('keydown', onKey);
    const focusTimer = window.setTimeout(() => confirmInputRef.current?.focus(), 220);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
    };
  }, [showDeleteSheet]);

  const handleExport = () => {
    try {
      const blob = new Blob(
        [JSON.stringify({
          exportedAt: new Date().toISOString(),
          source: 'Txopela Tour',
          profile: user
            ? {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                type: user.type,
                bio: user.bio,
                location: user.location,
                phone: user.phone,
              }
            : null,
          privacy: Object.fromEntries(settings.map(s => [s.id, s.currentValue])),
        }, null, 2)],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `txopela-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportState('done');
    } catch {
      setExportState('error');
    }
  };

  const canConfirmDelete = confirmText.trim().toUpperCase() === 'ELIMINAR';

  const handleConfirmDelete = async () => {
    if (!canConfirmDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await logout();
    } catch {
      setDeleteError('Não foi possível encerrar a sessão. Tenta novamente.');
      setIsDeleting(false);
    }
  };

  const surface = isDark ? '#1A1D27' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6';
  const text = isDark ? '#F0F4FF' : '#1A1A1A';
  const muted = isDark ? '#6B7A99' : '#6B7280';
  const faint = isDark ? '#6B7A99' : '#9CA3AF';

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: isDark ? '#0F1117' : '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
    >
      <motion.header
        className="px-4 py-4 flex items-center justify-between border-b sticky top-0 z-10"
        style={{
          background: isDark ? 'rgba(26,29,39,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: border,
          backdropFilter: 'blur(12px)',
        }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            type="button"
            aria-label="Voltar às definições"
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }}
          >
            <ChevronLeft size={22} color={isDark ? '#A8B4CC' : '#1A1A1A'} strokeWidth={2.5} />
          </motion.button>
          <div className="min-w-0">
            <h1 id={titleId} className="text-xl font-bold truncate" style={{ color: isDark ? '#F0F4FF' : '#111827' }}>
              Privacidade
            </h1>
            <p className="text-xs" style={{ color: faint }}>Dados e visibilidade</p>
          </div>
        </div>
        <AnimatePresence>
          {savedFlash && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              role="status"
              style={{
                background: isDark ? 'rgba(74,222,128,0.15)' : '#EEF7F0',
                color: isDark ? '#4ADE80' : '#1B5E3B',
              }}
            >
              Guardado
            </motion.p>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="px-4 pt-5 space-y-4 max-w-lg mx-auto" aria-labelledby={titleId}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex gap-3"
          style={{
            background: isDark ? 'rgba(56,189,248,0.08)' : '#EFF8FF',
            border: `1px solid ${isDark ? 'rgba(56,189,248,0.22)' : '#BFDBFE'}`,
          }}
        >
          <Lock size={18} className="flex-shrink-0 mt-0.5" style={{ color: isDark ? '#38BDF8' : '#0077B6' }} />
          <p className="text-sm leading-relaxed" style={{ color: isDark ? '#A8B4CC' : '#1E4B6B' }}>
            Controla quem vê o teu perfil, as tuas publicações e quem te pode contactar.
            As alterações aplicam-se nesta sessão.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl shadow-sm overflow-hidden"
          style={{ background: surface, border: `1px solid ${border}` }}
        >
          {settings.map((setting, index) => {
            const open = expandedId === setting.id;
            return (
              <div
                key={setting.id}
                style={{
                  borderBottom: index < settings.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'}` : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : setting.id)}
                  aria-expanded={open}
                  aria-controls={`privacy-options-${setting.id}`}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isDark ? setting.bgDark : setting.bg,
                      color: isDark ? setting.colorDark : setting.color,
                    }}
                    aria-hidden
                  >
                    {setting.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: text }}>{setting.label}</p>
                    <p className="text-xs" style={{ color: faint }}>{setting.description}</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: isDark ? 'rgba(0,119,182,0.18)' : '#EFF8FF',
                      color: isDark ? '#38BDF8' : '#0077B6',
                    }}
                  >
                    {optionLabel(setting)}
                  </span>
                  <ChevronRight
                    size={16}
                    color={isDark ? '#3A4460' : '#D1D5DB'}
                    strokeWidth={2}
                    aria-hidden
                    style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`privacy-options-${setting.id}`}
                      role="radiogroup"
                      aria-label={setting.label}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-4 pb-4 pt-1 space-y-2"
                        style={{ background: isDark ? '#151821' : '#F9FAFB' }}
                      >
                        {setting.options.map(option => {
                          const selected = setting.currentValue === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => handlePrivacyChange(setting.id, option.value)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                              style={{
                                background: selected
                                  ? (isDark ? 'rgba(0,119,182,0.16)' : '#EFF8FF')
                                  : surface,
                                border: `1px solid ${selected
                                  ? (isDark ? 'rgba(56,189,248,0.35)' : '#BAE6FD')
                                  : border}`,
                              }}
                            >
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: selected ? '#0077B6' : 'transparent',
                                  border: selected ? 'none' : `2px solid ${isDark ? '#3A4460' : '#D1D5DB'}`,
                                }}
                                aria-hidden
                              >
                                {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-bold" style={{ color: text }}>{option.label}</span>
                                <span className="block text-xs" style={{ color: muted }}>{option.hint}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider px-1 mb-2" style={{ color: faint }}>
            Gestão de dados
          </p>
          <div
            className="rounded-2xl shadow-sm overflow-hidden"
            style={{ background: surface, border: `1px solid ${border}` }}
          >
            <button
              type="button"
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'}` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF',
                  color: isDark ? '#60A5FA' : '#3B82F6',
                }}
                aria-hidden
              >
                <Download size={18} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: text }}>Descarregar os meus dados</p>
                <p className="text-xs" style={{ color: faint }}>
                  {exportState === 'done'
                    ? 'Ficheiro JSON guardado no teu dispositivo'
                    : exportState === 'error'
                      ? 'Não foi possível gerar o ficheiro'
                      : 'Perfil e preferências em JSON'}
                </p>
              </div>
              <ChevronRight size={16} color={isDark ? '#3A4460' : '#D1D5DB'} strokeWidth={2} aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmText('');
                setDeleteError(null);
                setShowDeleteSheet(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isDark ? 'rgba(248,113,113,0.15)' : '#FEE2E2' }}
                aria-hidden
              >
                <Trash2 size={18} color="#DC2626" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#DC2626' }}>Eliminar conta</p>
                <p className="text-xs" style={{ color: faint }}>Encerra a sessão nesta app</p>
              </div>
              <ChevronRight size={16} color={isDark ? 'rgba(248,113,113,0.4)' : '#FCA5A5'} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 flex gap-3"
          style={{
            background: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
            border: `1px solid ${isDark ? 'rgba(245,158,11,0.22)' : '#FDE68A'}`,
          }}
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} aria-hidden />
          <p className="text-xs leading-relaxed" style={{ color: isDark ? '#FCD34D' : '#92400E' }}>
            Eliminar a conta nesta app encerra a sessão. A remoção permanente dos dados no servidor
            ainda passa pela equipa Txopela.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => !isDeleting && setShowDeleteSheet(false)}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={confirmTitleId}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-full rounded-t-3xl sm:rounded-3xl px-5 pt-4 pb-8"
              style={{ maxWidth: 480, background: surface }}
            >
              <div className="flex justify-center mb-4 sm:hidden">
                <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#2A2F44' : '#E5E7EB' }} />
              </div>

              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(248,113,113,0.15)' : '#FEE2E2' }}
                >
                  <Trash2 size={24} color="#DC2626" strokeWidth={1.8} aria-hidden />
                </div>
                <h2 id={confirmTitleId} className="text-base font-black" style={{ color: text }}>
                  Eliminar conta?
                </h2>
                <p className="text-sm" style={{ color: muted }}>
                  Isto encerra a tua sessão neste dispositivo. Escreve <strong>ELIMINAR</strong> para confirmar.
                </p>
              </div>

              <label className="block mt-4 text-left">
                <span className="sr-only">Escreve ELIMINAR para confirmar</span>
                <input
                  ref={confirmInputRef}
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="ELIMINAR"
                  className="w-full px-4 py-3 rounded-2xl text-sm font-bold outline-none"
                  style={{
                    background: isDark ? '#22263A' : '#F3F4F6',
                    color: text,
                    border: `1px solid ${canConfirmDelete
                      ? '#DC2626'
                      : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB')}`,
                  }}
                />
              </label>

              {deleteError && (
                <p className="text-xs font-semibold mt-2" role="alert" style={{ color: '#DC2626' }}>
                  {deleteError}
                </p>
              )}

              <div className="flex gap-3 mt-5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDeleteSheet(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold"
                  style={{
                    background: isDark ? '#22263A' : '#F3F4F6',
                    color: isDark ? '#A8B4CC' : '#374151',
                  }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirmDelete}
                  disabled={!canConfirmDelete || isDeleting}
                  className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-40"
                  style={{ background: '#DC2626' }}
                >
                  {isDeleting ? 'A encerrar…' : 'Eliminar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
