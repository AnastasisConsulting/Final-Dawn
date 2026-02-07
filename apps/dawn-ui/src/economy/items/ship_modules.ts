import { Item, ItemType } from '../../types';

export const SHIP_MODULES: Record<string, Item> = {
    FTL_DRIVE_A_GRADE: {
        key: 'FTL_DRIVE_A_GRADE',
        name: 'FTL Drive (A-Grade)',
        description: 'A top-of-the-line, Combine-certified FTL drive. Fast, efficient, and requires a registered license.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 150000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 10,
        stats: { effectDescription: "Fast Travel Speed" }
    },
    FTL_DRIVE_JURY_RIGGED: {
        key: 'FTL_DRIVE_JURY_RIGGED',
        name: 'Jury-Rigged FTL Drive',
        description: 'A mess of stolen parts and hope. It *probably* won\'t mis-jump you into a star. Cheaper, though.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 40000,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 1,
        stats: { effectDescription: "Basic Travel (High Failure Risk)" }
    },
    CARGO_SCAN_SPOOFER: {
        key: 'CARGO_SCAN_SPOOFER',
        name: 'Cargo Scan Spoofer',
        description: 'Generates false sensor readings to hide contraband from Combine patrols. Draws suspicion if detected.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 30000,
        isTradable: true,
        resourceType: 'Electronics',
        level: 5,
        stats: { effectDescription: "Avoid Contraband Scans" }
    },
    RESONANCE_SCOOP: {
        key: 'RESONANCE_SCOOP',
        name: 'Resonance Scoop',
        description: 'A specialized module for safely harvesting exotic matter and unstable particles from Void-Storms.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 55000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 8,
        stats: { effectDescription: "Harvest Exotic Matter" }
    },
    EXTENDED_CARGO_HOLD: {
        key: 'EXTENDED_CARGO_HOLD',
        name: 'Extended Cargo Hold',
        description: 'Bolts an extra, unshielded container to your hull. What could go wrong?',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 12000,
        isTradable: true,
        resourceType: 'Tritanium',
        level: 2,
        stats: { effectDescription: "+Cargo Capacity" }
    },
    SENSOR_ARRAY: {
        key: 'SENSOR_ARRAY',
        name: 'Sensor Array',
        description: 'Advanced scanning suite components. Essential for deep space exploration.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 500,
        isTradable: true,
        resourceType: 'Electronics',
        level: 3,
        stats: { effectDescription: "+Scan Range" }
    },
    STEALTH_FIELD_GENERATOR: {
        key: 'STEALTH_FIELD_GENERATOR',
        name: 'Stealth Field Generator',
        description: 'Bends light and sensor waves around the ship. Consumes massive power.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 80000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 15,
        stats: { effectDescription: "Temporary Invisibility" }
    }
};