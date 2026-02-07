/**
 * Core Types for Final Dawn of Eideus Affinity System
 * 
 * Three decoupled components:
 * 1. Fractal Template (Structure) - 3×3×7×3 hypercube
 * 2. Tick Logic (Engine) - Three-gear churn
 * 3. Actuator (Driver) - Hot-swappable pressure injector
 */

// === AFFINITY TYPES ===

export enum AffinityType {
    STR = 'STR',
    INT = 'INT',
    DEX = 'DEX'
}

// === GEAR TYPES (The Three Gears) ===

export enum GearType {
    POLITICS = 'POLITICS',
    DIPLOMACY = 'DIPLOMACY',
    ECONOMY = 'ECONOMY'
}

// === HIERARCHY LEVELS ===

export enum HierarchyLevel {
    // MACRO (3×3×7)
    INTERGALACTIC = 'INTERGALACTIC',   // -3 modifier
    INTERSTELLAR = 'INTERSTELLAR',     // -2 modifier
    PLANETARY = 'PLANETARY',           // -1 modifier

    // MICRO (3×3×7)  
    CIVILIZATION = 'CIVILIZATION',     // 0 modifier
    CITY = 'CITY',                     // +1 modifier
    REGION = 'REGION',                 // +2 modifier
    INHABITANT = 'INHABITANT'          // +3 modifier
}

// Tick modifiers by level
export const LEVEL_TICK_MODIFIERS: Record<HierarchyLevel, number> = {
    [HierarchyLevel.INTERGALACTIC]: -3,
    [HierarchyLevel.INTERSTELLAR]: -2,
    [HierarchyLevel.PLANETARY]: -1,
    [HierarchyLevel.CIVILIZATION]: 0,
    [HierarchyLevel.CITY]: 1,
    [HierarchyLevel.REGION]: 2,
    [HierarchyLevel.INHABITANT]: 3
};

// === FRACTAL TEMPLATE ADDRESSING ===

/**
 * 4D Coordinate for hypercube addressing
 * [TransformID, AxisID, ElementID, StateID]
 */
export interface LatticeCoordinate {
    transform: number;  // 0-2 (3 Transforms)
    axis: number;       // 0-2 (X, Y, Z = 3 Modifiers)
    element: number;    // 0-6 (7 Elements per axis)
    state: number;      // 0-2 (3 superimposed states, up to 6 domains)
}

/**
 * Tensor shape: [3, 3, 7] for actuator output
 */
export type AffinityTensor = number[][][];

// === GEAR STATE ===

export interface GearState {
    politics: number;
    diplomacy: number;
    economy: number;
    unrest: number;  // Inverse pressure invariant
}

// === ENTITY NODE ===

export interface AffinityEntity {
    id: string;
    affinity: AffinityType;
    level: HierarchyLevel;
    parentId?: string;
    gearState: GearState;
    coordinate: LatticeCoordinate;
}

// === ACTUATOR CONTRACT ===

/**
 * Actuator interface for hot-swappable pressure injection.
 * Must return a delta tensor matching [3, 3, 7] lattice shape.
 */
export interface Actuator {
    readonly name: string;

    /**
     * Calculate pressure delta to inject into the simulation.
     * @returns Tensor of shape [3, 3, 7]
     */
    calculatePressure(): AffinityTensor;
}

// === PLAYER RELATIONSHIPS ===

export interface RelationalScores {
    playerLyra: number;
    playerNavbot: number;
    playerVizzy: number;
    navbotVizzy: number;
    vizzyLyra: number;
    lyraNavbot: number;
}

// === SIMULATION STATE ===

export interface SimulationState {
    globalTick: number;
    entities: Map<string, AffinityEntity>;
    relationalScores: RelationalScores;
}
