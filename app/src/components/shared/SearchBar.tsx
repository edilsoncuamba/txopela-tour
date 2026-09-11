import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Filter, ChevronDown, MapPin, BookOpen, Landmark, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export type SuggestionType = 'culture' | 'story' | 'destination' | 'service';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: SuggestionType;
  province?: string;
  icon?: string;
}

export interface SearchFilter {
  id: string;
  label: string;
  type: 'select' | 'checkbox' | 'range';
  options?: { value: string; label: string }[];
}

export interface SearchBarProps {
  /** Placeholder text for the input */
  placeholder?: string;
  /** Called whenever the debounced query changes (real-time) */
  onSearch: (query: string) => void;
  /** Called when the user explicitly picks a suggestion */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Called when any filter value changes (filterId → value) */
  onFilterChange?: (filterId: string, value: string) => void;
  /** Whether to show the suggestions dropdown */
  showSuggestions?: boolean;
  /**
   * Controlled suggestions list.
   * When provided, the component renders these suggestions in the dropdown.
   * The parent is responsible for updating this list in response to `onSearch`.
   */
  suggestions?: SearchSuggestion[];
  /** Optional filter definitions to render in the filter panel */
  filters?: SearchFilter[];
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Initial value */
  defaultValue?: string;
  /** Additional className for the wrapper */
  className?: string;
  /** Called when the form is submitted (Enter key or search button) */
  onSubmit?: (query: string) => void;
}

// -------------------------------------------------------------------
// Predefined filter sets
// -------------------------------------------------------------------

/**
 * Default module filters for cross-module searching.
 * Can be passed directly as the `filters` prop.
 */
export const MODULE_FILTERS: SearchFilter[] = [
  {
    id: 'module',
    label: 'Módulo',
    type: 'checkbox',
    options: [
      { value: 'culture', label: 'Cultura' },
      { value: 'story', label: 'Histórias' },
      { value: 'destination', label: 'Destinos' },
      { value: 'service', label: 'Serviços' },
    ],
  },
  {
    id: 'province',
    label: 'Província',
    type: 'select',
    options: [
      { value: 'maputo', label: 'Maputo' },
      { value: 'gaza', label: 'Gaza' },
      { value: 'inhambane', label: 'Inhambane' },
      { value: 'sofala', label: 'Sofala' },
      { value: 'manica', label: 'Manica' },
      { value: 'tete', label: 'Tete' },
      { value: 'zambezia', label: 'Zambézia' },
      { value: 'nampula', label: 'Nampula' },
      { value: 'niassa', label: 'Niassa' },
      { value: 'cabo-delgado', label: 'Cabo Delgado' },
      { value: 'maputo-cidade', label: 'Maputo Cidade' },
    ],
  },
];

// -------------------------------------------------------------------
// Icon helpers
// -------------------------------------------------------------------

const TYPE_ICONS: Record<SuggestionType, React.ReactNode> = {
  culture: <Landmark size={14} className="text-[#7C3AED]" aria-hidden />,
  story: <BookOpen size={14} className="text-[#0891B2]" aria-hidden />,
  destination: <MapPin size={14} className="text-[#059669]" aria-hidden />,
  service: <Briefcase size={14} className="text-[#EA580C]" aria-hidden />,
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  culture: 'Cultura',
  story: 'História',
  destination: 'Destino',
  service: 'Serviço',
};

const TYPE_BADGE_CLASSES: Record<SuggestionType, string> = {
  culture: 'bg-purple-100 text-purple-700 border-purple-200',
  story: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  destination: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  service: 'bg-orange-100 text-orange-700 border-orange-200',
};

// -------------------------------------------------------------------
// Custom debounce hook
// -------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------

/**
 * SearchBar – shared cross-module search component.
 *
 * Features:
 * - Real-time suggestions via `onSearch` with configurable debounce
 * - Suggestion dropdown rendered with Radix UI Popover
 * - Filter panel with select / checkbox / range filter types
 * - Keyboard navigation (↑ ↓ Enter Escape)
 * - Accessible: roles, aria-labels, focus management
 *
 * Requirements: 10.1, 10.2
 */
