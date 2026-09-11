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

  return (
    <>
      {currentView.type === 'home' && (
        <CultureHome
          onBack={onBack}
          onProvinceSelect={province =>
            setCurrentView({ type: 'list', province })
          }
        />
      )}

      {currentView.type === 'list' && (
        <HeritageList
          province={currentView.province}
          onBack={() => setCurrentView({ type: 'home' })}
          onHeritageSelect={heritage =>
            setCurrentView({ type: 'detail', heritage, province: currentView.province })
          }
        />
      )}

      {currentView.type === 'detail' && (
        <HeritageDetail
          heritage={currentView.heritage}
          onBack={() =>
            setCurrentView({ type: 'list', province: currentView.province })
          }
        />
      )}
    </>
  );
}
