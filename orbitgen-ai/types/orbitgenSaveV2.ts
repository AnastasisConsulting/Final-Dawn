// PATH: types/orbitgenSaveV2.ts
import { TransformData, PlanetIds, PlanetMetadata } from '../types';

export interface OrbitgenSaveV2 {
  worldId: string;
  seed: TransformData | null;
  phaseStatus: {
    phase1Done: boolean;
    phase2DoneByCiv: [boolean, boolean, boolean];
    phase3DoneByCiv: [boolean, boolean, boolean];
  };
  partialData: {
    // Canonical path to texture (e.g., "assets/textures/albedo.png")
    // NO blob URLs allowed here.
    renderSpec: {
        texturePath: string | null;
        atmosphereColor: string;
        rotationSpeed: number;
    };
    assetsManifest: Record<string, string>; // virtualPath -> storageKey (or metadata)
    
    ids?: PlanetIds;
    name: string;
    description: string;
    
    metadata?: PlanetMetadata | null; // Civilizations, History, etc.
  };
  validationErrors: string[];
}
