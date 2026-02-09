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
  onFastTravel?: (spatial: { g: number; s: number; o: number; c: number; ct: number; r: number }, locationName: string) => void;
  onOpenMemoryViz?: (spatial: { g: number; s: number; o: number; c: number; ct: number; r: number }, locationName: string) => void;
}

export const SimVizRoot: React.FC<SimVizRootProps> = ({
  embedded = false,
  ambientAudio,
  overlay,
  onStateChange,
  onSelectionChange,
  onFastTravel,
  onOpenMemoryViz,
}) => {
  // ... (state init) ...
  const [appState, setAppState] = useState<UniverseState>({
    currentLevel: ViewLevel.UNIVERSE,
    selectedGalaxyId: null,
    selectedSystemId: null,
    selectedPlanetId: null,
    selectedCityId: null,
    selectedDistrictId: null,
  });

  const allowAudio = ambientAudio ?? !embedded;

  // ... (rest of logic) ...

  const getLoreForEntity = (entity: EntityBase | null, level: ViewLevel) => {
    // 1. If we have a selected planet, try to find its specific lore book
    //    The LORE_DATA is now a Record<string, any> keyed by world_id (e.g. "G1-S1-O1")
    const planetId = appState.selectedPlanetId;
    const planetLore = planetId ? LORE_DATA[planetId] : null;

    if (level === ViewLevel.SURFACE && planetLore) {
      return {
        name: planetLore.meta.name,
        description: planetLore.global_history,
        type: 'Planet',
        ...planetLore
      };
    }

    // Handle System View - Use entity data from UNIVERSE_DATA
    if (level === ViewLevel.SYSTEM && entity) {
      return {
        name: entity.name,
        description: entity.description || 'System data unavailable.',
        type: 'Star System',
        ...entity
      };
    }

    if (!entity || !planetId || !planetLore) return null;

    try {
      // Parse IDs to find indices in the JSON structure
      // Expected ID format: "G1-S1-O1-C1-CT1" -> Civ Index 0, City Index 0
      // "G1-S1-O1-C1-CT1-R1" -> District Index 0

      if (level === ViewLevel.CITY && appState.selectedCityId) {
        // Extract indices from ID: ...-C{civ}-CT{city}
        // Note: The ID uses 1-based indexing for display (C1, CT1), so we subtract 1? 
        // Or verify logic. The previous logic used parsed integers directly.
        // Let's assume the ID generation matches the array indices or follows a pattern.
        // Previous logic: parts[0] (civ), parts[1] (city).

        const cMatch = appState.selectedCityId.match(/_c(\d+)-ct(\d+)/) || appState.selectedCityId.match(/-C(\d+)-CT(\d+)/i);
        // The regex in previous code was: split('_c')[1].split('-ct')
        // Let's stick to robust parsing if possible, or keep existing logic if it worked for S-11.
        // Existing: split('_c')[1] -> "1-ct1" -> split('-ct') -> ["1", "1"]
        // Wait, if it's 0-indexed in code but 1-based in ID?
        // SimVizRoot generation logic usually matches.

        // Let's keep the existing split logic but safeguard it.
        // IDs in this app seem to be constructed as: `${planetId}_c${civIdx}-ct${cityIdx}`

        const parts = appState.selectedCityId.split('_c')[1]?.split('-ct');
        if (!parts || parts.length < 2) return null;

        const civIdx = parseInt(parts[0]);
        const cityIdx = parseInt(parts[1]);

        const cityData = planetLore.civilizations?.[civIdx]?.cities?.[cityIdx];
        return cityData ? { ...cityData, type: 'Urban Center' } : null;
      }

      if (level === ViewLevel.DISTRICT && appState.selectedDistrictId && appState.selectedCityId) {
        const parts = appState.selectedCityId.split('_c')[1]?.split('-ct');
        if (!parts || parts.length < 2) return null;

        const civIdx = parseInt(parts[0]);
        const cityIdx = parseInt(parts[1]);

        const districtPart = appState.selectedDistrictId.split('-r')[1];
        const distIdx = parseInt(districtPart);

        const cityData = planetLore.civilizations?.[civIdx]?.cities?.[cityIdx];
        const districtData = cityData?.districts?.[distIdx];
        return districtData ? { ...districtData, type: 'District' } : null;
      }
    } catch (e) { console.error("Lore Lookup Error", e); }
    return null;
  };

  // ... useMemo for currentEntity ...
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


  // ... useMemo for sidePanelData ...
  const sidePanelData = useMemo(() => {
    return getLoreForEntity(currentEntity, appState.currentLevel);
  }, [appState, currentEntity]);

  // ... breadcrumbs ...
  const breadcrumbs = useMemo(() => {
    const parts = [];
    if (appState.selectedGalaxyId) parts.push(appState.selectedGalaxyId);
    if (appState.selectedSystemId) parts.push(appState.selectedSystemId.split('-')[1]);
    if (appState.selectedPlanetId) parts.push(appState.selectedPlanetId.split('-')[2]);
    if (appState.selectedCityId) parts.push(`CT${appState.selectedCityId.split('-ct')[1]}`);
    if (appState.selectedDistrictId) parts.push(`D${appState.selectedDistrictId.split('-r')[1]}`);
    return `[${parts.join('-') || 'UNIVERSE'}]`.toUpperCase();
  }, [appState]);

  // ... handlers ...

  const handleSelectGalaxy = (id: string) => { setAppState(prev => ({ ...prev, selectedGalaxyId: id, currentLevel: ViewLevel.GALAXY })); };
  const handleSelectSystem = (id: string) => { setAppState(prev => ({ ...prev, selectedSystemId: id, currentLevel: ViewLevel.SYSTEM })); };
  const handleSelectPlanet = (id: string) => { setAppState(prev => ({ ...prev, selectedPlanetId: id, currentLevel: ViewLevel.SURFACE })); };
  const handleSelectCity = (id: string) => { setAppState(prev => ({ ...prev, selectedCityId: id, currentLevel: ViewLevel.CITY })); };
  const handleSelectDistrict = (id: string) => { setAppState(prev => ({ ...prev, selectedDistrictId: id, currentLevel: ViewLevel.DISTRICT })); };

  const handleBack = () => {
    // ... existing back logic ...
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

  // Helper to construct spatial object
  const getSpatial = () => {
    let g = 1; if (appState.selectedGalaxyId) { const m = appState.selectedGalaxyId.match(/G(\d+)/); if (m) g = parseInt(m[1]) || 1; }
    let s = 1; if (appState.selectedSystemId) { const m = appState.selectedSystemId.match(/S(\d+)/); if (m) s = parseInt(m[1]) || 1; }
    let o = 1; if (appState.selectedPlanetId) { const m = appState.selectedPlanetId.match(/O(\d+)/); if (m) o = parseInt(m[1]) || 1; }
    let c = 1, ct = 1; if (appState.selectedCityId) { const m1 = appState.selectedCityId.match(/_c(\d+)/); const m2 = appState.selectedCityId.match(/-ct(\d+)/); if (m1) c = parseInt(m1[1]) + 1; if (m2) ct = parseInt(m2[1]) + 1; }
    let r = 1; if (appState.selectedDistrictId) { const m = appState.selectedDistrictId.match(/-r(\d+)/); if (m) r = parseInt(m[1]) + 1; }
    return { g, s, o, c, ct, r };
  };

  const handleFastTravel = () => {
    if (!onFastTravel) return;
    const spatial = getSpatial();
    const locationName = sidePanelData?.name || 'Unknown Location';
    onFastTravel(spatial, locationName);
  };

  const handleMemoryViz = () => {
    if (!onOpenMemoryViz) return;
    const spatial = getSpatial();
    const locationName = sidePanelData?.name || 'Unknown Location';
    onOpenMemoryViz(spatial, locationName);
  };

  const isSplitView = appState.currentLevel === ViewLevel.CITY || appState.currentLevel === ViewLevel.DISTRICT;

  useEffect(() => { onStateChange?.(appState); }, [appState, onStateChange]);
  useEffect(() => { onSelectionChange?.(currentEntity, appState.currentLevel, appState); }, [currentEntity, appState.currentLevel, appState, onSelectionChange]);

  return (
    <div className={`relative w-full ${embedded ? 'h-full' : 'h-screen'} overflow-hidden bg-slate-900 text-white flex`}>
      {isSplitView && (
        <LorePanel
          data={sidePanelData}
          title={sidePanelData?.name || 'Unknown'}
          type={sidePanelData?.type || 'Data'}
          onFastTravel={onFastTravel ? handleFastTravel : undefined}
          onBack={handleBack}
          onOpenMemoryViz={onOpenMemoryViz ? handleMemoryViz : undefined}
        />
      )}

      <div className={`relative h-full transition-all duration-500 ${isSplitView ? 'w-2/3' : 'w-full'}`}>
        <UIOverlay
          currentLevel={appState.currentLevel}
          selectedEntity={currentEntity}
          onBack={handleBack}
          breadcrumbs={sidePanelData?.name ? sidePanelData.name.toUpperCase() : breadcrumbs}
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
        {overlay}
        <div className="scanline" />
      </div>
    </div>
  );
};
