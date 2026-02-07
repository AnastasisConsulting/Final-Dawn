import { Item, ItemType } from '../../types';

export const CYBERNETICS: Record<string, Item> = {
    // --- Sensory Enhancements ---
    CYBER_EYE_BASIC: {
        key: 'CYBER_EYE_BASIC',
        name: 'Cyber-Eye (Basic)',
        description: 'A standard-issue optical replacement. Features a HUD overlay and low-light vision.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 1500,
        isTradable: true,
        resourceType: 'Electronics',
        level: 1,
        stats: { effectDescription: "+1 Perception" }
    },
    CYBER_EYE_ADVANCED: {
        key: 'CYBER_EYE_ADVANCED',
        name: 'Cyber-Eye (Targeting)',
        description: 'Military-grade optics with trajectory prediction algorithms.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 4500,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 8,
        stats: { effectDescription: "+2 Perception, +Crit Chance" }
    },

    // --- Neural Interfaces ---
    DATA_JACK: {
        key: 'DATA_JACK',
        name: 'Neural Data-Jack',
        description: 'A port at the base of the skull for direct interface with data systems. Essential for hacking.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 3000,
        isTradable: true,
        resourceType: 'Electronics',
        level: 2,
        stats: { effectDescription: "Enable Hacking" }
    },
    REFLEX_COPROCESSOR: {
        key: 'REFLEX_COPROCESSOR',
        name: 'Reflex Coprocessor',
        description: 'A neural chip that automates defensive reactions.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 6000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 12,
        stats: { effectDescription: "+Defensive Roll Success" }
    },

    // --- Physical Augmentations ---
    SYNTH_LIVER: {
        key: 'SYNTH_LIVER',
        name: 'Synth-Liver',
        description: 'An upgraded liver that filters common toxins and poisons twice as fast.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 2200,
        isTradable: true,
        resourceType: 'Biowaste',
        level: 3,
        stats: { effectDescription: "Poison Resistance" }
    },
    SUB_DERMAL_GRIP: {
        key: 'SUB_DERMAL_GRIP',
        name: 'Sub-Dermal Grip',
        description: 'Magnetic pads and reinforced tendons in the hand. Prevents disarming.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 1800,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 4,
        stats: { effectDescription: "Cannot be Disarmed" }
    },
    KERENZIKOV_BOOSTER: {
        key: 'KERENZIKOV_BOOSTER',
        name: 'Kerenzikov Booster',
        description: 'A military-grade spinal implant that massively speeds up reflexes. Highly illegal.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 9000,
        isTradable: true,
        resourceType: 'Illegal Cybernetics',
        level: 10,
        stats: { effectDescription: "+1 Action Point per turn" }
    },
    DERMAL_PLATING_MK1: {
        key: 'DERMAL_PLATING_MK1',
        name: 'Dermal Plating Mk.I',
        description: 'Sub-dermal ballistic mesh woven into the skin. It itches.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 3500,
        isTradable: true,
        resourceType: 'Synth-Weave',
        level: 6,
        stats: { defense: 5 }
    },
    TITANIUM_BONES: {
        key: 'TITANIUM_BONES',
        name: 'Titanium Lacing',
        description: 'Skeletal reinforcement. Makes you heavier, but much harder to break.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 12000,
        isTradable: true,
        resourceType: 'Tritanium',
        level: 15,
        stats: { defense: 10, effectDescription: "Resist Knockdown" }
    }
};