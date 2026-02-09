import {
    MemoryLatticeApi,
    DirectVoxelReadRequest,
    DirectVoxelReadResponse,
    DirectSpatialSliceRequest,
    DirectSpatialSliceResponse,
    DirectTemporalSliceRequest,
    DirectTemporalSliceResponse,
    RangeReadTemporalRequest,
    RangeReadTemporalResponse,
    RangeReadSpatialHierarchyRequest,
    RangeReadSpatialHierarchyResponse,
    LatestAtLocationRequest,
    LatestAtLocationResponse,
    FirstAtLocationRequest,
    FirstAtLocationResponse,
    ResolveCoordinatesByIndexRequest,
    ResolveCoordinatesByIndexResponse,
    SearchFacesByKeywordRequest,
    SearchFacesByKeywordResponse,
    SearchEmbeddingsRequest,
    SearchEmbeddingsResponse,
    ReadVoxelRequest,
    ReadVoxelResponse,
    ExpandTemporalRequest,
    ExpandTemporalResponse,
    ExpandSpatialRequest,
    ExpandSpatialResponse,
    JoinAndRerankRequest,
    JoinAndRerankResponse
} from 'eideus-memory-lattice-api';

/**
 * A client-side implementation of MemoryLatticeApi that fetches data
 * from the local /api/memories endpoint (served by Vite).
 */
export class FileSystemMemoryClient implements MemoryLatticeApi {
    private baseUrl: string;

    constructor(baseUrl: string = '/api/memories') {
        this.baseUrl = baseUrl;
    }

    private async fetchJson<T>(path: string): Promise<T | null> {
        try {
            const res = await fetch(`${this.baseUrl}/${path}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error(`Failed to fetch memory at ${path}`, e);
            return null;
        }
    }

    async readVoxel(req: ReadVoxelRequest): Promise<ReadVoxelResponse> {
        // Construct filename from spatial/temporal keys
        // format: MEM-{x}_{y}_{z}-{saga}_{book}_{chapter}_{page}.json
        const filename = `MEM-${req.spatial.x}_${req.spatial.y}_${req.spatial.z}-${req.temporal.saga}_${req.temporal.book}_${req.temporal.chapter}_${req.temporal.page}.json`;
        const voxel = await this.fetchJson<any>(filename);
        return { voxel: voxel || null };
    }

    // -- Stubs for other methods required by interface --

    async directVoxelRead(req: DirectVoxelReadRequest): Promise<DirectVoxelReadResponse> {
        // Alias to readVoxel for now
        const res = await this.readVoxel({ spatial: req.spatial, temporal: req.temporal });
        return { voxel: res.voxel };
    }

    async directSpatialSlice(req: DirectSpatialSliceRequest): Promise<DirectSpatialSliceResponse> {
        return { voxels: [] };
    }

    async directTemporalSlice(req: DirectTemporalSliceRequest): Promise<DirectTemporalSliceResponse> {
        return { voxels: [] };
    }

    async rangeReadTemporal(req: RangeReadTemporalRequest): Promise<RangeReadTemporalResponse> {
        return { voxels: [] };
    }

    async rangeReadSpatialHierarchy(req: RangeReadSpatialHierarchyRequest): Promise<RangeReadSpatialHierarchyResponse> {
        return { voxels: [] };
    }

    async latestAtLocation(req: LatestAtLocationRequest): Promise<LatestAtLocationResponse> {
        return { voxels: [] };
    }

    async firstAtLocation(req: FirstAtLocationRequest): Promise<FirstAtLocationResponse> {
        return { voxels: [] };
    }

    async resolveCoordinatesByIndex(req: ResolveCoordinatesByIndexRequest): Promise<ResolveCoordinatesByIndexResponse> {
        return { candidates: [] };
    }

    async searchFacesByKeyword(req: SearchFacesByKeywordRequest): Promise<SearchFacesByKeywordResponse> {
        return { matches: [] };
    }

    async searchEmbeddings(req: SearchEmbeddingsRequest): Promise<SearchEmbeddingsResponse> {
        return { matches: [] };
    }

    async expandTemporal(req: ExpandTemporalRequest): Promise<ExpandTemporalResponse> {
        return { voxels: [] };
    }

    async expandSpatial(req: ExpandSpatialRequest): Promise<ExpandSpatialResponse> {
        return { voxels: [] };
    }

    async joinAndRerank(req: JoinAndRerankRequest): Promise<JoinAndRerankResponse> {
        return { matches: [] };
    }
}
