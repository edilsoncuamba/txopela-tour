# Implementation Plan: Cultural Tourism Modules

## Overview

This implementation plan breaks down the development of four cultural tourism modules (Cultura, Histórias, Destinos, Serviços) into discrete, sequential tasks. The implementation uses React + TypeScript + Vite + Radix UI + Tailwind CSS + Leaflet + Framer Motion, integrating seamlessly with the existing Txopela Tour MVP application.

The plan follows a foundation-first approach: establishing core infrastructure (types, schemas, context, API service) before building individual modules, then implementing shared components, followed by module-specific features, and finally integration and testing.

## Tasks

- [x] 1. Set up foundation and core infrastructure
  - [x] 1.1 Create TypeScript types and interfaces for all modules
    - Create `src/types/geography.ts` with Province, ProvinceInfo, and District types
    - Create `src/modules/culture/types.ts` with CulturalContent, TraditionSection, DanceSection, GastronomySection, EventSection, and MediaItem interfaces
    - Create `src/modules/stories/types.ts` with Story, StoryType, and StoryFilter interfaces
    - Create `src/modules/destinations/types.ts` with Destination, DestinationType, DirectionsInfo, AccessibilityInfo, and ContactInfo interfaces
    - Create `src/modules/services/types.ts` with TouristService, ServiceCategory, PricingInfo, and ServiceFilter interfaces
    - _Requirements: 7.5_

  - [x] 1.2 Create Zod validation schemas
    - Create `src/schemas/tourism.ts` with ProvinceSchema, MediaItemSchema, CulturalContentSchema, StorySchema, DestinationSchema, and TouristServiceSchema
    - Implement validation for all required and optional fields
    - Add proper error messages for validation failures
    - _Requirements: 7.2, 7.3_

  - [ ]* 1.3 Write property test for data validation
    - **Property 2: Data Validation Correctness**
    - **Validates: Requirements 7.2**
    - Test that valid data passes validation and invalid data fails with descriptive errors
    - Generate random valid and invalid data objects for each schema
    - Verify validation is deterministic
    - _Requirements: 7.2_

  - [x] 1.4 Create data directory structure and sample data files
    - Create `src/data/provinces.json` with all 11 provinces metadata
    - Create `src/data/districts.json` with district information
    - Create `src/data/culture/`, `src/data/stories/`, `src/data/destinations/`, `src/data/services/` directories
    - Create sample JSON files for at least 3 provinces (maputo.json, gaza.json, inhambane.json) in each module directory
    - Ensure all sample data validates against Zod schemas
    - _Requirements: 7.1, 7.4_

  - [x] 1.5 Implement Tourism API service
    - Create `src/services/tourismApi.ts` with TourismApiService class
    - Implement `getCultureByProvince()`, `getStoriesByProvince()`, `getDestinationsByProvince()`, `getServicesByProvince()` methods
    - Add error handling for missing files, malformed JSON, and validation failures
    - Implement `searchAll()` method for cross-module search
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.6 Create TourismContext for state management
    - Create `src/context/TourismContext.tsx` with TourismProvider and useTourism hook
    - Implement state management for culture, stories, destinations, and services
    - Add loading and error states
    - Implement fetch methods for each module
    - Implement filter methods for stories, destinations, and services
    - _Requirements: 5.5, 7.1_

