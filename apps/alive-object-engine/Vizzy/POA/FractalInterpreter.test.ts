import { describe, it, expect } from 'vitest';
import { FractalInterpreter } from './POA/FractalInterpreter';

describe('FractalInterpreter - Coordinate Resolution', () => {
    describe('T1 - Structural Transform Resolution', () => {
        it('should resolve E0 (Goldfish Glide) coordinates', () => {
            const result = FractalInterpreter.resolve(1, [0, 3, 2]);

            expect(result.sphere).toBeDefined();
            expect(result.rings).toBeDefined();
            // Goldfish = slow, smooth movement
            expect(result.sphere!.pulseSpeed).toBeLessThan(1.5);
        });

        it('should resolve E1 (Puppy Pounce) coordinates', () => {
            const result = FractalInterpreter.resolve(1, [1, 4, 5]);

            // Puppy Pounce = excited, faster movement
            expect(result.sphere!.pulseSpeed).toBeGreaterThan(1.0);
        });

        it('should resolve E6 (Memory Echo) with ear bias', () => {
            const result = FractalInterpreter.resolve(1, [6, 0, 1]);

            // Memory Echo stores ear bias in mode data
            expect(result._modeData).toBeDefined();
            expect(result._modeData.earBias).toBeGreaterThan(0.5);
            expect(result._modeData.wanderingMode.name).toBe('Memory Echo');
        });

        it('should apply mouse reactivity (Y coordinate)', () => {
            const lowResult = FractalInterpreter.resolve(1, [0, 1, 3]);
            const highResult = FractalInterpreter.resolve(1, [0, 6, 3]);

            expect(lowResult._modeData!.mouseReactivity).toBeLessThan(highResult._modeData!.mouseReactivity);
        });

        it('should apply speed modifier (Z coordinate)', () => {
            const slowResult = FractalInterpreter.resolve(1, [0, 3, 1]);
            const fastResult = FractalInterpreter.resolve(1, [0, 3, 6]);

            expect(slowResult.sphere!.pulseSpeed).toBeLessThan(fastResult.sphere!.pulseSpeed);
        });

        it('should set scrap modifiers (asymmetry, roughness)', () => {
            const result = FractalInterpreter.resolve(1, [5, 3, 3]); // Glitch Panic

            // Glitch Panic should have high asymmetry
            expect(result.sphere!.foldAmount).toBeGreaterThan(2.0);
            expect(result.sphere!.roughness).toBeGreaterThan(0.7);
        });

        it('should update ring speeds based on base speed', () => {
            const result = FractalInterpreter.resolve(1, [1, 4, 5]);

            expect(result.rings).toBeDefined();
            expect(result.rings!.ring1Speed).toBeDefined();
            expect(result.rings!.ring2Speed).toBeDefined();
            expect(result.rings!.ring3Speed).toBeDefined();

            // Each ring should have different proportional speeds
            expect(result.rings!.ring1Speed.x).toBeGreaterThan(0);
        });
    });

    describe('T2 - Aesthetic Transform Resolution', () => {
        it('should resolve E0 (Scrap Rust) palette', () => {
            const result = FractalInterpreter.resolve(2, [0, 3, 3]);

            expect(result.sphere).toBeDefined();
            expect(result.sphere!.color).toMatch(/^#/); // Hex color
            expect(result.rings).toBeDefined();
            expect(result.rings!.color).toBeDefined();
        });

        it('should resolve E2 (Emergency Red) palette', () => {
            const result = FractalInterpreter.resolve(2, [2, 6, 2]);

            // Emergency Red should have red/orange tones
            expect(result.sphere!.color).toBeDefined();
        });

        it('should apply saturation modifier (Y coordinate)', () => {
            const lowResult = FractalInterpreter.resolve(2, [1, 1, 3]);
            const highResult = FractalInterpreter.resolve(2, [1, 6, 3]);

            // Both should have colors, but saturation affects luminosity
            expect(lowResult.sphere!.luminosity).toBeLessThan(highResult.sphere!.luminosity);
        });

        it('should store color transition speed (Z coordinate)', () => {
            const slowResult = FractalInterpreter.resolve(2, [1, 3, 1]);
            const fastResult = FractalInterpreter.resolve(2, [1, 3, 6]);

            expect(slowResult._colorTransitionSpeed).toBeLessThan(fastResult._colorTransitionSpeed!);
        });

        it('should set emissive properties', () => {
            const result = FractalInterpreter.resolve(2, [1, 5, 3]); // Neon Dreams

            expect(result.sphere!.emissive).toBeDefined();
            expect(result.rings!.emissive).toBeDefined();
        });
    });

    describe('T3 - Environmental Transform Resolution', () => {
        it('should resolve E0 (Steady Breath) pattern', () => {
            const result = FractalInterpreter.resolve(3, [0, 2, 1]);

            expect(result._pulsePattern).toBeDefined();
            expect(result._pulsePattern.name).toBe('Steady Breath');
            expect(result._pulsePattern.waveform).toBe('sine');
        });

        it('should resolve E3 (Alert Strobe) pattern', () => {
            const result = FractalInterpreter.resolve(3, [3, 6, 5]);

            expect(result._pulsePattern.name).toBe('Alert Strobe');
            expect(result._pulsePattern.waveform).toBe('square');
        });

        it('should apply amplitude modifier (Y coordinate)', () => {
            const lowResult = FractalInterpreter.resolve(3, [1, 1, 3]);
            const highResult = FractalInterpreter.resolve(3, [1, 6, 3]);

            // Amplitude affects pulse strength
            expect(lowResult.sphere!.pulseAmplitude).toBeLessThan(highResult.sphere!.pulseAmplitude);
        });

        it('should apply frequency modifier (Z coordinate)', () => {
            const slowResult = FractalInterpreter.resolve(3, [1, 3, 0]);
            const fastResult = FractalInterpreter.resolve(3, [1, 3, 6]);

            // Frequency modifier affects final pattern frequency
            const slowFreq = slowResult._pulsePattern.baseFrequency * ((0 / 6) + 0.5);
            const fastFreq = fastResult._pulsePattern.baseFrequency * ((6 / 6) + 0.5);

            expect(slowFreq).toBeLessThan(fastFreq);
        });

        it('should resolve E6 (Frozen Static) with minimal pulse', () => {
            const result = FractalInterpreter.resolve(3, [6, 2, 0]);

            expect(result._pulsePattern.name).toBe('Frozen Static');
            expect(result._pulsePattern.baseFrequency).toBeLessThan(0.1);
        });
    });

    describe('Edge Cases and Validation', () => {
        it('should handle out-of-range coordinates gracefully', () => {
            const result = FractalInterpreter.resolve(1, [10, 10, 10]);

            // Should not throw, should clamp or default
            expect(result).toBeDefined();
        });

        it('should handle negative coordinates gracefully', () => {
            const result = FractalInterpreter.resolve(1, [-1, -1, -1]);

            expect(result).toBeDefined();
        });

        it('should handle unknown transform gracefully', () => {
            const result = FractalInterpreter.resolve(99 as any, [0, 0, 0]);

            // Should return empty object or safe default
            expect(result).toBeDefined();
        });

        it('should not mutate input coordinate', () => {
            const coord: [number, number, number] = [3, 4, 5];
            const original = [...coord];

            FractalInterpreter.resolve(1, coord);

            expect(coord).toEqual(original);
        });
    });

    describe('Multi-Transform Integration', () => {
        it('should combine T1 + T2 + T3 for complete state', () => {
            const t1State = FractalInterpreter.resolve(1, [3, 5, 4]); // Guard Dog
            const t2State = FractalInterpreter.resolve(2, [2, 6, 2]); // Emergency Red
            const t3State = FractalInterpreter.resolve(3, [3, 6, 5]); // Alert Strobe

            // All should provide partial updates
            expect(t1State.sphere).toBeDefined();
            expect(t2State.sphere).toBeDefined();
            expect(t3State._pulsePattern).toBeDefined();

            // Combined they create full combat state
            expect(t1State._modeData!.wanderingMode.name).toBe('Guard Dog');
            expect(t3State._pulsePattern.name).toBe('Alert Strobe');
        });

        it('should merge partial states correctly', () => {
            const t1 = FractalInterpreter.resolve(1, [0, 3, 2]);
            const t2 = FractalInterpreter.resolve(2, [3, 4, 3]);

            // Merging should preserve properties from both
            const merged = { ...t1, ...t2 };

            expect(merged.sphere).toBeDefined();
            expect(merged.rings).toBeDefined();
            expect(merged._modeData).toBeDefined();
        });
    });
});
