import { Item, ItemType } from '../../types';

export const WEAPONS: Record<string, Item> = {
    // --- Personal Weapons ---
    BLASTER_PISTOL: {
        key: 'BLASTER_PISTOL',
        name: 'Blaster Pistol',
        description: 'A reliable, if uninspired, sidearm. Standard issue for corporate security.',
        itemType: ItemType.WEAPON,
        baseValue: 450,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 2,
        stats: { damage: 12, range: 2 }
    },
    COMBAT_KNIFE: {
        key: 'COMBAT_KNIFE',
        name: 'Combat Knife',
        description: 'A sharpened piece of metal for when things get too personal.',
        itemType: ItemType.WEAPON,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 1,
        stats: { damage: 8, range: 0 }
    },
    PLASMA_RIFLE: {
        key: 'PLASMA_RIFLE',
        name: 'Plasma Rifle',
        description: 'Fires bolts of superheated plasma. A-Grade military hardware. Possession without a license is a Core-Sys felony.',
        itemType: ItemType.WEAPON,
        baseValue: 2800,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 8,
        stats: { damage: 35, range: 4 }
    },
    SLAG_CANNON: {
        key: 'SLAG_CANNON',
        name: 'Slag Cannon',
        description: 'A jury-rigged projectile weapon that fires superheated shrapnel. Inaccurate, devastating, and prone to jamming.',
        itemType: ItemType.WEAPON,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 1,
        stats: { damage: 15, range: 1, procChance: 0.1, effectDescription: "May jam user" }
    },
    SHOCK_BATON: {
        key: 'SHOCK_BATON',
        name: 'Shock Baton',
        description: 'Standard issue "Peacekeeper" non-lethal deterrent. Can be overcharged to... lethal settings.',
        itemType: ItemType.WEAPON,
        baseValue: 250,
        isTradable: true,
        resourceType: 'Electronics',
        level: 2,
        stats: { damage: 6, range: 0, effectDescription: "Stun Chance", procChance: 0.2 }
    },
    MONO_WHIP: {
        key: 'MONO_WHIP',
        name: 'Monofilament Whip',
        description: 'A retractable, molecular-thin wire. An elegant and terrifyingly illegal assassination tool.',
        itemType: ItemType.WEAPON,
        baseValue: 4500,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 12,
        stats: { damage: 45, range: 1, effectDescription: "Ignores Armor" }
    },
    SAW_BLADE: {
        key: 'SAW_BLADE',
        name: 'Industrial Saw Blade',
        description: 'A rusty saw blade, improvised as a melee weapon.',
        itemType: ItemType.WEAPON,
        baseValue: 25,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 1,
        stats: { damage: 6, range: 0 }
    },
    STUN_GRENADE: {
        key: 'STUN_GRENADE',
        name: 'Stun Grenade',
        description: 'Non-lethal explosive device.',
        itemType: ItemType.WEAPON,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Explosives',
        level: 3,
        stats: { damage: 2, range: 3, effectDescription: "AoE Stun", procChance: 0.8 }
    },
    MONO_BLADE: {
        key: 'MONO_BLADE',
        name: 'Mono-Blade',
        description: 'A sword with a monofilament edge.',
        itemType: ItemType.WEAPON,
        baseValue: 800,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 5,
        stats: { damage: 22, range: 0 }
    },
    SMOKE_GRENADE: {
        key: 'SMOKE_GRENADE',
        name: 'Smoke Grenade',
        description: 'Creates a cloud of obscuring smoke.',
        itemType: ItemType.WEAPON,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Explosives',
        level: 2,
        stats: { damage: 0, range: 3, effectDescription: "Blinds enemies" }
    },
    NET_LAUNCHER: {
        key: 'NET_LAUNCHER',
        name: 'Net Launcher',
        description: 'Fires a weighted net to immobilize targets.',
        itemType: ItemType.WEAPON,
        baseValue: 400,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 4,
        stats: { damage: 5, range: 3, effectDescription: "Immobilize" }
    },
    MASTERWORK_BLASTER: {
        key: 'MASTERWORK_BLASTER',
        name: 'Masterwork Blaster',
        description: 'Finely tuned energy weapon.',
        itemType: ItemType.WEAPON,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 14,
        stats: { damage: 55, range: 3 }
    },
    RUSTED_BLASTER: {
        key: 'RUSTED_BLASTER',
        name: 'Rusted Blaster',
        description: 'Barely functional firearm.',
        itemType: ItemType.WEAPON,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 1,
        stats: { damage: 8, range: 2, effectDescription: "Low Accuracy" }
    },
    BACKSTAB_KNIFE: {
        key: 'BACKSTAB_KNIFE',
        name: 'Backstab Knife',
        description: 'Serrated for extra damage.',
        itemType: ItemType.WEAPON,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Steel',
        level: 2,
        stats: { damage: 10, range: 0, effectDescription: "+Crit Chance" }
    },
    FLAMING_SWORD: {
        key: 'FLAMING_SWORD',
        name: 'Flaming Sword',
        description: 'Blade wreathed in eternal fire.',
        itemType: ItemType.WEAPON,
        baseValue: 4000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 10,
        stats: { damage: 40, range: 0, effectDescription: "Burn" }
    },

    // --- Ship Weapons ---
    RAILGUN_TURRET: {
        key: 'RAILGUN_TURRET',
        name: 'Railgun Turret (Class I)',
        description: 'A standard magnetic accelerator cannon. Good for cracking asteroids and pirate hulls alike.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 15000,
        isTradable: true,
        resourceType: 'Ship Components',
        level: 1,
        stats: { damage: 200, range: 10 }
    },
    LASER_CUTTER_ARRAY: {
        key: 'LASER_CUTTER_ARRAY',
        name: 'Mining Laser Array',
        description: 'A high-yield mining tool. Not designed for combat, but a focused beam cuts through hulls all the same.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 8000,
        isTradable: true,
        resourceType: 'Ship Components',
        level: 1,
        stats: { damage: 120, range: 5 }
    },
    EMP_PULSER: {
        key: 'EMP_PULSER',
        name: 'EMP Pulser',
        description: 'Fires a directed electromagnetic pulse to disable ship systems. Highly illegal in Core-Sys space.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 22000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 3,
        stats: { damage: 50, range: 8, effectDescription: "Disable Ship Systems" }
    },
};