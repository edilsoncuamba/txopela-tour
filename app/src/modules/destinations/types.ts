// Destinations Module Types

import type { Province } from '@/types/geography';
import type { MediaItem } from '@/modules/culture/types';

export type DestinationType = 
  | 'beach'
  | 'park'
  | 'monument'
  | 'museum'
  | 'natural-reserve'
  | 'historical-site'
  | 'viewpoint'
  | 'cultural-center';

export interface DirectionsInfo {
  byRoad?: string;
  byPublicTransport?: string;
  byAir?: string;
  parking?: string;
  notes?: string;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  notes?: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface Destination {
  id: string;
  name: string;
  type: DestinationType;
  province: Province;
  district: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  summary: string;
  description: string;
  highlights: string[];
  photos: MediaItem[];
  directions: DirectionsInfo;
  accessibility: AccessibilityInfo;
  facilities: string[];
  bestTimeToVisit?: string;
  entryFee?: {
    local?: number;
    foreign?: number;
    currency: string;
  };
  openingHours?: {
    weekdays?: string;
    weekends?: string;
    notes?: string;
  };
  contacts?: ContactInfo;
  relatedStories?: string[]; // Story IDs
  relatedServices?: string[]; // Service IDs
  rating?: number;
  reviewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DestinationFilter {
  province?: Province;
  district?: string;
  type?: DestinationType;
  searchQuery?: string;
}

// Helper function to get destination type display name
export function getDestinationTypeName(type: DestinationType): string {
  const names: Record<DestinationType, string> = {
    'beach': 'Praia',
    'park': 'Parque',
    'monument': 'Monumento',
    'museum': 'Museu',
    'natural-reserve': 'Reserva Natural',
    'historical-site': 'Sítio Histórico',
    'viewpoint': 'Miradouro',
    'cultural-center': 'Centro Cultural',
  };
  return names[type];
}

// All destination types
export const ALL_DESTINATION_TYPES: DestinationType[] = [
  'beach',
  'park',
  'monument',
  'museum',
  'natural-reserve',
  'historical-site',
  'viewpoint',
  'cultural-center',
];
