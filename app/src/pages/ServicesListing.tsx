import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE, extractImages, mapValidService } from '@/utils/dataValidation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Filter, MapPin, ChevronDown, Heart } from 'lucide-react';
import ServiceDetail from './ServiceDetail';
import { servicesApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

interface Service {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  distance: string;
  image: string;
  amenities: string[];
  description: string;
  // Localização — hierarquia completa
  provincia: string;
  distrito: string;
  administrative_post?: string;
  locality?: string;
  nearby_reference?: string;
  endereco: string;
  location?: {
    country?: string;
    province?: string;
    district?: string;
    administrative_post?: string;
    locality?: string;
    nearby_reference?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  telefone: string;
  whatsapp: string;
  email: string;
  horario: string;
  lat?: number;
  lng?: number;
  contributor?: {
    id?: string;
    name: string;
    type: 'guide' | 'traveler' | 'resident' | 'business';
  };
}

interface ServicesListingProps {
  onBack: () => void;
  initialProvince?: string;
  initialDistrict?: string;
}

// Lista est�tica de prov�ncias/distritos para filtros de UI
const provinces = [
  { name: 'Todas as prov�ncias', districts: [] },
  { name: 'Maputo Cidade',    districts: ['Todos os distritos', 'KaMpfumo', 'Nlhamankulu', 'KaMaxaquene', 'KaPolana', 'KaMubukwana', 'KaTembe', 'KaNyaka'] },
  { name: 'Maputo Prov�ncia', districts: ['Todos os distritos', 'Boane', 'Magude', 'Manhi�a', 'Marracuene', 'Matola', 'Matutu�ne', 'Moamba', 'Namaacha'] },
  { name: 'Gaza',             districts: ['Todos os distritos', 'Bilene', 'Chibuto', 'Chicualacuala', 'Chigubo', 'Ch�kw�', 'Guij�', 'Limpopo', 'Mabalane', 'Mandlakaze', 'Massingir', 'Xai-Xai'] },
  { name: 'Inhambane',        districts: ['Todos os distritos', 'Funhalouro', 'Govuro', 'Homo�ne', 'Inhambane Cidade', 'Inharrime', 'Inhassoro', 'Jangamo', 'Mabote', 'Massinga', 'Maxixe', 'Morrumbene', 'Panda', 'Tofo', 'Vilankulo', 'Zavala'] },
  { name: 'Sofala',           districts: ['Todos os distritos', 'Beira', 'B�zi', 'Caia', 'Cheringoma', 'Chibabava', 'Dondo', 'Gorongosa', 'Machanga', 'Maringue', 'Marromeu', 'Muanza', 'Nhamatanda'] },
  { name: 'Manica',           districts: ['Todos os distritos', 'B�ru�', 'Chimoio', 'Gondola', 'Guro', 'Machaze', 'Macossa', 'Manica', 'Mossurize', 'Sussundenga', 'Tambara', 'Vanduzi'] },
  { name: 'Tete',             districts: ['Todos os distritos', 'Ang�nia', 'Cahora-Bassa', 'Changara', 'Chifunde', 'Chiuta', 'D�a', 'Macanga', 'Mar�via', 'Moatize', 'Mutarara', 'Tete Cidade', 'Tsangano', 'Zumbo'] },
  { name: 'Zamb�zia',         districts: ['Todos os distritos', 'Alto Mol�cu�', 'Chinde', 'Derre', 'Gil�', 'Guru�', 'Ile', 'Inhassunge', 'Luabo', 'Lugela', 'Maganja da Costa', 'Milange', 'Mocuba', 'Mopeia', 'Morrumbala', 'Namacurra', 'Namarr�i', 'Nicoadala', 'Pebane', 'Quelimane'] },
  { name: 'Nampula',          districts: ['Todos os distritos', 'Angoche', 'Er�ti', 'Ilha de Mo�ambique', 'Lalaua', 'Larde', 'Li�po', 'Malema', 'Meconta', 'Mecub�ri', 'Memba', 'Mogincual', 'Mogovolas', 'Moma', 'Monapo', 'Mossuril', 'Muecate', 'Murrupula', 'Nacala-Porto', 'Nacala-a-Velha', 'Nacar�a', 'Nampula Cidade', 'Rapale', 'Ribau�'] },
  { name: 'Cabo Delgado',     districts: ['Todos os distritos', 'Ancuabe', 'Balama', 'Chi�re', 'Ibo', 'Macomia', 'Mec�fi', 'Meluco', 'Metuge', 'Moc�mboa da Praia', 'Montepuez', 'Mueda', 'Muidumbe', 'Namuno', 'Nangade', 'Palma', 'Pemba', 'Quissanga'] },
  { name: 'Niassa',           districts: ['Todos os distritos', 'Chimbonila', 'Cuamba', 'Lago', 'Lichinga', 'Majune', 'Mandimba', 'Marrupa', 'Ma�a', 'Mavago', 'Mecanhelas', 'Mecula', 'Metarica', 'Muembe', 'N\'gauma', 'Ngapa', 'Sanga', 'Ul�ngu�'] },
];

const categories = ['Todas as categorias', 'Hospedagem', 'Restaurante', 'Guias locais', 'Transporte', 'Ag�ncia de Turismo'];

export default function ServicesListing({
  onBack, initialProvince, initialDistrict }: ServicesListingProps) {
  useScrollTop();
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvince, setSelectedProvince] = useState(initialProvince || 'Todas as prov�ncias');
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict || 'Todos os distritos');
  const [selectedCategory, setSelectedCategory] = useState('Todas as categorias');
  const [showFilters, setShowFilters] = useState(false);
  const [suggested, setSuggested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await servicesApi.list({ limit: 100, sortBy: 'recent' });
        const items: any[] = Array.isArray(data) ? data : (data?.services ?? data?.results ?? []);
        setAllServices(
          items
            .map((s: any) => mapValidService(s))
            .filter((s): s is Service => s !== null),
        );
      } catch {
        setAllServices([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const availableDistricts = provinces.find(p => p.name === selectedProvince)?.districts || [];

  const filteredServices = allServices.filter(service => {
    const provinceMatch = selectedProvince === 'Todas as prov�ncias' || service.provincia === selectedProvince;
    const districtMatch = selectedDistrict === 'Todos os distritos' || service.distrito === selectedDistrict;
    const categoryMatch = selectedCategory === 'Todas as categorias' || service.category === selectedCategory;
    return provinceMatch && districtMatch && categoryMatch;
  });

  if (selectedService) {
    return (
      <ServiceDetail 
        service={selectedService} 
        onBack={() => setSelectedService(null)} 
      />
    );
  }

  return (
    <motion.div className="pb-16"
      style={{ background: '#F5F5F0', fontFamily: 'Nunito, sans-serif' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: '#F8FAFC' }}>
              <ChevronLeft size={20} style={{ color: '#1A1A1A' }} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-lg font-black" style={{ color: '#1A1A1A' }}>Servi�os locais</h1>
              <p className="text-xs" style={{ color: '#94A3B8' }}>
                {isLoading ? 'A carregar...' : `${filteredServices.length} servi�os encontrados`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: showFilters ? '#EEF7F0' : '#F8FAFC' }}>
            <Filter size={18} style={{ color: showFilters ? '#1B5E3B' : '#64748B' }} strokeWidth={2} />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t px-4 py-3"
              style={{ borderColor: '#F3F4F6' }}
            >
              {/* 3 filters in one row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Province */}
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: '#94A3B8' }}>Prov�ncia</p>
                  <div className="relative">
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setSelectedDistrict('Todos os distritos');
                      }}
                      className="w-full px-2 py-2 rounded-xl border text-[11px] font-semibold appearance-none bg-white pr-6 truncate"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                    >
                      {provinces.map(province => (
                        <option key={province.name} value={province.name}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                  </div>
                </div>

                {/* District */}
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: '#94A3B8' }}>Distrito</p>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={availableDistricts.length === 0}
                      className="w-full px-2 py-2 rounded-xl border text-[11px] font-semibold appearance-none bg-white pr-6 truncate disabled:opacity-40"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                    >
                      {availableDistricts.length === 0
                        ? <option>Todos</option>
                        : availableDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))
                      }
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p className="text-[10px] font-bold mb-1" style={{ color: '#94A3B8' }}>Categoria</p>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border text-[11px] font-semibold appearance-none bg-white pr-6 truncate"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Services Grid - 2 columns */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
              <div style={{ height: 200 }} className="bg-gray-200" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#EEF7F0' }}>
              <MapPin size={24} style={{ color: '#1B5E3B' }} />
            </div>
            <p className="text-sm font-black mb-1" style={{ color: '#1A1A1A' }}>
              Nenhum servi�o encontrado
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              Tente ajustar os filtros de pesquisa
            </p>
          </div>
        ) : (
          filteredServices.map(service => {
            const serviceBadgeColors: Record<string, string> = {
              'Hospedagem': '#2BB5C8',
              'Guias locais': '#F4821F',
              'Restaurante': '#7B5EA7',
              'Transporte': '#2563EB',
            };
            const badgeBg = serviceBadgeColors[service.category] || '#1B5E3B';

            return (
              <motion.div
                key={service.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedService(service)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer"
              >
                {/* Image */}
                <div className="relative" style={{ height: 200 }}>
                  <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
                  
                  {/* Rating badge - bottom left */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <Star size={12} fill="#FBBF24" stroke="none" />
                    <span className="text-white text-xs font-bold">{service.rating}</span>
                    <span className="text-white/80 text-[10px]">({service.reviewsCount})</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-2.5">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h3 className="text-sm font-black mb-0.5 leading-tight" style={{ color: '#1A1A1A' }}>{service.name}</h3>
                      <p className="text-[10px] leading-snug" style={{ color: '#6B7280' }}>
                        {service.provincia} � {service.distrito}
                      </p>
                    </div>
                    <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: '#EEF7F0', color: '#1B5E3B' }}>
                      {service.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex items-center text-sm"
                        style={{ color: '#9CA3AF' }}
                      >
                        <Heart size={13} fill="none" />
                      </button>
                      <button className="flex items-center gap-0.5 text-sm transition-colors"
                        style={{ color: suggested[service.id] ? '#1B5E3B' : '#9CA3AF' }}
                        onClick={async e => {
                          e.stopPropagation();
                          const title = service.name;
                          const text  = `${service.name} � ${service.category || ''} em ${service.provincia || 'Mo�ambique'}\nDescobre mais em Txopela Tour!`;
                          const url   = window.location.origin;
                          try {
                            if (navigator.share) {
                              await navigator.share({ title, text, url });
                            } else {
                              await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                            }
                            setSuggested(p => ({ ...p, [service.id]: true }));
                            setTimeout(() => setSuggested(p => ({ ...p, [service.id]: false })), 2000);
                          } catch { /* utilizador cancelou */ }
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke={suggested[service.id] ? '#1B5E3B' : 'currentColor'} strokeWidth="2">
                          <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                        </svg>
                        <span className="text-[9px] font-semibold">
                          {suggested[service.id] ? 'Sugerido!' : 'Sugerir'}
                        </span>
                      </button>
                    </div>
                    <button className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-white"
                      style={{ background: '#1B5E3B' }}>
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      )}
    </motion.div>
  );
}

