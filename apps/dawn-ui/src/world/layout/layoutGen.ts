// src/world/layout/layoutGen.ts
// Minimal 7x7 surface/volume layout generators for cities/dungeons/locales.

import { seededRng, RNG } from '../rng';
import { idFor } from '../registry';

export type LayoutCellType = 'Empty' | 'Wall' | 'Floor' | 'Door' | 'POI' | 'Spawn' | 'Exit';

export interface LayoutCell {
  u: number;
  v: number;
  type: LayoutCellType;
  refId?: string;
  meta?: Record<string, string | number | boolean>;
}

export interface SurfaceLayout {
  kind: 'Surface';
  size: 7;
  cells: Record<string, LayoutCell>;
}

export interface VolumeLayout {
  kind: 'Volume';
  size: 7;
  levels: SurfaceLayout[]; // 7 levels, each 7x7
}

function keyUV(u: number, v: number): string {
  return `${u},${v}`;
}

function carveSimpleRooms(worldSeed: string, nodeId: string, rng: RNG, layout: SurfaceLayout, roomCount: number): void {
  // Start with walls, carve rooms as floor blobs + connectors.
  for (let u = 0; u < 7; u++) {
    for (let v = 0; v < 7; v++) {
      layout.cells[keyUV(u, v)] = { u, v, type: 'Wall' };
    }
  }

  const rooms: { u: number; v: number }[] = [];
  for (let i = 0; i < roomCount; i++) {
    const u = rng.int(1, 5);
    const v = rng.int(1, 5);
    rooms.push({ u, v });
    layout.cells[keyUV(u, v)] = { u, v, type: 'Floor' };
    const blob = rng.int(1, 3);
    for (let b = 0; b < blob; b++) {
      const du = rng.int(-1, 1);
      const dv = rng.int(-1, 1);
      const uu = clamp(u + du);
      const vv = clamp(v + dv);
      layout.cells[keyUV(uu, vv)] = { u: uu, v: vv, type: 'Floor' };
    }
  }

  // Connect sequentially
  for (let i = 0; i < rooms.length - 1; i++) {
    carveManhattan(layout, rooms[i], rooms[i + 1]);
  }

  // Add POIs
  const floorCells = Object.values(layout.cells).filter(c => c.type === 'Floor');
  const poiCount = rng.int(2, 5);
  for (let i = 0; i < poiCount && floorCells.length; i++) {
    const c = floorCells[rng.int(0, floorCells.length - 1)];
    layout.cells[keyUV(c.u, c.v)] = {
      u: c.u,
      v: c.v,
      type: 'POI',
      refId: idFor(worldSeed, `poi|${nodeId}|${c.u},${c.v}`),
    };
  }

  // Spawn + Exit
  const spawn = floorCells[0] ?? { u: 3, v: 3 };
  layout.cells[keyUV(spawn.u, spawn.v)] = { u: spawn.u, v: spawn.v, type: 'Spawn' };
  const exit = floorCells[floorCells.length - 1] ?? { u: 6, v: 6 };
  layout.cells[keyUV(exit.u, exit.v)] = { u: exit.u, v: exit.v, type: 'Exit' };
}

function carveManhattan(layout: SurfaceLayout, a: { u: number; v: number }, b: { u: number; v: number }) {
  let u = a.u;
  let v = a.v;
  while (u !== b.u) {
    u += u < b.u ? 1 : -1;
    layout.cells[keyUV(u, v)] = { u, v, type: 'Floor' };
  }
  while (v !== b.v) {
    v += v < b.v ? 1 : -1;
    layout.cells[keyUV(u, v)] = { u, v, type: 'Floor' };
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(6, n));
}

export function generateSurfaceLayout(worldSeed: string, nodeId: string): SurfaceLayout {
  const rng = seededRng(worldSeed, `surface|${nodeId}`);
  const layout: SurfaceLayout = { kind: 'Surface', size: 7, cells: {} as Record<string, LayoutCell> };
  carveSimpleRooms(worldSeed, nodeId, rng, layout, rng.int(4, 9));
  return layout;
}

export function generateVolumeLayout(worldSeed: string, nodeId: string): VolumeLayout {
  const rng = seededRng(worldSeed, `volume|${nodeId}`);
  const levels: SurfaceLayout[] = [];
  for (let z = 0; z < 7; z++) {
    const lvl = generateSurfaceLayout(worldSeed, `${nodeId}|z${z}`);
    // Add a stair/door per level to imply vertical traversal
    const stairU = rng.int(1, 5);
    const stairV = rng.int(1, 5);
    lvl.cells[keyUV(stairU, stairV)] = { u: stairU, v: stairV, type: 'Door', meta: { z } };
    levels.push(lvl);
  }
  return { kind: 'Volume', size: 7, levels };
}

export function chooseLayoutKind(worldSeed: string, nodeId: string, hint?: 'surface' | 'volume'): 'surface' | 'volume' {
  if (hint) return hint;
  const rng = seededRng(worldSeed, `layoutKind|${nodeId}`);
  return rng.chance(0.35) ? 'volume' : 'surface';
}
