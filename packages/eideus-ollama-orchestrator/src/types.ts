// /src/types.ts
import type { SpatialKey, TemporalKey, EntityCard } from "eideus-memory-lattice-api";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  name?: string;
};

export type EmbeddingVector = number[];

export type ToolcallEnvelope<TPayload> = {
  eventId: string; // uuid
  ts: number;      // unix ms
  seq: number;     // monotonic per session
  sessionId: string;
  turnId?: string;
  payload: TPayload;
  type: string;
};

export type LlmModelSpec = {
  chatModel: string; // e.g. "llama3.1:8b"
  embedModel: string; // e.g. "nomic-embed-text"
};

export type RecipientMode = "gm" | "lyra" | "vizzy" | "nav" | "npc";

export type TurnRecipient = {
  id: string; // "nav" | "vizzy" | "lyra" | "gm" | "npc:<entityId>"
  label: string; // UI badge text
  mode: RecipientMode;
  focusEntityId?: string; // optional bias target (esp for NPC)
};

/**
 * CANONICAL TURN CONTRACT (UI -> server -> engine)
 * This is the only supported request body for POST /turn.
 */
export type TurnRequest = {
  playerText: string;

  // Required canonical coordinates for immutable voxel write
  spatial: SpatialKey;
  temporalBase: Omit<TemporalKey, "page">; // saga/book/chapter
  page: number;

  // Required: lore pointer for z- face
  loreKey: string;

  // Optional retrieval/write helpers
  entitiesPresent?: EntityCard[]; // z+
  tagHints?: string[]; // y- hints
  entityHints?: string[]; // retrieval boost
  focusEntityId?: string; // affinity bias target if desired

  // UI toggles: up to 3 responders
  recipients?: TurnRecipient[];

  // Character metadata for narrative flavoring
  playerClass?: string;
  playerAffinity?: string;
  characterDirectives?: Record<string, string>;

  // Server-injected caches for deterministic context (optional for client calls)
  caches?: {
    lore: Map<string, any>;
    quests: Map<string, any>;
    cast: Map<string, any>;
  };
};

export type TurnResponse = {
  narration: string; // combined transcript (safe storage)
  outputs: Array<{ id: string; label: string; mode: RecipientMode; markdown: string }>;
  wroteVoxelId: string;
  usedMemory: Array<{ id: string; spatial: SpatialKey; temporal: TemporalKey }>;
};

export type RetrievedMemory = {
  id: string;
  spatial: SpatialKey;
  temporal: TemporalKey;
  xPlus?: string;
  xMinus?: string;
  tags?: string[];
  loreKey?: string;
  entites?: any[];
  score: number;
};

export type MemorySelection = {
  entryPoint:
  | "DirectVoxelRead"
  | "DirectSpatialSlice"
  | "DirectTemporalSlice"
  | "RangeReadTemporal"
  | "RangeReadSpatialHierarchy"
  | "LatestAtLocation"
  | "FirstAtLocation"
  | "IndexLookup"
  | "EmbeddingSearch";
  rationale: string;
  memory: RetrievedMemory[];
};

export type OrchestratorOutput = {
  narration: string;
  outputs?: Array<{ id: string; label: string; mode: RecipientMode; markdown: string }>;
  memoryWrite?: {
    spatialKey: string;
    temporalKey: string;
    faces: {
      "x+": string;
      "x-": string;
      "y-": string[];
      "z+"?: any[];
      "z-": string;
    };
  };
  debug?: {
    routerPlan: any;
    memorySelection: MemorySelection;
    llmModel: string;
    embedModel: string;
  };
};
