import { Item, ItemType } from '../../types';

export const QUEST_ITEMS: Record<string, Item> = {
    // --- General / Early Game ---
    EXECUTIVES_KEYCARD: {
        key: 'EXECUTIVES_KEYCARD',
        name: 'Executive\'s Keycard',
        description: 'A high-level Core-Sys keycard. Belongs to someone important.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest',
    },
    PROTOTYPE_FTL_COIL: {
        key: 'PROTOTYPE_FTL_COIL',
        name: 'Prototype FTL Coil',
        description: 'A one-of-a-kind experimental drive coil. A fixer wants this badly.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest',
    },
    
    // --- Act I ---
    SECURITY_KEYCARD: {
        key: 'SECURITY_KEYCARD',
        name: 'Security Keycard',
        description: 'Access card for low-level security doors.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },

    // --- Act II ---
    PRISON_KEYS: {
        key: 'PRISON_KEYS',
        name: 'Prison Keys',
        description: 'Keys to a containment cell.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },

    // --- Act IV ---
    HIGH_SEC_PASS: {
        key: 'HIGH_SEC_PASS',
        name: 'High-Sec Pass',
        description: 'Access to high-security areas.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    LEGAL_IMMUNITY_CHIP: {
        key: 'LEGAL_IMMUNITY_CHIP',
        name: 'Legal Immunity Chip',
        description: 'Grants temporary immunity to scans. Highly illegal forged tech.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    CELL_KEY: {
        key: 'CELL_KEY',
        name: 'Cell Key',
        description: 'Opens a specific cell.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },

    // --- Act V ---
    REALITY_ANCHOR: {
        key: 'REALITY_ANCHOR',
        name: 'Reality Anchor',
        description: 'Stabilizes local reality against entropy.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    MEMORY_SHARD: {
        key: 'MEMORY_SHARD',
        name: 'Memory Shard',
        description: 'A fragment of lost memory.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },

    // --- Act VII ---
    ASCENSION_KEY: {
        key: 'ASCENSION_KEY',
        name: 'Ascension Key',
        description: 'Unlocks the final gate.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    THE_EIDEUS_CORE: {
        key: 'THE_EIDEUS_CORE',
        name: 'The Eideus Core',
        description: 'The heart of the system.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Game End'
    },
    NEW_UNIVERSE_SEED: {
        key: 'NEW_UNIVERSE_SEED',
        name: 'New Universe Seed',
        description: 'Restart the simulation.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    THE_PLAYERS_SOUL: {
        key: 'THE_PLAYERS_SOUL',
        name: 'The Player\'s Soul',
        description: 'Your own essence.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Special'
    }
};