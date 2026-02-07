// PATH: src/ledger.ts
import { XPTable, buildXpTables } from "./xpTables.js";

export type Mode = "WORLD" | "FLIGHT";
export type Tier = "T1" | "T2" | "T3";

export interface BucketStats {
    cap: number;
    earned: number;
    nullFactorApplied: boolean;
}

export interface XpLedger {
    sagaKey: string;
    groupIndex: number; // 0..6 (represents levels 1-3, 4-6, ..., 19-21)
    buckets: Record<string, BucketStats>;
}

const NULL_FACTOR = 0.001;
const DEFAULT_TABLE = buildXpTables();

/**
 * Bucket Key Format: G{group}|{MODE}|{TIER}|{ENEMYTYPE}
 */
export function getBucketKey(group: number, mode: Mode, tier: Tier, enemyTypeId: string): string {
    return `G${group}|${mode}|${tier}|${enemyTypeId}`;
}

/**
 * Calculates the XP delta for a group of 3 levels.
 * Group 0: Levels 1-3 (totalToReach[3] - totalToReach[0])
 * ...
 * Group 6: Levels 19-21 (totalToReach[21] - totalToReach[18])
 */
export function getDeltaXpForGroup(group: number, table: XPTable = DEFAULT_TABLE): number {
    const startLevel = group * 3;
    const endLevel = (group + 1) * 3;
    return table.totalToReach[endLevel] - table.totalToReach[startLevel];
}

/**
 * Initialized the ledger for a specific group.
 */
export function initializeLedger(sagaKey: string, group: number, table: XPTable = DEFAULT_TABLE): XpLedger {
    const deltaXp = getDeltaXpForGroup(group, table);
    const combatBudget = 0.5 * deltaXp;
    const modeBudget = 0.5 * combatBudget; // World or Flight

    const tierWeights: Record<Tier, number> = {
        T1: 0.2, // Common
        T2: 0.3, // Medium
        T3: 0.5, // Hard
    };

    const ledger: XpLedger = {
        sagaKey,
        groupIndex: group,
        buckets: {},
    };

    const modes: Mode[] = ["WORLD", "FLIGHT"];
    const tiers: Tier[] = ["T1", "T2", "T3"];

    modes.forEach((mode) => {
        tiers.forEach((tier) => {
            const tierBudget = tierWeights[tier] * modeBudget;
            const enemyTypeBudget = tierBudget / 10; // 10 enemy types per tier
            const capPerType = enemyTypeBudget; // Total XP for 10 kills of this type

            // We don't pre-fill all 10 enemy types as we might not know their IDs yet.
            // But we can store the calculated cap for when they are encountered.
        });
    });

    return ledger;
}

/**
 * Calculates the XP award for killing an enemy, taking the ledger into account.
 */
export function calculateAward(
    ledger: XpLedger,
    mode: Mode,
    tier: Tier,
    enemyTypeId: string,
    baseXpVariation: number = 0 // Optional flavor variance
): { award: number; capped: boolean } {
    const group = ledger.groupIndex;
    const deltaXp = getDeltaXpForGroup(group);
    const combatBudget = 0.5 * deltaXp;
    const modeBudget = 0.5 * combatBudget;

    const tierWeights: Record<Tier, number> = {
        T1: 0.2,
        T2: 0.3,
        T3: 0.5,
    };

    const tierBudget = tierWeights[tier] * modeBudget;
    const enemyTypeBudget = tierBudget / 10;
    const xpPerKill = enemyTypeBudget / 10; // 10 kills to consume budget

    const key = getBucketKey(group, mode, tier, enemyTypeId);
    if (!ledger.buckets[key]) {
        ledger.buckets[key] = {
            cap: enemyTypeBudget,
            earned: 0,
            nullFactorApplied: false,
        };
    }

    const bucket = ledger.buckets[key];
    let award = xpPerKill + baseXpVariation;
    let capped = false;

    if (bucket.earned >= bucket.cap) {
        award = award * NULL_FACTOR;
        bucket.nullFactorApplied = true;
        capped = true;
    } else {
        // Check if this award would overflow the cap
        if (bucket.earned + award > bucket.cap) {
            const remainingBeforeCap = bucket.cap - bucket.earned;
            const overflow = (bucket.earned + award) - bucket.cap;
            award = remainingBeforeCap + (overflow * NULL_FACTOR);
            bucket.nullFactorApplied = true;
            capped = true;
        }
    }

    bucket.earned += award;
    return { award: Math.floor(award), capped };
}
