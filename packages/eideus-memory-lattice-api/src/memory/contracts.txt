// /src/memory/contracts.ts
import {
  MemoryVoxel,
  SpatialKey,
  TemporalKey,
  SpatialPrefix,
  TemporalBounds,
  FaceId,
  Ranked,
  Scope,
  ExpansionTemporal,
  ExpansionSpatial,
} from "./types";

export type DirectVoxelReadRequest = { spatial: SpatialKey; temporal: TemporalKey };
export type DirectVoxelReadResponse = { voxel: MemoryVoxel | null };

export type DirectSpatialSliceRequest = {
  spatial: SpatialKey;
  filter?: { saga?: number; book?: number; chapter?: number };
};
export type DirectSpatialSliceResponse = { voxels: MemoryVoxel[] };

export type DirectTemporalSliceRequest = {
  temporal: TemporalKey;
  scope?: { saga?: number; book?: number }; // typical bound
};
export type DirectTemporalSliceResponse = { voxels: MemoryVoxel[] };

export type RangeReadTemporalRequest = { bounds: TemporalBounds; scope?: Scope };
export type RangeReadTemporalResponse = { voxels: MemoryVoxel[] };

export type RangeReadSpatialHierarchyRequest = { prefix: SpatialPrefix; scope?: Scope };
export type RangeReadSpatialHierarchyResponse = { voxels: MemoryVoxel[] };

export type LatestAtLocationRequest = { spatial: SpatialKey; scope?: { saga?: number; book?: number } };
export type LatestAtLocationResponse = { voxels: MemoryVoxel[] };

export type FirstAtLocationRequest = { spatial: SpatialKey; scope?: { saga?: number; book?: number } };
export type FirstAtLocationResponse = { voxels: MemoryVoxel[] };

export type IndexKind =
  | "LocationEntity"
  | "PersonageEntity"
  | "ProperNoun"
  | "AssociativeTags"
  | "LoreKey"
  | "EntityId"
  | "EntityClass";

export type ResolveCoordinatesByIndexRequest = {
  kind: IndexKind;
  query: string | string[];
  scope?: Scope;
  limit?: number;
};
export type ResolveCoordinatesByIndexResponse = {
  candidates: Array<{ spatial: SpatialKey; temporalHint?: TemporalBounds; score: number }>;
};

export type SearchFacesByKeywordRequest = {
  query: string;
  faces: FaceId[]; // "x+","x-","y-","z+","z-"
  scope?: Scope;
  limit?: number;
};
export type SearchFacesByKeywordResponse = { matches: Ranked<{ spatial: SpatialKey; temporal: TemporalKey }>[] };

export type SearchEmbeddingsRequest = {
  queryEmbedding: number[];
  scope?: Scope;
  limit?: number;
};
export type SearchEmbeddingsResponse = { matches: Ranked<{ spatial: SpatialKey; temporal: TemporalKey }>[] };

export type ReadVoxelRequest = { spatial: SpatialKey; temporal: TemporalKey };
export type ReadVoxelResponse = { voxel: MemoryVoxel | null };

export type ExpandTemporalRequest = { entry: { spatial: SpatialKey; temporal: TemporalKey }; expansion: ExpansionTemporal };
export type ExpandTemporalResponse = { voxels: MemoryVoxel[] };

export type ExpandSpatialRequest = { entry: { spatial: SpatialKey; temporal: TemporalKey }; expansion: ExpansionSpatial };
export type ExpandSpatialResponse = { voxels: MemoryVoxel[] };

export type JoinAndRerankRequest = {
  seed: Ranked<{ spatial: SpatialKey; temporal: TemporalKey }>[];
  intentEmbedding?: number[];
  boostTags?: string[];
  requireEntities?: string[]; // entity ids or names
  limit?: number;
};
export type JoinAndRerankResponse = { matches: Ranked<{ spatial: SpatialKey; temporal: TemporalKey }>[] };

export interface MemoryLatticeApi {
  directVoxelRead(req: DirectVoxelReadRequest): Promise<DirectVoxelReadResponse>;
  directSpatialSlice(req: DirectSpatialSliceRequest): Promise<DirectSpatialSliceResponse>;
  directTemporalSlice(req: DirectTemporalSliceRequest): Promise<DirectTemporalSliceResponse>;
  rangeReadTemporal(req: RangeReadTemporalRequest): Promise<RangeReadTemporalResponse>;
  rangeReadSpatialHierarchy(req: RangeReadSpatialHierarchyRequest): Promise<RangeReadSpatialHierarchyResponse>;
  latestAtLocation(req: LatestAtLocationRequest): Promise<LatestAtLocationResponse>;
  firstAtLocation(req: FirstAtLocationRequest): Promise<FirstAtLocationResponse>;

  resolveCoordinatesByIndex(req: ResolveCoordinatesByIndexRequest): Promise<ResolveCoordinatesByIndexResponse>;
  searchFacesByKeyword(req: SearchFacesByKeywordRequest): Promise<SearchFacesByKeywordResponse>;
  searchEmbeddings(req: SearchEmbeddingsRequest): Promise<SearchEmbeddingsResponse>;

  readVoxel(req: ReadVoxelRequest): Promise<ReadVoxelResponse>;
  expandTemporal(req: ExpandTemporalRequest): Promise<ExpandTemporalResponse>;
  expandSpatial(req: ExpandSpatialRequest): Promise<ExpandSpatialResponse>;
  joinAndRerank(req: JoinAndRerankRequest): Promise<JoinAndRerankResponse>;
  upsertVoxel(req: Omit<MemoryVoxel, "id" | "createdAtUnixMs">): Promise<MemoryVoxel>;
}
