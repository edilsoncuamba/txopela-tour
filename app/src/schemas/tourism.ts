// Zod validation schemas for tourism modules

import { z } from 'zod';

// ============================================================================
// Geography Schemas
// ============================================================================

export const ProvinceSchema = z.enum([
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
]);

export const ProvinceInfoSchema = z.object({
  id: ProvinceSchema,
  name: z.string().min(1, 'Province name is required'),
  capital: z.string().min(1, 'Capital is required'),
  districts: z.array(z.string()),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

export const DistrictSchema = z.object({
  id: z.string().min(1, 'District ID is required'),
  name: z.string().min(1, 'District name is required'),
  province: ProvinceSchema,
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

// ============================================================================
// Shared Schemas
// ============================================================================

export const MediaItemSchema = z.object({
  id: z.string().min(1, 'Media ID is required'),
  url: z.string().url('Invalid media URL'),
  type: z.enum(['image', 'video']),
  caption: z.string().optional(),
  credit: z.string().optional(),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
});

export const ContactInfoSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  website: z.string().url('Invalid website URL').optional(),
  socialMedia: z.object({
    facebook: z.string().url('Invalid Facebook URL').optional(),
    instagram: z.string().url('Invalid Instagram URL').optional(),
    twitter: z.string().url('Invalid Twitter URL').optional(),
  }).optional(),
});

// ============================================================================
// Culture Module Schemas
// ============================================================================

export const TraditionItemSchema = z.object({
  id: z.string().min(1, 'Tradition ID is required'),
  name: z.string().min(1, 'Tradition name is required'),
  description: z.string().min(1, 'Description is required'),
  significance: z.string().min(1, 'Significance is required'),
  images: z.array(z.string().url('Invalid image URL')),
  relatedStories: z.array(z.string()).optional(),
});

export const TraditionSectionSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  description: z.string().min(1, 'Section description is required'),
  items: z.array(TraditionItemSchema),
});

export const DanceSchema = z.object({
  id: z.string().min(1, 'Dance ID is required'),
  name: z.string().min(1, 'Dance name is required'),
  description: z.string().min(1, 'Description is required'),
  origin: z.string().min(1, 'Origin is required'),
  occasions: z.array(z.string()),
  videoUrl: z.string().url('Invalid video URL').optional(),
  images: z.array(z.string().url('Invalid image URL')),
});

export const DanceSectionSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  description: z.string().min(1, 'Section description is required'),
  dances: z.array(DanceSchema),
});

export const DishSchema = z.object({
  id: z.string().min(1, 'Dish ID is required'),
  name: z.string().min(1, 'Dish name is required'),
  description: z.string().min(1, 'Description is required'),
  ingredients: z.array(z.string()),
  preparation: z.string().optional(),
  images: z.array(z.string().url('Invalid image URL')),
  relatedServices: z.array(z.string()).optional(),
});

export const GastronomySectionSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  description: z.string().min(1, 'Section description is required'),
  dishes: z.array(DishSchema),
});

export const CulturalEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
  name: z.string().min(1, 'Event name is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().optional(),
  frequency: z.enum(['annual', 'monthly', 'seasonal', 'occasional']),
  location: z.string().optional(),
  images: z.array(z.string().url('Invalid image URL')),
});

export const EventSectionSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  description: z.string().min(1, 'Section description is required'),
  events: z.array(CulturalEventSchema),
});

export const CulturalContentSchema = z.object({
  id: z.string().min(1, 'Content ID is required'),
  province: ProvinceSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  sections: z.object({
    traditions: TraditionSectionSchema.optional(),
    dances: DanceSectionSchema.optional(),
    gastronomy: GastronomySectionSchema.optional(),
    events: EventSectionSchema.optional(),
  }),
  media: z.object({
    photos: z.array(MediaItemSchema),
    videos: z.array(MediaItemSchema),
  }),
  createdAt: z.string().datetime('Invalid date format'),
  updatedAt: z.string().datetime('Invalid date format'),
});

// ============================================================================
// Stories Module Schemas
// ============================================================================

export const StoryTypeSchema = z.enum([
  'legend',
  'historical-fact',
  'curiosity',
  'cultural-narrative',
]);

