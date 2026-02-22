// packages/eideus-orchestrator-core/src/types.ts

// --- MEMORY LATTICE TYPES ---
export interface EntityCard {
  id: string;
  name: string;
  class?: string;
  aliases?: string[];
  meta?: Record<string, unknown>;
}

export interface LandmarkCard {
  id: string;
  name: string;
  type: "LOCATION" | "OBJECT" | "POI" | "STRUCTURE" | "VEHICLE" | "OTHER";
  description?: string;
  tags?: string[];
  isProcedural: boolean;
  parentLoreKey?: string;
  meta?: Record<string, unknown>;
}

export interface LoreContext {
  loreKey: string;
  landmarks: LandmarkCard[];
}

export interface VoxelFaces {
  "x+": string;      // LLM-generated narration text
  "x-": string;      // Parsed story events / Input sum
  "y+": number[][];  // Embeddings (Semantic Vectors)
  "y-": string[];    // Associative Tags (Thematic Links)
  "z+": EntityCard[]; // Entities (Who is here)
  "z-": LoreContext; // Lore Context
}

export interface VoxelCoordinate {
  g: number;
  s: number;
  o: number;
  c: number;
  ct: number;
  r: number;
}
export type SpatialKey = VoxelCoordinate;

export interface TemporalKey {
  saga: number;
  book: number;
  chapter: number;
  page: number;
}

export interface VoxelSnapshot {
  id: string;
  spatial: VoxelCoordinate;
  temporal: TemporalKey;
  faces: VoxelFaces;
  relevanceScore?: number;
}

// --- AFFINITY (M.O.S.S.) TYPES ---
export interface MossProfile {
  M: number; // Mechanical/Task
  O: number; // Operational/Logic
  S: number; // Social/Emotional
  S_prime: number; // Spiritual/Abstract
}

// --- ORCHESTRATION TYPES ---
export type RecipientMode = "gm" | "lyra" | "vizzy" | "nav" | "npc" | "bot";

export interface TurnRecipient {
  id: string;
  label: string;
  mode: RecipientMode;
}

export interface TurnContext {
  playerText: string;
  spatial: VoxelCoordinate;
  temporal: TemporalKey;
  loreKey: string;

  // Memories retrieved from lattice
  memories: VoxelSnapshot[];

  // Current local entities & lore resolved deterministically (Optional if engine resolves)
  entitiesPresent?: EntityCard[];
  loreEntry?: any;
  activeQuests?: Array<{
    entityId: string;
    bio: any;
    quests: any[];
  }>;

  // State
  flags: Record<string, boolean | string | number>;
  mossProfile?: MossProfile;

  // Metadata
  playerClass?: string;
  playerAffinity?: string;
  characterDirectives?: Record<string, string>;

  // Config
  recipients: TurnRecipient[];
  llmConfig?: {
    model?: string;
    baseUrl?: string;
    temperature?: number;
    performanceMode?: boolean;
  };
}

export type QuestStatus = 'ADVANCE' | 'FAIL' | 'FREEPLAY';
export interface QuestUpdatePayload {
  status: QuestStatus;
  message: string;
}

export interface AgentOutputSection {
  id: string;
  label: string;
  mode: RecipientMode;
  markdown: string;
}

export interface TurnResult {
  narration: string;
  outputs: AgentOutputSection[];
  thought?: string;
  questUpdates?: QuestUpdatePayload;
  newFlags?: Record<string, boolean | string | number>;
  debug?: any;
}
