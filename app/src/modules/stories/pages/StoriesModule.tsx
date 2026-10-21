import { useState } from 'react';
import StoriesHome from './StoriesHome';
import LocalityStories from './LocalityStories';
import StoryDetail from './StoryDetail';
import type { Story } from '../types';

type ViewState =
  | { type: 'home' }
  | { type: 'list'; filter: string }
  | { type: 'detail'; story: Story; filter: string };

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  document.querySelectorAll<HTMLElement>('[class*="overflow-y"]').forEach(el => { el.scrollTop = 0; });
}

export default function StoriesModule() {
  const [view, setView] = useState<ViewState>({ type: 'home' });

  return (
    <>
      {view.type === 'home' && (
        <StoriesHome
          onProvinceSelect={filter => { scrollTop(); setView({ type: 'list', filter }); }}
        />
      )}
      {view.type === 'list' && (
        <LocalityStories
          filter={view.filter}
          onBack={() => { scrollTop(); setView({ type: 'home' }); }}
          onStorySelect={story => { scrollTop(); setView({ type: 'detail', story, filter: view.filter }); }}
        />
      )}
      {view.type === 'detail' && (
        <StoryDetail
          story={view.story}
          onBack={() => { scrollTop(); setView({ type: 'list', filter: view.filter }); }}
        />
      )}
    </>
  );
}
