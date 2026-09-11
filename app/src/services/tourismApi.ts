// Tourism API Service

import {
  CulturalContentSchema,
  StorySchema,
  DestinationSchema,
  TouristServiceSchema,
  ProvinceInfoSchema,
} from '@/schemas/tourism';
import type {
  Province,
  ProvinceInfo,
  CulturalContent,
  Story,
  Destination,
  TouristService,
} from '@/schemas/tourism';
import { ZodError } from 'zod';

/**
 * Custom error class for Tourism API errors
 */
const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
} as const;
type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

class TourismApiError extends Error {
  code: ErrorCode;
  details?: unknown;
  
  constructor(
    message: string,
    code: ErrorCode,
    details?: unknown
  ) {
    super(message);
    this.name = 'TourismApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Tourism API Service
 * Handles data fetching and validation for all tourism modules
 */
class TourismApiService {
  private baseUrl = '/data';

  /**
   * Fetch and validate provinces data
   * @returns Array of province information
   * @throws TourismApiError if fetch or validation fails
   */
  async getProvinces(): Promise<ProvinceInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/provinces.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new TourismApiError(
            'Provinces data file not found',
            'NOT_FOUND',
            { path: `${this.baseUrl}/provinces.json` }
          );
        }
        throw new TourismApiError(
          `Failed to fetch provinces: ${response.statusText}`,
          'NETWORK_ERROR',
          { status: response.status, statusText: response.statusText }
        );
      }

      const data = await response.json();
      
