// /toolcalls/voxel-memory/tools.ts

import { ToolCall } from "../ai-avatar/tools";
import type { 
  SpatialKey, 
  TemporalKey, 
  FaceId, 
  Scope 
} from "../../packages/eideus-memory-lattice-api/src/memory/types";

/* ============================================================================
   Voxel Memory Retrieval (VMR) - Tool Parameter Definitions
   - Maps LLM intent to eideus-memory-lattice-api contracts
============================================================================ */

/**
 * Direct access to a specific memory voxel.
 * Used when the system knows the exact coordinate (e.g., from a "previous turn" reference).
 */
export interface VmrReadVoxelParams {
  spatial: SpatialKey;
  temporal: TemporalKey;
}

/**
 * Text-based search across specific faces of the memory cube.
 * Best for finding specific dialogue (x faces) or lore entries (z-).
 */
export interface VmrSearchTextParams {
  query: string;
  faces: FaceId[]; // ["x+", "x-"] or ["z-"] etc.
  limit?: number;
}

/**
 * Semantic/Embedding search.
 * The orchestrator must convert 'intent_query' to a vector before calling MemoryLatticeApi.searchEmbeddings.
 */
export interface VmrSearchSemanticParams {
  intent_query: string; // Natural language description of what to find
  scope?: Scope;        // Optional bounds (e.g., only this Saga)
  limit?: number;
}

/**
 * Lookup by Index (Tags, Entities, Lore Keys).
 * Consolidates 'resolveCoordinatesByIndex' for the LLM.
 */
export interface VmrResolveIndexParams {
  kind: "AssociativeTags" | "EntityId" | "LoreKey" | "LocationEntity";
  query: string | string[]; // The tag(s) or entity name(s)
  limit?: number;
}

/**
 * Spatial expansion query.
 * "What is around me?" or "What happened nearby?"
 */
export interface VmrExpandSpatialParams {
  center: { spatial: SpatialKey; temporal: TemporalKey };
  hops: number; // 1-3 typically
}

/**
 * State persistence (writing back to memory).
 * Records the result of the current turn.
 */
export interface VmrCommitTurnParams {
  spatial: SpatialKey;
  temporal: TemporalKey;
  input_summary: string;  // x+
  output_summary: string; // x-
  tags: string[];         // y-
  entity_ids: string[];   // z+
}

/* ============================================================================
   Tool Map & Envelope
============================================================================ */

export interface VmrToolMap {
  vmr_read_voxel: VmrReadVoxelParams;
  vmr_search_text: VmrSearchTextParams;
  vmr_search_semantic: VmrSearchSemanticParams;
  vmr_resolve_index: VmrResolveIndexParams;
  vmr_expand_spatial: VmrExpandSpatialParams;
  vmr_commit_turn: VmrCommitTurnParams;
}

export type VmrToolCall<T extends keyof VmrToolMap = keyof VmrToolMap> = 
  ToolCall<VmrToolMap[T]> & { name: T };