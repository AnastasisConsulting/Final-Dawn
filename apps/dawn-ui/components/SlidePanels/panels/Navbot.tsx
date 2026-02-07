// Final_Dawn_of_Eideus/apps/dawn-ui/components/SlidePanels/panels/Navbot.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { useKernel } from '../../../hooks/useKernel';
import { Minimap } from '../../Features/Minimap';
import { Orbit, Building2 } from 'lucide-react';

export const NavBot: React.FC = () => {
  const { state, dispatch } = useKernel();
  const worldData = state.activeWorldBundle;
  
  // State for specific requested logic
  const [activeCivIdx, setActiveCivIdx] = useState(0);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);

  // Read civilizations from sector_map.json (via activeWorldBundle)
  const civilizations = useMemo(() => worldData?.sectorMap?.civilizations || worldData?.map?.civilizations || [], [worldData]);
  
  // Constraint: 3 buttons for civilizations, 1 displayed at a time
  const displayCivs = useMemo(() => civilizations.slice(0, 3), [civilizations]);
  const activeCiv = displayCivs[activeCivIdx];

  // Constraint: 3 city buttons for the active civilization
  const cityButtons = useMemo(() => {
    if (!activeCiv) return [];
    return activeCiv.nodes.filter((n: any) => n.kind === 'CITY').slice(0, 3);
  }, [activeCiv]);

  const activeCityRegions = useMemo(() => {
    if (!activeCiv || !activeCityId) return [];
    return activeCiv.nodes.filter((n: any) => n.ownerCityId === activeCityId);
  }, [activeCiv, activeCityId]);

  // Handle auto-selection of first city when civ changes
  useEffect(() => {
    if (cityButtons.length > 0 && !activeCityId) {
      setActiveCityId(cityButtons[0].id);
    }
  }, [cityButtons, activeCityId]);

  const handleCivChange = (idx: number) => {
    setActiveCivIdx(idx);
    setActiveCityId(null); // Reset city selection
    const civ = displayCivs[idx];
    if (civ) {
      dispatch({
        type: 'SET_NAV_CONTEXT',
        payload: {
          civId: civ.civId,
          civIndex: civ.index,
          cityId: undefined,
          cityIndex: undefined,
          locId: undefined,
          locIndex: undefined,
        },
      });
    }
  };

  const handleSpaceFlight = () => {
    dispatch({ type: 'SET_WARP_STATE', active: true });
  };

  useEffect(() => {
    if (!activeCiv) return;
    const cityId = activeCityId || (cityButtons[0]?.id ?? undefined);
    const cityIndex = cityId ? Math.max(0, cityButtons.findIndex((c: any) => c.id === cityId)) : undefined;
    const firstRegion = activeCityRegions[0];
    dispatch({
      type: 'SET_NAV_CONTEXT',
      payload: {
        civId: activeCiv.civId,
        civIndex: activeCiv.index,
        cityId,
        cityIndex,
        locId: firstRegion?.id,
        locIndex: firstRegion ? activeCityRegions.indexOf(firstRegion) : undefined,
      },
    });
  }, [activeCiv, activeCityId, activeCityRegions, cityButtons, dispatch]);

  return (
    <div className="flex flex-col h-full bg-[#020205]/95 border-b border-cyan-900/40 font-mono overflow-hidden shadow-inner">
      <div className="p-2 bg-cyan-950/10 flex justify-between items-center border-b border-cyan-800/30">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpaceFlight}
            className="w-8 h-8 flex items-center justify-center bg-cyan-950/40 border border-cyan-500/50 hover:bg-cyan-500/20 group rounded-sm"
          >
            <Orbit size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
          </button>
          
          <div className="flex flex-col">
            <span className="text-[9px] text-cyan-300 tracking-[0.4em] uppercase font-bold">Nav_Implant</span>
            <span className="text-[7px] text-cyan-700/80 uppercase">Sector_{worldData?.worldId || 'NULL'}</span>
          </div>
        </div>
      </div>

      {/* Civilization Selector (Max 3 buttons) */}
      <div className="grid grid-cols-3 gap-1 p-2 bg-black/40 border-b border-cyan-900/30">
        {displayCivs.map((civ, idx) => (
          <button
            key={civ.civId}
            onClick={() => handleCivChange(idx)}
            className={`text-[8px] py-1 border transition-all uppercase tracking-tighter ${
              activeCivIdx === idx 
                ? 'bg-cyan-500 text-black border-cyan-400 font-bold' 
                : 'border-cyan-900/50 text-cyan-700 hover:border-cyan-500'
            }`}
          >
            {civ.civId}
          </button>
        ))}
      </div>

      {/* City Selector (Max 3 buttons for active Civ) */}
      <div className="flex gap-1 px-2 py-1 bg-cyan-950/5 border-b border-cyan-900/20">
        {cityButtons.map((city: any) => (
          <button
            key={city.id}
            onClick={() => setActiveCityId(city.id)}
            className={`flex-1 text-[8px] py-1 flex items-center justify-center gap-1 border transition-all ${
              activeCityId === city.id
                ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-200'
                : 'border-transparent text-cyan-800 hover:text-cyan-600'
            }`}
          >
            <Building2 size={10} />
            {city.id}
          </button>
        ))}
      </div>

      {/* Constraint: Map only displays 1 city and 7 regional locations at a time */}
      <div className="relative flex-grow overflow-hidden perspective-[1000px] p-4">
        <Minimap 
          activeCiv={activeCiv}
          activeCityId={activeCityId}
          selectedLocationId={state.navContext.locId}
          onLocationSelect={(locId, locIndex) => {
            dispatch({
              type: 'SET_NAV_CONTEXT',
              payload: {
                locId,
                locIndex,
              },
            });
          }}
        />
      </div>

      <div className="p-3 bg-black/60 border-t border-cyan-900/30">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <div className="text-[7px] text-cyan-900 uppercase font-black">Lattice_ID</div>
            <div className="text-[10px] text-cyan-100">{activeCityId || 'STANDBY'}</div>
          </div>
          <div className="text-[9px] text-cyan-500/60 animate-pulse font-black tracking-widest uppercase">
            {activeCiv?.civId || 'Scanning'}
          </div>
        </div>
      </div>
    </div>
  );
};
