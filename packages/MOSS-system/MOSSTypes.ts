export type Affinity = "STR" | "INT" | "DEX";

export interface Disposition {
    affinity: Affinity;
    volatility: number; // 0–1 emotional responsiveness
    loyalty: number;    // long-term alignment bias
}

export interface RelationalLink {
    sourceId: string;
    targetId: string;
    score: number; // -100 to +100
}

export interface AccumulatorState {
    recent: number;     // fast memory
    longTerm: number;   // slow memory
}

export interface ActionContext {
    actorAffinity: Affinity;
    targetAffinity: Affinity;
    relationalDelta: number;
    impact: number; // 0–1 systemic weight
}
