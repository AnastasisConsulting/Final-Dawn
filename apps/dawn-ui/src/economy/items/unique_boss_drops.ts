import { Item, ItemType } from '../../types';

export const UNIQUE_BOSS_DROPS: Record<string, Item> = {
    // === GALAXY 1: THE CORE SYNDICATE ===

    // G1-S1: Aura-507 (Boss: The Isotope King)
    THE_KINGS_CORE: {
        key: 'THE_KINGS_CORE',
        name: "The King's Core",
        description: "The pulsating, radioactive heart of the Isotope King. Warm to the touch and humming with dangerous potential.",
        itemType: ItemType.RESOURCE, 
        baseValue: 5000,
        isTradable: true,
        resourceType: 'Unique Artifact',
        level: 21,
        stats: { effectDescription: "Material for Legendary Energy Weapons" }
    },

    // G1-S2: The Foundry Core (Boss: Ignis, The Molten Heart)
    HEART_OF_THE_FURNACE: {
        key: 'HEART_OF_THE_FURNACE',
        name: "Heart of the Furnace",
        description: "A sphere of liquid metal suspended in a magnetic field. It never cools.",
        itemType: ItemType.RESOURCE,
        baseValue: 6000,
        isTradable: true,
        resourceType: 'Unique Artifact',
        level: 21,
        stats: { effectDescription: "Material for Legendary Armor" }
    },

    // G1-S3: The Regulator's Eye (Boss: Prime Adjudicator 0-1)
    GAVEL_OF_ABSOLUTE_ORDER: {
        key: 'GAVEL_OF_ABSOLUTE_ORDER',
        name: "Gavel of Absolute Order",
        description: "A heavy weapon used by the Prime Adjudicator. Strikes resonate with the authority of the Syndicate.",
        itemType: ItemType.WEAPON,
        baseValue: 12000,
        isTradable: true,
        resourceType: 'Unique Weapon',
        level: 21,
        stats: { damage: 150, range: 1, effectDescription: "Stuns on Crit" }
    },

    // === GALAXY 2: THE FADING ECHO ===

    // G2-S1: Aethel Prime (Boss: Chimera Strain Alpha)
    ALPHA_HELIX_VIAL: {
        key: 'ALPHA_HELIX_VIAL',
        name: "Alpha Helix Vial",
        description: "Pure, undiluted genetic code from the Chimera Alpha. It shifts color when looked at.",
        itemType: ItemType.CONSUMABLE,
        baseValue: 8000,
        isTradable: true,
        resourceType: 'Unique Artifact',
        level: 21,
        stats: { effectDescription: "Permanently grants +2 to a random Attribute" }
    },

    // G2-S2: Cygnus Rift-Delta (Boss: The Chrono-Eater)
    SANDS_OF_THE_RIFT: {
        key: 'SANDS_OF_THE_RIFT',
        name: "Sands of the Rift",
        description: "Dust that flows upward. Holding it feels like remembering a future that never happened.",
        itemType: ItemType.RESOURCE,
        baseValue: 7500,
        isTradable: true,
        resourceType: 'Unique Artifact',
        level: 21,
        stats: { effectDescription: "Material for Time-Warping Tech" }
    },

    // G2-S3: The Shard Verge (Boss: The Crystal Sovereign)
    PRISM_CROWN: {
        key: 'PRISM_CROWN',
        name: "Prism Crown",
        description: "A jagged halo of sentient crystal. It amplifies psionic and magical energies.",
        itemType: ItemType.ARMOR, // Headgear
        baseValue: 10000,
        isTradable: true,
        resourceType: 'Unique Armor',
        level: 21,
        stats: { defense: 20, effectDescription: "Reflects Magical Damage" }
    },

    // === GALAXY 3: THE VOID SEA ===

    // G3-S1: Koreth's Veil (Boss: The Void Mother)
    TEAR_OF_THE_VOID: {
        key: 'TEAR_OF_THE_VOID',
        name: "Tear of the Void",
        description: "A drop of pure nothingness, contained in a stasis field. Staring at it causes vertigo.",
        itemType: ItemType.RESOURCE,
        baseValue: 15000,
        isTradable: true,
        resourceType: 'Unique Artifact',
        level: 21,
        stats: { effectDescription: "Material for Void-Based Weapons" }
    },

    // G3-S2: The Great Labyrinth (Boss: Minotaur Prime)
    LABYRINTH_KEY_CORE: {
        key: 'LABYRINTH_KEY_CORE',
        name: "Labyrinth Key-Core",
        description: "The processing unit of the Minotaur Prime. It can calculate a path through any maze.",
        itemType: ItemType.SHIP_MODULE,
        baseValue: 20000,
        isTradable: true,
        resourceType: 'Unique Module',
        level: 21,
        stats: { effectDescription: "Guarantees 100% Escape Chance from any battle" }
    },

    // G3-S3: The Whisper Zone (Boss: The Silent King)
    MASK_OF_SILENCE: {
        key: 'MASK_OF_SILENCE',
        name: "Mask of Silence",
        description: "A smooth, featureless mask. Wearers find their thoughts completely hidden from scanners.",
        itemType: ItemType.ARMOR, // Head/Accessory
        baseValue: 25000,
        isTradable: true,
        resourceType: 'Unique Armor',
        level: 21,
        stats: { defense: 10, effectDescription: "Immune to 'Silence' and 'Fear'" }
    }
};