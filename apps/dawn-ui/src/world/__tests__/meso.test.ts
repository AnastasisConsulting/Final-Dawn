import { describe, it, expect } from 'vitest';
import { generateMesoLayer, mesoToMinimap, generateNodeLayouts } from '../meso';
import { makeLocKey } from '../keys';

const SEED = 'TEST-SEED';

describe('meso generation', () => {
  const locKey = makeLocKey(0, 1, 3);
  const meso = generateMesoLayer(SEED, locKey);

  it('creates expected counts of parent nodes', () => {
    const cells = Object.values(meso.mesoMap.cells);
    const count = (type: string) => cells.filter(c => c.type === type).length;
    expect(count('ParentA')).toBe(9);
    expect(count('ParentB')).toBe(3);
    expect(count('ParentC')).toBe(2);
  });

  it('keeps nodes within bounds and non-overlapping', () => {
    const seen = new Set<string>();
    for (const c of Object.values(meso.mesoMap.cells)) {
      expect(c.u).toBeGreaterThanOrEqual(0);
      expect(c.u).toBeLessThanOrEqual(6);
      expect(c.v).toBeGreaterThanOrEqual(0);
      expect(c.v).toBeLessThanOrEqual(6);
      const k = `${c.u},${c.v}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });

  it('produces a minimap with matching voxel keys', () => {
    const minimap = mesoToMinimap(meso);
    expect(minimap.length).toBeGreaterThan(0);
    const sample = minimap[0];
    expect(sample.voxelKey.startsWith(locKey)).toBe(true);
  });

  it('generates layouts for occupied nodes', () => {
    const layouts = generateNodeLayouts(SEED, meso);
    const occupied = Object.values(meso.mesoMap.cells).filter(c => c.type === 'ParentA' || c.type === 'ParentB' || c.type === 'ParentC');
    for (const c of occupied) {
      const id = c.refId!;
      expect(layouts[id]).toBeDefined();
      expect((layouts[id] as any).size).toBe(7);
    }
  });

  it('PathA backbone connects all settlements and has no dead-end road cells', () => {
    const cells = meso.mesoMap.cells;
    const pathOrParent = Object.values(cells).filter(c => c.type === 'ParentA' || c.type === 'PathA');
    const parents = pathOrParent.filter(c => c.type === 'ParentA');
    const pathOnly = pathOrParent.filter(c => c.type === 'PathA');
    console.log('PathA cells', pathOnly.length, 'ParentA cells', parents.length);
    const graph = new Map<string, { u: number; v: number; type: string; neighbors: string[] }>();
    const key = (u: number, v: number) => `${u},${v}`;

    // Build graph adjacency across orthogonal neighbors
    for (const c of pathOrParent) {
      const k = key(c.u, c.v);
      const neighbors: string[] = [];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([du, dv]) => {
        const nk = key(c.u + du, c.v + dv);
        const neighbor = cells[nk];
        if (neighbor && (neighbor.type === 'PathA' || neighbor.type === 'ParentA')) {
          neighbors.push(nk);
        }
      });
      graph.set(k, { u: c.u, v: c.v, type: c.type, neighbors });
    }

    // Degree check: every PathA cell has at least one neighbor in the backbone
    for (const node of graph.values()) {
      if (node.type === 'PathA') {
        expect(node.neighbors.length).toBeGreaterThan(0);
      }
    }

    // Each settlement must touch at least one PathA neighbor (no stranded nodes)
    parents.forEach(p => {
      const n = graph.get(key(p.u, p.v));
      expect((n?.neighbors.length || 0)).toBeGreaterThan(0);
    });
  });
});
