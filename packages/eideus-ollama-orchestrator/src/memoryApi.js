// /src/memoryApi.ts
// Contract wrapper for the Memory Lattice API.
// This file is intentionally agnostic: it can call an in-process implementation
// or HTTP endpoints, depending on how you wire it into Eideus_Merger.
export class HttpMemoryApi {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async post(path, body) {
        const r = await fetch(`${this.baseUrl}${path}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!r.ok)
            throw new Error(`MemoryApi ${path} failed: ${r.status} ${await r.text()}`);
        return (await r.json());
    }
    directVoxelRead(req) {
        return this.post("/directVoxelRead", req);
    }
    directSpatialSlice(req) {
        return this.post("/directSpatialSlice", req);
    }
    latestAtLocation(req) {
        return this.post("/latestAtLocation", req);
    }
    searchEmbeddings(req) {
        return this.post("/searchEmbeddings", req);
    }
    readVoxel(req) {
        return this.post("/readVoxel", req);
    }
    joinAndRerank(req) {
        return this.post("/joinAndRerank", req);
    }
}