export const StorySchema = z.object({
  id: z.string().min(1, 'Story ID is required'),
  title: z.string().min(1, 'Title is required'),
  type: StoryTypeSchema,
  province: ProvinceSchema,
  district: z.string().optional(),
  locality: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().min(1, 'Summary is required'),
  period: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  relatedLocations: z.array(z.string()).optional(),
  relatedCulture: z.array(z.string()).optional(),
  images: z.array(z.string().url('Invalid image URL')),
  author: z.string().optional(),
  sources: z.array(z.string()).optional(),
  createdAt: z.string().datetime('Invalid date format'),
  updatedAt: z.string().datetime('Invalid date format'),
});

// ============================================================================
// Destinations Module Schemas
// ============================================================================

export const DestinationTypeSchema = z.enum([
  'beach',
  'park',
  'monument',
  'museum',
  'natural-reserve',
  'historical-site',
  'viewpoint',
  'cultural-center',
]);

export const DirectionsInfoSchema = z.object({
  byRoad: z.string().optional(),
  byPublicTransport: z.string().optional(),
  byAir: z.string().optional(),
  parking: z.string().optional(),
  notes: z.string().optional(),
});

export const AccessibilityInfoSchema = z.object({
  wheelchairAccessible: z.boolean(),
  notes: z.string().optional(),
});

export const DestinationSchema = z.object({
  id: z.string().min(1, 'Destination ID is required'),
  name: z.string().min(1, 'Name is required'),
  type: DestinationTypeSchema,
  province: ProvinceSchema,
  district: z.string().min(1, 'District is required'),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Address is required'),
  }),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().min(1, 'Description is required'),
  highlights: z.array(z.string()),
  photos: z.array(MediaItemSchema),
  directions: DirectionsInfoSchema,
  accessibility: AccessibilityInfoSchema,
  facilities: z.array(z.string()),
  bestTimeToVisit: z.string().optional(),
  entryFee: z.object({
    local: z.number().min(0).optional(),
    foreign: z.number().min(0).optional(),
    currency: z.string().min(1, 'Currency is required'),
  }).optional(),
  openingHours: z.object({
    weekdays: z.string().optional(),
    weekends: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  contacts: ContactInfoSchema.optional(),
  relatedStories: z.array(z.string()).optional(),
  relatedServices: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().min(0).optional(),
  createdAt: z.string().datetime('Invalid date format'),
  updatedAt: z.string().datetime('Invalid date format'),
});

// ============================================================================
// Services Module Schemas
// ============================================================================

export const ServiceCategorySchema = z.enum([
  'hotel',
  'lodge',
  'restaurant',
  'transport',
  'tour-guide',
  'travel-agency',
  'car-rental',
]);

export const PricingInfoSchema = z.object({
  range: z.enum(['budget', 'mid-range', 'luxury']),
  currency: z.string().min(1, 'Currency is required'),
  details: z.string().optional(),
  priceFrom: z.number().min(0).optional(),
  priceTo: z.number().min(0).optional(),
});

export const TouristServiceSchema = z.object({
  id: z.string().min(1, 'Service ID is required'),
  name: z.string().min(1, 'Name is required'),
  category: ServiceCategorySchema,
  province: ProvinceSchema,
  district: z.string().min(1, 'District is required'),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Address is required'),
  }),
  description: z.string().min(1, 'Description is required'),
  photos: z.array(MediaItemSchema),
  contacts: ContactInfoSchema,
  openingHours: z.object({
    weekdays: z.string().optional(),
    weekends: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  pricing: PricingInfoSchema.optional(),
  amenities: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().min(0).optional(),
  verified: z.boolean(),
  relatedDestinations: z.array(z.string()).optional(),
  createdAt: z.string().datetime('Invalid date format'),
  updatedAt: z.string().datetime('Invalid date format'),
});

// ============================================================================
// Type exports for TypeScript inference
// ============================================================================

export type Province = z.infer<typeof ProvinceSchema>;
export type ProvinceInfo = z.infer<typeof ProvinceInfoSchema>;
export type District = z.infer<typeof DistrictSchema>;
export type MediaItem = z.infer<typeof MediaItemSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type CulturalContent = z.infer<typeof CulturalContentSchema>;
export type Story = z.infer<typeof StorySchema>;
export type StoryType = z.infer<typeof StoryTypeSchema>;
export type Destination = z.infer<typeof DestinationSchema>;
export type DestinationType = z.infer<typeof DestinationTypeSchema>;
export type TouristService = z.infer<typeof TouristServiceSchema>;
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;
