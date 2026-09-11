// Culture Module Types - Enhanced for Cultural Heritage
export interface CulturalHeritage {
  id: string;
  name: string;
  category: 'Monumento' | 'Conjunto' | 'Sítio' | 'Outros';
  registryNumber: string;
  classProposed: 'A' | 'B' | 'C' | 'D';
  criteria: string[];
  description: string;
  
  // Location
  province: string;
  district: string;
  administrativePost?: string;
  locality?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Media
  images: string[];
  mainImage: string;
  
  // Immovable Property in Surrounding Space
  surroundingSpaceProperty?: string[];
  
  // Centro de Interpretação
  interpretationCenter?: string;
  
  // Publication info (same as posts/destinations)
  author: {
    id: string;
    name: string;
    avatar?: string;
    type: 'guide' | 'traveler' | 'resident' | 'business';
  };
  createdAt: string;
  
  // Engagement stats
  views: number;
  favorites: number;
  comments: number;
  shares: number;
  
  // Rating
  rating?: number;
  reviewsCount?: number;
}

export interface ProvinceInfo {
  id: string;
  name: string;
  description: string;
  culturalDescription: string;
  image: string;
  heritageCount: number;
  districts: string[];
}

// Media item for galleries
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  credit?: string;
  thumbnail?: string;
}

// API Response types
export interface CulturalHeritageListResponse {
  success: boolean;
  data: {
    heritage: CulturalHeritage[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
    };
  };
}

export interface ProvinceListResponse {
  success: boolean;
  data: {
    provinces: ProvinceInfo[];
  };
}