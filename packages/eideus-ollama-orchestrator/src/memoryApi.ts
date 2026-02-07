// /src/memoryApi.ts
// Contract wrapper for the Memory Lattice API.
// This file is intentionally agnostic: it can call an in-process implementation
// or HTTP endpoints, depending on how you wire it into Eideus_Merger.

export type SpatialKeyStr = string; // "g0.s0.o0.c0.ct0.r0"
export type TemporalKeyStr = string; // "s0.b0.c0.p0"

export type MemoryCoord = { spatial: SpatialKeyStr; temporal: TemporalKeyStr };

export type MemoryVoxel = {
  spatial: SpatialKeyStr;
  temporal: TemporalKeyStr;
  faces: {
    "x+": string;
    "x-": string;
    "y+": number[][];
    "y-": string[];
    "z+": any[];
    "z-": string;
  };
};

export type RankedCoord = { coord: MemoryCoord; score: number };

export type MemoryReadWindow = {
  mode: "PlusMinusPages";
  n: number; // default 3
};

export type MemoryQueryPlan =
  | { op: "DirectVoxelRead"; spatial: SpatialKeyStr; temporal: TemporalKeyStr }
  | { op: "LatestAtLocation"; spatial: SpatialKeyStr; saga?: number; book?: number }
  | { op: "DirectSpatialSlice"; spatial: SpatialKeyStr; saga?: number; book?: number; chapter?: number }
  | { op: "EmbeddingTopKThenRerank"; topK: number; spatialPrefix?: string; window?: MemoryReadWindow };

export type MemoryApi = {
  directVoxelRead(req: { spatial: SpatialKeyStr; temporal: TemporalKeyStr }): Promise<{ voxel: MemoryVoxel | null }>;
  directSpatialSlice(req: { spatial: SpatialKeyStr; saga?: number; book?: number; chapter?: number }): Promise<{ voxels: MemoryVoxel[] }>;
  latestAtLocation(req: { spatial: SpatialKeyStr; saga?: number; book?: number }): Promise<{ voxels: MemoryVoxel[] }>;
  searchEmbeddings(req: { queryEmbedding: number[]; topK: number; spatialPrefix?: string }): Promise<{ matches: RankedCoord[] }>;
  readVoxel(req: { spatial: SpatialKeyStr; temporal: TemporalKeyStr }): Promise<{ voxel: MemoryVoxel | null }>;
  joinAndRerank(req: {
    seed: RankedCoord[];
    intentEmbedding: number[];
    boostTags?: string[];
    requireEntities?: string[];
    limit?: number;
  }): Promise<{ matches: RankedCoord[] }>;
};

export class HttpMemoryApi implements MemoryApi {
  constructor(private baseUrl: string) {}

  private async post<T>(path: string, body: any): Promise<T> {
    const r = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`MemoryApi ${path} failed: ${r.status} ${await r.text()}`);
    return (await r.json()) as T;
  }

  directVoxelRead(req: { spatial: string; temporal: string }): Promise<{ voxel: MemoryVoxel | null }> {
    return this.post("/directVoxelRead", req);
  }
  directSpatialSlice(req: { spatial: string; saga?: number; book?: number; chapter?: number }): Promise<{ voxels: MemoryVoxel[] }> {
    return this.post("/directSpatialSlice", req);
  }
  latestAtLocation(req: { spatial: string; saga?: number; book?: number }): Promise<{ voxels: MemoryVoxel[] }> {
    return this.post("/latestAtLocation", req);
  }
  searchEmbeddings(req: { queryEmbedding: number[]; topK: number; spatialPrefix?: string }): Promise<{ matches: RankedCoord[] }> {
    return this.post("/searchEmbeddings", req);
  }
  readVoxel(req: { spatial: string; temporal: string }): Promise<{ voxel: MemoryVoxel | null }> {
    return this.post("/readVoxel", req);
  }
  joinAndRerank(req: { seed: RankedCoord[]; intentEmbedding: number[]; boostTags?: string[]; requireEntities?: string[]; limit?: number }): Promise<{ matches: RankedCoord[] }> {
    return this.post("/joinAndRerank", req);
  }
}
