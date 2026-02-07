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
        const colorMap: Record<string, string> = {
            happy: '#bfff00',     // Acid Green
            excited: '#ffcc00',   // Vivid Yellow
            alert: '#ff0000',     // pure Red
            thinking: '#9900ff',  // Electric Purple
            sad: '#1a1a1a',       // Near Black
            calm: '#00ffff',      // Cyan
            curious: '#ffaa00',   // Amber
            neutral: '#222222',   // dark grey
            idle: '#333333',      // Graphite
        };

        const baseColor = procedural?.color || colorMap[sentiment.toLowerCase()] || colorMap.neutral;
        const normalizedIntensity = Math.max(0.1, Math.min(1.2, intensity)); // Peak above 1.0 for excitement

        // 1. Sphere Configuration (expressing through fold and luminosity)
        const sphereConfig = {
            ...this.baseConfig.sphere,
            color: baseColor,
            metalness: 0.8 + (normalizedIntensity * 0.2),
            roughness: 0.05,
            pulseSpeed: procedural?.pulseSpeed || (context?.isThinking
                ? 0.5
                : context?.isAlert
                    ? 4.0
                    : 1.0 + (normalizedIntensity * 3.0)),
            foldAmount: procedural?.foldAmount !== undefined ? procedural.foldAmount : (context?.isThinking
                ? 1.2
                : context?.isAlert
                    ? 0.02
                    : 0.2 + (normalizedIntensity * 0.8)),
            foldSpeed: procedural?.foldSpeed || (0.2 + (normalizedIntensity * 0.5)),
            luminosity: procedural?.luminosity || (1.0 + (normalizedIntensity * 1.5)),
        };

        const ringMult = procedural?.ringSpeedMultiplier || 1.0;

        // 2. Three Independent Ring Configurations
        const ringsConfig = {
            ...this.baseConfig.rings,
            // Ring 1: Primary X-axis, reduced Y/Z wobble
            ring1Speed: context?.isAlert
                ? { x: 4.0 * ringMult, y: 1.0 * ringMult, z: 0.5 * ringMult }
                : {
                    x: (0.2 + (normalizedIntensity * 0.8)) * ringMult,
                    y: (0.1 * normalizedIntensity) * ringMult,
                    z: (0.05 * normalizedIntensity) * ringMult
                },
            // Ring 2: Primary Y-axis, reduced X/Z wobble
            ring2Speed: context?.isThinking
                ? { x: 0.1 * ringMult, y: 0.5 * ringMult, z: 0.1 * ringMult }
                : {
                    x: (0.1 * normalizedIntensity) * ringMult,
                    y: (0.4 + (normalizedIntensity * 0.6)) * ringMult,
                    z: (0.1 * normalizedIntensity) * ringMult
                },
            // Ring 3: Primary Z-axis, reduced X/Y wobble
            ring3Speed: {
                x: (0.05 * normalizedIntensity) * ringMult,
                y: (0.1 * normalizedIntensity) * ringMult,
                z: (0.3 + (normalizedIntensity * 0.4)) * ringMult,
            },
            color: baseColor,
            emissive: this.adjustColorBrightness(baseColor, 0.5),
        };

        // 3. Particle System (inner + outer via count/radius/size)
        const particlesConfig = {
            ...this.baseConfig.particles,
            color: baseColor,
            speed: procedural?.particleSpeed || (context?.isAlert
                ? 2.0
                : context?.isThinking
                    ? 0.1
                    : 0.5 + (normalizedIntensity * 1.5)),
            count: Math.floor(1000 + (normalizedIntensity * 1500)),
            noiseStrength: 1.0 + (normalizedIntensity * 1.0),
            size: procedural?.particleSize || (context?.isAlert
                ? 0.1
                : 0.04 + (normalizedIntensity * 0.06)),
            opacity: 0.6 + (normalizedIntensity * 0.4),
            radius: 10 + (normalizedIntensity * 15),
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