- [x] 2. Checkpoint - Verify foundation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement shared components
  - [x] 3.1 Create ProvinceSelector component
    - Create `src/components/shared/ProvinceSelector.tsx`
    - Implement grid, list, and map variants
    - Add province selection handling
    - Display district count when enabled
    - Style with Tailwind CSS matching existing design
    - _Requirements: 1.1, 5.1_

  - [x] 3.2 Create MediaGallery component
    - Create `src/components/shared/MediaGallery.tsx`
    - Implement grid, masonry, and carousel layouts
    - Add lazy loading for images
    - Implement lightbox functionality
    - Add caption display option
    - _Requirements: 1.3, 1.4, 6.3, 6.5_

  - [x] 3.3 Create InteractiveMap component with Leaflet
    - Create `src/components/shared/InteractiveMap.tsx`
    - Integrate Leaflet library
    - Implement map initialization with center and zoom
    - Add marker rendering with custom icons
    - Implement marker clustering for multiple markers
    - Add popup functionality for marker details
    - Handle map loading errors gracefully
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ] 3.4 Create SearchBar component with suggestions
    - Create `src/components/shared/SearchBar.tsx`
    - Implement real-time search suggestions with debouncing
    - Add filter support
    - Implement suggestion selection handling
    - Style with Radix UI components
    - _Requirements: 10.1, 10.2_

  - [x] 3.5 Create Breadcrumbs component
    - Create `src/components/shared/Breadcrumbs.tsx`
    - Implement breadcrumb navigation with separators
    - Add max items truncation
    - Support both href and onClick navigation
    - _Requirements: 5.4_

- [ ] 4. Implement Culture Module
  - [ ] 4.1 Create Culture module structure and routing
    - Create `src/modules/culture/pages/` directory with CultureHome.tsx, ProvinceDetail.tsx, ContentDetail.tsx
    - Create `src/modules/culture/components/` directory
    - Add routes to App.tsx: `/cultura`, `/cultura/:province`, `/cultura/:province/:contentId`
    - Implement route components with React Router
    - _Requirements: 1.1, 5.1, 5.6_

  - [ ] 4.2 Implement CultureHome page
    - Display list of all provinces using ProvinceSelector
    - Add search functionality with SearchBar
    - Implement province selection navigation
    - Add responsive layout for mobile/tablet/desktop
    - _Requirements: 1.1, 6.1, 6.2_

  - [ ] 4.3 Implement ProvinceDetail page
    - Fetch and display cultural content for selected province
    - Create sections for traditions, dances, gastronomy, and events
    - Integrate MediaGallery for photos and videos
    - Add breadcrumbs navigation
    - Implement contextual links to other modules
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 5.2, 5.3, 5.4_

  - [ ] 4.4 Create Culture-specific components
    - Create `CultureCard.tsx` for displaying cultural content summaries
    - Create `TraditionSection.tsx` for displaying traditions
    - Create `DanceSection.tsx` for displaying dances with video support
    - Create `GastronomySection.tsx` for displaying dishes
    - Create `EventSection.tsx` for displaying cultural events
    - _Requirements: 1.2, 1.6_

  - [ ]* 4.5 Write unit tests for Culture components
    - Test CultureCard rendering
    - Test ProvinceDetail data loading
    - Test section components
    - Test navigation flows
    - _Requirements: 1.1, 1.2_

- [ ] 5. Implement Stories Module
  - [ ] 5.1 Create Stories module structure and routing
    - Create `src/modules/stories/pages/` directory with StoriesHome.tsx, LocalityStories.tsx, StoryDetail.tsx
    - Create `src/modules/stories/components/` directory
    - Add routes to App.tsx: `/historias`, `/historias/:province`, `/historias/:province/:storyId`
    - _Requirements: 2.1, 5.1, 5.6_

  - [ ] 5.2 Implement StoriesHome page
    - Display list of localities organized by province
    - Add search functionality
    - Implement locality selection navigation
    - _Requirements: 2.1, 6.1, 6.2_

  - [ ] 5.3 Implement LocalityStories page with filtering
    - Fetch and display stories for selected locality
    - Implement story filtering by type (legend, historical-fact, curiosity, cultural-narrative)
    - Display stories with title, summary, and images
    - Add breadcrumbs navigation
    - _Requirements: 2.2, 2.3, 2.4, 5.4_

  - [ ]* 5.4 Write property test for story filtering
    - **Property 1: Universal Filtering Correctness (Stories)**
    - **Validates: Requirements 2.4**
    - Test that filtering by type returns only matching stories
    - Test that filtering by province returns only matching stories
    - Test that all matching stories are included in results
    - _Requirements: 2.4_

  - [ ] 5.5 Implement StoryDetail page
    - Display full story content with narrative
    - Show historical period when applicable
    - Display related images
    - Add links to related destinations
    - Implement contextual navigation to Destinations module
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 5.2, 5.3_

  - [ ] 5.6 Create Stories-specific components
    - Create `StoryCard.tsx` for displaying story summaries
    - Create `StoryFilter.tsx` for filtering controls
    - Create `StoryTimeline.tsx` for displaying historical timeline
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 5.7 Write unit tests for Stories components
    - Test StoryCard rendering
    - Test story filtering logic
    - Test StoryDetail navigation
    - _Requirements: 2.1, 2.2, 2.4_

