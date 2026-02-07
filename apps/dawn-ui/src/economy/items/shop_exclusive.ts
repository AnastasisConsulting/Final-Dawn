import { Item, ItemType } from '../../types';

export const SHOP_EXCLUSIVE: Record<string, Item> = {
    
    // ===============================================
    // --- 1. MERCENARY RIFLE (Universal Ranged) ---
    // ===============================================
    MERC_RIFLE_I: {
        key: 'MERC_RIFLE_I',
        name: 'Mercenary Rifle I',
        description: 'A well-worn, mass-produced rifle. Standard issue for low-grade independent contractors.',
        itemType: ItemType.WEAPON,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Steel',
        level: 1,
        stats: { damage: 10, range: 3, effectDescription: "Simple kinetic action" }
    },
    MERC_RIFLE_II: {
        key: 'MERC_RIFLE_II',
        name: 'Mercenary Rifle II',
        description: 'Improved calibration and a fresh synthetic grip provide notable handling improvements.',
        itemType: ItemType.WEAPON,
        baseValue: 1200,
        isTradable: true,
        resourceType: 'Steel',
        level: 7,
        stats: { damage: 25, range: 3, effectDescription: "Reliable and rugged" }
    },
    MERC_RIFLE_III: {
        key: 'MERC_RIFLE_III',
        name: 'Mercenary Rifle III',
        description: 'Elite grade rifle utilizing high-velocity, stabilized rounds. A true workhorse.',
        itemType: ItemType.WEAPON,
        baseValue: 4800,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 14,
        stats: { damage: 60, range: 4, effectDescription: "High stability" }
    },

    // ===============================================
    // --- 2. PRECISION PISTOL (High Accuracy) ---
    // ===============================================
    PREC_PISTOL_I: {
        key: 'PREC_PISTOL_I',
        name: 'Precision Pistol I',
        description: 'A basic tuned handgun with balanced weight. Favors accuracy over rapid fire.',
        itemType: ItemType.WEAPON,
        baseValue: 250,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 1,
        stats: { damage: 8, range: 3, effectDescription: "+Accuracy" }
    },
    PREC_PISTOL_II: {
        key: 'PREC_PISTOL_II',
        name: 'Precision Pistol II',
        description: 'Features a low-magnification optic array and inertial compensators for stability.',
        itemType: ItemType.WEAPON,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 7,
        stats: { damage: 20, range: 4, effectDescription: "Improved Optics" }
    },
    PREC_PISTOL_III: {
        key: 'PREC_PISTOL_III',
        name: 'Precision Pistol III',
        description: 'A master-crafted sidearm utilized by corporate assassins. Near-perfect shot placement.',
        itemType: ItemType.WEAPON,
        baseValue: 4000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 14,
        stats: { damage: 50, range: 5, effectDescription: "Perfect Accuracy" }
    },

    // ===============================================
    // --- 3. AUTO SHOTGUN (Close Quarters) ---
    // ===============================================
    AUTO_SHOTGUN_I: {
        key: 'AUTO_SHOTGUN_I',
        name: 'Auto-Shotgun I',
        description: 'A crude, belt-fed shotgun designed for clearing corridors of lightly armored targets.',
        itemType: ItemType.WEAPON,
        baseValue: 500,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 3,
        stats: { damage: 15, range: 1, effectDescription: "AoE Cone" }
    },
    AUTO_SHOTGUN_II: {
        key: 'AUTO_SHOTGUN_II',
        name: 'Auto-Shotgun II',
        description: 'The receiver has been reinforced and the feed mechanism is less prone to jamming.',
        itemType: ItemType.WEAPON,
        baseValue: 2000,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 9,
        stats: { damage: 40, range: 1, effectDescription: "Wider AoE" }
    },
    AUTO_SHOTGUN_III: {
        key: 'AUTO_SHOTGUN_III',
        name: 'Auto-Shotgun III',
        description: 'A military-grade CQB weapon utilizing custom flechette rounds. Devastating up close.',
        itemType: ItemType.WEAPON,
        baseValue: 8000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 16,
        stats: { damage: 80, range: 2, effectDescription: "Massive AoE" }
    },
    
    // ===============================================
    // --- 4. THERMAL LANCE (Anti-Armor) ---
    // ===============================================
    THERMAL_LANCE_I: {
        key: 'THERMAL_LANCE_I',
        name: 'Thermal Lance I',
        description: 'A bulky mining tool modified to project a focused thermal beam. Slow to charge.',
        itemType: ItemType.WEAPON,
        baseValue: 900,
        isTradable: true,
        resourceType: 'Electronics',
        level: 5,
        stats: { damage: 20, range: 2, effectDescription: "Melts light armor" }
    },
    THERMAL_LANCE_II: {
        key: 'THERMAL_LANCE_II',
        name: 'Thermal Lance II',
        description: 'A field-grade weapon system with improved heat dissipation and beam intensity.',
        itemType: ItemType.WEAPON,
        baseValue: 3600,
        isTradable: true,
        resourceType: 'Electronics',
        level: 11,
        stats: { damage: 55, range: 3, effectDescription: "Melts medium armor" }
    },
    THERMAL_LANCE_III: {
        key: 'THERMAL_LANCE_III',
        name: 'Thermal Lance III',
        description: 'A prototype weapon that projects a chronal heat pulse. Cuts through heavy plating effortlessly.',
        itemType: ItemType.WEAPON,
        baseValue: 14400,
        isTradable: true,
        resourceType: 'Exotic Matter',
        level: 18,
        stats: { damage: 110, range: 4, effectDescription: "Melts heavy armor" }
    },
    
    // ===============================================
    // --- 5. REINFORCED VEST (Basic Armor) ---
    // ===============================================
    REIN_VEST_I: {
        key: 'REIN_VEST_I',
        name: 'Reinforced Vest I',
        description: 'Standard clothing interwoven with ballistic fibers. Discreet protection.',
        itemType: ItemType.ARMOR,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Synth-Weave',
        level: 1,
        stats: { defense: 3 }
    },
    REIN_VEST_II: {
        key: 'REIN_VEST_II',
        name: 'Reinforced Vest II',
        description: 'Plated with ceramic inserts for superior trauma protection.',
        itemType: ItemType.ARMOR,
        baseValue: 400,
        isTradable: true,
        resourceType: 'Plasteel',
        level: 7,
        stats: { defense: 8 }
    },
    REIN_VEST_III: {
        key: 'REIN_VEST_III',
        name: 'Reinforced Vest III',
        description: 'Triple-layered, lightweight shielding. High defense for low mobility cost.',
        itemType: ItemType.ARMOR,
        baseValue: 1600,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 14,
        stats: { defense: 18 }
    },

    // ===============================================
    // --- 6. TACTICAL RIG (Mobility Armor) ---
    // ===============================================
    TACTICAL_RIG_I: {
        key: 'TACTICAL_RIG_I',
        name: 'Tactical Rig I',
        description: 'A modular chest rig. Offers protection without sacrificing mobility.',
        itemType: ItemType.ARMOR,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Plasteel',
        level: 4,
        stats: { defense: 6 }
    },
    TACTICAL_RIG_II: {
        key: 'TACTICAL_RIG_II',
        name: 'Tactical Rig II',
        description: 'Integrated stealth mesh. Favored by scouts and hackers.',
        itemType: ItemType.ARMOR,
        baseValue: 1200,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 9,
        stats: { defense: 15, effectDescription: "+Stealth" }
    },
    TACTICAL_RIG_III: {
        key: 'TACTICAL_RIG_III',
        name: 'Tactical Rig III',
        description: 'Ghost-weave fabric makes the wearer difficult to target electronically.',
        itemType: ItemType.ARMOR,
        baseValue: 4800,
        isTradable: true,
        resourceType: 'Exotic Matter',
        level: 16,
        stats: { defense: 30, effectDescription: "Low Trace Signature" }
    },
    
    // ===============================================
    // --- 7. EVA SUIT (Environmental Armor) ---
    // ===============================================
    EVA_SUIT_I: {
        key: 'EVA_SUIT_I',
        name: 'EVA Suit I (Mk.I)',
        description: 'Basic atmospheric and vacuum protection suit. Bulky.',
        itemType: ItemType.ARMOR,
        baseValue: 800,
        isTradable: true,
        resourceType: 'Ship Components',
        level: 7,
        stats: { defense: 10, effectDescription: "Vacuum Immunity" }
    },
    EVA_SUIT_II: {
        key: 'EVA_SUIT_II',
        name: 'EVA Suit II (Mk.II)',
        description: 'Upgraded suit with polymer enhancements and basic rad-shielding.',
        itemType: ItemType.ARMOR,
        baseValue: 3200,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 12,
        stats: { defense: 20, effectDescription: "Rad Resist" }
    },
    EVA_SUIT_III: {
        key: 'EVA_SUIT_III',
        name: 'EVA Suit III (Mk.III)',
        description: 'A top-tier environment suit with micro-thrusters and full radiation dampening.',
        itemType: ItemType.ARMOR,
        baseValue: 12800,
        isTradable: true,
        resourceType: 'Exotic Matter',
        level: 18,
        stats: { defense: 45, effectDescription: "Full Environment Immunity" }
    },
    
    // ===============================================
    // --- 8. HEAVY ASSAULT ARMOR (Tank Armor) ---
    // ===============================================
    HEAVY_ASSAULT_I: {
        key: 'HEAVY_ASSAULT_I',
        name: 'Heavy Assault Armor I',
        description: 'Full-body plating with early servo-assist. Slow but tough.',
        itemType: ItemType.ARMOR,
        baseValue: 1500,
        isTradable: true,
        resourceType: 'Tritanium',
        level: 11,
        stats: { defense: 20, effectDescription: "-Speed" }
    },
    HEAVY_ASSAULT_II: {
        key: 'HEAVY_ASSAULT_II',
        name: 'Heavy Assault Armor II',
        description: 'Reinforced ballistic shields and hydraulic dampeners. A true wall.',
        itemType: ItemType.ARMOR,
        baseValue: 6000,
        isTradable: true,
        resourceType: 'Plasteel',
        level: 16,
        stats: { defense: 40, effectDescription: "CC Resist" }
    },
    HEAVY_ASSAULT_III: {
        key: 'HEAVY_ASSAULT_III',
        name: 'Heavy Assault Armor III',
        description: 'A prototype Juggernaut rig with a built-in auto-repair system.',
        itemType: ItemType.ARMOR,
        baseValue: 24000,
        isTradable: true,
        resourceType: 'Exotic Matter',
        level: 20,
        stats: { defense: 70, effectDescription: "Auto-Repair (2 HP/turn)" }
    },

    // ===============================================
    // --- 9. NANO REPAIR PASTE (Utility Consumable) ---
    // ===============================================
    NANO_REPAIR_PASTE_I: {
        key: 'NANO_REPAIR_PASTE_I',
        name: 'Nano-Repair Paste I',
        description: 'A tube of grey goo that hardens into temporary light armor.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Nanite Actuators',
        level: 3,
        stats: { effectDescription: "+5 Defense (Temp)" }
    },
    NANO_REPAIR_PASTE_II: {
        key: 'NANO_REPAIR_PASTE_II',
        name: 'Nano-Repair Paste II',
        description: 'Quick-setting compound that stabilizes armor fractures.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 400,
        isTradable: true,
        resourceType: 'Nanite Actuators',
        level: 9,
        stats: { effectDescription: "+15 Defense (Temp)" }
    },
    NANO_REPAIR_PASTE_III: {
        key: 'NANO_REPAIR_PASTE_III',
        name: 'Nano-Repair Paste III',
        description: 'Military grade combat sealant. Can be applied mid-firefight.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 1600,
        isTradable: true,
        resourceType: 'Nanite Actuators',
        level: 16,
        stats: { effectDescription: "+30 Defense (Temp)" }
    },

    // ===============================================
    // --- 10. ADRENAL BOOSTER (Combat Consumable) ---
    // ===============================================
    ADRENAL_BOOSTER_I: {
        key: 'ADRENAL_BOOSTER_I',
        name: 'Adrenal Booster I',
        description: 'A mild synthetic hormone dose. Grants a small speed burst.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Chemicals',
        level: 5,
        stats: { effectDescription: "+1 AP (Temp)" }
    },
    ADRENAL_BOOSTER_II: {
        key: 'ADRENAL_BOOSTER_II',
        name: 'Adrenal Booster II',
        description: 'A potent cocktail. Grants a significant burst of action speed.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 600,
        isTradable: true,
        resourceType: 'Chemicals',
        level: 11,
        stats: { effectDescription: "+2 AP (Temp)" }
    },
    ADRENAL_BOOSTER_III: {
        key: 'ADRENAL_BOOSTER_III',
        name: 'Adrenal Booster III',
        description: 'Extreme-grade stimulant. Grants maximum agility but causes fatigue afterward.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 2400,
        isTradable: true,
        resourceType: 'Chemicals',
        level: 18,
        stats: { effectDescription: "+3 AP (Temp), -HP after combat" }
    }
};