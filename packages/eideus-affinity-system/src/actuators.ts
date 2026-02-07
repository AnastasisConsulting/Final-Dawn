/**
 * Standard Relational Actuator - Player as Hidden Universe Controller
 * 
 * Injects pressure based on player/companion relationship differentials.
 * Formula: (Player-Lyra - Player-Navbot) - (Navbot-Vizzy - Vizzy-Lyra)
 * 
 * Output: Tensor of shape [3, 3, 7] for injection into:
 * - Bottom: Regional Unrest (MICRO)
 * - Top: Intergalactic Diplomacy (MACRO)
 */

import {
    Actuator,
    AffinityTensor,
    RelationalScores
} from './types.js';
import { createEmptyTensor, TRANSFORMS_COUNT, ELEMENTS_COUNT } from './hierarchy.js';

// === STANDARD RELATIONAL ACTUATOR ===

export class RelationalActuator implements Actuator {
    readonly name = 'RelationalActuator';

    private scores: RelationalScores;

    constructor(initialScores?: Partial<RelationalScores>) {
        this.scores = {
            playerLyra: 50,
            playerNavbot: 50,
            playerVizzy: 50,
            navbotVizzy: 50,
            vizzyLyra: 50,
            lyraNavbot: 50,
            ...initialScores
        };
    }

    /**
     * Update relational scores.
     */
    updateScores(updates: Partial<RelationalScores>): void {
        Object.assign(this.scores, updates);
    }

    /**
     * Get current scores.
     */
    getScores(): RelationalScores {
        return { ...this.scores };
    }

    /**
     * Calculate the tensioner value using the official formula:
     * (Player-Lyra - Player-Navbot) - (Navbot-Vizzy - Vizzy-Lyra)
     */
    calculateTensioner(): number {
        const playerDiff = this.scores.playerLyra - this.scores.playerNavbot;
        const companionDiff = this.scores.navbotVizzy - this.scores.vizzyLyra;
        return (playerDiff - companionDiff) / 100; // Normalize to -1 to +1 range
    }

    /**
     * Calculate pressure delta tensor.
     * Injects at bottom (Regional) and top (Intergalactic) of lattice.
     */
    calculatePressure(): AffinityTensor {
        const tensor = createEmptyTensor();
        const tensioner = this.calculateTensioner();

        // Scale tensioner to pressure value
        const pressure = tensioner * 10; // -10 to +10 range

        // Inject at Transform 0 (MACRO - Intergalactic Diplomacy)
        // Axis 0 = X, all 7 elements
        for (let e = 0; e < ELEMENTS_COUNT; e++) {
            tensor[0][0][e] = pressure * 0.3; // Dampened at top
        }

        // Inject at Transform 2 (MICRO - Regional Unrest)
        // Axis 2 = Z (Region level), all 7 elements
        for (let e = 0; e < ELEMENTS_COUNT; e++) {
            tensor[2][2][e] = pressure; // Full pressure at bottom
        }

        return tensor;
    }
}

// === ACTUATOR FACTORY ===

/**
 * Create a new relational actuator with given scores.
 */
export function createRelationalActuator(
    scores?: Partial<RelationalScores>
): RelationalActuator {
    return new RelationalActuator(scores);
}

// === NULL ACTUATOR (for testing) ===

export class NullActuator implements Actuator {
    readonly name = 'NullActuator';

    calculatePressure(): AffinityTensor {
        return createEmptyTensor();
    }
}
