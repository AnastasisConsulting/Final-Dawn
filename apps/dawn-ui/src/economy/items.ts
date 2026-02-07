import { Item, ItemType } from '../types';

export const ITEMS: Record<string, Item> = {
    // === EXISTING ITEMS ===

    // Weapons
    BLASTER_PISTOL: {
        key: 'BLASTER_PISTOL',
        name: 'Blaster Pistol',
        description: 'A reliable, if uninspired, sidearm. Standard issue for corporate security.',
        itemType: ItemType.WEAPON,
        baseValue: 450,
        isTradable: true,
        resourceType: 'Scrap Metal',
    },
    COMBAT_KNIFE: {
        key: 'COMBAT_KNIFE',
        name: 'Combat Knife',
        description: 'A sharpened piece of metal for when things get too personal.',
        itemType: ItemType.WEAPON,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Scrap Metal',
    },
    PLASMA_RIFLE: {
        key: 'PLASMA_RIFLE',
        name: 'Plasma Rifle',
        description: 'Fires bolts of superheated plasma. A-Grade military hardware. Possession without a license is a Core-Sys felony.',
        itemType: ItemType.WEAPON,
        baseValue: 2800,
        isTradable: true,
        resourceType: 'High-Tech Parts',
    },
    SLAG_CANNON: {
        key: 'SLAG_CANNON',
        name: 'Slag Cannon',
        description: 'A jury-rigged projectile weapon that fires superheated shrapnel. Inaccurate, devastating, and prone to jamming.',
        itemType: ItemType.WEAPON,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Scrap Metal',
    },
    SHOCK_BATON: {
        key: 'SHOCK_BATON',
        name: 'Shock Baton',
        description: 'Standard issue "Peacekeeper" non-lethal deterrent. Can be overcharged to... lethal settings.',
        itemType: ItemType.WEAPON,
        baseValue: 250,
        isTradable: true,
        resourceType: 'Electronics',
    },
    MONO_WHIP: {
        key: 'MONO_WHIP',
        name: 'Monofilament Whip',
        description: 'A retractable, molecular-thin wire. An elegant and terrifyingly illegal assassination tool.',
        itemType: ItemType.WEAPON,
        baseValue: 4500,
        isTradable: true,
        resourceType: 'High-Tech Parts',
    },

    // Ship Weapons
    RAILGUN_TURRET: {
        key: 'RAILGUN_TURRET',
        name: 'Railgun Turret (Class I)',
        description: 'A standard magnetic accelerator cannon. Good for cracking asteroids and pirate hulls alike.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 15000,
        isTradable: true,
        resourceType: 'Ship Components',
    },
    LASER_CUTTER_ARRAY: {
        key: 'LASER_CUTTER_ARRAY',
        name: 'Mining Laser Array',
        description: 'A high-yield mining tool. Not designed for combat, but a focused beam cuts through hulls all the same.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 8000,
        isTradable: true,
        resourceType: 'Ship Components',
    },
    EMP_PULSER: {
        key: 'EMP_PULSER',
        name: 'EMP Pulser',
        description: 'Fires a directed electromagnetic pulse to disable ship systems. Highly illegal in Core-Sys space.',
        itemType: ItemType.SHIP_WEAPON,
        baseValue: 22000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
    },

    // Armor
    FLAK_JACKET: {
        key: 'FLAK_JACKET',
        name: 'Flak Jacket',
        description: 'Layers of synth-weave and trauma plates. Standard for any Fringe-dweller who expects to get shot.',
        itemType: ItemType.ARMOR,
        baseValue: 600,
        isTradable: true,
        resourceType: 'Synth-Weave',
    },
    COMBINE_ARMOR: {
        key: 'COMBINE_ARMOR',
        name: 'Core-Sys Enforcer Armor',
        description: 'Gleaming white plasteel armor. Provides excellent protection and marks you as a corporate loyalist.',
        itemType: ItemType.ARMOR,
        baseValue: 3500,
        isTradable: true,
        resourceType: 'Plasteel',
    },
    VOID_RIG: {
        key: 'VOID_RIG',
        name: 'Salvager\'s Void-Rig',
        description: 'A bulky, sealed environment suit with magnetic boots and small maneuvering thrusters. Built to survive hard vacuum.',
        itemType: ItemType.ARMOR,
        baseValue: 1800,
        isTradable: true,
        resourceType: 'Ship Components',
    },

    // Ship Modules
    FTL_DRIVE_A_GRADE: {
        key: 'FTL_DRIVE_A_GRADE',
        name: 'FTL Drive (A-Grade)',
        description: 'A top-of-the-line, Combine-certified FTL drive. Fast, efficient, and requires a registered license.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 150000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
    },
    FTL_DRIVE_JURY_RIGGED: {
        key: 'FTL_DRIVE_JURY_RIGGED',
        name: 'Jury-Rigged FTL Drive',
        description: 'A mess of stolen parts and hope. It *probably* won\'t mis-jump you into a star. Cheaper, though.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 40000,
        isTradable: true,
        resourceType: 'Scrap Metal',
    },
    CARGO_SCAN_SPOOFER: {
        key: 'CARGO_SCAN_SPOOFER',
        name: 'Cargo Scan Spoofer',
        description: 'Generates false sensor readings to hide contraband from Combine patrols. Draws suspicion if detected.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 30000,
        isTradable: true,
        resourceType: 'Electronics',
    },
    RESONANCE_SCOOP: {
        key: 'RESONANCE_SCOOP',
        name: 'Resonance Scoop',
        description: 'A specialized module for safely harvesting exotic matter and unstable particles from Void-Storms.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 55000,
        isTradable: true,
        resourceType: 'High-Tech Parts',
    },
    EXTENDED_CARGO_HOLD: {
        key: 'EXTENDED_CARGO_HOLD',
        name: 'Extended Cargo Hold',
        description: 'Bolts an extra, unshielded container to your hull. What could go wrong?',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 12000,
        isTradable: true,
        resourceType: 'Tritanium',
    },

    // Cybernetics
    CYBER_EYE_BASIC: {
        key: 'CYBER_EYE_BASIC',
        name: 'Cyber-Eye (Basic)',
        description: 'A standard-issue optical replacement. Sees in the human-visible spectrum, just like the fleshy original.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 1500,
        isTradable: true,
        resourceType: 'Electronics',
    },
    KERENZIKOV_BOOSTER: {
        key: 'KERENZIKOV_BOOSTER',
        name: 'Kerenzikov Booster',
        description: 'A military-grade spinal implant that speeds up your reflexes. Highly illegal and drains bio-energy fast.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 9000,
        isTradable: true,
        resourceType: 'Illegal Cybernetics',
    },
    DATA_JACK: {
        key: 'DATA_JACK',
        name: 'Neural Data-Jack',
        description: 'A port at the base of the skull for direct interface with data systems. Standard for any serious hacker.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 3000,
        isTradable: true,
        resourceType: 'Electronics',
    },
    SYNTH_LIVER: {
        key: 'SYNTH_LIVER',
        name: 'Synth-Liver',
        description: 'An upgraded liver that filters common toxins, poisons, and cheap Fringe booze twice as fast.',
        itemType: ItemType.CYBERNETIC,
        baseValue: 2200,
        isTradable: true,
        resourceType: 'Biowaste',
    },

    // Consumables
    MEDKIT: {
        key: 'MEDKIT',
        name: 'Medkit',
        description: 'A syringe of synth-blood and a roll of self-sealing bandages. Heals minor wounds.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 75,
        isTradable: true,
        resourceType: 'Biowaste',
    },
    STIM_PACK: {
        key: 'STIM_PACK',
        name: 'Stim-Pack',
        description: 'A combat stimulant. Boosts adrenaline and dulls pain. Highly addictive.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 120,
        isTradable: true,
        resourceType: 'Chemicals',
    },
    RATIONS_CORP: {
        key: 'RATIONS_CORP',
        name: 'Core-Sys Rations',
        description: 'A gray, nutrient-rich paste. Tastes like nothing. Fills your stomach. Approved by the SCS.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Biowaste',
    },
    SYNTH_BOOZE: {
        key: 'SYNTH_BOOZE',
        name: 'Synth-Booze',
        description: 'A bottle of fluorescent blue liquid from a Fringe still. Burns on the way down. And on the way up.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 25,
        isTradable: true,
        resourceType: 'Chemicals',
    },
    DRIVE_PATCH: {
        key: 'DRIVE_PATCH',
        name: 'FTL Drive-Patch',
        description: 'A transdermal patch that counters the nausea and disorientation from FTL jumps.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Chemicals',
    },

    // Resources & Commodities
    ISOTOPIC_FUEL: {
        key: 'ISOTOPIC_FUEL',
        name: 'Isotopic Fuel',
        description: 'Highly volatile starship fuel. Handle with care.',
        itemType: ItemType.RESOURCE,
        baseValue: 200,
        isTradable: true,
        resourceType: 'Isotopic Fuel',
    },
    XENON_GAS: {
        key: 'XENON_GAS',
        name: 'Xenon Gas',
        description: 'Pressurized gas used in high-efficiency ion drives.',
        itemType: ItemType.RESOURCE,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Xenon Gas',
    },
    SCRAP_METAL: {
        key: 'SCRAP_METAL',
        name: 'Scrap Metal',
        description: 'Salvaged parts from derelict ships. Can be recycled.',
        itemType: ItemType.RESOURCE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Scrap Metal',
    },
    QUANTUM_DATA: {
        key: 'QUANTUM_DATA',
        name: 'Quantum Data',
        description: 'A data slate containing encrypted information. Potentially valuable.',
        itemType: ItemType.RESOURCE,
        baseValue: 500,
        isTradable: true,
        resourceType: 'Quantum Data',
    },
    CRYSTAL_ORES: {
        key: 'CRYSTAL_ORES',
        name: 'Crystallized Delta Ores',
        description: 'Rare ores with unique energy conductive properties.',
        itemType: ItemType.RESOURCE,
        baseValue: 800,
        isTradable: true,
        resourceType: 'Crystallized Delta Ores',
    },
    BIOWASTE: {
        key: 'BIOWASTE',
        name: 'Biowaste',
        description: 'Organic refuse. Gross, but essential for various bio-synthesis processes.',
        itemType: ItemType.RESOURCE,
        baseValue: 20,
        isTradable: true,
        resourceType: 'Biowaste',
    },
    ILLEGAL_CYBERNETICS: {
        key: 'ILLEGAL_CYBERNETICS',
        name: 'Illegal Cybernetics',
        description: 'Black market augmentations. High-performance, high-risk.',
        itemType: ItemType.RESOURCE,
        baseValue: 1200,
        isTradable: true,
        resourceType: 'Illegal Cybernetics',
    },
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
    TRITANIUM_ORE: {
        key: 'TRITANIUM_ORE',
        name: 'Tritanium Ore',
        description: 'A common, durable metal found in most asteroid belts.',
        itemType: ItemType.RESOURCE,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Tritanium',
    },
    UNSTABLE_VOID_SHARDS: {
        key: 'UNSTABLE_VOID_SHARDS',
        name: 'Unstable Void-Shards',
        description: 'Raw exotic matter harvested from a Void-Storm. Highly dangerous and extremely valuable.',
        itemType: ItemType.RESOURCE,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'Exotic Matter',
    },
    PRECURSOR_RELIC: {
        key: 'PRECURSOR_RELIC',
        name: 'Precursor Relic',
        description: 'An inert fragment of unknown alien technology. The Combine pays a fortune for it... but so do others.',
        itemType: ItemType.RESOURCE,
        baseValue: 25000,
        isTradable: true,
        resourceType: 'Exotic Matter',
    },
    GENETIC_SAMPLES: {
        key: 'GENETIC_SAMPLES',
        name: 'Genetic Samples',
        description: 'A cryo-vial of unidentified genetic material. Sourced... questionably. High value on the black market.',
        itemType: ItemType.RESOURCE,
        baseValue: 3000,
        isTradable: true,
        resourceType: 'Biowaste',
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

    // Data & Intel
    ENCRYPTED_SHIP_MANIFEST: {
        key: 'ENCRYPTED_SHIP_MANIFEST',
        name: 'Encrypted Ship Manifest',
        description: 'A corporate manifest, locked tight. Contains cargo data. Could be valuable to pirates... or the competition.',
        itemType: ItemType.DATA,
        baseValue: 700,
        isTradable: true,
        resourceType: 'Quantum Data',
    },
    BLACKMAIL_FILES: {
        key: 'BLACKMAIL_FILES',
        name: 'Blackmail Files',
        description: 'Incriminating data on a mid-level Core-Sys executive. A risky, but profitable, thing to hold.',
        itemType: ItemType.DATA,
        baseValue: 4000,
        isTradable: true,
        resourceType: 'Quantum Data',
    },
    FRINGE_JUMP_ROUTES: {
        key: 'FRINGE_JUMP_ROUTES',
        name: 'Fringe Jump Routes',
        description: 'A set of unsanctioned FTL coordinates, leading to hidden stations and asteroid bases.',
        itemType: ItemType.DATA,
        baseValue: 2500,
        isTradable: true,
        resourceType: 'Quantum Data',
    },
    COMBINE_PATROL_TIMETABLE: {
        key: 'COMBINE_PATROL_TIMETABLE',
        name: 'Combine Patrol Timetable',
        description: 'A stolen timetable of Peacekeeper patrols for this sector. Useful for smuggling.',
        itemType: ItemType.DATA,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'Quantum Data',
    },

    // Junk
    JUNK_PARTS: {
        key: 'JUNK_PARTS',
        name: 'Junk Parts',
        description: 'A handful of rusted bolts, frayed wires, and cracked casings. The literal currency of the Fringe.',
        itemType: ItemType.JUNK,
        baseValue: 1,
        isTradable: true,
        resourceType: 'Slag',
    },
    BURNED_OUT_CIRCUIT: {
        key: 'BURNED_OUT_CIRCUIT',
        name: 'Burned-Out Circuit',
        description: 'A fried circuit board. Useless for repair.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag',
    },
    EMPTY_STIM_SYRINGE: {
        key: 'EMPTY_STIM_SYRINGE',
        name: 'Empty Stim Syringe',
        description: 'The discarded remnants of a quick fix.',
        itemType: ItemType.JUNK,
        baseValue: 2,
        isTradable: true,
        resourceType: 'Slag',
    },

    // Luxury
    ALTAIRIAN_WINE: {
        key: 'ALTAIRIAN_WINE',
        name: 'Altairian Wine',
        description: 'A bottle of vintage wine from a terraformed paradise world. Worth more than a freighter-full of ore.',
        itemType: ItemType.LUXURY,
        baseValue: 10000,
        isTradable: true,
        resourceType: 'Luxury Goods',
    },
    CENTAURI_SILK: {
        key: 'CENTAURI_SILK',
        name: 'Centauri Silk',
        description: 'A bolt of genetically-engineered silk, impossibly light and strong. Hoarded by Core-Sys elites.',
        itemType: ItemType.LUXURY,
        baseValue: 18000,
        isTradable: true,
        resourceType: 'Luxury Goods',
    },
    PRECURSOR_ART: {
        key: 'PRECURSOR_ART',
        name: 'Precursor Art',
        description: 'A small, impossibly-shaped sculpture of unknown origin. Has no function, but is a status symbol for the ultra-rich.',
        itemType: ItemType.LUXURY,
        baseValue: 80000,
        isTradable: true,
        resourceType: 'Luxury Goods',
    },

    // Quest Items
    EXECUTIVES_KEYCARD: {
        key: 'EXECUTIVES_KEYCARD',
        name: 'Executive\'s Keycard',
        description: 'A high-level Core-Sys keycard. Belongs to someone important.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest',
    },
    PROTOTYPE_FTL_COIL: {
        key: 'PROTOTYPE_FTL_COIL',
        name: 'Prototype FTL Coil',
        description: 'A one-of-a-kind experimental drive coil. A fixer wants this badly.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest',
    },

    // === ACT I NEW ITEMS ===
    FUNGAL_SAMPLE: {
        key: 'FUNGAL_SAMPLE',
        name: 'Fungal Sample',
        description: 'A glowing sample of radiation-eating fungus.',
        itemType: ItemType.RESOURCE,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Biowaste'
    },
    RAT_TAIL: {
        key: 'RAT_TAIL',
        name: 'Rat Tail',
        description: 'A trophy from a rad-rat. Not worth much.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag'
    },
    MITE_CARAPACE: {
        key: 'MITE_CARAPACE',
        name: 'Mite Carapace',
        description: 'Hardened shell of a slag-mite.',
        itemType: ItemType.RESOURCE,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag'
    },
    INSECT_WING: {
        key: 'INSECT_WING',
        name: 'Insect Wing',
        description: 'Iridescent wing from a void fly.',
        itemType: ItemType.RESOURCE,
        baseValue: 8,
        isTradable: true,
        resourceType: 'Biowaste'
    },
    SMALL_BATTERY: {
        key: 'SMALL_BATTERY',
        name: 'Small Battery',
        description: 'Depleted but recyclable.',
        itemType: ItemType.JUNK,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    LASER_CUTTER_LENS: {
        key: 'LASER_CUTTER_LENS',
        name: 'Laser Cutter Lens',
        description: 'Focusing lens from an industrial cutter.',
        itemType: ItemType.RESOURCE,
        baseValue: 45,
        isTradable: true,
        resourceType: 'Electronics'
    },
    COPPER_WIRE: {
        key: 'COPPER_WIRE',
        name: 'Copper Wire',
        description: 'Simple conductive wire.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    SAW_BLADE: {
        key: 'SAW_BLADE',
        name: 'Industrial Saw Blade',
        description: 'A rusty saw blade, improvised as a melee weapon.',
        itemType: ItemType.WEAPON,
        baseValue: 25,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    HYDRAULIC_PISTON: {
        key: 'HYDRAULIC_PISTON',
        name: 'Hydraulic Piston',
        description: 'Heavy duty piston.',
        itemType: ItemType.RESOURCE,
        baseValue: 35,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    SECURITY_KEYCARD: {
        key: 'SECURITY_KEYCARD',
        name: 'Security Keycard',
        description: 'Access card for low-level security doors.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    MECH_SERVO: {
        key: 'MECH_SERVO',
        name: 'Mech Servo',
        description: 'A functioning servo from a riot mech.',
        itemType: ItemType.RESOURCE,
        baseValue: 60,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    DATA_PAD: {
        key: 'DATA_PAD',
        name: 'Data Pad',
        description: 'Contains mundane logs and personal notes.',
        itemType: ItemType.DATA,
        baseValue: 25,
        isTradable: true,
        resourceType: 'Data'
    },

    // === ACT II NEW ITEMS ===
    INK_CARTRIDGE: {
        key: 'INK_CARTRIDGE',
        name: 'Ink Cartridge',
        description: 'Standard issue black ink.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag'
    },
    LEGAL_FORM_88E: {
        key: 'LEGAL_FORM_88E',
        name: 'Legal Form 88-E',
        description: 'A request for self-deletion. Denied.',
        itemType: ItemType.JUNK,
        baseValue: 1,
        isTradable: true,
        resourceType: 'Paperwork'
    },
    SPY_EYE_LENS: {
        key: 'SPY_EYE_LENS',
        name: 'Spy-Eye Lens',
        description: 'High-grade optical lens for surveillance.',
        itemType: ItemType.RESOURCE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Electronics'
    },
    BLACK_INK: {
        key: 'BLACK_INK',
        name: 'Black Ink',
        description: 'A vial of pure black ink.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag'
    },
    CENSORED_FILE: {
        key: 'CENSORED_FILE',
        name: 'Censored File',
        description: 'Most of the text is redacted.',
        itemType: ItemType.DATA,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Quantum Data'
    },
    RED_PEN: {
        key: 'RED_PEN',
        name: 'Red Pen',
        description: 'Used for rejecting forms.',
        itemType: ItemType.JUNK,
        baseValue: 2,
        isTradable: true,
        resourceType: 'Slag'
    },
    TAX_RECORD: {
        key: 'TAX_RECORD',
        name: 'Tax Record',
        description: 'Boring but valuable to the right clerk.',
        itemType: ItemType.DATA,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Data'
    },
    EMP_PULSER_PARTS: {
        key: 'EMP_PULSER_PARTS',
        name: 'EMP Pulser Parts',
        description: 'Components for an EMP device.',
        itemType: ItemType.RESOURCE,
        baseValue: 75,
        isTradable: true,
        resourceType: 'Electronics'
    },
    STUN_GRENADE: {
        key: 'STUN_GRENADE',
        name: 'Stun Grenade',
        description: 'Non-lethal explosive device.',
        itemType: ItemType.WEAPON,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Explosives'
    },
    WEAPON_LICENSE: {
        key: 'WEAPON_LICENSE',
        name: 'Weapon License',
        description: 'A forged or legitimate permit for firearms.',
        itemType: ItemType.DATA,
        baseValue: 200,
        isTradable: true,
        resourceType: 'Data'
    },
    PRISON_KEYS: {
        key: 'PRISON_KEYS',
        name: 'Prison Keys',
        description: 'Keys to a containment cell.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    NULL_CUFFS: {
        key: 'NULL_CUFFS',
        name: 'Null-Cuffs',
        description: 'Broken restraints.',
        itemType: ItemType.JUNK,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    HIGH_GRADE_SHIELD: {
        key: 'HIGH_GRADE_SHIELD',
        name: 'High-Grade Shield',
        description: 'Personal energy shield generator.',
        itemType: ItemType.ARMOR,
        baseValue: 1200,
        isTradable: true,
        resourceType: 'Shield Technology'
    },
    LAW_CODEX: {
        key: 'LAW_CODEX',
        name: 'Law Codex',
        description: 'A digital copy of the Technocracy\'s infinite laws.',
        itemType: ItemType.DATA,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Data'
    },
    GOLDEN_GAVEL: {
        key: 'GOLDEN_GAVEL',
        name: 'Golden Gavel',
        description: 'A ceremonial gavel made of solid gold.',
        itemType: ItemType.LUXURY,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'Luxury Goods'
    },
    VERDICT_TOKEN: {
        key: 'VERDICT_TOKEN',
        name: 'Verdict Token',
        description: 'A token representing a guilty verdict.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag'
    },
    JUROR_BADGE: {
        key: 'JUROR_BADGE',
        name: 'Juror Badge',
        description: 'Identification for a court juror.',
        itemType: ItemType.JUNK,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Slag'
    },
    EXECUTION_HOOD: {
        key: 'EXECUTION_HOOD',
        name: 'Execution Hood',
        description: 'Grim headwear offering intimidation but little protection.',
        itemType: ItemType.ARMOR,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Cloth'
    },
    MONO_BLADE: {
        key: 'MONO_BLADE',
        name: 'Mono-Blade',
        description: 'A sword with a monofilament edge.',
        itemType: ItemType.WEAPON,
        baseValue: 800,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },

    // === ACT III NEW ITEMS ===
    CORRUPTED_MEMORY: {
        key: 'CORRUPTED_MEMORY',
        name: 'Corrupted Memory',
        description: 'A fragmented data shard.',
        itemType: ItemType.DATA,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Quantum Data'
    },
    GLITCH_DUST: {
        key: 'GLITCH_DUST',
        name: 'Glitch Dust',
        description: 'Shimmering particulate that defies physics.',
        itemType: ItemType.RESOURCE,
        baseValue: 20,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    OLD_DOG_TAG: {
        key: 'OLD_DOG_TAG',
        name: 'Old Dog Tag',
        description: 'Identification from a forgotten war.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag'
    },
    FADED_PHOTO: {
        key: 'FADED_PHOTO',
        name: 'Faded Photo',
        description: 'A blurry image of someone who no longer exists.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Paper'
    },
    VOID_ESSENCE: {
        key: 'VOID_ESSENCE',
        name: 'Void Essence',
        description: 'A contained mote of pure void energy.',
        itemType: ItemType.RESOURCE,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    WHITE_NOISE_TAPE: {
        key: 'WHITE_NOISE_TAPE',
        name: 'White Noise Tape',
        description: 'Plays only static.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag'
    },
    BROKEN_WATCH: {
        key: 'BROKEN_WATCH',
        name: 'Broken Watch',
        description: 'Stopped at a specific time.',
        itemType: ItemType.JUNK,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Slag'
    },
    RAILGUN_TURRET_PARTS: {
        key: 'RAILGUN_TURRET_PARTS',
        name: 'Railgun Turret Parts',
        description: 'Scrap from a heavy weapon.',
        itemType: ItemType.RESOURCE,
        baseValue: 200,
        isTradable: true,
        resourceType: 'Ship Components'
    },
    HEAVY_PLATING: {
        key: 'HEAVY_PLATING',
        name: 'Heavy Plating',
        description: 'Thick armor plating.',
        itemType: ItemType.RESOURCE,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Tritanium'
    },
    ANTIQUE_AMMO: {
        key: 'ANTIQUE_AMMO',
        name: 'Antique Ammo',
        description: 'Bullets for a gun no longer made.',
        itemType: ItemType.JUNK,
        baseValue: 20,
        isTradable: true,
        resourceType: 'Slag'
    },
    WAR_MEDAL: {
        key: 'WAR_MEDAL',
        name: 'War Medal',
        description: 'A commendation for bravery in a lost war.',
        itemType: ItemType.LUXURY,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Luxury Goods'
    },
    BELT_FEED: {
        key: 'BELT_FEED',
        name: 'Belt Feed',
        description: 'Ammunition belt mechanism.',
        itemType: ItemType.JUNK,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    SHELL_CASING: {
        key: 'SHELL_CASING',
        name: 'Shell Casing',
        description: 'Spent artillery casing.',
        itemType: ItemType.JUNK,
        baseValue: 2,
        isTradable: true,
        resourceType: 'Brass'
    },
    MIRROR_FRAGMENT: {
        key: 'MIRROR_FRAGMENT',
        name: 'Mirror Fragment',
        description: 'A shard that reflects things that aren\'t there.',
        itemType: ItemType.RESOURCE,
        baseValue: 250,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    PURE_ENERGY_CELL: {
        key: 'PURE_ENERGY_CELL',
        name: 'Pure Energy Cell',
        description: 'High-capacity power source.',
        itemType: ItemType.RESOURCE,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Electronics'
    },
    TIMELESS_GEM: {
        key: 'TIMELESS_GEM',
        name: 'Timeless Gem',
        description: 'A gem that seems unaffected by entropy.',
        itemType: ItemType.LUXURY,
        baseValue: 4000,
        isTradable: true,
        resourceType: 'Luxury Goods'
    },
    REFRACTED_LIGHT_CRYSTAL: {
        key: 'REFRACTED_LIGHT_CRYSTAL',
        name: 'Refracted Light Crystal',
        description: 'Traps light in impossible angles.',
        itemType: ItemType.RESOURCE,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    SILVER_GLASS: {
        key: 'SILVER_GLASS',
        name: 'Silver Glass',
        description: 'Reflective material from the Void Mirror.',
        itemType: ItemType.RESOURCE,
        baseValue: 120,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },

    // === ACT IV NEW ITEMS ===
    SENSOR_ARRAY: {
        key: 'SENSOR_ARRAY',
        name: 'Sensor Array',
        description: 'Advanced scanning suite components.',
        itemType: ItemType.SHIP_MODULE,
        baseValue: 500,
        isTradable: true,
        resourceType: 'Electronics'
    },
    TRACKING_CHIP: {
        key: 'TRACKING_CHIP',
        name: 'Tracking Chip',
        description: 'Used for tagging targets.',
        itemType: ItemType.RESOURCE,
        baseValue: 80,
        isTradable: true,
        resourceType: 'Electronics'
    },
    BATTERY_PACK: {
        key: 'BATTERY_PACK',
        name: 'Battery Pack',
        description: 'Standard energy cell.',
        itemType: ItemType.RESOURCE,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Electronics'
    },
    WIRE_SPOOL: {
        key: 'WIRE_SPOOL',
        name: 'Wire Spool',
        description: 'Copper wiring.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    SMOKE_GRENADE: {
        key: 'SMOKE_GRENADE',
        name: 'Smoke Grenade',
        description: 'Creates a cloud of obscuring smoke.',
        itemType: ItemType.WEAPON,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Explosives'
    },
    PAINT_TAG: {
        key: 'PAINT_TAG',
        name: 'Paint Tag',
        description: 'Used for marking targets.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Chemicals'
    },
    NET_LAUNCHER: {
        key: 'NET_LAUNCHER',
        name: 'Net Launcher',
        description: 'Fires a weighted net to immobilize targets.',
        itemType: ItemType.WEAPON,
        baseValue: 400,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    FAKE_ID: {
        key: 'FAKE_ID',
        name: 'Fake ID',
        description: 'A high-quality forgery.',
        itemType: ItemType.DATA,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Data'
    },
    VIRUS_UPLOAD_SPIKE: {
        key: 'VIRUS_UPLOAD_SPIKE',
        name: 'Virus Upload Spike',
        description: 'Single-use hacking tool.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Cybernetics'
    },
    DECRYPTION_KEY: {
        key: 'DECRYPTION_KEY',
        name: 'Decryption Key',
        description: 'Bypasses one layer of encryption.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 200,
        isTradable: true,
        resourceType: 'Data'
    },
    SIGNAL_JAMMER: {
        key: 'SIGNAL_JAMMER',
        name: 'Signal Jammer',
        description: 'Blocks comms in a small area.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Electronics'
    },
    HIGH_SEC_PASS: {
        key: 'HIGH_SEC_PASS',
        name: 'High-Sec Pass',
        description: 'Access to high-security areas.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    MASTERWORK_BLASTER: {
        key: 'MASTERWORK_BLASTER',
        name: 'Masterwork Blaster',
        description: 'Finely tuned energy weapon.',
        itemType: ItemType.WEAPON,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    LEGAL_IMMUNITY_CHIP: {
        key: 'LEGAL_IMMUNITY_CHIP',
        name: 'Legal Immunity Chip',
        description: 'Grants temporary immunity to scans.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    TORTURE_TOOL: {
        key: 'TORTURE_TOOL',
        name: 'Torture Tool',
        description: 'Grim implement of the Inquisitors.',
        itemType: ItemType.JUNK,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Slag'
    },
    CELL_KEY: {
        key: 'CELL_KEY',
        name: 'Cell Key',
        description: 'Opens a specific cell.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },

    // === ACT V NEW ITEMS ===
    CHRONAL_DUST: {
        key: 'CHRONAL_DUST',
        name: 'Chronal Dust',
        description: 'Dust that ages whatever it touches.',
        itemType: ItemType.RESOURCE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    STATIC_CHARGE: {
        key: 'STATIC_CHARGE',
        name: 'Static Charge',
        description: 'Bottled electricity.',
        itemType: ItemType.RESOURCE,
        baseValue: 60,
        isTradable: true,
        resourceType: 'Energy'
    },
    LOST_TOY: {
        key: 'LOST_TOY',
        name: 'Lost Toy',
        description: 'A child\'s plaything, displaced in time.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag'
    },
    TIME_LOST_COIN: {
        key: 'TIME_LOST_COIN',
        name: 'Time-Lost Coin',
        description: 'Currency from a fallen empire.',
        itemType: ItemType.JUNK,
        baseValue: 500,
        isTradable: true,
        resourceType: 'Luxury Goods'
    },
    HOURGLASS_SAND: {
        key: 'HOURGLASS_SAND',
        name: 'Hourglass Sand',
        description: 'Flows upward.',
        itemType: ItemType.RESOURCE,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    CLOCK_GEAR: {
        key: 'CLOCK_GEAR',
        name: 'Clock Gear',
        description: 'Brass gear from a chronometer.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Brass'
    },
    RUSTED_BLASTER: {
        key: 'RUSTED_BLASTER',
        name: 'Rusted Blaster',
        description: 'Barely functional firearm.',
        itemType: ItemType.WEAPON,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    BROKEN_MEDKIT: {
        key: 'BROKEN_MEDKIT',
        name: 'Broken Medkit',
        description: 'Empty and cracked.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Plastic'
    },
    PERSONAL_DIARY: {
        key: 'PERSONAL_DIARY',
        name: 'Personal Diary',
        description: 'Notes from a deceased scavenger.',
        itemType: ItemType.DATA,
        baseValue: 20,
        isTradable: true,
        resourceType: 'Data'
    },
    SCRUBBER_ID_TAG: {
        key: 'SCRUBBER_ID_TAG',
        name: 'Scrubber ID Tag',
        description: 'Identify friend or foe.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Plastic'
    },
    SPARE_OXYGEN: {
        key: 'SPARE_OXYGEN',
        name: 'Spare Oxygen',
        description: 'Emergency air supply.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Gas'
    },
    HIDDEN_STASH_MAP: {
        key: 'HIDDEN_STASH_MAP',
        name: 'Hidden Stash Map',
        description: 'Coordinates to a cache.',
        itemType: ItemType.DATA,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Data'
    },
    OVERHEATED_RIFLE: {
        key: 'OVERHEATED_RIFLE',
        name: 'Overheated Rifle',
        description: 'Slagged weapon barrel.',
        itemType: ItemType.JUNK,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Scrap Metal'
    },
    PARADOX_CORE: {
        key: 'PARADOX_CORE',
        name: 'Paradox Core',
        description: 'A stabilizing unit for time machines.',
        itemType: ItemType.RESOURCE,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    FUTURE_TECH: {
        key: 'FUTURE_TECH',
        name: 'Unidentified Future Tech',
        description: 'Unidentifiable advanced technology.',
        itemType: ItemType.RESOURCE,
        baseValue: 800,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    SKILL_POINT_SHARD: {
        key: 'SKILL_POINT_SHARD',
        name: 'Skill Point Shard',
        description: 'Instantly grants a skill point.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Special'
    },
    REALITY_ANCHOR: {
        key: 'REALITY_ANCHOR',
        name: 'Reality Anchor',
        description: 'Stabilizes local reality.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    LOOP_RING: {
        key: 'LOOP_RING',
        name: 'Loop Ring',
        description: 'A ring that has no beginning or end.',
        itemType: ItemType.LUXURY,
        baseValue: 2500,
        isTradable: true,
        resourceType: 'Jewelry'
    },
    END_STONE: {
        key: 'END_STONE',
        name: 'End Stone',
        description: 'Material from the end of time.',
        itemType: ItemType.RESOURCE,
        baseValue: 1500,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },

    // === ACT VI NEW ITEMS ===
    ACID_GLAND: {
        key: 'ACID_GLAND',
        name: 'Acid Gland',
        description: 'Corrosive organ.',
        itemType: ItemType.RESOURCE,
        baseValue: 60,
        isTradable: true,
        resourceType: 'Biowaste'
    },
    CHITIN_PLATE: {
        key: 'CHITIN_PLATE',
        name: 'Chitin Plate',
        description: 'Hardened insectoid armor.',
        itemType: ItemType.RESOURCE,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Biowaste'
    },
    VOID_MEAT: {
        key: 'VOID_MEAT',
        name: 'Void Meat',
        description: 'Edible? Maybe.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Food'
    },
    TOXIN_SACK: {
        key: 'TOXIN_SACK',
        name: 'Toxin Sack',
        description: 'Poison gland.',
        itemType: ItemType.RESOURCE,
        baseValue: 70,
        isTradable: true,
        resourceType: 'Chemicals'
    },
    JAW_BONE: {
        key: 'JAW_BONE',
        name: 'Jaw Bone',
        description: 'From a void predator.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Bone'
    },
    EXPLOSIVE_GAS: {
        key: 'EXPLOSIVE_GAS',
        name: 'Explosive Gas',
        description: 'Volatile compound.',
        itemType: ItemType.RESOURCE,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Gas'
    },
    STOLEN_RATIONS: {
        key: 'STOLEN_RATIONS',
        name: 'Stolen Rations',
        description: 'Military grade food.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Food'
    },
    LOCKPICK: {
        key: 'LOCKPICK',
        name: 'Lockpick',
        description: 'Mechanical bypass tool.',
        itemType: ItemType.CONSUMABLE,
        baseValue: 25,
        isTradable: true,
        resourceType: 'Tools'
    },
    DIRTY_BANDAGES: {
        key: 'DIRTY_BANDAGES',
        name: 'Dirty Bandages',
        description: 'Used and discarded.',
        itemType: ItemType.JUNK,
        baseValue: 1,
        isTradable: true,
        resourceType: 'Biowaste'
    },
    SHINY_TRINKET: {
        key: 'SHINY_TRINKET',
        name: 'Shiny Trinket',
        description: 'Caught a magpie\'s eye.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag'
    },
    BACKSTAB_KNIFE: {
        key: 'BACKSTAB_KNIFE',
        name: 'Backstab Knife',
        description: 'Serrated for extra damage.',
        itemType: ItemType.WEAPON,
        baseValue: 150,
        isTradable: true,
        resourceType: 'Steel'
    },
    BLACK_HOLE_MOTE: {
        key: 'BLACK_HOLE_MOTE',
        name: 'Black Hole Mote',
        description: 'A contained singularity.',
        itemType: ItemType.RESOURCE,
        baseValue: 5000,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    DARK_MATTER: {
        key: 'DARK_MATTER',
        name: 'Dark Matter',
        description: 'Exotic matter.',
        itemType: ItemType.RESOURCE,
        baseValue: 3000,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    ESSENCE_OF_NOTHING: {
        key: 'ESSENCE_OF_NOTHING',
        name: 'Essence of Nothing',
        description: 'Concentrated void.',
        itemType: ItemType.RESOURCE,
        baseValue: 2000,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    LEGENDARY_WEAPON_PART: {
        key: 'LEGENDARY_WEAPON_PART',
        name: 'Legendary Weapon Part',
        description: 'Component for a god-tier weapon.',
        itemType: ItemType.RESOURCE,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    FINAL_WORDS: {
        key: 'FINAL_WORDS',
        name: 'Final Words',
        description: 'Last recording of a doomed soul.',
        itemType: ItemType.DATA,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Data'
    },
    MUTED_BELL: {
        key: 'MUTED_BELL',
        name: 'Muted Bell',
        description: 'Makes no sound when rung.',
        itemType: ItemType.JUNK,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Relic'
    },
    EMPTY_VIAL: {
        key: 'EMPTY_VIAL',
        name: 'Empty Vial',
        description: 'Once held something important.',
        itemType: ItemType.JUNK,
        baseValue: 2,
        isTradable: true,
        resourceType: 'Glass'
    },

    // === ACT VII NEW ITEMS ===
    SYSTEM_CODE: {
        key: 'SYSTEM_CODE',
        name: 'System Code',
        description: 'Raw code of the universe.',
        itemType: ItemType.DATA,
        baseValue: 500,
        isTradable: true,
        resourceType: 'Data'
    },
    LOGIC_GATE: {
        key: 'LOGIC_GATE',
        name: 'Logic Gate',
        description: 'Physical manifestation of logic.',
        itemType: ItemType.RESOURCE,
        baseValue: 200,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    PURE_LIGHT: {
        key: 'PURE_LIGHT',
        name: 'Pure Light',
        description: 'Solidified photons.',
        itemType: ItemType.RESOURCE,
        baseValue: 300,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    MEMORY_SHARD: {
        key: 'MEMORY_SHARD',
        name: 'Memory Shard',
        description: 'A fragment of lost memory.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    BATTERY_CORE: {
        key: 'BATTERY_CORE',
        name: 'Battery Core',
        description: 'Power unit.',
        itemType: ItemType.RESOURCE,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Electronics'
    },
    ALGORITHM_SCROLL: {
        key: 'ALGORITHM_SCROLL',
        name: 'Algorithm Scroll',
        description: 'Ancient code written on parchment.',
        itemType: ItemType.DATA,
        baseValue: 400,
        isTradable: true,
        resourceType: 'Data'
    },
    DIVINE_HALO: {
        key: 'DIVINE_HALO',
        name: 'Divine Halo',
        description: 'Energy shield of ancient design.',
        itemType: ItemType.ARMOR,
        baseValue: 8000,
        isTradable: true,
        resourceType: 'Shield Technology'
    },
    WING_SHARD: {
        key: 'WING_SHARD',
        name: 'Wing Shard',
        description: 'Fragment of an Archon\'s wing.',
        itemType: ItemType.RESOURCE,
        baseValue: 600,
        isTradable: true,
        resourceType: 'Exotic Matter'
    },
    PERFECT_CORE: {
        key: 'PERFECT_CORE',
        name: 'Perfect Core',
        description: 'Flawless energy source.',
        itemType: ItemType.RESOURCE,
        baseValue: 1000,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    ASCENSION_KEY: {
        key: 'ASCENSION_KEY',
        name: 'Ascension Key',
        description: 'Unlocks the final gate.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    FLAMING_SWORD: {
        key: 'FLAMING_SWORD',
        name: 'Flaming Sword',
        description: 'Blade wreathed in eternal fire.',
        itemType: ItemType.WEAPON,
        baseValue: 4000,
        isTradable: true,
        resourceType: 'High-Tech Parts'
    },
    SINGING_CHIP: {
        key: 'SINGING_CHIP',
        name: 'Singing Chip',
        description: 'Hums a haunting melody.',
        itemType: ItemType.JUNK,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Electronics'
    },
    THE_EIDEUS_CORE: {
        key: 'THE_EIDEUS_CORE',
        name: 'The Eideus Core',
        description: 'The heart of the system.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Game End'
    },
    ADMINISTRATOR_ACCESS: {
        key: 'ADMINISTRATOR_ACCESS',
        name: 'Administrator Access',
        description: 'God-mode privileges.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    },
    INFINITE_ENERGY: {
        key: 'INFINITE_ENERGY',
        name: 'Infinite Energy',
        description: 'Unlimited power.',
        itemType: ItemType.RESOURCE,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Exotic Matter'
    },
    NEW_UNIVERSE_SEED: {
        key: 'NEW_UNIVERSE_SEED',
        name: 'New Universe Seed',
        description: 'Restart the simulation.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Quest'
    },
    THE_PLAYERS_SOUL: {
        key: 'THE_PLAYERS_SOUL',
        name: 'The Player\'s Soul',
        description: 'Your own essence.',
        itemType: ItemType.QUEST,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Special'
    },
    DEVELOPERS_NOTE: {
        key: 'DEVELOPERS_NOTE',
        name: 'Developer\'s Note',
        description: 'Thanks for playing.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    },
    CREDITS_CHIP: {
        key: 'CREDITS_CHIP',
        name: 'Credits Chip',
        description: 'The end.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    },
    ROOT_ACCESS: {
        key: 'ROOT_ACCESS',
        name: 'Root Access',
        description: 'Deep system control.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    },
    USER_ACCESS: {
        key: 'USER_ACCESS',
        name: 'User Access',
        description: 'Standard permissions.',
        itemType: ItemType.DATA,
        baseValue: 0,
        isTradable: false,
        resourceType: 'Data'
    }
};