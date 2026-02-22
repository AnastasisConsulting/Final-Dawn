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
  // Extended fields from act JSON files
  actId?: string;
  chapter?: number;
  mission?: string;
  objectives?: string[];
  attribute?: string; // STR/DEX/INT path
  keyCast?: {
    giver?: { name: string; npcKey: string; role: string };
    intermediary?: { name: string; npcKey: string; role: string };
    closer?: { name: string; npcKey: string; role: string };
  };
};

export type BootstrapVoxel = {
  spatialKey1: SpatialKey1;
  spatialKey0: SpatialKey0;
  temporalKey: { s: number; b: number; c: number; p: number };
  faces: {
    "x+": string;
    "x-": string;
    "y+": number[][];
    "y-": string[];
    "z+": any[];
    "z-": string;
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
