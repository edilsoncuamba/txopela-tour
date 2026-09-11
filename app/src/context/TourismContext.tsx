// Tourism Context - State management for cultural tourism modules

import React, { createContext, useContext, useState, useCallback } from 'react';
import { tourismApi } from '@/services/tourismApi';
import type { Province, ProvinceInfo, CulturalContent, Story, Destination, TouristService } from '@/schemas/tourism';
import type { StoryFilter } from '@/modules/stories/types';
import type { DestinationFilter } from '@/modules/destinations/types';
import type { ServiceFilter, ServiceCategory } from '@/modules/services/types';

/**
 * Search results interface
 */
interface SearchResults {
  culture: CulturalContent[];
  stories: Story[];
  destinations: Destination[];
  services: TouristService[];
  total: number;
}

/**
 * Tourism Context interface
 */
interface TourismContextType {
  // Provinces state
  provinces: ProvinceInfo[];
  fetchProvinces: () => Promise<void>;
  
  // Culture state
  cultureContent: CulturalContent | null;
  selectedCulture: CulturalContent | null;
  fetchCultureByProvince: (province: Province) => Promise<void>;
  setSelectedCulture: (culture: CulturalContent | null) => void;
  
  // Stories state
  stories: Story[];
  selectedStory: Story | null;
  fetchStoriesByProvince: (province: Province) => Promise<void>;
  filterStories: (filter: StoryFilter) => Story[];
  setSelectedStory: (story: Story | null) => void;
  
  // Destinations state
  destinations: Destination[];
  selectedDestination: Destination | null;
  fetchDestinationsByProvince: (province: Province) => Promise<void>;
  filterDestinations: (filter: DestinationFilter) => Destination[];
  setSelectedDestination: (destination: Destination | null) => void;
  
  // Services state
  services: TouristService[];
  selectedService: TouristService | null;
  fetchServicesByProvince: (province: Province) => Promise<void>;
  fetchServicesByCategory: (category: ServiceCategory, province?: Province) => Promise<void>;
  filterServices: (filter: ServiceFilter) => TouristService[];
  setSelectedService: (service: TouristService | null) => void;
  
