import { Item, ItemType } from '../../types';

export const RESOURCES: Record<string, Item> = {
    // --- Common Resources (Found everywhere) ---
    SCRAP_METAL: {
        key: 'SCRAP_METAL',
        name: 'Scrap Metal',
        description: 'Salvaged parts from derelict ships. Can be recycled.',
        itemType: ItemType.RESOURCE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Scrap Metal',
    },
    BIO_WASTE: {
        key: 'BIOWASTE',
        name: 'Biowaste',
        description: 'Organic refuse. Gross, but essential for various bio-synthesis processes.',
        itemType: ItemType.RESOURCE,
        baseValue: 20,
        isTradable: true,
        resourceType: 'Biowaste',
    },
    TRITANIUM_ORE: {
        key: 'TRITANIUM_ORE',
        name: 'Tritanium Ore',
        description: 'A common, durable metal found in most asteroid belts.',
        itemType: ItemType.RESOURCE,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Tritanium',
    },
    HELIUM_4_GAS: {
        key: 'HELIUM_4_GAS',
        name: 'Helium-4 Gas',
        description: 'Unrefined gas collected from gas giants. Used in cooling and fusion processes.',
        itemType: ItemType.RESOURCE,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Helium-4 Gas',
    },

    // --- Act I: Garbage Orbit ---
    FUNGAL_SAMPLE: {
        key: 'FUNGAL_SAMPLE',
        name: 'Fungal Sample',
        description: 'A glowing sample of radiation-eating fungus from the waste belt.',
        itemType: ItemType.RESOURCE,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Biowaste'
    },
    MITE_CARAPACE: {
        key: 'MITE_CARAPACE',
        name: 'Mite Carapace',
        description: 'Hardened shell of a slag-mite. Used for low-grade armor plating.',
        itemType: ItemType.RESOURCE,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag'
    },
    INSECT_WING: {
        key: 'INSECT_WING',
        name: 'Insect Wing',
        description: 'Iridescent wing from a void fly. Collectors pay for them.',
        itemType: ItemType.RESOURCE,
        baseValue: 8,
        isTradable: true,
        resourceType: 'Biowaste'
    },

    // --- Act II: Entropy Curve ---
    SPY_EYE_LENS: {
        key: 'SPY_EYE_LENS',
        name: 'Spy-Eye Lens',
        description: 'High-grade optical lens for surveillance drones.',
        itemType: ItemType.RESOURCE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Electronics'
    },
    EMP_PULSER_PARTS: {
        key: 'EMP_PULSER_PARTS',
        name: 'EMP Pulser Parts',
        description: 'Components for an EMP device. Highly regulated.',
        itemType: ItemType.RESOURCE,
        baseValue: 75,
        isTradable: true,
        resourceType: 'Electronics'
    },

    // --- Act III: The Recursive War ---
    GLITCH_DUST: {
        key: 'GLITCH_DUST',
        name: 'Glitch Dust',
        description: 'Shimmering particulate that defies physics. Residue of data ghosts.',
        itemType: ItemType.RESOURCE,
        baseValue: 20,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    VOID_ESSENCE: {
        key: 'VOID_ESSENCE',
        name: 'Void Essence',
        description: 'A contained mote of pure void energy. Cold to the touch.',
        itemType: ItemType.RESOURCE,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    RAILGUN_TURRET_PARTS: {
        key: 'RAILGUN_TURRET_PARTS',
        name: 'Railgun Turret Parts',
        description: 'Scrap from a heavy weapon. Valuable for ship upgrades.',
        itemType: ItemType.RESOURCE,
        baseValue: 200,
        isTradable: true,
        resourceType: 'Ship Components'
    },
    HEAVY_PLATING: {
        key: 'HEAVY_PLATING',
        name: 'Heavy Plating',
        description: 'Thick armor plating from ancient warbots.',
        itemType: ItemType.RESOURCE,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Tritanium'
    },
    MIRROR_FRAGMENT: {
        key: 'MIRROR_FRAGMENT',
        name: 'Mirror Fragment',
        description: 'A shard that reflects things that aren\'t there. Dangerous to hold.',
        itemType: ItemType.RESOURCE,
        baseValue: 250,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    REFRACTED_LIGHT_CRYSTAL: {
        key: 'REFRACTED_LIGHT_CRYSTAL',
        name: 'Refracted Light Crystal',
        description: 'Traps light in impossible angles. Used in high-end optics.',
        itemType: ItemType.RESOURCE,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    SILVER_GLASS: {
        key: 'SILVER_GLASS',
        name: 'Silver Glass',
        description: 'Reflective material from the Void Mirror. Semi-liquid.',
        itemType: ItemType.RESOURCE,
        baseValue: 120,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    PRECURSOR_RELIC: {
        key: 'PRECURSOR_RELIC',
        name: 'Precursor Relic',
        description: 'An inert fragment of unknown alien technology.',
        itemType: ItemType.RESOURCE,
        baseValue: 25000,
        isTradable: true,
        resourceType: 'Exotic Matter',
    },
    UNSTABLE_VOID_SHARDS: {
        key: 'UNSTABLE_VOID_SHARDS',
        name: 'Unstable Void-Shards',
        description: 'Raw exotic matter harvested from a Void-Storm.',
        itemType: ItemType.RESOURCE,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'Exotic Matter',
    },

    // --- Act IV: The Regulator's Reckoning ---
    TRACKING_CHIP: {
        key: 'TRACKING_CHIP',
        name: 'Tracking Chip',
        description: 'Used for tagging targets. Salvaged from Hunter Seekers.',
        itemType: ItemType.RESOURCE,
        baseValue: 80,
        isTradable: true,
        resourceType: 'Electronics'
    },
    BATTERY_PACK: {
        key: 'BATTERY_PACK',
        name: 'Battery Pack',
        description: 'Standard energy cell. Universally compatible.',
        itemType: ItemType.RESOURCE,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Electronics'
    },

    // --- Act V: The Whisper Zone ---
    CHRONAL_DUST: {
        key: 'CHRONAL_DUST',
        name: 'Chronal Dust',
        description: 'Dust that ages whatever it touches. Requires magnetic containment.',
        itemType: ItemType.RESOURCE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    STATIC_CHARGE: {
        key: 'STATIC_CHARGE',
        name: 'Static Charge',
        description: 'Bottled electricity. Handle with insulation.',
        itemType: ItemType.RESOURCE,
        baseValue: 60,
        isTradable: true,
        resourceType: 'Energy'
    },
    HOURGLASS_SAND: {
        key: 'HOURGLASS_SAND',
        name: 'Hourglass Sand',
        description: 'Flows upward. Used in temporal stabilizers.',
        itemType: ItemType.RESOURCE,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    PARADOX_CORE: {
        key: 'PARADOX_CORE',
        name: 'Paradox Core',
        description: 'A stabilizing unit for time machines. Exists in two states at once.',
        itemType: ItemType.RESOURCE,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    FUTURE_TECH: {
        key: 'FUTURE_TECH',
        name: 'Unidentified Future Tech',
        description: 'Advanced technology that hasn\'t been invented yet.',
        itemType: ItemType.RESOURCE,
        baseValue: 800,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    END_STONE: {
        key: 'END_STONE',
        name: 'End Stone',
        description: 'Material from the end of time. Utterly inert.',
        itemType: ItemType.RESOURCE,
        baseValue: 1500,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },

    // --- Act VI: The Fading Light ---
    ACID_GLAND: {
        key: 'ACID_GLAND',
        name: 'Acid Gland',
        description: 'Corrosive organ harvested from Void Leech.',
        itemType: ItemType.RESOURCE,
        baseValue: 60,
        isTradable: true,
        resourceType: 'Biowaste'
    },
    CHITIN_PLATE: {
        key: 'CHITIN_PLATE',
        name: 'Chitin Plate',
        description: 'Hardened insectoid armor. Lightweight and tough.',
        itemType: ItemType.RESOURCE,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Biowaste'
    },
    TOXIN_SACK: {
        key: 'TOXIN_SACK',
        name: 'Toxin Sack',
        description: 'Poison gland. Used in chemical weapons.',
        itemType: ItemType.RESOURCE,
        baseValue: 70,
        isTradable: true,
        resourceType: 'Chemicals'
    },
    EXPLOSIVE_GAS: {
        key: 'EXPLOSIVE_GAS',
        name: 'Explosive Gas',
        description: 'Volatile compound harvested from Bloaters.',
        itemType: ItemType.RESOURCE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Gas'
    },
    BLACK_HOLE_MOTE: {
        key: 'BLACK_HOLE_MOTE',
        name: 'Black Hole Mote',
        description: 'A contained singularity. Heaviest object you can carry.',
        itemType: ItemType.RESOURCE,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    DARK_MATTER: {
        key: 'DARK_MATTER',
        name: 'Dark Matter',
        description: 'Exotic matter that interacts only with gravity.',
        itemType: ItemType.RESOURCE,
        baseValue: 3000,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    ESSENCE_OF_NOTHING: {
        key: 'ESSENCE_OF_NOTHING',
        name: 'Essence of Nothing',
        description: 'Concentrated void. Looking at it hurts.',
        itemType: ItemType.RESOURCE,
        baseValue: 2000,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    LEGENDARY_WEAPON_PART: {
        key: 'LEGENDARY_WEAPON_PART',
        name: 'Legendary Weapon Part',
        description: 'Component for a god-tier weapon. Radiates power.',
        itemType: ItemType.RESOURCE,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },

    // --- Act VII: The Eideus Ascent ---
    LOGIC_GATE: {
        key: 'LOGIC_GATE',
        name: 'Logic Gate',
        description: 'Physical manifestation of logic. Used in Node construction.',
        itemType: ItemType.RESOURCE,
        baseValue: 200,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    PURE_LIGHT: {
        key: 'PURE_LIGHT',
        name: 'Pure Light',
        description: 'Solidified photons. Warm to the touch.',
        itemType: ItemType.RESOURCE,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    BATTERY_CORE: {
        key: 'BATTERY_CORE',
        name: 'Battery Core',
        description: 'Power unit from a Node. Massive energy density.',
        itemType: ItemType.RESOURCE,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Electronics'
    },
    WING_SHARD: {
        key: 'WING_SHARD',
        name: 'Wing Shard',
        description: 'Fragment of an Archon\'s wing. Sharp as a razor.',
        itemType: ItemType.RESOURCE,
        baseValue: 600,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    PERFECT_CORE: {
        key: 'PERFECT_CORE',
        name: 'Perfect Core',
        description: 'Flawless energy source. The pinnacle of technology.',
        itemType: ItemType.RESOURCE,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    INFINITE_ENERGY: {
        key: 'INFINITE_ENERGY',
        name: 'Infinite Energy',
        description: 'Unlimited power. A piece of the Lattice itself.',
        itemType: ItemType.RESOURCE,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Exotic Matter'
    }
};