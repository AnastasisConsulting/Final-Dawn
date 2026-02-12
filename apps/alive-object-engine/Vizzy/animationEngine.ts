import { AppState, Vector3, ProceduralAnimation } from './types';

export interface OllamaAnimationRequest {
    sentiment: string;
    intensity: number; // 0-1
    context?: {
        isThinking?: boolean;
        isAlert?: boolean;
        emotion?: string;
    };
    procedural?: ProceduralAnimation;
}

export interface AnimationConfig {
    sphere: {
        color: string;
        metalness: number;
        roughness: number;
        pulseSpeed: number;
        foldAmount: number; // 4D fold effect
        foldSpeed: number;
        luminosity: number;
    };
    rings: {
        ring1Speed: Vector3; // Independent rotation
        ring2Speed: Vector3;
        ring3Speed: Vector3;
        color: string;
        emissive: string;
    };
    particlesInner: {
        color: string;
        speed: number;
        count: number;
        noiseStrength: number;
        size: number;
    };
    particlesOuter: {
        color: string;
        speed: number;
        opacity: number;
        radius: number;
    };
}

/**
 * Vizzy Animation Engine
 * Translates Ollama LLM sentiment and context into procedural 3D animation parameters
 * Controls 6 objects: sphere with fold, 3 independent rings, 2 particle systems (inner/outer)
 */
export class VizzyAnimationEngine {
    private baseConfig: AppState;
    private currentAnimation: AnimationConfig | null = null;

    constructor(baseConfig: AppState) {
        this.baseConfig = baseConfig;
    }

