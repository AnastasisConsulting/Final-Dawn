import { Item, ItemType } from '../../types';

export const CONSUMABLES: Record<string, Item> = {
    MEDKIT: {
        key: 'MEDKIT',
        name: 'Medkit',
        description: 'A syringe of synth-blood and bandages.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 75,
        isTradable: true,
        resourceType: 'Biowaste',
        level: 1,
        stats: { heal: 30 }
    },
    STIM_PACK: {
        key: 'STIM_PACK',
        name: 'Stim-Pack',
        description: 'A combat stimulant. Boosts adrenaline.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 120,
        isTradable: true,
        resourceType: 'Chemicals',
        level: 2,
        stats: { effectDescription: "+AP, -HP" }
    },
    RATIONS_CORP: {
        key: 'RATIONS_CORP',
        name: 'Core-Sys Rations',
        description: 'Nutrient-rich paste.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Biowaste',
        level: 1,
        stats: { heal: 5 }
    },
    SYNTH_BOOZE: {
        key: 'SYNTH_BOOZE',
        name: 'Synth-Booze',
        description: 'Fluorescent blue liquid. Burns.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 25,
        isTradable: true,
        resourceType: 'Chemicals',
        level: 1,
        stats: { effectDescription: "Intoxication" }
    },
    DRIVE_PATCH: {
        key: 'DRIVE_PATCH',
        name: 'FTL Drive-Patch',
        description: 'Counters nausea from FTL jumps.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Chemicals',
        level: 1,
        stats: { effectDescription: "Cure Nausea" }
    },
    VIRUS_UPLOAD_SPIKE: {
        key: 'VIRUS_UPLOAD_SPIKE',
        name: 'Virus Upload Spike',
        description: 'Single-use hacking tool.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Cybernetics',
        level: 4,
        stats: { effectDescription: "Instant Hack Success" }
    },
    DECRYPTION_KEY: {
        key: 'DECRYPTION_KEY',
        name: 'Decryption Key',
        description: 'Bypasses one layer of encryption.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 200,
        isTradable: true,
        resourceType: 'Data',
        level: 5,
        stats: { effectDescription: "Unlock Encrypted Data" }
    },
    SIGNAL_JAMMER: {
        key: 'SIGNAL_JAMMER',
        name: 'Signal Jammer',
        description: 'Blocks comms in a small area.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Electronics',
        level: 3,
        stats: { effectDescription: "Prevent Reinforcements" }
    },
    SPARE_OXYGEN: {
        key: 'SPARE_OXYGEN',
        name: 'Spare Oxygen',
        description: 'Emergency air supply.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Gas',
        level: 1,
        stats: { effectDescription: "Extend EVA Time" }
    },
    SKILL_POINT_SHARD: {
        key: 'SKILL_POINT_SHARD',
        name: 'Skill Point Shard',
        description: 'Instantly grants a skill point.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Special',
        level: 10,
        stats: { effectDescription: "+1 Skill Point" }
    },
    VOID_MEAT: {
        key: 'VOID_MEAT',
        name: 'Void Meat',
        description: 'Edible? Maybe.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Food',
        level: 1,
        stats: { heal: 15, effectDescription: "Chance of Poison" }
    },
    STOLEN_RATIONS: {
        key: 'STOLEN_RATIONS',
        name: 'Stolen Rations',
        description: 'Military grade food.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Food',
        level: 1,
        stats: { heal: 20 }
    },
    LOCKPICK: {
        key: 'LOCKPICK',
        name: 'Lockpick',
        description: 'Mechanical bypass tool.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 25,
        isTradable: true,
        resourceType: 'Tools',
        level: 1,
        stats: { effectDescription: "Open Locked Container" }
    }
};