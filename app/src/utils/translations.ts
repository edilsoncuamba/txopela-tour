/**
 * DICIONÁRIO DE TRADUÇÕES — Txopela Tour
 *
 * Fonte única de verdade para tradução de enums da API para Português.
 * Todos os componentes DEVEM usar estas funções — nunca renderizar
 * valores da API directamente como label visível ao utilizador.
 */

// ─── Categorias de Locais ─────────────────────────────────────────────────────
export const LOCAL_CATEGORY_PT: Record<string, string> = {
  restaurant:       'Restaurante',
  hotel:            'Hospedagem',
  attraction:       'Atração',
  shop:             'Loja',
  service:          'Serviço',
  // subcategorias comuns
  beach:            'Praia',
  park:             'Parque',
  museum:           'Museu',
  monument:         'Monumento',
  market:           'Mercado',
  bar:              'Bar',
  cafe:             'Café',
  spa:              'Spa',
  sport:            'Desporto',
  nature:           'Natureza',
  lodge:            'Lodge',
  waterfall:        'Cascata',
  reserve:          'Reserva',
  heritage:         'Património',
  cultural:         'Cultural',
  historic:         'Histórico',
  island:           'Ilha',
  lake:             'Lago',
  forest:           'Floresta',
};

// ─── Categorias de Serviços ───────────────────────────────────────────────────
export const SERVICE_CATEGORY_PT: Record<string, string> = {
  transport:        'Transporte',
  guide:            'Guia Turístico',
  accommodation:    'Hospedagem',
  experience:       'Experiência',
  equipment:        'Equipamento',
  tour_guide:       'Guia Turístico',
  'tour-guide':     'Guia Turístico',
  travel_agency:    'Agência de Viagens',
  'travel-agency':  'Agência de Viagens',
  food:             'Gastronomia',
  entertainment:    'Entretenimento',
  health:           'Saúde',
  other:            'Outro',
};

// ─── Categorias de Posts ──────────────────────────────────────────────────────
export const POST_CATEGORY_PT: Record<string, string> = {
  discovery:        'Descoberta',
  review:           'Avaliação',
  tip:              'Dica',
  story:            'História',
  other:            'Publicação',
  // Aliases que a API pode devolver em posts
  post:             'Publicação',
  news:             'Notícia',
  event:            'Evento',
  article:          'Artigo',
  photo:            'Fotografia',
  video:            'Vídeo',
};

// ─── Status de publicações ────────────────────────────────────────────────────
export const STATUS_PT: Record<string, string> = {
  pending:   'Em revisão',
  approved:  'Aprovado',
  rejected:  'Rejeitado',
  // reservas
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
};

// ─── Tipo de utilizador ───────────────────────────────────────────────────────
export const USER_TYPE_PT: Record<string, string> = {
  guide:          'Guia Turístico',
  curator:        'Guia Turístico',
  traveler:       'Viajante',
  tourist:        'Turista',
  resident:       'Morador Local',
  local_resident: 'Morador Local',
  business:       'Negócio',
  local_business: 'Negócio',
};

// ─── Cores por categoria de local ─────────────────────────────────────────────
export const LOCAL_CATEGORY_COLOR: Record<string, string> = {
  restaurant:  '#E05A3A',
  hotel:       '#2563EB',
  attraction:  '#1B5E3B',
  shop:        '#7B5EA7',
  service:     '#F4821F',
  beach:       '#2BB5C8',
  park:        '#22C55E',
  museum:      '#7B5EA7',
  monument:    '#F4821F',
  market:      '#E05A3A',
};

// ─── Cores por categoria de serviço ───────────────────────────────────────────
export const SERVICE_CATEGORY_COLOR: Record<string, string> = {
  transport:     '#2563EB',
  guide:         '#F4821F',
  accommodation: '#2BB5C8',
  experience:    '#22C55E',
  equipment:     '#E05A3A',
};

// ─── Cores por categoria de post ──────────────────────────────────────────────
export const POST_CATEGORY_COLOR: Record<string, string> = {
  discovery: '#1B5E3B',
  review:    '#F4821F',
  tip:       '#2BB5C8',
  story:     '#7B5EA7',
  other:     '#6B7280',
};

// ─── Mapeamento Filtros UI → Categorias/Subcategorias da API ─────────────────
/**
 * Para cada filtro visível no UI, lista quais os valores que a API pode
 * devolver em `category` (EN) e em `subcategory` (EN ou PT).
 * O filtro funciona verificando se o item tem QUALQUER destes valores.
 */
