// /src/memory/inmemoryStore.ts
import {
  MemoryVoxel,
  SpatialKey,
  TemporalKey,
  TemporalBounds,
  SpatialPrefix,
  Scope,
  Ranked,
  ExpansionTemporal,
  ExpansionSpatial,
  NeighborMode,
  EntityCard,
} from "./types.js";
import { formatVoxelId, spatialMatchesPrefix } from "./keys.js";
import { MemoryLatticeApi } from "./contracts.js";

type Coord = { spatial: SpatialKey; temporal: TemporalKey };

function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
function norm(a: number[]): number {
  let s = 0;
  for (const v of a) s += v * v;
  return Math.sqrt(s) || 1;
}
function cosine(a: number[], b: number[]): number {
  return dot(a, b) / (norm(a) * norm(b));
}

function temporalCompare(a: TemporalKey, b: TemporalKey): number {
  if (a.saga !== b.saga) return a.saga - b.saga;
  if (a.book !== b.book) return a.book - b.book;
  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  return a.page - b.page;
}

function withinScope(v: MemoryVoxel, scope?: Scope): boolean {
  if (!scope) return true;
  if (scope.saga != null && v.temporal.saga !== scope.saga) return false;
  if (scope.book != null && v.temporal.book !== scope.book) return false;
  if (scope.chapter != null && v.temporal.chapter !== scope.chapter) return false;
  if (scope.spatialPrefix && !spatialMatchesPrefix(v.spatial, scope.spatialPrefix)) return false;
  if (scope.temporalBounds && !withinTemporalBounds(v.temporal, scope.temporalBounds)) return false;
  return true;
}

function withinTemporalBounds(t: TemporalKey, b: TemporalBounds): boolean {
  if (b.kind === "exact") return temporalCompare(t, b.key) === 0;
  if (b.kind === "pageRange") {
    if (t.saga !== b.base.saga || t.book !== b.base.book || t.chapter !== b.base.chapter) return false;
    return t.page >= b.fromPage && t.page <= b.toPage;
  }
  if (b.kind === "chapterRange") {
    if (t.saga !== b.base.saga || t.book !== b.base.book) return false;
    return t.chapter >= b.fromChapter && t.chapter <= b.toChapter;
  }
  return false;
}

function neighbors2D4(s: SpatialKey): SpatialKey[] {
  return [
    { ...s, r: s.r + 1 },
    { ...s, r: Math.max(0, s.r - 1) },
    { ...s, ct: s.ct + 1 },
    { ...s, ct: Math.max(0, s.ct - 1) },
  ];
}

function neighbors2D8(s: SpatialKey): SpatialKey[] {
  const base = neighbors2D4(s);
  base.push({ ...s, ct: s.ct + 1, r: s.r + 1 });
  base.push({ ...s, ct: s.ct + 1, r: Math.max(0, s.r - 1) });
  base.push({ ...s, ct: Math.max(0, s.ct - 1), r: s.r + 1 });
  base.push({ ...s, ct: Math.max(0, s.ct - 1), r: Math.max(0, s.r - 1) });
  return base;
}

function neighbors3D6(s: SpatialKey): SpatialKey[] {
  return [
    { ...s, r: s.r + 1 },
    { ...s, r: Math.max(0, s.r - 1) },
    { ...s, ct: s.ct + 1 },
    { ...s, ct: Math.max(0, s.ct - 1) },
    { ...s, c: s.c + 1 },
    { ...s, c: Math.max(0, s.c - 1) },
  ];
}

function neighbors3D26(s: SpatialKey): SpatialKey[] {
  const out: SpatialKey[] = [];
  const deltas = [-1, 0, 1];
  for (const dc of deltas) {
    for (const dct of deltas) {
      for (const dr of deltas) {
        if (dc === 0 && dct === 0 && dr === 0) continue;
        out.push({ ...s, c: Math.max(0, s.c + dc), ct: Math.max(0, s.ct + dct), r: Math.max(0, s.r + dr) });
      }
    }
  }
  return out;
}

function neighborFn(mode: NeighborMode): (s: SpatialKey) => SpatialKey[] {
  switch (mode) {
    case "2D4":
      return neighbors2D4;
    case "2D8":
      return neighbors2D8;
    case "3D6":
      return neighbors3D6;
    case "3D26":
      return neighbors3D26;
  }
}

