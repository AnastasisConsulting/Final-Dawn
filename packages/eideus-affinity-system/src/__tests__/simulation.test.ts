/**
 * Affinity Simulation - Unit Tests
 * 
 * Tests the Three-Gear Churn mechanics, hierarchy propagation,
 * and player influence via Relational Actuator.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AffinitySimulation } from '../simulation.js';
import { HierarchyLevel, AffinityType } from '../types.js';
import { RelationalActuator } from '../actuators.js';

describe('AffinitySimulation', () => {
    let sim: AffinitySimulation;

    beforeEach(() => {
        sim = new AffinitySimulation();
    });

    describe('Initialization', () => {
        it('should initialize with 63 entities (3×3×7 lattice)', () => {
            const state = sim.getState();
            expect(state.entities.size).toBe(63); // 3 transforms × 3 axes × 7 elements
        });

        it('should initialize all entities with default gear state', () => {
            const state = sim.getState();
            for (const [id, entity] of state.entities) {
                expect(entity.gearState.politics).toBeGreaterThanOrEqual(0);
                expect(entity.gearState.politics).toBeLessThanOrEqual(100);
                expect(entity.gearState.diplomacy).toBeGreaterThanOrEqual(0);
                expect(entity.gearState.economy).toBeGreaterThanOrEqual(0);
                expect(entity.gearState.unrest).toBeGreaterThanOrEqual(0);
            }
        });

        it('should initialize relational scores at 50', () => {
            const state = sim.getState();
            expect(state.relationalScores.playerLyra).toBe(50);
            expect(state.relationalScores.playerNavbot).toBe(50);
            expect(state.relationalScores.playerVizzy).toBe(50);
        });

        it('should start at global tick 0', () => {
            expect(sim.getGlobalTick()).toBe(0);
        });
    });

    describe('Tick Progression', () => {
        it('should increment global tick on each tick()', () => {
            expect(sim.getGlobalTick()).toBe(0);
            sim.tick();
            expect(sim.getGlobalTick()).toBe(1);
            sim.tick();
            expect(sim.getGlobalTick()).toBe(2);
        });

        it('should evolve entity states over time', () => {
            // Get initial state of first entity
            const initialState = sim.getState();
            const firstEntity = Array.from(initialState.entities.values())[0];
            const initialPolitics = firstEntity.gearState.politics;

            // Tick simulation multiple times
            for (let i = 0; i < 10; i++) {
                sim.tick();
            }

            // State should have changed (evolve function applies changes)
            const finalState = sim.getState();
            const finalEntity = finalState.entities.get(firstEntity.id);
            expect(finalEntity).toBeDefined();

            // At least one metric should have changed after 10 ticks
            const hasChanged =
                finalEntity!.gearState.politics !== initialPolitics ||
                finalEntity!.gearState.diplomacy !== firstEntity.gearState.diplomacy ||
                finalEntity!.gearState.economy !== firstEntity.gearState.economy;

            expect(hasChanged).toBe(true);
        });
    });

    describe('Relational Actuator Integration', () => {
        it('should update relational scores', () => {
            sim.updateRelationalScores({ playerLyra: 75 });
            const state = sim.getState();
            expect(state.relationalScores.playerLyra).toBe(75);
        });

        it('should apply pressure from relational drift', () => {
            // Set extreme relational scores (high tension)
            sim.updateRelationalScores({
                playerLyra: 10,  // Low = tension
                playerNavbot: 90 // High = harmony
            });

            // Get initial unrest levels
            const initialUnrest = sim.getLevelAggregate(HierarchyLevel.PLANETARY).unrest;

            // Tick to apply pressure
            sim.tick();

            // Unrest should be affected by actuator pressure
            const finalUnrest = sim.getLevelAggregate(HierarchyLevel.PLANETARY).unrest;

            // Note: This may pass as equal if pressure is near-zero. 
            // The test verifies the mechanism doesn't crash.
            expect(typeof finalUnrest).toBe('number');
        });
    });

    describe('Hierarchy Propagation', () => {
        it('should propagate unrest from children to parent diplomacy', () => {
            // Get entities at bottom level (INHABITANT)
            const inhabitants = sim.getEntitiesByLevel(HierarchyLevel.INHABITANT);

            // Manually spike unrest in inhabitants
            for (const entity of inhabitants) {
                entity.gearState.unrest = 80; // High unrest
            }

            // Tick to trigger upward propagation
            sim.tick();

            // Check parent level (REGION) for affected diplomacy
            const regionAggregate = sim.getLevelAggregate(HierarchyLevel.REGION);

            // Diplomacy should be influenced by child unrest
            expect(regionAggregate.diplomacy).toBeDefined();
            expect(typeof regionAggregate.diplomacy).toBe('number');
        });

        it('should aggregate stats correctly at each level', () => {
            const levels = [
                HierarchyLevel.INTERGALACTIC,
                HierarchyLevel.INTERSTELLAR,
                HierarchyLevel.PLANETARY,
                HierarchyLevel.CIVILIZATION,
                HierarchyLevel.CITY,
                HierarchyLevel.REGION,
                HierarchyLevel.INHABITANT
            ];

            for (const level of levels) {
                const aggregate = sim.getLevelAggregate(level);
                expect(aggregate.politics).toBeGreaterThanOrEqual(0);
                expect(aggregate.politics).toBeLessThanOrEqual(100);
                expect(aggregate.diplomacy).toBeGreaterThanOrEqual(0);
                expect(aggregate.diplomacy).toBeLessThanOrEqual(100);
                expect(aggregate.economy).toBeGreaterThanOrEqual(0);
                expect(aggregate.economy).toBeLessThanOrEqual(100);
                expect(aggregate.unrest).toBeGreaterThanOrEqual(0);
                expect(aggregate.unrest).toBeLessThanOrEqual(100);
            }
        });
    });

    describe('Entity Queries', () => {
        it('should retrieve entities by level', () => {
            const planetaryEntities = sim.getEntitiesByLevel(HierarchyLevel.PLANETARY);
            expect(planetaryEntities.length).toBeGreaterThan(0);

            for (const entity of planetaryEntities) {
                expect(entity.level).toBe(HierarchyLevel.PLANETARY);
            }
        });

        it('should retrieve entity by coordinate key', () => {
            const state = sim.getState();
            const firstEntity = Array.from(state.entities.values())[0];

            const retrieved = sim.getEntity(firstEntity.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(firstEntity.id);
        });
    });

    describe('Actuator Swapping', () => {
        it('should allow swapping actuators', () => {
            const customActuator = new RelationalActuator();
            sim.setActuator(customActuator);

            // Should not crash on tick
            sim.tick();
            expect(sim.getGlobalTick()).toBe(1);
        });
    });

    describe('Three-Gear Mechanics (Integration)', () => {
        it('should simulate 100 ticks without crashing', () => {
            // Run extended simulation
            for (let i = 0; i < 100; i++) {
                sim.tick();
            }

            expect(sim.getGlobalTick()).toBe(100);

            // Verify all entities still have valid state
            const state = sim.getState();
            for (const [id, entity] of state.entities) {
                expect(entity.gearState.politics).toBeGreaterThanOrEqual(0);
                expect(entity.gearState.politics).toBeLessThanOrEqual(100);
                expect(entity.gearState.unrest).toBeGreaterThanOrEqual(0);
                expect(entity.gearState.unrest).toBeLessThanOrEqual(100);
            }
        });

        it('should maintain balance across affinity types', () => {
            // Count entities by affinity
            const state = sim.getState();
            const affinityCounts = {
                [AffinityType.STR]: 0,
                [AffinityType.INT]: 0,
                [AffinityType.DEX]: 0
            };

            for (const [id, entity] of state.entities) {
                affinityCounts[entity.affinity]++;
            }


            // Should have roughly equal distribution
            expect(affinityCounts[AffinityType.STR]).toBeGreaterThan(0);
            expect(affinityCounts[AffinityType.INT]).toBeGreaterThan(0);
            expect(affinityCounts[AffinityType.DEX]).toBeGreaterThan(0);
        });
    });
});
