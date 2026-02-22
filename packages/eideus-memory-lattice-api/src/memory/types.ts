// /src/memory/types.ts
export type FaceId = "x+" | "x-" | "y+" | "y-" | "z+" | "z-";

export type SpatialKey = {
  g: number;
  s: number;
  o: number;
  c: number;
  ct: number;
  r: number;
};

export type TemporalKey = {
  saga: number; // s
  book: number; // b
  chapter: number; // c
  page: number; // p
};

export type VoxelId = string;

export type EntityCard = {
  id: string;
  name: string;
  class?: string;
  aliases?: string[];
  meta?: Record<string, unknown>;
};

/**
 * LandmarkCard represents a procedurally discovered location, object, or point of interest.
 * Stored on z- face alongside the loreKey.
 */
export type LandmarkCard = {
  id: string;                    // e.g., "G1-S1-O7-C2-CT2-R4-LOC" or "G1-S1-O7-C2-CT2-R4-OBJ"
  name: string;                  // "The Corroded Terminal"
  type: "LOCATION" | "OBJECT" | "POI" | "STRUCTURE" | "VEHICLE" | "OTHER";
  description?: string;          // Brief description
  tags?: string[];               // Searchable tags
  isProcedural?: boolean;        // true if generated at runtime
  parentLoreKey?: string;        // Links to the lore entry it belongs to
  meta?: Record<string, unknown>;
};

/**
 * LoreContext contains the loreKey reference plus any procedurally discovered landmarks.
 */
export type LoreContext = {
  loreKey: string;               // Reference to immutable lore entry
  landmarks: LandmarkCard[];     // Procedurally discovered landmarks at this location
};

export type EmbeddingVector = number[];

export type VoxelFaces = {
  "x+": string; // summed output (narration)
  "x-": string; // summed input (player text)
  "y+": EmbeddingVector[]; // up to 7 embeddings
  "y-": string[]; // up to 7 tags
  "z+": EntityCard[]; // entities present (NPCs)
  "z-": LoreContext; // lore reference + procedural landmarks
};

export type MemoryVoxel = {
  id: VoxelId;
  spatial: SpatialKey;
  temporal: TemporalKey;
  faces: VoxelFaces;
  createdAtUnixMs: number;
};

export type SpatialPrefix =
  | { g: number }
  | { g: number; s: number }
  | { g: number; s: number; o: number }
  | { g: number; s: number; o: number; c: number }
  | { g: number; s: number; o: number; c: number; ct: number }
  | { g: number; s: number; o: number; c: number; ct: number; r: number };

export type TemporalBounds =
  | { kind: "pageRange"; base: Omit<TemporalKey, "page">; fromPage: number; toPage: number }
  | { kind: "chapterRange"; base: Omit<TemporalKey, "chapter" | "page">; fromChapter: number; toChapter: number }
  | { kind: "exact"; key: TemporalKey };

export type Scope = {
  spatialPrefix?: SpatialPrefix;
  temporalBounds?: TemporalBounds;
  saga?: number;
  book?: number;
  chapter?: number;
};

export type Ranked<T> = { item: T; score: number };

export type NeighborMode = "2D4" | "2D8" | "3D6" | "3D26";

export type ExpansionSpatial = {
  mode: NeighborMode;
  hops: number; // k-hop BFS (>=1)
};

export type ExpansionTemporal =
  | { mode: "plusMinusPages"; n: number }
  | { mode: "chapter"; saga: number; book: number; chapter: number }
  | { mode: "sessionToSession"; saga: number; book: number; chapter: number }
  | { mode: "book"; saga: number; book: number }
  | { mode: "saga"; saga: number };
