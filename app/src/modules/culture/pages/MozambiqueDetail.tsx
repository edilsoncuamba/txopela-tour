import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface MozambiqueDetailProps {
  onBack: () => void;
}

// ── Ícones SVG inline de alta qualidade ──────────────────────────────────
const Icon = {
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V8l9-6 9 6v14"/><path d="M9 22V12h6v10"/>
    </svg>
  ),
  Scale: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 7l9-4 9 4M4 20h16"/><path d="M4 10l-1 4h3L4 10zM20 10l-1 4h3L20 10z"/>
    </svg>
  ),
  Flag: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Globe: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  Phone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.13 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91A16 16 0 0016 17.91l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  DollarSign: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  Music: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  Palette: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-1.5c0-.83-.67-1.5-1.5-1.5H11c-2.76 0-5-2.24-5-5 0-3.87 3.13-7 7-7 3.87 0 7 3.13 7 7v1c0 1.1-.9 2-2 2s-2-.9-2-2V7"/>
    </svg>
  ),
  Landmark: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/>
      <polygon points="12 2 20 7 4 7"/>
    </svg>
  ),
  Waves: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 18c.6.5 1.2 1 2.5 1C7 19 7 17 9.5 17c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  ),
  Leaf: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.34c-.99 1.54-.34 3.66 1.3 3.98C6.88 23.72 8.66 23.32 9.68 22c1.37-1.81 2.32-3.56 4.32-5.56 4-4 7-3 7-3s-1.12 9-10 13c10 0 16-7 16-14S20 1 10 1c0 0-1 5 7 7z"/>
    </svg>
  ),
  Briefcase: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// ── Componente de secção colapsável ──────────────────────────────────────
