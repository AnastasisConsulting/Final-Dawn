import type { VoxelCoordinate, TemporalKey, VoxelFaces } from "./types.js";

export interface PersistenceOptions {
    ollama: any; // OllamaClient
    embedModel?: string;
    llmModel?: string;
}

export class VoxelWriter {
    private ollama: any;
    private embedModel: string;
    private llmModel: string;

    constructor(options: PersistenceOptions) {
        this.ollama = options.ollama;
        this.embedModel = options.embedModel || "mxbai-embed-large";
        this.llmModel = options.llmModel || "llama3";
    }

    /**
     * Extracts tags from text.
     */
    deriveTags(text: string): string[] {
        const stop = new Set([
            "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "is", "are", "was", "were", "be", "been", "it", "that", "this", "as", "by", "we", "you", "i"
        ]);
        const toks = text
            .toLowerCase()
            .split(/[^a-z0-9_]+/i)
            .map((t) => t.trim())
            .filter((t) => t.length >= 3 && !stop.has(t));
        const freq = new Map<string, number>();
        for (const t of toks) freq.set(t, (freq.get(t) ?? 0) + 1);
        return Array.from(freq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7)
            .map(([t]) => t);
    }

    /**
     * Generates semantic tags using LLM.
     */
    async generateTags(text: string, count: number = 7): Promise<string[]> {
        try {
            const prompt = `Analyze the following text and extract exactly ${count} relevant conceptual tags (keywords). Return only the tags as a comma-separated list. text: "${text}"`;
            const res = await this.ollama.generate({
                model: this.llmModel,
                prompt,
                options: { temperature: 0.3 }
            });
            return res.response.split(',').map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 2).slice(0, count);
        } catch (err) {
            console.warn("[VoxelWriter] Tag Generation Failed, using deterministic fallback.", err);
            return this.deriveTags(text);
        }
    }

    /**
     * Generates embeddings for text.
     */
    async generateEmbeddings(text: string): Promise<number[][]> {
        try {
            const res = await this.ollama.embeddings({ model: this.embedModel, prompt: text });
            if (res && res.embedding) {
                return [res.embedding];
            }
            return [];
        } catch (err) {
            console.warn("[VoxelWriter] Embedding Generation Failed:", err);
            return [];
        }
    }

    /**
     * Writes or updates a voxel with collision retry logic.
     */
    async upsertWithRetry(lattice: any, spatial: VoxelCoordinate, temporal: TemporalKey, faces: VoxelFaces, maxRetries: number = 10): Promise<any> {
        let currentTemporal = { ...temporal };
        let attempts = 0;
        let voxel = null;

        while (!voxel && attempts < maxRetries) {
            try {
                voxel = await lattice.upsertVoxel({
                    spatial,
                    temporal: currentTemporal,
                    faces
                });
            } catch (err: any) {
                const msg = (err.message || String(err)).toLowerCase();
                if (msg.includes('immutability') || msg.includes('already exists')) {
                    console.log(`[Persistence] Voxel collision at page ${currentTemporal.page}. Retrying at page ${currentTemporal.page + 1}...`);
                    currentTemporal.page += 1;
                    attempts++;
                } else {
                    throw err;
                }
            }
        }

        if (!voxel) throw new Error("Voxel write failed: Maximum retries exceeded.");
        return voxel;
    }
}