    /**
     * Generate animation config from Ollama sentiment analysis
     */
    generateAnimation(request: OllamaAnimationRequest): Partial<AppState> {
        const { sentiment, intensity, context, procedural } = request;

        // Base color palette mapping - rogue implant style
        const colorMap: Record<string, { primary: string, secondary: string }> = {
            happy: { primary: '#bfff00', secondary: '#446600' },     // Acid Green -> Deep Moss
            excited: { primary: '#ffcc00', secondary: '#664400' },   // Vivid Yellow -> Burnt Umber
            alert: { primary: '#ff0000', secondary: '#440000' },     // Pure Red -> Blood Red
            thinking: { primary: '#9900ff', secondary: '#220044' },  // Electric Purple -> Deep Void
            sad: { primary: '#1a1a1a', secondary: '#0a0a0a' },       // Near Black
            calm: { primary: '#00ffff', secondary: '#003344' },      // Cyan -> Deep Teal
            curious: { primary: '#ffaa00', secondary: '#442200' },   // Amber -> Deep Bronze
            neutral: { primary: '#222222', secondary: '#111111' },   // Dark Grey
            idle: { primary: '#333333', secondary: '#181818' },      // Graphite
        };

        const sentimentKey = sentiment.toLowerCase();
        const palette = colorMap[sentimentKey] || colorMap.neutral;

        let primaryColor = procedural?.color || palette.primary;
        let secondaryColor = palette.secondary;

        // Apply procedural color jitter based on intensity for extra expressiveness
        if (intensity > 0.8) {
            // Shift towards white/glow if very intense
            primaryColor = this.adjustColorBrightness(primaryColor, 0.2);
        } else if (intensity < 0.3) {
            // Dim it down if low energy
            primaryColor = this.adjustColorBrightness(primaryColor, -0.3);
            secondaryColor = this.adjustColorBrightness(secondaryColor, -0.5);
        }

        const normalizedIntensity = Math.max(0.1, Math.min(1.0, intensity)); // Capped at 1.0 to prevent over-brightness

        // 1. Sphere Configuration (expressing through fold and luminosity)
        const sphereConfig = {
            ...this.baseConfig.sphere,
            color: primaryColor,
            secondaryColor: secondaryColor,
            metalness: 0.7 + (normalizedIntensity * 0.2),
            roughness: 0.1,
            pulseSpeed: procedural?.pulseSpeed || (context?.isThinking
                ? 0.4
                : context?.isAlert
                    ? 5.0
                    : 0.8 + (normalizedIntensity * 2.5)),
            foldAmount: procedural?.foldAmount !== undefined ? procedural.foldAmount : (context?.isThinking
                ? 1.5
                : context?.isAlert
                    ? 0.01
                    : 0.15 + (normalizedIntensity * 0.7)),
            foldSpeed: procedural?.foldSpeed || (0.15 + (normalizedIntensity * 0.45)),
            luminosity: procedural?.luminosity || (0.6 + (normalizedIntensity * 0.6)), // Ceil at 1.2 instead of 2.8
        };

        const ringMult = procedural?.ringSpeedMultiplier || 1.0;

        // 2. Three Independent Ring Configurations
        // VIZZY PROTECTED: Ring speed and color calculations
        const ringsConfig = {
            ...this.baseConfig.rings,
            // Ring 1: Primary X-axis, reduced Y/Z wobble
            ring1Speed: context?.isAlert
                ? { x: 3.5 * ringMult, y: 0.8 * ringMult, z: 0.4 * ringMult }
                : {
                    x: (0.15 + (normalizedIntensity * 0.7)) * ringMult,
                    y: (0.08 * normalizedIntensity) * ringMult,
                    z: (0.04 * normalizedIntensity) * ringMult
                },
            // Ring 2: Primary Y-axis, reduced X/Z wobble
            ring2Speed: context?.isThinking
                ? { x: 0.05 * ringMult, y: 0.4 * ringMult, z: 0.05 * ringMult }
                : {
                    x: (0.08 * normalizedIntensity) * ringMult,
                    y: (0.3 + (normalizedIntensity * 0.5)) * ringMult,
                    z: (0.08 * normalizedIntensity) * ringMult
                },
            // Ring 3: Primary Z-axis, reduced X/Y wobble
            ring3Speed: {
                x: (0.04 * normalizedIntensity) * ringMult,
                y: (0.08 * normalizedIntensity) * ringMult,
                z: (0.25 + (normalizedIntensity * 0.35)) * ringMult,
            },
            color: primaryColor,
            emissive: this.adjustColorBrightness(primaryColor, 0.4),
        };

        // 3. Particle System (inner + outer via count/radius/size)
        const particlesConfig = {
            ...this.baseConfig.particles,
            color: primaryColor,
            speed: procedural?.particleSpeed || (context?.isAlert
                ? 1.5
                : context?.isThinking
                    ? 0.08
                    : 0.4 + (normalizedIntensity * 1.2)),
            count: Math.floor(800 + (normalizedIntensity * 1200)), // Slightly lowered count
            noiseStrength: 0.8 + (normalizedIntensity * 1.0),
            size: procedural?.particleSize || (context?.isAlert
                ? 0.08
                : 0.03 + (normalizedIntensity * 0.05)),
            opacity: 0.5 + (normalizedIntensity * 0.4),
            radius: 8 + (normalizedIntensity * 12),
        };

        const config: Partial<AppState> = {
            sphere: sphereConfig,
            rings: ringsConfig,
            particles: particlesConfig,
        };

        return config;
    }

    /**
     * Utility: Adjust color brightness
     */
    private adjustColorBrightness(hex: string, factor: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        const adjust = (val: number) =>
            Math.max(0, Math.min(255, Math.floor(val * (1 + factor))));

        const newR = adjust(r).toString(16).padStart(2, '0');
        const newG = adjust(g).toString(16).padStart(2, '0');
        const newB = adjust(b).toString(16).padStart(2, '0');

        return `#${newR}${newG}${newB}`;
    }

    /**
     * Parse Ollama LLM response to extract sentiment and intensity
     * Expects response format: { sentiment: string, intensity: number, context: {...} }
     */
    static parseOllamaResponse(response: any): OllamaAnimationRequest {
        return {
            sentiment: response.sentiment || 'neutral',
            intensity: response.intensity ?? 0.5,
            context: response.context || {},
            procedural: response.procedural
        };
    }

    /**
     * Reset to idle state
     */
    resetToIdle(): Partial<AppState> {
        return {
            sphere: { ...this.baseConfig.sphere },
            rings: { ...this.baseConfig.rings },
            particles: { ...this.baseConfig.particles },
        };
    }
}
