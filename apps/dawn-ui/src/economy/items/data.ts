import { Item, ItemType } from '../../types';

export const DATA_ITEMS: Record<string, Item> = {
    // --- Standard Data ---
    ENCRYPTED_SHIP_MANIFEST: {
        key: 'ENCRYPTED_SHIP_MANIFEST',
        name: 'Encrypted Ship Manifest',
        description: 'A corporate manifest, locked tight. Contains cargo data. Could be valuable to pirates... or the competition.',
        itemType: ItemType.DATA,
        baseValue: 700,
        isTradable: true,
        resourceType: 'Quantum Data',
    },
    BLACKMAIL_FILES: {
        key: 'BLACKMAIL_FILES',
        name: 'Blackmail Files',
        description: 'Incriminating data on a mid-level Core-Sys executive. A risky, but profitable, thing to hold.',
        itemType: ItemType.DATA,
        baseValue: 4000,
        isTradable: true,
        resourceType: 'Quantum Data',
    },
    FRINGE_JUMP_ROUTES: {
        key: 'FRINGE_JUMP_ROUTES',
        name: 'Fringe Jump Routes',
        description: 'A set of unsanctioned FTL coordinates, leading to hidden stations and asteroid bases.',
        itemType: ItemType.DATA,
        baseValue: 2500,
        isTradable: true,
        resourceType: 'Quantum Data',
    },
    COMBINE_PATROL_TIMETABLE: {
        key: 'COMBINE_PATROL_TIMETABLE',
        name: 'Combine Patrol Timetable',
        description: 'A stolen timetable of Peacekeeper patrols for this sector. Useful for smuggling.',
        itemType: ItemType.DATA,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'Quantum Data',
    },
    QUANTUM_DATA: {
        key: 'QUANTUM_DATA',
        name: 'Quantum Data',
        description: 'A data slate containing encrypted information. Potentially valuable.',
        itemType: ItemType.DATA, // Corrected type from RESOURCE to DATA
        baseValue: 500,
        isTradable: true,
        resourceType: 'Quantum Data',
    },

    // --- Act I Data ---
    DATA_PAD: {
        key: 'DATA_PAD',
        name: 'Data Pad',
        description: 'Contains mundane logs and personal notes from a worker drone.',
        itemType: ItemType.DATA,
        baseValue: 25,
        isTradable: true,
        resourceType: 'Data'
    },

    // --- Act II Data ---
    CENSORED_FILE: {
        key: 'CENSORED_FILE',
        name: 'Censored File',
        description: 'Most of the text is redacted by the Compliance Matrix.',
        itemType: ItemType.DATA,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Quantum Data'
    },
    TAX_RECORD: {
        key: 'TAX_RECORD',
        name: 'Tax Record',
        description: 'Boring but valuable to the right clerk.',
        itemType: ItemType.DATA,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Data'
    },
    WEAPON_LICENSE: {
        key: 'WEAPON_LICENSE',
        name: 'Weapon License',
        description: 'A forged or legitimate permit for firearms.',
        itemType: ItemType.DATA,
        baseValue: 200,
        isTradable: true,
        resourceType: 'Data'
    },
    LAW_CODEX: {
        key: 'LAW_CODEX',
        name: 'Law Codex',
        description: 'A digital copy of the Technocracy\'s infinite laws.',
        itemType: ItemType.DATA,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Data'
    },

    // --- Act III Data ---
    CORRUPTED_MEMORY: {
        key: 'CORRUPTED_MEMORY',
        name: 'Corrupted Memory',
        description: 'A fragmented data shard from a Glitch entity.',
        itemType: ItemType.DATA,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Quantum Data'
    },

    // --- Act IV Data ---
    FAKE_ID: {
        key: 'FAKE_ID',
        name: 'Fake ID',
        description: 'A high-quality forgery used by Black Circuit agents.',
        itemType: ItemType.DATA,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Data'
    },

    // --- Act V Data ---
    PERSONAL_DIARY: {
        key: 'PERSONAL_DIARY',
        name: 'Personal Diary',
        description: 'Notes from a deceased scavenger found in the Whisper Zone.',
        itemType: ItemType.DATA,
        baseValue: 20,
        isTradable: true,
        resourceType: 'Data'
    },
    HIDDEN_STASH_MAP: {
        key: 'HIDDEN_STASH_MAP',
        name: 'Hidden Stash Map',
        description: 'Coordinates to a cache hidden in time.',
        itemType: ItemType.DATA,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Data'
    },

    // --- Act VI Data ---
    FINAL_WORDS: {
        key: 'FINAL_WORDS',
        name: 'Final Words',
        description: 'Last recording of a doomed soul caught in the Fading Light.',
        itemType: ItemType.DATA,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Data'
    },

    // --- Act VII Data ---
    SYSTEM_CODE: {
        key: 'SYSTEM_CODE',
        name: 'System Code',
        description: 'Raw code of the universe extracted from a Node.',
        itemType: ItemType.DATA,
        baseValue: 500,
        isTradable: true,
        resourceType: 'Data'
    },
    ALGORITHM_SCROLL: {
        key: 'ALGORITHM_SCROLL',
        name: 'Algorithm Scroll',
        description: 'Ancient code written on parchment. A physical backup of reality.',
        itemType: ItemType.DATA,
        baseValue: 400,
        isTradable: true,
        resourceType: 'Data'
    },
    
    // --- Endgame Data ---
    ADMINISTRATOR_ACCESS: {
        key: 'ADMINISTRATOR_ACCESS',
        name: 'Administrator Access',
        description: 'God-mode privileges for the Lattice.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    },
    DEVELOPERS_NOTE: {
        key: 'DEVELOPERS_NOTE',
        name: 'Developer\'s Note',
        description: 'A message from the architects of this simulation.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    },
    CREDITS_CHIP: {
        key: 'CREDITS_CHIP',
        name: 'Credits Chip',
        description: 'Contains the names of those who built this world.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    },
    ROOT_ACCESS: {
        key: 'ROOT_ACCESS',
        name: 'Root Access',
        description: 'Deep system control. Dangerous in the wrong hands.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    },
    USER_ACCESS: {
        key: 'USER_ACCESS',
        name: 'User Access',
        description: 'Standard permissions for the new reality.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    }
};