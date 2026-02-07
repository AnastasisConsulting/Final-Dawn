// PATH: src/enemyXp.ts
import { defaultConfig, type XPSegmentConfig, type XPTier } from "./config.js";
import { buildXpTables, xpStepForLevel } from "./xpTables.js";

export interface EnemyXPTierRange {
  tier: XPTier;
  nominal: number;
  lo: number;
  hi: number;
}

export function mapBestiaryTierToXpTier(
  bestiaryTier: string,
  cfg: XPSegmentConfig = defaultConfig()
): XPTier {
  const t = cfg.bestiaryToXpTier[bestiaryTier];
  if (!t) throw new Error(`Unknown bestiary tier: ${bestiaryTier}`);
  return t;
}

export function enemyXpRangesForLevel(
  level: number,
  cfg: XPSegmentConfig = defaultConfig()
): Record<XPTier, EnemyXPTierRange> {
  const table = buildXpTables(cfg);
  if (level < 0 || level > 20) throw new Error("level must be 0..20 (BaseXP uses xpToNext(level))");
  const baseXp = xpStepForLevel(level, table);

  const out = {} as Record<XPTier, EnemyXPTierRange>;
  (Object.keys(cfg.enemyXpWeights) as XPTier[]).forEach((tier) => {
    const w = cfg.enemyXpWeights[tier];
    if (tier === "legendary" || w === 0) {
      out[tier] = { tier, nominal: 0, lo: 0, hi: 0 };
      return;
    }
    const nominal = Math.round(baseXp * w);
    const v = cfg.enemyXpVariance[tier] ?? 0;
    const lo = Math.floor(nominal * (1 - v));
    const hi = Math.ceil(nominal * (1 + v));
    out[tier] = { tier, nominal, lo, hi };
  });

  return out;
}