- [ ] 6. Checkpoint - Verify Culture and Stories modules
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Destinations Module
  - [ ] 7.1 Create Destinations module structure and routing
    - Create `src/modules/destinations/pages/` directory with DestinationsHome.tsx, DestinationsList.tsx, DestinationDetail.tsx
    - Create `src/modules/destinations/components/` directory
    - Add routes to App.tsx: `/destinos`, `/destinos/:province`, `/destinos/:province/:destinationId`
    - _Requirements: 3.1, 5.1, 5.6_

  - [ ] 7.2 Implement DestinationsHome page
    - Display destinations organized by province and district
    - Add search functionality
    - Implement destination type filtering
    - _Requirements: 3.1, 6.1, 6.2_

  - [ ] 7.3 Implement DestinationsList page with filtering
    - Fetch and display destinations for selected province
    - Implement filtering by district and type (beach, park, monument, museum, natural-reserve, historical-site, viewpoint, cultural-center)
    - Display destinations on InteractiveMap with markers
    - Show destination cards with photos and summaries
    - _Requirements: 3.1, 3.4, 3.5, 9.6_

  - [ ]* 7.4 Write property test for destination filtering
    - **Property 1: Universal Filtering Correctness (Destinations)**
    - **Validates: Requirements 3.4**
    - Test that filtering by province, district, and type returns only matching destinations
    - Test that multiple filter criteria work correctly (AND logic)
    - Test that all matching destinations are included
    - _Requirements: 3.4_

  - [ ] 7.5 Implement DestinationDetail page
    - Display destination name, photos, descriptions, and highlights
    - Show location on InteractiveMap
    - Implement photo gallery with navigation
    - Display directions panel with access information
    - Show entry fees, opening hours, and contact information
    - Add social sharing functionality
    - Implement contextual links to related stories and services
    - _Requirements: 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 5.2, 5.3_

  - [ ] 7.6 Create Destinations-specific components
    - Create `DestinationCard.tsx` for displaying destination summaries
    - Create `DestinationMap.tsx` for map integration
    - Create `DirectionsPanel.tsx` for displaying access information
    - Create `PhotoGallery.tsx` for image galleries
    - _Requirements: 3.2, 3.3, 3.6, 3.7_

  - [ ]* 7.7 Write unit tests for Destinations components
    - Test DestinationCard rendering
    - Test destination filtering logic
    - Test DirectionsPanel display
    - _Requirements: 3.1, 3.2, 3.4_

