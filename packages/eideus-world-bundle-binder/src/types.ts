// /src/types.ts
export type WorldId = string;

export type SpatialKey1 = { g: number; s: number; o: number; c: number; ct: number; r: number };
export type SpatialKey0 = { g: number; s: number; o: number; c: number; ct: number; r: number };

export type NavCell = { civIndex: number; x: number; y: number };

export type NavNodeBinding = {
  worldId: WorldId;
  civIndex: number;
  nodeId: string;
  nodeKind: string;
  cell: NavCell;
  label: string;
  loreKey: string;
  spatialKey1: SpatialKey1 | null; // only when exact C/CT/R are known
  spatialKey0: SpatialKey0 | null;
  placeTag: string | null; // e.g. place:G1-S1-O1-C1-CT2 or place:G1-S1-O1
  tags: string[];
};

export type EntityBinding = {
  worldId: WorldId;
  entityId: string;
  name: string;
  role?: string | null;
  title?: string | null;
  spatialKey1: SpatialKey1 | null; // only when exact C/CT/R are known
  spatialKey0: SpatialKey0 | null;
  placeTag: string | null;
  loreKey: string | null;
  tags: string[];
  characterCard?: any;
};

export type QuestBinding = {
  worldId: WorldId;
  questId: string;
  title?: string | null;
  npcIds: string[];
  spatialTargets1: SpatialKey1[];
  spatialTargets0: SpatialKey0[];
  tags: string[];
};

export type BootstrapVoxel = {
  spatialKey1: SpatialKey1;
  spatialKey0: SpatialKey0;
  temporalKey: { s: number; b: number; c: number; p: number };
  faces: {
    xPlus: string;
    xMinus: string;
    yPlus: number[][]; // embeddings placeholder
    yMinus: string[];  // tags
    zPlus: any[];      // entity cards
    zMinus: string;    // loreKey
  };
};

export type BinderOutputs = {
  worldId: WorldId;
  generatedAtUnixMs: number;
  warnings: string[];
  nav_bindings: NavNodeBinding[];
  entity_index: EntityBinding[];
  quest_bindings: QuestBinding[];
  bootstrap_voxels: BootstrapVoxel[];
};
