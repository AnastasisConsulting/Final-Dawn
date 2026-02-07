// apps/dawn-ui/src/economy/loot.ts
import { BestiaryManager } from 'eideus-bestiary';
import { Item } from '../context/GameContext';

/**
 * Generates loot based on the system's master loot table and enemy tier.
 */
export function generateEnemyLoot(systemId: string, enemyId: string): Item[] {
    const bestiary = BestiaryManager.getBestiary(systemId);
    if (!bestiary) return [];

    const enemy = BestiaryManager.getEnemy(systemId, enemyId);
    if (!enemy) return [];

    const loot: Item[] = [];
    const table = bestiary.master_loot_table;

    // 1. Currency (Slag/CrypC)
    if (table.currency) {
        const amount = Math.floor(Math.random() * (table.currency.max - table.currency.min + 1)) + table.currency.min;
        loot.push({
            id: table.currency.type.toLowerCase(),
            name: table.currency.type,
            type: 'RESOURCE',
            rarity: 'common',
            count: amount
        });
    }

    // 2. Tiered Drops
    // Fodder/Common: 1-2 Common
    // Uncommon: 1 Common, 1 Uncommon
    // Strong: 1-2 Uncommon, 1 Rare
    // Elite: 2 Uncommon, 1 Rare, 10% Epic
    // Legendary: 1 Epic, 1 Legendary (Core)

    const rollItem = (pool: string[], rarity: Item['rarity'], type: Item['type'] = 'RESOURCE'): Item => {
        const name = pool[Math.floor(Math.random() * pool.length)];
        return {
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name,
            type,
            rarity
        };
    };

    if (enemy.tier === "Fodder" || enemy.tier === "Common") {
        loot.push(rollItem(table.common, 'common'));
    } else if (enemy.tier === "Uncommon") {
        loot.push(rollItem(table.common, 'common'));
        if (Math.random() < 0.5) loot.push(rollItem(table.uncommon, 'rare'));
    } else if (enemy.tier === "Strong") {
        loot.push(rollItem(table.uncommon, 'rare'));
        loot.push(rollItem(table.rare, 'epic', 'WEAPON'));
    } else if (enemy.tier === "Elite") {
        loot.push(rollItem(table.uncommon, 'rare'));
        loot.push(rollItem(table.rare, 'epic', 'WEAPON'));
        if (Math.random() < 0.2) loot.push(rollItem(table.epic, 'legendary', 'WEAPON'));
    } else if (enemy.tier === "Legendary") {
        loot.push(rollItem(table.epic, 'legendary', 'WEAPON'));
        loot.push(rollItem(table.legendary, 'legendary', 'RESOURCE'));
    }

    return loot;
}
