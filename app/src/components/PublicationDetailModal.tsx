// PublicationDetailModal — Apurador
// Design de nível profissional: layout a duas colunas, tabs por secção,
// galeria hero imersiva, tipografia refinada e acções de decisão proeminentes.
//
// Endpoints (api.ts):  local → GET /api/locals/{id}/
//                      service → GET /api/services/{id}/
//                      post    → GET /api/posts/{id}/

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  MapPin, Phone, Globe, Star, Hash, User, Briefcase,
  Clock, Tag, Image as ImageIcon, CheckCircle, XCircle,
  RefreshCw, Calendar, FileText, MessageSquare, Eye,
  Heart, Share2, ExternalLink, Mail, Layers,
} from 'lucide-react';
import { localsApi, servicesApi, postsApi } from '@/services/api';
import { extractImages, PLACEHOLDER_IMAGE } from '@/utils/dataValidation';
import {
  translateStatus,
  translateLocalCategory,
  translateServiceCategory,
  translatePostCategory,
} from '@/utils/translations';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND  = '#1B5E3B';
const ACCENT = '#2BB5C8';
const SURFACE = '#FFFFFF';
const MUTED   = '#F8FAFC';
const BORDER  = '#E5E7EB';
const TEXT_1  = '#111827';
const TEXT_2  = '#6B7280';
const TEXT_3  = '#9CA3AF';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(s: string) {
  const map: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    pending:  { label: 'Em revisão', color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
    approved: { label: 'Aprovado',   color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
    rejected: { label: 'Rejeitado',  color: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
    review:   { label: 'Em revisão', color: '#1E40AF', bg: '#EFF6FF', dot: '#3B82F6' },
  };
  return map[(s || '').toLowerCase()] ?? { label: s || '—', color: TEXT_2, bg: MUTED, dot: TEXT_3 };
}

function fmt(iso?: string | null, full = false): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-MZ', full
      ? { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function typeLabel(t: string) {
  if (t === 'local')   return { label: 'Local Turístico', icon: <MapPin size={11} />,   color: BRAND };
  if (t === 'service') return { label: 'Serviço',         icon: <Briefcase size={11} />, color: '#7C3AED' };
  return                      { label: 'Post',            icon: <FileText size={11} />,  color: ACCENT };
}

// ─── Galeria hero ─────────────────────────────────────────────────────────────
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const hasImages = images.length > 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0F172A' }}>
      {hasImages ? (
        <>
          <AnimatePresence mode="wait">
            <motion.img
              key={idx}
              src={images[idx]}
              alt={`${title} ${idx + 1}`}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
            />
          </AnimatePresence>

          {/* Gradiente inferior */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Contador */}
          <div style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            color: '#FFF', borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
          }}>
            {idx + 1} / {images.length}
          </div>

          {/* Setas */}
          {images.length > 1 && (
            <>
              <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%',
                  width: 36, height: 36, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#FFF',
                  transition: 'background .15s',
                }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setIdx(i => (i + 1) % images.length)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%',
                  width: 36, height: 36, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#FFF',
                }}>
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Dots */}
          {images.length > 1 && images.length <= 8 && (
            <div style={{
              position: 'absolute', bottom: 14, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: 5,
            }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === idx ? '#FFF' : 'rgba(255,255,255,0.45)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all .2s',
                }} />
              ))}
            </div>
          )}

          {/* Tiras de miniaturas */}
          {images.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              display: 'flex', gap: 4, padding: '0 12px 12px',
              overflowX: 'auto',
            }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  flexShrink: 0, width: 44, height: 44, borderRadius: 8,
                  overflow: 'hidden', border: `2px solid ${i === idx ? '#FFF' : 'rgba(255,255,255,0.3)'}`,
                  padding: 0, cursor: 'pointer', opacity: i === idx ? 1 : 0.65,
                  transition: 'all .2s',
                }}>
                  <img src={img} alt="" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ImageIcon size={28} color="rgba(255,255,255,0.35)" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500, margin: 0 }}>
            Sem imagens anexadas
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Chip de informação ───────────────────────────────────────────────────────
function Chip({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; accent?: string;
}) {
  if (value === null || value === undefined || value === '' || value === '—') return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: MUTED, borderRadius: 10, padding: '10px 14px',
      border: `1px solid ${BORDER}`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: accent ? `${accent}15` : `${BRAND}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent ?? BRAND,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: TEXT_3, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_1, wordBreak: 'break-word', lineHeight: 1.5 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Secção com título ────────────────────────────────────────────────────────
function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: `${color ?? BRAND}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color ?? BRAND,
      }}>
        {icon}
      </div>
      <h4 style={{ fontSize: 12, fontWeight: 800, color: TEXT_1, margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </h4>
      <div style={{ flex: 1, height: 1, background: BORDER, marginLeft: 4 }} />
    </div>
  );
}

