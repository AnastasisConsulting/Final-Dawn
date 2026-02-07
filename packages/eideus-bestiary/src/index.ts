// packages/eideus-bestiary/src/index.ts
import { Bestiary, Enemy, Tier, RareEnemy } from "./types.js";

// Import all system bestiaries
import G1S1 from "./G1-S1.json" assert { type: "json" };
import G1S2 from "./G1-S2.json" assert { type: "json" };
import G1S3 from "./G1-S3.json" assert { type: "json" };
import G2S1 from "./G2-S1.json" assert { type: "json" };
import G2S2 from "./G2-S2.json" assert { type: "json" };
import G2S3 from "./G2-S3.json" assert { type: "json" };
import G3S1 from "./G3-S1.json" assert { type: "json" };
import G3S2 from "./G3-S2.json" assert { type: "json" };
import G3S3 from "./G3-S3.json" assert { type: "json" };

const bestiaries: Record<string, Bestiary> = {
    "G1-S1": G1S1 as unknown as Bestiary,
    "G1-S2": G1S2 as unknown as Bestiary,
    "G1-S3": G1S3 as unknown as Bestiary,
    "G2-S1": G2S1 as unknown as Bestiary,
    "G2-S2": G2S2 as unknown as Bestiary,
    "G2-S3": G2S3 as unknown as Bestiary,
    "G3-S1": G3S1 as unknown as Bestiary,
    "G3-S2": G3S2 as unknown as Bestiary,
    "G3-S3": G3S3 as unknown as Bestiary,
};

export class BestiaryManager {
    static getBestiary(systemId: string): Bestiary | null {
        return bestiaries[systemId] || null;
    }

    static getEnemy(systemId: string, enemyId: string): Enemy | null {
        const b = this.getBestiary(systemId);
        if (!b) return null;

        if (b.legendary.id === enemyId) return b.legendary;

        for (const archetypeKey in b.archetypes) {
            const archetype = b.archetypes[archetypeKey];
            const variant = archetype.variants.find(v => v.id === enemyId);
            if (variant) return variant;
        }

        const rare = b.rares.find(r => r.id === enemyId);
        if (rare) {
            return {
                ...rare,
                tier: "Elite" // Assign Elite tier for computation simplicity
            } as Enemy;
        }

        return null;
    }

    static getEnemiesByTier(systemId: string, tier: Tier): Enemy[] {
        const b = this.getBestiary(systemId);
        if (!b) return [];

        const enemies: Enemy[] = [];

        for (const archetypeKey in b.archetypes) {
            const archetype = b.archetypes[archetypeKey];
            enemies.push(...archetype.variants.filter(v => v.tier === tier));
        }

        return enemies;
    }

    /**
     * Logic-based weighted encounter selection.
     */
    static generateEncounter(systemId: string): Enemy | null {
        const b = this.getBestiary(systemId);
        if (!b) return null;

        // 1. Rare check
        for (const rare of b.rares) {
            if (Math.random() < rare.chance) {
                return {
                    ...rare,
                    tier: "Elite"
                } as Enemy;
            }
        }

        // 2. Weighted tier selection
        const roll = Math.random() * 100;
        let targetTier: Tier = "Common";

        if (roll < 30) targetTier = "Fodder";
        else if (roll < 70) targetTier = "Common";
        else if (roll < 90) targetTier = "Uncommon";
        else if (roll < 98) targetTier = "Strong";
        else targetTier = "Elite";

        const pool = this.getEnemiesByTier(systemId, targetTier);
        if (pool.length === 0) {
            const fallback = this.getEnemiesByTier(systemId, "Common");
            return fallback[Math.floor(Math.random() * fallback.length)] || null;
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }
}

export * from "./types.js";
