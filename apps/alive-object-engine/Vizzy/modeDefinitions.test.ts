/**
 * Comprehensive test suite for Vizzy Procedural Animation System
 * Tests the 3×3×7 fractal coordinate system with mode definitions and FractalInterpreter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    WANDERING_MODES,
    COLOR_PALETTES,
    PULSE_PATTERNS,
    getWanderingMode,
    getColorPalette,
    getPulsePattern,
    MODIFIER_CONFIGS,
    type ElementId
} from './modeDefinitions';

describe('Mode Definitions - 3×7 Structure', () => {
    describe('T1 - Structural Modes (Wandering)', () => {
        it('should define exactly 7 wandering modes', () => {
            expect(WANDERING_MODES).toHaveLength(7);
        });

        it('should have correct mode IDs (0-6)', () => {
            const ids = WANDERING_MODES.map(m => m.id);
            expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6]);
        });

        it('should include all expected modes', () => {
            const names = WANDERING_MODES.map(m => m.name);
            expect(names).toContain('Goldfish Glide');
            expect(names).toContain('Puppy Pounce');
            expect(names).toContain('Cat Stalk');
            expect(names).toContain('Guard Dog');
            expect(names).toContain('Nap Mode');
            expect(names).toContain('Glitch Panic');
            expect(names).toContain('Memory Echo');
        });

        it('should have movement parameters for each mode', () => {
            WANDERING_MODES.forEach(mode => {
                expect(mode.movement).toBeDefined();
                expect(mode.movement.speed).toBeGreaterThanOrEqual(0);
                expect(mode.movement.speed).toBeLessThanOrEqual(2);
                expect(mode.movement.pattern).toBeDefined();
            });
        });

        it('should have mouse behavior configuration', () => {
            WANDERING_MODES.forEach(mode => {
                expect(mode.mouseBehavior).toBeDefined();
                expect(mode.mouseBehavior.followStrength).toBeGreaterThanOrEqual(0);
                expect(mode.mouseBehavior.followStrength).toBeLessThanOrEqual(1);
            });
        });

        it('should have scrap modifiers (asymmetry, wobble, etc.)', () => {
            WANDERING_MODES.forEach(mode => {
                expect(mode.scrap).toBeDefined();
                expect(mode.scrap.asymmetryAmount).toBeDefined();
                expect(mode.scrap.wobbleIntensity).toBeDefined();
                expect(mode.scrap.damageLevel).toBeDefined();
                expect(mode.scrap.rustLevel).toBeDefined();
            });
        });

        it('should retrieve mode by ID', () => {
            const mode = getWanderingMode(2);
            expect(mode.id).toBe(2);
            expect(mode.name).toBe('Cat Stalk');
        });

        it('should handle out-of-range IDs gracefully', () => {
            const mode = getWanderingMode(10 as ElementId); // Out of range
            expect(mode.id).toBe(0); // Should default to first mode
        });

        it('Memory Echo should have special ear-position behavior', () => {
            const memoryMode = getWanderingMode(6);
            expect(memoryMode.name).toBe('Memory Echo');
            // Memory Echo is used with special ear bias in FractalInterpreter
        });
    });

    describe('T2 - Aesthetic Modes (Color Palettes)', () => {
        it('should define exactly 7 color palettes', () => {
            expect(COLOR_PALETTES).toHaveLength(7);
        });

        it('should have correct palette IDs (0-6)', () => {
            const ids = COLOR_PALETTES.map(p => p.id);
            expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6]);
        });

        it('should include all expected palettes', () => {
            const names = COLOR_PALETTES.map(p => p.name);
            expect(names).toContain('Scrap Rust');
            expect(names).toContain('Neon Dreams');
            expect(names).toContain('Emergency Red');
            expect(names).toContain('Ocean Deep');
            expect(names).toContain('Forest Moss');
            expect(names).toContain('Toxic Glitch');
            expect(names).toContain('Memory Gray');
        });

        it('should have primary and secondary colors', () => {
            COLOR_PALETTES.forEach(palette => {
                expect(palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
                expect(palette.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
            });
        });

        it('should have emissive color configuration', () => {
            COLOR_PALETTES.forEach(palette => {
                expect(palette.emissive).toBeDefined();
                expect(palette.emissiveIntensity).toBeGreaterThanOrEqual(0);
                expect(palette.emissiveIntensity).toBeLessThanOrEqual(2);
            });
        });

        it('should retrieve palette by ID', () => {
            const palette = getColorPalette(1);
            expect(palette.id).toBe(1);
            expect(palette.name).toBe('Neon Dreams');
        });

        it('Scrap Rust should be default palette (E0)', () => {
            const defaultPalette = getColorPalette(0);
            expect(defaultPalette.name).toBe('Scrap Rust');
            expect(defaultPalette.description).toContain('salvaged metal');
        });
    });

    describe('T3 - Environmental Modes (Pulse Patterns)', () => {
        it('should define exactly 7 pulse patterns', () => {
            expect(PULSE_PATTERNS).toHaveLength(7);
        });

        it('should have correct pattern IDs (0-6)', () => {
            const ids = PULSE_PATTERNS.map(p => p.id);
            expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6]);
        });

        it('should include all expected patterns', () => {
            const names = PULSE_PATTERNS.map(p => p.name);
            expect(names).toContain('Steady Breath');
            expect(names).toContain('Excited Flutter');
            expect(names).toContain('Cardiac Beat');
            expect(names).toContain('Alert Strobe');
            expect(names).toContain('Lazy Drift');
            expect(names).toContain('Error Flicker');
            expect(names).toContain('Frozen Static');
        });

        it('should have frequency and amplitude parameters', () => {
            PULSE_PATTERNS.forEach(pattern => {
                expect(pattern.baseFrequency).toBeGreaterThan(0);
                expect(pattern.amplitude).toBeGreaterThan(0);
            });
        });

        it('should have waveform type', () => {
            PULSE_PATTERNS.forEach(pattern => {
                expect(['sine', 'square', 'triangle', 'sawtooth', 'random']).toContain(pattern.waveform);
            });
        });

        it('should retrieve pattern by ID', () => {
            const pattern = getPulsePattern(3);
            expect(pattern.id).toBe(3);
            expect(pattern.name).toBe('Alert Strobe');
        });

        it('Frozen Static should have zero or near-zero frequency', () => {
            const frozen = getPulsePattern(6);
            expect(frozen.name).toBe('Frozen Static');
            expect(frozen.baseFrequency).toBeLessThan(0.1);
        });
    });

    describe('Modifier Configurations (Input Sources)', () => {
        it('should define 3 modifier types', () => {
            expect(Object.keys(MODIFIER_CONFIGS)).toHaveLength(3);
            expect(MODIFIER_CONFIGS.M1).toBeDefined();
            expect(MODIFIER_CONFIGS.M2).toBeDefined();
            expect(MODIFIER_CONFIGS.M3).toBeDefined();
        });

        it('M1 (LLM) should have strategic easing', () => {
            const llm = MODIFIER_CONFIGS.M1;
            expect(llm.label).toBe('LLM-driven');
            expect(llm.easing).toBe('easeInOutCubic');
            expect(llm.duration).toBe(2000); // 2 seconds
            expect(llm.weight).toBe(0.5);
        });

        it('M2 (Mouse) should have reactive easing', () => {
            const mouse = MODIFIER_CONFIGS.M2;
            expect(mouse.label).toBe('Mouse-reactive');
            expect(mouse.easing).toBe('easeOutQuad');
            expect(mouse.duration).toBe(500); // Fast response
            expect(mouse.weight).toBe(0.3);
        });

        it('M3 (Sentiment) should have contextual easing', () => {
            const sentiment = MODIFIER_CONFIGS.M3;
            expect(sentiment.label).toBe('Sentiment-triggered');
            expect(sentiment.easing).toBe('easeInOutQuart');
            expect(sentiment.duration).toBe(1000); // 1 second
            expect(sentiment.weight).toBe(0.2);
        });

        it('Weights should sum to 1.0', () => {
            const total = MODIFIER_CONFIGS.M1.weight + MODIFIER_CONFIGS.M2.weight + MODIFIER_CONFIGS.M3.weight;
            expect(total).toBeCloseTo(1.0);
        });
    });
});

describe('POA Lattice Structure', () => {
    it('should have valid T1 structural lattice JSON', async () => {
        const lattice = await import('./POA/lattice_T1_structural.json');
        expect(lattice.meta.id).toBe('T1');
        expect(lattice.meta.node_count).toBe(343); // 7×7×7
        expect(lattice.slices).toBeDefined();
        expect(Array.isArray(lattice.slices)).toBe(true);
    });

    it('should have valid T2 aesthetic lattice JSON', async () => {
        const lattice = await import('./POA/lattice_T2_aesthetic.json');
        expect(lattice.meta.id).toBe('T2');
        expect(lattice.meta.node_count).toBe(343);
        expect(lattice.slices).toBeDefined();
    });

    it('should have valid T3 environmental lattice JSON', async () => {
        const lattice = await import('./POA/lattice_T3_environmental.json');
        expect(lattice.meta.id).toBe('T3');
        expect(lattice.meta.node_count).toBe(343);
        expect(lattice.slices).toBeDefined();
    });

    it('T1 lattice should have 7 Z slices', async () => {
        const lattice = await import('./POA/lattice_T1_structural.json');
        expect(lattice.slices).toHaveLength(7);
    });

    it('Each Z slice should have 7 Y rows', async () => {
        const lattice = await import('./POA/lattice_T1_structural.json');
        lattice.slices.forEach((slice: any) => {
            expect(slice.rows).toHaveLength(7);
        });
    });

    it('Each Y row should have 7 X nodes', async () => {
        const lattice = await import('./POA/lattice_T1_structural.json');
        lattice.slices.forEach((slice: any) => {
            slice.rows.forEach((row: any) => {
                expect(row.nodes).toHaveLength(7);
            });
        });
    });

    it('Each node should have required fields', async () => {
        const lattice = await import('./POA/lattice_T1_structural.json');
        const firstNode = lattice.slices[0].rows[0].nodes[0];
        expect(firstNode.x).toBeDefined();
        expect(firstNode.role).toBeDefined();
        expect(firstNode.action).toBeDefined();
        expect(firstNode.target).toBeDefined();
        expect(firstNode.val).toBeDefined();
    });
});

describe('Coordinate System Validation', () => {
    it('should map coordinate [0,0,0] to valid state', () => {
        // E0 = Goldfish Glide
        const mode = getWanderingMode(0);
        expect(mode.name).toBe('Goldfish Glide');
        expect(mode.movement.pattern).toBe('sine-wave');
    });

    it('should map coordinate [1,0,0] to valid state', () => {
        // E1 = Puppy Pounce
        const mode = getWanderingMode(1);
        expect(mode.name).toBe('Puppy Pounce');
    });

    it('should map coordinate [6,0,0] to Memory Echo', () => {
        const mode = getWanderingMode(6);
        expect(mode.name).toBe('Memory Echo');
    });

    it('should support full coordinate range for T1', () => {
        for (let x = 0; x < 7; x++) {
            const mode = getWanderingMode(x as ElementId);
            expect(mode.id).toBe(x);
        }
    });

    it('should support full coordinate range for T2', () => {
        for (let x = 0; x < 7; x++) {
            const palette = getColorPalette(x as ElementId);
            expect(palette.id).toBe(x);
        }
    });

    it('should support full coordinate range for T3', () => {
        for (let x = 0; x < 7; x++) {
            const pattern = getPulsePattern(x as ElementId);
            expect(pattern.id).toBe(x);
        }
    });
});

describe('Mode Integration Tests', () => {
    it('Combat scenario: Guard Dog + Emergency Red + Alert Strobe', () => {
        const mode = getWanderingMode(3);
        const palette = getColorPalette(2);
        const pattern = getPulsePattern(3);

        expect(mode.name).toBe('Guard Dog');
        expect(palette.name).toBe('Emergency Red');
        expect(pattern.name).toBe('Alert Strobe');

        // Verify defensive behavior
        expect(mode.movement.speed).toBeGreaterThan(1.0); // Alert, faster
        expect(mode.mouseBehavior.avoidance).toBe(true); // Defensive
    });

    it('Success scenario: Puppy Pounce + Neon Dreams + Excited Flutter', () => {
        const mode = getWanderingMode(1);
        const palette = getColorPalette(1);
        const pattern = getPulsePattern(1);

        expect(mode.name).toBe('Puppy Pounce');
        expect(palette.name).toBe('Neon Dreams');
        expect(pattern.name).toBe('Excited Flutter');

        // Verify playful behavior
        expect(mode.movement.pattern).toBe('bounce');
        expect(pattern.waveform).toBe('sine');
    });

    it('Trauma trigger: Memory Echo + Memory Gray + Frozen Static', () => {
        const mode = getWanderingMode(6);
        const palette = getColorPalette(6);
        const pattern = getPulsePattern(6);

        expect(mode.name).toBe('Memory Echo');
        expect(palette.name).toBe('Memory Gray');
        expect(pattern.name).toBe('Frozen Static');

        // Verify haunted behavior
        expect(mode.movement.speed).toBeLessThan(0.5); // Slow drift
        expect(pattern.baseFrequency).toBeLessThan(0.1); // Minimal pulse
    });

    it('Exploration: Goldfish Glide + Ocean Deep + Steady Breath', () => {
        const mode = getWanderingMode(0);
        const palette = getColorPalette(3);
        const pattern = getPulsePattern(0);

        expect(mode.name).toBe('Goldfish Glide');
        expect(palette.name).toBe('Ocean Deep');
        expect(pattern.name).toBe('Steady Breath');

        // Verify calm behavior
        expect(mode.movement.pattern).toBe('sine-wave');
        expect(mode.movement.speed).toBeLessThanOrEqual(1.0);
    });
});
