import type { Story } from './types';
import { getStories, getStoryById } from './data';
import type { StoryFilter } from './types';

interface ApiResponse<T> { data?: T; error?: string; }
function ok<T>(data: T): ApiResponse<T> { return { data }; }

export const storiesApi = {
  getStories: async (filter?: StoryFilter): Promise<ApiResponse<{ success: boolean; data: Story[] }>> => {
    return ok({ success: true, data: getStories(filter) });
  },

  getStoryById: async (id: string): Promise<ApiResponse<{ success: boolean; data: Story }>> => {
    const story = getStoryById(id);
    if (!story) return { error: 'História não encontrada.' };
    return ok({ success: true, data: story });
  },
};