- [ ] 8. Implement Services Module
  - [ ] 8.1 Create Services module structure and routing
    - Create `src/modules/services/pages/` directory with ServicesHome.tsx, ServicesList.tsx, ServiceDetail.tsx
    - Create `src/modules/services/components/` directory
    - Add routes to App.tsx: `/servicos`, `/servicos/:category`, `/servicos/:category/:serviceId`
    - _Requirements: 4.1, 5.1, 5.6_

  - [ ] 8.2 Implement ServicesHome page
    - Display service categories (hotels, lodges, restaurants, transportes, guias turísticos, agências de turismo)
    - Add category selection navigation
    - _Requirements: 4.1, 6.1, 6.2_

  - [ ] 8.3 Implement ServicesList page with filtering
    - Display province selection for chosen category
    - Display district selection for chosen province
    - Fetch and display services for selected district and category
    - Implement filtering by price range, rating, and availability
    - Display services on InteractiveMap
    - _Requirements: 4.2, 4.3, 4.4, 4.7, 9.6_

  - [ ]* 8.4 Write property test for service filtering
    - **Property 1: Universal Filtering Correctness (Services)**
    - **Validates: Requirements 4.4, 4.7**
    - Test that filtering by category, province, and district returns only matching services
    - Test that filtering by price range and rating works correctly
    - Test that all matching services are included
    - _Requirements: 4.4, 4.7_

  - [ ] 8.5 Implement ServiceDetail page
    - Display service name, type, description, and photos
    - Show location on InteractiveMap
    - Display contact information and opening hours
    - Show pricing information
    - Display user ratings and reviews when available
    - Implement contextual links to related destinations
    - _Requirements: 4.5, 4.6, 4.8, 5.2, 5.3_

  - [ ] 8.6 Create Services-specific components
    - Create `ServiceCard.tsx` for displaying service summaries
    - Create `ServiceMap.tsx` for map integration
    - Create `ServiceFilter.tsx` for filtering controls
    - Create `ContactPanel.tsx` for contact information display
    - _Requirements: 4.5, 4.7_

  - [ ]* 8.7 Write unit tests for Services components
    - Test ServiceCard rendering
    - Test service filtering logic
    - Test ContactPanel display
    - _Requirements: 4.1, 4.4, 4.5, 4.7_

- [ ] 9. Checkpoint - Verify Destinations and Services modules
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement cross-module search and navigation
  - [ ] 10.1 Implement search functionality
    - Implement `searchAll()` method in TourismContext
    - Create search results page component
    - Display results organized by module (culture, stories, destinations, services)
    - Highlight search terms in results
    - Implement "no results" state with suggestions
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

  - [ ] 10.2 Implement search result filtering and ranking
    - Add filter controls for module, province, and content type
    - Implement relevance-based ranking algorithm (title > description > tags)
    - Sort results by relevance score
    - _Requirements: 10.6, 10.7_

  - [ ]* 10.3 Write property test for search ranking
    - **Property 3: Search Ranking Correctness**
    - **Validates: Requirements 10.7**
    - Test that results are ordered by descending relevance
    - Test that title matches rank higher than description matches
    - Test that ranking is transitive and consistent
    - _Requirements: 10.7_

  - [ ] 10.4 Integrate navigation menu
    - Update desktop sidebar navigation with tourism module items
    - Add tourism section with Cultura, Histórias, Destinos, Serviços tabs
    - Update mobile bottom navigation with overflow menu
    - Implement slide-up drawer for module selection on mobile
    - Add navigation icons matching existing design style
    - _Requirements: 5.1, 6.1, 6.2_

  - [ ] 10.5 Implement contextual navigation between modules
    - Add contextual links in Culture pages to related Stories and Destinations
    - Add contextual links in Stories pages to related Destinations
    - Add contextual links in Destinations pages to related Stories and Services
    - Add contextual links in Services pages to related Destinations
    - Ensure navigation preserves province context
    - _Requirements: 5.2, 5.3_

  - [ ]* 10.6 Write integration tests for cross-module navigation
    - Test navigation from Culture to Stories
    - Test navigation from Stories to Destinations
    - Test navigation from Destinations to Services
    - Test breadcrumbs navigation
    - Test browser back/forward buttons
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 11. Implement accessibility and responsive design
  - [ ] 11.1 Implement keyboard navigation
    - Add keyboard navigation support to all interactive elements
    - Implement focus management for modals and drawers
    - Add skip links for main content
    - Ensure tab order is logical
    - _Requirements: 8.1_

  - [ ] 11.2 Add ARIA labels and semantic HTML
    - Add descriptive alt text for all images
    - Use semantic HTML tags (header, nav, main, article, section)
    - Add ARIA labels for icon buttons and interactive elements
    - Implement ARIA live regions for dynamic content
    - _Requirements: 8.2, 8.5, 8.6_

  - [ ] 11.3 Ensure color contrast and typography
    - Verify color contrast meets WCAG AA standards (minimum 4.5:1)
    - Set minimum font size to 14px for body text
    - Add visible focus states for all interactive elements
    - _Requirements: 8.3, 8.4, 8.7_

  - [ ]* 11.4 Write accessibility tests
    - Run axe-core tests on all major pages
    - Test keyboard navigation flows
    - Verify alt text for all images
    - Test screen reader compatibility
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 11.5 Implement responsive layouts
    - Ensure all modules render correctly on mobile, tablet, and desktop
    - Adapt layouts for small screens (< 768px)
    - Implement responsive images with srcset
    - Test on various device sizes
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12. Implement performance optimizations
  - [ ] 12.1 Implement lazy loading and code splitting
    - Add React.lazy() for route-based code splitting
    - Implement lazy loading for MediaGallery images
    - Add lazy loading for long lists of content
    - Implement intersection observer for lazy loading
    - _Requirements: 6.3, 6.5_

  - [ ] 12.2 Optimize image delivery
    - Generate responsive image sizes (320px, 640px, 960px, 1280px)
    - Implement srcset for responsive images
    - Add loading="lazy" and decoding="async" attributes
    - Compress images for web delivery
    - _Requirements: 6.3_

  - [ ] 12.3 Add loading indicators and error handling
    - Display loading indicators during data fetching
    - Implement error boundaries for each module
    - Add user-friendly error messages in Portuguese
    - Implement offline state handling
    - _Requirements: 6.6, 6.7_

  - [ ]* 12.4 Write performance tests
    - Test page load times (< 2 seconds on 3G)
    - Verify lazy loading implementation
    - Test image optimization
    - Measure bundle sizes
    - _Requirements: 6.4, 6.5_

