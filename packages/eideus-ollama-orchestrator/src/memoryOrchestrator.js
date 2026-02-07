import { CONFIG } from "./config.js";
import { InMemoryLattice } from "eideus-memory-lattice-api";
function tokenize(s) {
    return s
        .toLowerCase()
        .split(/[^a-z0-9_]+/i)
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 64);
}
function unique(xs) {
    const out = [];
    const seen = new Set();
    for (const x of xs) {
        const k = typeof x === "string" ? x : JSON.stringify(x);
        if (seen.has(k))
            continue;
        seen.add(k);
        out.push(x);
    }
    return out;
}
async function readPieces(lattice, ranked, limit) {
    const out = [];
    for (const r of ranked.slice(0, limit)) {
        const v = await lattice.readVoxel(r.item);
        if (!v.voxel)
            continue;
        out.push(voxelToPiece(v.voxel));
    }
    return out;
}
function voxelToPiece(v) {
    return {
        id: v.id,
        spatial: v.spatial,
        temporal: v.temporal,
        xPlus: v.faces["x+"],
        xMinus: v.faces["x-"],
        tags: v.faces["y-"],
        loreKey: v.faces["z-"],
        entities: v.faces["z+"].map((e) => ({ id: e.id, name: e.name, class: e.class })),
    };
}
export function createMemoryOrchestrator(ollama) {
    const lattice = new InMemoryLattice();
    async function embedText(text) {
        const r = await ollama.embed({ model: CONFIG.EMBED_MODEL, prompt: text });
        return r.embedding;
    }
    async function decideAndRetrieve(args) {
        // Embeddings model is the router: embed -> choose toolcalls.
        const intentEmb = await embedText(args.playerText);
        const kw = tokenize(args.playerText);
        const scopeBase = { saga: args.saga, book: args.book };
        // 1) Embedding similarity (primary)
        const embedMatches = await lattice.searchEmbeddings({
            queryEmbedding: intentEmb,
            scope: args.spatialHint ? { ...scopeBase, spatialPrefix: args.spatialHint } : scopeBase,
            limit: CONFIG.TOPK_EMBED,
        });
        // 2) Keyword search on faces (secondary)
        const keywordRanked = [];
        for (const k of kw.slice(0, 6)) {
            const r = await lattice.searchFacesByKeyword({
                query: k,
                faces: ["x+", "x-", "y-", "z-", "z+"],
                scope: args.spatialHint ? { ...scopeBase, spatialPrefix: args.spatialHint } : scopeBase,
                limit: 6,
            });
            for (const m of r.matches)
                keywordRanked.push(m);
        }
        keywordRanked.sort((a, b) => b.score - a.score);
        // 3) If spatial hint exists, also pull latest at location
        const latestAtLoc = args.spatialHint
            ? await lattice.latestAtLocation({ spatial: args.spatialHint, scope: scopeBase })
            : { voxels: [] };
        // Merge seeds
        const seed = unique([
            ...embedMatches.matches,
            ...keywordRanked.slice(0, CONFIG.TOPK_KEYWORD),
            ...latestAtLoc.voxels.map((v) => ({ item: { spatial: v.spatial, temporal: v.temporal }, score: 0.75 })),
        ]);
        // Rerank with optional tag/entity boosts
        const reranked = await lattice.joinAndRerank({
            seed,
            intentEmbedding: intentEmb,
            boostTags: args.tagHints,
            requireEntities: args.entityHints,
            limit: CONFIG.MAX_CONTEXT_VOXELS,
        });
        // Temporal window around top hit (±N pages) within same saga/book/chapter
        const best = reranked.matches[0]?.item;
        const pieces = await readPieces(lattice, reranked.matches, CONFIG.MAX_CONTEXT_VOXELS);
        if (!best)
            return pieces;
        const expanded = await lattice.expandTemporal({
            entry: best,
            expansion: { mode: "plusMinusPages", n: CONFIG.TEMPORAL_WINDOW_PAGES },
        });
        const expandedPieces = expanded.voxels
            .filter((v) => v.temporal.saga === args.saga && v.temporal.book === args.book)
            .map(voxelToPiece);
        return unique([...expandedPieces, ...pieces]).slice(0, CONFIG.MAX_CONTEXT_VOXELS);
    }
    return { lattice, embedText, decideAndRetrieve };
}
