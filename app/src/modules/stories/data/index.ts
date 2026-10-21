import type { Story, StoryFilter } from '../types';
import { storiesData } from './stories';

export function getStories(filter?: StoryFilter): Story[] {
  let results = [...storiesData];
  if (filter?.province)    results = results.filter(s => s.province === filter.province);
  if (filter?.district)    results = results.filter(s => s.district === filter.district);
  if (filter?.type)        results = results.filter(s => s.type === filter.type);
  if (filter?.searchQuery) {
    const q = filter.searchQuery.toLowerCase();
    results = results.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    );
  }
  return results;
}

export function getStoryById(id: string): Story | undefined {
  return storiesData.find(s => s.id === id);
}

/** Províncias únicas que têm histórias */
export function getProvincesWithStories(): string[] {
  return [...new Set(storiesData.map(s => s.province))];
}
