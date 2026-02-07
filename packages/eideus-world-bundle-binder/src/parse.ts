// /src/parse.ts
import { SpatialKey1, SpatialKey0 } from "./types.js";

const NPC_RE =
  /G(?<g>\d+)-S(?<s>\d+)-O(?<o>\d+)-C(?<c>\d+)-CT(?<ct>\d+)-R(?<r>\d+)-NPC/i;

// e.g. G1-S1-O1-C1-CT2-GOV
const GOV_RE =
  /G(?<g>\d+)-S(?<s>\d+)-O(?<o>\d+)-C(?<c>\d+)-CT(?<ct>\d+)-GOV/i;

// e.g. G1-S1-O1-LEAD-C1-LDR
const LEAD_RE =
  /G(?<g>\d+)-S(?<s>\d+)-O(?<o>\d+)-LEAD-C(?<c>\d+)-LDR/i;

export function parseExactSpatialFromId(id: string): { k1: SpatialKey1; k0: SpatialKey0 } | null {
  const m = id.match(NPC_RE);
  if (!m || !m.groups) return null;

  const g = parseInt(m.groups.g, 10);
  const s = parseInt(m.groups.s, 10);
  const o = parseInt(m.groups.o, 10);
  const c = parseInt(m.groups.c, 10);
  const ct = parseInt(m.groups.ct, 10);
  const r = parseInt(m.groups.r, 10);

  const k1: SpatialKey1 = { g, s, o, c, ct, r };
  const k0: SpatialKey0 = { g: g - 1, s: s - 1, o: o - 1, c: c - 1, ct: ct - 1, r: r - 1 };
  return { k1, k0 };
}

export function parsePlaceTagFromId(id: string): string | null {
  let m = id.match(NPC_RE);
  if (m?.groups) return `place:G${m.groups.g}-S${m.groups.s}-O${m.groups.o}-C${m.groups.c}-CT${m.groups.ct}-R${m.groups.r}`;

  m = id.match(GOV_RE);
  if (m?.groups) return `place:G${m.groups.g}-S${m.groups.s}-O${m.groups.o}-C${m.groups.c}-CT${m.groups.ct}`;

  m = id.match(LEAD_RE);
  if (m?.groups) return `place:G${m.groups.g}-S${m.groups.s}-O${m.groups.o}-C${m.groups.c}`;

  // fallback: world id only if present
  const w = id.match(/G\d+-S\d+-O\d+/i);
  if (w) return `place:${w[0].toUpperCase()}`;
  return null;
}

export function mkLoreKey(worldId: string, k1: SpatialKey1, label?: string): string {
  const base = `lore.${worldId}.C${k1.c}.CT${k1.ct}.R${k1.r}`;
  if (!label) return base;
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${base}.${slug}`;
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}
