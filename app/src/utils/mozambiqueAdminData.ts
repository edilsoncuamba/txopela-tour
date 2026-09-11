/**
 * Base de dados administrativa de Moçambique.
 * Fonte: OCHA/GADM — hierarquia oficial.
 *
 * Estrutura: Província → Distritos → Postos Administrativos
 *
 * Usado para validação cruzada do geocoding:
 * - Confirmar que o valor retornado é realmente um Distrito (e não uma vila)
 * - Confirmar que o Distrito pertence à Província identificada
 * - Identificar o Posto Administrativo dentro do Distrito
 */

export interface AdminPost {
  name: string;
  localidades?: string[]; // vilas/localidades conhecidas dentro do posto
}

export interface District {
  name: string;
  postos: AdminPost[];
}

export interface Province {
  name: string;
  aliases?: string[]; // nomes alternativos que a API pode retornar
  districts: District[];
}

export const MOZAMBIQUE_ADMIN: Province[] = [
  {
    name: 'Niassa',
    districts: [
      { name: 'Lago', postos: [{ name: 'Lago', localidades: ['Metangula'] }, { name: 'Cobué' }] },
      { name: 'Lichinga', postos: [{ name: 'Lichinga', localidades: ['Lichinga'] }, { name: 'Maúa' }] },
      { name: 'Majune', postos: [{ name: 'Majune' }, { name: 'Nungo' }] },
      { name: 'Mandimba', postos: [{ name: 'Mandimba' }, { name: 'Chiúre Velho' }] },
      { name: 'Marrupa', postos: [{ name: 'Marrupa' }, { name: 'Maúa' }] },
      { name: 'Maúa', postos: [{ name: 'Maúa' }] },
      { name: 'Mecúfi', postos: [{ name: 'Mecúfi' }] },
      { name: 'Mecula', postos: [{ name: 'Mecula' }] },
      { name: 'Metarica', postos: [{ name: 'Metarica' }] },
      { name: 'Muembe', postos: [{ name: 'Muembe' }] },
      { name: 'N\'gauma', postos: [{ name: 'N\'gauma' }] },
      { name: 'Ngauma', postos: [{ name: 'Ngauma' }] },
      { name: 'Sanga', postos: [{ name: 'Sanga' }] },
    ],
  },
  {
    name: 'Cabo Delgado',
    districts: [
      { name: 'Ancuabe', postos: [{ name: 'Ancuabe' }, { name: 'Mieze' }] },
      { name: 'Balama', postos: [{ name: 'Balama' }, { name: 'Impiri' }] },
      { name: 'Chiúre', postos: [{ name: 'Chiúre' }, { name: 'Chiúre Velho' }, { name: 'Namuno' }] },
      { name: 'Ibo', postos: [{ name: 'Ibo' }] },
      { name: 'Macomia', postos: [{ name: 'Macomia' }, { name: 'Mucojo' }, { name: 'Quiterajo' }] },
      { name: 'Mecúfi', postos: [{ name: 'Mecúfi' }] },
      { name: 'Meluco', postos: [{ name: 'Meluco' }] },
      { name: 'Mocímboa da Praia', postos: [{ name: 'Mocímboa da Praia' }, { name: 'Diaca' }] },
      { name: 'Montepuez', postos: [{ name: 'Montepuez' }, { name: 'Mapupulo' }, { name: 'Nairoto' }] },
      { name: 'Mueda', postos: [{ name: 'Mueda' }, { name: 'Negomano' }, { name: 'Nangade' }] },
      { name: 'Muidumbe', postos: [{ name: 'Muidumbe' }, { name: 'Muambula' }] },
      { name: 'Namuno', postos: [{ name: 'Namuno' }] },
      { name: 'Nangade', postos: [{ name: 'Nangade' }] },
      { name: 'Palma', postos: [{ name: 'Palma' }, { name: 'Pundanhar' }] },
      { name: 'Pemba', postos: [{ name: 'Pemba' }, { name: 'Metuge' }], },
      { name: 'Pemba-Metuge', postos: [{ name: 'Metuge' }] },
      { name: 'Quissanga', postos: [{ name: 'Quissanga' }, { name: 'Bilibiza' }] },
    ],
  },
  {
    name: 'Nampula',
    districts: [
      { name: 'Angoche', postos: [{ name: 'Angoche' }, { name: 'Boila' }, { name: 'Nanhupo' }] },
      { name: 'Eráti', postos: [{ name: 'Eráti' }, { name: 'Namapa' }] },
      { name: 'Ilha de Moçambique', postos: [{ name: 'Ilha de Moçambique' }] },
      { name: 'Lalaua', postos: [{ name: 'Lalaua' }] },
      { name: 'Larde', postos: [{ name: 'Larde' }] },
      { name: 'Liúpo', postos: [{ name: 'Liúpo' }] },
      { name: 'Malema', postos: [{ name: 'Malema' }, { name: 'Mutuali' }] },
      { name: 'Meconta', postos: [{ name: 'Meconta' }] },
      { name: 'Mecubúri', postos: [{ name: 'Mecubúri' }, { name: 'Muecate' }] },
      { name: 'Memba', postos: [{ name: 'Memba' }] },
      { name: 'Mogincual', postos: [{ name: 'Mogincual' }] },
      { name: 'Mogovolas', postos: [{ name: 'Mogovolas' }, { name: 'Chalaua' }] },
      { name: 'Moma', postos: [{ name: 'Moma' }, { name: 'Congolone' }] },
      { name: 'Monapo', postos: [{ name: 'Monapo' }, { name: 'Iapala' }] },
      { name: 'Mossuril', postos: [{ name: 'Mossuril' }, { name: 'Cabaceira' }] },
      { name: 'Muecate', postos: [{ name: 'Muecate' }] },
      { name: 'Murrupula', postos: [{ name: 'Murrupula' }] },
      { name: 'Nacala-a-Velha', postos: [{ name: 'Nacala-a-Velha' }] },
      { name: 'Nacala-Porto', postos: [{ name: 'Nacala-Porto' }] },
      { name: 'Nampula', postos: [{ name: 'Nampula' }, { name: 'Rapale' }, { name: 'Muhala' }] },
      { name: 'Rapale', postos: [{ name: 'Rapale' }] },
      { name: 'Ribáuè', postos: [{ name: 'Ribáuè' }] },
    ],
  },
  {
    name: 'Zambézia',
    districts: [
      { name: 'Alto Molócuè', postos: [{ name: 'Alto Molócuè' }, { name: 'Nauela' }] },
      { name: 'Chinde', postos: [{ name: 'Chinde' }, { name: 'Marromeu' }] },
      { name: 'Derre', postos: [{ name: 'Derre' }] },
      { name: 'Gilé', postos: [{ name: 'Gilé' }, { name: 'Mualama' }] },
      { name: 'Gurué', postos: [{ name: 'Gurué' }, { name: 'Lioma' }, { name: 'Milevane' }] },
      { name: 'Ile', postos: [{ name: 'Ile' }, { name: 'Micesse' }] },
      { name: 'Inhassunge', postos: [{ name: 'Inhassunge' }] },
      { name: 'Lugela', postos: [{ name: 'Lugela' }, { name: 'Tacuane' }] },
      { name: 'Maganja da Costa', postos: [{ name: 'Maganja da Costa' }, { name: 'Cariua' }] },
      { name: 'Milange', postos: [{ name: 'Milange' }, { name: 'Muloza' }] },
      { name: 'Mocuba', postos: [{ name: 'Mocuba' }, { name: 'Mugeba' }, { name: 'Namaita' }] },
      { name: 'Mopeia', postos: [{ name: 'Mopeia' }] },
      { name: 'Morrumbala', postos: [{ name: 'Morrumbala' }, { name: 'Mualama' }] },
      { name: 'Mulevala', postos: [{ name: 'Mulevala' }] },
      { name: 'Namacurra', postos: [{ name: 'Namacurra' }, { name: 'Macuse' }] },
      { name: 'Namarroi', postos: [{ name: 'Namarroi' }] },
      { name: 'Nicoadala', postos: [{ name: 'Nicoadala' }, { name: 'Inhassunge' }] },
      { name: 'Pebane', postos: [{ name: 'Pebane' }, { name: 'Alto Ligonha' }] },
      { name: 'Quelimane', postos: [{ name: 'Quelimane' }, { name: 'Inhassunge' }] },
    ],
  },
  {
    name: 'Tete',
    districts: [
      { name: 'Angónia', postos: [{ name: 'Angónia' }, { name: 'Ulónguè' }] },
      { name: 'Cahora-Bassa', postos: [{ name: 'Cahora-Bassa' }, { name: 'Chitima' }] },
      { name: 'Changara', postos: [{ name: 'Changara' }, { name: 'Chioco' }] },
      { name: 'Chifunde', postos: [{ name: 'Chifunde' }] },
      { name: 'Chiúta', postos: [{ name: 'Chiúta' }] },
      { name: 'Dôa', postos: [{ name: 'Dôa' }] },
      { name: 'Macanga', postos: [{ name: 'Macanga' }] },
      { name: 'Mágoè', postos: [{ name: 'Mágoè' }] },
      { name: 'Marara', postos: [{ name: 'Marara' }] },
      { name: 'Marávia', postos: [{ name: 'Marávia' }] },
      { name: 'Moatize', postos: [{ name: 'Moatize' }, { name: 'Zobué' }] },
      { name: 'Mutarara', postos: [{ name: 'Mutarara' }, { name: 'Inhangoma' }] },
      { name: 'Tete', postos: [{ name: 'Tete' }, { name: 'Mpadue' }] },
      { name: 'Tsangano', postos: [{ name: 'Tsangano' }] },
      { name: 'Zumbo', postos: [{ name: 'Zumbo' }] },
    ],
  },
  {
    name: 'Manica',
    districts: [
      { name: 'Bárue', postos: [{ name: 'Bárue' }, { name: 'Catandica' }] },
      { name: 'Chimoio', postos: [{ name: 'Chimoio' }, { name: 'Nhamaonha' }] },
      { name: 'Gondola', postos: [{ name: 'Gondola' }, { name: 'Inchope' }] },
      { name: 'Guro', postos: [{ name: 'Guro' }, { name: 'Macossa' }] },
      { name: 'Machaze', postos: [{ name: 'Machaze' }] },
      { name: 'Macossa', postos: [{ name: 'Macossa' }] },
      { name: 'Manica', postos: [{ name: 'Manica' }, { name: 'Machipanda' }] },
      { name: 'Mossurize', postos: [{ name: 'Mossurize' }, { name: 'Espungabera' }] },
      { name: 'Sussundenga', postos: [{ name: 'Sussundenga' }, { name: 'Dombe' }] },
      { name: 'Tambara', postos: [{ name: 'Tambara' }] },
      { name: 'Vanduzi', postos: [{ name: 'Vanduzi' }] },
    ],
  },
  {
    name: 'Sofala',
    districts: [
      { name: 'Beira', postos: [{ name: 'Beira' }, { name: 'Dondo' }] },
      { name: 'Búzi', postos: [{ name: 'Búzi' }, { name: 'Nova Sofala' }] },
      { name: 'Caia', postos: [{ name: 'Caia' }, { name: 'Sena' }] },
      { name: 'Cheringoma', postos: [{ name: 'Cheringoma' }, { name: 'Inhaminga' }] },
      { name: 'Chibabava', postos: [{ name: 'Chibabava' }, { name: 'Muxúnguè' }] },
      { name: 'Dondo', postos: [{ name: 'Dondo' }] },
      { name: 'Gorongosa', postos: [{ name: 'Gorongosa' }, { name: 'Sadjunjira' }] },
      { name: 'Machanga', postos: [{ name: 'Machanga' }] },
      { name: 'Maríngue', postos: [{ name: 'Maríngue' }] },
      { name: 'Marromeu', postos: [{ name: 'Marromeu' }, { name: 'Luabo' }] },
      { name: 'Muanza', postos: [{ name: 'Muanza' }] },
      { name: 'Nhamatanda', postos: [{ name: 'Nhamatanda' }, { name: 'Tica' }] },
    ],
  },
  {
    name: 'Inhambane',
    districts: [
      { name: 'Funhalouro', postos: [{ name: 'Funhalouro' }, { name: 'Nhachengue' }] },
      { name: 'Govuro', postos: [{ name: 'Govuro' }, { name: 'Machanga' }] },
      { name: 'Homoíne', postos: [{ name: 'Homoíne' }, { name: 'Linga-Linga' }] },
      {
        name: 'Inhambane',
        postos: [
          { name: 'Inhambane', localidades: ['Inhambane', 'Maxixe'] },
          { name: 'Morrumbene', localidades: ['Morrumbene'] },
          { name: 'Zavala', localidades: ['Quissico', 'Inharrime'] },
        ],
      },
      { name: 'Inhassoro', postos: [{ name: 'Inhassoro' }, { name: 'Bazaruto' }] },
      { name: 'Jangamo', postos: [{ name: 'Jangamo' }, { name: 'Cumbana' }, { name: 'Ninga' }] },
      { name: 'Mabote', postos: [{ name: 'Mabote' }, { name: 'Zimane' }] },
      { name: 'Massinga', postos: [{ name: 'Massinga' }, { name: 'Morrungulo' }] },
      {
        name: 'Morrumbene',
        postos: [
          { name: 'Morrumbene', localidades: ['Morrumbene'] },
          { name: 'Cambine', localidades: ['Cambine'] },
          { name: 'Mocodoene', localidades: ['Mocodoene'] },
          { name: 'Mugubia', localidades: ['Mugubia'] },
        ],
      },
      { name: 'Panda', postos: [{ name: 'Panda' }, { name: 'Mabote' }] },
      { name: 'Vilankulo', postos: [{ name: 'Vilankulo' }, { name: 'Mapinhane' }, { name: 'Chibuene' }] },
      { name: 'Zavala', postos: [{ name: 'Zavala' }, { name: 'Inharrime' }, { name: 'Quissico' }] },
    ],
  },
  {
    name: 'Gaza',
    districts: [
      { name: 'Bilene', postos: [{ name: 'Bilene' }, { name: 'Macia' }] },
      { name: 'Chibuto', postos: [{ name: 'Chibuto' }, { name: 'Changanine' }] },
      { name: 'Chicualacuala', postos: [{ name: 'Chicualacuala' }, { name: 'Mapai' }] },
      { name: 'Chigubo', postos: [{ name: 'Chigubo' }] },
      { name: 'Chókwè', postos: [{ name: 'Chókwè' }, { name: 'Lionde' }] },
      { name: 'Guijá', postos: [{ name: 'Guijá' }, { name: 'Eduardo Mondlane' }] },
      { name: 'Limpopo', postos: [{ name: 'Limpopo' }] },
      { name: 'Mabalane', postos: [{ name: 'Mabalane' }] },
      { name: 'Manjacaze', postos: [{ name: 'Manjacaze' }, { name: 'Chibonzane' }] },
      { name: 'Mapai', postos: [{ name: 'Mapai' }] },
      { name: 'Massingir', postos: [{ name: 'Massingir' }] },
      { name: 'Xai-Xai', postos: [{ name: 'Xai-Xai' }, { name: 'Chilaulane' }] },
    ],
  },
  {
    name: 'Maputo Província',
    aliases: ['Maputo Province', 'Maputo Provincia'],
    districts: [
      { name: 'Boane', postos: [{ name: 'Boane' }, { name: 'Campoane' }] },
      { name: 'Magude', postos: [{ name: 'Magude' }, { name: 'Motaze' }] },
      { name: 'Manhiça', postos: [{ name: 'Manhiça' }, { name: 'Ilha Josina Machel' }] },
      { name: 'Marracuene', postos: [{ name: 'Marracuene' }] },
      { name: 'Matola', postos: [{ name: 'Matola' }] },
      { name: 'Matutuíne', postos: [{ name: 'Matutuíne' }, { name: 'Catuane' }, { name: 'Bela Vista' }] },
      { name: 'Moamba', postos: [{ name: 'Moamba' }, { name: 'Pessene' }] },
      { name: 'Namaacha', postos: [{ name: 'Namaacha' }] },
    ],
  },
  {
    name: 'Cidade de Maputo',
    aliases: ['Maputo City', 'Maputo'],
    districts: [
      { name: 'KaMpfumo', postos: [{ name: 'KaMpfumo' }] },
      { name: 'Nlhamankulu', postos: [{ name: 'Nlhamankulu' }] },
      { name: 'KaMaxaquene', postos: [{ name: 'KaMaxaquene' }] },
      { name: 'KaMavota', postos: [{ name: 'KaMavota' }] },
      { name: 'KaMubukwana', postos: [{ name: 'KaMubukwana' }] },
      { name: 'KaTembe', postos: [{ name: 'KaTembe' }] },
      { name: 'KaNyaka', postos: [{ name: 'KaNyaka' }] },
    ],
  },
];

