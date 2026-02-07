// PATH: src/config.ts
export type XPTier = "tier1" | "tier2" | "tier3" | "legendary";

export interface XPSegmentConfig {
  stepsPerSegment: number; // 7
  totalXpToLevel21: number; // 63000
  segWeights: [number, number, number]; // (0.2, 0.3, 0.5)
  r1: number; // quick 0–7
  r2: number; // drag 7–14
  r3: number; // heavy 14–21

  enemyXpWeights: Record<XPTier, number>;
  enemyXpVariance: Record<XPTier, number>;
  bestiaryToXpTier: Record<string, XPTier>;
}

export function defaultConfig(): XPSegmentConfig {
  return {
    stepsPerSegment: 7,
    totalXpToLevel21: 63_000,
    segWeights: [0.2, 0.3, 0.5],
    r1: 1.04,
    r2: 1.08,
    r3: 1.14,
    enemyXpWeights: {
      tier1: 0.2,
      tier2: 0.3,
      tier3: 0.5,
      legendary: 0.0,
    },
    enemyXpVariance: {
      tier1: 0.10,
      tier2: 0.125,
      tier3: 0.15,
      legendary: 0.0,
    },
    bestiaryToXpTier: {
      Fodder: "tier1",
      Common: "tier1",
      Uncommon: "tier2",
      Strong: "tier2",
      Elite: "tier3",
      Legendary: "legendary",
    },
  };
}
