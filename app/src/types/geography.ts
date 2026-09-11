// Geography types for Mozambique provinces and districts

export type Province = 
  | 'maputo'
  | 'gaza'
  | 'inhambane'
  | 'sofala'
  | 'manica'
  | 'tete'
  | 'zambezia'
  | 'nampula'
  | 'niassa'
  | 'cabo-delgado'
  | 'maputo-cidade';

export interface ProvinceInfo {
  id: Province;
  name: string;
  capital: string;
  districts: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface District {
  id: string;
  name: string;
  province: Province;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Helper function to get province display name
export function getProvinceName(province: Province): string {
  const names: Record<Province, string> = {
    'maputo': 'Maputo',
    'gaza': 'Gaza',
    'inhambane': 'Inhambane',
    'sofala': 'Sofala',
    'manica': 'Manica',
    'tete': 'Tete',
    'zambezia': 'Zambézia',
    'nampula': 'Nampula',
    'niassa': 'Niassa',
    'cabo-delgado': 'Cabo Delgado',
    'maputo-cidade': 'Maputo Cidade',
  };
  return names[province];
}

// All provinces list
export const ALL_PROVINCES: Province[] = [
  'maputo',
  'gaza',
  'inhambane',
  'sofala',
  'manica',
  'tete',
  'zambezia',
  'nampula',
  'niassa',
  'cabo-delgado',
  'maputo-cidade',
];
