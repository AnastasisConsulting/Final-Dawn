// /src/memory/router.ts
import { MemoryLatticeApi } from "./contracts.js";
import { Ranked, SpatialKey, TemporalKey } from "./types.js";

export type IntentSignal = {
  text: string;
  embedding?: number[];
  keywords?: string[];
  tags?: string[];
  entityQueries?: string[];
  locationHints?: string[];
};

export type RouterPlan =
  | { op: "DirectVoxelRead"; spatial: SpatialKey; temporal: TemporalKey }
  | { op: "LatestAtLocation"; spatial: SpatialKey; saga?: number; book?: number }
  | { op: "FirstAtLocation"; spatial: SpatialKey; saga?: number; book?: number }
  | { op: "IndexResolveThenTemporalWindow"; indexKind: any; query: string; temporalPlusMinusPages: number }
  | { op: "EmbeddingTopKThenRerank"; topK: number; temporalPlusMinusPages: number; spatialPrefix?: any };

export interface IntentRouter {
  plan(signal: IntentSignal): Promise<RouterPlan>;
}

export interface EmbeddingsProvider {
  embed(text: string): Promise<number[]>;
}

export class MinimalRouter implements IntentRouter {
  constructor(private embeddings: EmbeddingsProvider) {}

  async plan(signal: IntentSignal): Promise<RouterPlan> {
    const t = signal.text.toLowerCase();

    if (t.includes("latest") && signal.locationHints?.length) {
      return {
        op: "IndexResolveThenTemporalWindow",
        indexKind: "LocationEntity",
        query: signal.locationHints[0],
        temporalPlusMinusPages: 3,
      };
    }

    if (!signal.embedding) signal.embedding = await this.embeddings.embed(signal.text);

    if (signal.entityQueries?.length) {
      return {
        op: "IndexResolveThenTemporalWindow",
        indexKind: "PersonageEntity",
        query: signal.entityQueries[0],
        temporalPlusMinusPages: 3,
      };
    }

    return { op: "EmbeddingTopKThenRerank", topK: 25, temporalPlusMinusPages: 3 };
  }
}

export async function executePlan(
  api: MemoryLatticeApi,
  plan: RouterPlan,
  signal: IntentSignal
): Promise<Ranked<{ spatial: SpatialKey; temporal: TemporalKey }>[]> {
  switch (plan.op) {
    case "DirectVoxelRead": {
      const r = await api.directVoxelRead({ spatial: plan.spatial, temporal: plan.temporal });
      if (!r.voxel) return [];
      return [{ item: { spatial: r.voxel.spatial, temporal: r.voxel.temporal }, score: 1 }];
    }
    case "LatestAtLocation": {
      const r = await api.latestAtLocation({ spatial: plan.spatial, scope: { saga: plan.saga, book: plan.book } });
      return r.voxels.map((v) => ({ item: { spatial: v.spatial, temporal: v.temporal }, score: 1 }));
    }
    case "FirstAtLocation": {
      const r = await api.firstAtLocation({ spatial: plan.spatial, scope: { saga: plan.saga, book: plan.book } });
      return r.voxels.map((v) => ({ item: { spatial: v.spatial, temporal: v.temporal }, score: 1 }));
    }
    case "IndexResolveThenTemporalWindow": {
      const cand = await api.resolveCoordinatesByIndex({ kind: plan.indexKind, query: plan.query, limit: 25 });
      const seed = cand.candidates.map((c) => ({
        item: {
          spatial: c.spatial,
          temporal:
            c.temporalHint && c.temporalHint.kind === "exact"
              ? c.temporalHint.key
              : { saga: 0, book: 0, chapter: 0, page: 0 },
        },
        score: c.score,
      }));
      const joined = await api.joinAndRerank({
        seed,
        intentEmbedding: signal.embedding,
        boostTags: signal.tags,
        requireEntities: signal.entityQueries,
        limit: 25,
      });
      return joined.matches;
    }
    case "EmbeddingTopKThenRerank": {
      const emb = signal.embedding ?? [];
      const top = await api.searchEmbeddings({
        queryEmbedding: emb,
        limit: plan.topK,
        scope: plan.spatialPrefix ? { spatialPrefix: plan.spatialPrefix } : undefined,
      });
      const reranked = await api.joinAndRerank({
        seed: top.matches,
        intentEmbedding: emb,
        boostTags: signal.tags,
        requireEntities: signal.entityQueries,
        limit: 25,
      });
      return reranked.matches;
    }
  }
}
