import { RelationalLink } from "./types";

/**
 * Player relationship imbalance actuator
 *
 * Difference-of-differences produces systemic pressure.
 * Feeds:
 *  - Regional Public Unrest
 *  - Intergalactic Diplomacy tension
 */
export class RelationalActuator {

    /**
     * Calculates the systemic pressure exerted by a set of relationships.
     * 
     * @param links - Array of active relationship links (NPCs, Factions)
     * @returns A structured pressure report containing Micro (Local) and Macro (Global) values.
     */
    static computePressure(links: RelationalLink[]) {
        if (!links || links.length === 0) {
            return { micro: 0, macro: 0, sentiment: 0 };
        }

        const scores = links.map(l => l.score);
        const count = scores.length;

        // 1. Mean Sentiment (-100 to 100)
        // Represents the average "vibe" of the current context.
        const mean = scores.reduce((sum, val) => sum + val, 0) / count;

        // 2. Variance (Imbalance)
        // High variance means the player is loved by some and hated by others in the same room.
        // This creates "Political Friction".
        const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
        const friction = Math.sqrt(variance); // Standard Deviation as friction

        // 3. microPressure (Immediate Local Tension)
        // Friction amplifies intensity. 
        // If sentiment is negative, friction makes it EXPLOSIVE.
        // If sentiment is positive, friction makes it COMPLEX/INTRIGUING.
        // Formula: |Mean| * (1 + Friction/50)
        // We normalize to 0-100 range roughly.
        let microPressure = (Math.abs(mean) / 100) * (1 + friction / 50);

        // Directional adjustment: Negative sentiment creates "Threat", Positive creates "Opportunity" pressure.
        // For pure "Unrest" calculation, we usually care about the magnitude of disruption.


        // 4. macroPressure (Global Faction Drift)
        // This is the "bleed" into the wider universe.
        // Persistent friction causes long-term instability (Macro).
        // Strong unidirectional sentiment also shifts the macro window (e.g. becoming a known hero or villain).
        const macroPressure = (friction * 0.6) + (Math.abs(mean) * 0.4);

        return {
            micro: parseFloat(microPressure.toFixed(2)),
            macro: parseFloat(macroPressure.toFixed(2)),
            sentiment: parseFloat(mean.toFixed(2)),
            friction: parseFloat(friction.toFixed(2))
        };
    }
}
