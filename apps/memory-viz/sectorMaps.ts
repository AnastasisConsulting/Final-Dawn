import { SectorMap, SectorMapCell, SectorMapCivilization, SectorMapNode } from './types';

type SectorMapModule = { default: SectorMap };

const sectorMapLoaders = import.meta.glob('../../Galaxies_Folder/**/sector_map.json');
const sectorMapKeys = Object.keys(sectorMapLoaders);

export type WorldIndices = { g: number; s: number; o: number };

export const parseWorldId = (worldId: string): WorldIndices | null => {
  const match = /G(\d+)-S(\d+)-O(\d+)/i.exec(worldId);
  if (!match) return null;
  return {
    g: Number(match[1]),
    s: Number(match[2]),
    o: Number(match[3])
  };
};

export const formatCivName = (civId: string, index: number) => {
  if (civId && civId.trim().length > 0) {
    return civId.replace(/_/g, ' ');
  }
  return `Civilization ${index + 1}`;
};

export const loadSectorMapByNames = async (
  galaxyName: string,
  systemName: string,
  objectName: string
) => {
  const suffix = `/${galaxyName}/${systemName}/${objectName}/sector_map.json`;
  const key = sectorMapKeys.find((candidate) => candidate.endsWith(suffix));
  if (!key) {
    throw new Error(`Sector map not found for ${suffix}`);
  }
  const mod = (await sectorMapLoaders[key]()) as SectorMap | SectorMapModule;
  return 'default' in mod ? mod.default : mod;
};

export const getCellAt = (cells: SectorMapCell[], x: number, y: number) => {
  return cells.find((cell) => cell.x === x && cell.y === y) || null;
};

export const getNodeAt = (nodes: SectorMapNode[] | undefined, x: number, y: number) => {
  if (!nodes) return null;
  return nodes.find((node) => node.x === x && node.y === y) || null;
};

export const getCivById = (civilizations: SectorMapCivilization[], civId: string | null) => {
  if (!civId) return null;
  return civilizations.find((civ) => civ.civId === civId) || null;
};
