// /src/memory/keys.ts
import { SpatialKey, TemporalKey, SpatialPrefix } from "./types.js";

export function formatSpatialKey(k: SpatialKey): string {
  return `g${k.g}.s${k.s}.o${k.o}.c${k.c}.ct${k.ct}.r${k.r}`;
}

export function parseSpatialKey(s: string): SpatialKey {
  const m = s.match(/^g(\d+)\.s(\d+)\.o(\d+)\.c(\d+)\.ct(\d+)\.r(\d+)$/);
  if (!m) throw new Error(`Invalid SpatialKey string: ${s}`);
  return { g: +m[1], s: +m[2], o: +m[3], c: +m[4], ct: +m[5], r: +m[6] };
}

export function formatTemporalKey(k: TemporalKey): string {
  return `s${k.saga}.b${k.book}.c${k.chapter}.p${k.page}`;
}

export function parseTemporalKey(s: string): TemporalKey {
  const m = s.match(/^s(\d+)\.b(\d+)\.c(\d+)\.p(\d+)$/);
  if (!m) throw new Error(`Invalid TemporalKey string: ${s}`);
  return { saga: +m[1], book: +m[2], chapter: +m[3], page: +m[4] };
}

export function formatVoxelId(spatial: SpatialKey, temporal: TemporalKey): string {
  return `${formatSpatialKey(spatial)}|${formatTemporalKey(temporal)}`;
}

export function spatialMatchesPrefix(key: SpatialKey, prefix: SpatialPrefix): boolean {
  if ("g" in prefix && key.g !== prefix.g) return false;
  if ("s" in prefix && key.s !== prefix.s) return false;
  if ("o" in prefix && key.o !== prefix.o) return false;
  if ("c" in prefix && key.c !== prefix.c) return false;
  if ("ct" in prefix && key.ct !== prefix.ct) return false;
  if ("r" in prefix && key.r !== prefix.r) return false;
  return true;
}