// ── Funções de consulta ───────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function matches(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

/**
 * Remove prefixos geográficos que o Nominatim adiciona mas que não fazem
 * parte do nome oficial do nível administrativo.
 * Ex: "Cidade de Inhambane" → "Inhambane"
 *     "Distrito de Morrumbene" → "Morrumbene"
 *     "Município de Maputo" → "Maputo"
 */
function cleanAdminName(s: string | undefined): string | undefined {
  if (!s) return s;
  return s
    .replace(/^cidade\s+de\s+/i, '')
    .replace(/^distrito\s+de\s+/i, '')
    .replace(/^município\s+de\s+/i, '')
    .replace(/^municipio\s+de\s+/i, '')
    .replace(/^posto\s+administrativo\s+de\s+/i, '')
    .replace(/^vila\s+de\s+/i, '')
    .replace(/^town\s+of\s+/i, '')
    .replace(/^city\s+of\s+/i, '')
    .trim() || s;
}

export interface ClassifiedAdmin {
  country:           string;
  province:          string;
  district:          string;
  administrativePost:string;
  city:              string;
  confidence:        'high' | 'medium' | 'low';
  warnings:          string[];
}

/**
 * Valida e classifica os dados do Nominatim contra a base oficial.
 * Garante que cada valor está no campo correcto.
 */
