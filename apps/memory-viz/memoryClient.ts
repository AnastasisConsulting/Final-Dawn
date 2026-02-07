export class MemoryLatticeClient {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:4000') {
        this.baseUrl = baseUrl;
    }

    private async post(endpoint: string, body: any) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`MemoryLattice API Error: ${response.statusText}`);
        }
        return response.json();
    }

    async directSpatialSlice(spatial: any, filter: any = {}) {
        return this.post('/directSpatialSlice', { spatial, filter });
    }

    async readVoxel(spatial: any, temporal: any) {
        return this.post('/readVoxel', { spatial, temporal });
    }

    async latestAtLocation(spatial: any, scope: any = {}) {
        return this.post('/latestAtLocation', { spatial, scope });
    }
}

export const defaultMemoryClient = new MemoryLatticeClient();
