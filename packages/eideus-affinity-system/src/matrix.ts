/**
 * Affinity Matrix - Rock-Paper-Scissors relationship scoring
 * 
 *        STR   INT   DEX
 * STR    +1     0    -1
 * INT    -1    +1     0
 * DEX     0    -1    +1
 */

import { AffinityType } from './types.js';

const MATRIX: Record<AffinityType, Record<AffinityType, number>> = {
    [AffinityType.STR]: {
        [AffinityType.STR]: 1,
        [AffinityType.INT]: 0,
        [AffinityType.DEX]: -1
    },
    [AffinityType.INT]: {
        [AffinityType.STR]: -1,
        [AffinityType.INT]: 1,
        [AffinityType.DEX]: 0
    },
    [AffinityType.DEX]: {
        [AffinityType.STR]: 0,
        [AffinityType.INT]: -1,
        [AffinityType.DEX]: 1
    }
};

/**
 * Compute affinity score between two entities.
 * @param a - First entity's affinity type
 * @param b - Second entity's affinity type
 * @returns Score: +1 (advantage), 0 (neutral), -1 (disadvantage)
 */
export function computeAffinityScore(a: AffinityType, b: AffinityType): number {
    return MATRIX[a][b];
}

/**
 * Apply affinity weight to a base value.
 * @param baseValue - The unweighted value
 * @param source - Source entity affinity
 * @param target - Target entity affinity
 * @returns Weighted value
 */
export function applyAffinityWeight(
    baseValue: number,
    source: AffinityType,
    target: AffinityType
): number {
    const modifier = computeAffinityScore(source, target);
    // Scale: -1 = 0.75x, 0 = 1.0x, +1 = 1.25x
    return baseValue * (1 + modifier * 0.25);
}
