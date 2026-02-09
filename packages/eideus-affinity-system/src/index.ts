/**
 * Final Dawn of Eideus - Affinity System
 * 
 * A universe-scale simulation with 3 gears (Politics, Economy, Unrest)
 * operating across hierarchical levels from intergalactic to regional.
 * 
 * Affinity (STR/INT/DEX) affects EVERYTHING:
 * - Character relationships
 * - Prices (STR player + INT region = +25% prices)
 * - Combat (STR attacker + DEX defender = +25% damage)
 * - Politics, Diplomacy, Economy modifiers
 */

import { AffinitySimulation } from './simulation.js';
import { AffinityType, AffinityEntity } from './types.js';
import { computeAffinityScore } from './matrix.js';

// Types
export {
    AffinityType,
    GearType,
    HierarchyLevel,
    LEVEL_TICK_MODIFIERS,
    type LatticeCoordinate,
    type AffinityTensor,
    type GearState,
    type AffinityEntity,
    type Actuator,
    type RelationalScores,
    type SimulationState
} from './types.js';

// Affinity Matrix
export {
    computeAffinityScore,
    applyAffinityWeight
} from './matrix.js';

// Fractal Template (Hierarchy)
export {
    TRANSFORMS_COUNT,
    MODIFIERS_COUNT,
    ELEMENTS_COUNT,
    STATES_COUNT,
    MACRO_LEVELS,
    MICRO_LEVELS,
    coord,
    coordKey,
    parseCoordKey,
    createEmptyTensor,
    cloneTensor,
    addTensors,
    scaleTensor,
    shouldUpdateOnTick,
    getTickFrequency,
    getParentLevel,
    getChildLevel
} from './hierarchy.js';

// Gear Engine
export {
    getNextGear,
    calculateGearDelta,
    calculateUnrest,
    evolveGearState,
    applyPressure,
    createDefaultGearState
} from './gears.js';

// Actuators
export {
    RelationalActuator,
    NullActuator,
    createRelationalActuator
} from './actuators.js';

// Simulation
export {
    AffinitySimulation,
    createSimulation
} from './simulation.js';

// === PRICE MODIFIER (Affinity affects economy) ===

/**
 * Calculate price modifier based on player affinity vs location affinity.
 * STR player + INT location = +25% prices (disadvantage)
 * STR player + STR location = -25% prices (advantage)
 */
export function calculatePriceModifier(
    playerAffinity: AffinityType,
    locationAffinity: AffinityType
): number {
    const score = computeAffinityScore(playerAffinity, locationAffinity);
    return 1 - (score * 0.25);
}

/**
 * Apply affinity-based price adjustment.
 */
export function applyAffinityPrice(
    basePrice: number,
    playerAffinity: AffinityType,
    locationAffinity: AffinityType
): number {
    return Math.round(basePrice * calculatePriceModifier(playerAffinity, locationAffinity));
}

// === COMBAT MODIFIER (Affinity affects damage/skills) ===

/**
 * Calculate combat modifier: STR > DEX > INT > STR
 * +1 advantage = 1.25x damage, -1 disadvantage = 0.75x damage
 */
export function calculateCombatModifier(
    attackerAffinity: AffinityType,
    defenderAffinity: AffinityType
): number {
    const score = computeAffinityScore(attackerAffinity, defenderAffinity);
    return 1 + (score * 0.25);
}

/**
 * Apply affinity-based damage adjustment.
 */
export function applyAffinityDamage(
    baseDamage: number,
    attackerAffinity: AffinityType,
    defenderAffinity: AffinityType
): number {
    return Math.round(baseDamage * calculateCombatModifier(attackerAffinity, defenderAffinity));
}

/**
 * Calculate skill effectiveness (player + skill affinity vs target).
 */
export function calculateSkillModifier(
    playerAffinity: AffinityType,
    targetAffinity: AffinityType,
    skillAffinity: AffinityType
): number {
    const playerScore = computeAffinityScore(playerAffinity, targetAffinity);
    const skillScore = computeAffinityScore(skillAffinity, targetAffinity);
    return 1 + ((playerScore + skillScore) / 2 * 0.25);
}

// === CONVENIENCE: Default tick configuration ===

export interface AffinityTickConfig {
    decayRate: number;
    growthRate: number;
}

export function defaultTickConfig(): AffinityTickConfig {
    return { decayRate: 0.01, growthRate: 0.05 };
}

// === LEGACY COMPATIBILITY (for orchestrator) ===

export interface AffinityEntityRef {
    id: string;
    parentId?: string;
    kind?: string;
    scale?: string;
}

export class InMemoryAffinitySystem {
    private simulation: AffinitySimulation;

    constructor(_config?: AffinityTickConfig) {
        this.simulation = new AffinitySimulation();
    }

    async getLatestSnapshot(_opts: unknown): Promise<{ entities: AffinityEntityRef[]; tick: number }> {
        const state = this.simulation.getState();
        const entities = Array.from(state.entities.values()).map((e: AffinityEntity) => ({
            id: e.id,
            kind: e.level,
            scale: e.level
        }));
        return { entities, tick: state.globalTick };
    }

    async tick(_opts: { tick: number }): Promise<{ entities: AffinityEntityRef[]; tick: number }> {
        this.simulation.tick();
        return this.getLatestSnapshot({});
    }

    async registerEntity(_opts: { entity: AffinityEntityRef }): Promise<void> {
        // No-op for now - entities are auto-created
    }

    async batchRegisterEntities(_opts: { entities: AffinityEntityRef[] }): Promise<void> {
        // No-op for now - entities are auto-created
    }
}

// === UTILS ===

export function resolveDominantAffinity(affinityData: any): { dominant: AffinityType; score: number } {
    // Handle string input
    if (typeof affinityData === 'string') {
        const type = affinityData as AffinityType;
        return { dominant: type, score: 1.0 };
    }

    // Handle object input with buckets
    if (affinityData?.buckets) {
        // Mock implementation since actual bucket logic might be complex or missing
        // For now, just return a default or the first bucket
        const buckets = affinityData.buckets;
        if (Array.isArray(buckets) && buckets.length > 0) {
            return { dominant: buckets[0].affinity, score: buckets[0].score };
        }
    }

    // Default fallback
    return { dominant: AffinityType.STR, score: 0 };
}
