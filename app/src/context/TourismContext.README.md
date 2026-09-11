# TourismContext Implementation

## Overview

The TourismContext provides centralized state management for all four cultural tourism modules:
- **Culture Module**: Cultural content per province
- **Stories Module**: Stories and curiosities per locality
- **Destinations Module**: Tourist destinations organized by location
- **Services Module**: Tourist services per province/district

## Features Implemented

### 1. State Management
- ✅ Culture content state with selected item tracking
- ✅ Stories state with selected item tracking
- ✅ Destinations state with selected item tracking
- ✅ Services state with selected item tracking
- ✅ Global loading state
- ✅ Global error state with clear function

### 2. Data Fetching Methods
- ✅ `fetchCultureByProvince(province)` - Fetch culture content for a province
- ✅ `fetchStoriesByProvince(province)` - Fetch stories for a province
- ✅ `fetchDestinationsByProvince(province)` - Fetch destinations for a province
- ✅ `fetchServicesByProvince(province)` - Fetch services for a province
- ✅ `fetchServicesByCategory(category, province?)` - Fetch services by category
- ✅ `searchAll(query)` - Search across all modules

### 3. Filter Methods
- ✅ `filterStories(filter)` - Filter stories by province, district, type, or search query
- ✅ `filterDestinations(filter)` - Filter destinations by province, district, type, or search query
- ✅ `filterServices(filter)` - Filter services by province, district, category, price range, rating, or search query

### 4. Selection Methods
- ✅ `setSelectedCulture(culture)` - Set the currently selected culture content
- ✅ `setSelectedStory(story)` - Set the currently selected story
- ✅ `setSelectedDestination(destination)` - Set the currently selected destination
- ✅ `setSelectedService(service)` - Set the currently selected service

## Usage

### 1. Wrap your app with TourismProvider

```tsx
import { TourismProvider } from '@/context/TourismContext';

function App() {
  return (
    <TourismProvider>
      {/* Your app components */}
    </TourismProvider>
  );
}
```

### 2. Use the useTourism hook in components

```tsx
import { useTourism } from '@/context/TourismContext';

function CulturePage() {
  const {
    cultureContent,
    fetchCultureByProvince,
    isLoading,
    error,
  } = useTourism();

  useEffect(() => {
    fetchCultureByProvince('maputo');
  }, [fetchCultureByProvince]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {cultureContent.map(culture => (
        <div key={culture.id}>{culture.title}</div>
      ))}
    </div>
  );
}
```

### 3. Filter data

```tsx
function StoriesPage() {
  const { stories, filterStories } = useTourism();

  // Filter by type
  const legends = filterStories({ type: 'legend' });
  
  // Filter by province and type
  const maputoLegends = filterStories({ 
    province: 'maputo', 
    type: 'legend' 
  });
  
  // Filter by search query
  const searchResults = filterStories({ 
    searchQuery: 'história' 
  });

  return (
    <div>
      <h2>Legends ({legends.length})</h2>
      {legends.map(story => (
        <div key={story.id}>{story.title}</div>
      ))}
    </div>
  );
}
```

### 4. Search across all modules

```tsx
function SearchPage() {
  const { searchAll, isLoading } = useTourism();
  const [results, setResults] = useState(null);

  const handleSearch = async (query: string) => {
    const searchResults = await searchAll(query);
    setResults(searchResults);
  };

  return (
    <div>
      <input 
        type="text" 
        onChange={(e) => handleSearch(e.target.value)} 
      />
      {results && (
        <div>
          <p>Total: {results.total}</p>
          <div>Culture: {results.culture.length}</div>
          <div>Stories: {results.stories.length}</div>
          <div>Destinations: {results.destinations.length}</div>
          <div>Services: {results.services.length}</div>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### Context Interface

```typescript
interface TourismContextType {
  // Culture
  cultureContent: CulturalContent[];
  selectedCulture: CulturalContent | null;
  fetchCultureByProvince: (province: Province) => Promise<void>;
  setSelectedCulture: (culture: CulturalContent | null) => void;
  
