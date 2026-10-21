import type { Destination, DestinationFilter } from './types';
import { getDestinations, getDestinationById } from './data';

interface ApiResponse<T> { data?: T; error?: string; }
function ok<T>(data: T): ApiResponse<T> { return { data }; }

export const destinationsApi = {
  getDestinations: async (filter?: DestinationFilter): Promise<ApiResponse<{ success: boolean; data: Destination[] }>> => {
    return ok({ success: true, data: getDestinations(filter) });
  },
  getDestinationById: async (id: string): Promise<ApiResponse<{ success: boolean; data: Destination }>> => {
    const dest = getDestinationById(id);
    if (!dest) return { error: 'Destino não encontrado.' };
    return ok({ success: true, data: dest });
  },
};
