/**
 * Vizzy Mode Definitions - 3×3×7 Fractal Structure
 * 
 * This file defines the complete fractal control system for Vizzy:
 * - 3 Transforms (T1/T2/T3): Structural, Aesthetic, Environmental
 * - 3 Modifiers per transform (M1/M2/M3): LLM, Mouse, Sentiment input sources
 * - 7 Elements per modifier (E0-E6): Specific modes/palettes/patterns
 * 
 * Total: 3 × 3 × 7 = 63 base definitions, mapping to 7×7×7 = 343 coordinate nodes
 */

import type { Vector3 } from './types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TransformType = 'T1' | 'T2' | 'T3';
export type ModifierType = 'M1' | 'M2' | 'M3';
export type ElementId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MovementPattern {
    type: 'bezier' | 'linear' | 'random' | 'orbit' | 'static';
    speed: number; // 0-1
    acceleration: number; // 0-1
    pathCurvature?: number; // 0-1, for bezier
    jitterAmount?: number; // 0-1, for random
}

export interface MouseBehavior {
    tracking: 'follow' | 'flee' | 'orbit' | 'ignore' | 'peek';
    intensity: number; // 0-1, how strongly to react
    deadzone: number; // pixels from Vizzy before reacting
    smoothing: number; // 0-1, lag amount
}

export interface ColorPalette {
    primary: string; // hex color
    secondary: string;
    accent: string;
    emissive: string;
    description: string;
}

export interface PulsePattern {
    type: 'sine' | 'square' | 'triangle' | 'heartbeat' | 'random' | 'static';
    frequency: number; // Hz
    amplitude: number; // 0-1
    offset: number; // phase offset 0-1
}

export interface ScrapModifiers {
    asymmetryAmount: number; // 0-1
    wobbleIntensity: number; // 0-1
    damageOverlay: number; // 0-1
    rustLevel: number; // 0-1
}

export interface EasingConfig {
    type: 'easeInOutCubic' | 'easeOutQuad' | 'easeInOutQuart' | 'linear';
    duration: number; // milliseconds
    weight: number; // 0-1, blend weight
}

// ============================================================================
// T1 - STRUCTURAL: 7 WANDERING MODES
// ============================================================================

