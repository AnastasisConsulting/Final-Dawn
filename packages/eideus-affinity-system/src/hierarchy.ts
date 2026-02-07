/**
 * Fractal Template - The 3×3×7×3 Hypercube Structure
 * 
 * Defines the geometric hierarchy and addressable coordinate space.
 * Domain-agnostic - structure only, no simulation logic.
 */

import {
    HierarchyLevel,
    LatticeCoordinate,
    AffinityTensor,
    LEVEL_TICK_MODIFIERS
} from './types.js';

// === CONSTANTS ===

export const TRANSFORMS_COUNT = 3;   // 3 Transforms
export const MODIFIERS_COUNT = 3;    // 3 Modifiers (axes) per Transform
export const ELEMENTS_COUNT = 7;     // 7 Elements per axis
export const STATES_COUNT = 3;       // 3 superimposed states (expandable to 6)

// MACRO hierarchy: Intergalactic → Interstellar → Planetary
export const MACRO_LEVELS = [
    HierarchyLevel.INTERGALACTIC,
    HierarchyLevel.INTERSTELLAR,
    HierarchyLevel.PLANETARY
] as const;

// MICRO hierarchy: Civilization → City → Region → Inhabitant
export const MICRO_LEVELS = [
    HierarchyLevel.CIVILIZATION,
    HierarchyLevel.CITY,
    HierarchyLevel.REGION,
    HierarchyLevel.INHABITANT
] as const;

// === COORDINATE UTILITIES ===

/**
 * Create a lattice coordinate.
 */
export function coord(
    transform: number,
    axis: number,
    element: number,
    state: number = 0
): LatticeCoordinate {
    return { transform, axis, element, state };
}

/**
 * Convert coordinate to string key for Map lookups.
 */
export function coordKey(c: LatticeCoordinate): string {
    return `T${c.transform}:A${c.axis}:E${c.element}:S${c.state}`;
}

/**
 * Parse coordinate key back to LatticeCoordinate.
 */
export function parseCoordKey(key: string): LatticeCoordinate {
    const match = key.match(/T(\d+):A(\d+):E(\d+):S(\d+)/);
    if (!match) throw new Error(`Invalid coordinate key: ${key}`);
    return {
        transform: parseInt(match[1]),
        axis: parseInt(match[2]),
        element: parseInt(match[3]),
        state: parseInt(match[4])
    };
}

// === TENSOR UTILITIES ===

/**
 * Create an empty affinity tensor [3, 3, 7].
 */
export function createEmptyTensor(): AffinityTensor {
    return Array.from({ length: TRANSFORMS_COUNT }, () =>
        Array.from({ length: MODIFIERS_COUNT }, () =>
            Array.from({ length: ELEMENTS_COUNT }, () => 0)
        )
    );
}

/**
 * Clone a tensor.
 */
export function cloneTensor(t: AffinityTensor): AffinityTensor {
    return t.map(plane => plane.map(row => [...row]));
}

/**
 * Add two tensors element-wise.
 */
export function addTensors(a: AffinityTensor, b: AffinityTensor): AffinityTensor {
    return a.map((plane, i) =>
        plane.map((row, j) =>
            row.map((val, k) => val + b[i][j][k])
        )
    );
}

/**
 * Scale tensor by scalar.
 */
export function scaleTensor(t: AffinityTensor, scalar: number): AffinityTensor {
    return t.map(plane =>
        plane.map(row =>
            row.map(val => val * scalar)
        )
    );
}

// === TICK THRESHOLD ===

/**
 * Check if a given level should update on this tick.
 * Formula: GlobalTick % (4 - LevelModifier) == 0
 */
export function shouldUpdateOnTick(level: HierarchyLevel, globalTick: number): boolean {
    const modifier = LEVEL_TICK_MODIFIERS[level];
    const threshold = 4 - modifier;
    return globalTick % threshold === 0;
}

/**
 * Get tick frequency for a level (how often it updates).
 */
export function getTickFrequency(level: HierarchyLevel): number {
    const modifier = LEVEL_TICK_MODIFIERS[level];
    return 4 - modifier;
}

// === HIERARCHY TRAVERSAL ===

/**
 * Get parent level in hierarchy (for upward cascade).
 */
export function getParentLevel(level: HierarchyLevel): HierarchyLevel | null {
    switch (level) {
        case HierarchyLevel.INHABITANT: return HierarchyLevel.REGION;
        case HierarchyLevel.REGION: return HierarchyLevel.CITY;
        case HierarchyLevel.CITY: return HierarchyLevel.CIVILIZATION;
        case HierarchyLevel.CIVILIZATION: return HierarchyLevel.PLANETARY;
        case HierarchyLevel.PLANETARY: return HierarchyLevel.INTERSTELLAR;
        case HierarchyLevel.INTERSTELLAR: return HierarchyLevel.INTERGALACTIC;
        case HierarchyLevel.INTERGALACTIC: return null;
    }
}

/**
 * Get child level in hierarchy (for downward cascade).
 */
export function getChildLevel(level: HierarchyLevel): HierarchyLevel | null {
    switch (level) {
        case HierarchyLevel.INTERGALACTIC: return HierarchyLevel.INTERSTELLAR;
        case HierarchyLevel.INTERSTELLAR: return HierarchyLevel.PLANETARY;
        case HierarchyLevel.PLANETARY: return HierarchyLevel.CIVILIZATION;
        case HierarchyLevel.CIVILIZATION: return HierarchyLevel.CITY;
        case HierarchyLevel.CITY: return HierarchyLevel.REGION;
        case HierarchyLevel.REGION: return HierarchyLevel.INHABITANT;
        case HierarchyLevel.INHABITANT: return null;
    }
}
