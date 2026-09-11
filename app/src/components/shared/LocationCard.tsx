/**
 * LocationCard — componente partilhado de localização com colapsar/expandir.
 *
 * ESTADO FECHADO:
 *   📍 Localização
 *   ENDEREÇO
 *   Muabsa, Mapinhane, Vilankulo, Inhambane   ˅
 *
 * ESTADO ABERTO (resumo desaparece, seta no cabeçalho fecha):
 *   📍 Localização                            ˄
 *   ───────────────────────────────────────────
 *   PAÍS          Moçambique
 *   PROVÍNCIA     Inhambane
 *   DISTRITO      Vilankulo
 *   POSTO ADM.    Mapinhane
 *   CIDADE/VILA   Muabsa
 *   ENDEREÇO      Muabsa, Mapinhane, Vilankulo, Inhambane
 *
 * REGRAS:
 * - Campos vazios são omitidos silenciosamente.
 * - Se não houver nenhum campo, retorna null.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import { buildFullAddress } from '@/utils/normalizeLocation';
import type { NormalizedLocation } from '@/utils/normalizeLocation';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface LocationCardProps {
  /** Objecto normalizado — fonte preferida. */
  data?: NormalizedLocation;

  /** Fallback: props individuais (quando `data` não é passado). */
  country?:            string;
  province?:           string;
  district?:           string;
  administrativePost?: string;
  locality?:           string;
  nearbyReference?:    string;
  address?:            string;
  lat?:                number;
  lng?:                number;

  /** Visual */
  size?:  'sm' | 'md';
  title?: string;

  /** Mostra botão "Como chegar". Só aparece se lat+lng disponíveis ou publicationName definido. */
  showMap?: boolean;

  /** Nome da publicação — fallback na query do Google Maps. */
  publicationName?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LocationCard({
  data,
  country:            propCountry,
  province:           propProvince,
  district:           propDistrict,
  administrativePost: propAdminPost,
  locality:           propLocality,
  nearbyReference:    propNearby,
  address:            propAddress,
  lat:                propLat,
  lng:                propLng,
  size = 'md',
  title = 'Localização',
  showMap = false,
  publicationName,
}: LocationCardProps) {
  const [open, setOpen] = useState(false);

  // Resolver valores — data tem precedência, props individuais são fallback
  const country            = (data?.country            ?? propCountry   ?? 'Moçambique').trim();
  const province           = (data?.province           ?? propProvince  ?? '').trim();
  const district           = (data?.district           ?? propDistrict  ?? '').trim();
  const administrativePost = (data?.administrativePost ?? propAdminPost ?? '').trim();
  const locality           = (data?.locality           ?? propLocality  ?? '').trim();
  const nearbyReference    = (data?.nearbyReference    ?? propNearby    ?? '').trim();
  const address            = (data?.address            ?? propAddress   ?? '').trim();
  const lat                = data?.lat ?? propLat;
  const lng                = data?.lng ?? propLng;

  // Campos expandidos — hierarquia completa, sem vazios
  const fields: { label: string; value: string }[] = [
    { label: 'País',                 value: country },
    { label: 'Província',            value: province },
    { label: 'Distrito',             value: district },
    { label: 'Posto Administrativo', value: administrativePost },
    { label: 'Cidade/Vila',          value: locality },
    { label: 'Perto de',             value: nearbyReference },
    { label: 'Endereço',             value: address },
  ].filter(f => f.value.length > 0);

  if (fields.length === 0) return null;

  // Resumo para o estado fechado
  const summary =
    address ||
    buildFullAddress({ locality, administrativePost, district, province }) ||
    province;

  const isSm = size === 'sm';
  const px   = isSm ? 12 : 16;
  const py   = isSm ? 8  : 10;
  const fs   = isSm ? 12 : 13;
  const fsl  = isSm ?  9 : 10;

  const hasCoords  = lat != null && lng != null;
  const canShowMap = showMap && (hasCoords || !!publicationName);

  const handleMapsClick = () => {
    const url = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [publicationName, province, 'Moçambique'].filter(Boolean).join(' ')
        )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const radius = isSm ? 12 : 16;
  const border = '1px solid #F3F4F6';

  return (
    <div style={{
      background: 'white',
      borderRadius: radius,
      overflow: 'hidden',
      border,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      textAlign: 'left',
    }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      {open ? (
        /* Aberto: cabeçalho clicável com ˄ para fechar */
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: `${py}px ${px}px`,
            background: '#FAFAFA',
            borderBottom: border,
            cursor: 'pointer',
            border: 'none',
            borderBottom: border,
          }}
        >
          <MapPin size={isSm ? 13 : 15} color="#1B5E3B" />
          <span style={{ flex: 1, fontSize: isSm ? 11 : 13, fontWeight: 900, color: '#1A1A1A' }}>
            {title}
          </span>
          <ChevronUp size={isSm ? 14 : 16} color="#1B5E3B" />
        </button>
      ) : (
        /* Fechado: cabeçalho fixo + linha de resumo clicável */
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: `${py}px ${px}px`,
            background: '#FAFAFA',
            borderBottom: border,
          }}>
            <MapPin size={isSm ? 13 : 15} color="#1B5E3B" />
            <span style={{ flex: 1, fontSize: isSm ? 11 : 13, fontWeight: 900, color: '#1A1A1A' }}>
              {title}
            </span>
          </div>

          {/* Resumo — clica para expandir */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 8,
              padding: `${py}px ${px}px`,
              background: 'white',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0,
                fontSize: fsl,
                fontWeight: 700,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 2,
              }}>
                Endereço
              </p>
              <p style={{
                margin: 0,
                fontSize: fs,
                fontWeight: 800,
                color: '#1A1A1A',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {summary}
              </p>
            </div>
            <ChevronDown size={isSm ? 14 : 16} color="#1B5E3B" style={{ flexShrink: 0, marginTop: 2 }} />
          </button>
        </>
      )}

      {/* ── Detalhe expandido ─────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {fields.map((f, i) => (
              <div key={f.label} style={{ borderTop: i === 0 ? border : border, padding: `${py}px ${px}px` }}>
                <p style={{
                  margin: 0,
                  fontSize: fsl,
                  fontWeight: 700,
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 2,
                }}>
                  {f.label}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: fs,
                  fontWeight: 800,
                  color: '#1A1A1A',
                  lineHeight: 1.4,
                }}>
                  {f.value}
                </p>
              </div>
            ))}

            {/* Botão "Como chegar" — opcional */}
            {canShowMap && (
              <div style={{ padding: `${py}px ${px}px`, borderTop: border }}>
                <button
                  onClick={handleMapsClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#EEF7F0',
                    border: '1px solid #1B5E3B20',
                    borderRadius: 8,
                    padding: '7px 12px',
                    cursor: 'pointer',
                    fontSize: isSm ? 11 : 12,
                    fontWeight: 800,
                    color: '#1B5E3B',
                  }}
                >
                  <Navigation size={13} color="#1B5E3B" />
                  Como chegar
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