export const WANDERING_MODES: Record<ElementId, {
    name: string;
    description: string;
    movement: MovementPattern;
    mouse: MouseBehavior;
    scrap: ScrapModifiers;
}> = {
    0: {
        name: 'Goldfish Glide',
        description: 'Calm exploration, gentle swimming patterns, lazy cursor following',
        movement: {
            type: 'bezier',
            speed: 0.3,
            acceleration: 0.2,
            pathCurvature: 0.7,
        },
        mouse: {
            tracking: 'follow',
            intensity: 0.4,
            deadzone: 100,
            smoothing: 0.8,
        },
        scrap: {
            asymmetryAmount: 0.2,
            wobbleIntensity: 0.1,
            damageOverlay: 0.3,
            rustLevel: 0.5,
        },
    },
    1: {
        name: 'Puppy Pounce',
        description: 'Excited playful jumps, eager cursor tracking, tail-wag rotations',
        movement: {
            type: 'bezier',
            speed: 0.8,
            acceleration: 0.9,
            pathCurvature: 0.3,
        },
        mouse: {
            tracking: 'follow',
            intensity: 0.9,
            deadzone: 50,
            smoothing: 0.3,
        },
        scrap: {
            asymmetryAmount: 0.4,
            wobbleIntensity: 0.6,
            damageOverlay: 0.2,
            rustLevel: 0.3,
        },
    },
    2: {
        name: 'Cat Stalk',
        description: 'Curious cautious approach, hiding behind UI elements, peeking',
        movement: {
            type: 'linear',
            speed: 0.2,
            acceleration: 0.1,
        },
        mouse: {
            tracking: 'peek',
            intensity: 0.6,
            deadzone: 150,
            smoothing: 0.9,
        },
        scrap: {
            asymmetryAmount: 0.3,
            wobbleIntensity: 0.2,
            damageOverlay: 0.4,
            rustLevel: 0.6,
        },
    },
    3: {
        name: 'Guard Dog',
        description: 'Protective defensive positioning, alert stance, threat watching',
        movement: {
            type: 'orbit',
            speed: 0.4,
            acceleration: 0.5,
        },
        mouse: {
            tracking: 'orbit',
            intensity: 0.7,
            deadzone: 200,
            smoothing: 0.5,
        },
        scrap: {
            asymmetryAmount: 0.5,
            wobbleIntensity: 0.3,
            damageOverlay: 0.6,
            rustLevel: 0.7,
        },
    },
    4: {
        name: 'Nap Mode',
        description: 'Low energy drifting, minimal animation, gentle breathing',
        movement: {
            type: 'random',
            speed: 0.1,
            acceleration: 0.05,
            jitterAmount: 0.1,
        },
        mouse: {
            tracking: 'ignore',
            intensity: 0.1,
            deadzone: 500,
            smoothing: 0.95,
        },
        scrap: {
            asymmetryAmount: 0.1,
            wobbleIntensity: 0.05,
            damageOverlay: 0.5,
            rustLevel: 0.8,
        },
    },
    5: {
        name: 'Glitch Panic',
        description: 'Fearful erratic jittering, rapid color shifts, system instability',
        movement: {
            type: 'random',
            speed: 0.9,
            acceleration: 1.0,
            jitterAmount: 0.9,
        },
        mouse: {
            tracking: 'flee',
            intensity: 1.0,
            deadzone: 300,
            smoothing: 0.1,
        },
        scrap: {
            asymmetryAmount: 0.8,
            wobbleIntensity: 0.9,
            damageOverlay: 0.9,
            rustLevel: 0.4,
        },
    },
    6: {
        name: 'Memory Echo',
        description: 'Haunted drift toward ear position, slow nostalgic movement',
        movement: {
            type: 'linear',
            speed: 0.15,
            acceleration: 0.1,
        },
        mouse: {
            tracking: 'ignore',
            intensity: 0.2,
            deadzone: 400,
            smoothing: 0.95,
        },
        scrap: {
            asymmetryAmount: 0.6,
            wobbleIntensity: 0.4,
            damageOverlay: 0.7,
            rustLevel: 0.9,
        },
    },
};

// ============================================================================
// T2 - AESTHETIC: 7 COLOR PALETTES
// ============================================================================

export const COLOR_PALETTES: Record<ElementId, ColorPalette> = {
    0: {
        name: 'Scrap Rust',
        description: 'Oxidized browns, tarnished copper, weathered metal',
        primary: '#8B4513',
        secondary: '#CD853F',
        accent: '#B87333',
        emissive: '#D2691E',
    },
    1: {
        name: 'Neon Dreams',
        description: 'Cyan/magenta cyberpunk, vibrant contrasts',
        primary: '#00FFFF',
        secondary: '#FF00FF',
        accent: '#00FF88',
        emissive: '#FF0088',
    },
    2: {
        name: 'Emergency Red',
        description: 'Warning crimson, alert orange, danger signals',
        primary: '#DC143C',
        secondary: '#FF4500',
        accent: '#FF6347',
        emissive: '#FF0000',
    },
    3: {
        name: 'Ocean Deep',
        description: 'Cool blues, aquamarine, bioluminescent teal',
        primary: '#1E90FF',
        secondary: '#00CED1',
        accent: '#48D1CC',
        emissive: '#00BFFF',
    },
    4: {
        name: 'Forest Moss',
        description: 'Earthy greens, organic browns, natural tones',
        primary: '#228B22',
        secondary: '#556B2F',
        accent: '#6B8E23',
        emissive: '#32CD32',
    },
    5: {
        name: 'Toxic Glitch',
        description: 'Sickly yellow-green, corrupted purple, error states',
        primary: '#ADFF2F',
        secondary: '#9932CC',
        accent: '#FFD700',
        emissive: '#7FFF00',
    },
    6: {
        name: 'Memory Gray',
        description: 'Monochrome, faded sepia, nostalgic desaturation',
        primary: '#808080',
        secondary: '#A9A9A9',
        accent: '#C0C0C0',
        emissive: '#696969',
    },
};

