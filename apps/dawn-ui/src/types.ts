// Economy-specific types for items, trading, and inventory

export enum ItemType {
    WEAPON = 'WEAPON',
    SHIP_WEAPON = 'SHIP_WEAPON',
    ARMOR = 'ARMOR',
    SHIP_MODULE = 'SHIP_MODULE',
    CYBERNETIC = 'CYBERNETIC',
    CONSUMABLE = 'CONSUMABLE',
    RESOURCE = 'RESOURCE',
    COMMODITY = 'COMMODITY',
    DATA = 'DATA',
    JUNK = 'JUNK',
    LUXURY = 'LUXURY',
    QUEST = 'QUEST',
}

export interface ItemStats {
    damage?: number;
    range?: number;
    defense?: number;
    health?: number;
    energy?: number;
    speed?: number;
    capacity?: number;
    procChance?: number;
    effectDescription?: string;
}

export interface Item {
    key: string;
    name: string;
    description: string;
    itemType: ItemType;
    baseValue: number;
    isTradable: boolean;
    resourceType: string;
    level?: number;
    stats?: ItemStats;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    stackable?: boolean;
    maxStack?: number;
}

// Inventory item with quantity
export interface InventoryItem {
    item: Item;
    quantity: number;
}

// Player inventory type
export type Inventory = Record<string, number>;
