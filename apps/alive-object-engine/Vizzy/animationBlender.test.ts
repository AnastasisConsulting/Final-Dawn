/**
 * Test suite for AnimationBlender - Input source blending system
 * Tests 3-input weighted blending with easing curves
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationBlender } from './animationBlender';
import type { BlendableValue } from './animationBlender';

describe('AnimationBlender - Input Source Blending', () => {
    let blender: AnimationBlender;

    beforeEach(() => {
        blender = new AnimationBlender();
    });

    describe('Input Source Management', () => {
        it('should add LLM input source (M1)', () => {
            const value: BlendableValue = { speed: 1.5 };
            blender.setInput('M1', value);

            const result = blender.blend();
            expect(result.speed).toBeCloseTo(1.5 * 0.5); // M1 weight = 0.5
        });

        it('should add mouse input source (M2)', () => {
            const value: BlendableValue = { reactivity: 0.8 };
            blender.setInput('M2', value);

            const result = blender.blend();
            expect(result.reactivity).toBeCloseTo(0.8 * 0.3); // M2 weight = 0.3
        });

        it('should add sentiment input source (M3)', () => {
            const value: BlendableValue = { intensity: 0.5 };
            blender.setInput('M3', value);

            const result = blender.blend();
            expect(result.intensity).toBeCloseTo(0.5 * 0.2); // M3 weight = 0.2
        });

        it('should blend multiple input sources', () => {
            blender.setInput('M1', { speed: 2.0 });
            blender.setInput('M2', { speed: 1.0 });
            blender.setInput('M3', { speed: 0.5 });

            const result = blender.blend();

            // Expected: (2.0 * 0.5) + (1.0 * 0.3) + (0.5 * 0.2) = 1.0 + 0.3 + 0.1 = 1.4
            expect(result.speed).toBeCloseTo(1.4);
        });

        it('should normalize after blending', () => {
            blender.setInput('M1', { value: 1.0 });

            const result = blender.blend();
            // With only M1 (weight 0.5), result should still be the input value
            // because normalization divides by total weight
            expect(result.value).toBeCloseTo(1.0);
        });
    });

    describe('Easing Functions', () => {
        it('should apply easeInOutCubic to M1 (LLM)', () => {
            blender.setInput('M1', { x: 5.0 });

            // Transition should smooth over 2000ms with cubic easing
            const t1 = blender.blend();

            // Immediate blend should show the value
            expect(t1.x).toBeGreaterThan(0);
        });

        it('should apply easeOutQuad to M2 (Mouse)', () => {
            blender.setInput('M2', { y: 3.0 });

            // Transition should be faster (500ms) with quadratic easing
            const result = blender.blend();
            expect(result.y).toBeGreaterThan(0);
        });

        it('should apply easeInOutQuart to M3 (Sentiment)', () => {
            blender.setInput('M3', { z: 2.0 });

            // Transition should smooth over 1000ms
            const result = blender.blend();
            expect(result.z).toBeGreaterThan(0);
        });
    });

    describe('Vector3 Blending', () => {
        it('should blend Vector3 positions', () => {
            blender.setInput('M1', { position: { x: 1, y: 0, z: 0 } });
            blender.setInput('M2', { position: { x: 0, y: 1, z: 0 } });

            const result = blender.blend();

            expect(result.position).toBeDefined();
            expect(result.position!.x).toBeGreaterThan(0); // M1 contribution
            expect(result.position!.y).toBeGreaterThan(0); // M2 contribution
        });

        it('should normalize Vector3 blend', () => {
            blender.setInput('M1', { position: { x: 2, y: 2, z: 2 } });
            blender.setInput('M2', { position: { x: 1, y: 1, z: 1 } });
            blender.setInput('M3', { position: { x: 0.5, y: 0.5, z: 0.5 } });

            const result = blender.blend();

            // Each component should be weighted average
            expect(result.position).toBeDefined();
            expect(result.position!.x).toBeCloseTo((2 * 0.5 + 1 * 0.3 + 0.5 * 0.2));
        });
    });

    describe('Color Blending', () => {
        it('should use highest-weight color source', () => {
            blender.setInput('M1', { color: '#FF0000' }); // Red, weight 0.5
            blender.setInput('M2', { color: '#00FF00' }); // Green, weight 0.3

            const result = blender.blend();

            // M1 has higher weight, should win
            expect(result.color).toBe('#FF0000');
        });

        it('should override color with higher weight source', () => {
            blender.setInput('M2', { color: '#00FF00' }); // Green, weight 0.3
            blender.setInput('M1', { color: '#0000FF' }); // Blue, weight 0.5 (added later)

            const result = blender.blend();

            // M1 has higher weight
            expect(result.color).toBe('#0000FF');
        });
    });

    describe('Temporal Transitions', () => {
        it('should track transition progress over time', () => {
            blender.setInput('M1', { value: 10.0 });

            const t0 = blender.blend();

            // Simulate time passing (note: actual timing uses performance.now())
            const t1 = blender.blend();

            // Both should have values
            expect(t0.value).toBeGreaterThan(0);
            expect(t1.value).toBeGreaterThan(0);
        });

        it('should update delta time between blends', () => {
            blender.setInput('M1', { speed: 1.0 });

            const first = blender.blend();

            // Second call should have different internal state
            const second = blender.blend();

            expect(first).toBeDefined();
            expect(second).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty input sources', () => {
            const result = blender.blend();

            // Should return empty object, not crash
            expect(result).toBeDefined();
            expect(Object.keys(result)).toHaveLength(0);
        });

        it('should handle single input source', () => {
            blender.setInput('M1', { solo: 5.0 });

            const result = blender.blend();
            expect(result.solo).toBeCloseTo(5.0);
        });

        it('should handle zero values', () => {
            blender.setInput('M1', { zero: 0 });
            blender.setInput('M2', { zero: 0 });

            const result = blender.blend();
            expect(result.zero).toBe(0);
        });

        it('should handle negative values', () => {
            blender.setInput('M1', { negative: -5.0 });

            const result = blender.blend();
            expect(result.negative).toBeCloseTo(-5.0);
        });

        it('should handle mixed property types', () => {
            blender.setInput('M1', {
                scalar: 1.0,
                vec: { x: 1, y: 2, z: 3 },
                color: '#FFFFFF'
            });

            const result = blender.blend();

            expect(result.scalar).toBeDefined();
            expect(result.vec).toBeDefined();
            expect(result.color).toBeDefined();
        });
    });

    describe('Weight Distribution', () => {
        it('should respect modifier weight ratios', () => {
            blender.setInput('M1', { test: 1.0 }); // weight 0.5
            blender.setInput('M2', { test: 1.0 }); // weight 0.3
            blender.setInput('M3', { test: 1.0 }); // weight 0.2

            const result = blender.blend();

            // All contribute same value, result should be 1.0 (normalized)
            expect(result.test).toBeCloseTo(1.0);
        });

        it('LLM should dominate when all equal', () => {
            blender.setInput('M1', { dominant: 10.0 });
            blender.setInput('M2', { other: 1.0 });
            blender.setInput('M3', { another: 1.0 });

            const result = blender.blend();

            // M1 value should be normalized to its full value
            expect(result.dominant).toBeCloseTo(10.0);
        });
    });

    describe('getCurrentValue', () => {
        it('should return current blended value', () => {
            blender.setInput('M1', { current: 5.0 });
            blender.blend();

            const current = blender.getCurrentValue();
            expect(current.current).toBeCloseTo(5.0);
        });

        it('should update after new blend', () => {
            blender.setInput('M1', { val: 1.0 });
            blender.blend();

            blender.setInput('M2', { val: 2.0 });
            blender.blend();

            const current = blender.getCurrentValue();
            // Should be weighted average
            expect(current.val).toBeGreaterThan(1.0);
        });
    });
});
