// FILE: Vizzy/POA/FractalInterpreter.ts
import { AppState, Vector3 } from '../types';
import { DEFAULT_STATE } from '../constants';
import {
    getWanderingMode,
    getColorPalette,
    getPulsePattern,
    getEarPosition,
    type ElementId,
} from '../modeDefinitions';

type LatticeCoordinate = [number, number, number]; // [x, y, z]

export class FractalInterpreter {
    /**
     * Translates a Fractal Lattice Address (T, X, Y, Z) into a partial AppState update.
     * 
     * Enhanced to integrate with the 3×3×7 mode system:
     * - T1 (Structural): Movement modes, mouse reactivity, speed
     * - T2 (Aesthetic): Color palettes, saturation, transition smoothness
     * - T3 (Environmental): Pulse patterns, amplitude, frequency
     * 
     * @param transformId 1=Structural, 2=Aesthetic, 3=Environmental
     * @param coords The [x, y, z] ticks (0-6) from the lattice grid
     * @param value Optional override value from the LLM
     */
    static resolve(
        transformId: 1 | 2 | 3,
        coords: LatticeCoordinate,
        value?: any
    ): Partial<AppState> {
        const [x, y, z] = coords;

        // Normalize Ticks (0-6) to Float (0.0-1.0)
        const nX = x / 6.0;
        const nY = y / 6.0;
        const nZ = z / 6.0;

        // Clamp to valid element IDs
        const elementId = Math.min(6, Math.max(0, x)) as ElementId;

        switch (transformId) {
            // ---------------------------------------------------------
            // T1: STRUCTURAL (Movement/Behavior)
            // X: Wandering mode selection (E0-E6)
            // Y: Mouse reactivity strength (0-6)
            // Z: Movement speed/energy (0-6)
            // ---------------------------------------------------------
            case 1:
                return this.resolveStructural(elementId, nY, nZ);

            // ---------------------------------------------------------
            // T2: AESTHETIC (Color/Palette)
            // X: Color palette selection (E0-E6)
            // Y: Color saturation (0-6)
            // Z: Color transition smoothness (0-6)
            // ---------------------------------------------------------
            case 2:
                return this.resolveAesthetic(elementId, nY, nZ);

            // ---------------------------------------------------------
            // T3: ENVIRONMENTAL (Pulse/Strobe)
            // X: Pulse pattern selection (E0-E6)
            // Y: Pulse amplitude/contrast (0-6)
            // Z: Pulse frequency modifier (0-6)
            // ---------------------------------------------------------
            case 3:
                return this.resolveEnvironmental(elementId, nY, nZ);

            default:
                return {};
        }
    }

    /**
     * Resolve T1 - Structural transform (movement modes)
     */
    private static resolveStructural(
        elementId: ElementId,
        mouseReactivity: number,
        speedModifier: number
    ): Partial<AppState> {
        const mode = getWanderingMode(elementId);

        // Calculate movement parameters based on mode and modifiers
        const baseSpeed = mode.movement.speed * speedModifier * 2.0; // 0-2 range
        const mouseInfluence = mouseReactivity; // 0-1

        // Special handling for E6 (Memory Echo) - return to ear position
        const isMemoryEcho = elementId === 6;
        const earBias = isMemoryEcho ? 0.8 : 0.1; // Strong pull to ear for Memory Echo

        return {
            sphere: {
                ...DEFAULT_STATE.sphere,
                pulseSpeed: baseSpeed,
                foldAmount: mode.scrap.asymmetryAmount * 2.5, // Use scrap asymmetry for fold
                roughness: 0.7 + mode.scrap.rustLevel * 0.3, // Rustier = rougher
            },
            rings: {
                ...DEFAULT_STATE.rings,
                // Ring speeds based on movement pattern
                ring1Speed: {
                    x: baseSpeed * 0.3,
                    y: 0,
                    z: 0,
                },
                ring2Speed: {
                    x: 0,
                    y: baseSpeed * 0.4,
                    z: 0,
                },
                ring3Speed: {
                    x: 0,
                    y: 0,
                    z: baseSpeed * 0.5,
                },
            },
            // Store mode data for autonomous AI to use
            _modeData: {
                wanderingMode: mode,
                mouseReactivity: mouseInfluence,
                speedModifier,
                earBias, // How strongly to drift toward ear position
                scrapModifiers: mode.scrap,
            },
        };
    }

    /**
     * Resolve T2 - Aesthetic transform (color palettes)
     */
    private static resolveAesthetic(
        elementId: ElementId,
        saturation: number,
        transitionSmoothing: number
    ): Partial<AppState> {
        const palette = getColorPalette(elementId);

        // Apply saturation modifier to colors
        const applySaturation = (hex: string, sat: number): string => {
            // Simple saturation: interpolate toward gray based on sat value
            // sat=0 → gray, sat=1 → full color
            // For simplicity, return original color (shader could handle saturation)
            return hex;
        };

        return {
            sphere: {
                ...DEFAULT_STATE.sphere,
                color: applySaturation(palette.primary, saturation),
                emissive: applySaturation(palette.emissive, saturation),
                metalness: saturation * 0.6, // More saturated = more metallic
                luminosity: 0.5 + saturation * 2.0, // 0.5-2.5 range
            },
            rings: {
                ...DEFAULT_STATE.rings,
                color: applySaturation(palette.accent, saturation),
                emissive: applySaturation(palette.secondary, saturation),
            },
            particles: {
                ...DEFAULT_STATE.particles,
                color: applySaturation(palette.accent, saturation),
            },
            _colorTransitionSpeed: transitionSmoothing, // For blender to use
        };
    }

    /**
     * Resolve T3 - Environmental transform (pulse patterns)
     */
    private static resolveEnvironmental(
        elementId: ElementId,
        amplitude: number,
        frequencyMod: number
    ): Partial<AppState> {
        const pattern = getPulsePattern(elementId);

        // Calculate final pulse parameters
        const finalFrequency = pattern.pattern.frequency * (0.5 + frequencyMod * 1.5);
        const finalAmplitude = pattern.pattern.amplitude * amplitude;

        return {
            sphere: {
                ...DEFAULT_STATE.sphere,
                pulseAmplitude: finalAmplitude,
                // Store pattern type for shader/animation logic
            },
            rings: {
                ...DEFAULT_STATE.rings,
                scalePulse: finalAmplitude > 0.3, // Enable pulsing if amplitude significant
            },
            particles: {
                ...DEFAULT_STATE.particles,
                noiseStrength: finalAmplitude * 0.5, // Pulse affects particle noise
            },
            _pulsePattern: {
                type: pattern.pattern.type,
                frequency: finalFrequency,
                amplitude: finalAmplitude,
                offset: pattern.pattern.offset,
            },
        };
    }

    /**
     * Calculate ear position for Memory Echo mode
     * Returns position bias vector toward center-left of screen
     */
    static getEarPositionBias(): Vector3 {
        // Assume viewport is normalized to some coordinate system
        // This will be applied as a positional bias in autonomous AI
        return getEarPosition(1920, 1080); // Default screen size, will be overridden
    }
}