- [ ] 13. Final integration and testing
  - [ ] 13.1 Integrate TourismProvider into App.tsx
    - Add TourismProvider to provider hierarchy
    - Ensure all routes are properly configured
    - Test navigation between existing app and tourism modules
    - _Requirements: 5.1, 5.6_

  - [ ] 13.2 Create data validation script
    - Create `scripts/validate-data.ts` to validate all JSON data files
    - Run validation against Zod schemas
    - Report validation errors with file paths
    - _Requirements: 7.2, 7.3_

  - [ ]* 13.3 Write end-to-end integration tests
    - Test complete user flows across all modules
    - Test search functionality across modules
    - Test contextual navigation between modules
    - Test responsive behavior on different devices
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ] 13.4 Final checkpoint - Comprehensive testing
    - Run all unit tests
    - Run all property-based tests
    - Run all integration tests
    - Run accessibility tests
    - Run performance tests
    - Verify all requirements are met
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (filtering, validation, ranking)
- Unit tests validate specific examples and edge cases
- Integration tests validate routing, Leaflet integration, and cross-module navigation
- Accessibility tests validate WCAG compliance
- Performance tests validate loading times and optimization
- The implementation uses TypeScript for type safety throughout
- All data is validated using Zod schemas
- Leaflet is used for interactive maps
- Radix UI and Tailwind CSS are used for consistent styling
- The design integrates seamlessly with existing app navigation patterns

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5", "1.6"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["4.1", "5.1", "7.1", "8.1"] },
    { "id": 5, "tasks": ["4.2", "5.2", "7.2", "8.2"] },
    { "id": 6, "tasks": ["4.3", "5.3", "7.3", "8.3"] },
    { "id": 7, "tasks": ["4.4", "5.4", "5.6", "7.4", "8.4"] },
    { "id": 8, "tasks": ["4.5", "5.5", "7.5", "8.5"] },
    { "id": 9, "tasks": ["5.7", "7.6", "8.6"] },
    { "id": 10, "tasks": ["7.7", "8.7"] },
    { "id": 11, "tasks": ["10.1"] },
    { "id": 12, "tasks": ["10.2", "10.4"] },
    { "id": 13, "tasks": ["10.3", "10.5"] },
    { "id": 14, "tasks": ["10.6"] },
    { "id": 15, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 16, "tasks": ["11.4", "11.5"] },
    { "id": 17, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 18, "tasks": ["12.4"] },
    { "id": 19, "tasks": ["13.1", "13.2"] },
    { "id": 20, "tasks": ["13.3"] }
  ]
}
```
