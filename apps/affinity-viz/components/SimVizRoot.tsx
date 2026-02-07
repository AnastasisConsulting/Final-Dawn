import React, { useState, useMemo, useEffect } from 'react';
import { UNIVERSE_DATA } from '../constants';
import { LORE_DATA } from '../lore_data';
import { UIOverlay } from './Layout/UIOverlay';
import { LorePanel } from './Layout/LorePanel';
import { SceneContainer } from './Scene/SceneContainer';
import { UniverseState, ViewLevel, EntityBase } from '../types';

export interface SimVizRootProps {
  embedded?: boolean;
  ambientAudio?: boolean;
  overlay?: React.ReactNode;
  onStateChange?: (state: UniverseState) => void;
  onSelectionChange?: (entity: EntityBase | null, level: ViewLevel, state: UniverseState) => void;
}

export const SimVizRoot: React.FC<SimVizRootProps> = ({
  embedded = false,
  ambientAudio,
  overlay,
  onStateChange,
  onSelectionChange,
}) => {
  const [appState, setAppState] = useState<UniverseState>({
    currentLevel: ViewLevel.UNIVERSE,
    selectedGalaxyId: null,
    selectedSystemId: null,
    selectedPlanetId: null,
    selectedCityId: null,
    selectedDistrictId: null,
  });

  const allowAudio = ambientAudio ?? !embedded;

  const getLoreForEntity = (entity: EntityBase | null, level: ViewLevel) => {
    if (!entity || !appState.selectedPlanetId) return null;
    try {
      if (level === ViewLevel.CITY && appState.selectedCityId) {
        const parts = appState.selectedCityId.split('_c')[1].split('-ct');
        const civIdx = parseInt(parts[0]);
        const cityIdx = parseInt(parts[1]);
        const cityData = LORE_DATA.civilizations[civIdx]?.cities[cityIdx];
        return cityData ? { ...cityData, type: 'Urban Center' } : null;
      }

      if (level === ViewLevel.DISTRICT && appState.selectedDistrictId && appState.selectedCityId) {
        const parts = appState.selectedCityId.split('_c')[1].split('-ct');
        const civIdx = parseInt(parts[0]);
        const cityIdx = parseInt(parts[1]);

        const districtPart = appState.selectedDistrictId.split('-r')[1];
        const distIdx = parseInt(districtPart);

        const cityData = LORE_DATA.civilizations[civIdx]?.cities[cityIdx];
        const districtData = cityData?.districts[distIdx];
        return districtData ? { ...districtData, type: 'District' } : null;
      }
    } catch (e) {
      console.error('Failed to map lore data', e);
    }
    return null;
  };

  const currentEntity: EntityBase | null = useMemo(() => {
    if (appState.currentLevel === ViewLevel.UNIVERSE) return null;

    const gal = UNIVERSE_DATA.find(g => g.id === appState.selectedGalaxyId);
    if (appState.currentLevel === ViewLevel.GALAXY) return gal || null;

    const sys = gal?.systems.find(s => s.id === appState.selectedSystemId);
    if (appState.currentLevel === ViewLevel.SYSTEM) return sys || null;

    const planet = sys?.planets.find(p => p.id === appState.selectedPlanetId);
    if (appState.currentLevel >= ViewLevel.SURFACE) return planet || null;

    return null;
  }, [appState]);

  const sidePanelData = useMemo(() => {
    return getLoreForEntity(currentEntity, appState.currentLevel);
  }, [appState, currentEntity]);

  const breadcrumbs = useMemo(() => {
    const parts = [];
    if (appState.selectedGalaxyId) parts.push(appState.selectedGalaxyId);
    if (appState.selectedSystemId) parts.push(appState.selectedSystemId.split('-')[1]);
    if (appState.selectedPlanetId) parts.push(appState.selectedPlanetId.split('-')[2]);
    if (appState.selectedCityId) parts.push(`CT${appState.selectedCityId.split('-ct')[1]}`);
    if (appState.selectedDistrictId) parts.push(`D${appState.selectedDistrictId.split('-r')[1]}`);
    return `[${parts.join('-') || 'UNIVERSE'}]`.toUpperCase();
  }, [appState]);

  const handleSelectGalaxy = (id: string) => {
    setAppState(prev => ({ ...prev, selectedGalaxyId: id, currentLevel: ViewLevel.GALAXY }));
  };

  const handleSelectSystem = (id: string) => {
    setAppState(prev => ({ ...prev, selectedSystemId: id, currentLevel: ViewLevel.SYSTEM }));
  };

  const handleSelectPlanet = (id: string) => {
    setAppState(prev => ({ ...prev, selectedPlanetId: id, currentLevel: ViewLevel.SURFACE }));
  };

  const handleSelectCity = (id: string) => {
    setAppState(prev => ({ ...prev, selectedCityId: id, currentLevel: ViewLevel.CITY }));
  };

  const handleSelectDistrict = (id: string) => {
    setAppState(prev => ({ ...prev, selectedDistrictId: id, currentLevel: ViewLevel.DISTRICT }));
  };

  const handleBack = () => {
    setAppState(prev => {
      if (prev.currentLevel === ViewLevel.DISTRICT) {
        return { ...prev, currentLevel: ViewLevel.CITY, selectedDistrictId: null };
      }
      if (prev.currentLevel === ViewLevel.CITY) {
        return { ...prev, currentLevel: ViewLevel.SURFACE, selectedCityId: null };
      }
      if (prev.currentLevel === ViewLevel.SURFACE) {
        return { ...prev, currentLevel: ViewLevel.SYSTEM, selectedPlanetId: null };
      }
      if (prev.currentLevel === ViewLevel.SYSTEM) {
        return { ...prev, currentLevel: ViewLevel.GALAXY, selectedSystemId: null };
      }
      if (prev.currentLevel === ViewLevel.GALAXY) {
        return { ...prev, currentLevel: ViewLevel.UNIVERSE, selectedGalaxyId: null };
      }
      return prev;
    });
  };

  const isSplitView = appState.currentLevel === ViewLevel.CITY || appState.currentLevel === ViewLevel.DISTRICT;

  useEffect(() => {
    onStateChange?.(appState);
  }, [appState, onStateChange]);

  useEffect(() => {
    onSelectionChange?.(currentEntity, appState.currentLevel, appState);
  }, [currentEntity, appState.currentLevel, appState, onSelectionChange]);

  return (
    <div className={`relative w-full ${embedded ? 'h-full' : 'h-screen'} overflow-hidden bg-slate-900 text-white flex`}>
      <div className={`relative h-full transition-all duration-500 ${isSplitView ? 'w-2/3' : 'w-full'}`}>
        <UIOverlay
          currentLevel={appState.currentLevel}
          selectedEntity={currentEntity}
          onBack={handleBack}
          breadcrumbs={breadcrumbs}
          ambientAudio={allowAudio}
        />
        <SceneContainer
          state={appState}
          data={UNIVERSE_DATA}
          actions={{
            selectGalaxy: handleSelectGalaxy,
            selectSystem: handleSelectSystem,
            selectPlanet: handleSelectPlanet,
            selectCity: handleSelectCity,
            selectDistrict: handleSelectDistrict,
          }}
        />
      </div>

      {isSplitView && (
        <LorePanel
          data={sidePanelData}
          title={sidePanelData?.name || 'Unknown'}
          type={sidePanelData?.type || 'Data'}
        />
      )}

      {overlay}

      <div className="scanline" />
    </div>
  );
};
