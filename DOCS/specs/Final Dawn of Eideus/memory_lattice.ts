// ==============================================================================
// Final Dawn of Eideus
// Memory Lattice (TypeScript Port)
// ==============================================================================

/*
Memory Voxels are located at:

Spatial Key:  [g.s.o.c.ct.r]
Temporal Key: [s.b.c.p]

Each voxel has 6 faces:
x+ : summed input of turn
x- : summed output of turn
y+ : embeddings (max 7)
y- : tags (max 7)
z+ : entity cards
z- : lore key
*/

// ==============================================================================
// 0. KEY STRUCTURES
// ==============================================================================

export class SpatialKey {
  constructor(
    public readonly g: number,
    public readonly s: number,
    public readonly o: number,
    public readonly c: number,
    public readonly ct: number,
    public readonly r: number
  ) {}

  toString(): string {
    return `g${this.g}.s${this.s}.o${this.o}.c${this.c}.ct${this.ct}.r${this.r}`;
  }

  static fromString(key: string): SpatialKey {
    const parts = key.split(".");
    return new SpatialKey(
      parseInt(parts[0].slice(1)),
      parseInt(parts[1].slice(1)),
      parseInt(parts[2].slice(1)),
      parseInt(parts[3].slice(1)),
      parseInt(parts[4].slice(2)),
      parseInt(parts[5].slice(1))
    );
  }

  equals(other: SpatialKey): boolean {
    return this.toString() === other.toString();
  }
}

export class TemporalKey {
  constructor(
    public readonly s: number,
    public readonly b: number,
    public readonly c: number,
    public readonly p: number
  ) {}

  toString(): string {
    return `s${this.s}.b${this.b}.c${this.c}.p${this.p}`;
  }

  static fromString(key: string): TemporalKey {
    const parts = key.split(".");
    return new TemporalKey(
      parseInt(parts[0].slice(1)),
      parseInt(parts[1].slice(1)),
      parseInt(parts[2].slice(1)),
      parseInt(parts[3].slice(1))
    );
  }

  compare(other: TemporalKey): number {
    if (this.s !== other.s) return this.s - other.s;
    if (this.b !== other.b) return this.b - other.b;
    if (this.c !== other.c) return this.c - other.c;
    return this.p - other.p;
  }
}

// ==============================================================================
// 1. VOXEL
// ==============================================================================

export interface EntityCard {
  id?: string;
  name?: string;
  class?: string;
  [key: string]: any;
}

export class MemoryVoxel {
  constructor(
    public spatialKey: SpatialKey,
    public temporalKey: TemporalKey,

    // X Faces
    public xPos: string = "",
    public xNeg: string = "",

    // Y Faces
    public yPos: number[][] = [],
    public yNeg: string[] = [],

    // Z Faces
    public zPos: EntityCard[] = [],
    public zNeg: string = ""
  ) {}

  getId(): string {
    return `${this.spatialKey.toString()}::${this.temporalKey.toString()}`;
  }
}

// ==============================================================================
// 2. LATTICE MANAGER
// ==============================================================================

export class MemoryLattice {
  private voxels: Map<string, MemoryVoxel> = new Map();

  // Indexes
  private idxTags: Map<string, Set<string>> = new Map();
  private idxPersonage: Map<string, Set<string>> = new Map();
  private idxEntityId: Map<string, Set<string>> = new Map();
  private idxEntityClass: Map<string, Set<string>> = new Map();
  private idxLoreKey: Map<string, Set<string>> = new Map();

  // --------------------------------------------------------------------------
  // INGESTION
  // --------------------------------------------------------------------------

  addVoxel(voxel: MemoryVoxel): void {
    const id = voxel.getId();
    this.voxels.set(id, voxel);

    // Tags
    for (const tag of voxel.yNeg) {
      this.addToIndex(this.idxTags, tag, id);
    }

    // Entities
    for (const entity of voxel.zPos) {
      if (entity.name) {
        this.addToIndex(this.idxPersonage, entity.name, id);
      }
      if (entity.id) {
        this.addToIndex(this.idxEntityId, entity.id, id);
      }
      if (entity.class) {
        this.addToIndex(this.idxEntityClass, entity.class, id);
      }
    }

    // Lore
    if (voxel.zNeg) {
      this.addToIndex(this.idxLoreKey, voxel.zNeg, id);
    }
  }