      // Validate each province item
      return data.map((item: unknown, index: number) => {
        try {
          return ProvinceInfoSchema.parse(item);
        } catch (error) {
          if (error instanceof ZodError) {
            console.error(`Validation error for province at index ${index}:`, error.issues);
            throw new TourismApiError(
              `Invalid province data at index ${index}`,
              'VALIDATION_ERROR',
              { index, errors: error.issues }
            );
          }
          throw error;
        }
      });
    } catch (error) {
      if (error instanceof TourismApiError) {
        throw error;
      }
      if (error instanceof SyntaxError) {
        console.error('Failed to parse provinces JSON:', error);
        throw new TourismApiError(
          'Malformed JSON in provinces data',
          'PARSE_ERROR',
          { originalError: error.message }
        );
      }
      console.error('Unexpected error loading provinces:', error);
      throw new TourismApiError(
        'Unexpected error loading provinces',
        'NETWORK_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Fetch and validate culture data for a specific province
   * @param province - Province identifier
   * @returns Cultural content or null if not found
   */
  async getCultureByProvince(province: Province): Promise<CulturalContent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/culture/${province}.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`No culture data found for ${province}`);
          return null;
        }
        throw new TourismApiError(
          `Failed to fetch culture data for ${province}: ${response.statusText}`,
          'NETWORK_ERROR',
          { province, status: response.status }
        );
      }

      const data = await response.json();
      
      try {
        return CulturalContentSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          console.error(`Validation error for culture data (${province}):`, error.issues);
          throw new TourismApiError(
            `Invalid culture data for ${province}`,
            'VALIDATION_ERROR',
            { province, errors: error.issues }
          );
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof TourismApiError) {
        if (error.code === 'NOT_FOUND') {
          return null;
        }
        throw error;
      }
      if (error instanceof SyntaxError) {
        console.error(`Malformed JSON in culture data for ${province}:`, error);
        throw new TourismApiError(
          `Malformed JSON in culture data for ${province}`,
          'PARSE_ERROR',
          { province, originalError: error.message }
        );
      }
      console.error(`Failed to load culture data for ${province}:`, error);
      return null;
    }
  }

  /**
   * Fetch and validate stories for a specific province
   * @param province - Province identifier
   * @returns Array of stories (empty if not found or error)
   */
  async getStoriesByProvince(province: Province): Promise<Story[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stories/${province}.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`No stories found for ${province}`);
          return [];
        }
        throw new TourismApiError(
          `Failed to fetch stories for ${province}: ${response.statusText}`,
          'NETWORK_ERROR',
          { province, status: response.status }
        );
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new TourismApiError(
          `Stories data for ${province} is not an array`,
          'VALIDATION_ERROR',
          { province, dataType: typeof data }
        );
      }

      return data.map((item: unknown, index: number) => {
        try {
          return StorySchema.parse(item);
        } catch (error) {
          if (error instanceof ZodError) {
            console.error(`Validation error for story at index ${index} (${province}):`, error.issues);
            throw new TourismApiError(
              `Invalid story data at index ${index} for ${province}`,
              'VALIDATION_ERROR',
              { province, index, errors: error.issues }
            );
          }
          throw error;
        }
      });
    } catch (error) {
      if (error instanceof TourismApiError) {
        console.error(error.message, error.details);
        return [];
      }
      if (error instanceof SyntaxError) {
        console.error(`Malformed JSON in stories data for ${province}:`, error);
        return [];
      }
      console.error(`Failed to load stories for ${province}:`, error);
      return [];
    }
  }

  /**
   * Fetch and validate destinations for a specific province
   * @param province - Province identifier
   * @returns Array of destinations (empty if not found or error)
   */
  async getDestinationsByProvince(province: Province): Promise<Destination[]> {
    try {
      const response = await fetch(`${this.baseUrl}/destinations/${province}.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`No destinations found for ${province}`);
          return [];
        }
        throw new TourismApiError(
          `Failed to fetch destinations for ${province}: ${response.statusText}`,
          'NETWORK_ERROR',
          { province, status: response.status }
        );
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new TourismApiError(
          `Destinations data for ${province} is not an array`,
          'VALIDATION_ERROR',
          { province, dataType: typeof data }
        );
      }

      return data.map((item: unknown, index: number) => {
        try {
          return DestinationSchema.parse(item);
        } catch (error) {
          if (error instanceof ZodError) {
            console.error(`Validation error for destination at index ${index} (${province}):`, error.issues);
            throw new TourismApiError(
              `Invalid destination data at index ${index} for ${province}`,
              'VALIDATION_ERROR',
              { province, index, errors: error.issues }
            );
          }
          throw error;
        }
      });
    } catch (error) {
      if (error instanceof TourismApiError) {
        console.error(error.message, error.details);
        return [];
      }
      if (error instanceof SyntaxError) {
        console.error(`Malformed JSON in destinations data for ${province}:`, error);
        return [];
      }
      console.error(`Failed to load destinations for ${province}:`, error);
      return [];
    }
  }

  /**
   * Fetch and validate services for a specific province
   * @param province - Province identifier
   * @returns Array of tourist services (empty if not found or error)
   */
  async getServicesByProvince(province: Province): Promise<TouristService[]> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${province}.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`No services found for ${province}`);
          return [];
        }
        throw new TourismApiError(
          `Failed to fetch services for ${province}: ${response.statusText}`,
          'NETWORK_ERROR',
          { province, status: response.status }
        );
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new TourismApiError(
          `Services data for ${province} is not an array`,
          'VALIDATION_ERROR',
          { province, dataType: typeof data }
        );
      }

      return data.map((item: unknown, index: number) => {
        try {
          return TouristServiceSchema.parse(item);
        } catch (error) {
          if (error instanceof ZodError) {
            console.error(`Validation error for service at index ${index} (${province}):`, error.issues);
            throw new TourismApiError(
              `Invalid service data at index ${index} for ${province}`,
              'VALIDATION_ERROR',
              { province, index, errors: error.issues }
            );
          }
          throw error;
        }
      });
    } catch (error) {
      if (error instanceof TourismApiError) {
        console.error(error.message, error.details);
        return [];
      }
      if (error instanceof SyntaxError) {
        console.error(`Malformed JSON in services data for ${province}:`, error);
        return [];
      }
      console.error(`Failed to load services for ${province}:`, error);
      return [];
    }
  }

  /**
   * Search across all tourism modules
   * @param query - Search query string
   * @returns Search results from all modules
   */
  async searchAll(query: string): Promise<{
    culture: CulturalContent[];
    stories: Story[];
    destinations: Destination[];
    services: TouristService[];
    total: number;
  }> {
    if (!query || query.trim().length === 0) {
      return {
        culture: [],
        stories: [],
        destinations: [],
        services: [],
        total: 0,
      };
    }

    const normalizedQuery = query.toLowerCase().trim();

    try {
      // Get all provinces first
      const provinces = await this.getProvinces();
      const provinceIds = provinces.map(p => p.id);

      // Fetch data from all provinces in parallel
      const [cultureResults, storiesResults, destinationsResults, servicesResults] = await Promise.all([
        this.searchCulture(provinceIds, normalizedQuery),
        this.searchStories(provinceIds, normalizedQuery),
        this.searchDestinations(provinceIds, normalizedQuery),
        this.searchServices(provinceIds, normalizedQuery),
      ]);

      return {
        culture: cultureResults,
        stories: storiesResults,
        destinations: destinationsResults,
        services: servicesResults,
        total: cultureResults.length + storiesResults.length + destinationsResults.length + servicesResults.length,
      };
    } catch (error) {
      console.error('Error during search:', error);
      return {
        culture: [],
        stories: [],
        destinations: [],
        services: [],
        total: 0,
      };
    }
  }

  /**
   * Search culture content across provinces
   * @private
   */
  private async searchCulture(provinces: Province[], query: string): Promise<CulturalContent[]> {
    const results: CulturalContent[] = [];

    await Promise.all(
      provinces.map(async (province) => {
        const culture = await this.getCultureByProvince(province);
        if (culture && this.matchesCultureQuery(culture, query)) {
          results.push(culture);
        }
      })
    );

    return results;
  }

  /**
   * Search stories across provinces
   * @private
   */
  private async searchStories(provinces: Province[], query: string): Promise<Story[]> {
    const results: Story[] = [];

    await Promise.all(
      provinces.map(async (province) => {
        const stories = await this.getStoriesByProvince(province);
        const matchingStories = stories.filter(story => this.matchesStoryQuery(story, query));
        results.push(...matchingStories);
      })
    );

    return results;
  }

  /**
   * Search destinations across provinces
   * @private
   */
  private async searchDestinations(provinces: Province[], query: string): Promise<Destination[]> {
    const results: Destination[] = [];

    await Promise.all(
      provinces.map(async (province) => {
        const destinations = await this.getDestinationsByProvince(province);
        const matchingDestinations = destinations.filter(dest => this.matchesDestinationQuery(dest, query));
        results.push(...matchingDestinations);
      })
    );

    return results;
  }

  /**
   * Search services across provinces
   * @private
   */
  private async searchServices(provinces: Province[], query: string): Promise<TouristService[]> {
    const results: TouristService[] = [];

    await Promise.all(
      provinces.map(async (province) => {
        const services = await this.getServicesByProvince(province);
        const matchingServices = services.filter(service => this.matchesServiceQuery(service, query));
        results.push(...matchingServices);
      })
    );

    return results;
  }

  /**
   * Check if culture content matches search query
   * @private
   */
  private matchesCultureQuery(culture: CulturalContent, query: string): boolean {
    const searchableText = [
      culture.title,
      culture.description,
      culture.sections.traditions?.title,
      culture.sections.traditions?.description,
      culture.sections.dances?.title,
      culture.sections.dances?.description,
      culture.sections.gastronomy?.title,
      culture.sections.gastronomy?.description,
      culture.sections.events?.title,
      culture.sections.events?.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Check if story matches search query
   * @private
   */
  private matchesStoryQuery(story: Story, query: string): boolean {
    const searchableText = [
      story.title,
      story.summary,
      story.content,
      story.locality,
      story.district,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Check if destination matches search query
   * @private
   */
  private matchesDestinationQuery(destination: Destination, query: string): boolean {
    const searchableText = [
      destination.name,
      destination.summary,
      destination.description,
      destination.district,
      destination.location.address,
      ...destination.highlights,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Check if service matches search query
   * @private
   */
  private matchesServiceQuery(service: TouristService, query: string): boolean {
    const searchableText = [
      service.name,
      service.description,
      service.district,
      service.location.address,
      service.category,
      ...(service.amenities || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  }
}

export const tourismApi = new TourismApiService();
