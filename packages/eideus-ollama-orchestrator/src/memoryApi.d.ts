export type SpatialKeyStr = string;
export type TemporalKeyStr = string;
export type MemoryCoord = {
    spatial: SpatialKeyStr;
    temporal: TemporalKeyStr;
};
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
export type RankedCoord = {
    coord: MemoryCoord;
    score: number;
};
export type MemoryReadWindow = {
    mode: "PlusMinusPages";
    n: number;
};
export type MemoryQueryPlan = {
    op: "DirectVoxelRead";
    spatial: SpatialKeyStr;
    temporal: TemporalKeyStr;
} | {
    op: "LatestAtLocation";
    spatial: SpatialKeyStr;
    saga?: number;
    book?: number;
} | {
    op: "DirectSpatialSlice";
    spatial: SpatialKeyStr;
    saga?: number;
    book?: number;
    chapter?: number;
} | {
    op: "EmbeddingTopKThenRerank";
    topK: number;
    spatialPrefix?: string;
    window?: MemoryReadWindow;
};
export type MemoryApi = {
    directVoxelRead(req: {
        spatial: SpatialKeyStr;
        temporal: TemporalKeyStr;
    }): Promise<{
        voxel: MemoryVoxel | null;
    }>;
    directSpatialSlice(req: {
        spatial: SpatialKeyStr;
        saga?: number;
        book?: number;
        chapter?: number;
    }): Promise<{
        voxels: MemoryVoxel[];
    }>;
    latestAtLocation(req: {
        spatial: SpatialKeyStr;
        saga?: number;
        book?: number;
    }): Promise<{
        voxels: MemoryVoxel[];
    }>;
    searchEmbeddings(req: {
        queryEmbedding: number[];
        topK: number;
        spatialPrefix?: string;
    }): Promise<{
        matches: RankedCoord[];
    }>;
    readVoxel(req: {
        spatial: SpatialKeyStr;
        temporal: TemporalKeyStr;
    }): Promise<{
        voxel: MemoryVoxel | null;
    }>;
    joinAndRerank(req: {
        seed: RankedCoord[];
        intentEmbedding: number[];
        boostTags?: string[];
        requireEntities?: string[];
        limit?: number;
    }): Promise<{
        matches: RankedCoord[];
    }>;
};
export declare class HttpMemoryApi implements MemoryApi {
    private baseUrl;
    constructor(baseUrl: string);
    private post;
    directVoxelRead(req: {
        spatial: string;
        temporal: string;
    }): Promise<{
        voxel: MemoryVoxel | null;
    }>;
    directSpatialSlice(req: {
        spatial: string;
        saga?: number;
        book?: number;
        chapter?: number;
    }): Promise<{
        voxels: MemoryVoxel[];
    }>;
    latestAtLocation(req: {
        spatial: string;
        saga?: number;
        book?: number;
    }): Promise<{
        voxels: MemoryVoxel[];
    }>;
    searchEmbeddings(req: {
        queryEmbedding: number[];
        topK: number;
        spatialPrefix?: string;
    }): Promise<{
        matches: RankedCoord[];
    }>;
    readVoxel(req: {
        spatial: string;
        temporal: string;
    }): Promise<{
        voxel: MemoryVoxel | null;
    }>;
    joinAndRerank(req: {
        seed: RankedCoord[];
        intentEmbedding: number[];
        boostTags?: string[];
        requireEntities?: string[];
        limit?: number;
    }): Promise<{
        matches: RankedCoord[];
    }>;
}
//# sourceMappingURL=memoryApi.d.ts.map