  private addToIndex(
    index: Map<string, Set<string>>,
    key: string,
    voxelId: string
  ) {
    if (!index.has(key)) index.set(key, new Set());
    index.get(key)!.add(voxelId);
  }

  // --------------------------------------------------------------------------
  // DIRECT READS
  // --------------------------------------------------------------------------

  readVoxel(spatialStr: string, temporalStr: string): MemoryVoxel | null {
    try {
      const s = SpatialKey.fromString(spatialStr);
      const t = TemporalKey.fromString(temporalStr);
      return this.voxels.get(`${s.toString()}::${t.toString()}`) ?? null;
    } catch {
      return null;
    }
  }

  directSpatialSlice(spatialStr: string): MemoryVoxel[] {
    const sKey = SpatialKey.fromString(spatialStr);

    const results = [...this.voxels.values()].filter(v =>
      v.spatialKey.equals(sKey)
    );

    return results.sort((a, b) =>
      a.temporalKey.compare(b.temporalKey)
    );
  }

  latestAtLocation(spatialStr: string): MemoryVoxel | null {
    const slice = this.directSpatialSlice(spatialStr);
    return slice.length ? slice[slice.length - 1] : null;
  }

  firstAtLocation(spatialStr: string): MemoryVoxel | null {
    const slice = this.directSpatialSlice(spatialStr);
    return slice.length ? slice[0] : null;
  }

  rangeReadTemporal(startStr: string, endStr: string): MemoryVoxel[] {
    const start = TemporalKey.fromString(startStr);
    const end = TemporalKey.fromString(endStr);

    const results = [...this.voxels.values()].filter(v =>
      v.temporalKey.compare(start) >= 0 &&
      v.temporalKey.compare(end) <= 0
    );

    return results.sort((a, b) =>
      a.temporalKey.compare(b.temporalKey)
    );
  }

  // --------------------------------------------------------------------------
  // ENTITY TOOLS
  // --------------------------------------------------------------------------

  entityTimeline(entityId: string): MemoryVoxel[] {
    const ids = this.idxEntityId.get(entityId);
    if (!ids) return [];

    const voxels = [...ids]
      .map(id => this.voxels.get(id)!)
      .filter(Boolean);

    return voxels.sort((a, b) =>
      a.temporalKey.compare(b.temporalKey)
    );
  }

  entityEncounterWindow(
    entityId: string,
    pivot: MemoryVoxel,
    windowSize: number = 3
  ): MemoryVoxel[] {
    const pivotT = pivot.temporalKey;

    const candidates = [...this.voxels.values()].filter(v =>
      v.temporalKey.s === pivotT.s &&
      v.temporalKey.b === pivotT.b &&
      v.temporalKey.c === pivotT.c &&
      Math.abs(v.temporalKey.p - pivotT.p) <= windowSize
    );

    return candidates
      .filter(v =>
        v.zPos.some(e => e.id === entityId)
      )
      .sort((a, b) =>
        a.temporalKey.compare(b.temporalKey)
      );
  }

  // --------------------------------------------------------------------------
  // TAG TOOLS
  // --------------------------------------------------------------------------

  associativeJump(voxel: MemoryVoxel): Map<string, MemoryVoxel[]> {
    const results = new Map<string, MemoryVoxel[]>();

    for (const tag of voxel.yNeg) {
      const ids = this.idxTags.get(tag);
      if (!ids) continue;

      const related = [...ids]
        .filter(id => id !== voxel.getId())
        .map(id => this.voxels.get(id)!)
        .filter(Boolean);

      results.set(tag, related);
    }

    return results;
  }
}
