import type { Destination, DestinationFilter } from '../types';
import { destinationsData } from './destinations';

export function getDestinations(filter?: DestinationFilter): Destination[] {
  let r = [...destinationsData];
  if (filter?.province)    r = r.filter(d => d.province === filter.province);
  if (filter?.district)    r = r.filter(d => d.district === filter.district);
  if (filter?.type)        r = r.filter(d => d.type === filter.type);
  if (filter?.searchQuery) {
    const q = filter.searchQuery.toLowerCase();
    r = r.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  }
  return r;
}

export function getDestinationById(id: string): Destination | undefined {
  return destinationsData.find(d => d.id === id);
}

export function getProvincesWithDestinations(): string[] {
  return [...new Set(destinationsData.map(d => d.province))];
}
