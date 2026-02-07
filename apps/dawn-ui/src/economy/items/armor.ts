import { Item, ItemType } from '../../types';

export const ARMOR: Record<string, Item> = {
    // --- Standard Armor ---
    FLAK_JACKET: {
        key: 'FLAK_JACKET',
        name: 'Flak Jacket',
        description: 'Layers of synth-weave and trauma plates. Standard for any Fringe-dweller.',
        itemType: ItemType.ARMOR,
        baseValue: 600,
        isTradable: true,
        resourceType: 'Synth-Weave',
        level: 2,
        stats: { defense: 2, health: 20, effectDescription: "Basic ballistic protection" }
    },
    COMBINE_ARMOR: {
        key: 'COMBINE_ARMOR',
        name: 'Core-Sys Enforcer Armor',
        description: 'Gleaming white plasteel armor. Excellent protection.',
        itemType: ItemType.ARMOR,
        baseValue: 3500,
        isTradable: true,
        resourceType: 'Plasteel',
        level: 8,
        stats: { defense: 8, health: 80, effectDescription: "Mil-spec plating" }
    },
    VOID_RIG: {
        key: 'VOID_RIG',
        name: 'Salvager\'s Void-Rig',
        description: 'A bulky, sealed environment suit. Built to survive hard vacuum.',
        itemType: ItemType.ARMOR,
        baseValue: 1800,
        isTradable: true,
        resourceType: 'Ship Components',
        level: 5,
        stats: { defense: 4, health: 40, effectDescription: "Vacuum Sealed / Rad Resistant" }
    },

    // --- Act Specific / Rare Armor ---
    HIGH_GRADE_SHIELD: {
        key: 'HIGH_GRADE_SHIELD',
        name: 'High-Grade Shield',
        description: 'Personal energy shield generator.',
        itemType: ItemType.ARMOR,
        baseValue: 1200,
        isTradable: true,
        resourceType: 'Shield Technology',
        level: 6,
        stats: { defense: 0, health: 0, energy: 50, effectDescription: "Recharges 5 shield/sec" }
    },
    EXECUTION_HOOD: {
        key: 'EXECUTION_HOOD',
        name: 'Execution Hood',
        description: 'Grim headwear offering intimidation but little protection.',
        itemType: ItemType.ARMOR,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Cloth',
        level: 3,
        stats: { defense: 1, health: 10, effectDescription: "+Intimidation / No Protection" }
    },
    COMBINE_ARMOR_PRISTINE: {
        key: 'COMBINE_ARMOR_PRISTINE',
        name: 'Combine Armor (Pristine)',
        description: 'Officer-grade plasteel, polished to a mirror shine.',
        itemType: ItemType.ARMOR,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'Plasteel',
        level: 10,
        stats: { defense: 12, health: 150, effectDescription: "Officer Grade / Shiny" }
    },
    DIVINE_HALO: {
        key: 'DIVINE_HALO',
        name: 'Divine Halo',
        description: 'An energy shield of ancient design.',
        itemType: ItemType.ARMOR,
        baseValue: 8000,
        isTradable: true,
        resourceType: 'Shield Technology',
        level: 15,
        stats: { defense: 5, health: 50, energy: 100, effectDescription: "Reflects 10% beam damage" }
    }
};