function Section({ title, children }: {
  title: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left">
        <span className="text-sm font-black" style={{ color: '#1A1A1A' }}>{title}</span>
        <span style={{ color: '#9CA3AF' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: '#F3F4F6' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Linha de dado ─────────────────────────────────────────────────────────
function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: '#F9FAFB' }}>
      <span className="flex-shrink-0 mt-0.5" style={{ color: '#1B5E3B' }}>{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{label}</p>
        <p className="text-sm font-bold mt-0.5" style={{ color: '#1A1A1A' }}>{value}</p>
      </div>
    </div>
  );
}

export default function MozambiqueDetail({ onBack }: MozambiqueDetailProps) {
  return (
    <motion.div className="min-h-screen pb-24"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>

      {/* ── HEADER — botão voltar fora das imagens ─────────────────────── */}
      <div className="bg-white px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#F3F4F6' }}>
          <ChevronLeft size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </button>
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-black text-left" style={{ color: '#1B5E3B', fontFamily: 'Nunito, sans-serif' }}>
              Moçambique
            </h1>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>· África Oriental</span>
          </div>
        </div>
      </div>

      {/* ── TRIO VISUAL: Mapa · Bandeira · Emblema ────────────────────── */}
      <div className="px-4 pb-4" style={{ background: 'white' }}>
        <div className="flex gap-2.5" style={{ height: 180 }}>

          {/* Mapa */}
          <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden"
            style={{ background: '#EEF7F0' }}>
            <img src="/images/Cultura/mapa.png" alt="Mapa de Moçambique"
              className="w-full h-full object-contain p-2" />
          </div>

          {/* Bandeira */}
          <div className="flex-1 rounded-2xl overflow-hidden">
            <img src="/images/Cultura/banderira.jpg" alt="Bandeira de Moçambique"
              className="w-full h-full object-cover" />
          </div>

          {/* Emblema */}
          <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden"
            style={{ background: '#EEF7F0' }}>
            <img src="/images/Cultura/Emblema.png" alt="Emblema de Moçambique"
              className="w-full h-full object-contain p-2" />
          </div>

        </div>

        {/* Legendas */}
        <div className="flex gap-2.5 mt-1.5">
          {['Mapa', 'Bandeira', 'Emblema'].map(label => (
            <p key={label} className="flex-1 text-[10px] font-semibold text-center"
              style={{ color: '#9CA3AF' }}>{label}</p>
          ))}
        </div>
      </div>

      {/* ── CONTEÚDO ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-3 max-w-2xl mx-auto">

        {/* Intro */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
            Localizado na costa sudeste de África, Moçambique possui mais de 2.700 km de litoral banhado
            pelo Oceano Índico, 11 províncias e uma riqueza cultural construída ao longo de séculos por
            povos africanos, árabes, asiáticos e europeus.
          </p>
          <p className="text-sm leading-relaxed mt-2" style={{ color: '#4B5563' }}>
            Cada província preserva a sua própria identidade através da música, dança, gastronomia,
            patrimónios históricos, línguas e tradições.
          </p>
        </div>

        {/* História */}
        <Section title="História">
          <div className="mt-3 space-y-0">
            {[
              [<Icon.Calendar />, 'Independência', '25 de Junho de 1975'],
              [<Icon.User />, 'Primeiro Presidente', 'Samora Moisés Machel'],
              [<Icon.User />, 'Presidente da República', 'Daniel Francisco Chapo'],
              [<Icon.MapPin />, 'Capital', 'Maputo'],
              [<Icon.Scale />, 'Sistema Político', 'República Democrática Multipartidária'],
            ].map(([icon, label, value], i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: '#F3F4F6' }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                  {icon as React.ReactNode}
                </span>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{label as string}</span>
                  <span className="text-xs font-bold text-right" style={{ color: '#1A1A1A' }}>{value as string}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* O País em Números */}
        <Section title="O País em Números">
          {/* Top 3 em destaque */}
          <div className="mt-3 grid grid-cols-3 gap-2 mb-3">
            {[
              ['11', 'Províncias'],
              ['154', 'Distritos'],
              ['+30M', 'Habitantes'],
            ].map(([num, label]) => (
              <div key={label} className="flex flex-col items-center justify-center py-3 rounded-xl"
                style={{ background: '#EEF7F0' }}>
                <p className="text-lg font-black leading-none" style={{ color: '#1B5E3B' }}>{num}</p>
                <p className="text-[10px] font-semibold mt-0.5 text-center" style={{ color: '#6B7280' }}>{label}</p>
              </div>
            ))}
          </div>
          {/* Dados adicionais em linhas */}
          <div className="space-y-0">
            {[
              [<Icon.Waves />,      '+2.700 km', 'Litoral banhado pelo Índico'],
              [<Icon.Globe />,      '+20',        'Línguas nacionais · Português oficial'],
              [<Icon.DollarSign />, 'MZN',        'Metical — moeda nacional'],
              [<Icon.Phone />,      '+258 · .mz', 'Código telefónico · Domínio internet'],
            ].map(([icon, num, label], i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                style={{ borderColor: '#F3F4F6' }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                  {icon as React.ReactNode}
                </span>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-black" style={{ color: '#1A1A1A' }}>{num as string}</span>
                  <span className="text-xs text-right" style={{ color: '#9CA3AF' }}>{label as string}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Diversidade Cultural */}
        <Section title="Diversidade Cultural">
          <p className="text-xs font-semibold mt-3 mb-2" style={{ color: '#1A1A1A' }}>
            Moçambique é um mosaico de culturas. Ao viajar pelo país encontrará:
          </p>
          <div className="space-y-2">
            {[
              [<Icon.Music />, 'Danças tradicionais', 'Tufo, Mapiko, Xigubo, Marrabenta e Timbila'],
              [<Icon.Flag />, 'Festivais culturais', 'Que celebram a identidade de cada povo'],
              [<Icon.Palette />, 'Artesanato', 'Em madeira, pedra, capulana, cestaria e cerâmica'],
              [<Icon.Leaf />, 'Gastronomia rica', 'Camarão, matapa, xima, caril de amendoim, peixe fresco'],
              [<Icon.Music />, 'Ritmos musicais', 'Reconhecidos internacionalmente'],
            ].map(([icon, label, desc], i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl" style={{ background: '#F8FAFC' }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: '#1B5E3B' }}>{icon as React.ReactNode}</span>
                <div>
                  <p className="text-xs font-black" style={{ color: '#1A1A1A' }}>{label as string}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#6B7280' }}>{desc as string}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Patrimónios */}
        <Section title="Patrimónios e Lugares Históricos">
          <div className="mt-3 space-y-2">
            {[
              [<Icon.Landmark />, 'Fortalezas e edifícios coloniais'],
              [<Icon.Building />, 'Igrejas centenárias'],
              [<Icon.Globe />, 'Ilha de Moçambique'],
              [<Icon.MapPin />, 'Sítios arqueológicos'],
              [<Icon.Users />, 'Comunidades tradicionais'],
              [<Icon.Landmark />, 'Museus e centros culturais'],
            ].map(([icon, text], i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: '#F3F4F6' }}>
                <span style={{ color: '#1B5E3B' }}>{icon as React.ReactNode}</span>
                <span className="text-sm" style={{ color: '#4B5563' }}>{text as string}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Natureza */}
        <Section title="Natureza">
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              [<Icon.Waves />, 'Praias de areia branca'],
              [<Icon.Leaf />, 'Parques nacionais'],
              [<Icon.Waves />, 'Baleias e golfinhos'],
              [<Icon.Globe />, 'Recifes de coral'],
              [<Icon.MapPin />, 'Montanhas, lagos e rios'],
              [<Icon.Leaf />, 'Espécies protegidas'],
            ].map(([icon, text], i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#F8FAFC' }}>
                <span style={{ color: '#1B5E3B' }}>{icon as React.ReactNode}</span>
                <span className="text-xs font-semibold" style={{ color: '#374151' }}>{text as string}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Economia */}
        <Section title="Economia">
          <p className="text-xs mt-3 mb-3" style={{ color: '#6B7280' }}>
            Recursos naturais e economia baseada em:
          </p>
          <div className="flex flex-wrap gap-2">
            {['Agricultura', 'Pesca', 'Turismo', 'Gás Natural', 'Carvão', 'Grafite', 'Titânio', 'Energia Hidro.'].map(item => (
              <span key={item} className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: '#EEF7F0', color: '#1B5E3B' }}>{item}</span>
            ))}
          </div>
        </Section>

        {/* Porquê visitar */}
        <Section title="Porquê visitar Moçambique?">
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {['História rica', 'Cultura viva', 'Povo acolhedor', 'Gastronomia única',
              'Paisagens únicas', 'Patrimónios', 'Natureza preservada', 'Experiências autênticas'].map(item => (
              <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F8FAFC' }}>
                <span style={{ color: '#1B5E3B' }}><Icon.Check /></span>
                <span className="text-xs font-semibold" style={{ color: '#374151' }}>{item}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Descubra */}
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #1B5E3B 0%, #2BB5C8 100%)' }}>
          <p className="text-white font-black text-base mb-2">Descubra Moçambique</p>
          <p className="text-white/85 text-xs leading-relaxed">
            Das águas cristalinas do Arquipélago de Bazaruto às ruas históricas da Ilha de Moçambique;
            das tradições do povo Makonde às melodias da Timbila de Zavala; dos parques nacionais às
            cidades vibrantes, cada destino revela uma nova história. Explore as 11 províncias através
            do Txopela Tour.
          </p>
        </div>
      </div>
    </motion.div>
  );
}