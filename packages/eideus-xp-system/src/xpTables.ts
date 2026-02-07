// PATH: src/xpTables.ts
import { defaultConfig, type XPSegmentConfig } from "./config.js";
import { PiecewiseGeometricCurve, enforceMonotonicIntSteps } from "./curves.js";

export interface XPTable {
  xpToNext: Record<number, number>;     // 0..20
  totalToReach: Record<number, number>; // 0..21
  totalXp: number;
}

export function buildXpTables(cfg: XPSegmentConfig = defaultConfig()): XPTable {
  const segSteps = cfg.stepsPerSegment;
  const totalSteps = segSteps * 3; // 21
  const totalXp = cfg.totalXpToLevel21;

  const [w1, w2, w3] = cfg.segWeights;
  const segTotals: [number, number, number] = [totalXp * w1, totalXp * w2, totalXp * w3];

  const curve = new PiecewiseGeometricCurve(segSteps, cfg.r1, cfg.r2, cfg.r3);
  const floatSteps = curve.build(segTotals);
  const intSteps = enforceMonotonicIntSteps(floatSteps, totalXp);

  const xpToNext: Record<number, number> = {};
  const totalToReach: Record<number, number> = { 0: 0 };

  let running = 0;
  for (let i = 1; i <= totalSteps; i++) {
    const xp = intSteps[i - 1];
    const levelFrom = i - 1;
    xpToNext[levelFrom] = xp;
    running += xp;
    totalToReach[i] = running;
  }

  return { xpToNext, totalToReach, totalXp };
}

export function xpStepForLevel(level: number, table: XPTable): number {
  if (level < 0 || level > 20) throw new Error("level must be 0..20");
  return table.xpToNext[level];
}

// --- Helpers for UI / Game Context ---

const DEFAULT_TABLE = buildXpTables();

export function calculateLevelFromXp(currentXp: number): number {
  // Find the highest level where totalToReach <= currentXp
  // Max level is 21 (since totalToReach covers indices 0..21)
  // Actually, level 0 requires 0 XP. Level 1 requires totalToReach[1].
  // If currentXp < totalToReach[1], we are Level 0.

  for (let lvl = 21; lvl >= 0; lvl--) {
    if (currentXp >= DEFAULT_TABLE.totalToReach[lvl]) {
      return lvl;
    }
  }
  return 0;
}

export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 21) return 0; // Max level cap
  return DEFAULT_TABLE.xpToNext[currentLevel];
}

export function getTotalXpForLevel(level: number): number {
  return DEFAULT_TABLE.totalToReach[level] || 0;
}