// ─── Texto longo com expand ───────────────────────────────────────────────────
function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 200;
  const shown = long && !expanded ? text.slice(0, 200) + '…' : text;
  return (
    <div>
      <p style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{shown}</p>
      {long && (
        <button onClick={() => setExpanded(e => !e)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0',
          fontSize: 12, fontWeight: 700, color: BRAND,
        }}>
          {expanded ? 'Mostrar menos ↑' : 'Ler tudo ↓'}
        </button>
      )}
    </div>
  );
}

// ─── Grid de chips 2 colunas ──────────────────────────────────────────────────
function ChipGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {children}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
type Tab = 'info' | 'location' | 'contacts' | 'stats';

function TabBar({ active, tabs, onChange }: {
  active: Tab;
  tabs: { id: Tab; label: string; icon: React.ReactNode }[];
  onChange: (t: Tab) => void;
}) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: '12px 20px 0',
      borderBottom: `1px solid ${BORDER}`, background: SURFACE, flexShrink: 0,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: '8px 8px 0 0',
          border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
          background: active === t.id ? SURFACE : 'transparent',
          color: active === t.id ? BRAND : TEXT_3,
          borderBottom: active === t.id ? `2px solid ${BRAND}` : '2px solid transparent',
          marginBottom: active === t.id ? -1 : 0,
          transition: 'all .15s',
        }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Conteúdo por tipo de publicação ─────────────────────────────────────────