export function classifyAdminData(nominatim: {
  country?: string;
  state?: string;
  municipality?: string;
  county?: string;
  town?: string;
  city?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  locality?: string;
  administrative_post?: string;
  quarter?: string;
  neighbourhood?: string;
}): ClassifiedAdmin {
  const warnings: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'high';

  const country = nominatim.country || 'Moçambique';

  // Limpar prefixos de todos os valores antes de classificar
  const clean = {
    state:              cleanAdminName(nominatim.state),
    municipality:       cleanAdminName(nominatim.municipality),
    county:             cleanAdminName(nominatim.county),
    town:               cleanAdminName(nominatim.town),
    city:               cleanAdminName(nominatim.city),
    village:            cleanAdminName(nominatim.village),
    hamlet:             cleanAdminName(nominatim.hamlet),
    suburb:             cleanAdminName(nominatim.suburb),
    locality:           cleanAdminName(nominatim.locality),
    administrative_post: cleanAdminName(nominatim.administrative_post),
    quarter:            cleanAdminName(nominatim.quarter),
    neighbourhood:      cleanAdminName(nominatim.neighbourhood),
  };

  // 1. Identificar a Província
  const rawState = clean.state || '';
  const province = MOZAMBIQUE_ADMIN.find(p =>
    matches(p.name, rawState) || p.aliases?.some(a => matches(a, rawState))
  )?.name || rawState;

  if (!province) {
    warnings.push('Província não identificada');
    confidence = 'low';
  }

  // 2. Encontrar a entrada da província na base
  const provinceEntry = MOZAMBIQUE_ADMIN.find(p =>
    matches(p.name, province) || p.aliases?.some(a => matches(a, province))
  );

  // 3. Candidatos a Distrito — APENAS campos que representam divisões administrativas oficiais
  // NUNCA usar town, city, village, hamlet como distrito
  // Esses nomes representam localidades, não distritos
  const districtCandidates = [
    clean.municipality,  // campo mais fiável no Nominatim MZ
    clean.county,        // alternativa em algumas zonas
  ].filter(Boolean) as string[];

  let district = '';
  let districtEntry: District | undefined;

  // Tentar cada candidato contra a base de dados
  for (const candidate of districtCandidates) {
    const found = provinceEntry?.districts.find(d => matches(d.name, candidate));
    if (found) {
      district = found.name;
      districtEntry = found;
      break;
    }
  }

  // Fallback: procurar em todas as províncias se não encontrou
  if (!district && provinceEntry) {
    for (const candidate of districtCandidates) {
      for (const prov of MOZAMBIQUE_ADMIN) {
        const found = prov.districts.find(d => matches(d.name, candidate));
        if (found) {
          district = found.name;
          districtEntry = found;
          if (!matches(prov.name, province)) {
            warnings.push(`Distrito "${district}" encontrado em "${prov.name}", não em "${province}"`);
            confidence = 'medium';
          }
          break;
        }
      }
      if (district) break;
    }
  }

  if (!district && districtCandidates.length > 0) {
    // NÃO usar o candidato como fallback se não estiver na base.
    // Deixar vazio e deixar o utilizador preencher manualmente.
    // Isto previne "Praia da Barra" ou outros nomes de localidades aparecerem como Distrito.
    warnings.push(`Distrito não identificado na base administrativa. Preencha manualmente.`);
    confidence = 'low';
    // district permanece ''
  }

  // 4. Identificar o Posto Administrativo
  // Candidatos: municipality (se não usada no distrito), locality, suburb, quarter
  const adminPostCandidates = [
    clean.administrative_post,
    clean.locality,
    clean.suburb,
    clean.quarter,
    clean.neighbourhood,
    // municipality só como posto se o distrito já foi identificado por outro campo
    ...(district && !matches(district, clean.municipality || '') ? [clean.municipality] : []),
  ].filter(Boolean) as string[];

  let administrativePost = '';
  for (const candidate of adminPostCandidates) {
    if (matches(candidate, district)) continue; // não repetir o distrito
    const found = districtEntry?.postos.find(p => matches(p.name, candidate));
    if (found) {
      administrativePost = found.name;
      break;
    }
    // Não está na base mas é um candidato válido (não é o distrito)
    if (!administrativePost && !matches(candidate, district) && !matches(candidate, province)) {
      administrativePost = candidate;
      confidence = confidence === 'high' ? 'medium' : confidence;
    }
  }

  // 5. Identificar Localidade/Vila/Cidade — já limpa de prefixos
  const cityCandidates = [
    clean.village,
    clean.hamlet,
    clean.town,
    clean.city,
    clean.suburb,
    clean.locality,
  ].filter(Boolean) as string[];

  let city = '';
  for (const candidate of cityCandidates) {
    if (matches(candidate, district)) continue;
    if (matches(candidate, administrativePost)) continue;
    if (matches(candidate, province)) continue;
    // Verificar nas localidades da base
    const isKnownLocality = districtEntry?.postos.some(
      p => p.localidades?.some(l => matches(l, candidate))
    );
    if (isKnownLocality || candidate.length > 2) {
      city = candidate;
      break;
    }
  }

  return { country, province, district, administrativePost, city, confidence, warnings };
}

