/**
 * normalizeLocation — modelo único de localização do Txopela Tour.
 *
 * Hierarquia oficial (País → Província → Distrito → Posto Adm. → Localidade → Perto de):
 *   country → province → district → administrativePost → locality → nearbyReference
 *
 * REGRAS ABSOLUTAS:
 * - Cada campo mapeia exclusivamente o seu nível administrativo.
 * - municipality É a fonte primária de district — a API devolve municipality, não district.
 * - town / city / village / hamlet → locality (nunca district).
 * - Campos vazios ficam como '' — não inventar valores.
 *
 * CLASSES / FUNÇÕES EXPORTADAS:
 *   NormalizedLocation   — interface do modelo canónico
 *   normalizeLocation()  — aceita qualquer objecto e devolve NormalizedLocation
 *   fromApi()            — normaliza directamente a resposta raw de qualquer endpoint
 *   buildFullAddress()   — constrói endereço completo sem duplicações
 */

// ─── Modelo canónico ──────────────────────────────────────────────────────────

export interface NormalizedLocation {
  country:            string;  // País
  province:           string;  // Província
  district:           string;  // Distrito
  administrativePost: string;  // Posto Administrativo
  locality:           string;  // Localidade / Vila / Cidade
  nearbyReference:    string;  // Perto de (referência de proximidade)
  address:            string;  // Endereço completo (campo derivado)
  lat?:               number;  // Latitude (coordenada, não nível admin)
  lng?:               number;  // Longitude
}

/** Objecto vazio — útil como valor inicial antes dos dados carregarem. */
export const EMPTY_LOCATION: NormalizedLocation = {
  country: 'Moçambique',
  province: '',
  district: '',
  administrativePost: '',
  locality: '',
  nearbyReference: '',
  address: '',
};

// ─── Normalização genérica ────────────────────────────────────────────────────

/**
 * Normaliza qualquer objecto que possa conter campos de localização (flat ou nested).
 * Funciona com: props de componentes, objectos parciais, resultados da API.
 *
 * Suporta dois níveis de leitura:
 *   item.location.province  (nested — formato API)
 *   item.province           (flat — formato props/local)
 */
export function normalizeLocation(item: any): NormalizedLocation {
  if (!item) return { ...EMPTY_LOCATION };

  const loc = item.location || {};

  // País — sempre Moçambique para esta plataforma
  const country = loc.country || item.country || 'Moçambique';

  // Província
  const province = loc.province || item.province || item.provincia || '';

  // Distrito — campo canónico é 'district'.
  // A API devolve 'municipality' (não 'district') — ler como fonte primária.
  // district é fallback para APIs futuras ou actualizadas.
  const district =
    loc.municipality  ||
    loc.district      ||
    item.municipality ||
    item.district     ||
    item.distrito     ||
    '';

  // Posto Administrativo — administrative_post.
  // administrative_area é o alias que alguns endpoints usam para o mesmo nível.
  const administrativePost =
    loc.administrative_post ||
    item.administrative_post ||
    loc.administrative_area ||
    item.administrative_area ||
    '';

  // Localidade / Vila / Cidade — locality é o campo canónico.
  // city / town / cidade são aliases do mesmo nível.
  const locality =
    loc.locality ||
    item.locality ||
    loc.city     ||
    item.city    ||
    item.cidade  ||
    '';

  // Perto de — referência de proximidade, não é nível administrativo
  const nearbyReference = loc.nearby_reference || item.nearby_reference || '';

  // Endereço — o que o utilizador submeteu via buildFullAddress.
  // serviceArea é o campo de endereço nos serviços (API).
  // Nunca usar o display_name do Nominatim — esse fica só no preview do formulário.
  const address =
    loc.address      ||
    loc.serviceArea  ||
    item.address     ||
    item.serviceArea ||
    item.endereco    ||
    item.local_address ||
    '';

  // Coordenadas — independentes da hierarquia administrativa
  const rawLat = loc.latitude  ?? loc.lat  ?? item.lat  ?? item.latitude  ?? item.local_lat;
  const rawLng = loc.longitude ?? loc.lng  ?? item.lng  ?? item.longitude ?? item.local_lng;

  return {
    country,
    province,
    district,
    administrativePost,
    locality,
    nearbyReference,
    address,
    lat: rawLat != null ? parseFloat(String(rawLat)) : undefined,
    lng: rawLng != null ? parseFloat(String(rawLng)) : undefined,
  };
}

// ─── Normalização directa de resposta de API ──────────────────────────────────

/**
 * fromApi — converte directamente a resposta raw de qualquer endpoint da API
 * (local, service, post) para NormalizedLocation.
 *
 * É o ponto de entrada recomendado quando os dados vêm da API:
 *   const loc = fromApi(apiResponse);
 *   <LocationCard data={loc} />
 *
 * Funciona de forma idêntica a normalizeLocation() mas é semanticamente
 * mais explícito sobre a intenção (origem = API).
 */
export function fromApi(raw: any): NormalizedLocation {
  return normalizeLocation(raw);
}

/**
 * hasLocation — verifica se um NormalizedLocation tem pelo menos um campo preenchido.
 * Útil para guards condicionais antes de renderizar o LocationCard.
 */
export function hasLocation(loc: NormalizedLocation): boolean {
  return !!(
    loc.province ||
    loc.district ||
    loc.administrativePost ||
    loc.locality ||
    loc.nearbyReference ||
    loc.address
  );
}

// ─── Construção de endereço ───────────────────────────────────────────────────

/**
 * Constrói o endereço completo a partir dos campos administrativos.
 * Evita duplicações quando campos têm o mesmo valor.
 * Não inclui campos vazios.
 */
export function buildFullAddress(fields: {
  locality?:           string;
  administrativePost?: string;
  district?:           string;
  province?:           string;
  country?:            string;
}): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  const add = (v?: string) => {
    const s = v?.trim();
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      parts.push(s);
    }
  };

  add(fields.locality);
  add(fields.administrativePost);
  add(fields.district);
  add(fields.province);
  add(fields.country || 'Moçambique');

  return parts.join(', ');
}
