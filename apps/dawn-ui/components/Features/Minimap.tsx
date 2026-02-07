// Final_Dawn_of_Eideus/apps/dawn-ui/components/Features/Minimap.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useKernel } from '../../hooks/useKernel';

interface MinimapProps {
  activeCiv: any;
  activeCityId: string | null;
  selectedLocationId?: string;
  onLocationSelect?: (locationId: string, locationIndex: number) => void;
}

type TopographySet = {
  version: string;
  worldId: string;
  gridSize: number;
  civs: { civId: string; seed: string; heightmap: number[] }[];
};

const HEIGHT_COLORS = [
  '#0a1a2a',
  '#0b2d3a',
  '#0f3f4a',
  '#16565a',
  '#1d6d67',
  '#2a8068',
  '#3b8f62',
  '#4e9b5a',
  '#6faa5b',
  '#90b85d'
];

const pickHeightColor = (value: number) => {
  const idx = Math.min(HEIGHT_COLORS.length - 1, Math.max(0, Math.floor(value * (HEIGHT_COLORS.length - 1))));
  return HEIGHT_COLORS[idx];
};

export const Minimap: React.FC<MinimapProps> = ({ activeCiv, activeCityId, selectedLocationId, onLocationSelect }) => {
  const { state } = useKernel();
  const [topography, setTopography] = useState<TopographySet | null>(null);
  const gridSize = topography?.gridSize || 7; // Based on sector_map.json
  const objectKey = state.address.full;

  const mapData = useMemo(() => {
    if (!activeCiv || !activeCityId) {
      return { currentCity: null, regions: [], otherCities: [], edges: [] };
    }

    // 1. Get the current city node
    const currentCity = activeCiv.nodes.find((n: any) => n.id === activeCityId);
    
    // 2. Filter regional locations owned by this city (exactly 7 per city)
    const regions = activeCiv.nodes.filter((n: any) => n.ownerCityId === activeCityId);
    
    // 3. Get other cities in the same civ for edge display
    const otherCities = activeCiv.nodes.filter((n: any) => n.kind === 'CITY' && n.id !== activeCityId);

    // 4. Get edges connecting the current city to regions or other cities
    const relevantEdges = activeCiv.edges.filter((e: any) => 
      e.from === activeCityId || e.to === activeCityId
    );

    return {
      currentCity,
      regions,
      otherCities,
      edges: relevantEdges
    };
  }, [activeCiv, activeCityId]);

  useEffect(() => {
    if (!objectKey) return;
    if (!activeCiv?.civId) return;
    const directory = (state.activeWorldBundle as any)?.directory || '';
    let galaxy = '';
    let system = '';
    let object = '';
    if (directory) {
      const parts = directory.split('/').filter(Boolean);
      [galaxy, system, object] = parts;
    }
    if (!galaxy || !system || !object) return;
    const url = `/api/topography?galaxy=${encodeURIComponent(galaxy)}&system=${encodeURIComponent(system)}&object=${encodeURIComponent(object)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.civs) setTopography(data as TopographySet);
      })
      .catch(() => null);
  }, [objectKey, activeCiv?.civId, state.activeWorldBundle]);

  const getCoord = (val: number) => `${(val / (gridSize - 1)) * 100}%`;
  const heightmap = useMemo(() => {
    if (!topography || !activeCiv) return null;
    const entry = topography.civs.find((c) => c.civId === activeCiv.civId);
    return entry?.heightmap || null;
  }, [topography, activeCiv]);

  return (
    <div className="w-full h-full aspect-square bg-[#020205] border border-cyan-900/60 rounded-sm relative shadow-[inset_0_0_20px_rgba(0,255,255,0.05)] overflow-hidden">
      <svg className="w-full h-full">
        {/* Topography Layer */}
        {heightmap && (
          <g style={{ filter: 'url(#soften)' }}>
            {heightmap.map((value, idx) => {
              const x = idx % gridSize;
              const y = Math.floor(idx / gridSize);
              return (
                <rect
                  key={`cell-${idx}`}
                  x={`${(x / gridSize) * 100}%`}
                  y={`${(y / gridSize) * 100}%`}
                  width={`${100 / gridSize}%`}
                  height={`${100 / gridSize}%`}
                  fill={pickHeightColor(value)}
                  opacity={0.9}
                />
              );
            })}
          </g>
        )}

        {/* Edges Layer */}
        {mapData.edges.map((edge: any) => {
          const fromNode = activeCiv.nodes.find((n: any) => n.id === edge.from);
          const toNode = activeCiv.nodes.find((n: any) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          return (
            <line
              key={edge.id}
              x1={getCoord(fromNode.x)}
              y1={getCoord(fromNode.y)}
              x2={getCoord(toNode.x)}
              y2={getCoord(toNode.y)}
              className={`stroke-cyan-500/30 ${edge.kind === 'PATH_A' ? 'stroke-dashed' : ''}`}
              strokeWidth="1"
              strokeDasharray={edge.kind === 'PATH_A' ? "2,2" : "0"}
            />
          );
        })}

        {/* Other Cities (Connection points) */}
        {mapData.otherCities.map((city: any) => (
          <circle
            key={city.id}
            cx={getCoord(city.x)}
            cy={getCoord(city.y)}
            r="3"
            className="fill-cyan-900 stroke-cyan-500/50"
          />
        ))}

        {/* Regional Locations (Waypoints) */}
        {mapData.regions.map((node: any) => (
          <g key={node.id}>
            <circle
              cx={getCoord(node.x)}
              cy={getCoord(node.y)}
              r="2"
              className={`fill-cyan-400 cursor-pointer ${selectedLocationId === node.id ? 'animate-ping' : 'animate-pulse'}`}
              onClick={() => onLocationSelect?.(node.id, mapData.regions.indexOf(node))}
            />
            <text
              x={getCoord(node.x)}
              y={getCoord(node.y)}
              dx="5"
              dy="3"
              className="fill-cyan-600 text-[6px] font-bold uppercase select-none pointer-events-none"
            >
              {node.id}
            </text>
          </g>
        ))}

        {/* Active City Node */}
        {mapData.currentCity && (
          <g>
            <rect
              x={`calc(${getCoord(mapData.currentCity.x)} - 4px)`}
              y={`calc(${getCoord(mapData.currentCity.y)} - 4px)`}
              width="8"
              height="8"
              className="fill-cyan-500 stroke-white stroke-[1]"
            />
            <circle
              cx={getCoord(mapData.currentCity.x)}
              cy={getCoord(mapData.currentCity.y)}
              r="12"
              className="stroke-cyan-500/20 fill-none animate-ping"
            />
          </g>
        )}

        <defs>
          <filter id="soften">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
      </svg>

      {/* Map Overlay Labels */}
      <div className="absolute top-2 right-2 text-[8px] text-cyan-700 pointer-events-none">
        ACTIVE_CIV: {activeCiv?.civId}
      </div>
    </div>
  );
};
