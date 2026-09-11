import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tourismApi } from './tourismApi';

// Mock fetch globally
global.fetch = vi.fn();

describe('TourismApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProvinces', () => {
    it('should fetch and validate provinces data', async () => {
      const mockProvinces = [
        {
          id: 'maputo',
          name: 'Maputo',
          capital: 'Matola',
          districts: ['Boane', 'Magude'],
          coordinates: { lat: -25.9655, lng: 32.5832 },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProvinces,
      });

      const result = await tourismApi.getProvinces();
      expect(result).toEqual(mockProvinces);
      expect(global.fetch).toHaveBeenCalledWith('/data/provinces.json');
    });

    it('should throw error when provinces file not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(tourismApi.getProvinces()).rejects.toThrow('Provinces data file not found');
    });

    it('should throw error for malformed JSON', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(tourismApi.getProvinces()).rejects.toThrow('Malformed JSON in provinces data');
    });
  });

  describe('getCultureByProvince', () => {
    it('should fetch and validate culture data', async () => {
      const mockCulture = {
        id: 'culture-maputo-001',
        province: 'maputo',
        title: 'Cultura de Maputo',
        description: 'Test description',
        sections: {},
        media: { photos: [], videos: [] },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCulture,
      });

      const result = await tourismApi.getCultureByProvince('maputo');
      expect(result).toEqual(mockCulture);
      expect(global.fetch).toHaveBeenCalledWith('/data/culture/maputo.json');
    });

    it('should return null when culture data not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await tourismApi.getCultureByProvince('maputo');
      expect(result).toBeNull();
    });
  });

  describe('getStoriesByProvince', () => {
    it('should fetch and validate stories data', async () => {
      const mockStories = [
        {
          id: 'story-maputo-001',
          title: 'Test Story',
          type: 'legend',
          province: 'maputo',
          content: 'Test content',
          summary: 'Test summary',
          images: [],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStories,
      });

      const result = await tourismApi.getStoriesByProvince('maputo');
      expect(result).toEqual(mockStories);
    });

    it('should return empty array when stories not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await tourismApi.getStoriesByProvince('maputo');
      expect(result).toEqual([]);
    });
  });

  describe('getDestinationsByProvince', () => {
    it('should fetch and validate destinations data', async () => {
      const mockDestinations = [
        {
          id: 'dest-maputo-001',
          name: 'Test Destination',
          type: 'beach',
          province: 'maputo',
          district: 'Matutuíne',
          location: { lat: -26.0167, lng: 32.9333, address: 'Test Address' },
          summary: 'Test summary',
          description: 'Test description',
          highlights: [],
          photos: [],
          directions: {},
          accessibility: { wheelchairAccessible: false },
          facilities: [],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDestinations,
      });

      const result = await tourismApi.getDestinationsByProvince('maputo');
      expect(result).toEqual(mockDestinations);
    });

    it('should return empty array when destinations not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await tourismApi.getDestinationsByProvince('maputo');
      expect(result).toEqual([]);
    });
  });

  describe('getServicesByProvince', () => {
    it('should fetch and validate services data', async () => {
      const mockServices = [
        {
          id: 'service-maputo-001',
          name: 'Test Service',
          category: 'hotel',
          province: 'maputo',
          district: 'Maputo',
          location: { lat: -25.9655, lng: 32.5832, address: 'Test Address' },
          description: 'Test description',
          photos: [],
          contacts: {},
          verified: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockServices,
      });

      const result = await tourismApi.getServicesByProvince('maputo');
      expect(result).toEqual(mockServices);
    });

    it('should return empty array when services not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await tourismApi.getServicesByProvince('maputo');
      expect(result).toEqual([]);
    });
  });

  describe('searchAll', () => {
    it('should return empty results for empty query', async () => {
      const result = await tourismApi.searchAll('');
      expect(result).toEqual({
        culture: [],
        stories: [],
        destinations: [],
        services: [],
        total: 0,
      });
    });

    it('should search across all modules', async () => {
      const mockProvinces = [
        {
          id: 'maputo',
          name: 'Maputo',
          capital: 'Matola',
          districts: ['Boane'],
          coordinates: { lat: -25.9655, lng: 32.5832 },
        },
      ];

      const mockCulture = {
        id: 'culture-maputo-001',
        province: 'maputo',
        title: 'Cultura de Maputo',
        description: 'Test description with search term',
        sections: {},
        media: { photos: [], videos: [] },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      const mockStories = [
        {
          id: 'story-maputo-001',
          title: 'Story with search term',
          type: 'legend',
          province: 'maputo',
          content: 'Test content',
          summary: 'Test summary',
          images: [],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      // Mock provinces fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProvinces,
      });

      // Mock culture fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCulture,
      });

      // Mock stories fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStories,
      });

      // Mock destinations fetch (404)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Mock services fetch (404)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await tourismApi.searchAll('search term');
      
      expect(result.culture).toHaveLength(1);
      expect(result.stories).toHaveLength(1);
      expect(result.destinations).toHaveLength(0);
      expect(result.services).toHaveLength(0);
      expect(result.total).toBe(2);
    });
  });
});
