import type { CulturalHeritage, ProvinceInfo } from '../types';
import { inhambaneHeritage } from './inhambane';
import { provincesData } from './provinces';

// Mapa de todos os patrimónios por província
const allHeritage: CulturalHeritage[] = [
  ...inhambaneHeritage,
  // Adicionar outras províncias aqui quando os dados estiverem disponíveis
];

// Exportações públicas
export { provincesData };

/** Devolve lista de províncias com contagem real de patrimónios */
export function getProvinces(): ProvinceInfo[] {
  return provincesData.map(p => ({
    ...p,
    heritageCount: allHeritage.filter(h => h.province === p.name).length,
  }));
}

/** Devolve patrimónios filtrados */
export function getHeritage(params?: {
  province?: string;
  district?: string;
  category?: string;
  criteria?: string;
  search?: string;
}): CulturalHeritage[] {
  let results = [...allHeritage];

  if (params?.province) {
    results = results.filter(h => h.province === params.province);
  }
  if (params?.district) {
    results = results.filter(h => h.district === params.district);
  }
  if (params?.category) {
    results = results.filter(h => h.category === params.category);
  }
  if (params?.criteria) {
    results = results.filter(h =>
      h.criteria.some(c => c.toLowerCase().includes(params.criteria!.toLowerCase()))
    );
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    results = results.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q) ||
      h.district.toLowerCase().includes(q) ||
      h.locality?.toLowerCase().includes(q)
    );
  }

  return results;
}

/** Devolve um património pelo id */
export function getHeritageById(id: string): CulturalHeritage | undefined {
  return allHeritage.find(h => h.id === id);
}