function LocalInfo({ data }: { data: any }) {
  const [tab, setTab] = useState<Tab>('info');
  const loc     = data.location ?? {};
  const contact = data.contact  ?? {};
  const rating  = data.rating   ?? {};
  const amenities: string[] = Array.isArray(data.amenities) ? data.amenities : [];
  const highlights: string[] = Array.isArray(data.highlights) ? data.highlights : [];
  const badge = statusBadge(data.status);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'info',     label: 'Geral',      icon: <Layers size={12} /> },
    { id: 'location', label: 'Localização', icon: <MapPin size={12} /> },
    { id: 'contacts', label: 'Contactos',  icon: <Phone size={12} /> },
  ];

  return (
    <>
      <TabBar active={tab} tabs={tabs} onChange={setTab} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

        {tab === 'info' && (
          <>
            {/* Status + datas — barra de topo */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
              flexWrap: 'wrap',
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: badge.bg, color: badge.color,
                border: `1px solid ${badge.dot}40`,
                borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
                {badge.label}
              </span>
              {data.category && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: `${BRAND}12`, color: BRAND,
                  borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                }}>
                  <Tag size={10} /> {translateLocalCategory(data.category)}
                </span>
              )}
              {data.subcategory && (
                <span style={{
                  background: MUTED, color: TEXT_2, borderRadius: 20,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600,
                  border: `1px solid ${BORDER}`,
                }}>
                  {data.subcategory}
                </span>
              )}
            </div>

            {/* Descrição */}
            {data.description && (
              <div style={{ marginBottom: 16 }}>
                <SectionHeader icon={<FileText size={13} />} title="Descrição" />
                <ExpandableText text={data.description} />
              </div>
            )}

            {/* Métricas */}
            <div style={{ marginBottom: 16 }}>
              <SectionHeader icon={<Star size={13} />} title="Métricas" />
              <ChipGrid>
                {rating.average != null && (
                  <Chip icon={<Star size={13} />} label="Avaliação"
                    value={<span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} fill="#FBBF24" color="#FBBF24" />
                      {Number(rating.average).toFixed(1)}
                      <span style={{ color: TEXT_3, fontWeight: 500 }}>({rating.count ?? 0})</span>
                    </span>}
                    accent="#FBBF24" />
                )}
                <Chip icon={<Calendar size={13} />} label="Criado em" value={fmt(data.createdAt || data.created_at, true)} />
                <Chip icon={<Clock size={13} />} label="Atualizado" value={fmt(data.updatedAt || data.updated_at)} />
                <Chip icon={<Tag size={13} />} label="Época ideal" value={data.bestSeason || data.best_season} />
                <Chip icon={<Hash size={13} />} label="Preço" value={data.priceRange || data.price_range} />
              </ChipGrid>
            </div>

            {/* Destaques */}
            {highlights.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <SectionHeader icon={<Eye size={13} />} title="Destaques" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {highlights.map((h, i) => (
                    <span key={i} style={{
                      background: `${BRAND}10`, color: BRAND, borderRadius: 20,
                      padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      border: `1px solid ${BRAND}20`,
                    }}>{h}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Comodidades */}
            {amenities.length > 0 && (
              <div>
                <SectionHeader icon={<CheckCircle size={13} />} title="Comodidades" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {amenities.map((a, i) => (
                    <span key={i} style={{
                      background: MUTED, color: TEXT_2, borderRadius: 20,
                      padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      border: `1px solid ${BORDER}`,
                    }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Horário */}
            {data.hours && (
              <div style={{ marginTop: 16 }}>
                <SectionHeader icon={<Clock size={13} />} title="Horário" />
                <div style={{ background: MUTED, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                  {typeof data.hours === 'object'
                    ? Object.entries(data.hours).map(([day, hrs]: [string, any], i, arr) => (
                        <div key={day} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '9px 14px', fontSize: 12,
                          borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none',
                          background: i % 2 === 0 ? 'transparent' : `${BRAND}04`,
                        }}>
                          <span style={{ color: TEXT_2, fontWeight: 600, textTransform: 'capitalize' }}>{day}</span>
                          <span style={{ color: hrs ? TEXT_1 : TEXT_3, fontWeight: 700 }}>
                            {hrs ? `${hrs.open ?? '—'} – ${hrs.close ?? '—'}` : 'Fechado'}
                          </span>
                        </div>
                      ))
                    : <p style={{ fontSize: 12, color: TEXT_2, padding: 12, margin: 0 }}>{String(data.hours)}</p>
                  }
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'location' && (
          <ChipGrid>
            <Chip icon={<MapPin size={13} />} label="Província" value={loc.province || data.province} />
            <Chip icon={<MapPin size={13} />} label="Distrito" value={loc.district || data.district} />
            <Chip icon={<MapPin size={13} />} label="Posto Administrativo" value={loc.administrative_post || data.administrative_post} />
            <Chip icon={<MapPin size={13} />} label="Localidade / Vila" value={loc.locality || data.locality} />
            <Chip icon={<MapPin size={13} />} label="Perto de" value={loc.nearby_reference || data.nearby_reference} />
            <Chip icon={<MapPin size={13} />} label="Endereço" value={loc.address || data.address} />
            <Chip icon={<Globe size={13} />} label="País" value={loc.country || 'Moçambique'} />
          </ChipGrid>
        )}

        {tab === 'contacts' && (
          <ChipGrid>
            <Chip icon={<Phone size={13} />} label="Telefone" value={contact.phone || data.phone} accent="#059669" />
            <Chip icon={<MessageSquare size={13} />} label="WhatsApp" value={contact.whatsapp || data.whatsapp} accent="#25D366" />
            <Chip icon={<Mail size={13} />} label="Email" value={contact.email || data.email} accent="#3B82F6" />
            <Chip icon={<Globe size={13} />} label="Website" value={contact.website || data.website} accent={ACCENT} />
          </ChipGrid>
        )}
      </div>
    </>
  );
}

function ServiceInfo({ data }: { data: any }) {
  const [tab, setTab] = useState<Tab>('info');
  const provider = data.provider ?? data.owner ?? {};
  const pricing  = data.pricing  ?? {};
  const loc      = data.location ?? {};
  const contact  = data.contact  ?? {};
  const avail    = data.availability ?? {};
  const features: string[]     = Array.isArray(data.features)     ? data.features     : [];
  const requirements: string[] = Array.isArray(data.requirements) ? data.requirements : [];
  const rating   = data.rating  ?? {};
  const badge    = statusBadge(data.status);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'info',     label: 'Geral',        icon: <Layers size={12} /> },
    { id: 'location', label: 'Localização',   icon: <MapPin size={12} /> },
    { id: 'contacts', label: 'Contactos',     icon: <Phone size={12} /> },
  ];

  return (
    <>
      <TabBar active={tab} tabs={tabs} onChange={setTab} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

        {tab === 'info' && (
          <>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: badge.bg, color: badge.color, border: `1px solid ${badge.dot}40`,
                borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.dot }} />
                {badge.label}
              </span>
              {data.category && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: '#7C3AED18', color: '#7C3AED', borderRadius: 20,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600,
                }}>
                  <Briefcase size={10} /> {translateServiceCategory(data.category)}
                </span>
              )}
            </div>

            {/* Descrição */}
            {data.description && (
              <div style={{ marginBottom: 16 }}>
                <SectionHeader icon={<FileText size={13} />} title="Descrição" color="#7C3AED" />
                <ExpandableText text={data.description} />
              </div>
            )}

            {/* Preços */}
            <div style={{ marginBottom: 16 }}>
              <SectionHeader icon={<Hash size={13} />} title="Preços" color="#7C3AED" />
              <ChipGrid>
                <Chip icon={<Hash size={13} />} label="Tipo" value={pricing.type} accent="#7C3AED" />
                <Chip icon={<Hash size={13} />} label="Valor" accent="#7C3AED"
                  value={pricing.amount != null ? `${pricing.amount} ${pricing.currency || 'MZN'}` : null} />
                <Chip icon={<FileText size={13} />} label="Detalhes" value={pricing.details} accent="#7C3AED" />
              </ChipGrid>
            </div>

            {/* Disponibilidade */}
            <div style={{ marginBottom: 16 }}>
              <SectionHeader icon={<Clock size={13} />} title="Disponibilidade" color="#7C3AED" />
              <ChipGrid>
                <Chip icon={<CheckCircle size={13} />} label="Disponível"
                  value={avail.isAvailable != null ? (avail.isAvailable ? 'Sim ✓' : 'Não') : null} accent="#059669" />
                <Chip icon={<Clock size={13} />} label="Horário" value={avail.schedule} />
                <Chip icon={<Calendar size={13} />} label="Antecedência"
                  value={avail.advanceBooking != null ? `${avail.advanceBooking} dias` : null} />
                <Chip icon={<Calendar size={13} />} label="Criado em" value={fmt(data.createdAt || data.created_at, true)} />
              </ChipGrid>
            </div>

            {/* Características */}
            {features.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <SectionHeader icon={<Eye size={13} />} title="Características" color="#7C3AED" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {features.map((f, i) => (
                    <span key={i} style={{
                      background: '#7C3AED10', color: '#7C3AED', borderRadius: 20,
                      padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      border: '1px solid #7C3AED20',
                    }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Requisitos */}
            {requirements.length > 0 && (
              <div>
                <SectionHeader icon={<Tag size={13} />} title="Requisitos" color="#7C3AED" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {requirements.map((r, i) => (
                    <span key={i} style={{
                      background: MUTED, color: TEXT_2, borderRadius: 20,
                      padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      border: `1px solid ${BORDER}`,
                    }}>{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Fornecedor */}
            {(provider.name || provider.id) && (
              <div style={{ marginTop: 16 }}>
                <SectionHeader icon={<User size={13} />} title="Fornecedor" color="#7C3AED" />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: MUTED, borderRadius: 12, padding: '12px 16px',
                  border: `1px solid ${BORDER}`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: provider.avatar ? undefined : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {provider.avatar
                      ? <img src={provider.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ color: '#FFF', fontSize: 15, fontWeight: 800 }}>
                          {(provider.name || '?').charAt(0).toUpperCase()}
                        </span>
                    }
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: TEXT_1, margin: 0 }}>{provider.name || '—'}</p>
                    {provider.rating != null && (
                      <p style={{ fontSize: 11, color: TEXT_2, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Star size={10} fill="#FBBF24" color="#FBBF24" />
                        {provider.rating} · {provider.reviewsCount ?? 0} avaliações
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'location' && (
          <ChipGrid>
            <Chip icon={<MapPin size={13} />} label="Província" value={loc.province || data.province} />
            <Chip icon={<MapPin size={13} />} label="Distrito" value={loc.district || data.district} />
            <Chip icon={<MapPin size={13} />} label="Posto Administrativo" value={loc.administrative_post || data.administrative_post} />
            <Chip icon={<MapPin size={13} />} label="Localidade / Vila" value={loc.locality || data.locality} />
            <Chip icon={<MapPin size={13} />} label="Perto de" value={loc.nearby_reference || data.nearby_reference} />
            <Chip icon={<MapPin size={13} />} label="Endereço" value={loc.address || loc.serviceArea} accent="#7C3AED" />
          </ChipGrid>
        )}

        {tab === 'contacts' && (
          <ChipGrid>
            <Chip icon={<Phone size={13} />} label="Telefone" value={contact.phone || data.phone} accent="#059669" />
            <Chip icon={<MessageSquare size={13} />} label="WhatsApp" value={contact.whatsapp || data.whatsapp} accent="#25D366" />
            <Chip icon={<Mail size={13} />} label="Email" value={contact.email || data.contact_email || data.email} accent="#3B82F6" />
          </ChipGrid>
        )}
      </div>
    </>
  );
}

function PostInfo({ data }: { data: any }) {
  const [tab, setTab] = useState<Tab>('info');
  const author = data.author ?? {};
  const loc    = data.location ?? {};
  const stats  = data.stats ?? {};
  const tags: string[] = Array.isArray(data.tags) ? data.tags : [];
  const badge  = statusBadge(data.status);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'info',     label: 'Conteúdo',    icon: <FileText size={12} /> },
    { id: 'stats',    label: 'Estatísticas', icon: <Hash size={12} /> },
    { id: 'location', label: 'Localização',  icon: <MapPin size={12} /> },
  ];

  return (
    <>
      <TabBar active={tab} tabs={tabs} onChange={setTab} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

        {tab === 'info' && (
          <>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: badge.bg, color: badge.color, border: `1px solid ${badge.dot}40`,
                borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.dot }} />
                {badge.label}
              </span>
              {data.category && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: `${ACCENT}18`, color: ACCENT, borderRadius: 20,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600,
                }}>
                  <FileText size={10} /> {translatePostCategory(data.category)}
                </span>
              )}
              {(data.province || loc.province) && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: MUTED, color: TEXT_2, borderRadius: 20,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600,
                  border: `1px solid ${BORDER}`,
                }}>
                  <MapPin size={10} /> {data.province || loc.province}
                </span>
              )}
            </div>

            {/* Título */}
            {data.title && (
              <div style={{ marginBottom: 16 }}>
                <SectionHeader icon={<FileText size={13} />} title="Título" color={ACCENT} />
                <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_1, margin: 0, lineHeight: 1.5 }}>{data.title}</p>
              </div>
            )}

            {/* Conteúdo */}
            {data.content && (
              <div style={{ marginBottom: 16 }}>
                <SectionHeader icon={<MessageSquare size={13} />} title="Conteúdo" color={ACCENT} />
                <ExpandableText text={data.content} />
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <SectionHeader icon={<Tag size={13} />} title="Tags" color={ACCENT} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map((t, i) => (
                    <span key={i} style={{
                      background: `${ACCENT}12`, color: ACCENT, borderRadius: 20,
                      padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      border: `1px solid ${ACCENT}25`,
                    }}>#{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Datas */}
            <ChipGrid>
              <Chip icon={<Calendar size={13} />} label="Submetido em" value={fmt(data.createdAt || data.created_at, true)} accent={ACCENT} />
              <Chip icon={<Clock size={13} />} label="Atualizado em" value={fmt(data.updatedAt || data.updated_at)} />
            </ChipGrid>

            {/* Autor */}
            <div style={{ marginTop: 16 }}>
              <SectionHeader icon={<User size={13} />} title="Autor" color={ACCENT} />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: MUTED, borderRadius: 12, padding: '12px 16px',
                border: `1px solid ${BORDER}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: author.avatar ? undefined : `linear-gradient(135deg, ${ACCENT}, ${BRAND})`,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {author.avatar
                    ? <img src={author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#FFF', fontSize: 15, fontWeight: 800 }}>
                        {(author.name || '?').charAt(0).toUpperCase()}
                      </span>
                  }
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: TEXT_1, margin: 0 }}>{author.name || '—'}</p>
                  <p style={{ fontSize: 11, color: TEXT_3, margin: '2px 0 0' }}>ID: {author.id || '—'}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: <Heart size={18} />, label: 'Gostos',       value: stats.likesCount    ?? 0, color: '#EF4444' },
              { icon: <MessageSquare size={18} />, label: 'Comentários', value: stats.commentsCount ?? 0, color: '#3B82F6' },
              { icon: <Share2 size={18} />, label: 'Partilhas',   value: stats.sharesCount   ?? 0, color: '#8B5CF6' },
              { icon: <Eye size={18} />,    label: 'Visualizações', value: stats.viewsCount   ?? 0, color: ACCENT },
            ].map((s, i) => (
              <div key={i} style={{
                background: MUTED, borderRadius: 12, padding: '16px',
                border: `1px solid ${BORDER}`, textAlign: 'center',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, margin: '0 auto 8px',
                  background: `${s.color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: s.color,
                }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: 24, fontWeight: 900, color: TEXT_1, margin: '0 0 2px', lineHeight: 1 }}>
                  {s.value.toLocaleString('pt-MZ')}
                </p>
                <p style={{ fontSize: 11, color: TEXT_3, margin: 0, fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'location' && (
          <ChipGrid>
            <Chip icon={<MapPin size={13} />} label="Endereço" value={loc.address} accent={ACCENT} />
            <Chip icon={<MapPin size={13} />} label="Província" value={data.province || loc.province} />
            <Chip icon={<Hash size={13} />} label="Latitude" value={loc.latitude} accent={ACCENT} />
            <Chip icon={<Hash size={13} />} label="Longitude" value={loc.longitude} accent={ACCENT} />
          </ChipGrid>
        )}
      </div>
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface PublicationDetailModalProps {
  id: string;
  type: 'local' | 'service' | 'post';
  displayName?: string;
  onClose: () => void;
  onAction?: (id: string, action: 'approve' | 'reject' | 'correction', note: string) => void;
  acting?: boolean;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PublicationDetailModal({
  id, type, displayName, onClose, onAction, acting = false,
}: PublicationDetailModalProps) {
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [note, setNote]           = useState('');
  const [showReject, setShowReject]   = useState(false);
  const [rejectNote, setRejectNote]   = useState('');
  const [rejectFocus, setRejectFocus] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = type === 'local'
        ? await localsApi.get(id)
        : type === 'service'
        ? await servicesApi.get(id)
        : await postsApi.get(id);

      if (res.error) { setError(res.error); return; }
      const raw = res.data;
      setData(raw?.local ?? raw?.service ?? raw?.post ?? raw);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => { loadData(); }, [loadData]);

  const images    = data ? extractImages(data) : [];
  const title     = data?.name || data?.title || displayName || '—';
  const status    = data?.status || 'pending';
  const author    = data?.author ?? data?.owner ?? data?.provider ?? {};
  const createdAt = data?.createdAt || data?.created_at;
  const badge     = statusBadge(status);
  const tl        = typeLabel(type);

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 16px', overflowY: 'auto',
        }}
        onClick={onClose}>

        {/* ── Modal container ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 28 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          style={{
            background: SURFACE, borderRadius: 20,
            width: '100%', maxWidth: 900, minHeight: 520,
            boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
            display: 'grid',
            gridTemplateColumns: '380px 1fr',
            gridTemplateRows: 'auto 1fr auto',
            overflow: 'hidden',
            margin: 'auto',
          }}>

          {/* ── Coluna esquerda: galeria (ocupa toda a altura) ──────────── */}
          <div style={{
            gridRow: '1 / 4', gridColumn: '1',
            position: 'relative', minHeight: 480,
          }}>
            <Gallery images={images} title={title} />

            {/* Overlay inferior com título + meta */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '28px 20px 20px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  color: '#FFF', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  {tl.icon} {tl.label}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: `${badge.dot}30`, color: '#FFF', borderRadius: 20,
                  padding: '3px 10px', fontSize: 10, fontWeight: 700,
                  border: `1px solid ${badge.dot}50`,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.dot }} />
                  {badge.label}
                </span>
              </div>
              <h2 style={{
                fontSize: 20, fontWeight: 900, color: '#FFF', margin: '0 0 4px',
                lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}>
                {loading ? (displayName || '…') : title}
              </h2>
              {author.name && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={9} /> {author.name}
                  {createdAt && <> · <Calendar size={9} /> {fmt(createdAt)}</>}
                </p>
              )}
            </div>

            {/* Fechar */}
            <button onClick={onClose} style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
              width: 34, height: 34, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#FFF',
            }}>
              <X size={16} />
            </button>
          </div>

          {/* ── Coluna direita: cabeçalho ─────────────────────────────── */}
          <div style={{
            gridRow: '1', gridColumn: '2',
            padding: '16px 20px 14px', borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            background: SURFACE,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Linha 1 — título truncado */}
              <p style={{ fontSize: 15, fontWeight: 800, color: TEXT_1, margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
                {loading ? (displayName || '…') : title}
              </p>
              {/* Linha 2 — badges inline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {/* Tipo */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: tl.color + '12', color: tl.color,
                  borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                  border: `1px solid ${tl.color}25`,
                }}>
                  {tl.icon} {tl.label}
                </span>
                {/* Estado */}
                {!loading && data && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: badge.bg, color: badge.color,
                    border: `1px solid ${badge.dot}40`,
                    borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
                    {badge.label}
                  </span>
                )}
                {/* Data de submissão */}
                {!loading && createdAt && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, color: TEXT_3, fontWeight: 500,
                  }}>
                    <Calendar size={9} /> {fmt(createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Coluna direita: conteúdo com tabs ────────────────────── */}
          <div style={{
            gridRow: '2', gridColumn: '2',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {loading && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: `${BRAND}10`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Loader2 size={22} color={BRAND} style={{ animation: 'pdm-spin 1s linear infinite' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: TEXT_1, margin: '0 0 4px', fontWeight: 600 }}>
                    A carregar publicação…
                  </p>
                  <p style={{ fontSize: 11, color: TEXT_3, margin: 0 }}>
                    {displayName || 'A obter dados do servidor'}
                  </p>
                </div>
              </div>
            )}

            {!loading && error && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={24} color="#EF4444" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', margin: 0 }}>Erro ao carregar</p>
                <p style={{ fontSize: 12, color: TEXT_2, margin: 0, textAlign: 'center', maxWidth: 280 }}>{error}</p>
                <button onClick={loadData} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                  borderRadius: 8, border: `1px solid ${BORDER}`, background: SURFACE,
                  color: TEXT_1, fontWeight: 700, cursor: 'pointer', fontSize: 12,
                }}>
                  <RefreshCw size={13} /> Tentar novamente
                </button>
              </div>
            )}

            {!loading && !error && data && (
              <>
                {type === 'local'   && <LocalInfo   data={data} />}
                {type === 'service' && <ServiceInfo data={data} />}
                {type === 'post'    && <PostInfo    data={data} />}
              </>
            )}
          </div>

          {/* ── Rodapé de acções ─────────────────────────────────────── */}
          {!loading && !error && onAction && (
            <div style={{
              gridRow: '3', gridColumn: '2',
              padding: '12px 20px 16px',
              borderTop: `1px solid ${BORDER}`,
              background: MUTED,
            }}>
              <textarea
                value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder="Nota do aprovador (opcional) — ex: imagens insuficientes, descrição vaga…"
                style={{
                  width: '100%', padding: '9px 12px', border: `1.5px solid ${BORDER}`,
                  borderRadius: 10, fontSize: 12, resize: 'none', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit', color: TEXT_1,
                  background: SURFACE, marginBottom: 10, lineHeight: 1.5,
                  transition: 'border-color .15s',
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; }}
                onBlur={e => { e.target.style.borderColor = BORDER; }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <motion.button whileTap={{ scale: 0.97 }} disabled={acting}
                  onClick={() => { onAction(id, 'approve', note); onClose(); }}
                  style={{
                    padding: '10px 0', borderRadius: 10, border: 'none',
                    cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1,
                    background: 'linear-gradient(135deg, #059669, #10B981)',
                    color: '#FFF', fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
                  }}>
                  <CheckCircle size={15} /> Aprovar
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={acting}
                  onClick={() => setShowReject(true)}
                  style={{
                    padding: '10px 0', borderRadius: 10, border: 'none',
                    cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1,
                    background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                    color: '#FFF', fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(220,38,38,0.28)',
                  }}>
                  <XCircle size={15} /> Rejeitar
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={acting}
                  onClick={() => { onAction(id, 'correction', note || 'Correções necessárias.'); onClose(); }}
                  style={{
                    padding: '10px 0', borderRadius: 10, border: `1.5px solid ${BORDER}`,
                    cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1,
                    background: SURFACE, color: TEXT_2, fontWeight: 700, fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  <RefreshCw size={13} /> Correção
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ── Modal de rejeição ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showReject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
              zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setShowReject(false)}>
            <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 12 }}
              onClick={e => e.stopPropagation()}
              style={{ background: SURFACE, borderRadius: 18, padding: 28, width: '100%', maxWidth: 420,
                boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#FEF2F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <XCircle size={22} color="#EF4444" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT_1, margin: '0 0 4px' }}>
                Rejeitar publicação
              </h3>
              <p style={{ fontSize: 12, color: TEXT_2, margin: '0 0 16px' }}>
                O autor receberá o motivo indicado abaixo.
              </p>
              <textarea
                value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={4}
                placeholder="Descreve o motivo da rejeição de forma clara e construtiva…"
                style={{
                  width: '100%', padding: '10px 14px', border: `1.5px solid ${rejectFocus ? '#EF4444' : BORDER}`,
                  borderRadius: 10, fontSize: 13, resize: 'none', outline: 'none',
                  boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit',
                  lineHeight: 1.6, transition: 'border-color .15s', color: TEXT_1,
                }}
                onFocus={() => setRejectFocus(true)}
                onBlur={() => setRejectFocus(false)}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowReject(false)} style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: `1.5px solid ${BORDER}`,
                  background: SURFACE, color: TEXT_2, fontWeight: 700, cursor: 'pointer', fontSize: 13,
                }}>
                  Cancelar
                </button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onAction?.(id, 'reject', rejectNote || 'Rejeitado pelo aprovador.');
                    setShowReject(false);
                    onClose();
                  }}
                  style={{
                    flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                    color: '#FFF', fontWeight: 800, cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(220,38,38,0.28)',
                  }}>
                  <XCircle size={15} /> Confirmar rejeição
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pdm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
