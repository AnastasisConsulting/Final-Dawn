import { Item, ItemType } from '../../types';

export const LUXURY: Record<string, Item> = {
    // --- Standard Luxury ---
    ALTAIRIAN_WINE: {
        key: 'ALTAIRIAN_WINE',
        name: 'Altairian Wine',
        description: 'A bottle of vintage wine from a terraformed paradise world. Worth more than a freighter-full of ore.',
        itemType: ItemType.LUXURY,
        baseValue: 10000,
        isTradable: true,
        resourceType: 'Luxury Goods',
    },
    CENTAURI_SILK: {
        key: 'CENTAURI_SILK',
        name: 'Centauri Silk',
        description: 'A bolt of genetically-engineered silk, impossibly light and strong. Hoarded by Core-Sys elites.',
        itemType: ItemType.LUXURY,
        baseValue: 18000,
        isTradable: true,
        resourceType: 'Luxury Goods',
    },
    PRECURSOR_ART: {
        key: 'PRECURSOR_ART',
        name: 'Precursor Art',
        description: 'A small, impossibly-shaped sculpture of unknown origin. Has no function, but is a status symbol for the ultra-rich.',
        itemType: ItemType.LUXURY,
        baseValue: 80000,
        isTradable: true,
        resourceType: 'Luxury Goods',
    },

    // --- Act II Luxury ---
    GOLDEN_GAVEL: {
        key: 'GOLDEN_GAVEL',
        name: 'Golden Gavel',
        description: 'A ceremonial gavel made of solid gold. Used by high-ranking Magistrates.',
        itemType: ItemType.LUXURY,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'Luxury Goods',
        level: 6
    },

    // --- Act III Luxury ---
    WAR_MEDAL: {
        key: 'WAR_MEDAL',
        name: 'War Medal',
        description: 'A commendation for bravery in a lost war. Collectors value the history.',
        itemType: ItemType.LUXURY,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Luxury Goods',
        level: 8
    },
    TIMELESS_GEM: {
        key: 'TIMELESS_GEM',
        name: 'Timeless Gem',
        description: 'A gem that seems unaffected by entropy. It glows with an inner light.',
        itemType: ItemType.LUXURY,
        baseValue: 4000,
        isTradable: true,
        resourceType: 'Luxury Goods',
        level: 9
    },

    // --- Act V Luxury ---
    TIME_LOST_COIN: {
        key: 'TIME_LOST_COIN',
        name: 'Time-Lost Coin',
        description: 'Currency from a fallen empire. Collectors value it highly.',
        itemType: ItemType.LUXURY, // Can also be JUNK, but high value fits LUXURY
        baseValue: 500,
        isTradable: true,
        resourceType: 'Luxury Goods',
        level: 13
    },
    LOOP_RING: {
        key: 'LOOP_RING',
        name: 'Loop Ring',
        description: 'A ring that has no beginning or end. It feels warm.',
        itemType: ItemType.LUXURY,
        baseValue: 2500,
        isTradable: true,
        resourceType: 'Jewelry',
        level: 15
    }
};