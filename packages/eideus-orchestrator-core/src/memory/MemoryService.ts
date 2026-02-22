// packages/eideus-orchestrator-core/src/memory/MemoryService.ts
import type { Ollama } from 'ollama';
import type {
    SpatialKey,
    TemporalKey,
    VoxelSnapshot,
    VoxelCoordinate
} from '../types.js';
import { InMemoryLattice } from 'eideus-memory-lattice-api';

export interface MemoryServiceOptions {
    ollama: Ollama;
    lattice: InMemoryLattice;
    embedModel?: string;
    maxContextVoxels?: number;
    temporalWindow?: number;
}

export class MemoryService {
    private ollama: Ollama;
    private lattice: InMemoryLattice;
    private embedModel: string;
    private maxContextVoxels: number;
    private temporalWindow: number;

    constructor(options: MemoryServiceOptions) {
        this.ollama = options.ollama;
        this.lattice = options.lattice;
        this.embedModel = options.embedModel || 'mxbai-embed-large';
        this.maxContextVoxels = options.maxContextVoxels || 12;
        this.temporalWindow = options.temporalWindow || 3;
    }

    private tokenize(s: string): string[] {
        return s
            .toLowerCase()
            .split(/[^a-z0-9_]+/i)
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 64);
    }

    /** Extract capitalised word runs as candidate entity/NPC names (spec: Personage Index) */
    private extractProperNouns(s: string): string[] {
        const m = s.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g);
        return (m ?? []).slice(0, 16);
    }

    private unique<T>(xs: T[]): T[] {
        const out: T[] = [];
        const seen = new Set<string>();
        for (const x of xs) {
            const k = typeof x === 'string' ? x : JSON.stringify(x);
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(x);
        }
        return out;
    }

    /**
     * Multi-stage memory retrieval pipeline — implements the full spec algorithm suite
     * from memoryLatticeService.txt and the 11 Memory Algorithm spec files.
     *
     * Stage 1: Scene signal extraction (sync, no LLM)
     * Stage 2: Parallel lattice queries (keyword, embedding, lore-key, personage, tag, latest)
     * Stage 3: Merge & coarse rank by frequency + score
     * Stage 4: Associative Jump + Entity Encounter Window on top seeds
     * Stage 5: JoinAndRerank (Embedding-to-Tag bridge, tag boosts)
     * Stage 6: Temporal Expansion ±N pages on anchor voxel
     */
    async decideAndRetrieve(args: {
        playerText: string;
        saga: number;
        book: number;
        spatialHint?: VoxelCoordinate;
        tagHints?: string[];
        entityHints?: string[];
        llmConfig?: {
            embeddingModel?: string;
            minEmbeddings?: number;
            performanceMode?: boolean;
        }
    }): Promise<VoxelSnapshot[]> {
        // NOTE: Bot probe reads are intentionally ALLOWED here.
        // The write guard lives in TurnEngine.ts (isBotProbe check before VoxelWriter.upsertWithRetry).
        // A beta bot has no natural recall — it needs memory retrieval more than a human playtester does.

        if (!this.lattice) {
            console.warn('[MemoryService] No lattice — returning empty context.');
            return [];
        }

        // ──────────────────────────────────────────────────────────────────
        // STAGE 1 — Scene Signal Extraction
        // ──────────────────────────────────────────────────────────────────
        const scopeBase: any = { saga: args.saga, book: args.book };
        const keywords = this.tokenize(args.playerText).slice(0, 6);
        const properNouns = this.extractProperNouns(args.playerText);
        const loreKey = args.spatialHint
            ? `G${args.spatialHint.g}-S${args.spatialHint.s}-O${args.spatialHint.o}`
            : '';

        console.log('[MemoryService] Stage 1: signals extracted', {
            keywords: keywords.slice(0, 4),
            properNouns: properNouns.slice(0, 4),
            loreKey
        });

        // ──────────────────────────────────────────────────────────────────
        // STAGE 2 — Parallel Lattice Queries
        // ──────────────────────────────────────────────────────────────────
        const embModel = args.llmConfig?.embeddingModel || this.embedModel;
        const perfMode = args.llmConfig?.performanceMode ?? false;

        // Compute embedding once — reused in Stage 5 (joinAndRerank)
        let intentEmbedding: number[] | undefined;
        if (!perfMode && embModel && embModel !== 'none' && this.ollama) {
            try {
                const embRes = await (this.ollama as any).embeddings({
                    model: embModel,
                    prompt: args.playerText
                });
                if (embRes?.embedding) intentEmbedding = embRes.embedding;
            } catch (err) {
                console.warn('[MemoryService] Embedding failed (continuing without):', err);
            }
        }

        const scope = args.spatialHint
            ? { ...scopeBase, spatialPrefix: args.spatialHint }
            : scopeBase;

        const [
            kwResult,
            vecResult,
            loreResult,
            personageResult,
            tagResult,
            latestResult
        ] = await Promise.allSettled([
            // A: Input/Output Combined Keyword Search (x+, x-, y- faces)
            keywords.length
                ? this.lattice.searchFacesByKeyword({
                    query: keywords.slice(0, 3).join(' '),
                    faces: ['x+', 'x-', 'y-'],
                    scope,
                    limit: 8
                })
                : Promise.resolve({ matches: [] }),

            // B: Embedding Similarity Search (y+ face)
            intentEmbedding
                ? this.lattice.searchEmbeddings({ queryEmbedding: intentEmbedding, scope, limit: 10 })
                : Promise.resolve({ matches: [] }),

            // C: LoreKey Index Lookup (z- face)
            loreKey
                ? this.lattice.resolveCoordinatesByIndex({ kind: 'LoreKey', query: loreKey, scope: scopeBase, limit: 8 })
                : Promise.resolve({ candidates: [] }),

            // D: Personage Index Lookup (z+ entity names)
            properNouns.length
                ? this.lattice.resolveCoordinatesByIndex({ kind: 'PersonageEntity', query: properNouns, scope: scopeBase, limit: 6 })
                : Promise.resolve({ candidates: [] }),

            // E: Associative Tag Index Lookup
            keywords.length
                ? this.lattice.resolveCoordinatesByIndex({ kind: 'AssociativeTags', query: keywords.slice(0, 4), scope: scopeBase, limit: 8 })
                : Promise.resolve({ candidates: [] }),

            // F: Latest-at-Location (direct spatial)
            args.spatialHint
                ? this.lattice.latestAtLocation({ spatial: args.spatialHint, scope: scopeBase })
                : Promise.resolve({ voxels: [] })
        ]);

        // ──────────────────────────────────────────────────────────────────
        // STAGE 3 — Merge & Coarse Rank (frequency boost)
        // ──────────────────────────────────────────────────────────────────
        const scoreMap = new Map<string, { coord: any; score: number }>();

        const addCandidate = (coord: { spatial: any; temporal: any }, baseScore: number) => {
            const key = JSON.stringify({ sp: coord.spatial, tm: coord.temporal });
            const existing = scoreMap.get(key);
            if (existing) {
                existing.score += baseScore + 0.25; // frequency boost
            } else {
                scoreMap.set(key, { coord, score: baseScore });
            }
        };

        if (kwResult.status === 'fulfilled')
            kwResult.value.matches.forEach((m: any) => addCandidate(m.item, m.score));
        if (vecResult.status === 'fulfilled')
            vecResult.value.matches.forEach((m: any) => addCandidate(m.item, m.score));
        if (loreResult.status === 'fulfilled')
            loreResult.value.candidates.forEach((c: any) => {
                if (c.temporalHint?.key) addCandidate({ spatial: c.spatial, temporal: c.temporalHint.key }, c.score);
                else addCandidate({ spatial: c.spatial, temporal: { saga: args.saga, book: args.book, chapter: 1, page: 1 } }, c.score);
            });
        if (personageResult.status === 'fulfilled')
            personageResult.value.candidates.forEach((c: any) => {
                if (c.temporalHint?.key) addCandidate({ spatial: c.spatial, temporal: c.temporalHint.key }, c.score);
                else addCandidate({ spatial: c.spatial, temporal: { saga: args.saga, book: args.book, chapter: 1, page: 1 } }, c.score);
            });
        if (tagResult.status === 'fulfilled')
            tagResult.value.candidates.forEach((c: any) => {
                if (c.temporalHint?.key) addCandidate({ spatial: c.spatial, temporal: c.temporalHint.key }, c.score);
                else addCandidate({ spatial: c.spatial, temporal: { saga: args.saga, book: args.book, chapter: 1, page: 1 } }, c.score);
            });
        if (latestResult.status === 'fulfilled')
            latestResult.value.voxels.forEach((v: any) => addCandidate({ spatial: v.spatial, temporal: v.temporal }, 0.75));

        const coarseSorted = Array.from(scoreMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);

        console.log(`[MemoryService] Stage 3: ${coarseSorted.length} candidates after merge`);

        if (coarseSorted.length === 0) return [];

        // ──────────────────────────────────────────────────────────────────
        // STAGE 4 — Associative Jump + Entity Encounter Window on top seeds
        // ──────────────────────────────────────────────────────────────────
        const topSeeds = coarseSorted.slice(0, 3);
        const extraCandidates: { coord: any; score: number }[] = [];

        for (const seed of topSeeds) {
            const voxelRes = await this.lattice.readVoxel(seed.coord);
            if (!voxelRes.voxel) continue;
            const voxel = voxelRes.voxel;

            // Associative Jump: follow y- tags to other voxels sharing them
            const seedTags: string[] = Array.isArray(voxel.faces['y-']) ? voxel.faces['y-'] : [];
            if (seedTags.length) {
                try {
                    const jumpRes = await this.lattice.resolveCoordinatesByIndex({
                        kind: 'AssociativeTags',
                        query: seedTags.slice(0, 4),
                        scope: scopeBase,
                        limit: 6
                    });
                    jumpRes.candidates.forEach((c: any) => {
                        if (c.temporalHint?.key)
                            extraCandidates.push({ coord: { spatial: c.spatial, temporal: c.temporalHint.key }, score: c.score * 0.8 });
                    });
                } catch { /* non-fatal */ }
            }

            // Entity Encounter Window: pull ±3 pages if entities present
            const entities: any[] = Array.isArray(voxel.faces['z+']) ? voxel.faces['z+'] : [];
            if (entities.length) {
                try {
                    const t = voxel.temporal;
                    const windowRes = await this.lattice.rangeReadTemporal({
                        bounds: {
                            kind: 'pageRange',
                            base: { saga: t.saga, book: t.book, chapter: t.chapter },
                            fromPage: Math.max(0, t.page - this.temporalWindow),
                            toPage: t.page + this.temporalWindow
                        },
                        scope: scopeBase
                    });
                    const entityIds = new Set(entities.map((e: any) => (e.id || '').toLowerCase()));
                    windowRes.voxels
                        .filter((v: any) =>
                            Array.isArray(v.faces['z+']) &&
                            v.faces['z+'].some((e: any) => entityIds.has((e.id || '').toLowerCase()))
                        )
                        .forEach((v: any) =>
                            extraCandidates.push({ coord: { spatial: v.spatial, temporal: v.temporal }, score: 0.6 })
                        );
                } catch { /* non-fatal */ }
            }
        }

        // Merge extras into score map
        extraCandidates.forEach(({ coord, score }) => addCandidate(coord, score));

        // ──────────────────────────────────────────────────────────────────
        // STAGE 5 — JoinAndRerank (Embedding-to-Tag bridge)
        // ──────────────────────────────────────────────────────────────────

        // Embedding-to-Tag bridge: extract dominant y- tags from top embedding results
        // and use them as boost tags in reranking
        const boostTags: string[] = [];
        if (vecResult.status === 'fulfilled' && vecResult.value.matches.length) {
            const topVecCoords = vecResult.value.matches.slice(0, 3);
            for (const c of topVecCoords) {
                const v = await this.lattice.readVoxel(c.item);
                if (v.voxel?.faces['y-']) {
                    (v.voxel.faces['y-'] as string[]).forEach(t => boostTags.push(t));
                }
            }
        }

        const currentScores = Array.from(scoreMap.values()).sort((a, b) => b.score - a.score).slice(0, 24);
        const seed = currentScores.map(s => ({ item: s.coord, score: s.score }));

        let finalCoords: { coord: any }[] = [];
        try {
            const rerankResult = await this.lattice.joinAndRerank({
                seed,
                intentEmbedding,
                boostTags: this.unique(boostTags).slice(0, 7),
                requireEntities: properNouns.length ? properNouns.slice(0, 4) : undefined,
                limit: 8
            });
            finalCoords = rerankResult.matches.map(m => ({ coord: m.item }));
        } catch {
            // Fallback if rerank fails
            finalCoords = currentScores.slice(0, 8).map(s => ({ coord: s.coord }));
        }

        console.log(`[MemoryService] Stage 5: joinAndRerank → ${finalCoords.length} results`);

        // ──────────────────────────────────────────────────────────────────
        // STAGE 6 — Temporal Expansion ±N pages on anchor voxel
        // ──────────────────────────────────────────────────────────────────
        const anchor = finalCoords[0]?.coord;
        let expandedVoxels: any[] = [];
        if (anchor) {
            try {
                const expanded = await this.lattice.expandTemporal({
                    entry: anchor,
                    expansion: { mode: 'plusMinusPages', n: this.temporalWindow }
                });
                expandedVoxels = expanded.voxels.filter(
                    (v: any) => v.temporal.saga === args.saga && v.temporal.book === args.book
                );
            } catch { /* non-fatal */ }
        }

        // Resolve all full snapshots
        const coordsToRead = this.unique([
            ...expandedVoxels.map((v: any) => ({ spatial: v.spatial, temporal: v.temporal })),
            ...finalCoords.map(f => f.coord)
        ]).slice(0, this.maxContextVoxels);

        const snapshots: VoxelSnapshot[] = [];
        for (const coord of coordsToRead) {
            const res = await this.lattice.readVoxel(coord);
            if (res.voxel) snapshots.push(res.voxel as VoxelSnapshot);
        }

        console.log(`[MemoryService] Stage 6: final ${snapshots.length} voxels for context`);
        return snapshots;
    }
}