function entityMatch(e: EntityCard, q: string): boolean {
  const x = q.toLowerCase();
  if (e.id.toLowerCase() === x) return true;
  if (e.name.toLowerCase() === x) return true;
  if (e.aliases?.some((a) => a.toLowerCase() === x)) return true;
  if (e.class?.toLowerCase() === x) return true;
  return false;
}

export class InMemoryLattice implements MemoryLatticeApi {
  private voxelsById = new Map<string, MemoryVoxel>();
  private voxels: MemoryVoxel[] = [];

  private locationIndex = new Map<string, Set<string>>(); // keyword -> voxelId
  private personageIndex = new Map<string, Set<string>>();
  private properNounIndex = new Map<string, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  private loreIndex = new Map<string, Set<string>>();
  private entityIdIndex = new Map<string, Set<string>>();
  private entityClassIndex = new Map<string, Set<string>>();

  async upsertVoxel(v: Omit<MemoryVoxel, "id" | "createdAtUnixMs">): Promise<MemoryVoxel> {
    const id = formatVoxelId(v.spatial, v.temporal);
    if (this.voxelsById.has(id)) throw new Error(`Voxel already exists (immutability): ${id}`);
    const voxel: MemoryVoxel = { ...v, id, createdAtUnixMs: Date.now() };
    this.voxelsById.set(id, voxel);
    this.voxels.push(voxel);
    this.indexVoxel(voxel);
    return voxel;
  }

  private indexVoxel(v: MemoryVoxel): void {
    const vid = v.id;

    // Handle z- as LoreContext object (new format) or string (legacy)
    const zMinus = v.faces["z-"];
    const loreKeyStr = typeof zMinus === "string" ? zMinus : (zMinus as any)?.loreKey ?? "";

    const xPlus = String(v.faces["x+"] || "");
    const xMinus = String(v.faces["x-"] || "");

    const allText = `${xPlus} ${xMinus} ${loreKeyStr}`.toLowerCase();
    for (const token of tokenize(allText)) addToIndex(this.locationIndex, token, vid);
    for (const tag of v.faces["y-"]) {
      if (typeof tag === "string") addToIndex(this.tagIndex, tag.toLowerCase(), vid);
    }
    for (const ent of v.faces["z+"]) {
      if (ent.id) addToIndex(this.entityIdIndex, ent.id.toLowerCase(), vid);
      if (ent.class) addToIndex(this.entityClassIndex, ent.class.toLowerCase(), vid);
      if (ent.name) addToIndex(this.personageIndex, ent.name.toLowerCase(), vid);
      for (const a of ent.aliases ?? []) {
        if (typeof a === "string") addToIndex(this.personageIndex, a.toLowerCase(), vid);
      }
    }
    addToIndex(this.loreIndex, loreKeyStr.toLowerCase(), vid);

    // Also index landmark names if present
    if (typeof zMinus !== "string" && (zMinus as any)?.landmarks) {
      for (const lm of (zMinus as any).landmarks) {
        if (lm.name) addToIndex(this.locationIndex, lm.name.toLowerCase(), vid);
        for (const tag of lm.tags ?? []) addToIndex(this.tagIndex, tag.toLowerCase(), vid);
      }
    }

    for (const pn of extractProperNouns(`${v.faces["x+"]} ${v.faces["x-"]}`)) {
      addToIndex(this.properNounIndex, pn.toLowerCase(), vid);
    }
  }

  async directVoxelRead(req: { spatial: SpatialKey; temporal: TemporalKey }): Promise<{ voxel: MemoryVoxel | null }> {
    return this.readVoxel(req);
  }

  async directSpatialSlice(req: {
    spatial: SpatialKey;
    filter?: { saga?: number; book?: number; chapter?: number };
  }): Promise<{ voxels: MemoryVoxel[] }> {
    const out = this.voxels
      .filter((v) => equalSpatial(v.spatial, req.spatial))
      .filter((v) => {
        if (!req.filter) return true;
        if (req.filter.saga != null && v.temporal.saga !== req.filter.saga) return false;
        if (req.filter.book != null && v.temporal.book !== req.filter.book) return false;
        if (req.filter.chapter != null && v.temporal.chapter !== req.filter.chapter) return false;
        return true;
      })
      .sort((a, b) => temporalCompare(a.temporal, b.temporal));
    return { voxels: out };
  }

