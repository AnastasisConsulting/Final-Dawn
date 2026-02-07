import { Item, ItemType } from '../../types';

export const COMMODITIES: Record<string, Item> = {
    // --- Standard Commodities ---
    NANITE_ACTUATORS: {
        key: 'NANITE_ACTUATORS',
        name: 'Nanite Actuators',
        description: 'A small vial of programmed nanites, essential for A-Grade construction and repair.',
        itemType: ItemType.COMMODITY,
        baseValue: 400,
        isTradable: true,
        resourceType: 'High-Tech Parts',
    },
    MEDICAL_SUPPLIES: {
        key: 'MEDICAL_SUPPLIES',
        name: 'Medical Supplies',
        description: 'A crate of sterile bandages, synth-blood, and auto-sutures. Always in demand.',
        itemType: ItemType.COMMODITY,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Biowaste',
    },
    TRITANIUM_INGOTS: {
        key: 'TRITANIUM_INGOTS',
        name: 'Tritanium Ingots',
        description: 'Refined tritanium ore, ready for use in ship hull construction.',
        itemType: ItemType.COMMODITY,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Tritanium',
    },
    SYNTH_WEAVE: {
        key: 'SYNTH_WEAVE',
        name: 'Synth-Weave Bolt',
        description: 'A bolt of ballistic-resistant synthetic fiber. Used for armor and hull reinforcement.',
        itemType: ItemType.COMMODITY,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Synth-Weave',
    },
    
    // --- Act-Specific Commodities ---
    // (Many items in the "Resources" category act as commodities, but these fit the "Processed Good" definition best)
    
    // Used for creating high-end optics
    LASER_CUTTER_LENS: {
         key: 'LASER_CUTTER_LENS',
         name: 'Laser Cutter Lens',
         description: 'Precision-ground lens capable of focusing industrial lasers.',
         itemType: ItemType.COMMODITY,
         baseValue: 45,
         isTradable: true,
         resourceType: 'Electronics'
    },
    
    // Essential for heavy machinery
    HYDRAULIC_PISTON: {
         key: 'HYDRAULIC_PISTON',
         name: 'Hydraulic Piston',
         description: 'Heavy-duty piston used in mining mechs and blast doors.',
         itemType: ItemType.COMMODITY,
         baseValue: 35,
         isTradable: true,
         resourceType: 'Scrap Metal'
    },
    
    // A processed form of raw bio-matter
    GENETIC_SAMPLES: {
        key: 'GENETIC_SAMPLES',
        name: 'Genetic Samples',
        description: 'A cryo-vial of unidentified genetic material. Sourced... questionably. High value on the black market.',
        itemType: ItemType.COMMODITY, // Changed from RESOURCE to COMMODITY as it's a trade good
        baseValue: 3000,
        isTradable: true,
        resourceType: 'Biowaste',
    },
    
    // Processed fuel
    ISOTOPIC_FUEL: {
        key: 'ISOTOPIC_FUEL',
        name: 'Isotopic Fuel',
        description: 'Highly volatile starship fuel. Handle with care.',
        itemType: ItemType.COMMODITY, // Changed from RESOURCE to COMMODITY
        baseValue: 200,
        isTradable: true,
        resourceType: 'Isotopic Fuel',
    },
    
    // Specialized gas
    XENON_GAS: {
        key: 'XENON_GAS',
        name: 'Xenon Gas',
        description: 'Pressurized gas used in high-efficiency ion drives.',
        itemType: ItemType.COMMODITY, // Changed from RESOURCE to COMMODITY
        baseValue: 150,
        isTradable: true,
        resourceType: 'Xenon Gas',
    },
    
    // High-value trade good
    PURE_ENERGY_CELL: {
        key: 'PURE_ENERGY_CELL',
        name: 'Pure Energy Cell',
        description: 'A stable containment unit for high-density plasma. Universal currency in some sectors.',
        itemType: ItemType.COMMODITY, // Fits better here than Resource
        baseValue: 300,
        isTradable: true,
        resourceType: 'Energy'
    },

    // Act 6: Chemical commodity
    EXPLOSIVE_GAS: {
        key: 'EXPLOSIVE_GAS',
        name: 'Explosive Gas',
        description: 'Volatile compound used in mining charges and... other applications.',
        itemType: ItemType.COMMODITY,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Gas'
    },

    // Act 7: Advanced computing
    LOGIC_GATE: {
        key: 'LOGIC_GATE',
        name: 'Logic Gate',
        description: 'A physical manifestation of pure logic, used in quantum computing.',
        itemType: ItemType.COMMODITY,
        baseValue: 200,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    }
};