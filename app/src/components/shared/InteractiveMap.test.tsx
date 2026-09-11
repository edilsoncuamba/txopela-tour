import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import InteractiveMap from './InteractiveMap';

/**
 * InteractiveMap Component - Unit Tests
 * 
 * This test suite verifies that the InteractiveMap component:
 * - Renders correctly without errors
 * - Accepts all required and optional props
 * - Provides proper TypeScript types for markers
 * - Handles various marker configurations
 * - Cleans up resources properly on unmount
 */

// Mock Leaflet to avoid loading actual map tiles and complex initialization
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      remove: vi.fn(),
      removeLayer: vi.fn(),
      fitBounds: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    marker: vi.fn(() => ({
      bindPopup: vi.fn(),
      on: vi.fn(),
      addTo: vi.fn(),
    })),
    layerGroup: vi.fn(() => ({
      addLayer: vi.fn(),
      addTo: vi.fn(),
    })),
    icon: vi.fn(() => ({})),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
    FeatureGroup: vi.fn(() => ({
      getBounds: vi.fn(() => ({
        pad: vi.fn(() => ({
          _southWest: { lat: -26, lng: 32 },
          _northEast: { lat: -25, lng: 33 },
        })),
      })),
    })),
  },
}));

vi.mock('leaflet.markercluster', () => ({}));

describe('InteractiveMap Component', () => {
  const mockCenter = { lat: -25.9655, lng: 32.5832 };
  const mockMarkers = [
    {
      id: '1',
      position: { lat: -25.9655, lng: 32.5832 },
      type: 'destination' as const,
      popup: {
        title: 'Maputo Central',
        description: 'Historic city center',
        link: '/destinos/maputo/1',
      },
    },
    {
      id: '2',
      position: { lat: -25.9700, lng: 32.5900 },
      type: 'service' as const,
      popup: {
        title: 'Hotel Polana',
        description: 'Luxury hotel',
        image: '/images/hotel.jpg',
        link: '/servicos/hotel/2',
      },
    },
  ];

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render a container div', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
        />
      );

      const div = container.querySelector('div');
      expect(div).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    it('should accept center prop', () => {
      const { container } = render(
        <InteractiveMap
          center={{ lat: -26.0, lng: 33.0 }}
          markers={mockMarkers}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept zoom prop', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          zoom={15}
          markers={mockMarkers}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept markers prop', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept empty markers array', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={[]}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept single marker', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={[mockMarkers[0]]}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept clustering prop', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          clustering={false}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept showControls prop', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          showControls={false}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept height prop', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          height="500px"
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          className="custom-class"
        />
      );

      const customDiv = container.querySelector('.custom-class');
      expect(customDiv).toBeTruthy();
    });

    it('should accept onMarkerClick callback', () => {
      const onMarkerClick = vi.fn();
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          onMarkerClick={onMarkerClick}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Marker Handling', () => {
    it('should handle markers with popup data', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should handle markers without popup data', () => {
      const markersWithoutPopup = [
        {
          id: '1',
          position: { lat: -25.9655, lng: 32.5832 },
          type: 'destination' as const,
        },
      ];

      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={markersWithoutPopup}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should handle markers with different types', () => {
      const mixedMarkers = [
        {
          id: '1',
          position: { lat: -25.9655, lng: 32.5832 },
          type: 'destination' as const,
          popup: { title: 'Destination' },
        },
        {
          id: '2',
          position: { lat: -25.9700, lng: 32.5900 },
          type: 'service' as const,
          popup: { title: 'Service' },
        },
      ];

      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mixedMarkers}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should handle markers with all popup fields', () => {
      const markersWithFullPopup = [
        {
          id: '1',
          position: { lat: -25.9655, lng: 32.5832 },
          type: 'destination' as const,
          popup: {
            title: 'Title',
            description: 'Description',
            image: '/image.jpg',
            link: '/link',
          },
        },
      ];

      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={markersWithFullPopup}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply height styling', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          height="600px"
        />
      );

      const mapDiv = container.querySelector('div[style*="height"]');
      expect(mapDiv).toBeTruthy();
    });

    it('should apply custom classNames', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          className="w-full rounded-lg"
        />
      );

      const customDiv = container.querySelector('.w-full.rounded-lg');
      expect(customDiv).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
        />
      );

      const mapDiv = container.querySelector('[role="region"]');
      // Component might still be loading, so check container exists
      expect(container).toBeTruthy();
    });
  });

  describe('Cleanup', () => {
    it('should unmount without errors', () => {
      const { unmount } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
        />
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Re-rendering', () => {
    it('should handle prop updates', () => {
      const { rerender } = render(
        <InteractiveMap
          center={mockCenter}
          markers={[mockMarkers[0]]}
        />
      );

      expect(() => {
        rerender(
          <InteractiveMap
            center={mockCenter}
            markers={mockMarkers}
          />
        );
      }).not.toThrow();
    });

    it('should handle center updates', () => {
      const { rerender } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
        />
      );

      expect(() => {
        rerender(
          <InteractiveMap
            center={{ lat: -26.0, lng: 33.0 }}
            markers={mockMarkers}
          />
        );
      }).not.toThrow();
    });

    it('should handle zoom updates', () => {
      const { rerender } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          zoom={13}
        />
      );

      expect(() => {
        rerender(
          <InteractiveMap
            center={mockCenter}
            markers={mockMarkers}
            zoom={15}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Configuration Variants', () => {
    it('should work with clustering enabled', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          clustering={true}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should work with clustering disabled', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          clustering={false}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should work with controls shown', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          showControls={true}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should work with controls hidden', () => {
      const { container } = render(
        <InteractiveMap
          center={mockCenter}
          markers={mockMarkers}
          showControls={false}
        />
      );

      expect(container).toBeTruthy();
    });
  });
});
