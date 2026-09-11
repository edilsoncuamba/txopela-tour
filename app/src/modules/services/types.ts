// Services Module Types

import type { Province } from '@/types/geography';
import type { MediaItem } from '@/modules/culture/types';
import type { ContactInfo } from '@/modules/destinations/types';

export type ServiceCategory = 
  | 'hotel'
  | 'lodge'
  | 'restaurant'
  | 'transport'
  | 'tour-guide'
  | 'travel-agency'
  | 'car-rental';

export interface PricingInfo {
  range: 'budget' | 'mid-range' | 'luxury';
  currency: string;
  details?: string;
  priceFrom?: number;
  priceTo?: number;
}

export interface TouristService {
  id: string;
  name: string;
  category: ServiceCategory;
  province: Province;
  district: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  photos: MediaItem[];
  contacts: ContactInfo;
  openingHours?: {
    weekdays?: string;
    weekends?: string;
    notes?: string;
  };
  pricing?: PricingInfo;
  amenities?: string[];
  languages?: string[];
  rating?: number;
  reviewsCount?: number;
  verified: boolean;
  relatedDestinations?: string[]; // Destination IDs
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFilter {
  province?: Province;
  district?: string;
  category?: ServiceCategory;
  priceRange?: 'budget' | 'mid-range' | 'luxury';
  rating?: number;
  searchQuery?: string;
}

// Helper function to get service category display name
export function getServiceCategoryName(category: ServiceCategory): string {
  const names: Record<ServiceCategory, string> = {
    'hotel': 'Hotel',
    'lodge': 'Lodge',
    'restaurant': 'Restaurante',
    'transport': 'Transporte',
    'tour-guide': 'Guia Turístico',
    'travel-agency': 'Agência de Turismo',
    'car-rental': 'Aluguer de Carros',
  };
  return names[category];
}

// All service categories
export const ALL_SERVICE_CATEGORIES: ServiceCategory[] = [
  'hotel',
  'lodge',
  'restaurant',
  'transport',
  'tour-guide',
  'travel-agency',
  'car-rental',
];

// Helper function to get price range display name
export function getPriceRangeName(range: 'budget' | 'mid-range' | 'luxury'): string {
  const names = {
    'budget': 'Económico',
    'mid-range': 'Médio',
    'luxury': 'Luxo',
  };
  return names[range];
}
