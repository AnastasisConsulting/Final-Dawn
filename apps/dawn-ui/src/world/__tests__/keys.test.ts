import { describe, it, expect } from 'vitest';
import {
  makeLocKey,
  parseLocKey,
  makeVoxelKey,
  parseVoxelKey,
  voxelToHypercube,
  hypercubeToSliceLocKeys,
  voxelToTemporalLayer,
} from '../keys';

describe('keys helpers', () => {
  it('round-trips locKey parse/create', () => {
    const key = makeLocKey(2, 1, 5);
    const parsed = parseLocKey(key);
    expect(parsed).toEqual({ t: 2, m: 1, e: 5 });
  });

  it('builds voxel keys and parses them', () => {
    const loc = makeLocKey(0, 0, 3);
    const voxel = makeVoxelKey(loc, 6, 4);
    const parsed = parseVoxelKey(voxel);
    expect(parsed.locKey).toBe(loc);
    expect(parsed.u).toBe(6);
    expect(parsed.v).toBe(4);
  });

  it('maps voxel coords to hypercube respecting system axis', () => {
    const locX = makeLocKey(0, 0, 2); // axis x
    const locY = makeLocKey(0, 1, 2); // axis y
    const locZ = makeLocKey(0, 2, 2); // axis z
    expect(voxelToHypercube(locX, 1, 1)).toEqual({ x: 2, y: 1, z: 1 });
    expect(voxelToHypercube(locY, 1, 1)).toEqual({ x: 1, y: 2, z: 1 });
    expect(voxelToHypercube(locZ, 1, 1)).toEqual({ x: 1, y: 1, z: 2 });
  });

  it('computes slice locKeys from a hypercube coord', () => {
    const locs = hypercubeToSliceLocKeys(1, { x: 3, y: 4, z: 5 });
    expect(locs).toEqual({
      xSlice: 't1.m0.e3',
      ySlice: 't1.m1.e4',
      zSlice: 't1.m2.e5',
    });
  });

  it('maps voxel to temporal layer using transform vertical axis', () => {
    const locT0 = makeLocKey(0, 0, 1);
    const locT1 = makeLocKey(1, 0, 1);
    const locT2 = makeLocKey(2, 0, 1);
    expect(voxelToTemporalLayer(locT0, 2, 3)).toBe(voxelToHypercube(locT0, 2, 3).x);
    expect(voxelToTemporalLayer(locT1, 2, 3)).toBe(voxelToHypercube(locT1, 2, 3).y);
    expect(voxelToTemporalLayer(locT2, 2, 3)).toBe(voxelToHypercube(locT2, 2, 3).z);
  });
});
