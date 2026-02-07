// /src/memoryOrchestrator.ts
import { OllamaClient } from "./ollama/client.js";
import { CONFIG } from "./config.js";
import { InMemoryLattice, SpatialKey, TemporalKey, MemoryVoxel, Ranked } from "eideus-memory-lattice-api";

export type MemoryContextPiece = {
  id: string;
  spatial: SpatialKey;
  temporal: TemporalKey;
  xPlus: string;
  xMinus: string;
  tags: string[];
  loreKey: string;
  entities: Array<{ id: string; name: string; class?: string }>;
};

export type MemoryOrchestrator = {
  lattice: InMemoryLattice;
  decideAndRetrieve(args: {
    playerText: string;
    saga: number;
    book: number;
    spatialHint?: SpatialKey;
    tagHints?: string[];
    entityHints?: string[];
    llmConfig?: {
      embeddingModel?: string;
    }
  }): Promise<MemoryContextPiece[]>;
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9_]+/i)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 64);
}

function unique<T>(xs: T[]): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const x of xs) {
    const k = typeof x === "string" ? x : JSON.stringify(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function readPieces(lattice: InMemoryLattice, ranked: Ranked<{ spatial: SpatialKey; temporal: TemporalKey }>[], limit: number): Promise<MemoryContextPiece[]> {
  const out: MemoryContextPiece[] = [];
  for (const r of ranked.slice(0, limit)) {
    const v = await lattice.readVoxel(r.item);
    if (!v.voxel) continue;
    out.push(voxelToPiece(v.voxel));
  }
  return out;
}

function voxelToPiece(v: MemoryVoxel): MemoryContextPiece {
  // Handle z- as LoreContext object (new format) or string (legacy)
  const zMinus = v.faces["z-"];
  const loreKey = typeof zMinus === "string" ? zMinus : (zMinus as any)?.loreKey ?? "";

  return {
    id: v.id,
    spatial: v.spatial,
    temporal: v.temporal,
    xPlus: String(v.faces["x+"] || ""),
    xMinus: String(v.faces["x-"] || ""),
    tags: Array.isArray(v.faces["y-"]) ? v.faces["y-"] : [],
    loreKey: loreKey,
    entities: (v.faces["z+"] || []).map((e: any) => ({
      id: String(e.id || ""),
      name: String(e.name || "Unknown"),
      class: String(e.class || "")
    })),
  };
}

export function createMemoryOrchestrator(ollama: OllamaClient): MemoryOrchestrator {
  const lattice = new InMemoryLattice();

  async function decideAndRetrieve(args: {
    playerText: string;
    saga: number;
    book: number;
    spatialHint?: SpatialKey;
    tagHints?: string[];
    entityHints?: string[];
    llmConfig?: {
      embeddingModel?: string;
    }
  }): Promise<MemoryContextPiece[]> {
    console.log("[MemoryOrchestrator] Retrieving context (Keywords + Location + Vectors)...");

    // Keyword search on faces (Primary mechanism now)
    const kw = tokenize(args.playerText);
    const scopeBase = { saga: args.saga, book: args.book };

    const keywordRanked: Ranked<{ spatial: SpatialKey; temporal: TemporalKey }>[] = [];
    for (const k of kw.slice(0, 6)) {
      const r = await lattice.searchFacesByKeyword({
        query: k,
        faces: ["x+", "x-", "y-", "z-", "z+"],
        scope: args.spatialHint ? { ...scopeBase, spatialPrefix: args.spatialHint } : scopeBase,
        limit: 6,
      });
      for (const m of r.matches) keywordRanked.push(m);
    }
    keywordRanked.sort((a, b) => b.score - a.score);

    // Vector Search (Secondary mechanism)
    const vectorRanked: Ranked<{ spatial: SpatialKey; temporal: TemporalKey }>[] = [];
    if (args.llmConfig?.embeddingModel) {
      try {
        const embRes = await ollama.embeddings({
          model: args.llmConfig.embeddingModel,
          prompt: args.playerText
        });
        if (embRes && embRes.embedding) {
          const vecRes = await lattice.searchEmbeddings({
            queryEmbedding: embRes.embedding,
            scope: args.spatialHint ? { ...scopeBase, spatialPrefix: args.spatialHint } : scopeBase,
            limit: 10
          });
          for (const m of vecRes.matches) vectorRanked.push(m);
        }
      } catch (err) {
        console.warn("[MemoryOrchestrator] Vector Search Failed:", err);
      }
    }

    // If spatial hint exists, also pull latest at location
    const latestAtLoc = args.spatialHint
      ? await lattice.latestAtLocation({ spatial: args.spatialHint, scope: scopeBase })
      : { voxels: [] as MemoryVoxel[] };

    // Merge seeds
    const seed = unique([
      ...keywordRanked.slice(0, CONFIG.TOPK_KEYWORD),
      ...vectorRanked,
      ...latestAtLoc.voxels.map((v: MemoryVoxel) => ({ item: { spatial: v.spatial, temporal: v.temporal }, score: 0.75 })),
    ]);

    // Simple fetch without embedding rerank
    const pieces = await readPieces(lattice, seed, CONFIG.MAX_CONTEXT_VOXELS);
    if (pieces.length === 0) return [];

    // Temporal window around top hit
    const best = seed[0]?.item;
    if (!best) return pieces;

    const expanded = await lattice.expandTemporal({
      entry: best,
      expansion: { mode: "plusMinusPages", n: CONFIG.TEMPORAL_WINDOW_PAGES },
    });

    const expandedPieces = expanded.voxels
      .filter((v: MemoryVoxel) => v.temporal.saga === args.saga && v.temporal.book === args.book)
      .map(voxelToPiece);

    return unique([...expandedPieces, ...pieces]).slice(0, CONFIG.MAX_CONTEXT_VOXELS);
  }

  return { lattice, decideAndRetrieve };
}