/**
 * Verifica se um valor é um Distrito de uma determinada Província.
 */
export function isDistrict(value: string, province?: string): boolean {
  if (province) {
    const prov = MOZAMBIQUE_ADMIN.find(p =>
      matches(p.name, province) || p.aliases?.some(a => matches(a, province))
    );
    return !!prov?.districts.find(d => matches(d.name, value));
  }
  return MOZAMBIQUE_ADMIN.some(p => p.districts.some(d => matches(d.name, value)));
}

/**
 * Retorna os distritos de uma província.
 */
export function getDistricts(province: string): string[] {
  const prov = MOZAMBIQUE_ADMIN.find(p =>
    matches(p.name, province) || p.aliases?.some(a => matches(a, province))
  );
  return prov?.districts.map(d => d.name) || [];
}

/**
 * Retorna os postos administrativos de um distrito.
 */
export function getAdminPosts(district: string, province?: string): string[] {
  let districtEntry: District | undefined;
  if (province) {
    const prov = MOZAMBIQUE_ADMIN.find(p =>
      matches(p.name, province) || p.aliases?.some(a => matches(a, province))
    );
    districtEntry = prov?.districts.find(d => matches(d.name, district));
  } else {
    for (const prov of MOZAMBIQUE_ADMIN) {
      districtEntry = prov.districts.find(d => matches(d.name, district));
      if (districtEntry) break;
    }
  }
  return districtEntry?.postos.map(p => p.name) || [];
}
