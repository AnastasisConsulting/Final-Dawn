/**
 * Animation Blender - Smoothing Layer for 3-Input Control
 * 
 * Blends LLM mode selection, mouse reactivity, and sentiment triggers
 * with configurable ease curves to create smooth, natural transitions.
 * 
 * Implements the M1/M2/M3 modifier system:
 * - M1: LLM-driven (slow, easeInOutCubic, 2s)
 * - M2: Mouse-reactive (fast, easeOutQuad, 500ms)
 * - M3: Sentiment-triggered (medium, easeInOutQuart, 1s)
 */

import type { Vector3 } from './types';
import { MODIFIER_CONFIGS, type ModifierType } from './modeDefinitions';

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Cubic easing in and out
 */
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Quadratic easing out
 */
function easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

/**
 * Quartic easing in and out
 */
function easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

/**
 * Linear (no easing)
 */
function linear(t: number): number {
    return t;
}

/**
 * Get easing function by type
 */
function getEasingFunction(type: string): (t: number) => number {
    switch (type) {
        case 'easeInOutCubic':
            return easeInOutCubic;
        case 'easeOutQuad':
            return easeOutQuad;
        case 'easeInOutQuart':
            return easeInOutQuart;
        case 'linear':
        default:
            return linear;
    }
}

// ============================================================================
// TYPES
// ============================================================================

export interface BlendableValue {
    position?: Vector3;
    rotation?: number;
    color?: string;
    scale?: number;
    opacity?: number;
    foldAmount?: number;
    pulseSpeed?: number;
    [key: string]: any;
}

export interface InputSource {
    modifier: ModifierType;
    value: BlendableValue;
    timestamp: number;
}

export interface TransitionState {
    from: BlendableValue;
    to: BlendableValue;
    startTime: number;
    duration: number;
    easingType: string;
    progress: number;
    active: boolean;
}

// ============================================================================
// ANIMATION BLENDER CLASS
// ============================================================================

export class AnimationBlender {
    private currentValue: BlendableValue = {};
    private inputSources: Map<ModifierType, InputSource> = new Map();
    private transitions: TransitionState[] = [];
    private lastUpdateTime: number = 0;

    constructor() {
        this.lastUpdateTime = performance.now();
    }

    /**
     * Update an input source with new value
     */
    updateInput(modifier: ModifierType, value: BlendableValue): void {
        const config = MODIFIER_CONFIGS[modifier];
        const now = performance.now();

        // Store the input source
        this.inputSources.set(modifier, {
            modifier,
            value,
            timestamp: now,
        });

        // Create transition for smooth change
        const transition: TransitionState = {
            from: { ...this.currentValue },
            to: value,
            startTime: now,
            duration: config.duration,
            easingType: config.type,
            progress: 0,
            active: true,
        };

        this.transitions.push(transition);
    }

    /**
     * Blend multiple input sources with weighted mixing
     */
    blend(): BlendableValue {
        const now = performance.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;

        // Update all active transitions
        this.updateTransitions(deltaTime);

        // Blend input sources based on weights
        const blended: BlendableValue = {};
        let totalWeight = 0;

        this.inputSources.forEach((source) => {
            const config = MODIFIER_CONFIGS[source.modifier];
            const weight = config.weight;
            totalWeight += weight;

            // Blend each property
            Object.keys(source.value).forEach((key) => {
                if (typeof source.value[key] === 'number') {
                    blended[key] = (blended[key] || 0) + source.value[key] * weight;
                } else if (key === 'position' && source.value[key]) {
                    if (!blended.position) {
                        blended.position = { x: 0, y: 0, z: 0 };
                    }
                    const pos = source.value[key] as Vector3;
                    blended.position.x += pos.x * weight;
                    blended.position.y += pos.y * weight;
                    blended.position.z += pos.z * weight;
                } else if (key === 'color') {
                    // For colors, use highest priority (highest weighted) source
                    if (!blended.color || weight > (blended.colorWeight || 0)) {
                        blended.color = source.value[key];
                        blended.colorWeight = weight;
                    }
                }
            });
        });

        // Normalize blended values by total weight
        if (totalWeight > 0) {
            Object.keys(blended).forEach((key) => {
                if (typeof blended[key] === 'number' && key !== 'colorWeight') {
                    blended[key] /= totalWeight;
                } else if (key === 'position' && blended[key]) {
                    const pos = blended[key] as Vector3;
                    pos.x /= totalWeight;
                    pos.y /= totalWeight;
                    pos.z /= totalWeight;
                }
            });
        }

        // Clean up color weight helper
        delete blended.colorWeight;

        this.currentValue = blended;
        return blended;
    }

    /**
     * Apply easing to a value transition
     */
    applyEaseCurve(
        from: number,
        to: number,
        progress: number,
        curveType: string
    ): number {
        const easingFn = getEasingFunction(curveType);
        const t = easingFn(Math.max(0, Math.min(1, progress)));
        return from + (to - from) * t;
    }

    /**
     * Get current transition state
     */
    getTransitionState(): TransitionState | null {
        const activeTransition = this.transitions.find((t) => t.active);
        return activeTransition || null;
    }

    /**
     * Update all active transitions
     */
    private updateTransitions(deltaTime: number): void {
        const now = performance.now();

        this.transitions = this.transitions.filter((transition) => {
            if (!transition.active) return false;

            const elapsed = now - transition.startTime;
            transition.progress = Math.min(1, elapsed / transition.duration);

            // Apply easing to all numeric properties
            Object.keys(transition.to).forEach((key) => {
                const fromVal = transition.from[key];
                const toVal = transition.to[key];

                if (typeof fromVal === 'number' && typeof toVal === 'number') {
                    this.currentValue[key] = this.applyEaseCurve(
                        fromVal,
                        toVal,
                        transition.progress,
                        transition.easingType
                    );
                } else if (key === 'position' && fromVal && toVal) {
                    const from = fromVal as Vector3;
                    const to = toVal as Vector3;
                    if (!this.currentValue.position) {
                        this.currentValue.position = { x: 0, y: 0, z: 0 };
                    }
                    this.currentValue.position.x = this.applyEaseCurve(
                        from.x,
                        to.x,
                        transition.progress,
                        transition.easingType
                    );
                    this.currentValue.position.y = this.applyEaseCurve(
                        from.y,
                        to.y,
                        transition.progress,
                        transition.easingType
                    );
                    this.currentValue.position.z = this.applyEaseCurve(
                        from.z,
                        to.z,
                        transition.progress,
                        transition.easingType
                    );
                }
            });

            // Deactivate when complete
            if (transition.progress >= 1) {
                transition.active = false;
                return false;
            }

            return true;
        });
    }

    /**
     * Reset all input sources and transitions
     */
    reset(): void {
        this.inputSources.clear();
        this.transitions = [];
        this.currentValue = {};
    }

    /**
     * Get current blended value
     */
    getCurrentValue(): BlendableValue {
        return { ...this.currentValue };
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const animationBlender = new AnimationBlender();
