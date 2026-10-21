import { motion } from 'framer-motion';
import { MapPin, Wrench, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { canCreateBusiness } from '@/utils/permissions';

// ── SuggestScreen ─────────────────────────────────────────────────────────────
// Tela de selecção de tipo de publicação.
//
// Regras de permissão:
//   business  → 3 opções: local (com aprovação), serviço (com aprovação), publicação
//   outros    → 1 opção: publicação (sem aprovação)
//
// O componente pai (App.tsx) só deve navegar para esta tela quando o utilizador
// é do tipo business. Para os restantes tipos, vai directamente para AddPost.
// Esta tela implementa igualmente a defesa no próprio componente.
// ─────────────────────────────────────────────────────────────────────────────

export interface SuggestScreenProps {
  onSuggestLocal:   () => void;
  onSuggestService: () => void;
  onSuggestPost:    () => void;
  onBack:           () => void;
}

// Paleta: azul → ciano → verde
const CARD_COLORS = [
  {
    icon:          '#0077B6',
    bg:            '#EFF8FF',
    bgDark:        'rgba(0,119,182,0.15)',
    chevronBg:     '#EFF8FF',
    chevronBgDark: 'rgba(0,119,182,0.18)',
  },
  {
    icon:          '#2BB5C8',
    bg:            '#EBF8FB',
    bgDark:        'rgba(43,181,200,0.15)',
    chevronBg:     '#EBF8FB',
    chevronBgDark: 'rgba(43,181,200,0.18)',
  },
  {
    icon:          '#1B5E3B',
    bg:            '#EEF7F0',
    bgDark:        'rgba(27,94,59,0.18)',
    chevronBg:     '#EEF7F0',
    chevronBgDark: 'rgba(27,94,59,0.18)',
  },
];

export default function SuggestScreen({
  onSuggestLocal,
  onSuggestService,
  onSuggestPost,
  onBack,
}: SuggestScreenProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const isBusiness = canCreateBusiness(user?.role, user?.type);

  const dm = {
    bg:      isDark ? '#0F1117' : '#F5F5F0',
    surface: isDark ? '#1A1D27' : '#ffffff',
    border:  isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    text:    isDark ? '#F0F4FF' : '#1A1A1A',
    text2:   isDark ? '#6B7A99' : '#9CA3AF',
  };

  // Opções filtradas por tipo de perfil
  const allOptions = [
    // Locais — apenas negócio, com aprovação
    isBusiness && {
      key:         'local',
      icon:        <MapPin size={28} strokeWidth={1.8} />,
      title:       'Sugerir local',
      description: 'Adiciona um ponto turístico, restaurante, hotel ou outro lugar de interesse.',
      onClick:     onSuggestLocal,
      colors:      CARD_COLORS[0],
    },
    // Serviços — apenas negócio, com aprovação
    isBusiness && {
      key:         'service',
      icon:        <Wrench size={28} strokeWidth={1.8} />,
      title:       'Sugerir serviço',
      description: 'Publica um serviço que o teu negócio oferece: guia, alojamento, transporte ou outro.',
      onClick:     onSuggestService,
      colors:      CARD_COLORS[1],
    },
    // Publicação — todos os tipos, sem aprovação
    {
      key:         'post',
      icon:        <FileText size={28} strokeWidth={1.8} />,
      title:       'Sugerir publicação',
      description: 'Partilha uma descoberta, dica, história ou avaliação com a comunidade Txopela.',
      onClick:     onSuggestPost,
      colors:      isBusiness ? CARD_COLORS[2] : CARD_COLORS[0],
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    colors: typeof CARD_COLORS[0];
  }>;

  // Título e subtítulo adaptados ao perfil
  const screenTitle    = isBusiness ? 'Sugerir' : 'Sugerir publicação';
  const screenSubtitle = isBusiness ? '' : 'Partilha uma experiência com a comunidade';

  return (
    <div
      className="min-h-screen pb-24 flex flex-col"
      style={{ background: dm.bg, fontFamily: 'Nunito, sans-serif' }}
    >

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4"
        style={{
          background:     isDark ? 'rgba(15,17,23,0.95)' : 'rgba(245,245,240,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom:   `1px solid ${dm.border}`,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: dm.surface, border: `1px solid ${dm.border}` }}
        >
          <ChevronLeft size={20} style={{ color: dm.text }} strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-lg font-black leading-tight" style={{ color: dm.text }}>
            {screenTitle}
          </h1>
          {screenSubtitle && (
            <p className="text-xs" style={{ color: dm.text2 }}>
              {screenSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Cards de opções ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {isBusiness && (
          <h2 className="w-full max-w-lg text-left text-lg font-black mb-5" style={{ color: dm.text }}>
            O que queres sugerir?
          </h2>
        )}
        <div className="w-full max-w-lg space-y-3" role="list" aria-label="Opções de publicação">
          {allOptions.map((opt, i) => {
            const iconColor = opt.colors.icon;
            const iconBg    = isDark ? opt.colors.bgDark        : opt.colors.bg;
            const chevBg    = isDark ? opt.colors.chevronBgDark : opt.colors.chevronBg;

            return (
              <motion.button
                key={opt.key}
                role="listitem"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.07 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={opt.onClick}
                aria-label={opt.title}
                className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
                style={{
                  background:  dm.surface,
                  border:      `1px solid ${dm.border}`,
                  boxShadow:   isDark
                    ? '0 2px 12px rgba(0,0,0,0.25)'
                    : '0 1px 8px rgba(0,0,0,0.06)',
                }}
              >
                {/* Ícone */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg, color: iconColor }}
                  aria-hidden="true"
                >
                  {opt.icon}
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black mb-0.5" style={{ color: dm.text }}>
                    {opt.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: dm.text2 }}>
                    {opt.description}
                  </p>
                </div>

                {/* Seta */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: chevBg }}
                  aria-hidden="true"
                >
                  <ChevronRight size={16} style={{ color: iconColor }} strokeWidth={2.2} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