export const FILTER_TO_API_VALUES: Record<string, { categories: string[]; subcategories: string[] }> = {
  'Praias': {
    categories:    ['attraction', 'beach'],
    subcategories: ['praia', 'beach', 'praias', 'praia de areia', 'praia fluvial'],
  },
  'Cultura & História': {
    categories:    ['attraction', 'museum', 'monument'],
    subcategories: ['museu', 'museum', 'monumento', 'monument', 'cultura', 'history',
                    'histórico', 'historic', 'patrimônio', 'patrimonio', 'heritage',
                    'arte', 'art', 'galeria', 'gallery'],
  },
  'Natureza': {
    categories:    ['attraction', 'park'],
    subcategories: ['natureza', 'nature', 'parque', 'park', 'reserva', 'reserve',
                    'floresta', 'forest', 'rio', 'river', 'lago', 'lake',
                    'cachoeira', 'waterfall', 'trilha', 'trail', 'safari'],
  },
  'Aventura': {
    categories:    ['attraction', 'sport'],
    subcategories: ['aventura', 'adventure', 'desporto', 'sport', 'escalada', 'climbing',
                    'rafting', 'parapente', 'paragliding', 'kayak', 'trekking',
                    'quad', 'off-road', 'rappel', 'zip line'],
  },
  'Gastronomia': {
    categories:    ['restaurant', 'bar', 'cafe', 'market'],
    subcategories: ['restaurante', 'restaurant', 'gastronomia', 'gastronomy', 'bar',
                    'café', 'cafe', 'comida', 'food', 'mercado', 'market',
                    'marisqueira', 'seafood', 'culinária', 'cuisine'],
  },
  'Mergulho': {
    categories:    ['attraction'],
    subcategories: ['mergulho', 'diving', 'snorkel', 'snorkeling', 'scuba',
                    'submarino', 'underwater', 'recife', 'reef', 'tubarão', 'shark'],
  },
  'Ecoturismo': {
    categories:    ['attraction', 'park'],
    subcategories: ['ecoturismo', 'ecotourism', 'eco', 'sustentável', 'sustainable',
                    'conservação', 'conservation', 'comunidade', 'community',
                    'aldeia', 'village', 'responsável', 'responsible'],
  },
};

/**
 * Verifica se um item (local) corresponde a um filtro UI.
 * Compara `categoryKey` (EN) e `subcategory` (PT ou EN) com os valores
 * definidos no mapeamento acima.
 */
export function itemMatchesFilter(
  item: { categoryKey?: string; subcategory?: string; tag?: string; name?: string },
  filterLabel: string,
): boolean {
  const mapping = FILTER_TO_API_VALUES[filterLabel];
  if (!mapping) return false;

  const cat = (item.categoryKey || '').toLowerCase().trim();
  const sub = (item.subcategory || '').toLowerCase().trim();
  const tag = (item.tag || '').toLowerCase().trim();
  const name = (item.name || '').toLowerCase().trim();

  // Comparar categoryKey com as categorias do filtro
  if (mapping.categories.some(c => c.toLowerCase() === cat)) {
    // Verificar subcategoria se existir
    if (sub) {
      return mapping.subcategories.some(s => sub.includes(s.toLowerCase()) || s.toLowerCase().includes(sub));
    }
    // Sem subcategoria mas tem categoria correcta — para "Praias" isso é o caso principal
    // Para outros filtros, só aceitar se não houver ambiguidade
    if (filterLabel === 'Praias') return true;
  }

  // Comparar subcategoria directamente
  if (sub && mapping.subcategories.some(s => sub.includes(s.toLowerCase()) || s.toLowerCase().includes(sub))) {
    return true;
  }

  // Fallback: comparar tag traduzida ou nome do local
  const filterLower = filterLabel.toLowerCase();
  if (tag.includes(filterLower) || filterLower.includes(tag)) return true;

  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Dicionário unificado — cobre TODOS os valores que a API pode devolver em
 * qualquer campo de categoria, independentemente do tipo de recurso.
 * Usado como fallback final em todas as funções de tradução.
 */
const ALL_CATEGORIES_PT: Record<string, string> = {
  ...LOCAL_CATEGORY_PT,
  ...SERVICE_CATEGORY_PT,
  ...POST_CATEGORY_PT,
};

/**
 * Traduz qualquer string de categoria para português.
 * Tenta nos três dicionários; se não encontrar, devolve o valor original
 * com a primeira letra em maiúscula.
 */
function translateAny(category: string): string {
  const key = category.toLowerCase().trim();
  return ALL_CATEGORIES_PT[key] ?? (category.charAt(0).toUpperCase() + category.slice(1));
}

/** Traduz categoria de local. */
export function translateLocalCategory(category: string | undefined | null): string {
  if (!category) return 'Atração';
  return translateAny(category);
}

/** Traduz categoria de serviço. */
export function translateServiceCategory(category: string | undefined | null): string {
  if (!category) return 'Serviço';
  return translateAny(category);
}

/** Traduz categoria de post/publicação. */
export function translatePostCategory(category: string | undefined | null): string {
  if (!category) return 'Publicação';
  return translateAny(category);
}

/** Traduz status de publicação/reserva. */
export function translateStatus(status: string | undefined | null): string {
  if (!status) return 'Em revisão';
  return STATUS_PT[status.toLowerCase()] ?? status;
}

/** Traduz tipo de utilizador. */
export function translateUserType(type: string | undefined | null): string {
  if (!type) return 'Utilizador';
  return USER_TYPE_PT[type.toLowerCase()] ?? type;
}

/** Cor por categoria de local. */
export function localCategoryColor(category: string | undefined | null): string {
  if (!category) return '#1B5E3B';
  return LOCAL_CATEGORY_COLOR[category.toLowerCase()] ?? '#1B5E3B';
}

/** Cor por categoria de serviço. */
export function serviceCategoryColor(category: string | undefined | null): string {
  if (!category) return '#1B5E3B';
  return SERVICE_CATEGORY_COLOR[category.toLowerCase()] ?? '#1B5E3B';
}

/** Cor por categoria de post. */
export function postCategoryColor(category: string | undefined | null): string {
  if (!category) return '#6B7280';
  return POST_CATEGORY_COLOR[category.toLowerCase()] ?? '#6B7280';
}