  async directTemporalSlice(req: {
    temporal: TemporalKey;
    scope?: { saga?: number; book?: number };
  }): Promise<{ voxels: MemoryVoxel[] }> {
    const out = this.voxels
      .filter((v) => temporalCompare(v.temporal, req.temporal) === 0)
      .filter((v) => {
        if (!req.scope) return true;
        if (req.scope.saga != null && v.temporal.saga !== req.scope.saga) return false;
        if (req.scope.book != null && v.temporal.book !== req.scope.book) return false;
        return true;
      });
    return { voxels: out };
  }

  async rangeReadTemporal(req: { bounds: TemporalBounds; scope?: Scope }): Promise<{ voxels: MemoryVoxel[] }> {
    const out = this.voxels
      .filter((v) => withinTemporalBounds(v.temporal, req.bounds))
      .filter((v) => withinScope(v, req.scope))
      .sort((a, b) => temporalCompare(a.temporal, b.temporal));
    return { voxels: out };
  }

  async rangeReadSpatialHierarchy(req: { prefix: SpatialPrefix; scope?: Scope }): Promise<{ voxels: MemoryVoxel[] }> {
    const out = this.voxels.filter((v) => spatialMatchesPrefix(v.spatial, req.prefix)).filter((v) => withinScope(v, req.scope));
    out.sort((a, b) => temporalCompare(a.temporal, b.temporal));
    return { voxels: out };
  }

  async latestAtLocation(req: { spatial: SpatialKey; scope?: { saga?: number; book?: number } }): Promise<{ voxels: MemoryVoxel[] }> {
    const candidates = this.voxels
      .filter((v) => equalSpatial(v.spatial, req.spatial))
      .filter((v) => {
        if (!req.scope) return true;
        if (req.scope.saga != null && v.temporal.saga !== req.scope.saga) return false;
        if (req.scope.book != null && v.temporal.book !== req.scope.book) return false;
        return true;
      })
      .sort((a, b) => temporalCompare(b.temporal, a.temporal));
    const top = candidates[0];
    if (!top) return { voxels: [] };
    const sameTime = candidates.filter((v) => temporalCompare(v.temporal, top.temporal) === 0);
    return { voxels: sameTime };
  }

  async firstAtLocation(req: { spatial: SpatialKey; scope?: { saga?: number; book?: number } }): Promise<{ voxels: MemoryVoxel[] }> {
    const candidates = this.voxels
      .filter((v) => equalSpatial(v.spatial, req.spatial))
      .filter((v) => {
        if (!req.scope) return true;
        if (req.scope.saga != null && v.temporal.saga !== req.scope.saga) return false;
        if (req.scope.book != null && v.temporal.book !== req.scope.book) return false;
        return true;
      })
      .sort((a, b) => temporalCompare(a.temporal, b.temporal));
    const top = candidates[0];
    if (!top) return { voxels: [] };
    const sameTime = candidates.filter((v) => temporalCompare(v.temporal, top.temporal) === 0);
    return { voxels: sameTime };
  }

