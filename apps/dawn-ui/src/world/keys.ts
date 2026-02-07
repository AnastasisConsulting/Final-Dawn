// src/world/keys.ts
// Canonical key helpers for LocKey slices and voxel/hypercube mapping.

export type Axis = 'x' | 'y' | 'z';
export type TransformId = 0 | 1 | 2; // galaxy/state
export type SystemId = 0 | 1 | 2; // axis handle
export type ExploreId = 0 | 1 | 2 | 3 | 4 | 5 | 6; // layer index

export type LocKey = `t${TransformId}.m${SystemId}.e${ExploreId}`;
export type VoxelKey = `${LocKey}:(${number},${number})`;
export type VolVoxelKey = `${LocKey}:(${number},${number},${number})`;

export type HyperCoord = { x: number; y: number; z: number };

export interface ParsedLocKey {
  t: TransformId;
  m: SystemId;
  e: ExploreId;
}

export function verticalAxisForTransform(t: TransformId): Axis {
  if (t === 0) return 'x';
  if (t === 1) return 'y';
  return 'z';
}

// Star systems are the x/y/z axis handles (fixed mapping).
export function axisForSystem(m: SystemId): Axis {
  if (m === 0) return 'x';
  if (m === 1) return 'y';
  return 'z';
}

export function makeLocKey(t: TransformId, m: SystemId, e: ExploreId): LocKey {
  return `t${t}.m${m}.e${e}`;
}

export function parseLocKey(locKey: string): ParsedLocKey {
  const match = /^t([0-2])\.m([0-2])\.e([0-6])$/.exec(locKey);
  if (!match) throw new Error(`Invalid LocKey: ${locKey}`);
  const t = Number(match[1]) as TransformId;
  const m = Number(match[2]) as SystemId;
  const e = Number(match[3]) as ExploreId;
  return { t, m, e };
}

export function makeVoxelKey(locKey: LocKey, u: number, v: number): VoxelKey {
  if (!Number.isInteger(u) || !Number.isInteger(v) || u < 0 || u > 6 || v < 0 || v > 6) {
    throw new Error(`Voxel coords must be ints 0..6, got (${u},${v})`);
  }
  return `${locKey}:(${u},${v})`;
}

export function parseVoxelKey(voxelKey: string): { locKey: LocKey; u: number; v: number } {
  const match = /^(t[0-2]\.m[0-2]\.e[0-6]):\((\d),(\d)\)$/.exec(voxelKey);
  if (!match) throw new Error(`Invalid VoxelKey: ${voxelKey}`);
  return { locKey: match[1] as LocKey, u: Number(match[2]), v: Number(match[3]) };
}

// Convert a cell (u,v) on the 7x7 plane of a LocKey slice into a 7x7x7 cube coordinate.
export function voxelToHypercube(locKey: LocKey, u: number, v: number): HyperCoord {
  const { m, e } = parseLocKey(locKey);
  const axis = axisForSystem(m);
  if (u < 0 || u > 6 || v < 0 || v > 6) throw new Error(`u,v must be 0..6; got ${u},${v}`);

  if (axis === 'x') return { x: e, y: u, z: v };
  if (axis === 'y') return { x: u, y: e, z: v };
  return { x: u, y: v, z: e }; // axis === 'z'
}

// Temporal “memory layer” derived from the transform’s vertical axis.
export function voxelToTemporalLayer(locKey: LocKey, u: number, v: number): number {
  const { t } = parseLocKey(locKey);
  const vertical = verticalAxisForTransform(t);
  const coord = voxelToHypercube(locKey, u, v);
  return coord[vertical];
}

// For a given (x,y,z) cube coord, get the three slice LocKeys (x-slice, y-slice, z-slice).
export function hypercubeToSliceLocKeys(t: TransformId, coord: HyperCoord): {
  xSlice: LocKey;
  ySlice: LocKey;
  zSlice: LocKey;
} {
  const x = clamp0to6(coord.x);
  const y = clamp0to6(coord.y);
  const z = clamp0to6(coord.z);
  return {
    xSlice: makeLocKey(t, 0, x as ExploreId),
    ySlice: makeLocKey(t, 1, y as ExploreId),
    zSlice: makeLocKey(t, 2, z as ExploreId),
  };
}

function clamp0to6(n: number): number {
  if (!Number.isFinite(n)) throw new Error(`Non-finite coord: ${n}`);
  const v = Math.floor(n);
  if (v < 0 || v > 6) throw new Error(`Coord out of range 0..6: ${n}`);
  return v;
}
