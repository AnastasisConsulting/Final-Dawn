import { Item, ItemType } from '../../types';

export const JUNK: Record<string, Item> = {
    // --- Standard Junk ---
    JUNK_PARTS: {
        key: 'JUNK_PARTS',
        name: 'Junk Parts',
        description: 'A handful of rusted bolts, frayed wires, and cracked casings. The literal currency of the Fringe.',
        itemType: ItemType.JUNK,
        baseValue: 1,
        isTradable: true,
        resourceType: 'Slag',
        level: 1,
        stats: { effectDescription: "Crafting Material" }
    },
    BURNED_OUT_CIRCUIT: {
        key: 'BURNED_OUT_CIRCUIT',
        name: 'Burned-Out Circuit',
        description: 'A fried circuit board. Useless for repair, but might have recoverable metals.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag',
        level: 1
    },
    EMPTY_STIM_SYRINGE: {
        key: 'EMPTY_STIM_SYRINGE',
        name: 'Empty Stim Syringe',
        description: 'The discarded remnants of a quick fix. Traces of chemicals remain.',
        itemType: ItemType.JUNK,
        baseValue: 2,
        isTradable: true,
        resourceType: 'Slag',
        level: 1
    },
    
    // --- Act I Junk ---
    RAT_TAIL: {
        key: 'RAT_TAIL',
        name: 'Rat Tail',
        description: 'A trophy from a rad-rat. Not worth much, except maybe to a hungry scavenger.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag',
        level: 1
    },
    COPPER_WIRE: {
        key: 'COPPER_WIRE',
        name: 'Copper Wire',
        description: 'Simple conductive wire. Always useful for basic repairs.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 1
    },
    SMALL_BATTERY: {
        key: 'SMALL_BATTERY',
        name: 'Small Battery',
        description: 'Depleted but recyclable energy cell.',
        itemType: ItemType.JUNK,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 2
    },

    // --- Act II Junk ---
    INK_CARTRIDGE: {
        key: 'INK_CARTRIDGE',
        name: 'Ink Cartridge',
        description: 'Standard issue black ink. Surprisingly rare in the digital age.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag',
        level: 4
    },
    LEGAL_FORM_88E: {
        key: 'LEGAL_FORM_88E',
        name: 'Legal Form 88-E',
        description: 'A request for self-deletion. Denied. Stamped multiple times.',
        itemType: ItemType.JUNK,
        baseValue: 1,
        isTradable: true,
        resourceType: 'Paperwork',
        level: 4
    },
    BLACK_INK: {
        key: 'BLACK_INK',
        name: 'Black Ink',
        description: 'A vial of pure black ink. Used for redaction.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag',
        level: 5
    },
    RED_PEN: {
        key: 'RED_PEN',
        name: 'Red Pen',
        description: 'Used for rejecting forms. The tip is worn down.',
        itemType: ItemType.JUNK,
        baseValue: 2,
        isTradable: true,
        resourceType: 'Slag',
        level: 5
    },
    VERDICT_TOKEN: {
        key: 'VERDICT_TOKEN',
        name: 'Verdict Token',
        description: 'A token representing a guilty verdict. Heavy with implication.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag',
        level: 6
    },
    JUROR_BADGE: {
        key: 'JUROR_BADGE',
        name: 'Juror Badge',
        description: 'Identification for a court juror. Expired.',
        itemType: ItemType.JUNK,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Slag',
        level: 6
    },
    NULL_CUFFS: {
        key: 'NULL_CUFFS',
        name: 'Null-Cuffs',
        description: 'Broken restraints designed to dampen powers.',
        itemType: ItemType.JUNK,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 6
    },

    // --- Act III Junk ---
    OLD_DOG_TAG: {
        key: 'OLD_DOG_TAG',
        name: 'Old Dog Tag',
        description: 'Identification from a forgotten war. The name is unreadable.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag',
        level: 7
    },
    FADED_PHOTO: {
        key: 'FADED_PHOTO',
        name: 'Faded Photo',
        description: 'A blurry image of someone who no longer exists.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Paper',
        level: 7
    },
    WHITE_NOISE_TAPE: {
        key: 'WHITE_NOISE_TAPE',
        name: 'White Noise Tape',
        description: 'An ancient audio cassette. Plays only static.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Slag',
        level: 8
    },
    BROKEN_WATCH: {
        key: 'BROKEN_WATCH',
        name: 'Broken Watch',
        description: 'Stopped at a specific time. The hands twitch occasionally.',
        itemType: ItemType.JUNK,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Slag',
        level: 8
    },
    BELT_FEED: {
        key: 'BELT_FEED',
        name: 'Belt Feed',
        description: 'Ammunition belt mechanism. Jammed.',
        itemType: ItemType.JUNK,
        baseValue: 15,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 9
    },
    SHELL_CASING: {
        key: 'SHELL_CASING',
        name: 'Shell Casing',
        description: 'Spent artillery casing. Massive.',
        itemType: ItemType.JUNK,
        baseValue: 2,
        isTradable: true,
        resourceType: 'Brass',
        level: 9
    },

    // --- Act IV Junk ---
    WIRE_SPOOL: {
        key: 'WIRE_SPOOL',
        name: 'Wire Spool',
        description: 'Copper wiring. Useful for traps or repairs.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 10
    },
    PAINT_TAG: {
        key: 'PAINT_TAG',
        name: 'Paint Tag',
        description: 'Used for marking targets or graffiti.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Chemicals',
        level: 10
    },
    TORTURE_TOOL: {
        key: 'TORTURE_TOOL',
        name: 'Torture Tool',
        description: 'Grim implement of the Inquisitors. Rusted with blood.',
        itemType: ItemType.JUNK,
        baseValue: 40,
        isTradable: true,
        resourceType: 'Slag',
        level: 12
    },

    // --- Act V Junk ---
    LOST_TOY: {
        key: 'LOST_TOY',
        name: 'Lost Toy',
        description: 'A child\'s plaything, displaced in time. It looks brand new.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag',
        level: 13
    },
    TIME_LOST_COIN: {
        key: 'TIME_LOST_COIN',
        name: 'Time-Lost Coin',
        description: 'Currency from a fallen empire. Collectors value it highly.',
        itemType: ItemType.JUNK,
        baseValue: 500,
        isTradable: true,
        resourceType: 'Luxury Goods',
        level: 13
    },
    CLOCK_GEAR: {
        key: 'CLOCK_GEAR',
        name: 'Clock Gear',
        description: 'Brass gear from a chronometer. It spins on its own sometimes.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Brass',
        level: 14
    },
    BROKEN_MEDKIT: {
        key: 'BROKEN_MEDKIT',
        name: 'Broken Medkit',
        description: 'Empty and cracked. Useless.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Plastic',
        level: 14
    },
    SCRUBBER_ID_TAG: {
        key: 'SCRUBBER_ID_TAG',
        name: 'Scrubber ID Tag',
        description: 'Identify friend or foe. This one belonged to #449.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Plastic',
        level: 14
    },
    OVERHEATED_RIFLE: {
        key: 'OVERHEATED_RIFLE',
        name: 'Overheated Rifle',
        description: 'Slagged weapon barrel. Beyond repair.',
        itemType: ItemType.JUNK,
        baseValue: 30,
        isTradable: true,
        resourceType: 'Scrap Metal',
        level: 15
    },

    // --- Act VI Junk ---
    JAW_BONE: {
        key: 'JAW_BONE',
        name: 'Jaw Bone',
        description: 'From a void predator. Still sharp.',
        itemType: ItemType.JUNK,
        baseValue: 10,
        isTradable: true,
        resourceType: 'Bone',
        level: 16
    },
    DIRTY_BANDAGES: {
        key: 'DIRTY_BANDAGES',
        name: 'Dirty Bandages',
        description: 'Used and discarded. A health hazard.',
        itemType: ItemType.JUNK,
        baseValue: 1,
        isTradable: true,
        resourceType: 'Biowaste',
        level: 17
    },
    SHINY_TRINKET: {
        key: 'SHINY_TRINKET',
        name: 'Shiny Trinket',
        description: 'Caught a magpie\'s eye. Just polished glass.',
        itemType: ItemType.JUNK,
        baseValue: 5,
        isTradable: true,
        resourceType: 'Slag',
        level: 17
    },
    MUTED_BELL: {
        key: 'MUTED_BELL',
        name: 'Muted Bell',
        description: 'Makes no sound when rung. Unsettling.',
        itemType: ItemType.JUNK,
        baseValue: 100,
        isTradable: true,
        resourceType: 'Relic',
        level: 18
    },
    EMPTY_VIAL: {
        key: 'EMPTY_VIAL',
        name: 'Empty Vial',
        description: 'Once held something important. Now just glass.',
        itemType: ItemType.JUNK,
        baseValue: 2,
        isTradable: true,
        resourceType: 'Glass',
        level: 18
    },

    // --- Act VII Junk ---
    SINGING_CHIP: {
        key: 'SINGING_CHIP',
        name: 'Singing Chip',
        description: 'Hums a haunting melody. A fragment of an Archon.',
        itemType: ItemType.JUNK,
        baseValue: 50,
        isTradable: true,
        resourceType: 'Electronics',
        level: 20
    }
};