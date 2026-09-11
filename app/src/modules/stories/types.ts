// Stories Module Types

import type { Province } from '@/types/geography';

export type StoryType = 'legend' | 'historical-fact' | 'curiosity' | 'cultural-narrative';

export interface Story {
  id: string;
  title: string;
  type: StoryType;
  province: Province;
  district?: string;
  locality?: string;
  content: string;
  summary: string;
  period?: {
    start?: string;
    end?: string;
    description?: string;
  };
  relatedLocations?: string[]; // Destination IDs
  relatedCulture?: string[]; // Cultural content IDs
  images: string[];
  author?: string;
  sources?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryFilter {
  province?: Province;
  district?: string;
  type?: StoryType;
  searchQuery?: string;
}

// Helper function to get story type display name
export function getStoryTypeName(type: StoryType): string {
  const names: Record<StoryType, string> = {
    'legend': 'Lenda',
    'historical-fact': 'Facto Histórico',
    'curiosity': 'Curiosidade',
    'cultural-narrative': 'Narrativa Cultural',
  };
  return names[type];
}

// All story types
export const ALL_STORY_TYPES: StoryType[] = [
  'legend',
  'historical-fact',
  'curiosity',
  'cultural-narrative',
];
