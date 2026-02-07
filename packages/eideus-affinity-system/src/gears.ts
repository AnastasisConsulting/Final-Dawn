/**
 * Gear Engine - The Three-Gear Churn
 * 
 * Politics → Diplomacy → Economy → Politics (cycle)
 * Civil Unrest is the inverse pressure invariant.
 */

import { GearState, GearType, AffinityType, AffinityEntity } from './types.js';
import { applyAffinityWeight } from './matrix.js';

// === CONSTANTS ===

const GEAR_INFLUENCE = 0.1;    // How much one gear influences the next
const UNREST_INVERSE = -0.15;  // Inverse relationship coefficient

// === GEAR CHURN ===

/**
 * Calculate the next gear in the cycle.
 * Politics → Diplomacy → Economy → Politics
 */
export function getNextGear(gear: GearType): GearType {
    switch (gear) {
        case GearType.POLITICS: return GearType.DIPLOMACY;
        case GearType.DIPLOMACY: return GearType.ECONOMY;
        case GearType.ECONOMY: return GearType.POLITICS;
    }
}

/**
 * Calculate the delta for a gear based on its driver.
 * 
 * Politics drives Diplomacy
 * Diplomacy drives Economy
 * Economy drives Politics
 */
export function calculateGearDelta(
    driverValue: number,
    targetValue: number,
    sourceAffinity: AffinityType,
    targetAffinity: AffinityType
): number {
    const baseDelta = (driverValue - targetValue) * GEAR_INFLUENCE;
    return applyAffinityWeight(baseDelta, sourceAffinity, targetAffinity);
}

/**
 * Calculate civil unrest using the inverse pressure invariant.
 * Unrest increases when aggregate gear health decreases.
 */
export function calculateUnrest(gearState: GearState): number {
    const aggregateHealth = (
        gearState.politics +
        gearState.diplomacy +
        gearState.economy
    ) / 3;

    // Inverse: lower aggregate = higher unrest
    return gearState.unrest + (100 - aggregateHealth) * UNREST_INVERSE;
}

// === GEAR STATE EVOLUTION ===

/**
 * Evolve gear state for a single tick.
 * Applies the three-gear churn and updates unrest.
 */
export function evolveGearState(
    current: GearState,
    sourceAffinity: AffinityType,
    targetAffinity: AffinityType
): GearState {
    // Calculate deltas
    const diplomacyDelta = calculateGearDelta(
        current.politics,
        current.diplomacy,
        sourceAffinity,
        targetAffinity
    );

    const economyDelta = calculateGearDelta(
        current.diplomacy,
        current.economy,
        sourceAffinity,
        targetAffinity
    );

    const politicsDelta = calculateGearDelta(
        current.economy,
        current.politics,
        sourceAffinity,
        targetAffinity
    );

    // Apply deltas
    const newState: GearState = {
        politics: clamp(current.politics + politicsDelta),
        diplomacy: clamp(current.diplomacy + diplomacyDelta),
        economy: clamp(current.economy + economyDelta),
        unrest: 0 // Calculated below
    };

    // Calculate unrest using inverse pressure invariant
    newState.unrest = clamp(calculateUnrest(newState));

    return newState;
}

/**
 * Apply external pressure to gear state (from actuator).
 */
export function applyPressure(
    state: GearState,
    pressureValue: number,
    targetGear: GearType
): GearState {
    const result = { ...state };

    switch (targetGear) {
        case GearType.POLITICS:
            result.politics = clamp(result.politics + pressureValue);
            break;
        case GearType.DIPLOMACY:
            result.diplomacy = clamp(result.diplomacy + pressureValue);
            break;
        case GearType.ECONOMY:
            result.economy = clamp(result.economy + pressureValue);
            break;
    }

    // Recalculate unrest after pressure
    result.unrest = clamp(calculateUnrest(result));
    return result;
}

// === DEFAULT STATE ===

export function createDefaultGearState(): GearState {
    return {
        politics: 50,
        diplomacy: 50,
        economy: 50,
        unrest: 50
    };
}

// === UTILITIES ===

function clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value));
}
