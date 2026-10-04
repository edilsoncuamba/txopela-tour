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
 *   PAÍS          Moçambique
 *   PROVÍNCIA     Inhambane
 *   ...
 *
 * REGRAS:
 * - Campos vazios são omitidos silenciosamente.
 * - Se não houver nenhum campo, retorna null.
 * - "Como chegar" foi removido — existe div dedicada em cada detalhe.
 * - "Localização" sempre alinhado à esquerda.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { buildFullAddress } from '@/utils/normalizeLocation';
import type { NormalizedLocation } from '@/utils/normalizeLocation';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface LocationCardProps {
  data?: NormalizedLocation;
  country?:            string;
  province?:           string;
  district?:           string;
  administrativePost?: string;
  locality?:           string;
  nearbyReference?:    string;
  address?:            string;
  lat?:                number;
  lng?:                number;
  size?:  'sm' | 'md';
  title?: string;
  /** Mantido por compatibilidade mas ignorado — botão removido */
  showMap?: boolean;
  publicationName?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LocationCard({
  data,
  country:            propCountry,
  province:           propProvince,
  district:           propDistrict,
  administrativePost: propAdminPost,
  locality:           propLocality,
  nearbyReference:    propNearby,
  address:            propAddress,
  size = 'md',
  title = 'Localização',
}: LocationCardProps) {
  const [open, setOpen] = useState(false);

  const country            = (data?.country            ?? propCountry   ?? 'Moçambique').trim();
  const province           = (data?.province           ?? propProvince  ?? '').trim();
  const district           = (data?.district           ?? propDistrict  ?? '').trim();
  const administrativePost = (data?.administrativePost ?? propAdminPost ?? '').trim();
  const locality           = (data?.locality           ?? propLocality  ?? '').trim();
  const nearbyReference    = (data?.nearbyReference    ?? propNearby    ?? '').trim();
  const address            = (data?.address            ?? propAddress   ?? '').trim();

  const fields: { label: string; value: string }[] = [
    { label: 'País',                 value: country },
    { label: 'Província',            value: province },
    { label: 'Distrito',             value: district },
    // Posto Administrativo só aparece se for diferente de province e district
    // (evita duplicar quando é o mesmo nome, ex: "Inhambane" que é cidade/província/distrito)
    {
      label: 'Posto Administrativo',
      value: (administrativePost &&
        administrativePost.toLowerCase() !== province.toLowerCase() &&
        administrativePost.toLowerCase() !== district.toLowerCase()
      ) ? administrativePost : '',
    },
    { label: 'Cidade/Vila',          value: locality },
    { label: 'Perto de',             value: nearbyReference },
    { label: 'Endereço',             value: address },
  ].filter(f => f.value.length > 0);

  if (fields.length === 0) return null;

  const summary =
    address ||
    buildFullAddress({ locality, administrativePost, district, province }) ||
    province;

  const isSm = size === 'sm';
  const px   = isSm ? 12 : 16;
  const py   = isSm ? 8  : 10;
  const fs   = isSm ? 12 : 13;
  const fsl  = isSm ?  9 : 10;
  const border = '1px solid #F3F4F6';

  return (
    <div style={{
      background: 'white',
      borderRadius: isSm ? 12 : 16,
      overflow: 'hidden',
      border,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      textAlign: 'left',
    }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      {open ? (
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
            textAlign: 'left',
          }}
        >
          <MapPin size={isSm ? 13 : 15} color="#1B5E3B" />
          <span style={{ flex: 1, fontSize: isSm ? 11 : 13, fontWeight: 900, color: '#1A1A1A', textAlign: 'left' }}>
            {title}
          </span>
          <ChevronUp size={isSm ? 14 : 16} color="#1B5E3B" />
        </button>
      ) : (
        <>
          {/* Cabeçalho fixo — sempre à esquerda */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: `${py}px ${px}px`,
            background: '#FAFAFA',
            borderBottom: border,
            textAlign: 'left',
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
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
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
            style={{ overflow: 'hidden', textAlign: 'left' }}
          >
            {fields.map((f, i) => (
              <div key={f.label} style={{ borderTop: border, padding: `${py}px ${px}px` }}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
