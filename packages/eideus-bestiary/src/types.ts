// packages/eideus-bestiary/src/types.ts

export type Tier = "Fodder" | "Common" | "Uncommon" | "Strong" | "Elite" | "Legendary";

export interface Stats {
    HP: number;
    Resource?: number;
    Strength?: number;
    Agility?: number;
    Endurance?: number;
    Intelligence?: number;
    Perception?: number;
    Charisma?: number;
}

export interface Enemy {
    id: string;
    name: string;
    tier: Tier;
    description?: string;
    stats_scaling?: {
        level_1: Stats;
        level_21: Stats;
    };
    actions?: string[];
    aiProfile?: string;
}

export interface RareEnemy extends Omit<Enemy, 'tier'> {
    chance: number;
    loot_bonus: string;
    behavior: string;
}

export interface Archetype {
    description: string;
    variants: Enemy[];
}

export interface Bestiary {
    meta: {
        system_id: string;
        system_name: string;
        theme: string;
        fractal_structure: string;
    };
    legendary: Enemy;
    archetypes: Record<string, Archetype>;
    rares: RareEnemy[];
    master_loot_table: Record<string, any>;
}
