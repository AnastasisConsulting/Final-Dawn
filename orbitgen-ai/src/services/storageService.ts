// PATH: src/services/storageService.ts
import { openDB, IDBPDatabase } from 'idb';
import { Workspace, LibraryEntry, PlanetState, PhaseStatus, TransformData } from '../types';
import { OrbitgenSaveV2 } from '../types/orbitgenSaveV2';
import { normalizePlanetStateIds } from './ids/idEnforcer';
import { validateWorldState } from './validation/worldValidator';

const DB_NAME = 'OrbitGenLibrary';
const WORKSPACE_STORE = 'workspaces';
const ASSET_STORE = 'assets';

// Initialize DB
const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
        db.createObjectStore(WORKSPACE_STORE, { keyPath: 'worldId' });
      }
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        db.createObjectStore(ASSET_STORE); // Key: worldId + assetPath
      }
    },
  });
};

// Helper: Fetch Blob from URL
const fetchBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  return response.blob();
};

export const saveWorkspace = async (workspace: Workspace): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction([WORKSPACE_STORE, ASSET_STORE], 'readwrite');
  
  try {
    // 0. Seed Consistency Guard
    if (workspace.seedData && workspace.seedData.Object_Key !== workspace.worldId) {
      throw new Error(`Integrity Check Failed: Workspace ID (${workspace.worldId}) does not match Linked Seed ID (${workspace.seedData.Object_Key}).`);
    }

    // 1. Normalize IDs before saving
    const normalizedState = normalizePlanetStateIds(workspace.worldId, { ...workspace.planetState });
    
    // 2. Validate (to store errors)
    const validation = validateWorldState(workspace.worldId, normalizedState, workspace.seedData?.Object_Key);

    // 3. Serialize to OrbitgenSaveV2
    // Handle Texture
    let texturePath: string | null = null;
    const assetsManifest: Record<string, string> = {};

    if (normalizedState.textureUrl) {
      if (normalizedState.textureUrl.startsWith('blob:')) {
        const blob = await fetchBlob(normalizedState.textureUrl);
        const assetKey = `${workspace.worldId}/assets/surface_albedo.png`;
        await tx.objectStore(ASSET_STORE).put(blob, assetKey);
        texturePath = "assets/surface_albedo.png";
        assetsManifest["assets/surface_albedo.png"] = assetKey;
      } else if (normalizedState.textureUrl === "assets/surface_albedo.png") {
        texturePath = "assets/surface_albedo.png";
        // Assume asset is already in store
        assetsManifest["assets/surface_albedo.png"] = `${workspace.worldId}/assets/surface_albedo.png`;
      }
    }

    const saveObject: OrbitgenSaveV2 = {
      worldId: workspace.worldId,
      seed: workspace.seedData,
      phaseStatus: {
        phase1Done: workspace.phaseStatus.phase1Done,
        phase2DoneByCiv: workspace.phaseStatus.civ2Done as [boolean,boolean,boolean],
        phase3DoneByCiv: workspace.phaseStatus.civ3Done as [boolean,boolean,boolean]
      },
      partialData: {
        renderSpec: {
          texturePath,
          atmosphereColor: normalizedState.atmosphereColor,
          rotationSpeed: normalizedState.rotationSpeed
        },
        assetsManifest,
        ids: normalizedState.ids,
        name: normalizedState.name,
        description: normalizedState.description,
        metadata: normalizedState.metadata
      },
      validationErrors: validation.errors
    };
    
    // Store as OrbitgenSaveV2 (replacing old Workspace format)
    await tx.objectStore(WORKSPACE_STORE).put(saveObject);
    await tx.done;
    console.log(`Workspace ${workspace.worldId} saved (V2).`);

  } catch (e) {
    console.error("Save failed:", e);
    throw e;
  }
};

export const loadWorkspace = async (worldId: string): Promise<Workspace | null> => {
  const db = await initDB();
  const save = await db.get(WORKSPACE_STORE, worldId);
  
  if (!save) return null;

  // Check if it's V2 or legacy V1
  // V2 has 'partialData', V1 has 'planetState'
  if ((save as any).planetState) {
    // Legacy load
    const legacy = save as Workspace;
    // Rehydrate Assets Logic for Legacy
    if (legacy.planetState.textureUrl === "assets/surface_albedo.png") {
      const assetKey = `${worldId}/assets/surface_albedo.png`;
      const blob = await db.get(ASSET_STORE, assetKey) as Blob;
      if (blob) {
        legacy.planetState.textureUrl = URL.createObjectURL(blob);
      } else {
        legacy.planetState.textureUrl = null;
      }
    }
    return legacy;
  }

  // V2 Load
  const v2 = save as OrbitgenSaveV2;
  const state: PlanetState = {
    textureUrl: null,
    ids: v2.partialData.ids,
    name: v2.partialData.name,
    description: v2.partialData.description,
    atmosphereColor: v2.partialData.renderSpec.atmosphereColor,
    rotationSpeed: v2.partialData.renderSpec.rotationSpeed,
    metadata: v2.partialData.metadata
  };

  // Hydrate Texture
  if (v2.partialData.renderSpec.texturePath) {
    const assetKey = v2.partialData.assetsManifest[v2.partialData.renderSpec.texturePath];
    if (assetKey) {
      const blob = await db.get(ASSET_STORE, assetKey) as Blob;
      if (blob) {
        state.textureUrl = URL.createObjectURL(blob);
      }
    }
  }

  return {
    worldId: v2.worldId,
    seedData: v2.seed,
    lastModified: Date.now(), // or store this in V2? assuming now for simplicity
    phaseStatus: {
      phase1Done: v2.phaseStatus.phase1Done,
      civ2Done: v2.phaseStatus.phase2DoneByCiv,
      civ3Done: v2.phaseStatus.phase3DoneByCiv
    },
    planetState: state
  };
};

export const listWorkspaces = async (): Promise<LibraryEntry[]> => {
  const db = await initDB();
  const all = await db.getAll(WORKSPACE_STORE);
  
  return all.map(entry => {
    // Detect V1 vs V2
    if ((entry as any).planetState) {
       const w = entry as Workspace;
       return {
         worldId: w.worldId,
         name: w.planetState.name,
         lastModified: w.lastModified,
         phaseStatus: w.phaseStatus
       };
    } else {
       const v2 = entry as OrbitgenSaveV2;
       return {
         worldId: v2.worldId,
         name: v2.partialData.name,
         lastModified: Date.now(), // V2 missing timestamp in schema, fallback
         phaseStatus: {
            phase1Done: v2.phaseStatus.phase1Done,
            civ2Done: v2.phaseStatus.phase2DoneByCiv,
            civ3Done: v2.phaseStatus.phase3DoneByCiv
         }
       };
    }
  });
};

export const deleteWorkspace = async (worldId: string): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction([WORKSPACE_STORE, ASSET_STORE], 'readwrite');
  await tx.objectStore(WORKSPACE_STORE).delete(worldId);
  // Delete associated assets (simple assumption: only albedo for now)
  await tx.objectStore(ASSET_STORE).delete(`${worldId}/assets/surface_albedo.png`);
  await tx.done;
};