  // Search
  searchAll: (query: string) => Promise<SearchResults>;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Create Tourism Context
 */
const TourismContext = createContext<TourismContextType | undefined>(undefined);

/**
 * Tourism Provider Component
 */
export function TourismProvider({ children }: { children: React.ReactNode }) {
  // Provinces state
  const [provinces, setProvinces] = useState<ProvinceInfo[]>([]);
  
  // State for each module
  const [cultureContent, setCultureContent] = useState<CulturalContent | null>(null);
  const [selectedCulture, setSelectedCulture] = useState<CulturalContent | null>(null);
  
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  
  const [services, setServices] = useState<TouristService[]>([]);
  const [selectedService, setSelectedService] = useState<TouristService | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch all provinces
   */
  const fetchProvinces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await tourismApi.getProvinces();
      setProvinces(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch provinces';
      setError(errorMessage);
      console.error('Error fetching provinces:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch culture content for a specific province
   */
  const fetchCultureByProvince = useCallback(async (province: Province) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const culture = await tourismApi.getCultureByProvince(province);
      
      if (culture) {
        setCultureContent(culture);
      } else {
        setCultureContent(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load culture content';
      setError(errorMessage);
      console.error('Error fetching culture content:', err);
      setCultureContent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch stories for a specific province
   */
  const fetchStoriesByProvince = useCallback(async (province: Province) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provinceStories = await tourismApi.getStoriesByProvince(province);
      
      // Update stories array - remove old stories from this province and add new ones
      setStories(prev => {
        const filtered = prev.filter(s => s.province !== province);
        return [...filtered, ...provinceStories];
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stories';
      setError(errorMessage);
      console.error('Error fetching stories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Filter stories based on criteria
   */
  const filterStories = useCallback((filter: StoryFilter): Story[] => {
    let filtered = [...stories];
    
    if (filter.province) {
      filtered = filtered.filter(story => story.province === filter.province);
    }
    
    if (filter.district) {
      filtered = filtered.filter(story => story.district === filter.district);
    }
    
    if (filter.type) {
      filtered = filtered.filter(story => story.type === filter.type);
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(story => {
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
      });
    }
    
    return filtered;
  }, [stories]);

  /**
   * Fetch destinations for a specific province
   */
  const fetchDestinationsByProvince = useCallback(async (province: Province) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provinceDestinations = await tourismApi.getDestinationsByProvince(province);
      
      // Update destinations array - remove old destinations from this province and add new ones
      setDestinations(prev => {
        const filtered = prev.filter(d => d.province !== province);
        return [...filtered, ...provinceDestinations];
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load destinations';
      setError(errorMessage);
      console.error('Error fetching destinations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Filter destinations based on criteria
   */
  const filterDestinations = useCallback((filter: DestinationFilter): Destination[] => {
    let filtered = [...destinations];
    
    if (filter.province) {
      filtered = filtered.filter(dest => dest.province === filter.province);
    }
    
    if (filter.district) {
      filtered = filtered.filter(dest => dest.district === filter.district);
    }
    
    if (filter.type) {
      filtered = filtered.filter(dest => dest.type === filter.type);
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(dest => {
        const searchableText = [
          dest.name,
          dest.summary,
          dest.description,
          dest.district,
          dest.location.address,
          ...dest.highlights,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        
        return searchableText.includes(query);
      });
    }
    
    return filtered;
  }, [destinations]);

  /**
   * Fetch services for a specific province
   */
  const fetchServicesByProvince = useCallback(async (province: Province) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provinceServices = await tourismApi.getServicesByProvince(province);
      
      // Update services array - remove old services from this province and add new ones
      setServices(prev => {
        const filtered = prev.filter(s => s.province !== province);
        return [...filtered, ...provinceServices];
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load services';
      setError(errorMessage);
      console.error('Error fetching services:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch services by category and optionally filter by province
   */
  const fetchServicesByCategory = useCallback(async (category: ServiceCategory, province?: Province) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (province) {
        // Fetch services for specific province
        const provinceServices = await tourismApi.getServicesByProvince(province);
        const categoryServices = provinceServices.filter(s => s.category === category);
        
        // Update services array
        setServices(prev => {
          const filtered = prev.filter(s => s.province !== province || s.category !== category);
          return [...filtered, ...categoryServices];
        });
      } else {
        // If no province specified, we would need to fetch from all provinces
        // For now, just filter existing services
        // In a real implementation, you might want to fetch from all provinces
        console.warn('Fetching services by category without province - filtering existing data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load services';
      setError(errorMessage);
      console.error('Error fetching services by category:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Filter services based on criteria
   */
  const filterServices = useCallback((filter: ServiceFilter): TouristService[] => {
    let filtered = [...services];
    
    if (filter.province) {
      filtered = filtered.filter(service => service.province === filter.province);
    }
    
    if (filter.district) {
      filtered = filtered.filter(service => service.district === filter.district);
    }
    
    if (filter.category) {
      filtered = filtered.filter(service => service.category === filter.category);
    }
    
    if (filter.priceRange) {
      filtered = filtered.filter(service => service.pricing?.range === filter.priceRange);
    }
    
    if (filter.rating !== undefined) {
      filtered = filtered.filter(service => 
        service.rating !== undefined && service.rating >= filter.rating!
      );
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(service => {
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
      });
    }
    
    return filtered;
  }, [services]);

  /**
   * Search across all tourism modules
   */
  const searchAll = useCallback(async (query: string): Promise<SearchResults> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await tourismApi.searchAll(query);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Error during search:', err);
      
      // Return empty results on error
      return {
        culture: [],
        stories: [],
        destinations: [],
        services: [],
        total: 0,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Context value
  const value: TourismContextType = {
    // Provinces
    provinces,
    fetchProvinces,
    
    // Culture
    cultureContent,
    selectedCulture,
    fetchCultureByProvince,
    setSelectedCulture,
    
    // Stories
    stories,
    selectedStory,
    fetchStoriesByProvince,
    filterStories,
    setSelectedStory,
    
    // Destinations
    destinations,
    selectedDestination,
    fetchDestinationsByProvince,
    filterDestinations,
    setSelectedDestination,
    
    // Services
    services,
    selectedService,
    fetchServicesByProvince,
    fetchServicesByCategory,
    filterServices,
    setSelectedService,
    
    // Search
    searchAll,
    
    // State
    isLoading,
    error,
    clearError,
  };

  return (
    <TourismContext.Provider value={value}>
      {children}
    </TourismContext.Provider>
  );
}

/**
 * Custom hook to use Tourism Context
 * @throws Error if used outside TourismProvider
 */
export function useTourism(): TourismContextType {
  const context = useContext(TourismContext);
  
  if (!context) {
    throw new Error('useTourism must be used within TourismProvider');
  }
  
  return context;
}
