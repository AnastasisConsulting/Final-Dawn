// /src/contracts.ts
import { UniverseMap, SpatialKey } from "./types";

export type ResolveByPathRequest = { universe: UniverseMap; path: string };
export type ResolveByPathResponse = { key: SpatialKey | null };

export type ResolveByNameRequest = { universe: UniverseMap; name: string };
export type ResolveByNameResponse = { matches: Array<{ name: string; path: string; key: SpatialKey }> };

export function resolveByPath(req: ResolveByPathRequest): ResolveByPathResponse {
  const norm = req.path.replace(/\\/g, "/").toLowerCase();

  const walk = (nodes: any[]): any | null => {
    for (const n of nodes) {
      const p = String(n.path).replace(/\\/g, "/").toLowerCase();
      if (p === norm) return n;
      if (n.children) {
        const hit = walk(n.children);
        if (hit) return hit;
      }
    }
    return null;
  };

  const hit = walk(req.universe.galaxies as any[]);
  return { key: hit?.key ?? null };
}

export function resolveByName(req: ResolveByNameRequest): ResolveByNameResponse {
  const q = req.name.toLowerCase();
  const matches: Array<{ name: string; path: string; key: SpatialKey }> = [];

  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (String(n.name).toLowerCase().includes(q)) matches.push({ name: n.name, path: n.path, key: n.key });
      if (n.children) walk(n.children);
    }
  };
  walk(req.universe.galaxies as any[]);
  return { matches };
}
