// Culture API — usa dados estáticos locais
// Quando o backend implementar os endpoints /api/culture/*, basta trocar as
// funções abaixo por chamadas reais sem alterar nenhum componente.

import type { CulturalHeritage, CulturalHeritageListResponse, ProvinceListResponse } from './types';
import { getProvinces, getHeritage, getHeritageById } from './data';

interface ApiResponse<T> { data?: T; error?: string; }

function ok<T>(data: T): ApiResponse<T> {
  return { data };
}

export const cultureApi = {

  /** Lista de províncias com contagem de patrimónios */
  getProvinces: async (): Promise<ApiResponse<ProvinceListResponse>> => {
    const provinces = getProvinces();
    return ok({ success: true, data: { provinces } });
  },

  /** Lista patrimónios com filtros */
  getHeritageList: async (params?: {
    province?: string;
    district?: string;
    category?: string;
    criteria?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<CulturalHeritageListResponse>> => {
    const limit = params?.limit ?? 20;
    const page  = params?.page  ?? 1;

    const all     = getHeritage(params);
    const total   = all.length;
    const start   = (page - 1) * limit;
    const heritage = all.slice(start, start + limit);

    return ok({
      success: true,
      data: {
        heritage,
        pagination: { page, limit, total, hasNext: start + limit < total },
      },
    });
  },

  /** Detalhes de um único património */
  getHeritageDetail: async (id: string): Promise<ApiResponse<{ success: boolean; data: CulturalHeritage }>> => {
    const item = getHeritageById(id);
    if (!item) return { error: 'Património não encontrado.' };
    return ok({ success: true, data: item });
  },

  /** Toggle favorito — apenas memória (sem backend) */
  toggleFavorite: async (_id: string): Promise<ApiResponse<{ success: boolean; isFavorite: boolean }>> => {
    return ok({ success: true, isFavorite: true });
  },

  /** Incrementar visualizações — silent no-op para dados estáticos */
  incrementView: async (_id: string): Promise<ApiResponse<{ success: boolean }>> => {
    return ok({ success: true });
  },
};
