// cubexgui/src/features/game/ai/StrategicEval.ts
// @ts-nocheck
// Porting metrics/value_comparer.py and metrics/strategic_tags.py


// --- Value Comparer (Generates the RRR +/- 1 Scores) ---

/**
 * Classifies a delta into -1, 0, or +1 based on a maximum possible value and a neutral margin ratio.
 * This is used for the RRR evaluation that is based on percentage margin, not fixed thresholds.
 * * @param delta The difference between two team scores (Player - Opponent).
 * @param maxPossible The theoretical maximum raw score possible for this metric.
 * @param marginRatio The percentage of maxPossible considered neutral (e.g., 0.15 for 15%).
 */
export function classifyDelta(delta: number, maxPossible: number, marginRatio: number = 0.15): -1 | 0 | 1 {
    const margin = maxPossible * marginRatio;
    
    if (delta < -margin) {
        return -1; // Opponent Advantage
    } else if (delta > margin) {
        return 1; // Player Advantage
    } else {
        return 0; // Neutral / Strategic
    }
}

/**
 * Derives the R³ triad (Offense, Defense, Strategy) based on the three primary deltas.
 * * @param materialDelta Risk Delta (Material)
 * @param controlDelta Reward Delta (Board Control)
 * @param moraleDelta Relation Delta (Morale)
 * @param maxMaterial Theoretical Max Material 
 * @param maxControl Theoretical Max Moves (e.g., 8^3 = 512, but Python used 256)
 * @param maxMorale Theoretical Max Morale
 * @returns RRR Vector: [Offense, Defense, Strategy]
 */
export function classifyRrr(
    materialDelta: number, 
    controlDelta: number, 
    moraleDelta: number,
    // Max values from Python example:
    maxMaterial: number = 49, 
    maxControl: number = 256, 
    maxMorale: number = 49
): [number, number, number] {
    return [
        classifyDelta(materialDelta, maxMaterial),
        classifyDelta(controlDelta, maxControl),
        classifyDelta(moraleDelta, maxMorale),
    ];
}


// --- Strategic Tags (Symbolic Annotation) ---

type AxisTag = 'offensive' | 'defensive' | 'strategic';

/**
 * Translates the RRR categorical value (-1, 0, +1) into a symbolic strategic tag.
 */
export function tagAxis(value: number): AxisTag {
    if (value > 0) {
        return 'offensive'; // Player Advantage
    } else if (value < 0) {
        return 'defensive'; // Opponent Advantage
    } else {
        return 'strategic'; // Neutral or Highly Contested
    }
}

/**
 * Tags the three strategic axes based on their categorical RRR deltas.
 */
export function tagStrategyVector(
    riskDelta: number, 
    rewardDelta: number, 
    relationDelta: number
): Record<'risk' | 'reward' | 'relation', AxisTag> {
    return {
        risk: tagAxis(riskDelta),
        reward: tagAxis(rewardDelta),
        relation: tagAxis(relationDelta),
    };
}

/**
 * Tags the three strategic axes directly from an RRR vector [Off, Def, Str].
 */
export function tagFromRrrVector(vector: [number, number, number]): Record<'risk' | 'reward' | 'relation', AxisTag> {
    return {
        risk: tagAxis(vector[0]),
        reward: tagAxis(vector[1]),
        relation: tagAxis(vector[2]),
    };
}