export const CATEGORIES = [
  { id: 'praias',    label: 'Praias',            emoji: '🏖️', color: '#2BB5C8' },
  { id: 'cultura',   label: 'Cultura & História', emoji: '🏛️', color: '#7B5EA7' },
  { id: 'natureza',  label: 'Natureza',           emoji: '🌿', color: '#1B5E3B' },
  { id: 'aventura',  label: 'Aventura',           emoji: '🧗', color: '#F4821F' },
  { id: 'gastro',    label: 'Gastronomia',        emoji: '🍽️', color: '#E05A3A' },
  { id: 'mergulho',  label: 'Mergulho',           emoji: '🤿', color: '#2563EB' },
  { id: 'ecoturismo',label: 'Ecoturismo',         emoji: '🌱', color: '#22C55E' },
  { id: 'outro',     label: 'Outro',              emoji: '📍', color: '#9CA3AF' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export const getCategoryByLabel = (label: string) =>
  CATEGORIES.find(c => c.label === label);

export const getCategoryById = (id: string) =>
  CATEGORIES.find(c => c.id === id);

// For picker sheets (label only)
export const CATEGORY_LABELS = CATEGORIES.map(c => c.label);

// For display with emoji
export const formatCategory = (labelOrId: string) => {
  const cat = CATEGORIES.find(c => c.label === labelOrId || c.id === labelOrId);
  return cat ? `${cat.emoji} ${cat.label}` : labelOrId;
};
