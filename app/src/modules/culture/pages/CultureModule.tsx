import { useState } from 'react';
import CultureHome from './CultureHome';
import HeritageList from './HeritageList';
import HeritageDetail from './HeritageDetail';
import type { ProvinceInfo, CulturalHeritage } from '../types';

interface CultureModuleProps {
  onBack: () => void;
  onAuthorPress?: (author: { id: string; name: string; avatar?: string; type: string }) => void;
}

type ViewState =
  | { type: 'home' }
  | { type: 'list'; province: ProvinceInfo }
  | { type: 'detail'; heritage: CulturalHeritage; province: ProvinceInfo };

export default function CultureModule({ onBack, onAuthorPress }: CultureModuleProps) {
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'home' });

  // Garante scroll ao topo em qualquer troca de view —
  // cobre tanto window como o contentor overflow-y-auto do App
  const scrollTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    // Percorre os elementos pai até encontrar o contentor com scroll
    let el: HTMLElement | null = document.activeElement as HTMLElement | null;
    while (el) {
      if (el.scrollTop > 0) { el.scrollTop = 0; }
      el = el.parentElement;
    }
    // Fallback: scroll de todos os elementos com overflow que possam estar no topo
    document.querySelectorAll<HTMLElement>('[class*="overflow-y"]').forEach(el => {
      el.scrollTop = 0;
    });
  };

  return (
    <>
      {currentView.type === 'home' && (
        <CultureHome
          onBack={onBack}
          onProvinceSelect={province => {
            scrollTop();
            setCurrentView({ type: 'list', province });
          }}
        />
      )}

      {currentView.type === 'list' && (
        <HeritageList
          province={currentView.province}
          onBack={() => {
            scrollTop();
            setCurrentView({ type: 'home' });
          }}
          onHeritageSelect={heritage => {
            scrollTop();
            setCurrentView({ type: 'detail', heritage, province: currentView.province });
          }}
        />
      )}

      {currentView.type === 'detail' && (
        <HeritageDetail
          heritage={currentView.heritage}
          onBack={() => {
            scrollTop();
            setCurrentView({ type: 'list', province: currentView.province });
          }}
        />
      )}
    </>
  );
}
