import { Item, ItemType } from '../../types';

export const SHIP_WEAPONS: Record<string, Item> = {
    RAILGUN_TURRET: {
        key: 'RAILGUN_TURRET',
        name: 'Railgun Turret (Class I)',
        description: 'A standard magnetic accelerator cannon. Good for cracking asteroids and pirate hulls alike.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 15000,
        isTradable: true,
        resourceType: 'Ship Components',
        level: 1,
        stats: { damage: 25, range: 400, energy: 5, effectDescription: "Standard Kinetics" }
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
        stats: { damage: 15, range: 250, energy: 2, effectDescription: "Continuous Beam" }
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
        stats: { damage: 10, range: 300, energy: 20, effectDescription: "Stuns targets for 2s" }
    },
    PLASMA_BATTERY: {
        key: 'PLASMA_BATTERY',
        name: 'Plasma Battery',
        description: 'Heavy ship-to-ship ordnance. Slow firing but devastating impact.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 45000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
        level: 10,
        stats: { damage: 120, range: 600, energy: 40, effectDescription: "Splash Damage" }
    },
    POINT_DEFENSE_LASERS: {
        key: 'POINT_DEFENSE_LASERS',
        name: 'Point Defense Lasers',
        description: 'Rapid-fire lasers designed to intercept missiles and fighters.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 12000,
        isTradable: true,
        resourceType: 'Electronics',
        level: 5,
        stats: { damage: 8, range: 150, energy: 1, effectDescription: "Auto-targets missiles" }
    }
};