  // Stories
  stories: Story[];
  selectedStory: Story | null;
  fetchStoriesByProvince: (province: Province) => Promise<void>;
  filterStories: (filter: StoryFilter) => Story[];
  setSelectedStory: (story: Story | null) => void;
  
  // Destinations
  destinations: Destination[];
  selectedDestination: Destination | null;
  fetchDestinationsByProvince: (province: Province) => Promise<void>;
  filterDestinations: (filter: DestinationFilter) => Destination[];
  setSelectedDestination: (destination: Destination | null) => void;
  
  // Services
  services: TouristService[];
  selectedService: TouristService | null;
  fetchServicesByProvince: (province: Province) => Promise<void>;
  fetchServicesByCategory: (category: ServiceCategory, province?: Province) => Promise<void>;
  filterServices: (filter: ServiceFilter) => TouristService[];
  setSelectedService: (service: TouristService | null) => void;
  
  // Search
  searchAll: (query: string) => Promise<SearchResults>;
  
  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}
```

### Filter Interfaces

```typescript
interface StoryFilter {
  province?: Province;
  district?: string;
  type?: StoryType;
  searchQuery?: string;
}

interface DestinationFilter {
  province?: Province;
  district?: string;
  type?: DestinationType;
  searchQuery?: string;
}

interface ServiceFilter {
  province?: Province;
  district?: string;
  category?: ServiceCategory;
  priceRange?: 'budget' | 'mid-range' | 'luxury';
  rating?: number;
  searchQuery?: string;
}
```

## Implementation Details

### State Management Strategy

1. **Province-based caching**: When fetching data for a province, the context:
   - Removes old data for that province
   - Adds new data for that province
   - Preserves data from other provinces

2. **Error handling**: All fetch methods:
   - Set loading state before fetching
   - Clear error state before fetching
   - Catch and log errors
   - Set error message on failure
   - Always clear loading state in finally block

3. **Filtering**: All filter methods:
   - Work on the current state (no API calls)
   - Support multiple filter criteria
   - Return a new filtered array
   - Support search queries with case-insensitive matching

### Integration with tourismApi

The context uses the `tourismApi` service for all data fetching:
- `getCultureByProvince(province)` - Returns single CulturalContent or null
- `getStoriesByProvince(province)` - Returns Story[] (empty on error)
- `getDestinationsByProvince(province)` - Returns Destination[] (empty on error)
- `getServicesByProvince(province)` - Returns TouristService[] (empty on error)
- `searchAll(query)` - Returns SearchResults with all module data

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 5.5**: Navigation and Integration between Modules
  - Provides centralized state management for all modules
  - Enables cross-module data access and navigation

- **Requirement 7.1**: Gestão de Conteúdo e Dados
  - Uses TypeScript interfaces for all data types
  - Integrates with tourismApi service for data fetching
  - Implements proper error handling and logging

## Next Steps

To complete the tourism modules implementation:

1. **Add TourismProvider to App.tsx** - Wrap the app with the provider
2. **Create module pages** - Implement pages for each module using the context
3. **Add navigation** - Update sidebar and bottom nav with tourism module links
4. **Implement shared components** - Create ProvinceSelector, MediaGallery, etc.
5. **Add routing** - Configure routes for all module pages

## Testing

The context can be tested by:
1. Mocking the tourismApi service
2. Testing each fetch method with success and error cases
3. Testing filter methods with various filter combinations
4. Testing state updates and selection methods

Example test structure:
```typescript
describe('TourismContext', () => {
  it('should fetch culture content for a province', async () => {
    // Mock tourismApi.getCultureByProvince
    // Render component with TourismProvider
    // Call fetchCultureByProvince
    // Assert cultureContent state is updated
  });

  it('should filter stories by type', () => {
    // Set up stories state
    // Call filterStories with type filter
    // Assert filtered results
  });
});
```
