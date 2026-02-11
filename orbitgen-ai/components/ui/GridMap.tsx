// components/ui/GridMap.tsx
import React, { useState, useMemo } from 'react';
import { GridVoxel, Civilization } from '../../types';

interface GridMapProps {
  civilization: Civilization;
}

const GridMap: React.FC<GridMapProps> = ({ civilization }) => {
  const [hoveredVoxel, setHoveredVoxel] = useState<GridVoxel | null>(null);

  // Reconstruct the 7x7 grid from the scattered list to ensure visual correctness
  const orderedGrid = useMemo(() => {
    // 1. Create a default empty 7x7 grid (Row-major: index = y * 7 + x)
    // We explicitly type this as GridVoxel[] to avoid TS inferring type 'D' literals
    const grid: GridVoxel[] = Array.from({ length: 49 }, (_, i) => ({
      x: i % 7,
      y: Math.floor(i / 7),
      type: 'D', // Default to Wilderness
      name: 'Wilderness',
      description: 'Untamed territory.',
      parentCity: undefined,
      parentCityRef: undefined
    }));

    // 2. Overwrite with actual data from the API
    if (civilization.grid && Array.isArray(civilization.grid)) {
      civilization.grid.forEach((voxel) => {
        // Validation to ensure it fits in 7x7
        if (typeof voxel.x === 'number' && typeof voxel.y === 'number') {
            const index = voxel.y * 7 + voxel.x;
            if (index >= 0 && index < 49) {
                grid[index] = voxel;
            }
        }
      });
    }
    
    return grid;
  }, [civilization.grid]);

  // Helper to find NPC data for Type A voxels
  const getCityDetails = (voxel: GridVoxel) => {
    if (voxel.type !== 'A') return null;
    
    const city = civilization.cities.find(c => c.name === voxel.name);
    if (city && city.governor) {
      return {
        governor: city.governor.name,
        lieutenant: city.governor.lieutenants?.[0]?.name || "None"
      };
    }
    return null;
  };

  const getVoxelColor = (type: string) => {
    switch (type) {
      case 'A': return 'bg-cyan-500 hover:bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]'; // City
      case 'B': return 'bg-red-500 hover:bg-red-400 border-red-300';   // Dungeon
      case 'C': return 'bg-amber-500 hover:bg-amber-400 border-amber-300'; // Quest Locale
      case 'D': return 'bg-emerald-900/40 hover:bg-emerald-800 border-emerald-800/20';  // Wilderness
      default: return 'bg-gray-800';
    }
  };

  const getVoxelLabel = (type: string) => {
    switch (type) {
      case 'A': return 'CITY';
      case 'B': return 'DGN';
      case 'C': return 'QST';
      case 'D': return 'WLD';
      default: return '';
    }
  };

  const cityDetails = hoveredVoxel ? getCityDetails(hoveredVoxel) : null;

  return (
    <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/5">
      <h3 className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
        Sector Map (7x7)
      </h3>
      
      <div className="flex flex-col xl:flex-row gap-6">
        {/* The Grid - Now using orderedGrid */}
        <div className="grid grid-cols-7 gap-1 w-fit mx-auto xl:mx-0 p-2 bg-black/60 rounded border border-white/5 shadow-inner">
          {orderedGrid.map((voxel, idx) => (
            <div
              key={`${voxel.x}-${voxel.y}-${idx}`}
              className={`w-6 h-6 md:w-8 md:h-8 rounded-[2px] border ${getVoxelColor(voxel.type)} 
                         cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 relative group flex items-center justify-center`}
              onMouseEnter={() => setHoveredVoxel(voxel)}
            >
              <span className="text-[6px] md:text-[8px] font-bold text-black/60 opacity-0 group-hover:opacity-100">
                {voxel.type}
              </span>
            </div>
          ))}
        </div>

        {/* Info Panel */}
        <div className="flex-1 min-h-[140px] bg-white/5 rounded p-3 border border-white/10 flex flex-col">
          {hoveredVoxel ? (
            <div className="animate-in fade-in slide-in-from-left-2 duration-200 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-black shadow-sm ${getVoxelColor(hoveredVoxel.type).split(' ')[0]}`}>
                  {getVoxelLabel(hoveredVoxel.type)}
                </span>
                <span className="text-[10px] font-mono text-white/40">
                  [{hoveredVoxel.x}, {hoveredVoxel.y}]
                </span>
              </div>
              
              <h4 className="text-sm font-bold text-white mb-1 leading-tight">{hoveredVoxel.name}</h4>
              <p className="text-[10px] text-white/60 mb-2 leading-relaxed flex-grow">{hoveredVoxel.description}</p>
              
              {/* Specific Logic for Type A (City) */}
              {hoveredVoxel.type === 'A' && cityDetails && (
                <div className="mt-auto pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between items-center bg-black/20 px-2 py-1 rounded">
                    <span className="text-[9px] text-cyan-400">GOV</span>
                    <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{cityDetails.governor}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/20 px-2 py-1 rounded">
                    <span className="text-[9px] text-yellow-400">NPC</span>
                    <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{cityDetails.lieutenant}</span>
                  </div>
                </div>
              )}

              {/* Specific Logic for B & C (Parent City) */}
              {(hoveredVoxel.type === 'B' || hoveredVoxel.type === 'C') && hoveredVoxel.parentCity && (
                 <div className="mt-auto text-[9px] text-white/30 pt-1 text-right">
                    via {hoveredVoxel.parentCity}
                 </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/20 text-[10px] italic m-auto">
              HOVER SECTOR TO SCAN
            </div>
          )}
        </div>
      </div>
      
      {/* Mini Legend */}
      <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1 justify-center"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div><span className="text-[8px] text-white/40">CITY</span></div>
        <div className="flex items-center gap-1 justify-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div><span className="text-[8px] text-white/40">DGN</span></div>
        <div className="flex items-center gap-1 justify-center"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div><span className="text-[8px] text-white/40">QUEST</span></div>
        <div className="flex items-center gap-1 justify-center"><div className="w-1.5 h-1.5 bg-emerald-900 rounded-full"></div><span className="text-[8px] text-white/40">WILD</span></div>
      </div>
    </div>
  );
};

export default GridMap;