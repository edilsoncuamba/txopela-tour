import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Grid3x3, List, Map as MapIcon, ChevronRight } from 'lucide-react';
import { useTourism } from '@/context/TourismContext';
import type { Province, ProvinceInfo } from '@/types/geography';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProvinceSelectorProps {
  selectedProvince?: Province;
  onProvinceSelect: (province: Province) => void;
  variant?: 'grid' | 'list' | 'map';
  showDistrictCount?: boolean;
}

/**
 * ProvinceSelector Component
 * 
 * Displays all Mozambique provinces in different layouts (grid, list, map)
 * Allows users to select a province for viewing tourism content
 * 
 * @param selectedProvince - Currently selected province
 * @param onProvinceSelect - Callback when a province is selected
 * @param variant - Display variant: 'grid' (default), 'list', or 'map'
 * @param showDistrictCount - Whether to display district count for each province
 */
export default function ProvinceSelector({
  selectedProvince,
  onProvinceSelect,
  variant = 'grid',
  showDistrictCount = false,
}: ProvinceSelectorProps) {
  const { provinces, fetchProvinces, isLoading } = useTourism();
  const [displayVariant, setDisplayVariant] = useState<'grid' | 'list' | 'map'>(variant);

  // Fetch provinces on mount
  useEffect(() => {
    if (provinces.length === 0) {
      fetchProvinces();
    }
  }, [provinces.length, fetchProvinces]);

  // Province color gradients for visual distinction
  const provinceGradients: Record<string, string> = {
    'maputo': 'from-[#0077B6] to-[#00A8E8]',
    'gaza': 'from-[#F4A261] to-[#E9C46A]',
    'inhambane': 'from-[#2D6A4F] to-[#40916C]',
    'sofala': 'from-[#7C3AED] to-[#A78BFA]',
    'manica': 'from-[#059669] to-[#34D399]',
    'tete': 'from-[#DC2626] to-[#F87171]',
    'zambezia': 'from-[#0891B2] to-[#22D3EE]',
    'nampula': 'from-[#EA580C] to-[#FB923C]',
    'niassa': 'from-[#7C2D12] to-[#C2410C]',
    'cabo-delgado': 'from-[#4338CA] to-[#818CF8]',
    'maputo-cidade': 'from-[#BE123C] to-[#FB7185]',
  };

  // Loading state
  if (isLoading && provinces.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#0077B6] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">A carregar províncias...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && provinces.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma província disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Variant Selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Selecione uma Província</h2>
        
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDisplayVariant('grid')}
            className={cn(
              'transition-colors',
              displayVariant === 'grid' 
                ? 'bg-white shadow-sm text-[#0077B6]' 
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Grid3x3 size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDisplayVariant('list')}
            className={cn(
              'transition-colors',
              displayVariant === 'list' 
                ? 'bg-white shadow-sm text-[#0077B6]' 
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <List size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDisplayVariant('map')}
            className={cn(
              'transition-colors',
              displayVariant === 'map' 
                ? 'bg-white shadow-sm text-[#0077B6]' 
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <MapIcon size={16} />
          </Button>
        </div>
      </div>

      {/* Grid Variant */}
      {displayVariant === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {provinces.map((province, index) => (
            <ProvinceCardGrid
              key={province.id}
              province={province}
              isSelected={selectedProvince === province.id}
              onSelect={() => onProvinceSelect(province.id)}
              gradient={provinceGradients[province.id]}
              showDistrictCount={showDistrictCount}
              index={index}
            />
          ))}
        </div>
      )}

      {/* List Variant */}
      {displayVariant === 'list' && (
        <div className="space-y-3">
          {provinces.map((province, index) => (
            <ProvinceCardList
              key={province.id}
              province={province}
              isSelected={selectedProvince === province.id}
              onSelect={() => onProvinceSelect(province.id)}
              gradient={provinceGradients[province.id]}
              showDistrictCount={showDistrictCount}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Map Variant */}
      {displayVariant === 'map' && (
        <ProvinceMapView
          provinces={provinces}
          selectedProvince={selectedProvince}
          onProvinceSelect={onProvinceSelect}
          provinceGradients={provinceGradients}
          showDistrictCount={showDistrictCount}
        />
      )}
    </div>
  );
}

/**
 * Province Card - Grid Variant
 */
interface ProvinceCardProps {
  province: ProvinceInfo;
  isSelected: boolean;
  onSelect: () => void;
  gradient: string;
  showDistrictCount: boolean;
  index: number;
}

function ProvinceCardGrid({
  province,
  isSelected,
  onSelect,
  gradient,
  showDistrictCount,
  index,
}: ProvinceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
    >
      <button
        onClick={onSelect}
        className={cn(
          'w-full group relative overflow-hidden rounded-2xl transition-all duration-300',
          'hover:shadow-xl hover:-translate-y-1',
          isSelected 
            ? 'ring-4 ring-[#0077B6] ring-offset-2 shadow-xl' 
            : 'shadow-md hover:shadow-lg'
        )}
      >
        {/* Gradient Background */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-90 group-hover:opacity-100 transition-opacity',
          gradient
        )} />

        {/* Content */}
        <div className="relative p-6 text-white">
          {/* Province Name */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold leading-tight">{province.name}</h3>
            <MapPin size={20} className="opacity-80 flex-shrink-0 ml-2" />
          </div>

          {/* Capital */}
          <p className="text-white/90 text-sm mb-4">
            Capital: <span className="font-semibold">{province.capital}</span>
          </p>

          {/* District Count */}
          {showDistrictCount && (
            <div className="flex items-center gap-2 text-sm">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="font-semibold">{province.districts.length}</span>
                {' '}
                {province.districts.length === 1 ? 'distrito' : 'distritos'}
              </div>
            </div>
          )}

          {/* Selected Indicator */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"
            >
              <div className="w-3 h-3 bg-[#0077B6] rounded-full" />
            </motion.div>
          )}
        </div>

        {/* Hover Arrow */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={20} className="text-white" />
        </div>
      </button>
    </motion.div>
  );
}

/**
 * Province Card - List Variant
 */
function ProvinceCardList({
  province,
  isSelected,
  onSelect,
  gradient,
  showDistrictCount,
  index,
}: ProvinceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.23, 1, 0.32, 1] }}
    >
      <button
        onClick={onSelect}
        className={cn(
          'w-full group flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
          'hover:shadow-md',
          isSelected 
            ? 'bg-[#0077B6]/10 ring-2 ring-[#0077B6] shadow-sm' 
            : 'bg-white hover:bg-gray-50 border border-gray-200'
        )}
      >
        {/* Gradient Icon */}
        <div className={cn(
          'w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
          gradient
        )}>
          <MapPin size={28} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{province.name}</h3>
          <p className="text-sm text-gray-600">
            Capital: <span className="font-medium">{province.capital}</span>
          </p>
          {showDistrictCount && (
            <p className="text-xs text-gray-500 mt-1">
              {province.districts.length} {province.districts.length === 1 ? 'distrito' : 'distritos'}
            </p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight 
          size={20} 
          className={cn(
            'transition-all',
            isSelected ? 'text-[#0077B6]' : 'text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1'
          )}
        />
      </button>
    </motion.div>
  );
}

/**
 * Province Map View
 * Displays provinces on a simplified map visualization
 */
interface ProvinceMapViewProps {
  provinces: ProvinceInfo[];
  selectedProvince?: Province;
  onProvinceSelect: (province: Province) => void;
  provinceGradients: Record<string, string>;
  showDistrictCount: boolean;
}

function ProvinceMapView({
  provinces,
  selectedProvince,
  onProvinceSelect,
  provinceGradients,
  showDistrictCount,
}: ProvinceMapViewProps) {
  // Calculate bounds for positioning
  const lats = provinces.map(p => p.coordinates.lat);
  const lngs = provinces.map(p => p.coordinates.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Normalize coordinates to percentage positions
  const getPosition = (province: ProvinceInfo) => {
    const x = ((province.coordinates.lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - province.coordinates.lat) / (maxLat - minLat)) * 100;
    return { x, y };
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 min-h-[600px] border border-blue-100">
      {/* Map Title */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
        <p className="text-sm font-semibold text-gray-700">Mapa de Moçambique</p>
      </div>

      {/* Province Markers */}
      <div className="relative w-full h-full">
        {provinces.map((province, index) => {
          const position = getPosition(province);
          const isSelected = selectedProvince === province.id;

          return (
            <motion.div
              key={province.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="absolute"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button
                onClick={() => onProvinceSelect(province.id)}
                className="group relative"
              >
                {/* Marker Pin */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'relative z-10 transition-all duration-300',
                    isSelected && 'scale-125'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full bg-gradient-to-br shadow-lg flex items-center justify-center',
                    'ring-4 ring-white transition-all',
                    provinceGradients[province.id],
                    isSelected && 'ring-[#0077B6] ring-offset-2'
                  )}>
                    <MapPin size={20} className="text-white" />
                  </div>
                </motion.div>

                {/* Province Info Popup */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20',
                    'bg-white rounded-lg shadow-xl p-3 min-w-[160px]',
                    'pointer-events-none group-hover:pointer-events-auto',
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-sm mb-1">{province.name}</p>
                    <p className="text-xs text-gray-600 mb-2">Capital: {province.capital}</p>
                    {showDistrictCount && (
                      <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                        {province.districts.length} {province.districts.length === 1 ? 'distrito' : 'distritos'}
                      </div>
                    )}
                  </div>
                  
                  {/* Arrow pointer */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />
                </motion.div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-sm">
        <p className="text-xs text-gray-600 mb-2 font-semibold">Legenda</p>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <MapPin size={14} className="text-[#0077B6]" />
          <span>Clique para selecionar</span>
        </div>
      </div>
    </div>
  );
}
