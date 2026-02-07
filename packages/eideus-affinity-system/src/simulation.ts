/**
 * Affinity Simulation - Main Controller
 * 
 * Orchestrates the Fractal Template, Tick Logic, and Actuators.
 * Runs after each LLM response to evolve the universe state.
 */

import {
    AffinityEntity,
    AffinityTensor,
    Actuator,
    GearState,
    HierarchyLevel,
    SimulationState,
    RelationalScores,
    AffinityType,
    LatticeCoordinate
} from './types.js';
import {
    shouldUpdateOnTick,
    getParentLevel,
    addTensors,
    createEmptyTensor,
    coordKey,
    TRANSFORMS_COUNT,
    MODIFIERS_COUNT,
    ELEMENTS_COUNT
} from './hierarchy.js';
import { evolveGearState, createDefaultGearState } from './gears.js';
import { RelationalActuator } from './actuators.js';

// === SIMULATION CLASS ===

export class AffinitySimulation {
    private state: SimulationState;
    private actuator: Actuator;

    constructor(actuator?: Actuator) {
        this.state = {
            globalTick: 0,
            entities: new Map(),
            relationalScores: {
                playerLyra: 50,
                playerNavbot: 50,
                playerVizzy: 50,
                navbotVizzy: 50,
                vizzyLyra: 50,
                lyraNavbot: 50
            }
        };
        this.actuator = actuator ?? new RelationalActuator();

        // Initialize default lattice entities
        this.initializeLattice();
    }

    /**
     * Initialize the 3×3×7 lattice with default entities.
     */
    private initializeLattice(): void {
        const levels: HierarchyLevel[] = [
            HierarchyLevel.INTERGALACTIC,
            HierarchyLevel.INTERSTELLAR,
            HierarchyLevel.PLANETARY,
            HierarchyLevel.CIVILIZATION,
            HierarchyLevel.CITY,
            HierarchyLevel.REGION,
            HierarchyLevel.INHABITANT
        ];

        const affinities = [AffinityType.STR, AffinityType.INT, AffinityType.DEX];

        // Create entities for each level
        for (let t = 0; t < TRANSFORMS_COUNT; t++) {
            for (let a = 0; a < MODIFIERS_COUNT; a++) {
                for (let e = 0; e < ELEMENTS_COUNT; e++) {
                    const levelIndex = Math.min(t * 2 + Math.floor(a / 2), levels.length - 1);
                    const coord: LatticeCoordinate = { transform: t, axis: a, element: e, state: 0 };
                    const id = coordKey(coord);

                    const entity: AffinityEntity = {
                        id,
                        affinity: affinities[(t + a + e) % 3],
                        level: levels[levelIndex],
                        gearState: createDefaultGearState(),
                        coordinate: coord
                    };

                    this.state.entities.set(id, entity);
                }
            }
        }
    }

    /**
     * Main tick - called after each LLM response.
     * Evolves all levels that meet their tick threshold.
     */
    tick(): void {
        this.state.globalTick++;

        // Get pressure from actuator
        const pressure = this.actuator.calculatePressure();

        // Update each level based on tick threshold
        for (const [id, entity] of this.state.entities) {
            if (shouldUpdateOnTick(entity.level, this.state.globalTick)) {
                this.evolveEntity(entity, pressure);
            }
        }

        // Propagate upward (bottom-up aggregation)
        this.propagateUpward();
    }

    /**
     * Evolve a single entity's gear state.
     */
    private evolveEntity(entity: AffinityEntity, pressure: AffinityTensor): void {
        const { transform, axis, element } = entity.coordinate;
        const pressureValue = pressure[transform]?.[axis]?.[element] ?? 0;

        // Evolve gear state with its own affinity
        entity.gearState = evolveGearState(
            entity.gearState,
            entity.affinity,
            entity.affinity // Self-reference for base calculation
        );

        // Apply actuator pressure
        if (pressureValue !== 0) {
            entity.gearState.unrest += pressureValue;
            entity.gearState.unrest = Math.max(0, Math.min(100, entity.gearState.unrest));
        }
    }

    /**
     * Propagate state changes upward through hierarchy.
     * Child averages drive parent states.
     */
    private propagateUpward(): void {
        const levelOrder: HierarchyLevel[] = [
            HierarchyLevel.INHABITANT,
            HierarchyLevel.REGION,
            HierarchyLevel.CITY,
            HierarchyLevel.CIVILIZATION,
            HierarchyLevel.PLANETARY,
            HierarchyLevel.INTERSTELLAR,
            HierarchyLevel.INTERGALACTIC
        ];

        for (const level of levelOrder) {
            const parentLevel = getParentLevel(level);
            if (!parentLevel) continue;

            // Get entities at this level
            const children = Array.from(this.state.entities.values())
                .filter(e => e.level === level);

            const parents = Array.from(this.state.entities.values())
                .filter(e => e.level === parentLevel);

            if (children.length === 0 || parents.length === 0) continue;

            // Calculate average unrest from children
            const avgUnrest = children.reduce((sum, c) => sum + c.gearState.unrest, 0) / children.length;

            // Apply to parent diplomacy (unrest → diplomacy cascade)
            for (const parent of parents) {
                const delta = (avgUnrest - parent.gearState.diplomacy) * 0.1;
                parent.gearState.diplomacy = Math.max(0, Math.min(100, parent.gearState.diplomacy + delta));
            }
        }
    }

    // === PUBLIC API ===

    /**
     * Update relational scores (from player actions).
     */
    updateRelationalScores(updates: Partial<RelationalScores>): void {
        Object.assign(this.state.relationalScores, updates);
        if (this.actuator instanceof RelationalActuator) {
            this.actuator.updateScores(updates);
        }
    }

    /**
     * Get current simulation state snapshot.
     */
    getState(): SimulationState {
        return { ...this.state };
    }

    /**
     * Get entity by coordinate key.
     */
    getEntity(coordKey: string): AffinityEntity | undefined {
        return this.state.entities.get(coordKey);
    }

    /**
     * Get all entities at a specific level.
     */
    getEntitiesByLevel(level: HierarchyLevel): AffinityEntity[] {
        return Array.from(this.state.entities.values())
            .filter(e => e.level === level);
    }

    /**
     * Get aggregate stats for a level.
     */
    getLevelAggregate(level: HierarchyLevel): GearState {
        const entities = this.getEntitiesByLevel(level);
        if (entities.length === 0) return createDefaultGearState();

        const sum = entities.reduce(
            (acc, e) => ({
                politics: acc.politics + e.gearState.politics,
                diplomacy: acc.diplomacy + e.gearState.diplomacy,
                economy: acc.economy + e.gearState.economy,
                unrest: acc.unrest + e.gearState.unrest
            }),
            { politics: 0, diplomacy: 0, economy: 0, unrest: 0 }
        );

        const count = entities.length;
        return {
            politics: sum.politics / count,
            diplomacy: sum.diplomacy / count,
            economy: sum.economy / count,
            unrest: sum.unrest / count
        };
    }

    /**
     * Swap in a new actuator.
     */
    setActuator(actuator: Actuator): void {
        this.actuator = actuator;
    }

    /**
     * Get current global tick.
     */
    getGlobalTick(): number {
        return this.state.globalTick;
    }
}

// === FACTORY ===

export function createSimulation(actuator?: Actuator): AffinitySimulation {
    return new AffinitySimulation(actuator);
}