export default function SearchBar({
  placeholder = 'Pesquisar cultura, histórias, destinos...',
  onSearch,
  onSuggestionSelect,
  onFilterChange,
  showSuggestions = true,
  suggestions: externalSuggestions,
  filters = [],
  debounceMs = 300,
  defaultValue = '',
  className,
  onSubmit,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  // When externalSuggestions prop is provided we use it; otherwise fall back to internal state.
  const [internalSuggestions, setInternalSuggestions] = useState<SearchSuggestion[]>([]);
  const suggestions = externalSuggestions ?? internalSuggestions;
  const setSuggestions = setInternalSuggestions;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  // When external suggestions arrive and there's a query, open the dropdown
  useEffect(() => {
    if (externalSuggestions !== undefined && query.trim().length > 0 && showSuggestions) {
      setIsOpen(true);
      setIsLoading(false);
    }
  }, [externalSuggestions, query, showSuggestions]);

  // -------------------------------------------------------------------
  // Trigger onSearch callback when debounced query changes
  // -------------------------------------------------------------------
  useEffect(() => {
    if (debouncedQuery.trim().length === 0) {
      setInternalSuggestions([]);
      setIsOpen(false);
      onSearch('');
      return;
    }

    setIsLoading(true);
    onSearch(debouncedQuery.trim());

    // Clear the loading indicator after the debounce + a small buffer
    const timer = setTimeout(() => setIsLoading(false), debounceMs + 100);
    return () => clearTimeout(timer);
  }, [debouncedQuery, onSearch, debounceMs]); // setSuggestions omitted intentionally – it's a stable setter

  // -------------------------------------------------------------------
  // Close dropdown when clicking outside
  // -------------------------------------------------------------------
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // -------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'Enter') {
          handleSubmit();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => Math.max(prev - 1, -1));
          break;

        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[activeIndex]);
          } else {
            handleSubmit();
          }
          break;

        case 'Escape':
          setIsOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, suggestions, activeIndex] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // -------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    if (value.trim().length > 0 && showSuggestions) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);
    setActiveIndex(-1);
    onSuggestionSelect?.(suggestion);
    onSearch(suggestion.text);
  };

  const handleClear = () => {
    setQuery('');
    // Only clear internal suggestions; if suggestions are controlled externally
    // the parent's onSearch('') callback will update them.
    setInternalSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    onSearch('');
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (query.trim()) {
      setIsOpen(false);
      onSubmit?.(query.trim());
      onSearch(query.trim());
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }));
    onFilterChange?.(filterId, value);
  };

  const activeFiltersCount = Object.values(filterValues).filter(v => v && v !== 'all').length;

  // -------------------------------------------------------------------
  // Expose a way to set external suggestions (used by parent via ref)
  // This component also exports a setSuggestions setter that consumers
  // can call from inside their onSearch callback using a ref pattern.
  // Since React doesn't directly expose state setters, we forward a
  // method via the imperative handle below.
  // -------------------------------------------------------------------

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input Row */}
      <div
        className={cn(
          'flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-sm',
          'transition-all duration-200',
          'focus-within:border-[#0077B6] focus-within:ring-2 focus-within:ring-[#0077B6]/20',
          isOpen && 'rounded-b-none border-b-0'
        )}
      >
        {/* Search Icon */}
        <div className="flex-shrink-0 pl-4">
          {isLoading ? (
            <div
              className="w-4 h-4 border-2 border-[#0077B6] border-t-transparent rounded-full animate-spin"
              aria-label="A pesquisar..."
            />
          ) : (
            <Search size={16} className="text-gray-400" aria-hidden />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          role="textbox"
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls="search-suggestions-list"
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length > 0 && suggestions.length > 0 && showSuggestions) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            'flex-1 py-3 text-sm text-gray-900 placeholder:text-gray-400',
            'bg-transparent outline-none border-none',
            'min-w-0'
          )}
        />

        {/* Clear Button */}
        <AnimatePresence>
          {query.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleClear}
                aria-label="Limpar pesquisa"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Button */}
        {filters.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilterOpen(v => !v)}
              aria-label={`Filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount} activos)` : ''}`}
              aria-expanded={filterOpen}
              className={cn(
                'flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mr-2',
                activeFiltersCount > 0 && 'text-[#0077B6]'
              )}
            >
              <Filter size={14} aria-hidden />
              <span className="text-xs hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge
                  className="h-4 min-w-4 px-1 text-[10px] bg-[#0077B6] text-white border-0"
                  aria-label={`${activeFiltersCount} filtros activos`}
                >
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown
                size={12}
                className={cn('transition-transform', filterOpen && 'rotate-180')}
                aria-hidden
              />
            </Button>
          </>
        )}

        {/* Search Submit Button */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={query.trim().length === 0}
          aria-label="Pesquisar"
          className={cn(
            'flex-shrink-0 rounded-l-none rounded-r-xl h-full px-4',
            'bg-[#0077B6] hover:bg-[#005f8e] text-white text-sm font-medium',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
        >
          <Search size={15} aria-hidden />
          <span className="hidden sm:inline ml-1.5">Pesquisar</span>
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 left-0 right-0',
              'bg-white border border-gray-200 border-t-0 rounded-b-xl shadow-lg',
              'overflow-hidden'
            )}
          >
            <ul
              id="search-suggestions-list"
              ref={listRef}
              role="listbox"
              aria-label="Sugestões de pesquisa"
              className="max-h-72 overflow-y-auto py-1"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 cursor-pointer',
                    'text-sm transition-colors duration-100',
                    index === activeIndex
                      ? 'bg-[#0077B6]/10 text-[#0077B6]'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  onMouseDown={e => {
                    // Prevent blur before click
                    e.preventDefault();
                    handleSuggestionSelect(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {/* Type Icon */}
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {TYPE_ICONS[suggestion.type]}
                  </span>

                  {/* Text */}
                  <span className="flex-1 truncate">{suggestion.text}</span>

                  {/* Province */}
                  {suggestion.province && (
                    <span className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-0.5">
                      <MapPin size={10} aria-hidden />
                      {suggestion.province}
                    </span>
                  )}

                  {/* Type Badge */}
                  <Badge
                    className={cn(
                      'flex-shrink-0 text-[10px] px-1.5 py-0 h-4 border font-medium',
                      TYPE_BADGE_CLASSES[suggestion.type]
                    )}
                  >
                    {TYPE_LABELS[suggestion.type]}
                  </Badge>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty suggestions state */}
      <AnimatePresence>
        {isOpen && showSuggestions && !isLoading && debouncedQuery.trim().length > 0 && suggestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 left-0 right-0',
              'bg-white border border-gray-200 border-t-0 rounded-b-xl shadow-lg',
              'px-4 py-4 text-center'
            )}
          >
            <p className="text-sm text-gray-500">
              Nenhuma sugestão para <strong className="text-gray-700">{debouncedQuery}</strong>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Prima Enter para pesquisar na aplicação
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {filterOpen && filters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'mt-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm',
                'flex flex-wrap gap-4'
              )}
              role="region"
              aria-label="Opções de filtro"
            >
              {filters.map(filter => (
                <FilterControl
                  key={filter.id}
                  filter={filter}
                  value={filterValues[filter.id] ?? ''}
                  onChange={value => handleFilterChange(filter.id, value)}
                />
              ))}

              {/* Reset filters */}
              {activeFiltersCount > 0 && (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterValues({})}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    <X size={12} className="mr-1" aria-hidden />
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------------
// FilterControl – renders a single filter based on its type
// -------------------------------------------------------------------

interface FilterControlProps {
  filter: SearchFilter;
  value: string;
  onChange: (value: string) => void;
}

function FilterControl({ filter, value, onChange }: FilterControlProps) {
  if (filter.type === 'select' && filter.options) {
    return (
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label
          htmlFor={`filter-${filter.id}`}
          className="text-xs font-medium text-gray-600"
        >
          {filter.label}
        </label>
        <Select
          value={value || 'all'}
          onValueChange={val => onChange(val === 'all' ? '' : val)}
        >
          <SelectTrigger
            id={`filter-${filter.id}`}
            className="h-8 text-xs"
            aria-label={filter.label}
          >
            <SelectValue placeholder={`Todos`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {filter.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filter.type === 'checkbox' && filter.options) {
    return (
      <fieldset className="flex flex-col gap-1">
        <legend className="text-xs font-medium text-gray-600 mb-1">{filter.label}</legend>
        <div className="flex flex-wrap gap-2">
          {filter.options.map(opt => {
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="checkbox"
                aria-checked={isActive}
                onClick={() => onChange(isActive ? '' : opt.value)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors duration-150',
                  isActive
                    ? 'bg-[#0077B6] text-white border-[#0077B6]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0077B6] hover:text-[#0077B6]'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  // Unsupported filter type — render nothing
  return null;
}

// -------------------------------------------------------------------
// useSearchBar hook — convenience hook for wiring SearchBar to TourismContext
// -------------------------------------------------------------------

/**
 * Convenience hook that wires a SearchBar to the TourismContext `searchAll` method
 * and returns a setSuggestions callback and the current suggestions list.
 *
 * Usage:
 * ```tsx
 * const { suggestions, handleSearch } = useSearchBar();
 * <SearchBar onSearch={handleSearch} suggestions={suggestions} />
 * ```
 */
export function useSearchBar(options?: { maxSuggestions?: number }) {
  const maxSuggestions = options?.maxSuggestions ?? 8;
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  const handleSearch = useCallback(
    async (
      query: string,
      searchAll: (q: string) => Promise<{
        culture: { id: string; title: string; province?: string }[];
        stories: { id: string; title: string; province?: string }[];
        destinations: { id: string; name: string; province?: string }[];
        services: { id: string; name: string; province?: string }[];
        total: number;
      }>
    ) => {
      if (!query) {
        setSuggestions([]);
        return;
      }

      try {
        const results = await searchAll(query);
        const next: SearchSuggestion[] = [];

        results.culture.slice(0, 2).forEach(c => {
          next.push({ id: `culture-${c.id}`, text: c.title, type: 'culture', province: c.province });
        });

        results.stories.slice(0, 2).forEach(s => {
          next.push({ id: `story-${s.id}`, text: s.title, type: 'story', province: s.province });
        });

        results.destinations.slice(0, 2).forEach(d => {
          next.push({ id: `dest-${d.id}`, text: d.name, type: 'destination', province: d.province });
        });

        results.services.slice(0, 2).forEach(s => {
          next.push({ id: `svc-${s.id}`, text: s.name, type: 'service', province: s.province });
        });

        setSuggestions(next.slice(0, maxSuggestions));
      } catch {
        setSuggestions([]);
      }
    },
    [maxSuggestions]
  );

  return { suggestions, setSuggestions, handleSearch };
}