// ============================================================================
// T3 - ENVIRONMENTAL: 7 STROBE/PULSE PATTERNS
// ============================================================================

export const PULSE_PATTERNS: Record<ElementId, {
    name: string;
    description: string;
    pattern: PulsePattern;
}> = {
    0: {
        name: 'Steady Breath',
        description: 'Slow sine wave, 1-2 second period, gentle',
        pattern: {
            type: 'sine',
            frequency: 0.5,
            amplitude: 0.3,
            offset: 0,
        },
    },
    1: {
        name: 'Excited Flutter',
        description: 'Rapid pulse, 0.2-0.5 second period, energetic',
        pattern: {
            type: 'sine',
            frequency: 3.0,
            amplitude: 0.6,
            offset: 0,
        },
    },
    2: {
        name: 'Cardiac Beat',
        description: 'Heartbeat rhythm, double-pulse pattern',
        pattern: {
            type: 'heartbeat',
            frequency: 1.2,
            amplitude: 0.5,
            offset: 0,
        },
    },
    3: {
        name: 'Alert Strobe',
        description: 'Sharp on/off, high contrast, warning flash',
        pattern: {
            type: 'square',
            frequency: 2.0,
            amplitude: 0.9,
            offset: 0,
        },
    },
    4: {
        name: 'Lazy Drift',
        description: 'Very slow, 5-10 second period, minimal change',
        pattern: {
            type: 'sine',
            frequency: 0.15,
            amplitude: 0.2,
            offset: 0,
        },
    },
    5: {
        name: 'Error Flicker',
        description: 'Random jitter, unpredictable timing, system instability',
        pattern: {
            type: 'random',
            frequency: 5.0,
            amplitude: 0.8,
            offset: 0,
        },
    },
    6: {
        name: 'Frozen Static',
        description: 'No animation, locked state, memory freeze',
        pattern: {
            type: 'static',
            frequency: 0,
            amplitude: 0,
            offset: 0,
        },
    },
};

// ============================================================================
// MODIFIER CONFIGURATIONS (Input Source Easing)
// ============================================================================

export const MODIFIER_CONFIGS: Record<ModifierType, EasingConfig> = {
    M1: {
        type: 'easeInOutCubic',
        duration: 2000, // 2 seconds - slow, deliberate LLM changes
        weight: 0.5,
    },
    M2: {
        type: 'easeOutQuad',
        duration: 500, // 500ms - fast, responsive mouse
        weight: 0.3,
    },
    M3: {
        type: 'easeInOutQuart',
        duration: 1000, // 1 second - medium, emotional sentiment
        weight: 0.2,
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get wandering mode by element ID
 */
export function getWanderingMode(elementId: ElementId) {
    return WANDERING_MODES[elementId];
}

/**
 * Get color palette by element ID
 */
export function getColorPalette(elementId: ElementId) {
    return COLOR_PALETTES[elementId];
}

/**
 * Get pulse pattern by element ID
 */
export function getPulsePattern(elementId: ElementId) {
    return PULSE_PATTERNS[elementId];
}

/**
 * Get modifier easing configuration
 */
export function getModifierConfig(modifierType: ModifierType) {
    return MODIFIER_CONFIGS[modifierType];
}

/**
 * Calculate "ear position" - center-left of screen where Vizzy's origin memory lives
 */
export function getEarPosition(screenWidth: number, screenHeight: number): Vector3 {
    return {
        x: -screenWidth * 0.3, // Left of center
        y: screenHeight * 0.1, // Slightly above center
        z: 0,
    };
}