  async resolveCoordinatesByIndex(req: {
    kind: any;
    query: string | string[];
    scope?: Scope;
    limit?: number;
  }): Promise<{ candidates: Array<{ spatial: SpatialKey; temporalHint?: TemporalBounds; score: number }> }> {
    const q = Array.isArray(req.query) ? req.query : [req.query];
    const limit = req.limit ?? 25;

    const idx = this.pickIndex(req.kind);
    const hits = new Map<string, number>(); // voxelId -> score

    for (const term of q) {
      const key = term.toLowerCase();
      const set = idx.get(key);
      if (!set) continue;
      for (const vid of set) hits.set(vid, (hits.get(vid) ?? 0) + 1);
    }

    const scored: Array<{ spatial: SpatialKey; temporalHint?: TemporalBounds; score: number }> = [];
    for (const [vid, score] of hits) {
      const v = this.voxelsById.get(vid);
      if (!v) continue;
      if (!withinScope(v, req.scope)) continue;
      scored.push({ spatial: v.spatial, temporalHint: { kind: "exact", key: v.temporal }, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return { candidates: scored.slice(0, limit) };
  }

  async searchFacesByKeyword(req: {
    query: string;
    faces: ("x+" | "x-" | "y+" | "y-" | "z+" | "z-")[];
    scope?: Scope;
    limit?: number;
  }): Promise<{ matches: Ranked<Coord>[] }> {
    const q = req.query.toLowerCase();
    const limit = req.limit ?? 25;
    const out: Ranked<Coord>[] = [];

    for (const v of this.voxels) {
      if (!withinScope(v, req.scope)) continue;
      let score = 0;

      for (const f of req.faces) {
        if (f === "x+" || f === "x-") {
          const t = (v.faces as any)[f];
          if (typeof t === "string" && t.toLowerCase().includes(q)) score += 1;
        } else if (f === "z-") {
          // Handle z- as LoreContext object (new format) or string (legacy)
          const zMinus = v.faces["z-"];
          const loreKeyStr = typeof zMinus === "string" ? zMinus : (zMinus as any)?.loreKey ?? "";
          if (loreKeyStr && typeof loreKeyStr === "string" && loreKeyStr.toLowerCase().includes(q)) score += 1;
          // Also search landmark names
          if (typeof zMinus !== "string" && (zMinus as any)?.landmarks) {
            for (const lm of (zMinus as any).landmarks) {
              if (typeof lm.name === "string" && lm.name.toLowerCase().includes(q)) { score += 1; break; }
            }
          }
        } else if (f === "y-") {
          if (v.faces["y-"]?.some((t) => typeof t === "string" && t.toLowerCase().includes(q))) score += 1;
        } else if (f === "z+") {
          if (v.faces["z+"]?.some((e) => entityMatch(e, q) || (typeof e.name === "string" && e.name.toLowerCase().includes(q)))) score += 1;
        } else if (f === "y+") {
          // keyword search doesn't apply to vectors
        }
      }

      if (score > 0) out.push({ item: { spatial: v.spatial, temporal: v.temporal }, score });
    }

    out.sort((a, b) => b.score - a.score);
    return { matches: out.slice(0, limit) };
  }

  async searchEmbeddings(req: { queryEmbedding: number[]; scope?: Scope; limit?: number }): Promise<{ matches: Ranked<Coord>[] }> {
    const limit = req.limit ?? 25;
    const out: Ranked<Coord>[] = [];

    for (const v of this.voxels) {
      if (!withinScope(v, req.scope)) continue;
      let best = -1;
      for (const emb of v.faces["y+"]) best = Math.max(best, cosine(req.queryEmbedding, emb));
      if (best > 0) out.push({ item: { spatial: v.spatial, temporal: v.temporal }, score: best });
    }

    out.sort((a, b) => b.score - a.score);
    return { matches: out.slice(0, limit) };
  }

  async readVoxel(req: { spatial: SpatialKey; temporal: TemporalKey }): Promise<{ voxel: MemoryVoxel | null }> {
    const id = formatVoxelId(req.spatial, req.temporal);
    return { voxel: this.voxelsById.get(id) ?? null };
  }

  async expandTemporal(req: { entry: Coord; expansion: ExpansionTemporal }): Promise<{ voxels: MemoryVoxel[] }> {
    const e = req.entry;
    const ex = req.expansion;

    let scope: Scope | undefined;
    if (ex.mode === "plusMinusPages") {
      scope = {
        saga: e.temporal.saga,
        book: e.temporal.book,
        chapter: e.temporal.chapter,
        temporalBounds: {
          kind: "pageRange",
          base: { saga: e.temporal.saga, book: e.temporal.book, chapter: e.temporal.chapter },
          fromPage: Math.max(0, e.temporal.page - ex.n),
          toPage: e.temporal.page + ex.n,
        },
      };
    } else if (ex.mode === "chapter") {
      scope = { saga: ex.saga, book: ex.book, chapter: ex.chapter };
    } else if (ex.mode === "sessionToSession") {
      scope = {
        saga: ex.saga,
        book: ex.book,
        temporalBounds: { kind: "chapterRange", base: { saga: ex.saga, book: ex.book }, fromChapter: Math.max(0, ex.chapter - 1), toChapter: ex.chapter + 1 },
      };
    } else if (ex.mode === "book") {
      scope = { saga: ex.saga, book: ex.book };
    } else if (ex.mode === "saga") {
      scope = { saga: ex.saga };
    }

    const out = this.voxels
      .filter((v) => withinScope(v, scope))
      .sort((a, b) => temporalCompare(a.temporal, b.temporal));
    return { voxels: out };
  }

  async expandSpatial(req: { entry: Coord; expansion: ExpansionSpatial }): Promise<{ voxels: MemoryVoxel[] }> {
    const { entry, expansion } = req;
    const fn = neighborFn(expansion.mode);

    const seen = new Set<string>();
    const frontier: SpatialKey[] = [entry.spatial];
    const coords: SpatialKey[] = [];

    const maxHops = Math.max(1, expansion.hops);
    for (let hop = 0; hop <= maxHops; hop++) {
      const next: SpatialKey[] = [];
      for (const s of frontier) {
        const key = JSON.stringify(s);
        if (seen.has(key)) continue;
        seen.add(key);
        coords.push(s);
        for (const n of fn(s)) next.push(n);
      }
      frontier.splice(0, frontier.length, ...next);
    }

    const out = this.voxels
      .filter((v) => temporalCompare(v.temporal, entry.temporal) === 0)
      .filter((v) => coords.some((s) => equalSpatial(s, v.spatial)));
    out.sort((a, b) => temporalCompare(a.temporal, b.temporal));
    return { voxels: out };
  }

  async joinAndRerank(req: {
    seed: Ranked<Coord>[];
    intentEmbedding?: number[];
    boostTags?: string[];
    requireEntities?: string[];
    limit?: number;
  }): Promise<{ matches: Ranked<Coord>[] }> {
    const limit = req.limit ?? 25;
    const boostTags = (req.boostTags ?? []).map((t) => t.toLowerCase());
    const requireEntities = (req.requireEntities ?? []).map((e) => e.toLowerCase());

    const scored: Ranked<Coord>[] = [];
    for (const s of req.seed) {
      const v = await this.readVoxel(s.item);
      if (!v.voxel) continue;

      let score = s.score;

      if (req.intentEmbedding) {
        let best = -1;
        for (const emb of v.voxel.faces["y+"]) best = Math.max(best, cosine(req.intentEmbedding, emb));
        if (best > 0) score += best;
      }

      for (const t of boostTags) {
        if (v.voxel.faces["y-"].some((x) => x.toLowerCase() === t)) score += 0.25;
      }

      if (requireEntities.length) {
        const ok = requireEntities.every((q) => v.voxel!.faces["z+"].some((e) => entityMatch(e, q)));
        if (!ok) continue;
      }

      scored.push({ item: s.item, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return { matches: scored.slice(0, limit) };
  }

  private pickIndex(kind: any): Map<string, Set<string>> {
    switch (kind) {
      case "LocationEntity":
        return this.locationIndex;
      case "PersonageEntity":
        return this.personageIndex;
      case "ProperNoun":
        return this.properNounIndex;
      case "AssociativeTags":
        return this.tagIndex;
      case "LoreKey":
        return this.loreIndex;
      case "EntityId":
        return this.entityIdIndex;
      case "EntityClass":
        return this.entityClassIndex;
      default:
        return this.locationIndex;
    }
  }
}

function equalSpatial(a: SpatialKey, b: SpatialKey): boolean {
  return a.g === b.g && a.s === b.s && a.o === b.o && a.c === b.c && a.ct === b.ct && a.r === b.r;
}

function tokenize(s: string): string[] {
  return s
    .split(/[^a-z0-9_]+/i)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 1024);
}

function addToIndex(idx: Map<string, Set<string>>, key: string, voxelId: string): void {
  const k = key.trim();
  if (!k) return;
  let set = idx.get(k);
  if (!set) {
    set = new Set<string>();
    idx.set(k, set);
  }
  set.add(voxelId);
}

function extractProperNouns(text: string): string[] {
  const m = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g);
  return (m ?? []).slice(0, 256);
}
